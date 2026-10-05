const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("script.js", "utf8");
const browserFixture = fs.readFileSync("tests/fixtures/userscript_bootstrap.html", "utf8");
for (const marker of [
  'width=1433',
  'height: 742px',
  'history.replaceState({}, "", "/play/online?',
  'class="play-controller-component stale-controller"',
  'class="play-controller-component" data-controller-generation=',
  'window.mountFixtureLayout',
  'window.replaceFixtureLayout',
  'fixtureParams.get("ghost")',
  'fixtureParams.get("mountError")',
  'fixtureParams.get("network")',
]) {
  if (!browserFixture.includes(marker)) throw new Error(`browser fixture is missing: ${marker}`);
}
if (
  browserFixture.indexOf('play-controller-component stale-controller') >
  browserFixture.indexOf('data-controller-generation=')
) {
  throw new Error("browser fixture no longer presents the hidden controller before the visible one");
}
const jqueryResolverStart = source.indexOf("  function resolveThinkerJQuery() {");
const jqueryResolverEnd = source.indexOf("  let $ = resolveThinkerJQuery();", jqueryResolverStart);
if (jqueryResolverStart < 0 || jqueryResolverEnd < 0) throw new Error("vendored jQuery resolver is missing");
const exportedJQuery = function () {};
exportedJQuery.fn = { jquery: "3.7.1" };
const resolvedJQuery = vm.runInNewContext(
  source.slice(jqueryResolverStart, jqueryResolverEnd) + "\nresolveThinkerJQuery()",
  { module: { exports: exportedJQuery }, window: {} },
);
if (resolvedJQuery !== exportedJQuery) throw new Error("CommonJS-exported jQuery cannot mount the userscript UI");
const nativeMountStart = source.indexOf("  function createMenu() {");
const nativeMountEnd = source.indexOf("  function removeAds() {", nativeMountStart);
if (nativeMountStart < 0 || nativeMountEnd < 0) throw new Error("native UI mount path is missing");
let mountCallback = null;
let mountedMenu = false;
let mountedBanner = false;
let bannerPositioned = false;
let shellReconcilerStarted = false;
const nativeMountContext = {
  document: {
    head: { insertAdjacentHTML() {} },
    body: { insertAdjacentHTML() { mountedBanner = true; } },
    getElementById(id) {
      if (id === "krypbot-container") return mountedMenu ? {} : null;
      if (id === "thinker-chess-banner") return mountedBanner ? {} : null;
      return null;
    },
  },
  getThinkerMountHost: () => ({ insertAdjacentHTML() { mountedMenu = true; } }),
  positionThinkerBannerShell: () => { bannerPositioned = true; },
  startThinkerUiReconciler: () => { shellReconcilerStarted = true; },
  ensureThinkerLauncher: () => ({}),
  clearThinkerMountFailure() {},
  applyGhostModeVisibility() {},
  failThinkerUiMount(error) { throw error; },
  resolveThinkerJQuery: () => null,
  setInterval: (callback) => { mountCallback = callback; return 1; },
};
vm.runInNewContext(
  "let thinkerUiBound=false, thinkerMountTimer=null, thinkerMenuNode=null, thinkerBannerNode=null, $=null;\n" +
    source.slice(nativeMountStart, nativeMountEnd) + "\nglobalThis.mount=createMenu;",
  nativeMountContext,
);
nativeMountContext.mount();
mountCallback();
if (!mountedMenu || !mountedBanner || !bannerPositioned || !shellReconcilerStarted) {
  throw new Error("panel and banner failed to mount when jQuery was unavailable");
}
const startupStart = source.indexOf("  function startThinkerUserscript() {");
const startupEnd = source.indexOf("  function maybeStartThinkerUserscript() {", startupStart);
if (startupStart < 0 || startupEnd < 0) throw new Error("userscript startup block is missing");
let recoveryCallback = null;
let createAttempts = 0;
let reconcileCount = 0;
let shellsPresent = false;
let shellWatchStarts = 0;
let backgroundIntervalStarts = 0;
const recoveryContext = {
  document: {
    body: {},
    getElementById: () => shellsPresent ? { style: { display: "flex" } } : null,
  },
  window: {
    setInterval: (callback) => {
      shellWatchStarts++;
      recoveryCallback = callback;
      return shellWatchStarts;
    },
    clearInterval() {},
  },
  setInterval: () => {
    backgroundIntervalStarts++;
    return backgroundIntervalStarts;
  },
  isThinkerSupportedRoute: () => true,
  ensureThinkerLauncher() {},
  positionThinkerLauncher() {},
  positionThinkerBannerShell() {},
  cleanupThinkerUiLifecycle() {},
  failThinkerUiMount(error) { throw error; },
  attemptThinkerUiMount: () => {
    createAttempts++;
    if (createAttempts === 1) return false;
    shellsPresent = true;
    recoveryContext.setUiBound?.(true);
    return true;
  },
  reconcileThinkerUiShells: () => { reconcileCount++; },
  positionThinkerBannerShell() {},
  removeAds() {},
  handleAutoQueue() {},
  pollExternalConfig() {},
};
vm.runInNewContext(
  "let thinkerUserscriptStarted=false, thinkerRouteWatchTimer=null, thinkerShellWatchTimer=null, thinkerShellMissingTicks=0, thinkerMountTimer=null, thinkerUiBound=false, _ghostModeActive=false;\n" +
    source.slice(startupStart, startupEnd) +
    "\nglobalThis.startUserscript=startThinkerUserscript; globalThis.setUiBound=(value)=>{ thinkerUiBound=value; }; startThinkerUserscript();",
  recoveryContext,
);
if (!recoveryCallback) throw new Error("UI recovery watchdog did not start after a mount failure");
const lifecycleCounts = [shellWatchStarts, backgroundIntervalStarts];
recoveryContext.startUserscript();
if (shellWatchStarts !== lifecycleCounts[0] || backgroundIntervalStarts !== lifecycleCounts[1]) {
  throw new Error("repeated userscript startup duplicated lifecycle intervals");
}
recoveryCallback();
if (!shellsPresent || createAttempts !== 2) throw new Error("UI did not recover from a transient mount failure");
recoveryCallback();
if (reconcileCount < 2) throw new Error("UI recovery watchdog stopped after the first successful mount");
const startupSource = source.slice(startupStart, startupEnd);
if (
  !/catch\s*\((?!_)\w+\)/.test(startupSource) ||
  !/(mount|shell).*(error|failure|diagnostic)|(error|failure|diagnostic).*(mount|shell)/is.test(startupSource) ||
  !/(mount|shell).{0,80}(dataset|title)|(dataset|title).{0,80}(mount|shell)/is.test(source)
) {
  throw new Error("mount failures are not retained as bounded internal control metadata");
}
for (const key of ["smartPacing", "evalBar", "kb-auto-adjust", "kb-auto-queue"]) {
  if (!source.includes(`localStorage.setItem("${key}", "false")`)) {
    throw new Error(`${key} was not reset to off for this version`);
  }
}
if (!source.includes('kb_default_off_v5')) throw new Error("new off-by-default migration is missing");
const storageStart = source.indexOf("  const localStorage = (() => {");
const storageEnd = source.indexOf("\n  function debug(", storageStart);
if (storageStart < 0 || storageEnd < 0) throw new Error("storage fallback block not found");
const blockedStorageWindow = {};
Object.defineProperty(blockedStorageWindow, "localStorage", { get() { throw new Error("blocked"); } });
const blockedStorage = vm.runInNewContext(
  source.slice(storageStart, storageEnd) + "\nlocalStorage.setItem('test', 'ok'); localStorage.getItem('test');",
  { window: blockedStorageWindow, Map },
);
if (blockedStorage !== "ok") throw new Error("blocked browser storage stopped userscript initialization");
const switchStart = source.indexOf('        const switchGroups = document.querySelectorAll(');
const switchEnd = source.indexOf('        // Add Minimize Logic', switchStart);
if (switchStart < 0 || switchEnd < 0) throw new Error("switch binding block not found");
const switchListeners = {};
const switchAttributes = {};
let switchChanges = 0;
let switchState = "off";
const onSwitch = { dispatchEvent: () => { switchChanges++; } };
const offSwitch = { dispatchEvent: () => { switchChanges++; } };
Object.defineProperty(onSwitch, "checked", {
  get: () => switchState === "on",
  set: (value) => { if (value) switchState = "on"; },
});
Object.defineProperty(offSwitch, "checked", {
  get: () => switchState === "off",
  set: (value) => { if (value) switchState = "off"; },
});
const switchGroup = {
  querySelector: (selector) =>
    selector.includes('delayMode') ? null : selector.includes('value="1"') ? onSwitch : offSwitch,
  setAttribute: (name, value) => { switchAttributes[name] = value; },
  addEventListener: (name, handler) => { switchListeners[name] = handler; },
};
vm.runInNewContext(source.slice(switchStart, switchEnd), {
  document: { querySelectorAll: () => [switchGroup] },
  Event: class { constructor(type) { this.type = type; } },
});
const switchClick = () => switchListeners.click({ preventDefault() {}, stopPropagation() {} });
switchClick();
if (!onSwitch.checked || switchChanges !== 1 || switchAttributes["aria-checked"] !== "true") {
  throw new Error("one click did not activate the switch");
}
switchClick();
if (!offSwitch.checked || switchChanges !== 2 || switchAttributes["aria-checked"] !== "false") {
  throw new Error("one click did not deactivate the switch");
}
switchListeners.keydown({ key: "Enter", preventDefault() {} });
if (!onSwitch.checked || switchChanges !== 3) throw new Error("switch keyboard activation failed");
const pollStart = source.indexOf("  let _lastExternalConfig = null;");
const pollEnd = source.indexOf("  let thinkerUserscriptStarted = false;", pollStart);
if (pollStart < 0 || pollEnd < 0) throw new Error("config polling block not found");
let capturedPoll = null;
const pollContext = {
  SERVER_URL: "http://127.0.0.1:5050",
  GM_xmlhttpRequest: (options) => { capturedPoll = options; },
  $: () => { throw new Error("stale response reached UI"); },
};
vm.createContext(pollContext);
vm.runInContext(
  source.slice(pollStart, pollEnd) +
    "\nglobalThis.pollConfig = pollExternalConfig;" +
    "\nglobalThis.markMenuReady = () => { _menuReady = true; };" +
    "\nglobalThis.markLocalChange = () => { _localConfigRevision++; _localConfigPending = true; };" +
    "\nglobalThis.clearLocalPending = () => { _localConfigPending = false; };",
  pollContext,
);
pollContext.pollConfig();
if (capturedPoll) throw new Error("config polled before menu was ready");
pollContext.markMenuReady();
pollContext.pollConfig();
if (!capturedPoll) throw new Error("ready menu did not poll config");
const stalePoll = capturedPoll;
pollContext.markLocalChange();
stalePoll.onload({ status: 200, responseText: '{"hint":false}' });
capturedPoll = null;
pollContext.pollConfig();
if (capturedPoll) throw new Error("config polled while local save was pending");
pollContext.clearLocalPending();
pollContext.pollConfig();
const racedPoll = capturedPoll;
pollContext.markLocalChange();
pollContext.clearLocalPending();
racedPoll.onload({ status: 200, responseText: '{"hint":false}' });
if (Buffer.byteLength(source, "utf8") > 400000) {
  throw new Error("userscript payload is too large for reliable Tampermonkey startup");
}
const start = source.indexOf("  const SCOUT_CACHE_TTL");
const end = source.indexOf("  // --- ESTADO DO AUTO RUN DELAY", start);
if (start < 0 || end < 0) throw new Error("OpponentIntel block not found");

