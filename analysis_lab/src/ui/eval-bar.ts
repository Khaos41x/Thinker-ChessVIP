import { MODEL_VERSIONS, type EvalBarSample } from '../analysis/contracts';

export const EVAL_BAR_TIME_CONSTANT_MS = 110;

type FrameCallback = (timestamp: number) => void;

export type EvalBarScheduler = Readonly<{
  now: () => number;
  requestFrame: (callback: FrameCallback) => number;
  cancelFrame: (handle: number) => void;
}>;

export type EvalBarElements = Readonly<{
  root: HTMLElement;
  fill: HTMLElement;
  label: HTMLElement;
}>;

const browserScheduler: EvalBarScheduler = {
  now: () => performance.now(),
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: handle => cancelAnimationFrame(handle),
};

const clampFraction = (value: number): number => {
  if (!Number.isFinite(value)) throw new TypeError('eval bar fraction must be finite');
  return Math.max(0, Math.min(1, value));
};

export class EvalBarController {
  readonly modelVersion = MODEL_VERSIONS.evalBar;
  private readonly elements: EvalBarElements;
  private readonly scheduler: EvalBarScheduler;
  private readonly reducedMotion: boolean;
  private readonly onFrameCommitted: ((snapshot: ReturnType<EvalBarController['snapshot']>) => void) | undefined;
  private activeSearchId = 0;
  private mailbox: EvalBarSample | null = null;
  private frameHandle: number | null = null;
  private lastTimestamp: number | null = null;
  private current = 0.5;
  private target = 0.5;

  constructor(
    elements: EvalBarElements,
    options: Readonly<{
      scheduler?: EvalBarScheduler;
      initialFraction?: number;
      reducedMotion?: boolean;
      onFrameCommitted?: (snapshot: ReturnType<EvalBarController['snapshot']>) => void;
    }> = {},
  ) {
    this.elements = elements;
    this.scheduler = options.scheduler ?? browserScheduler;
    this.reducedMotion = options.reducedMotion
      ?? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ?? false;
    this.onFrameCommitted = options.onFrameCommitted;
    this.current = clampFraction(options.initialFraction ?? 0.5);
    this.target = this.current;
    this.commitTransform();
  }

  beginSearch(searchId: number, cachedSample: EvalBarSample | null = null): void {
    if (!Number.isSafeInteger(searchId) || searchId < 0) throw new RangeError('searchId must be a non-negative safe integer');
    this.cancelScheduledFrame();
    this.activeSearchId = searchId;
    this.mailbox = null;
    this.target = this.current;
    this.lastTimestamp = null;
    if (cachedSample) this.publish(cachedSample);
  }

  publish(sample: EvalBarSample): boolean {
    if (sample.searchId !== this.activeSearchId) return false;
    clampFraction(sample.fraction);
    this.mailbox = sample;
    if (this.frameHandle === null) {
      this.lastTimestamp = this.scheduler.now();
      this.frameHandle = this.scheduler.requestFrame(timestamp => this.animate(timestamp));
    }
    return true;
  }

  setOrientation(orientation: 'white' | 'black'): void {
    this.elements.root.dataset.orientation = orientation;
  }

  reset(fraction = 0.5, label = '—'): void {
    this.cancelScheduledFrame();
    this.mailbox = null;
    this.lastTimestamp = null;
    this.current = clampFraction(fraction);
    this.target = this.current;
    this.elements.label.textContent = label;
    this.commitTransform();
  }

  destroy(): void {
    this.cancelScheduledFrame();
    this.mailbox = null;
  }

  snapshot(): Readonly<{
    activeSearchId: number;
    current: number;
    target: number;
    hasPendingSample: boolean;
    hasScheduledFrame: boolean;
  }> {
    return Object.freeze({
      activeSearchId: this.activeSearchId,
      current: this.current,
      target: this.target,
      hasPendingSample: this.mailbox !== null,
      hasScheduledFrame: this.frameHandle !== null,
    });
  }

  private animate(timestamp: number): void {
    this.frameHandle = null;
    const sample = this.mailbox;
    this.mailbox = null;
    if (sample) {
      this.target = clampFraction(sample.fraction);
      this.elements.label.textContent = sample.label;
    }

    const previousTimestamp = this.lastTimestamp ?? timestamp;
    const elapsed = Math.max(0, timestamp - previousTimestamp);
    this.lastTimestamp = timestamp;
    if (this.reducedMotion) this.current = this.target;
    else {
      const alpha = 1 - Math.exp(-elapsed / EVAL_BAR_TIME_CONSTANT_MS);
      this.current += (this.target - this.current) * alpha;
    }

    if (Math.abs(this.target - this.current) <= 0.0001 && this.mailbox === null) {
      this.current = this.target;
      this.commitTransform();
      this.onFrameCommitted?.(this.snapshot());
      this.lastTimestamp = null;
      return;
    }

    this.commitTransform();
    this.onFrameCommitted?.(this.snapshot());
    this.frameHandle = this.scheduler.requestFrame(nextTimestamp => this.animate(nextTimestamp));
  }

  private commitTransform(): void {
    this.elements.fill.style.transform = `scaleY(${this.current})`;
  }

  private cancelScheduledFrame(): void {
    if (this.frameHandle !== null) this.scheduler.cancelFrame(this.frameHandle);
    this.frameHandle = null;
  }
}
