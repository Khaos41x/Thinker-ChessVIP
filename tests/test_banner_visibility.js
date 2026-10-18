const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("script.js", "utf8");
const start = source.indexOf("  let scheduleThinkerBannerPosition");
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
const banner = { style: {} };
let gameOverVisible = false;

const document = {
  body: {},
  documentElement: { clientWidth: 1433, clientHeight: 900 },
  getElementById: (id) => id === "thinker-chess-banner" ? banner : null,
  querySelector: (selector) => selector.includes("wc-chess-board") ? board : null,
  querySelectorAll(selector) {
    if (selector.includes("game-over-modal")) return gameOverVisible ? [gameOver] : [];
    if (selector === ".play-controller-component") return [sidebar];
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
};
vm.createContext(context);
vm.runInContext(
  "let _ghostModeActive = false; const SERVER_URL = 'http://127.0.0.1:5050';\n" +
    source.slice(start, end) +
    "\nglobalThis.calculate = calculateThinkerBannerLayout;" +
    "\nglobalThis.shouldShow = shouldShowThinkerBanner;" +
    "\nglobalThis.position = positionThinkerBannerShell;" +
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
assert(banner.style.left === "1257px", "banner left did not clamp its preferred width to viewportRight");
assert(banner.style.height === "742px", "banner height did not mirror the sidebar exactly");
assert(banner.style.width === "170px", "banner did not preserve its preferred width");

const roomyLayout = context.calculate(sidebarRect, 1600, 0, 500, false);
assert(roomyLayout.left === 1263, "roomy viewport did not preserve the 15px sidebar gap");
assert(roomyLayout.width === 170, "roomy viewport did not use the preferred banner width");
assert(roomyLayout.left + roomyLayout.width <= 1594, "roomy banner exceeded viewportRight");

const constrainedLayout = context.calculate(sidebarRect, 1390, 0, 500, false);
assert(constrainedLayout.left === 1214, "constrained viewport did not shift the banner left");
assert(constrainedLayout.width === 170, "constrained viewport changed the preferred banner width");
assert(constrainedLayout.left + constrainedLayout.width === 1384,
  "constrained banner did not end at viewportRight");

const fallbackLayout = context.calculate(sidebarRect, 1330, 0, 500, false);
assert(fallbackLayout.width === 170, "extreme viewport did not preserve readable banner width");
assert(fallbackLayout.left === 1154, "extreme viewport did not shift the banner left");
assert(fallbackLayout.left + fallbackLayout.width === 1324,
  "extreme fallback banner did not end at viewportRight");

const scrolledFallbackLayout = context.calculate(sidebarRect, 1330, 50, 500, false);
assert(scrolledFallbackLayout.left === 1204,
  "horizontal scroll offset was not included in the viewport clamp");
assert(scrolledFallbackLayout.left + scrolledFallbackLayout.width === 1374,
  "scrolled fallback banner exceeded document-space viewportRight");

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

window.location.pathname = "/analysis/game/live/185503745104/review";
assert(context.shouldShow() === false, "review route qualified for the banner");
context.position();
assert(banner.style.display === "none", "SPA transition into review did not hide the banner");

window.location.pathname = "/game/185503745104";
sidebar.innerText = "Game Review";
assert(context.shouldShow() === false, "post-game sidebar qualified for the banner");
sidebar.innerText = "Moves";
gameOverVisible = true;
assert(context.shouldShow() === false, "visible game-over dialog qualified for the banner");
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
  "THINKER_BANNER_ARTWORK_SCALE = 3.4",
  "align-items:center",
]) {
  assert(source.includes(marker), `banner lifecycle gate missing: ${marker}`);
}
assert(!source.includes("function positionThinkerBannerFallback"), "viewport fallback still exists");
assert(!source.includes('addEventListener("scroll", scheduleThinkerBannerPosition'), "scroll still schedules banner geometry");
const bannerMarkupStart = source.indexOf('const bannerHtml = `');
const bannerMarkupEnd = source.indexOf("`;", bannerMarkupStart);
const bannerMarkup = source.slice(bannerMarkupStart, bannerMarkupEnd);
assert(bannerMarkup.includes("width:${THINKER_BANNER_ARTWORK_SCALE * 100}%"),
  "banner artwork is not scaled independently from sidebar height");
assert(bannerMarkup.includes("height:auto") && bannerMarkup.includes("max-width:none"),
  "banner artwork does not preserve its intrinsic aspect ratio");
assert(!bannerMarkup.includes("object-fit:"), "banner artwork still depends on object-fit cropping");
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
