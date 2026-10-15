"use strict";

const assert = require("node:assert/strict");
const { LeaderCoordinator, SessionControlController, reduce } = require("../../frontend/session_control");
const { FakeClock, FakeLockManager, MemoryRepository } = require("../../frontend/session_control/testing");
const { SESSION_ID, TAB_A, activeGame, event, queueIntent, startEvent } = require("./helpers");

async function run() {
  const clock = new FakeClock(1000100);
  const repository = new MemoryRepository();
  let snapshot = null;
  const events = [startEvent()];
  let revision = 1;
  events.push(event("QUEUE_INTENT_PREPARED", revision++, 1000200, { queueIntent: queueIntent(1000200) }));
  events.push(event("QUEUE_INTENT_CLAIMED", revision++, 1000300, { fencingToken: 1 }));
  events.push(event("QUEUE_INTENT_DISPATCHED", revision++, 1000400, {}));
  const pending = activeGame("phase3-game", {
    targetPinStatus: "PENDING",
    calibrationCapabilityExpiresAtEpochMs: null,
    lastFen: "",
    actuator: null,
    actuation: { valid: true, invalidReason: null, appliedMoveCount: 0, nonAppliedMoveCount: 0, resolvedProfile: null },
  });
  events.push(event("GAME_OBSERVED", revision++, 1000500, { activeGame: pending }));
  for (const item of events) {
    snapshot = reduce(snapshot, item).nextState;
    await repository.commit(item, snapshot);
  }
  const leader = new LeaderCoordinator({ repository, locks: new FakeLockManager(), clock });
  const controller = new SessionControlController({ repository, leader, clock, idFactory: () => "f".repeat(32), ownerTabId: TAB_A });
  controller.setSnapshot(snapshot);
  controller.setLease((await leader.acquire({ authorityEpoch: 1, sessionId: SESSION_ID, ownerTabId: TAB_A })).lease);
  const capability = {
    schemaVersion: 1, runtimeGameToken: pending.runtimeGameToken, mode: "active", cohort: "active",
    scaleId: "opaque-scale-v1", opponentRatingScaleId: "opaque-rating-scale",
    ratingScaleMappingVersion: "mapping-v1", ratingScaleMappingChecksum: "a".repeat(64),
    platformAdjustedRating: 2000, translatedTargetElo: 2050, effectiveTargetElo: 2050,
    targetSaturated: false, artifactVersion: "artifact-v1", artifactChecksum: "b".repeat(64),
    seedPolicyVersion: "seed-v1", allowedBudgetClasses: ["budget-v1"], minimumElo: 900,
    maximumElo: 3064, expiresAtEpochMs: 2000000, rolloutVersion: "rollout-v1",
  };
  assert.equal((await controller.pinCalibration(capability)).reason, "PINNED");
  assert.equal(controller.snapshot.activeGame.actuator.effectiveTargetElo, 2050);
  assert.equal((await controller.pinCalibration({ ...capability, effectiveTargetElo: 1900 })).reason, "TARGET_NOT_PENDING");

  const fen = "8/8/8/8/8/4k3/8/4K3 w - - 0 1";
  assert.equal(await controller.observePosition(fen), null);
  clock.advance(250);
  const context = await controller.observePosition(fen);
  assert.equal(context.runtimeGameToken, pending.runtimeGameToken);
  assert.equal(context.positionRevision, 1);
  assert.equal(context.moveSelectionElo, 2050);
  assert.equal(context.perceptionElo, 1700);

  const calibration = {
    calibrationStatus: "applied", targetElo: 2050, scaleId: "opaque-scale-v1",
    artifactVersion: "artifact-v1", artifactChecksum: "b".repeat(64), calibrationCohort: "active",
    rolloutVersion: "rollout-v1", seedPolicyVersion: "seed-v1", budgetClass: "budget-v1",
    ratingScaleMappingVersion: "mapping-v1", ratingScaleMappingChecksum: "a".repeat(64),
    resolverVersion: "resolver-v1", resolutionKey: "c".repeat(64), latentSkill: 10.5,
    appliedSkill: 10, profileDigest: "d".repeat(64),
  };
  assert.equal((await controller.acceptMovePlanResponse({ source: "engine", originSource: "engine", calibration }, context)).reason, "ACCEPTED");
  assert.equal(controller.snapshot.activeGame.actuation.appliedMoveCount, 1);
  assert.equal(controller.snapshot.activeGame.actuation.resolvedProfile.appliedSkill, 10);
}

module.exports = { run };
