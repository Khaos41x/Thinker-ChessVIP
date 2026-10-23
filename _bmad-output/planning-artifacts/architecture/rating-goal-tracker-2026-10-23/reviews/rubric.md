# Implementation-readiness rubric review

Scope: ENGINEERING-PLAN.md and ARCHITECTURE-SPINE.md only. No implementation inspected or changed.

Verdict: sound passive architecture; clarify the domain contracts below before treating the plan as implementation-ready.

## Actionable findings

1. **P1 — Define baseline eligibility by receipt versus effective time.** Plan section 7 requires the first eligible observation “at or after goal creation,” while section 5 permits old but valid as-of stats and section 7 promises immediate completion for an already-satisfied target. An inactive account can otherwise wait indefinitely for another rated game. Specify whether an existing confirmed snapshot, or a post-creation revalidation of old effective evidence, establishes the baseline. Define `achievedAtMs` for a target already satisfied before creation; it must not imply that a new goal was achieved before it existed. Add inactive-account and repeated-304 creation fixtures, including an already-satisfied downward target.

2. **P1 — Make conflict equivalence and exit deterministic.** Section 5 uses “same-period,” “comparable,” and “demonstrably older” without defining their boundaries, despite the observed archive/stats one-second mismatch. Specify how stats with no game key map to an archive event, how unknown/tied effective times behave, whether provisional DOM disagreement can block otherwise verified API completion, and what exact new evidence resolves a conflict. Add table-driven cases and all arrival permutations for equal timestamps, a one-second offset, delayed corrections, and a permanently stale DOM candidate.

3. **P2 — Specify monitoring and goal lifecycle transitions.** Sections 6/9/10 refer to an enabled goal, separate monitoring opt-in, visibility, pause, archive, and opt-out, but the contracts/routes do not define the persisted monitoring control or resume behavior. Add a transition table covering pause/resume, threshold revision, reached goals, no active goals, monitoring disabled during an in-flight request, and restart. State which actions cancel jobs, discard late responses, preserve the baseline, and permit future alerts. Verify that hiding the card or Clean View does not disable monitoring.

4. **P2 — Define atomic promotion of unresolved identity/game keys.** Identity and game namespace conservatism are appropriate, but storage uniqueness alone does not describe promotion from a username key to verified player ID, or `unknown:{id}` to `live:{id}` when the canonical record already exists. Specify the evidence required and transaction that rekeys observations, backlog, goals, jobs, and notification references without duplicating history. Test two tabs discovering different aliases before archive/profile confirmation, plus username reuse by another stable ID.

5. **P2 — Complete the multi-tab notification delivery contract.** Section 8 requires a delivery claim, but section 4 lists only acknowledgment. Specify whether snapshot polling performs a claim or add an explicit claim operation, including owner, lease expiry, crash recovery, and revision semantics. Add a deterministic two-consumer fixture proving one logical inbox event, safe reclaim after a crash, and idempotent acknowledgment. The documented at-least-once visual-delivery limit should remain explicit.

## Coverage assessment

| Area | Assessment |
| --- | --- |
| Passive isolation | Strong: explicit zero engine/move/queue effects and independent lifecycle observation. |
| Identity/category separation | Strong invariants; unresolved-key promotion needs a concrete transaction contract. |
| Stale/conflicting API/DOM | Strong chronology/freshness separation; comparison and conflict-exit rules need precision. |
| Postgame dedupe/delays | Strong bounded retries, namespace preservation, restart backlog, 304 handling, and no publication SLA. |
| Goals | Formulas and historical completion are clear; baseline and lifecycle eligibility need decisions. |
| Persistence | Strong separate authority, CAS, atomic outbox, retention references, and single-process restriction. |
| Compact UI | Adequate states, accessibility, Clean View behavior, and concrete widths; preserve these gates. |
| Deterministic testing | Good injected clock/HTTP and permutation strategy; add the exact transition fixtures above so correctness is executable rather than inferred. |

Authenticated selector/hidden-rating smoke, Tampermonkey transport/origin verification, archive bounds, and payload measurement are already declared release gates. Keep them as explicit unverified prerequisites; this review does not establish them.
