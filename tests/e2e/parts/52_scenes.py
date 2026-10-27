"""4.30.0 (#549): scenes for lights and LED strips made in the dashboard as real scenes of Home Assistant. ▶ Abläufe → 🎨 Szenen: "＋ Neue
Szene", a light picked, a colour, ▶ Ausprobieren (scene.apply, nothing saved), ✓ Speichern writes fp3d_… through Home Assistant's scene
editor; the scene stands in the card with ✏ and ▶; 🗑 deletes the own one.
4.36.0 (#564): the picker by kind with "＋ Alle dazunehmen" and "↶ Rückgängig"; the white tone as a slider in Kelvin; "⇉ Auf alle anwenden";
one made in Home Assistant is changed in place (what the editor cannot show stays) or saved "📋 Als Kopie"; 🗑 in the card deletes it in Home
Assistant and "↶ Wiederherstellen" brings it back; automations of Home Assistant: ▶ run now, 🗑 delete, "↶ Wiederherstellen".
"""
st_sc = api("api/settings")
set_setting("language", "de")
def post_sc(path, body):
    return json.load(urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})))
scenes_sc = lambda: json.load(urllib.request.urlopen(HA + "/_scenes"))
calldata_sc = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
calls_sc = lambda: json.load(urllib.request.urlopen(HA + "/_calls"))
post_sc("/_scenes", {"1700000000": {"id": "1700000000", "name": "Abend HA", "entities": {"light.wohnzimmer": {"state": "on", "brightness": 128},
                                                                               "media_player.tv": {"state": "on", "source": "HDMI 1"}}}})
def put_ha(path, body):
    return json.load(urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})))
