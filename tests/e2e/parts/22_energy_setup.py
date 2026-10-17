"""Energy set up the easy way (#407): the tab "⚡ Rechnung" takes over the energy dashboard of Home Assistant (grid with an inverted
sensor, solar from the power sensor next to its energy meter, battery with Home Assistant's sign turned round, gas and water meters),
the setup check list (what is set up, what is missing, meters put into the plan with one click), and an energy dashboard not set up yet.
"""
saved_es = api_admin("api/layout")              # put back at the end
lang_es = api("api/settings")["language"]
set_setting("language", "de")
def mock_energy(body):
    urllib.request.urlopen(urllib.request.Request(HA + "/_energy", data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
mock_energy({"prefs": {"energy_sources": [
    {"type": "grid", "stat_energy_from": "sensor.ed_imp_kwh", "stat_energy_to": "sensor.ed_exp_kwh", "power_config": {"stat_rate_inverted": "sensor.ed_netz"}},
    {"type": "solar", "stat_energy_from": "sensor.ed_pv_kwh"},
    {"type": "battery", "stat_energy_from": "sensor.ed_bout", "stat_energy_to": "sensor.ed_bin", "stat_rate": "sensor.ed_akku", "stat_soc": "sensor.ed_soc"},
    {"type": "gas", "stat_energy_from": "sensor.ed_gas"}, {"type": "water", "stat_energy_from": "sensor.ed_wasser"}], "device_consumption": []},
    "registry": {"sensor.ed_pv_kwh": "dev_inv", "sensor.ed_pv": "dev_inv"}})
pgS = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgS.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgS.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgS.goto(BASE + "?debug=1&mode=edit"); pgS.wait_for_timeout(1500)
# Home Assistant's inverted grid sensor: +1500 = fed in; its battery sensor: +500 = discharging (the tab: plus = charging)
FAKE = {"sensor.ed_netz": ("1500", "W"), "sensor.ed_pv": ("3000", "W"), "sensor.ed_akku": ("500", "W"), "sensor.ed_soc": ("80", "%"),
        "sensor.ed_pv_kwh": ("1234", "kWh"), "sensor.ed_gas": ("845.21", "m³"), "sensor.ed_wasser": ("1234.567", "m³")}
def fake():
    pgS.evaluate("(f) => { Object.entries(f).forEach(([e, [s, u]]) => window.__fp.fakeState(e, s, u)); window.__fp.applyStates(); }", FAKE)
    pgS.wait_for_timeout(250)
pgS.evaluate("() => { const L = window.__fp.layout; delete L.energy; L.floors.forEach((f) => { f.devices = f.devices.filter((d) => !['powermeter', 'houseentry', 'inverter', 'solarpanel', 'battery', 'watermeter', 'gasmeter', 'heatmeter'].includes(d.type)); }); window.__fp.rebuild(); }")
fake()
pgS.click("#powerEditBtn"); pgS.wait_for_timeout(400)
pgS.click("#energyBtn"); pgS.wait_for_timeout(500)
fake()
item = lambda k: pgS.locator(f"#enChecklist li[data-key={k}]")
check("energy setup: the window starts with \"Einrichten\": the button for the energy dashboard and the check list",
      pgS.is_visible("#enHaLoad") and pgS.locator("#enChecklist li").count() >= 6, pgS.inner_text("#energySetup"))
check("energy setup: the check list says the grid is missing (the calculation needs it)", item("grid").get_attribute("data-level") == "todo", item("grid").inner_text())
pgS.click("#enHaLoad"); pgS.wait_for_timeout(1200)
fake()
txt = pgS.inner_text("#energySetup")
check("energy setup: the energy dashboard is read: grid (sign turned), solar from the power sensor of its device (a guess), battery, meters",
      "sensor.ed_netz" in txt and "Vorzeichen umgedreht" in txt and "sensor.ed_pv" in txt and "geraten" in txt and "sensor.ed_akku" in txt and "sensor.ed_soc" in txt
      and "sensor.ed_gas" in txt and pgS.is_visible("#enHaApply"), txt)
pgS.click("#enHaApply"); pgS.wait_for_timeout(600)
fake()
cfg = pgS.evaluate("window.__fp.layout.energy")
check("energy setup: taken over in the tab's signs (grid inverted, battery turned round: plus = charging)",
      cfg.get("grid") == {"entity": "sensor.ed_netz", "invert": True} and cfg.get("solar") == {"entities": ["sensor.ed_pv"]}
      and cfg.get("battery") == {"level": "sensor.ed_soc", "entity": "sensor.ed_akku", "invert": True}, cfg)
e = pgS.evaluate("window.__fp.energy()")
check("energy setup: the calculation adds up: 3000 W solar - 1500 W fed in + 500 W from the battery = 2000 W", e["load"] == 2000 and e["grid"] == -1500, (e["load"], e["grid"]))
check("energy setup: the check list: grid, solar and battery done, the calculation adds up",
      all(item(k).get_attribute("data-level") == "ok" for k in ("grid", "solar", "battery", "sums")), pgS.inner_text("#enChecklist"))
check("energy setup: the gas and water meters of the energy dashboard are missing in the plan, each with a button",
      item("meters").get_attribute("data-level") == "todo" and pgS.locator("#enChecklist .enAddMeter").count() == 2, pgS.inner_text("#enChecklist"))
pgS.locator("#enChecklist .enAddMeter[data-entity='sensor.ed_gas']").click(); pgS.wait_for_timeout(600)
gas = pgS.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].devices.filter((d) => d.entity === 'sensor.ed_gas')")
check("energy setup: one click puts the gas meter into the plan, the list then only misses the water meter",
      len(gas) == 1 and gas[0]["type"] == "gasmeter" and pgS.locator("#enChecklist .enAddMeter").count() == 1, (gas, pgS.inner_text("#enChecklist")))
# --- an energy dashboard that is not set up yet
mock_energy({})
pgS.click("#enHaLoad"); pgS.wait_for_timeout(1000)
check("energy setup: an energy dashboard not set up yet is said so", "noch nicht eingerichtet" in pgS.inner_text("#energySetup") and not pgS.is_visible("#enHaApply"),
      pgS.inner_text("#energySetup"))
pgS.click("#energyClose"); pgS.wait_for_timeout(200)
pgS.evaluate("(l) => fetch('api/layout', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(l)})", saved_es); pgS.wait_for_timeout(400)
pgS.close()
set_setting("language", lang_es)
bad = [x for x in own if "favicon" not in x]
check("energy setup: no console errors", not bad, bad)
