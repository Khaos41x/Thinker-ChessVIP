const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("script.js", "utf8");
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
  !source.includes('position: fixed; right: -9999px') ||
  !source.includes("function calculateThinkerBannerLayout") ||
  !source.includes("object-fit:cover;object-position:center center")
) {
  throw new Error("responsive full-height banner layout markers are missing");
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
  window: {},
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
    "\nglobalThis.reconcileShells = reconcileThinkerUiShells;" +
    "\nglobalThis.applyGhost = applyGhostModeVisibility;" +
    "\nglobalThis.startReconciler = startThinkerUiReconciler;" +
    "\nglobalThis.setShellNodes = (menu, banner) => { thinkerMenuNode = menu; thinkerBannerNode = banner; };",
  context,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sidebarRect = { left: 788, top: 16, right: 1088, bottom: 704 };
const bannerLayout = context.calculateBannerLayout(sidebarRect, 1280, 720, false);
assert(
  bannerLayout &&
    bannerLayout.left === 1102 &&
    bannerLayout.top === 16 &&
    bannerLayout.width === 164 &&
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
    reportedLayout.left === 1262 &&
    reportedLayout.top === 137 &&
    reportedLayout.width === 157 &&
    reportedLayout.height === 742,
  "banner geometry does not match the reported Chess.com viewport",
);

const recoveryControl = { style: {} };
const shellMenu = { isConnected: false, style: {} };
const shellBanner = { isConnected: false, style: {} };
const shellWrapper = { style: {} };
const shellScoutPrimary = { style: {} };
const shellScoutSecondary = { style: {} };
const shellHud = { style: {} };
let activeShellHost = null;
let menuMounts = 0;
let bannerMounts = 0;
const shellHost = {
  appendChild(node) {
    node.isConnected = true;
    if (node === shellMenu) menuMounts++;
  },
};
context.document.body = {
  appendChild(node) {
    node.isConnected = true;
    if (node === shellBanner) bannerMounts++;
  },
};
context.document.querySelector = () => activeShellHost;
context.document.querySelectorAll = () => [shellHud];
context.document.getElementById = (id) =>
  ({
    "kb-ghost-recovery": recoveryControl,
    "krypbot-container": shellMenu,
    "thinker-chess-banner": shellBanner,
    "oi-wrapper": shellWrapper,
    "oi-zone1": shellScoutPrimary,
    "oi-zone2": shellScoutSecondary,
  })[id] || null;
context.setShellNodes(shellMenu, shellBanner);

context.reconcileShells();
assert(menuMounts === 0 && bannerMounts === 1, "shell mounted without a Chess.com host");
activeShellHost = shellHost;
context.reconcileShells();
assert(menuMounts === 1 && bannerMounts === 1, "delayed host did not mount both UI shells");
context.reconcileShells();
assert(menuMounts === 1 && bannerMounts === 1, "idempotent reconciliation duplicated UI shells");
shellMenu.isConnected = false;
activeShellHost = {
  appendChild(node) {
    node.isConnected = true;
    if (node === shellMenu) menuMounts++;
  },
};
context.reconcileShells();
assert(menuMounts === 2, "SPA host replacement did not remount the configuration panel");

context.applyGhost(true);
assert(shellMenu.style.display === "none", "Ghost Mode did not hide the configuration panel");
assert(shellBanner.style.display === "none", "Ghost Mode did not hide the banner");
assert(recoveryControl.style.display === "flex", "Ghost Mode recovery control was not exposed");
context.applyGhost(false);
assert(shellMenu.style.display === "flex", "Ghost Mode recovery did not restore the panel");
assert(recoveryControl.style.display === "none", "Ghost Mode recovery control stayed visible");

let reconcileIntervals = 0;
context.window.setInterval = () => {
  reconcileIntervals++;
  return reconcileIntervals;
};
context.startReconciler();
context.startReconciler();
assert(reconcileIntervals === 1, "UI reconciler registered duplicate intervals");
context.document.body = undefined;
context.document.querySelectorAll = () => [];
context.document.getElementById = () => null;
context.document.querySelector = () => null;

function game(index, result, overrides = {}) {
  return {
    end_time: 2000 - index,
    white: { username: "Rival", result },
    black: {
      username: "Other",
      result: result === "win" ? "checkmated" : "win",
    },
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
assert(entry.scoutStats.openings.white.count === 6, "opening aggregation failed");
assert(
  context.scout.isValidCacheEntry(entry, "rival"),
  "valid cache entry was rejected",
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
const relocatedContainer = { id: "krypbot-container", parentNode: liveParent };
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
  let gmOptions = null;
  context.GM_xmlhttpRequest = (options) => {
    gmOptions = options;
    return { abort() {} };
  };
  const gmRequest = context.scout.createMonthlyRequest(url);
  gmOptions.onload({ status: 200, responseText: JSON.stringify({ games }) });
  const gmPayload = await gmRequest.promise;
  assert(gmPayload.games.length === games.length, "GM transport response was not parsed");

  const failedRequest = context.scout.createMonthlyRequest(url);
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
  gmOptions.onload({ status: 200, responseText: JSON.stringify({ games }) });
  await gmPipeline;
  assert(loadingRendered, "Scout loading UI was not mounted before request completion");
  assert(finalEntry && finalEntry.username === "rival", "GM response did not render Scout data");
  assert(store.has("tc_scout_rival"), "GM response was not cached");

  store.delete("tc_scout_alpha");
  store.delete("tc_scout_beta");
  const controlledRequests = [];
  context.GM_xmlhttpRequest = (options) => {
    const controlled = { options, aborted: false };
    controlledRequests.push(controlled);
    return {
      abort() {
        controlled.aborted = true;
        options.onabort();
      },
    };
  };
  const renderedUsers = [];
  context.scout.renderLoading = () => {};
  context.scout.renderEntry = (value) => renderedUsers.push(value.username);
  context.scout.getOpponentUsername = () => context.scout.lastOpponent;
  context.scout.lastOpponent = "alpha";
  const alphaPipeline = context.scout.fetchData("alpha");
  context.scout.lastOpponent = "beta";
  const betaPipeline = context.scout.fetchData("beta");
  const betaGames = games.map((value) => ({
    ...value,
    white: { ...value.white, username: "Beta" },
  }));
  controlledRequests[0].options.onload({
    status: 200,
    responseText: JSON.stringify({ games }),
  });
  controlledRequests[1].options.onload({
    status: 200,
    responseText: JSON.stringify({ games: betaGames }),
  });
  await Promise.all([alphaPipeline, betaPipeline]);
  assert(controlledRequests[0].aborted, "previous GM request was not aborted");
  assert(!store.has("tc_scout_alpha"), "aborted opponent response was cached");
  assert(store.has("tc_scout_beta"), "current opponent response was not cached");
  assert(
    renderedUsers.length === 1 && renderedUsers[0] === "beta",
    "stale GM response rendered over the current opponent",
  );

  delete context.GM_xmlhttpRequest;

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
