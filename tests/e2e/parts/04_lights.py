"""Lights and the heating: Nanoleaf editor, TV backlight, presence, compass and the walls facing the camera, the heating panel (#134), further roofs (#125).
"""
# --- Nanoleaf layout editor: click panels together, ONE device with one entity
pg10 = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pg10.goto(BASE + "?debug=1&mode=edit"); pg10.wait_for_timeout(1500)
pg10.evaluate("(() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices.push({id:'nano1', type:'nanoleaf', x:1, z:1, y:1.4, rot:0, scale:1, name:'Leaves', entity:'light.wohnzimmer', panels:[{s:'sq',x:-0.12,y:0,r:0},{s:'sq',x:0.12,y:0,r:0}]}); window.__fp.rebuild(); window.__fp.editNano('nano1'); })()")
pg10.wait_for_selector("#nanoCanvas", timeout=10000); pg10.wait_for_timeout(300)
box = pg10.locator("#nanoCanvas").bounding_box()
pg10.click("[data-shape=tri]")
for dx, dy in [(0.0, -0.3), (0.0, 0.3), (0.45, 0.0)]:
    pg10.mouse.click(box["x"] + box["width"] / 2 + dx * box["width"] * 0.35, box["y"] + box["height"] / 2 + dy * box["height"] * 0.6); pg10.wait_for_timeout(100)
