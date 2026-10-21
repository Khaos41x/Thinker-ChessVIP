"use strict";

const assert = require("node:assert/strict");
const {
  GmStoragePort,
  LeaderCoordinator,
  SessionControlController,
  createSessionControlBootstrap,
  createSessionControlPresenter,
  createSessionControlRuntime,
  validateStartReadiness,
} = require("../../frontend/session_control");
const { FakeClock, FakeGmStorage, FakeLockManager, MemoryRepository } = require("../../frontend/session_control/testing");
const { TAB_A, config } = require("./helpers");

class Element {
  constructor(id, attributes) {
    this.id = id || "";
    this.value = "";
    this.textContent = "";
    this.parentNode = null;
    this.children = [];
    this.attributes = new Map(Object.entries(attributes || {}));
    this.listeners = new Map();
  }
  append(child) { child.parentNode = this; this.children.push(child); return child; }
  find(predicate) { if (predicate(this)) return this; for (const child of this.children) { const found = child.find(predicate); if (found) return found; } return null; }
  querySelector(selector) {
    if (selector.startsWith("#")) return this.find((node) => node.id === selector.slice(1));
    const match = /^\[data-action="([^"]+)"\]$/.exec(selector);
    return match ? this.find((node) => node.getAttribute("data-action") === match[1]) : null;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, listener, options) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
    if (options && options.signal) options.signal.addEventListener("abort", () => this.listeners.get(type).delete(listener), { once: true });
  }
  dispatch(target) {
    const event = { target, preventDefault() {}, stopPropagation() {} };
    for (const listener of this.listeners.get("click") || []) listener(event);
  }
}

function panel() {
  const root = new Element("kb-session-panel");
  for (const [id, value] of [["kb-session-duration", "2"], ["kb-session-min-rate", "25"], ["kb-session-max-rate", "75"]]) {
    const input = root.append(new Element(id));
    input.value = value;
  }
  for (const [id, action] of [["kb-session-start", "start"], ["kb-session-stop", "stop"], ["kb-session-export", "export"]]) root.append(new Element(id, { "data-action": action }));
  for (const id of ["kb-session-phase", "kb-session-ttl", "kb-session-observed", "kb-session-raw", "kb-session-warning"]) root.append(new Element(id));
  return root;
}

function tick() { return new Promise((resolve) => setImmediate(resolve)); }

function readiness(clock, source) {
  return {
    schemaVersion: 1,
    active: true,
    opponentRatingScaleId: source,
    targetScaleId: config().scaleId,
    ratingScaleMappingVersion: "mapping-v1",
    ratingScaleMappingChecksum: "a".repeat(64),
    artifactVersion: "artifact-v1",
    artifactChecksum: "b".repeat(64),
    sourceMinimum: 400,
    sourceMaximum: 3000,
    generatedAtEpochMs: clock.now(),
    expiresAtEpochMs: clock.now() + 60000,
  };
}

function compatibilityReadiness(clock, source) {
  return {
    schemaVersion: 1,
    active: false,
    executionMode: "compatibility",
    reasonCode: "DDA_MAPPING_UNAVAILABLE",
    opponentRatingScaleId: source,
    targetScaleId: config().scaleId,
    generatedAtEpochMs: clock.now(),
    expiresAtEpochMs: clock.now() + 60000,
  };
}

