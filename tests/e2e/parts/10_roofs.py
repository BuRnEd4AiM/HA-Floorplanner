"""Roofs and selecting: solar panels on the roof (#176), moving and sizing roofs (#255, #259), lived-in attic (#260), several things at once (#211, #247), the turning 2D plan (#212).
"""
# a house of its own: four storeys with walls and no roof yet (the checks below add the roof). The test house of base.py has a roof already,
# so the roof would come on top of it and the attic checks would find no walls below. The test house comes back at the end.
roofs_saved = api_admin("api/layout")
def put_layout(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT", headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})).read()
box = lambda p: [{"id": f"{p}{i}", "a": a, "b": b, "thickness": 0.2, "height": 2.6, "openings": []} for i, (a, b) in enumerate((([0, 0], [4, 0]), ([4, 0], [4, 6]), ([4, 6], [0, 6]), ([0, 6], [0, 0])))]
put_layout({"version": 1, "floors": [{"id": f"rf{i}", "name": n, "kind": "floor", "walls": box(f"r{i}w"), "rooms": [{"id": f"rr{i}", "name": n, "points": [[0, 0], [4, 0], [4, 6], [0, 6]]}],
                                      "devices": [], "blocks": [], "stairs": []} for i, n in enumerate(("EG", "OG", "DG", "SG"))]})
# --- solar panels on the roof (#176): on the roof floor a panel lies on the roof surface, follows its slope, a field of rows x columns
pgSol = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgSol.goto(BASE + "?debug=1&mode=edit"); pgSol.wait_for_timeout(2500)
sol_saved = api_admin("api/layout")
sol = pgSol.evaluate("""() => { const fp = window.__fp; fp.addRoofForTest(); const ri = fp.layout.floors.length - 1, f = fp.layout.floors[ri], rb = fp.roofBox(ri);
  f.roof = { type: 'gable', pitch: 35, overhang: 0.4 }; const alongX = rb.x1 - rb.x0 >= rb.z1 - rb.z0;
  const x = alongX ? (rb.x0 + rb.x1) / 2 : rb.x0 + (rb.x1 - rb.x0) * 0.25, z = alongX ? rb.z0 + (rb.z1 - rb.z0) * 0.25 : (rb.z0 + rb.z1) / 2;
  f.devices.push({ id: 'solTest', type: 'solarpanel', x, z, y: 0, rot: 0, scale: 1, name: '', entity: '' }); fp.switchFloor(ri); return { ri, x, z, alongX, rb }; }""")
pgSol.wait_for_timeout(800)
base = pgSol.evaluate(f"window.__fp.elev({sol['ri']})")
p1 = pgSol.evaluate("window.__fp.devPose('solTest')")
check("solar on roof: the panel lies on the sloped roof (lifted onto it, tilted with the slope, no stand)", p1 and p1["mount"] == "flat" and p1["y"] - base > 0.3 and p1["n"][1] < 0.9 and abs(p1["n"][1] - 0.819) < 0.02, (p1, base))
pgSol.evaluate("window.__fp.moveDevice('solTest', %s, %s)" % ((sol["x"], sol["rb"]["z0"] + 0.1) if sol["alongX"] else (sol["rb"]["x0"] + 0.1, sol["z"])))
pgSol.wait_for_timeout(300)
p2 = pgSol.evaluate("window.__fp.devPose('solTest')")
check("solar on roof: moved towards the eaves it follows the roof down", p2 and p2["y"] < p1["y"] - 0.3, (p1, p2))
pgSol.evaluate("() => { const f = window.__fp.layout.floors.at(-1); const d = f.devices.find(v => v.id === 'solTest'); d.cols = 3; d.rows = 2; window.__fp.rebuild(); }"); pgSol.wait_for_timeout(500)
p3 = pgSol.evaluate("window.__fp.devPose('solTest')")
check("solar on roof: a field of 3 x 2 panels is about 3 m wide", p3 and max(p3["size"]) > 2.9, p3)
pgSol.evaluate("() => { window.__fp.layout.floors.at(-1).roof.type = 'flat'; window.__fp.rebuild(); }"); pgSol.wait_for_timeout(500)
p4 = pgSol.evaluate("window.__fp.devPose('solTest')")
check("solar on roof: on a flat roof the panels stand on racks on top of it", p4 and p4["mount"] == "stand" and abs(p4["y"] - base - 0.1) < 0.02 and p4["n"][1] > 0.99, (p4, base))
pgSol.evaluate("() => { const f = window.__fp.layout.floors.at(-1); f.roof.type = 'gable'; const d = f.devices.find(v => v.id === 'solTest'); d.mount = 'stand'; d.cols = 1; d.rows = 1; window.__fp.rebuild(); }"); pgSol.wait_for_timeout(500)
p5 = pgSol.evaluate("window.__fp.devPose('solTest')")
check("solar on roof (#208): on a rack on the sloped roof the posts reach down to the roof (below the spot), the panel is lifted", p5 and p5["mount"] == "stand" and p5["minY"] < p5["y"] - 0.05, p5)
pgSol.evaluate("() => { const f = window.__fp.layout.floors.at(-1); f.roof.type = 'flat'; const d = f.devices.find(v => v.id === 'solTest'); delete d.mount; d.cols = 3; d.rows = 2; window.__fp.rebuild(); }"); pgSol.wait_for_timeout(500)
pgSol.click("#view2d"); pgSol.wait_for_timeout(600)
d = pgSol.evaluate("(() => { const d = window.__fp.layout.floors.at(-1).devices.find(v => v.id === 'solTest'); return [d.x, d.z]; })()")
c = pgSol.evaluate(f"window.__fp.plan().toClient({d[0]},{d[1]})"); pgSol.mouse.click(*c); pgSol.wait_for_timeout(400)
check("solar on roof: the panel shows fields for columns, rows and mounting", pgSol.locator("#solar_cols").count() == 1 and pgSol.locator("#solarMount").count() == 1)
if pgSol.locator("#solarMount").count():
    pgSol.select_option("#solarMount", "flat"); pgSol.wait_for_timeout(500)
    check("solar on roof: choosing 'flat' keeps it flat on the roof", pgSol.evaluate("window.__fp.layout.floors.at(-1).devices.find(v => v.id === 'solTest').mount") == "flat" and pgSol.evaluate("window.__fp.devPose('solTest')")["mount"] == "flat")
# --- moving roofs (#255): on the roof floor a roof is picked and dragged, in the 2D plan and in 3D; the solar panel on it goes along
rb0 = pgSol.evaluate("window.__fp.roofBox(window.__fp.layout.floors.length - 1)")
pgSol.keyboard.press("Escape"); pgSol.evaluate("window.__fp.plan().fit()"); pgSol.wait_for_timeout(400)
rsel = lambda: pgSol.evaluate("(() => { const s = window.__fp.selection(); return s ? s.kind + ':' + s.id : null; })()")
rbox = lambda: pgSol.evaluate("window.__fp.roofBox(window.__fp.layout.floors.length - 1)")
panel = lambda: pgSol.evaluate("(() => { const d = window.__fp.layout.floors.at(-1).devices.find(v => v.id === 'solTest'); return [d.x, d.z]; })()")
p0 = pgSol.evaluate(f"window.__fp.plan().toClient({rb0['x0'] + 0.3}, {rb0['z0'] + 0.3})")
pgSol.mouse.click(*p0); pgSol.wait_for_timeout(300)
check("roofs (#255): a click on the roof in the 2D plan selects it and shows where it is", (rsel() or "").startswith("roof:") and pgSol.locator("#roofWhere").count() == 1, rsel())
pv0 = panel()
p1 = pgSol.evaluate(f"window.__fp.plan().toClient({rb0['x0'] + 1.3}, {rb0['z0'] + 0.8})")
pgSol.mouse.move(*p0); pgSol.mouse.down(); pgSol.mouse.move((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, steps=5); pgSol.mouse.move(*p1, steps=5); pgSol.mouse.up(); pgSol.wait_for_timeout(500)
rb1, pv1 = rbox(), panel()
check("roofs (#255): dragging the selected roof moves it in 5 cm steps, the panel on it goes along",
      abs(rb1["x0"] - rb0["x0"] - 1.0) < 0.06 and abs(rb1["z0"] - rb0["z0"] - 0.5) < 0.06 and abs((pv1[0] - pv0[0]) - (rb1["x0"] - rb0["x0"])) < 1e-6, (rb0, rb1, pv0, pv1))
pgSol.keyboard.press("ArrowLeft"); pgSol.wait_for_timeout(300)
check("roofs (#255): the arrow keys nudge the selected roof", rbox()["x0"] < rb1["x0"] - 0.01, (rb1, rbox()))
pgSol.keyboard.press("Control+z"); pgSol.keyboard.press("Control+z"); pgSol.wait_for_timeout(400)
check("roofs (#255): undo puts the roof back", abs(rbox()["x0"] - rb0["x0"]) < 1e-6, (rb0, rbox()))
# --- the size of a roof (#259): the selected roof has handles at its corners and sides in the 2D plan
for _ in range(4):                                          # undo leaves nothing selected: pick the roof again (the plan may still be redrawing, so try again)
    pgSol.mouse.click(*p0); pgSol.wait_for_timeout(300)
    if (rsel() or "").startswith("roof:"): break
    pgSol.keyboard.press("Escape"); pgSol.wait_for_timeout(300)
try: pgSol.wait_for_selector("[data-roofh]", state="attached", timeout=4000)
except Exception: pass
nh = pgSol.locator("[data-roofh]").count()
hp = pgSol.evaluate("(() => { const e = document.querySelector('[data-roofh=\"se\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
if hp:
    ht = pgSol.evaluate(f"window.__fp.plan().toClient({rb0['x1'] + 1}, {rb0['z1'] + 0.5})")
    pgSol.mouse.move(*hp); pgSol.mouse.down(); pgSol.mouse.move((hp[0] + ht[0]) / 2, (hp[1] + ht[1]) / 2, steps=4); pgSol.mouse.move(*ht, steps=4); pgSol.mouse.up(); pgSol.wait_for_timeout(500)
rs = rbox()
check("roofs (#259): the selected roof shows 8 size handles; dragging a corner makes it bigger, the opposite corner stays",
      nh == 8 and abs(rs["x1"] - rb0["x1"] - 1) < 0.06 and abs(rs["z1"] - rb0["z1"] - 0.5) < 0.06 and abs(rs["x0"] - rb0["x0"]) < 1e-6 and abs(rs["z0"] - rb0["z0"]) < 1e-6, (nh, rsel(), rb0, rs))
pgSol.keyboard.press("Control+z"); pgSol.wait_for_timeout(400)
check("roofs (#259): undo gives the roof its size back", abs(rbox()["x1"] - rb0["x1"]) < 1e-6, (rb0, rbox()))
pgSol.evaluate("() => { const f = window.__fp.layout.floors.at(-1); f.devices = f.devices.filter((d) => d.id !== 'solTest'); window.__fp.rebuild(); }")   # nothing else on the roof
pgSol.click("#view3d"); pgSol.wait_for_timeout(600)
cx, cz = (rb0["x0"] + rb0["x1"]) / 2, (rb0["z0"] + rb0["z1"]) / 2
pgSol.evaluate(f"window.__fp.camAt({cx}, window.__fp.elev(window.__fp.layout.floors.length - 1) + 14, {cz + 0.5}, {cx}, {cz})"); pgSol.wait_for_timeout(600)
mid = pgSol.evaluate("(() => { const r = document.querySelector('#view').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
hit = pgSol.evaluate(f"window.__fp.pickAt({mid[0]}, {mid[1]})")
pgSol.keyboard.press("Escape"); pgSol.mouse.click(*mid); pgSol.wait_for_timeout(300)
b3 = rbox()
pgSol.mouse.move(*mid); pgSol.mouse.down(); pgSol.mouse.move(mid[0] + 40, mid[1], steps=5); pgSol.mouse.move(mid[0] + 80, mid[1], steps=5); pgSol.mouse.up(); pgSol.wait_for_timeout(600)
check("roofs (#255): in 3D the roof is picked, and pressed again it is dragged", (hit or {}).get("kind") == "roof" and (rsel() or "").startswith("roof:") and abs(rbox()["x0"] - b3["x0"]) > 0.2, (hit, rsel(), b3, rbox()))
# --- a lived-in attic (#260): with a knee wall the roof starts in the storey below, whose walls are cut at the slopes
att = pgSol.evaluate("""() => { const fp = window.__fp, L = fp.layout.floors, ri = L.length - 1, below = L[ri - 1], wid = below.walls[0]?.id;
  const roofY = () => Math.min(...fp.roofMeshes().filter((m) => m.tag === 'main').map((m) => m.y));
  const cutBelow = () => { fp.switchFloor(ri - 1); const n = wid ? fp.roofCut(wid) : -1; fp.switchFloor(ri); return n; };   // walls of the open floor only (the others are faded copies)
  L[ri].roof.type = 'gable'; L[ri].roof.dormers = [{ side: 0, pos: 0.5 }]; fp.rebuild();
  const y0 = roofY(), cut0 = cutBelow();
  L[ri].roof.knee = 1; fp.rebuild();
  const y1 = roofY(), cut1 = cutBelow();
  fp.switchFloor(ri - 1); const keep = wid ? fp.roofKeep(wid) : -1; fp.switchFloor(ri);
  const r = { wid, cut0, cut1, keep, drop: +(y0 - y1).toFixed(3), base: +(y1 - fp.elev(ri - 1)).toFixed(3) };
  const lower = L.findIndex((f, i) => i < ri - 1 && f.kind !== 'roof' && f.walls.length && f.kind !== 'basement');
  if (lower >= 0) { L[ri].roof.base = L[lower].id; fp.rebuild(); const yb = roofY(); fp.switchFloor(lower); r.lowerCut = fp.roofCut(L[lower].walls[0].id); r.lowerBase = +(yb - fp.elev(lower)).toFixed(3); fp.switchFloor(ri); delete L[ri].roof.base; }
  delete L[ri].roof.knee; delete L[ri].roof.dormers; fp.rebuild(); r.cut2 = cutBelow(); return r; }""")
check("attic (#260): with a knee wall of 1 m the roof starts 1 m above the storey below and cuts its walls at both slopes; without, as before",
      att["wid"] and att["cut0"] == 0 and att["cut1"] == 2 and abs(att["base"] - 1) < 0.01 and att["drop"] > 0.5 and att["cut2"] == 0, att)
check("attic (#265): a dormer keeps the wall up under it; the roof can start further down, then that storey is cut too",
      att["keep"] == 1 and att.get("lowerCut", 2) == 2 and abs(att.get("lowerBase", 1) - 1) < 0.01, att)
pgSol.wait_for_timeout(2500)                                  # the autosave has run: put the layout back as it was for the next tests
pgSol.evaluate("(l) => fetch('api/layout', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(l)})", sol_saved); pgSol.wait_for_timeout(400)
pgSol.close()
# --- several things at once: Shift + click, Delete removes them all in one undo step (#211)
pgMS = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgMS.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgMS.goto(BASE + "?debug=1&mode=edit"); pgMS.wait_for_timeout(2000)
ms_saved = api_admin("api/layout")
pgMS.evaluate("""() => { const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()]; const b0 = fp.bounds(), b = { cx: b0.cx + b0.size / 2 + 8, cz: b0.cz };   // next to the house, nothing else there
  const dv = (id, type, dx, dz) => ({ id, type, x: b.cx + dx, z: b.cz + dz, y: 0, rot: 0, scale: 1, name: id, entity: '' });
  f.devices.push(dv('msA', 'sofa', -3, 0), dv('msB', 'armchair', 0, 0), dv('msC', 'plant', 3, 0));
  f.walls.push({ id: 'msW', a: [b.cx - 3, b.cz + 3], b: [b.cx + 3, b.cz + 3], thickness: 0.2, height: 2.6, openings: [] });
  fp.rebuild(); window.__msb = b; }""")
pgMS.click("#view2d"); pgMS.wait_for_timeout(500)
pgMS.evaluate("window.__fp.plan().fit()"); pgMS.wait_for_timeout(300)
pb = pgMS.evaluate("[window.__msb.cx, window.__msb.cz]")
at = lambda dx, dz: pgMS.evaluate(f"window.__fp.plan().toClient({pb[0] + dx}, {pb[1] + dz})")
def shift_click(c):
    pgMS.keyboard.down("Shift"); pgMS.mouse.click(*c); pgMS.keyboard.up("Shift"); pgMS.wait_for_timeout(250)
pgMS.mouse.click(*at(-3, 0)); pgMS.wait_for_timeout(250)
shift_click(at(0, 0)); shift_click(at(0, 3))
ids = lambda: sorted(x["id"] for x in pgMS.evaluate("window.__fp.multi()"))
check("several (#211): Shift + click in the plan adds a device and a wall to the selected sofa", ids() == ["msA", "msB", "msW"] and pgMS.locator("#multiBox").count() == 1, ids())
shift_click(at(0, 0))
check("several (#211): Shift + click on a selected thing takes it out again", ids() == ["msA", "msW"], ids())
pgMS.keyboard.press("Delete"); pgMS.wait_for_timeout(400)
left = lambda: pgMS.evaluate("(() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; return [...f.devices.map(d => d.id), ...f.walls.map(w => w.id)].filter(i => i.startsWith('ms')).sort(); })()")
check("several (#211): Delete removes them all, the rest stays", left() == ["msB", "msC"] and pgMS.evaluate("window.__fp.multi().length") == 0, left())
pgMS.keyboard.press("Control+z"); pgMS.wait_for_timeout(400)
check("several (#211): one undo brings them all back", left() == ["msA", "msB", "msC", "msW"], left())
pgMS.click("#view3d"); pgMS.wait_for_timeout(700)
pgMS.evaluate(f"window.__fp.camAt({pb[0]}, 9, {pb[1] + 9}, {pb[0]}, {pb[1]})"); pgMS.wait_for_timeout(400)
sa, sc = pgMS.evaluate("window.__fp.screenOf('msB')"), pgMS.evaluate("window.__fp.screenOf('msC')")
pgMS.mouse.click(sa["x"], sa["y"]); pgMS.wait_for_timeout(250)
pgMS.keyboard.down("Shift"); pgMS.mouse.click(sc["x"], sc["y"]); pgMS.keyboard.up("Shift"); pgMS.wait_for_timeout(300)
check("several (#211): Shift + click works in 3D too", ids() == ["msB", "msC"], (ids(), sa, sc))
pgMS.keyboard.press("Escape"); pgMS.wait_for_timeout(200)
pgMS.evaluate("() => { const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()], b = window.__msb; f.devices.push({ id: 'msL', type: 'lamp', x: b.cx, z: b.cz + 1.5, y: 0, rot: 0, scale: 1, name: 'L', entity: 'light.ms_dbl' }); fp.rebuild(); }")
pgMS.wait_for_timeout(500)
sl = pgMS.evaluate("window.__fp.screenOf('msL')")
pgMS.mouse.dblclick(sl["x"], sl["y"]); pgMS.wait_for_timeout(700)
check("editor (#251): a double click on a device switches it", ["light", "toggle", "light.ms_dbl"] in ha_calls(), (sl, ha_calls()[-3:]))
pgMS.evaluate("() => { const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()]; f.devices = f.devices.filter((d) => d.id !== 'msL'); fp.rebuild(); }")
pgMS.keyboard.press("Escape"); pgMS.wait_for_timeout(250)
check("several (#211): Esc clears the selection", pgMS.evaluate("window.__fp.multi().length") == 0 and not pgMS.evaluate("window.__fp.selection()"))
pgMS.click("#view2d"); pgMS.wait_for_timeout(500)
pgMS.evaluate("window.__fp.plan().fit()"); pgMS.wait_for_timeout(300)
(x0, y0), (x1, y1) = at(-4, -1), at(1, 1)
pgMS.keyboard.down("Shift"); pgMS.mouse.move(x0, y0); pgMS.mouse.down(); pgMS.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, steps=4); pgMS.mouse.move(x1, y1, steps=4)
framed = pgMS.locator("svg rect[stroke='#7dff9a'][stroke-dasharray='5 3']").count()
pgMS.mouse.up(); pgMS.keyboard.up("Shift"); pgMS.wait_for_timeout(300)
check("several (#247): Shift + drag in the plan draws a frame and selects what lies inside", ids() == ["msA", "msB"] and framed == 1, (ids(), framed))
pgMS.keyboard.down("Control"); pgMS.mouse.click(*at(3, 0)); pgMS.keyboard.up("Control"); pgMS.wait_for_timeout(250)
check("several (#247): Ctrl + click adds like Shift + click", ids() == ["msA", "msB", "msC"], ids())
pos = lambda: pgMS.evaluate("(() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; return ['msA', 'msB', 'msC'].map((i) => { const d = f.devices.find((v) => v.id === i); return [d.x, d.z]; }); })()")
p0 = pos(); (gx0, gy0), (gx1, gy1) = at(0, 0), at(1, -1)
pgMS.mouse.move(gx0, gy0); pgMS.mouse.down(); pgMS.mouse.move((gx0 + gx1) / 2, (gy0 + gy1) / 2, steps=4); pgMS.mouse.move(gx1, gy1, steps=4); pgMS.mouse.up(); pgMS.wait_for_timeout(400)
p1 = pos(); dl = [[round(b[0] - a[0], 3), round(b[1] - a[1], 3)] for a, b in zip(p0, p1)]
check("several: dragging one of the selected things in the plan moves them all by the same amount, they stay selected",
      all(d == dl[0] for d in dl) and abs(dl[0][0] - 1) < 0.3 and abs(dl[0][1] + 1) < 0.3 and ids() == ["msA", "msB", "msC"], (dl, ids()))
pgMS.keyboard.press("Control+z"); pgMS.wait_for_timeout(400)
check("several: one undo puts the whole group back", pos() == p0, (pos(), p0))
pgMS.mouse.click(*at(-3, 0)); pgMS.wait_for_timeout(250)                       # undo clears the selection: select the three again
for c in (at(0, 0), at(3, 0)):
    pgMS.keyboard.down("Control"); pgMS.mouse.click(*c); pgMS.keyboard.up("Control"); pgMS.wait_for_timeout(250)
pgMS.keyboard.press("Delete"); pgMS.wait_for_timeout(400)
check("several (#247): Delete removes the framed and clicked things", left() == ["msW"], left())
pgMS.keyboard.press("Control+z"); pgMS.wait_for_timeout(400)
pgMS.evaluate("() => { const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()], b = window.__msb; (f.stairs ||= []).push({ id: 'msS', name: 'S', type: 'spiral', x: b.cx, z: b.cz - 4, rot: 0, w: 0.9, turn: 'right', dir: 'up', floors: 2 }); fp.rebuild(); }")
pgMS.wait_for_timeout(500)
up_edit = pgMS.evaluate("window.__fp.upper('msS')")
pgMS.click("#modeSwitch button[data-mode=live]"); pgMS.wait_for_timeout(500)
up_live = pgMS.evaluate("window.__fp.upper('msS')")
pgMS.click("#modeSwitch button[data-mode=edit]"); pgMS.wait_for_timeout(500)
check("stairs (#246): the storeys above the open floor show (see-through) in the editor, not in the live mode", up_edit is True and up_live is False and pgMS.evaluate("window.__fp.upper('msS')") is True, (up_edit, up_live))
pgMS.wait_for_timeout(2500)
pgMS.evaluate("(l) => fetch('api/layout', {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(l)})", ms_saved); pgMS.wait_for_timeout(400)
pgMS.close()
# --- the 2D plan turns with the 3D view (#212)
pgPR = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgPR.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgPR.goto(BASE + "?debug=1&mode=edit"); pgPR.wait_for_timeout(2000)
check("plan turning (#212): the switch is only there in 2D + 3D", not pgPR.is_visible("#planRotateBtn"))
pgPR.click("#viewSplit"); pgPR.wait_for_timeout(600)
pc = pgPR.evaluate("(() => { const b = window.__fp.bounds(); const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices.push({id: 'prd', type: 'sofa', x: b.cx, z: b.cz, y: 0, rot: 0, scale: 1, name: 'PR', entity: ''}); window.__fp.rebuild(); return [b.cx, b.cz]; })()")
pgPR.evaluate(f"window.__fp.camAt({pc[0] - 10}, 8, {pc[1]}, {pc[0]}, {pc[1]})"); pgPR.wait_for_timeout(300)             # looking east (+x)
check("plan turning (#212): off, the plan stays as it is", pgPR.is_visible("#planRotateBtn") and pgPR.evaluate("window.__fp.plan().rotation()") == 0)
pgPR.click("#planRotateBtn"); pgPR.wait_for_timeout(400)
r1 = pgPR.evaluate("window.__fp.plan().rotation()")
check("plan turning (#212): on, looking east turns the plan a quarter to the left", abs(r1 + 90) < 1, r1)
pgPR.evaluate(f"window.__fp.camAt({pc[0]}, 8, {pc[1] - 10}, {pc[0]}, {pc[1]})"); pgPR.wait_for_timeout(300)             # looking south (+z)
r2 = pgPR.evaluate("window.__fp.plan().rotation()")
check("plan turning (#212): it follows the camera (looking south: upside down)", abs(abs(r2) - 180) < 1, r2)
pgPR.evaluate("window.__fp.plan().fit()"); pgPR.wait_for_timeout(300)
c = pgPR.evaluate(f"window.__fp.plan().toClient({pc[0]}, {pc[1]})"); pgPR.mouse.click(*c); pgPR.wait_for_timeout(400)
check("plan turning (#212): a click in the turned plan still hits the right thing", pgPR.evaluate("window.__fp.selection()?.id") == "prd", (c, pgPR.evaluate("window.__fp.selection()"), pgPR.evaluate("window.__fp.plan().rotation()")))
pgPR.click("#planRotateBtn"); pgPR.wait_for_timeout(300)
check("plan turning (#212): off again, the plan is straight", pgPR.evaluate("window.__fp.plan().rotation()") == 0)
pgPR.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices.splice(f.devices.findIndex(d => d.id === 'prd'), 1); window.__fp.rebuild(); }")
pgPR.close()
put_layout(roofs_saved)
