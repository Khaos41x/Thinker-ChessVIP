---
title: 'Flat knight symbol refinement'
type: 'refactor'
created: '2026-10-22'
status: 'done'
route: 'one-shot'
---

# Flat knight symbol refinement

## Intent

**Problem:** The initial hand-authored knight relied on gradients, shadow, grain, numerous colors, and facial details that did not justify themselves at icon sizes.

**Approach:** Reduce the mark to four solid colors, two stroke widths, even-grid half geometry mirrored through `<use>`, a narrower pedestal, and a dedicated small-icon fallback while preserving the mandated symbol and eye boxes.

## Suggested Review Order

1. [`assets/knight-symbol.svg`](../../assets/knight-symbol.svg) — primary flat geometry, palette, and mirrored construction.
2. [`assets/knight-symbol-small.svg`](../../assets/knight-symbol-small.svg) — simplified 16–32 px fallback.
3. [`knight-symbol-scale-test.png`](./knight-symbol-scale-test.png) — native, grayscale, blur, and fallback scale evidence.
4. [`knight-symbol-400-comparison.png`](./knight-symbol-400-comparison.png) — 400% before/after feature crops.
5. [`scripts/validate_knight_symbol.py`](../../scripts/validate_knight_symbol.py) — reproducible structural, box, grid, and symmetry checks.
