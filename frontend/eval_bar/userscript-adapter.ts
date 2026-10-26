import { engineScoreFromUci, normalizeEvaluation } from '../../analysis_lab/src/analysis/evaluation';
import type { Color, EngineScore, EvalBarSample } from '../../analysis_lab/src/analysis/contracts';
import { EvalBarController } from '../../analysis_lab/src/ui/eval-bar';

declare const __THINKER_EVAL_BAR_CSS__: string | undefined;

export type EvalAuthorization = 'analysis' | 'post-game' | 'active-game' | null;

export type EvalTransportResult = Readonly<{
  type?: 'started' | 'info' | 'result' | 'cancelled' | 'error';
  status?: string;
  sequence?: number;
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
  bound?: 'lowerbound' | 'upperbound' | null;
}>;

export type EvalRequest = Readonly<{
  fen: string;
  generation: number;
  requestId: number;
  cacheContext: string;
  onProgress: (result: EvalTransportResult) => void;
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
  reducedMotion?: boolean;
  boardMissingGraceMs?: number;
}>;

type CachedEvaluation = Readonly<{
  score: EngineScore;
  fraction: number;
}>;

export type EvalBarPresentation = Readonly<{
  score: EngineScore;
  fraction: number;
  label: string;
  favoredColor: Color;
  depth: number | null;
}>;

export type EvalBarPresentationDecision = Readonly<{
  selected: EvalBarPresentation | null;
  rejectedDepth: boolean;
  coalesced: boolean;
}>;

export type EvalBarConnectionState = 'idle' | 'blocked' | 'waiting' | 'loading' | 'stale' | 'connected' | 'error';

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
  activeSequence: number;
  requestStartedAt: number | null;
  requestElapsedMs: number | null;
  lastRequestDurationMs: number | null;
  abortCount: number;
  lastAbortReason: string | null;
  renderedFen: string;
  visualStale: boolean;
  visualFraction: number | null;
  targetFraction: number | null;
  lastFenDetectedAt: number | null;
  lastRequestDispatchedAt: number | null;
  lastFirstEvaluationAt: number | null;
  lastDetectionToRequestMs: number | null;
  lastRequestToFirstEvaluationMs: number | null;
  staleResultCount: number;
  mountCount: number;
  boardRetargetCount: number;
  lastFirstRenderedFrameAt: number | null;
  lastEvaluationToFirstFrameMs: number | null;
  presentation: ReturnType<EvalBarPresentationSelector['snapshot']>;
}>;

const ROOT_ID = 'thinker-eval-v2-rail';
const STYLE_ID = 'thinker-eval-v2-style';
const DEFAULT_CACHE_CAPACITY = 64;
const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_REFRESH_INTERVAL_MS = 5000;
const DEFAULT_BOARD_MISSING_GRACE_MS = 1500;
const ROUTE_RECONCILE_FRAMES = 4;
export const EVAL_BAR_PRESENTATION_INTERVAL_MS = 100;
export const EVAL_BAR_MATERIAL_CHANGE_CP = 100;
export const EVAL_BAR_NEUTRAL_BAND_CP = 20;
const ROUTE_CHANGE_EVENT = 'thinker-eval-bar-route-change';
const historyHooks = new WeakMap<Window, { references: number; pushState: History['pushState']; replaceState: History['replaceState'] }>();

const ANALYSIS_ROUTE = /^\/analysis(?:\/|$)/;
const GAME_REVIEW_ROUTE = /^\/game\/(?:live\/|daily\/)?[^/]+\/review(?:\/|$)/;
const BOARD_ROUTE = /^(?:\/(?:analysis|game|play|puzzles?|practice|lessons?)(?:\/|$)|\/live\/game\/[^/]+\/?$)/;

