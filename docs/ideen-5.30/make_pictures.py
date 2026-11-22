"""Beispielbilder für docs/ideen-5.30 (2026-11-22, #779): der JSON-Import mit einer KI sichtbarer, heute und neu, mit großer Nummer im Bild
(„Idee 2 · Bild 4 · NEU“, rot = heute, grün = neu). Die Ideen malt mockup.js nur fürs Foto in die echte Demo, die GitHub-Seite baut
readme_mock.py nach.
Aufruf (Demo vorher bauen: cd demo && npm ci && node build.mjs):  python3 docs/ideen-5.30/make_pictures.py <ordner für die PNGs>
Die JPGs (Qualität 80) landen in docs/ideen-5.30/."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import readme_mock  # noqa: E402

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
demo = (HERE.parents[1] / "demo/floorplan3d-demo.html").as_uri()
MOCK = (HERE / "mockup.js").read_text()
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
# Bild → (Idee, Name der Idee)
IDEA = {1: (1, "GitHub-Seite"), 2: (1, "GitHub-Seite"), 3: (2, "Willkommen"), 4: (2, "Willkommen"), 5: (3, "Erste Schritte"),
        6: (3, "Erste Schritte"), 7: (4, "Import-Fenster"), 8: (4, "Import-Fenster")}


def label(im, num, new):
    idea, what = IDEA[num]
    text = f"Idee {idea} · Bild {num} · {'NEU' if new else 'HEUTE'} · {what}"
    size = max(24, im.width // 34)
    f = ImageFont.truetype(FONT, size)
    left, top, right, bottom = ImageDraw.Draw(im).textbbox((0, 0), text, font=f); pad = size // 2
    band = bottom - top + 2 * pad + size                       # a strip of its own above the picture: the number covers nothing
    out = Image.new("RGB", (im.width, im.height + band), (24, 28, 36)); out.paste(im, (0, band))
    d = ImageDraw.Draw(out); x, y = size // 2, size // 2
    d.rounded_rectangle((x, y, x + right - left + 2 * pad, y + bottom - top + 2 * pad), radius=size // 2,
                        fill=(46, 160, 87) if new else (205, 70, 60), outline=(255, 255, 255), width=3)
    d.text((x + pad - left, y + pad - top), text, font=f, fill=(255, 255, 255))
    return out


def save(png, num, new, name, crop=None, width=1400):
    im = Image.open(png).convert("RGB")
    if crop:
        k = im.width / 1400
        im = im.crop(tuple(int(v * k) for v in crop))
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    dst = HERE / f"{num:02d}-{name}-{'neu' if new else 'heute'}.jpg"
    label(im, num, new).save(dst, quality=80, optimize=True)
    print(dst.name, im.size, dst.stat().st_size // 1024, "KB")


def around(pg, sel, pad=30):
    """the part of the screen around element sel (CSS pixels), a little bigger"""
    r = pg.evaluate("(s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }", sel)
    return (max(0, r[0] - pad), max(0, r[1] - pad), min(1400, r[2] + pad), min(900, r[3] + pad))


def empty_house(b):
    """die Demo im Bearbeiten, mit einem neuen leeren Haus: das Willkommen-Fenster ist offen"""
    c = b.new_context(locale="de-DE", viewport={"width": 1400, "height": 900}, device_scale_factor=2)
    pg = c.new_page()
    pg.on("dialog", lambda d: d.accept("Mein Haus") if d.type == "prompt" else d.accept())
    pg.goto(demo + "?debug=1&skytime=13:00&mode=edit")
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000)
    pg.wait_for_timeout(1500)
    pg.evaluate("() => document.getElementById('houseNew').click()")
    pg.wait_for_function("() => !document.getElementById('welcome').hidden", timeout=30000)
    pg.wait_for_timeout(1200)
    pg.add_script_tag(content=MOCK)
    return c, pg


with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)

    # ① die GitHub-Seite: oben ein Hinweis „Fastest start“ und ein Knopf neben der Demo
    for new, num in ((False, 1), (True, 2)):
        c = b.new_context(viewport={"width": 1400, "height": 1000}, device_scale_factor=2)
        pg = c.new_page()
        html = readme_mock.write(OUT / f"readme-{num}.html", new)
        pg.goto(html.as_uri()); pg.wait_for_timeout(500)
        h = pg.evaluate("() => document.body.scrollHeight")
        pg.set_viewport_size({"width": 1400, "height": h + 20})
        pg.screenshot(path=str(OUT / f"{num}.png"))
        save(OUT / f"{num}.png", num, new, "github", crop=(195, 70, 1205, h + 20), width=1100)
        c.close()

    # ② Willkommen-Fenster, ③ Erste Schritte, ④ Import-Fenster: heute und neu
    for new in (False, True):
        c, pg = empty_house(b)
        if new: pg.evaluate("() => mockWelcome()"); pg.wait_for_timeout(200)
        pg.screenshot(path=str(OUT / f"{4 if new else 3}.png"))
        save(OUT / f"{4 if new else 3}.png", 4 if new else 3, new, "willkommen", crop=around(pg, "#welcome"), width=1200)

        pg.click("#welClose"); pg.wait_for_timeout(300)
        pg.click("#topMoreBtn"); pg.wait_for_timeout(300)
        pg.click("button.tmRow[data-act=first]"); pg.wait_for_timeout(600)
        if new: pg.evaluate("() => mockFirstSteps()"); pg.wait_for_timeout(200)
        pg.screenshot(path=str(OUT / f"{6 if new else 5}.png"))
        save(OUT / f"{6 if new else 5}.png", 6 if new else 5, new, "erste-schritte", crop=around(pg, "#firstSteps"), width=1200)

        pg.evaluate("() => { document.getElementById('firstSteps').hidden = true; document.getElementById('importDialog').showModal(); }")
        pg.wait_for_timeout(500)
        if new: pg.evaluate("() => mockImport()"); pg.wait_for_timeout(200)
        pg.screenshot(path=str(OUT / f"{8 if new else 7}.png"))
        save(OUT / f"{8 if new else 7}.png", 8 if new else 7, new, "import",
             crop=around(pg, "#importDialog", 20), width=1200)
        c.close()
    b.close()
