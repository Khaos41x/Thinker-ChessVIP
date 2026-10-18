"use strict";

const assert = require("node:assert/strict");
const { GmStoragePort, POLICY_KEY, assertCanonicalOrigin, evaluateAuthorization, preflightCapabilities, resolveAuthorizationPolicy } = require("../../frontend/session_control");
const { FakeGmStorage, FakeLockManager } = require("../../frontend/session_control/testing");
const { config } = require("./helpers");

async function run() {
  const policy = { schemaVersion: 1, accounts: ["acct"], contexts: ["opaque-context"], pools: ["opaque-pool"] };
  assert.equal(evaluateAuthorization(policy, { account: "acct", context: "opaque-context", pool: "opaque-pool" }).allowed, true);
  assert.equal(evaluateAuthorization(policy, { account: "acct", context: "other", pool: "opaque-pool" }).allowed, false);
  assert.throws(() => evaluateAuthorization({ ...policy, pools: ["*"] }, { account: "acct", context: "opaque-context", pool: "x" }), /non-pattern/);
  assert.equal(evaluateAuthorization({ ...policy, contexts: [] }, { account: "acct", context: "opaque-context", pool: "opaque-pool" }).allowed, false);

  const storage = new FakeGmStorage();
  const port = new GmStoragePort(storage.getValue.bind(storage), storage.setValue.bind(storage));
  await port.writeConfig(config());
  assert.deepEqual(await port.readConfig(null), config());
  const bootstrapped = await resolveAuthorizationPolicy(port, { account: "acct", context: "opaque-context", pool: "opaque-pool" });
  assert.deepEqual(bootstrapped, { schemaVersion: 1, allowed: true, reason: "BOOTSTRAPPED_EXACT_CONTEXT" });
  assert.deepEqual(storage.values.get(POLICY_KEY), policy);
  assert.equal((await resolveAuthorizationPolicy(port, { account: "acct", context: "opaque-context", pool: "opaque-pool" })).reason, "EXACT_MATCH");

  const mismatched = new FakeGmStorage();
  mismatched.values.set(POLICY_KEY, policy);
  const mismatchPort = new GmStoragePort(mismatched.getValue.bind(mismatched), mismatched.setValue.bind(mismatched));
  await assert.rejects(() => resolveAuthorizationPolicy(mismatchPort, { account: "acct", context: "other", pool: "opaque-pool" }), (error) => error.code === "NOT_AUTHORIZED");
  assert.deepEqual(mismatched.values.get(POLICY_KEY), policy);

  for (const invalidPolicy of [
    { schemaVersion: 1, accounts: ["acct"], contexts: [], pools: [] },
    { schemaVersion: 1, accounts: "acct", contexts: [], pools: [] },
  ]) {
    const invalid = new FakeGmStorage();
    invalid.values.set(POLICY_KEY, invalidPolicy);
    const invalidPort = new GmStoragePort(invalid.getValue.bind(invalid), invalid.setValue.bind(invalid));
    const expected = Array.isArray(invalidPolicy.accounts) ? "NOT_AUTHORIZED" : "AUTHORIZATION_POLICY_INVALID";
    await assert.rejects(() => resolveAuthorizationPolicy(invalidPort, { account: "acct", context: "opaque-context", pool: "opaque-pool" }), (error) => error.code === expected);
    assert.deepEqual(invalid.values.get(POLICY_KEY), invalidPolicy);
  }

  const failing = new FakeGmStorage();
  failing.failWrites = true;
  const failingPort = new GmStoragePort(failing.getValue.bind(failing), failing.setValue.bind(failing));
  await assert.rejects(() => resolveAuthorizationPolicy(failingPort, { account: "acct", context: "opaque-context", pool: "opaque-pool" }), (error) => error.code === "AUTHORIZATION_STORAGE_UNAVAILABLE");

  const sentinelCollision = new FakeGmStorage();
  sentinelCollision.values.set(POLICY_KEY, "__THINKER_SESSION_CONTROL_POLICY_MISSING_V1__");
  const sentinelPort = new GmStoragePort(sentinelCollision.getValue.bind(sentinelCollision), sentinelCollision.setValue.bind(sentinelCollision));
  await assert.rejects(() => resolveAuthorizationPolicy(sentinelPort, { account: "acct", context: "opaque-context", pool: "opaque-pool" }), (error) => error.code === "AUTHORIZATION_POLICY_INVALID");

  let conflictReads = 0;
  const conflictPort = {
    readPolicyValue(defaultValue) {
      conflictReads += 1;
      return conflictReads === 1 ? defaultValue : { schemaVersion: 1, accounts: ["other"], contexts: ["other"], pools: ["other"] };
    },
    writePolicy() {},
  };
  await assert.rejects(() => resolveAuthorizationPolicy(conflictPort, { account: "acct", context: "opaque-context", pool: "opaque-pool" }), (error) => error.code === "AUTHORIZATION_BOOTSTRAP_CONFLICT");

  const self = {};
  assert.equal(assertCanonicalOrigin({ origin: "https://www.chess.com" }, self, self), true);
  assert.throws(() => assertCanonicalOrigin({ origin: "https://chess.com" }, self, self), /canonical/);
  assert.throws(() => assertCanonicalOrigin({ origin: "https://www.chess.com" }, {}, self), /canonical/);

  const fake = { open() {} };
  const crypto = { subtle: { digest() {} }, getRandomValues(bytes) { return bytes; } };
  assert.deepEqual(preflightCapabilities({ isSecureContext: true, indexedDB: fake, navigator: { locks: new FakeLockManager() }, BroadcastChannel: function () {}, crypto, GM_getValue() {}, GM_setValue() {} }), { ok: true });
  assert.throws(() => preflightCapabilities({}), (error) => error.code === "UNSUPPORTED_BROWSER_CAPABILITY");
}

module.exports = { run };
