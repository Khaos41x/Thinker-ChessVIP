"use strict";

const { CONTROLLER_VERSION, ESTIMATOR_VERSION, REDUCER_VERSION } = require("../../frontend/session_control");

const SESSION_ID = "11111111111111111111111111111111";
const TAB_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TAB_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const INTENT_ID = "22222222222222222222222222222222";
const GAME_TOKEN = "33333333333333333333333333333333";

function config(overrides) {
  return {
    schemaVersion: 1,
    durationMs: 120000,
    minWinRate: 0.25,
    maxWinRate: 0.75,
    boostOffsetElo: 200,
    correctionOffsetElo: -200,
    minCompletedGames: 2,
    perceptionElo: 1700,
    scaleId: "opaque-scale-v1",
    estimatorVersion: ESTIMATOR_VERSION,
    controllerVersion: CONTROLLER_VERSION,
    minimumAdmissionHeadroomMs: 5000,
    queueObservationTimeoutMs: 10000,
    maximumDrainMs: 60000,
    maximumConsecutiveSaturatedGames: 2,
    ...(overrides || {}),
  };
}

function event(type, revision, occurredAtEpochMs, payload, overrides) {
  return {
    schemaVersion: 1,
    eventId: `${type.toLowerCase()}:${revision + 1}`,
    sessionId: SESSION_ID,
    authorityEpoch: 1,
    expectedRevision: revision,
    sequence: revision + 1,
    occurredAtEpochMs,
    type,
    payload: payload || {},
    reducerVersion: REDUCER_VERSION,
    ...(overrides || {}),
  };
}

function startEvent(now = 1000000, configOverrides) {
  return event("SESSION_STARTED", 0, now, { accountKey: "opaque-account", config: config(configOverrides), authorizationDecision: { schemaVersion: 1, allowed: true, reason: "OPAQUE_POLICY_MATCH" } }, { eventId: "session:start" });
}

function queueIntent(now = 1001000) {
  return {
    schemaVersion: 1,
    intentId: INTENT_ID,
    runtimeGameToken: GAME_TOKEN,
    status: "PREPARED",
    preparedAtEpochMs: now,
    claimedByFence: null,
    dispatchedAtEpochMs: null,
    observeUntilEpochMs: null,
  };
}

function activeGame(gameId = "opaque-game", overrides) {
  return {
    schemaVersion: 1,
    canonicalPlatformGameId: gameId,
    queueIntentId: INTENT_ID,
    admittedAtEpochMs: 1003000,
    runtimeGameToken: GAME_TOKEN,
    targetPinStatus: "PINNED",
    calibrationCapabilityExpiresAtEpochMs: 2000000,
    lastFen: "opaque-position",
    positionRevision: 0,
    opponent: { rating: 1800, ratingScaleId: "opaque-rating-scale", source: "opaque-adapter", confidence: 1, observedAtEpochMs: 1003000 },
    actuator: {
      controllerMode: "BOOST", offsetElo: 200, rawTargetElo: 2000, effectiveTargetElo: 2000,
      ratingScaleMappingVersion: "opaque-mapping-v1", ratingScaleMappingChecksum: "a".repeat(64),
      saturated: false, saturationReason: null, scaleId: "opaque-scale-v1", artifactChecksum: "b".repeat(64),
      artifactVersion: "opaque-artifact-v1", cohort: "test", rolloutVersion: "opaque-rollout-v1",
      seedPolicyVersion: "opaque-seed-v1", requiredBudgetClass: "opaque-budget-v1",
    },
    actuation: {
      valid: true, invalidReason: null, appliedMoveCount: 1, nonAppliedMoveCount: 0,
      resolvedProfile: { resolverVersion: "opaque-resolver-v1", resolutionKey: "c".repeat(64), latentSkill: 12.5, appliedSkill: 12, budgetClass: "opaque-budget-v1", profileDigest: "d".repeat(64) },
    },
    ...(overrides || {}),
  };
}

module.exports = { GAME_TOKEN, INTENT_ID, SESSION_ID, TAB_A, TAB_B, activeGame, config, event, queueIntent, startEvent };
