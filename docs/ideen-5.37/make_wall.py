"""Das Hintergrundbild für das Design „Glas“: das eigene Haus aus der Demo, ganz verschwommen (wie Bild 3, das dem Besitzer gefiel).
    python3 docs/ideen-5.37/make_wall.py <ordner>     (liest <ordner>/house.jpg, schreibt wall-dark.jpg und wall-light.jpg)"""
import sys
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

D = Path(sys.argv[1])
im = Image.open(D / "house.jpg").convert("RGB")
w, h = im.size
im = im.crop((int(w * .06), int(h * .06), int(w * .94), int(h * .94))).resize((1200, 800), Image.LANCZOS)   # like scale(1.15): no pale edges
im = im.filter(ImageFilter.GaussianBlur(42))
im = ImageEnhance.Color(im).enhance(1.4)
ImageEnhance.Brightness(im).enhance(.55).save(D / "wall-dark.jpg", quality=85)
Image.blend(ImageEnhance.Brightness(im).enhance(1.2), Image.new("RGB", im.size, (245, 245, 250)), .55).save(D / "wall-light.jpg", quality=85)
