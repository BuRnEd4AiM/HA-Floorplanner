"""The example pictures of this folder (wish of 2026-11-08: a button in the thermostat to hold, "Heizplan aussetzen" for 30 / 45 minutes,
an hour or the day, one regulates by hand meanwhile; an admin chooses who gets it, per user and per card): the demo (built locally:
cd demo && node build.mjs) with mockup.js injected, at tablet size.
    python3 docs/ideen-4.71/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]


async def shot(b, name, js, size=(1400, 900)):
    if ONLY and name not in ONLY:
        return
    ctx = await b.new_context(viewport={"width": size[0], "height": size[1]}, locale="de-DE", timezone_id="Europe/Berlin", device_scale_factor=1.4)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=90000)
    await pg.wait_for_timeout(1500)
    if await pg.locator("#modeSwitch [data-mode=live]").is_visible():
        await pg.click("#modeSwitch [data-mode=live]")
    await pg.evaluate("""() => fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'climate', service: 'set_hvac_mode', entity_id: 'climate.wohnzimmer', data: { hvac_mode: 'heat' } }) })""")
    await pg.click("#tabBar [data-tab=climate]")
    await pg.wait_for_timeout(4000)
    await pg.add_script_tag(content=MOCK)
    await pg.evaluate(js)
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=f"{S}/{name}.png")
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "1-knopf", "() => mkPause.knopf()")
        await shot(b, "2-auswahl", "() => mkPause.auswahl()")
        await shot(b, "3-pausiert", "() => mkPause.pausiert()")
        await shot(b, "4-einstellen", "() => mkPause.einstellen()")
        await b.close()

asyncio.run(main())
