---
title: 'Fix Module 14 START production wiring and feedback'
type: 'bugfix'
created: '2026-10-18'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'dce936f1b1aa872aed0a129d0c9615aaa753c4fe'
context:
  - '{project-root}/_bmad-output/specs/spec-session-control-start-silent-failure/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-session-control-start-silent-failure/brownfield.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Module 14 stays `IDLE` because production never installs the Session Control controller, the old jQuery renderer natively disables START, and no authorization policy is resolved on the real command path. Current tests cover isolated modules but not the installed userscript flow.

**Approach:** Install an idempotent production runtime, route the existing panel through the pure presenter, derive a validated Chess.com queue context with an authenticated calibration-readiness probe, provision an exact current-context policy only when authorization is missing or fully empty, and make every rejection observable through a stable reason code in both an overlay toast and the persistent warning field.

## Boundaries & Constraints

**Always:** Await the generated API before bootstrap; preserve reducer, repository, Web Lock, fencing, recovery, and exact-origin invariants; capture one internally consistent start observation; derive `bullet`, `blitz`, or `rapid` only from positive selected/active DOM evidence and map it to exact pool/rating-scale tokens; authenticate and validate `/calibration-readiness` before session commit; keep START click-observable with `aria-disabled`; persist and read back an exact policy before session commit; renew active leadership before its lease expires; preserve menu/layout/scrollbar/Scout/banner behavior; expose stable codes rather than exception prose.

**Ask First:** Any need to redesign the panel, change authorization DTO shape, broaden an explicit policy, alter DDA/calibration mathematics, or change queue/move ownership beyond wiring the existing controller.

**Never:** Auto-expand malformed, partially empty, or non-matching non-empty policies; invent wildcard authorization; infer a time class from ambiguous or inactive DOM text; guess missing account/context/pool/readiness evidence; commit credentials, databases, or generated secrets; keep parallel jQuery and presenter command handlers.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| First START | Supported top-level page, valid observed account/entry context, missing or fully empty policy | Persist exact `{account, context, pool}`, read back, authorize, call controller once, render non-IDLE phase | Storage/read-back conflict blocks commit with typed code |
| Queue context | Exactly one selected/active `bullet`, `blitz`, or `rapid` control | Map to exact `chesscom-live-<class>-v1` pool and rating-scale tokens and probe readiness | Missing or ambiguous evidence returns `CONTEXT_UNIDENTIFIABLE`; probe/inactive data returns a stable calibration code |
| Existing policy | Matching, mismatching, partial, or malformed policy | Matching starts without write; every other case preserves policy and blocks start | `NOT_AUTHORIZED` or `AUTHORIZATION_POLICY_INVALID` shown inline and as toast |
| Runtime unavailable | Bootstrap pending/failed, unsupported capability, explicit disabled rollout | Pending click awaits shared bootstrap; failed/disabled click remains observable | Stable bootstrap/rollout code shown in both surfaces |
| Invalid command | Bad draft, active session, readiness/entry rejection, repository or leader failure | No duplicate controller dispatch and safe phase | Specific code or `SESSION_START_FAILED`; never raw message only |
| SPA replacement | Panel node replaced or presenter updated repeatedly | Draft survives and only the current panel dispatches | Old listeners are aborted |

</frozen-after-approval>

## Code Map

