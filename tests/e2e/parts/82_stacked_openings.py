"""5.3.0 (#694, ChrisSN86: in a higher part of the house a window sits over each terrace door, "mit Wand dazwischen", each with its own
roller shutter): two doors / windows may share their place on a wall when their heights do not overlap. A door in a 3.80 m wall gets
„＋ Fenster darüber“ (a window of the same width above it, 25 cm of wall between); each has a button to the other one; the height or sill
cannot run into the other one; in 3D the wall stays between them; in the 2D plan the upper one is dashed and a second click picks the other.
"""
saved_st = api_admin("api/layout")              # put back at the end
st_st = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_st(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
lay_st = json.loads(json.dumps(saved_st))
f_st = lay_st["floors"][0]
f_st.setdefault("rooms", []).append({"id": "st_r", "name": "Hoher Raum", "color": "#777777", "points": [[110, 60], [116, 60], [116, 64], [110, 64]]})
wall_st = lambda i, a, b, ops=None: {"id": i, "a": a, "b": b, "thickness": 0.24, "height": 3.8, "openings": ops or []}
f_st.setdefault("walls", []).extend([
    wall_st("st_w", [110, 60], [116, 60], [{"id": "st_d", "type": "door", "style": "glass", "pos": 3, "width": 1.6, "height": 2.2, "sill": 0, "name": "Terrassentür"}]),
    wall_st("st_e", [116, 60], [116, 64]), wall_st("st_s", [116, 64], [110, 64]), wall_st("st_n", [110, 64], [110, 60])])
put_layout_st(lay_st)
own_st = []
pgT = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgT.on("console", lambda m: own_st.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgT.on("pageerror", lambda e: own_st.append("PAGEERROR " + str(e)))
def wait_st(fn, n=40, ms=300):
    for _ in range(n):
        v = fn()
        if v: return v
        pgT.wait_for_timeout(ms)
    return fn()
pgT.goto(BASE + "?debug=1&mode=edit"); pgT.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgT.wait_for_timeout(800)
pgT.evaluate("window.__fp.switchFloor(0)"); pgT.wait_for_timeout(400)
ops_st = lambda: pgT.evaluate("(window.__fp.layout.floors[0].walls.find((w) => w.id === 'st_w').openings || []).map((o) => ({ ...o }))")
sel_st = lambda: pgT.evaluate("(() => { const s = window.__fp.selection?.() ?? null; return s; })()")
solid_st = lambda along, y: pgT.evaluate(f"window.__fp.wallSolidAt('st_w', {along}, {y})")
field_st = lambda label: pgT.locator(f"#props .prop:has(> label:text-is('{label}')) input").first
def set_st(label, v):
    el = field_st(label); el.fill(v); el.press("Enter"); pgT.wait_for_timeout(400)

pgT.evaluate("window.__fp.select('opening', 'st_d')"); pgT.wait_for_timeout(400)
check("stacked (#694): a door in a 3.80 m wall offers „＋ Fenster darüber“, nothing above or below yet",
      pgT.locator("#stackAdd").is_visible() and "Fenster darüber" in pgT.inner_text("#stackAdd")
      and pgT.locator("#stackAbove").count() == 0 and pgT.locator("#stackBelow").count() == 0, pgT.locator("#stackRow").count())
pgT.click("#stackAdd"); pgT.wait_for_timeout(500)
hi_st = next((o for o in ops_st() if o["id"] != "st_d"), None)
check("stacked: a window of the same width at the same place, 25 cm of wall over the door, 80 cm high",
      hi_st and hi_st["type"] == "window" and hi_st["pos"] == 3 and hi_st["width"] == 1.6 and hi_st["sill"] == 2.45 and hi_st["height"] == 0.8, ops_st())
check("stacked: the new window is selected and says what it did", hi_st and wait_st(lambda: (sel_st() or {}).get("id") == hi_st["id"])
      and "Brüstung" in pgT.inner_text("#status"), [sel_st(), pgT.inner_text("#status")])
check("stacked: its panel has „⇅ Darunter: Terrassentür“, no „＋ Fenster darüber“",
      pgT.locator("#stackBelow").is_visible() and "Darunter: Terrassentür" in pgT.inner_text("#stackBelow") and pgT.locator("#stackAdd").count() == 0,
      pgT.inner_text("#stackRow") if pgT.locator("#stackRow").count() else None)
set_st("Brüstung", "2.95"); set_st("Höhe", "0.65")
hi_st = next((o for o in ops_st() if o["id"] != "st_d"), None)
check("stacked: sill 2,95 m and height 0,65 m like ChrisSN86's window", hi_st and hi_st["sill"] == 2.95 and hi_st["height"] == 0.65, hi_st)
set_st("Brüstung", "2")
hi_st = next((o for o in ops_st() if o["id"] != "st_d"), None)
check("stacked: a sill down into the door is refused, the field shows the old value and a line says why",
      hi_st and hi_st["sill"] == 2.95 and field_st("Brüstung").input_value() == "2.95" and pgT.locator("#stackClash").is_visible()
      and "Geht nicht" in pgT.inner_text("#stackClash"), [hi_st, field_st("Brüstung").input_value(), pgT.locator("#stackClash").count()])
check("stacked: in 3D the wall stays between the door and the window and over the window, open where they are",
      wait_st(lambda: solid_st(3, 2.6) is True) and solid_st(3, 3.7) is True and solid_st(3, 1.0) is False and solid_st(3, 3.3) is False
      and solid_st(1, 1.0) is True, [solid_st(3, 2.6), solid_st(3, 3.7), solid_st(3, 1.0), solid_st(3, 3.3), solid_st(1, 1.0)])
pgT.click("#stackBelow"); pgT.wait_for_timeout(400)
check("stacked: „⇅ Darunter“ selects the door, whose panel has „⇅ Darüber“",
      (sel_st() or {}).get("id") == "st_d" and pgT.locator("#stackAbove").is_visible() and pgT.locator("#stackAdd").count() == 0, sel_st())
set_st("Höhe", "3")
check("stacked: the door cannot grow into the window above either", next(o for o in ops_st() if o["id"] == "st_d")["height"] == 2.2
      and pgT.locator("#stackClash").is_visible(), ops_st())
set_st("Höhe", "2.3")
check("stacked: … a little higher is fine, the line is gone", next(o for o in ops_st() if o["id"] == "st_d")["height"] == 2.3
      and pgT.locator("#stackClash").count() == 0, ops_st())
srv_st = wait_st(lambda: next((w for f in api_admin("api/layout")["floors"] for w in f["walls"] if w["id"] == "st_w" and len(w.get("openings", [])) == 2), None))
check("stacked: both saved in the add-on", bool(srv_st) and sorted(o["sill"] for o in srv_st["openings"]) == [0, 2.95], srv_st)

# the 2D plan: the upper one dashed, a second click on the selected one picks the other
pgT.click("#view2d"); pgT.wait_for_timeout(600)
check("stacked: in the 2D plan the window above is dashed", pgT.locator(f"#plan2d .opAbove[data-id='{hi_st['id']}']").count() == 1
      and pgT.locator("#plan2d .opAbove[data-id='st_d']").count() == 0, pgT.locator("#plan2d .opAbove").count())
pgT.click("#fitBtn"); pgT.wait_for_timeout(300)
at_st = lambda x, z: pgT.evaluate(f"window.__fp.plan().toClient({x}, {z})")
for _ in range(30):
    if at_st(116, 62)[0] - at_st(110, 62)[0] > 360: break
    pgT.mouse.move(*at_st(113, 62)); pgT.mouse.wheel(0, -200); pgT.wait_for_timeout(40)
pgT.wait_for_timeout(300)
pgT.evaluate("window.__fp.select('opening', 'st_d')"); pgT.wait_for_timeout(300)
pgT.mouse.click(*at_st(113, 60)); pgT.wait_for_timeout(400)
check("stacked: a click on the selected door picks the window above", (sel_st() or {}).get("id") == hi_st["id"], sel_st())
pgT.mouse.click(*at_st(113, 60)); pgT.wait_for_timeout(400)
check("stacked: … and another click the door again", (sel_st() or {}).get("id") == "st_d", sel_st())
pgT.click("#view3d"); pgT.wait_for_timeout(300)
# #697: both with a roller shutter: the label of the door's on the door, the window's over the window; in the live view the door's ball
# stays in the wall between them, the window's is over the window
pgT.evaluate("""(id) => { const fp = window.__fp, w = fp.layout.floors[0].walls.find((v) => v.id === 'st_w');
  Object.assign(w.openings.find((o) => o.id === 'st_d'), { type: 'window', style: 'double' });   // a terrace door with a shutter is a floor-length window
  ['st_d', id].forEach((k) => Object.assign(w.openings.find((o) => o.id === k), { shutter: true, shutterEntity: 'cover.rollo' }));
  fp.settings().labelMode = 'all'; fp.rebuild(); }""", hi_st["id"])
lab_st = wait_st(lambda: (lambda v: v if None not in v else None)([pgT.evaluate(f"window.__fp.labelY('{i}')") for i in ("st_d", hi_st["id"])]))
check("stacked (#697): the label of the door's shutter is on the door, not in front of the window above; the window's over it",
      bool(lab_st) and lab_st[0] < 2.2 and lab_st[1] > 3.6, lab_st)
pgT.click("#modeSwitch button[data-mode=live]"); pgT.wait_for_timeout(1200)
ball_st = wait_st(lambda: (lambda v: v if None not in v and v[0] > 0 else None)([pgT.evaluate(f"window.__fp.ballY('{i}')") for i in ("st_d", hi_st["id"])]))
check("stacked (#697): live, the ball of the door's shutter is in the wall between (under 2.95 m with its 30 cm), the window's over it",
      bool(ball_st) and 2.2 < ball_st[0] and ball_st[0] + 0.3 <= 2.95 + 1e-6 and ball_st[1] > 3.6, ball_st)
pgT.click("#modeSwitch button[data-mode=edit]"); pgT.wait_for_timeout(600)
check("stacked: no errors", not own_st, own_st)

put_layout_st(saved_st)
for k, d in (("language", ""), ("units", "metric")):
    set_setting(k, st_st.get(k, d))
pgT.close()
