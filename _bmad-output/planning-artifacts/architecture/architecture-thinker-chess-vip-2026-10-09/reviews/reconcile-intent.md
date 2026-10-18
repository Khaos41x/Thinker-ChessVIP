# Reconciliation Review — User Intent vs. Smart Pacing Architecture

**Date:** 2026-10-09  
**Inputs reviewed:** the complete approval chain in the conversation, `ARCHITECTURE-SPINE.md`, and `SOLUTION-DESIGN.md`  
**Review mode:** intent reconciliation only; no deliverable edits

## Verdict

**PASS WITH REQUIRED FIXES.**

The architecture captures the central intent unusually well: one `/move-plan` transaction, staged MultiPV evidence, a stateful time bank, dynamic rather than universal caps, rare 10–40 second critical thinks, temporal debt and recovery, Elo-relative perception, local-first/cloud-ready boundaries, optional privacy-conscious telemetry, full-game simulation, and a distribution-based definition of non-robotic timing. Nothing in the proposed pacing core deliberately degrades timing quality in order to make automation more obvious. The adapter boundary in AD-14 is orthogonal to pacing quality and does not weaken the timing model.

The package is not yet fully reconciled with every approved decision, however. Four gaps could let an implementation comply with the documents while still missing behavior that the user explicitly approved or reasonably expects from a definitive human-like temporal model.

## Coverage of load-bearing intent

| Approved intent | Reconciliation result | Evidence |
| --- | --- | --- |
| Unified `/move-plan` transaction | Fully represented | Spine AD-2; Solution §§4–6 and Phase 2 |
| Stateful bank, reserve, debt, cooldown, recovery | Fully represented | Spine AD-4; Solution §§7–8 |
| No universal 6.5 s ceiling | Fully represented | Spine AD-4; Solution §8.5 |
| Critical 10–40 s thoughts | Fully represented | Solution §§1, 8.5, 9.5, 20.3; includes 3+0 and 5+0 |
| Two-stage MultiPV and explainable continuous score | Fully represented | Spine AD-5/AD-6; Solution §6 |
| `decisionValue`, `forcedness`, `confidence` separated | Fully represented | Spine AD-5; response contract and Solution §6 |
| Bullet, Blitz, Rapid, with and without increment | Fully represented | Spine AD-13; Solution §§8, 9.5, 15.6 |
| Stateful session without durable-history dependency | Fully represented | Spine AD-10/AD-11; Solution §§7.1, 12 |
| Local-first now, replaceable cloud later | Fully represented | Spine AD-11/AD-12; Solution §§12, 16 Phase 6/9 |
| No customer history or personal data needed for correctness | Fully represented | Solution §§7.3, 12, 14.1, 20.5 |
| Highest-quality, convincing, non-robotic timing without intentional degradation | Strongly represented, but validation remains partly non-falsifiable | Solution §§3.4, 9, 13–15, 20.3; Finding 3 |
| Skill-aware timing tied to effective Elo | Partially represented | Spine AD-5; Solution §§6.5, 7; Finding 1 |
| Smooth Auto Adjust changes during a game | Not represented | Finding 1 |
| Puzzle excluded from competitive Smart Pacing | Not explicitly represented | Finding 4 |

## Required findings

### F1 — P1: Skill-awareness is underspecified and the approved Auto Adjust smoothing rule is absent

**Why this matters:** The approved behavior was more specific than “Elo affects entropy.” High Elo should recognize simple positions efficiently and respond sharply to genuine calculation value; intermediate Elo may spend longer on positions a GM resolves intuitively and may recognize some critical moments less precisely. Auto Adjust changes must be smoothed during the game so temporal personality does not jump abruptly.

**Current evidence:**

- Spine AD-5 says Elo changes “perception calibration,” but does not bind which signals or transitions are affected.
- Solution §6.5 defines only Elo-dependent softmax temperature for candidate entropy.
- `PacingSession.effectiveElo` exists in §7, but there is no source-of-truth rule, update reducer, smoothing function, hysteresis, rate limit, or cache invalidation behavior when Auto Adjust changes.
- Phase 3 says candidate entropy is relative to Elo, but no implementation task covers Elo transitions or skill-dependent familiarity/recognition.

**Failure allowed by the current documents:** An implementation can change `effectiveElo` instantly from 1800 to 3200, invalidate/rebucket plans abruptly, and affect only entropy while leaving familiarity, deliberation probability, confidence sensitivity, criticality recognition, and timing personality unchanged. It would technically satisfy several current statements while violating the approved experience.

**Required correction:** Add a binding rule and design section that define:

1. the authoritative raw Elo source and how Auto Adjust feeds it;
2. a session-level `perceivedElo` or smoothed effective Elo with bounded per-move change, hysteresis, and explicit reset conditions;
3. which perception components are Elo-dependent (at minimum candidate discrimination, familiarity/recognition, deliberation threshold, and uncertainty/criticality sensitivity), while keeping clock safety universal;
4. how cache keys avoid churn or mismatched evidence during a smoothed transition;
5. tests for fixed Elo and mid-game Auto Adjust ramps, including “no abrupt temporal personality jump.”

### F2 — P1: The model does not account for how much usable thinking time occurred during the opponent’s turn

**Why this matters:** A central human timing behavior is not merely whether the reply was predicted, but how long the player had to prepare it. If an opponent spends 30 seconds and plays the expected move, a strong player may answer almost immediately; if the same move arrives instantly, the player had far less off-clock computation. This is material to the user’s request for the most convincing possible timing.

**Current evidence:**

