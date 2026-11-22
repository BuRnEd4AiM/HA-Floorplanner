"""5.30.0 (#779, FrankBecker: „Mach … die Möglichkeit für den JSON Import prominenter“; the owner chose all four ideas of docs/ideen-5.30):
a house from the floor plan by an AI first and big on the welcome card of an empty house („🤖 Haus aus dem Bauplan bauen lassen“, am
schnellsten), in front in 🧭 Erste Schritte („🤖 Aus dem Bauplan per KI“), and three numbered steps on top of the import dialog
(„📋 KI-Text kopieren“, Claude / ChatGPT / Gemini with a photo or PDF of the plan, paste, „Prüfen“, „Importieren“); the file and the
examples below as „Oder:“; „📥 Fertige JSON-Datei importieren“ opens the file chooser at once.
"""
st_ia = api("api/settings")
set_setting("language", "de")
pgI = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}, welcome=True)
own_ia = []
pgI.on("pageerror", lambda e: own_ia.append("PAGEERROR " + str(e)))
pgI.on("dialog", lambda d: d.accept("KI Haus") if d.type == "prompt" else d.accept())
pgI.goto(BASE + "?debug=1&mode=edit"); pgI.wait_for_timeout(1500)
h0_ia = pgI.evaluate("window.__fp.houseId()")
pgI.evaluate("document.querySelector('#housePanel').open = true")
pgI.click("#houseNew"); pgI.wait_for_timeout(1500)
pgI.wait_for_selector("#welcome:not([hidden])", timeout=10000)
btns_ia = pgI.eval_on_selector_all("#welcome .welBtns > button", "l => l.map(e => e.id)")
check("🤖 a new empty house: the welcome card has the AI way first, then draw, example, JSON file", btns_ia == ["welAi", "welDraw", "welExample", "welImport"], btns_ia)
ai_txt = pgI.inner_text("#welAi")
check("🤖 its words: „Haus aus dem Bauplan bauen lassen“, „am schnellsten“, Claude, ChatGPT, Gemini", "Haus aus dem Bauplan bauen lassen" in ai_txt
      and "am schnellsten" in ai_txt and "Claude, ChatGPT, Gemini" in ai_txt, ai_txt)
check("🤖 the others: „Wände selbst zeichnen“, „Fertige JSON-Datei importieren“", "Wände selbst zeichnen" in pgI.inner_text("#welDraw")
      and "Fertige JSON-Datei importieren" in pgI.inner_text("#welImport"), (pgI.inner_text("#welDraw"), pgI.inner_text("#welImport")))
pgI.click("#welAi"); pgI.wait_for_selector("#importDialog[open]", timeout=5000)
check("🤖 „Haus aus dem Bauplan bauen lassen“ opens the import dialog, its new title", "Haus aus dem Bauplan (mit KI) oder aus JSON bauen" in pgI.inner_text("#importDialog h2")
      and not pgI.is_visible("#welcome"), pgI.inner_text("#importDialog h2"))
steps_ia = pgI.inner_text("#importAi")
check("🤖 on top three numbered steps: „📋 KI-Text kopieren“, Claude / ChatGPT / Gemini with a photo or PDF, „Prüfen“ → „Importieren“",
      pgI.is_visible("#importAi") and pgI.locator("#importAi .impStep").count() == 3 and pgI.locator("#importAi #importPrompt").count() == 1
      and "KI-Text kopieren" in pgI.inner_text("#importPrompt") and "Foto oder PDF deines Bauplans" in steps_ia and "„Prüfen“ → „Importieren“" in steps_ia
      and "Erste Schritte" in steps_ia, steps_ia)
bar_ia = pgI.inner_text("#importDialog .impBar")
check("🤖 below: „Oder:“ with the file and the three examples; the text box asks for the AI's answer", bar_ia.startswith("Oder:")
      and pgI.locator("#importDialog .impBar #importExShow").count() == 1 and pgI.locator("#importDialog .impBar #importPrompt").count() == 0
      and pgI.get_attribute("#importText", "placeholder") == "Antwort der KI (JSON) hier einfügen …", (bar_ia, pgI.get_attribute("#importText", "placeholder")))
pgI.click("#importPrompt"); pgI.wait_for_timeout(1200)
res_ia, val_ia = pgI.inner_text("#importResult"), pgI.input_value("#importText")
check("🤖 „📋 KI-Text kopieren“ copies the text for the AI (or puts it into the box when copying is not allowed)",
      ("Kopiert." in res_ia and "Foto oder PDF des Bauplans" in res_ia) or val_ia.startswith("Du bist Assistent"), (res_ia, val_ia[:80]))
pgI.keyboard.press("Escape"); pgI.wait_for_timeout(500)
acts_ia = pgI.eval_on_selector_all("#firstSteps [data-step=draw] .fsDetail button", "l => l.map(e => [e.dataset.act, e.classList.contains('primary')])")
check("🧭 the welcome card opened Erste Schritte too: step 1 „Grundriss: per KI, zeichnen oder Vorlage“ with „🤖 Aus dem Bauplan per KI“ first and highlighted",
      pgI.is_visible("#firstSteps") and "Grundriss: per KI, zeichnen oder Vorlage" in pgI.inner_text("#firstSteps [data-step=draw]")
      and acts_ia == [["ai", True], ["draw", False], ["example", False]] and "Aus dem Bauplan per KI" in pgI.inner_text("#firstSteps [data-act=ai]"), acts_ia)
pgI.click("#firstSteps [data-act=ai]"); pgI.wait_for_timeout(600)
check("🧭 „🤖 Aus dem Bauplan per KI“ opens the import dialog", pgI.evaluate("document.getElementById('importDialog').open"))
pgI.keyboard.press("Escape"); pgI.wait_for_timeout(400)
pgI.evaluate("document.getElementById('welcome').hidden = false")        # the card again (it closed itself), for its last button
with pgI.expect_file_chooser(timeout=5000) as fc_ia:
    pgI.click("#welImport")
check("📥 „Fertige JSON-Datei importieren“ opens the import dialog and the file chooser at once", pgI.evaluate("document.getElementById('importDialog').open")
      and fc_ia.value is not None)
pgI.keyboard.press("Escape"); pgI.wait_for_timeout(300)
check("🤖 no errors on the page", not own_ia, own_ia)
pgI.evaluate(f"window.__fp.switchHouse('{h0_ia}')"); pgI.wait_for_timeout(800)
pgI.evaluate("fetch('api/houses').then(r => r.json()).then(l => Promise.all(l.filter(h => h.name === 'KI Haus').map(h => fetch('api/houses/' + h.id, {method: 'DELETE'}))))")
pgI.wait_for_timeout(500)
check("🤖 the test house is gone again", not any(h["name"] == "KI Haus" for h in api_admin("api/houses")))
pgI.close()
set_setting("language", st_ia.get("language", "de"))
