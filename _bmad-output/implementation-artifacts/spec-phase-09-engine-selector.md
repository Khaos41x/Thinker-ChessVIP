---
title: 'Phase 09: unified analysis engine selector'
type: feature
created: '2026-10-24'
status: done
baseline_commit: '79de3e7'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="Implementation authorized in the Phase 09 user request">

## Intent

**Problem:** Eval Bar V2 supports only Smallnet despite three installed analysis engines. Users need one compact selector that truthfully reports runtime readiness and preserves existing behavior.

**Approach:** Extend the current Node/WASM sidecar for both exact Lichess builds, add a backend registry and transactional switching, and connect one selector through existing configuration, transport and controller infrastructure.

## Boundaries & Constraints

**Always:** Support exactly stockfish-19-1mb, stockfish-19-94mb and komodo-14.1. Verify full NNUE SHA-256 and actual network loading/search before readiness. Preserve White POV, mate semantics, FEN correlation, latest-wins, cache isolation, persistence, animation and geometry. Only authorized analysis/post-game contexts may select engines. Keep selection separate from Eval Bar enablement and preserve saved preferences. New installations default to Smallnet. Preserve unrelated dirty files and include only feature changes in a local commit.

**Ask First:** Any destructive or unrelated change, remote push, missing asset download or package reinstall.

**Never:** Replace Lichess builds with another distribution, reset existing settings, rebuild the Eval Bar DOM when switching, change competitive authorization or silently reroute legacy /eval or /getmove. Do not terminate Komodo used by another subsystem. Do not commit binary/network/database assets or secrets. All UI labels are English.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Switching | Smallnet → Full → Komodo → Smallnet | Verified runtime selected, obsolete analysis canceled, new FEN evaluated with engine identity | Previous working engine restored on startup failure |
| Unavailable | Missing executable/network or corrupt NNUE | Registry reports Not Installed or Error, no false Active state | Explicit error and prior selection retained |
| Stale work | FEN or engine changes during streaming | Engine ID and generation isolate requests, caches and rendering | Discard obsolete scores |
| Preferences | Existing saved settings, reload or cross-tab update | Engine retained without changing enabled state | Invalid engine rejected safely |
| Legacy | /eval or /getmove while analysis engine changes | Existing Komodo path and configuration retained | Analysis shutdown only owns its runtime |
| Unauthorized | Competitive active-game context | Engine switching and evaluation blocked | Existing capability/context checks retained |

</frozen-after-approval>

## Code Map

- `analysis_lab/scripts/stockfish-eval-bar-service.mjs`: persistent sidecar, UCI parsing, verified NNUE buffers and workers.
- `core/eval_bar/stockfish_service.py`: subprocess ownership, streaming, cancellation and lifecycle.
- `core/eval_bar/registry.py`: new registry, switch transaction, readiness, configuration and resource reporting.
- `app.py`: authenticated registry/switch endpoints, correlated evaluation dispatch; existing Komodo routes stay intact.
- `core/external_config/`, `frontend/external_config/` and userscript source modules: schema, persistence, synchronization and compact selector.
- `frontend/eval_bar/userscript-adapter.ts`: existing controller integration; preserve current unrelated changes.
- `scripts/build_userscript.py`: deterministic generation entry point.

## Tasks & Acceptance

**Execution:**
- [x] Extend installed Lichess sidecar and Python service with explicit build identity, full digest validation, actual initialization proof and clean shutdown.
- [x] Implement registry and isolated native Komodo analysis adapter reusing python-chess UCI integration, without touching the legacy singleton.
- [x] Wire protected Flask registry/select endpoints and engine-scoped analysis streams with transactional recovery and bounded concurrency.
- [x] Add compact accessible selector in existing Engine Control, optional diagnostics, English status feedback and preference synchronization.
- [x] Isolate cache and request identity per engine; cancel and refresh through the existing controller without mounting it again or enabling it automatically.
- [x] Add real-engine integration and failure tests plus reproducible independent benchmarks; capture switch, CPU/RSS, depth, first score, cancellation and cleanup results.
- [x] Run UI regression/browser checks, capture screenshots, regenerate deterministic userscript, review and commit only feature paths locally.

**Acceptance Criteria:**
- Given installed assets, when each engine initializes, then full digest/network identity (Stockfish), UCI handshake and a real search prove readiness before Active is reported.
- Given authorized analysis, when the complete switching sequence runs, then all real engines evaluate FENs and no old engine score enters the current stream/cache.
- Given an initialization failure, when selection fails, then the last functioning runtime and preference remain selected and the UI explains the error.
- Given reload or external configuration synchronization, when settings are restored, then selected engine persists independently of Eval Bar enabled state.
- Given a switch, when a search resumes, then the same EvalBarController/DOM, RAF, scaleY, tau=110 ms and geometry remain in use.
- Given legacy endpoint tests, when analysis switches, then Komodo gameplay consumers retain their behavior and owned process.

## Spec Change Log

## Design Notes

The legacy Komodo singleton owns gameplay locks and mutable strength profiles. A lazily allocated analysis-owned python-chess runtime avoids changing that subsystem and permits safe cancellation; it exists only while Komodo is the selected analysis engine. Switching may briefly overlap old and candidate runtimes to verify before retiring the old one. The registry must serialize switch operations, invalidate old stream generations and retire only owned runtimes. Requested engine identity is mandatory for selector clients; older Smallnet clients remain compatible. Network file size is reported separately from runtime RSS and worker/thread count. Full NNUE uses the existing analysis_lab copy without downloads.

The user's complete implementation authorization covers this spec and proceeding through workflow checkpoints. No additional approval is needed for the dirty tree because preserving it was expressly requested.

## Verification

- Real engine unittest suite plus existing Stockfish and engine recovery tests.
- TypeScript typecheck and Vitest controller/adapter/presentation suites.
- Real Flask/Chromium switching fixture, existing geometry regressions and screenshots.
- Independent benchmark JSON/Markdown for each engine and all transitions.
- Deterministic build twice, build check, node syntax check and focused git staged diff before commit.

## Suggested Review Order

- Registry verifies candidates before replacing the active owned runtime.
  [registry.py:283](../../core/eval_bar/registry.py#L283)
- Selector endpoints preserve analysis authorization and loopback configuration access.
  [routes.py:6](../../core/eval_bar/routes.py#L6)
- Installed Lichess NNUE buffers must produce a scored startup search.
  [stockfish-eval-bar-service.mjs:147](../../analysis_lab/scripts/stockfish-eval-bar-service.mjs#L147)
- Client discovery and conditional initialization preserve newer manual selections.
  [engine-selection.js:1](../../frontend/eval_bar/engine-selection.js#L1)
- Compact control displays runtime state and optional diagnostics.
  [panel.js:40](../../frontend/external_config/panel.js#L40)
- Real-engine evidence covers performance, lifecycle, persistence and visual geometry.
  [report.md](phase09-engine-selector/report.md)
