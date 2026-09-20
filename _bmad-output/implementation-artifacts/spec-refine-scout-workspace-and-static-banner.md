---
title: 'Refine Scout workspace and static banner layout'
type: 'feature'
created: '2026-09-20'
status: 'done'
review_loop_iteration: 0
baseline_commit: '785e82fd362c3e4a7ea0ce22d10075f85af10490'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The right-side banner visibly chases the page during scrolling and remains too narrow, while the Thinker and Scout panels intrude into the initial fullscreen viewport. The Scout card matches the configuration card's footprint poorly and uses only a small fraction of the useful intelligence available from its 50-game sample.

**Approach:** Anchor the banner once in document space with a wider safe-column calculation, move the paired panels below the first viewport fold, and turn Scout into a dense opponent dossier derived exclusively from the already-authorized current-month Chess.com PubAPI games. Both cards will share one grid and equal dimensions.

## Boundaries & Constraints

**Always:** Keep the banner self-contained, aligned with the notation sidebar, naturally scrolling with the document without scroll-driven JavaScript, and wider where viewport space permits; keep both panels below the initial viewport in normal and F11 fullscreen; preserve the recent W/D/L HUD beside the opponent name; use one current-month PubAPI request, strict per-opponent cache, stale-response protection, silent failures, `DEBUG = false`, and equal card dimensions.

**Ask First:** Adding another API provider or previous-month request, changing the backend, overlaying board/notation controls, or hiding the panels permanently instead of placing them below the fold.

**Never:** Reposition the banner on every scroll frame; cover gameplay UI; fabricate unavailable statistics; weaken cache ownership/integrity; log fetch, cache, layout, or observer activity; modify unrelated files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Initial game view | Board, notation sidebar, and right slot are present | Banner is static, wider, and aligned; both cards begin below the viewport | Hide banner if no safe slot exists |
| Scroll | User moves vertically in either direction | Banner moves naturally with document content with no delayed correction | No scroll listener or animation loop |
| F11/resize | Viewport height changes | Card workspace remains below the new first fold; banner geometry recalculates once | Debounced resize/observer reconciliation |
| Rich sample | Up to 50 valid monthly games | Scout shows record, score, rating/form movement, color splits, time-control profile, loss pattern, and opening repertoire | Omit unavailable metrics without blank filler |
| Sparse sample | One or few usable games | Valid metrics render compactly and cards remain equal height | No division errors or invented trends |
| Cached legacy shape | Old Scout cache lacks new fields | Entry is invalidated and refreshed from PubAPI | Silent cache removal and retry |

</frozen-after-approval>

## Code Map

- `script.js:252-850` -- Scout classification, strict cache validation, aggregation, and panel/HUD rendering.
- `script.js:2268-2358` -- shared UI reconciliation, Ghost Mode, banner geometry, and viewport layout helpers.
- `script.js:2360-2720` -- Thinker card styles/markup, embedded banner, mounting, and observers.
- `tests/test_scout_logic.js` -- extracted userscript regression harness for metrics, cache, layout, SPA, and Ghost Mode.
- `scripts/rebuild_userscript_assets.py` -- reproducible jQuery/banner embedding pipeline.

## Tasks & Acceptance

**Execution:**
- [x] `script.js` -- replace scroll-following fixed banner placement with document-anchored geometry and a wider safe-slot budget.
- [x] `script.js` -- introduce one viewport-fold workspace layout owner that keeps the two cards below fullscreen and enforces an equal two-column grid.
- [x] `script.js` -- extend game classification and strict cache schema with record/score, rating trend, recent momentum, color splits, time-control distribution, loss pattern, activity, and multi-opening repertoire.
- [x] `script.js` -- redesign Scout rendering into compact sections that fill the same card height without overflow or empty vertical waste.
- [x] `tests/test_scout_logic.js` -- cover new metrics, legacy-cache invalidation, sparse samples, static banner math, wider geometry, fullscreen fold placement, and equal-card layout markers.

**Acceptance Criteria:**
- Given the user scrolls the Chess.com page, when the banner is visible, then its document position remains stable without visible frame-lag updates.
- Given a normal or F11 viewport at scroll position zero, when the UI mounts or resizes, then neither custom card appears inside the first viewport.
- Given a 50-game sample, when Scout renders, then it provides actionable opponent tendencies and both cards have identical outer dimensions.
- Given an API/cache failure, when layout reconciliation continues, then the Thinker panel and banner remain functional with no console output.

## Spec Change Log

## Design Notes

The banner should use absolute document coordinates derived from the sidebar rectangle plus page offsets, recalculated only for structural changes and resize. Scout statistics must be descriptive rather than predictive: percentages and trends summarize the available month sample and clearly expose the sample size.

## Verification

**Commands:**
- `node --check script.js` -- expected: no syntax error.
- `node tests/test_scout_logic.js` -- expected: Scout, cache, layout, SPA, and Ghost Mode assertions pass.
- `python -m py_compile scripts/rebuild_userscript_assets.py` -- expected: asset tooling remains valid.
- `git diff --check -- script.js tests/test_scout_logic.js` -- expected: no whitespace errors.
- direct console/endpoints scan -- expected: zero direct console calls and zero deprecated archive endpoints.

**Manual checks:**
- Compare top-of-page, scrolled, and F11 layouts against the supplied screenshots; confirm wider static banner and below-fold equal cards.

## Suggested Review Order

**Scout intelligence and integrity**

- Expanded cache contract prevents stale compact statistics from surviving the upgrade.
  [`script.js:354`](../../script.js#L354)

- One monthly sample now produces the complete descriptive opponent dossier.
  [`script.js:708`](../../script.js#L708)

- Compact rendering fills the matched card without wasting vertical space.
  [`script.js:1044`](../../script.js#L1044)

**Workspace and banner geometry**

- Shared grid gives configuration and Scout cards identical dimensions.
  [`script.js:903`](../../script.js#L903)

- Document-space geometry removes scroll-following lag and widens the safe banner slot.
  [`script.js:2620`](../../script.js#L2620)

- Fold calculation keeps both cards outside normal and fullscreen initial views.
  [`script.js:2645`](../../script.js#L2645)

**Regression coverage**

- Tests cover static scrolling, fullscreen placement, rich metrics, sparse data, and cache migration.
  [`test_scout_logic.js:125`](../../tests/test_scout_logic.js#L125)
