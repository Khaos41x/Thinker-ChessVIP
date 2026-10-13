---
title: 'Clarify turn and engine arrow sequence'
type: 'bugfix'
created: '2026-10-13'
status: 'done'
baseline_commit: '8bd6d0e23999e4cb422a1812d0872abb29319348'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-lichess-chessground-board-and-pv-arrows.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The engine guidance looks incorrect and visually chaotic because the board hides whose turn it is, draws two oversized numbered arrows on one static position, labels them generically, and prints coordinates on every square. In the reported position after `1.e4 e5 2.a3 a6 3.Bc4 h6 4.Qf3`, the correct defensive recommendation `...Nf6` is therefore mistaken for an irrelevant knight move even though it blocks the queen's `f3-f7` path and prevents `Qxf7#`.

**Approach:** Preserve Stockfish and the two-ply primary PV, but redesign their presentation as an explicit sequence: a prominent side-to-move banner, a strong current-move arrow, a quieter predicted-reply arrow, and dynamic labels containing side and SAN. Remove in-board number bubbles and per-square coordinates so the official Chessground board reads like Lichess instead of a debug visualization.

## Boundaries & Constraints

**Always:** Keep changes inside `analysis_lab/`; keep chess.js and Stockfish authoritative; show which color moves now before showing any recommendation; label the first PV move as the current side's move and the second strictly as the opponent's reply after move one; retain both arrows with a clear visual hierarchy; clear guidance with stale evaluations; use edge-only board coordinates; add a regression for the exact reported position; preserve keyboard, drag/click, PGN/FEN, flip, telemetry, mobile behavior, and existing license handling.

**Ask First:** Changing engine search parameters or score semantics, suppressing the second PV ply entirely, changing the imported game state, altering the root application/userscript, or publishing the site.

**Never:** Fabricate `Qxf7#` when it is not the side to move or when the path is blocked; reinterpret the engine result based on the viewer's preferred color; show the predicted reply as immediately playable; restore oversized SVG labels; touch unrelated dirty-tree files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Reported position | After `4.Qf3`, Black to move, primary PV starts `g8f6 b1c3` | Banner says Black moves; guidance reads `Pretas agora: Nf6`, then `Brancas depois de Nf6: Nc3`; arrows match without number bubbles | Regression proves `Qxf7` is unavailable after `...Nf6` |
| White to move | Any legal white-turn FEN | First label and strong arrow belong to White; reply label belongs to Black | Derive sides from FEN rather than orientation |
| Short or pending PV | No legal PV or only one legal ply | Banner remains correct; unavailable move labels show a waiting dash; no stale reply arrow or text | Reuse search-id invalidation |
| Board flipped | Either orientation | Turn/recommendation sides remain semantic colors, independent of screen orientation | Orientation affects only rendering direction |
| Narrow screen | Mobile viewport | Turn and two-step guidance remain above the board, compact and readable | Sequence wraps without horizontal overflow |

</frozen-after-approval>

## Code Map

- `analysis_lab/index.html` -- replace the generic below-board legend with an above-board turn and sequence strip.
- `analysis_lab/src/main.js` -- render dynamic side/SAN guidance from the accepted primary PV.
- `analysis_lab/src/board-adapter.js` -- expose a validated color-aware recommendation sequence and cleaner arrow shapes/config.
- `analysis_lab/src/styles.css` -- remove debug-like clutter and style the ordered guidance hierarchy responsively.
- `analysis_lab/tests/board-adapter.test.js` -- lock the reported Scholar's Mate threat position and side/sequence semantics.
- `analysis_lab/scripts/smoke-engine.mjs` and `package.json` -- allow a pinned-position engine smoke check proving Stockfish selects the defensive move.

## Tasks & Acceptance

**Execution:**
- [x] `analysis_lab/src/board-adapter.js` and tests -- produce validated side-aware move metadata, edge-only coordinates, and unnumbered hierarchical arrows.
- [x] `analysis_lab/index.html`, `src/main.js`, and `src/styles.css` -- present turn and PV sequence clearly above a cleaner Lichess-style board.
- [x] `analysis_lab/scripts/smoke-engine.mjs` and `package.json` -- add a repeatable exact-position engine verification without changing search configuration.

**Acceptance Criteria:**
- Given the reported seven-ply position, when analysis streams `g8f6 b1c3`, then the UI unmistakably says Black plays `Nf6` now and White's `Nc3` is the predicted reply after it.
- Given any orientation, when the position or PV changes, then side labels come from FEN turn state and stale arrows/text disappear together.
- Given desktop or mobile layout, when the board is viewed, then pieces, edge coordinates, arrows, and recommendation hierarchy remain legible without oversized badges or per-square coordinate noise.
- Given the pinned Stockfish build and reported FEN, when the regression smoke runs, then its best move confirms the engine/UI diagnosis rather than substituting an invented mating move.

## Design Notes

The two arrows describe time, not two simultaneously playable choices. Visual order must therefore be encoded three ways: placement (`agora` before `depois`), strength (primary arrow stronger), and text (side plus SAN). Board orientation is a view preference and must never determine which player a recommendation belongs to.

## Verification

**Commands:**
- `npm test` -- all adapter/session/protocol tests and the reported-position regression pass.
- `npm run build` -- the simplified Chessground UI bundles successfully.
- `npm run smoke:scholar` -- Stockfish analyzes the reported FEN and returns the expected defensive move.

**Manual checks:**
- Import the reported PGN, compare normal/flipped and desktop/mobile states, and confirm the banner, dynamic labels, PV text, and two arrows tell one unambiguous sequence.

**Results:**
- `npm test` -- 24/24 tests passed.
- `npm run build` -- production bundle completed successfully.
- `npm run smoke:scholar` -- returned `bestmove g8f6`; the ponder move varied legally by search run.
- Browser-webview attachment to localhost timed out, so the final visual viewport check remains manual.

## Suggested Review Order

**Recommendation semantics**

- Start with the side-aware sequence model shared by arrows and copy.
  [`board-adapter.js:65`](../../analysis_lab/src/board-adapter.js#L65)

- Follow the rendering path that suppresses duplicate live announcements.
  [`main.js:200`](../../analysis_lab/src/main.js#L200)

- Verify terminal states and imported roots never claim the wrong context.
  [`main.js:257`](../../analysis_lab/src/main.js#L257)

**Visual hierarchy**

- Review the above-board semantic structure replacing numbered badges.
  [`index.html:29`](../../analysis_lab/index.html#L29)

- Inspect desktop and narrow-screen hierarchy for the two-ply sequence.
  [`styles.css:62`](../../analysis_lab/src/styles.css#L62)

- Compare primary and predicted-reply arrow brush strengths.
  [`board-adapter.js:5`](../../analysis_lab/src/board-adapter.js#L5)

**Regression proof**

- Confirm the exact reported position rejects the queen move after `...Nf6`.
  [`board-adapter.test.js:77`](../../analysis_lab/tests/board-adapter.test.js#L77)

- Confirm explicit `agora/depois` copy and pending-PV clearing.
  [`board-adapter.test.js:91`](../../analysis_lab/tests/board-adapter.test.js#L91)

- Run the real pinned Stockfish smoke against the reported FEN.
  [`smoke-engine.mjs:21`](../../analysis_lab/scripts/smoke-engine.mjs#L21)
