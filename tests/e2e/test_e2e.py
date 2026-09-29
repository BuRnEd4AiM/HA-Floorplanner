import json, sys, time, urllib.request
from playwright.sync_api import sync_playwright

from pathlib import Path
S = str(Path(__file__).parent)
BASE = "http://localhost:8099/"
def api(path):
    return json.load(urllib.request.urlopen(BASE + path))
def ha_calls():
    return json.load(urllib.request.urlopen("http://localhost:8123/_calls"))

errors, results = [], []
def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra and not cond else ""))

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1400, "height": 850})
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
    pg.goto(BASE + "?debug=1"); pg.wait_for_timeout(1500)

    box = pg.locator("#view").bounding_box()
    cx, cy = box["x"] + box["width"]/2, box["y"] + box["height"]/2
    pg.evaluate("window.__fp.topDown()"); pg.wait_for_timeout(300)

    # --- walls: a 6x4 m room (2 cm... snapped to 25 cm grid); scale: read from two clicks
    pg.click("button[data-tool=wall]")
    pts = [(-150,-100),(150,-100),(150,100),(-150,100),(-150,-100)]
    for x, y in pts:
        pg.mouse.click(cx+x, cy+y); pg.wait_for_timeout(100)
    pg.keyboard.press("Escape")
    lay = pg.evaluate("window.__fp.layout")
    walls = lay["floors"][0]["walls"]
    check("4 walls drawn", len(walls) == 4, len(walls))

    # --- openings: door on wall 0, window on wall 1
    pg.click("button[data-tool=opening]")
    s0 = pg.evaluate(f"window.__fp.screenOf('{walls[0]['id']}')")
    pg.mouse.move(s0["x"], s0["y"]); pg.wait_for_timeout(150)
    pg.mouse.click(s0["x"], s0["y"]); pg.wait_for_timeout(200)
    pg.click("#openingPalette button[data-opening=window]")
    s1 = pg.evaluate(f"window.__fp.screenOf('{walls[1]['id']}')")
    pg.mouse.move(s1["x"], s1["y"]); pg.wait_for_timeout(150)
    pg.mouse.click(s1["x"], s1["y"]); pg.wait_for_timeout(200)
    walls = pg.evaluate("window.__fp.layout")["floors"][0]["walls"]
    ops = [o for w in walls for o in w["openings"]]
    check("door + window placed", sorted(o["type"] for o in ops) == ["door", "window"], ops)
    # overlap must be rejected
    pg.mouse.click(s1["x"], s1["y"]); pg.wait_for_timeout(150)
    walls = pg.evaluate("window.__fp.layout")["floors"][0]["walls"]
    check("overlapping window rejected", sum(len(w["openings"]) for w in walls) == 2)

    # --- GLB upload and placement
    pg.click("button[data-tool=device]")
    pg.set_input_files("#modelFile", f"{S}/tri.glb"); pg.wait_for_timeout(800)
    models = api("api/models")
    check("GLB uploaded", [m["name"] for m in models] == ["tri"], models)
    pg.mouse.click(cx-80, cy+20); pg.wait_for_timeout(500)

    # --- entity-linked devices
    pg.click("#paletteGrid button:nth-child(1)")   # light
    pg.select_option("#entitySelect", "light.wohnzimmer")
    pg.mouse.click(cx-30, cy-20); pg.wait_for_timeout(300)
    pg.click("#paletteGrid button:nth-child(4)")   # sensor
    pg.select_option("#entitySelect", "sensor.temp")
    pg.mouse.click(cx+40, cy-20); pg.wait_for_timeout(300)
    devs = pg.evaluate("window.__fp.layout")["floors"][0]["devices"]
    check("3 devices placed", len(devs) == 3, [d["type"] for d in devs])
    check("custom model device type", any(d["type"] == "glb:tri" for d in devs))
    check("entities bound", {d["entity"] for d in devs} == {"", "light.wohnzimmer", "sensor.temp"}, devs)

    # --- settings: English + light theme + imperial
    pg.click("#settingsBtn"); pg.wait_for_timeout(200)
    pg.select_option("#setLanguage", "en"); pg.select_option("#setTheme", "light"); pg.select_option("#setUnits", "imperial")
    pg.wait_for_timeout(600)
    check("language switched", pg.inner_text("button[data-tool=wall]") == "Wall", pg.inner_text("button[data-tool=wall]"))
    check("theme switched", pg.evaluate("document.documentElement.dataset.theme") == "light")
    pg.click("#settingsDialog menu button"); pg.wait_for_timeout(300)
    st = api("api/settings")
    check("settings persisted", st["language"] == "en" and st["theme"] == "light" and st["units"] == "imperial", st)

    # --- live mode: tap light -> popup -> toggle
    pg.click("#modeSwitch button[data-mode=live]"); pg.wait_for_timeout(500)
    light = next(d for d in devs if d["entity"] == "light.wohnzimmer")
    s = pg.evaluate(f"window.__fp.screenOf('{light['id']}')")
    pg.mouse.click(s["x"], s["y"]); pg.wait_for_timeout(400)
    check("live popup shows", pg.is_visible("#livePopup"))
    check("popup has entity", "light.wohnzimmer" in pg.inner_text("#livePopup"), pg.inner_text("#livePopup"))
    pg.click("#livePopup .actions button:nth-child(3)"); pg.wait_for_timeout(900)
    check("service called", ["light", "toggle", "light.wohnzimmer"] in ha_calls(), ha_calls())
    pg.screenshot(path=f"{S}/live.png")

    # --- persisted and reloadable
    pg.wait_for_timeout(1800)
    pg.goto(BASE + "?debug=1&mode=live"); pg.wait_for_timeout(1500)
    lay = pg.evaluate("window.__fp.layout")["floors"][0]
    check("layout survives reload", len(lay["walls"]) == 4 and len(lay["devices"]) == 3)
    check("reload in live mode", pg.evaluate("document.body.classList.contains('live')"))
    pg.click("#modeSwitch button[data-mode=edit]"); pg.wait_for_timeout(300)
    pg.click("#view3d"); pg.wait_for_timeout(600)
    pg.screenshot(path=f"{S}/edit3d.png")
    # --- 2D blueprint editor works on the same layout as the 3D view
    pg2 = b.new_page(viewport={"width": 1400, "height": 850})
    pg2.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
    pg2.goto(BASE + "?debug=1&mode=edit"); pg2.wait_for_timeout(1500)
    pg2.click("#view2d"); pg2.wait_for_timeout(500)
    check("2D plan visible", pg2.is_visible("#plan2d") and pg2.evaluate("getComputedStyle(document.querySelector('#view')).visibility") == "hidden")
    n0 = len(pg2.evaluate("window.__fp.layout.floors[0].walls"))
    pg2.click("button[data-tool=wall]")
    for (x, z) in [(-2, -2), (-2, 2)]:
        c = pg2.evaluate(f"window.__fp.plan().toClient({x},{z})"); pg2.mouse.click(*c); pg2.wait_for_timeout(100)
    pg2.keyboard.press("Escape")
    n1 = len(pg2.evaluate("window.__fp.layout.floors[0].walls"))
    check("wall drawn in 2D", n1 == n0 + 1, (n0, n1))
    pg2.click("#viewSplit"); pg2.wait_for_timeout(500)
    check("split view shows both", pg2.is_visible("#plan2d") and pg2.evaluate("getComputedStyle(document.querySelector('#view')).visibility") == "visible")
    pg2.close()
    b.close()

bad = [e for e in errors if "favicon" not in e]

check("no console errors", not bad, bad)
print("\n%d/%d passed" % (sum(ok for _, ok in results), len(results)))
sys.exit(0 if all(ok for _, ok in results) else 1)
