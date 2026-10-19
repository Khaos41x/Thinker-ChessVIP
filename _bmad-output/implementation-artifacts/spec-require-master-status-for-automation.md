---
title: 'Require Thinker Chess master status for all automation'
type: 'bugfix'
created: '2026-10-19'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'dff1f715181e89e3b8142e73a203051cb65073ec'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/SESSION.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Thinker Chess master status toggle is not an actual kill switch: legacy Auto Queue can dispatch a game while status is OFF, and Session Control can start an Auto Farm session and temporarily enable queue/move automation while status is OFF. This violates the expected control hierarchy and can trigger external gameplay actions without the bot being enabled.

**Approach:** Make the master status the mandatory top-level gate for every automation effect and for Auto Farm admission. Reject START visibly while status is OFF, prevent all queue and move effects through both legacy and Session Control paths, and stop an already-running farm safely when the master status is turned OFF.

## Boundaries & Constraints

**Always:** Treat `hint === true` as the runtime master enable signal; re-check it immediately before delayed queue clicks and move dispatches; return a stable `BOT_DISABLED` reason through the existing Session Control toast/warning path; cancel pending legacy queue timers when status becomes OFF; keep saved Auto Queue and Auto Move preferences intact so they resume only after the user deliberately turns status ON again; preserve Session Control persistence, authorization, calibration, leader fencing, drain semantics, and exact queue ownership behavior.

**Ask First:** Any change that resigns, aborts, or otherwise manipulates a live Chess.com game; any change to the meaning or storage key of the master status toggle; any server/API schema change.

**Never:** Start a Session Control snapshot while status is OFF; dispatch queue clicks or automated moves while status is OFF; silently auto-enable the master status when START or Auto Queue is selected; conflate the master switch with the user's stored feature preferences; remove user-visible rejection feedback.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Legacy queue blocked | Status OFF, Auto Queue ON, eligible Chess.com queue UI | No observer/timer dispatches a queue click | UI preference remains ON but inert |
| Farm start blocked | Status OFF, terminal Session Control state, valid farm config | Session remains terminal and no queue starts | Toast/warning shows `BOT_DISABLED` |
| Farm start allowed | Status ON and all existing preflight checks pass | Existing START flow runs unchanged | Existing reason codes remain authoritative |
| Delayed race | Status turns OFF after a queue delay is scheduled | Pending callback re-checks master status and does nothing | Pending/fallback timers are cleared |
| Active farm disabled | Farm active, user turns status OFF | New queue and move effects stop immediately; session enters its safe stop/drain path | Failure to request stop is surfaced/logged without re-enabling effects |
| Remote configuration | Server sync changes status to OFF | Same kill-switch behavior as a direct UI toggle | UI and persisted feature preferences remain consistent |

</frozen-after-approval>

## Code Map

- `script.js` -- owns the `hint` master state, Auto Queue timers/clicks, Session Control bridge, UI bindings, remote config synchronization, and production userscript bundle.
- `frontend/session_control/ui.js` -- presenter-level START availability and reason-code delivery.
- `tests/session_control/ui.test.js` -- hermetic presenter and userscript markup/source invariants.
- `tests/test_auto_queue_fallbacks.js` -- Auto Queue target, fallback, and delayed-dispatch behavior.
- `tests/test_userscript_chrome.js` -- browser-level production START wiring and rendered UI smoke test.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- introduce one master-enabled predicate and enforce it in Session Control START/effective queue/effective move, delayed queue dispatch, timer setup, status-toggle shutdown, and remote status sync.
- [x] `frontend/session_control/ui.js` and generated userscript region -- add presenter availability support for an externally supplied START blocker so `BOT_DISABLED` is visible without native-button deadening.
- [x] `tests/session_control/ui.test.js`, `tests/test_auto_queue_fallbacks.js`, and `tests/test_userscript_chrome.js` -- cover OFF rejection, ON admission, delayed race cancellation, and the real START-to-controller boundary.
- [x] `script.js` -- run the deterministic userscript build after source changes and retain byte-stability.

**Acceptance Criteria:**
- Given master status OFF, when Auto Queue is enabled or START is clicked, then no Chess.com queue action or Session Control session begins and `BOT_DISABLED` is shown for START.
- Given any automation callback captured while status was ON, when status becomes OFF before effect dispatch, then the callback is rejected before touching Chess.com.
- Given an active farm, when status is turned OFF, then automated queue and move effects become false immediately and Session Control follows its safe stop/drain transition.
- Given status is turned back ON, when saved feature preferences remain enabled, then normal behavior can resume without the system having mutated those preferences.

## Spec Change Log

## Design Notes

The master status is an independent runtime safety gate, not another stored feature preference. The strongest design is defense in depth: admission-time rejection, effective-state gating, and dispatch-time revalidation. UI disabling alone is insufficient because remote config changes, restored sessions, observers, and delayed callbacks can bypass a single presentation-layer check.

## Verification

**Commands:**
- `node tests/session_control/run.js` -- expected: all Session Control suites pass, including deterministic build.
- `node tests/test_auto_queue_fallbacks.js` -- expected: queue never dispatches with master status OFF and fallback behavior remains correct when ON.
- `node tests/test_userscript_chrome.js` -- expected: browser smoke proves OFF START rejection and ON production START wiring.
- `git diff --check` -- expected: no whitespace errors.

## Suggested Review Order

**Kill-switch orchestration**

- Centralizes master transitions, safe shutdown, and immediate UI synchronization.
  [`script.js:895`](../../script.js#L895)

- Revalidates master state across queue, move, recovery, and START boundaries.
  [`script.js:250`](../../script.js#L250)

**Admission and feedback**

- Closes asynchronous START commit races with pre/post-commit admission checks.
  [`runtime.js:111`](../../frontend/session_control/runtime.js#L111)

- Makes `BOT_DISABLED` visible while preserving clickable rejection feedback.
  [`ui.js:36`](../../frontend/session_control/ui.js#L36)

**Verification**

- Exercises disabled admission before any context or controller work.
  [`runtime.test.js:110`](../../tests/session_control/runtime.test.js#L110)

- Proves the real browser START path rejects OFF and succeeds ON.
  [`test_userscript_chrome.js:203`](../../tests/test_userscript_chrome.js#L203)

