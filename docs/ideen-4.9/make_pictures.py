"""The example pictures of this folder (#495: more freedom on the pages of the tab bar: a thermostat like Home Assistant's, the power of
several houses in one chart, sections, who is really at home, calendars, buttons): the demo (built locally: cd demo && node build.mjs)
with mockup.js injected, at tablet size.
    python3 docs/ideen-4.9/make_pictures.py <output folder> [picture names]      (Playwright 1.56, see docs/UEBERGABE.md)"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]


async def shot(b, name, js, size=(1600, 1000)):
    if ONLY and name not in ONLY:
        return
    ctx = await b.new_context(viewport={"width": size[0], "height": size[1]}, locale="de-DE", timezone_id="Europe/Berlin", device_scale_factor=1.2)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000)
    await pg.wait_for_timeout(1500)
    if await pg.locator("#modeSwitch [data-mode=live]").is_visible():
        await pg.click("#modeSwitch [data-mode=live]")
    await pg.wait_for_timeout(1200)
    await pg.add_script_tag(content=MOCK)
    await pg.evaluate(js)
    await pg.wait_for_timeout(700)
    await pg.screenshot(path=f"{S}/{name}.png")
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "1-thermostat", "() => mk49.thermostat()")
        await shot(b, "2-strom-haeuser", "() => mk49.power()")
        await shot(b, "3-abschnitte", "() => mk49.sections()")
        await shot(b, "4-anwesenheit", "() => mk49.presence()")
        await shot(b, "5-kalender", "() => mk49.calendar()")
        await shot(b, "6-kalender-einstellen", "() => mk49.calendarEditor()")
        await shot(b, "7-knoepfe", "() => mk49.buttons()")
        await b.close()

asyncio.run(main())
