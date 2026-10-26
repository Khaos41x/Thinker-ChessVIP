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
  const negativeFavoredColor = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.favoredColor;
  const negativeTransform = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;

  orientation = 'black';
  adapter.pollNow();
  await waitFrames(4);
  const orientationCacheLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  const orientationCacheFavoredColor = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.favoredColor;

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
  sameFenRequest.onProgress({ type: 'info', sequence: 1, cp: 40, mate: null, depth: 20 });
  await waitFrames(2);
  const firstProgressLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  now += 251;
  sameFenRequest.onProgress({ type: 'info', sequence: 2, cp: 90, mate: null, depth: 21 });
  sameFenRequest.onProgress({ type: 'info', sequence: 1, cp: -900, mate: null, depth: 7 });
  await waitFrames(2);
  const secondProgressLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  const oldSameFenCallbacksRejected = activeSurvivedRefresh
    && firstProgressLabel === '0.4'
    && secondProgressLabel === '0.9'
    && adapter.snapshot().requestActive;

  sameFenRequest.onResult({ type: 'result', sequence: 3, mate: 3, depth: 20 });
  await waitFrames(4);
  const mateBlackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  const mateFavoredColor = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.favoredColor;
  now = 10303;
  adapter.pollNow();
  requests.at(-1)!.onResult({ mate: -2, depth: 20 });
  await waitFrames(4);
  const negativeMateBlackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  const negativeMateFavoredColor = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.favoredColor;
  now = 15404;
  adapter.pollNow();
  requests.at(-1)!.onResult({ cp: 0, depth: 20 });
  await waitFrames(4);
  const neutralLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;

  const beforeContextMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;
  const labelBeforeContextMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  cacheContext = 'engine-b|white-cp-mate-v1';
  adapter.pollNow();
  const contextRequest = requests.at(-1)!;
  const afterContextMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;
  const contextMissState = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state;
  requests.at(-2)!.onResult({ cp: 800, depth: 21 });
  await waitFrames(2);
  const oldContextRejected = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent === labelBeforeContextMiss
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
  const cacheStartFraction = adapter.snapshot().visualFraction!;
  fen = 'fen-b';
  adapter.pollNow();
  const cacheHitState = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state;
  const cacheTargetFraction = adapter.snapshot().targetFraction!;
  await waitFrames(1);
  const cacheFirstFrameFraction = adapter.snapshot().visualFraction!;
  const cacheHitContinuous = cacheTargetFraction >= cacheStartFraction
    ? cacheFirstFrameFraction >= cacheStartFraction && cacheFirstFrameFraction <= cacheTargetFraction
    : cacheFirstFrameFraction <= cacheStartFraction && cacheFirstFrameFraction >= cacheTargetFraction;
  await waitFrames(3);

  const requestsBeforeMissingFen = requests.length;
  const labelBeforeMissingFen = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  fen = '';
  adapter.pollNow();
  const missingFenWaiting = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state === 'waiting'
    && document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent === labelBeforeMissingFen
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
  const activePlayAuthorized = document.getElementById('thinker-eval-v2-rail') !== null
    && document.getElementById('thinker-eval-v2-rail')?.dataset.state !== 'blocked';
  fen = 'fen-online';
  const requestsBeforeActivePlayPoll = requests.length;
  adapter.pollNow();
  const activePlayDispatches = requests.length > requestsBeforeActivePlayPoll;
  fen = 'fen-b';

  adapter.setEnabled(false);
  const requestsBeforeBlockedShell = requests.length;
  const blockedInstance = createUserscriptEvalBar({
    window,
    document,
    getFen: () => fen,
    getBoard: () => board,
    getOrientation: () => orientation,
    getCacheContext: () => cacheContext,
    authorize: () => null,
    shouldDisplay: () => (/^\/(?:analysis|play)(?:\/|$)/).test(window.location.pathname),
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
  blockedInstance.start(true);
  const blockedShellMounted = document.getElementById('thinker-eval-v2-rail')?.dataset.state === 'blocked'
    && document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent === '—';
  blockedInstance.pollNow();
  const noRequestWhenUnauthorized = requests.length === requestsBeforeBlockedShell;
  blockedInstance.destroy();
  adapter.setEnabled(true);
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
    negativeRendered: negativeLabel === '2.4'
      && negativeFavoredColor === 'black'
      && Boolean(negativeTransform?.startsWith('scaleY(')),
    cachedOrientationRendered: orientationCacheLabel === '2.4' && orientationCacheFavoredColor === 'black',
    oldSameFenCallbacksRejected,
    requestIdsMonotonic: requests.every((request, index) => index === 0 || request.requestId > requests[index - 1].requestId),
    matePerspectiveRendered: mateBlackLabel === '#3' && mateFavoredColor === 'white',
    negativeMatePerspectiveRendered: negativeMateBlackLabel === '#2' && negativeMateFavoredColor === 'black',
    neutralRendered: neutralLabel === '0.0',
    contextMissPreservedVisual: beforeContextMiss === afterContextMiss && contextMissState === 'stale',
    oldContextRejected,
    contextCacheSeparated,
    cacheMissPreservedVisual: beforeFenMiss === afterFenMiss && fenMissState === 'stale',
    cacheHitMarkedFresh: cacheHitState === 'fresh',
    cacheHitContinuous,
    missingFenWaiting,
    backendFailureVisible,
    recoveredAfterBackendFailure,
    hiddenWhenBoardHidden,
    visibleAfterBoardReturns,
    abortCount,
    mountedBlockedWhenUnauthorized: blockedShellMounted,
    noRequestWhenUnauthorized,
    activePlayAuthorized,
    activePlayDispatches,
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
    reducedMotion: false,
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

  const pageAnchor = { top: root.style.top, left: root.style.left };
  const immediateScrollFrames = Array.from({ length: 30 }, (_, index) => {
    window.scrollTo(0, index * 4);
    const boardFrame = board.getBoundingClientRect();
    const railFrame = root.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      topDelta: Math.abs(boardFrame.top - railFrame.top),
      bottomDelta: Math.abs(boardFrame.bottom - railFrame.bottom),
      anchorUnchanged: root.style.top === pageAnchor.top && root.style.left === pageAnchor.left,
    };
  });
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
  const originalBodyPosition = document.body.style.position;
  document.body.style.position = 'relative';
  window.dispatchEvent(new Event('resize'));
  await waitFrames(2);
  const positionedBody = {
    topDelta: Math.abs(root.getBoundingClientRect().top - board.getBoundingClientRect().top),
    bottomDelta: Math.abs(root.getBoundingClientRect().bottom - board.getBoundingClientRect().bottom),
  };
  document.body.style.position = originalBodyPosition;
  window.dispatchEvent(new Event('resize'));
  await waitFrames(2);
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
  const position = getComputedStyle(root).position;
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
    immediateScrollFrames,
    positionedBody,
    position,
    rightFallback,
    overlayFallback,
    geometry,
    hostPreserved,
    originalShellStyle,
    rootsAfterDestroy: document.querySelectorAll('#thinker-eval-v2-rail').length,
  };
}

