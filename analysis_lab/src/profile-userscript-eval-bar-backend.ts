import '../src/ui/eval-bar.css';
import {
  createUserscriptEvalBar,
  readChessComFen,
  resolveChessComEvalAuthorization,
  type EvalRequest,
} from '../../frontend/eval_bar/userscript-adapter';

const nextFrame = (): Promise<number> => new Promise(resolve => requestAnimationFrame(resolve));

async function runEvalBarBackendIntegration(serverUrl: string, token: string) {
  history.replaceState({}, '', '/analysis/backend-integration');
  const nativeMatchMedia = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: false }),
  });
  const fen = 'r2q1rk1/pp1bbppp/2np1n2/2p1p3/4P3/2NP1N2/PPPQBPPP/R1B1K2R w KQ - 4 9';
  const board = document.createElement('wc-chess-board');
  board.setAttribute('data-fen', fen);
  board.setAttribute('orientation', 'white');
  Object.assign(board.style, { display: 'block', width: '600px', height: '600px' });
  document.body.append(board);
  let requestCount = 0;
  const transport = (request: EvalRequest) => {
    const abort = new AbortController();
    requestCount += 1;
    fetch(`${serverUrl}/eval-bar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen: request.fen,
        requestId: `eval-v2:${request.requestId}`,
        generation: request.generation,
        cacheContext: request.cacheContext,
        context: 'analysis',
      }),
      signal: abort.signal,
    }).then(async response => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || payload.error || `HTTP ${response.status}`);
      if (payload.error) throw new Error(payload.error);
      request.onResult(payload);
    }).catch(error => {
      if (error?.name !== 'AbortError') request.onError(error);
    });
    return { abort: () => abort.abort() };
  };
  const adapter = createUserscriptEvalBar({
    window,
    document,
    getFen: () => readChessComFen(board),
    getBoard: () => board,
    getOrientation: () => board.getAttribute('orientation') === 'black' ? 'black' : 'white',
    getCacheContext: () => 'stockfish-19|sf_19_smallnet|nn-61e7af4bb97d.nnue|backend-integration',
    authorize: () => resolveChessComEvalAuthorization(window.location, document),
    shouldDisplay: () => true,
    getRoute: () => window.location.pathname,
    requestEvaluation: transport,
    pollIntervalMs: 60000,
    refreshIntervalMs: 60000,
  });
  adapter.start(true);
  const transforms: string[] = [];
  const cpDeadline = performance.now() + 13000;
  while (performance.now() < cpDeadline) {
    await nextFrame();
    const fill = document.querySelector<HTMLElement>('.thinker-eval-v2-fill');
    if (fill) transforms.push(fill.style.transform);
    if (adapter.snapshot().state === 'connected') break;
  }
  for (let frame = 0; frame < 24; frame += 1) {
    await nextFrame();
    transforms.push(document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform || '');
  }
  const whiteLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent || '';
  const cpBackend = adapter.snapshot().lastEvaluation;
  board.setAttribute('orientation', 'black');
  adapter.pollNow();
  for (let frame = 0; frame < 4; frame += 1) await nextFrame();
  const blackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent || '';
  const mateFen = '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1';
  board.setAttribute('data-fen', mateFen);
  board.setAttribute('orientation', 'white');
  adapter.pollNow();
  const mateDeadline = performance.now() + 13000;
  while (performance.now() < mateDeadline) {
    await nextFrame();
    const snapshot = adapter.snapshot();
    if (snapshot.state === 'connected'
      && snapshot.currentFen === mateFen
      && snapshot.lastEvaluation?.mate !== null
      && snapshot.lastEvaluation?.mate !== undefined) break;
  }
  await nextFrame();
  const mateBackend = adapter.snapshot().lastEvaluation;
  const mateLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent || '';
  const result = {
    fenRead: cpBackend !== null && readChessComFen(board) === mateFen,
    requestCount,
    cpBackend,
    mateBackend,
    smallnetIdentity: cpBackend?.engine === 'Stockfish 19'
      && cpBackend?.package === '@lichess-org/stockfish-web@0.5.0'
      && cpBackend?.build === 'sf_19_smallnet'
      && cpBackend?.network === 'nn-61e7af4bb97d.nnue',
    connected: adapter.snapshot().state === 'connected',
    whiteLabel,
    blackLabel,
    orientationInverted: whiteLabel !== blackLabel,
    mateLabel,
    scaleYOnly: transforms.every(value => /^scaleY\([\d.e+-]+\)$/.test(value)),
    smoothFrames: new Set(transforms).size,
    geometry: adapter.snapshot().geometry,
    diagnostics: adapter.snapshot(),
  };
  adapter.destroy();
  board.remove();
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: nativeMatchMedia });
  return result;
}

Object.assign(globalThis, { runEvalBarBackendIntegration });
