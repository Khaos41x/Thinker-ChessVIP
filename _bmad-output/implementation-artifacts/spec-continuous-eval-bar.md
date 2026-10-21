---
title: 'Continuous Eval Bar transitions between Chess.com positions'
type: 'bugfix'
created: '2026-10-20'
status: 'done'
baseline_commit: 'cf43f91d0f9512607ab01c52820a36dd2cf13137'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Eval Bar V2 visually dims to gray and can replace the prior score with a loading glyph while Chess.com changes the selected move. A transiently unavailable FEN can also invoke `reset(0.5)`, breaking continuity even though the controller otherwise preserves its current fraction across `beginSearch()`.

**Approach:** Separate internal freshness from the persistent visual surface: keep the last rendered fill, label, opacity, controller, and DOM instance while a new FEN is pending, then animate from that exact fraction on the first correlated streamed score. Make position detection event-driven through existing SPA/DOM signals with polling retained only as a resilience fallback, and instrument the full transition timing and identity path.

## Boundaries & Constraints

**Always:** Preserve Stockfish 19 Smallnet, the authenticated NDJSON stream, request/generation/FEN correlation, real cancellation on confirmed position replacement, cache isolation, Lichess normalization, `EvalBarController`, Latest-Wins mailbox, `scaleY()`, RAF, tau 110 ms, pixel-perfect colors/geometry/type, analysis-only authorization, and all Komodo behavior. Treat the previous score as stale internal state, never as an evaluation of the next FEN.

**Ask First:** Any backend or transport contract change, dependency upgrade, authorization expansion, or change to the mathematical normalization.

**Never:** Reset the fill to 50% or dim/hide the main surface during a normal position transition; remount for query-only navigation or an equivalent board candidate; accept an event from an obsolete FEN; alter `/eval`, `/getmove`, visual dimensions, or push remotely.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Uncached move | Confirmed new valid FEN | Preserve fill/label/opacity; mark stale internally; cancel prior search; start immediately; animate from current fraction on first info | A stream error remains diagnosable without destroying the retained visual |
| Transient FEN gap | DOM/query changes before Chess.com exposes the next FEN | Retain prior visual and instance; wait for mutation/fallback poll | Do not call `reset(0.5)` or misattribute prior score |
| Rapid navigation | At least 30 FEN/query changes | One DOM/controller instance; only current generation renders; obsolete requests are cancelled/rejected | Record cancellation and stale rejection counts |
| Cache hit | New FEN already cached | Animate continuously to cached target without loading flash | Streaming refresh may continue without replacing the instance |
| True board removal | Board disconnects or route leaves display scope | Idempotent teardown remains allowed | Re-entry mounts exactly one clean instance |

</frozen-after-approval>

## Code Map

- `frontend/eval_bar/userscript-adapter.ts` -- position reconciliation, visual state, request lifecycle, DOM identity, diagnostics, and mutation/SPA reactivity.
- `analysis_lab/src/ui/eval-bar.ts` -- continuous controller state and frame-level snapshots; mathematical animation remains unchanged.
- `analysis_lab/src/ui/eval-bar.css` -- state styling currently dims fill/label during waiting/loading.
- `analysis_lab/src/profile-userscript-eval-bar.ts` -- browser fixture for lifecycle, state, and transition instrumentation.
- `analysis_lab/tests/eval-bar.spec.ts` and `analysis_lab/tests/userscript-eval-bar.spec.ts` -- controller and adapter regression coverage.
- `tests/browser/test_eval_bar_v2_chrome.mjs` -- real Chromium assertions, including 30-position frame trace.
- `script.js` -- regenerated userscript artifact.

## Tasks & Acceptance

**Execution:**
- [x] Instrument transition detection, request start, first accepted score, first changed frame, controller/DOM identity, opacity, fraction, cancellations, and stale rejections without noisy production logging.
- [x] Preserve the rendered surface and controller state across valid-FEN changes and transient missing-FEN windows; remove loading opacity/label mutations from normal transitions.
- [x] Make existing route and DOM observers trigger immediate position reconciliation while retaining bounded fallback polling and idempotent mount/teardown.
- [x] Add unit/browser coverage for 30 rapid query/FEN transitions, cache hits, transient gaps, obsolete events, geometry, and streaming continuity; regenerate `script.js`.

