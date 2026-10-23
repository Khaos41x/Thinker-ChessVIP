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
- Four solid colors and two stroke widths produce a flat, scale-resistant mark without gradients, filters, opacity, blur, or shadow.
- All authored path coordinates use a 2 px grid; the 627 px centerline is established by the mirror transform rather than duplicated right-side geometry.
- The 1254 by 1254 view box matches the supplied reference canvas.

## Acceptance

- No raster image is embedded in the SVG.
- No automatic vectorization output is present.
- Facial details and pedestal geometry share the same mirrored construction.
- The visual symbol retains the `(426,246)-(828,1007)` box and the eyes retain `(536,442)-(718,491)`.
- The small-icon fallback removes details that become noise at 16–32 px while preserving the silhouette, eyes, and one shadow plane.
- The SVG renders successfully in Chromium at its native dimensions.

## Suggested review order

1. `assets/knight-symbol-preview.png`
2. `assets/knight-symbol.svg`
3. `assets/knight-symbol-small.svg`
4. `_bmad-output/implementation-artifacts/knight-symbol-scale-test.png`
5. Compare silhouette, palette, boxes, and scale behavior with the supplied PNG.
