---
title: 'Fix Session Control visual fidelity'
type: 'bugfix'
created: '2026-10-21'
status: 'done'
baseline_commit: '4e6b1b94a544210093bcc075c4ab4230be56b6a7'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The approved premium overhaul is present functionally, but the real Chess.com screenshot remains visually almost indistinguishable from the old UI. Tiny typography, a narrow 268px card, opaque internal blocks, dense separators, weak elevation, and an oversized empty Scout state neutralize the glass effect.

**Approach:** Correct the perceptual implementation, not the architecture: establish a visibly premium 320px design system, stronger hierarchy and spacing, translucent internal surfaces, a centered intentional Scout empty state, and measurable browser assertions that distinguish the result from the previous flat UI.

## Boundaries & Constraints

**Always:** Preserve the minimal Presenter metrics, advanced disclosure, IDs, values, focus behavior, START/STOP/export wiring, Session Control state, Scout data content, and footer workspace positioning. Keep the requested `rgba(20, 20, 25, 0.65)`/16px blur/20px radius foundation, but make glass perceptible through restrained highlights, translucent inner surfaces, elevation, larger typography, and spacing. Use system fonts and accessible contrast. Keep the main and Scout cards visually coherent and balanced.

**Ask First:** Any change to configuration defaults, visible product features, status semantics, Scout data, or page/board geometry.

**Never:** Modify DTOs, reducer, IndexedDB, Web Locks, telemetry, DDA/calibration math, authorization, engines, lifecycle, or the `#oi-wrapper` absolute footer-placement algorithm. Never fake data or replace the existing component architecture.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Routine view | Advanced settings collapsed | Card is visibly wider and more spacious; status is readable; technical controls remain hidden | No change to presenter reads or actions |
| Advanced view | Gear expanded | Controls appear inside a coherent translucent inset without layout clipping | Existing validation and focus isolation remain intact |
| Scout waiting/unavailable | No opponent or failed history | Centered, intentional visual state fills the card without a large dead void | Retry and close remain operational |
| Reduced motion | OS preference enabled | Hierarchy remains intact with animations disabled | No hidden content becomes inaccessible |

</frozen-after-approval>

## Code Map

- `script.js` -- source visual tokens, panel geometry, Session Control hierarchy, Scout empty-state markup, and generated userscript.
- `tests/session_control/ui.test.js` -- deterministic markup/CSS contract and footer-geometry guard.
- `tests/test_userscript_chrome.js` -- computed-style, layout, disclosure, and production wiring smoke.
- `scripts/build_userscript.py` -- deterministic embedded Session Control generator.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- replace the compact flat skin with a perceptibly different premium surface while preserving all behavior.
- [x] `script.js` Scout renderers -- create coherent waiting/loading/unavailable presentation without changing data or retry logic.
- [x] `tests/session_control/ui.test.js` -- lock measurable width, type scale, translucent inner surfaces, and preserved wrapper positioning.
- [x] `tests/test_userscript_chrome.js` -- assert computed geometry and visual hierarchy in Chromium alongside existing behavior.
- [x] Deterministic build -- rebuild twice and verify byte identity.

**Acceptance Criteria:**
- Given the same Chess.com footer context shown in the screenshot, when the UI mounts, then the main card is 320px wide, uses visibly elevated glass, and the four status values are legible without exposing technical telemetry.
- Given waiting or unavailable Scout content, when it renders, then the card presents a centered visual state rather than top-aligned copy above an empty 500px region.
- Given the previous UI baseline, when computed styles are compared, then card width, title/metric type scale, internal surface transparency, padding, and elevation materially differ while all interaction tests remain green.

## Spec Change Log

- 2026-10-21: Resolved review findings for narrow viewports, Scout states, minimized geometry, motion preferences, and visual evidence.

## Design Notes

The screenshot is the acceptance evidence: glass cannot be judged only by `backdrop-filter`. On Chess.com's nearly uniform footer background, hierarchy must come from width, translucent layering, edge highlights, spacing, and type scale. The Scout should visually balance the main card without inventing opponent data; a decorative CSS radar/orb may indicate waiting while remaining `aria-hidden`.

## Verification

**Commands:**
- `node tests/session_control/run.js` -- full Session Control suite passes.
- `node tests/test_userscript_chrome.js` -- computed visual metrics and interactions pass in Chromium.
- `python scripts/build_userscript.py` twice with SHA-256 comparison -- byte-identical userscript.
- `node --check script.js` and `git diff --check` -- valid clean output.

## Suggested Review Order

**Visual system**

- Start with the shared glass tokens and footer workspace geometry.
  [`script.js:5497`](../../script.js#L5497)

- Review the main and Scout card surfaces, hierarchy, and elevation.
  [`script.js:5674`](../../script.js#L5674)

- Inspect the hero TTL, friendly status, score, and Win Rate composition.
  [`script.js:5826`](../../script.js#L5826)

**State resilience**

- Verify waiting, unavailable, retry, and loading Scout presentations share one system.
  [`script.js:1736`](../../script.js#L1736)

- Confirm cards stack without horizontal clipping on narrow viewports.
  [`script.js:5880`](../../script.js#L5880)

**Evidence and regression protection**

- Chromium asserts computed hierarchy, interactions, responsive layout, and captures evidence.
  [`test_userscript_chrome.js:220`](../../tests/test_userscript_chrome.js#L220)

- Hermetic checks lock the premium layout without exposing technical Presenter fields.
  [`ui.test.js:260`](../../tests/session_control/ui.test.js#L260)

