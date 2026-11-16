"""5.14.0 (the owner: „ich hätte gerne, dass ich sagen kann, wie weit das Geländer in einer Richtung geht oder ob eine Geländertür dort
ist … bei mir geht das Geländer nur an zwei Seiten“): the railing of a balcony side by side. Its properties list every side that has a
railing („Seite 1 · 4,00 m“, the same numbers as in the 2D plan): switched off, „Geländer von … bis“, „🚪 Tür im Geländer“ with its
middle and width; in the 2D plan the railing is a line, the gate a gap with its swing, the ends ◆ and the gate ■ can be dragged; in 3D
the railing follows, the gate is a leaf in a frame. Also in „✨ Neu“ (tab „Allgemein“, the search finds it).
The plateau and the buildings of the same version: 93_plateau_more.
"""
saved_rs = api_admin("api/layout")              # put back at the end
st_rs = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_rs(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
def ring_rs(p, x0, z0, x1, z1):
    sides = (([x0, z0], [x1, z0]), ([x1, z0], [x1, z1]), ([x1, z1], [x0, z1]), ([x0, z1], [x0, z0]))
    return [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": []} for i, (a, c) in enumerate(sides)]
BAL = [[3, -1.8], [7, -1.8], [7, -0.15], [3, -0.15]]   # sides: 0 front (4 m), 1 right (1.65 m), 2 along the house (a wall), 3 left
put_layout_rs({"version": 1, "floors": [
    {"id": "rsEG", "name": "EG", "kind": "floor", "walls": ring_rs("rw", 0, 0, 10, 7),
     "rooms": [{"id": "rsWo", "name": "Wohnen", "points": [[0, 0], [10, 0], [10, 7], [0, 7]]},
               {"id": "rsBal", "name": "Balkon", "points": BAL, "terrace": True, "color": "#a58a63"}], "devices": [], "blocks": [], "stairs": []}]})
own_rs = []
pgS = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("console", lambda m: own_rs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: own_rs.append("PAGEERROR " + str(e)))
pgS.on("dialog", lambda d: d.accept())
def open_rs(q="", fi=0, room="rsBal"):
    pgS.goto(BASE + "?debug=1&mode=edit" + q); pgS.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgS.wait_for_timeout(800)
    pgS.evaluate(f"() => window.__fp.switchFloor({fi})"); pgS.wait_for_timeout(500)
    if pgS.is_visible("#view2d"): pgS.click("#view2d"); pgS.wait_for_timeout(900)   # the 2D plan (its numbers, handles, gates)
    if room:
        pgS.evaluate(f"() => window.__fp.select('room', '{room}')"); pgS.wait_for_timeout(500)
open_rs()
pgS.wait_for_selector("#railSides", timeout=10000)
room_rs = lambda: next(r for r in pgS.evaluate("window.__fp.layout.floors[0].rooms") if r["id"] == "rsBal")
wait_rs = lambda js: pgS.wait_for_function(js, timeout=15000)
# the railing's vertices in 3D near a line: (x0, z0) … (x1, z1), within 8 cm across
rail_near = lambda tag, x0, z0, x1, z1: pgS.evaluate("""([tag, x0, z0, x1, z1]) => { let n = 0; const v = { x: 0, y: 0, z: 0 };
  window.__fp.scene.traverse((o) => { if (!o.isMesh || !o.userData[tag]) return; o.updateWorldMatrix(true, false);
    const p = o.geometry.getAttribute('position'), w = new o.position.constructor();
    for (let k = 0; k < p.count; k++) { w.fromBufferAttribute(p, k).applyMatrix4(o.matrixWorld);
      if (w.x >= Math.min(x0, x1) - 0.08 && w.x <= Math.max(x0, x1) + 0.08 && w.z >= Math.min(z0, z1) - 0.08 && w.z <= Math.max(z0, z1) + 0.08) n++; } });
  return n; }""", [tag, x0, z0, x1, z1])

rows = pgS.evaluate("[...document.querySelectorAll('#railSides .railSide')].map((e) => [e.dataset.side, e.dataset.n, e.querySelector('.railSideHead').textContent.trim()])")
check("rail sides: „Geländer je Seite“ lists the three sides without a wall (not the one along the house), numbered 1 … 3 with their length",
      [r[:2] for r in rows] == [["0", "1"], ["1", "2"], ["3", "3"]] and "Seite 1 · 4,00 m" in rows[0][2].replace(".", ","), rows)
badges = pgS.evaluate("[...document.querySelectorAll('#plan2d .railSide2d')].map((e) => e.dataset.side + ':' + e.dataset.n)")
check("rail sides: the 2D plan shows the same numbers at the sides of the selected balcony, the railing as a line",
      badges == ["0:1", "1:2", "3:3"] and pgS.locator("#plan2d line.rail2d").count() == 3, badges)
check("rail sides: before: a railing on the left side in 3D", rail_near("railing", 3, -1.55, 3, -0.4) > 0)

pgS.uncheck("#railSideOn3")
wait_rs("(() => { const r = window.__fp.layout.floors[0].rooms.find((x) => x.id === 'rsBal'); return !!r.railSides; })()"); pgS.wait_for_timeout(700)
check("rail sides: side 3 off: stored as {off: true}, no railing there in 3D, a dashed line in the 2D plan, the row greyed",
      room_rs().get("railSides") == [None, None, None, {"off": True}] and rail_near("railing", 3, -1.55, 3, -0.4) == 0
      and pgS.locator("#plan2d .railOff2d[data-side='3']").count() == 1 and pgS.locator("#railSides .railSide.off[data-side='3']").count() == 1, room_rs().get("railSides"))
pgS.fill("#railTo0", "2"); pgS.dispatch_event("#railTo0", "change"); pgS.wait_for_timeout(800)
check("rail sides: „Geländer von … bis“ 0 – 2 m on side 1: only the first 2 m of the front have a railing",
      (room_rs().get("railSides") or [None])[0] == {"to": 2} and rail_near("railing", 3.2, -1.8, 4.8, -1.8) > 0 and rail_near("railing", 5.3, -1.8, 6.8, -1.8) == 0,
      room_rs().get("railSides"))
pgS.check("#railGate1")
wait_rs("(() => { let g = false; window.__fp.scene.traverse((o) => { if (o.userData.railGate) g = true; }); return g; })()")
check("rail sides: „🚪 Tür im Geländer“ on side 2: a gate 90 cm wide in its middle, a leaf in 3D, a gap with its swing in the 2D plan, its fields",
      room_rs()["railSides"][1] == {"gate": {"at": 0.825, "w": 0.9}} and pgS.locator("#plan2d .gate2d[data-side='1']").count() == 1
      and pgS.is_visible("#railGateAt1") and pgS.is_visible("#railGateW1") and rail_near("railing", 7, -1.3, 7, -0.7) == 0, room_rs()["railSides"])
pgS.fill("#railGateW1", "1.2"); pgS.dispatch_event("#railGateW1", "change"); pgS.wait_for_timeout(500)
check("rail sides: the gate's width typed in", room_rs()["railSides"][1]["gate"]["w"] == 1.2, room_rs()["railSides"])

# drag the end ◆ of the railing on side 1 in the 2D plan from 2 m to 3 m
pgS.evaluate("() => window.__fp.select('room', 'rsBal')"); pgS.wait_for_timeout(500)
hb = pgS.locator("#plan2d .railHandle[data-side='0'][data-which='to']").bounding_box()
tx, ty = pgS.evaluate("window.__fp.plan().toClient(6, -1.8)")
pgS.mouse.move(hb["x"] + hb["width"] / 2, hb["y"] + hb["height"] / 2); pgS.mouse.down()
pgS.mouse.move(tx, ty - 14, steps=4); pgS.mouse.move(tx, ty - 14, steps=2); pgS.wait_for_timeout(200)
drag_status = pgS.inner_text("#status")
pgS.mouse.up(); pgS.wait_for_timeout(800)
check("rail sides: dragging the end ◆ in the 2D plan makes the railing longer (to 3 m)",
      abs((room_rs()["railSides"][0] or {}).get("to", 0) - 3) < 0.06, (room_rs()["railSides"], drag_status))
pgS.keyboard.press("Control+z"); pgS.wait_for_timeout(600)
check("rail sides: undo takes the drag back", (room_rs()["railSides"][0] or {}).get("to") == 2, room_rs()["railSides"])
# a corner added in the middle of the front side (double click on it): the settings stay where they were
fx, fy = pgS.evaluate("window.__fp.plan().toClient(4, -1.8)")
pgS.mouse.dblclick(fx, fy); pgS.wait_for_timeout(700)
r_split = room_rs()
check("rail sides: a corner added on side 1 (at 1 m): its railing to 2 m goes on into the new side to 1 m, the others move along",
      len(r_split["points"]) == 5 and r_split["railSides"][0] is None and abs(r_split["railSides"][1].get("to", 0) - 1) < 0.05 and r_split["railSides"][2]["gate"]["w"] == 1.2 and r_split["railSides"][4] == {"off": True},
      r_split.get("railSides"))
pgS.keyboard.press("Control+z"); pgS.wait_for_timeout(600)
pgS.evaluate("() => window.__fp.select('room', 'rsBal')"); pgS.wait_for_timeout(500)
pgS.click("#railSidesReset"); pgS.wait_for_timeout(700)
check("rail sides: „↺ Alle Seiten wie vorher“: nothing stored, the railing all round again",
      "railSides" not in room_rs() and rail_near("railing", 3, -1.55, 3, -0.4) > 0, room_rs())

# ✨ Neu: the fields under „Allgemein“ (with the balcony), the search finds them
open_rs("&ui=2")
check("rail sides / ✨ Neu: „Geländer je Seite“ is in the tab „Allgemein“ of the room",
      pgS.evaluate("document.body.classList.contains('uiV2')") and pgS.is_visible("#railSides") and pgS.get_attribute("#v2RoomTabs button.on", "data-tab") == "general",
      pgS.evaluate("document.body.className"))
pgS.click("#v2RoomTabs [data-tab=floor]"); pgS.wait_for_timeout(300)
pgS.fill("#v2Search", "Tür im Geländer"); pgS.wait_for_timeout(600)
check("rail sides / ✨ Neu: „🔍 Einstellung suchen“ finds „Tür im Geländer“ from another tab", pgS.is_visible("#railGate0") and "Treffer" in pgS.inner_text("#v2SearchRes"),
      pgS.inner_text("#v2SearchRes"))
pgS.fill("#v2Search", ""); pgS.wait_for_timeout(300)
pgS.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel

check("rail sides: no errors on the page", not own_rs, own_rs[:5])
pgS.close()
put_layout_rs(saved_rs)
set_setting("language", st_rs.get("language", "de")); set_setting("units", st_rs.get("units", "metric"))
