"""5.7.0 (the owner, 2026-11-11: „setze das mal um … mit den sachen die du mir gesendet hast“, pictures in docs/ideen-5.7/): ✨ Neu for
stairs, floor openings, blocks, the plot, its garden areas and cables: the path, the head (sign, name, a line, chips, delete), the search
and the sections instead of the old panel with the hint, the houses and the object list above them. The house in the tree: a small 🔓
(Grundriss fertig, before a big box) and ⋯ with the buildings, the neighbour house, the background picture, duplicate, rename, JSON.
"""
saved_vo = api_admin("api/layout")              # put back at the end
def put_vo(body):
    r = urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(body).encode(), method="PUT",
                                                      headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"}))
    return json.load(r)
set_setting("language", "de"); set_setting("units", "metric")
lay_vo = json.loads(json.dumps(saved_vo))
f_vo = lay_vo["floors"][0]
f_vo.setdefault("stairs", []).append({"id": "vo_st", "type": "straight", "name": "Probetreppe", "x": 60, "z": 60, "w": 1.1, "rot": 0, "dir": "up", "floors": 1})
f_vo.setdefault("holes", []).append({"id": "vo_h", "points": [[64, 60], [66, 60], [66, 61.5], [64, 61.5]]})
f_vo.setdefault("blocks", []).append({"id": "vo_b", "name": "Probeblock", "points": [[68, 60], [70, 60], [70, 62], [68, 62]], "h": 1.2})
put_vo(lay_vo)
pgO = b.new_page(viewport={"width": 1500, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgO.goto(BASE + "?debug=1&mode=edit&ui=2"); pgO.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgO.wait_for_timeout(800)
pgO.evaluate("window.__fp.switchFloor(0)"); pgO.wait_for_timeout(300)
head_vo = lambda: pgO.inner_text("#v2Head") if pgO.locator("#v2Head").count() else ""
secs_vo = lambda: pgO.evaluate("[...document.querySelectorAll('#propsBody .v2Sec')].map((s) => s.dataset.sec)")

pgO.evaluate("window.__fp.select('stair', 'vo_st')"); pgO.wait_for_timeout(700)
check("✨ Neu / stair: the new panel, not the old one with the hint above it",
      "v2" in (pgO.get_attribute("#props", "class") or "") and not pgO.is_visible("#hint") and not pgO.is_visible("#housePanel"), pgO.get_attribute("#props", "class"))
check("✨ Neu / stair: the head says what it is, where it goes, how wide and how many steps",
      all(x in head_vo() for x in ["Probetreppe", "Gerade", "→", "↔ 1.10 m", "16 Stufen", "17,6 cm"]) and pgO.locator("#v2Delete").count() == 1, head_vo())
check("✨ Neu / stair: sections Form & Maße, Stufen, Aussehen (#753), Lage (a straight stair has no corner)", secs_vo() == ["form", "steps", "look", "place"], secs_vo())
pgO.fill("#v2Search", "Breite"); pgO.wait_for_timeout(300)
check("✨ Neu / stair: „🔍 Einstellung suchen“ finds the width", pgO.locator("#propsBody .v2Sec[data-sec=form] .prop:not(.v2Miss)").count() >= 1
      and "Breite" in pgO.inner_text("#propsBody .v2Sec[data-sec=form]"), pgO.inner_text("#v2SearchRes"))
pgO.fill("#v2Search", ""); pgO.wait_for_timeout(200)
pgO.fill("#propsBody .v2Sec[data-sec=form] .prop:has(label:text-is('Breite')) input", "1.4"); pgO.keyboard.press("Tab"); pgO.wait_for_timeout(600)
check("✨ Neu / stair: a field in a section changes the stair", abs(pgO.evaluate("window.__fp.layout.floors[0].stairs.find((s) => s.id === 'vo_st').w") - 1.4) < 1e-6)

pgO.evaluate("window.__fp.select('hole', 'vo_h')"); pgO.wait_for_timeout(700)
check("✨ Neu / floor opening: head with its area, the section Form, delete on top",
      "Bodenöffnung" in head_vo() and "3,0 m²" in head_vo() and secs_vo() == ["form"] and pgO.locator("#v2Delete").count() == 1, (head_vo(), secs_vo()))
pgO.evaluate("window.__fp.select('block', 'vo_b')"); pgO.wait_for_timeout(700)
check("✨ Neu / block: head with its height, the section Höhe", "Probeblock" in head_vo() and "1.20 m" in head_vo().replace(",", ".") and secs_vo() == ["bsize"], (head_vo(), secs_vo()))
pgO.click("#v2Delete"); pgO.wait_for_timeout(600)
check("✨ Neu / block: 🗑 in the head deletes it", not pgO.evaluate("(window.__fp.layout.floors[0].blocks || []).some((x) => x.id === 'vo_b')"))

if pgO.evaluate("!!window.__fp.layout.plot"):
    pgO.evaluate("window.__fp.select('plot', 'plot')"); pgO.wait_for_timeout(700)
    check("✨ Neu / plot: the head of the new panel (outside, no floor in the path)",
          "v2" in (pgO.get_attribute("#props", "class") or "") and "Erdgeschoss" not in pgO.inner_text("#v2Crumbs"), pgO.inner_text("#v2Crumbs") if pgO.locator("#v2Crumbs").count() else "")

# nothing selected: the tree with 🔓 and ⋯ on the house
pgO.keyboard.press("Escape"); pgO.evaluate("window.__fp.select(null)"); pgO.wait_for_timeout(500)
check("✨ Neu / tree: no big box „Grundriss fertig“ above it, the lock is on the house",
      pgO.locator("#planLockBox").count() == 0 and pgO.locator("#v2Tree .n.h.cur #planLockSwitch").count() == 1)
check("✨ Neu / tree: „Häuser“ and „Gebäude“ are no longer below the tree", not pgO.is_visible("#housePanel") and not pgO.is_visible("#buildingPanel"))
pgO.click("#v2HouseMore"); pgO.wait_for_timeout(300)
items_vo = pgO.evaluate("[...document.querySelectorAll('#v2HouseMenu [data-more]')].map((b) => b.dataset.more)")
check("✨ Neu / tree: ⋯ opens the menu of the house", items_vo == ["building", "neighbor", "bg", "copy", "rename", "import", "export", "delete"]
      and pgO.locator("#v2HouseMenu #planLockAdmin").count() == 1, items_vo)
pgO.click("#v2HouseMenu [data-more=bg]"); pgO.wait_for_timeout(400)
check("✨ Neu / tree: the background picture opens in the menu", pgO.is_visible("#v2HouseMenu #bgFile") or pgO.is_visible("#v2HouseMenu #bgBody"))
pgO.click("#v2HouseMore"); pgO.wait_for_timeout(300)
check("✨ Neu / tree: closing the menu puts the panel back where it was", pgO.evaluate("document.getElementById('bgPanel').parentElement.id") == "panel")
pgO.click("#planLockSwitch"); pgO.wait_for_timeout(500)
check("✨ Neu / tree: 🔓 on the house locks the plan", api_admin("api/layout").get("planLock", {}).get("on") is True or pgO.evaluate("window.__fp.layout.planLock?.on") is True,
      pgO.evaluate("window.__fp.layout.planLock"))
pgO.click("#planLockSwitch"); pgO.wait_for_timeout(500)
check("✨ Neu / tree: … and unlocks it again", not pgO.evaluate("window.__fp.layout.planLock?.on"))
pgO.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
pgO.close()
put_vo(saved_vo)
