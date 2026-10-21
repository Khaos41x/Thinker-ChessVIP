---
title: 'Eval Bar V2 final presentation and motion polish'
type: 'feature'
created: '2026-10-20'
status: 'done'
baseline_commit: 'd539f30d0bcab52bcddee490c0f4cbf8a803ee4c'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Eval Bar keeps correct White-POV engine data, but its label is signed and anchored to board orientation instead of the favored color. Exact Stockfish updates arrive near 10 Hz and every accepted score immediately changes both target and text, making genuine iterative-deepening noise look visually unstable.

**Approach:** Add a presentation projection that keeps engine truth and Lichess fill math untouched, renders the absolute advantage inside the favored color for either orientation, and selects coherent label/fill samples through a bounded Latest-Wins presentation gate. Preserve the existing exponential RAF controller and pixel geometry.

## Boundaries & Constraints

**Always:** Preserve Stockfish 19 Smallnet, authenticated NDJSON, White-POV raw scores, Lichess normalization, generation/request/FEN correlation, cache truth, cancellation, analysis-only authorization, Komodo isolation, `scaleY()`, RAF, Latest-Wins, tau 110 ms, existing dimensions/colors/type, and continuity across positions. First valid score, material changes, sign changes outside the neutral band, mates, and terminal results remain prompt; terminal output is exact.

**Ask First:** Any backend/transport change, normalization change, dependency addition, tau change, or newly measured Chess.com convention that conflicts with the existing `0.0`/`#N` neutral and mate notation.

**Never:** Average or rewrite engine scores, infer score sign from physical label position, queue animations, remount on score-side changes, conceal the terminal result, widen authorized contexts, or modify legacy Komodo endpoints.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Black advantage | White-POV `cp=-340` | `3.4`, black side; top normally and bottom when inverted | Preserve raw `-340` internally |
| White advantage | White-POV `cp=+250` | `2.5`, white side; bottom normally and top when inverted | Preserve raw `+250` internally |
| Neutral noise | Small rapid sign changes near zero | Stable side/text with coherent fill; exact zero remains `0.0` | Never mutate engine/cache truth |
| Mate | Positive/negative mate | Absolute distance on favored side; side switch is immediate | Existing `#N` convention remains until live native evidence is available |
| Iterative noise | `3.8→3.4→3.7→3.6` within short intervals | Coalesce insignificant intermediate presentation churn | Final `3.6` is always shown exactly |
| Material change | Large cp delta, meaningful sign change, or mate | Publish immediately as one label/fill sample | Obsolete/bound/lower-depth events remain rejected |

</frozen-after-approval>

## Code Map

- `frontend/eval_bar/userscript-adapter.ts` -- raw evaluation acceptance, presentation projection/gating, provenance, cache, and diagnostics.
- `analysis_lab/src/analysis/contracts.ts` -- presentation metadata carried atomically with each controller sample.
- `analysis_lab/src/ui/eval-bar.ts` -- frame-rate-independent Latest-Wins animation and atomic sample consumption.
- `analysis_lab/src/ui/eval-bar.css` -- favored-color edge and contrasting label color without geometry changes.
- `analysis_lab/src/profile-userscript-eval-bar.ts` -- browser fixtures for score semantics, stability, continuity, and viewports.
- `analysis_lab/tests/eval-bar.spec.ts` and new focused presentation tests -- deterministic irregular-FPS and selector coverage.
- `tests/browser/test_eval_bar_v2_chrome.mjs` -- frame-by-frame acceptance and performance evidence.
- `script.js` -- regenerated Tampermonkey artifact.

## Tasks & Acceptance

**Execution:**
- [x] Introduce a pure presentation projection and per-generation selector: immediate first/material/mate/final updates, nondecreasing depth, 250 ms ordinary-update coalescing, exact terminal flush, and timer teardown.
- [x] Carry favored color with the selected sample and atomically update target, label, and side in the existing controller RAF.
- [x] Position and color the label from favored color plus orientation while preserving all measured geometry and visual tokens.
- [x] Add deterministic unit/Chromium coverage for score cases, 100 irregular updates at 30/60/120 FPS, mid-flight retargeting, stabilization/final fidelity, continuity, cache, stale events, and real Smallnet streaming; regenerate `script.js`.

