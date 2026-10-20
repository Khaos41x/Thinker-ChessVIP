import { engineScoreFromUci, formatEvaluation, normalizeEvaluation } from '../../analysis_lab/src/analysis/evaluation';
import type { EngineScore, EvalBarSample } from '../../analysis_lab/src/analysis/contracts';
import { EvalBarController } from '../../analysis_lab/src/ui/eval-bar';

declare const __THINKER_EVAL_BAR_CSS__: string | undefined;

export type EvalAuthorization = 'analysis' | 'post-game' | null;

export type EvalTransportResult = Readonly<{
  cp?: number | null;
  mate?: number | null;
  depth?: number;
  error?: string;
  requestId?: string | number;
  generation?: number;
  cacheContext?: string;
  engine?: string;
  engineName?: string;
  package?: string;
  build?: string;
  network?: string;
  networkSha256?: string;
  nodes?: number;
  nps?: number;
  time?: number;
  bestmove?: string | null;
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
  shouldDisplay?: () => boolean;
  getRoute?: () => string;
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

export type EvalBarConnectionState = 'idle' | 'blocked' | 'waiting' | 'loading' | 'connected' | 'error';

export type EvalBarDiagnosticSnapshot = Readonly<{
  route: string;
  authorization: EvalAuthorization;
  boardFound: boolean;
  fenAvailable: boolean;
  state: EvalBarConnectionState;
  mounted: boolean;
  geometry: Readonly<{ left: number; top: number; width: number; height: number; placement: string }> | null;
  lastEvaluation: EvalTransportResult | null;
  lastError: string | null;
}>;

const ROOT_ID = 'thinker-eval-v2-rail';
const STYLE_ID = 'thinker-eval-v2-style';
const DEFAULT_CACHE_CAPACITY = 64;
const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_REFRESH_INTERVAL_MS = 5000;
const ROUTE_CHANGE_EVENT = 'thinker-eval-bar-route-change';
const historyHooks = new WeakMap<Window, { references: number; pushState: History['pushState']; replaceState: History['replaceState'] }>();

const ANALYSIS_ROUTE = /^\/analysis(?:\/|$)/;
const GAME_REVIEW_ROUTE = /^\/game\/(?:live\/|daily\/)?[^/]+\/review(?:\/|$)/;
const BOARD_ROUTE = /^\/(?:analysis|game|play|puzzles?|practice|lessons?)(?:\/|$)/;
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
  if (segments[0] === 'play') return segments.length >= 2;
  if (segments[0] !== 'game') return false;
  if (segments.length === 2) return !['live', 'daily'].includes(segments[1]);
  return segments.length === 3 && ['live', 'daily'].includes(segments[1]) && Boolean(segments[2]);
}

export function resolveChessComEvalPresentation(location: Pick<Location, 'pathname'>): boolean {
  return BOARD_ROUTE.test(String(location.pathname || '').toLowerCase());
}

function isVisible(node: Element): boolean {
  if (!(node as HTMLElement).isConnected) return false;
  if (node.getAttribute('aria-hidden') === 'true') return false;
  const style = (node as HTMLElement).ownerDocument?.defaultView?.getComputedStyle?.(node);
  if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) return false;
  const rect = (node as HTMLElement).getBoundingClientRect?.();
  if (!rect || rect.width <= 0 || rect.height <= 0) return false;
  const view = (node as HTMLElement).ownerDocument?.defaultView;
  if (!view || ![rect.top, rect.right, rect.bottom, rect.left].every(Number.isFinite)) return true;
  return rect.bottom > 0 && rect.right > 0 && rect.top < view.innerHeight && rect.left < view.innerWidth;
}

export function resolveChessComEvalAuthorization(
  location: Pick<Location, 'pathname'>,
  document: Pick<Document, 'querySelectorAll'>,
): EvalAuthorization {
  const path = String(location.pathname || '').toLowerCase();
  if (ANALYSIS_ROUTE.test(path) || GAME_REVIEW_ROUTE.test(path)) return 'analysis';
  if (!isGameRoute(path)) return null;
  const board = findChessComBoard(document);
  const runtimeBoard = board as (HTMLElement & Record<string, unknown>) | null;
  const games = [runtimeBoard?.game, (runtimeBoard?.gameManager as { game?: unknown } | undefined)?.game];
  const terminalBoard = Boolean(board && (
    board.getAttribute('data-game-over') === 'true' ||
    board.getAttribute('game-over') === 'true' ||
    games.some(game => {
      if (!game || typeof game !== 'object') return false;
      const candidate = game as { isGameOver?: unknown; status?: unknown };
      try {
        if (typeof candidate.isGameOver === 'function' && candidate.isGameOver()) return true;
      } catch {}
      return /(?:finished|complete|checkmate|resigned|timeout|draw|aborted)/i.test(String(candidate.status || ''));
    })
  ));
  if (!terminalBoard) return null;
  if (Array.from(document.querySelectorAll(TERMINAL_SELECTORS)).some(isVisible)) return 'post-game';
  const reviewNodes = document.querySelectorAll(
    '[data-cy*="review"], [data-test-element*="review"], [class*="game-review"], [class*="post-game"]',
  );
  return Array.from(reviewNodes).some(node => isVisible(node) && POST_GAME_TEXT.test(node.textContent || ''))
    ? 'post-game'
    : null;
}

