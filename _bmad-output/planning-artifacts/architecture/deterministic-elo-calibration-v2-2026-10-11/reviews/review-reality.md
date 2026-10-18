---
review: reality
document: ../ARCHITECTURE-SPINE.md
date: '2026-10-11'
verdict: conditional-pass
blocking_findings: 3
advisory_findings: 2
---

# Reality Review — Deterministic Elo Calibration v2.0

## Verdict

**CONDITIONAL PASS — research-grounded, but not yet an executable build contract.** The principal architecture is supported by the accompanying web research and by inspection of the shipped Komodo binary and repository. It correctly refuses to invent an exact Komodo Skill-to-Elo formula, treats Elo as protocol-specific, separates strength from search budget, and defers dependency pins and statistical thresholds rather than fabricating them. Before implementation, three contract gaps must be resolved: the inverse of an isotonic/PCHIP curve is not necessarily unique, standard UCI cannot verify applied option values, and the brownfield coordinator does not currently implement the lease/identity model assumed by the spine.

## Evidence Checked

### Web-researched or primary-source-backed

| Spine decision | Reality check | Result |
| --- | --- | --- |
| Komodo `Skill` is integral `[0,25]`; no public exact Elo equation | Direct interrogation of `engine/komodo-14.1-64bit.exe` is recorded in the research report; public Komodo material supplies no per-Skill equation | Verified for the shipped binary; appropriately treated as empirical rather than universal |
| Search-budget fields are separate UCI stopping conditions | `python-chess` documents `time`, `depth`, and `nodes` as distinct `Limit` fields; the repository currently mixes `depth` and `time` in reference analysis | Verified |
| Weak play should use candidate choice rather than merely shallow search | Official Stockfish documentation describes suboptimal candidate selection and a depth-dependent skill-selection point; Maia provides published evidence that depth-limited Stockfish is a poor model of human moves | Supported as an architectural analogy; not evidence of Komodo's proprietary internals |
| Isotonic regression plus PCHIP | Both techniques exist and fit the stated monotonic/no-overshoot objective | Supported, subject to the flat-segment issue below |
| Paired openings and pentanomial reporting | Fastchess exists, supports repeated opening pairs and pentanomial reporting, and is appropriate as an optional offline adapter | Verified |
| Prometheus counters/histograms and low-cardinality labels | Matches Prometheus instrumentation guidance | Verified, subject to concurrency semantics below |
| Shadow/canary/rollback lifecycle | Supported by the cited Google SRE rollout guidance and fits a local modular-monolith migration | Verified |