async function runUserscriptEvalBarContinuityTest() {
  history.replaceState({}, '', '/analysis/collection/continuity/analysis?move=0');
  const shell = document.createElement('div');
  let board = document.createElement('div');
  Object.assign(shell.style, { position: 'relative', width: '600px', height: '600px', marginLeft: '80px' });
  Object.assign(board.style, { width: '600px', height: '600px' });
  shell.append(board);
  document.body.append(shell);

  const fenFor = (move: number): string => `4k3/8/8/8/8/8/P7/4K3 ${move % 2 ? 'b' : 'w'} - - 0 ${move + 1}`;
  let fen = fenFor(0);
  const requests: Array<EvalRequest & { createdAt: number; aborted: boolean }> = [];
  const adapter = createUserscriptEvalBar({
    window,
    document,
    getFen: () => fen,
    getBoard: () => board,
    getOrientation: () => 'white',
    getCacheContext: () => 'continuity-fixture',
    authorize: () => 'analysis',
    shouldDisplay: () => true,
    getRoute: () => `${location.pathname}${location.search}`,
    requestEvaluation: request => {
      const record = Object.assign(request, { createdAt: performance.now(), aborted: false });
      requests.push(record);
      return { abort: () => { record.aborted = true; } };
    },
    pollIntervalMs: 60000,
    refreshIntervalMs: 60000,
    reducedMotion: false,
  });
  adapter.start(true);
  const initialRequest = requests.at(-1)!;
  initialRequest.onProgress({ type: 'info', sequence: 1, cp: 700, mate: null, depth: 8 });
  await waitFrames(20);

  const root = document.querySelector<HTMLElement>('#thinker-eval-v2-rail')!;
  const fill = root.querySelector<HTMLElement>('.thinker-eval-v2-fill')!;
  const label = root.querySelector<HTMLElement>('.thinker-eval-v2-score')!;
  const initialGeometry = adapter.snapshot().geometry;
  const transitions: Array<Record<string, unknown>> = [];
  let previousRequest = initialRequest;

  for (let move = 1; move <= 30; move += 1) {
    if (move === 16) {
      const replacement = document.createElement('div');
      Object.assign(replacement.style, { width: '600px', height: '600px' });
      board.replaceWith(replacement);
      board = replacement;
    }
    const priorLabel = label.textContent;
    const priorTransform = fill.style.transform;
    const priorFraction = adapter.snapshot().visualFraction;
    const navigationStartedAt = performance.now();
    fen = fenFor(move);
    history.replaceState({}, '', `/analysis/collection/continuity/analysis?move=${move}`);
    await Promise.resolve();
    await Promise.resolve();
    const currentRequest = requests.at(-1)!;
    const requestDetectedAt = currentRequest.createdAt;
    const rootBeforeEvaluation = document.querySelector<HTMLElement>('#thinker-eval-v2-rail')!;
    const pendingSnapshot = adapter.snapshot();
    const pendingFrameAt = await nextFrame();
    const pendingFraction = adapter.snapshot().visualFraction;
    const pendingVisual = {
      fillOpacity: getComputedStyle(fill).opacity,
      labelOpacity: getComputedStyle(label).opacity,
      transform: fill.style.transform,
      label: label.textContent,
      state: root.dataset.state,
      roots: document.querySelectorAll('#thinker-eval-v2-rail').length,
    };
    previousRequest.onProgress({ type: 'info', sequence: 999, cp: -9999, mate: null, depth: 99 });
    const afterObsolete = {
      transform: fill.style.transform,
      label: label.textContent,
      staleResultCount: adapter.snapshot().staleResultCount,
    };
    const evaluationAt = performance.now();
    currentRequest.onProgress({
      type: 'info',
      sequence: 1,
      cp: move % 2 ? 1100 : -900,
      mate: null,
      depth: 8,
    });
    const firstUpdatedFrameAt = await nextFrame();
    const updatedSnapshot = adapter.snapshot();
    transitions.push({
      move,
      detectionMs: requestDetectedAt - navigationStartedAt,
      firstEvaluationMs: evaluationAt - requestDetectedAt,
      firstFrameMs: firstUpdatedFrameAt - evaluationAt,
      pendingFrameMs: pendingFrameAt - navigationStartedAt,
      priorFraction,
      pendingFraction,
      updatedFraction: updatedSnapshot.visualFraction,
      targetFraction: updatedSnapshot.targetFraction,
      priorTransform,
      priorLabel,
      pendingVisual,
      afterObsolete,
      sameRoot: rootBeforeEvaluation === root && document.querySelector('#thinker-eval-v2-rail') === root,
      geometry: adapter.snapshot().geometry,
      requestAborted: previousRequest.aborted,
      renderedFen: updatedSnapshot.renderedFen,
      visualStale: updatedSnapshot.visualStale,
    });
    previousRequest = currentRequest;
  }
  previousRequest.onResult({ type: 'result', sequence: 2, cp: -900, mate: null, depth: 18 });
  await waitFrames(8);
  const finalSnapshot = adapter.snapshot();
  adapter.destroy();
  shell.remove();
  return {
    transitions,
    initialGeometry,
    finalSnapshot,
    requestCount: requests.length,
    rootsAfterDestroy: document.querySelectorAll('#thinker-eval-v2-rail').length,
  };
}

