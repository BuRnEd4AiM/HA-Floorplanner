"""The shots of the trailer (tools/make_trailer.py) and their order: a short film of the best of the add-on, cut to the music.

A shot is filmed in the demo by the engine of the video guide (tools/guide/recorder.py: the same slowed clocks, the same pointer and
clicks), but it is made for the look, not to teach:
  kind "cine"   the 3D house alone, every bar and button hidden, the camera flies on its own (orbit) - full screen
  kind "ui"     the app as it is, with the pointer, in a floating window under the caption
  kind "phone"  a phone beside the caption
  kind "card"   nothing filmed: the title at the start (drawn by tools/trailer/edit.py)
Every shot has its length in beats of the music (BPM, a beat is half a second), the caption that comes up with it (German and
English: a small word above, the title, maybe a line under it) and the part of the film it belongs to (PART, the music follows it).

To change the film: change a shot here, then python3 tools/make_trailer.py --shots <id> (records only that one again, keeps the
others) and look at it. The order is ORDER at the bottom.
"""
import json
import math
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "guide"))

from recorder import Clip  # noqa: E402  (the engine of the video guide)

BPM = 120
BEAT = 60 / BPM

# the parts of the film: how full the music is in them (0 quiet … 3 everything)
PART = {"intro": 0, "hero": 1, "live": 3, "plan": 2, "pages": 3, "outro": 1}

# everything of the app that is not the 3D picture (a "cine" shot hides it)
CLEAN = ("#toolbar,#tabBar,#navBar,#modeBar,#compass,#findBtn,#voiceBtn,#floorRail,#floorCards,#sideStack,#roomTiles,#sceneBar,"
         "#alertBar,#skyChips,#skyLine,.demo-badge,#tilesLeft,#tilesRight{display:none!important}")
NO_LABELS = "#roomLabels{display:none!important}"
UI_CSS = "#roomTiles,#tilesLeft,#tilesRight{display:none!important}"   # the app shots: the strip of favourites would cover the house
MID = (5.6, 3.3)                         # the middle of the demo house (x, z in metres), the camera looks there

# the camera flies around the house: the angle a (radians), the distance and the height change evenly from the start to the end
ORBIT_JS = """(o) => {
  window.__orbitStop = false;
  const t0 = performance.now();
  const f = () => {
    if (window.__orbitStop) return;
    const u = Math.min(1, (performance.now() - t0) / o.ms);
    const a = o.a0 + (o.a1 - o.a0) * u, d = o.d0 + (o.d1 - o.d0) * u, h = o.h0 + (o.h1 - o.h0) * u;
    window.__fp.camAt(o.cx + d * Math.cos(a), h, o.cz + d * Math.sin(a), o.cx, o.cz);
    if (u < 1) requestAnimationFrame(f);
  };
  f();
}"""


class Shot(Clip):
    """one shot of the trailer: a clip of the guide's engine plus its kind, length, caption and part"""
    def __init__(self, sid, kind, fn, beats, caption=None, part="live", speed=1.0, slow=None, keep=False, focus=None, up=None, beat=None, **kw):
        super().__init__(sid, "trailer", {"de": sid, "en": sid}, {"de": "", "en": ""}, "", fn, **kw)
        self.kind, self.beats, self.caption, self.part = kind, beats, caption, part
        self.speed = speed               # how fast the recording is played in the film (1.5: half again as fast)
        self.slow = slow                 # how much slower the page runs while it is filmed (more pictures a second: smoother)
        self.keep = keep                 # the caption of the shot before stays (a group of short shots under one title)
        # what the film shows of the screen: (x, y) 0…1 of the screen, or keyframes [(u, x, y, zoom), …] (u 0…1 of the shot);
        # zoom 1.33 shows the app pixel for pixel in the window, the upright film crops around (x, y)
        self.focus = focus
        self.up = up                     # (x, y): where the upright film looks (its card; in an app shot its magnifier, else that follows the pointer);
        #                                  False: an app shot upright without a magnifier, only the whole app (pages full of small cards)
        self.beat = beat                 # the moment the shot marks with r.say("@beat", …) comes this many seconds into the shot (on a beat)

    @property
    def seconds(self):
        return self.beats * BEAT


