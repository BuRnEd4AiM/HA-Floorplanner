"""Stairs and import: the stair coming up, floor openings, wall stair (#188), spiral, the house import.
"""
# --- stairs: the stair coming up is seen solid through its opening; a focused stairwell keeps its stair
pg18 = b.new_page(viewport={"width": 1200, "height": 800}, extra_http_headers={"X-Remote-User-Name": "admin"})
pg18.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pg18.goto(BASE + "?debug=1&mode=edit"); pg18.wait_for_timeout(1200)
pg18.evaluate("""(() => { const L = window.__fp.layout;
  const R = (id, n, x0, z0, x1, z1) => ({ id, name: n, points: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]] });
  L.floors = [
    { id: 'sf0', name: 'Unten', kind: 'floor', walls: [], rooms: [R('sr0', 'Diele', 0, 0, 6, 4)], devices: [], blocks: [], stairs: [{ id: 'stA', type: 'straight', x: 0.5, z: 2, rot: 0, w: 1, tread: 0.27, turn: 'right', dir: 'up' }] },
    { id: 'sf1', name: 'Oben', kind: 'floor', walls: [], rooms: [R('sr1', 'Galerie', 0, 0, 6, 4)], devices: [], blocks: [], stairs: [] }];
  window.__fp.switchFloor(0); })()""")
pg18.locator("#floorRail button", has_text="Oben").click(); pg18.wait_for_timeout(600)
solid = pg18.evaluate("window.__fp.solidShape('stA')")
check("stairs: the stair coming up into the floor shown is drawn solid", solid)
pg18.locator("#floorRail button", has_text="Unten").click(); pg18.wait_for_timeout(600)
pg18.click("#roomMenuBtn"); pg18.locator("#roomMenu .pill", has_text="Diele").click(); pg18.wait_for_timeout(600)
check("stairs: a focused room keeps the stair standing in it", pg18.evaluate("window.__fp.isShown('stA')"))
pg18.evaluate("""(() => { const L = window.__fp.layout;
  L.floors[0].rooms = []; L.floors[0].stairs = []; L.floors[0].blocks = [{ id: 'blk0', points: [[0, 0], [6, 0], [6, 4], [0, 4]] }];
  L.floors[1].stairs = [{ id: 'stB', type: 'straight', x: 0.5, z: 2, rot: 0, w: 1, tread: 0.27, turn: 'right', dir: 'down' }];
  window.__fp.switchFloor(1); })()""")
pg18.wait_for_timeout(500)
check("stairs: a placeholder block below is opened where the stair runs through it", pg18.evaluate("window.__fp.blockOpen('blk0')"))
# floor opening (Bodenöffnung) drawn by hand on the upper floor: its floor and the block below are cut
pg18.evaluate("""(() => { const L = window.__fp.layout; L.floors[1].stairs = []; L.floors[1].holes = []; window.__fp.switchFloor(1); })()""")
pg18.wait_for_timeout(300)
check("hole: without opening the block is closed", not pg18.evaluate("window.__fp.blockOpen('blk0')"))
pg18.click("#view2d"); pg18.wait_for_timeout(800); pg18.click("button[data-tool=hole]"); pg18.wait_for_timeout(300)
pg18.evaluate("window.__fp.plan().fit()"); pg18.wait_for_timeout(300)
for x, z in ((2, 1), (4, 1), (4, 3), (2, 3), (2, 1)):
    c = pg18.evaluate(f"window.__fp.plan().toClient({x},{z})"); pg18.mouse.click(*c); pg18.wait_for_timeout(250)
