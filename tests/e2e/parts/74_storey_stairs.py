"""4.68.0 (#671, asked by Oely99: „FLOOR_H is fixed at 3.0 m … My real stair has 14 steps; the real floor-to-floor height is about
2.75 m“ and „L stair with winders at both ends … unten und oben viertelgewendelt“): the storey height of a house („Geschosshöhe“ in
„Etage verwalten“) stacks the floors and gives the stairs their steps; a stair can have its own „Stufen je Etage“; an L stair turns a second
time with „2. Ecke“, and with winders it can start right away with them („Stufen im 1. Lauf“ 0).
"""
own_sh = []
lang_sh, units_sh = api("api/settings").get("language", ""), api("api/settings").get("units", "metric")   # base.py may leave feet
saved_sh = api_admin("api/layout")
pgSH = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgSH.on("pageerror", lambda e: own_sh.append("PAGEERROR " + str(e)))
set_setting("language", "de"); set_setting("units", "metric")


def wait_sh(fn, n=40, ms=250):
    for _ in range(n):
        v = fn()
        if v:
            return v
        pgSH.wait_for_timeout(ms)
    return fn()


def put_sh(sel, val):
    pgSH.fill(sel, str(val)); pgSH.locator(sel).dispatch_event("change"); pgSH.wait_for_timeout(450)


pgSH.goto(BASE + "?debug=1&mode=edit"); pgSH.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgSH.wait_for_timeout(800)
pgSH.evaluate("""(() => { const L = window.__fp.layout, room = (id) => ({ id, name: 'Flur', color: '#8a7f70', points: [[0, 0], [6, 0], [6, 5], [0, 5]] });
  delete L.storeyHeight;
  L.floors = [{ id: 'sh0', name: 'EG', kind: 'floor', walls: [], rooms: [room('shr0')], devices: [], blocks: [], holes: [], stairs: [
      { id: 'shS', name: 'Reihenhaus', type: 'L', x: 1, z: 0.6, rot: 0, w: 0.95, tread: 0.27, turn: 'right', dir: 'up', floors: 1 }] },
    { id: 'sh1', name: 'OG', kind: 'floor', walls: [], rooms: [room('shr1')], devices: [], blocks: [], holes: [], stairs: [] }];
  window.__fp.switchFloor(0); window.__fp.rebuild(); })()""")
pgSH.wait_for_timeout(600)
geo_sh = lambda: pgSH.evaluate("window.__fp.stairGeo('shS')")
st_sh = lambda: pgSH.evaluate("window.__fp.layout.floors[0].stairs.find(s => s.id === 'shS')")
elev_sh = lambda: pgSH.evaluate("window.__fp.elev(1)")
check("storey height (#671): without it a storey is 3 m and a stair has 16 steps, as before", abs(elev_sh() - 3) < 1e-6 and geo_sh()["treads"] == 16, (elev_sh(), geo_sh()))

pgSH.evaluate("() => { document.querySelector('#floorPanel').open = true; }"); pgSH.wait_for_timeout(400)
check("storey height: „Etage verwalten“ has the field „Geschosshöhe (ganzes Haus)“ with 3 m and a help line",
      pgSH.locator("#floorBody #storeyHeight").input_value() == "3" and "Geschosshöhe" in pgSH.locator("#floorBody").inner_text()
      and "Boden zu Boden" in pgSH.locator("#floorBody #storeyHelp").inner_text(), pgSH.locator("#floorBody").inner_text()[:300])
put_sh("#floorBody #storeyHeight", "2.75")
check("storey height: 2.75 m is stored on the house, the upper floor stands 2.75 m higher, the stair has 14 steps up to it",
      pgSH.evaluate("window.__fp.layout.storeyHeight") == 2.75 and abs(elev_sh() - 2.75) < 1e-6 and geo_sh()["treads"] == 14 and abs(geo_sh()["top"] - 14 * 2.75 / 15) < 1e-6,
      (pgSH.evaluate("window.__fp.layout.storeyHeight"), elev_sh(), geo_sh()))
check("storey height: it is saved with the plan", wait_sh(lambda: api_admin("api/layout").get("storeyHeight") == 2.75), api_admin("api/layout").get("storeyHeight"))
put_sh("#floorBody #storeyHeight", "1")
check("storey height: less than 2.2 m becomes 2.2 m", pgSH.evaluate("window.__fp.layout.storeyHeight") == 2.2 and wait_sh(lambda: pgSH.locator("#floorBody #storeyHeight").input_value() == "2.2"),
      pgSH.locator("#floorBody #storeyHeight").input_value())
put_sh("#floorBody #storeyHeight", "2.75")

