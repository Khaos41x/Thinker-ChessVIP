---
title: 'Use Stockfish 19 Smallnet exclusively for Eval Bar V2'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: '495a2dd16a330d7f95de60d71bb90d6bc1664664'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fix-eval-bar-v2-layout-compatibility.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-eval-bar-v2-pixel-perfect.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Eval Bar V2 still obtains evaluations from the shared Komodo `/eval` path, coupling analysis-only UI refreshes to gameplay engine capacity and failing the required Stockfish 19 Smallnet/Lichess engine identity.

**Approach:** Add a persistent Node/WASM Stockfish 19 Smallnet sidecar managed by an isolated Python service and dedicated authenticated `/eval-bar` API, then route only Eval Bar V2 to it. Retain the already-correct Lichess winning-chances function and lock it with independent reference vectors.

## Boundaries & Constraints

**Always:** Use `@lichess-org/stockfish-web@0.5.0` `sf_19_smallnet` and `nn-61e7af4bb97d.nnue`; validate the network SHA-256; configure Threads=3, Hash=16, MultiPV=1, AnalyseMode=true, and 8000 ms reference search; normalize UCI scores to White POV; keep a single persistent engine with serialized searches, supersession, timeout, restart, and clean shutdown; preserve correlation fields and fair-play authorization; publish only current results; benchmark real engine behavior.

**Ask First:** Change the `/eval-bar` response contract incompatibly, alter the approved engine/search profile, or require a new external service/runtime beyond installed Node and Python.

**Never:** Modify Komodo lifecycle/configuration, `/getmove`, legacy `/eval`, EvalBarController, CSS, τ=110 ms, RAF/mailbox/LRU/SPA lifecycle, or competitive-game authorization; use Stockfish Full; commit downloaded NNUE/WASM/node_modules; claim server cancellation when only client stale suppression occurred.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Valid position | Authorized FEN plus correlation identity | `/eval-bar` returns White-POV cp or mate, depth, nodes, nps, engine/network identity | Timeout returns explicit unavailable error without touching Komodo |
| Rapid FEN change | New request supersedes active request | Sidecar sends `stop`, rejects obsolete result, then searches newest FEN | Canceled request cannot enter cache or renderer |
| Sidecar failure | Process/worker/NNUE error | Manager restarts once and retries within bounded deadline | Diagnostics identify startup, NNUE, timeout, or process failure |
| Terminal/invalid FEN | Invalid or game-over position | No engine search; compatible empty/error response | HTTP/API remains deterministic |
| Black to move | UCI score from side-to-move POV | Backend negates cp/mate into White POV | Label orientation remains adapter-owned |
| Math extremes | cp beyond ±1000 or mate ±1..±10 | Fill matches Lichess clamp/mate-distance vectors | Text score remains raw cp/100 or mate distance |

</frozen-after-approval>

## Code Map

- `analysis_lab/scripts/stockfish-eval-bar-service.mjs` -- persistent JSON-lines UCI sidecar over `sf_19_smallnet`.
- `core/eval_bar/stockfish_service.py` -- Flask-facing process manager, correlation, cancellation, recovery, metrics, and shutdown.
- `app.py` -- isolated `/eval-bar` and cancel/status endpoints; legacy Komodo routes unchanged.
- `script.js` -- Eval Bar transport URL/cache identity and generated shared bundle.
- `analysis_lab/src/analysis/evaluation.ts` -- existing official Lichess clamp, logistic curve, and mate mapping.
- `tests/` and `analysis_lab/tests/` -- service, isolation, math, cancellation, browser E2E, and benchmark coverage.

## Tasks & Acceptance

**Execution:**
- [x] Implement the persistent Smallnet sidecar with verified NNUE, fixed UCI options, latest-request cancellation, info parsing, White-POV normalization, and structured telemetry.
- [x] Implement the independent Python manager and authenticated `/eval-bar` surface without sharing Komodo locks, coordinator, telemetry, or health state.
- [x] Route only Eval Bar V2 to `/eval-bar`; version its cache context by engine/build/network/profile/math; regenerate `script.js`.
- [x] Add independent Lichess numeric vectors and real-engine tests for cp/mate/sign/zero, rapid FEN, stale results, restart, isolation, orientation, and transform-only rendering.
- [x] Add repeatable 8-second benchmark tooling and capture startup, first-eval, CPU, RSS, NPS, depth, cancellation, multi-position stability, prolonged memory, and documented Komodo comparison.

**Acceptance Criteria:**
- Given the real Flask server and Chromium fixture, when an authorized FEN is evaluated, then response metadata identifies Stockfish 19 `sf_19_smallnet`/`nn-61e7af4bb97d.nnue`, the score reaches the adapter, and the bar moves smoothly via `scaleY()`.
- Given simultaneous Komodo and Eval Bar work, when both execute, then `/getmove` and `/eval` retain their exact Komodo contracts and do not share the Smallnet process or lock.
- Given rapid request replacement or engine failure, when recovery completes, then obsolete results are rejected and the newest valid evaluation is rendered without duplicate processes.

