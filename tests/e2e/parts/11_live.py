"""Live mode and the rest: neighbour house (#220), bridge (#189), second tap, tap balls (#238), renamed entities, the other languages, the live card left alone (#336).
"""
# --- neighbour house next to this one, the bridge leads over to its roof terrace (#220)
def api_send(method, path, body):
    r = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), method=method, headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r))
nb_house = api_send("POST", "api/houses", {"name": "Nachbar-Test"})["id"]
sqp = lambda x0, z0, x1, z1: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
api_send("PUT", f"api/layout?house={nb_house}", {"version": 1, "floors": [
    {"id": "n0", "name": "EG", "kind": "floor", "walls": [{"id": f"nw{i}", "a": sqp(0, 0, 6, 5)[i], "b": sqp(0, 0, 6, 5)[(i + 1) % 4], "thickness": 0.2, "height": 2.6, "openings": []} for i in range(4)], "rooms": [{"id": "nr", "name": "Garage", "points": sqp(0, 0, 6, 5)}], "devices": []},
    {"id": "n1", "name": "Terrasse", "kind": "floor", "walls": [], "rooms": [{"id": "nt", "name": "Dachterrasse", "points": sqp(0, 0, 6, 5), "terrace": True}], "devices": []}]})
pgNB = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgNB.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgNB.goto(BASE + "?debug=1&mode=edit"); pgNB.wait_for_timeout(2500)
nb_saved = api_admin("api/layout")
pgNB.evaluate("document.querySelector('#housePanel').open = true"); pgNB.wait_for_timeout(200)
check("neighbour (#220): with a second house the panel offers '+ Neighbour house'", pgNB.locator("#nbAdd").count() == 1)
pgNB.click("#nbAdd"); pgNB.wait_for_timeout(500)
pgNB.select_option("#neighborBody .nbHouse", nb_house); pgNB.wait_for_timeout(1500)     # earlier tests may have left more houses
check("neighbour (#220): added, its house is drawn next to this one", pgNB.evaluate("window.__fp.layout.neighbors?.[0]?.house") == nb_house and pgNB.evaluate("window.__fp.neighborCount()") == 1, pgNB.evaluate("window.__fp.layout.neighbors"))
pgNB.click("#floorRail .railHouse"); pgNB.wait_for_timeout(1000)                         # whole house: every floor of the neighbour too
nb_rail = pgNB.evaluate("""(() => { let n = 0; window.__fp.scene.traverse(o => { if (o.userData.neighbor) n = o.children.map(g => g.children.length); }); return n; })()""")
check("neighbour (#220): its roof terrace has a railing all round (open edges too)", isinstance(nb_rail, list) and len(nb_rail) == 2 and nb_rail[1] > 10, nb_rail)
gi = pgNB.evaluate("window.__fp.layout.floors.findIndex(f => f.kind !== 'basement')")
pgNB.evaluate(f"window.__fp.switchFloor({gi})"); pgNB.wait_for_timeout(400)
check("neighbour (#220): the 2D plan gets its outline on the same level", pgNB.evaluate("window.__fp.neighborOutlines()") >= 4, pgNB.evaluate("window.__fp.neighborOutlines()"))
pgNB.locator("#neighborBody .nbCard button").click(); pgNB.wait_for_timeout(500)
check("neighbour (#220): removed again, nothing is drawn", not pgNB.evaluate("window.__fp.layout.neighbors") and pgNB.evaluate("window.__fp.neighborCount()") == 0)
pgNB.wait_for_timeout(2500)
pgNB.evaluate("(l) => fetch('api/layout', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(l)})", nb_saved); pgNB.wait_for_timeout(400)
pgNB.close()
urllib.request.urlopen(urllib.request.Request(BASE + f"api/houses/{nb_house}", method="DELETE", headers={"X-Remote-User-Name": "admin"})).read()
# --- metal bridge between two building parts (#189)
pgBr = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgBr.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgBr.goto(BASE + "?debug=1&mode=edit"); pgBr.wait_for_timeout(2500)
br_saved = api_admin("api/layout")
pgBr.evaluate("""() => { const fp = window.__fp; fp.switchFloor(0); fp.layout.floors[0].devices.push({ id: 'brTest', type: 'bridge', x: 40, z: 40, y: 0, rot: 0, scale: 1, name: '', entity: '' }); fp.rebuild(); }""")
pgBr.wait_for_timeout(500)
q1 = pgBr.evaluate("window.__fp.devPose('brTest')")
check("bridge (#189): built in 3D, 3 m long and 1.2 m wide with a railing about 1 m high", q1 and abs(q1["size"][0] - 3) < 0.06 and abs(q1["size"][1] - 1.2) < 0.06 and abs(q1["h"] - 1.26) < 0.05, q1)
pgBr.click("#view2d"); pgBr.wait_for_timeout(600)
c = pgBr.evaluate("window.__fp.plan().toClient(40, 40)"); pgBr.mouse.click(*c); pgBr.wait_for_timeout(400)
check("bridge (#189): the panel shows length, width and railing", pgBr.locator("#bridgeRail").count() == 1)
if pgBr.locator("#bridgeRail").count():
    ln = pgBr.locator("#propsBody input[type=number]").nth(0)
    for i in range(pgBr.locator("#propsBody .prop").count()):
        lab = pgBr.locator("#propsBody .prop").nth(i).locator("label").inner_text()
        if lab in ("Length", "Länge"):
            ln = pgBr.locator("#propsBody .prop").nth(i).locator("input"); break
    ft = pgBr.evaluate("window.__fp.settings().units") == "imperial"           # the field shows the current unit
    ln.fill(f"{4.5 / 0.3048:.4f}" if ft else "4.5"); ln.dispatch_event("change"); pgBr.wait_for_timeout(400)
    pgBr.uncheck("#bridgeRail"); pgBr.wait_for_timeout(400)
    dv = pgBr.evaluate("window.__fp.layout.floors[0].devices.find(v => v.id === 'brTest')")
    q2 = pgBr.evaluate("window.__fp.devPose('brTest')")
    check("bridge (#189): length 4.5 m and no railing are kept and shown", abs(dv["len"] - 4.5) < 0.01 and dv.get("noRail") is True and abs(q2["size"][0] - 4.5) < 0.06 and q2["h"] < 0.4, (dv, q2))
    rf = pgBr.locator('#propsBody .prop:has(label:text-is("Height difference at the end")) input, #propsBody .prop:has(label:text-is("Höhenunterschied am Ende")) input')
    check("bridge (#222): the panel has the height difference at the end", rf.count() == 1)
    if rf.count():
        rf.fill(f"{0.6 / 0.3048:.4f}" if ft else "0.6"); rf.dispatch_event("change"); pgBr.wait_for_timeout(400)
        q3 = pgBr.evaluate("window.__fp.devPose('brTest')")
        rv = pgBr.evaluate("window.__fp.layout.floors[0].devices.find(v => v.id === 'brTest').rise")
        check("bridge (#222): 0.6 m higher at the end, the bridge slopes up", rv is not None and abs(rv - 0.6) < 0.01 and q3["h"] > q2["h"] + 0.5, (rv, q2, q3))
