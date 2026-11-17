"""The PNGs of make_pictures.py as small JPGs for docs/ideen-5.15, with a big label in each picture ("Idee 2 · Bild 6 · NEU", red = today,
green = new; the owner, 2026-11-12: "bitte gebe den bilder nummern ich versteh das sonst nicht").
    python3 docs/ideen-5.15/to_jpg.py <ordner der PNGs> docs/ideen-5.15
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# (Quelle, Ziel, Idee, Breite am Ende)
JOBS = [
    ("1-sonne-haus", "01-sonne-haus", 1, 1400), ("1-sonne-einstellung", "02-sonne-einstellung", 1, 1400),
    ("2-funk", "03-funk-karte", 2, 1400),
    ("3-alarm-handy", "04-alarm-handy", 3, 780), ("3-alarm-haus", "05-alarm-haus", 3, 1400),
    ("4-stromfresser", "06-stromfresser", 4, 1400), ("5-urlaubslicht", "07-urlaubslicht", 5, 1400),
    ("6-nachtlicht", "08-nachtlicht-weg", 6, 1400), ("7-wartung", "09-wartung", 7, 1400),
    ("8-gaeste", "10-gaeste-modus", 8, 1400), ("9-monatsbericht", "11-monatsbericht-handy", 9, 780),
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


S = Path(sys.argv[1]); D = Path(sys.argv[2])
for src, dst, idea, w in JOBS:
    im = Image.open(S / f"{src}.png").convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    label(im, int(dst.split("-")[0]), idea)
    im.save(D / f"{dst}.jpg", quality=80, optimize=True)
    print(dst, im.size, (D / f"{dst}.jpg").stat().st_size // 1024, "KB")
