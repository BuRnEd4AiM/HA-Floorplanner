"""5.16.0 📸 Bild bei Alarm (the owner's choice 2026-11-17, docs/ideen-5.15 pictures 4 and 5: "wäre cool wenn das auch gehen würde über
Telegram das mit dem Bild"; his choice: his own bot, the plan and a camera): ⚙ → 🚨 Nachricht aufs Handy → "Telegram – eigener Bot (mit
Bild)": the key of the bot, "🔎 Chat finden" (who wrote to the bot), a test with a picture of the plan; a water sensor going off sends the
text with the floor from above (its room red) and the picture of the camera in that room (alarmpic.py, tgbot.py; Telegram is the stand-in
/_tg of the mock).
"""
saved_ap = api_admin("api/layout")
lang_ap = api("api/settings")["language"]
set_setting("language", "de")
TOKEN_AP = "123456789:AAH" + "x" * 32


def notified_ap():
    return json.loads(urllib.request.urlopen(HA + "/_notified").read())


def extra_ap(d):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(d).encode(), method="POST", headers={"Content-Type": "application/json"})).read()


extra_ap({"binary_sensor.wasser_ap": {"state": "off", "attributes": {"friendly_name": "Wassermelder", "device_class": "moisture"}}})
lay_ap = json.loads(json.dumps(saved_ap))
f_ap = lay_ap["floors"][0]
f_ap.setdefault("rooms", []).append({"id": "ap_room", "name": "Waschküche", "color": "#777777", "points": [[60, 60], [64, 60], [64, 63], [60, 63]]})
f_ap.setdefault("walls", []).append({"id": "ap_wall", "a": [60, 60], "b": [64, 60], "thickness": 0.2, "height": 2.6, "openings": []})
f_ap.setdefault("devices", []).extend([
    {"id": "ap_w", "type": "sensor", "x": 61, "z": 61, "y": 0, "rot": 0, "scale": 1, "name": "Wassermelder", "entity": "binary_sensor.wasser_ap"},
    {"id": "ap_c", "type": "camera", "x": 63.5, "z": 62.5, "y": 2.2, "rot": 0, "scale": 1, "name": "Kamera Waschküche", "entity": "camera.flur"}])
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay_ap).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()

pgAP = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_ap = []
pgAP.on("pageerror", lambda e: own_ap.append("PAGEERROR " + str(e)))
pgAP.goto(BASE + "?debug=1&mode=edit"); pgAP.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgAP.wait_for_timeout(800)
pgAP.click("#settingsBtn"); open_setting(pgAP, "#alarmNotify"); pgAP.wait_for_timeout(800)
vias = pgAP.evaluate("[...document.querySelectorAll('#anVia option')].map((o) => o.value)")
check("📸 the messages offer „Telegram – eigener Bot (mit Bild)“", "tgbot" in vias, vias)
pgAP.check("#anOn"); pgAP.select_option("#anVia", "tgbot"); pgAP.wait_for_timeout(200)
check("📸 the bot's part: five numbered steps with the link to BotFather, the key, „Chat finden“, plan and camera ticked",
      pgAP.is_visible("#alarmNotify .anBot") and pgAP.locator("#alarmNotify .anBot .anSteps li").count() == 5
      and pgAP.locator("#alarmNotify .anBot .anSteps a[href*='t.me/BotFather']").count() == 1 and pgAP.is_visible("#anBotFind")
      and pgAP.is_checked("#anPlan") and pgAP.is_checked("#anCamera"))
pgAP.fill("#anBotToken", TOKEN_AP)
pgAP.click("#anBotFind"); pgAP.wait_for_timeout(1500)
st_ap = pgAP.inner_text("#alarmNotify .anStatus")
check("📸 „Chat finden“: the bot and the chat that wrote „Hallo“, ticked at once", "@haus_test_bot" in st_ap
      and pgAP.locator("#alarmNotify [data-chat='4711']").count() == 1 and pgAP.is_checked("#alarmNotify [data-chat='4711']"), st_ap)
pgAP.click("#anSave"); pgAP.wait_for_timeout(1000)
cfg_ap = pgAP.evaluate("() => fetch('api/notify').then((r) => r.json())")
check("📸 saved and ready; the key stays in the add-on", cfg_ap.get("via") == "tgbot" and cfg_ap.get("hasBot") is True and cfg_ap.get("ready") is None
      and cfg_ap.get("botChats") == [{"id": "4711", "name": "Flo"}] and TOKEN_AP not in json.dumps(cfg_ap), cfg_ap)
n_ap = len(notified_ap())
pgAP.click("#anTest"); pgAP.wait_for_timeout(2500)
sent_ap = notified_ap()[n_ap:]
check("📸 the test goes to the chat with a picture of the plan (a PNG) and the text under it",
      any(x[0] == "tg_photo" and x[1] == "4711" and "Test" in (x[2] or "") and x[3] > 5000 and x[4] == "89504e47" for x in sent_ap), sent_ap)
# a water sensor goes off: the text, the plan with its room and the camera of the room
n_ap = len(notified_ap())
urllib.request.urlopen(f"{HA}/_set?e=binary_sensor.wasser_ap&s=on").read()
for _ in range(60):
    got = [x for x in notified_ap()[n_ap:] if x[0] == "tg_photo"]
    if len(got) >= 2:
        break
    pgAP.wait_for_timeout(250)
got = [x for x in notified_ap()[n_ap:] if x[0] in ("tg_photo", "tg_bot")]
check("📸 water: the first picture is the plan (PNG) with the text „Wasser erkannt: Wassermelder“ and where it is, the second the camera of the room",
      len(got) >= 2 and got[0][0] == "tg_photo" and "Wasser erkannt: Wassermelder" in (got[0][2] or "") and "Waschküche" in (got[0][2] or "")
      and got[0][4] == "89504e47" and got[1][0] == "tg_photo" and got[1][2] is None and got[1][3] > 0, got)
check("📸 no errors on the page", not own_ap, own_ap)
pgAP.close()
urllib.request.urlopen(f"{HA}/_set?e=binary_sensor.wasser_ap&s=off").read()
urllib.request.urlopen(urllib.request.Request(BASE + "api/notify", data=json.dumps({"on": False, "via": "whatsapp", "bottoken": "", "botChats": []}).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_ap).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
extra_ap({})
set_setting("language", lang_ap)
