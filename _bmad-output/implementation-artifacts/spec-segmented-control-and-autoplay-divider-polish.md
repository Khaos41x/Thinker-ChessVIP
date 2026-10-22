---
title: 'Polish Move Timing segmented control and Auto Play divider'
type: 'bugfix'
created: '2026-10-22'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'b5bdc87'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Move Timing segmented control rendered as two inset pills with fractional widths, while the Auto Play status separator inherited a rounded container silhouette.

**Approach:** Make the segmented control one clipped 32px surface with two equal, opaque halves, and reduce the footer separator to a straight tokenized one-pixel rule.

## Boundaries & Constraints

**Always:** Preserve the approved console grid, gaps, margins, tokens, text, state semantics, and interaction behavior. Keep integer geometry across desktop and stacked layouts. Maintain visible hover/focus feedback and WCAG AA text contrast.

**Ask First:** Any change to the surrounding panel dimensions beyond the intrinsic two-pixel increase required to make the control exactly 32px high.

**Never:** Introduce absolute positioning, negative offsets, per-viewport magic numbers, new visual effects, or changes to Session Control, engine, storage, or Chess.com integration behavior.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Random selected | Random radio checked | Random fills its half; Immediate remains opaque and distinct | Preserve prior selection semantics |
| Immediate selected | Immediate radio checked | Immediate fills its half; Random remains opaque and distinct | Preserve prior selection semantics |
| Active/inactive dependency | Auto Moves state changes | Existing accent/neutral selection colors remain correct | No state mutation by presenter |
| Responsive resize | Container width changes | Equal integer-width halves cover the inner box with a zero/one-pixel center division | Recompute from measured inner width |
| Status footer | Auto Play status is shown | Straight 1px divider spans content edges without radius or clipping | Keep panel height at 220px |

</frozen-after-approval>

## Code Map

- `script.js` -- userscript CSS, compact-console mounting, and responsive geometry synchronization.
- `tests/test_userscript_chrome.js` -- Chromium geometry, state, contrast, focus, hover, responsive, and screenshot assertions.
- `tests/artifacts/thinker-console-segmented-footer-before.json` -- baseline DOM measurements.
- `tests/artifacts/thinker-console-segmented-footer-after.json` -- corrected DOM measurements.
- `tests/artifacts/thinker-segmented-random-300.png` -- Random-selected 300% evidence.
- `tests/artifacts/thinker-segmented-immediate-300.png` -- Immediate-selected 300% evidence.
- `tests/artifacts/thinker-autoplay-divider-300.png` -- straight-divider 300% evidence.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- replace inset option styling with a border-box, clipped, tokenized segmented surface.
- [x] `script.js` -- synchronize equal integer column widths through the existing layout lifecycle.
- [x] `script.js` -- remove radius, background, and clipping from the status divider container.
- [x] `tests/test_userscript_chrome.js` -- measure before/after geometry and validate all states, responsive widths, hover, focus, contrast, and screenshots.

**Acceptance Criteria:**
- Given either timing mode is selected, when rendered, then both options fill the inner container vertically and horizontally, have equal integer widths, and remain visually distinct.
- Given keyboard focus or pointer hover, when feedback appears, then the control geometry is unchanged.
- Given 1033px or 800px injection widths, when the console stacks, then the two option widths remain equal integers.
- Given the Auto Play status footer, when rendered, then its 1px divider reaches both content edges, has zero radius, and panel height remains 220px.

## Spec Change Log

- Review 1: added integer responsive sizing and active/hover/focus coverage after blind review identified fractional stacked widths and state-test gaps. Kept the approved grid and 220px Auto Play height unchanged.

## Design Notes

The 319px desktop control has a 317px inner width. Two 158px columns leave one token-colored center pixel. For even inner widths, the halves meet directly and their opaque color boundary provides the division. This avoids fractional geometry without padding or a declared gap.

## Verification

**Commands:**
- `node tests/test_userscript_chrome.js --screenshot` -- full Chromium smoke, responsive assertions, and requested evidence pass.
- `node tests/session_control/run.js` -- 14/14 Session Control tests pass.
- `python scripts/build_userscript.py --check` -- deterministic userscript check passes.
- `git diff --check` -- no whitespace errors.

## Suggested Review Order

**Rendering and responsive geometry**

- Start with the unified surface and equal-column sizing contract.
  [`script.js:6280`](../../script.js#L6280)

- Review integer-width synchronization inside the existing layout lifecycle.
  [`script.js:6509`](../../script.js#L6509)

**Footer divider**

- Confirm the separator is a straight, unclipped one-pixel rule.
  [`script.js:6322`](../../script.js#L6322)

**Regression evidence**

- Inspect state, contrast, responsive, hover, focus, and screenshot assertions.
  [`test_userscript_chrome.js:238`](../../tests/test_userscript_chrome.js#L238)
