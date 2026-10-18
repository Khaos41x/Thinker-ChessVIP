# Rubric Review — Deterministic Elo Calibration v2.0

## Gate Verdict

**REVISE BEFORE HANDOFF.** The spine has a strong empirical-calibration core and is substantially aligned with the research, but two inherited-contract contradictions make the current runtime design unimplementable without different teams making incompatible choices: profile ownership conflicts with the parent's single-engine, two-lens transaction, and seeded fractional-Skill resolution is absent from the inherited selection cache identity. Three additional high-risk seams—live deadline behavior, inversion across isotonic plateaus, and unpinned stack choices—must be closed before this is a build substrate.

## Review Scope and Evidence

- Reviewed artifact: `ARCHITECTURE-SPINE.md`
- Parent: `../architecture-thinker-chess-vip-2026-10-09/ARCHITECTURE-SPINE.md`
- Research companion: `../../research/technical-deterministic-elo-calibration-komodo-14-1-research-2026-10-11.md`
- Companion plan: `ENGINEERING-PLAN.md`
- Mechanical pass: `lint_spine.py` passed with zero findings when run directly with Python. The prescribed `uv run` invocation could not persist its interpreter-cache file in the sandbox, so the same repository script was executed with the project Python interpreter.

## Critical Findings

### C1 — The game-stable profile rule cannot execute the inherited single-engine, two-lens transaction

**Evidence:** The parent AD-2 requires one atomic `/move-plan` to execute `reference-shallow → bounded Elo selector → reference-deep` "on the single engine." The child correctly says reference analysis and calibrated selection remain distinct, but child AD-8 then gives one isolated lease one active profile for the whole game and applies the complete profile only at the game boundary. Reference analysis and an Elo-weakened selector require incompatible engine state (at minimum Skill and often MultiPV), so both rules cannot hold simultaneously.

**Why this fails the rubric:** The child weakens/contradicts inherited AD-2 and leaves the lower level to invent either mid-transaction mutation, a second process, or a combined profile. Those choices have different latency, cancellation, cache, and correctness behavior.

**Disposition:** **Discuss, then fix in the spine.** Choose one parent-compatible state machine explicitly. The least disruptive option is to keep one coordinator-owned engine and permit verified, atomic stage-profile transitions only while idle inside the move-plan transaction, with restoration/failure semantics and generation invalidation. If separate reference and selector processes are desired, the parent spine must first be revised because it currently requires a single engine.

### C2 — Fractional-Skill resolution is not represented in the inherited selection/cache identity

**Evidence:** Child AD-4 resolves a fractional latent Skill through a seeded adjacent-integer choice, and the randomness convention derives that seed from artifact, game identity, color, and policy scope. Parent AD-15's selection cache and contextual plan key contain quantized Elo, selector version, and seed-policy version, but not artifact identity, seed scope/value, or resolved Skill. Two games with the same position and target Elo can therefore legitimately resolve to different Skills while sharing the same inherited cache key.

**Why this fails the rubric:** It directly permits cached selection produced under one calibrated profile to be reused under another. It also conflicts with the parent's promise that selection identity is complete enough to prevent cache poisoning.

**Disposition:** **Autofix candidate.** Extend selection identity and every move-affecting cache key with at least `scaleId`, calibration artifact checksum/version, resolver version, deterministic seed scope (or stable resolution key), and resolved integral Skill. Alternatively, resolve Skill solely from inputs already present in the parent key, but then remove game identity/color from the seed convention and document the resulting behavior.

## High Findings

### H1 — Live Smart Pacing deadlines can silently recreate the very search-budget confound v2 forbids

**Evidence:** Child AD-3 makes time-control family and search controls calibration invariants and states that target Elo never changes depth/nodes. Parent AD-9 and AD-20 require each live request to obey an absolute clock-safety deadline and permit typed fallback when work cannot finish. The spine never decides what happens when the remaining move-plan budget is shorter than the calibrated selector search budget, nor whether artifacts describe a family/surface of budget classes.

**Impact:** Implementers can either truncate the calibrated search (invalidating the Elo claim), violate clock safety, skip selection, or use a different calibration point. This is a primary runtime divergence point, not an implementation detail.

**Disposition:** **Discuss.** Define deadline precedence and one enforceable behavior: for example, select only an artifact-backed `analysisBudgetClass` whose minimum budget fits; otherwise return the parent's typed `SELECTOR_FALLBACK_NOT_STARTED/EXPIRED` and never label the result calibrated. If variable per-move time is supported, calibrate and version a bounded budget dimension rather than treating a single curve as portable.

### H2 — The inverse of isotonic/PCHIP anchors is undefined for plateaus and duplicate fitted ratings

**Evidence:** AD-4 says weighted isotonic regression creates non-decreasing anchors and that PCHIP supplies a curve and inverse. Isotonic regression can pool adjacent Skill observations into equal fitted ratings. A PCHIP interpolator requires a strictly increasing independent axis, and an inverse over a plateau is set-valued. Neither the spine nor artifact contract defines deduplication, tie-breaking, interval selection, or failure behavior.

