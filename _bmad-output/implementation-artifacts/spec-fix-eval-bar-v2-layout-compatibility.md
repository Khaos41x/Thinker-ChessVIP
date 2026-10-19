---
title: 'Fix Eval Bar V2 layout compatibility and diagnostics'
type: 'bugfix'
created: '2026-10-19'
status: 'done'
baseline_commit: 'bc46dc549296622bab46beca2d3470f3a730340c'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-userscript-eval-bar-v2.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Eval Bar V2 uses the engine-authorization decision as its visual mount gate, so `/play/online` and other supported board layouts unmount silently. Board selection and FEN discovery also depend on brittle first-match/private-object assumptions, leaving no actionable state when geometry, FEN, or Flask fails.

**Approach:** Separate visual eligibility from engine-data authorization, introduce ranked Chess.com board/FEN discovery, and expose explicit waiting/unavailable/error states plus opt-in diagnostics. Preserve the shared controller, fair-play gate, request lifecycle, cache, animation, and generated userscript architecture.

## Boundaries & Constraints

**Always:** Keep the visual overlay reusable and non-invasive; mount it on supported Chess.com board surfaces even when engine data is unavailable; permit Flask/Komodo requests only in analysis/review or verified post-game contexts; validate FEN and White-POV `cp`/`mate`; preserve `scaleY()`, mailbox latest-wins, τ=110 ms, RAF, monotonic request IDs, contextual LRU, HTTP cancellation, SPA cleanup, and `evalBarV2`.

**Ask First:** Change the `/eval` response contract incompatibly, remove the legacy rollback renderer, or broaden engine authorization beyond analysis/review and verified post-game evidence.

**Never:** Query or expose engine evaluation during an active competitive game; mutate Chess.com board/container geometry; animate V2 with `style.height`; duplicate mounted instances; continuously log while diagnostics are disabled; commit engine binaries, databases, or secrets.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Analysis layout | Visible supported board and valid FEN | Mount, align, request, animate fresh score | Reject invalid/stale/mismatched results |
| Active online game | `/play/online`, visible board, no terminal evidence | Mount visual shell without engine request | Show identifiable unavailable state |
| Missing/invalid FEN | Eligible UI with no valid position | Keep overlay mounted | Show waiting state; do not request |
| SPA/layout change | Route, board, orientation, scroll, or size changes | Re-select and realign one instance | Abort obsolete work and clean observers |
| Backend failure | Timeout, HTTP/auth/parse failure | Preserve safe prior visual if any | Mark error/disconnected and diagnose opt-in |
| Simulated score | Test/debug transport publishes cp or mate | Render and animate independently of Flask | Apply normal validation and stale barriers |

</frozen-after-approval>

## Code Map