SHOTS = {}


def shot(sid, kind, beats, caption=None, **kw):
    def put(fn):
        assert sid not in SHOTS, f"two shots are called {sid}"
        SHOTS[sid] = Shot(sid, kind, fn, beats, caption, **kw)
        return fn
    return put


def cap(de, en):
    """a caption: (small word above, title, line under it or "") in German and English"""
    return {"de": de, "en": en}


# ---------- helpers for the shots ----------

def clean(r, labels=False):
    """only the 3D picture: every bar hidden, the picture as big as the window"""
    r.pg.add_style_tag(content=CLEAN + ("" if labels else NO_LABELS))
    r.pg.evaluate("dispatchEvent(new Event('resize'))")
    r.pg.wait_for_timeout(600)


def whole_house(r):
    r.pg.evaluate("document.querySelector('#floorRail .railHouse').click()")
    r.pg.wait_for_timeout(1500)


def cam(r, a, d, h, mid=MID):
    """put the camera at angle a, distance d, height h around the middle"""
    x, z = mid[0] + d * math.cos(a), mid[1] + d * math.sin(a)
    r.pg.evaluate(f"window.__fp.camAt({x}, {h}, {z}, {mid[0]}, {mid[1]})")


def orbit(r, a0, a1, d0, d1, h0, h1, seconds, mid=MID, wait=True):
    """the camera flies from one place to another around the house in this many seconds of the film (and the clip waits for it,
    unless wait=False)"""
    o = {"a0": a0, "a1": a1, "d0": d0, "d1": d1, "h0": h0, "h1": h1, "cx": mid[0], "cz": mid[1], "ms": seconds * 1000}
    r.pg.evaluate(f"({ORBIT_JS})({json.dumps(o)})")
    if wait:
        r.wait(seconds * 1000)



def at(r, sel, nth=0, text=None):
    """the middle of a thing of the page (CSS px), asked from the page itself and scrolled into view at once. Playwright's own way
    waits for two quiet frames: seconds while a lit 3D room is drawn behind it, and the film would wait that long (as spot() in
    tools/guide/clips_edit.py)"""
    for _ in range(40):                  # a dialog that is still opening: up to 4 s (of the page) for it
        x, y = r.js("""([s, n, t]) => {
          const e = [...document.querySelectorAll(s)].filter((x) => x.getClientRects().length && (!t || new RegExp(t).test(x.textContent)))[n];
          if (!e) return [null, null];
          e.scrollIntoView({ block: 'nearest' });
          const b = e.getBoundingClientRect();
          return [b.x + b.width / 2, b.y + b.height / 2];
        }""", [sel, nth, text])
        if x is not None:
            return x, y
        r.wait(100)
    raise RuntimeError(f"{sel} ({text or ''} {nth}) is not on the page")


def tap(r, sel, nth=0, text=None, ms=None):
    """move there and click (the ring shows it)"""
    r.click(*at(r, sel, nth, text), ms=ms)

def tiles_off():
    return {"roomTiles": False}


def ui_clean(r):
    r.pg.add_style_tag(content=UI_CSS)
    r.pg.evaluate("dispatchEvent(new Event('resize'))")


def ui_cam(r, a=0.95, d=16, h=13, mid=MID):
    """closer than the demo starts: the house fills the window, the bars stay"""
    ui_clean(r)
    cam(r, a, d, h, mid)
    r.pg.wait_for_timeout(900)


# ---------- the shots ----------

@shot("intro", "card", 6, part="intro")
def _(r):
    pass


def _hero_prep(r):
    clean(r)
    whole_house(r)
    cam(r, 2.25, 25.5, 12)


