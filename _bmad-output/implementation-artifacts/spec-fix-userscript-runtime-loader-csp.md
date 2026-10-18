---
title: 'Make the Session Control runtime loader CSP-safe'
type: 'bugfix'
created: '2026-10-18'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'b6c570c6a37a184f564edbc0398677c2f3c52c66'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-session-control-start-silent-failure.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The rebuilt userscript reaches the new Session Control UI, but the generated Module 14 runtime is still loaded by decoding gzip and executing its source through indirect `eval`. In the real Tampermonkey/Chess.com execution environment that dynamic execution can be rejected by browser or extension Content Security Policy, causing `ThinkerSessionControlReady` to reject and leaving the panel at its static `DISABLED`/`IDLE` state with `SESSION_RUNTIME_UNAVAILABLE`.

**Approach:** Generate the deterministic Session Control bundle as ordinary inline JavaScript inside the existing delimited region and publish the already-instantiated API through `ThinkerSessionControlReady`. Remove every runtime dependency on `eval`, base64 decoding, gzip decompression, `Blob`, and `Response`, while preserving the current API, bootstrap sequence, exact authorization behavior, UI, and generated-region boundaries.

## Boundaries & Constraints

**Always:** Keep source module order deterministic; change only the build generator, its generated region, and focused build/smoke assertions; preserve the `ThinkerSessionControl` and `ThinkerSessionControlReady` public contracts; ensure loader failures remain promise rejections consumed by existing UI feedback; prove the built artifact parses and is byte-current.

**Ask First:** Any need to change Session Control business logic, authorization/readiness contracts, UI layout, generated-region markers, or the userscript metadata/security grants.

**Never:** Use `eval`, `new Function`, script-element source injection, data/blob URLs, or another dynamic-code workaround; weaken CSP; fetch module code at runtime; modify `users.db`, credentials, or engine artifacts.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Deterministic build | Unchanged module sources and current `script.js` | Repeated builds are byte-identical and alter only the generated region | Stale or inconsistent markers fail the build/check |
| CSP-restricted runtime | Dynamic evaluation APIs are absent or forbidden | Inline bundle installs `ThinkerSessionControl`; readiness resolves to the API | No dynamic execution primitive is invoked |
| Module initialization failure | A bundled module throws while installing | `ThinkerSessionControlReady` rejects and existing UI reports runtime unavailable | No partially successful readiness result |

</frozen-after-approval>

## Code Map

- `scripts/build_userscript.py` -- compacts ordered modules and renders the generated userscript region.
- `script.js` -- committed Tampermonkey artifact containing the generated Session Control bundle.
- `tests/session_control/build.test.js` -- deterministic generation and standalone loader contract test.
- `tests/test_userscript_chrome.js` -- browser-level production bootstrap and START feedback smoke.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/build_userscript.py` -- render `bundle_source()` directly in an initialization promise and remove compression/encoding imports and runtime loader primitives.
- [x] `tests/session_control/build.test.js` -- execute the region in a minimal VM without decompression/eval dependencies and assert forbidden dynamic-loader tokens are absent.
- [x] `script.js` -- regenerate the delimited runtime region deterministically.
- [x] Existing Session Control and Chrome smoke suites -- verify no behavior outside loading regresses.

**Acceptance Criteria:**
- Given a CSP-restricted userscript environment, when the built script initializes, then `ThinkerSessionControlReady` resolves without calling `eval`, `new Function`, decompression, blob, or data-URL execution.
- Given the resolved API, when production bootstrap runs, then the presenter can replace the static `DISABLED` state and START remains connected to the existing controller path.
- Given unchanged inputs, when the builder runs twice and `--check` runs, then the artifact is byte-identical and current.

## Spec Change Log

## Design Notes

The bundle is already wrapped in a self-contained IIFE that installs `globalThis.ThinkerSessionControl`. The generator should place that IIFE directly inside a promise executor or async wrapper and return the installed API. This keeps asynchronous readiness semantics for existing consumers while eliminating the only CSP-sensitive execution step.

## Verification

**Commands:**
- `node tests/session_control/run.js` -- all hermetic Module 14 suites pass, including CSP-safe build assertions.
- `python scripts/build_userscript.py && python scripts/build_userscript.py --check` -- generated artifact is deterministic and current.
- `node --check script.js` -- userscript parses.
- `node tests/test_userscript_chrome.js` -- production bootstrap and START smoke pass.
- `python tests/test_session_control_phase3.py` -- backend readiness contract remains green.

## Suggested Review Order

**CSP-safe runtime loading**

- Inline the ordered bundle while preserving asynchronous readiness semantics.
  [`build_userscript.py:107`](../../scripts/build_userscript.py#L107)

- Inspect the generated userscript entry without dynamic execution primitives.
  [`script.js:5757`](../../script.js#L5757)

**Regression barriers**

- Reject forbidden loader mechanisms and execute under string-code generation denial.
  [`build.test.js:29`](../../tests/session_control/build.test.js#L29)

- Prove module initialization failures reject without publishing a partial API.
  [`build.test.js:54`](../../tests/session_control/build.test.js#L54)
