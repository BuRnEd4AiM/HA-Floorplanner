"""Editing helpers: redo after undo (Ctrl+Y, Ctrl+Shift+Z, the ↶ / ↷ buttons, #404), copy / paste / duplicate (Ctrl+C / V / D, several
things at once, onto another floor, a window into its wall, #405), and a plan saved meanwhile on another screen: the question, "load the
other version" and "keep mine" (#403).
"""
hdr = {"X-Remote-User-Name": "admin"}
pgU = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers=hdr)
own = []
pgU.on("console", lambda m: own.append(m.text) if m.type == "error" and "409" not in m.text else None)   # the refused save is the point of the last checks
pgU.on("pageerror", lambda e: own.append("PAGEERROR " + str(e)))
pgU.goto(BASE + "?debug=1&mode=edit"); pgU.wait_for_timeout(1500)
back = pgU.evaluate("window.__fp.floorIdx()")
# two floors of their own, away from the test house: a room with one wall, a window in it and a lamp; the second floor stays empty
pgU.evaluate("""() => { const fp = window.__fp, empty = { devices: [], stairs: [], blocks: [], holes: [], walls: [], rooms: [] };
  fp.layout.floors.push({ ...empty, id: 'edG', name: 'Edit 2', kind: 'floor' });
  fp.layout.floors.push({ ...empty, id: 'edF', name: 'Edit', kind: 'floor',
    devices: [{ id: 'edLamp', type: 'spot', x: 41, z: 41, y: 2.5, rot: 0, scale: 1, name: 'Spot', entity: '' }],
    walls: [{ id: 'edW', a: [40, 40], b: [46, 40], thickness: 0.2, height: 2.6, openings: [{ id: 'edWin', type: 'window', pos: 1.5, width: 1, height: 1.2, sill: 0.9 }] }],
    rooms: [{ id: 'edRoom', name: 'Editraum', color: '#8a7f70', points: [[40, 40], [46, 40], [46, 44], [40, 44]] }] });
  fp.switchFloor(fp.layout.floors.length - 1); fp.rebuild(); }""")
pgU.click("#saveBtn"); pgU.wait_for_timeout(600)
fl = lambda fid="edF": pgU.evaluate(f"window.__fp.layout.floors.find((f) => f.id === {fid!r})")
lamp = lambda: next((d for d in fl()["devices"] if d["id"] == "edLamp"), None)
sel = lambda: pgU.evaluate("window.__fp.selection()")
srv_lamp = lambda: next(d for d in next(f for f in api_admin("api/layout")["floors"] if f["id"] == "edF")["devices"] if d["id"] == "edLamp")
def key(k):
    pgU.keyboard.press(k); pgU.wait_for_timeout(250)

# --- undo / redo (#404)
pgU.mouse.move(700, 500)
check("redo: both buttons are there and greyed out on a freshly opened plan", pgU.is_visible("#undoBtn") and pgU.is_disabled("#undoBtn") and pgU.is_disabled("#redoBtn"))
pgU.evaluate("window.__fp.select('device', 'edLamp')")
key("ArrowRight")
x1 = lamp()["x"]
check("redo: a change makes ↶ pressable, ↷ stays grey", x1 > 41 and not pgU.is_disabled("#undoBtn") and pgU.is_disabled("#redoBtn"), (x1, lamp()))
key("Control+z")
check("redo: Ctrl+Z takes the change back and ↷ becomes pressable", lamp()["x"] == 41 and not pgU.is_disabled("#redoBtn"), lamp())
key("Control+y")
check("redo: Ctrl+Y does it again", lamp()["x"] == x1, lamp())
key("Control+z"); key("Control+Shift+Z")
check("redo: Ctrl+Shift+Z does it again too", lamp()["x"] == x1, lamp())
pgU.click("#undoBtn"); pgU.wait_for_timeout(250)
ok_undo = lamp()["x"] == 41
pgU.click("#redoBtn"); pgU.wait_for_timeout(250)
check("redo: the buttons ↶ and ↷ do the same; after the last redo ↷ is grey again", ok_undo and lamp()["x"] == x1 and pgU.is_disabled("#redoBtn"), lamp())
key("Control+z")
pgU.evaluate("window.__fp.select('device', 'edLamp')"); key("ArrowDown")
check("redo: a new change after an undo empties redo", pgU.is_disabled("#redoBtn") and lamp()["x"] == 41 and lamp()["z"] > 41, lamp())
key("Control+z")
check("redo: the keys are listed in the help of the side panel", "Ctrl+Y" in pgU.inner_text("#controlsHelp") and "Ctrl+C" in pgU.inner_text("#controlsHelp"))

# --- copy, paste, duplicate (#405)
n0 = len(fl()["devices"])
pgU.evaluate("window.__fp.select('device', 'edLamp')")
key("Control+c")
check("copy: Ctrl+C copies the selected lamp and says so", "1" in pgU.inner_text("#status") and len(fl()["devices"]) == n0, pgU.inner_text("#status"))
key("Control+v")
devs = fl()["devices"]
new = [d for d in devs if d["id"] != "edLamp"]
check("copy: Ctrl+V puts a copy half a metre aside, with a new id, and selects it",
      len(devs) == n0 + 1 and new and new[0]["x"] == 41.5 and new[0]["z"] == 41.5 and new[0]["type"] == "spot" and sel() == {"kind": "device", "id": new[0]["id"]}, (devs, sel()))
