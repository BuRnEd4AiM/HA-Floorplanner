"""Measuring (tool "Messen", key M, measuretool.js): M opens 2D + 3D and the side panel, two clicks on two parallel walls show the distance
between their faces and set it exactly (the wall moves, the walls joined to it and the room follow, undo takes it back), two walls in a
corner are set to an angle, two free points measure a distance, a click in the 3D view measures too, another tool ends the measurement.
"""
pgM = b.new_page(viewport={"width": 1500, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgM.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgM.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
units = api("api/settings")["units"]
set_setting("units", "metric")                # the base house leaves the units in feet: these checks read metres
pgM.goto(BASE + "?debug=1&mode=edit"); pgM.wait_for_timeout(1500)
# a floor of its own with one room, away from the test house: 6 x 4 m, walls 20 cm thick, the top wall drawn in two pieces
back = pgM.evaluate("window.__fp.floorIdx()")
pgM.evaluate("""() => { const fp = window.__fp, w = (id, a, b) => ({ id, a, b, thickness: 0.2, height: 2.6, openings: [] });
  fp.layout.floors.push({ id: 'msF', name: 'Messen', kind: 'floor', devices: [], stairs: [], blocks: [], holes: [],
    walls: [w('msT1', [40, 40], [43, 40]), w('msT2', [43, 40], [46, 40]), w('msR', [46, 40], [46, 44]), w('msB', [46, 44], [40, 44]), w('msL', [40, 44], [40, 40])],
    rooms: [{ id: 'msRoom', name: 'Messraum', color: '#8a7f70', points: [[40, 40], [46, 40], [46, 44], [40, 44]] }] });
  fp.switchFloor(fp.layout.floors.length - 1); fp.rebuild(); }""")
pgM.wait_for_timeout(300)
wall = lambda i: pgM.evaluate(f"window.__fp.layout.floors[window.__fp.floorIdx()].walls.find((w) => w.id === {i!r})")
info = lambda: pgM.evaluate("window.__fp.measure().info()")
at = lambda x, z: pgM.evaluate(f"window.__fp.plan().toClient({x}, {z})")
def zoom_room():
    """the plan shows the room in its middle (Fit): zoom in on it, so a click lands where it is meant"""
    pgM.click("#fitBtn"); pgM.wait_for_timeout(300)
    for _ in range(30):
        if at(46, 42)[0] - at(40, 42)[0] > 360: break
        pgM.mouse.move(*at(43, 42)); pgM.mouse.wheel(0, -200); pgM.wait_for_timeout(40)
    pgM.wait_for_timeout(200)
# --- M: the tool, 2D + 3D and its panel
pgM.click("#view3d"); pgM.wait_for_timeout(400)
pgM.mouse.click(700, 500); pgM.wait_for_timeout(200)
pgM.keyboard.press("m"); pgM.wait_for_timeout(600)
check("measure: the key M picks the measuring tool and opens 2D + 3D",
      pgM.evaluate("document.body.dataset.tool") == "measure" and pgM.is_visible("#plan2d") and pgM.evaluate("document.body.classList.contains('v-split')"),
      pgM.evaluate("[document.body.dataset.tool, document.body.className]"))
check("measure: the side panel shows the measuring section with its first hint", pgM.is_visible("#measurePanel") and "first point" in pgM.inner_text("#measureBody"), pgM.inner_text("#measurePanel"))
check("measure: the tool bar has the button, marked active", pgM.locator("#tools button[data-tool=measure].active").count() == 1)
pgM.click("#view2d"); pgM.wait_for_timeout(500)          # the clicks below in the wide 2D plan: the floor rail on the left covers part of a narrow one
check("measure: the tool stays on in the 2D plan alone", pgM.evaluate("document.body.dataset.tool") == "measure" and pgM.is_visible("#measurePanel"))
zoom_room()
# --- two parallel walls: the left and the right one
pgM.mouse.click(*at(40.06, 42)); pgM.wait_for_timeout(200)
check("measure: a click on a wall picks it", "second wall" in pgM.inner_text("#measureBody"), pgM.inner_text("#measureBody"))
pgM.mouse.move(*at(45.94, 42.5)); pgM.wait_for_timeout(150)
check("measure: while the second point is chosen the plan shows the line with its length", pgM.locator("#plan2d .msLabel").count() >= 1)
pgM.mouse.click(*at(45.94, 42)); pgM.wait_for_timeout(300)
i = info()
check("measure: two parallel walls: the line between their faces is 5.80 m, the clear distance 5.80 m, the middle lines 6 m",
      i and abs(i["line"]["len"] - 5.8) < 0.01 and i["pair"]["parallel"] and abs(i["pair"]["clear"] - 5.8) < 0.01 and abs(i["pair"]["center"] - 6) < 0.01, i)
check("measure: the panel shows 5.80 m and the fields for the distance, the plan the wall that moves",
      "5.80 m" in pgM.inner_text("#measureBody .msBig") and pgM.input_value("#msClear") == "5.8" and pgM.input_value("#msCenter") == "6"
      and pgM.locator("#plan2d .msMoves").count() == 1 and pgM.locator("#plan2d .msStay").count() == 1, pgM.inner_text("#measureBody"))
pgM.fill("#msClear", "4.5"); pgM.press("#msClear", "Enter"); pgM.wait_for_timeout(500)
r, t1, rb, rm = wall("msR"), wall("msT2"), wall("msB"), pgM.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].rooms.find((r) => r.id === 'msRoom').points")
check("measure: setting 4.50 m moves the right wall, the top and bottom walls and the room follow, the left one stays",
      r["a"] == [44.7, 40] and r["b"] == [44.7, 44] and t1["b"] == [44.7, 40] and rb["a"] == [44.7, 44] and rm[1] == [44.7, 40] and wall("msL")["a"] == [40, 44],
      (r, t1, rb, rm))
i = info()
check("measure: the panel and the measurement follow the moved wall", abs(i["pair"]["clear"] - 4.5) < 0.005 and "4.50 m" in pgM.inner_text("#measureBody .msBig"), (i, pgM.inner_text("#measureBody")))
pgM.fill("#msCenter", "5"); pgM.click("#msCenterSet"); pgM.wait_for_timeout(400)
check("measure: the distance between the middle lines can be set too", wall("msR")["a"] == [45, 40], wall("msR"))
pgM.keyboard.press("Escape"); pgM.wait_for_timeout(200)
check("measure: Esc ends the measurement", pgM.evaluate("window.__fp.measure().state()") is None and pgM.locator("#plan2d .msMoves").count() == 0)
pgM.keyboard.press("Control+z"); pgM.wait_for_timeout(300); pgM.keyboard.press("Control+z"); pgM.wait_for_timeout(400)
check("measure: undo takes both steps back", wall("msR")["a"] == [46, 40] and wall("msT2")["b"] == [46, 40], wall("msR"))
# --- swap: the other wall moves
pgM.mouse.click(*at(40.06, 42)); pgM.wait_for_timeout(150); pgM.mouse.click(*at(45.94, 42)); pgM.wait_for_timeout(300)
pgM.click("#msSwap"); pgM.wait_for_timeout(200)
pgM.fill("#msClear", "5"); pgM.press("#msClear", "Enter"); pgM.wait_for_timeout(400)
check("measure: '⇄' moves the other wall instead", wall("msL")["a"] == [40.8, 44] and wall("msR")["a"] == [46, 40], (wall("msL"), wall("msR")))
pgM.keyboard.press("Escape"); pgM.keyboard.press("Control+z"); pgM.wait_for_timeout(400)
# --- two walls in a corner: the angle
zoom_room()
pgM.mouse.click(*at(42, 43.94)); pgM.wait_for_timeout(150); pgM.mouse.click(*at(45.94, 42)); pgM.wait_for_timeout(300)
i = info()
check("measure: two walls in a corner: 90°, no distance fields, the angle in the plan",
      i and not i["pair"]["parallel"] and abs(i["pair"]["angle"] - 90) < 0.01 and pgM.locator("#msClear").count() == 0 and pgM.locator("#plan2d .msAngle").count() == 1, i)
pgM.fill("#msAngle", "120"); pgM.click("#msAngleSet"); pgM.wait_for_timeout(400)
r = wall("msR")
check("measure: setting 120° turns the right wall round the corner, as long as before, the top wall follows",
      abs(info()["pair"]["angle"] - 120) < 0.01 and r["b"] == [46, 44] and abs(((r["a"][0] - 46) ** 2 + (r["a"][1] - 44) ** 2) ** 0.5 - 4) < 0.001 and wall("msT2")["b"] == r["a"], (r, wall("msT2")))
pgM.keyboard.press("Escape"); pgM.keyboard.press("Control+z"); pgM.wait_for_timeout(400)
check("measure: undo brings the corner back to 90°", wall("msR")["a"] == [46, 40], wall("msR"))
# --- two free points (Alt: no snapping)
pgM.keyboard.down("Alt"); pgM.mouse.click(*at(42, 41)); pgM.mouse.click(*at(43, 41.5)); pgM.keyboard.up("Alt"); pgM.wait_for_timeout(300)
i = info()
check("measure: two free points: 1.12 m, no walls", i and abs(i["line"]["len"] - 1.118) < 0.02 and i["pair"] is None and "1.12 m" in pgM.inner_text("#measureBody .msBig"), i)
# --- the 3D view of 2D + 3D measures too
pgM.click("#viewSplit"); pgM.wait_for_timeout(600)
box = pgM.locator("#view").bounding_box()
pgM.mouse.click(box["x"] + box["width"] * 0.4, box["y"] + box["height"] * 0.6); pgM.wait_for_timeout(200)
pgM.mouse.click(box["x"] + box["width"] * 0.6, box["y"] + box["height"] * 0.6); pgM.wait_for_timeout(300)
i = info()
check("measure: two clicks in the 3D view measure a distance", i and i["line"]["len"] > 0.1, i)
# --- another tool ends it
pgM.keyboard.press("v"); pgM.wait_for_timeout(300)
check("measure: another tool ends the measurement and hides the panel", pgM.evaluate("window.__fp.measure().state()") is None and not pgM.is_visible("#measurePanel"))
pgM.evaluate(f"""() => {{ const fp = window.__fp; fp.layout.floors = fp.layout.floors.filter((f) => f.id !== 'msF'); fp.switchFloor({back}); fp.rebuild(); }}""")
pgM.wait_for_timeout(1500)                    # the house is saved again without the measuring floor
set_setting("units", units)
bad = [e for e in own if "favicon" not in e]
check("measure: no console errors", not bad, bad)
pgM.close()