- `frontend/eval_bar/userscript-adapter.ts` -- authorization/presentation split, lifecycle, state, diagnostics, geometry, cache, and requests.
- `analysis_lab/src/ui/eval-bar.ts` and `analysis_lab/src/ui/eval-bar.css` -- shared transform renderer and visible state styling.
- `script.js` -- Chess.com board/FEN/orientation discovery, Flask transport, flags, and generated IIFE host.
- `app.py` -- `/eval` White-POV score contract and compatible request identity echo.
- `analysis_lab/tests/userscript-eval-bar.spec.ts` and browser fixtures -- layout, lifecycle, races, failures, simulation, cache, and geometry coverage.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/eval_bar/userscript-adapter.ts` -- decouple display from data authorization; add explicit state/diagnostic snapshots and robust idempotent lifecycle.
- [x] `script.js` -- implement ranked board discovery, validated multi-source FEN/orientation discovery, diagnostic toggle, and safe Flask wiring.
- [x] `analysis_lab/src/ui/eval-bar.css` -- style waiting/unavailable/error states without changing board geometry or fill animation.
- [x] `app.py` -- preserve score semantics and echo optional correlation fields needed for observability without breaking old clients.
- [x] `analysis_lab/tests/*` and `tests/browser/*` -- cover all matrix cases, multiple layouts, SPA replacement, hidden/misaligned boards, concurrency, cache, simulation, and no duplicates.
- [x] Rebuild `script.js` from TypeScript and verify deterministic output.

**Acceptance Criteria:**
- Given any supported visible Chess.com board, when layout, viewport, scroll, or SPA route changes, then exactly one overlay remains aligned left/right/overlay without altering the host layout.
- Given an active competitive game, when Eval Bar V2 is enabled, then its visual status may mount but no engine request or score is exposed.
- Given a valid authorized position and a current `cp` or `mate` response, when it arrives, then the label and orientation-correct fill update immediately and animate exclusively via `transform: scaleY()`.
- Given diagnostics are disabled, when normal polling runs, then no continuous console output is produced; when enabled, one inspectable snapshot reports route, board, FEN, adapter, mount, geometry, score, connection, and last error.

## Spec Change Log

## Design Notes

The adapter will own two decisions: presentation eligibility and engine authorization. Board discovery will rank connected, visible, square-like candidates rather than trust DOM order. Data discovery may inspect known board/game properties and FEN-bearing attributes, but every candidate must pass strict six-field FEN validation before transport.

## Verification

**Commands:**
- `npm run typecheck --prefix analysis_lab` -- TypeScript clean.
- `npm test --prefix analysis_lab` -- unit and adapter tests pass.
- `npm run build:userscript-eval-bar --prefix analysis_lab` twice -- generated region is byte-stable.
- `npm run build --prefix analysis_lab` -- production build succeeds.
- `npm run test:browser:eval-bar-v2 --prefix analysis_lab` -- Chromium behavior and animation checks pass when browser exists.
- `python tests/test_server.py` -- backend regression suite passes.
- `python scripts/build_userscript.py --check` -- userscript generated regions remain current.

**Manual checks:**
- In Tampermonkey on Chess.com analysis/review and online layouts, verify actual board alignment, waiting/error/fresh transitions, score updates, orientation, animation, SPA navigation, and zero live-game engine requests.

## Review Outcome

Blind and edge-case reviews produced six actionable patches: viewport-aware board selection, immediate History API lifecycle handling, terminal-state correlation, stricter FEN validation, safe score preservation on refresh errors, selected-board orientation, unique integration-test ports, and backward-compatible `/eval` errors. All were applied and the complete verification suite was repeated.

## Suggested Review Order

**Authorization and discovery**

- Entry point separates visual availability from fail-closed engine authorization.
  [`userscript-adapter.ts:113`](../../frontend/eval_bar/userscript-adapter.ts#L113)

- Ranked discovery rejects hidden, offscreen, undersized, and non-square board candidates.
  [`userscript-adapter.ts:157`](../../frontend/eval_bar/userscript-adapter.ts#L157)

- Multi-source FEN validation blocks malformed and structurally illegal positions before transport.
  [`userscript-adapter.ts:187`](../../frontend/eval_bar/userscript-adapter.ts#L187)

**Lifecycle and rendering**

- Adapter owns SPA hooks, polling, cancellation, contextual cache, and stale-result barriers.
  [`userscript-adapter.ts:336`](../../frontend/eval_bar/userscript-adapter.ts#L336)

- Geometry remains isolated while tracking board resize, scroll, and viewport placement.
  [`userscript-adapter.ts:745`](../../frontend/eval_bar/userscript-adapter.ts#L745)

- Controller reset preserves transform-only rendering and the existing RAF interpolation.
  [`eval-bar.ts:85`](../../analysis_lab/src/ui/eval-bar.ts#L85)

**Backend and userscript integration**

- `/eval` validates positions, returns White-POV cp/mate, and echoes request identity compatibly.
  [`app.py:1262`](../../app.py#L1262)

- Userscript transport validates HTTP, payload errors, identity, timeout, and authorization expiry.
  [`script.js:3007`](../../script.js#L3007)

- Diagnostics expose route, FEN, mount, geometry, connection, score, and last error on demand.
  [`script.js:3091`](../../script.js#L3091)

**Verification**

- Real Chromium fixture drives Flask and Komodo through cp, mate, orientation, and animation.
  [`profile-userscript-eval-bar-backend.ts:11`](../../analysis_lab/src/profile-userscript-eval-bar-backend.ts#L11)

- Unit coverage exercises authorization, stale DOM evidence, viewport ranking, and FEN rejection.
  [`userscript-eval-bar.spec.ts:40`](../../analysis_lab/tests/userscript-eval-bar.spec.ts#L40)
