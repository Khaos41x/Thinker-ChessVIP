---
title: 'Deterministic Elo Calibration Phase 4 Observability and Canary'
type: 'feature'
created: '2026-10-12'
status: 'done'
baseline_commit: 'f1c5666f5414436ad55ebd16fe8562e57a71f2cf'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/architecture/deterministic-elo-calibration-v2-2026-10-11/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/deterministic-elo-calibration-v2-2026-10-11/ENGINEERING-PLAN.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-deterministic-elo-calibration-phase-3.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The calibrated engine path has no Prometheus contract and activation remains all-or-nothing, so operators cannot measure NPS, latency, failure behavior, or expose a bounded cohort safely before full promotion.

**Approach:** Add an injectable telemetry adapter and authenticated loopback metrics endpoint, then replace the boolean activation with deterministic game-pinned shadow/canary/active policy while retaining compatibility with the existing environment flag.

## Boundaries & Constraints

**Always:** Use fixed histogram buckets and bounded labels only; count nodes and search seconds from the same completed-search population; clear per-slot gauges after every lease; protect `/metrics` with loopback plus the existing bearer capability; assign canary by a versioned SHA-256 rule over stable game identity and pin that cohort for the game; keep Shadow as the safe default; preserve the Phase 3 atomic transaction and deadline semantics.

**Ask First:** Enabling Active by default, changing the production artifact, adding a non-loopback scrape listener, exposing game/user/FEN identifiers, or changing statistical promotion thresholds.

**Never:** Put target Elo, Skill, game token, seed, FEN, user ID, or artifact checksum into unbounded metric labels; change Elo into Depth/Nodes; let metrics failures break move selection; reassign an existing game when rollout configuration changes; push commits.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Authorized scrape | Loopback GET with valid bearer | Prometheus text includes registered engine/calibration families | No engine mutation |
| Unsafe scrape | Remote address or missing/invalid bearer | Request rejected by the existing capability boundary | No metric payload disclosed |
| Canary selection | Percentage and/or explicit game key | Stable cohort; selected games execute V2 and controls execute V1 | Invalid configuration fails to Shadow |
| Repeated game | Same game token/side across revisions | Artifact, profile, and cohort remain pinned | Release removes both pins |
| Search completes | Engine reports nodes and seconds | Both totals increment together; duration and bounded distributions update | Missing engine stats omit both NPS totals |
| Engine failure | Timeout, restart, invalid artifact, clamp, or degraded outcome | Corresponding bounded counter increments; slot gauges clear | Telemetry exceptions are swallowed/logged |

</frozen-after-approval>

## Code Map

- `core/elo_calibration/telemetry.py` — Prometheus collectors, bounded metric API, no-op safety, and scrape rendering.
- `core/smart_pacing/calibration.py` — deterministic rollout policy and game-pinned cohort decision.
- `core/smart_pacing/coordinator.py` — bounded slot lifecycle gauges and restart/timeout signals.
- `core/smart_pacing/adapter.py`, `app.py` — per-stage search statistics, artifact/status publication, configuration, and secure `/metrics` route.
- `core/smart_pacing/service.py`, `contracts.py` — completed-selection, fallback, degraded, and clamp observations.
- `tests/elo_calibration/test_observability_canary.py`, `tests/test_move_plan.py` — hermetic collector, cohort, lifecycle, and endpoint security tests.

## Tasks & Acceptance

**Execution:**
- [x] Add `prometheus-client==0.26.0` and an injectable, bounded telemetry module with fixed buckets and artifact identity.
- [x] Implement versioned deterministic rollout selection with explicit-key override, percentage cohort, per-game pinning, and fail-safe configuration.
- [x] Instrument engine searches, coordinator leases, completed calibration decisions, operational failures, timeouts, restarts, clamps, and degraded outcomes.
- [x] Expose `/metrics` through the existing loopback/bearer decorator using Prometheus content type.
- [x] Add hermetic tests and run all Phase 0–4 plus legacy regression suites.

**Acceptance Criteria:**
- Given identical rollout inputs, when resolved repeatedly or across runtime instances, then cohort assignment is byte-for-byte deterministic and remains pinned until release.
- Given a completed search with nodes and engine seconds, when metrics are scraped, then node/second totals represent the same sample and contain no high-cardinality labels.
- Given a lease on the single engine slot, when it succeeds, fails, or times out, then current target/Skill/active gauges are cleared in `finally`.
- Given `/metrics`, when the caller is not loopback-authenticated, then no Prometheus body is returned.
- Given no or invalid rollout configuration, when the application starts, then execution remains Shadow and V1 behavior is preserved.

## Spec Change Log

## Design Notes

Rollout modes are `shadow`, `canary`, and `active`. Canary selection first checks a bounded explicit-key set, then compares a versioned SHA-256-derived unsigned value with the configured basis-point threshold. The effective Phase 3 decision remains `active` or `shadow`; `calibrationCohort` records `canary`, `control`, `active`, or `shadow` and participates in cache identity.

## Verification

**Commands:**
- `python -m unittest discover -s tests/elo_calibration -p "test_*.py" -v` — Phase 0/1, coordinator, telemetry, and canary contracts pass.
- `python -m unittest discover -s tests/elo_calibration_phase2 -p "test_*.py" -v` — offline pipeline remains green.
- `python tests/test_move_plan.py`, `python tests/test_smart_pacer_backend.py`, `python tests/test_engine_recovery.py`, `python tests/test_server.py` — API, compatibility, recovery, and server regressions pass.
- `node tests/test_smart_pacer.js` and `node tests/test_smart_pacer_sequences.js` — userscript behavior remains green.
- `python -m compileall -q app.py core tests` and `git diff --check` — syntax and whitespace checks pass.

## Suggested Review Order

**Runtime activation and safety**

- Start with deterministic cohort selection, pinning, and fail-closed capacity behavior.
  [`calibration.py:21`](../../core/smart_pacing/calibration.py#L21)

- Follow the request path that binds rollout decisions to atomic engine work.
  [`service.py:70`](../../core/smart_pacing/service.py#L70)

- Verify lease-scoped gauges and cleanup across every transaction outcome.
  [`coordinator.py:180`](../../core/smart_pacing/coordinator.py#L180)

**Telemetry and engine boundaries**

- Review bounded Prometheus collectors, paired NPS samples, and no-op isolation.
  [`telemetry.py:20`](../../core/elo_calibration/telemetry.py#L20)

- Inspect cold-profile transitions and per-stage engine search instrumentation.
  [`adapter.py:14`](../../core/smart_pacing/adapter.py#L14)

- Confirm secure scrape routing and environment-driven rollout construction.
  [`app.py:1407`](../../app.py#L1407)

**Verification and packaging**

- Canary and telemetry contracts exercise determinism, cardinality, and failure visibility.
  [`test_observability_canary.py:30`](../../tests/elo_calibration/test_observability_canary.py#L30)

- Endpoint tests prove loopback and bearer protection for metric disclosure.
  [`test_move_plan.py:535`](../../tests/test_move_plan.py#L535)

- Production dependency is explicitly pinned for reproducible deployment.
  [`requirements.txt:6`](../../requirements.txt#L6)
