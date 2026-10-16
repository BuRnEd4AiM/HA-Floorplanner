"""Sauna, fitness, bar, cinema, PC and LED mirrors (leisure.js): the new library groups, a placed sauna that glows while it heats, the monitor layouts of the PC desk, the LED zones of the mirrors (side panel, 3D, live card).
"""
# --- the library: four new groups, the search finds the pieces by their everyday names
pgL = b.new_page(viewport={"width": 1500, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgL.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgL.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgL.goto(BASE + "?debug=1&mode=edit"); pgL.wait_for_timeout(1500)
pgL.click("button[data-tool=device]"); pgL.wait_for_timeout(400)
cats = pgL.evaluate("[...document.querySelectorAll('#paletteCats button')].map((b) => b.textContent)")
check("leisure pieces: the library has the groups sauna & wellness, fitness, bar and home cinema", all(c in cats for c in ("Sauna & wellness", "Fitness", "Bar", "Home cinema")), cats)
counts = {}
for c in ("Sauna & wellness", "Fitness", "Bar", "Home cinema"):
    pgL.evaluate("(c) => [...document.querySelectorAll('#paletteCats button')].find((b) => b.textContent === c).click()", c); pgL.wait_for_timeout(200)
    counts[c] = [pgL.locator("#paletteGrid button.dev").count(), pgL.locator("#paletteGrid button.dev img").count()]
check("leisure pieces: each group shows its pieces with previews", counts == {"Sauna & wellness": [9, 9], "Fitness": [16, 16], "Bar": [13, 13], "Home cinema": [10, 10]}, counts)
pgL.evaluate("() => [...document.querySelectorAll('#paletteCats button')][0].click()"); pgL.wait_for_timeout(200)
pgL.fill("#paletteSearch", "beamer"); pgL.wait_for_timeout(200)
found = pgL.locator("#paletteGrid button.dev").all_inner_texts()
check("leisure pieces: 'beamer' finds the projector and the two screens", sorted(found) == ["Fixed frame screen", "Motorised screen", "Projector (ceiling)"], found)
pgL.fill("#paletteSearch", "zonen"); pgL.wait_for_timeout(200)
check("leisure pieces: 'zonen' finds the LED mirror with 3 zones", pgL.locator("#paletteGrid button.dev").all_inner_texts() == ["LED mirror with 3 zones"], pgL.inner_text("#paletteGrid"))
pgL.fill("#paletteSearch", ""); pgL.wait_for_timeout(200)
pgL.click("button[data-tool=select]"); pgL.wait_for_timeout(200)
# --- a sauna: its finish, its stones glow orange while its entity is on
pgL.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'lsSauna', type: 'sauna_cabin', x: 60, z: 60, y: 0, rot: 0, scale: 1, name: 'Sauna', entity: 'switch.sauna_test'}); window.__fp.rebuild(); window.__fp.select('device', 'lsSauna'); }""")
pgL.wait_for_timeout(400)
fin = "() => { let f = null; window.__fp.scene.traverse((o) => { if (o.userData.kind === 'device' && o.userData.id === 'lsSauna' && o.userData.finish) f = o.userData.finish; }); return f; }"
check("sauna: placed in spruce, the side panel offers spruce, hemlock, cedar and thermowood", pgL.evaluate(fin) == "spruce" and pgL.locator("#devFinish option").all_inner_texts() == ["Spruce", "Hemlock", "Cedar", "Thermowood"], pgL.locator("#devFinish option").all_inner_texts())
pgL.select_option("#devFinish", "thermo"); pgL.wait_for_timeout(400)
check("sauna: thermowood is stored and the cabin is built in it", pgL.evaluate(fin) == "thermo", pgL.evaluate(fin))
off = pgL.evaluate("window.__fp.glowColors('lsSauna')")
pgL.evaluate("window.__fp.fakeState('switch.sauna_test', 'on'); window.__fp.applyStates()"); pgL.wait_for_timeout(300)
on = pgL.evaluate("window.__fp.glowColors('lsSauna')")
check("sauna: dark while off; on, the light glows warm and the stones orange", all(c is None for c in off) and "#ff5a1f" in on and "#ffd27a" in on, (off, on))
pgL.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => v.id !== 'lsSauna'); window.__fp.rebuild(); }")
# --- the gaming PC desk: its monitor layout is chosen in the side panel and the desk is built (and drawn in the plan) in it
pgL.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'lsPc', type: 'pc_setup', x: 62, z: 60, y: 0, rot: 0, scale: 1, name: 'PC', entity: ''}); window.__fp.rebuild(); window.__fp.select('device', 'lsPc'); }""")
pgL.wait_for_timeout(400)
var = "() => { let v = null; window.__fp.scene.traverse((o) => { if (o.userData.kind === 'device' && o.userData.id === 'lsPc' && o.userData.variant) v = o.userData.variant; }); return v; }"
opts = pgL.locator("#devVariant option").all_inner_texts()
check("PC desk: the side panel offers the monitor layouts, two side by side to start with",
      opts == ["2 monitors side by side", "1 monitor", "3 monitors side by side", "4 monitors (2 × 2)", "Curved monitor", "Curved + 2 portrait"] and pgL.input_value("#devVariant") == "two" and pgL.evaluate(var) == "two", (opts, pgL.evaluate(var)))
