"""5.37.0 (the owner, 2026-11-26: "ein Theme, dass es so aussieht, als wäre es von Apple … die Hintergründe", "auch unten die Leiste und alles
drum und dran", "nur ein Design … eine Option und kein Muss"; his pictures in docs/ideen-5.37): two more designs, „Glas dunkel“ and „Glas
hell“, next to Hologramm, Dunkel and Hell. The default stays „Dunkel“. A glass design builds on dark / light (data-theme) and adds
data-glass: the own house, blurred, behind the pages (taken from the 3D view), the tab bar floating, firm glass over the 3D view without
cut-off shadows in the strips, search, microphone and compass in one box. ⚡ Energie (idea 2 / picture 3): a ring for „Selbst gemacht“,
icons on the tiles, a soft area instead of the bars, the battery as a battery; the other designs keep the bars. In „✨ Neu“ the settings
show the same five designs.
"""
st_gl = api("api/settings")
set_setting("language", "de"); set_setting("units", "metric"); set_setting("theme", "dark")
def post_gl(path, body):
    urllib.request.urlopen(urllib.request.Request(HA + path, data=json.dumps(body).encode(), method="POST", headers={"Content-Type": "application/json"})).read()
post_gl("/_energy", {"prefs": {"energy_sources": [    # meters, so the page ⚡ Energie is there (as in 32_today_energy)
    {"type": "grid", "stat_energy_from": "sensor.netz_bezug", "stat_energy_to": "sensor.netz_einspeisung", "number_energy_price": 0.3},
    {"type": "solar", "stat_energy_from": "sensor.pv_ertrag"}]}})
own_gl = []
pgG = b.new_page(viewport={"width": 1400, "height": 900}, extra_http_headers={"X-Remote-User-Name": "admin"})
pgG.on("pageerror", lambda e: own_gl.append("PAGEERROR " + str(e)))
pgG.goto(BASE + "?debug=1&mode=live"); pgG.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgG.wait_for_timeout(1000)
def pick_gl(v):                                       # the hidden drop-down the buttons stand for (settings.js saves on change)
    pgG.evaluate("(v) => { const s = document.getElementById('setTheme'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }", v)
    pgG.wait_for_timeout(1500)
html_gl = lambda: pgG.evaluate("[document.documentElement.dataset.theme, document.documentElement.dataset.glass || null]")
check("🍏 „Dunkel“: no glass on the page", html_gl() == ["dark", None], html_gl())
pgG.click("#settingsBtn"); pgG.wait_for_timeout(600)
pgG.click("#sgNav [data-group=general]"); pgG.wait_for_timeout(300)
seg_gl = pgG.evaluate("[...document.querySelectorAll('.segBtns[data-for=setTheme] button')].map((b) => [b.dataset.value, b.innerText.trim()])")
check("🍏 the design has five buttons: Hologramm, Dunkel, Hell, Glas dunkel, Glas hell (each with a colour sample)",
      [v for v, _ in seg_gl] == ["holo", "dark", "light", "glass", "glasslight"] and seg_gl[3][1] == "Glas dunkel" and seg_gl[4][1] == "Glas hell"
      and pgG.locator(".segBtns[data-for=setTheme] .segSwatch").count() == 5, seg_gl)
pgG.click(".segBtns[data-for=setTheme] button[data-value=glass]"); pgG.wait_for_timeout(1200)
check("🍏 a tap on „Glas dunkel“: dark plus glass, saved", html_gl() == ["dark", "dark"] and api("api/settings")["theme"] == "glass", [html_gl(), api("api/settings")["theme"]])
dlg_gl = pgG.evaluate("(() => { const s = getComputedStyle(document.getElementById('settingsDialog')); return [s.borderTopLeftRadius, s.backdropFilter]; })()")
check("🍏 the settings window itself is of glass (round corners, blur behind)", dlg_gl[0] == "24px" and "blur" in dlg_gl[1], dlg_gl)
pgG.keyboard.press("Escape"); pgG.wait_for_timeout(400)
pgG.wait_for_function("getComputedStyle(document.documentElement).getPropertyValue('--glass-wall').includes('data:image/jpeg')", timeout=15000)
wall_gl = pgG.evaluate("(() => { const k = Object.keys(localStorage).filter((x) => x.startsWith('fp.glassWall.')); return [getComputedStyle(document.body).backgroundImage.slice(0, 40), k]; })()")
check("🍏 behind the pages: the own house, blurred, taken from the 3D view and kept in this browser",
      wall_gl[0].startswith('url("data:image/jpeg') and any(k.endswith(".dark") for k in wall_gl[1]), wall_gl)
