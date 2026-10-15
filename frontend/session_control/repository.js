"use strict";

const { canonicalStringify, clone, validateEventEnvelope, validateSnapshot, withoutChecksum } = require("./models");

const DB_NAME = "thinker-session-control";
const DB_VERSION = 1;

class SessionControlError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "SessionControlError";
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed"));
  });
}

function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function checksumSnapshot(snapshot, cryptoObject) {
  if (!cryptoObject || !cryptoObject.subtle || typeof cryptoObject.subtle.digest !== "function") throw new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY", "Web Crypto SHA-256 is unavailable");
  const encoded = new TextEncoder().encode(canonicalStringify(withoutChecksum(snapshot)));
  return bytesToHex(new Uint8Array(await cryptoObject.subtle.digest("SHA-256", encoded)));
}

async function recoverAuthority(options) {
  const repository = options.repository;
  const recoveryPort = options.recoveryPort;
  let pointer = null;
  try {
    pointer = recoveryPort ? await recoveryPort.readRecovery() : null;
    const snapshot = await repository.loadCurrentSession(options.accountKey);
    if (!snapshot) {
      return Object.freeze({ status: pointer ? "paused" : "empty", snapshot: null, pauseReason: pointer ? "STORAGE_UNAVAILABLE" : null });
    }
    let mirrorStatus = "current";
    if (recoveryPort && (!pointer || pointer.sessionId !== snapshot.sessionId || pointer.revision !== snapshot.revision || pointer.deadlineEpochMs !== snapshot.deadlineEpochMs)) {
      try {
        await recoveryPort.writeRecovery({ schemaVersion: 1, sessionId: snapshot.sessionId, revision: snapshot.revision, deadlineEpochMs: snapshot.deadlineEpochMs, dbName: DB_NAME });
        mirrorStatus = "repaired";
      } catch (_) {
        mirrorStatus = "failed";
      }
    }
    return Object.freeze({ status: "recovered", snapshot, pauseReason: null, mirrorStatus });
  } catch (error) {
    return Object.freeze({ status: "paused", snapshot: null, pauseReason: error && error.code === "CORRUPT_AUTHORITY" ? "CORRUPT_AUTHORITY" : "STORAGE_UNAVAILABLE" });
  }
}

function createStores(database) {
  const sessions = database.createObjectStore("sessions", { keyPath: "sessionId" });
  sessions.createIndex("phase", "phase", { unique: false });
  const events = database.createObjectStore("events", { keyPath: ["sessionId", "eventId"] });
  events.createIndex("sessionId", "sessionId", { unique: false });
  events.createIndex("sequence", ["sessionId", "sequence"], { unique: true });
  events.createIndex("result", ["sessionId", "canonicalPlatformGameId"], { unique: true });
  database.createObjectStore("leases", { keyPath: "leaseName" });
  database.createObjectStore("metadata", { keyPath: "key" });
}

function openDatabase(indexedDB, name = DB_NAME) {
  if (!indexedDB || typeof indexedDB.open !== "function") return Promise.reject(new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY", "IndexedDB is unavailable"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);
    request.onupgradeneeded = (event) => {
      if (event.oldVersion !== 0) {
        request.transaction.abort();
        return;
      }
      createStores(request.result);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new SessionControlError("STORAGE_UNAVAILABLE", "IndexedDB open failed", request.error));
    request.onblocked = () => reject(new SessionControlError("STORAGE_UNAVAILABLE", "IndexedDB migration is blocked"));
  });
}

class IndexedDbRepository {
  constructor(options) {
    const settings = options || {};
    this.indexedDB = settings.indexedDB;
    this.crypto = settings.crypto;
    this.dbName = settings.dbName || DB_NAME;
    this.recoveryPort = settings.recoveryPort || null;
    this.database = null;
  }

  async open() {
    if (!this.database) this.database = await openDatabase(this.indexedDB, this.dbName);
    return this;
  }

  close() {
    if (this.database) this.database.close();
    this.database = null;
  }

  async _db() {
    await this.open();
    return this.database;
  }