const BOARD_SELECTORS = [
  'wc-chess-board',
  'chess-board',
  'wc-board',
  '[data-cy="board"]',
  '[data-test-element="board"]',
  '[data-board]',
  '.chess-board',
  '.board',
  '[class*="board-component"]',
].join(',');

export function findChessComBoard(document: Pick<Document, 'querySelectorAll'>): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll(BOARD_SELECTORS)) as HTMLElement[];
  let best: HTMLElement | null = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    if (!candidate?.isConnected) continue;
    const rect = candidate.getBoundingClientRect?.();
    if (!rect) continue;
    const area = Math.max(0, rect.width) * Math.max(0, rect.height);
    const ratio = rect.height > 0 ? rect.width / rect.height : 0;
    const visible = isVisible(candidate) && rect.width >= 200 && rect.height >= 200;
    const squareLike = ratio >= 0.8 && ratio <= 1.25;
    if (!visible || !squareLike) continue;
    const exact = /^(WC-CHESS-BOARD|CHESS-BOARD|WC-BOARD)$/.test(candidate.tagName || '');
    const score = (exact ? 1_000_000 : 0)
      + Math.min(area, 999_999);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function readFenValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const fen = value.trim();
  return isValidChessFen(fen) ? fen : null;
}

export function isValidChessFen(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const fields = value.trim().split(/\s+/);
  if (fields.length !== 6) return false;
  const [placement, side, castling, enPassant, halfmove, fullmove] = fields;
  const ranks = placement.split('/');
  if (ranks.length !== 8) return false;
  let whiteKings = 0;
  let blackKings = 0;
  let whitePieces = 0;
  let blackPieces = 0;
  let whiteKingSquare = -1;
  let blackKingSquare = -1;
  for (const [rankIndex, rank] of ranks.entries()) {
    let files = 0;
    for (const token of rank) {
      if (/^[1-8]$/.test(token)) files += Number(token);
      else if (/^[prnbqkPRNBQK]$/.test(token)) {
        if ((rankIndex === 0 || rankIndex === 7) && /[pP]/.test(token)) return false;
        const square = rankIndex * 8 + files;
        files += 1;
        if (/[A-Z]/.test(token)) whitePieces += 1;
        else blackPieces += 1;
        if (token === 'K') { whiteKings += 1; whiteKingSquare = square; }
        if (token === 'k') { blackKings += 1; blackKingSquare = square; }
      } else return false;
    }
    if (files !== 8) return false;
  }
  const kingsAdjacent = whiteKingSquare >= 0 && blackKingSquare >= 0
    && Math.abs(Math.floor(whiteKingSquare / 8) - Math.floor(blackKingSquare / 8)) <= 1
    && Math.abs((whiteKingSquare % 8) - (blackKingSquare % 8)) <= 1;
  return whiteKings === 1
    && blackKings === 1
    && whitePieces <= 16
    && blackPieces <= 16
    && !kingsAdjacent
    && /^[wb]$/.test(side)
    && (castling === '-' || /^(?:K?Q?k?q?)$/.test(castling))
    && (enPassant === '-' || /^[a-h][36]$/.test(enPassant))
    && /^\d+$/.test(halfmove)
    && /^[1-9]\d*$/.test(fullmove);
}

