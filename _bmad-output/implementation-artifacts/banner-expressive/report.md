# Expressive banner — implementation and evidence

## Scope

The full userscript is byte-for-byte unchanged outside bannerHtml compared with before-script.js. The positioning functions, ResizeObserver, 96px free-column cutoff, console and Scout are unchanged. assets/knight-symbol.svg retains its SHA-256 1FA4EB886961759DC681F92079E9DB7F3FD3A0B4A78D87D6AEE4715C1B1E12D3. [Readable content-only diff](content-only.diff) abbreviates the embedded binary and the old inline SVG, not production code.

## Artwork

Source assets/BannerAtualizado.png is 1254×1254 RGB, 1,220,262 bytes. The reproducible preparation script isolates only the head, neck and base; source text and background are excluded. Source horse threshold box is (448,236)-(806,929). The crop with approximately 3% clearance is (437,215)-(817,950), 380×735. Foreground/background edge estimation removes the dark background and unmattes antialiased pixels; dark muzzle and neck planes are preserved. Premultiplied-alpha Lanczos resamples proportionally to 140×271, centered on a transparent 140×280 canvas. The extra transparent padding makes the canvas exactly 1:2; there is no nonuniform scaling.

Final assets/banner-horse.webp: **21,344 bytes**, lossless WebP with alpha (optimized PNG comparison: 35,418 bytes). All corners are fully transparent. No image rectangle is painted behind the horse. [Face 300% on dark and white](face-300.png) and [eyes 400% on dark and white](eyes-400.png) expose edge quality and original asymmetry.

Measured source colors: body median/mode #FEFEFE; eyes median #029568, left #029769, right #029468. These are measured representative pixels, not replacement colors. Original left eye threshold box is 40×50px and right is 41×50px. Mean absolute mirrored face difference is 4.207/255 per channel. The face is not perfectly symmetrical; **no mirroring or symmetry correction was applied**.

## Content and card

The img embeds a data:image/webp URI; no remote image request is needed. object-fit:contain, auto height and no transform preserve proportions. Width remains capped at 70 CSS px and below 60% of the card, height below 34%. The existing naturalWidth/devicePixelRatio cap is reused unchanged: physical rendered dimensions never exceed 140×280 in the tested DPR/zoom cases.

Live HTML text is “Thinker Chess”, console system sans stack, weight 700, letter spacing 0, #FFFFFF, clamp(11px,8cqw,13px). Its visible glyph width is approximately 75px beside a 68px visible horse at 1440×900. At the 96px boundary it wraps as Thinker / Chess. The stack stays centered at the same card center. The card remains flat #252523 with 1px #3A3A36 border, 8px radius, 12px minimum inset, overflow:hidden and pointer-events:none. Text contrast is **15.356:1**.

## Validation

30 BEFORE and AFTER cases: widths 1024/1280/1440/1920/2560 × heights 720/900/1080 × DPR 1/2. All 30 card rectangles and visibility decisions exactly match. Six 1024px cases hide; all 24 visible cases have top/base and ResizeObserver follow-up error 0px, preserved aspect ratio, integer card/img/title layout rectangles, no horizontal overflow and no clipping. At 96px free space the card shows; at 95px it hides without reserved flow space. [Boundary screenshot](minimum-96px.png).

Actual desktop browser zoom was also tested at 125% and 150%, base DPR 1 and 2. It uses Chromium's default zoom setting in an isolated profile, not CSS zoom, transforms or pinch emulation. visualViewport.scale=1 and effective DPR=1.25/1.5/2.5/3 confirm this. Alignment and resize errors remain 0px, native-resolution ratio <=1, with no overflow or clipping. **Fractional inner title coordinates at non-100% zoom are recorded, not claimed integer:** Chromium quantizes the existing 1px CSS border to physical pixels (e.g. 0.8 CSS px at 125%). No positioning/layout changes were introduced to fight browser rasterization.

The matrix is Chromium replay of production banner code with sidebar geometries previously measured on logged-out Chess.com. Full userscript startup was separately tested in Chromium with no console errors. **An authenticated Chess.com + installed Tampermonkey session was not available; this is not claimed as a live account verification.**

