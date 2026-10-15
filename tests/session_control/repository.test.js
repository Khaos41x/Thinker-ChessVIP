"use strict";

const assert = require("node:assert/strict");
const { GmStoragePort, reduce } = require("../../frontend/session_control");
const { FakeGmStorage, MemoryRepository } = require("../../frontend/session_control/testing");
const { event, startEvent } = require("./helpers");

async function run() {
  const gm = new FakeGmStorage();
  const recoveryPort = new GmStoragePort(gm.getValue.bind(gm), gm.setValue.bind(gm));
  const repository = new MemoryRepository({ recoveryPort });
  const startedEvent = startEvent();
  const started = reduce(null, startedEvent).nextState;
  const initial = await repository.commit(startedEvent, started);
  assert.equal(initial.status, "committed");
  assert.equal(initial.mirrorStatus, "written");

  const clockEvent = event("CLOCK_RECONCILED", 1, 1000100, {});
  const clocked = reduce(started, clockEvent).nextState;
  repository.failNextCommit();
  await assert.rejects(() => repository.commit(clockEvent, clocked), (error) => error.code === "STORAGE_UNAVAILABLE");
  assert.equal((await repository.loadSession(started.sessionId)).revision, 1, "failed transaction changed the snapshot");
  assert.equal(repository.events.size, 1, "failed transaction changed the journal");

  assert.equal((await repository.commit(clockEvent, clocked)).status, "committed");
  assert.equal((await repository.commit(clockEvent, clocked)).status, "duplicate");

  gm.failWrites = true;
  const nextEvent = event("CLOCK_RECONCILED", 2, 1000200, {});
  const next = reduce(clocked, nextEvent).nextState;
  const result = await repository.commit(nextEvent, next);
  assert.equal(result.status, "committed");
  assert.equal(result.mirrorStatus, "failed");
  assert.equal((await repository.loadSession(started.sessionId)).revision, 3, "GM failure rolled back IndexedDB authority");
}

module.exports = { run };
