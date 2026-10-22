---
title: 'Pixel-Perfect Console Polish'
type: 'refactor'
created: '2026-10-21'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'b33d99d353e413c8fbd393c2eea5f2f01c396030'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The compact console has the correct footprint and information architecture, but its typography, optical alignment, border hierarchy, control states, and microcopy still feel mechanically assembled rather than deliberately crafted.

**Approach:** Apply a presentation-only refinement pass that establishes a precise type scale, consistent baselines and spacing, restrained neutral surfaces, and carefully resolved interactive states while preserving the current size, placement, markup contracts, and behavior.

## Boundaries & Constraints

**Always:** Preserve the 700 px Assistant width, 300 px Scout width, 10 px inter-panel gap, 112 px board clearance, current responsive stacking, English copy, element IDs, event bindings, state semantics, accessibility relationships, and all backend/runtime behavior. Use the system UI font stack, tabular numerals where values change, consistent 1 px borders, and visible keyboard focus.

**Ask First:** Any change to information architecture, control semantics, panel footprint, panel placement, feature behavior, or user-facing workflow.

**Never:** Add shadows, glow, neon, decorative gradients, glass blur, oversized controls, ornamental effects, new dependencies, or changes to engine, Session Control, Scout data, storage, transport, or automation logic.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default console | Expanded desktop workspace | Typography, dividers, fields, buttons, switches, slider, status and Scout share one deliberate visual system | Existing content remains readable and unclipped |
| Interactive states | Hover, focus-visible, active, disabled, checked | Each state is distinct through restrained color/border changes with no movement, shadow or glow | Disabled controls remain clearly inactive |
| Responsive console | Viewport at or below current breakpoint | Existing single-column layout and widths remain unchanged | No horizontal overflow introduced |
| Dynamic values | Ratings, time, score and percentages update | Numeric columns remain stable through tabular numerals and fixed baselines | Long values retain existing containment behavior |

</frozen-after-approval>

## Code Map

- `script.js` -- userscript markup and the final compact-console CSS override layer.
- `scripts/build_userscript.py` -- deterministic userscript bundle generator.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- refine the final compact-console token set and component styling without changing structure or behavior.
- [x] `script.js` -- normalize typography, spacing, optical alignment, focus, hover, checked and disabled states across Assistant and Scout.
- [x] `script.js` -- remove residual shadow/glow/gradient effects from the active compact-console presentation.
- [x] `script.js` -- preserve exact workspace dimensions, breakpoint behavior and board clearance.
- [x] `scripts/build_userscript.py` -- regenerate the final userscript deterministically.

**Acceptance Criteria:**
- Given the expanded desktop console, when it renders, then the footprint and placement are unchanged while all text follows a coherent system-font hierarchy and aligned baselines.
- Given any compact-console control, when it is focused, hovered, selected or disabled, then its state is clear without shadows, glow, decorative gradients or layout movement.
- Given changing numeric data, when values update, then time, rating, score and percentages do not visually jitter.
- Given the responsive breakpoint, when the workspace stacks, then no new clipping or horizontal overflow is introduced.
- Given the final bundle, when regenerated twice from unchanged sources, then `script.js` remains byte-identical.

## Spec Change Log

## Design Notes

The visual language is quiet and editorial: near-neutral graphite surfaces, a single semantic green, fine dividers, 6–8 px corner radii, compact but readable type, and optical rather than decorative emphasis. Sophistication comes from consistency and precision, not scale or effects.

## Verification

**Commands:**
- `python scripts/build_userscript.py` -- expected: deterministic userscript generation succeeds.
- `python scripts/build_userscript.py` followed by a hash comparison -- expected: the second build produces the same `script.js` bytes.

**Manual checks (if no CLI):**
- Inspect the expanded and responsive workspace for baseline alignment, consistent border intensity, no shadows/glow/gradients, readable microcopy, and unchanged geometry.

## Suggested Review Order

**Visual foundation**

- Centralized graphite palette, typography, radii and semantic focus color.
  [`script.js:5941`](../../script.js#L5941)

- Unified module headings and optical content alignment without increasing footprint.
  [`script.js:5979`](../../script.js#L5979)

**Control precision**

- Replaced the browser-native range appearance with deterministic cross-browser pixels.
  [`script.js:6015`](../../script.js#L6015)

- Aligned Move Timing inputs and removed focus glow in favor of crisp outlines.
  [`script.js:6039`](../../script.js#L6039)

- Added restrained hover, pressed, focus and disabled button states without movement.
  [`script.js:6064`](../../script.js#L6064)

**Dynamic information**

- Stabilized Auto Play labels and changing numbers with explicit grid columns.
  [`script.js:6074`](../../script.js#L6074)

- Matched Scout typography, borders and states to the Assistant visual system.
  [`script.js:6091`](../../script.js#L6091)

- Protected populated Scout microtypography from runtime style-order regressions.
  [`script.js:6123`](../../script.js#L6123)
