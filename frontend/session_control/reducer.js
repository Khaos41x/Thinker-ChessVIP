"use strict";

const { canAdmitQueue, enterDraining, reconcileClock } = require("./clock");
const {
  OUTCOMES,
  SCHEMA_VERSION,
  TERMINAL_PHASES,
  clone,
  deepFreeze,
  exactKeys,
  validateActiveGame,
  validateEventEnvelope,
  validateQueueIntent,
  validateSessionConfig,
  validateSnapshot,
} = require("./models");
const { nextControllerMode, posteriorMean } = require("./statistics");

function emptyCounts() {
  return { wins: 0, draws: 0, losses: 0, terminalGames: 0 };
}

function incrementCounts(counts, outcome) {
  const next = { ...counts, terminalGames: counts.terminalGames + 1 };
  if (outcome === "WIN") next.wins += 1;
  if (outcome === "DRAW") next.draws += 1;
  if (outcome === "LOSS") next.losses += 1;
  return next;
}

function startSession(event) {
  const payload = event.payload;
  exactKeys(payload, ["accountKey", "config", "authorizationDecision"], ["executionMode", "executionReasonCode", "activationContext"], "event.payload");
  if (typeof payload.accountKey !== "string" || !payload.accountKey) throw new TypeError("event.payload.accountKey is required");
  exactKeys(payload.authorizationDecision, ["schemaVersion", "allowed", "reason"], [], "event.payload.authorizationDecision");
  if (payload.authorizationDecision.schemaVersion !== 1 || payload.authorizationDecision.allowed !== true || typeof payload.authorizationDecision.reason !== "string" || !payload.authorizationDecision.reason) throw new TypeError("session start requires an allowed authorization decision");
  const config = validateSessionConfig(payload.config);
  const counts = emptyCounts();
  return {
    schemaVersion: SCHEMA_VERSION,
    sessionId: event.sessionId,
    authorityEpoch: event.authorityEpoch,
    revision: event.sequence,
    accountKey: payload.accountKey,
    executionMode: payload.executionMode || "ACTIVE_DDA",
    executionReasonCode: payload.executionReasonCode || null,
    activationContext: payload.activationContext || null,
    phase: "QUEUEING",
    createdAtEpochMs: event.occurredAtEpochMs,
    startedAtEpochMs: event.occurredAtEpochMs,
    deadlineEpochMs: event.occurredAtEpochMs + config.durationMs,
    enteredDrainingAtEpochMs: null,
    drainDeadlineEpochMs: null,
    lastObservedEpochMs: event.occurredAtEpochMs,
    config,
    observedCounts: counts,
    controlCounts: counts,
    consecutiveSaturatedEligibleGames: 0,
    saturationControllerMode: null,
    controller: { mode: "BOOST", posteriorWinRate: posteriorMean(counts), decisionAtGameCount: 0 },
    queueIntent: null,
    activeGame: null,
    pauseReason: null,
    completionReason: null,
  };
}

function requireRunning(snapshot) {
  if (TERMINAL_PHASES.includes(snapshot.phase)) throw new TypeError("terminal sessions are immutable");
}

function requirePhase(snapshot, phases, type) {
  if (!phases.includes(snapshot.phase)) throw new TypeError(`${type} is invalid in phase ${snapshot.phase}`);
}

function reduceResult(snapshot, event) {
  const payload = event.payload;
  exactKeys(payload, ["canonicalPlatformGameId", "outcome"], ["exclusionReason"], "event.payload");
  if (!snapshot.activeGame || snapshot.activeGame.canonicalPlatformGameId !== payload.canonicalPlatformGameId) throw new TypeError("result does not match the active game");
  if (event.eventId !== `result:${payload.canonicalPlatformGameId}` || event.canonicalPlatformGameId !== payload.canonicalPlatformGameId) throw new TypeError("result identity is not canonical");
  if (!OUTCOMES.includes(payload.outcome)) throw new TypeError("result outcome is invalid");
  const controlEligible = snapshot.activeGame.actuation.valid === true && snapshot.activeGame.actuation.appliedMoveCount >= 1;
  const observedCounts = incrementCounts(snapshot.observedCounts, payload.outcome);
  const controlCounts = controlEligible ? incrementCounts(snapshot.controlCounts, payload.outcome) : snapshot.controlCounts;
  const decision = nextControllerMode(snapshot.controller.mode, controlCounts, snapshot.config);
  let consecutive = snapshot.consecutiveSaturatedEligibleGames;
  let saturationMode = snapshot.saturationControllerMode;
  if (controlEligible) {
    if (snapshot.activeGame.actuator.saturated) {
      consecutive = saturationMode === decision.mode ? consecutive + 1 : 1;
      saturationMode = decision.mode;
    } else {
      consecutive = 0;
      saturationMode = null;
    }
  }
  let phase = snapshot.phase === "DRAINING" ? "COMPLETED" : "QUEUEING";
  let pauseReason = null;
  let completionReason = snapshot.phase === "DRAINING" ? "DRAIN_COMPLETE" : null;
  if (phase === "QUEUEING" && consecutive >= snapshot.config.maximumConsecutiveSaturatedGames) {
    phase = "PAUSED_QUEUEING";
    pauseReason = "ACTUATOR_SATURATED";
  }
  return {
    ...snapshot,
    phase,
    observedCounts,
    controlCounts,
    consecutiveSaturatedEligibleGames: consecutive,
    saturationControllerMode: saturationMode,
    controller: { mode: decision.mode, posteriorWinRate: decision.posteriorWinRate, decisionAtGameCount: controlCounts.terminalGames },
    queueIntent: null,
    activeGame: null,
    pauseReason,
    completionReason,
  };
}

