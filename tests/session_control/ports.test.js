"use strict";

const assert = require("node:assert/strict");
const { GmStoragePort, assertCanonicalOrigin, evaluateAuthorization, preflightCapabilities } = require("../../frontend/session_control");
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

  const self = {};
  assert.equal(assertCanonicalOrigin({ origin: "https://www.chess.com" }, self, self), true);
  assert.throws(() => assertCanonicalOrigin({ origin: "https://chess.com" }, self, self), /canonical/);
  assert.throws(() => assertCanonicalOrigin({ origin: "https://www.chess.com" }, {}, self), /canonical/);

  const fake = { open() {} };
  const crypto = { subtle: { digest() {} } };
  assert.deepEqual(preflightCapabilities({ isSecureContext: true, indexedDB: fake, navigator: { locks: new FakeLockManager() }, BroadcastChannel: function () {}, crypto, GM_getValue() {}, GM_setValue() {} }), { ok: true });
  assert.throws(() => preflightCapabilities({}), (error) => error.code === "UNSUPPORTED_BROWSER_CAPABILITY");
}

module.exports = { run };
