"""4.0.0: finishes of floors and walls (#448): many more floors with colour, size and angle, the walls of a room (woodchip, plaster,
wallpaper, tiles ...), below a height something else, the same for every room, one side of a wall on its own (an accent wall) and the
facade outside (a setting); none in the hologram theme.
"""
saved_fn = api_admin("api/layout")              # put back at the end
theme_fn, lang_fn, units_fn = api("api/settings")["theme"], api("api/settings")["language"], api("api/settings")["units"]
set_setting("theme", "dark")                    # base.py uses the hologram, which has no finishes
set_setting("language", "de")
set_setting("units", "metric")
# two rooms of their own far from the test house: a wall between them (with a window) and the outer walls round them
lay = json.loads(json.dumps(saved_fn))
f0 = lay["floors"][0]
f0.setdefault("rooms", []).extend([
    {"id": "fn_a", "name": "Musterbad", "color": "#8a7f70", "points": [[70, 70], [74, 70], [74, 73], [70, 73]]},
    {"id": "fn_b", "name": "Musterflur", "color": "#8a7f70", "points": [[74, 70], [77, 70], [77, 73], [74, 73]]}])
f0.setdefault("walls", []).extend([
    {"id": "fn_w1", "a": [74, 70], "b": [74, 73], "thickness": 0.2, "height": 2.6, "openings": [
        {"id": "fn_win", "type": "window", "style": "single", "width": 1.0, "height": 1.0, "sill": 1.0, "pos": 1.5}]},
    {"id": "fn_w2", "a": [70, 70], "b": [77, 70], "thickness": 0.3, "height": 2.6, "openings": []}]
    + [{"id": f"fn_w{i + 3}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": []} for i, (a, c) in enumerate([([77, 70], [77, 73]), ([77, 73], [70, 73]), ([70, 73], [70, 70])])])
