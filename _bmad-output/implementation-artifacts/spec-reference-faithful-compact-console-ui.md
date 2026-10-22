---
title: 'Reference-faithful compact console UI'
type: 'refactor'
created: '2026-10-21'
status: 'done'
baseline_commit: 'b76034098ee58b08ac64fd93e06af966d10481e2'
review_loop_iteration: 0
context:
  - 'AGENTS.md'
  - '_bmad-output/implementation-artifacts/spec-phase-08-1-ui-ux-correction-pass.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Phase 08.1 interface is visually clean but does not resemble the supplied Thinker Chess reference. It still reads as a tall, rounded SaaS card with prominent product chrome, stacked disclosures, and large controls instead of the compact, integrated control console shown below the Chess.com board.

**Approach:** Remove the Phase 08/08.1 visual system and rebuild only the presentation layer in the reference's language: low rectangular modules, charcoal surfaces close to the page background, subtle one-pixel dividers, small uppercase section captions, tight horizontal rows, compact switches, thin sliders, restrained cyan/green state accents, and two primary columns. Preserve every operational feature and render Opponent Scout as an additional module in the same visual system rather than deleting it.

## Boundaries & Constraints

**Always:** Treat the supplied screenshot as the visual authority; preserve the existing English en-US copy; keep all current controls and saved values; group `Bot`, `Auto Moves`, and `Auto Queue` under `CORE`; group `Auto Rating`, `Strength Level`, `Move Timing`, and `Smart Pacing` under `ENGINE CONTROL`; place `Evaluation Bar` and `Theme` under `VISUALS`; place existing session actions and truthful status/counts under a compact `AUTO PLAY` module; keep Opponent Scout functional and restyle it consistently; retain keyboard access, focus indicators, close/restore behavior, responsiveness, and native proportional slider semantics.

**Ask First:** Removing a feature, changing its dependency/default, changing a persisted key, changing Session Control semantics, or changing how Scout obtains or interprets data.

**Never:** Delete repository history or non-UI code; modify Flask, engines, DTOs, reducers, IndexedDB, telemetry, authorization, rating math, matchmaking, Eval Bar behavior, or automation semantics; reintroduce glassmorphism, large pill cards, oversized product headers, decorative gradients, fixed panel heights, or Portuguese UI text; push remotely.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Default console | Bot and automation off | Two compact primary columns with neutral controls and no wasted vertical area | Existing blockers remain authoritative |
| Active controls | Any switch enabled | Only the active switch/state receives the reference green/cyan accent | Inactive saved settings remain neutral |
| Move Timing | Auto Moves off/on | Timing remains visible and editable in Engine Control; inactive dependency is conveyed without hiding it | Saved values and Random/Immediate mode persist |
| Auto Play | IDLE, active, terminal | Compact truthful status, timer, score, and win rate remain visible | Warnings remain bounded and non-blocking |
| Scout | Waiting, loading, unavailable, populated | Compact module grows only with real content and shares the console styling | Retry remains available when appropriate |
| Responsive | Narrow and zoomed viewports | Columns wrap into a readable stack without clipping or horizontal overflow | Every control remains keyboard reachable |

</frozen-after-approval>

## Code Map

- `script.js` -- Assistant/Scout markup, module grouping, console styling, responsive layout, and interaction bindings.
- `frontend/session_control/ui.js` -- existing English status projection; preserve unless presentation requires a label-only adjustment.
- `tests/session_control/ui.test.js` -- static UI, localization, truthful state, and preserved-binding contracts.
- `tests/test_scout_logic.js` -- waiting/populated Scout rendering contracts.
- `tests/test_userscript_chrome.js` -- computed-style, geometry, keyboard, responsive, restore, and visual evidence.
- `scripts/build_userscript.py` -- deterministic generated Session Control region.

## Tasks & Acceptance

**Execution:**

