"""4.60.0 (#623, asked by Miicki: „Kellertreppe … viertelgewendelt: ein langer gerader Lauf an der Wand entlang, in der Ecke … Keilstufen
… danach nur noch ein kurzer Lauf“): an L or U stair can turn with winder steps instead of a landing („Ecke: Gewendelt“, how many
„Wendelstufen“), its first flight has as many steps as set („Stufen im 1. Lauf“); a wall stair can be solid. The tool panel offers the
corner before placing an L stair.
"""
own_sw = []
lang_sw = api("api/settings").get("language", "")
saved_sw = api_admin("api/layout")
pgSW = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgSW.on("pageerror", lambda e: own_sw.append("PAGEERROR " + str(e)))
set_setting("language", "de")
pgSW.goto(BASE + "?debug=1&mode=edit"); pgSW.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgSW.wait_for_timeout(800)
pgSW.evaluate("""(() => { const L = window.__fp.layout;
  L.floors = [{ id: 'wf0', name: 'Keller', kind: 'floor', walls: [], rooms: [], devices: [], blocks: [], stairs: [
    { id: 'stL', name: 'Kellertreppe', type: 'L', x: 0.5, z: 0.6, rot: 0, w: 1, tread: 0.27, turn: 'right', dir: 'up', floors: 1 },
    { id: 'stWall', name: 'Wand', type: 'wall', x: 6, z: 0.5, rot: 0, w: 0.9, tread: 0.27, turn: 'right', dir: 'up', floors: 1, path: [[0, 0], [3, 0], [3, 2]] }] }];
  window.__fp.switchFloor(0); window.__fp.rebuild(); })()""")
pgSW.wait_for_timeout(600)
geo_sw = lambda i="stL": pgSW.evaluate(f"window.__fp.stairGeo('{i}')")
st_sw = lambda i="stL": pgSW.evaluate(f"window.__fp.layout.floors[0].stairs.find(s => s.id === '{i}')")
pgSW.click("#tools [data-tool=stairs]"); pgSW.wait_for_timeout(300)
pgSW.click("#stairTypes button[data-stair=straight]"); pgSW.wait_for_timeout(200)
hid_straight = pgSW.locator("#stairCorner").is_hidden()
pgSW.click("#stairTypes button[data-stair=L]"); pgSW.wait_for_timeout(200)
check("winders: the tool panel offers „Ecke“ for an L stair, not for a straight one", hid_straight and pgSW.locator("#stairCorner").is_visible())
pgSW.select_option("#stairCorner", "winder"); pgSW.wait_for_timeout(200)
pgSW.click("#view2d"); pgSW.wait_for_timeout(600); pgSW.evaluate("window.__fp.plan().fit()"); pgSW.wait_for_timeout(400)
pt = pgSW.evaluate("window.__fp.plan().toClient(4.5, 1.6)"); pgSW.mouse.move(pt[0] - 30, pt[1]); pgSW.mouse.move(*pt); pgSW.wait_for_timeout(200); pgSW.mouse.click(*pt); pgSW.wait_for_timeout(600)
new_sw = pgSW.evaluate("window.__fp.layout.floors[0].stairs.at(-1)")
pgSW.evaluate("(() => { const s = window.__fp.layout.floors[0].stairs; if (s.length > 2) s.pop(); window.__fp.rebuild(); })()"); pgSW.click("#view3d"); pgSW.wait_for_timeout(400)
pgSW.click("#tools [data-tool=select]"); pgSW.wait_for_timeout(300)
check("winders: an L stair placed with „Gewendelt“ turns with winder steps", new_sw["type"] == "L" and new_sw.get("corner") == "winder" and "landing" not in new_sw, new_sw)
pgSW.evaluate("window.__fp.select('stair', 'stL')"); pgSW.wait_for_timeout(300)
check("winders (#623): an L stair has the field „Ecke“, a landing at first, and „Stufen im 1. Lauf“",
      pgSW.input_value("#stairCornerProp") == "landing" and pgSW.locator("#stairSplit").count() == 1 and pgSW.locator("#stairWinders").count() == 0 and geo_sw()["winders"] == 0)
treads_sw = geo_sw()["treads"]
pgSW.select_option("#stairCornerProp", "winder"); pgSW.wait_for_timeout(500)
g = geo_sw()
check("winders: „Gewendelt“ is stored; the corner turns with 3 winder steps (1 m wide), the steps still climb one storey",
      st_sw()["corner"] == "winder" and g["winders"] == 3 and g["treads"] == treads_sw and pgSW.input_value("#stairWinders") == "3", (st_sw(), g))
pgSW.fill("#stairWinders", "5"); pgSW.locator("#stairWinders").dispatch_event("change"); pgSW.wait_for_timeout(400)
check("winders: 5 winder steps", st_sw()["winders"] == 5 and geo_sw()["winders"] == 5, (st_sw(), geo_sw()))
pgSW.fill("#stairSplit", "9"); pgSW.locator("#stairSplit").dispatch_event("change"); pgSW.wait_for_timeout(400)
check("winders: „Stufen im 1. Lauf“ 9 gives a long first and a short second flight", st_sw()["split"] == 9 and geo_sw()["treads"] == treads_sw, st_sw())
pgSW.evaluate("window.__fp.select('stair', 'stL')"); pgSW.wait_for_timeout(300)
pgSW.select_option("#stairCornerProp", "landing"); pgSW.wait_for_timeout(400)
check("winders: back to „Podest“: no winders, the landing field is back", "corner" not in st_sw() and geo_sw()["winders"] == 0, st_sw())
pgSW.evaluate("window.__fp.select('stair', 'stWall')"); pgSW.wait_for_timeout(300)
check("winders: a wall stair has thin plates and the tick „Massiv“, no corner field",
      geo_sw("stWall")["thin"] == geo_sw("stWall")["treads"] and pgSW.locator("#stairSolid").count() == 1 and pgSW.locator("#stairCornerProp").count() == 0)
pgSW.locator("#stairSolid").check(); pgSW.wait_for_timeout(400)
check("winders: „Massiv“ gives solid steps down to the floor", st_sw("stWall").get("solid") is True and geo_sw("stWall")["thin"] == 0, geo_sw("stWall"))
check("winders: no errors", not own_sw, own_sw)
pgSW.close()
set_setting("language", lang_sw)
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_sw).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
