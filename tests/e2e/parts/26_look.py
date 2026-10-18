"""3.99.0: the look, second round: floor coverings per room (#427), anthracite window frames with lighter walls (#428), the glass look of the
floor cards and buttons (#429) and the labels over the rooms in 3D (#430, can be switched off).
"""
saved_lk = api_admin("api/layout")              # put back at the end
theme_lk, lang_lk, units_lk = api("api/settings")["theme"], api("api/settings")["language"], api("api/settings")["units"]
labels_lk, mode_lk = api("api/settings")["roomLabels"], api("api/settings")["labelMode"]
set_setting("roomLabels", True)                 # the default of a new install (base.py switches it to the devices for the older parts)
set_setting("labelMode", "important")           # the value labels of the sensors (they step aside for the room labels)
set_setting("theme", "dark")                    # base.py uses the hologram, which has its own floor: no patterns there
set_setting("language", "de")                   # the texts below are the German ones
set_setting("units", "metric")                  # ... and the temperature in °C
def extra_lk(d):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(d).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
extra_lk({
    "light.schild": {"state": "on", "attributes": {"friendly_name": "Schildlicht", "rgb_color": [255, 120, 40]}},
    "sensor.schild_temp": {"state": "22.4", "attributes": {"friendly_name": "Schildtemperatur", "unit_of_measurement": "°C", "device_class": "temperature"}},
    "binary_sensor.schild_praesenz": {"state": "on", "attributes": {"friendly_name": "Schildpräsenz", "device_class": "occupancy"}},
})
# two rooms of their own far from the test house: one with parquet, a light, a temperature and somebody there; one with one colour; a wall
# with a window and a door
lay = json.loads(json.dumps(saved_lk))
f0 = lay["floors"][0]
f0.setdefault("rooms", []).extend([
    {"id": "lk_room", "name": "Schilderraum", "color": "#8a7f70", "covering": "parquet", "points": [[40, 40], [44, 40], [44, 44], [40, 44]]},
    {"id": "lk_plain", "name": "Farbraum", "color": "#123456", "points": [[44, 40], [48, 40], [48, 44], [44, 44]]}]
    + [{"id": f"lk_t{i}", "name": f"Kachel {i}", "color": "#8a7f70", "points": [[60 + 3 * i, 60], [62 + 3 * i, 60], [62 + 3 * i, 62], [60 + 3 * i, 62]]} for i in range(6)])   # tiles enough to scroll
f0.setdefault("walls", []).append({"id": "lk_wall", "a": [40, 40], "b": [48, 40], "thickness": 0.2, "height": 2.6, "openings": [
    {"id": "lk_win", "type": "window", "style": "double", "width": 1.2, "height": 1.2, "sill": 0.9, "pos": 2},
    {"id": "lk_door", "type": "door", "style": "single", "width": 0.9, "height": 2.0, "sill": 0, "pos": 6}]})
