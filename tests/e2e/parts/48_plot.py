"""4.26.0 (#538): 🏡 the plot and the areas on it. The tool "Grundstück": "Rechteck ums Haus" in one tap, its size and width x depth typed in;
an area of a surface drawn as a rectangle of two clicks or corner by corner, lying on the ground in 3D; its name, surface and the length of a
side in the side panel; picked, its corner dragged, a corner added and removed by a double click, moved with the arrow keys, deleted with
Entf and back with Ctrl+Z, wiped with the eraser; the plot picked by its edge with the length of every side; the garden things in the library.
"""
import json
st_pl = api("api/settings")
set_setting("language", "de")
set_setting("units", "metric")                    # base.py leaves feet: the fields below are typed in metres
own_pl = []
pgP = b.new_page(viewport={"width": 1500, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgP.on("console", lambda m: own_pl.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgP.on("pageerror", lambda e: own_pl.append("PAGEERROR " + str(e)))
pgP.goto(BASE + "?debug=1&mode=edit"); pgP.wait_for_timeout(1800)
pgP.evaluate("""(() => { const fp = window.__fp, L = fp.layout; delete L.plot; fp.switchFloor(Math.max(0, L.floors.findIndex((f) => f.kind !== 'basement'))); fp.rebuild(); })()""")
pgP.wait_for_timeout(600)
pgP.click("#view2d"); pgP.wait_for_timeout(900)
pgP.click("button[data-tool=plot]"); pgP.wait_for_timeout(700)
plot = lambda: pgP.evaluate("window.__fp.layout.plot || null")
check("plot: without a plot the palette starts with the plot and says there is none", pgP.get_attribute("#plotMode [data-v=plot]", "aria-pressed") == "true"
      and "Noch kein Grundstück" in pgP.inner_text("#plotInfo"), pgP.inner_text("#plotInfo"))
# --- a rectangle round the house in one tap, then its size typed in
box = pgP.evaluate("""(() => { const p = window.__fp.layout.floors.flatMap((f) => [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...(f.blocks || []).flatMap((r) => r.points)]);
  const xs = p.map((q) => q[0]), zs = p.map((q) => q[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]; })()""")
pgP.fill("#plotMargin", "4"); pgP.click("#plotAround"); pgP.wait_for_timeout(700)
bd = (plot() or {}).get("boundary")
r1 = lambda v: round(v * 10) / 10
want = [[r1(box[0] - 4), r1(box[2] - 4)], [r1(box[1] + 4), r1(box[2] - 4)], [r1(box[1] + 4), r1(box[3] + 4)], [r1(box[0] - 4), r1(box[3] + 4)]]
check("plot: 'Rechteck ums Haus' lays a plot 4 m round the house; its size, width and depth show", bd and all(abs(a - b) < 0.11 for p, q in zip(bd, want) for a, b in zip(p, q))
      and "m²" in pgP.inner_text("#plotInfo") and pgP.is_visible("#plotW") and pgP.is_visible("#plotD"), (bd, want))
w0 = bd[1][0] - bd[0][0]
pgP.fill("#plotW", str(round(w0 + 2, 2))); pgP.locator("#plotW").dispatch_event("change"); pgP.wait_for_timeout(600)
bd2 = plot()["boundary"]
check("plot: a width typed in moves its right side, it stays a rectangle", abs((bd2[1][0] - bd2[0][0]) - (w0 + 2)) < 0.01 and bd2[0] == bd[0] and abs(bd2[2][0] - bd2[1][0]) < 1e-6, bd2)
check("plot: after the plot the palette goes on with the areas", pgP.get_attribute("#plotMode [data-v=area]", "aria-pressed") == "true")
pgP.evaluate("window.__fp.plan().fit()"); pgP.wait_for_timeout(300)
click = lambda x, z: pgP.mouse.click(*pgP.evaluate(f"window.__fp.plan().toClient({x},{z})"))
# --- an area of wood decking, a rectangle of two clicks, to the right of the house
x0, z0 = box[1] + 1, box[2] + 0.5
pgP.click("#yardSurfaces [data-surface=deck]"); pgP.click("#plotShape [data-v=rect]"); pgP.wait_for_timeout(200)
click(x0, z0); pgP.wait_for_timeout(300); click(x0 + 2, z0 + 3); pgP.wait_for_timeout(700)
areas = lambda: (plot() or {}).get("areas") or []
a = areas()[-1] if areas() else {}
check("plot: two clicks give a rectangle of wood decking, selected, in the list of the palette", len(areas()) == 1 and a.get("surface") == "deck" and len(a.get("points", [])) == 4
      and abs(abs(a["points"][1][0] - a["points"][0][0]) - 2) < 0.01 and abs(abs(a["points"][2][1] - a["points"][1][1]) - 3) < 0.01
      and pgP.evaluate("window.__fp.selection()") == {"kind": "yard", "id": a.get("id")} and pgP.locator(f"#yardList [data-yard='{a.get('id')}']").count() == 1, a)
yid = a.get("id")
meshes = lambda: pgP.evaluate("(() => { let n = 0; window.__fp.scene.traverse((o) => { if (o.isMesh && o.userData.yard) n++; }); return n; })()")
check("plot: the area lies on the ground in 3D", meshes() == 1, meshes())
# --- the side panel: name, surface, a side typed in
pgP.fill("#yardNameIn", "Terrasse"); pgP.locator("#yardNameIn").dispatch_event("change"); pgP.wait_for_timeout(400)
pgP.select_option("#yardSurface", "slabs"); pgP.wait_for_timeout(400)
a = next((q for q in areas() if q["id"] == yid), {})
check("plot: its name and surface from the side panel", a.get("name") == "Terrasse" and a.get("surface") == "slabs", a)
pgP.fill("#plotSide0", "2.5"); pgP.locator("#plotSide0").dispatch_event("change"); pgP.wait_for_timeout(500)
a = next((q for q in areas() if q["id"] == yid), {})
p = a["points"]
check("plot: its first side typed in as 2,5 m, it stays a rectangle", abs(abs(p[1][0] - p[0][0]) - 2.5) < 0.01 and abs(p[2][0] - p[1][0]) < 1e-6 and "Seite 1" in pgP.inner_text("#propsBody"), p)
# --- an area of lawn corner by corner
pgP.click("#yardSurfaces [data-surface=lawn]"); pgP.click("#plotShape [data-v=free]"); pgP.wait_for_timeout(200)
lx, lz = x0, z0 + 4.5                              # below the decking: no garden thing of base.py there
for (x, z) in [(lx, lz), (lx + 2, lz), (lx + 2, lz + 3), (lx, lz)]:
    click(x, z); pgP.wait_for_timeout(350)
pgP.wait_for_timeout(400)
lawn = areas()[-1] if len(areas()) == 2 else {}
check("plot: three corners and a click on the first give a lawn", lawn.get("surface") == "lawn" and len(lawn.get("points", [])) == 3 and meshes() == 2, areas())
# --- picking and editing with the select tool
pgP.click("button[data-tool=select]"); pgP.wait_for_timeout(300)
p = next(q for q in areas() if q["id"] == yid)["points"]
cx_, cz_ = (p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2
click(cx_, cz_); pgP.wait_for_timeout(400)
check("plot: a click into the area selects it, the side panel shows it", pgP.evaluate("window.__fp.selection()") == {"kind": "yard", "id": yid} and "terrasse" in pgP.inner_text("#propsTitle").lower(),
      (pgP.evaluate("window.__fp.selection()"), pgP.inner_text("#propsTitle"), pgP.is_visible("#props")))
corner = p[2]
start = pgP.evaluate(f"window.__fp.plan().toClient({corner[0]},{corner[1]})")
end = pgP.evaluate(f"window.__fp.plan().toClient({corner[0] + 1},{corner[1] + 1})")
pgP.mouse.move(*start); pgP.mouse.down(); pgP.mouse.move(start[0] + 10, start[1] + 10, steps=3); pgP.mouse.move(*end, steps=6); pgP.mouse.up(); pgP.wait_for_timeout(500)
p2 = next(q for q in areas() if q["id"] == yid)["points"]
check("plot: its corner dragged 1 m out", abs(p2[2][0] - (corner[0] + 1)) < 0.06 and abs(p2[2][1] - (corner[1] + 1)) < 0.06 and p2[0] == p[0], (corner, p2[2]))
mid = [(p2[0][0] + p2[1][0]) / 2, p2[0][1]]
pgP.mouse.dblclick(*pgP.evaluate(f"window.__fp.plan().toClient({mid[0]},{mid[1]})")); pgP.wait_for_timeout(500)
p3 = next(q for q in areas() if q["id"] == yid)["points"]
check("plot: a double click on a side adds a corner there", len(p3) == 5 and abs(p3[1][0] - mid[0]) < 0.1, p3)
pgP.mouse.dblclick(*pgP.evaluate(f"window.__fp.plan().toClient({p3[1][0]},{p3[1][1]})")); pgP.wait_for_timeout(500)
check("plot: a double click on that corner takes it away again", len(next(q for q in areas() if q["id"] == yid)["points"]) == 4)
before = next(q for q in areas() if q["id"] == yid)["points"][0]
pgP.evaluate("document.activeElement && document.activeElement.blur()"); pgP.keyboard.press("ArrowRight"); pgP.wait_for_timeout(400)
after = next(q for q in areas() if q["id"] == yid)["points"][0]
check("plot: the arrow key moves the whole area by a grid step", after[0] > before[0] and after[1] == before[1], (before, after))
pgP.keyboard.press("Delete"); pgP.wait_for_timeout(500)
check("plot: Entf deletes the selected area", not any(q["id"] == yid for q in areas()) and meshes() == 1, [q["id"] for q in areas()])
pgP.keyboard.press("Control+z"); pgP.wait_for_timeout(600)
check("plot: Ctrl+Z brings it back", any(q["id"] == yid for q in areas()) and meshes() == 2)
# --- the plot picked by its edge: the length of every side in the plan
bd3 = plot()["boundary"]
spot = pgP.evaluate(f"""(() => {{ const b = {json.dumps(bd3)}, pl = window.__fp.plan();         // a spot of its left, bottom or right side with nothing else on it
  for (let k = 1; k < 10; k++) for (const [a, c] of [[b[3], b[0]], [b[2], b[3]], [b[1], b[2]]]) {{ const x = a[0] + (c[0] - a[0]) * k / 10, z = a[1] + (c[1] - a[1]) * k / 10;
    if (pl.pickAt(x, z)?.kind === 'plot') return [x, z]; }} return null; }})()""")
click(*spot); pgP.wait_for_timeout(500)
sides = pgP.locator("#plan2d text.plotSide").count()
check("plot: a click on its edge selects the plot, the plan shows the length of its 4 sides, the panel its size", pgP.evaluate("window.__fp.selection()") == {"kind": "plot", "id": "plot"}
      and sides == 4 and "Umfang" in pgP.inner_text("#propsBody"), (pgP.evaluate("window.__fp.selection()"), sides,
      pgP.evaluate("[...document.querySelectorAll('#plan2d text')].map((t) => (t.getAttribute('class') || '') + ':' + t.textContent).slice(0, 12)")))
# --- the eraser takes the lawn away
pgP.click("button[data-tool=erase]"); pgP.wait_for_timeout(200)
lp = lawn["points"]
click((lp[0][0] + lp[1][0] + lp[2][0]) / 3, (lp[0][1] + lp[1][1] + lp[2][1]) / 3); pgP.wait_for_timeout(500)
check("plot: the eraser takes an area away", len(areas()) == 1 and areas()[0]["id"] == yid, [q["id"] for q in areas()])
pgP.click("button[data-tool=select]"); pgP.wait_for_timeout(200)
# --- the garden things in the library, a gnome and a lamp that glows with its entity
pgP.click("button[data-tool=device]"); pgP.wait_for_timeout(400)
pgP.evaluate("() => [...document.querySelectorAll('#paletteCats button')].find((b) => b.textContent === 'Außen')?.click()"); pgP.wait_for_timeout(300)
names = pgP.locator("#paletteGrid button.dev").all_inner_texts()
check("plot: the library group 'Außen' has the garden things with previews", all(n in names for n in ("Gartenzwerg", "Trampolin (Ø 3 m)", "Gartenhaus", "Hochbeet", "Sonnenschirm"))
      and pgP.locator("#paletteGrid button.dev img").count() == len(names) and len(names) >= 34, len(names))
pgP.click("button[data-tool=select]"); pgP.wait_for_timeout(200)
pgP.evaluate(f"""() => {{ const f = window.__fp.layout.floors[window.__fp.floorIdx()];
  f.devices.push({{id: 'plLamp', type: 'garden_lamp', x: {x0 + 0.5}, z: {z0 - 0.4}, y: 0, rot: 0, scale: 1, name: 'Weg', entity: 'light.wohnzimmer'}});
  window.__fp.fakeState('light.wohnzimmer', 'off'); window.__fp.rebuild(); }}""")
pgP.wait_for_timeout(400)
off = pgP.evaluate("window.__fp.glowColors('plLamp')")
pgP.evaluate("window.__fp.fakeState('light.wohnzimmer', 'on'); window.__fp.applyStates()"); pgP.wait_for_timeout(300)
on = pgP.evaluate("window.__fp.glowColors('plLamp')")
check("plot: a garden lamp is dark while off and glows while on", off == [None] and len(on) == 1 and on[0] is not None, (off, on))
pgP.evaluate("() => { const f = window.__fp.layout.floors[window.__fp.floorIdx()]; f.devices = f.devices.filter((v) => v.id !== 'plLamp'); delete window.__fp.layout.plot; window.__fp.rebuild(); }")
pgP.wait_for_timeout(300)
check("plot: no errors on the page", not own_pl, own_pl[:3])
pgP.close()
for k in ("language", "units"):
    set_setting(k, st_pl.get(k))
