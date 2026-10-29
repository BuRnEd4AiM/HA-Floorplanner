"""4.43.0 (#590): ▶ Abläufe by room (the owner: "eine gruppierung nach räumen in HA das man das direkt sieht ein und aus klappen kann";
his choice: the big buttons, the own routines, the automations and the scenes, each in every room it uses, all closed at first, what has
no room open on top, both views to switch). Two areas in Home Assistant: a scene in the Büro, an automation that switches lights in the
Wohnzimmer and the Büro, a script without a room. The lists show the rooms closed with their names, a tap opens one, "Alle aufklappen"
opens all; 🏠 Nach Räumen puts everything of a room in one card and stays after a reload, the rooms closed again.
"""
st_rg = api("api/settings")
set_setting("language", "de")
def post_rg(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
post_rg("/_areas", [{"id": "wz", "name": "Wohnzimmer", "entities": ["light.wohnzimmer", "cover.rollo"]},
                    {"id": "rg_buero", "name": "Büro", "entities": ["light.rg_buero", "scene.rg_buero"]}])
post_rg("/_extra", {
    "light.rg_buero": {"state": "off", "attributes": {"friendly_name": "Bürolicht"}},
    "scene.rg_buero": {"state": "unknown", "attributes": {"friendly_name": "Büro hell", "entity_id": ["light.rg_buero"]}},
    "script.rg_kaffee": {"state": "off", "attributes": {"friendly_name": "Kaffee kochen"}},
    "automation.rg_beide": {"state": "on", "attributes": {"friendly_name": "Licht überall", "last_triggered": "2026-10-28T19:00:00+00:00", "current": 0}},
})
post_rg("/_related", {"related": {}, "configs": {"automation.rg_beide": {"trigger": [{"platform": "time", "at": "19:00:00"}],
                                                                      "action": [{"service": "light.turn_on", "target": {"entity_id": ["light.wohnzimmer", "light.rg_buero"]}}]}}})
own_rg = []
pgR = b.new_page(viewport={"width": 1400, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgR.on("console", lambda m: own_rg.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgR.on("pageerror", lambda e: own_rg.append("PAGEERROR " + str(e)))
def wait_rg(fn, n=40, ms=250):
    for _ in range(n):
        v = fn()
        if v: return v
        pgR.wait_for_timeout(ms)
    return fn()
def open_rg():
    pgR.goto(BASE + "?debug=1"); pgR.wait_for_timeout(1500)
    if pgR.is_visible("#modeSwitch [data-mode=live]"): pgR.click("#modeSwitch [data-mode=live]"); pgR.wait_for_timeout(800)
    pgR.click("#tabBar [data-tab=routines]"); pgR.wait_for_timeout(1000)
P = "[data-page=routines] "
open_rg()
pgR.evaluate("localStorage.removeItem('fp3d.routinesView')")
open_rg()
wait_rg(lambda: pgR.locator(P + ".roAutos .rgRoom").count() >= 2)
check("by room: the switch '☰ Nach Listen / 🏠 Nach Räumen' is there, the lists are chosen",
      pgR.locator(P + ".rgView [data-view=lists].on").count() == 1 and pgR.locator(P + ".rgView [data-view=rooms]").count() == 1)
autos_rg = pgR.evaluate(f"[...document.querySelectorAll('{P}.roAutos .rgRoom')].map((r) => [r.dataset.room, r.classList.contains('open'), r.innerText])")
check("by room: the automation that switches lights in two rooms is in both, closed, with its name on the line",
      [x[0] for x in autos_rg][:2] == ["rg_buero", "wz"] and not any(x[1] for x in autos_rg) and all("Licht überall" in x[2] for x in autos_rg[:2])
      and pgR.locator(P + ".roAutos [data-auto='automation.rg_beide']").count() == 0, autos_rg)
check("by room: the script without a room stays a big button on top, the scene of the Büro is in the card of the buttons by room",
      pgR.locator(P + ".rtGrid > .bdItem [data-routine='script.rg_kaffee'], " + P + ".rtGrid > [data-routine='script.rg_kaffee']").count() == 1
      and pgR.locator(P + ".roTiles .rgRoom[data-room=rg_buero]").count() == 1 and pgR.locator(P + ".roTiles [data-routine='scene.rg_buero']").count() == 0)
pgR.click(P + ".roAutos .rgRoom[data-room=rg_buero] .rgHead")
opened_rg = wait_rg(lambda: pgR.locator(P + ".roAutos .rgRoom[data-room=rg_buero].open div[data-auto='automation.rg_beide']").count() == 1)
check("by room: a tap opens the room, the automation's line is there (the other room stays closed)",
      opened_rg and pgR.locator(P + ".roAutos .rgRoom[data-room=wz].open").count() == 0)
pgR.click(P + ".scCard [data-rg-all=open]")
all_rg = wait_rg(lambda: pgR.locator(P + ".scCard .rgRoom").count() > 0 and pgR.locator(P + ".scCard .rgRoom:not(.open)").count() == 0)
check("by room: 'Alle aufklappen' opens every room of the scenes", all_rg and pgR.locator(P + ".scCard [data-scene='scene.rg_buero']").count() == 1,
      pgR.inner_text(P + ".scCard")[:400])
pgR.click(P + ".scCard [data-rg-all=close]")
check("by room: 'Alle zuklappen' closes them again", wait_rg(lambda: pgR.locator(P + ".scCard .rgRoom.open").count() == 0))
pgR.click(P + ".rgView [data-view=rooms]")
rooms_rg = wait_rg(lambda: pgR.locator(P + ".roRooms").count() == 1)
check("by room: 🏠 Nach Räumen is one card of the rooms, the cards of the lists are gone",
      rooms_rg and pgR.locator(P + ".roAutos").count() == 0 and pgR.locator(P + ".scCard").count() == 0 and pgR.locator(P + ".roRooms .rgRoom[data-room=rg_buero]").count() == 1)
pgR.click(P + ".roRooms .rgRoom[data-room=rg_buero] .rgHead")
wait_rg(lambda: pgR.locator(P + ".roRooms .rgRoom[data-room=rg_buero].open").count() == 1)
body_rg = pgR.inner_text(P + ".roRooms .rgRoom[data-room=rg_buero]")
check("by room: the Büro opened has its button, its automation and its scene together",
      pgR.locator(P + ".roRooms .rgRoom[data-room=rg_buero] [data-routine='scene.rg_buero']").count() == 1
      and pgR.locator(P + ".roRooms .rgRoom[data-room=rg_buero] div[data-auto='automation.rg_beide']").count() == 1
      and pgR.locator(P + ".roRooms .rgRoom[data-room=rg_buero] [data-scene='scene.rg_buero']").count() == 1, body_rg[:400])
open_rg()
check("by room: after a reload the page keeps 🏠 Nach Räumen, the rooms closed again",
      wait_rg(lambda: pgR.locator(P + ".roRooms").count() == 1) and pgR.locator(P + ".rgRoom.open").count() == 0)
pgR.click(P + ".rgView [data-view=lists]")
wait_rg(lambda: pgR.locator(P + ".roAutos").count() == 1)
check("by room: no errors on the page", not own_rg, own_rg)
pgR.evaluate("localStorage.removeItem('fp3d.routinesView')")
pgR.close()
post_rg("/_areas", [])
post_rg("/_extra", {})
post_rg("/_related", {"related": {}, "configs": {}})
set_setting("language", st_rg.get("language", "de"))
