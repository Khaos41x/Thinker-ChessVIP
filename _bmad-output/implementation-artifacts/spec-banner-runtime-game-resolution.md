---
title: 'Banner recovery and page-world game resolution'
type: 'bugfix'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Banner recovery and page-world game resolution

## Intent

**Problem:** Banner's previous false preference was not migrated, CSS-only visibility transitions could leave it hidden, and legacy move discovery/execution could disagree about the board's game object. The previous fixture did not exercise isolated DOM wrappers, stale/offscreen boards or rejection after a scheduled delay.

**Approach:** Apply a one-time visual preference correction, use page-world board discovery and one shared validated game resolver, invalidate stale identities, prioritize onscreen boards without requiring the board to remain onscreen during scrolling, observe scoped board/sidebar visibility ancestors, recover delayed failures, and expose redacted read-only diagnostics. Keep all artwork, banner geometry, 96px cutoff, context restrictions, backend contracts, authentication and engine configurations unchanged. Userscript version is 2026-10-23.1.

## Suggested Review Order

1. [Userscript](../../script.js) — visual migration, shared game resolver, delayed outcome handling, visibility observer and diagnostics.
2. [Board and execution regressions](../../tests/test_game_board_resolution.js) — page versus isolated wrappers, hidden/offscreen clones, inherited properties, in-place game replacement, SPA and delayed rejection.
3. [Chromium regressions](../../tests/test_userscript_chrome.js) — CSS-only board/ancestor visibility recovery, generic board layout, hidden duplicate, off/on preference, reload and recommendation-to-AutoMove pipeline.
4. [Preferences](../../tests/test_visual_preferences.js) — old Banner=false and Recent Form=false migrate to true once; subsequent explicit choices are retained.
5. [Banner tests](../../tests/test_banner_visibility.js) — authorization/geometry rules and token redaction.

## Evidence

- A fresh visual preference revision sets Banner and Recent Form ON independently of the previously installed action-default revision; action defaults are not re-enabled.
- Chromium reproduces a hidden banner after CSS opacity/visibility changes and verifies recovery without resize. Both wc-chess-board and generic .board, including a hidden parent, pass. Hidden clones do not mask the active board.
- Resolver tests model separate isolated and page-world DOM wrappers, verify main-world game discovery, reject stale hidden/offscreen candidates and invalidate an in-place game replacement. Execution reuses that same resolver, including inherited enumerable API slots.
- A delayed execution returning false now releases the FEN latch with backoff. Classic HTTP/auth/network/timeout/abort, V2 error/empty/reject/terminal, stale response, puzzle transition and cached recommendation tests pass.
- Full Chromium fixture: recommendation appears after one simulated network error, exactly two requests, cached AutoMove executes exactly once with no extra request. Banner reconciliation, reload persistence and click/keyboard checks pass.
- Thirty banner viewport/DPR cases preserve the approved geometry and visibility decisions. Fourteen Session Control suites, syntax, whitespace and deterministic artwork/session/Eval Bar checks pass.

## Diagnostics and limits

After installing, the page console can call thinkerChessDiagnostics(). It returns version, route, banner enabled/shown/reason/geometry, Bot and AutoMove requested/effective states, session-active flag, latest request stage/status, authentication-present boolean and game API availability. It exports no token, headers, credential material, user objects or FEN. A regression checks that a fixture capability never appears in serialized diagnostics.

The available browser inventory had no authenticated Chess.com tab. An elevated read-only check found no listener on this execution host's localhost:5050. Consequently actual Tampermonkey isolation, the user's installed script and their real Flask/Komodo process were not directly verified; the report does not equate fixture success with a confirmed live-session repair. User confirmed the failing routes are /play/online and /game/..., both already supported. If the problem persists after installation and reload, the redacted diagnostic output identifies the remaining runtime gate.

Independent review found missing delayed-failure recovery, incomplete observer coverage, offscreen candidate priority and inherited-property regression; all four were patched and covered. No unrelated knight changes were included.
