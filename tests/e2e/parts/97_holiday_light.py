"""5.18.0 🏠 Urlaubs-Licht (the owner's choice 2026-11-17, docs/ideen-5.15 picture 7; his choices: while the holiday alarm is armed,
lamps and roller shutters, set up with the holiday alarm): its part in the settings of 🛡 Urlaubs-Alarm (the lamps, the shutters, never
a garage door), saved with the rules; the add-on learns from Home Assistant's history and shows tonight's plan; armed, it runs
(vacation.py, rulesrun.py). The switching itself is tested in tests/test_vacation.py and tests/test_rulesrun.py (it depends on the time
of day).
"""
import datetime as _dt
lang_vl = api("api/settings")["language"]
set_setting("language", "de")


def post_vl(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()


def put_vl(path, body):
    return json.load(urllib.request.urlopen(urllib.request.Request(BASE + path, data=json.dumps(body).encode(), method="PUT",
                                                                   headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})))


post_vl("/_extra", {"binary_sensor.tuer_vl": {"state": "off", "attributes": {"friendly_name": "Haustür VL", "device_class": "door"}},
                    "cover.vl_rollo": {"state": "open", "attributes": {"friendly_name": "Rollladen VL", "device_class": "shutter"}},
                    "cover.vl_einfahrt": {"state": "closed", "attributes": {"friendly_name": "Garagentor VL"}}})   # no device class: by its name
y = _dt.datetime.now().astimezone() - _dt.timedelta(days=1)
ev = lambda h, m: y.replace(hour=h, minute=m, second=0, microsecond=0).astimezone(_dt.timezone.utc).isoformat()   # noqa: E731
post_vl("/_hist", {"light.wohnzimmer": [[ev(10, 0), "off"], [ev(18, 30), "on"], [ev(22, 15), "off"]]})          # yesterday 18:30 … 22:15

pgVL = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_vl = []
pgVL.on("pageerror", lambda e: own_vl.append("PAGEERROR " + str(e)))
pgVL.goto(BASE + "?debug=1&mode=edit"); pgVL.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgVL.wait_for_timeout(800)
pgVL.click("#settingsBtn"); open_setting(pgVL, "#guardBox"); pgVL.wait_for_timeout(1000)
txt_vl = pgVL.inner_text("#guardBox")
check("🏠 the holiday alarm's settings have „Urlaubs-Licht“ with its lamps and shutters, off at first", "Urlaubs-Licht" in txt_vl
      and pgVL.locator("#vacOn").count() == 1 and not pgVL.is_checked("#vacOn") and pgVL.locator("[data-vac-light='light.wohnzimmer']").count() == 1
      and pgVL.locator("[data-vac-cover='cover.vl_rollo']").count() == 1, txt_vl[-600:])
check("🏠 a garage door is never offered (not by its device class, not by its name)", pgVL.locator("[data-vac-cover='cover.vl_einfahrt']").count() == 0)
pgVL.check("#guardBox [data-gd-sensor='binary_sensor.tuer_vl']")
pgVL.fill("#gdCode", "1357")
pgVL.check("#vacOn")
pgVL.evaluate("document.querySelectorAll('#guardBox details.gdGroup').forEach((d) => { d.open = true; })")
pgVL.check("[data-vac-light='light.wohnzimmer']"); pgVL.check("[data-vac-cover='cover.vl_rollo']")
check("🏠 the „Spielraum“ offers ± 15 … 90 minutes, ± 30 at first", pgVL.evaluate("[...document.querySelectorAll('#vacJitter option')].map((o) => o.value)") == ["15", "30", "45", "60", "90"]
      and pgVL.input_value("#vacJitter") == "30")
pgVL.select_option("#vacJitter", "60")
pgVL.click("#gdSave"); pgVL.wait_for_timeout(1000)
r_vl = api_admin("api/rules")
check("🏠 saved with the rules: on, the lamp, the shutter, ± 60 minutes", r_vl["vac"] == {"on": True, "lights": ["light.wohnzimmer"], "covers": ["cover.vl_rollo"], "jitter": 60},
      r_vl.get("vac"))
st_vl = {}
for _ in range(80):
    st_vl = api_admin("api/rules")["status"].get("vac") or {}
    if (st_vl.get("plan") or {}).get("light.wohnzimmer") and (st_vl.get("learned") or {}).get("light.wohnzimmer"):
        break
    time.sleep(0.25)
asked = json.load(urllib.request.urlopen(HA + "/_history"))
check("🏠 the add-on read the history of the lamp and made tonight's plan from yesterday evening (about 18:30 … 22:15, ± 60 minutes)",
      any("light.wohnzimmer" in a[0] for a in asked) and st_vl.get("learned", {}).get("light.wohnzimmer") == 1
      and all(330 <= a <= 450 and 555 <= b <= 675 for a, b in st_vl["plan"]["light.wohnzimmer"]) and st_vl.get("armed") is False, st_vl)
pgVL.keyboard.press("Escape"); pgVL.wait_for_timeout(300)
pgVL.click("#settingsBtn"); open_setting(pgVL, "#guardBox"); pgVL.wait_for_timeout(1200)
check("🏠 the settings show tonight's plan: the lamp with its bar, „gelernte Abende: 1“, starts when the alarm is armed",
      pgVL.locator(".vacRow[data-light='light.wohnzimmer'] .vacTrack i").count() >= 1 and "gelernte Abende: 1" in pgVL.inner_text(".vacPlan")
      and "sobald der Urlaubs-Alarm scharf ist" in pgVL.inner_text(".vacPlan"), pgVL.inner_text(".vacPlan") if pgVL.locator(".vacPlan").count() else "")
urllib.request.urlopen(urllib.request.Request(BASE + "api/guard/arm", data=json.dumps({"code": "1357"}).encode(), method="POST",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
armed_vl = False
for _ in range(120):
    if (api_admin("api/rules")["status"].get("vac") or {}).get("armed"):
        armed_vl = True
        break
    time.sleep(0.25)
check("🏠 the holiday alarm armed (after its time to leave): the holiday light runs", armed_vl, api("api/guard").get("view"))
check("🏠 no errors on the page", not own_vl, own_vl)
pgVL.close()
urllib.request.urlopen(urllib.request.Request(BASE + "api/guard/disarm", data=json.dumps({"code": "1357"}).encode(), method="POST",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
put_vl("api/rules", {"vac": {"on": False}})
put_vl("api/guard", {"sensors": [], "actions": [], "code": "", "removeCode": True, "delay": 30})
post_vl("/_hist", {})
post_vl("/_extra", {})
set_setting("language", lang_vl)
