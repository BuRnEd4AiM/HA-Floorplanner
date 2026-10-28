"""The example pictures of this folder (a page of its own "📜 Protokoll", wish of the owner 2026-10-28: "eine eigene Seite, wo alles quasi
passiert … wo man dann auch … exportieren kann für eine Fehleranalyse … alle Geräte drin hat, die in den Plänen verwendet werden"): the demo
(built locally: cd demo && node build.mjs, or FP_DEMO=<file>) with mockup.js injected, on a PC screen.
    python3 docs/ideen-4.40/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio, os, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = Path(os.environ.get("FP_DEMO") or Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").resolve().as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]


async def shot(b, name, js, size=(1600, 1000)):
    if ONLY and name not in ONLY:
        return
    ctx = await b.new_context(viewport={"width": size[0], "height": size[1]}, locale="de-DE", timezone_id="Europe/Berlin", device_scale_factor=1.2)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=90000)
    await pg.wait_for_timeout(1500)
    if await pg.locator("#modeSwitch [data-mode=live]").is_visible():
        await pg.click("#modeSwitch [data-mode=live]")
    await pg.wait_for_timeout(800)
    await pg.click("#tabBar [data-tab=routines]")
    await pg.wait_for_timeout(800)
    await pg.add_script_tag(content=MOCK)
    await pg.evaluate(js)
    await pg.wait_for_timeout(700)
    await pg.screenshot(path=f"{S}/{name}.jpg", type="jpeg", quality=85)
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "1-nur-befehle", "() => mkLog.commands()")
        await shot(b, "2-alle-geraete", "() => mkLog.all()")
        await shot(b, "3-geraet-und-export", "() => mkLog.device()")
        await b.close()

asyncio.run(main())
