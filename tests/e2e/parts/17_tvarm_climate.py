"""Wall TV on a swivel arm (tvmount.js) and the air conditioners and fans (leisure.js): the library group, the arm's size, swing, distance and
tilt in the side panel (stored, built, the TV's backlight), an air conditioner's outlet that shows cooling and heating, the ceiling fan's light.
"""
pgT = b.new_page(viewport={"width": 1500, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgT.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgT.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgT.goto(BASE + "?debug=1&mode=edit"); pgT.wait_for_timeout(1500)
# --- the library: a group for air conditioners and fans, the search finds the TV on its arm
pgT.click("button[data-tool=device]"); pgT.wait_for_timeout(400)
pgT.evaluate("() => [...document.querySelectorAll('#paletteCats button')].find((b) => b.textContent === 'Climate & air')?.click()"); pgT.wait_for_timeout(200)
names = pgT.locator("#paletteGrid button.dev").all_inner_texts()
check("climate: the library has a group with the air conditioners, fans, the air purifier and the dehumidifier (with previews)",
      len(names) == 9 and pgT.locator("#paletteGrid button.dev img").count() == 9 and "Portable air conditioner" in names and "Ceiling fan with light" in names, names)
pgT.evaluate("() => [...document.querySelectorAll('#paletteCats button')][0].click()"); pgT.wait_for_timeout(200)
pgT.fill("#paletteSearch", "schwenkarm"); pgT.wait_for_timeout(200)
check("TV arm: 'schwenkarm' finds the wall TV on its swivel arm", pgT.locator("#paletteGrid button.dev").all_inner_texts() == ["Wall TV on swivel arm"], pgT.inner_text("#paletteGrid"))
pgT.fill("#paletteSearch", ""); pgT.wait_for_timeout(200)
pgT.click("button[data-tool=select]"); pgT.wait_for_timeout(200)
# --- the TV on its arm: size, swing, distance and tilt in the side panel
pgT.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'taTv', type: 'tv_arm', x: 60, z: 70, y: 1.2, rot: 0, scale: 1, name: 'Arm-TV', entity: '', ledEntity: 'light.wohnzimmer'}); window.__fp.rebuild(); window.__fp.select('device', 'taTv'); }""")
pgT.wait_for_timeout(400)
dev = "() => { const d = window.__fp.layout.floors[window.__fp.floorIdx()].devices.find((v) => v.id === 'taTv'); return [d.tvSize ?? null, d.armSwing ?? null, d.armReach ?? null, d.armTilt ?? null]; }"
screen = """() => { let r = null; window.__fp.scene.traverse((o) => { if (o.userData.kind === 'device' && o.userData.id === 'taTv' && o.userData.glow) {
  const g = o.userData.glow[0]; o.traverse((c) => { if (c.material === g) r = [+c.rotation.x.toFixed(3), +c.rotation.y.toFixed(3), +c.position.z.toFixed(3)]; }); } }); return r; }"""
sizes = pgT.locator("#tvSize option").all_inner_texts()
check("TV arm: the side panel offers its sizes (55 inch to start with), swing, distance and tilt, and the backlight",
      len(sizes) == 6 and pgT.input_value("#tvSize") == "55" and pgT.locator("#armSwing").count() == 1 and pgT.locator("#armReach").count() == 1 and pgT.locator("#armTilt").count() == 1
      and pgT.locator("#propsBody label", has_text="Backlight").count() >= 1, sizes)
straight = pgT.evaluate(screen)
check("TV arm: straight it hangs facing the room, its backlight shown", straight and straight[1] == 0 and pgT.evaluate("window.__fp.ledShown('taTv')") is True, straight)
pgT.fill("#armSwing", "30"); pgT.locator("#armSwing").dispatch_event("change"); pgT.wait_for_timeout(400)
sw = pgT.evaluate(screen)
check("TV arm: swung by 30 degrees, stored and the screen turns", pgT.evaluate(dev)[1] == 30 and sw and abs(sw[1] - 0.524) < 0.01, (pgT.evaluate(dev), sw))
check("TV arm: swung, the arm pulls it out further than asked and the side panel says how far", "off the wall" in pgT.inner_text("#tvArmNote") and sw[2] > straight[2] + 0.1,
      (pgT.inner_text("#tvArmNote"), straight, sw))
pgT.fill("#armTilt", "10"); pgT.locator("#armTilt").dispatch_event("change"); pgT.wait_for_timeout(400)
check("TV arm: tilted down by 10 degrees", pgT.evaluate(dev)[3] == 10 and abs(pgT.evaluate(screen)[0] - 0.175) < 0.01, pgT.evaluate(screen))
pgT.fill("#armReach", "1.31234"); pgT.locator("#armReach").dispatch_event("change"); pgT.wait_for_timeout(300)
pgT.select_option("#tvSize", "75"); pgT.wait_for_timeout(400)
check("TV arm: the distance and the size are stored", pgT.evaluate(dev) == ["75", 30, 0.4, 10], pgT.evaluate(dev))
pgT.select_option("#tvSize", "55"); pgT.wait_for_timeout(300)
for k in ("armSwing", "armTilt"):
    pgT.fill(f"#{k}", "0"); pgT.locator(f"#{k}").dispatch_event("change"); pgT.wait_for_timeout(200)
check("TV arm: back to the defaults, nothing of it is stored but the distance", pgT.evaluate(dev) == [None, None, 0.4, None], pgT.evaluate(dev))
pgT.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => v.id !== 'taTv'); window.__fp.rebuild(); }")
# --- air conditioners: the outlet shows cooling (blue) and heating (red), the display glows while it runs
pgT.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'taAc', type: 'ac_portable', x: 61, z: 70, y: 0, rot: 0, scale: 1, name: 'Klima', entity: 'switch.ac_test'},
                 {id: 'taSplit', type: 'ac_wall', x: 62, z: 70, y: 2.0, rot: 0, scale: 1, name: 'Split', entity: 'climate.ac_test'});
  window.__fp.fakeState('switch.ac_test', 'off'); window.__fp.fakeState('climate.ac_test', 'off'); window.__fp.rebuild(); }""")
