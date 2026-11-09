"""The example pictures of this folder (wish of 2026-11-09: "das Dach auch neu aufmachen, dass es geiler und übersichtlicher ist" and
"Räume sperren, dass diese nicht verschoben werden"): the demo (built locally: cd demo && node build.mjs) in edit mode with mockup.js
injected. The pictures are saved as JPG (quality 80) in the output folder.
    python3 docs/ideen-5.1/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image

S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]
# name, function in mockup.js, floor, camera (or "2d" for the plan), selection, "Neu" switched on
PICS = [
    ("1-dach-ueberblick", "dachUeberblick", 4, "roof", None, True),
    ("2-dach-profil", "dachProfil", 4, "roof", None, True),
    ("3-dach-von-oben", "dachVonOben", 4, "roof", None, True),
    ("4-dach-ziehen", "dachIn3d", 4, "dormer", None, True),
    ("5-dach-vorlagen", "dachVorlagen", 4, "roof", None, True),
    ("6-vorher-nachher", "dachVorherNachher", 4, None, None, False),
    ("7-raum-sperren", "raumSperren", 1, "room", ("room", "r1"), True),
    ("8-plan-gesperrt", "planGesperrt", 1, "2d", None, True),
    ("9-alles-sperren", "allesSperren", 1, "house", None, True),
]
CAMS = {  # x, y, z, target x, target z (the roof is x 0..10, z 0..7; its dormers and the roof window are on side A, z = 0)
    "roof": (-4.5, 14.0, -7.0, 4.0, 3.0),
    "dormer": (1.0, 11.5, -7.5, 5.0, 2.0),
    "room": (9.0, 11.0, 12.0, 3.0, 2.2),
    "house": (14.0, 17.0, 17.0, 6.0, 3.0),
}


async def shot(b, name, fn, floor, cam, select, v2):
    if ONLY and name not in ONLY:
        return
    ctx = await b.new_context(locale="de-DE", timezone_id="Europe/Berlin", viewport={"width": 1600, "height": 1000}, device_scale_factor=1.25)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(DEMO + ("&ui=2" if v2 else ""))
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=90000)
    await pg.wait_for_timeout(1500)
    await pg.click("#modeSwitch [data-mode=edit]")
    await pg.wait_for_timeout(1000)
    await pg.evaluate(f"() => window.__fp.switchFloor({floor})")
    await pg.wait_for_timeout(1200)
    if select:
        await pg.evaluate(f"() => window.__fp.select('{select[0]}', '{select[1]}')")
        await pg.wait_for_timeout(600)
    await pg.add_script_tag(content=MOCK)
    if cam == "2d":
        await pg.click("#view2d")
        await pg.wait_for_timeout(1500)
    await pg.evaluate(f"() => mkRoof.{fn}()")          # first round: the column gets its width, the picture its size
    await pg.wait_for_timeout(900)
    if cam == "2d":                                      # zoom in on the ground floor
        box = await pg.evaluate("() => { const t = [...document.querySelectorAll('#plan2d svg text')].find((t) => t.textContent.trim() === 'Küche').getBoundingClientRect(); return [t.x, t.y] }")
        await pg.mouse.move(box[0] + 30, box[1] + 30)
        for _ in range(4):
            await pg.mouse.wheel(0, -240)
            await pg.wait_for_timeout(250)
    elif cam:
        await pg.evaluate(f"() => window.__fp.camAt(...{list(CAMS[cam])})")
    await pg.wait_for_timeout(1800)
    await pg.evaluate(f"() => {{ document.querySelector('.mkLayer')?.replaceChildren(); mkRoof.{fn}(); }}")   # again: the notes follow the picture
    await pg.wait_for_timeout(1500)
    # the picture's number, big in the top left corner (as in docs/ideen-5.0)
    await pg.evaluate("""(n) => { const b = document.createElement('div'); b.textContent = n;
      Object.assign(b.style, { position: 'fixed', left: '8px', top: '8px', zIndex: 2147483647, width: '76px', height: '76px', borderRadius: '18px',
        display: 'grid', placeItems: 'center', background: '#b48cff', color: '#1a0f2e', font: '900 47px system-ui, sans-serif',
        border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,.6)' }); document.body.append(b); }""", name.split("-")[0])
    png = f"{S}/{name}.png"
    await pg.screenshot(path=png)
    Image.open(png).convert("RGB").save(f"{S}/{name}.jpg", quality=80)
    Path(png).unlink()
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        for pic in PICS:
            await shot(b, *pic)
        await b.close()

asyncio.run(main())
