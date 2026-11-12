"""5.8.0 (the owner: „schau mal, ob du in den Einstellungen oder so Sachen findest, die man vereinfachen oder visuell besser darstellen
kann“; his choice from docs/ideen-5.8): in the settings a tick is a switch, a short drop-down a row of buttons (the drop-down stays, hidden,
it is what is saved), a slider shows "72 %", a length its unit, a long explanation two lines and "mehr …"; "Reiter unten" has a button per
page; "Warnungen & Alarm" is three cards with their state; instructions needed once fold; the rooms of a light group are buttons. Editing on
a tablet: the floor rail ends above the compass (it lay over "Keller").
"""
st_look = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric"); set_setting("theme", "dark")
own_look = []
pgS = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgS.on("pageerror", lambda e: own_look.append("PAGEERROR " + str(e)))
pgS.goto(BASE + "?debug=1&mode=edit"); pgS.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgS.wait_for_timeout(800)
pgS.click("#settingsBtn"); pgS.wait_for_timeout(600)
pgS.click("#sgNav [data-group=general]"); pgS.wait_for_timeout(300)
seg = pgS.evaluate("[...document.querySelectorAll('.segBtns[data-for=setTheme] button')].map((b) => [b.dataset.value, b.classList.contains('on'), b.innerText.trim()])")
check("① the design is three buttons (Hologramm, Dunkel, Hell, each with a colour sample), the drop-down is hidden", len(seg) == 3 and [v for v, on, _ in seg if on] == ["dark"]
      and pgS.evaluate("(() => { const r = document.getElementById('setTheme').getBoundingClientRect(); return r.width <= 1 && r.height <= 1; })()")
      and pgS.locator(".segBtns[data-for=setTheme] .segSwatch").count() == 3, seg)   # hidden but still there (1 px: tests may still pick from it)
pgS.click(".segBtns[data-for=setTheme] button[data-value=light]"); pgS.wait_for_timeout(1200)
check("① a tap on „Hell“ switches the design and saves it", pgS.evaluate("document.documentElement.dataset.theme") == "light" and api("api/settings")["theme"] == "light"
      and pgS.evaluate("document.querySelector('.segBtns[data-for=setTheme] button.on')?.dataset.value") == "light", api("api/settings")["theme"])
pgS.select_option("#setTheme", "dark"); pgS.wait_for_timeout(1200)
check("① a pick in the hidden drop-down moves the buttons along", pgS.evaluate("document.querySelector('.segBtns[data-for=setTheme] button.on')?.dataset.value") == "dark"
      and api("api/settings")["theme"] == "dark")
units = pgS.evaluate("[...document.querySelectorAll('.segBtns[data-for=setUnits] button')].map((b) => [b.querySelector('.segMain').textContent, b.querySelector('.segNote')?.textContent])")
check("① „Metrisch (m)“ is a button with its note under the name", units == [["Metrisch", "m"], ["Imperial", "ft"]], units)
pgS.click("#sgNav [data-group=view]"); pgS.wait_for_timeout(400)
sw = pgS.evaluate("(() => { const c = document.getElementById('setShadows'), s = getComputedStyle(c); return [s.appearance, Math.round(c.getBoundingClientRect().width), c.checked]; })()")
check("① „Schatten“ is a switch (the same tick, 44 px wide)", sw[0] == "none" and sw[1] == 44, sw)
pgS.click("#setShadows"); pgS.wait_for_timeout(1000)
check("① a tap on the switch changes the setting", api("api/settings")["shadows"] == (not sw[2]))
pgS.click("#setShadows"); pgS.wait_for_timeout(800)
op = pgS.evaluate("(() => { const r = document.getElementById('setWallOpacity'); return [r.type, r.nextElementSibling?.textContent]; })()")
check("① „Wand-Deckkraft“ is a slider that shows its value in percent", op[0] == "range" and op[1].endswith("%"), op)
pgS.evaluate("(() => { const r = document.getElementById('setWallOpacity'); r.value = '0.5'; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); })()")
pgS.wait_for_timeout(1000)
check("① moving it shows „50 %“ and saves 0.5", pgS.evaluate("document.getElementById('setWallOpacity').nextElementSibling.textContent") == "50 %"
      and abs(api("api/settings")["wallOpacity"] - 0.5) < 1e-6, api("api/settings")["wallOpacity"])
more = pgS.evaluate("(() => { const p = document.querySelector('#settingsDialog details[data-group=view] p.clamp'); return p ? [p.textContent.slice(0, 30), p.nextElementSibling?.className] : null; })()")
check("① a long explanation shows two lines and „mehr …“", more is not None and more[1] == "moreBtn", more)
pgS.click("#settingsDialog details[data-group=view] .moreBtn"); pgS.wait_for_timeout(300)
check("① „mehr …“ shows it whole", pgS.locator("#settingsDialog details[data-group=view] p.clamp").count() == 0 and pgS.locator("#settingsDialog details[data-group=view] .moreBtn").count() == 0)
pgS.click("#sgNav [data-group=drawing]"); pgS.wait_for_timeout(300)
check("① a length shows its unit", pgS.inner_text("#setWallHeight + .unit") == "m", pgS.inner_text("#setWallHeight + .unit"))

