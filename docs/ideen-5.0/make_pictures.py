"""The example pictures of this folder (wish of 2026-11-08: "so unendlich viele Einstellmöglichkeiten" for windows, floors, floor heights …:
a new look of the edit column, "Version 2", switchable between old and new; fold in and out, tabs hanging on the column): the demo
(built locally: cd demo && node build.mjs) in edit mode with mockup.js injected.
    python3 docs/ideen-5.0/make_pictures.py <output folder> [picture names]      (Playwright, see docs/UEBERGABE.md)"""
import asyncio, sys
from pathlib import Path
from playwright.async_api import async_playwright
S = sys.argv[1]
Path(S).mkdir(parents=True, exist_ok=True)
MOCK = (Path(__file__).parent / "mockup.js").read_text()
DEMO = (Path(__file__).resolve().parents[2] / "demo" / "floorplan3d-demo.html").as_uri() + "?debug=1&skytime=12:30"
ONLY = sys.argv[2:]
# name, function in mockup.js, camera (x, y, z, target x, target z) or None, phone
PICS = [
    ("1-ueberblick", "ueberblick", "near"),
    ("2-umschalten", "umschalten", None),
    ("3-fenster-bild", "fensterBild", "near"),
    ("4-fensterarten", "vorlagen", "near"),
    ("5-noppel", "noppel", "kitchen"),
    ("6-mini-leiste", "kontextleiste", "near"),
    ("7-raum-boden", "raumBoden", "room"),
    ("8-vorher-nachher", "vorherNachher", None),
    ("9-haus-baum", "struktur", None),
    ("10-etage", "etage", None),
    ("11-werkzeuge", "werkzeuge", None),
    ("12-suchen", "suche", "near"),
    ("13-uebernehmen", "uebernehmen", "near"),
    ("14-geraet", "geraet", "room"),
    ("15-reiter-oben", "kontextReiter", "near"),
    ("16-handy", "handy", "phone"),
]
CAMS = {  # x, y, z, target x, target z (the living room is x 0..6, z 0..4.5 on the ground floor, the window o1 at x 1.6 on z = 0)
    "near": (7.5, 9.5, 10.5, 2.0, 0.5),
    "kitchen": (12.0, 9.5, 10.5, 7.5, 0.5),
    "room": (9.0, 11.0, 12.0, 3.0, 2.2),
    "phone": (4.0, 7.5, 9.5, 1.8, 0.5),
}


async def shot(b, name, fn, cam):
    if ONLY and name not in ONLY:
        return
    phone = cam == "phone"
    opts = dict(viewport={"width": 390, "height": 844}, device_scale_factor=3, is_mobile=True, has_touch=True) if phone else \
        dict(viewport={"width": 1600, "height": 1000}, device_scale_factor=1.25)
    ctx = await b.new_context(locale="de-DE", timezone_id="Europe/Berlin", **opts)
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto(DEMO)
    await pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=90000)
    await pg.wait_for_timeout(1500)
    if not phone and await pg.locator("#modeSwitch [data-mode=edit]").is_visible():
        await pg.click("#modeSwitch [data-mode=edit]")
    elif phone:
        await pg.evaluate("() => document.querySelector('#modeSwitch [data-mode=edit]')?.click()")
    await pg.wait_for_timeout(1200)
    await pg.add_script_tag(content=MOCK)
    await pg.evaluate(f"() => mkV2.{fn}()")
    await pg.wait_for_timeout(900)
    if cam:
        await pg.evaluate(f"() => window.__fp.camAt(...{list(CAMS[cam])})")
    await pg.wait_for_timeout(1500)
    if fn in ("kontextleiste",):   # the bar follows the window on the screen: paint it again after the camera moved
        await pg.evaluate("() => { document.querySelector('.mkLayer')?.remove(); }")
        await pg.add_script_tag(content=MOCK)
        await pg.evaluate(f"() => mkV2.{fn}()")
        await pg.wait_for_timeout(1500)
    # the picture's number, big in the top left corner (wish of 2026-11-09: "Nummern geben im Bild")
    await pg.evaluate("""([n, size]) => { const b = document.createElement('div'); b.textContent = n;
      Object.assign(b.style, { position: 'fixed', left: '8px', top: '8px', zIndex: 2147483647, width: `${size}px`, height: `${size}px`, borderRadius: '18px',
        display: 'grid', placeItems: 'center', background: '#b48cff', color: '#1a0f2e', font: `900 ${size * 0.62}px system-ui, sans-serif`,
        border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,.6)' }); document.body.append(b); }""", [name.split("-")[0], 54 if phone else 76])
    await pg.screenshot(path=f"{S}/{name}.png")
    print(name, errs[:2])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        for name, fn, cam in PICS:
            try:
                await shot(b, name, fn, cam)
            except Exception as e:   # one broken picture should not stop the others
                print(name, "FAILED", str(e).splitlines()[0])
        await b.close()

asyncio.run(main())
