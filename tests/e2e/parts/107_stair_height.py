"""5.28.5, the owner: „bei den Wendeltreppen mach bitte so, dass ich die auch unterschiedlich hoch machen kann … die Wendeltreppe geht quasi
von meinem Garten hoch auf die Dachterrasse und … kommt oben ein Rechteck an und rechts und links ist Geländer“. A stair has „Höhe“ (its own
height instead of its floors), a spiral stair „Steg oben“ (a straight walkway on from its landing with a hand rail on both sides); both in
the classic panel and in „✨ Neu“, where the search finds them.
"""
saved_sh = api_admin("api/layout")              # put back at the end
st_sh = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps({"version": 1, "floors": [
    {"id": "shEG", "name": "EG", "kind": "floor", "walls": [], "rooms": [{"id": "shR", "name": "Garten", "points": [[0, 0], [8, 0], [8, 6], [0, 6]]}],
     "devices": [], "blocks": [], "stairs": [{"id": "shSp", "name": "Wendeltreppe", "type": "spiral", "x": 4, "z": 3, "rot": 0, "w": 0.9,
                                               "tread": 0.27, "turn": "right", "dir": "up", "floors": 1}]}]}).encode(), method="PUT",
    headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
own_sh = []
pgS = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("console", lambda m: own_sh.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: own_sh.append("PAGEERROR " + str(e)))
pgS.goto(BASE + "?debug=1&mode=edit"); pgS.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgS.wait_for_timeout(800)
pgS.evaluate("() => window.__fp.switchFloor(0)"); pgS.wait_for_timeout(400)
H = pgS.evaluate("window.__fp.stairGeo('shSp').top")
stair_sh = lambda: pgS.evaluate("window.__fp.layout.floors[0].stairs[0]")
pgS.evaluate("() => window.__fp.select('stair', 'shSp')"); pgS.wait_for_timeout(500)
check("stair height: a spiral has „Höhe“ (as high as the storey at first) and „Steg oben (Länge)“, no „↺“ yet",
      pgS.is_visible("#stairHeight") and pgS.is_visible("#stairExit") and pgS.locator("#stairHeightReset").count() == 0
      and abs(float(pgS.input_value("#stairHeight").replace(",", ".")) - H) < 0.01, (pgS.input_value("#stairHeight"), H))
pgS.fill("#stairHeight", "3.4"); pgS.locator("#stairHeight").dispatch_event("change"); pgS.wait_for_timeout(700)
g = pgS.evaluate("window.__fp.stairGeo('shSp')")
check("stair height: 3,40 m: stored, the stair climbs 3.40 m, the line under „Stufen“ says „eigene Höhe“, „↺“ is there",
      stair_sh().get("h") == 3.4 and abs(g["top"] - 3.4) < 0.01 and "eigene Höhe" in pgS.inner_text("#stairRise") and pgS.locator("#stairHeightReset").count() == 1,
      (stair_sh(), g, pgS.inner_text("#stairRise")))
pgS.fill("#stairExit", "1.5"); pgS.locator("#stairExit").dispatch_event("change"); pgS.wait_for_timeout(700)
g = pgS.evaluate("window.__fp.stairGeo('shSp')")
check("stair walkway: 1,50 m: stored, a walkway at the top with a hand rail on both sides", stair_sh().get("exit") == 1.5 and g["walkway"] and g["rails"] == 2, (stair_sh(), g))
pgS.click("#stairHeightReset"); pgS.wait_for_timeout(700)
check("stair height: „↺ Wieder so hoch wie die Etage“: no own height, as high as the storey again", "h" not in stair_sh()
      and abs(pgS.evaluate("window.__fp.stairGeo('shSp').top") - H) < 0.01, stair_sh())
pgS.fill("#stairExit", "0"); pgS.locator("#stairExit").dispatch_event("change"); pgS.wait_for_timeout(500)
check("stair walkway: 0: none any more", "exit" not in stair_sh() and not pgS.evaluate("window.__fp.stairGeo('shSp').walkway"), stair_sh())

# ---- ✨ Neu (the owner, 2026-11-10: „bitte vergiss nicht die Ansicht in der v2“)
pgS.goto(BASE + "?debug=1&mode=edit&ui=2"); pgS.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgS.wait_for_timeout(800)
pgS.evaluate("() => window.__fp.switchFloor(0)"); pgS.wait_for_timeout(400)
pgS.evaluate("() => window.__fp.select('stair', 'shSp')"); pgS.wait_for_timeout(600)
check("stair height / ✨ Neu: „Höhe“ and „Steg oben“ in the section 📐 (form)",
      pgS.locator("#propsBody .v2Sec[data-sec=form] #stairHeight").count() == 1 and pgS.locator("#propsBody .v2Sec[data-sec=form] #stairExit").count() == 1,
      pgS.inner_text("#propsBody")[:300])
pgS.fill("#v2Search", "Steg"); pgS.wait_for_timeout(500)
check("stair height / ✨ Neu: „🔍 Einstellung suchen“ finds „Steg oben“", pgS.is_visible("#stairExit") and "Treffer" in pgS.inner_text("#v2SearchRes"), pgS.inner_text("#v2SearchRes"))
pgS.fill("#v2Search", ""); pgS.wait_for_timeout(200)
pgS.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
check("stair height: no errors on the page", not own_sh, own_sh[:5])
pgS.close()
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_sh).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("language", st_sh.get("language", "de")); set_setting("units", st_sh.get("units", "metric"))
