---
title: 'Fix userscript UI invisibility on the current Chess.com layout'
type: 'bugfix'
created: '2026-10-04'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: 'aa6b79aecc7c7dcf0ff728fce0ab40f362c192dd'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On the current Chess.com `/play/online` lobby, neither the Thinker configuration entry point nor banner is visible in the initial viewport. The full workspace is intentionally below the fold, but banner discovery can reject the current controller layout, the banner’s absolute low stacking layer can lose to the ad rail, and mount exceptions are silently swallowed.

**Approach:** Keep the full workspace below gameplay, add a small safe launcher that scrolls to it, restore the banner as a fixed high-priority layer anchored only to a validated visible controller/sidebar, and make mount failures observable through bounded internal diagnostics while retaining silent automatic recovery.

## Boundaries & Constraints

**Always:** Preserve the below-fold workspace, Ghost Mode recovery, one-instance mounting, route/bootstrap support, Scout behavior, server/config contracts, board visibility, and zero scroll listeners. Banner and launcher geometry must never intersect the chessboard or controller. Bump the Tampermonkey version after verification.

**Ask First:** Moving the full workspace over gameplay, using a hosted asset, adding a runtime dependency, changing backend APIs, or displaying console errors in normal mode.

**Never:** Select navigation/chat/ad containers as the sidebar, cover the board, duplicate observers/listeners/shells during retries, depend on an opponent or PubAPI response to mount UI, or treat a below-fold panel as a mount failure.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Current lobby | `/play/online`, visible board/controller, ad rail | Launcher is immediately discoverable; banner occupies only safe space beside the controller | Unsafe geometry hides only the banner |
| Hidden stale controller | First known selector is hidden, later candidate is visible | Visible geometrically valid candidate is selected | Reject disconnected, zero-area, or off-viewport nodes |
| Delayed SPA layout | Script starts before board/controller, then hosts appear or are replaced | Exactly one launcher, workspace, banner, and recovery control survive/remount | Watchdog retries without duplicate lifecycle resources |
| Mount exception | Shell insertion or binding throws | Failure is retained internally and mounting retries | Normal mode stays console-silent; debug diagnostics appear on control metadata |
| Ghost Mode | Ghost Mode enabled during initial or remounted layout | Workspace/banner/launcher hidden and recovery control visible | Restoring Ghost Mode off reveals the launcher or visible workspace |
| Narrow viewport | No safe space beside controller | Banner stays hidden and launcher moves to a non-board fallback | Reappears after safe resize |

</frozen-after-approval>

## Code Map

- `script.js` -- metadata, controller discovery, banner geometry/stacking, launcher, mount lifecycle, diagnostics, reconciliation, and Ghost Mode.
- `tests/test_scout_logic.js` -- extraction harness for discovery, geometry, startup recovery, lifecycle ownership, launcher, and Ghost Mode.
- `tests/fixtures/userscript_bootstrap.html` -- realistic delayed `/play/online` layout and SPA replacement browser fixture.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- validate all visible sidebar candidates, restore fixed viewport-safe banner stacking, and add an off-board launcher for the below-fold workspace.
- [x] `script.js` -- centralize mount failure/reset/retry state, expose bounded debug metadata, and prevent duplicate observers/listeners after partial binding failures.
- [x] `tests/test_scout_logic.js` -- replace assertions protecting the absolute/z-index regression and cover hidden-first selection, launcher visibility, mount retry, Ghost Mode, safe geometry, and lifecycle idempotency.
- [x] `tests/fixtures/userscript_bootstrap.html` -- model current 1433×895 lobby geometry, delayed host creation, full SPA host replacement, and optional Ghost/error/network states.

**Acceptance Criteria:**
- Given the supplied 1433×895 lobby layout, when the userscript starts, then a Thinker entry control is visible immediately and does not intersect the board.
- Given a safe right-side slot, when the current controller becomes available, then the fixed banner is visible above page ads without intersecting the board or controller.
- Given delayed or replaced SPA hosts, when reconciliation/watchdog runs, then every Thinker shell exists exactly once.
- Given a mount exception, when the next watchdog cycle runs, then mounting recovers without normal-mode console spam or duplicate lifecycle resources.
- Given Ghost Mode or unsafe width, when visibility conditions change, then the appropriate recovery/launcher/banner state updates deterministically.

## Spec Change Log

## Design Notes

The launcher is navigation, not a second configuration UI: it only reveals and scrolls to the existing workspace. Sidebar selection ranks explicit current-layout candidates first, then the existing board-relative geometry fallback. Fixed banner coordinates remain viewport-relative and use a near-maximum stacking level plus `pointer-events:none`; no scroll listener is introduced.

## Verification

**Commands:**
- `node --check script.js` -- expected: no syntax errors.
- `node tests/test_scout_logic.js` -- expected: all mount, sidebar, geometry, launcher, Ghost Mode, and retry assertions pass.
- `node tests/test_smart_pacer.js` -- expected: auto-move pacing remains green.
- `git diff --check` -- expected: no whitespace errors.

**Manual checks:**
- Serve `tests/fixtures/userscript_bootstrap.html`, open it at 1433×895, and verify delayed mount, SPA replacement, launcher navigation, fixed banner safe geometry, and Ghost recovery.

**Observed browser result (2026-10-04):** At 1433×895 after delayed mount and full SPA replacement, exactly one launcher, banner, menu, and wrapper remained. The fixed banner occupied `(1256,137,156×742)`, the launcher `(167,187,46×46)`, and the workspace began at document y=927; none intersected the board or controller, and the launcher did not obscure the banner. The launcher scrolled the workspace to the viewport, injected mount failure recovered to one shell of each type, and Ghost Mode exposed only `#kb-ghost-recovery`.

## Suggested Review Order

**Layout discovery and safety**

- Validate visible hosts and controller geometry before mounting any surface.
  [`script.js:3004`](../../script.js#L3004)

- Rank the current controller while rejecting board, navigation, chat, and ad candidates.
  [`script.js:3116`](../../script.js#L3116)

**Visible entry and lifecycle recovery**

- Place the launcher only in viewport space not occupied by gameplay or banner.
  [`script.js:3166`](../../script.js#L3166)

- Reconcile exactly one shell through delayed and replaced SPA hosts.
  [`script.js:3301`](../../script.js#L3301)

- Keep the workspace below both viewport fold and live gameplay bottom.
  [`script.js:3359`](../../script.js#L3359)

- Centralize startup guarding, route visibility, watchdog retry, and mount recovery.
  [`script.js:4417`](../../script.js#L4417)

**Regression evidence**

- Exercise current 1433×895 geometry, delayed mounts, replacement, Ghost, and failures.
  [`userscript_bootstrap.html:23`](../../tests/fixtures/userscript_bootstrap.html#L23)

- Assert discovery, geometry, diagnostics, retry, idempotency, and existing Scout behavior.
  [`test_scout_logic.js:277`](../../tests/test_scout_logic.js#L277)
