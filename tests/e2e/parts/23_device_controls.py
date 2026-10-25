"""More devices switched right in the plan (#406): the live card of a TV (play / pause, next, volume, mute, source), a robot vacuum (clean,
back to the dock, suction), a fan (speed, swing, presets), an alarm panel (arm, disarm with its code; a wrong code is refused; the lock
"alarm" per user), a choice list, a button, and an air conditioner with its presets and fan modes; every call reaches Home Assistant with
its values, and a call the plan does not offer is refused by the add-on.
"""
import re
saved_dc = api_admin("api/layout")              # put back at the end
lang_dc = api("api/settings")["language"]
set_setting("language", "de")
def mock_extra(body):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def calldata():
    return json.loads(urllib.request.urlopen(HA + "/_calldata").read())
mock_extra({
    "media_player.dc_tv": {"state": "playing", "attributes": {"friendly_name": "TV Wohnzimmer", "volume_level": 0.3, "is_volume_muted": False, "media_title": "Folge 3",
                                                              "media_artist": "Die Serie", "source_list": ["HDMI 1", "Netflix"], "source": "Netflix",
                                                              "supported_features": 1 | 4 | 8 | 16 | 32 | 128 | 256 | 2048 | 16384}},
    "vacuum.dc_robo": {"state": "docked", "attributes": {"friendly_name": "Robo", "fan_speed_list": ["Leise", "Turbo"], "fan_speed": "Leise", "battery_level": 90,
                                                        "supported_features": 8192 | 4 | 16 | 32 | 512}},
    "fan.dc_fan": {"state": "on", "attributes": {"friendly_name": "Ventilator", "percentage": 50, "percentage_step": 25, "oscillating": False,
                                                 "preset_modes": ["Normal", "Nacht"], "preset_mode": "Normal", "supported_features": 1 | 2 | 8 | 16 | 32}},
    "alarm_control_panel.dc_alarm": {"state": "disarmed", "attributes": {"friendly_name": "Alarm", "code_format": "number", "code_arm_required": False,
                                                                         "supported_features": 3}},
    "input_select.dc_mode": {"state": "Zu Hause", "attributes": {"friendly_name": "Hausmodus", "options": ["Zu Hause", "Urlaub"]}},
    "button.dc_bell": {"state": "unknown", "attributes": {"friendly_name": "Klingel"}},
    "climate.dc_ac": {"state": "cool", "attributes": {"friendly_name": "Klimaanlage", "current_temperature": 26, "temperature": 23, "hvac_action": "cooling",
                                                      "hvac_modes": ["off", "cool", "heat"], "preset_modes": ["eco", "boost"], "preset_mode": "eco",
                                                      "fan_modes": ["auto", "high"], "fan_mode": "auto", "min_temp": 16, "max_temp": 30, "target_temp_step": 1}},
})
pgD = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgD.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgD.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgD.goto(BASE + "?debug=1&mode=edit"); pgD.wait_for_timeout(1500)
DEVS = [("dc1", "tv_wall", "media_player.dc_tv"), ("dc2", "vacuum", "vacuum.dc_robo"), ("dc3", "fan_stand", "fan.dc_fan"), ("dc4", "switch", "alarm_control_panel.dc_alarm"),
        ("dc5", "switch", "input_select.dc_mode"), ("dc6", "switch", "button.dc_bell"), ("dc7", "thermostat", "climate.dc_ac")]
pgD.evaluate("""(devs) => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  devs.forEach(([id, type, entity], i) => f.devices.push({ id, type, x: 1 + i * 0.4, z: 1, y: 0, rot: 0, scale: 1, name: entity.split('.')[1], entity }));
  window.__fp.rebuild(); }""", DEVS)
pgD.click("#modeSwitch button[data-mode=live]"); pgD.wait_for_timeout(1200)
def show(id):
    pgD.evaluate(f"window.__fp.showPopup('{id}')"); pgD.wait_for_timeout(400)
    return pgD.inner_text("#livePopup") if pgD.is_visible("#livePopup") else "no popup"
def press(svc):
    pgD.click(f"#livePopup button[data-svc={svc}]"); pgD.wait_for_timeout(700)
def last(e):
    return next((c for c in reversed(calldata()) if c[1] == e), None)

txt = show("dc1")
check("device controls (#406): the TV's card shows the track, previous / pause / next, volume, mute and its source",
      "Folge 3 – Die Serie" in txt and pgD.locator("#livePopup button[data-svc=media_previous_track]").count() == 1
      and pgD.locator("#livePopup button[data-svc=media_play_pause]").count() == 1 and pgD.locator("#livePopup button[data-svc=media_next_track]").count() == 1
      and pgD.input_value("#livePopup .dc-volume") == "30" and pgD.locator("#livePopup .dc-mute").count() == 1 and pgD.input_value("#livePopup .dc-source") == "Netflix", txt)
press("media_play_pause")
check("device controls: pause reaches Home Assistant and the card follows (now ▶)", last("media_player.dc_tv")[0] == "media_play_pause"
      and pgD.get_attribute("#livePopup button[data-svc=media_play_pause]", "title") == "Abspielen", (last("media_player.dc_tv"), show("dc1")))