const embeddedBanner = source.match(
  /<img src="data:image\/jpeg;base64,([^"]+)" alt="Thinker Chess"/,
);
if (!embeddedBanner) throw new Error("embedded Thinker Chess banner not found");
const embeddedBannerBytes = Buffer.from(embeddedBanner[1], "base64");
if (embeddedBannerBytes.length > 100000 || embeddedBannerBytes.length < 30000) {
  throw new Error("optimized embedded banner payload is outside the safe size range");
}
if (embeddedBannerBytes[0] !== 0xff || embeddedBannerBytes[1] !== 0xd8) {
  throw new Error("optimized embedded banner is not a JPEG image");
}
if (
  source.includes("// @require      https://code.jquery.com/jquery-3.7.1.min.js") ||
  !source.includes("TC_VENDORED_JQUERY_START") ||
  !source.includes("jQuery v3.7.1")
) {
  throw new Error("jQuery startup dependency was not vendored correctly");
}
if (
  !source.includes("// @match        https://www.chess.com/*") ||
  !source.includes("// @match        https://chess.com/*") ||
  !source.includes("// @noframes") ||
  !source.includes("function isThinkerSupportedRoute()") ||
  !source.includes("function maybeStartThinkerUserscript()") ||
  !source.includes("function installThinkerRouteBootstrap()") ||
  !source.includes("if (thinkerUserscriptStarted) return;") ||
  !source.includes("window.setInterval(maybeStartThinkerUserscript, 250)")
) {
  throw new Error("SPA-safe Tampermonkey bootstrap markers are missing");
}
if (
  !source.includes("taxa de vitórias") ||
  source.includes(">SCORE<") ||
  source.includes("% score")
) {
  throw new Error("Scout still exposes an ambiguous score label");
}
const reconcileSource = source.slice(
  source.indexOf("  function reconcileThinkerUiShells"),
  source.indexOf("  function startThinkerUiReconciler"),
);
if (
  source.includes('position:absolute;left:-9999px;top:0;z-index:50') ||
  !/(?:id=["']thinker-chess-launcher["']|launcher\.id\s*=\s*["']thinker-chess-launcher["'])/.test(source) ||
  !source.includes("scrollIntoView") ||
  !/thinker-chess-launcher[^`]+position:fixed[^`]+z-index:214748\d+/s.test(source) ||
  !source.includes("pointer-events:none") ||
  !/thinker-chess-banner[^`]+position:fixed[^`]+z-index:214748\d+/s.test(source) ||
  !source.includes("function calculateThinkerBannerLayout") ||
  !source.includes("function calculateThinkerWorkspaceMargin") ||
  !source.includes("grid-template-columns:268px 296px") ||
  !source.includes("margin-left:clamp(0px,calc(100% - 578px),44px)") ||
  !source.includes('container.style.width = "268px"') ||
  !source.includes(
    "OpponentIntel.ensureScoutWrapper();\n        scheduleThinkerWorkspaceLayout();\n        OpponentIntel.startObserver();",
  ) ||
  source.includes('addEventListener("scroll", scheduleThinkerBannerPosition') ||
  reconcileSource.includes("\n    scheduleThinkerBannerPosition();") ||
  !source.includes("object-fit:cover;object-position:center center")
) {
  throw new Error("viewport-safe banner, launcher, or workspace layout markers are missing");
}

const store = new Map();
const context = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  },
  setTimeout,
  clearTimeout,
  AbortController,
  fetch: () => Promise.reject(new Error("unused")),
  document: {
    querySelectorAll: () => [],
    getElementById: () => null,
    querySelector: () => null,
  },
  MutationObserver: class {
    disconnect() {}
    observe() {}
  },
  window: { location: { pathname: "/play/online" } },
  autoAdjust: { isEnabled: () => false },
};

