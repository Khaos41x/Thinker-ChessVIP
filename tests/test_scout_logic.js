const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("script.js", "utf8");
const start = source.indexOf("  const SCOUT_CACHE_TTL");
const end = source.indexOf("  // --- ESTADO DO AUTO RUN DELAY", start);
if (start < 0 || end < 0) throw new Error("OpponentIntel block not found");

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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

(async () => {
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
