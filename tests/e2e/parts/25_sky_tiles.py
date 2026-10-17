"""3.98.0: the sky of the hour and the weather (#418, #419), the rain warning per window (#419), the energy flow as a picture (#420), the
room tiles in live mode (#421) and the tool bar with icons and groups (#422).
"""
saved_st = api_admin("api/layout")              # put back at the end
theme_st, lang_st, units_st = api("api/settings")["theme"], api("api/settings")["language"], api("api/settings")["units"]
set_setting("theme", "dark")                    # base.py uses the hologram, which keeps its own backdrop: no sky there
set_setting("language", "de")                   # the texts below are the German ones
set_setting("units", "metric")                  # ... and the temperature in °C
def extra(d):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(d).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def W(v):
    return {"state": str(v), "attributes": {"unit_of_measurement": "W", "device_class": "power"}}
extra({
    "sun.sun": {"state": "below_horizon", "attributes": {"elevation": -20, "rising": False, "next_rising": "2030-01-02T07:12:00+00:00", "next_setting": "2030-01-01T16:20:00+00:00"}},
    "weather.home": {"state": "rainy", "attributes": {"friendly_name": "Home", "temperature": 11.4, "temperature_unit": "°C", "wind_speed": 23.6, "wind_speed_unit": "km/h"}},
    "light.kachel": {"state": "on", "attributes": {"friendly_name": "Kachellicht", "rgb_color": [255, 120, 40]}},
    "sensor.kachel_temp": {"state": "22.4", "attributes": {"friendly_name": "Kacheltemperatur", "unit_of_measurement": "°C", "device_class": "temperature"}},
    "binary_sensor.kachel_praesenz": {"state": "on", "attributes": {"friendly_name": "Kachelpräsenz", "device_class": "occupancy"}},
    "binary_sensor.fenster_kr": {"state": "on", "attributes": {"friendly_name": "Kachelfenster", "device_class": "window"}},
    "sensor.netz": W(450), "sensor.pv": W(3200), "sensor.bat_power": W(600),
    "sensor.bat_level": {"state": "82", "attributes": {"unit_of_measurement": "%", "device_class": "battery"}},
})
# a room of its own far from the test house: a light, a temperature, somebody there and an open window in its wall; the energy settings
lay = json.loads(json.dumps(saved_st))
f0 = lay["floors"][0]
f0.setdefault("rooms", []).append({"id": "kr_room", "name": "Kachelraum", "color": "#8a7f70", "points": [[30, 30], [34, 30], [34, 34], [30, 34]]})
f0.setdefault("walls", []).append({"id": "kr_wall", "a": [30, 30], "b": [34, 30], "thickness": 0.2, "height": 2.6,
    "openings": [{"id": "kr_win", "type": "window", "style": "window", "width": 1.2, "height": 1.2, "sill": 0.9, "pos": 2, "entity": "binary_sensor.fenster_kr", "name": "Kachelfenster"}]})
f0.setdefault("devices", []).extend([
    {"id": "kr_light", "type": "light", "x": 32, "z": 32, "y": 2.5, "rot": 0, "scale": 1, "name": "Kachellicht", "entity": "light.kachel"},
    {"id": "kr_temp", "type": "sensor", "x": 31, "z": 31, "y": 1.5, "rot": 0, "scale": 1, "name": "Kacheltemperatur", "entity": "sensor.kachel_temp"},
    {"id": "kr_pres", "type": "presence", "x": 33, "z": 33, "y": 0, "rot": 0, "scale": 1, "name": "Kachelpräsenz", "entity": "binary_sensor.kachel_praesenz"}])
