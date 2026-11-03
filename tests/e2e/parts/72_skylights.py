"""4.62.0 (#643, christinloehner: „Bin ich doof oder finde ich wirklich keine ganz einfachen, ordinären Dachfenster, ohne Gauben?“): roof
windows. On the roof floor „Etage verwalten“ has the section „Dachfenster“: „+ Dachfenster“ puts one into the slope (a hole in the roof, a
flashing round it), with side, place, a usual size (78 × 118 cm …) or width and height. The window lies in the slope and is a real window:
its contact makes it red and its pane opens outwards; its fields say that size and place are set on the roof; Delete takes it off the roof.
A flat roof has none; the 2D plan of the roof floor shows them.
"""
saved_sk = api_admin("api/layout")              # put back at the end
st_sk = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_sk(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
def post_sk(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
set_sk = lambda e, s: urllib.request.urlopen(HA + f"/_set?e={e}&s={s}").read()
box_sk = [[0, 0], [10, 0], [10, 6], [0, 6]]
put_layout_sk({"version": 1, "floors": [
    {"id": "skEG", "name": "EG", "kind": "floor", "walls": [{"id": f"skw{i}", "a": a, "b": box_sk[(i + 1) % 4], "thickness": 0.3, "height": 2.6, "openings": []} for i, a in enumerate(box_sk)],
     "rooms": [{"id": "skr", "name": "Wohnen", "points": box_sk}], "devices": [], "blocks": [], "stairs": []},
    {"id": "skD", "name": "Dach", "kind": "roof", "walls": [], "rooms": [{"id": "skr2", "name": "Studio", "points": box_sk}], "devices": [], "blocks": [], "stairs": [],
     "roof": {"type": "gable", "pitch": 35, "overhang": 0.4}}]})
post_sk("/_extra", {"binary_sensor.sk_fenster": {"state": "off", "attributes": {"friendly_name": "Dachfenster Studio", "device_class": "window"}}})
own_sk = []
pgS = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("console", lambda m: own_sk.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: own_sk.append("PAGEERROR " + str(e)))
pgS.goto(BASE + "?debug=1&mode=edit"); pgS.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgS.wait_for_timeout(800)
pgS.evaluate("() => { window.__fp.switchFloor(1); document.querySelector('#floorPanel').open = true; }"); pgS.wait_for_timeout(600)
roof_sk = lambda: pgS.evaluate("window.__fp.layout.floors[1].roof")
slope_sk = lambda: [m for m in pgS.evaluate("window.__fp.roofMeshes()") if m["tag"] == "main" and not m["part"]]
flash_sk = lambda: [m for m in pgS.evaluate("window.__fp.roofMeshes()") if m["part"] == "skylight-flashing"]
sky_walls = lambda: pgS.evaluate("window.__fp.layout.floors.map((f) => (f.dormerWalls || []).filter((w) => w.skylight).length)")

check("roof windows (#643): the roof floor's panel has the section „Dachfenster“ with „+ Dachfenster“",
      pgS.locator("#floorBody #skylightHead").inner_text() == "Dachfenster" and pgS.locator("#floorBody #addSkylight").inner_text() == "+ Dachfenster"
      and "ohne Gaube" in pgS.locator("#floorBody #skylightHelp").inner_text())
before = slope_sk()
pgS.click("#addSkylight"); pgS.wait_for_timeout(600)
r_sk = roof_sk(); s0 = (r_sk.get("skylights") or [{}])[0]
after = slope_sk()
check("roof windows: „+ Dachfenster“ puts one into side A, 78 × 118 cm, its lower edge about 1 m over the floor, a real window (one pane, hinged at the top, opening outwards)",
      len(r_sk.get("skylights") or []) == 1 and s0.get("side") == 0 and s0.get("w") == 0.78 and s0.get("h") == 1.18 and abs(s0.get("eave", 0) - 1.428) < 0.01
      and (s0.get("window") or {}).get("hinge") == "top" and s0["window"].get("openOutward") is True and pgS.locator(".skylightCard").count() == 1
      and pgS.input_value(".skylightCard .skylightSize") == "78x118" and "1,00 m" in pgS.locator(".skylightCard .skylightLow").inner_text(), s0)
check("roof windows: the slope gets a hole (cut into more pieces, the same outline) and a flashing round it",
      len(before) == 1 and len(after) == 1 and after[0]["tris"] > before[0]["tris"] and after[0]["box"] == before[0]["box"] and len(flash_sk()) == 1, (before, after, flash_sk()))
wid = s0["window"]["id"]
pose = pgS.evaluate(f"window.__fp.devPose('{wid}')")
check("roof windows: the window lies in the slope (tipped back to 35°), on the roof floor", pose and abs(pose["n"][1] - 0.574) < 0.02 and pose["n"][2] > 0.8
      and sky_walls() == [0, 1], (pose, sky_walls()))
pgS.select_option(".skylightCard .skylightSize", "114x140"); pgS.wait_for_timeout(500)
s1 = roof_sk()["skylights"][0]
check("roof windows: a usual size from the list (114 × 140 cm) sets width and height; the window follows", s1["w"] == 1.14 and s1["h"] == 1.4
      and s1["window"]["width"] == 1.14 and s1["window"]["height"] == 1.4, s1)
pgS.select_option(".skylightCard .skylightSide", "1"); pgS.wait_for_timeout(500)
pose_b = pgS.evaluate(f"window.__fp.devPose('{wid}')")
check("roof windows: on side B it lies in the other slope", roof_sk()["skylights"][0]["side"] == 1 and pose_b and pose_b["n"][2] < -0.8, pose_b)

# the 2D plan of the roof floor shows it
pgS.click("#view2d"); pgS.wait_for_timeout(600)
check("roof windows: the 2D plan of the roof floor shows the roof window", pgS.locator("#plan2d [data-skylight]").count() == 1)
pgS.click("#view3d"); pgS.wait_for_timeout(600)

# a real window: its contact makes it red and opens the pane outwards
pgS.evaluate("() => { const s = window.__fp.layout.floors[1].roof.skylights[0]; s.window.entity = 'binary_sensor.sk_fenster'; s.window.name = 'Dachfenster Studio'; window.__fp.rebuild(); window.__fp.applyStates(); }")
pgS.wait_for_timeout(500)
look_closed = pgS.evaluate(f"window.__fp.openLook('{wid}')")
set_sk("binary_sensor.sk_fenster", "on")
for _ in range(30):
    if pgS.evaluate(f"window.__fp.openLook('{wid}')") == "open": break
    pgS.wait_for_timeout(300)
check("roof windows: with its contact open the roof window turns red and its pane opens (the pill says 1 open)",
      look_closed == "closed" and pgS.evaluate(f"window.__fp.openLook('{wid}')") == "open" and pgS.evaluate(f"window.__fp.paneTargets('{wid}')")[0] != 0
      and "1" in pgS.locator("#openPill").inner_text(), (look_closed, pgS.evaluate(f"window.__fp.paneTargets('{wid}')"), pgS.locator("#openPill").inner_text()))
set_sk("binary_sensor.sk_fenster", "off")
pgS.evaluate(f"window.__fp.select('opening', '{wid}')"); pgS.wait_for_timeout(400)
check("roof windows: selected, its fields say that size and place are set on the roof (no width, height or sill here), the contact is there",
      "Dachfenster" in pgS.locator("#dormerWinHint").inner_text() and pgS.locator("#winOpenDir").count() == 1 and pgS.input_value("#winOpenDir") == "out")
pgS.keyboard.press("Delete"); pgS.wait_for_timeout(600)
check("roof windows: Delete takes the roof window off the roof, the hole and the flashing go", "skylights" not in roof_sk() and not flash_sk()
      and len(slope_sk()) == 1 and slope_sk()[0]["tris"] == before[0]["tris"] and sky_walls() == [0, 0], roof_sk())
pgS.click("#addSkylight"); pgS.wait_for_timeout(400)
pgS.select_option("#floorBody #roofType", "flat"); pgS.wait_for_timeout(500)
check("roof windows: a flat roof has none (they go with it) and says so", "skylights" not in roof_sk() and pgS.locator("#addSkylight").count() == 0
      and "Flachdach" in pgS.locator("#skylightHelp").inner_text(), roof_sk())
pgS.select_option("#floorBody #roofType", "shed"); pgS.wait_for_timeout(400)
pgS.click("#addSkylight"); pgS.wait_for_timeout(500)
check("roof windows: a shed roof has them in its one slope (no side to choose)", len(roof_sk().get("skylights") or []) == 1 and pgS.locator(".skylightCard .skylightSide").count() == 0
      and len(flash_sk()) == 1, roof_sk())
check("roof windows: no errors on the page", not own_sk, own_sk[:5])
pgS.close()
put_layout_sk(saved_sk)
post_sk("/_extra", {})
set_setting("language", st_sk.get("language", "de")); set_setting("units", st_sk.get("units", "metric"))