pgBr.wait_for_timeout(2500)
pgBr.evaluate("(l) => fetch('api/layout', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(l)})", br_saved); pgBr.wait_for_timeout(400)
pgBr.close()
set_setting("seeThrough", False); set_setting("cutaway", True)
pgR = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgR.goto(BASE + "?debug=1&mode=live"); pgR.wait_for_timeout(2500)
ri = pgR.evaluate("(() => { const f = window.__fp.layout.floors, i = f.findIndex(x => x.rooms.length); return i < 0 ? null : {i, id: f[i].rooms[0].id}; })()")
pgR.evaluate(f"window.__fp.switchFloor({ri['i']})"); pgR.wait_for_timeout(600)
cam0 = pgR.evaluate("window.__fp.cam()")
pgR.evaluate(f"window.__fp.liveTapRoom('{ri['id']}')"); pgR.wait_for_timeout(600)
cam1 = pgR.evaluate("window.__fp.cam()")
check("second tap: the first tap zooms into the room", pgR.evaluate("window.__fp.focusedRoom()") == ri["id"] and max(abs(a - b2) for a, b2 in zip(cam0, cam1)) > 0.05, (cam0, cam1))
pgR.evaluate(f"window.__fp.liveTapRoom('{ri['id']}')"); pgR.wait_for_timeout(600)
cam2 = pgR.evaluate("window.__fp.cam()")
check("second tap: a second tap into the same room goes back to the view before", pgR.evaluate("window.__fp.focusedRoom()") is None and pgR.locator("#roomPanel").is_hidden() and max(abs(a - b2) for a, b2 in zip(cam0, cam2)) < 1e-3, (cam0, cam2))
pgR.close()
# --- live mode: only things linked to an entity can be tapped, doors and windows have no hit box, lamps get a bigger finger box (#130)
def place_far(pg):
    """put the plant on the spot that is farthest (on the screen) from the lamp and from the window, so only the thing under test can be hit"""
    best = None
    for x, z in [(5, 1), (1, 4), (5, 4), (1, 1), (3, 1), (3, 3.5), (4.5, 2.5), (1.5, 2.5)]:
        pg.evaluate(f"() => {{ const d = window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(v => v.id === 'tPlant'); d.x = {x}; d.z = {z}; window.__fp.rebuild(); }}")
        pg.wait_for_timeout(400)
        pts = [pg.evaluate(f"window.__fp.screenOf('{i}')") for i in ("tLamp", "tPlant", "tWin")]
        gap = min(((pts[1]["x"] - o["x"]) ** 2 + (pts[1]["y"] - o["y"]) ** 2) ** 0.5 for o in (pts[0], pts[2]))
        if best is None or gap > best[0]:
            best = (gap, x, z)
    pg.evaluate(f"() => {{ const d = window.__fp.layout.floors[window.__fp.floorIdx()].devices.find(v => v.id === 'tPlant'); d.x = {best[1]}; d.z = {best[2]}; window.__fp.rebuild(); }}")
    pg.wait_for_timeout(500)
