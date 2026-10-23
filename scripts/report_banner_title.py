import difflib
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_bmad-output/implementation-artifacts/banner-title"
before_source = subprocess.check_output(["git", "show", "809ddd9:script.js"], cwd=ROOT).decode("utf-8")
after_source = (ROOT / "script.js").read_text(encoding="utf-8")
before_lines = before_source.splitlines(keepends=True)
after_lines = after_source.splitlines(keepends=True)
changes = [operation for operation in difflib.SequenceMatcher(a=before_lines, b=after_lines).get_opcodes() if operation[0] != "equal"]
assert len(changes) == 2 and all(old_end-old_start == new_end-new_start == 1 for _,old_start,old_end,new_start,new_end in changes)
assert all("font-size" in before_lines[old_start] and "font-size" in after_lines[new_start] for _,old_start,_,new_start,_ in changes)
(OUT / "text-only.diff").write_text("".join(difflib.unified_diff(before_lines, after_lines, fromfile="before/script.js", tofile="after/script.js", n=0)), encoding="utf-8")
before = json.loads((OUT / "before.json").read_text())["cases"]
after = json.loads((OUT / "after.json").read_text())["cases"]
boundary = json.loads((OUT / "boundary.json").read_text())
pairs = OUT / "comparisons"
pairs.mkdir(exist_ok=True)
rows = []
for old, new in zip(before, after, strict=True):
    assert old["banner"] == new["banner"] and old["shown"] == new["shown"]
    assert old["native"] == new["native"] and old["appearance"] == new["appearance"]
    assert old["artwork"]["width"] == new["artwork"]["width"] and old["artwork"]["height"] == new["artwork"]["height"]
    if new["shown"]:
        assert new["deltaTop"] == new["deltaBottom"] == new["resizeDelta"] == 0
        assert abs(new["visibleCenterOffsetY"]) < 8
    images = [Image.open(OUT / phase / new["screenshot"]).convert("RGB") for phase in ["before", "after"]]
    assert images[0].size == images[1].size
    width, height = images[0].size
    pair = Image.new("RGB", (width*2+24, height+32), "#eeeeee")
    draw = ImageDraw.Draw(pair)
    for index, image in enumerate(images):
        x = index*(width+24)
        pair.paste(image,(x,32))
        draw.text((x+8,8),f"{'BEFORE' if index == 0 else 'AFTER'} | {new['width']}x{new['height']} DPR {new['dpr']}",fill="#252523")
    pair.save(pairs / new["screenshot"])
    rows.append({"viewport":[new["width"],new["height"]],"dpr":new["dpr"],"shown":new["shown"],"card":new["banner"],"before":{key:old.get(key) for key in ["title","titleLines","font","textWidth","gap","groupCenterOffset","visibleCenterOffsetY","contrast"]},"after":{key:new.get(key) for key in ["title","titleLines","font","textWidth","gap","groupCenterOffset","visibleCenterOffsetY","contrast"]}})
reference = next(row for row in rows if row["viewport"] == [1440,900] and row["dpr"] == 1)
(OUT / "measurements.json").write_text(json.dumps({"reference1440":reference,"matrix":rows,"boundary":boundary},indent=2)+"\n",encoding="utf-8")
report = """# Banner title size and spacing

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

"""
for width in [1280,1440,1920,2560]:
    report += f"- [{width}×900 DPR 1](comparisons/{width}x900-dpr1.png)\n"
report += "\nAll 30 before/after pairs are in comparisons/. Reproduce with node tests/browser/test_banner_responsive.mjs --expressive --title --before, then the same command without --before, then python scripts/report_banner_title.py.\n"
(OUT / "report.md").write_text(report,encoding="utf-8")
print(json.dumps(reference,indent=2))
