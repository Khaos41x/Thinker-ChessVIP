# Reviewer Gate — Good-Spine Rubric

**Deliverable reviewed:** `ARCHITECTURE-SPINE.md`  
**Lens:** complete good-spine checklist from `reviewer-gate.md`  
**Date:** 2026-10-09  
**Verdict:** **CONDITIONAL PASS — strong feature architecture, but not yet safe to freeze as the substrate.** The spine captures most real divergence points and the companion design supplies substantial implementation detail, yet six high-severity gaps still allow materially different or unsafe implementations.

## Deterministic and evidence checks

- `python .agents/skills/bmad-architecture/scripts/lint_spine.py --workspace ...` passed with `0` findings. The prescribed `uv run` form could not use its sandboxed cache, so the same repository script was executed directly with Python 3.12.7.
- Locally verified: Python 3.12.7, Node.js 22.23.2, Flask 3.1.3, Flask-SocketIO 5.6.1, flask-cors 6.0.2, `chess` 1.11.2, psutil 7.2.2, and presence of `engine/komodo-14.1-64bit.exe`.
- Komodo behavior required by AD-2/AD-9 — MultiPV reuse, streaming stop, bounded lock release, Skill/Elo interaction and recovery — is **not yet verified**. The companion correctly schedules a Phase 0 spike, but the spine currently presents the dependent rules as fully adopted without recording the conditional mechanism or mandatory fallback.
- Brownfield evidence confirms the current Flask service binds loopback, but exposes permissive CORS/Socket.IO origins and serializes engine access; therefore AD-9 and AD-16 are necessary rather than speculative.

## Critical findings

None. No single omission makes the entire architecture invalid, provided the high findings below are resolved before DTO/cache freeze or implementation cutover.

## High findings

### H1 — Clock inference has two owners in the same spine

**Checklist clauses:** enforceable Rules; prevents stated divergence; internal consistency.  
**Evidence:** AD-7 says “Only the session reducer owns inference windows and estimates.” The Structural Seed describes `clock-context.js` as “snapshot and inference”, while the Capability Map assigns “Clock and increment inference” to `clock-context.js`.  
**Impact:** two teams can produce mutually incompatible but text-compliant implementations: one mutates increment/history inside the adapter, another inside the reducer. This also breaks deterministic replay because adapter-local windows are not reducer state.  
**Disposition:** **autofix.** Make `clock-context.js` an observation producer only; assign inference to `session.js` (or a pure estimator called exclusively by its reducer), and update the capability map accordingly.

### H2 — Position identity is re-overloaded by the contract convention

**Checklist clauses:** real divergence points; enforceable Rules; dimensions cannot contradict.  
**Evidence:** AD-15 explicitly requires `observationKey`, `analysisPositionKey`, and optional `historyDigest`, but the Contracts convention requires an undefined generic `positionKey`.  
**Impact:** an implementer can reintroduce precisely the overloaded key AD-15 forbids, causing cache/context aliasing or stale execution.  
**Disposition:** **autofix.** Remove `positionKey` from the convention and require the appropriate explicit identity field(s) by message type. State that no generic alias is legal.

### H3 — The central safe-spend boundary is described, not normatively closed

**Checklist clauses:** fixes real divergence points; Rule is enforceable and prevents its stated failure.  
**Evidence:** AD-4 requires a reserve and forbids a universal delay ceiling; AD-6 merely says “safe clock budget”; AD-9 protects the analysis budget. No spine rule says the complete target/execution time must be bounded by a derived maximum that leaves the conservative reserve intact, or what exact safety posture applies when clock confidence is low.  
**Impact:** implementations can all claim “dynamic cap” while choosing incompatible formulas, and one can legally schedule a 40-second think that consumes the reserve. Protecting analysis alone does not protect the post-analysis wait.  
**Disposition:** **autofix.** Add a cross-cutting invariant such as `targetTotalMs <= derivedSafeSpendMs <= max(0, observedOwnClockMs - conservativeReserveMs - executionMarginMs)`, with survival/degraded behavior when that bound cannot be established. Numerical coefficients may remain calibration inputs; the inequality and low-confidence posture cannot.

### H4 — Adopted engine semantics depend on unverified capabilities and leave two-lens arbitration open

