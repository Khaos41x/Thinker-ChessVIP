# Phase 09 — engine selector validation

Validated 2026-10-24 on Windows, Node 22.23.2 and Python 3.12.7 using the already installed assets. No package installation or asset download was performed.

## Implementation

- Backend registry owns exactly three stable engine identities, transactional candidate verification, process ownership, failure rollback, generation guards, request ownership and atomic engine-only preferences.
- Both Stockfish builds import the exact installed `@lichess-org/stockfish-web@0.5.0` modules. Before readiness they verify the entire SHA-256, load the recommended NNUE buffer, complete UCI and evaluate a real starting position.
- Komodo analysis uses a lazily started python-chess runtime at full Skill=25, Threads=3, Hash=16. The existing gameplay singleton retains its production configuration and stays alive across all selector transitions.
- One native select lives in External Config Engine Control. It requires a current authorized analysis/post-game heartbeat and provides Loading, Active, Ready, Not Installed and Error status, with optional diagnostics. Selection does not change Eval Bar enabled state. Background preference polling only discovers status; automatic runtime initialization happens when the enabled Eval Bar requests analysis.
- The existing adapter and EvalBarController remain the sole renderer. Engine/build/network/profile cache identity and selection generations isolate requests and cached scores.

## Real independent benchmarks

Each ordinary position runs for 8000 ms; forced mate positions can terminate earlier according to the engine. Warm initialization is selecting the already verified runtime. CPU percentages sum process CPU across search threads; 100% represents one fully occupied logical CPU. RSS is observed process memory, not network file size. Peak values are sampled at incoming info events and are not a system-wide peak guarantee.

| Engine | Cold / switch ms | Warm ms | First score ms | Initial depth at 8s | Initial CPU % | Sampled peak RSS MiB | Cancel ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| stockfish-19-1mb | 610.3 | 4.25 | 2.78 | 28 | 291.7 | 220.3 | 3.37 |
| stockfish-19-94mb | 1579.2 | 4.59 | 4.82 | 29 | 265.7 | 618.7 | 1.70 |
| komodo-14.1 | 346.9 | 4.24 | 4.31 | 23 | 292.7 | 44.2 | 0.12 |

Full raw timing/depth progression, cp/mate, resources, UCI/NNUE evidence and all switch timings are in [benchmark.json](benchmark.json). The Full NNUE is 98,511,183 bytes (93.95 MiB); its full digest is `1a298aa575a085434d29027978dc36867fe9c5bcea9376654b7a8eba1e52dfc2`. The Smallnet digest is `61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b`.

## Verification

- `python tests/test_analysis_engine_registry.py` (four tests, including focused real native supersession/deadline/process-death and corrupt-network rollback): real Smallnet → Full → Komodo → Smallnet; scores for initial/middlegame/positive and negative mate positions; cancellation, stale request rejection, no cache identity overlap, no retired process leak, failed candidate rollback, preference reload and delayed automatic initialization protection. A deliberately suspended real Komodo proves deadline shutdown and recovery; an actual corrupt NNUE verifies rollback without modifying installed assets. A separate process-death probe confirms Komodo restart after OS-observed exit.
- `python tests/test_analysis_legacy_endpoints.py`: executes the existing `tests/test_server.py` smoke checks on an isolated ephemeral port, then calls legacy `/eval` after every switch and checks that the same Komodo process survives.
- Exact staged-commit validation in a temporary source export also passed deterministic build checks and the 37 Python regressions, preserving HEAD authorization independently of the dirty working tree.
- `python -m unittest tests.test_stockfish_eval_bar tests.test_engine_recovery tests.test_external_config`: 37 passed.
- `npm test --prefix analysis_lab -- --maxWorkers=1 --no-isolate`: 111 passed; TypeScript typecheck passed.
- `node tests/test_analysis_engine_selection.js`: client initialization race and analysis-only selection checks passed.
- `node tests/browser/test_analysis_engine_selector.mjs`: real selector sequence, English labels, Loading/Active, reload, untouched disabled Eval Bar and rejected unauthorized context passed. See [browser.json](browser.json).
- `node tests/browser/test_analysis_engine_eval_bar.mjs`: all real engines stream into one rail, mountCount=1, stable geometry and scaleY-only animation. See [eval-bar-switch.json](eval-bar-switch.json).
- `node tests/browser/test_eval_bar_v2_backend.mjs`: legacy real Smallnet stream, depth progression, orientation, cp/mate labels and smooth animation passed.
- `node tests/browser/test_analysis_engine_visual.mjs`: geometry, typography, scaleY, scrolling and cleanup passed at 900, 959, 960, 961 and 1280 px; 30 obsolete updates rejected and zero DOM remounts. See [visual-regression.json](visual-regression.json).

## Existing work and limitations

The working tree already contains an in-progress authorization/active-game adapter change, alongside rating, knight, banner and investigation changes. Those source changes are preserved and excluded from the Phase 09 commit. The comprehensive legacy visual harness still fails an authorization fixture assertion (`mountedBlockedWhenUnauthorized`; `activePlayDispatches` is timing-sensitive). Phase 09 visual checks exercise geometry and continuity separately and do not claim that the full preexisting harness passed.

Only analysis/post-game requests use the new selector. Existing uncommitted active-game behavior is preserved in the working tree using its legacy Smallnet path. The local commit retains the repository HEAD authorization behavior. The backend engine preference survives server restart; ordinary External Config controls retain their existing reset behavior.

Cold switches briefly overlap candidate and prior analysis processes so the old engine remains available if candidate initialization fails. The old owned analysis process is retired after successful verification; the gameplay Komodo is intentionally independent. Worker evidence reports both configured search threads and observed OS thread count; these are different quantities.

Adversarial and edge-case reviews completed. Fixed installed/runtime asset-path mismatch, blocking native iteration, a superseded-timeout ownership race, and stale automatic initialization overwriting manual choice. No remote push was performed.

## Screenshots

- [Smallnet](stockfish-19-1mb.png)
- [Full Stockfish](stockfish-19-94mb.png)
- [Komodo](komodo-14.1.png)

## Reproduce deterministic builds

```text
python scripts/build_analysis_engine.py
node analysis_lab/scripts/build-userscript-eval-bar.mjs
python scripts/build_userscript.py
python scripts/build_analysis_engine.py --check
node analysis_lab/scripts/build-userscript-eval-bar.mjs --check
python scripts/build_userscript.py --check
node --check script.js
```

Run native/python-chess and Chromium integration checks with ordinary local Windows socket permissions; this environment blocks Python asyncio socketpair creation inside its restricted sandbox.
