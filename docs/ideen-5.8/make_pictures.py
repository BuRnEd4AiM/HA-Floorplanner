"""Beispielbilder für docs/ideen-5.8 (2026-11-12): die echte Demo, die Ideen nur fürs Foto hineingemalt (mockup.js).
Aufruf (Demo vorher bauen: cd demo && npm ci && node build.mjs):  python3 docs/ideen-5.8/make_pictures.py <ordner>
Die PNGs landen in <ordner>; danach als JPG (Qualität 80) nach docs/ideen-5.8/."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ONLY = set(sys.argv[2:])
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
MOCK = (Path(__file__).parent / "mockup.js").read_text()
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]


def open_page(b, query="&mode=live", **ctx):
    c = b.new_context(locale="de-DE", **ctx)
    pg = c.new_page()
    pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); localStorage.removeItem('fp3d.setGroup'); } catch (e) {}")
    pg.goto(demo + "?debug=1&skytime=13:00" + query)
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000)
    pg.wait_for_timeout(1200)
    pg.add_script_tag(content=MOCK)
    return c, pg


def settings(pg, group):
    pg.click("#settingsBtn"); pg.wait_for_timeout(500)
    pg.click(f"#sgNav [data-group={group}]"); pg.wait_for_timeout(400)


def want(name):
    return not ONLY or name in ONLY


with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    DESK = {"viewport": {"width": 1400, "height": 900}, "device_scale_factor": 2}
    TALL = {"viewport": {"width": 1400, "height": 1500}, "device_scale_factor": 1.5}

    # ① Allgemein und 3D-Bild: heute und mit Schaltern, Knopfleisten, Schiebereglern
    if want("controls"):
        c, pg = open_page(b, **DESK)
        settings(pg, "general"); pg.screenshot(path=str(OUT / "01-allgemein-heute.png"))
        pg.evaluate("() => { mockControls(); mockClamp(); }"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "02-allgemein-neu.png"))
        pg.click("#sgNav [data-group=view]"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "03-3dbild-neu.png"))
        pg.click("#sgNav [data-group=floors]"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "03b-etagen-neu.png"))
        c.close()
        c, pg = open_page(b, **DESK)
        settings(pg, "view"); pg.screenshot(path=str(OUT / "03a-3dbild-heute.png"))
        c.close()

    # ② Reiter unten: heute eine lange Liste, neu je Seite ein Knopf
    if want("tabs"):
        c, pg = open_page(b, **TALL)
        settings(pg, "tabs"); pg.screenshot(path=str(OUT / "04-reiter-heute.png"))
        c.close()
        c, pg = open_page(b, **DESK)
        settings(pg, "tabs"); pg.evaluate("() => { mockTabsPages(2); mockControls(); }"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "05-reiter-neu.png"))
        c.close()

    # ③ Warnungen & Alarm: drei Karten
    if want("alarm"):
        c, pg = open_page(b, **TALL)
        settings(pg, "alarm"); pg.screenshot(path=str(OUT / "06a-alarm-heute.png"))
        c.close()
        c, pg = open_page(b, **DESK)
        settings(pg, "alarm"); pg.evaluate("() => { mockAlarm(0); mockControls(); }"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "06-alarm-neu.png"))
        c.close()

    # ④ Anleitungen eingeklappt: Wandtablet und Sprachsuche
    if want("guides"):
        c, pg = open_page(b, **DESK)
        settings(pg, "tablet"); pg.screenshot(path=str(OUT / "07a-wandtablet-heute.png"))
        pg.evaluate("() => { mockGuides(); mockControls(); mockClamp(); }"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "07-wandtablet-neu.png"))
        c.close()
        c, pg = open_page(b, **DESK)
        settings(pg, "voice"); pg.wait_for_timeout(800); pg.screenshot(path=str(OUT / "08a-sprache-heute.png"))
        pg.evaluate("() => { mockGuides(); mockControls(); mockClamp(); }"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "08-sprache-neu.png"))
        c.close()

    # ⑤ Licht-Gruppen als Raum-Knöpfe
    if want("light"):
        c, pg = open_page(b, **DESK)
        settings(pg, "quick")
        pg.evaluate("() => document.getElementById('lgGroups').scrollIntoView()"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "09a-lichtgruppen-heute.png"))
        pg.evaluate("() => { mockLightGroups(); document.getElementById('lgGroups').scrollIntoView(); }"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "09-lichtgruppen-neu.png"))
        c.close()

    # ⑥ Kopfleiste beim Bearbeiten am Tablet
    if want("header"):
        TAB = {"viewport": {"width": 1180, "height": 820}, "device_scale_factor": 2, "has_touch": True, "is_mobile": True}
        c, pg = open_page(b, "&mode=edit", **TAB)
        pg.screenshot(path=str(OUT / "10-kopfleiste-heute.png"))
        print("moved", pg.evaluate("() => mockHeader(true)"))
        pg.evaluate("() => window.dispatchEvent(new Event('resize'))"); pg.wait_for_timeout(1500)
        pg.screenshot(path=str(OUT / "11-kopfleiste-neu.png"))
        c.close()

    # ⑦ Handy oben: heute (Etage und Zimmer abgeschnitten), neu (ein Knopf für Etage und Zimmer, der Alarm als 🛡️), neu mit offenem Menü
    if want("phone"):
        PH = {k: v for k, v in p.devices["iPhone 13"].items() if k != "device_scale_factor"}
        c, pg = open_page(b, "&mode=live", device_scale_factor=2, **PH)
        pg.tap("#roomMenuBtn", force=True); pg.wait_for_timeout(400)   # die Zimmer lesen (das Menü füllt sich beim Öffnen)
        pg.screenshot(path=str(OUT / "12-handy-heute.png"), clip={"x": 0, "y": 0, "width": 390, "height": 420})
        pg.tap("#roomMenuBtn", force=True); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / "12b-handy-heute-zu.png"), clip={"x": 0, "y": 0, "width": 390, "height": 420})
        pg.evaluate("() => mockPhoneTop(false)"); pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / "13-handy-neu.png"), clip={"x": 0, "y": 0, "width": 390, "height": 420})
        pg.evaluate("() => mockPhoneTop(true)"); pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / "14-handy-neu-menue.png"), clip={"x": 0, "y": 0, "width": 390, "height": 560})
        c.close()
    b.close()
