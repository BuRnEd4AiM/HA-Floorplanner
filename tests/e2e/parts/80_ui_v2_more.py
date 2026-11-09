"""5.0.0 „Oberfläche 2“, second part (the owner's choice of 2026-11-09: pictures 5, 9, 10, 12, 13 of docs/ideen-5.0/): with the new panel
and nothing selected the house is a tree (🗂 Haus / 🔍 Objekte / ❔ Hilfe; the floors from the top down, a floor dragged elsewhere, the
rooms to tap), a floor tapped opens with its kind as three buttons and the storey height with the house from the side; for a selected
object a search for a setting (also into ⚙), the sections as tabs on the panel that pull one out into a drawer, and „⇉ Übernehmen“ (the
same settings for the other windows in the room / on the floor / in the house, one undo step).
"""
saved_v3 = api_admin("api/layout")              # put back at the end
st_v3 = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_v3(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
lay_v3 = json.loads(json.dumps(saved_v3))
f_v3 = lay_v3["floors"][0]
f_v3.setdefault("rooms", []).append({"id": "v3_r", "name": "Probe", "color": "#777777", "points": [[110, 60], [116, 60], [116, 64], [110, 64]]})
f_v3.setdefault("walls", []).append(
    {"id": "v3_w", "a": [110, 60], "b": [116, 60], "thickness": 0.24, "height": 2.6, "openings": [
        {"id": "v3_a", "type": "window", "style": "single", "hinge": "left", "tiltDeg": 25, "pos": 1.5, "width": 1.0, "height": 1.2, "sill": 0.9, "name": "Quelle"},
        {"id": "v3_b", "type": "window", "style": "single", "pos": 4.5, "width": 1.0, "height": 1.2, "sill": 0.9, "name": "Ziel"}]})
put_layout_v3(lay_v3)
own_v3 = []
pgW = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgW.on("console", lambda m: own_v3.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgW.on("pageerror", lambda e: own_v3.append("PAGEERROR " + str(e)))
def wait_v3(fn, n=40, ms=250):
    for _ in range(n):
        v = fn()
        if v: return v
        pgW.wait_for_timeout(ms)
    return fn()
pgW.goto(BASE + "?debug=1&mode=edit&ui=2"); pgW.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgW.wait_for_timeout(800)
pgW.evaluate("window.__fp.switchFloor(0)"); pgW.wait_for_timeout(400)
op_v3 = lambda oid: pgW.evaluate("(id) => { for (const f of window.__fp.layout.floors) for (const w of f.walls) for (const o of (w.openings || [])) if (o.id === id) return o; return null; }", oid)
floor_ids = lambda: pgW.evaluate("window.__fp.layout.floors.map((f) => f.id)")
n_floors = len(floor_ids())

check("ui v2 tree: nothing selected: 🗂 Haus / 🔍 Objekte / ❔ Hilfe, the tree, no hint and no object list",
      pgW.locator("#v2Home").is_visible() and pgW.locator("#v2HomeSeg [data-seg=house].on").count() == 1
      and not pgW.locator("#hint").is_visible() and not pgW.locator("#objList").is_visible(), pgW.evaluate("document.querySelector('#panel').className"))
rows_v3 = pgW.evaluate("[...document.querySelectorAll('#v2Tree .n.floor')].map((r) => +r.dataset.i)")
check("ui v2 tree: every floor, from the top down; the open floor marked with its rooms (also „Probe“)",
      rows_v3 == list(range(n_floors - 1, -1, -1)) and pgW.get_attribute("#v2Tree .n.floor.on", "data-i") == "0"
      and pgW.locator("#v2Tree .n.room", has_text="Probe").count() == 1, rows_v3)
pgW.click("#v2HomeSeg [data-seg=objects]"); pgW.wait_for_timeout(200)
check("ui v2 tree: 🔍 Objekte shows the object list", pgW.locator("#objList").is_visible() and not pgW.locator("#v2Tree").is_visible(), None)
pgW.click("#v2HomeSeg [data-seg=help]"); pgW.wait_for_timeout(200)
check("ui v2 tree: ❔ Hilfe shows the hint and the keys", pgW.locator("#hint").is_visible() and pgW.locator("#controlsHelp").is_visible(), None)
pgW.click("#v2HomeSeg [data-seg=house]"); pgW.wait_for_timeout(200)

pgW.click("#v2Tree .n.floor.on"); pgW.wait_for_selector("#v2Floor", timeout=5000)
check("ui v2 floor: the open floor: name, kind as three buttons, storey height with the house from the side, „Etage löschen“ folded",
      pgW.locator("#v2Floor #storeyHeight").is_visible() and pgW.locator("#v2Storeys svg").is_visible()
      and pgW.locator("#v2FloorKind button").count() == 3 and pgW.locator(".v2Sec[data-sec=delete] .bd").count() == 1
      and not pgW.locator("#delFloor").is_visible() and pgW.evaluate("document.querySelector('#floorBody').childElementCount") == 0, None)
kind0 = pgW.evaluate("window.__fp.layout.floors[0].kind || 'floor'")
other = "floor" if kind0 == "basement" else "basement"
pgW.click(f"#v2FloorKind [data-kind={other}]"); pgW.wait_for_timeout(500)
check("ui v2 floor: a kind button sets the kind (like „Typ“) and stays marked; the card is drawn again",
      pgW.evaluate("window.__fp.layout.floors[0].kind") == other and pgW.get_attribute("#v2FloorKind button.on", "data-kind") == other
      and pgW.locator("#v2Floor #storeyHeight").count() == 1, pgW.evaluate("window.__fp.layout.floors[0].kind"))
pgW.click(f"#v2FloorKind [data-kind={kind0}]"); pgW.wait_for_timeout(500)

before_v3 = floor_ids()
pgW.locator(f"#v2Tree .n.floor[data-i='0']").drag_to(pgW.locator("#v2Tree .n.floor[data-i='1']")); pgW.wait_for_timeout(600)
after_v3 = floor_ids()
check("ui v2 tree: a floor dragged onto another takes its place", after_v3[:2] == [before_v3[1], before_v3[0]] and after_v3[2:] == before_v3[2:], [before_v3, after_v3])
pgW.keyboard.press("Control+z"); pgW.wait_for_timeout(600)
check("ui v2 tree: … one undo puts it back", wait_v3(lambda: floor_ids() == before_v3), floor_ids())

pgW.evaluate("window.__fp.switchFloor(0)"); pgW.wait_for_timeout(400)
pgW.click("#v2Tree .n.room[data-room=v3_r]"); pgW.wait_for_timeout(500)
check("ui v2 tree: a room tapped is selected", pgW.evaluate("window.__fp.selection()") == {"kind": "room", "id": "v3_r"}
      and not pgW.locator("#v2Home").is_visible(), pgW.evaluate("window.__fp.selection()"))

pgW.evaluate("window.__fp.select('opening', 'v3_a')"); pgW.wait_for_selector("#v2Search", timeout=10000)
pgW.fill("#v2Search", "kipp"); pgW.wait_for_timeout(500)
check("ui v2 search: „kipp“: found, the section „Mehr“ (Kippwinkel) shows, „Größe & Lage“ is out of the way",
      "Treffer" in pgW.inner_text("#v2SearchRes") and pgW.locator(".v2Sec[data-sec=more]").is_visible() and pgW.locator("#tiltDeg").is_visible()
      and not pgW.locator(".v2Sec[data-sec=size]").is_visible(), pgW.inner_text("#v2SearchRes"))
pgW.fill("#v2Search", ""); pgW.wait_for_timeout(500)
check("ui v2 search: empty again: every section is back", pgW.locator(".v2Sec[data-sec=size]").is_visible() and pgW.locator(".v2Miss").count() == 0, None)
pgW.fill("#v2Search", "Sprache"); pgW.wait_for_timeout(500)
check("ui v2 search: a word of ⚙ („Sprache“): nothing here, but the settings have it", pgW.locator("#v2SearchSettings").is_visible(), pgW.inner_text("#v2SearchRes"))
pgW.click("#v2SearchSettings"); pgW.wait_for_timeout(500)
check("ui v2 search: … a tap opens ⚙ with the word in its search", pgW.locator("#settingsDialog").is_visible() and pgW.input_value("#setSearch") == "Sprache", None)
pgW.keyboard.press("Escape"); pgW.wait_for_timeout(300)
pgW.fill("#v2Search", ""); pgW.wait_for_timeout(500)

nops_v3 = pgW.evaluate("[...document.querySelectorAll('#v2Nops .v2Nop')].map((b) => b.dataset.sec)")
secs_v3 = pgW.evaluate("[...document.querySelectorAll('#propsBody .v2Sec')].map((s) => s.dataset.sec)")
check("ui v2 tabs: every section hangs as a tab on the panel", pgW.locator("#v2Nops").is_visible() and nops_v3 == secs_v3, [nops_v3, secs_v3])
pgW.click("#v2Nops [data-sec=shutter]"); pgW.wait_for_timeout(400)
check("ui v2 tabs: „Rollladen“ pulled out into the drawer beside the panel; in the panel it says so",
      pgW.locator("#v2Drawer").is_visible() and pgW.locator("#v2Drawer #openShutter").count() == 1
      and pgW.locator(".v2Sec.out[data-sec=shutter]").count() == 1, None)
pgW.click("#v2Drawer #openShutter"); pgW.wait_for_timeout(400)
check("ui v2 tabs: the field in the drawer works (a roller shutter now) and the drawer stays", op_v3("v3_a").get("shutter") is True
      and pgW.locator("#v2Drawer").is_visible(), op_v3("v3_a"))
pgW.click("#v2Nops [data-sec=shutter]"); pgW.wait_for_timeout(400)
check("ui v2 tabs: a tap again puts it back", not pgW.locator("#v2Drawer").is_visible() and pgW.locator(".v2Sec.out").count() == 0
      and pgW.locator(".v2Sec[data-sec=shutter] #openShutter").count() == 1, None)

pgW.click("#v2CopyBtn"); pgW.wait_for_selector("#v2CopyBox", timeout=5000)
scopes_v3 = pgW.evaluate("[...document.querySelectorAll('#v2CopyBox [data-scope]')].map((b) => [b.dataset.scope, b.querySelector('small').textContent])")
check("ui v2 copy: „⇉ Übernehmen“: in the room (1 other window), on the floor, in the house; panes ticked, size not",
      scopes_v3[0] == ["room", "1"] and [s for s, _ in scopes_v3][1:] == ["floor", "house"]
      and pgW.is_checked("#v2CopyBox [data-group=panes]") and not pgW.is_checked("#v2CopyBox [data-group=size]"), scopes_v3)
pgW.click("#v2CopyBox [data-scope=room]"); pgW.wait_for_timeout(300)
pgW.click("#v2CopyGo"); pgW.wait_for_timeout(500)
tgt_v3 = op_v3("v3_b")
check("ui v2 copy: the other window opens like this one now (hinge left, tilt angle 25°, roller shutter), its size and name stay",
      (tgt_v3.get("hinge"), tgt_v3.get("tiltDeg"), tgt_v3.get("shutter"), tgt_v3["width"], tgt_v3["name"]) == ("left", 25, True, 1.0, "Ziel")
      and "1" in pgW.inner_text("#status") and pgW.locator("#v2CopyBox").count() == 0, [tgt_v3, pgW.inner_text("#status")])
pgW.keyboard.press("Control+z"); pgW.wait_for_timeout(500)
check("ui v2 copy: one undo takes it back", "hinge" not in op_v3("v3_b") and "shutter" not in op_v3("v3_b"), op_v3("v3_b"))
check("ui v2 tree / tools: no errors", not own_v3, own_v3)

pgW.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
put_layout_v3(saved_v3)
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_v3.get(k, d))
pgW.close()
