"""5.27.0, two wishes of FrankBecker:
#779 „Rollläden für Schiebetüren“: a door (sliding, glass, double, single) can have a roller shutter like a window, and a roller shutter can be
two or three side by side, each with its own motor („Anzahl Rollläden“, one entity each). In 3D each part follows its own cover; the card has
„Alle · 1 · 2“. A garage door has no such tick.
#780 „Geräte als nicht relevant markierbar“: „🔕 Nicht überwachen“ on a device, a door / window and a whole floor (the flat upstairs that
belongs to someone else): never offline. In the list of offline devices a 🔕 beside each row and a button for a whole floor. In the new
panel („✨ Neu“) the fields are in their sections and the search finds them.
"""
saved_dn = api_admin("api/layout")              # put back at the end
st_dn = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_dn(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
lay_dn = json.loads(json.dumps(saved_dn))
f0_dn = lay_dn["floors"][0]
f0_dn.setdefault("walls", []).append({"id": "dn_w", "a": [80, 80], "b": [90, 80], "thickness": 0.24, "height": 2.6, "openings": [
    {"id": "dn_door", "type": "door", "style": "sliding", "pos": 3, "width": 2.4, "height": 2.1, "sill": 0, "name": "Schiebetür DN"},
    {"id": "dn_gar", "type": "door", "style": "garage", "pos": 7, "width": 2.5, "height": 2.1, "sill": 0, "name": "Garage DN"}]})
f0_dn.setdefault("rooms", []).append({"id": "dn_room", "name": "Wohnen DN", "color": "#777777", "points": [[80, 80], [90, 80], [90, 85], [80, 85]]})
f0_dn.setdefault("devices", []).extend([
    {"id": "dn_l1", "type": "light", "x": 82, "z": 82, "y": 2.4, "rot": 0, "scale": 1, "name": "Lampe DN"},                       # linked to nothing
    {"id": "dn_l2", "type": "light", "x": 84, "z": 82, "y": 2.4, "rot": 0, "scale": 1, "name": "Lampe weg DN", "entity": "light.dn_gone"}])
lay_dn["floors"].append({"id": "dn_og", "name": "Fremde Wohnung", "kind": "floor", "walls": [], "rooms": [], "blocks": [], "stairs": [], "devices": [
    {"id": "dn_o1", "type": "light", "x": 1, "z": 1, "y": 2.4, "rot": 0, "scale": 1, "name": "Lampe oben 1"},
    {"id": "dn_o2", "type": "light", "x": 2, "z": 1, "y": 2.4, "rot": 0, "scale": 1, "name": "Lampe oben 2"}]})
fi_og = len(lay_dn["floors"]) - 1
put_dn(lay_dn)
own_dn = []
pgD = b.new_page(viewport={"width": 1440, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgD.on("console", lambda m: own_dn.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgD.on("pageerror", lambda e: own_dn.append("PAGEERROR " + str(e)))
pgD.goto(BASE + "?debug=1&mode=edit"); pgD.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgD.wait_for_timeout(1000)
pgD.evaluate("window.__fp.switchFloor(0)"); pgD.wait_for_timeout(600)
door_dn = lambda: pgD.evaluate("window.__fp.layout.floors[0].walls.flatMap((w) => w.openings || []).find((o) => o.id === 'dn_door')")
dev_dn = lambda fi, i: pgD.evaluate(f"window.__fp.layout.floors[{fi}].devices.find((d) => d.id === '{i}')")
off_ids = lambda: sorted({x["id"] for x in pgD.evaluate("window.__fp.offline()") if x["id"].startswith("dn_")})

# ---- #779: the roller shutter of a sliding door, two side by side
pgD.evaluate("window.__fp.select('opening', 'dn_gar')"); pgD.wait_for_timeout(400)
check("#779: a garage door has no tick „Vorhang / Rollladen“ (it rolls up itself)", pgD.locator("#openShutter").count() == 0)
pgD.evaluate("window.__fp.select('opening', 'dn_door')"); pgD.wait_for_timeout(400)
check("#779: a sliding door has the tick „Vorhang / Rollladen“, off at first", pgD.locator("#openShutter").count() == 1 and not pgD.locator("#openShutter").is_checked())
pgD.locator("#openShutter").check(); pgD.wait_for_timeout(500)
check("#779: ticked: the door has a shutter, „Anzahl Rollläden (Motoren)“ is 1 and there is one entity field",
      door_dn().get("shutter") is True and pgD.locator("#shutterParts").input_value() == "1" and pgD.locator("#propsBody [data-part]").count() == 0
      and "Anzahl Rollläden" in pgD.inner_text("#propsBody"), door_dn())
pgD.fill("#shutterParts", "2"); pgD.locator("#shutterParts").dispatch_event("change"); pgD.wait_for_timeout(500)
check("#779: „Anzahl Rollläden“ 2: stored, and two entity fields „Rollladen 1“, „Rollladen 2“",
      door_dn().get("shutterParts") == 2 and pgD.locator("#propsBody [data-part]").count() == 2
      and "Rollladen 1" in pgD.inner_text("#propsBody") and "Rollladen 2" in pgD.inner_text("#propsBody"), door_dn())
pgD.evaluate("""() => { const o = window.__fp.layout.floors[0].walls.flatMap((w) => w.openings || []).find((x) => x.id === 'dn_door');
  o.shutterEntity = 'cover.dn_l'; o.shutterMore = ['cover.dn_r'];
  const s = window.__fp.states(); s['cover.dn_l'] = { state: 'open', position: 100, name: 'Rollladen links DN' }; s['cover.dn_r'] = { state: 'open', position: 30, name: 'Rollladen rechts DN' };
  window.__fp.rebuild(); window.__fp.applyStates(); }"""); pgD.wait_for_timeout(600)
sc_dn = pgD.evaluate("window.__fp.shutterScales('dn_door')")
check("#779: in 3D two roller shutters, each follows its own cover (100 % open: rolled up, 30 % open: 70 % down)",
      len(sc_dn) == 2 and abs(sc_dn[0] - 0.05) < 0.01 and abs(sc_dn[1] - (0.05 + 0.95 * 0.7)) < 0.01, sc_dn)
lab_dn = pgD.evaluate("window.__fp.badge('dn_door')")
check("#779: the label over the door names both, short: „↕ 100 % · 30 %“", lab_dn == "↕ 100 % · 30 %", lab_dn)

pgD.click("#modeSwitch button[data-mode=live]"); pgD.wait_for_timeout(1200)
pgD.evaluate("window.__fp.camAt(85, window.__fp.elev(0) + 4, 74, 83, 80)"); pgD.wait_for_timeout(900)
bs_dn = pgD.evaluate("window.__fp.ballScreen('dn_door')")
check("#779: live, a ball on top of the door", bool(bs_dn), bs_dn)
if bs_dn:
    pgD.mouse.click(bs_dn["x"], bs_dn["y"]); pgD.wait_for_timeout(700)
parts_dn = pgD.locator("#livePopup #shutterParts button").all_inner_texts() if pgD.is_visible("#livePopup") else []
check("#779: the card has „Alle · 1 · 2“, „Alle“ chosen", parts_dn == ["Alle", "1", "2"] and pgD.get_attribute("#livePopup #shutterParts button.on", "data-part") == "0", parts_dn)
if pgD.locator("#livePopup .shutterPresets button").count() == 5:
    pgD.locator("#livePopup .shutterPresets button").nth(0).click(); pgD.wait_for_timeout(900)
cd_dn = json.load(urllib.request.urlopen(HA + "/_calldata"))
check("#779: „Alle“ and 0 %: both covers are sent down", ["set_cover_position", "cover.dn_l", 0] in cd_dn and ["set_cover_position", "cover.dn_r", 0] in cd_dn, cd_dn[-4:])
n_calls = len(cd_dn)
if pgD.locator("#livePopup #shutterParts button[data-part='2']").count():
    pgD.locator("#livePopup #shutterParts button[data-part='2']").click(); pgD.wait_for_timeout(500)
if pgD.locator("#livePopup .shutterPresets button").count() == 5:
    pgD.locator("#livePopup .shutterPresets button").nth(2).click(); pgD.wait_for_timeout(900)
cd2_dn = json.load(urllib.request.urlopen(HA + "/_calldata"))[n_calls:]
check("#779: „2“ and 50 %: only the second one moves", ["set_cover_position", "cover.dn_r", 50] in cd2_dn and not any(c[1] == "cover.dn_l" for c in cd2_dn if len(c) > 1), cd2_dn)
pgD.keyboard.press("Escape"); pgD.wait_for_timeout(300)

# ---- #780: 🔕 in the list of offline devices
check("#780: at first the lamps without an entity or gone are offline, also those of the floor „Fremde Wohnung“",
      off_ids() == ["dn_l1", "dn_l2", "dn_o1", "dn_o2"], off_ids())
pgD.evaluate("document.querySelector('#offlinePill').click()"); pgD.wait_for_timeout(600)
fbtn = pgD.locator("#offlineFoot .offLeaveFloor", has_text="Fremde Wohnung")
check("#780: every row has a 🔕 button, and the floor „Fremde Wohnung“ one of its own",
      pgD.locator("#offlineList li.withLeave .offLeave").count() == pgD.locator("#offlineList li").count() > 0 and fbtn.count() == 1,
      pgD.inner_text("#offlineDialog"))
if fbtn.count():
    fbtn.click(); pgD.wait_for_timeout(700)
check("#780: the floor button leaves the whole floor out: stored, its lamps gone from the list, a line says what is not watched",
      pgD.evaluate(f"window.__fp.layout.floors[{fi_og}].noWatch") is True and off_ids() == ["dn_l1", "dn_l2"]
      and "Fremde Wohnung" in pgD.inner_text("#offlineLeft"), (off_ids(), pgD.inner_text("#offlineFoot")))
row = pgD.locator("#offlineList li", has_text="Lampe DN")
if row.count():
    row.first.locator(".offLeave").click(); pgD.wait_for_timeout(700)
check("#780: 🔕 on a row leaves only that lamp out", dev_dn(0, "dn_l1").get("noWatch") is True and off_ids() == ["dn_l2"]
      and "1 einzeln" in pgD.inner_text("#offlineLeft"), (off_ids(), pgD.inner_text("#offlineFoot")))
pgD.evaluate("document.querySelector('#offlineDialog').close()")
# 5.28.1 (the owner: „im Bearbeitungsmodus … angezeigt … dass es nicht überwacht wird und im Live-Modus … so wie man es hat“)
rail_og = lambda: pgD.evaluate(f"document.querySelector('#floorRail .floorThumb[data-floor=\"{fi_og}\"] span')?.textContent || ''")
mark_l1 = lambda: pgD.evaluate("window.__fp.offMark('dn_l1')")
check("🔕 live: no sign over the lamp left out, the floor left out has no 🔕 on its button (live stays as it was)",
      mark_l1() is None and rail_og() == "Fremde Wohnung", (mark_l1(), rail_og()))

pgD.click("#modeSwitch button[data-mode=edit]"); pgD.wait_for_timeout(900)
pgD.evaluate("window.__fp.switchFloor(0)"); pgD.wait_for_timeout(500)
check("🔕 editor: a grey 🔕 sign over the lamp left out in 3D, none over the lamp that is watched (its offline sign stays)",
      mark_l1() == "nowatch" and pgD.evaluate("window.__fp.offMark('dn_l2')") == "offline", (mark_l1(), pgD.evaluate("window.__fp.offMark('dn_l2')")))
check("🔕 editor: the floor left out has 🔕 before its name on its button, with a line how to undo it",
      rail_og() == "🔕 Fremde Wohnung" and "Etage verwalten" in (pgD.get_attribute(f"#floorRail .floorThumb[data-floor='{fi_og}']", "title") or ""), rail_og())
pgD.click("#view2d"); pgD.wait_for_timeout(700)
check("🔕 editor, 2D plan: a small 🔕 at the lamp left out, not at the one that is watched",
      pgD.locator("#plan2d .noWatch2d[data-id='dn_l1']").count() == 1 and pgD.locator("#plan2d .noWatch2d[data-id='dn_l2']").count() == 0,
      pgD.locator("#plan2d .noWatch2d").count())
pgD.click("#view3d"); pgD.wait_for_timeout(500)
pgD.evaluate("window.__fp.select('device', 'dn_l1')"); pgD.wait_for_timeout(400)
check("#780: the lamp's properties show the tick „🔕 Nicht überwachen“ set", pgD.locator("#devNoWatch").is_checked(), pgD.inner_text("#propsBody")[-300:])
pgD.locator("#devNoWatch").uncheck(); pgD.wait_for_timeout(600)
check("#780: untick: watched again, offline again", "noWatch" not in dev_dn(0, "dn_l1") and "dn_l1" in off_ids(), off_ids())
check("🔕 editor: untick: the 🔕 sign is gone, the offline sign is back", mark_l1() == "unlinked", mark_l1())
pgD.evaluate("window.__fp.select('opening', 'dn_door')"); pgD.wait_for_timeout(400)
check("#780: a door has the tick too", pgD.locator("#openNoWatch").count() == 1 and not pgD.locator("#openNoWatch").is_checked())
pgD.evaluate(f"window.__fp.switchFloor({fi_og})"); pgD.wait_for_timeout(600)
pgD.evaluate("document.querySelector('#floorPanel').open = true"); pgD.wait_for_timeout(300)
check("#780: „Etage verwalten“ shows „🔕 Etage nicht überwachen“ set", pgD.locator("#floorNoWatch").is_checked())
pgD.evaluate("window.__fp.select('device', 'dn_o1')"); pgD.wait_for_timeout(400)
check("#780: on that floor the tick of a lamp is set and greyed out, a line says why", pgD.locator("#devNoWatch").is_checked() and pgD.locator("#devNoWatch").is_disabled()
      and "ganze Etage" in pgD.inner_text("#devNoWatchHint"), pgD.inner_text("#propsBody")[-300:])
pgD.locator("#floorNoWatch").uncheck(); pgD.wait_for_timeout(600)
check("#780: the floor's tick off: its lamps are offline again", pgD.evaluate(f"window.__fp.layout.floors[{fi_og}].noWatch") is None
      and {"dn_o1", "dn_o2"} <= set(off_ids()), off_ids())
check("🔕 editor: the floor's tick off: no 🔕 on its button any more", rail_og() == "Fremde Wohnung", rail_og())

# ---- ✨ Neu (the owner, 2026-11-10: „bitte vergiss nicht die Ansicht in der v2“)
pgD.goto(BASE + "?debug=1&mode=edit&ui=2"); pgD.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgD.wait_for_timeout(1000)
pgD.evaluate("window.__fp.switchFloor(0)"); pgD.wait_for_timeout(600)
pgD.click("#v2Tree .n.floor.on"); pgD.wait_for_selector("#v2Floor", timeout=5000); pgD.wait_for_timeout(300)
wsec = pgD.locator("#v2Floor .v2Sec[data-sec=watch]")
check("#780 / ✨ Neu: the floor card has a section 🔕 „Überwachen“ with the floor's tick", wsec.count() == 1 and wsec.locator("#floorNoWatch").count() == 1,
      pgD.inner_text("#v2Floor")[:400])
pgD.evaluate("window.__fp.select('opening', 'dn_door')"); pgD.wait_for_timeout(600)
sec_dn = pgD.locator("#propsBody .v2Sec[data-sec=shutter]")
check("#779 / ✨ Neu: a door has the section 🎚 with „Anzahl Rollläden“ and its line says „2 Rollläden“",
      pgD.evaluate("document.body.classList.contains('uiV2')") and sec_dn.count() == 1 and sec_dn.locator("#shutterParts").count() == 1
      and "2 Rollläden" in sec_dn.inner_text(), sec_dn.inner_text() if sec_dn.count() else pgD.inner_text("#propsBody")[:400])
pgD.fill("#v2Search", "Anzahl Rollläden"); pgD.wait_for_timeout(500)
check("#779 / ✨ Neu: „🔍 Einstellung suchen“ finds „Anzahl Rollläden“", pgD.is_visible("#shutterParts") and "Treffer" in pgD.inner_text("#v2SearchRes"), pgD.inner_text("#v2SearchRes"))
pgD.fill("#v2Search", "überwachen"); pgD.wait_for_timeout(500)
check("#780 / ✨ Neu: the search finds „🔕 Nicht überwachen“ of the door", pgD.is_visible("#openNoWatch") and "Treffer" in pgD.inner_text("#v2SearchRes"), pgD.inner_text("#v2SearchRes"))
pgD.fill("#v2Search", ""); pgD.wait_for_timeout(200)
pgD.evaluate("window.__fp.select('device', 'dn_l2')"); pgD.wait_for_timeout(600)
check("#780 / ✨ Neu: a device has it in its open section 🔗 (with the entity)", pgD.locator("#propsBody .v2Sec[data-sec=entity] #devNoWatch").is_visible())
pgD.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
check("#779 / #780: no errors on the page", not own_dn, own_dn[:5])
pgD.close()
put_dn(saved_dn)
set_setting("language", st_dn.get("language", "de")); set_setting("units", st_dn.get("units", "metric"))
