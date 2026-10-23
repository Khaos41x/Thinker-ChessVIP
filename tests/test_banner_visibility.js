const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("script.js", "utf8");
const start = source.indexOf("  let scheduleThinkerBannerPosition");
const resolvers = source.slice(source.indexOf("  function resolveThinkerBoardGame"), source.indexOf("  function get_cached_game"));
const end = source.indexOf("\n  function createMenu", start);
if (start < 0 || end < 0) throw new Error("banner lifecycle block not found");

function element(rect, text = "") {
  return {
    hidden: false,
    innerText: text,
    textContent: text,
    isConnected: true,
    nodeType: 1,
    parentElement: null,
    contains: () => false,
    closest: () => null,
    getAttribute: () => null,
    getBoundingClientRect: () => rect,
  };
}

const board = element({ left: 200, top: 100, right: 840, bottom: 740, width: 640, height: 640 });
let sidebarRect = { left: 900, top: 137, right: 1248, bottom: 879, width: 348, height: 742 };
const sidebar = element(sidebarRect, "Moves");
sidebar.getBoundingClientRect = () => sidebarRect;
const gameOver = element({ left: 350, top: 180, right: 750, bottom: 580, width: 400, height: 400 });
const artwork = { naturalWidth: 1122, style: {} };
const banner = { style: {}, querySelector: () => artwork };
let gameOverVisible = false;
let semanticSidebarAvailable = true;

