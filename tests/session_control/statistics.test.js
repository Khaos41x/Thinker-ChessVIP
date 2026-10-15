"use strict";

const assert = require("node:assert/strict");
const { nextControllerMode, posteriorMean, wilsonInterval } = require("../../frontend/session_control");
const { config } = require("./helpers");

function run() {
  assert.equal(posteriorMean({ wins: 0, terminalGames: 0 }), 0.5);
  assert.equal(posteriorMean({ wins: 2, terminalGames: 2 }), 0.75);
  assert.equal(nextControllerMode("BOOST", { wins: 2, terminalGames: 2 }, config()).mode, "BOOST", "upper equality must not transition");
  assert.equal(nextControllerMode("CORRECT", { wins: 0, terminalGames: 2 }, config()).mode, "CORRECT", "lower equality must not transition");
  assert.equal(nextControllerMode("BOOST", { wins: 3, terminalGames: 3 }, config()).mode, "CORRECT");
  assert.equal(nextControllerMode("CORRECT", { wins: 0, terminalGames: 3 }, config()).mode, "BOOST");
  assert.deepEqual(wilsonInterval(0, 0), { lower: 0, upper: 1 });
  const interval = wilsonInterval(8, 10);
  assert(interval.lower < 0.8 && interval.upper > 0.8);
}

module.exports = { run };
