"use strict";

const assert = require("node:assert/strict");
const { LeaderCoordinator, reduce } = require("../../frontend/session_control");
const { FakeClock, FakeLockManager, MemoryRepository } = require("../../frontend/session_control/testing");
const { SESSION_ID, TAB_A, TAB_B, startEvent } = require("./helpers");

async function run() {
  const clock = new FakeClock(1000000);
  const locks = new FakeLockManager();
  const repository = new MemoryRepository();
  const start = startEvent();
  const snapshot = reduce(null, start).nextState;
  await repository.commit(start, snapshot);
  const first = new LeaderCoordinator({ repository, locks, clock });
  const second = new LeaderCoordinator({ repository, locks, clock });
  const identityA = { authorityEpoch: 1, sessionId: SESSION_ID, ownerTabId: TAB_A };
  const identityB = { authorityEpoch: 1, sessionId: SESSION_ID, ownerTabId: TAB_B };
  const [a, b] = await Promise.all([first.acquire(identityA), second.acquire(identityB)]);
  assert.deepEqual([a.status, b.status], ["acquired", "contended"]);
  assert.equal((await first.renew(identityA)).lease.fencingToken, 1, "renewal changed fencing token");

  let effects = 0;
  await first.executeEffect({ ...identityA, fencingToken: 1, expectedRevision: 1 }, () => { effects += 1; });
  assert.equal(effects, 1);

  clock.advance(16000);
  const takeover = await second.acquire(identityB);
  assert.equal(takeover.status, "acquired");
  assert.equal(takeover.lease.fencingToken, 2);
  await assert.rejects(() => first.executeEffect({ ...identityA, fencingToken: 1, expectedRevision: 1 }, () => { effects += 1; }), (error) => error.code === "STALE_FENCE");
  assert.equal(effects, 1, "stale leader executed an effect");

  clock.set(900000);
  const renewed = await second.renew(identityB);
  assert.equal(renewed.lease.fencingToken, 2, "clock rollback caused a takeover");
  assert(renewed.effectiveNowMs >= 1016000, "monotonic wall-clock floor moved backward");
  await assert.rejects(() => second.executeEffect({ ...identityB, fencingToken: 2, expectedRevision: 1 }, async () => {}), (error) => error.code === "ASYNC_EFFECT_FORBIDDEN");
}

module.exports = { run };
