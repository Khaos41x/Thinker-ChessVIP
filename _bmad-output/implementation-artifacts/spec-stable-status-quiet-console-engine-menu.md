---
title: Stable status, quiet diagnostics and engine menu
type: bugfix
created: 2026-10-27
status: done
baseline_commit: a7c0100
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="user explicitly authorized all three blocks and execution without plan approval">

## Intent

Prevent unchanged connection/engine status from being rewritten or briefly replaced during background checks on External Config and the embedded console. Preserve genuine state meanings and recover automatically after confirmed transport outages. Audit and silence only Thinker Chess production diagnostics. Replace the system engine options menu with a matching accessible menu on both surfaces.

## Boundaries & Constraints

Always preserve existing labels, IDs, persisted preferences, authorization, engine recommendation timing, arrows, banner, root page and console panel geometry/colors. Deliver three separate implementation commits. Preserve unrelated dirty artifacts. Use real Flask registry responses with a faithful browser fixture and state transport faults explicitly; do not claim authenticated Tampermonkey verification.

Ask first only for new copy or a layout change that violates the approved dimensions. Existing user authorization covers implementation, local commands, tests and commits. Never change the global console/error handlers, intercept third-party requests, hide site diagnostics, move gameplay polling intervals or push remotely.

## I/O & Edge-Case Matrix

| Scenario | Expected behavior | Error handling |
|---|---|---|
| Unchanged healthy status | No indicator mutation or node recreation after initial render | Retain accepted state while checking |
| One failed check | No visible state change | Count consecutive failures |
| Confirmed outage | One static error transition after at least three failures and six seconds | Exponential connection backoff capped at30s |
| Recovery | First successful check restores accepted status | Reset backoff/failure counter |
| Hidden document | Pause connection verification; one check on resume | Do not change session/recommendation timing |
| Explicit Retry or selection | Existing initialization/switching labels until result | Keep previous saved selection on failure |
| Keyboard menu | Open/navigate/type/select/escape/tab using standard ARIA behavior | Original select remains authoritative fallback |
| Menu in narrow/scrolled layout | Top-layer overlay, integer bounds and same panel rectangles | Flip above if needed |

</frozen-after-approval>

## Code Map

- `frontend/external_config/panel.js`: status projection, fetch timeout, configuration polling/save acknowledgements.
- `frontend/eval_bar/engine-selection.js`: GM engine registry transport, selection, rendering and accepted identity.
- `frontend/external_config/panel.css`, `frontend/eval_bar/engine-layout.js`: fixed analysis notice geometry and existing color tokens.
- `frontend/session_control/ui.js`: idempotent session status text presentation.
- `scripts/build_analysis_engine.py`, `scripts/build_userscript.py`: deterministic bundles.
- `tests/clean_config_fixture.py`, browser regression helpers: isolated real Flask/registry and current userscript source.

## Tasks & Acceptance

- [x] Audit communication, status writers, CSS/JS motion and90s observations before edits.
- [x] Add minimal shared difference setters and connection-health policy; apply to both status surfaces.
- [x] Preserve status node identities, accepted states during revalidation, fixed error notice height and explicit-action loading.
- [x] Audit every production diagnostic; leave only opt-in debug and handled expected failures.
- [x] Add shared accessible engine picker retaining native select IDs/change/value/persistence.
- [x] Run browser status, fault, recovery, visibility, keyboard, menu geometry/color and console-origin tests.
- [x] Rebuild deterministically, document actual coverage/remaining limitations and commit each block separately.

Given stable backend responses for60s, indicators must have zero mutations/recreation and CLS0 after settling. Given one failed check, visible status remains. Given a sustained outage, existing error copy appears once after threshold with no status animation. Given reconnection or Retry, existing states recover without an intermediate background flash. Given menu selection by keyboard or pointer, the existing change path acknowledges and persists the engine. Given open/closed menu, all console panel/title rectangles and component colors remain equal. No product copy is introduced.

## Design Notes

Browser documentation confirms base-select styling is not uniformly supported; user explicitly requires a custom listbox when support is partial. Use one shared enhancement of the existing select and a top-layer popover rather than duplicate engine preference logic. Do not interpret registry Ready as authorized running analysis.

## Verification

Use Node/Chromium CDP regression scripts, existing Flask fixture and registry APIs, deterministic build checks and targeted session/engine tests. Record raw observations, screenshots and per-block diffs under `stable-status`. Preserve the existing Config alignment limitation from the previous task rather than claiming it is newly solved.

## Review outcome

Blind and edge review findings were patched: operational hidden-tab session relay stays active/recoverable; registry backoff is independent; picker focus styling is computed once before writing; popup navigation changes only menu scrollTop; pending offline preferences resume on recovery. Session/revision/geometry regressions passed. No remaining introduced blocker was reported by the edge reviewer; native authenticated verification was blocked by the Computer Use URL policy and is explicitly not claimed.

## Suggested Review Order

- Shared difference setters and health policy: [status-runtime.js](../../frontend/external_config/status-runtime.js#L1).
- Accepted status projection and independent checks: [panel.js](../../frontend/external_config/panel.js#L1).
- Operational sync and queued recovery: [config-connection.js](../../frontend/eval_bar/config-connection.js#L1), [connection-resume.js](../../frontend/eval_bar/connection-resume.js#L1).
- Native select enhancement and accessible popup: [engine-picker.js](../../frontend/external_config/engine-picker.js#L1).
- Real transport interruption and production silence: [quiet regression](../../tests/browser/test_status_console_quiet.mjs#L1).
- Evidence and limitations: [report](stable-status/REPORT.md).
