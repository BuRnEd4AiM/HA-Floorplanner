"""5.32.0, Mario's terraced house (#786): the outdoor steps at the front door also on lowered ground („⛰ Gelände“ → „＋ Außentreppe an die
Haustür“), their number of steps, the hand rail left / right / both / none and stainless with bars; „＋ Vordach über die Tür“ at the front door
(a canopy on two posts, its fields); a balcony under the house's roof („Hausdach reicht darüber“: the roof box reaches over it); the whole-house
view on a plot as narrow as the house (#794: the earth at the side was not cut open); the same in „✨ Neu“.
"""
saved_en = api_admin("api/layout")              # put back at the end
st_en = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_en(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
def ring_en(p, ops=None):
    sides = (([0, 0], [6, 0]), ([6, 0], [6, 11]), ([6, 11], [0, 11]), ([0, 11], [0, 0]))
    return [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": (ops or {}).get(i, [])} for i, (a, c) in enumerate(sides)]
room_en = lambda id_, name: {"id": id_, "name": name, "points": [[0, 0], [6, 0], [6, 11], [0, 11]]}
fl_en = lambda id_, name, kind, walls, rooms: {"id": id_, "name": name, "kind": kind, "walls": walls, "rooms": rooms, "devices": [], "blocks": [], "stairs": [], "holes": []}
put_layout_en({"version": 1,
  "plot": {"boundary": [[0, -7], [6, -7], [6, 20], [0, 20]],                                         # a terraced house: the plot as wide as the house
           "terrain": {"points": [{"id": "enT1", "x": 3, "z": -1, "h": -0.65}, {"id": "enT2", "x": 3, "z": 15, "h": -0.95}], "contours": 0.5}},
  "floors": [
    fl_en("enKG", "Keller", "basement", ring_en("ek"), [room_en("enK1", "Keller")]),
    fl_en("enEG", "EG", "floor", ring_en("ee", {0: [{"id": "enDoor", "type": "door", "name": "Haustür", "pos": 2.4, "width": 1.2, "height": 2.1, "sill": 0}]}), [room_en("enE1", "Flur")]),
    {**fl_en("enOG", "OG", "floor", ring_en("eo"), [room_en("enO1", "Schlafen")]),
     "rooms": [room_en("enO1", "Schlafen"), {"id": "enBal", "name": "Balkon", "terrace": True, "points": [[0, 11.15], [6, 11.15], [6, 12.5], [0, 12.5]]}]},
    {**fl_en("enDach", "Dach", "roof", [], []), "roof": {"type": "gable", "pitch": 40, "overhang": 0.4, "ridge": "x"}}]})
own_en = []
pgE = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgE.on("console", lambda m: own_en.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgE.on("pageerror", lambda e: own_en.append("PAGEERROR " + str(e)))
pgE.on("dialog", lambda d: d.accept())
pgE.goto(BASE + "?debug=1&mode=edit"); pgE.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgE.wait_for_timeout(800)
pgE.evaluate("() => window.__fp.switchFloor(1)"); pgE.wait_for_timeout(700)
if pgE.is_visible("#view2d"): pgE.click("#view2d"); pgE.wait_for_timeout(700)
devs = lambda fi=1: pgE.evaluate(f"window.__fp.layout.floors[{fi}].devices")
steps = lambda: next((d for d in devs() if d["type"] == "steps"), None)
porch = lambda: next((d for d in devs() if d["type"] == "porchroof"), None)

# ⛰ Gelände → „＋ Außentreppe an die Haustür“: 65 cm high, in front of the door, its landing at the wall
pgE.click("#tools [data-tool=plot]"); pgE.wait_for_timeout(600)
pgE.click("#plotMode [data-v=terrain]"); pgE.wait_for_timeout(700)
pgE.locator("#terrainSteps").scroll_into_view_if_needed(); pgE.click("#terrainSteps"); pgE.wait_for_timeout(900)
s0 = steps()
check("entrance: „＋ Außentreppe an die Haustür“ in „⛰ Gelände“ puts steps 65 cm high in front of the front door, turned outwards",
      s0 is not None and s0["h"] == 0.65 and s0["rot"] == 180 and abs(s0["x"] - 2.4) < 0.01 and abs(s0["z"] + 1.07) < 0.01, s0)
pgE.evaluate("() => window.__fp.select('device', window.__fp.layout.floors[1].devices.find((d) => d.type === 'steps').id)"); pgE.wait_for_timeout(700)
check("entrance: the steps' panel: „Stufen“ automatic (4), the hand rail on both sides",
      pgE.input_value("#stepsCount") == "" and "(4)" in pgE.inner_text("#stepsCount option:checked") and "active" in (pgE.get_attribute("#stepsRail [data-v=both]", "class") or ""),
      pgE.inner_text("#stepsCount option:checked"))
pgE.select_option("#stepsCount", "3"); pgE.wait_for_timeout(800)
s1 = steps()
check("entrance: 3 steps: stored, the steps moved 14 cm to the wall so their landing stays at it",
      s1.get("count") == 3 and abs(s1["z"] + 0.93) < 0.01 and "3 Stufen" in pgE.inner_text("#propsBody"), s1)
pgE.click("#stepsRail [data-v=left]"); pgE.wait_for_timeout(700)
pgE.click("#stepsRailLook [data-v=steel]"); pgE.wait_for_timeout(700)
s2 = steps()
check("entrance: hand rail left only, stainless with bars: stored, the line says which side is left",
      s2.get("rail") == "left" and s2.get("railLook") == "steel" and "hinaufschaut" in pgE.inner_text("#propsBody"), s2)
pgE.click("#stepsRail [data-v=none]"); pgE.wait_for_timeout(700)
check("entrance: no hand rail: stored, the look of the rail is gone", steps().get("rail") == "none" and pgE.locator("#stepsRailLook").count() == 0, steps())
pgE.click("#stepsRail [data-v=left]"); pgE.wait_for_timeout(600)

# „＋ Vordach über die Tür“ at the front door
pgE.click("#tools [data-tool=select]"); pgE.wait_for_timeout(400)
pgE.evaluate("() => window.__fp.select('opening', 'enDoor')"); pgE.wait_for_timeout(700)
check("entrance: the front door's panel has „＋ Vordach über die Tür“", pgE.locator("#porchAdd").count() == 1 and "Vordach" in pgE.inner_text("#porchBox"))
pgE.locator("#porchAdd").scroll_into_view_if_needed(); pgE.click("#porchAdd"); pgE.wait_for_timeout(900)
p0 = porch()
check("entrance: the canopy over the door: turned outwards, its back at the wall, 2.40 m wide, 2.40 m high, selected",
      p0 is not None and p0["rot"] == 180 and abs(p0["z"] + 0.75) < 0.01 and p0["w"] == 2.4 and p0["h"] == 2.4 and p0.get("door") == "enDoor"
      and pgE.locator("#porchW").count() == 1, p0)
pgE.fill("#porchD", "1.5"); pgE.dispatch_event("#porchD", "change"); pgE.wait_for_timeout(700)
p1 = porch()
check("entrance: canopy 1.5 m deep: it grows to the front, its back stays at the wall", p1.get("d") == 1.5 and abs(p1["z"] + 0.9) < 0.01, p1)
pgE.uncheck("#porchPosts"); pgE.wait_for_timeout(600)
pgE.click("#porchCover [data-v=glass]"); pgE.wait_for_timeout(600)
check("entrance: without posts, a glass roof: stored", porch().get("noPosts") is True and porch().get("cover") == "glass", porch())
pgE.evaluate("() => window.__fp.select('opening', 'enDoor')"); pgE.wait_for_timeout(600)
check("entrance: the door knows its canopy: „Vordach dieser Tür auswählen“", "auswählen" in pgE.inner_text("#porchAdd"), pgE.inner_text("#porchAdd"))
up_porch = pgE.evaluate("(() => { let y = null; window.__fp.scene.traverse((o) => { if (o.userData && o.userData.id && o.userData.id === window.__fp.layout.floors[1].devices.find((d) => d.type === 'porchroof').id) y = o.position.y; }); return y; })()")
check("entrance: in 3D the canopy is there (not moved down with the lowered ground)", up_porch is not None and up_porch > -0.3, up_porch)

# a balcony under the house's roof
box0 = pgE.evaluate("window.__fp.roofBox(3)")
pgE.evaluate("() => window.__fp.switchFloor(2)"); pgE.wait_for_timeout(600)
pgE.evaluate("() => window.__fp.select('room', 'enBal')"); pgE.wait_for_timeout(700)
check("balcony under the roof: the open room has „Hausdach reicht darüber“, off", pgE.locator("#roomRoofOver").count() == 1 and not pgE.is_checked("#roomRoofOver"))
pgE.check("#roomRoofOver"); pgE.wait_for_timeout(800)
bal = next(r for r in pgE.evaluate("window.__fp.layout.floors[2].rooms") if r["id"] == "enBal")
box1 = pgE.evaluate("window.__fp.roofBox(3)")
check("balcony under the roof: stored, the roof reaches over it (its box to z 12.5, before 11)",
      bal.get("roofOver") is True and abs(box0["z1"] - 11) < 0.01 and abs(box1["z1"] - 12.5) < 0.01, (box0, box1))

# the whole-house view on a plot as narrow as the house (#794): seen from the side the earth there is cut open too
pgE.evaluate("window.__fp.setHouseMode(true)"); pgE.wait_for_timeout(900)
pgE.evaluate("window.__fp.camAt(25, 6, 5.5, 3, 5.5)"); pgE.wait_for_timeout(1200)
e_side = pgE.evaluate("window.__fp.earthDbg()")
check("whole house, narrow plot (#794): from the side the cut lies inside the plot's edge (x < 6), so the earth there is taken away",
      e_side["cut"] and abs(e_side["n"][0] + 1) < 1e-6 and e_side["c"] < 6 and e_side["c"] > 5.5, e_side)
pgE.evaluate("window.__fp.setHouseMode(false)"); pgE.wait_for_timeout(400)

# ✨ Neu: the door's section „Vordach“, the steps' fields; the search finds „Vordach“
pgE.goto(BASE + "?debug=1&mode=edit&ui=2"); pgE.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgE.wait_for_timeout(1000)
pgE.evaluate("() => window.__fp.switchFloor(1)"); pgE.wait_for_timeout(600)
pgE.evaluate("() => window.__fp.select('opening', 'enDoor')"); pgE.wait_for_timeout(800)
check("entrance / ✨ Neu: the front door has the section „Vordach“",
      pgE.evaluate("document.body.classList.contains('uiV2')") and pgE.locator("[data-sec=porch]").count() > 0 and pgE.locator("#porchAdd").count() == 1,
      pgE.evaluate("[...document.querySelectorAll('[data-sec]')].map((s) => s.dataset.sec)"))
pgE.fill("#v2Search", "Vordach"); pgE.wait_for_timeout(600)
check("entrance / ✨ Neu: „🔍 Einstellung suchen“ finds „Vordach“", pgE.is_visible("#porchAdd") and "Treffer" in pgE.inner_text("#v2SearchRes"), pgE.inner_text("#v2SearchRes"))
pgE.fill("#v2Search", ""); pgE.wait_for_timeout(300)
pgE.evaluate("() => window.__fp.select('device', window.__fp.layout.floors[1].devices.find((d) => d.type === 'steps').id)"); pgE.wait_for_timeout(800)
check("entrance / ✨ Neu: the steps' „Stufen“ and „Geländer“ are in the section ⚙️ (special)",
      pgE.locator("[data-sec=special] #stepsCount").count() == 1 and pgE.locator("[data-sec=special] #stepsRail").count() == 1,
      pgE.evaluate("[...document.querySelectorAll('[data-sec]')].map((s) => s.dataset.sec)"))
pgE.fill("#v2Search", "Geländer"); pgE.wait_for_timeout(600)
check("entrance / ✨ Neu: „🔍 Einstellung suchen“ finds „Geländer“ of the steps", pgE.is_visible("#stepsRail"), pgE.inner_text("#v2SearchRes"))
pgE.fill("#v2Search", ""); pgE.wait_for_timeout(300)
pgE.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel

check("entrance: no errors on the page", not own_en, own_en[:5])
pgE.close()
put_layout_en(saved_en)
set_setting("language", st_en.get("language", "de")); set_setting("units", st_en.get("units", "metric"))
