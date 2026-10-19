"use strict";

const { SessionControlController } = require("./controller");
const { LeaderCoordinator, RENEWAL_INTERVAL_MS } = require("./leader");
const { exactKeys, validateSessionConfig } = require("./models");
const { GmStoragePort, assertCanonicalOrigin, preflightCapabilities, resolveAuthorizationPolicy } = require("./ports");
const { IndexedDbRepository, SessionControlError } = require("./repository");
const { validateRollout } = require("./status");
const { BoundedTelemetry } = require("./telemetry");

const ROLLOUT_KEY = "thinker.sessionControl.rollout.v1";
const AUTHORIZATION_LOCK_NAME = "thinker-session-control-authorization-v1";
const BOOTSTRAP_STATES = Object.freeze(["PENDING", "READY", "FAILED"]);

function reasonCode(error, fallback) {
  if (error && typeof error.code === "string" && error.code) return error.code;
  if (error && typeof error.reason === "string" && error.reason) return error.reason;
  if (error && typeof error.message === "string" && /^[A-Z][A-Z0-9_]+$/.test(error.message)) return error.message;
  return fallback;
}

function typedError(code, cause) {
  return new SessionControlError(code, code, cause);
}

function randomHex128(cryptoObject) {
  const bytes = new Uint8Array(16);
  cryptoObject.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function validateStartReadiness(observation, config, nowEpochMs) {
  if (!observation || typeof observation !== "object") throw typedError("ACCOUNT_CONTEXT_UNAVAILABLE");
  const readiness = observation.calibrationReadiness;
  if (!readiness || readiness.active !== true) {
    const reported = readiness && typeof readiness.reason === "string" && /^[A-Z][A-Z0-9_]+$/.test(readiness.reason) ? readiness.reason : "CALIBRATION_NOT_ACTIVE";
    throw typedError(reported);
  }
  try {
    exactKeys(readiness, ["schemaVersion", "active", "opponentRatingScaleId", "targetScaleId", "ratingScaleMappingVersion", "ratingScaleMappingChecksum", "artifactVersion", "artifactChecksum", "sourceMinimum", "sourceMaximum", "generatedAtEpochMs", "expiresAtEpochMs"], ["executionMode", "reasonCode", "supportedOpponentRatingScaleIds"], "calibrationReadiness");
  } catch (error) {
    throw typedError("CALIBRATION_UNAVAILABLE", error);
  }
  if (readiness.schemaVersion !== 1 || typeof readiness.opponentRatingScaleId !== "string" || typeof readiness.targetScaleId !== "string") throw typedError("CALIBRATION_UNAVAILABLE");
  for (const field of ["ratingScaleMappingVersion", "ratingScaleMappingChecksum", "artifactVersion", "artifactChecksum"]) if (typeof readiness[field] !== "string" || !readiness[field]) throw typedError("CALIBRATION_UNAVAILABLE");
  if (!Number.isFinite(readiness.sourceMinimum) || !Number.isFinite(readiness.sourceMaximum) || readiness.sourceMinimum >= readiness.sourceMaximum) throw typedError("CALIBRATION_UNAVAILABLE");
  if (!Number.isInteger(readiness.generatedAtEpochMs) || readiness.generatedAtEpochMs > nowEpochMs) throw typedError("CALIBRATION_UNAVAILABLE");
  if (typeof observation.intendedQueueScaleId !== "string" || !observation.intendedQueueScaleId) throw typedError("CONTEXT_UNIDENTIFIABLE");
  if (readiness.opponentRatingScaleId !== observation.intendedQueueScaleId || readiness.targetScaleId !== config.scaleId) throw typedError("CALIBRATION_SCALE_MISMATCH");
  if (!Number.isInteger(readiness.expiresAtEpochMs)) throw typedError("CALIBRATION_UNAVAILABLE");
  if (readiness.expiresAtEpochMs <= nowEpochMs) throw typedError("CALIBRATION_EXPIRED");
  return true;
}

function negotiateExecutionMode(observation, config, nowEpochMs) {
  if (!observation || typeof observation !== "object") throw typedError("ACCOUNT_CONTEXT_UNAVAILABLE");
  const readiness = observation.calibrationReadiness;
  if (!readiness || typeof readiness !== "object" || readiness.schemaVersion !== 1) throw typedError("CALIBRATION_UNAVAILABLE");
  if (typeof observation.intendedQueueScaleId !== "string" || !observation.intendedQueueScaleId) throw typedError("CONTEXT_UNIDENTIFIABLE");
  if (readiness.opponentRatingScaleId !== observation.intendedQueueScaleId) throw typedError("CALIBRATION_SCALE_MISMATCH");
  if (!Number.isInteger(readiness.generatedAtEpochMs) || readiness.generatedAtEpochMs > nowEpochMs || !Number.isInteger(readiness.expiresAtEpochMs) || readiness.expiresAtEpochMs <= nowEpochMs) throw typedError("CALIBRATION_EXPIRED");
  if (readiness.active === true) {
    validateStartReadiness(observation, config, nowEpochMs);
    return Object.freeze({ executionMode: "ACTIVE_DDA", warningCode: null });
  }
  const code = typeof readiness.reasonCode === "string" && /^[A-Z][A-Z0-9_]+$/.test(readiness.reasonCode) ? readiness.reasonCode : "DDA_MAPPING_UNAVAILABLE";
  if (!["DDA_MAPPING_UNAVAILABLE", "CALIBRATION_NOT_ACTIVE", "CALIBRATION_UNAVAILABLE"].includes(code)) throw typedError(code);
  return Object.freeze({ executionMode: "COMPATIBILITY", warningCode: code });
}

function createSessionControlRuntime(options) {
  const settings = options || {};
  if (!settings.controller || !settings.storagePort || typeof settings.observeStartContext !== "function") throw new TypeError("controller, storagePort, and observeStartContext are required");
  const controller = settings.controller;
  const clock = settings.clock || { now: () => Date.now() };
  const rollout = validateRollout(settings.rollout || { schemaVersion: 1, stage: "ACTIVE_DDA" });
  const setIntervalFn = settings.setInterval || globalThis.setInterval;
  const clearIntervalFn = settings.clearInterval || globalThis.clearInterval;
  const renewalIntervalMs = settings.renewalIntervalMs === undefined ? RENEWAL_INTERVAL_MS : settings.renewalIntervalMs;
  if (!Number.isInteger(renewalIntervalMs) || renewalIntervalMs <= 0) throw new TypeError("renewalIntervalMs must be a positive integer");
  let renewalTimer = null;
  let renewalInFlight = false;
  let disposed = false;
  let generation = 0;
  let startPromise = null;

  function ensureRenewal() {
    if (renewalTimer !== null || typeof setIntervalFn !== "function") return;
    renewalTimer = setIntervalFn(() => {
      if (!controller.isActive() || renewalInFlight) return;
      renewalInFlight = true;
      Promise.resolve(controller.renewLeadership()).then(async (result) => {
        if (!result || result.allowed !== true) throw typedError(result && result.reason || "LEADERSHIP_RENEWAL_FAILED");
        controller.setStorageHealthy(true);
        await controller.reconcileNow();
      }).catch((error) => {
        controller.setStorageHealthy(false);
        controller.setLease(null);
        if (typeof settings.onWarning === "function") settings.onWarning(reasonCode(error, "LEADERSHIP_RENEWAL_FAILED"));
      }).finally(() => { renewalInFlight = false; });
    }, renewalIntervalMs);
  }

  async function start(configInput) {
    if (startPromise) return startPromise;
    startPromise = (async () => {
      const startGeneration = generation;
      const assertCurrent = () => {
        if (disposed || generation !== startGeneration) throw typedError("SESSION_RUNTIME_UNAVAILABLE");
      };
      const assertStartAllowed = () => {
        if (typeof settings.canStart !== "function") return;
        const result = settings.canStart();
        if (result !== true) throw typedError(typeof result === "string" && result ? result : "SESSION_START_BLOCKED");
      };
      assertCurrent();
      assertStartAllowed();
      if (rollout.stage === "DISABLED") throw typedError("ROLLOUT_DISABLED");
      if (controller.isActive()) throw typedError("ACTIVE_SESSION_EXISTS");
      let config;
      try {
        config = validateSessionConfig(configInput);
      } catch (error) {
        throw typedError("SESSION_CONFIG_INVALID", error);
      }
      let observation;
      try {
        observation = await settings.observeStartContext(config);
      } catch (error) {
        throw typedError(reasonCode(error, "ACCOUNT_CONTEXT_UNAVAILABLE"), error);
      }
      assertCurrent();
      if (!observation || typeof observation.accountKey !== "string" || !observation.accountKey) throw typedError("ACCOUNT_CONTEXT_UNAVAILABLE");
      const negotiation = settings.negotiateExecutionMode ? settings.negotiateExecutionMode(observation, config, clock.now()) : negotiateExecutionMode(observation, config, clock.now());
      controller.setExecutionMode(negotiation.executionMode);
      if (typeof settings.onMode === "function") settings.onMode(negotiation);
      const commitStart = async () => {
        let current;
        try {
          current = await settings.observeStartContext(config);
        } catch (error) {
          throw typedError(reasonCode(error, "ACCOUNT_CONTEXT_UNAVAILABLE"), error);
        }
        if (!current || current.accountKey !== observation.accountKey || current.context !== observation.context || current.pool !== observation.pool || current.intendedQueueScaleId !== observation.intendedQueueScaleId) throw typedError("START_CONTEXT_CHANGED");
        const authorizationDecision = await resolveAuthorizationPolicy(settings.storagePort, {
          account: current.accountKey,
          context: current.context,
          pool: current.pool,
        });
        assertCurrent();
        if (!controller.snapshot) await controller.recoverSession(observation.accountKey);
        assertCurrent();
        if (controller.isActive()) {
          ensureRenewal();
          throw typedError("ACTIVE_SESSION_EXISTS");
        }
        const currentNegotiation = settings.negotiateExecutionMode ? settings.negotiateExecutionMode(current, config, clock.now()) : negotiateExecutionMode(current, config, clock.now());
        if (currentNegotiation.executionMode !== negotiation.executionMode) throw typedError("CALIBRATION_STATE_CHANGED");
        controller.setExecutionMode(currentNegotiation.executionMode);
        assertStartAllowed();
        try {
          const snapshot = await controller.startSession({
            accountKey: current.accountKey,
            authorizationDecision,
            config,
            executionReasonCode: currentNegotiation.warningCode,
            activationContext: { context: current.context, pool: current.pool, opponentRatingScaleId: current.intendedQueueScaleId },
          });
          try {
            assertStartAllowed();
          } catch (error) {
            if (controller.isActive()) await controller.requestGracefulStop();
            throw error;
          }
          if (disposed || generation !== startGeneration) {
            try { await controller.requestGracefulStop(); } catch (_) {}
            throw typedError("SESSION_RUNTIME_UNAVAILABLE");
          }
          ensureRenewal();
          return snapshot;
        } catch (error) {
          if (controller.isActive()) ensureRenewal();
          throw error;
        }
      };
      const locks = settings.authorizationLocks;
      if (locks && typeof locks.request === "function") return locks.request(AUTHORIZATION_LOCK_NAME, { mode: "exclusive" }, commitStart);
      return commitStart();
    })();
    try {
      return await startPromise;
    } catch (error) {
      if (error instanceof SessionControlError) throw error;
      throw typedError(reasonCode(error, "SESSION_START_FAILED"), error);
    } finally {
      startPromise = null;
    }
  }

  function dispose() {
    disposed = true;
    generation += 1;
    if (renewalTimer !== null && typeof clearIntervalFn === "function") clearIntervalFn(renewalTimer);
    renewalTimer = null;
    const closeRepository = () => {
      if (settings.repository && typeof settings.repository.close === "function") settings.repository.close();
    };
    if (startPromise) Promise.resolve(startPromise).then(closeRepository, closeRepository);
    else closeRepository();
  }

  async function recover(accountKey) {
    if (typeof accountKey !== "string" || !accountKey) throw typedError("ACCOUNT_CONTEXT_UNAVAILABLE");
    const snapshot = await controller.recoverSession(accountKey);
    if (controller.isActive()) {
      ensureRenewal();
      if (typeof settings.onMode === "function") settings.onMode(Object.freeze({ executionMode: controller.executionMode, warningCode: snapshot.executionReasonCode, recovered: true }));
    }
    return snapshot;
  }

  return Object.freeze({ controller, dispose, ensureRenewal, recover, rollout, start });
}

function createSessionControlBootstrap(options) {
  const settings = options || {};
  let state = Object.freeze({ phase: "PENDING", reasonCode: null, runtime: null });
  let promise = null;

  function begin() {
    if (promise) return promise;
    promise = (async () => {
      try {
        const environment = settings.environment || globalThis;
        assertCanonicalOrigin(settings.location || environment.location, settings.top || environment.top, settings.self || environment.self);
        preflightCapabilities(environment);
        const api = settings.api || module.exports;
        const storagePort = settings.storagePort || new GmStoragePort(environment.GM_getValue, environment.GM_setValue);
        const missingRollout = "__THINKER_SESSION_CONTROL_ROLLOUT_MISSING_V1__";
        let rawRollout;
        try {
          rawRollout = await Promise.resolve(environment.GM_getValue(ROLLOUT_KEY, missingRollout));
        } catch (error) {
          throw typedError("ROLLOUT_CONFIG_INVALID", error);
        }
        let rollout;
        try {
          rollout = rawRollout === missingRollout || rawRollout === null
            ? { schemaVersion: 1, stage: "ACTIVE_DDA" }
            : validateRollout(rawRollout);
        } catch (error) {
          throw typedError("ROLLOUT_CONFIG_INVALID", error);
        }
        const clock = settings.clock || { now: () => Date.now() };
        const telemetry = settings.telemetry || new BoundedTelemetry();
        const repository = settings.repository || new IndexedDbRepository({ indexedDB: environment.indexedDB, crypto: environment.crypto, recoveryPort: storagePort });
        const leader = settings.leader || new LeaderCoordinator({ repository, locks: environment.navigator.locks, clock });
        const ownerTabId = settings.ownerTabId || randomHex128(environment.crypto);
        const controller = settings.controller || new SessionControlController({
          repository,
          leader,
          clock,
          ownerTabId,
          idFactory: settings.idFactory || (() => randomHex128(environment.crypto)),
          telemetry,
          rolloutStage: rollout.stage,
        });
        const runtime = createSessionControlRuntime({ ...settings, controller, storagePort, repository, clock, rollout, authorizationLocks: settings.authorizationLocks || environment.navigator.locks });
        if (typeof settings.install === "function") await settings.install(runtime, { controller, repository, storagePort, telemetry, rollout });
        state = Object.freeze({ phase: "READY", reasonCode: null, runtime });
        return runtime;
      } catch (error) {
        const code = reasonCode(error, "SESSION_RUNTIME_UNAVAILABLE");
        state = Object.freeze({ phase: "FAILED", reasonCode: code, runtime: null });
        throw typedError(code, error);
      }
    })();
    return promise;
  }

  return Object.freeze({ begin, getState: () => state });
}

module.exports = {
  AUTHORIZATION_LOCK_NAME,
  BOOTSTRAP_STATES,
  ROLLOUT_KEY,
  createSessionControlBootstrap,
  createSessionControlRuntime,
  negotiateExecutionMode,
  randomHex128,
  reasonCode,
  validateStartReadiness,
};
