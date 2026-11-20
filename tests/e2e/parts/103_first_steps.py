"""5.25.0 🧭 Erste Schritte and the "⋯" menu of the editor's top bar (the owner's choice, docs/ideen-5.21 picture 2, docs/ideen-5.8 picture 16):
🎬 Anleitung, 🗄️ Backup and 🛡️ Sicherheit move into "⋯" while editing (in the live view they stay in the bar); "⋯ → 🧭 Erste Schritte"
opens the card with the four steps worked out from the house: "🔗 Alle verbinden" links the rooms called like an area, "✨ Alle automatisch
setzen" places the areas' devices on every floor, the live view finishes it. The rules: firststeps.test.mjs.
"""
lay_fs = api("api/layout")
lang_fs = api("api/settings").get("language", "de")
set_setting("language", "de")
room_fs = next((r for f in lay_fs["floors"] for r in f.get("rooms", []) if r.get("name")), None)
def post_fs(path, body):
    return json.load(urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})))
unlinked_fs = json.loads(json.dumps(lay_fs))                 # no room linked yet, one area called like a room of the house
for f in unlinked_fs["floors"]:
    for r in f.get("rooms", []):
        r.pop("area", None)
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(unlinked_fs).encode(), method="PUT", headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
post_fs("/_areas", [{"id": "fs_area", "name": room_fs["name"], "entities": ["light.fs_decke", "light.fs_stehlampe"]}])
pgS = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_fs = []
pgS.on("pageerror", lambda e: own_fs.append("PAGEERROR " + str(e)))
pgS.goto(BASE + "?debug=1&mode=edit"); pgS.wait_for_timeout(1500)
check("⋯ in the editor: Anleitung, Backup and Sicherheit are not in the bar, ⋯ with „neu“ is", pgS.is_visible("#topMoreBtn") and pgS.is_visible("#topMoreWrap .tmNew")
      and not pgS.is_visible("#backupBtn") and not pgS.is_visible("#guideBtn") and not pgS.is_visible("#timelineBtn"))
check("🧭 not shown by itself on a house that is already drawn", not pgS.is_visible("#firstSteps"))
pgS.click("#topMoreBtn"); pgS.wait_for_timeout(300)
rows_fs = pgS.eval_on_selector_all("#topMore .tmRow", "l => l.map(e => e.dataset.act)")
check("⋯ lists Erste Schritte, Anleitung, Backup, Sicherheit with a line each; „neu“ is gone", rows_fs == ["first", "guide", "backup", "timeline"]
      and "Videos zu jeder Funktion" in pgS.inner_text("#topMore") and not pgS.is_visible("#topMoreWrap .tmNew"), rows_fs)
pgS.click("#topMore [data-act=backup]"); pgS.wait_for_selector("#backupDialog[open]", timeout=5000)
check("⋯ → Backup opens the backup dialog", pgS.is_visible("#backupDialog"))
pgS.keyboard.press("Escape"); pgS.wait_for_timeout(300)
pgS.click("#topMoreBtn"); pgS.click("#topMore [data-act=first]"); pgS.wait_for_timeout(800)
txt_fs = pgS.inner_text("#firstSteps")
check("🧭 ⋯ → Erste Schritte: step 1 done, step 2 open with „🔗 Alle 1 gleichnamigen verbinden“", pgS.is_visible("#firstSteps")
      and pgS.get_attribute("#firstSteps [data-step=draw]", "class").endswith("done") and pgS.get_attribute("#firstSteps [data-step=link]", "class").endswith("now")
      and pgS.locator("#firstSteps [data-act=linkAll]").count() == 1, txt_fs)
pgS.click("#firstSteps [data-act=linkAll]"); pgS.wait_for_timeout(800)
linked_fs = pgS.evaluate("(n) => window.__fp.layout.floors.flatMap(f => f.rooms).filter(r => r.area === 'fs_area').map(r => r.name)", room_fs["name"])
check("🧭 „Alle verbinden“ links the room called like the area; step 3 is open: 2 devices to place", linked_fs == [room_fs["name"]]
      and pgS.get_attribute("#firstSteps [data-step=place]", "class").endswith("now") and "2 offen" in pgS.inner_text("#firstSteps"), (linked_fs, pgS.inner_text("#firstSteps")))
pgS.click("#firstSteps [data-act=placeAll]"); pgS.wait_for_timeout(1000)
placed_fs = pgS.evaluate("window.__fp.layout.floors.flatMap(f => f.devices).filter(d => (d.entity || '').startsWith('light.fs_')).map(d => d.type)")
check("🧭 „Alle automatisch setzen“ puts both lamps into the room; step 4 is open", sorted(placed_fs) == ["light", "light"]
      and pgS.get_attribute("#firstSteps [data-step=live]", "class").endswith("now"), (placed_fs, pgS.inner_text("#firstSteps")))
pgS.click("#firstSteps [data-act=goLive]"); pgS.wait_for_timeout(800)
check("🧭 „Live-Ansicht ansehen“ opens the live view (card hidden there; Backup back in the bar)", pgS.evaluate("document.body.classList.contains('live')")
      and not pgS.is_visible("#firstSteps") and not pgS.is_visible("#topMoreBtn"), (pgS.evaluate("document.body.className"), pgS.is_visible("#firstSteps"), pgS.is_visible("#topMoreBtn")))
pgS.click("#modeSwitch [data-mode=edit]"); pgS.wait_for_timeout(1800)
check("🧭 back in the editor: all four done, 100 %", "Geschafft" in pgS.inner_text("#firstSteps") and "100 %" in pgS.inner_text("#firstSteps")
      and pgS.locator("#firstSteps .fsStep.done").count() == 4, pgS.inner_text("#firstSteps"))
pgS.click("#firstSteps [data-act=skip]"); pgS.wait_for_timeout(300)
pgS.reload(); pgS.wait_for_timeout(1500)
check("🧭 closed it stays closed", not pgS.is_visible("#firstSteps"))
check("🧭 no errors on the page", not own_fs, own_fs)
pgS.close()
post_fs("/_areas", [])
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay_fs).encode(), method="PUT", headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
set_setting("language", lang_fs)
