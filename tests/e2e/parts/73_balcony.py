"""4.63.0 (#646, christinloehner: „Aber ich finde gar keine Möglichkeit, einen Balkon hinzuzufügen, also mit Geländer, etc....“): balconies.
The tick of a room is now „Balkon / Dachterrasse (offen, mit Geländer)“; set, the room gets „Geländer“ (metal, glass, wood), „Stützen bis zum
Boden“ and a line that says whether it hangs free. On the ground floor of a house on a slope (#629) a balcony in front of the door hangs free:
no plinth under it any more, a plate of its own, the slope goes on under it; its supports reach down to the ground. On level ground it lies
on the ground (no plate). The railing is glass panes or wooden slats when chosen; the tick off takes railing and supports away.
5.3.2 (#703, Miicki): a terrace on the garage that reaches out beyond it hangs free only there (a plate, no plinth in front of the window
below); drawn as two rooms it gets no railing where they meet.
"""
saved_bc = api_admin("api/layout")              # put back at the end
st_bc = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric")
def put_layout_bc(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
def ring_bc(p, x1, z1, ops=None):
    sides = (([0, 0], [x1, 0]), ([x1, 0], [x1, z1]), ([x1, z1], [0, z1]), ([0, z1], [0, 0]))
    return [{"id": f"{p}{i}", "a": a, "b": c, "thickness": 0.3, "height": 2.6, "openings": (ops or {}).get(i, [])} for i, (a, c) in enumerate(sides)]
def layout_bc(slope):
    lay = {"version": 1, "plot": {"boundary": [[-6, -8], [16, -8], [16, 14], [-6, 14]], "areas": []}, "floors": [
        {"id": "bcKG", "name": "Keller", "kind": "basement", "walls": ring_bc("bk", 10, 7), "rooms": [{"id": "bk0", "name": "Garage", "points": [[0, 0], [10, 0], [10, 7], [0, 7]]}],
         "devices": [], "blocks": [], "stairs": []},
        {"id": "bcEG", "name": "EG", "kind": "floor", "walls": ring_bc("be", 10, 7, {0: [{"id": "bcDoor", "type": "window", "style": "double", "pos": 5, "width": 1.8, "height": 2.1, "sill": 0}]}),
         "rooms": [{"id": "be0", "name": "Wohnen", "points": [[0, 0], [10, 0], [10, 7], [0, 7]]},
                   {"id": "bcBal", "name": "Balkon", "points": [[3, -1.8], [7, -1.8], [7, -0.15], [3, -0.15]], "terrace": True, "color": "#a58a63"}],
         "devices": [], "blocks": [], "stairs": []}]}
    if slope:
        lay["plot"]["terrain"] = {"points": [{"id": "bt1", "x": 5, "z": 7.15, "h": 0}, {"id": "bt2", "x": 5, "z": -0.15, "h": -3}]}
    return lay
put_layout_bc(layout_bc(True))
own_bc = []
pgB = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgB.on("console", lambda m: own_bc.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgB.on("pageerror", lambda e: own_bc.append("PAGEERROR " + str(e)))
def open_bc():
    pgB.goto(BASE + "?debug=1&mode=edit"); pgB.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgB.wait_for_timeout(800)
    pgB.evaluate("() => { window.__fp.switchFloor(1); }"); pgB.wait_for_timeout(600)
    pgB.evaluate("() => window.__fp.select('room', 'bcBal')"); pgB.wait_for_selector("#roomTerrace", timeout=10000)
open_bc()
room_bc = lambda: next(r for r in pgB.evaluate("window.__fp.layout.floors[1].rooms") if r["id"] == "bcBal")
parts_bc = lambda: pgB.evaluate("""(() => { const r = { plate: 0, rails: [], postsMin: null };
  window.__fp.scene.traverse((o) => { if (!o.isMesh) return;
    if (o.userData.balconyPlate === 'bcBal') r.plate++;
    if (o.userData.railing) r.rails.push(o.userData.railing);
    if (o.userData.balconyPosts) { o.geometry.computeBoundingBox(); const p = new o.position.constructor(); o.getWorldPosition(p); r.postsMin = +(o.geometry.boundingBox.min.y + p.y).toFixed(2); } });
  r.rails.sort(); return r; })()""")
wait_bc = lambda js: pgB.wait_for_function(js, timeout=15000)

label_bc = pgB.locator("label:has(#roomTerrace)").inner_text()
check("balcony (#646): the tick of a room is called „Balkon / Dachterrasse (offen, mit Geländer)“", "Balkon / Dachterrasse" in label_bc, label_bc)
opts_bc = pgB.evaluate("[...document.querySelectorAll('#roomRail option')].map((o) => o.value + ':' + o.textContent)")
check("balcony: a ticked room has „Geländer“ (metal, glass, wood) and „Stützen bis zum Boden“",
      opts_bc == ["metal:Metall (Stäbe)", "glass:Glas", "wood:Holz (Latten)"] and pgB.locator("#roomRail").input_value() == "metal"
      and "Stützen bis zum Boden" in pgB.locator("label:has(#roomPosts)").inner_text(), opts_bc)
check("balcony: on the slope in front of the door it hangs free and the line says so",
      pgB.get_attribute("#balconyHint", "data-free") == "1" and "Hängt frei" in pgB.inner_text("#balconyHint"), pgB.inner_text("#balconyHint"))
e_bc = pgB.evaluate("window.__fp.earthDbg()")
p_bc = parts_bc()
check("balcony: 3D: no plinth under it any more, a plate of its own, a metal railing",
      e_bc.get("sloped") and e_bc.get("plinths") == 0 and p_bc["plate"] == 1 and p_bc["rails"] == ["metal"] and p_bc["postsMin"] is None, (e_bc, p_bc))
check("balcony: the slope goes on under it (the ground in front of the door 3 m lower)", abs(pgB.evaluate("window.__fp.terrainAt(5, -1)") + 3) < 0.05)

pgB.select_option("#roomRail", "glass")
wait_bc("(() => { let g = false; window.__fp.scene.traverse((o) => { if (o.userData.railing === 'glass') g = true; }); return g; })()")
check("balcony: „Glas“ gives glass panes with a metal hand rail, stored as rail: glass", room_bc().get("rail") == "glass" and parts_bc()["rails"] == ["glass", "metal"], (room_bc(), parts_bc()))
pgB.check("#roomPosts")
wait_bc("(() => { let g = false; window.__fp.scene.traverse((o) => { if (o.userData.balconyPosts) g = true; }); return g; })()")
p_bc = parts_bc()
check("balcony: „Stützen bis zum Boden“ reach from the plate down to the ground 3 m lower", room_bc().get("posts") is True and p_bc["postsMin"] is not None and p_bc["postsMin"] < -2.9, (room_bc(), p_bc))
pgB.select_option("#roomRail", "wood")
wait_bc("(() => { let g = false; window.__fp.scene.traverse((o) => { if (o.userData.railing === 'wood') g = true; }); return g; })()")
check("balcony: „Holz (Latten)“ gives a wooden railing", room_bc().get("rail") == "wood" and parts_bc()["rails"] == ["wood"], parts_bc())
pgB.select_option("#roomRail", "metal"); pgB.wait_for_timeout(500)
check("balcony: back to metal: nothing stored (the default)", "rail" not in room_bc() and parts_bc()["rails"] == ["metal"], room_bc())
pgB.uncheck("#roomTerrace"); pgB.wait_for_timeout(800)
r_bc = room_bc(); p_bc = parts_bc()
check("balcony: the tick off: an ordinary room again, no railing, plate or supports, the fields gone",
      not r_bc.get("terrace") and "posts" not in r_bc and p_bc["plate"] == 0 and not p_bc["rails"] and p_bc["postsMin"] is None
      and pgB.locator("#roomRail").count() == 0, (r_bc, p_bc))

put_layout_bc(layout_bc(False))                 # level ground: a terrace on the ground, not a balcony
open_bc()
check("balcony: on level ground it lies on the ground: the line says so, no plate",
      pgB.get_attribute("#balconyHint", "data-free") == "0" and "Liegt auf" in pgB.inner_text("#balconyHint") and parts_bc()["plate"] == 0, pgB.inner_text("#balconyHint"))

# #703 (Miicki): a terrace on the garage of the basement that reaches out 2 m beyond it, in front of the living room, over the window of the
# hobby room: only the part that reaches out hangs free (a plate), no plinth in front of the window; drawn as two rooms: no railing between
def layout_703(split):
    hobby_win = [{"id": "w703", "type": "window", "pos": 8.5, "width": 1.2, "height": 1.0, "sill": 1.0}]   # in the front wall at x 5.4 … 6.6, under the strip
    ter = [{"id": "ter", "name": "Terrasse", "terrace": True, "color": "#a58a63",
            "points": [[8, 0], [14.5, 0], [14.5, 8.25], [3.75, 8.25], [3.75, 6.25], [8, 6.25]]}]
    if split:
        ter = [{"id": "terA", "name": "Terrasse Garage", "terrace": True, "points": [[8, 0], [14.5, 0], [14.5, 6.25], [8, 6.25]]},
               {"id": "terB", "name": "Terrasse vorn", "terrace": True, "points": [[3.75, 6.25], [14.5, 6.25], [14.5, 8.25], [3.75, 8.25]]}]
    return {"version": 1, "plot": {"boundary": [[-6, -6], [20, -6], [20, 16], [-6, 16]], "areas": [],
                                    "terrain": {"points": [{"id": "t1", "x": 7, "z": 0, "h": 0}, {"id": "t2", "x": 7, "z": 6.6, "h": -3.15}]}},
            "floors": [
        {"id": "kg703", "name": "Keller", "kind": "basement", "walls": ring_bc("k7", 14.5, 6.25, {2: hobby_win}),
         "rooms": [{"id": "hobby", "name": "Hobbyraum", "points": [[0, 0], [8, 0], [8, 6.25], [0, 6.25]]},
                   {"id": "garage", "name": "Garage", "raise": -0.5, "points": [[8, 0], [14.5, 0], [14.5, 6.25], [8, 6.25]]}],
         "devices": [], "blocks": [], "stairs": []},
        {"id": "eg703", "name": "EG", "kind": "floor", "walls": ring_bc("e7", 8, 6.25),
         "rooms": [{"id": "wohnen", "name": "Wohnen", "points": [[0, 0], [8, 0], [8, 6.25], [0, 6.25]]}] + ter,
         "devices": [], "blocks": [], "stairs": []}]}
def open_703(room):
    pgB.goto(BASE + "?debug=1&mode=edit"); pgB.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgB.wait_for_timeout(800)
    pgB.evaluate("() => { window.__fp.switchFloor(1); }"); pgB.wait_for_timeout(600)
    pgB.evaluate(f"() => window.__fp.select('room', '{room}')"); pgB.wait_for_selector("#balconyHint", timeout=10000)
box_703 = lambda tag, val: pgB.evaluate("""([tag, val]) => { let b = null;
  window.__fp.scene.traverse((o) => { if (!o.isMesh || (val ? o.userData[tag] !== val : !o.userData[tag])) return;
    o.updateWorldMatrix(true, false); const g = o.geometry.clone().applyMatrix4(o.matrixWorld); g.computeBoundingBox();
    const bb = g.boundingBox; b = b ? [Math.min(b[0], bb.min.x), Math.max(b[1], bb.max.x), Math.min(b[2], bb.min.z), Math.max(b[3], bb.max.z)] : [bb.min.x, bb.max.x, bb.min.z, bb.max.z]; });
  return b && b.map((v) => +v.toFixed(2)); }""", [tag, val])
seam_703 = lambda: pgB.evaluate("""(() => { let n = 0;                 // railing along the line where the two terraces meet (z = 6.25, x 9 … 13.5)
  window.__fp.scene.traverse((o) => { if (!o.isMesh || !o.userData.railing) return; o.updateWorldMatrix(true, false);
    const p = o.geometry.getAttribute('position'), v = new o.position.constructor();
    for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k).applyMatrix4(o.matrixWorld); if (Math.abs(v.z - 6.25) < 0.1 && v.x > 9 && v.x < 13.5) n++; } });
  return n; })()""")
put_layout_bc(layout_703(False))
open_703("ter")
e_7 = pgB.evaluate("window.__fp.earthDbg()"); plate_7 = box_703("balconyPlate", "ter")
check("#703: a terrace on the garage reaching out 2 m: the line says „Hängt zum Teil frei“",
      pgB.get_attribute("#balconyHint", "data-free") == "part" and "zum Teil frei" in pgB.inner_text("#balconyHint"), pgB.inner_text("#balconyHint"))
check("#703: 3D: no plinth in front of the hobby room's window, a plate only under the part beyond the basement (z 6.4 … 8.25)",
      e_7.get("sloped") and e_7.get("plinths") == 0 and plate_7 is not None and plate_7[2] > 6.35 and plate_7[3] > 8.2 and plate_7[0] < 3.8 and plate_7[1] > 14.4,
      (e_7, plate_7))
pgB.check("#roomPosts")
wait_bc("(() => { let g = false; window.__fp.scene.traverse((o) => { if (o.userData.balconyPosts) g = true; }); return g; })()")
posts_7 = box_703("balconyPosts", None)
check("#703: „Stützen bis zum Boden“ only at the outer corners of the free part, none on the garage", posts_7 is not None and posts_7[2] > 7.8, posts_7)
put_layout_bc(layout_703(True))
open_703("terB")
check("#703: drawn as two rooms: the front part hangs free, no railing across the terrace where the two meet",
      pgB.get_attribute("#balconyHint", "data-free") == "1" and seam_703() == 0 and pgB.evaluate("window.__fp.earthDbg()").get("plinths") == 0,
      (pgB.inner_text("#balconyHint"), seam_703()))
check("balcony: no errors on the page", not own_bc, own_bc[:5])
pgB.close()
put_layout_bc(saved_bc)
set_setting("language", st_bc.get("language", "de")); set_setting("units", st_bc.get("units", "metric"))
