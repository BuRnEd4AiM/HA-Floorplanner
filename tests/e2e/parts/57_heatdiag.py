"""4.39.0 (#579): 🌡 Klima → 🩺 Protokoll, who controls what. A room with a thermostat, a window and a door to a second room: the window
opens, the add-on switches the heating off; api/rules/trace says what it saw (the window counts, the door between two rooms does not) and
did (its call, taken by Home Assistant, the thermostat reporting off: the add-on's own), then a turn by somebody else; the page shows the
room and the journal, "⬇ Als Datei" gives the report with the entity ids, the room's card on 🌡 Klima opens it for that room.
"""
saved_hd = api_admin("api/layout")              # put back at the end
st_hd = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_hd(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_rules_hd(body):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/rules", data=json.dumps(body).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
house_hd = (api("api/houses")[0])["id"]
key_hd = f"{house_hd}/hd_r"
lay_hd = json.loads(json.dumps(saved_hd))
f0 = lay_hd["floors"][0]
f0.setdefault("rooms", []).extend([{"id": "hd_r", "name": "Diagnoseraum", "color": "#777777", "points": [[80, 60], [84, 60], [84, 63], [80, 63]]},
                                   {"id": "hd_r2", "name": "Nebenraum", "color": "#888888", "points": [[84, 60], [87, 60], [87, 63], [84, 63]]}])
f0.setdefault("walls", []).extend([
    {"id": "hd_w", "a": [80, 60], "b": [84, 60], "thickness": 0.2, "height": 2.6, "openings": [
        {"id": "hd_o", "type": "window", "pos": 2, "width": 1.2, "height": 1.2, "sill": 0.9, "entity": "binary_sensor.hd_fenster", "name": "Fenster Diagnose"}]},
    {"id": "hd_w2", "a": [84, 60], "b": [84, 63], "thickness": 0.12, "height": 2.6, "openings": [
        {"id": "hd_d", "type": "door", "style": "single", "pos": 1.5, "width": 0.9, "height": 2.0, "sill": 0, "entity": "binary_sensor.hd_tuer", "name": "Tür Nebenraum"}]}])
f0.setdefault("devices", []).append({"id": "hd_th", "type": "thermostat", "x": 81, "z": 61, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat", "entity": "climate.hd_th"})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay_hd).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
post_hd("/_extra", {
    "climate.hd_th": {"state": "heat", "attributes": {"friendly_name": "Heizung Diagnose", "current_temperature": 20.5, "temperature": 21.5, "hvac_action": "heating",
                                                     "hvac_modes": ["off", "heat"], "min_temp": 7, "max_temp": 28, "target_temp_step": 0.5}},
    "binary_sensor.hd_fenster": {"state": "off", "attributes": {"friendly_name": "Fenster Diagnose", "device_class": "window"}},
    "binary_sensor.hd_tuer": {"state": "off", "attributes": {"friendly_name": "Tür Nebenraum", "device_class": "door"}},
})
put_rules_hd({"heat": {"window": {"on": True, "delay": 0}}, "flows": []})
own_hd = []
pgH = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}, accept_downloads=True)
pgH.on("console", lambda m: own_hd.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgH.on("pageerror", lambda e: own_hd.append("PAGEERROR " + str(e)))
def wait_hd(fn, n=40, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgH.wait_for_timeout(ms)
    return fn()
trace_hd = lambda: api("api/rules/trace")
mine_hd = lambda k, e=None: [x for x in trace_hd()["trace"] if x["k"] == k and (e is None or x.get("ent") == e)]

wait_hd(lambda: api("api/rules")["running"])
urllib.request.urlopen(HA + "/_set?e=binary_sensor.hd_tuer&s=on").read()
urllib.request.urlopen(HA + "/_set?e=binary_sensor.hd_fenster&s=on").read()
own_off = wait_hd(lambda: [x for x in mine_hd("climate", "climate.hd_th") if x["mode"] == ["heat", "off"]], n=60)
room_hd = next((r for r in trace_hd()["rooms"] if r["key"] == key_hd), None)
check("diagnosis: api/rules/trace has the room as the add-on sees it (thermostat, window, the door to the next room)",
      room_hd and room_hd["climates"] == ["climate.hd_th"] and room_hd["windows"] == ["binary_sensor.hd_fenster"] and room_hd["inner"] == ["binary_sensor.hd_tuer"], room_hd)
win_hd, door_hd = mine_hd("contact", "binary_sensor.hd_fenster"), mine_hd("contact", "binary_sensor.hd_tuer")
check("diagnosis: the window opening counts, the door between two rooms does not (and the journal says why)",
      win_hd and win_hd[-1]["rooms"] == [[key_hd, "window", None]] and door_hd and [key_hd, "inner", "inner"] in door_hd[-1]["rooms"], (win_hd, door_hd))
calls_hd = mine_hd("call", "climate.hd_th")
check("diagnosis: the rule's call is there, taken by Home Assistant, and the thermostat reporting off is the add-on's own",
      calls_hd and calls_hd[-1]["svc"] == "set_hvac_mode" and calls_hd[-1]["ok"] and own_off and own_off[-1]["by"] == "addon", (calls_hd, own_off))
post_hd("/services/climate/set_temperature", {"entity_id": "climate.hd_th", "temperature": 25})   # somebody else, in Home Assistant
other_hd = wait_hd(lambda: [x for x in mine_hd("climate", "climate.hd_th") if x["temp"] == [21.5, 25]])
check("diagnosis: a target set by somebody else is not the add-on's", other_hd and other_hd[-1]["by"] != "addon", other_hd)

pgH.goto(BASE + "?debug=1"); pgH.wait_for_timeout(1500)
if pgH.is_visible("#modeSwitch [data-mode=live]"): pgH.click("#modeSwitch [data-mode=live]"); pgH.wait_for_timeout(1000)
pgH.click("#tabBar [data-tab=climate]"); pgH.wait_for_timeout(800)
chip_hd = pgH.locator(f"[data-page=climate] [data-room=hd_r] [data-act=diag]")
check("diagnosis: the room's card on 🌡 Klima has '🩺 Protokoll'", chip_hd.count() == 1)
chip_hd.click(); pgH.wait_for_timeout(1200)
card_hd = pgH.locator(f"[data-page=climate] .hdRoom[data-room='{key_hd}']")
check("diagnosis: '🩺 Protokoll' opens on that room (its chip on, its card alone)",
      card_hd.count() == 1 and pgH.locator("[data-page=climate] .hdRoom").count() == 1
      and pgH.locator(f"[data-page=climate] .hdChips [data-room='{key_hd}'].on").count() == 1)
txt_hd = card_hd.inner_text() if card_hd.count() else ""
check("diagnosis: the card says the heating is paused, the window is open and counts, the door does not",
      "pausiert" in txt_hd and "Fenster Diagnose: offen" in txt_hd and "zählt für die Fenster-Regel" in txt_hd and "Tür zwischen zwei Räumen" in txt_hd
      and pgH.locator(f"[data-page=climate] [data-contact='binary_sensor.hd_tuer'].not").count() == 1, txt_hd[:400])
log_hd = pgH.inner_text("[data-page=climate] .hdLog")
check("diagnosis: the journal shows the window, the rule's call with ✓ and who turned the thermostat",
      "Fenster Diagnose offen" in log_hd and "✓ Home Assistant hat es angenommen" in log_hd and "vom Add-on" in log_hd, log_hd[:600])
with pgH.expect_download() as dl_hd:
    pgH.click("[data-page=climate] [data-act=download]")
rep_hd = open(dl_hd.value.path(), encoding="utf-8").read()
check("diagnosis: '⬇ Als Datei' gives the report with the entity ids and the journal",
      f"({key_hd})" in rep_hd and "binary_sensor.hd_fenster" in rep_hd and "climate.hd_th" in rep_hd and "Protokoll" in rep_hd, rep_hd[:400])
pgH.click("[data-page=climate] [data-act=copy]"); pgH.wait_for_timeout(500)
check("diagnosis: '📋 Bericht kopieren' copies it (or shows it to copy by hand)",
      "Kopiert" in pgH.inner_text("[data-page=climate] [data-act=copy]") or pgH.locator("[data-page=climate] .hdText").count() == 1)
check("diagnosis: no errors on the page", not own_hd, own_hd[:3])

# the owner (2026-10-28): his rooms' doors lead to the corridor; with "Zählt für die Heizung" at the door it pauses the heating like a window
urllib.request.urlopen(HA + "/_set?e=binary_sensor.hd_fenster&s=off").read()
wait_hd(lambda: (api("api/rules")["status"]["rooms"].get(key_hd) or {}).get("why") != "window", n=60)
lay_hd["floors"][0]["walls"][-1]["openings"][0]["heat"] = True
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay_hd).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
counted_hd = wait_hd(lambda: (next((r for r in trace_hd()["rooms"] if r["key"] == key_hd), None) or {}).get("counted") == ["binary_sensor.hd_tuer"], n=40)
check("door switch: a door with 'Zählt für die Heizung' counts for the room (no longer a door between two rooms)", counted_hd,
      next((r for r in trace_hd()["rooms"] if r["key"] == key_hd), None))
paused_hd = wait_hd(lambda: (api("api/rules")["status"]["rooms"].get(key_hd) or {}).get("why") == "window", n=80)
check("door switch: the open door (it stayed open) now pauses the heating like a window", paused_hd, api("api/rules")["status"]["rooms"].get(key_hd))

put_rules_hd({"heat": {}, "flows": []})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_hd).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_hd.get(k, d))
post_hd("/_extra", {})
pgH.close()
