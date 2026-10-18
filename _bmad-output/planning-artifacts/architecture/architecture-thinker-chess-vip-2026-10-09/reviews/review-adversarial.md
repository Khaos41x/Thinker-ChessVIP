# Adversarial Architecture Review — Smart Pacing

## Verdict

**FAIL — the spine is directionally strong, but it does not yet constrain independent implementers to one materially compatible system.** Two teams can honestly claim compliance while producing incompatible engine scheduling, Elo semantics, cache behavior, session evolution, telemetry guarantees, puzzle behavior, and rollout decisions. The most dangerous divergence is on deadline/cancellation: one valid reading can still let an obsolete Komodo search monopolize the only engine after the browser has abandoned the request.

## Two incompatible implementations that both claim compliance

### Implementation A — latest-wins, interruptible, reference-first

- `/move-plan` registers `(clientSessionToken, positionRevision)` and immediately marks all lower revisions obsolete.
- A priority queue gives the newest live observation precedence. A streaming UCI analysis is actively stopped when its revision becomes obsolete or its server deadline expires.
- The full-strength reference search runs first. Its candidate set is frozen; the Elo selector chooses only among those candidates. `selectedMoveRegret` is therefore computed from the same snapshot.
- Pure reference analysis is cached from the first four FEN fields plus engine/config/version. The selector and contextual overlays are never cached.
- Clock observations are reduced in strict revision order. Out-of-order observations are rejected. One execution timer exists per game and a newer revision always cancels the prior timer.
- Telemetry is non-blocking and loss-tolerant. Puzzle never calls `/move-plan`; it uses a separate immediate presentation path.
- Rollout promotion requires fixed, version-controlled thresholds on a held-out corpus.

### Implementation B — FIFO, bounded calls, selector-first

- `/move-plan` enters a FIFO global engine lock. Obsolescence is checked only before and after each synchronous, time-limited `analyse()` call; an obsolete in-flight call is allowed to finish.
- The Elo selector runs its own search first. A later reference search may have a different candidate set. The service computes regret by matching the selected UCI move against the later reference snapshot, or returns unknown when absent.
- The entire plan is cached by full FEN, Elo bucket, last move, and timing-model version. Cache hits bypass both searches.
- Clock observations with matching `observationKey` are merged by timestamp; duplicate DOM samples can update increment confidence. Each observation may schedule a timer, relying on final guards to prevent stale execution.
- Telemetry writes through a local adapter before scheduling so every decision is replayable. Puzzle reuses `/move-plan` but writes to a different telemetry namespace and does not commit competitive session state.
- Rollout promotion is decided by manual review of a generated scorecard; the thresholds may change between releases.

Both implementations can cite AD-1 through AD-18, yet they differ in latency isolation, move semantics, cache observability, state transitions, execution behavior, privacy/performance, puzzle cost, and release governance. They would not be interchangeable behind the declared contracts.

## Findings

### ADV-01 — Deadline, queueing, and cancellation semantics do not establish a bounded interference guarantee

- **Severity:** P0
- **Affected:** AD-2, AD-9, AD-16; `MovePlanService`, engine adapter, request registry
- **Ambiguity:** “checks remaining time before every queue/stage/retry” and “supports cooperative stop/obsolescence” do not say whether an already-running synchronous Komodo call must be interruptible, whether a newer revision preempts an older one, how the queue is ordered/coalesced, or how long an abandoned request may delay the next live request.
- **Incompatible readings:** Implementation A actively stops stale UCI work and is latest-wins; Implementation B allows the bounded current stage to finish under FIFO. Both perform deadline checks and support obsolescence between stages.
- **Impact:** A stale request can consume the only engine for most of its original budget, causing the next position to miss its deadline. Browser abort remains operationally irrelevant even though the prose acknowledges that fact.
- **Required resolution:** Define a normative engine-port contract with: monotonic server deadline; maximum non-preemptible quantum; cancellation token checked during analysis; active `stop()` behavior; latest-revision coalescing per session; queue admission rule; stale-result discard; cache-warming prohibition for obsolete work; and a measurable bound such as “an obsolete request cannot delay the newest admitted revision by more than X ms plus engine restart allowance.” Specify typed outcomes for `obsolete_before_start`, `cancelled_in_stage`, `deadline_partial`, and `deadline_fallback`.
- **Acceptance proof:** A concurrency test starts a long analysis, supersedes it, and proves the replacement completes within the bound while the stale request neither commits a plan nor warms a context-sensitive cache.

