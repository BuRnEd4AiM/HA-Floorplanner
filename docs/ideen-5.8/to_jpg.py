"""The PNGs of make_pictures.py as small JPGs for docs/ideen-5.8, with a big label in each picture ("Idee 2 · Bild 6 · NEU", red = today,
green = new: the owner, 2026-11-12, "bitte gebe den bilder nummern ich versteh das sonst nicht").
    python3 docs/ideen-5.8/to_jpg.py <ordner der PNGs> docs/ideen-5.8
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
IDEA = {'01': 1, '02': 1, '03': 1, '04': 1, '05': 2, '06': 2, '07': 3, '08': 3, '09': 4, '10': 4, '11': 4, '12': 4, '13': 5, '14': 5,
        '15': 6, '16': 6, '17': 7, '17b': 7, '18': 7, '19': 7}
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def label(im, dst):
    num = dst.split('-')[0]; new = '-neu' in dst
    text = f"Idee {IDEA[num]} · Bild {num.lstrip('0')} · {'NEU' if new else 'HEUTE'}"
    size = max(26, im.width // 30)
    f = ImageFont.truetype(FONT, size); d = ImageDraw.Draw(im)
    l, t, r, b = d.textbbox((0, 0), text, font=f); pad = size // 2
    x, y = size // 2, size // 2
    d.rounded_rectangle((x, y, x + r - l + 2 * pad, y + b - t + 2 * pad), radius=size // 2,
                        fill=(46, 160, 87) if new else (205, 70, 60), outline=(255, 255, 255), width=3)
    d.text((x + pad - l, y + pad - t), text, font=f, fill=(255, 255, 255))
    return im
S = Path(sys.argv[1]); D = Path(sys.argv[2])
# (Quelle, Ziel, Ausschnitt in CSS-Pixeln oder None, Breite am Ende)
PANE = (330, 25, 1376, 878)
JOBS = [
  ("01-allgemein-heute", "01-allgemein-heute", PANE, 1400),
  ("02-allgemein-neu", "02-allgemein-neu", PANE, 1400),
  ("03a-3dbild-heute", "03-3dbild-heute", PANE, 1400),
  ("03-3dbild-neu", "04-3dbild-neu", PANE, 1400),
  ("04-reiter-heute", "05-reiter-heute", (330, 25, 1376, 1480), 1100),
  ("05-reiter-neu", "06-reiter-neu", PANE, 1400),
  ("06a-alarm-heute", "07-alarm-heute", (330, 25, 1376, 1480), 1100),
  ("06-alarm-neu", "08-alarm-neu", PANE, 1400),
  ("07a-wandtablet-heute", "09-wandtablet-heute", PANE, 1400),
  ("07-wandtablet-neu", "10-wandtablet-neu", PANE, 1400),
  ("08a-sprache-heute", "11-sprache-heute", PANE, 1400),
  ("08-sprache-neu", "12-sprache-neu", PANE, 1400),
  ("09a-lichtgruppen-heute", "13-lichtgruppen-heute", PANE, 1400),
  ("09-lichtgruppen-neu", "14-lichtgruppen-neu", PANE, 1400),
  ("10-kopfleiste-heute", "15-kopfleiste-heute", None, 1400),
  ("11-kopfleiste-neu", "16-kopfleiste-neu", None, 1400),
  ("12b-handy-heute-zu", "17-handy-heute", None, 780),
  ("12-handy-heute", "17b-handy-heute-zimmer", None, 780),
  ("13-handy-neu", "18-handy-neu", None, 780),
  ("14-handy-neu-menue", "19-handy-neu-menue", None, 780),
]
for src, dst, crop, w in JOBS:
    im = Image.open(S / f"{src}.png").convert("RGB")
    css = im.width / (1400 if crop else im.width)   # Bildpunkte je CSS-Pixel (die Einstellungen sind 1400 breit)
    if crop:
        if src in ("04-reiter-heute", "06a-alarm-heute"): css = im.width / 1400
        im = im.crop(tuple(int(v * css) for v in crop))
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    label(im, dst)
    im.save(D / f"{dst}.jpg", quality=80, optimize=True)
    print(dst, im.size, (D / f"{dst}.jpg").stat().st_size // 1024, "KB")
