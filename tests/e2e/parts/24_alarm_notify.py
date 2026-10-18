"""A message on alarm (#414): the part "🚨 Message on alarm" of the settings (only for editors), WhatsApp through CallMeBot (test message,
a wrong key said so), a smoke sensor going off sends a message with the place in the plan, and a notify service of Home Assistant.
"""
import time
saved_an = api_admin("api/layout")              # put back at the end
lang_an = api("api/settings")["language"]
set_setting("language", "de")
def notified():
    return json.loads(urllib.request.urlopen(HA + "/_notified").read())
def ha_set(e, s):
    urllib.request.urlopen(f"{HA}/_set?e={e}&s={s}").read()
# a smoke sensor in a room of the plan (saved before the page opens): the message says where it is
lay = json.loads(json.dumps(saved_an))
f0 = lay["floors"][0]
f0.setdefault("rooms", []).append({"id": "an_room", "name": "Alarmküche", "color": "#8a7f70", "points": [[20, 20], [24, 20], [24, 24], [20, 24]]})
f0.setdefault("devices", []).append({"id": "an_smoke", "type": "smoke", "x": 22, "z": 22, "y": 2.5, "rot": 0, "scale": 1, "name": "Rauchmelder", "entity": "binary_sensor.rauch"})
room = f0.get("name") or ""
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
pgN = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgN.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgN.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgN.goto(BASE + "?debug=1&mode=edit"); pgN.wait_for_timeout(1500)
pgN.click("#settingsBtn"); open_setting(pgN, "#alarmNotify"); pgN.wait_for_timeout(800)
txt = pgN.inner_text("#alarmNotify") if pgN.is_visible("#alarmNotify") else ""
opts = pgN.evaluate("() => [...document.querySelectorAll('#alarmNotify [data-svc]')].map((c) => c.dataset.svc)")
check("alarm message (#414, #456): the settings have the part, off at first, every kind ticked, Home Assistant's notify services as a list to tick",
      pgN.is_visible("#alarmNotifyTitle") and "Benachrichtigung bei Alarm" in pgN.text_content("#alarmNotifyTitle") and not pgN.is_checked("#anOn")
      and all(pgN.is_checked(f"#anKind_{k}") for k in ("alarm", "smoke", "gas", "co", "water")) and opts == ["mobile_app_test", "whatsapp"], (txt, opts))
check("alarm message (#454): WhatsApp has three numbered steps, the first with the link to CallMeBot",
      pgN.locator("#alarmNotify .anWa .anSteps li").count() == 3 and "I allow callmebot to send me messages" in pgN.inner_text("#alarmNotify .anWa .anSteps")
      and pgN.locator("#alarmNotify .anWa .anSteps li a[href*=callmebot]").count() == 1)
pgN.check("#anOn"); pgN.select_option("#anVia", "whatsapp")
pgN.fill("#anPhone", "+49 170 1234567"); pgN.fill("#anKey", "987654")
pgN.click("#anSave"); pgN.wait_for_timeout(800)
st = pgN.inner_text("#alarmNotify .anStatus")
check("alarm message: saved, ready; the key is not handed out again", "Gespeichert" in st and "Bereit" in st
      and "987654" not in json.dumps(pgN.evaluate("() => fetch('api/notify').then((r) => r.json())")) and pgN.input_value("#anKey") == "", st)
n0 = len(notified())
pgN.click("#anTest"); pgN.wait_for_timeout(1200)
last = notified()[n0:] if len(notified()) > n0 else []
check("alarm message: the test goes to WhatsApp through CallMeBot with the number and the key, in German",
      last and last[-1][0] == "callmebot" and last[-1][1] == "+491701234567" and last[-1][3] == "987654" and "Test" in last[-1][2]
      and "Test gesendet" in pgN.inner_text("#alarmNotify .anStatus"), (last, pgN.inner_text("#alarmNotify .anStatus")))
pgN.fill("#anKey", "bad"); pgN.click("#anTest"); pgN.wait_for_timeout(1200)
st = pgN.inner_text("#alarmNotify .anStatus")
check("alarm message: a wrong key is said so", "Nicht gesendet" in st and "invalid" in st, st)
pgN.fill("#anKey", "987654"); pgN.click("#anSave"); pgN.wait_for_timeout(800)

