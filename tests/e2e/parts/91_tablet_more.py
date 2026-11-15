"""5.13.0 (the owner: „mehr Einstellungen für Tablets … nicht nur ein und aus“, his choices in the chat; the screen saver and the dimming
themselves came in 5.12.0, parts 07_tablet and 28_settings): the screen saver „Etagen nacheinander“, the 🧽 cleaning button, more own values
per tablet (its minutes, its motion sensor …) and its Fully Kiosk brightness; what a tablet may switch per kind of device (✋ only look,
💡 only on / off, 🎚 everything), refused by the add-on too.
"""
def mock_extra(body):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()


mock_extra({"binary_sensor.flur_bewegung": {"state": "off", "attributes": {"friendly_name": "Bewegung Flur", "device_class": "motion"}},
            "number.wand_screen_brightness": {"state": "120", "attributes": {"friendly_name": "Wand Screen brightness", "min": 0, "max": 255}},
            "switch.wand_screen": {"state": "on", "attributes": {"friendly_name": "Wand Screen"}}})
set_setting("language", "de"); set_setting("units", "metric")
own_tab = []
pgT = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgT.on("pageerror", lambda e: own_tab.append("PAGEERROR " + str(e)))
pgT.goto(BASE + "?debug=1&mode=edit"); pgT.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgT.wait_for_timeout(800)
pgT.click("#settingsBtn"); pgT.wait_for_timeout(500)
open_setting(pgT, "#setSaver"); pgT.wait_for_timeout(300)
seg = pgT.evaluate("[...document.querySelectorAll('.segBtns[data-for=setSaver] button')].map((b) => b.dataset.value)")
check("tablet: the screen saver has „Etagen nacheinander“ (five buttons)", seg == ["off", "orbit", "floors", "clock", "black"], seg)
pgT.click(".segBtns[data-for=setSaver] button[data-value=floors]"); pgT.wait_for_timeout(1200)
check("tablet: „Etagen nacheinander“ is saved, the speed shows as for the turning house", api("api/settings")["saver"] == "floors" and pgT.locator("#setSaverSpeed").locator("xpath=ancestor::div[contains(@class,'row')]").is_visible())
check("tablet: the 🧽 button is on at first, 30 seconds", pgT.is_checked("#setCleanBtn") and pgT.input_value("#setCleanSecs") == "30")
pgT.fill("#setCleanSecs", "45"); pgT.press("#setCleanSecs", "Tab"); pgT.wait_for_timeout(1000)
check("tablet: its seconds are saved", api("api/settings")["cleanSecs"] == 45, api("api/settings")["cleanSecs"])
# a tablet's own values and its rights in ⚙ → 👥 Benutzer & Tablets
open_users(pgT)
pgT.click("#addTablet"); pgT.wait_for_timeout(200)
pgT.fill("#tabletRows .tablet:last-child input[data-role=user]", "wand"); pgT.keyboard.press("Tab"); pgT.wait_for_timeout(1200)
pgT.click("#tabletRows .tablet:last-child .presetBtn"); pgT.wait_for_timeout(300)
folds = "document.querySelectorAll('#tabletRows .tablet:last-child :is(.ksBox, .rtBox)').forEach((d) => { d.open = true; })"
pgT.evaluate(folds); pgT.wait_for_timeout(200)
pgT.select_option("#tabletRows .tablet:last-child [data-ks=saverAfter]", "1"); pgT.wait_for_timeout(1200)
for sel, val in (("[data-ks=wakeEntity]", "binary_sensor.flur_bewegung"), ("[data-ks=fullyBright]", "number.wand_screen_brightness")):
    pgT.evaluate(folds); pgT.wait_for_timeout(200)
    pgT.fill(f"#tabletRows .tablet:last-child {sel}", val); pgT.keyboard.press("Tab"); pgT.wait_for_timeout(1200)
pgT.evaluate(folds); pgT.wait_for_timeout(200)
pgT.select_option("#tabletRows .tablet:last-child [data-ks=brightNight]", "5"); pgT.wait_for_timeout(1200)
pgT.evaluate(folds); pgT.wait_for_timeout(200)
gate = pgT.evaluate("[...document.querySelector('#tabletRows .tablet:last-child [data-right=gate]').options].map((o) => o.value)")
check("tablet: a gate has only ✋ and 🎚 (on / off is all it does)", gate == ["", "view"], gate)
pgT.select_option("#tabletRows .tablet:last-child [data-right=light]", "onoff"); pgT.wait_for_timeout(1200)
st = api_admin("api/settings")
check("tablet: its own values and rights are saved (and in users.json)",
      st["userKiosk"].get("wand") == {"saverAfter": 1, "wakeEntity": "binary_sensor.flur_bewegung", "fullyBright": "number.wand_screen_brightness", "brightNight": 5}
      and st["userRights"].get("wand") == {"light": "onoff"} and api_admin("api/users-file")["inSync"], (st["userKiosk"], st["userRights"]))
