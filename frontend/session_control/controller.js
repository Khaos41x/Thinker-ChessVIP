"use strict";

const { canAdmitQueue, effectiveNow } = require("./clock");
const { REDUCER_VERSION, SCHEMA_VERSION, TERMINAL_PHASES, validateHex128, validateSessionConfig, validateSnapshot } = require("./models");
const { reduce } = require("./reducer");
const { SessionControlError } = require("./repository");

const ACTIVE_PHASES = Object.freeze(["QUEUEING", "IN_GAME", "DRAINING", "PAUSED_QUEUEING", "PAUSED_ACTIVE"]);

function decision(allowed, reason) {
  return Object.freeze({ allowed, reason });
}

function isSessionActive(snapshot) {
  return Boolean(snapshot && ACTIVE_PHASES.includes(snapshot.phase));
}

function evaluateQueueGate(input) {
  if (!input.userAutoQueue) return decision(false, "USER_AUTO_QUEUE_DISABLED");
  if (!input.isLeader) return decision(false, "LEADER_REQUIRED");
  if (!input.storageHealthy) return decision(false, "STORAGE_UNAVAILABLE");
  const snapshot = validateSnapshot(input.snapshot);
  if (snapshot.phase !== "QUEUEING") return decision(false, "PHASE_NOT_QUEUEING");
  if (snapshot.activeGame !== null) return decision(false, "ACTIVE_GAME_PRESENT");
  if (snapshot.queueIntent !== null) return decision(false, "QUEUE_INTENT_PRESENT");
  if (!canAdmitQueue(snapshot, input.nowEpochMs)) return decision(false, "TTL_HEADROOM_INSUFFICIENT");
  const readiness = input.calibrationReadiness;
  if (!readiness || readiness.active !== true) return decision(false, "CALIBRATION_NOT_ACTIVE");
  if (readiness.opponentRatingScaleId !== input.intendedQueueScaleId) return decision(false, "CALIBRATION_SCALE_MISMATCH");
  if (!Number.isInteger(readiness.expiresAtEpochMs) || readiness.expiresAtEpochMs <= effectiveNow(snapshot.lastObservedEpochMs, input.nowEpochMs)) return decision(false, "CALIBRATION_EXPIRED");
  return decision(true, "ALLOWED");
}

function evaluateQueueDispatchGate(input) {
  if (!input.userAutoQueue) return decision(false, "USER_AUTO_QUEUE_DISABLED");
  if (!input.isLeader) return decision(false, "LEADER_REQUIRED");
  if (!input.storageHealthy) return decision(false, "STORAGE_UNAVAILABLE");
  const snapshot = validateSnapshot(input.snapshot);
  if (snapshot.phase !== "QUEUEING") return decision(false, "PHASE_NOT_QUEUEING");
  if (snapshot.activeGame !== null) return decision(false, "ACTIVE_GAME_PRESENT");
  if (!snapshot.queueIntent || snapshot.queueIntent.status !== "CLAIMED") return decision(false, "QUEUE_INTENT_NOT_CLAIMED");
  const now = effectiveNow(snapshot.lastObservedEpochMs, input.nowEpochMs);
  if (now + snapshot.config.minimumAdmissionHeadroomMs >= snapshot.deadlineEpochMs) return decision(false, "TTL_HEADROOM_INSUFFICIENT");
  const readiness = input.calibrationReadiness;
  if (!readiness || readiness.active !== true) return decision(false, "CALIBRATION_NOT_ACTIVE");
  if (readiness.opponentRatingScaleId !== input.intendedQueueScaleId) return decision(false, "CALIBRATION_SCALE_MISMATCH");
  if (!Number.isInteger(readiness.expiresAtEpochMs) || readiness.expiresAtEpochMs <= now) return decision(false, "CALIBRATION_EXPIRED");
  return decision(true, "ALLOWED");
}

