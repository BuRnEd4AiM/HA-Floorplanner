"""The example pictures of this folder (#629 by christinloehner, "Schräges Grundstück": the plot falls one storey to the street, the
basement stands free there with its garage door): the demo (built locally: cd demo && node build.mjs) with mockup.js injected.
    python3 docs/ideen-4.56/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio, os, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=13:00"
ONLY = sys.argv[2:]
CAM = os.environ.get("CAM", "-11, 5.5, -21, 6, 3")

CLEAN = """() => { const s = document.createElement('style');
  s.textContent = '#roomTiles, #tilesLeft, #tilesRight, #floorCards { display: none !important; }'; document.head.append(s); }"""


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


async def live_house(pg):
    await pg.evaluate("""() => { const s = window.__fp.settings(); s.houseFloors = 'stacked'; s.seeThrough = false; s.cutaway = false; }""")
    await pg.evaluate(CLEAN)
    await pg.click("#modeSwitch [data-mode=live]")
    await pg.wait_for_timeout(1200)
    await pg.evaluate("() => window.__fp.setHouseMode(true)")
    await pg.wait_for_timeout(1500)


async def today(pg):
    await live_house(pg)
    await pg.evaluate(f"() => window.__fp.camAt({CAM})")
    await pg.wait_for_timeout(3000)
    await pg.evaluate("() => mk629.note('Heute: der Rasen ist überall flach auf der Höhe des Erdgeschosses. Der Keller steckt ganz in der Erde, ein Garagentor im Keller wäre unter dem Rasen.', 240, 250, 360)")


async def slope(pg, cam=CAM, txt=True):
    await live_house(pg)
    await pg.evaluate("() => mk629.prepare()")
    await pg.wait_for_timeout(2000)
    await pg.evaluate(f"() => window.__fp.camAt({cam})")
    await pg.wait_for_timeout(2500)
    print("draped", await pg.evaluate("() => mk629.apply()"))
    await pg.wait_for_timeout(2500)
    if txt:
        await pg.evaluate("() => mk629.note('Neu: das Grundstück fällt zur Straße hin um ein Geschoss. Vorne steht der <b>Keller frei</b>, das <b>Garagentor</b> ist ebenerdig, das Wohnzimmer liegt 3 m über der Straße. Hinten ist der Garten auf der Höhe des Erdgeschosses.', 240, 250, 360)")


async def slope_side(pg):
    await slope(pg, cam=os.environ.get("CAM_SIDE", "-24, 4, 1, 6, 3.5"), txt=False)
    await pg.evaluate("() => mk629.note('Von der Seite: der <b>Weg</b> und das <b>Beet</b> gehen mit dem Hang hinunter. Die <b>Terrasse</b> bleibt eben (ein Plateau mit Mauer), die Garage steht auf einem <b>Sockel</b>.', 240, 250, 360)")


async def plan(pg):
    await pg.evaluate(CLEAN)
    await pg.click("#view2d")
    await pg.wait_for_timeout(800)
    await pg.evaluate("() => window.__fp.switchFloor(window.__fp.layout.floors.findIndex((f) => f.id === 'eg'))")
    await pg.wait_for_timeout(1200)
    await pg.evaluate("() => mk629.plan2d()")
    await pg.evaluate("() => mk629.panel(1245, 140)")
    await pg.evaluate("() => mk629.note('Im Werkzeug <b>Grundstück</b>: zwei <b>Höhenpunkte</b> genügen für einen gleichmäßigen Hang. Mehr Punkte für ein Gelände, das nicht gleichmäßig fällt. Die Höhenlinien zeigen, wie es fällt.', 1245, 560, 330)")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        await shot(b, "0-heute", today)
        await shot(b, "1-hang", slope)
        await shot(b, "2-hang-seite", slope_side)
        await shot(b, "3-plan", plan)
        await b.close()

asyncio.run(main())