f0.setdefault("devices", []).extend([
    {"id": "lk_light", "type": "light", "x": 42, "z": 42, "y": 2.5, "rot": 0, "scale": 1, "name": "Schildlicht", "entity": "light.schild"},
    {"id": "lk_temp", "type": "sensor", "x": 41, "z": 41, "y": 1.5, "rot": 0, "scale": 1, "name": "Schildtemperatur", "entity": "sensor.schild_temp"},
    {"id": "lk_pres", "type": "presence", "x": 43, "z": 43, "y": 0, "rot": 0, "scale": 1, "name": "Schildpräsenz", "entity": "binary_sensor.schild_praesenz"}])
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
pgL = b.new_page(viewport={"width": 1440, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_lk = []
pgL.on("console", lambda m: own_lk.append(m.text) if m.type == "error" else None)
pgL.on("pageerror", lambda e: own_lk.append("PAGEERROR " + str(e)))
pgL.goto(BASE + "?debug=1&mode=live"); pgL.wait_for_timeout(2200)
pgL.evaluate("window.__fp.switchFloor(0)"); pgL.wait_for_timeout(800)   # the floor with the new rooms (the page may open another one)
FLOOR = """(id) => { let m = null; window.__fp.scene.traverse((o) => { if (o.userData?.kind === 'room' && o.userData.id === id) m = o; });
  return m && { map: !!m.material.map, color: m.material.color.getHexString() }; }"""
NAME = """(n) => { let v = null; window.__fp.scene.traverse((o) => { if (o.isSprite && o.userData.text === n) v = o.visible; }); return v; }"""
PILLS = """() => { let n = 0; window.__fp.scene.traverse((o) => { if (o.isSprite && o.userData.pill && o.visible && o.parent?.visible) n++; }); return n; }"""   # value labels shown
BALL = "window.__fp.ballScreen('lk_light') !== null"   # the tap ball of the room's lamp shows

# --- floor coverings (#427)
check("floors (#427): a room with parquet has its pattern on the floor (white under it), a room without one keeps its colour",
      pgL.evaluate(FLOOR, "lk_room") == {"map": True, "color": "ffffff"} and pgL.evaluate(FLOOR, "lk_plain") == {"map": False, "color": "123456"},
      (pgL.evaluate(FLOOR, "lk_room"), pgL.evaluate(FLOOR, "lk_plain")))
pgL.click("#modeBar [data-vm=temp]"); pgL.wait_for_timeout(600)
check("floors: the view 'Temp.' colours the floor and hides the pattern", pgL.evaluate(FLOOR, "lk_room")["map"] is False and pgL.evaluate(FLOOR, "lk_room")["color"] != "ffffff",
      pgL.evaluate(FLOOR, "lk_room"))
pgL.click("#modeBar [data-vm=normal]"); pgL.wait_for_timeout(600)
check("floors: back to 'Normal' the pattern is back", pgL.evaluate(FLOOR, "lk_room")["map"] is True, pgL.evaluate(FLOOR, "lk_room"))

# --- the labels over the rooms (#430)
pill = pgL.locator("#roomLabels [data-room=lk_room]")
txt = pill.inner_text() if pill.count() else ""
check("room labels (#430): in live mode a label over the room with its name, temperature, the light on and the green dot",
      pgL.is_visible("#roomLabels") and "Schilderraum" in txt and "22,4°" in txt and "💡 1" in txt and pill.locator(".rlDot").count() == 1, txt)
check("room labels: placed over the picture (moved with the camera) and lit in the light's colour",
      "translate(" in (pill.get_attribute("style") or "") and "lit" in (pill.get_attribute("class") or "") and "#ff7828" in (pill.get_attribute("style") or ""),
      pill.get_attribute("style"))
check("room labels: the name on the floor steps aside meanwhile", pgL.evaluate(NAME, "Schilderraum") is False, pgL.evaluate(NAME, "Schilderraum"))
pgL.evaluate("window.__fp.camAt(33, window.__fp.elev(window.__fp.floorIdx()) + 1.5, 42, 48, 42)"); pgL.wait_for_timeout(900)   # just over the labels (1.2 m), along the two rooms: they would lie on each other
apart = pgL.evaluate("""() => { const r = (id) => document.querySelector(`#roomLabels [data-room=${id}]`)?.getBoundingClientRect();
  const a = r('lk_room'), b = r('lk_plain'); if (!a || !b || !a.width || !b.width) return null;
  const stem = (id) => parseFloat(document.querySelector(`#roomLabels [data-room=${id}]`).style.getPropertyValue('--stem')) || 0;
  return { overlap: a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom, near: stem('lk_room'), far: stem('lk_plain') }; }""")
check("room labels (3.99.1): seen low from the side, labels that would lie on each other are pushed apart; the farther one goes up on a longer line",
      apart and not apart["overlap"] and apart["far"] > apart["near"], apart)
check("room labels: either the labels or the devices: no tap balls and no value labels on the floor meanwhile",
      not pgL.evaluate(BALL) and pgL.evaluate(PILLS) == 0, (pgL.evaluate(BALL), pgL.evaluate(PILLS)))
APART = "window.__fp.camAt(33, window.__fp.elev(window.__fp.floorIdx()) + 1.5, 42, 48, 42)"
pgL.evaluate("window.__fp.camAt(52, window.__fp.elev(window.__fp.floorIdx()) + 1.5, 61, 80, 61)"); pgL.wait_for_timeout(900)   # along the row of six small rooms: their labels would lie on one spot
ROW = """() => [0, 1, 2, 3, 4, 5].map((i) => { const e = document.querySelector(`#roomLabels [data-room=lk_t${i}]`);
  return e && e.style.display !== 'none' ? { mini: e.classList.contains('mini'), stem: parseFloat(e.style.getPropertyValue('--stem')) || 0, w: e.offsetWidth } : null; })"""
row = pgL.evaluate(ROW)
shown = [r for r in row if r]
check("room labels (#436): seen along a row of rooms no tower of labels on long lines: one row up at most, the others small dots over their rooms",
      len(shown) >= 4 and any(r["mini"] for r in shown) and any(not r["mini"] for r in shown) and all(r["stem"] <= 50 for r in shown)
      and all(r["w"] < 20 for r in shown if r["mini"]), row)
dot = next((i for i, r in enumerate(row) if r and r["mini"]), None)
if dot is not None:
    pgL.locator(f"#roomLabels [data-room=lk_t{dot}]").dispatch_event("click"); pgL.wait_for_timeout(900)
check("room labels: a tap on such a dot opens its room, like a label", dot is not None and pgL.evaluate("window.__fp.focusedRoom()") == f"lk_t{dot}",
      (dot, pgL.evaluate("window.__fp.focusedRoom()")))
if dot is not None:
    pgL.locator(f"#roomTiles [data-room=lk_t{dot}]").dispatch_event("click"); pgL.wait_for_timeout(900)   # back out of the room
pgL.evaluate(APART); pgL.wait_for_timeout(900)
view_menu(pgL)
check("room labels: the View menu says what is shown: 'Im Bild: Raum-Schilder'", pgL.inner_text("#roomLabelsToggle") == "Im Bild: Raum-Schilder", pgL.inner_text("#roomLabelsToggle"))
pgL.click("#roomLabelsToggle"); pgL.wait_for_timeout(600)
check("room labels: a tap switches to 'Im Bild: Geräte' (and is saved): no labels, the devices' balls, value labels and the names on the floor are back",
      pgL.inner_text("#roomLabelsToggle") == "Im Bild: Geräte" and not pgL.is_visible("#roomLabels") and api("api/settings")["roomLabels"] is False
      and pgL.evaluate(BALL) and pgL.evaluate(PILLS) > 0 and pgL.evaluate(NAME, "Schilderraum") is True,
      (pgL.inner_text("#roomLabelsToggle"), pgL.evaluate(BALL), pgL.evaluate(PILLS)))
pgL.click("#roomLabelsToggle"); pgL.wait_for_timeout(600)
check("room labels: and back to the room labels", pgL.is_visible("#roomLabels") and api("api/settings")["roomLabels"] is True and not pgL.evaluate(BALL))
if pgL.is_visible("#viewMenu"): pgL.click("#viewMenuBtn"); pgL.wait_for_timeout(200)   # close the View menu again (it lies over the tiles)
pgL.locator("#roomLabels [data-room=lk_room]").click(); pgL.wait_for_timeout(1000)
check("room labels: a tap on a label opens the room; then its devices show (ball and value labels), the labels step aside",
      pgL.evaluate("window.__fp.focusedRoom()") == "lk_room" and not pgL.is_visible("#roomLabels") and pgL.evaluate(BALL) and pgL.evaluate(PILLS) > 0,
      (pgL.evaluate("window.__fp.focusedRoom()"), pgL.evaluate(BALL), pgL.evaluate(PILLS)))
pgL.locator("#roomTiles [data-room=lk_room]").click(); pgL.wait_for_timeout(800)
check("room labels: back again when the room is left, the devices off again", pgL.evaluate("window.__fp.focusedRoom()") is None and pgL.is_visible("#roomLabels") and not pgL.evaluate(BALL))

# --- the glass look (#429)
glass = pgL.evaluate("""() => ['#modeBar .pill:not(.active)', '#floorRail button', '#findBtn'].map((s) => { const e = document.querySelector(s);
  return e ? getComputedStyle(e).backdropFilter : 'missing'; })""")
check("glass (#429): the view buttons, the floor cards and the search button are frosted glass", all("blur" in g for g in glass), glass)

# --- edit mode: no labels; the floor of a room is chosen in its properties (#427)
pgL.click("#modeSwitch [data-mode=edit]"); pgL.wait_for_timeout(700)
check("room labels: none in edit mode, the names lie on the floor again", not pgL.is_visible("#roomLabels") and pgL.evaluate(NAME, "Schilderraum") is True)
pgL.evaluate("window.__fp.select('room', 'lk_plain')"); pgL.wait_for_timeout(400)
check("floors: the room's properties have 'Boden' with 'Einfarbig' chosen, and its colour",
      pgL.is_visible("#roomCovering") and pgL.eval_on_selector("#roomCovering", "e => e.value") == "" and pgL.is_visible("#roomColor"))
pgL.select_option("#roomCovering", "concrete"); pgL.wait_for_timeout(2500)
room = next(r for r in api_admin("api/layout")["floors"][0]["rooms"] if r["id"] == "lk_plain")
check("floors: choosing 'Beton' puts the pattern on the floor and saves it; the colour field steps aside",
      room.get("covering") == "concrete" and pgL.evaluate(FLOOR, "lk_plain")["map"] is True and pgL.locator("#roomColor").count() == 0, room)
pgL.click("#view2d"); pgL.wait_for_timeout(600)
plan = pgL.evaluate("document.querySelector('#plan2d svg').innerHTML")
check("floors: the 2D plan shows a covered room in its colour (concrete grey)", 'fill="#999995"' in plan)
pgL.click("#view3d"); pgL.wait_for_timeout(500)
pgL.evaluate("window.__fp.select('room', 'lk_plain')"); pgL.wait_for_timeout(300)
pgL.select_option("#roomCovering", ""); pgL.wait_for_timeout(2500)
room = next(r for r in api_admin("api/layout")["floors"][0]["rooms"] if r["id"] == "lk_plain")
check("floors: 'Einfarbig' takes the covering away again", "covering" not in room and pgL.evaluate(FLOOR, "lk_plain") == {"map": False, "color": "123456"}, room)

# --- window frames (#428)
FRAME = """(id) => { let g = null; window.__fp.scene.traverse((o) => { if (o.userData?.kind === 'opening' && o.userData.id === id && o.userData.tint) g = o; });   // not its hit box
  const f = g?.userData.tint?.find((x) => x.k === 'frame'); return f ? f.base.toString(16).padStart(6, '0') : null; }"""
WALL = """(id) => { let c = null; window.__fp.scene.traverse((o) => { if (!c && o.userData?.kind === 'wall' && o.userData.id === id)
  c = o.children.find((m) => m.isMesh && m.material?.color)?.material.color.getHexString() || null; }); return c; }"""   # the wall pieces (the doors and windows are groups)
check("window frames: white as always", pgL.evaluate(FRAME, "lk_win") == "f4f4f4" and pgL.evaluate(WALL, "lk_wall") == "d9d4cc",
      (pgL.evaluate(FRAME, "lk_win"), pgL.evaluate(WALL, "lk_wall")))
pgL.click("#settingsBtn"); pgL.wait_for_timeout(300)
pgL.select_option("#setWindowFrames", "anthracite"); pgL.wait_for_timeout(1200)
pgL.keyboard.press("Escape"); pgL.wait_for_timeout(300)
check("window frames (#428): 'Anthrazit' in the settings: dark window frames, the walls lighter, the door frame stays white; saved",
      pgL.evaluate(FRAME, "lk_win") == "2e3338" and pgL.evaluate(FRAME, "lk_door") == "f4f4f4" and pgL.evaluate(WALL, "lk_wall") == "f4f0ea"
      and api("api/settings")["windowFrames"] == "anthracite", (pgL.evaluate(FRAME, "lk_win"), pgL.evaluate(FRAME, "lk_door"), pgL.evaluate(WALL, "lk_wall")))
set_setting("windowFrames", "white")

# --- more room tiles than fit (3.99.2): arrows at the ends, the mouse wheel scrolls; the whole house on a smaller screen
pgT = b.new_page(viewport={"width": 1000, "height": 800}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgT.goto(BASE + "?debug=1&mode=live"); pgT.wait_for_timeout(2000)
pgT.click("#floorRail .railHouse"); pgT.wait_for_timeout(1500)
strip = lambda: pgT.evaluate("(() => { const b = document.querySelector('#roomTiles'); return { n: b.children.length, over: b.scrollWidth - b.clientWidth, x: b.scrollLeft }; })()")
st = strip()
check("room tiles (3.99.2): more tiles than fit: an arrow on the right (more to see), none on the left, the cut side fades out",
      st["n"] >= 8 and st["over"] > 50 and pgT.is_visible("#tilesRight") and not pgT.is_visible("#tilesLeft") and "moreR" in (pgT.get_attribute("#roomTiles", "class") or ""), st)
pgT.click("#tilesRight"); pgT.wait_for_timeout(900)
check("room tiles: the arrow scrolls the strip, now there is an arrow on the left too", strip()["x"] > 100 and pgT.is_visible("#tilesLeft"), strip())
at = pgT.evaluate("""(() => { const s = document.querySelector('#roomTiles').getBoundingClientRect();   // the middle of a tile that shows
  const r = [...document.querySelectorAll('#roomTiles .rtTile')].map((e) => e.getBoundingClientRect()).find((r) => r.left >= s.left && r.right <= s.right);
  return [r.left + r.width / 2, r.top + r.height / 2]; })()""")
pgT.mouse.move(*at); pgT.mouse.wheel(0, 4000); pgT.wait_for_timeout(600)
check("room tiles: the mouse wheel scrolls it to the end: no arrow on the right then", strip()["x"] >= strip()["over"] - 2 and not pgT.is_visible("#tilesRight") and pgT.is_visible("#tilesLeft"), strip())
pgT.close()

# --- phones: the labels too (#444), smaller
pgP2 = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, extra_http_headers={"X-Remote-User-Name": "admin"})
pgP2.goto(BASE + "?debug=1&mode=live"); pgP2.wait_for_timeout(2000)
pgP2.evaluate("window.__fp.switchFloor(0)"); pgP2.wait_for_timeout(800)
ph = pgP2.evaluate("""() => { const e = document.querySelector('#roomLabels [data-room=lk_room]'); return e && { size: getComputedStyle(e).fontSize, mini: e.classList.contains('mini') }; }""")
check("room labels (#444): on a phone too, smaller; the name on the floor steps aside",
      pgP2.is_visible("#roomLabels") and ph and ph["size"] == "11px" and pgP2.evaluate(NAME, "Schilderraum") is False, ph)
pgP2.locator("#roomLabels [data-room=lk_room]").dispatch_event("click"); pgP2.wait_for_timeout(1000)
check("room labels: a tap on a phone opens the room (its card at the bottom), the labels step aside",
      pgP2.evaluate("window.__fp.focusedRoom()") == "lk_room" and pgP2.is_visible("#roomPanel") and not pgP2.is_visible("#roomLabels"), pgP2.evaluate("window.__fp.focusedRoom()"))
pgP2.close()
check("3.99 checks: no errors in the browser", not own_lk, own_lk[:3])
pgL.close()
extra_lk({})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_lk).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("theme", theme_lk)
set_setting("language", lang_lk)
set_setting("units", units_lk)
set_setting("roomLabels", labels_lk)
set_setting("labelMode", mode_lk)
