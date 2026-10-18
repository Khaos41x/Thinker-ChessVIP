# Adversarial Architecture Review — Deterministic Elo Calibration v2.0

## Verdict

**FAIL — the calibration model is directionally sound, but the spine does not yet force two independent teams to build compatible runtime, statistical, or release behavior.** The most serious defect is a direct conflict with the inherited Smart Pacing transaction: local AD-8 fixes one profile for an entire game, while parent AD-2 requires full-strength reference and bounded-Elo selector lenses to execute in order on the same engine inside every `/move-plan`. The deterministic seed is also absent from inherited cache identity, so compliant implementations can return moves generated under another game’s Skill resolution.

## Two incompatible implementations that both claim compliance

### Unit A — game-pinned process and content-addressed calibration

- At game admission, the coordinator loads the currently active artifact, resolves fractional latent Skill once from `(artifactChecksum, runtimeGameToken, color)`, starts one Komodo process, applies that weakened profile, and keeps the process leased until game end.
- The same weakened process performs reference-shallow, selector, and reference-deep work because AD-8 permits only one game profile. Reference evidence is therefore relative to the selected playing strength.
- It disables selection and complete-plan caches whenever fractional Skill is enabled because inherited keys contain neither seed nor resolved Skill.
- Offline results are immutable content-addressed bundles. Promotion writes a separate signed release record and atomically changes an `active` pointer; artifacts themselves never change state.
- Pentanomial counts use the vector `[LL, LD/DL, LW/DD/WL, DW/WD, WW]`; PCHIP fits `Elo=f(Skill)` and inversion uses the lowest Skill that reaches the target.
- Runtime metrics expose only the most recently applied target and Skill as global gauges.

### Unit B — stage-scoped reconfiguration and mutable active artifact

- Every `/move-plan` borrows the global Komodo process. It applies full-strength options for each reference stage, applies the calibrated Skill only for the selector stage, then restores full strength. The lease ends with the request.
- Fractional Skill is resolved per move from `(artifactVersion, analysisPositionKey, sideToMove, policyVersion)`. It uses inherited selection cache keys unchanged, so the first resolved result for an Elo bucket can be reused by later games.
- Promotion edits `status` inside `candidate.json`, recalculates its checksum, and copies it over `active.json`; rollback copies the preceding file back.
- Pentanomial counts use score order `[0, 0.5, 1, 1.5, 2]`; PCHIP fits `Skill=g(Elo)` directly and rounds half-to-even.
- Runtime metrics label gauges by engine slot and `targetElo`, retaining one series per observed target.

Both units can cite AD-1 through AD-10. They nevertheless disagree on what “reference” means, process ownership, when Skill is sampled, whether cached moves are reproducible, artifact identity, estimator inputs, interpolation at plateaus, metric cardinality, and rollback semantics. They cannot share artifacts, caches, dashboards, or coordinator tests.

## Findings

### ADV-01 — Game-scoped profile invariant contradicts the inherited two-lens single-engine transaction

- **Severity:** P0
- **Affected:** local AD-3, AD-8; inherited AD-2, AD-9, AD-19
- **Contradiction:** Local AD-8 says one engine lease has one active profile for a game and that the complete option set is applied at the game boundary. Parent AD-2 requires `reference-shallow → bounded Elo selector → reference-deep` on the single engine in each atomic `/move-plan`. The reference lenses must not inherit the weakened selector profile, while the selector cannot use the full-strength reference profile.
- **Incompatible readings:** Unit A preserves the game profile and corrupts reference semantics; Unit B preserves the two lenses and violates the game-boundary-only profile rule. A third team could allocate a second process, violating the inherited “single engine” transaction and coordinator assumptions.
- **Impact:** Complexity, regret, selected move, latency, and calibrated strength all depend on which reading wins. A process held for a whole game can also block other games and authenticated `/eval` jobs, defeating inherited deadline and admission guarantees.
- **Required resolution:** Define `EngineLease` scope normatively. The compatible model is likely one coordinator-owned request/job lease with explicit stage profiles: reference profile, selector profile, reference profile. Permit option mutation only between stopped searches under the lease, require `isready` after a complete canonical option application, restore a known profile before release/restart, include profile-application time in the inherited absolute deadline, and type failure/fallback at each transition. If a dedicated selector process is intended instead, explicitly amend the inherited single-engine rule rather than silently weakening it.
- **Acceptance proof:** A coordinator contract test records every UCI command for one `/move-plan`, proves no option mutation occurs during search, proves both reference stages use the identical reference profile, proves only the selector uses the resolved Skill, and proves a superseding revision still satisfies `cancellationGraceMs` plus restart admission.

