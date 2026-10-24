import { spawn } from 'node:child_process';
import { access, mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const host = '127.0.0.1';
const repositoryRoot = resolve(import.meta.dirname, '..', '..');
const labRoot = join(repositoryRoot, 'analysis_lab');
const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const delay = milliseconds => new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));
const port = () => new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, host, () => {
    const address = server.address();
    server.close(error => error ? reject(error) : resolvePort(address.port));
  });
});
const waitJson = async url => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return response.json();
    } catch {}
    await delay(100);
  }
  throw new Error(`timeout waiting for ${url}`);
};
const waitAvailable = async url => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error(`timeout waiting for ${url}`);
};
const connect = async url => {
  const socket = new WebSocket(url);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  return {
    socket,
    send(method, params = {}) {
      return new Promise((resolveSend, reject) => {
        const id = nextId++;
        pending.set(id, { resolve: resolveSend, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
};

const evaluatePromise = async (cdp, expression, timeoutMs, label) => {
  const key = `__thinkerCdpResult${Date.now()}${Math.random().toString(16).slice(2)}`;
  await cdp.send('Runtime.evaluate', {
    expression: `globalThis.${key} = { status: 'pending' };
      Promise.resolve(${expression}).then(
        value => { globalThis.${key} = { status: 'done', value }; },
        error => { globalThis.${key} = { status: 'error', error: String(error?.stack || error) }; },
      );`,
  });
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await cdp.send('Runtime.evaluate', {
      expression: `globalThis.${key}`,
      returnByValue: true,
    });
    const state = response.result.value;
    if (state?.status === 'done') return state.value;
    if (state?.status === 'error') throw new Error(state.error);
    await delay(100);
  }
  throw new Error(`${label} timeout`);
};

let browserPath = null;
for (const candidate of candidates) {
  try {
    await access(candidate);
    browserPath = candidate;
    break;
  } catch {}
}
if (!browserPath) {
  console.log(JSON.stringify({ unavailable: true, reason: 'Chromium not found' }, null, 2));
  process.exit(0);
}

const vitePort = await port();
let debugPort = await port();
while (debugPort === vitePort) debugPort = await port();
const profile = await mkdtemp(join(tmpdir(), 'thinker-eval-v2-'));
const url = `http://${host}:${vitePort}/profile-userscript-eval-bar.html`;
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', host, '--port', String(vitePort), '--strictPort'], {
  cwd: labRoot,
  stdio: 'ignore',
  windowsHide: true,
});
let browser;
let cdp;

try {
  console.log('eval-bar browser: waiting for fixture');
  await waitAvailable(url);
  console.log('eval-bar browser: fixture ready');
  browser = spawn(browserPath, [
    '--headless=new',
    '--js-flags=--expose-gc',
    '--force-prefers-reduced-motion=no-preference',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  await waitJson(`http://${host}:${debugPort}/json/version`);
  console.log('eval-bar browser: chromium ready');
  const targetResponse = await fetch(`http://${host}:${debugPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await targetResponse.json();
  cdp = await connect(target.webSocketDebuggerUrl);
  console.log('eval-bar browser: CDP connected');
  await cdp.send('Runtime.enable');
  await cdp.send('HeapProfiler.enable');
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await cdp.send('Runtime.evaluate', {
      expression: "document.readyState === 'complete' && typeof runUserscriptEvalBarBrowserTest === 'function'",
      returnByValue: true,
    });
    if (ready.result.value) break;
    if (attempt === 99) throw new Error('browser fixture did not become ready');
    await delay(100);
  }
  console.log('eval-bar browser: running fixture');
  await cdp.send('HeapProfiler.collectGarbage');
  const before = await cdp.send('Runtime.getHeapUsage');
  const behaviorResult = await evaluatePromise(cdp, 'runUserscriptEvalBarBrowserTest()', 15000, 'browser fixture');
  await cdp.send('HeapProfiler.collectGarbage');
  const after = await cdp.send('Runtime.getHeapUsage');
  const result = {
    browser: browserPath,
    behavior: behaviorResult,
    retainedHeapDeltaBytes: after.usedSize - before.usedSize,
  };
  const continuityEvaluation = await cdp.send('Runtime.evaluate', {
    expression: `Promise.race([
      runUserscriptEvalBarContinuityTest(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('continuity fixture timeout')), 15000)),
    ])`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (continuityEvaluation.exceptionDetails) {
    throw new Error(continuityEvaluation.exceptionDetails.exception?.description || continuityEvaluation.exceptionDetails.text);
  }
  result.continuity = continuityEvaluation.result.value;
  const reactiveEvaluation = await cdp.send('Runtime.evaluate', {
    expression: `Promise.race([
      runUserscriptEvalBarReactiveFenTest(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('reactive FEN fixture timeout')), 10000)),
    ])`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (reactiveEvaluation.exceptionDetails) {
    throw new Error(reactiveEvaluation.exceptionDetails.exception?.description || reactiveEvaluation.exceptionDetails.text);
  }
  result.reactiveFen = reactiveEvaluation.result.value;
  result.polish = await evaluatePromise(cdp, 'runUserscriptEvalBarPolishTest()', 15000, 'final polish fixture');
  const visualResults = [];
  const visualViewports = [
    { width: 900, height: 700 },
    { width: 959, height: 720 },
    { width: 960, height: 720 },
    { width: 961, height: 720 },
    { width: 1280, height: 720 },
  ];
  for (const viewport of visualViewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const visual = await cdp.send('Runtime.evaluate', {
      expression: `Promise.race([
        runUserscriptEvalBarVisualTest(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('visual fixture timeout')), 10000)),
      ])`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (visual.exceptionDetails) throw new Error(visual.exceptionDetails.exception?.description || visual.exceptionDetails.text);
    visualResults.push(visual.result.value);
  }
  result.visual = visualResults;
  const behavior = result.behavior;
  const continuity = result.continuity;
  const summarize = key => {
    const values = continuity.transitions.map(transition => transition[key]);
    return {
      minimum: Math.min(...values),
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      maximum: Math.max(...values),
    };
  };
  result.continuitySummary = {
    transitions: continuity.transitions.length,
    detectionMs: summarize('detectionMs'),
    firstEvaluationMs: summarize('firstEvaluationMs'),
    firstFrameMs: summarize('firstFrameMs'),
    fillOpacities: [...new Set(continuity.transitions.map(transition => transition.pendingVisual.fillOpacity))],
    labelOpacities: [...new Set(continuity.transitions.map(transition => transition.pendingVisual.labelOpacity))],
    neutralResets: continuity.transitions.filter(transition => transition.pendingFraction !== transition.priorFraction).length,
    domRemounts: continuity.finalSnapshot.mountCount - 1,
    boardRetargets: continuity.finalSnapshot.boardRetargetCount,
    obsoleteEventsRejected: continuity.finalSnapshot.staleResultCount,
    aborts: continuity.finalSnapshot.abortCount,
  };
  const evidenceDirectory = join(repositoryRoot, '_bmad-output', 'implementation-artifacts', 'autoplay-field-eval-anchor');
  await mkdir(evidenceDirectory, { recursive: true });
  await writeFile(join(evidenceDirectory, 'scroll-validation.json'), JSON.stringify({
    fixture: 'Chromium deterministic analysis fixture; not authenticated Chess.com',
    behavior: result.behavior,
    continuity: result.continuitySummary,
    visual: result.visual,
  }, null, 2));
  console.log(JSON.stringify({
    browser: result.browser,
    behavior: result.behavior,
    retainedHeapDeltaBytes: result.retainedHeapDeltaBytes,
    continuitySummary: result.continuitySummary,
    reactiveFen: result.reactiveFen,
    polish: result.polish,
    visual: result.visual,
  }, null, 2));
  const continuityPasses = continuity.requestCount === 31
    && continuity.rootsAfterDestroy === 0
    && continuity.finalSnapshot.mountCount === 1
    && continuity.finalSnapshot.boardRetargetCount === 1
    && continuity.finalSnapshot.staleResultCount >= 30
    && continuity.transitions.length === 30
    && continuity.transitions.every(transition => {
      const pending = transition.pendingVisual;
      const geometry = transition.geometry;
      const initialGeometry = continuity.initialGeometry;
      const movedContinuously = Math.abs(transition.updatedFraction - transition.pendingFraction) > 0
        && (transition.targetFraction > transition.pendingFraction
          ? transition.updatedFraction > transition.pendingFraction && transition.updatedFraction < transition.targetFraction
          : transition.updatedFraction < transition.pendingFraction && transition.updatedFraction > transition.targetFraction);
      return transition.detectionMs >= 0
        && transition.detectionMs < 100
        && transition.firstEvaluationMs >= 0
        && transition.firstFrameMs >= 0
        && transition.firstFrameMs < 100
        && transition.sameRoot
        && transition.requestAborted
        && transition.pendingFraction === transition.priorFraction
        && pending.fillOpacity === '1'
        && pending.labelOpacity === '1'
        && pending.transform === transition.priorTransform
        && pending.label === transition.priorLabel
        && pending.state === 'stale'
        && pending.roots === 1
        && transition.afterObsolete.transform === transition.priorTransform
        && transition.afterObsolete.label === transition.priorLabel
        && transition.afterObsolete.staleResultCount >= transition.move
        && movedContinuously
        && transition.renderedFen === `4k3/8/8/8/8/8/P7/4K3 ${transition.move % 2 ? 'b' : 'w'} - - 0 ${transition.move + 1}`
        && transition.visualStale === false
        && geometry.left === initialGeometry.left
        && geometry.top === initialGeometry.top
        && geometry.width === initialGeometry.width
        && geometry.height === initialGeometry.height
        && geometry.placement === initialGeometry.placement;
    });
  const visualPasses = visualResults.every((visual, index) => {
    const geometrySets = [visual.baseline, visual.resized, visual.scrolled];
    const geometryAligned = geometrySets.every(geometry => geometry.heightDelta <= 1
      && geometry.topDelta <= 1 && Math.abs(geometry.gap - 10) <= 1);
    const expectedBoardSize = visual.viewport.width === 900 ? 528 : visual.viewport.width === 1280 ? 584 : 480;
    return visual.viewport.width === visualViewports[index].width
      && visual.viewport.height === visualViewports[index].height
      && Math.abs(visual.baseline.width - visual.expectedWidth) <= 1
      && geometryAligned
      && visual.position === 'absolute'
      && visual.immediateScrollFrames.length === 30
      && visual.immediateScrollFrames.every(frame => frame.topDelta <= 1 && frame.bottomDelta <= 1 && frame.anchorUnchanged)
      && visual.positionedBody.topDelta <= 1 && visual.positionedBody.bottomDelta <= 1
      && visual.baseline.placement === 'left'
      && visual.boardSize === expectedBoardSize
      && visual.styles.dark === 'rgb(64, 61, 57)'
      && visual.styles.light === 'rgb(255, 255, 255)'
      && visual.styles.draw === 'rgb(119, 117, 116)'
      && visual.styles.radius === '2px'
      && visual.styles.borderTopWidth === '0px'
      && visual.styles.shadow === 'none'
      && /Segoe UI|system-ui/.test(visual.styles.fontFamily)
      && visual.styles.fontSize === '10px'
      && visual.styles.fontWeight === '600'
      && visual.styles.lineHeight === '14.3px'
      && visual.styles.labelColor === 'rgb(64, 61, 57)'
      && visual.styles.mixBlendMode === 'normal'
      && visual.styles.writingMode === 'horizontal-tb'
      && visual.styles.labelTransform === 'none'
      && visual.styles.score === '10.3'
      && /^scaleY\([0-9.]+\)$/.test(visual.styles.fillTransform)
      && visual.styles.fillInlineHeight === ''
      && visual.styles.paddingTop === '5px'
      && visual.styles.paddingBottom === '5px'
      && Math.abs(visual.styles.labelHeight - 24.3) <= 1
      && Math.abs(visual.styles.whiteOriginY - visual.boardSize) <= 1
      && visual.baseline.labelBottomDelta <= 1
      && visual.baseline.labelCenterDelta <= 1
      && visual.flipped.labelTopDelta <= 1
      && visual.flipped.labelCenterDelta <= 1
      && visual.flipped.originY <= 1
      && visual.scrolled.scrollY > 0
      && visual.rightFallback.placement === 'right'
      && Math.abs(visual.rightFallback.gap - 10) <= 1
      && visual.overlayFallback.placement === 'overlay'
      && visual.overlayFallback.leftDelta <= 1
      && visual.geometry?.width === visual.expectedWidth
      && visual.hostPreserved
      && visual.rootsAfterDestroy === 0;
  });
  const polish = result.polish;
  const polishPasses = polish.blackNormal.label === '3.4'
    && polish.blackNormal.favoredColor === 'black'
    && polish.blackNormal.edgeDelta <= 1
    && polish.blackNormal.color === 'rgb(255, 255, 255)'
    && polish.blackInverted.label === '3.4'
    && polish.blackInverted.favoredColor === 'black'
    && polish.blackInverted.edgeDelta <= 1
    && polish.blackInverted.color === 'rgb(255, 255, 255)'
    && polish.whiteInverted.label === '2.5'
    && polish.whiteInverted.favoredColor === 'white'
    && polish.whiteInverted.edgeDelta <= 1
    && polish.whiteInverted.color === 'rgb(64, 61, 57)'
    && polish.whiteNormal.label === '2.5'
    && polish.whiteNormal.favoredColor === 'white'
    && polish.whiteNormal.edgeDelta <= 1
    && polish.whiteNormal.color === 'rgb(64, 61, 57)'
    && polish.duringNoise.label === '3.8'
    && polish.duringNoise.roots === 1
    && polish.duringNoise.sameRoot
    && polish.duringNoise.fillOpacity === '1'
    && polish.duringNoise.labelOpacity === '1'
    && polish.duringNoise.presentation.coalescedCount === 100
    && polish.afterTimedFlush.label === '3.5'
    && polish.afterTimedFlush.presentation.selected.score.cp === 352
    && polish.afterTimedFlush.presentation.pending === null
    && polish.staleTimerBlocked
    && polish.final.label === '3.6'
    && polish.final.favoredColor === 'white'
    && polish.final.rawEvaluation.cp === 360
    && polish.final.presentation.selected.score.cp === 360
    && polish.final.presentation.pending === null
    && polish.final.targetFraction === polish.final.presentation.selected.fraction
    && polish.final.roots === 1
    && polish.rootsAfterDestroy === 0;
  if (
    !behavior.domPreserved || !behavior.singleRootAfterRepeatedStart
    || !behavior.overlayAligned || !behavior.parentPreservedAfterDestroy
    || !behavior.staleRejected || !behavior.negativeRendered || !behavior.cachedOrientationRendered
    || !behavior.oldSameFenCallbacksRejected || !behavior.requestIdsMonotonic
    || !behavior.matePerspectiveRendered || !behavior.negativeMatePerspectiveRendered
    || !behavior.neutralRendered
    || !behavior.contextMissPreservedVisual || !behavior.oldContextRejected || !behavior.contextCacheSeparated
    || !behavior.cacheMissPreservedVisual || !behavior.cacheHitMarkedFresh
    || !behavior.cacheHitContinuous
    || !behavior.missingFenWaiting || !behavior.backendFailureVisible || !behavior.recoveredAfterBackendFailure
    || !behavior.hiddenWhenBoardHidden || !behavior.visibleAfterBoardReturns
    || !behavior.mountedBlockedWhenUnauthorized || !behavior.noRequestWhenUnauthorized
    || !behavior.remountedAfterSpaRoute
    || behavior.rootsAfterDestroy !== 0
    || behavior.styleMarkers !== 1 || behavior.maximumPendingFramesDuringBurst > 1
    || result.retainedHeapDeltaBytes > 1_500_000
    || !continuityPasses
    || !result.reactiveFen.missingFenPreserved
    || !result.reactiveFen.propertyOnlyDetected
    || !result.reactiveFen.propertyOnlyRendered
    || !result.reactiveFen.burstCoalesced
    || !result.reactiveFen.permanentBoardRemovalUnmounted
    || !polishPasses
    || !visualPasses
  ) process.exitCode = 1;
} finally {
  cdp?.socket.close();
  browser?.kill();
  vite.kill();
  await delay(400);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
