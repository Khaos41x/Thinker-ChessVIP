---
title: 'Deterministic Elo Calibration Phase 3 Coordinator Integration'
type: 'feature'
created: '2026-10-12'
status: 'done'
baseline_commit: 'f04630d'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/deterministic-elo-calibration-v2-2026-10-11/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/deterministic-elo-calibration-v2-2026-10-11/ENGINEERING-PLAN.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-deterministic-elo-calibration-phase-0-1.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-deterministic-elo-calibration-phase-2.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/move-plan` still resolves selector strength through the linear V1 mapper and mutates Komodo without verified cold profile transitions. Calibration identity is absent from plan/cache contracts, so an empirical artifact cannot safely control live selection.

**Approach:** Insert an artifact-bound calibration integration behind `EngineCoordinator`, pin the first valid V2 profile per game/side, and run reference-shallow → selector → reference-deep under the existing single lease. Default shadow mode computes and reports the V2 proposal while executing V1; explicit activation executes only an admitted calibrated time-only profile.

## Boundaries & Constraints

**Always:** Keep one coordinator lease for all stages; transition only while idle; apply complete allowlisted profiles; issue Clear Hash and `isready` at every stage; restore the canonical reference profile in `finally`; include transition time in the absolute deadline; bind scale, artifact, resolver, resolution key, applied Skill, profile digest, and budget class into plan/cache identity; keep shadow failures request-safe and observable; preserve `/getmove` compatibility while isolating its legacy Skill policy.

**Ask First:** Enabling V2 by default, selecting or checking in a production calibration artifact/attestation, changing the Phase-1 seed/inverse contract, changing frontend payload requirements, or integrating Phase-4 Prometheus/activation machinery.

**Never:** Derive selector Depth or Nodes from Elo; truncate a calibrated selector below its artifact time budget and still claim calibration; allow clients to submit UCI options; let selector state leak into reference analysis; cache fallback/partial plans; change Puzzle state; push commits.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Shadow healthy | Valid artifact/profile; activation flag false | V1 move unchanged; V2 proposal and identity returned/logged | No V2 engine mutation |
| Active healthy | Flag true; profile admitted before deadline | Calibrated Skill-only selector between identical cold reference profiles | Complete plan identifies applied artifact/profile |
| Missing/invalid artifact | Startup or request cannot resolve V2 | V1 remains operational in shadow | `calibrationStatus=not_applied` with bounded reason |
| Budget too small | Remaining time below `minimumAdmissionMs` | Calibrated selector never starts | Reference move fallback; no false Elo claim |
| Apply/reset uncertainty | Configure, Clear Hash, or readiness fails | Process generation invalidated; selector result discarded | Typed fallback; reference state cannot be trusted/cached |
| Same game repeats | Same game token/side with later revision | Reuse pinned artifact/profile resolution | Conflicting activation cannot alter an in-flight game |

</frozen-after-approval>

## Code Map

- `core/smart_pacing/calibration.py` — shadow/active policy, per-game pin registry, proposal DTO, and fail-closed resolution.
- `core/smart_pacing/coordinator.py` — exclusive lease boundary and uncertain-state restart semantics.
- `core/smart_pacing/analyzer.py` — atomic three-stage transaction, admission, restore, and typed selector fallback.
- `core/smart_pacing/adapter.py` — complete reference/V1/V2 profile application with cold reset verification.
- `core/smart_pacing/service.py` — calibration resolution, cache identity, diagnostics, and structured event emission.
- `core/smart_pacing/contracts.py`, `identities.py` — compatible response fields and calibration-sensitive cache keys.
- `app.py` — composition/configuration, artifact loading, legacy route isolation, and removal of old helper ownership.
- `tests/test_move_plan.py`, `tests/elo_calibration/test_coordinator_contract.py` — hermetic shadow, active, deadline, restart, pinning, and leakage tests.

## Tasks & Acceptance

**Execution:**
- [x] Add strict integration DTOs and a bounded per-game profile pin registry around `EloCalibrator`.
- [x] Extend adapter/coordinator stage contracts so full profiles apply cold and uncertain mutations restart the engine.
- [x] Refactor analyzer/service into one atomic reference-selector-reference transaction with calibrated admission and V1 shadow execution.
- [x] Extend response/cache identities with calibration identity without requiring new client fields during compatibility mode.
- [x] Replace `get_target_depth`/`get_skill_level` ownership; keep any V1 mapper explicit and unreachable from active V2.
- [x] Add hermetic coordinator and service tests; retain Phase 0–2 and legacy endpoint regressions.

**Acceptance Criteria:**
- Given shadow mode, when a valid V2 proposal differs from V1, then returned move and engine selector call remain V1 while diagnostics expose the proposal.
- Given active mode, when a request is admitted, then the event trace is reference apply/reset/ready/search → V2 apply/reset/ready/search → identical reference apply/reset/ready/search under one lease.
- Given any selector or restore failure, when the request completes, then generation changes or a typed fallback is returned and no complete plan is cached.
- Given the same game token and side across revisions, when calibration is resolved again, then artifact checksum, resolution key, applied Skill, and profile digest remain pinned.
- Given repository-wide Elo searches, when Phase 3 is complete, then no calibrated path maps Elo to Depth/Nodes or uses the old named helpers.

## Spec Change Log

## Design Notes

The feature flag controls execution, not proposal generation. Shadow is the default and never applies the V2 profile to Komodo. Active mode is fail-closed: insufficient budget or unverified profile state selects the inherited reference fallback rather than silently reverting to an uncalibrated selector while claiming the requested Elo.

## Verification

**Commands:**
- `python tests/test_move_plan.py` — coordinator, API, cache, security, shadow, and active integration pass hermetically.
- `python -m unittest discover -s tests/elo_calibration -p "test_*.py" -v` — Phase 0/1 contracts remain green.
- `python -m unittest discover -s tests/elo_calibration_phase2 -p "test_*.py" -v` — offline pipeline remains green.
- `python tests/test_smart_pacer_backend.py` and `python tests/test_engine_recovery.py` — legacy compatibility and recovery remain green.
- `python -m compileall -q core app.py tests` and `git diff --check` — syntax and whitespace checks pass.

## Suggested Review Order

**Runtime composition and policy**

- Start with artifact loading, binary identity binding, and default Shadow activation.
  [`app.py:591`](../../app.py#L591)

- Per-game profiles stay deterministic, bounded, reclaimable, and active-game protected.
  [`calibration.py:66`](../../core/smart_pacing/calibration.py#L66)

- Move-plan resolution binds calibration identity into execution and cache semantics.
  [`service.py:67`](../../core/smart_pacing/service.py#L67)

**Atomic engine transaction**

- One lease serializes reference-shallow, selector, and reference-deep stages.
  [`coordinator.py:166`](../../core/smart_pacing/coordinator.py#L166)

- Lease ownership prevents cross-game stop and restart races during supersession.
  [`coordinator.py:81`](../../core/smart_pacing/coordinator.py#L81)

- Analyzer restores reference state after every selector outcome before releasing the lease.
  [`analyzer.py:69`](../../core/smart_pacing/analyzer.py#L69)

- Adapter enforces verified cold profiles and exact time-only calibrated search.
  [`adapter.py:13`](../../core/smart_pacing/adapter.py#L13)

**Deadline and lifecycle safety**

- UCI configuration, reset, readiness, startup, and search share the absolute deadline.
  [`app.py:339`](../../app.py#L339)

- Authenticated release clears coordinator and calibration state at game completion.
  [`app.py:1199`](../../app.py#L1199)

- Userscript game transitions issue best-effort authenticated lifecycle release.
  [`script.js:2006`](../../script.js#L2006)

**Verification**

- Hermetic contracts cover Shadow, Active, deadlines, pinning, cancellation, and isolation.
  [`test_coordinator_contract.py:78`](../../tests/elo_calibration/test_coordinator_contract.py#L78)

- Coordinator and endpoint regressions cover concurrency, authentication, cache, and release.
  [`test_move_plan.py:134`](../../tests/test_move_plan.py#L134)
