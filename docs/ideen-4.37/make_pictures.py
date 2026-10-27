"""The example pictures of this folder (the owner's wish of 2026-10-27: a second house in the same plan on a raised plateau, a room whose
floor lies higher): the demo (built locally: cd demo && node build.mjs) with its neighbour house brought into the plan as a building of
its own (🏘 Gebäude in diesem Plan) and mockup.js injected.
    python3 docs/ideen-4.37/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio, os, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=13:00"
ONLY = sys.argv[2:]

H = 0.9                                                  # the plateau: 90 cm
HOUSE = {"x0": 18.88, "x1": 27.12, "z0": -0.12, "z1": 7.12}   # the outer faces of the walls of the second house
DOOR = [24.8, 0]                                         # its front door (towards -z)
AREA = {"x0": 18.4, "x1": 27.6, "z0": -0.5, "z1": 7.6}   # what is lifted with it


def plateau_js():
    return f"""() => {{ const n = mk437.lift({AREA}, {H});
      mk437.plateau({{ ...{HOUSE}, h: {H}, door: {DOOR} }}); return n; }}"""


async def setup(pg, rise):
    """bring the neighbour house into this plan (🏘 Gebäude in diesem Plan → Haus hereinholen), the bridge to it rises `rise`"""
    await pg.evaluate("() => { const d = document.querySelector('#buildingPanel'); d.open = true; d.dispatchEvent(new Event('toggle')); }")
    await pg.wait_for_timeout(400)
    await pg.select_option("#bldMergeHouse", "nachbar")
    await pg.click("#bldMerge")
    await pg.wait_for_timeout(1500)
    await pg.evaluate("() => { const d = document.querySelector('#buildingPanel'); d.open = false; }")
    await pg.evaluate(f"""() => {{ window.__fp.layout.floors.forEach((f) => f.devices.forEach((d) => {{ if (d.type === 'bridge') d.rise = {rise}; }}));
      window.__fp.rebuild(); }}""")
    await pg.wait_for_timeout(800)


async def shot(b, name, fn, size=(1600, 1000)):
    if ONLY and name not in ONLY:
        return
    ctx = await b.new_context(viewport={"width": size[0], "height": size[1]}, locale="de-DE", timezone_id="Europe/Berlin", device_scale_factor=1.2)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=90000)
    await pg.wait_for_timeout(1500)
    await pg.add_script_tag(content=MOCK)
    await fn(pg)
    await pg.wait_for_timeout(700)
    await pg.screenshot(path=f"{S}/{name}.png")
    print(name, errs[:2])
    await ctx.close()


CLEAN = """() => { const s = document.createElement('style');
  s.textContent = '#roomTiles, #tilesLeft, #tilesRight, #floorCards { display: none !important; }'; document.head.append(s); }"""


async def live_house(pg, rise, floors="normal"):
    await pg.evaluate(f"() => {{ window.__fp.settings().houseFloors = '{floors}'; }}")
    await setup(pg, rise)
    await pg.evaluate(CLEAN)
    await pg.click("#modeSwitch [data-mode=live]")
    await pg.wait_for_timeout(1200)
    await pg.evaluate("() => window.__fp.setHouseMode(true)")
    await pg.wait_for_timeout(1500)


async def today(pg):
    await live_house(pg, 0)
    await pg.evaluate("() => window.__fp.camAt(34, 11, -17, 15, 2)")
    await pg.wait_for_timeout(3000)
    await pg.evaluate("() => mk437.note('Heute: das zweite Haus (links) steht auf derselben Höhe wie das erste, sein Boden liegt auf dem Rasen.', 1110, 600, 300)")


async def plateau(pg, cam="34, 11, -17, 15, 2", txt=None, floors="normal"):
    await live_house(pg, H, floors)
    await pg.evaluate(f"() => window.__fp.camAt({cam})")
    await pg.wait_for_timeout(2500)
    print("lifted", await pg.evaluate(plateau_js()))
    await pg.wait_for_timeout(2500)
    if txt:
        await pg.evaluate(txt)


async def plateau_far(pg):
    await plateau(pg, txt="() => mk437.note('Neu: das zweite Haus steht auf einem <b>Plateau</b> (90 cm, so groß wie das Haus, mit einer Mauer aus Naturstein). Eine <b>Außentreppe</b> mit 5 Stufen führt zur Haustür. Alles im selben Plan.', 1080, 560, 330)")


async def plateau_near(pg):
    await pg.evaluate("() => { window.__fp.settings().cutaway = false; }")
    await plateau(pg, cam=os.environ.get("CAM_NEAR", "34, 6, -13, 23, 2"), floors="stacked", txt="() => mk437.note('Die Mauer, die Treppe und das Geländer baut das Programm selbst, wenn du beim Plateau <b>Rand: Mauer</b> und <b>＋ Außentreppe</b> wählst.', 1230, 800, 330)")


async def plan(pg):
    await setup(pg, H)
    await pg.evaluate("""() => { const L = window.__fp.layout; L.plot.areas.push({ id: 'mk_plat', name: 'Plateau', surface: 'flagstone',
      points: [[18.68, -0.32], [27.32, -0.32], [27.32, 7.32], [18.68, 7.32]] }); }""")
    await pg.click("#view2d")
    await pg.wait_for_timeout(800)
    await pg.evaluate("() => window.__fp.switchFloor(window.__fp.layout.floors.findIndex((f) => f.id === 'eg'))")
    await pg.wait_for_timeout(800)
    await pg.evaluate("() => window.__fp.select('yard', 'mk_plat')")
    await pg.wait_for_timeout(800)
    await pg.evaluate(f"""() => {{ mk437.plateauPanel(); return mk437.plan2d({{ ...{HOUSE}, lip: 0.2, door: {DOOR}, h: {H}, rooms: [[21.5, 3.5], [25.5, 3.5]] }}); }}""")
    await pg.evaluate("() => mk437.note('Im Werkzeug <b>Grundstück</b> eine Fläche <b>Plateau</b> ums Haus zeichnen (oder „▲ Plateau unter dieses Gebäude“ antippen) und die Höhe eintragen: alles, was darauf steht, steht mit oben.', 330, 760, 360)")


async def room(pg):
    await pg.evaluate("""() => { const s = window.__fp.settings(); s.labelMode = 'none'; s.belowLabels = false; s.belowMode = 'hidden';
      window.__fp.rebuild(); }""")
    await pg.evaluate("() => window.__fp.switchFloor(window.__fp.layout.floors.findIndex((f) => f.id === 'eg'))")
    await pg.wait_for_timeout(800)
    await pg.evaluate("() => window.__fp.select('room', 'r1')")
    await pg.wait_for_timeout(1200)
    await pg.evaluate(f"() => window.__fp.camAt({os.environ.get('CAM_ROOM', '8.5, 8.5, -2.5, 5.2, 2.6')})")
    await pg.wait_for_timeout(2500)
    print("raised", await pg.evaluate("() => mk437.raiseRoom({ x0: 0.06, x1: 5.94, z0: 0.06, z1: 4.44, h: 0.45, door: { x: 6, z: 2.25, dir: [1, 0], w: 1.0 } })"))
    await pg.wait_for_timeout(2000)
    # the outer wall in front (towards -z) is cut away, so the raised floor shows from the side like in a section drawing
    print("cut", await pg.evaluate("""() => { const f = window.__fp.layout.floors.find((x) => x.id === 'eg');
      return mk437.cut(f.walls.filter((w) => w.a[1] === 0 && w.b[1] === 0 && Math.max(w.a[0], w.b[0]) <= 10.5).map((w) => w.id)); }"""))
    await pg.wait_for_timeout(1500)
    # the tags: at the door to the kitchen (o13) the steps, at a window of the cut wall over the living room the height
    print("tags", await pg.evaluate("""() => { const f = window.__fp.layout.floors.find((x) => x.id === 'eg'), fp = window.__fp;
      const d = fp.openingCenter('o13'); if (d) mk437.tag('🪜 3 Stufen à 15 cm', d.x, d.y + 70, 'dark');
      const w = f.walls.filter((x) => x.a[1] === 0 && x.b[1] === 0).flatMap((x) => (x.openings || []).filter((o) => o.type === 'window').map((o) => o.id));
      const p = w.map((id) => ({ id, c: fp.openingCenter(id) })).filter((q) => q.c).sort((a, b) => a.c.x - b.c.x).pop();
      if (p) mk437.tag('▲ Wohnzimmer: Boden 45 cm höher', p.c.x, p.c.y + 95, 'big');
      return { d, w, p }; }"""))
    await pg.evaluate("() => mk437.roomPanel()")
    await pg.evaluate("() => mk437.note('Neu je Raum: <b>Boden höher</b>. Das Wohnzimmer liegt 45 cm höher, an der Tür zur Küche kommen 3 Stufen dazu.', 330, 760, 360)")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "0-heute", today)
        await shot(b, "1-plateau", plateau_far)
        await shot(b, "2-plateau-nah", plateau_near)
        await shot(b, "3-plateau-plan", plan)
        await shot(b, "4-raum-hoeher", room)
        await b.close()

asyncio.run(main())