# the first shot: the house from outside (solid walls), then on the beat its walls turn to glass and the lit rooms show
@shot("hero", "cine", 14, part="hero", slow=16, beat=2.0, sky="20:30", settings={"roomTiles": False, "seeThrough": False}, prep=_hero_prep,
      caption=cap(("3D Floorplan · Home Assistant", "Dein Zuhause. In 3D. Live.", ""),
                  ("3D Floorplan · Home Assistant", "Your home. In 3D. Live.", "")))
def _(r):
    r.hide()
    orbit(r, 2.25, 3.55, 25.5, 21.5, 12, 9.5, 7.6, wait=False)
    r.wait(2280)
    r.say("@beat", "@beat")                              # this moment lies on a beat of the film (shot.beat seconds into the shot)
    r.js("document.querySelector('#seeToggle').click()")  # see-through: the walls facing the camera and the roof turn to glass
    r.wait(7600 - 2280)


def _close_prep(r):
    clean(r)
    cam(r, 2.1, 15, 10.5)


@shot("close", "cine", 8, part="hero", slow=9, sky="21:00", settings={"roomTiles": False, "labelMode": "none"}, prep=_close_prep,
      caption=cap(("", "Jede Lampe. Jedes Fenster. Jeder Sensor.", "Genau da, wo sie in deinem Haus sind."),
                  ("", "Every lamp. Every window. Every sensor.", "Right where they are in your house.")))
def _(r):
    r.hide()
    orbit(r, 2.1, 2.75, 15, 12.5, 10.5, 8.5, 4.6)


def _room_prep(r):
    ui_cam(r)


def _light_prep(r):
    ui_cam(r)
    r.pg.add_style_tag(content="#heatPanel{display:none!important}")      # only the room's card beside the room


# the camera glides a share k of the way towards a point (it keeps looking where it looked): closer to a room
DOLLY_JS = """(o) => {
  const a = window.__fp.cam(), b = a.map((v, i) => v + (o.to[i] - v) * o.k), t0 = performance.now();
  const f = () => {
    const u = Math.min(1, (performance.now() - t0) / o.ms), e = u * u * (3 - 2 * u);
    const p = a.map((v, i) => v + (b[i] - v) * e);
    window.__fp.camAt(p[0], p[1], p[2]);
    if (u < 1) requestAnimationFrame(f);
  };
  f();
}"""


def dolly(r, to, k, ms):
    r.pg.evaluate(f"({DOLLY_JS})({json.dumps({'to': to, 'k': k, 'ms': ms})})")


@shot("light", "ui", 16, sky="19:40", settings=tiles_off(), prep=_light_prep,
      caption=cap(("Bedienen", "Antippen, schalten, dimmen, färben", ""),
                  ("Control", "Tap, switch, dim, colour", "")))
def _(r):
    tap(r, "#roomLabels [data-room=r1]")
    r.wait(1500)
    dolly(r, (3, 0, 2.25), 0.45, 1300)                       # closer to the living room while the hand goes to its card
    sw = "#roomPanel .roomctl .swatches .sw"
    for k in (0, 5, 6):
        tap(r, sw, nth=k, ms=420)
        r.wait(350)
    tap(r, "#roomPanel .roomctl .actions button", nth=1, ms=420)    # all off
    r.wait(500)
    tap(r, "#roomPanel .roomctl .actions button", nth=0, ms=420)    # all on
    r.wait(600)


def _scene_prep(r):
    ui_cam(r, a=1.0, d=11, h=9, mid=(3, 2.5))


@shot("scenes", "ui", 8, sky="20:30", settings=tiles_off(), prep=_scene_prep,
      caption=cap(("Szenen", "Ein Tipp – das ganze Haus in Stimmung", ""),
                  ("Scenes", "One tap sets the mood for the whole house", "")))
def _(r):
    tap(r, "#sceneBar .sbTile[data-e='scene.tv_abend']")
    r.wait(1500)
    tap(r, "#sceneBar .sbTile", text="Gute Nacht|Good night")
    r.wait(1500)
    tap(r, "#sceneBar .sbTile", text="gemütlich|cosy|cozy")
    r.wait(1300)


