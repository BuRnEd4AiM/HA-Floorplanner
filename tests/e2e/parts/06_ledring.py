"""LED ring in a room, inside Home Assistant (more-info), automatic placement, the live channel, the ground (earth, lawn, plot).
"""
pg12 = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pg12.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pg12.goto(BASE + "?debug=1&mode=edit"); pg12.wait_for_timeout(1500)
pg12.evaluate("(() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.rooms.push({id:'rr1', name:'Ring room', color:'#888', points:[[20,0],[24,0],[24,3],[20,3]]}); window.__fp.rebuild(); })()")
pg12.click("#view2d"); pg12.wait_for_timeout(500)
pg12.click("button[data-tool=device]"); pg12.select_option("#entitySelect", "")
pg12.fill("#paletteSearch", "ledring"); pg12.wait_for_timeout(200)
pg12.click("#paletteGrid button.dev >> nth=0")
pg12.evaluate("window.__fp.plan().fit && window.__fp.plan().fit()"); pg12.wait_for_timeout(300)
c = pg12.evaluate("window.__fp.plan().toClient(22,1.5)"); pg12.mouse.click(*c); pg12.wait_for_timeout(400)
ring = pg12.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(d => d.type === 'ledring')")
wh = pg12.evaluate("fetch('api/settings').then(r => r.json()).then(s => s.wallHeight)")
xs = sorted(round(ring["x"] + p[0], 3) for p in ring["pts"]) if ring else []
check("LED ring placed in a room runs around it under the ceiling", ring and len(ring["pts"]) == 4 and len(ring["segs"]) == 4 and ring["closed"] is True
      and xs[0] == 20.15 and xs[-1] == 23.85 and abs(ring["y"] - (wh - 0.1)) < 0.01 and ring.get("room") == "rr1", ring)
pg12.click("button[data-tool=select]")
c = pg12.evaluate("window.__fp.plan().toClient(22,1.5)"); pg12.mouse.click(*c); pg12.wait_for_timeout(300)
mid_sel = pg12.inner_text("#propsTitle")
c = pg12.evaluate("window.__fp.plan().toClient(22,0.15)"); pg12.mouse.click(*c); pg12.wait_for_timeout(300)
check("2D: inside the ring the room is picked, on the line the ring", pg12.is_visible("#ringFit") and mid_sel != pg12.inner_text("#propsTitle"), mid_sel)
check("ring properties list one light per section", pg12.locator("#propsBody .entPicker").count() == 5)
rid = ring["id"]
# state set and read in one step: the regular poll would otherwise bring back the mock's real state
g1, marks = pg12.evaluate(f"async () => {{ const d = window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(v => v.id === '{rid}'); d.segs[0] = {{entity: 'light.wohnzimmer'}}; window.__fp.fakeState('light.wohnzimmer', 'on'); window.__fp.rebuild();"
                          f" const glow = window.__fp.ringGlow('{rid}'); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));"   # the 2D plan draws on the next frame
                          " return [glow, [...new Set([...document.querySelectorAll('#plan2d line')].map(l => l.getAttribute('stroke')).filter(c => ['#ff8a80', '#80d8ff', '#b9f6ca', '#ffd180'].includes(c)))]]; }")
check("only the section with a lit light glows", g1 == [True, False, False, False], g1)
check("editing: the sections that are off are marked in their own colours in 2D (#325)", sorted(marks) == ['#80d8ff', '#b9f6ca', '#ffd180'], marks)
g2 = pg12.evaluate(f"(() => {{ window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(v => v.id === '{rid}').entity = 'light.wohnzimmer'; window.__fp.fakeState('light.wohnzimmer', 'on'); window.__fp.rebuild(); return window.__fp.ringGlow('{rid}'); }})()")
check("sections without own light follow the ring's main entity", g2 == [True, True, True, True], g2)
pg12.click("#ringClosed"); pg12.wait_for_timeout(300)
opened = len(pg12.evaluate(f"window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(v => v.id === '{rid}').segs"))
pg12.click("#ringClosed"); pg12.wait_for_timeout(300)
closed = pg12.evaluate(f"window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(v => v.id === '{rid}')")
check("ring can be opened (one section less) and closed again", opened == 3 and len(closed["segs"]) == 4 and closed["segs"][0] == {"entity": "light.wohnzimmer"}, (opened, closed["segs"]))
# free sections: how many, from where to where (several per wall, gaps without LEDs)
ring_of = lambda: pg12.evaluate(f"window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(v => v.id === '{rid}')")
pg12.fill("#ringCount", "6"); pg12.click("#ringEven"); pg12.wait_for_timeout(300)
r6 = ring_of()
check("LED ring: 6 sections spread evenly over the band", len(r6["segs"]) == 6 and all(abs((sg["to"] - sg["from"]) - 12.8 / 6) < 0.01 for sg in r6["segs"])
      and len(pg12.evaluate(f"window.__fp.ringGlow('{rid}')")) == 6 and r6["segs"][0].get("entity") == "light.wohnzimmer", r6["segs"])
