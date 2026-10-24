import { describe, expect, it } from 'vitest';
import { correlateMovingFrames } from '../src/profile-motion-metrics.js';

describe('motion trace sample correlation', () => {
  it('does not credit movement caused by the next accepted mailbox sample', () => {
    const measured = correlateMovingFrames([
      { at: 1, fraction: .7, current: .5 },
      { at: 2, fraction: .9, current: .5 },
    ], [
      { at: 8, current: .55, target: .9 },
    ]);
    expect(measured).toEqual({ latencies: [6], movementRequired: 2, supersededBeforeMoving: 1, noMatchingMovingFrame: 0 });
  });

  it('requires the frame target to match and excludes settled identical targets', () => {
    const measured = correlateMovingFrames([
      { at: 1, fraction: .7, current: .5 },
      { at: 10, fraction: .5, current: .5 },
      { at: 20, fraction: .8, current: .5 },
    ], [
      { at: 4, current: .6, target: .9 },
      { at: 12, current: .55, target: .7 },
      { at: 24, current: .55, target: .8 },
    ]);
    expect(measured).toEqual({ latencies: [4], movementRequired: 2, supersededBeforeMoving: 1, noMatchingMovingFrame: 0 });
  });
});
