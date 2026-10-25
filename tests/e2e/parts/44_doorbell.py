"""4.22.0: 🔔 the doorbell. An event of the class "doorbell" (or a binary sensor named like a bell) is found by itself; when it rings (a new
time stamp pushed by Home Assistant, a sensor from off to on) every screen in the live mode shows the window: red head with the name and
the time, the live camera, "🔓 Tür öffnen" (asks "Sicher? Öffnen" first, then unlocks the lock) and "✕ Schließen". Not in the editor, not
for a user with the lock "Klingel-Fenster". ⚙ → 📱 Wandtablet → 🔔 Klingel: "+ Klingel" with camera and opener, saved in settings.doorbell;
"🔔 Ausprobieren" shows it on this screen.
"""
import datetime as _dt
import urllib.parse
st_db = api("api/settings")
set_setting("language", "de")
def post_db(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def ring_db(entity="event.e2e_klingel"):
    stamp = _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="milliseconds")
    urllib.request.urlopen(HA + "/_set?e=" + entity + "&s=" + urllib.parse.quote(stamp)).read()
post_db("/_extra", {
    "event.e2e_klingel": {"state": "2026-01-01T10:00:00.000+00:00", "attributes": {"friendly_name": "Haustür Klingel", "device_class": "doorbell", "event_type": "ring"}},
    "binary_sensor.e2e_gartenklingel": {"state": "off", "attributes": {"friendly_name": "Gartentor Klingel"}},
    "lock.e2e_haustuer": {"state": "locked", "attributes": {"friendly_name": "Haustür Schloss"}},
})
own_db = []
pgD = b.new_page(viewport={"width": 1280, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgD.on("console", lambda m: own_db.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgD.on("pageerror", lambda e: own_db.append("PAGEERROR " + str(e)))
pgD.goto(BASE + "?debug=1"); pgD.wait_for_timeout(1500)
if pgD.is_visible("#modeSwitch [data-mode=live]"): pgD.click("#modeSwitch [data-mode=live]"); pgD.wait_for_timeout(800)
found = pgD.evaluate("window.__fp.bells()")
check("doorbell: found by itself, the event 'doorbell' and the sensor named Klingel", sorted(x["entity"] for x in found) == ["binary_sensor.e2e_gartenklingel", "event.e2e_klingel"], found)
check("doorbell: nothing shows before a ring (the state seen first only counts as seen)", not pgD.evaluate("window.__fp.bellOpen()"))

ring_db(); pgD.wait_for_timeout(1500)
check("doorbell: a ring opens the window with the bell's name and the time", pgD.evaluate("window.__fp.bellOpen()") and "Es klingelt: Haustür Klingel" in pgD.inner_text("#bellName")
      and len(pgD.inner_text("#bellTime")) == 5, (pgD.evaluate("window.__fp.bellOpen()"), pgD.inner_text("#bellName") if pgD.is_visible("#bellName") else ""))
check("doorbell: without a camera chosen the only camera there is shows its live picture; no opener: no 'Tür öffnen'",
      pgD.locator("#bellCam .camLive").count() == 1 and pgD.is_hidden("#bellOpen"), pgD.inner_text("#bellCam"))
pgD.click("#bellClose"); pgD.wait_for_timeout(300)
check("doorbell: '✕ Schließen' closes it", not pgD.evaluate("window.__fp.bellOpen()"))

set_setting("doorbell", {"on": True, "sound": False, "bells": [{"entity": "event.e2e_klingel", "camera": "camera.flur", "open": "lock.e2e_haustuer", "name": "Haustür"}]})
pgD.reload(); pgD.wait_for_timeout(1500)
if pgD.is_visible("#modeSwitch [data-mode=live]"): pgD.click("#modeSwitch [data-mode=live]"); pgD.wait_for_timeout(800)
check("doorbell: the bells chosen in ⚙ replace the ones found", [x["entity"] for x in pgD.evaluate("window.__fp.bells()")] == ["event.e2e_klingel"])
pgD.wait_for_timeout(500)
ring_db(); pgD.wait_for_timeout(1500)
check("doorbell: the window shows the live camera of the bell and the name chosen",
      pgD.locator("#bellCam .camLive").count() == 1 and "Haustür" in pgD.inner_text("#bellName"), pgD.inner_html("#bellCam")[:200])
calls0 = len(ha_calls())
pgD.click("#bellOpen"); pgD.wait_for_timeout(300)
check("doorbell: the first tap on 'Tür öffnen' only asks ('Sicher? Öffnen'), nothing opens", "Sicher" in pgD.inner_text("#bellOpen") and len(ha_calls()) == calls0, pgD.inner_text("#bellOpen"))
pgD.click("#bellOpen"); pgD.wait_for_timeout(800)
check("doorbell: the second tap unlocks the lock and says so", ["lock", "unlock", "lock.e2e_haustuer"] in ha_calls() and "geöffnet" in pgD.inner_text("#bellOpen"), (ha_calls()[-2:], pgD.inner_text("#bellOpen")))
pgD.click("#bellClose"); pgD.wait_for_timeout(300)

pgD.click("#modeSwitch [data-mode=edit]"); pgD.wait_for_timeout(500)
ring_db(); pgD.wait_for_timeout(1200)
check("doorbell: in the editor no window pops up", not pgD.evaluate("window.__fp.bellOpen()"))

set_setting("doorbell", {"on": True, "sound": False, "bells": []})
pgD.reload(); pgD.wait_for_timeout(2500)
pgD.click("#settingsBtn"); pgD.wait_for_timeout(300)
open_setting(pgD, "#setBellOn"); pgD.wait_for_timeout(300)
check("doorbell: ⚙ → 📱 Wandtablet → 🔔 Klingel says what it found by itself", "Haustür Klingel" in pgD.inner_text("#bellFound"), pgD.inner_text("#bellFound"))
pgD.click("#addBell"); pgD.wait_for_timeout(1200)
saved = api("api/settings")["doorbell"]
check("doorbell: '+ Klingel' adds a row with a found bell and saves it",
      [x["entity"] for x in saved["bells"]] in (["event.e2e_klingel"], ["binary_sensor.e2e_gartenklingel"]) and pgD.locator("#setBells .bellPref").count() == 1, saved)
pgD.select_option("#setBells .bellPref [data-role=camera]", "camera.flur"); pgD.wait_for_timeout(300)
pgD.select_option("#setBells .bellPref [data-role=open]", "lock.e2e_haustuer"); pgD.wait_for_timeout(1200)
saved = api("api/settings")["doorbell"]
check("doorbell: camera and opener of the row are saved", saved["bells"][0]["camera"] == "camera.flur" and saved["bells"][0]["open"] == "lock.e2e_haustuer", saved)
pgD.click("#bellTest"); pgD.wait_for_timeout(800)
check("doorbell: '🔔 Ausprobieren' shows the window on this screen (also in the editor)", pgD.evaluate("window.__fp.bellOpen()"))
pgD.evaluate("window.__fp.bellClose()")
pgD.keyboard.press("Escape"); pgD.wait_for_timeout(300)

# a wall tablet: a binary sensor from off to on rings; the lock "Klingel-Fenster" keeps the window away from that user
set_setting("doorbell", {"on": True, "sound": False, "bells": [{"entity": "binary_sensor.e2e_gartenklingel", "camera": "", "open": "", "name": "Gartentor"}]})
pgT = b.new_page(viewport={"width": 1024, "height": 768}, extra_http_headers={"X-Remote-User-Name": "flurtablet"})
pgT.goto(BASE + "?debug=1&mode=live"); pgT.wait_for_timeout(2000)
urllib.request.urlopen(HA + "/_set?e=binary_sensor.e2e_gartenklingel&s=on").read(); pgT.wait_for_timeout(1500)
check("doorbell: a wall tablet shows it when the bell's sensor goes from off to on", pgT.evaluate("window.__fp.bellOpen()") and "Gartentor" in pgT.inner_text("#bellName"))
pgT.evaluate("window.__fp.bellClose()")
urllib.request.urlopen(HA + "/_set?e=binary_sensor.e2e_gartenklingel&s=off").read()
set_setting("userLocks", {**(api("api/settings").get("userLocks") or {}), "flurtablet": ["doorbell"]})
pgT.reload(); pgT.wait_for_timeout(2000)
urllib.request.urlopen(HA + "/_set?e=binary_sensor.e2e_gartenklingel&s=on").read(); pgT.wait_for_timeout(1500)
check("doorbell: with the lock 'Klingel-Fenster' that user's screen stays as it is", not pgT.evaluate("window.__fp.bellOpen()"))
pgT.close()
check("doorbell: no errors on the page", not own_db, own_db[:3])
pgD.close()

for k in ("userLocks", "doorbell", "language"):
    set_setting(k, st_db.get(k, {} if k == "userLocks" else ""))
post_db("/_extra", {})
