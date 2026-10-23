---
title: 'External Config workspace and reliable synchronization'
type: 'refactor'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# External Config workspace and reliable synchronization

Historical validation below describes the then-existing project guard, not a Tampermonkey platform requirement. Rating Goal Tracker implementation approval permanently removes that guard; size reporting is informational and no replacement ceiling applies.

## Intent

**Problem:** The external configuration page used the old glowing gradient design, lacked Banner and Recent Form, and reported server connectivity without confirming userscript application. Its polling could overwrite drafts, while userscript polling invoked menu-scoped helpers and silently failed. The Auto Play export label did not explain its diagnostic purpose.

**Approach:** Separate the page into local HTML/CSS/JS assets served by a dedicated Flask blueprint. Match the console's neutral dark surfaces, green accent, borders, typography, and compact controls, with responsive single-column stacking and accessible keyboard focus. Rename the existing action to Export Diagnostics without changing its payload. Preserve engines, evaluation formulas, authorization contexts, console layout, and Session Control contracts.

The API preserves `/config`, `/config/load`, and `/config/save`. Validate partial writes atomically under a lock, reject invalid values and unexpected origins, and keep the existing server default maximum delay of 2.0 seconds. Add revisions and server-instance identifiers, plus `/config/status`; heartbeat acknowledgments explicitly describe one connected tab, not every tab. Configuration remains in memory and resets on server restart, clearly stated in the UI.

The panel serializes and debounces partial saves, retries transient failures, distinguishes permanent validation failures, rejects stale poll revisions, preserves dirty/invalid timing drafts, normalizes decimal commas, swaps minimum/maximum, and handles Enter/blur commits. Switching to Immediate explicitly cancels an invalid timing draft. Userscript saves send changed fields rather than full stale snapshots; timing/strength updates use their actual scope, focused timing inputs are preserved, and application failures are exposed through safe diagnostics.

Validation: six Flask unit tests cover defaults, partial updates, invalid/oversized numeric data, origin rejection, concurrency, timing, acknowledgment and stale server instances. Fourteen Session Control suites and Scout, Banner, move recovery, board detection, and preferences suites pass. A real Flask server and two Chromium tabs exercise both synchronization directions with the real userscript in a local Chess.com DOM fixture, stale polls, disjoint edits, invalid drafts, decimal commas, save retry and offline recovery. Responsive captures cover 1280, 800 and 390 CSS px without horizontal overflow. The expanded export label fits its unchanged 32px button. Deterministic bundle/raster checks pass; userscript is 635135 bytes, below the 640000-byte guard. Authenticated Chess.com and live engine requests were not tested for this UI task. Independent review findings were patched and regression-tested; unrelated knight edits are excluded.

## Suggested Review Order

- Route wiring keeps engine endpoints outside the UI change.
  [app.py:50](../../app.py#L50)
- Atomic validation and revision acknowledgment preserve existing configuration routes.
  [external_config.py:21](../../core/external_config.py#L21)
- Save/poll boundaries prevent stale updates and retain editable drafts.
  [panel.js:68](../../frontend/external_config/panel.js#L68)
- Responsive visual tokens and semantic controls replace the old inline page.
  [index.html:1](../../frontend/external_config/index.html#L1)
- Userscript partial writes avoid clobbering unrelated remote changes.
  [script.js:7067](../../script.js#L7067)
- Real Flask and two browser tabs verify the complete configuration path.
  [test_external_config_chrome.js:1](../../tests/test_external_config_chrome.js#L1)
- Visual evidence includes desktop and narrow layouts.
  [Desktop capture](../../tests/artifacts/external-config-1280.png)
  [Mobile capture](../../tests/artifacts/external-config-390.png)
