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
  firstRequest.onProgress({ type: 'info', sequence: 1, cp: 950, depth: 12 });
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
  const sameFenRequest = requests.at(-1)!;
  const requestsBeforeRefreshBoundary = requests.length;
  const abortsBeforeRefreshBoundary = abortCount;
  now = 5202;
  adapter.pollNow();
  const activeSurvivedRefresh = requests.length === requestsBeforeRefreshBoundary
    && requests.at(-1) === sameFenRequest
    && abortCount === abortsBeforeRefreshBoundary
    && adapter.snapshot().requestActive;
  sameFenRequest.onProgress({ type: 'info', sequence: 1, cp: 40, mate: null, depth: 8 });
  await waitFrames(2);
  const firstProgressLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  sameFenRequest.onProgress({ type: 'info', sequence: 2, cp: 90, mate: null, depth: 12 });
  sameFenRequest.onProgress({ type: 'info', sequence: 1, cp: -900, mate: null, depth: 7 });
  await waitFrames(2);
  const secondProgressLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  const oldSameFenCallbacksRejected = activeSurvivedRefresh
    && firstProgressLabel === '-0.4'
    && secondProgressLabel === '-0.9'
    && adapter.snapshot().requestActive;

  sameFenRequest.onResult({ type: 'result', sequence: 3, mate: 3, depth: 20 });
  await waitFrames(4);
  const mateBlackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  now = 10303;
  adapter.pollNow();
  requests.at(-1)!.onResult({ mate: -2, depth: 20 });
  await waitFrames(4);
  const negativeMateBlackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  now = 15404;
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
  now += 101;
  adapter.pollNow();
  const recoveryRequest = requests.at(-1)!;
  recoveryRequest.onProgress({ type: 'info', sequence: 1, cp: 55, mate: null, depth: 6 });
  await waitFrames(2);
  const recoveredAfterBackendFailure = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state === 'fresh'
    && adapter.snapshot().lastError === null
    && document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent !== '!';

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
    recoveredAfterBackendFailure,
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

