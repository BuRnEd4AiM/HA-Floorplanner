"""The example pictures of this folder: the demo (built locally: cd demo && node build.mjs) with mockup2.js injected.
    python3 docs/ideen-3.99/make_pictures.py <output folder> [picture names]      (Playwright 1.56, see docs/UEBERGABE.md)
CAM="() => __fp.camAt(x, y, z, tx, tz)" chooses the camera."""
import asyncio, sys
from pathlib import Path
S = sys.argv[1]
Path(f"{S}/mock2").mkdir(parents=True, exist_ok=True)
from playwright.async_api import async_playwright
MOCK = (Path(__file__).parent / "mockup2.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]
import os
CAM = os.environ.get("CAM", "() => __fp.camAt(15.5, 8.5, 15.5, 4.6, 1.6)")
async def shot(b, name, js, live=True):
    if ONLY and name not in ONLY: return
    ctx = await b.new_context(viewport={"width": 1440, "height": 900}, locale="de-DE", timezone_id="Europe/Berlin")
    pg = await ctx.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=30000)
    await pg.wait_for_timeout(1200)
    if live:
        await pg.click("#modeSwitch [data-mode=live]")
    await pg.wait_for_timeout(1200)
    await pg.evaluate(CAM)
    await pg.add_script_tag(content=MOCK)
    await pg.wait_for_timeout(600)
    if js: await pg.evaluate(js)
    await pg.wait_for_timeout(1500)
    await pg.screenshot(path=f"{S}/mock2/{name}.png")
    print(name, errs[:2]); await ctx.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "0-heute", None)
        await shot(b, "1-boeden", "() => mk2.floors()")
        await shot(b, "2-fassade", "() => mk2.facade()")
        await shot(b, "3-garten", "() => mk2.garden()")
        await shot(b, "4-glas", "() => mk2.glass()")
        await shot(b, "5-raumschilder", "() => mk2.roomPills()")
        await shot(b, "3b-garten-vorher", None)
        await shot(b, "6-alles", "async () => { mk2.floors(); mk2.facade(); mk2.garden(); mk2.glass(); await mk2.roomPills(); }")
        await b.close()
asyncio.run(main())
