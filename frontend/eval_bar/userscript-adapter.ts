import { engineScoreFromUci, formatEvaluation, normalizeEvaluation } from '../../analysis_lab/src/analysis/evaluation';
import type { EngineScore, EvalBarSample } from '../../analysis_lab/src/analysis/contracts';
import { EvalBarController } from '../../analysis_lab/src/ui/eval-bar';

declare const __THINKER_EVAL_BAR_CSS__: string | undefined;

export type EvalAuthorization = 'analysis' | 'post-game' | null;

export type EvalTransportResult = Readonly<{
  cp?: number | null;
  mate?: number | null;
  depth?: number;
}>;

export type EvalRequest = Readonly<{
  fen: string;
  generation: number;
  requestId: number;
  cacheContext: string;
  onResult: (result: EvalTransportResult) => void;
  onError: (error: unknown) => void;
}>;

export type EvalRequestHandle = Readonly<{ abort: () => void }>;

export type UserscriptEvalBarOptions = Readonly<{
  window: Window;
  document: Document;
  getFen: () => string | null;
  getBoard: () => HTMLElement | null;
  getOrientation: () => 'white' | 'black';
  getCacheContext: () => string;
  authorize: () => EvalAuthorization;
  requestEvaluation: (request: EvalRequest) => EvalRequestHandle | null | undefined;
  addStyle?: (css: string) => unknown;
  cacheNamespace?: string;
  cacheCapacity?: number;
  pollIntervalMs?: number;
  refreshIntervalMs?: number;
  now?: () => number;
}>;

type CachedEvaluation = Readonly<{
  score: EngineScore;
  fraction: number;
}>;

const ROOT_ID = 'thinker-eval-v2-rail';
const STYLE_ID = 'thinker-eval-v2-style';
const DEFAULT_CACHE_CAPACITY = 64;
const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_REFRESH_INTERVAL_MS = 5000;

const ANALYSIS_ROUTE = /^\/analysis(?:\/|$)/;
const GAME_REVIEW_ROUTE = /^\/game\/(?:live\/|daily\/)?[^/]+\/review(?:\/|$)/;
const POST_GAME_TEXT = /(game review|an[aá]lise da partida|revis[aã]o da partida)/i;
const TERMINAL_SELECTORS = [
  '[data-cy="game-over-modal"]',
  '[data-test-element="game-over-modal"]',
  '[data-cy="game-over-dialog"]',
  '.game-over-modal',
  '[class*="game-over-modal"]',
  '[class*="modal-game-over"]',
].join(',');

function isGameRoute(path: string): boolean {
  const segments = path.split('/').filter(Boolean);
  if (segments[0] !== 'game') return false;
  if (segments.length === 2) return !['live', 'daily'].includes(segments[1]);
  return segments.length === 3 && ['live', 'daily'].includes(segments[1]) && Boolean(segments[2]);
}

function isVisible(node: Element): boolean {
  if (!(node as HTMLElement).isConnected) return false;
  if (node.getAttribute('aria-hidden') === 'true') return false;
  const rect = (node as HTMLElement).getBoundingClientRect?.();
  return Boolean(rect && rect.width > 0 && rect.height > 0);
}

export function resolveChessComEvalAuthorization(
  location: Pick<Location, 'pathname'>,
  document: Pick<Document, 'querySelectorAll'>,
): EvalAuthorization {
  const path = String(location.pathname || '').toLowerCase();
  if (ANALYSIS_ROUTE.test(path) || GAME_REVIEW_ROUTE.test(path)) return 'analysis';
  if (!isGameRoute(path)) return null;
  if (Array.from(document.querySelectorAll(TERMINAL_SELECTORS)).some(isVisible)) return 'post-game';
  const reviewNodes = document.querySelectorAll(
    '[data-cy*="review"], [data-test-element*="review"], [class*="game-review"], [class*="post-game"]',
  );
  return Array.from(reviewNodes).some(node => isVisible(node) && POST_GAME_TEXT.test(node.textContent || ''))
    ? 'post-game'
    : null;
}

export class BoundedLruCache<K, V> {
  private readonly values = new Map<K, V>();