pg10.click("[data-shape=tri2]"); pg10.mouse.click(box["x"] + box["width"] / 2 - 0.3 * box["width"] * 0.35, box["y"] + box["height"] / 2); pg10.wait_for_timeout(100)
cnt = pg10.inner_text("#nanoCount")
pg10.click("#nanoOk"); pg10.wait_for_timeout(500)
np_ = pg10.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(d => d.id === 'nano1').panels.length")
check("nanoleaf editor adds snapped panels to one device", np_ >= 5 and pg10.locator("#nanoDialog").count() == 0, (np_, cnt))
pg10.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(d => d.id === 'nano1').hideModel = true; window.__fp.rebuild()")
pg10.click("#modeSwitch button[data-mode=live]"); pg10.wait_for_timeout(500)
hid = pg10.evaluate("window.__fp.isShown('nano1')")
pg10.click("#modeSwitch button[data-mode=edit]"); pg10.wait_for_timeout(500)
shown = pg10.evaluate("window.__fp.isShown('nano1')")
check("invisible light is hidden in live mode only", hid is False and shown is True, (hid, shown))
pg10.evaluate("(() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices.push({id:'tvx', type:'tv_wall', x:3, z:2, y:1.2, rot:0, scale:1, name:'TV', entity:'', ledEntity:'light.wohnzimmer'}, {id:'tvy', type:'tv', x:5, z:2, y:0.5, rot:0, scale:1, name:'TV2', entity:''}); window.__fp.rebuild(); })()")
pg10.wait_for_timeout(300)
check("TV with a backlight entity shows its built-in LED frame", pg10.evaluate("window.__fp.ledShown('tvx')") is True and pg10.evaluate("window.__fp.ledShown('tvy')") is False)
pg10.evaluate("(() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.rooms.push({id:'rp1', name:'Presence room', color:'#888', points:[[0,8],[6,8],[6,12],[0,12]]}); f.devices.push({id:'pr1', type:'presence', x:2, z:10, y:0, rot:0, scale:1, name:'Anna', entity:'person.anna'}); window.__fp.rebuild(); })()")
pg10.click("#modeSwitch button[data-mode=live]"); pg10.wait_for_timeout(600)
pg10.evaluate("window.__fp.fakeState('person.anna', 'home'); window.__fp.rebuild()"); pg10.wait_for_timeout(300)
here = pg10.evaluate("window.__fp.isShown('pr1')"); dot = pg10.locator("#roomMenu .pill.occupied").count()
sp = pg10.evaluate("window.__fp.screenOf('pr1')")
ph = pg10.evaluate(f"window.__fp.liveHitAt({sp['x']}, {sp['y']})") if sp else None
check("presence (#234): the figure takes no tap in live mode", sp is not None and (ph or {}).get("id") != "pr1", (sp, ph))
pg10.evaluate("window.__fp.fakeState('person.anna', 'not_home'); window.__fp.rebuild()"); pg10.wait_for_timeout(300)
away = pg10.evaluate("window.__fp.isShown('pr1')"); dot2 = pg10.locator("#roomMenu .pill.occupied").count()
check("presence: person shows with a dot on the room while home, hides when away", here is True and dot == 1 and away is False and dot2 == 0, (here, dot, away, dot2))
pg10.close()
# --- LED ring: placed in a room it runs all around under the ceiling, every section has its own light
# --- the walls facing the camera are found by the centre of the WALLS, a garden far away must not turn the south wall around; the compass says where we look from
set_setting("lowWalls", False); set_setting("cutaway", True); set_setting("seeThrough", False)      # an earlier step may have left one of them different
pgK = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgK.goto(BASE + "?debug=1&mode=edit"); pgK.wait_for_timeout(2000)
pgK.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.walls.length = 0; f.devices.length = 0;
  [[[0,0],[6,0]],[[6,0],[6,5]],[[6,5],[0,5]],[[0,5],[0,0]]].forEach((w, i) => f.walls.push({id: 'kw' + i, a: w[0], b: w[1], thickness: 0.2, height: 2.6, openings: []}));
  f.devices.push({id: 'kTree', type: 'tree', x: 3, z: 30, y: 0, rot: 0, scale: 1, name: 'Baum', entity: ''}, {id: 'kTree2', type: 'tree', x: 3, z: 26, y: 0, rot: 0, scale: 1, name: 'Baum', entity: ''}); window.__fp.rebuild(); }""")
pgK.wait_for_timeout(800)
pgK.evaluate("window.__fp.camAt(3, 14, 22, 3, 2.5)"); pgK.wait_for_timeout(500)
pgK.evaluate("() => { for (let i = 0; i < 60; i++) window.__fp.frame(); }"); pgK.wait_for_timeout(300)
ci = {c["id"]: c for c in pgK.evaluate("window.__fp.cutInfo()")}
check("walls facing the camera: the south wall points out of the house even with a garden far south of it", ci["kw2"]["n"][1] > 0.9, ci["kw2"])
check("walls facing the camera: the south wall sinks (Auto) when we look from the south", min(ci["kw2"]["low"], ci["kw2"]["fade"]) < 0.5, ci["kw2"])
check("compass: it is shown in the 3D view", pgK.locator("#compass").is_visible())
txt_s = pgK.inner_text("#compassFrom")
pgK.evaluate("window.__fp.camAt(43, 14, 2.5, 3, 2.5)"); pgK.wait_for_timeout(1200)
txt_e = pgK.inner_text("#compassFrom")
check("compass: it says from which side we look (south, then east)", txt_s.strip()[-1] == "S" and txt_e.strip()[-1] in "OE", (txt_s, txt_e))
check("compass: the ring with the letters stands still, only the needle turns", pgK.get_attribute("#compassRose", "transform") is None and "rotate(" in (pgK.get_attribute("#compassNeedle", "transform") or ""), pgK.get_attribute("#compassNeedle", "transform"))
ne_s = pgK.get_attribute("#compassNeedle", "transform")
pgK.evaluate("window.__fp.camAt(3, 14, 22, 3, 2.5)"); pgK.wait_for_timeout(1200)
check("compass: the needle turns with the camera", pgK.get_attribute("#compassNeedle", "transform") != ne_s, (ne_s, pgK.get_attribute("#compassNeedle", "transform")))
import math as _m
angs = []
for k in range(0, 40):                                          # one and a bit full turns around the house in steps of 10 degrees
    a = _m.radians(k * 10)
    pgK.evaluate("window.__fp.camAt(%f, 14, %f, 3, 2.5)" % (3 + 20 * _m.sin(a), 2.5 + 20 * _m.cos(a))); pgK.wait_for_timeout(90)
    pgK.evaluate("() => { for (let i = 0; i < 3; i++) window.__fp.frame(); }")
    angs.append(float(pgK.get_attribute("#compassNeedle", "transform").split("(")[1].rstrip(")")))
jumps = [abs(b2 - a2) for a2, b2 in zip(angs, angs[1:])]
check("compass: after a full turn the needle keeps counting on, it never spins back (#175)", max(jumps) < 60 and abs(angs[-1] - angs[0]) > 300, (round(max(jumps)), round(angs[0]), round(angs[-1])))
pgK.close()

# --- heating panel (#134): thermostats of the room get their own panel next to the room panel, with the target temperature, the modes and a sign that it heats
pgH = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgH.goto(BASE + "?debug=1&mode=live"); pgH.wait_for_timeout(2000)
pgH.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.walls.length = 0; f.devices.length = 0; f.rooms.length = 0;
  f.rooms.push({id: 'hRoom', name: 'Heizraum', points: [[0,0],[6,0],[6,5],[0,5]]});
  f.devices.push({id: 'hRad', type: 'radiator', x: 3, z: 0.3, y: 0.15, rot: 0, scale: 1, name: 'Heizkörper', entity: 'climate.wohnzimmer'}, {id: 'hLamp', type: 'light', x: 2, z: 2, y: 2.3, rot: 0, scale: 1, name: 'Lampe', entity: 'light.wohnzimmer'});
  window.__fp.rebuild(); window.__fp.openRoomPanel('hRoom'); }""")