hl = pg18.evaluate("window.__fp.layout.floors[1].holes")
check("hole: drawn in the 2D plan", len(hl) == 1 and hl[0]["points"] == [[2, 1], [4, 1], [4, 3], [2, 3]], hl)
check("hole: cuts the floor above and the block below", pg18.evaluate("window.__fp.holeCount(1)") == 1 and pg18.evaluate("window.__fp.blockOpen('blk0')"))
pg18.keyboard.press("Delete"); pg18.wait_for_timeout(300)
check("hole: selected after drawing and can be deleted", pg18.evaluate("window.__fp.layout.floors[1].holes.length") == 0)
pg18.close()
# --- wall stair (#188): drawn along a wall, landings at the bends, steps hang on the wall, over several floors
pgWS = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgWS.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgWS.goto(BASE + "?debug=1&mode=edit"); pgWS.wait_for_timeout(1200)
pgWS.evaluate("""() => { const L = window.__fp.layout;
  const wl = (id, a, b) => ({ id, a, b, thickness: 0.2, height: 2.6, openings: [] });
  const box = (p) => [wl(p+'1',[0,0],[4,0]), wl(p+'2',[4,0],[4,6]), wl(p+'3',[4,6],[0,6]), wl(p+'4',[0,6],[0,0])];
  const fl = (id, n, p, r) => ({ id, name: n, kind: 'floor', walls: box(p), rooms: [{id: r, name: n, points: [[0,0],[4,0],[4,6],[0,6]]}], devices: [], blocks: [], stairs: [] });
  L.floors = [fl('w0', 'EG', 'a', 'wr0'), fl('w1', 'OG', 'b', 'wr1'), fl('w2', 'DG', 'c', 'wr2'), fl('w3', 'SG', 'd', 'wr3')];
  window.__fp.rebuild(); window.__fp.switchFloor(0); }""")
pgWS.click("#viewSplit"); pgWS.wait_for_timeout(600)
pgWS.click("button[data-tool=stairs]"); pgWS.click("#stairTypes button[data-stair=wall]")
pgWS.fill("#stairFloors", "2"); pgWS.dispatch_event("#stairFloors", "change")
pgWS.evaluate("window.__fp.switchFloor(0)"); pgWS.wait_for_timeout(400)
for (x, z) in [(1.6, 0.3), (3.7, 0.3), (3.7, 5.0)]:                      # along the top wall, then down the right wall (the left part is under the floor rail)
    c = pgWS.evaluate(f"window.__fp.plan().toClient({x},{z})"); pgWS.mouse.click(*c); pgWS.wait_for_timeout(180)
check("wall stair: nothing is placed while the path is drawn", len(pgWS.evaluate("window.__fp.layout.floors[0].stairs")) == 0 and pgWS.locator("#plan2d polygon").count() > 5)
pgWS.keyboard.press("Escape"); pgWS.wait_for_timeout(200)
check("wall stair: Esc drops the path", len(pgWS.evaluate("window.__fp.layout.floors[0].stairs")) == 0)
for (x, z) in [(1.6, 0.3), (3.7, 0.3), (3.7, 5.0)]:
    c = pgWS.evaluate(f"window.__fp.plan().toClient({x},{z})"); pgWS.mouse.click(*c); pgWS.wait_for_timeout(180)
pgWS.keyboard.press("Enter"); pgWS.wait_for_timeout(500)
sts = pgWS.evaluate("window.__fp.layout.floors[0].stairs")
check("wall stair: Enter places one wall stair over 2 floors", len(sts) == 1 and sts[0]["type"] == "wall" and sts[0]["floors"] == 2, sts)
st = sts[0] if sts else {"path": [[0, 0]], "x": 0, "z": 0}
wp = [[round(st["x"] + p[0], 2), round(st["z"] + p[1], 2)] for p in st["path"]]
check("wall stair: the path hangs on the wall faces and turns exactly in the corner", wp == [[1.6, 0.1], [3.9, 0.1], [3.9, 5.0]], wp)
check("wall stair: it is selected and the panel shows Floors and Steps to the", pgWS.locator("#propsBody").inner_text().count("Floors") + pgWS.locator("#propsBody").inner_text().count("Etagen") >= 1)
holes = [pgWS.evaluate(f"window.__fp.holeCount({i})") for i in range(4)]
check("wall stair: the stairwell is cut into both floors it climbs through, not into the others", holes == [0, 1, 1, 0], holes)
pgWS.fill("#propsBody input[type=number] >> nth=0", "1"); pgWS.dispatch_event("#propsBody input[type=number] >> nth=0", "change"); pgWS.wait_for_timeout(500)
check("wall stair: Floors = 1 in the panel cuts only the floor above", pgWS.evaluate("window.__fp.layout.floors[0].stairs[0].floors") == 1 and [pgWS.evaluate(f"window.__fp.holeCount({i})") for i in range(4)] == [0, 1, 0, 0])
lf = pgWS.locator('#propsBody .prop:has(label:text-is("Landing after a bend")) input, #propsBody .prop:has(label:text-is("Podest nach dem Knick")) input')
check("wall stair (#210): the panel has the field for the flat stretch after a bend", lf.count() == 1)
if lf.count():
    lf.fill("1"); lf.dispatch_event("change"); pgWS.wait_for_timeout(400)
    ld = pgWS.evaluate("window.__fp.layout.floors[0].stairs[0].landing")
    check("wall stair (#210): the landing length is stored (in metres)", ld is not None and (abs(ld - 1) < 0.01 or abs(ld - 0.3048) < 0.01), ld)
