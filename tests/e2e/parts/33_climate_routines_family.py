"""4.5.0 (#483): the pages 🌡 Klima, ▶ Abläufe and 👨‍👩‍👧 Familie of the tab bar. Klima: a card per room (temperature, the thermostat as a
circle to drag (#495) and big or small, − / + as one call,
heats, "Lüften", an open window while it heats with "Heizung aus"), the thermostats and water heaters in no room, the tip. Abläufe: a button
per scene and script, "Ich gehe" with its check ("Alles aus": lights and players off), "Gute Nacht" with its linked routine ("Trotzdem
starten"), automations on / off for editors, the picked routines in ⚙ → "Reiter unten". Familie: the people with picture, place and the
phone's battery (api/family), the pinboard (api/pinboard), also on ☀ Heute; a user who may not switch has no Klima and no Abläufe.
"""
saved_cf = api_admin("api/layout")              # put back at the end
st_cf = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_cf(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
lay = json.loads(json.dumps(saved_cf))
f0 = lay["floors"][0]
f0.setdefault("rooms", []).append({"id": "cl_r", "name": "Klimaraum", "color": "#777777", "points": [[40, 40], [44, 40], [44, 43], [40, 43]]})
f0.setdefault("walls", []).append({"id": "cl_w", "a": [40, 40], "b": [44, 40], "thickness": 0.2, "height": 2.6, "openings": [
    {"id": "cl_o", "type": "window", "pos": 2, "width": 1.2, "height": 1.2, "sill": 0.9, "entity": "binary_sensor.cl_fenster", "name": "Fenster Klimaraum"}]})
f0.setdefault("devices", []).extend([
    {"id": "cl_th", "type": "thermostat", "x": 41, "z": 41, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat", "entity": "climate.cl_test"},
    {"id": "cl_co2", "type": "sensor", "x": 42, "z": 41.5, "y": 1.5, "rot": 0, "scale": 1, "name": "CO2", "entity": "sensor.cl_co2"}])
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
post_cf("/_extra", {
    "climate.cl_test": {"state": "heat", "attributes": {"friendly_name": "Thermostat Klimaraum", "current_temperature": 19.5, "temperature": 21, "hvac_action": "heating",
                                                       "hvac_modes": ["off", "heat"], "min_temp": 7, "max_temp": 30, "target_temp_step": 0.5}},
    "sensor.cl_co2": {"state": "1350", "attributes": {"friendly_name": "CO2 Klimaraum", "unit_of_measurement": "ppm", "device_class": "carbon_dioxide"}},
    "binary_sensor.cl_fenster": {"state": "on", "attributes": {"friendly_name": "Fenster Klimaraum", "device_class": "window"}},
    "water_heater.wp": {"state": "heat_pump", "attributes": {"friendly_name": "Warmwasser", "current_temperature": 48, "temperature": 50}},
    "scene.cl_filmabend": {"state": "unknown", "attributes": {"friendly_name": "Filmabend"}},
    "script.cl_kaffee": {"state": "off", "attributes": {"friendly_name": "Kaffee kochen"}},
    "automation.cl_flur": {"state": "on", "attributes": {"friendly_name": "Flurlicht"}},
    "media_player.cl_tv": {"state": "playing", "attributes": {"friendly_name": "Fernseher"}},
    "person.anna": {"state": "home", "last_changed": "2026-10-21T09:02:00+00:00", "attributes": {"friendly_name": "Anna", "source": "device_tracker.anna_handy",
                    "device_trackers": ["device_tracker.anna_handy", "device_tracker.anna_fritz"], "entity_picture": "/api/image/serve/abc123/512x512"}},
    "person.max": {"state": "Arbeit", "attributes": {"friendly_name": "Max"}},
    "device_tracker.anna_handy": {"state": "home", "device": "d_anna", "attributes": {"friendly_name": "Annas Handy"}},
    "sensor.anna_handy_battery_level": {"state": "15", "device": "d_anna", "attributes": {"friendly_name": "Annas Handy Akku", "device_class": "battery", "unit_of_measurement": "%"}},
    "device_tracker.anna_fritz": {"state": "home", "attributes": {"friendly_name": "Annas Handy (FRITZ!Box)", "source_type": "router"}},
    "sensor.anna_handy_wifi_connection": {"state": "Zuhause-5G", "device": "d_anna", "attributes": {"friendly_name": "Annas Handy WLAN"}},
    "sensor.anna_handy_area": {"state": "Küche", "device": "d_anna", "attributes": {"friendly_name": "Annas Handy Raum"}},
})
urllib.request.urlopen(HA + "/_set?e=light.wohnzimmer&s=on").read()
own_cf = []
def watch_cf(pg_):
    pg_.on("console", lambda m: own_cf.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_cf.append("PAGEERROR " + str(e)))
    return pg_
tabs_cf = lambda pg_: pg_.evaluate("[...document.querySelectorAll('#tabBar [data-tab]')].map((b) => b.dataset.tab)")
calldata = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
def wait_for(fn, n=20, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgC.wait_for_timeout(ms)
    return fn()

pgC = watch_cf(b.new_page(viewport={"width": 1280, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgC.goto(BASE + "?debug=1"); pgC.wait_for_timeout(1500)
if pgC.is_visible("#modeSwitch [data-mode=live]"): pgC.click("#modeSwitch [data-mode=live]"); pgC.wait_for_timeout(1200)
tb = tabs_cf(pgC)
check("4.5 (#483): the bar has 🌡 Klima, ▶ Abläufe and 👨‍👩‍👧 Familie in this order (📷 Kameras between them when there is a camera)",
      [k for k in tb if k in ("climate", "routines", "family")] == ["climate", "routines", "family"] and tb.index("climate") > tb.index("today"), tb)

# --- 🌡 Klima
pgC.click("#tabBar [data-tab=climate]"); pgC.wait_for_timeout(1200)
card = ".clCard[data-room=cl_r]"
txt = pgC.inner_text(card) if pgC.locator(card).count() else ""
check("climate: the room's card: 19,5°, target 21, heats, 'Lüften · 1350 ppm', the open window, a red edge",
      "19,5°" in txt and "Soll" in txt and "21,0°" in txt and "heizt" in txt and "Lüften · 1350 ppm" in txt and "Fenster Klimaraum" in txt
      and "alert" in (pgC.get_attribute(card, "class") or ""), txt)
modes_cf = pgC.evaluate(f"[...document.querySelectorAll('{card} .thMode')].map((b) => b.dataset.mode)")
check("climate (#495): the thermostat as a circle like Home Assistant's, the knob to drag, − / + and the modes of the device (Heizen, Aus)",
      pgC.locator(f"{card} .th.big .thSvg.thDrag").count() == 1 and pgC.locator(f"{card} .thPlus").count() == 1 and modes_cf == ["heat", "off"], modes_cf)
page = pgC.inner_text("[data-page=climate]")
check("climate: the thermostat and the water heater in no room, and the tip about the window", "Warmwasser" in page and "Heizung Wohnzimmer" in page
      and "Klimaraum" in pgC.inner_text(".clTip") and "Fenster offen" in pgC.inner_text(".clTip"), page[-400:])
before = len(calldata())
pgC.click(f"{card} .thPlus"); pgC.click(f"{card} .thPlus"); pgC.wait_for_timeout(200)
shown = pgC.inner_text(f"{card} .thT")
sets = wait_for(lambda: [c for c in calldata()[before:] if c[0] == "set_temperature" and c[1] == "climate.cl_test"])
check("climate: + + shows 22° at once and sends one call with 22 after the pause", "22,0°" in shown and len(sets) == 1 and sets[0][2].get("temperature") == 22, (shown, sets))
bx = pgC.locator(f"{card} .thSvg").bounding_box(); cx, cy = bx["x"] + bx["width"] * 110 / 220, bx["y"] + bx["height"] * 104 / 196
before = len(calldata())
pgC.mouse.move(cx + 60, cy - 40); pgC.mouse.down(); pgC.mouse.move(cx, cy - 80, steps=5)
during = pgC.inner_text(f"{card} .thT")
pgC.mouse.up()
sets = wait_for(lambda: [c for c in calldata()[before:] if c[0] == "set_temperature" and c[1] == "climate.cl_test"])
check("climate (#495): dragging the knob to the top of the circle shows and sends 18,5 (7 to 30), once after letting go",
      "18,5" in during and len(sets) == 1 and sets[0][2].get("temperature") == 18.5, (during, sets))
pgC.click("#tabBar .tbEdit"); pgC.wait_for_timeout(500)
pgC.click(f"{card} .bdTools [data-act=size]"); pgC.wait_for_timeout(800)
small_cf = pgC.locator(f"{card} .th.small").count()
pgC.click("[data-act=done]"); pgC.wait_for_timeout(500)
lay_cf = api("api/settings").get("pageLayouts", {}).get("climate", {})
check("climate (#495): in ✎ the button ⤡ makes the circle small, for everybody (settings.pageLayouts)",
      small_cf == 1 and pgC.locator(f"{card} .th.small").count() == 1 and lay_cf.get("sizes", {}).get("room:cl_r") == "small", (small_cf, lay_cf))
pgC.click("[data-page=climate] [data-filter=notice]"); pgC.wait_for_timeout(300)
check("climate: 'Nur mit Hinweis' keeps the room with the open window", pgC.locator(card).count() == 1)
before = len(calldata())
pgC.click(f"{card} .clWarn button")
offs = wait_for(lambda: [c for c in calldata()[before:] if c[0] == "set_hvac_mode" and c[1] == "climate.cl_test"])
check("climate: 'Heizung aus' at the open window sets the thermostat off", offs and offs[0][2].get("hvac_mode") == "off", offs)
pgC.click(f"{card} .clName"); pgC.wait_for_timeout(1000)
check("climate: a tap on the room's name shows it in the house", pgC.is_hidden("#tabPages") and pgC.evaluate("document.querySelector('#tabBar [data-tab].active')?.dataset.tab") == "house")

# --- ▶ Abläufe
pgC.click("#tabBar [data-tab=routines]"); pgC.wait_for_timeout(1000)
names = pgC.evaluate("[...document.querySelectorAll('[data-page=routines] [data-routine]')].map((b) => b.dataset.routine)")
check("routines: 'Ich gehe' and 'Gute Nacht' first, then every scene and script (none picked)",
      pgC.locator("[data-page=routines] [data-check=leave]").count() == 1 and pgC.locator("[data-page=routines] [data-check=night]").count() == 1
      and {"scene.cl_filmabend", "script.cl_kaffee", "scene.gaming"} <= set(names), names)
pgC.click("[data-page=routines] [data-routine='scene.cl_filmabend']")
started = wait_for(lambda: ["scene", "turn_on", "scene.cl_filmabend"] in ha_calls())
pgC.wait_for_timeout(300)
check("routines: a tap starts the scene and the button says so", started and "gestartet" in pgC.inner_text("[data-page=routines] [data-routine='scene.cl_filmabend']"))
pgC.click("[data-page=routines] [data-check=leave]"); pgC.wait_for_timeout(500)
rows = pgC.evaluate("[...document.querySelectorAll('.rtDlg [data-row]')].map((r) => r.dataset.row)")
btns = pgC.evaluate("[...document.querySelectorAll('.rtDlg [data-act]')].map((r) => r.dataset.act)")
check("routines: 'Ich gehe' first shows what is open or on: the window, the lights, the TV; 'Zurück' and 'Alles aus'",
      pgC.is_visible(".rtDlg") and {"open", "lights", "media"} <= set(rows) and btns == ["back", "allOff"], (rows, btns))
pgC.click(".rtDlg [data-act=allOff]")
offed = wait_for(lambda: ["media_player", "turn_off", "media_player.cl_tv"] in ha_calls() and ["light", "turn_off", "light.wohnzimmer"] in ha_calls())
pgC.wait_for_timeout(2000)
check("routines: 'Alles aus' switches the lights and the TV off, says 'Erledigt' and closes", offed and not pgC.evaluate("document.querySelector('.rtDlg').open"))
set_setting("routineNight", "script.cl_kaffee")
pgC.reload(); pgC.wait_for_timeout(1800)
if pgC.is_visible("#modeSwitch [data-mode=live]"): pgC.click("#modeSwitch [data-mode=live]"); pgC.wait_for_timeout(800)
pgC.click("#tabBar [data-tab=routines]"); pgC.wait_for_timeout(800)
check("routines: 'Gute Nacht' names what it starts after the check", "Kaffee kochen" in pgC.inner_text("[data-page=routines] [data-check=night]"))
pgC.click("[data-page=routines] [data-check=night]"); pgC.wait_for_timeout(500)
btns = pgC.evaluate("[...document.querySelectorAll('.rtDlg [data-act]')].map((r) => r.dataset.act)")
check("routines: with the window still open: 'Zurück' and 'Trotzdem starten'", "anyway" in btns and "Kaffee kochen" in pgC.inner_text(".rtDlg"), btns)
pgC.click(".rtDlg [data-act=anyway]")
check("routines: 'Trotzdem starten' starts the linked script", wait_for(lambda: ["script", "turn_on", "script.cl_kaffee"] in ha_calls()))
pgC.wait_for_timeout(1800)
pgC.click(".rtAutos summary"); pgC.wait_for_timeout(300)
pgC.click(".rtAutos [data-auto='automation.cl_flur']")
check("routines: an editor switches an automation off", wait_for(lambda: ["automation", "turn_off", "automation.cl_flur"] in ha_calls()))

# --- ⚙ → "Reiter unten": the picked routines
pgC.click("#tabBar [data-tab=house]"); pgC.wait_for_timeout(300)
pgC.click("#settingsBtn"); pgC.wait_for_timeout(400)
open_setting(pgC, "#setRoutines"); pgC.wait_for_timeout(300)
offered = pgC.evaluate("[...document.querySelectorAll('#setRoutines [data-routine]')].map((c) => c.dataset.routine)")
check("settings: 'Reiter unten' offers the scenes and scripts, and the routine of 'Gute Nacht'",
      {"scene.cl_filmabend", "script.cl_kaffee"} <= set(offered) and pgC.evaluate("document.querySelector('#setRoutineNight').value") == "script.cl_kaffee", offered)
pgC.click("#setRoutines [data-routine='scene.cl_filmabend']")
check("settings: a ticked routine is saved", wait_for(lambda: api("api/settings")["routines"] == ["scene.cl_filmabend"]), api("api/settings")["routines"])
pgC.keyboard.press("Escape"); pgC.wait_for_timeout(300)
pgC.click("#tabBar [data-tab=routines]"); pgC.wait_for_timeout(800)
check("routines: now only the picked one beside the two checks",
      pgC.evaluate("[...document.querySelectorAll('[data-page=routines] [data-routine]')].map((b) => b.dataset.routine)") == ["scene.cl_filmabend"])

# --- 👨‍👩‍👧 Familie and the pinboard
pgC.click("#tabBar [data-tab=family]"); pgC.wait_for_timeout(1800)
anna = ".fmPerson[data-person='person.anna']"
atext = pgC.inner_text(anna) if pgC.locator(anna).count() else ""
check("family: Anna at home with her picture and her phone's battery (15 %, red)", "zu Hause" in atext and "15 %" in atext
      and pgC.locator(f"{anna} .fmBat.low").count() == 1 and pgC.evaluate(f"document.querySelector(\"{anna} img\")?.naturalWidth || 0") > 0, atext)
check("family: Max in the zone 'Arbeit'", "Arbeit" in pgC.inner_text(".fmPerson[data-person='person.max']"))
srcs = pgC.evaluate(f"[...document.querySelectorAll(\"{anna} .fmSrc > div\")].map((r) => r.textContent)")
check("presence (#495): Anna's card lists where she is seen: the router's Wi-Fi, the network of her phone, the room",
      any("WLAN" in x and "Router" in x for x in srcs) and any("Zuhause-5G" in x for x in srcs) and any("Küche" in x for x in srcs)
      and "Küche" in pgC.inner_text(f"{anna} .fmWhere"), srcs)
check("presence: above the people, who is at home ('1 Person zu Hause', Anna)", "Anna" in pgC.inner_text("[data-page=family] .fmHome")
      and "1 " in pgC.inner_text("[data-page=family] .fmHome"))
def presence_rule(rule, ssids=None):               # ⚙ → "Reiter unten" → "Wer ist wirklich zu Hause?"
    pgC.click("#tabBar [data-tab=house]"); pgC.wait_for_timeout(300)
    pgC.click("#settingsBtn"); pgC.wait_for_timeout(400)
    open_setting(pgC, "#setPresenceRule"); pgC.wait_for_timeout(300)
    pgC.select_option("#setPresenceRule", rule); pgC.wait_for_timeout(300)
    if ssids is not None: pgC.fill("#setPresenceSsids", ssids); pgC.press("#setPresenceSsids", "Tab"); pgC.wait_for_timeout(300)
    pgC.keyboard.press("Escape"); pgC.wait_for_timeout(300)
presence_rule("any", "Zuhause-5G, Gast")
check("presence: ⚙ → 'Reiter unten': the rule and the home Wi-Fi are saved for everybody",
      wait_for(lambda: api("api/settings")["presence"] == {"rule": "any", "ssids": ["Zuhause-5G", "Gast"]}), api("api/settings").get("presence"))
for e_ in ("person.anna", "device_tracker.anna_handy", "device_tracker.anna_fritz"): urllib.request.urlopen(HA + f"/_set?e={e_}&s=not_home").read()
pgC.click("#tabBar [data-tab=family]"); pgC.wait_for_timeout(1500)
check("presence: rule 'one source is enough': Home Assistant says away, but her phone is in the home Wi-Fi: at home",
      wait_for(lambda: "zu Hause" in pgC.inner_text(f"{anna} .fmWhere")) and pgC.locator(f"{anna} .fmSrc [data-kind=ssid].yes").count() == 1, pgC.inner_text(anna))
presence_rule("ha")
pgC.click("#tabBar [data-tab=family]"); pgC.wait_for_timeout(1500)
check("presence: rule 'as Home Assistant says': away", wait_for(lambda: "unterwegs" in pgC.inner_text(f"{anna} .fmWhere")), pgC.inner_text(anna))
for e_ in ("person.anna", "device_tracker.anna_handy", "device_tracker.anna_fritz"): urllib.request.urlopen(HA + f"/_set?e={e_}&s=home").read()
set_setting("presence", {"rule": "ha", "ssids": []})
pgC.wait_for_timeout(800)
pgC.fill(".pbInput", "Bin um 6 da 🚗"); pgC.click(".pbPin"); pgC.wait_for_timeout(800)
notes = api("api/pinboard")["notes"]
check("pinboard: a new note is pinned for everybody, with who wrote it", notes and notes[0]["text"] == "Bin um 6 da 🚗" and notes[0]["by"] == "admin"
      and "Bin um 6 da" in pgC.inner_text(".pbBoard .pbNotes") and pgC.input_value(".pbInput") == "", notes[:1])
pgC.click("#tabBar [data-tab=today]"); pgC.wait_for_timeout(1200)
check("pinboard: ☀ Heute shows the note too", "Bin um 6 da" in pgC.inner_text(".tdPin") if pgC.locator(".tdPin").count() else False)
pgC.click(".tdPin"); pgC.wait_for_timeout(800)
check("pinboard: a tap on it leads to the family page", pgC.evaluate("document.querySelector('#tabBar [data-tab].active')?.dataset.tab") == "family")
pgC.click(".pbBoard .pbDel"); pgC.wait_for_timeout(800)
check("pinboard: ✕ takes the note off", api("api/pinboard")["notes"] == [] and pgC.locator(".pbBoard .pbNote").count() == 0)
pgC.close()

# --- a user who may not switch: no Klima, no Abläufe; the family stays
set_setting("userLocks", {"tablet_cf": ["control"]})
pgL = watch_cf(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_cf"}))
pgL.goto(BASE + "?debug=1"); pgL.wait_for_timeout(2000)
tl = tabs_cf(pgL)
check("4.5: a user who may not switch gets no Klima and no Abläufe, but the family", "climate" not in tl and "routines" not in tl and "family" in tl, tl)
pgL.close()
check("climate/routines/family: no errors on the page", not own_cf, own_cf[:3])

urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_cf).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
for k, d in (("userLocks", {}), ("routines", []), ("routineNight", ""), ("routineLeave", ""), ("language", ""), ("units", "metric"), ("pageLayouts", {})):
    set_setting(k, st_cf.get(k, d))
post_cf("/_extra", {})
