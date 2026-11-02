"""4.55.0 (#628, asked by christinloehner): the gable wall (the wall under each gable of a gable roof goes on up to the roof in the colour of
the walls, instead of a triangle in the roof's colour out at the edge of the overhang), the overhang at the gables (Ortgang), the shed roof
(Pultdach) with its high side, and "+ Vordach": a shed roof in front of the house just under the eave.
"""
gb_saved = api_admin("api/layout")
units_gb = api("api/settings")["units"]
set_setting("units", "metric")                # the base house leaves the units in feet: these checks type metres
def put_layout_gb(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT", headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})).read()
ring_gb = lambda p: [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": []} for i, (a, c) in enumerate((([0, 0], [10, 0]), ([10, 0], [10, 6]), ([10, 6], [0, 6]), ([0, 6], [0, 0])))]
put_layout_gb({"version": 1, "floors": [
    {"id": "gEG", "name": "EG", "kind": "floor", "walls": ring_gb("ge"), "rooms": [{"id": "gr0", "name": "Wohnen", "points": [[0, 0], [10, 0], [10, 6], [0, 6]]}], "devices": [], "blocks": [], "stairs": []},
    {"id": "gOG", "name": "OG", "kind": "floor", "walls": ring_gb("go"), "rooms": [{"id": "gr1", "name": "Schlafen", "points": [[0, 0], [10, 0], [10, 6], [0, 6]]}], "devices": [], "blocks": [], "stairs": []},
    {"id": "gD", "name": "Dach", "kind": "roof", "walls": [], "rooms": [], "devices": [], "blocks": [], "stairs": [], "roof": {"type": "gable", "pitch": 35, "overhang": 0.4}}]})
pgG = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
gb_errs = []
pgG.on("console", lambda m: gb_errs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgG.on("pageerror", lambda e: gb_errs.append("PAGEERROR " + str(e)))
pgG.goto(BASE + "?debug=1&mode=edit"); pgG.wait_for_timeout(2500)
pgG.evaluate("() => { window.__fp.switchFloor(2); document.querySelector('#floorPanel').open = true; }"); pgG.wait_for_timeout(600)
meshes_gb = lambda: pgG.evaluate("window.__fp.roofMeshes()")
roof_gb = lambda: pgG.evaluate("window.__fp.layout.floors[2].roof")
def main_of(ms, part=None):
    return [m for m in ms if m["tag"] == "main" and m["part"] == part]

ms = meshes_gb()
gw, rf = main_of(ms, "gablewall"), main_of(ms)
check("gable wall (#628): a gable roof gets its gable walls in the colour of the walls, on the walls (not out at the edge of the overhang)",
      len(gw) == 1 and gw[0]["tris"] > 20 and abs(gw[0]["box"][0] + 0.15) < 0.02 and abs(gw[0]["box"][1] - 10.15) < 0.02 and len(rf) == 1
      and abs(rf[0]["box"][0] + 0.4) < 0.01, (gw, rf))
check("gable wall (#628): the roof panel has the overhang at the gables and the gable wall box", pgG.locator("#floorBody .roofGableOver").count() == 1
      and pgG.locator("#floorBody .roofGableWall").is_checked())
t_with = rf[0]["tris"] if rf else 0
pgG.fill("#floorBody .roofGableOver", "0.1"); pgG.press("#floorBody .roofGableOver", "Enter"); pgG.wait_for_timeout(600)
rf2 = main_of(meshes_gb())
check("gable overhang (#628): 10 cm at the gables, the eaves keep their 40 cm", roof_gb().get("gableOver") == 0.1 and rf2 and abs(rf2[0]["box"][0] + 0.1) < 0.01
      and abs(rf2[0]["box"][2] + 0.4) < 0.01, (roof_gb(), rf2))
pgG.click("#floorBody .roofGableWall"); pgG.wait_for_timeout(600)
ms3 = meshes_gb()
check("gable wall (#628): switched off, the roof has its triangles at the gables again and no gable wall", roof_gb().get("gableWall") is False and not main_of(ms3, "gablewall")
      and main_of(ms3) and main_of(ms3)[0]["tris"] == t_with + 2, (roof_gb(), main_of(ms3), t_with))
pgG.click("#floorBody .roofGableWall"); pgG.wait_for_timeout(500)

# --- the shed roof (Pultdach): its high side instead of the ridge direction, no dormers, the wall under its sides and its high side
pgG.select_option("#roofType", "shed"); pgG.wait_for_timeout(700)
r = roof_gb()
check("shed roof (#628): chosen as the roof's shape it gets a shed's pitch (10°), its high side at the top, a field for it and none for the ridge",
      r["type"] == "shed" and r["pitch"] == 10 and r["high"] == "z0" and pgG.locator("#roofHigh").count() == 1 and pgG.locator("#roofRidge").count() == 0
      and pgG.locator("#addDormer").count() == 0, r)
pgG.select_option("#roofHigh", "x1"); pgG.wait_for_timeout(600)
ms4 = meshes_gb()
rs, gs = main_of(ms4), main_of(ms4, "gablewall")
check("shed roof (#628): high on the right: no overhang there, the walls go up under its sides and its high side", roof_gb()["high"] == "x1" and rs and gs
      and abs(rs[0]["box"][1] - 10) < 0.01 and abs(rs[0]["box"][0] + 0.4) < 0.01 and abs(gs[0]["box"][1] - 10.15) < 0.02, (rs, gs))
pgG.click("#view2d"); pgG.wait_for_timeout(600)
check("shed roof (#628): the 2D plan draws its high side as a solid line", pgG.locator("[data-roofhigh='x1']").count() == 1)
pgG.click("#view3d"); pgG.wait_for_timeout(500)
pgG.select_option("#roofType", "gable"); pgG.wait_for_timeout(500)

# --- "+ Vordach": a shed roof in front of the house, high against the wall just under the eave, no walls under it
pgG.locator("#addCanopy").scroll_into_view_if_needed(); pgG.click("#addCanopy"); pgG.wait_for_timeout(800)
parts = roof_gb().get("parts") or []
can = parts[-1] if parts else {}
check("canopy (#628): \"+ Vordach\" adds a shed roof in front of the long side of the house, as high as the main roof, moved down under the eave",
      len(parts) == 1 and can.get("type") == "shed" and can.get("high") == "z0" and can.get("gableWall") is False and can.get("level") == "main"
      and can.get("box") == {"x0": 0, "x1": 10, "z0": 6, "z1": 8.5} and -0.6 < can.get("dy", 0) < -0.4 and pgG.locator(".roofPartCard .roofPartDy").count() == 1, can)
ms5 = meshes_gb()
cm = [m for m in ms5 if m["tag"] == can.get("id") and not m["part"]]
mainY = main_of(ms5)[0]["y"] if main_of(ms5) else 0
check("canopy (#628): it is drawn below the main roof's eave and has no wall under it", len(cm) == 1 and cm[0]["y"] < mainY - 0.4
      and not [m for m in ms5 if m["tag"] == can.get("id") and m["part"] == "gablewall"], (cm, mainY))
check("gables (#628): no errors on the page", not gb_errs, gb_errs[:5])
pgG.close()
put_layout_gb(gb_saved)
set_setting("units", units_gb)
