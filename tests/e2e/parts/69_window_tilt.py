"""4.59.0 (#624, biggilottecassi: „Kontakt für ein normales Fenster mit 1 Flügel … gekippt und offen“): a window with one pane gets a
second contact, „Kontakt gekippt“. Tilted (only that one open) the window is yellow, its pane leans in round the bottom edge and every list
says „Gekippt“; open (the contact „offen“, also with both) it is red and swings round its hinge; a handle sensor that says „tilted“ itself
needs no second contact; fixed glazing has no such field. The add-on's window rule counts a tilted window: the heating goes off.
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
check("tilt: fixed glazing has no such field", pgW.locator("#tiltContact").count() == 0 and pgW.locator("#winFixed").is_checked())

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

pgW.click("#modeSwitch button[data-mode=live]"); pgW.wait_for_timeout(1200)
status_open(pgW)
pgW.click("#openPill"); pgW.wait_for_timeout(400)
row_wt = pgW.evaluate("[...document.querySelectorAll('#openList li')].map(li => li.textContent).find(t => t.includes('Kippfenster')) || ''")
check("tilt: the list „offen“ has the window as „Gekippt“", "Gekippt" in row_wt, row_wt)
pgW.keyboard.press("Escape"); pgW.wait_for_timeout(300)
pgW.evaluate("window.__fp.openRoomPanel('wt_r')"); pgW.wait_for_timeout(600)
panel_wt = pgW.evaluate("(document.querySelector('#roomPanel') || {}).textContent || ''")
check("tilt: the room panel says „Gekippt“ for the window (one row for both contacts)", "Gekippt" in panel_wt and panel_wt.count("Kippfenster") == 1, panel_wt[:300])
check("tilt: no errors", not own_wt, own_wt)

put_rules_wt({"heat": {}, "flows": []})
put_layout_wt(saved_wt)
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_wt.get(k, d))
post_wt("/_extra", {})
pgW.close()
