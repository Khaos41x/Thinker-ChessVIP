import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_bmad-output/implementation-artifacts/recommendation-arrows"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    image = Image.open(ROOT / "assets/chesscom-arrows.png").convert("RGB")
    dark, light = image.getpixel((10, 440)), image.getpixel((10, 490))
    orange_dark, orange_light = image.getpixel((43, 480)), image.getpixel((43, 490))
    native = (255, 170, 0)
    def alpha(background, observed):
        vector = [a-b for a,b in zip(native, background)]
        return sum(v*(o-b) for v,o,b in zip(vector,observed,background))/sum(v*v for v in vector)
    def mask(x,y):
        background=light if ((x-3)//80+(y-3)//80)%2==0 else dark
        pixel=image.getpixel((x,y))
        opacity=alpha(background,pixel)
        residual=max(abs(o-(b+opacity*(a-b))) for o,b,a in zip(pixel,background,native))
        return opacity>0.03 and residual<3
    runs={y:[x for x in range(20,66) if mask(x,y)] for y in range(400,500)}
    tip=min(y for y,pixels in runs.items() if pixels)
    tail=max(y for y,pixels in runs.items() if pixels)
    shaft=len(runs[480])
    head=max(map(len,runs.values()))
    head_base=max(y for y,pixels in runs.items() if len(pixels)>shaft)
    head_length=head_base-tip+1
    tail_inset=523-tail
    report = {
        "image": list(image.size), "squarePx":80,
        "boardBounds":[3,3,643,643],
        "measurementMethod":"Full-coverage color runs, with antialias edge uncertainty +/-1 px; board grid repeats every 80 px.",
        "shaftIncludingAntialiasPx":shaft,
        "headIncludingAntialiasPx":head,
        "headLengthPx":head_length, "tailInsetPx":tail_inset,
        "normalized":{"shaft":shaft/80,"headWidth":head/80,"headLength":head_length/80,"tailInset":tail_inset/80},
        "colors":{"dark":dark,"light":light,"overDark":orange_dark,"overLight":orange_light,"nativeOrange":native},
        "alphaDark":alpha(dark,orange_dark),"alphaLight":alpha(light,orange_light),
    }
    (OUT/"reference-measurements.json").write_text(json.dumps(report,indent=2),encoding="utf8")
    before = Image.open(ROOT/"assets/thinker-arrow-before.png").convert("RGB")
    board = Image.new("RGB",(640,640))
    for row in range(8):
        for col in range(8):
            tile=Image.new("RGB",(80,80), light if (row+col)%2==0 else dark)
            if row in (0,1,6,7):
                sample_col=col if row!=6 else (0 if col%2==0 else 1)
                if row==6:
                    piece=before.crop((sample_col*80+16,row*80+2,sample_col*80+70,row*80+76))
                    tile.paste(piece,(16,0))
                else:
                    tile=before.crop((col*80,row*80+2,col*80+80,row*80+82))
            board.paste(tile,(col*80,row*80))
    board.save(OUT/"initial-board.png")
    flipped=Image.new("RGB",(640,640))
    for row in range(8):
        for col in range(8):
            flipped.paste(board.crop((col*80,row*80,(col+1)*80,(row+1)*80)),((7-col)*80,(7-row)*80))
    flipped.save(OUT/"initial-board-black.png")
    print(json.dumps(report,indent=2))


if __name__ == "__main__":
    main()
