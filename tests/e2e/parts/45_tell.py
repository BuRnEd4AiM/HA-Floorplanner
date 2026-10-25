"""4.23.0 (#531): 🔔 "Sag mir Bescheid" on 🧺 Haushalt. A running machine has the button; a tap keeps the wish for every screen ("✓ Ich sage
Bescheid", a second tap takes it back); when the machine is done the add-on sends one message through the way of ⚙ → Warnungen & Alarm
(here WhatsApp, also while "Nachricht bei Alarm senden" is off), never twice for one run. "Immer Bescheid sagen" in ⚙ tells about every run
that just ended. Without a way to send, the button says where to set one up.
"""
import datetime as _dt
st_tl = api("api/settings")
set_setting("language", "de")
def post_tl(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
iso_tl = lambda minutes: (_dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(minutes=minutes)).isoformat()
def machines_tl(washer, washer_changed):
    post_tl("/_extra", {
        "sensor.waschmaschine_operation_state": {"state": washer, "last_changed": washer_changed, "attributes": {"friendly_name": "Waschmaschine Operation state"}},
        "sensor.waschmaschine_finish_time": {"state": iso_tl(40), "attributes": {"friendly_name": "Waschmaschine Finish time", "device_class": "timestamp"}},
        "sensor.trockner_leistung": {"state": "1", "attributes": {"friendly_name": "Trockner Leistung", "unit_of_measurement": "W", "device_class": "power"}},
    })
machines_tl("run", iso_tl(-50))
post_tl("/_hist", {"sensor.trockner_leistung": [[iso_tl(-90), "1"], [iso_tl(-70), "800"], [iso_tl(-5), "1"]]})   # the dryer ended 5 minutes ago
def notify_tl(**cfg):
    body = {"on": False, "apikey": None, "tgkey": None, "phone": "", "services": [], "entities": [], "tgUsers": [], "via": "whatsapp", "tgMode": "user", **cfg}
    r = urllib.request.Request(BASE + "api/notify", data=json.dumps(body).encode(), method="PUT", headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})
    urllib.request.urlopen(r).read()
sent_tl = lambda: [n for n in json.load(urllib.request.urlopen(HA + "/_notified")) if n[0] == "callmebot"]
def household_tl():
    return json.load(urllib.request.urlopen(urllib.request.Request(BASE + "api/household", headers={"X-Remote-User-Name": "admin"})))
own_tl = []
pgL = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgL.on("console", lambda m: own_tl.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgL.on("pageerror", lambda e: own_tl.append("PAGEERROR " + str(e)))
notify_tl()                                       # no way to send a message yet
pgL.goto(BASE + "?debug=1"); pgL.wait_for_timeout(1500)
if pgL.is_visible("#modeSwitch [data-mode=live]"): pgL.click("#modeSwitch [data-mode=live]"); pgL.wait_for_timeout(800)
pgL.click("#tabBar [data-tab=household]"); pgL.wait_for_timeout(2000)
wm = "[data-page=household] [data-kind=washer]"
check("tell: the running washing machine has '🔔 Sag mir Bescheid', the dryer that is done has none",
      pgL.locator(f"{wm} [data-act=tell]").count() == 1 and "Sag mir Bescheid" in pgL.inner_text(f"{wm} [data-act=tell]")
      and pgL.locator("[data-page=household] [data-kind=dryer] [data-act=tell]").count() == 0, pgL.inner_text("[data-page=household]")[:300])
pgL.click(f"{wm} [data-act=tell]"); pgL.wait_for_timeout(600)
check("tell: without a way to send it says where to set one up, nothing is kept", "Warnungen & Alarm" in pgL.inner_text(wm) and not household_tl()["tell"], pgL.inner_text(wm))
notify_tl(phone="+491701234567", apikey="123456")  # WhatsApp set up, "Nachricht bei Alarm senden" still off
pgL.reload(); pgL.wait_for_timeout(1500)
if pgL.is_visible("#modeSwitch [data-mode=live]"): pgL.click("#modeSwitch [data-mode=live]"); pgL.wait_for_timeout(800)
pgL.click("#tabBar [data-tab=household]"); pgL.wait_for_timeout(2000)
pgL.click(f"{wm} [data-act=tell]"); pgL.wait_for_timeout(800)
check("tell: a tap keeps the wish for every screen: '✓ Ich sage Bescheid'", "Ich sage Bescheid" in pgL.inner_text(f"{wm} [data-act=tell]") and household_tl()["tell"] == {"washer": True},
      pgL.inner_text(wm))
pgL.click(f"{wm} [data-act=tell]"); pgL.wait_for_timeout(800)
check("tell: a second tap takes it back", "Sag mir Bescheid" in pgL.inner_text(f"{wm} [data-act=tell]") and household_tl()["tell"] == {})
pgL.click(f"{wm} [data-act=tell]"); pgL.wait_for_timeout(800)
n0 = len(sent_tl())
machines_tl("finished", iso_tl(0))                 # it is done now
pgL.wait_for_timeout(31000)                       # the add-on keeps what the machines do half a minute
h = household_tl()
msgs = sent_tl()[n0:]
check("tell: done: one message through WhatsApp, the wish is gone", len(msgs) == 1 and ("Waschmaschine" in msgs[0][2] or "washing machine" in msgs[0][2]) and h["tell"] == {}, (msgs, h.get("tell")))
household_tl(); pgL.wait_for_timeout(300)
check("tell: never twice for one run", len(sent_tl()) == n0 + 1)
check("tell: the dryer was not asked for, nothing about it", not [m for m in sent_tl() if "Trockner" in m[2] or "dryer" in m[2]])
pgL.click("#settingsBtn"); pgL.wait_for_timeout(300)
open_setting(pgL, "#setHouseholdTell"); pgL.wait_for_timeout(200)
pgL.check("#setHouseholdTell"); pgL.wait_for_timeout(1200)
check("tell: ⚙ → Reiter unten: ticking 'Immer Bescheid sagen' saves it", api("api/settings")["householdTell"] is True)
pgL.keyboard.press("Escape")
household_tl(); pgL.wait_for_timeout(500)
check("tell: 'Immer Bescheid sagen': the dryer that ended 5 minutes ago is told about, once", len([m for m in sent_tl() if "Trockner" in m[2] or "dryer" in m[2]]) == 1, sent_tl()[-2:])
check("tell: no errors on the page", not own_tl, own_tl[:3])
pgL.close()

notify_tl()
for k in ("householdTell", "language"):
    set_setting(k, st_tl.get(k, False if k == "householdTell" else ""))
post_tl("/_extra", {}); post_tl("/_hist", {})
