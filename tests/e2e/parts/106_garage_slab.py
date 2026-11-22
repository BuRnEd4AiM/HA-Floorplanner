"""5.28.5, the owner's photo (2026-11-22, #789): a garage with „🚗 Steht unten auf dem Rasen“ next to a house on a plateau over a basement „ist noch
immer irgendwie angehoben, obwohl da kein Plateau drunter ist“. The floors stacked like a real house, the ground floor stands on the ceiling
of the basement; that ceiling went up with the plateau in one piece, also under the garage, whose floor lay down below it. Now its piece
stays down (levels.js slabPieces), the rest of the house keeps its ceiling up on the plateau. And the owner's guess („dass die Wand mit einer
Wand Kontakt hat, die auf einem Plateau ist“): one long wall along house and garage went up with the house; the tick splits it at the corner
of the garage, its piece stays down (levels.js splitAtCorners, lifter.wall).
"""
saved_gs = api_admin("api/layout")              # put back at the end
st_gs = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric"); set_setting("houseFloors", "stacked")


def put_layout_gs(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()


def ring_gs(p, x0, z0, x1, z1):
    sides = (([x0, z0], [x1, z0]), ([x1, z0], [x1, z1]), ([x1, z1], [x0, z1]), ([x0, z1], [x0, z0]))
    return [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": []} for i, (a, c) in enumerate(sides)]


g_walls = [{"id": "gsLong", "a": [0, 0], "b": [16, 0], "thickness": 0.3, "height": 2.6, "openings": []},   # one wall along house and garage
           {"id": "gsg1", "a": [16, 0], "b": [16, 5], "thickness": 0.3, "height": 2.6, "openings": []},
           {"id": "gsg2", "a": [16, 5], "b": [10, 5], "thickness": 0.3, "height": 2.6, "openings": []}]
put_layout_gs({"version": 1,
  "plot": {"areas": [{"id": "gsPl", "name": "Plateau", "surface": "slabs", "rise": 0.6, "edge": "wall", "wall": "stone",
                      "points": [[-0.35, -0.35], [16.35, -0.35], [16.35, 7.35], [-0.35, 7.35]]}]},     # a box round house and garage
  "floors": [
    {"id": "gsKG", "name": "Keller", "kind": "basement", "walls": ring_gs("gk", 0, 0, 10, 7),
     "rooms": [{"id": "gsKe", "name": "Keller", "points": [[0, 0], [10, 0], [10, 7], [0, 7]]}], "devices": [], "blocks": [], "stairs": []},
    {"id": "gsEG", "name": "EG", "kind": "floor", "walls": ring_gs("gh", 0, 0, 10, 7)[1:] + g_walls,   # its front: the long wall
     "rooms": [{"id": "gsWo", "name": "Wohnen", "points": [[0, 0], [10, 0], [10, 7], [0, 7]]},
               {"id": "gsGa", "name": "Raum 6", "points": [[10, 0], [16, 0], [16, 5], [10, 5]]}],
     "devices": [], "blocks": [], "stairs": []}]})
own_gs = []
pgG = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgG.on("console", lambda m: own_gs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgG.on("pageerror", lambda e: own_gs.append("PAGEERROR " + str(e)))
pgG.goto(BASE + "?debug=1&mode=edit"); pgG.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgG.wait_for_timeout(800)
pgG.evaluate("() => window.__fp.switchFloor(1)"); pgG.wait_for_timeout(900)
floor_gs = lambda id_: pgG.evaluate(f"""(() => {{ let y = null; window.__fp.scene.traverse((o) => {{ if (y === null && o.userData && o.userData.kind === 'room' && o.userData.id === '{id_}') {{
  const v = o.getWorldPosition(o.position.clone()); y = v.y; }} }}); return y; }})()""")
# the top of the ceiling at (x, z): the highest flat triangle of a slab mesh that holds the point (seen from above)
slab_top = lambda x, z: pgG.evaluate("""([x, z]) => { let top = null; window.__fp.scene.traverse((o) => {
  if (!o.isMesh || !o.userData || !o.userData.slab) return;
  o.updateWorldMatrix(true, false);
  const V = o.position.constructor, pos = o.geometry.attributes.position, idx = o.geometry.index;
  const n = idx ? idx.count : pos.count, at = (k) => new V().fromBufferAttribute(pos, idx ? idx.getX(k) : k).applyMatrix4(o.matrixWorld);
  for (let k = 0; k + 2 < n; k += 3) {
    const a = at(k), b = at(k + 1), c = at(k + 2);
    if (Math.abs(a.y - b.y) > 1e-3 || Math.abs(a.y - c.y) > 1e-3) continue;          // only the flat faces
    const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    if (Math.abs(d) < 1e-9) continue;
    const l1 = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / d, l2 = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / d;
    if (l1 >= -1e-6 && l2 >= -1e-6 && l1 + l2 <= 1 + 1e-6 && (top === null || a.y > top)) top = a.y;
  } }); return top; }""", [x, z])
check("garage slab: stacked, the ground floor over the basement stands on its ceiling, up with the plateau under house and garage",
      slab_top(5, 3) is not None and abs(slab_top(5, 3) - floor_gs("gsWo")) < 0.03 and abs(slab_top(13, 2.5) - floor_gs("gsGa")) < 0.03,
      (slab_top(5, 3), floor_gs("gsWo"), slab_top(13, 2.5), floor_gs("gsGa")))
# the bottom of a wall in 3D: the lowest point of its meshes
wall_bottom = lambda wid: pgG.evaluate("""(wid) => { let lo = null; window.__fp.scene.traverse((o) => {
  if (!o.userData || o.userData.kind !== 'wall' || o.userData.id !== wid) return;
  o.traverse((m) => { if (!m.isMesh || !m.geometry) return; m.updateWorldMatrix(true, false); m.geometry.computeBoundingBox();
    const y = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld).min.y; if (lo === null || y < lo) lo = y; }); }); return lo; }""", wid)
pgG.evaluate("() => window.__fp.select('room', 'gsGa')"); pgG.wait_for_timeout(600)
pgG.check("#roomOnGround"); pgG.wait_for_timeout(1200)
wo, ga = floor_gs("gsWo"), floor_gs("gsGa")
check("garage slab: „🚗 Steht unten auf dem Rasen“: the garage's floor 60 cm lower than the house's", wo is not None and ga is not None and abs(wo - ga - 0.6) < 0.03, (wo, ga))
check("garage slab: the ceiling under the garage stays down with its floor (it was 60 cm up over it), the house's stays up",
      slab_top(13, 2.5) is not None and slab_top(13, 2.5) <= ga + 0.01 and abs(slab_top(5, 3) - wo) < 0.03, (slab_top(13, 2.5), ga, slab_top(5, 3), wo))
walls_gs = pgG.evaluate("window.__fp.layout.floors[1].walls.map((w) => [w.id, w.a, w.b])")
piece = next((w for w in walls_gs if w[1] == [10, 0] and w[2] == [16, 0]), None)
long_ = next((w for w in walls_gs if w[0] == "gsLong"), None)
check("garage walls: the long front wall along house and garage is split at the garage's corner", piece is not None and long_ is not None and long_[2] == [10, 0], walls_gs)
if piece:
    check("garage walls: the garage's piece of it and its own walls stand down on the lawn, the house's piece on the plateau",
          abs(wall_bottom(piece[0]) - wall_bottom("gsg1")) < 0.03 and wall_bottom("gsLong") - wall_bottom(piece[0]) > 0.5 and abs(wall_bottom("gsg1") - ga) < 0.1,
          (wall_bottom(piece[0]), wall_bottom("gsg1"), wall_bottom("gsLong"), ga))
pgG.uncheck("#roomOnGround"); pgG.wait_for_timeout(1200)
check("garage slab: the tick off: the garage's ceiling goes up again", abs(slab_top(13, 2.5) - floor_gs("gsGa")) < 0.03 and abs(floor_gs("gsGa") - floor_gs("gsWo")) < 0.03,
      (slab_top(13, 2.5), floor_gs("gsGa")))
check("garage slab: no errors on the page", not own_gs, own_gs[:5])
pgG.close()
put_layout_gs(saved_gs)
set_setting("language", st_gs.get("language", "de")); set_setting("units", st_gs.get("units", "metric")); set_setting("houseFloors", st_gs.get("houseFloors", "normal"))