def _sky_prep(a):
    def prep(r):
        clean(r)
        cam(r, a, 21, 11)
    return prep


# four short shots, one orbit on: the sky of a whole day (and its weather) on the beats of the music
SKY = [("sky-day", "11:30", "", 1.05), ("sky-dusk", "16:40", "", 1.25), ("sky-night", "22:30", "", 1.45), ("sky-snow", "18:30", "&weather=snowy", 1.65)]
for _i, (_sid, _time, _wx, _a) in enumerate(SKY):
    def _fn(r, a=_a):
        r.hide()
        orbit(r, a, a + 0.2, 21, 20.5, 11, 10.8, 1.9)
    shot(_sid, "cine", 4, part="live", slow=9, sky=_time, query="mode=live" + _wx, settings={"roomTiles": False, "labelMode": "none"},
         prep=_sky_prep(_a), keep=_i > 0,
         caption=None if _i else cap(("Himmel und Wetter", "Sonne, Mond, Regen und Schnee – wie draußen", ""),
                                     ("Sky and weather", "Sun, moon, rain and snow – just like outside", "")))(_fn)


def _colors_prep(r):
    ui_cam(r, a=1.2, d=14, h=12)


@shot("colors", "ui", 8, up=(0.38, 0.5), sky="13:00", settings=tiles_off(), prep=_colors_prep,
      caption=cap(("Klima", "Temperatur, Feuchte und CO₂ als Farbe", ""),
                  ("Climate", "Temperature, humidity and CO₂ as colour", "")))
def _(r):
    tap(r, "#modeBar [data-vm=temp]")
    r.wait(1500)
    tap(r, "#modeBar [data-vm=humid]")
    r.wait(1400)
    tap(r, "#modeBar [data-vm=co2]")
    r.wait(1500)


@shot("power", "ui", 8, up=(0.68, 0.45), sky="12:30", settings=tiles_off(), prep=_colors_prep,
      caption=cap(("Energie", "Sieh, wo dein Strom gerade fließt", "Solar, Netz, Batterie und jedes Gerät"),
                  ("Energy", "See where your power flows right now", "Solar, grid, battery and every device")))
def _(r):
    tap(r, "#powerBtn")
    r.wait(800)
    r.hide()
    r.wait(3200)


@shot("warnings", "ui", 8, up=(0.36, 0.4), sky="15:30", query="mode=live&weather=rainy", settings=tiles_off(), prep=_room_prep,
      caption=cap(("Warnungen", "Regen – und das Fenster ist offen?", "Du siehst es sofort, und wo."),
                  ("Warnings", "Rain – and the window is open?", "You see it at once, and where.")))
def _(r):
    r.move(*at(r, "#alertBar"))
    r.wait(600)
    tap(r, "#alertBar")
    r.wait(3000)


def _security_day():
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    import make_screenshots as ms
    d = ms.timeline_day()
    return {"api/timeline": d["info"], "api/timeline/": d["day"]}


def _security_prep(r):
    ui_cam(r)
    r.pg.click("#timelineBtn")
    r.pg.wait_for_timeout(900)
    r.pg.click("#tlDays .tlDay")
    r.pg.wait_for_timeout(1500)


@shot("security", "ui", 8, sky="19:35", settings=tiles_off(), answers=_security_day, prep=_security_prep,
      caption=cap(("Sicherheit", "Den ganzen Tag zurückspulen", "Wann war welches Licht an, welches Fenster offen?"),
                  ("Security", "Rewind the whole day", "When was which light on, which window open?")))
def _(r):
    r.slide("#tlBar input[type=range]", 0.45)
    r.wait(400)
    r.slide("#tlBar input[type=range]", 0.75)
    r.wait(500)
    r.slide("#tlBar input[type=range]", 0.88)
    r.wait(700)


