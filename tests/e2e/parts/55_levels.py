"""4.37.0 (#566): a second house in the same plan on a raised plateau, a room whose floor lies higher. The tool "Grundstück": "▲ Plateau
unter [Gebäude]" lays an area round the building's outline, its height, edge (wall or bank) and the wall's look in the side panel; in 3D the
building goes up with it (room floors, walls, devices; a ceiling lamp too), its edge is a wall or a bank, "＋ Außentreppe" puts steps at the
front door; a room with "Boden höher als die Etage": its floor and furniture go up, a ceiling lamp stays, steps at its door on the lower
side ("Stufen an den Türen" off: none); the 2D plan shows "▲ +…" on the rooms and the plateau's height.
"""
st_lv = api("api/settings")
set_setting("language", "de")
set_setting("units", "metric")
own_lv = []
pgL = b.new_page(viewport={"width": 1500, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgL.on("console", lambda m: own_lv.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgL.on("pageerror", lambda e: own_lv.append("PAGEERROR " + str(e)))
pgL.goto(BASE + "?debug=1&mode=edit"); pgL.wait_for_timeout(1800)
# a small second house far from the test house: rooms A (left) and B (right), a door between them, the front door in B towards -z
pgL.evaluate("""(() => { const fp = window.__fp, L = fp.layout, g = Math.max(0, L.floors.findIndex((f) => f.kind !== 'basement')), f = L.floors[g];
  delete L.plot; fp.switchFloor(g);
  const W = (id, a, b, ops = []) => ({ id, a, b, thickness: 0.2, height: 2.6, openings: ops });
  f.walls.push(W('lvW1', [40, 40], [48, 40], [{ id: 'lvFront', type: 'door', name: 'Haustür', pos: 6, width: 0.9, height: 2.05, sill: 0 }]), W('lvW2', [48, 40], [48, 46]),
    W('lvW3', [48, 46], [40, 46]), W('lvW4', [40, 46], [40, 40]), W('lvW5', [44, 40], [44, 46], [{ id: 'lvIn', type: 'door', pos: 3, width: 0.9, height: 2.05, sill: 0 }]));
  f.rooms.push({ id: 'lvA', name: 'Hoch', color: '#b8a58a', points: [[40, 40], [44, 40], [44, 46], [40, 46]], building: 'lvB' },
    { id: 'lvB2', name: 'Diele', color: '#a9a39a', points: [[44, 40], [48, 40], [48, 46], [44, 46]], building: 'lvB' });
  f.devices.push({ id: 'lvSofa', type: 'sofa', x: 42, z: 43, y: 0, rot: 0, scale: 1, name: 'Sofa', entity: '' },
    { id: 'lvLamp', type: 'light', x: 42, z: 44.5, y: 2.5, rot: 0, scale: 1, name: 'Deckenlampe', entity: '' });
  L.buildings = [{ id: 'lvMain', name: 'Haupthaus' }, { id: 'lvB', name: 'Testhaus' }];
  fp.rebuild(); })()""")
pgL.wait_for_timeout(700)
worldY = lambda kind, id_: pgL.evaluate(f"""(() => {{ let y = null; window.__fp.scene.traverse((o) => {{ if (y === null && o.userData && o.userData.kind === '{kind}' && o.userData.id === '{id_}') {{
  const v = o.getWorldPosition(o.position.clone()); y = v.y; }} }}); return y; }})()""")
y0 = {"room": worldY("room", "lvA"), "wall": worldY("wall", "lvW1"), "sofa": worldY("device", "lvSofa"), "lamp": worldY("device", "lvLamp")}
check("levels: the second house stands on the lawn before (room floor, wall, sofa, ceiling lamp)", y0["room"] is not None and abs(y0["room"] - 0.01) < 0.02
      and abs(y0["sofa"]) < 0.02 and abs(y0["lamp"] - 2.5) < 0.02 and (y0["wall"] is None or abs(y0["wall"]) < 0.02), y0)
# --- the tool "Grundstück": a plateau under the building "Testhaus"
pgL.click("button[data-tool=plot]"); pgL.wait_for_timeout(600)
pgL.click("#plotMode [data-v=area]"); pgL.wait_for_timeout(300)
check("levels: the palette offers a plateau under a building", pgL.is_visible("#plateauBuilding") and pgL.is_visible("#plateauMake")
      and "Testhaus" in pgL.inner_text("#plateauBuilding"), pgL.inner_text("#plateauPal") if pgL.locator("#plateauPal").count() else None)
pgL.select_option("#plateauBuilding", "lvB"); pgL.click("#plateauMake"); pgL.wait_for_timeout(800)
areas = lambda: (pgL.evaluate("window.__fp.layout.plot || null") or {}).get("areas") or []
pa = next((a for a in areas() if a.get("rise")), {})
xs, zs = [p[0] for p in pa.get("points", [[0, 0]])], [p[1] for p in pa.get("points", [[0, 0]])]
check("levels: 'Anlegen' lays a plateau round the outline of the building, 20 cm over its walls, 60 cm high, a wall of natural stone, selected",
      pa.get("rise") == 0.6 and pa.get("edge") == "wall" and pa.get("wall") == "stone" and 39.6 < min(xs) < 39.75 and 48.25 < max(xs) < 48.4 and 39.6 < min(zs) < 39.75 and 46.25 < max(zs) < 46.4
      and pgL.evaluate("window.__fp.selection()") == {"kind": "yard", "id": pa.get("id")} and pgL.is_visible("#plateauBox"), pa)
pgL.fill("#plateauRise", "0.9"); pgL.locator("#plateauRise").dispatch_event("change"); pgL.wait_for_timeout(800)
pa = next((a for a in areas() if a.get("rise")), {})
y1 = {"room": worldY("room", "lvA"), "wall": worldY("wall", "lvW1"), "sofa": worldY("device", "lvSofa"), "lamp": worldY("device", "lvLamp")}
check("levels: 90 cm typed in: the room floor, the wall, the sofa and the ceiling lamp of the house on it go up 90 cm", pa.get("rise") == 0.9
      and abs(y1["room"] - 0.91) < 0.02 and abs(y1["sofa"] - 0.9) < 0.02 and abs(y1["lamp"] - 3.4) < 0.02 and (y1["wall"] is None or abs(y1["wall"] - 0.9) < 0.02), (pa, y1))
edges = lambda: pgL.evaluate("(() => { const o = []; window.__fp.scene.traverse((m) => { if (m.isMesh && m.userData && m.userData.plateau) o.push(m.userData.edge); }); return o.sort(); })()")
check("levels: its edge in 3D: a wall with cover stones", edges() == ["cap", "wall"], edges())
pgL.click("#plateauEdge [data-v=slope]"); pgL.wait_for_timeout(700)
check("levels: 'Böschung': a bank of lawn instead of the wall, no choice of the wall", edges() == ["slope"] and next((a for a in areas() if a.get("rise")), {}).get("edge") == "slope"
      and not pgL.locator("#plateauWall").count(), edges())
pgL.click("#plateauEdge [data-v=wall]"); pgL.wait_for_timeout(600)
pgL.select_option("#plateauWall", "gabion"); pgL.wait_for_timeout(500)
check("levels: back to the wall, of gabions", next((a for a in areas() if a.get("rise")), {}).get("wall") == "gabion" and edges() == ["cap", "wall"], edges())
# --- the outdoor steps at the front door
pgL.click("#plateauSteps"); pgL.wait_for_timeout(800)
steps = pgL.evaluate("window.__fp.layout.floors.flatMap((f) => f.devices).filter((d) => d.type === 'steps')")
s0 = steps[0] if steps else {}
check("levels: '＋ Außentreppe' puts steps 90 cm high at the front door, turned outwards, standing on the lawn", len(steps) == 1 and s0.get("h") == 0.9 and abs(s0.get("x", 0) - 46) < 0.01
      and s0.get("z", 0) < 39.7 and s0.get("rot") == 180, s0)
check("levels: the steps are not lifted by the plateau", abs((worldY("device", s0.get("id", "")) or 0)) < 0.02, worldY("device", s0.get("id", "")))
check("levels: the steps' side panel: height, width, landing, rail and how many steps", pgL.is_visible("#stepsH") and pgL.is_visible("#stepsRail")
      and "5 Stufen" in pgL.inner_text("#propsBody"), pgL.inner_text("#propsBody")[:300] if pgL.is_visible("#propsBody") else None)
# --- a room with a higher floor
pgL.click("button[data-tool=select]"); pgL.wait_for_timeout(300)
pgL.evaluate("window.__fp.select('room', 'lvA')"); pgL.wait_for_timeout(500)
pgL.fill("#roomRaise", "0.45"); pgL.locator("#roomRaise").dispatch_event("change"); pgL.wait_for_timeout(800)
rmA = pgL.evaluate("window.__fp.layout.floors.flatMap((f) => f.rooms).find((r) => r.id === 'lvA')")
y2 = {"room": worldY("room", "lvA"), "other": worldY("room", "lvB2"), "sofa": worldY("device", "lvSofa"), "lamp": worldY("device", "lvLamp")}
check("levels: 'Boden höher' 45 cm: its floor and the sofa go up, the ceiling lamp and the room beside it stay", rmA.get("raise") == 0.45
      and abs(y2["room"] - 1.36) < 0.02 and abs(y2["sofa"] - 1.35) < 0.02 and abs(y2["lamp"] - 3.4) < 0.02 and abs(y2["other"] - 0.91) < 0.02, (rmA, y2))
ds = lambda: pgL.evaluate("(() => { const o = []; window.__fp.scene.traverse((m) => { if (m.isMesh && m.userData && m.userData.doorStep) o.push(m.userData.doorStep); }); return o; })()")
pod = lambda: pgL.evaluate("(() => { let n = 0; window.__fp.scene.traverse((m) => { if (m.isMesh && m.userData && m.userData.podium) n++; }); return n; })()")
check("levels: two steps at the door to the lower room (3 x 15 cm), the side of the raised floor is drawn", ds() == ["lvIn", "lvIn"] and pod() == 1, (ds(), pod()))
pgL.uncheck("#roomSteps"); pgL.wait_for_timeout(700)
check("levels: 'Stufen an den Türen' off: no steps", ds() == [] and pgL.evaluate("window.__fp.layout.floors.flatMap((f) => f.rooms).find((r) => r.id === 'lvA').steps") is False, ds())
# --- the 2D plan
pgL.click("#view2d"); pgL.wait_for_timeout(900)
svgText = lambda sel: pgL.evaluate(f"[...document.querySelectorAll('#plan2d {sel}')].map((e) => e.textContent)")   # SVG text has no innerText
lifts = svgText("text.roomLift")
pl = svgText("text.plateauLabel")
check("levels: the 2D plan shows how high the rooms lie and the plateau's name and height at its edge", "▲ +1.35 m" in [x.replace(",", ".") for x in lifts] and "▲ +0.90 m" in [x.replace(",", ".") for x in lifts]
      and len(pl) == 1 and pl[0].replace(",", ".") == "▲ Plateau · 0.90 m", (lifts, pl))
pgL.click("#view3d"); pgL.wait_for_timeout(500)
# --- tidy up
pgL.evaluate("""(() => { const fp = window.__fp, L = fp.layout;
  L.floors.forEach((f) => { f.walls = f.walls.filter((w) => !w.id.startsWith('lvW')); f.rooms = f.rooms.filter((r) => !['lvA', 'lvB2'].includes(r.id));
    f.devices = f.devices.filter((d) => !d.id.startsWith('lv') && d.type !== 'steps'); });
  delete L.plot; delete L.buildings; fp.rebuild(); })()""")
check("levels: no errors on the page", not own_lv, own_lv[:3])
pgL.close()
for k in ("language", "units"):
    set_setting(k, st_lv.get(k))