pgSH.evaluate("window.__fp.select('stair', 'shS')"); pgSH.wait_for_timeout(400)
check("steps per floor: the stair shows „Stufen je Etage“ 14 and how high a step is (18.3 cm) of a storey of 2.75 m",
      pgSH.input_value("#stairSteps") == "14" and "18.3 cm" in pgSH.locator("#stairRise").inner_text() and "2.75 m" in pgSH.locator("#stairRise").inner_text(),
      (pgSH.input_value("#stairSteps"), pgSH.locator("#stairRise").inner_text()))
put_sh("#stairSteps", "16")
check("steps per floor: 16 set on the stair: 16 steps of 16.2 cm, stored as steps", st_sh().get("steps") == 16 and geo_sh()["treads"] == 16
      and wait_sh(lambda: "16.2 cm" in pgSH.locator("#stairRise").inner_text()), (st_sh(), geo_sh(), pgSH.locator("#stairRise").inner_text()))
put_sh("#stairSteps", "")
check("steps per floor: empty: by itself again (14), nothing stored", "steps" not in st_sh() and geo_sh()["treads"] == 14, st_sh())

pgSH.select_option("#stairCornerProp", "winder"); pgSH.wait_for_timeout(450)
put_sh("#stairWinders", "3")
check("2nd corner (#671): an L stair has the field „2. Ecke“, none at first",
      pgSH.locator("#stairCorner2").count() == 1 and pgSH.input_value("#stairCorner2") == "" and pgSH.locator("#stairWinders2").count() == 0, st_sh())
put_sh("#stairSplit", "0")
check("no first flight: „Stufen im 1. Lauf“ 0 with winders: the stair starts right away with the 3 winders (you step on from the side)",
      st_sh().get("split") == 0 and geo_sh()["order"].startswith("www") and pgSH.input_value("#stairSplit") == "0", (st_sh(), geo_sh()))
pgSH.select_option("#stairCorner2", "winder"); pgSH.wait_for_timeout(450)
put_sh("#stairWinders2", "5")
put_sh("#stairSplit2", "6")
check("Oely99's stair: 3 winders at the bottom, a flight of 6, 5 winders at the top onto the floor above: 14 steps of one storey",
      geo_sh()["order"] == "www" + "s" * 6 + "wwwww" and (st_sh()["corner2"], st_sh()["winders2"], st_sh()["split2"]) == ("winder", 5, 6)
      and "0 Stufen" in pgSH.locator("#stairLastFlight").inner_text(), (geo_sh(), st_sh()))
len_sh = pgSH.evaluate("window.__fp.stairHandle('shS', 'len')")
check("no first flight: the length handle sits at the end of the middle flight",
      abs(len_sh[0] - (1 + 0.475)) < 1e-3 and abs(len_sh[1] - (0.6 + 0.475 + 6 * 0.27)) < 1e-3, len_sh)
put_sh("#stairSplit2", "4")
check("2nd corner: 4 steps in the middle flight, the other 2 after the 2nd corner",
      geo_sh()["order"] == "www" + "ssss" + "wwwww" + "ss" and "2 Stufen" in pgSH.locator("#stairLastFlight").inner_text(), geo_sh())
pgSH.select_option("#stairCorner2", "landing"); pgSH.wait_for_timeout(450)
check("2nd corner: a landing instead, its field „Podest“ shows again (the first corner keeps its winders)",
      st_sh()["corner2"] == "landing" and "winders2" not in st_sh() and pgSH.locator("#stairWinders2").count() == 0 and geo_sh()["winders"] == 3, (st_sh(), geo_sh()))
pgSH.click("#view2d"); pgSH.wait_for_timeout(700)
holes_sh = pgSH.evaluate("document.querySelectorAll('polygon[stroke=\"#ff8a2a\"]').length")
pgSH.evaluate("window.__fp.switchFloor(1)"); pgSH.wait_for_timeout(700)
arrive_sh = pgSH.evaluate("document.querySelectorAll('polygon[stroke=\"#ff8a2a\"]').length")
check("2nd corner: on the floor above the stair arrives (its opening drawn dashed)", arrive_sh >= 1, (holes_sh, arrive_sh))
pgSH.evaluate("window.__fp.switchFloor(0)"); pgSH.click("#view3d"); pgSH.wait_for_timeout(500)
pgSH.evaluate("window.__fp.select('stair', 'shS')"); pgSH.wait_for_timeout(400)
pgSH.select_option("#stairCorner2", ""); pgSH.wait_for_timeout(450)
check("2nd corner: „keine“: one corner again, split2 is gone", "corner2" not in st_sh() and "split2" not in st_sh() and pgSH.locator("#stairSplit2").count() == 0, st_sh())
check("storey height / 2nd corner: no errors", not own_sh, own_sh)
pgSH.close()
set_setting("language", lang_sh); set_setting("units", units_sh)
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_sh).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
