"""The example pictures of this folder (wish of 2026-10-23: one tab shows different things to different users, his choice "Eigene
Fassung je Benutzer"): the demo (built locally: cd demo && node build.mjs) with mockup.js injected, on 🌡 Klima.
    python3 docs/ideen-4.18/make_pictures.py <output folder> [picture names]      (Playwright 1.56, see docs/UEBERGABE.md)"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]


async def open_climate(b, size, scale=1.2, phone=False, edit=False):
    ctx = await b.new_context(viewport={"width": size[0], "height": size[1]}, locale="de-DE", timezone_id="Europe/Berlin", device_scale_factor=scale,
                              is_mobile=phone, has_touch=phone)
    pg = await ctx.new_page()
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000)
    await pg.wait_for_timeout(1500)
    if await pg.locator("#modeSwitch [data-mode=live]").is_visible():
        await pg.click("#modeSwitch [data-mode=live]")
    await pg.wait_for_timeout(1000)
    await pg.evaluate("() => document.querySelector('#tabBar [data-tab=climate]').click()")
    await pg.wait_for_timeout(1000)
    if edit:
        await pg.click("#tabBar .tbEdit")
        await pg.wait_for_timeout(800)
    await pg.add_script_tag(content=MOCK)
    return ctx, pg


async def shot(b, name, js, size=(1600, 1000), edit=True):
    if ONLY and name not in ONLY:
        return
    ctx, pg = await open_climate(b, size, edit=edit)
    await pg.evaluate(js)
    await pg.wait_for_timeout(700)
    await pg.screenshot(path=f"{S}/{name}.png")
    await ctx.close()
    print(name)


COMPOSE = """<!doctype html><meta charset="utf-8"><style>
body { margin: 0; background: #0c1016; color: #e6ecf2; font: 600 15px system-ui, sans-serif; }
.wrap { display: flex; gap: 46px; padding: 26px 34px; align-items: flex-start; }
h2 { margin: 0 0 14px; font-size: 27px; } h2.l { color: #c9a8ff; }
.papa img { width: 1340px; border-radius: 14px; display: block; box-shadow: 0 10px 40px rgba(0,0,0,.5); }
.phone { padding: 12px; border-radius: 44px; background: #282c34; } .phone img { width: 400px; border-radius: 34px; display: block; }
p { margin: 16px 0 0; color: #a0acba; font-size: 19px; font-weight: 500; }
</style><div class="wrap"><div class="papa"><h2>👨 Papa (Tablet): Fassung „👪 Für alle“</h2><img src="_papa.png">
<p>Gleicher Reiter 🌡️ Klima: Papa sieht alle Räume, die Wärmepumpe und den Tipp für das ganze Haus.</p></div>
<div><h2 class="l">👧 Lena (Handy): „🧒 Kinder“</h2><div class="phone"><img src="_lena.png"></div>
<p style="max-width:420px">Lena sieht nur ihr Zimmer, ohne Eco/Komfort, mit einem Tipp für Kinder.</p></div></div>"""


async def side_by_side(b, name="3-zwei-benutzer"):
    """the same tab on papa's tablet (version "Für alle") and on Lena's phone (version "Kinder"), put together in a page"""
    if ONLY and name not in ONLY:
        return
    ctx, pg = await open_climate(b, (1400, 900), scale=1.2)
    await pg.screenshot(path=f"{S}/_papa.png")
    await ctx.close()
    ctx, pg = await open_climate(b, (400, 860), scale=1.2, phone=True)
    await pg.evaluate("() => mk418.lena()")
    await pg.wait_for_timeout(600)
    await pg.screenshot(path=f"{S}/_lena.png")
    await ctx.close()
    (Path(S) / "_both.html").write_text(COMPOSE)
    ctx = await b.new_context(viewport={"width": 1880, "height": 1010}, device_scale_factor=1.25)
    pg = await ctx.new_page()
    await pg.goto((Path(S) / "_both.html").resolve().as_uri())
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=f"{S}/{name}.png", full_page=True)
    await ctx.close()
    print(name)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        await shot(b, "1-fassung-bearbeiten", "() => mk418.edit()")
        await shot(b, "2-neue-fassung", "() => mk418.create()")
        await side_by_side(b)
        await shot(b, "4-wer-sieht-was", "() => mk418.table()")
        await b.close()

asyncio.run(main())
