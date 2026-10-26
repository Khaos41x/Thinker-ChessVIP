"use strict";

const { wilsonInterval } = require("./statistics");

const ROLLOUT_STAGES = Object.freeze(["DISABLED", "SHADOW_REDUCER", "AUTO_QUEUE_CANARY", "ACTIVE_DDA"]);

function validateRollout(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== 2 || input.schemaVersion !== 1 || !ROLLOUT_STAGES.includes(input.stage)) throw new TypeError("rollout configuration is invalid");
  return Object.freeze({ schemaVersion: 1, stage: input.stage });
}

function percentage(value) {
  return value === null ? null : Math.round(value * 10000) / 100;
}

function buildStatusView(snapshot, options) {
  const settings = options || {};
  const now = Number.isInteger(settings.nowEpochMs) ? settings.nowEpochMs : Date.now();
  const rollout = validateRollout(settings.rollout || { schemaVersion: 1, stage: "DISABLED" });
  if (!snapshot) {
    return Object.freeze({
      phase: "IDLE", role: "FOLLOWER", remainingTtlMs: 0, drainDeadlineEpochMs: null,
      drainRemainingMs: null, observedCounts: { wins: 0, draws: 0, losses: 0, terminalGames: 0 },
      controlCounts: { wins: 0, draws: 0, losses: 0, terminalGames: 0 }, rawWinRate: 0,
      posteriorWinRate: 0.5, wilsonLower: 0, wilsonUpper: 1, minWinRate: null,
      maxWinRate: null, controllerMode: "BOOST", offsetElo: 200, opponentRating: null,
      effectiveTargetElo: null, targetSaturated: false, warningCode: settings.warningCode || null,
      rolloutStage: rollout.stage,
      executionMode: settings.executionMode || "UNAVAILABLE",
    });
  }
  const control = snapshot.controlCounts;
  const rawWinRate = control.terminalGames ? control.wins / control.terminalGames : 0;
  const interval = wilsonInterval(control.wins, control.terminalGames);
  const actuator = snapshot.activeGame && snapshot.activeGame.actuator;
  const modeOffset = snapshot.controller.mode === "BOOST" ? snapshot.config.boostOffsetElo : snapshot.config.correctionOffsetElo;
  return Object.freeze({
    phase: snapshot.phase,
    role: settings.isLeader ? "LEADER" : "FOLLOWER",
    remainingTtlMs: Math.max(0, snapshot.deadlineEpochMs - now),
    drainDeadlineEpochMs: snapshot.drainDeadlineEpochMs,
    drainRemainingMs: snapshot.drainDeadlineEpochMs === null ? null : Math.max(0, snapshot.drainDeadlineEpochMs - now),
    observedCounts: { ...snapshot.observedCounts },
    controlCounts: { ...control },
    rawWinRate: percentage(rawWinRate),
    posteriorWinRate: percentage(snapshot.controller.posteriorWinRate),
    wilsonLower: percentage(interval.lower),
    wilsonUpper: percentage(interval.upper),
    minWinRate: percentage(snapshot.config.minWinRate),
    maxWinRate: percentage(snapshot.config.maxWinRate),
    controllerMode: snapshot.controller.mode,
    offsetElo: actuator ? actuator.offsetElo : modeOffset,
    opponentRating: snapshot.activeGame ? snapshot.activeGame.opponent.rating : null,
    effectiveTargetElo: actuator ? actuator.effectiveTargetElo : null,
    targetSaturated: Boolean(actuator && actuator.saturated),
    warningCode: settings.warningCode || snapshot.pauseReason || null,
    rolloutStage: rollout.stage,
    executionMode: settings.executionMode || "ACTIVE_DDA",
  });
}

function formatDuration(milliseconds) {
  if (milliseconds === null) return "—";
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

module.exports = { ROLLOUT_STAGES, buildStatusView, formatDuration, validateRollout };
