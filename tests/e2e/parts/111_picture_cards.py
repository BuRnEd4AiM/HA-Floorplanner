"""5.33.0 🖼 Bildkarten fürs Handy (the owner's choice of docs/ideen-5.33: idea 1 "Bausteine untereinander" with templates, in ▶ Abläufe, all
of it): the three cards a house starts with, the part of ▶ Abläufe with their pictures, the editor (a block's options, another block, ▲▼,
saved), a new card from a template and deleted, a card per kind of alarm (water: the card is the one picture), „Test an mich“ and a routine's
message as a card, the routine editor's „🖼 Als Bildkarte schicken“ (piccard.py draws, Telegram is the stand-in /_tg of the mock).
"""
saved_pc = api_admin("api/layout")
lang_pc = api("api/settings")["language"]
set_setting("language", "de")
TOKEN_PC = "123456789:AAH" + "p" * 32


def notified_pc():
    return json.loads(urllib.request.urlopen(HA + "/_notified").read())


def send_pc(path, body, method="PUT"):
    r = urllib.request.urlopen(urllib.request.Request(BASE + path, data=json.dumps(body).encode(), method=method,
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
    return r.read()


def extra_pc(d):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(d).encode(), method="POST", headers={"Content-Type": "application/json"})).read()


extra_pc({"binary_sensor.wasser_pc": {"state": "off", "attributes": {"friendly_name": "Wassermelder Keller", "device_class": "moisture"}}})
lay_pc = json.loads(json.dumps(saved_pc))
f_pc = lay_pc["floors"][0]
f_pc.setdefault("rooms", []).append({"id": "pc_room", "name": "Waschküche", "color": "#777777", "points": [[70, 70], [74, 70], [74, 73], [70, 73]]})
f_pc.setdefault("walls", []).append({"id": "pc_wall", "a": [70, 70], "b": [74, 70], "thickness": 0.2, "height": 2.6, "openings": []})
f_pc.setdefault("devices", []).extend([
    {"id": "pc_w", "type": "sensor", "x": 71, "z": 71, "y": 0, "rot": 0, "scale": 1, "name": "Wassermelder", "entity": "binary_sensor.wasser_pc"},
    {"id": "pc_c", "type": "camera", "x": 73.5, "z": 72.5, "y": 2.2, "rot": 0, "scale": 1, "name": "Kamera Waschküche", "entity": "camera.flur"}])
send_pc("api/layout", lay_pc)

start_pc = json.loads(urllib.request.urlopen(urllib.request.Request(BASE + "api/piccards", headers={"X-Remote-User-Name": "admin"})).read())
check("🖼 a house starts with three cards: „Wasser-Alarm“, „Test 1“ (not the owner's name), „Gute Nacht“",
      [c["name"] for c in start_pc["cards"]] == ["Wasser-Alarm", "Test 1", "Gute Nacht"] and start_pc["edit"] is True, start_pc)
png_pc = send_pc("api/piccards/preview", {"id": "wasser"}, "POST")
check("🖼 the add-on draws a card as a PNG 960 pixels wide", png_pc[:4].hex() == "89504e47" and int.from_bytes(png_pc[16:20], "big") == 960, len(png_pc))

pgPC = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_pc = []
pgPC.on("pageerror", lambda e: own_pc.append("PAGEERROR " + str(e)))
pgPC.on("dialog", lambda d: d.accept())
pgPC.goto(BASE + "?debug=1&mode=live"); pgPC.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgPC.wait_for_timeout(800)
pgPC.click("#tabBar [data-tab=routines]")
pgPC.wait_for_function("document.querySelectorAll('[data-page=routines] .pcCard .pcTile[data-card] img.pcThumb').length === 3 "
                       "&& [...document.querySelectorAll('[data-page=routines] .pcCard img.pcThumb')].every((i) => i.naturalWidth > 0)", timeout=30000)
check("🖼 ▶ Abläufe has „🖼 Bildkarten fürs Handy“: the three cards as pictures and „＋ Neue Bildkarte“",
      pgPC.locator("[data-page=routines] .pcCard [data-act=newCard]").count() == 1 and "Bildkarten fürs Handy" in pgPC.text_content("[data-page=routines] .pcCard h3"))

# the editor: a card, a block's option, another block moved up, saved
pgPC.click("[data-page=routines] .pcTile[data-card=test1]")
pgPC.wait_for_function("document.querySelector('#picCardDlg[open] #pcPreview')?.naturalWidth > 0", timeout=20000)
rows_pc = pgPC.evaluate("[...document.querySelectorAll('#picCardDlg .pcRow')].map((r) => r.dataset.k)")
check("🖼 the editor: its name, the blocks from top to bottom, the card as the add-on draws it",
      pgPC.input_value("#pcName") == "Test 1" and rows_pc == ["camera", "clock", "text", "plan", "info", "foot"], rows_pc)
