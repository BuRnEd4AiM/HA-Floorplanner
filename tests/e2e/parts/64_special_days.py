"""4.51.0 (the owner, 2026-11-01): "📅 Besondere Tage" for own routines, "An besonderen Tagen anders" (a path becomes two: as before on
all other days, a copy on the special days, e.g. the shutter only to 50 % on Christmas Eve), written into the automation of Home Assistant
as a template condition; and the quick positions 0 / 50 / 75 / 100 % under ▲ ■ ▼ on the own roller shutter card.
"""
st_sd = api("api/settings")
set_setting("language", "de"); set_setting("pageLayouts", {})
def rules_sd(body):
    r = urllib.request.urlopen(urllib.request.Request(BASE + "api/rules", data=json.dumps(body).encode(), method="PUT",
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
    return json.load(r)
def ha_post_sd(path, body):
    return urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
rules_sd({"heat": {}, "flows": [], "days": []})
ha_post_sd("/services/cover/set_cover_position", {"entity_id": "cover.rollo", "position": 40})   # the stand-in's shutter says its position
errs_sd = []
pgS = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("console", lambda m: errs_sd.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: errs_sd.append("PAGEERROR " + str(e)))
pgS.on("dialog", lambda d: d.accept())
def wait_sd(fn, n=30, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgS.wait_for_timeout(ms)
    return fn()
pgS.goto(BASE + "?debug=1"); pgS.wait_for_timeout(1500)
if pgS.is_visible("#modeSwitch [data-mode=live]"): pgS.click("#modeSwitch [data-mode=live]"); pgS.wait_for_timeout(800)
pgS.click("#tabBar [data-tab=routines]"); pgS.wait_for_timeout(800)

# --- the window "📅 Besondere Tage"
pgS.locator("[data-page=routines] [data-act=specialDays]").first.click(); pgS.wait_for_timeout(500)
check("special days: '📅 Besondere Tage' opens its window, empty at first, with ready days to add",
      pgS.locator(".sdDlg[open]").count() == 1 and pgS.locator(".sdDlg .sdRow").count() == 0 and pgS.locator(".sdDlg [data-add]").count() >= 10)
pgS.click(".sdDlg [data-add=xmasEve]"); pgS.click(".sdDlg [data-add=holidays]"); pgS.click(".sdDlg [data-add=calendar]"); pgS.wait_for_timeout(300)
pgS.locator(".sdDlg .sdRow").nth(1).locator("[data-field=region]").select_option("BW"); pgS.wait_for_timeout(200)
rows_sd = pgS.evaluate("[...document.querySelectorAll('.sdDlg .sdRow .sdKind')].map((x) => x.textContent)")
check("special days: Heiligabend says it comes every year, the holidays of Baden-Württemberg name the next one; the 'Heiligabend' to add is greyed",
      "jedes Jahr" in rows_sd[0] and "Baden-Württemberg" in rows_sd[1] and "nächster:" in rows_sd[1] and pgS.locator(".sdDlg [data-add=xmasEve]").is_disabled(), rows_sd)
check("special days: a calendar without a calendar picked: 'Speichern' waits", pgS.locator(".sdDlg [data-act=sdSave]").is_disabled())
pgS.locator(".sdDlg .sdRow").nth(2).locator("[data-act=sdDelete]").click(); pgS.wait_for_timeout(200)
pgS.click(".sdDlg [data-act=sdSave]"); pgS.wait_for_timeout(800)
days_sd = api("api/rules").get("days") or []
check("special days: saved for all routines (Heiligabend 12-24, the holidays of BW)",
      [(d["kind"], d.get("md") or d.get("region"), d["name"]) for d in days_sd] == [("date", "12-24", "Heiligabend"), ("holidays", "BW", "")]
      and pgS.locator(".sdDlg[open]").count() == 0 and "(2)" in pgS.locator("[data-page=routines] [data-act=specialDays]").first.inner_text(), days_sd)
xmas_sd = days_sd[0]["id"] if days_sd else ""

# --- "An besonderen Tagen anders" in the editor of a routine
pgS.locator("[data-page=routines] [data-act=newFlow]").first.click(); pgS.wait_for_timeout(500)
pgS.fill(".feDlg .feName", "Rollo morgens"); pgS.press(".feDlg .feName", "Tab")
pgS.click(".feDlg [data-add=time]"); pgS.click(".feDlg [data-add=cover]"); pgS.wait_for_timeout(200)
pgS.click(".feDlg .fePickRow[data-entity='cover.rollo'] input"); pgS.click(".feDlg [data-field=do] [data-value=open]"); pgS.wait_for_timeout(200)
pgS.click(".feDlg [data-block='0:0']"); pgS.wait_for_timeout(300)
check("editor: a trigger offers 'An besonderen Tagen anders' with the days to tick", pgS.locator(".feDlg .feSplit [data-value]").count() == 3)
pgS.click(f".feDlg .feSplit [data-value={xmas_sd}]"); pgS.click(".feDlg [data-act=feSplit]"); pgS.wait_for_timeout(300)
check("editor: the path became two, the copy's shutter is chosen", pgS.locator(".feDlg .feLane").count() == 2
      and pgS.locator(".feDlg [data-block='1:2'].sel").count() == 1, pgS.inner_text(".feDlg .feWords"))
pgS.click(".feDlg [data-field=do] [data-value=pos]"); pgS.wait_for_timeout(200)
pgS.fill(".feDlg [data-field=v]", "50"); pgS.press(".feDlg [data-field=v]", "Tab"); pgS.wait_for_timeout(200)
words_sd = pgS.inner_text(".feDlg .feWords")
check("editor: in words: 'heute ist nicht Heiligabend' → open, 'heute ist Heiligabend' → 50 %",
      "heute ist nicht Heiligabend" in words_sd and "heute ist Heiligabend" in words_sd and "50 %" in words_sd, words_sd)
pgS.click(".feDlg [data-block='0:1']"); pgS.wait_for_timeout(300)
check("editor: the block '🎉 Besonderer Tag' has 'Nur wenn heute …' and the days", pgS.locator(".feDlg .feProps [data-field=is] [data-value=no].on").count() == 1
      and pgS.locator(f".feDlg .feProps [data-field=days] [data-value={xmas_sd}].on").count() == 1)
pgS.click(".feDlg [data-act=feSave]")
saved_sd = wait_sd(lambda: pgS.locator(".feDlg .feSync[data-sync=ok]").count() == 1)
flow_sd = next((f for f in api("api/rules")["flows"] if f["name"] == "Rollo morgens"), {})
lanes_sd = [[b["k"] + (":" + b.get("is", "") if b["k"] == "if_special" else "") for b in l["blocks"]] for l in flow_sd.get("lanes", [])]
check("editor: saved as two paths with the condition", saved_sd and lanes_sd == [["time", "if_special:no", "cover"], ["time", "if_special:yes", "cover"]]
      and flow_sd["lanes"][1]["blocks"][2] == {"k": "cover", "ents": ["cover.rollo"], "same": False, "do": "pos", "v": 50}, flow_sd)
autos_sd = json.load(urllib.request.urlopen(HA + "/_autos"))
a2 = autos_sd.get("fp3d_" + flow_sd.get("id", "f_")[2:] + "_l2") or {}
tpl_sd = (a2.get("actions") or [{}])[0].get("value_template", "")
check("ha: the automation of the copy starts with a template condition: today is 24 December", "'12-24'" in tpl_sd and tpl_sd.startswith("{{ (") and "not" not in tpl_sd, a2)
pgS.click(".feDlg [data-act=feBack]"); pgS.wait_for_timeout(400)

# --- the roller shutter card with its quick positions
pgS.click("#tabBar [data-tab=today]"); pgS.wait_for_timeout(800)
pgS.click("#tabBar .tbEdit"); pgS.wait_for_timeout(500)
pgS.click("[data-page=today] .bdAdd"); pgS.click(".ceDlg [data-type=cover]"); pgS.wait_for_timeout(300)
pgS.click(".ceDlg .ceItem[data-entity='cover.rollo']"); pgS.wait_for_timeout(300)
pre_sd = pgS.evaluate("[...document.querySelectorAll('.ceDlg .cePrev .ocPresets button')].map((b) => b.textContent)")
on_sd = pgS.evaluate("[...document.querySelectorAll('.ceDlg [data-field=presets] button.on')].map((b) => b.dataset.v)")
check("card: a roller shutter card has 0 % · 50 % · 75 % · 100 % under ▲ ■ ▼ (preview), ticked under 'Feste Stufen'",
      pre_sd == ["0 %", "50 %", "75 %", "100 %"] and on_sd == ["0", "50", "75", "100"], (pre_sd, on_sd))
pgS.click(".ceDlg [data-field=presets] [data-v='25']"); pgS.wait_for_timeout(200)
pgS.click(".ceDlg [data-act=save]"); pgS.wait_for_timeout(800)
pgS.click("[data-page=today] .bdStrip [data-act=done]"); pgS.wait_for_timeout(600)
card_sd = (api("api/settings").get("pageLayouts", {}).get("today", {}).get("cards") or [{}])[0]
check("card: '25 %' added, saved with the card", card_sd.get("presets") == [0, 25, 50, 75, 100], card_sd)
n_sd = len(json.load(urllib.request.urlopen(HA + "/_calldata")))
pgS.click("[data-page=today] .oc-cover .ocPresets [data-pos='75']")
check("card: a tap on '75 %' sends the shutter to 75 % and marks it",
      wait_sd(lambda: ["set_cover_position", "cover.rollo", 75] in json.load(urllib.request.urlopen(HA + "/_calldata"))[n_sd:])
      and wait_sd(lambda: pgS.locator("[data-page=today] .oc-cover .ocPresets [data-pos='75'].on").count() == 1))
check("special days and the card: no errors on the page", not errs_sd, errs_sd[:3])
pgS.close()
rules_sd({"heat": {}, "flows": [], "days": []})
urllib.request.urlopen(HA + "/_set?e=cover.rollo&s=closed").read()
set_setting("pageLayouts", st_sd.get("pageLayouts", {}))
set_setting("language", st_sd.get("language", ""))