function evaluateAutoMoveGate(input) {
  if (!input.userAutoMove) return decision(false, "USER_AUTOMOVE_DISABLED");
  if (!input.isLeader) return decision(false, "LEADER_REQUIRED");
  if (!input.storageHealthy) return decision(false, "STORAGE_UNAVAILABLE");
  const snapshot = validateSnapshot(input.snapshot);
  if (!["IN_GAME", "DRAINING"].includes(snapshot.phase)) return decision(false, "PHASE_NOT_ACTIVE");
  const game = snapshot.activeGame;
  if (!game) return decision(false, "ACTIVE_GAME_MISSING");
  if (game.targetPinStatus !== "PINNED" || !game.actuator) return decision(false, "TARGET_NOT_PINNED");
  if (!game.actuation.valid) return decision(false, game.actuation.invalidReason || "ACTUATION_INVALID");
  const now = effectiveNow(snapshot.lastObservedEpochMs, input.nowEpochMs);
  if (game.calibrationCapabilityExpiresAtEpochMs <= now) return decision(false, "CALIBRATION_EXPIRED");
  if (input.gameMode !== "play") return decision(false, "GAME_MODE_NOT_PLAY");
  const observed = input.observedGame;
  if (!observed || observed.gameIdentityStable !== true || observed.terminalState !== "ONGOING") return decision(false, "GAME_IDENTITY_UNSTABLE");
  if (observed.canonicalPlatformGameId !== game.canonicalPlatformGameId || observed.accountKey !== snapshot.accountKey || observed.runtimeGameToken !== game.runtimeGameToken) return decision(false, "GAME_IDENTITY_MISMATCH");
  return decision(true, "ALLOWED");
}

class EffectEpoch {
  constructor() {
    this.value = 0;
  }

  advance() {
    this.value += 1;
    return this.value;
  }

  capture() {
    return this.value;
  }

  isCurrent(value) {
    return value === this.value;
  }
}

class SessionControlController {
  constructor(options) {
    if (!options || !options.repository || !options.leader || !options.clock || typeof options.idFactory !== "function") throw new TypeError("repository, leader, clock, and idFactory are required");
    validateHex128(options.ownerTabId, "ownerTabId");
    this.repository = options.repository;
    this.leader = options.leader;
    this.clock = options.clock;
    this.idFactory = options.idFactory;
    this.ownerTabId = options.ownerTabId;
    this.snapshot = null;
    this.lease = null;
    this.storageHealthy = true;
    this.effectEpoch = new EffectEpoch();
    this.pendingPosition = null;
    this.positionCommit = null;
    this.telemetry = options.telemetry || null;
    this.rolloutStage = options.rolloutStage || "DISABLED";
  }

  setSnapshot(rawSnapshot) {
    const next = rawSnapshot === null ? null : validateSnapshot(rawSnapshot);
    const previousKey = this.snapshot ? `${this.snapshot.authorityEpoch}:${this.snapshot.sessionId}:${this.snapshot.phase}:${this.snapshot.activeGame?.canonicalPlatformGameId || ""}` : "";
    const nextKey = next ? `${next.authorityEpoch}:${next.sessionId}:${next.phase}:${next.activeGame?.canonicalPlatformGameId || ""}` : "";
    this.snapshot = next;
    if (previousKey !== nextKey) this.effectEpoch.advance();
    return this.snapshot;
  }

  setLease(lease) {
    const previous = this.lease ? `${this.lease.ownerTabId}:${this.lease.fencingToken}` : "";
    const next = lease ? `${lease.ownerTabId}:${lease.fencingToken}` : "";
    this.lease = lease;
    if (previous !== next) this.effectEpoch.advance();
  }

  setStorageHealthy(value) {
    const healthy = value === true;
    if (healthy !== this.storageHealthy) this.effectEpoch.advance();
    this.storageHealthy = healthy;
  }

  isActive() {
    return isSessionActive(this.snapshot);
  }

  isLeader() {
    return Boolean(this.snapshot && this.lease && this.lease.authorityEpoch === this.snapshot.authorityEpoch && this.lease.sessionId === this.snapshot.sessionId && this.lease.ownerTabId === this.ownerTabId);
  }

