"""4.2.0 (#471), quick access: "💡 n an" at the top with the whole house and groups of rooms (the first tap on "Aus" asks, the second
switches only that group's lights), favourites in front of the room tiles (a tap starts a scene or toggles a lamp, ☆ / ★ on a device's
card), "An / offen" in the device list, low batteries open it at "Batterie", the groups and favourites in ⚙ → "Schnellzugriff"; in the
editor "Gelöscht · Rückgängig" after a deletion, the card of keys ("?") and the pieces placed last on top of the library.
"""
saved_qa = api_admin("api/layout")              # put back at the end
st_qa = api("api/settings")
set_setting("language", "de")
set_setting("roomTiles", True)
def extra_qa(body):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
extra_qa({
    "light.qa_1": {"state": "on", "attributes": {"friendly_name": "Licht Kind 1"}},
    "light.qa_2": {"state": "on", "attributes": {"friendly_name": "Licht Kind 2"}},
    "light.qa_3": {"state": "on", "attributes": {"friendly_name": "Licht Arbeiten"}},
    "scene.qa_kino": {"state": "unknown", "attributes": {"friendly_name": "Kino"}},
    "sensor.qa_bat": {"state": "12", "attributes": {"friendly_name": "Fühler Batterie", "device_class": "battery", "unit_of_measurement": "%"}},
})
# three rooms of their own far from the test house, a lamp in each, a battery sensor in one
lay = json.loads(json.dumps(saved_qa))
f0 = lay["floors"][0]
f0.setdefault("rooms", []).extend([
    {"id": "qa_a", "name": "Kind 1", "color": "#8a7f70", "points": [[90, 90], [94, 90], [94, 94], [90, 94]]},
    {"id": "qa_b", "name": "Kind 2", "color": "#8a7f70", "points": [[94, 90], [98, 90], [98, 94], [94, 94]]},
    {"id": "qa_c", "name": "Arbeiten", "color": "#8a7f70", "points": [[98, 90], [102, 90], [102, 94], [98, 94]]}])
f0.setdefault("devices", []).extend([
    {"id": f"qa_d{i}", "type": "light", "x": x, "z": 92, "y": 2.55, "rot": 0, "scale": 1, "name": f"QA Licht {i}", "entity": f"light.qa_{i}"}
    for i, x in ((1, 92), (2, 96), (3, 100))] + [
    {"id": "qa_bat", "type": "sensor", "x": 101, "z": 93, "y": 1.5, "rot": 0, "scale": 1, "name": "QA Fühler", "entity": "sensor.qa_bat"}])
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("favorites", ["scene.qa_kino", "light.qa_3", "lock.never"])
set_setting("lightGroups", [{"id": "qa_kids", "name": "Kinder", "rooms": ["qa_a", "qa_b", "gone"]}])
check("quick access (#471): the add-on keeps favourites one tap can use and the groups", api("api/settings")["favorites"] == ["scene.qa_kino", "light.qa_3"]
      and api("api/settings")["lightGroups"] == [{"id": "qa_kids", "name": "Kinder", "rooms": ["qa_a", "qa_b", "gone"]}], api("api/settings")["favorites"])

pgQ = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_qa = []
pgQ.on("console", lambda m: own_qa.append(m.text) if m.type == "error" else None)
pgQ.on("pageerror", lambda e: own_qa.append("PAGEERROR " + str(e)))
pgQ.goto(BASE + "?debug=1&mode=live"); pgQ.wait_for_timeout(2500)
pgQ.evaluate("window.__fp.switchFloor(0)"); pgQ.wait_for_timeout(600)
calls = lambda: [c for c in ha_calls() if any("qa_" in str(x) for x in (c[2] if isinstance(c[2], list) else [c[2]]))]
n_calls = len(calls())

# --- the light list
pill = pgQ.inner_text("#lightsPill")
check("lights (#471): '💡 n an' at the top counts the lights that are on (at least the three of the test rooms)",
      pgQ.is_visible("#lightsPill") and pill.startswith("💡") and int(pill.split()[1]) >= 3, pill)
