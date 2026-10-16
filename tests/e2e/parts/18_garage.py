"""Vehicles, workshop, garage and carport (garage.js): the three new library groups with previews, the search, a car in car paint whose head and
tail lights follow its entity, the real size of a motorhome, a workshop lamp that lights up, the side profiles drawn without errors.
"""
pgG = b.new_page(viewport={"width": 1500, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgG.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgG.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgG.goto(BASE + "?debug=1&mode=edit"); pgG.wait_for_timeout(1500)
# --- the library: three new groups, every piece with a preview; the search finds them by their everyday names
pgG.click("button[data-tool=device]"); pgG.wait_for_timeout(400)
cats = pgG.locator("#paletteCats button").all_inner_texts()
check("garage: the library has the groups vehicles, workshop and garage & carport", all(c in cats for c in ("Vehicles", "Workshop", "Garage & carport")), cats)
counts = {}
for c in ("Vehicles", "Workshop", "Garage & carport"):
    pgG.evaluate(f"() => [...document.querySelectorAll('#paletteCats button')].find((b) => b.textContent === {c!r})?.click()"); pgG.wait_for_timeout(300)
    counts[c] = (pgG.locator("#paletteGrid button.dev").count(), pgG.locator("#paletteGrid button.dev img").count(), pgG.locator("#paletteGrid button.dev").all_inner_texts())
check("garage: vehicles (19), workshop (23) and garage & carport (14), each with its preview",
      [v[:2] for v in counts.values()] == [(19, 19), (23, 23), (14, 14)] and "Motorhome" in counts["Vehicles"][2] and "Car lift" in counts["Workshop"][2]
      and "Double carport" in counts["Garage & carport"][2], {k: v[:2] for k, v in counts.items()})
pgG.evaluate("() => [...document.querySelectorAll('#paletteCats button')][0].click()"); pgG.wait_for_timeout(200)
pgG.fill("#paletteSearch", "wohnmobil"); pgG.wait_for_timeout(200)
found = pgG.locator("#paletteGrid button.dev").all_inner_texts()
check("garage: 'wohnmobil' finds the camper van and both motorhomes", sorted(found) == ["Camper van", "Motorhome", "Motorhome with alcove"], found)
pgG.fill("#paletteSearch", "hebebühne"); pgG.wait_for_timeout(200)
check("garage: 'hebebühne' finds the car lift", pgG.locator("#paletteGrid button.dev").all_inner_texts() == ["Car lift"], pgG.inner_text("#paletteGrid"))
pgG.fill("#paletteSearch", ""); pgG.wait_for_timeout(200)
pgG.click("button[data-tool=select]"); pgG.wait_for_timeout(200)
# --- a car: car paint in the side panel, head and tail lights follow its entity
pgG.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'gaCar', type: 'car_estate', x: 60, z: 70, y: 0, rot: 0, scale: 1, name: 'Kombi', entity: 'switch.garage'});
  window.__fp.fakeState('switch.garage', 'off'); window.__fp.rebuild(); window.__fp.select('device', 'gaCar'); }""")
pgG.wait_for_timeout(400)
fin = "() => window.__fp.layout.floors[window.__fp.floorIdx()].devices.find((v) => v.id === 'gaCar').finish ?? null"
opts = pgG.locator("#devFinish option").all_inner_texts()
check("garage: an estate car offers car paint, grey to start with", opts == ["Grey", "Silver", "White", "Black", "Red", "Blue", "Green"] and pgG.input_value("#devFinish") == "cargrey", opts)
pgG.select_option("#devFinish", "carblue"); pgG.wait_for_timeout(400)
check("garage: blue is stored and the car is built in it", pgG.evaluate(fin) == "carblue", pgG.evaluate(fin))
off = pgG.evaluate("window.__fp.glowColors('gaCar')")
pgG.evaluate("window.__fp.fakeState('switch.garage', 'on'); window.__fp.applyStates()"); pgG.wait_for_timeout(300)
on = pgG.evaluate("window.__fp.glowColors('gaCar')")
check("garage: the lights are dark while its entity is off; on, the headlights glow white and the tail lights red", off == [None, None] and on == ["#fff4d6", "#ff2b22"], (off, on))
pose = pgG.evaluate("window.__fp.devPose('gaCar')")
check("garage: the estate car is drawn in its real size (1.83 m body, 4.8 m long, 1.5 m high)", pose and 1.8 < pose["size"][0] < 2.0 and 4.75 < pose["size"][1] < 4.85 and 1.45 < pose["h"] < 1.6, pose)
pgG.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => v.id !== 'gaCar'); window.__fp.rebuild(); }")
# --- a motorhome and a workshop lamp
pgG.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'gaHome', type: 'motorhome', x: 60, z: 75, y: 0, rot: 0, scale: 1, name: 'Wohnmobil', entity: ''},
                 {id: 'gaLamp', type: 'work_lamp', x: 62, z: 70, y: 2.1, rot: 0, scale: 1, name: 'Werkstatt', entity: 'light.wohnzimmer'});
  window.__fp.fakeState('light.wohnzimmer', 'off'); window.__fp.rebuild(); }""")
pgG.wait_for_timeout(400)
home = pgG.evaluate("window.__fp.devPose('gaHome')")
check("garage: the motorhome is 7 m long, wider than its cab and nearly 3 m high", home and 6.9 < home["size"][1] < 7.1 and 2.4 < home["size"][0] < 2.6 and 2.85 < home["h"] < 3.05, home)
lamp_off = pgG.evaluate("window.__fp.glowColors('gaLamp')")
pgG.evaluate("window.__fp.fakeState('light.wohnzimmer', 'on'); window.__fp.applyStates()"); pgG.wait_for_timeout(300)
lamp_on = pgG.evaluate("window.__fp.glowColors('gaLamp')")
check("garage: the workshop lamp is dark while off and glows while on", lamp_off == [None] and len(lamp_on) == 1 and lamp_on[0] is not None, (lamp_off, lamp_on))
pgG.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => !['gaHome', 'gaLamp'].includes(v.id)); window.__fp.rebuild(); }")
bad = [e for e in own if "favicon" not in e]
check("garage: no console errors", not bad, bad)
pgG.close()
