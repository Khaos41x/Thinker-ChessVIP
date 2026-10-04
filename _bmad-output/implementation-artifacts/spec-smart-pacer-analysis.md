---
title: 'Deterministic Smart Pacer Analysis'
type: 'feature'
created: '2026-10-03'
status: 'done'
baseline_commit: '140a2e79f7b449fc0ddec0780d526bcdbe8b80a5'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current server owns two high-memory Komodo processes and the browser pacing logic cannot safely parse sub-ten-second clock strings. There is no opt-in endpoint that returns a deterministic MultiPV complexity classification.

**Approach:** Consolidate UCI ownership behind one serialized singleton, add deterministic depth-10 analysis and a standalone SmartPacer, while preserving the public `/getmove` and `/eval` response contracts.

## Boundaries & Constraints

**Always:** Use one Komodo process with Threads=1 and Hash=128; serialize engine access; preserve move cache, opening book, recovery, `/getmove`, and `/eval`; treat numeric JS times as milliseconds and clock strings as seconds.

**Ask First:** Any change to endpoint response shapes, engine binary, or opening-book behavior.

**Never:** Commit `users.db`, the Komodo binary, or secrets; kill processes by name alone; claim the 250 MB budget without measuring aggregate RSS during a real analysis.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Numeric clock text | `"9.8"` | `9800` ms | Reject malformed text |
| Forced legal move | one legal move | multiplier `0.15`, forced `true` | No engine call |
| Obvious best move | `+200` vs `-Mate(2)` | multiplier `0.3`, forced `false` | Mate maps to 100000 cp |
| Invalid position | invalid FEN | structured 4xx response | Engine is not called |
| Engine crash | first UCI attempt fails | restart once and retry | Return existing safe fallback contract |

</frozen-after-approval>

## Code Map

- `requirements.txt` -- runtime dependencies including psutil.
- `app.py` -- Komodo lifecycle, analysis helpers, and Flask endpoints.
- `script.js` -- userscript and SmartPacer implementation.
- `tests/test_smart_pacer_backend.py` -- backend unit and endpoint contracts.
- `tests/test_smart_pacer.js` -- JavaScript parsing and pacing tests.
- `tests/test_engine_recovery.py` -- existing engine recovery regression suite.

## Tasks & Acceptance

**Execution:**
- [x] `requirements.txt` -- declare psutil.
- [x] `app.py` -- replace dual-engine/continuous ponder lifecycle with a single locked service, scoped orphan cleanup, deterministic analysis, and `/analyze`.
- [x] `script.js` -- add SmartPacer with corrected clock parsing, bounded Gaussian jitter, cancellation, and scheduling.
- [x] `tests/test_smart_pacer_backend.py` -- cover thresholds, mate edge case, forced moves, and endpoint behavior.
- [x] `tests/test_smart_pacer.js` -- cover clock formats, emergency pacing, and bounded jitter.
- [x] Run new tests, existing engine recovery tests, real endpoint checks, and aggregate RSS measurement.

**Acceptance Criteria:**
- Given a running server, when `/getmove` or `/eval` is called, then its existing success and fallback JSON shape remains unchanged.
- Given a valid non-terminal FEN, when `/analyze` completes, then it returns `move`, `complexityMultiplier`, and `isForced` from depth-10 MultiPV analysis.
- Given one real `/analyze` request, when aggregate Python and Komodo RSS is measured, then the observed result is reported against the 250 MB budget without extrapolation.

## Design Notes

The singleton is per Python process, so production must use one Waitress process with threads. Orphan cleanup matches the exact configured executable and current user, and skips a Komodo process whose Python parent is alive. Clearing the engine hash before MultiPV analysis reduces history-dependent evaluation drift but does not promise identical tie-breaking across different Komodo builds.

## Verification

**Commands:**
- `python tests/test_smart_pacer_backend.py` -- all backend tests pass.
- `node tests/test_smart_pacer.js` -- all frontend tests pass.
- `python tests/test_engine_recovery.py` -- recovery and endpoint regressions pass.
- Real local `/analyze`, `/getmove`, and `/eval` calls -- contracts hold and aggregate RSS is captured.

## Suggested Review Order

**Engine ownership and analysis contract**

- Start with the single-process lifecycle, recovery, and bounded UCI configuration.
  [`app.py:318`](../../app.py#L318)

- Review deterministic score classification and mate normalization.
  [`app.py:506`](../../app.py#L506)

- Inspect the opt-in HTTP entry point and validation boundaries.
  [`app.py:946`](../../app.py#L946)

**Frontend pacing primitive**

- Review explicit clock units, Gaussian bounds, cancellation, and scheduling.
  [`script.js:1613`](../../script.js#L1613)

**Verification and dependencies**

- Confirm threshold and endpoint contract coverage.
  [`test_smart_pacer_backend.py:21`](../../tests/test_smart_pacer_backend.py#L21)

- Confirm parsing, jitter, and cancellation behavior.
  [`test_smart_pacer.js:22`](../../tests/test_smart_pacer.js#L22)

- Inspect real Komodo endpoint and peak-RSS measurement.
  [`test_live_analysis.py:19`](../../tests/test_live_analysis.py#L19)

- Review singleton recovery regression coverage.
  [`test_engine_recovery.py:15`](../../tests/test_engine_recovery.py#L15)

- Confirm the new process-management dependency.
  [`requirements.txt:5`](../../requirements.txt#L5)
