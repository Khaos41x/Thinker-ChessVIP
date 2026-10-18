---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 6
research_type: 'technical'
research_topic: 'Deterministic Elo calibration for Komodo 14.1'
research_goals: 'Establish the documented limits of Komodo Skill-to-Elo mapping, explain nonlinear strength loss from compounded search limits, and design an empirical calibration, validation, and observability system for Thinker Chess VIP.'
user_name: 'GG'
date: '2026-10-11'
web_research_enabled: true
source_verification: true
---

# Research Report: Deterministic Elo Calibration for Komodo 14.1

**Date:** 2026-10-11
**Author:** GG
**Research Type:** Technical

---

## Executive Summary

The current rating mapper is not a calibration model. It combines an assumed linear Elo-to-Skill equation with position-dependent search truncation and then interprets the result as a stable human rating. That design cannot be repaired by changing the slope from 120 to another magic constant. Direct interrogation of the shipped Komodo 14.1 binary shows that `Skill` is an integer from 0 to 25 and that the engine exposes no `UCI_Elo` option. Public Komodo and CCRL material contains no exact per-Skill equation. The only technically honest relationship is therefore an empirical, protocol-specific curve with uncertainty.

The recommended v2 architecture measures every integral Skill under a fixed environment, estimates effective strength from paired matches, removes sampling inversions with weighted isotonic regression, and constructs a non-overshooting PCHIP interpolation. Runtime inversion maps a target rating to a fractional latent Skill; a stable seeded resolver selects an adjacent legal integer Skill, producing deterministic replay and a smooth expected-strength curve. Hash, Threads, MultiPV, engine version, time control, opening suite, tablebases, concurrency, and hardware/NPS envelope are calibration invariants—not hidden Elo controls.

The design also separates strength from human-likeness. If Komodo Skill 0 is stronger than the 800–1200 requirement, v2 must not extrapolate below its measured floor. A separately calibrated human-error policy can select among adequately searched candidates using rating-conditioned human error distributions. Automated paired-opening tournaments, pentanomial statistics, immutable artifacts, shadow/canary rollout, and bounded-cardinality Prometheus telemetry make the result testable and operable.

### Key Conclusions

- No public exact Komodo 14.1 `Skill → Elo` formula exists; claiming one would be fabricated precision.
- The repository's present `(elo - 800) / 120` mapping is an unvalidated assumption.
- Combining Skill with tiny time budgets and depth/node caps makes strength depend nonlinearly on position and NPS.
- “1700 Elo” must name a scale and protocol; it is not portable between Chess.com, Lichess, CCRL, or Stockfish `UCI_Elo`.
- The correct mathematical model is an empirically fitted monotone inverse curve plus a reproducible integer-Skill resolution policy.
- Equal match Elo and human-like move choice are separate acceptance dimensions.

## Table of Contents

