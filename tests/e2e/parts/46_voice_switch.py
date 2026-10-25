"""4.24.0 (#532): 🗣 switching by voice. A typed (or spoken) order in the search box switches: "Licht in der Stube aus" turns off the
lamps of that room that are on, "Rollläden in der Stube runter" closes the roller shutter of its window, a question ("Ist das Licht in der
Stube an?") switches nothing; "Alle Lichter aus" in the whole house asks first ("✓ Ja, aus"), then switches them all; a user with the lock
"Steuern" is told so and nothing is switched.
"""
st_vw = api("api/settings")
set_setting("language", "de")
set_setting("voice", {"engine": "auto", "aliases": []})
def mock_vw(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
lamp_vw = lambda name, on: {"state": "on" if on else "off", "attributes": {"friendly_name": name, "brightness": 200 if on else None}}
mock_vw("/_extra", {"light.v_decke": lamp_vw("Decke Stube", True), "light.v_steh": lamp_vw("Stehlampe Stube", False),
                    "light.v_kueche": lamp_vw("Küchenlicht", True), "light.v_flur": lamp_vw("Flurlicht", True), "light.v_bad": lamp_vw("Badlicht", True),
                    "cover.v_rollo": {"state": "open", "attributes": {"friendly_name": "Rollladen Stube", "current_position": 100, "supported_features": 15}}})
own_vw = []
def page_vw(user):
    pg_ = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": user})
    pg_.on("console", lambda m: own_vw.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_vw.append("PAGEERROR " + str(e)))
    pg_.goto(BASE + "?debug=1"); pg_.wait_for_timeout(1500)
    return pg_
pgV = page_vw("admin")
pgV.evaluate("""() => {      // a room "Stube" with a ceiling lamp (on), a floor lamp (off) and a window with a roller shutter; three more lamps on
  const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.rooms.push({ id: 'rw_stube', name: 'Stube', color: '#8a7f70', points: [[40, 40], [46, 40], [46, 45], [40, 45]] });
  f.walls.push({ id: 'ww_stube', a: [40, 40], b: [46, 40], thickness: 0.2, height: 2.6, openings: [
    { id: 'ow_1', type: 'window', pos: 2, width: 1.2, height: 1.2, sill: 0.9, name: 'Fenster Stube', shutter: true, shutterEntity: 'cover.v_rollo' }] });
  const lamp = (id, x, z, entity, name) => ({ id, type: 'light', x, z, y: 2.5, rot: 0, scale: 1, name, entity });
  f.devices.push(lamp('dw_decke', 43, 42, 'light.v_decke', 'Decke Stube'), lamp('dw_steh', 41, 44, 'light.v_steh', 'Stehlampe Stube'),
                 lamp('dw_kueche', 50, 50, 'light.v_kueche', 'Küchenlicht'), lamp('dw_flur', 52, 50, 'light.v_flur', 'Flurlicht'),
                 lamp('dw_bad', 54, 50, 'light.v_bad', 'Badlicht'));
  window.__fp.rebuild(); }""")
pgV.wait_for_timeout(800)
calls_vw = lambda: [c for c in ha_calls() if str(c[2]).startswith(("light.v_", "cover.v_"))]
ask_vw = lambda pg_, text: (pg_.evaluate("(x) => window.__fp.voiceAsk(x)", text), pg_.wait_for_timeout(700), pg_.inner_text("#findAnswer"))[2]   # the head line; the rows are in #findList
n0 = len(calls_vw())
txt = ask_vw(pgV, "Ist das Licht in der Stube an?")
check("voice switch: a question switches nothing", len(calls_vw()) == n0, (txt, calls_vw()[n0:]))
txt = ask_vw(pgV, "Licht in der Stube aus")
check("voice switch: 'Licht in der Stube aus' turns off the lamp that is on (not the one that is off already) and says so",
      calls_vw()[n0:] == [["light", "turn_off", "light.v_decke"]] and "aus: 1" in txt and "Stube" in txt, (txt, calls_vw()[n0:]))
n1 = len(calls_vw())
txt = ask_vw(pgV, "Rollläden in der Stube runter")
check("voice switch: 'Rollläden in der Stube runter' closes the window's roller shutter", calls_vw()[n1:] == [["cover", "close_cover", "cover.v_rollo"]], (txt, calls_vw()[n1:]))
n2 = len(calls_vw())
txt = ask_vw(pgV, "Alle Lichter aus")
check("voice switch: 'Alle Lichter aus' in the whole house asks first, nothing is switched yet", "ganzen Haus" in txt and "Ja, aus" in pgV.inner_text("#findList") and len(calls_vw()) == n2,
      (txt, pgV.inner_text("#findList")))
pgV.locator("#findList", has_text="Ja, aus").locator("text=Ja, aus").first.click(); pgV.wait_for_timeout(900)
done = calls_vw()[n2:]
check("voice switch: '✓ Ja, aus' switches every lamp that is on (the ceiling lamp is off already)", {c[2] for c in done} >= {"light.v_kueche", "light.v_flur", "light.v_bad"}
      and all(c[:2] == ["light", "turn_off"] for c in done) and not {"light.v_steh", "light.v_decke"} & {c[2] for c in done}, done)
pgV.close()
set_setting("userLocks", {**(api("api/settings").get("userLocks") or {}), "vwtablet": ["control"]})
pgW = page_vw("vwtablet")
n3 = len(calls_vw())
txt = ask_vw(pgW, "Licht in der Stube an")
check("voice switch: a user with the lock 'Steuern' is told so, nothing is switched", "gesperrt" in txt and len(calls_vw()) == n3, txt)
pgW.close()
check("voice switch: no errors on the page", not own_vw, own_vw[:3])
for k in ("userLocks", "voice", "language"):
    set_setting(k, st_vw.get(k, {} if k == "userLocks" else ""))
mock_vw("/_extra", {})
