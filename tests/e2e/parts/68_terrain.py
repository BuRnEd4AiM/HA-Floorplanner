"""4.58.0 (#629, asked by christinloehner): a plot on a slope. The tool "Grundstück", mode "⛰ Gelände": "Hang in einem Schritt" (the
ground falls one storey from the far face of the house to the side tapped), spot heights set by a tap, typed in, dragged and removed, the
contour lines of the plan; in 3D the lawn and the earth follow the ground (the basement stands free in front), the part without a basement
gets a plinth, garden things and areas follow the ground, a lamp on the facade and the furniture inside stay, a plateau stays level.
"""
tr_saved = api_admin("api/layout")
st_tr = api("api/settings")
set_setting("language", "de")
set_setting("units", "metric")                # the base house leaves the units in feet: these checks type metres
def put_layout_tr(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT", headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})).read()
def ring_tr(p, x1, z1, ops=None):
    sides = (([0, 0], [x1, 0]), ([x1, 0], [x1, z1]), ([x1, z1], [0, z1]), ([0, z1], [0, 0]))
    return [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": (ops or {}).get(i, [])} for i, (a, c) in enumerate(sides)]
garage = [{"id": "tg0", "a": [10, 0], "b": [14, 0], "thickness": 0.24, "height": 2.6, "openings": []}, {"id": "tg1", "a": [14, 0], "b": [14, 6], "thickness": 0.24, "height": 2.6, "openings": []},
          {"id": "tg2", "a": [14, 6], "b": [10, 6], "thickness": 0.24, "height": 2.6, "openings": []}]
put_layout_tr({"version": 1, "plot": {"boundary": [[-6, -6], [20, -6], [20, 14], [-6, 14]], "areas": [
        {"id": "tPath", "name": "Weg", "surface": "slabs", "points": [[-2, -6], [-1, -6], [-1, 10], [-2, 10]]},
        {"id": "tTer", "name": "Terrasse", "surface": "deck", "points": [[-5.5, 1], [-3, 1], [-3, 4], [-5.5, 4]], "rise": 0.05, "edge": "wall", "wall": "stone"}]},
    "floors": [
    {"id": "tKG", "name": "Keller", "kind": "basement", "walls": ring_tr("tk", 10, 7, {0: [{"id": "tGate", "type": "door", "style": "garage", "pos": 6, "width": 2.5, "height": 2.1, "sill": 0}]}),
     "rooms": [{"id": "tk0", "name": "Garage", "points": [[0, 0], [10, 0], [10, 7], [0, 7]]}], "devices": [], "blocks": [], "stairs": []},
    {"id": "tEG", "name": "EG", "kind": "floor", "walls": ring_tr("te", 10, 7) + garage,
     "rooms": [{"id": "te0", "name": "Wohnen", "points": [[0, 0], [10, 0], [10, 7], [0, 7]]}, {"id": "te1", "name": "Carport", "points": [[10, 0], [14, 0], [14, 6], [10, 6]]}],
     "devices": [{"id": "tTree", "type": "tree", "x": 5, "z": -4, "y": 0, "rot": 0, "scale": 1, "name": "Baum", "entity": ""},
                 {"id": "tLamp", "type": "light", "x": 3, "z": -0.3, "y": 1.9, "rot": 0, "scale": 1, "name": "Außenlampe", "entity": ""},
                 {"id": "tSofa", "type": "sofa", "x": 4, "z": 4, "y": 0, "rot": 0, "scale": 1, "name": "Sofa", "entity": ""},
                 {"id": "tGrill", "type": "grill_kettle", "x": -4, "z": 2.5, "y": 0, "rot": 0, "scale": 1, "name": "Grill", "entity": ""}], "blocks": [], "stairs": []}]})
pgT = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
tr_errs = []
pgT.on("console", lambda m: tr_errs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgT.on("pageerror", lambda e: tr_errs.append("PAGEERROR " + str(e)))
pgT.goto(BASE + "?debug=1&mode=edit"); pgT.wait_for_timeout(2500)
pgT.evaluate("() => window.__fp.switchFloor(1)"); pgT.wait_for_timeout(400)
terr = lambda: (pgT.evaluate("window.__fp.layout.plot") or {}).get("terrain")
at_tr = lambda x, z: pgT.evaluate(f"window.__fp.terrainAt({x}, {z})")
pose = lambda i: pgT.evaluate(f"window.__fp.devPose('{i}')") or {}
earth_tr = lambda: pgT.evaluate("window.__fp.earthDbg()")
def click_plan(x, z):
    px, py = pgT.evaluate(f"window.__fp.plan().toClient({x}, {z})")
    pgT.mouse.click(px, py)
yard_box = lambda yid: pgT.evaluate(f"""(() => {{ let r = null; window.__fp.scene.traverse((o) => {{ if (!r && o.isMesh && o.userData && o.userData.yard === '{yid}') {{
  o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; r = [bb.min.y + o.position.y, bb.max.y + o.position.y]; }} }}); return r; }})()""")
plat_box = lambda: pgT.evaluate("""(() => { const r = {}; window.__fp.scene.traverse((o) => { if (o.isMesh && o.userData && o.userData.plateau) {
  o.geometry.computeBoundingBox(); r[o.userData.edge] = [+(o.geometry.boundingBox.min.y + o.position.y).toFixed(2), +(o.geometry.boundingBox.max.y + o.position.y).toFixed(2)]; } }); return r; })()""")

check("terrain: level before: no spot heights, the lawn flat, the tree on the lawn", terr() is None and not earth_tr().get("sloped") and abs(pose("tTree").get("y", 9)) < 0.02, (terr(), pose("tTree")))
pgT.click("#view2d"); pgT.wait_for_timeout(700)
pgT.click("button[data-tool=plot]"); pgT.wait_for_timeout(500)
pgT.click("#plotMode [data-v=terrain]"); pgT.wait_for_timeout(400)
check("terrain: the tool 'Grundstück' has the mode '⛰ Gelände' with its fields and its hint", pgT.is_visible("#terrainPal") and pgT.is_visible("#terrainSlopeGo")
      and not pgT.is_visible("#yardList") and "Höhenpunkt" in pgT.inner_text("#hintText"), pgT.inner_text("#terrainPal")[:200])
pgT.fill("#terrainDrop", "3"); pgT.locator("#terrainDrop").dispatch_event("change")
pgT.click("#terrainSlopeGo"); pgT.wait_for_timeout(200)
check("terrain: 'Tiefe Seite antippen' waits for the tap in the plan", "tiefer" in pgT.inner_text("#hintText"), pgT.inner_text("#hintText"))
click_plan(3, -4.5); pgT.wait_for_timeout(1200)
pts = (terr() or {}).get("points") or []
check("terrain: a slope in one step: 0 at the far face of the house, 3 m lower at the near one, square to the house (the tap lay to the side)",
      len(pts) == 2 and pts[0]["h"] == 0 and pts[1]["h"] == -3 and pts[0]["x"] == pts[1]["x"] and pts[0]["z"] > 7 and -0.3 < pts[1]["z"] < 0, pts)
check("terrain: in front of the house the ground lies 3 m lower, behind it level with the ground floor", abs(at_tr(5, -4) + 3) < 0.01 and abs(at_tr(5, 12)) < 0.01, (at_tr(5, -4), at_tr(5, 12)))
nlines = lambda: pgT.evaluate("document.querySelectorAll('#plan2d .terrainLines path').length")
check("terrain: the plan shows the contour lines every 0.5 m and the two spot heights", nlines() == 5 and pgT.locator("#plan2d .terrainPoint").count() == 2
      and pgT.locator("#terrainList .terrainRow").count() == 2, (nlines(), pgT.locator("#plan2d .terrainPoint").count()))
pgT.click("#view3d"); pgT.wait_for_timeout(1200)
e = earth_tr()
check("terrain: 3D: the ground follows the slope, the part without a basement stands on a plinth", e.get("sloped") and e.get("plinths") == 1, e)
check("terrain: 3D: the tree in front stands 3 m lower, the lamp on the facade and the sofa inside stay where they are",
      abs(pose("tTree").get("y", 0) + 3) < 0.03 and abs(pose("tLamp").get("y", 0) - 1.9) < 0.03 and abs(pose("tSofa").get("y", 9)) < 0.03, (pose("tTree"), pose("tLamp"), pose("tSofa")))
yb = yard_box("tPath") or [0, 0]
check("terrain: 3D: the path runs down the slope, the terrace stays level (a plateau), its wall reaches down to the ground",
      yb[0] < -2.9 and yb[1] > -0.1 and (yard_box("tTer") or [9, 9])[1] - (yard_box("tTer") or [0, 9])[0] < 0.01 and plat_box().get("wall", [0, 0])[0] < -1
      and abs(pose("tGrill").get("y", 9) - 0.05) < 0.03, (yb, yard_box("tTer"), plat_box(), pose("tGrill")))
pgT.evaluate("window.__fp.setHouseMode(true)"); pgT.wait_for_timeout(900)
pgT.evaluate("window.__fp.camAt(5, 6, -25, 5, 3)"); pgT.wait_for_timeout(900)
cut_front = earth_tr()
pgT.evaluate("window.__fp.camAt(5, 6, 30, 5, 3)"); pgT.wait_for_timeout(900)
cut_back = earth_tr()
check("terrain: whole house: no cut through the earth in front (the basement stands free there, the front garden stays), a cut at the back",
      not cut_front.get("capVisible") and cut_front.get("n") == [0, 1, 0] and cut_back.get("capVisible") and cut_back.get("capVerts", 0) >= 6, (cut_front, cut_back))
pgT.evaluate("window.__fp.setHouseMode(false)"); pgT.wait_for_timeout(600)
pgT.click("#view2d"); pgT.wait_for_timeout(600)
low = pts[1]["id"]
pgT.fill(f"#terrainH_{low}", "-2"); pgT.locator(f"#terrainH_{low}").dispatch_event("change"); pgT.wait_for_timeout(800)
check("terrain: a height typed in: in front the ground lies 2 m lower now", abs(at_tr(5, -4) + 2) < 0.01, at_tr(5, -4))
pgT.click("#terrainContours [data-v='1']"); pgT.wait_for_timeout(500)
check("terrain: contour lines every metre: one line (−1 m)", terr().get("contours") == 1 and nlines() == 1, (terr().get("contours"), nlines()))
click_plan(17, 10); pgT.wait_for_timeout(800)
pts = terr()["points"]
check("terrain: a tap in the plan sets a third spot height at the height the ground has there, its field gets the cursor",
      len(pts) == 3 and pts[2]["x"] == 17 and pts[2]["z"] == 10 and pts[2]["h"] == 0 and pgT.evaluate("document.activeElement && document.activeElement.id") == f"terrainH_{pts[2]['id']}", pts)
x1, y1 = pgT.evaluate("window.__fp.plan().toClient(17, 10)"); x2, y2 = pgT.evaluate("window.__fp.plan().toClient(16, 12)")
pgT.mouse.move(x1, y1); pgT.mouse.down(); pgT.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, steps=4); pgT.mouse.move(x2, y2, steps=4); pgT.mouse.up(); pgT.wait_for_timeout(800)
p3 = terr()["points"][2]
check("terrain: a spot height can be dragged in the plan", abs(p3["x"] - 16) < 0.3 and abs(p3["z"] - 12) < 0.3, p3)
pgT.click(f"#terrainList [data-tpoint='{p3['id']}'] .terrainDel"); pgT.wait_for_timeout(600)
check("terrain: ✕ removes a spot height", len(terr()["points"]) == 2 and pgT.locator("#terrainList .terrainRow").count() == 2, terr())
pgT.click("#terrainClear"); pgT.wait_for_timeout(1000)
pgT.click("#view3d"); pgT.wait_for_timeout(1000)
e = earth_tr()
check("terrain: 'Gelände entfernen': level again, no plinth, the tree back on the lawn", terr() is None and not e.get("sloped") and not e.get("plinths")
      and abs(pose("tTree").get("y", 9)) < 0.02, (terr(), e, pose("tTree")))
# #691: a basement half out of the ground: "Etage verwalten" of the basement points to the terrain, its button opens it, one spot height on
# level ground lowers the whole lawn
pgT.evaluate("window.__fp.switchFloor(0)"); pgT.wait_for_timeout(700)
pgT.evaluate("() => { const d = document.querySelector('#floorPanel'); if (d) d.open = true; }"); pgT.wait_for_timeout(300)
check("terrain: 'Etage verwalten' of the basement: a line about a basement half out of the ground and the button '⛰ Gelände einstellen' (#691)",
      pgT.is_visible("#halfBasementHelp") and "halb aus der Erde" in pgT.inner_text("#halfBasementHelp") and pgT.is_visible("#halfBasementGo")
      and "Gelände" in pgT.inner_text("#halfBasementGo"), pgT.inner_text("#floorBody")[-400:])
pgT.click("#halfBasementGo"); pgT.wait_for_timeout(1200)
check("terrain: the button opens the ground floor, the plan and the tool 'Grundstück' in the mode '⛰ Gelände'; the ground floor has no such line",
      pgT.evaluate("window.__fp.floorIdx()") == 1 and pgT.evaluate("document.body.dataset.tool") == "plot" and pgT.is_visible("#plan2d")
      and pgT.locator("#plotMode [data-v=terrain].active").count() == 1 and pgT.is_visible("#terrainPal") and not pgT.is_visible("#halfBasementHelp"),
      (pgT.evaluate("window.__fp.floorIdx()"), pgT.evaluate("document.body.dataset.tool")))
check("terrain: its help says that one point on level ground lowers the whole lawn", "ebenem Grund" in pgT.inner_text("#terrainPal"), pgT.inner_text("#terrainPal")[:300])
click_plan(3, -3); pgT.wait_for_timeout(800)
one = (terr() or {}).get("points") or [{}]
pgT.fill(f"#terrainH_{one[0].get('id')}", "-1.5"); pgT.locator(f"#terrainH_{one[0].get('id')}").dispatch_event("change"); pgT.wait_for_timeout(900)
check("terrain: one spot height at −1.5 m: the whole lawn lies 1.5 m lower, in front, behind and beside the house",
      len(one) == 1 and all(abs(at_tr(x, z) + 1.5) < 0.01 for x, z in ((5, -4), (5, 12), (-5, 3), (18, 3))), [at_tr(x, z) for x, z in ((5, -4), (5, 12), (-5, 3), (18, 3))])
pgT.click("#view3d"); pgT.wait_for_timeout(1200)
e = earth_tr()
check("terrain: 3D: the ground follows (1.5 m lower), the tree stands on it, the sofa inside stays", e.get("sloped") and abs(pose("tTree").get("y", 0) + 1.5) < 0.03
      and abs(pose("tSofa").get("y", 9)) < 0.03, (e, pose("tTree"), pose("tSofa")))
pgT.click("#view2d"); pgT.wait_for_timeout(600)
pgT.click("#terrainClear"); pgT.wait_for_timeout(800)
check("terrain: no errors on the page", not tr_errs, tr_errs[:5])
pgT.close()
put_layout_tr(tr_saved)
for k in ("language", "units"):
    set_setting(k, st_tr.get(k))