vm.createContext(context);
vm.runInContext(
  source.slice(start, end) + "\nglobalThis.scout = OpponentIntel;",
  context,
);

const bannerLayoutStart = source.indexOf("  let scheduleThinkerBannerPosition");
const bannerLayoutEnd = source.indexOf("\n  function createMenu", bannerLayoutStart);
if (bannerLayoutStart < 0 || bannerLayoutEnd < 0) {
  throw new Error("banner layout function not found");
}
vm.runInContext(
  "let _ghostModeActive = false; const SERVER_URL = 'http://127.0.0.1:5050';\n" +
    source.slice(bannerLayoutStart, bannerLayoutEnd) +
    "\nglobalThis.calculateBannerLayout = calculateThinkerBannerLayout;" +
    "\nglobalThis.findMountHost = getThinkerMountHost;" +
    "\nglobalThis.findSidebar = findThinkerSidebar;" +
    "\nglobalThis.calculateWorkspaceMargin = calculateThinkerWorkspaceMargin;" +
    "\nglobalThis.reconcileShells = reconcileThinkerUiShells;" +
    "\nglobalThis.applyGhost = applyGhostModeVisibility;" +
    "\nglobalThis.startReconciler = startThinkerUiReconciler;" +
    "\nglobalThis.ensureLauncher = ensureThinkerLauncher;" +
    "\nglobalThis.positionLauncher = positionThinkerLauncher;" +
    "\nglobalThis.recordMountFailure = recordThinkerMountFailure;" +
    "\nglobalThis.clearMountFailure = clearThinkerMountFailure;" +
    "\nglobalThis.setShellNodes = (menu, banner, launcher) => { thinkerMenuNode = menu; thinkerBannerNode = banner; if (typeof thinkerLauncherNode !== 'undefined') thinkerLauncherNode = launcher; };",
  context,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const savedCreateElement = context.document.createElement;
const savedGetElementById = context.document.getElementById;
const savedEnsureScoutWrapper = context.scout.ensureScoutWrapper;
let renderedScoutPanel = null;
context.document.createElement = () => ({
  style: {},
  dataset: {},
  querySelector: () => ({ addEventListener() {} }),
  appendChild() {},
});
context.document.getElementById = () => null;
context.scout.ensureScoutWrapper = () => ({ wrapper: { appendChild: (panel) => { renderedScoutPanel = panel; } } });
context.scout.renderStatus("waiting");
assert(renderedScoutPanel?.dataset.state === "waiting", "waiting Scout card was not rendered");
assert(renderedScoutPanel.style.cssText.includes("display:flex;flex-direction:column"),
  "waiting Scout card did not isolate its content vertically");
assert(renderedScoutPanel.innerHTML.indexOf('class="tc-scout-head"') < renderedScoutPanel.innerHTML.indexOf('class="tc-scout-empty"') &&
  renderedScoutPanel.innerHTML.indexOf('class="tc-scout-empty"') < renderedScoutPanel.innerHTML.indexOf('class="tc-scout-status"') &&
  renderedScoutPanel.innerHTML.indexOf('class="tc-scout-status"') < renderedScoutPanel.innerHTML.indexOf('class="tc-scout-empty-detail"'),
  "waiting Scout header, status, and explanation are not separate blocks");
assert(renderedScoutPanel.innerHTML.includes("padding-top:16px") &&
  renderedScoutPanel.innerHTML.includes("gap:8px") &&
  renderedScoutPanel.innerHTML.includes("white-space:normal;overflow-wrap:anywhere"),
  "waiting Scout spacing or text wrapping regressed");
assert(renderedScoutPanel.innerHTML.includes('aria-label="Fechar Scout"'),
  "waiting Scout card has no close button in the header");

context.scout.lastOpponent = "rival";
context.scout.renderScout({
  lastPlayed: Date.now() / 1000,
  sampleSize: 50,
  wins: 19,
  draws: 1,
  losses: 30,
  winRate: 38,
  colors: {
    white: { games: 26, wins: 9, draws: 0, losses: 17, winRate: 35 },
    black: { games: 24, wins: 10, draws: 1, losses: 13, winRate: 42 },
  },
  timeClasses: [],
  openings: { white: [], black: [] },
});
const scoutColors = vm.runInContext("SCOUT_RESULT_COLORS", context);
const renderedChart = renderedScoutPanel.innerHTML.match(/class="tc-scout-donut" style="background:([^"]+)"/);
assert(renderedChart, "Scout W/D/L chart was not rendered");
for (const [result, marker] of [["win", "w"], ["draw", "e"], ["loss", "l"]]) {
  assert(renderedChart[1].includes(scoutColors[result]) &&
    renderedScoutPanel.innerHTML.includes(`class="${marker}" style="color:${scoutColors[result]}"`),
  `Scout ${result} chart segment and legend do not share the same color`);
}
assert(scoutColors.draw !== scoutColors.loss, "Scout draw and loss colors are indistinguishable");
assert(renderedChart[1].includes(`${scoutColors.win} 0% 38%`) &&
  renderedChart[1].includes(`${scoutColors.draw} 38% 40%`) &&
  renderedChart[1].includes(`${scoutColors.loss} 40% 100%`),
  "Scout chart segments do not reflect the 19W/1D/30L sample");
