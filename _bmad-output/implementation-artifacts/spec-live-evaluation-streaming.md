---
status: done
baseline_commit: 742b6e0eed7822448ae98246fb8f01ac727400fc
---

# FASE 06.1 — Live Evaluation Streaming

## Intent

Deliver real, progressive Stockfish 19 Smallnet evaluations to Eval Bar V2 in authorized Chess.com analysis/review/training contexts. Preserve the existing pixel-perfect UI, Lichess mathematics, animation controller, cache, SPA lifecycle, Komodo behavior, and legacy endpoints.

## Confirmed cause

`UserscriptEvalBar` refreshes every 5,000 ms and currently aborts an active request before starting another. The Smallnet reference search lasts 8,000 ms, so an uncached position can be cancelled forever and remain `loading`. Separately, the Node sidecar parses UCI `info` lines but retains only the latest value and emits it only after `bestmove`; the Python manager and Flask endpoint are single-result, and the userscript clears its request handle on the first result. `/analysis/collection/.../analysis?move=18` is authorized; its route matcher is not the failure.

## Invariants

- Stockfish profile remains `sf_19_smallnet`, NNUE `nn-61e7af4bb97d.nnue`, Threads 3, Hash 16 MB, MultiPV 1, movetime 8,000 ms.
- `/eval` and `/getmove` remain Komodo-backed and unchanged; `/eval-bar` keeps its final JSON contract.
- EvalBarController, `scaleY()`, tau 110 ms, RAF, Lichess score-to-fill formula, colors, geometry, cache, and feature flag remain unchanged.
- Assistance remains unavailable during active competitive play.
- Every streamed item is correlated and stale-safe; cancellation remains real and idempotent.

## Implementation

1. **Node sidecar:** emit actual UCI `info` messages for the active non-stopping search, normalized to White POV, with monotonic `seq`, `depth`, `seldepth`, `nodes`, `nps`, engine time, `cp`/`mate`, and bound metadata. Emit the first usable score immediately, throttle later publications to about 100 ms, flush an unreported latest score before the terminal `result`, and never synthesize scores.
2. **Python manager:** add a streaming subscription per request using a bounded latest-value mailbox plus a guaranteed terminal slot. Scope delivery, failures, cancellation, and restart to the exact process generation. Add compare-and-swap restart protection. Expose `evaluate_stream()` while preserving `evaluate()` and its final-result API.
3. **Flask:** add authenticated `POST /eval-bar/stream` returning `application/x-ndjson`. Validation/authentication errors occur before headers; post-header failures become terminal NDJSON events. Each event repeats `requestId`, client `generation`, `cacheContext`, FEN, perspective, status, and sequence. Disable buffering/transforms and cancel the engine when the response iterator closes. Hold the concurrency lease for the stream lifetime.
4. **Userscript transport:** consume incremental NDJSON through a stream-capable Tampermonkey request, validating correlation on every item. Partial events update the controller and label without closing the request; only terminal result/error closes it. Expose transport/init/timeout/abort details in diagnostics without normal console noise.
5. **Adapter:** never abort an active same-FEN request merely because refresh elapsed; measure refresh from terminal completion. Still cancel on FEN/context replacement, invalid/unavailable FEN, authorization loss, disconnect, timeout, deactivate, or destroy. Ignore stale sequence/generation/FEN events. Preserve the last valid visual score if a later stream fails.
6. **Chess.com analysis route:** cover collection-analysis URLs including query-only ply changes. Keep the component mounted when authorization and board identity are stable; reconcile FEN without duplicate instances. Permit cached-game FEN fallback only when board elements are identical or contain one another.

## Acceptance evidence