Passed: banner visibility unit tests, full userscript Chromium smoke, JavaScript syntax, prepared-asset --check, raster embedding --check, session bundle --check, Eval Bar bundle --check, matrix and all four actual zoom cases. Existing isolated Scout suite still fails on its pre-existing incomplete DOM mock (layout.container.querySelector is not a function); its payload and banner guards pass. No Scout production behavior was changed to bypass this failure.

## Removed

- Principal inline SVG markup and its tc-banner-* IDs from the banner only; the principal asset remains in the repository.
- Obsolete scripts/build_banner_artwork.mjs (inline-SVG-only builder), replaced with scripts/build_banner_raster.mjs --check.
- No JPEG, dead raster URI, remote artwork, gradients, shadows, glow, blur or filters remain in bannerHtml. Historical vector evidence scripts are retained as archives, not active builders.

## Reproduce

Python preparation needs Pillow, NumPy and SciPy (validated with 12.3.0 / 2.5.3 / 1.18.1). The --check mode does not write assets or evidence.

```powershell
python scripts/prepare_banner_horse.py
node scripts/build_banner_raster.mjs
python scripts/prepare_banner_horse.py --check
node scripts/build_banner_raster.mjs --check
node tests/test_banner_visibility.js
node tests/browser/test_banner_responsive.mjs --expressive
node tests/browser/test_banner_responsive.mjs --expressive --zoom=1.25 --dpr=1
node tests/browser/test_banner_responsive.mjs --expressive --zoom=1.5 --dpr=1
node tests/browser/test_banner_responsive.mjs --expressive --zoom=1.25 --dpr=2
node tests/browser/test_banner_responsive.mjs --expressive --zoom=1.5 --dpr=2
node tests/test_userscript_chrome.js
python scripts/report_banner_expressive.py
```

Userscript size: 596,033 → 621,760 bytes, below existing 640,000-byte guard. Source PNG is never embedded; only the 21KB prepared asset is embedded once. [All before/after bounding boxes in JSON](measurements.json).

## Matrix

Card is x,y,width,height in CSS px; identical before and after. Deltas apply only to visible cases.

