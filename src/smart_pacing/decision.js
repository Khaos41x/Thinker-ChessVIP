const { parseUciMove } = require("./contracts");
const { sampleHumanTarget } = require("./humanizer");

function classify(evidence, budget, preparation) {
  if (budget.mode === "survival") return "SURVIVAL";
  if (evidence.analysisConfidence < 0.45) return "DEGRADED";
  if (preparation === "exact" && evidence.forcedness >= 0.7) return "PREPARED_PREMOVE";
  if (evidence.forcedness >= 0.8) return "REFLEX";
  if (budget.burstEligible) return "LONG_THINK";
  if (evidence.decisionValue >= 0.62) return "CRITICAL";
  if (evidence.decisionValue <= 0.25 || evidence.familiarity >= 0.7) return "SIMPLE";
  return "NORMAL";
}

function decidePacing({ plan, session, observation, budget, technicalElapsedMs, preparation = "unknown", random }) {
  const pacingClass = classify(plan.evidence, budget, preparation);
  const classFactor = {
    PREPARED_PREMOVE: 0.25,
    REFLEX: 0.45,
    SIMPLE: 0.75,
    NORMAL: 1,
    CRITICAL: 1.65,
    LONG_THINK: 4.5,
    SURVIVAL: 0.35,
    DEGRADED: 0.6,
  }[pacingClass];
  let medianMs = budget.sustainableMs * classFactor;
  if (preparation === "exact") medianMs *= 0.72;
  if (preparation === "surprise" && plan.evidence.decisionValue >= 0.6) medianMs *= 1.2;
  const targetTotalMs = sampleHumanTarget({
    medianMs,
    safeMinMs: budget.safeMinMs,
    safeMaxMs: budget.safeMaxMs,
    sigma: pacingClass === "LONG_THINK" ? 0.42 : 0.25,
    random,
  });
  const safeClockCap = Number.isFinite(observation.userRemainingMs)
    ? Math.max(0, observation.userRemainingMs - budget.reserveMs - budget.executionMarginMs)
    : 0;
  const boundedTarget = Math.min(targetTotalMs, safeClockCap);
  return Object.freeze({
    timingModelVersion: 1,
    observationKey: plan.observationKey,
    analysisPositionKey: plan.analysisPositionKey,
    move: parseUciMove(plan.move),
    class: pacingClass,
    targetTotalMs: boundedTarget,
    safeMinMs: budget.safeMinMs,
    safeMaxMs: budget.safeMaxMs,
    technicalElapsedMs: Math.max(0, Math.round(technicalElapsedMs)),
    remainingWaitMs: Math.max(0, boundedTarget - Math.max(0, Math.round(technicalElapsedMs))),
    sustainableMs: budget.sustainableMs,
    reserveMs: budget.reserveMs,
    debtBeforeMs: session.temporalDebtMs,
    projectedDebtAfterMs: Math.max(0, session.temporalDebtMs * 0.72 + Math.max(0, boundedTarget - budget.sustainableMs)),
    preparation,
    decisionConfidence: Math.min(plan.evidence.analysisConfidence, observation.confidence),
    reasonCodes: Object.freeze([...new Set([...(plan.evidence.reasonCodes || []), ...(budget.mode === "survival" ? ["SURVIVAL_RESERVE"] : [])])]),
  });
}

module.exports = { classify, decidePacing };
