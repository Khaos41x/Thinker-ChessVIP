"use strict";

const assert = require("node:assert/strict");
const {
  BoundedTelemetry, LeaderCoordinator, SessionControlController, buildStatusView,
  diagnosticExport, formatDuration, validateRollout,
} = require("../../frontend/session_control");
const { FakeClock, FakeLockManager, MemoryRepository } = require("../../frontend/session_control/testing");
const { TAB_A, activeGame, config, event, queueIntent, startEvent } = require("./helpers");
const { reduce } = require("../../frontend/session_control");

async function commitSequence(repository, events) {
  let snapshot = null;
  for (const item of events) {
    snapshot = reduce(snapshot, item).nextState;
    await repository.commit(item, snapshot);
  }
  return snapshot;
}

async function run() {
  assert.equal(validateRollout({ schemaVersion: 1, stage: "DISABLED" }).stage, "DISABLED");
  assert.throws(() => validateRollout({ schemaVersion: 1, stage: "ACTIVE_DDA", token: "secret" }));
  assert.equal(formatDuration(3661000), "01:01:01");

  const telemetry = new BoundedTelemetry({ capacity: 2 });
  telemetry.record("session_started", { occurredAtEpochMs: 1000, phase: "QUEUEING", revision: 1, rolloutStage: "ACTIVE_DDA" });
  telemetry.record("leader_acquired", { occurredAtEpochMs: 1001, role: "LEADER" });
  telemetry.record("session_paused", { occurredAtEpochMs: 1002, reasonCode: "BACKEND_TIMEOUT" });
  assert.equal(telemetry.list().length, 2);
  assert.throws(() => telemetry.record("session_paused", { fen: "secret-position" }));
  assert.throws(() => telemetry.record("session_paused", { username: "secret-user" }));
  assert.throws(() => telemetry.record("session_paused", { bearerToken: "secret-bearer" }));

  const clock = new FakeClock(1000000);
  const repository = new MemoryRepository();
  const leader = new LeaderCoordinator({ repository, locks: new FakeLockManager(), clock });
  const controller = new SessionControlController({
    repository, leader, clock, ownerTabId: TAB_A, telemetry,
    rolloutStage: "ACTIVE_DDA", idFactory: () => "9".repeat(32),
  });
  await controller.startSession({
    accountKey: "opaque-account", config: config({ durationMs: 60000 }),
    authorizationDecision: { schemaVersion: 1, allowed: true, reason: "OPAQUE_POLICY_MATCH" },
  });
  assert.equal(controller.snapshot.phase, "QUEUEING");
  let status = buildStatusView(controller.snapshot, { nowEpochMs: clock.now(), isLeader: controller.isLeader(), rollout: { schemaVersion: 1, stage: "ACTIVE_DDA" } });
  assert.equal(status.remainingTtlMs, 60000);
  assert.equal(status.role, "LEADER");
  assert.equal(status.posteriorWinRate, 50);
  assert.equal(status.offsetElo, 200);
  const exported = JSON.stringify(diagnosticExport(status, telemetry.list(), clock.now()));
  for (const forbidden of ["opaque-account", "secret-position", "secret-user", "secret-bearer", "runtimeGameToken", "lastFen"]) assert.equal(exported.includes(forbidden), false);
  assert.throws(() => diagnosticExport(status, [{
    schemaVersion: 1,
    telemetryVersion: "session-control-telemetry-v1",
    name: "session_paused",
    fen: "secret-position",
  }], clock.now()));
  await controller.requestGracefulStop();
  assert.equal(controller.snapshot.phase, "COMPLETED");

  const sleepRepository = new MemoryRepository();
  const sleepClock = new FakeClock(1000000);
  const sleepLeader = new LeaderCoordinator({ repository: sleepRepository, locks: new FakeLockManager(), clock: sleepClock });
  const sleepController = new SessionControlController({ repository: sleepRepository, leader: sleepLeader, clock: sleepClock, ownerTabId: TAB_A, idFactory: () => "8".repeat(32) });
  await sleepController.startSession({ accountKey: "opaque-sleep", config: config({ durationMs: 60000 }), authorizationDecision: { schemaVersion: 1, allowed: true, reason: "OPAQUE_POLICY_MATCH" } });
  sleepClock.advance(60001);
  await sleepController.renewLeadership();
  await sleepController.reconcileNow();
  assert.equal(sleepController.snapshot.phase, "COMPLETED");
  assert.equal(sleepController.snapshot.completionReason, "TTL_EXPIRED");

  const activeRepository = new MemoryRepository();
  let revision = 1;
  const activeEvents = [startEvent(1000000, { durationMs: 60000 })];
  activeEvents.push(event("QUEUE_INTENT_PREPARED", revision++, 1000100, { queueIntent: queueIntent(1000100) }));
  activeEvents.push(event("QUEUE_INTENT_CLAIMED", revision++, 1000200, { fencingToken: 1 }));
  activeEvents.push(event("QUEUE_INTENT_DISPATCHED", revision++, 1000300, {}));
  activeEvents.push(event("GAME_OBSERVED", revision++, 1000400, { activeGame: activeGame("phase4-game") }));
  const activeSnapshot = await commitSequence(activeRepository, activeEvents);
  const activeClock = new FakeClock(1060001);
  const activeLeader = new LeaderCoordinator({ repository: activeRepository, locks: new FakeLockManager(), clock: activeClock });
  const activeController = new SessionControlController({ repository: activeRepository, leader: activeLeader, clock: activeClock, ownerTabId: TAB_A, idFactory: () => "7".repeat(32) });
  activeController.setSnapshot(activeSnapshot);
  activeController.setLease((await activeLeader.acquire({ authorityEpoch: activeSnapshot.authorityEpoch, sessionId: activeSnapshot.sessionId, ownerTabId: TAB_A })).lease);
  await activeController.reconcileNow();
  assert.equal(activeController.snapshot.phase, "DRAINING");
  status = buildStatusView(activeController.snapshot, { nowEpochMs: activeClock.now(), isLeader: true, rollout: { schemaVersion: 1, stage: "ACTIVE_DDA" }, warningCode: "BACKEND_TIMEOUT" });
  assert.equal(status.drainRemainingMs, 60000);
  assert.equal(status.warningCode, "BACKEND_TIMEOUT");
  assert.equal(status.opponentRating, 1800);
  assert.equal(status.effectiveTargetElo, 2000);
}

module.exports = { run };