const document = {
  body: {},
  documentElement: { clientWidth: 1433, clientHeight: 900 },
  getElementById: (id) => id === "thinker-chess-banner" ? banner : null,
  querySelector: (selector) => selector.includes("wc-chess-board") ? board : null,
  querySelectorAll(selector) {
    if (selector.includes("wc-chess-board")) return [board];
    if (selector.includes("game-over-modal")) return gameOverVisible ? [gameOver] : [];
    if (selector === ".play-controller-component") return semanticSidebarAvailable ? [sidebar] : [];
    return [];
  },
};
const window = {
  innerHeight: 900,
  innerWidth: 1433,
  location: { pathname: "/game/live/185503745104" },
  scrollX: 0,
  scrollY: 500,
  getComputedStyle: () => ({ display: "block", visibility: "visible", opacity: "1" }),
  removeEventListener() {},
};
const context = {
  document,
  window,
  console,
  cancelAnimationFrame() {},
  clearInterval() {},
  isMasterEnabled: () => false,
  auto_move: false,
  thinkerMoveDiagnostic: { stage: "idle", status: null },
  engineCapability: "fixture-private-token-never-export",
  moveRetryAfter: 0,
  sessionControlBridge: { effectiveAutoMove: value => value, isActive: () => false },
  localStorage: {
    getItem: (key) => preferences.get(key) ?? null,
    setItem: (key, value) => preferences.set(key, String(value)),
  },
};
const preferences = new Map();
vm.createContext(context);
vm.runInContext(
  "let _ghostModeActive = false; const SERVER_URL = 'http://127.0.0.1:5050';\n" +
    resolvers + source.slice(start, end) +
    "\nglobalThis.calculate = calculateThinkerBannerLayout;" +
    "\nglobalThis.shouldShow = shouldShowThinkerBanner;" +
    "\nglobalThis.position = positionThinkerBannerShell;" +
    "\nglobalThis.setBannerEnabled = setThinkerBannerEnabled;" +
    "\nglobalThis.setObservedSidebar = (value) => { thinkerObservedBannerSidebar = value; };" +
    "\nglobalThis.setGhost = (value) => { _ghostModeActive = value; };",
  context,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(context.shouldShow() === true, "active game did not qualify for the banner");
context.position();
assert(banner.style.display === "flex", "active game did not display the banner");
assert(banner.style.top === "637px", "banner top did not use sidebar top plus scrollY");
assert(banner.style.left === "1263px", "banner did not preserve the gap without overlapping the sidebar");
assert(banner.style.height === "742px", "banner height did not mirror the sidebar exactly");
assert(banner.style.width === "164px", "banner did not fit the actual free column");
assert(artwork.style.maxWidth === "1122px", "DPR 1 artwork cap is incorrect");
window.devicePixelRatio = 2;
context.position();
assert(artwork.style.maxWidth === "561px", "DPR 2 artwork exceeded native physical resolution");
window.devicePixelRatio = 1;

context.setBannerEnabled(false);
assert(window.thinkerChessDiagnostics().banner.reason === "disabled", "diagnostics lost banner disabled cause");
assert(!JSON.stringify(window.thinkerChessDiagnostics()).includes("fixture-private-token"), "diagnostic leaked capability");
assert(context.shouldShow() === false && banner.style.display === "none", "disabled banner remained visible");
assert(preferences.get("thinkerBanner") === "false", "banner off preference was not persisted");
context.position();
assert(banner.style.display === "none", "layout update restored disabled banner");
context.setBannerEnabled(true);
assert(banner.style.display === "flex" && preferences.get("thinkerBanner") === "true", "banner did not restore immediately");
preferences.set("thinkerBanner", "false");
const savedContext = { ...context };
vm.createContext(savedContext);
vm.runInContext("let _ghostModeActive = false; const SERVER_URL = '';\n" + resolvers + source.slice(start, end) + "\nglobalThis.savedShouldShow = shouldShowThinkerBanner;", savedContext);
assert(savedContext.savedShouldShow() === false, "fresh startup ignored saved banner preference");

const roomyLayout = context.calculate(sidebarRect, 1600, 0, 500, false);
assert(roomyLayout.left === 1263, "roomy viewport did not preserve the 15px sidebar gap");
assert(roomyLayout.width === 170, "roomy viewport did not use the preferred banner width");
assert(roomyLayout.left + roomyLayout.width <= 1594, "roomy banner exceeded viewportRight");

const constrainedLayout = context.calculate(sidebarRect, 1390, 0, 500, false);
assert(constrainedLayout.left === 1263, "constrained viewport did not preserve the sidebar gap");
assert(constrainedLayout.width === 121, "constrained viewport did not shrink the banner to fit");
assert(constrainedLayout.left + constrainedLayout.width === 1384,
  "constrained banner did not end at viewportRight");

const fallbackLayout = context.calculate(sidebarRect, 1330, 0, 500, false);
assert(fallbackLayout === null, "unreadable free column should hide the banner");

const scrolledFallbackLayout = context.calculate(sidebarRect, 1330, 50, 500, false);
assert(scrolledFallbackLayout === null, "horizontal scroll should not expose an unreadable column");
const scrolledLayout = context.calculate(sidebarRect, 1390, 50, 500, false);
assert(scrolledLayout.left === 1313 && scrolledLayout.width === 121,
  "horizontal scroll did not retain document anchoring and free-column width");
assert(context.calculate(sidebarRect, 1364, 0, 0, false) === null,
  "95px free column should hide the banner");
assert(context.calculate(sidebarRect, 1365, 0, 0, false)?.width === 96,
  "96px free column should show the banner");

assert(context.calculate(sidebarRect, 100, 0, 500, false) === null,
  "unsafe viewport narrower than the minimum readable width was accepted");
const geometryBeforeScroll = JSON.stringify(banner.style);
window.scrollY = 700;
assert(JSON.stringify(banner.style) === geometryBeforeScroll, "scrolling alone wrote banner geometry");
window.scrollY = 500;
context.setObservedSidebar(sidebar);
sidebarRect = { left: 900, top: -200, right: 1248, bottom: 542, width: 348, height: 742 };
window.scrollY = 837;
context.position();
assert(banner.style.top === "637px" && banner.style.height === "742px",
  "observed sidebar lost its document anchoring after leaving the viewport");
sidebarRect = { left: 900, top: 137, right: 1248, bottom: 879, width: 348, height: 742 };
window.scrollY = 500;

window.location.pathname = "/play/online";
assert(context.shouldShow() === true, "/play/online did not qualify for the banner");
context.position();
assert(banner.style.display === "flex", "/play/online did not display the banner");

semanticSidebarAvailable = false;
context.setObservedSidebar(null);
const boardColumn = element(board.getBoundingClientRect());
const layout = element({ left: 200, top: 100, right: 1248, bottom: 879, width: 1048, height: 779 });
boardColumn.contains = (node) => node === board;
boardColumn.parentElement = layout;
board.parentElement = boardColumn;
sidebar.parentElement = layout;
layout.children = [boardColumn, sidebar];
assert(context.shouldShow() === true, "geometry-only Chess.com sidebar did not qualify for the banner");
context.position();
assert(banner.style.display === "flex", "geometry-only Chess.com sidebar did not display the banner");
semanticSidebarAvailable = true;

window.location.pathname = "/analysis/game/live/185503745104/review";
assert(context.shouldShow() === false, "review route qualified for the banner");
context.position();
assert(banner.style.display === "none", "SPA transition into review did not hide the banner");

window.location.pathname = "/game/185503745104";
sidebar.innerText = "Game Review";
assert(context.shouldShow() === true, "Game Review text hid the enabled banner");
context.position();assert(banner.style.display === "flex", "post-game sidebar hid banner");
sidebar.innerText = "Moves";
gameOverVisible = true;
assert(context.shouldShow() === true, "game-over dialog hid the enabled banner");
context.position();assert(banner.style.display === "flex", "game-over dialog hid banner");
gameOverVisible = false;

for (const path of ["/puzzles/rated", "/analysis/game/live/185503745104"]) {
  window.location.pathname = path;
  assert(context.shouldShow() === false, `${path} qualified outside an active game`);
}

window.location.pathname = "/game/live/185503745105";
context.position();
assert(banner.style.display === "flex", "SPA transition back to an active game did not restore the banner");
window.location.pathname = "/play/online";
context.position();
assert(banner.style.display === "flex", "SPA transition back to /play/online did not restore the banner");
context.setGhost(true);
assert(context.shouldShow() === false, "Ghost Mode exposed the banner");
context.position();
assert(banner.style.display === "none", "Ghost Mode did not hide the banner");

for (const marker of [
  "function positionThinkerBannerShell",
  "if (!shouldShowThinkerBanner()) banner.style.display = \"none\";",
  "position:absolute!important",
  "transition:none!important",
  "align-items:center",
]) {
  assert(source.includes(marker), `banner lifecycle gate missing: ${marker}`);
}
assert(!source.includes("function positionThinkerBannerFallback"), "viewport fallback still exists");
assert(!source.includes('addEventListener("scroll", scheduleThinkerBannerPosition'), "scroll still schedules banner geometry");
const bannerMarkupStart = source.indexOf('const bannerHtml = `');
const bannerMarkupEnd = source.indexOf("`;", bannerMarkupStart);
const bannerMarkup = source.slice(bannerMarkupStart, bannerMarkupEnd);
assert(bannerMarkup.includes('data-artwork="banner-horse.webp"'), "banner does not use the prepared horse");
assert(bannerMarkup.includes('data:image/webp;base64,') && bannerMarkup.includes('height:auto;') && bannerMarkup.includes('object-fit:contain;'),
  "banner must embed the raster without distorting its proportions");
assert(bannerMarkup.includes('>Thinker Chess</div>'), "banner title is not live Title Case HTML text");
assert(!bannerMarkup.includes('<svg') && !bannerMarkup.includes('id="tc-banner-') && !bannerMarkup.includes('url('),
  "banner contains obsolete vector markup or external image resources");
assert(bannerMarkup.includes('box-shadow:none') && bannerMarkup.includes('padding:12px'),
  "flat banner surface or text inset is missing");
const observerStart = source.indexOf("thinkerBannerLayoutObserver.observe(document.body");
const observerEnd = source.indexOf("});", observerStart) + 3;
const observerOptions = source.slice(observerStart, observerEnd);
assert(observerOptions.includes("childList: true") && observerOptions.includes("subtree: true"),
  "sidebar replacement observer is not child-list scoped");
assert(!observerOptions.includes("attributes") && !observerOptions.includes("attributeFilter"),
  "sidebar replacement observer still watches global attributes");
const reconcileStart = source.indexOf("function reconcileThinkerUiShells");
const reconcileEnd = source.indexOf("function startThinkerUiReconciler", reconcileStart);
assert(!source.slice(reconcileStart, reconcileEnd).includes("scheduleThinkerBannerPosition"),
  "periodic reconciler still schedules banner geometry");
const watchdogStart = source.indexOf("thinkerShellWatchTimer = window.setInterval");
const watchdogEnd = source.indexOf("}, 1000);", watchdogStart);
assert(!source.slice(watchdogStart, watchdogEnd).includes("positionThinkerBannerShell"),
  "periodic watchdog still writes banner geometry");

console.log("banner visibility tests: ok");