### ADV-02 — “Two declared engine lenses” does not define how the selected move and reference evidence remain coherent

- **Severity:** P0
- **Affected:** AD-2, AD-5, AD-6; response contract and cache identity
- **Ambiguity:** The spine does not specify search order, whether the selector is a second engine search or a policy over reference candidates, whether both lenses share root moves/seed/limits/perspective, or what happens when the selected move is absent from the reference MultiPV snapshot. “Atomic” binds the response, but not the semantic relationship of its contents.
- **Incompatible readings:** Implementation A freezes a reference candidate set then selects within it. Implementation B independently selects first and later evaluates if possible. Both return both configs and a regret field.
- **Impact:** `selectedMoveRegret`, `decisionValue`, long-think eligibility, cache reuse, and reproducibility acquire different meanings. The same position/Elo/seed may trigger a long think in one implementation and a quick move in the other.
- **Required resolution:** Choose one normative composition. If searches remain independent, require a reference evaluation of the actual selected move under the same root position, perspective, score normalization, and reference snapshot; define mate-score normalization, missing-move behavior, stage order, deterministic seed ownership, and which lens may be skipped under deadline. If selection is restricted to reference candidates, state that explicitly and define candidate coverage guarantees.

### ADV-03 — Position identities and cache components are named but not canonicalized

- **Severity:** P1
- **Affected:** AD-12, AD-15; `analysisPositionKey`, `historyDigest`, pure-analysis cache, contextual plan keys
- **Ambiguity:** “canonically identifies chess-analysis inputs and history qualifiers” does not enumerate FEN fields, Chess960/castling conventions, repetition/halfmove relevance, engine option digest, root restrictions, stage/tier, or Elo quantization. “Inputs capable of altering move/evidence” is implied by prose but not a normative key schema.
- **Incompatible readings:** Implementation A keys reference analysis on the first four FEN fields and reapplies all overlays. Implementation B keys a complete plan on full FEN plus Elo bucket and context. Both are versioned and can call their key canonical.
- **Impact:** Cross-game reuse, draw/repetition evaluation, selected-move reuse, and invalidation behavior diverge. Cache hits can alter observable timing and evidence without a defined diagnostic.
- **Required resolution:** Publish separate normative key tuples for `observationKey`, `analysisPositionKey`, `referenceAnalysisCacheKey`, `selectorCacheKey` if any, and `contextualPlanKey`. State exact canonical serialization, Elo quantization point, history-confidence handling, engine/config generation fields, TTL/size policy, whether obsolete/partial results are cacheable, and mandatory cache-hit diagnostics.

### ADV-04 — Session reducer ordering, lifecycle, and opponent-turn opportunity are under-specified

- **Severity:** P1
- **Affected:** AD-4, AD-6, AD-7, AD-10, AD-15; clock context and scheduler
- **Ambiguity:** The spine requires immutable observations and a reducer but does not define the event envelope, monotonic sequence/revision, duplicate/out-of-order policy, game-start/reset identity, tab reload bootstrap, or when debt and opponent-turn preparation credit are committed. “Opponent-turn opportunity” has no expiry/decay or upper bound.
- **Incompatible readings:** One reducer rejects all out-of-order samples and commits after actual execution; another merges samples and commits when scheduling. One grants preparation credit proportional to opponent elapsed time; another treats the presence of a forecast match as sufficient.
- **Impact:** Repeated DOM observations can double-charge debt, a cancelled timer can still affect future moves, or a reload can carry stale state into a new game. Prepared-response timing will be incomparable across implementations.
- **Required resolution:** Define a versioned event/state transition table with `(gameId, positionRevision, observationSeq)`, idempotency rules, commit point, cancellation rollback/no-op semantics, reset triggers, bootstrap confidence, and opponent-turn credit formula inputs/decay/cap. Require zero or minimum credit for instant replies and bounded credit for long opponent thinks.

### ADV-05 — The single-scheduler invariant does not guarantee single pending execution or platform-neutral UCI semantics