src0 = pgPC.get_attribute("#pcPreview", "src")
pgPC.click("#picCardDlg .pcRow[data-k=clock] .pcRowMain"); pgPC.wait_for_timeout(200)
pgPC.uncheck("#picCardDlg .pcOpts [data-opt=date]")
pgPC.wait_for_function(f"document.querySelector('#pcPreview').src !== {json.dumps(src0)} && document.querySelector('#pcPreview').naturalWidth > 0", timeout=20000)
check("🖼 a block's option (the clock without the date): its line says so, the picture is drawn anew",
      "nur die Uhrzeit" in pgPC.inner_text("#picCardDlg .pcRow[data-k=clock]"))
# a chosen floor for the plan (the owner's wish 2026-11-24: "Stockwerke auswählen")
pgPC.click("#picCardDlg .pcRow[data-k=plan] .pcRowMain"); pgPC.wait_for_timeout(200)
fl_pc = pgPC.evaluate("[...document.querySelectorAll('#picCardDlg .pcOpts [data-opt=floor] option')].map((o) => [o.value, o.textContent])")
src1 = pgPC.get_attribute("#pcPreview", "src")
pgPC.select_option("#picCardDlg .pcOpts [data-opt=floor]", fl_pc[-1][0]); pgPC.wait_for_timeout(300)
pgPC.wait_for_function(f"document.querySelector('#pcPreview').src !== {json.dumps(src1)} && document.querySelector('#pcPreview').naturalWidth > 0", timeout=20000)
check("🖼 the plan's „Stockwerk“: „Automatisch“ and every floor of the house; the chosen one is in its line, the picture drawn anew",
      fl_pc[0][0] == "" and len(fl_pc) >= 3 and fl_pc[-1][1] in pgPC.inner_text("#picCardDlg .pcRow[data-k=plan]"), fl_pc)
pgPC.click("#picCardDlg [data-add=line]"); pgPC.wait_for_timeout(200)
pgPC.click("#picCardDlg .pcRow[data-k=line] [data-act=up]"); pgPC.wait_for_timeout(200)
rows_pc = pgPC.evaluate("[...document.querySelectorAll('#picCardDlg .pcRow')].map((r) => r.dataset.k)")
check("🖼 „＋ Trennlinie“ comes at the end, ▲ moves it up one", rows_pc[-2:] == ["line", "foot"], rows_pc)
pgPC.click("#pcSave"); pgPC.wait_for_timeout(800)
saved_cards = json.loads(urllib.request.urlopen(urllib.request.Request(BASE + "api/piccards", headers={"X-Remote-User-Name": "admin"})).read())["cards"]
t1 = next(c for c in saved_cards if c["id"] == "test1")
check("🖼 „Speichern“: the add-on keeps it", [b_["k"] for b_ in t1["blocks"]][-2:] == ["line", "foot"]
      and next(b_ for b_ in t1["blocks"] if b_["k"] == "clock")["date"] is False
      and next(b_ for b_ in t1["blocks"] if b_["k"] == "plan").get("floor") == fl_pc[-1][0] and "Gespeichert" in pgPC.inner_text("#picCardDlg .pcStatus"), t1)
pgPC.click("#picCardDlg .pcClose"); pgPC.wait_for_timeout(300)

# a new card from a template, then deleted
pgPC.click("[data-page=routines] [data-act=newCard]"); pgPC.wait_for_timeout(300)
check("🖼 „＋ Neue Bildkarte“: six templates", pgPC.locator("#picCardDlg .pcTpl").count() == 6)
pgPC.click("#picCardDlg [data-tpl=floor]"); pgPC.wait_for_timeout(300)
pgPC.fill("#pcName", "Abend-Check")
pgPC.click("#pcSave"); pgPC.wait_for_timeout(800)
names_pc = [c["name"] for c in json.loads(urllib.request.urlopen(urllib.request.Request(BASE + "api/piccards", headers={"X-Remote-User-Name": "admin"})).read())["cards"]]
check("🖼 the template „Etage mit Liste“ named „Abend-Check“ is saved as a fourth card", names_pc[-1] == "Abend-Check" and len(names_pc) == 4, names_pc)
pgPC.click("#pcDelete"); pgPC.wait_for_timeout(800)
check("🖼 „Karte löschen“ takes it away again",
      len(json.loads(urllib.request.urlopen(urllib.request.Request(BASE + "api/piccards", headers={"X-Remote-User-Name": "admin"})).read())["cards"]) == 3
      and not pgPC.evaluate("document.querySelector('#picCardDlg').open"))