  legacyAutoAdjustSuspended() {
    return this.isActive();
  }

  moveSelectionElo(fallbackElo) {
    const actuator = this.snapshot && this.snapshot.activeGame && this.snapshot.activeGame.actuator;
    return this.isActive() && actuator ? actuator.effectiveTargetElo : fallbackElo;
  }

  _telemetryFields(reasonCode) {
    const snapshot = this.snapshot;
    if (!snapshot) return { occurredAtEpochMs: this.clock.now(), rolloutStage: this.rolloutStage, reasonCode };
    const actuator = snapshot.activeGame && snapshot.activeGame.actuator;
    return {
      occurredAtEpochMs: this.clock.now(), phase: snapshot.phase, revision: snapshot.revision,
      role: this.isLeader() ? "LEADER" : "FOLLOWER", observedCounts: snapshot.observedCounts,
      controlCounts: snapshot.controlCounts, controllerMode: snapshot.controller.mode,
      posteriorWinRate: snapshot.controller.posteriorWinRate, offsetElo: actuator ? actuator.offsetElo : snapshot.controller.mode === "BOOST" ? snapshot.config.boostOffsetElo : snapshot.config.correctionOffsetElo,
      rawTargetElo: actuator ? actuator.rawTargetElo : undefined,
      effectiveTargetElo: actuator ? actuator.effectiveTargetElo : undefined,
      saturated: actuator ? actuator.saturated : false, reasonCode,
      reducerVersion: REDUCER_VERSION, estimatorVersion: snapshot.config.estimatorVersion,
      controllerVersion: snapshot.config.controllerVersion, rolloutStage: this.rolloutStage,
    };
  }

  _record(name, reasonCode) {
    if (this.telemetry && typeof this.telemetry.record === "function") this.telemetry.record(name, this._telemetryFields(reasonCode));
  }

  async startSession(input) {
    if (!input || typeof input.accountKey !== "string" || !input.accountKey) throw new TypeError("accountKey is required");
    if (this.isActive()) throw new SessionControlError("ACTIVE_SESSION_EXISTS", "A session is already active");
    const config = validateSessionConfig(input.config);
    const sessionId = this.idFactory();
    validateHex128(sessionId, "sessionId");
    const authorityEpoch = input.authorityEpoch === undefined ? ((this.snapshot && this.snapshot.authorityEpoch) || 0) + 1 : input.authorityEpoch;
    if (!Number.isInteger(authorityEpoch) || authorityEpoch < 1) throw new TypeError("authorityEpoch is invalid");
    const now = this.clock.now();
    const event = {
      schemaVersion: SCHEMA_VERSION, eventId: "session:start", sessionId, authorityEpoch,
      expectedRevision: 0, sequence: 1, occurredAtEpochMs: now, type: "SESSION_STARTED",
      payload: { accountKey: input.accountKey, config, authorizationDecision: input.authorizationDecision },
      reducerVersion: REDUCER_VERSION,
    };
    const next = reduce(null, event).nextState;
    const result = await this.repository.commit(event, next);
    if (result.status !== "committed") throw new SessionControlError("REVISION_CONFLICT", "Session start was not committed");
    this.setSnapshot(next);
    const acquired = await this.leader.acquire({ authorityEpoch, sessionId, ownerTabId: this.ownerTabId });
    if (!["acquired", "renewed"].includes(acquired.status)) throw new SessionControlError("LEADER_REQUIRED", "Session writer lease is contended");
    this.setLease(acquired.lease);
    this._record("session_started", "START");
    this._record("leader_acquired", acquired.status === "acquired" ? "LEASE_ACQUIRED" : "LEASE_RENEWED");
    return this.snapshot;
  }

  async recoverSession(accountKey) {
    const snapshot = await this.repository.loadCurrentSession(accountKey);
    this.setSnapshot(snapshot);
    if (!snapshot || TERMINAL_PHASES.includes(snapshot.phase)) return snapshot;
    const acquired = await this.leader.acquire({ authorityEpoch: snapshot.authorityEpoch, sessionId: snapshot.sessionId, ownerTabId: this.ownerTabId });
    if (["acquired", "renewed"].includes(acquired.status)) this.setLease(acquired.lease);
    else this.setLease(null);
    this._record("session_recovered", acquired.status === "contended" ? "FOLLOWER_RECOVERY" : "LEADER_RECOVERY");
    return this.snapshot;
  }