setup_js = """() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.walls.length = 0; f.devices.length = 0;
  [[[0,0],[6,0]],[[6,0],[6,5]],[[6,5],[0,5]],[[0,5],[0,0]]].forEach((w, i) => f.walls.push({id: 'tw' + i, a: w[0], b: w[1], thickness: 0.2, height: 2.6, openings: i === 2 ? [{id: 'tWin', type: 'window', pos: 0.5, width: 1.2, height: 1.2, sill: 0.9, entity: 'binary_sensor.fenster_wohnzimmer'}] : []}));
  f.devices.push({id: 'tLamp', type: 'light', x: 2, z: 2, y: 0.9, rot: 0, scale: 1, name: 'Lampe', entity: 'light.wohnzimmer'}, {id: 'tPlant', type: 'plant', x: 1, z: 0.8, y: 0, rot: 0, scale: 1, name: 'Pflanze', entity: ''});
  window.__fp.rebuild(); const e = window.__fp.elev(window.__fp.floorIdx()); window.__fp.camAt(3, e + 3, -7, 3, 2.5); }"""   # seen low from the north: lamp, its ball and the window on the far wall lie apart on the screen
pgT = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgT.goto(BASE + "?debug=1&mode=live"); pgT.wait_for_timeout(2000)
pgT.evaluate(setup_js); pgT.wait_for_timeout(1500)
place_far(pgT)
sl, sp, sw = pgT.evaluate("window.__fp.screenOf('tLamp')"), pgT.evaluate("window.__fp.screenOf('tPlant')"), pgT.evaluate("window.__fp.screenOf('tWin')")
hl = pgT.evaluate(f"window.__fp.liveHitAt({sl['x']}, {sl['y']})"); hp = pgT.evaluate(f"window.__fp.liveHitAt({sp['x']}, {sp['y']})"); hw = pgT.evaluate(f"window.__fp.liveHitAt({sw['x']}, {sw['y']})")
check("live tap (#262): the lamp itself is not hit, it has a ball (a tap there lands on the room)", not (hl and hl.get("id") == "tLamp"), hl)
check("live tap: a thing linked to nothing (plant) cannot be tapped", not (hp and hp["kind"] == "device"), hp)
check("live tap: a window has no hit box (even with a sensor)", not (hw and hw["kind"] == "opening"), hw)
check("live tap: the finger box of a lamp is at least 60 cm", pgT.evaluate("window.__fp.touchSize('tLamp')") >= 0.6 - 1e-6, pgT.evaluate("window.__fp.touchSize('tLamp')"))
bl = pgT.evaluate("window.__fp.ballScreen('tLamp')")
hb = pgT.evaluate(f"window.__fp.liveHitAt({bl['x']}, {bl['y']})") if bl else None
check("tap ball (#238): a ball floats over the lamp in live mode and a tap on it hits the lamp", bl is not None and bl["y"] < sl["y"] and (hb or {}).get("id") == "tLamp", (bl, sl, hb))
check("tap ball (#262): the ball is bigger (60 cm)", abs(pgT.evaluate("window.__fp.ballSize('tLamp')") - 0.6) < 0.01, pgT.evaluate("window.__fp.ballSize('tLamp')"))
check("tap ball (#238): a plant linked to nothing has no ball", pgT.evaluate("window.__fp.ballScreen('tPlant')") is None)
pgT.evaluate("""() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({id: 'tLamp2', type: 'light', x: 2, z: 2.9, y: 2.3, rot: 0, scale: 1, name: 'Decke', entity: 'light.wohnzimmer'}); window.__fp.rebuild(); }""")
pgT.wait_for_timeout(1500)
b1, b2 = pgT.evaluate("window.__fp.ballScreen('tLamp')"), pgT.evaluate("window.__fp.ballScreen('tLamp2')")
gapB = ((b1["x"] - b2["x"]) ** 2 + (b1["y"] - b2["y"]) ** 2) ** 0.5 - b1["r"] - b2["r"] if b1 and b2 else None
check("tap balls (#314): a floor lamp and a ceiling lamp behind it do not cover each other on the screen", gapB is not None and gapB >= 0, (b1, b2, gapB))
pgT.click("#modeSwitch button[data-mode=edit]"); pgT.wait_for_timeout(500)
check("tap ball (#238): no ball in edit mode", pgT.evaluate("window.__fp.ballScreen('tLamp')") is None)
pgT.close()
pgT2 = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgT2.goto(BASE + "?debug=1&mode=edit"); pgT2.wait_for_timeout(2000)
pgT2.evaluate(setup_js); pgT2.wait_for_timeout(1500)
place_far(pgT2)
sp2, sw2 = pgT2.evaluate("window.__fp.screenOf('tPlant')"), pgT2.evaluate("window.__fp.screenOf('tWin')")
hp2 = pgT2.evaluate(f"window.__fp.liveHitAt({sp2['x']}, {sp2['y']})"); hw2 = pgT2.evaluate(f"window.__fp.liveHitAt({sw2['x']}, {sw2['y']})")
check("edit mode: everything can still be picked (plant and window)", hp2 and hp2["kind"] == "device" and hw2 and hw2["kind"] == "opening", (hp2, hw2))
pgT2.close()

