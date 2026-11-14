"""4.73.0 „Oberfläche 2“ (the owner, 2026-11-08: "so unendlich viele Einstellmöglichkeiten … dass man zwischen alt und neu wechseln kann",
his choice of the pictures in docs/ideen-5.0/): the switch „Klassisch / ✨ Neu“ in the top bar of the edit mode, in ⚙ → Allgemein and with
?ui=2 (per device, localStorage); the new panel orders the very same fields into sections that fold in and out (a line says what is set),
under a path and a head; a window drawn half open, a pane tapped gets a menu (turn left / right, tilt, swing out, fixed); the number of
panes and the way they open as buttons; the kinds of window as pictures; a room with tabs, its floors as pictures, its floor height seen
from the side; „Klassisch“ gives the old panel back. Every change lands in the layout of the add-on like with the classic fields.
"""
saved_v2 = api_admin("api/layout")              # put back at the end
st_v2 = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_v2(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
lay_v2 = json.loads(json.dumps(saved_v2))
f_v2 = lay_v2["floors"][0]
f_v2.setdefault("rooms", []).append({"id": "v2_r", "name": "Probe", "color": "#777777", "points": [[110, 60], [116, 60], [116, 64], [110, 64]]})
f_v2.setdefault("walls", []).append(
    {"id": "v2_w", "a": [110, 60], "b": [116, 60], "thickness": 0.24, "height": 2.6, "openings": [
        {"id": "v2_o", "type": "window", "style": "double", "pos": 3, "width": 1.2, "height": 1.2, "sill": 0.9, "name": "Probefenster"}]})
put_layout_v2(lay_v2)
own_v2 = []
pgV = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgV.on("console", lambda m: own_v2.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgV.on("pageerror", lambda e: own_v2.append("PAGEERROR " + str(e)))
def wait_v2(fn, n=40, ms=250):
    for _ in range(n):
        v = fn()
        if v: return v
        pgV.wait_for_timeout(ms)
    return fn()
def open_v2(q="&ui=2"):
    pgV.goto(BASE + "?debug=1&mode=edit" + q); pgV.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgV.wait_for_timeout(800)
    pgV.evaluate("window.__fp.switchFloor(0)"); pgV.wait_for_timeout(400)
op_v2 = lambda: pgV.evaluate("(() => { for (const f of window.__fp.layout.floors) for (const w of f.walls) for (const o of (w.openings || [])) if (o.id === 'v2_o') return o; return null; })()")
srv_op_v2 = lambda: next((o for f in api_admin("api/layout")["floors"] for w in f["walls"] for o in w.get("openings", []) if o["id"] == "v2_o"), None)
secs_v2 = lambda: pgV.evaluate("[...document.querySelectorAll('#propsBody .v2Sec')].map((s) => s.dataset.sec)")
open_v2()

check("ui v2: ?ui=2 turns the new panel on and remembers it on this device; the switch in the top bar says „✨ Neu“",
      pgV.evaluate("document.body.classList.contains('uiV2')") and pgV.evaluate("localStorage.getItem('fp.ui')") == "v2"
      and pgV.locator("#uiSwitch [data-ui=v2].active").is_visible() and "Neu" in pgV.inner_text("#uiSwitch [data-ui=v2]"),
      [pgV.evaluate("document.body.className"), pgV.evaluate("localStorage.getItem('fp.ui')")])

pgV.evaluate("window.__fp.select('opening', 'v2_o')"); pgV.wait_for_selector("#v2Head", timeout=10000)
check("ui v2: a window: path (house › floor › room › window), the head with its name and „Löschen“; the old title and hint are gone",
      "Probe" in pgV.inner_text("#v2Crumbs") and "Probefenster" in pgV.inner_text("#v2Head") and pgV.locator("#v2Delete").is_visible()
      and not pgV.locator("#propsTitle").is_visible() and not pgV.locator("#hint").is_visible() and not pgV.locator("#propsDelete").is_visible(),
      [pgV.inner_text("#v2Crumbs"), pgV.inner_text("#v2Head")])
check("ui v2: the window's sections in order: Fensterart, Größe & Lage, Flügel & Öffnen, Feste Scheibe, Home Assistant, Rollladen, Aussehen (#754), Mehr",
      secs_v2() == ["kind", "size", "panes", "fixed", "contact", "shutter", "look", "more"], secs_v2())
check("ui v2: a section line says what is set (1,20 × 1,20, Brüstung 0,90; kein Kontakt)",
      "Brüstung" in pgV.inner_text(".v2Sec[data-sec=size] .sum") and "kein Kontakt" in pgV.inner_text(".v2Sec[data-sec=contact] .sum"),
      [pgV.inner_text(".v2Sec[data-sec=size] .sum"), pgV.inner_text(".v2Sec[data-sec=contact] .sum")])
check("ui v2: the same fields as before, only ordered: width under „Größe & Lage“, the old pane fields hidden",
      pgV.locator(".v2Sec[data-sec=size] .bd .prop input").count() >= 3 and not pgV.locator("#winPanes").is_visible() and pgV.locator("#winPanes").count() == 1,
      pgV.locator(".v2Sec[data-sec=size] .bd .prop").count())
check("ui v2: „Home Assistant“ starts closed; a tap opens it with the contact field", not pgV.locator(".v2Sec[data-sec=contact] .bd").is_visible(), None)
pgV.click(".v2Sec[data-sec=contact] > .hd"); pgV.wait_for_timeout(200)
check("ui v2: … open now", pgV.locator(".v2Sec[data-sec=contact] .bd .entPicker").first.is_visible(), None)

check("ui v2: the window drawn half open, two panes that tilt", pgV.locator("#v2Window [data-pane]").count() == 2
      and "kippt" in pgV.inner_text("#v2Window"), pgV.inner_text("#v2Window"))
pgV.click("#v2Window [data-pane='1']"); pgV.wait_for_timeout(300)
check("ui v2: a pane tapped gets its menu (5 choices, „Kippen“ marked)", pgV.locator("#v2PaneMenu .v2Opt").count() == 5
      and pgV.get_attribute("#v2PaneMenu .v2Opt.on", "data-kind") == "bottom", pgV.inner_text("#v2PaneMenu") if pgV.locator("#v2PaneMenu").count() else None)
pgV.click("#v2PaneMenu [data-kind=right]"); pgV.wait_for_timeout(400)
check("ui v2: „Drehen, Scharnier rechts“ for pane 2: saved like the old field „Flügel 2“, the picture says „dreht“",
      op_v2().get("paneHinges") == ["bottom", "right"] and "dreht" in pgV.inner_text("#v2Window") and pgV.input_value("#winHinge2") == "right",
      [op_v2(), pgV.inner_text("#v2Window")])
pgV.click("#v2PaneCount [data-n='3']"); pgV.wait_for_timeout(400)
check("ui v2: three panes by a button", op_v2().get("panes") == 3 and pgV.locator("#v2Window [data-pane]").count() == 3, op_v2())
pgV.click("#v2OpenDir [data-dir=out]"); pgV.wait_for_timeout(400)
check("ui v2: „nach außen“", op_v2().get("openOutward") is True and "außen" in pgV.inner_text(".v2Sec[data-sec=panes] .sum"), op_v2())

pgV.click(".v2Sec[data-sec=kind] > .hd"); pgV.wait_for_timeout(200)
check("ui v2: the kinds of window as 7 pictures; this one has its own sizes now", pgV.locator("#v2Kinds .v2Tile").count() == 7
      and "eigene Maße" in pgV.inner_text(".v2Sec[data-sec=kind] .sum"), pgV.inner_text(".v2Sec[data-sec=kind] .sum"))
pgV.click("#v2Kinds [data-kind=windowFloor]"); pgV.wait_for_timeout(500)
o_v2 = op_v2()
check("ui v2: „Bodentief, unten fest“: size, sill and fixed glass at once, the extra panes go",
      (o_v2["width"], o_v2["height"], o_v2["sill"], o_v2.get("fixedBelow"), o_v2.get("style"), "panes" in o_v2) == (0.9, 2.2, 0, 1.1, "single", False)
      and pgV.locator("#v2Kinds [data-kind=windowFloor].on").count() == 1, o_v2)
srv_v2 = wait_v2(lambda: (lambda o: o if o and o.get("fixedBelow") == 1.1 else None)(srv_op_v2()))
check("ui v2: saved in the add-on", bool(srv_v2), srv_v2)

pgV.evaluate("window.__fp.select('room', 'v2_r')"); pgV.wait_for_selector("#v2RoomTabs", timeout=10000)
check("ui v2: a room has tabs Allgemein, Boden, Wände, Geräte; Allgemein shows the name",
      pgV.evaluate("[...document.querySelectorAll('#v2RoomTabs button')].map((b) => b.dataset.tab)") == ["general", "floor", "walls", "devices"]
      and pgV.locator("#roomName").is_visible() and not pgV.locator("#roomWalls").is_visible(), None)
pgV.click("#v2RoomTabs [data-tab=floor]"); pgV.wait_for_timeout(200)
check("ui v2: Boden: the floors as pictures under their groups, „Einfarbig“ chosen, the old list hidden; the height seen from the side",
      pgV.locator("#v2Floors .v2Tile").count() > 3 and pgV.locator("#v2Floors .v2Tile.on").get_attribute("data-cover") == ""
      and not pgV.locator("#roomCovering").is_visible() and pgV.locator("#v2Level svg").is_visible() and not pgV.locator("#roomName").is_visible(), None)
cover_v2 = pgV.evaluate("document.querySelectorAll('#v2Floors .v2Tile')[1].dataset.cover")
pgV.click(f"#v2Floors .v2Tile[data-cover={cover_v2}]"); pgV.wait_for_timeout(400)
room_v2 = lambda: next(r for r in pgV.evaluate("window.__fp.layout.floors[0].rooms") if r["id"] == "v2_r")
check("ui v2: a floor tapped: the room has it, the tab stays on Boden, the picture is marked",
      room_v2().get("covering") == cover_v2 and pgV.get_attribute("#v2RoomTabs button.on", "data-tab") == "floor"
      and pgV.locator(f"#v2Floors .v2Tile.on[data-cover={cover_v2}]").count() == 1, [room_v2(), cover_v2])
pgV.fill("#roomRaise", "-0.15"); pgV.press("#roomRaise", "Enter"); pgV.wait_for_timeout(300)
check("ui v2: the floor 15 cm lower: the side view says −15", room_v2().get("raise") == -0.15 and "−15" in pgV.inner_text("#v2Level"), [room_v2().get("raise"), pgV.inner_text("#v2Level")])

pgV.evaluate("window.__fp.select('opening', 'v2_o')"); pgV.wait_for_selector("#v2Head", timeout=10000)
check("ui v2: a section opened stays open for this device", pgV.locator(".v2Sec[data-sec=contact] .bd").is_visible(), None)
pgV.click("#uiSwitch [data-ui=classic]"); pgV.wait_for_timeout(400)
check("ui v2: „Klassisch“: the old panel again (title, the fields one under the other, the pane fields, no sections)",
      pgV.locator("#propsTitle").is_visible() and pgV.locator("#winHinge").is_visible() and pgV.locator(".v2Sec").count() == 0
      and pgV.locator("#propsDelete").is_visible() and pgV.evaluate("localStorage.getItem('fp.ui')") == "classic", None)
open_v2("")
pgV.click("#settingsBtn"); pgV.wait_for_timeout(400)
check("ui v2: ⚙ → Allgemein has „Oberfläche: Klassisch / Neu“ (classic now, also after a reload)",
      pgV.locator("#setUi").is_visible() and pgV.input_value("#setUi") == "classic" and "Oberfläche" in pgV.inner_text("#setUiRow"), None)
pgV.select_option("#setUi", "v2"); pgV.wait_for_timeout(300)
check("ui v2: … choosing „Neu“ there switches too", pgV.evaluate("document.body.classList.contains('uiV2')")
      and pgV.locator("#uiSwitch [data-ui=v2].active").count() == 1, None)
pgV.keyboard.press("Escape"); pgV.wait_for_timeout(200)
check("ui v2: no errors", not own_v2, own_v2)

pgV.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
put_layout_v2(saved_v2)
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_v2.get(k, d))
pgV.close()
