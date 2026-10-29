---
title: Container-driven responsive display and native browser zoom
type: bugfix
created: 2026-10-29
status: complete
baseline_commit: 6979de2
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="explicit user implementation authorization">
## Intent
Repair existing presentation across browser sizes, zoom and display scales without redesign or changing application behavior. Audit all surfaces before changes; use actual CSS available space, native layout and bounded overlays rather than physical monitor resolution or universal scale transforms.

## Boundaries & Constraints
Preserve authentication, licensing, authorization, API timing, engine selection, recommendation rendering, session control, persisted values and component state. Keep palette, existing artwork, control sizing and typography; reorganize only where space cannot fit. Do not reset user preferences or create a desktop framework. Preserve banner hide threshold96px and normal card geometry. Rebuild generated script deterministically from source modules. Changes to layout only. Browser zoom must be tested separately from viewport/DPR emulation; report unavailable real multi-monitor and authenticated Tampermonkey tests. No push.

## I/O & Edge-Case Matrix
|Scenario|Expected|
|Same CSS console width/different outer viewport|Same grid/timing layout; no exact physical-resolution overrides|
|Narrow or high-zoom viewport|Stack/reflow while controls remain usable; no page horizontal overflow|
|Same-size sidebar translated|Banner follows without reload|
|Short viewport/open engine menu|Menu bounded above/below; internal scroll only when needed|
|Repeated resize/open menu|No accumulated offsets, state or preference loss|
|Teardown/recreate|Observers/listeners/timers disposed; no stale reattachment|
|Display scale/DPR change|Artwork and UI proportions remain container-driven|
</frozen-after-approval>

## Code Map
- frontend/eval_bar/engine-layout.js: console styling and resolution-specific timing rules.
- frontend/responsive/: readable layout source extracted from existing legacy closure, injected through deterministic builder.
- scripts/build_analysis_engine.py: source integration; generated script.js not primary source.
- frontend/external_config/panel.css: responsive field/summary reflow.
- frontend/external_config/engine-picker.js: overlay placement and lifecycle.
- analysis_lab/src/styles.css: analysis lab and import dialog.
- tests/responsive_fixture.py: host-responsive faithful userscript fixture plus actual Flask routes.
- tests/browser/test_responsive_display.mjs: native Chrome zoom profiles, window resizing, all surfaces.

## Tasks & Acceptance
- [x] Inventory all surfaces, persisted positions and real layout defects.
- [x] Confirm findings with baseline browser measurements/screenshots.
- [x] Eliminate viewport-specific console track overrides using available container space.
- [x] Repair banner translation tracking and layout lifecycle cleanup.
- [x] Bound popovers to available visual viewport and preserve keyboard behavior.
- [x] Reflow narrow Config/console fields and lab panels without shrinking controls indefinitely.
- [x] Native zoom67/75/80/90/100/110/125/150/175/200%, five specified sizes and unmaximized cases.
- [x] Dynamic resize while menus/dialogs open; preference round trip and no drift.
- [x] Real engine/authorization/picker/session regression checks and deterministic builds.
- [x] Report actual cases, before/after, source files, physical-monitor/authenticated limitations.

Given the same usable container width, columns must remain consistent independent of physical monitor or outer viewport. Given sidebar translation or resize, banner catches up within a coalesced layout frame. Given a tiny viewport, content reflows or scrolls locally and stays reachable. No claims for unexecuted scenarios.

## Verification
Actual Chromium/Chrome isolated profiles use native default zoom levels and Browser.setWindowBounds; visualViewport.scale remains1 and DPR reflects native browser zoom. This is separate from synthetic layout/DPR tests. Exercise real Flask metadata/config APIs and the existing Vite app without interacting with an actual competitive game. Snapshot public/synthetic fixture data only. Source build checks and existing engine/recommendation/session tests remain required.

## Review disposition

Independent blind and edge-case reviews completed. Fixed hidden/undersized sidebar observation and banner offsetParent lookup while display:none. Edge-case review returned no remaining findings. No production authorization or runtime changes.

## Suggested review order

1. docs/RESPONSIVE_DISPLAY.md and responsive-display/REPORT.md for causes, actual matrix and limitations.
2. frontend/responsive/ and scripts/build_analysis_engine.py for coalesced layout, container rules and teardown.
3. frontend/external_config/engine-picker.js and panel.css for overlay and narrow layout.
4. Native zoom and lifecycle tests, regression reports, then generated script.js.