### ADV-02 — Fractional Skill seeding is incompatible with inherited selection-cache identity

- **Severity:** P0
- **Affected:** local AD-4 and randomness convention; inherited AD-15; runtime calibrator and caches
- **Ambiguity:** “artifact, game identity, color, and policy scope” has no canonical byte encoding, seed scope, or sampling cadence. AD-4 does not say whether adjacent Skill is selected once per artifact load, game, turn, position, or search. Parent AD-15’s selection and contextual plan keys include quantized Elo and seed-policy version but not artifact checksum, actual seed, resolved Skill, game identity, or color.
- **Incompatible readings:** Unit A samples once per game and disables caches. Unit B samples per position and caches under the existing Elo bucket. Both are stable and replayable locally, but Unit B can replay a move produced under Skill 12 for a request that deterministically resolved Skill 13.
- **Impact:** Cache hits change the advertised strength distribution, artifact activation does not reliably invalidate selected moves, and the same diagnostic identity may denote different engine behavior. The claimed deterministic mapping is false across processes/languages unless hash-to-uniform conversion is fixed.
- **Required resolution:** Fix the stochastic unit and identity: preferably resolve `appliedSkill` once per game from a canonical UTF-8 length-prefixed tuple containing `seedPolicyVersion`, artifact checksum, stable runtime game token, target Elo, and side/policy scope. Define SHA-256 digest slicing, unsigned endianness, and conversion to `[0,1)`. Pin artifact checksum and applied Skill in game state. Add both to selection/plan identity and cache keys, or prohibit caching stochastic selector/plan results. Explain how this amendment composes with parent AD-15.
- **Acceptance proof:** Cross-process golden vectors produce identical seeds and adjacent-Skill choices; two game identities can resolve different Skills without cross-cache reuse; artifact activation invalidates selection results; restart mid-game reproduces the pinned profile.

### ADV-03 — Artifact immutability and lifecycle mutation have no single owner or atomic release contract

- **Severity:** P1
- **Affected:** AD-1, AD-10; artifact loader, promoter, runtime activation, rollback
- **Ambiguity:** Artifacts are called immutable and canonical JSON, yet they “move `candidate → validated → active`.” The spine does not say whether status is artifact content, external release metadata, a filename/directory, or an active pointer. It also does not assign the sole writer, define filesystem atomicity, startup recovery, multi-process visibility, or signature/trust verification.
- **Incompatible readings:** Unit A never mutates content and promotes a checksum through a release ledger/pointer. Unit B mutates `status`, changes the checksum, and copies files. Both implement the state diagram and checksum rule, but raw experiment references and rollback identities diverge.
- **Impact:** Runtime can observe a partially written artifact, promotion can invalidate the checksum it approved, two server processes can run different “active” versions, and rollback may select a blob that was never validated under its final bytes.
- **Required resolution:** Separate immutable content-addressed `CalibrationArtifact` from immutable `ValidationAttestation` and mutable `ActivationRecord`/active pointer. Bind their minimum identity relationship and ownership: promoter is the only writer; runtime is read-only; activation is atomic replace after fsync/rename (or an explicitly chosen equivalent); artifact is pinned for a game; startup either loads the last fully verified pointer or fails typed. Rollback repoints to a prior validated checksum and never changes artifact state.
- **Acceptance proof:** Crash-injection tests at every promotion write leave either old or new active checksum, never a partial state; concurrent readers converge; rollback restores the exact previously attested bytes.

### ADV-04 — The statistical artifact is not canonical enough to reproduce or exchange

