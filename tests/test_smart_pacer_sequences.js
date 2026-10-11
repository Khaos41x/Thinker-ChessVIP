const {
  PlatformAdapter,
  computeBudget,
  createAnalysisBudgetDecision,
  createClockObservation,
  createSeededRandom,
  createSession,
  decidePacing,
  decidePuzzleDelay,
  reduceSession,
} = require("../src/smart_pacing");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function plan(overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceModelVersion: 1,
    requestId: "request",
    observationKey: "observation",
    analysisPositionKey: "analysis",
    positionRevision: 1,
    move: "e2e4",
    source: "engine",
    status: "complete",
    evidence: {
      decisionValue: 0.45,
      forcedness: 0.2,
      analysisConfidence: 0.9,
      moveProvenanceConfidence: 1,
      familiarity: 0,
      reasonCodes: [],
      ...overrides,
    },
  };
}

function decisionFor({ initialMs, remainingMs, seed = 42, evidence = {}, preparation = "unknown", debt = 0 }) {
  let session = createSession("game", seed, 2600);
  session = Object.freeze({ ...session, initialUserTimeMs: initialMs, temporalDebtMs: debt, mode: "normal" });
  const observation = createClockObservation({
    runtimeGameToken: "game",
    positionRevision: 1,
    userTime: remainingMs,
    opponentTime: remainingMs,
    observedAtMonoMs: 10,
    identityConfidence: 1,
  });
  const budget = computeBudget(session, observation, plan(evidence).evidence);
  return decidePacing({ plan: plan(evidence), session, observation, budget, technicalElapsedMs: 100, preparation, random: createSeededRandom(seed) });
}

const first = decisionFor({ initialMs: 180000, remainingMs: 170000, seed: 77, evidence: { decisionValue: 0.7 } });
const second = decisionFor({ initialMs: 180000, remainingMs: 170000, seed: 77, evidence: { decisionValue: 0.7 } });
assert(JSON.stringify(first) === JSON.stringify(second), "same seed and state did not reproduce the decision");

const prepared = decisionFor({ initialMs: 300000, remainingMs: 280000, seed: 21, evidence: { decisionValue: 0.5 }, preparation: "exact" });
const unknown = decisionFor({ initialMs: 300000, remainingMs: 280000, seed: 21, evidence: { decisionValue: 0.5 }, preparation: "unknown" });
assert(prepared.targetTotalMs < unknown.targetTotalMs, "prepared response was not faster");

const recovered = decisionFor({ initialMs: 300000, remainingMs: 260000, seed: 12, evidence: { decisionValue: 0.55 }, debt: 0 });
const indebted = decisionFor({ initialMs: 300000, remainingMs: 260000, seed: 12, evidence: { decisionValue: 0.55 }, debt: 20000 });
assert(indebted.targetTotalMs <= recovered.targetTotalMs, "temporal debt increased target time");

const survival = decisionFor({ initialMs: 60000, remainingMs: 2600, evidence: { decisionValue: 1, analysisConfidence: 1, forcedness: 0 } });
assert(survival.class === "SURVIVAL" && survival.targetTotalMs <= 100, "survival allowed a burst");

for (const initialMs of [60000, 120000, 180000, 180000, 300000, 300000, 600000, 900000]) {
  let remainingMs = initialMs;
  let session = createSession(`game-${initialMs}`, initialMs, 2500);
  const random = createSeededRandom(initialMs);
  for (let revision = 1; revision <= 60; revision++) {
    const observation = createClockObservation({
      runtimeGameToken: session.runtimeGameToken,
      positionRevision: revision,
      userTime: remainingMs,
      opponentTime: remainingMs,
      observedAtMonoMs: revision * 1000,
      identityConfidence: 1,
    });
    session = reduceSession(session, observation);
    const evidence = plan({
      decisionValue: revision % 17 === 0 ? 0.9 : revision % 5 === 0 ? 0.62 : 0.24,
      forcedness: revision % 7 === 0 ? 0.9 : 0.2,
    }).evidence;
    const budget = computeBudget(session, observation, evidence);
    const preflight = createAnalysisBudgetDecision(observation, budget);
    assert(preflight.clientBudgetMs <= Math.max(25, remainingMs - budget.reserveMs - budget.executionMarginMs) || budget.mode === "survival", "preflight invaded reserve");
    const movePlan = plan(evidence);
    movePlan.positionRevision = revision;
    const decision = decidePacing({ movePlan, plan: movePlan, session, observation, budget, technicalElapsedMs: 80, random });
    assert(decision.targetTotalMs <= Math.max(0, remainingMs - decision.reserveMs - budget.executionMarginMs), "decision invaded reserve");
    remainingMs = Math.max(0, remainingMs - decision.targetTotalMs);
    session = reduceSession(session, {
      type: "MOVE_OUTCOME",
      runtimeGameToken: session.runtimeGameToken,
      positionRevision: revision,
      outcome: "executed",
      sustainableMs: decision.sustainableMs,
      actualThinkMs: decision.targetTotalMs,
      pacingClass: decision.class,
      decisionValue: evidence.decisionValue,
      predictedOpponentReplies: [],
    });
  }
  assert(remainingMs > 0, `sequence flagged for ${initialMs}ms control`);
}

const competitive = createSession("competitive", 1, 2400);
const puzzle = decidePuzzleDelay({ configuredDelayMs: 500, autoMove: true });
assert(puzzle.namespace === "puzzle" && !puzzle.updatesCompetitiveSession, "puzzle policy entered competitive state");
assert(competitive.temporalDebtMs === 0, "puzzle mutated competitive debt");

let current = { runtimeGameToken: "game", positionRevision: 2, observationKey: "observation" };
let executed = null;
const adapter = new PlatformAdapter({
  observePosition: () => current,
  observeClocks: () => null,
  isEnabled: () => true,
  executeMove: (move) => { executed = move; return true; },
});
const promotionDecision = { ...first, observationKey: "observation", move: { uci: "a7a8n", from: "a7", to: "a8", promotion: "n" } };
assert(adapter.executeGuarded(promotionDecision, { runtimeGameToken: "game", positionRevision: 2 }), "underpromotion was not executed");
assert(executed.uci === "a7a8n" && executed.promotion === "n", "underpromotion identity was lost");
current = { ...current, positionRevision: 3 };
assert(!adapter.executeGuarded(promotionDecision, { runtimeGameToken: "game", positionRevision: 2 }), "stale promotion executed");

console.log("Smart Pacing V2 sequence, reserve, debt, puzzle, determinism, and promotion assertions passed.");
