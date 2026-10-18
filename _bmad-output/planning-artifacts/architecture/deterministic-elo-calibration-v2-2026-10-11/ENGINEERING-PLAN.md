# Engineering Plan — Deterministic Elo Calibration v2.0

## Outcome

Replace the current heuristic rating mapper with a versioned empirical calibration system that can state, reproduce, and monitor what a target rating means under a declared protocol.

## Phase 0 — Measurement Contract

Deliver an immutable experiment manifest defining:

- initial `scaleId` and reference-opponent ladder;
- Komodo and opponent binary hashes plus complete UCI options;
- time control, Threads, Hash, MultiPV, pondering, tablebases, and concurrency;
- search-state policy (`Clear Hash` plus `isready` before every selector move and every move-plan stage);
- paired opening corpus and deterministic seed schedule;
- hardware/NPS fingerprint and admissible drift;
- estimator, equivalence bounds, minimum pairs, and stopping rule.

**Exit gate:** the team can answer “1700 on which scale, hardware envelope, time control, and confidence?” without referring to source code.

## Phase 1 — Typed Core and Fake UCI

Implement strict models, artifact loading/checksums, inverse monotone lookup, seeded adjacent-Skill resolution, typed failures, structured logs, and a fake UCI engine.

**Tests:** exact anchors, isotonic plateaus and generalized inverse, no overshoot, Skill `[0,25]`, cross-process seed golden vectors, deterministic replay, artifact corruption, engine mismatch, reference/selector/reference stage transitions with hash reset, no warm-state leakage, cache identity, budget admission, and unsupported ranges.

**Exit gate:** production-independent unit and contract tests pass without the commercial Komodo binary.

## Phase 2 — Benchmark and Curve Builder

Implement manifest preflight, canonical/idempotent paired match records, resumable PGN/JSON output, versioned pentanomial estimation, forward isotonic/PCHIP fitting, generalized inversion, independent holdout validation, immutable artifacts, and validation attestations.

Run a coarse integral-Skill ladder first; allocate additional games to high-uncertainty and high-curvature regions. Use a pinned Stockfish `UCI_Elo` ladder only within its documented range and a connected reference pool for other anchors.

**Exit gate:** a candidate artifact reproduces from raw results and passes schema, monotonicity, environment, and statistical checks.

## Phase 3 — Coordinator Integration

Add `EloCalibrator` behind the existing EngineCoordinator. Pin artifact and resolved Skill per game, extend move-plan/cache identity, and apply reference/selector/reference profiles atomically under one request lease. Admit only validated budget classes that fit the live deadline. Introduce shadow mode. Remove target-rating ownership from `get_target_depth`, the linear `get_skill_level`, and all rating-dependent depth/node limits.

**Exit gate:** shadow requests record a v2 proposal without changing moves; no calibrated path combines Elo with depth/nodes.

## Phase 4 — Observability and Canary

Expose:

- fixed-bucket target-Elo and applied-Skill histograms for completed selections;
- bounded per-engine-slot current target, applied Skill, and active gauges;
- `thinker_engine_search_nodes_total` counter;
- `thinker_engine_search_seconds_total` counter;
- `thinker_engine_search_duration_seconds` histogram;
- `thinker_engine_calibration_info` artifact identity;
- clamp, invalid-artifact, restart, timeout, and degraded-mode counters.

Grafana derives NPS with:

```promql
rate(thinker_engine_search_nodes_total[5m])
/
rate(thinker_engine_search_seconds_total[5m])
```

Canary a bounded cohort and compare latency, NPS drift, time forfeits, crashes, target distribution, and fallback rate against v1.

**Exit gate:** operational gates and statistical holdouts pass; rollback has been exercised.

## Phase 5 — Low-Elo Policy, Conditional

Start only as a separate architecture after v2.0 measures Skill 0 and licensed human-game data is approved. Until then targets below the measured floor are explicitly unsupported. The later design must define candidate ownership, fixed engine profile, deterministic identity, tactical-safety rules, caching, and independent match-Elo/human-likeness gates.

**Exit gate:** 800–1200 targets meet match-strength intervals without increasing catastrophic-error or tactical-giveaway rates beyond the approved envelope.

## Statistical Acceptance

For score `p = (W + 0.5D) / N`, report the conventional point estimate:

```text
deltaElo = 400 * log10(p / (1 - p))
```

Promotion uses pentanomial paired-game inference rather than that point estimate alone. Initial proposed gate:

- estimated difference within ±35 Elo;
- 95% interval contained within ±75 Elo;
- at least 200 completed opening pairs;
- NPS within the manifest drift envelope;
- no material color imbalance, crash regression, or time-forfeit regression.

Pilot results may change these numbers before implementation acceptance, but a run may never change its own thresholds.

## Definition of Done

- No code path derives depth or nodes from target Elo.
- Every calibrated request carries `scaleId` and artifact version.
- Runtime mapping is monotone, bounded, deterministic, and replayable.
- The full calibration can be regenerated from manifest plus raw results.
- Holdout targets pass the statistical equivalence gate.
- Metrics expose target, applied Skill, effective NPS, failures, and artifact identity without unbounded labels.
- Mismatches fail closed or use an explicit degraded profile; no silent heuristic fallback remains.
- Identical miniature-corpus runs produce byte-identical sufficient statistics, coefficients, inversions, and gate decisions.
