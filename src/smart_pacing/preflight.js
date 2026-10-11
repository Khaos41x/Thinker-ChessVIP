function createAnalysisBudgetDecision(observation, budget, technicalP95Ms = 220) {
  const availableMs = Number.isFinite(observation.userRemainingMs)
    ? Math.max(0, observation.userRemainingMs - budget.reserveMs - budget.executionMarginMs)
    : 0;
  let tier = "standard";
  const reasonCodes = [];
  if (budget.mode === "survival" || availableMs < 500) {
    tier = "survival";
    reasonCodes.push("SURVIVAL_RESERVE");
  } else if (availableMs < 1500) {
    tier = "fast";
  } else if (budget.burstEligible && availableMs > 5000) {
    tier = "deep";
  }
  if (observation.confidence < 0.6) reasonCodes.push("CLOCK_DATA_DEGRADED");
  const tierCap = { survival: 90, fast: 250, standard: 700, deep: 1600 }[tier];
  return Object.freeze({
    analysisBudgetVersion: 1,
    analysisTier: tier,
    clientBudgetMs: Math.max(25, Math.min(tierCap, availableMs, Math.max(25, technicalP95Ms * 3))),
    executionMarginMs: budget.executionMarginMs,
    clockConfidence: observation.confidence,
    reasonCodes: Object.freeze(reasonCodes),
  });
}

module.exports = { createAnalysisBudgetDecision };
