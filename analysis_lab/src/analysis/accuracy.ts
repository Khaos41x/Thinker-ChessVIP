import { MODEL_VERSIONS, type Color } from './contracts';

export const ACCURACY_CURVE = Object.freeze({
  amplitude: 103.1668100711649,
  decay: 0.04354415386753951,
  offset: -3.166924740191411,
  uncertaintyBonus: 1,
});

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value));

const assertPercent = (value: number, name: string): void => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${name} must be within [0, 100]`);
  }
};

export function moveAccuracy(beforeWinPercent: number, afterWinPercent: number): number {
  assertPercent(beforeWinPercent, 'beforeWinPercent');
  assertPercent(afterWinPercent, 'afterWinPercent');
  if (afterWinPercent >= beforeWinPercent) return 100;
  const loss = beforeWinPercent - afterWinPercent;
  const raw = ACCURACY_CURVE.amplitude * Math.exp(-ACCURACY_CURVE.decay * loss)
    + ACCURACY_CURVE.offset
    + ACCURACY_CURVE.uncertaintyBonus;
  return clamp(raw, 0, 100);
}

export function powerMean(values: readonly number[], exponent: number): number | null {
  if (!values.length) return null;
  if (!Number.isFinite(exponent)) throw new TypeError('exponent must be finite');
  for (const value of values) assertPercent(value, 'accuracy');
  if (exponent === 0) {
    if (values.some(value => value === 0)) return 0;
    return Math.exp(values.reduce((total, value) => total + Math.log(value), 0) / values.length);
  }
  if (exponent < 0 && values.some(value => value === 0)) return 0;
  const mean = values.reduce((total, value) => total + value ** exponent, 0) / values.length;
  return mean ** (1 / exponent);
}

function standardDeviation(values: readonly number[]): number {
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function slidingWindows(values: readonly number[], size: number): number[][] {
  const windows: number[][] = [];
  for (let index = 0; index <= values.length - size; index += 1) {
    windows.push(values.slice(index, index + size));
  }
  return windows;
}

export type GameAccuracyResult = Readonly<{
  modelVersion: typeof MODEL_VERSIONS.accuracy;
  moves: ReadonlyArray<Readonly<{ color: Color; accuracy: number; weight: number }>>;
  white: number | null;
  black: number | null;
}>;

export function gameAccuracy(
  whiteWinPercents: readonly number[],
  startColor: Color = 'white',
): GameAccuracyResult {
  if (whiteWinPercents.length < 2) {
    return Object.freeze({ modelVersion: MODEL_VERSIONS.accuracy, moves: [], white: null, black: null });
  }
  whiteWinPercents.forEach((value, index) => assertPercent(value, `whiteWinPercents[${index}]`));
  const windowSize = clamp(Math.floor((whiteWinPercents.length - 1) / 10), 2, 8);
  const prefixCount = Math.max(0, Math.min(windowSize, whiteWinPercents.length) - 2);
  const firstWindow = whiteWinPercents.slice(0, windowSize);
  const windows = [
    ...Array.from({ length: prefixCount }, () => firstWindow),
    ...slidingWindows(whiteWinPercents, windowSize),
  ];
  const weights = windows.map(window => clamp(standardDeviation(window), 0.5, 12));
  const moves = whiteWinPercents.slice(0, -1).map((beforeWhite, index) => {
    const afterWhite = whiteWinPercents[index + 1];
    const color: Color = index % 2 === 0 ? startColor : startColor === 'white' ? 'black' : 'white';
    const before = color === 'white' ? beforeWhite : 100 - beforeWhite;
    const after = color === 'white' ? afterWhite : 100 - afterWhite;
    return Object.freeze({ color, accuracy: moveAccuracy(before, after), weight: weights[index] });
  });

  const forColor = (color: Color): number | null => {
    const selected = moves.filter(move => move.color === color);
    if (!selected.length) return null;
    const weightTotal = selected.reduce((total, move) => total + move.weight, 0);
    const weighted = selected.reduce((total, move) => total + move.accuracy * move.weight, 0) / weightTotal;
    const harmonic = powerMean(selected.map(move => move.accuracy), -1);
    return harmonic === null ? null : (weighted + harmonic) / 2;
  };

  return Object.freeze({
    modelVersion: MODEL_VERSIONS.accuracy,
    moves: Object.freeze(moves),
    white: forColor('white'),
    black: forColor('black'),
  });
}
