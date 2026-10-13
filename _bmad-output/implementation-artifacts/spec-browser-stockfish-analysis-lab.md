---
title: 'Browser Stockfish analysis lab'
type: 'feature'
created: '2026-10-12'
status: 'done'
baseline_commit: 'dded8c8c224578a9c5159027f5de2d879298ac0a'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/architecture/design_system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Thinker Chess has no standalone analysis workspace where we can study the engineering pattern used by Lichess and evaluate positions without spending server CPU. The first slice needs to prove that a useful Stockfish evaluation can run locally in the visitor's browser while presenting a familiar analysis-board experience.

**Approach:** Build an isolated `analysis_lab/` Vite application with a responsive chessboard, main-line PGN/FEN navigation, evaluation bar, principal variations, engine telemetry, and configurable browser Stockfish. Mirror the important Lichess separation between engine adapter, UCI protocol, chess state, and view state, but use original Thinker Chess visual styling and a smaller MVP surface.

## Boundaries & Constraints

**Always:** Keep every implementation file under `analysis_lab/`; leave the running tests, root application, userscript, database, and existing artifacts untouched. Run Stockfish in browser WebAssembly, use UCI commands, stop the previous search before analyzing a new position, clamp threads/hash/MultiPV to safe device-aware limits, expose loading/failure states, and make the primary controls keyboard- and mobile-usable. Serve development responses with COOP/COEP headers required for shared WebAssembly memory. Keep downloaded engine/NNUE binaries out of Git.

**Ask First:** Modifying `app.py`, reusing the Komodo backend, committing third-party engine binaries, publishing the site, adding persistence or accounts, or expanding from a main-line viewer into a full variation editor.

**Never:** Copy Lichess branding or source wholesale, call a remote analysis service, silently fall back to server compute, overwrite unrelated dirty-tree files, or claim parity with the complete Lichess analysis page.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Starting position | Initial load | Board, coordinates, controls, and idle engine state render immediately | Engine assets load lazily |
| Position analysis | Valid FEN or selected PGN ply | Local engine streams depth, score, nodes, NPS, and 1-3 PVs | Stale output is ignored after position changes |
| PGN review | Valid standard-chess PGN | Main line becomes navigable by buttons, move clicks, and arrow keys | Show a concise inline parse error without losing prior state |
| Invalid FEN | Malformed or illegal FEN | Existing position remains unchanged | Explain that the FEN was rejected |
| Unsupported browser | Missing WASM/shared-memory prerequisites | Viewer remains usable and engine toggle is disabled | List the missing capability and required isolation state |
| Engine failure | Asset, NNUE, or worker initialization fails | UI returns to a stable non-computing state | Surface actionable local setup diagnostics |

</frozen-after-approval>

## Code Map

- `analysis_lab/package.json` -- isolated dependencies and dev/test/build commands.
- `analysis_lab/vite.config.js` -- local server isolation headers and build configuration.
- `analysis_lab/scripts/prepare-engine.mjs` -- copies package assets and obtains the recommended NNUE without tracking binaries.
- `analysis_lab/src/engine/stockfish-adapter.js` -- Stockfish WebAssembly lifecycle and capability detection.
- `analysis_lab/src/engine/uci-protocol.js` -- serialized UCI work, option changes, cancellation, and streamed info parsing.
- `analysis_lab/src/chess-session.js` -- validated FEN/PGN main-line state and navigation.
- `analysis_lab/src/main.js` -- application state, event wiring, rendering, and stale-result protection.
- `analysis_lab/src/styles.css` -- original responsive Thinker Chess analysis layout.
- `analysis_lab/tests/` -- protocol parser and chess-session edge-case coverage.
- `analysis_lab/README.md` -- setup, architecture notes, verified Lichess references, and current limitations.

## Tasks & Acceptance

