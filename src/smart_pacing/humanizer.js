function createSeededRandom(seed) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random) {
  const u = Math.max(Number.EPSILON, random());
  const v = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleHumanTarget({ medianMs, safeMinMs, safeMaxMs, sigma = 0.28, random }) {
  if (safeMaxMs <= 0) return 0;
  const sample = medianMs * Math.exp(sigma * gaussian(random));
  return Math.round(Math.max(Math.min(safeMinMs, safeMaxMs), Math.min(safeMaxMs, sample)));
}

module.exports = { createSeededRandom, sampleHumanTarget };
