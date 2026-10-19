import '../src/ui/eval-bar.css';
import { createUserscriptEvalBar, type EvalRequest } from '../../frontend/eval_bar/userscript-adapter';

const nextFrame = (): Promise<number> => new Promise(resolve => requestAnimationFrame(resolve));
const waitFrames = async (count = 8): Promise<void> => {
  for (let index = 0; index < count; index += 1) await nextFrame();
};

async function runUserscriptEvalBarBrowserTest() {
  history.replaceState({}, '', '/analysis/fixture');
  const shell = document.createElement('div');
  const board = document.createElement('div');
  board.id = 'board-fixture';
  Object.assign(shell.style, { display: 'block', width: '640px', height: '640px' });
  Object.assign(board.style, { width: '600px', height: '600px' });
  shell.append(board);
  document.body.append(shell);

  let fen = 'fen-a';
  let orientation: 'white' | 'black' = 'white';
  let authorized = true;
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
    authorize: () => authorized ? 'analysis' : null,
    requestEvaluation: request => {
      requests.push(request);
      return { abort: () => { abortCount += 1; } };
    },
    addStyle: css => {
      const style = document.createElement('style');
      style.textContent = css || '.thinker-eval-v2-rail{contain:layout paint}';
      document.head.append(style);
      return style;
    },
    pollIntervalMs: 60000,
    refreshIntervalMs: 60000,
  });
  adapter.start(true);
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
  secondRequest.onResult({ mate: 3, depth: 20 });
  await waitFrames(4);
  const mateBlackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  secondRequest.onResult({ mate: -2, depth: 20 });
  await waitFrames(4);
  const negativeMateBlackLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  secondRequest.onResult({ cp: 0, depth: 20 });
  await waitFrames(4);
  const neutralLabel = document.querySelector<HTMLElement>('.thinker-eval-v2-score')?.textContent;
  const beforeCacheMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;
  fen = 'fen-c';
  adapter.pollNow();
  const afterCacheMiss = document.querySelector<HTMLElement>('.thinker-eval-v2-fill')?.style.transform;
  const staleState = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state;
  fen = 'fen-b';
  adapter.pollNow();
  const cacheState = document.querySelector<HTMLElement>('.thinker-eval-v2-rail')?.dataset.state;
  await waitFrames(4);

  authorized = false;
  window.dispatchEvent(new PopStateEvent('popstate'));
  await waitFrames(2);
  const unmountedWhenUnauthorized = !document.getElementById('thinker-eval-v2-rail');
  authorized = true;
  window.dispatchEvent(new PopStateEvent('popstate'));
  await waitFrames(2);
  const remountedAfterSpaRoute = Boolean(document.getElementById('thinker-eval-v2-rail'));
  adapter.destroy();

  authorized = true;
  for (let index = 0; index < 40; index += 1) {
    const instance = createUserscriptEvalBar({
      window,
      document,
      getFen: () => `remount-${index}`,
      getBoard: () => board,
      getOrientation: () => 'white',
      authorize: () => 'analysis',
      requestEvaluation: () => null,
      pollIntervalMs: 60000,
    });
    instance.start(true);
    instance.destroy();
  }
  const rootsAfterDestroy = document.querySelectorAll('#thinker-eval-v2-rail').length;
  const styleMarkers = document.querySelectorAll('#thinker-eval-v2-style').length;
  window.requestAnimationFrame = nativeRequestFrame;
  window.cancelAnimationFrame = nativeCancelFrame;
  shell.remove();

  return {
    staleRejected: staleLabel === '0.0',
    negativeRendered: Boolean(negativeLabel?.startsWith('-')) && Boolean(negativeTransform?.startsWith('scaleY(')),
    cachedOrientationRendered: orientationCacheLabel === '+2.4',
    matePerspectiveRendered: mateBlackLabel === '#-3',
    negativeMatePerspectiveRendered: negativeMateBlackLabel === '#2',
    neutralRendered: neutralLabel === '0.0',
    cacheMissPreservedVisual: beforeCacheMiss === afterCacheMiss && staleState === 'stale',
    cacheHitMarkedFresh: cacheState === 'fresh',
    abortCount,
    unmountedWhenUnauthorized,
    remountedAfterSpaRoute,
    rootsAfterDestroy,
    styleMarkers,
    maximumPendingFramesDuringBurst,
  };
}

Object.assign(globalThis, { runUserscriptEvalBarBrowserTest });