  constructor(readonly capacity: number) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) throw new RangeError('cache capacity must be a positive safe integer');
  }

  get(key: K): V | undefined {
    const value = this.values.get(key);
    if (value === undefined) return undefined;
    this.values.delete(key);
    this.values.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    this.values.delete(key);
    this.values.set(key, value);
    while (this.values.size > this.capacity) this.values.delete(this.values.keys().next().value as K);
  }

  get size(): number {
    return this.values.size;
  }
}

function orientationLabel(score: EngineScore, orientation: 'white' | 'black'): string {
  if (orientation === 'white') return formatEvaluation(score);
  return formatEvaluation(score.kind === 'cp'
    ? { kind: 'cp', cp: -score.cp }
    : { kind: 'mate', mate: -score.mate });
}

function normalizedResult(result: EvalTransportResult): CachedEvaluation {
  const score = engineScoreFromUci({ cp: result.cp, mate: result.mate });
  return Object.freeze({ score, fraction: normalizeEvaluation(score).whiteVisualFraction });
}

function bundledCss(): string {
  if (typeof __THINKER_EVAL_BAR_CSS__ === 'string') return __THINKER_EVAL_BAR_CSS__;
  const runtimeValue = (globalThis as { __THINKER_EVAL_BAR_CSS__?: unknown }).__THINKER_EVAL_BAR_CSS__;
  return typeof runtimeValue === 'string' ? runtimeValue : '';
}

export class UserscriptEvalBar {
  private readonly cache: BoundedLruCache<string, CachedEvaluation>;
  private readonly now: () => number;
  private started = false;
  private enabled = false;
  private generation = 0;
  private requestSequence = 0;
  private activeRequestId = 0;
  private currentFen = '';
  private currentCacheContext = '';
  private currentOrientation: 'white' | 'black' = 'white';
  private lastRequestAt = -Infinity;
  private request: EvalRequestHandle | null = null;
  private controller: EvalBarController | null = null;
  private root: HTMLElement | null = null;
  private board: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private observer: MutationObserver | null = null;
  private interval: number | null = null;
  private reconcileQueued = false;
  private readonly routeListener = (): void => this.queueReconcile();
  private readonly geometryListener = (): void => this.syncGeometry();

  constructor(private readonly options: UserscriptEvalBarOptions) {
    this.cache = new BoundedLruCache(options.cacheCapacity ?? DEFAULT_CACHE_CAPACITY);
    this.now = options.now ?? (() => Date.now());
  }

  start(enabled = true): void {
    this.enabled = enabled;
    if (this.started) {
      this.reconcile();
      return;
    }
    this.started = true;
    this.installStyle();
    this.installObserver();
    this.options.window.addEventListener('popstate', this.routeListener);
    this.options.window.addEventListener('hashchange', this.routeListener);
    this.reconcile();
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.reconcile();
  }

  reconcile(): void {
    this.reconcileQueued = false;
    if (!this.enabled || !this.options.authorize()) {
      this.deactivate();
      return;
    }
    const board = this.options.getBoard();
    if (!board?.isConnected || !board.parentElement) {
      this.deactivate();
      return;
    }
    if (!this.controller || this.board !== board || !this.root?.isConnected) this.mount(board);
    this.ensurePolling();
    this.pollNow();
  }

