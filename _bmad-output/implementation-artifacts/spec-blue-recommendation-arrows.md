---
title: Blue recommendation arrow color and opacity
type: refinement
created: 2026-10-24
status: done
route: one-shot
---

# Blue recommendation arrow color and opacity

## Intent

**Problem:** The approved recommendation geometry still used green and opacity 0.64; persisted Theme settings could override a change to its default color alone.

**Approach:** Set the unique ARROW_COLOR to #3B82F6 and full-path opacity to 0.8. Keep Theme's own default green and point only its existing arrow repaint calls to the fixed arrow constant. Preserve geometry, layer, interaction and all unrelated logic. Use hue distinction rather than a 3:1 pass criterion.

## Suggested Review Order

- [Six-line production diff and visual evidence](blue-recommendation-arrows/REPORT.md).
- [Production color](../../script.js#L1031) and [unchanged geometry / new opacity](../../script.js#L4720).
- [Color regression](../../tests/test_recommendation_arrows.js) and [reproducible twelve-case before/after capture](../../scripts/verify_blue_arrows.cjs).
