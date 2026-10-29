"""4.42.0: 🔥 Zu warm (the owner: "wenn es zu warm ist das dann die heizung runter geht ka so 5 grad das es nicht die ganze zeit heizt";
his choice: 5° below the wish from 1° too warm, measured by the room sensor, back at the wish; "beachte die Prio von den ganzen Karten").
A room with a thermostat (its own target 20°) and a room sensor: the room gets 1,5° warmer, the add-on sets the thermostat 5° lower; the
room's card on 🌡 Klima says so; back at 20° in the room, the thermostat gets its 20° again. 📋 Heiz-Regeln has the card after the window
rule, its numbers saved, and "Wer hat Vorrang?". Turned up while still too warm (#592): the card says when it goes down again.
"""
saved_zw = api_admin("api/layout")              # put back at the end
st_zw = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_zw(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_rules_zw(body):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/rules", data=json.dumps(body).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
house_zw = (api("api/houses")[0])["id"]
key_zw = f"{house_zw}/zw_r"
lay_zw = json.loads(json.dumps(saved_zw))
lay_zw["floors"][0].setdefault("rooms", []).append({"id": "zw_r", "name": "Warmer Raum", "color": "#996655", "points": [[90, 60], [94, 60], [94, 63], [90, 63]]})
lay_zw["floors"][0].setdefault("devices", []).append({"id": "zw_th", "type": "thermostat", "x": 91, "z": 61, "y": 1.2, "rot": 0, "scale": 1, "name": "Thermostat",
                                                      "entity": "climate.zw_th"})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay_zw).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
post_zw("/_extra", {
    "climate.zw_th": {"state": "heat", "attributes": {"friendly_name": "Heizung Warm", "current_temperature": 24.0, "temperature": 20.0, "hvac_action": "heating",
                                                     "hvac_modes": ["off", "heat"], "min_temp": 7, "max_temp": 28, "target_temp_step": 0.5}},
    "sensor.zw_temp": {"state": "20.0", "attributes": {"friendly_name": "Temperatur Warm", "device_class": "temperature", "unit_of_measurement": "°C"}},
})
put_rules_zw({"heat": {"warm": {"on": True, "above": 1, "down": 5}, "sensors": {"on": True, "map": {"climate.zw_th": {"s": "sensor.zw_temp", "way": "show"}}}}, "flows": []})
own_zw = []
pgW = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgW.on("console", lambda m: own_zw.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgW.on("pageerror", lambda e: own_zw.append("PAGEERROR " + str(e)))
def wait_zw(fn, n=40, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgW.wait_for_timeout(ms)
    return fn()
room_st = lambda: api("api/rules")["status"]["rooms"].get(key_zw) or {}
calls_zw = lambda v: [x for x in api("api/rules/trace")["trace"] if x["k"] == "call" and x.get("ent") == "climate.zw_th" and x.get("v") == v and x.get("ok")]

wait_zw(lambda: api("api/rules")["running"])
wait_zw(lambda: "climates" in room_st(), n=60)
check("too warm: at the wish (the room 20°, the thermostat's own 20°) nothing happens", room_st().get("why") is None and not calls_zw(15.0), room_st())
urllib.request.urlopen(HA + "/_set?e=sensor.zw_temp&s=21.5").read()       # the room 1,5° warmer (the thermostat measures 24° at the radiator)
low_zw = wait_zw(lambda: room_st().get("why") == "warm" and calls_zw(15.0), n=60)
check("too warm: 1,5° warmer in the room, the add-on sets the thermostat 5° lower (20° → 15°)", low_zw and room_st().get("warm") == {"wish": 20.0, "room": 21.5, "to": 15.0},
      (room_st(), api("api/rules/trace")["trace"][-5:]))

pgW.goto(BASE + "?debug=1"); pgW.wait_for_timeout(1500)
if pgW.is_visible("#modeSwitch [data-mode=live]"): pgW.click("#modeSwitch [data-mode=live]"); pgW.wait_for_timeout(1000)
pgW.click("#tabBar [data-tab=climate]"); pgW.wait_for_timeout(1000)
line_zw = pgW.locator("[data-page=climate] [data-room=zw_r] [data-line=warm]")
txt_zw = line_zw.inner_text() if line_zw.count() else ""
check("too warm: the room's card says it (🔥 Zu warm, the room, the thermostat, until when)",
      "Zu warm" in txt_zw and "21,5°" in txt_zw and "15°" in txt_zw and "20°" in txt_zw, txt_zw or pgW.inner_text("[data-page=climate]")[:500])
# #592: turned up while the room is still too warm: the card says so and when it goes down again (the minutes of "Von Hand gedreht")
urllib.request.urlopen(urllib.request.Request(HA + "/services/climate/set_temperature", data=json.dumps({"entity_id": "climate.zw_th", "temperature": 25.0}).encode(),
                                              method="POST", headers={"Content-Type": "application/json"})).read()
hand_zw = wait_zw(lambda: room_st().get("why") == "warm" and room_st().get("hand"), n=60)
hand_txt = wait_zw(lambda: (lambda x: x if "von Hand gedreht" in x else "")(line_zw.inner_text() if line_zw.count() else ""), n=30)
check("too warm: turned up meanwhile, the card says it goes down to 15° again after the minutes of 'Von Hand gedreht' (#592)",
      hand_zw and "von Hand gedreht" in hand_txt and "wieder 15°" in hand_txt, (room_st(), hand_txt))
pgW.click("[data-page=climate] [data-view=rules]"); pgW.wait_for_timeout(800)
cards_zw = pgW.evaluate("[...document.querySelectorAll('[data-page=climate] [data-heat-rule]')].map((c) => c.dataset.heatRule)")
prio_zw = pgW.locator("[data-page=climate] [data-part=prio]")
prio_zw.locator("summary").click(); pgW.wait_for_timeout(200)
check("too warm: 📋 Heiz-Regeln has the card after the window rule, and 'Wer hat Vorrang?' with the order",
      cards_zw[:3] == ["sensors", "window", "warm"] and prio_zw.count() == 1 and "Fenster offen → 🚀 Boost → 🔥 Zu warm" in prio_zw.inner_text(), (cards_zw, prio_zw.inner_text() if prio_zw.count() else ""))
active_zw = pgW.inner_text("[data-heat-rule=warm]")
pgW.click("[data-heat-rule=warm] [data-field='warm.above'] button:last-child"); pgW.wait_for_timeout(150)
pgW.click("[data-heat-rule=warm] [data-field='warm.down'] button:first-child"); pgW.wait_for_timeout(150)
saved_w = wait_zw(lambda: (lambda w: w if w["above"] == 1.5 and w["down"] == 4.5 and w["on"] else None)(api("api/rules")["heat"]["warm"]))
check("too warm: the card shows where it is on, its numbers changed in the page are saved by the add-on, turned by hand as in the schedule",
      "Warmer Raum" in active_zw and saved_w and "nach 10 Min wieder runter" in active_zw, (active_zw[:400], api("api/rules")["heat"]["warm"]))

urllib.request.urlopen(HA + "/_set?e=sensor.zw_temp&s=20.0").read()       # back at the wish
back_zw = wait_zw(lambda: room_st().get("why") is None and calls_zw(20.0), n=60)
check("too warm: back at 20° in the room, the thermostat gets its 20° again", back_zw, (room_st(), api("api/rules/trace")["trace"][-5:]))
check("too warm: no errors on the page", not own_zw, own_zw[:3])

put_rules_zw({"heat": {}, "flows": []})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_zw).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_zw.get(k, d))
post_zw("/_extra", {})
pgW.close()