pgQ.click("#lightsPill"); pgQ.wait_for_timeout(400)
rows = pgQ.evaluate("[...document.querySelectorAll('#lightsMenu .lgRow')].map((r) => [r.dataset.id, r.querySelector('.lgName').textContent.trim(), r.querySelector('.lgOn').textContent])")
check("lights: the list has the whole house first, then the group 'Kinder' with its 2 lights on", len(rows) == 2 and rows[0][0] == "*" and "Ganzes Haus" in rows[0][1]
      and rows[1][1] == "Kinder" and rows[1][2] == "2 an", rows)
pgQ.click("#lightsMenu .lgRow[data-id=qa_kids] .lgOff"); pgQ.wait_for_timeout(300)
check("lights: the first tap on 'Aus' only asks ('Sicher? Aus'), nothing is switched, the list stays open",
      pgQ.inner_text("#lightsMenu .lgRow[data-id=qa_kids] .lgOff") == "Sicher? Aus" and len(calls()) == n_calls and pgQ.is_visible("#lightsMenu"), calls()[n_calls:])
pgQ.click("#lightsMenu .lgRow[data-id=qa_kids] .lgOff"); pgQ.wait_for_timeout(1500)
new = [c[1:] for c in calls()[n_calls:]]
check("lights: the second tap switches off the lights of the group's rooms, not the others", sorted(new) == [["turn_off", "light.qa_1"], ["turn_off", "light.qa_2"]], new)
check("lights: the group then says 'alle aus' and has no button", pgQ.inner_text("#lightsMenu .lgRow[data-id=qa_kids] .lgOn") == "alle aus"
      and pgQ.locator("#lightsMenu .lgRow[data-id=qa_kids] .lgOff").count() == 0, pgQ.inner_text("#lightsMenu"))
pgQ.click("#lightsMenu .lgRow[data-id='*'] .lgOff"); pgQ.wait_for_timeout(300)
pgQ.wait_for_timeout(3400)                      # longer than CONFIRM_MS: the question is forgotten
check("lights: an unanswered 'Sicher?' goes back to 'Aus' after a few seconds", pgQ.inner_text("#lightsMenu .lgRow[data-id='*'] .lgOff") == "Aus")
pgQ.keyboard.press("Escape"); pgQ.wait_for_timeout(200)

# --- favourites
favs = pgQ.evaluate("[...document.querySelectorAll('#roomTiles [data-fav]')].map((b) => [b.dataset.fav, b.innerText.replace(/\\n+/g, ' | ')])")
check("favourites (#471): the scene and the lamp stand in front of the room tiles", [f[0] for f in favs] == ["scene.qa_kino", "light.qa_3"]
      and "Kino" in favs[0][1] and "Aktivieren" in favs[0][1] and "An" in favs[1][1]
      and pgQ.evaluate("document.querySelector('#roomTiles').firstElementChild.dataset.fav") == "scene.qa_kino", favs)
n2 = len(calls())
pgQ.click("#roomTiles [data-fav='scene.qa_kino']"); pgQ.wait_for_timeout(500)
pgQ.click("#roomTiles [data-fav='light.qa_3']"); pgQ.wait_for_timeout(1200)
new = [c for c in calls()[n2:]]
check("favourites: a tap starts the scene, a tap on the lamp toggles it", new == [["scene", "turn_on", "scene.qa_kino"], ["light", "toggle", "light.qa_3"]], new)
check("favourites: the lamp's button shows it off now", "Aus" in pgQ.inner_text("#roomTiles [data-fav='light.qa_3']"), pgQ.inner_text("#roomTiles [data-fav='light.qa_3']"))
pgQ.evaluate("window.__fp.showPopup('qa_d1')"); pgQ.wait_for_timeout(500)
check("favourites: ☆ on the card of a lamp that is no favourite", pgQ.inner_text("#livePopup .favStar") == "☆")
pgQ.click("#livePopup .favStar"); pgQ.wait_for_timeout(1200)
check("favourites: ☆ makes it one (★), stored, its button comes at the end", pgQ.inner_text("#livePopup .favStar") == "★"
      and api("api/settings")["favorites"] == ["scene.qa_kino", "light.qa_3", "light.qa_1"]
      and pgQ.evaluate("[...document.querySelectorAll('#roomTiles [data-fav]')].map((b) => b.dataset.fav)")[-1] == "light.qa_1", api("api/settings")["favorites"])