- **Severity:** P1
- **Affected:** AD-4, AD-7, AD-10; runner, estimator, curve fitter, holdout validator
- **Ambiguity:** “Completed pentanomial outcomes,” “weighted isotonic regression,” “PCHIP,” and “95% interval” do not define pair-result ordering, score perspective, handling of forfeits/crashes/adjudication, estimator/likelihood, confidence method, weight derivation, duplicate isotonic plateaus, or inverse tie-breaking. Nor is the raw game/pair record’s identity/idempotency contract fixed for resume or sharding.
- **Incompatible readings:** Unit A fits `Elo=f(Skill)` and applies a left-continuous generalized inverse. Unit B fits `Skill=g(Elo)` and rounds. Both are monotone PCHIP systems but differ exactly where data are sparse or isotonic pooling creates a plateau. Their pentanomial arrays can also be reversed while remaining numerically valid.
- **Impact:** The same games can produce different confidence intervals, coefficients, supported ranges, and applied Skills. One tool cannot validate another tool’s artifact, so “regenerated from manifest plus raw results” is not a system invariant.
- **Required resolution:** Bind a versioned statistical contract: canonical game and opening-pair IDs; result enumeration and engine-A perspective; completion/exclusion rules; idempotent resume semantics; pentanomial vector order; estimator and draw model; confidence algorithm; anchor weights; fit direction; plateau handling; generalized inverse definition; endpoint rule; numeric precision/serialization; and independent holdout split derivation. Record tool/library versions as artifact inputs, not merely “project-pinned.”
- **Acceptance proof:** A checked-in miniature match corpus yields byte-identical sufficient statistics, curve coefficients, support bounds, target inversions, and acceptance decision in two clean runs.

### ADV-05 — Concurrent metrics cannot satisfy both low cardinality and truthful target/Skill state

- **Severity:** P1
- **Affected:** AD-9; telemetry adapter and Grafana contract
- **Ambiguity:** A gauge has one current value per label set. The spine requires target Elo and applied Skill “as values” while allowing concurrent games/leases, but forbids high-cardinality identity labels and never defines whether these gauges mean last request, current lease, active-game aggregate, or distribution. `calibration_info` label retention and bounded histogram buckets are also not fixed.
- **Incompatible readings:** Unit A emits last-applied global gauges, which are low-cardinality but meaningless for overlapping games. Unit B labels by target/engine slot, which is operationally useful but can generate unbounded target series and stale slot state. Both follow the literal metrics rule.
- **Impact:** Grafana can show a target/Skill pair that belongs to no active search, alerting changes with concurrency order, and a deployment can exhaust series cardinality while claiming bounded labels.
- **Required resolution:** Give each metric an aggregation semantic. Use counters or bounded histograms for observed target/Skill distributions; expose a gauge only for a bounded engine slot label if slots are fixed and lifecycle-cleared; enumerate allowed labels and buckets; define artifact-info retirement; ensure nodes and search-seconds share the same exact search population so their rate ratio is meaningful. Keep per-game decisions in structured logs.
- **Acceptance proof:** A concurrency test with overlapping games and restarts yields deterministic scrape values, bounded series count, correct NPS numerator/denominator membership, and no stale active-slot gauges.

### ADV-06 — The core/API data contract is too implicit for independent integration

- **Severity:** P1
- **Affected:** AD-2, AD-5, consistency conventions; inherited AD-2, AD-12, AD-15, AD-16
- **Ambiguity:** The spine makes bare ratings invalid and requires `scaleId`, artifact version, typed clamp/degraded outcomes, latent/applied Skill, and a complete `EngineProfile`, but supplies no binding DTO projection into `/move-plan`. Teams can choose top-level `scaleId`, a nested calibration request, server-owned default scale, or an artifact-selected scale. The complete profile fields, units, option allowlist, artifact identity, and response diagnostics are only scattered prose.
- **Incompatible readings:** One adapter rejects every legacy move-plan lacking `scaleId`; another translates existing `moveSelectionElo` through a configured default scale before entering the core. One returns `appliedSkill`; another emits it only to logs. Both can claim the core never receives a bare Elo.
- **Impact:** Frontend/backend schema versions diverge, rollout cannot run shadow v1/v2 consistently, callers cannot verify which rating scale/profile produced a move, and authenticated routes can accidentally regain arbitrary option control through a generic profile dictionary.
- **Required resolution:** Bind a minimal versioned contract, either in the spine or a named normative companion: request fields and authority for `targetElo`, `scaleId`, requested/artifact policy; response fields for artifact checksum/version, latent/applied Skill, profile digest, status/reason; typed unsupported/clamped/degraded cases; canonical `EngineProfile` fields and units; allowlisted option translation. State the compatibility/fail-closed rule for old clients under inherited AD-12.
- **Acceptance proof:** Consumer-driven contract tests show old/new frontend behavior, reject scale mismatch and arbitrary UCI keys, and bind the returned move/diagnostics to one artifact/profile digest.