async function runUserscriptEvalBarReactiveFenTest() {
  history.replaceState({}, '', '/analysis/collection/reactive/analysis?move=0');
  const board = document.createElement('div');
  Object.assign(board.style, { width: '500px', height: '500px', marginLeft: '80px' });
  document.body.append(board);
  const initialFen = '4k3/8/8/8/8/8/P7/4K3 w - - 0 1';
  const nextFen = '4k3/8/8/8/8/8/P7/4K3 b - - 0 2';
  let fen = initialFen;
  const requests: Array<EvalRequest & { createdAt: number }> = [];
  const adapter = createUserscriptEvalBar({
    window,
    document,
    getFen: () => fen,
    getBoard: () => board,
    getOrientation: () => 'white',
    getCacheContext: () => 'reactive-fixture',
    authorize: () => 'analysis',
    shouldDisplay: () => true,
    requestEvaluation: request => {
      requests.push(Object.assign(request, { createdAt: performance.now() }));
      return { abort: () => undefined };
    },
    pollIntervalMs: 60000,
    refreshIntervalMs: 60000,
    reducedMotion: false,
    boardMissingGraceMs: 20,
  });
  adapter.start(true);
  requests[0].onProgress({ type: 'info', sequence: 1, cp: 500, mate: null, depth: 8 });
  await waitFrames(10);
  const root = document.querySelector<HTMLElement>('#thinker-eval-v2-rail')!;
  const fill = root.querySelector<HTMLElement>('.thinker-eval-v2-fill')!;
  const label = root.querySelector<HTMLElement>('.thinker-eval-v2-score')!;
  const retainedTransform = fill.style.transform;
  const retainedLabel = label.textContent;
  fen = '';
  history.replaceState({}, '', '/analysis/collection/reactive/analysis?move=1');
  await nextFrame();
  const missingFenPreserved = fill.style.transform === retainedTransform
    && label.textContent === retainedLabel
    && getComputedStyle(fill).opacity === '1';
  const fenAvailableAt = performance.now();
  fen = nextFen;
  await waitFrames(2);
  const reactiveRequest = requests.at(-1)!;
  const propertyOnlyDetected = requests.length === 2
    && reactiveRequest.createdAt - fenAvailableAt < 100;
  reactiveRequest.onProgress({ type: 'info', sequence: 1, cp: -400, mate: null, depth: 8 });
  await nextFrame();
  const propertyOnlyRendered = adapter.snapshot().renderedFen === nextFen;
  const requestsBeforeBurst = requests.length;
  let burstFen = nextFen;
  for (let move = 2; move <= 11; move += 1) {
    burstFen = `4k3/8/8/8/8/8/P7/4K3 ${move % 2 ? 'b' : 'w'} - - 0 ${move + 1}`;
    fen = burstFen;
    history.replaceState({}, '', `/analysis/collection/reactive/analysis?move=${move}`);
  }
  await Promise.resolve();
  await Promise.resolve();
  const burstCoalesced = requests.length === requestsBeforeBurst + 1
    && adapter.snapshot().currentFen === burstFen;
  board.remove();
  adapter.pollNow();
  await new Promise(resolve => setTimeout(resolve, 30));
  const permanentBoardRemovalUnmounted = !document.querySelector('#thinker-eval-v2-rail');
  adapter.destroy();
  return {
    missingFenPreserved,
    propertyOnlyDetected,
    propertyOnlyRendered,
    burstCoalesced,
    detectionMs: reactiveRequest.createdAt - fenAvailableAt,
    permanentBoardRemovalUnmounted,
  };
}