@shot("voice", "ui", 8, up=(0.26, 0.55), sky="17:30", settings=tiles_off(), prep=_room_prep,
      caption=cap(("Sprache", "Frag dein Haus", "„Welche Fenster sind offen?“"),
                  ("Voice", "Ask your house", "“Which windows are open?”")))
def _(r):
    r.move(*at(r, "#voiceBtn"))
    r.wait(500)
    r.js("window.__fp.voiceAsk('Welche Fenster sind offen?')" if r.lang == "de" else "window.__fp.voiceAsk('Which windows are open?')")
    r.wait(3400)


# a flight at night from the living room (sofa, Nanoleaf, lamps) back over the bedroom with its LED ring under the ceiling
FLY_JS = """(o) => {
  const t0 = performance.now();
  const f = () => {
    const u = Math.min(1, (performance.now() - t0) / o.ms), e = 0.5 * u + 0.5 * u * u * (3 - 2 * u);
    const p = o.a.map((v, i) => v + (o.b[i] - v) * e);
    window.__fp.camAt(p[0], p[1], p[2], p[3], p[4]);
    if (u < 1) requestAnimationFrame(f);
  };
  f();
}"""
INSIDE_A = (5.55, 4.5, 4.6, 0.6, 1.2)
INSIDE_B = (6.85, 6.0, 8.5, 2.5, 3.0)


def _inside_prep(r):
    clean(r)
    r.pg.evaluate(f"window.__fp.camAt{INSIDE_A}")


@shot("inside", "cine", 8, slow=22, sky="21:45", settings={"roomTiles": False, "labelMode": "none"}, prep=_inside_prep,
      caption=cap(("Bis ins Detail", "Jedes Möbel, jede Lampe", "Nanoleaf und LED-Ringe leuchten wie in echt."),
                  ("Down to the detail", "Every chair, every lamp", "Nanoleaf and LED rings glow like the real ones.")))
def _(r):
    r.hide()
    r.pg.evaluate(f"({FLY_JS})({json.dumps({'a': INSIDE_A, 'b': INSIDE_B, 'ms': 4600})})")
    r.wait(4600)


def _empty_split(walls=False):
    def prep(r):
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "guide"))
        from clips_edit import empty_house
        empty_house(walls=walls, rooms=walls)(r)
        r.pg.click("#viewSplit")
        r.pg.wait_for_timeout(1500)
    return prep


# an L-shaped house, drawn corner by corner in the 2D plan (CSS px from the middle of the plan)
L_HOUSE = [(-170, -120), (90, -120), (90, 10), (170, 10), (170, 130), (-170, 130)]


@shot("build", "ui", 12, part="plan", query="mode=edit", prep=_empty_split(),
      caption=cap(("Planen", "Zeichne deinen Grundriss", "Das 3D-Haus entsteht beim Zeichnen."),
                  ("Plan", "Draw your floor plan", "The 3D house grows while you draw.")))
def _(r):
    tap(r, "#tools [data-tool=wall]")
    r.wait(250)
    bb = r.box("#plan2d")
    cx, cy = bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2
    for i, (x, y) in enumerate(L_HOUSE + L_HOUSE[:1]):
        r.click(cx + x, cy + y, ms=480 if i else 600)
        r.wait(100)
    r.key("Escape")
    r.wait(250)
    tap(r, "#autoRooms")
    r.wait(600)
    tap(r, "#dormerBtn")
    r.wait(2000)


def _import_answers():
    """the add-on's importer builds the show house of the import dialog (the demo has no importer): its answer to "Prüfen" and
    "Importieren", and the plan it made, which the demo then opens as a new house"""
    app = Path(__file__).resolve().parents[2] / "floorplan3d" / "rootfs" / "app"
    sys.path.insert(0, str(app))
    import importer
    data = json.loads((app / "examples" / "showcase.json").read_text())
    layout, _, report, summary = importer.build_layout(data)

    def unlinked(v):                     # without its Home Assistant entities (light.x, …): the demo has none of them ("103 offline" in red)
        if isinstance(v, dict):
            return {k: unlinked(x) for k, x in v.items()}
        if isinstance(v, list):
            return [unlinked(x) for x in v]
        return "" if isinstance(v, str) and re.fullmatch(r"[a-z_]+\.[a-z0-9_]+", v) else v
    layout = unlinked(layout)
    return {"api/import": {"ok": True, "summary": summary, "warnings": report.warnings, "errors": report.errors,
                           "name": data.get("name") or "Musterhaus", "id": "import1"},
            "api/layout?house=import1": layout}


