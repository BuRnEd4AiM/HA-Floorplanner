"""The example pictures of this folder (#546: heating rules in the dashboard, which automations use a thermostat and whether they run,
own routines "Wenn … dann …" from blocks like Node-RED): the demo (built locally: cd demo && node build.mjs) with mockup.js injected,
at tablet size.
    python3 docs/ideen-4.27/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]

# the floor with the living room's radiator (rd1, linked to climate.wohnzimmer) opened
HOUSE = """() => {
  const L = window.__fp.layout, f = L.floors.findIndex((x) => x.devices.some((d) => d.id === 'rd1'));
  window.__fp.switchFloor(f);
  return L.floors[f].devices.find((d) => d.id === 'rd1');
}"""


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
    await pg.wait_for_timeout(1200)
    await pg.add_script_tag(content=MOCK)
    if name == "6-im-haus":
        dev = await pg.evaluate(HOUSE)
        # the rule switched the heating off: the radiator turns blue
        await pg.evaluate("""() => fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: 'climate', service: 'set_hvac_mode', entity_id: 'climate.wohnzimmer', data: { hvac_mode: 'off' } }) })""")
        await pg.evaluate("() => window.__fp.camAt(7, 7, 8, 2, 1.5)")
        await pg.wait_for_timeout(4000)
        print(name, dev, await pg.evaluate("() => mk427.house('rd1')"))
    else:
        await pg.evaluate(js)
    await pg.wait_for_timeout(700)
    await pg.screenshot(path=f"{S}/{name}.png")
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "1-wird-benutzt", "() => mk427.usedBy()")
        await shot(b, "2-ablaeufe", "() => mk427.routines()")
        await shot(b, "3-heiz-regeln", "() => mk427.rules()")
        await shot(b, "4-heizplan", "() => mk427.schedule()")
        await shot(b, "5-wenn-dann", "() => mk427.editor()")
        await shot(b, "6-im-haus", None)
        await b.close()

asyncio.run(main())
