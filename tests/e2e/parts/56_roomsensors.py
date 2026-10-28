"""4.38.0 (#573): 🌡 Raumfühler. A radiator thermostat with an offset in its device (Zigbee2MQTT: number …_local_temperature_calibration)
and one without (Homematic IP), each in a room with a temperature sensor: 🌡 Klima → 📋 Heiz-Regeln shows both with their room's sensor only
suggested; "＋ Übernehmen" takes it and the add-on sets the offset by itself (sensor − what the thermostat measures); the window "Fühler
wählen" offers the room's sensor first and "Wunsch verschieben" moves the other one's target; a temperature set on the page is the wish (the
target is moved again, the thermostat never gets the wish itself); 🌡 Klima shows the sensor in the circle and "am Heizkörper"; taken away,
the offset and the target go back as before.
"""
saved_rs = api_admin("api/layout")              # put back at the end
st_rs = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_rs(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_rules_rs(body):
    r = urllib.request.urlopen(urllib.request.Request(BASE + "api/rules", data=json.dumps(body).encode(), method="PUT",
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
    return json.load(r)
calldata_rs = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
def calls_rs(e, since=0):
    return [c for c in calldata_rs()[since:] if c[1] == e]
lay = json.loads(json.dumps(saved_rs))
f0 = lay["floors"][0]
f0.setdefault("rooms", []).extend([{"id": "rs_r", "name": "Fühlerraum", "color": "#777777", "points": [[70, 60], [74, 60], [74, 63], [70, 63]]},
                                   {"id": "rs_r2", "name": "Fühlerbad", "color": "#777777", "points": [[76, 60], [80, 60], [80, 63], [76, 63]]}])
f0.setdefault("devices", []).extend([
    {"id": "rs_d1", "type": "thermostat", "x": 71, "z": 61, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat", "entity": "climate.rs_th"},
    {"id": "rs_d2", "type": "sensor", "x": 73, "z": 62, "y": 1.6, "rot": 0, "scale": 1, "name": "Fühler", "entity": "sensor.rs_temp"},
    {"id": "rs_d3", "type": "thermostat", "x": 77, "z": 61, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat", "entity": "climate.rs_hm"},
    {"id": "rs_d4", "type": "sensor", "x": 79, "z": 62, "y": 1.6, "rot": 0, "scale": 1, "name": "Fühler", "entity": "sensor.rs_temp2"}])
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
trv = lambda name, meas, target: {"state": "heat", "attributes": {"friendly_name": name, "current_temperature": meas, "temperature": target, "hvac_action": "heating",
                                                                 "hvac_modes": ["off", "heat"], "min_temp": 5, "max_temp": 30, "target_temp_step": 0.5}}
post_rs("/_extra", {
    "climate.rs_th": {**trv("Heizung Fühlerraum", 24.0, 21), "device": "d_rs", "platform": "mqtt"},
    "number.rs_th_local_temperature_calibration": {"state": "0", "device": "d_rs", "platform": "mqtt", "attributes": {
        "friendly_name": "Heizung Fühlerraum Local temperature calibration", "min": -9, "max": 9, "step": 0.1, "unit_of_measurement": "°C"}},
    "sensor.rs_temp": {"state": "20.0", "attributes": {"friendly_name": "Fühlerraum Temperatur", "device_class": "temperature", "unit_of_measurement": "°C"}},
    "climate.rs_hm": {**trv("Heizung Fühlerbad", 23.0, 20), "device": "d_hm", "platform": "homematicip_cloud"},
    "sensor.rs_temp2": {"state": "19.5", "attributes": {"friendly_name": "Fühlerbad Temperatur", "device_class": "temperature", "unit_of_measurement": "°C"}},
})
post_rs("/_regevent", {})                       # the add-on reads the registry again: the offset belongs to the thermostat's device
put_rules_rs({"heat": {}})
own_rs = []
def wait_rs(fn, n=40, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgS.wait_for_timeout(ms)
    return fn()
for _ in range(40):                             # the registry read again (a moment after its event): the thermostat's integration known
    if (api("api/rules")["status"].get("plat") or {}).get("climate.rs_th"): break
    time.sleep(0.3)
pgS = b.new_page(viewport={"width": 1500, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("console", lambda m: own_rs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: own_rs.append("PAGEERROR " + str(e)))
pgS.goto(BASE + "?debug=1"); pgS.wait_for_timeout(3500)
if pgS.is_visible("#modeSwitch [data-mode=live]"): pgS.click("#modeSwitch [data-mode=live]"); pgS.wait_for_timeout(1000)
pgS.click("#tabBar [data-tab=climate]"); pgS.wait_for_timeout(800)
pgS.click("[data-page=climate] [data-view=rules]"); pgS.wait_for_timeout(1000)
card_rs = "[data-page=climate] [data-heat-rule=sensors]"
row_th, row_hm = f"{card_rs} .rsRow[data-climate='climate.rs_th']", f"{card_rs} .rsRow[data-climate='climate.rs_hm']"
check("roomsensors: 📋 Heiz-Regeln has the card 🌡 Raumfühler first, with both thermostats", pgS.locator("[data-page=climate] .hrGrid > .hrCard").first.get_attribute("data-heat-rule") == "sensors"
      and pgS.locator(row_th).count() == 1 and pgS.locator(row_hm).count() == 1)
check("roomsensors: the sensor of the thermostat's room is only suggested", "Fühlerraum Temperatur" in pgS.inner_text(f"{row_th} .rsHow")
      and pgS.locator(f"{row_th} [data-act=rsTake]").count() == 1 and not (api("api/rules")["heat"]["sensors"]["map"]))
check("roomsensors: the kind of thermostat is named (its integration)", wait_rs(lambda: "Zigbee2MQTT" in pgS.inner_text(f"{row_th} .rsName")), pgS.inner_text(f"{row_th} .rsName"))
n0 = len(calldata_rs())
pgS.click(f"{row_th} [data-act=rsTake]")
saved_map = wait_rs(lambda: api("api/rules")["heat"]["sensors"]["map"].get("climate.rs_th"))
check("roomsensors: '＋ Übernehmen' saves the room's sensor for the thermostat", saved_map == {"s": "sensor.rs_temp", "way": "auto"}, saved_map)
cal_rs = wait_rs(lambda: [c for c in calls_rs("number.rs_th_local_temperature_calibration", n0) if c[0] == "set_value"], n=60)
check("roomsensors: the add-on sets the thermostat's offset by itself (20,0 − 24,0 = −4,0)", cal_rs and cal_rs[0][2]["value"] == -4.0, cal_rs)
st_th = wait_rs(lambda: (api("api/rules")["status"].get("sensors") or {}).get("climate.rs_th"))
check("roomsensors: api/rules says how: the offset of its device", (st_th or {}).get("way") == "cal" and st_th.get("ent") == "number.rs_th_local_temperature_calibration", st_th)
pgS.wait_for_timeout(1500)
check("roomsensors: no second write while the thermostat has not measured with the new offset",
      len([c for c in calls_rs("number.rs_th_local_temperature_calibration", n0) if c[0] == "set_value"]) == 1)
check("roomsensors: the card says '🎯 Ausgleich am Thermostat'", wait_rs(lambda: "Ausgleich am Thermostat" in pgS.inner_text(row_th)), pgS.inner_text(row_th))

# --- the window "Fühler wählen": the room's sensor first, "Wunsch verschieben" for the Homematic thermostat
pgS.click(f"{row_hm} [data-act=rsPick]"); pgS.wait_for_timeout(500)
first_rs = pgS.locator(".rsDlg .rsList .rsOpt").first.get_attribute("data-sensor")
check("roomsensors: the window offers the sensor of the thermostat's room first, chosen", first_rs == "sensor.rs_temp2"
      and pgS.locator(".rsDlg .rsList .rsOpt.on").get_attribute("data-sensor") == "sensor.rs_temp2", first_rs)
check("roomsensors: a sensor of a thermostat's own device is not offered", pgS.locator(".rsDlg [data-sensor='number.rs_th_local_temperature_calibration']").count() == 0)
pgS.click(".rsDlg .rsWays [data-way=shift]"); pgS.wait_for_timeout(200)
n1 = len(calldata_rs())
pgS.click(".rsDlg [data-act=rsApply]")
saved_hm = wait_rs(lambda: api("api/rules")["heat"]["sensors"]["map"].get("climate.rs_hm"))
check("roomsensors: the sensor and 'Wunsch verschieben' are saved", saved_hm == {"s": "sensor.rs_temp2", "way": "shift"}, saved_hm)
moved = wait_rs(lambda: [c for c in calls_rs("climate.rs_hm", n1) if c[0] == "set_temperature"], n=60)
check("roomsensors: the target is moved: wish 20 + (23,0 − 19,5) = 23,5", moved and moved[0][2]["temperature"] == 23.5, moved)

# --- 🌡 Klima: the circle shows the sensor and the wish; a temperature set on the page is the wish
pgS.click("[data-page=climate] .tpTools .tpChip:not([data-view])"); pgS.wait_for_timeout(800)
seen_rs = wait_rs(lambda: pgS.evaluate("() => { const s = window.__fp.states()['climate.rs_hm']; return s && s.rs === 'sensor.rs_temp2' && s.ct === 19.5 && s.tt === 20 ? [s.ct, s.tt, s.ct0] : null; }"))
check("roomsensors: the page shows the sensor's temperature and the wish for the thermostat", seen_rs == [19.5, 20, 23], seen_rs)
line_rs = wait_rs(lambda: pgS.locator("[data-page=climate] .clCard .rsRoom[data-sensor='sensor.rs_temp']").count() == 1)
check("roomsensors: the room's card says '🌡 Raumfühler … · am Heizkörper …'", line_rs and "am Heizkörper" in pgS.inner_text("[data-page=climate] .clCard .rsRoom[data-sensor='sensor.rs_temp']"))
n2 = len(calldata_rs())
pgS.evaluate("""() => fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'climate', service: 'set_temperature', entity_id: 'climate.rs_hm', data: { temperature: 21 } }) })""")
wished = wait_rs(lambda: [c for c in calls_rs("climate.rs_hm", n2) if c[0] == "set_temperature"], n=40)
check("roomsensors: 21° set on the page is the wish, the thermostat gets 24,5°", [c[2]["temperature"] for c in wished] == [24.5], wished)
check("roomsensors: the page shows the new wish", wait_rs(lambda: pgS.evaluate("() => window.__fp.states()['climate.rs_hm'].tt") == 21))

# --- taken away: as before
n3 = len(calldata_rs())
put_rules_rs({"heat": {}})
back_cal = wait_rs(lambda: [c for c in calls_rs("number.rs_th_local_temperature_calibration", n3) if c[0] == "set_value"], n=60)
back_hm = wait_rs(lambda: [c for c in calls_rs("climate.rs_hm", n3) if c[0] == "set_temperature"], n=40)
check("roomsensors: taken away, the offset goes back to 0 and the target to the wish (21°)", back_cal and back_cal[-1][2]["value"] == 0 and back_hm and back_hm[-1][2]["temperature"] == 21,
      [back_cal, back_hm])
check("roomsensors: the page shows the thermostat's own values again", wait_rs(lambda: pgS.evaluate("() => { const s = window.__fp.states()['climate.rs_hm']; return !('rs' in s) && s.ct === 23; }")))
check("roomsensors: no errors on the page", not own_rs, own_rs[:3])

urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_rs).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_rs.get(k, d))
post_rs("/_extra", {})
pgS.close()
