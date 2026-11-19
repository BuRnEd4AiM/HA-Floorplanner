"""5.19.0 🔌 Stromfresser (the owner's choice 2026-11-19, docs/ideen-5.15 picture 6; his choices: a card on the page ⚡ Energie, 2–5
o'clock fixed, "⏰ Nachts abschalten …" makes a routine): the card asks Home Assistant's statistics by hours for the last 14 nights, shows
the house's draw at night (the test Home Assistant: grid 0.4 + sun 0.6 − fed in 0.3 kWh an hour = 700 W) and € a year, the devices of
the energy dashboard (a fridge "läuft immer"), and the button opens the routine's editor with the plug of the device (the switch on the
same device, api/energy/meters "plugs"). The sums are tested in tests/standby.test.mjs, the plugs in tests/test_server.py.
"""
lang_ph = api("api/settings")["language"]
set_setting("language", "de")


def post_ph(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()


post_ph("/_extra", {"switch.ph_tv_steckdose": {"state": "on", "attributes": {"friendly_name": "Steckdose Fernseher PH"}}})
post_ph("/_energy", {"prefs": {"energy_sources": [
    {"type": "grid", "stat_energy_from": "sensor.netz_bezug", "stat_energy_to": "sensor.netz_einspeisung", "number_energy_price": 0.3},
    {"type": "solar", "stat_energy_from": "sensor.pv_ertrag"}],
    "device_consumption": [{"stat_consumption": "sensor.ph_tv_kwh", "name": "Fernseher PH"}, {"stat_consumption": "sensor.ph_kuehl_kwh", "name": "Kühlschrank PH"}]},
    "registry": {"sensor.ph_tv_kwh": "dev_ph_tv", "switch.ph_tv_steckdose": "dev_ph_tv", "sensor.ph_kuehl_kwh": "dev_ph_k"}})
meters_ph = api_admin("api/energy/meters")
check("🔌 api/energy/meters names the plug of a device (the switch on its device), none for a device without one",
      meters_ph.get("plugs") == {"sensor.ph_tv_kwh": "switch.ph_tv_steckdose"}, meters_ph.get("plugs"))

pgPH = b.new_page(viewport={"width": 1280, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_ph = []
pgPH.on("pageerror", lambda e: own_ph.append("PAGEERROR " + str(e)))
before_ph = len(json.load(urllib.request.urlopen(HA + "/_stats")))
pgPH.goto(BASE + "?debug=1"); pgPH.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgPH.wait_for_timeout(800)
if pgPH.is_visible("#modeSwitch [data-mode=live]"):
    pgPH.click("#modeSwitch [data-mode=live]"); pgPH.wait_for_timeout(1000)
pgPH.click("#tabBar [data-tab=energy]")
pgPH.wait_for_selector(".hogCard .hogBig", timeout=20000)
card_ph = pgPH.inner_text(".hogCard")
asked_ph = [a for a in json.load(urllib.request.urlopen(HA + "/_stats"))[before_ph:] if a[1] == "hour" and "sensor.ph_tv_kwh" in a[0]]
check("🔌 the card asks the statistics by hours (the meters and the devices)", asked_ph and {"sensor.netz_bezug", "sensor.pv_ertrag"} <= set(asked_ph[-1][0]), asked_ph)
check("🔌 the card: „Stromfresser“, the house at night 700 W and € a year, the last 14 nights", "STROMFRESSER" in card_ph.upper() and "700 W" in card_ph
      and "im Jahr" in card_ph and "14 Nächte" in card_ph, card_ph)
check("🔌 the devices with their watts: the fridge „läuft immer“, the TV not", pgPH.locator(".hogRow.always[data-id='sensor.ph_kuehl_kwh']").count() == 1
      and pgPH.locator(".hogRow:not(.always)[data-id='sensor.ph_tv_kwh']").count() == 1 and "250 W" in card_ph, card_ph)
check("🔌 the tip names the TV (it has a plug) and what switching it off 1–6 o'clock saves", "Fernseher PH von 01:00 bis 06:00 Uhr ausschalten" in card_ph, card_ph)
pgPH.click(".hogCard [data-act=standbyOff]"); pgPH.wait_for_timeout(1200)
draft_ph = pgPH.inner_text(".feDlg") if pgPH.is_visible(".feDlg") else ""
check("🔌 „⏰ Nachts abschalten …“ opens ▶ Abläufe with a new routine: 01:00 off, 06:00 on, the TV's plug", pgPH.is_visible(".feDlg")
      and "01:00" in draft_ph and "06:00" in draft_ph and "Steckdose Fernseher PH" in draft_ph, draft_ph[-500:])
pgPH.on("dialog", lambda d: d.accept())                  # "leave without saving?"
pgPH.keyboard.press("Escape"); pgPH.wait_for_timeout(500)
check("🔌 nothing saved until „Speichern“: no new routine", not any("Nachts abschalten" in f.get("name", "") for f in api_admin("api/rules").get("flows") or []))
check("🔌 no errors on the page", not own_ph, own_ph)
pgPH.close()
post_ph("/_energy", {})
post_ph("/_extra", {})
set_setting("language", lang_ph)
