# Live Evaluation Streaming Evidence

Date: 2026-10-20  
Command: `npm run test:browser:eval-bar-v2-backend`

The test launched the real Flask service, persistent Stockfish 19 Smallnet sidecar, Vite fixture, and headless Google Chrome. The evaluated FEN was:

`r2q1rk1/pp1bbppp/2np1n2/2p1p3/4P3/2NP1N2/PPPQBPPP/R1B1K2R w KQ - 4 9`

## Observed timeline

| Event | Browser elapsed |
| --- | ---: |
| stream started | 15.0 ms |
| first real evaluation, depth 1 | 93.7 ms |
| depth 13 | 255.4 ms |
| depth 15 | 380.0 ms |
| depth 17 | 601.5 ms |
| depth 18 | 702.7 ms |
| depth 19 | 1,364.6 ms |
| depth 20 | 1,815.8 ms |
| depth 21 | 2,893.4 ms |
| depth 22 | 3,112.1 ms |
| depth 23 | 5,222.2 ms |
| depth 26 | 8,025.3 ms |
| final `bestmove` result | 8,025.4 ms |

The final engine payload identified `Stockfish 19`, package `@lichess-org/stockfish-web@0.5.0`, build `sf_19_smallnet`, and network `nn-61e7af4bb97d.nnue`. The browser observed 188 distinct animation samples using only `scaleY(...)`; the score changed before the final result, orientation inversion changed `-0.8` to `+0.8`, and mate progress rendered as `#1`.

The companion Chromium geometry suite passed at 959, 960, and 961 CSS pixels. It measured the expected 20 px width below the breakpoint and 30 px width at and above it, with 10 px gap and zero top/height alignment delta.
