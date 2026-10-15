"use strict";

const { SessionControlError } = require("./repository");

const DEFAULT_LEASE_NAME = "thinker-session-control-writer-v1";
const LEASE_DURATION_MS = 15000;
const RENEWAL_INTERVAL_MS = 5000;

class LeaderCoordinator {
  constructor(options) {
    if (!options || !options.repository || !options.locks || typeof options.locks.request !== "function" || !options.clock) throw new TypeError("repository, Web Locks, and clock are required");
    this.repository = options.repository;
    this.locks = options.locks;
    this.clock = options.clock;
    this.leaseName = options.leaseName || DEFAULT_LEASE_NAME;
    this.leaseDurationMs = options.leaseDurationMs || LEASE_DURATION_MS;
  }

  async acquire(identity) {
    return this.locks.request(this.leaseName, { mode: "exclusive" }, () => this.repository.updateLease({
      leaseName: this.leaseName,
      authorityEpoch: identity.authorityEpoch,
      sessionId: identity.sessionId,
      ownerTabId: identity.ownerTabId,
      nowEpochMs: this.clock.now(),
      leaseDurationMs: this.leaseDurationMs,
    }));
  }

  async renew(identity) {
    return this.acquire(identity);
  }

  async executeEffect(binding, effect) {
    if (typeof effect !== "function") throw new TypeError("effect must be a function");
    return this.locks.request(this.leaseName, { mode: "exclusive" }, async () => {
      await this.repository.assertFence({ ...binding, leaseName: this.leaseName, nowEpochMs: this.clock.now() });
      const result = effect();
      if (result && typeof result.then === "function") throw new SessionControlError("ASYNC_EFFECT_FORBIDDEN", "Irreversible effects must dispatch synchronously while the lock is held");
      return result;
    });
  }

  async executeCommittedEffect(binding, prepare, effect) {
    if (typeof prepare !== "function" || typeof effect !== "function") throw new TypeError("prepare and effect must be functions");
    return this.locks.request(this.leaseName, { mode: "exclusive" }, async () => {
      await this.repository.assertFence({ ...binding, leaseName: this.leaseName, nowEpochMs: this.clock.now() });
      const prepared = await prepare();
      if (!prepared || !prepared.binding) throw new TypeError("prepare must return an updated binding");
      await this.repository.assertFence({ ...prepared.binding, leaseName: this.leaseName, nowEpochMs: this.clock.now() });
      const result = effect();
      if (result && typeof result.then === "function") throw new SessionControlError("ASYNC_EFFECT_FORBIDDEN", "Irreversible effects must dispatch synchronously while the lock is held");
      return Object.freeze({ prepared: prepared.value, result });
    });
  }
}

module.exports = { DEFAULT_LEASE_NAME, LEASE_DURATION_MS, LeaderCoordinator, RENEWAL_INTERVAL_MS };
