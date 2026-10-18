"""Several buildings in one plan (#409): a plan of its own with a main house over two floors and a garden house; the panel "Buildings in
this plan" (add, rename, assign rooms; the upper floor follows by itself), the switch at the top (only the building shown is drawn, listed
and framed, a floor without it leaves the floor buttons), every building its own roof, the building of a user / tablet with its lock, and
another house of the list brought in as a building of its own; a long wall along both buildings shows only along the one shown, a room
downstairs does not follow a room upstairs, the device list shows only the building shown (#451).
"""
def send(method, path, body=None, user="admin"):
    rq = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, method=method,
                                headers={"Content-Type": "application/json", "X-Remote-User-Name": user})
    return json.load(urllib.request.urlopen(rq))
sq = lambda x0, z0, x1, z1: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
def box_walls(p, x0, z0, x1, z1):
    c = sq(x0, z0, x1, z1)
    return [{"id": f"{p}{i}", "a": c[i], "b": c[(i + 1) % 4], "thickness": 0.2, "height": 2.6, "openings": []} for i in range(4)]
empty = {"stairs": [], "blocks": [], "holes": []}
plan_b = {"version": 1, "floors": [
    {"id": "beg", "name": "EG", **empty, "walls": box_walls("bm", 0, 0, 8, 6) + box_walls("bg", 14, 0, 18, 4),
     "rooms": [{"id": "bwz", "name": "Wohnen", "color": "#8a7f70", "points": sq(0, 0, 8, 6)}, {"id": "bgr", "name": "Gartenraum", "color": "#7a8f70", "points": sq(14, 0, 18, 4)}],
     "devices": [{"id": "bsofa", "type": "sofa", "x": 4, "z": 3, "rot": 0, "scale": 1}, {"id": "bbed", "type": "bed", "x": 16, "z": 2, "rot": 0, "scale": 1},
                 {"id": "bbench", "type": "bench", "x": 11, "z": 9, "rot": 0, "scale": 1}]},
    {"id": "bog", "name": "OG", **empty, "walls": box_walls("bo", 0, 0, 8, 6), "rooms": [{"id": "bsz", "name": "Schlafen", "color": "#8a7f70", "points": sq(0, 0, 8, 6)}],
     "devices": [{"id": "blamp", "type": "pendant", "x": 4, "z": 3, "rot": 0, "scale": 1}]},
    {"id": "bdach", "name": "Dach", "kind": "roof", "walls": [], "rooms": [], "devices": [], "roof": {"type": "gable", "pitch": 35, "overhang": 0.4}},
]}
hid = send("POST", "api/houses", {"name": "Zwei Gebaeude"})["id"]
send("PUT", f"api/layout?house={hid}", plan_b)
pgB = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgB.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgB.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgB.on("dialog", lambda d: d.accept())
pgB.goto(BASE + f"?debug=1&mode=edit&house={hid}"); pgB.wait_for_timeout(1500)
check("buildings: the test plan is open, without buildings there is no switch", pgB.evaluate("window.__fp.houseId()") == hid and not pgB.is_visible("#buildingSelect"))
pgB.evaluate("document.querySelector('#buildingPanel').open = true"); pgB.wait_for_timeout(300)
pgB.click("#bldAdd"); pgB.wait_for_timeout(200); pgB.click("#bldAdd"); pgB.wait_for_timeout(300)
for i, name in enumerate(["Haupthaus", "Gartenhaus"]):
    inp = pgB.locator("#buildingBody .bldName").nth(i); inp.fill(name); inp.dispatch_event("change"); pgB.wait_for_timeout(250)
bl = pgB.evaluate("window.__fp.layout.buildings")
check("buildings: two buildings added and named in the panel", [x["name"] for x in bl] == ["Haupthaus", "Gartenhaus"], bl)
main_id, gh_id = bl[0]["id"], bl[1]["id"]
pgB.select_option("#buildingBody select[data-room=bwz]", main_id); pgB.wait_for_timeout(250)
pgB.select_option("#buildingBody select[data-room=bgr]", gh_id); pgB.wait_for_timeout(250)
og = pgB.locator("#buildingBody select[data-room=bsz]")
check("buildings: the room upstairs follows the room below by itself (automatic: main house)",
      og.input_value() == "" and "Haupthaus" in og.locator("option").first.inner_text(), og.locator("option").first.inner_text())
check("buildings: the switch at the top offers all buildings and the two", pgB.is_visible("#buildingSelect")
      and len(pgB.locator("#buildingSelect option").all_inner_texts()) == 3, pgB.locator("#buildingSelect option").all_inner_texts())