context.document.createElement = savedCreateElement;
context.document.getElementById = savedGetElementById;
context.scout.ensureScoutWrapper = savedEnsureScoutWrapper;

const wcBoardHost = { id: "wc-board-parent" };
const wcBoard = { closest: () => null, parentElement: wcBoardHost };
const savedQuerySelector = context.document.querySelector;
context.document.querySelector = (selector) => selector.includes("wc-chess-board") ? wcBoard : null;
assert(context.findMountHost() === wcBoardHost,
  "wc-chess-board-only Chess.com layout did not mount the configuration panel");
context.document.querySelector = () => null;
const fallbackMountBody = { id: "body" };
context.document.body = fallbackMountBody;
assert(context.findMountHost() === fallbackMountBody,
  "supported route without a recognized board left the entire UI unmounted");
context.document.querySelector = savedQuerySelector;

const boardForSidebar = {
  isConnected: true,
  getBoundingClientRect: () => ({ left: 227, top: 187, right: 867, bottom: 827, width: 640, height: 640 }),
};
const hiddenKnownSidebar = {
  isConnected: true,
  contains: () => false,
  getBoundingClientRect: () => ({ left: 875, top: 137, right: 875, bottom: 137, width: 0, height: 0 }),
};
const disconnectedKnownSidebar = {
  isConnected: false,
  contains: () => false,
  getBoundingClientRect: () => ({ left: 900, top: 137, right: 1248, bottom: 879, width: 348, height: 742 }),
};
const offViewportKnownSidebar = {
  isConnected: true,
  contains: () => false,
  getBoundingClientRect: () => ({ left: 1500, top: 137, right: 1848, bottom: 879, width: 348, height: 742 }),
};
const visibleKnownSidebar = {
  isConnected: true,
  contains: () => false,
  getBoundingClientRect: () => ({ left: 900, top: 137, right: 1248, bottom: 879, width: 348, height: 742 }),
};
const fallbackSidebar = {
  isConnected: true,
  contains: () => false,
  getBoundingClientRect: () => ({ left: 899, top: 133, right: 1248, bottom: 879, width: 349, height: 746 }),
};
context.document.querySelector = (selector) => selector.includes("wc-chess-board") ? boardForSidebar : null;
context.document.documentElement = { clientWidth: 1433, clientHeight: 895 };
context.window.innerWidth = 1433;
context.window.innerHeight = 895;
context.document.querySelectorAll = (selector) =>
  selector.includes(".play-controller-component")
    ? [hiddenKnownSidebar, disconnectedKnownSidebar, offViewportKnownSidebar, visibleKnownSidebar]
    : [fallbackSidebar];
assert(context.findSidebar() === visibleKnownSidebar,
  "hidden, disconnected, or off-viewport controller won over the visible controller");
context.document.querySelectorAll = () => [fallbackSidebar];
assert(context.findSidebar() === fallbackSidebar, "sidebar fallback missed the visible Chess.com controls");
context.document.querySelector = () => null;
context.document.querySelectorAll = () => [hiddenKnownSidebar, offViewportKnownSidebar];
assert(context.findSidebar() === null, "sidebar selection accepted only hidden or off-viewport controls");

