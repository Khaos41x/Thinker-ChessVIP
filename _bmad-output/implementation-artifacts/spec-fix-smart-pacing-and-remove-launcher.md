---
title: 'Make Smart Pacing genuinely adaptive and remove the floating launcher'
type: 'bugfix'
created: '2026-10-04'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '5832994'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Smart Pacing currently collapses toward an approximately one-second delay because missing Chess.com history permanently selects the opening branch, live clock selectors often fall back to exact delay, and the final scheduler receives a hard-coded complexity multiplier. The normal-mode floating `TC` launcher is also visually intrusive and unwanted.

**Approach:** Replace the split, fragile delay policy with one coherent SmartPacer decision built at scheduling time from robust clock discovery, FEN-derived move phase, legal-move structure, current-position evaluation, clock balance/pressure, forced-move state, and bounded human variability. Remove the normal floating launcher and all lifecycle dependencies while retaining the separate Ghost Mode recovery escape hatch.

## Boundaries & Constraints

**Always:** Preserve `auto_move_piece` as the only scheduler/executor; cancellation, expected-FEN, legal-move, automation-state, and game-instance guards; synchronous MAX mode; cached/fresh `/getmove` branches; opening book, engine lifecycle, and backend response contracts. Produce materially different, bounded delays for opening, quiet, complex, forced, clock-ahead, clock-behind, and time-trouble states. Keep the configuration workspace below gameplay, banner static beside notation, and Ghost Mode recoverable.

**Ask First:** Adding a second engine request, changing `/getmove` or `/eval` response shapes, changing backend engine settings, or removing the Ghost-only recovery control.

**Never:** Use a fixed default as the normal Smart Pacing result, infer phase solely from optional `getHistory()`, use the lower of both clocks as the player's time, apply stale evaluation to a new FEN, retain a normal-mode `TC` launcher, add caller-side move timers, or weaken stale-move protections.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Complex middlegame | Many legal choices, balanced current eval, healthy clock | Clearly longer think time than opening or forced move, with bounded variation | Missing optional signals degrade individually, not to fixed delay |
| Quiet opening/endgame | FEN fullmove/phase plus low tactical branching | Short-to-moderate humanized delay appropriate to phase | Missing history does not force opening forever |
| Time pressure | Player clock below 10 seconds or materially behind | Fast emergency/survival timing | Opponent low clock must not be mistaken for player low clock |
| Clock advantage | Player has meaningful time surplus | May spend more time, capped by clock-safe budget | Never consume an unsafe share of remaining time |
| Forced/stale move | One legal move, changed FEN, disabled automation, or replaced game | 150–250 ms only when valid; otherwise no execution | Cancel superseded schedule and consume `AbortError` |
| Missing clocks | Current DOM has fewer than two parseable clocks | Use phase/position intelligence with conservative clock-neutral assumptions | Do not switch to exact fixed delay |
| Normal UI | Supported Chess.com route | No `#thinker-chess-launcher` exists | Watchdog remains stable without launcher dependency |
| Ghost Mode | Hidden Thinker surfaces | Ghost-only recovery remains available | Restoring mode does not recreate normal launcher |

</frozen-after-approval>

## Code Map

- `script.js` -- SmartPacer policy, clock/FEN/eval snapshot, auto-move scheduling, launcher lifecycle, Ghost recovery, and watchdog.
- `tests/test_smart_pacer.js` -- deterministic pacing scenarios and production-path safety contracts.
- `tests/test_scout_logic.js` -- UI lifecycle and explicit absence of the normal launcher.
- `tests/fixtures/userscript_bootstrap.html` -- realistic delayed/replaced Chess.com shell used for browser verification.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- unify Smart Pacing into one scheduling-time decision, add robust current-layout clock discovery and player/opponent identity, derive phase from FEN when history is absent, guard eval by FEN, model positional/clock signals, and preserve execution safety.
- [x] `script.js` -- remove the normal launcher, its geometry/state/reconciliation/watchdog coupling, and keep only Ghost Mode recovery.
- [x] `tests/test_smart_pacer.js` -- prove materially distinct bounded timing across representative phases, complexity, clock pressure/balance, missing clocks, forced moves, and stale/cancelled schedules.
- [x] `tests/test_scout_logic.js` and fixture -- prove no normal launcher is created and SPA/Ghost/banner/workspace recovery remains stable.

