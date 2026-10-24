# Eval Bar motion measurements

The measured foreground Chromium renderer ran at approximately 60 Hz, not 30 FPS. Neither baseline nor refinement produced a main-thread long task during the two real Stockfish searches. Sparse search-depth emissions and the ordinary presentation gate are distinct from animation cadence.

## Scope and reproduction

`node tests/browser/profile_eval_bar_motion.mjs` starts an isolated Flask server, the installed Lichess Stockfish Smallnet runtime, Vite and an owned headless Chromium profile. The route is an authorized `/analysis/motion-profile` fixture. Each scenario streams an actual eight-second Stockfish search over the existing NDJSON endpoint, followed by 1.2 seconds of convergence. The second scenario also updates an unrelated host-page text node approximately every 16 ms to measure MutationObserver overhead. These are synthetic page mutations, not fabricated engine scores or gameplay.

The `before-*` captures were collected before the source changes. `after-*` captures use the refined source. Chromium traces are gzip-compressed JSON trace files; frame files contain each controller frame, accepted target, received UCI payload, timing and transform. The foreground visibility state was `visible`. Chromium's available display cadence was about 60 Hz. Actual 120 Hz display output was unavailable; 30/60/120 FPS irregular-update simulations passed separately. No hardware 120 Hz result is claimed.

## Results

| Metric | Baseline, normal | Refined, normal | Baseline, page mutations | Refined, page mutations |
|---|---:|---:|---:|---:|
| RAF interval median | 16.7 ms | 16.7 ms | 16.7 ms | 16.7 ms |
| RAF interval p95 | 16.7 ms | 16.7 ms | 16.7 ms | 16.8 ms |
| Worst RAF interval | 16.8 ms | 33.4 ms | 16.8 ms | 16.8 ms |
| Intervals above 25 ms | 0 | 1 | 0 | 0 |
| Main-thread long tasks | 0 | 0 | 0 | 0 |
| Accepted target → moving frame, median | 9.1 ms | 5.5 ms | 11.2 ms | 10.4 ms |
| Accepted target → moving frame, p95 | 16.5 ms | 13.3 ms | 17.2 ms | 13.9 ms |
| Received selected score → acceptance, worst | 25.0 ms | 0.5 ms | 103.0 ms | 0.1 ms |
| Geometry synchronizations | 16 | 4 | 590 | 586 |
| Maximum concurrent animation callbacks | 1 | 1 | 1 | 1 |
| Eval Bar DOM mounts | 1 | 1 | 1 | 1 |
| Required-movement samples superseded before moving | 1 | 0 | 1 | 0 |
| Final target → convergence | 400.3 ms | 485.0 ms | 323.8 ms | 261.3 ms |

Movement latency excludes samples already at their rendered fraction: an unchanged settled score correctly requires no moving frame. Each accepted sample is correlated only with a moving frame whose target matches that sample and whose timestamp precedes the next accepted sample. A superseded mailbox value is counted separately and cannot receive credit for a later sample's animation. Raw saved frame/acceptance timestamps were sufficient to recompute these metrics without rerunning the baseline against modified source. There were no unmatched final moving samples. Receipt latency describes scores actually selected; superseded coalesced candidates are not counted as delayed successful selections. Convergence uses absolute fraction error ≤ 0.0001, so initial error and intervening targets affect its duration. Independent real searches had different depth/emission schedules; these timings are observations, not a controlled claim that total FPS or all convergence times improved. The single refined-run 33.4 ms interval is disclosed rather than hidden.

All four captures used only `scaleY()`, had no overshoot, one DOM mount and one outstanding animation callback. The computed fill had transition duration `0s` and animation name `none`; there was no second CSS animation conflicting with RAF.

## Confirmed causes and changes

1. The baseline body MutationObserver received the rail's own score-label `textContent` mutations. That invoked reconciliation, polling and geometry/style reads after visual updates. Filtering mutations whose target remains inside the existing rail reduced normal geometry synchronization from 16 to 4. External mutations still reconcile, preserving board discovery and layout tracking. Their overhead remains visible in the stress scenario; it did not reduce the measured RAF cadence.
2. The 250 ms ordinary gate delayed or superseded valid early search scores. In the recorded baseline, an ordinary score arrived 142 ms after stream start and was coalesced after the first score at 11 ms; it was superseded by the 268 ms score. Another score received at 495 ms was published at approximately 520 ms. The gate is now 100 ms, permitting earlier ordinary retargeting while still retaining a single latest pending score. Terminal, material and meaningful sign/mate changes remain immediate. A regression uses the recorded 11/142 ms timing.
3. Identical label and orientation/favored-side values no longer cause redundant DOM writes. This reduces self-generated mutation/style work without altering score semantics.

The response constant remains **τ = 110 ms**. The baseline already had correct frame-rate-independent interpolation, mid-transition retargeting, a latest-wins mailbox, transform-only animation, and a single RAF loop. The available measurements do not justify changing its response constant or introducing another animation layer. Sparse later UCI depth events remain truthful engine output; the renderer continues pursuing the latest score between them.

## Validation

`npx vitest run tests/eval-bar.spec.ts tests/eval-bar-presentation.spec.ts tests/userscript-eval-bar.spec.ts`: 31 tests passed. Includes irregular targets at simulated 30/60/120 FPS, no overshoot, one pending RAF, stale search rejection, mid-animation retargeting, atomic score presentation, unchanged-label write suppression and the 100 ms ordinary cadence.

`npx tsc --noEmit`: passed. The Eval Bar userscript bundle was regenerated with `node scripts/build-userscript-eval-bar.mjs`. Broader integration/geometry checks are listed in the parent delivery report.

`npx vitest run tests/profile-motion-metrics.spec.ts`: two correlation regressions passed, covering overwritten burst samples, target mismatch and settled identical samples.
