"""5.37.1 (#812, the owner on the pictures 19 and 22 of docs/ideen-5.37: „da überlappt ja alles“): on a tablet the row „Normal · Temp. ·
Feuchte … Ansicht“ wrapped into two lines (with left 50 % it could only be half as wide as the picture) and the room tiles, at a fixed
62 px, lay over it. Now the row is as wide as it needs (clear of 🔍 and 🎤), and the room tiles, their arrow and the menu „Ansicht“ stand
above it also when it wraps (modebarfit.js, --mode-h). Checked on a tablet held sideways and upright, and on a PC.
"""
st_mb = api("api/settings")
set_setting("language", "de"); set_setting("roomTiles", True)
saved_mb = api_admin("api/layout")              # put back at the end
lay_mb = json.loads(json.dumps(saved_mb))
lay_mb["floors"][0].setdefault("rooms", []).extend([      # rooms, so there are room tiles
    {"id": f"mb_r{i}", "name": f"Kachel {i}", "color": "#777777", "points": [[80 + 4 * i, 80], [83 + 4 * i, 80], [83 + 4 * i, 83], [80 + 4 * i, 83]]} for i in range(4)])
def put_mb(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
put_mb(lay_mb)
own_mb = []
box_mb = lambda pg_, q: pg_.evaluate("(q) => { const e = document.querySelector(q); if (!e || !e.offsetParent) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }", q)
hit_mb = lambda a, c: bool(a and c and a[0] < c[2] - 1 and c[0] < a[2] - 1 and a[1] < c[3] - 1 and c[1] < a[3] - 1)
for name_mb, w_mb, h_mb in (("tablet sideways", 1080, 810), ("tablet upright", 810, 1080), ("PC", 1400, 900)):
    pgM = b.new_page(viewport={"width": w_mb, "height": h_mb}, has_touch=w_mb < 1200, extra_http_headers={"X-Remote-User-Name": "admin"})
    pgM.on("pageerror", lambda e: own_mb.append("PAGEERROR " + str(e)))
    pgM.goto(BASE + "?debug=1&mode=live"); pgM.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgM.wait_for_timeout(1500)
    pgM.evaluate("window.__fp.switchFloor(0)"); pgM.wait_for_timeout(800)
    bar_mb, tiles_mb = box_mb(pgM, "#modeBar"), box_mb(pgM, "#roomTiles")
    lines_mb = pgM.evaluate("new Set([...document.querySelectorAll('#modeBar > *')].filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().top))).size")
    check(f"#812 {name_mb}: the room tiles stand above the view buttons (not over them)", bar_mb and tiles_mb and tiles_mb[3] <= bar_mb[1] + 1, [bar_mb, tiles_mb, lines_mb])
    check(f"#812 {name_mb}: the view buttons keep clear of 🔍 and 🎤", not hit_mb(bar_mb, box_mb(pgM, "#findBtn")) and not hit_mb(bar_mb, box_mb(pgM, "#voiceBtn")),
          [bar_mb, box_mb(pgM, "#findBtn"), box_mb(pgM, "#voiceBtn")])
    if name_mb == "tablet sideways":
        check("#812 tablet sideways: the view buttons are one row again (were two)", lines_mb == 1, lines_mb)
    if name_mb == "tablet upright":                  # narrower: the row may wrap, the tiles then move up with it
        pgM.evaluate("document.getElementById('modeBar').style.maxWidth = '260px'"); pgM.wait_for_timeout(500)
        bar2_mb, tiles2_mb = box_mb(pgM, "#modeBar"), box_mb(pgM, "#roomTiles")
        check("#812 a row that wraps into several lines: the room tiles move up with it", bar2_mb[3] - bar2_mb[1] > 70 and tiles2_mb[3] <= bar2_mb[1] + 1, [bar2_mb, tiles2_mb])
        pgM.evaluate("document.getElementById('modeBar').style.maxWidth = ''")
    pgM.close()
check("#812 no errors on the page", not own_mb, own_mb[:3])
put_mb(saved_mb)
set_setting("language", st_mb.get("language", "auto")); set_setting("roomTiles", st_mb.get("roomTiles", True))