const sidebarRect = { left: 788, top: 16, right: 1088, bottom: 704 };
const bannerLayout = context.calculateBannerLayout(sidebarRect, 1280, 720, false);
assert(
  bannerLayout &&
    bannerLayout.left === 1096 &&
    bannerLayout.top === 16 &&
    bannerLayout.width === 178 &&
    bannerLayout.height === 688,
  "full-height banner geometry is incorrect",
);
assert(
  context.calculateBannerLayout(sidebarRect, 1160, 720, false) === null,
  "banner was not hidden for an unsafe narrow slot",
);
assert(
  context.calculateBannerLayout(sidebarRect, 1280, 720, true) === null,
  "Ghost Mode did not suppress banner layout",
);
const reportedLayout = context.calculateBannerLayout(
  { left: 900, top: 137, right: 1248, bottom: 879 },
  1433,
  895,
  false,
);
assert(
  reportedLayout &&
    reportedLayout.left === 1256 &&
    reportedLayout.top === 137 &&
    reportedLayout.width === 171 &&
    reportedLayout.height === 742,
  "banner geometry does not match the reported Chess.com viewport",
);
const scrolledLayout = context.calculateBannerLayout(sidebarRect, 1280, 720, false, 0, 500);
assert(
  scrolledLayout && scrolledLayout.top === 16,
  "fixed banner geometry changed with document scroll",
);
const narrowLayout = context.calculateBannerLayout(sidebarRect, 1160, 720, false);
assert(narrowLayout === null, "unsafe narrow viewport exposed the banner");
assert(
  context.calculateWorkspaceMargin(836, 895) === 121 &&
    context.calculateWorkspaceMargin(836, 1080) === 306,
  "workspace was not placed below normal and fullscreen viewport folds",
);

const launcherWorkspace = {
  scrollOptions: null,
  focused: false,
  scrollIntoView(options) { this.scrollOptions = options; },
  focus() { this.focused = true; },
};
let createdLauncher = null;
let launcherClick = null;
const launcherBody = {
  appendChild(node) {
    createdLauncher = node;
    node.isConnected = true;
    node.parentNode = this;
  },
};
context.document.body = launcherBody;
context.document.createElement = () => ({
  style: {},
  dataset: {},
  addEventListener(name, handler) { if (name === "click") launcherClick = handler; },
});
context.document.getElementById = (id) =>
  id === "thinker-chess-launcher" ? createdLauncher
    : id === "oi-wrapper" ? launcherWorkspace : null;
context.document.querySelector = () => null;
context.document.querySelectorAll = () => [];
const launcher = context.ensureLauncher();
assert(launcher && launcher.style.display === "flex" && launcherClick,
  "launcher was not immediately discoverable before delayed Chess.com hosts");
assert(Number.parseInt(launcher.style.left, 10) + 46 <= 227 && launcher.style.top === "835px",
  "launcher fallback was not kept outside the supplied lobby board geometry");
launcherClick();
assert(
  launcherWorkspace.scrollOptions?.behavior === "smooth" &&
    launcherWorkspace.scrollOptions?.block === "start" && launcherWorkspace.focused,
  "launcher did not navigate and focus the existing below-fold workspace",
);

const recoveryControl = { style: {}, dataset: {}, title: "" };
const shellMenu = { isConnected: false, style: {} };
const shellBanner = { isConnected: false, style: {} };
const shellLauncher = {
  isConnected: false,
  style: {},
  dataset: {},
  title: "",
  addEventListener(name, handler) { if (name === "click") this.clickHandler = handler; },
};
const shellWrapper = { style: {} };
const shellScoutPrimary = { style: {} };
const shellScoutSecondary = { style: {} };
const shellHud = { style: {} };
let activeShellHost = null;
let menuMounts = 0;
let bannerMounts = 0;
let launcherMounts = 0;
const shellHost = {
  appendChild(node) {
    node.isConnected = true;
    node.parentNode = this;
    if (node === shellMenu) menuMounts++;
  },
};
context.document.body = {
  appendChild(node) {
    node.isConnected = true;
    node.parentNode = this;
    if (node === shellBanner) bannerMounts++;
    if (node === shellLauncher) launcherMounts++;
  },
};
context.document.querySelector = () => activeShellHost;
context.document.querySelectorAll = () => [shellHud];
context.document.getElementById = (id) =>
  ({
    "kb-ghost-recovery": recoveryControl,
    "krypbot-container": shellMenu,
    "thinker-chess-banner": shellBanner,
    "thinker-chess-launcher": shellLauncher,
    "oi-wrapper": shellWrapper,
    "oi-zone1": shellScoutPrimary,
    "oi-zone2": shellScoutSecondary,
  })[id] || null;
context.setShellNodes(shellMenu, shellBanner, shellLauncher);
const originalEnsureScoutWrapper = context.scout.ensureScoutWrapper;
context.scout.ensureScoutWrapper = () => null;

context.recordMountFailure(new Error("x".repeat(400)));
context.recordMountFailure(new Error("second failure"));
assert(shellLauncher.dataset.mountError.startsWith("2: Error: second failure"),
  "mount diagnostic did not retain the latest bounded failure count");
assert(shellLauncher.dataset.mountError.length <= 240 && recoveryControl.dataset.mountError.length <= 240,
  "mount diagnostic metadata was not bounded");
assert(shellLauncher.title.includes("second failure") && recoveryControl.title.includes("second failure"),
  "mount diagnostic was not exposed on discoverable controls");
context.clearMountFailure();
assert(shellLauncher.dataset.mountError === "" && recoveryControl.dataset.mountError === "",
  "successful recovery did not clear mount diagnostics");

context.reconcileShells();
assert(menuMounts === 0 && bannerMounts === 1 && launcherMounts === 1,
  "viewport shells did not mount before the delayed Chess.com host");
activeShellHost = shellHost;
context.reconcileShells();
assert(menuMounts === 1 && bannerMounts === 1 && launcherMounts === 1,
  "delayed host did not preserve exactly one of every UI shell");
context.reconcileShells();
assert(menuMounts === 1 && bannerMounts === 1 && launcherMounts === 1,
  "idempotent reconciliation duplicated UI shells");
shellMenu.isConnected = false;
shellBanner.isConnected = false;
shellLauncher.isConnected = false;
activeShellHost = {
  appendChild(node) {
    node.isConnected = true;
    node.parentNode = this;
    if (node === shellMenu) menuMounts++;
  },
};
context.reconcileShells();
assert(menuMounts === 2 && bannerMounts === 2 && launcherMounts === 2,
  "full SPA host replacement did not remount every UI shell exactly once");
context.reconcileShells();
assert(menuMounts === 2 && bannerMounts === 2 && launcherMounts === 2,
  "post-replacement reconciliation duplicated UI shells");

