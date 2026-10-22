---
title: 'Console Layout System Refinement'
type: 'refactor'
created: '2026-10-21'
status: 'done'
review_loop_iteration: 0
baseline_commit: '063ba33fda0374aacb9e0e8de6b4aadd2c4f6293'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The console has fractional geometry, mismatched panel heights, inconsistent form grids and labels, locale-dependent timing values, and an undersized Scout.

**Approach:** Replace presentation layout with one token-driven named grid, shared panel/control primitives, and centralized numeric formatting while preserving all text, identity, state semantics, data flow and behavior.

## Boundaries & Constraints

**Always:** Measure the fixture before/after with `getBoundingClientRect()`. Use integer CSS pixels, `box-sizing:border-box`, 1px borders, Grid/Flex and the required spacing/control/type tokens. Preserve IDs, presenter/backend/storage contracts and Scout actions. Capture 1086, 1280, 1440 and 1920px. Require 0px Visuals/Engine and Scout/Auto Play bottom differences in desktop mode, 12px panel gaps, equal left/right margins, and exactly 12px top inset. Use desktop mode when the measured injection-container width is at least 1034px; stack only when it is below 1034px.

**Ask First:** Any change to semantics, copy, runtime architecture, content order or functionality beyond structural wrappers.

**Never:** Negative margins, absolute-position nudges, fractional layout dimensions, one-off offsets, shadows, glow, neon or decorative gradients.

## I/O & Edge-Case Matrix

| Scenario | State | Expected behavior | Guard |
|----------|-------|-------------------|-------|
| Desktop grid | Injection container ≥1034px | Three columns; 12px gaps; aligned paired bottoms | No overflow/fractional rectangles |
| Narrow grid | Injection container <1034px | Stacked grid; 12px gaps/insets; reachable controls | No viewport-only breakpoint |
| Timing edit | Dot/comma; Enter/blur or persisted hydration | Dot output, two decimals, finite 0.01–10; swap min>max | Invalid intermediate input restores valid pair; persisted out-of-range values clamp before display |
| Strength | Slider/Elo update | 4px fill uses `calc(pct * (100% - 16px) + 8px)` | 16px thumb stays within endpoints |
| Status | Changing phase/W-D-L | Stable 2×2 edges and tabular digits | No clipping or separator glyph |
| Disabled/waiting | Start unavailable/Scout idle | Legible disabled Start; actionless Scout uses dot+text | Preserve Scout control if actually actionable |

</frozen-after-approval>

## Code Map

- `script.js` -- layout assembly, Scout mounts, timing/slider synchronization and visual tokens.
- `tests/test_userscript_chrome.js` -- geometry tables, responsive assertions and screenshots.
- `tests/session_control/ui.test.js` -- deterministic DOM/CSS assertions.
- `tests/artifacts/` -- before/after JSON and visual evidence.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- add the named grid and mount every recreated Scout into it.
- [x] `script.js` -- unify panel titles, 36px rows, sibling-only dividers, labels, fields, toggles, swatch and spacing through tokens.
- [x] `script.js` -- align Auto Play fields/actions/status with shared grids; remove the loose Time Left separator.
- [x] `script.js` -- centralize timing formatting, comma sanitization, min/max swap and Enter/blur commit. Use 0.01–10: the backend configuration UI exposes 0–10, while `/config/save` currently performs no server-side range validation; retain the positive 0.01 floor required by the userscript delay path and clamp persisted values before rendering.
- [x] `script.js` -- implement thumb-compensated strength progress and aligned metadata.
- [x] `script.js` -- keep disabled Start visible (~50% text opacity), auxiliary copy ≥11px/4.5:1, Theme as one 24px bordered swatch, and convert Scout waiting only after proving it has no action.
- [x] `tests/test_userscript_chrome.js` -- assert invariants and capture all required widths; at 1086px record the measured injection-container width and validate whichever mode its 1034px boundary requires instead of assuming desktop.
- [x] `tests/session_control/ui.test.js` -- update structural/style assertions.

**Acceptance Criteria:**
- At 1440px, Visuals bottom equals Engine bottom and Scout bottom equals Auto Play bottom (0px).
- Every panel junction is 12px; every viewport has equal integer left/right margins and 12px top inset.
- Five headings share font, color, height and baseline; control rows are 36px with no trailing divider.
- Control labels use Title Case; uppercase is restricted to panel titles. Stacked field labels are 12px muted.
- Toggles, swatch, inputs and status share each panel's right content edge.
- Auto Play actions align to the three field columns: Start spans columns 1–2; equal Finish/Export split column 3 with 8px gap.
- Status is a 2×2 grid; right cells align right; no loose glyph precedes “Time Left”.
- Disabled Start keeps visible border/text; auxiliary copy computes ≥11px and ≥4.5:1 contrast.
- Move Timing/header always show dot-decimal values from one formatter; Enter/blur and min>max behave as specified.
- At injection-container width 1034px, desktop mode remains active; at 1033px it stacks.
- At 1086px viewport, the report records injection-container width and validates desktop only when that width is ≥1034px, otherwise validates the stacked mode without treating it as failure.
- At 1086/1280/1440/1920, no horizontal scroll, wrapping, fractional layout rectangle or unreachable control exists.
- The final report explicitly states whether “Waiting for opponent” has an action and includes `thinker-console-geometry-after.json` in the same schema as the ANTES JSON.

## Spec Change Log

## Design Notes

Desktop width is 1010px: 345px / 345px / 296px plus two 12px gaps. Use:

```css
grid-template-areas:
  "core     engine   scout"
  "visuals  engine   scout"
  "autoplay autoplay scout";
```

Engine spans rows 1–2, Scout rows 1–3, and Auto Play columns 1–2. Its 676px content box yields three integer 220px fields with two 8px gaps. The Assistant participates with `display:contents`; every Scout render targets the same grid.

## Verification

- `node tests/test_userscript_chrome.js --screenshot` -- geometry and four screenshots pass.
- `node tests/session_control/ui.test.js` -- DOM/CSS contract passes.
- `python scripts/build_userscript.py --check` -- generated region is current.
- `git diff --check` -- clean.
- Manually compare ANTES/DEPOIS tables in their identical JSON schema, inspect all screenshots, and report the verified Scout waiting-state semantics.

## Suggested Review Order

**Layout system**

- Start with the token-driven named grid and shared panel primitives.
  [`script.js:6162`](../../script.js#L6162)

- Review DOM grouping that maps existing controls into stable grid areas.
  [`script.js:6467`](../../script.js#L6467)

- Verify Scout remounts remain inside the shared layout across every state.
  [`script.js:1733`](../../script.js#L1733)

**Responsive and numeric boundaries**

- Confirm breakpoint selection measures the injection container after sizing.
  [`script.js:6584`](../../script.js#L6584)

- Check strict decimal parsing, clamping, swapping, and idempotent persistence.
  [`script.js:6749`](../../script.js#L6749)

**Verification evidence**

- Inspect geometry, contrast, alignment, and breakpoint invariants collected in Chromium.
  [`test_userscript_chrome.js:38`](../../tests/test_userscript_chrome.js#L38)

- Review deterministic DOM/CSS assertions and their executable test entrypoint.
  [`ui.test.js:385`](../../tests/session_control/ui.test.js#L385)