### ADV-07 — Low-Elo policy is adopted but its ownership and candidate contract remain deferred in practice

- **Severity:** P1
- **Affected:** AD-3, AD-5, AD-6; inherited AD-2, AD-5, AD-15
- **Ambiguity:** AD-6 requires seeded selection from a rating-conditioned human-error distribution with fixed search/MultiPV, while the capability map says “later candidate selector” and the plan makes it conditional. It does not define who generates candidates, whether the policy reuses the reference-shallow MultiPV, invokes a distinct selector search, whether `Skill` remains 0 or 25, or how selected-move regret remains defined. “Human-likeness gate” has no metric contract.
- **Incompatible readings:** One team samples among the inherited shallow reference candidates. Another runs Komodo Skill 0 with a larger fixed MultiPV and samples its candidates. Both preserve depth and claim fixed MultiPV, but their move distribution, computation, cache identity, and reference regret differ.
- **Impact:** The product floor can be implemented through mutually incompatible engine workloads and statistical meanings; a low-Elo path can silently contaminate the Skill-only curve or violate the inherited ordered transaction.
- **Required resolution:** Either defer AD-6 entirely and make targets below measured Skill-0 explicitly unsupported in v2.0, or bind a separate versioned `LowEloSelector` port: candidate source and perspective, fixed engine profile, probability artifact shape, deterministic seed scope, tactical/mate safety constraints, output identity, cache rule, and how it plugs into the inherited reference/deep-union sequence. Define the move-likeness metric/dataset only when licensing is resolved.
- **Acceptance proof:** The same candidate snapshot plus artifact and seed yields one golden move; the Skill-only curve never reads low-Elo artifacts; all selected low-Elo moves receive reference-deep regret under parent AD-2.

### ADV-08 — Activation, canary, and rollback are not pinned to game/session identity

- **Severity:** P1
- **Affected:** AD-8, AD-10; inherited AD-8, AD-15, AD-20
- **Ambiguity:** The spine promises shadow, canary, activation, and rollback but does not define cohort assignment, artifact pin duration, atomic read point, or behavior when activation/rollback occurs mid-game. “One active profile for a game” hints at pinning but conflicts with the request-scoped inherited engine transaction and does not bind the artifact itself.
- **Incompatible readings:** One implementation pins artifact/checksum and cohort at game creation. Another resolves `active.json` on every `/move-plan` and changes behavior immediately after rollback. Both can claim atomic activation and a complete profile per game boundary if they define each request as a lease boundary.
- **Impact:** A game can alternate calibration curves and seed spaces between moves, invalidating replay, cache identity, canary attribution, and statistical comparison. Rollback may not actually remove the bad artifact from games that hold long-lived process leases.
- **Required resolution:** Pin `(cohort, artifactChecksum, scaleId, seedPolicyVersion)` to the runtime game token at first calibrated move, define lifecycle/expiry and restart reconstruction, and expose it in plan identity. New activations affect only new games unless an explicit emergency rule terminates/degrades existing sessions. Define deterministic low-cardinality canary assignment and rollback semantics consistent with the activation-record model in ADV-03.
- **Acceptance proof:** Activation and rollback during two simultaneous games leave existing games reproducible under their pinned checksums while new games select the correct active/cohort artifact.

## Gate conditions for PASS

The spine passes this lens when it resolves, at minimum:

1. the inherited single-engine two-lens conflict with a normative stage/lease/profile state machine;
2. one canonical fractional-Skill seed scope plus cache identity/invalidation;
3. immutable artifact bytes separated from validation and atomic activation records;
4. a reproducible statistical record, estimator, fit, inverse, and holdout contract;
5. concurrency-safe metric aggregation semantics with an explicit cardinality budget;
6. the `/move-plan` calibration DTO and profile digest projection;
7. either a complete low-Elo selector boundary or an explicit unsupported range;
8. per-game artifact/cohort pinning across activation and rollback.

