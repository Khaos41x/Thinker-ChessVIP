---
title: 'Implement opponent Scout and recent-form HUD'
type: 'feature'
created: '2026-09-19'
status: 'done'
review_loop_iteration: 0
baseline_commit: '437d47bf6fc25809f6ec1ab650971fca63d779b6'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The existing `OpponentIntel` code fetches archive indexes and multiple months, uses an unvalidated memory cache, leaves the board HUD disabled, and exposes an oversized panel that does not match the requested recent-form Scout behavior.

**Approach:** Replace it with one asynchronous current-month Chess.com PubAPI request per normalized opponent, a strict 20-minute `localStorage` cache, a compact 10-game W/D/L and streak HUD beside the top player name, and a 50-game Scout panel focused on win rate and favorite openings by color.

## Boundaries & Constraints

**Always:** Use only `https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}`; normalize usernames to lowercase; store exactly `{ timestamp, username, hudStats, scoutStats }` under `tc_scout_${username}`; strictly validate and immediately invalidate corrupt, expired, incomplete, mismatched, or future-dated cache entries; keep requests asynchronous; suppress all errors and hide Scout UI on failure; preserve `DEBUG = false` and emit no console output.

**Ask First:** Any additional API provider, previous-month fallback, server-side proxy, new dependency, or database change.

**Never:** Reuse statistics belonging to a different opponent; block the chess engine/UI; render unescaped remote text; display stale data after a profile/game change; touch `users.db`, engine files, or unrelated workspace changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid cache | Lowercase username matches and age is at most 20 minutes | Render cached HUD and Scout without a request | N/A |
| Invalid cache | JSON corrupt, field missing, username mismatch, invalid statistic, expired/future timestamp | Remove the cache entry and request fresh monthly data | Storage exceptions remain silent |
| Fresh monthly games | PubAPI returns games containing the opponent | Sort newest-first, use up to 10 for HUD and 50 for Scout, then cache and render | Ignore malformed/non-opponent games |
| No profile/games/network | HTTP failure, invalid JSON, empty usable sample, or fetch rejection | Remove `.tc-hud-stats` and `#oi-zone2` | No log and no exception escapes |
| Opponent changes mid-request | Older request completes after a new nickname is detected | Discard the stale response | Keep only current opponent UI |
| Recent streak | Latest consecutive result count is at least three | Show green win, red/blue loss, or neutral draw badge | Hide badge below three |
| Opening absent | PGN lacks opening tags | Group a sanitized initial-move signature when possible | Omit that color when no safe label exists |

</frozen-after-approval>

## Code Map

- `script.js:252-833` -- current-month Scout processing, cache validation, HUD/panel rendering, request cancellation, and nickname observer.
- `script.js:25-31` -- global silent-debug boundary that the new feature must preserve.
- `script.js:2315` -- menu lifecycle entry point that starts the opponent observer.
- `script.js:2577-2592` -- SPA URL-change reset hook for opponent state.
- `script.js:2667-2684` -- Ghost Mode visibility integration for Scout elements.
- `tests/test_scout_logic.js` -- behavioral coverage for processing, cache integrity, observer restart, endpoint construction, and stale-response races.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- replace `OpponentIntel` data processing with newest-first result classification, 10-game HUD stats/streak, and 50-game win-rate/opening aggregation.
- [x] `script.js` -- implement strict lowercase per-user `localStorage` cache loading, validation, TTL invalidation, and silent storage fallback.
- [x] `script.js` -- fetch only the current monthly PubAPI endpoint asynchronously and prevent stale in-flight responses from rendering.
- [x] `script.js` -- inject `.tc-hud-stats` beside the top nickname and render the compact Scout panel with escaped opening labels.
- [x] `script.js` -- make observer, URL reset, errors, and Ghost Mode cleanly remove or restore the correct opponent UI.
- [x] `script.js` -- verify syntax, endpoint exclusivity, cache schema markers, console silence, and whitespace.
- [x] `tests/test_scout_logic.js` -- cover W/D/L processing, streak limits, opening aggregation, corrupt/expired/inconsistent cache, observer restart, endpoint shape, and stale request rejection.

**Acceptance Criteria:**
- Given an opponent nickname appears, when no valid cache exists, then exactly the current-month PubAPI URL is requested without blocking other work.
- Given valid monthly games, when processing finishes, then the HUD shows last-10 W/D/L and only streaks of at least three, while Scout uses at most 50 games.
- Given an opening sample by color, when Scout renders, then the most frequent white and black opening labels and counts are shown safely.
- Given invalid cache or request failure, when the flow completes, then no stale HUD/panel or console message remains.
- Given the opponent changes during a request, when the older response completes, then it cannot replace the current opponent's data.

## Spec Change Log

## Design Notes

Opening classification prefers PGN `Opening`/`ECOUrl` tags and falls back to a short sanitized initial-move signature. A monotonically increasing request version and `AbortController` protect SPA transitions and rapid opponent changes.

## Verification

**Commands:**
- `node --check script.js` -- expected: no syntax errors.
- `node tests/test_scout_logic.js` -- expected: processing, cache, endpoint, observer restart, and request-race assertions pass.
- `rg -n "games/archives|console\\.(log|info|warn|trace|error|debug|table)" script.js` -- expected: no archive endpoint and no direct console method calls.
- `git diff --check -- script.js tests/test_scout_logic.js` -- expected: no whitespace errors.

## Suggested Review Order

1. [`script.js`](../../script.js#L252) -- review cache invariants and result/opening processing first.
2. [`script.js`](../../script.js#L544) -- review asynchronous fetch cancellation and stale-response guards.
3. [`script.js`](../../script.js#L625) -- review HUD/Scout rendering, nickname detection, and observer lifecycle.
4. [`tests/test_scout_logic.js`](../../tests/test_scout_logic.js) -- review behavioral coverage and regression fixtures.
