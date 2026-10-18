# Rubric Review — Module 14 Session Control and DDA

**Lens:** BMad good-spine checklist  
**Reviewed:** `ARCHITECTURE-SPINE.md` and companion `ENGINEERING-PLAN.md`  
**Original verdict:** **CHANGES REQUIRED.** The design had a strong core model and unusually good failure-path coverage, but claimed browser-side guarantees it could not enforce, left the calibration preflight boundary undefined, and did not reconcile its modular seed with the userscript's actual delivery model.

**Recheck verdict (2026-10-13):** **CHANGES REQUIRED — NO CRITICALS, FOUR HIGHS REMAIN.** The corrected design closes the original critical external-effect race and most original high findings. The remaining issues are contract/inheritance inconsistencies and one controller-eligibility hole; none requires replacing the architecture.

## Deterministic gate

`lint_spine.py` passes with zero mechanical findings when invoked directly with the repository Python interpreter. The `uv run` wrapper could not persist its interpreter cache in this sandbox, which is an environment issue rather than a document defect.

## Critical findings

### C1 — IndexedDB fencing cannot guarantee exactly-once DOM effects

**Evidence:** AD-1 says every DOM click and scheduled move revalidates the fence immediately before the effect; the Engineering Plan repeats a short transaction immediately before an irreversible effect; acceptance then promises that no more than one irreversible effect can pass fencing for a revision.

**Why this fails the rubric:** IndexedDB can fence durable transactions, but it cannot fence a DOM effect after the transaction closes. A stale tab can validate, be suspended before `click()` or the final move callback, lose the lease, then resume and execute after a new leader has acted. This is a classic check-to-use gap. The Rule therefore does not enforce its stated prevention of duplicate queue clicks or stale moves, and the acceptance criterion overclaims what the browser mechanism proves.

**Required disposition:** **Discuss, then fix.** Choose and bind an external-effect serialization mechanism. The most direct browser-native option is an exclusive Web Locks lock around the final fence check plus synchronous issuance of the DOM effect, with capability detection and fail-closed behavior when unavailable. If Web Locks is not acceptable, narrow the guarantee to exactly-once durable intent plus best-effort at-most-once DOM issuance and require a platform-idempotency/reconciliation strategy. In either case, define the linearization point and test a stale tab that pauses after validation but before effect issuance.

## High findings

### H1 — Lease renewal changes the fencing token and can invalidate healthy in-flight work

**Evidence:** AD-1 states that acquisition **and renewal** increment the monotonic fencing token; all commands, network requests, and move callbacks bind that token.

**Why this fails the rubric:** A normal heartbeat can stale the same owner's in-flight `/move-plan` or scheduled move even though ownership never changed. Different units could compensate differently by rebinding, cancelling, or ignoring the renewal. This creates avoidable starvation and inconsistent semantics.

**Required disposition:** **Autofix.** Increment the ownership epoch only on initial acquisition or takeover. Renewal by the current owner extends expiry while preserving the token. Define compare-and-swap guards over `(ownerTabId, fencingToken, expiresAtEpochMs)` and explicitly reject an expired owner even if its token matches an old snapshot.

### H2 — The required calibration capability preflight has no implementable contract

**Evidence:** AD-9 and the queue gate require fresh authenticated metadata for scale, artifact checksum/version, rollout eligibility, and supported range *before admission*. The existing `/move-plan` contract returns calibration identity only after a game has begun; neither document names a capability endpoint, request/response schema, freshness TTL, invalidation signal, or error policy.

**Why this fails the rubric:** Two frontend implementations could derive “fresh capability” incompatibly, and the stated admission gate cannot be implemented from the exact `/move-plan` payload alone. This is a load-bearing cross-boundary contract, not story-local detail.

**Required disposition:** **Autofix.** Add a versioned authenticated read-only endpoint/port contract (or explicitly adopt an existing endpoint if one exists), including schema, `generatedAt`/expiry semantics, scale/support bounds, artifact and activation identities, cohort eligibility for the runtime game token, cache invalidation, and fail-closed behavior. The capability must not promise a cohort before the server has the same stable resolution identity used by `/move-plan`.

### H3 — “Session win rate” and “actuator-valid evidence” are conflated

**Evidence:** AD-5 excludes every “unactuated” outcome from the only W/D/L controller counts. AD-9 makes a game non-controlling after calibration mismatch/fallback. The user requirement, however, is to monitor the current session's win rate, and the UI promises W-D-L and raw/posterior win rate.