stid = st.get("id", "")
hw = pgWS.evaluate(f"window.__fp.stairHandle('{stid}','wid')")
w0 = pgWS.evaluate("window.__fp.layout.floors[0].stairs[0].w")
if hw:
    c0 = pgWS.evaluate(f"window.__fp.plan().toClient({hw[0]},{hw[1]})"); c1 = pgWS.evaluate(f"window.__fp.plan().toClient({hw[0]},{hw[1] + 0.5})")
    pgWS.mouse.move(*c0); pgWS.mouse.down(); pgWS.mouse.move(c0[0], (c0[1] + c1[1]) / 2, steps=3); pgWS.mouse.move(*c1, steps=3); pgWS.mouse.up(); pgWS.wait_for_timeout(400)
w1 = pgWS.evaluate("window.__fp.layout.floors[0].stairs[0].w")
check("wall stair: the width can be dragged at its handle", w1 > w0 + 0.2, (w0, w1))
pgWS.click("#view3d"); pgWS.wait_for_timeout(900)
check("wall stair: built in 3D", pgWS.evaluate(f"window.__fp.has('{stid}')"))
# a spiral from the garden up to a roof terrace: over 2 floors, no walls of its own
pgWS.click("#view2d"); pgWS.wait_for_timeout(500)
pgWS.click("button[data-tool=stairs]"); pgWS.click("#stairTypes button[data-stair=spiral]")
pgWS.fill("#stairFloors", "2"); pgWS.dispatch_event("#stairFloors", "change")
c = pgWS.evaluate("window.__fp.plan().toClient(2,3)"); pgWS.mouse.click(*c); pgWS.wait_for_timeout(400)
sp = pgWS.evaluate("window.__fp.layout.floors[0].stairs")
check("spiral: the stair tool's Floors field makes a spiral over 2 floors", len(sp) == 2 and sp[1]["type"] == "spiral" and sp[1]["floors"] == 2, [(q["type"], q.get("floors")) for q in sp])
pgWS.screenshot(path=f"{S}/wallstair.png")
pgWS.close()
pg11 = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pg11.goto(BASE + "?debug=1&mode=edit"); pg11.wait_for_timeout(1500)
nh = pg11.evaluate("fetch('api/houses').then(r => r.json()).then(h => h.length)")
pg11.evaluate("document.querySelector('#housePanel').open = true")
pg11.click("#importOpen"); pg11.wait_for_selector("#importDialog[open]", timeout=5000)
check("import: run is disabled before a check", pg11.locator("#importRun").is_disabled())
pg11.click("#importExHouse"); pg11.wait_for_timeout(500)
pg11.click("#importCheck"); pg11.wait_for_selector("#importResult .imp-ok", timeout=5000)
pg11.screenshot(path=os.path.join(S, "import.png"))
check("import: check succeeds and enables the import", pg11.locator("#importRun").is_enabled())
pg11.fill("#importText", "{kaputt"); pg11.click("#importCheck"); pg11.wait_for_selector("#importResult .imp-errors", timeout=5000)
check("import: broken JSON shows an error and keeps run disabled", pg11.locator("#importRun").is_disabled())
pg11.click("#importExFlat"); pg11.wait_for_timeout(300); pg11.click("#importCheck"); pg11.wait_for_selector("#importResult .imp-ok", timeout=5000)
pg11.click("#importRun"); pg11.wait_for_timeout(2000)
nh2 = pg11.evaluate("fetch('api/houses').then(r => r.json()).then(h => h.length)")
fl = pg11.evaluate("window.__fp.layout.floors.length")
check("import: creates a new house and switches to it", nh2 == nh + 1 and fl == 1 and pg11.locator("#importDialog[open]").count() == 0, (nh, nh2, fl))
pg11.close()
