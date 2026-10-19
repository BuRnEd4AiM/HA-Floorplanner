"""4.1.0 (#456): the add-on's own holiday alarm: set up in the settings, armed with the code; on a wall tablet the lock screen covers the
whole screen, a door opens: the time to type the code, then the alarm (siren on, a WhatsApp); only the code switches it off, a wall tablet
cannot just look past it. 4.1.1 (#460): an editor is not locked out: a red strip at the top and a red frame say it is armed, a tap opens
the keypad.
"""
lang_g = api("api/settings")["language"]
set_setting("language", "de")
def extra(d):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(d).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def ha_set(e, s):
    urllib.request.urlopen(HA + f"/_set?e={e}&s={s}").read()
def notified():
    return json.load(urllib.request.urlopen(HA + "/_notified"))
def admin_req(path, body, method="PUT"):
    return urllib.request.urlopen(urllib.request.Request(BASE + path, data=json.dumps(body).encode(), method=method,
                                                         headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
def until(pg, text, ms, sel="#guardScreen .gdTitle"):
    """wait until the lock screen (or the editor's strip) says text (it asks the add-on every 2 s; the CI runner is slow): no fixed sleeps
    that run out (#458)"""
    try: pg.wait_for_function("([s, t]) => (document.querySelector(s)?.textContent || '').includes(t)", arg=[sel, text], timeout=ms)
    except Exception: pass
def bar(pg):
    return pg.inner_text("#guardBar") if pg.is_visible("#guardBar") else ""
def covered(pg):
    return pg.evaluate("document.elementFromPoint(700, 500).closest('#guardScreen') !== null")
extra({"binary_sensor.tuer_e2e": {"state": "off", "attributes": {"friendly_name": "Haustür E2E", "device_class": "door"}},
       "siren.e2e": {"state": "off", "attributes": {"friendly_name": "Sirene E2E"}}})
admin_req("api/notify", {"on": True, "via": "whatsapp", "phone": "+491701234567", "apikey": "987654"})

pgG = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgG.goto(BASE + "?debug=1&mode=edit"); pgG.wait_for_timeout(1500)
check("holiday alarm (#456): no 🛡 button while it is not set up", not pgG.is_visible("#guardBtn"))
pgG.click("#settingsBtn"); open_setting(pgG, "#guardBox"); pgG.wait_for_timeout(1000)
check("holiday alarm: the settings list the door contact under 'Türen'", pgG.is_visible("#guardBox") and "Haustür E2E" in pgG.inner_text("#guardBox")
      and "Türen" in pgG.inner_text("#guardBox"), pgG.inner_text("#guardBox")[:300] if pgG.is_visible("#guardBox") else "")
pgG.check("#guardBox [data-gd-sensor='binary_sensor.tuer_e2e']")
pgG.evaluate("document.querySelectorAll('#guardBox details.gdGroup').forEach((d) => { d.open = true; })")
pgG.check("#guardBox [data-gd-action='siren.e2e']")
pgG.fill("#gdDelay", "6"); pgG.fill("#gdCode", "2468")             # 3 s ran out on the CI runner before the check could look (#458)
pgG.click("#gdSave"); pgG.wait_for_timeout(800)
g = api_admin("api/guard")
check("holiday alarm: saved, ready, the code stored but never handed out", "Bereit" in pgG.inner_text("#guardBox .gdStatus") and g["ready"] is None
      and g["cfg"]["sensors"] == ["binary_sensor.tuer_e2e"] and g["cfg"]["actions"] == ["siren.e2e"] and g["cfg"]["delay"] == 6 and g["cfg"]["hasCode"]
      and "2468" not in json.dumps(g), g)
pgG.keyboard.press("Escape"); pgG.wait_for_timeout(2500)
check("holiday alarm: now the 🛡 button is there", pgG.is_visible("#guardBtn") and "Alarm aus" in pgG.inner_text("#guardBtn"), pgG.inner_text("#guardBtn") if pgG.is_visible("#guardBtn") else "")
pgG.click("#guardBtn"); pgG.wait_for_timeout(400)
check("holiday alarm: a tap asks for the code to arm it", pgG.is_visible("#guardScreen") and "scharf schalten" in pgG.inner_text("#guardScreen .gdTitle"))
for k in "1111": pgG.click(f"#guardScreen [data-key='{k}']")
pgG.click("#guardGo"); pgG.wait_for_timeout(800)
check("holiday alarm: a wrong code is refused", "Falscher Code" in pgG.inner_text("#guardScreen") and api("api/guard")["view"]["phase"] == "off")
n0 = len(notified())
pgG.keyboard.type("2468"); pgG.keyboard.press("Enter"); pgG.wait_for_timeout(800)
check("holiday alarm (#460): with the code (also typed) it arms; an editor is not locked out: a strip counts the time to leave, a red frame",
      not pgG.is_visible("#guardScreen") and not covered(pgG) and "wird scharf in" in bar(pgG) and api("api/guard")["view"]["phase"] == "arming"
      and pgG.evaluate("document.body.classList.contains('guardArmed')"), (bar(pgG), pgG.inner_text("#guardScreen") if pgG.is_visible("#guardScreen") else ""))
pgT = b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_e2e"})
pgT.goto(BASE + "?debug=1"); pgT.wait_for_timeout(2500)
check("holiday alarm: a wall tablet gets the lock screen that covers everything, with the keypad, no strip",
      pgT.is_visible("#guardScreen") and covered(pgT) and pgT.locator("#guardScreen .gdPad button").count() == 12 and not pgT.is_visible("#guardBar"))
until(pgG, "SCHARF", 12000, "#guardBar"); until(pgT, "ist scharf", 6000)
check("holiday alarm: then it is armed: the strip says so (the plan stays usable), and a WhatsApp", "ist SCHARF" in bar(pgG)
      and "ist scharf" in pgT.inner_text("#guardScreen .gdTitle") and not covered(pgG)
      and any("Urlaubs-Alarm ist scharf" in (m[2] or "") for m in notified()[n0:]), (bar(pgG), notified()[n0:]))
pgG.click("#guardBar"); pgG.wait_for_timeout(500)
check("holiday alarm (#460): a tap on the strip opens the keypad to switch it off, with 'Schließen'",
      pgG.is_visible("#guardScreen") and pgG.inner_text("#guardGo") == "Ausschalten" and pgG.is_visible("#guardClose"))
pgG.click("#guardClose"); pgG.wait_for_timeout(400)
check("holiday alarm: closed again, still armed", not pgG.is_visible("#guardScreen") and "SCHARF" in bar(pgG) and api("api/guard")["view"]["phase"] == "armed")
n0, c0 = len(notified()), len(ha_calls())
ha_set("binary_sensor.tuer_e2e", "on"); until(pgT, "Code eingeben", 4000); until(pgG, "Alarm in", 3000, "#guardBar")
check("holiday alarm: the door opens: the time to type the code (tablet), the editor's strip says which door",
      "Code eingeben" in pgT.inner_text("#guardScreen .gdTitle") and "Haustür E2E" in bar(pgG) and "Alarm in" in bar(pgG)
      and api("api/guard")["view"]["phase"] == "entry", (pgT.inner_text("#guardScreen .gdTitle"), bar(pgG)))
until(pgT, "ALARM:", 12000); until(pgG, "ALARM:", 4000, "#guardBar"); pgG.wait_for_timeout(1500)
calls = ha_calls()[c0:]
check("holiday alarm: nobody typed it: the alarm, the siren on, a WhatsApp with the door",
      "ALARM: Haustür E2E wurde geöffnet" in pgT.inner_text("#guardScreen .gdTitle") and ["homeassistant", "turn_on", ["siren.e2e"]] in calls
      and any("EINBRUCH-ALARM: Haustür E2E" in (m[2] or "") for m in notified()[n0:]), (pgT.inner_text("#guardScreen .gdTitle"), calls, notified()[n0:]))
check("holiday alarm (#460): the editor still sees the plan; the strip, the frame and the button say ALARM",
      "ALARM: Haustür E2E" in bar(pgG) and not covered(pgG) and pgG.evaluate("document.body.classList.contains('guardAlarm')")
      and "alert" in pgG.get_attribute("#guardBtn", "class"), bar(pgG))
n0, c0 = len(notified()), len(ha_calls())
for k in "2468": pgT.click(f"#guardScreen [data-key='{k}']")
pgT.click("#guardGo"); pgT.wait_for_timeout(1500); pgG.wait_for_timeout(2500)
check("holiday alarm: the code on the tablet switches it off everywhere, the siren off again, a WhatsApp says who",
      not pgT.is_visible("#guardScreen") and not pgG.is_visible("#guardBar") and api("api/guard")["view"]["phase"] == "off"
      and not pgG.evaluate("document.body.classList.contains('guardArmed')")
      and ["homeassistant", "turn_off", ["siren.e2e"]] in ha_calls()[c0:] and any("Alarm beendet" in (m[2] or "") for m in notified()[n0:]),
      (ha_calls()[c0:], notified()[n0:]))
pgT.close(); pgG.close()

ha_set("binary_sensor.tuer_e2e", "off")
admin_req("api/guard", {"sensors": [], "actions": [], "code": "", "removeCode": True, "delay": 30})
admin_req("api/notify", {"on": False, "apikey": None, "phone": ""})
extra({})
set_setting("language", lang_g)
