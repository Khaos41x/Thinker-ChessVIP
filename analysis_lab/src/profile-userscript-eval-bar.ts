import '../src/ui/eval-bar.css';
import {
  createUserscriptEvalBar,
  resolveChessComEvalAuthorization,
  type EvalRequest,
} from '../../frontend/eval_bar/userscript-adapter';

const nextFrame = (): Promise<number> => new Promise(resolve => requestAnimationFrame(resolve));
const waitFrames = async (count = 8): Promise<void> => {
  for (let index = 0; index < count; index += 1) await nextFrame();
};

async function runUserscriptEvalBarBrowserTest() {
  history.replaceState({}, '', '/analysis/fixture');
  const shell = document.createElement('div');
  const board = document.createElement('div');
  board.id = 'board-fixture';
  Object.assign(shell.style, { display: 'grid', position: 'relative', width: '640px', height: '640px' });
  Object.assign(board.style, { width: '600px', height: '600px' });
  shell.append(board);
  document.body.append(shell);
  const originalParent = board.parentElement;
  const originalParentStyle = shell.getAttribute('style');
  const originalBoardRect = board.getBoundingClientRect();

  let fen = 'fen-a';
  let orientation: 'white' | 'black' = 'white';
  let cacheContext = 'engine-a|white-cp-mate-v1';
  let now = 0;
  const requests: EvalRequest[] = [];
  let abortCount = 0;
  let pendingFrames = 0;
  let maximumPendingFrames = 0;
  const nativeRequestFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelFrame = window.cancelAnimationFrame.bind(window);
  const handles = new Map<number, boolean>();
  window.requestAnimationFrame = callback => {
    pendingFrames += 1;
    maximumPendingFrames = Math.max(maximumPendingFrames, pendingFrames);
    const handle = nativeRequestFrame(timestamp => {
      if (handles.delete(handle)) pendingFrames -= 1;
      callback(timestamp);
    });
    handles.set(handle, true);
    return handle;
  };
  window.cancelAnimationFrame = handle => {
    if (handles.delete(handle)) pendingFrames -= 1;
    nativeCancelFrame(handle);
  };

  const adapter = createUserscriptEvalBar({
    window,
    document,
    getFen: () => fen,
    getBoard: () => board,
    getOrientation: () => orientation,
    getCacheContext: () => cacheContext,
    authorize: () => resolveChessComEvalAuthorization(window.location, document),
    shouldDisplay: () => /^\/(?:analysis|play)(?:\/|$)/.test(window.location.pathname),
    getRoute: () => window.location.pathname,
    requestEvaluation: request => {
      requests.push(request);
      return { abort: () => { abortCount += 1; } };
    },
    addStyle: css => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.append(style);
      return style;
    },
    pollIntervalMs: 60000,
    refreshIntervalMs: 100,
    now: () => now,
  });
  adapter.start(true);
  adapter.start(true);
  const singleRootAfterRepeatedStart = document.querySelectorAll('#thinker-eval-v2-rail').length === 1;
  const root = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')!;
  const mountedBoardRect = board.getBoundingClientRect();
  const mountedRailRect = root.getBoundingClientRect();
  const domPreserved = board.parentElement === originalParent
    && shell.getAttribute('style') === originalParentStyle
    && mountedBoardRect.width === originalBoardRect.width
    && mountedBoardRect.height === originalBoardRect.height
    && root.parentElement === document.body
    && getComputedStyle(root).pointerEvents === 'none';
  const overlayAligned = Math.abs(mountedRailRect.top - mountedBoardRect.top) < 1
    && Math.abs(mountedRailRect.height - mountedBoardRect.height) < 1
    && (mountedRailRect.right <= mountedBoardRect.left || mountedRailRect.left >= mountedBoardRect.right);

  const firstRequest = requests.at(-1)!;
  fen = 'fen-b';
  adapter.pollNow();
  const secondRequest = requests.at(-1)!;
  firstRequest.onResult({ cp: 900, depth: 18 });
  const staleLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  secondRequest.onResult({ cp: -240, depth: 19 });
  const maximumPendingFramesDuringBurst = maximumPendingFrames;
  await waitFrames(12);
  const negativeLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  const negativeTransform = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;

  orientation = 'black';
  adapter.pollNow();
  await waitFrames(4);
  const orientationCacheLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;

  now = 101;
  adapter.pollNow();
  const sameFenOldRequest = requests.at(-1)!;
  now = 202;
  adapter.pollNow();
  const sameFenLatestRequest = requests.at(-1)!;
  const beforeSameFenRace = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  sameFenOldRequest.onResult({ cp: 900, depth: 20 });
  sameFenOldRequest.onError(new Error('obsolete request'));
  await waitFrames(2);
  const afterSameFenRace = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  const oldSameFenCallbacksRejected = beforeSameFenRace === afterSameFenRace
    && adapter.snapshot().requestActive
    && sameFenLatestRequest.requestId > sameFenOldRequest.requestId;

  sameFenLatestRequest.onResult({ mate: 3, depth: 20 });
  await waitFrames(4);
  const mateBlackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  now = 303;
  adapter.pollNow();
  requests.at(-1)!.onResult({ mate: -2, depth: 20 });
  await waitFrames(4);
  const negativeMateBlackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  now = 404;
  adapter.pollNow();
  requests.at(-1)!.onResult({ cp: 0, depth: 20 });
  await waitFrames(4);
  const neutralLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;

  const beforeContextMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;
  cacheContext = 'engine-b|white-cp-mate-v1';
  adapter.pollNow();
  const contextRequest = requests.at(-1)!;
  const afterContextMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;
  const contextMissState = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state;
  requests.at(-2)!.onResult({ cp: 800, depth: 21 });
  await waitFrames(2);
  const oldContextRejected = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent === '…'
    && adapter.snapshot().requestActive;
  contextRequest.onResult({ cp: 125, depth: 21 });
  await waitFrames(4);
  cacheContext = 'engine-a|white-cp-mate-v1';
  adapter.pollNow();
  await waitFrames(4);
  const contextCacheSeparated = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent === '0.0'
    && document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state === 'fresh';

  const beforeFenMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;
  fen = 'fen-c';
  adapter.pollNow();
  const afterFenMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;
  const fenMissState = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state;
  fen = 'fen-b';
  adapter.pollNow();
  const cacheHitState = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state;
  await waitFrames(4);

  const requestsBeforeMissingFen = requests.length;
  fen = '';
  adapter.pollNow();
  const missingFenWaiting = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state === 'waiting'
    && document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent === '…'
    && requests.length === requestsBeforeMissingFen;
  fen = 'fen-b';
  adapter.pollNow();
  const labelBeforeBackendFailure = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  requests.at(-1)!.onError(new Error('backend offline'));
  const backendFailureVisible = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state === 'error'
    && adapter.snapshot().lastError === 'backend offline'
    && document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent === labelBeforeBackendFailure;

  board.style.display = 'none';
  adapter.pollNow();
  const hiddenWhenBoardHidden = Boolean(document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.hidden);
  board.style.display = 'block';
  adapter.pollNow();
  const visibleAfterBoardReturns = !document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.hidden;

  history.replaceState({}, '', '/play/online');
  await waitFrames(2);
  const mountedBlockedWhenUnauthorized = document.getElementById('thinker-eval-v2-rail')?.dataset.state === 'blocked'
    && document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent === '—';
  const requestsBeforeUnauthorizedPoll = requests.length;
  adapter.pollNow();
  const noRequestWhenUnauthorized = requests.length === requestsBeforeUnauthorizedPoll;
  history.replaceState({}, '', '/analysis/fixture');
  await waitFrames(2);
  const remountedAfterSpaRoute = Boolean(document.getElementById('thinker-eval-v2-rail'));
  adapter.destroy();

  for (let index = 0; index < 40; index += 1) {
    const instance = createUserscriptEvalBar({
      window,
      document,
      getFen: () => `remount-${index}`,
      getBoard: () => board,
      getOrientation: () => 'white',
      getCacheContext: () => 'engine-a|white-cp-mate-v1',
      authorize: () => 'analysis',
      requestEvaluation: () => null,
      pollIntervalMs: 60000,
    });
    instance.start(true);
    instance.destroy();
  }
  const rootsAfterDestroy = document.querySelectorAll('#thinker-eval-v2-rail').length;
  const styleMarkers = document.querySelectorAll('#thinker-eval-v2-style').length;
  const parentPreservedAfterDestroy = board.parentElement === originalParent
    && shell.getAttribute('style') === originalParentStyle;
  window.requestAnimationFrame = nativeRequestFrame;
  window.cancelAnimationFrame = nativeCancelFrame;
  shell.remove();

  return {
    domPreserved,
    singleRootAfterRepeatedStart,
    overlayAligned,
    parentPreservedAfterDestroy,
    staleRejected: staleLabel === '…',
    negativeRendered: Boolean(negativeLabel?.startsWith('-')) && Boolean(negativeTransform?.startsWith('scaleY(')),
    cachedOrientationRendered: orientationCacheLabel === '+2.4',
    oldSameFenCallbacksRejected,
    requestIdsMonotonic: requests.every((request, index) => index === 0 || request.requestId > requests[index - 1].requestId),
    matePerspectiveRendered: mateBlackLabel === '#-3',
    negativeMatePerspectiveRendered: negativeMateBlackLabel === '#2',
    neutralRendered: neutralLabel === '0.0',
    contextMissPreservedVisual: beforeContextMiss === afterContextMiss && contextMissState === 'loading',
    oldContextRejected,
    contextCacheSeparated,
    cacheMissPreservedVisual: beforeFenMiss === afterFenMiss && fenMissState === 'loading',
    cacheHitMarkedFresh: cacheHitState === 'fresh',
    missingFenWaiting,
    backendFailureVisible,
    hiddenWhenBoardHidden,
    visibleAfterBoardReturns,
    abortCount,
    mountedBlockedWhenUnauthorized,
    noRequestWhenUnauthorized,
    remountedAfterSpaRoute,
    rootsAfterDestroy,
    styleMarkers,
    maximumPendingFramesDuringBurst,
  };
}

Object.assign(globalThis, { runUserscriptEvalBarBrowserTest });
