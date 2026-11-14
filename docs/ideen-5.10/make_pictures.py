"""Beispielbilder für docs/ideen-5.10 (2026-11-14): neue Entwürfe der Raumkarte (Live, ein Raum angetippt), nur fürs Foto in die echte
Demo gemalt (mockup.js). Aufruf (Demo vorher bauen: cd demo && npm ci && node build.mjs):
    python3 docs/ideen-5.10/make_pictures.py <ordner> [namen …]
Die PNGs landen in <ordner>; danach mit to_jpg.py als JPG mit Nummer nach docs/ideen-5.10/."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ONLY = set(sys.argv[2:])
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
MOCK = (Path(__file__).parent / "mockup.js").read_text()
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]
OFF = ["light.sofa_led", "light.shapes_wz"]       # zwei Lichter aus: dann sieht man an und aus nebeneinander


def open_room(b, room="r1", floor=1, **ctx):
    c = b.new_context(locale="de-DE", **ctx)
    pg = c.new_page()
    pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
    pg.goto(demo + "?debug=1&skytime=21:30&mode=live")
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000)
    pg.wait_for_timeout(1000)
    pg.evaluate("""async (off) => { for (const e of off) await fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'light', service: 'turn_off', entity_id: e }) }); }""", OFF)
    pg.evaluate(f"() => window.__fp.switchFloor({floor})"); pg.wait_for_timeout(600)
    pg.evaluate(f"() => window.__fp.liveTapRoom('{room}')"); pg.wait_for_timeout(2500)
    pg.add_script_tag(content=MOCK)
    return c, pg


def want(name):
    return not ONLY or name in ONLY


with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    DESK = {"viewport": {"width": 1400, "height": 900}, "device_scale_factor": 2}
    PH = {**{k: v for k, v in p.devices["iPhone 13"].items() if k != "device_scale_factor"}, "device_scale_factor": 2}

    if want("heute"):
        c, pg = open_room(b, **DESK)
        pg.screenshot(path=str(OUT / "01-heute-pc.png")); c.close()
        c, pg = open_room(b, **PH)
        pg.screenshot(path=str(OUT / "02-heute-handy.png"))
        # die ganze heutige Karte auf einmal (so lang ist sie am Handy)
        pg.set_viewport_size({"width": 390, "height": 2600})
        pg.evaluate("""() => { const r = document.getElementById('roomPanel'); document.body.append(r);
          Object.assign(r.style, { position: 'absolute', top: '0', left: '0', right: 'auto', bottom: 'auto', width: '366px', maxHeight: 'none', height: 'auto',
            zIndex: 99999, clipPath: 'none', overflow: 'visible' }); }""")
        pg.wait_for_timeout(800)
        pg.locator("#roomPanel").screenshot(path=str(OUT / "03-heute-ganz.png"))
        c.close()

    for n, name in ((1, "kacheln"), (2, "schieber"), (3, "reiter"), (5, "grundriss")):
        if not want(name):
            continue
        c, pg = open_room(b, **PH)
        print(name, "handy", pg.evaluate(f"() => mockRoom({n}, {{ phone: true }})")); pg.wait_for_timeout(1500)
        pg.screenshot(path=str(OUT / f"{name}-handy.png"))
        c.close()
        c, pg = open_room(b, **DESK)
        print(name, "pc", pg.evaluate(f"() => mockRoom({n})")); pg.wait_for_timeout(1200)
        pg.screenshot(path=str(OUT / f"{name}-pc.png"))
        c.close()
        if n == 3:                                   # Reiter: dazu der Reiter „Klima“ am Handy
            c, pg = open_room(b, **PH)
            pg.evaluate("() => mockRoom(3, { phone: true, tab: 'climate' })"); pg.wait_for_timeout(1500)
            pg.screenshot(path=str(OUT / f"{name}-handy-klima.png"))
            c.close()

    if want("kurz"):
        c, pg = open_room(b, **PH)
        pg.evaluate("() => mockRoom(4, { phone: true })"); pg.wait_for_timeout(1500)
        pg.screenshot(path=str(OUT / "kurz-handy.png"))
        pg.evaluate("() => mockRoom(4, { phone: true, full: true })"); pg.wait_for_timeout(1500)
        pg.screenshot(path=str(OUT / "kurz-handy-ganz.png"))
        c.close()
    b.close()
