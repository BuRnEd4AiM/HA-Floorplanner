"""The PNGs of make_pictures.py as small JPGs for docs/ideen-5.10, with a big label in each picture ("Idee 2 · Bild 6 · NEU", red = today,
green = new; the owner, 2026-11-12: "bitte gebe den bilder nummern ich versteh das sonst nicht").
    python3 docs/ideen-5.10/to_jpg.py <ordner der PNGs> docs/ideen-5.10
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# (Quelle, Ziel, Idee (0 = heute), Breite am Ende)
JOBS = [
    ("01-heute-pc", "01-heute-pc", 0, 1400), ("02-heute-handy", "02-heute-handy", 0, 780), ("03-heute-ganz", "03-heute-ganz", 0, 1200),
    ("kacheln-handy", "04-kacheln-handy", 1, 780), ("kacheln-pc", "05-kacheln-pc", 1, 1400),
    ("schieber-handy", "06-schieber-handy", 2, 780), ("schieber-pc", "07-schieber-pc", 2, 1400),
    ("reiter-handy", "08-reiter-handy", 3, 780), ("reiter-handy-klima", "09-reiter-handy-klima", 3, 780), ("reiter-pc", "10-reiter-pc", 3, 1400),
    ("kurz-handy", "11-kurz-handy", 4, 780), ("kurz-handy-ganz", "12-kurz-handy-hochgezogen", 4, 780),
    ("grundriss-handy", "13-grundriss-handy", 5, 780), ("grundriss-pc", "14-grundriss-pc", 5, 1400),
]


def label(im, num, idea):
    text = f"Idee {idea} · Bild {num} · NEU" if idea else f"Bild {num} · HEUTE"
    size = max(24, min(im.width // 26, 40))
    f = ImageFont.truetype(FONT, size); d = ImageDraw.Draw(im)
    l, t, r, b = d.textbbox((0, 0), text, font=f); pad = size // 2
    x, y = size // 2, size // 2
    d.rounded_rectangle((x, y, x + r - l + 2 * pad, y + b - t + 2 * pad), radius=size // 2,
                        fill=(46, 160, 87) if idea else (205, 70, 60), outline=(255, 255, 255), width=3)
    d.text((x + pad - l, y + pad - t), text, font=f, fill=(255, 255, 255))
    return im


def columns(im, n=3, gap=24):
    """the long card of today in n columns side by side (it is about three phone screens long)"""
    h = -(-im.height // n)
    out = Image.new("RGB", (im.width * n + gap * (n - 1), h), (12, 16, 22))
    for i in range(n):
        out.paste(im.crop((0, i * h, im.width, min(im.height, (i + 1) * h))), (i * (im.width + gap), 0))
    return out


S = Path(sys.argv[1]); D = Path(sys.argv[2])
for src, dst, idea, w in JOBS:
    im = Image.open(S / f"{src}.png").convert("RGB")
    if src == "03-heute-ganz":
        im = columns(im)
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    label(im, int(dst.split("-")[0]), idea)
    im.save(D / f"{dst}.jpg", quality=80, optimize=True)
    print(dst, im.size, (D / f"{dst}.jpg").stat().st_size // 1024, "KB")