pgL.select_option("#devVariant", "curved2"); pgL.wait_for_timeout(400)
dev = "() => window.__fp.layout.floors[window.__fp.floorIdx()].devices.find((v) => v.id === 'lsPc').variant"
check("PC desk: a curved monitor with two upright ones is stored and built", pgL.evaluate(dev) == "curved2" and pgL.evaluate(var) == "curved2", (pgL.evaluate(dev), pgL.evaluate(var)))
pgL.select_option("#devVariant", "two"); pgL.wait_for_timeout(400)
check("PC desk: back to two monitors removes the choice from the piece", pgL.evaluate(dev) is None and pgL.evaluate(var) == "two", pgL.evaluate(dev))
pgL.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => v.id !== 'lsPc'); window.__fp.rebuild(); }")
# --- the big mirrors have two LED zones: behind and in front
pgL.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'lsBig', type: 'mirror_gym', x: 63, z: 60, y: 0.3, rot: 0, scale: 1, name: 'Spiegelwand', entity: ''}); window.__fp.rebuild(); window.__fp.select('device', 'lsBig'); }""")
pgL.wait_for_timeout(400)
heads = pgL.locator("#propsBody .ringSec[data-zone] .ringSecHead b").all_inner_texts()
check("big mirror: two LED zones in the side panel, behind and in front", heads == ["Behind (indirect)", "Front"] and len(pgL.evaluate("window.__fp.ringGlow('lsBig')")) == 2, heads)
pgL.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => v.id !== 'lsBig'); window.__fp.rebuild(); }")
# --- a mirror with 3 LED zones: one field per zone, empty zones follow the device, a zone with its own light shines on its own
pgL.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'lsMir', type: 'mirror_led_zones', x: 61, z: 60, y: 1.1, rot: 0, scale: 1, name: 'Spiegel', entity: 'light.ls_spiegel'});
  window.__fp.fakeState('light.ls_spiegel', 'on'); window.__fp.rebuild(); window.__fp.select('device', 'lsMir'); }""")
pgL.wait_for_timeout(400)
heads = pgL.locator("#propsBody .ringSec[data-zone] .ringSecHead b").all_inner_texts()
check("LED zones: the side panel has a field for each zone of the mirror", heads == ["Behind (indirect)", "Front", "Below"], heads)
check("LED zones: without their own lights all zones follow the mirror's light (on)", pgL.evaluate("window.__fp.ringGlow('lsMir')") == [True, True, True], pgL.evaluate("window.__fp.ringGlow('lsMir')"))
pgL.fill(".ringSec[data-zone='2'] input[type=search]", "garage"); pgL.keyboard.press("Enter"); pgL.wait_for_timeout(400)
leds = pgL.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].devices.find((v) => v.id === 'lsMir').leds")
check("LED zones: picking a light for the zone below stores it, the zones before it stay empty", leds == ["", "", "switch.garage"], leds)
pgL.evaluate("window.__fp.fakeState('switch.garage', 'off'); window.__fp.applyStates()"); pgL.wait_for_timeout(300)
check("LED zones: the zone below follows its own switch (off), the others the mirror's light (on)", pgL.evaluate("window.__fp.ringGlow('lsMir')") == [True, True, False], pgL.evaluate("window.__fp.ringGlow('lsMir')"))
pgL.click("#modeSwitch button[data-mode=live]"); pgL.wait_for_timeout(500)
pgL.evaluate("window.__fp.liveTap('lsMir')"); pgL.wait_for_timeout(400)
btns = pgL.locator("#livePopup .ringSegs button").all_inner_texts()
check("LED zones: the live card has a button per zone and counts the lit ones", btns == ["Behind (indirect)", "Front", "Below"] and "2 of 3 LED zones on" in pgL.inner_text("#livePopup"), (btns, pgL.inner_text("#livePopup")))
pgL.locator("#livePopup .ringSegs button", has_text="Below").click(); pgL.wait_for_timeout(300)
before = len(ha_calls())
pgL.locator("#livePopup").get_by_role("button", name="On", exact=True).click(); pgL.wait_for_timeout(500)
calls = ha_calls()[before:]
check("LED zones: the zone's own card switches its own light", "Below" in pgL.locator("#livePopup h4").first.inner_text() and ["switch", "turn_on", "switch.garage"] in calls, calls)
pgL.click("#modeSwitch button[data-mode=edit]"); pgL.wait_for_timeout(400)
pgL.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => v.id !== 'lsMir'); window.__fp.rebuild(); }")
bad = [e for e in own if "favicon" not in e]
check("leisure pieces: no console errors", not bad, bad)
pgL.close()