async function runUserscriptEvalBarVisualTest() {
  history.replaceState({}, '', '/analysis/visual-fixture');
  window.scrollTo(0, 0);
  const boardSize = window.innerWidth === 900 ? 528 : window.innerWidth === 1280 ? 584 : 480;
  const shell = document.createElement('div');
  const board = document.createElement('div');
  const spacer = document.createElement('div');
  Object.assign(shell.style, {
    display: 'block',
    marginLeft: '80px',
    marginTop: '140px',
    width: `${boardSize}px`,
    height: `${boardSize}px`,
  });
  Object.assign(board.style, { display: 'block', width: '100%', height: '100%' });
  spacer.style.height = '1200px';
  shell.append(board);
  document.body.append(shell, spacer);
  const originalShellStyle = shell.getAttribute('style');
  const originalBoardStyle = board.getAttribute('style');
  let orientation: 'white' | 'black' = 'white';
  const adapter = createUserscriptEvalBar({
    window,
    document,
    getFen: () => '4k3/8/8/8/8/8/P7/4K3 w - - 0 1',
    getBoard: () => board,
    getOrientation: () => orientation,
    getCacheContext: () => 'visual-fixture',
    authorize: () => 'analysis',
    shouldDisplay: () => true,
    requestEvaluation: request => {
      request.onResult({ cp: 1033, depth: 18 });
      return null;
    },
    pollIntervalMs: 60000,
    refreshIntervalMs: 60000,
  });
  adapter.start(true);
  await waitFrames(12);

  const root = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')!;
  const fill = root.querySelector<HTMLElement>('.thinker-eval-v2-fill')!;
  const label = root.querySelector<HTMLElement>('.thinker-eval-v2-score')!;
  const boardRect = board.getBoundingClientRect();
  const railRect = root.getBoundingClientRect();
  const labelRect = label.getBoundingClientRect();
  const rootStyle = getComputedStyle(root);
  const fillStyle = getComputedStyle(fill);
  const labelStyle = getComputedStyle(label);
  const whiteOrigin = getComputedStyle(fill).transformOrigin.split(' ').map(Number.parseFloat);
  const baseline = {
    width: railRect.width,
    heightDelta: Math.abs(railRect.height - boardRect.height),
    topDelta: Math.abs(railRect.top - boardRect.top),
    gap: Math.abs(boardRect.left - railRect.right),
    placement: root.dataset.placement,
    labelBottomDelta: Math.abs(railRect.bottom - labelRect.bottom),
    labelCenterDelta: Math.abs((railRect.left + railRect.right) / 2 - (labelRect.left + labelRect.right) / 2),
  };
  const hostPreservedAfterMount = board.parentElement === shell
    && board.getAttribute('style') === originalBoardStyle
    && shell.getAttribute('style') === originalShellStyle;
  const styles = {
    dark: rootStyle.backgroundColor,
    light: fillStyle.backgroundColor,
    draw: rootStyle.getPropertyValue('--thinker-eval-v2-draw').trim(),
    radius: rootStyle.borderRadius,
    borderTopWidth: rootStyle.borderTopWidth,
    shadow: rootStyle.boxShadow,
    fontFamily: labelStyle.fontFamily,
    fontSize: labelStyle.fontSize,
    fontWeight: labelStyle.fontWeight,
    lineHeight: labelStyle.lineHeight,
    labelColor: labelStyle.color,
    mixBlendMode: labelStyle.mixBlendMode,
    paddingTop: labelStyle.paddingTop,
    paddingBottom: labelStyle.paddingBottom,
    labelHeight: labelRect.height,
    whiteOriginY: whiteOrigin[1],
    writingMode: labelStyle.writingMode,
    labelTransform: labelStyle.transform,
    score: label.textContent,
    fillTransform: fill.style.transform,
    fillInlineHeight: fill.style.height,
  };

  orientation = 'black';
  adapter.pollNow();
  await waitFrames(2);
  const blackRailRect = root.getBoundingClientRect();
  const blackLabelRect = label.getBoundingClientRect();
  const blackOrigin = getComputedStyle(fill).transformOrigin.split(' ').map(Number.parseFloat);
  const flipped = {
    labelTopDelta: Math.abs(blackLabelRect.top - blackRailRect.top),
    labelCenterDelta: Math.abs((blackRailRect.left + blackRailRect.right) / 2 - (blackLabelRect.left + blackLabelRect.right) / 2),
    originY: blackOrigin[1],
  };

  const resizedSize = boardSize - 80;
  shell.style.width = `${resizedSize}px`;
  shell.style.height = `${resizedSize}px`;
  window.dispatchEvent(new Event('resize'));
  await waitFrames(2);
  const resizedBoardRect = board.getBoundingClientRect();
  const resizedRailRect = root.getBoundingClientRect();
  const resized = {
    heightDelta: Math.abs(resizedRailRect.height - resizedBoardRect.height),
    topDelta: Math.abs(resizedRailRect.top - resizedBoardRect.top),
    gap: Math.abs(resizedBoardRect.left - resizedRailRect.right),
  };

  window.scrollTo(0, 60);
  await waitFrames(2);
  const scrolledBoardRect = board.getBoundingClientRect();
  const scrolledRailRect = root.getBoundingClientRect();
  const scrolled = {
    heightDelta: Math.abs(scrolledRailRect.height - scrolledBoardRect.height),
    topDelta: Math.abs(scrolledRailRect.top - scrolledBoardRect.top),
    gap: Math.abs(scrolledBoardRect.left - scrolledRailRect.right),
    scrollY: window.scrollY,
  };
  const hostPreserved = hostPreservedAfterMount
    && board.parentElement === shell
    && board.getAttribute('style') === originalBoardStyle;

  shell.style.marginLeft = '5px';
  window.dispatchEvent(new Event('resize'));
  await waitFrames(2);
  const rightFallback = {
    placement: root.dataset.placement,
    gap: Math.abs(root.getBoundingClientRect().left - board.getBoundingClientRect().right),
  };

  shell.style.marginLeft = '0';
  shell.style.width = `${window.innerWidth}px`;
  shell.style.height = `${resizedSize}px`;
  window.dispatchEvent(new Event('resize'));
  await waitFrames(2);
  const overlayFallback = {
    placement: root.dataset.placement,
    leftDelta: Math.abs(root.getBoundingClientRect().left - board.getBoundingClientRect().left),
  };
  const geometry = adapter.snapshot().geometry;
  adapter.destroy();
  shell.remove();
  spacer.remove();
  window.scrollTo(0, 0);

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    expectedWidth: window.innerWidth >= 960 ? 30 : 20,
    boardSize,
    baseline,
    styles,
    flipped,
    resized,
    scrolled,
    rightFallback,
    overlayFallback,
    geometry,
    hostPreserved,
    originalShellStyle,
    rootsAfterDestroy: document.querySelectorAll('#thinker-eval-v2-rail').length,
  };
}

Object.assign(globalThis, { runUserscriptEvalBarBrowserTest, runUserscriptEvalBarVisualTest });
