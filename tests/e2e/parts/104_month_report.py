"""5.26.0 📊 Monatsbericht (the owner's choice, docs/ideen-5.15 picture 11): last month's heating (the gas meter split by how long each
thermostat heated) and power (the grid meter; per room the devices of the energy dashboard) in euros with Home Assistant's prices, the
change to a year before, the room warmer than set; a card in the settings (on, day, hour, 👁 Vorschau, 📨 Jetzt senden). The rules:
tests/test_monthreport.py.
"""
lang_mr = api("api/settings").get("language", "de")
set_setting("language", "de")
def mock_mr(body):
    urllib.request.urlopen(urllib.request.Request(HA + "/_energy", data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
mock_mr({"prefs": {"energy_sources": [
    {"type": "grid", "stat_energy_from": "sensor.mr_bezug_kwh", "number_energy_price": 0.3},
    {"type": "gas", "stat_energy_from": "sensor.mr_gas", "number_energy_price": 1.1}],
    "device_consumption": [{"stat_consumption": "sensor.mr_tv_kwh", "name": "Fernseher"}]},
    "registry": {}})
lay_mr = api("api/layout")                       # a thermostat and the TV's meter in the first room with a name (put back at the end)
plan_mr = json.loads(json.dumps(lay_mr))
room_mr = next(r for f in plan_mr["floors"] for r in f.get("rooms", []) if r.get("name") and len(r.get("points") or []) >= 3)
fl_mr = next(f for f in plan_mr["floors"] if room_mr in f.get("rooms", []))
cx_mr = sum(p[0] for p in room_mr["points"]) / len(room_mr["points"]); cz_mr = sum(p[1] for p in room_mr["points"]) / len(room_mr["points"])
fl_mr.setdefault("devices", []).extend([{"id": "mr_th", "type": "thermostat", "x": cx_mr, "z": cz_mr, "y": 1.2, "entity": "climate.mr_heizung"},
                                         {"id": "mr_tv", "type": "sensor", "x": cx_mr + 0.1, "z": cz_mr, "y": 1.2, "entity": "sensor.mr_tv_kwh"}])
def put_mr(l):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(l).encode(), method="PUT", headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
put_mr(plan_mr)
rep_mr = api_admin("api/monthreport")
rooms_mr = rep_mr.get("rooms") or []
check("📊 api/monthreport: heating and power of last month in euros, the same as a year before", rep_mr.get("heatUnit") == "€" and rep_mr.get("powerUnit") == "€"
      and (rep_mr.get("heat") or 0) > 0 and (rep_mr.get("power") or 0) > 0 and rep_mr.get("change") == 0, rep_mr)
check("📊 per room: the thermostat's room has its heating and the TV's power", any(r["name"] == room_mr["name"] and r["heat"] > 0 and r["power"] > 0 for r in rooms_mr), rooms_mr)
check("📊 the room warmer than set (1.5°) and the text", (rep_mr.get("warm") or {}).get("d") == 1.5 and rep_mr.get("text", "").startswith("📊 Dein Haus im ")
      and "so viel wie" in rep_mr.get("text", ""), rep_mr.get("text"))
pgM = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_mr = []
pgM.on("pageerror", lambda e: own_mr.append("PAGEERROR " + str(e)))
pgM.goto(BASE + "?debug=1&mode=edit"); pgM.wait_for_timeout(1500)
pgM.click("#settingsBtn"); pgM.wait_for_timeout(400)
pgM.evaluate("() => { const g = document.querySelector('details.setGroup[data-group=alarm]'); g.open = true; document.querySelector('details.sgCard[data-card=report]').open = true; }")
pgM.wait_for_timeout(300)
check("📊 settings: the card „Monatsbericht“ under Warnungen & Alarm with on, day and hour", pgM.is_visible("#setMrOn") and pgM.is_visible("#setMrDay")
      and "Monatsbericht" in pgM.inner_text("details.sgCard[data-card=report] summary"))
pgM.check("#setMrOn"); pgM.select_option("#setMrDay", "3"); pgM.select_option("#setMrHour", "19"); pgM.wait_for_timeout(1200)
check("📊 saved: on, the 3rd at 19 o'clock", api("api/settings").get("monthReport") == {"on": True, "day": 3, "hour": 19}
      and "3." in pgM.inner_text("#monthReport .mrWhen") and "19 Uhr" in pgM.inner_text("#monthReport .mrWhen"), api("api/settings").get("monthReport"))
pgM.click("#mrPreview"); pgM.wait_for_selector("#monthReport .mrRow", timeout=15000)
check("📊 👁 Vorschau: the text and a bar per room", pgM.locator("#monthReport .mrRow").count() == len(rooms_mr) and "Heizung" in pgM.inner_text("#monthReport .mrText"))
pgM.click("#mrSend"); pgM.wait_for_timeout(2500)
check("📊 📨 Jetzt senden without a message channel set up says why", "Nicht geklappt" in pgM.inner_text("#monthReport .mrStatus"), pgM.inner_text("#monthReport .mrStatus"))
check("📊 no errors on the page", not own_mr, own_mr)
pgM.close()
set_setting("monthReport", {"on": False, "day": 1, "hour": 8})
mock_mr({})
put_mr(lay_mr)
set_setting("language", lang_mr)
