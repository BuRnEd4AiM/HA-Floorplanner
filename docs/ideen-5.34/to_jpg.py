"""The PNGs of make_pictures.py as small JPGs for docs/ideen-5.34, with a big label in each picture ("Idee 1 · Bild 1 · NEU"; the owner,
2026-11-12: "bitte gebe den bilder nummern ich versteh das sonst nicht").
    python3 docs/ideen-5.34/to_jpg.py <ordner der PNGs> docs/ideen-5.34
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# (Quelle, Ziel, Idee (0 = für beide), Breite am Ende)
JOBS = [("1-knoepfe", "01-idee1-knoepfe", 1, 1400), ("2-kaestchen", "02-idee2-gruene-kaestchen", 2, 1400), ("3-handy", "03-so-kommt-es-an", 0, 780)]


def label(im, num, idea):
    text = f"Idee {idea} · Bild {num} · NEU" if idea else f"Bild {num} · NEU"
    size = max(24, min(im.width // 26, 40))
    f = ImageFont.truetype(FONT, size); d = ImageDraw.Draw(im)
    l, t, r, b = d.textbbox((0, 0), text, font=f); pad = size // 2
    x = im.width - (r - l + 2 * pad) - size // 2 if im.width > 1000 else (im.width - (r - l + 2 * pad)) // 2   # wide: right, phones: middle
    y = im.height - (b - t + 2 * pad) - (size // 2 if im.width > 1000 else im.height // 8)
    d.rounded_rectangle((x, y, x + r - l + 2 * pad, y + b - t + 2 * pad), radius=size // 2, fill=(46, 160, 87), outline=(255, 255, 255), width=3)
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
