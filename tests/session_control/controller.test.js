"use strict";

const assert = require("node:assert/strict");
const { LeaderCoordinator, SessionControlController, evaluateAutoMoveGate, evaluateQueueGate, reduce } = require("../../frontend/session_control");
const { FakeClock, FakeLockManager, MemoryRepository } = require("../../frontend/session_control/testing");
const { SESSION_ID, TAB_A, TAB_B, activeGame, event, queueIntent, startEvent } = require("./helpers");

function hexFactory() {
  let value = 10;
  return () => (value++).toString(16).padStart(32, "0");
}

async function commitSequence(repository, events) {
  let snapshot = null;
  for (const item of events) {
    snapshot = reduce(snapshot, item).nextState;
    await repository.commit(item, snapshot);
  }
  return snapshot;
}

async function run() {
  const clock = new FakeClock(1000100);
  const locks = new FakeLockManager();
  const repository = new MemoryRepository();
  const start = startEvent();
  const snapshot = await commitSequence(repository, [start]);
  const leader = new LeaderCoordinator({ repository, locks, clock });
  const controller = new SessionControlController({ repository, leader, clock, idFactory: hexFactory(), ownerTabId: TAB_A });
  controller.setSnapshot(snapshot);
  const lease = await leader.acquire({ authorityEpoch: 1, sessionId: SESSION_ID, ownerTabId: TAB_A });
  controller.setLease(lease.lease);
  const queueInput = {
    userAutoQueue: true,
    calibrationReadiness: { active: true, opponentRatingScaleId: "opaque-rating-scale", expiresAtEpochMs: 2000000 },
    intendedQueueScaleId: "opaque-rating-scale",
  };
  assert.equal(controller.queueGate(queueInput).allowed, true);
  let clicks = 0;
  const dispatched = await controller.executeQueueEffect(queueInput, () => { clicks += 1; });
  assert.equal(dispatched.reason, "DISPATCHED");
  assert.equal(clicks, 1);
  assert.equal(controller.snapshot.queueIntent.status, "DISPATCHED");
  assert.equal(evaluateQueueGate({ ...queueInput, snapshot: controller.snapshot, isLeader: true, storageHealthy: true, nowEpochMs: clock.now() }).reason, "QUEUE_INTENT_PRESENT");
  clock.advance(15001);
  const recoveredLeader = new LeaderCoordinator({ repository, locks, clock });
  const recoveredController = new SessionControlController({ repository, leader: recoveredLeader, clock, idFactory: hexFactory(), ownerTabId: TAB_B });
  recoveredController.setSnapshot(await repository.loadSession(SESSION_ID));
  recoveredController.setLease((await recoveredLeader.acquire({ authorityEpoch: 1, sessionId: SESSION_ID, ownerTabId: TAB_B })).lease);
  assert.equal((await recoveredController.executeQueueEffect(queueInput, () => { clicks += 1; })).reason, "QUEUE_INTENT_PRESENT");
  assert.equal(clicks, 1);

  const activeRepository = new MemoryRepository();
  const events = [startEvent()];
  let revision = 1;
  events.push(event("QUEUE_INTENT_PREPARED", revision++, 1000200, { queueIntent: queueIntent(1000200) }));
  events.push(event("QUEUE_INTENT_CLAIMED", revision++, 1000300, { fencingToken: 1 }));
  events.push(event("QUEUE_INTENT_DISPATCHED", revision++, 1000400, {}));
  events.push(event("GAME_OBSERVED", revision++, 1000500, { activeGame: activeGame("stable-game") }));
  const activeSnapshot = await commitSequence(activeRepository, events);
  const activeLeader = new LeaderCoordinator({ repository: activeRepository, locks, clock });
  const activeController = new SessionControlController({ repository: activeRepository, leader: activeLeader, clock, idFactory: hexFactory(), ownerTabId: TAB_A });
  activeController.setSnapshot(activeSnapshot);
  const activeLease = await activeLeader.acquire({ authorityEpoch: 1, sessionId: SESSION_ID, ownerTabId: TAB_A });
  activeController.setLease(activeLease.lease);
  const moveInput = {
    userAutoMove: true,
    gameMode: "play",
    observedGame: { gameIdentityStable: true, terminalState: "ONGOING", canonicalPlatformGameId: "stable-game", accountKey: "opaque-account", runtimeGameToken: activeSnapshot.activeGame.runtimeGameToken },
  };
  assert.equal(activeController.autoMoveGate(moveInput).allowed, true);
  assert.equal(activeController.legacyAutoAdjustSuspended(), true);
  assert.equal(activeController.moveSelectionElo(1700), 2000);
  const epoch = activeController.captureEffectEpoch();
  let moves = 0;
  assert.equal((await activeController.executeAutoMoveEffect(moveInput, epoch, () => { moves += 1; })).reason, "DISPATCHED");
  assert.equal(moves, 1);
  clock.advance(15001);
  const takeoverLeader = new LeaderCoordinator({ repository: activeRepository, locks, clock });
  const takeoverController = new SessionControlController({ repository: activeRepository, leader: takeoverLeader, clock, idFactory: hexFactory(), ownerTabId: TAB_B });
  takeoverController.setSnapshot(activeSnapshot);
  takeoverController.setLease((await takeoverLeader.acquire({ authorityEpoch: 1, sessionId: SESSION_ID, ownerTabId: TAB_B })).lease);
  await assert.rejects(() => activeController.executeAutoMoveEffect(moveInput, epoch, () => { moves += 1; }), (error) => error.code === "STALE_FENCE");
  const takeoverEpoch = takeoverController.captureEffectEpoch();
  assert.equal((await takeoverController.executeAutoMoveEffect(moveInput, takeoverEpoch, () => { moves += 1; })).reason, "DISPATCHED");
  assert.equal(moves, 2);
  assert.equal((await takeoverController.pauseForDisabledAutoMove()).reason, "PAUSED");
  assert.equal(takeoverController.snapshot.phase, "PAUSED_ACTIVE");
  assert.equal(takeoverController.snapshot.pauseReason, "USER_AUTOMOVE_DISABLED");
  assert.equal((await takeoverController.executeAutoMoveEffect(moveInput, takeoverEpoch, () => { moves += 1; })).reason, "PHASE_NOT_ACTIVE");
  assert.equal(moves, 2);

  const invalidSnapshot = { ...activeSnapshot, activeGame: activeGame("stable-game", { actuation: { valid: false, invalidReason: "ENGINE_NOT_APPLIED", appliedMoveCount: 0, nonAppliedMoveCount: 1, resolvedProfile: null } }) };
  assert.equal(evaluateAutoMoveGate({ ...moveInput, snapshot: invalidSnapshot, isLeader: true, storageHealthy: true, nowEpochMs: clock.now() }).reason, "ENGINE_NOT_APPLIED");
  assert.equal(evaluateAutoMoveGate({ ...moveInput, observedGame: { ...moveInput.observedGame, canonicalPlatformGameId: "other" }, snapshot: activeSnapshot, isLeader: true, storageHealthy: true, nowEpochMs: clock.now() }).reason, "GAME_IDENTITY_MISMATCH");
}

module.exports = { run };