  async renewLeadership() {
    if (!this.snapshot || TERMINAL_PHASES.includes(this.snapshot.phase)) return decision(false, "SESSION_INACTIVE");
    const result = await this.leader.renew({ authorityEpoch: this.snapshot.authorityEpoch, sessionId: this.snapshot.sessionId, ownerTabId: this.ownerTabId });
    if (["acquired", "renewed"].includes(result.status)) {
      const takeover = !this.isLeader();
      this.setLease(result.lease);
      if (takeover) this._record("lease_takeover", "LEASE_TAKEOVER");
      return decision(true, result.status.toUpperCase());
    }
    if (this.isLeader()) this._record("leader_lost", "LEASE_CONTENDED");
    this.setLease(null);
    return decision(false, "LEASE_CONTENDED");
  }

  async reconcileNow() {
    if (!this.snapshot || TERMINAL_PHASES.includes(this.snapshot.phase)) return this.snapshot;
    return this._commit("CLOCK_RECONCILED", {}, `clock:${this.snapshot.revision + 1}`);
  }

  async requestGracefulStop() {
    if (!this.snapshot || TERMINAL_PHASES.includes(this.snapshot.phase)) return decision(false, "SESSION_INACTIVE");
    await this._commit("REQUEST_GRACEFUL_STOP", {}, `stop:graceful:${this.snapshot.revision + 1}`);
    return decision(true, this.snapshot.phase === "DRAINING" ? "DRAINING" : "COMPLETED");
  }

  async pinCalibration(capability) {
    const snapshot = this.snapshot;
    const game = snapshot && snapshot.activeGame;
    if (!game || game.targetPinStatus !== "PENDING") return decision(false, "TARGET_NOT_PENDING");
    if (!capability || capability.runtimeGameToken !== game.runtimeGameToken || capability.mode !== "active") return decision(false, "CALIBRATION_IDENTITY_MISMATCH");
    const expectedOffset = snapshot.controller.mode === "BOOST" ? snapshot.config.boostOffsetElo : snapshot.config.correctionOffsetElo;
    if (capability.opponentRatingScaleId !== game.opponent.ratingScaleId || capability.platformAdjustedRating !== game.opponent.rating + expectedOffset || capability.scaleId !== snapshot.config.scaleId) return decision(false, "CALIBRATION_IDENTITY_MISMATCH");
    const actuator = {
      controllerMode: snapshot.controller.mode,
      offsetElo: expectedOffset,
      rawTargetElo: capability.translatedTargetElo,
      effectiveTargetElo: capability.effectiveTargetElo,
      ratingScaleMappingVersion: capability.ratingScaleMappingVersion,
      ratingScaleMappingChecksum: capability.ratingScaleMappingChecksum,
      saturated: capability.targetSaturated,
      saturationReason: capability.targetSaturated ? "TARGET_CLAMPED" : null,
      scaleId: capability.scaleId,
      artifactChecksum: capability.artifactChecksum,
      artifactVersion: capability.artifactVersion,
      cohort: capability.cohort,
      rolloutVersion: capability.rolloutVersion,
      seedPolicyVersion: capability.seedPolicyVersion,
      requiredBudgetClass: capability.allowedBudgetClasses[0],
    };
    await this._commit("TARGET_PINNED", { canonicalPlatformGameId: game.canonicalPlatformGameId, actuator, calibrationCapabilityExpiresAtEpochMs: capability.expiresAtEpochMs }, `target:pinned:${game.canonicalPlatformGameId}`);
    return decision(true, "PINNED");
  }

