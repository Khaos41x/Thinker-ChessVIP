# Continuous Eval Bar — Validation Evidence

Date: 2026-10-20

## Chromium frame trace

Command: `npm run test:browser:eval-bar-v2`

- 30 query/FEN transitions completed.
- Detection latency: minimum 0.220 ms, average 0.256 ms, maximum 0.470 ms.
- Simulated first streamed evaluation latency: minimum 15.430 ms, average 16.332 ms, maximum 17.065 ms.
- First rendered frame after evaluation: minimum 14.420 ms, average 15.335 ms, maximum 16.415 ms.
- Fill opacity observed on every pending frame: `1`.
- Label opacity observed on every pending frame: `1`.
- Artificial neutral resets: 0.
- DOM/controller remounts: 0.
- Board-node replacements handled by retargeting: 1.
- Obsolete evaluation callbacks rejected: 30.
- Superseded adapter request handles aborted: 30.
- Rail geometry remained unchanged throughout the trace.
- Every first updated fraction was strictly between the retained fraction and the new target, confirming continuous interpolation rather than a jump or restart.
- A property-only FEN recovery, with no DOM mutation and polling disabled for 60 seconds, dispatched in 0.915 ms through the bounded route-event reconciliation burst.
- Ten synchronous route/FEN replacements before reconciliation coalesced to one request for the final position.
- A permanently removed board was unmounted after the configured 20 ms test grace period; production uses a 1500 ms replacement grace period.

The test records each transition's prior fraction, pending fraction, first updated fraction, target, fill/label opacity, score text, transform, DOM identity, geometry, request cancellation, rendered FEN, and stale-rejection count before applying the aggregate assertions.

## Real Stockfish/Flask stream

Command: `npm run test:transport:eval-bar-v2-backend`

- First real Stockfish evaluation: 22.416 ms.
- Final result: 8011.938 ms.
- Pre-final depths: 1, 14, 16, 19, 20, 21, 22, 23, 25, 26, 28.
- Final evaluation: depth 28, cp +22.
- Engine: Stockfish 19.
- Package/build: `@lichess-org/stockfish-web@0.5.0`, `sf_19_smallnet`.
- Network: `nn-61e7af4bb97d.nnue`.

## Pixel geometry

Chromium checks passed at viewport widths 900, 959, 960, 961, and 1280 px. Width remained 20 px below the 960 px breakpoint and 30 px at/above it; gap remained 10 px and board alignment stayed within 1 CSS pixel after resize and scroll.
