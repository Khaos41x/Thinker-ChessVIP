import { describe, expect, it } from 'vitest';
import { gameAccuracy, moveAccuracy, powerMean } from '../src/analysis/accuracy';
import { classifyCandidate } from '../src/analysis/classification';
import { FAIR_PLAY_GUARDRAIL, MODEL_PROVENANCE, type CandidateEvaluation, type EngineScore } from '../src/analysis/contracts';
import {
  engineScoreFromUci,
  normalizeEvaluation,
  scoreToExpectedPoints,
  scoreToVisualFraction,
  scoreToWinPercent,
} from '../src/analysis/evaluation';

const cp = (value: number): EngineScore => ({ kind: 'cp', cp: value });
const mate = (value: number): EngineScore => ({ kind: 'mate', mate: value });

const inverseExpectedPoints = (probability: number): EngineScore => ({
  kind: 'cp',
  cp: Math.log(probability / (1 - probability)) / 0.00368208,
});

const candidate = (fen: string, moveUci: string, score: EngineScore): CandidateEvaluation => ({
  sourceFen: fen,
  moveUci,
  score,
});

describe('model contracts and provenance', () => {
  it('restricts analysis to post-game and offline contexts', () => {
    expect(FAIR_PLAY_GUARDRAIL.authorizedContexts).toEqual(['post-game', 'offline-analysis']);
    expect(FAIR_PLAY_GUARDRAIL.prohibitedContexts).toContain('live-game');
    expect(MODEL_PROVENANCE.evaluation).toMatch(/Lichess/);
    expect(MODEL_PROVENANCE.classification).toMatch(/Thinker/);
  });

  it('requires exactly one finite UCI score', () => {
    expect(engineScoreFromUci({ cp: 42 })).toEqual(cp(42));
    expect(engineScoreFromUci({ mate: -3 })).toEqual(mate(-3));
    expect(() => engineScoreFromUci({ cp: 1, mate: 2 })).toThrow(/exactly one/);
    expect(() => engineScoreFromUci({})).toThrow(/exactly one/);
    expect(() => engineScoreFromUci({ cp: Number.NaN })).toThrow(/finite/);
    expect(() => engineScoreFromUci({ mate: 1.5 })).toThrow(/integer/);
    expect(() => engineScoreFromUci({ mate: 0 })).toThrow(/must not be zero/);
  });
});

describe('Lichess winning-chances reference model', () => {
  it.each([
    [0, 50],
    [100, 59.10258971916129],
    [200, 67.6211637485054],
    [1000, 97.54474363414323],
    [-1000, 2.455256365856777],
  ])('maps %i cp to the reference Win%%', (centipawns, expected) => {
    expect(scoreToWinPercent(cp(centipawns))).toBeCloseTo(expected, 12);
  });

  it('is symmetric and clamps centipawns at both saturation limits', () => {
    for (const value of [1, 25, 100, 450, 1000]) {
      expect(scoreToExpectedPoints(cp(value)) + scoreToExpectedPoints(cp(-value))).toBeCloseTo(1, 14);
    }
    expect(scoreToExpectedPoints(cp(10000))).toBeCloseTo(scoreToExpectedPoints(cp(1000)), 14);
    expect(scoreToExpectedPoints(cp(-10000))).toBeCloseTo(scoreToExpectedPoints(cp(-1000)), 14);
  });

  it.each([
    [1, 0.9993668437695776],
    [2, 0.9990852567762523],
    [5, 0.9972443102195412],
    [10, 0.982880813280861],
    [-1, 0.0006331562304224119],
    [-10, 0.01711918671913904],
  ])('maps mate %i with the reference distance curve', (distance, expected) => {
    expect(scoreToExpectedPoints(mate(distance))).toBeCloseTo(expected, 14);
  });

  it('inverts perspective without changing the canonical White evaluation', () => {
    const score = cp(180);
    const canonical = normalizeEvaluation(score);
    expect(scoreToExpectedPoints(score, 'black')).toBeCloseTo(1 - canonical.whiteExpectedPoints, 14);
    expect(scoreToVisualFraction(score)).toBe(canonical.whiteVisualFraction);
  });
});