async function runUserscriptEvalBarPolishTest() {
  history.replaceState({}, '', '/analysis/final-polish');
  const shell = document.createElement('div');
  const board = document.createElement('div');
  Object.assign(shell.style, { width: '480px', height: '480px', marginLeft: '80px' });
  Object.assign(board.style, { width: '480px', height: '480px' });
  shell.append(board);
  document.body.append(shell);
  let orientation: 'white' | 'black' = 'white';
  let now = 0;
  const initialFen = '4k3/8/8/8/8/8/P7/4K3 w - - 0 1';
  let fen = initialFen;
  let cacheContext = 'final-polish-fixture';
  let authorization: 'analysis' | null = 'analysis';
  const requests: EvalRequest[] = [];
  const adapter = createUserscriptEvalBar({
    window,
    document,
    getFen: () => fen,
    getBoard: () => board,
    getOrientation: () => orientation,
    getCacheContext: () => cacheContext,
    authorize: () => authorization,
    shouldDisplay: () => true,
    requestEvaluation: request => {
      requests.push(request);
      return { abort: () => undefined };
    },
    pollIntervalMs: 60000,
    refreshIntervalMs: 60000,
    now: () => now,
  });
  adapter.start(true);
  const request = requests[0];
  const root = document.querySelector<HTMLElement>('#thinker-eval-v2-rail')!;
  const fill = root.querySelector<HTMLElement>('.thinker-eval-v2-fill')!;
  const label = root.querySelector<HTMLElement>('.thinker-eval-v2-score')!;
  const railRect = root.getBoundingClientRect();

  request.onProgress({ type: 'info', sequence: 1, cp: -340, mate: null, depth: 8 });
  await nextFrame();
  const blackNormalRect = label.getBoundingClientRect();
  const blackNormal = {
    label: label.textContent,
    favoredColor: root.dataset.favoredColor,
    edgeDelta: Math.abs(blackNormalRect.top - railRect.top),
    color: getComputedStyle(label).color,
  };

  orientation = 'black';
  adapter.pollNow();
  await nextFrame();
  const blackInvertedRect = label.getBoundingClientRect();
  const blackInverted = {
    label: label.textContent,
    favoredColor: root.dataset.favoredColor,
    edgeDelta: Math.abs(blackInvertedRect.bottom - railRect.bottom),
    color: getComputedStyle(label).color,
  };

  now = 10;
  request.onProgress({ type: 'info', sequence: 2, cp: 250, mate: null, depth: 9 });
  await nextFrame();
  const whiteInvertedRect = label.getBoundingClientRect();
  const whiteInverted = {
    label: label.textContent,
    favoredColor: root.dataset.favoredColor,
    edgeDelta: Math.abs(whiteInvertedRect.top - railRect.top),
    color: getComputedStyle(label).color,
  };

  orientation = 'white';
  adapter.pollNow();
  await nextFrame();
  const whiteNormalRect = label.getBoundingClientRect();
  const whiteNormal = {
    label: label.textContent,
    favoredColor: root.dataset.favoredColor,
    edgeDelta: Math.abs(whiteNormalRect.bottom - railRect.bottom),
    color: getComputedStyle(label).color,
  };

  now = 20;
  request.onProgress({ type: 'info', sequence: 3, cp: 380, mate: null, depth: 10 });
  await nextFrame();
  const rootBeforeNoise = root;
  for (let index = 0; index < 100; index += 1) {
    now += index % 3 === 0 ? 2.1 : index % 3 === 1 ? 1.7 : 1.3;
    request.onProgress({
      type: 'info',
      sequence: index + 4,
      cp: 350 + ((index * 17) % 41),
      mate: null,
      depth: index + 11,
    });
  }
  const duringNoise = {
    label: label.textContent,
    roots: document.querySelectorAll('#thinker-eval-v2-rail').length,
    sameRoot: document.querySelector('#thinker-eval-v2-rail') === rootBeforeNoise,
    fillOpacity: getComputedStyle(fill).opacity,
    labelOpacity: getComputedStyle(label).opacity,
    presentation: adapter.snapshot().presentation,
  };
  await new Promise(resolve => setTimeout(resolve, 280));
  const afterTimedFlush = {
    label: label.textContent,
    presentation: adapter.snapshot().presentation,
  };
  now += 10;
  request.onProgress({ type: 'info', sequence: 104, cp: 355, mate: null, depth: 111 });
  fen = '4k3/8/8/8/8/8/1P6/4K3 b - - 0 2';
  cacheContext = 'final-polish-other-context';
  authorization = null;
  await new Promise(resolve => setTimeout(resolve, 260));
  const blockedPendingScore = adapter.snapshot().presentation.pending?.score;
  const staleTimerBlocked = label.textContent === afterTimedFlush.label
    && blockedPendingScore?.kind === 'cp'
    && blockedPendingScore.cp === 355;
  fen = initialFen;
  cacheContext = 'final-polish-fixture';
  authorization = 'analysis';
  now = 210;
  request.onResult({ type: 'result', sequence: 105, cp: 360, mate: null, depth: 112 });
  await nextFrame();
  const final = {
    label: label.textContent,
    favoredColor: root.dataset.favoredColor,
    targetFraction: adapter.snapshot().targetFraction,
    rawEvaluation: adapter.snapshot().lastEvaluation,
    presentation: adapter.snapshot().presentation,
    roots: document.querySelectorAll('#thinker-eval-v2-rail').length,
  };
  adapter.destroy();
  shell.remove();
  return {
    blackNormal,
    blackInverted,
    whiteInverted,
    whiteNormal,
    duringNoise,
    afterTimedFlush,
    staleTimerBlocked,
    final,
    rootsAfterDestroy: document.querySelectorAll('#thinker-eval-v2-rail').length,
  };
}

Object.assign(globalThis, {
  runUserscriptEvalBarBrowserTest,
  runUserscriptEvalBarVisualTest,
  runUserscriptEvalBarContinuityTest,
  runUserscriptEvalBarReactiveFenTest,
  runUserscriptEvalBarPolishTest,
});
