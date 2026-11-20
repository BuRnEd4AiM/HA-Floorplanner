"""Die PNGs von phone_tour.py als kleine JPGs mit großer Nummer („Bild 7 · JETZT“) nach docs/ideen-5.22.
    python3 docs/ideen-5.22/to_jpg.py <ordner> docs/ideen-5.22"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
S, D = Path(sys.argv[1]), Path(sys.argv[2])
for name in (S / "names.txt").read_text().split():
    im = Image.open(S / f"{name}.png").convert("RGB")
    im = im.resize((780, round(im.height * 780 / im.width)), Image.LANCZOS)
    num = int(name.split("-")[0]); text = f"Bild {num} · JETZT"
    f = ImageFont.truetype(FONT, 34); d = ImageDraw.Draw(im)
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    d.rounded_rectangle((18, 18, 18 + r - l + 34, 18 + b - t + 34), radius=16, fill=(205, 70, 60), outline=(255, 255, 255), width=3)
    d.text((35 - l, 35 - t), text, font=f, fill=(255, 255, 255))
    im.save(D / f"{name}.jpg", quality=78, optimize=True)
print("ok")