**Acceptance Criteria:**
- Given either orientation, when White-POV scores favor white or black, then unsigned text appears in the corresponding colored region with readable contrast and unchanged fill math.
- Given 100 irregular progressive events, when the target changes mid-animation, then one controller instance pursues the selected latest target without overshoot, reset, flicker, queued RAFs, or meaningful performance regression.
- Given noisy shallow/deep scores, when ordinary changes arrive faster than the presentation cadence, then raw diagnostics remain exact while coherent label/fill samples are coalesced and the terminal score is displayed faithfully.
- Existing frontend, browser, Tampermonkey, real Stockfish/Flask, legacy Komodo, cache, stale-event, orientation, breakpoint, and 30-transition suites pass.

## Spec Change Log

## Design Notes

Presentation state is distinct from raw engine state and rendered controller state. A single selected sample contains fraction, absolute label, and favored color. The controller consumes that tuple on one RAF. The sidecar's existing 100 ms exact-event throttle remains unchanged; the UI selector uses one replaceable pending candidate rather than averaging or delaying the first score.

## Verification

**Commands:**
- `npm test && npm run typecheck && npm run build && npm run build:userscript-eval-bar -- --check` in `analysis_lab` -- all unit/build checks pass.
- `npm run test:browser:eval-bar-v2` -- score placement, 100-update traces, FPS invariance, continuity, geometry, and performance pass.
- `npm run test:transport:eval-bar-v2-backend` -- multiple real Smallnet updates precede exact terminal output.
- `python tests/test_stockfish_eval_bar.py` and `python tests/test_server.py` -- Stockfish service and Komodo endpoints remain isolated and healthy.
- `node --check script.js` and `git diff --check` -- generated userscript and patch are valid.

**Manual checks:**
- Compare neutral and mate notation against authenticated Chess.com DOM/screenshots if available; otherwise report that exact native notation was not independently measured.

## Suggested Review Order

**Presentation selection**

- Start with the pure White-POV-to-presentation projection and unsigned favored-side semantics.
  [`userscript-adapter.ts:362`](../../frontend/eval_bar/userscript-adapter.ts#L362)

- Review the replaceable Latest-Wins candidate and immediate-update exceptions.
  [`userscript-adapter.ts:392`](../../frontend/eval_bar/userscript-adapter.ts#L392)

- Verify selected samples retain request, generation, FEN, depth, and cache provenance.
  [`userscript-adapter.ts:865`](../../frontend/eval_bar/userscript-adapter.ts#L865)

**Rendering coherence**

- Follow continuous target pursuit and guarded favored-side label commits inside the existing RAF.
  [`eval-bar.ts:124`](../../analysis_lab/src/ui/eval-bar.ts#L124)

- Confirm physical label edge derives only from favored color and board orientation.
  [`eval-bar.css:72`](../../analysis_lab/src/ui/eval-bar.css#L72)

- Check the required atomic presentation metadata contract.
  [`contracts.ts:70`](../../analysis_lab/src/analysis/contracts.ts#L70)

**Regression evidence**

- Inspect deterministic projection, cadence, terminal-fidelity, and refresh-depth tests.
  [`eval-bar-presentation.spec.ts:18`](../../analysis_lab/tests/eval-bar-presentation.spec.ts#L18)

- Inspect irregular 30/60/120 FPS pursuit and extreme crossover coverage.
  [`eval-bar.spec.ts:127`](../../analysis_lab/tests/eval-bar.spec.ts#L127)

- Review Chromium assertions for placement, coalescing, stale timers, and exact terminal output.
  [`test_eval_bar_v2_chrome.mjs:330`](../../tests/browser/test_eval_bar_v2_chrome.mjs#L330)

- Read measured real-engine, frame-by-frame, and limitation evidence last.
  [`eval-bar-v2-final-polish-evidence.md:1`](eval-bar-v2-final-polish-evidence.md#L1)