has = lambda i: pgB.evaluate(f"window.__fp.has({i!r})")
check("buildings: all buildings shown: everything is drawn", has("bsofa") and has("bbed") and has("bbench"))
pgB.select_option("#buildingSelect", gh_id); pgB.wait_for_timeout(1000)
rail = pgB.locator("#floorRail .floorThumb").all_inner_texts()
check("buildings: the garden house alone: its bed and the garden bench, not the sofa of the main house", has("bbed") and has("bbench") and not has("bsofa"))
check("buildings: the upper floor (nothing of the garden house) leaves the floor buttons", "OG" not in rail and "EG" in rail, rail)
bd = pgB.evaluate("window.__fp.bounds()")
check("buildings: the view frames the garden house (and the garden bench), not the main house", bd["cx"] - bd["size"] / 2 > 8 and bd["cx"] + bd["size"] / 2 >= 18, bd)
pgB.click("#view2d"); pgB.wait_for_timeout(500)
svg = pgB.inner_html("#plan2d")
check("buildings: the 2D plan shows only the garden house", "Gartenraum" in svg and "Wohnen" not in svg)
pgB.click("#view3d"); pgB.wait_for_timeout(400)
pgB.select_option("#buildingSelect", main_id); pgB.wait_for_timeout(1000)
check("buildings: the main house: the sofa, not the bed; its upper floor is back", has("bsofa") and not has("bbed") and "OG" in pgB.locator("#floorRail .floorThumb").all_inner_texts())
pgB.select_option("#buildingSelect", ""); pgB.wait_for_timeout(800)
check("buildings: the main roof over all buildings: a hint in the panel", pgB.locator("#buildingBody .bldWarn").count() == 1)
pgB.click("#buildingBody .bldEachRoof"); pgB.wait_for_timeout(800)
roof = pgB.evaluate("window.__fp.layout.floors[2].roof")
check("buildings: every building its own roof: the main house keeps the main roof, the garden house gets one over its own rooms",
      roof.get("building") == main_id and len(roof.get("parts", [])) == 1 and roof["parts"][0]["building"] == gh_id
      and roof["parts"][0]["box"] == {"x0": 14, "x1": 18, "z0": 0, "z1": 4} and roof["parts"][0]["level"] == "beg", roof)
pgB.click("#saveBtn"); pgB.wait_for_timeout(800)
saved = api_admin(f"api/layout?house={hid}")
check("buildings: saved with the plan", len(saved.get("buildings", [])) == 2 and saved["floors"][0]["rooms"][1].get("building") == gh_id)

# --- the users dialog offers the buildings for a user row
pgB.click("#usersBtn"); pgB.wait_for_timeout(1200); pgB.click("#addTablet"); pgB.wait_for_timeout(200)
pgB.locator("#tabletRows .tablet .presetBtn").last.click(); pgB.wait_for_timeout(200)
opts = pgB.locator("#tabletRows .tablet [data-role=building]").last.locator("option").all_inner_texts()
check("buildings: the users dialog offers the buildings for a user / tablet", "Gartenhaus" in opts and "Haupthaus" in opts, opts)
pgB.keyboard.press("Escape"); pgB.wait_for_timeout(300)