**Impact:** Two fitting implementations can produce different latent Skills and supported ranges from identical match results while both claim conformance. This breaks determinism at the most important mathematical boundary.

**Disposition:** **Autofix candidate.** Specify the canonical fit direction and plateau policy. One valid rule is: fit `R(skill)` on every integral Skill; store monotone segments; invert by deterministic left/right/generalized inverse with an explicitly chosen convention; never construct a PCHIP with duplicate rating values as its x-axis. Persist the canonical anchor table and inverse convention/version in the artifact and cover pooled-anchor fixtures in property tests.

### H3 — Named implementation dependencies are explicitly unpinned

**Evidence:** The Stack table lists the chess package, `prometheus-client`, and SciPy as "project-pinned at implementation bootstrap"; Deferred repeats that exact versions will be chosen later. The repository currently has an unversioned requirements file, while the parent spine identifies `chess package 1.11.2`. Fastchess is also named as an optional adapter without a selected release or compatibility envelope.

**Why this fails the rubric:** The good-spine checklist requires named technology to be verified-current. Deferring the versions in a build-substrate spine allows reproducibility and API choices to diverge before the artifact format and tests stabilize.

**Disposition:** **Autofix candidate after environment verification.** Ratify the parent's installed chess version, select and record verified Python 3.12-compatible releases for new packages, and either pin Fastchess or keep it outside the adopted Stack as an open adapter candidate. If dependency selection truly must remain open, the spine should specify an acceptance constraint and owner rather than present placeholders as versions.

## Medium Findings

### M1 — Gauge semantics do not cover concurrent leases or aggregate history

AD-9 says target Elo and applied Skill are Prometheus values, while AD-8 permits isolated leases and the operational plan discusses concurrent work. A single gauge is last-writer-wins; a gauge labeled by arbitrary rating creates cardinality risk; and a per-game label is forbidden. Decide whether there is exactly one active selector slot, use bounded slot labels, or emit distributions/counters for target/applied Skill while reserving gauges for the current profile of a named bounded engine slot. The node/time counter ratio is sound and aligned with the research.

**Disposition:** **Autofix candidate.** Add the bounded concurrency model and metric types to AD-9.

### M2 — Artifact activation and approval authority are not operationally bound

AD-10 defines lifecycle states, shadow/canary, and rollback, but it does not say what durable object selects the active checksum, how activation is atomic across restart, who/what may promote, or how the parent AD-20 owner/approver and rollback triggers are honored. `candidate → validated → active` is otherwise vulnerable to incompatible CLI, file-copy, and application-startup implementations.

**Disposition:** **Discuss or defer explicitly.** Bind an atomic active-manifest/pointer protocol, authorization boundary, promotion audit record, and restart/rollback behavior. Name the owner/approver as manifest data if organizational names are intentionally out of scope.

### M3 — Metrics exposure omits the inherited local security boundary

The research recommends an authenticated `/metrics` endpoint or an independently bound loopback listener. The spine defines metric content but not binding, authentication, or scrape trust. Parent AD-16 binds the application to loopback and treats the local API as a security boundary, but it does not automatically decide the new metrics surface.

**Disposition:** **Autofix candidate.** State that metrics are loopback-only and either use bearer authentication or a separately configured local scrape listener; never expose game/application metrics by widening the Flask bind address.

### M4 — Benchmark output retention and capacity are silent

The research expects append-only JSON/PGN and potentially thousands of paired games. The spine specifies append-only outputs and distributed sharding but no storage location contract, retention/compaction, disk exhaustion behavior, or resume cleanup. This leaves part of the operational/environmental envelope silent.

**Disposition:** **Defer to an explicit open item.** Require preflight disk budgets, immutable run directories, retention policy, and safe pruning rules before large-scale execution.

## Low Findings

### L1 — "Complete option set" lacks a canonical verification protocol

AD-8 requires the coordinator to apply and verify a complete option set, but UCI does not provide a universal read-back command for current option values. Define verification as adapter-maintained desired/applied state plus successful `isready`, process generation, and a fresh-process reset policy; otherwise adapters may falsely claim read-back verification.

### L2 — The capability map understates the low-Elo runtime surface

The map assigns human-like low ratings to a "later candidate selector" without a structural seed, artifact schema boundary, or coordinator integration location. AD-6 is strong enough to prevent accidental use, but a placeholder package/port would better prevent it from being added directly to the main Skill curve.

## Parent-Spine Reconciliation

| Parent invariant | Result | Notes |
| --- | --- | --- |
| AD-1 pure core | Pass | Offline fitting and pure artifact lookup ratify the functional-core boundary. |
| AD-2/AD-5 two lenses | **Conflict** | Child AD-8 cannot support both reference and calibrated profiles under the parent's single-engine transaction. |
| AD-9 deadlines | **Gap** | No calibrated behavior is specified when a live deadline is below the benchmark search envelope. |
| AD-12/AD-13/AD-17 versioned calibration | Pass | Artifact identity, holdouts, promotion, and distribution evidence strengthen the parent. |
| AD-15 cache identity | **Conflict** | Artifact/seed/resolved Skill are absent from the inherited move-affecting key. |
| AD-16 local security | Partial | Arbitrary UCI options remain forbidden; metrics exposure is undecided. |
| AD-18 Puzzle isolation | Pass | Inherited explicitly and not weakened. |
| AD-19 coordinator ownership | Pass with C1 fix | Coordinator remains sole engine owner, but process/stage topology must be reconciled. |
| AD-20 release envelope | Partial | Immutable manifests are strong; deadline compatibility and promotion authority remain open. |