pgD.evaluate("() => { const s = document.querySelector('#livePopup .dc-volume'); s.value = 55; s.dispatchEvent(new Event('input')); }")
check("device controls: the number beside the volume slider follows it while it moves (it stood at the old value)", pgD.inner_text("#livePopup .dc-val") == "55 %", pgD.inner_text("#livePopup .dc-val"))
pgD.evaluate("() => { const s = document.querySelector('#livePopup .dc-volume'); s.value = 55; s.dispatchEvent(new Event('change')); }"); pgD.wait_for_timeout(700)
check("device controls: the volume slider sets the volume (0.55)", last("media_player.dc_tv") == ["volume_set", "media_player.dc_tv", {"volume_level": 0.55}], last("media_player.dc_tv"))
pgD.select_option("#livePopup .dc-source", "HDMI 1"); pgD.wait_for_timeout(700)
check("device controls: the source is switched", last("media_player.dc_tv") == ["select_source", "media_player.dc_tv", {"source": "HDMI 1"}], last("media_player.dc_tv"))

txt = show("dc2")
check("device controls: the vacuum at its dock says so and offers cleaning and its suction (no 'back to the dock')",
      "An der Station" in txt and pgD.locator("#livePopup button[data-svc=start]").count() == 1 and pgD.locator("#livePopup button[data-svc=return_to_base]").count() == 0
      and pgD.input_value("#livePopup .dc-speed") == "Leise", txt)
press("start")
txt = show("dc2")
check("device controls: started, it cleans and can be paused or sent back", "Saugt" in txt and pgD.locator("#livePopup button[data-svc=pause]").count() == 1
      and pgD.locator("#livePopup button[data-svc=return_to_base]").count() == 1, txt)
pgD.select_option("#livePopup .dc-speed", "Turbo"); pgD.wait_for_timeout(700)
check("device controls: the suction is set", last("vacuum.dc_robo") == ["set_fan_speed", "vacuum.dc_robo", {"fan_speed": "Turbo"}], last("vacuum.dc_robo"))

txt = show("dc3")
check("device controls: the fan's card has on / off, its speed, swing and presets", pgD.input_value("#livePopup .dc-fan") == "50"
      and pgD.locator("#livePopup button[data-svc=oscillate]").count() == 1 and "Nacht" in txt and pgD.locator("#livePopup .actions button", has_text="An").count() >= 1, txt)
pgD.evaluate("() => { const s = document.querySelector('#livePopup .dc-fan'); s.value = 70; s.dispatchEvent(new Event('change')); }"); pgD.wait_for_timeout(700)
check("device controls: the speed goes onto the fan's own steps (70 -> 75)", last("fan.dc_fan") == ["set_percentage", "fan.dc_fan", {"percentage": 75}], last("fan.dc_fan"))
press("oscillate")
check("device controls: swing is switched on", last("fan.dc_fan") == ["oscillate", "fan.dc_fan", {"oscillating": True}], last("fan.dc_fan"))

txt = show("dc4")
check("device controls: the disarmed alarm offers arming at home and away, no code needed for it", "Unscharf" in txt
      and pgD.locator("#livePopup button[data-svc=alarm_arm_home]").count() == 1 and pgD.locator("#livePopup button[data-svc=alarm_arm_away]").count() == 1
      and pgD.locator("#livePopup .dc-code").count() == 0, txt)
press("alarm_arm_away")
txt = show("dc4")
check("device controls: armed, it says so and offers disarming with a code field", "Scharf (abwesend)" in txt
      and pgD.locator("#livePopup button[data-svc=alarm_disarm]").count() == 1 and pgD.locator("#livePopup .dc-code").count() == 1, txt)
pgD.fill("#livePopup .dc-code", "1111"); press("alarm_disarm")
failed = pgD.inner_text("#status")
check("device controls: a wrong code is refused by Home Assistant: still armed, the status line says it failed",
      "Scharf (abwesend)" in show("dc4") and last("alarm_control_panel.dc_alarm") == ["alarm_disarm", "alarm_control_panel.dc_alarm", {"code": "1111"}]
      and "fehlgeschlagen" in failed, (last("alarm_control_panel.dc_alarm"), failed))
pgD.fill("#livePopup .dc-code", "4711"); press("alarm_disarm")
check("device controls: the right code disarms it", "Unscharf" in show("dc4"), show("dc4"))

txt = show("dc5")
check("device controls: a short choice list shows its options as buttons, the chosen one marked (#474)",
      pgD.locator("#livePopup .dc-option button").count() == 2 and pgD.get_attribute("#livePopup .dc-option button.on", "data-option") == "Zu Hause", txt)
pgD.click('#livePopup .dc-option button[data-option="Urlaub"]'); pgD.wait_for_timeout(700)
check("device controls: a choice list is set from its card", last("input_select.dc_mode") == ["select_option", "input_select.dc_mode", {"option": "Urlaub"}]
      and (show("dc5") and pgD.get_attribute("#livePopup .dc-option button.on", "data-option") == "Urlaub"), (txt, last("input_select.dc_mode")))