  pollNow(): void {
    if (!this.enabled || !this.options.authorize()) {
      this.deactivate();
      return;
    }
    const board = this.options.getBoard();
    if (!board?.isConnected || !board.parentElement) {
      this.deactivate();
      return;
    }
    if (!this.controller || this.board !== board || !this.root?.isConnected) this.mount(board);
    this.syncGeometry();
    const fen = this.options.getFen();
    if (!fen) return;
    const cacheContext = this.readCacheContext();
    if (!cacheContext) {
      this.abortRequest();
      if (this.root) this.root.dataset.state = 'stale';
      return;
    }
    const orientation = this.options.getOrientation();
    this.controller?.setOrientation(orientation);
    const orientationChanged = orientation !== this.currentOrientation;
    this.currentOrientation = orientation;
    const changed = fen !== this.currentFen || cacheContext !== this.currentCacheContext;
    if (changed) {
      this.generation += 1;
      this.abortRequest();
      this.currentFen = fen;
      this.currentCacheContext = cacheContext;
      this.lastRequestAt = -Infinity;
      const cached = this.cache.get(this.cacheKey(fen, cacheContext));
      if (this.root) this.root.dataset.state = cached ? 'fresh' : 'stale';
      this.controller?.beginSearch(this.generation, cached ? this.sample(cached, orientation) : null);
    } else if (orientationChanged) {
      const cached = this.cache.get(this.cacheKey(fen, cacheContext));
      if (cached) this.controller?.publish(this.sample(cached, orientation));
    }
    if (this.now() - this.lastRequestAt < (this.options.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS)) return;
    this.lastRequestAt = this.now();
    this.abortRequest();
    const generation = this.generation;
    const requestId = ++this.requestSequence;
    this.activeRequestId = requestId;
    let callbackSettled = false;
    try {
      const request = this.options.requestEvaluation({
        fen,
        generation,
        requestId,
        cacheContext,
        onResult: result => {
          callbackSettled = true;
          this.acceptResult(fen, generation, requestId, cacheContext, result);
        },
        onError: () => {
          callbackSettled = true;
          if (requestId === this.activeRequestId && generation === this.generation) this.request = null;
        },
      }) ?? null;
      if (!callbackSettled && requestId === this.activeRequestId) this.request = request;
    } catch {
      if (requestId === this.activeRequestId) this.request = null;
    }
  }

  destroy(): void {
    if (!this.started) return;
    this.started = false;
    this.enabled = false;
    this.deactivate();
    this.observer?.disconnect();
    this.observer = null;
    this.options.window.removeEventListener('popstate', this.routeListener);
    this.options.window.removeEventListener('hashchange', this.routeListener);
  }

  snapshot(): Readonly<{
    enabled: boolean;
    generation: number;
    currentFen: string;
    cacheSize: number;
    mounted: boolean;
    polling: boolean;
    requestActive: boolean;
    activeRequestId: number;
    cacheContext: string;
  }> {
    return Object.freeze({
      enabled: this.enabled,
      generation: this.generation,
      currentFen: this.currentFen,
      cacheSize: this.cache.size,
      mounted: Boolean(this.root?.isConnected),
      polling: this.interval !== null,
      requestActive: this.request !== null,
      activeRequestId: this.activeRequestId,
      cacheContext: this.currentCacheContext,
    });
  }

  private acceptResult(
    fen: string,
    generation: number,
    requestId: number,
    cacheContext: string,
    result: EvalTransportResult,
  ): void {
    if (
      !this.enabled ||
      !this.options.authorize() ||
      generation !== this.generation ||
      requestId !== this.activeRequestId ||
      fen !== this.currentFen ||
      this.options.getFen() !== fen ||
      cacheContext !== this.currentCacheContext ||
      this.readCacheContext() !== cacheContext
    ) return;
    let evaluation: CachedEvaluation;
    try {
      evaluation = normalizedResult(result);
    } catch {
      return;
    }
    this.request = null;
    this.cache.set(this.cacheKey(fen, cacheContext), evaluation);
    if (this.root) this.root.dataset.state = 'fresh';
    this.controller?.publish(this.sample(evaluation, this.options.getOrientation()));
  }

  private sample(evaluation: CachedEvaluation, orientation: 'white' | 'black'): EvalBarSample {
    return Object.freeze({
      searchId: this.generation,
      fraction: evaluation.fraction,
      label: orientationLabel(evaluation.score, orientation),
    });
  }

  private mount(board: HTMLElement): void {
    this.unmount();
    const root = this.options.document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'thinker-eval-v2-rail thinker-eval-v2-overlay';
    root.dataset.orientation = this.options.getOrientation();
    root.dataset.state = 'stale';
    root.setAttribute('aria-label', 'Position evaluation');
    const fill = this.options.document.createElement('div');
    fill.className = 'thinker-eval-v2-fill';
    const label = this.options.document.createElement('span');
    label.className = 'thinker-eval-v2-score';
    label.textContent = '0.0';
    root.append(fill, label);
    const host = this.options.document.body || this.options.document.documentElement;
    host.append(root);
    this.board = board;
    this.root = root;
    this.installGeometryTracking(board);
    this.syncGeometry();
    this.controller = new EvalBarController({ root, fill, label });
    this.controller.setOrientation(this.options.getOrientation());
    if (this.currentFen) {
      const cached = this.cache.get(this.cacheKey(this.currentFen, this.currentCacheContext));
      root.dataset.state = cached ? 'fresh' : 'stale';
      this.controller.beginSearch(this.generation, cached ? this.sample(cached, this.options.getOrientation()) : null);
    }
  }

