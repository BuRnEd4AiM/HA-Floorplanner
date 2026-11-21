"""5.17.0 📡 Funk-Karte (the owner's choice 2026-11-17, docs/ideen-5.15 picture 3): the button „📡 Funk“ beside the colour views shows
over every device and window contact how well it hears its sender (the signal entity of its device in Home Assistant's registries:
Zigbee2MQTT's linkquality, the WiFi signal in dBm; renames.signal_of), green / yellow / red, and a card with the counts and the weakest
ones; a tap on a row shows it in the house.
"""
saved_rm = api_admin("api/layout")
lang_rm = api("api/settings")["language"]
set_setting("language", "de")


def post_rm(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()


post_rm("/_extra", {
    "light.rm_lampe": {"state": "on", "attributes": {"friendly_name": "Funklampe"}, "device": "rm_dev1"},
    "sensor.rm_lampe_linkquality": {"state": "35", "attributes": {"friendly_name": "Funklampe Linkquality", "unit_of_measurement": "lqi"}, "device": "rm_dev1"},
    "binary_sensor.rm_fenster": {"state": "off", "attributes": {"friendly_name": "Funkfenster", "device_class": "window"}, "device": "rm_dev2"},
    "sensor.rm_fenster_wifi_signal": {"state": "-58", "attributes": {"friendly_name": "Funkfenster WiFi", "unit_of_measurement": "dBm",
                                                                      "device_class": "signal_strength"}, "device": "rm_dev2"},
    "switch.rm_dose": {"state": "on", "attributes": {"friendly_name": "Funkdose"}, "device": "rm_dev3"}})
post_rm("/_regoff", {"sensor.rm_dose_linkquality": {"state": "77", "attributes": {"friendly_name": "Funkdose Linkquality", "unit_of_measurement": "lqi"},
                                                    "device": "rm_dev3"}})   # 5.28.2: switched off, like Zigbee2MQTT ships it
post_rm("/_regevent", {})                      # the add-on reads the registry again: which signal belongs to which device
lay_rm = json.loads(json.dumps(saved_rm))
f_rm = lay_rm["floors"][0]
f_rm.setdefault("rooms", []).append({"id": "rm_room", "name": "Funkzimmer", "color": "#777777", "points": [[150, 90], [154, 90], [154, 94], [150, 94]]})
f_rm.setdefault("walls", []).append({"id": "rm_wall", "a": [150, 94], "b": [154, 94], "thickness": 0.2, "height": 2.6,
                                     "openings": [{"id": "rm_win", "type": "window", "pos": 2, "width": 1.2, "height": 1.2, "sill": 0.9, "name": "Funkfenster",
                                                   "entity": "binary_sensor.rm_fenster"}]})
f_rm.setdefault("devices", []).append({"id": "rm_lamp", "type": "lamp", "x": 151, "z": 91, "y": 0, "rot": 0, "scale": 1, "name": "Funklampe", "entity": "light.rm_lampe"})
f_rm["devices"].append({"id": "rm_plug", "type": "switch", "x": 153, "z": 91, "y": 0.3, "rot": 0, "scale": 1, "name": "Funkdose", "entity": "switch.rm_dose"})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay_rm).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
for _ in range(60):
    sg = api("api/signals")
    if sg["of"].get("light.rm_lampe") and sg["of"].get("binary_sensor.rm_fenster") and sg.get("offOf", {}).get("switch.rm_dose"):
        break
    time.sleep(0.25)
check("📡 the add-on knows the signal entity of each device (Zigbee linkquality, WiFi dBm)",
      sg["of"].get("light.rm_lampe") == "sensor.rm_lampe_linkquality" and sg["of"].get("binary_sensor.rm_fenster") == "sensor.rm_fenster_wifi_signal", sg)

pgRM = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_rm = []
pgRM.on("pageerror", lambda e: own_rm.append("PAGEERROR " + str(e)))
pgRM.goto(BASE + "?debug=1&mode=live"); pgRM.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgRM.wait_for_timeout(1500)
pgRM.evaluate("window.__fp.switchFloor(0)"); pgRM.wait_for_timeout(800)
check("📡 the button „📡 Funk“ is there (signals known), the card is not open yet", pgRM.is_visible("#radioBtn") and "Funk" in pgRM.inner_text("#radioBtn")
      and pgRM.is_hidden("#radioCard"))
