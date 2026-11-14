"""5.11.0 (Miicki's wishes of 2026-11-14): the colour and cover of the roof (#752, „dunkelgraue Ziegel“), a stair's covering, risers and hand
rail (#753), the colours of doors and windows, each on its own and for the whole house (#754); also in ✨ Neu, with the search.
"""
saved_lk = api_admin("api/layout")                  # put back at the end
set0_lk = api("api/settings")
set_setting("theme", "dark"); set_setting("language", "de"); set_setting("units", "metric")   # the hologram has no patterns
def put_lk(body):
    urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(body).encode(), method="PUT",
                                                  headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
W = lambda i, a, c, ops=(): {"id": f"lk_w{i}", "a": a, "b": c, "thickness": 0.24, "height": 2.6, "openings": list(ops)}
door = lambda oid, pos: {"id": oid, "type": "door", "style": "single", "width": 0.9, "height": 2.0, "sill": 0, "pos": pos}
put_lk({"version": 1, "floors": [
    {"id": "lkEG", "name": "EG", "kind": "floor", "devices": [], "blocks": [], "holes": [],
     "rooms": [{"id": "lk_a", "name": "Diele", "covering": "tiles", "points": [[0, 0], [4, 0], [4, 5], [0, 5]]},
               {"id": "lk_b", "name": "Wohnen", "points": [[4, 0], [8, 0], [8, 5], [4, 5]]}],
     "walls": [W(1, [0, 0], [8, 0], [door("lk_out", 2)]), W(2, [8, 0], [8, 5], [{"id": "lk_win", "type": "window", "style": "single", "width": 1.2, "height": 1.2, "sill": 0.9, "pos": 2.5}]),
               W(3, [8, 5], [0, 5]), W(4, [0, 5], [0, 0]), W(5, [4, 0], [4, 5], [door("lk_in", 2.5)])],
     "stairs": [{"id": "lk_st", "type": "straight", "name": "Probetreppe", "x": 0.8, "z": 1.2, "w": 1.0, "rot": 0, "dir": "up", "floors": 1},
                {"id": "lk_sp", "type": "spiral", "name": "Wendel", "x": 6.5, "z": 3.2, "w": 0.8, "rot": 0, "dir": "up", "floors": 1}]},
    {"id": "lkDach", "name": "Dach", "kind": "roof", "walls": [], "rooms": [], "devices": [], "blocks": [], "stairs": [],
     "roof": {"type": "gable", "pitch": 35, "overhang": 0.4, "dormers": [{"type": "gable", "side": 0, "at": 2, "w": 1.4}]}}]})
