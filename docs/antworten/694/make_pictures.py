"""The pictures of the answer to #694 (two openings one above the other, 5.3.0), in German as the question: the demo
(demo/floorplan3d-demo.html, built with 5.3.0) with ChrisSN86's numbers: a middle part 3.60 m high, two terrace doors 1.60 x 2.20 m
(as floor-length windows: only a window has a roller shutter), above each a window 1.60 m wide from 2.95 m, 0.65 m high, each with its
own roller shutter (his entity names).
    python3 docs/antworten/694/make_pictures.py <output folder>      (Playwright with the preinstalled Chromium)"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE
DEMO = (HERE / "../../../demo/floorplan3d-demo.html").resolve().as_uri() + "?debug=1&skytime=11:30&mode=edit"
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]

# the middle part: one room 6 x 6 m, walls 3.60 m high, the terrace side at the top of the plan (z = 0)
HOUSE = """() => {
  const fp = window.__fp, L = fp.layout, wall = (id, a, b, ops) => ({ id, a, b, thickness: 0.3, height: 3.6, openings: ops || [] });
  const door = (id, pos, name, cover) => ({ id, type: 'window', style: 'double', pos, width: 1.6, height: 2.2, sill: 0, name, shutter: true, shutterEntity: cover });
  const high = (id, pos, name, cover) => ({ id, type: 'window', style: 'double', pos, width: 1.6, height: 0.65, sill: 2.95, name, shutter: true, shutterEntity: cover });
  L.floors = [{ id: 'eg', name: 'Erdgeschoss', kind: 'floor', devices: [], stairs: [], blocks: [], holes: [],
    rooms: [{ id: 'r1', name: 'Wohnen', color: '#b89b74', covering: 'herringbone', points: [[0, 0], [6, 0], [6, 6], [0, 6]] }],
    walls: [wall('wN', [0, 0], [6, 0], [
        door('tL', 1.6, 'Terrassentür links', 'cover.jalousie_terrasse_links'), high('oL', 1.6, 'Fenster über Terrassentür links', 'cover.lichterbereich_terrasse_links'),
        door('tR', 4.4, 'Terrassentür rechts', 'cover.jalousie_terrasse_rechts')]),
      wall('wE', [6, 0], [6, 6]), wall('wS', [6, 6], [0, 6]), wall('wW', [0, 6], [0, 0])] }];
  L.neighbors = []; if (L.plot) L.plot.areas = [];
  const st = fp.settings(); st.labelMode = 'none'; st.roomLabels = false;   // no value labels and no room name in the picture: the shutters speak for themselves
  fp.switchFloor(0); fp.rebuild();
}"""
# his roller shutters: the one of the left door half down, the one above it closed, the right ones open
COVERS = """() => {
  const set = () => { const s = window.__fp.states();
    [['cover.jalousie_terrasse_links', 'Jalousie Terrasse links', 50], ['cover.lichterbereich_terrasse_links', 'Lichterbereich Terrasse links', 0],
     ['cover.jalousie_terrasse_rechts', 'Jalousie Terrasse rechts', 100], ['cover.lichterbereich_terrasse_rechts', 'Lichterbereich Terrasse rechts', 100]]
      .forEach(([e, n, p]) => { s[e] = { ...(s[e] || {}), state: p ? 'open' : 'closed', name: n, position: p, attributes: { friendly_name: n, current_position: p } }; }); };
  set(); clearInterval(window.__hold); window.__hold = setInterval(() => { set(); window.__fp.applyStates(); }, 300);
}"""
MARK = """(sel) => { const e = document.querySelector(sel); if (!e) return false; e.scrollIntoView({ block: 'center' });
  const r = e.getBoundingClientRect(), o = document.createElement('div');
  Object.assign(o.style, { position: 'fixed', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px',
    border: '4px solid #ff3b6b', borderRadius: '10px', zIndex: 2147483646, pointerEvents: 'none', boxShadow: '0 0 0 3px rgba(0,0,0,.35)' });
  o.className = 'shotMark'; document.body.append(o); return true; }"""

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    pg = b.new_page(viewport={"width": 1400, "height": 900}, locale="de-DE", device_scale_factor=1.5)
    pg.on("pageerror", lambda e: print("PAGEERROR", e))
    pg.goto(DEMO)
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=90000)
    pg.wait_for_timeout(1500)
    pg.evaluate(HOUSE)
    pg.evaluate(COVERS)
    pg.wait_for_timeout(800)
    print("states", pg.evaluate("JSON.stringify(window.__fp.states()['cover.rollladen_kueche'])"))
    pg.click("#view3d"); pg.wait_for_timeout(800)
    pg.evaluate("window.__fp.camAt(3.0, 2.2, 5.6, 3.0, -12)")
    # 1: the right terrace door selected: „＋ Fenster darüber“ (the left one has its window already)
    pg.evaluate("window.__fp.select('opening', 'tR')"); pg.wait_for_timeout(2500)
    pg.evaluate(MARK, "#stackAdd"); pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "1-fenster-darueber.png"))
    pg.evaluate("document.querySelectorAll('.shotMark').forEach((e) => e.remove())")
    # 2: after the tap: sill 2.95 m, height 0.65 m, its own roller shutter; the panel of the window above the left door
    pg.click("#stackAdd"); pg.wait_for_timeout(1200)
    for sel, v in (("#opSill", "2.95"), ("#opHeight", "0.65")):
        pg.fill(sel, v); pg.press(sel, "Enter"); pg.wait_for_timeout(500)
    pg.evaluate("""() => { const w = window.__fp.layout.floors[0].walls[0], o = w.openings.find((x) => x.id !== 'tL' && x.id !== 'tR' && x.id !== 'oL');
      Object.assign(o, { name: 'Fenster über Terrassentür rechts', shutter: true, shutterEntity: 'cover.lichterbereich_terrasse_rechts' }); window.__fp.rebuild(); }""")
    pg.evaluate("window.__fp.camAt(3.0, 2.2, 5.6, 3.0, -12)")
    pg.evaluate("window.__fp.select('opening', 'oL')"); pg.wait_for_timeout(2500)
    pg.evaluate(MARK, "#stackBelow"); pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "2-ergebnis.png"))
    b.close()
