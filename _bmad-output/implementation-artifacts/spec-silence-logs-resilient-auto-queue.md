---
title: 'Silence userscript logs and make Auto Queue resilient'
type: 'bugfix'
created: '2026-09-19'
status: 'done'
review_loop_iteration: 0
baseline_commit: '0259b466169bc7fd128a5220ed3e3b7bd40c8257'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Tampermonkey userscript continuously emits routine KrypBot/OpponentIntel/Auto Queue messages, especially from polling and mutation callbacks, and Auto Queue does not reliably start the next game when Chess.com shows a result modal.

**Approach:** Centralize diagnostic output behind a global `const DEBUG = false`, remove direct console calls from hot paths, and replace the Auto Queue trigger with layered result-modal and button detection, a 1.5–2 second delayed robust click, and a per-game guard.

## Boundaries & Constraints

**Always:** Modify only `script.js`; preserve existing feature settings and server integration; keep all userscript-originated console output silent while `DEBUG` is false; detect Chess.com UI variants without requiring DevTools inspection; trigger at most once for one completed game; reset the guard only on URL change or a demonstrably new game state.

**Ask First:** Any change that requires server-side code, database changes, a new dependency, or automatic navigation away from Chess.com's result flow.

**Never:** Touch `users.db`, unrelated pre-existing changes, or the bundled chess engine; globally replace or monkey-patch the browser's `console`; click broad page-level Play/Jogar controls without a confirmed game-over context.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Result modal by selector | Visible `.game-over-modal`, `.board-modal-container`, or known data attribute | Locate the preferred next-game button and schedule one click after 1500–2000 ms | Continue polling if no eligible button is present yet |
| Result modal by text | Visible modal/dialog contains Você ganhou, Você perdeu, Game Over, Draw, or Empate | Treat the game as completed even when Chess.com changed its CSS classes | Normalize case, spacing, and accents before matching |
| Button by selector | Confirmed modal contains a known data-cy/class/primary selector | Prefer a visible enabled control inside the modal | Reject navigation/menu controls and hidden/disabled elements |
| Button by text | Confirmed modal contains Nova, New, Jogar, Play, Nova 1 min, Revanche, or Rematch | Select the first visible matching button/control within the modal | Do not scan broad navigation outside the confirmed modal for generic text |
| Native click unsupported | Target exists but native `.click()` does not advance the UI | Dispatch a bubbling/cancelable/composed `MouseEvent('click')` fallback | Swallow click exceptions without console output |
| Repeated observer/poll events | Result modal causes many DOM mutations | Only one delayed click is scheduled for that game | Keep `queueTriggered` true until URL or game position changes |
| New game starts | URL changes or the active game FEN differs from the completed game | Reset the one-shot guard for the next result | Do not reset merely because the result modal flickers |
| Debug disabled | Routine success, failure, polling, observer, or request activity | No userscript console output | Diagnostic helper becomes a no-op |

</frozen-after-approval>

## Code Map

- `script.js:22-26` -- userscript bootstrap and global constants; location for `DEBUG` and guarded diagnostics.
- `script.js:814-878` -- `OpponentIntel` mutation callback responsible for the observed repeated check messages.
- `script.js:923-925` -- existing unguarded `log()` wrapper used throughout the userscript.
- `script.js:1346-1765` -- current Auto Queue detection, button lookup, clicking, observer, and polling implementation.
- `script.js:2651-2688` -- SPA URL monitor; reset point for per-game Auto Queue state.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- add `DEBUG = false` and guarded debug helpers; route or remove every direct `console.log/info/warn/trace` call so the userscript is silent by default.
- [x] `script.js` -- harden result detection with selector and localized-text fallbacks, including `.board-modal-container`.
- [x] `script.js` -- broaden modal-scoped next-game button matching, implement native click plus `MouseEvent` fallback, enforce the 1500–2000 ms delay, and add `queueTriggered` lifecycle management.
- [x] `script.js` -- connect URL/FEN-based new-game detection to the guard reset without disturbing unrelated polling.
- [x] `script.js` -- validate JavaScript syntax and statically verify that no unguarded console calls remain.

**Acceptance Criteria:**
- Given `DEBUG` is false, when the script's intervals and mutation observers run, then they produce no console messages from the userscript.
- Given Auto Queue is enabled and a supported result modal appears, when an eligible next-game button becomes visible, then exactly one click attempt occurs 1.5–2 seconds later.
- Given the button's native click path is ineffective or throws, when the robust click executes, then a bubbling `MouseEvent('click')` fallback is dispatched.
- Given the same result modal keeps mutating, when observer and polling callbacks repeat, then no second click is scheduled.
- Given Chess.com changes the URL or the active FEN changes after the completed game, when a later game ends, then Auto Queue may trigger once again.

## Spec Change Log

## Design Notes

Generic labels such as Play/New are only safe after a result modal has been confirmed. Selector-based detection may search known unique hooks globally, but generic class/text matches remain modal-scoped. The completed-game FEN is captured when scheduling the click; a changed non-empty FEN provides a stronger same-URL new-game signal than transient modal disappearance.

## Verification

**Commands:**
- `node --check script.js` -- expected: exits successfully with no syntax errors.
- `rg -n "console\\.(log|info|warn|trace|error|debug|table)" script.js` -- expected: no direct console method calls.
- `git diff --check -- script.js` -- expected: no whitespace errors.

## Suggested Review Order

**Trigger safety**

- Confirm game-over context before any queue action is considered.
  [`script.js:1454`](../../script.js#L1454)

- Keep broad selectors scoped to the confirmed result modal.
  [`script.js:1563`](../../script.js#L1563)

**One-shot click lifecycle**

- Delay once, retry transient DOM replacement, and lock only at click time.
  [`script.js:1683`](../../script.js#L1683)

- Prefer native click and dispatch a guarded synthetic fallback only if needed.
  [`script.js:1628`](../../script.js#L1628)

- Reset the guard only after URL or game-state progression.
  [`script.js:1610`](../../script.js#L1610)

**Silent diagnostics**

- Make every existing diagnostic path a no-op while debug is disabled.
  [`script.js:25`](../../script.js#L25)
