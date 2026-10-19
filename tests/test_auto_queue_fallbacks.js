"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const scriptPath = path.join(__dirname, "..", "script.js");
const source = fs.readFileSync(scriptPath, "utf8");
const start = source.indexOf("  // --- AUTO QUEUE (detecção resiliente de fim de jogo) ---");
const end = source.indexOf("\n  function startGameOverObserver()", start);
assert(start >= 0 && end > start, "auto queue logic block not found");
const autoQueueSource = source.slice(start, end);

class FakeElement {
  constructor({ tag = "div", text = "", attributes = {}, selectors = [], visible = true, rect = null } = {}) {
    this.tagName = tag.toUpperCase();
    this.innerText = text;
    this.textContent = text;
    this.attributes = { ...attributes };
    this.selectors = new Set(selectors);
    this.visible = visible;
    this.disabled = Boolean(attributes.disabled);
    this.isConnected = true;
    this.parentElement = null;
    this.children = [];
    this.clickCount = 0;
    this.dispatchCount = 0;
    this.shadowRoot = null;
    this.rect = rect || { left: 0, top: 0, width: 100, height: 40, right: 100, bottom: 40 };
  }

  append(...children) {
    for (const child of children) {
      child.parentElement = this;
      child.isConnected = true;
      this.children.push(child);
    }
    return this;
  }

  replace(oldChild, newChild) {
    const index = this.children.indexOf(oldChild);
    assert(index >= 0, "old child must exist");
    oldChild.isConnected = false;
    oldChild.parentElement = null;
    newChild.parentElement = this;
    newChild.isConnected = true;
    this.children[index] = newChild;
  }

  descendants() {
    const out = [];
    const pending = [...this.children];
    while (pending.length) {
      const node = pending.shift();
      out.push(node);
      pending.push(...node.children);
    }
    return out;
  }

  matches(selector) {
    if (selector === "*") return true;
    if (this.selectors.has(selector)) return true;
    if (selector === "button") return this.tagName === "BUTTON";
    if (selector === "a[href]") return this.tagName === "A" && this.getAttribute("href") !== null;
    if (selector === '[role="button"]') return this.getAttribute("role") === "button";
    if (selector === "nav") return this.tagName === "NAV";
    if (selector === "[class*='menu']") return /menu/i.test(this.getAttribute("class") || "");
    return false;
  }

  querySelectorAll(selector) {
    const selectors = selector.split(",").map((item) => item.trim());
    return this.descendants().filter((node) => selectors.some((item) => node.matches(item)));
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name)
      ? String(this.attributes[name])
      : null;
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (selector.includes("aria-disabled") && node.getAttribute("aria-disabled") === "true") return node;
      if (selector.includes("aria-hidden") && node.getAttribute("aria-hidden") === "true") return node;
      if (selector.includes("[disabled]") && node.getAttribute("disabled") !== null) return node;
      if (selector.includes("[hidden]") && node.getAttribute("hidden") !== null) return node;
      if (node.matches(selector)) return node;
      node = node.parentElement;
    }
    return null;
  }

  getBoundingClientRect() {
    return this.visible
      ? this.rect
      : { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
  }

  scrollIntoView() {}

  click() {
    this.clickCount += 1;
  }

  dispatchEvent() {
    this.dispatchCount += 1;
    return true;
  }
}

const selectors = {
  modal: '[data-cy="game-over-modal"]',
  newGame: 'button[data-cy="new-game-button"]',
  startGame: 'button[data-cy="start-game-button"]',
  playAgain: '[data-cy="play-again-button"]',
  sidebar: ".board-layout-sidebar",
};

function button({ text = "", selector, attributes = {}, visible = true, rect = null } = {}) {
  return new FakeElement({
    tag: "button",
    text,
    attributes,
    selectors: selector ? [selector] : [],
    visible,
    rect: rect || { left: 0, top: 160, width: 120, height: 40, right: 120, bottom: 200 },
  });
}