# the smoke sensor goes off: one message with what and where (the add-on watches by itself; it looks every few seconds whether it is on)
time.sleep(7)
got = None
for attempt in range(3):
    n0 = len(notified())
    ha_set("binary_sensor.rauch", "off"); time.sleep(0.5)
    ha_set("binary_sensor.rauch", "on")
    for _ in range(25):
        time.sleep(0.3)
        got = next((m for m in notified()[n0:] if m[0] == "callmebot" and "Rauch erkannt" in (m[2] or "")), None)
        if got:
            break
    if got:
        break
check("alarm message: a smoke sensor going off sends a WhatsApp with its name, the floor and the room",
      bool(got) and "Rauchmelder" in got[2] and "Alarmküche" in got[2] and (not room or room in got[2]), (got, room))
n1 = len(notified())
ha_set("binary_sensor.rauch", "off"); time.sleep(0.4); ha_set("binary_sensor.rauch", "on"); time.sleep(2)
check("alarm message: going off again right after is not sent twice", not any("Rauch erkannt" in (m[2] or "") for m in notified()[n1:]), notified()[n1:])
ha_set("binary_sensor.rauch", "off")

pgN.select_option("#anVia", "ha"); pgN.check("#alarmNotify [data-svc=whatsapp]"); pgN.check("#alarmNotify [data-svc=mobile_app_test]")
n0 = len(notified())
pgN.click("#anTest"); pgN.wait_for_timeout(1500)
last = [m for m in notified()[n0:] if m[0] == "ha"]
check("alarm message (#456): through the ticked notify services of Home Assistant, to each of them",
      sorted(m[1] for m in last) == ["mobile_app_test", "whatsapp"] and all("Test" in m[2] for m in last), last)
# Telegram through CallMeBot (#456): into a group with its key, or to users
pgN.select_option("#anVia", "telegram")
check("alarm message (#456): Telegram shows who it goes to and the steps", pgN.is_visible("#anTgMode") and pgN.is_visible("#anTgUsers")
      and "@CallMeBot_txtbot" in pgN.inner_text("#alarmNotify .anTgUser .anSteps") and not pgN.is_visible("#anPhone"))
pgN.select_option("#anTgMode", "group"); pgN.fill("#anTgKey", "grp-key1")
n0 = len(notified())
pgN.click("#anTest"); pgN.wait_for_timeout(1500)
last = notified()[n0:]
check("alarm message (#456): the test goes into the Telegram group with its key; the key is not handed out again",
      last and last[-1][0] == "tg_group" and last[-1][1] == "grp-key1" and "Test" in last[-1][2] and pgN.input_value("#anTgKey") == ""
      and "grp-key1" not in json.dumps(pgN.evaluate("() => fetch('api/notify').then((r) => r.json())")), last)
pgN.select_option("#anTgMode", "user"); pgN.fill("#anTgUsers", "flo_weber, @anna_m")
n0 = len(notified())
pgN.click("#anTest"); pgN.wait_for_timeout(1500)
last = notified()[n0:]
check("alarm message (#456): ... or to Telegram users (an @ is added)", last and last[-1][0] == "tg_user" and last[-1][1] == "@flo_weber|@anna_m"
      and pgN.input_value("#anTgUsers") == "@flo_weber, @anna_m", last)
pgN.select_option("#anTgMode", "group"); pgN.fill("#anTgKey", "bad"); pgN.click("#anTest"); pgN.wait_for_timeout(1500)
check("alarm message (#456): a wrong group key is said so", "Nicht gesendet" in pgN.inner_text("#alarmNotify .anStatus"), pgN.inner_text("#alarmNotify .anStatus"))
pgN.evaluate("() => fetch('api/notify', {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({on: false, apikey: null, tgkey: null, phone: '', services: [], tgUsers: [], via: 'whatsapp', tgMode: 'user'})})")
pgN.wait_for_timeout(300)
pgN.close()

pgT = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "tablet_e2e"})
pgT.goto(BASE + "?debug=1"); pgT.wait_for_timeout(1200)
r = pgT.evaluate("() => fetch('api/notify').then((r) => r.status)")
check("alarm message: a user who may not edit gets nothing of it (no number, no key)", r == 403 and not pgT.is_visible("#alarmNotify"), r)
pgT.close()
pgR3 = b.new_page(extra_http_headers={"X-Remote-User-Name": "admin"})
pgR3.goto(BASE + "?debug=1"); pgR3.wait_for_timeout(800)
pgR3.evaluate("(l) => fetch('api/layout', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(l)})", saved_an); pgR3.wait_for_timeout(400)
pgR3.close()
set_setting("language", lang_an)
bad = [x for x in own if "favicon" not in x and "status of 502" not in x]    # the test with the wrong key, on purpose
check("alarm message: no console errors", not bad, bad)
