"""4.45.0 (#597): the scene bar over the tab bar and the light card (the owner: "Szenen … über dieser Leiste … scrollen … pro Dashboard
verknüpfen" and "diese Lichtkarte … mit diesem Schieberegler … Gruppen oder auch nur einzelne Lampen"). The bar: one list for every page,
a page with none, the one that ran last marked, a tap starts it; the edit mode gives a page its own list. The light card: a bar per lamp,
a group opens to its lamps, a lamp that only switches and one that is gone, dragging sends the brightness when let go, a tap switches,
"Alle aus"; as a window from a button card and from "💡 n Lichter an".
"""
import datetime as _dt
st_sl = api("api/settings")
set_setting("language", "de")
ago_sl = lambda h: (_dt.datetime.now(_dt.timezone.utc) - _dt.timedelta(hours=h)).isoformat()
def post_sl(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
post_sl("/_extra", {
    "scene.sl_hell": {"state": ago_sl(5), "attributes": {"friendly_name": "Wohnzimmer hell"}},
    "scene.sl_kino": {"state": ago_sl(1), "attributes": {"friendly_name": "Kino"}},
    "script.sl_kaffee": {"state": "off", "attributes": {"friendly_name": "Kaffee kochen", "last_triggered": ago_sl(3), "current": 0}},
    "light.sl_gruppe": {"state": "on", "attributes": {"friendly_name": "Wohnzimmer alle", "brightness": 128, "entity_id": ["light.sl_a", "light.sl_b"], "supported_color_modes": ["brightness"]}},
    "light.sl_a": {"state": "on", "attributes": {"friendly_name": "Sofa", "brightness": 255, "rgb_color": [255, 120, 40], "supported_color_modes": ["rgb"]}},
    "light.sl_b": {"state": "off", "attributes": {"friendly_name": "Regal", "supported_color_modes": ["brightness"]}},
    "light.sl_relais": {"state": "on", "attributes": {"friendly_name": "Flur", "supported_color_modes": ["onoff"]}},
    "light.sl_weg": {"state": "unavailable", "attributes": {"friendly_name": "Keuken"}},
    "switch.sl_steck": {"state": "off", "attributes": {"friendly_name": "Steckdose"}},
})
rows_sl = [{"e": "light.sl_gruppe"}, {"e": "light.sl_relais"}, {"e": "light.sl_weg"}, {"e": "switch.sl_steck", "name": "Lichterkette", "icon": "✨"}]
set_setting("sceneBar", {"on": True, "items": [{"e": "scene.sl_hell"}, {"e": "scene.sl_kino", "icon": "🎬", "color": "purple"}, {"e": "script.sl_kaffee"}],
                         "pages": {"log": {"mode": "off"}}})
set_setting("pageLayouts", {"today": {"cards": [
    {"id": "c_sllicht", "type": "lights", "name": "Licht", "width": 2, "allOff": True, "rows": rows_sl},
    {"id": "c_slfenster", "type": "lights", "name": "Fenster-Licht", "popup": True, "hook": True, "rows": [{"e": "light.sl_a"}, {"e": "light.sl_b"}]},
    {"id": "c_slknopf", "type": "button", "entity": "light.sl_gruppe", "name": "Alle Lichter", "tap": "lights", "card": "c_slfenster"}]}})
own_sl = []
pgS = b.new_page(viewport={"width": 1400, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("console", lambda m: own_sl.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: own_sl.append("PAGEERROR " + str(e)))
calldata_sl = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
def wait_sl(fn, n=40, ms=250):
    for _ in range(n):
        v = fn()
        if v: return v
        pgS.wait_for_timeout(ms)
    return fn()
pgS.goto(BASE + "?debug=1"); pgS.wait_for_timeout(1500)
if pgS.is_visible("#modeSwitch [data-mode=live]"): pgS.click("#modeSwitch [data-mode=live]"); pgS.wait_for_timeout(800)
pgS.click("#tabBar [data-tab=today]"); pgS.wait_for_timeout(1200)
tiles_sl = lambda: pgS.evaluate("[...document.querySelectorAll('#sceneBar .sbTile:not(.sbEdit)')].map((b) => [b.dataset.e, b.classList.contains('last'), b.innerText.replace(/\\s+/g, ' ').trim()])")
wait_sl(lambda: len(tiles_sl()) == 3)
t_sl = tiles_sl()
check("scene bar (#597): over the tab bar, three tiles in their order with their names, the scene that ran last has its mark",
      [x[0] for x in t_sl] == ["scene.sl_hell", "scene.sl_kino", "script.sl_kaffee"] and [x[1] for x in t_sl] == [False, True, False]
      and "Wohnzimmer hell" in t_sl[0][2] and "🎬" in t_sl[1][2] and pgS.evaluate("document.body.classList.contains('hasScenes')"), t_sl)
bar_sl, tabs_sl = pgS.locator("#sceneBar").bounding_box(), pgS.locator("#tabBar").bounding_box()
check("scene bar: right above the tab bar, the page ends above it (nothing covered)",
      abs(bar_sl["y"] + bar_sl["height"] - tabs_sl["y"]) < 2 and pgS.locator("#tabPages").bounding_box()["y"] + pgS.locator("#tabPages").bounding_box()["height"] <= bar_sl["y"] + 1,
      [bar_sl, tabs_sl])
pgS.click("#sceneBar .sbTile[data-e='scene.sl_hell']")
check("scene bar: a tap starts the scene (scene.turn_on), the tile says ✓", wait_sl(lambda: ["scene", "turn_on", "scene.sl_hell"] in ha_calls())
      and wait_sl(lambda: pgS.locator("#sceneBar .sbTile.ok[data-e='scene.sl_hell']").count() == 1), ha_calls()[-3:])
pgS.click("#tabBar [data-tab=log]"); pgS.wait_for_timeout(800)
check("scene bar: a page set to 'Keine Leiste' has none", pgS.locator("#sceneBar").is_hidden() and not pgS.evaluate("document.body.classList.contains('hasScenes')"))
pgS.click("#tabBar [data-tab=house]"); pgS.wait_for_timeout(800)
check("scene bar: the house shows the list for every page", pgS.locator("#sceneBar .sbTile").count() == 3)
pgS.click("#tabBar [data-tab=today]"); pgS.wait_for_timeout(1000)

# ---- the light card ----
C = "[data-page=today] [data-card=c_sllicht] "
wait_sl(lambda: pgS.locator(C + ".lcRow").count() == 4)
look_sl = pgS.evaluate(f"""[...document.querySelectorAll('{C}.lcRows > .lcRow')].map((r) => [r.dataset.e, r.className, r.querySelector('.lcState').textContent,
    r.style.getPropertyValue('--pct'), !!r.querySelector('.lcMore'), r.querySelector('input').disabled])""")
check("light card: the group at 50 % with ▸, the lamp that only switches 'An' without a slider, the one gone 'Nicht verfügbar' and not usable, the switch 'Aus'",
      look_sl[0][2] == "50 %" and look_sl[0][3] == "50%" and look_sl[0][4] and " dim" in look_sl[0][1]
      and look_sl[1][2] == "An" and " dim" not in look_sl[1][1] and "lc-na" in look_sl[2][1] and look_sl[2][2] == "Nicht verfügbar" and look_sl[2][5]
      and look_sl[3][2] == "Aus" and "Lichterkette" in pgS.inner_text(C + ".lcRow[data-e='switch.sl_steck']") and "✨" in pgS.inner_text(C + ".lcRow[data-e='switch.sl_steck']"),
      look_sl)
pgS.click(C + ".lcRow[data-e='light.sl_gruppe'] .lcMore")
check("light card: ▸ opens the group to its two lamps (Sofa in its colour at 100 %, Regal off)",
      wait_sl(lambda: pgS.locator(C + ".lcRow.sub").count() == 2) and pgS.inner_text(C + ".lcRow.sub[data-e='light.sl_a'] .lcState") == "100 %"
      and "255, 120, 40" in pgS.evaluate(f"document.querySelector(\"{C}.lcRow.sub[data-e='light.sl_a']\").style.getPropertyValue('--lc')")
      and pgS.inner_text(C + ".lcRow.sub[data-e='light.sl_b'] .lcState") == "Aus")
n_sl = len(calldata_sl())
r_sl = pgS.locator(C + ".lcRow.sub[data-e='light.sl_a']").bounding_box()
pgS.mouse.move(r_sl["x"] + r_sl["width"] * 0.9, r_sl["y"] + r_sl["height"] / 2); pgS.mouse.down()
for i in range(1, 11):
    pgS.mouse.move(r_sl["x"] + r_sl["width"] * (0.9 - 0.06 * i), r_sl["y"] + r_sl["height"] / 2)
mid_sl = [pgS.inner_text(C + ".lcRow.sub[data-e='light.sl_a'] .lcState"), len(calldata_sl())]
pgS.mouse.up()
sent_sl = wait_sl(lambda: [x for x in calldata_sl()[n_sl:] if x[1] == "light.sl_a"])
check("light card: dragging shows the brightness at once and sends nothing until let go, then one call with that brightness",
      mid_sl[0] == "30 %" and mid_sl[1] == n_sl and sent_sl and sent_sl[0][0] == "turn_on" and sent_sl[0][2] == {"brightness_pct": 30}, [mid_sl, sent_sl])
pgS.click(C + ".lcRow[data-e='switch.sl_steck'] .lcName")
check("light card: a tap on a bar switches it (the switch on)", wait_sl(lambda: ["switch", "turn_on", "switch.sl_steck"] in ha_calls()), ha_calls()[-3:])
pgS.click(C + ".lcRow[data-e='light.sl_weg'] .lcName"); pgS.wait_for_timeout(300)
check("light card: a lamp that is gone takes no tap", ["light", "turn_on", "light.sl_weg"] not in ha_calls() and ["light", "turn_off", "light.sl_weg"] not in ha_calls())
pgS.click(C + "[data-act=lcAllOff]")
check("light card: 'Alle aus' switches off the rows that are on (the group and the lamp that only switches)",
      wait_sl(lambda: ["light", "turn_off", "light.sl_gruppe"] in ha_calls() and ["light", "turn_off", "light.sl_relais"] in ha_calls()), ha_calls()[-5:])
check("light card: the card set as a window is not on the page", pgS.locator("[data-page=today] [data-card=c_slfenster]").count() == 0)
pgS.click("[data-page=today] [data-card=c_slknopf] .obBtn")
check("light card: a button card set to '🎚️ Lichtsteuerung' opens it as a window with its title and its lamps",
      wait_sl(lambda: pgS.locator(".lcDlg[open] .lcRow").count() == 2) and "Fenster-Licht" in pgS.inner_text(".lcDlg[open] .lcDlgHead"))
pgS.click(".lcDlg[open] .lcClose"); pgS.wait_for_timeout(300)
if pgS.locator("[data-page=today] .tdHouse [data-act=lights]").count():
    pgS.click("[data-page=today] .tdHouse [data-act=lights]")
    check("light card: '💡 n Lichter an' opens the window set to open from there", wait_sl(lambda: pgS.locator(".lcDlg[open] .lcRow").count() == 2))
    pgS.keyboard.press("Escape"); pgS.wait_for_timeout(300)

# ---- the edit mode: the window of the scene bar, a page with its own list ----
pgS.click("#tabBar .tbEdit"); pgS.wait_for_timeout(600)
check("scene bar: in the edit mode the strip has '🎬 Szenen-Leiste', the bar a tile to set it, the light window card shows with its tag",
      pgS.locator("[data-page=today] .bdStrip [data-act=sceneBar]").count() == 1 and pgS.locator("#sceneBar .sbEdit").count() == 1
      and "Fenster" in pgS.inner_text("[data-page=today] [data-card=c_slfenster] .bdTag"))
pgS.click("[data-page=today] .bdStrip [data-act=sceneBar]"); pgS.wait_for_timeout(500)
pgS.select_option(".sbDlg [data-act=sbTarget]", "today"); pgS.wait_for_timeout(200)
pgS.click(".sbDlg [data-mode=own]"); pgS.wait_for_timeout(200)
check("scene bar: 'Eigene Szenen' for ☀ Heute starts with the list for every page",
      pgS.evaluate("[...document.querySelectorAll('.sbDlg .sbRow')].map((r) => r.dataset.key)") == ["scene.sl_hell", "scene.sl_kino", "script.sl_kaffee"])
pgS.click(".sbDlg .sbRow[data-key='scene.sl_hell'] .sbDel"); pgS.wait_for_timeout(200)
g_sl = pgS.locator(".sbDlg .sbRow[data-key='script.sl_kaffee'] .dsGrip").bounding_box(), pgS.locator(".sbDlg .sbRow[data-key='scene.sl_kino']").bounding_box()
pgS.mouse.move(g_sl[0]["x"] + 5, g_sl[0]["y"] + 5); pgS.mouse.down()
for i in range(1, 9):
    pgS.mouse.move(g_sl[0]["x"] + 5, g_sl[0]["y"] + 5 - (g_sl[0]["y"] - g_sl[1]["y"] + 10) * i / 8)
pgS.mouse.up(); pgS.wait_for_timeout(200)
pgS.fill(".sbDlg .sbRow[data-key='script.sl_kaffee'] .sbNameIn", "Kaffee!")
pgS.click(".sbDlg [data-act=save]"); pgS.wait_for_timeout(800)
bar_saved = wait_sl(lambda: api("api/settings").get("sceneBar", {}).get("pages", {}).get("today"))
check("scene bar: saved for ☀ Heute only, in the order dragged, with the new name; the bar shows it",
      bar_saved and bar_saved["mode"] == "own" and [x["e"] for x in bar_saved["items"]] == ["script.sl_kaffee", "scene.sl_kino"] and bar_saved["items"][0]["name"] == "Kaffee!"
      and len(api("api/settings")["sceneBar"]["items"]) == 3 and wait_sl(lambda: [x[0] for x in tiles_sl()] == ["script.sl_kaffee", "scene.sl_kino"]), bar_saved)
pgS.click("[data-page=today] [data-act=done]"); pgS.wait_for_timeout(600)
pgS.click("#tabBar [data-tab=house]"); pgS.wait_for_timeout(600)
check("scene bar: the other pages keep the list for every page", pgS.locator("#sceneBar .sbTile").count() == 3)
check("scene bar and light card: no errors on the page", not own_sl, own_sl)
pgS.close()
post_sl("/_extra", {})
set_setting("sceneBar", st_sl.get("sceneBar", {"on": True, "items": [], "pages": {}}))
set_setting("pageLayouts", st_sl.get("pageLayouts", {}))
set_setting("language", st_sl.get("language", "auto"))
