---
title: 'Module 14 Session Control — Phase 0/1'
type: 'feature'
created: '2026-10-13'
status: 'draft'
review_loop_iteration: 0
context:
  - '_bmad-output/planning-artifacts/architecture/module-14-session-dda-2026-10-13/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/architecture/module-14-session-dda-2026-10-13/ENGINEERING-PLAN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The userscript has in-memory Auto Queue/Auto Move state and a five-game rating heuristic, so reloads, sleeping tabs, and multiple tabs can lose session state or perform duplicate effects. Module 14 needs a deterministic, durable foundation before it may control any browser action.

**Approach:** Implement Phase 0 contracts and pure session/DDA reducer, then Phase 1 IndexedDB authority, GM recovery/configuration port, Web Locks leadership, fencing, and deterministic userscript assembly. Keep the implementation hermetic and side-effect free until later integration phases.

## Boundaries & Constraints

**Always:** Use strict schema-versioned DTOs with unknown-field rejection; persist absolute TTL plus a monotonic wall-clock floor; use true two-threshold hysteresis (BOOST changes to CORRECT only above the upper bound, CORRECT returns only below the lower bound); keep observed and controller-eligible results separate; make event replay deterministic and results idempotent; make IndexedDB the transactional authority; treat BroadcastChannel as notification only; require Web Locks and a current fencing token before irreversible effects; fail closed on missing capability, corrupt state, or failed durable writes; keep the functional core ignorant of platform, pool, rated, and live-game labels; keep platform context/pool literals and semantic inspection out of the evaluator; evaluate versioned GM allowlists through normalized exact `Array.includes`-equivalent membership only, where an exact string match permits operation regardless of whether the observed environment is public, private, or rated; preserve current `script.js` behavior outside one generated region; keep live activation disabled in this phase.

**Ask First:** Any schema migration beyond v1; any dependency or package-manager introduction; any change to the ratified estimator, hysteresis, TTL/drain semantics, or authorization-port contract; any wiring into current Auto Queue, Auto Move, result detection, `/move-plan`, or live browser play.

**Never:** Reuse the current localStorage memory fallback as authority; silently fall back to memory; hardcode platform context/pool literals in the core or policy evaluator; accept wildcard, regex, empty, or pattern-based authorization entries; let the core self-authorize; infer success after an ambiguous effect; replay a stale leader's effect; count duplicate/unknown/aborted outcomes; mutate target Elo during a game; send UCI parameters from the client; modify legacy AutoAdjust ownership or DOM automation in Phase 0/1.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Deterministic replay | Same validated config and ordered events | Byte-equivalent canonical snapshot | Reject invalid sequence/revision |
| Hysteresis | Posterior inside configured band | Retain prior BOOST/CORRECT mode | Equal boundaries do not transition |
| Duplicate result | Same session/game result twice | Counts change once | Return typed idempotent outcome |
| TTL after sleep | Effective time reaches deadline while queueing | Enter completed/draining; never queue again | Wall-clock rollback uses persisted floor |
| Atomic commit | Event, snapshot, and metadata update | All commit in one transaction | Abort leaves all prior values unchanged |
| Two-tab contention | Two owners request leadership/effect | Exactly one current fence may commit | Stale/missing fence is rejected |
| Corrupt recovery | Snapshot checksum or journal disagrees | No automation capability is returned | Typed paused/corrupt result, no memory fallback |
| Missing browser APIs | IndexedDB, Web Locks, crypto, or GM unavailable | Start is refused | Stable unsupported-capability code |
| Environment decision | Core receives opaque context plus authorization decision | Reducer behaves identically for equal decisions | Missing/denied decision cannot start a session |
| External policy | Explicit account/context/pool exact-match entries | Evaluator returns a typed allow/deny decision without interpreting tokens or `rated`; an exact match allows operation in any environment (public, private, or rated) | Empty, wildcard, regex, or unknown tokens deny |

</frozen-after-approval>

## Code Map

- `frontend/session_control/` -- new CommonJS source modules for contracts, math, reducer, repository, leadership, ports, and test fakes.
- `scripts/build_userscript.py` -- dependency-free deterministic assembler for one marked `script.js` region.
- `script.js` -- installable userscript; receives a frozen, zero-startup-side-effect namespace only.
- `tests/session_control/` -- direct Node hermetic contract and multi-tab simulations.
- `tests/test_userscript_chrome.js` -- existing raw-CDP harness for real IndexedDB/Web Locks smoke coverage.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/session_control/models.js`, `statistics.js`, `clock.js`, `reducer.js` -- implement strict DTOs, canonical serialization, TTL lifecycle, Beta/Wilson statistics, ratified hysteresis, and idempotent event reduction.
- [ ] `frontend/session_control/repository.js`, `leader.js`, `ports.js` -- implement v1 IndexedDB atomic persistence, GM mirror/config adapter, data-driven exact-match authorization port with no platform literals, capability preflight, Web Locks leadership, leases, and fencing.
- [ ] `frontend/session_control/testing.js`, `index.js` -- expose a stable public module surface and deterministic fakes only for tests.
- [ ] `scripts/build_userscript.py`, `script.js` -- generate exactly one bounded module region without runtime activation or unrelated changes.
- [ ] `tests/session_control/`, `tests/test_userscript_chrome.js` -- cover the matrix, transaction rollback, recovery, and two-context serialization.

**Acceptance Criteria:**
- Given identical validated inputs, replay produces byte-identical state with no negative or duplicate counts.
- Given competing tabs, only the latest valid fencing token can commit an effect; renewal retains and takeover increments the token.
- Given reload, sleep, clock rollback, or partial storage failure, TTL and durable ownership cannot move backward or enable an unsafe action.
- Given two opaque environments with the same authorization decision, the functional core produces identical state and contains no Chess.com pool constants.
- Given a versioned external policy, the evaluator allows only explicit normalized account/context/pool matches and never interprets token meaning or the `rated` field; an exact match permits activation in any environment, public, private, or rated.
- Given two consecutive builds, generated `script.js` bytes are identical and all text outside the marked region is unchanged.
- Existing Smart Pacing and userscript tests remain green; Module 14 performs no live queue, move, or network action.

## Design Notes

Production adapters never substitute test fakes. The reducer receives timestamps and dependencies explicitly. The IndexedDB transaction compare-and-swaps `expectedRevision`, inserts an immutable event, replaces the checksummed snapshot, and updates current-session metadata together. The exclusive origin-scoped Web Lock covers lease validation and the final fence check immediately before an effect callback.

## Verification

**Commands:**
- `node tests/session_control/run.js` -- all Phase 0/1 contract tests pass.
- `node tests/test_smart_pacer_sequences.js` -- existing Smart Pacing remains green.
- `node tests/test_userscript_chrome.js` -- real browser storage/lock smoke passes when Chrome is available.
- `python scripts/build_userscript.py --check` -- generated region is current and deterministic.
- `git diff --check` -- no whitespace or encoding errors.

## Spec Change Log