unit = pg12.evaluate("fetch('api/settings').then(r => r.json()).then(s => s.units)")
disp = (lambda m: m * 3.28084) if unit == "imperial" else (lambda m: m)
to0 = pg12.locator('.ringSec[data-seg="0"] input[type=number]').nth(1)
to0.fill(f"{disp(1.0):.3f}"); to0.dispatch_event("change"); pg12.wait_for_timeout(300)
check("LED ring: end of a section typed in (gap after it)", abs(ring_of()["segs"][0]["to"] - 1.0) < 0.01, ring_of()["segs"][0])
f1 = ring_of()["segs"][1]["from"]
a_ = pg12.evaluate(f"window.__fp.plan().toClient({20.15 + f1},0.15)"); b_ = pg12.evaluate("window.__fp.plan().toClient(21.65,0.15)")
pg12.mouse.move(*a_); pg12.mouse.down(); pg12.mouse.move(b_[0], b_[1], steps=6); pg12.mouse.up(); pg12.wait_for_timeout(300)
check("LED ring: start of a section dragged along the wall in 2D", abs(ring_of()["segs"][1]["from"] - 1.5) < 0.06 and abs(ring_of()["x"] - 22) < 0.01, (f1, ring_of()["segs"][1], ring_of()["x"]))
pg12.click("#ringPerWall"); pg12.wait_for_timeout(300)
rw = ring_of()
check("LED ring: back to one section per wall", len(rw["segs"]) == 4 and not any("from" in sg for sg in rw["segs"]), rw["segs"])
pg12.click("#view3d"); pg12.wait_for_timeout(300)
pg12.click("#modeSwitch button[data-mode=live]"); pg12.wait_for_timeout(600)
pg12.evaluate("window.__fp.topDown()"); pg12.wait_for_timeout(300)
sp = pg12.evaluate(f"window.__fp.ringSegScreen('{rid}', 2)")
hit = pg12.evaluate(f"window.__fp.pickAt({sp['x']}, {sp['y']})") if sp else None
if sp: pg12.mouse.click(sp["x"], sp["y"]); pg12.wait_for_timeout(400)
txt = pg12.inner_text("#livePopup") if pg12.is_visible("#livePopup") else ""
check("live: tapping a section opens it with the section buttons", hit and hit.get("seg") == 2 and pg12.locator("#livePopup .ringSegs button.sel").inner_text() == "3" and pg12.locator("#livePopup .ringSegs button").count() == 4, (hit, txt[:120]))
pg12.evaluate("window.__fp.openRoomPanel('rr1')"); pg12.wait_for_timeout(300)
check("outside Home Assistant there is no details button", pg12.locator("#roomPanel .row").count() > 0 and pg12.locator(".mi").count() == 0)
pg12.close()
# --- inside Home Assistant (Ingress iframe on HA's origin): details open HA's own more-info dialog
pg13 = b.new_page(viewport={"width": 1300, "height": 800}, extra_http_headers={"X-Remote-User-Name": "admin"})
pg13.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
host = ('<!doctype html><html><body style="margin:0"><home-assistant></home-assistant>'
        '<iframe id="fr" src="/?debug=1&mode=live" style="position:absolute;left:0;top:0;width:1300px;height:800px;border:0"></iframe>'
        '<script>window.__mi = []; document.querySelector("home-assistant").addEventListener("hass-more-info", (e) => window.__mi.push(e.detail.entityId));</script></body></html>')
pg13.route(BASE + "fake-ha.html", lambda r: r.fulfill(status=200, content_type="text/html", body=host))
pg13.goto(BASE + "fake-ha.html"); pg13.wait_for_timeout(2500)
fr = pg13.frame(url=lambda u: "debug=1" in u)
fr.evaluate("window.__fp.openRoomPanel('rr1')"); pg13.wait_for_timeout(300)
fr.locator("#roomPanel .row .mi").first.click(); pg13.wait_for_timeout(200)
check("room panel: details open Home Assistant's dialog for the entity", pg13.evaluate("window.__mi") == ["light.wohnzimmer"], pg13.evaluate("window.__mi"))
fr.evaluate("window.__fp.topDown()"); pg13.wait_for_timeout(300)
sp = fr.evaluate(f"window.__fp.ringSegScreen('{rid}', 0)")
pg13.mouse.click(sp["x"], sp["y"]); pg13.wait_for_timeout(400)
fr.locator("#livePopup .title .mi").click(); pg13.wait_for_timeout(200)
check("live popup: details button next to the name", pg13.evaluate("window.__mi").count("light.wohnzimmer") == 2, pg13.evaluate("window.__mi"))
pg13.close()
# --- automatic placement: every entity of the room's HA area where it belongs, one undo step
pg14 = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pg14.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pg14.goto(BASE + "?debug=1&mode=edit"); pg14.wait_for_timeout(1500)
pg14.once("dialog", lambda d: d.accept("Auto"))
pg14.evaluate("window.__fp.addFloorOf('floor')"); pg14.wait_for_timeout(300)
pg14.evaluate("""(() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; const P = [[0,0],[5,0],[5,4],[0,4]];
  P.forEach((a, i) => f.walls.push({ id: 'aw' + i, a: [...a], b: [...P[(i + 1) % 4]], thickness: 0.2, height: 2.6,
    openings: i === 0 ? [{ id: 'ad', type: 'door', pos: 1, width: 0.9, height: 2.1, sill: 0 }] : [] }));
  f.rooms.push({ id: 'ar', name: 'Autoraum', color: '#888', area: 'wz', points: P.map((p) => [...p]) }); window.__fp.rebuild(); })()""")
