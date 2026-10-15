"""The power bookkeeping (#378, #379): the tab "⚡ Rechnung" of the power editor (grid, solar, battery, house, rooms, checks) and the power overview.
"""
saved_energy = api_admin("api/layout")            # put back at the end: the parts after this one get the house as base.py left it
lang_before = api("api/settings")["language"]
set_setting("language", "de")                    # the checks read the German texts
pgN = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgN.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgN.goto(BASE + "?debug=1&mode=edit"); pgN.wait_for_timeout(1500)
FAKE = {"sensor.e_pv": ("3000", "W"), "sensor.e_netz": ("-1000", "W"), "sensor.e_soc": ("76", "%"), "sensor.e_akku": ("600", "W")}
def fake(**vals):
    """the stand-in sensors (a periodic refresh of all states can wipe them: set them again before every look)"""
    FAKE.update({f"sensor.e_{k}": (str(v), "W") for k, v in vals.items()})
    pgN.evaluate("(f) => { Object.entries(f).forEach(([e, [s, u]]) => window.__fp.fakeState(e, s, u)); window.__fp.applyStates(); }", FAKE)
    pgN.wait_for_timeout(250)
energy = lambda: pgN.evaluate("window.__fp.energy()")
cfg = lambda: pgN.evaluate("window.__fp.layout.energy || {}")
pgN.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  const dv = (id, type, x, extra) => ({id, type, x, z: 51, y: 0, rot: 0, scale: 1, name: id, entity: '', ...extra});
  f.rooms.push({id: 'en_k', name: 'Küche-E', color: '#888', points: [[50,50],[54,50],[54,53],[50,53]]}, {id: 'en_b', name: 'Bad-E', color: '#888', points: [[55,50],[57,50],[57,53],[55,53]]});
  f.devices.push(dv('en_wr', 'inverter', 51, {entity: 'sensor.e_pv'}), dv('en_z', 'powermeter', 52, {entity: 'sensor.e_netz'}),
                 dv('en_bat', 'battery', 53, {entity: 'sensor.e_soc', batPower: 'sensor.e_akku'}), dv('en_wm', 'washer', 51.5, {entity: 'sensor.leistung'}));
  window.__fp.rebuild(); }""")
fake()

# --- #379: the battery is part of the consumption (3000 W solar - 1000 W fed in - 600 W into the battery = 1400 W)
e = energy()
check("#379: the consumption counts the battery: production - fed in - charging", e["load"] == 1400 and e["counted"] == 600, (e["load"], e["counted"]))
fake()
check("#379: the overview at the top left shows it", "⌂ 1.40 kW" in pgN.inner_text("#energyPill"), pgN.inner_text("#energyPill"))

# --- the tab: in the power editor only, the calculation live at the top
check("#378: the button '⚡ Rechnung' is hidden outside the power editor", not pgN.is_visible("#energyBtn"))
pgN.click("#powerEditBtn"); pgN.wait_for_timeout(400)
check("#378: in the power editor the button '⚡ Rechnung' shows next to 'Kabel'", pgN.is_visible("#energyBtn") and pgN.is_visible("#cableBtn"))
pgN.click("#energyBtn"); pgN.wait_for_timeout(500)
fake()
res = pgN.inner_text("#energyResult")
check("#378: the window opens with the calculation: production, fed in, battery, = consumption, and that it adds up",
      pgN.is_visible("#energyDialog") and "Einspeisung ins Netz" in res and "Batterie lädt" in res and "Hausverbrauch (berechnet)" in res and "1.40 kW" in res and pgN.locator("#energyResult .enOk").count() == 1, res)
check("#378: the parts that are not set come from the plan, with their device", "Automatisch aus dem Plan: en_z (sensor.e_netz)" in pgN.inner_text("#energyBody"), pgN.inner_text("#energyBody")[:600])

# --- a meter that counts the other way round: a warning with a button that turns the sign round
fake(pv=500, netz=-1500, akku=0)
warn = pgN.locator("#energyResult .enWarn[data-code=negative]")
check("#378: a consumption below zero gives a warning with the button 'Vorzeichen am Netz umdrehen'", warn.count() == 1 and warn.locator("button[data-fix=grid]").count() == 1, pgN.inner_text("#energyResult"))
warn.locator("button[data-fix=grid]").click(); pgN.wait_for_timeout(300)
fake()
check("#378: one click turns the sign round, saved with the house, and it adds up again",
      cfg().get("grid", {}).get("invert") is True and energy()["load"] == 2000 and pgN.locator("#energyResult .enWarn").count() == 0 and pgN.is_checked("#enGridInvert"), (cfg(), energy()["load"]))
pgN.uncheck("#enGridInvert"); pgN.wait_for_timeout(300)
check("#378: the tick turns it back", not cfg().get("grid", {}).get("invert"))
fake(pv=3000, netz=-1000, akku=600)

# --- the battery: left out for a hybrid inverter
pgN.uncheck("#enBatBalance"); pgN.wait_for_timeout(300)
fake()
check("#378: 'Batterie im Hausverbrauch mitrechnen' off: the battery is left out (hybrid inverter)", cfg()["battery"]["balance"] is False and energy()["load"] == 2000 and "nicht mitgerechnet" in pgN.inner_text("#energyResult"), (cfg(), energy()["load"]))
pgN.check("#enBatBalance"); pgN.wait_for_timeout(300)
check("#378: on again, it counts", "balance" not in cfg().get("battery", {}) and energy()["load"] == 1400, cfg())

# --- the grid with two sensors
pgN.select_option("#enGridMode", "two"); pgN.wait_for_timeout(300)
check("#378: 'Zwei Sensoren' shows a picker for drawn and one for fed in", cfg()["grid"].get("split") is True and "Bezug aus dem Netz" in pgN.inner_text("#energyBody") and "Einspeisung ins Netz" in pgN.inner_text("#energyBody") and not pgN.is_visible("#enGridInvert"), cfg())
pgN.select_option("#enGridMode", "one"); pgN.wait_for_timeout(300)

# --- a sensor of the house's own consumption: shown, the calculation compared with it
pgN.fill("#enHouse input", "Leistung Waschmaschine"); pgN.press("#enHouse input", "Enter"); pgN.wait_for_timeout(400)
fake()
e = energy()
check("#378: a house sensor is picked in the window and its value is shown, the calculation stays as the check",
      cfg().get("house", {}).get("entity") == "sensor.leistung" and e["measured"] is not None and round(e["load"]) == round(e["measured"]) and e["calc"] == 1400, (cfg(), e["load"], e["calc"]))
check("#378: measured and calculated far apart: a warning", pgN.locator("#energyResult .enWarn[data-code=differs]").count() == 1, pgN.inner_text("#energyResult"))
check("#378: the overview says the consumption is measured", "Verbrauch (gemessen)" in (pgN.get_attribute("#energyPill", "title") or ""), pgN.get_attribute("#energyPill", "title"))
pgN.evaluate("() => { delete window.__fp.layout.energy.house; window.__fp.applyStates(); }")

# --- the rooms: suggest from what is placed in them, the rest
pgN.click("#enSuggest"); pgN.wait_for_timeout(400)
fake()
rooms = cfg().get("rooms", {})
check("#378: 'Vorschlagen' takes the sensor in watts placed in the room", rooms.get("en_k") == ["sensor.leistung"] and "en_b" not in rooms, rooms)
chips = pgN.locator("#energyBody .enRoom[data-room=en_k] .enChip")
check("#378: the room shows the sensor with its value", chips.count() == 1 and "Leistung Waschmaschine" in chips.first.inner_text(), chips.count())
res = pgN.inner_text("#energyResult")
check("#378: the calculation lists the room and the rest", "↳ Küche-E" in res and "Rest (keinem Raum zugeordnet)" in res, res)
fake()
check("#378: the overview's tooltip lists the rooms and the rest", "Räume: Küche-E" in (pgN.get_attribute("#energyPill", "title") or "") and "Rest:" in (pgN.get_attribute("#energyPill", "title") or ""), pgN.get_attribute("#energyPill", "title"))
chips.first.locator("button").click(); pgN.wait_for_timeout(300)
check("#378: × takes the sensor out of the room again", "en_k" not in cfg().get("rooms", {}), cfg())

# --- closing, and the live view counts with the settings
pgN.click("#energyClose"); pgN.wait_for_timeout(300)
check("#378: ✕ closes the window", not pgN.is_visible("#energyDialog"))
pgN.evaluate("() => { window.__fp.layout.energy = { grid: { invert: true } }; }")   # a meter that counts the other way round
pgN.click("#modeSwitch button[data-mode=live]"); pgN.wait_for_timeout(600)
fake(pv=500, netz=-300, akku=0)
check("#378: in the live view the overview counts with what the tab set (sign turned: 300 W drawn)", energy()["grid"] == 300 and "⌂ 800 W" in pgN.inner_text("#energyPill"), pgN.inner_text("#energyPill"))
pgN.close()
api_admin_put = lambda l: urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(l).encode(), method="PUT", headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
time.sleep(2.5)                                    # after the page's last autosave
api_admin_put(saved_energy)
set_setting("language", lang_before)