context.applyGhost(true);
assert(shellMenu.style.display === "none", "Ghost Mode did not hide the configuration panel");
assert(shellBanner.style.display === "none", "Ghost Mode did not hide the banner");
assert(shellLauncher.style.display === "none", "Ghost Mode did not hide the launcher");
assert(recoveryControl.style.display === "flex", "Ghost Mode recovery control was not exposed");
context.applyGhost(false);
assert(shellMenu.style.display === "flex", "Ghost Mode recovery did not restore the panel");
assert(shellLauncher.style.display !== "none", "Ghost Mode recovery did not restore the launcher");
assert(recoveryControl.style.display === "none", "Ghost Mode recovery control stayed visible");

let reconcileIntervals = 0;
context.window.setInterval = () => {
  reconcileIntervals++;
  return reconcileIntervals;
};
context.startReconciler();
context.startReconciler();
assert(reconcileIntervals === 1, "UI reconciler registered duplicate intervals");
context.scout.ensureScoutWrapper = originalEnsureScoutWrapper;
context.document.body = undefined;
context.document.querySelectorAll = () => [];
context.document.getElementById = () => null;
context.document.querySelector = () => null;

const gameNow = Math.floor(Date.now() / 1000) - 60;
function game(index, result, overrides = {}) {
  return {
    end_time: gameNow - index,
    white: { username: "Rival", result, rating: 1800 - index },
    black: {
      username: "Other",
      result: result === "win" ? "checkmated" : "win",
      rating: 1750 - index,
    },
    time_class: ["bullet", "blitz", "rapid"][index % 3],
    pgn:
      index % 2 === 0
        ? '[Opening "Italian Game"]'
        : '[Opening "Sicilian Defense"]',
    ...overrides,
  };
}

const results = [
  "win",
  "win",
  "win",
  "timeout",
  "agreed",
  "win",
  "timeout",
  "win",
  "win",
  "timeout",
  "win",
  "agreed",
];
const games = results.map((result, index) => game(index, result));
games.push(game(20, "future-unknown"));
games.push(game(21, "win", { end_time: 0 }));

const entry = context.scout.processGames(games, "RIVAL");
assert(entry && entry.username === "rival", "username normalization failed");
assert(entry.hudStats.total === 10, "HUD sample must be limited to ten");
assert(entry.hudStats.streak.type === "W", "streak type is incorrect");
assert(entry.hudStats.streak.count === 3, "streak count is incorrect");
assert(entry.scoutStats.sampleSize === 12, "malformed games entered Scout sample");
assert(entry.scoutStats.openings.white[0].count === 6, "opening aggregation failed");
const noOpening = context.scout.extractOpening({ pgn: "1. e4 e5 2. Nf3 Nc6" });
assert(noOpening === null, "raw moves were incorrectly presented as a named opening");
assert(
  context.scout.extractOpening({ eco: "https://www.chess.com/openings/Queens-Gambit" }) === "Queens Gambit",
  "Chess.com ECO URL was not parsed as an opening",
);
const currentDate = new Date();
const earliestMonth = Math.floor(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 2, 1) / 1000);
const monthFiltered = context.scout.processGames([
  game(0, "win"),
  game(1, "timeout", { end_time: earliestMonth - 1 }),
  game(3, "win", { end_time: earliestMonth + 1 }),
  game(2, "timeout", { end_time: Math.floor(Date.now() / 1000) + 3600 }),
], "rival");
assert(monthFiltered.scoutStats.sampleSize === 2, "outside-window or future games entered Scout sample");
const scoutMethods = {
  getOpponentUsername: context.scout.getOpponentUsername,
  invalidateCache: context.scout.invalidateCache,
  hide: context.scout.hide,
  fetchData: context.scout.fetchData,
};
let rolloverFetch = null;
context.scout.lastOpponent = "rival";
context.scout.currentEntry = { ...entry, timestamp: 1 };
context.scout.getOpponentUsername = () => "rival";
context.scout.invalidateCache = () => {};
context.scout.hide = () => {};
context.scout.fetchData = (username) => { rolloverFetch = username; };
context.scout.checkOpponent();
assert(rolloverFetch === "rival", "expired or prior-month Scout entry was not refreshed");
Object.assign(context.scout, scoutMethods);
context.scout.lastOpponent = null;
context.scout.currentEntry = null;
assert(entry.scoutStats.draws === 2 && entry.scoutStats.losses === 3, "full record is incorrect");
assert(entry.scoutStats.scoreRate === 67, "score rate is incorrect");
assert(entry.scoutStats.colors.white.games === 12, "color split is incorrect");
assert(
  entry.scoutStats.timeClasses.length === 3 &&
    entry.scoutStats.timeClasses.reduce((total, item) => total + item.games, 0) === 12,
  "time-control profile is incorrect",
);
assert(entry.scoutStats.lossPattern.reason === "timeout", "loss pattern is incorrect");
assert(
  entry.scoutStats.rating.latest === 1800 && entry.scoutStats.rating.change === 11,
  "rating movement is incorrect",
);
assert(
  context.scout.isValidCacheEntry(entry, "rival"),
  "valid cache entry was rejected",
);
const sparseEntry = context.scout.processGames([game(0, "win")], "rival");
assert(
  sparseEntry &&
    sparseEntry.scoutStats.sampleSize === 1 &&
    sparseEntry.scoutStats.momentum.delta === null &&
    context.scout.isValidCacheEntry(sparseEntry, "rival"),
  "sparse Scout sample was not handled safely",
);

context.scout.writeCache(entry);
assert(store.has("tc_scout_rival"), "lowercase cache key was not used");

const mismatched = { ...entry, username: "other" };
assert(
  !context.scout.isValidCacheEntry(mismatched, "rival"),
  "username mismatch was accepted",
);

const expired = { ...entry, timestamp: Date.now() - 21 * 60 * 1000 };
assert(
  !context.scout.isValidCacheEntry(expired, "rival"),
  "expired cache was accepted",
);

