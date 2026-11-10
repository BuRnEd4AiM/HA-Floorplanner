"""The pictures of the answer to #705 (where a room's temperature comes from): the field "Temperatur von" of the demo's living room with
its choices, and the living room in the live view with "Automatisch" (the mean with the warm light switch) and "Thermostat".

    python3 docs/antworten/705/make_pictures.py <the built beta demo .html> <out folder>

The demo: `cd demo && node build.mjs <file> --beta`. Playwright with the preinstalled Chromium."""
import sys
from PIL import Image
from playwright.sync_api import sync_playwright

DEMO, OUT = sys.argv[1], sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": 1400, "height": 860}, device_scale_factor=2, locale="de-DE", timezone_id="Europe/Berlin")
    def open_(mode):
        pg.goto(f"file://{DEMO}?debug=1&mode={mode}&skytime=13:00")
        pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=90000); pg.wait_for_timeout(2500)
    # 1: the field, its list opened as a box (a native list does not show on a screenshot)
    open_("edit")
    pg.evaluate("window.__fp.select('room', 'r1')"); pg.wait_for_timeout(800)
    pg.evaluate("""() => { const s = document.getElementById('roomTempFrom'), row = s.closest('.prop'), side = row.closest('aside, #panel') || row.parentElement;
      side.style.width = '560px'; side.style.maxWidth = 'none';                        // wide enough for the names of the sensors
      s.size = s.options.length; Object.assign(s.style, { height: 'auto', width: '100%', maxWidth: 'none' });
      Object.assign(row.style, { display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }); s.scrollIntoView({ block: 'center' }); }""")
    pg.wait_for_timeout(800)
    box = pg.evaluate("""() => { const a = document.getElementById('roomTempFrom').closest('.prop').getBoundingClientRect(),
      h = document.getElementById('roomSrcHint').getBoundingClientRect(); return [a.left - 14, a.top - 10, Math.max(a.right, h.right) + 14, h.bottom + 14]; }""")
    pg.screenshot(path=f"{OUT}/_1.png", clip={"x": box[0], "y": box[1], "width": box[2] - box[0], "height": box[3] - box[1]})
    # 2: the living room in the live view: automatic (the mean, too high with the switch) and thermostat
    shots = []
    for i, src in enumerate(["", "climate"]):
        open_("live")
        pg.evaluate(f"""() => {{ const r = window.__fp.layout.floors.flatMap((f) => f.rooms).find((x) => x.id === 'r1');
          if ('{src}') r.tempFrom = '{src}'; else delete r.tempFrom; window.__fp.rebuild(); }}""")
        pg.wait_for_timeout(2500)
        t = pg.locator("#roomTiles [data-room=r1]").bounding_box()
        pg.screenshot(path=f"{OUT}/_2{i}.png", clip={"x": t["x"] - 10, "y": t["y"] - 10, "width": t["width"] + 20, "height": t["height"] + 20})
        shots.append(f"{OUT}/_2{i}.png")
    b.close()
Image.open(f"{OUT}/_1.png").convert("RGB").save(f"{OUT}/1-temperatur-von.jpg", quality=85)
a, c = (Image.open(x).convert("RGB") for x in shots)
gap = 40
out = Image.new("RGB", (a.width + c.width + gap, max(a.height, c.height)), (24, 28, 36))
out.paste(a, (0, 0)); out.paste(c, (a.width + gap, 0))
out.save(f"{OUT}/2-automatisch-thermostat.jpg", quality=85)