**Acceptance Criteria:**
- Given deterministic random input, when representative opening, quiet middlegame, complex middlegame, time-trouble, clock-ahead, and forced contexts are evaluated, then delays follow the intended relative ordering rather than clustering near one second.
- Given current Chess.com clock variants or unavailable clocks, when a move is scheduled, then valid clocks affect pacing and missing clocks retain positional adaptation.
- Given current-position evaluation, when the FEN changes, then stale eval does not influence the new decision.
- Given repeated SPA/watchdog cycles, when normal mode is active, then menu/banner remain single-instance and no floating launcher exists.
- Given the existing SmartPacer and Scout regressions, when the change is complete, then engine/backend public behavior remains unchanged.

## Spec Change Log

- Review hardened live clock discovery against nested duplicates, hidden/stale SPA nodes, and unrelated page clocks; malformed FEN now stays neutral, and emergency timing is capped against the player's remaining milliseconds. Preserved the single SmartPacer policy, MAX immediacy, stale-move guards, and Ghost-only recovery.

## Design Notes

SmartPacer should return one explainable final delay, not refine another pseudo-smart delay. Inputs are a snapshot captured for the exact scheduled FEN. Clock pressure constrains the upper budget; positional phase and branching shape the center; forced moves override; bounded noise prevents mechanical repetition. Missing data uses neutral values per signal so other intelligence remains active.

The removed launcher is the always-visible `#thinker-chess-launcher`. `#kb-ghost-recovery` remains intentionally because Ghost Mode otherwise has no safe way back.

## Verification

**Commands:**
- `node --check script.js` -- expected: no syntax errors.
- `node tests/test_smart_pacer.js` -- expected: adaptive scenario ordering and scheduling safety pass.
- `node tests/test_scout_logic.js` -- expected: UI lifecycle passes with zero normal launchers.
- `git diff --check` -- expected: no whitespace errors.

**Manual checks:**
- Serve the fixture at 1433×895 and verify banner/workspace/SPA/Ghost recovery with no visible normal-mode `TC` button.

**Observed:** At 1433×895 after delayed mount and SPA replacement, the menu, wrapper, and fixed banner remained single-instance; `#thinker-chess-launcher` count stayed zero. In Ghost Mode, normal surfaces were hidden and only `#kb-ghost-recovery` was visible.

## Suggested Review Order

**Adaptive pacing decision**

- Start with the single bounded policy combining phase, branching, evaluation, and clock pressure.
  [`script.js:1688`](../../script.js#L1688)

- Inspect scoped clock discovery, visibility filtering, deduplication, and player-clock selection.
  [`script.js:2470`](../../script.js#L2470)

- Review FEN phase validation and stale-evaluation isolation.
  [`script.js:2550`](../../script.js#L2550)

**Safe move execution**

- Verify MAX immediacy, scheduling snapshot, cancellation, and final stale-state guards.
  [`script.js:2573`](../../script.js#L2573)

- Confirm cached and fresh engine paths share the same scheduling owner.
  [`script.js:2825`](../../script.js#L2825)

**Clean UI lifecycle**

- Confirm Ghost recovery remains while the normal launcher and watchdog dependency are absent.
  [`script.js:3147`](../../script.js#L3147)

**Regression evidence**

- Review deterministic timing, clock DOM, malformed input, and execution-safety scenarios.
  [`test_smart_pacer.js:1`](../../tests/test_smart_pacer.js#L1)

- Review single-instance SPA/Ghost behavior and explicit launcher absence.
  [`test_scout_logic.js:278`](../../tests/test_scout_logic.js#L278)
