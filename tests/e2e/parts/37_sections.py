"""4.11.0 (#495): sections on the pages of the tab bar like the "Sections" of a Home Assistant dashboard: in ✎ "＋ Abschnitt" makes one
(name, symbol, wide), ⠿ drags a card into it (a hidden one keeps its place there, #595), the corner ↘ makes a card wider, ✏️ renames a section, 🗑 takes it away (its cards stand
above again). Saved for everybody in settings.pageLayouts (sections, widths).
"""
st_sc = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric"); set_setting("pageLayouts", {})
own_sc = []
pgS = b.new_page(viewport={"width": 1400, "height": 2000}, extra_http_headers={"X-Remote-User-Name": "admin"})   # tall: the sections below the cards are in sight
pgS.on("console", lambda m: own_sc.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgS.on("pageerror", lambda e: own_sc.append("PAGEERROR " + str(e)))
pgS.on("dialog", lambda d: d.accept())                              # "Abschnitt löschen?": yes
lay_sc = lambda: api("api/settings").get("pageLayouts", {}).get("today", {})
def until_sc(fn, n=20, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgS.wait_for_timeout(ms)
    return fn()
def drag_sc(src, dst, dx=0, dy=0):
    a = pgS.locator(src).bounding_box(); z = pgS.locator(dst).bounding_box()
    pgS.mouse.move(a["x"] + a["width"] / 2, a["y"] + a["height"] / 2); pgS.mouse.down()
    pgS.mouse.move(z["x"] + z["width"] / 2 + dx, z["y"] + z["height"] / 2 + dy, steps=12); pgS.mouse.up(); pgS.wait_for_timeout(800)

pgS.goto(BASE + "?debug=1"); pgS.wait_for_timeout(1500)
if pgS.is_visible("#modeSwitch [data-mode=live]"): pgS.click("#modeSwitch [data-mode=live]"); pgS.wait_for_timeout(1000)
pgS.click("#tabBar [data-tab=today]"); pgS.wait_for_timeout(1200)
pgS.click("#tabBar .tbEdit"); pgS.wait_for_timeout(600)
pgS.click("[data-page=today] .bdStrip [data-act=addSection]"); pgS.wait_for_timeout(500)
pgS.fill(".secDlg [data-act=secTitle]", "Wohnzimmer"); pgS.click(".secDlg [data-icon='🛋']"); pgS.click(".secDlg [data-act=save]"); pgS.wait_for_timeout(800)
secs = until_sc(lambda: lay_sc().get("sections"))
check("sections (#495): '＋ Abschnitt' with name and symbol makes a section under the cards, saved for everybody",
      secs and secs[0]["title"] == "Wohnzimmer" and secs[0]["icon"] == "🛋" and "🛋 Wohnzimmer" in pgS.inner_text("[data-page=today] .bdSection")
      and pgS.locator("[data-page=today] .bdFree [data-key=clock]").count() == 1, secs)
sid = secs[0]["id"] if secs else ""
drag_sc("[data-page=today] [data-key=agenda] .bdGrip", f"[data-page=today] .bdSecGrid[data-section={sid}]")
check("sections: ⠿ drags a card into the section (out of the cards above)",
      until_sc(lambda: (lay_sc().get("sections") or [{}])[0].get("keys") == ["agenda"]) and pgS.locator(f"[data-page=today] .bdSecGrid[data-section={sid}] [data-key=agenda]").count() == 1
      and pgS.locator("[data-page=today] .bdFree [data-key=agenda]").count() == 0, lay_sc().get("sections"))
drag_sc("[data-page=today] [data-key=house] .bdGrip", f"[data-page=today] .bdSecGrid[data-section={sid}] [data-key=agenda]", dx=40)
check("sections: a second card dropped after the first one", until_sc(lambda: (lay_sc().get("sections") or [{}])[0].get("keys") == ["agenda", "house"]), lay_sc().get("sections"))
c = pgS.locator("[data-page=today] .bdFree [data-key=clock] .bdResize").bounding_box()
pgS.mouse.move(c["x"] + 10, c["y"] + 10); pgS.mouse.down(); pgS.mouse.move(c["x"] + 520, c["y"] + 10, steps=8); pgS.mouse.up(); pgS.wait_for_timeout(800)
check("sections: the corner ↘ makes a card wider, saved as its width", until_sc(lambda: (lay_sc().get("widths") or {}).get("clock", 1) >= 2)
      and int(pgS.get_attribute("[data-page=today] [data-key=clock]", "data-w")) >= 2, lay_sc().get("widths"))
pgS.click(f"[data-page=today] .bdSecGrid[data-section={sid}] [data-key=agenda] .bdTool[data-act=hide]"); pgS.wait_for_timeout(800)
drag_sc("[data-page=today] .bdFree [data-key=clock] .bdGrip", f"[data-page=today] .bdSecGrid[data-section={sid}] [data-key=house]", dx=40)
check("sections (#595): a hidden card is gone from its section while editing; a card dropped there keeps it in the section at its place",
      until_sc(lambda: (lay_sc().get("sections") or [{}])[0].get("keys") == ["agenda", "house", "clock"]) and lay_sc().get("hidden") == ["agenda"]
      and pgS.locator(f"[data-page=today] .bdSecGrid[data-section={sid}] [data-key=agenda]").count() == 0, lay_sc())
pgS.click("[data-page=today] .bdHidden .bdHidChip[data-key=agenda]"); pgS.wait_for_timeout(800)
check("sections (#595): a tap in the row 'Ausgeblendet' shows it again, first in its section",
      until_sc(lambda: not lay_sc().get("hidden")) and pgS.evaluate(f"[...document.querySelectorAll('[data-page=today] .bdSecGrid[data-section={sid}] .bdItem')].map((x) => x.dataset.key)") == ["agenda", "house", "clock"], lay_sc())
pgS.click(f"[data-page=today] .bdSection[data-section={sid}] [data-act=secEdit]"); pgS.wait_for_timeout(400)
pgS.fill(".secDlg [data-act=secTitle]", "Draußen"); pgS.click(".secDlg .ceSeg [data-v=true]"); pgS.click(".secDlg [data-act=save]"); pgS.wait_for_timeout(800)
check("sections: ✏️ renames it and makes it wide", until_sc(lambda: (lay_sc().get("sections") or [{}])[0].get("title") == "Draußen")
      and lay_sc()["sections"][0]["wide"] is True and pgS.locator(f"[data-page=today] .bdSection.wide[data-section={sid}]").count() == 1, lay_sc().get("sections"))
pgS.click("[data-page=today] [data-act=done]"); pgS.wait_for_timeout(800)
check("sections: after 'Fertig' the heading stays, the tools are gone", "Draußen" in pgS.inner_text("[data-page=today]")
      and pgS.locator("[data-page=today] .bdSecTools").count() == 0 and pgS.locator("[data-page=today] .bdResize").count() == 0)
pgS.click("#tabBar .tbEdit"); pgS.wait_for_timeout(600)
pgS.click(f"[data-page=today] .bdSection[data-section={sid}] [data-act=secDel]"); pgS.wait_for_timeout(800)
check("sections: 🗑 takes the section away, its cards stand above again", until_sc(lambda: not lay_sc().get("sections"))
      and pgS.locator("[data-page=today] .bdSection").count() == 0 and pgS.locator("[data-page=today] .bdItem[data-key=agenda]").count() == 1
      and pgS.locator("[data-page=today] .bdGrid > [data-key=agenda]").count() == 1, lay_sc())   # no section left: one grid again
pgS.click("[data-page=today] [data-act=done]"); pgS.wait_for_timeout(400)
check("sections: no errors on the page", not own_sc, own_sc[:3])
pgS.close()
set_setting("pageLayouts", st_sc.get("pageLayouts", {})); set_setting("language", st_sc.get("language", "")); set_setting("units", st_sc.get("units", "metric"))
