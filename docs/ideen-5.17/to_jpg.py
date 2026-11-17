"""The PNGs of make_pictures.py as small JPGs for docs/ideen-5.17, with a big label in each picture ("Idee 2 · Bild 6 · NEU", red = today,
green = new; the owner, 2026-11-12: "bitte gebe den bilder nummern ich versteh das sonst nicht").
    python3 docs/ideen-5.17/to_jpg.py <ordner der PNGs> docs/ideen-5.17
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# (Quelle, Ziel, Idee, Breite am Ende)
JOBS = [("1", "01-start", 1, 1400), ("2", "02-lampen", 1, 1400), ("3", "03-wann", 1, 1400), ("4", "04-ablauf", 1, 1400)]


def label(im, num, idea):
    text = f"Bild {num} · NEU" if idea else f"Bild {num} · HEUTE"
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
