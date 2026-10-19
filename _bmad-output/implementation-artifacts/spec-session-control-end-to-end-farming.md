---
title: 'Make Session Control farming operational end to end'
type: 'bugfix'
created: '2026-10-18'
status: 'done'
baseline_commit: '734ec669ea0f4b9f19d2e18b3d7bac0aef305bdd'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/module-14-session-dda-2026-10-13/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/module-14-session-dda-2026-10-13/ENGINEERING-PLAN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** START now reaches the backend but default startup can never satisfy calibration: the rating-scale translator is empty, the userscript requests a stale target scale, and the production flow still lacks game admission, capability pinning, result delivery, and recovery. Fixing only `CALIBRATION_NOT_ACTIVE` would expose the next silent failures while farming remains inert.

**Approach:** Negotiate one server-declared execution mode before START. Use `ACTIVE_DDA` only when the exact engine, Elo artifact, target scale, and time-class mapping are active; otherwise start an explicit `SHADOW_REDUCER` compatibility farm that delegates moves, queueing, and rating adjustment to the existing proven legacy path while Session Control owns TTL, leadership, observation, and feedback. Complete the calibrated path through stable game observation, capability pinning, move-plan identity, terminal result, and recoverable queue effects.

## Boundaries & Constraints

**Always:** Make START one deterministic transaction; use the server as the single source for target scale and capability mode; preserve exact authorization, IndexedDB authority, lease/fence checks, idempotency, and current user preferences; treat START as session-local permission to use effective Bot/Auto Move/Auto Queue without mutating their stored toggles; display execution mode and every typed blocking reason; revalidate account, queue context, server auth, readiness, game identity, opponent, capability, and expiry at their effect boundaries; count terminal games once; recover safely after SPA navigation, reload, backend restart, or rejected queue dispatch.

**Ask First:** Shipping an empirically produced Chess.com-to-engine mapping, changing DDA mathematics/threshold semantics, or migrating durable schema beyond an additive compatible version.

**Never:** Invent identity/linear rating mappings; label compatibility play as calibrated DDA; use platform Elo as engine Elo; silently switch pools; replay an ambiguous queue click; start a move before stable game admission and target pin; erase the user's underlying automation preferences; expose bearer tokens, raw game data, or artifact coefficients in diagnostics.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Default local install | Valid engine/Elo curve, no promoted cross-scale mapping | START commits `QUEUEING` in compatibility mode; session-local effective automation farms through the legacy path | Persistent `DDA_MAPPING_UNAVAILABLE`, not a blocking toast |
| Fully promoted DDA | Exact mapping, scale, engine, artifact, auth and readiness | START uses `ACTIVE_DDA`; queue click is fenced; observed game is admitted and capability pinned before move-plan | Any identity drift pauses effects with its typed code |
| Server/pairing problem | Missing server, absent/rotated token, 401 or timeout | No partial session/effect | `SERVER_UNAVAILABLE`, `SERVER_AUTH_REQUIRED`, or `SERVER_AUTH_INVALID` |
| Queue failure | Target disappears, lease/readiness changes, click throws, no game appears | Intent becomes cancelled/ambiguous and can be reconciled; no duplicate click | Visible typed reason and safe retry path |
| Navigation/game lifecycle | SPA enters game, reloads, finishes, or backend restarts | Two stable observations bind game/opponent; pin is re-attested idempotently; terminal result commits once and next queue proceeds | Unstable identity pauses; expired pin renews before new move |
| User intervention | User disables automation or drains during a game | Stop new effects immediately; preserve stored toggle preferences; drain current game safely | `USER_AUTOMATION_DISABLED` or drain status remains visible |

</frozen-after-approval>

## Code Map

- `app.py`, `core/smart_pacing/capability.py` -- typed deployment status, exact scale identity, mapping/readiness/pin lifecycle, renewal and restart recovery.
- `frontend/session_control/{runtime,controller,reducer,models,status}.js` -- negotiated mode, game admission/result events, recoverable queue intents, pin/expiry state and diagnostics.
- `frontend/session_control/platform-chesscom.js` -- stable game, opponent, side and terminal evidence adapters.
- `script.js` -- authenticated negotiation, session-local effective automation, SPA lifecycle orchestration, capability calls, toasts and generated bundle.
- `tests/session_control/`, `tests/test_session_control_phase3.py`, `tests/test_userscript_chrome.js` -- hermetic and browser end-to-end coverage.

## Tasks & Acceptance