  async loadSession(sessionId) {
    const database = await this._db();
    const transaction = database.transaction(["sessions", "events"], "readonly");
    const snapshotPromise = requestResult(transaction.objectStore("sessions").get(sessionId));
    const eventsPromise = requestResult(transaction.objectStore("events").index("sessionId").getAll(sessionId));
    const [record, events] = await Promise.all([snapshotPromise, eventsPromise, transactionDone(transaction)]);
    if (!record) return null;
    let snapshot;
    try {
      snapshot = validateSnapshot(record);
      const expectedChecksum = await checksumSnapshot(snapshot, this.crypto);
      if (snapshot.checksum !== expectedChecksum) throw new Error("snapshot checksum mismatch");
      const maximumSequence = events.reduce((maximum, event) => Math.max(maximum, event.sequence), 0);
      if (maximumSequence !== snapshot.revision) throw new Error("snapshot and journal revisions diverge");
    } catch (error) {
      throw new SessionControlError("CORRUPT_AUTHORITY", "Stored session failed integrity validation", error);
    }
    return snapshot;
  }

  async loadCurrentSession(accountKey) {
    const database = await this._db();
    const transaction = database.transaction("metadata", "readonly");
    const pointer = await requestResult(transaction.objectStore("metadata").get(`currentSession:${accountKey}`));
    await transactionDone(transaction);
    if (!pointer) return null;
    const snapshot = await this.loadSession(pointer.sessionId);
    if (!snapshot) throw new SessionControlError("CORRUPT_AUTHORITY", "Current-session metadata references a missing snapshot");
    return snapshot;
  }

  async commit(rawEvent, rawNextSnapshot, leaseBinding) {
    const event = validateEventEnvelope(rawEvent);
    const nextSnapshot = validateSnapshot(rawNextSnapshot);
    if (nextSnapshot.sessionId !== event.sessionId || nextSnapshot.revision !== event.sequence || nextSnapshot.authorityEpoch !== event.authorityEpoch) {
      throw new SessionControlError("INVALID_COMMIT", "Event and snapshot identity mismatch");
    }
    const checksum = await checksumSnapshot(nextSnapshot, this.crypto);
    const storedSnapshot = { ...clone(nextSnapshot), checksum };
    const database = await this._db();
    const stores = leaseBinding ? ["sessions", "events", "metadata", "leases"] : ["sessions", "events", "metadata"];
    const transaction = database.transaction(stores, "readwrite");
    try {
      const eventStore = transaction.objectStore("events");
      const existingEvent = await requestResult(eventStore.get([event.sessionId, event.eventId]));
      if (existingEvent) {
        transaction.abort();
        return Object.freeze({ status: "duplicate", event: existingEvent });
      }
      if (event.canonicalPlatformGameId !== undefined) {
        const existingResult = await requestResult(eventStore.index("result").get([event.sessionId, event.canonicalPlatformGameId]));
        if (existingResult) {
          transaction.abort();
          return Object.freeze({ status: "duplicate", event: existingResult });
        }
      }
      const current = await requestResult(transaction.objectStore("sessions").get(event.sessionId));
      const currentRevision = current ? current.revision : 0;
      if (currentRevision !== event.expectedRevision) throw new SessionControlError("REVISION_CONFLICT", "Expected session revision does not match authority");
      if (!current) {
        const pointer = await requestResult(transaction.objectStore("metadata").get(`currentSession:${nextSnapshot.accountKey}`));
        if (pointer && pointer.sessionId !== nextSnapshot.sessionId) {
          const prior = await requestResult(transaction.objectStore("sessions").get(pointer.sessionId));
          if (prior && !["COMPLETED", "ABORTED"].includes(prior.phase)) throw new SessionControlError("ACTIVE_SESSION_EXISTS", "Account already has a nonterminal session");
        }
      }
      if (leaseBinding) {
        const lease = await requestResult(transaction.objectStore("leases").get(leaseBinding.leaseName));
        const floorRecord = await requestResult(transaction.objectStore("metadata").get("wallClockFloor"));
        const now = Math.max(leaseBinding.nowEpochMs, floorRecord ? floorRecord.value : 0);
        if (!lease || lease.authorityEpoch !== event.authorityEpoch || lease.sessionId !== event.sessionId || lease.ownerTabId !== leaseBinding.ownerTabId || lease.fencingToken !== leaseBinding.fencingToken || lease.expiresAtEpochMs <= now) {
          throw new SessionControlError("STALE_FENCE", "Lease fence is missing, expired, or stale");
        }
      }
      eventStore.add(clone(event));
      transaction.objectStore("sessions").put(storedSnapshot);
      transaction.objectStore("metadata").put({ key: `currentSession:${nextSnapshot.accountKey}`, sessionId: nextSnapshot.sessionId });
      await transactionDone(transaction);
    } catch (error) {
      if (transaction.readyState !== "done") {
        try { transaction.abort(); } catch (_) {}
      }
      if (error instanceof SessionControlError) throw error;
      throw new SessionControlError("STORAGE_UNAVAILABLE", "Atomic IndexedDB commit failed", error);
    }
    let mirrorStatus = "not-configured";
    if (this.recoveryPort) {
      try {
        await this.recoveryPort.writeRecovery({ schemaVersion: 1, sessionId: nextSnapshot.sessionId, revision: nextSnapshot.revision, deadlineEpochMs: nextSnapshot.deadlineEpochMs, dbName: this.dbName });
        mirrorStatus = "written";
      } catch (_) {
        mirrorStatus = "failed";
      }
    }
    return Object.freeze({ status: "committed", snapshot: deepFreezeRecord(storedSnapshot), mirrorStatus });
  }