**Why this fails the rubric:** If a single move falls back because of a timeout or clock-safety decision, excluding the entire game means the displayed/control rate is no longer the session win rate and can introduce outcome-dependent selection bias. Conversely, counting it as calibrated evidence weakens the causal claim. Independent units could choose opposite interpretations.

**Required disposition:** **Discuss.** Define two immutable ledgers/counters: all eligible session results and fully actuated calibration-valid results. Explicitly choose which one drives DDA and which one the UI calls “session win rate”; expose both if they differ. Define whether actuator validity is monotonic false after the first non-applied move and whether clock-safety fallback, target saturation, and partial application each disqualify a result.

### H4 — The structural seed does not fit the brownfield userscript delivery model

**Evidence:** The Spine seeds `frontend/session_control/*.js`, but the current project delivers `script.js` directly to Tampermonkey and has no declared module bundler/build pipeline. Existing reusable frontend logic lives under `src/`, while production behavior is embedded in `script.js` (and a second userscript file also exists).

**Why this fails the rubric:** The spine does not ratify the codebase's packaging reality. Implementers could create test-only modules while separately copying logic into the userscript, producing two sources of truth—the exact divergence an architecture spine should prevent.

**Required disposition:** **Autofix.** Decide the canonical source and delivery path: for example, `src/session_control/` as the only source plus a deterministic checked-in bundling step that emits `script.js`, with byte/syntax/contract tests; or explicitly keep Module 14 inside the monolith and limit extracted files to pure test fixtures. Also state the role of `TC157.user.js` so production artifacts cannot drift.

### H5 — Storage failure behavior contradicts single-writer safety

**Evidence:** AD-10 and the failure table allow an admitted game to continue Auto Move under the last durable snapshot when IndexedDB writes fail, while AD-1 requires a valid fence and AD-6 makes IndexedDB the authority.

**Why this fails the rubric:** Without writable authority, a tab cannot safely renew/revalidate ownership or persist revision and outcome state. Continuing effects can create the same stale-writer race the design is intended to eliminate. “If safe” is not an enforceable guard.

**Required disposition:** **Autofix.** On loss of read-write authority, cancel all pending irreversible effects and fail closed. A game may resume only after a healthy repository is reopened, a fresh ownership epoch is acquired, and current live game/position identity is reconciled. If the product deliberately prefers game completion over split-brain safety, record that as an explicit trade-off and weaken AD-1 accordingly.

### H6 — Inferred Fast-path decisions are incorrectly marked `[ADOPTED]`

**Evidence:** All twelve local ADs are marked `[ADOPTED]`, including new choices not supplied by the user or demonstrated by existing code: event sourcing, IndexedDB authority, Beta(1,1), minimum sample gate, capability preflight, and fail-closed policies.

**Why this fails the rubric:** On the BMad Fast path, inferred decisions must remain visible as assumptions until ratified. Marking them adopted hides unresolved trade-offs and makes parent/requirement reconciliation look stronger than it is.

**Required disposition:** **Autofix.** Keep genuinely inherited/user-settled rules adopted; mark inferred load-bearing choices `[ASSUMPTION]` or list them as open questions with a concrete revisit gate. In particular, ask for ratification of the posterior estimator/sample gate, true hysteresis behavior inside the band, the storage authority, and the treatment of non-applied games.

## Medium findings

### M1 — Persisted lifecycle vocabulary is internally inconsistent

AD-6 says the controller enters `PAUSED_STORAGE`, AD-12 says `PAUSED_CONTEXT`, while the durable state table and diagram define only `PAUSED`. Normalize this to `phase: "PAUSED"` plus a strict `pauseReason` enum/object, or add the sub-states everywhere. The current wording permits incompatible reducers and DTOs.

### M2 — Queue intent expiry is a transition without a policy

The state diagram and transition table allow an admitted queue intent to expire, but no timeout, timestamp basis, game-binding evidence, extension rule, or late-game reconciliation rule is defined. Bind a versioned `queueBindDeadlineEpochMs`, specify how a late platform game is handled, and ensure expiry cannot let the controller queue a second game while the first is still being created.

### M3 — Opponent “stability” is unspecified

AD-3/AD-10 require stable opponent identity/rating, yet neither document defines the observation quorum, minimum age/freshness, accepted DOM sources, disagreement handling, or whether a rating change after pinning invalidates the game. This directly affects target Elo. Define a deterministic evidence reducer and store its version in `ActiveGame`.

