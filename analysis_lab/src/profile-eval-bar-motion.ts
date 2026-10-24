import './ui/eval-bar.css';
import { EvalBarController } from './ui/eval-bar';
import { engineScoreFromUci, normalizeEvaluation } from './analysis/evaluation';
import { correlateMovingFrames } from './profile-motion-metrics.js';
import { createUserscriptEvalBar, UserscriptEvalBar } from '../../frontend/eval_bar/userscript-adapter';

type Internal = Record<string, any>;
const percentile = (values: number[], q: number) => {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered.length ? ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * q))] : null;
};

async function runMotionTrace(server: string, token: string, noise = false) {
  history.replaceState({}, '', '/analysis/motion-profile');
  const frames: Internal[] = [];
  const accepted: Internal[] = [];
  const events: Internal[] = [];
  const longTasks: Internal[] = [];
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) longTasks.push({ start: entry.startTime, duration: entry.duration });
  });
  observer.observe({ type: 'longtask', buffered: false });
  const board = document.createElement('div');
  Object.assign(board.style, { position: 'absolute', top: '40px', left: '80px', width: '600px', height: '600px', background: '#766' });
  const clock = document.createElement('span');
  document.body.append(board, clock);
  let geometryCalls = 0;
  let maxPending = 0;
  let pending = 0;
  const prototype = EvalBarController.prototype as unknown as Internal;
  const originalPublish = prototype.publish;
  const originalAnimate = prototype.animate;
  const adapterPrototype = UserscriptEvalBar.prototype as unknown as Internal;
  const originalGeometry = adapterPrototype.syncGeometry;
  adapterPrototype.syncGeometry = function (...args: unknown[]) {
    geometryCalls += 1;
    return originalGeometry.apply(this, args);
  };
  prototype.publish = function (sample: Internal) {
    const result = originalPublish.call(this, sample);
    if (result) accepted.push({ at: performance.now(), fraction: sample.fraction, current: this.current });
    return result;
  };
  prototype.animate = function (timestamp: number) {
    originalAnimate.call(this, timestamp);
    frames.push({ at: performance.now(), timestamp, current: this.current, target: this.target, transform: this.elements.fill.style.transform });
  };
  const nativeRequest = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const handles = new Set<number>();
  window.requestAnimationFrame = callback => {
    const handle = nativeRequest(timestamp => {
      handles.delete(handle);
      pending = handles.size;
      callback(timestamp);
    });
    handles.add(handle);
    pending = handles.size;
    maxPending = Math.max(maxPending, pending);
    return handle;
  };
  window.cancelAnimationFrame = handle => { handles.delete(handle); nativeCancel(handle); };
  const fen = 'r2q1rk1/pp1bbppp/2np1n2/2p1p3/4P3/2NP1N2/PPPQBPPP/R1B1K2R w KQ - 4 9';
  let completed = false;
  let transportError = '';
  const adapter = createUserscriptEvalBar({
    window, document, getBoard: () => board, getFen: () => fen,
    getOrientation: () => 'white', getCacheContext: () => 'motion-real-smallnet',
    authorize: () => 'analysis', shouldDisplay: () => true, getRoute: () => '/analysis/motion-profile',
    pollIntervalMs: 60000, refreshIntervalMs: 60000, reducedMotion: false,
    requestEvaluation: request => {
      const abort = new AbortController();
      fetch(`${server}/eval-bar/stream`, {
        method: 'POST', signal: abort.signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, requestId: request.requestId, generation: request.generation, cacheContext: request.cacheContext, context: 'analysis' }),
      }).then(async response => {
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const chunk = await reader.read();
          buffer += decoder.decode(chunk.value, { stream: !chunk.done });
          const lines = buffer.split('\n');
          buffer = chunk.done ? '' : lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const payload = JSON.parse(line);
            events.push({ at: performance.now(), type: payload.type, depth: payload.depth, cp: payload.cp, mate: payload.mate });
            if (payload.type === 'started' || payload.type === 'info') request.onProgress(payload);
            else if (payload.type === 'result') { request.onResult(payload); completed = true; }
            else if (payload.type === 'error') throw new Error(payload.detail || payload.error);
          }
          if (chunk.done) break;
        }
      }).catch(error => { if (error.name !== 'AbortError') { transportError = String(error); request.onError(error); } });
      return { abort: () => abort.abort() };
    },
  });
  const noiseTimer = noise ? setInterval(() => { clock.textContent = String(performance.now()); }, 16) : null;
  const rafTimes: number[] = [];
  let sampling = true;
  const sampleFrame = (timestamp: number) => { rafTimes.push(timestamp); if (sampling) nativeRequest(sampleFrame); };
  nativeRequest(sampleFrame);
  adapter.start(true);
  const started = performance.now();
  while (!completed && !transportError && performance.now() - started < 18000) await new Promise(resolve => setTimeout(resolve, 50));
  await new Promise(resolve => setTimeout(resolve, 1200));
  sampling = false;
  if (noiseTimer !== null) clearInterval(noiseTimer);
  const snapshot = adapter.snapshot();
  const fillStyle = getComputedStyle(document.querySelector('.thinker-eval-v2-fill')!);
  const cssTransition = { property: fillStyle.transitionProperty, duration: fillStyle.transitionDuration, animation: fillStyle.animationName };
  adapter.destroy();
  observer.disconnect();
  prototype.publish = originalPublish;
  prototype.animate = originalAnimate;
  adapterPrototype.syncGeometry = originalGeometry;
  window.requestAnimationFrame = nativeRequest;
  window.cancelAnimationFrame = nativeCancel;
  board.remove(); clock.remove();
  const intervals = rafTimes.slice(1).map((value, index) => value - rafTimes[index]);
  const motion = correlateMovingFrames(accepted, frames);
  const latencies = motion.latencies;
  const finalAccepted = accepted.at(-1);
  const convergence = finalAccepted ? frames.find(frame => frame.at >= finalAccepted.at && Math.abs(frame.current - finalAccepted.fraction) <= 0.0001) : null;
  const targetGaps = accepted.slice(1).map((value, index) => value.at - accepted[index].at);
  const receiptDelays: number[] = [];
  for (const value of accepted) {
    const received = events.filter(event => (event.type === 'info' || event.type === 'result')
      && event.at <= value.at && (event.cp !== null && event.cp !== undefined || event.mate !== null && event.mate !== undefined)
      && Math.abs(normalizeEvaluation(engineScoreFromUci(event)).whiteVisualFraction - value.fraction) < 1e-12).at(-1);
    if (received) {
      value.receivedAt = received.at;
      value.receiptToAcceptedMs = value.at - received.at;
      receiptDelays.push(value.receiptToAcceptedMs);
    }
  }
  const segments = frames.slice(1).map((frame, index) => ({ frame, previous: frames[index] }));
  return {
    completed, transportError, visible: document.visibilityState, noise, engine: snapshot.lastEvaluation,
    frames, accepted, events, longTasks, geometryCalls, maxConcurrentAnimationFrames: maxPending, mountCount: snapshot.mountCount,
    cssTransition,
    intervals: { median: percentile(intervals, .5), p95: percentile(intervals, .95), worst: Math.max(...intervals), count: intervals.length, over25ms: intervals.filter(value => value > 25).length },
    selectedTargetGapsMs: { median: percentile(targetGaps, .5), p95: percentile(targetGaps, .95), worst: Math.max(...targetGaps) },
    receivedToSelectedMs: { median: percentile(receiptDelays, .5), p95: percentile(receiptDelays, .95), worst: Math.max(...receiptDelays) },
    acceptedToFirstMovingFrameMs: { median: percentile(latencies, .5), p95: percentile(latencies, .95), worst: Math.max(...latencies) },
    convergenceMs: convergence && finalAccepted ? convergence.at - finalAccepted.at : null,
    movementRequiredAcceptedSamples: motion.movementRequired,
    supersededBeforeMovingSamples: motion.supersededBeforeMoving,
    noMatchingMovingFrameSamples: motion.noMatchingMovingFrame,
    scaleYOnly: frames.every(frame => /^scaleY\([\d.e+-]+\)$/.test(frame.transform)),
    noOvershoot: segments.every(({ frame, previous }) => frame.current >= Math.min(previous.current, frame.target) - 1e-10 && frame.current <= Math.max(previous.current, frame.target) + 1e-10),
    stationaryFramesWhilePursuing: segments.filter(({ frame, previous }) => Math.abs(frame.current - previous.current) < 1e-10 && Math.abs(frame.target - frame.current) > .0001).length,
  };
}

Object.assign(globalThis, { runMotionTrace });
