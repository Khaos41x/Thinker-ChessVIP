---
title: 'Match Eval Bar V2 to native Chess.com rendering'
type: 'refactor'
created: '2026-10-19'
status: 'done'
baseline_commit: '27a3669790e7ed0e73365490a10a7b4e50c6aeae'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fix-eval-bar-v2-layout-compatibility.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Eval Bar V2 is functionally correct but its 28 px rail, 6 px gap, near-black/gray palette, 4 px radius, shadow, vertical monospace label, and offsets visibly differ from the native Chess.com analysis bar.

**Approach:** Apply measurements captured from the live Chess.com `/analysis` DOM at matched zoom and viewports to the existing overlay CSS and its geometry calculation, then assert the measured geometry, colors, typography, orientation, resize, and scroll behavior without changing evaluation behavior.

## Boundaries & Constraints

**Always:** Use measured native values; centralize visual tokens as CSS custom properties; keep rail height and top equal to the board; preserve left-first/right-fallback overlay placement and zero host-layout mutation; keep the existing error/waiting states identifiable; regenerate the embedded `script.js` bundle.

**Ask First:** Change any engine/data behavior, controller semantics, score formatting, authorization, lifecycle, cache, or request code; introduce a new runtime dependency; change native measurements without new DOM evidence.

**Never:** Replace `transform: scaleY()`; change τ=110 ms, RAF, latest-wins mailbox, normalization, LRU, cancellation, or Flask/Komodo integration; use approximate colors when measured RGB values exist; animate `height`; modify Chess.com DOM geometry.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Compact viewport | Width through 959 CSS px | 20 px rail, 10 px board gap, exact board top/height | Fall back inside viewport without host mutation |
| Desktop viewport | Width from 960 CSS px | 30 px rail, 10 px board gap, exact board top/height | Recompute on resize |
| White orientation | Standard board | White fill grows from bottom; score sits upright at bottom | Existing waiting/error states remain visible |
| Black orientation | Flipped board | Fill grows from top; score sits upright at top | Preserve mathematical perspective behavior |
| Scroll/resize | Board moves or resizes | Geometry delta remains at most 1 CSS px | Hide rail when board has no layout box |

</frozen-after-approval>

## Code Map

- `analysis_lab/src/ui/eval-bar.css` -- visual tokens, native palette, rail shape, score typography, responsive width, and state styling.
- `frontend/eval_bar/userscript-adapter.ts` -- overlay width/gap consumption and measured geometry snapshot.
- `analysis_lab/src/profile-userscript-eval-bar.ts` -- browser fixture geometry, computed-style, orientation, resize, and scroll assertions.
- `tests/browser/test_eval_bar_v2_chrome.mjs` -- Chromium acceptance gate for pixel deltas and RGB/style equality.
- `script.js` -- generated userscript artifact containing the updated CSS and adapter geometry.

## Tasks & Acceptance

**Execution:**
- [x] `analysis_lab/src/ui/eval-bar.css` -- replace handcrafted styling with measured native tokens: dark `rgb(64,61,57)`, light `rgb(255,255,255)`, draw reference `rgb(119,117,116)`, 2 px radius, no normal-state border/shadow, system 600 10 px/14.3 px label with 5 px vertical padding, responsive 20/30 px width.
- [x] `frontend/eval_bar/userscript-adapter.ts` -- read width and gap CSS variables for overlay placement so CSS remains the visual source of truth.
- [x] Browser fixture and tests -- verify 959, 960, and 961 px viewport widths, 10 px gap, ≤1 px alignment delta, exact computed colors/type/radius/shadow, flipped label placement, and scroll/resize realignment.
- [x] Rebuild `script.js` deterministically and run the complete Eval Bar regression suite.

**Acceptance Criteria:**
- Given 959, 960, and 961 CSS px viewports plus the measured 900×700 and 1280×720 conditions, when V2 renders, then its 20/30 px breakpoint, height, top, and 10 px board gap differ from native by no more than 1 CSS pixel.
- Given fresh white and black orientations, when scores animate, then rail/fill colors match native RGB values, the score remains upright at the native edge, and fill updates only through `scaleY()`.
- Given a resize or scroll, when geometry tracking runs, then alignment returns within 1 CSS pixel without duplicate roots or board/container style changes.

