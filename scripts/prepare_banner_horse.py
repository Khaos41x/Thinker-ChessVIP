import argparse
import hashlib
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/BannerAtualizado.png"
TARGET = ROOT / "assets/banner-horse.webp"
EVIDENCE = ROOT / "_bmad-output/implementation-artifacts/banner-expressive"


def encode(image, kind, **options):
    stream = io.BytesIO()
    image.save(stream, format=kind, **options)
    return stream.getvalue()


def bounds(mask):
    y, x = np.where(mask)
    return [int(x.min()), int(y.min()), int(x.max()) + 1, int(y.max()) + 1]


def color_hex(values):
    return "#" + "".join(f"{int(value):02X}" for value in values)


parser = argparse.ArgumentParser()
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
original = Image.open(SOURCE).convert("RGB")
roi = (430, 208, 824, 952)
rgb = np.asarray(original.crop(roi), dtype=np.float64)
bright = rgb.max(axis=2) > 95
labels, count = ndimage.label(bright)
sizes = np.bincount(labels.ravel())
foreground = np.isin(labels, np.flatnonzero(sizes >= 80)[1:])
foreground = ndimage.binary_fill_holes(foreground)
for row in range(500 - roi[1], 770 - roi[1]):
    columns = np.flatnonzero(foreground[row])
    if columns.size:
        foreground[row, columns[0]:columns[-1] + 1] = True
core = ndimage.binary_erosion(foreground, iterations=3)
outer = ndimage.binary_dilation(foreground, iterations=3)
_, inside_indices = ndimage.distance_transform_edt(~core, return_indices=True)
_, outside_indices = ndimage.distance_transform_edt(outer, return_indices=True)
inside = rgb[tuple(inside_indices)]
outside = rgb[tuple(outside_indices)]
delta = inside - outside
alpha = np.clip(((rgb - outside) * delta).sum(axis=2) / np.maximum((delta * delta).sum(axis=2), 1), 0, 1)
alpha[core] = 1
alpha[~outer] = 0
alpha[alpha < 0.025] = 0
unmatted = np.clip((rgb - (1 - alpha[:, :, None]) * outside) / np.maximum(alpha[:, :, None], 1 / 255), 0, 255)
unmatted[alpha == 0] = 0
rgba = np.dstack([np.rint(unmatted).astype(np.uint8), np.rint(alpha * 255).astype(np.uint8)])
horse = Image.fromarray(rgba)
local_box = bounds(alpha > 0.05)
padding_x = round((local_box[2] - local_box[0]) * 0.03)
padding_y = round((local_box[3] - local_box[1]) * 0.03)
crop = (max(0, local_box[0] - padding_x), max(0, local_box[1] - padding_y), min(horse.width, local_box[2] + padding_x), min(horse.height, local_box[3] + padding_y))
cropped = horse.crop(crop)
scale = min(140 / cropped.width, 280 / cropped.height)
size = (round(cropped.width * scale), round(cropped.height * scale))
resized = cropped.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")
result = Image.new("RGBA", (140, 280))
result.paste(resized, ((140 - size[0]) // 2, (280 - size[1]) // 2))
png = encode(result, "PNG", optimize=True, compress_level=9)
webp = encode(result, "WEBP", lossless=True, method=6, exact=True)
assert len(webp) <= len(png), "Update the chosen format if PNG becomes smaller"
assert len(webp) < 40000
if args.check:
    assert TARGET.read_bytes() == webp, "Prepared banner asset is stale"
    print(f"Prepared horse matches source ({len(webp)} bytes, {result.width}x{result.height})")
    raise SystemExit(0)
else:
    TARGET.write_bytes(webp)

pixels = np.asarray(original)
green = (pixels[:, :, 1].astype(float) > pixels[:, :, 0] * 1.5) & (pixels[:, :, 1] > 80) & (pixels[:, :, 2].astype(float) < pixels[:, :, 1] * 0.9)
green[:400] = False
green[520:] = False
green[:, :490] = False
green[:, 764:] = False
eye_box = bounds(green)
body_patch = pixels[540:570, 610:644]
eye_values = pixels[green]
eye_median = np.median(eye_values, axis=0).astype(int)
left_eye = green.copy()
left_eye[:, 627:] = False
right_eye = green.copy()
right_eye[:, :627] = False
face = pixels[400:530, 490:764].astype(int)
face_difference = np.abs(face - face[:, ::-1]).mean(axis=2)
native_alpha = np.asarray(result)[:, :, 3]
body_mode = int(np.bincount(body_patch.reshape(-1,3).astype(np.int64).dot([65536,256,1])).argmax())
metrics = {
    "source": "assets/BannerAtualizado.png", "sourceSize": list(original.size),
    "roi": list(roi), "horseBoxSource": [local_box[0]+roi[0],local_box[1]+roi[1],local_box[2]+roi[0],local_box[3]+roi[1]],
    "cropSource": [crop[0]+roi[0],crop[1]+roi[1],crop[2]+roi[0],crop[3]+roi[1]],
    "sourceCropSize": list(cropped.size), "resampledSize": list(size),
    "output": "assets/banner-horse.webp", "format": "lossless WebP with alpha", "nativeSize": [140,280],
    "bytes": len(webp), "pngBytes": len(png), "sha256": hashlib.sha256(webp).hexdigest(),
    "alphaBox": bounds(native_alpha > 0), "cornerAlpha": [int(native_alpha[y,x]) for x,y in [(0,0),(139,0),(0,279),(139,279)]],
    "eyeMedian": color_hex(eye_median), "eyeLeftMedian":color_hex(np.median(pixels[left_eye],axis=0)),"eyeRightMedian":color_hex(np.median(pixels[right_eye],axis=0)),
    "bodyMedian": color_hex(np.median(body_patch.reshape(-1,3),axis=0)), "bodyMode":color_hex([(body_mode>>16)&255,(body_mode>>8)&255,body_mode&255]),
    "eyesBox": eye_box, "leftEyeBox": bounds(left_eye), "rightEyeBox": bounds(right_eye),
    "faceMirrorMeanChannelDifference":float(face_difference.mean()),"faceMirrorPixelsDifferent":int((face_difference>0).sum()),
    "symmetryCorrected":False,
}
EVIDENCE.mkdir(parents=True, exist_ok=True)
(EVIDENCE / "asset-metrics.json").write_text(json.dumps(metrics, indent=2)+"\n", encoding="utf-8")
horse.save(EVIDENCE / "horse-native-alpha.png")
result.save(EVIDENCE / "horse-prepared.png")
for name, region, zoom in [("eyes-400", (490-roi[0],400-roi[1],764-roi[0],520-roi[1]),4), ("face-300", (490-roi[0],350-roi[1],764-roi[0],710-roi[1]),3)]:
    transparent = horse.crop(region)
    sheet = Image.new("RGB", (transparent.width*zoom*2+24,transparent.height*zoom+28), "#eeeeee")
    draw = ImageDraw.Draw(sheet)
    for index, background in enumerate(["#252523", "#FFFFFF"]):
        tile = Image.new("RGBA", transparent.size, background)
        tile.alpha_composite(transparent)
        enlarged = tile.convert("RGB").resize((transparent.width*zoom,transparent.height*zoom),Image.Resampling.NEAREST)
        sheet.paste(enlarged,(index*(enlarged.width+24),28))
        draw.text((index*(enlarged.width+24)+4,8),f"{zoom*100}% | {background}",fill="#252523")
    sheet.save(EVIDENCE / f"{name}.png")
print(json.dumps(metrics, indent=2))
