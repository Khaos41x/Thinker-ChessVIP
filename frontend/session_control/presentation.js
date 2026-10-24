"use strict";

const { validateSessionConfig, ESTIMATOR_VERSION, CONTROLLER_VERSION } = require("./models");

const SESSION_FIELDS = Object.freeze({ durationMinutes: "sessionDurationMinutes", minimumPercent: "sessionMinimumPercent", maximumPercent: "sessionMaximumPercent" });

function validateSessionDraft(draft) {
  const value = Object.fromEntries(Object.keys(SESSION_FIELDS).map(key => [key, key !== "durationMinutes" && (draft[key] == null || String(draft[key]).trim() === "") ? null : Number(draft[key])]));
  if (!Number.isInteger(value.durationMinutes) || value.durationMinutes < 1 || value.durationMinutes > 1440 ||
      value.minimumPercent !== null && (!Number.isFinite(value.minimumPercent) || value.minimumPercent <= 0 || value.minimumPercent >= 100) ||
      value.maximumPercent !== null && (!Number.isFinite(value.maximumPercent) || value.maximumPercent <= 0 || value.maximumPercent >= 100) ||
      value.minimumPercent !== null && value.maximumPercent !== null && value.minimumPercent >= value.maximumPercent) {
    throw Object.assign(new TypeError("Use 1–1440 minutes and win rates with 0 < minimum < maximum < 100."), { code: "SESSION_CONFIG_INVALID" });
  }
  return Object.freeze(value);
}

function sessionConfigFromDraft(draft, context = {}) {
  const value = validateSessionDraft(draft);
  if (value.minimumPercent === null || value.maximumPercent === null) {
    throw Object.assign(new TypeError("Configure both win-rate targets before starting a session."), { code: "SESSION_TARGETS_UNSET" });
  }
  return validateSessionConfig({ schemaVersion: 1, durationMs: value.durationMinutes * 60000,
    minWinRate: value.minimumPercent / 100, maxWinRate: value.maximumPercent / 100,
    boostOffsetElo: 200, correctionOffsetElo: -200, minCompletedGames: 5,
    perceptionElo: Number.isInteger(context.perceptionElo) ? context.perceptionElo : 1700,
    scaleId: context.scaleId || "calibration-scale-unavailable", estimatorVersion: ESTIMATOR_VERSION,
    controllerVersion: CONTROLLER_VERSION, minimumAdmissionHeadroomMs: 30000,
    queueObservationTimeoutMs: 30000, maximumDrainMs: 900000, maximumConsecutiveSaturatedGames: 3 });
}

function draftFromConfig(config) {
  return Object.fromEntries(Object.entries(SESSION_FIELDS).map(([field, key]) => [field, config[key] == null ? "" : String(config[key])]));
}

function draftPatch(draft) {
  const value = validateSessionDraft(draft);
  return Object.fromEntries(Object.entries(SESSION_FIELDS).map(([field, key]) => [key, value[field]]));
}

module.exports = { SESSION_FIELDS, validateSessionDraft, sessionConfigFromDraft, draftFromConfig, draftPatch };
