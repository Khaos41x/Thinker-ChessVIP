const UCI_PATTERN = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

function assertFiniteUnit(value, field) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new TypeError(`${field} must be within [0,1]`);
}

function validateMovePlan(plan, expected = {}) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw new TypeError("move plan must be an object");
  if (plan.schemaVersion !== 1 || plan.evidenceModelVersion !== 1) throw new TypeError("incompatible move plan version");
  for (const field of ["requestId", "observationKey", "analysisPositionKey", "source", "status"]) {
    if (typeof plan[field] !== "string" || !plan[field]) throw new TypeError(`${field} is required`);
  }
  if (plan.move !== null && !UCI_PATTERN.test(plan.move)) throw new TypeError("move must be normalized UCI");
  if (expected.requestId && plan.requestId !== expected.requestId) throw new TypeError("requestId mismatch");
  if (expected.observationKey && plan.observationKey !== expected.observationKey) throw new TypeError("observationKey mismatch");
  if (expected.positionRevision !== undefined && plan.positionRevision !== expected.positionRevision) throw new TypeError("positionRevision mismatch");
  const evidence = plan.evidence || {};
  for (const field of ["decisionValue", "forcedness", "analysisConfidence", "moveProvenanceConfidence"]) {
    assertFiniteUnit(evidence[field], `evidence.${field}`);
  }
  return Object.freeze({ ...plan, evidence: Object.freeze({ ...evidence }) });
}

function parseUciMove(uci) {
  if (!UCI_PATTERN.test(uci)) throw new TypeError("invalid UCI move");
  return Object.freeze({ uci, from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || null });
}

module.exports = { UCI_PATTERN, parseUciMove, validateMovePlan };
