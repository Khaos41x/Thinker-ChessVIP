---
title: 'Recognize the Chess.com selected queue summary'
type: 'bugfix'
created: '2026-10-18'
status: 'done'
review_loop_iteration: 0
baseline_commit: '8e45e28aa63dc794809b01ee5c4a8c06eb757337'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-session-control-start-silent-failure.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Session Control now loads as `ACTIVE_DDA`, but START remains `IDLE` with `CONTEXT_UNIDENTIFIABLE`. Live evidence from `/play/online` shows that Chess.com renders the chosen queue as a collapsed visible control such as `10 min (Rapid)` inside `.board-layout-sidebar`, while exposing none of the active or selected attributes currently required by the adapter.

**Approach:** Accept one unique, compact queue-summary control containing both an explicit supported class name (`Bullet`, `Blitz`, or `Rapid`) and a recognizable clock expression. Merge this evidence with the existing active-element evidence and continue failing closed for absence, ambiguity, conflicts, unsupported classes, broad container text, and active-game pages without a queue target.

## Boundaries & Constraints

**Always:** Scope evidence to the already validated queue target root; require a visible-control-shaped element distinct from START; require one explicit live class plus a bounded clock label; preserve the exact `chesscom-live-<class>-v1` mapping; re-observe the same semantic class after the readiness request; keep all existing authorization, readiness, and queue ownership gates.

**Ask First:** Adding a manual pool selector, starting sessions from `/game/...`, accepting numeric-only inference, changing rating-scale mapping, or weakening calibration readiness.

**Never:** Infer from whole-sidebar text, opponent statistics, clocks on an active board, unselected preset lists, bare numbers, `Daily`, `Custom`, hidden controls, or multiple conflicting candidates.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Current Rapid summary | One local control reads `10 min (Rapid)` beside a valid Start Game target | Produce `chesscom-live-rapid-v1` context | Continue through readiness |
| Other named summaries | Unique `1 min (Bullet)` or `3 min (Blitz)` control | Produce the matching exact tuple | Continue through readiness |
| Existing active tab | One active element explicitly names a live class | Preserve current result | No regression |
| Ambiguous or weak evidence | Multiple classes, numeric-only text, whole-root match, custom/daily, or no queue target | Return no context | Visible `CONTEXT_UNIDENTIFIABLE` or `ACCOUNT_CONTEXT_UNAVAILABLE` |
| Selection changes during probe | Initial and post-readiness observations differ | Do not start or provision the changed tuple | Visible `CONTEXT_UNIDENTIFIABLE` |

</frozen-after-approval>

## Code Map

- `frontend/session_control/platform-chesscom.js` -- extracts exact queue scope from target-local DOM evidence.
- `tests/session_control/platform-chesscom.test.js` -- hermetic adapter evidence and ambiguity cases.
- `script.js` -- production integration and deterministic generated bundle.
- `scripts/build_userscript.py` -- regenerates the embedded Session Control modules.
- `tests/test_userscript_chrome.js` -- installed userscript smoke coverage.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/session_control/platform-chesscom.js` -- add bounded summary-control evidence and combine it with existing active evidence.
- [x] `tests/session_control/platform-chesscom.test.js` -- cover Rapid/Bullet/Blitz summaries and all fail-closed matrix branches.
- [x] `script.js` -- rebuild the generated region and retain production revalidation and feedback.
- [x] Session Control, backend, build, syntax, and Chrome smoke suites -- verify integration and deterministic output.

**Acceptance Criteria:**
- Given the observed Chess.com lobby with `10 min (Rapid)`, when START runs, then context resolution returns the exact Rapid tuple instead of `CONTEXT_UNIDENTIFIABLE`.
- Given weak, absent, hidden, unsupported, or conflicting evidence, when START runs, then no authorization or session commit occurs.
- Given a game URL without a queue target, when START runs, then it remains blocked with `ACCOUNT_CONTEXT_UNAVAILABLE`.

## Spec Change Log

- Final review: preserved summary ambiguity as a veto, restricted labels to canonical full-control forms, excluded hidden/disabled/START-overlapping controls, and added adversarial boundary coverage.

## Design Notes

The current screenshot is the golden production shape: `.board-layout-sidebar` contains a compact selectable summary labeled `10 min (Rapid)` and a separate `Start Game` control, but querying common selected-state attributes returns an empty list. The adapter may trust the summary only because the class name is explicit, the clock expression narrows it to a queue selector, and uniqueness is checked within the validated root.

## Verification

**Commands:**
- `node tests/session_control/run.js` -- all Module 14 adapter and integration tests pass.
- `python scripts/build_userscript.py && python scripts/build_userscript.py --check` -- generated region is current and deterministic.
- `node --check script.js` -- userscript parses.
- `python tests/test_session_control_phase3.py` -- readiness contract remains green.
- `node tests/test_userscript_chrome.js` -- production userscript smoke passes.

## Suggested Review Order

**Queue evidence**

- Start with the fail-closed merge of active and compact summary evidence.
  [`platform-chesscom.js:143`](../../frontend/session_control/platform-chesscom.js#L143)

- Parse only complete bounded Chess.com queue-summary labels.
  [`platform-chesscom.js:91`](../../frontend/session_control/platform-chesscom.js#L91)

- Reject hidden, disabled, duplicate, conflicting, or START-overlapping controls.
  [`platform-chesscom.js:105`](../../frontend/session_control/platform-chesscom.js#L105)

**Verification**

- Prove Rapid, Bullet, Blitz, ambiguity, visibility, and containment boundaries.
  [`platform-chesscom.test.js:27`](../../tests/session_control/platform-chesscom.test.js#L27)

- Confirm adversarial conflicts cannot be masked by existing active evidence.
  [`platform-chesscom.test.js:58`](../../tests/session_control/platform-chesscom.test.js#L58)