## Spec Change Log

- Review hardened the browser fixture to render a real fresh score and prove upright text, `scaleY()`-only updates, host preservation, and right/overlay placement fallbacks.

## Design Notes

Measured native facts: at 900×700 the board was 528 px and the bar 20 px; at 1280×720 the board was 584 px and the bar 30 px; the width breakpoint is 960 CSS px; both used a 10 px gap and exact vertical equality. Native colors were black `rgb(64,61,57)`, draw `rgb(119,117,116)`, and white `rgb(255,255,255)`. The rail used 2 px radius, no border or shadow. The abbreviated score used the system UI stack, weight 600, size 10 px, line-height 14.3 px, centered with 5 px vertical padding and a 24.296875 px box. Native flipping rotated the bar and counter-rotated the label; V2 may retain its equivalent origin/top-edge implementation because it preserves upright text and identical visible placement.

## Verification

**Commands:**
- `npm run typecheck --prefix analysis_lab` -- TypeScript remains clean.
- `npm test --prefix analysis_lab -- --maxWorkers=1 --no-isolate` -- unit and artifact tests pass.
- `npm run build:userscript-eval-bar --prefix analysis_lab` twice -- embedded output is byte-stable.
- `npm run build --prefix analysis_lab` -- production build succeeds.
- `npm run test:browser:eval-bar-v2 --prefix analysis_lab` -- Chromium geometry/style/orientation/resize/scroll assertions pass.
- `npm run test:browser:eval-bar-v2-backend --prefix analysis_lab` -- real backend rendering remains functional.
- `python -m unittest tests.test_engine_recovery` -- backend behavior remains unchanged.
- `python scripts/build_userscript.py --check` and `node --check script.js` -- userscript remains current and syntactically valid.

**Manual checks:**
- Compare live native screenshots and V2 screenshots at the same zoom/viewports; report any property that cannot be captured in the same browser context.

## Validation Evidence

| Condition | Native measurement | Previous V2 | Final V2 | Delta vs native |
|---|---:|---:|---:|---:|
| 900×700 rail width | 20 px | 28 px | 20 px | 0 px |
| 1280×720 rail width | 30 px | 28 px | 30 px | 0 px |
| Board gap | 10 px | 6 px | 10 px | 0 px |
| Rail radius | 2 px | 4 px | 2 px | 0 px |
| Top/height alignment | exact | exact | exact | 0 px |

The responsive browser matrix passed at 900, 959, 960, 961, and 1280 CSS px. It observed 20 px at 959 and 30 px at both 960 and 961, with zero-pixel top, height, and gap deltas after initial render, resize, and scroll. Computed dark/light colors, border, shadow, radius, font, label placement, and both transform origins matched the captured native values. The backend-backed browser test retained real `cp` and `mate` updates, score labels, `scaleY()`-only fill animation, smooth intermediate frames, and request sequencing.

## Suggested Review Order

**Visual source of truth**

- Start with measured tokens, typography, orientation edges, and the exact 960 px breakpoint.
  [`eval-bar.css:1`](../../analysis_lab/src/ui/eval-bar.css#L1)

- Geometry consumes the same CSS width and gap used by rendering.
  [`userscript-adapter.ts:745`](../../frontend/eval_bar/userscript-adapter.ts#L745)

**Generated userscript**

- Confirm the distributable embeds the measured CSS and updated geometry code.
  [`script.js:30`](../../script.js#L30)

**Acceptance gates**

- Fixture exercises fresh scores, both orientations, scrolling, resizing, and placement fallbacks.
  [`profile-userscript-eval-bar.ts:254`](../../analysis_lab/src/profile-userscript-eval-bar.ts#L254)

- Chromium matrix locks 959/960/961 widths and computed-style equality.
  [`test_eval_bar_v2_chrome.mjs:150`](../../tests/browser/test_eval_bar_v2_chrome.mjs#L150)
