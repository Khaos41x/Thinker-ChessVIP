"use strict";

const assert = require("node:assert/strict");
const { StableEvidenceTracker, canonicalGameIdFromUrl, isEligibleTopLevelContext, normalizeUsername, observeQueueContext, validatePlatformObservation, validateTerminalObservation } = require("../../frontend/session_control");

function run() {
  assert.equal(normalizeUsername("User_Name-1"), "user_name-1");
  assert.throws(() => normalizeUsername("usuário"), /ASCII/);
  assert.equal(canonicalGameIdFromUrl("https://www.chess.com/game/live/12345"), "12345");
  assert.equal(canonicalGameIdFromUrl("https://chess.com/game/live/12345"), null);
  const topLevel = {};
  topLevel.self = topLevel;
  topLevel.top = topLevel;
  assert.equal(isEligibleTopLevelContext({ protocol: "https:", hostname: "www.chess.com", origin: "https://www.chess.com" }, topLevel), true);
  assert.equal(isEligibleTopLevelContext({ protocol: "https:", hostname: "chess.com", origin: "https://chess.com" }, topLevel), false);
  assert.equal(isEligibleTopLevelContext({ protocol: "https:", hostname: "www.chess.com", origin: "https://www.chess.com" }, { self: {}, top: {} }), false);
  const button = { parentElement: null, getAttribute: () => null, className: "", textContent: "Start Game" };
  const rapidTab = { getAttribute: (name) => name === "aria-label" ? "Rapid" : null, className: "active", textContent: "Rapid" };
  const rapidRoot = { querySelectorAll: () => [rapidTab] };
  const rapid = observeQueueContext({ source: "sidebar-start-game", root: rapidRoot, button }, null);
  assert.deepEqual(rapid, {
    schemaVersion: 1,
    timeClass: "rapid",
    contextClass: "chesscom-queue-sidebar-start-game-v1",
    poolId: "chesscom-live-rapid-v1",
    opponentRatingScaleId: "chesscom-live-rapid-v1",
    sourceVersion: "chesscom-queue-context-v1",
  });
  const ambiguousRoot = { querySelectorAll: () => [rapidTab, { ...rapidTab, getAttribute: (name) => name === "aria-label" ? "Blitz" : null, textContent: "Blitz" }] };
  assert.equal(observeQueueContext({ source: "modal", root: ambiguousRoot, button }, null), null);
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: { querySelectorAll: () => [] }, button }, null), null);
  const base = {
    schemaVersion: 1,
    canonicalPlatformGameId: "game",
    accountKey: "account",
    opponentKey: "opponent",
    opponentRating: 1824,
    opponentRatingScaleId: "opaque-scale",
    userSide: "white",
    contextClass: "opaque-context",
    poolId: "opaque-pool",
    rated: true,
    observedAtEpochMs: 1000,
    sourceVersion: "adapter-v1",
  };
  const tracker = new StableEvidenceTracker(validatePlatformObservation);
  assert.equal(tracker.observe(base).stable, false);
  assert.equal(tracker.observe({ ...base, observedAtEpochMs: 1249 }).stable, false);
  assert.equal(tracker.observe({ ...base, observedAtEpochMs: 1500 }).stable, true);
  assert.equal(tracker.observe({ ...base, observedAtEpochMs: 1800, opponentRating: 1900 }).stable, false);
  assert.throws(() => validatePlatformObservation({ ...base, unknown: true }), /unknown/);

  const terminal = { schemaVersion: 1, canonicalPlatformGameId: "game", accountKey: "account", userSide: "white", outcome: "W", termination: "checkmate", source: "terminal-modal-v1", observedAtEpochMs: 2000, proofDigest: "digest" };
  assert.equal(validateTerminalObservation(terminal).outcome, "W");
  const terminalTracker = new StableEvidenceTracker(validateTerminalObservation);
  assert.equal(terminalTracker.observe(terminal).stable, false);
  assert.equal(terminalTracker.observe({ ...terminal, observedAtEpochMs: 2250 }).stable, true);
  assert.throws(() => validateTerminalObservation({ ...terminal, outcome: "UNKNOWN" }), /invalid/);
}

module.exports = { run };
