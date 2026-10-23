import difflib
import hashlib
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_bmad-output/implementation-artifacts/banner-expressive"
old_source = (OUT / "before-script.js").read_text(encoding="utf-8")
new_source = (ROOT / "script.js").read_text(encoding="utf-8")


def split_template(source):
    start = source.index("const bannerHtml = `")
    end = source.index("`;", start) + 2
    return source[:start], source[start:end], source[end:]


old_parts = split_template(old_source)
new_parts = split_template(new_source)
assert old_parts[0] == new_parts[0] and old_parts[2] == new_parts[2]
assert "<svg" not in new_parts[1] and 'id="tc-banner-' not in new_parts[1]
assert "data:image/jpeg;base64," not in new_source
principal_hash = hashlib.sha256((ROOT / "assets/knight-symbol.svg").read_bytes()).hexdigest()
assert principal_hash.upper() == "1FA4EB886961759DC681F92079E9DB7F3FD3A0B4A78D87D6AEE4715C1B1E12D3"
before = json.loads((OUT / "before.json").read_text())["cases"]
after = json.loads((OUT / "after.json").read_text())["cases"]
metrics = json.loads((OUT / "asset-metrics.json").read_text())
comparisons = OUT / "comparisons"
comparisons.mkdir(exist_ok=True)
table = []
reference = None
for old, new in zip(before, after, strict=True):
    assert old["banner"] == new["banner"] and old["shown"] == new["shown"]
    first = Image.open(OUT / "before" / old["screenshot"]).convert("RGB")
    second = Image.open(OUT / "after" / new["screenshot"]).convert("RGB")
    assert first.size == second.size
    pair = Image.new("RGB", (first.width * 2 + 24, first.height + 32), "#eeeeee")
    draw = ImageDraw.Draw(pair)
    draw.text((8, 8), f"BEFORE | {new['width']}x{new['height']} DPR {new['dpr']}", fill="#252523")
    draw.text((first.width + 32, 8), "AFTER | identical card geometry", fill="#252523")
    pair.paste(first, (0, 32))
    pair.paste(second, (first.width + 24, 32))
    pair.save(comparisons / new["screenshot"])
    table.append({"viewport": [new["width"], new["height"]], "dpr": new["dpr"], "shown": new["shown"], "before": {"card": old["banner"], "horse": old["symbol"], "title": old["title"]}, "after": {"card": new["banner"], "horse": new["symbol"], "title": new["title"]}, "topDelta": new["deltaTop"], "bottomDelta": new["deltaBottom"], "physicalScale": new["physicalScale"], "resizeDelta": new["resizeDelta"], "integerLayout": new["integerCard"], "overflow": new["horizontalOverflow"]})
    if (new["width"], new["height"], new["dpr"]) == (1440, 900, 1):
        reference = table[-1]

zoom_cases = [json.loads(path.read_text())["cases"][0] for path in sorted(OUT.glob("zoom-*-dpr*.json"))]
assert len(zoom_cases) == 4
assert all(row["deltaTop"] == row["deltaBottom"] == row["resizeDelta"] == 0 and row["physicalScale"] <= 1 for row in zoom_cases)
(OUT / "measurements.json").write_text(json.dumps({"matrix": table, "reference1440": reference, "browserZoom": zoom_cases}, indent=2)+"\n", encoding="utf-8")


def readable(markup):
    markup = re.sub(r"data:image/webp;base64,[A-Za-z0-9+/=]+", "data:image/webp;base64,[21344-byte lossless asset]", markup)
    return re.sub(r"<svg\b.*?</svg>", "[previous principal inline SVG]", markup, flags=re.S)


(OUT / "content-only.diff").write_text("".join(difflib.unified_diff(readable(old_parts[1]).splitlines(True), readable(new_parts[1]).splitlines(True), fromfile="before/bannerHtml", tofile="after/bannerHtml")), encoding="utf-8")
report = """# Expressive banner — implementation and evidence

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

Userscript size (informational): 596,033 → 621,760 bytes. Source PNG is never embedded; only the 21KB prepared asset is embedded once. [All before/after bounding boxes in JSON](measurements.json).

## Matrix

Card is x,y,width,height in CSS px; identical before and after. Deltas apply only to visible cases.

| Viewport | DPR | Card before = after | Top/base Δ | Physical/native ratio | Pair |
|---|---:|---|---|---:|---|
"""
for row, data in zip(table, after, strict=True):
    card = row["after"]["card"]
    position = str(tuple(card[key] for key in ["x", "y", "width", "height"])) if row["shown"] else "hidden"
    report += f"| {row['viewport'][0]}×{row['viewport'][1]} | {row['dpr']} | {position} | {'0 / 0' if row['shown'] else 'n/a'} | {row['physicalScale'] if row['shown'] else 'n/a'} | [Image](comparisons/{data['screenshot']}) |\n"
report += "\n## 1440×900 DPR 1 reference\n\n```json\n" + json.dumps(reference, indent=2) + "\n```\n"
(OUT / "report.md").write_text(report, encoding="utf-8")
print(json.dumps({"cases": len(table), "zoomCases": len(zoom_cases), "productionOnlyBannerChanged": True, "principalUnchanged": True, "reference1440": reference}, indent=2))
