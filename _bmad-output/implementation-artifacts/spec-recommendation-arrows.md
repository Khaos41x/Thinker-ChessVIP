---
title: Native-style recommendation arrow rendering
type: refinement
created: 2026-10-24
status: done
route: one-shot
---

# Native-style recommendation arrow rendering

## Intent

**Problem:** Recommendations used a thin round-capped line, concave SVG marker, drop shadow and glowing rounded square highlights, unlike the supplied Chess.com reference.

**Approach:** Replace only the rendering geometry with one closed, uniformly translucent filled path in square units. Keep saved theme colors, board lookup, orientation, one-recommendation selection, engine calls and UI untouched. Retain disabled highlight code behind a constant. Reference color compositing measures 0.639 opacity, so use 0.64 rather than the initial 0.8 estimate.

## Suggested Review Order

- [Measured reference and rendering evidence](recommendation-arrows/REPORT.md).
- [Rendering-only production changes](../../script.js#L4720).
- [Geometry regression](../../tests/test_recommendation_arrows.js) and [Chromium matrix](../../tests/test_recommendation_arrows_chrome.js).
- [Reproducible reference measurement](../../scripts/measure_arrow_reference.py).
