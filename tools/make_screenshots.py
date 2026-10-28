#!/usr/bin/env python3
"""Take every picture in docs/img (README and docs/IMPORT*.md) again: from the demo file (build it first: cd demo && npm ci &&
node build.mjs) and from a throw-away add-on server (welcome, backup, version, the import pictures).
Needs: pip install playwright==1.56.0 pillow aiohttp, a Chromium (CHROME env var, default /opt/pw-browsers/chromium if it exists).
Usage: python3 tools/make_screenshots.py [name ...]      (no name: all of them, about 15 minutes; names: SHOTS, SERVER_SHOTS, OWN_SERVER below)
OUT=/tmp/x python3 tools/make_screenshots.py hero        writes somewhere else (to look at a picture before it replaces the old one)
The social preview has its own script: tools/make_social_preview.py."""
import datetime
import io
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
IMG = Path(os.environ.get("OUT") or ROOT / "docs" / "img")
DEMO = (ROOT / "demo" / "floorplan3d-demo.html").as_uri()
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
PORT = 8197
TZ = "Europe/Berlin"
PHONE = {"width": 390, "height": 844}                        # an iPhone held upright
MAX_W = 2400                                                 # the widest picture (README shows them 900 px wide, twice that for sharp screens)
# the settings every demo picture starts with: no names of the floor below shining through the lawn (they make a picture look busy)
LOOK = {"belowLabels": False}

# Before the demo replaces fetch (demo/demo-data.js) this catches it, so a picture can start with other settings and the
# security view gets a recorded day (the demo has no recording). Everything else goes to the demo as before.
HOOK = """(() => {
  const H = %s, real = window.fetch;
  let inner = null, first = true;
  const json = (d) => new Response(JSON.stringify(d), { status: 200, headers: { 'Content-Type': 'application/json' } });
  async function hooked(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url, path = url.replace(/^.*?(api\\/)/, '$1').split('?')[0];
    if (H.timeline && path === 'api/timeline') return json(H.timeline.info);
    if (H.timeline && path.startsWith('api/timeline/')) return json(H.timeline.day);
    const r = await (inner || real)(input, init);
    if (path === 'api/settings' && first && (init.method || 'GET').toUpperCase() === 'GET') { first = false; return json({ ...(await r.json()), ...H.settings }); }
    return r;
  }
  Object.defineProperty(window, 'fetch', { configurable: true, get: () => (inner ? hooked : real), set: (v) => { inner = v; } });
})();"""


def browser(p):
    chrome = os.environ.get("CHROME") or ("/opt/pw-browsers/chromium" if Path("/opt/pw-browsers/chromium").exists() else None)
    return p.chromium.launch(**({"executable_path": chrome} if chrome else {}), args=ARGS)


def demo_page(b, query="mode=live", w=1600, h=900, dsf=2, phone=False, sky="13:00", settings=None, timeline=None, lang="en-US"):
    """the demo, ready, in English, the sky at a fixed time of day (?skytime) so the pictures do not depend on when they are taken"""
    ctx = b.new_context(viewport=PHONE if phone else {"width": w, "height": h}, device_scale_factor=3 if phone else dsf,
                        is_mobile=phone, has_touch=phone, locale=lang, timezone_id=TZ)
    ctx.add_init_script(HOOK % json.dumps({"settings": {**LOOK, **(settings or {})}, "timeline": timeline}))
    pg = ctx.new_page()
    pg.goto(f"{DEMO}?{query}&skytime={sky}&debug=1", wait_until="domcontentloaded", timeout=120000)   # a slow software GL can keep "load" waiting
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000)
    pg.add_style_tag(content=".demo-badge{display:none!important}")    # "Demo · changes are not saved" fades out after a few seconds anyway
    pg.wait_for_timeout(2000)
    return pg


def cam(pg, x, y, z, tx, tz, ms=1200):
    pg.evaluate(f"__fp.camAt({x}, {y}, {z}, {tx}, {tz})"); pg.wait_for_timeout(ms)


