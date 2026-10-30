"""4.48.0: "▦ Frei anordnen" (the owner: "das man die karte platzieren kann wo man will … ein unsichtbares gitter im hintergrund … wenn ich
will das eine karte unten rechts ist"; his choice: per page, width and height, a card dropped on another pushes it down, on a phone one under
the other). An own page with three text cards on a grid of 12 columns: their places with a gap, the faint cells in the edit mode, ⠿ drags a
card onto another (that one moves down), the corner ↘ makes one wider and higher, switched off the cards close up (the places are kept),
on a phone one under the other from top left to bottom right.
"""
st_fg = api("api/settings")
set_setting("language", "de")
text_fg = lambda i, t: {"id": i, "type": "text", "name": t, "text": f"Karte {t}"}
set_setting("customTabs", [{"id": "p_frei", "name": "Frei", "icon": "▦"}])
set_setting("pageLayouts", {"p_frei": {"free": True, "cards": [text_fg("c_fga", "A"), text_fg("c_fgb", "B"), text_fg("c_fgc", "C")],
                                       "places": {"c_fga": [0, 0, 4, 3], "c_fgb": [4, 0, 4, 3], "c_fgc": [8, 8, 4, 2]}}})
own_fg = []
pgF = b.new_page(viewport={"width": 1400, "height": 1000}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgF.on("console", lambda m: own_fg.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgF.on("pageerror", lambda e: own_fg.append("PAGEERROR " + str(e)))
def wait_fg(fn, n=40, ms=250):
    for _ in range(n):
        v = fn()
        if v: return v
        pgF.wait_for_timeout(ms)
    return fn()
places_fg = lambda: api("api/settings")["pageLayouts"]["p_frei"].get("places", {})
P = "[data-page=p_frei] "
box_fg = lambda k: pgF.locator(P + f".bdItem[data-key={k}]").bounding_box()
pgF.goto(BASE + "?debug=1"); pgF.wait_for_timeout(1500)
if pgF.is_visible("#modeSwitch [data-mode=live]"): pgF.click("#modeSwitch [data-mode=live]"); pgF.wait_for_timeout(800)
pgF.click("#tabBar [data-tab=p_frei]")
wait_fg(lambda: pgF.locator(P + ".fgGrid .bdItem").count() == 3)
g_fg, a_fg, b_fg, c_fg = pgF.locator(P + ".fgGrid").bounding_box(), box_fg("c_fga"), box_fg("c_fgb"), box_fg("c_fgc")
check("free grid: the cards on their places, side by side at the top, C alone at the bottom right with a gap above it",
      abs(a_fg["x"] - g_fg["x"]) < 2 and abs(b_fg["y"] - a_fg["y"]) < 2 and b_fg["x"] > a_fg["x"] + a_fg["width"]
      and abs(c_fg["x"] + c_fg["width"] - (g_fg["x"] + g_fg["width"])) < 2 and c_fg["y"] > a_fg["y"] + a_fg["height"] + 200
      and abs(a_fg["width"] - c_fg["width"]) < 2 and abs(a_fg["height"] - (3 * 30 + 2 * 14)) < 2, [g_fg, a_fg, b_fg, c_fg])
check("free grid: outside the edit mode no cells and no tools", pgF.locator(P + ".fgGrid.fgCells").count() == 0 and pgF.locator(P + ".bdGrip").count() == 0)

pgF.click("#tabBar .tbEdit"); pgF.wait_for_timeout(600)
check("free grid: in the edit mode the cells show, '▦ Frei anordnen' is on and '＋ Abschnitt' is gone",
      wait_fg(lambda: pgF.locator(P + ".fgGrid.fgCells").count() == 1) and pgF.get_attribute(P + ".bdStrip [data-act=free]", "aria-pressed") == "true"
      and pgF.locator(P + ".bdStrip [data-act=addSection]").is_hidden())
grip = pgF.locator(P + ".bdItem[data-key=c_fgc] .bdGrip").bounding_box()
a_fg = box_fg("c_fga")
pgF.mouse.move(grip["x"] + 8, grip["y"] + 8); pgF.mouse.down()
dx, dy = a_fg["x"] - box_fg("c_fgc")["x"], a_fg["y"] - box_fg("c_fgc")["y"]
for i in range(1, 13):
    pgF.mouse.move(grip["x"] + 8 + dx * i / 12, grip["y"] + 8 + dy * i / 12)
pgF.wait_for_timeout(150)
target_fg = pgF.evaluate("(() => { const t = document.querySelector('[data-page=p_frei] .fgTarget'); return t && [t.style.gridColumn, t.style.gridRow]; })()")
pgF.mouse.up()
moved_fg = wait_fg(lambda: places_fg().get("c_fgc") == [0, 0, 4, 2] and places_fg())
check("free grid: ⠿ drags C onto A (the blue field shows where it lands), A makes room below it, B stays",
      target_fg == ["1 / span 4", "1 / span 2"] and moved_fg and moved_fg["c_fga"] == [0, 2, 4, 3] and moved_fg["c_fgb"] == [4, 0, 4, 3], [target_fg, moved_fg])
corner = pgF.locator(P + ".bdItem[data-key=c_fgb] .bdResize").bounding_box()
pgF.mouse.move(corner["x"] + 10, corner["y"] + 10); pgF.mouse.down()
col_fg = (g_fg["width"] - 11 * 14) / 12
for i in range(1, 9):
    pgF.mouse.move(corner["x"] + 10 + 2 * (col_fg + 14) * i / 8, corner["y"] + 10 + 2 * 44 * i / 8)
pgF.mouse.up()
check("free grid: the corner ↘ makes B two columns wider and two rows higher", wait_fg(lambda: places_fg().get("c_fgb") == [4, 0, 6, 5]), places_fg())
pgF.click(P + ".bdStrip [data-act=free]")
off_fg = wait_fg(lambda: "free" not in api("api/settings")["pageLayouts"]["p_frei"] and api("api/settings")["pageLayouts"]["p_frei"])
check("free grid: switched off the cards close up again, the places are kept for later",
      off_fg and off_fg.get("places", {}).get("c_fgb") == [4, 0, 6, 5] and wait_fg(lambda: pgF.locator(P + ".bdGrid .bdItem").count() == 3)
      and pgF.locator(P + ".fgGrid").count() == 0, off_fg)
pgF.click(P + ".bdStrip [data-act=free]")
check("free grid: switched on again, the cards are back on their places",
      wait_fg(lambda: api("api/settings")["pageLayouts"]["p_frei"].get("free") is True) and places_fg().get("c_fgc") == [0, 0, 4, 2]
      and wait_fg(lambda: pgF.locator(P + ".fgGrid .bdItem").count() == 3))
pgF.click(P + "[data-act=done]"); pgF.wait_for_timeout(400)
pgF.set_viewport_size({"width": 390, "height": 844}); pgF.wait_for_timeout(800)
order_fg = pgF.evaluate("[...document.querySelectorAll('[data-page=p_frei] .bdItem')].map((e) => [e.dataset.key, e.getBoundingClientRect().y]).sort((a, b) => a[1] - b[1]).map((x) => x[0])")
check("free grid: on a phone the cards one under the other, from top left to bottom right",
      pgF.locator(P + ".fgGrid.fgNarrow").count() == 1 and order_fg == ["c_fgc", "c_fgb", "c_fga"], order_fg)
check("free grid: no errors on the page", not own_fg, own_fg)
pgF.close()
set_setting("pageLayouts", st_fg.get("pageLayouts", {}))
set_setting("customTabs", st_fg.get("customTabs", []))
set_setting("language", st_fg.get("language", "auto"))
