---
title: 'Analysis Lab evaluation V2 core and GPU eval bar'
type: 'feature'
created: '2026-10-19'
status: 'done'
baseline_commit: '172f6202ffbdad0916fff1e0d6c5ebdd7ed56a67'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-browser-stockfish-analysis-lab.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Analysis Lab has an inline, layout-driven evaluation bar and no versioned mathematical core for canonical evaluation, Expected Points move classification, or Lichess-compatible accuracy. Its UCI cancellation logic is implicit and streamed engine updates trigger heavyweight UI work directly.

**Approach:** Add a typed functional analysis core, normative fixtures, an O(1) latest-wins GPU eval bar, and an explicit UCI search state machine. Integrate the fast score lane into the existing lab while retaining the current Stockfish adapter and ChessSession boundaries.

## Boundaries & Constraints

**Always:** Keep changes inside `analysis_lab/` plus this implementation artifact; require Node 22.12+, typecheck new TypeScript, expose model provenance and version constants, and export a Fair Play guardrail allowing only post-game/offline analysis. Canonical scores use White POV. Move classification compares the engine-best candidate and played candidate evaluated from the identical before-move FEN. FEN changes retain the last rendered fraction until a cache hit or valid sample for the new `searchId` arrives. UCI work is strictly serialized through `stop` and `bestmove`; cancelled `info` never reaches consumers.

**Ask First:** Changing approved model constants, introducing a second browser engine, modifying root application/userscript files, adding runtime network services, or expanding into the full review pipeline.

**Never:** Reset the bar to 50% on every FEN, classify by comparing unrelated before/after searches, claim proprietary Chess.com formula parity beyond published thresholds, enable live-game assistance, write layout properties in the animation loop, or implement the Tampermonkey adapter in this phase.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Canonical evaluation | finite cp or mate, White POV | bounded Win%, EP, and visual fraction with declared model version | reject malformed or ambiguous score shapes |
| Move classification | best and played candidate from same FEN and mover | non-negative EP loss and V2 threshold/Thinker heuristic result | reject mismatched FEN identity or mover |
| Search replacement | new work while searching | one `stop`; wait for `bestmove`; start only newest pending work | watchdog reports missing stop acknowledgement |
| FEN navigation | active bar has a previous value | keep current visual atomically until matching cached/new sample | reject stale `searchId` without visual mutation |
| Event burst | many matching `info` events before a frame | retain one newest mailbox value and one scheduled RAF | bounded state; no queue growth |

</frozen-after-approval>

## Code Map

- `analysis_lab/src/analysis/*.ts` -- canonical contracts and pure evaluation, classification, and accuracy models.
- `analysis_lab/src/ui/eval-bar.ts` and `eval-bar.css` -- injected-clock mailbox scheduler and transform-only presentation.
- `analysis_lab/src/engine/uci-protocol.js` -- explicit UCI lifecycle and cancellation barrier.
- `analysis_lab/src/main.js` -- composition root and score fast lane.
- `analysis_lab/tests/*.spec.ts` -- golden math and deterministic animation tests.
- `analysis_lab/tests/uci-protocol.test.js` -- lifecycle and stale-info regression coverage.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `tsconfig.json` -- align Node/TypeScript toolchain and scripts.
- [x] `src/analysis/contracts.ts`, `evaluation.ts`, `classification.ts`, `accuracy.ts` -- implement versioned pure models and guardrail.
- [x] `src/ui/eval-bar.ts`, `eval-bar.css`, `index.html` -- replace height transition with latest-wins transform animation.
- [x] `src/engine/uci-protocol.js` -- make idle/searching/stopping/completed transitions explicit.
- [x] `src/main.js` -- connect search epochs, cache-aware bar handoff, and the O(1) fast lane.
- [x] `tests/reference.spec.ts`, `eval-bar.spec.ts`, `uci-protocol.test.js` -- cover numerical invariants, scheduler behavior, and cancellation.
- [x] `scripts/profile-eval-bar.mjs` -- drive a Chromium burst and capture Long Tasks/layout evidence when a compatible browser is available.

**Acceptance Criteria:**
- Given normative inputs, when typecheck and Vitest run, then all reference values, symmetry, saturation, mate, POV, same-FEN, and scheduler assertions pass.
- Given rapid position changes, when stale and current UCI events interleave, then only the latest search changes state or the Eval Bar.
- Given a synthetic UCI burst in Chromium, when profiling completes, then the report shows bounded mailbox scheduling, no bar-triggered forced layout, and no attributable Long Tasks.

## Design Notes

The evaluation curve ports Lichess's public `0.00368208` winning-chances model and mate mapping. Classification uses Chess.com's published V2 EP-loss bands, with product-owned special heuristics explicitly labeled Thinker. Accuracy ports Lichess's public per-move curve and volatility-weighted/harmonic aggregation. These sources are provenance, not affiliation claims.

## Verification

**Commands:**
- `npm run typecheck` -- no TypeScript diagnostics.
- `npm test` -- complete Vitest suite passes.
- `npm run build` -- production bundle succeeds.
- `npm run profile:eval-bar` -- Chromium profile artifact reports Long Tasks and layout counters, or explicitly reports unavailable browser instrumentation.

## Suggested Review Order

**Runtime integration**

- The fast lane isolates frame-rate score updates from throttled heavyweight rendering.
  [`main.js:82`](../../analysis_lab/src/main.js#L82)

- Explicit states serialize cancellation through `stop` and the `bestmove` barrier.
  [`uci-protocol.js:7`](../../analysis_lab/src/engine/uci-protocol.js#L7)

**Mathematical contracts**

- Canonical types record fair-play boundaries and model provenance in one place.
  [`contracts.ts:1`](../../analysis_lab/src/analysis/contracts.ts#L1)

- Same-FEN and side-to-move checks protect Expected Points comparisons.
  [`classification.ts:29`](../../analysis_lab/src/analysis/classification.ts#L29)

- Lichess aggregation combines volatility weighting with the harmonic power mean.
  [`accuracy.ts:64`](../../analysis_lab/src/analysis/accuracy.ts#L64)

**Frame scheduling and evidence**

- The controller keeps one latest sample and writes only a compositor transform.
  [`eval-bar.ts:30`](../../analysis_lab/src/ui/eval-bar.ts#L30)

- Chromium instrumentation drives sustained bursts and records Long Tasks and frame timing.
  [`profile-eval-bar.ts:33`](../../analysis_lab/src/profile-eval-bar.ts#L33)

**Regression suite**

- Normative fixtures cover symmetry, mate, perspective, thresholds, and aggregate accuracy.
  [`reference.spec.ts:46`](../../analysis_lab/tests/reference.spec.ts#L46)

- Deterministic scheduler tests verify mailbox bounds, anti-flicker, and convergence.
  [`eval-bar.spec.ts:50`](../../analysis_lab/tests/eval-bar.spec.ts#L50)

- Protocol tests exercise cancellation, stale output, bounds, and engine restarts.
  [`uci-protocol.test.js:28`](../../analysis_lab/tests/uci-protocol.test.js#L28)
