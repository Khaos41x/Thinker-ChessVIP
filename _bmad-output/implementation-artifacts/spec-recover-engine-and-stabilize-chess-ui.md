---
title: 'Recover engine crashes and stabilize the Chess UI'
type: 'bugfix'
created: '2026-09-21'
status: 'done'
baseline_commit: 'f3d2c833fc8a7ff9dc093a4a463863fe256dee1c'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="User explicitly requested all corrections in the same release">

## Intent

**Problem:** A Komodo process crash leaves the server's engine object dead, so later `/getmove` calls fail indefinitely. The configuration switches sometimes require repeated clicks, the panels sit too close to Chess.com's left navigation, and Scout figures need a strict, auditable PubAPI provenance.

**Approach:** Validate positions before native-engine use, recover and retry a failed engine instance safely, make switch interactions immediate and resilient to configuration polling, shift the paired panels toward the board, and ensure Scout displays only metrics directly derived from the current month's published games.

## Boundaries & Constraints

**Always:** Preserve the current engine protocol and JSON response shape; a native crash must not poison later valid requests. Keep Scout requests exclusive to Chess.com's PubAPI in production, silently hide the HUD on missing/invalid data, and retain its short validated cache. Keep existing switch semantics and persisted configuration keys. Preserve existing user changes and do not write production mock data.

**Ask First:** Any change requiring a different engine binary, paid API, new credentials, or moving panels outside Chess.com's game column.

**Never:** Claim that a server-process recovery prevents all future native crashes or that PubAPI data includes unpublished/current games. Never fabricate a move, rating, opening, result, or percentage.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Engine crash | Valid FEN, native child exits during request | Replace engine and retry once; future requests remain usable | Return `[]` if recovery fails; log one actionable server error |
| Invalid position | Malformed or illegal FEN during board transition | Never submit it to Komodo | Return `[]` without damaging engine |
| Config click | Any switch, server poll racing with save | Single click changes state and remains changed | Ignore stale responses; retry or reconcile save safely |
| Scout | Current-month PubAPI games for current username | Show counts and percentages calculated from actual records only | Hide on fetch failure/guest/empty sample; invalidate bad cache |
| Layout | Standard or narrow game page | Both panels move right together without overlaying the board | Constrain offset to available width |

</frozen-after-approval>

## Code Map

- `app.py` -- engine startup, `/getmove`, `/eval`, and config persistence.
- `script.js` -- panel switches, configuration synchronization, Scout calculations, and panel placement.
- `tests/test_server.py` -- backend HTTP regression checks.
- `tests/test_scout_logic.js` -- Scout and UI helper regression checks.

## Tasks & Acceptance

**Execution:**
- [x] `app.py` -- isolate engine lifecycle, validate positions, and recover dead child processes with bounded retry.
- [x] `script.js` -- make switches one-click reliable, guard local changes against stale polls, align panels farther right, and audit Scout derivations and labels.
- [x] `tests/test_engine_recovery.py`, `tests/test_scout_logic.js` -- cover crash recovery, invalid FEN, switch behavior, layout, and PubAPI-only metrics.

**Acceptance Criteria:**
- Given a crashed Komodo child, when another valid move is requested, then the server can start a replacement and return a legal move or a bounded failure without remaining poisoned.
- Given one click on any configuration switch, when the subsequent poll completes, then the visual and persisted state agree with that click.
- Given a PubAPI game array, when Scout renders, then every displayed count and percentage reconciles with games belonging to the selected username and month.
- Given the board layout, when the panels render, then the paired panels begin visibly farther right and stay within the game workspace.

## Spec Change Log

## Design Notes

Native exit code 3221225477 indicates a child-process failure, not a Python exception that can be reused. Recovery must replace the `SimpleEngine` object and serialize concurrent access. Existing book/cache shortcuts should only run after position validation, so malformed transition FENs cannot yield cached nonsense.

## Verification

**Commands:**
- `python tests/test_server.py` -- backend regressions pass.
- `node tests/test_scout_logic.js` -- Scout/UI regressions pass.
- `node --check script.js` -- userscript parses.
- `python -m py_compile app.py` -- backend parses.

## Suggested Review Order

**Engine recovery**

- Reject invalid boards, validate cache and book moves, then request a bounded retry.
  [app.py:771](../../app.py#L771)

- Replace dead Komodo children without retaining poisoned engine objects.
  [app.py:442](../../app.py#L442)

- Serialize move and evaluation requests around pondering transitions.
  [app.py:270](../../app.py#L270)

**Panel reliability**

- Treat the full visual switch as one click target.
  [script.js:3156](../../script.js#L3156)

- Queue configuration saves and ignore stale polling responses.
  [script.js:3260](../../script.js#L3260)

- Place the two cards farther right while limiting offset on narrow boards.
  [script.js:897](../../script.js#L897)

**Scout provenance**

- Only accept published Chess.com opening labels and in-month games.
  [script.js:580](../../script.js#L580)

- Refresh expired or previous-month entries even when opponent stays unchanged.
  [script.js:1315](../../script.js#L1315)

**Regressions**

- Exercise crash, malformed position, overlapping requests, and evaluation recovery.
  [test_engine_recovery.py:15](../../tests/test_engine_recovery.py#L15)

- Check one-click switch logic, stale polls, and Scout sample provenance.
  [test_scout_logic.js:5](../../tests/test_scout_logic.js#L5)