## Research Reconciliation

The spine accurately carries forward the central research conclusions: Komodo Skill is integral `[0,25]`; there is no defensible public formula; Elo names a protocol; depth/nodes are not rating controls; measurement uses paired openings and uncertainty; low-Elo human likeness is separate; NPS is derived from nodes/time counters; and runtime scientific dependencies are avoidable.

The material mismatches are specification precision rather than research direction:

- the research's "precomputed inverse segments" does not solve isotonic plateaus without a canonical generalized-inverse rule;
- the fixed benchmark environment is not connected to the parent's variable live deadline envelope;
- the proposed seeded adjacent-Skill mixture changes the inherited cache identity but the spine does not propagate that change;
- the research's loopback/authenticated metrics guidance is not ratified as an architectural rule.

## Good-Spine Checklist

| Checklist item | Assessment |
| --- | --- |
| Fixes real divergence points for the level below | Partial — calibration/artifact/statistics are strong; engine stage topology, deadline compatibility, inverse plateaus, and cache identity remain divergent. |
| Every AD rule is enforceable and prevents its stated divergence | Partial — AD-4 and AD-8 are not implementable unambiguously as written; AD-9 lacks concurrency semantics. |
| Deferred contains no item that permits unit divergence | Fail — exact dependency versions are deferred despite adopted stack names; output retention and active-artifact selection are silent rather than controlled. |
| Named technology is verified-current | Fail — several versions are placeholders and Fastchess is unpinned. |
| Ratifies the brownfield codebase | Mostly pass — it correctly targets the existing mapper, Smart Pacing package, coordinator, Python 3.12, and commercial-engine CI constraint. |
| Covers driving capabilities | Pass with gaps — interpolation, benchmarking, low Elo, observability, and lifecycle are covered; live-budget integration and metrics deployment need closure. |
| Does not weaken/contradict inherited spine | Fail — C1 and C2 conflict with parent AD-2/AD-15. |
| Every feature-altitude dimension decided/deferred/open | Partial — core/data/testing/release are strong; runtime process topology, activation authority, metrics exposure, and benchmark storage operations remain incomplete. |

## Recommended Gate Action

Resolve C1 and C2 before any implementation handoff. Apply H1–H3 in the same revision because they determine the public runtime contract, mathematical reproducibility, and dependency baseline. M1–M3 are clear architectural fixes suitable for the next spine edit; M4 can be moved to Deferred with an explicit preflight gate. After revision, rerun the mechanical linter and this rubric against both the parent cache/deadline rules and the companion Engineering Plan.

## Recheck Addendum — 2026-10-11

**Verdict: REVISE — one remaining blocker.** The revision resolves prior C1, C2, H1, H2, and H3: stage transitions now preserve the inherited single-engine transaction; calibration identity extends caches; budget-class admission protects live deadlines; generalized inversion defines plateau behavior; and adopted dependencies are pinned while Fastchess remains gated. Prior medium operational gaps are also closed or explicitly deferred. The mechanical linter still reports zero findings.

### Remaining blocker — benchmark/runtime engine-state equivalence is unspecified

AD-8 now transitions `reference → selector → reference` on one Komodo process, but it does not decide how transposition-table/hash state and other search history are isolated or reproduced across stages. The production selector can therefore inherit exact-position work from `reference-shallow`, while the Phase 2 tournament curve appears to measure ordinary game-stable Skill profiles. That selector is no longer operating under the state distribution that produced `R(skill)`, so its claimed Elo can drift even when Skill, budget class, Threads, Hash size, and MultiPV match.

**Required closure:** Make search-state policy part of the calibration contract and profile digest. Either clear/reset the relevant engine state before the selector (and account for transition/reset time in admission), or make every calibration/holdout match reproduce the same staged warm-state protocol used by `/move-plan`. Specify the corresponding restore/reset behavior before `reference-deep`, fingerprint it in artifacts, and add a fake-engine contract plus an empirical holdout comparing benchmark and production stage contexts.

## Final Recheck — 2026-10-11

**Verdict: PASS — no blockers remain.** AD-3 now fingerprints the search-state reset policy inside each budget class; AD-8 mandates `Clear Hash` plus `isready` before every production stage and the identical reset before every calibration selector move, accounts for reset time in the absolute deadline, and fails safely on uncertain reset state. The Engineering Plan carries the rule into the measurement manifest and adds hash-reset/no-warm-state-leakage contract tests. This closes benchmark/runtime engine-state equivalence without weakening the inherited single-engine transaction.