- **Severity:** P1
- **Affected:** AD-8, AD-14, AD-15; structural seed and capability map
- **Ambiguity:** “sole scheduler/executor” allows multiple timers owned by that scheduler. The required cancel/replace rule for repeated observations is absent. Full UCI validation is required, but the platform adapter contract for promotions, underpromotions, orientation, drag/click failure, acknowledgement, and retry is not defined. `MAX remains synchronous` is undefined outside current code context.
- **Incompatible readings:** Implementation A enforces one pending token per game revision and requires platform acknowledgement. Implementation B leaves multiple timers alive and relies on final guards; it maps any promotion suffix through a platform default.
- **Impact:** Duplicate execution attempts, silently wrong promotions, debt recorded for moves never executed, and platform-specific assumptions leak back into the scheduler.
- **Required resolution:** State “at most one pending execution per game; newer revision atomically cancels/replaces it.” Define a `PlatformMove`/`ExecutionResult` contract preserving exact UCI promotion piece, legal-move equality, acknowledgement, retry prohibition/limits, and when session state commits. Define or remove the `MAX` exception in architecture terms.

### ADV-06 — Persistence and telemetry ports lack non-interference guarantees

- **Severity:** P1
- **Affected:** AD-1, AD-10, AD-11, AD-17
- **Ambiguity:** Optional/bounded telemetry does not state that adapter latency, quota failure, schema migration, or upload failure must never delay analysis/scheduling or alter the pacing decision. “Consent” and retention controls for exact local replay lack defaults and activation boundaries. Settings authority during migration is unspecified.
- **Incompatible readings:** One implementation emits aggregate telemetry asynchronously and drops on pressure. Another blocks before scheduling to guarantee exact replay, still using a port and bounded local store. Both preserve correctness after durable-state loss in a narrow sense.
- **Impact:** A storage outage can become visible think time, corrupt timing calibration, or make commercial cloud adoption change runtime behavior. Raw FEN diagnostic capture may be accidentally enabled by ordinary telemetry settings.
- **Required resolution:** Make ports observational and non-blocking with explicit backpressure/drop policy, latency budget, failure isolation, and no feedback into the current decision. Define settings precedence/migration/fail-closed defaults. Require exact replay mode to be default-off, separately consented, local-only unless a later policy explicitly changes it, TTL-limited, and visibly indicated.

### ADV-07 — Puzzle separation defines state isolation but not behavior or service isolation

- **Severity:** P2
- **Affected:** AD-18, AD-2, AD-13
- **Ambiguity:** A “separate stateless presentation policy and namespace” does not say whether Puzzle calls `/move-plan`, consumes the shared engine queue/cache, uses humanized delays, or is immediate/configured. It only forbids competitive reducer and telemetry updates.
- **Incompatible readings:** Implementation A never invokes competitive analysis for Puzzle. Implementation B invokes `/move-plan` and shares engine/cache but suppresses competitive commits. Both satisfy the literal invariant.
- **Impact:** Puzzle traffic may starve competitive requests or contaminate latency/cache metrics; users see incompatible puzzle timing.
- **Required resolution:** Declare the Puzzle execution contract and whether it may use the engine service. If shared, assign a separate queue class, cache namespace, metrics, and lower scheduling priority. Exclude Puzzle from competitive calibration denominators explicitly.

### ADV-08 — Calibration artifacts are required, but rollout has no immutable pass/fail policy

- **Severity:** P1
- **Affected:** AD-13, AD-17; release governance
- **Ambiguity:** Metrics are enumerated, but corpus split, minimum cells, confidence method, baseline, regression budget, safety thresholds, owner, and promotion/rollback authority are not bound. “Require evidence” permits an informational scorecard with manual promotion.
- **Incompatible readings:** Implementation A blocks release on checked-in thresholds over a frozen held-out corpus. Implementation B generates the same metrics and promotes by subjective review, changing thresholds release by release.
- **Impact:** “Calibrated and testable” is not reproducible; anecdotal tuning can still ship while technically producing the mandated artifact.
- **Required resolution:** Add a versioned release-gate manifest containing dataset/corpus version, train/validation/held-out split, minimum sample count per declared slice, confidence interval method, baseline version, hard safety gates, allowed regression deltas, required scenario matrix, named decision owner, shadow duration/sample target, and automatic rollback triggers.

### ADV-09 — `perceptionElo` ownership and temporal smoothing are not specified at the boundary

