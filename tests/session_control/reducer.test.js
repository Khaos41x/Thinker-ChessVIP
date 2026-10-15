"use strict";

const assert = require("node:assert/strict");
const { canonicalStringify, reduce } = require("../../frontend/session_control");
const { activeGame, event, queueIntent, startEvent } = require("./helpers");

function replay(events) {
  let state = null;
  for (const item of events) state = reduce(state, item).nextState;
  return state;
}

function gameSequence(outcome, controlEligible, gameId = "opaque-game") {
  const events = [startEvent()];
  let revision = 1;
  events.push(event("QUEUE_INTENT_PREPARED", revision++, 1001000, { queueIntent: queueIntent() }));
  events.push(event("QUEUE_INTENT_CLAIMED", revision++, 1002000, { fencingToken: 1 }));
  events.push(event("QUEUE_INTENT_DISPATCHED", revision++, 1002500, {}));
  const game = activeGame(gameId);
  if (!controlEligible) game.actuation = { ...game.actuation, valid: false, invalidReason: "OPAQUE_INVALIDATION", appliedMoveCount: 0, resolvedProfile: null };
  events.push(event("GAME_OBSERVED", revision++, 1003000, { activeGame: game }));
  events.push(event("GAME_RESULT_OBSERVED", revision++, 1004000, { canonicalPlatformGameId: gameId, outcome }, { eventId: `result:${gameId}`, canonicalPlatformGameId: gameId }));
  return events;
}

function run() {
  const denied = startEvent();
  denied.payload.authorizationDecision = { schemaVersion: 1, allowed: false, reason: "OPAQUE_DENY" };
  assert.throws(() => reduce(null, denied), /allowed authorization/);

  const events = gameSequence("WIN", true);
  const first = replay(events);
  const second = replay(JSON.parse(JSON.stringify(events)));
  assert.equal(canonicalStringify(first), canonicalStringify(second), "replay must be byte deterministic");
  assert.deepEqual(first.observedCounts, { wins: 1, draws: 0, losses: 0, terminalGames: 1 });
  assert.deepEqual(first.controlCounts, first.observedCounts);
  assert.equal(first.phase, "QUEUEING");
  assert.throws(() => reduce(first, events.at(-1)), /revision mismatch/);

  const excluded = replay(gameSequence("LOSS", false));
  assert.equal(excluded.observedCounts.losses, 1);
  assert.equal(excluded.controlCounts.terminalGames, 0);

  const unknownEvents = gameSequence("WIN", true, "unknown-game").slice(0, -1);
  const beforeUnknown = replay(unknownEvents);
  const unknown = reduce(beforeUnknown, event("OUTCOME_UNKNOWN", beforeUnknown.revision, 1003500, { canonicalPlatformGameId: "unknown-game" }, { eventId: "unknown:unknown-game" })).nextState;
  assert.equal(unknown.phase, "PAUSED_ACTIVE");
  assert.deepEqual(unknown.observedCounts, beforeUnknown.observedCounts);
  assert.deepEqual(unknown.controlCounts, beforeUnknown.controlCounts);

  let state = replay(gameSequence("DRAW", true, "first"));
  assert.equal(state.controller.mode, "BOOST");
  const negativeFields = [state.observedCounts, state.controlCounts].flatMap((counts) => Object.values(counts).filter((value) => value < 0));
  assert.deepEqual(negativeFields, []);

  state = replay([startEvent(1000000, { durationMs: 60000 })]);
  const expired = reduce(state, event("CLOCK_RECONCILED", 1, 1060000, {})).nextState;
  assert.equal(expired.phase, "COMPLETED");
  assert.throws(() => reduce(expired, event("CLOCK_RECONCILED", 2, 1050000, {})), /immutable/, "terminal state accepted a mutation");

  let dispatched = replay(gameSequence("WIN", true, "timeout-game").slice(0, 4));
  const timedOut = reduce(dispatched, event("CLOCK_RECONCILED", dispatched.revision, dispatched.queueIntent.observeUntilEpochMs, {})).nextState;
  assert.equal(timedOut.phase, "PAUSED_QUEUEING");
  assert.equal(timedOut.queueIntent.status, "AMBIGUOUS");

  const outcomes = ["WIN", "DRAW", "LOSS"];
  for (let index = 0; index < 30; index += 1) {
    const result = replay(gameSequence(outcomes[index % outcomes.length], index % 4 !== 0, `property-${index}`));
    for (const counts of [result.observedCounts, result.controlCounts]) {
      assert(Object.values(counts).every((value) => Number.isInteger(value) && value >= 0));
      assert.equal(counts.wins + counts.draws + counts.losses, counts.terminalGames);
    }
  }
}

module.exports = { run };
