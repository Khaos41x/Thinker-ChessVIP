export const FAIR_PLAY_GUARDRAIL = Object.freeze({
  version: 'thinker-fair-play-v1',
  authorizedContexts: ['post-game', 'offline-analysis'] as const,
  prohibitedContexts: ['live-game', 'active-game-assistance'] as const,
  statement: 'Analysis output is authorized only after a game or in an offline analysis workspace.',
});

export const MODEL_VERSIONS = Object.freeze({
  evaluation: 'lichess-winning-chances-0.00368208-v1',
  classification: 'chesscom-published-ep-bands-thinker-heuristics-v1',
  accuracy: 'lichess-accuracy-percent-power-mean-v1',
  evalBar: 'thinker-latest-wins-tau-110-v1',
});

export const MODEL_PROVENANCE = Object.freeze({
  evaluation: 'Lichess lila winningChances.ts and scalachess WinPercent',
  classification: 'Chess.com Classification V2 published Expected Points bands with Thinker-owned special heuristics',
  accuracy: 'Lichess AccuracyPercent.scala volatility-weighted mean and harmonic power mean',
});

export type Color = 'white' | 'black';

export type EngineScore =
  | Readonly<{ kind: 'cp'; cp: number }>
  | Readonly<{ kind: 'mate'; mate: number }>;

export type CanonicalEvaluation = Readonly<{
  modelVersion: typeof MODEL_VERSIONS.evaluation;
  score: EngineScore;
  whiteWinningChances: number;
  whiteWinPercent: number;
  whiteExpectedPoints: number;
  whiteVisualFraction: number;
}>;

export type MoveClassification =
  | 'book'
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'miss'
  | 'blunder';

export type CandidateEvaluation = Readonly<{
  sourceFen: string;
  moveUci: string;
  score: EngineScore;
}>;

export type ClassificationHeuristics = Readonly<{
  isBook?: boolean;
  isSoundSacrifice?: boolean;
  positionAfterPlayedNotBad?: boolean;
  positionBeforeNotCompletelyWinning?: boolean;
  isOnlyGoodMove?: boolean;
  isCriticalOutcomeShift?: boolean;
  missedWinningChance?: boolean;
}>;

export type ClassificationResult = Readonly<{
  modelVersion: typeof MODEL_VERSIONS.classification;
  classification: MoveClassification;
  expectedPointsLoss: number;
  bestExpectedPoints: number;
  playedExpectedPoints: number;
}>;

export type EvalBarSample = Readonly<{
  searchId: number;
  fraction: number;
  label: string;
}>;
