"""The example pictures of this folder: the demo (built locally: cd demo && node build.mjs) with mockup.js injected, at tablet size.
    python3 docs/ideen-4.3/make_pictures.py <output folder> [picture names]      (Playwright 1.56, see docs/UEBERGABE.md)"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]
CAM = "() => __fp.camAt(15.5, 8.5, 15.5, 4.6, 1.6)"
# the "camera images": the 3D picture of the demo seen from where a camera would hang (x, y, z, look at x, z): drive, living room, office, garage
CAMS = [(18.0, 3.2, 16.0, 6.0, 4.0), (0.4, 2.3, 0.4, 4.0, 3.6), (9.8, 2.3, 6.8, 7.6, 4.9), (14.6, 2.4, 0.4, 11.0, 4.0)]
# the 3D picture over a plain sky (the sky of the app is behind the canvas, a camera image has none)
SNAP = """() => { __fp.frame(); const g = __fp.renderer.domElement, c = document.createElement('canvas'); c.width = g.width; c.height = g.height;
  const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, c.height); gr.addColorStop(0, '#6f9fd6'); gr.addColorStop(1, '#d5e6f5');
  x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height); x.drawImage(g, 0, 0); return c.toDataURL('image/jpeg', .85); }"""


async def snap_cams(pg):
    out = []
    for c in CAMS:
        await pg.evaluate(f"() => __fp.camAt({c[0]}, {c[1]}, {c[2]}, {c[3]}, {c[4]})")
        await pg.wait_for_timeout(900)
        out.append(await pg.evaluate(SNAP))
    await pg.evaluate(CAM)
    return out


async def shot(b, name, js, size=(1280, 800), cams=False, tablet=True):
    if ONLY and name not in ONLY:
        return
    ctx = await b.new_context(viewport={"width": size[0], "height": size[1]}, locale="de-DE", timezone_id="Europe/Berlin",
                              device_scale_factor=1.5, has_touch=size[0] < 600, is_mobile=size[0] < 600)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000)
    await pg.wait_for_timeout(1500)
    if await pg.locator("#modeSwitch [data-mode=live]").is_visible():
        await pg.click("#modeSwitch [data-mode=live]")
    await pg.evaluate("() => document.getElementById('belowLabelsToggle').click()")   # no names of the cellar shining through the lawn
    await pg.wait_for_timeout(1500)
    if size[0] >= 600:
        await pg.evaluate(CAM)
    await pg.add_script_tag(content=MOCK)
    imgs = await snap_cams(pg) if cams else None
    if tablet:
        await pg.evaluate("() => mk43.tabletHeader()")
    await pg.evaluate(js, imgs)
    await pg.wait_for_timeout(1500)
    await pg.screenshot(path=f"{S}/{name}.png")
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "1-leiste", "() => mk43.bar('haus')")
        await shot(b, "2-heute", "() => mk43.heute()")
        await shot(b, "3-energie", "() => mk43.energie()")
        await shot(b, "4-klima", "() => mk43.klima()")
        await shot(b, "5-kameras", "(imgs) => mk43.kameras(imgs)", cams=True)
        await shot(b, "6-klingel", "(imgs) => mk43.klingel(imgs[0])", cams=True)
        await shot(b, "7-musik", "() => mk43.musik()")
        await shot(b, "8-haushalt", "() => mk43.haushalt()")
        await shot(b, "9-ablaeufe", "() => mk43.ablaeufe(false)")
        await shot(b, "9b-ich-gehe", "() => mk43.ablaeufe()")
        await shot(b, "10-familie", "() => mk43.familie()")
        await shot(b, "11-benutzer", "() => mk43.benutzer()")
        await shot(b, "12-handy", "() => mk43.handy()", size=(390, 844))
        await b.close()

asyncio.run(main())
