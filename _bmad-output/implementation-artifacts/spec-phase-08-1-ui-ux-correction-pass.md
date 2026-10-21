---
title: 'Phase 08.1 UI UX correction pass'
type: 'refactor'
created: '2026-10-21'
status: 'complete'
baseline_commit: '792145b6a0ead7b5dc0889087e44d9fa635c6b31'
review_loop_iteration: 0
context:
  - 'AGENTS.md'
  - '_bmad-output/implementation-artifacts/spec-phase-08-interface-refinement.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Phase 08 reduced the empty Scout but left the idle Assistant near 750 px tall, with persistent subordinate controls, visually heavy session metrics, unclear strength-slider semantics, and labels/actions that still feel abbreviated or ambiguous. Green selection styling also makes saved-but-inactive settings appear operational.

**Approach:** Finish the existing presentation layer through progressive disclosure and a tighter neutral design system: keep identity, primary controls, explicit strength, and a lightweight Auto Play summary visible; collapse secondary features and inactive Auto Move timing without losing discoverability, saved values, keyboard access, or operational behavior. Standardize every user-facing Assistant and Opponent Scout string on concise, natural English (en-US).

## Boundaries & Constraints

**Always:** Preserve all existing feature controls and saved values; distinguish never-started `IDLE` from persisted `COMPLETED` without rewriting history; use status DTO provenance exactly as supplied; keep Auto Play, Assistant, and Scout lifecycle/restore behavior; expose every icon-only action with an accessible and understandable name; size cards by content; use green only for enabled or active state; validate faithful idle, expanded, completed, empty-Scout, and populated-Scout states; render all user-facing labels, buttons, statuses, descriptions, tooltips, accessibility names, empty states, settings, menus, and notifications in consistent English (en-US), while preserving product names and technical identifiers.

**Ask First:** Any change to control dependencies, persisted defaults, Session Control state transitions, availability gates, operational automation, or the semantic meaning/range of Elo and timing values.

**Never:** Modify backend, engines, reducer, DTO, IndexedDB, telemetry, matchmaking, rating math, authorization, or assistance scope; fabricate status or opponent data for production; add dependencies; use fixed panel heights; push remotely.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Never started | No snapshot; `IDLE`; zero samples | Compact `Idle` summary, zero score and `—`; no terminal implication | Start availability remains driven by existing blocker |
| Truly completed | Persisted `COMPLETED` snapshot | `Completed` and valid historical counts remain visible | Do not coerce to idle |
| Auto Move off | Saved timing and mode exist | Timing collapses to a neutral discoverable summary; saved selection is not presented as active | Manual disclosure remains keyboard-accessible |
| Auto Move on | Existing enabled state | Timing controls expand and selected mode becomes operationally highlighted | Existing change handlers and persistence remain intact |
| Strength control | Any allowed Elo | Current value is named; real min/max are visible; thumb position follows native proportional range | No range or calculation changes |
| Scout empty/data | No opponent / validated public record | Empty state is one concise compact message; populated card grows to content | Existing unavailable/retry flow remains |
| Responsive | Required viewport and zoom matrix | No clipping, horizontal overflow, inaccessible controls, or avoidable giant panel | Page scrolling remains available when genuinely required |

</frozen-after-approval>

## Code Map

- `script.js` -- Assistant/Scout markup, design tokens, disclosures, strength presentation, responsive layout, and userscript bundle.
- `frontend/session_control/ui.js` -- presentation-only distinction and status projection for Auto Play.
- `tests/session_control/ui.test.js` -- truthful idle/completed presenter and static semantic contracts.
- `tests/test_userscript_chrome.js` -- representative state fixtures, interactions, dimensions, zoom matrix, and screenshots.
- `tests/artifacts/` -- matched 1440×778 before/after evidence.
- `scripts/build_userscript.py` -- deterministic shared-module embedding.

## Tasks & Acceptance

**Execution:**

- [x] `script.js` -- introduce one compact neutral token scale; remove redundant nested borders/gradients and reduce idle content height without shrinking readable type.
- [x] `script.js` -- add accessible progressive disclosures for secondary Assistant features and subordinate timing; keep saved timing editable/discoverable while inactive and automatically relevant when Auto Move is enabled.
- [x] `script.js` -- replace ambiguous timing abbreviations and icon-only export affordance; clarify strength current/min/max values with correct native range position; convert every user-facing Assistant and Opponent Scout string to professional English (en-US).
- [x] `frontend/session_control/ui.js` -- expose truthful presentational state markers for never-started versus actually completed sessions without changing DTOs or history.
- [x] `script.js` -- simplify Auto Play metrics into a lightweight coherent summary and compact Scout empty copy while preserving all IDs and bindings.
- [x] `tests/session_control/ui.test.js` -- cover no snapshot, genuine completion, zero samples, history preservation, English-only localization, disclosures, and accessible names.
- [x] `tests/test_userscript_chrome.js` and `tests/test_scout_logic.js` -- exercise idle/off, expanded, completed, empty and populated Scout; verify keyboard restore, dimensions and overflow at 1280×720, 1440×778, 1440×900, 1920×1080, 125%, and 150%; capture matched evidence.
- [x] `script.js` -- rebuild twice and prove byte-identical output before commit.

**Acceptance Criteria:**

- Given the idle fixture at 1440×778, when all optional disclosures are closed, then the Assistant is content-sized near 450–550 px where feasible and no control is lost.
- Given Auto Move is off, when the timing summary renders, then its saved mode is neutral, its controls are collapsed, and keyboard disclosure exposes editable values.
- Given an actual completed snapshot, when the presenter updates, then `Completed` and valid historical metrics remain distinct from never-started `Idle`.
- Given any visible Assistant or Opponent Scout state, when text is rendered, then labels, descriptions, notifications, tooltips, and accessibility names use consistent natural English with no Portuguese UI strings.
- Given every required viewport/zoom, when the workspace opens, expands, collapses, and restores, then controls remain visible, reachable, non-overlapping, and horizontally contained.
- Given the before/after captures, when reviewed visually, then density, hierarchy, alignment, contrast, language, and proportions are demonstrably improved before commit.

## Spec Change Log

## Design Notes

The default surface reads top-to-bottom as identity → master/Auto Moves → Move Timing → strength → Auto Play summary → optional settings. “More Settings” contains secondary feature toggles; “Move Timing” remains adjacent to Auto Moves but collapses to a single neutral row while inactive. Auto Play uses one status line and one compact statistics line instead of four miniature cards. Outer cards use one radius; inner groups use one smaller radius; neutral graphite surfaces replace decorative green washes.

## Verification

**Commands:**

- `node tests/session_control/run.js` -- expected: all Session Control tests pass.
- `node tests/test_userscript_chrome.js --screenshot` -- expected: state, interaction, geometry, viewport/zoom, and screenshot assertions pass.
- `python scripts/build_userscript.py` twice with SHA-256 comparison -- expected: byte-identical `script.js`.
- `git diff --check` -- expected: clean patch.

**Manual checks:**

- Inspect matched 1440×778 before/after images for hierarchy, density, typography, inactive semantics, and Scout compactness before committing.