- `script.js` -- bridge, production lifecycle, Chess.com observation adapter, panel markup/CSS, and obsolete jQuery handlers.
- `frontend/session_control/ui.js` -- idempotent presenter, availability, reason-code normalization, and notification callback.
- `frontend/session_control/ports.js` -- GM policy validation, exact fallback provisioning, read-back, and authorization decision.
- `frontend/session_control/runtime.js` -- focused bootstrap/start coordinator with dependency injection for hermetic tests.
- `frontend/session_control/index.js` -- public exports for the generated API.
- `scripts/build_userscript.py` -- deterministic module ordering and userscript generation.
- `tests/session_control/runtime.test.js` -- real presenter click through runtime/bridge/controller seam.
- `tests/session_control/{ports,ui}.test.js` -- authorization and feedback edge cases.
- `tests/test_userscript_chrome.js` -- production bootstrap smoke path without manual bridge installation.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/session_control/ports.js` -- add typed policy resolution that distinguishes missing, empty, malformed, mismatch, storage failure, and read-back conflict.
- [x] `frontend/session_control/ui.js` -- normalize reason codes, publish durable + transient notifications, and keep START observable and single-flight.
- [x] `frontend/session_control/runtime.js` and `index.js` -- compose preflight, repository, leadership, recovery, rollout, authorization, start, renewal, and cleanup behind injectable ports.
- [x] `script.js` -- defer bootstrap past the loader assignment, derive canonical account plus the actually observed queue entry context, install the bridge once, instantiate the presenter, and remove old direct handlers/renderer.
- [x] `frontend/session_control/platform-chesscom.js`, `runtime.js`, and `script.js` -- add the approved fail-closed time-class adapter, authenticated readiness probe, consolidated START evidence, and live bridge queue context.
- [x] `script.js` -- add a fixed non-reflowing toast surface and accessible warning semantics without changing panel layout.
- [x] `tests/session_control/*.test.js` and `tests/test_userscript_chrome.js` -- cover matrix branches and actual DOM click-to-controller traversal.
- [x] `scripts/build_userscript.py` -- include any new module and regenerate the delimited region deterministically.

**Acceptance Criteria:**
- Given a clean supported install, when START is clicked once, then the exact current policy is stored, `startSession` is called once, and phase leaves `IDLE`.
- Given any preflight, authorization, readiness, rollout, repository, or internal rejection, when START is clicked, then the same stable reason code is visible in toast and `#kb-session-warning` and no unsafe commit occurs.
- Given repeated binding, rapid double-click, or SPA panel replacement, when commands are emitted, then no command is duplicated and detached nodes cannot dispatch.
- Given an active session, when five seconds elapse, then leadership renewal runs before the 15-second lease expires.
- Given a rebuilt artifact, when the build check runs, then generated bytes are current and code outside the delimited region changes only for the approved adapter/UI integration.
- Given ambiguous, missing, or unsupported queue controls, when START is clicked, then no policy/session commit occurs and the toast plus warning show the same stable code.

## Spec Change Log

- Review loop 1: adversarial review found that production installed the bridge with an empty queue context and omitted calibration readiness. The human approved a fail-closed DOM adapter for selected `bullet`/`blitz`/`rapid`, exact pool/rating-scale mapping, and authenticated readiness probing. This avoids entering `QUEUEING` with context-blind gates. KEEP: exact authorization bootstrap, presenter/toast wiring, idempotent bootstrap, and deterministic build.
- Final review: removed document-wide and inactive-ancestor pool inference, revalidated account/DOM evidence after the readiness probe, validated the complete active-readiness DTO, serialized authorization bootstrap, refreshed readiness before expiry, and hardened renewal/DRAIN feedback. Broader game lifecycle, reload recovery, and commit-before-lease concerns were recorded in `deferred-work.md`.

## Design Notes

Authorization fallback is exact tuple bootstrap, not permissive defaulting. The production adapter derives account identity from the authenticated username, context from the positively identified queue entry adapter, and pool/rating scale from exactly one selected or active Chess.com time-class control. The allowed mapping is `bullet|blitz|rapid` to `chesscom-live-<class>-v1`; absence, ambiguity, or `daily` fails closed. The authenticated readiness response must match both the observed opponent scale and requested target scale and remain unexpired. Async authorization/readiness belongs in the start coordinator; the bridge receives the same consolidated evidence used by START. Bootstrap state is shared (`PENDING`, `READY`, `FAILED`) so concurrent clicks cannot construct multiple runtimes.

## Verification

**Commands:**
- `node tests/session_control/run.js` -- all hermetic Session Control suites pass.
- `python tests/test_session_control_phase3.py` -- backend readiness/capability contract remains valid.
- `python scripts/build_userscript.py` then `python scripts/build_userscript.py --check` -- artifact regenerates and is byte-current.
- `node --check script.js` -- generated userscript parses.
- `node tests/test_userscript_chrome.js` -- when Chrome is available, production bootstrap and START smoke pass without test-only install.

## Suggested Review Order

**Production entry and context**

- Follow START from production bootstrap through exact evidence and bridge installation.
  [`script.js:274`](../../script.js#L274)

- Accept only one positively active Chess.com live time class.
  [`platform-chesscom.js:75`](../../frontend/session_control/platform-chesscom.js#L75)

**Authorization and orchestration**

- Provision and verify one exact authorization tuple under serialized startup.
  [`ports.js:54`](../../frontend/session_control/ports.js#L54)

- Coordinate readiness, recovery, controller dispatch, and lease renewal.
  [`runtime.js:55`](../../frontend/session_control/runtime.js#L55)

- Construct the production repository, leader, controller, and runtime once.
  [`runtime.js:169`](../../frontend/session_control/runtime.js#L169)

**User feedback**

- Keep rejected controls clickable and publish stable toast/warning codes.
  [`ui.js:83`](../../frontend/session_control/ui.js#L83)

- Render the fixed overlay notification without disturbing panel layout.
  [`script.js:4798`](../../script.js#L4798)

**Verification**

- Prove a real presenter click reaches controller commit and renewal.
  [`runtime.test.js:77`](../../tests/session_control/runtime.test.js#L77)

- Exercise installed userscript feedback and Module 14 browser primitives.
  [`test_userscript_chrome.js:192`](../../tests/test_userscript_chrome.js#L192)