## Spec Change Log

## Design Notes

The installed package is ESM without a package entry point, so the sidecar imports the explicit `sf_19_smallnet.js` artifact and supplies `mainScriptUrlOrBlob` for pthread workers. `prepare-engine.mjs` already stages and integrity-checks the external NNUE under ignored `analysis_lab/public/engine`, avoiding permanent Downloads dependency. Lichess currently computes `2/(1+exp(-0.00368208*clamp(cp,−1000,1000)))-1`; the V2 core already matches it, including mate distance mapping, so implementation should version and test rather than rewrite it.

The Python manager and Node sidecar communicate through newline-delimited JSON with unique request IDs. The sidecar remains responsive to `cancel` while UCI search runs, waits for the canceled search's `bestmove`, and only then starts the replacement. Flask request threads wait on independent completion events, so Stockfish serialization never acquires the Komodo coordinator lock. Startup telemetry must expose factory, NNUE, UCI, and ready timings separately, while per-search telemetry retains the deepest current `info` record and final `bestmove`.

## Verification

**Commands:**
- `npm run prepare:engine --prefix analysis_lab` and a new real sidecar smoke test -- correct build/network and UCI profile.
- `python -m unittest tests.test_stockfish_eval_bar tests.test_engine_recovery` -- service behavior, isolation, and legacy regression.
- `npm test --prefix analysis_lab -- --maxWorkers=1 --no-isolate` and `npm run typecheck --prefix analysis_lab` -- math/controller/adapter regressions.
- `npm run test:browser:eval-bar-v2-backend --prefix analysis_lab` -- real Smallnet → Flask → Userscript → animated `scaleY()`.
- New benchmark command with JSON/Markdown output -- mandatory 8-second performance and Komodo comparison evidence.
- `npm run build:userscript-eval-bar --prefix analysis_lab` twice, `python scripts/build_userscript.py --check`, and `node --check script.js` -- deterministic final userscript.

**Evidence:** 61 Python regression tests and 85 Vitest tests passed; typecheck and Vite production build passed. Real Flask/Chromium E2E returned Stockfish 19 Smallnet `cp=-68` at depth 28, rendered `#1`, inverted `-0.7` to `+0.7`, and produced 25 distinct transform-only frames. Chromium visual regression passed at 959/960/961 px with zero width, height, top, and gap deltas. The 30-second engine soak completed 30 alternating positions with +0.9 MiB RSS growth.

## Suggested Review Order

**Service boundary and recovery**

- Start with the isolated Flask surface and its independent authorization capacity.
  [`app.py:1342`](../../app.py#L1342)

- Persistent manager enforces one deadline, restart-once, cancellation, and clean shutdown.
  [`stockfish_service.py:86`](../../core/eval_bar/stockfish_service.py#L86)

- Startup recovery converts process and pipe failures into deterministic service errors.
  [`stockfish_service.py:160`](../../core/eval_bar/stockfish_service.py#L160)

**Smallnet execution and normalization**

- Sidecar locks package, build, NNUE integrity, threads, hash, and MultiPV identity.
  [`stockfish-eval-bar-service.mjs:8`](../../analysis_lab/scripts/stockfish-eval-bar-service.mjs#L8)

- UCI scores become White-POV cp or mate before crossing the backend boundary.
  [`stockfish-eval-bar-service.mjs:34`](../../analysis_lab/scripts/stockfish-eval-bar-service.mjs#L34)

- Latest-wins serialization stops obsolete searches before starting the newest FEN.
  [`stockfish-eval-bar-service.mjs:86`](../../analysis_lab/scripts/stockfish-eval-bar-service.mjs#L86)

**Userscript integration**

- Versioned context prevents Komodo-era cache entries from contaminating Smallnet results.
  [`script.js:3024`](../../script.js#L3024)

- Per-tab request identity, server cancellation, and `/eval-bar` routing preserve stale rejection.
  [`script.js:3028`](../../script.js#L3028)

**Evidence and regressions**

- Real-engine tests cover identity, scores, cancellation, failure recovery, and process reuse.
  [`test_stockfish_eval_bar.py:241`](../../tests/test_stockfish_eval_bar.py#L241)

- Independent vectors lock the official Lichess fill conversion and mate curve.
  [`reference.spec.ts:46`](../../analysis_lab/tests/reference.spec.ts#L46)

- Browser fixture waits for the second real mate response, not stale connected state.
  [`profile-userscript-eval-bar-backend.ts:86`](../../analysis_lab/src/profile-userscript-eval-bar-backend.ts#L86)

- Reproducible benchmark records reference searches, cancellation, soak RSS, and Komodo comparison.
  [`benchmark_eval_bar_engines.py:59`](../../scripts/benchmark_eval_bar_engines.py#L59)
