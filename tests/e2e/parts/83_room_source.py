"""5.4.0 (#705, Miicki: "Ich möchte, dass die angezeigte Raumtemperatur die IST-Temperatur des Thermostats ist, ohne die anderen Sensoren
aus dem Home-Assistant-Bereich entfernen zu müssen"): a room says where its temperature and its humidity come from. "🌡 Temperatur von":
automatic (the mean of its sensors, as before), the thermostat, or one sensor; each choice shows what it measures now. The room's tile, the
colour view and the 🌡 Klima page follow; automatic removes the field again. A room with only a thermostat has no such field. In the new
panel („✨ Neu“) the fields are under the tab „Geräte“ and the search finds them.
"""
saved_src = api_admin("api/layout")             # put back at the end
st_src = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_src(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_src(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
lay_src = json.loads(json.dumps(saved_src))
f0_src = lay_src["floors"][0]
f0_src.setdefault("rooms", []).extend([
    {"id": "src_wz", "name": "Quellraum", "color": "#777777", "points": [[90, 90], [95, 90], [95, 94], [90, 94]]},
    {"id": "src_nur", "name": "Nurthermostat", "color": "#777777", "points": [[95, 90], [99, 90], [99, 94], [95, 94]]}])
f0_src.setdefault("devices", []).extend([
    {"id": "src_th", "type": "thermostat", "x": 91, "z": 91, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat", "entity": "climate.src_wz"},
    {"id": "src_na", "type": "sensor", "x": 92, "z": 92, "y": 1.5, "rot": 0, "scale": 1, "name": "Netatmo", "entity": "sensor.src_netatmo"},
    {"id": "src_dz", "type": "sensor", "x": 93, "z": 92, "y": 1.2, "rot": 0, "scale": 1, "name": "dingz", "entity": "sensor.src_dingz"},
    {"id": "src_hu", "type": "sensor", "x": 93, "z": 93, "y": 1.5, "rot": 0, "scale": 1, "name": "Feuchte", "entity": "sensor.src_feuchte"},
    {"id": "src_th2", "type": "thermostat", "x": 97, "z": 92, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat 2", "entity": "climate.src_nur"}])
put_src(lay_src)
post_src("/_extra", {
    "climate.src_wz": {"state": "heat", "attributes": {"friendly_name": "Thermostat Quellraum", "current_temperature": 23.0, "current_humidity": 48,
                                                      "temperature": 21, "hvac_action": "idle", "hvac_modes": ["off", "heat"], "min_temp": 7, "max_temp": 30}},
    "climate.src_nur": {"state": "heat", "attributes": {"friendly_name": "Thermostat Nur", "current_temperature": 19.0, "temperature": 20, "hvac_modes": ["off", "heat"]}},
    "sensor.src_netatmo": {"state": "22.8", "attributes": {"friendly_name": "Netatmo Wohnzimmer", "unit_of_measurement": "°C", "device_class": "temperature"}},
    "sensor.src_dingz": {"state": "20.6", "attributes": {"friendly_name": "dingz Zimmertemperatur", "unit_of_measurement": "°C", "device_class": "temperature"}},
    "sensor.src_feuchte": {"state": "55", "attributes": {"friendly_name": "Netatmo Feuchte", "unit_of_measurement": "%", "device_class": "humidity"}},
})
own_src = []
pgR = b.new_page(viewport={"width": 1440, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgR.on("console", lambda m: own_src.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgR.on("pageerror", lambda e: own_src.append("PAGEERROR " + str(e)))
pgR.goto(BASE + "?debug=1&mode=edit"); pgR.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgR.wait_for_timeout(1000)
pgR.evaluate("window.__fp.switchFloor(0)"); pgR.wait_for_timeout(600)
pgR.wait_for_function("window.__fp.states()['sensor.src_dingz']?.state === '20.6'", timeout=15000)
room_src = lambda rid: next(r for r in pgR.evaluate("window.__fp.layout.floors[0].rooms") if r["id"] == rid)
def sel_src(rid):
    pgR.evaluate(f"window.__fp.select('room', '{rid}')"); pgR.wait_for_timeout(500)
opts_src = lambda sel: pgR.evaluate(f"[...document.querySelectorAll('{sel} option')].map((o) => o.value + '=' + o.textContent)")
def mode_src(m):
    pgR.click(f"#modeSwitch [data-mode={m}]"); pgR.wait_for_timeout(900)
    if m == "edit": pgR.evaluate("window.__fp.switchFloor(0)"); pgR.wait_for_timeout(400)
tile_src = lambda: pgR.inner_text("#roomTiles [data-room=src_wz]") if pgR.locator("#roomTiles [data-room=src_wz]").count() else ""
wait_tile = lambda v: pgR.wait_for_function("(v) => { const t = document.querySelector('#roomTiles [data-room=src_wz]'); return t && t.innerText.includes(v); }", arg=v, timeout=15000)

sel_src("src_wz")
o_t = opts_src("#roomTempFrom")
check("#705: a room with a thermostat and two sensors has „Temperatur von“: automatic (their mean 21,7 °C), the thermostat 23,0 °C, each sensor with its value",
      pgR.is_visible("#roomTempFrom") and "Temperatur von" in pgR.inner_text("#props")
      and o_t == ["=Automatisch · 21,7 °C", "climate=Thermostat · 23,0 °C", "sensor.src_dingz=dingz Zimmertemperatur · 20,6 °C", "sensor.src_netatmo=Netatmo Wohnzimmer · 22,8 °C"]
      and pgR.locator("#roomTempFrom").input_value() == "", o_t)
o_h = opts_src("#roomHumidFrom")
check("#705: „Luftfeuchte von“ the same: automatic (the sensor 55 %), the thermostat 48 %, the sensor; a line says what it is for",
      o_h == ["=Automatisch · 55 %", "climate=Thermostat · 48 %", "sensor.src_feuchte=Netatmo Feuchte · 55 %"] and "Heizung regelt weiter" in pgR.inner_text("#roomSrcHint"), o_h)
pgR.select_option("#roomTempFrom", "climate"); pgR.wait_for_timeout(600)
check("#705: „Thermostat“ is stored as tempFrom: climate", room_src("src_wz").get("tempFrom") == "climate", room_src("src_wz"))
sel_src("src_nur")
check("#705: a room with only a thermostat has no such field (nothing to choose)", pgR.locator("#roomTempFrom").count() == 0 and pgR.locator("#roomHumidFrom").count() == 0)

mode_src("live"); wait_tile("23,0°")
check("#705: live, the room's tile shows the thermostat's 23,0° (not the mean 21,7°)", "23,0°" in tile_src() and "21,7°" not in tile_src(), tile_src())
pgR.click("#tabBar [data-tab=climate]"); pgR.wait_for_timeout(1200)
card_src = pgR.inner_text(".clCard[data-room=src_wz]") if pgR.locator(".clCard[data-room=src_wz]").count() else ""
check("#705: the 🌡 Klima page shows the same: 23,0° and no „im Raum …“ under it", "23,0°" in card_src and "im Raum" not in card_src, card_src)
pgR.click("#tabBar [data-tab=house]"); pgR.wait_for_timeout(800)

mode_src("edit"); sel_src("src_wz")
pgR.select_option("#roomTempFrom", "sensor.src_dingz"); pgR.wait_for_timeout(600)
mode_src("live"); wait_tile("20,6°")
check("#705: one sensor chosen (the dingz): stored as its id, the tile shows only its 20,6°", room_src("src_wz").get("tempFrom") == "sensor.src_dingz" and "20,6°" in tile_src(), tile_src())

mode_src("edit"); sel_src("src_wz")
check("#705: the field shows the chosen sensor", pgR.locator("#roomTempFrom").input_value() == "sensor.src_dingz")
pgR.select_option("#roomTempFrom", ""); pgR.wait_for_timeout(600)
check("#705: back to „Automatisch“: nothing stored any more", "tempFrom" not in room_src("src_wz"), room_src("src_wz"))
mode_src("live"); wait_tile("21,7°")
check("#705: … and the tile shows the mean 21,7° again", "21,7°" in tile_src(), tile_src())
# the new panel („✨ Neu“, the owner 2026-11-10: „bitte vergiss nicht die Ansicht in der v2“): the fields under the tab „Geräte“, the search finds them
pgR.goto(BASE + "?debug=1&mode=edit&ui=2"); pgR.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgR.wait_for_timeout(1000)
pgR.evaluate("window.__fp.switchFloor(0)"); pgR.wait_for_timeout(600)
sel_src("src_wz")
pgR.click("#v2RoomTabs [data-tab=devices]"); pgR.wait_for_timeout(500)
check("#705 / ✨ Neu: in the new panel „Temperatur von“ and „Luftfeuchte von“ are under the tab „Geräte“, with the line under them",
      pgR.evaluate("document.body.classList.contains('uiV2')") and pgR.is_visible("#roomTempFrom") and pgR.is_visible("#roomHumidFrom") and pgR.is_visible("#roomSrcHint")
      and pgR.get_attribute("#v2RoomTabs button.on", "data-tab") == "devices", pgR.evaluate("document.body.className"))
pgR.click("#v2RoomTabs [data-tab=general]"); pgR.wait_for_timeout(300)
pgR.fill("#v2Search", "Temperatur von"); pgR.wait_for_timeout(600)
check("#705 / ✨ Neu: „🔍 Einstellung suchen“ finds „Temperatur von“ from another tab", pgR.is_visible("#roomTempFrom") and "Treffer" in pgR.inner_text("#v2SearchRes"),
      pgR.inner_text("#v2SearchRes"))
pgR.fill("#v2Search", ""); pgR.wait_for_timeout(300)
pgR.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
check("#705: no errors on the page", not own_src, own_src[:5])
pgR.close()
post_src("/_extra", {})
put_src(saved_src)
set_setting("language", st_src.get("language", "de")); set_setting("units", st_src.get("units", "metric"))