lay["energy"] = {"grid": {"entity": "sensor.netz"}, "solar": {"entities": ["sensor.pv"]}, "battery": {"entity": "sensor.bat_power", "level": "sensor.bat_level"}}
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
pgS = b.new_page(viewport={"width": 1440, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgS.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgS.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgS.goto(BASE + "?debug=1&mode=live"); pgS.wait_for_timeout(2200)
pgS.evaluate("window.__fp.switchFloor(0)"); pgS.wait_for_timeout(800)   # the floor with the new room (the page may open another one)

# --- the sky (#418) and the weather (#419)
bg = pgS.evaluate("document.querySelector('#view').style.background")
chips = pgS.inner_text("#skyChips") if pgS.is_visible("#skyChips") else ""
check("sky (#418): a gradient with stars behind the 3D view instead of one colour, from sun.sun",
      "linear-gradient" in bg and "url(" in bg and pgS.evaluate("window.__fp.scene.background === null"), bg[:120])
check("sky: the chip at the top right says night and the next sunrise", "Nacht" in chips and "Sonnenaufgang" in chips, chips)
check("weather (#419): the second chip has the weather, its temperature and the wind", "Regen · 11 °C · Wind 24 km/h" in chips, chips)
check("weather: rain falls over the picture in live mode", pgS.is_visible("#wxFall") and "rain" in pgS.get_attribute("#wxFall", "class"), pgS.get_attribute("#wxFall", "class"))

# --- the energy flow as a picture (#420)
card = pgS.inner_text("#energyCard") if pgS.is_visible("#energyCard") else ""
check("energy picture (#420): the card is there with sun, grid, house and battery; the line of numbers steps aside",
      all(x in card for x in ("3.20 kW", "450 W", "3.05 kW", "82 %")) and not pgS.is_visible("#energyPill"), card)
check("energy picture: dots run on the three lines that carry power (sun to house and battery, grid to house)",
      pgS.locator("#energyCard .ef-dots").count() == 3, pgS.locator("#energyCard .ef-dots").count())
shown0 = pgS.evaluate("window.__fp.powerInfo().shown")
pgS.click("#energyCard"); pgS.wait_for_timeout(400)
check("energy picture: a tap shows or hides the power cables like the line of numbers", pgS.evaluate("window.__fp.powerInfo().shown") != shown0)
pgS.click("#energyCard"); pgS.wait_for_timeout(300)

# --- the room tiles (#421)
tile = pgS.locator("#roomTiles [data-room=kr_room]")
txt = tile.inner_text() if tile.count() else ""
check("room tiles (#421): a card per room; the new room with its temperature, the light on, the open window and somebody there",
      pgS.is_visible("#roomTiles") and "Kachelraum" in txt and "22,4°" in txt and "1 an" in txt and "offen" in txt and "👤" in txt, txt)
check("room tiles: a lit room has the light's colour at its edge", "lit" in (tile.get_attribute("class") or "") and "#ff7828" in (tile.get_attribute("style") or ""), tile.get_attribute("style"))
tile.click(); pgS.wait_for_timeout(900)
check("room tiles: a tap flies to the room and opens its room card", pgS.evaluate("window.__fp.focusedRoom()") == "kr_room" and pgS.is_visible("#roomPanel"))
pgS.locator("#roomTiles [data-room=kr_room]").click(); pgS.wait_for_timeout(700)
check("room tiles: a second tap goes back", pgS.evaluate("window.__fp.focusedRoom()") is None)
view_menu(pgS); pgS.click("#tilesToggle"); pgS.wait_for_timeout(500)
check("room tiles: 'Raum-Kacheln' in the View menu switches them off (and is saved)", not pgS.is_visible("#roomTiles") and api("api/settings")["roomTiles"] is False)
view_menu(pgS); pgS.click("#tilesToggle"); pgS.wait_for_timeout(500)
check("room tiles: and on again", pgS.is_visible("#roomTiles") and api("api/settings")["roomTiles"] is True)

# --- the rain warning per window (#419)
rain = lambda: [a["entity"] for a in pgS.evaluate("window.__fp.alerts()") if a["kind"] == "rain"]
check("rain warning: the open window warns while it rains", "binary_sensor.fenster_kr" in rain(), rain())
pgS.click("#modeSwitch [data-mode=edit]"); pgS.wait_for_timeout(600)
check("edit mode: no sky chips, no rain, no room tiles; the energy picture stays instead of the line of numbers (3.98.1)",
      not pgS.is_visible("#skyChips") and not pgS.is_visible("#wxFall") and not pgS.is_visible("#roomTiles")
      and pgS.is_visible("#energyCard") and not pgS.is_visible("#energyPill"))
pgS.evaluate("window.__fp.select('opening', 'kr_win')"); pgS.wait_for_timeout(400)
check("rain warning: the window has the tick 'Bei Regen warnen', ticked", pgS.is_visible("#openRainWarn") and pgS.is_checked("#openRainWarn"))
pgS.uncheck("#openRainWarn"); pgS.wait_for_timeout(2500)
win = next(o for w in api_admin("api/layout")["floors"][0]["walls"] for o in w.get("openings", []) if o.get("id") == "kr_win")
check("rain warning: without the tick this window does not warn, saved as rainWarn false", "binary_sensor.fenster_kr" not in rain() and win.get("rainWarn") is False, (rain(), win))

# --- the tool bar with icons and groups (#422)
tools = pgS.evaluate("""() => [...document.querySelectorAll('#tools > button')].filter((b) => b.offsetParent && b.id !== 'toolsEditBtn')
  .map((b) => ({ id: b.dataset.tool || b.id, icon: !!b.querySelector('svg.tIcon'), cap: b.dataset.cap || '', text: b.textContent.trim() }))""")
caps = [(t["id"], t["cap"]) for t in tools if t["cap"]]
check("tool bar (#422): every tool has an icon and its name", tools and all(t["icon"] and t["text"] for t in tools), tools)
check("tool bar: groups with captions Zeichnen, Setzen, Werkzeuge", caps == [("wall", "Zeichnen"), ("opening", "Setzen"), ("measure", "Werkzeuge")], caps)
check("tool bar: short names under the icons, the roof with the drawing tools",
      any(t["text"] == "Erkennen" for t in tools) and [t["id"] for t in tools].index("dormerBtn") == [t["id"] for t in tools].index("hole") + 1, [t["id"] for t in tools])
pgS.click("#tools button[data-tool=stairs]"); pgS.wait_for_timeout(200)
check("tool bar: a tap picks the tool", pgS.evaluate("document.body.dataset.tool") == "stairs" and "active" in pgS.get_attribute("#tools button[data-tool=stairs]", "class"))
pgS.click("#tools button[data-tool=select]"); pgS.wait_for_timeout(200)
pgS.click("#toolsEditBtn"); pgS.wait_for_timeout(300)
names = pgS.evaluate("[...document.querySelectorAll('#toolsList .tbName')].map((e) => e.textContent)")
check("tool bar: the customise dialog keeps the full names", "Räume erkennen" in names and "Strom-Editor" in names, names)
pgS.keyboard.press("Escape"); pgS.wait_for_timeout(200)

# --- the sky can be switched off; phones keep the line of numbers
set_setting("sky", "off")
pgS.goto(BASE + "?debug=1&mode=live"); pgS.wait_for_timeout(1800)
check("sky: 'Einfarbig' in the settings gives the plain background back", pgS.evaluate("document.querySelector('#view').style.background") == ""
      and pgS.evaluate("window.__fp.scene.background !== null") and not pgS.is_visible("#skyChips"))
set_setting("sky", "time")
pgP = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, extra_http_headers={"X-Remote-User-Name": "admin"})
pgP.goto(BASE + "?debug=1&mode=live"); pgP.wait_for_timeout(2000)
pgP.evaluate("window.__fp.switchFloor(0)"); pgP.wait_for_timeout(800)
seen = [pgP.is_visible(s) for s in ("#energyCard", "#skyChips", "#roomTiles")]
check("phone: no energy card and no sky chips (no room for them), the room tiles are there", seen == [False, False, True], seen)
pgP.close()
check("3.98 checks: no errors in the browser", not own, own[:3])
pgS.close()
extra({})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_st).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("theme", theme_st)
set_setting("language", lang_st)
set_setting("units", units_st)