# ② "Reiter unten": a button per page, only that page shows
pgS.evaluate("localStorage.removeItem('fp3d.setPage')")
pgS.click("#sgNav [data-group=tabs]"); pgS.wait_for_timeout(400)
pages = pgS.evaluate("[...document.querySelectorAll('.sgPages button')].map((b) => [b.dataset.sp, b.textContent])")
shown = lambda: pgS.evaluate("[...document.querySelectorAll('details[data-group=tabs] .sgPage')].filter((p) => p.offsetParent).map((p) => p.dataset.sp)")
check("② „Reiter unten“ has a button per page (☀ Heute … 🌱 Garten), only one page shows", len(pages) == 9 and pages[0][0] == "today" and "Heute" in pages[0][1]
      and shown() == ["today"], (pages, shown()))
pgS.click(".sgPages button[data-sp=car]"); pgS.wait_for_timeout(300)
check("② a tap on „Auto“ shows the car's settings, not the others", shown() == ["car"] and pgS.is_visible("#addCar") and not pgS.is_visible("#addStation"), shown())
pgS.fill("#setSearch", "Radiosender"); pgS.wait_for_timeout(400)
check("② a search shows every page (here the one with the radio stations) and no page buttons", pgS.is_visible("#addStation") and len(shown()) == 9
      and not pgS.is_visible(".sgPages"), shown())
pgS.fill("#setSearch", ""); pgS.wait_for_timeout(300)
pgS.keyboard.press("Escape"); pgS.wait_for_timeout(300)
pgS.click("#settingsBtn"); pgS.wait_for_timeout(500)
check("② the page chosen stays the next time", shown() == ["car"], shown())

# ③ "Warnungen & Alarm": three cards with their state
pgS.click("#sgNav [data-group=alarm]"); pgS.wait_for_timeout(800)
heads = pgS.evaluate("[...document.querySelectorAll('details.sgCard')].map((c) => [c.dataset.card, c.open, c.querySelector('.sgBadge').textContent, c.querySelector('.sgCardSub').textContent])")
check("③ three cards, shut, each with its state: warnings on, the holiday alarm not ready (no sensor), the message off", [h[0] for h in heads] == ["warn", "guard", "notify"]
      and not any(h[1] for h in heads) and heads[0][2] == "An" and heads[1][2] == "Nicht bereit" and "noch kein Code" in heads[1][3] and heads[2][2] == "Aus", heads)
pgS.click("details.sgCard[data-card=warn] > summary"); pgS.wait_for_timeout(300)
pgS.click("#setAlerts"); pgS.wait_for_timeout(900)
check("③ a card opens with a tap; switching the warnings off says „Aus“ in its head", pgS.is_visible("#setAlertJump") and pgS.inner_text("details.sgCard[data-card=warn] .sgBadge") == "Aus"
      and api("api/settings")["alerts"] is False)
pgS.click("#setAlerts"); pgS.wait_for_timeout(800)

# ④ instructions needed once fold
pgS.click("#sgNav [data-group=tablet]"); pgS.wait_for_timeout(300)
check("④ „Tablet einrichten“ is one line that folds open", pgS.is_visible("details.tabletGuide > summary") and not pgS.is_visible("#tgCopy"))
pgS.click("details.tabletGuide > summary"); pgS.wait_for_timeout(300)
check("④ a tap opens the steps and the text to copy", pgS.is_visible("#tgCopy"))
pgS.click("#sgNav [data-group=voice]"); pgS.wait_for_timeout(1200)
check("④ the check of the 🎤 is folded, its line says what it uses here", pgS.is_visible("#vcCheck > summary") and not pgS.is_visible("#vkMic")
      and len(pgS.inner_text("#vcNow")) > 5, pgS.inner_text("#vcNow"))

# ⑤ the rooms of a light group are buttons
pgS.click("#sgNav [data-group=quick]"); pgS.wait_for_timeout(300)
pgS.click("#lgAdd"); pgS.wait_for_timeout(900)
room = pgS.locator("#lgGroups .lgEdit").last.locator(".lgRoom").first
room.click(); pgS.wait_for_timeout(900)
lg = pgS.evaluate("(() => { const w = [...document.querySelectorAll('#lgGroups .lgEdit')].pop(), r = w.querySelector('.lgRoom'); return [w.querySelector('.lgCount')?.textContent, r.querySelector('input').checked, getComputedStyle(r).backgroundColor]; })()")
check("⑤ a tap on a room button chooses it: it glows yellow, the head counts it", lg[1] and lg[0] == "💡 Räume: 1" and lg[2] == "rgb(255, 207, 112)", lg)
pgS.locator("#lgGroups .lgEdit").last.locator(".lgDel").click(); pgS.wait_for_timeout(800)
pgS.keyboard.press("Escape"); pgS.wait_for_timeout(300)
check("no errors on the page", not own_look, own_look)
pgS.close()

# ⑥ editing on a tablet: the floor rail ends above the compass
pgC = b.new_page(viewport={"width": 1180, "height": 820}, has_touch=True, extra_http_headers={"X-Remote-User-Name": "admin"})
pgC.goto(BASE + "?debug=1&mode=edit"); pgC.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgC.wait_for_timeout(1200)
geo = pgC.evaluate("""(() => { const c = document.getElementById('compass').getBoundingClientRect(), btns = [...document.querySelectorAll('#floorRail > button')];
  const last = btns[btns.length - 1]?.getBoundingClientRect(); return [last ? Math.round(last.bottom) : null, Math.round(c.top), btns.length]; })()""")
check("⑥ editing on a tablet: the last floor picture ends above the compass", geo[0] is not None and geo[0] <= geo[1], geo)
pgC.close()

for k in ("theme", "units", "language", "wallOpacity", "shadows", "alerts"):
    if k in st_look: set_setting(k, st_look[k])