**Checklist clauses:** named tech verified-current; dangerous deferred decision; Rule prevents stated divergence.  
**Evidence:** AD-2 promises an atomic two-lens plan and says it prevents duplicated work, while AD-9 requires cooperative stop/obsolescence. The Komodo binary exists, but those capabilities are explicitly deferred to a Phase 0 spike in the companion. The spine does not bind stage ordering, budget arbitration, consistent partial publication, or a mandatory fallback when streaming stop/reuse is unavailable. Two lenses may in fact duplicate work.  
**Impact:** one implementation may spend the deadline on reference analysis and return no selected move; another may select first and omit usable evidence; a third may leave an uninterruptible call holding the only engine lock. All appear compatible with the current Rule.  
**Disposition:** **discuss, then autofix.** Ratify the invariant independent of Komodo mechanics: one deadline and generation, deterministic stage priority, only internally consistent snapshots publish, every response has a legal selected move or typed no-plan outcome, obsolete work cannot block the next accepted revision beyond a defined tier SLO, and worker/process isolation is the mandatory fallback if cooperative stop cannot be proven. Change the claimed prevention from “duplicated engine work” to “uncoordinated/contradictory engine work” unless reuse is proven.

### H5 — The current operational envelope is a silent dimension

**Checklist clauses:** operational/environmental envelope; deployment/environments; operations; infra strategy.  
**Evidence:** AD-16 names a per-install/session capability, allowlist and limits, but does not decide token bootstrap/provisioning/rotation between Tampermonkey and Flask. The spine also omits supported local deployment topology, server/engine readiness and restart ownership, version handshake policy, log/health expectations, and numerical SLO ownership. Commercial cloud concerns are deferred, but the current local runtime is not.  
**Impact:** AD-16 is not implementable as written without inventing a trust bootstrap; releases can pair incompatible userscript/server contracts; readiness/cold-engine failure and concurrency recovery can differ across environments.  
**Disposition:** **discuss.** Add a minimal “local operational envelope” AD or explicit open items with owners and freeze gates: dev/test/release topology, capability bootstrap threat model, client/server compatibility handshake, health/readiness and engine restart policy, and who defines/approves tier SLOs before shadow. Cloud provider/auth/billing can remain deferred.

### H6 — A listed source imposes a conflicting brownfield invariant without explicit supersession

**Checklist clauses:** ratifies brownfield; covers source spec capabilities; no contradictory inherited direction.  
**Evidence:** the listed implementation spec says “Always preserve ... cached/fresh `/getmove` branches ... and backend response contracts.” AD-2 says legacy `/getmove` and `/analyze` never participate in the new path, and the companion later removes `/analyze` from the frontend while retaining `/getmove` only for documented compatibility.  
**Impact:** downstream work cannot know whether changing the frontend contract is an architecture-approved supersession or a violation of an “Always” requirement.  
**Disposition:** **autofix.** Add a short supersession/migration note: the old execution guards, MAX semantics, book/engine capabilities and external compatibility remain binding, while the old split Smart Pacing request path is deliberately superseded for V2 under a feature flag and rollback window.

## Medium findings

### M1 — The mandatory PlatformAdapter is absent from the Structural Seed

AD-14 makes platform isolation architectural, yet no `platform-adapter.js`/interface or composition-root location appears in the seed. Add the port and the composition point; otherwise DOM calls can leak into `clock-context.js` or the scheduler. **Disposition: autofix.**

### M2 — Status metadata is inconsistent across adopted decisions

AD-12 through AD-14 omit `[ADOPTED]`, while neighboring decisions carry it. This does not break lint but makes decision maturity ambiguous, especially because AD-14 includes a product authorization boundary. Normalize status labels or remove them uniformly. **Disposition: autofix.**

### M3 — Build ownership is deferred while the seed already assumes multi-file frontend sources

The current brownfield artifact is a monolithic userscript. “Choose bundler later” is safe only if the spine also fixes source-of-truth and generation invariants: generated `script.js` must not become a second editable source, generation must be reproducible, and the feature flag/rollback must work before the split. **Disposition: move this invariant into the Rule/Deferred item; tooling choice may remain deferred.**

### M4 — Calibration corpus governance is present in the companion but absent from the spine

AD-17 makes a release artifact mandatory, but the spine does not require provenance/license, train/held-out separation, or immutable corpus/report linkage. Without it, two implementations can report comparable-looking scorecards from non-comparable data. **Disposition: autofix AD-17 with corpus digest/provenance and leakage-free split; exact sample sizes remain pre-shadow configuration.**

