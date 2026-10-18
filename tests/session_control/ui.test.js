"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { createSessionControlPresenter } = require("../../frontend/session_control");

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
  for (const id of ["kb-session-rollout", "kb-session-phase", "kb-session-role", "kb-session-ttl", "kb-session-drain", "kb-session-observed", "kb-session-control", "kb-session-raw", "kb-session-posterior", "kb-session-band", "kb-session-dda", "kb-session-target", "kb-session-warning"]) panel.append(new FakeElement(id));
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
    observedCounts: { wins: 0, draws: 0, losses: 0 },
    controlCounts: { wins: 0, draws: 0, losses: 0 },
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
  let panel = createPanel();
  let currentStatus = status();
  let starts = 0;
  let stops = 0;
  let exports = 0;
  const warnings = [];
  const presenter = createSessionControlPresenter({
    getPanel: () => panel,
    readStatus: () => currentStatus,
    formatDuration: (value) => String(value),
    createConfig: (draft) => ({ ...draft }),
    start: async () => { starts += 1; },
    stop: async () => { stops += 1; },
    setWarning: (code) => warnings.push(code),
    exportDiagnostic: () => ({ ok: true }),
    downloadDiagnostic: () => { exports += 1; },
  });

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

  currentStatus = status({ rolloutStage: "DISABLED", phase: "IDLE", warningCode: "ROLLOUT_DISABLED" });
  presenter.update();
  const start = panel.querySelector("#kb-session-start");
  const blockedEvent = panel.dispatch("click", start);
  await tick();
  assert.equal(starts, 1);
  assert.equal(blockedEvent.defaultPrevented, true);
  assert.equal(start.getAttribute("aria-disabled"), "true");
  assert.equal(start.getAttribute("data-disabled-reason"), "ROLLOUT_DISABLED");
  assert.equal(panel.querySelector("#kb-session-warning").textContent, "ROLLOUT_DISABLED");
  assert(warnings.includes("ROLLOUT_DISABLED"));

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
  assert.equal(sourceHash(source, "    const menuHtml = `", "    const bannerHtml = `"), "d11d71f664734c1d49e45cef55a425872c12711719057a702ffa76856c0214c1", "TC159 menuHtml changed");
  const wrapperCss = sourceBlock(source, "        #oi-wrapper {", "        #oi-wrapper > * {");
  for (const declaration of [
    "position: absolute !important",
    "top: calc(100vh + 32px) !important",
    "left: 10px !important",
    "width: max-content !important",
    "display: flex !important",
    "align-items: flex-start !important",
    "gap: 10px !important",
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