# --- entities renamed in Home Assistant: the stored plan and an open view follow (renames.py, renames.js)
pgR = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgR.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
hid = pgR.request.post(BASE + "api/houses", data=json.dumps({"name": "Umbenennen"}), headers={"Content-Type": "application/json"}).json()["id"]
planR = {"version": 1, "floors": [{"id": "fR", "name": "EG", "walls": [], "rooms": [], "devices": [
    {"id": "rG", "type": "light", "x": 1, "z": 1, "y": 1.2, "rot": 0, "scale": 1, "name": "Garage", "entity": "switch.garage"},
    {"id": "rM", "type": "light", "x": 2, "z": 1, "y": 2.3, "rot": 0, "scale": 1, "name": "Mein Licht", "entity": "switch.garage"}]}]}
pgR.request.put(BASE + f"api/layout?house={hid}", data=json.dumps(planR), headers={"Content-Type": "application/json"})
pgR.goto(BASE + f"?debug=1&mode=edit&house={hid}"); pgR.wait_for_timeout(1500)
got = json.load(urllib.request.urlopen(HA + "/_rename?from=switch.garage&to=switch.garagentor&name=Garagentor"))
def stored_devs():
    return api_admin(f"api/layout?house={hid}")["floors"][0]["devices"]
for _ in range(40):
    if stored_devs()[0]["entity"] == "switch.garagentor": break
    pgR.wait_for_timeout(250)