def _import_prep(r):
    r.pg.add_style_tag(content="#offlinePill { display: none !important; }")   # the show house's lamps have no entity in the demo
    r.pg.click("#housePanel > summary")
    r.pg.wait_for_timeout(500)
    r.pg.click("#importOpen")
    r.pg.wait_for_selector("#importExShow", state="visible", timeout=10000)
    r.pg.click("#importExShow")
    r.pg.wait_for_timeout(1500)


@shot("import", "ui", 12, up=False, part="plan", query="mode=edit", answers=_import_answers, prep=_import_prep,
      caption=cap(("Import · KI", "Ein Haus aus Text – per KI oder API", "Grundriss-Foto an ChatGPT & Co., die Antwort einfügen: fertig."),
                  ("Import · AI", "A house from text – by AI or API", "A floor plan photo to ChatGPT & co., paste the answer: done.")))
def _(r):
    r.wait(250)
    tap(r, "#importCheck")
    r.wait(1300)
    tap(r, "#importRun")
    r.wait(1300)
    tap(r, "#view3d")
    r.wait(500)
    bb = r.box("#view")
    r.move(bb["x"] + bb["width"] * 0.45, bb["y"] + bb["height"] * 0.55, ms=500)
    for _ in range(6):                   # closer to the new house
        r.pg.mouse.wheel(0, -160)
        r.wait(180)
    r.wait(900)


@shot("roof", "ui", 8, up=(0.6, 0.5), part="plan", query="mode=edit", prep=_empty_split(walls=True),
      caption=cap(("Planen", "Dach, Gauben, Treppen, Balkon und Garten", ""),
                  ("Plan", "Roof, dormers, stairs, balcony and garden", "")))
def _(r):
    tap(r, "#dormerBtn")
    r.wait(1300)
    if r.pg.locator("#roofType").count() == 0 or not r.pg.locator("#roofType").is_visible():
        tap(r, "#floorPanel > summary")
        r.wait(400)
    tap(r, "#roofType")
    r.loc("#roofType").select_option("hip")
    r.wait(1200)
    r.loc("#roofType").select_option("gable")
    r.wait(800)
    if r.pg.locator("#addDormer").count():
        tap(r, "#addDormer")
        r.wait(1500)


@shot("power-edit", "ui", 8, up=(0.49, 0.38), part="plan", query="mode=edit", sky="12:30", prep=_room_prep,
      caption=cap(("Strom-Editor", "Strom einrichten: Netz, Solar, Batterie", "Aus dem Energie-Dashboard übernehmen, mit einem Klick."),
                  ("Power editor", "Set up power: grid, solar, battery", "Take it over from the energy dashboard in one click.")))
def _(r):
    tap(r, "#powerEditBtn")
    r.wait(1300)
    tap(r, "#energyBtn")
    r.wait(800)
    tap(r, "#enHaLoad")
    r.wait(1000)
    tap(r, "#enHaApply")
    r.wait(1300)


def tab(r, name, ms=1500):
    tap(r, f"#tabBar [data-tab={name}]")
    r.wait(ms)


def _pages_prep(r):
    ui_cam(r)
    r.pg.click("#tabBar [data-tab=today]")
    r.pg.wait_for_timeout(1500)


@shot("pages", "ui", 12, part="pages", sky="15:49", prep=_pages_prep, up=False,
      caption=cap(("Seiten", "Fertige Seiten für alles", "Heute · Energie · Klima · Kameras · Familie …"),
                  ("Pages", "Ready-made pages for everything", "Today · Energy · Climate · Cameras · Family …")))