def pan(pg, dx, dy, zoom=0, at=(450, 700)):
    """move the 3D picture like a user does (right mouse button, mouse wheel), from a free spot of the view (not on a card)"""
    pg.mouse.move(*at)
    if zoom:
        pg.mouse.wheel(0, zoom); pg.wait_for_timeout(500)
    pg.mouse.down(button="right"); pg.mouse.move(at[0] + dx, at[1] + dy, steps=8); pg.mouse.up(button="right")
    pg.wait_for_timeout(800)


def grab(pg, ms=600):
    """the page as a picture"""
    pg.wait_for_timeout(ms)
    return Image.open(io.BytesIO(pg.screenshot())).convert("RGB")


def store(im, name):
    """a .jpg at most MAX_W wide (a sky with stars makes a PNG of the whole screen 2 to 3 MB, the JPG a fifth of it), anything else as PNG"""
    if name.endswith(".jpg"):
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        im.convert("RGB").save(IMG / name, quality=85, subsampling=0, optimize=True, progressive=True)
    else:
        im.save(IMG / name, optimize=True)


def save(pg, name, ms=600):
    store(grab(pg, ms), name)
    pg.context.close()


def rounded(im, r):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = im.convert("RGBA"); out.putalpha(mask)
    return out


# ---------- the demo ----------

def shot_hero(b):
    """docs/img/3d.jpg: the ground floor live at dusk, room labels over the rooms, room tiles below"""
    pg = demo_page(b, sky="18:20")
    cam(pg, 14, 9, 15, 6, 3)
    save(pg, "3d.jpg")


def shot_house(b):
    """the whole house on its plot: all floors, roof with solar panels, garden, the neighbour"""
    pg = demo_page(b, sky="15:30", settings={"labelMode": "none", "roomTiles": False})
    pg.evaluate("__fp.setHouseMode(true)"); pg.wait_for_timeout(2000)
    cam(pg, 22, 13, 24, 8, 3)
    save(pg, "house.jpg")


def shot_ground(b):
    """the basement in the earth, cut open like a section drawing"""
    pg = demo_page(b, sky="11:00", settings={"labelMode": "none", "roomTiles": False})
    pg.evaluate("__fp.setHouseMode(true)"); pg.wait_for_timeout(2000)
    cam(pg, -11, 2.2, 19, 6, 3)
    save(pg, "ground.jpg")


def shot_ledring(b):
    """the bedroom with its LED ring at night, the card of the ring open"""
    pg = demo_page(b, sky="21:30")
    pg.evaluate("__fp.liveTapRoom('r4')"); pg.wait_for_timeout(1500)
    pg.evaluate("__fp.showPopup('d22')"); pg.wait_for_timeout(500)
    pan(pg, -300, -60, zoom=-150)                            # the room beside the card, not under it
    save(pg, "ledring.jpg", 1200)


def shot_room(b):
    """the living room: its panel with all lights, colour, brightness, heating and scenes"""
    pg = demo_page(b, sky="19:15")
    pg.evaluate("__fp.liveTapRoom('r1')")
    save(pg, "room.jpg", 2000)


def shot_light(b):
    """the card of a lamp, opened right where it stands"""
    pg = demo_page(b, sky="19:15")
    pg.evaluate("__fp.liveTapRoom('r1')"); pg.wait_for_timeout(1500)
    pg.evaluate("__fp.showPopup('d4')"); pg.wait_for_timeout(500)
    pan(pg, -420, 20, zoom=200)
    save(pg, "light.jpg", 1200)


def shot_split(b):
    """2D plan and 3D side by side in the editor"""
    pg = demo_page(b, "mode=edit", sky="13:00")
    pg.click("#viewSplit"); pg.wait_for_timeout(1200); pg.click("#fitBtn"); pg.wait_for_timeout(1200)
    save(pg, "split.jpg")


def shot_plan(b):
    """docs/img/2d.jpg: the 2D plan in the editor, with the states in colour"""
    pg = demo_page(b, "mode=edit", sky="13:00")
    pg.click("#view2d"); pg.wait_for_timeout(1200); pg.click("#fitBtn"); pg.wait_for_timeout(1200)
    save(pg, "2d.jpg")


