import { describe, expect, it } from 'vitest';
import { invalidateEvaluation } from '../src/analysis-state.js';

describe('analysis state', () => {
  it('invalidates queued output and clears a visible evaluation', () => {
    const state = { searchId: 8, evaluation: { lines: [{ pv: ['e2e4', 'e7e5'] }] } };
    invalidateEvaluation(state);
    expect(state).toEqual({ searchId: 9, evaluation: null });
  });
});
