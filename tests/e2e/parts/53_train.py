"""4.31.0 (#550): the card "🚆 Zug". In ✎ "＋ Karte" → 🚆 Zug: station, direction, "mein Zug"; the add-on asks the departures service of
DB Infoscreen (here the stand-in /_dbf) at most once a minute; the card shows "mein Zug" big (+5 Min in yellow, Gleis 4 statt 3, "in … Min",
the railway's note) and the next departures (a cancelled one struck through); an unknown station is said in words.
"""
st_tr = api("api/settings")
set_setting("language", "de"); set_setting("pageLayouts", {})
errs_tr = []
pgZ = b.new_page(viewport={"width": 1400, "height": 1100}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgZ.on("console", lambda m: errs_tr.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgZ.on("pageerror", lambda e: errs_tr.append("PAGEERROR " + str(e)))
def wait_tr(fn, n=30, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgZ.wait_for_timeout(ms)
    return fn()
deps_tr = json.load(urllib.request.urlopen(HA + "/_dbf/Testbahnhof.json"))["departures"]
mine_tr = deps_tr[1]["scheduledDeparture"]
pgZ.goto(BASE + "?debug=1"); pgZ.wait_for_timeout(1500)
if pgZ.is_visible("#modeSwitch [data-mode=live]"): pgZ.click("#modeSwitch [data-mode=live]"); pgZ.wait_for_timeout(1000)
pgZ.click("#tabBar [data-tab=today]"); pgZ.wait_for_timeout(1200)
pgZ.click("#tabBar .tbEdit"); pgZ.wait_for_timeout(500)
pgZ.click("[data-page=today] .bdAdd"); pgZ.wait_for_timeout(400)
pgZ.click(".ceDlg [data-type=train]"); pgZ.wait_for_timeout(600)
check("train card: '＋ Karte' → 🚆 Zug waits for a station", pgZ.is_disabled(".ceDlg [data-act=save]"))
pgZ.fill(".ceDlg input[data-field=station]", "Testbahnhof"); pgZ.press(".ceDlg input[data-field=station]", "Tab")
pgZ.fill(".ceDlg input[data-field=via]", "Frankfurt (Main) Hbf"); pgZ.press(".ceDlg input[data-field=via]", "Tab")
pgZ.fill(".ceDlg input[data-field=mine]", mine_tr); pgZ.press(".ceDlg input[data-field=mine]", "Tab")
check("train card: the preview shows 'Dein Zug' with the departures", wait_tr(lambda: pgZ.locator(".ceDlg .cePrev .trMine[data-kind=late]").count() == 1),
      pgZ.inner_text(".ceDlg .cePrev")[:200])
pgZ.click(".ceDlg [data-act=save]"); pgZ.wait_for_timeout(400)
pgZ.click("[data-page=today] [data-act=done]"); pgZ.wait_for_timeout(1200)
card_tr = "[data-page=today] .ocCard.oc-train"
saved_tr = [c for c in api("api/settings").get("pageLayouts", {}).get("today", {}).get("cards", []) if c.get("type") == "train"]
check("train card: saved with station, direction and mein Zug", saved_tr and saved_tr[0]["station"] == "Testbahnhof" and saved_tr[0]["via"] == "Frankfurt (Main) Hbf"
      and saved_tr[0]["mine"] == mine_tr, saved_tr)
mine_box = wait_tr(lambda: pgZ.locator(f"{card_tr} .trMine").count() == 1 and pgZ.inner_text(f"{card_tr} .trMine"))
check("train card: 'mein Zug' big: RE 4711, +5 Min, Gleis 4 statt 3, in … Min, the railway's note",
      mine_box and "RE 4711" in mine_box and "+5 Min" in mine_box and "Gleis 4" in mine_box and "statt 3" in mine_box and "in " in mine_box
      and "vorausfahrenden" in mine_box, mine_box)
rows_tr = pgZ.evaluate(f"[...document.querySelectorAll('{card_tr} .trRow')].map((r) => r.dataset.train + ':' + r.className)")
check("train card: the next departures below, the cancelled one struck through, mein Zug not twice",
      [r.split(":")[0] for r in rows_tr] == ["RB 15", "ICE 1576", "RE 50"] and "trK-gone" in rows_tr[1], rows_tr)
r_bad = json.load(urllib.request.urlopen(BASE + "api/train?station=Nirgendwo"))
check("train card: an unknown station comes back as an error the card says in words", r_bad["rows"] == [] and "Unknown station" in r_bad["error"], r_bad)
check("train card: no errors on the page", not errs_tr, errs_tr[:3])
pgZ.close()
set_setting("pageLayouts", st_tr.get("pageLayouts", {}))
set_setting("language", st_tr.get("language", ""))
