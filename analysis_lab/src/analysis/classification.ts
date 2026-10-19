import {
  MODEL_VERSIONS,
  type CandidateEvaluation,
  type ClassificationHeuristics,
  type ClassificationResult,
  type Color,
  type MoveClassification,
} from './contracts';
import { scoreToExpectedPoints } from './evaluation';

export const CLASSIFICATION_V2_EP_BANDS = Object.freeze({
  excellent: 0.02,
  good: 0.05,
  inaccuracy: 0.1,
  mistake: 0.2,
});

const EPSILON = 1e-12;

function baseClassification(loss: number): MoveClassification {
  if (loss <= EPSILON) return 'best';
  if (loss <= CLASSIFICATION_V2_EP_BANDS.excellent + EPSILON) return 'excellent';
  if (loss <= CLASSIFICATION_V2_EP_BANDS.good + EPSILON) return 'good';
  if (loss <= CLASSIFICATION_V2_EP_BANDS.inaccuracy + EPSILON) return 'inaccuracy';
  if (loss <= CLASSIFICATION_V2_EP_BANDS.mistake + EPSILON) return 'mistake';
  return 'blunder';
}

export function classifyCandidate(input: {
  beforeFen: string;
  mover: Color;
  best: CandidateEvaluation;
  played: CandidateEvaluation;
  heuristics?: ClassificationHeuristics;
}): ClassificationResult {
  const { beforeFen, mover, best, played, heuristics = {} } = input;
  if (!beforeFen || best.sourceFen !== beforeFen || played.sourceFen !== beforeFen) {
    throw new RangeError('best and played candidates must share the same before-move FEN');
  }
  const fenTurn = beforeFen.trim().split(/\s+/)[1];
  if ((fenTurn !== 'w' && fenTurn !== 'b') || (fenTurn === 'w') !== (mover === 'white')) {
    throw new RangeError('mover must match the side to move in the before-move FEN');
  }
  if (!best.moveUci || !played.moveUci) throw new TypeError('candidate moves are required');

  const bestExpectedPoints = scoreToExpectedPoints(best.score, mover);
  const playedExpectedPoints = scoreToExpectedPoints(played.score, mover);
  if (playedExpectedPoints > bestExpectedPoints + EPSILON) {
    throw new RangeError('played candidate cannot evaluate above the engine-best candidate');
  }
  const expectedPointsLoss = Math.max(0, Math.min(1, bestExpectedPoints - playedExpectedPoints));
  const base = baseClassification(expectedPointsLoss);
  const nearBest = base === 'best' || base === 'excellent';

  let classification: MoveClassification = base;
  if (heuristics.isBook) classification = 'book';
  else if (
    nearBest &&
    heuristics.isSoundSacrifice &&
    heuristics.positionAfterPlayedNotBad &&
    heuristics.positionBeforeNotCompletelyWinning
  ) classification = 'brilliant';
  else if (nearBest && (heuristics.isOnlyGoodMove || heuristics.isCriticalOutcomeShift)) classification = 'great';
  else if (heuristics.missedWinningChance && ['inaccuracy', 'mistake', 'blunder'].includes(base)) classification = 'miss';

  return Object.freeze({
    modelVersion: MODEL_VERSIONS.classification,
    classification,
    expectedPointsLoss,
    bestExpectedPoints,
    playedExpectedPoints,
  });
}
