"""4.59.0 (#624, biggilottecassi: „Kontakt für ein normales Fenster mit 1 Flügel … gekippt und offen“): a window with one pane gets a
second contact, „Kontakt gekippt“. Tilted (only that one open) the window is yellow, its pane leans in round the bottom edge and every list
says „Gekippt“; open (the contact „offen“, also with both) it is red and swings round its hinge; a handle sensor that says „tilted“ itself
needs no second contact; fixed glazing has no such field. The add-on's window rule counts a tilted window: the heating goes off.
4.64.0 (#624, biggilottecassi: „die Kippstellung … grafisch noch ein bisschen mehr“): the field „Kippwinkel (°)“ (5 to 45, 14 without a
value), a shut window leans in for a moment after a change, „Für alle Fenster“, saved as tiltDeg; every pane that opens has a sash with a
handle (sash.js), fixed glazing none.
"""
saved_wt = api_admin("api/layout")              # put back at the end
st_wt = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_wt(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_rules_wt(body):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/rules", data=json.dumps(body).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
def put_layout_wt(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_wt = lambda e, s: urllib.request.urlopen(HA + f"/_set?e={e}&s={s}").read()
key_wt = f"{api('api/houses')[0]['id']}/wt_r"
lay_wt = json.loads(json.dumps(saved_wt))
f_wt = lay_wt["floors"][0]
f_wt.setdefault("rooms", []).append({"id": "wt_r", "name": "Kippzimmer", "color": "#777777", "points": [[90, 60], [94, 60], [94, 63], [90, 63]]})
f_wt.setdefault("walls", []).extend([
    {"id": "wt_w", "a": [90, 60], "b": [94, 60], "thickness": 0.2, "height": 2.6, "openings": [
        {"id": "wt_o", "type": "window", "style": "single", "hinge": "left", "pos": 1.2, "width": 1.0, "height": 1.2, "sill": 0.9,
         "entity": "binary_sensor.wt_offen", "tiltEntity": "binary_sensor.wt_kipp", "name": "Kippfenster"},
        {"id": "wt_g", "type": "window", "style": "single", "pos": 3.0, "width": 0.8, "height": 1.2, "sill": 0.9, "entity": "sensor.wt_griff", "name": "Griff"}]},
    {"id": "wt_w2", "a": [94, 60], "b": [94, 63], "thickness": 0.2, "height": 2.6, "openings": [
        {"id": "wt_f", "type": "window", "style": "fixed", "pos": 1.5, "width": 1.0, "height": 1.2, "sill": 0.9}]}])
f_wt.setdefault("devices", []).append({"id": "wt_th", "type": "thermostat", "x": 91, "z": 61, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat", "entity": "climate.wt_th"})
put_layout_wt(lay_wt)
post_wt("/_extra", {
    "climate.wt_th": {"state": "heat", "attributes": {"friendly_name": "Heizung Kippzimmer", "current_temperature": 20.5, "temperature": 21.5, "hvac_action": "heating",
                                                     "hvac_modes": ["off", "heat"], "min_temp": 7, "max_temp": 28, "target_temp_step": 0.5}},
    "binary_sensor.wt_offen": {"state": "off", "attributes": {"friendly_name": "Kippfenster offen", "device_class": "window"}},
    "binary_sensor.wt_kipp": {"state": "off", "attributes": {"friendly_name": "Kippfenster gekippt", "device_class": "window"}},
    "sensor.wt_griff": {"state": "closed", "attributes": {"friendly_name": "Fenstergriff"}},
})
put_rules_wt({"heat": {"window": {"on": True, "delay": 0}}, "flows": []})
own_wt = []
pgW = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgW.on("console", lambda m: own_wt.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgW.on("pageerror", lambda e: own_wt.append("PAGEERROR " + str(e)))
def wait_wt(fn, n=40, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgW.wait_for_timeout(ms)
    return fn()
pgW.goto(BASE + "?debug=1&mode=edit"); pgW.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgW.wait_for_timeout(800)
pgW.evaluate("window.__fp.switchFloor(0)"); pgW.wait_for_timeout(400)
look_wt = lambda i="wt_o": pgW.evaluate(f"window.__fp.openLook('{i}')")
tilt_wt = lambda i="wt_o": pgW.evaluate(f"window.__fp.tiltTargets('{i}')")
pane_wt = lambda i="wt_o": pgW.evaluate(f"window.__fp.paneTargets('{i}')")

pgW.evaluate("window.__fp.select('opening', 'wt_o')"); pgW.wait_for_timeout(300)
check("tilt (#624): a window has the field „Kontakt gekippt“ with a short hint", pgW.locator("#tiltContact").count() == 1 and pgW.locator("#tiltContactHint").is_visible()
      and "gekippt" in pgW.locator("#tiltContact").inner_text())
pgW.evaluate("window.__fp.select('opening', 'wt_f')"); pgW.wait_for_timeout(300)
check("sash (4.64.0): a pane that opens has a sash with a handle (it tilts and swings with the pane), fixed glazing has none",
      pgW.evaluate("window.__fp.sashes('wt_o')") == [True] and pgW.evaluate("window.__fp.sashes('wt_f')") in ([], [False]),
      (pgW.evaluate("window.__fp.sashes('wt_o')"), pgW.evaluate("window.__fp.sashes('wt_f')")))
check("tilt: fixed glazing has no such field (and no tilt angle)", pgW.locator("#tiltContact").count() == 0 and pgW.locator("#tiltDeg").count() == 0
      and pgW.locator("#winFixed").is_checked())

check("tilt: both contacts shut: the window is closed (green frame), nothing leans in", wait_wt(lambda: look_wt() == "closed") and tilt_wt() == [0] and pane_wt() == [0], (look_wt(), tilt_wt()))
set_wt("binary_sensor.wt_kipp", "on")
check("tilt: only the tilt contact open: the window is tilted (yellow), its pane leans in round the bottom edge and does not swing",
      wait_wt(lambda: look_wt() == "tilted") and abs(tilt_wt()[0]) > 0.1 and pane_wt() == [0], (look_wt(), tilt_wt(), pane_wt()))
paused_wt = wait_wt(lambda: (api("api/rules")["status"]["rooms"].get(key_wt) or {}).get("why") == "window", n=80)
check("tilt: the window rule of the add-on counts the tilted window: the heating of the room pauses", paused_wt, api("api/rules")["status"]["rooms"].get(key_wt))
room_wt = next((r for r in api("api/rules/trace")["rooms"] if r["key"] == key_wt), None)
check("tilt: api/rules/trace has both contacts as the room's window", room_wt and "binary_sensor.wt_offen" in room_wt["windows"] and "binary_sensor.wt_kipp" in room_wt["windows"], room_wt)
set_wt("binary_sensor.wt_offen", "on")
check("tilt: the contact „offen“ open too (a sensor at the top): open wins, red, the pane swings round its hinge, no tilt",
      wait_wt(lambda: look_wt() == "open") and abs(pane_wt()[0]) > 1 and tilt_wt() == [0], (look_wt(), tilt_wt(), pane_wt()))
set_wt("binary_sensor.wt_kipp", "off")
check("tilt: only „offen“: still open", wait_wt(lambda: look_wt() == "open"), look_wt())
set_wt("binary_sensor.wt_offen", "off"); set_wt("binary_sensor.wt_kipp", "on")
wait_wt(lambda: look_wt() == "tilted")

set_wt("sensor.wt_griff", "tilted")
check("tilt: a handle sensor that says „tilted“ itself tilts its window without a second contact",
      wait_wt(lambda: look_wt("wt_g") == "tilted") and abs(tilt_wt("wt_g")[0]) > 0.1, (look_wt("wt_g"), tilt_wt("wt_g")))
set_wt("sensor.wt_griff", "closed")
wait_wt(lambda: look_wt("wt_g") == "closed")

# the tilt angle (biggilottecassi in #624: „Kann man die Kippstellung … grafisch noch ein bisschen mehr als Kippstellung anzeigen lassen?“)
DEG_wt = 3.141592653589793 / 180
lean_wt = lambda deg, i="wt_o": abs(abs((tilt_wt(i) or [0])[0]) - deg * DEG_wt) < 0.01
check("tilt angle: the tilted pane leans in by 14° without a value of its own", wait_wt(lambda: lean_wt(14)), tilt_wt())
pgW.evaluate("window.__fp.select('opening', 'wt_o')"); pgW.wait_for_timeout(300)
check("tilt angle: a window has the field „Kippwinkel (°)“ with 14 and the button „Für alle Fenster“",
      pgW.locator("#tiltDeg").input_value() == "14" and "Kippwinkel" in pgW.locator("#tiltDegField").inner_text()
      and "alle Fenster" in pgW.locator("#tiltDegAll").inner_text(), pgW.locator("#tiltDegField").inner_text())
pgW.fill("#tiltDeg", "30"); pgW.press("#tiltDeg", "Enter"); pgW.wait_for_timeout(300)
check("tilt angle 30°: the tilted window leans in by 30°", wait_wt(lambda: lean_wt(30)), tilt_wt())
pgW.fill("#tiltDeg", "80"); pgW.press("#tiltDeg", "Enter"); pgW.wait_for_timeout(300)
check("tilt angle: more than 45° becomes 45°", pgW.locator("#tiltDeg").input_value() == "45" and wait_wt(lambda: lean_wt(45)), (pgW.locator("#tiltDeg").input_value(), tilt_wt()))
pgW.evaluate("window.__fp.select('opening', 'wt_g')"); pgW.wait_for_timeout(300)
check("tilt angle: a shut window does not lean in", tilt_wt("wt_g") == [0], tilt_wt("wt_g"))
pgW.fill("#tiltDeg", "20"); pgW.press("#tiltDeg", "Enter")
check("tilt angle: after a change a shut window leans in for a moment by its new angle, so you see it", wait_wt(lambda: lean_wt(20, "wt_g"), n=10, ms=100), tilt_wt("wt_g"))
check("tilt angle: … and then it is shut again", wait_wt(lambda: tilt_wt("wt_g") == [0], n=20, ms=300) and look_wt("wt_g") == "closed", tilt_wt("wt_g"))
pgW.click("#tiltDegAll"); pgW.wait_for_timeout(400)
check("tilt angle: „Für alle Fenster“ gives every window 20°, the tilted one leans in by 20° now, the status line says so",
      wait_wt(lambda: lean_wt(20)) and "20°" in pgW.locator("#status").inner_text(), (tilt_wt(), pgW.locator("#status").inner_text()))
ops_wt = lambda lay: {o["id"]: o for f in lay["floors"] for w in f.get("walls", []) for o in w.get("openings", [])}
saved_deg_wt = wait_wt(lambda: (lambda ops: ops.get("wt_o", {}).get("tiltDeg") == 20 and ops.get("wt_g", {}).get("tiltDeg") == 20 and ops)(ops_wt(api_admin("api/layout"))), n=40, ms=300)
check("tilt angle: it is saved on the windows (tiltDeg), fixed glazing has none", saved_deg_wt and "tiltDeg" not in saved_deg_wt["wt_f"],
      {k: v.get("tiltDeg") for k, v in ops_wt(api_admin("api/layout")).items() if k.startswith("wt_")})
pgW.evaluate("window.__fp.select('opening', 'wt_o')"); pgW.wait_for_timeout(300)
pgW.fill("#tiltDeg", "14"); pgW.press("#tiltDeg", "Enter"); pgW.wait_for_timeout(300)
check("tilt angle: back to 14: nothing stored", wait_wt(lambda: "tiltDeg" not in ops_wt(api_admin("api/layout"))["wt_o"]) and lean_wt(14), tilt_wt())
# the owner: „Mach das aber für alle Fenster, nicht dass welche vergessen wird“: every window of the whole test house, every floor
pgW.click("#floorRail .railHouse"); pgW.wait_for_timeout(2500)
all_wt = pgW.evaluate("""(() => { const fp = window.__fp, bad = []; let n = 0;
  fp.layout.floors.forEach((f) => [...(f.walls || []), ...(f.dormerWalls || [])].forEach((w) => (w.openings || []).forEach((o) => {
    if (o.type !== 'window' || o.style === 'fixed') return;
    n++;
    const s = fp.sashes(o.id), want = s.map((_, i) => !(Array.isArray(o.paneHinges) && o.paneHinges[i] === 'fixed'));
    if (!s.length || s.some((v, i) => v !== want[i])) bad.push([o.id, s]);
  }))); return { n, bad }; })()""")
check("sash: in the whole house every window that opens has its sashes, on every floor (fixed glazing and fixed panes none)",
      all_wt["n"] >= 3 and not all_wt["bad"], all_wt)
pgW.evaluate("window.__fp.switchFloor(0)"); pgW.wait_for_timeout(800)

pgW.click("#modeSwitch button[data-mode=live]"); pgW.wait_for_timeout(1200)
status_open(pgW)
pgW.click("#openPill"); pgW.wait_for_timeout(400)
row_wt = pgW.evaluate("[...document.querySelectorAll('#openList li')].map(li => li.textContent).find(t => t.includes('Kippfenster')) || ''")
check("tilt: the list „offen“ has the window as „Gekippt“", "Gekippt" in row_wt, row_wt)
pgW.keyboard.press("Escape"); pgW.wait_for_timeout(300)
pgW.evaluate("window.__fp.openRoomPanel('wt_r')"); pgW.wait_for_timeout(600)
pgW.evaluate("window.__fp.roomTab('open')"); pgW.wait_for_timeout(300)   # the windows are in the tab 🚪 Fenster of the room card (5.10.0)
panel_wt = pgW.evaluate("(document.querySelector('#roomPanel') || {}).textContent || ''")
check("tilt: the room panel says „Gekippt“ for the window (one row for both contacts)", "Gekippt" in panel_wt and panel_wt.count("Kippfenster") == 1, panel_wt[:300])
check("tilt: no errors", not own_wt, own_wt)

put_rules_wt({"heat": {}, "flows": []})
put_layout_wt(saved_wt)
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_wt.get(k, d))
post_wt("/_extra", {})
pgW.close()