  async observePosition(fen, minimumSeparationMs = 250) {
    const game = this.snapshot && this.snapshot.activeGame;
    if (!game || !["IN_GAME", "DRAINING"].includes(this.snapshot.phase) || game.targetPinStatus !== "PINNED") return null;
    if (fen === game.lastFen) return this.movePlanContext();
    const now = this.clock.now();
    if (!this.pendingPosition || this.pendingPosition.fen !== fen) {
      this.pendingPosition = { fen, observedAtEpochMs: now };
      return null;
    }
    if (now - this.pendingPosition.observedAtEpochMs < minimumSeparationMs) return null;
    if (!this.positionCommit) {
      const revision = game.positionRevision + 1;
      this.positionCommit = this._commit("POSITION_OBSERVED", { canonicalPlatformGameId: game.canonicalPlatformGameId, fen, positionRevision: revision }, `position:${game.runtimeGameToken}:${revision}`).finally(() => { this.positionCommit = null; });
    }
    await this.positionCommit;
    this.pendingPosition = null;
    return this.movePlanContext();
  }

  movePlanContext() {
    const game = this.snapshot && this.snapshot.activeGame;
    if (!game || game.targetPinStatus !== "PINNED" || !game.lastFen || game.positionRevision < 1) return null;
    const actuator = game.actuator;
    return Object.freeze({
      runtimeGameToken: game.runtimeGameToken,
      positionRevision: game.positionRevision,
      fen: game.lastFen,
      moveSelectionElo: actuator.effectiveTargetElo,
      perceptionElo: this.snapshot.config.perceptionElo,
      calibrationRequirement: {
        requiredMode: "active", scaleId: actuator.scaleId, artifactVersion: actuator.artifactVersion,
        artifactChecksum: actuator.artifactChecksum, cohort: actuator.cohort, rolloutVersion: actuator.rolloutVersion,
        seedPolicyVersion: actuator.seedPolicyVersion, budgetClass: actuator.requiredBudgetClass,
        ratingScaleMappingVersion: actuator.ratingScaleMappingVersion, ratingScaleMappingChecksum: actuator.ratingScaleMappingChecksum,
      },
    });
  }

  async acceptMovePlanResponse(response, context) {
    const game = this.snapshot && this.snapshot.activeGame;
    if (!game || !context || context.runtimeGameToken !== game.runtimeGameToken || context.positionRevision !== game.positionRevision) return decision(false, "POSITION_IDENTITY_MISMATCH");
    const origin = response && (response.originSource || response.source);
    const calibration = response && response.calibration;
    let valid = true;
    let reason = null;
    let applied = false;
    let profile = game.actuation.resolvedProfile;
    if (["book", "forced"].includes(origin) && calibration && calibration.calibrationStatus === "not_applied") {
      valid = game.actuation.valid;
    } else if (origin === "engine" && calibration && calibration.calibrationStatus === "applied") {
      const actuator = game.actuator;
      const identityMatches = calibration.targetElo === actuator.effectiveTargetElo && calibration.scaleId === actuator.scaleId && calibration.artifactVersion === actuator.artifactVersion && calibration.artifactChecksum === actuator.artifactChecksum && calibration.calibrationCohort === actuator.cohort && calibration.rolloutVersion === actuator.rolloutVersion && calibration.seedPolicyVersion === actuator.seedPolicyVersion && calibration.budgetClass === actuator.requiredBudgetClass && calibration.ratingScaleMappingVersion === actuator.ratingScaleMappingVersion && calibration.ratingScaleMappingChecksum === actuator.ratingScaleMappingChecksum;
      profile = { resolverVersion: calibration.resolverVersion, resolutionKey: calibration.resolutionKey, latentSkill: calibration.latentSkill, appliedSkill: calibration.appliedSkill, budgetClass: calibration.budgetClass, profileDigest: calibration.profileDigest };
      const profileMatches = !game.actuation.resolvedProfile || JSON.stringify(game.actuation.resolvedProfile) === JSON.stringify(profile);
      valid = identityMatches && profileMatches;
      applied = valid;
      if (!valid) reason = "CALIBRATION_IDENTITY_MISMATCH";
    } else {
      valid = false;
      reason = origin === "static" ? "STATIC_FALLBACK" : "CALIBRATION_NOT_APPLIED";
    }
    const actuation = {
      valid: game.actuation.valid && valid,
      invalidReason: game.actuation.valid && valid ? null : game.actuation.invalidReason || reason,
      appliedMoveCount: game.actuation.appliedMoveCount + (applied ? 1 : 0),
      nonAppliedMoveCount: game.actuation.nonAppliedMoveCount + (applied ? 0 : 1),
      resolvedProfile: applied ? profile : game.actuation.resolvedProfile,
    };
    await this._commit("MOVE_PLAN_EVALUATED", { canonicalPlatformGameId: game.canonicalPlatformGameId, positionRevision: game.positionRevision, actuation }, `move-plan:${game.runtimeGameToken}:${game.positionRevision}`);
    return decision(actuation.valid, actuation.valid ? "ACCEPTED" : actuation.invalidReason);
  }

