---
title: 'Lichess Chessground board and PV arrows'
type: 'feature'
created: '2026-10-13'
status: 'done'
baseline_commit: '5a522782b9865f2b3587e0ca378dedf62f357deb'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-browser-stockfish-analysis-lab.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Analysis Lab board looks visibly inferior to Lichess because it is a hand-built Unicode grid, and the streamed Stockfish principal variation is shown only as text. The board gives weak interaction feedback and does not visually explain either the best move or the predicted reply.

**Approach:** Replace the manual renderer with the official `@lichess-org/chessground` board used by Lichess, using its brown board and Cburnett piece assets. Feed the first two legal moves of Stockfish's primary PV into distinct labeled SVG arrows: the side-to-move recommendation and the opponent's predicted best reply.

## Boundaries & Constraints

**Always:** Keep the change inside `analysis_lab/`; use an exact Chessground package version and its official CSS assets; preserve PGN/FEN navigation, legal move enforcement, promotion-to-queen behavior, flip control, engine telemetry, and responsive use; clear stale arrows immediately on position/search changes; derive arrows only from the latest primary PV for the current search; distinguish the two recommendations with both color and labels/legend; disclose Chessground's GPL-3.0-or-later terms in bundled notices and documentation.

**Ask First:** Changing the engine protocol or backend, adding manual variation editing, changing the root Flask/userscript application, publishing/deploying the site, or applying GPL licensing changes outside the isolated Analysis Lab.

**Never:** Copy Lichess branding or the complete analysis-page chrome; draw an illegal or stale move; present the predicted reply as playable in the current position; overwrite unrelated dirty-tree files; commit generated engine binaries or `node_modules`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Normal board use | Current legal FEN | Chessground renders Lichess-style pieces, coordinates, destinations, last move, check, drag and click movement | Illegal drops snap back and do not change session state |
| Engine PV | Latest primary line has two or more legal UCI moves | Green arrow labeled `1` shows the side-to-move recommendation; blue arrow labeled `2` shows the predicted reply; a text legend names both | Validate sequentially on a cloned position and omit any invalid remainder |
| Short or pending PV | No PV or only one legal move | Clear old arrows; show zero or one recommendation without inventing a reply | Existing loading/terminal copy remains visible |
| Position transition | Import, navigation, manual move, engine stop, or setting change | All old arrows disappear before the new search can stream results | Search-id guard prevents late output from restoring stale arrows |
| Responsive layout | Desktop, tablet, or narrow phone | Board stays square and dominant, with readable controls and no horizontal overflow | Right-side panels stack below the board at narrow widths |

</frozen-after-approval>

## Code Map

- `analysis_lab/package.json` and `package-lock.json` -- pin the official Chessground dependency.
- `analysis_lab/index.html` -- provide the Chessground host and recommendation legend in the analysis layout.
- `analysis_lab/src/main.js` -- own the Chessground instance, legal destinations, session synchronization, and validated PV arrow projection.
- `analysis_lab/src/styles.css` -- import official board/piece assets and refine the surrounding layout into a restrained Lichess-like analysis workspace.
- `analysis_lab/src/board-adapter.js` -- isolate Chessground configuration and UCI-PV-to-shape conversion from application state.
- `analysis_lab/tests/board-adapter.test.js` -- cover destinations, checks, promotions, PV validation, and stale/short arrow inputs.
- `analysis_lab/THIRD_PARTY_NOTICES.txt` and `README.md` -- record the pinned GPL dependency, source link, use, and redistribution implication.

## Tasks & Acceptance

**Execution:**
- [x] `analysis_lab/package*.json` -- add a pinned `@lichess-org/chessground` release and preserve reproducible installs.
- [x] `analysis_lab/src/board-adapter.js` and tests -- translate chess.js positions/moves into Chessground config and safe two-ply arrow shapes.
- [x] `analysis_lab/src/main.js` -- replace manual square rendering and click selection with a synchronized Chessground lifecycle.
- [x] `analysis_lab/index.html` and `src/styles.css` -- use official Lichess board/piece assets, improve proportions and hierarchy, and add a non-color-only arrow legend.
- [x] `analysis_lab/THIRD_PARTY_NOTICES.txt` and `README.md` -- document license/source obligations and the two-arrow semantics.

**Acceptance Criteria:**
- Given any supported FEN or PGN ply, when it is displayed, then the board uses the official Chessground interaction and Lichess brown/Cburnett visual assets while remaining synchronized with `ChessSession`.
- Given a streamed Stockfish primary PV, when its first two plies are legal in sequence, then the current board displays labeled best-move and predicted-reply arrows and updates them without stale flicker.
- Given engine disablement, terminal positions, rapid navigation, or malformed PV tokens, when analysis state changes, then obsolete arrows are absent and the board remains usable.
- Given desktop and phone widths, when the page renders, then the board is the visual focus and all essential analysis controls remain reachable without horizontal page scrolling.

## Design Notes

Chessground is the actual board UI maintained for Lichess, not a visual imitation. Its configuration accepts FEN, turn color, legal destination maps, last-move squares, check state, orientation, and `drawable.autoShapes`. The first PV arrow represents a legal move in the displayed position; the second represents a legal move only after applying the first, so its legend must call it a predicted reply rather than imply both moves are currently playable.

## Verification

**Commands:**
- `npm test` -- existing engine/session tests and new board-adapter cases pass.
- `npm run build` -- Vite resolves official Chessground JS/CSS assets and produces a clean production bundle.
- `npm run smoke:engine` -- Stockfish still loads locally and returns a legal best move after the UI refactor.

**Manual checks:**
- Start the local Vite server, enable Stockfish, verify both labeled arrows update on streamed PV changes, then navigate rapidly and confirm no stale arrows return.
- Exercise click, drag, castling, promotion, board flip, PGN/FEN import, a check position, and a narrow mobile viewport.

## Suggested Review Order

**Board integration**

- Start with the one-time Chessground mount and synchronized application lifecycle.
  [`main.js:34`](../../analysis_lab/src/main.js#L34)

- Review the chess.js-to-Chessground boundary and explicit orientation preservation.
  [`board-adapter.js:64`](../../analysis_lab/src/board-adapter.js#L64)

- Inspect local interaction, stale-search invalidation, and engine-failure cleanup.
  [`main.js:265`](../../analysis_lab/src/main.js#L265)

**Engine recommendations**

- Validate two sequential legal plies from the primary Stockfish PV.
  [`board-adapter.js:30`](../../analysis_lab/src/board-adapter.js#L30)

- Confirm streamed evaluations replace SVG auto-shapes immediately.
  [`main.js:190`](../../analysis_lab/src/main.js#L190)

**Interaction and presentation**

- Follow the keyboard square cursor and accessible move-selection path.
  [`main.js:68`](../../analysis_lab/src/main.js#L68)

- Review official board, brown theme, Cburnett pieces, and responsive sizing.
  [`styles.css:1`](../../analysis_lab/src/styles.css#L1)

- Confirm visible and non-color-only recommendation semantics.
  [`index.html:34`](../../analysis_lab/index.html#L34)

**Verification and distribution**

- Check castling, en passant, pins, promotion, orientation, and PV edge cases.
  [`board-adapter.test.js:5`](../../analysis_lab/tests/board-adapter.test.js#L5)

- Ensure stale evaluations are invalidated as one atomic state transition.
  [`analysis-state.test.js:4`](../../analysis_lab/tests/analysis-state.test.js#L4)

- Verify the complete Chessground GPL text is copied into production builds.
  [`prepare-engine.mjs:40`](../../analysis_lab/scripts/prepare-engine.mjs#L40)
