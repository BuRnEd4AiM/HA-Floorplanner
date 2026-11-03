"""The example pictures of docs/ideen-4.64/: a sash frame with a handle round the panes, before it was built (mockup.js paints it into the
demo for the photo). Build the demo first (cd demo && node build.mjs), then: python3 docs/ideen-4.64/make_pictures.py /tmp/bilder
(the two pictures here were put together from those shots, with their labels, by hand)."""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "guide"))
from playwright.sync_api import sync_playwright
import clips_edit as CE

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
HERE = Path(__file__).parent
DEMO = (ROOT / "demo" / "floorplan3d-demo.html").resolve().as_uri()
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
SASH = (HERE / "mockup.js").read_text()


class R:                                   # what the preps of the guide need from the recorder
    def __init__(self, pg): self.pg, self.lang, self.prompt = pg, "de", None
    def box(self, sel): return self.pg.locator(sel).bounding_box()


HOLD = """clearInterval(window.__hold); window.__hold = setInterval(() => { const f = window.__fp.fakeState;
  f('binary_sensor.fenster_kueche', 'off'); f('binary_sensor.fenster_wz_offen', 'off'); f('binary_sensor.fenster_wz_gekippt', 'on'); f('binary_sensor.fenster_wohnzimmer', 'on'); }, 150)"""
WINS = """(deg) => { const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()], w = (%s)(f), len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
  w.openings = [
    { id: 'mz', type: 'window', style: 'single', hinge: 'left', pos: len / 2 - 1.7, width: 1.1, height: 1.35, sill: 0.85, entity: 'binary_sensor.fenster_kueche', name: 'zu' },
    { id: 'mk', type: 'window', style: 'single', hinge: 'left', pos: len / 2, width: 1.1, height: 1.35, sill: 0.85, entity: 'binary_sensor.fenster_wz_offen', tiltEntity: 'binary_sensor.fenster_wz_gekippt', name: 'gekippt', ...(deg !== 14 ? { tiltDeg: deg } : {}) },
    { id: 'mo', type: 'window', style: 'single', hinge: 'left', pos: len / 2 + 1.7, width: 1.1, height: 1.35, sill: 0.85, entity: 'binary_sensor.fenster_wohnzimmer', name: 'offen' }];
  fp.rebuild(); }""" % CE.FRONT_WALL
CAM = """([dx, h, back, tx, tz]) => { const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()], w = (%s)(f);
  const mx = (w.a[0] + w.b[0]) / 2, mz = (w.a[1] + w.b[1]) / 2; fp.camAt(mx + dx, h, mz - back, mx + tx, mz + tz); }""" % CE.FRONT_WALL

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    pg = b.new_page(viewport={"width": 1500, "height": 860}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("dialog", lambda d: d.accept("Gartenhaus") if d.type == "prompt" else (d.dismiss() if d.type == "alert" else d.accept()))
    pg.goto(DEMO + "?mode=edit&skytime=13:00&debug=1&lang=de", wait_until="domcontentloaded", timeout=120000)
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000)
    pg.wait_for_timeout(1500)
    pg.evaluate(SASH)
    CE.empty_house(walls=True, rooms=True)(R(pg))
    pg.click("#view3d"); pg.wait_for_timeout(800)
    print("house", pg.evaluate("window.__fp.houseId()"), pg.evaluate("window.__fp.layout.floors.length"))
    pg.evaluate(HOLD)

    def shot(name, deg=14, sash=False, cam=(-0.9, 1.7, 3.9, 0.3, 6)):
        pg.evaluate(WINS, deg); pg.wait_for_timeout(600)
        if sash: pg.evaluate("window.__sash()")
        pg.evaluate(CAM, list(cam)); pg.wait_for_timeout(2500)
        bb = pg.locator("#view").bounding_box()
        pg.screenshot(path=str(OUT / name), type="jpeg", quality=84, clip={"x": bb["x"], "y": bb["y"] + 40, "width": bb["width"], "height": bb["height"] - 40})

    shot("a-heute.jpg")
    shot("b-rahmen.jpg", sash=True)
    NEAR = (-2.4, 1.6, 2.0, 3.0, 2.6)
    shot("c-heute-nah.jpg", cam=NEAR)
    shot("d-rahmen-nah.jpg", sash=True, cam=NEAR)
    shot("e-rahmen-nah-25.jpg", deg=25, sash=True, cam=NEAR)
    print("errors", errs)
    b.close()
