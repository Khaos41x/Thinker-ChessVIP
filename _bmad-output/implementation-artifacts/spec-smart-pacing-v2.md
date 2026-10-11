---
title: 'Smart Pacing V2 architecture implementation'
type: 'feature'
created: '2026-10-11'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'cacebdbe50670ce61f3726ac6b0f0a7347091420'
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-thinker-chess-vip-2026-10-09/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-thinker-chess-vip-2026-10-09/SOLUTION-DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current Smart Pacing implementation makes separate `/getmove` and `/analyze` requests, uses a stateless multiplier and fixed caps, and cannot guarantee coherent evidence, safe time-bank recovery, server-side cancellation, or exact UCI promotion execution. Existing uncommitted UI and Smart Pacing changes must be preserved and reconciled rather than discarded.

**Approach:** Add Smart Pacing V2 behind an off-by-default flag: one versioned `/move-plan` transaction and engine coordinator on the backend, plus a pure stateful pacing core and single guarded scheduler on the frontend. Keep V1 and legacy endpoints operational during shadow comparison; provide deterministic tests, replay, calibration, and typed diagnostics before any default cutover.

## Boundaries & Constraints

**Always:** Preserve current UI/scout changes and legacy contracts; use one Komodo process/coordinator; count queue, engine, network, and wait time from monotonic position observation; separate exact observation, analysis, and contextual cache identities; keep clocks/session policy in the browser and chess evidence in the backend; execute full UCI including underpromotion; isolate Puzzle from competitive state; version schemas, models, cache keys, parameters, telemetry, and release manifests.

**Ask First:** Enabling V2 by default, disabling legacy engine routes, enforcing capability authentication for existing users, selecting a userscript bundler, or promoting timing parameters without an approved scorecard.

**Never:** Commit `users.db`, secrets, telemetry containing identity/raw games by default, or the Komodo binary; claim HTTP abort cancels engine work; allow overlapping engine owners/timers; cache partial/fallback plans; make durable storage necessary for correctness; overwrite unrelated dirty-tree work; claim calibration success without generated evidence.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Healthy live game | Valid FEN, reliable clocks, current revision | One atomic plan yields full UCI, typed evidence, safe total target, and one execution | Stale revision is cancelled/ignored |
| Tight or missing clock | Reserve threatened or low-confidence clock | Survival/degraded plan; no long think; conservative deadline | Typed reasons, never a hidden fixed delay |
| Engine deadline/restart | Queue or staged analysis exhausts budget | Partial/fallback response within envelope; generation changes on restart | No late retry or cache write |
| Puzzle | Puzzle hint/auto-move | Separate stateless presentation delay | Never mutates competitive reducer/telemetry |
| Promotion | Queen or underpromotion UCI | Exact legal promotion executes once | Malformed/stale move does not execute |
| Cache hit | Same analysis identity and versions | Evidence may be reused; frontend target is recalculated | Incompatible/partial entries miss safely |

</frozen-after-approval>

## Code Map

- `app.py` -- Flask compatibility routes, health/config entry points, and composition root.
- `core/smart_pacing/` -- versioned contracts, identities/cache, coordinator, analyzer, evidence, and move-plan service.
- `script.js` -- current userscript integration seam, dirty UI baseline, V1 path, flag, adapters, and scheduler.
- `src/smart_pacing/` -- DOM-free JS contracts, reducer, clock/preflight/budget/humanizer/decision cores, and ports.
- `tests/` -- backend fakes, browser fixtures, properties, distributions, sequences, and legacy regressions.
- `scripts/` -- replay/calibration reports and immutable release-manifest generation.

## Tasks & Acceptance

**Execution:**
- [x] `core/smart_pacing/*.py`, `app.py` -- implement validated v1 DTOs, three identities, bounded caches, single deadline-aware coordinator, staged two-lens analysis/evidence, typed outcomes, `/move-plan`, readiness/generation health, and legacy routing through the coordinator.
- [x] `src/smart_pacing/*.js` -- implement pure typed clock/session reducer, Elo smoothing, preflight reserve/debt policy, seeded humanizer, preparation overlay, Puzzle policy, settings/telemetry ports, and deterministic decisions.
- [x] `script.js` -- integrate V2/shadow flags with one abortable request and sole scheduler; retain V1 rollback, MAX behavior, exact stale guards, and full promotion UCI.
- [x] `tests/fixtures/smart_pacing_positions.json`, `tests/test_move_plan.py` -- cover contracts, evidence relationships, cache/version isolation, book, deadlines, cancellation/restart, security validation, and fake-engine recovery.
- [x] `tests/test_smart_pacer.js`, `tests/test_smart_pacer_sequences.js`, `tests/test_userscript_chrome.js` -- cover pure properties, full-game time controls, clock degradation, Puzzle isolation, SPA cancellation, promotion, and V1 regressions.
- [x] `scripts/calibrate_smart_pacing.py`, `scripts/replay_smart_pacing.py` -- emit reproducible reports/manifests, reject reserve violations, and replay diagnostic sessions without making telemetry mandatory.

