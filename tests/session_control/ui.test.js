"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { createSessionControlPresenter, phaseLabel, successLabel, warningLabel } = require("../../frontend/session_control");

class FakeElement {
  constructor(id, attributes) {
    this.id = id || "";
    this.value = "";
    this.textContent = "";
    this.parentNode = null;
    this.children = [];
    this.attributes = new Map(Object.entries(attributes || {}));
    this.listeners = new Map();
  }

  append(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  querySelector(selector) {
    if (selector.startsWith("#")) return this.find((node) => node.id === selector.slice(1));
    const match = /^\[data-action="([^"]+)"\]$/.exec(selector);
    if (match) return this.find((node) => node.getAttribute("data-action") === match[1]);
    return null;
  }

  find(predicate) {
    if (predicate(this)) return this;
    for (const child of this.children) {
      const found = child.find(predicate);
      if (found) return found;
    }
    return null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  toggleAttribute(name, force) {
    if (force) this.setAttribute(name, "");
    else this.removeAttribute(name);
  }

  focus() {
    this.focused = true;
  }

  addEventListener(type, listener, options) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    const entries = this.listeners.get(type);
    entries.add(listener);
    if (options && options.signal) options.signal.addEventListener("abort", () => entries.delete(listener), { once: true });
  }

  dispatch(type, target) {
    const event = {
      target: target || this,
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
    };
    for (const listener of Array.from(this.listeners.get(type) || [])) listener(event);
    return event;
  }
}

function createPanel() {
  const panel = new FakeElement("kb-session-panel");
  for (const [id, value] of [["kb-session-duration", "120"], ["kb-session-min-rate", "75"], ["kb-session-max-rate", "82"]]) {
    const input = panel.append(new FakeElement(id));
    input.value = value;
  }
  for (const [id, action] of [["kb-session-start", "start"], ["kb-session-stop", "stop"], ["kb-session-export", "export"]]) panel.append(new FakeElement(id, { "data-action": action, disabled: "" }));
  for (const id of ["kb-session-phase", "kb-session-ttl", "kb-session-observed", "kb-session-raw", "kb-session-warning"]) panel.append(new FakeElement(id));
  return panel;
}

function status(overrides) {
  return {
    rolloutStage: "SHADOW",
    phase: "IDLE",
    role: "LEADER",
    remainingTtlMs: 120000,
    drainDeadlineEpochMs: null,
    drainRemainingMs: null,
    observedCounts: { wins: 0, draws: 0, losses: 0, terminalGames: 0 },
    controlCounts: { wins: 0, draws: 0, losses: 0, terminalGames: 0 },
    rawWinRate: 0,
    posteriorWinRate: 50,
    minWinRate: 75,
    maxWinRate: 82,
    controllerMode: "BOOST",
    offsetElo: 200,
    opponentRating: null,
    effectiveTargetElo: null,
    targetSaturated: false,
    warningCode: null,
    ...(overrides || {}),
  };
}

function tick() {
  return new Promise((resolve) => setImmediate(resolve));
}

function sourceHash(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `reference block missing: ${startMarker}`);
  return crypto.createHash("sha256").update(source.slice(start, end)).digest("hex");
}

function sourceBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `source block missing: ${startMarker}`);
  return source.slice(start, end);
}

