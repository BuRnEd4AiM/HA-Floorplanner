"""4.72.0 (#679, markweiffenbach: tall windows from the floor, "the lower part (about 0–1.10 m) is fixed glazing, and only the upper part
(about 1.10–2.20 m) opens or tilts"): a window that opens has the fields „Feste Scheibe unten“ / „Feste Scheibe oben“ (empty = none,
more than fits is cut, saved as fixedBelow / fixedAbove); in 3D the fixed glass is a pane of its own that stays clear while the pane above
turns yellow (tilted) or red (open); „Fest“ removes it; the new kind „Bodentief, unten fest“ in the palette.
"""
saved_fg = api_admin("api/layout")              # put back at the end
st_fg = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_fg(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_layout_fg(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_fg = lambda e, s: urllib.request.urlopen(HA + f"/_set?e={e}&s={s}").read()
lay_fg = json.loads(json.dumps(saved_fg))
f_fg = lay_fg["floors"][0]
f_fg.setdefault("rooms", []).append({"id": "fg_r", "name": "Bodentief", "color": "#777777", "points": [[96, 60], [100, 60], [100, 63], [96, 63]]})
f_fg.setdefault("walls", []).append(
    {"id": "fg_w", "a": [96, 60], "b": [100, 60], "thickness": 0.2, "height": 2.6, "openings": [
        {"id": "fg_o", "type": "window", "style": "single", "hinge": "left", "pos": 1.2, "width": 0.9, "height": 2.2, "sill": 0,
         "entity": "binary_sensor.fg_offen", "tiltEntity": "binary_sensor.fg_kipp", "name": "Bodentief"}]})
put_layout_fg(lay_fg)
post_fg("/_extra", {
    "binary_sensor.fg_offen": {"state": "off", "attributes": {"friendly_name": "Bodentief offen", "device_class": "window"}},
    "binary_sensor.fg_kipp": {"state": "off", "attributes": {"friendly_name": "Bodentief gekippt", "device_class": "window"}},
})
own_fg = []
pgF = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgF.on("console", lambda m: own_fg.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgF.on("pageerror", lambda e: own_fg.append("PAGEERROR " + str(e)))
def wait_fg(fn, n=40, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgF.wait_for_timeout(ms)
    return fn()
pgF.goto(BASE + "?debug=1&mode=edit"); pgF.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgF.wait_for_timeout(800)
pgF.evaluate("window.__fp.switchFloor(0)"); pgF.wait_for_timeout(400)
op_fg = lambda: pgF.evaluate("(() => { for (const f of window.__fp.layout.floors) for (const w of f.walls) for (const o of (w.openings || [])) if (o.id === 'fg_o') return o; return null; })()")
glass_fg = lambda: pgF.evaluate("window.__fp.fixedGlass('fg_o')")
look_fg = lambda: pgF.evaluate("window.__fp.openLook('fg_o')")
def set_field_fg(sel, v):
    pgF.fill(sel, v); pgF.press(sel, "Enter"); pgF.wait_for_timeout(400)

pgF.evaluate("window.__fp.select('opening', 'fg_o')"); pgF.wait_for_timeout(400)
check("fixed glass (#679): a window that opens has „Feste Scheibe unten“ and „oben“ with a hint, both empty",
      pgF.locator("#fixedBelow").is_visible() and pgF.locator("#fixedAbove").is_visible() and pgF.locator("#fixedGlassHint").is_visible()
      and "Feste Scheibe unten" in pgF.locator("#fixedBelowField").inner_text() and pgF.input_value("#fixedBelow") == "" and pgF.input_value("#fixedAbove") == "",
      [pgF.input_value("#fixedBelow"), pgF.input_value("#fixedAbove")])
check("fixed glass: none in 3D without a value", glass_fg() == [], glass_fg())
set_field_fg("#fixedBelow", "1.1")
check("fixed glass: 1,1 m below is saved as fixedBelow", op_fg().get("fixedBelow") == 1.1, op_fg())
g1 = wait_fg(lambda: glass_fg() or None) or []
check("fixed glass: in 3D a pane of its own, 1,1 m less the frame and half the bar high", len(g1) == 1 and abs((g1[0]["y1"] - g1[0]["y0"]) - 1.025) < 0.01, g1)
check("fixed glass: the window is shut (green frame)", wait_fg(lambda: look_fg() == "closed"), look_fg())
hex0 = g1[0]["hex"] if g1 else None
set_fg("binary_sensor.fg_kipp", "on")
check("fixed glass: tilted, the pane above is yellow and leans in", wait_fg(lambda: look_fg() == "tilted" and pgF.evaluate("window.__fp.tiltTargets('fg_o')")[0] != 0),
      [look_fg(), pgF.evaluate("window.__fp.tiltTargets('fg_o')")])
check("fixed glass: … the fixed glass below keeps its colour", [x["hex"] for x in glass_fg()] == [hex0], [glass_fg(), hex0])
set_fg("binary_sensor.fg_offen", "on")
check("fixed glass: open, the pane above is red and swings open", wait_fg(lambda: look_fg() == "open" and pgF.evaluate("window.__fp.paneTargets('fg_o')")[0] != 0),
      [look_fg(), pgF.evaluate("window.__fp.paneTargets('fg_o')")])
check("fixed glass: … the fixed glass below still keeps its colour", [x["hex"] for x in glass_fg()] == [hex0], [glass_fg(), hex0])
set_fg("binary_sensor.fg_offen", "off"); set_fg("binary_sensor.fg_kipp", "off")

set_field_fg("#fixedAbove", "5")
check("fixed glass: more above than fits is cut (the pane keeps 30 cm), the field shows it", op_fg().get("fixedAbove") == 0.8 and pgF.input_value("#fixedAbove") == "0.8",
      [op_fg(), pgF.input_value("#fixedAbove")])
check("fixed glass: below and above: two fixed panes in 3D", wait_fg(lambda: len(glass_fg()) == 2), glass_fg())
set_field_fg("#fixedAbove", "")
check("fixed glass: an empty field removes it", "fixedAbove" not in op_fg() and pgF.input_value("#fixedAbove") == "", op_fg())
srv_fg = wait_fg(lambda: next((o for f in api_admin("api/layout")["floors"] for w in f["walls"] for o in w.get("openings", []) if o["id"] == "fg_o" and o.get("fixedBelow") == 1.1 and "fixedAbove" not in o), None))
check("fixed glass: saved in the add-on", bool(srv_fg), srv_fg)

pgF.click("#winFixed"); pgF.wait_for_timeout(500)
check("fixed glass: „Fest“ (fixed glazing) removes it, the fields are gone",
      "fixedBelow" not in op_fg() and pgF.locator("#fixedBelow").count() == 0 and wait_fg(lambda: glass_fg() == []), [op_fg(), glass_fg()])

pgF.keyboard.press("Escape"); pgF.wait_for_timeout(300)
pgF.click("#tools [data-tool=opening]"); pgF.wait_for_timeout(400)
btn_fg = pgF.locator("#openingPalette button[data-opening=windowFloor]")
check("fixed glass: the new kind „Bodentief, unten fest“ is in the palette", btn_fg.count() == 1 and "Bodentief" in btn_fg.inner_text(), btn_fg.count())
pgF.click("#tools [data-tool=select]"); pgF.wait_for_timeout(300)
check("fixed glass: no errors", not own_fg, own_fg)

put_layout_fg(saved_fg)
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_fg.get(k, d))
post_fg("/_extra", {})
pgF.close()
