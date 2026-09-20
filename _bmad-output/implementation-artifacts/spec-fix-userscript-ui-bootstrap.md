---
title: 'Restore userscript UI bootstrap on Chess.com'
type: 'bugfix'
created: '2026-09-20'
status: 'done'
review_loop_iteration: 0
baseline_commit: '8a18ac0f162717b52b44d5694043a9f7f41f4920'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After the banner update, the active Tampermonkey script no longer shows either the Thinker Chess configuration panel or the banner. Both surfaces share the same late, jQuery-dependent mounting path, and the new embedded PNG expands one executable HTML line to roughly 1.6 million characters, so a failure before or during that path leaves the entire UI absent without a visible diagnostic.

**Approach:** Make UI bootstrap idempotent and resilient to Chess.com's SPA lifecycle, separate shell mounting from Scout/config polling, and replace the oversized inline PNG payload with a visually equivalent optimized embedded asset. Preserve silent operation while adding deterministic regression coverage for initial load, delayed board creation, route replacement, banner layout, and Ghost Mode.

## Boundaries & Constraints

**Always:** Mount the configuration panel whenever a supported Chess.com board container exists; mount and position the banner independently of Scout/API success; remount either surface if Chess.com replaces its host nodes; keep the userscript self-contained; preserve `DEBUG = false`, Auto Queue, engine behavior, PubAPI Scout behavior, server synchronization, and the supplied banner appearance.

**Ask First:** Requiring a hosted image/resource, changing the server API, removing Ghost Mode, or redesigning existing controls.

**Never:** Require DevTools or user DOM inspection; rely on one one-shot interval that permanently stops after first mount; expose startup failures as console spam; allow duplicate panels, banners, observers, or event handlers; modify unrelated workspace files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Normal lobby/game | Current `#board-layout-main` and sidebar exist | One configuration panel and one aligned banner appear | Silent idempotent reconciliation |
| Delayed SPA render | Script starts before board/sidebar | Bootstrap watches until hosts appear | No permanent timeout or duplicate observer |
| React route replacement | Chess.com removes/recreates layout nodes | Detached UI is remounted and banner geometry recalculated | Stale nodes and listeners are discarded |
| Large embedded artwork | Supplied PNG is the visual source | Optimized embedded payload keeps equivalent crop and proportions | No external URL dependency |
| Ghost Mode enabled | Server reports `ghostMode: true` | Gameplay overlays/banner stay hidden according to current behavior | Configuration recovery remains possible without reinstalling |
| jQuery/host race | Ready event or host arrives out of order | Native bootstrap still reaches panel creation once dependencies exist | Bounded silent retry; page remains usable |

</frozen-after-approval>

## Code Map

- `script.js:2283-2650` -- configuration markup, banner payload, host discovery, placement, and event binding.
- `script.js:2968-3120` -- Ghost Mode, external configuration polling, and document-ready startup sequence.
- `tests/test_scout_logic.js` -- existing userscript extraction harness and banner integrity/layout assertions.
- `Banner-ThinkerChess.png` -- visual source for the optimized embedded banner.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- replace the monolithic banner data line with a compact self-contained representation and keep full-height cover rendering.
- [x] `script.js` -- introduce one idempotent UI bootstrap/reconciliation owner that mounts panel and banner across delayed and replaced Chess.com layouts.
- [x] `script.js` -- decouple banner/config shell visibility from Scout fetch success and make Ghost Mode recoverable without duplicating UI.
- [x] `tests/test_scout_logic.js` -- add startup regressions for missing/delayed hosts, repeated reconciliation, SPA replacement, optimized payload bounds, and Ghost Mode transitions.

**Acceptance Criteria:**
- Given the current Chess.com lobby or game layout, when the userscript starts, then exactly one visible Thinker configuration panel and one correctly aligned banner are mounted without waiting for a Scout opponent.
- Given Chess.com replaces the board/sidebar during navigation, when reconciliation runs, then both UI surfaces return without reload or duplicates.
- Given the local server is unavailable or PubAPI fails, when bootstrap runs, then configuration and banner remain functional and the console stays clean.
- Given Ghost Mode was previously enabled, when the user needs to recover the UI, then a visible minimal recovery control can restore the configuration surface.

## Spec Change Log

## Design Notes

The supplied PNG remains the source of truth, but its embedded transport should be optimized rather than copied byte-for-byte. Bootstrap owns only shell existence and geometry; feature observers own their content. This prevents a Scout/network failure from suppressing configuration UI.

## Verification

**Commands:**
- `node --check script.js` -- expected: no syntax error.
- `node tests/test_scout_logic.js` -- expected: Scout, bootstrap, payload, banner layout, and race assertions pass.
- `git diff --check -- script.js tests/test_scout_logic.js` -- expected: no whitespace errors.
- `rg -n "console\.(log|info|warn|trace)|games/archives" script.js` -- expected: no direct console spam or deprecated endpoint.

**Manual checks:**
- Compare panel presence and banner position with the supplied 1433×895 Chess.com screenshot at `/play/online`.

## Suggested Review Order

**Bootstrap and recovery**

- Native entry point starts UI independently from network-backed features.
  [`script.js:3162`](../../script.js#L3162)

- Reconciler remounts detached shells during Chess.com SPA navigation.
  [`script.js:2327`](../../script.js#L2327)

- Ghost recovery keeps hidden controls recoverable without reinstalling.
  [`script.js:2280`](../../script.js#L2280)

**Banner delivery and geometry**

- Pure layout calculation keeps the banner aligned and safely bounded.
  [`script.js:2342`](../../script.js#L2342)

- Reproducible asset builder vendors jQuery and compresses the supplied artwork.
  [`rebuild_userscript_assets.py:7`](../../scripts/rebuild_userscript_assets.py#L7)

**Regression coverage**

- Tests enforce payload bounds, delayed mounting, SPA replacement, and Ghost recovery.
  [`test_scout_logic.js:12`](../../tests/test_scout_logic.js#L12)
