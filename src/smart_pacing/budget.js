const RESERVE_MINIMUMS = Object.freeze({ bullet: 2500, blitz: 6500, rapid: 15000 });
const PACE_RATES = Object.freeze({ bullet: 0.36, blitz: 0.5, rapid: 0.64 });

function timeControlFamily(initialMs) {
  if (!Number.isFinite(initialMs)) return "blitz";
  if (initialMs <= 120000) return "bullet";
  if (initialMs <= 600000) return "blitz";
  return "rapid";
}

function computeBudget(session, observation, evidence, executionMarginMs = 180) {
  const family = timeControlFamily(session.initialUserTimeMs ?? observation.userRemainingMs);
  const userRemainingMs = observation.userRemainingMs;
  const clockReliable = Number.isFinite(userRemainingMs) && observation.confidence >= 0.6;
  const conservativeMoves = Math.max(8, session.movesRemainingEstimate.high);
  const responseFloorMs = family === "bullet" ? 130 : family === "blitz" ? 180 : 240;
  const incrementCredit = session.inferredIncrementMs === null ? 0 : session.inferredIncrementMs * session.incrementConfidence * 0.45;
  const reserveMs = clockReliable
    ? Math.max(RESERVE_MINIMUMS[family], conservativeMoves * responseFloorMs - incrementCredit * conservativeMoves * 0.25, executionMarginMs * 3)
    : RESERVE_MINIMUMS[family] * 1.35;
  const spendableMs = clockReliable ? Math.max(0, userRemainingMs - reserveMs - executionMarginMs) : 0;
  const equalShareMs = spendableMs / conservativeMoves;
  const sustainableMs = Math.max(responseFloorMs, equalShareMs * PACE_RATES[family] + incrementCredit);
  const survival = !clockReliable || spendableMs <= reserveMs * 0.3;
  const debtFactor = 1 / (1 + session.temporalDebtMs / Math.max(1, sustainableMs * 2));
  const decisionValue = Math.max(0, Math.min(1, evidence.decisionValue || 0));
  const forcedness = Math.max(0, Math.min(1, evidence.forcedness || 0));
  const confidence = Math.max(0, Math.min(1, evidence.analysisConfidence || 0));
  const dynamicShare = sustainableMs * (0.55 + decisionValue * 2.7) * debtFactor;
  const burstEligible = !survival && decisionValue >= 0.78 && confidence >= 0.72 && forcedness <= 0.45 && session.longThinkCooldownMoves === 0;
  const burstCap = burstEligible ? Math.min(spendableMs * 0.2, sustainableMs * 7) : sustainableMs * 2.5;
  const safeMaxMs = Math.max(0, Math.min(spendableMs, burstCap, dynamicShare));
  return Object.freeze({
    family,
    mode: survival ? "survival" : session.temporalDebtMs > sustainableMs ? "recovery" : burstEligible ? "longThink" : "normal",
    reserveMs: Math.round(reserveMs),
    spendableMs: Math.round(spendableMs),
    sustainableMs: Math.round(sustainableMs),
    safeMinMs: survival ? 80 : responseFloorMs,
    safeMaxMs: Math.round(safeMaxMs),
    burstEligible,
    executionMarginMs,
  });
}

module.exports = { computeBudget, timeControlFamily };
