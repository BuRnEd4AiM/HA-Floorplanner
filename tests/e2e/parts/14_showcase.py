"""Show house with everything in it (examples/showcase.json): the import dialog loads it, it checks without a note, and the house shows it all.
"""
# The import dialog builds a new house from the example; at the end it is deleted again (the test house of base.py stays as it was).
pgS = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers={"X-Remote-User-Name": "admin"})
own = []
pgS.on("console", lambda m: own.append(m.text) if m.type == "error" else None)
pgS.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgS.goto(BASE + "?debug=1&mode=edit"); pgS.wait_for_timeout(1500)
before = {h["id"] for h in api_admin("api/houses")}
pgS.evaluate("document.querySelector('#housePanel').open = true")
pgS.click("#importOpen"); pgS.wait_for_selector("#importDialog[open]", timeout=5000)
pgS.click("#importExShow"); pgS.wait_for_function("document.querySelector('#importText').value.includes('Musterhaus')", timeout=5000)
pgS.click("#importCheck"); pgS.wait_for_selector("#importResult .imp-ok", timeout=5000)
ok_text = pgS.inner_text("#importResult")
check("show house: the button loads it and it checks clean (no errors, no notes)",
      pgS.locator("#importResult .imp-errors").count() == 0 and pgS.locator("#importResult .imp-warnings").count() == 0 and pgS.locator("#importRun").is_enabled(), ok_text)
pgS.click("#importRun")
pgS.wait_for_function("window.__fp.layout.floors.length === 4 && window.__fp.layout.floors[3].kind === 'roof'", timeout=15000); pgS.wait_for_timeout(1500)
new = [h for h in api_admin("api/houses") if h["id"] not in before]
check("show house: imported as a new house and opened", len(new) == 1 and pgS.evaluate("window.__fp.houseId()") == new[0]["id"], new)
lay = pgS.evaluate("window.__fp.layout")
check("show house: basement, two storeys and the roof", [f["kind"] for f in lay["floors"]] == ["basement", "floor", "floor", "roof"])
check("show house: all five kinds of stairs", sorted(s["type"] for f in lay["floors"] for s in f.get("stairs", [])) == ["L", "U", "spiral", "straight", "wall"])
roof_floor = lay["floors"][3]
check("show house: the solar panels on the roof floor came through the import", [d["type"] for d in roof_floor["devices"]] == ["solarpanel"] and roof_floor["devices"][0]["cols"] == 5)
og = lay["floors"][2]
terrace = next(r for r in og["rooms"] if r.get("terrace"))
tx0 = min(p[0] for p in terrace["points"])
check("show house: the roof terrace has no walls on its open sides", not [w for w in og["walls"] if min(w["a"][0], w["b"][0]) > tx0 + 0.01], [w for w in og["walls"] if min(w["a"][0], w["b"][0]) > tx0 + 0.01])
part = roof_floor["roof"]["parts"][0]
block = next(bl for f in lay["floors"] for bl in f.get("blocks", []))
check("show house: the garden house roof sits on the garden house (both moved by the building origin)",
      [part["box"]["x0"], part["box"]["z0"]] == [min(p[0] for p in block["points"]), min(p[1] for p in block["points"])], (part["box"], block["points"]))
pgS.click("#floorRail .railHouse"); pgS.wait_for_timeout(2500)
rm = pgS.evaluate("window.__fp.roofMeshes()")
check("show house: whole house draws the main roof with dormers and the garden house roof", {"main", "rp1"} <= {m["tag"] for m in rm} and any(m["part"] for m in rm), sorted({m["tag"] for m in rm}))
pv = roof_floor["devices"][0]["id"]
check("show house: the solar panels are shown on the roof", pgS.evaluate(f"window.__fp.isShown('{pv}')"))
bad = [e for e in own if "favicon" not in e]
check("show house: no console errors while importing and showing it", not bad, bad)
pgS.evaluate("(id) => fetch('api/houses/' + id, {method: 'DELETE'})", new[0]["id"] if new else ""); pgS.wait_for_timeout(300)
pgS.close()
