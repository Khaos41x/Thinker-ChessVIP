"use strict";

const { TERMINAL_PHASES } = require("./models");

function effectiveNow(lastObservedEpochMs, wallNowEpochMs) {
  if (!Number.isInteger(lastObservedEpochMs) || !Number.isInteger(wallNowEpochMs) || lastObservedEpochMs < 0 || wallNowEpochMs < 0) {
    throw new TypeError("clock values must be non-negative integer epoch milliseconds");
  }
  return Math.max(lastObservedEpochMs, wallNowEpochMs);
}

function canAdmitQueue(snapshot, wallNowEpochMs) {
  const now = effectiveNow(snapshot.lastObservedEpochMs, wallNowEpochMs);
  return snapshot.phase === "QUEUEING" && snapshot.queueIntent === null && now + snapshot.config.minimumAdmissionHeadroomMs < snapshot.deadlineEpochMs;
}

function enterDraining(snapshot, now) {
  if (snapshot.enteredDrainingAtEpochMs !== null) return snapshot;
  return {
    ...snapshot,
    phase: "DRAINING",
    enteredDrainingAtEpochMs: now,
    drainDeadlineEpochMs: now + snapshot.config.maximumDrainMs,
  };
}

function reconcileClock(snapshot, wallNowEpochMs) {
  const now = effectiveNow(snapshot.lastObservedEpochMs, wallNowEpochMs);
  let next = snapshot.lastObservedEpochMs === now ? snapshot : { ...snapshot, lastObservedEpochMs: now };
  if (TERMINAL_PHASES.includes(next.phase)) return next;
  if (next.phase === "DRAINING" && now >= next.drainDeadlineEpochMs) {
    return { ...next, phase: "ABORTED", completionReason: "UNRECONCILED_DRAIN_TIMEOUT" };
  }
  if (next.phase === "QUEUEING" && next.queueIntent && next.queueIntent.status === "DISPATCHED" && now < next.deadlineEpochMs && now >= next.queueIntent.observeUntilEpochMs) {
    return { ...next, phase: "PAUSED_QUEUEING", pauseReason: "QUEUE_EFFECT_AMBIGUOUS", queueIntent: { ...next.queueIntent, status: "AMBIGUOUS" } };
  }
  if (now < next.deadlineEpochMs) return next;
  if (next.phase === "IN_GAME" || next.activeGame !== null || (next.queueIntent && ["DISPATCHED", "MATCH_OBSERVED"].includes(next.queueIntent.status))) {
    return enterDraining(next, now);
  }
  if (next.phase === "QUEUEING" && next.queueIntent && next.queueIntent.status === "CLAIMED") {
    return { ...next, phase: "PAUSED_QUEUEING", pauseReason: "QUEUE_EFFECT_AMBIGUOUS", queueIntent: { ...next.queueIntent, status: "AMBIGUOUS" } };
  }
  if (next.phase === "QUEUEING" && next.queueIntent && next.queueIntent.status === "PREPARED") {
    next = { ...next, queueIntent: { ...next.queueIntent, status: "CANCELLED" } };
  }
  if (next.phase === "QUEUEING" || next.phase === "PAUSED_QUEUEING") return { ...next, phase: "COMPLETED", completionReason: "TTL_EXPIRED", pauseReason: null };
  return next;
}

module.exports = { canAdmitQueue, effectiveNow, enterDraining, reconcileClock };