def _(r):
    r.wait(900)
    tab(r, "energy", 1300)
    tab(r, "climate", 1300)
    tab(r, "cameras", 1300)
    tab(r, "family", 1200)


def _climate_prep(r):
    ui_cam(r)
    r.pg.click("#tabBar [data-tab=climate]")
    r.pg.wait_for_timeout(1500)


@shot("heat", "ui", 8, part="pages", sky="15:49", prep=_climate_prep, up=False,
      caption=cap(("Heizung", "Heizplan und Heiz-Regeln", "Fenster auf, Heizung aus: fertig zum Einschalten."),
                  ("Heating", "Heating schedule and rules", "Window open, heating off: ready to switch on.")))
def _(r):
    tap(r, "[data-page=climate] [data-view=plan]")
    r.wait(700)
    tap(r, "[data-page=climate] .hpRooms [data-room]", text="Wohnzimmer|Living")
    r.wait(1500)
    tap(r, "[data-page=climate] [data-view=rules]")
    r.wait(1600)


def _routines_prep(r):
    ui_cam(r)
    r.pg.click("#tabBar [data-tab=routines]")
    r.pg.wait_for_selector("[data-page=routines] .bdBtn.primary", state="visible", timeout=20000)
    r.pg.wait_for_timeout(1500)


@shot("flow", "ui", 8, part="pages", sky="15:49", prep=_routines_prep, up=(0.27, 0.3),
      caption=cap(("Abläufe", "Eigene Abläufe aus Bausteinen", "Wenn – dann, wie in Node-RED. Ohne YAML."),
                  ("Routines", "Build your own routines from blocks", "When – then, like in Node-RED. No YAML.")))
def _(r):
    for _try in range(3):                # the page of the routines may still be building: tap again until the editor is open
        tap(r, "[data-page=routines] .bdBtn.primary", text="Neuer|New")
        r.wait(900)
        if r.js("(() => { const b = document.querySelector('.feDlg [data-add=time]'); return !!b && b.getClientRects().length > 0; })()"):
            break
    tap(r, ".feDlg [data-add=time]")
    r.wait(800)
    tap(r, ".feDlg [data-add=cover]")
    r.wait(700)
    tap(r, ".feDlg label", text="Wohnzimmer|Living")
    r.wait(1500)


def _dash_prep(r):
    ui_cam(r)
    r.pg.click("#tabBar [data-tab=today]")
    r.pg.wait_for_timeout(1100)
    r.pg.click("#tabBar .tbEdit")
    r.pg.wait_for_timeout(1000)


@shot("dash", "ui", 8, part="pages", sky="15:49", prep=_dash_prep,
      caption=cap(("Dashboards", "Seiten selbst gestalten", "Karten hinzufügen, ausblenden, frei anordnen."),
                  ("Dashboards", "Design your own pages", "Add cards, hide them, arrange them freely.")))
def _(r):
    tap(r, "[data-page=today] .bdAdd")
    r.wait(600)
    tap(r, ".ceDlg [data-type=thermostat]")
    r.wait(600)
    tap(r, ".ceDlg .ceItem[data-entity='climate.wohnzimmer']")
    r.wait(500)
    tap(r, ".ceDlg [data-act=save]")
    r.wait(900)
    tap(r, "[data-page=today] .bdStrip [data-act=free]")
    r.wait(1300)


@shot("phone", "phone", 12, part="pages", device="phone", sky="18:40",
      caption=cap(("Überall", "Am Handy, am Tablet, an der Wand", ""),
                  ("Everywhere", "On the phone, the tablet, the wall", "")))
def _(r):
    r.wait(600)
    tap(r, "#roomLabels [data-room=r1]")
    r.wait(1500)
    r.click(*r.ball("d5"))
    r.wait(1200)
    if r.pg.locator("#livePopup .swatches .sw").count() > 6:
        tap(r, "#livePopup .swatches .sw", nth=6)
        r.wait(1000)


