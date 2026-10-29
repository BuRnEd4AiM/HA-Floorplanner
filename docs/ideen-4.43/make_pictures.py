"""The example pictures of this folder (the lists of ▶ Abläufe by room, wish of the owner 2026-10-29: "eine gruppierung nach räumen in HA das man
das direkt sieht ein und aus klappen kann"): the demo (built locally: cd demo && node build.mjs) with mockup.js injected, on a PC screen.
    python3 docs/ideen-4.43/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]


async def shot(b, name, js, size=(1600, 1300)):
    if ONLY and name not in ONLY:
        return
    ctx = await b.new_context(viewport={"width": size[0], "height": size[1]}, locale="de-DE", timezone_id="Europe/Berlin", device_scale_factor=1)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=90000)
    await pg.wait_for_timeout(1500)
    if await pg.locator("#modeSwitch [data-mode=live]").is_visible():
        await pg.click("#modeSwitch [data-mode=live]")
    await pg.wait_for_timeout(800)
    await pg.click("[data-tab=routines]")
    await pg.wait_for_timeout(1500)
    await pg.add_script_tag(content=MOCK)
    await pg.evaluate(js)
    await pg.wait_for_timeout(900)
    await pg.screenshot(path=f"{S}/{name}.jpg", quality=80, type="jpeg")
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "1-listen-zu", "() => mkRg.cards(false)")
        await shot(b, "2-listen-offen", "() => mkRg.cards(true)", (1600, 2050))
        await shot(b, "3-raeume-zu", "() => mkRg.rooms(false)")
        await shot(b, "4-raeume-offen", "() => mkRg.rooms(true)", (1600, 1900))
        await b.close()

asyncio.run(main())
