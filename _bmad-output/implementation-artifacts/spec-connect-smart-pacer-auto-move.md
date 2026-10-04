---
title: 'Connect SmartPacer to the primary auto-move path'
type: 'feature'
created: '2026-10-03'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: 'db03ea08bed157eb2393ebec1bb1fe9f007cd491'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `SmartPacer` exists and is unit-tested, but the two production auto-move branches still schedule `auto_move_piece` with raw `setTimeout`. As a result, SmartPacer clock parsing, emergency timing, jitter, time-delta adjustment, cancellation, and single-pending-move behavior are not used by the main move path.

**Approach:** Make `auto_move_piece` own both scheduling and final move execution. Its callers will provide the existing base delay, while the routine will collect clock values, derive forced-move state, schedule through the singleton `smartPacer`, and revalidate the requested legal move immediately before execution.

## Boundaries & Constraints

**Always:** Preserve the current `/getmove` request and response contract, move cache, opening book, engine lifecycle, puzzle/play feature gates, zero-delay MAX mode, and `game.move` payload. Keep one pending SmartPacer timer so a newer position cancels a stale scheduled move. Treat `chessBot.time` as seconds and SmartPacer base delay as milliseconds.

**Ask First:** Any change to backend endpoints, engine settings, response shapes, or user-visible delay controls.

**Never:** Add a second engine request, duplicate move execution, retain competing raw `setTimeout` scheduling around `auto_move_piece`, or execute a move that is no longer legal when the timer fires.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Normal scheduled move | Valid move, positive base delay, both clocks available | SmartPacer schedules once using milliseconds and the move executes after pacing | Revalidate the move before execution |
| MAX mode | Valid move and base delay `0` | Execute synchronously without SmartPacer jitter or minimum delay | No timer is retained |
| Forced move or low clock | One legal move or user clock below ten seconds | SmartPacer uses its 150–250 ms emergency range | Invalid clock text falls back to the legacy base delay path |
| Position changes while waiting | A newer auto-move is scheduled before the old timer fires | The old promise is cancelled and only the newest move may execute | Consume `AbortError`; surface other errors through existing logging |
| Missing/stale move | Board/game missing or requested move no longer legal | Do not call `game.move` | Return without throwing into the request loop |

</frozen-after-approval>

## Code Map

- `script.js` -- SmartPacer singleton, legacy delay calculation, `auto_move_piece`, and both cached/fresh `/getmove` auto-move branches.
- `tests/test_smart_pacer.js` -- direct SmartPacer behavior tests and integration guards for the production scheduling path.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- centralize delayed move execution in `auto_move_piece`, build pacing input from current clocks/game state, cancel stale scheduling, and replace both caller-side raw timers.
- [x] `tests/test_smart_pacer.js` -- cover main-path wiring, zero-delay execution, scheduling inputs, cancellation, and stale/illegal move suppression with lightweight stubs or source-level guards where browser internals cannot be instantiated.

**Acceptance Criteria:**
- Given cached or freshly fetched engine moves, when auto-move is enabled with a positive delay, then exactly one `smartPacer.schedule` controls execution.
- Given MAX mode, when a legal move is returned, then `game.move` remains immediate.
- Given a scheduled move becomes stale, when its callback would run, then the routine does not execute it.
- Given SmartPacer cancels an older schedule, when the cancellation promise rejects with `AbortError`, then no unhandled rejection is emitted.
- Given the existing backend and engine tests, when the frontend integration is added, then their public contracts remain unchanged.

## Spec Change Log

## Design Notes

The existing base delay remains the user-facing source of pacing policy. SmartPacer refines that value with clock pressure, forced-move handling, bounded jitter, and cancellation. Clock lookup should prefer the player/bottom and opponent/top displayed clocks; if the DOM cannot provide two parseable values, pass equal numeric fallback values so SmartPacer preserves the base-delay behavior without inventing a clock advantage.

## Verification

**Commands:**
- `node tests/test_smart_pacer.js` -- expected: parsing, pacing, cancellation, and auto-move integration assertions pass.
- `python tests/test_engine_recovery.py` -- expected: `/getmove` serialization and engine recovery remain green.
- `python tests/test_server.py` -- expected: existing backend API behavior remains green.

## Suggested Review Order

**Scheduling contract**

- Centralized move timing, cancellation, FEN validation, and feature-state revalidation.
  [`script.js:2607`](../../script.js#L2607)

- Exact-delay scheduling preserves behavior when Smart Pacing is disabled.
  [`script.js:1738`](../../script.js#L1738)

**Runtime integration**

- Visible top/bottom clocks supply player and opponent pacing inputs.
  [`script.js:2563`](../../script.js#L2563)

- Cached and fresh move paths share one guarded scheduling contract.
  [`script.js:2867`](../../script.js#L2867)

**Verification**

- Integration tests cover conversion, cancellation, stale FENs, and disable transitions.
  [`test_smart_pacer.js:122`](../../tests/test_smart_pacer.js#L122)

- Prior planning boundary now reflects the user-approved live integration scope.
  [`spec-smart-pacer-analysis.md:21`](spec-smart-pacer-analysis.md#L21)