**Execution:**
- [x] `analysis_lab/package.json`, `vite.config.js`, `.gitignore`, `scripts/prepare-engine.mjs` -- create the isolated toolchain and reproducible local engine preparation.
- [x] `analysis_lab/src/engine/*` -- implement feature detection, Stockfish boot, UCI handshake/options, safe search replacement, and structured evaluation events.
- [x] `analysis_lab/src/chess-session.js` and `src/main.js` -- implement position import, main-line navigation, board interaction, and synchronized analysis state.
- [x] `analysis_lab/index.html` and `src/styles.css` -- deliver the responsive board, evaluation rail, engine panel, moves, import dialog, and settings.
- [x] `analysis_lab/tests/*` and `README.md` -- cover deterministic logic and document the engineering findings and setup.

**Acceptance Criteria:**
- Given a prepared local checkout in a compatible browser, when the user enables the engine, then the current position is analyzed entirely client-side and the UI streams score, depth, nodes, NPS, and PV data.
- Given a PGN or FEN, when the user imports and navigates it, then board, move selection, evaluation, and PV are synchronized without a page reload.
- Given rapid navigation, when several positions are selected, then only the latest search may update the visible evaluation.
- Given a narrow viewport, when the page is used by touch, then the board and essential controls remain visible and operable without horizontal page overflow.

## Design Notes

Lichess currently prefers its Stockfish 19 small-network build in capable browsers and gates it on shared memory, SIMD, and dynamic worker imports. Its adapter dynamically loads the WebAssembly module and NNUE, while its protocol owns UCI sequencing and parses streamed `info` records. This MVP preserves those boundaries so engine selection, caching, or a server fallback can be added later without coupling them to the view.

## Verification

**Commands:**
- `npm test` -- protocol and session tests pass.
- `npm run build` -- Vite produces a production bundle without tracked engine binaries.
- `npm run smoke:engine` -- the prepared Stockfish 19 WASM loads its NNUE and returns a legal best move.
- `npm run dev` -- local preview reports cross-origin isolation and boots the prepared browser engine.

## Suggested Review Order

**Application flow**

- Start with state ownership and engine-to-view synchronization.
  [`main.js:24`](../../analysis_lab/src/main.js#L24)

- Review board and move-list rendering from validated session state.
  [`main.js:43`](../../analysis_lab/src/main.js#L43)

- Confirm terminal positions and stale searches cannot trigger invalid analysis.
  [`main.js:234`](../../analysis_lab/src/main.js#L234)

**Engine boundary**

- Inspect capability detection, bounded memory, WASM loading, and fatal cleanup.
  [`stockfish-adapter.js:55`](../../analysis_lab/src/engine/stockfish-adapter.js#L55)

- Verify UCI handshake, option barriers, cancellation, and stop watchdog behavior.
  [`uci-protocol.js:41`](../../analysis_lab/src/engine/uci-protocol.js#L41)

- Check structured parsing of streamed depth, score, telemetry, and PV records.
  [`uci-protocol.js:6`](../../analysis_lab/src/engine/uci-protocol.js#L6)

**Chess state and UX**

- Review FEN legality guards and lossless PGN main-line reconstruction.
  [`chess-session.js:23`](../../analysis_lab/src/chess-session.js#L23)

- Inspect responsive analysis workspace and semantic visual tokens.
  [`styles.css:58`](../../analysis_lab/src/styles.css#L58)

**Supply chain and verification**

- Verify pinned assets, SHA-256 checking, and certificate-aware download fallback.
  [`prepare-engine.mjs:15`](../../analysis_lab/scripts/prepare-engine.mjs#L15)

- Review protocol race, timeout, and lifecycle regression coverage.
  [`uci-protocol.test.js:28`](../../analysis_lab/tests/uci-protocol.test.js#L28)

- Review FEN, PGN, branching, and setup-position coverage.
  [`chess-session.test.js:4`](../../analysis_lab/tests/chess-session.test.js#L4)

- Finish with setup instructions, architecture notes, sources, and known limits.
  [`README.md:1`](../../analysis_lab/README.md#L1)