### M4 — Storage growth and quota ownership are not closed

The event journal and completed snapshots are unbounded. “Long-term session history/export” is deferred, but retention and quota failure are runtime correctness concerns even without export. Set caps/retention, compaction or pruning rules, quota telemetry, and an owner/revisit condition. Never delete the active session or its deduplication horizon.

### M5 — Environment compatibility is not pinned

The Stack says “existing project target/integration” and “browser-native,” without minimum Chrome/Tampermonkey versions, required GM grants, IndexedDB/BroadcastChannel/Web Locks capability checks, or upgrade/rollback behavior. A brownfield feature that depends on cross-tab primitives needs an explicit compatibility envelope and fail-closed startup checks.

### M6 — Parent Smart Pacing state reconstruction needs a sharper boundary

The plan persists `lastFen` and `positionRevision`, while inherited Smart Pacing AD-10 says per-game pacing correctness requires no durable history and reconstructs from the live position. State explicitly that persisted DDA identity/target is authoritative only for Module 14 and that persisted FEN/revision can be a reconciliation hint, never an authority for executing/restoring a move or pacing debt. Recovery must rebuild Smart Pacing from current live observations.

## Low findings

### L1 — Event-sourced naming exceeds the described model

The design persists both events and authoritative snapshots, but recovery appears snapshot-first rather than event replay. Either define event replay as the source of truth and snapshot as a projection, or call this an idempotent journaled state machine. The present name may cause implementers to add unnecessary replay complexity.

### L2 — Credible interval algorithm is not version-complete

The estimator version names the posterior mean but not the numerical method/quantile implementation for the 95% interval. Since it is observable rather than actuating, this is low risk, but deterministic replay/byte equivalence requires a specified algorithm and serialization/rounding convention.

### L3 — Active-session uniqueness is implicit

The metadata store has a current-session pointer, but start behavior when another non-terminal session exists is not stated. Define one active session per `(browserProfile, accountKey)` and make pointer/session creation a single transaction, or explicitly permit multiple independent sessions.

## Checklist disposition

| Good-spine criterion | Result | Notes |
| --- | --- | --- |
| Fixes real divergence points | Partial | Strong coverage of TTL, hysteresis, persistence, and identity; capability preflight, outcome semantics, and delivery topology remain divergent. |
| Every Rule is enforceable and prevents its claim | Fail | AD-1's DOM guarantee and AD-10's storage-degraded continuation are not enforceable together. |
| Deferred contains no hidden divergence | Partial | Retention is deferred too broadly; runtime quota behavior is still owned now. |
| Named technology is verified/current | Partial | Browser-native primitives are named but no supported browser/Tampermonkey envelope is pinned. |
| Ratifies brownfield codebase | Fail | Exact `/move-plan` request shape is aligned, but the proposed frontend file topology has no production packaging path. |
| Covers requested capabilities | Pass with caveat | Lifecycle, resilient persistence, hysteresis, DDA target, and exact request payload are covered; session-rate semantics need clarification. |
| Preserves inherited invariants | Partial | No direct engine/calibration violation; Smart Pacing reconstruction boundary needs explicit containment. |
| Owns operational/environmental dimensions | Partial | Rollout and telemetry are present; compatibility, storage quota/retention, and capability endpoint operations are incomplete. |

## Recommended gate order

1. Resolve C1 and H5 together: define the actual external-effect safety guarantee and authority-loss behavior.
2. Ratify H3/H6 with the user: controller evidence semantics and Fast-path assumptions.
3. Specify H2 and H4: capability boundary and canonical userscript delivery.
4. Normalize lifecycle/queue/opponent contracts (M1–M3).
5. Close the compatibility and storage envelope (M4–M6).

After those changes, rerun the mechanical linter plus a stale-tab/TOCTOU reviewer and a brownfield integration reviewer.

---

## Recheck after corrections — 2026-10-13

### Closure status of original critical/high findings

