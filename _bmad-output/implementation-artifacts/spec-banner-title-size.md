---
title: 'Banner title size and spacing'
type: 'refactor'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Banner title size and spacing

## Intent

**Problem:** The approved responsive banner title was too small relative to the content area.

**Approach:** Change only the stack font size/gap and title inherited size/line height. At the reference width, actual glyph width is 121.33px (84.26% of content), with an 18.72px computed font. Preserve every artwork, card, positioning, ResizeObserver, cutoff, console and Scout rule.

## Suggested Review Order

1. [Two-line production diff](banner-title/text-only.diff) — exact change boundary.
2. [Deterministic builder](../../scripts/build_banner_raster.mjs) — matching typography.
3. [Measurements and captures](banner-title/report.md) — before/after, width sweep and scope proof.
4. [Chromium test](../../tests/browser/test_banner_responsive.mjs) — 30 cases, centering and wrapping assertions.

Independent blind review found no actionable defects. Font size follows the measured 115–125px width goal rather than the approximate 20–22px suggestion; no font-family, tracking, weight or color changes were introduced. Review and measurement limitations are recorded in the report.
