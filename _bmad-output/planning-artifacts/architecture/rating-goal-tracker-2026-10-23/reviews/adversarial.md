# Adversarial architecture gate

Reviewed: `ARCHITECTURE-SPINE.md` and `ENGINEERING-PLAN.md`, 2026-10-23. Documentation review only; no application changes.

## Verdict

The safety boundaries are strong, but the shared V1 seed is not yet deterministic enough for independent implementation. The counterexamples below require no engine, gameplay effects, second persistence authority, guessed game order, or DOM confirmation. Two teams can preserve all eight ADs at their stated level while making different choices at undefined contract boundaries. Resolve these before treating the plan as implementation-ready.

## Two independently conforming implementations

Implementation A consists of a SQLite-backed reconciler and goal evaluator that identifies evidence by semantic payload, treats the first post-creation receipt as baseline eligibility, compares effective timestamps literally, and assigns one proximity transition key per goal revision.

Implementation B has the same durable authority and pure-domain boundaries, but includes response provenance versions in evidence identity, requires the baseline's effective time to be post-creation, compares observations through inferred game-period membership, and assigns a separate proximity transition key to each armed cycle.

Both accept only server-validated evidence, preserve immutable observations and confirmed state on failures, use full account/category keys, and insert durable events transactionally. The plan leaves the following differences unsettled.

### 1. Baseline eligibility has two incompatible clocks

**References:** AD-6; plan sections 5.4 and 7.

**Fixture:** Goal creation is 12:00. At 12:01 the first valid public stats response arrives: rating 1900, source-effective time yesterday. Target is 1850 with direction `at-least`.

**A:** The observation was accepted after creation. It establishes the explicitly allowed as-of baseline and immediately completes the already-satisfied target.

**B:** The source-effective timestamp predates creation. There is no eligible observation at or after creation, so the goal remains awaiting-baseline until a later rating event.

Neither implementation uses fetch time as rating chronology. The ambiguity is the separate definition of *eligibility*. A source-effective interpretation also means an inactive account may wait indefinitely despite having a known current as-of rating.

**Minimal tightening:** Define baseline eligibility with a named clock and an exact predicate. If pre-creation as-of evidence is eligible, explicitly allow it, define what achievement time an already-satisfied goal records, and state whether existing cached evidence can initialize a newly created goal without a network refresh. Add this exact inactive-account acceptance fixture.

### 2. Observation identity and status ownership are underspecified

**References:** AD-2, AD-4; plan sections 3, 5.2, 6.8 and 8.

**Fixture:** A 200 response is checked again through a 304 and then a byte-identical 200. Rating-effective time and rating do not change, but check time, freshness and HTTP metadata do. Later independent evidence contests the rating.

**A:** One immutable observation represents the semantic rating evidence. HTTP checks are separate metadata records; conflict/verification status is a derived projection.

**B:** Each changed provenance version produces a new immutable observation with the same semantic rating payload; conflict is another version. Repeated identical ingestion remains idempotent within its version.

Both preserve effective time and can enforce uniqueness on their own definition of digest. They disagree about observation IDs, history cardinality, goal evidence references and the meaning of the observation's required mutable-looking `verification` and `freshness` fields. The plan neither specifies digest inputs nor distinguishes immutable evidence from revalidation events and derived classification.

**Minimal tightening:** Specify the canonical observation-ID/digest preimage and its exclusions. Separate immutable source payload from HTTP checks and reconciliation classifications, or define a precise immutable version-chain contract. State how a 304 updates last-checked/freshness without mutating immutable evidence. Add identical-200/304/reclassification fixtures asserting exact IDs and reference behavior.

### 3. Comparable period and correction ordering lack an executable predicate

**References:** AD-4; plan sections 2 and 5.3–5.11.

**Fixture:** Confirmed prior rating is 1900. Archive game G reports post-game 1910 at 12:00:00. Stats report 1905 at 12:00:01. There is no later known game. The plan itself records that archive end and stats last date can differ by one second.

**A:** Stats have a later effective timestamp; they describe a later unattributed adjustment. Current rating becomes 1905.

**B:** These sources describe the same game period, so the differing values conflict. Current stays at the prior 1900 and completion notifications are suppressed.

Neither uses request arrival, numeric IDs or rating magnitude for chronology. The undefined terms are `same-period`, `comparable` and `genuinely later`. A bare larger timestamp does not distinguish a later adjustment from two representations of one event. Subsequent corrected bodies with the same effective time also have no defined supersession proof.

**Minimal tightening:** Define a partial-order/comparability function over stats and archive evidence, including game linkage, equal/nearby timestamps, same-effective-time provider revisions and the absence of a linked game. Do not introduce a guessed tolerance as provider truth. Specify when evidence must remain incomparable/conflicted and what evidence resolves it. Add this one-second mismatch plus corrected-body permutations to acceptance tests.

### 4. Stable-ID resolution does not define aggregate migration

**References:** AD-2, AD-3; plan sections 3 and 5, identity rule 6.

**Fixture:** An explicitly monitored username has no available `player_id`; it owns a goal and public evidence under an unresolved account key. A later profile proves that username belongs to stable player ID 42. No competing identity exists.

**A:** It atomically migrates the account/category aggregates and references to `chesscom:player:42` after verification. The goal continues under the canonical key.

**B:** It retains the unresolved aggregate, records a verified association, and creates a stable-key aggregate for new evidence. Existing goals continue to reference the old account key until an explicit resolution operation.

Both avoid automatically merging *unresolved* identities and require stable-ID proof. The specification does not say whether a newly verified association authorizes migration, whether stable keys replace existing keys, or who owns goals/jobs/cache records during that transition. A later username reassignment amplifies this gap.

**Minimal tightening:** Define one identity-resolution command and its atomic effects on aliases, goals, observations, current snapshots, jobs, HTTP cache and notification references. Specify which IDs remain immutable, how canonical lookup works, and how stale request generations are rejected. Include first verification, verified rename and username reassignment fixtures.

### 5. Proximity re-arming lacks a durable event namespace

**References:** AD-2, AD-6; plan sections 7 and 8.

**Fixture:** A tracking goal receives eligible confirmed distances 25 → 15 → 35 → 15, then the server restarts. No threshold crossing occurs.

**A:** It inserts one unique `(goalId, revision, proximity)` event. Re-arming updates evaluator state, but the same event namespace prevents another logical alert.

**B:** It records an armed-cycle counter and inserts two distinct proximity events, one per entry after re-arming. Both survive restart without duplicates.

The explicit completion namespace is well-defined. Proximity is described both as `one advisory` and as re-armable, but its transition identity and durable armed state are absent from `RatingGoalV1`. The two implementations can each enforce storage uniqueness while producing different user-visible event counts.

**Minimal tightening:** State whether re-entry creates another advisory. If yes, define durable hysteresis state and a deterministic cycle/transition ID in the schema and unique key. Define initial creation inside the window, pause/resume, threshold revision, historical replay and completion-versus-proximity precedence. Add a restart in the middle of the sequence above and assert exact inbox event IDs/counts.

## Gate closure

The minimal closure is a versioned contract appendix with canonical identity/observation keys, explicit baseline eligibility, a source comparability relation, identity-resolution transaction semantics and a proximity transition table. Each counterexample should become a shared fixture with exact expected state and events, including different delivery orders. This is narrower than application implementation and preserves the existing passive-monitoring architecture.
