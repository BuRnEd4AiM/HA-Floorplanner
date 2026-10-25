"""4.25.0 (#533): 🚗 the car and 🌱 the garden on 🧺 Haushalt. The car, found by its names: its charge in % with a bar, "lädt mit 3,2 kW",
the range, "☀ Nur mit Sonne laden" (evcc's mode: pv / now). The garden: every valve and the switches named like watering, "💧 … 10 min
gießen" opens a zone and the add-on keeps a timer (api/garden), "■ Stopp" closes it; a zone whose time is up is closed by the add-on itself;
a user locked out of switching gets no buttons and the server refuses. The zones chosen in ⚙ replace the ones found.
"""
import datetime as _dt
st_cg = api("api/settings")
set_setting("language", "de")
def post_cg(path, body, user="admin"):
    r = urllib.request.Request(path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json", "X-Remote-User-Name": user})
    try:
        return json.load(urllib.request.urlopen(r)), 200
    except urllib.error.HTTPError as e:
        return {}, e.code
EXTRA_CG = {
    "sensor.e2e_auto_ladestand": {"state": "63.6", "attributes": {"friendly_name": "Auto Ladestand", "unit_of_measurement": "%", "device_class": "battery"}},
    "sensor.e2e_auto_reichweite": {"state": "311.6", "attributes": {"friendly_name": "Auto Reichweite", "unit_of_measurement": "km"}},
    "binary_sensor.e2e_auto_laedt": {"state": "on", "attributes": {"friendly_name": "Auto lädt", "device_class": "battery_charging"}},
    "sensor.e2e_wallbox_leistung": {"state": "3200", "attributes": {"friendly_name": "Wallbox Leistung", "unit_of_measurement": "W", "device_class": "power"}},
    "select.e2e_evcc_mode": {"state": "now", "attributes": {"friendly_name": "Wallbox Modus", "options": ["off", "now", "minpv", "pv"]}},
    "valve.e2e_rasen": {"state": "closed", "attributes": {"friendly_name": "Rasen"}},
    "switch.e2e_bewaesserung_beet": {"state": "off", "attributes": {"friendly_name": "Bewässerung Beet"}},
    "switch.e2e_kaffee": {"state": "off", "attributes": {"friendly_name": "Kaffeemaschine"}},
}
post_cg(HA + "/_extra", EXTRA_CG)
own_cg = []
pgC = b.new_page(viewport={"width": 1400, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgC.on("console", lambda m: own_cg.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgC.on("pageerror", lambda e: own_cg.append("PAGEERROR " + str(e)))
def open_cg():
    pgC.goto(BASE + "?debug=1"); pgC.wait_for_timeout(1500)
    if pgC.is_visible("#modeSwitch [data-mode=live]"): pgC.click("#modeSwitch [data-mode=live]"); pgC.wait_for_timeout(800)
    pgC.click("#tabBar [data-tab=household]"); pgC.wait_for_timeout(1800)
open_cg()
car = "[data-page=household] .hhCar"
ct = pgC.inner_text(car) if pgC.locator(car).count() else ""
check("car: found by its names: 64 %, charging at 3,2 kW, 312 km range, a bar", "64 %" in ct and "lädt mit 3,2 kW" in ct and "312 km" in ct
      and pgC.locator(f"{car} .hhBar").count() == 1, ct)
calls0 = len(ha_calls())
pgC.click(f"{car} [data-act=solar]"); pgC.wait_for_timeout(800)
cd = json.load(urllib.request.urlopen(HA + "/_calldata"))
check("car: '☀ Nur mit Sonne laden' sets evcc's mode to pv", ["select", "select_option", "select.e2e_evcc_mode"] in ha_calls()[calls0:]
      and any(c[1] == "select.e2e_evcc_mode" and c[2].get("option") == "pv" for c in cd if isinstance(c, list) and len(c) > 2 and isinstance(c[2], dict)), (ha_calls()[calls0:], cd[-2:]))
garden = "[data-page=household] .hhGarden"
gt = pgC.inner_text(garden) if pgC.locator(garden).count() else ""
check("garden: the valve and the switch named like watering are its zones (not the coffee machine), watering is off",
      pgC.locator(f"{garden} [data-zone]").count() == 2 and "Bewässerung aus" in gt and pgC.locator(f"{garden} [data-zone='switch.e2e_kaffee']").count() == 0, gt)
calls1 = len(ha_calls())
pgC.click(f"{garden} [data-zone='valve.e2e_rasen']"); pgC.wait_for_timeout(1000)
timers = api_admin("api/garden")["timers"]
left = (timers.get("valve.e2e_rasen", 0) / 1000 - time.time()) / 60
check("garden: '💧 10 min gießen' opens the valve and the add-on keeps a timer of 10 minutes", ["valve", "open_valve", "valve.e2e_rasen"] in ha_calls()[calls1:] and 9 < left <= 10.1,
      (ha_calls()[calls1:], timers))
urllib.request.urlopen(HA + "/_set?e=valve.e2e_rasen&s=open").read(); pgC.wait_for_timeout(1500)
gt = pgC.inner_text(garden)
check("garden: while it waters: 'gießt noch 10 min' and '■ Stopp'", "gießt noch" in gt and "Stopp" in pgC.inner_text(f"{garden} [data-zone='valve.e2e_rasen']"), gt)
pgC.click(f"{garden} [data-zone='valve.e2e_rasen']"); pgC.wait_for_timeout(1000)
check("garden: '■ Stopp' closes it and the timer is gone", ["valve", "close_valve", "valve.e2e_rasen"] in ha_calls()[calls1:] and "valve.e2e_rasen" not in api_admin("api/garden")["timers"])
_, code = post_cg(BASE + "api/garden/water", {"entity": "switch.e2e_kaffee", "minutes": 5})
check("garden: the server waters only a zone of the garden", code == 400, code)
set_setting("userLocks", {**(api("api/settings").get("userLocks") or {}), "cgtablet": ["control"]})
_, code = post_cg(BASE + "api/garden/water", {"entity": "valve.e2e_rasen", "minutes": 5}, user="cgtablet")
check("garden: a user locked out of switching is refused", code == 403, code)
calls2 = len(ha_calls())
ans, code = post_cg(BASE + "api/garden/water", {"entity": "switch.e2e_bewaesserung_beet", "minutes": 1})
check("garden: a minute for the bed: the switch goes on", code == 200 and ["switch", "turn_on", "switch.e2e_bewaesserung_beet"] in ha_calls()[calls2:], (code, ha_calls()[calls2:]))
for _ in range(45):                               # the add-on looks every 20 seconds: after the minute it switches the bed off by itself
    if ["switch", "turn_off", "switch.e2e_bewaesserung_beet"] in ha_calls()[calls2:]: break
    time.sleep(2)
check("garden: when the time is up the add-on switches it off by itself", ["switch", "turn_off", "switch.e2e_bewaesserung_beet"] in ha_calls()[calls2:]
      and not api_admin("api/garden")["timers"], ha_calls()[calls2:])
set_setting("garden", {"zones": ["switch.e2e_kaffee"], "minutes": 15})
open_cg()
check("garden: the zones chosen in ⚙ replace the ones found, with the minutes chosen", pgC.locator(f"{garden} [data-zone]").count() == 1
      and "15 min" in pgC.inner_text(f"{garden} [data-zone='switch.e2e_kaffee']"), pgC.inner_text(garden) if pgC.locator(garden).count() else "")
check("car and garden: no errors on the page", not own_cg, own_cg[:3])
pgC.close()
for k in ("userLocks", "garden", "language"):
    set_setting(k, st_cg.get(k, {} if k == "userLocks" else ""))
post_cg(HA + "/_extra", {})
