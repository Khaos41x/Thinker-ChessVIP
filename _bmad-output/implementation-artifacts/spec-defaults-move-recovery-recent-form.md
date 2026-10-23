---
title: 'Safe defaults, move recovery and Recent Form visibility'
type: 'bugfix'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Safe defaults, move recovery and Recent Form visibility

## Intent

**Problem:** Persisted old settings could select Immediate and enable action features; failed move requests and action-mode changes could latch the current FEN; switch focus outlines appeared after mouse clicks; the opponent history HUD had no visibility preference.

**Approach:** Apply a one-time v6 safe-default migration (Random, action features OFF, existing visual preferences retained; Banner and Recent Form default ON when absent). Preserve subsequent explicit user choices. Add Recent Form to Visuals with local persistence, guarding only the small HUD, not Scout data. Use focus-visible for keyboard outlines and explicitly suppress mouse-only outlines. Release failed FEN latches with a 1-second retry backoff, reject stale context responses, and invalidate same-FEN action state on local/external/puzzle mode changes. Cover V2 errors without retrying terminal positions. Keep backend authentication, existing operational restrictions, engine configuration and banner artwork/layout unchanged.

## Suggested Review Order

1. [Userscript](../../script.js) — defaults, request_move recovery, HUD guard, toggle bindings and focus rules.
2. [Recovery tests](../../tests/test_move_recovery.js) — eight classic failure modes, stale responses, cached action transition, V2 and puzzle regressions.
3. [Preference tests](../../tests/test_visual_preferences.js) — migration from old enabled/Immediate settings, no repeated resets, and HUD hide/re-render.
4. [Chromium interaction](../../tests/test_userscript_chrome.js) — safe startup, actual DOM arrows after a simulated network failure, cached Auto Move dispatch to an offline fake board, Recent Form and native mouse outline checks.

## Evidence and limitations

Confirmed code defects: checkfen was retained after authentication/HTTP/parse/timeout failures, preventing retries on the same position. Local/external Auto Move changes did not invalidate that latch after a hint; V2 error plans also retained it. Reset marker v5 allowed old Immediate/enabled preferences to survive unchanged. Focus-within drew pointer outlines; focus-visible now limits them to keyboard usage.

Chromium fixture result: arrows=true, requests after one failure=2, moves=1, requests after cached execution=2, Recent Form off/on=true; mouse focusVisible=false and outlineStyle=none. The fixture performs no real online moves. Backend source/contracts were not changed. No local process listening on port 5050 was available during this run, and the authenticated user's Tampermonkey/Chess.com session was not accessed. Thus actual server engine availability and the user's precise original runtime failure are not claimed verified.

Passed: move recovery, visual preferences, banner unit regression, 14 Session Control suites, full Chromium userscript interaction/responsiveness smoke, deterministic banner/session/Eval Bar checks, syntax and whitespace checks. Independent review identified V2, external-config and puzzle-transition gaps; all were patched with regression coverage. Existing unrelated knight files were preserved.
