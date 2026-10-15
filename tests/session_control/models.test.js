"use strict";

const assert = require("node:assert/strict");
const { canonicalStringify, validateSessionConfig } = require("../../frontend/session_control");
const { config } = require("./helpers");

function run() {
  assert.equal(canonicalStringify({ z: 1, a: { y: 2, x: 3 } }), '{"a":{"x":3,"y":2},"z":1}');
  assert.throws(() => validateSessionConfig({ ...config(), surprise: true }), /unknown/);
  assert.throws(() => validateSessionConfig(config({ minWinRate: 0.9 })), /bounds/);
  assert.throws(() => validateSessionConfig(config({ estimatorVersion: "other" })), /unsupported/);
  assert(Object.isFrozen(validateSessionConfig(config())));
}

module.exports = { run };