| Viewport | DPR | Card before = after | Top/base Δ | Physical/native ratio | Pair |
|---|---:|---|---|---:|---|
| 1024×720 | 1 | hidden | n/a | n/a | [Image](comparisons/1024x720-dpr1.png) |
| 1024×720 | 2 | hidden | n/a | n/a | [Image](comparisons/1024x720-dpr2.png) |
| 1024×900 | 1 | hidden | n/a | n/a | [Image](comparisons/1024x900-dpr1.png) |
| 1024×900 | 2 | hidden | n/a | n/a | [Image](comparisons/1024x900-dpr2.png) |
| 1024×1080 | 1 | hidden | n/a | n/a | [Image](comparisons/1024x1080-dpr1.png) |
| 1024×1080 | 2 | hidden | n/a | n/a | [Image](comparisons/1024x1080-dpr2.png) |
| 1280×720 | 1 | (1103, 16, 170, 688) | 0 / 0 | 0.5 | [Image](comparisons/1280x720-dpr1.png) |
| 1280×720 | 2 | (1103, 16, 170, 688) | 0 / 0 | 1 | [Image](comparisons/1280x720-dpr2.png) |
| 1280×900 | 1 | (1103, 16, 170, 868) | 0 / 0 | 0.5 | [Image](comparisons/1280x900-dpr1.png) |
| 1280×900 | 2 | (1103, 16, 170, 868) | 0 / 0 | 1 | [Image](comparisons/1280x900-dpr2.png) |
| 1280×1080 | 1 | (1103, 16, 170, 1048) | 0 / 0 | 0.5 | [Image](comparisons/1280x1080-dpr1.png) |
| 1280×1080 | 2 | (1103, 16, 170, 1048) | 0 / 0 | 1 | [Image](comparisons/1280x1080-dpr2.png) |
| 1440×720 | 1 | (1123, 16, 170, 688) | 0 / 0 | 0.5 | [Image](comparisons/1440x720-dpr1.png) |
| 1440×720 | 2 | (1123, 16, 170, 688) | 0 / 0 | 1 | [Image](comparisons/1440x720-dpr2.png) |
| 1440×900 | 1 | (1263, 16, 170, 868) | 0 / 0 | 0.5 | [Image](comparisons/1440x900-dpr1.png) |
| 1440×900 | 2 | (1263, 16, 170, 868) | 0 / 0 | 1 | [Image](comparisons/1440x900-dpr2.png) |
| 1440×1080 | 1 | (1263, 16, 170, 1048) | 0 / 0 | 0.5 | [Image](comparisons/1440x1080-dpr1.png) |
| 1440×1080 | 2 | (1263, 16, 170, 1048) | 0 / 0 | 1 | [Image](comparisons/1440x1080-dpr2.png) |
| 1920×720 | 1 | (1480, 16, 170, 688) | 0 / 0 | 0.5 | [Image](comparisons/1920x720-dpr1.png) |
| 1920×720 | 2 | (1480, 16, 170, 688) | 0 / 0 | 1 | [Image](comparisons/1920x720-dpr2.png) |
| 1920×900 | 1 | (1570, 16, 170, 868) | 0 / 0 | 0.5 | [Image](comparisons/1920x900-dpr1.png) |
| 1920×900 | 2 | (1570, 16, 170, 868) | 0 / 0 | 1 | [Image](comparisons/1920x900-dpr2.png) |
| 1920×1080 | 1 | (1730, 16, 170, 1048) | 0 / 0 | 0.5 | [Image](comparisons/1920x1080-dpr1.png) |
| 1920×1080 | 2 | (1730, 16, 170, 1048) | 0 / 0 | 1 | [Image](comparisons/1920x1080-dpr2.png) |
| 2560×720 | 1 | (1800, 16, 170, 688) | 0 / 0 | 0.5 | [Image](comparisons/2560x720-dpr1.png) |
| 2560×720 | 2 | (1800, 16, 170, 688) | 0 / 0 | 1 | [Image](comparisons/2560x720-dpr2.png) |
| 2560×900 | 1 | (1890, 16, 170, 868) | 0 / 0 | 0.5 | [Image](comparisons/2560x900-dpr1.png) |
| 2560×900 | 2 | (1890, 16, 170, 868) | 0 / 0 | 1 | [Image](comparisons/2560x900-dpr2.png) |
| 2560×1080 | 1 | (1980, 16, 170, 1048) | 0 / 0 | 0.5 | [Image](comparisons/2560x1080-dpr1.png) |
| 2560×1080 | 2 | (1980, 16, 170, 1048) | 0 / 0 | 1 | [Image](comparisons/2560x1080-dpr2.png) |

## 1440×900 DPR 1 reference

```json
{
  "viewport": [
    1440,
    900
  ],
  "dpr": 1,
  "shown": true,
  "before": {
    "card": {
      "x": 1263,
      "y": 16,
      "width": 170,
      "height": 868,
      "right": 1433,
      "bottom": 884
    },
    "horse": {
      "x": 1315.7226277372263,
      "y": 376.8175182481752,
      "width": 64.55474452554745,
      "height": 122.04379562043796
    },
    "title": {
      "x": 1276,
      "y": 508,
      "width": 144,
      "height": 20,
      "right": 1420,
      "bottom": 528
    }
  },
  "after": {
    "card": {
      "x": 1263,
      "y": 16,
      "width": 170,
      "height": 868,
      "right": 1433,
      "bottom": 884
    },
    "horse": {
      "x": 1314,
      "y": 372.5,
      "width": 68,
      "height": 130.5
    },
    "title": {
      "x": 1276,
      "y": 512,
      "width": 144,
      "height": 20,
      "right": 1420,
      "bottom": 532
    }
  },
  "topDelta": 0,
  "bottomDelta": 0,
  "physicalScale": 0.5,
  "resizeDelta": 0,
  "integerLayout": true,
  "overflow": false
}
```