pgQ.keyboard.press("Escape"); pgQ.wait_for_timeout(300)
view_menu(pgQ); pgQ.click("#tilesToggle"); pgQ.wait_for_timeout(800); view_menu(pgQ); pgQ.click("#tilesToggle"); pgQ.wait_for_timeout(800)
check("favourites: a later change of another setting keeps the ★ (the settings form had the old list)",
      "light.qa_1" in api("api/settings")["favorites"] and api("api/settings")["roomTiles"] is True, api("api/settings")["favorites"])
pgQ.keyboard.press("Escape"); pgQ.wait_for_timeout(200)

# --- the device list: what is on, low batteries
check("batteries (#471): a low one turns the button orange", "lowbat" in (pgQ.get_attribute("#devicesPill", "class") or "") and "🪫" in pgQ.inner_text("#devicesPill"),
      pgQ.inner_text("#devicesPill"))
pgQ.click("#devicesPill"); pgQ.wait_for_timeout(500)
check("batteries: a tap opens the list at 'Batterie', the low sensor first", "Batterie" in pgQ.inner_text("#devicePanel .dl-filters .active")
      and pgQ.locator("#devicePanel .dl-row[data-id=qa_bat]").count() == 1, pgQ.inner_text("#devicePanel .dl-filters"))
pgQ.click("#devicePanel [data-filter=on]"); pgQ.wait_for_timeout(500)
ids = pgQ.evaluate("[...document.querySelectorAll('#devicePanel .dl-row')].map((r) => r.dataset.id)")
check("what is still on (#471): 'An / offen' lists the lamp that is on, not those switched off or the sensor",
      "qa_d1" not in ids and "qa_d2" not in ids and "qa_bat" not in ids and "An / offen" in pgQ.inner_text("#devicePanel .dl-filters .active"), ids)
pgQ.click("#devicePanel .dl-x"); pgQ.wait_for_timeout(300)

# --- ⚙ → Schnellzugriff
pgQ.click("#settingsBtn"); pgQ.wait_for_timeout(400)
open_setting(pgQ, "#lgGroups"); pgQ.wait_for_timeout(300)
boxes = pgQ.evaluate("[...document.querySelectorAll('#lgGroups .lgEdit')].map((w) => [w.querySelector('input').value, [...w.querySelectorAll('[data-room]:checked')].map((c) => c.dataset.room).sort()])")
check("quick access in ⚙: the group with its rooms ticked", boxes == [["Kinder", ["qa_a", "qa_b"]]], boxes)
pgQ.click("#lgGroups .lgEdit [data-room=qa_c]"); pgQ.wait_for_timeout(800)
check("quick access: ticking a room saves it, a room of another house stays", api("api/settings")["lightGroups"][0]["rooms"] == ["gone", "qa_b", "qa_a", "qa_c"]
      or sorted(api("api/settings")["lightGroups"][0]["rooms"]) == ["gone", "qa_a", "qa_b", "qa_c"], api("api/settings")["lightGroups"])
pgQ.click("#lgAdd"); pgQ.wait_for_timeout(800)
check("quick access: '+ Neue Gruppe' adds one", len(api("api/settings")["lightGroups"]) == 2 and api("api/settings")["lightGroups"][1]["name"] == "Gruppe 2", api("api/settings")["lightGroups"])
pgQ.fill("#favAdd", "Garage"); pgQ.click("#favAddBtn"); pgQ.wait_for_timeout(800)
check("quick access: a favourite added by its name", api("api/settings")["favorites"][-1] == "switch.garage", api("api/settings")["favorites"])
pgQ.fill("#favAdd", "climate.wohnzimmer"); pgQ.click("#favAddBtn"); pgQ.wait_for_timeout(300)
check("quick access: what one tap cannot use is refused with a word why", "nicht als Favorit" in pgQ.inner_text("#favMsg")
      and "climate.wohnzimmer" not in api("api/settings")["favorites"], pgQ.inner_text("#favMsg"))