- Solution §3.5 correctly stores predicted replies and classifies exact/candidate/surprise.
- The section then explicitly says continuous opponent-turn analysis is unnecessary in v1.
- `PacingSession` in §7 records predicted replies, but has no opponent-turn start time, usable off-clock think duration, readiness/confidence accumulation, or decay.
- Preparation in §§7.4 and 9.4 is categorical and independent of the duration/quality of the preparation opportunity.

**Failure allowed by the current documents:** The same expected reply can receive the same near-premove timing whether the opponent moved in 100 ms or 40 seconds, producing visibly non-human sequences despite otherwise excellent position classification.

**Required correction:** Preserve the single-owner Komodo design, but add an `OpponentTurnOpportunity` signal to the browser session:

- monotonic opponent-turn elapsed time;
- predicted-reply coverage and readiness confidence;
- capped/decaying “off-clock preparation credit” conditioned on whether the actual reply matched a prediction;
- zero or minimal credit for instant opponent moves;
- cancellation on navigation/FEN/game changes;
- distribution and sequence tests contrasting instant, normal, and long opponent thinks.

Continuous engine analysis during the opponent’s turn can remain deferred; measuring the opportunity and conditioning preparation on it cannot if the target is definitive human-like timing.

### F3 — P1: The human-likeness gates are directionally strong but not yet falsifiable enough for a “done once” implementation

**Why this matters:** The documents correctly reject average delay as the KPI and demand distributions and full-game sequences. But several promotion gates still use undefined language: “within the target,” “proportional,” “approved,” “rare,” “controlled overlap,” and “manual review finds no mechanical clustering.” Without a predeclared scorecard, calibration can stop whenever a graph looks plausible, recreating the tuning loop the user wants to end.

**Current evidence:**

- Solution §9.5 calls timing ranges hypotheses, not literal acceptance criteria.
- §14.4 requires long-think frequency to stay “within the target,” but no target or method for deriving it is defined.
- §15.5 calls for controlled overlap and proportionality without metrics or tolerances.
- Phase 7 exits when a “distribution dashboard and sequence acceptance” are approved, without a required report schema or threshold authority.
- §20.3 is an excellent qualitative checklist but does not define a quantitative acceptance envelope.

**Required correction:** Add a versioned calibration scorecard whose exact numeric baselines may be learned from the approved/licensed corpus, but whose metrics and promotion rules are fixed before tuning. At minimum include:

- conditional quantile-distance/error by control, phase, Elo, class, clock bucket, and preparation state;
- long-think rate per game and inter-arrival/clustering limits;
- serial correlation/session-personality range;
- prepared-reply response delta conditioned on opponent-turn duration;
- cap-hit/spike rate and target-versus-actual error;
- flag/reserve/debt recovery bounds;
- held-out-game validation and regression budget against the previous promoted parameter set;
- minimum corpus coverage and confidence intervals;
- a generated, versioned calibration report that is the Phase 7 gate artifact.

The architecture is right to defer the final weights and quantiles. It should not defer the measurement contract used to decide whether those parameters are good.

### F4 — P2: The approved exclusion of Puzzle from competitive Smart Pacing is implicit, not contractual

**Why this matters:** The user approved Bullet + Blitz + Rapid with and without increment while explicitly keeping Puzzle outside the new competitive state model. The current documents repeatedly say “every clocked game” and focus tests on live controls, but never state what the Puzzle adapter must do or forbid. A future implementer could accidentally reuse the time-bank/session model for Puzzle or contaminate competitive telemetry/state.

**Current evidence:**

- Spine AD-4 applies to “every clocked game” but contains no Puzzle boundary.
- Solution coverage and sequence tests list Bullet, Blitz, Rapid, and increment controls.
- No explicit out-of-scope, separate-policy, state-isolation, or telemetry-isolation rule names Puzzle.

**Required correction:** Add an explicit scope invariant: competitive Smart Pacing V2 applies only to clocked live-game contexts; Puzzle uses a separate simple presentation policy (or immediate behavior according to its setting), never creates/reuses `PacingSession`, never contributes competitive calibration telemetry, and cannot influence live-game debt, personality, increment inference, or caches.

## Confirmed strengths that should not be weakened

1. **Long-think capability is real rather than cosmetic.** The design removes the absolute ceiling, gives 3+0 a plausible exceptional ~36-second spend, defines 15–40 seconds as the 3+0 long-think observation range, and allows larger ranges in longer controls. Debt, cooldown, reserve, and survival mode prevent this from becoming reckless.
2. **Complexity is based on value of further computation.** Deep regret, move/rank/evaluation instability, criticality, bounded entropy, surprise, familiarity, forcing, and confidence are correctly separated. This directly answers the weakness of the current best-vs-second-best bucket model.
3. **Commercialization concerns are handled at the correct boundary.** Correctness needs no durable history; state is per-game and reconstructible; storage and telemetry are ports; cloud is optional; customer identity, full PGN, and raw FEN are excluded by default; schemas, migration, export, and clear are planned.
4. **The design does not intentionally make timing worse.** Randomness is conditioned and seedable, cache cannot change target personality, technical latency is separated from human deliberation, prepared replies are supported, and calibration is distributional. AD-14 constrains supported integration environments, not the fidelity of the pacing algorithm.
5. **The implementation plan is comprehensive and sequenced safely.** It establishes hermetic engine tests, contracts, evidence, frontend functional core, scheduler integration, storage seams, shadow calibration, cutover, rollback, and commercial hardening with phase gates.

## Reconciliation conclusion

The documents already contain the hard architectural center of the user’s request and should remain the implementation foundation. Closing F1–F4 would make the package faithfully represent every approved decision and turn “human-like” from a strong design aspiration into an implementable, testable contract. Until then, implementation should not begin beyond contract/fake-engine scaffolding, because F1–F3 affect state shape, cache identity, telemetry, calibration fixtures, and acceptance gates.