pg14.wait_for_timeout(300)
pg14.click("#roomMenuBtn"); pg14.locator("#roomMenu .pill", has_text="Autoraum").first.click(); pg14.wait_for_timeout(500)
has_btn = pg14.is_visible("#reAutoPlace")
if has_btn: pg14.click("#reAutoPlace"); pg14.wait_for_timeout(400)
devs = pg14.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].devices")
wh = pg14.evaluate("fetch('api/settings').then(r => r.json()).then(s => s.wallHeight)")
lamp = next((d for d in devs if d["entity"] == "light.wohnzimmer"), None)
sw = next((d for d in devs if d["entity"] == "cover.rollo"), None)
check("auto placement: one click puts the area's light under the ceiling and the blind switch by the door, on the wall",
      has_btn and lamp and lamp["type"] == "light" and abs(lamp["y"] - (wh - 0.05)) < 0.01 and 1.5 < lamp["x"] < 3.5 and 1 < lamp["z"] < 3
      and sw and sw["type"] == "switch" and abs(sw["z"] - 0.12) < 0.03 and abs(sw["x"] - 1) < 1.2 and not (0.55 < sw["x"] < 1.45), devs)
check("auto placement: the room's list has nothing left to place", pg14.locator("#reAutoPlace").count() == 0 and pg14.locator(".re-row.unplaced").count() == 0)
pg14.keyboard.press("Control+z"); pg14.wait_for_timeout(300)
check("auto placement: one undo removes all of it", len(pg14.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].devices")) == 0)
pg14.close()
# --- live channel: a change outside the floor plan (wall switch, automation) shows up at once, not after the next poll
pg15 = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pg15.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pg15.goto(BASE + "?debug=1&mode=live"); pg15.wait_for_timeout(1500)
for _ in range(50):                                              # the channel comes up right after the page has loaded
    if pg15.evaluate("window.__fp.liveOk()"): break
    pg15.wait_for_timeout(100)
live_up = pg15.evaluate("window.__fp.liveOk()")
before = pg15.evaluate("window.__fp.stateOf('light.wohnzimmer')")
target = "off" if before == "on" else "on"
t0 = time.time()
urllib.request.urlopen(HA + f"/_set?e=light.wohnzimmer&s={target}")
seen = None
for _ in range(30):
    if pg15.evaluate("window.__fp.stateOf('light.wohnzimmer')") == target: seen = time.time() - t0; break
    pg15.wait_for_timeout(50)
check("live channel: an outside change arrives within a second (no 4 s polling)", live_up and seen is not None and seen < 1.0, (live_up, before, seen))
urllib.request.urlopen(HA + f"/_set?e=light.wohnzimmer&s={before}")
pg15.close()
# --- ground: a house with a basement stands in solid earth, cut open along the facade that faces the camera
pg16 = b.new_page(viewport={"width": 1300, "height": 800}, extra_http_headers={"X-Remote-User-Name": "admin"})
pg16.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pg16.goto(BASE + "?debug=1&mode=live"); pg16.wait_for_timeout(1500)
pg16.once("dialog", lambda d: d.accept("Keller"))
pg16.evaluate("window.__fp.addFloorOf('basement')"); pg16.wait_for_timeout(300)
pg16.evaluate("""(() => { const f = window.__fp.layout.floors[0]; const P = [[0,0],[6,0],[6,5],[0,5]];
  P.forEach((a, i) => f.walls.push({ id: 'kw' + i, a: [...a], b: [...P[(i + 1) % 4]], thickness: 0.3, height: 2.6, openings: [] }));
  f.rooms.push({ id: 'kr', name: 'Kellerraum', color: '#777', points: P.map((p) => [...p]) }); })()""")
pg16.evaluate("window.__fp.setHouseMode(true)"); pg16.wait_for_timeout(800)
e1 = pg16.evaluate("window.__fp.earthDbg()")
check("ground: solid earth with a cut face in the whole-house view, grid hidden under the lawn",
      e1["solid"] and e1["capVisible"] and e1["capVerts"] >= 6 and abs(e1["n"][1]) < 1e-6 and not e1["gridShown"], e1)
s16 = pg16.evaluate("fetch('api/settings').then(r => r.json())")
pg16.evaluate("(s) => fetch('api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, earth: 'off' }) })", s16)
pg16.reload(); pg16.wait_for_timeout(1500)
pg16.evaluate("window.__fp.setHouseMode(true)"); pg16.wait_for_timeout(500)
e2 = pg16.evaluate("window.__fp.earthDbg()")
check("ground: can be switched off in the settings", not e2["solid"], e2)
pg16.evaluate("(s) => fetch('api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, earth: 'solid', earthMargin: 3 }) })", pg16.evaluate("fetch('api/settings').then(r => r.json())"))
pg16.reload(); pg16.wait_for_timeout(1500)
# placeholder blocks are part of the house: the lawn reaches around them (3 m, the setting above)
pg16.evaluate("""(() => { const L = window.__fp.layout; const f = L.floors[window.__fp.floorIdx()]; delete L.plot;
  (f.blocks ||= []).push({ id: 'bigblock', name: 'Block', points: [[40, 0], [60, 0], [60, 10], [40, 10]] }); window.__fp.rebuild(); })()""")
pg16.wait_for_timeout(300)
bx = pg16.evaluate("window.__fp.earthDbg()")["box"]
pg16.evaluate("""(() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({ id: 'glawn', type: 'lawn', x: 3, z: 8, y: 0, rot: 0, scale: 2, name: 'Rasen', entity: '' }, { id: 'gtree', type: 'tree', x: -3, z: 2, y: 0, rot: 0, scale: 1, name: 'Baum', entity: '' }); window.__fp.rebuild(); })()""")
pg16.wait_for_timeout(300)
e3 = pg16.evaluate("window.__fp.earthDbg()")
check("ground: on a floor the lawn stays whole (the cut is for the whole-house view)", e3["solid"] and not e3["cut"] and pg16.evaluate("window.__fp.clipped('glawn')") == 0, e3)
pg16.evaluate("window.__fp.setHouseMode(true)"); pg16.wait_for_timeout(500)
check("ground: garden objects at ground level are cut open with the earth", pg16.evaluate("window.__fp.clipped('glawn')") > 0 and pg16.evaluate("window.__fp.clipped('gtree')") > 0)
check("ground: a garden lawn never covers the floors of the house", pg16.evaluate("window.__fp.underFloors('glawn')"))
pg16.evaluate("window.__fp.setHouseMode(false)"); pg16.wait_for_timeout(500)
check("ground: the lawn reaches around placeholder blocks, as wide as the setting", bx and abs(bx[1] - 63) < 0.01 and bx[3] >= 12.99, bx)
# the plot drawn in the 2D plan gives the lawn its shape; it can be deleted again
pg16.locator("#modeSwitch button[data-mode=edit]").click(); pg16.wait_for_timeout(500)
check("ground: no grid over the lawn in edit mode while selecting", not pg16.evaluate("window.__fp.earthDbg()")["gridShown"])
pg16.click("button[data-tool=wall]"); pg16.wait_for_timeout(300)
check("ground: the grid comes back while drawing", pg16.evaluate("window.__fp.earthDbg()")["gridShown"])
pg16.click("button[data-tool=select]"); pg16.wait_for_timeout(200)
pg16.click("#view2d"); pg16.wait_for_timeout(1200); pg16.click("button[data-tool=plot]"); pg16.wait_for_timeout(500)
pg16.evaluate("window.__fp.plan().fit()"); pg16.wait_for_timeout(300)
for (x, z) in [(1, 1), (5, 1), (5, 4), (1, 4), (1, 1)]:
    c = pg16.evaluate(f"window.__fp.plan().toClient({x},{z})"); pg16.mouse.click(*c); pg16.wait_for_timeout(450)
pl = pg16.evaluate("window.__fp.layout.plot")
bx2 = pg16.evaluate("window.__fp.earthDbg()")["box"]
check("ground: a plot drawn in the 2D plan shapes the lawn", pl and pl.get("boundary") == [[1, 1], [5, 1], [5, 4], [1, 4]] and bx2 == [1, 5, 1, 4], (pl, bx2))
pg16.click("#plotClear"); pg16.wait_for_timeout(300)
check("ground: the plot can be deleted again", not (pg16.evaluate("window.__fp.layout.plot") or {}).get("boundary"))
pg16.close()