**Execution:**
- [x] `app.py`, `core/smart_pacing/capability.py` -- expose exact typed calibration status/reasons; reject unsafe overrides; make invalid rollout configuration fail safe; support idempotent pin re-attestation/renewal without changing identity.
- [x] `frontend/session_control/runtime.js`, `status.js`, `script.js` -- negotiate `ACTIVE_DDA` versus compatibility before commit, remove the stale scale literal, distinguish server/auth/calibration failures, and keep compatibility warnings non-blocking.
- [x] `frontend/session_control/controller.js`, `reducer.js`, `models.js` -- add fenced stable-game admission, result ingestion, queue cancellation/ambiguity recovery, and capability refresh transitions.
- [x] `frontend/session_control/platform-chesscom.js`, `script.js` -- observe two-sample game/opponent/terminal evidence across SPA routes and orchestrate admission → pin → move-plan → result → next queue.
- [x] `script.js` -- implement session-local effective Bot/Auto Move/Auto Queue ownership while preserving stored preferences and immediate user stop/drain authority.
- [x] Tests/build -- cover the full matrix, real default composition, reload/restart/expiry/fault injection, deterministic userscript build, and Chrome START-to-first-game simulation.

**Acceptance Criteria:**
- Given the user's current default installation with no mapping, when START is clicked once, then phase leaves IDLE, mode is visibly compatibility, effective automation can queue/play, TTL advances, and no calibration claim is made.
- Given a complete validated mapping deployment, when a game is queued and observed, then exactly one fenced click, one admitted game, one pinned capability, calibrated move plans, and one terminal result occur.
- Given any failure at an async boundary, when the user retries or reloads, then no duplicate queue/move/result occurs and the UI identifies the actual failing dependency.

## Spec Change Log

## Design Notes

Compatibility is a separately named execution posture, not weakened calibration. It allows the already-existing farming implementation to run under Session Control's duration and operational visibility, but its games never enter calibrated `controlCounts`; only a fully pinned `ACTIVE_DDA` game may influence min/max DDA decisions.

## Verification

Result: all commands passed on 2026-10-18, including the strict Chrome compatibility START smoke and ACTIVE_DDA fail-closed prevalidation.

**Commands:**
- `node tests/session_control/run.js` -- all lifecycle, recovery, mode and orchestration suites pass.
- `python tests/test_session_control_phase3.py && python tests/test_move_plan.py` -- backend composition, readiness, pin, renewal and restart contracts pass.
- `python scripts/build_userscript.py && python scripts/build_userscript.py --check && node --check script.js` -- generated userscript is current, deterministic and valid.
- `node tests/test_userscript_chrome.js` -- installed userscript covers compatibility START and calibrated START-to-first-game with no console errors.
- `git diff --check` -- no whitespace or encoding errors.

## Suggested Review Order

**Runtime entry and recovery**

- Start here: production bootstrap negotiates mode, recovers locally, and retries server validation.
  [`script.js:277`](../../script.js#L277)

- Recovery rebuilds queue and game context only from exact persisted and stable evidence.
  [`platform-chesscom.js:207`](../../frontend/session_control/platform-chesscom.js#L207)

- START performs fresh context negotiation before committing the durable session.
  [`runtime.js:128`](../../frontend/session_control/runtime.js#L128)

**Durable lifecycle and safety**

- Session start persists execution posture and acquires leadership before commit.
  [`controller.js:182`](../../frontend/session_control/controller.js#L182)

- Compatibility admission tracks in-flight games without claiming calibrated DDA.
  [`controller.js:398`](../../frontend/session_control/controller.js#L398)

- Reducer distinguishes safe queue cancellation and compatibility result completion.
  [`reducer.js:162`](../../frontend/session_control/reducer.js#L162)

- Snapshot validation preserves additive execution mode and activation context across reloads.
  [`models.js:196`](../../frontend/session_control/models.js#L196)

**Backend calibration contract**

- Deployment status declares exact target identity and compatibility reason.
  [`capability.py:122`](../../core/smart_pacing/capability.py#L122)

- Authenticated endpoint exposes the typed status consumed before START.
  [`app.py:1356`](../../app.py#L1356)

**UI and verification**

- Status presenter makes rollout and execution posture visible without disabling feedback.
  [`ui.js:60`](../../frontend/session_control/ui.js#L60)

- Chrome smoke proves default compatibility START and ACTIVE_DDA fail-closed behavior.
  [`test_userscript_chrome.js:184`](../../tests/test_userscript_chrome.js#L184)
