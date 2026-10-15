"use strict";

const { clone, deepFreeze, exactKeys, isPlainObject } = require("./models");

const TELEMETRY_VERSION = "session-control-telemetry-v1";
const DIAGNOSTIC_VERSION = "session-control-diagnostic-v1";
const EVENT_NAMES = Object.freeze([
  "session_started", "session_recovered", "session_draining", "session_completed",
  "leader_acquired", "leader_lost", "lease_takeover", "queue_intent_admitted",
  "queue_intent_consumed", "queue_intent_expired", "game_target_pinned",
  "result_committed", "duplicate_result_ignored", "dda_mode_changed",
  "target_saturated", "calibration_mismatch", "session_paused",
]);
const FIELD_NAMES = Object.freeze([
  "occurredAtEpochMs", "phase", "revision", "role", "observedCounts", "controlCounts",
  "controllerMode", "posteriorWinRate", "offsetElo", "rawTargetElo", "effectiveTargetElo",
  "saturated", "reasonCode", "reducerVersion", "estimatorVersion", "controllerVersion",
  "rolloutStage",
]);

function safeCounts(value, field) {
  exactKeys(value, ["wins", "draws", "losses", "terminalGames"], [], field);
  const output = {};
  for (const key of ["wins", "draws", "losses", "terminalGames"]) {
    if (!Number.isInteger(value[key]) || value[key] < 0) throw new TypeError(`${field}.${key} is invalid`);
    output[key] = value[key];
  }
  return output;
}

function sanitizeFields(input) {
  if (!isPlainObject(input)) throw new TypeError("telemetry fields must be an object");
  for (const key of Object.keys(input)) if (!FIELD_NAMES.includes(key)) throw new TypeError(`telemetry field is forbidden: ${key}`);
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (key === "observedCounts" || key === "controlCounts") output[key] = safeCounts(value, `telemetry.${key}`);
    else if (["occurredAtEpochMs", "revision", "offsetElo", "rawTargetElo", "effectiveTargetElo"].includes(key)) {
      if (!Number.isInteger(value)) throw new TypeError(`telemetry.${key} must be an integer`);
      output[key] = value;
    } else if (key === "posteriorWinRate") {
      if (!Number.isFinite(value) || value < 0 || value > 1) throw new TypeError("telemetry.posteriorWinRate is invalid");
      output[key] = value;
    } else if (key === "saturated") {
      if (typeof value !== "boolean") throw new TypeError("telemetry.saturated must be boolean");
      output[key] = value;
    } else {
      if (typeof value !== "string" || !value || value.length > 120) throw new TypeError(`telemetry.${key} must be a short string`);
      output[key] = value;
    }
  }
  return output;
}

function sanitizeEvent(input) {
  if (!isPlainObject(input)) throw new TypeError("telemetry event must be an object");
  const { schemaVersion, telemetryVersion, name, ...fields } = input;
  if (schemaVersion !== 1) throw new TypeError("telemetry schema version is unsupported");
  if (telemetryVersion !== TELEMETRY_VERSION) throw new TypeError("telemetry version is unsupported");
  if (!EVENT_NAMES.includes(name)) throw new TypeError("telemetry event name is unsupported");
  return { schemaVersion, telemetryVersion, name, ...sanitizeFields(fields) };
}

class BoundedTelemetry {
  constructor(options) {
    const settings = options || {};
    this.capacity = settings.capacity === undefined ? 500 : settings.capacity;
    if (!Number.isInteger(this.capacity) || this.capacity < 1 || this.capacity > 5000) throw new TypeError("telemetry capacity is invalid");
    this.events = [];
  }

  record(name, fields) {
    const event = deepFreeze(sanitizeEvent({ schemaVersion: 1, telemetryVersion: TELEMETRY_VERSION, name, ...(fields || {}) }));
    this.events.push(event);
    if (this.events.length > this.capacity) this.events.splice(0, this.events.length - this.capacity);
    return event;
  }

  list() {
    return deepFreeze(clone(this.events));
  }

  clear() {
    this.events.length = 0;
  }
}

function diagnosticExport(status, events, generatedAtEpochMs) {
  if (!isPlainObject(status)) throw new TypeError("diagnostic status must be an object");
  if (!Array.isArray(events)) throw new TypeError("diagnostic events must be an array");
  if (!Number.isInteger(generatedAtEpochMs) || generatedAtEpochMs < 0) throw new TypeError("diagnostic timestamp is invalid");
  const allowedStatus = [
    "phase", "role", "remainingTtlMs", "drainDeadlineEpochMs", "drainRemainingMs",
    "observedCounts", "controlCounts", "rawWinRate", "posteriorWinRate", "wilsonLower",
    "wilsonUpper", "minWinRate", "maxWinRate", "controllerMode", "offsetElo",
    "opponentRating", "effectiveTargetElo", "targetSaturated", "warningCode", "rolloutStage",
  ];
  const safeStatus = {};
  for (const key of allowedStatus) if (Object.prototype.hasOwnProperty.call(status, key)) safeStatus[key] = clone(status[key]);
  return deepFreeze({ schemaVersion: 1, diagnosticVersion: DIAGNOSTIC_VERSION, generatedAtEpochMs, status: safeStatus, events: events.map(sanitizeEvent) });
}

module.exports = { BoundedTelemetry, DIAGNOSTIC_VERSION, EVENT_NAMES, FIELD_NAMES, TELEMETRY_VERSION, diagnosticExport, sanitizeEvent, sanitizeFields };