  queueGate(input) {
    return evaluateQueueGate({ ...input, snapshot: this.snapshot, isLeader: this.isLeader(), storageHealthy: this.storageHealthy, nowEpochMs: this.clock.now() });
  }

  autoMoveGate(input) {
    return evaluateAutoMoveGate({ ...input, snapshot: this.snapshot, isLeader: this.isLeader(), storageHealthy: this.storageHealthy, nowEpochMs: this.clock.now() });
  }

  queueDispatchGate(input) {
    return evaluateQueueDispatchGate({ ...input, snapshot: this.snapshot, isLeader: this.isLeader(), storageHealthy: this.storageHealthy, nowEpochMs: this.clock.now() });
  }

  captureEffectEpoch() {
    return this.effectEpoch.capture();
  }

  isEffectEpochCurrent(value) {
    return this.effectEpoch.isCurrent(value);
  }

  _leaseBinding(expectedRevision) {
    if (!this.snapshot || !this.lease) throw new SessionControlError("STALE_FENCE", "Session leadership is unavailable");
    return {
      leaseName: this.leader.leaseName,
      authorityEpoch: this.snapshot.authorityEpoch,
      sessionId: this.snapshot.sessionId,
      ownerTabId: this.ownerTabId,
      fencingToken: this.lease.fencingToken,
      expectedRevision,
      nowEpochMs: this.clock.now(),
    };
  }

  _event(type, payload, eventId, canonicalPlatformGameId) {
    const snapshot = this.snapshot;
    const event = {
      schemaVersion: SCHEMA_VERSION,
      eventId,
      sessionId: snapshot.sessionId,
      authorityEpoch: snapshot.authorityEpoch,
      expectedRevision: snapshot.revision,
      sequence: snapshot.revision + 1,
      occurredAtEpochMs: this.clock.now(),
      type,
      payload,
      reducerVersion: REDUCER_VERSION,
    };
    if (canonicalPlatformGameId !== undefined) event.canonicalPlatformGameId = canonicalPlatformGameId;
    return event;
  }

  async _commit(type, payload, eventId) {
    const previousPhase = this.snapshot.phase;
    const previousMode = this.snapshot.controller.mode;
    const event = this._event(type, payload, eventId);
    const next = reduce(this.snapshot, event).nextState;
    const result = await this.repository.commit(event, next, this._leaseBinding(event.expectedRevision));
    if (result.status === "duplicate") {
      const restored = await this.repository.loadSession(event.sessionId);
      if (!restored) throw new SessionControlError("REVISION_CONFLICT", "Duplicate event has no authoritative snapshot");
      this.setSnapshot(restored);
      if (type === "GAME_RESULT_OBSERVED") this._record("duplicate_result_ignored", "DUPLICATE_RESULT");
      return restored;
    }
    if (result.status !== "committed") throw new SessionControlError("REVISION_CONFLICT", "Unexpected controller event status");
    this.setSnapshot(next);
    const eventName = {
      QUEUE_INTENT_PREPARED: "queue_intent_admitted", QUEUE_INTENT_DISPATCHED: "queue_intent_consumed",
      TARGET_PINNED: "game_target_pinned", GAME_RESULT_OBSERVED: "result_committed", PAUSE: "session_paused",
    }[type];
    if (eventName) this._record(eventName, type);
    if (next.phase === "DRAINING" && previousPhase !== "DRAINING") this._record("session_draining", type);
    if (TERMINAL_PHASES.includes(next.phase) && !TERMINAL_PHASES.includes(previousPhase)) this._record("session_completed", next.completionReason || type);
    if (next.controller.mode !== previousMode) this._record("dda_mode_changed", type);
    if (type === "TARGET_PINNED" && next.activeGame && next.activeGame.actuator.saturated) this._record("target_saturated", "TARGET_CLAMPED");
    return next;
  }

