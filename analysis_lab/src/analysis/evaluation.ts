import {
  MODEL_VERSIONS,
  type CanonicalEvaluation,
  type Color,
  type EngineScore,
} from './contracts';

export const LICHESS_CP_LIMIT = 1000;
export const LICHESS_WINNING_CHANCES_MULTIPLIER = -0.00368208;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value));

const assertFinite = (value: number, name: string): void => {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
};

export function engineScoreFromUci(input: { cp?: number | null; mate?: number | null }): EngineScore {
  const hasCp = input.cp !== undefined && input.cp !== null;
  const hasMate = input.mate !== undefined && input.mate !== null;
  if (hasCp === hasMate) throw new TypeError('exactly one of cp or mate is required');
  if (hasMate) {
    assertFinite(input.mate as number, 'mate');
    if (!Number.isSafeInteger(input.mate)) throw new RangeError('mate must be an integer');
    if (input.mate === 0) throw new RangeError('mate must not be zero');
    return Object.freeze({ kind: 'mate', mate: input.mate as number });
  }
  assertFinite(input.cp as number, 'cp');
  return Object.freeze({ kind: 'cp', cp: input.cp as number });
}

export function scoreToWinningChances(score: EngineScore): number {
  let centipawns: number;
  if (score.kind === 'mate') {
    assertFinite(score.mate, 'mate');
    if (score.mate === 0) throw new RangeError('mate must not be zero');
    centipawns = Math.sign(score.mate) * (21 - Math.min(10, Math.abs(score.mate))) * 100;
  } else {
    assertFinite(score.cp, 'cp');
    centipawns = clamp(score.cp, -LICHESS_CP_LIMIT, LICHESS_CP_LIMIT);
  }
  return clamp(2 / (1 + Math.exp(LICHESS_WINNING_CHANCES_MULTIPLIER * centipawns)) - 1, -1, 1);
}

export function scoreToWinPercent(score: EngineScore): number {
  return 50 + 50 * scoreToWinningChances(score);
}

export function scoreToExpectedPoints(score: EngineScore, perspective: Color = 'white'): number {
  const white = scoreToWinPercent(score) / 100;
  return perspective === 'white' ? white : 1 - white;
}

export function scoreToVisualFraction(score: EngineScore): number {
  return scoreToExpectedPoints(score, 'white');
}

export function normalizeEvaluation(score: EngineScore): CanonicalEvaluation {
  const whiteWinningChances = scoreToWinningChances(score);
  const whiteWinPercent = 50 + 50 * whiteWinningChances;
  const whiteExpectedPoints = whiteWinPercent / 100;
  return Object.freeze({
    modelVersion: MODEL_VERSIONS.evaluation,
    score,
    whiteWinningChances,
    whiteWinPercent,
    whiteExpectedPoints,
    whiteVisualFraction: whiteExpectedPoints,
  });
}

export function formatEvaluation(score: EngineScore, precision = 1): string {
  if (score.kind === 'mate') return `#${score.mate}`;
  const pawns = score.cp / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(precision)}`;
}
