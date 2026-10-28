"""The example pictures of this folder (room sensors for the thermostats, wish of the owner 2026-10-28: "jedem Thermostat einfach einen
Temperatursensor gebe … wie bei Better Thermostat"): the demo (built locally: cd demo && node build.mjs) with mockup.js injected, on a
PC screen.
    python3 docs/ideen-4.38/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]


async def shot(b, name, js, after=None, size=(1600, 1000)):
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
    await pg.wait_for_timeout(1000)
    await pg.add_script_tag(content=MOCK)
    await pg.evaluate(js)
    await pg.wait_for_timeout(900)
    if after:
        print(name, await pg.evaluate(after))
    await pg.screenshot(path=f"{S}/{name}.png")
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "1-raumfuehler", "() => mkRf.rules()")
        await shot(b, "2-fuehler-waehlen", "() => mkRf.picker()")
        await shot(b, "3-klima", "() => mkRf.climate()", "() => mkRf.climatePaint()")
        await b.close()

asyncio.run(main())
