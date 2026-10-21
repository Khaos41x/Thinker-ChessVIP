# Eval Bar V2 Final Polish — Validation Evidence

Date: 2026-10-20

## Root cause

- The adapter formatted signed White-POV scores and inverted them for black orientation, conflating engine perspective with physical placement.
- CSS anchored the label only from board orientation, so the score always followed the white region.
- The sidecar already throttled exact non-bound UCI information to 100 ms, but the adapter presented every accepted event; genuine iterative-deepening changes therefore reached the label near 10 Hz.
- The RAF controller was not restarting animations: its O(1) mailbox and tau-110 exponential interpolation were already continuous and frame-rate independent.

## Presentation and stability

- White-POV score and Lichess fraction remain unchanged.
- `cp=-340` renders `3.4` on black; `cp=+250` renders `2.5` on white.
- The measured Chromium run observed 0 CSS-pixel edge error in normal and inverted orientations; the executable tolerance remains at most 1 CSS pixel.
- Black text is white (`rgb(255, 255, 255)`); white text is dark (`rgb(64, 61, 57)`).
- One selected sample carries fraction, absolute label, and favored color into the existing RAF.
- On an extreme side reversal, the controller waits only until the newly favored rendered region reaches 12% before moving the label, preventing same-color text during the one-frame crossover.
- The 250 ms gate applies only to ordinary updates. First, >=100 cp, meaningful sign, mate, and terminal changes bypass it.
- No averaging or score rewriting is performed. The raw event, selected presentation, pending candidate, and rendered fraction are separately observable.

## Deterministic Chromium trace

Command: `npm run test:browser:eval-bar-v2`

- 30 FEN/query transitions: 0 neutral resets, 0 DOM remounts, 1 board retarget, 30 stale events rejected, 30 superseded requests aborted.
- Fill and label opacity remained `1` on every captured pending frame.
- Detection latency: min 0.220 ms, average 0.274 ms, max 0.515 ms.
- First simulated evaluation: min 14.330 ms, average 16.085 ms, max 17.570 ms.
- First rendered frame: min 14.350 ms, average 15.570 ms, max 16.350 ms.
- 100 irregular ordinary events were coalesced into one replaceable pending candidate; label remained `3.8` during the burst, the real timer flushed the latest `3.5`, and terminal `cp=360` rendered exactly as `3.6`.
- A delayed flush was blocked after live FEN, authorization, and cache context changed before reconciliation.
- Retained heap delta: 220,284 bytes, below the existing 1.5 MB limit.
- Viewports 900, 959, 960, 961, and 1280 px preserved 20/30 px widths, 10 px gap, colors, typography, alignment, `scaleY()`, and no inline fill height.

## Motion tests

- 100 consecutive irregular targets passed at 30, 60, and 120 FPS.
- Every frame remained between its prior rendered fraction and latest target; no overshoot, reset, or queued RAF accumulation occurred.
- Maximum scheduled RAF count remained one.
- Tau remains 110 ms.

## Real Stockfish/Flask/Chromium

Commands: `npm run test:transport:eval-bar-v2-backend` and `npm run test:browser:eval-bar-v2-backend`

- Stockfish 19 Smallnet identity confirmed: `@lichess-org/stockfish-web@0.5.0`, `sf_19_smallnet`, `nn-61e7af4bb97d.nnue`.
- Transport first evaluation: 47.945 ms; terminal: 8013.122 ms; 12 pre-final depths.
- Chromium first evaluation: 54.900 ms; terminal: 8020.600 ms; 13 pre-final depths.
- Real terminal evaluation `cp=-67` displayed as unsigned `0.7`; orientation inversion preserved the text and moved its physical edge.
- Real mate evaluation displayed immediately as `#1`.
- 167 distinct smooth `scaleY()` frames were observed; no `height` animation was introduced.

## Regression

- `npm test`: 10 files, 112 tests passed.
- `npm run typecheck`, `npm run build`, userscript bundle generation/check: passed.
- `python tests/test_stockfish_eval_bar.py`: 18 tests passed.
- Flask `/health`, Komodo `/getmove`, and legacy `/eval`: passed.
- `node --check script.js` and `git diff --check`: passed.

## Manual limitation

Authenticated live Chess.com DOM inspection was unavailable. The approved existing neutral and mate notation (`0.0`, `#N`) was preserved; exact native notation for those two cases was not independently measured.
