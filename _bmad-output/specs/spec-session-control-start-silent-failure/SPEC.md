---
id: SPEC-session-control-start-silent-failure
companions:
  - brownfield.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate.

# Module 14 START Silent-Failure Fix

## Why

Module 14 remains `IDLE` after the user presses START because the production userscript suppresses or disconnects the command before it can reach the controller. The user needs START to either begin a session or report one stable, actionable rejection reason in the visible UI.

## Capabilities

- **CAP-1**
  - **intent:** A valid START interaction reaches the Session Control controller with the current account identity, validated session configuration, and an allowed authorization decision.
  - **success:** One user click produces exactly one `SessionControlController.startSession` call and the rendered phase leaves `IDLE` after the commit succeeds.

- **CAP-2**
  - **intent:** The user receives visible reason-code feedback whenever START cannot proceed.
  - **success:** Every rejection before or during START displays the same stable `reasonCode` in both a transient notification and the persistent Session Control warning region; no rejected click is silent.

- **CAP-3**
  - **intent:** A first-run environment authorizes only its currently observed exact Session Control context without manual Tampermonkey JSON injection.
  - **success:** When the authorization policy is missing, null, or valid and fully empty, START persists a version-1 policy containing only the current account, context, and pool tokens, re-evaluates it, and obtains an allowed decision before creating the session.

- **CAP-4**
  - **intent:** The production userscript initializes and connects the Session Control runtime before accepting commands.
  - **success:** Bootstrap waits for the generated API, completes origin and capability preflight, constructs persistence, leadership, telemetry, controller, and context dependencies, installs the bridge once, and exposes any bootstrap failure as a typed visible rejection.

- **CAP-5**
  - **intent:** Automated verification detects any future break between the real START button and the controller.
  - **success:** Hermetic tests cover production bootstrap, click binding, exact authorization bootstrap, explicit authorization denial, readiness rejection, internal failure, single dispatch, phase transition, and deterministic userscript generation.

## Constraints

- Operational unavailability must not use native `disabled` on START because disabled controls do not emit the click required for feedback; use `aria-disabled` and `data-disabled-reason` while keeping the command observable.
- Authorization auto-provisioning is limited to a missing/null policy or a valid policy whose `accounts`, `contexts`, and `pools` are all empty. A malformed, partially empty, or non-empty mismatching policy must not be overwritten or broadened.
- The provisioned policy must contain exact normalized observed tokens only; wildcards, patterns, guessed values, and platform-wide allowlists remain forbidden.
- Policy persistence and a successful read-back/evaluation must precede the session event commit. A write/read-back race or storage failure must reject START.
- Visible errors must use a stable code selected from `error.code`, a returned decision `reason`, or a fixed fallback; raw exception messages are diagnostic detail, not the UI contract.
- The existing panel layout, dimensions, scrolling behavior, menu structure, Scout, banner, and workspace mounting remain unchanged. The transient notification must be an overlay and must not reflow the panel.
- Existing reducer, event-sourcing, Web Lock, fencing, recovery, and exact-origin safety invariants remain authoritative.
- An explicitly stored rollout stage of `DISABLED` remains a rejection, but its click must produce `ROLLOUT_DISABLED`. Absence of a rollout record follows the bridge's installed local-runtime default rather than the pre-install disabled placeholder.
- No `users.db`, credentials, authorization tokens, or diagnostic secrets may be committed or exported.

## Non-goals

- Redesigning the Session Control panel or changing its placement.
- Weakening explicit non-empty authorization policies to make a mismatching context pass.
- Reworking DDA mathematics, calibration generation, queue fencing, move execution, or result accounting.
- Adding server-side authorization or a policy editor UI.

## Success signal

On a clean supported install with no authorization policy, one START click creates an exact policy for the observed context and advances the panel from `IDLE`; on every unsupported or rejected path, the phase remains safe and the UI immediately names the stable reason code.

## Assumptions

- The production observation adapter can obtain a canonical account identity plus validated `contextClass`, `poolId`, and calibration readiness. Missing or unstable evidence is rejected with a typed visible reason instead of being guessed.
