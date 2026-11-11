"""5.5.0 (the owner, 2026-11-11: "selbst wenn ich oben Gebäude 1 auswähle, werden mir Geräte und Automatisierungen von Gebäude 2
angezeigt, auch in allen Dashboards"): the building at the top and the rest of Home Assistant.
Two buildings; house B has a lamp in the plan, the other things of its area are not in the plan (a lamp, the TV, a lock), an area called
like one of its rooms, an area with nothing in the plan (the cellar), a scene, a script and automations (one names the cellar's area).
With house A at the top: an own page leaves out B's cards and B's rows of a mixed card, 🎵 Musik & TV its TV, ▶ Abläufe its buttons,
scenes and automations, "Ich gehe" neither lists nor stops its TV and lock, the favourites and the scene bar leave B's out; the cellar
(no building yet) still shows. The panel "🏘 Gebäude in diesem Plan": every area with "automatisch (…)", what is in no building; house
B chosen for the cellar: gone with house A, there with house B. A user who may not edit gets what the automations use too. ✨ Neu
(?ui=2): the panel with the areas under "Haus".
"""
saved_bs = api_admin("api/layout")              # put back at the end
st_bs = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def post_bs(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
def put_bs(path, body):
    r = urllib.request.urlopen(urllib.request.Request(BASE + path, data=json.dumps(body).encode(), method="PUT",
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
    return json.load(r)
sq_bs = lambda x0, z0, x1, z1: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
lay_bs = json.loads(json.dumps(saved_bs))
lay_bs["buildings"] = [{"id": "bsA", "name": "Haus A"}, {"id": "bsB", "name": "Haus B"}]
f_bs = lay_bs["floors"][0]
f_bs.setdefault("rooms", []).extend([{"id": "bs_ra", "name": "Stube A", "points": sq_bs(70, 70, 74, 73), "building": "bsA", "area": "bs_a_stube"},
                                     {"id": "bs_rb", "name": "Stube B", "points": sq_bs(80, 70, 84, 73), "building": "bsB"},
                                     {"id": "bs_rw", "name": "Werkstatt B", "points": sq_bs(84, 70, 88, 73), "building": "bsB"}])
dev_bs = lambda i, x, e: {"id": i, "type": "ceiling_light", "x": x, "z": 71, "y": 2.4, "rot": 0, "scale": 1, "entity": e}
f_bs.setdefault("devices", []).extend([dev_bs("bs_da", 71, "light.bs_a"), dev_bs("bs_db", 81, "light.bs_b")])
put_bs("api/layout", lay_bs)
n_bs = lambda name, **a: {"friendly_name": name, **a}
post_bs("/_extra", {
    "light.bs_a": {"state": "on", "attributes": n_bs("Lampe A")}, "light.bs_b": {"state": "on", "attributes": n_bs("Lampe B")},
    "light.bs_b_steh": {"state": "on", "attributes": n_bs("Stehlampe B")}, "light.bs_b_keller": {"state": "on", "attributes": n_bs("Kellerlicht B")},
    "media_player.bs_a_tv": {"state": "playing", "attributes": n_bs("Fernseher A", media_title="Film A")},
    "media_player.bs_b_tv": {"state": "playing", "attributes": n_bs("Fernseher B", media_title="Film B")},
    "lock.bs_b": {"state": "unlocked", "attributes": n_bs("Schloss B")}, "switch.bs_b_saege": {"state": "on", "attributes": n_bs("Säge B")},
    "scene.bs_b": {"state": "unknown", "attributes": n_bs("Szene B", entity_id=["light.bs_b_steh"])},
    "script.bs_b": {"state": "off", "attributes": n_bs("Skript B")}, "script.bs_a": {"state": "off", "attributes": n_bs("Skript A")},
    "automation.bs_a": {"state": "on", "attributes": n_bs("Automation A", id="bs1")}, "automation.bs_b": {"state": "on", "attributes": n_bs("Automation B", id="bs2")},
    "automation.bs_bk": {"state": "on", "attributes": n_bs("Automation Keller B", id="bs3")}, "automation.bs_frei": {"state": "on", "attributes": n_bs("Automation Sonne", id="bs4")}})
post_bs("/_areas", [{"id": "bs_a_stube", "name": "Stube A", "entities": ["light.bs_a", "media_player.bs_a_tv"]},
                    {"id": "bs_b_stube", "name": "Wohnen B", "entities": ["light.bs_b", "light.bs_b_steh", "media_player.bs_b_tv", "lock.bs_b"]},
                    {"id": "bs_b_werk", "name": "werkstatt b", "entities": ["switch.bs_b_saege"]},
                    {"id": "bs_b_keller", "name": "Keller B", "entities": ["light.bs_b_keller"]}])
on_bs = lambda **target: {"alias": "x", "trigger": [{"platform": "sun", "event": "sunset"}], "action": [{"service": "light.turn_on", "target": target}]}
post_bs("/_related", {"related": {}, "configs": {"automation.bs_a": on_bs(entity_id="light.bs_a"), "automation.bs_b": on_bs(entity_id="light.bs_b_steh"),
                                                 "automation.bs_bk": on_bs(area_id="bs_b_keller"), "automation.bs_frei": {"trigger": [{"platform": "state", "entity_id": "sun.sun"}], "action": []},
                                                 "script.bs_b": {"sequence": [{"service": "media_player.turn_off", "target": {"entity_id": "media_player.bs_b_tv"}}]},
                                                 "script.bs_a": {"sequence": [{"service": "light.turn_off", "target": {"entity_id": "light.bs_a"}}]}}})
card_bs = lambda i, t, **k: {"id": f"c_bs{i}", "type": t, "name": "", "width": 1, **k}
set_setting("customTabs", [*(st_bs.get("customTabs") or []), {"id": "p_bsseite", "name": "Beide", "icon": "🏘"}])
set_setting("pageLayouts", {**(st_bs.get("pageLayouts") or {}), "p_bsseite": {"cards": [
    card_bs(1, "light", entity="light.bs_a"), card_bs(2, "light", entity="light.bs_b_steh"), card_bs(3, "switch", entity="switch.bs_b_saege"),
    card_bs(4, "button", entity="script.bs_b"), card_bs(5, "light", entity="light.bs_b_keller"),
    card_bs(6, "entities", name="Gemischt", entities=["light.bs_a", "light.bs_b_steh", "switch.bs_b_saege"])]}})
set_setting("favorites", ["light.bs_a", "light.bs_b_steh", "script.bs_b"])
set_setting("sceneBar", {"on": True, "items": [{"e": "script.bs_a"}, {"e": "scene.bs_b"}, {"e": "script.bs_b"}]})
uses_bs = api_admin("api/uses?fresh=1")["uses"]
check("building scope: the add-on says what the automations and scripts use (an entity, an area), also to a user who may not edit",
      uses_bs.get("automation.bs_b") == ["light.bs_b_steh"] and uses_bs.get("automation.bs_bk") == ["area:bs_b_keller"] and uses_bs.get("script.bs_b") == ["media_player.bs_b_tv"]
      and json.load(urllib.request.urlopen(urllib.request.Request(BASE + "api/uses", headers={"X-Remote-User-Name": "tablet_bs"})))["uses"] == uses_bs, uses_bs)

lit_bs = {x["entity_id"]: x["state"] for x in json.load(urllib.request.urlopen(HA + "/states")) if x["entity_id"].startswith("light.") and ".bs_" not in x["entity_id"]}   # 'Alles aus' switches the house's lamps off too: put back at the end
own_bs = []
pgB = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgB.on("console", lambda m: own_bs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgB.on("pageerror", lambda e: own_bs.append("PAGEERROR " + str(e)))
def wait_bs(fn, n=30, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgB.wait_for_timeout(ms)
    return fn()
def live_bs(building):
    pgB.goto(BASE + "?debug=1&mode=live"); pgB.wait_for_timeout(1200)
    pgB.select_option("#buildingSelect", building); pgB.wait_for_timeout(1500)
def tab_bs(tab):
    pgB.click(f"#tabBar [data-tab={tab}]"); pgB.wait_for_timeout(1500)
cards_bs = lambda: pgB.evaluate("[...document.querySelectorAll('[data-page=p_bsseite] .ocCard')].filter((c) => c.checkVisibility()).map((c) => c.dataset.card)")
autos_bs = lambda: pgB.evaluate("[...document.querySelectorAll('[data-page=routines] .roRow[data-auto]')].map((r) => r.dataset.auto).filter((e) => e.includes('.bs_'))")
def open_rooms_bs():
    """▶ Abläufe by room (#590): a room's rows are drawn only while it is open: "▾ Alle aufklappen" of every list"""
    for i in range(pgB.locator("[data-page=routines] [data-rg-all=open]").count()):
        pgB.locator("[data-page=routines] [data-rg-all=open]").nth(i).click(); pgB.wait_for_timeout(400)
def all_autos_bs():
    more = pgB.locator("[data-page=routines] .roAutos .roMore")
    if more.count() and "weniger" not in more.first.inner_text().lower(): more.first.click(); pgB.wait_for_timeout(600)
    open_rooms_bs()
    return sorted(set(autos_bs()))

live_bs("")
tab_bs("p_bsseite")
check("building scope: with all buildings every card of the own page shows", wait_bs(lambda: len(cards_bs()) == 6), cards_bs())
live_bs("bsA")
favs_bs = pgB.evaluate("[...document.querySelectorAll('[data-fav]')].map((x) => x.dataset.fav)")
bar_bs = pgB.evaluate("[...document.querySelectorAll('#sceneBar .sbTile:not(.sbEdit)')].map((x) => x.dataset.e)")
check("building scope: house A at the top: the favourites and the scene bar leave out the lamp of B's area (not in the plan), B's scene and B's script",
      favs_bs == ["light.bs_a"] and bar_bs == ["script.bs_a"], (favs_bs, bar_bs))
tab_bs("p_bsseite")
rows_bs = pgB.inner_text("[data-page=p_bsseite] .ocCard[data-card=c_bs6]")
check("building scope: the own page: B's lamp, switch (an area called like B's room) and script are gone, the cellar (no building yet) stays",
      wait_bs(lambda: cards_bs() == ["c_bs1", "c_bs5", "c_bs6"]), cards_bs())
check("building scope: a card with devices of both buildings shows only the rows of house A", "Lampe A" in rows_bs and "Stehlampe B" not in rows_bs and "Säge B" not in rows_bs, rows_bs)
tab_bs("media")
txt_bs = pgB.inner_text("[data-page=media]")
check("building scope: 🎵 Musik & TV shows the TV of A, not B's (in B's area, not in the plan)", "Fernseher A" in txt_bs and "Fernseher B" not in txt_bs, txt_bs[:300])
tab_bs("routines")
open_rooms_bs()
tiles_bs = pgB.evaluate("[...document.querySelectorAll('[data-page=routines] [data-routine]')].map((x) => x.dataset.routine).filter((e) => e.includes('.bs_'))")
scenes_bs = pgB.evaluate("[...document.querySelectorAll('[data-page=routines] .roRow[data-scene]')].map((r) => r.dataset.scene).filter((e) => e.includes('.bs_'))")
rooms_bs = pgB.evaluate("[...new Set([...document.querySelectorAll('[data-page=routines] .rgRoom')].map((r) => r.dataset.room))].filter((x) => x.startsWith('bs_')).sort()")
check("building scope: ▶ Abläufe: the buttons and scenes of house B are gone (a script by what it switches), no room of house B in the lists by room",
      tiles_bs == ["script.bs_a"] and scenes_bs == [] and rooms_bs == ["bs_a_stube"], (tiles_bs, scenes_bs, rooms_bs))
check("building scope: … the automations of Home Assistant too: A's, the one of the sun and the cellar's (no building yet) stay, B's is gone",
      wait_bs(lambda: all_autos_bs() == ["automation.bs_a", "automation.bs_bk", "automation.bs_frei"]), all_autos_bs())
pgB.click("[data-page=routines] [data-check=leave]"); pgB.wait_for_timeout(600)
dlg_bs = pgB.inner_text(".rtDlg")
n0_bs = len(ha_calls())
check("building scope: 'Ich gehe' lists the TV of A, not the TV and the lock of B", "Fernseher A" in dlg_bs and "Fernseher B" not in dlg_bs and "Schloss B" not in dlg_bs, dlg_bs)
pgB.click(".rtDlg [data-act=allOff]"); pgB.wait_for_timeout(1500)
off_bs = [c for c in ha_calls()[n0_bs:] if "bs_" in str(c)]
check("building scope: … and 'Alles aus' stops the TV of A, not the one of B", any("media_player.bs_a_tv" in str(c) for c in off_bs) and not any("bs_b" in str(c) for c in off_bs), off_bs)

# the panel: every area with the building it takes by itself, what is in no building; house B for the cellar
pgB.goto(BASE + "?debug=1&mode=edit"); pgB.wait_for_timeout(1200)
pgB.evaluate("document.querySelector('#buildingPanel').open = true"); pgB.wait_for_timeout(600)
pgB.evaluate("document.querySelector('#buildingPanel .bldAreas').open = true; const l = document.querySelector('#buildingPanel .bldLoose'); if (l) l.open = true;"); pgB.wait_for_timeout(300)
auto_bs = lambda: dict(pgB.evaluate("[...document.querySelectorAll('#buildingPanel .bldAreas select')].map((s) => [s.dataset.area, s.options[0].text])"))
check("building scope: the panel names every area of Home Assistant with the building it takes by itself: by a device in the plan, by a room's name, none",
      auto_bs() == {"bs_a_stube": "automatisch (Haus A)", "bs_b_stube": "automatisch (Haus B)", "bs_b_werk": "automatisch (Haus B)", "bs_b_keller": "automatisch (kein Gebäude)"}, auto_bs())
loose_bs = lambda: pgB.inner_text("#buildingPanel .bldLoose") if pgB.locator("#buildingPanel .bldLoose").count() else ""
check("building scope: … and what is in no building: the cellar's lamp and its automation, not what follows a building",
      wait_bs(lambda: "Kellerlicht B" in loose_bs() and "Automation Keller B" in loose_bs()) and "Stehlampe B" not in loose_bs() and "Automation B ·" not in loose_bs() + " ·", loose_bs())
pgB.select_option("#buildingPanel select[data-area=bs_b_keller]", "bsB")
check("building scope: house B chosen for the cellar: saved in the plan, the list stays open, the cellar is not 'without a building' any more",
      wait_bs(lambda: api_admin("api/layout").get("areaBuildings") == {"bs_b_keller": "bsB"}) and pgB.evaluate("document.querySelector('#buildingPanel .bldAreas').open")
      and pgB.input_value("#buildingPanel select[data-area=bs_b_keller]") == "bsB" and "Kellerlicht B" not in loose_bs(), (api_admin("api/layout").get("areaBuildings"), loose_bs()))

live_bs("bsA")
tab_bs("p_bsseite")
check("building scope: house A at the top again: the cellar's card is gone now", wait_bs(lambda: cards_bs() == ["c_bs1", "c_bs6"]), cards_bs())
tab_bs("routines")
check("building scope: … and the automation that names the cellar's area", wait_bs(lambda: all_autos_bs() == ["automation.bs_a", "automation.bs_frei"]), all_autos_bs())
pgB.select_option("#buildingSelect", "bsB"); pgB.wait_for_timeout(1500)
check("building scope: house B at the top: its automations (and the one of the sun), not A's",
      wait_bs(lambda: all_autos_bs() == ["automation.bs_b", "automation.bs_bk", "automation.bs_frei"]), all_autos_bs())
tab_bs("p_bsseite")
check("building scope: … and its cards, the mixed one with B's rows", wait_bs(lambda: cards_bs() == ["c_bs2", "c_bs3", "c_bs4", "c_bs5", "c_bs6"])
      and "Lampe A" not in pgB.inner_text("[data-page=p_bsseite] .ocCard[data-card=c_bs6]") and "Säge B" in pgB.inner_text("[data-page=p_bsseite] .ocCard[data-card=c_bs6]"), cards_bs())
pgB.select_option("#buildingSelect", ""); pgB.wait_for_timeout(1500)
check("building scope: 🏘 Alle Gebäude: everything again", wait_bs(lambda: len(cards_bs()) == 6), cards_bs())

# the new panel („✨ Neu“, the owner 2026-11-10: „bitte vergiss nicht die Ansicht in der v2“): the areas under „Haus“
pgB.goto(BASE + "?debug=1&mode=edit&ui=2"); pgB.wait_for_timeout(1200)
pgB.keyboard.press("Escape"); pgB.wait_for_timeout(300)
if pgB.locator("#v2Home [data-seg=house]").count(): pgB.click("#v2Home [data-seg=house]"); pgB.wait_for_timeout(400)
pgB.click("#v2HouseMore"); pgB.wait_for_timeout(300)                        # 5.7.0: in the menu ⋯ of the house
pgB.click("#v2HouseMenu [data-more=building]"); pgB.wait_for_timeout(600)
pgB.evaluate("document.querySelector('#buildingPanel .bldAreas').open = true"); pgB.wait_for_timeout(300)
check("building scope / ✨ Neu: in the new panel the areas of Home Assistant are in „🏘 Gebäude in diesem Plan“ (menu ⋯ of the house), the cellar with house B",
      pgB.evaluate("document.body.classList.contains('uiV2')") and pgB.is_visible("#buildingPanel select[data-area=bs_b_keller]")
      and pgB.input_value("#buildingPanel select[data-area=bs_b_keller]") == "bsB", pgB.evaluate("document.querySelector('#panel')?.dataset.v2seg"))
pgB.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
check("building scope: no errors on the page", not own_bs, own_bs[:5])
pgB.close()
put_bs("api/layout", saved_bs)
for e_bs, v_bs in lit_bs.items():
    urllib.request.urlopen(HA + f"/_set?e={e_bs}&s={v_bs}").read()
post_bs("/_extra", {}); post_bs("/_areas", []); post_bs("/_related", {"related": {}, "configs": {}})
for k_bs, v_bs in (("customTabs", []), ("pageLayouts", {}), ("favorites", []), ("sceneBar", {})):
    set_setting(k_bs, st_bs.get(k_bs, v_bs))
set_setting("language", st_bs.get("language", "de")); set_setting("units", st_bs.get("units", "metric"))
api_admin("api/uses?fresh=1")
