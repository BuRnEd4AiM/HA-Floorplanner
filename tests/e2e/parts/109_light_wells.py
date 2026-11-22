"""5.31.0, 🔆 light wells (#786; the owner: „baue licht schächte ein für den keller das das auch gut aussieht auch drauf achten das der boden
ausgeschnitten wird wenn da ein licht schacht ist“): a basement window under the ground gets a light well by itself (3D: a box with a
grating; the lawn and a path over it are cut open), drawn in the 2D plan; its fields in the window's panel (on/off, width, depth), the same
in „✨ Neu“ (section „Lichtschacht“, found by „🔍 Einstellung suchen“); a window over the ground (terrain lower) gets none.
"""
saved_lw = api_admin("api/layout")              # put back at the end
st_lw = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_lw(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
def ring_lw(p, ops=None):
    sides = (([0, 0], [6, 0]), ([6, 0], [6, 10]), ([6, 10], [0, 10]), ([0, 10], [0, 0]))
    return [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": (ops or {}).get(i, [])} for i, (a, c) in enumerate(sides)]
kw = lambda id_, pos: {"id": id_, "type": "window", "name": "Kellerfenster", "pos": pos, "width": 1.0, "height": 0.6, "sill": 1.6}
put_layout_lw({"version": 1,
  "plot": {"areas": [{"id": "lwWeg", "name": "Weg", "surface": "paving", "points": [[3, -3], [6, -3], [6, -0.2], [3, -0.2]]}]},   # a path over the front well
  "floors": [
    {"id": "lwKG", "name": "Keller", "kind": "basement", "walls": ring_lw("kw", {0: [kw("lwW1", 4.2)], 2: [kw("lwW2", 3)]}),
     "rooms": [{"id": "lwK1", "name": "Keller", "points": [[0, 0], [6, 0], [6, 10], [0, 10]]}], "devices": [], "blocks": [], "stairs": []},
    {"id": "lwEG", "name": "EG", "kind": "floor", "walls": ring_lw("ew"),
     "rooms": [{"id": "lwE1", "name": "Wohnen", "points": [[0, 0], [6, 0], [6, 10], [0, 10]]}], "devices": [], "blocks": [], "stairs": []}]})
own_lw = []
pgL = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgL.on("console", lambda m: own_lw.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgL.on("pageerror", lambda e: own_lw.append("PAGEERROR " + str(e)))
pgL.on("dialog", lambda d: d.accept())
pgL.goto(BASE + "?debug=1&mode=edit"); pgL.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgL.wait_for_timeout(800)
pgL.evaluate("() => window.__fp.switchFloor(1)"); pgL.wait_for_timeout(900)
wells = lambda: sorted(w["id"] for w in pgL.evaluate("window.__fp.lightWells()"))
check("light wells: both basement windows under the lawn have one in 3D (the ground floor open, the basement under it)", wells() == ["lwW1", "lwW2"], wells())
grates = pgL.evaluate("(() => { let n = 0; window.__fp.scene.traverse((o) => { if (o.userData && o.userData.wellGrate) n++; }); return n; })()")
check("light wells: each has its grating", grates == 2, grates)
rings = pgL.evaluate("window.__fp.wellRings()")
front = next(r for r in rings if min(p[1] for p in r) < 0)
check("light wells: the front one lies outside the wall, 50 cm out, 1.30 m wide",
      abs(min(p[1] for p in front) + 0.65) < 0.01 and abs(max(p[0] for p in front) - min(p[0] for p in front) - 1.3) < 0.01, front)
# the ground is cut open: the lawn and the path have a hole there (nothing of them under the middle of the well)
hole = pgL.evaluate("""(() => { const out = { lawn: null, path: null };
  window.__fp.scene.traverse((o) => { if (!o.isMesh || !o.geometry?.attributes?.position) return;
    const isPath = o.userData && o.userData.yard === 'lwWeg', isLawn = !isPath && o.material && o.material.color && o.renderOrder === -1 && Math.abs(o.position.y + 0.02) < 1e-6;
    if (!isPath && !isLawn) return;
    const p = o.geometry.attributes.position, idx = o.geometry.index, tri = (a, b, c) => { const P = (i) => [p.getX(i), p.getZ(i)];
      const [A, B, C] = [P(a), P(b), P(c)], x = 4.2, z = -0.4, s = (u, v, w) => (u[0] - w[0]) * (v[1] - w[1]) - (v[0] - w[0]) * (u[1] - w[1]);
      const d1 = s([x, z], A, B), d2 = s([x, z], B, C), d3 = s([x, z], C, A); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
    let hit = false; const n = idx ? idx.count : p.count;
    for (let i = 0; i < n && !hit; i += 3) hit = idx ? tri(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)) : tri(i, i + 1, i + 2);
    out[isPath ? 'path' : 'lawn'] = (out[isPath ? 'path' : 'lawn'] || false) || hit; });
  return out; })()""")
check("light wells: the lawn and the path over the front one are cut open", hole.get("lawn") is False and hole.get("path") is False, hole)

# 2D plan of the basement: the wells drawn; the window's panel
pgL.evaluate("() => window.__fp.switchFloor(0)"); pgL.wait_for_timeout(600)
if pgL.is_visible("#view2d"): pgL.click("#view2d"); pgL.wait_for_timeout(900)
check("light wells: the 2D plan of the basement draws both", pgL.locator("#plan2d .well2d").count() == 2)
pgL.evaluate("() => window.__fp.select('opening', 'lwW1')"); pgL.wait_for_timeout(700)
check("light wells: the panel of the window has „Lichtschacht vor dem Fenster“ ticked, width 1.3, depth 0.5 and the line „… 1,40 m unter dem Boden …“",
      pgL.is_checked("#wellOn") and pgL.input_value("#wellW") in ("1.3", "1,3") and pgL.input_value("#wellD") in ("0.5", "0,5") and "unter dem Boden" in pgL.inner_text("#wellHint"),
      pgL.inner_text("#wellHint"))
pgL.fill("#wellD", "0.8"); pgL.dispatch_event("#wellD", "change"); pgL.wait_for_timeout(800)
op = lambda id_: next(o for w in pgL.evaluate("window.__fp.layout.floors[0].walls") for o in w["openings"] if o["id"] == id_)
front = next(r for r in pgL.evaluate("window.__fp.wellRings()") if min(p[1] for p in r) < 0)
check("light wells: depth 0.8 m: stored, the well reaches 80 cm out", op("lwW1").get("wellD") == 0.8 and abs(min(p[1] for p in front) + 0.95) < 0.01, (op("lwW1"), front))
pgL.uncheck("#wellOn"); pgL.wait_for_timeout(800)
check("light wells: switched off: stored as noWell, gone in 3D and 2D, the line says why",
      op("lwW1").get("noWell") is True and wells() == ["lwW2"] and pgL.locator("#plan2d .well2d").count() == 1 and "ausgeschaltet" in pgL.inner_text("#wellHint").lower(),
      (op("lwW1"), wells()))
pgL.check("#wellOn"); pgL.wait_for_timeout(800)
check("light wells: on again", "noWell" not in op("lwW1") and wells() == ["lwW1", "lwW2"])

# a window over the ground: the terrain 2 m lower, no well; the panel says it is not needed
lay = pgL.evaluate("window.__fp.layout")
lay["plot"]["terrain"] = {"points": [{"id": "lwT", "x": 3, "z": -5, "h": -2}], "contours": 0.5}
put_layout_lw(lay)
pgL.goto(BASE + "?debug=1&mode=edit"); pgL.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgL.wait_for_timeout(800)
pgL.evaluate("() => window.__fp.switchFloor(0)"); pgL.wait_for_timeout(600)
if pgL.is_visible("#view2d"): pgL.click("#view2d"); pgL.wait_for_timeout(900)
pgL.evaluate("() => window.__fp.select('opening', 'lwW1')"); pgL.wait_for_timeout(700)
check("light wells: the ground 2 m lower: the window is free, no well, the panel says „kein Lichtschacht nötig“",
      pgL.evaluate("window.__fp.wellRings().length") == 0 and not pgL.is_visible("#wellOn") and "nötig" in pgL.inner_text("#wellHint"), pgL.inner_text("#wellHint"))
lay = pgL.evaluate("window.__fp.layout"); lay["plot"].pop("terrain", None); put_layout_lw(lay)

# ✨ Neu: the section „Lichtschacht“, found by the search
pgL.goto(BASE + "?debug=1&mode=edit&ui=2"); pgL.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgL.wait_for_timeout(1000)
pgL.evaluate("() => window.__fp.switchFloor(0)"); pgL.wait_for_timeout(600)
pgL.evaluate("() => window.__fp.select('opening', 'lwW1')"); pgL.wait_for_timeout(800)
check("light wells / ✨ Neu: the window has the section „Lichtschacht“ with its fields",
      pgL.evaluate("document.body.classList.contains('uiV2')") and pgL.locator("[data-sec=well]").count() > 0 and pgL.locator("#wellOn").count() == 1,
      pgL.evaluate("[...document.querySelectorAll('[data-sec]')].map((s) => s.dataset.sec)"))
pgL.fill("#v2Search", "Lichtschacht"); pgL.wait_for_timeout(600)
check("light wells / ✨ Neu: „🔍 Einstellung suchen“ finds „Lichtschacht“", pgL.is_visible("#wellOn") and "Treffer" in pgL.inner_text("#v2SearchRes"), pgL.inner_text("#v2SearchRes"))
pgL.fill("#v2Search", ""); pgL.wait_for_timeout(300)
pgL.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel

check("light wells: no errors on the page", not own_lw, own_lw[:5])
pgL.close()
put_layout_lw(saved_lw)
set_setting("language", st_lw.get("language", "de")); set_setting("units", st_lw.get("units", "metric"))