async function run() {
  assert.deepEqual([
    "IDLE", "QUEUEING", "IN_GAME", "DRAINING", "PAUSED_QUEUEING", "PAUSED_ACTIVE", "COMPLETED", "ABORTED",
  ].map(phaseLabel), [
    "Idle", "Searching...", "Playing...", "Finishing session...", "Paused", "Paused", "Completed", "Stopped",
  ]);
  assert.equal(phaseLabel("UNKNOWN"), "Updating...");
  assert.equal(phaseLabel("toString"), "Updating...");
  assert.equal(warningLabel("CALIBRATION_UNAVAILABLE"), "⚠️ Calibration unavailable");
  assert.equal(warningLabel("CALIBRATION_EXPIRED"), "⚠️ Calibration unavailable");
  assert.equal(warningLabel("DDA_MAPPING_UNAVAILABLE"), "⚠️ Check calibration artifact");
  assert.equal(warningLabel("ARTIFACT_CHECKSUM_MISMATCH"), "⚠️ Check calibration artifact");
  assert.equal(warningLabel("STATUS_UNAVAILABLE"), "⚠️ Unable to update session");
  assert.equal(warningLabel(null), "");
  assert.equal(successLabel("SESSION_STARTED"), "Session started");
  assert.equal(successLabel("DRAINING"), "Finishing session...");
  assert.equal(successLabel("SESSION_STOPPED"), "Session finished");
  assert.equal(successLabel("UNKNOWN"), "Operation completed");
  let panel = createPanel();
  let currentStatus = status();
  let starts = 0;
  let stops = 0;
  let exports = 0;
  let startBlocker = null;
  const warnings = [];
  const notifications = [];
  const presenter = createSessionControlPresenter({
    getPanel: () => panel,
    readStatus: () => currentStatus,
    readStartBlocker: () => startBlocker,
    formatDuration: (value) => String(value),
    createConfig: (draft) => ({ ...draft }),
    start: async () => { starts += 1; },
    stop: async () => { stops += 1; return { allowed: true, reason: "DRAINING" }; },
    setWarning: (code) => warnings.push(code),
    notify: (code) => notifications.push(code),
    exportDiagnostic: () => ({ ok: true }),
    downloadDiagnostic: () => { exports += 1; },
  });

  presenter.update();
  assert.equal(panel.querySelector("#kb-session-phase").textContent, "Idle");
  assert.equal(panel.querySelector("#kb-session-ttl").textContent, "120000");
  assert.equal(panel.querySelector("#kb-session-observed").textContent, "0 W | 0 D | 0 L");
  assert.equal(panel.querySelector("#kb-session-raw").textContent, "—");
  assert.equal(panel.getAttribute("data-session-state"), "never-started");
  assert.equal(panel.getAttribute("data-session-history"), "none");
  currentStatus = status({
    phase: "QUEUEING",
    observedCounts: { wins: 12, draws: 1, losses: 2, terminalGames: 15 },
    controlCounts: { wins: 12, draws: 1, losses: 2, terminalGames: 15 },
    rawWinRate: 80.49,
  });
  presenter.update();
  assert.equal(panel.querySelector("#kb-session-phase").textContent, "Searching...");
  assert.equal(panel.querySelector("#kb-session-observed").textContent, "12 W | 1 D | 2 L");
  assert.equal(panel.querySelector("#kb-session-raw").textContent, "80%");
  currentStatus = status({ observedCounts: { wins: 1, draws: 0, losses: 0, terminalGames: 1 }, rawWinRate: 100 });
  presenter.update();
  assert.equal(panel.querySelector("#kb-session-raw").textContent, "—", "raw win rate used observed rather than control samples");
  for (const [phase, label] of [["DRAINING", "Finishing session..."], ["PAUSED_ACTIVE", "Paused"], ["COMPLETED", "Completed"], ["ABORTED", "Stopped"]]) {
    currentStatus = status({ phase });
    presenter.update();
    assert.equal(panel.querySelector("#kb-session-phase").textContent, label);
  }
  assert.equal(panel.getAttribute("data-session-state"), "aborted");
  assert.equal(panel.getAttribute("data-session-history"), "present");
  currentStatus = status();
  presenter.update();
  const duration = panel.querySelector("#kb-session-duration");
  duration.focus();
  duration.value = "240";
  panel.dispatch("input", duration);
  assert.equal(presenter.readDraft().durationMinutes, "240");
  assert.equal(starts, 0);
  presenter.update();
  assert.equal(duration.focused, true, "status rendering removed input focus");
  assert.equal(duration.value, "240", "status rendering overwrote the focused draft");
  assert.equal(panel.querySelector("#kb-session-start").getAttribute("disabled"), null);
  assert.equal(panel.querySelector("#kb-session-start").getAttribute("aria-disabled"), "false");

  startBlocker = "BOT_DISABLED";
  presenter.update();
  panel.dispatch("click", panel.querySelector("#kb-session-start"));
  await tick();
  assert.equal(starts, 0);
  assert.equal(panel.querySelector("#kb-session-start").hasAttribute?.("disabled") ?? panel.querySelector("#kb-session-start").getAttribute("disabled") !== null, true);
  assert.equal(panel.querySelector("#kb-session-start").getAttribute("data-disabled-reason"), "BOT_DISABLED");
  assert.equal(panel.querySelector("#kb-session-start").getAttribute("title"), null);
  assert(!notifications.includes("⚠️ Unable to update session"));
  startBlocker = null;
  presenter.update();

  presenter.bind(panel);
  presenter.bind(panel);
  panel.dispatch("click", panel.querySelector("#kb-session-start"));
  await tick();
  assert.equal(starts, 1, "START dispatched more than once after repeated binding");

  currentStatus = status({ phase: "IN_GAME" });
  presenter.update();
  presenter.bind(panel);
  panel.dispatch("click", panel.querySelector("#kb-session-stop"));
  await tick();
  assert.equal(stops, 1, "DRAIN dispatched more than once after repeated binding");
  assert(notifications.includes("Finishing session..."));

  currentStatus = status({ rolloutStage: "DISABLED", phase: "IDLE", warningCode: "ROLLOUT_DISABLED" });
  presenter.update();
  const start = panel.querySelector("#kb-session-start");
  const blockedEvent = panel.dispatch("click", start);
  await tick();
  assert.equal(starts, 1);
  assert.equal(blockedEvent.defaultPrevented, true);
  assert.equal(start.getAttribute("aria-disabled"), "true");
  assert.equal(start.getAttribute("data-disabled-reason"), "ROLLOUT_DISABLED");
  assert.equal(start.getAttribute("title"), null);
  assert.equal(panel.querySelector("#kb-session-warning").textContent, "");
  assert(!warnings.includes("ROLLOUT_DISABLED"));
  assert(!notifications.includes("⚠️ Unable to update session"));

  panel.dispatch("click", panel.querySelector("#kb-session-export"));
  assert.equal(exports, 1);

  const oldPanel = panel;
  panel = createPanel();
  currentStatus = status();
  presenter.update();
  assert.equal(panel.querySelector("#kb-session-duration").value, "240", "draft was lost during panel replacement");
  oldPanel.dispatch("click", oldPanel.querySelector("#kb-session-start"));
  await tick();
  assert.equal(starts, 1, "aborted panel retained a live listener");
  panel.dispatch("click", panel.querySelector("#kb-session-start"));
  await tick();
  assert.equal(starts, 2, "replacement panel was not rebound");

  const root = path.resolve(__dirname, "../..");
  const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const menu = sourceBlock(source, "    const menuHtml = `", "    const bannerHtml = `");
  for (const [label, id] of [["Time Left", "kb-session-ttl"], ["Status", "kb-session-phase"], ["Score", "kb-session-observed"], ["Win Rate", "kb-session-raw"]]) {
    assert(menu.includes(`>${label}`), `Auto Play menu is missing ${label}`);
    assert(menu.includes(`id="${id}"`), `Auto Play menu is missing ${id}`);
  }
  for (const id of ["kb-session-rollout", "kb-session-role", "kb-session-drain", "kb-session-control", "kb-session-posterior", "kb-session-band", "kb-session-dda", "kb-session-target"]) {
    assert(!menu.includes(`id="${id}"`), `Session Control menu retained advanced field ${id}`);
  }
  assert(menu.includes('id="kb-advanced-settings-toggle"'), "advanced settings control is missing");
  assert(menu.includes('<span>Configure</span><span class="kb-advanced-chevron"'), "advanced settings control is not discoverable");
  assert(menu.includes('<h3 id="kb-auto-play-title">Auto Play</h3>'), "Auto Play heading is missing");
  assert(menu.includes('aria-labelledby="kb-auto-play-title"'), "Auto Play section is missing its accessible heading relationship");
  assert(!menu.includes('<span>Session Control</span>'), "legacy Session Control heading is still visible");
  assert(menu.includes('aria-controls="advanced-settings-panel" aria-expanded="false"'), "advanced settings gear is missing its collapsed ARIA contract");
  assert(menu.includes('id="advanced-settings-panel" data-open="false" aria-hidden="true" inert'), "advanced settings panel is not inert and collapsed by default");
  const advancedMarkup = sourceBlock(menu, '          <div class="kb-advanced-settings"', '          <div class="kb-session-actions">');
  for (const id of ["kb-session-duration", "kb-session-min-rate", "kb-session-max-rate"]) {
    assert(advancedMarkup.includes(`id="${id}"`), `advanced settings panel is missing ${id}`);
  }
  assert(!advancedMarkup.includes('id="auto-delay-section"'), "Run Delay is incorrectly nested under Auto Play advanced settings");
  const autoMovesIndex = menu.indexOf('name="kb-auto-move"');
  const runDelayIndex = menu.indexOf('id="auto-delay-section"');
  const autoQueueIndex = menu.indexOf('name="kb-auto-queue"');
  assert(autoMovesIndex >= 0 && runDelayIndex > autoMovesIndex && autoQueueIndex > runDelayIndex, "Run Delay is not positioned with the primary Auto Moves controls");
  assert(menu.includes('aria-label="Minimum move delay in seconds"'));
  assert(menu.includes('aria-label="Maximum move delay in seconds"'));
  assert(menu.includes('role="group" aria-labelledby="kb-run-delay-label"'));
  assert(menu.includes('class="kb-delay-input"'));
  assert(menu.includes('class="kb-delay-unit" aria-hidden="true">s</span>'));
  assert(menu.includes('id="kb-move-timing-toggle"') && menu.includes('aria-controls="kb-move-timing-panel" aria-expanded="false"'), "Move Timing disclosure is missing");
  assert(menu.includes('id="kb-move-timing-panel" data-open="false" aria-hidden="true" inert'), "Move Timing is not collapsed and inert by default");
  assert(menu.includes('for="dm-rand">Random</label>') && menu.includes('for="dm-max">Immediate</label>'), "Move Timing modes are abbreviated");
  assert(!menu.includes('>RND<') && !menu.includes('>IMED.<'), "ambiguous Move Timing abbreviations remain");
  assert(!menu.includes('id="kb-session-warning"'), "obsolete inline session warning is still rendered");
  assert(menu.includes('id="kb-workspace-launcher"'));
  assert(menu.includes('<span class="kb-logo-copy">Thinker Chess</span>'));
  assert(!menu.includes('<div class="kb-logo">K</div>'));
  assert(source.includes("background-image:none !important"), "decorative panel gradients were not removed");
  assert(source.includes(".kb-session-primary"), "Auto Play primary summary is missing");
  assert(source.includes(".kb-session-stats"), "Auto Play stats summary is missing");
  const scoutStatusMarkup = sourceBlock(source, "    renderStatus(state) {", "    renderLoading() {");
  assert(!scoutStatusMarkup.includes('class="tc-scout-radar"'), "Scout empty state retained an oversized decorative radar");
  assert(source.includes('class="tc-scout-loading"'), "Scout loading state lost its centered premium layout");
  assert(source.includes('class="tc-scout-skeleton" aria-hidden="true"'), "Scout loading state lost its translucent skeletons");
  assert(source.includes('retry.className = "tc-scout-retry"'), "Scout unavailable retry is not styled by the shared premium system");
  assert(source.includes('panel.querySelector(".tc-scout-empty")?.appendChild(retry)'), "Scout unavailable retry is outside the centered empty state");
  assert(source.includes("@media (max-width: 848px)"), "workspace lacks a narrow-viewport layout");
  assert(source.includes("width: 154px !important;\n          max-width: 154px !important"), "workspace launcher lost its compact branded width");
  assert(source.includes("setThinkerWorkspaceCollapsed(true)"), "panel close does not collapse the complete workspace");
  assert(source.includes("setThinkerWorkspaceCollapsed(false)"), "workspace launcher does not restore the complete workspace");
  assert(source.includes('#krypbot-container .kb-session-button[data-action="start"]'), "START lacks a dedicated primary-action style");
  assert(source.includes('panel.toggleAttribute("inert", !open)'), "advanced disclosure does not synchronize focus isolation");
  assert(source.includes("@media (prefers-reduced-motion: reduce)"), "advanced disclosure ignores reduced-motion preferences");
  assert(source.includes('source?.closest?.("#kb-session-panel")'), "advanced disclosure is not scoped to its owning Session Control panel");
  assert(!menu.includes("SESSION_RUNTIME_UNAVAILABLE"), "Session Control menu exposes a raw startup reason code");
  assert(menu.includes("Auto Moves") && menu.includes("Move Timing") && menu.includes("Auto Queue"), "primary controls are not English consistently");
  assert(menu.includes("CHESS ASSISTANT") && menu.includes("Puzzle Mode") && menu.includes("Hint Lines") && menu.includes("Auto Solve"), "secondary controls are not English consistently");
  assert(menu.includes('id="kb-run-delay-hint"'), "Auto Move dependency hint is missing");
  assert(menu.includes("Win Rate") && menu.includes(">—</strong>"), "zero-sample win rate display regressed");
  assert(menu.includes('id="kb-more-settings-toggle"') && menu.includes('aria-controls="kb-more-settings-panel" aria-expanded="false"'), "More Settings disclosure is missing");
  assert(menu.includes('id="kb-more-settings-panel" data-open="false" aria-hidden="true" inert'), "More Settings is not collapsed and inert by default");
  assert(menu.includes('id="kb-session-export"') && menu.includes('aria-label="Export session diagnostic">Export</button>'), "Export action remains icon-only or ambiguous");
  assert(menu.includes('id="kb-strength-label">Strength Level') && menu.includes('Current <strong id="kb-elo-val">'), "Strength current value is not explicit");
  assert(menu.includes('type="range" min="800" max="3200"') && menu.includes('<span>Min 800</span><span>Max 3200</span>'), "Strength bounds are not explicit");
  for (const forbidden of ["Assistente de Xadrez", "Jogadas automáticas", "Ritmo de jogada", "Nível de força", "Mais ajustes", "Aguardando", "Concluído", "Iniciar", "Finalizar", "Configurar", "Taxa de vitória", "Tema", "Scout do Oponente"]) {
    assert(!menu.includes(forbidden), `Portuguese UI text remains: ${forbidden}`);
  }
  assert(source.includes('grid.className = "kb-console-grid"'), "reference console grid is not assembled");
  assert(source.includes('const core = module("Core", "kb-core-module")'), "Core module is missing");
  assert(source.includes('const visuals = module("Visuals", "kb-visuals-module")'), "Visuals module is missing");
  assert(source.includes('const engine = module("Engine Control", "kb-engine-module")'), "Engine Control module is missing");
  assert(source.includes('[bot, autoMoves, autoQueue, queueNote]'), "Core controls are not grouped together");
  assert(source.includes('[autoRating, strength, timing, smartPacing, puzzle]'), "Engine controls are not grouped together");
  assert(source.includes("width:568px !important; max-width:568px !important"), "compact two-column console width is missing");
  assert(source.includes("border:0 !important; border-radius:0 !important"), "embedded console shell is not visually removed");
  assert(source.includes("backdrop-filter:none !important"), "glass blur is not neutralized");
  assert(source.includes("grid-template-columns:minmax(0,1fr) minmax(0,1fr)"), "desktop console is not two-column");
  assert(source.includes("text-transform:uppercase"), "compact uppercase module captions are missing");
  assert(source.includes("width:30px; height:16px"), "compact switch geometry is missing");
  const wrapperCss = sourceBlock(source, "        #oi-wrapper {", "        #oi-wrapper > * {");
  for (const declaration of [
    "position: absolute !important",
    "top: calc(100vh + 32px) !important",
    "left: 10px !important",
    "width: max-content !important",
    "display: flex !important",
    "align-items: flex-start !important",
    "gap: 12px !important",
    "z-index: 2147483647 !important",
    "pointer-events: none !important",
  ]) assert(wrapperCss.includes(declaration), `workspace wrapper is missing ${declaration}`);
  for (const property of ["bottom", "max-height", "overflow"]) assert(!new RegExp(`^\\s*${property}\\s*:`, "m").test(wrapperCss), `workspace wrapper retained ${property}`);
  assert(!wrapperCss.includes("position: fixed"));
  const childCss = sourceBlock(source, "        #oi-wrapper > * {", "        #krypbot-container {");
  assert(childCss.includes("pointer-events: auto !important"));
  const workspaceLayout = sourceBlock(source, "        function updateWorkspaceLayout() {", "        scheduleThinkerWorkspaceLayout = () => {");
  assert(workspaceLayout.includes("document.body.appendChild(wrapper)"));
  assert(workspaceLayout.includes("setProperty(\"top\""));
  assert(workspaceLayout.includes("setProperty(\"left\""));
  assert(/document\.body\.appendChild\(wrapper\);\r?\n\s+if \(!document\.getElementById\("krypbot-container"\)\) wrapper\.insertAdjacentHTML/.test(source));
}

module.exports = { run };
