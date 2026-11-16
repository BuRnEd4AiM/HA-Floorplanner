"""5.14.0, the plateau and the buildings (the owner): a balcony upstairs that reaches out beyond the plateau goes up with the house („ich
glaube das liegt daran, dass unten ein Plateau ist“: it stayed 60 cm lower); a plateau goes with the building of the rooms on it („…bleibt
aber das Plateau stehen“), the steps on it too; every area of the plot (the lawn …) can belong to a building and then shows only with it
(„ich möchte, dass zum Beispiel der Rasen zu einem Gebäude gehört“), in the panel of the buildings and at the area itself; a garage beside
the house on the plateau: „🚗 Steht unten auf dem Rasen“ cuts it out of the plateau („bei Garagen sollte das ja bis zum Boden gehen“).
"""
saved_pm = api_admin("api/layout")              # put back at the end
st_pm = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_pm(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
def ring_pm(p, x0, z0, x1, z1):
    sides = (([x0, z0], [x1, z0]), ([x1, z0], [x1, z1]), ([x1, z1], [x0, z1]), ([x0, z1], [x0, z0]))
    return [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": []} for i, (a, c) in enumerate(sides)]
garage_walls = [{"id": "gg0", "a": [10, 0], "b": [16, 0], "thickness": 0.3, "height": 2.6, "openings": []},
                {"id": "gg1", "a": [16, 0], "b": [16, 5], "thickness": 0.3, "height": 2.6, "openings": []},
                {"id": "gg2", "a": [16, 5], "b": [10, 5], "thickness": 0.3, "height": 2.6, "openings": []}]
put_layout_pm({"version": 1, "buildings": [{"id": "bH", "name": "Haus"}, {"id": "bG", "name": "Garten"}],
  "plot": {"areas": [{"id": "pmPl", "name": "Plateau", "surface": "slabs", "rise": 0.6, "edge": "wall", "wall": "stone",
                      "points": [[-0.35, -0.35], [16.35, -0.35], [16.35, 7.35], [-0.35, 7.35]]},     # a box round the house and the garage
                     {"id": "pmLawn", "name": "", "surface": "lawn", "points": [[19, -2], [27, -2], [27, 6], [19, 6]]}]},
  "floors": [
    {"id": "pmEG", "name": "EG", "kind": "floor", "walls": ring_pm("hw", 0, 0, 10, 7) + garage_walls + ring_pm("gw", 20, 0, 24, 4),
     "rooms": [{"id": "pmWo", "name": "Wohnen", "points": [[0, 0], [10, 0], [10, 7], [0, 7]], "building": "bH"},
               {"id": "pmGa", "name": "Raum 6", "points": [[10, 0], [16, 0], [16, 5], [10, 5]], "building": "bH"},
               {"id": "pmGh", "name": "Gartenhaus", "points": [[20, 0], [24, 0], [24, 4], [20, 4]], "building": "bG"}],
     "devices": [{"id": "pmSteps", "type": "steps", "name": "Treppe", "x": 5, "z": -0.9, "y": 0, "rot": 0, "scale": 1, "h": 0.6, "w": 1.4, "land": 1, "entity": ""}],
     "blocks": [], "stairs": []},
    {"id": "pmOG", "name": "OG", "kind": "floor", "walls": ring_pm("ow", 0, 0, 10, 7),
     "rooms": [{"id": "pmSz", "name": "Schlafen", "points": [[0, 0], [10, 0], [10, 7], [0, 7]]},
               {"id": "pmOB", "name": "Balkon oben", "points": [[3, -1.8], [7, -1.8], [7, -0.15], [3, -0.15]], "terrace": True}],
     "devices": [], "blocks": [], "stairs": []}]})
own_pm = []
pgM = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgM.on("console", lambda m: own_pm.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgM.on("pageerror", lambda e: own_pm.append("PAGEERROR " + str(e)))
pgM.on("dialog", lambda d: d.accept())
pgM.goto(BASE + "?debug=1&mode=edit"); pgM.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgM.wait_for_timeout(800)
pgM.evaluate("() => window.__fp.switchFloor(1)"); pgM.wait_for_timeout(500)
if pgM.is_visible("#view2d"): pgM.click("#view2d"); pgM.wait_for_timeout(900)
floor_y = lambda id_: pgM.evaluate(f"""(() => {{ let y = null; window.__fp.scene.traverse((o) => {{ if (y === null && o.userData && o.userData.kind === 'room' && o.userData.id === '{id_}') {{
  const v = o.getWorldPosition(o.position.clone()); y = v.y; }} }}); return y; }})()""")
ys = (floor_y("pmSz"), floor_y("pmOB"))
lifts = pgM.evaluate("[...document.querySelectorAll('#plan2d text.roomLift')].map((e) => e.textContent)")
check("plateau: a balcony upstairs reaching out beyond the plateau lies as high as the rooms on it (not 60 cm lower), the 2D plan says +0.60 m for both",
      None not in ys and abs(ys[0] - ys[1]) < 0.02 and len([x for x in lifts if "0,60" in x or "0.60" in x]) == 2, (ys, lifts))

pgM.evaluate("() => window.__fp.switchFloor(0)"); pgM.wait_for_timeout(600)
meshes = lambda tag, val: pgM.evaluate("""([tag, val]) => { let n = 0; window.__fp.scene.traverse((m) => { if (m.isMesh && m.userData && (val === null ? m.userData[tag] : m.userData[tag] === val)) n++; }); return n; }""", [tag, val])
plateau_n = lambda: meshes("plateau", None) + meshes("yard", "pmPl")
steps_shown = lambda: pgM.evaluate("(() => { let s = false; window.__fp.scene.traverse((o) => { if (o.userData && o.userData.kind === 'device' && o.userData.id === 'pmSteps') s = true; }); return s; })()")
check("plateau: with all buildings shown the plateau, its steps and the lawn are there", plateau_n() > 0 and steps_shown() and meshes("yard", "pmLawn") > 0)
pgM.select_option("#buildingSelect", "bG"); pgM.wait_for_timeout(1200)
check("plateau: the building „Garten“ alone: the plateau under „Haus“ and its steps are gone with it, the lawn (no building) stays",
      plateau_n() == 0 and not steps_shown() and meshes("yard", "pmLawn") > 0, (plateau_n(), steps_shown(), meshes("yard", "pmLawn")))
pgM.select_option("#buildingSelect", "bH"); pgM.wait_for_timeout(1200)
check("plateau: the building „Haus“ alone: its plateau and steps show", plateau_n() > 0 and steps_shown())
pgM.select_option("#buildingSelect", ""); pgM.wait_for_timeout(800)

# the panel of the buildings: every area of the plot, a plateau automatic with its building
pgM.evaluate("document.querySelector('#buildingPanel').open = true"); pgM.wait_for_timeout(500)
pl_pick, lawn_pick = pgM.locator("#buildingBody select[data-yard=pmPl]"), pgM.locator("#buildingBody select[data-yard=pmLawn]")
check("areas: the panel of the buildings lists the plateau („automatisch (Haus)“) and the lawn („Alle Gebäude“)",
      pl_pick.count() == 1 and pl_pick.input_value() == "" and "Haus" in pl_pick.locator("option").first.inner_text()
      and lawn_pick.count() == 1 and "Alle Gebäude" in lawn_pick.locator("option").first.inner_text(), (pl_pick.count(), lawn_pick.count()))
pgM.select_option("#buildingBody select[data-yard=pmLawn]", "bH"); pgM.wait_for_timeout(500)
pgM.evaluate("document.querySelector('#buildingPanel').open = false")
pgM.select_option("#buildingSelect", "bG"); pgM.wait_for_timeout(1200)
check("areas: the lawn given to „Haus“ is gone when „Garten“ is shown", meshes("yard", "pmLawn") == 0 and next(a for a in pgM.evaluate("window.__fp.layout.plot.areas") if a["id"] == "pmLawn").get("building") == "bH")
pgM.select_option("#buildingSelect", ""); pgM.wait_for_timeout(800)
pgM.evaluate("() => window.__fp.select('yard', 'pmLawn')"); pgM.wait_for_timeout(600)
check("areas: the side panel of the lawn has „Gebäude“ with „Haus“ chosen", pgM.is_visible("#yardBuilding") and pgM.locator("#yardBuilding").input_value() == "bH")
pgM.select_option("#yardBuilding", ""); pgM.wait_for_timeout(500)
check("areas: back to „Alle Gebäude“ there: nothing stored", "building" not in next(a for a in pgM.evaluate("window.__fp.layout.plot.areas") if a["id"] == "pmLawn"))

# the garage beside the house: „🚗 Steht unten auf dem Rasen“
garage_y = lambda: floor_y("pmGa")
y_before = garage_y()
pgM.evaluate("() => window.__fp.select('room', 'pmGa')"); pgM.wait_for_timeout(600)
check("garage: on the plateau it lies 60 cm up; the room has „🚗 Steht unten auf dem Rasen“", y_before is not None and abs(y_before - 0.6) < 0.05 and pgM.is_visible("#roomOnGround"), y_before)
pgM.check("#roomOnGround"); pgM.wait_for_timeout(900)
pl = next(a for a in pgM.evaluate("window.__fp.layout.plot.areas") if a["id"] == "pmPl")
xs = [p[0] for p in pl["points"]]
check("garage: ticked: its floor lies on the lawn, the plateau ends at the house (cut out under the garage), the status line says so",
      abs(garage_y() - floor_y("pmWo") + 0.6) < 0.05 and abs(garage_y()) < 0.05 and max(xs) < 10.5 and "Rasen" in pgM.inner_text("#status"),
      (garage_y(), pl["points"], pgM.inner_text("#status")))
pgM.uncheck("#roomOnGround"); pgM.wait_for_timeout(900)
pl = next(a for a in pgM.evaluate("window.__fp.layout.plot.areas") if a["id"] == "pmPl")
check("garage: the tick off: back on the plateau", abs(garage_y() - 0.6) < 0.05 and max(p[0] for p in pl["points"]) > 16, pl["points"])

check("plateau and areas: no errors on the page", not own_pm, own_pm[:5])
pgM.close()
put_layout_pm(saved_pm)
set_setting("language", st_pm.get("language", "de")); set_setting("units", st_pm.get("units", "metric"))