def guide_site():
    """the page of the video guide (tools/make_guide.py), built from the pictures and texts of its videos on the branch guide-videos
    (the videos themselves are not needed: the shot shows the page, its search and a clip's steps, no video plays). Built once into
    $TRAILER_GUIDE or <temp>/trailer-guide; returns the folder of the page"""
    import io
    import os
    import subprocess
    import tarfile
    import tempfile
    root = Path(__file__).resolve().parents[2]
    home = Path(os.environ.get("TRAILER_GUIDE") or Path(tempfile.gettempdir()) / "trailer-guide")
    site, vids = home / "site", home / "vids"
    if (site / "guide.json").exists():
        return site
    subprocess.run(["git", "-C", str(root), "fetch", "-q", "--depth", "1", "origin", "guide-videos"], check=True)
    tar = subprocess.run(["git", "-C", str(root), "archive", "FETCH_HEAD", "--", ":(glob)**/*.jpg", ":(glob)**/*.json"],
                         check=True, capture_output=True).stdout
    vids.mkdir(parents=True, exist_ok=True)
    tarfile.open(fileobj=io.BytesIO(tar)).extractall(vids, filter="data")
    for j in vids.glob("*/*.json"):                # an empty stand-in for each video: the page lists the clips that have one
        j.with_suffix(".mp4").touch()
    sys.path.insert(0, str(root / "tools"))
    import make_guide
    make_guide.build_site(site, vids)
    return site


def _guide_prep(r):
    site = guide_site()

    def serve(route):                               # the page from the folder, as if from a web server (file:// may not load guide.json)
        f = site / route.request.url.split("guide.local/", 1)[1].split("?")[0].split("#")[0]
        route.fulfill(path=str(f)) if f.is_file() else route.fulfill(status=404, body="")
    r.pg.route("http://guide.local/**", serve)
    r.pg.emulate_media(color_scheme="dark")
    r.pg.goto(f"http://guide.local/index.html?lang={r.lang}", wait_until="domcontentloaded")
    r.pg.wait_for_selector("#main .card", state="visible", timeout=20000)
    r.pg.wait_for_timeout(1200)


@shot("guide", "ui", 12, part="pages", up=False, prep=_guide_prep,   # time to see what it is (the owner: "2-3 Sekunden mehr Zeit … kein Zoom")
      caption=cap(("Hilfe", "Zu jeder Funktion ein kurzes Video", "Einfach eintippen, was du tun möchtest – auch im Add-on unter „Anleitung“."),
                  ("Help", "A short video for every feature", "Just type what you want to do – also in the add-on under “Guide”.")))
def _(r):
    r.wait(1000)                                    # the page first: what it is
    tap(r, "#q")
    r.type("Gaube" if r.lang == "de" else "dormer", ms=160)
    r.wait(1700)                                    # the videos it found
    tap(r, "#main .card .thumb")
    r.pg.wait_for_selector("#player #pTitle", state="visible", timeout=5000)
    r.wait(2000)


def _outro_prep(r):
    clean(r)
    whole_house(r)
    cam(r, 3.0, 26, 13)


@shot("outro", "cine", 16, part="outro", slow=16, sky="16:50", settings={"roomTiles": False, "seeThrough": False}, prep=_outro_prep)
def _(r):
    r.hide()
    orbit(r, 3.0, 4.1, 26, 23, 13, 11.5, 8.6)


# the film, in this order
ORDER = ["intro", "hero", "close", "light", "scenes", "sky-day", "sky-dusk", "sky-night", "sky-snow", "colors", "power", "warnings",
         "security", "voice", "inside", "build", "import", "roof", "power-edit", "pages", "heat", "flow", "dash", "phone", "guide", "outro"]

# the address of the demo, shown at the end
DEMO_URL = "burned4aim.github.io/HA-Floorplanner"