pgT.wait_for_timeout(400)
check("climate: off, the outlet and the display stay dark", pgT.evaluate("window.__fp.heatGlow('taAc')") == 0 and pgT.evaluate("window.__fp.glowColors('taAc')") == [None], pgT.evaluate("window.__fp.glowColors('taAc')"))
pgT.evaluate("window.__fp.fakeState('switch.ac_test', 'on'); window.__fp.applyStates()"); pgT.wait_for_timeout(300)
check("climate: a portable air conditioner on a switch cools while on (blue outlet, lit display)",
      pgT.evaluate("window.__fp.heatGlow('taAc')") == 0.5 and pgT.evaluate("window.__fp.glowColors('taAc')") == ["#6fd3ff"], (pgT.evaluate("window.__fp.heatGlow('taAc')"), pgT.evaluate("window.__fp.glowColors('taAc')")))
pgT.evaluate("window.__fp.fakeState('climate.ac_test', 'heat'); window.__fp.applyStates()"); pgT.wait_for_timeout(300)
check("climate: a split unit on a thermostat set to heat glows red at its outlet", pgT.evaluate("window.__fp.heatGlow('taSplit')") == 0.85, pgT.evaluate("window.__fp.heatGlow('taSplit')"))
pgT.evaluate("window.__fp.fakeState('climate.ac_test', 'fan_only'); window.__fp.applyStates()"); pgT.wait_for_timeout(300)
check("climate: only fanning, it runs (display lit) but neither heats nor cools", pgT.evaluate("window.__fp.glowColors('taSplit')") == ["#6fd3ff"] and pgT.evaluate("window.__fp.heatGlow('taSplit')") == 0,
      (pgT.evaluate("window.__fp.glowColors('taSplit')"), pgT.evaluate("window.__fp.heatGlow('taSplit')")))
pgT.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => !['taAc', 'taSplit'].includes(v.id)); window.__fp.rebuild(); }")
# --- the ceiling fan: its light is an LED zone of its own
pgT.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'taFan', type: 'fan_ceiling', x: 63, z: 70, y: 2.1, rot: 0, scale: 1, name: 'Ventilator', entity: 'switch.garage'}); window.__fp.rebuild(); window.__fp.select('device', 'taFan'); }""")
pgT.wait_for_timeout(400)
heads = pgT.locator("#propsBody .ringSec[data-zone] .ringSecHead b").all_inner_texts()
check("ceiling fan: the side panel has a field for its light", heads == ["Light"] and len(pgT.evaluate("window.__fp.ringGlow('taFan')")) == 1, heads)
pgT.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => v.id !== 'taFan'); window.__fp.rebuild(); }")
bad = [e for e in own if "favicon" not in e]
check("TV arm and climate: no console errors", not bad, bad)
pgT.close()
