import { describe, expect, it } from 'vitest';
import { normalizeEvaluation } from '../src/analysis/evaluation';
import {
  EvalBarPresentationSelector,
  projectEvalBarPresentation,
} from '../../frontend/eval_bar/userscript-adapter';

const cp = (value: number, depth: number) => projectEvalBarPresentation({
  score: { kind: 'cp', cp: value },
  fraction: normalizeEvaluation({ kind: 'cp', cp: value }).whiteVisualFraction,
}, depth);

const mate = (value: number, depth: number) => projectEvalBarPresentation({
  score: { kind: 'mate', mate: value },
  fraction: normalizeEvaluation({ kind: 'mate', mate: value }).whiteVisualFraction,
}, depth);

describe('Eval Bar presentation projection', () => {
  it('keeps White POV math while rendering unsigned advantage for the favored color', () => {
    const black = cp(-340, 18);
    expect(black.label).toBe('3.4');
    expect(black.favoredColor).toBe('black');
    expect(black.fraction).toBe(normalizeEvaluation({ kind: 'cp', cp: -340 }).whiteVisualFraction);

    const white = cp(250, 18);
    expect(white.label).toBe('2.5');
    expect(white.favoredColor).toBe('white');
    expect(white.fraction).toBe(normalizeEvaluation({ kind: 'cp', cp: 250 }).whiteVisualFraction);
  });

  it('uses absolute mate distance and a stable neutral convention', () => {
    expect(mate(-3, 20)).toMatchObject({ label: '#3', favoredColor: 'black' });
    expect(mate(2, 20)).toMatchObject({ label: '#2', favoredColor: 'white' });
    expect(cp(0, 20)).toMatchObject({ label: '0.0', favoredColor: 'white' });
  });
});

describe('EvalBarPresentationSelector', () => {
  it('coalesces iterative noise and selects the latest coherent score', () => {
    const selector = new EvalBarPresentationSelector();
    expect(selector.consider(cp(380, 10), 0).selected?.label).toBe('3.8');
    expect(selector.consider(cp(340, 11), 80).coalesced).toBe(true);
    expect(selector.consider(cp(370, 12), 160).coalesced).toBe(true);
    expect(selector.consider(cp(360, 13), 260).selected?.label).toBe('3.6');
    expect(selector.snapshot()).toMatchObject({ coalescedCount: 2, selectedCount: 2, pending: null });
  });

  it('publishes material changes, meaningful sign changes, and mates immediately', () => {
    const selector = new EvalBarPresentationSelector();
    selector.consider(cp(80, 8), 0);
    expect(selector.consider(cp(220, 9), 20).selected?.label).toBe('2.2');
    expect(selector.consider(cp(-120, 10), 40).selected?.favoredColor).toBe('black');
    expect(selector.consider(mate(-4, 11), 60).selected).toMatchObject({ label: '#4', favoredColor: 'black' });
  });

  it('coalesces neutral sign noise coherently but never hides the terminal score', () => {
    const selector = new EvalBarPresentationSelector();
    selector.consider(cp(60, 8), 0);
    selector.consider(cp(-10, 9), 40);
    expect(selector.snapshot().pending).toMatchObject({ label: '0.1', favoredColor: 'black' });
    const terminal = selector.consider(cp(-12, 10), 60, true).selected;
    expect(terminal).toMatchObject({ label: '0.1', favoredColor: 'black' });
    expect(terminal?.score).toEqual({ kind: 'cp', cp: -12 });
  });

  it('rejects regressing depths and flushes only the latest pending candidate', () => {
    const selector = new EvalBarPresentationSelector();
    selector.consider(cp(300, 12), 0);
    expect(selector.consider(cp(310, 11), 50).rejectedDepth).toBe(true);
    selector.consider(cp(280, 13), 80);
    selector.consider(cp(270, 14), 120);
    expect(selector.flush(250)).toMatchObject({ label: '2.7', depth: 14 });
  });

  it('preserves selected depth and cadence across same-generation refreshes', () => {
    const selector = new EvalBarPresentationSelector();
    selector.consider(cp(300, 24), 0);
    selector.beginRefresh();
    expect(selector.consider(cp(420, 3), 5000).rejectedDepth).toBe(true);
    expect(selector.snapshot()).toMatchObject({ highestDepth: 24, selectedCount: 1, pending: null });
  });
});