function transition(snapshot, event) {
  const now = event.occurredAtEpochMs;
  const reconciled = reconcileClock(snapshot, now);
  if (TERMINAL_PHASES.includes(reconciled.phase) && event.type !== "FORCE_STOP") return reconciled;
  switch (event.type) {
    case "CLOCK_RECONCILED":
      exactKeys(event.payload, [], [], "event.payload");
      return reconciled;
    case "QUEUE_INTENT_PREPARED": {
      requirePhase(reconciled, ["QUEUEING"], event.type);
      if (!canAdmitQueue(reconciled, now)) throw new TypeError("queue admission is not allowed");
      exactKeys(event.payload, ["queueIntent"], [], "event.payload");
      const intent = validateQueueIntent(event.payload.queueIntent);
      if (intent.status !== "PREPARED") throw new TypeError("new queue intent must be PREPARED");
      return { ...reconciled, queueIntent: intent };
    }
    case "QUEUE_INTENT_CLAIMED": {
      requirePhase(reconciled, ["QUEUEING"], event.type);
      exactKeys(event.payload, ["fencingToken"], [], "event.payload");
      if (!reconciled.queueIntent || reconciled.queueIntent.status !== "PREPARED") throw new TypeError("only PREPARED queue intents can be claimed");
      if (!Number.isInteger(event.payload.fencingToken) || event.payload.fencingToken < 1) throw new TypeError("fencingToken is invalid");
      return { ...reconciled, queueIntent: { ...reconciled.queueIntent, status: "CLAIMED", claimedByFence: event.payload.fencingToken } };
    }
    case "QUEUE_INTENT_DISPATCHED": {
      requirePhase(reconciled, ["QUEUEING"], event.type);
      exactKeys(event.payload, [], [], "event.payload");
      if (!reconciled.queueIntent || reconciled.queueIntent.status !== "CLAIMED") throw new TypeError("only CLAIMED queue intents can be dispatched");
      return {
        ...reconciled,
        queueIntent: {
          ...reconciled.queueIntent,
          status: "DISPATCHED",
          dispatchedAtEpochMs: now,
          observeUntilEpochMs: now + reconciled.config.queueObservationTimeoutMs,
        },
      };
    }
    case "QUEUE_INTENT_FAILED": {
      requirePhase(reconciled, ["QUEUEING", "PAUSED_QUEUEING"], event.type);
      exactKeys(event.payload, ["reason"], [], "event.payload");
      if (!reconciled.queueIntent || !["CLAIMED", "DISPATCHED"].includes(reconciled.queueIntent.status)) throw new TypeError("only claimed or dispatched queue intents can become ambiguous");
      return { ...reconciled, phase: "PAUSED_QUEUEING", pauseReason: event.payload.reason || "QUEUE_EFFECT_AMBIGUOUS", queueIntent: { ...reconciled.queueIntent, status: "AMBIGUOUS" } };
    }
    case "QUEUE_INTENT_CANCELLED": {
      requirePhase(reconciled, ["QUEUEING"], event.type);
      exactKeys(event.payload, ["reason"], [], "event.payload");
      if (!reconciled.queueIntent || reconciled.queueIntent.status !== "CLAIMED") throw new TypeError("only a claimed queue intent can be cancelled before dispatch");
      return { ...reconciled, queueIntent: null, pauseReason: null };
    }
    case "GAME_OBSERVED": {
      requirePhase(reconciled, ["QUEUEING", "DRAINING", "PAUSED_QUEUEING"], event.type);
      exactKeys(event.payload, ["activeGame"], [], "event.payload");
      if (!reconciled.queueIntent || !["DISPATCHED", "AMBIGUOUS"].includes(reconciled.queueIntent.status)) throw new TypeError("game requires a dispatched queue intent");
      const activeGame = validateActiveGame(event.payload.activeGame);
      if (activeGame.queueIntentId !== reconciled.queueIntent.intentId || activeGame.runtimeGameToken !== reconciled.queueIntent.runtimeGameToken) throw new TypeError("active game does not match queue intent");
      const phase = now >= reconciled.deadlineEpochMs || reconciled.phase === "DRAINING" ? "DRAINING" : "IN_GAME";
      const next = { ...reconciled, phase, queueIntent: { ...reconciled.queueIntent, status: "MATCH_OBSERVED" }, activeGame, pauseReason: null };
      return phase === "DRAINING" ? enterDraining(next, now) : next;
    }
    case "COMPATIBILITY_GAME_OBSERVED": {
      requirePhase(reconciled, ["QUEUEING", "DRAINING"], event.type);
      if (reconciled.executionMode !== "COMPATIBILITY") throw new TypeError("compatibility game requires compatibility execution mode");
      exactKeys(event.payload, ["activeGame"], [], "event.payload");
      if (reconciled.activeGame) throw new TypeError("an active game is already admitted");
      const activeGame = validateActiveGame(event.payload.activeGame);
      const phase = now >= reconciled.deadlineEpochMs || reconciled.phase === "DRAINING" ? "DRAINING" : "IN_GAME";
      const next = { ...reconciled, phase, activeGame, queueIntent: null, pauseReason: null };
      return phase === "DRAINING" ? enterDraining(next, now) : next;
    }
    case "TARGET_PINNED": {
      requirePhase(reconciled, ["IN_GAME", "DRAINING"], event.type);
      exactKeys(event.payload, ["canonicalPlatformGameId", "actuator", "calibrationCapabilityExpiresAtEpochMs"], [], "event.payload");
      if (!reconciled.activeGame || reconciled.activeGame.canonicalPlatformGameId !== event.payload.canonicalPlatformGameId) throw new TypeError("target pin does not match active game");
      if (reconciled.activeGame.targetPinStatus === "PINNED") throw new TypeError("active game target is already pinned");
      const activeGame = validateActiveGame({ ...reconciled.activeGame, targetPinStatus: "PINNED", actuator: event.payload.actuator, calibrationCapabilityExpiresAtEpochMs: event.payload.calibrationCapabilityExpiresAtEpochMs });
      return { ...reconciled, activeGame };
    }
    case "CAPABILITY_REFRESHED": {
      requirePhase(reconciled, ["IN_GAME", "DRAINING"], event.type);
      exactKeys(event.payload, ["canonicalPlatformGameId", "calibrationCapabilityExpiresAtEpochMs"], [], "event.payload");
      if (!reconciled.activeGame || reconciled.activeGame.targetPinStatus !== "PINNED" || reconciled.activeGame.canonicalPlatformGameId !== event.payload.canonicalPlatformGameId) throw new TypeError("capability refresh does not match pinned game");
      if (!Number.isInteger(event.payload.calibrationCapabilityExpiresAtEpochMs) || event.payload.calibrationCapabilityExpiresAtEpochMs <= reconciled.activeGame.calibrationCapabilityExpiresAtEpochMs) throw new TypeError("capability refresh must extend expiry");
      return { ...reconciled, activeGame: validateActiveGame({ ...reconciled.activeGame, calibrationCapabilityExpiresAtEpochMs: event.payload.calibrationCapabilityExpiresAtEpochMs }) };
    }
    case "POSITION_OBSERVED": {
      requirePhase(reconciled, ["IN_GAME", "DRAINING"], event.type);
      exactKeys(event.payload, ["canonicalPlatformGameId", "fen", "positionRevision"], [], "event.payload");
      const game = reconciled.activeGame;
      if (!game || game.canonicalPlatformGameId !== event.payload.canonicalPlatformGameId) throw new TypeError("position does not match active game");
      if (typeof event.payload.fen !== "string" || event.payload.fen.trim().split(/\s+/).length !== 6) throw new TypeError("position FEN must contain six fields");
      if (event.payload.fen === game.lastFen || event.payload.positionRevision !== game.positionRevision + 1) throw new TypeError("position revision must advance for a new FEN");
      return { ...reconciled, activeGame: validateActiveGame({ ...game, lastFen: event.payload.fen, positionRevision: event.payload.positionRevision }) };
    }
    case "MOVE_PLAN_EVALUATED": {
      requirePhase(reconciled, ["IN_GAME", "DRAINING"], event.type);
      exactKeys(event.payload, ["canonicalPlatformGameId", "positionRevision", "actuation"], [], "event.payload");
      const game = reconciled.activeGame;
      if (!game || game.canonicalPlatformGameId !== event.payload.canonicalPlatformGameId || game.positionRevision !== event.payload.positionRevision) throw new TypeError("move plan does not match persisted position");
      return { ...reconciled, activeGame: validateActiveGame({ ...game, actuation: event.payload.actuation }) };
    }
    case "GAME_RESULT_OBSERVED":
      requirePhase(reconciled, ["IN_GAME", "DRAINING", "PAUSED_ACTIVE"], event.type);
      return reduceResult(reconciled, event);
    case "COMPATIBILITY_RESULT_OBSERVED": {
      requirePhase(reconciled, ["IN_GAME", "DRAINING", "PAUSED_ACTIVE"], event.type);
      exactKeys(event.payload, ["canonicalPlatformGameId", "outcome"], [], "event.payload");
      if (!reconciled.activeGame || reconciled.activeGame.canonicalPlatformGameId !== event.payload.canonicalPlatformGameId || event.eventId !== `compat-result:${event.payload.canonicalPlatformGameId}` || event.canonicalPlatformGameId !== event.payload.canonicalPlatformGameId || !OUTCOMES.includes(event.payload.outcome)) throw new TypeError("compatibility result identity is invalid");
      const observedCounts = incrementCounts(reconciled.observedCounts, event.payload.outcome);
      return { ...reconciled, observedCounts, activeGame: null, phase: reconciled.phase === "DRAINING" ? "COMPLETED" : "QUEUEING", pauseReason: null, completionReason: reconciled.phase === "DRAINING" ? "DRAIN_COMPLETE" : null };
    }
    case "OUTCOME_UNKNOWN": {
      requirePhase(reconciled, ["IN_GAME", "DRAINING", "PAUSED_ACTIVE"], event.type);
      exactKeys(event.payload, ["canonicalPlatformGameId"], [], "event.payload");
      if (!reconciled.activeGame || reconciled.activeGame.canonicalPlatformGameId !== event.payload.canonicalPlatformGameId) throw new TypeError("unknown outcome does not match the active game");
      return { ...reconciled, phase: "PAUSED_ACTIVE", pauseReason: "OUTCOME_UNKNOWN" };
    }
    case "REQUEST_GRACEFUL_STOP": {
      exactKeys(event.payload, [], [], "event.payload");
      requireRunning(reconciled);
      if (reconciled.activeGame || (reconciled.queueIntent && ["DISPATCHED", "MATCH_OBSERVED"].includes(reconciled.queueIntent.status))) return enterDraining(reconciled, now);
      if (reconciled.queueIntent && reconciled.queueIntent.status === "CLAIMED") return { ...reconciled, phase: "PAUSED_QUEUEING", pauseReason: "QUEUE_EFFECT_AMBIGUOUS", queueIntent: { ...reconciled.queueIntent, status: "AMBIGUOUS" } };
      const queueIntent = reconciled.queueIntent && reconciled.queueIntent.status === "PREPARED" ? { ...reconciled.queueIntent, status: "CANCELLED" } : reconciled.queueIntent;
      return { ...reconciled, phase: "COMPLETED", queueIntent, completionReason: "GRACEFUL_STOP" };
    }
    case "PAUSE": {
      exactKeys(event.payload, ["reason"], [], "event.payload");
      requireRunning(reconciled);
      if (typeof event.payload.reason !== "string" || !event.payload.reason) throw new TypeError("pause reason is required");
      return { ...reconciled, phase: reconciled.activeGame ? "PAUSED_ACTIVE" : "PAUSED_QUEUEING", pauseReason: event.payload.reason };
    }
    case "FORCE_STOP":
      exactKeys(event.payload, [], [], "event.payload");
      return { ...reconciled, phase: "ABORTED", completionReason: "FORCE_STOPPED", pauseReason: null };
    default:
      throw new TypeError(`unsupported event type: ${event.type}`);
  }
}

function reduce(snapshot, rawEvent) {
  const event = validateEventEnvelope(rawEvent);
  if (snapshot === null) {
    if (event.type !== "SESSION_STARTED" || event.expectedRevision !== 0 || event.sequence !== 1) throw new TypeError("first event must start the session");
    return Object.freeze({ nextState: validateSnapshot(startSession(event)), effects: Object.freeze([]) });
  }
  const current = validateSnapshot(snapshot);
  if (TERMINAL_PHASES.includes(current.phase)) throw new TypeError("terminal sessions are immutable");
  if (event.sessionId !== current.sessionId || event.authorityEpoch !== current.authorityEpoch) throw new TypeError("event authority identity mismatch");
  if (event.expectedRevision !== current.revision) throw new TypeError("event revision mismatch");
  const transitioned = transition(clone(current), event);
  const nextState = validateSnapshot({ ...transitioned, revision: event.sequence, lastObservedEpochMs: Math.max(transitioned.lastObservedEpochMs, event.occurredAtEpochMs) });
  return Object.freeze({ nextState: deepFreeze(nextState), effects: Object.freeze([]) });
}

module.exports = { emptyCounts, incrementCounts, reduce };