export function readChessComFen(board: HTMLElement | null): string | null {
  if (!board) return null;
  const values: unknown[] = [];
  const candidate = board as HTMLElement & Record<string, unknown>;
  const pushGame = (game: unknown): void => {
    if (!game || typeof game !== 'object') return;
    const getFen = (game as { getFEN?: unknown }).getFEN;
    if (typeof getFen === 'function') {
      try { values.push(getFen.call(game)); } catch {}
    }
    values.push((game as { fen?: unknown }).fen);
  };
  pushGame(candidate.game);
  pushGame((candidate.gameManager as { game?: unknown } | undefined)?.game);
  values.push(candidate.fen, candidate.position);
  for (const name of ['fen', 'data-fen', 'data-position']) values.push(board.getAttribute(name));
  const nested = board.querySelector?.('[data-fen], [fen]');
  if (nested) values.push(nested.getAttribute('data-fen'), nested.getAttribute('fen'));
  for (const value of values) {
    const direct = readFenValue(value);
    if (direct) return direct;
    if (value && typeof value === 'object') {
      const nestedFen = readFenValue((value as { fen?: unknown }).fen);
      if (nestedFen) return nestedFen;
    }
  }
  return null;
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

function installHistoryHook(window: Window): () => void {
  let hook = historyHooks.get(window);
  if (!hook) {
    const history = window.history;
    const pushState = history.pushState;
    const replaceState = history.replaceState;
    history.pushState = function (...args): void {
      Reflect.apply(pushState, history, args);
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
    };
    history.replaceState = function (...args): void {
      Reflect.apply(replaceState, history, args);
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
    };
    hook = { references: 0, pushState, replaceState };
    historyHooks.set(window, hook);
  }
  hook.references += 1;
  let removed = false;
  return () => {
    if (removed) return;
    removed = true;
    const current = historyHooks.get(window);
    if (!current) return;
    current.references -= 1;
    if (current.references > 0) return;
    window.history.pushState = current.pushState;
    window.history.replaceState = current.replaceState;
    historyHooks.delete(window);
  };
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
  private label: HTMLElement | null = null;
  private board: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private observer: MutationObserver | null = null;
  private interval: number | null = null;
  private reconcileQueued = false;
  private removeHistoryHook: (() => void) | null = null;
  private connectionState: EvalBarConnectionState = 'idle';
  private lastEvaluation: EvalTransportResult | null = null;
  private lastError: string | null = null;
  private geometry: EvalBarDiagnosticSnapshot['geometry'] = null;
  private readonly routeListener = (): void => {
    this.deactivate();
    this.queueReconcile();
  };
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
    this.options.window.addEventListener(ROUTE_CHANGE_EVENT, this.routeListener);
    this.removeHistoryHook = installHistoryHook(this.options.window);
    this.reconcile();
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.reconcile();
  }

  reconcile(): void {
    this.reconcileQueued = false;
    if (!this.enabled || !this.shouldDisplay()) {
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
    if (!this.enabled || !this.shouldDisplay()) {
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
    if (!this.options.authorize()) {
      this.clearPosition('blocked', '—');
      return;
    }
    const fen = this.options.getFen();
    if (!fen) {
      this.clearPosition('waiting', '…');
      return;
    }
    const cacheContext = this.readCacheContext();
    if (!cacheContext) {
      this.abortRequest();
      this.setVisualState('error', '!', 'Evaluation cache context is unavailable');
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
      this.setVisualState(cached ? 'connected' : 'waiting', cached ? undefined : '…');
      this.controller?.beginSearch(this.generation, cached ? this.sample(cached, orientation) : null);
    } else if (orientationChanged) {
      const cached = this.cache.get(this.cacheKey(fen, cacheContext));
      if (cached) this.controller?.publish(this.sample(cached, orientation));
    }
    if (this.now() - this.lastRequestAt < (this.options.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS)) return;
    this.lastRequestAt = this.now();
    this.abortRequest();
    if (this.root?.dataset.state !== 'fresh') this.setVisualState('loading', '…');
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
        onError: error => {
          callbackSettled = true;
          if (requestId === this.activeRequestId && generation === this.generation) {
            this.request = null;
            this.reportError(error);
          }
        },
      }) ?? null;
      if (!callbackSettled && requestId === this.activeRequestId) this.request = request;
    } catch (error) {
      if (requestId === this.activeRequestId) {
        this.request = null;
        this.reportError(error);
      }
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
    this.options.window.removeEventListener(ROUTE_CHANGE_EVENT, this.routeListener);
    this.removeHistoryHook?.();
    this.removeHistoryHook = null;
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
  } & EvalBarDiagnosticSnapshot> {
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
      route: this.safeRead(() => this.options.getRoute?.() ?? '', ''),
      authorization: this.safeRead(() => this.options.authorize(), null),
      boardFound: this.safeRead(() => Boolean(this.options.getBoard()), false),
      fenAvailable: this.safeRead(() => Boolean(this.options.getFen()), false),
      state: this.connectionState,
      geometry: this.geometry,
      lastEvaluation: this.lastEvaluation,
      lastError: this.lastError,
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
    this.request = null;
    let evaluation: CachedEvaluation;
    try {
      evaluation = normalizedResult(result);
    } catch (error) {
      this.reportError(error);
      return;
    }
    this.cache.set(this.cacheKey(fen, cacheContext), evaluation);
    this.lastEvaluation = Object.freeze({ ...result });
    this.setVisualState('connected');
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
    root.dataset.state = 'waiting';
    root.setAttribute('aria-label', 'Position evaluation');
    const fill = this.options.document.createElement('div');
    fill.className = 'thinker-eval-v2-fill';
    const label = this.options.document.createElement('span');
    label.className = 'thinker-eval-v2-score';
    label.textContent = '…';
    root.append(fill, label);
    const host = this.options.document.body || this.options.document.documentElement;
    host.append(root);
    this.board = board;
    this.root = root;
    this.label = label;
    this.installGeometryTracking(board);
    this.syncGeometry();
    this.controller = new EvalBarController({ root, fill, label });
    this.controller.setOrientation(this.options.getOrientation());
    if (this.currentFen) {
      const cached = this.cache.get(this.cacheKey(this.currentFen, this.currentCacheContext));
      root.dataset.state = cached ? 'fresh' : 'waiting';
      this.controller.beginSearch(this.generation, cached ? this.sample(cached, this.options.getOrientation()) : null);
    }
  }

  private unmount(): void {
    this.controller?.destroy();
    this.controller = null;
    this.root?.remove();
    this.root = null;
    this.label = null;
    this.board = null;
    this.geometry = null;
    this.removeGeometryTracking();
  }

  private deactivate(): void {
    const wasActive = Boolean(this.request || this.interval !== null || this.root || this.currentFen);
    this.abortRequest();
    this.stopPolling();
    this.currentFen = '';
    this.currentCacheContext = '';
    this.lastRequestAt = -Infinity;
    this.connectionState = 'idle';
    this.lastEvaluation = null;
    this.lastError = null;
    if (wasActive) this.generation += 1;
    this.unmount();
  }

  private abortRequest(): void {
    try {
      this.request?.abort();
    } catch {}
    this.request = null;
  }

  private shouldDisplay(): boolean {
    try {
      return this.options.shouldDisplay ? this.options.shouldDisplay() : Boolean(this.options.authorize());
    } catch {
      return false;
    }
  }

  private safeRead<T>(read: () => T, fallback: T): T {
    try {
      return read();
    } catch {
      return fallback;
    }
  }

  private clearPosition(state: 'blocked' | 'waiting', label: string): void {
    const hadPosition = Boolean(this.currentFen || this.request);
    const visualChanged = this.connectionState !== state || this.label?.textContent !== label;
    this.abortRequest();
    this.currentFen = '';
    this.currentCacheContext = '';
    this.lastRequestAt = -Infinity;
    this.lastEvaluation = null;
    if (hadPosition) this.generation += 1;
    if (hadPosition || visualChanged) this.controller?.reset(0.5, label);
    this.setVisualState(state, label);
  }

  private setVisualState(state: EvalBarConnectionState, label?: string, error?: unknown): void {
    this.connectionState = state;
    this.lastError = error == null ? null : error instanceof Error ? error.message : String(error);
    if (this.root) this.root.dataset.state = state === 'connected' ? 'fresh' : state;
    if (label !== undefined && this.label && this.label.textContent !== label) this.label.textContent = label;
  }

  private reportError(error: unknown): void {
    const preserveEvaluation = this.root?.dataset.state === 'fresh';
    this.setVisualState('error', preserveEvaluation ? undefined : '!', error);
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
    const style = this.options.window.getComputedStyle(this.root);
    const measuredWidth = Number.parseFloat(style.getPropertyValue('--thinker-eval-v2-width'));
    const measuredGap = Number.parseFloat(style.getPropertyValue('--thinker-eval-v2-gap'));
    const width = Number.isFinite(measuredWidth) && measuredWidth > 0
      ? measuredWidth
      : this.options.window.innerWidth >= 960 ? 30 : 20;
    const gap = Number.isFinite(measuredGap) && measuredGap >= 0 ? measuredGap : 10;
    const leftCandidate = rect.left - width - gap;
    const rightCandidate = rect.right + gap;
    const viewportWidth = this.options.window.innerWidth;
    const left = leftCandidate >= 0
      ? leftCandidate
      : rightCandidate + width <= viewportWidth
        ? rightCandidate
        : Math.max(0, rect.left);
    this.root.hidden = rect.width <= 0 || rect.height <= 0;
    const placement = left === leftCandidate ? 'left' : left === rightCandidate ? 'right' : 'overlay';
    this.root.dataset.placement = placement;
    this.root.style.left = `${left}px`;
    this.root.style.top = `${rect.top}px`;
    this.root.style.height = `${rect.height}px`;
    this.geometry = Object.freeze({ left, top: rect.top, width, height: rect.height, placement });
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

