"""5.10.0 (the owner, 2026-11-14, his choice from docs/ideen-5.10: idea 3 "Reiter" and, on phones, idea 4 "erst kurz"): the room card of the
live view. On top the room's values as chips, then tabs (💡 Licht, 🌡 Klima, 🚪 Fenster …), one shown at a time. A lamp's row: a tap
switches it, dragging sideways sets its brightness. Scenes once, as buttons, without the date of their last run (#750). The heating sits in
the tab 🌡 Klima. On a phone the card first comes small with big buttons; a button opens the whole card at its tab, the grip pulled down
makes it small again and then closes it.
"""
saved_cd = api_admin("api/layout")              # put back at the end
st_cd = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")   # base.py may leave imperial units
def extra_cd(body):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
extra_cd({
    "light.cd_lamp": {"state": "on", "attributes": {"friendly_name": "Decke Karte", "brightness": 128, "supported_color_modes": ["brightness"], "color_mode": "brightness"}},
    "light.cd_led": {"state": "off", "attributes": {"friendly_name": "LED Karte", "supported_color_modes": ["brightness"]}},
    "scene.cd_cozy": {"state": "2026-11-13T22:23:31.697Z", "attributes": {"friendly_name": "Kartenraum Gemütlich", "entity_id": ["light.cd_lamp", "light.cd_led"]}},
    "sensor.cd_temp": {"state": "21.4", "attributes": {"friendly_name": "Temperatur Karte", "unit_of_measurement": "°C", "device_class": "temperature"}},
    "sensor.cd_co2": {"state": "1350", "attributes": {"friendly_name": "CO2 Karte", "unit_of_measurement": "ppm", "device_class": "carbon_dioxide"}},
    "binary_sensor.cd_window": {"state": "on", "attributes": {"friendly_name": "Fenster Karte", "device_class": "window"}},
})
lay_cd = json.loads(json.dumps(saved_cd))
f0_cd = lay_cd["floors"][0]
f0_cd.setdefault("rooms", []).append({"id": "cd_room", "name": "Kartenraum", "color": "#777777", "points": [[140, 90], [146, 90], [146, 95], [140, 95]]})
f0_cd.setdefault("walls", []).append({"id": "cd_wall", "a": [140, 90], "b": [146, 90], "thickness": 0.2, "height": 2.6, "openings": [
    {"id": "cd_w1", "type": "window", "style": "single", "pos": 2.0, "width": 1.0, "height": 1.2, "sill": 0.9, "name": "Fenster Karte", "entity": "binary_sensor.cd_window"}]})
dev_cd = lambda i, typ, x, z, e, name: {"id": f"cd_d{i}", "type": typ, "x": x, "z": z, "y": 0, "rot": 0, "scale": 1, "name": name, "entity": e}
f0_cd.setdefault("devices", []).extend([dev_cd(1, "light", 142, 92, "light.cd_lamp", "Decke Karte"), dev_cd(2, "strip", 144, 94, "light.cd_led", "LED Karte"),
    dev_cd(3, "thermostat", 140.3, 93, "climate.wohnzimmer", "Heizung Karte"), dev_cd(4, "sensor", 145, 91, "sensor.cd_temp", "Temperatur Karte"),
    dev_cd(5, "sensor", 145, 92, "sensor.cd_co2", "CO2 Karte")])
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay_cd).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()

def open_cd(**ctx):
    pg = b.new_page(extra_http_headers={"X-Remote-User-Name": "admin"}, **ctx)
    pg.on("pageerror", lambda e: own_cd.append("PAGEERROR " + str(e)))
    pg.goto(BASE + "?debug=1&mode=live"); pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pg.wait_for_timeout(1500)
    pg.evaluate("window.__fp.switchFloor(0)"); pg.wait_for_timeout(600)
    pg.evaluate("window.__fp.openRoomPanel('cd_room')"); pg.wait_for_timeout(1200)
    return pg
def wait_cd(pg, fn, n=30):
    for _ in range(n):
        if fn(): return True
        pg.wait_for_timeout(200)
    return fn()
own_cd = []
pgD = open_cd(viewport={"width": 1400, "height": 950})
tabs_cd = pgD.evaluate("[...document.querySelectorAll('#roomPanel .rpTab')].map((b) => [b.dataset.tab, b.querySelector('small').textContent, b.classList.contains('alarm')])")
check("room card: tabs Licht, Klima, Fenster with their badges (1 of 2 lamps on, the temperature, 1 open in red)",
      [x[0] for x in tabs_cd] == ["light", "climate", "open"] and tabs_cd[0][1] == "1/2" and "21" in tabs_cd[1][1] and tabs_cd[2][2], tabs_cd)
chips_cd = pgD.evaluate("[...document.querySelectorAll('#roomPanel .rpChip')].map((c) => [c.dataset.k, c.textContent, c.className])")
check("room card: the values on top as chips (temperature, CO₂ in red from 1200 ppm, the open window)",
      [c[0] for c in chips_cd][:1] == ["temp"] and any(c[0] == "co2" and "1350" in c[1] and "bad" in c[2] for c in chips_cd) and any(c[0] == "open" for c in chips_cd), chips_cd)
check("room card: it opens on 💡 Licht, the heating is not shown beside it", pgD.evaluate("window.__fp.roomCard().tab") == "light" and pgD.locator("#heatPanel").is_hidden())
scenes_cd = pgD.evaluate("[...document.querySelectorAll('#roomPanel .rpScene')].map((b) => b.textContent)")
txt_cd = pgD.inner_text("#roomPanel")
check("room card: the scene once, as a button without the room's name in front and without a date (#750)",
      scenes_cd == ["🛋️Gemütlich"] and "2026-11-13T" not in txt_cd and txt_cd.count("Gemütlich") == 1, (scenes_cd, txt_cd[:400]))