devs = stored_devs()
check("renamed in Home Assistant: the stored plan gets the new entity id", got["watchers"] > 0 and [d["entity"] for d in devs] == ["switch.garagentor"] * 2, (got, devs))
check("renamed in Home Assistant: Home Assistant's new name is taken, a name typed by hand stays", [d["name"] for d in devs] == ["Garagentor", "Mein Licht"], devs)
pgR.wait_for_timeout(1000)
mem = pgR.evaluate("window.__fp.layout.floors[0].devices.map(d => [d.entity, d.name])")
check("renamed in Home Assistant: an open view follows at once (no reload)", mem == [["switch.garagentor", "Garagentor"], ["switch.garagentor", "Mein Licht"]], mem)
check("renamed in Home Assistant: the device is not listed as offline", not [x for x in pgR.evaluate("window.__fp.offline()") if x.get("entity", "").startswith("switch.garage")], pgR.evaluate("window.__fp.offline()"))
pgR.close()
urllib.request.urlopen(HA + "/_rename?from=switch.garagentor&to=switch.garage&name=Garage").read()   # as before for the checks below
for _ in range(40):
    if stored_devs()[0]["entity"] == "switch.garage": break
    time.sleep(0.25)
urllib.request.urlopen(urllib.request.Request(BASE + f"api/houses/{hid}", method="DELETE", headers={"X-Remote-User-Name": "admin"})).read()

pg12 = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
shots = os.path.join(S, "lang")
os.makedirs(shots, exist_ok=True)
for code, word in (("fr", "Mur"), ("es", "Pared"), ("it", "Parete"), ("nl", "Muur"), ("pl", "Ściana")):
    pg12.request.put(BASE + "api/settings", data=json.dumps({"language": code}), headers={"Content-Type": "application/json"})
    pg12.goto(BASE + "?debug=1&mode=edit"); pg12.wait_for_timeout(1200)
    txt = pg12.inner_text("#toolbar")
    pg12.screenshot(path=os.path.join(shots, code + ".png"))
    check("UI switches to " + code, word in txt, txt[:200])
pg12.request.put(BASE + "api/settings", data=json.dumps({"language": "de"}), headers={"Content-Type": "application/json"})
pg12.close()

# --- the live card is drawn anew only when something it shows changes (#336): a state update of another entity (power meters, temperatures every
# few seconds) left the lamp's buttons and sliders being replaced under the finger, so a tap or a drag got lost
pgC = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgC.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgC.goto(BASE + "?debug=1&mode=live"); pgC.wait_for_timeout(1500)
for _ in range(50):                                              # the live channel brings the outside changes
    if pgC.evaluate("window.__fp.liveOk()"): break
    pgC.wait_for_timeout(100)