Primary pages rechecked: [Stockfish skill behavior](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html), [python-chess engine limits](https://python-chess.readthedocs.io/en/latest/engine.html), [Fastchess repository](https://github.com/Disservin/fastchess), [Fastchess command reference](https://github.com/Disservin/fastchess/blob/master/man.md), [CCRL](https://computerchess.org.uk/), [Komodo product material](https://komodochess.com/store/pages.php?cmsid=14), [SciPy PCHIP](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html), [Maia paper](https://arxiv.org/abs/2006.01855), and [Prometheus instrumentation practices](https://prometheus.io/docs/practices/instrumentation/).

### Brownfield repository check

- `requirements.txt` contains Flask, Flask-Cors, Flask-SocketIO, `python-chess`, psutil, and waitress. It does **not** yet contain `prometheus-client`, SciPy, scikit-learn, or a tournament runner. The spine correctly avoids false version pins and marks exact pins as deferred.
- `app.py` owns a single `KomodoSingleton`, configured with Threads 1, Hash 128, and mutable Skill. `core/smart_pacing/coordinator.py` serializes jobs through one lock and one adapter; it is not an engine pool and has no game lease abstraction.
- `core/smart_pacing/adapter.py` still uses `Limit(depth=..., time=...)` for reference analysis and the unvalidated `int((elo - 800) / 120)` Skill mapper for move selection. The v2 architecture addresses a real existing seam.
- `/move-plan` has a `runtimeGameToken`, but legacy `/getmove` accepts only FEN, Elo, and time. The deterministic seed convention therefore cannot be applied to every current calibrated route without an API or identity-policy decision.
- Project testing is direct Python rather than pytest. The proposed test file layout is compatible, but implementation must keep tests executable through the project's documented direct-Python workflow.

## Findings

### [P1] Define inversion semantics for isotonic plateaus

**Location:** AD-4, line 87; deterministic resolution, line 194.

Weighted isotonic regression guarantees a non-decreasing sequence, not a strictly increasing one. Pool-adjacent-violators can legitimately assign the same fitted Elo to several Skill anchors. PCHIP over those anchors preserves a flat interval, so `R⁻¹(targetElo)` is set-valued at the plateau and the statement that it “supplies a curve and inverse” is incomplete. Different root finders or floating-point paths could choose different latent Skills, violating the determinism claim.

**Required correction:** Specify a total inverse policy in the artifact contract: for example, store inverse breakpoints after collapsing equal-Elo runs and choose a declared lower, upper, or stable weighted representative for exact plateau targets. Reject malformed descending anchors after fitting, define epsilon/canonical decimal handling, and add plateau/duplicate-anchor fixtures to `test_interpolation.py`. Do not rely on a generic numerical inverse at runtime.

### [P1] Replace “verifies the complete option set” with UCI-observable guarantees

**Location:** AD-8, lines 107–111.

Standard UCI lets the GUI discover option names/ranges from the startup `option` declarations, send `setoption`, and synchronize with `isready`/`readyok`; it does not require an engine to read back the current value of every option. Komodo 14.1 does not expose a general option-value query. Consequently the coordinator cannot verify the engine's internal complete option state as written.

**Required correction:** Define verification as: validate names/types/ranges against the startup option schema, apply the full desired profile, issue an `isready` barrier, record the intended canonical profile and engine generation, and fail/restart on protocol errors or process replacement. If stronger assurance is required, add a Komodo-specific probe and label it best-effort; do not promise readback that UCI cannot supply.

### [P1] The assumed engine-lease and deterministic-identity contracts do not exist yet

**Location:** runtime diagram line 45; AD-8 lines 109–111; capability map line 195; randomness convention line 131.

The phrase “existing `EngineCoordinator` adapter” understates the migration. Today there is one process, one process-global mutable Skill, and one coordinator lock. There is no lease per game, no pool slot identity, no profile lifetime spanning a game, and no route-neutral game identity. `/move-plan` provides `runtimeGameToken`; `/getmove` does not. A seed based on “game identity” is therefore underspecified on the legacy route, while reconfiguring the singleton per request is not the game lease promised by AD-8.

**Required correction:** Make one of two designs explicit before coding: (a) preserve the single-process model and define an atomic **per-job** profile transaction under the coordinator lock, including restore/restart semantics; or (b) introduce a bounded engine pool with explicit lease ownership, capacity, cleanup, restart, and memory/Hash budgeting. Separately, define the canonical identity for `/getmove` or exclude it from calibrated v2 and route calibrated play through `/move-plan`. The capability map should say “extend/replace existing coordinator,” not imply the lease behavior already exists.

### [P2] Prometheus gauges are ambiguous if the design permits concurrent leases

**Location:** AD-9, line 117.

A process-global `target_elo` or `applied_skill` gauge is meaningful with today's single serialized engine only as “last/current job.” It becomes a race or an arbitrary last writer if AD-8 introduces multiple concurrent engine leases. Adding game or target values as labels would violate the document's own cardinality rule.

**Required correction:** State metric semantics now. For a singleton, name/help them as current/last-applied and set them only while a job owns the engine. For a pool, prefer bounded slot labels, counters/histograms over configured target/skill buckets, and aggregate nodes/seconds counters. Structured logs remain the per-game source of truth.

### [P2] The Komodo-specific degradation mechanism remains unverified

**Location:** AD-3, lines 77–81.

The evidence establishes that combined stopping conditions produce position- and hardware-dependent truncation, and Stockfish proves that at least one modern engine couples weak-move selection to search depth. It does **not** establish Komodo 14.1's proprietary internal Skill algorithm or prove that premature depth is the sole cause of the observed 400-point gap. The research report states this limitation carefully, but the spine's “existing nonlinear interaction” can be read as a confirmed Komodo mechanism.

**Required correction:** Keep AD-3 as a safety invariant, but explicitly label causality as a benchmark hypothesis: the observed gap is confounded by Skill, tiny time budgets, position, NPS, caching/book behavior, and possibly mixed limits. The ablation manifest should measure `Skill-only + fixed clock`, `clock-only`, and legacy combined policy before attributing the gap.

## Technology and Dependency Verdict

- **Python 3.12 / python-chess:** Existing and appropriate. The package is currently unpinned, so pinning during implementation bootstrap is honest and necessary.
- **Komodo 14.1 64-bit:** Present locally and matches the direct UCI inspection. It must remain an external/non-committed binary as required by repository policy.
- **prometheus-client:** Real, appropriate, but new to this repository. It should be a runtime dependency only if telemetry is enabled in-process; otherwise make exposition an optional adapter with a no-op default for existing installations.
- **SciPy:** Real and compatible with the proposed offline PCHIP work in current Python-3.12-capable releases. Keep it out of the Flask runtime dependency set. If weighted isotonic fitting uses SciPy's isotonic implementation or a custom PAVA, name that implementation explicitly; do not silently assume scikit-learn because it is neither listed nor present.
- **Fastchess:** Real and suitable as an optional offline tournament adapter. No version is falsely pinned. Record the executable hash and command manifest, as proposed.
- **Grafana:** Not part of the committed stack and not required to implement Prometheus exposition; this is correctly left as an operational consumer rather than a code dependency.

## Decision

The spine is substantially reality-based and should be retained. Resolve the three P1 contract issues before treating it as the implementation substrate. The P2 items can be closed in the engineering plan, but their acceptance criteria should exist before the first calibration artifact is promoted.
