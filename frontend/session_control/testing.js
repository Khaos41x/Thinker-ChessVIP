"use strict";

const { clone, validateEventEnvelope, validateSnapshot } = require("./models");
const { SessionControlError } = require("./repository");

class FakeClock {
  constructor(epochMs) {
    this.epochMs = epochMs;
  }

  now() {
    return this.epochMs;
  }

  set(epochMs) {
    this.epochMs = epochMs;
  }

  advance(milliseconds) {
    this.epochMs += milliseconds;
  }
}

class FakeLockManager {
  constructor() {
    this.tails = new Map();
  }

  request(name, options, callback) {
    if (!options || options.mode !== "exclusive") return Promise.reject(new TypeError("only exclusive locks are supported"));
    const previous = this.tails.get(name) || Promise.resolve();
    const run = previous.catch(() => undefined).then(() => callback(Object.freeze({ name, mode: "exclusive" })));
    this.tails.set(name, run.catch(() => undefined));
    return run;
  }
}

class MemoryRepository {
  constructor(options) {
    this.sessions = new Map();
    this.events = new Map();
    this.leases = new Map();
    this.current = new Map();
    this.wallClockFloor = 0;
    this.recoveryPort = options && options.recoveryPort;
    this.failCommit = false;
  }

  failNextCommit() {
    this.failCommit = true;
  }

  async loadSession(sessionId) {
    const value = this.sessions.get(sessionId);
    return value ? validateSnapshot(clone(value)) : null;
  }

  async loadCurrentSession(accountKey) {
    const sessionId = this.current.get(accountKey);
    return sessionId ? this.loadSession(sessionId) : null;
  }

  async commit(rawEvent, rawNextSnapshot, leaseBinding) {
    const event = validateEventEnvelope(rawEvent);
    const snapshot = validateSnapshot(rawNextSnapshot);
    const eventKey = `${event.sessionId}\u0000${event.eventId}`;
    if (this.events.has(eventKey)) return Object.freeze({ status: "duplicate", event: clone(this.events.get(eventKey)) });
    if (this.failCommit) {
      this.failCommit = false;
      throw new SessionControlError("STORAGE_UNAVAILABLE", "Injected transaction failure");
    }
    const current = this.sessions.get(event.sessionId);
    if ((current ? current.revision : 0) !== event.expectedRevision) throw new SessionControlError("REVISION_CONFLICT", "Expected session revision does not match authority");
    if (!current) {
      const priorSessionId = this.current.get(snapshot.accountKey);
      const prior = priorSessionId ? this.sessions.get(priorSessionId) : null;
      if (prior && prior.sessionId !== snapshot.sessionId && !["COMPLETED", "ABORTED"].includes(prior.phase)) throw new SessionControlError("ACTIVE_SESSION_EXISTS", "Account already has a nonterminal session");
    }
    if (leaseBinding) await this.assertFence({ ...leaseBinding, expectedRevision: event.expectedRevision });
    if (event.canonicalPlatformGameId !== undefined) {
      for (const stored of this.events.values()) {
        if (stored.sessionId === event.sessionId && stored.canonicalPlatformGameId === event.canonicalPlatformGameId) return Object.freeze({ status: "duplicate", event: clone(stored) });
      }
    }
    this.events.set(eventKey, clone(event));
    this.sessions.set(snapshot.sessionId, clone(snapshot));
    this.current.set(snapshot.accountKey, snapshot.sessionId);
    let mirrorStatus = "not-configured";
    if (this.recoveryPort) {
      try {
        await this.recoveryPort.writeRecovery({ schemaVersion: 1, sessionId: snapshot.sessionId, revision: snapshot.revision, deadlineEpochMs: snapshot.deadlineEpochMs, dbName: "thinker-session-control" });
        mirrorStatus = "written";
      } catch (_) {
        mirrorStatus = "failed";
      }
    }
    return Object.freeze({ status: "committed", snapshot: clone(snapshot), mirrorStatus });
  }

  async updateLease(command) {
    const current = this.leases.get(command.leaseName);
    const now = Math.max(command.nowEpochMs, this.wallClockFloor);
    this.wallClockFloor = now;
    const sameOwner = current && current.authorityEpoch === command.authorityEpoch && current.sessionId === command.sessionId && current.ownerTabId === command.ownerTabId;
    if (current && current.expiresAtEpochMs > now && !sameOwner) return Object.freeze({ status: "contended", lease: clone(current), effectiveNowMs: now });
    const fencingToken = sameOwner && current.expiresAtEpochMs > now ? current.fencingToken : (current ? current.fencingToken : 0) + 1;
    const lease = { leaseName: command.leaseName, authorityEpoch: command.authorityEpoch, sessionId: command.sessionId, ownerTabId: command.ownerTabId, fencingToken, expiresAtEpochMs: now + command.leaseDurationMs };
    this.leases.set(command.leaseName, lease);
    return Object.freeze({ status: sameOwner ? "renewed" : "acquired", lease: clone(lease), effectiveNowMs: now });
  }

  async assertFence(binding) {
    const lease = this.leases.get(binding.leaseName);
    const now = Math.max(binding.nowEpochMs, this.wallClockFloor);
    const snapshot = this.sessions.get(binding.sessionId);
    if (!lease || lease.authorityEpoch !== binding.authorityEpoch || lease.sessionId !== binding.sessionId || lease.ownerTabId !== binding.ownerTabId || lease.fencingToken !== binding.fencingToken || lease.expiresAtEpochMs <= now) throw new SessionControlError("STALE_FENCE", "Lease fence is missing, expired, or stale");
    if (binding.expectedRevision !== undefined && (!snapshot || snapshot.revision !== binding.expectedRevision)) throw new SessionControlError("REVISION_CONFLICT", "Effect revision is stale");
    return Object.freeze(clone(lease));
  }
}

class FakeGmStorage {
  constructor() {
    this.values = new Map();
    this.failWrites = false;
  }

  getValue(key, fallback) {
    return this.values.has(key) ? clone(this.values.get(key)) : fallback;
  }

  setValue(key, value) {
    if (this.failWrites) throw new Error("Injected GM failure");
    this.values.set(key, clone(value));
  }
}

module.exports = { FakeClock, FakeGmStorage, FakeLockManager, MemoryRepository };