# --- a tablet kept to the garden house (#409, step 3)
user_buildings, user_locks = api("api/settings").get("userBuildings", {}), api("api/settings").get("userLocks", {})
set_setting("userBuildings", {**user_buildings, "tablet_gh": gh_id})
set_setting("userLocks", {**user_locks, "tablet_gh": ["building"]})
pgT = b.new_page(viewport={"width": 1200, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_gh"})
pgT.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgT.goto(BASE + f"?debug=1&mode=live&house={hid}"); pgT.wait_for_timeout(1500)
check("buildings: a tablet set to the garden house shows only it, and cannot switch (lock)",
      pgT.evaluate("window.__fp.has('bbed')") and not pgT.evaluate("window.__fp.has('bsofa')") and not pgT.is_visible("#buildingSelect"))
pgT.close()
set_setting("userBuildings", user_buildings)
set_setting("userLocks", user_locks)

# --- another house brought in as a building (#409, step 4)
aid = send("POST", "api/houses", {"name": "Atelier"})["id"]
send("PUT", f"api/layout?house={aid}", {"version": 1, "floors": [
    {"id": "ae", "name": "EG", **empty, "walls": box_walls("aw", 0, 0, 5, 4), "rooms": [{"id": "ar", "name": "Atelierraum", "color": "#999", "points": sq(0, 0, 5, 4)}],
     "devices": [{"id": "adesk", "type": "desk", "x": 2, "z": 2, "rot": 0, "scale": 1}]},
    {"id": "aso", "name": "Studio", **empty, "walls": [], "rooms": [{"id": "ar2", "name": "Studio", "color": "#999", "points": sq(0, 0, 5, 4)}], "devices": []},
    {"id": "aob", "name": "Spitzboden", **empty, "walls": [], "rooms": [{"id": "ar3", "name": "Boden", "color": "#999", "points": sq(0, 0, 5, 4)}], "devices": []}]})
pgB.reload(); pgB.wait_for_timeout(1500)
pgB.evaluate("document.querySelector('#buildingPanel').open = true"); pgB.wait_for_timeout(300)
pgB.select_option("#bldMergeHouse", aid); pgB.click("#bldMerge"); pgB.wait_for_timeout(1200)
l = pgB.evaluate("window.__fp.layout")
atelier = next((r for f in l["floors"] for r in f["rooms"] if r["name"] == "Atelierraum"), None)
check("buildings: another house brought in: a third building, its rooms on the floors of the same level, 3 m right of this plan",
      len(l["buildings"]) == 3 and atelier and atelier["building"] == l["buildings"][2]["id"] and l["buildings"][2]["name"] == "Atelier"
      and min(p[0] for p in atelier["points"]) == 21 and any(r["name"] == "Atelierraum" for r in l["floors"][0]["rooms"]), (l["buildings"], atelier))
check("buildings: a floor the plan did not have is put in under the roof", [f["name"] for f in l["floors"]] == ["EG", "OG", "Spitzboden", "Dach"], [f["name"] for f in l["floors"]])
check("buildings: the brought in house stays in the house list", any(h["id"] == aid for h in api("api/houses")))
pgB.keyboard.press("Control+z"); pgB.wait_for_timeout(600)
check("buildings: one undo takes it out again", len(pgB.evaluate("window.__fp.layout.buildings")) == 2)
pgB.close()

# --- #451: a long wall along both buildings shows only along the building shown, a room downstairs does not follow a room upstairs, the
# device list shows only the building shown
wall = lambda i, a, b: {"id": i, "a": a, "b": b, "thickness": 0.2, "height": 2.6, "openings": []}
cid = send("POST", "api/houses", {"name": "Anbau"})["id"]
send("PUT", f"api/layout?house={cid}", {"version": 1, "buildings": [{"id": "g1", "name": "Haus"}, {"id": "g2", "name": "Anbau"}], "floors": [
    {"id": "ce", "name": "EG", **empty, "walls": [wall("clong", [0, 0], [14, 0]), wall("cmid", [8, 0], [8, 6]), wall("cback", [0, 6], [14, 6])],
     "rooms": [{"id": "chaus", "name": "Haus", "color": "#999", "points": sq(0, 0, 8, 6)},
               {"id": "canbau", "name": "Anbau", "color": "#999", "points": sq(8, 0, 14, 6), "building": "g2"}],
     "devices": [{"id": "clamp1", "type": "spot", "x": 4, "z": 3, "rot": 0, "scale": 1, "entity": "light.wohnzimmer"},
                 {"id": "clamp2", "type": "spot", "x": 11, "z": 3, "rot": 0, "scale": 1, "entity": "light.andere"}]},
    {"id": "co", "name": "OG", **empty, "walls": box_walls("cow", 2, 1, 6, 5), "devices": [],
     "rooms": [{"id": "coben", "name": "Oben", "color": "#999", "points": sq(2, 1, 6, 5), "building": "g2"}]}]})
pgC = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgC.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgC.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgC.goto(BASE + f"?debug=1&mode=edit&house={cid}"); pgC.wait_for_timeout(1500)
WALL_X = """(id) => { let x0 = Infinity, x1 = -Infinity;
  window.__fp.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    let p = o; while (p && p.userData?.kind !== 'wall') p = p.parent;
    if (!p || p.userData.id !== id) return;
    o.updateWorldMatrix(true, false); o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox, V = o.position.constructor;
    for (const x of [bb.min.x, bb.max.x]) for (const z of [bb.min.z, bb.max.z]) { const v = new V(x, bb.min.y, z).applyMatrix4(o.matrixWorld); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); }
  });
  return [x0, x1]; }"""
pgC.select_option("#buildingSelect", "g1"); pgC.wait_for_timeout(1000)
x0, x1 = pgC.evaluate(WALL_X, "clong")
check("buildings (#451): the room downstairs without a building stays with the plot under a room of the other building upstairs",
      pgC.evaluate("window.__fp.has('chaus')") and pgC.evaluate("window.__fp.has('clamp1')") and not pgC.evaluate("window.__fp.has('clamp2')"))
check("buildings (#451): a long wall along both buildings shows only along the building shown, not along the other one", x0 < 0.5 and 7.9 < x1 < 8.8, (x0, x1))
pgC.click("#devicesPill"); pgC.wait_for_timeout(500)
check("buildings (#451): the device list shows only the devices of the building shown",
      pgC.locator("#devicePanel .dl-row[data-id=clamp1]").count() == 1 and pgC.locator("#devicePanel .dl-row[data-id=clamp2]").count() == 0, pgC.inner_text("#devicePanel")[:300])
pgC.select_option("#buildingSelect", "g2"); pgC.wait_for_timeout(1000)
x0, x1 = pgC.evaluate(WALL_X, "clong")
check("buildings (#451): with the other building the wall shows whole (along it and the plot), its devices in the list", x0 < 0.5 and x1 > 13.5
      and pgC.locator("#devicePanel .dl-row[data-id=clamp2]").count() == 1, (x0, x1))
pgC.close()
for h in (aid, hid, cid):
    send("DELETE", f"api/houses/{h}")
check("buildings: the test houses are gone again", not any(h["id"] in (aid, hid, cid) for h in api("api/houses")))
bad = [e for e in own if "favicon" not in e]
check("buildings: no console errors", not bad, bad)
