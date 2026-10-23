# Banner title size and spacing

Only two lines of production script.js changed: stack font size/gap and title inherited font size/line height. The reproducible builder contains the same two-line change. No image URI, asset, card style, positioning, ResizeObserver, visibility threshold, console or Scout production code changed. The source comparison enforces this exact boundary; artwork dimensions, card rectangles, colors and visibility match all before/after cases.

```diff
- gap:round(nearest,0.4em,2px);font-size:clamp(11px,8cqw,13px)
+ gap:round(nearest,0.6em,2px);font-size:clamp(12px,13cqw,28px)
- font-size:clamp(11px,8cqw,13px);line-height:20px
+ font-size:inherit;line-height:round(nearest,1.1em,2px)
```

Weight 700, Title Case, font family, letter spacing 0 and #FFFFFF are unchanged. Line height and gap round to even integer CSS px so the centered stack retains integral layout geometry. The actual text glyphs naturally have fractional typographic coordinates; these are not fractional card/img/title layout boxes.

## 1440×900 DPR 1

| Measurement | Before | After |
|---|---:|---:|
| Computed font size | 11.52px | 18.72px |
| Actual text range width | 74.70px | 121.33px |
| Share of measured 144px content width | 51.88% | 84.26% |
| Title layout box x,y,w,h | 1276,512,144,20 | 1276,516,144,20 |
| Gap | 4px | 12px (0.641em) |
| Computed line height | 20px | 20px (rounded from 1.1em) |
| Layout stack center displacement | 0px | 0px |
| Visible horse + text vertical center displacement | 0.75px | 3.25px |
| Contrast | 15.356:1 | 15.356:1 |

The card has 146px after subtracting 24px padding, and **144px actual content width** after its unchanged two 1px borders. 121.33px is 83.10% of the former and 84.26% of the latter. Font size is deliberately 18.72px rather than the approximate suggested 20–22px: with this unchanged font/weight/tracking, the measured text width already matches the higher-priority 115–125px and 75–85% targets. At 20px it would exceed that width target. No font compression or negative tracking was introduced.

The horse's CSS size is unchanged at 70×140; it moves up 4px naturally inside the same centered flex stack to accommodate the larger text gap. No artwork positioning rule was edited. Both the layout center (0px) and visible content center (3.25px) meet the <8px target.

## Wrapping and checks

- Measured every integer card width from 96 through 170px. Title wraps as Thinker / Chess at 96–103px; first single-line card is **104px**. All title insets are >=12px. At 95px available space the banner remains hidden; 96px remains the minimum visible width, preserving the approved rule.
- 30 viewport/DPR cases: 1024,1280,1440,1920,2560 ×720,900,1080 ×DPR1,2. All card geometries/visibility are identical. Visible cases have 0px top/base/resize errors; no clipping, horizontal overflow or fractional card/img/title/group layout rectangles. Text remains one line in all visible matrix cases and occupies 84.26% of content width. Six 1024px cases stay hidden.
- Unchanged image asset matches preparation --check; banner embedding, session bundle and Eval Bar bundle --check pass; JavaScript syntax and banner unit tests pass.
- Chromium tests replay production banner code with previously measured logged-out Chess.com sidebar geometry. This is not a claim of authenticated Tampermonkey validation.

[Exact two-line production diff](text-only.diff), [before/after JSON](measurements.json), [96px boundary](minimum-96px.png).

## Screenshots

- [1280×900 DPR 1](comparisons/1280x900-dpr1.png)
- [1440×900 DPR 1](comparisons/1440x900-dpr1.png)
- [1920×900 DPR 1](comparisons/1920x900-dpr1.png)
- [2560×900 DPR 1](comparisons/2560x900-dpr1.png)

All 30 before/after pairs are in comparisons/. Reproduce with node tests/browser/test_banner_responsive.mjs --expressive --title --before, then the same command without --before, then python scripts/report_banner_title.py.
