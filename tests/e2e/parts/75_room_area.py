"""4.69.0 (the owner, 2026-11-07: „entweder der Home Assistant Bereiche auswählen kann, wie der Raum heißt, oder einen eigenen Raumname
vergeben … dass man die auch einfach dann zuordnen kann“): the name of a room. Right under „Name“ the drop-down „HA-Bereich“: „✏️ Eigener
Name“ or an area (the free ones first, the ones another room has after them, with that room); an area links the room and gives it its name,
„Eigener Name“ takes the link away and keeps the name, a typed name that is a free area links by itself, „↺ Name aus Home Assistant“ after
an own name, „🔗 … alle verknüpfen“ links every room called like an area; the plan keeps it; without areas only the name and a hint.
"""
saved_ra = api_admin("api/layout")              # put back at the end
st_ra = api("api/settings")
set_setting("language", "de")
def post_ra(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_layout_ra(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
sq_ra = lambda x: [[x, 0], [x + 4, 0], [x + 4, 4], [x, 4]]
post_ra("/_areas", [{"id": "wz", "name": "Wohnzimmer", "entities": ["light.wohnzimmer", "cover.rollo"]},
                    {"id": "ra_kueche", "name": "Küche", "entities": []}, {"id": "ra_bad", "name": "Bad", "entities": []},
                    {"id": "ra_buero", "name": "Büro", "entities": []}])
put_layout_ra({"version": 1, "floors": [{"id": "raEG", "name": "EG", "kind": "floor", "walls": [], "devices": [], "blocks": [], "stairs": [], "rooms": [
    {"id": "ra1", "name": "Raum 1", "points": sq_ra(0)}, {"id": "ra2", "name": "Wohnen", "area": "wz", "points": sq_ra(4)},
    {"id": "ra3", "name": " küche", "points": sq_ra(8)}, {"id": "ra4", "name": "Bad", "points": sq_ra(12)}]}]})
own_ra = []
pgA = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgA.on("console", lambda m: own_ra.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgA.on("pageerror", lambda e: own_ra.append("PAGEERROR " + str(e)))
def open_ra(room="ra1"):
    pgA.goto(BASE + "?debug=1&mode=edit"); pgA.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgA.wait_for_timeout(800)
    pgA.evaluate("() => window.__fp.switchFloor(0)"); pgA.wait_for_timeout(400)
    pgA.evaluate(f"() => window.__fp.select('room', '{room}')"); pgA.wait_for_selector("#roomName", timeout=10000)
room_ra = lambda rid: next(r for r in pgA.evaluate("window.__fp.layout.floors[0].rooms") if r["id"] == rid)
state_ra = lambda: pgA.get_attribute("#roomAreaHint", "data-state")
open_ra()

opts_ra = pgA.evaluate("[...document.querySelectorAll('#roomArea option')].map((o) => [o.value, o.textContent, o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : ''])")
check("room name: the name first, then „HA-Bereich“: „✏️ Eigener Name“, the free areas by name, then the one „Wohnen“ has",
      pgA.evaluate("document.querySelector('#propsBody input[type=text]').id") == "roomName" and pgA.input_value("#roomName") == "Raum 1"
      and [o[0] for o in opts_ra] == ["", "ra_bad", "ra_buero", "ra_kueche", "wz"] and "Eigener Name" in opts_ra[0][1]
      and "schon: Wohnen" in opts_ra[4][1] and opts_ra[1][2] == "Bereiche aus Home Assistant" and opts_ra[4][2] == "Schon bei einem anderen Raum", opts_ra)
check("room name: no area yet: the line says what an area does, „↺“ hidden, „🔗 2 Räume heißen wie ein Bereich“ (Küche, Bad)",
      state_ra() == "none" and not pgA.is_visible("#roomAreaName") and "2 Räume" in pgA.inner_text("#roomAreaAll"), (state_ra(), pgA.inner_text("#roomAreaAll")))

pgA.select_option("#roomArea", "ra_buero"); pgA.wait_for_timeout(300)
r_ra = room_ra("ra1")
check("room name: choosing „Büro“ links the room and gives it the name", r_ra.get("area") == "ra_buero" and r_ra["name"] == "Büro"
      and pgA.input_value("#roomName") == "Büro" and state_ra() == "same", (r_ra, state_ra()))
pgA.fill("#roomName", "Arbeiten"); pgA.press("#roomName", "Enter"); pgA.wait_for_timeout(300)
r_ra = room_ra("ra1")
check("room name: an own name keeps the link; the line says so and „↺ Name aus Home Assistant“ shows",
      r_ra.get("area") == "ra_buero" and r_ra["name"] == "Arbeiten" and state_ra() == "own" and "„Büro“" in pgA.inner_text("#roomAreaHint")
      and pgA.is_visible("#roomAreaName"), (r_ra, state_ra()))
pgA.click("#roomAreaName"); pgA.wait_for_timeout(300)
check("room name: „↺ Name aus Home Assistant“ gives the area's name back", room_ra("ra1")["name"] == "Büro" and pgA.input_value("#roomName") == "Büro"
      and state_ra() == "same", room_ra("ra1"))
pgA.select_option("#roomArea", ""); pgA.wait_for_timeout(300)
r_ra = room_ra("ra1")
check("room name: „✏️ Eigener Name“ takes the link away, the name stays, the cursor goes into the name",
      "area" not in r_ra and r_ra["name"] == "Büro" and state_ra() == "none" and pgA.evaluate("document.activeElement.id") == "roomName", r_ra)

pgA.fill("#roomName", "BÜRO "); pgA.press("#roomName", "Enter"); pgA.wait_for_timeout(300)
r_ra = room_ra("ra1")
check("room name: a typed name that is a free area links the room by itself (the status says so)",
      r_ra.get("area") == "ra_buero" and pgA.input_value("#roomArea") == "ra_buero" and "verknüpft" in pgA.inner_text("#status"), (r_ra, pgA.inner_text("#status")))
pgA.fill("#roomName", "Wohnzimmer"); pgA.press("#roomName", "Enter"); pgA.wait_for_timeout(300)
check("room name: no link by name for a room that has an area already", room_ra("ra1").get("area") == "ra_buero", room_ra("ra1"))

pgA.click("#roomAreaAll"); pgA.wait_for_timeout(500)
check("room name: „🔗 alle verknüpfen“ links Küche and Bad, the button goes",
      room_ra("ra3").get("area") == "ra_kueche" and room_ra("ra4").get("area") == "ra_bad" and room_ra("ra3")["name"] == " küche"
      and not pgA.is_visible("#roomAreaAll") and "2 verknüpft" in pgA.inner_text("#status"), ([room_ra(x) for x in ("ra3", "ra4")], pgA.inner_text("#status")))
pgA.keyboard.press("Control+z"); pgA.wait_for_timeout(400)
check("room name: one undo takes both links back", "area" not in room_ra("ra3") and "area" not in room_ra("ra4"), [room_ra(x) for x in ("ra3", "ra4")])
pgA.keyboard.press("Control+y"); pgA.wait_for_timeout(400)

def kept_ra():
    rooms = {r["id"]: r for r in api_admin("api/layout")["floors"][0]["rooms"]}
    return rooms["ra1"].get("area") == "ra_buero" and rooms["ra1"]["name"] == "Wohnzimmer" and rooms["ra2"].get("area") == "wz"
pgA.evaluate("window.__fp.select('room', 'ra2')"); pgA.wait_for_timeout(300)
ok_ra = False
for _ in range(30):
    if kept_ra(): ok_ra = True; break
    pgA.wait_for_timeout(500)
check("room name: the plan keeps the links (api/layout)", ok_ra, api_admin("api/layout")["floors"][0]["rooms"])

pgA.route("**/api/areas", lambda r: r.fulfill(status=200, content_type="application/json", body="[]"))   # Home Assistant without areas
open_ra("ra4")
check("room name: without areas only the name and a line how to make areas", pgA.locator("#roomArea").count() == 0
      and state_ra() == "noAreas" and "Bereiche" in pgA.inner_text("#roomAreaHint"), pgA.inner_text("#propsBody")[:200])
pgA.fill("#roomName", "Bad unten"); pgA.press("#roomName", "Enter"); pgA.wait_for_timeout(300)
check("room name: without areas the name still changes, a link stays", room_ra("ra4")["name"] == "Bad unten" and room_ra("ra4").get("area") == "ra_bad", room_ra("ra4"))
pgA.unroute("**/api/areas")
check("room name: no errors on the page", not own_ra, own_ra[:5])
pgA.close()
put_layout_ra(saved_ra)
post_ra("/_areas", [])
set_setting("language", st_ra.get("language", "de"))
