# Elo Calibration Benchmark — Official V1 Preparation

Date: 2026-10-12

## Frozen environment

- Hardware: `intel-xeon-gold-5420plus-2ghz_logical4_ram16gib_windows-10.0.26200`
- Time control: fixed 500 ms per move
- Concurrency: 4 paired matches; one thread per engine
- Hash: 128 MiB per engine
- MultiPV: 1
- Ponder and tablebases: disabled
- Search isolation: clear hash and `isready` before each move

## Verified assets

| Asset | Upstream | SHA-256 |
|---|---|---|
| Komodo 14.1 64-bit executable | Local licensed engine | `51916850787cacc7716e86bd446feb335393ef8fc122dfe6958595fd33a0f040` |
| Stockfish 19 universal Windows archive | <https://github.com/official-stockfish/Stockfish/releases/download/sf_19/stockfish-windows-x86-64-universal.zip> | `3c8bf1f9ea66a09350a40df4f632288285ac206d99f33ab5842c408fc30b48a7` |
| Stockfish 19 universal Windows executable | Extracted official archive | `45bc8e4969147db9c2eb533810637994619bff0eacc81ccfd9854394901bcbd0` |
| 8moves_v3 archive | <https://raw.githubusercontent.com/official-stockfish/books/master/8moves_v3.pgn.zip> | `7e1e9dd118b4bb97d8a8b5b8a790c86e21f8509d59a27d2883767d94477be02e` |
| 8moves_v3 PGN | Extracted official archive | `5835239f88cc2c7511b177c32392a69f3ede21819cf0616f80a7f907cd21d17e` |

The normalized corpus SHA-384 SRI is `hnlrIvi1xbnTt8z3AM2LW87YUCNsrcTTjqlAUBRf80SUCx9Zaq2hlntlimtoEBIn`, matching the official Stockfish books catalog.

## UCI identities

- Subject: `Komodo 14.1 64-bit`; authors `Don Dailey, Larry Kaufman, Mark Lefler`
- Reference: `Stockfish 19`; author `the Stockfish developers (see AUTHORS file)`

## Mixed-load preflight

- Report: `benchmark-runs/official-v1/preflight-mixed-final.json`
- Report SHA-256: `b9f9e858d8fe9679d41484f06c5019e712d8441c737a3319cd5ee003e60d06bb`
- Verdict: pass; safe recommendation: 4 workers
- Komodo loaded pooled NPS: `1104184.6138221184`; isolated-to-loaded drift: `9.3432%`
- Stockfish loaded pooled NPS: `588081.3149566855`; isolated-to-loaded degradation: `0%`

The loaded measurement keeps four Komodo and four Stockfish processes resident simultaneously. The Stage 1 manifest obtains its hardware fingerprint, engine hashes, worker approval, and Komodo NPS baseline directly from this passing report.

## Stage 1 immutable schedule

- Manifest: `benchmark-runs/official-v1/stage1/manifest-final.json`
- Embedded manifest SHA-256: `2d529ae57a7e493cf2765635d9ff81493d14a09d1607f0c7bd10c51f503dbcc0`
- File SHA-256: `38813e34fe1f62c47c2254b7e6f5a53951d678669c54adb56438c2ac9f8985ab`
- Schedule: 1,320 paired records / 2,640 games
- Skills: 0, 2, 5, 8, 11, 14, 17, 20, 23, 25
- References: Stockfish UCI_Elo 1320, 1500, 1700, 1900, 2100, 2300, 2500, 2700, 2900, 3050, 3190
- Openings: 12 deterministic, color-reversed positions per Skill/reference cell

Stage 2 and Stage 3 schedules are intentionally generated only from the completed preceding-stage estimates. Creating them before those measurements would reintroduce an unmeasured rating heuristic.
