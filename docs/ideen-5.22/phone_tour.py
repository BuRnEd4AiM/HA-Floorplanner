"""Bilder der neuen Handy-Ansicht (5.22.0) zum Durchsehen (der Besitzer, 2026-11-20: „mehr beispiel bilder … das ich mal die
einstellungen sehe und die menüs“): die echte Demo am Handy, jeder Bildschirm ein Bild mit Nummer.
Aufruf (Demo vorher bauen): python3 docs/ideen-5.22/phone_tour.py <ordner>; dann to_jpg.py <ordner> docs/ideen-5.22"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
PHONE = {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2, "is_mobile": True, "has_touch": True, "locale": "de-DE",
         "timezone_id": "Europe/Berlin"}
n = [0]
names = []


def snap(pg, name, wait=700):
    pg.wait_for_timeout(wait)
    n[0] += 1
    f = f"{n[0]:02d}-{name}"
    pg.screenshot(path=str(OUT / f"{f}.png"))
    names.append(f)
    print(f)


def tap(pg, sel, wait=700, nth=0):
    loc = pg.locator(sel).nth(nth)
    loc.scroll_into_view_if_needed(timeout=5000)
    loc.tap(timeout=8000)
    pg.wait_for_timeout(wait)


def maybe(pg, sel, name, nth=0):
    if pg.locator(sel).count() > nth and pg.locator(sel).nth(nth).is_visible():
        tap(pg, sel, nth=nth); snap(pg, name); return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    c = b.new_context(**PHONE); pg = c.new_page()
    pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
    pg.goto(demo + "?debug=1&skytime=19:40"); pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000); pg.wait_for_timeout(3000)
    snap(pg, "start")
    pg.mouse.wheel(0, 600); pg.evaluate("document.querySelector('[data-page=start]').scrollTop = 600"); snap(pg, "start-unten")
    pg.evaluate("document.querySelector('[data-page=start]').scrollTop = 0")
    # the chips of Start
    for chip in ("lights", "open", "low", "offline"):
        if pg.locator(f"[data-page=start] [data-chip={chip}]").count():
            tap(pg, f"[data-page=start] [data-chip={chip}]", 1200); snap(pg, f"chip-{chip}")
            pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
            tap(pg, "#tabBar [data-tab=start]", 800)
    tap(pg, "#tabBar [data-tab=rooms]"); snap(pg, "raeume")
    pg.locator("[data-page=rooms] .apRoom", has_text="Wohnzimmer").first.tap(); pg.wait_for_timeout(1500); snap(pg, "raum-licht")
    for tab in ("scenes", "cover", "climate", "devices", "open", "values"):
        if pg.locator(f"#roomPanel .rpTab[data-tab={tab}]").count():
            tap(pg, f"#roomPanel .rpTab[data-tab={tab}]", 900); snap(pg, f"raum-{tab}")
    # a lamp's colours
    tap(pg, "#roomPanel .rpTab[data-tab=light]", 600)
    if pg.locator("#roomPanel .rpLight .rpMore, #roomPanel .rpLight button").count():
        maybe(pg, "#roomPanel .rpLight button", "raum-lampe-farben")
    tap(pg, "#appBack")
    # 3D house
    tap(pg, "#tabBar [data-tab=house]", 2000); snap(pg, "haus-3d")
    maybe(pg, "#tbMenuBtn", "haus-menue")
    pg.keyboard.press("Escape"); pg.mouse.click(200, 500); pg.wait_for_timeout(400)
    maybe(pg, "#phoneNavBtn", "haus-etagen")
    pg.keyboard.press("Escape"); pg.mouse.click(200, 500); pg.wait_for_timeout(400)
    maybe(pg, "#phoneStatusBtn", "haus-status")
    pg.keyboard.press("Escape"); pg.mouse.click(200, 500); pg.wait_for_timeout(400)
    maybe(pg, "#viewMenuBtn", "haus-ansicht")
    pg.keyboard.press("Escape"); pg.mouse.click(200, 700); pg.wait_for_timeout(400)
    # energy
    tap(pg, "#tabBar [data-tab=energy]", 2500); snap(pg, "energie")
    pg.evaluate("document.querySelector('[data-page=energy]').scrollTop = 900"); snap(pg, "energie-unten")
    # more
    tap(pg, "#tabBar [data-tab=more]"); snap(pg, "mehr")
    keys = pg.evaluate("[...document.querySelectorAll('.apSheet [data-tab]')].map((b) => b.dataset.tab)")
    pg.mouse.click(200, 60); pg.wait_for_timeout(300)
    for k in keys:
        tap(pg, "#tabBar [data-tab=more]", 500)
        tap(pg, f".apSheet [data-tab={k}]", 2200); snap(pg, f"seite-{k}")
    # settings
    tap(pg, "#tabBar [data-tab=more]", 500)
    tap(pg, ".apSheet [data-act=appSettings]", 1500); snap(pg, "einstellungen")
    groups = pg.evaluate("[...document.querySelectorAll('#settingsDialog details.setGroup, dialog details.setGroup')].map((g) => g.dataset.group)")
    for g in groups:
        pg.evaluate("""(g) => { document.querySelectorAll('details.setGroup').forEach((d) => { d.open = d.dataset.group === g; });
          const d = document.querySelector(`details.setGroup[data-group="${g}"]`); d?.closest('dialog')?.dispatchEvent(new CustomEvent('sg-show', { detail: g }));
          d?.scrollIntoView(); }""", g)
        snap(pg, f"einst-{g}", 900)
    c.close(); b.close()
(OUT / "names.txt").write_text("\n".join(names))