const impossible = {
  ...entry,
  hudStats: {
    ...entry.hudStats,
    total: 10,
    streak: { type: "W", count: 10 },
  },
  scoutStats: {
    ...entry.scoutStats,
    sampleSize: 10,
    wins: entry.hudStats.wins,
    winRate: Math.round((entry.hudStats.wins / 10) * 100),
    openings: { white: null, black: null },
  },
};
assert(
  !context.scout.isValidCacheEntry(impossible, "rival"),
  "streak/result cache inconsistency was accepted",
);

const impossibleWins = {
  ...entry,
  hudStats: {
    ...entry.hudStats,
    wins: 0,
    losses: entry.hudStats.total - entry.hudStats.draws,
    streak: { type: "L", count: 1 },
  },
  scoutStats: {
    ...entry.scoutStats,
    wins: 3,
    winRate: 25,
    openings: { white: null, black: null },
  },
};
assert(
  !context.scout.isValidCacheEntry(impossibleWins, "rival"),
  "Scout/HUD win subset inconsistency was accepted",
);

context.scout.checkTimer = setTimeout(() => {}, 10000);
context.scout.startObserver();
assert(context.scout.checkTimer === null, "observer restart left debounce locked");

store.set("tc_scout_broken", "{bad-json");
assert(context.scout.readCache("broken") === null, "corrupt cache was returned");
assert(!store.has("tc_scout_broken"), "corrupt cache was not invalidated");
store.set(
  "tc_scout_legacy",
  JSON.stringify({
    timestamp: Date.now(),
    username: "legacy",
    hudStats: entry.hudStats,
    scoutStats: { sampleSize: 12, wins: 7, winRate: 58, openings: {} },
  }),
);
assert(context.scout.readCache("legacy") === null, "legacy cache shape was accepted");
assert(!store.has("tc_scout_legacy"), "legacy cache shape was not invalidated");

const url = context.scout.getCurrentMonthUrl("rival");
assert(
  /^https:\/\/api\.chess\.com\/pub\/player\/rival\/games\/\d{4}\/\d{2}$/.test(url),
  "monthly PubAPI URL is invalid",
);

function fakeElement({ text = "", href = null, visible = true } = {}) {
  return {
    textContent: text,
    matches: (selector) => Boolean(href && selector.includes("a[href*='/member/']")),
    querySelector: () => null,
    getAttribute: (name) => (name === "href" ? href : null),
    getBoundingClientRect: () => ({
      width: visible ? 120 : 0,
      height: visible ? 24 : 0,
      left: 200,
      right: 320,
      top: 80,
      bottom: 104,
    }),
  };
}

const memberElement = fakeElement({ text: "Rival 1800", href: "/member/Rival_Name/" });
assert(
  context.scout.extractUsernameFromElement(memberElement) === "rival_name",
  "member URL username extraction failed",
);
assert(
  context.scout.extractUsernameFromElement(fakeElement({ text: "Adversário" })) === null,
  "lobby opponent placeholder was accepted",
);
assert(
  context.scout.extractUsernameFromElement(fakeElement({ text: "Waiting for opponent" })) === null,
  "multiword lobby placeholder was accepted",
);
assert(
  context.scout.extractUsernameFromElement(fakeElement({ text: "NM Rival_Name" })) ===
    "rival_name",
  "NM title was mistaken for a username",
);

const originalQuerySelectorAll = context.document.querySelectorAll;
const originalQuerySelector = context.document.querySelector;
const currentUsernameElement = fakeElement({ text: "Rival_Name" });
currentUsernameElement.matches = (selector) => selector.includes("[class*='username']");
const currentTopContainer = {
  textContent: "Rival_Name 1800",
  matches: () => false,
  querySelector: (selector) =>
    selector.includes("username") ? currentUsernameElement : null,
  getBoundingClientRect: () => ({ width: 528, height: 40, left: 228, right: 756, top: 16, bottom: 56 }),
};
let observedPlayerSelector = "";
context.document.querySelector = () => null;
context.document.querySelectorAll = (selector) => {
  observedPlayerSelector = selector;
  return selector.includes("#board-layout-player-top") ? [currentTopContainer] : [];
};
assert(
  context.scout.findPlayerElement("top") === currentUsernameElement,
  "current top-player container was not detected",
);
assert(
  observedPlayerSelector.includes("#board-layout-player-top") &&
    observedPlayerSelector.includes("#board-layout-main .player-component.player-top"),
  "current Chess.com player hierarchy is not explicitly scoped",
);
const genericTop = fakeElement({ text: "Comfortably_smart (1345)" });
genericTop.closest = () => null;
genericTop.getBoundingClientRect = () => ({ width: 180, height: 30, left: 277, right: 457, top: 137, bottom: 167 });
const genericBoard = {
  getBoundingClientRect: () => ({ width: 640, height: 640, left: 227, right: 867, top: 187, bottom: 827 }),
};
context.document.querySelectorAll = (selector) =>
  selector.includes("wc-chess-board") ? [genericBoard]
    : selector.includes("[class*='player-name']") ? [genericTop] : [];
assert(context.scout.findPlayerElement("top") === genericTop,
  "geometry fallback missed a visible opponent outside known Chess.com classes");
context.document.querySelectorAll = originalQuerySelectorAll;
context.document.querySelector = originalQuerySelector;

const originalGetOpponentUsername = context.scout.getOpponentUsername;
const originalGetOpponentElement = context.scout.getOpponentElement;
context.scout.lastOpponent = "rival";
context.scout.currentEntry = entry;
context.scout.getOpponentUsername = () => "rival";
context.scout.getOpponentElement = () => null;
context.scout.checkOpponent();
context.scout.getOpponentUsername = originalGetOpponentUsername;
context.scout.getOpponentElement = originalGetOpponentElement;
context.scout.currentEntry = null;

const liveParent = {
  insertBefore(node) {
    node.parentNode = this;
  },
};
const relocatedWrapper = {
  id: "oi-wrapper",
  parentNode: { id: "stale-parent" },
  style: {},
  appendChild(node) {
    node.parentNode = this;
  },
};
const relocatedContainer = { id: "krypbot-container", parentNode: liveParent, style: {} };
const originalGetElementById = context.document.getElementById;
context.document.getElementById = (id) =>
  id === "krypbot-container" ? relocatedContainer : id === "oi-wrapper" ? relocatedWrapper : null;
