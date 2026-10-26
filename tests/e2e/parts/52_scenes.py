"""4.30.0 (#549): scenes for lights and LED strips made in the dashboard as real scenes of Home Assistant. ▶ Abläufe → 🎨 Szenen: "＋ Neue
Szene", a light picked, a colour, ▶ Ausprobieren (scene.apply, nothing saved), ✓ Speichern writes fp3d_… through Home Assistant's scene
editor; the scene stands in the card with ✏ and ▶; one made in Home Assistant is only copied ("📋"), never changed; 🗑 deletes the own one.
"""
st_sc = api("api/settings")
set_setting("language", "de")
def post_sc(path, body):
    return json.load(urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})))
scenes_sc = lambda: json.load(urllib.request.urlopen(HA + "/_scenes"))
calldata_sc = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))
calls_sc = lambda: json.load(urllib.request.urlopen(HA + "/_calls"))
post_sc("/_scenes", {"1700000000": {"id": "1700000000", "name": "Abend HA", "entities": {"light.wohnzimmer": {"state": "on", "brightness": 128}}}})
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
check("scenes: one of Home Assistant opens as a copy", "(Kopie)" in pgS.input_value(".scDlg .feName") and pgS.locator(".scDlg .feSync").count() == 1)
pgS.click(".scDlg [data-act=scSave]")
check("scenes: the copy is saved as a new scene, the one of Home Assistant stays as it was",
      wait_sc(lambda: len([k for k in scenes_sc() if k.startswith("fp3d_")]) == 2) and scenes_sc()["1700000000"]["name"] == "Abend HA")
pgS.once("dialog", lambda d: d.accept())
pgS.click(".scDlg [data-act=scDelete]")
check("scenes: '🗑 Löschen' deletes the own copy", wait_sc(lambda: len([k for k in scenes_sc() if k.startswith("fp3d_")]) == 1) and "1700000000" in scenes_sc())
check("scenes: no errors on the page", not errs_sc, errs_sc[:3])
pgS.close()
for k in [k for k in scenes_sc() if k.startswith("fp3d_")]:
    urllib.request.urlopen(urllib.request.Request(BASE + f"api/scenes/{k}", method="DELETE", headers={"X-Remote-User-Name": "admin"})).read()
set_setting("language", st_sc.get("language", ""))
