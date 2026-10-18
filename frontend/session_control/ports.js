"use strict";

const { exactKeys, validateHex128, validateSessionConfig } = require("./models");
const { DB_NAME, SessionControlError } = require("./repository");

const CONFIG_KEY = "thinker.sessionControl.config.v1";
const RECOVERY_KEY = "thinker.sessionControl.recovery.v1";
const POLICY_KEY = "thinker.sessionControl.authorization.v1";
const FORBIDDEN_PATTERN = /[*?\[\]{}()+\\^$|/]/;

function normalizeToken(value, field) {
  if (typeof value !== "string") throw new TypeError(`${field} must be a string`);
  const normalized = value.normalize("NFKC").trim();
  if (!normalized || FORBIDDEN_PATTERN.test(normalized)) throw new TypeError(`${field} must be a non-pattern exact token`);
  return normalized;
}

function validateTokenList(value, field) {
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array`);
  const normalized = value.map((item, index) => normalizeToken(item, `${field}[${index}]`));
  if (new Set(normalized).size !== normalized.length) throw new TypeError(`${field} contains duplicates`);
  return Object.freeze(normalized);
}

function validateAuthorizationPolicy(input) {
  exactKeys(input, ["schemaVersion", "accounts", "contexts", "pools"], [], "authorizationPolicy");
  if (input.schemaVersion !== 1) throw new TypeError("authorizationPolicy.schemaVersion is unsupported");
  return Object.freeze({
    schemaVersion: 1,
    accounts: validateTokenList(input.accounts, "authorizationPolicy.accounts"),
    contexts: validateTokenList(input.contexts, "authorizationPolicy.contexts"),
    pools: validateTokenList(input.pools, "authorizationPolicy.pools"),
  });
}

function evaluateAuthorization(policyInput, observation) {
  const policy = validateAuthorizationPolicy(policyInput);
  exactKeys(observation, ["account", "context", "pool"], [], "authorizationObservation");
  const account = normalizeToken(observation.account, "authorizationObservation.account");
  const context = normalizeToken(observation.context, "authorizationObservation.context");
  const pool = normalizeToken(observation.pool, "authorizationObservation.pool");
  const allowed = policy.accounts.length > 0 && policy.contexts.length > 0 && policy.pools.length > 0 && policy.accounts.includes(account) && policy.contexts.includes(context) && policy.pools.includes(pool);
  return Object.freeze({ schemaVersion: 1, allowed, reason: allowed ? "EXACT_MATCH" : "NOT_AUTHORIZED" });
}

function policyIsFullyEmpty(policy) {
  return policy.accounts.length === 0 && policy.contexts.length === 0 && policy.pools.length === 0;
}

function authorizationError(code, message, cause) {
  return new SessionControlError(code, message, cause);
}

async function resolveAuthorizationPolicy(storagePort, observationInput) {
  const missingPolicy = `__THINKER_SESSION_CONTROL_POLICY_MISSING_V1__:${Date.now()}:${Math.random()}`;
  let observation;
  try {
    exactKeys(observationInput, ["account", "context", "pool"], [], "authorizationObservation");
    observation = Object.freeze({
      account: normalizeToken(observationInput.account, "authorizationObservation.account"),
      context: normalizeToken(observationInput.context, "authorizationObservation.context"),
      pool: normalizeToken(observationInput.pool, "authorizationObservation.pool"),
    });
  } catch (error) {
    throw authorizationError("ACCOUNT_CONTEXT_UNAVAILABLE", "Authorization observation is unavailable", error);
  }
  let rawPolicy;
  try {
    rawPolicy = await storagePort.readPolicyValue(missingPolicy);
  } catch (error) {
    throw authorizationError("AUTHORIZATION_STORAGE_UNAVAILABLE", "Authorization policy could not be read", error);
  }
  const missing = rawPolicy === missingPolicy || rawPolicy === null;
  let policy;
  if (!missing) {
    try {
      policy = validateAuthorizationPolicy(rawPolicy);
    } catch (error) {
      throw authorizationError("AUTHORIZATION_POLICY_INVALID", "Authorization policy is invalid", error);
    }
  }
  const shouldBootstrap = missing || policyIsFullyEmpty(policy);
  if (shouldBootstrap) {
    const exactPolicy = { schemaVersion: 1, accounts: [observation.account], contexts: [observation.context], pools: [observation.pool] };
    try {
      await storagePort.writePolicy(exactPolicy);
      rawPolicy = await storagePort.readPolicyValue(missingPolicy);
    } catch (error) {
      throw authorizationError("AUTHORIZATION_STORAGE_UNAVAILABLE", "Authorization policy could not be persisted", error);
    }
    if (rawPolicy === missingPolicy || rawPolicy === null) throw authorizationError("AUTHORIZATION_STORAGE_UNAVAILABLE", "Authorization policy read-back is unavailable");
    try {
      policy = validateAuthorizationPolicy(rawPolicy);
    } catch (error) {
      throw authorizationError("AUTHORIZATION_BOOTSTRAP_CONFLICT", "Authorization policy changed during bootstrap", error);
    }
    const readBack = evaluateAuthorization(policy, observation);
    if (!readBack.allowed) throw authorizationError("AUTHORIZATION_BOOTSTRAP_CONFLICT", "Authorization policy changed during bootstrap");
    return Object.freeze({ schemaVersion: 1, allowed: true, reason: "BOOTSTRAPPED_EXACT_CONTEXT" });
  }
  const decision = evaluateAuthorization(policy, observation);
  if (!decision.allowed) throw authorizationError("NOT_AUTHORIZED", "Authorization policy does not match the current context");
  return decision;
}

function validateRecoveryPointer(input) {
  exactKeys(input, ["schemaVersion", "sessionId", "revision", "deadlineEpochMs", "dbName"], [], "recovery");
  if (input.schemaVersion !== 1) throw new TypeError("recovery.schemaVersion is unsupported");
  validateHex128(input.sessionId, "recovery.sessionId");
  if (!Number.isInteger(input.revision) || input.revision < 1) throw new TypeError("recovery.revision is invalid");
  if (!Number.isInteger(input.deadlineEpochMs) || input.deadlineEpochMs < 0) throw new TypeError("recovery.deadlineEpochMs is invalid");
  if (input.dbName !== DB_NAME) throw new TypeError("recovery.dbName is invalid");
  return Object.freeze({ ...input });
}

class GmStoragePort {
  constructor(getValue, setValue) {
    if (typeof getValue !== "function" || typeof setValue !== "function") throw new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY", "GM storage functions are required");
    this.getValue = getValue;
    this.setValue = setValue;
  }

  async readConfig(defaultValue) {
    const value = await Promise.resolve(this.getValue(CONFIG_KEY, defaultValue));
    return validateSessionConfig(value);
  }

  async writeConfig(value) {
    const config = validateSessionConfig(value);
    await Promise.resolve(this.setValue(CONFIG_KEY, config));
    return config;
  }

  async readPolicy(defaultValue) {
    const value = await this.readPolicyValue(defaultValue);
    return validateAuthorizationPolicy(value);
  }

  async readPolicyValue(defaultValue) {
    return Promise.resolve(this.getValue(POLICY_KEY, defaultValue));
  }

  async writePolicy(value) {
    const policy = validateAuthorizationPolicy(value);
    await Promise.resolve(this.setValue(POLICY_KEY, policy));
    return policy;
  }

  async readRecovery() {
    const value = await Promise.resolve(this.getValue(RECOVERY_KEY, null));
    return value === null ? null : validateRecoveryPointer(value);
  }

  async writeRecovery(value) {
    const pointer = validateRecoveryPointer(value);
    await Promise.resolve(this.setValue(RECOVERY_KEY, pointer));
    return pointer;
  }
}

function preflightCapabilities(environment) {
  const missing = [];
  if (!environment || !environment.isSecureContext) missing.push("secureContext");
  if (!environment || !environment.indexedDB || typeof environment.indexedDB.open !== "function") missing.push("indexedDB");
  if (!environment || !environment.navigator || !environment.navigator.locks || typeof environment.navigator.locks.request !== "function") missing.push("webLocks");
  if (!environment || typeof environment.BroadcastChannel !== "function") missing.push("broadcastChannel");
  if (!environment || !environment.crypto || !environment.crypto.subtle || typeof environment.crypto.subtle.digest !== "function") missing.push("webCryptoSha256");
  if (!environment || !environment.crypto || typeof environment.crypto.getRandomValues !== "function") missing.push("webCryptoRandom");
  if (!environment || typeof environment.GM_getValue !== "function" || typeof environment.GM_setValue !== "function") missing.push("gmStorage");
  if (missing.length) throw new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY", `Missing capabilities: ${missing.join(",")}`);
  return Object.freeze({ ok: true });
}

function assertCanonicalOrigin(locationObject, topObject, selfObject) {
  if (!locationObject || locationObject.origin !== "https://www.chess.com" || topObject !== selfObject) {
    throw new SessionControlError("UNSUPPORTED_BROWSER_CAPABILITY", "Module 14 requires the canonical top-level origin");
  }
  return true;
}

module.exports = {
  CONFIG_KEY,
  POLICY_KEY,
  RECOVERY_KEY,
  GmStoragePort,
  assertCanonicalOrigin,
  evaluateAuthorization,
  normalizeToken,
  resolveAuthorizationPolicy,
  preflightCapabilities,
  validateAuthorizationPolicy,
  validateRecoveryPointer,
};
