function parseClockMs(value) {
  if (Number.isFinite(value) && value >= 0) return Math.round(value);
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(",", ".");
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return Math.round(Number(normalized) * 1000);
  const match = normalized.match(/^(\d{1,3}):(\d{2})(?:\.(\d+))?$/);
  if (!match || Number(match[2]) >= 60) return null;
  return Number(match[1]) * 60000 + Number(match[2]) * 1000 + Math.round(Number(`0.${match[3] || 0}`) * 1000);
}

function createClockObservation({ runtimeGameToken, positionRevision, userTime, opponentTime, observedAtMonoMs, identityConfidence = 1 }) {
  const userRemainingMs = parseClockMs(userTime);
  const opponentRemainingMs = parseClockMs(opponentTime);
  const confidence = userRemainingMs === null ? 0 : Math.max(0, Math.min(1, Number(identityConfidence) || 0));
  return Object.freeze({
    type: "CLOCK_OBSERVED",
    runtimeGameToken,
    positionRevision,
    userRemainingMs,
    opponentRemainingMs,
    observedAtMonoMs: Math.max(0, Math.round(observedAtMonoMs)),
    confidence,
  });
}

module.exports = { createClockObservation, parseClockMs };