- [x] `script.js` -- replace Phase 08/08.1 card/disclosure markup and CSS with the reference-faithful CORE, VISUALS, ENGINE CONTROL, AUTO PLAY, and SCOUT modules while preserving control IDs and handlers.
- [x] `script.js` -- implement dense two-column desktop layout, compact rectangular rows/switches/sliders/inputs, subtle headings/dividers, and responsive stacking without fixed heights.
- [x] `script.js` -- remove visual remnants of glassmorphism, oversized header/launcher treatment, pill-heavy controls, decorative shadows/gradients, and unnecessary progressive disclosure.
- [x] `tests/session_control/ui.test.js` and `tests/test_scout_logic.js` -- update semantic and localization assertions without weakening architecture or behavior coverage.
- [x] `tests/test_userscript_chrome.js` -- validate computed reference tokens, control visibility, keyboard interaction, close/restore, state fidelity, viewport/zoom matrix, and matched before/after screenshots.
- [x] `script.js` -- regenerate twice and prove byte-identical output.

**Acceptance Criteria:**

- Given the 1440×778 fixture, when the default console renders, then its visual hierarchy, density, column proportions, switch treatment, section captions, dividers, and page integration visibly match the supplied reference rather than Phase 08.1.
- Given any preserved feature, when the redesign is complete, then the same control remains reachable and produces the same persisted and runtime behavior.
- Given active and inactive states, when compared, then accent color communicates operational state only and no neutral container looks active.
- Given required viewport and zoom combinations, when panels mount, close, restore, and wrap, then no control clips, overlaps, disappears, or causes horizontal overflow.
- Given the final artifact, when audited, then all user-facing Assistant and Scout text remains concise English en-US.

## Spec Change Log

- Review patches: corrected the 848/849 px workspace breakpoint and sub-588 px width specificity; restored keyboard reachability for Move Timing radios and focus continuity after workspace restore; blocked disabled switch toggles; compacted populated Scout and puzzle states; bounded narrow-viewport toasts; added clean baseline/default captures and populated-Scout assertions.

## Design Notes

The reference is a compact embedded console, not a floating modal. Primary geometry is square-to-soft (roughly 2–6 px radii), shadows are absent or nearly invisible, spacing is 8–12 px, captions are small uppercase with letter spacing, and rows favor label-left/control-right alignment. The Chess.com page background should remain visually dominant. Product identity is available through the existing restore mechanism but must not dominate the expanded console.

## Suggested Review Order

**Console composition**

- Start with the compact surface, module geometry, and visual token overrides.
  [`script.js:5961`](../../script.js#L5961)

- Review how existing controls are regrouped without changing IDs or handlers.
  [`script.js:6271`](../../script.js#L6271)

**Interaction and responsive boundaries**

- Confirm collapse/restore preserves both panels and keyboard focus continuity.
  [`script.js:5373`](../../script.js#L5373)

- Verify Move Timing remains keyboard-accessible in its compact segmented control.
  [`script.js:6041`](../../script.js#L6041)

- Check stacked layout and width specificity across the 848/849 px boundary.
  [`script.js:6086`](../../script.js#L6086)

**Scout states**

- Inspect populated Scout’s dense chart, rows, typography, and unchanged data semantics.
  [`script.js:1891`](../../script.js#L1891)

**Verification evidence**

- Follow the Chromium viewport matrix, focus checks, and default-state screenshot capture.
  [`test_userscript_chrome.js:515`](../../tests/test_userscript_chrome.js#L515)

- Review populated-Scout regression assertions against legacy oversized geometry.
  [`test_scout_logic.js:442`](../../tests/test_scout_logic.js#L442)

- Confirm static assembly, localization, and preserved architecture contracts.
  [`ui.test.js:341`](../../tests/session_control/ui.test.js#L341)

## Verification

**Commands:**

- `node tests/session_control/run.js`
- `node tests/test_scout_logic.js`
- `node tests/test_userscript_chrome.js --screenshot`
- `python tests/test_server.py`
- `python scripts/build_userscript.py` twice with SHA-256 comparison
- `git diff --check`

**Manual checks:**

- Compare the supplied screenshot and final 1440×778 capture for module placement, density, color restraint, typography, switch geometry, and integration with the Chess.com surface.
