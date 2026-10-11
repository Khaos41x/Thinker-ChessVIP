function createSession(runtimeGameToken, seed, rawElo = 2400) {
  const elo = Math.max(600, Math.min(3200, Math.round(rawElo)));
  return Object.freeze({
    sessionVersion: 1,
    runtimeGameToken,
    seed: seed >>> 0,
    moveSelectionElo: elo,
    perceptionElo: elo,
    rawAutoAdjustElo: null,
    mode: "bootstrap",
    initialUserTimeMs: null,
    initialOpponentTimeMs: null,
    inferredIncrementMs: null,
    incrementConfidence: 0,
    movesRemainingEstimate: Object.freeze({ low: 18, high: 42, confidence: 0.2, version: 1 }),
    temporalDebtMs: 0,
    longThinkCooldownMoves: 0,
    recentDecisionValueEwma: 0,
    recentActualThinkMs: Object.freeze([]),
    predictedOpponentReplies: Object.freeze([]),
    opponentTurnOpportunity: null,
    clockObservations: Object.freeze([]),
    lastUserClockMs: null,
    lastObservedAtMonoMs: 0,
    committedRevision: -1,
  });
}

function smoothElo(current, raw, alpha = 0.25, maxStep = 100) {
  const bounded = Math.max(600, Math.min(3200, Number(raw)));
  if (!Number.isFinite(bounded)) return current;
  const delta = Math.max(-maxStep, Math.min(maxStep, (bounded - current) * alpha));
  return Math.round(current + delta);
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function reduceSession(session, event) {
  if (!event || event.runtimeGameToken !== session.runtimeGameToken) return session;
  if (event.type === "CLOCK_OBSERVED") {
    const observations = [...session.clockObservations, event].slice(-8);
    const incrementSamples = [];
    for (let index = 1; index < observations.length; index++) {
      const previous = observations[index - 1];
      const current = observations[index];
      if (previous.userRemainingMs === null || current.userRemainingMs === null) continue;
      const consumed = Number(previous.actualThinkMs || 0);
      const sample = current.userRemainingMs - previous.userRemainingMs + consumed;
      if (sample >= 0 && sample <= 30000) incrementSamples.push(sample);
    }
    const inferredIncrementMs = median(incrementSamples);
    const incrementConfidence = Math.min(1, incrementSamples.length / 4) * event.confidence;
    const reliable = event.userRemainingMs !== null && event.confidence >= 0.6;
    return Object.freeze({
      ...session,
      mode: reliable ? (session.temporalDebtMs > 0 ? "recovery" : "normal") : "degraded",
      initialUserTimeMs: session.initialUserTimeMs ?? event.userRemainingMs,
      initialOpponentTimeMs: session.initialOpponentTimeMs ?? event.opponentRemainingMs,
      inferredIncrementMs,
      incrementConfidence,
      clockObservations: Object.freeze(observations),
      lastUserClockMs: event.userRemainingMs,
      lastObservedAtMonoMs: event.observedAtMonoMs,
    });
  }
  if (event.type === "AUTO_ADJUST_ELO") {
    const elo = smoothElo(session.moveSelectionElo, event.rawElo);
    return Object.freeze({ ...session, rawAutoAdjustElo: event.rawElo, moveSelectionElo: elo, perceptionElo: elo });
  }
  if (event.type === "MOVE_OUTCOME") {
    if (event.positionRevision <= session.committedRevision || event.outcome !== "executed") return session;
    const sustainableMs = Math.max(0, Number(event.sustainableMs) || 0);
    const actualThinkMs = Math.max(0, Number(event.actualThinkMs) || 0);
    const overspend = Math.max(0, actualThinkMs - sustainableMs);
    const temporalDebtMs = Math.max(0, session.temporalDebtMs * 0.72 + overspend - Math.max(0, sustainableMs - actualThinkMs) * 0.4);
    const cooldown = event.pacingClass === "LONG_THINK" ? 3 : Math.max(0, session.longThinkCooldownMoves - 1);
    const clockObservations = [...session.clockObservations];
    if (clockObservations.length) {
      clockObservations[clockObservations.length - 1] = Object.freeze({
        ...clockObservations[clockObservations.length - 1],
        actualThinkMs,
      });
    }
    return Object.freeze({
      ...session,
      mode: temporalDebtMs > sustainableMs * 0.75 ? "recovery" : "normal",
      temporalDebtMs,
      longThinkCooldownMoves: cooldown,
      recentDecisionValueEwma: session.recentDecisionValueEwma * 0.7 + Math.max(0, Math.min(1, event.decisionValue || 0)) * 0.3,
      recentActualThinkMs: Object.freeze([...session.recentActualThinkMs, actualThinkMs].slice(-8)),
      clockObservations: Object.freeze(clockObservations),
      predictedOpponentReplies: Object.freeze([...(event.predictedOpponentReplies || [])]),
      committedRevision: event.positionRevision,
    });
  }
  return session;
}

module.exports = { createSession, reduceSession, smoothElo };
