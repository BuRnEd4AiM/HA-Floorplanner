"""4.61.0 (#621, LoggieXC81 about the L-shaped roof: „The second roof should be cut internally also by the first roof, similar to what it
looks like at the Gaube“, „The orientation/rotation should be set by a number. The second roof rotates 90° if the dimensions are too short
on one side“, „The Gaube has a maximum width of around 5m … also the roof pitch should be set individually for the Gaube“): the roofs of
an L-shaped house cut into each other (valleys), a further roof has „Firstrichtung“ (automatic, 0°, 90°), a gable dormer may be wide and
has its own pitch.
"""
rc_saved = api_admin("api/layout")
units_rc = api("api/settings")["units"]
set_setting("units", "metric")                # the base house leaves the units in feet: these checks type metres
def put_layout_rc(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT", headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})).read()
L_rc = [[0, 0], [10, 0], [10, 12], [6, 12], [6, 6], [0, 6]]
walls_rc = [{"id": f"rcw{i}", "a": a, "b": L_rc[(i + 1) % len(L_rc)], "thickness": 0.3, "height": 2.6, "openings": []} for i, a in enumerate(L_rc)]
put_layout_rc({"version": 1, "floors": [
    {"id": "rcEG", "name": "EG", "kind": "floor", "walls": walls_rc, "rooms": [{"id": "rcr0", "name": "Wohnen", "points": L_rc}], "devices": [], "blocks": [], "stairs": []},
    {"id": "rcD", "name": "Dach", "kind": "roof", "walls": [], "rooms": [], "devices": [], "blocks": [], "stairs": [],
     "roof": {"type": "gable", "pitch": 35, "overhang": 0.4, "box": {"x0": 0, "x1": 10, "z0": 0, "z1": 6}, "ridge": "x",
              "parts": [{"id": "rcW", "type": "gable", "pitch": 35, "overhang": 0.4, "box": {"x0": 6, "x1": 10, "z0": 3, "z1": 12}, "ridge": "z", "level": "main"}]}}]})
pgRC = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
rc_errs = []
pgRC.on("console", lambda m: rc_errs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgRC.on("pageerror", lambda e: rc_errs.append("PAGEERROR " + str(e)))
pgRC.goto(BASE + "?debug=1&mode=edit"); pgRC.wait_for_timeout(2500)
pgRC.evaluate("() => { window.__fp.switchFloor(1); document.querySelector('#floorPanel').open = true; }"); pgRC.wait_for_timeout(600)
roof_rc = lambda: pgRC.evaluate("window.__fp.layout.floors[1].roof")
def slope_rc(tag):
    return [m for m in pgRC.evaluate("window.__fp.roofMeshes()") if m["tag"] == tag and not m["part"]]

wing, main = slope_rc("rcW"), slope_rc("main")
pgRC.evaluate("() => { const r = window.__fp.layout.floors[1].roof; window.__rcParts = r.parts; r.parts = []; window.__fp.rebuild(); }"); pgRC.wait_for_timeout(400)
main_alone = slope_rc("main")
pgRC.evaluate("() => { window.__fp.layout.floors[1].roof.parts = window.__rcParts; window.__fp.rebuild(); }"); pgRC.wait_for_timeout(400)
check("L-shaped roof (#621): the wing ends where it runs into the main roof (in the valleys), not at the main ridge inside it",
      len(wing) == 1 and 3.6 < wing[0]["box"][2] < 4.4 and abs(wing[0]["box"][3] - 12.4) < 0.01, wing)
check("L-shaped roof (#621): the main roof loses its slope under the wing (cut into more pieces), its outline stays",
      len(main) == 1 and len(main_alone) == 1 and main[0]["tris"] > main_alone[0]["tris"] and main[0]["box"] == main_alone[0]["box"], (main, main_alone))

# the ridge direction of a further roof: automatic, 0° or 90° (it turned by itself when its other side got longer)
sel = "#floorBody #roofPartRidge0"
opts = pgRC.locator(sel).locator("option").evaluate_all("(os) => os.map((o) => o.value)") if pgRC.locator(sel).count() else []
check("ridge (#621): the further roof has „Firstrichtung“ (automatic, 0°, 90°), set to 90° here; the main roof has it too",
      opts == ["", "x", "z"] and pgRC.input_value(sel) == "z" and pgRC.locator("#floorBody #roofRidge").count() == 1, opts)
pgRC.select_option(sel, "x"); pgRC.wait_for_timeout(500)
wing_x = slope_rc("rcW")
check("ridge (#621): 0° turns the wing's ridge along x (its gables at x 6 and 10)", roof_rc()["parts"][0].get("ridge") == "x" and len(wing_x) == 1
      and wing_x[0]["box"][3] > 12.3, (roof_rc()["parts"][0], wing_x))
pgRC.select_option(sel, ""); pgRC.wait_for_timeout(500)
check("ridge (#621): „Automatisch“ removes it (the longer side counts)", "ridge" not in roof_rc()["parts"][0], roof_rc()["parts"][0])
pgRC.select_option(sel, "z"); pgRC.wait_for_timeout(500)
pgRC.evaluate("() => { const p = window.__fp.layout.floors[1].roof.parts[0]; p.box.z1 = 7; window.__fp.rebuild(); }"); pgRC.wait_for_timeout(400)
check("ridge (#621): at 90° the wing keeps its ridge when it gets wider than long", roof_rc()["parts"][0].get("ridge") == "z", roof_rc()["parts"][0])
pgRC.evaluate("() => { const p = window.__fp.layout.floors[1].roof.parts[0]; p.box.z1 = 12; window.__fp.rebuild(); }"); pgRC.wait_for_timeout(400)

# a wide gable dormer with its own pitch
pgRC.click("#addDormer"); pgRC.wait_for_timeout(500)
check("dormer (#621): a gable dormer has „Neigung der Gaube“, 28° to start with", pgRC.locator(".dormerCard .dormerGablePitch").count() == 1
      and pgRC.input_value(".dormerCard .dormerGablePitch") == "28")
pgRC.fill(".dormerCard .dormerWidth", "8"); pgRC.press(".dormerCard .dormerWidth", "Enter"); pgRC.wait_for_timeout(600)
d_rc = roof_rc()["dormers"][0]
gp_shown = float(pgRC.input_value(".dormerCard .dormerGablePitch") or 0)
dm = [m for m in pgRC.evaluate("window.__fp.roofMeshes()") if m["part"] == "roof"]
check("dormer (#621): 8 m wide (it was 5 m at most): it fits, its roof gets flatter by itself and says so",
      d_rc["w"] == 8 and pgRC.locator(".dormerCard .warn").count() == 0 and 5 <= gp_shown < 20 and pgRC.locator(".dormerCard .dormerGableHint").count() == 1
      and len(dm) == 1 and dm[0]["box"][1] - dm[0]["box"][0] > 8, (d_rc, gp_shown, dm))
pgRC.fill(".dormerCard .dormerWidth", "2"); pgRC.press(".dormerCard .dormerWidth", "Enter"); pgRC.wait_for_timeout(500)
pgRC.fill(".dormerCard .dormerGablePitch", "35"); pgRC.locator(".dormerCard .dormerGablePitch").dispatch_event("change"); pgRC.wait_for_timeout(600)
check("dormer (#621): its own pitch 35° is stored and shown", roof_rc()["dormers"][0].get("gp") == 35 and pgRC.input_value(".dormerCard .dormerGablePitch") == "35"
      and pgRC.locator(".dormerCard .dormerGableHint").count() == 0, roof_rc()["dormers"][0])
check("roof cut (#621): no errors on the page", not rc_errs, rc_errs[:5])
pgRC.close()
put_layout_rc(rc_saved)
set_setting("units", units_rc)