- **Severity:** P1
- **Affected:** AD-2, AD-5, AD-12; frontend reducer and backend evidence mapping
- **Ambiguity:** The spine says `perceptionElo` interprets reference evidence but not where that transformation occurs, which raw evidence remains Elo-independent, whether Auto Adjust is sampled once per own move, how it is smoothed/clamped, or whether the value in the request is authoritative.
- **Incompatible readings:** One backend maps raw evidence using request Elo and caches only raw analysis; another returns normalized evidence and the browser remaps it after an EMA. Both can claim that perception Elo “governs interpretation.”
- **Impact:** Frontend/backend versions can double-apply or omit Elo effects; cache keys and exact replay differ; transient rating changes create discontinuities.
- **Required resolution:** Assign one owner for the mapping, define `rawAutoAdjustElo -> bounded smoother -> perceptionElo` update cadence/reset/clamps, state whether it is part of request or local decision input, and ensure diagnostics expose raw, smoothed, and effective values with model versions.

### ADV-10 — Fallback compatibility is unspecified at the most safety-critical boundary

- **Severity:** P1
- **Affected:** AD-9, AD-12; browser client, pacing core, scheduler
- **Ambiguity:** Incompatible versions “fail closed to a documented conservative policy,” but the spine does not define whether this means no automated move, immediate legal selector fallback, legacy `/getmove`, minimum delay, or a clock-derived safe delay. Likewise, partial engine outcomes do not specify the minimum fields needed for execution.
- **Incompatible readings:** One client refuses execution on schema mismatch. Another falls back to legacy `/getmove` plus a short clock-safe delay. Both may call their behavior conservative.
- **Impact:** Version drift can either stop the product or silently reintroduce the exact split pipeline and robotic timing the architecture forbids.
- **Required resolution:** Define an explicit fallback matrix by failure class. The Smart Pacing path must never call legacy `/analyze`; state whether legacy `/getmove` is prohibited, allowed only outside Smart Pacing, or allowed with a typed degraded plan. Define the minimum executable plan fields and whether insufficient evidence permits only a safe quick move or disables automation.

## Gate conditions for PASS

The spine can pass this lens when it adds or delegates to normative companion contracts that resolve, at minimum:

1. bounded stale-request interference and active cancellation behavior;
2. exact two-lens composition and regret semantics;
3. canonical identity/cache tuples;
4. reducer event ordering, idempotency, lifecycle, and commit point;
5. one-pending-execution plus exact platform move/acknowledgement semantics;
6. telemetry/storage non-interference and explicit diagnostic consent;
7. fixed rollout gate manifest and fallback matrix.

Items may live in `SOLUTION-DESIGN.md` if the spine makes them binding by stable section/contract reference. They should not remain merely examples or deferred tuning choices.

## Recheck

**Verdict: FAIL (1 P1 remains open).**

- **Closed — obsolete blocking:** AD-9 and AD-19 now establish pre-lock admission/coalescing, current-plan priority, `cancellationGraceMs=250`, forced restart with generation invalidation, and a bounded successor wait/fallback.
- **Closed — two-lens composition:** AD-2 now fixes the stage order, deep root union, selector fallback, and typed partial-evidence behavior while binding selected move, reference best, and regret in one response.
- **Still open — canonical contextual plan key (ADV-03, P1):** AD-15 canonically enumerates `observationKey`, `analysisPositionKey`, pure-reference cache additions, and selection-cache additions, but the context-sensitive **plan key** remains only “any move-affecting context must enter the plan key.” Independent implementations can still choose incompatible tuples for prior forecast/preparation match, last move/recapture context, perception Elo/model, history confidence, and contextual policy version. Enumerate the exact plan-key tuple and state whether partial/obsolete results are cacheable; then this item closes.
- **Closed — reducer/scheduler idempotency:** AD-8 now enforces one pending timer and active plan, atomic revision replacement, current-revision-only commit, and duplicate/out-of-order outcome rejection.
- **Closed — immutable release manifest:** AD-20 now makes corpus hash, compatibility ranges, thresholds, sample minima, ownership, rollback triggers, and artifact versions immutable inputs for each run.

**Final targeted recheck: PASS.** AD-15 now enumerates the complete `contextualPlanKey`, keeps temporal frontend overlays uncached, and explicitly forbids caching partial, fallback, cancelled, obsolete, or recovering results; ADV-03 is closed with no remaining P0/P1 finding in the requested recheck scope.