| Original finding | Status | Recheck evidence |
| --- | --- | --- |
| C1 — IndexedDB cannot fence DOM effects | **Closed** | AD-1 now requires one canonical origin plus an origin-scoped Web Lock held across final IndexedDB validation and synchronous DOM dispatch. Durable effect states prevent blind replay. |
| H1 — renewal changes fencing token | **Closed** | Acquisition/takeover increments the token; renewal preserves it. Concrete 15s/5s lease timing and tests are specified. |
| H2 — no capability preflight contract | **Closed with follow-up below** | Authenticated `POST /calibration-capability` and `/move-plan` schema v2 requirement are now defined. The boundary exists, though its identity is still incomplete relative to the parent calibration spine (RH1). |
| H3 — session rate conflated with calibrated evidence | **Closed with follow-up below** | `observedCounts` and `controlCounts` are separate, UI exposes both, and per-game invalidation is irreversible. A zero-applied-move eligibility hole remains (RH3). |
| H4 — modular seed lacks userscript delivery path | **Closed** | AD-14 establishes canonical modules, deterministic generated region in `script.js`, and CI zero-diff verification. `script.js` is explicitly the installable artifact. |
| H5 — storage-failure drain contradicts fencing | **Closed** | Storage loss now stops automated moves and requires healthy authority recovery before continuation. |
| H6 — Fast-path assumptions hidden as adopted | **Partially closed** | True hysteresis is now tagged `[ASSUMPTION]`, but other inferred load-bearing decisions remain untagged (RH4). |

### Remaining critical findings

None.

### Remaining high findings

#### RH1 — Module 14 weakens the inherited calibration identity

**Evidence:** Elo Calibration AD-10/AD-12 require a per-game identity including `cohort`, `artifactChecksum`, `scaleId`, `seedPolicyVersion`, resolver identity, resolved/applied Skill, `budgetClass`, resolution key, and profile digest in move-affecting identity. Module 14's capability response omits `seedPolicyVersion`, resolver, and budget class; its `calibrationRequirement` binds only mode/scale/artifact; response acceptance compares only target, scale, and artifact checksum.

**Impact:** A selector policy, seed policy, budget class, resolver, applied Skill, or profile digest can change while Module 14 still declares the plan actuator-valid. That directly weakens inherited identity/cache invariants and could mix different calibrated behaviors inside one game.

**Required fix:** Capability pin must include every stable pre-request calibration identity (`cohort`, `rolloutVersion`, `artifactVersion/checksum`, `scaleId`, `seedPolicyVersion`, supported `budgetClass` policy). The first applied engine response must atomically pin target-dependent identity (`resolverVersion`, `resolutionKey`, latent/applied Skill, profile digest, actual budget class), and every later engine-sourced response must match it. Add these fields to the v2 requirement/response validation as applicable and test mismatch for each move-affecting field.

#### RH2 — The Spine and Engineering Plan name incompatible `/move-plan` versions

**Evidence:** Spine Stack says “Schema v1 compatibility, Module 14 client v1,” while AD-9 and Engineering Plan §7.2 require request `schemaVersion: 2` with mandatory `calibrationRequirement`.

**Impact:** This is a central frontend/backend boundary. Independent implementers can build mutually incompatible clients and validators, and the declared v1 compatibility can accidentally allow a request that lacks the fail-closed calibration precondition.

**Required fix:** Make the Spine authoritative and explicit: legacy clients remain schema v1 only under the existing compatibility policy; Module 14 requires `/move-plan` request/response schema v2 and fails closed on v1. State the server negotiation/cutover rule and add cross-version contract tests.

#### RH3 — A game with zero applied engine moves is controller-eligible by vacuous truth

**Evidence:** AD-5 says a game is eligible when every engine-sourced response was applied; book/forced responses are neutral. The plan repeats this but imposes no `appliedMoveCount >= 1` gate.

**Impact:** A short game ending during book/forced play, or before the first engine plan, can enter `controlCounts` even though the DDA target was never actuated. This biases the feedback loop with outcomes the actuator could not have caused.

**Required fix:** Require `actuation.valid == true && appliedMoveCount >= 1` for `controlCounts`. Zero-applied games remain in `observedCounts` with a stable exclusion reason such as `ACTUATOR_NOT_EXERCISED`. Add a short-book-game/resignation test.

#### RH4 — Most inferred Fast-path decisions still lack assumption status

**Evidence:** Only AD-4 is tagged `[ASSUMPTION]`; other choices not supplied by the user or inherited from code—Beta(1,1), the control-eligibility policy, IndexedDB event journal authority, Web Locks as a hard runtime requirement, the capability-pin endpoint shape, saturation threshold, and source-generation pipeline—are untagged. AD-8 alone is correctly marked adopted from settled parent behavior.

**Impact:** The document still presents unratified trade-offs as settled architecture. This matters especially for the estimator/evidence population because it changes product-visible win-rate control behavior.

