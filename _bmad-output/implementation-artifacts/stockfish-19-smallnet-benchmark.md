# Eval Bar Engine Benchmark

Search time: 8000 ms; Threads=3, Hash=16 MB, MultiPV=1 for Smallnet.

| Engine | Position | Depth | NPS | Wall ms | CPU % one core | Score |
|---|---|---:|---:|---:|---:|---:|
| Stockfish 19 Smallnet | initial | 29 | 1433468 | 8006.7 | 295.8 | +0.20 |
| Stockfish 19 Smallnet | middlegame | 28 | 1411990 | 8003.4 | 295.6 | -0.69 |
| Stockfish 19 Smallnet | endgame | 36 | 3500536 | 8002.6 | 295.6 | +9.83 |
| Komodo 14.1 | initial | 24 | 3949234 | 8043.9 | 293.7 | +0.25 |
| Komodo 14.1 | middlegame | 26 | 3890196 | 8002.0 | 295.6 | -0.61 |
| Komodo 14.1 | endgame | 28 | 9310010 | 8001.8 | 295.4 | +7.70 |

Smallnet startup: 505.9 ms; mean first evaluation: 5.9 ms.
Smallnet RSS after the run: 210.7 MiB.
Cancellation observed after supersession: 1.1 ms.
Smallnet soak: 30 positions over 30 s; RSS growth +0.9 MiB.
Komodo comparison uses the documented matched search profile (Threads=3, Hash=16 MB, MultiPV=1, Skill=25), not production defaults.
