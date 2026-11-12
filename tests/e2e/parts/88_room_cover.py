"""5.8.1 (the owner, 2026-11-12: "ich will bei den Rollo-Sachen, wenn man es in der Leiste rechts hat, dass man auch das mit den
voreingestellten Sachen wie 50 % machen kann und dass es besser aussieht"): a roller shutter in the room panel of the live view has
▲ Hoch · ■ Stopp · ▼ Runter as one row, the slider and the quick positions 0 · 25 · 50 · 75 · 100 % of its card (the one it is at lit); a
cover that does not say its position only the buttons. The slider gives the focus back after a tap, so the panel follows the states again;
the panel is drawn anew only when what it shows changed, never while a finger is pressed on it.
"""
saved_rc = api_admin("api/layout")              # put back at the end
st_rc = api("api/settings")
set_setting("language", "de")
def extra_rc(body):
    urllib.request.urlopen(urllib.request.Request(HA + "/_extra", data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
extra_rc({
    "cover.rc_1": {"state": "open", "attributes": {"friendly_name": "Rollo Studio", "current_position": 25}},
    "cover.rc_2": {"state": "closed", "attributes": {"friendly_name": "Rollo ohne Position"}},
})
lay_rc = json.loads(json.dumps(saved_rc))
f0_rc = lay_rc["floors"][0]
f0_rc.setdefault("rooms", []).append({"id": "rc_room", "name": "Rollozimmer", "color": "#777777", "points": [[120, 90], [124, 90], [124, 94], [120, 94]]})
win_rc = lambda i, pos, e: {"id": f"rc_w{i}", "type": "window", "style": "single", "pos": pos, "width": 1.0, "height": 1.2, "sill": 0.9, "name": f"Fenster {i}",
                            "shutter": True, "shutterEntity": e}
f0_rc.setdefault("walls", []).append({"id": "rc_wall", "a": [120, 90], "b": [124, 90], "thickness": 0.2, "height": 2.6,
                                      "openings": [win_rc(1, 1.0, "cover.rc_1"), win_rc(2, 3.0, "cover.rc_2")]})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(lay_rc).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()

pgRC = b.new_page(viewport={"width": 1400, "height": 950}, extra_http_headers={"X-Remote-User-Name": "admin"})
own_rc = []
pgRC.on("pageerror", lambda e: own_rc.append("PAGEERROR " + str(e)))
pgRC.goto(BASE + "?debug=1&mode=live"); pgRC.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgRC.wait_for_timeout(1500)
pgRC.evaluate("window.__fp.switchFloor(0)"); pgRC.wait_for_timeout(600)
pgRC.evaluate("window.__fp.openRoomPanel('rc_room')"); pgRC.wait_for_timeout(1200)
def wait_rc(fn, n=30):
    for _ in range(n):
        if fn(): return True
        pgRC.wait_for_timeout(200)
    return fn()
rows_rc = lambda: pgRC.evaluate("""[...document.querySelectorAll('#roomPanel .rpCoverRow')].map((r) => ({ name: r.querySelector('.n').textContent, value: r.querySelector('.v').textContent,
  acts: [...r.querySelectorAll('.rpCoverActs button')].map((b) => [b.dataset.svc, b.textContent.trim()]),
  presets: [...r.querySelectorAll('.rpCoverPresets button')].map((b) => [b.dataset.pos, b.classList.contains('on')]),
  slider: r.querySelector('input[type=range]')?.value ?? null }))""")
wait_rc(lambda: len(rows_rc()) == 2)
rc = rows_rc()
first = next((r for r in rc if r["name"] == "Fenster 1"), None)
second = next((r for r in rc if r["name"] == "Fenster 2"), None)
check("room panel cover: both shutters of the room's windows are under „Rollläden“", first is not None and second is not None, rc)
check("room panel cover: ▲ Hoch · ■ Stopp · ▼ Runter as one row of three buttons", bool(first) and first["acts"] == [["open_cover", "Hoch"], ["stop_cover", "Stopp"], ["close_cover", "Runter"]], first)
check("room panel cover: the quick positions 0 · 25 · 50 · 75 · 100 %, the one it is at (25 %) lit, the slider at 25",
      bool(first) and first["presets"] == [["0", False], ["25", True], ["50", False], ["75", False], ["100", False]] and first["slider"] == "25", first)
check("room panel cover: the row says how far it is open", bool(first) and first["value"] == "25 % offen", first)
check("room panel cover: a cover without a position has only the three buttons (no slider, no quick positions)",
      bool(second) and len(second["acts"]) == 3 and second["presets"] == [] and second["slider"] is None, second)
lay_btn = pgRC.evaluate("""(() => { const r = [...document.querySelectorAll('#roomPanel .rpCoverRow')].find((x) => x.querySelector('.rpCoverPresets'));
  const box = r.getBoundingClientRect(), bs = [...r.querySelectorAll('.rpCoverActs button, .rpCoverPresets button')].map((b) => b.getBoundingClientRect());
  const tops = (sel) => [...new Set([...r.querySelectorAll(sel)].map((b) => Math.round(b.getBoundingClientRect().top)))];
  return [bs.every((x) => x.left >= box.left - 1 && x.right <= box.right + 1), tops('.rpCoverActs button').length, tops('.rpCoverPresets button').length]; })()""")
check("room panel cover: the three buttons are one line, the five quick positions one line, all inside the row", lay_btn == [True, 1, 1], lay_btn)

# drawn anew only when what it shows changed, and never while a finger is pressed on it (a button drawn anew under the finger lost its tap)
pgRC.evaluate("window.__rcDraws = 0; new MutationObserver(() => window.__rcDraws++).observe(document.querySelector('#roomPanel'), { childList: true })")
pgRC.wait_for_timeout(3000)
check("room panel: nothing in the room changed, so it is not drawn anew at the state updates of the house", pgRC.evaluate("window.__rcDraws") == 0, pgRC.evaluate("window.__rcDraws"))
pgRC.evaluate("""() => { document.querySelector('#roomPanel .rpCoverActs button').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  window.__fp.states()['cover.rc_1'] = { ...window.__fp.states()['cover.rc_1'], position: 60 }; window.__fp.applyStates(); }""")
held_rc = pgRC.evaluate("[window.__rcDraws, document.querySelector('#roomPanel .rpCoverRow .v').textContent]")
pgRC.evaluate("""() => { window.dispatchEvent(new PointerEvent('pointerup')); window.__fp.states()['cover.rc_1'] = { ...window.__fp.states()['cover.rc_1'], position: 60 };
  window.__fp.applyStates(); }""")
let_go_rc = pgRC.evaluate("[window.__rcDraws, [...document.querySelectorAll('#roomPanel .rpCoverRow .v')].map((v) => v.textContent)]")
check("room panel: while a finger is pressed on it a new state waits; let go, it shows (60 % offen)",
      held_rc[0] == 0 and let_go_rc[0] > 0 and "60 % offen" in let_go_rc[1], [held_rc, let_go_rc])

n_rc = len(json.load(urllib.request.urlopen(HA + "/_calldata")))
pgRC.evaluate("[...document.querySelectorAll('#roomPanel .rpCoverRow')].find((x) => x.querySelector('.rpCoverPresets')).querySelector('.rpCoverPresets button[data-pos=\"75\"]').click()")
new_rc = lambda: json.load(urllib.request.urlopen(HA + "/_calldata"))[n_rc:]
check("room panel cover: a tap on „75 %“ sends the shutter there", wait_rc(lambda: ["set_cover_position", "cover.rc_1", {"position": 75}] in new_rc()), new_rc())
n_calls_rc = len(ha_calls())
pgRC.evaluate("[...document.querySelectorAll('#roomPanel .rpCoverRow')].find((x) => x.querySelector('.rpCoverPresets')).querySelector('.rpCoverActs button[data-svc=close_cover]').click()")
check("room panel cover: „▼ Runter“ closes it", wait_rc(lambda: ["cover", "close_cover", "cover.rc_1"] in ha_calls()[n_calls_rc:]), ha_calls()[n_calls_rc:])

# the slider: a tap on it sets the position and gives the focus back (the panel is not drawn anew while one of its fields has the focus)
sl = pgRC.evaluate("""(() => { const r = [...document.querySelectorAll('#roomPanel .rpCoverRow')].find((x) => x.querySelector('.rpCoverPresets'));
  const s = r.querySelector('input[type=range]'); s.scrollIntoView({ block: 'center' }); const b = s.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; })()""")
n_rc = len(json.load(urllib.request.urlopen(HA + "/_calldata")))
pgRC.mouse.click(sl["x"] + sl["w"] * 0.9, sl["y"] + sl["h"] / 2); pgRC.wait_for_timeout(500)
moved = [c for c in new_rc() if c[0] == "set_cover_position" and c[1] == "cover.rc_1"]
check("room panel cover: a tap on the slider sends a position", bool(moved) and moved[-1][2]["position"] >= 80, new_rc())
check("room panel cover: the slider does not keep the focus after the tap", not pgRC.evaluate("document.activeElement?.matches?.('#roomPanel input[type=range]')"),
      pgRC.evaluate("document.activeElement?.outerHTML?.slice(0, 80)"))
check("room panel cover: no errors on the page", not own_rc, own_rc)
pgRC.close()
extra_rc({})
urllib.request.urlopen(urllib.request.Request(BASE + "api/layout", data=json.dumps(saved_rc).encode(), method="PUT",
                                              headers={"Content-Type": "application/json", "X-Remote-User-Name": "admin"})).read()
set_setting("language", st_rc.get("language", "en"))