**Required fix:** Mark inferred load-bearing ADs/clauses `[ASSUMPTION]` and present the small ratification set to the user, or record explicit ratification in the memlog and convert only those decisions to `[ADOPTED]`. At minimum ratify estimator/prior/sample gate, control population, hard browser capability floor, and saturation policy before final status.

### Remaining medium tail

The previous M1, M4, M5, and M6 are not fully closed: pause-state names still vary (`PAUSED_STORAGE`, `PAUSED_ACTIVE_STORAGE`, `PAUSED_CONTEXT/...`), retention/quota ownership remains deferred, the browser/Tampermonkey minimum compatibility envelope is unpinned, and persisted `lastFen` is not explicitly demoted to a recovery hint under inherited Smart Pacing AD-10. These do not reintroduce a critical/high safety defect once the four highs above are fixed, but should be normalized before finalization.

---

## Recheck after identity/state/deadline/retry corrections — 2026-10-13

**Verdict:** **CHANGES REQUIRED — NO CRITICALS, TWO HIGHS REMAIN.** The prior RH1–RH4 are materially closed: complete profile fields are now modeled, Module 14 consistently requires schema v2 while legacy remains v1, zero-applied games are excluded from control evidence, and load-bearing Fast-path choices are visibly tagged as assumptions. State phases, drain/intent deadlines, exact-request retries, stored-position recovery semantics, and no-replay behavior are now sufficiently deterministic.

### Remaining critical findings

None.

### Remaining high findings

#### R3-H1 — Opponent rating and calibration target use incompatible Elo scales

**Evidence:** Inherited Elo Calibration AD-2 explicitly forbids treating Chess.com, engine-local, FIDE, CCRL, and other ratings as interchangeable. Module 14's platform evidence emits a bare `opponentRating`, then computes `rawTargetElo=opponentElo±offset` and sends it under a calibration `scaleId` such as `stockfish19-uci-elo-500ms-xeon-envelope-v1`. Neither the platform contract nor `ActiveGame.opponent` names the opponent rating's scale, and no versioned mapping converts Chess.com pool/time-control rating into the artifact scale.

**Impact:** The DDA actuator can be internally deterministic yet target the wrong playing strength. A Chess.com 1800 plus 200 is not mathematically a Stockfish-UCI 2000. This directly contradicts an inherited invariant and undermines the feature's core claim.

**Required fix:** Make platform evidence carry an explicit rating scale including platform, pool/time control, and relevant population/version. Then either (a) use an Elo calibration artifact validated directly on that same scale, or (b) introduce an immutable, versioned, uncertainty-bounded cross-scale conversion artifact before applying the offset. The `±200` offset, converted target, capability request, persisted actuator, `/move-plan` requirement, telemetry, and deduplication identity must all name the resulting scale/conversion version. Missing or unsupported conversion fails closed; a bare opponent rating is invalid.

#### R3-H2 — Exact calibration acceptance still omits stable pinned identity fields

**Evidence:** The capability and `ActiveGame.actuator` now model `artifactVersion`, `cohort`, and `rolloutVersion`, and AD-9 says every later response matches all fields. However, Engineering Plan §7.2's normative acceptance predicate compares target, scale, checksum, seed policy, budget class, and resolved profile only; it does not compare `artifactVersion`, `cohort`, or `rolloutVersion`.

**Impact:** Two implementations can follow different authorities—the broad prose or the exact predicate—and disagree on whether a response from a different cohort/rollout/artifact version remains controller-valid. This still weakens the inherited per-game pinning contract.

**Required fix:** Add `artifactVersion`, `cohort`, and `rolloutVersion` explicitly to the acceptance predicate and response contract. State that all pre-request pinned identity fields plus all first-applied resolved-profile fields must match byte-for-byte on every engine-sourced response. Add one mismatch test per field.

### Non-blocking consistency tail

The durable phase table is normalized, but the failure table still uses display-like strings such as `PAUSED_CONTEXT/OPPONENT_UNCERTAIN` instead of `PAUSED_ACTIVE` or `PAUSED_QUEUEING` plus `pauseReason`; normalize those before final polish. Retention/quota policy and minimum browser/Tampermonkey compatibility remain medium operational gaps, not critical/high blockers for the design handoff.

---

## Final focused recheck — 2026-10-13

**Verdict:** **CHANGES REQUIRED — NO CRITICALS, THREE HIGHS REMAIN.** The conceptual cross-scale rule and the previously missing calibration fields were added, but the exact contracts still do not provide an executable cross-scale dataflow or validate its identity end to end. The authorized-test-context contract also regressed to account-only authorization.