function createHarness(
  root,
  bridge = null,
  href = "https://www.chess.com/game/finished",
) {
  const timers = [];
  const sessionControlBridge = {
    effectiveAutoQueue: () => true,
    ownsQueue: () => false,
    queueGate: () => ({ allowed: true }),
    executeQueue: async (_enabled, action) => action(),
    ...(bridge || {}),
  };
  const context = {
    console,
    auto_queue: true,
    document: { documentElement: root },
    window: {
      location: { href },
      getComputedStyle(element) {
        return {
          visibility: element.visible ? "visible" : "hidden",
          display: element.visible ? "block" : "none",
          opacity: element.visible ? "1" : "0",
          pointerEvents: element.getAttribute("data-pointer-events") || "auto",
        };
      },
    },
    sessionControlBridge,
    get_cached_game: () => ({ game: { getFEN: () => "completed-fen" } }),
    log: () => {},
    MouseEvent: class MouseEvent {},
    setTimeout(callback, delay) {
      const timer = { callback, delay, cancelled: false };
      timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      if (timer) timer.cancelled = true;
    },
    Math: Object.create(Math),
  };
  context.Math.random = () => 0;
  vm.createContext(context);
  vm.runInContext(
    `${autoQueueSource}\n` +
      "globalThis.autoQueueTestApi = { resolveAutoQueueTarget, clickNewGame, resetAutoQueueTrigger, state: () => ({ queueTriggered, auto_queue_pending }) };",
    context,
  );
  return {
    api: context.autoQueueTestApi,
    timers,
    runNextTimer() {
      const timer = timers.find((candidate) => !candidate.cancelled && !candidate.ran);
      assert(timer, "expected a pending timer");
      timer.ran = true;
      timer.callback();
      return timer;
    },
  };
}

function modalFixture({ visible = true } = {}) {
  const action = button({ text: "New 3 min", selector: selectors.newGame });
  const modal = new FakeElement({
    text: "You Won New 3 min",
    selectors: [selectors.modal],
    visible,
  }).append(action);
  return { modal, action };
}

function sidebarFixture(action, text = "Game Review") {
  const sidebar = new FakeElement({ text, selectors: [selectors.sidebar] });
  if (text === "Game Review") {
    sidebar.append(
      button({
        text: "Game Review",
        rect: { left: 0, top: 100, width: 260, height: 40, right: 260, bottom: 140 },
      }),
    );
  }
  sidebar.append(action);
  return sidebar;
}

function lobbyFixture(...actions) {
  return new FakeElement({
    text: "3 min Blitz Start Game Custom Challenge Play a Friend Tournaments",
    selectors: [selectors.sidebar],
  }).append(...actions);
}

{
  const root = new FakeElement();
  const action = button({ text: "+ New Game", selector: selectors.newGame });
  root.append(sidebarFixture(action));
  let masterEnabled = true;
  const harness = createHarness(root, { effectiveAutoQueue: () => masterEnabled });
  harness.api.clickNewGame();
  masterEnabled = false;
  harness.runNextTimer();
  assert.strictEqual(action.clickCount, 0);
}

{
  const root = new FakeElement();
  const modal = modalFixture();
  const sidebarAction = button({ text: "+ New Game", selector: selectors.newGame });
  root.append(modal.modal, sidebarFixture(sidebarAction));
  const harness = createHarness(root);
  const resolved = harness.api.resolveAutoQueueTarget([root]);
  assert.strictEqual(resolved.source, "modal");
  assert.strictEqual(resolved.button, modal.action);
}

{
  const root = new FakeElement();
  const modal = modalFixture({ visible: false });
  const sidebarAction = button({ text: "+ New Game", selector: selectors.newGame });
  root.append(modal.modal, sidebarFixture(sidebarAction));
  const resolved = createHarness(root).api.resolveAutoQueueTarget([root]);
  assert.strictEqual(resolved.source, "sidebar-new-game");
  assert.strictEqual(resolved.button, sidebarAction);
}

{
  const root = new FakeElement();
  const review = button({ text: "Game Review" });
  const modal = new FakeElement({
    text: "You Lost Game Review",
    selectors: [selectors.modal],
  }).append(review);
  const sidebarAction = button({ text: "+ New Game", selector: selectors.newGame });
  root.append(modal, sidebarFixture(sidebarAction));
  const resolved = createHarness(root).api.resolveAutoQueueTarget([root]);
  assert.strictEqual(resolved.source, "sidebar-new-game");
  assert.strictEqual(resolved.button, sidebarAction);
}

