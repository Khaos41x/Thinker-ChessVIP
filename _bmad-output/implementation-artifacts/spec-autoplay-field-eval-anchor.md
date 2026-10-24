---
title: Auto Play field placement and page-anchored Eval Bar
type: bugfix
created: 2026-10-23
status: done
baseline_commit: d164c11
---

## Intent

Move the existing Rating Goal input from Engine Control to Auto Play beside session fields. Remove its pointer-focus decoration. Restore Engine Control without changing strength, engine integration or competitive gameplay. Anchor Eval Bar to the page beside its board rather than using a viewport-fixed overlay updated on window scroll.

## Boundaries

Keep saved targets, existing passive semantics, authorization, controller, score normalization, streaming, banner and unrelated artwork untouched. This correction does not implement rating manipulation or session goal automation. Keep keyboard accessibility while removing pointer-focus outlines.

## Code Map

- `frontend/rating_tracker/index.js`, `target-field.js`: mount inside Auto Play fields using matching form presentation.
- `frontend/external_config/index.html`, `panel.css`: place the same input under Auto Play, not Engine Control.
- `frontend/eval_bar/userscript-adapter.ts`, `analysis_lab/src/ui/eval-bar.css`: absolute page-coordinate overlay with positioned-parent handling.
- Existing browser and unit suites: verify placement, focus, synchronous scroll alignment and deterministic bundles.

## Tasks & Acceptance

- [x] Rating Goal is inside Auto Play in both surfaces; absent from Engine Control.
- [x] Pointer focus has no extra outline/shadow; keyboard focus remains identifiable.
- [x] Window scroll keeps board/rail aligned on the first layout read, without remount or position catch-up.
- [x] Resize, orientation and existing analysis tests pass; generated userscript is current.

## Verification

Chromium built-userscript/Flask fixture, Analysis Lab browser fixture, Vitest/typecheck/build, tracker regression and deterministic build checks. No authenticated Chess.com proof claimed without access.

Results: 113 Vitest tests, TypeScript check and production build passed. Tracker Python suites: 53 + 17 + 7 passed (app test requires unrestricted temporary SQLite access). Eight frontend contracts and dedicated field concurrency regression passed. Chromium verifies both Auto Play locations and pointer focus including Tab followed by label click. Scroll tests: 30 synchronous samples in each of five widths (900/959/960/961/1280), zero top/bottom deltas and unchanged page anchors; positioned-body case also zero deltas. Thirty position transitions retain opacity 1 with zero neutral resets and zero remounts. All three deterministic bundle checks and syntax validation pass.

## Review

Review found label clicks could retain keyboard modality; moving pointer detection to the complete field row fixes this and has browser regression coverage. Preserve existing target storage only: this UI correction does not connect the target to playing sessions or implement session achievement/termination.

## Suggested Review Order

- Auto Play placement and shared form field.
  [index.js](../../frontend/rating_tracker/index.js#L23)
  [target-field.js](../../frontend/rating_tracker/target-field.js#L3)
- Page-coordinate anchoring without window-scroll catch-up.
  [userscript-adapter.ts](../../frontend/eval_bar/userscript-adapter.ts#L1164)
- Browser evidence and acceptance assertions.
  [test_eval_bar_v2_chrome.mjs](../../tests/browser/test_eval_bar_v2_chrome.mjs#L289)
  [test_rating_tracker_chrome.js](../../tests/test_rating_tracker_chrome.js#L40)
