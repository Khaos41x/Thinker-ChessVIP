"use strict";

const SCHEMA_VERSION = 1;
const REDUCER_VERSION = "session-control-reducer-v1";
const ESTIMATOR_VERSION = "beta-binomial-terminal-v1";
const CONTROLLER_VERSION = "two-threshold-hysteresis-v1";

const PHASES = Object.freeze(["IDLE", "QUEUEING", "IN_GAME", "DRAINING", "PAUSED_QUEUEING", "PAUSED_ACTIVE", "COMPLETED", "ABORTED"]);
const MODES = Object.freeze(["BOOST", "CORRECT"]);
const OUTCOMES = Object.freeze(["WIN", "DRAW", "LOSS"]);
const EXECUTION_MODES = Object.freeze(["ACTIVE_DDA", "COMPATIBILITY"]);
const QUEUE_INTENT_STATUSES = Object.freeze(["PREPARED", "CLAIMED", "DISPATCHED", "MATCH_OBSERVED", "CANCELLED", "AMBIGUOUS"]);
const TERMINAL_PHASES = Object.freeze(["COMPLETED", "ABORTED"]);
const HEX_128 = /^[0-9a-f]{32}$/;

function fail(message) {
  throw new TypeError(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function requireObject(value, field) {
  if (!isPlainObject(value)) fail(`${field} must be an object`);
  return value;
}

function exactKeys(value, required, optional, field) {
  requireObject(value, field);
  const allowed = new Set(required.concat(optional || []));
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${field}.${key} is unknown`);
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(value, key)) fail(`${field}.${key} is required`);
}

function integer(value, minimum, maximum, field) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) fail(`${field} must be an integer within [${minimum},${maximum}]`);
  return value;
}

function finiteRate(value, field) {
  if (!Number.isFinite(value) || value < 0 || value > 1) fail(`${field} must be within [0,1]`);
  return value;
}

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.length === 0) fail(`${field} must be a non-empty string`);
  return value;
}

function nullable(value, validator) {
  return value === null ? null : validator(value);
}

function enumValue(value, choices, field) {
  if (!choices.includes(value)) fail(`${field} is invalid`);
  return value;
}

function validateHex128(value, field) {
  if (!HEX_128.test(value)) fail(`${field} must be 128-bit lowercase hex`);
  return value;
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const item of Object.values(value)) deepFreeze(item);
  return value;
}

function canonicalStringify(value) {
  function canonical(item) {
    if (Array.isArray(item)) return item.map(canonical);
    if (isPlainObject(item)) {
      const output = {};
      for (const key of Object.keys(item).sort()) output[key] = canonical(item[key]);
      return output;
    }
    if (typeof item === "number" && !Number.isFinite(item)) fail("canonical JSON cannot contain non-finite numbers");
    return item;
  }
  return JSON.stringify(canonical(value));
}

function validateSessionConfig(input) {
  const required = ["schemaVersion", "durationMs", "minWinRate", "maxWinRate", "boostOffsetElo", "correctionOffsetElo", "minCompletedGames", "perceptionElo", "scaleId", "estimatorVersion", "controllerVersion", "minimumAdmissionHeadroomMs", "queueObservationTimeoutMs", "maximumDrainMs", "maximumConsecutiveSaturatedGames"];
  exactKeys(input, required, [], "config");
  if (input.schemaVersion !== SCHEMA_VERSION) fail("config.schemaVersion is unsupported");
  integer(input.durationMs, 60000, 86400000, "config.durationMs");
  finiteRate(input.minWinRate, "config.minWinRate");
  finiteRate(input.maxWinRate, "config.maxWinRate");
  if (!(input.minWinRate > 0 && input.minWinRate < input.maxWinRate && input.maxWinRate < 1)) fail("config win-rate bounds are invalid");
  integer(input.boostOffsetElo, -1000, 1000, "config.boostOffsetElo");
  integer(input.correctionOffsetElo, -1000, 1000, "config.correctionOffsetElo");
  integer(input.minCompletedGames, 1, 100, "config.minCompletedGames");
  integer(input.perceptionElo, 1, 10000, "config.perceptionElo");
  nonEmptyString(input.scaleId, "config.scaleId");
  if (input.estimatorVersion !== ESTIMATOR_VERSION) fail("config.estimatorVersion is unsupported");
  if (input.controllerVersion !== CONTROLLER_VERSION) fail("config.controllerVersion is unsupported");
  integer(input.minimumAdmissionHeadroomMs, 5000, 600000, "config.minimumAdmissionHeadroomMs");
  if (input.minimumAdmissionHeadroomMs >= input.durationMs) fail("config.minimumAdmissionHeadroomMs must be less than durationMs");
  integer(input.queueObservationTimeoutMs, 10000, 600000, "config.queueObservationTimeoutMs");
  integer(input.maximumDrainMs, 60000, 14400000, "config.maximumDrainMs");
  integer(input.maximumConsecutiveSaturatedGames, 1, 20, "config.maximumConsecutiveSaturatedGames");
  return deepFreeze(clone(input));
}

function validateCounts(input, field) {
  exactKeys(input, ["wins", "draws", "losses", "terminalGames"], [], field);
  for (const key of ["wins", "draws", "losses", "terminalGames"]) integer(input[key], 0, Number.MAX_SAFE_INTEGER, `${field}.${key}`);
  if (input.wins + input.draws + input.losses !== input.terminalGames) fail(`${field}.terminalGames is inconsistent`);
  return deepFreeze(clone(input));
}

function validateQueueIntent(input) {
  if (input === null) return null;
  exactKeys(input, ["schemaVersion", "intentId", "runtimeGameToken", "status", "preparedAtEpochMs", "claimedByFence", "dispatchedAtEpochMs", "observeUntilEpochMs"], [], "queueIntent");
  if (input.schemaVersion !== SCHEMA_VERSION) fail("queueIntent.schemaVersion is unsupported");
  validateHex128(input.intentId, "queueIntent.intentId");
  validateHex128(input.runtimeGameToken, "queueIntent.runtimeGameToken");
  enumValue(input.status, QUEUE_INTENT_STATUSES, "queueIntent.status");
  integer(input.preparedAtEpochMs, 0, Number.MAX_SAFE_INTEGER, "queueIntent.preparedAtEpochMs");
  nullable(input.claimedByFence, (value) => integer(value, 1, Number.MAX_SAFE_INTEGER, "queueIntent.claimedByFence"));
  nullable(input.dispatchedAtEpochMs, (value) => integer(value, 0, Number.MAX_SAFE_INTEGER, "queueIntent.dispatchedAtEpochMs"));
  nullable(input.observeUntilEpochMs, (value) => integer(value, 0, Number.MAX_SAFE_INTEGER, "queueIntent.observeUntilEpochMs"));
  if (input.status === "PREPARED" && (input.claimedByFence !== null || input.dispatchedAtEpochMs !== null || input.observeUntilEpochMs !== null)) fail("PREPARED queue intent has advanced fields");
  if (["CLAIMED", "DISPATCHED", "MATCH_OBSERVED", "AMBIGUOUS"].includes(input.status) && input.claimedByFence === null) fail("claimed queue intent requires a fence");
  if (["DISPATCHED", "MATCH_OBSERVED"].includes(input.status) && (input.dispatchedAtEpochMs === null || input.observeUntilEpochMs === null)) fail("dispatched queue intent requires dispatch timestamps");
  return deepFreeze(clone(input));
}

function validateController(input, counts) {
  exactKeys(input, ["mode", "posteriorWinRate", "decisionAtGameCount"], [], "controller");
  enumValue(input.mode, MODES, "controller.mode");
  finiteRate(input.posteriorWinRate, "controller.posteriorWinRate");
  integer(input.decisionAtGameCount, 0, Number.MAX_SAFE_INTEGER, "controller.decisionAtGameCount");
  const expected = (counts.wins + 1) / (counts.terminalGames + 2);
  if (Math.abs(input.posteriorWinRate - expected) > Number.EPSILON * 4) fail("controller.posteriorWinRate is inconsistent");
  return deepFreeze(clone(input));
}

function validateActiveGame(input) {
  if (input === null) return null;
  requireObject(input, "activeGame");
  if (input.schemaVersion !== SCHEMA_VERSION) fail("activeGame.schemaVersion is unsupported");
  for (const field of ["canonicalPlatformGameId", "queueIntentId", "admittedAtEpochMs", "runtimeGameToken", "targetPinStatus", "calibrationCapabilityExpiresAtEpochMs", "lastFen", "positionRevision", "opponent", "actuator", "actuation"]) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) fail(`activeGame.${field} is required`);
  }
  exactKeys(input, ["schemaVersion", "canonicalPlatformGameId", "queueIntentId", "admittedAtEpochMs", "runtimeGameToken", "targetPinStatus", "calibrationCapabilityExpiresAtEpochMs", "lastFen", "positionRevision", "opponent", "actuator", "actuation"], [], "activeGame");
  nonEmptyString(input.canonicalPlatformGameId, "activeGame.canonicalPlatformGameId");
  validateHex128(input.queueIntentId, "activeGame.queueIntentId");
  validateHex128(input.runtimeGameToken, "activeGame.runtimeGameToken");
  enumValue(input.targetPinStatus, ["PENDING", "PINNED"], "activeGame.targetPinStatus");
  integer(input.admittedAtEpochMs, 0, Number.MAX_SAFE_INTEGER, "activeGame.admittedAtEpochMs");
  nullable(input.calibrationCapabilityExpiresAtEpochMs, (value) => integer(value, 0, Number.MAX_SAFE_INTEGER, "activeGame.calibrationCapabilityExpiresAtEpochMs"));
  if (typeof input.lastFen !== "string") fail("activeGame.lastFen must be a string");
  integer(input.positionRevision, 0, Number.MAX_SAFE_INTEGER, "activeGame.positionRevision");
  exactKeys(input.opponent, ["rating", "ratingScaleId", "source", "confidence", "observedAtEpochMs"], [], "activeGame.opponent");
  integer(input.opponent.rating, 1, 10000, "activeGame.opponent.rating");
  nonEmptyString(input.opponent.ratingScaleId, "activeGame.opponent.ratingScaleId");
  nonEmptyString(input.opponent.source, "activeGame.opponent.source");
  finiteRate(input.opponent.confidence, "activeGame.opponent.confidence");
  integer(input.opponent.observedAtEpochMs, 0, Number.MAX_SAFE_INTEGER, "activeGame.opponent.observedAtEpochMs");
  if (input.targetPinStatus === "PENDING") {
    if (input.actuator !== null || input.calibrationCapabilityExpiresAtEpochMs !== null) fail("pending active game cannot contain a pinned actuator");
  } else {
    exactKeys(input.actuator, ["controllerMode", "offsetElo", "rawTargetElo", "effectiveTargetElo", "ratingScaleMappingVersion", "ratingScaleMappingChecksum", "saturated", "saturationReason", "scaleId", "artifactChecksum", "artifactVersion", "cohort", "rolloutVersion", "seedPolicyVersion", "requiredBudgetClass"], [], "activeGame.actuator");
    enumValue(input.actuator.controllerMode, MODES, "activeGame.actuator.controllerMode");
    integer(input.actuator.offsetElo, -1000, 1000, "activeGame.actuator.offsetElo");
    integer(input.actuator.rawTargetElo, -100000, 100000, "activeGame.actuator.rawTargetElo");
    integer(input.actuator.effectiveTargetElo, 1, 10000, "activeGame.actuator.effectiveTargetElo");
    for (const field of ["ratingScaleMappingVersion", "ratingScaleMappingChecksum", "scaleId", "artifactChecksum", "artifactVersion", "cohort", "rolloutVersion", "seedPolicyVersion", "requiredBudgetClass"]) nonEmptyString(input.actuator[field], `activeGame.actuator.${field}`);
    if (typeof input.actuator.saturated !== "boolean") fail("activeGame.actuator.saturated must be boolean");
    nullable(input.actuator.saturationReason, (value) => nonEmptyString(value, "activeGame.actuator.saturationReason"));
    if (input.calibrationCapabilityExpiresAtEpochMs === null) fail("pinned active game requires capability expiry");
  }
  exactKeys(input.actuation, ["valid", "invalidReason", "appliedMoveCount", "nonAppliedMoveCount", "resolvedProfile"], [], "activeGame.actuation");
  if (typeof input.actuation.valid !== "boolean") fail("activeGame.actuation.valid must be boolean");
  nullable(input.actuation.invalidReason, (value) => nonEmptyString(value, "activeGame.actuation.invalidReason"));
  integer(input.actuation.appliedMoveCount, 0, Number.MAX_SAFE_INTEGER, "activeGame.actuation.appliedMoveCount");
  integer(input.actuation.nonAppliedMoveCount, 0, Number.MAX_SAFE_INTEGER, "activeGame.actuation.nonAppliedMoveCount");
  if (input.actuation.resolvedProfile !== null) {
    exactKeys(input.actuation.resolvedProfile, ["resolverVersion", "resolutionKey", "latentSkill", "appliedSkill", "budgetClass", "profileDigest"], [], "activeGame.actuation.resolvedProfile");
    for (const field of ["resolverVersion", "resolutionKey", "budgetClass", "profileDigest"]) nonEmptyString(input.actuation.resolvedProfile[field], `activeGame.actuation.resolvedProfile.${field}`);
    if (!Number.isFinite(input.actuation.resolvedProfile.latentSkill)) fail("activeGame.actuation.resolvedProfile.latentSkill must be finite");
    integer(input.actuation.resolvedProfile.appliedSkill, -1000, 1000, "activeGame.actuation.resolvedProfile.appliedSkill");
  }
  return deepFreeze(clone(input));
}

function validateSnapshot(input) {
  const required = ["schemaVersion", "sessionId", "authorityEpoch", "revision", "accountKey", "phase", "createdAtEpochMs", "startedAtEpochMs", "deadlineEpochMs", "enteredDrainingAtEpochMs", "drainDeadlineEpochMs", "lastObservedEpochMs", "config", "observedCounts", "controlCounts", "consecutiveSaturatedEligibleGames", "saturationControllerMode", "controller", "queueIntent", "activeGame", "pauseReason", "completionReason"];
  exactKeys(input, required, ["checksum", "executionMode", "executionReasonCode", "activationContext"], "snapshot");
  if (input.schemaVersion !== SCHEMA_VERSION) fail("snapshot.schemaVersion is unsupported");
  validateHex128(input.sessionId, "snapshot.sessionId");
  integer(input.authorityEpoch, 1, Number.MAX_SAFE_INTEGER, "snapshot.authorityEpoch");
  integer(input.revision, 0, Number.MAX_SAFE_INTEGER, "snapshot.revision");
  nonEmptyString(input.accountKey, "snapshot.accountKey");
  const executionMode = input.executionMode === undefined ? "ACTIVE_DDA" : enumValue(input.executionMode, EXECUTION_MODES, "snapshot.executionMode");
  const executionReasonCode = input.executionReasonCode === undefined || input.executionReasonCode === null ? null : nonEmptyString(input.executionReasonCode, "snapshot.executionReasonCode");
  let activationContext = null;
  if (input.activationContext !== undefined && input.activationContext !== null) {
    exactKeys(input.activationContext, ["context", "pool", "opponentRatingScaleId"], [], "snapshot.activationContext");
    activationContext = {
      context: nonEmptyString(input.activationContext.context, "snapshot.activationContext.context"),
      pool: nonEmptyString(input.activationContext.pool, "snapshot.activationContext.pool"),
      opponentRatingScaleId: nonEmptyString(input.activationContext.opponentRatingScaleId, "snapshot.activationContext.opponentRatingScaleId"),
    };
  }
  enumValue(input.phase, PHASES, "snapshot.phase");
  for (const field of ["createdAtEpochMs", "startedAtEpochMs", "deadlineEpochMs", "lastObservedEpochMs"]) integer(input[field], 0, Number.MAX_SAFE_INTEGER, `snapshot.${field}`);
  nullable(input.enteredDrainingAtEpochMs, (value) => integer(value, 0, Number.MAX_SAFE_INTEGER, "snapshot.enteredDrainingAtEpochMs"));
  nullable(input.drainDeadlineEpochMs, (value) => integer(value, 0, Number.MAX_SAFE_INTEGER, "snapshot.drainDeadlineEpochMs"));
  if (input.deadlineEpochMs !== input.startedAtEpochMs + input.config.durationMs) fail("snapshot.deadlineEpochMs is inconsistent");
  if (input.lastObservedEpochMs < input.startedAtEpochMs) fail("snapshot.lastObservedEpochMs cannot precede start");
  const config = validateSessionConfig(input.config);
  const observedCounts = validateCounts(input.observedCounts, "observedCounts");
  const controlCounts = validateCounts(input.controlCounts, "controlCounts");
  integer(input.consecutiveSaturatedEligibleGames, 0, Number.MAX_SAFE_INTEGER, "snapshot.consecutiveSaturatedEligibleGames");
  nullable(input.saturationControllerMode, (value) => enumValue(value, MODES, "snapshot.saturationControllerMode"));
  const controller = validateController(input.controller, controlCounts);
  validateQueueIntent(input.queueIntent);
  validateActiveGame(input.activeGame);
  nullable(input.pauseReason, (value) => nonEmptyString(value, "snapshot.pauseReason"));
  nullable(input.completionReason, (value) => nonEmptyString(value, "snapshot.completionReason"));
  if (input.checksum !== undefined && !/^[0-9a-f]{64}$/.test(input.checksum)) fail("snapshot.checksum is invalid");
  return deepFreeze({ ...clone(input), executionMode, executionReasonCode, activationContext, config, observedCounts, controlCounts, controller });
}

function validateEventEnvelope(input) {
  exactKeys(input, ["schemaVersion", "eventId", "sessionId", "authorityEpoch", "expectedRevision", "sequence", "occurredAtEpochMs", "type", "payload", "reducerVersion"], ["canonicalPlatformGameId"], "event");
  if (input.schemaVersion !== SCHEMA_VERSION) fail("event.schemaVersion is unsupported");
  nonEmptyString(input.eventId, "event.eventId");
  validateHex128(input.sessionId, "event.sessionId");
  integer(input.authorityEpoch, 1, Number.MAX_SAFE_INTEGER, "event.authorityEpoch");
  integer(input.expectedRevision, 0, Number.MAX_SAFE_INTEGER, "event.expectedRevision");
  if (input.sequence !== input.expectedRevision + 1) fail("event.sequence must equal expectedRevision + 1");
  integer(input.occurredAtEpochMs, 0, Number.MAX_SAFE_INTEGER, "event.occurredAtEpochMs");
  nonEmptyString(input.type, "event.type");
  requireObject(input.payload, "event.payload");
  if (input.reducerVersion !== REDUCER_VERSION) fail("event.reducerVersion is unsupported");
  if (input.canonicalPlatformGameId !== undefined) nonEmptyString(input.canonicalPlatformGameId, "event.canonicalPlatformGameId");
  return deepFreeze(clone(input));
}

function withoutChecksum(snapshot) {
  const output = clone(snapshot);
  delete output.checksum;
  return output;
}

module.exports = {
  CONTROLLER_VERSION,
  ESTIMATOR_VERSION,
  EXECUTION_MODES,
  MODES,
  OUTCOMES,
  PHASES,
  QUEUE_INTENT_STATUSES,
  REDUCER_VERSION,
  SCHEMA_VERSION,
  TERMINAL_PHASES,
  canonicalStringify,
  clone,
  deepFreeze,
  exactKeys,
  isPlainObject,
  validateActiveGame,
  validateCounts,
  validateEventEnvelope,
  validateHex128,
  validateQueueIntent,
  validateSessionConfig,
  validateSnapshot,
  withoutChecksum,
};