{
  const root = new FakeElement();
  const startGame = button({ text: "Start Game", selector: selectors.startGame });
  const customChallenge = button({ text: "Custom Challenge" });
  const playFriend = button({ text: "Play a Friend" });
  const tournaments = button({ text: "Tournaments" });
  root.append(
    lobbyFixture(startGame, customChallenge, playFriend, tournaments),
  );
  const harness = createHarness(
    root,
    null,
    "https://www.chess.com/play/online",
  );
  const resolved = harness.api.resolveAutoQueueTarget([root]);
  assert.strictEqual(resolved.source, "sidebar-start-game");
  assert.strictEqual(resolved.button, startGame);
  harness.api.clickNewGame();
  harness.api.clickNewGame();
  harness.runNextTimer();
  harness.api.clickNewGame();
  assert.strictEqual(startGame.clickCount, 1);
  assert.strictEqual(customChallenge.clickCount, 0);
  assert.strictEqual(playFriend.clickCount, 0);
  assert.strictEqual(tournaments.clickCount, 0);
  assert.strictEqual(
    harness.timers.filter((timer) => !timer.cancelled && !timer.ran).length,
    0,
  );
}

{
  const root = new FakeElement();
  const customChallenge = button({ text: "Custom Challenge" });
  const playFriend = button({ text: "Play a Friend" });
  const tournaments = button({ text: "Tournaments" });
  root.append(lobbyFixture(customChallenge, playFriend, tournaments));
  assert.strictEqual(
    createHarness(root, null, "https://www.chess.com/play/online").api.resolveAutoQueueTarget([root]),
    null,
  );
}

for (const label of ["Iniciar partida", "Começar partida"]) {
  const root = new FakeElement();
  const localizedStart = button({ text: label });
  root.append(lobbyFixture(localizedStart));
  const resolved = createHarness(
    root,
    null,
    "https://www.chess.com/play/online",
  ).api.resolveAutoQueueTarget([root]);
  assert.strictEqual(resolved.source, "sidebar-start-game");
  assert.strictEqual(resolved.button, localizedStart);
}

{
  const root = new FakeElement();
  const plus = button({ text: "+" });
  root.append(sidebarFixture(plus));
  assert.strictEqual(createHarness(root).api.resolveAutoQueueTarget([root]), null);
}

{
  const root = new FakeElement();
  const plus = button({
    text: "",
    rect: { left: 0, top: 160, width: 120, height: 40, right: 120, bottom: 200 },
  });
  const rematch = button({
    text: "↻",
    selector: selectors.playAgain,
    attributes: {
      "aria-label": "Play Again",
      "data-control-view": "play-again",
    },
    rect: { left: 140, top: 160, width: 120, height: 40, right: 260, bottom: 200 },
  });
  const nextMove = button({
    text: "+",
    attributes: { "aria-label": "Next Move", class: "navigation-next-button" },
    rect: { left: 180, top: 230, width: 40, height: 40, right: 220, bottom: 270 },
  });
  const resumeAnalysis = button({
    text: "",
    attributes: {
      "aria-label": "Resume Analysis",
      class: "analysis-playback-button",
    },
    rect: { left: 125, top: 160, width: 10, height: 40, right: 135, bottom: 200 },
  });
  root.append(sidebarFixture(plus).append(rematch, nextMove, resumeAnalysis));
  const harness = createHarness(root);
  const resolved = harness.api.resolveAutoQueueTarget([root]);
  assert.strictEqual(resolved.source, "sidebar-plus");
  assert.strictEqual(resolved.button, plus);
  harness.api.clickNewGame();
  harness.runNextTimer();
  assert.strictEqual(plus.clickCount, 1);
  assert.strictEqual(rematch.clickCount, 0);
  assert.strictEqual(nextMove.clickCount, 0);
  assert.strictEqual(resumeAnalysis.clickCount, 0);
  assert.strictEqual(
    harness.timers.filter((timer) => !timer.cancelled && !timer.ran).length,
    0,
  );
}

{
  const signals = [
    { text: "Play Again" },
    { text: "Revanche" },
    { attributes: { "aria-label": "Rematch" } },
    { attributes: { title: "Jogar novamente" } },
    { attributes: { "data-cy": "play-again-button" } },
    { attributes: { "data-test-element": "rematch-button" } },
    { attributes: { "data-control-view": "play-again" } },
    { attributes: { class: "sidebar-reload-button" } },
  ];
  for (const signal of signals) {
    const root = new FakeElement();
    const rematch = button({
      text: signal.text || "↻",
      selector: selectors.playAgain,
      attributes: signal.attributes || {},
    });
    root.append(sidebarFixture(rematch));
    assert.strictEqual(createHarness(root).api.resolveAutoQueueTarget([root]), null);
  }
}