pgH.wait_for_timeout(1500)
check("heating: the heating panel is shown next to the room panel", pgH.locator("#heatPanel").is_visible() and pgH.locator("#roomPanel").is_visible())
txt = pgH.inner_text("#heatPanel")
check("heating: it shows the room temperature, the target and that it heats", "20.5" in txt and "21" in txt and ("heizt" in txt or "heating" in txt), txt)
rp = pgH.inner_text("#roomPanel")
check("heating: the thermostat is no longer in the room panel's list (the lamp still is)", "Heizkörper" not in rp and "Lampe" in rp, rp)
check("heating: the radiator glows while it heats", pgH.evaluate("window.__fp.heatGlow('hRad')") > 0.5, pgH.evaluate("window.__fp.heatGlow('hRad')"))
pgH.click("#heatPanel .hp-set button >> nth=1"); pgH.click("#heatPanel .hp-set button >> nth=1"); pgH.wait_for_timeout(1500)
cd = json.load(urllib.request.urlopen(HA + "/_calldata"))
check("heating: two clicks on + become one call, 21 -> 22 degrees", [c for c in cd if c[0] == "set_temperature"][-1:] == [["set_temperature", "climate.wohnzimmer", 22.0]], cd)
check("heating: the panel shows the new target", "22" in pgH.inner_text("#heatPanel .hp-set"), pgH.inner_text("#heatPanel .hp-set"))
pgH.click("#heatPanel .hp-modes button >> nth=0"); pgH.wait_for_timeout(1200)
cd = json.load(urllib.request.urlopen(HA + "/_calldata"))
check("heating: the mode buttons call set_hvac_mode (off)", ["set_hvac_mode", "climate.wohnzimmer", "off"] in cd, cd)
check("heating: off, the radiator stops glowing and the badge says so", pgH.evaluate("window.__fp.heatGlow('hRad')") == 0 and pgH.locator("#heatPanel .hp-badge.off").count() == 1, pgH.evaluate("window.__fp.heatGlow('hRad')"))
urllib.request.urlopen(HA + "/_set?e=climate.wohnzimmer&s=heat")
pgH.close()

# --- further roofs (#125): an annex with its own flat roof, on a lower floor
pgP = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgP.goto(BASE + "?debug=1&mode=edit"); pgP.wait_for_timeout(2000)
pgP.evaluate("""() => { const fl = window.__fp.layout.floors; fl.length = 0;
  fl.push({id: 'pf0', name: 'EG', kind: 'floor', walls: [], rooms: [{id: 'pr0', name: 'R', points: [[0,0],[8,0],[8,5],[0,5]]}], devices: [], blocks: [], stairs: []},
          {id: 'pf1', name: 'OG', kind: 'floor', walls: [], rooms: [{id: 'pr1', name: 'O', points: [[0,0],[8,0],[8,5],[0,5]]}], devices: [], blocks: [], stairs: []},
          {id: 'pf2', name: 'Dach', kind: 'roof', walls: [], rooms: [], devices: [], blocks: [], stairs: [], roof: {type: 'gable', pitch: 35, overhang: 0.4, box: {x0: 0, x1: 8, z0: 0, z1: 5},
            parts: [{id: 'rp1', name: 'Anbau', type: 'flat', pitch: 35, overhang: 0.3, box: {x0: 8, x1: 11, z0: 0, z1: 4}, level: 'pf0'}, {id: 'rp2', type: 'hip', pitch: 25, overhang: 0.3, box: {x0: -3, x1: 0, z0: 0, z1: 4}}]}});
  window.__fp.switchFloor(0); window.__fp.rebuild(); }""")
pgP.click("#floorRail .railHouse"); pgP.wait_for_timeout(1000)
rm = pgP.evaluate("window.__fp.roofMeshes()")
tags = {m["tag"]: m["y"] for m in rm}
check("further roofs: the main roof and both further roofs are drawn", set(tags) >= {"main", "rp1", "rp2"}, tags)
check("further roofs: a roof on the ground floor sits lower than the main one on top", tags["rp1"] < tags["main"] - 1 and abs(tags["rp2"] - tags["main"]) < 0.01, tags)
pgP.evaluate("window.__fp.switchFloor(2)"); pgP.wait_for_timeout(600)
pgP.evaluate("document.querySelector('#floorPanel').open = true"); pgP.wait_for_timeout(300)
check("further roofs: the roof panel lists them and has a button for one more", pgP.locator("#roofPartsHead").is_visible() and pgP.locator(".roofPartCard").count() == 2 and pgP.locator("#addRoofPart").is_visible())
pgP.click("#addRoofPart"); pgP.wait_for_timeout(500)
check("further roofs: the button adds a roof (3 now)", pgP.locator(".roofPartCard").count() == 3 and len(pgP.evaluate("window.__fp.layout.floors[2].roof.parts")) == 3)
pgP.locator(".roofPartDel").first.click(); pgP.wait_for_timeout(500)
check("further roofs: the cross removes one (2 left)", pgP.locator(".roofPartCard").count() == 2 and "rp1" not in [m["tag"] for m in pgP.evaluate("window.__fp.roofMeshes()")])
pgP.close()