  async executeQueueEffect(input, clickEffect) {
    if (typeof clickEffect !== "function") throw new TypeError("clickEffect must be a function");
    const gate = this.queueGate(input);
    if (!gate.allowed) return gate;
    const intentId = this.idFactory();
    const runtimeGameToken = this.idFactory();
    validateHex128(intentId, "intentId");
    validateHex128(runtimeGameToken, "runtimeGameToken");
    const preparedAtEpochMs = this.clock.now();
    const queueIntent = { schemaVersion: 1, intentId, runtimeGameToken, status: "PREPARED", preparedAtEpochMs, claimedByFence: null, dispatchedAtEpochMs: null, observeUntilEpochMs: null };
    await this._commit("QUEUE_INTENT_PREPARED", { queueIntent }, `queue:prepared:${intentId}`);
    await this._commit("QUEUE_INTENT_CLAIMED", { fencingToken: this.lease.fencingToken }, `queue:claimed:${intentId}`);
    const epoch = this.captureEffectEpoch();
    const binding = this._leaseBinding(this.snapshot.revision);
    await this.leader.executeCommittedEffect(binding, async () => {
      if (!this.isEffectEpochCurrent(epoch)) throw new SessionControlError("STALE_EFFECT_EPOCH", "Queue callback belongs to an obsolete epoch");
      const finalGate = this.queueDispatchGate(input);
      if (!finalGate.allowed) throw new SessionControlError(finalGate.reason, "Queue gate closed before dispatch");
      const dispatched = await this._commit("QUEUE_INTENT_DISPATCHED", {}, `queue:dispatched:${intentId}`);
      return { binding: this._leaseBinding(dispatched.revision), value: dispatched };
    }, clickEffect);
    return decision(true, "DISPATCHED");
  }

  async executeAutoMoveEffect(input, capturedEpoch, moveEffect) {
    if (typeof moveEffect !== "function") throw new TypeError("moveEffect must be a function");
    const gate = this.autoMoveGate(input);
    if (!gate.allowed) return gate;
    if (!this.isEffectEpochCurrent(capturedEpoch)) return decision(false, "STALE_EFFECT_EPOCH");
    await this.leader.executeEffect(this._leaseBinding(this.snapshot.revision), () => {
      if (!this.isEffectEpochCurrent(capturedEpoch)) throw new SessionControlError("STALE_EFFECT_EPOCH", "Move callback belongs to an obsolete epoch");
      const finalGate = this.autoMoveGate(input);
      if (!finalGate.allowed) throw new SessionControlError(finalGate.reason, "Auto Move gate closed before dispatch");
      return moveEffect();
    });
    return decision(true, "DISPATCHED");
  }

  async pauseForDisabledAutoMove() {
    if (!this.snapshot || !this.snapshot.activeGame || TERMINAL_PHASES.includes(this.snapshot.phase)) return decision(false, "NO_ACTIVE_GAME");
    await this._commit("PAUSE", { reason: "USER_AUTOMOVE_DISABLED" }, `pause:user-automove:${this.snapshot.revision + 1}`);
    return decision(true, "PAUSED");
  }
}

module.exports = { ACTIVE_PHASES, EffectEpoch, SessionControlController, evaluateAutoMoveGate, evaluateQueueDispatchGate, evaluateQueueGate, isSessionActive };
