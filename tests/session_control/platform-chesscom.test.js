"use strict";

const assert = require("node:assert/strict");
const { StableEvidenceTracker, canonicalGameIdFromUrl, isEligibleTopLevelContext, normalizeUsername, observeQueueContext, recoverObservedContext, reduce, validatePlatformObservation, validateTerminalObservation } = require("../../frontend/session_control");
const { activeGame, event, queueIntent, startEvent } = require("./helpers");

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
  const control = (text, attributes = {}, properties = {}) => ({
    parentElement: null,
    className: attributes.class || "",
    textContent: text,
    getAttribute: (name) => Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null,
    ...properties,
  });
  const rootWith = ({ active = [], controls = [] }) => ({
    querySelectorAll: (selector) => selector.includes("active") || selector.includes('="true"') || selector.includes('data-state=') ? active : controls,
  });
  const assertContext = (text, timeClass) => {
    const button = control("Start Game");
    const observed = observeQueueContext({ source: "sidebar-start-game", root: rootWith({ controls: [control(text)] }), button });
    assert.equal(observed.timeClass, timeClass);
    assert.equal(observed.poolId, `chesscom-live-${timeClass}-v1`);
    assert.equal(observed.opponentRatingScaleId, `chesscom-live-${timeClass}-v1`);
  };
  const button = control("Start Game");
  const rapidTab = control("Rapid", { "aria-label": "Rapid", class: "active" });
  const rapidRoot = rootWith({ active: [rapidTab] });
  const rapid = observeQueueContext({ source: "sidebar-start-game", root: rapidRoot, button }, null);
  assert.deepEqual(rapid, {
    schemaVersion: 1,
    timeClass: "rapid",
    contextClass: "chesscom-queue-sidebar-start-game-v1",
    poolId: "chesscom-live-rapid-v1",
    opponentRatingScaleId: "chesscom-live-rapid-v1",
    sourceVersion: "chesscom-queue-context-v1",
  });
  assertContext("10 min (Rapid)", "rapid");
  assertContext("1 min (Bullet)", "bullet");
  assertContext("3 min (Blitz)", "blitz");
  assertContext("10 | 5 (Rapid)", "rapid");
  assertContext("0:30 (Bullet)", "bullet");
  const blitzTab = control("Blitz", { "aria-label": "Blitz", class: "active" });
  const ambiguousRoot = rootWith({ active: [rapidTab, blitzTab] });
  assert.equal(observeQueueContext({ source: "modal", root: ambiguousRoot, button }, null), null);
  const conflictingRoot = rootWith({ active: [rapidTab], controls: [control("3 min (Blitz)")] });
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: conflictingRoot, button }, null), null);
  const duplicateRoot = rootWith({ controls: [control("10 min (Rapid)"), control("10 min (Rapid)")] });
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: duplicateRoot, button }, null), null);
  const maskedConflictRoot = rootWith({ active: [rapidTab], controls: [control("3 min (Blitz)"), control("1 min (Bullet)")] });
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: maskedConflictRoot, button }, null), null);
  const maskedDuplicateRoot = rootWith({ active: [rapidTab], controls: [control("10 min (Rapid)"), control("10 min (Rapid)")] });
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: maskedDuplicateRoot, button }, null), null);
  const maskedUnsupportedRoot = rootWith({ active: [rapidTab], controls: [control("10 min (Custom Rapid)")] });
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: maskedUnsupportedRoot, button }, null), null);
  for (const text of ["Rapid", "10 min", "Rapid 10 min", "Join a 10 min Rapid tournament", "10 min (Rapid Blitz)", "10 min (Daily Rapid)", "10 min (Custom Rapid)", "10 min (rapidă)", "10 min (Rapid960)", "181 min Rapid / 3+0", "181 min (Rapid)", "3 | 61 (Blitz)", "0:00 (Bullet)"]) {
    assert.equal(observeQueueContext({ source: "sidebar-start-game", root: rootWith({ controls: [control(text)] }), button }, null), null, text);
  }
  for (const hidden of [
    control("10 min (Rapid)", { hidden: "" }),
    control("10 min (Rapid)", { "aria-hidden": "true" }),
    control("10 min (Rapid)", { style: "display: none" }),
    control("10 min (Rapid)", { style: "opacity: 0" }),
    control("10 min (Rapid)", { "aria-disabled": "true" }),
    control("10 min (Rapid)", {}, { hidden: true }),
    control("10 min (Rapid)", {}, { disabled: true }),
    control("10 min (Rapid)", {}, { parentElement: control("", { style: "visibility: hidden" }) }),
    control("10 min (Rapid)", {}, { isConnected: true, getClientRects: () => [] }),
  ]) {
    assert.equal(observeQueueContext({ source: "sidebar-start-game", root: rootWith({ controls: [hidden] }), button }, null), null);
  }
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: rootWith({ controls: [button, control("10 min (Rapid)")] }), button }, null).timeClass, "rapid");
  const nestedStartControl = control("10 min (Rapid)");
  const containingButton = { ...button, contains: (node) => node === nestedStartControl };
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: rootWith({ controls: [nestedStartControl] }), button: containingButton }, null), null);
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: rootWith({ controls: [] }), button }, null), null);
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: { textContent: "10 min (Rapid)", querySelectorAll: () => [] }, button }, null), null);
  assert.equal(observeQueueContext({ source: "unknown", root: rootWith({ controls: [control("10 min (Rapid)")] }), button }, null), null);
  assert.equal(observeQueueContext({ source: "sidebar-start-game", root: rootWith({ controls: [control("10 min (Rapid)")] }), button: null }, null), null);
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

  let recoveredSnapshot = reduce(null, startEvent(1000000)).nextState;
  recoveredSnapshot = reduce(recoveredSnapshot, event("QUEUE_INTENT_PREPARED", 1, 1001000, { queueIntent: queueIntent() })).nextState;
  recoveredSnapshot = reduce(recoveredSnapshot, event("QUEUE_INTENT_CLAIMED", 2, 1002000, { fencingToken: 1 })).nextState;
  recoveredSnapshot = reduce(recoveredSnapshot, event("QUEUE_INTENT_DISPATCHED", 3, 1002500, {})).nextState;
  recoveredSnapshot = reduce(recoveredSnapshot, event("GAME_OBSERVED", 4, 1003000, { activeGame: activeGame("game") })).nextState;
  recoveredSnapshot = { ...recoveredSnapshot, activationContext: { context: "queue", pool: "opaque-rating-scale", opponentRatingScaleId: "opaque-rating-scale" } };
  const unavailable = { schemaVersion: 1, active: false, reasonCode: "SERVER_UNAVAILABLE", opponentRatingScaleId: "opaque-rating-scale", targetScaleId: "opaque-scale-v1", generatedAtEpochMs: 1004000, expiresAtEpochMs: 1009000 };
  const withoutFreshEvidence = recoverObservedContext(recoveredSnapshot, unavailable);
  assert.equal(withoutFreshEvidence.queue.intendedQueueScaleId, "opaque-rating-scale");
  assert.equal(withoutFreshEvidence.move, undefined);
  const recoveredObservation = { ...base, canonicalPlatformGameId: "game", accountKey: "opaque-account", opponentRating: 1800, opponentRatingScaleId: "opaque-rating-scale", poolId: "opaque-rating-scale", observedAtEpochMs: 1005000 };
  const withFreshEvidence = recoverObservedContext(recoveredSnapshot, unavailable, recoveredObservation);
  assert.equal(withFreshEvidence.lifecycleIdentity.canonicalPlatformGameId, "game");
  assert.equal(withFreshEvidence.move.observedGame.runtimeGameToken, recoveredSnapshot.activeGame.runtimeGameToken);
  assert.equal(recoverObservedContext(recoveredSnapshot, unavailable, { ...recoveredObservation, canonicalPlatformGameId: "different" }).move, undefined);
}

module.exports = { run };
