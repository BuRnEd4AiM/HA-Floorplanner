"""The PNGs of make_pictures.cjs as small JPGs for docs/ideen-5.37, with a big label in each picture (red = today, green = new).
    python3 docs/ideen-5.37/to_jpg.py <ordner der PNGs> docs/ideen-5.37"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
# (Quelle, Ziel, Beschriftung, neu?, Breite)
JOBS = [("1-heute", "01-heute", "Bild 1 · HEUTE", False, 1400), ("2-idee1", "02-idee1-haus-mit-stromfluss", "Idee 1 · Bild 2 · NEU", True, 1400),
        ("3-idee2", "03-idee2-glas", "Idee 2 · Bild 3 · NEU", True, 1400), ("4-handy-heute", "04-handy-heute", "Bild 4 · HEUTE", False, 780),
        ("5-idee3", "05-idee3-handy", "Idee 3 · Bild 5 · NEU", True, 780),
        # Teil 2: Design „Glas (Apple-Stil)“ für die ganze App (make_theme.cjs)
        ("6-einstellung", "06-glas-einstellung", "Glas · Bild 6 · NEU", True, 1400), ("7-haus-glas", "07-glas-haus", "Glas · Bild 7 · NEU", True, 1400),
        ("8-heute-glas", "08-glas-heute", "Glas · Bild 8 · NEU", True, 1400), ("9-energie-glas", "09-glas-energie", "Glas · Bild 9 · NEU", True, 1400),
        ("10-heute-glas-hell", "10-glas-hell-heute", "Glas hell · Bild 10 · NEU", True, 1400),
        ("11-handy-glas", "11-glas-handy", "Glas · Bild 11 · NEU", True, 780), ("12-handy-glas-hell", "12-glas-hell-handy", "Glas hell · Bild 12 · NEU", True, 780),
        ("13-einstellung-glas", "13-glas-einstellungen", "Glas · Bild 13 · NEU", True, 1400), ("14-raum-glas", "14-glas-raumkarte", "Glas · Bild 14 · NEU", True, 1400),
        ("15-raum-glas-hell", "15-glas-hell-raumkarte", "Glas hell · Bild 15 · NEU", True, 1400),
        # Teil 3: die Leisten unten schweben über dem 3D-Bild (make_dock.cjs)
        ("16-leiste-heute", "16-leiste-heute", "Bild 16 · HEUTE (5.37.0)", False, 1400), ("17-leiste-neu-dunkel", "17-leiste-neu-dunkel", "Bild 17 · NEU", True, 1400),
        ("18-leiste-neu-hell", "18-leiste-neu-hell", "Glas hell · Bild 18 · NEU", True, 1400), ("19-leiste-neu-tablet", "19-leiste-neu-tablet", "Tablet · Bild 19 · NEU", True, 1400),
        ("20-eine-kapsel-dunkel", "20-eine-kapsel-dunkel", "Eine Kapsel · Bild 20 · NEU", True, 1400), ("21-eine-kapsel-hell", "21-eine-kapsel-hell", "Eine Kapsel hell · Bild 21 · NEU", True, 1400),
        ("22-eine-kapsel-tablet", "22-eine-kapsel-tablet", "Eine Kapsel Tablet · Bild 22 · NEU", True, 1400),
        ("23-eine-kapsel-tablet-hoch", "23-eine-kapsel-tablet-hoch", "Tablet hoch · Bild 23 · NEU", True, 1080)]


def label(im, text, new):
    size = max(28, min(im.width // 40, 44))
    f = ImageFont.truetype(FONT, size); d = ImageDraw.Draw(im)
    l, t, r, b = d.textbbox((0, 0), text, font=f); pad = size // 2
    w, h = r - l + 2 * pad, b - t + 2 * pad
    x = im.width - w - size if im.width > 1000 else (im.width - w) // 2
    y = size if im.width > 1000 else im.height - h - im.height // 7
    d.rounded_rectangle((x, y, x + w, y + h), radius=size // 2, fill=(46, 160, 87) if new else (205, 50, 50), outline=(255, 255, 255), width=3)
    d.text((x + pad - l, y + pad - t), text, font=f, fill=(255, 255, 255))


S = Path(sys.argv[1]); D = Path(sys.argv[2])
for src, dst, text, new, w in JOBS:
    if not (S / f"{src}.png").exists():                    # a folder with only some of the pictures (make_dock.cjs): the others stay
        continue
    im = Image.open(S / f"{src}.png").convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    label(im, text, new)
    im.save(D / f"{dst}.jpg", quality=82, optimize=True)
    print(dst, im.size, (D / f"{dst}.jpg").stat().st_size // 1024, "KB")
