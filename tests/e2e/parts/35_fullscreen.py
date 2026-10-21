"""4.7.0 (#487): a full screen kept on for a user. The lock "Vollbild verlassen" (users dialog) keeps that user's screen in full screen:
a sheet lies over the page while it is not in full screen (a tap goes back into it), ⛶ in the bar asks for the code instead of leaving,
a wrong code is refused, the right one (set by an admin in ⚙ → Benutzer, kept hashed by the add-on) ends it; leaving another way (Esc)
brings the sheet back. Without the lock ⛶ goes in and out as before.
"""
def put_fs(code):
    req = urllib.request.Request(BASE + "api/fullscreen", data=json.dumps({"code": code}).encode(), method="PUT",
                                 headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req))
st_fs = api("api/settings")
set_setting("language", "de")
set_setting("userLocks", {**(st_fs.get("userLocks") or {}), "tablet_fs": ["fullscreen"]})
put_fs("")
own_fs = []
def watch_fs(pg_):
    pg_.on("console", lambda m: own_fs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
    pg_.on("pageerror", lambda e: own_fs.append("PAGEERROR " + str(e)))
    return pg_
full_fs = lambda pg_: pg_.evaluate("!!document.fullscreenElement")
cover_fs = lambda pg_: pg_.evaluate("(() => { const c = document.querySelector('#fullCover'); return c && !c.hidden ? c.className + ' ' + c.innerText : ''; })()")

# --- the admin: the tick in the users dialog and the code in ⚙ → Benutzer
pgA = watch_fs(b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"}))
pgA.goto(BASE + "?debug=1"); pgA.wait_for_timeout(1500)
open_users(pgA)
check("fullscreen (#487): the users dialog has the lock 'Vollbild verlassen', ticked for the tablet; no code yet is said in orange",
      pgA.locator("#tabletRows [data-lock=fullscreen]:checked").count() == 1 and pgA.locator("#fullCodeStatus.fcWarn").count() == 1, pgA.inner_text("#fullCodeBox"))
pgA.fill("#fullCode", "12"); pgA.click("#fullCodeSave"); pgA.wait_for_timeout(500)
check("fullscreen: a code of two digits is refused", "4 bis 8 Ziffern" in pgA.inner_text("#fullCodeStatus") and api("api/fullscreen") == {"hasCode": False})
pgA.fill("#fullCode", "2580"); pgA.click("#fullCodeSave"); pgA.wait_for_timeout(800)
check("fullscreen: the code is saved by the add-on, not in the settings every tablet reads",
      api("api/fullscreen") == {"hasCode": True} and "Code gespeichert" in pgA.inner_text("#fullCodeStatus") and "2580" not in json.dumps(api("api/settings")))
pgA.close()

# --- the tablet with the lock
pgT = watch_fs(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_fs"}))
pgT.goto(BASE + "?debug=1"); pgT.wait_for_timeout(2000)
check("fullscreen: the tablet starts with a sheet 'Tippen für Vollbild' over everything", "fc-cover" in cover_fs(pgT) and "Tippen für Vollbild" in cover_fs(pgT), cover_fs(pgT))
pgT.click("#fullEnter"); pgT.wait_for_timeout(800)
check("fullscreen: a tap goes into full screen, the sheet is gone, ⛶ at the right says 🔒 'Vollbild beenden'",
      full_fs(pgT) and not cover_fs(pgT) and pgT.locator("#tabBar .tbFull.kept").count() == 1 and "Vollbild beenden" in pgT.inner_text("#tabBar .tbFull"),
      (full_fs(pgT), cover_fs(pgT)))
pgT.click("#tabBar .tbFull"); pgT.wait_for_timeout(400)
check("fullscreen: ⛶ does not leave, it asks for the code", full_fs(pgT) and pgT.is_visible("#fullCover.fc-ask .fcPad"))
for k in "1111":
    pgT.click(f"#fullCover .fcPad [data-key='{k}']")
pgT.click("#fullGo"); pgT.wait_for_timeout(800)
check("fullscreen: a wrong code is refused, it stays in full screen", full_fs(pgT) and "Falscher Code" in cover_fs(pgT), cover_fs(pgT))
pgT.keyboard.type("2580"); pgT.keyboard.press("Enter"); pgT.wait_for_timeout(1000)
check("fullscreen: the right code (typed on the keyboard) ends it; ⛶ is a plain ⛶ again",
      not full_fs(pgT) and not cover_fs(pgT) and pgT.locator("#tabBar .tbFull.kept").count() == 0 and "Vollbild" in pgT.inner_text("#tabBar .tbFull"),
      (full_fs(pgT), cover_fs(pgT)))
pgT.click("#tabBar .tbFull"); pgT.wait_for_timeout(800)
check("fullscreen: ⛶ again: back into full screen and kept again", full_fs(pgT) and pgT.locator("#tabBar .tbFull.kept").count() == 1)
pgT.evaluate("document.exitFullscreen()"); pgT.wait_for_timeout(800)
check("fullscreen: left another way (like Esc): the sheet 'Das Vollbild wurde verlassen' is back at once",
      not full_fs(pgT) and "Das Vollbild wurde verlassen" in cover_fs(pgT), cover_fs(pgT))
pgT.mouse.click(15, 15); pgT.wait_for_timeout(800)
check("fullscreen: a tap anywhere on the sheet goes back into full screen", full_fs(pgT) and not cover_fs(pgT))
pgT.close()

# --- a browser that says it can but then refuses (some app WebViews): the sheet must not lock the screen out
pgR = watch_fs(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_fs"}))
pgR.add_init_script("Element.prototype.requestFullscreen = function () { return Promise.reject(new TypeError('refused')); };")
pgR.goto(BASE + "?debug=1"); pgR.wait_for_timeout(2000)
was = cover_fs(pgR)
pgR.click("#fullEnter"); pgR.wait_for_timeout(800)
check("fullscreen: a browser that refuses full screen gets no sheet after the tap (nothing to keep, never locked out)",
      "fc-cover" in was and not cover_fs(pgR) and not full_fs(pgR), (was, cover_fs(pgR)))
pgR.close()

# --- without the lock: in and out without a code
set_setting("userLocks", st_fs.get("userLocks") or {})
pgU = watch_fs(b.new_page(viewport={"width": 1280, "height": 800}, extra_http_headers={"X-Remote-User-Name": "tablet_fs"}))
pgU.goto(BASE + "?debug=1"); pgU.wait_for_timeout(2000)
had = not cover_fs(pgU)
pgU.click("#tabBar .tbFull"); pgU.wait_for_timeout(800)
went = full_fs(pgU) and pgU.locator("#tabBar .tbFull.kept").count() == 0
pgU.click("#tabBar .tbFull"); pgU.wait_for_timeout(800)
check("fullscreen: without the lock no sheet, ⛶ goes in and out without a code", had and went and not full_fs(pgU) and not cover_fs(pgU), (had, went))
pgU.close()
check("fullscreen: no errors on the page", not own_fs, own_fs[:3])

put_fs("")
set_setting("language", st_fs.get("language", ""))
