const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const scriptPath = path.join(__dirname, "..", "script.js");
const source = fs.readFileSync(scriptPath, "utf8");
const start = source.indexOf("  const AUTO_ADJUST_N = 5,");
const end = source.indexOf("\n  let can_interval = true,", start);
assert(start >= 0 && end > start, "auto adjust logic block not found");

function storage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function element({ text = "", attributes = {}, ratingNodes = [], closest = null, parent = null } = {}) {
  return {
    innerText: text,
    textContent: text,
    parentElement: parent,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name)
        ? attributes[name]
        : null;
    },
    matches() {
      return false;
    },
    closest() {
      return closest;
    },
    querySelectorAll() {
      return ratingNodes;
    },
  };
}

const context = {
  console,
  document: { querySelectorAll: () => [] },
  OpponentIntel: { getOpponentElement: () => null },
  isLegacyAutoAdjustEffective: () =>
    Boolean(context.autoAdjust && context.autoAdjust.isEnabled()),
};
vm.createContext(context);
vm.runInContext(
  source.slice(start, end) +
    "\nglobalThis.autoAdjustTestApi = { AutoAdjustRating, parseOpponentRating, getOpponentRating, refreshAutoAdjustOpponentRating };",
  context,
);

const api = context.autoAdjustTestApi;

assert.strictEqual(api.parseOpponentRating("Opponent (2000)"), 2000);
assert.strictEqual(api.parseOpponentRating("1:00 user2000 55%"), null);

const ratingNode = element({
  text: "(2000)",
  attributes: { "data-cy": "user-rating" },
});
const playerRoot = element({ text: "Opponent (2000)", ratingNodes: [ratingNode] });
const username = element({ text: "Opponent", closest: playerRoot });
context.OpponentIntel = { getOpponentElement: () => username };
context.document = { querySelectorAll: () => [playerRoot] };
context.autoAdjust = new api.AutoAdjustRating(1500, storage());
context.autoAdjust.enable();

assert.strictEqual(api.refreshAutoAdjustOpponentRating(), 2000);
assert.strictEqual(context.autoAdjust.getCurrentDifficulty(), 2100);

ratingNode.innerText = "3150";
ratingNode.textContent = "3150";
assert.strictEqual(api.refreshAutoAdjustOpponentRating(), 3150);
assert.strictEqual(context.autoAdjust.getCurrentDifficulty(), 3200);

context.OpponentIntel = { getOpponentElement: () => null };
context.document = { querySelectorAll: () => [] };
assert.strictEqual(api.refreshAutoAdjustOpponentRating(), null);
assert.strictEqual(context.autoAdjust.getCurrentDifficulty(), 1500);

context.autoAdjust.disable();
ratingNode.innerText = "2000";
ratingNode.textContent = "2000";
context.OpponentIntel = { getOpponentElement: () => username };
context.document = { querySelectorAll: () => [playerRoot] };
assert.strictEqual(api.refreshAutoAdjustOpponentRating(), null);
assert.strictEqual(context.autoAdjust.getCurrentDifficulty(), 1500);

assert(
  /data:\s*JSON\.stringify\(\{[\s\S]*?fen:\s*fen,[\s\S]*?elo:\s*currentElo,[\s\S]*?time:\s*chessBot\.time/.test(
    source,
  ),
  "/getmove payload must preserve currentElo",
);

console.log("Auto Adjust Rating tests passed: scoped scrape, +100 delta, clamp, fallback, payload");
