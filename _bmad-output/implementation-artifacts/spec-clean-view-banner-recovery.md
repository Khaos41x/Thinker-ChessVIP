---
title: 'Complete Clean View and background Banner recovery'
type: 'bugfix'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Complete Clean View and background Banner recovery

## Intent

**Problem:** Hiding the on-page interface deliberately left a floating TC recovery button, and omitted overlays and the own-session HUD. Banner restoration depended on an animation frame, which can remain suspended while the Chess.com tab is in the background, and hidden Banner state was not reconciled after route changes without DOM mutations.

**Approach:** Remove the floating recovery button and migrate mount-error diagnostics to bounded root metadata plus runtime diagnostics. Apply a scoped root Clean View class that hides panels, Scout, own-session and opponent HUDs, Banner, both evaluation renderers, arrows, highlights, launcher and toast, including elements inserted later. Toggle remains exclusive to External Config; underlying preferences and operation are unchanged. Returning from Clean View requests workspace and Banner placement.

Banner positioning bypasses RAF only while the document is hidden; foreground scheduling retains frame coalescing. Eligible hidden Banner instances are reconciled, and URL transitions explicitly request positioning. Existing image, dimensions, 96px cutoff, routes, engine restrictions and responsive geometry are preserved. External Config displays a bounded, non-sensitive Banner status from the latest connected userscript, including Hidden by Clean View, waiting for sidebar and insufficient space. A diagnostic failure cannot block polling.

Validation: a real Flask service and two Chromium tabs with the actual userscript and a local Chess.com DOM fixture confirm complete hiding, native-board visibility, removal of a late-inserted TC button, preservation of Banner preference, background restoration, SPA return from review, and top/base deltas of 0px after scroll/sidebar replacement. The same suite checks two-way sync, stale responses, timing drafts and retry recovery at 1280/800/390px. Seven Flask tests, fourteen Session Control suites, userscript Chromium regression, Scout, Banner, preferences, board-resolution and move-recovery tests pass. Deterministic bundle/raster checks pass; script is 634960 bytes. Independent review identified the own-session HUD omission and an unguarded diagnostic call; both were fixed and covered by regressions. No authenticated Chess.com tab was available; exact live-account behavior remains unverified. Unrelated knight files are excluded.

## Suggested Review Order

- Total visual suppression is separate from functional preferences.
  [script.js:5556](../../script.js#L5556)
- Background tabs do not wait indefinitely for animation frames.
  [script.js:6690](../../script.js#L6690)
- Heartbeat accepts only a bounded Banner state vocabulary.
  [external_config.py:49](../../core/external_config.py#L49)
- External status explains why an enabled Banner may be hidden.
  [panel.js:116](../../frontend/external_config/panel.js#L116)
- Browser evidence exercises late visuals, hidden tabs and restoration.
  [test_external_config_chrome.js:105](../../tests/test_external_config_chrome.js#L105)
  [Validation report](../../tests/artifacts/clean-view-validation.json)
  [Restored Banner](../../tests/artifacts/banner-restored-from-clean-view.png)
