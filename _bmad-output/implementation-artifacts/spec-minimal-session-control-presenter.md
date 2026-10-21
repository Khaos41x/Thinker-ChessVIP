---
title: 'Minimal Session Control presenter'
type: 'refactor'
created: '2026-10-20'
status: 'done'
baseline_commit: '3f6b3c3ec1cbc31c0226feba709d81ae9c32361b'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Session Control exposes operational and statistical telemetry intended for engineering diagnostics, making the user-facing panel dense and difficult to scan. Technical phases and reason codes also leak directly into status text and error notifications.

**Approach:** Reduce the visible status board to four localized, user-centered metrics and translate technical phase/warning values at the presenter boundary. Keep every underlying status field, diagnostic export, state transition, persistence mechanism, and calculation unchanged.

## Boundaries & Constraints

**Always:** Display only `Tempo Restante`, `Status`, observed W-D-L as `V | E | D`, and absolute raw win rate in the status board. Translate every known Session Control phase into friendly Portuguese. Render warning codes as concise user messages in both the persistent warning region and transient toast, while retaining raw codes internally for state, telemetry, and diagnostics. Preserve controls, draft inputs, action availability, focus retention, panel rebinding, accessibility live regions, and deterministic userscript generation.

**Ask First:** Any need to alter status DTO fields, Session Control state transitions, warning provenance, configuration inputs/actions, exported diagnostics, or layout outside the Session Control panel.

**Never:** Modify the DTO, reducer, IndexedDB repository, clock, leader election, calibration/DDA/statistical calculations, authorization, engine behavior, or generated-module contract. Never expose Role, Drain, Eligible/control counts, Posterior, Band, DDA, Target, rollout stage, execution mode, offsets, ratings, or raw technical reason codes in the visual panel.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Active queue | `QUEUEING`, TTL, observed 12/1/2, raw win 80 | `Buscando...`, formatted TTL, `12 V | 1 E | 2 D`, `80%` | No advanced field exists in DOM |
| Active game | `IN_GAME` | `Jogando...` | Preserve button availability behavior |
| Graceful close | `DRAINING` | `Finalizando sessão...` | Drain deadline remains internal only |
| Terminal/paused | `IDLE`, `COMPLETED`, `ABORTED`, paused phases | Friendly waiting/completed/interrupted messages | Unknown phase falls back safely without throwing |
| Calibration failure | `CALIBRATION_UNAVAILABLE` or related calibration state | `⚠️ Calibração não encontrada` | Raw code remains available to callbacks/diagnostics |
| Artifact/general failure | Artifact code or other technical warning | `⚠️ Verifique o Artefato` or concise generic failure | Toast and persistent warning use the same safe text |

</frozen-after-approval>

## Code Map

- `frontend/session_control/ui.js` -- presentation-only mapping for phases, W-D-L, raw win rate, and friendly warnings.
- `script.js` -- source markup/CSS for the visible panel plus the regenerated embedded Session Control module.
- `scripts/build_userscript.py` -- existing deterministic generator; no behavior change expected.
- `tests/session_control/ui.test.js` -- presenter DOM contract, friendly copy, interaction preservation, and menu artifact assertions.
- `tests/session_control/runtime.test.js` -- integration assertion for friendly transient warning presentation.
- `tests/session_control/build.test.js` -- byte-identical rebuild and generated-region integrity.
- `tests/test_userscript_chrome.js` -- production userscript smoke for friendly copy, raw diagnostic state, and absent advanced DOM nodes.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/session_control/ui.js` -- introduce pure friendly presentation mappings and render only the four approved metrics without touching status construction.
- [x] `script.js` -- replace the Session Control status markup with the four localized rows, retain accessibility/actions, and regenerate the embedded module deterministically.
- [x] `tests/session_control/ui.test.js` -- assert every phase mapping, clean W-D-L/percentage formatting, friendly warning behavior, absent advanced IDs, and unchanged interactions.
- [x] Session Control regression/build suites -- prove state, storage, calibration, and generated-region contracts remain intact.

**Acceptance Criteria:**
- Given any valid status DTO, when the presenter updates, then only the four approved status metrics are visible and no SRE/statistical telemetry node is present.
- Given a technical phase or warning code, when it reaches the presenter, then the UI shows concise Portuguese copy while internal callbacks continue receiving the original code.
- Given two consecutive deterministic builds, when `script.js` is regenerated, then both artifacts are byte-identical and all Session Control regressions pass.

## Spec Change Log

## Design Notes

The presenter is an anti-corruption boundary: raw status remains exact, while `phaseLabel`, `warningLabel`, score formatting, and integer percentage formatting produce display-only strings. Unknown phases use a neutral session-status fallback; unknown warnings use one non-technical failure message and never inject raw error text into the DOM.

## Verification

**Commands:**
- `node tests/session_control/run.js` -- expected: complete Session Control suite passes.
- `node tests/test_userscript_chrome.js` -- expected: production presenter renders friendly copy with no advanced metric nodes.
- `python scripts/build_userscript.py` twice plus SHA-256 comparison -- expected: identical `script.js` output.
- `node --check script.js` and `git diff --check` -- expected: valid generated userscript and clean patch.

## Suggested Review Order

**Presenter boundary**

- Start with localized phase, warning, and success projections that preserve raw state.
  [`ui.js:11`](../../frontend/session_control/ui.js#L11)

- Review the four-metric rendering and unchanged action availability contract.
  [`ui.js:79`](../../frontend/session_control/ui.js#L79)

- Verify transient success and failure copy never replaces telemetry reason codes.
  [`ui.js:124`](../../frontend/session_control/ui.js#L124)

**Production userscript**

- Follow the shared toast boundary covering presenter, bootstrap, and master failures.
  [`script.js:182`](../../script.js#L182)

- Inspect the reduced two-by-two status board and empty startup warning region.
  [`script.js:5883`](../../script.js#L5883)

**Regression evidence**

- Review all phase mappings, friendly messages, clean markup, and interaction preservation.
  [`ui.test.js:132`](../../tests/session_control/ui.test.js#L132)

- Confirm the runtime fixture depends only on the approved minimal DOM contract.
  [`runtime.test.js:54`](../../tests/session_control/runtime.test.js#L54)

- End with Chromium proof of friendly UI and intact raw diagnostic state.
  [`test_userscript_chrome.js:226`](../../tests/test_userscript_chrome.js#L226)