## Low findings

### L1 — `confidence` has multiple semantic scopes without a naming rule

The book path can have high provenance confidence and low analysis confidence, while AD-5 exposes a single `confidence`. Require scoped fields or a convention (`evidenceConfidence`, `analysisConfidence`, `clockConfidence`) to avoid consumers treating source certainty as complexity certainty. **Disposition: autofix convention.**

### L2 — `cache` appears in Binds/Prevents but not in frontmatter `binds`

AD-12 and AD-15 bind cache, but the frontmatter omits it. Add `cache` for discoverability. **Disposition: autofix.**

## Checklist walk

| Good-spine criterion | Result | Notes |
| --- | --- | --- |
| Fixes real divergence points for the level below | Conditional pass | Strong coverage of transaction, evidence, clock state, scheduling, persistence and calibration; H3–H5 remain material. |
| Every AD Rule is enforceable and prevents its stated divergence | Conditional pass | AD-4/AD-6 lack a closed safety inequality; AD-2 overclaims duplicate-work prevention; AD-16 lacks bootstrap. |
| Deferred contains no decision that permits divergence | Conditional pass | Tool choice is fine; unverified engine mechanics and frontend build source-of-truth need explicit invariants. |
| Named technology verified current | Conditional pass | Package/runtime versions verified locally; Komodo’s required runtime capabilities are not yet proven. |
| Ratifies rather than contradicts brownfield | Conditional pass | Most guards and MAX behavior are preserved, but the listed old spec conflicts with V2 endpoint migration until supersession is explicit. |
| Covers driving spec capabilities | Conditional pass | Timing/clock/forced/missing-signal capabilities are covered; old split-route preservation needs explicit replacement semantics. |
| Does not weaken inherited parent spine | Not applicable | No parent spine is declared. |
| Every owned dimension decided, deferred, or open | Conditional pass | Current local operational envelope, trust bootstrap and SLO ownership are silent. |

## Recommended gate action

Apply H1, H2, H3, H6, M1, M2, M4, L1 and L2 directly. Resolve H4 and H5 with explicit architecture language before marking the spine `final`; neither should wait until DTO/cache freeze. After edits, rerun lint and one short consistency pass across Structural Seed, Capability Map and Deferred.

## Recheck

**Date:** 2026-10-10  
**Verdict:** **PASS — all six previously high-severity findings are closed; no high finding remains open.**  
**Mechanical check:** the repository linter passes again with zero findings.

| Prior finding | Result | Verification |
| --- | --- | --- |
| H1 — clock inference ownership | Closed | AD-7 retains reducer-only ownership; Structural Seed now makes `clock-context.js` an immutable-observation producer, `session.js` owns inference, and the Capability Map separates observation from inference. |
| H2 — generic `positionKey` | Closed | The Contracts convention now requires `observationKey` and `analysisPositionKey`; no generic `positionKey` remains. AD-15 supplies exact formulas and distinct cache dimensions. |
| H3 — safe-spend boundary | Closed | AD-20 adds the normative inequality `targetTotalMs <= max(0, userRemainingAtObservationMs - reserveMs - executionMarginMs)` and applies the same bound to preflight. Version incompatibility/restart fail closed into conservative behavior. |
| H4 — two-lens arbitration and cancellation fallback | Closed | AD-2 fixes engine-stage order and typed selector/deep fallbacks. AD-9 fixes admission-before-lock, absolute deadline checks, a 250 ms cancellation grace and force-restart/generation invalidation. AD-19 makes one coordinator own every engine job and blocks side-route lock bypass. |
| H5 — operational envelope | Closed | AD-16 defines secret generation, one-time pairing, storage boundary and route protection. AD-20 defines immutable release manifests, schema compatibility, health/readiness/generation, degraded restart behavior, SLO ownership/approval and rollback triggers. |
| H6 — conflicting old spec | Closed | Frontmatter now explicitly declares the old implementation spec under `supersedes`; AD-8 preserves its execution guards and MAX behavior, while AD-2 deliberately replaces only the split Smart Pacing request path. |

The earlier medium/low editorial and governance recommendations remain recorded above, but none invalidates the architecture gate or reopens a high-severity divergence point.