f0.setdefault("devices", []).append({"id": "fn_temp", "type": "sensor", "x": 71, "z": 71, "y": 1.5, "rot": 0, "scale": 1, "name": "Mustertemperatur", "entity": "sensor.temp"})   # a reading for Temp. (#467)
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
pgF = b.new_page(viewport={"width": 1440, "height": 1100}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_fn = []
pgF.on("console", lambda m: own_fn.append(m.text) if m.type == "error" else None)
pgF.on("pageerror", lambda e: own_fn.append("PAGEERROR " + str(e)))
pgF.goto(BASE + "?debug=1"); pgF.wait_for_timeout(2200)
pgF.evaluate("window.__fp.switchFloor(0)"); pgF.wait_for_timeout(800)
if pgF.is_visible("#modeSwitch [data-mode=edit]"): pgF.click("#modeSwitch [data-mode=edit]"); pgF.wait_for_timeout(600)
SKINS = """(id) => { const out = []; window.__fp.scene.traverse((o) => { if (o.userData?.skin && o.parent?.userData?.kind === 'wall' && o.parent.userData.id === id) {
  const p = o.geometry.attributes.position, zs = new Set(), ys = []; for (let i = 0; i < p.count; i++) { zs.add(Math.sign(p.getZ(i))); ys.push(p.getY(i)); }
  out.push({ key: o.userData.skin, sides: [...zs].sort(), map: !!o.material.map, bump: !!o.material.bumpMap, y0: +Math.min(...ys).toFixed(3), y1: +Math.max(...ys).toFixed(3) }); } });
  return out.sort((a, b) => (a.key < b.key ? -1 : 1)); }"""   # the finishes on wall id: one mesh per finish, with the sides it is on (+1 / -1)
FLOOR = """(id) => { let m = null; window.__fp.scene.traverse((o) => { if (o.userData?.kind === 'room' && o.userData.id === id) m = o; });
  return m && { map: !!m.material.map, bump: !!m.material.bumpMap, uv: [...m.geometry.attributes.uv.array.slice(0, 4)].map((v) => +v.toFixed(3)) }; }"""
room = lambda rid: next(r for r in api_admin("api/layout")["floors"][0]["rooms"] if r["id"] == rid)
wall = lambda wid: next(w for w in api_admin("api/layout")["floors"][0]["walls"] if w["id"] == wid)
def sel_room(rid):
    pgF.evaluate(f"window.__fp.select('room', '{rid}')"); pgF.wait_for_timeout(400)

check("finishes (#448): walls without a finish have no skin", pgF.evaluate(SKINS, "fn_w1") == [] and pgF.evaluate(SKINS, "fn_w2") == [],
      (pgF.evaluate(SKINS, "fn_w1"), pgF.evaluate(SKINS, "fn_w2")))

# --- the floor: pattern, colour, size, angle
sel_room("fn_a")
groups = pgF.evaluate("[...document.querySelectorAll('#roomCovering optgroup')].map((g) => [g.label, g.children.length])")
check("floors: 'Boden' lists the patterns under Holz, Fliesen, Stein, Sonstiges, many of them",
      [g[0] for g in groups] == ["Holz", "Fliesen", "Stein", "Sonstiges"] and sum(g[1] for g in groups) >= 25, groups)
pgF.select_option("#roomCovering", "herringbone"); pgF.wait_for_timeout(2500)
uv0 = pgF.evaluate(FLOOR, "fn_a")
check("floors: 'Fischgrät' lies on the floor with its relief and is saved; colour, size and angle fields show",
      room("fn_a").get("covering") == "herringbone" and uv0["map"] and uv0["bump"] and pgF.is_visible("#floorColor") and pgF.is_visible("#floorSize")
      and pgF.is_visible("#floorAngle") and pgF.locator("#roomColor").count() == 0, (room("fn_a"), uv0))
pgF.locator("#floorSwatches [data-color='#6b4a33']").click(); pgF.wait_for_timeout(2500)
check("floors: a tap on a colour of the row colours it (walnut), saved as its look", room("fn_a").get("floorLook", {}).get("color") == "#6b4a33", room("fn_a"))
pgF.fill("#floorSize", "12"); pgF.locator("#floorSize").dispatch_event("change"); pgF.wait_for_timeout(2500)
pgF.locator("#floorAngles [data-angle='45']").click(); pgF.wait_for_timeout(2500)
lk = room("fn_a").get("floorLook", {})
uv1 = pgF.evaluate(FLOOR, "fn_a")
check("floors: size 12 cm and turned by 45°: saved, the pattern on the floor turned and scaled (other texture coordinates)",
      lk.get("size") == 0.12 and lk.get("angle") == 45 and uv1["uv"] != uv0["uv"], (lk, uv0["uv"], uv1["uv"]))
pgF.click("#floorReset"); pgF.wait_for_timeout(2500)
check("floors: 'Wie vorgegeben' takes colour, size and angle back", "floorLook" not in room("fn_a") and room("fn_a").get("covering") == "herringbone", room("fn_a"))

# --- the walls of a room
pgF.select_option("#roomWalls", "woodchip"); pgF.wait_for_timeout(2500)
sk = pgF.evaluate(SKINS, "fn_w1")
check("walls: 'Raufaser' for the room: saved; the wall to the next room has it on this room's side only, on its solid parts (not in the window)",
      room("fn_a").get("wallLook") == {"pattern": "woodchip"} and sk and all(s["key"] == "woodchip" and s["sides"] == [1] and s["map"] and s["bump"] for s in sk)
      and pgF.evaluate(SKINS, "fn_w2") and all(s["sides"] == [1] for s in pgF.evaluate(SKINS, "fn_w2")), (room("fn_a"), sk))
pgF.check("#roomBelow"); pgF.wait_for_timeout(2500)
check("walls: 'Unten anders' puts tiles below 1.20 m, woodchip above", room("fn_a").get("wallBelow") == {"pattern": "wTiles", "height": 1.2}
      and {s["key"] for s in pgF.evaluate(SKINS, "fn_w2")} == {"woodchip", "wTiles"}
      and max(s["y1"] for s in pgF.evaluate(SKINS, "fn_w2") if s["key"] == "wTiles") == 1.2, (room("fn_a"), pgF.evaluate(SKINS, "fn_w2")))
pgF.fill("#roomBelowHeight", "1.5"); pgF.locator("#roomBelowHeight").dispatch_event("change"); pgF.wait_for_timeout(2500)
pgF.select_option("#roomBelowPattern", "wMetro"); pgF.wait_for_timeout(2500)
check("walls: the lower part: metro tiles up to 1.50 m", room("fn_a").get("wallBelow") == {"pattern": "wMetro", "height": 1.5}
      and max(s["y1"] for s in pgF.evaluate(SKINS, "fn_w2") if s["key"] == "wMetro") == 1.5, (room("fn_a"), pgF.evaluate(SKINS, "fn_w2")))
pgF.click("#roomWallsAll"); pgF.wait_for_timeout(2500)
check("walls: 'für alle Räume der Etage' gives the next room the same walls; the wall between has them on both sides",
      room("fn_b").get("wallLook") == {"pattern": "woodchip"} and room("fn_b").get("wallBelow") == {"pattern": "wMetro", "height": 1.5}
      and all(s["sides"] == [-1, 1] for s in pgF.evaluate(SKINS, "fn_w1")), (room("fn_b"), pgF.evaluate(SKINS, "fn_w1")))

# --- one side of one wall (an accent wall)
pgF.evaluate("window.__fp.select('wall', 'fn_w1')"); pgF.wait_for_timeout(400)
labels = pgF.evaluate("[...document.querySelectorAll('#propsBody .prop label')].map((l) => l.textContent).filter((x) => x.startsWith('Zu '))")
check("accent wall: the wall shows its two sides by their rooms", sorted(labels) == ["Zu Musterbad", "Zu Musterflur"], labels)
side_b = "faceLeft" if pgF.evaluate("document.querySelector('#faceLeft').closest('.prop').querySelector('label').textContent") == "Zu Musterflur" else "faceRight"
pgF.select_option(f"#{side_b}", "wpDamask"); pgF.wait_for_timeout(2500)
sk = pgF.evaluate(SKINS, "fn_w1")
check("accent wall: 'Tapete Ornament' on the side of the hall: saved on the wall, over the whole height there; the bathroom side keeps its tiles",
      wall("fn_w1").get("faces") == {side_b[4:].lower(): {"pattern": "wpDamask"}} and {s["key"] for s in sk if -1 in s["sides"]} == {"wpDamask"}
      and [(s["y0"], s["y1"]) for s in sk if s["key"] == "wpDamask"] == [(0, 2.6)] and {s["key"] for s in sk if 1 in s["sides"]} == {"woodchip", "wMetro"}, (wall("fn_w1"), sk))
pgF.select_option(f"#{side_b}", ""); pgF.wait_for_timeout(2500)
check("accent wall: 'Wie der Raum' gives it back", "faces" not in wall("fn_w1"), wall("fn_w1"))

# --- the 2D plan (#467): a room has the colour of its floor, with Temp. the colour of its temperature; never a number in fill (black)
import re
FILLS = """() => [...document.querySelectorAll('#plan2d polygon[stroke-dasharray]')].filter((p) => ['0.26', '0.45'].includes(p.getAttribute('fill-opacity')))
  .map((p) => [p.getAttribute('fill'), p.getAttribute('fill-opacity')])"""   # the room polygons
pgF.click("#view2d"); pgF.wait_for_timeout(800)
f_norm = pgF.evaluate(FILLS)
pgF.click('#modeBar [data-vm="temp"]'); pgF.wait_for_timeout(800)
f_temp = pgF.evaluate(FILLS)
hexes = lambda fs: all(re.fullmatch(r"#[0-9a-fA-F]{6}", f or "") for f, _ in fs)
check("2D plan: the rooms have the colour of their floor; with Temp. a room with a reading has its colour as #rrggbb (not black, #467)",
      f_norm and hexes(f_norm) and all(o == "0.26" for _, o in f_norm) and hexes(f_temp) and any(o == "0.45" for _, o in f_temp)
      and "#000000" not in [f for f, o in f_temp if o == "0.45"], (f_norm[:4], f_temp[:4]))
pgF.click('#modeBar [data-vm="normal"]'); pgF.click("#view3d"); pgF.wait_for_timeout(800)

# --- the facade (a setting)
pgF.click("#settingsBtn"); open_setting(pgF, "#setFacade"); pgF.wait_for_timeout(300)
pgF.select_option("#setFacade", "brick"); pgF.wait_for_timeout(1500)
pgF.keyboard.press("Escape"); pgF.wait_for_timeout(1200)
out = [s for s in pgF.evaluate(SKINS, "fn_w2") if -1 in s["sides"]]
check("facade: 'Klinker rot' in the settings: saved; the outer wall has it outside (the wall between the rooms is inside: none)",
      api("api/settings")["facade"] == "brick" and out and all(s["key"] == "brick" for s in out)
      and all(s["key"] != "brick" for s in pgF.evaluate(SKINS, "fn_w1")), (api("api/settings")["facade"], out))
set_setting("facade", "")
set_setting("theme", "holo"); pgF.reload(); pgF.wait_for_timeout(2200)
pgF.evaluate("window.__fp.switchFloor(0)"); pgF.wait_for_timeout(800)
check("finishes: none in the hologram theme (its own see-through walls and floors)",
      pgF.evaluate(SKINS, "fn_w2") == [] and pgF.evaluate(FLOOR, "fn_a")["map"] is False, (pgF.evaluate(SKINS, "fn_w2"), pgF.evaluate(FLOOR, "fn_a")))
check("4.0 checks: no errors in the browser", not own_fn, own_fn[:3])
pgF.close()
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_fn).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("theme", theme_fn)
set_setting("language", lang_fn)
set_setting("units", units_fn)
