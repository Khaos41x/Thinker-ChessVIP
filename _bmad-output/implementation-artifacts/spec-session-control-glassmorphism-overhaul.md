---
title: 'Session Control glassmorphism overhaul'
type: 'refactor'
created: '2026-10-21'
status: 'done'
baseline_commit: '33e93873f169b39addd71e199def9b249a054bac'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Session Control and Opponent Scout surfaces expose the correct minimal information but retain a dense, utilitarian visual treatment. Advanced DDA inputs remain permanently visible, increasing cognitive load for routine use.

**Approach:** Apply a restrained macOS-inspired glass treatment to the existing panels, move Duration, Min win %, Max win %, and Run Delay into a collapsed advanced-settings disclosure, and elevate START as the primary action. Preserve the already-approved presenter boundary and every behavioral subsystem.

## Boundaries & Constraints

**Always:** Keep the main Session Control view limited to Tempo Restante, friendly Status, observed V-E-D, and raw Win Rate. Use the requested translucent background, 16px blur, 20px radius, subtle border, and Apple system font stack on the main panel and Scout. Keep advanced input IDs, values, validation, draft retention, action wiring, keyboard accessibility, and deterministic build intact. The gear must expose/collapse advanced settings smoothly and report state through `aria-expanded`/`aria-hidden`. Keep `#oi-wrapper` positioned relative to the document footer through its existing absolute-layout logic.

**Ask First:** Any requirement to change configuration defaults, Session Control state/action semantics, Scout data content, saved preferences, or workspace geometry.

**Never:** Modify DTOs, reducers, IndexedDB, Web Locks, telemetry, calibration/DDA math, engine behavior, authorization, or session lifecycle. Never reintroduce technical telemetry into the visible status board or replace the existing panel/controller architecture.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Default panel | Fresh mount | Advanced settings collapsed; primary metrics and START remain immediately visible | Inputs remain present and retain defaults for presenter config reads |
| Gear activation | Mouse, Enter, or Space activation | Disclosure expands/collapses smoothly; ARIA state stays synchronized | Repeated activation remains idempotent and does not dispatch session actions |
| Presenter rebinding | Session panel updates/rebinds | Draft Duration/Min/Max values remain readable and preserved while collapsed | Existing warning and availability behavior remains unchanged |
| Scout states | Waiting, loading, loaded, unavailable | Every Scout card uses the same glass surface and system typography | Retry/close behavior remains unchanged |

</frozen-after-approval>

## Code Map

- `script.js` -- source CSS/HTML, advanced disclosure interaction, Session Control actions, and Scout card inline presentation.
- `frontend/session_control/ui.js` -- approved presenter boundary; verify behavior remains unchanged.
- `tests/session_control/ui.test.js` -- static markup/CSS and presenter interaction contract.
- `tests/test_userscript_chrome.js` -- production userscript smoke for disclosure accessibility and action isolation.
- `scripts/build_userscript.py` -- deterministic Session Control module generator.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- add system glass tokens/styles for main and Scout panels, accessible advanced disclosure markup/interaction, and polished START treatment without changing application state.
- [x] `tests/session_control/ui.test.js` -- assert default collapse, required fields inside the disclosure, ARIA contract, glass declarations, primary action styling, and preserved footer wrapper geometry.
- [x] `tests/test_userscript_chrome.js` -- verify gear expansion/collapse and prove it does not dispatch START/STOP or disturb presenter output.
- [x] `scripts/build_userscript.py` / generated region -- rebuild twice and prove byte-identical output.

**Acceptance Criteria:**
- Given a default mount, when the panel is displayed, then only routine controls, the four approved status metrics, and actions are visually exposed while all four technical inputs are collapsed but still present in the DOM.
- Given the gear is activated with pointer or keyboard, when its state changes, then the disclosure and ARIA attributes change together without changing any session status or configuration value.
- Given any Scout state, when rendered, then its card matches the requested glass tokens and retains all existing content and interactions.
- Given two builds from identical sources, when generation completes, then `script.js` is byte-identical and all Session Control tests pass.

## Spec Change Log

## Design Notes

The disclosure uses an always-mounted inner region so the Presenter can continue querying and preserving draft inputs. Visual collapse is presentation-only; no configuration fields are created, destroyed, or moved outside `#kb-session-panel`. A CSS grid row transition provides smooth expansion while `inert` prevents focus from entering the collapsed controls.

## Verification

**Commands:**
- `node tests/session_control/run.js` -- all Session Control unit/integration/build tests pass.
- `node tests/test_userscript_chrome.js` -- production disclosure, presenter, and action wiring smoke passes.
- `python scripts/build_userscript.py` twice with SHA-256 comparison -- output is deterministic.
- `node --check script.js` and `git diff --check` -- valid userscript and clean patch.

## Suggested Review Order

**Presentation boundary**

- Glass tokens unify the main panel and Scout without changing either lifecycle.
  [`script.js:5659`](../../script.js#L5659)

- Always-mounted disclosure preserves Presenter access while hiding technical controls by default.
  [`script.js:5900`](../../script.js#L5900)

- START receives clear primary-action hierarchy with restrained motion and focus treatment.
  [`script.js:5784`](../../script.js#L5784)

**Interaction and resilience**

- Delegated, panel-scoped toggling survives rebinding and isolates collapsed controls from focus.
  [`script.js:6077`](../../script.js#L6077)

- Invalid configuration automatically reveals the controls needed to correct it.
  [`script.js:6229`](../../script.js#L6229)

**Regression proof**

- Hermetic assertions lock markup, glass rules, accessibility, and footer geometry.
  [`ui.test.js:249`](../../tests/session_control/ui.test.js#L249)

- Chromium proves focus isolation, value retention, action isolation, and computed glass styles.
  [`test_userscript_chrome.js:184`](../../tests/test_userscript_chrome.js#L184)

