import './ui/eval-bar.css';
import { EvalBarController } from './ui/eval-bar';

type ProfileResult = Readonly<{
  samplesPublished: number;
  animationFrames: number;
  elapsedMs: number;
  longTaskCount: number;
  longestTaskMs: number;
  frameIntervalP50Ms: number;
  frameIntervalP95Ms: number;
  frameIntervalP99Ms: number;
  framesOver20Ms: number;
  finalFraction: number;
  finalTarget: number;
}>;

const root = document.querySelector<HTMLElement>('#eval-rail');
const fill = document.querySelector<HTMLElement>('#eval-fill');
const label = document.querySelector<HTMLElement>('#eval-score');

if (!root || !fill || !label) throw new Error('eval bar profile elements are missing');

const controller = new EvalBarController({ root, fill, label });
controller.beginSearch(1);

const nextFrame = (): Promise<number> => new Promise(resolve => requestAnimationFrame(resolve));

const percentile = (values: readonly number[], quantile: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
};

const startEvalBarProfile = async (): Promise<ProfileResult> => {
  const longTasks: number[] = [];
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) longTasks.push(entry.duration);
  });
  observer.observe({ type: 'longtask', buffered: false });

  const intervals: number[] = [];
  const startedAt = performance.now();
  let previousFrame = await nextFrame();
  let animationFrames = 0;
  let samplesPublished = 0;

  for (let burst = 0; burst < 120; burst += 1) {
    for (let offset = 0; offset < 128; offset += 1) {
      const sequence = burst * 128 + offset;
      const fraction = 0.5 + Math.sin(sequence * 0.071) * 0.47;
      controller.publish({ searchId: 1, fraction, label: fraction.toFixed(3), favoredColor: fraction >= 0.5 ? 'white' : 'black' });
      samplesPublished += 1;
    }
    const timestamp = await nextFrame();
    intervals.push(timestamp - previousFrame);
    previousFrame = timestamp;
    animationFrames += 1;
  }

  controller.publish({ searchId: 1, fraction: 0.82, label: '+3.2', favoredColor: 'white' });
  samplesPublished += 1;
  for (let frame = 0; frame < 180 && controller.snapshot().hasScheduledFrame; frame += 1) {
    const timestamp = await nextFrame();
    intervals.push(timestamp - previousFrame);
    previousFrame = timestamp;
    animationFrames += 1;
  }

  await new Promise(resolve => setTimeout(resolve, 80));
  observer.disconnect();
  const snapshot = controller.snapshot();
  return Object.freeze({
    samplesPublished,
    animationFrames,
    elapsedMs: performance.now() - startedAt,
    longTaskCount: longTasks.length,
    longestTaskMs: longTasks.length === 0 ? 0 : Math.max(...longTasks),
    frameIntervalP50Ms: percentile(intervals, 0.5),
    frameIntervalP95Ms: percentile(intervals, 0.95),
    frameIntervalP99Ms: percentile(intervals, 0.99),
    framesOver20Ms: intervals.filter(interval => interval > 20).length,
    finalFraction: snapshot.current,
    finalTarget: snapshot.target,
  });
};

Object.assign(globalThis, { startEvalBarProfile });