describe('Classification V2 Expected Points contract', () => {
  const fen = '8/8/8/8/8/8/4K3/6k1 w - - 0 1';

  it.each([
    [0, 'best'],
    [0.02, 'excellent'],
    [0.05, 'good'],
    [0.1, 'inaccuracy'],
    [0.2, 'mistake'],
    [0.21, 'blunder'],
  ])('classifies an EP loss of %f as %s', (loss, expected) => {
    const result = classifyCandidate({
      beforeFen: fen,
      mover: 'white',
      best: candidate(fen, 'e2e3', inverseExpectedPoints(0.75)),
      played: candidate(fen, 'e2f2', inverseExpectedPoints(0.75 - loss)),
    });
    expect(result.classification).toBe(expected);
    expect(result.expectedPointsLoss).toBeCloseTo(loss, 12);
  });

  it('uses the mover perspective for Black', () => {
    const blackFen = '8/8/8/8/8/8/4K3/6k1 b - - 0 1';
    const best = candidate(blackFen, 'g1f1', inverseExpectedPoints(0.25));
    const played = candidate(blackFen, 'g1h1', inverseExpectedPoints(0.3));
    const result = classifyCandidate({ beforeFen: blackFen, mover: 'black', best, played });
    expect(result.expectedPointsLoss).toBeCloseTo(0.05, 12);
    expect(result.classification).toBe('good');
  });

  it('rejects candidates analyzed from different source positions', () => {
    expect(() => classifyCandidate({
      beforeFen: fen,
      mover: 'white',
      best: candidate(fen, 'e2e3', cp(10)),
      played: candidate(`${fen} extra`, 'e2f2', cp(0)),
    })).toThrow(/same before-move FEN/);
  });

  it('rejects a mover that disagrees with the FEN side to move', () => {
    expect(() => classifyCandidate({
      beforeFen: fen,
      mover: 'black',
      best: candidate(fen, 'g1f1', cp(0)),
      played: candidate(fen, 'g1h1', cp(-10)),
    })).toThrow(/side to move/);
  });

  it('rejects a played candidate evaluated above the declared engine best', () => {
    expect(() => classifyCandidate({
      beforeFen: fen,
      mover: 'white',
      best: candidate(fen, 'e2e3', cp(0)),
      played: candidate(fen, 'e2f2', cp(10)),
    })).toThrow(/engine-best/);
  });

  it('applies Thinker special-heuristic precedence only to eligible base moves', () => {
    const input = {
      beforeFen: fen,
      mover: 'white' as const,
      best: candidate(fen, 'e2e3', cp(40)),
      played: candidate(fen, 'e2f2', cp(40)),
    };
    expect(classifyCandidate({ ...input, heuristics: { isBook: true } }).classification).toBe('book');
    expect(classifyCandidate({
      ...input,
      heuristics: {
        isSoundSacrifice: true,
        positionAfterPlayedNotBad: true,
        positionBeforeNotCompletelyWinning: true,
      },
    }).classification).toBe('brilliant');
    expect(classifyCandidate({ ...input, heuristics: { isOnlyGoodMove: true } }).classification).toBe('great');
  });
});

describe('Lichess-compatible accuracy and power mean', () => {
  it('returns perfect accuracy when winning chances do not fall', () => {
    expect(moveAccuracy(50, 50)).toBe(100);
    expect(moveAccuracy(50, 60)).toBe(100);
  });

  it('matches the published per-move curve', () => {
    expect(moveAccuracy(60, 50)).toBeCloseTo(64.57982845372067, 10);
    expect(moveAccuracy(100, 0)).toBe(0);
  });

  it('exposes the harmonic mean as power mean p=-1', () => {
    expect(powerMean([100, 50], -1)).toBeCloseTo(66.66666666666667, 12);
    expect(powerMean([100, 0], -1)).toBe(0);
    expect(powerMean([], -1)).toBeNull();
  });

  it('aggregates alternating colors with bounded volatility weights', () => {
    const result = gameAccuracy([50, 40, 60, 30, 70], 'white');
    expect(result.moves.map(move => move.color)).toEqual(['white', 'black', 'white', 'black']);
    expect(result.moves.every(move => move.weight >= 0.5 && move.weight <= 12)).toBe(true);
    expect(result.moves.map(move => move.weight)).toEqual([5, 10, 12, 12]);
    expect(result.moves.map(move => move.accuracy)).toEqual([
      64.57982845372067,
      41.016818741417126,
      25.772047746869696,
      15.909002002130045,
    ]);
    expect(result.white).toBeCloseTo(37.01385688146415, 12);
    expect(result.black).toBeCloseTo(25.123752163429252, 12);
    expect(result.white).toBeGreaterThanOrEqual(0);
    expect(result.white).toBeLessThanOrEqual(100);
    expect(result.black).toBeGreaterThanOrEqual(0);
    expect(result.black).toBeLessThanOrEqual(100);
  });
});