show("dc6"); press("press")
check("device controls: a button is pressed", last("button.dc_bell") == ["press", "button.dc_bell", {}], last("button.dc_bell"))

txt = show("dc7")
check("device controls: the air conditioner's card has its target, modes, presets and fan modes",
      "23 °C" in txt and pgD.locator("#livePopup .hp-presets button").count() == 2 and pgD.locator("#livePopup .hp-fans button").count() == 2
      and pgD.locator("#livePopup .hp-presets button.on").inner_text() == "Eco", txt)
pgD.click("#livePopup .hp-presets button[data-v=boost]"); pgD.wait_for_timeout(700)
check("device controls: a preset is set", last("climate.dc_ac") == ["set_preset_mode", "climate.dc_ac", {"preset_mode": "boost"}], last("climate.dc_ac"))
pgD.click("#livePopup .hp-fans button[data-v=high]"); pgD.wait_for_timeout(700)
check("device controls: a fan mode is set", last("climate.dc_ac") == ["set_fan_mode", "climate.dc_ac", {"fan_mode": "high"}], last("climate.dc_ac"))

r = pgD.evaluate("() => fetch('api/service', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({domain: 'vacuum', service: 'send_command', entity_id: 'vacuum.dc_robo', data: {command: 'x'}})}).then((r) => r.status)")
check("device controls: a call the plan does not offer is refused by the add-on", r == 400, r)
pgD.close()

# the lock "alarm" (#406): the alarm buttons are gone for that user, the server refuses it; switching the rest stays
set_setting("userLocks", {"flur": ["alarm"], "kind": ["control"]})
pgL = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "flur"})
pgL.goto(BASE + "?debug=1"); pgL.wait_for_timeout(1500)
pgL.evaluate("(devs) => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; devs.forEach(([id, type, entity], i) => f.devices.push({ id, type, x: 1 + i * 0.4, z: 1, y: 0, rot: 0, scale: 1, name: entity, entity })); window.__fp.rebuild(); }", DEVS)
pgL.evaluate("window.__fp.showPopup('dc4')"); pgL.wait_for_timeout(400)
hidden = pgL.evaluate("() => [...document.querySelectorAll('#livePopup .devctl-alarm button')].every((e) => !e.offsetParent) && !!document.querySelector('#livePopup .dc-status')?.offsetParent")
st = pgL.evaluate("() => fetch('api/service', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({domain: 'alarm_control_panel', service: 'alarm_arm_away', entity_id: 'alarm_control_panel.dc_alarm'})}).then((r) => r.status)")
pgL.evaluate("window.__fp.showPopup('dc3')"); pgL.wait_for_timeout(400)
fan_ok = pgL.locator("#livePopup .dc-fan").is_visible()
check("device controls: the lock 'alarm' hides the alarm's buttons (its state stays), the add-on refuses arming; the fan can still be switched",
      hidden and st == 403 and fan_ok, (hidden, st, fan_ok))
pgL.close()
pgK = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "kind"})
pgK.goto(BASE + "?debug=1"); pgK.wait_for_timeout(1500)
pgK.evaluate("(devs) => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; devs.forEach(([id, type, entity], i) => f.devices.push({ id, type, x: 1 + i * 0.4, z: 1, y: 0, rot: 0, scale: 1, name: entity, entity })); window.__fp.rebuild(); }", DEVS)
pgK.evaluate("window.__fp.showPopup('dc2')"); pgK.wait_for_timeout(400)
k_vac = pgK.evaluate("() => [[...document.querySelectorAll('#livePopup .devctl button, #livePopup .devctl select')].every((e) => !e.offsetParent), !!document.querySelector('#livePopup .dc-status')?.offsetParent]")
pgK.evaluate("window.__fp.showPopup('dc7')"); pgK.wait_for_timeout(400)
k_ac = pgK.evaluate("() => [[...document.querySelectorAll('#livePopup .popHeat button')].every((e) => !e.offsetParent), !!document.querySelector('#livePopup .hp-now')?.offsetParent]")
check("device controls: the lock 'control' hides the new buttons, sliders and lists too; what a device does now stays in sight",
      k_vac == [True, True] and k_ac == [True, True], (k_vac, k_ac))
pgK.close()
set_setting("userLocks", {})
mock_extra({})
pgR2 = b.new_page(extra_http_headers={"X-Remote-User-Name": "admin"})
pgR2.goto(BASE + "?debug=1"); pgR2.wait_for_timeout(800)
pgR2.evaluate("(l) => fetch('api/layout', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(l)})", saved_dc); pgR2.wait_for_timeout(400)
pgR2.close()
set_setting("language", lang_dc)
bad = [x for x in own if "favicon" not in x and not re.search(r"status of (400|502)", x)]   # the wrong code and the refused call, on purpose
check("device controls: no console errors", not bad, bad)
