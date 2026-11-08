"""4.71.0 (the owner, 2026-11-08): ⏸️ Heizplan aussetzen and the building switch on every page (#677).
⏸️: switched on in 📋 Heiz-Regeln (the card after 🚀 Boost); under − / + of a room's thermostat a button: a tap only says "gedrückt
halten", held down the choice opens (the times an admin offers), a choice pauses the room (the add-on's status says until when), a
level that changes meanwhile is not set, "＋15 Min" makes it longer, "▶ Heizplan fortsetzen" ends it and the schedule's temperature comes;
a user with the lock "heatPause" gets no button and the add-on refuses it.
#677: two buildings in the plan, the building at the top chosen: 🌡 Klima leaves out the thermostats of the other building (also under
"Ohne Raum"), an own page of one building is in the bar only with it.
"""
saved_pz = api_admin("api/layout")              # put back at the end
st_pz = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_pz(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_pz(path, body, user="admin"):
    r = urllib.request.urlopen(urllib.request.Request(BASE + path, data=json.dumps(body).encode(), method="PUT",
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": user}))
    return json.load(r)
def room_pz(body, user="admin"):
    try:
        return urllib.request.urlopen(urllib.request.Request(BASE + "api/rules/room", data=json.dumps(body).encode(), method="POST",
                                                             headers={"Content-Type": "application/json", "X-Remote-User-Name": user})).status
    except urllib.error.HTTPError as e:
        return e.code
calls_pz = lambda since=0: [c for c in json.load(urllib.request.urlopen(HA + "/_calldata"))[since:] if c[1] == "climate.pz_a"]
house_pz = api("api/houses")[0]["id"]
key_pz = f"{house_pz}/pz_ra"
sq_pz = lambda x0, z0, x1, z1: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
lay_pz = json.loads(json.dumps(saved_pz))
lay_pz["buildings"] = [{"id": "pzA", "name": "Haus A"}, {"id": "pzB", "name": "Haus B"}]
f_pz = lay_pz["floors"][0]
f_pz.setdefault("rooms", []).extend([{"id": "pz_ra", "name": "Pausenraum", "points": sq_pz(70, 60, 74, 63), "building": "pzA"},
                                     {"id": "pz_rb", "name": "Werkstatt", "points": sq_pz(80, 60, 84, 63), "building": "pzB"}])
f_pz.setdefault("devices", []).extend([{"id": "pz_da", "type": "thermostat", "x": 71, "z": 61, "y": 1.2, "rot": 0, "scale": 1, "entity": "climate.pz_a"},
                                       {"id": "pz_db", "type": "thermostat", "x": 81, "z": 61, "y": 1.2, "rot": 0, "scale": 1, "entity": "climate.pz_b"}])
put_pz("api/layout", lay_pz)
th_pz = lambda name, t: {"state": "heat", "attributes": {"friendly_name": name, "current_temperature": 20.0, "temperature": t, "hvac_action": "heating",
                                                          "hvac_modes": ["off", "heat"], "min_temp": 7, "max_temp": 28, "target_temp_step": 0.5}}
post_pz("/_extra", {"climate.pz_a": th_pz("Heizung Pausenraum", 21.0), "climate.pz_b": th_pz("Heizung Werkstatt", 19.0)})
plan_pz = {"days": [[[0, "comfort"]]] * 7}
put_pz("api/rules", {"heat": {"schedule": {"on": True, "levels": {"night": 17, "eco": 19, "comfort": 21}, "rooms": {key_pz: plan_pz}},
                              "pause": {"on": False}}, "flows": []})
own_pz = []
pgP = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgP.on("console", lambda m: own_pz.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgP.on("pageerror", lambda e: own_pz.append("PAGEERROR " + str(e)))
def wait_pz(fn, n=30, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgP.wait_for_timeout(ms)
    return fn()
status_pz = lambda: (api("api/rules").get("status") or {}).get("rooms", {}).get(key_pz) or {}
def open_pz():
    pgP.goto(BASE + "?debug=1&mode=live"); pgP.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgP.wait_for_timeout(1200)
    pgP.select_option("#buildingSelect", ""); pgP.wait_for_timeout(500)
    pgP.click("#tabBar [data-tab=climate]"); pgP.wait_for_timeout(1200)
open_pz()
bar_pz = "[data-page=climate] [data-room=pz_ra] .hpBar"
check("pause: no button while the pause is off in 📋 Heiz-Regeln", pgP.locator(bar_pz).count() == 0)
pgP.click("[data-page=climate] [data-view=rules]"); pgP.wait_for_timeout(800)
pgP.click("[data-heat-rule=pause] input[data-rule=pause]")
pgP.click("[data-heat-rule=pause] .hpChoose [data-opt='60']")       # 60 out: 30, 45, Bis zum nächsten Block, Für heute stay
saved_pz_h = wait_pz(lambda: (lambda h: h if h["pause"]["on"] and "60" not in h["pause"]["opts"] else None)(api("api/rules")["heat"]))
check("pause: switched on in 📋 Heiz-Regeln, a time taken out of the choice, saved", saved_pz_h and saved_pz_h["pause"]["opts"] == ["30", "45", "block", "day"],
      api("api/rules")["heat"]["pause"])
pgP.click("[data-page=climate] [data-view=rooms]"); pgP.wait_for_timeout(1000)
check("pause: the button under − / + of the room's thermostat", wait_pz(lambda: pgP.locator(bar_pz).count() == 1), pgP.locator(bar_pz).count())
pgP.click(f"{bar_pz} .hpPause"); pgP.wait_for_timeout(500)
check("pause: a tap opens nothing (held down only), the button says so", pgP.locator(".hpDlg[open]").count() == 0 and "hint" in (pgP.get_attribute(f"{bar_pz} .hpPause", "class") or ""))
bx_pz = pgP.locator(f"{bar_pz} .hpPause").bounding_box()
pgP.mouse.move(bx_pz["x"] + 30, bx_pz["y"] + 10); pgP.mouse.down(); pgP.wait_for_timeout(1100); pgP.mouse.up(); pgP.wait_for_timeout(300)
opts_pz = pgP.evaluate("[...document.querySelectorAll('.hpDlg[open] .hpOpt')].map((b) => b.dataset.opt)")
check("pause: held down the choice opens with the times offered (no schedule block: the plan has none)", opts_pz == ["30", "45", "day"], opts_pz)
n0_pz = len(json.load(urllib.request.urlopen(HA + "/_calldata")))
pgP.click(".hpDlg[open] .hpOpt[data-opt='45']")
st_p = wait_pz(lambda: (lambda s: s if s.get("why") == "pause" and s.get("pause") else None)(status_pz()))
check("pause: 45 minutes chosen: the add-on pauses the room until then", st_p and abs(st_p["pause"] - (time.time() + 45 * 60)) < 120, status_pz())
check("pause: the button says until when, with ＋15 Min", wait_pz(lambda: pgP.locator(f"{bar_pz} .hpPause.on").count() == 1 and pgP.locator(f"{bar_pz} .hpMore").count() == 1))
put_pz("api/rules", {"heat": {**api("api/rules")["heat"], "schedule": {**api("api/rules")["heat"]["schedule"], "levels": {"night": 17, "eco": 19, "comfort": 23}}}})
pgP.wait_for_timeout(2500)
check("pause: the schedule's level changes meanwhile: nothing is sent to the thermostat", not [c for c in calls_pz(n0_pz) if c[0] == "set_temperature"], calls_pz(n0_pz))
u0_pz = status_pz().get("pause") or 0
pgP.click(f"{bar_pz} .hpMore")
check("pause: ＋15 Min makes it 15 minutes longer", wait_pz(lambda: (status_pz().get("pause") or 0) - u0_pz == 900), (u0_pz, status_pz().get("pause")))
pgP.click(f"{bar_pz} .hpPause.on")
back_pz = wait_pz(lambda: [c for c in calls_pz(n0_pz) if c[0] == "set_temperature" and (c[2] or {}).get("temperature") == 23.0], n=40)
check("pause: ▶ Heizplan fortsetzen ends it, the schedule's temperature comes (23°)", back_pz and status_pz().get("why") == "schedule", (calls_pz(n0_pz), status_pz()))

set_setting("userLocks", {**(api("api/settings").get("userLocks") or {}), "tablet_pz": ["heatPause"]})
pgT = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "tablet_pz"})
pgT.goto(BASE + "?debug=1&mode=live"); pgT.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgT.wait_for_timeout(1200)
pgT.click("#tabBar [data-tab=climate]"); pgT.wait_for_timeout(1500)
check("pause: a user with the lock „Heizplan aussetzen“ has no button, the add-on refuses it",
      pgT.locator("[data-page=climate] [data-room=pz_ra] .thPM").count() == 1 and pgT.locator("[data-page=climate] [data-room=pz_ra] .hpBar").count() == 0
      and room_pz({"room": key_pz, "act": "pause", "for": "45"}, "tablet_pz") == 403)
pgT.close()
set_setting("userLocks", st_pz.get("userLocks", {}))

# --- #677: the building at the top
set_setting("customTabs", [*(api("api/settings").get("customTabs") or []), {"id": "p_pzonly", "name": "Nur Haus A", "icon": "🏠", "building": "pzA"}])
open_pz()
both_pz = pgP.evaluate("[...document.querySelectorAll('[data-page=climate] .clCard[data-room]')].map((c) => c.dataset.room)")
check("buildings: with all buildings both rooms on 🌡 Klima, the own page of house A in the bar",
      "pz_ra" in both_pz and "pz_rb" in both_pz and pgP.locator("#tabBar [data-tab=p_pzonly]").count() == 1, both_pz)
pgP.select_option("#buildingSelect", "pzB"); pgP.wait_for_timeout(1500)
pgP.click("#tabBar [data-tab=climate]"); pgP.wait_for_timeout(1200)
txt_pz = pgP.inner_text("[data-page=climate]")
rooms_b = pgP.evaluate("[...document.querySelectorAll('[data-page=climate] .clCard[data-room]')].map((c) => c.dataset.room)")
check("buildings: house B at the top: 🌡 Klima shows its room, not house A's thermostat (also not under „Ohne Raum“)",
      "pz_rb" in rooms_b and "pz_ra" not in rooms_b and "Heizung Pausenraum" not in txt_pz, (rooms_b, txt_pz[-300:]))
check("buildings: the own page of house A is not in the bar", pgP.locator("#tabBar [data-tab=p_pzonly]").count() == 0)
pgP.select_option("#buildingSelect", "pzA"); pgP.wait_for_timeout(1500)
check("buildings: house A at the top: its own page is back", wait_pz(lambda: pgP.locator("#tabBar [data-tab=p_pzonly]").count() == 1))
check("pause, buildings: no errors on the page", not own_pz, own_pz[:5])
pgP.close()
put_pz("api/layout", saved_pz)
put_pz("api/rules", {"heat": {}, "flows": []})
post_pz("/_extra", {})
set_setting("customTabs", st_pz.get("customTabs", []))
set_setting("language", st_pz.get("language", "de")); set_setting("units", st_pz.get("units", "metric"))
