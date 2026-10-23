---
title: 'Expressive horse banner content'
type: 'refactor'
created: '2026-10-23'
status: 'done'
route: 'one-shot'
---

# Expressive horse banner content

## Intent

**Problem:** The approved responsive banner still used the neutral vector symbol rather than the supplied expressive horse.

**Approach:** Prepare a small transparent lossless WebP reproducibly and embed it with a live Title Case title. Preserve all existing positioning, native raster caps and unrelated UI.

## Suggested Review Order

1. [Preparation](../../scripts/prepare_banner_horse.py) — extraction, alpha and Lanczos.
2. [Embedding](../../scripts/build_banner_raster.mjs) — content-only deterministic replacement.
3. [Evidence](banner-expressive/report.md) — scope proof, complete matrix, zoom and limitations.
4. [Browser checks](../../tests/browser/test_banner_responsive.mjs) — real production banner code, resize and physical resolution assertions.

Independent review found one verification-mode write side effect; patched so preparation --check performs no writes. No banner runtime defect was found. Existing Scout DOM mock failure remains documented, not hidden or fixed by unrelated production changes.