context.scout.ensureScoutWrapper();
assert(relocatedWrapper.parentNode === liveParent, "stale Scout wrapper was not relocated");
assert(relocatedContainer.parentNode === relocatedWrapper, "Thinker panel was not reunited with Scout");
context.document.getElementById = originalGetElementById;

let loadingRestored = false;
const originalRenderLoading = context.scout.renderLoading;
context.scout.lastOpponent = "rival";
context.scout.requestController = { abort() {} };
context.scout.getOpponentUsername = () => "rival";
context.scout.getOpponentElement = () => ({ nextElementSibling: null });
context.scout.renderLoading = () => {
  loadingRestored = true;
};
context.scout.checkOpponent();
assert(loadingRestored, "loading UI was not restored after player-row replacement");
context.scout.renderLoading = originalRenderLoading;
context.scout.getOpponentUsername = originalGetOpponentUsername;
context.scout.getOpponentElement = originalGetOpponentElement;
context.scout.requestController = null;

(async () => {
  const fiftyGames = Array.from({ length: 50 }, (_, index) => game(index, "win"));
  context.fetch = () => Promise.reject(new Error("browser-fetch-blocked"));
  let gmOptions = null;
  context.GM_xmlhttpRequest = (options) => {
    gmOptions = options;
    return { abort() {} };
  };
  const gmRequest = context.scout.createMonthlyRequest(url);
  await new Promise(setImmediate);
  gmOptions.onload({ status: 200, responseText: JSON.stringify({ games }) });
  const gmPayload = await gmRequest.promise;
  assert(gmPayload.games.length === games.length, "GM transport response was not parsed");

  const failedRequest = context.scout.createMonthlyRequest(url);
  await new Promise(setImmediate);
  gmOptions.onerror();
  let rejectedSilently = false;
  try {
    await failedRequest.promise;
  } catch (error) {
    rejectedSilently = true;
  }
  assert(rejectedSilently, "GM transport failure did not reject");

  store.delete("tc_scout_rival");
  let loadingRendered = false;
  let finalEntry = null;
  context.scout.lastOpponent = "rival";
  context.scout.getOpponentUsername = () => "rival";
  context.scout.renderLoading = () => {
    loadingRendered = true;
  };
  context.scout.renderEntry = (value) => {
    finalEntry = value;
  };
  const gmPipeline = context.scout.fetchData("rival");
  await new Promise(setImmediate);
  gmOptions.onload({ status: 200, responseText: JSON.stringify({ games: fiftyGames }) });
  await gmPipeline;
  assert(loadingRendered, "Scout loading UI was not mounted before request completion");
  assert(finalEntry && finalEntry.username === "rival", "GM response did not render Scout data");
  assert(store.has("tc_scout_rival"), "GM response was not cached");

  store.delete("tc_scout_alpha");
  store.delete("tc_scout_beta");
  const controlledRequests = [];
  context.fetch = (requestUrl, options) => new Promise((resolve) => {
    controlledRequests.push({ requestUrl, options, resolve });
  });
  const renderedUsers = [];
  context.scout.renderLoading = () => {};
  context.scout.renderEntry = (value) => renderedUsers.push(value.username);
  context.scout.getOpponentUsername = () => context.scout.lastOpponent;
  context.scout.lastOpponent = "alpha";
  const alphaPipeline = context.scout.fetchData("alpha");
  context.scout.lastOpponent = "beta";
  const betaPipeline = context.scout.fetchData("beta");
  const betaGames = fiftyGames.map((value) => ({
    ...value,
    white: { ...value.white, username: "Beta" },
  }));
  controlledRequests[0].resolve({ ok: true, json: async () => ({ games: fiftyGames }) });
  controlledRequests[1].resolve({ ok: true, json: async () => ({ games: betaGames }) });
  await Promise.all([alphaPipeline, betaPipeline]);
  assert(controlledRequests[0].options.signal.aborted, "previous browser request was not aborted");
  assert(!store.has("tc_scout_alpha"), "aborted opponent response was cached");
  assert(store.has("tc_scout_beta"), "current opponent response was not cached");
  assert(
    renderedUsers.length === 1 && renderedUsers[0] === "beta",
    "stale GM response rendered over the current opponent",
  );

  delete context.GM_xmlhttpRequest;

  store.delete("tc_scout_rival");
  const previousMonthStart = Math.floor(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1, 2) / 1000);
  const previousGames = Array.from({ length: 50 }, (_, index) =>
    game(index, "win", { end_time: previousMonthStart + index }),
  );
  const previousUrl = context.scout.getCurrentMonthUrl("rival", 1);
  const requestedMonths = [];
  context.fetch = (requestUrl) => {
    requestedMonths.push(requestUrl);
    return Promise.resolve({ ok: true, json: async () => ({ games: requestUrl === url ? [] : previousGames }) });
  };
  context.scout.lastOpponent = "rival";
  context.scout.getOpponentUsername = () => "rival";
  let previousEntry = null;
  context.scout.renderEntry = (value) => { previousEntry = value; };
  await context.scout.fetchData("rival");
  assert(requestedMonths.length === 2 && requestedMonths[0] === url && requestedMonths[1] === previousUrl,
    "Scout did not search the previous PubAPI month after an empty current month");
  assert(previousEntry?.scoutStats.sampleSize === 50 && context.scout.isValidCacheEntry(previousEntry, "rival"),
    "real previous-month results were rejected or replaced by fabricated statistics");

  store.delete("tc_scout_rival");
  let resolveFetch;
  context.fetch = () =>
    new Promise((resolve) => {
      resolveFetch = resolve;
    });
  context.scout.lastOpponent = "rival";
  context.scout.getOpponentUsername = () => context.scout.lastOpponent;
  context.scout.renderEntry = () => {
    throw new Error("stale response rendered");
  };

  const pending = context.scout.fetchData("rival");
  context.scout.lastOpponent = "other";
  context.scout.requestVersion++;
  resolveFetch({ ok: true, json: async () => ({ games }) });
  await pending;
  assert(!store.has("tc_scout_rival"), "stale response wrote to cache");

  console.log("Scout processing, cache integrity, endpoint, and race assertions passed.");
})().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