def shot_library(b):
    pg = demo_page(b, "mode=edit", sky="13:00")
    pg.click("#view3d"); pg.click("#tools [data-tool=device]"); pg.wait_for_timeout(1500)
    save(pg, "library.jpg")


def shot_toolbar(b):
    pg = demo_page(b, "mode=edit", w=1400, h=860, sky="13:00")
    pg.click("#toolsEditBtn"); pg.wait_for_timeout(800)
    save(pg, "toolbar.jpg")


def shot_power(b):
    """'Strom' pressed: the card 'Power now' and the cables with flowing dots in the house"""
    pg = demo_page(b, sky="12:30")
    cam(pg, 13, 10, 14, 7, 3)
    pg.click("#powerBtn")
    save(pg, "power.jpg", 1500)


def shot_heat(b):
    """the rooms coloured by temperature"""
    pg = demo_page(b, sky="12:30")
    cam(pg, 13, 10, 14, 7, 3)
    pg.click("#modeBar [data-vm=temp]")
    save(pg, "heat.jpg", 1500)


def shot_floors(b):
    """real floors per room (parquet, tiles, concrete) and anthracite window frames, close up"""
    pg = demo_page(b, sky="11:30")
    cam(pg, 9, 7.5, 11, 5, 3)
    save(pg, "floors.jpg")