autos_sc = lambda: json.load(urllib.request.urlopen(HA + "/_autos"))
put_ha("/config/automation/config/1600000000", {"id": "1600000000", "alias": "Flurlicht HA", "triggers": [], "actions": []})   # made in Home Assistant
errs_sc = []
pgS = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("console", lambda m: errs_sc.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: errs_sc.append("PAGEERROR " + str(e)))
def wait_sc(fn, n=30, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgS.wait_for_timeout(ms)
    return fn()
pgS.goto(BASE + "?debug=1"); pgS.wait_for_timeout(1500)
if pgS.is_visible("#modeSwitch [data-mode=live]"): pgS.click("#modeSwitch [data-mode=live]"); pgS.wait_for_timeout(800)
pgS.click("#tabBar [data-tab=routines]"); pgS.wait_for_timeout(800)
check("scenes: ▶ Abläufe has the card '🎨 Szenen' with Home Assistant's scene and '＋ Neue Szene'",
      wait_sc(lambda: pgS.locator(".scCard [data-scene='scene.abend_ha']").count() == 1) and pgS.locator(".scCard [data-act=newScene]").count() == 1)
pgS.click(".scCard [data-act=newScene]"); pgS.wait_for_timeout(500)
pgS.fill(".scDlg .feName", "Testszene"); pgS.press(".scDlg .feName", "Tab")
pgS.click(".scDlg .scKinds [data-kind=cover]"); pgS.wait_for_timeout(300)
check("scenes (#564): the picker shows one kind of device at a time",
      pgS.locator(".scDlg .scPickRow").count() >= 1 and all(e.startswith("cover.") for e in pgS.eval_on_selector_all(".scDlg .scPickRow", "els => els.map(e => e.dataset.entity)")))
pgS.click(".scDlg .scKinds [data-kind=all]"); pgS.wait_for_timeout(300)
n_pick = pgS.locator(".scDlg .scPickRow").count()
pgS.click(".scDlg [data-act=scAddAll]"); pgS.wait_for_timeout(300)
check("scenes (#564): '＋ Alle dazunehmen' puts every device of the list into the scene at once",
      n_pick > 1 and pgS.locator(".scDlg .scDev").count() == n_pick and pgS.locator(".scDlg [data-act=scUndo]").count() == 1, n_pick)
pgS.click(".scDlg [data-act=scUndo]"); pgS.wait_for_timeout(300)
check("scenes (#564): '↶ Rückgängig' takes them out again", pgS.locator(".scDlg .scDev").count() == 0 and pgS.locator(".scDlg [data-act=scUndo]").count() == 0)
pgS.fill(".scDlg .scSearch", "wohnzimmer licht"); pgS.wait_for_timeout(300)
pgS.click(".scDlg .scPickRow[data-entity='light.wohnzimmer']"); pgS.wait_for_timeout(300)
pgS.click(".scDlg [data-dev='light.wohnzimmer'] [data-field=on] [data-value=true]"); pgS.wait_for_timeout(200)
pgS.click(".scDlg [data-dev='light.wohnzimmer'] .scSw[data-value='#aa50ff']"); pgS.wait_for_timeout(200)
check("scenes: the editor holds the light with its colour", pgS.locator(".scDlg [data-dev='light.wohnzimmer'] .scSw.on[data-value='#aa50ff']").count() == 1)
n_sc = len(calldata_sc())
pgS.click(".scDlg [data-act=scTry]")
tried = wait_sc(lambda: [c for c in calldata_sc()[n_sc:] if c[0] == "apply"])
check("scenes: '▶ Ausprobieren' shows it at once (scene.apply) and saves nothing",
      tried and tried[-1][2]["entities"]["light.wohnzimmer"].get("rgb_color") == [170, 80, 255] and not any(k.startswith("fp3d_") for k in scenes_sc()), tried)
pgS.click(".scDlg [data-act=scSave]")
mine = wait_sc(lambda: [k for k in scenes_sc() if k.startswith("fp3d_")])
cfg_sc = scenes_sc().get(mine[0]) if mine else {}
check("scenes: '✓ Speichern' writes a real scene of Home Assistant (fp3d_…) and says so",
      mine and cfg_sc.get("name") == "Testszene" and cfg_sc["entities"]["light.wohnzimmer"].get("color_mode") == "rgb"
      and wait_sc(lambda: "In Home Assistant gespeichert" in (pgS.text_content(".scDlg .feFlash") or "")), cfg_sc)
pgS.click(".scDlg [data-act=scBack]"); pgS.wait_for_timeout(500)
check("scenes: it stands in the card as the dashboard's own, with ▶ and ✏",
      wait_sc(lambda: pgS.locator(".scCard [data-scene='scene.testszene'] [data-edit-scene]").count() == 1)
      and pgS.text_content(".scCard [data-scene='scene.testszene'] [data-edit-scene]") == "✏️")
pgS.click(".scCard [data-play-scene='scene.testszene']")
check("scenes: ▶ plays it", wait_sc(lambda: ["scene", "turn_on", "scene.testszene"] in calls_sc()[-5:]))
pgS.click(".scCard [data-edit-scene='scene.abend_ha']"); pgS.wait_for_timeout(800)
check("scenes (#564): one of Home Assistant opens to be changed in place, says so and offers '📋 Als Kopie'",
      pgS.input_value(".scDlg .feName") == "Abend HA" and "(hier 1)" in (pgS.text_content(".scDlg .feSync") or "") and pgS.locator(".scDlg [data-act=scCopy]").count() == 1,
      pgS.text_content(".scDlg .feSync"))
kel_sc = ".scDlg [data-dev='light.wohnzimmer'] .kelRange"
pgS.eval_on_selector(kel_sc, "el => { el.value = 3500; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }"); pgS.wait_for_timeout(300)
check("scenes (#564): the white tone is a slider with its value in Kelvin",
      pgS.text_content(".scDlg [data-dev='light.wohnzimmer'] .kelVal") == "3500 K · Neutralweiß" and "3500 K" in pgS.text_content(".scDlg [data-dev='light.wohnzimmer'] small"))
pgS.click(".scDlg .scKinds [data-kind=switch]"); pgS.wait_for_timeout(300)
pgS.click(".scDlg .scPickRow[data-entity='switch.garage']"); pgS.wait_for_timeout(300)
pgS.click(".scDlg [data-dev='light.wohnzimmer'] [data-act=scAll]"); pgS.wait_for_timeout(300)
check("scenes (#564): '⇉ Auf alle anwenden' switches the other device on as the light is",
      pgS.text_content(".scDlg [data-dev='switch.garage'] small") == "an" and "(1)" in (pgS.text_content(".scDlg .feFlash") or ""), pgS.text_content(".scDlg .feFlash"))
pgS.click(".scDlg [data-act=scSave]")
check("scenes (#564): saved in place in Home Assistant: the new white tone and switch, the TV the editor does not show stays",
      wait_sc(lambda: scenes_sc()["1700000000"]["entities"].get("switch.garage") == {"state": "on"})
      and scenes_sc()["1700000000"]["entities"]["light.wohnzimmer"].get("color_temp_kelvin") == 3500
      and scenes_sc()["1700000000"]["entities"]["media_player.tv"] == {"state": "on", "source": "HDMI 1"} and scenes_sc()["1700000000"]["name"] == "Abend HA",
      scenes_sc().get("1700000000"))
pgS.click(".scDlg [data-act=scCopy]")
check("scenes (#564): '📋 Als Kopie' saves a new scene, the one of Home Assistant stays",
      wait_sc(lambda: len([k for k in scenes_sc() if k.startswith("fp3d_")]) == 2) and wait_sc(lambda: "(Kopie)" in pgS.input_value(".scDlg .feName"))
      and "1700000000" in scenes_sc(), pgS.input_value(".scDlg .feName"))
pgS.once("dialog", lambda d: d.accept())
pgS.click(".scDlg [data-act=scDelete]")
check("scenes: '🗑 Löschen' deletes the own copy", wait_sc(lambda: len([k for k in scenes_sc() if k.startswith("fp3d_")]) == 1) and "1700000000" in scenes_sc())
pgS.once("dialog", lambda d: d.accept())
pgS.click(".scCard [data-del-scene='scene.abend_ha']")
check("scenes (#564): 🗑 in the card deletes one of Home Assistant there (after asking) and offers '↶ Wiederherstellen'",
      wait_sc(lambda: "1700000000" not in scenes_sc()) and wait_sc(lambda: pgS.locator(".scCard [data-act=haRestore]").count() == 1)
      and pgS.locator(".scCard [data-scene='scene.abend_ha']").count() == 0)
pgS.click(".scCard [data-act=haRestore]")
check("scenes (#564): '↶ Wiederherstellen' writes it back from the add-on's backup",
      wait_sc(lambda: "1700000000" in scenes_sc()) and scenes_sc()["1700000000"]["entities"].get("switch.garage") == {"state": "on"}
      and wait_sc(lambda: pgS.locator(".scCard [data-scene='scene.abend_ha']").count() == 1))

# --- automations of Home Assistant (#564): ▶ run it now, 🗑 delete it, ↶ bring it back
auto_row = ".roAutos .roRow[data-auto='automation.flurlicht_ha']"
check("automations (#564): one made in Home Assistant has ▶, ↗ and 🗑", wait_sc(lambda: pgS.locator(f"{auto_row} [data-del-auto]").count() == 1)
      and pgS.locator(f"{auto_row} [data-run-auto]").count() == 1 and "/config/automation/edit/1600000000" in (pgS.get_attribute(f"{auto_row} [data-ha-auto]", "href") or ""))
pgS.click(f"{auto_row} [data-run-auto]")
check("automations (#564): ▶ runs it now", wait_sc(lambda: ["automation", "trigger", "automation.flurlicht_ha"] in calls_sc()[-5:]))
pgS.once("dialog", lambda d: d.accept())
pgS.click(f"{auto_row} [data-del-auto]")
check("automations (#564): 🗑 deletes it in Home Assistant and offers '↶ Wiederherstellen'",
      wait_sc(lambda: "1600000000" not in autos_sc()) and wait_sc(lambda: pgS.locator(".roAutos [data-act=haRestore]").count() == 1) and pgS.locator(auto_row).count() == 0)
pgS.click(".roAutos [data-act=haRestore]")
check("automations (#564): '↶ Wiederherstellen' brings it back", wait_sc(lambda: autos_sc().get("1600000000", {}).get("alias") == "Flurlicht HA")
      and wait_sc(lambda: pgS.locator(auto_row).count() == 1))
check("scenes: no errors on the page", not errs_sc, errs_sc[:3])
pgS.close()
for k in [k for k in scenes_sc() if k.startswith("fp3d_")]:
    urllib.request.urlopen(urllib.request.Request(BASE + f"api/scenes/{k}", method="DELETE", headers={"X-Remote-User-Name": "admin"})).read()
urllib.request.urlopen(urllib.request.Request(HA + "/config/automation/config/1600000000", method="DELETE")).read()
set_setting("language", st_sc.get("language", ""))
