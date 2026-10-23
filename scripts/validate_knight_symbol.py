import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageChops, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SVG_PATH = ROOT / "assets" / "knight-symbol.svg"
SMALL_SVG_PATH = ROOT / "assets" / "knight-symbol-small.svg"
PREVIEW_PATH = ROOT / "assets" / "knight-symbol-preview.png"
EXPECTED_COLORS = ["#10B981", "#252523", "#B9B9B3", "#DEDED9"]
EXPECTED_SYMBOL_BOX = (426, 246, 828, 1007)
EXPECTED_EYE_BOX = (536, 442, 718, 491)


def bounds(points):
    return (
        min(x for x, _ in points),
        min(y for _, y in points),
        max(x for x, _ in points) + 1,
        max(y for _, y in points) + 1,
    )


def difference_pixels(image):
    pixels = image.load()
    return sum(
        pixels[x, y] != (0, 0, 0)
        for y in range(image.height)
        for x in range(image.width)
    )


source = SVG_PATH.read_text(encoding="utf-8")
nodes = list(ET.fromstring(source).iter())
colors = sorted(set(value.upper() for value in re.findall(r"#[0-9a-fA-F]{6}", source)))
widths = sorted(set(node.attrib["stroke-width"] for node in nodes if "stroke-width" in node.attrib))
path_numbers = []
for node in nodes:
    if node.tag.endswith("path"):
        path_numbers.extend(int(value) for value in re.findall(r"-?\d+", node.attrib.get("d", "")))

image = Image.open(PREVIEW_PATH).convert("RGB")
pixels = image.load()
background = (37, 37, 35)
symbol_points = []
eye_points = []
for y in range(image.height):
    for x in range(image.width):
        color = pixels[x, y]
        if color != background:
            symbol_points.append((x, y))
        red, green, blue = color
        if green > red * 1.25 and green > blue * 1.15 and green > 80:
            eye_points.append((x, y))

left = image.crop((0, 0, image.width // 2, image.height))
canonical = Image.new("RGB", image.size, background)
canonical.paste(left, (0, 0))
canonical.paste(ImageOps.mirror(left), (image.width // 2, 0))
canonical_difference = ImageChops.difference(canonical, ImageOps.mirror(canonical))
raw_difference = ImageChops.difference(image, ImageOps.mirror(image))

small_source = SMALL_SVG_PATH.read_text(encoding="utf-8")
small_root = ET.fromstring(small_source)
small_nodes = list(small_root.iter())
small_numbers = []
for node in small_nodes:
    if node.tag.endswith("path"):
        small_numbers.extend(int(value) for value in re.findall(r"-?\d+", node.attrib.get("d", "")))

result = {
    "colors": colors,
    "stroke_widths": widths,
    "path_count": sum(node.tag.endswith("path") for node in nodes),
    "file_bytes": SVG_PATH.stat().st_size,
    "symbol_box": bounds(symbol_points),
    "eye_box": bounds(eye_points),
    "path_grid_violations": sorted(set(value for value in path_numbers if value % 2)),
    "mirrored_use_count": sum(
        "scale(-1 1)" in node.attrib.get("transform", "")
        for node in nodes
        if node.tag.endswith("use")
    ),
    "canonical_mirror_difference_pixels": difference_pixels(canonical_difference),
    "chromium_antialias_difference_pixels": difference_pixels(raw_difference),
    "small_icon": {
        "view_box": small_root.attrib["viewBox"],
        "colors": sorted(set(value.upper() for value in re.findall(r"#[0-9a-fA-F]{6}", small_source))),
        "path_count": sum(node.tag.endswith("path") for node in small_nodes),
        "path_grid_violations": sorted(set(value for value in small_numbers if value % 2)),
        "mirrored_use_count": sum(
            "scale(-1 1)" in node.attrib.get("transform", "")
            for node in small_nodes
            if node.tag.endswith("use")
        ),
    },
}

assert colors == EXPECTED_COLORS
assert widths == ["2", "4"]
assert not any(tag in source for tag in ("<linearGradient", "<radialGradient", "<filter"))
assert not re.search(r"(?:fill-)?opacity", source)
assert result["symbol_box"] == EXPECTED_SYMBOL_BOX
assert result["eye_box"] == EXPECTED_EYE_BOX
assert not result["path_grid_violations"]
assert result["mirrored_use_count"] == 2
assert result["canonical_mirror_difference_pixels"] == 0
assert result["small_icon"]["view_box"] == "246 246 762 762"
assert set(result["small_icon"]["colors"]).issubset(EXPECTED_COLORS)
assert not result["small_icon"]["path_grid_violations"]
assert result["small_icon"]["mirrored_use_count"] == 1
print(json.dumps(result, indent=2))
