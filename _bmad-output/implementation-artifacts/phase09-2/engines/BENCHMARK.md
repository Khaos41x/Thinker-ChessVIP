# Controlled engine response comparison

Real installed builds; Threads3, Hash16MiB, MultiPV1. Two repetitions of three identical FENs. Warm transposition tables retained in identical run order; these measurements are not playing-strength comparisons.

| Engine | Budget ms | First score median ms | Complete median ms | Median depth | Peak RSS MiB | Mean CPU % one core | Scores received within200ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| Stockfish 19 · 1MB | 200 | 2.2 | 202.0 | 17.0 | 225.7 | 283.6 | 6/6 |
| Stockfish 19 · 1MB | 1000 | 3.9 | 1005.1 | 21.5 | 225.7 | 212.4 | 6/6 |
| Stockfish 19 · 1MB | 3000 | 1.6 | 3001.5 | 25.5 | 225.7 | 276.1 | 6/6 |
| Stockfish 19 · 94MB | 200 | 2.8 | 202.8 | 14.5 | 725.6 | 269.2 | 6/6 |
| Stockfish 19 · 94MB | 1000 | 1.8 | 1002.2 | 21.0 | 726.5 | 270.0 | 6/6 |
| Stockfish 19 · 94MB | 3000 | 2.0 | 3002.0 | 25.5 | 631.6 | 226.2 | 6/6 |
| Komodo 14.1 | 200 | 4.2 | 202.0 | 16.5 | 44.2 | 244.8 | 6/6 |
| Komodo 14.1 | 1000 | 3.6 | 1002.0 | 19.5 | 44.3 | 240.9 | 6/6 |
| Komodo 14.1 | 3000 | 2.9 | 3002.7 | 22.5 | 44.4 | 218.0 | 6/6 |

Stockfish 19 · 1MB: cold verified startup 744.4ms; warm 0.01ms; cleanup 49.7ms; owned process exited: True.
Stockfish 19 · 94MB: cold verified startup 1516.1ms; warm 0.01ms; cleanup 121.0ms; owned process exited: True.
Komodo 14.1: cold verified startup 762.8ms; warm 0.01ms; cleanup 6.8ms; owned process exited: True.

Requested200ms search time does not guarantee completion within200ms. All engines emitted early evaluations here. Depth is engine-specific and is not a common strength unit.
CPU is relative to one logical core and can exceed100% with three search threads. RSS includes engine/runtime allocations; NNUE file size is distinct. Startup includes UCI readiness and actual network/search verification.