pgRM.click("#radioBtn"); pgRM.wait_for_timeout(1200)
card_rm = pgRM.inner_text("#radioCard")
check("📡 the card: „Empfang im Haus“ with the counts, the lamp with LQI 35 as the weakest",
      "Empfang im Haus" in card_rm and pgRM.locator("#radioCard .rcChip[data-q=bad]").count() == 1 and "schwach 1" in card_rm
      and pgRM.locator("#radioCard .rcRow[data-id=rm_lamp]").count() == 1 and "LQI 35" in pgRM.inner_text("#radioCard .rcRow[data-id=rm_lamp]"), card_rm[:300])
check("📡 the signs in the house: the lamp red (weak), the window contact green (good)",
      pgRM.evaluate("window.__fp.radioMark('rm_lamp')") == "bad" and pgRM.evaluate("window.__fp.radioMark('rm_win')") == "good",
      [pgRM.evaluate("window.__fp.radioMark('rm_lamp')"), pgRM.evaluate("window.__fp.radioMark('rm_win')")])
urllib.request.urlopen(f"{HA}/_set?e=sensor.rm_lampe_linkquality&s=150").read()
ok_rm = False
for _ in range(40):
    if pgRM.evaluate("window.__fp.radioMark('rm_lamp')") == "good":
        ok_rm = True
        break
    pgRM.wait_for_timeout(250)
check("📡 a new value of Home Assistant: the sign turns green at once", ok_rm, pgRM.evaluate("window.__fp.radioMark('rm_lamp')"))

# ---- 5.28.2 (the owner: „nur ein paar dort erkannt … ich kann nicht für alle das aktivieren“): „📡 Alle einschalten“
check("📡 5.28.2: the add-on knows the switched-off signal of the plug's device", sg.get("offOf", {}).get("switch.rm_dose") == "sensor.rm_dose_linkquality"
      and "sensor.rm_dose_linkquality" in sg.get("off", []), sg)
on_box = pgRM.locator("#radioCard .rcOn")
check("📡 5.28.2: at the top of the card „Ausgeschaltet in Home Assistant … (1)“ and the button „📡 Alle 1 einschalten“",
      on_box.count() == 1 and "(1)" in on_box.inner_text() and pgRM.locator("#radioCard .rcOnBtn").inner_text() == "📡 Alle 1 einschalten"
      and pgRM.evaluate("window.__fp.radioMark('rm_plug')") is None, on_box.inner_text() if on_box.count() else pgRM.inner_text("#radioCard")[:300])
if pgRM.locator("#radioCard .rcOnBtn").count():
    pgRM.click("#radioCard .rcOnBtn")
ups = []
for _ in range(40):
    ups = json.load(urllib.request.urlopen(HA + "/_regupdates"))
    if ups:
        break
    pgRM.wait_for_timeout(250)
check("📡 5.28.2: the add-on switches it on in Home Assistant (config/entity_registry/update), only that one", ups == ["sensor.rm_dose_linkquality"], ups)
pgRM.wait_for_timeout(500)
check("📡 5.28.2: the card says „✓ Eingeschaltet: 1 …“", "Eingeschaltet: 1" in (pgRM.inner_text("#radioCard .rcOnMsg") if pgRM.locator("#radioCard .rcOnMsg").count() else ""),
      pgRM.inner_text("#radioCard")[:400])
mark_plug = None
for _ in range(60):                             # the card asks for the signals again after 5 s
    mark_plug = pgRM.evaluate("window.__fp.radioMark('rm_plug')")
    if mark_plug:
        break
    pgRM.wait_for_timeout(250)
check("📡 5.28.2: its value comes: the plug has its sign (LQI 77, yellow), the box with the button is gone",
      mark_plug == "mid" and pgRM.locator("#radioCard .rcOn").count() == 0, [mark_plug, pgRM.inner_text("#radioCard")[:300]])
pgRM.click("#radioCard .rcClose"); pgRM.wait_for_timeout(500)
check("📡 ✕ closes the card and the signs go", pgRM.is_hidden("#radioCard") and pgRM.evaluate("window.__fp.radioMark('rm_lamp')") is None
      and pgRM.get_attribute("#radioBtn", "aria-pressed") == "false")
check("📡 no errors on the page", not own_rm, own_rm)
pgRM.close()
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_rm).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
post_rm("/_extra", {})
post_rm("/_regoff", {})
post_rm("/_regevent", {})
set_setting("language", lang_rm)
