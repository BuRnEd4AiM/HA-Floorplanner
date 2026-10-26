"""Cabinet builder ("Schrank nach Maß"): placed from the library its editor opens; the front has one tap target per column, a column is
set up on the right (inside, drawers), "📐 An die Dachschräge anpassen" fits it under the roof of the roof floor, "Übernehmen" puts it on
the device (one undo step), "Abbrechen" changes nothing, a template, the 3D view in the editor, its picture and size in the panel.
"""
units_cl = api("api/settings")["units"]
set_setting("units", "metric")                    # the sizes below are checked in cm
pgC = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
cl_errs = []
pgC.on("console", lambda m: cl_errs.append(m.text) if m.type == "error" and not m.text.startswith("Failed to load resource") else None)
pgC.on("pageerror", lambda e: cl_errs.append("PAGEERROR " + str(e)))
cl_saved = api_admin("api/layout")
pgC.goto(BASE + "?debug=1&mode=edit"); pgC.wait_for_timeout(2000)
ri = pgC.evaluate("""() => { const fp = window.__fp; let i = fp.layout.floors.findIndex((f) => f.kind === 'roof');
  if (i < 0) { fp.addRoofForTest(); i = fp.layout.floors.length - 1; }
  fp.layout.floors[i].roof = { type: 'gable', pitch: 35, overhang: 0.4 }; fp.switchFloor(i); return i; }""")
pgC.wait_for_timeout(600)
pgC.click("#view2d"); pgC.wait_for_timeout(400)
pgC.click("button[data-tool=device]"); pgC.select_option("#entitySelect", "")
pgC.fill("#paletteSearch", "dachschräge"); pgC.wait_for_timeout(200)
found = pgC.locator("#paletteGrid button.dev").count()
pgC.click("#paletteGrid button.dev >> nth=0")
pgC.evaluate("window.__fp.plan().fit && window.__fp.plan().fit()"); pgC.wait_for_timeout(300)
rb = pgC.evaluate("(i) => window.__fp.roofBox(i)", ri)
cx, cz = (rb["x0"] + rb["x1"]) / 2, (rb["z0"] + rb["z1"]) / 2
c = pgC.evaluate("([x, z]) => window.__fp.plan().toClient(x, z)", [cx, cz]); pgC.mouse.click(*c); pgC.wait_for_timeout(800)
cl = lambda: pgC.evaluate("(i) => window.__fp.layout.floors[i].devices.find((d) => d.type === 'closet')", ri)
d0 = cl()
check("cabinet: found in the library under 'Dachschräge', placed as a three-door wardrobe, its editor opens at once",
      found >= 1 and d0 and len(d0["cab"]["cols"]) == 3 and pgC.is_visible("#closetDialog") and pgC.locator("#closetDraw [data-col]").count() == 3, (found, d0))
pgC.click("#closetDialog .closetFoot button[value=cancel]"); pgC.wait_for_timeout(300)
check("cabinet: 'Abbrechen' closes the editor and changes nothing", not pgC.is_visible("#closetDialog") and cl()["cab"] == d0["cab"])

# near the eave, its back to it: the roof slopes down over its back
along_x = rb["x1"] - rb["x0"] >= rb["z1"] - rb["z0"]
pgC.evaluate("""([i, alongX, rb]) => { const d = window.__fp.layout.floors[i].devices.find((v) => v.type === 'closet');
  if (alongX) { d.x = (rb.x0 + rb.x1) / 2; d.z = rb.z0 + 1.1; d.rot = 0; } else { d.x = rb.x0 + 1.1; d.z = (rb.z0 + rb.z1) / 2; d.rot = 90; }
  window.__fp.rebuild(); window.__fp.select('device', d.id); }""", [ri, along_x, rb])
pgC.wait_for_timeout(600)
check("cabinet: the panel shows its front, its size and the buttons", pgC.is_visible("#closetThumb") and "150" in pgC.inner_text("#closetInfo") and pgC.is_visible("#closetEdit") and pgC.is_visible("#closetFit"),
      pgC.inner_text("#closetInfo") if pgC.locator("#closetInfo").count() else "-")
pgC.click("#closetEdit"); pgC.wait_for_timeout(500)
pgC.click("#closetDraw [data-col='2']"); pgC.wait_for_timeout(200)
head = pgC.inner_text("#closetColHead")
pgC.select_option("#closetForm select[data-k='col.fill']", "drawers"); pgC.wait_for_timeout(200)
check("cabinet: a tap on the third column chooses it; its inside can be set (drawers: their number, no door)",
      "3" in head and pgC.locator("#closetForm input[data-k='col.n']").count() == 1 and pgC.locator("#closetForm select[data-k='col.front']").count() == 0, head)
pgC.click("#closetFitDlg"); pgC.wait_for_timeout(300)
msg = pgC.inner_text("#closetMsg") if pgC.locator("#closetMsg").count() else ""
check("cabinet: 'An die Dachschräge anpassen' finds the roof over it and adds a slope", pgC.locator(".closetSlope").count() >= 1 and msg, msg)
pgC.click("#closet3d"); pgC.wait_for_timeout(800)
check("cabinet: the editor shows it in 3D", pgC.locator("#closetDraw canvas.closet3dCanvas").count() == 1)
pgC.click("#closet3d"); pgC.wait_for_timeout(200)
undo_before = pgC.evaluate("window.__fp.layout.floors[%d].devices.find((d) => d.type === 'closet').cab" % ri)
pgC.click("#closetOk"); pgC.wait_for_timeout(600)
d1 = cl()
check("cabinet: 'Übernehmen' puts it on the device: the drawers, the slope, lower than before",
      not pgC.is_visible("#closetDialog") and d1["cab"]["cols"][2]["fill"] == "drawers" and len(d1["cab"]["slopes"]) >= 1 and min(s["low"] for s in d1["cab"]["slopes"]) < 2.2, d1["cab"])
check("cabinet: drawn in 3D", pgC.evaluate("(id) => window.__fp.isShown(id)", d1["id"]))
pgC.click("#undoBtn"); pgC.wait_for_timeout(600)
check("cabinet: one undo step brings back the cabinet before the editor", cl()["cab"] == undo_before, cl()["cab"])
pgC.evaluate("(id) => window.__fp.select('device', id)", d1["id"]); pgC.wait_for_timeout(400)
pgC.click("#closetEdit"); pgC.wait_for_timeout(400)
pgC.select_option("#closetForm select[data-k=preset]", "chest"); pgC.wait_for_timeout(200)
w_in = pgC.locator("#closetForm input[data-k=w]")
w_in.fill(str(round(float(w_in.input_value()) * 1.5, 1))); w_in.dispatch_event("change"); pgC.wait_for_timeout(200)   # 1.20 m -> 1.80 m, in whatever unit the page shows
pgC.click("#closetOk"); pgC.wait_for_timeout(500)
d2 = cl()["cab"]
check("cabinet: a template (chest of drawers) and a new width (all columns grow together)",
      d2["h"] == 0.86 and all(q["fill"] == "drawers" for q in d2["cols"]) and abs(sum(q["w"] for q in d2["cols"]) - 1.8) < 0.011, d2)
check("cabinet: no errors on the page", not cl_errs, cl_errs[:3])
pgC.close()
put_layout_cl = urllib.request.Request(BASE + "api/layout", data=json.dumps(cl_saved).encode(), method="PUT", headers={"X-Remote-User-Name": "admin", "Content-Type": "application/json"})
urllib.request.urlopen(put_layout_cl).read()
set_setting("units", units_cl)