pgT.evaluate(folds); pgT.wait_for_timeout(200)
fold = pgT.evaluate("(() => { const g = document.querySelector('#tabletRows .tablet:last-child .ksBox .ksGrid'); return [getComputedStyle(g).display, getComputedStyle(g).gridTemplateColumns.split(' ').length]; })()")
check("tablet: the fold lays its fields out side by side", fold[0] == "grid" and fold[1] >= 3, fold)
check("tablet: the ⚙ of the row counts them", pgT.inner_text("#tabletRows .tablet:last-child .presetBtn").startswith("⚙ 5"), pgT.inner_text("#tabletRows .tablet:last-child .presetBtn"))
pgT.close()

# the tablet itself: its own minutes and motion sensor, the floors, Fully Kiosk, rights per kind, 🧽
calls0 = len(ha_calls())
pgW = b.new_page(viewport={"width": 1180, "height": 820}, has_touch=True, is_mobile=True, extra_http_headers={"X-Remote-User-Name": "wand"})
pgW.on("pageerror", lambda e: own_tab.append("PAGEERROR " + str(e)))
pgW.goto(BASE + "?debug=1"); pgW.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgW.wait_for_timeout(1500)
me = json.load(urllib.request.urlopen(urllib.request.Request(BASE + "api/me", headers={"X-Remote-User-Name": "wand"})))
check("tablet: api/me hands the tablet its own values and rights", me["kiosk"].get("saverAfter") == 1 and me["rights"] == {"light": "onoff"}, me.get("kiosk"))
pgW.evaluate("Object.assign(window.__fp.settings(), { nightDim: 'off' }); window.__fp.kioskTick()"); pgW.wait_for_timeout(800)
check("tablet: the 🧽 button is there on a touch screen", pgW.locator("#cleanBtn").is_visible())
fully = [c for c in ha_calls()[calls0:] if c[2] == "number.wand_screen_brightness"]
check("tablet: Fully Kiosk gets its brightness from the add-on (when the page opens)", fully and fully[-1][:2] == ["number", "set_value"], ha_calls()[calls0:])
nfl = pgW.evaluate("window.__fp.layout.floors.filter((f) => f.kind !== 'roof').length")
f0 = pgW.evaluate("window.__fp.floorIdx()")
pgW.evaluate("window.__fp.kioskIdle(90000); window.__fp.kioskTick()"); pgW.wait_for_timeout(800)
check("tablet: its own minute starts the floors screen saver (the general setting says 5), the house turns",
      pgW.evaluate("window.__fp.kioskSaver()") == "floors" and pgW.evaluate("window.__fp.autoRotate()"), pgW.evaluate("window.__fp.kioskSaver()"))
if nfl >= 2:
    pgW.wait_for_function(f"window.__fp.floorIdx() !== {f0}", timeout=20000)
    check("tablet: after 12 seconds the next floor", pgW.evaluate("window.__fp.floorIdx()") != f0)
urllib.request.urlopen(HA + "/_set?e=binary_sensor.flur_bewegung&s=on"); pgW.wait_for_timeout(2500)
check("tablet: its own motion sensor wakes it", pgW.evaluate("window.__fp.kioskSaver()") is None and not pgW.evaluate("window.__fp.autoRotate()"))
urllib.request.urlopen(HA + "/_set?e=binary_sensor.flur_bewegung&s=off"); pgW.wait_for_timeout(800)
r = pgW.evaluate("""async () => { const r = await fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'light', service: 'turn_on', entity_id: 'light.wohnzimmer', data: { brightness_pct: 30 } }) }); return r.status; }""")
check("tablet: the add-on refuses a brightness for „only on / off“", r == 403, r)
r = pgW.evaluate("""async () => { const r = await fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'light', service: 'toggle', entity_id: 'light.wohnzimmer' }) }); return r.status; }""")
check("tablet: on / off goes through", r == 200, r)
check("tablet: the brightness and colours of lights are hidden", pgW.evaluate("!!document.getElementById('userRights') && document.getElementById('userRights').textContent.includes('.lightctl')"))
pgW.locator("#cleanBtn").tap(); pgW.wait_for_timeout(600)
txt = pgW.inner_text("#cleanScreen")
check("tablet: 🧽 locks the screen with a countdown of its seconds", pgW.evaluate("window.__fp.cleaning()") and "Putzen" in txt and ("44" in txt or "45" in txt), txt)
pgW.screenshot(path=os.path.join(S, "tablet_clean.png"))
pgW.close()
check("tablet: no page errors", not own_tab, own_tab[:3])
for k, v in {"saver": "off", "cleanSecs": 30, "userKiosk": {}, "userRights": {}}.items():
    set_setting(k, v)
mock_extra({})