  async updateLease(command) {
    const database = await this._db();
    const transaction = database.transaction(["leases", "metadata"], "readwrite");
    try {
      const leases = transaction.objectStore("leases");
      const metadata = transaction.objectStore("metadata");
      const current = await requestResult(leases.get(command.leaseName));
      const floorRecord = await requestResult(metadata.get("wallClockFloor"));
      const effectiveNowMs = Math.max(command.nowEpochMs, floorRecord ? floorRecord.value : 0);
      metadata.put({ key: "wallClockFloor", value: effectiveNowMs });
      const sameOwner = current && current.authorityEpoch === command.authorityEpoch && current.sessionId === command.sessionId && current.ownerTabId === command.ownerTabId;
      if (current && current.expiresAtEpochMs > effectiveNowMs && !sameOwner) {
        await transactionDone(transaction);
        return Object.freeze({ status: "contended", lease: clone(current), effectiveNowMs });
      }
      const fencingToken = sameOwner && current.expiresAtEpochMs > effectiveNowMs ? current.fencingToken : (current ? current.fencingToken : 0) + 1;
      const lease = {
        leaseName: command.leaseName,
        authorityEpoch: command.authorityEpoch,
        sessionId: command.sessionId,
        ownerTabId: command.ownerTabId,
        fencingToken,
        expiresAtEpochMs: effectiveNowMs + command.leaseDurationMs,
      };
      leases.put(lease);
      await transactionDone(transaction);
      return Object.freeze({ status: sameOwner ? "renewed" : "acquired", lease: Object.freeze(clone(lease)), effectiveNowMs });
    } catch (error) {
      try { transaction.abort(); } catch (_) {}
      throw error instanceof SessionControlError ? error : new SessionControlError("STORAGE_UNAVAILABLE", "Lease update failed", error);
    }
  }

  async assertFence(binding) {
    const database = await this._db();
    const transaction = database.transaction(["leases", "metadata", "sessions"], "readonly");
    const leasePromise = requestResult(transaction.objectStore("leases").get(binding.leaseName));
    const floorPromise = requestResult(transaction.objectStore("metadata").get("wallClockFloor"));
    const snapshotPromise = requestResult(transaction.objectStore("sessions").get(binding.sessionId));
    const [lease, floorRecord, snapshot] = await Promise.all([leasePromise, floorPromise, snapshotPromise, transactionDone(transaction)]);
    const now = Math.max(binding.nowEpochMs, floorRecord ? floorRecord.value : 0);
    if (!lease || lease.authorityEpoch !== binding.authorityEpoch || lease.sessionId !== binding.sessionId || lease.ownerTabId !== binding.ownerTabId || lease.fencingToken !== binding.fencingToken || lease.expiresAtEpochMs <= now) {
      throw new SessionControlError("STALE_FENCE", "Lease fence is missing, expired, or stale");
    }
    if (!snapshot || snapshot.revision !== binding.expectedRevision) throw new SessionControlError("REVISION_CONFLICT", "Effect revision is stale");
    return Object.freeze(clone(lease));
  }
}

function deepFreezeRecord(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreezeRecord);
  }
  return value;
}

module.exports = {
  DB_NAME,
  DB_VERSION,
  IndexedDbRepository,
  SessionControlError,
  checksumSnapshot,
  openDatabase,
  recoverAuthority,
  requestResult,
  transactionDone,
};
