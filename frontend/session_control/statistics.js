"use strict";

const { MODES } = require("./models");

const WILSON_Z_95 = 1.959963984540054;

function posteriorMean(counts) {
  return (counts.wins + 1) / (counts.terminalGames + 2);
}

function wilsonInterval(wins, terminalGames, z = WILSON_Z_95) {
  if (!Number.isInteger(wins) || !Number.isInteger(terminalGames) || wins < 0 || terminalGames < 0 || wins > terminalGames) {
    throw new TypeError("wins and terminalGames must be valid non-negative counts");
  }
  if (!Number.isFinite(z) || z <= 0) throw new TypeError("z must be positive and finite");
  if (terminalGames === 0) return Object.freeze({ lower: 0, upper: 1 });
  const p = wins / terminalGames;
  const z2 = z * z;
  const denominator = 1 + z2 / terminalGames;
  const center = (p + z2 / (2 * terminalGames)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * terminalGames)) / terminalGames)) / denominator;
  return Object.freeze({ lower: Math.max(0, center - margin), upper: Math.min(1, center + margin) });
}

function nextControllerMode(mode, counts, config) {
  if (!MODES.includes(mode)) throw new TypeError("controller mode is invalid");
  const posteriorWinRate = posteriorMean(counts);
  if (counts.terminalGames < config.minCompletedGames) return Object.freeze({ mode, posteriorWinRate });
  if (mode === "BOOST" && posteriorWinRate > config.maxWinRate) return Object.freeze({ mode: "CORRECT", posteriorWinRate });
  if (mode === "CORRECT" && posteriorWinRate < config.minWinRate) return Object.freeze({ mode: "BOOST", posteriorWinRate });
  return Object.freeze({ mode, posteriorWinRate });
}

module.exports = { WILSON_Z_95, nextControllerMode, posteriorMean, wilsonInterval };
