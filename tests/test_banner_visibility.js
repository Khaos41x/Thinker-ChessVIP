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
const sidebar = element({ left: 850, top: 100, right: 1150, bottom: 740, width: 300, height: 640 }, "Moves");
const gameOver = element({ left: 350, top: 180, right: 750, bottom: 580, width: 400, height: 400 });
const banner = { style: {} };
let gameOverVisible = false;

const document = {
  body: {},
  documentElement: { clientWidth: 1400, clientHeight: 900 },
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
  innerWidth: 1400,
  location: { pathname: "/game/live/185503745104" },
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
    "\nglobalThis.shouldShow = shouldShowThinkerBanner;" +
    "\nglobalThis.position = positionThinkerBannerShell;" +
    "\nglobalThis.setGhost = (value) => { _ghostModeActive = value; };",
  context,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(context.shouldShow() === true, "active game did not qualify for the banner");
context.position();
assert(banner.style.display === "flex", "active game did not display the banner");

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
  "function positionThinkerBannerFallback",
  "function positionThinkerBannerShell",
  "function updateBannerPosition",
  "if (!shouldShowThinkerBanner()) banner.style.display = \"none\";",
]) {
  assert(source.includes(marker), `banner lifecycle gate missing: ${marker}`);
}

console.log("banner visibility tests: ok");