bar_gl = pgG.evaluate("(() => { const s = getComputedStyle(document.getElementById('tabBar')); return [s.borderTopLeftRadius, s.marginBottom]; })()")
check("🍏 the tab bar floats (round, a gap below)", bar_gl == ["26px", "10px"], bar_gl)
tile_gl = pgG.evaluate("(() => { const t = document.querySelector('#roomTiles .rtTile:not(.active)'); if (!t) return null; const s = getComputedStyle(t); return [s.backdropFilter, s.boxShadow.includes('inset'), s.borderTopLeftRadius]; })()")
check("🍏 the room tiles over the 3D view: firm glass, no blur and no outer shadow (they made a box in the strip, picture 7)",
      tile_gl is None or (tile_gl[0] == "none" and tile_gl[1] and tile_gl[2] == "20px"), tile_gl)
box_gl = pgG.evaluate("(() => { const s = getComputedStyle(document.getElementById('compass'), '::before'); return [s.content, s.borderTopLeftRadius]; })()")
check("🍏 search, microphone and compass in one box", box_gl[0] == '""' and box_gl[1] == "22px", box_gl)
pgG.click("#tabBar [data-tab=energy]"); pgG.wait_for_timeout(2500)
en_gl = pgG.evaluate("""(() => { const p = document.querySelector('#tabPages [data-page=energy]'), shown = (q) => { const e = p.querySelector(q); return e ? getComputedStyle(e).display !== 'none' : null; };
  return { chart: !!p.querySelector('.peChart'), area: shown('.peArea'), bar: shown('.peBar'), icon: shown('.peIcon'), ring: shown('.peRing'), gauge: shown('.pbGauge') }; })()""")
check("🍏 ⚡ Energie in glass: a soft area instead of the bars, icons on the tiles (ring and battery where the house has them)",
      not en_gl["chart"] or (en_gl["area"] and en_gl["bar"] in (False, None) and en_gl["icon"] and en_gl["ring"] in (True, None) and en_gl["gauge"] in (True, None)), en_gl)
check("🍏 the page itself lets the picture through", pgG.evaluate("getComputedStyle(document.getElementById('tabPages')).backgroundImage.startsWith('url(')"))
pick_gl("glasslight")
check("🍏 „Glas hell“: light plus glass", html_gl() == ["light", "light"] and api("api/settings")["theme"] == "glasslight", html_gl())
pick_gl("dark")
en_dk = pgG.evaluate("""(() => { const p = document.querySelector('#tabPages [data-page=energy]'), shown = (q) => { const e = p.querySelector(q); return e ? getComputedStyle(e).display !== 'none' : null; };
  return [shown('.peArea'), shown('.peBar'), shown('.peIcon'), document.documentElement.style.getPropertyValue('--glass-wall')]; })()""")
check("🍏 back to „Dunkel“: no glass, the bars again, no picture behind", html_gl() == ["dark", None] and en_dk[0] in (False, None) and en_dk[1] in (True, None)
      and en_dk[2] in (False, None) and en_dk[3] == "", en_dk)
pgG.goto(BASE + "?debug=1&mode=edit&ui=2"); pgG.wait_for_function("window.__fp && window.__fp.ready()", timeout=60000); pgG.wait_for_timeout(800)
pgG.click("#settingsBtn"); pgG.wait_for_timeout(600)
v2_gl = pgG.evaluate("[...document.querySelectorAll('#setTheme option')].map((o) => o.value)")
check("🍏 ✨ Neu: the settings have the same five designs", v2_gl == ["holo", "dark", "light", "glass", "glasslight"], v2_gl)
pgG.evaluate("localStorage.removeItem('fp.ui'); localStorage.removeItem('fp.ui.open')")   # the next parts get the classic panel
check("🍏 no errors on the page", not own_gl, own_gl[:3])
pgG.close()
set_setting("theme", st_gl.get("theme", "dark"))
post_gl("/_energy", {})
