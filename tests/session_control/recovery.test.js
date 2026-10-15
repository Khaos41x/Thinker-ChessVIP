"use strict";

const assert = require("node:assert/strict");
const { GmStoragePort, recoverAuthority, reduce } = require("../../frontend/session_control");
const { FakeGmStorage, MemoryRepository } = require("../../frontend/session_control/testing");
const { startEvent } = require("./helpers");

async function run() {
  const gm = new FakeGmStorage();
  const recoveryPort = new GmStoragePort(gm.getValue.bind(gm), gm.setValue.bind(gm));
  const repository = new MemoryRepository();
  const empty = await recoverAuthority({ repository, recoveryPort, accountKey: "opaque-account" });
  assert.equal(empty.status, "empty");

  await recoveryPort.writeRecovery({ schemaVersion: 1, sessionId: "11111111111111111111111111111111", revision: 1, deadlineEpochMs: 1120000, dbName: "thinker-session-control" });
  const missing = await recoverAuthority({ repository, recoveryPort, accountKey: "opaque-account" });
  assert.deepEqual({ status: missing.status, reason: missing.pauseReason }, { status: "paused", reason: "STORAGE_UNAVAILABLE" });

  const start = startEvent();
  const snapshot = reduce(null, start).nextState;
  await repository.commit(start, snapshot);
  const recovered = await recoverAuthority({ repository, recoveryPort, accountKey: "opaque-account" });
  assert.equal(recovered.status, "recovered");
  assert.equal(recovered.snapshot.revision, 1);
  assert.equal(recovered.mirrorStatus, "current");

  repository.loadCurrentSession = async () => {
    const error = new Error("bad checksum");
    error.code = "CORRUPT_AUTHORITY";
    throw error;
  };
  const corrupt = await recoverAuthority({ repository, recoveryPort, accountKey: "opaque-account" });
  assert.deepEqual({ status: corrupt.status, reason: corrupt.pauseReason, snapshot: corrupt.snapshot }, { status: "paused", reason: "CORRUPT_AUTHORITY", snapshot: null });
}

module.exports = { run };
