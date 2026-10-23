---
status: done
route: one-shot
title: Hand-authored symmetric knight symbol
---

# Hand-authored symmetric knight symbol

## Intent

Create the Thinker Chess knight as a native SVG without tracing or embedding raster data. Preserve the supplied reference's charcoal, ivory, gray, and green palette, its square background, and the overall symbol proportions.

## Implementation

- The left half of the horse and pedestal is authored with compact SVG paths.
- The right half is produced exclusively through an exact horizontal mirror transform around the 627 px centerline.
- Eyes, nostrils, facial folds, neck facets, and pedestal geometry therefore remain mathematically bilateral.
- Subtle gradients, restrained grain, and a neutral shadow reproduce the reference's dimensional treatment without changing its identity.
- The 1254 by 1254 view box matches the supplied reference canvas.

## Acceptance

- No raster image is embedded in the SVG.
- No automatic vectorization output is present.
- Facial details and pedestal geometry share the same mirrored construction.
- The visual symbol remains centered and within the reference proportions.
- The SVG renders successfully in Chromium at its native dimensions.

## Suggested review order

1. `assets/knight-symbol-preview.png`
2. `assets/knight-symbol.svg`
3. Compare silhouette, palette, and vertical proportions with the supplied PNG.
