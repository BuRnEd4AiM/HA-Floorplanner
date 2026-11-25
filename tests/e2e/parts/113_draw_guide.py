"""5.36.1 (found while testing 204.8 on 2026-11-25): drawing a wall with the normal grid (0.25 m), the green ∟ 90° did not show when the
pointer was 3° off square at 3 m: the grid put the point 4.8° off, past the tolerance of 4°. Now the guide also looks at the pointer itself
and only puts the length on the grid. Also: ∥ along a wall, Alt draws freely.
"""
saved_dg = api_admin("api/layout")              # put back at the end
st_dg = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
put_dg = lambda lay: urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                            headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
put_dg({"version": 1, "floors": [{"id": "dgEG", "name": "EG", "kind": "floor", "devices": [], "blocks": [], "stairs": [], "rooms": [{"id": "dgR", "name": "Garten", "points": [[0, 0], [8, 0], [8, 9], [0, 9]]}],   # the plan fits it in
                                   "walls": [{"id": "dgW", "a": [0, 0], "b": [8, 0], "thickness": 0.2, "height": 2.6, "openings": []}]}]})
own_dg = []
pgG = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgG.on("console", lambda m: own_dg.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgG.on("pageerror", lambda e: own_dg.append("PAGEERROR " + str(e)))
pgG.goto(BASE + "?debug=1&mode=edit"); pgG.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgG.wait_for_timeout(800)
pgG.evaluate("() => window.__fp.switchFloor(0)"); pgG.wait_for_timeout(400)
if pgG.is_visible("#view2d"): pgG.click("#view2d"); pgG.wait_for_timeout(900)
import math as _m
P_dg = lambda x, z: pgG.evaluate(f"window.__fp.plan().toClient({x}, {z})")
marks_dg = lambda: (pgG.locator("#plan2d .guideRight").count(), pgG.locator("#plan2d .guidePar").count())
walls_dg = lambda: pgG.evaluate("window.__fp.layout.floors[0].walls.map((w) => [w.a, w.b])")
grid_dg = pgG.evaluate("window.__fp.settings().grid || 0.25")

pgG.click("#tools [data-tool=wall]"); pgG.wait_for_timeout(300)
pgG.mouse.click(*P_dg(2, 3)); pgG.wait_for_timeout(200)
pgG.mouse.click(*P_dg(6, 3)); pgG.wait_for_timeout(200)
tx, ty = P_dg(6 + 3 * _m.sin(_m.radians(3)), 3 + 3 * _m.cos(_m.radians(3)))      # 3° off square, 3 m on: the grid point is 4.8° off
pgG.mouse.move(tx, ty, steps=5); pgG.wait_for_timeout(500)
check("draw guide (5.36.1): 3° off square at 3 m with the grid: the green ∟ shows and the status line says „rechter Winkel“",
      grid_dg == 0.25 and marks_dg()[0] == 1 and "rechter Winkel" in pgG.inner_text("#status"), (grid_dg, marks_dg(), pgG.inner_text("#status")))
pgG.keyboard.down("Alt"); pgG.mouse.move(tx + 1, ty, steps=2); pgG.wait_for_timeout(300)
check("draw guide: with Alt no guide", marks_dg() == (0, 0), marks_dg())
pgG.keyboard.up("Alt"); pgG.mouse.move(tx, ty, steps=2); pgG.wait_for_timeout(300)
pgG.mouse.click(tx, ty); pgG.wait_for_timeout(300)
pgG.keyboard.press("Escape"); pgG.wait_for_timeout(300)
new_dg = walls_dg()[-1]
check("draw guide (5.36.1): the point lies exactly square and 3.00 m on (the length on the grid)", new_dg == [[6, 3], [6, 6]], walls_dg())
pgG.keyboard.press("Escape"); pgG.wait_for_timeout(200)
pgG.click("#tools [data-tool=wall]"); pgG.wait_for_timeout(300)
pgG.mouse.click(*P_dg(1, 7.5)); pgG.wait_for_timeout(200)
pgG.mouse.move(*P_dg(5, 7.5 + 4 * _m.tan(_m.radians(2.5))), steps=5); pgG.wait_for_timeout(500)
check("draw guide: almost parallel to a wall: ∥ shows", marks_dg()[1] == 1, (marks_dg(), pgG.inner_text("#status")))   # (the status line may still say „Gespeichert ✓“ of the wall before)
pgG.keyboard.press("Escape"); pgG.wait_for_timeout(200); pgG.keyboard.press("Escape"); pgG.wait_for_timeout(200)

check("draw guide: no errors on the page", not own_dg, own_dg[:5])
pgG.close()
put_dg(saved_dg)
set_setting("language", st_dg.get("language", "de")); set_setting("units", st_dg.get("units", "metric"))