key("Control+v")
check("copy: each further paste lands one step further", any(d["x"] == 42 and d["z"] == 42 for d in fl()["devices"]), fl()["devices"])
key("Control+d")
check("copy: Ctrl+D duplicates the selection right beside it", any(d["x"] == 42.5 and d["z"] == 42.5 for d in fl()["devices"]) and len(fl()["devices"]) == n0 + 3, fl()["devices"])
key("Control+z")
check("copy: one undo takes the duplicate away again", len(fl()["devices"]) == n0 + 2)
pgU.evaluate("window.__fp.switchFloor(window.__fp.layout.floors.findIndex((f) => f.id === 'edG'))"); pgU.wait_for_timeout(400)
key("Control+v")
g = fl("edG")["devices"]
check("copy: on another floor the copy lands at the same place (the same lamp one storey higher)", len(g) == 1 and g[0]["x"] == 41 and g[0]["z"] == 41, g)
pgU.evaluate("window.__fp.switchFloor(window.__fp.layout.floors.findIndex((f) => f.id === 'edF'))"); pgU.wait_for_timeout(400)
pgU.evaluate("window.__fp.selectMany([{ kind: 'room', id: 'edRoom' }, { kind: 'wall', id: 'edW' }, { kind: 'device', id: 'edLamp' }])")
nr, nw = len(fl()["rooms"]), len(fl()["walls"])
key("Control+d")
f = fl()
check("copy: several things together (room, wall with its window, lamp) are duplicated in one go and stay selected together",
      len(f["rooms"]) == nr + 1 and len(f["walls"]) == nw + 1 and len(f["walls"][-1]["openings"]) == 1 and f["walls"][-1]["a"] == [40.5, 40.5]
      and len(pgU.evaluate("window.__fp.multi()")) == 3, (f["walls"], pgU.evaluate("window.__fp.multi()")))
key("Escape"); key("Control+z")
pgU.evaluate("window.__fp.select('opening', 'edWin')")
key("Control+d")
ops = next(w for w in fl()["walls"] if w["id"] == "edW")["openings"]
check("copy: a window alone goes into the same wall, at the next free place beside it", len(ops) == 2 and ops[1]["pos"] == 2.6 and ops[1]["id"] != "edWin", ops)
key("Control+z")
pgU.click("#saveBtn"); pgU.wait_for_timeout(600)

# --- the plan saved meanwhile on another screen (#403)
pgV = b.new_page(viewport={"width": 1400, "height": 850}, extra_http_headers=hdr)
pgV.goto(BASE + "?debug=1&mode=edit"); pgV.wait_for_timeout(1500)
pgV.evaluate("() => { const fp = window.__fp; fp.switchFloor(fp.layout.floors.findIndex((f) => f.id === 'edF')); fp.select('device', 'edLamp'); }")
pgV.keyboard.press("ArrowUp"); pgV.wait_for_timeout(300)
pgV.click("#saveBtn"); pgV.wait_for_timeout(600)
other_z = srv_lamp()["z"]
check("conflict: the second screen saved its change", other_z < 41, other_z)
pgU.evaluate("window.__fp.select('device', 'edLamp')"); key("ArrowLeft")
pgU.wait_for_timeout(2500)                                              # the autosave of the first screen: refused, the question comes
check("conflict: the first screen does not overwrite it but asks which version should stay",
      pgU.is_visible("#conflictDialog") and "changed elsewhere" in pgU.inner_text("#status") and srv_lamp()["z"] == other_z,
      (pgU.inner_text("#status"), pgU.is_visible("#conflictDialog")))
pgU.keyboard.press("Escape"); pgU.wait_for_timeout(200)
check("conflict: Esc does not decide, the question stays", pgU.is_visible("#conflictDialog"))
pgU.click("#conflictReload"); pgU.wait_for_timeout(800)
check("conflict: \"load the other version\" shows the other screen's plan, the floor stays open, nothing to undo",
      not pgU.is_visible("#conflictDialog") and lamp()["z"] == other_z and lamp()["x"] == 41 and pgU.evaluate("window.__fp.layout.floors[window.__fp.floorIdx()].id") == "edF"
      and pgU.is_disabled("#undoBtn"), (lamp(), pgU.inner_text("#status")))
pgU.evaluate("window.__fp.select('device', 'edLamp')"); key("ArrowLeft"); pgU.wait_for_timeout(2500)
mine = lamp()
check("conflict: after loading, the next change is saved normally", not pgU.is_visible("#conflictDialog") and srv_lamp()["x"] == mine["x"], mine)
pgV.evaluate("window.__fp.select('device', 'edLamp')"); pgV.keyboard.press("ArrowRight"); pgV.wait_for_timeout(2500)   # now the second screen is behind
check("conflict: the other screen gets the question too", pgV.is_visible("#conflictDialog"))
pgV.click("#conflictKeep"); pgV.wait_for_timeout(800)
srv = srv_lamp()
check("conflict: \"keep mine\" saves that screen's plan over the other one", not pgV.is_visible("#conflictDialog") and srv["z"] == other_z and srv["x"] != mine["x"] and "Saved" in pgV.inner_text("#status"), (srv, mine, pgV.inner_text("#status")))
pgV.close()

# --- clean up: the two floors go again (the first screen loads the plan of the second one first)
pgU.goto(BASE + "?debug=1&mode=edit"); pgU.wait_for_timeout(1500)
pgU.evaluate(f"""() => {{ const fp = window.__fp; fp.layout.floors = fp.layout.floors.filter((f) => f.id !== 'edF' && f.id !== 'edG'); fp.switchFloor(Math.min({back}, fp.layout.floors.length - 1)); fp.rebuild(); }}""")
pgU.click("#saveBtn"); pgU.wait_for_timeout(800)
check("editing: the test floors are gone again", not any(f["id"] in ("edF", "edG") for f in api_admin("api/layout")["floors"]))
bad = [e for e in own if "favicon" not in e]
check("editing: no console errors", not bad, bad)
pgU.close()
