"""4.28.0 (#546): the add-on's own heating rules and routines. 📋 Heiz-Regeln on 🌡 Klima switched on in the page; a window opens: the add-on
switches the thermostat off by itself (no screen needed) and puts it back when it shuts, "Trotzdem heizen", 🚀 Boost; the room's line and
its label "⏸️ pausiert"; 📅 Heizplan for a room; 🔎 Wird benutzt (own rules, an automation of Home Assistant with what it does); ▶ Abläufe:
a new routine "Wenn … dann …" in the editor, saved, its button starts it, "Was ist passiert"; read-only for a user who may not edit.
"""
saved_rl = api_admin("api/layout")              # put back at the end
st_rl = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_rl(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_rules(body, user="admin"):
    r = urllib.request.urlopen(urllib.request.Request(BASE + "api/rules", data=json.dumps(body).encode(), method="PUT",
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": user}))
    return json.load(r)
calldata_rl = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
house_rl = (api("api/houses")[0])["id"]
key_rl = f"{house_rl}/rl_r"
lay = json.loads(json.dumps(saved_rl))
f0 = lay["floors"][0]
f0.setdefault("rooms", []).append({"id": "rl_r", "name": "Regelraum", "color": "#777777", "points": [[60, 60], [64, 60], [64, 63], [60, 63]]})
f0.setdefault("walls", []).append({"id": "rl_w", "a": [60, 60], "b": [64, 60], "thickness": 0.2, "height": 2.6, "openings": [
    {"id": "rl_o", "type": "window", "pos": 2, "width": 1.2, "height": 1.2, "sill": 0.9, "entity": "binary_sensor.rl_fenster", "name": "Fenster Regelraum"}]})
f0.setdefault("devices", []).append({"id": "rl_th", "type": "thermostat", "x": 61, "z": 61, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat", "entity": "climate.rl_th"})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
post_rl("/_extra", {
    "climate.rl_th": {"state": "heat", "attributes": {"friendly_name": "Heizung Regelraum", "current_temperature": 20.5, "temperature": 21.5, "hvac_action": "heating",
                                                     "hvac_modes": ["off", "heat"], "min_temp": 7, "max_temp": 28, "target_temp_step": 0.5}},
    "binary_sensor.rl_fenster": {"state": "off", "attributes": {"friendly_name": "Fenster Regelraum", "device_class": "window"}},
    "automation.rl_morgen": {"state": "on", "attributes": {"friendly_name": "Heizung morgens", "last_triggered": "2026-10-26T05:00:00+00:00", "current": 0}},
})
post_rl("/_related", {"related": {"climate.rl_th": {"automation": ["automation.rl_morgen"], "device": ["d1"]}},
                      "configs": {"automation.rl_morgen": {"trigger": [{"platform": "time", "at": "06:00:00"}],
                                                           "action": [{"service": "climate.set_temperature", "target": {"entity_id": "climate.rl_th"}, "data": {"temperature": 22}}]}}})
put_rules({"heat": {}, "flows": []})
own_rl = []
def watch_rl(pg_):
    pg_.on("console", lambda m: own_rl.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_rl.append("PAGEERROR " + str(e)))
    return pg_
def wait_rl(fn, n=30, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgR.wait_for_timeout(ms)
    return fn()
def calls_for(e, since=0):
    return [c for c in calldata_rl()[since:] if c[1] == e]

pgR = watch_rl(b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgR.goto(BASE + "?debug=1"); pgR.wait_for_timeout(1500)
if pgR.is_visible("#modeSwitch [data-mode=live]"): pgR.click("#modeSwitch [data-mode=live]"); pgR.wait_for_timeout(1000)

# --- 🌡 Klima → 📋 Heiz-Regeln: the window rule switched on in the page, its time down to 0 minutes
pgR.click("#tabBar [data-tab=climate]"); pgR.wait_for_timeout(800)
pgR.click("[data-page=climate] [data-view=rules]"); pgR.wait_for_timeout(800)
cards_rl = pgR.evaluate("[...document.querySelectorAll('[data-page=climate] [data-heat-rule]')].map((c) => c.dataset.heatRule)")
check("rules: 📋 Heiz-Regeln shows the seven rules as cards", cards_rl == ["window", "away", "night", "schedule", "summer", "boost", "holiday"], cards_rl)
pgR.click("[data-heat-rule=window] input[data-rule=window]")
for _ in range(2):
    pgR.click("[data-heat-rule=window] [data-field='window.delay'] button:first-child"); pgR.wait_for_timeout(150)
saved_w = wait_rl(lambda: (lambda h: h if h["window"]["on"] and h["window"]["delay"] == 0 else None)(api("api/rules")["heat"]))
check("rules: switched on and the minutes changed in the page are saved by the add-on", saved_w, api("api/rules")["heat"]["window"])

# --- a window opens: the add-on switches the thermostat off by itself, the room says so, "Trotzdem heizen", back when it shuts
n0 = len(calldata_rl())
urllib.request.urlopen(HA + "/_set?e=binary_sensor.rl_fenster&s=on").read()
offs_rl = wait_rl(lambda: [c for c in calls_for("climate.rl_th", n0) if c[0] == "set_hvac_mode" and c[2].get("hvac_mode") == "off"], n=60)
check("rules: a window opens, the add-on switches the room's thermostat off (no tap needed)", offs_rl, calls_for("climate.rl_th", n0))
st_rl_room = wait_rl(lambda: (api("api/rules")["status"]["rooms"].get(key_rl) or {}).get("why") == "window")
check("rules: api/rules says the room is paused by the window", st_rl_room, api("api/rules")["status"]["rooms"])
pgR.click("[data-page=climate] [data-view=rules]"); pgR.wait_for_timeout(300)
pgR.click("[data-page=climate] .tpTools .tpChip:not([data-view])"); pgR.wait_for_timeout(800)
line_rl = wait_rl(lambda: pgR.locator(f"[data-page=climate] [data-room=rl_r] .hrLine[data-line=window]").count() == 1)
check("rules: the room's card shows '⏸️ Heizung pausiert' with 'Trotzdem heizen'", line_rl and "Trotzdem heizen" in pgR.inner_text("[data-page=climate] [data-room=rl_r] .hrLine"))
n1 = len(calldata_rl())
pgR.click("[data-page=climate] [data-room=rl_r] .hrLine button")
check("rules: 'Trotzdem heizen' switches the heating on again", wait_rl(lambda: [c for c in calls_for("climate.rl_th", n1) if c[0] == "set_hvac_mode" and c[2].get("hvac_mode") == "heat"]))
urllib.request.urlopen(HA + "/_set?e=binary_sensor.rl_fenster&s=off").read()
wait_rl(lambda: not (api("api/rules")["status"]["rooms"].get(key_rl) or {}).get("skip"))
urllib.request.urlopen(HA + "/_set?e=binary_sensor.rl_fenster&s=on").read()
n2 = len(calldata_rl())
again_rl = wait_rl(lambda: [c for c in calls_for("climate.rl_th", n2) if c[0] == "set_hvac_mode" and c[2].get("hvac_mode") == "off"], n=60)
urllib.request.urlopen(HA + "/_set?e=binary_sensor.rl_fenster&s=off").read()
back_rl = wait_rl(lambda: [c for c in calls_for("climate.rl_th", n2) if c[0] == "set_hvac_mode" and c[2].get("hvac_mode") == "heat"], n=60)
check("rules: the next airing switches it off again and the shut window puts it back as before", again_rl and back_rl, calls_for("climate.rl_th", n2))
n3 = len(calldata_rl())
pgR.click("[data-page=climate] [data-room=rl_r] [data-act=boost]")
boost_rl = wait_rl(lambda: [c for c in calls_for("climate.rl_th", n3) if c[0] == "set_temperature" and c[2].get("temperature") == 24.0])
check("rules: 🚀 Boost sets the boost temperature (24°)", boost_rl, calls_for("climate.rl_th", n3))
pgR.click("[data-page=climate] [data-room=rl_r] [data-act=boost]")
check("rules: a second tap ends the boost and puts the target back", wait_rl(lambda: [c for c in calls_for("climate.rl_th", n3) if c[0] == "set_temperature" and c[2].get("temperature") == 21.5]))

# --- 🔎 Wird benutzt
pgR.click("[data-page=climate] [data-room=rl_r] [data-usedby='climate.rl_th']"); pgR.wait_for_timeout(1500)
rows_rl = pgR.evaluate("[...document.querySelectorAll('.ubDlg [data-row]')].map((r) => r.dataset.row)")
txt_rl = pgR.inner_text(".ubDlg") if pgR.locator(".ubDlg").count() else ""
check("used by: the window rule of the dashboard and the automation of Home Assistant, with what it does ('06:00 → … 22°')",
      "heat:window" in rows_rl and "automation.rl_morgen" in rows_rl and "06:00" in txt_rl and "22°" in txt_rl, (rows_rl, txt_rl[:300]))
pgR.click(".ubDlg [data-act=ubClose]"); pgR.wait_for_timeout(300)

# --- 📅 Heizplan: a plan for the room
pgR.click("[data-page=climate] [data-view=plan]"); pgR.wait_for_timeout(600)
pgR.click("[data-page=climate] .hpRooms [data-room=rl_r]"); pgR.wait_for_timeout(300)
pgR.click("[data-page=climate] [data-act=createPlan]"); pgR.wait_for_timeout(300)
blocks_rl = pgR.locator("[data-page=climate] .hpBar[data-day='0'] .hpBlock").count()
pgR.click("[data-page=climate] [data-act=savePlan]")
plan_rl = wait_rl(lambda: key_rl in api("api/rules")["heat"]["schedule"]["rooms"] and api("api/rules")["heat"]["schedule"]["on"])
check("schedule: '＋ Plan anlegen' draws a week (Monday in 5 blocks), '✓ Speichern' keeps it in the add-on", blocks_rl == 5 and plan_rl, (blocks_rl, api("api/rules")["heat"]["schedule"]))
put_rules({"heat": {}})                          # the rules off: the routines below on their own

# --- ▶ Abläufe: a new routine in the editor, saved, its button starts it
pgR.click("#tabBar [data-tab=routines]"); pgR.wait_for_timeout(800)
pgR.click("[data-page=routines] [data-act=newFlow]"); pgR.wait_for_timeout(500)
check("routines: '＋ Neuer Ablauf' opens the editor", pgR.is_visible(".feDlg"))
pgR.fill(".feDlg .feName", "Testlicht"); pgR.press(".feDlg .feName", "Tab")
pgR.click(".feDlg [data-add=button]"); pgR.wait_for_timeout(200)
pgR.click(".feDlg [data-add=switch]"); pgR.wait_for_timeout(200)
check("editor: an action without a device cannot be saved yet", pgR.locator(".feDlg .feBlk.bad").count() == 1 and pgR.is_disabled(".feDlg [data-act=feSave]"))
pgR.click(".feDlg .fePickRow[data-entity='light.wohnzimmer'] input"); pgR.wait_for_timeout(200)
words_rl = pgR.inner_text(".feDlg .feWords")
check("editor: the lines join the blocks and the routine stands there in words", pgR.locator(".feDlg .feWires path").count() == 1 and "Wohnzimmer Licht" in words_rl, words_rl)
pgR.click(".feDlg [data-act=feSave]")
flows_rl = wait_rl(lambda: api("api/rules")["flows"])
check("editor: '✓ Speichern' keeps the routine in the add-on", flows_rl and flows_rl[0]["name"] == "Testlicht"
      and [x["k"] for x in flows_rl[0]["lanes"][0]["blocks"]] == ["button", "switch"], flows_rl)
pgR.click(".feDlg [data-act=feBack]"); pgR.wait_for_timeout(500)
fid_rl = flows_rl[0]["id"] if flows_rl else ""
row_ok = wait_rl(lambda: pgR.locator(f"[data-page=routines] [data-flow={fid_rl}]").count() == 1)
check("routines: the routine stands in the list as a chain", row_ok and "Wohnzimmer Licht" in pgR.inner_text(f"[data-page=routines] [data-flow={fid_rl}]"))
urllib.request.urlopen(HA + "/_set?e=light.wohnzimmer&s=off").read()
pgR.click(f"[data-page=routines] [data-run-flow={fid_rl}]")
check("routines: its ▶ starts it: the add-on switches the light on", wait_rl(lambda: ["light", "turn_on", "light.wohnzimmer"] in ha_calls()[-6:]))
logged_rl = wait_rl(lambda: "Testlicht" in pgR.inner_text("[data-page=routines] .roLog"))
check("routines: 'Was ist passiert' lists it", logged_rl, pgR.inner_text("[data-page=routines] .roLog")[:200])

# --- a user who may not edit: sees the rules, cannot change them
pgT = watch_rl(b.new_page(viewport={"width": 1280, "height": 850}, extra_http_headers={"X-Remote-User-Name": "tablet_rl"}))
pgT.goto(BASE + "?debug=1"); pgT.wait_for_timeout(1800)
if pgT.is_visible("#modeSwitch [data-mode=live]"): pgT.click("#modeSwitch [data-mode=live]"); pgT.wait_for_timeout(800)
pgT.click("#tabBar [data-tab=climate]"); pgT.wait_for_timeout(600)
pgT.click("[data-page=climate] [data-view=rules]"); pgT.wait_for_timeout(800)
check("rules: a user who may not edit sees the rules but cannot switch them", pgT.is_disabled("[data-heat-rule=window] input[data-rule=window]")
      and pgT.locator("[data-act=ownRule]").count() == 0)
pgT.close()
check("rules: no errors on the page", not own_rl, own_rl[:3])

put_rules({"heat": {}, "flows": []})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_rl).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_rl.get(k, d))
post_rl("/_extra", {})
post_rl("/_related", {"related": {}, "configs": {}})
pgR.close()
