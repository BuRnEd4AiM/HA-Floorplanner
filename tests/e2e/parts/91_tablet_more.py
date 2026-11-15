"""5.12.0 (the owner: „mehr Einstellungen für Tablets … nicht nur ein und aus“): the screen saver can be chosen (the house turning at a
speed, the floors in turn, a big clock, black), the night has a strength, a time and a clock, a motion sensor wakes the screen, the 🧽
cleaning button locks the screen; every tablet can have its own values and its Fully Kiosk brightness; what a tablet may switch per kind
of device (✋ only look, 💡 only on / off, 🎚 everything), refused by the add-on too.
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
check("tablet: the screen saver is five buttons (off, house turns, floors, clock, black)", seg == ["off", "orbit", "floors", "clock", "black"], seg)
pgT.click(".segBtns[data-for=setSaver] button[data-value=floors]"); pgT.wait_for_timeout(1200)
check("tablet: „Etagen nacheinander“ is saved, the speed row shows", api("api/settings")["saver"] == "floors" and pgT.locator("[data-ks=speed]").is_visible())
pgT.click(".segBtns[data-for=setSaver] button[data-value=clock]"); pgT.wait_for_timeout(1200)
check("tablet: with the clock there is no speed", api("api/settings")["saver"] == "clock" and pgT.locator("[data-ks=speed]").is_hidden())
pgT.fill("#setNightAfter", "3"); pgT.dispatch_event("#setNightAfter", "change"); pgT.wait_for_timeout(300)
pgT.fill("#setWakeSensor", "binary_sensor.flur_bewegung"); pgT.dispatch_event("#setWakeSensor", "change"); pgT.wait_for_timeout(300)
pgT.evaluate("(() => { const r = document.getElementById('setNightLevel'); r.value = '0.85'; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); })()")
pgT.wait_for_timeout(1200)
st = api("api/settings")
check("tablet: night after, how dark (85 %) and the motion sensor are saved", (st["nightAfter"], st["nightLevel"], st["wakeSensor"]) == (3, 85, "binary_sensor.flur_bewegung")
      and pgT.inner_text("output[for=setNightLevel]").strip() == "85 %", (st["nightAfter"], st["nightLevel"], st["wakeSensor"]))
check("tablet: the motion sensor list offers the motion sensor first", pgT.evaluate("document.querySelector('#wakeList option')?.value") == "binary_sensor.flur_bewegung")
# a tablet's own values and its rights in ⚙ → 👥 Benutzer & Tablets
open_users(pgT)
pgT.click("#addTablet"); pgT.wait_for_timeout(200)
pgT.fill("#tabletRows .tablet:last-child input[data-role=user]", "wand"); pgT.keyboard.press("Tab"); pgT.wait_for_timeout(1200)
pgT.click("#tabletRows .tablet:last-child .presetBtn"); pgT.wait_for_timeout(300)
pgT.evaluate("document.querySelectorAll('#tabletRows .tablet:last-child :is(.ksBox, .rtBox)').forEach((d) => { d.open = true; })"); pgT.wait_for_timeout(200)
pgT.select_option("#tabletRows .tablet:last-child [data-ks=saver]", "black"); pgT.wait_for_timeout(1200)
pgT.evaluate("document.querySelectorAll('#tabletRows .tablet:last-child :is(.ksBox, .rtBox)').forEach((d) => { d.open = true; })"); pgT.wait_for_timeout(200)
pgT.fill("#tabletRows .tablet:last-child [data-ks=fullyBright]", "number.wand_screen_brightness"); pgT.keyboard.press("Tab"); pgT.wait_for_timeout(1200)
pgT.evaluate("document.querySelectorAll('#tabletRows .tablet:last-child :is(.ksBox, .rtBox)').forEach((d) => { d.open = true; })"); pgT.wait_for_timeout(200)
pgT.select_option("#tabletRows .tablet:last-child [data-ks=brightNight]", "5"); pgT.wait_for_timeout(1200)
pgT.evaluate("document.querySelectorAll('#tabletRows .tablet:last-child :is(.ksBox, .rtBox)').forEach((d) => { d.open = true; })"); pgT.wait_for_timeout(200)
gate = pgT.evaluate("[...document.querySelector('#tabletRows .tablet:last-child [data-right=gate]').options].map((o) => o.value)")
check("tablet: a gate has only ✋ and 🎚 (on / off is all it does)", gate == ["", "view"], gate)
pgT.select_option("#tabletRows .tablet:last-child [data-right=light]", "onoff"); pgT.wait_for_timeout(1200)
st = api_admin("api/settings")
check("tablet: its own values and rights are saved (and in users.json)", st["userKiosk"].get("wand") == {"saver": "black", "brightNight": 5, "fullyBright": "number.wand_screen_brightness"}
      and st["userRights"].get("wand") == {"light": "onoff"} and api_admin("api/users-file")["inSync"], (st["userKiosk"], st["userRights"]))
fold = pgT.evaluate("(() => { const g = document.querySelector('#tabletRows .tablet:last-child .ksBox .ksGrid'); return [getComputedStyle(g).display, getComputedStyle(g).gridTemplateColumns.split(' ').length]; })()")
check("tablet: the fold lays its fields out side by side", fold[0] == "grid" and fold[1] >= 3, fold)
check("tablet: the ⚙ of the row counts them", pgT.inner_text("#tabletRows .tablet:last-child .presetBtn").startswith("⚙ 4"), pgT.inner_text("#tabletRows .tablet:last-child .presetBtn"))
pgT.close()

# the tablet itself: its own screen saver (black), the motion sensor, Fully Kiosk, rights per kind
calls0 = len(ha_calls())
pgW = b.new_page(viewport={"width": 1180, "height": 820}, has_touch=True, is_mobile=True, extra_http_headers={"X-Remote-User-Name": "wand"})
pgW.on("pageerror", lambda e: own_tab.append("PAGEERROR " + str(e)))
pgW.goto(BASE + "?debug=1"); pgW.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgW.wait_for_timeout(1200)
me = json.load(urllib.request.urlopen(urllib.request.Request(BASE + "api/me", headers={"X-Remote-User-Name": "wand"})))
check("tablet: api/me hands the tablet its own values and rights", me["kiosk"].get("saver") == "black" and me["rights"] == {"light": "onoff"}, me.get("kiosk"))
pgW.evaluate("Object.assign(window.__fp.settings(), { idleReturn: 1, saverAfter: 0, nightDim: 'off' }); window.__fp.kioskTick()"); pgW.wait_for_timeout(1500)
check("tablet: the 🧽 button is there on a touch screen", pgW.locator("#cleanBtn").is_visible())
pgW.evaluate("window.__fp.kioskIdle(2 * 60000); window.__fp.kioskTick()"); pgW.wait_for_timeout(800)
check("tablet: its own screen saver (black) covers the screen", pgW.evaluate("window.__fp.kioskSaver()") == "black" and pgW.locator("#saverScreen.black").is_visible())
urllib.request.urlopen(HA + "/_set?e=binary_sensor.flur_bewegung&s=on"); pgW.wait_for_timeout(1500)
pgW.evaluate("window.__fp.kioskTick()"); pgW.wait_for_timeout(500)
check("tablet: the motion sensor wakes it", pgW.evaluate("window.__fp.kioskSaver()") is None and pgW.locator("#saverScreen").is_hidden())
urllib.request.urlopen(HA + "/_set?e=binary_sensor.flur_bewegung&s=off"); pgW.wait_for_timeout(800)
fully = [c for c in ha_calls()[calls0:] if c[2] == "number.wand_screen_brightness"]
check("tablet: Fully Kiosk gets its brightness from the add-on (when the page opens)", fully and fully[-1][:2] == ["number", "set_value"], ha_calls()[calls0:])
# rights: only on / off for lights
pgW.evaluate("window.__fp.kioskIdle(0)")
r = pgW.evaluate("""async () => { const r = await fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'light', service: 'turn_on', entity_id: 'light.wohnzimmer', data: { brightness_pct: 30 } }) }); return r.status; }""")
check("tablet: the add-on refuses a brightness for „only on / off“", r == 403, r)
r = pgW.evaluate("""async () => { const r = await fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'light', service: 'toggle', entity_id: 'light.wohnzimmer' }) }); return r.status; }""")
check("tablet: on / off goes through", r == 200, r)
check("tablet: the brightness and colours of lights are hidden", pgW.evaluate("!!document.getElementById('userRights') && document.getElementById('userRights').textContent.includes('.lightctl')"))
# 🧽 cleaning
pgW.locator("#cleanBtn").tap(); pgW.wait_for_timeout(600)
check("tablet: 🧽 locks the screen with a countdown", pgW.evaluate("window.__fp.cleaning()") and "Putzen" in pgW.inner_text("#cleanScreen"), pgW.inner_text("#cleanScreen"))
pgW.screenshot(path=os.path.join(S, "tablet_clean.png"))
pgW.close()
# the clock in the night and the clock screen saver (as admin, the general values)
pgC = b.new_page(viewport={"width": 1200, "height": 800}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgC.on("pageerror", lambda e: own_tab.append("PAGEERROR " + str(e)))
pgC.goto(BASE + "?debug=1&mode=live"); pgC.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgC.wait_for_timeout(800)
pgC.evaluate("Object.assign(window.__fp.settings(), { saver: 'clock', saverAfter: 1, idleReturn: 0, nightDim: 'off', wakeSensor: '' }); window.__fp.kioskIdle(2 * 60000); window.__fp.kioskTick()")
pgC.wait_for_timeout(600)
txt = pgC.inner_text("#saverScreen")
check("tablet: the clock screen saver shows the time and the date", pgC.locator("#saverScreen .ksTime").is_visible() and ":" in txt, txt)
pgC.screenshot(path=os.path.join(S, "tablet_clock.png"))
pgC.mouse.click(600, 400); pgC.wait_for_timeout(400)
check("tablet: a touch ends it", pgC.locator("#saverScreen").is_hidden())
pgC.evaluate("""() => { const d = new Date(), now = d.getHours() * 60 + d.getMinutes(), hm = (m) => { m = (m + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  Object.assign(window.__fp.settings(), { saver: 'off', nightDim: 'time', nightFrom: hm(now - 60), nightTo: hm(now + 60), nightLevel: 90, nightAfter: 3, nightClock: true }); }""")
pgC.evaluate("window.__fp.kioskIdle(2 * 60000); window.__fp.kioskTick()"); pgC.wait_for_timeout(300)
check("tablet: not dark before its minutes", pgC.locator("#nightDim").is_hidden())
pgC.evaluate("window.__fp.kioskIdle(4 * 60000); window.__fp.kioskTick()"); pgC.wait_for_timeout(300)
check("tablet: the night is as dark as set and shows a clock", pgC.locator("#nightDim").is_visible() and "0.9" in pgC.evaluate("document.getElementById('nightDim').style.background")
      and pgC.locator("#nightDim .ksTime").is_visible())
pgC.mouse.click(600, 400); pgC.wait_for_timeout(300)
pgC.close()
check("tablet: no page errors", not own_tab, own_tab[:3])
st = api_admin("api/settings")
for k, v in {"saver": "", "nightAfter": 1, "nightLevel": 72, "wakeSensor": "", "nightClock": False}.items():
    set_setting(k, v)
set_setting("userKiosk", {}); set_setting("userRights", {})
mock_extra({})