function isGameRoute(path: string): boolean {
  if (/^\/live\/game\/[^/]+\/?$/.test(path)) return true;
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

function boardTerminalEvidence(document: Pick<Document, 'querySelectorAll'>): boolean {
  const board = findChessComBoard(document);
  const runtimeBoard = board as (HTMLElement & Record<string, unknown>) | null;
  const games = [runtimeBoard?.game, (runtimeBoard?.gameManager as { game?: unknown } | undefined)?.game];
  return Boolean(board && (
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
}

export function resolveChessComEvalAuthorization(
  location: Pick<Location, 'pathname'>,
  document: Pick<Document, 'querySelectorAll'>,
): EvalAuthorization {
  const path = String(location.pathname || '').toLowerCase();
  if (ANALYSIS_ROUTE.test(path) || GAME_REVIEW_ROUTE.test(path)) return 'analysis';
  if (isGameRoute(path)) {
    return boardTerminalEvidence(document) ? 'post-game' : 'active-game';
  }
  if (BOARD_ROUTE.test(path)) return 'analysis';
  return null;
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

function normalizedResult(result: EvalTransportResult): CachedEvaluation {
  const score = engineScoreFromUci({ cp: result.cp, mate: result.mate });
  return Object.freeze({ score, fraction: normalizeEvaluation(score).whiteVisualFraction });
}

function scoreValue(score: EngineScore): number {
  return score.kind === 'cp' ? score.cp : score.mate;
}

function favoredColor(score: EngineScore, neutralFallback: Color = 'white'): Color {
  const value = scoreValue(score);
  return value > 0 ? 'white' : value < 0 ? 'black' : neutralFallback;
}

function absoluteEvaluationLabel(score: EngineScore): string {
  if (score.kind === 'mate') return `#${Math.abs(score.mate)}`;
  return (Math.abs(score.cp) / 100).toFixed(1);
}

export function projectEvalBarPresentation(
  evaluation: CachedEvaluation,
  depth: number | null = null,
  neutralFallback: Color = 'white',
): EvalBarPresentation {
  return Object.freeze({
    score: evaluation.score,
    fraction: evaluation.fraction,
    label: absoluteEvaluationLabel(evaluation.score),
    favoredColor: favoredColor(evaluation.score, neutralFallback),
    depth: depth !== null && Number.isFinite(depth) ? depth : null,
  });
}

function isMateTransition(previous: EngineScore, next: EngineScore): boolean {
  return previous.kind === 'mate' || next.kind === 'mate';
}

function isMaterialChange(previous: EngineScore, next: EngineScore): boolean {
  if (previous.kind !== 'cp' || next.kind !== 'cp') return true;
  return Math.abs(next.cp - previous.cp) >= EVAL_BAR_MATERIAL_CHANGE_CP;
}

function isMeaningfulSideChange(previous: EngineScore, next: EngineScore): boolean {
  if (previous.kind !== 'cp' || next.kind !== 'cp') return favoredColor(previous) !== favoredColor(next);
  return Math.sign(previous.cp) !== Math.sign(next.cp)
    && Math.abs(previous.cp) > EVAL_BAR_NEUTRAL_BAND_CP
    && Math.abs(next.cp) > EVAL_BAR_NEUTRAL_BAND_CP;
}

export class EvalBarPresentationSelector {
  private selected: EvalBarPresentation | null = null;
  private pending: EvalBarPresentation | null = null;
  private highestDepth = -Infinity;
  private lastSelectedAt = -Infinity;
  private coalescedCount = 0;
  private selectedCount = 0;

  reset(): void {
    this.selected = null;
    this.pending = null;
    this.highestDepth = -Infinity;
    this.lastSelectedAt = -Infinity;
    this.coalescedCount = 0;
    this.selectedCount = 0;
  }

  beginRefresh(): void {
    this.pending = null;
  }

  consider(candidate: EvalBarPresentation, now: number, terminal = false): EvalBarPresentationDecision {
    const depth = candidate.depth;
    if (!terminal && depth !== null && depth < this.highestDepth) {
      return Object.freeze({ selected: null, rejectedDepth: true, coalesced: false });
    }
    if (depth !== null) this.highestDepth = Math.max(this.highestDepth, depth);
    const immediate = terminal
      || !this.selected
      || isMateTransition(this.selected.score, candidate.score)
      || isMaterialChange(this.selected.score, candidate.score)
      || isMeaningfulSideChange(this.selected.score, candidate.score)
      || now - this.lastSelectedAt >= EVAL_BAR_PRESENTATION_INTERVAL_MS;
    if (immediate) {
      return Object.freeze({ selected: this.commit(candidate, now), rejectedDepth: false, coalesced: false });
    }
    this.pending = candidate;
    this.coalescedCount += 1;
    return Object.freeze({ selected: null, rejectedDepth: false, coalesced: true });
  }

  flush(now: number): EvalBarPresentation | null {
    if (!this.pending) return null;
    return this.commit(this.pending, now);
  }

  snapshot(): Readonly<{
    selected: EvalBarPresentation | null;
    pending: EvalBarPresentation | null;
    highestDepth: number | null;
    lastSelectedAt: number | null;
    coalescedCount: number;
    selectedCount: number;
  }> {
    return Object.freeze({
      selected: this.selected,
      pending: this.pending,
      highestDepth: Number.isFinite(this.highestDepth) ? this.highestDepth : null,
      lastSelectedAt: Number.isFinite(this.lastSelectedAt) ? this.lastSelectedAt : null,
      coalescedCount: this.coalescedCount,
      selectedCount: this.selectedCount,
    });
  }

  private commit(candidate: EvalBarPresentation, now: number): EvalBarPresentation {
    this.selected = candidate;
    this.pending = null;
    this.lastSelectedAt = now;
    this.selectedCount += 1;
    return candidate;
  }
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
  private readonly presentationSelector = new EvalBarPresentationSelector();
  private started = false;
  private enabled = false;
  private generation = 0;
  private requestSequence = 0;
  private activeRequestId = 0;
  private activeSequence = -1;
  private currentFen = '';
  private currentCacheContext = '';
  private lastRequestAt = -Infinity;
  private requestStartedAt: number | null = null;
  private lastRequestDurationMs: number | null = null;
  private abortCount = 0;
  private lastAbortReason: string | null = null;
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
  private boardGeometry: Readonly<{ left: number; top: number; width: number; height: number }> | null = null;
  private hasRenderedEvaluation = false;
  private renderedFen = '';
  private visualStale = false;
  private lastFenDetectedAt: number | null = null;
  private lastRequestDispatchedAt: number | null = null;
  private lastFirstEvaluationAt: number | null = null;
  private lastDetectionToRequestMs: number | null = null;
  private lastRequestToFirstEvaluationMs: number | null = null;
  private firstEvaluationGeneration = -1;
  private staleResultCount = 0;
  private mountCount = 0;
  private boardRetargetCount = 0;
  private pendingRenderedFen = '';
  private pendingRenderedGeneration = -1;
  private lastEvaluationAcceptedAt: number | null = null;
  private lastFirstRenderedFrameAt: number | null = null;
  private lastEvaluationToFirstFrameMs: number | null = null;
  private boardMissingTimer: number | null = null;
  private routeReconcileTimer: number | null = null;
  private routeReconcileFramesRemaining = 0;
  private presentationTimer: number | null = null;
  private readonly routeListener = (): void => {
    this.queueReconcile();
    this.scheduleRouteReconcileBurst();
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
      this.handleBoardUnavailable();
      return;
    }
    this.clearBoardMissingTimer();
    this.ensureBoard(board);
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
      this.handleBoardUnavailable();
      return;
    }
    this.clearBoardMissingTimer();
    this.ensureBoard(board);
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
      this.abortRequest('cache-context-unavailable');
      this.reportError(new Error('Evaluation cache context is unavailable'));
      return;
    }
    const orientation = this.options.getOrientation();
    this.controller?.setOrientation(orientation);
    const changed = fen !== this.currentFen || cacheContext !== this.currentCacheContext;
    if (changed) {
      const detectedAt = this.now();
      this.generation += 1;
      this.abortRequest('position-changed');
      this.currentFen = fen;
      this.currentCacheContext = cacheContext;
      this.lastRequestAt = -Infinity;
      this.activeSequence = -1;
      this.lastFenDetectedAt = detectedAt;
      this.firstEvaluationGeneration = -1;
      this.pendingRenderedFen = '';
      this.pendingRenderedGeneration = -1;
      this.resetPresentation();
      const cached = this.cache.get(this.cacheKey(fen, cacheContext));
      const cachedPresentation = cached
        ? this.presentationSelector.consider(projectEvalBarPresentation(cached), detectedAt, true).selected
        : null;
      this.visualStale = this.hasRenderedEvaluation;
      this.setVisualState(cached ? 'connected' : this.visualStale ? 'stale' : 'waiting',
        cached || this.hasRenderedEvaluation ? undefined : '…');
      this.controller?.beginSearch(this.generation, cachedPresentation ? this.sample(cachedPresentation) : null);
      if (cached) this.markEvaluationAccepted(fen, true);
    }
    if (this.request) return;
    if (this.now() - this.lastRequestAt < (this.options.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS)) return;
    if (this.root?.dataset.state !== 'fresh') {
      this.setVisualState(this.hasRenderedEvaluation ? 'stale' : 'loading', this.hasRenderedEvaluation ? undefined : '…');
    }
    const generation = this.generation;
    this.clearPresentationTimer();
    this.presentationSelector.beginRefresh();
    const requestId = ++this.requestSequence;
    this.activeRequestId = requestId;
    this.activeSequence = -1;
    this.requestStartedAt = this.now();
    this.lastRequestDispatchedAt = this.requestStartedAt;
    this.lastDetectionToRequestMs = this.lastFenDetectedAt === null
      ? null
      : Math.max(0, this.requestStartedAt - this.lastFenDetectedAt);
    let callbackSettled = false;
    try {
      const request = this.options.requestEvaluation({
        fen,
        generation,
        requestId,
        cacheContext,
        onProgress: result => {
          if (callbackSettled) return;
          this.acceptProgress(fen, generation, requestId, cacheContext, result);
        },
        onResult: result => {
          if (callbackSettled) return;
          callbackSettled = true;
          this.acceptResult(fen, generation, requestId, cacheContext, result);
        },
        onError: error => {
          if (callbackSettled) return;
          callbackSettled = true;
          if (requestId === this.activeRequestId && generation === this.generation) {
            this.request = null;
            this.finishRequestTiming();
            this.lastRequestAt = this.now();
            this.clearPresentationTimer();
            this.reportError(error);
          }
        },
      }) ?? null;
      if (!callbackSettled && requestId === this.activeRequestId) {
        this.request = request;
        if (!request) {
          this.finishRequestTiming();
          this.lastRequestAt = this.now();
          this.reportError(new Error('Evaluation transport is unavailable'));
        }
      }
    } catch (error) {
      if (requestId === this.activeRequestId) {
        this.request = null;
        this.finishRequestTiming();
        this.lastRequestAt = this.now();
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
      activeSequence: this.activeSequence,
      requestStartedAt: this.requestStartedAt,
      requestElapsedMs: this.requestStartedAt === null ? null : Math.max(0, this.now() - this.requestStartedAt),
      lastRequestDurationMs: this.lastRequestDurationMs,
      abortCount: this.abortCount,
      lastAbortReason: this.lastAbortReason,
      renderedFen: this.renderedFen,
      visualStale: this.visualStale,
      visualFraction: this.controller?.snapshot().current ?? null,
      targetFraction: this.controller?.snapshot().target ?? null,
      lastFenDetectedAt: this.lastFenDetectedAt,
      lastRequestDispatchedAt: this.lastRequestDispatchedAt,
      lastFirstEvaluationAt: this.lastFirstEvaluationAt,
      lastDetectionToRequestMs: this.lastDetectionToRequestMs,
      lastRequestToFirstEvaluationMs: this.lastRequestToFirstEvaluationMs,
      staleResultCount: this.staleResultCount,
      mountCount: this.mountCount,
      boardRetargetCount: this.boardRetargetCount,
      lastFirstRenderedFrameAt: this.lastFirstRenderedFrameAt,
      lastEvaluationToFirstFrameMs: this.lastEvaluationToFirstFrameMs,
      presentation: this.presentationSelector.snapshot(),
    });
  }

  private acceptResult(
    fen: string,
    generation: number,
    requestId: number,
    cacheContext: string,
    result: EvalTransportResult,
  ): void {
    if (!this.acceptsRequest(fen, generation, requestId, cacheContext)) {
      if (generation === this.generation && requestId === this.activeRequestId) {
        this.request = null;
        this.finishRequestTiming();
        this.lastRequestAt = this.now();
      }
      return;
    }
    const sequence = Number(result.sequence);
    if (this.activeSequence >= 0 && !Number.isFinite(sequence)) {
      this.request = null;
      this.finishRequestTiming();
      this.lastRequestAt = this.now();
      this.reportError(new Error('Evaluation terminal sequence is unavailable'));
      return;
    }
    if (Number.isFinite(sequence) && sequence <= this.activeSequence) {
      this.request = null;
      this.finishRequestTiming();
      this.lastRequestAt = this.now();
      this.reportError(new Error('Evaluation terminal sequence is stale'));
      return;
    }
    if (Number.isFinite(sequence)) this.activeSequence = sequence;
    this.request = null;
    this.finishRequestTiming();
    this.lastRequestAt = this.now();
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
    this.presentEvaluation(fen, evaluation, result, true);
  }

  private acceptProgress(
    fen: string,
    generation: number,
    requestId: number,
    cacheContext: string,
    result: EvalTransportResult,
  ): void {
    if (!this.acceptsRequest(fen, generation, requestId, cacheContext)) return;
    const sequence = Number(result.sequence);
    if (!Number.isFinite(sequence) || sequence <= this.activeSequence) return;
    this.activeSequence = sequence;
    if (result.type === 'started') return;
    if (result.bound) return;
    let evaluation: CachedEvaluation;
    try {
      evaluation = normalizedResult(result);
    } catch (error) {
      this.reportError(error);
      return;
    }
    this.lastEvaluation = Object.freeze({ ...result });
    this.setVisualState('connected');
    this.presentEvaluation(fen, evaluation, result, false);
  }

  private presentEvaluation(
    fen: string,
    evaluation: CachedEvaluation,
    result: EvalTransportResult,
    terminal: boolean,
  ): void {
    const selected = this.presentationSelector.snapshot().selected;
    const presentation = projectEvalBarPresentation(
      evaluation,
      Number.isFinite(result.depth) ? Number(result.depth) : null,
      selected?.favoredColor ?? 'white',
    );
    const decision = this.presentationSelector.consider(presentation, this.now(), terminal);
    if (decision.selected) {
      this.clearPresentationTimer();
      this.publishPresentation(fen, decision.selected);
    } else if (decision.coalesced) {
      this.schedulePresentationFlush(fen, this.generation, this.currentCacheContext);
    }
  }

  private publishPresentation(fen: string, presentation: EvalBarPresentation): void {
    this.markEvaluationAccepted(fen, false);
    this.controller?.publish(this.sample(presentation));
  }

  private schedulePresentationFlush(fen: string, generation: number, cacheContext: string): void {
    if (this.presentationTimer !== null) return;
    const lastSelectedAt = this.presentationSelector.snapshot().lastSelectedAt ?? this.now();
    const delay = Math.max(0, EVAL_BAR_PRESENTATION_INTERVAL_MS - (this.now() - lastSelectedAt));
    this.presentationTimer = this.options.window.setTimeout(() => {
      this.presentationTimer = null;
      if (!this.enabled
        || !this.shouldDisplay()
        || !this.safeRead(() => Boolean(this.options.authorize()), false)
        || generation !== this.generation
        || fen !== this.currentFen
        || this.safeRead(() => this.options.getFen(), null) !== fen
        || cacheContext !== this.currentCacheContext
        || this.readCacheContext() !== cacheContext) return;
      const presentation = this.presentationSelector.flush(this.now());
      if (presentation) this.publishPresentation(fen, presentation);
    }, delay);
  }

  private clearPresentationTimer(): void {
    if (this.presentationTimer !== null) this.options.window.clearTimeout(this.presentationTimer);
    this.presentationTimer = null;
  }

  private resetPresentation(): void {
    this.clearPresentationTimer();
    this.presentationSelector.reset();
  }

  private sample(presentation: EvalBarPresentation): EvalBarSample {
    return Object.freeze({
      searchId: this.generation,
      fraction: presentation.fraction,
      label: presentation.label,
      favoredColor: presentation.favoredColor,
    });
  }

  private mount(board: HTMLElement): void {
    this.unmount();
    const root = this.options.document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'thinker-eval-v2-rail thinker-eval-v2-overlay';
    root.dataset.orientation = this.options.getOrientation();
    root.dataset.favoredColor = 'white';
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
    this.mountCount += 1;
    this.root = root;
    this.label = label;
    this.installGeometryTracking(board);
    this.syncGeometry();
    this.controller = new EvalBarController(
      { root, fill, label },
      {
        reducedMotion: this.options.reducedMotion,
        onFrameCommitted: () => this.commitPendingVisualFrame(),
      },
    );
    this.controller.setOrientation(this.options.getOrientation());
    if (this.currentFen) {
      const cached = this.cache.get(this.cacheKey(this.currentFen, this.currentCacheContext));
      root.dataset.state = cached ? 'fresh' : 'waiting';
      const presentation = cached ? projectEvalBarPresentation(cached) : null;
      this.controller.beginSearch(this.generation, presentation ? this.sample(presentation) : null);
    }
  }

  private ensureBoard(board: HTMLElement): void {
    if (!this.controller || !this.root?.isConnected) {
      this.mount(board);
      return;
    }
    if (this.board === board) return;
    if (!this.isEquivalentBoard(board)) {
      this.mount(board);
      return;
    }
    this.board = board;
    this.boardRetargetCount += 1;
    this.installGeometryTracking(board);
    this.syncGeometry();
  }

  private unmount(): void {
    this.controller?.destroy();
    this.controller = null;
    this.root?.remove();
    this.root = null;
    this.label = null;
    this.board = null;
    this.geometry = null;
    this.boardGeometry = null;
    this.removeGeometryTracking();
  }

  private deactivate(): void {
    const wasActive = Boolean(this.request || this.interval !== null || this.root || this.currentFen);
    this.clearBoardMissingTimer();
    this.cancelRouteReconcileBurst();
    this.abortRequest('deactivated');
    this.stopPolling();
    this.currentFen = '';
    this.currentCacheContext = '';
    this.lastRequestAt = -Infinity;
    this.activeSequence = -1;
    this.connectionState = 'idle';
    this.lastEvaluation = null;
    this.lastError = null;
    this.hasRenderedEvaluation = false;
    this.renderedFen = '';
    this.visualStale = false;
    this.pendingRenderedFen = '';
    this.pendingRenderedGeneration = -1;
    this.resetPresentation();
    if (wasActive) this.generation += 1;
    this.unmount();
  }

  private abortRequest(reason: string): void {
    if (this.request) {
      this.abortCount += 1;
      this.lastAbortReason = reason;
      this.finishRequestTiming();
    }
    try {
      this.request?.abort();
    } catch {}
    this.request = null;
  }

  private finishRequestTiming(): void {
    if (this.requestStartedAt !== null) this.lastRequestDurationMs = Math.max(0, this.now() - this.requestStartedAt);
    this.requestStartedAt = null;
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
    const controllerSnapshot = this.controller?.snapshot();
    const needsNeutralReset = this.hasRenderedEvaluation
      || this.label?.textContent !== label
      || controllerSnapshot?.current !== 0.5
      || controllerSnapshot?.target !== 0.5;
    this.abortRequest(state === 'blocked' ? 'authorization-unavailable' : 'fen-unavailable');
    this.currentFen = '';
    this.currentCacheContext = '';
    this.lastRequestAt = -Infinity;
    this.activeSequence = -1;
    if (hadPosition) this.generation += 1;
    this.pendingRenderedFen = '';
    this.pendingRenderedGeneration = -1;
    this.resetPresentation();
    if (state === 'blocked') {
      this.hasRenderedEvaluation = false;
      this.renderedFen = '';
      this.visualStale = false;
      this.lastEvaluation = null;
      if (needsNeutralReset) this.controller?.reset(0.5, label);
      this.setVisualState(state, label);
      return;
    }
    this.visualStale = this.hasRenderedEvaluation;
    if (hadPosition) this.controller?.beginSearch(this.generation);
    if (!this.hasRenderedEvaluation && needsNeutralReset) this.controller?.reset(0.5, label);
    this.setVisualState(state, this.hasRenderedEvaluation ? undefined : label);
  }

  private setVisualState(state: EvalBarConnectionState, label?: string, error?: unknown): void {
    this.connectionState = state;
    this.lastError = error == null ? null : error instanceof Error ? error.message : String(error);
    if (this.root) this.root.dataset.state = state === 'connected' ? 'fresh' : state;
    if (label !== undefined && this.label && this.label.textContent !== label) this.label.textContent = label;
  }

  private reportError(error: unknown): void {
    this.clearPresentationTimer();
    const preserveEvaluation = this.hasRenderedEvaluation;
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
    const observer = new Observer(records => {
      if (records.some(record => !this.root?.contains(record.target))) this.queueReconcile();
    });
    observer.observe(this.options.document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-fen', 'fen', 'data-position'],
    });
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
    const parent = this.root.offsetParent as HTMLElement | null;
    const positionedParent = parent && (parent !== this.options.document.body
      || this.options.window.getComputedStyle(parent).position !== 'static');
    const parentRect = positionedParent ? parent.getBoundingClientRect() : null;
    const pageLeft = parentRect && parent
      ? left - parentRect.left - parent.clientLeft + parent.scrollLeft
      : left + this.options.window.scrollX;
    const pageTop = parentRect && parent
      ? rect.top - parentRect.top - parent.clientTop + parent.scrollTop
      : rect.top + this.options.window.scrollY;
    const setPosition = (property: 'left' | 'top' | 'height', value: number): void => {
      const next = `${value}px`;
      if (this.root && this.root.style[property] !== next) this.root.style[property] = next;
    };
    setPosition('left', pageLeft);
    setPosition('top', pageTop);
    setPosition('height', rect.height);
    this.geometry = Object.freeze({ left, top: rect.top, width, height: rect.height, placement });
    this.boardGeometry = Object.freeze({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
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

  private acceptsRequest(fen: string, generation: number, requestId: number, cacheContext: string): boolean {
    const accepted = this.enabled
      && Boolean(this.options.authorize())
      && generation === this.generation
      && requestId === this.activeRequestId
      && fen === this.currentFen
      && this.options.getFen() === fen
      && cacheContext === this.currentCacheContext
      && this.readCacheContext() === cacheContext;
    if (!accepted) this.staleResultCount += 1;
    return accepted;
  }

  private markEvaluationAccepted(fen: string, cached: boolean): void {
    if (this.firstEvaluationGeneration !== this.generation) {
      const acceptedAt = this.now();
      this.firstEvaluationGeneration = this.generation;
      this.lastFirstEvaluationAt = acceptedAt;
      this.lastRequestToFirstEvaluationMs = cached || this.lastRequestDispatchedAt === null
        ? null
        : Math.max(0, acceptedAt - this.lastRequestDispatchedAt);
      this.lastEvaluationAcceptedAt = acceptedAt;
    }
    this.hasRenderedEvaluation = true;
    this.pendingRenderedFen = fen;
    this.pendingRenderedGeneration = this.generation;
  }

  private commitPendingVisualFrame(): void {
    if (!this.pendingRenderedFen || this.pendingRenderedGeneration !== this.generation) return;
    this.renderedFen = this.pendingRenderedFen;
    this.pendingRenderedFen = '';
    this.pendingRenderedGeneration = -1;
    this.visualStale = false;
    const committedAt = this.now();
    this.lastFirstRenderedFrameAt = committedAt;
    this.lastEvaluationToFirstFrameMs = this.lastEvaluationAcceptedAt === null
      ? null
      : Math.max(0, committedAt - this.lastEvaluationAcceptedAt);
  }

  private isEquivalentBoard(board: HTMLElement): boolean {
    if (this.board === board) return true;
    if (this.board?.contains(board) || board.contains(this.board)) return true;
    if (!this.boardGeometry) return false;
    const rect = board.getBoundingClientRect();
    return Math.abs(rect.left - this.boardGeometry.left) <= 2
      && Math.abs(rect.top - this.boardGeometry.top) <= 2
      && Math.abs(rect.width - this.boardGeometry.width) <= 2
      && Math.abs(rect.height - this.boardGeometry.height) <= 2;
  }

  private handleBoardUnavailable(): void {
    if (!this.controller || !this.root?.isConnected) {
      this.deactivate();
      return;
    }
    if (this.boardMissingTimer === null) {
      const hadPosition = Boolean(this.currentFen || this.request);
      this.abortRequest('board-unavailable');
      this.currentFen = '';
      this.currentCacheContext = '';
      this.lastRequestAt = -Infinity;
      this.activeSequence = -1;
      if (hadPosition) {
        this.generation += 1;
        this.controller.beginSearch(this.generation);
      }
      this.pendingRenderedFen = '';
      this.pendingRenderedGeneration = -1;
      this.resetPresentation();
      this.boardMissingTimer = this.options.window.setTimeout(() => {
        this.boardMissingTimer = null;
        const board = this.safeRead(() => this.options.getBoard(), null);
        if (!board?.isConnected || !board.parentElement) this.deactivate();
        else this.queueReconcile();
      }, this.options.boardMissingGraceMs ?? DEFAULT_BOARD_MISSING_GRACE_MS);
    }
    this.ensurePolling();
    this.visualStale = this.hasRenderedEvaluation;
    this.setVisualState(this.hasRenderedEvaluation ? 'stale' : 'waiting', this.hasRenderedEvaluation ? undefined : '…');
  }

  private clearBoardMissingTimer(): void {
    if (this.boardMissingTimer !== null) this.options.window.clearTimeout(this.boardMissingTimer);
    this.boardMissingTimer = null;
  }

  private scheduleRouteReconcileBurst(): void {
    this.routeReconcileFramesRemaining = ROUTE_RECONCILE_FRAMES;
    if (this.routeReconcileTimer !== null) return;
    const tick = (): void => {
      this.routeReconcileTimer = null;
      if (!this.started || this.routeReconcileFramesRemaining <= 0) return;
      this.routeReconcileFramesRemaining -= 1;
      this.reconcile();
      if (this.routeReconcileFramesRemaining > 0) {
        this.routeReconcileTimer = this.options.window.setTimeout(tick, 16);
      }
    };
    this.routeReconcileTimer = this.options.window.setTimeout(tick, 0);
  }

  private cancelRouteReconcileBurst(): void {
    if (this.routeReconcileTimer !== null) this.options.window.clearTimeout(this.routeReconcileTimer);
    this.routeReconcileTimer = null;
    this.routeReconcileFramesRemaining = 0;
  }
}

export function createUserscriptEvalBar(options: UserscriptEvalBarOptions): UserscriptEvalBar {
  return new UserscriptEvalBar(options);
}