### Remaining critical findings

None.

### Remaining high findings

#### F-H1 — Cross-scale mapping exists conceptually but has no executable owner/data contract

**Evidence:** §7.0 requires `rawTargetElo=translate(...)`, but `/calibration-capability` returns only mapping version/checksum and bounds—no translated target or mapping coefficients/artifact locator. The exact platform evidence DTO in §8.1 omits the required `ratingScaleId` entirely even though prose and `ActiveGame` require it.

**Impact:** The frontend cannot implement the promised translation from the documented payloads. Independent implementations may bundle hidden coefficients, ask the backend implicitly, or accidentally reuse the platform number, recreating the scale bug.

**Required fix:** Choose one owner and make it exact. Preferred: include opponent rating, platform scale, selected offset, and requested calibration scale in the authenticated capability-pin request; let the backend validate the content-addressed mapping and return `platformAdjustedRating`, translated `rawTargetElo`, effective/clamped target, mapping identity, and support status. Alternatively return a strict signed/content-addressed mapping artifact with coefficients and numeric convention for deterministic frontend evaluation. Add `ratingScaleId` to the exact platform DTO and require it in both stable observations.

#### F-H2 — Response acceptance still does not bind the cross-scale mapping identity

**Evidence:** The v2 request requirement carries `ratingScaleMappingVersion` and `ratingScaleMappingChecksum`, but the normative response predicate in §7.2 checks neither field.

**Impact:** A response can satisfy the written acceptance test while being associated with a different conversion artifact than the target persisted for the game. This leaves the new scale boundary outside the end-to-end identity guarantee.

**Required fix:** Require the response calibration block to echo and exactly match `opponentRatingScaleId`, `ratingScaleMappingVersion`, and `ratingScaleMappingChecksum` (or a single content-addressed conversion identity covering all three). Include them in request/body digest, active-game identity, telemetry, cache/idempotency identity, and mismatch tests.

#### F-H3 — Authorized test-context enforcement is account-only in the exact contract

**Evidence:** Spine AD-13 requires a positive allowlist of account keys **and game types/test pools**, preventing unattended DDA on ordinary public competitive contexts. Engineering Plan §8.1's exact authorization DTO contains only `enabled` and `allowedTestAccountKeys`, and the platform evidence DTO no longer contains `gameType`/test-pool identity.

**Impact:** An allowlisted account can start Module 14 in a normal public game, contradicting the explicit deployment safety invariant. The platform adapter has no typed evidence with which to enforce the stronger rule.

**Required fix:** Add canonical `gameType`/`testPoolId` (or another positive permitted-context identity) to platform evidence and a matching allowlist to the authorization DTO. Session start must require both account and context matches; unknown/public context fails closed. Cover an allowlisted account in a non-allowlisted public game with a negative test.

---

## Final verification after executable mapping and context allowlists — 2026-10-13

**Verdict:** **CHANGES REQUIRED — NO CRITICALS, ONE HIGH REMAINS.** Backend-owned translation, mapping identity checks, platform scale/context fields, and account-plus-private-unrated/computer authorization are now complete. One ordering cycle makes the first queue admission impossible.

### Remaining critical findings

None.

### Remaining high finding

#### FV-H1 — Queue admission requires a target-specific capability that cannot exist yet

**Evidence:** `canQueue` requires `calibrationCapabilityActive`. The exact `POST /calibration-capability` request now requires `opponentRating`, `opponentRatingScaleId`, offset, and adjusted rating. Those opponent facts are obtained from the stable game context only after Auto Queue creates/binds a game; the Spine likewise pins the target after stable game/opponent observation and before the first plan request.

**Impact:** The initial state deadlocks: no queue without capability, no opponent/capability without a queued game. Implementers must either bypass the gate or fabricate an opponent rating, both violating the design.

**Required fix:** Split the boundary into two phases. Before queue dispatch, require a non-target-specific `calibrationPreflightActive` proving that an active Elo artifact and attested mapping exist for the configured allowlisted pool/time-class scale and that the runtime token is rollout-eligible. After the canonical game/opponent is observed, call the target-pin endpoint with the real rating/scale/offset; persist its returned target identity before the first `/move-plan`. If target pinning fails, pause Auto Move and require manual completion/abort; never synthesize a target. Rename the queue gate accordingly and add a first-game lifecycle test proving `IDLE → QUEUEING → IN_GAME → target pin → first plan` without bypasses.
