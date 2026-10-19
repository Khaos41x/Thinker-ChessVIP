---
title: 'Tampermonkey Eval Bar V2 integration'
type: 'feature'
created: '2026-10-19'
status: 'complete'
baseline_commit: '0bcb248e4146f70a4583190f28b591aab93e2f6a'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-analysis-lab-evaluation-v2.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Tampermonkey userscript still uses a duplicated evaluation formula, animated `height`, unguarded asynchronous `/eval` responses, and a permanent polling loop that can expose engine evaluation in active human games.

**Approach:** Bundle the validated Analysis Lab evaluation/controller sources into an IIFE, add a lifecycle-aware Chess.com adapter with fail-closed authorization and bounded caching, and inject the generated region into `script.js` behind the `evalBarV2` rollback flag.

## Boundaries & Constraints

**Always:** Keep Analysis Lab TypeScript as the source of truth; normalize Komodo `/eval` scores from White POV centipawns/mate; gate both V2 and legacy fallback to analysis/review or verified post-game contexts; retain one mailbox sample, one RAF, one active request generation, and a bounded LRU cache; make build output deterministic and idempotent.

**Ask First:** Change the Flask protocol beyond backward-compatible identity echoing, remove the legacy fallback, or alter unrelated automation/UI behavior.

**Never:** Enable evaluation in a live human game, introduce runtime Vite/Stockfish/Chessground dependencies, dynamically import code, animate layout dimensions in V2, accept stale/mismatched responses, or hand-copy the mathematical formulas.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Authorized position | Analysis/review route, valid FEN and Komodo result | Normalize, cache, and animate the White fraction with orientation-correct origin | Reject non-finite/ambiguous data |
| Active game | Live route without verified terminal evidence | No engine request or eval bar | Remove mounted component and abort work |
| Position race | FEN changes while HTTP response is pending | Preserve prior visual as stale; accept only current generation/request | Abort when possible and discard late callbacks |
| SPA remount | Board or route is replaced | Rebind exactly one component and observer | Idempotent cleanup and mount |
| Rollback | `evalBarV2=false` | Use legacy renderer under the same fair-play gate | Never run both renderers |

</frozen-after-approval>

## Code Map

- `analysis_lab/src/analysis/*.ts`, `analysis_lab/src/ui/eval-bar.*` -- shared math, contracts, scheduler, and CSS.
- `frontend/eval_bar/userscript-adapter.ts` -- browser lifecycle, authorization, cache, generation, and DOM adapter.
- `analysis_lab/scripts/build-userscript-eval-bar.mjs` -- IIFE compiler and deterministic `script.js` region injector.
- `script.js` -- Flask transport, feature selection, authorized polling, and generated bundle host.
- `tests/browser/test_eval_bar_v2_chrome.mjs` -- real DOM integration/performance harness.

## Tasks & Acceptance

**Execution:**
- [x] Prefix shared Eval Bar CSS and keep the Analysis Lab consumers aligned.
- [x] Implement the adapter, authorization contract, LRU cache, stale-response barrier, and idempotent lifecycle.
- [x] Add an esbuild IIFE pipeline and generated markers in `script.js`.
- [x] Replace the legacy call path with V2/rollback routing and cancellable authorized requests.
- [x] Add deterministic unit/browser integration coverage and performance metrics.

**Acceptance Criteria:**
- Given an authorized analysis position, when `/eval` returns valid White POV cp or mate, then the shared controller animates only `transform: scaleY()` and the label reflects board orientation.
- Given rapid FEN/route changes, when responses arrive out of order or the board remounts, then only the current request mutates one mounted component and all obsolete resources are released.
- Given an active or uncertain human-game context, when polling runs, then no engine request is issued and no evaluation component is exposed.
- Given either feature-flag state, when the userscript is rebuilt repeatedly, then output is byte-stable and exactly one renderer owns the bar.

## Design Notes

The adapter owns position identity and visual lifecycle while `script.js` retains transport and product settings. The backend already returns White POV centipawns or mate, so no protocol change is required. Authorization is injected and re-evaluated before every request and mount; uncertainty closes the gate.

## Verification

**Commands:**
- `npm run build:userscript-eval-bar --prefix analysis_lab` -- deterministic IIFE injection.
- `npm run typecheck --prefix analysis_lab` -- shared and adapter TypeScript clean.
- `npm test --prefix analysis_lab` -- mathematical and adapter tests pass.
- `npm run test:browser:eval-bar-v2 --prefix analysis_lab` -- DOM lifecycle, races, guardrail, rollback, and profiling pass.
- `python scripts/build_userscript.py --check` -- existing generated region remains current.
- `npm run build --prefix analysis_lab` and `npm run profile:eval-bar --prefix analysis_lab` -- laboratory regressions remain green.

## Implementation Record

- Shared TypeScript and CSS are bundled with esbuild into a deterministic marked region in `script.js`.
- The adapter owns authorization, request generations, FEN and engine scoped LRU caching, SPA lifecycle, DOM ownership, and cleanup.
- The legacy renderer remains available through `evalBarV2=false` and is governed by the same runtime authorization gate.
- Vitest, TypeScript, Vite production build, deterministic bundle checks, Chromium integration, and Chromium profiling passed on 2026-10-19.
- The Chromium integration uses a controlled Chess.com shaped DOM fixture; final selector compatibility on the live Chess.com analysis UI remains an operator smoke test because no authenticated Chess.com browser session was available in this environment.