**Acceptance Criteria:**
- Given a visible evaluated position, when 30 positions are selected rapidly through `?move=N`, then every captured frame keeps fill opacity at 1, never resets to 0.5, retains one rail/controller instance, and preserves geometry.
- Given the first valid streamed evaluation for each current FEN, when it is accepted, then the next visual motion begins from the existing fraction with tau 110 ms and no old-FEN event mutates the current label or fill.
- Given a transient missing FEN during SPA navigation, when the valid FEN becomes available, then detection and request dispatch occur from observer/history signals without waiting for the periodic poll.
- Existing frontend, typecheck, build, userscript, real Smallnet transport, Flask/Komodo, and Chromium suites pass.

## Spec Change Log

## Design Notes

`waiting`, `loading`, `stale`, and `fresh` remain diagnostic/controller lifecycle states, but only `error` may add a visible fault affordance. Normal freshness changes must not alter the fill or score surface. A retained score is provenance-bound to its old FEN until a correlated sample for the new generation is accepted.

## Verification

**Commands:**
- `npm test`, `npm run typecheck`, `npm run build`, `npm run build:userscript-eval-bar` in `analysis_lab` -- all frontend and bundle checks pass.
- `npm run test:browser:eval-bar-v2` -- 30-position per-frame trace satisfies continuity, identity, timing, and geometry assertions.
- `npm run test:transport:eval-bar-v2-backend` -- real Smallnet/Flask stream still emits multiple pre-final evaluations.
- `python tests/test_stockfish_eval_bar.py` and `python tests/test_server.py` -- engine isolation and legacy Komodo endpoints pass.
- `git diff --check` and `node --check script.js` -- generated artifact and patch are valid.

## Suggested Review Order

**Continuous position lifecycle**

- Reconciliation preserves the rendered surface while advancing request generation and provenance.
  [`userscript-adapter.ts:460`](../../frontend/eval_bar/userscript-adapter.ts#L460)

- Equivalent replacement boards retarget geometry without remounting the controller or rail.
  [`userscript-adapter.ts:782`](../../frontend/eval_bar/userscript-adapter.ts#L782)

- Missing boards receive a bounded replacement grace period before idempotent teardown.
  [`userscript-adapter.ts:1064`](../../frontend/eval_bar/userscript-adapter.ts#L1064)

- Route bursts detect property-only FEN changes without making polling the primary mechanism.
  [`userscript-adapter.ts:1099`](../../frontend/eval_bar/userscript-adapter.ts#L1099)

**Rendering and provenance**

- Frame callbacks bind rendered-FEN provenance to an actual committed animation frame.
  [`eval-bar.ts:140`](../../analysis_lab/src/ui/eval-bar.ts#L140)

- Pending lifecycle states no longer dim or replace the persistent visual surface.
  [`eval-bar.css:72`](../../analysis_lab/src/ui/eval-bar.css#L72)

- Correlated streamed results alone clear stale state and update the target fraction.
  [`userscript-adapter.ts:657`](../../frontend/eval_bar/userscript-adapter.ts#L657)

**Regression evidence**

- Browser fixture drives thirty transitions, board replacement, cache, and reactive FEN cases.
  [`profile-userscript-eval-bar.ts:492`](../../analysis_lab/src/profile-userscript-eval-bar.ts#L492)

- Chromium assertions enforce opacity, identity, geometry, latency, and obsolete-event rejection.
  [`test_eval_bar_v2_chrome.mjs:251`](../../tests/browser/test_eval_bar_v2_chrome.mjs#L251)

- Controller tests confirm first-frame reporting without changing interpolation behavior.
  [`eval-bar.spec.ts:1`](../../analysis_lab/tests/eval-bar.spec.ts#L1)

- Reproducible measurements document both frame continuity and real Smallnet streaming.
  [`continuous-eval-bar-evidence.md:1`](continuous-eval-bar-evidence.md#L1)