def shot_sky(b):
    """the sky by the time of day and the weather: four pictures in one"""
    tiles = []
    for sky, weather in (("10:30", "sunny"), ("13:00", "rainy"), ("18:20", "partlycloudy"), ("22:00", "clear-night")):
        pg = demo_page(b, f"mode=live&weather={weather}", w=1280, h=720, dsf=1, sky=sky)
        cam(pg, 15, 9.5, 16, 6, 3)
        tiles.append(grab(pg, 1500)); pg.context.close()
    gap = 16
    out = Image.new("RGB", (tiles[0].width * 2 + gap, tiles[0].height * 2 + gap), (20, 24, 30))
    for i, im in enumerate(tiles):
        out.paste(im, ((i % 2) * (im.width + gap), (i // 2) * (im.height + gap)))
    store(out, "sky.jpg")


def shot_devices(b):
    """the device overview: every linked device by room with its state, battery and offline"""
    pg = demo_page(b, sky="13:00")
    pg.click("#devicesPill")
    save(pg, "devices.jpg", 1200)


def tab_page(b, tab, view=None, sky="13:00", w=1600, h=1000):
    """a page of the tab bar (#479 …): live mode, the tab tapped, maybe one of its views (🌡 Klima → 📋 Heiz-Regeln …)"""
    pg = demo_page(b, sky=sky, w=w, h=h)
    pg.click(f"#tabBar [data-tab={tab}]"); pg.wait_for_timeout(1500)
    if view:
        pg.click(f"[data-page={tab}] [data-view={view}]"); pg.wait_for_timeout(1200)
    return pg


def shot_today(b):
    """☀ Today: weather, the day, power now, waste, pinboard, the train"""
    save(tab_page(b, "today"), "today.jpg", 1500)


def shot_energy(b):
    """⚡ Energy: the day as bars, the meters, the bill"""
    save(tab_page(b, "energy"), "energy.jpg", 1500)


def shot_climate(b):
    """🌡 Climate: a card per room, the thermostat as a circle with the room sensor's temperature (#573)"""
    save(tab_page(b, "climate"), "climate.jpg", 1500)


def shot_heatrules(b):
    """🌡 Climate → 📋 Heating rules: the room sensors of the thermostats (#573) on top, the ready-made rules below"""
    save(tab_page(b, "climate", "rules"), "heatrules.jpg", 1500)


def shot_heatplan(b):
    """🌡 Climate → 📅 Schedule: the week of the living room as coloured blocks"""
    pg = tab_page(b, "climate", "plan")
    pg.evaluate("[...document.querySelectorAll('[data-page=climate] .hpRooms [data-room]')].find((x) => /Living|Wohn/.test(x.textContent))?.click()")
    save(pg, "heatplan.jpg", 1200)


def shot_routines(b):
    """▶ Routines: own routines as a chain, automations of Home Assistant with what they do, scenes, what happened"""
    save(tab_page(b, "routines"), "routines.jpg", 1500)


def shot_flowedit(b):
    """the editor of a routine: blocks on the left, the chain in the middle, the settings on the right"""
    pg = tab_page(b, "routines")
    pg.evaluate("[...document.querySelectorAll('[data-page=routines] button')].find((x) => x.textContent.includes('✏'))?.click()")
    save(pg, "flowedit.jpg", 1500)


def shot_closet(b):
    """the closet editor: a closet made to measure under the slope of the roof (#545)"""
    pg = demo_page(b, "mode=edit", sky="13:00")
    pg.evaluate("() => { const L = __fp.layout.floors, i = L.findIndex((f) => f.devices.some((d) => d.id === 'schrank_dach')); __fp.switchFloor(i); __fp.editCloset('schrank_dach'); }")
    save(pg, "closet.jpg", 2000)


def timeline_day():
    """a recorded day for the security picture: the evening of yesterday in the demo house"""
    tz = ZoneInfo(TZ)
    day = datetime.datetime.now(tz).date() - datetime.timedelta(days=1)
    start = datetime.datetime.combine(day, datetime.time(), tz).timestamp()
    at = lambda hh, mm: start + hh * 3600 + mm * 60
    off = {"state": "off"}
    snap = {e: off for e in ("light.wohnzimmer", "light.stehlampe", "light.kueche", "light.schlafzimmer", "light.bad", "light.buero",
                             "light.shapes_wz", "light.tv_led", "light.sofa_led", "light.voute_bett", "light.voute_fenster", "light.garage",
                             "binary_sensor.fenster_wohnzimmer", "binary_sensor.fenster_kueche", "binary_sensor.tuer_buero",
                             "binary_sensor.tuer_wohnzimmer_kueche", "binary_sensor.buero_praesenz")}
    snap.update({"person.anna": {"state": "home"}, "person.max": {"state": "not_home"}, "cover.garagentor": {"state": "closed", "position": 0}})
    ev = [((6, 40), "light.bad", {"state": "on"}), ((6, 55), "light.kueche", {"state": "on"}), ((7, 20), "light.bad", off),
          ((7, 35), "light.kueche", off), ((7, 45), "cover.garagentor", {"state": "open", "position": 100}), ((7, 46), "person.anna", {"state": "not_home"}),
          ((7, 52), "cover.garagentor", {"state": "closed", "position": 0}), ((11, 5), "binary_sensor.fenster_kueche", {"state": "on"}),
          ((11, 40), "binary_sensor.fenster_kueche", off), ((17, 10), "cover.garagentor", {"state": "open", "position": 100}),
          ((17, 11), "person.max", {"state": "home"}), ((17, 14), "cover.garagentor", {"state": "closed", "position": 0}),
          ((17, 20), "light.kueche", {"state": "on"}), ((17, 45), "binary_sensor.fenster_wohnzimmer", {"state": "on"}),
          ((18, 30), "light.wohnzimmer", {"state": "on", "brightness": 70, "rgb": [255, 140, 110]}), ((18, 31), "light.stehlampe", {"state": "on"}),
          ((18, 50), "person.anna", {"state": "home"}), ((19, 5), "light.tv_led", {"state": "on", "rgb": [255, 60, 160]}),
          ((19, 6), "light.shapes_wz", {"state": "on", "rgb": [120, 90, 255]}), ((19, 30), "light.buero", {"state": "on", "rgb": [255, 226, 110]}),
          ((19, 31), "binary_sensor.buero_praesenz", {"state": "on"}), ((19, 40), "light.kueche", off),
          ((21, 50), "light.voute_bett", {"state": "on", "rgb": [190, 80, 255]}), ((22, 30), "light.wohnzimmer", off),
          ((22, 31), "light.stehlampe", off), ((22, 32), "light.tv_led", off), ((22, 33), "light.shapes_wz", off), ((23, 10), "light.voute_bett", off)]
    lines = [{"t": start + 1, "snap": snap}] + [{"t": at(*hm), "e": e, "s": s} for hm, e, s in ev]
    iso = day.isoformat()
    return {"info": {"days": [{"day": iso, "size": 48213}], "on": True, "keepDays": 7, "recording": True, "ha": True, "folder": "addon_configs/…_floorplan3d/timeline"},
            "day": {"day": iso, "start": start, "end": start + 86400, "now": start + 2 * 86400, "lines": lines}}


def shot_security(b):
    """security: a recorded day played back, the time line with its events at the bottom"""
    pg = demo_page(b, sky="19:35", timeline=timeline_day())
    cam(pg, 14, 9, 15, 6, 3)
    pg.click("#timelineBtn"); pg.wait_for_timeout(800)
    pg.click("#tlDays .tlDay"); pg.wait_for_timeout(1200)
    pg.evaluate("""(() => { const s = document.querySelector('#tlBar input[type=range]');
      s.value = String(Math.round((19 * 60 + 35) / 1440 * 1000)); s.dispatchEvent(new Event('input', { bubbles: true })); })()""")
    save(pg, "security.jpg", 1500)


def shot_phone(b):
    """three phones in one picture: the house at dusk with room labels and tiles, 'Strom' pressed, a room opened"""
    shots = []
    pg = demo_page(b, phone=True, sky="18:40")
    cam(pg, 19.8, 32, 25.6, 7, 3)                            # a little closer than the phone starts
    shots.append(grab(pg, 1000)); pg.context.close()
    pg = demo_page(b, phone=True, sky="12:30")
    cam(pg, 19.8, 32, 25.6, 7, 3)
    pg.click("#powerBtn"); shots.append(grab(pg, 1500)); pg.context.close()
    pg = demo_page(b, phone=True, sky="19:15")
    pg.evaluate("__fp.liveTapRoom('r1')"); pg.wait_for_timeout(1500)
    cam(pg, 11.5, 20.1, 17.1, 3, 2.25)
    shots.append(grab(pg, 1000)); pg.context.close()
    w, h = 600, round(600 * shots[0].height / shots[0].width)
    bez, gap = 14, 56
    out = Image.new("RGBA", (3 * (w + 2 * bez) + 2 * gap, h + 2 * bez), (0, 0, 0, 0))
    for i, im in enumerate(shots):
        x = i * (w + 2 * bez + gap)
        frame = Image.new("RGBA", (w + 2 * bez, h + 2 * bez), (0, 0, 0, 0))
        ImageDraw.Draw(frame).rounded_rectangle((0, 0, frame.width - 1, frame.height - 1), 64, fill=(18, 20, 24, 255))
        frame.alpha_composite(rounded(im.resize((w, h), Image.LANCZOS), 52), (bez, bez))
        out.alpha_composite(frame, (x, 0))
    store(out.resize((out.width * 3 // 4, out.height * 3 // 4), Image.LANCZOS), "phone.png")    # PNG: the corners stay see-through


def shot_tour(b):
    """the quick tour GIF: live view, room panel, a lamp, heat, power, whole house, night, 2D, split view, device library"""
    frames = []
    def add(pg, ms=900):
        frames.append(grab(pg, ms).resize((900, 506), Image.LANCZOS))
    pg = demo_page(b, w=1600, h=900, dsf=1, sky="13:00")
    cam(pg, 14, 9, 15, 6, 3)
    add(pg, 600)
    pg.evaluate("__fp.liveTapRoom('r1')"); add(pg, 1800)
    pg.click("#roomPanel .rp-x"); pg.wait_for_timeout(1200)            # closed, the camera leaves the room
    cam(pg, 14, 9, 15, 6, 3)
    pg.click("#modeBar [data-vm=temp]"); add(pg, 1000)
    pg.click("#modeBar [data-vm=normal]")
    pg.click("#powerBtn"); add(pg, 1200)
    pg.click("#powerBtn")
    pg.evaluate("__fp.setHouseMode(true)"); pg.wait_for_timeout(1500)
    cam(pg, 24, 15, 27, 7, 3); add(pg, 800)
    pg.evaluate("__fp.setHouseMode(false)"); pg.context.close()
    pg = demo_page(b, w=1600, h=900, dsf=1, sky="21:00")
    cam(pg, 14, 9, 15, 6, 3); add(pg, 800)
    pg.click("#view2d"); add(pg, 1200)
    pg.click("#viewSplit"); add(pg, 1400)
    pg.click("#modeSwitch [data-mode=edit]"); pg.click("#view3d"); pg.click("#tools [data-tool=device]"); add(pg, 1400)
    pg.context.close()
    pal = frames[0].quantize(256, method=Image.Quantize.MEDIANCUT)
    out = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    out[0].save(IMG / "overview.gif", save_all=True, append_images=out[1:], duration=1700, loop=0, optimize=True)


# ---------- the add-on (a throw-away server) ----------

class Server:
    """a throw-away add-on server (standalone mode: no Home Assistant, everybody may edit)"""
    def __init__(self, port=PORT):
        self.port = port

    def __enter__(self):
        self.data = tempfile.mkdtemp()
        env = {**os.environ, "DATA_DIR": self.data, "CONFIG_DIR": os.path.join(self.data, "config"), "PORT": str(self.port)}
        env.pop("SUPERVISOR_TOKEN", None)
        self.proc = subprocess.Popen([sys.executable, str(ROOT / "floorplan3d" / "rootfs" / "app" / "server.py")], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(40):
            try:
                urllib.request.urlopen(f"http://localhost:{self.port}/api/layout", timeout=1); return self
            except OSError:
                time.sleep(0.25)
        raise RuntimeError("server did not start")

    def __exit__(self, *a):
        self.proc.terminate()


def app_page(b, query="mode=edit", w=1400, h=860, lang="en-US", dsf=1.5, port=PORT):
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf, locale=lang, timezone_id=TZ)
    pg = ctx.new_page()
    pg.goto(f"http://localhost:{port}/?{query}")
    pg.wait_for_function("document.querySelector('[data-tool=select]')?.textContent.trim().length > 0", timeout=60000)   # the interface is translated
    pg.wait_for_timeout(2500)
    return pg


def shot_welcome(b):
    pg = app_page(b)
    save(pg, "welcome.jpg")


def shot_backup(b):
    pg = app_page(b, h=1300)                                     # tall, so the dialog shows its list without being scrolled
    pg.evaluate("localStorage.setItem('fp3d.welcome','1')")
    pg.click("#backupBtn"); pg.wait_for_timeout(800)
    pg.click("#abNow"); pg.wait_for_timeout(1500); pg.click("#abNow"); pg.wait_for_timeout(1500)
    pg.check("#setAutoBackup"); pg.wait_for_timeout(600)
    pg.click("#abTest"); pg.wait_for_timeout(1000)
    pg.locator("#autoBackup").scroll_into_view_if_needed()
    pg.locator("#backupDialog").screenshot(path=str(IMG / "backup.png"))
    pg.context.close()


def shot_version(b):
    pg = app_page(b, w=1100, h=700)
    pg.wait_for_function("document.querySelector('#versionPill')?.className.includes('ver-ok')", timeout=60000)
    pg.click("#versionPill"); pg.wait_for_timeout(600)
    pg.locator("#versionDialog").screenshot(path=str(IMG / "version.png"))
    pg.context.close()


# a room whose edges cross each other: the check names the exact place in the JSON
BAD_JSON = json.dumps({"schemaVersion": 1, "building": {"floors": [{"name": "Flat", "kind": "floor", "rooms": [
    {"name": "Living", "points": [[0, 0], [5, 5], [5, 0], [0, 5]]}]}]}}, indent=2)


def shot_import(b):
    """the pictures of docs/IMPORT.md (German, import-N.jpg) and docs/IMPORT.en.md (English, import-en-N.jpg), each in a fresh add-on,
    and docs/img/import-demo.gif (English): an example checked, imported and turned in 3D"""
    for lang, pre in (("de-DE", "import-"), ("en-US", "import-en-")):
        frames = []
        def take(pg, name=None, frame=True, ms=0):
            im = grab(pg, ms)
            if name:
                store(im, f"{pre}{name}.jpg")
            if frame:
                frames.append(im.resize((960, 600), Image.LANCZOS))
        with Server(PORT + 1):
            pg = app_page(b, "mode=edit&debug=1", w=1280, h=800, lang=lang, dsf=2, port=PORT + 1)
            pg.evaluate("localStorage.setItem('fp3d.welcome','1')")
            pg.reload(); pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pg.wait_for_timeout(2000)
            pg.click("#housePanel summary"); pg.wait_for_timeout(600)
            pg.locator("#importOpen").scroll_into_view_if_needed(); pg.wait_for_timeout(400)
            take(pg, "0-panel")
            pg.click("#importOpen"); pg.wait_for_timeout(600)
            pg.fill("#importText", BAD_JSON); pg.click("#importCheck"); pg.wait_for_timeout(1200)
            take(pg, "2-error", frame=False)
            pg.click("#importExHouse"); take(pg, ms=600)
            pg.click("#importCheck"); pg.wait_for_function("!document.querySelector('#importRun').disabled", timeout=30000)
            take(pg, "1-dialog", ms=600)
            pg.click("#importRun"); pg.wait_for_function("!document.querySelector('#importDialog').open", timeout=30000)
            take(pg, "3-result", ms=3000)
            pg.click("#modeSwitch [data-mode=live]"); pg.wait_for_timeout(800)
            pg.evaluate("__fp.setHouseMode(true)"); pg.wait_for_timeout(2500)
            cam(pg, 26, 17, 31, 11, 13.5)                       # docs/examples/house.json: the house in the middle of its 22 x 30 m plot
            take(pg, "4-whole-house")
            pg.mouse.move(640, 560)
            for i in range(6):                                  # turn the house a little, frame by frame
                pg.mouse.down(); pg.mouse.move(640 - 25 * (i + 1), 560, steps=3); pg.mouse.up(); pg.mouse.move(640, 560); take(pg, ms=300)
            pg.evaluate("__fp.setHouseMode(false)"); pg.click("#modeSwitch [data-mode=edit]"); pg.click("#view2d"); pg.wait_for_timeout(1200)
            pg.click("#fitBtn")
            take(pg, "5-plan2d", frame=False, ms=1200)
            pg.context.close()
        if lang == "en-US":
            pal = frames[-1].quantize(256, method=Image.Quantize.MEDIANCUT)
            out = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
            ms = [1800, 1200, 2000, 1800, 1500] + [400] * (len(out) - 6) + [1800]
            out[0].save(IMG / "import-demo.gif", save_all=True, append_images=out[1:], duration=ms, loop=0, optimize=True)


SHOTS = {"hero": shot_hero, "house": shot_house, "ground": shot_ground, "ledring": shot_ledring, "room": shot_room, "light": shot_light,
         "split": shot_split, "plan": shot_plan, "library": shot_library, "toolbar": shot_toolbar, "power": shot_power, "heat": shot_heat,
         "floors": shot_floors, "sky": shot_sky, "devices": shot_devices, "security": shot_security, "phone": shot_phone, "tour": shot_tour,
         "today": shot_today, "energy": shot_energy, "climate": shot_climate, "heatrules": shot_heatrules, "heatplan": shot_heatplan,
         "routines": shot_routines, "flowedit": shot_flowedit, "closet": shot_closet}
SERVER_SHOTS = {"welcome": shot_welcome, "backup": shot_backup, "version": shot_version}
OWN_SERVER = {"import": shot_import}                                       # starts its own add-on (a fresh one per language)


def main():
    known = {**SHOTS, **SERVER_SHOTS, **OWN_SERVER}
    want = sys.argv[1:] or list(known)
    bad = [n for n in want if n not in known]
    if bad:
        sys.exit(f"unknown: {' '.join(bad)} (known: {' '.join(known)})")
    IMG.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = browser(p)
        for n in want:
            if n in SHOTS or n in OWN_SERVER:
                known[n](b); print("written", n)
        if any(n in SERVER_SHOTS for n in want):
            with Server():
                for n in want:
                    if n in SERVER_SHOTS:
                        SERVER_SHOTS[n](b); print("written", n)
        b.close()


if __name__ == "__main__":
    main()
