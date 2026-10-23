---
title: 'Post-game banner persistence and pointer focus polish'
type: 'bugfix'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Post-game banner persistence and pointer focus polish

## Intent

**Problem:** User screenshots show an enabled banner missing on a /game/... page after resignation. shouldShowThinkerBanner explicitly rejected Game Review sidebar text and visible game-over dialogs. Mouse clicks on timing segments and Auto Play inputs also retained keyboard-like focus outlines.

**Approach:** Remove the post-game evidence gate for the decorative banner only. Keep route exclusions for analysis/review pages, Ghost Mode, user toggle, 96px space limit, geometry and ResizeObserver unchanged. Track pointer versus Tab navigation so mouse editing has no outline/accent-border/background change while keyboard focus remains visible. Preserve selected segment fill, values, editing, commit handling and all engine/session behavior. Version: 2026-10-23.2.

## Suggested Review Order

1. [Userscript](../../script.js) — banner predicate, pointer-only CSS and lifecycle-cleaned Tab listener.
2. [Banner regression](../../tests/test_banner_visibility.js) — Game Review text and modal no longer hide the enabled banner; analysis/review exclusions remain.
3. [Chromium interaction](../../tests/test_userscript_chrome.js) — post-game modal/sidebar reproduction, toggle off/on, five native mouse focus checks and keyboard reentry from outside console.

Validation passed: full Chromium userscript smoke; each Random/Immediate label and all three Auto Play inputs have outline-style none and normal border rgb(58,58,54) after native mouse clicks. Auto Play input background remains rgb(29,29,27). Tab from outside the console restores a visible keyboard focus indicator. Banner remains visible with Game Review/modal, hides on user OFF and restores on ON. All 30 responsive cases preserve geometry; 14 Session Control suites and move, board-resolution, preference, syntax, deterministic bundle and whitespace checks pass.

Independent review identified the outside-console Tab reentry gap; the handler was moved to document with cleanup on unmount and regression coverage. Browser verification uses a local Chromium fixture, not the user's authenticated Chess.com session. No engine, backend, console grid, spacing, artwork or dimensions changed.