pgK = b.new_page(viewport={"width": 1500, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
errs_lk = []
pgK.on("pageerror", lambda e: errs_lk.append("PAGEERROR " + str(e)))
pgK.goto(BASE + "?debug=1&mode=edit"); pgK.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgK.wait_for_timeout(1200)
L_lk = lambda js: pgK.evaluate(f"(() => {{ const fl = window.__fp.layout.floors; return {js}; }})()")
ROOF = """() => { const out = {}; window.__fp.scene.traverse((o) => { if (o.userData?.roofPart === 'main' && o.material && !o.userData.gableWall) {
  const k = o.userData.dormerPart || 'slope'; if (!out[k]) out[k] = { color: '#' + o.material.color.getHexString(), map: !!o.material.map, uv: !!o.geometry.attributes.uv }; } }); return out; }"""

# --- the roof (#752)
pgK.evaluate("window.__fp.switchFloor(1)"); pgK.wait_for_timeout(700)
r0 = pgK.evaluate(ROOF)
check("roof look (#752): nothing set: brick red slopes, dark red dormer roof, no pattern (as always)",
      r0.get("slope", {}).get("color") == "#a4493b" and r0.get("roof", {}).get("color") == "#8f3b2f" and not r0["slope"]["map"], r0)
pgK.evaluate("window.__fp.select('roof', 'lkDach:roof')"); pgK.wait_for_selector("#roofEd", timeout=5000)
check("roof editor: a section „Farbe & Deckung“ that says „Ziegelrot · Glatt“", pgK.locator(".roofEd .v2Sec[data-sec=look]").count() == 1
      and "Ziegelrot" in pgK.inner_text(".roofEd .v2Sec[data-sec=look] .sum"), pgK.inner_text(".roofEd .v2Sec[data-sec=look] .sum") if pgK.locator(".roofEd .v2Sec[data-sec=look]").count() else None)
pgK.click(".roofEd .v2Sec[data-sec=look] > .hd"); pgK.wait_for_timeout(300)
pgK.click("#re-roofLookSwatches [data-key=darkgrey]"); pgK.wait_for_timeout(900)
pgK.select_option("#re-roofCover", "tiles"); pgK.wait_for_timeout(1200)
r1 = pgK.evaluate(ROOF)
check("roof look: „Dunkelgrau“ and „Dachziegel“ are kept; the slopes show tiles in dark grey, the dormer's roof too, a little darker",
      L_lk("fl[1].roof.color") == "#5c6066" and L_lk("fl[1].roof.cover") == "tiles" and r1["slope"]["map"] and r1["slope"]["uv"]
      and r1.get("roof", {}).get("map") and "Dunkelgrau" in pgK.inner_text(".roofEd .v2Sec[data-sec=look] .sum") and "Dachziegel" in pgK.inner_text(".roofEd .v2Sec[data-sec=look] .sum"),
      [L_lk("fl[1].roof"), r1])
pgK.click("#re-roofLookReset"); pgK.wait_for_timeout(900)
check("roof look: ↺ gives the brick red back (the tiles stay)", L_lk("fl[1].roof.color === undefined && fl[1].roof.cover === 'tiles'"), L_lk("fl[1].roof"))

# --- the stair (#753)
pgK.keyboard.press("Escape"); pgK.evaluate("window.__fp.switchFloor(0)"); pgK.wait_for_timeout(600)
pgK.evaluate("window.__fp.select('stair', 'lk_st')"); pgK.wait_for_selector("#stairCovering", timeout=5000)
s0 = pgK.evaluate("window.__fp.looksOf('lk_st')")
check("stair look (#753): nothing set: beige steps, no pattern; the fields Trittstufen, Setzstufen and „Wie der Boden von Diele“ (a straight stair has no rail yet: said)",
      any(m["color"] == "#c9bba1" for m in s0["mats"]) and not any(m["map"] for m in s0["mats"]) and pgK.locator("#stairRiserColor").count() == 1
      and pgK.locator("#stairRailColor").count() == 0 and pgK.locator("#stairNoRail").count() == 1 and "Diele" in pgK.inner_text("#stairLikeRoom"), s0)
pgK.click("#stairLikeRoom"); pgK.wait_for_timeout(1000)
check("stair look: „Wie der Boden von Diele“ takes its tiles", L_lk("fl[0].stairs[0].covering") == "tiles", L_lk("fl[0].stairs[0]"))
pgK.select_option("#stairCovering", "parquet"); pgK.wait_for_timeout(1000)
pgK.click("#stairRiserSwatches [data-key=white]"); pgK.wait_for_timeout(900)
s1 = pgK.evaluate("window.__fp.looksOf('lk_st')")
st_lk = L_lk("fl[0].stairs[0]")
check("stair look: parquet on the treads (a texture in 3D), white risers; kept with the stair",
      st_lk.get("covering") == "parquet" and st_lk.get("riser") == "#f2f0ea" and any(m["map"] for m in s1["mats"]) and any(m["color"] == "#f2f0ea" for m in s1["mats"]), [st_lk, s1])
check("stair look: the parquet's colour, size and angle fields as for a room", pgK.locator("#stairTreadColor").count() == 1 and pgK.locator("#stairTreadAngle").count() == 1, None)
pgK.evaluate("window.__fp.select('stair', 'lk_sp')"); pgK.wait_for_selector("#stairRailColor", timeout=5000)
pgK.click("#stairRailSwatches [data-key=black]"); pgK.wait_for_timeout(1000)
check("stair look: the spiral stair's hand rail and pole black", L_lk("fl[0].stairs[1].rail") == "#232528" and any(m["color"] == "#232528" for m in pgK.evaluate("window.__fp.looksOf('lk_sp')")["mats"]),
      pgK.evaluate("window.__fp.looksOf('lk_sp')"))

# --- doors and windows (#754)
pgK.evaluate("window.__fp.select('opening', 'lk_in')"); pgK.wait_for_selector("#openLeafColor", timeout=5000)
check("door look (#754): an inner door: Türblatt and Zarge, „wie die Innentüren“", pgK.locator("#openFrameColor").count() == 1 and "Innentüren" in pgK.inner_text("#openLookHint"),
      pgK.inner_text("#openLookHint"))
pgK.click("#openLeafSwatches [data-key=white]"); pgK.wait_for_timeout(1000)
d1 = pgK.evaluate("window.__fp.looksOf('lk_in')")
check("door look: a white leaf: kept with the door, drawn white (the frame white as always)", L_lk("fl[0].walls[4].openings[0].look") == {"leaf": "#f4f4f4"}
      and d1["tint"].get("door") == "#f4f4f4" and d1["tint"].get("frame") == "#f4f4f4", [L_lk("fl[0].walls[4].openings[0]"), d1])
pgK.evaluate("window.__fp.select('opening', 'lk_out')"); pgK.wait_for_selector("#openLeafColor", timeout=5000)
check("door look: the front door says it leads outside („wie die Haustür“)", "nach draußen" in pgK.inner_text("#openLookHint"), pgK.inner_text("#openLookHint"))
pgK.evaluate("window.__fp.select('opening', 'lk_win')"); pgK.wait_for_selector("#openFrameColor", timeout=5000)
check("window look: a window has only its frame", pgK.locator("#openLeafColor").count() == 0, None)
pgK.click("#openFrameSwatches [data-key=anthracite]"); pgK.wait_for_timeout(1000)
check("window look: an anthracite frame, kept and drawn", L_lk("fl[0].walls[1].openings[0].look") == {"frame": "#2e3338"} and pgK.evaluate("window.__fp.looksOf('lk_win')")["tint"].get("frame") == "#2e3338",
      pgK.evaluate("window.__fp.looksOf('lk_win')"))
pgK.wait_for_timeout(2500)                          # saved
# the house's doors (⚙ → Haus außen): an anthracite front door, oak inner doors; a door of its own keeps its colour
set_setting("outerDoorLeaf", "#3a3e43"); set_setting("doorLeaf", "#C49A6C"); set_setting("doorFrame", "pink")
r_set = api("api/settings")
check("door settings: kept as colours ('' for anything else)", r_set["outerDoorLeaf"] == "#3a3e43" and r_set["doorLeaf"] == "#c49a6c" and r_set["doorFrame"] == "", r_set)
pgK.goto(BASE + "?debug=1&mode=edit"); pgK.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgK.wait_for_timeout(1200)
pgK.evaluate("window.__fp.switchFloor(0)"); pgK.wait_for_timeout(600)
lo, li = pgK.evaluate("window.__fp.looksOf('lk_out')"), pgK.evaluate("window.__fp.looksOf('lk_in')")
check("door settings: the front door anthracite, the inner door with its own white leaf", lo["tint"].get("door") == "#3a3e43" and li["tint"].get("door") == "#f4f4f4", [lo, li])
check("door settings: in ⚙ the four fields with the colours to choose", pgK.evaluate("document.querySelector('#setOuterDoorLeaf').value") == "#3a3e43"
      and pgK.locator("#setDoorLeaf option").count() >= 8 and pgK.evaluate("document.querySelector('#setDoorLeaf').value") == "#c49a6c"
      and pgK.locator("#setWindowFrames option[value=wood]").count() == 1, pgK.evaluate("document.querySelector('#setOuterDoorLeaf').value"))

# --- ✨ Neu: the sections „Aussehen“ and the search
pgK.goto(BASE + "?debug=1&mode=edit&ui=2"); pgK.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgK.wait_for_timeout(1000)
pgK.evaluate("window.__fp.switchFloor(0)"); pgK.wait_for_timeout(400)
pgK.evaluate("window.__fp.select('opening', 'lk_in')"); pgK.wait_for_selector("#v2Head", timeout=10000)
check("✨ Neu / door: a section „Aussehen“ that says „Eigene Farben“", pgK.locator(".v2Sec[data-sec=look]").count() == 1 and "Eigene Farben" in pgK.inner_text(".v2Sec[data-sec=look] .sum"),
      pgK.evaluate("[...document.querySelectorAll('#propsBody .v2Sec')].map((s) => s.dataset.sec)"))
pgK.fill("#v2Search", "Türblatt"); pgK.wait_for_timeout(600)
check("✨ Neu / door: „🔍 Einstellung suchen“ finds „Türblatt“", pgK.is_visible("#openLeafColor") and "Treffer" in pgK.inner_text("#v2SearchRes"), pgK.inner_text("#v2SearchRes"))
pgK.fill("#v2Search", ""); pgK.wait_for_timeout(300)
pgK.evaluate("window.__fp.select('stair', 'lk_sp')"); pgK.wait_for_timeout(800)
pgK.fill("#v2Search", "Geländer"); pgK.wait_for_timeout(600)
check("✨ Neu / stair: the search finds „Geländer“ (spiral stair)", pgK.is_visible("#stairRailColor"), pgK.inner_text("#v2SearchRes"))
pgK.fill("#v2Search", ""); pgK.wait_for_timeout(300)
pgK.evaluate("window.__fp.select('stair', 'lk_st')"); pgK.wait_for_timeout(800)
check("✨ Neu / stair: a section „Aussehen“ that names the parquet", pgK.locator(".v2Sec[data-sec=look]").count() == 1 and "Parkett" in pgK.inner_text(".v2Sec[data-sec=look] .sum"),
      pgK.inner_text(".v2Sec[data-sec=look] .sum") if pgK.locator(".v2Sec[data-sec=look]").count() else None)
pgK.fill("#v2Search", "Setzstufen"); pgK.wait_for_timeout(600)
check("✨ Neu / stair: the search finds „Setzstufen“", pgK.is_visible("#stairRiserColor"), pgK.inner_text("#v2SearchRes"))
pgK.fill("#v2Search", ""); pgK.wait_for_timeout(300)
check("looks: no error on the page", not errs_lk, errs_lk)
pgK.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
pgK.close()
put_lk(saved_lk)
for k in ("theme", "language", "units", "doorLeaf", "doorFrame", "outerDoorLeaf", "outerDoorFrame"):
    set_setting(k, set0_lk.get(k, ""))