{
  const root = new FakeElement();
  const globalPlus = button({ text: "+" });
  const sidebarPlus = button({ text: "+" });
  root.append(globalPlus, sidebarFixture(sidebarPlus, "Current game"));
  assert.strictEqual(createHarness(root).api.resolveAutoQueueTarget([root]), null);
}

{
  const root = new FakeElement();
  const activeGameNewGame = button({
    text: "+ New Game",
    selector: selectors.newGame,
  });
  root.append(sidebarFixture(activeGameNewGame, "Current game"));
  assert.strictEqual(createHarness(root).api.resolveAutoQueueTarget([root]), null);
}

{
  const root = new FakeElement();
  const original = button({ text: "+ New Game", selector: selectors.newGame });
  const sidebar = sidebarFixture(original);
  root.append(sidebar);
  const harness = createHarness(root);
  harness.api.clickNewGame();
  const replacement = button({ text: "+ New Game", selector: selectors.newGame });
  sidebar.replace(original, replacement);
  harness.runNextTimer();
  assert.strictEqual(original.clickCount, 0);
  assert.strictEqual(replacement.clickCount, 1);
}

{
  const root = new FakeElement();
  const action = button({ text: "+ New Game", selector: selectors.newGame });
  root.append(sidebarFixture(action));
  const harness = createHarness(root);
  harness.api.clickNewGame();
  harness.api.clickNewGame();
  assert.strictEqual(harness.timers.filter((timer) => !timer.cancelled).length, 1);
  harness.runNextTimer();
  harness.api.clickNewGame();
  assert.strictEqual(action.clickCount, 1);
  assert.strictEqual(harness.api.state().queueTriggered, true);
}

{
  const root = new FakeElement();
  const disabled = button({
    text: "+ New Game",
    selector: selectors.newGame,
    attributes: { disabled: "" },
  });
  root.append(sidebarFixture(disabled));
  assert.strictEqual(createHarness(root).api.resolveAutoQueueTarget([root]), null);
}

{
  const rejected = [
    button({ text: "+ New Game", selector: selectors.newGame, visible: false }),
    button({
      text: "+ New Game",
      selector: selectors.newGame,
      attributes: { "data-pointer-events": "none" },
    }),
    button({ text: "Game Review", selector: selectors.newGame }),
  ];
  for (const candidate of rejected) {
    const root = new FakeElement();
    root.append(sidebarFixture(candidate));
    assert.strictEqual(createHarness(root).api.resolveAutoQueueTarget([root]), null);
  }
}

{
  const root = new FakeElement();
  const disconnected = button({ text: "+ New Game", selector: selectors.newGame });
  root.append(sidebarFixture(disconnected));
  disconnected.isConnected = false;
  assert.strictEqual(createHarness(root).api.resolveAutoQueueTarget([root]), null);
}

{
  const root = new FakeElement();
  const action = button({ text: "+ New Game", selector: selectors.newGame });
  root.append(sidebarFixture(action));
  const deniedBridge = {
    ownsQueue: () => true,
    queueGate: () => ({ allowed: false }),
    executeQueue: async () => {
      throw new Error("must not execute");
    },
  };
  const harness = createHarness(root, deniedBridge);
  harness.api.clickNewGame();
  assert.strictEqual(harness.timers.length, 0);
  assert.strictEqual(action.clickCount, 0);
}

{
  const root = new FakeElement();
  const action = button({ text: "+ New Game", selector: selectors.newGame });
  root.append(sidebarFixture(action));
  let executions = 0;
  const allowedBridge = {
    ownsQueue: () => true,
    queueGate: () => ({ allowed: true }),
    executeQueue: (_enabled, execute) => {
      executions += 1;
      execute();
      return { catch: () => {} };
    },
  };
  const harness = createHarness(root, allowedBridge);
  harness.api.clickNewGame();
  harness.api.clickNewGame();
  harness.runNextTimer();
  harness.api.clickNewGame();
  assert.strictEqual(executions, 1);
  assert.strictEqual(action.clickCount, 1);
}

assert(!/(#oi-wrapper|menuHtml|z-index\s*:|position\s*:|isolation\s*:)/.test(autoQueueSource));

console.log(
  "Auto Queue fallback tests passed: modal priority, rematch-anchored plus, Start Game stage, lobby decoys blocked, rematch blocked, next-move blocked, resume-analysis blocked, fail-closed guard, SPA reacquisition, single dispatch, queue gate",
);