lc = pgC.evaluate("(() => { const f = window.__fp.layout.floors, i = f.findIndex(x => x.devices.some(d => d.entity === 'light.wohnzimmer')); return i < 0 ? null : {i, id: f[i].devices.find(d => d.entity === 'light.wohnzimmer').id}; })()")
pgC.evaluate(f"window.__fp.switchFloor({lc['i']})"); pgC.wait_for_timeout(500)
def outside(e, s):
    """a change in Home Assistant (wall switch, sensor): wait until the page has it and has drawn it"""
    urllib.request.urlopen(HA + f"/_set?e={e}&s={s}").read()
    for _ in range(40):
        if pgC.evaluate(f"window.__fp.stateOf('{e}')") == s: break
        pgC.wait_for_timeout(50)
    pgC.wait_for_timeout(300)
    return pgC.evaluate(f"window.__fp.stateOf('{e}')") == s
mark = lambda: pgC.evaluate("(() => { const b = document.querySelector('#livePopup .actions button'); if (b) b.__keep = 1; return !!b; })()")
kept = lambda: pgC.evaluate("!!document.querySelector('#livePopup .actions button')?.__keep")
sub = lambda: pgC.evaluate("document.querySelector('#livePopup .sub')?.textContent || ''")
outside("light.wohnzimmer", "on")
pgC.evaluate(f"window.__fp.liveTap('{lc['id']}')"); pgC.wait_for_timeout(400)
check("live card (#336): the lamp's card is open with its buttons", pgC.is_visible("#livePopup") and mark(), pgC.inner_text("#livePopup") if pgC.is_visible("#livePopup") else "no card")
got = outside("sensor.temp", "22")
check("live card (#336): a change of another entity (temperature) leaves the open card as it is, the same buttons", got and kept(), (got, sub()))
got = outside("light.wohnzimmer", "off")
check("live card (#336): a change of the lamp itself draws the card anew with the new state", got and not kept() and sub().startswith("off"), (got, sub()))
mark()
pgC.evaluate("document.querySelector('#livePopup input[type=color]').focus()")
got = outside("light.wohnzimmer", "on")
check("live card (#336): while the colour picker has the focus the card is not drawn anew", got and kept() and sub().startswith("off"), (got, sub()))
pgC.evaluate("document.activeElement.blur()"); pgC.wait_for_timeout(300)
check("live card (#336): the focus gone, what changed meanwhile is drawn", not kept() and sub().startswith("on"), sub())
pgC.evaluate("(() => { window.__fp.states()['light.wohnzimmer'].brightness = 50; window.__fp.applyStates(); })()"); pgC.wait_for_timeout(300)   # the mock lamp has no brightness
rng = pgC.locator("#livePopup .lightctl input[type=range]")
check("live card (#336): a brightness given, the card gets its slider", rng.count() == 1)
if rng.count() == 1:
    mark()
    n_on = len([c for c in ha_calls() if c[:2] == ["light", "turn_on"]])
    bb = rng.bounding_box()
    pgC.mouse.move(bb["x"] + bb["width"] * 0.3, bb["y"] + bb["height"] / 2); pgC.mouse.down()
    got = outside("light.wohnzimmer", "off")
    check("live card (#336): while the slider is held a change of the lamp does not take it from under the finger", got and kept() and rng.count() == 1, (got, sub()))
    pgC.mouse.move(bb["x"] + bb["width"] * 0.6, bb["y"] + bb["height"] / 2); pgC.mouse.up(); pgC.wait_for_timeout(600)
    calls = [c for c in ha_calls() if c[:2] == ["light", "turn_on"]]
    pgC.evaluate("document.activeElement.blur()"); pgC.wait_for_timeout(400)
    check("live card (#336): let go, the brightness is set and the card is drawn anew", len(calls) > n_on and not kept(), (n_on, calls[-1:], sub()))
pgC.close()
urllib.request.urlopen(HA + "/_set?e=sensor.temp&s=21.5").read(); urllib.request.urlopen(HA + "/_set?e=light.wohnzimmer&s=on").read()