**Acceptance Criteria:**
- Given V2 is disabled, when existing tests and UI paths run, then current behavior and dirty-tree UI work remain intact.
- Given concurrent or obsolete engine work, when a newer live revision arrives, then the coordinator bounds interference, owns the only engine call path, and returns typed outcomes.
- Given any pacing decision, when clocks, evidence, debt, and technical elapsed time are applied, then `targetTotalMs` cannot invade reserve and identical seed/state reproduces the result.
- Given cached versus uncached equivalent evidence, when frontend session context is unchanged, then target distributions remain equivalent.
- Given an execution attempt, when game, revision, FEN, enabled state, legality, or promotion differs, then no move or reducer commit occurs.
- Given calibration/shadow artifacts are absent or fail thresholds, when release state is evaluated, then V2 remains non-default and rollback remains available.

## Spec Change Log

## Design Notes

Implementation follows the corrected phase order: hermetic capability baseline and corpus; contracts/coordinator; move-plan/evidence; frontend core; guarded integration; ports/telemetry; replay and shadow artifacts. Commercial packaging and production cutover are prepared as seams and gates, not falsely declared complete without operational evidence and explicit approval.

## Verification

**Commands:**
- `python tests/test_move_plan.py` -- hermetic backend contracts and coordination pass.
- `python tests/test_smart_pacer_backend.py` -- V1 backend compatibility passes.
- `python tests/test_engine_recovery.py` -- single-engine recovery remains green.
- `node tests/test_smart_pacer.js` -- pacing unit/integration regressions pass.
- `node tests/test_smart_pacer_sequences.js` -- deterministic sequence safety passes.
- `node tests/test_userscript_chrome.js` -- browser bootstrap, SPA, clocks, and execution guards pass.
- `python scripts/calibrate_smart_pacing.py --check` -- report is reproducible and rejects unsafe parameters.

## Suggested Review Order

**API trust boundary**

- Start with the capability lifecycle, request guards, limits, and loopback enforcement.
  [`security.py:14`](../../core/smart_pacing/security.py#L14)

- See all protected engine entry points and the atomic plan endpoint.
  [`app.py:43`](../../app.py#L43)

- Verify first-run terminal pairing and persistent token discovery.
  [`app.py:1176`](../../app.py#L1176)

**Atomic engine planning**

- Follow admission, cancellation grace, deadline ownership, and engine generation.
  [`coordinator.py:80`](../../core/smart_pacing/coordinator.py#L80)

- Review cache identity rebinding and typed plan fallbacks.
  [`service.py:13`](../../core/smart_pacing/service.py#L13)

- Inspect validated request identities and versioned DTO boundaries.
  [`contracts.py:66`](../../core/smart_pacing/contracts.py#L66)

**Browser pacing and execution**

- Review isolated userscript pairing and Bearer header provisioning.
  [`script.js:1839`](../../script.js#L1839)

- Trace per-game V2 state reset, clock budget, and atomic request creation.
  [`script.js:1971`](../../script.js#L1971)

- Confirm V2 remains gated, Puzzle-isolated, and uses the sole scheduler.
  [`script.js:3347`](../../script.js#L3347)

- Inspect the pure reserve/debt policy and bounded timing decision.
  [`budget.js:11`](../../src/smart_pacing/budget.js#L11)

**Verification**

- Start backend tests with cache rebinding and security denial paths.
  [`test_move_plan.py:351`](../../tests/test_move_plan.py#L351)

- Review deterministic full-game, reserve, debt, Puzzle, and promotion sequences.
  [`test_smart_pacer_sequences.js:1`](../../tests/test_smart_pacer_sequences.js#L1)