async function run() {
  const clock = new FakeClock(1000000);
  assert.throws(() => validateStartReadiness({}, config(), clock.now()), (error) => error.code === "CALIBRATION_NOT_ACTIVE");
  assert.throws(() => validateStartReadiness({ intendedQueueScaleId: "source", calibrationReadiness: { active: false, reason: "server is warming" } }, config(), clock.now()), (error) => error.code === "CALIBRATION_NOT_ACTIVE");
  assert.throws(() => validateStartReadiness({ intendedQueueScaleId: "source", calibrationReadiness: { ...readiness(clock, "other") } }, config(), clock.now()), (error) => error.code === "CALIBRATION_SCALE_MISMATCH");
  const repository = new MemoryRepository();
  const leader = new LeaderCoordinator({ repository, locks: new FakeLockManager(), clock });
  let id = 0;
  const controller = new SessionControlController({ repository, leader, clock, ownerTabId: TAB_A, idFactory: () => String(++id).padStart(32, "0"), rolloutStage: "ACTIVE_DDA" });
  const storage = new FakeGmStorage();
  const storagePort = new GmStoragePort(storage.getValue.bind(storage), storage.setValue.bind(storage));
  const timers = [];
  let startContextReads = 0;
  let masterEnabled = false;
  const runtime = createSessionControlRuntime({
    controller,
    storagePort,
    repository,
    clock,
    rollout: { schemaVersion: 1, stage: "ACTIVE_DDA" },
    canStart: () => masterEnabled ? true : "BOT_DISABLED",
    observeStartContext: async () => {
      startContextReads += 1;
      return ({
      accountKey: "opaque-account",
      context: "chesscom-queue-sidebar-start-game-v1",
      pool: "chesscom-live-rapid-v1",
      intendedQueueScaleId: "chesscom-live-rapid-v1",
      calibrationReadiness: readiness(clock, "chesscom-live-rapid-v1"),
      });
    },
    setInterval: (callback, milliseconds) => { timers.push({ callback, milliseconds }); return timers.length; },
    clearInterval() {},
  });
  await assert.rejects(runtime.start(config()), (error) => error.code === "BOT_DISABLED");
  assert.equal(controller.snapshot, null);
  assert.equal(startContextReads, 0);
  masterEnabled = true;
  const root = panel();
  const notifications = [];
  const presenter = createSessionControlPresenter({
    getPanel: () => root,
    readStatus: () => require("../../frontend/session_control").buildStatusView(controller.snapshot, { nowEpochMs: clock.now(), isLeader: controller.isLeader(), rollout: runtime.rollout }),
    formatDuration: (value) => String(value),
    createConfig: () => config(),
    start: runtime.start,
    stop: () => controller.requestGracefulStop(),
    setWarning() {},
    notify: (code) => notifications.push(code),
    exportDiagnostic: () => ({}),
    downloadDiagnostic() {},
  });
  presenter.update();
  root.dispatch(root.querySelector("#kb-session-start"));
  await tick();
  await tick();
  assert.equal(controller.snapshot.phase, "QUEUEING");
  assert.equal(startContextReads, 2, "START must re-observe context and server readiness inside the authorization lock");
  assert.equal(repository.events.size, 1, "real click did not produce exactly one controller commit");
  assert.deepEqual(storage.values.get("thinker.sessionControl.authorization.v1"), { schemaVersion: 1, accounts: ["opaque-account"], contexts: ["chesscom-queue-sidebar-start-game-v1"], pools: ["chesscom-live-rapid-v1"] });
  assert(notifications.includes("Sessão iniciada"));
  assert.equal(timers.length, 1);
  assert.equal(timers[0].milliseconds, 5000);

  root.dispatch(root.querySelector("#kb-session-start"));
  root.dispatch(root.querySelector("#kb-session-start"));
  await tick();
  assert.equal(repository.events.size, 1);
  assert(notifications.includes("⚠️ Não foi possível atualizar a sessão"));
  const renewalWarnings = [];
  controller.renewLeadership = async () => { throw new Error("injected renewal failure"); };
  runtime.dispose();

  const recoveringController = new SessionControlController({ repository, leader, clock, ownerTabId: TAB_A, idFactory: () => "88888888888888888888888888888888", rolloutStage: "ACTIVE_DDA" });
  const recoveryTimers = [];
  const recoveringRuntime = createSessionControlRuntime({
    controller: recoveringController,
    storagePort,
    repository,
    clock,
    rollout: { schemaVersion: 1, stage: "ACTIVE_DDA" },
    observeStartContext: async () => ({
      accountKey: "opaque-account",
      context: "chesscom-queue-sidebar-start-game-v1",
      pool: "chesscom-live-rapid-v1",
      intendedQueueScaleId: "chesscom-live-rapid-v1",
      calibrationReadiness: readiness(clock, "chesscom-live-rapid-v1"),
    }),
    setInterval: (callback, milliseconds) => { recoveryTimers.push({ callback, milliseconds }); return recoveryTimers.length; },
    clearInterval() {},
    onWarning: (code) => renewalWarnings.push(code),
  });
  await assert.rejects(() => recoveringRuntime.start(config()), (error) => error.code === "ACTIVE_SESSION_EXISTS");
  assert.equal(recoveryTimers.length, 1, "recovered active session did not start lease renewal");
  recoveringController.renewLeadership = async () => ({ allowed: false, reason: "LEASE_CONTENDED" });
  recoveryTimers[0].callback();
  await tick();
  assert.equal(recoveringController.storageHealthy, false);
  assert.deepEqual(renewalWarnings, ["LEASE_CONTENDED"]);
  recoveringRuntime.dispose();

  const self = {};
  const bootstrapStorage = new FakeGmStorage();
  const bootstrapRepository = new MemoryRepository();
  let installs = 0;
  const environment = {
    isSecureContext: true,
    indexedDB: { open() {} },
    navigator: { locks: new FakeLockManager() },
    BroadcastChannel: function () {},
    crypto: { subtle: { digest() {} }, getRandomValues(bytes) { bytes.fill(7); return bytes; } },
    GM_getValue: bootstrapStorage.getValue.bind(bootstrapStorage),
    GM_setValue: bootstrapStorage.setValue.bind(bootstrapStorage),
    location: { origin: "https://www.chess.com" },
    top: self,
    self,
  };
  const bootstrap = createSessionControlBootstrap({
    environment,
    location: environment.location,
    top: self,
    self,
    repository: bootstrapRepository,
    clock,
    ownerTabId: TAB_A,
    idFactory: () => "99999999999999999999999999999999",
    observeStartContext: async () => ({
      accountKey: "bootstrap-account",
      context: "chesscom-queue-modal-v1",
      pool: "chesscom-live-blitz-v1",
      intendedQueueScaleId: "chesscom-live-blitz-v1",
      calibrationReadiness: readiness(clock, "chesscom-live-blitz-v1"),
    }),
    install: () => { installs += 1; },
    setInterval: () => 1,
    clearInterval() {},
  });
  const [firstRuntime, secondRuntime] = await Promise.all([bootstrap.begin(), bootstrap.begin()]);
  assert.equal(firstRuntime, secondRuntime);
  assert.equal(installs, 1);
  assert.equal(bootstrap.getState().phase, "READY");
  firstRuntime.dispose();

  const compatibilityRepository = new MemoryRepository();
  const compatibilityLeader = new LeaderCoordinator({ repository: compatibilityRepository, locks: new FakeLockManager(), clock });
  const compatibilityController = new SessionControlController({ repository: compatibilityRepository, leader: compatibilityLeader, clock, ownerTabId: TAB_A, idFactory: () => "7".repeat(32), rolloutStage: "ACTIVE_DDA" });
  const compatibilityStorage = new FakeGmStorage();
  const negotiated = [];
  const compatibilityRuntime = createSessionControlRuntime({
    controller: compatibilityController,
    storagePort: new GmStoragePort(compatibilityStorage.getValue.bind(compatibilityStorage), compatibilityStorage.setValue.bind(compatibilityStorage)),
    repository: compatibilityRepository,
    clock,
    rollout: { schemaVersion: 1, stage: "ACTIVE_DDA" },
    observeStartContext: async () => ({
      accountKey: "compatibility-account",
      context: "chesscom-queue-sidebar-start-game-v1",
      pool: "chesscom-live-rapid-v1",
      intendedQueueScaleId: "chesscom-live-rapid-v1",
      calibrationReadiness: compatibilityReadiness(clock, "chesscom-live-rapid-v1"),
    }),
    onMode: (mode) => negotiated.push(mode),
    setInterval: () => 1,
    clearInterval() {},
  });
  await compatibilityRuntime.start(config());
  assert.equal(compatibilityController.snapshot.phase, "QUEUEING");
  assert.equal(compatibilityController.executionMode, "COMPATIBILITY");
  assert.equal(compatibilityController.snapshot.executionMode, "COMPATIBILITY");
  assert.equal(compatibilityController.snapshot.executionReasonCode, "DDA_MAPPING_UNAVAILABLE");
  assert.equal(compatibilityController.legacyAutoAdjustSuspended(), false);
  assert.equal(negotiated[0].warningCode, "DDA_MAPPING_UNAVAILABLE");
  const admittedCompatibility = await compatibilityController.observeCompatibilityGame({
    schemaVersion: 1,
    canonicalPlatformGameId: "compat-game",
    accountKey: "compatibility-account",
    opponentKey: "compat-opponent",
    opponentRating: 1700,
    opponentRatingScaleId: "chesscom-live-rapid-v1",
    userSide: "white",
    contextClass: "chesscom-live-game-v1",
    poolId: "chesscom-live-rapid-v1",
    rated: true,
    observedAtEpochMs: clock.now(),
    sourceVersion: "test-v1",
  });
  assert.equal(admittedCompatibility.allowed, true);
  assert.equal(compatibilityController.snapshot.phase, "IN_GAME");
  const compatibilityResult = { canonicalPlatformGameId: "compat-game", accountKey: "compatibility-account", outcome: "D" };
  assert.equal((await compatibilityController.observeCompatibilityResult(compatibilityResult)).reason, "RESULT_COMMITTED");
  assert.equal(compatibilityController.snapshot.observedCounts.draws, 1);
  assert.equal(compatibilityController.snapshot.controlCounts.terminalGames, 0);
  assert.equal((await compatibilityController.observeCompatibilityResult(compatibilityResult)).reason, "COMPATIBILITY_SESSION_INACTIVE");
  assert.equal(compatibilityController.snapshot.observedCounts.draws, 1);
  const recoveredCompatibilityController = new SessionControlController({ repository: compatibilityRepository, leader: compatibilityLeader, clock, ownerTabId: TAB_A, idFactory: () => "6".repeat(32), rolloutStage: "ACTIVE_DDA" });
  const recoveredCompatibilityRuntime = createSessionControlRuntime({ controller: recoveredCompatibilityController, storagePort: new GmStoragePort(compatibilityStorage.getValue.bind(compatibilityStorage), compatibilityStorage.setValue.bind(compatibilityStorage)), repository: compatibilityRepository, clock, rollout: { schemaVersion: 1, stage: "ACTIVE_DDA" }, observeStartContext: async () => { throw new Error("not used"); }, setInterval: () => 1, clearInterval() {} });
  await recoveredCompatibilityRuntime.recover("compatibility-account");
  assert.equal(recoveredCompatibilityController.executionMode, "COMPATIBILITY");
  assert.equal(recoveredCompatibilityController.snapshot.executionReasonCode, "DDA_MAPPING_UNAVAILABLE");
  recoveredCompatibilityRuntime.dispose();
  compatibilityRuntime.dispose();
}

module.exports = { run };