pgQ.evaluate("document.querySelector('#favList .favRow:last-child .favDel').click()"); pgQ.wait_for_timeout(800)
check("quick access: × takes a favourite out", "switch.garage" not in api("api/settings")["favorites"], api("api/settings")["favorites"])
pgQ.keyboard.press("Escape"); pgQ.wait_for_timeout(300)

# --- the editor: keys, the note after a deletion, last used
pgQ.click("#modeSwitch [data-mode=edit]"); pgQ.wait_for_timeout(800)
pgQ.keyboard.press("?"); pgQ.wait_for_timeout(300)
check("keys (#471): '?' opens the card with every key, the tools among them", pgQ.evaluate("document.querySelector('#keysDialog').open")
      and "Messen" in pgQ.inner_text("#keysList") and "Strg" in pgQ.inner_text("#keysList"), pgQ.inner_text("#keysList")[:200])
pgQ.keyboard.press("Escape"); pgQ.wait_for_timeout(200)
pgQ.evaluate("window.__fp.select('device', 'qa_d2')"); pgQ.wait_for_timeout(300)
pgQ.keyboard.press("Delete"); pgQ.wait_for_timeout(400)
gone = not any(d["id"] == "qa_d2" for d in pgQ.evaluate("window.__fp.layout.floors[0].devices"))
check("undo note (#471): after a deletion 'Gelöscht · ↶ Rückgängig' shows", gone and pgQ.is_visible("#undoToast") and "Gelöscht" in pgQ.inner_text("#undoToast"),
      pgQ.inner_text("#undoToast") if pgQ.is_visible("#undoToast") else "hidden")
pgQ.click("#undoToast button"); pgQ.wait_for_timeout(600)
check("undo note: its button brings it back and the note goes", any(d["id"] == "qa_d2" for d in pgQ.evaluate("window.__fp.layout.floors[0].devices"))
      and not pgQ.is_visible("#undoToast"))
pgQ.click("#tools [data-tool=device]"); pgQ.wait_for_timeout(300)
pgQ.click("#paletteSearch"); pgQ.fill("#paletteSearch", ""); pgQ.wait_for_timeout(100)
key = pgQ.evaluate("(() => { const b = [...document.querySelectorAll('#paletteGrid button.dev')][3]; b.click(); return window.__fp.layout && document.querySelector('#paletteGrid button.dev.active')?.querySelector('span')?.textContent; })()")
vb = pgQ.locator("#view").bounding_box()
n_dev = len(pgQ.evaluate("window.__fp.layout.floors[0].devices"))
pgQ.mouse.click(vb["x"] + vb["width"] / 2, vb["y"] + vb["height"] / 2); pgQ.wait_for_timeout(600)
rec = pgQ.evaluate("[...document.querySelectorAll('#paletteRecent [data-recent] span')].map((s) => s.textContent)")
check("last used (#471): a piece placed stands on top of the library", len(pgQ.evaluate("window.__fp.layout.floors[0].devices")) == n_dev + 1
      and rec[:1] == [key] and pgQ.is_visible("#paletteRecent"), (key, rec))
pgQ.keyboard.press("Escape"); pgQ.keyboard.press("Control+z"); pgQ.wait_for_timeout(500)
check("quick access: no errors on the page", not own_qa, own_qa[:3])
pgQ.close()

urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_qa).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("favorites", st_qa.get("favorites", []))
set_setting("lightGroups", st_qa.get("lightGroups", []))
set_setting("roomTiles", st_qa.get("roomTiles", True))
set_setting("language", st_qa["language"])
extra_qa({})
