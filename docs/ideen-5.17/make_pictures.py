"""Beispielbilder für docs/ideen-5.17 (2026-11-17): der Helfer „🌙 Nachtlicht-Weg“ in vier Schritten, nur fürs Foto in die echte Demo
gemalt (mockup.js, dazu die Stile von docs/ideen-5.15/mockup.js). Aufruf (Demo vorher bauen: cd demo && npm ci && node build.mjs):
    python3 docs/ideen-5.17/make_pictures.py <ordner>
danach python3 docs/ideen-5.17/to_jpg.py <ordner> docs/ideen-5.17 (JPG mit großer Nummer)."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
BASE = (Path(__file__).parent.parent / "ideen-5.15" / "mockup.js").read_text()
MOCK = (Path(__file__).parent / "mockup.js").read_text()

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    for n in (1, 2, 3, 4):
        c = b.new_context(locale="de-DE", viewport={"width": 1400, "height": 900}, device_scale_factor=2)
        pg = c.new_page()
        pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
        pg.goto(demo + "?debug=1&skytime=02:30&mode=live")
        pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000); pg.wait_for_timeout(1000)
        if n == 4:
            pg.click("[data-tab=routines]"); pg.wait_for_timeout(1500)
        else:
            pg.evaluate("() => window.__fp.switchFloor(1)"); pg.wait_for_timeout(1500)
            pg.evaluate("""() => { const fp = window.__fp, f = fp.layout.floors[1];
              const xs = f.rooms.flatMap((r) => r.points.map((q) => q[0])), zs = f.rooms.flatMap((r) => r.points.map((q) => q[1]));
              const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
              fp.camAt(cx - 4, fp.elev(1) + 17, cz + 19, cx + 1, cz); }""")
            pg.wait_for_timeout(2500)
        pg.add_script_tag(content=BASE); pg.add_script_tag(content=MOCK); pg.wait_for_timeout(300)
        if n == 4:
            pg.evaluate("() => { const l = document.getElementById('mkLayer'); if (l) l.innerHTML = ''; }")
        print(n, pg.evaluate(f"() => mockNight({n})")); pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / f"{n}.png"))
        c.close()
    b.close()