# the alarm settings: a card for water; the bot set up by the API
send_pc("api/notify", {"on": True, "via": "tgbot", "bottoken": TOKEN_PC, "botChats": [{"id": "4711", "name": "Flo"}], "kinds": ["water"]})
pgPC.click("#tabBar [data-tab=house]"); pgPC.wait_for_timeout(300)
pgPC.goto(BASE + "?debug=1&mode=edit"); pgPC.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgPC.wait_for_timeout(600)
pgPC.click("#settingsBtn"); open_setting(pgPC, "#alarmNotify")
pgPC.wait_for_function("document.querySelectorAll('#alarmNotify [data-card-kind=water] option').length >= 4", timeout=20000)
opts_pc = pgPC.evaluate("[...document.querySelectorAll('#alarmNotify [data-card-kind=water] option')].map((o) => o.textContent)")
check("🖼 Nachricht aufs Handy → Telegram-Bot: per kind of alarm a card or „Standard“", opts_pc[0].startswith("Standard") and "Wasser-Alarm" in opts_pc, opts_pc)
pgPC.select_option("#alarmNotify [data-card-kind=water]", "wasser")
pgPC.click("#anSave"); pgPC.wait_for_timeout(800)
cfg_pc = json.loads(urllib.request.urlopen(urllib.request.Request(BASE + "api/notify", headers={"X-Remote-User-Name": "admin"})).read())
check("🖼 saved: water → „Wasser-Alarm“", cfg_pc.get("cards") == {"water": "wasser"} and cfg_pc.get("via") == "tgbot", cfg_pc.get("cards"))
n_pc = len(notified_pc())
urllib.request.urlopen(f"{HA}/_set?e=binary_sensor.wasser_pc&s=on").read()
for _ in range(60):
    got_pc = [x for x in notified_pc()[n_pc:] if x[0] == "tg_photo"]
    if got_pc:
        break
    pgPC.wait_for_timeout(250)
pgPC.wait_for_timeout(1500)
got_pc = [x for x in notified_pc()[n_pc:] if x[0] in ("tg_photo", "tg_bot")]
check("🖼 water goes off: ONE picture, the card (a PNG), with the text „Wasser erkannt …“ under it",
      len(got_pc) == 1 and got_pc[0][0] == "tg_photo" and "Wasser erkannt" in (got_pc[0][2] or "") and got_pc[0][4] == "89504e47" and got_pc[0][3] > 5000, got_pc)
urllib.request.urlopen(f"{HA}/_set?e=binary_sensor.wasser_pc&s=off").read()
n_pc = len(notified_pc())
send_pc("api/piccards/test", {"id": "test1"}, "POST")
got_pc = [x for x in notified_pc()[n_pc:] if x[0] == "tg_photo"]
check("🖼 „Test an mich“: the card through the bot, „🖼 Test 1“ under it", len(got_pc) == 1 and "Test 1" in (got_pc[0][2] or "") and got_pc[0][4] == "89504e47", got_pc)

# a routine's message as a card: the routine editor offers the cards, the add-on sends the card
send_pc("api/rules", {"flows": [{"id": "f_pc", "name": "Kartentest", "on": True, "ha": False, "lanes": [
    {"id": "l1", "blocks": [{"k": "button"}, {"k": "notify", "text": "Hallo aus dem Ablauf", "card": "test1"}]}]}]})
pgPC.keyboard.press("Escape"); pgPC.wait_for_timeout(200)
pgPC.goto(BASE + "?debug=1&mode=live"); pgPC.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgPC.wait_for_timeout(600)
pgPC.click("#tabBar [data-tab=routines]"); pgPC.wait_for_timeout(1200)
pgPC.click("[data-page=routines] [data-edit-flow=f_pc]"); pgPC.wait_for_timeout(800)
pgPC.click(".feDlg [data-block='0:1']"); pgPC.wait_for_timeout(300)
sel_pc = pgPC.evaluate("(() => { const s = document.querySelector('.feDlg [data-field=card]'); return s ? [s.value, [...s.options].map((o) => o.textContent)] : null; })()")
check("🖼 the routine editor: „🖼 Als Bildkarte schicken“ with the cards, „Test 1“ chosen", sel_pc and sel_pc[0] == "test1" and "🖼 Test 1" in sel_pc[1], sel_pc)
n_pc = len(notified_pc())
send_pc("api/rules/run", {"flow": "f_pc", "lane": "l1", "test": True}, "POST")
for _ in range(60):
    got_pc = [x for x in notified_pc()[n_pc:] if x[0] == "tg_photo"]
    if got_pc:
        break
    pgPC.wait_for_timeout(250)
check("🖼 the routine runs: its text under the card „Test 1“", len(got_pc) == 1 and got_pc[0][2] == "Hallo aus dem Ablauf" and got_pc[0][4] == "89504e47", got_pc)
check("🖼 no errors on the page", not own_pc, own_pc)
pgPC.close()

send_pc("api/rules", {"flows": []})
send_pc("api/notify", {"on": False, "via": "whatsapp", "bottoken": "", "botChats": [], "cards": {}})
send_pc("api/piccards", {"cards": start_pc["cards"]})
send_pc("api/layout", saved_pc)
extra_pc({})
set_setting("language", lang_pc)
