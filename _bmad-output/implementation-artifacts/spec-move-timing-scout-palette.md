---
title: 'Move Timing focus and Scout palette polish'
type: 'bugfix'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Move Timing focus and Scout palette polish

Historical validation below describes the then-existing project guard, not a Tampermonkey platform requirement. Rating Goal Tracker implementation approval permanently removes that guard; size reporting is informational and no replacement ceiling applies.

## Intent

**Problem:** Numeric Move Timing fields retained pointer focus decoration after the earlier segmented-control fix. The Scout chart used cool gray-blue losses and insufficiently distinct result and side markers.

**Approach:** Extend the existing pointer-modality CSS boundary to the numeric field shells while preserving keyboard focus. Keep the chart proportions and statistics intact; use green `#22D36B`, warm white `#F2F2EE`, neutral gray `#8B8C86`, thin background-colored segment separators, and explicit white/black side markers. Result colors meet 4.5:1 contrast against `#252523`; draw/loss contrast meets 3:1. A single-result chart has no artificial separators.

Validation: Chromium fixture tests cover pointer clicks, text insertion and Enter commit, keyboard focus, populated Scout colors and separators, Banner persistence, and UI regressions. Scout unit tests cover counts, palette contrast, zero-width categories, caches, races, and chart legend consistency. Fourteen Session Control suites and Banner, board-resolution, move-recovery and preferences tests pass. Embedded bundle and raster build checks pass; userscript remains below 640000 bytes. Real authenticated Chess.com was not used for this scoped UI validation. Independent review found one test assertion API mismatch, corrected before final validation; no production findings remained. Existing unrelated knight changes are excluded.

## Suggested Review Order

- Pointer-only focus override preserves keyboard visibility.
  [script.js:6355](../../script.js#L6355)
- Palette and separators preserve the actual W/D/L proportions.
  [script.js:1922](../../script.js#L1922)
- Unit checks cover contrast, chart thresholds, and single-category rendering.
  [test_scout_logic.js:418](../../tests/test_scout_logic.js#L418)
- Chromium exercises real input interaction and captures the populated Scout.
  [test_userscript_chrome.js:1230](../../tests/test_userscript_chrome.js#L1230)
- Visual evidence uses hermetic public-game fixture data, not fabricated production statistics.
  [Scout screenshot](../../tests/artifacts/thinker-scout-palette-after.png)