- An unresolved 8 s request survives the 5 s refresh boundary with zero refresh aborts.
- Real Smallnet + Flask emits at least two distinct depth evaluations before `bestmove`; the first changes textual score and fill before final completion.
- Rapid FEN replacement cancels the old search and no old event reaches the UI.
- Interrupted stream and sidecar timeout expose diagnostics, release resources, and recover on the next request.
- `/analysis/collection/.../analysis?move=18` mounts once, acquires a valid FEN, streams, and remains aligned.
- Komodo `/eval` and `/getmove` regression tests pass unchanged.
- Unit, backend, build/typecheck/userscript validation, real-engine integration, and Chromium E2E pass. Record first-evaluation latency, depth sequence, final latency, and visual/DOM evidence.

## Tasks & Acceptance

- [x] Emit throttled, correlated, real UCI depth events from the Smallnet sidecar before `bestmove`.
- [x] Stream events safely through the Python manager and authenticated Flask NDJSON endpoint.
- [x] Consume partial events in the userscript without closing the active request or accepting stale data.
- [x] Remove interval-driven cancellation while retaining FEN/context/timeout cancellation.
- [x] Cover collection-analysis routing, nested-board FEN resolution, interruption, restart, and Komodo isolation.
- [x] Regenerate `script.js`; pass all regression, typecheck, build, userscript, real-engine, Flask, and Chromium checks.
- [x] Capture at least two real pre-final UI updates with first-event latency and depth sequence.

## Files expected to change

- `analysis_lab/scripts/stockfish-eval-bar-service.mjs`
- `core/eval_bar/stockfish_service.py`
- `app.py`
- `frontend/eval_bar/userscript-adapter.ts`
- `frontend/eval_bar/userscript-entry.ts`
- relevant tests and generated `script.js`

## Out of scope

No visual redesign, mathematical rewrite, Komodo replacement, competitive live-play assistance, remote deployment, dependency upgrade, or push to a remote repository.

## Suggested Review Order

**Streaming boundary**

- Start with the authenticated NDJSON contract and terminal-event guarantees.
  [`app.py:1377`](../../app.py#L1377)

- Follow process-scoped mailboxes, deadlines, cancellation, and restart recovery.
  [`stockfish_service.py:174`](../../core/eval_bar/stockfish_service.py#L174)

- Verify concurrency leases remain held for each stream lifetime.
  [`security.py:130`](../../core/smart_pacing/security.py#L130)

**Real UCI progress**

- Inspect immediate first-info publication, throttling, sequence, and White-POV bounds.
  [`stockfish-eval-bar-service.mjs:111`](../../analysis_lab/scripts/stockfish-eval-bar-service.mjs#L111)

- Confirm final flushing and `bestmove` termination preserve the 8-second search.
  [`stockfish-eval-bar-service.mjs:132`](../../analysis_lab/scripts/stockfish-eval-bar-service.mjs#L132)

**Userscript lifecycle**

- Review starvation removal: active same-position searches survive refresh intervals.
  [`userscript-adapter.ts:482`](../../frontend/eval_bar/userscript-adapter.ts#L482)

- Review progressive rendering, bound handling, and stale-sequence rejection.
  [`userscript-adapter.ts:584`](../../frontend/eval_bar/userscript-adapter.ts#L584)

- Inspect production Tampermonkey NDJSON parsing, correlation, and real cancellation.
  [`script.js:3031`](../../script.js#L3031)

- Confirm nested-board FEN fallback remains constrained to the selected board.
  [`script.js:3001`](../../script.js#L3001)

**Verification**

- See real-engine depth progression, timeout recovery, and Komodo isolation tests.
  [`test_stockfish_eval_bar.py:346`](../../tests/test_stockfish_eval_bar.py#L346)

- See the Chromium fixture driving real Flask and Smallnet streams into the controller.
  [`profile-userscript-eval-bar-backend.ts:11`](../../analysis_lab/src/profile-userscript-eval-bar-backend.ts#L11)

- Review captured first-evaluation latency and pre-final depth evidence.
  [`live-evaluation-streaming-evidence.md:1`](live-evaluation-streaming-evidence.md#L1)