1. [Research Overview](#research-overview)
2. [Scope and Methodology](#technical-research-scope-confirmation)
3. [Technology Stack Analysis](#technology-stack-analysis)
4. [Integration Patterns](#integration-patterns-analysis)
5. [Architecture and Mathematics](#architectural-patterns-and-design)
6. [Implementation and Adoption](#implementation-approaches-and-technology-adoption)
7. [Engineering Roadmap](#technical-research-recommendations)
8. [Research Conclusion](#research-conclusion)

## Research Overview

This research distinguishes vendor-documented engine behavior from locally measured calibration. It uses official engine documentation, engine source documentation where available, primary benchmark tables, and published rating methodology. Claims without a public Komodo 14.1 specification are explicitly treated as hypotheses requiring measurement.

---

## Technical Research Scope Confirmation

**Research Topic:** Deterministic Elo calibration for Komodo 14.1

**Research Goals:** Establish the documented limits of Komodo Skill-to-Elo mapping, explain nonlinear strength loss from compounded search limits, and design an empirical calibration, validation, and observability system for Thinker Chess VIP.

**Technical Research Scope:**

- Architecture analysis for calibration ownership, versioning, and runtime safety
- Implementation approach for continuous parameter interpolation
- UCI integration behavior for Komodo and reference opponents
- Statistical validation through controlled matches and confidence intervals
- Performance and observability requirements for NPS, applied parameters, and calibration drift

**Research Methodology:**

- Current web data with source verification
- Cross-check critical claims against primary sources
- Explicit confidence levels for undocumented Komodo behavior
- Repository inspection to connect findings to the current implementation

**Scope Confirmed:** 2026-10-11

## Technology Stack Analysis

### Engine and UCI Control Surface

The production engine is the proprietary Komodo 14.1 64-bit executable controlled through UCI by `python-chess`. A direct `uci` interrogation of the repository binary is the strongest available evidence for its actual control surface: it exposes `Skill` as an integer from **0 through 25** (default 25), `MultiPV` from 1 through 218, `Hash`, `Threads`, `Variety`, `Personality`, and `Auto Skill`; it does **not** expose `UCI_Elo`. This contradicts the proposed 0–20 assumption and means there is no engine-provided Elo contract for Komodo 14.1.

The public Komodo product documentation describes `Skill` and `Auto Skill`, but does not publish an exact Skill-to-Elo equation. CCRL provides a defensible reference for full-strength engine performance—Komodo 14.1 is listed with a rating and confidence interval under its fixed 40/4 protocol—but it does not publish a per-Skill calibration curve. Therefore an "exact" Komodo Skill-to-Elo formula cannot be recovered from documentation; it must be estimated experimentally for a named test protocol.

_Sources: [Official Komodo product documentation](https://komodochess.com/store/pages.php?cmsid=14), [CCRL 40/4 complete list](https://computerchess.org.uk/404/rating_list_all.html), [CCRL methodology](https://computerchess.org.uk/)_

### Runtime Language and Libraries

Python 3.12 remains the correct integration language because the existing Flask service and engine coordinator already use it. `python-chess` provides the UCI process abstraction and a `Limit` object whose independent fields include time, depth, nodes, clocks, increments, and remaining moves. The calibration design must treat those fields as alternative search-budget policies rather than Elo knobs: using several stopping criteria together causes the first reached boundary to dominate and makes effective strength depend on position, machine throughput, and whether the engine reaches the depth at which its weakening policy acts.

The initial module should use the standard library for strict dataclasses/enums, JSON artifact loading, hashing, deterministic seeding, and structured logging. Scientific fitting should live in an offline calibration tool, where NumPy/SciPy or an equivalent monotone fitting implementation can be pinned independently from the production server. The production `EloCalibrator` should only evaluate a precomputed, versioned curve and must not fit data at request time.

_Source: [python-chess engine API](https://python-chess.readthedocs.io/en/latest/engine.html)_

### Reference Engine and Human-Likeness Evidence

Stockfish is useful as a version-pinned reference opponent, not as universal ground truth. Its official implementation provides a documented empirical mapping from `UCI_Elo` to an internal fractional skill level. Current source states that levels 0–19 approximately cover CCRL Blitz Elo 1320–3190, using a cubic fit derived from matches against Stash engines. Its weakening mechanism searches multiple candidate moves and applies a randomized bias toward suboptimal candidates; it selects the weak move at depth `1 + int(level)`. This is direct evidence that strength limiting is a move-selection policy layered on search, and that an external depth cap can interfere with that policy.

The same evidence also sets a hard testing boundary: current Stockfish `UCI_Elo` cannot validate targets below 1320. Stockfish levels 1–8 are not stable, independently certified Elo anchors across releases and time controls. Every reference opponent must therefore be identified by binary hash, UCI configuration, time control, opening suite, and calibration namespace.

For human-like weak play, the Maia research is the strongest primary evidence found. Depth-limited Stockfish did not preferentially match lower-rated human moves; stronger Stockfish versions predicted human moves better across nearly all tested human levels. Maia instead trained rating-specific policies from human games and achieved targeted move-prediction behavior for rating bands 1100–1900. This supports a two-axis design: match strength statistically with tournament results, and measure human-likeness separately with move-distribution and blunder-shape tests. Equal Elo alone does not imply human-like errors.

_Sources: [Stockfish FAQ](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html), [Stockfish Skill implementation](https://github.com/official-stockfish/Stockfish/blob/master/src/search.h), [Maia paper](https://arxiv.org/abs/2006.01855), [Maia reference implementation](https://github.com/CSSLab/maia-chess)_

### Benchmark and Statistical Tooling

The validation harness should run outside the Flask request path and emit PGN plus machine-readable match records. A version-pinned match runner can be implemented with `python-chess` initially; a later high-throughput backend may use Fastchess while preserving the same manifest and result schema. Tests must use paired openings with reversed colors, deterministic seed schedules, fixed concurrency, fixed Threads/Hash, and a single time-control policy. Ratings should be estimated from W/D/L or pentanomial results with uncertainty, not inferred from a handful of games or raw win rate alone.

CCRL demonstrates why the protocol is part of the result: its published ratings name benchmark hardware, time control, opening-book policy, pondering, tablebases, game count, and BayesElo computation. Fishtest similarly uses large automated match batches and statistical stopping methods such as SPRT. The new module should adopt those reproducibility properties without pretending its local scale is interchangeable with Chess.com, Lichess, FIDE, or a different CCRL list.

_Sources: [CCRL methodology](https://computerchess.org.uk/), [CCRL Komodo 14.1 history](https://computerchess.org.uk/404/history_engine.html), [Stockfish Fishtest](https://github.com/official-stockfish/fishtest)_

### Metrics and Operational Platform

Prometheus `client_python` fits the existing Flask deployment. Target Elo and the currently applied integral Skill can be gauges; calibration identity and engine hash belong in a low-cardinality info metric. Average NPS should be derived from cumulative counters—searched nodes divided by search seconds over a Grafana time window—rather than stored only as a process-local average. Search duration and applied time budget should be histograms. Dynamic game IDs, FENs, users, and arbitrary target ratings must not become labels because they create unbounded cardinality.

Recommended primitives are:

- `thinker_engine_target_elo` gauge value, with only stable engine/profile labels;
- `thinker_engine_applied_skill` gauge value;
- `thinker_engine_search_nodes_total` counter;
- `thinker_engine_search_seconds_total` counter;
- `thinker_engine_search_duration_seconds` histogram;
- `thinker_engine_calibration_info{version,engine_sha256,scale}` info/gauge;
- `thinker_engine_calibration_clamp_total{boundary}` counter.

Grafana can compute mean NPS as `rate(thinker_engine_search_nodes_total[5m]) / rate(thinker_engine_search_seconds_total[5m])`. The calibration artifact should also record a baseline NPS distribution so alerts detect hardware or process-contention drift that invalidates the calibrated environment.

_Sources: [Prometheus Python instrumentation](https://prometheus.github.io/client_python/instrumenting/), [Prometheus histogram guidance](https://prometheus.github.io/client_python/instrumenting/histogram/), [Prometheus label API](https://prometheus.github.io/client_python/instrumenting/labels/)_

### Technology Adoption Decision

The production path should remain lightweight: Python 3.12, `python-chess`, the existing engine coordinator, and an optional Prometheus client. Calibration is an offline data pipeline that produces a small immutable JSON artifact. No cloud platform, distributed database, or runtime scientific stack is justified for v2.0. If match volume later exceeds one host, workers can shard deterministic opening pairs and merge append-only result files; the statistical contract and artifact format remain unchanged.

**Confidence:** High for the local UCI option surface, Stockfish behavior, CCRL protocol dependence, and Maia findings. Medium for any prediction of Komodo behavior below full strength because its proprietary weakening algorithm and exact Skill curve are not publicly documented. That gap is the reason empirical calibration is a required system component rather than a one-time formula copied into source code.

## Integration Patterns Analysis

### UCI Boundary

The calibrator should not own an engine subprocess. It should be a pure mapping boundary that accepts a target rating plus a versioned calibration context and returns an immutable `EngineProfile`. The existing engine coordinator remains the sole owner of Komodo process lifecycle and applies that profile through `python-chess` UCI configuration before search. This preserves one writer for mutable engine options and makes concurrent requests auditable.

The profile contract should separate three categories that UCI otherwise presents as a flat option map:

1. **Strength policy:** integral Komodo `Skill`, optional deterministic mixture metadata, and a future candidate-selection policy for ratings below the measurable Skill floor.
2. **Resource policy:** `Threads`, `Hash`, and concurrency reservation. These are deployment controls and remain fixed within a calibration namespace.
3. **Search policy:** clock-aware UCI limits for live play or a fixed benchmark time control. `depth` and `nodes` are prohibited as concurrent Elo controls.

`MultiPV` is fixed at 1 for normal Komodo play unless a separately calibrated low-Elo candidate selector is active. Increasing it silently changes search cost, so it cannot be treated as a free stylistic knob.

_Sources: [python-chess engine integration](https://python-chess.readthedocs.io/en/latest/engine.html), [Stockfish FAQ on internal candidate selection](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html)_

### Runtime Data Contracts

Use typed in-process Python contracts rather than introducing a new network service. The minimum records are:

- `CalibrationRequest`: target Elo, calibration scale, time-control class, and deterministic context key;
- `EngineProfile`: applied Skill, Hash MB, Threads, MultiPV, search policy, curve version, engine hash, clamp state, and selection seed;
- `SearchObservation`: nodes, elapsed seconds, NPS, depth/seldepth, applied profile, and termination reason;
- `CalibrationManifest`: engine/opponent hashes, option snapshots, hardware fingerprint, opening-suite hash, time control, seeds, statistical method, and fitted anchors;
- `MatchResult`: paired-opening identity, colors, W/D/L result, termination, engine telemetry, and PGN location.

Runtime contracts can be dataclasses with strict validation. Persistent manifests and match results should use canonical JSON with an explicit schema version. PGN remains the chess-domain audit artifact. Large experimental outputs should not be stored in SQLite request tables or Prometheus.

### Coordinator Integration and Failure Semantics

The coordinator applies profiles atomically at a game boundary, not halfway through a search. Each engine lease records the active profile. A configuration failure, binary-hash mismatch, unsupported option, or missing calibration artifact fails closed for calibrated mode and emits a structured error; it must not silently revert to the old heuristic. Live-game survival fallback may preserve the clock using an explicitly named uncalibrated profile, but its response and metric must state `calibration_status="degraded"`.

Because UCI options are process-global mutable state, simultaneous games must not share one Komodo process if they require different profiles. Either serialize games through one process or lease isolated processes from a pool keyed by immutable profile. Analysis and Puzzle mode should remain isolated from competitive calibration state.

### Benchmark Interoperability

The calibration runner should support a Python-native adapter first and a Fastchess adapter behind the same command/result contract. Fastchess supports deterministic opening seeds, concurrency controls, PGN output with nodes/NPS/depth, and pentanomial reporting. This makes it appropriate for high-volume validation without coupling production Flask code to the tournament tool.

Every match pair uses the same opening with colors reversed. Concurrency is pinned because excessive parallelism reduces per-engine NPS and changes the measured strength. Engine crashes, illegal moves, time forfeits, and incomplete pairs are first-class result categories, never discarded silently.

_Source: [Fastchess command reference](https://github.com/Disservin/fastchess/blob/master/man.md)_

### Metrics and Logs Integration

Prometheus receives bounded operational aggregates; structured logs and benchmark JSON receive high-cardinality diagnostic context. Target Elo and applied Skill are metric values, not arbitrary labels. Stable labels may include only engine family, calibration version, scale, and status. Game IDs, users, FENs, seeds, and binary hashes belong in logs or one low-cardinality build-info series.

Nodes and engine-reported search milliseconds are accumulated as counters. Their rate ratio is the observed NPS over a dashboard window. A histogram captures search duration; counters capture calibration clamps, invalid artifacts, engine restarts, timeouts, and degraded fallbacks. This follows Prometheus guidance to derive ratios from their components and avoid unbounded label cardinality.

_Sources: [Prometheus instrumentation practices](https://prometheus.io/docs/practices/instrumentation/), [Prometheus metric naming](https://prometheus.io/docs/practices/naming/), [Prometheus exporter guidance](https://prometheus.io/docs/instrumenting/writing_exporters/)_

### Security and Reproducibility

The local bearer-authenticated API remains the external security boundary. Calibration artifacts are read-only inputs selected by server configuration; clients cannot submit paths, arbitrary UCI option names, engine binaries, or benchmark commands. Before activation the server validates schema version, engine SHA-256, parameter ranges, monotonic anchors, and artifact checksum.

Determinism means reproducible selection for the same declared context, not removal of all controlled variation. Any fractional-strength mixture or candidate sampling uses a stable seed derived from calibration version, game identity, color, and ply. The derivation and seed are logged so the exact move-policy decision can be replayed.

## Architectural Patterns and Design

### System Architecture Pattern

Adopt a **calibration control plane / runtime data plane** split inside the existing modular monolith:

- The offline control plane runs benchmark tournaments, estimates effective ratings and uncertainty, fits a monotonic curve, validates it, and publishes an immutable calibration artifact.
- The online data plane loads one approved artifact and performs a pure, low-latency target-to-profile lookup. It never learns, refits, or mutates calibration data during a game.
- The engine coordinator applies the returned profile to an isolated UCI process and records observations.
- Prometheus and structured logs observe the data plane without becoming sources of configuration truth.

This avoids adding a microservice or database while keeping experimental dependencies and long-running tournaments out of the request path.

### Mathematical Calibration Model

There is no defensible closed-form Komodo equation to encode. The model must be derived from measured anchors under one named calibration protocol.

For each integral Skill `s ∈ {0, …, 25}`, estimate its effective performance rating `R_s` against a connected reference pool. Raw estimates may violate monotonicity because of sampling noise. Fit them in two stages:

1. Weighted isotonic regression produces non-decreasing anchors `R̂_s`, weighted by inverse rating variance or effective game count.
2. A shape-preserving PCHIP curve `R(s)` interpolates those anchors without the overshoot risk of an unconstrained global polynomial.

PCHIP is continuously differentiable and preserves monotonicity in monotone data. Isotonic regression is specifically designed to fit a non-decreasing function. Together they encode the actual measured shape without inventing a linear relation.

At runtime, invert the monotone curve:

`s* = R⁻¹(target_elo)`

Because Komodo only accepts an integer Skill, let `s0 = floor(s*)`, `s1 = ceil(s*)`, and `α = s* - s0`. The profile carries `(s0, s1, α)`. A stable hash-derived uniform value chooses `s1` when `u < α`, otherwise `s0`. This produces a smooth expected-strength curve and an exactly replayable integral UCI payload. The artifact stores precomputed inverse segments so the runtime does not require SciPy.

This mixture is calibrated as a policy, not assumed to be linear in Elo: after the first fit, fractional target points receive holdout matches and may become additional anchors if observed performance deviates materially.

_Sources: [SciPy PCHIP documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html), [scikit-learn isotonic regression](https://scikit-learn.org/stable/modules/generated/sklearn.isotonic.IsotonicRegression.html)_

### Elo Estimation and Acceptance

For a two-player score `p = (W + 0.5D) / N`, the conventional logistic point estimate is:

`ΔElo = 400 · log10(p / (1 - p))`.

That formula is descriptive, not sufficient for acceptance by itself. Paired games share an opening and are statistically dependent. The primary estimator therefore uses pentanomial outcomes from color-reversed opening pairs, with a 95% confidence interval. BayesElo may be emitted as a comparable report, but the manifest names the selected model and rating anchor.

A target is validated when the estimated difference to its reference is inside the predeclared equivalence band and the confidence interval is narrow enough. Proposed initial gate:

- point estimate within ±35 Elo;
- 95% interval contained within ±75 Elo;
- at least 200 completed opening pairs;
- no material color imbalance, crash-rate regression, or NPS drift beyond the environment threshold.

These are engineering acceptance thresholds, not mathematical constants. A pilot run estimates draw rate and variance, after which power analysis or a sequential GSPRT determines the required maximum number of pairs. “Approximately 50%” without an interval is not proof.

_Sources: [Bayesian Elo methodology](https://www.remi-coulom.fr/Bayesian-Elo/), [Fishtest statistical methods](https://official-stockfish.github.io/docs/fishtest-wiki/Fishtest-Mathematics.html)_

### Search-Budget Invariant

`Skill` and search budget must be orthogonal:

- Calibration and validation use one fixed, clock-aware time-control policy.
- Production live play uses the same time-management family scaled from remaining clock and increment.
- `depth` and `nodes` are absent from the Elo profile and may only appear in analysis/debug profiles that are explicitly outside the calibrated rating contract.
- Threads, Hash, pondering, opening policy, tablebases, MultiPV, engine binary, and concurrency are fixed and fingerprinted in the namespace.

The phrase “corrupts the search tree” is too strong without Komodo source access. What can be established is that combined stop criteria truncate iterative deepening at position- and hardware-dependent points. For weakening implementations that select among candidates at a particular search phase—as Stockfish demonstrably does—premature termination changes or bypasses the intended policy. The resulting interaction is nonlinear because time-to-depth and nodes-to-depth vary with branching factor, pruning, transpositions, CPU contention, and position.

### Low-Elo Architecture

First measure the Komodo Skill-0 floor. Do not extrapolate below it. If Skill 0 remains stronger than the required 800–1200 range, mark those targets unsupported by the Skill-only profile.

A separately calibrated **human-error policy** can cover the lower range:

- keep sufficient search to understand the position;
- obtain a fixed candidate set under a fixed MultiPV/search policy;
- reject forced-mate giveaways and moves beyond a calibrated catastrophic-loss envelope;
- sample among remaining moves using a rating-conditioned distribution of centipawn loss, move rank, tactical complexity, and phase;
- seed selection deterministically for replay;
- validate both match Elo and human-likeness metrics on held-out human games.

The error distribution should be learned from human games or based on a human-move model, not hand-authored rating thresholds. Maia shows why: depth-limited Stockfish did not model lower-rated human decisions, whereas rating-conditioned models trained on human games did. This low-Elo policy is a distinct calibration family and must not silently modify the Skill-only curve.

_Source: [Maia: Aligning Superhuman AI with Human Behavior](https://arxiv.org/abs/2006.01855)_

### Data and Artifact Architecture

Each published artifact contains:

- semantic artifact version and calibration scale name;
- Komodo binary SHA-256 and complete UCI option snapshot;
- reference-engine hashes and exact configurations;
- hardware/NPS fingerprint, concurrency, OS, and Python/library versions;
- time control, opening-suite hash, tablebase/book policy, and seed schedule;
- raw anchor estimates, uncertainty, isotonic anchors, PCHIP coefficients, and supported target range;
- holdout results, acceptance thresholds, publication timestamp, and artifact checksum.

Artifacts are append-only and promoted through `candidate → validated → active`. Rollback selects the preceding validated artifact; it never edits the active file in place.

### Scalability and Performance

The runtime lookup is O(log 26) or O(1) with precomputed segments and requires no engine search. Benchmark work scales by deterministic opening-pair shards. One worker owns both games in a pair to preserve paired statistics. Aggregate only completed pairs and cap worker concurrency by measured CPU saturation so throughput optimizations do not alter per-engine strength.

### Reliability and Operational Gates

Startup health verifies artifact schema, checksum, engine hash, option compatibility, and supported rating range. Runtime records last successful search, observed NPS, time forfeits, engine exits, and profile clamps. Alert on sustained NPS deviation from calibration baseline, elevated timeouts/crashes, calibration checksum mismatch, or degraded-profile use.

No automatic online retuning is allowed. Drift opens a recalibration job; a new artifact becomes active only after holdout validation and explicit promotion.

## Implementation Approaches and Technology Adoption

### Migration Strategy

Use a strangler rollout rather than deleting the old mapper immediately:

1. Introduce typed v2 contracts and artifact validation behind a disabled feature flag.
2. Run v2 in shadow mode for eligible move requests. Record the proposed profile but keep v1 responsible for moves.
3. Produce the first calibration artifact from offline matches and validate it on unseen target points.
4. Canary v2 on a bounded local test cohort, comparing latency, time forfeits, NPS, crashes, and selected profiles.
5. Promote v2 to calibrated competitive mode only after the acceptance gate passes.
6. Remove `get_target_depth`, the linear `(elo - 800) / 120` mapping, and mixed depth/time rating controls after rollback confidence is established.

This makes the calibration artifact independently rollbackable from the application binary, consistent with SRE guidance to separate components that change at different rates and use small, observable rollouts.

_Source: [Google SRE Workbook: Canarying Releases](https://sre.google/workbook/canarying-releases/)_

### Proposed Package Boundaries

The initial implementation should add a focused package rather than expand `app.py`:

```text
core/elo_calibration/
  models.py          strict request/profile/artifact types
  artifact.py        load, checksum and validate immutable curves
  interpolation.py   monotone inverse lookup and seeded resolution
  calibrator.py      public EloCalibrator facade
  telemetry.py       Prometheus metrics and structured observations
  errors.py          explicit failure taxonomy

tools/elo_calibration/
  run_matches.py     benchmark orchestration
  estimate.py        pentanomial/Elo estimation and intervals
  fit_curve.py       weighted isotonic + PCHIP artifact generation
  validate.py        holdout and acceptance-gate report

tests/elo_calibration/
  test_interpolation.py
  test_artifact.py
  test_determinism.py
  test_coordinator_contract.py
  test_statistics.py
```

The production requirements need only `prometheus-client` in addition to the current stack. SciPy/scikit-learn, if selected for the offline fitter, belong in a separate benchmark/development dependency set. The runtime artifact contains coefficients and is evaluated with standard Python.

### Testing and Quality Assurance

Testing is layered:

- **Unit:** range validation, exact anchors, monotonicity, inverse lookup, boundary clamp/reject behavior, deterministic seed replay, artifact corruption, and unsupported engine hash.
- **Property:** for every supported Elo sequence, expected fractional skill never decreases; generated UCI Skill always remains 0–25; PCHIP segments never overshoot anchor bounds.
- **Contract:** fake UCI engine verifies option ordering, atomic profile application, process isolation, search-limit policy, and telemetry extraction.
- **Statistical:** synthetic W/D/L and pentanomial datasets with known Elo differences validate estimators and confidence intervals.
- **Tournament smoke:** a small deterministic pair set catches illegal moves, crashes, timeout handling, and PGN/JSON generation.
- **Calibration acceptance:** hundreds or thousands of paired games validate anchor and holdout targets; this expensive suite is scheduled/manual, not a per-commit unit test.

Test fixtures must never rely on the uncommitted commercial engine binary in CI. Unit/contract tests use a fake UCI engine; local benchmark jobs discover explicitly configured engine paths and record their hashes.

### Benchmark Workflow

The benchmark pipeline is a reproducible DAG:

`manifest → environment preflight → paired matches → result validation → rating estimation → monotone fit → holdout matches → acceptance report → artifact promotion`.

Preflight checks engine hashes/options, CPU availability, stable NPS warmup, opening corpus, disk space, and that production Flask is not competing for the same engine/cores. Each stage is resumable and idempotent. Results are append-only; interrupted pairs are replayed with the same seed and never counted partially.

Stockfish `UCI_Elo` anchors can cover its documented range only. Below that range, validation needs a separate reference pool and/or human-game metrics. A Stockfish level number without a pinned binary and empirical rating is not an accepted baseline.

### Deployment and Operations

The online service exposes an authenticated `/metrics` endpoint or an independently bound loopback metrics listener, consistent with the existing local-security model. Calibration gauges initialize at startup. Benchmark jobs expose last-success timestamp, current stage, completed pairs, failures, and duration; Prometheus guidance identifies last successful run as a key batch-job metric.

Dashboards cover:

- target Elo versus applied Skill and clamp status;
- five-minute observed NPS and deviation from calibration baseline;
- search latency distribution, time budget, and timeout/time-forfeit rate;
- engine restarts and configuration failures;
- active artifact version/hash and degraded fallback usage;
- benchmark last success, pair throughput, current confidence interval, and gate status.

Alert on actionable symptoms: calibration artifact rejected, no valid active artifact, repeated engine crashes, sustained NPS drift, time-forfeit SLO breach, or benchmark pipeline staleness. Do not page on individual Elo selections.

_Sources: [Prometheus instrumentation practices](https://prometheus.io/docs/practices/instrumentation/), [Google SRE monitoring signals](https://sre.google/sre-book/monitoring-distributed-systems/)_

### Resource and Cost Management

CPU time dominates cost. Start with a coarse Skill ladder and adaptive allocation: run enough pairs to identify the curve, then spend additional games where adjacent confidence intervals overlap, curvature is high, or holdout residuals are large. Reuse a fixed opening corpus and cache only immutable experiment outputs, never engine search state across games.

Keep tournament concurrency below the point where warmup NPS falls outside tolerance. Higher concurrency that changes strength is not a valid cost optimization. Resume support and sequential stopping prevent wasting already completed games.

### Risk Assessment

| Risk | Consequence | Mitigation |
|---|---|---|
| No public Komodo Skill formula | False precision | Empirical curve with uncertainty and explicit namespace |
| Reference rating scale mismatch | “1700” still differs from product expectation | Name scales; add platform-specific bridge study later |
| Skill curve is non-monotone in samples | Unstable inverse mapping | Weighted isotonic fit plus holdout residual report |
| Integer Skill cannot express all targets | Stair-step experience | Validated deterministic adjacent-level mixture |
| Skill 0 too strong for 800–1200 | Unsupported low range | Separate human-error policy; no extrapolation |
| CPU contention/NPS drift | Rating drift and time forfeits | Pinned concurrency, baseline NPS, drift alerts |
| MultiPV changes compute budget | Hidden strength change | Fixed per calibration family and separately benchmarked |
| Commercial engine absent in CI | Unreliable test suite | Fake UCI contracts plus explicit local benchmark stage |
| Artifact/config rollout regression | Broad production impact | Shadow mode, canary, checksum validation, instant rollback |

## Technical Research Recommendations

### Implementation Roadmap

**Phase 0 — Measurement contract:** remove ambiguity around the rating scale; define the benchmark manifest, reference pool, time control, opening pairs, hardware fingerprint, and acceptance band.

**Phase 1 — Core and fake engine:** implement typed contracts, artifact validation, monotone runtime lookup, deterministic resolution, fake-UCI contract tests, and structured logs. No production routing yet.

**Phase 2 — Benchmark pipeline:** implement paired match runner, PGN/JSON results, pentanomial estimator, curve fitting, holdout validation, and signed/checksummed artifact publication.

**Phase 3 — Coordinator integration:** apply profiles atomically through isolated engine leases; remove rating-owned depth/nodes; add shadow mode and fail-closed behavior.

**Phase 4 — Observability and canary:** expose Prometheus metrics, Grafana queries, drift alerts, and run a bounded v2 canary before promotion.

**Phase 5 — Low-Elo research:** only if measured Skill 0 cannot reach the product floor, build and independently calibrate the human-error policy using human-game distributions.

### Technology Stack Recommendation

- Runtime: Python 3.12, `python-chess`, standard-library typed dataclasses/enums/hash/JSON/logging, `prometheus-client`.
- Offline: the same base plus SciPy PCHIP and an isotonic-regression implementation, or a small audited PAVA fitter if dependency size matters.
- Tournament: Python adapter for deterministic smoke tests; Fastchess for large local runs.
- Storage: JSON manifests/results and PGN games under versioned experiment directories; immutable calibration JSON in source-controlled configuration.
- Visualization: existing Prometheus/Grafana deployment or Prometheus exposition ready for later Grafana adoption.

### Success Metrics and KPIs

- 100% of calibrated move requests name a validated artifact and scale.
- No runtime path varies depth or nodes as a function of target Elo.
- Holdout targets meet the declared ±35 Elo point / ±75 Elo 95%-interval gate.
- Identical context and artifact reproduce identical applied Skill and move-selection seed.
- Sustained NPS remains within the calibrated tolerance; drift is visible within one dashboard window.
- Engine crash/time-forfeit rate does not regress against v1.
- Unsupported targets are rejected or explicitly degraded, never silently extrapolated.

## Research Conclusion

The observed 400-point compensation is evidence of a confounded experiment, not evidence that Komodo's hidden formula is `target + 400`. V2 must make the experiment itself the product: a versioned rating scale, reproducible tournament protocol, measured anchors with uncertainty, constrained interpolation, holdout validation, and operational drift detection.

The proposed architecture deliberately refuses two attractive but unsafe shortcuts: a global polynomial fitted to sparse noisy points, and weaker play obtained by chopping the search tree. A polynomial can overshoot between samples; search truncation entangles strength with hardware and position. Weighted isotonic anchors plus PCHIP solve the first problem, while a fixed search-budget policy and explicit low-Elo candidate selector solve the second.

Implementation should begin only after approval of the measurement contract: calibration scale, reference opponents, time control, opening corpus, hardware envelope, and statistical acceptance band. Without that contract, code would merely automate another unverifiable heuristic.

### Source Verification and Limitations

Primary and authoritative sources used include the actual local Komodo 14.1 UCI option output, official Komodo product material, CCRL rating lists/methodology, official Stockfish documentation/source/Fishtest statistics, SciPy and scikit-learn interpolation documentation, Prometheus guidance, Google SRE guidance, Fastchess documentation, and the peer-reviewed Maia research.

The principal unresolved fact is intentional and material: Komodo 14.1 is proprietary and its internal Skill implementation and per-level Elo curve are not publicly specified. That uncertainty cannot be eliminated through more documentation search; it is closed by the benchmark pipeline proposed here.

**Research completed:** 2026-10-11  
**Confidence:** High for the architecture and documented protocol behavior; medium for any pre-benchmark estimate of individual Komodo Skill strength.
