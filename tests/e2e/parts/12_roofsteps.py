"""Roof with steps (#342): a house narrower at the front; steps in the eaves made in the 2D plan (double click, drag, remove) and the roof panel.
"""
# a house of its own: one storey 12 x 9 m whose front part (x 0 .. 6) is 50 cm narrower on the side z = 0, with a gable roof along x.
# The test house of base.py comes back at the end.
steps_saved = api_admin("api/layout")
def put_layout_steps(lay):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay).encode(), method="PUT", headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})).read()
st_pts = [[0, 0.5], [6, 0.5], [6, 0], [12, 0], [12, 9], [0, 9]]
put_layout_steps({"version": 1, "floors": [
    {"id": "sg", "name": "EG", "kind": "floor", "walls": [{"id": f"sw{i}", "a": st_pts[i], "b": st_pts[(i + 1) % 6], "thickness": 0.3, "height": 2.6, "openings": []} for i in range(6)],
     "rooms": [{"id": "sr", "name": "Haus", "points": st_pts}], "devices": [], "blocks": [], "stairs": []},
    {"id": "sd", "name": "Dach", "kind": "roof", "walls": [], "rooms": [], "devices": [], "blocks": [], "stairs": [], "roof": {"type": "gable", "pitch": 40, "overhang": 0.4, "ridge": "x"}}]})
pgSt = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgSt.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
pgSt.goto(BASE + "?debug=1&mode=edit"); pgSt.wait_for_timeout(2500)
pgSt.evaluate("window.__fp.switchFloor(1)"); pgSt.wait_for_timeout(500)
main_tris_st = lambda: [m["tris"] for m in pgSt.evaluate("window.__fp.roofMeshes()") if m["tag"] == "main" and not m["part"]]
t_plain = main_tris_st()
pgSt.click("#view2d"); pgSt.wait_for_timeout(600)
pgSt.evaluate("window.__fp.plan().fit()"); pgSt.wait_for_timeout(400)
at = lambda x, z: pgSt.evaluate(f"window.__fp.plan().toClient({x}, {z})")
steps_now = lambda: pgSt.evaluate("window.__fp.layout.floors[1].roof.steps || []")
pgSt.mouse.click(*at(9, 4)); pgSt.wait_for_timeout(300)
check("roof steps (#342): the roof is selected in the 2D plan, no diamonds yet", (pgSt.evaluate("window.__fp.selection()") or {}).get("kind") == "roof" and pgSt.locator("[data-roofstep]").count() == 0)
pgSt.mouse.dblclick(*at(6, 0)); pgSt.wait_for_timeout(500)
s1 = steps_now()
check("roof steps (#342): a double click on the eave splits it there: a step, a diamond on each piece", len(s1) == 1 and s1[0]["side"] == 0 and abs(s1[0]["at"] - 6) < 0.1 and s1[0]["out"] == 0
      and pgSt.locator("[data-roofstep]").count() == 2, s1)
h0 = pgSt.evaluate("(() => { const e = document.querySelector('[data-roofstep=\"0-0\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
h1 = at(s1[0]["at"] / 2, 0.5) if s1 else None
if h0 and h1:
    pgSt.mouse.move(*h0); pgSt.mouse.down(); pgSt.mouse.move((h0[0] + h1[0]) / 2, (h0[1] + h1[1]) / 2, steps=4); pgSt.mouse.move(*h1, steps=4); pgSt.mouse.up(); pgSt.wait_for_timeout(700)
sec = pgSt.evaluate("""(async () => { const S = await import('./roofsteps.js'), fp = window.__fp, r = fp.layout.floors[1].roof;
  return S.sectionsOf(fp.roofBox(1), r, 0).map((q) => q.out); })()""")
pgSt.click("#view3d"); pgSt.wait_for_timeout(600)
t_step = main_tris_st()
check("roof steps (#342): dragging the diamond of the front piece moves its eave 50 cm in (5 cm steps); the 3D roof follows",
      sec == [-0.5, 0] and len(t_plain) == 1 and len(t_step) == 1 and t_step[0] > t_plain[0], (sec, t_plain, t_step, steps_now()))
pgSt.keyboard.press("Control+z"); pgSt.wait_for_timeout(500)
check("roof steps (#342): undo takes the drag back", [round(q["out"], 3) for q in steps_now()] == [0], steps_now())
pgSt.keyboard.press("Control+y"); pgSt.wait_for_timeout(300)
if len(steps_now()) < 2:                                            # no redo: drag once more by the data
    pgSt.evaluate("(() => { const r = window.__fp.layout.floors[1].roof; r.steps.push({ side: 0, at: 0, out: -0.5 }); window.__fp.rebuild(); })()")
pgSt.click("#view2d"); pgSt.wait_for_timeout(600)
pgSt.mouse.click(*at(9, 4)); pgSt.wait_for_timeout(300)
d1 = pgSt.evaluate("(() => { const e = document.querySelector('[data-roofstep=\"0-1\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
if d1:
    pgSt.mouse.dblclick(*d1); pgSt.wait_for_timeout(500)
sec2 = pgSt.evaluate("""(async () => { const S = await import('./roofsteps.js'), fp = window.__fp; return S.sectionsOf(fp.roofBox(1), fp.layout.floors[1].roof, 0).map((q) => q.out); })()""")
check("roof steps (#342): a double click on a diamond removes the step that piece starts with", sec2 == [-0.5], (sec2, steps_now()))
# the roof panel: a card per step, "+ Step" adds one
pgSt.evaluate("document.querySelector('#floorPanel').open = true"); pgSt.evaluate("window.__fp.switchFloor(0)"); pgSt.evaluate("window.__fp.switchFloor(1)"); pgSt.wait_for_timeout(500)
n_cards = pgSt.locator(".roofStepCard").count()
pgSt.click("#addRoofStep"); pgSt.wait_for_timeout(400)
check("roof steps (#342): the roof panel shows a card per step; '+ Step' adds one (side A, middle, 50 cm out)",
      n_cards == len(steps_now()) - 1 and pgSt.locator(".roofStepCard").count() == n_cards + 1 and steps_now()[-1] == {"side": 0, "at": 6, "out": 0.5}, (n_cards, steps_now()))
pgSt.select_option("#roofType", "hip"); pgSt.wait_for_timeout(400)
check("roof steps (#342): a hip roof has no steps (hint instead of cards)", pgSt.locator(".roofStepCard").count() == 0 and pgSt.locator("#addRoofStep").count() == 0)
pgSt.wait_for_timeout(2500)                                        # the autosave has run: put the test house back for the next parts
put_layout_steps(steps_saved)
pgSt.close()