  private unmount(): void {
    this.controller?.destroy();
    this.controller = null;
    this.root?.remove();
    this.root = null;
    this.board = null;
    this.removeGeometryTracking();
  }

  private deactivate(): void {
    const wasActive = Boolean(this.request || this.interval !== null || this.root || this.currentFen);
    this.abortRequest();
    this.stopPolling();
    this.currentFen = '';
    this.currentCacheContext = '';
    this.lastRequestAt = -Infinity;
    if (wasActive) this.generation += 1;
    this.unmount();
  }

  private abortRequest(): void {
    try {
      this.request?.abort();
    } catch {}
    this.request = null;
  }

  private ensurePolling(): void {
    if (this.interval !== null) return;
    this.interval = this.options.window.setInterval(
      () => this.pollNow(),
      this.options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
    );
  }

  private stopPolling(): void {
    if (this.interval !== null) this.options.window.clearInterval(this.interval);
    this.interval = null;
  }

  private installObserver(): void {
    if (this.observer || !this.options.document.body) return;
    const Observer = this.options.document.defaultView?.MutationObserver ?? globalThis.MutationObserver;
    if (!Observer) return;
    const observer = new Observer(() => this.queueReconcile());
    observer.observe(this.options.document.body, { childList: true, subtree: true });
    this.observer = observer;
  }

  private queueReconcile(): void {
    if (this.reconcileQueued) return;
    this.reconcileQueued = true;
    queueMicrotask(() => this.reconcile());
  }

  private installStyle(): void {
    if (this.options.document.getElementById(STYLE_ID)) return;
    const css = bundledCss();
    if (!css) return;
    if (this.options.addStyle) {
      const injected = this.options.addStyle(css) as { id?: string; nodeType?: number } | undefined;
      if (injected?.nodeType === 1) injected.id = STYLE_ID;
      else {
        const marker = this.options.document.createElement('meta');
        marker.id = STYLE_ID;
        (this.options.document.head || this.options.document.documentElement).append(marker);
      }
      return;
    }
    const style = this.options.document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    (this.options.document.head || this.options.document.documentElement).append(style);
  }

  private installGeometryTracking(board: HTMLElement): void {
    this.removeGeometryTracking();
    const Observer = this.options.document.defaultView?.ResizeObserver ?? globalThis.ResizeObserver;
    if (Observer) {
      this.resizeObserver = new Observer(() => this.syncGeometry());
      this.resizeObserver.observe(board);
    }
    this.options.window.addEventListener('resize', this.geometryListener);
    this.options.window.addEventListener('scroll', this.geometryListener, true);
  }

  private removeGeometryTracking(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.options.window.removeEventListener('resize', this.geometryListener);
    this.options.window.removeEventListener('scroll', this.geometryListener, true);
  }

  private syncGeometry(): void {
    if (!this.root || !this.board?.isConnected) return;
    const rect = this.board.getBoundingClientRect();
    const width = 28;
    const gap = 6;
    const leftCandidate = rect.left - width - gap;
    const rightCandidate = rect.right + gap;
    const viewportWidth = this.options.window.innerWidth;
    const left = leftCandidate >= 0
      ? leftCandidate
      : rightCandidate + width <= viewportWidth
        ? rightCandidate
        : Math.max(0, rect.left);
    this.root.hidden = rect.width <= 0 || rect.height <= 0;
    this.root.dataset.placement = left === leftCandidate ? 'left' : left === rightCandidate ? 'right' : 'overlay';
    this.root.style.left = `${left}px`;
    this.root.style.top = `${rect.top}px`;
    this.root.style.height = `${rect.height}px`;
  }

  private readCacheContext(): string {
    try {
      return String(this.options.getCacheContext() || '').trim();
    } catch {
      return '';
    }
  }

  private cacheKey(fen: string, cacheContext: string): string {
    return `${this.options.cacheNamespace ?? 'eval-bar-v2'}|${cacheContext}|white|${fen}`;
  }
}

export function createUserscriptEvalBar(options: UserscriptEvalBarOptions): UserscriptEvalBar {
  return new UserscriptEvalBar(options);
}

