"""5.1.0: locking rooms and the whole floor plan, and the new roof editor (the owner's choice of 2026-11-09, docs/ideen-5.1/).
Locks: 🔒 at a room (with „Was bleibt fest?“), the shared wall stays in the 2D plan, the arrow keys and Delete refuse, „🔒 Grundriss fertig“
with the pill in the top bar, „🔒 Gesperrte zeigen“ in „Ansicht“, the row in the classic panel, the stripes of a room shown on its own. Roof: a click on the roof opens the
editor (shape as pictures, the side view with a point to drag and numbers, the map from above with a dormer to drag, „＋ Gaube“,
templates incl. the cross and the L roof, „⭐ Mein Dach merken“ into the settings). Its own little house, the layout is put back at the end.
"""
saved_rl = api_admin("api/layout")              # put back at the end
st_rl = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_rl(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
W_rl = lambda i, a, b, op=None: {"id": i, "a": a, "b": b, "thickness": 0.24, "height": 2.6, "openings": op or []}
lay_rl = {"floors": [
    {"id": "rlEG", "name": "EG", "kind": "floor", "devices": [{"id": "rlLamp", "type": "light", "x": 3, "z": 2, "name": "Lampe"}], "blocks": [], "stairs": [],
     "rooms": [{"id": "rlWz", "name": "Wohnzimmer", "color": "#d8c3a5", "points": [[0, 0], [6, 0], [6, 4], [0, 4]]},
               {"id": "rlK", "name": "Küche", "color": "#a9c4d8", "points": [[6, 0], [10, 0], [10, 4], [6, 4]]}],
     "walls": [W_rl("rlTop", [0, 0], [10, 0], [{"id": "rlWin", "type": "window", "style": "double", "pos": 2, "width": 1.2, "height": 1.2, "sill": 0.9}]),
               W_rl("rlMid", [6, 0], [6, 4]), W_rl("rlLeft", [0, 0], [0, 4]), W_rl("rlRight", [10, 0], [10, 4]),
               W_rl("rlBot1", [0, 4], [6, 4]), W_rl("rlBot2", [6, 4], [10, 4])]},
    {"id": "rlDach", "name": "Dach", "kind": "roof", "walls": [], "rooms": [], "blocks": [], "stairs": [],
     "devices": [{"id": "rlPv", "type": "solarpanel", "x": 8, "z": 3, "y": 0, "rot": 0, "cols": 2, "rows": 1, "name": "PV Test"}],
     "roof": {"type": "gable", "pitch": 35, "overhang": 0.5, "ridge": "x", "dormers": [{"id": "rlD1", "side": 0, "pos": 0.3, "w": 1.6, "type": "flat", "eave": 0.8}],
              "skylights": [{"id": "rlS1", "side": 1, "pos": 0.5, "w": 0.78, "h": 1.18}]}}]}
put_layout_rl(lay_rl)
own_rl = []
pgL = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgL.on("console", lambda m: own_rl.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgL.on("pageerror", lambda e: own_rl.append("PAGEERROR " + str(e)))
answer_rl = {"prompt": "Testdach"}
pgL.on("dialog", lambda d: d.accept(answer_rl["prompt"]) if d.type == "prompt" else d.accept())
pgL.goto(BASE + "?debug=1&mode=edit&ui=2"); pgL.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgL.wait_for_timeout(800)
pgL.evaluate("window.__fp.switchFloor(0)"); pgL.wait_for_timeout(400)
L_rl = lambda js: pgL.evaluate(f"(() => {{ const L = window.__fp.layout, f0 = L.floors[0], r = L.floors[1].roof; return {js}; }})()")
walls_rl = lambda: L_rl("JSON.stringify(f0.walls.map((w) => [w.a, w.b]))")
status_rl = lambda: pgL.inner_text("#status")

# --- 🔒 at a room: locked at once, „Was bleibt fest?“
pgL.click("#v2Tree .n.room[data-room=rlWz]"); pgL.wait_for_timeout(500)
pgL.click("#v2Lock"); pgL.wait_for_selector("#lockPop", timeout=5000)
check("room lock: 🔒 in the head locks the room at once and opens „Was bleibt fest?“ (walls fixed, windows and doors on, devices off)",
      L_rl("f0.rooms[0].locked") is True and pgL.locator("#lockPop [data-key=walls]").is_disabled()
      and pgL.locator("#lockPop [data-key=openings].on").count() == 1 and pgL.locator("#lockPop [data-key=devices].on").count() == 0, L_rl("f0.rooms[0]"))
pgL.click("#lockPop [data-key=devices]"); pgL.wait_for_timeout(300)
check("room lock: „Geräte im Raum“ is kept with the room", L_rl("JSON.stringify(f0.rooms[0].lockOpts)") == '{"devices":true}', L_rl("f0.rooms[0].lockOpts"))
pgL.click("#lockPop .v2Btn.pri"); pgL.wait_for_timeout(300)
check("room lock: the head says „Gesperrt“", pgL.locator("#v2Head .v2Chip.lock").count() >= 1 and pgL.locator("#v2Lock.on").count() == 1, None)

# --- the 2D plan: the shared wall stays, the kitchen's far corner may move
pgL.click("#view2d"); pgL.wait_for_timeout(1200)
w0 = walls_rl()
x, y = pgL.evaluate("window.__fp.plan().toClient(6, 2.5)")
pgL.mouse.move(x, y); pgL.mouse.down(); pgL.mouse.move(x + 25, y, steps=4); pgL.mouse.move(x + 60, y, steps=4); pgL.mouse.up(); pgL.wait_for_timeout(500)
check("room lock: the wall shared with the kitchen cannot be dragged (until 5.0 it pulled the locked room's corners along), the note says why",
      walls_rl() == w0 and "Wohnzimmer" in status_rl(), [status_rl()])
check("room lock: the plan shows 🔒 before the name", pgL.locator("#plan2d svg text[data-locked]").count() == 1, None)
pgL.evaluate("window.__fp.select('wall', 'rlLeft')"); pgL.wait_for_timeout(300)
pgL.keyboard.press("ArrowLeft"); pgL.wait_for_timeout(300)
check("room lock: the arrow keys do not move a wall of the locked room", walls_rl() == w0, None)
pgL.evaluate("window.__fp.select('room', 'rlWz')"); pgL.wait_for_timeout(300)
pgL.keyboard.press("Delete"); pgL.wait_for_timeout(300)
check("room lock: Delete leaves the locked room", L_rl("f0.rooms.length") == 2, None)
pgL.evaluate("window.__fp.select('room', 'rlK')"); pgL.wait_for_timeout(400)
x, y = pgL.evaluate("window.__fp.plan().toClient(10, 4)")
pgL.mouse.move(x, y); pgL.mouse.down(); pgL.mouse.move(x + 15, y + 5, steps=3); pgL.mouse.move(x + 30, y + 10, steps=3); pgL.mouse.up(); pgL.wait_for_timeout(500)
check("room lock: the kitchen's own corner (not on the living room) still moves", L_rl("f0.rooms[1].points[2][0]") > 10.2, L_rl("JSON.stringify(f0.rooms[1].points)"))
pgL.keyboard.press("Control+z"); pgL.wait_for_timeout(400)

# --- „🔒 Grundriss fertig“
pgL.evaluate("window.__fp.select(null, null)"); pgL.wait_for_timeout(500)
pgL.click("#planLockSwitch"); pgL.wait_for_timeout(500)
pgL.wait_for_function("!/Speicher|Saving/.test(document.querySelector('#status').textContent)", timeout=10000); pgL.wait_for_timeout(1200)
check("plan lock: the switch locks the plan, the top bar says „🔒 Grundriss gesperrt“", L_rl("JSON.stringify(L.planLock)") == '{"on":true}' and pgL.locator("#planLockPill").is_visible(), L_rl("L.planLock"))
w1 = walls_rl()
pgL.evaluate("window.__fp.select('wall', 'rlRight')"); pgL.wait_for_timeout(300)
x, y = pgL.evaluate("window.__fp.plan().toClient(10, 2)")
pgL.mouse.move(x, y); pgL.mouse.down(); pgL.mouse.move(x + 20, y, steps=3); pgL.mouse.move(x + 40, y, steps=3); pgL.mouse.up(); pgL.wait_for_timeout(500)
check("plan lock: now no wall moves, the note names the plan", walls_rl() == w1 and "Grundriss" in status_rl(), [status_rl()])
pgL.evaluate("window.__fp.select(null, null)"); pgL.wait_for_timeout(300)
pgL.click("#planLockPill"); pgL.wait_for_timeout(500)
check("plan lock: the pill unlocks (after asking)", L_rl("L.planLock") is None and not pgL.locator("#planLockPill").is_visible(), L_rl("L.planLock"))
pgL.click("#viewMenuBtn"); pgL.wait_for_timeout(200)
pgL.click("#lockHatchToggle"); pgL.wait_for_timeout(200)
check("„🔒 Gesperrte zeigen“ in „Ansicht“ hides the stripes (kept per device)", pgL.evaluate("localStorage.getItem('fp.lockHatch')") == "off"
      and pgL.locator("#lockHatchToggle.active").count() == 0, None)
pgL.click("#lockHatchToggle"); pgL.wait_for_timeout(200)
pgL.click("#viewMenuBtn"); pgL.wait_for_timeout(200)

# --- the classic panel: a row in the room
pgL.click("#uiSwitch [data-ui=classic]"); pgL.wait_for_timeout(400)
pgL.evaluate("window.__fp.select('room', 'rlK')"); pgL.wait_for_timeout(500)
pgL.check("#roomLock"); pgL.wait_for_timeout(400)
check("room lock (classic): „🔒 Raum sperren“ in the room, with what it keeps", L_rl("f0.rooms[1].locked") is True and pgL.locator("#roomLockRow .lockOpt").count() == 3, None)
pgL.uncheck("#roomLock"); pgL.wait_for_timeout(300)
pgL.click("#uiSwitch [data-ui=v2]"); pgL.wait_for_timeout(400)

# --- the stripes in 3D: a room shown on its own shows only its own (the owner, 2026-11-09: „dann sehe ich trotzdem noch von jedem anderen
# Raum, dass der auch gesperrt ist“)
pgL.click("#view3d"); pgL.wait_for_timeout(600)
hatch_rl = lambda: pgL.evaluate("(() => { const s = new Set(); window.__fp.scene.traverse((o) => { if (o.userData?.lockHatch && o.visible) s.add(o.userData.lockHatch); }); return [...s].sort(); })()")
check("room lock: in 3D the locked living room is hatched", hatch_rl() == ["rlWz"], hatch_rl())
def only_room_rl(name):
    pgL.click("#roomMenuBtn"); pgL.wait_for_timeout(200)
    pgL.locator("#roomMenu > *", has_text=name).first.click(); pgL.wait_for_timeout(700)
only_room_rl("Küche")
check("room lock: only the kitchen shown: no stripes of the locked living room next to it", pgL.evaluate("window.__fp.focusedRoom()") == "rlK" and hatch_rl() == [], hatch_rl())
# the heating beside the room panel is for the live view: while editing it no longer sits in the middle of the picture (2026-11-09)
heat_rl = pgL.evaluate("(() => { const h = document.querySelector('#heatPanel'), was = h.hidden; h.hidden = false; const d = getComputedStyle(h).display; h.hidden = was; return d; })()")
check("room lock: a room picked while editing: no heating window in the middle of the picture", heat_rl == "none", heat_rl)
only_room_rl("Wohnzimmer")
check("room lock: only the living room shown: its own stripes", pgL.evaluate("window.__fp.focusedRoom()") == "rlWz" and hatch_rl() == ["rlWz"], hatch_rl())
pgL.click("#roomMenuBtn"); pgL.wait_for_timeout(200)
pgL.click("#roomMenu .all"); pgL.wait_for_timeout(700)
check("room lock: every room again: the stripes as before", pgL.evaluate("window.__fp.focusedRoom()") is None and hatch_rl() == ["rlWz"], hatch_rl())

# --- the roof editor
pgL.evaluate("window.__fp.switchFloor(1)"); pgL.wait_for_timeout(600)
pgL.evaluate("window.__fp.select('roof', 'rlDach:roof')"); pgL.wait_for_selector("#roofEd", timeout=5000)
check("roof editor: a click on the roof opens it, with its tabs and where it is",
      pgL.locator("#roofTabs button").count() == 4 and pgL.locator("#roofWhere").count() == 1 and pgL.locator("#roofShapes .rfTile.on[data-type=gable]").count() == 1, None)
pgL.click("#roofShapes [data-type=hip]"); pgL.wait_for_timeout(600)
check("roof editor: a shape tile sets the shape", L_rl("r.type") == "hip", L_rl("r.type"))
pgL.click("#roofShapes [data-type=gable]"); pgL.wait_for_timeout(600)
pgL.fill("#roofPitchEd", "40"); pgL.press("#roofPitchEd", "Enter"); pgL.locator("#roofPitchEd").dispatch_event("change"); pgL.wait_for_timeout(600)
check("roof editor: the pitch typed under the side view", L_rl("r.pitch") == 40, L_rl("r.pitch"))
bx = pgL.locator("#roofProfile [data-h=pitch]").bounding_box()
cx, cy = bx["x"] + bx["width"] / 2, bx["y"] + bx["height"] / 2
pgL.mouse.move(cx, cy); pgL.mouse.down(); pgL.mouse.move(cx - 2, cy - 6, steps=3); pgL.mouse.move(cx - 3, cy - 12, steps=3); pgL.mouse.up(); pgL.wait_for_timeout(800)
check("roof editor: dragging the point on the arc makes the roof steeper", 40 < L_rl("r.pitch") <= 70, L_rl("r.pitch"))
# the big side view (⤢, #684): drawn again with the editor; Esc closes it, and it closes when the roof is no longer selected
pgL.click("#roofProfileBigBtn"); pgL.wait_for_selector("#roofBig", timeout=5000)
pgL.fill("#roofPitchEd", "38"); pgL.locator("#roofPitchEd").dispatch_event("change"); pgL.wait_for_timeout(600)
check("roof editor: the big side view shows a pitch typed in the panel, with its picture (#684)",
      pgL.input_value("#roofPitchBig") == "38" and pgL.locator("#roofBig .rfPic svg").count() == 1, pgL.input_value("#roofPitchBig"))
pgL.keyboard.press("Escape"); pgL.wait_for_timeout(300)
check("roof editor: Esc closes the big side view, the roof stays selected (#684)", pgL.locator("#roofBig").count() == 0 and pgL.locator("#roofEd").count() == 1, None)
pgL.click("#roofProfileBigBtn"); pgL.wait_for_selector("#roofBig", timeout=5000)
pgL.evaluate("window.__fp.select(null, null)"); pgL.wait_for_timeout(800)
check("roof editor: the big side view closes when the roof is no longer selected (#684)", pgL.locator("#roofBig").count() == 0, None)
pgL.evaluate("window.__fp.select('roof', 'rlDach:roof')"); pgL.wait_for_selector("#roofEd", timeout=5000)
pgL.click("#roofTabs [data-tab=top]"); pgL.wait_for_selector("#roofMap svg", timeout=5000)
p0 = L_rl("r.dormers[0].pos")
g = pgL.locator("#roofMap [data-part=dormer][data-i='0'] rect").first.bounding_box()
gx, gy = g["x"] + g["width"] / 2, g["y"] + g["height"] / 2
pgL.mouse.move(gx, gy); pgL.mouse.down(); pgL.mouse.move(gx + 15, gy, steps=3); pgL.mouse.move(gx + 35, gy, steps=3); pgL.mouse.up(); pgL.wait_for_timeout(800)
check("roof editor: a dormer dragged on the map from above moves along the ridge; its card opens",
      L_rl("r.dormers[0].pos") > p0 + 0.02 and pgL.locator(".rfPartBox.open[data-part=dormer]").count() == 1, [p0, L_rl("r.dormers[0].pos")])
pgL.click(".rfAdd [data-add=addDormer]"); pgL.wait_for_timeout(700)
check("roof editor: „＋ Gaube“ adds a dormer and opens it", L_rl("r.dormers.length") == 2 and pgL.get_attribute(".rfPartBox.open", "data-i") == "1", L_rl("r.dormers.length"))
# the solar panels on the roof (the owner, 2026-11-10: „wenn ich im Dacheditor auf die Solarpanele drücke … springt direkt zurück“): the row
# and the panels on the map open their own fields; the roof editor no longer draws itself over them a moment later
sel_rl = lambda: pgL.evaluate("JSON.stringify(window.__fp.selection())")
pgL.click(".rfPart[data-part=solar]"); pgL.wait_for_timeout(800)
check("roof editor: the row of the solar panels opens their fields, the roof does not come back over them",
      sel_rl() == '{"kind":"device","id":"rlPv"}' and pgL.locator("#roofEd").count() == 0 and "PV Test" in pgL.inner_text("#v2Head"), sel_rl())
pgL.evaluate("window.__fp.select('roof', 'rlDach:roof')"); pgL.wait_for_selector("#roofEd", timeout=5000)
pgL.click("#roofTabs [data-tab=top]"); pgL.wait_for_selector("#roofMap [data-part=solar]", timeout=5000)
pgL.click("#roofMap [data-part=solar]"); pgL.wait_for_timeout(800)
check("roof editor: the solar panels tapped on the map from above open their fields too",
      sel_rl() == '{"kind":"device","id":"rlPv"}' and pgL.locator("#roofEd").count() == 0, sel_rl())
pgL.evaluate("window.__fp.select('roof', 'rlDach:roof')"); pgL.wait_for_selector("#roofEd", timeout=5000)
pgL.click("#roofTabs [data-tab=tpl]"); pgL.wait_for_selector("#roofTemplates", timeout=5000)
pgL.click("#roofTemplates [data-tpl=cross]"); pgL.wait_for_timeout(800)
cross_rl = L_rl("JSON.stringify((r.parts || []).map((p) => [p.tpl, p.ridge, p.box]))")
check("roof editor: the cross roof (+) gets a gable across the middle", cross_rl == '[[true,"z",{"x0":3.3,"x1":6.7,"z0":0,"z1":4}]]', cross_rl)
pgL.click("#roofTemplates [data-tpl=lshape]"); pgL.wait_for_timeout(800)
l_rl = L_rl("JSON.stringify((r.parts || []).map((p) => [p.tpl, p.ridge, p.box]))")
check("roof editor: the L roof replaces it with a wing at the end, from the ridge to the front", l_rl == '[[true,"z",{"x0":6.6,"x1":10,"z0":0,"z1":2}]]', l_rl)
pgL.click("#roofTemplates [data-tpl=gable]"); pgL.wait_for_timeout(800)
check("roof editor: a plain template takes the template roof away again", L_rl("(r.parts || []).length") == 0, L_rl("JSON.stringify(r.parts)"))
pgL.click("#roofKeep"); pgL.wait_for_timeout(1500)
kept_rl = [t.get("name") for t in api("api/settings").get("roofTemplates", [])]
check("roof editor: „⭐ Mein Dach merken“ keeps the roof in the settings", "Testdach" in kept_rl, kept_rl)
check("roof lock: no errors", not own_rl, own_rl)

pgL.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open'); localStorage.removeItem('fp.lockHatch')")
put_layout_rl(saved_rl)
for k, d in (("language", ""), ("units", "metric"), ("roofTemplates", [])):
    set_setting(k, st_rl.get(k, d))
pgL.close()