n0 = len(ha_calls())
pgD.locator("#roomPanel .rpScene").first.click()
check("room card: a tap on the scene starts it", wait_cd(pgD, lambda: ["scene", "turn_on", "scene.cd_cozy"] in ha_calls()[n0:]), ha_calls()[n0:])

# a lamp's row: a tap switches, dragging sideways sets the brightness
row_box = lambda e: pgD.evaluate(f"(() => {{ const r = document.querySelector('#roomPanel .rpLight[data-e=\"{e}\"]'); r.scrollIntoView({{ block: 'center' }}); const b = r.getBoundingClientRect(); return {{ x: b.left, y: b.top, w: b.width, h: b.height }}; }})()")
bx = row_box("light.cd_led")
n0 = len(ha_calls())
pgD.mouse.click(bx["x"] + bx["w"] * 0.3, bx["y"] + bx["h"] / 2)
check("room card: a tap on a lamp's row switches it", wait_cd(pgD, lambda: ["light", "turn_on", "light.cd_led"] in ha_calls()[n0:]), ha_calls()[n0:])
pgD.wait_for_timeout(800)
bx = row_box("light.cd_lamp")
cd0 = len(json.load(urllib.request.urlopen(HA + "/_calldata")))
pgD.mouse.move(bx["x"] + bx["w"] * 0.2, bx["y"] + bx["h"] / 2); pgD.mouse.down()
for k in range(1, 9):
    pgD.mouse.move(bx["x"] + bx["w"] * (0.2 + k * 0.08), bx["y"] + bx["h"] / 2); pgD.wait_for_timeout(30)
during = pgD.evaluate("document.querySelector('#roomPanel .rpLight[data-e=\"light.cd_lamp\"] .v').textContent")
pgD.mouse.up()
dimmed = lambda: [c for c in json.load(urllib.request.urlopen(HA + "/_calldata"))[cd0:] if c[1] == "light.cd_lamp" and c[0] == "turn_on" and "brightness_pct" in (c[2] or {})]
check("room card: dragging a lamp's row sideways shows and sends the brightness where the finger let go",
      wait_cd(pgD, lambda: bool(dimmed())) and 75 <= dimmed()[-1][2]["brightness_pct"] <= 95 and during.endswith("%"), (during, dimmed()))
pgD.locator("#roomPanel .rpLight[data-e=\"light.cd_lamp\"] .rp-more").click(); pgD.wait_for_timeout(400)
check("room card: 🎨 unfolds the colours of the lamp below its row", pgD.locator("#roomPanel .rpLight + .rp-ctl .lightctl").count() == 1)

pgD.click("#roomPanel .rpTab[data-tab=climate]"); pgD.wait_for_timeout(600)
check("room card: 🌡 Klima shows the heating panel inside the card and the sensors as tiles",
      pgD.locator("#roomPanel #heatPanel").is_visible() and pgD.locator("#roomPanel .rpVal").count() == 2, pgD.inner_text("#roomPanel")[:300])
pgD.click("#roomPanel .rpTab[data-tab=open]"); pgD.wait_for_timeout(500)
check("room card: 🚪 Fenster lists the open window in red", pgD.locator("#roomPanel .row.alert", has_text="Fenster Karte").count() == 1, pgD.inner_text("#roomPanel")[:300])
pgD.click("#roomPanel .rp-x"); pgD.wait_for_timeout(400); pgD.evaluate("window.__fp.openRoomPanel('cd_room')"); pgD.wait_for_timeout(600)
check("room card: the tab chosen last stays when it opens again", pgD.evaluate("window.__fp.roomCard().tab") == "open")
pgD.close()

# the phone: first small, a big button opens everything at its tab, the grip makes it small again and then closes it
pgP = open_cd(viewport={"width": 390, "height": 760}, has_touch=True, is_mobile=True)
quick_cd = pgP.evaluate("[...document.querySelectorAll('#roomPanel .rpQ')].map((q) => q.dataset.q)")
check("phone: the room card comes small with big buttons (Licht, Szenen, Klima, Fenster) and no tabs",
      pgP.locator("#roomPanel.rpPeek").count() == 1 and quick_cd == ["light", "scenes", "climate", "open"] and pgP.locator("#roomPanel .rpTabs").count() == 0, quick_cd)
pgP.locator("#roomPanel .rpQ[data-q=climate]").tap(); pgP.wait_for_timeout(700)
check("phone: „Klima“ opens the whole card at its tab", pgP.locator("#roomPanel.rpFull").count() == 1 and pgP.evaluate("window.__fp.roomCard()") == {"tab": "climate", "full": True}
      and pgP.locator("#roomPanel #heatPanel").is_visible())
def drag_grip(dy):
    g = pgP.evaluate("(() => { const b = document.querySelector('#roomPanel .rpGrip').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()")
    pgP.mouse.move(g["x"], g["y"]); pgP.mouse.down()
    for k in range(1, 7): pgP.mouse.move(g["x"], g["y"] + dy * k / 6); pgP.wait_for_timeout(20)
    pgP.mouse.up(); pgP.wait_for_timeout(700)
drag_grip(120)
check("phone: the grip pulled down makes the card small again", pgP.locator("#roomPanel.rpPeek").count() == 1 and pgP.locator("#roomPanel").is_visible())
drag_grip(120)
check("phone: pulled down once more it closes", pgP.locator("#roomPanel").is_hidden())
check("room card: no errors on the page", not own_cd, own_cd)
pgP.close()
extra_cd({})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_cd).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("language", st_cd.get("language", "en")); set_setting("units", st_cd.get("units", "metric"))
