"""Beispielbilder „so könnte es werden“ für die Handy-App (docs/ideen-5.22, 2026-11-20, der Besitzer: „ich sehe nirgends wo ich am handy
sagen kann welches gebäude ich auswählen kann“; dazu Claudes Vorschläge zu Einstellungen, ☰-Menü, 3D-Haus und den Chips). HTML-Entwurf
mit dem Stil von docs/ideen-5.21/app_mock.py. Aufruf: python3 docs/ideen-5.22/mock_next.py <ordner>"""
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
CSS = re.search(r'CSS = """(.*?)"""', (Path(__file__).parent.parent / "ideen-5.21" / "app_mock.py").read_text(), re.S).group(1) + """
.hsw{display:inline-flex;align-items:center;gap:8px;background:#1a212c;border-radius:14px;padding:8px 12px;font-weight:600;font-size:15px;margin:2px 0 6px}
.hsw small{color:#8b97a8;font-weight:500} .sheet.tall{bottom:0;padding-bottom:30px} .dim{position:absolute;inset:0;background:rgba(0,0,0,.5)}
.it{display:flex;align-items:center;gap:12px;padding:13px 12px;border-radius:14px;background:#1a212c;margin:6px 0;font-size:16px}
.it .ic{width:30px;text-align:center;font-size:20px} .it span.t{flex:1} .it .r{color:#8b97a8;font-size:14px} .it.on{outline:2px solid #4ea1ff;background:#16263d}
.it .chk{color:#4ea1ff;font-weight:700} .grp{color:#8b97a8;font-size:13px;text-transform:uppercase;letter-spacing:.05em;margin:16px 4px 4px}
.sw{width:50px;height:30px;border-radius:15px;background:#3a4556;position:relative} .sw.on{background:#34c759} .sw i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff}
.sw.on i{left:23px} .seg{display:flex;background:#2a3342;border-radius:10px;padding:2px} .seg span{flex:1;text-align:center;padding:6px 8px;border-radius:8px;font-size:13px}
.seg span.on{background:#4ea1ff;color:#04203f;font-weight:700} .search{background:#1a212c;border-radius:12px;padding:10px 12px;color:#8b97a8;margin:8px 0 4px}
.top3d{position:absolute;top:44px;left:12px;right:12px;display:flex;gap:8px;align-items:center}
.top3d .pill{background:rgba(26,33,44,.92);border-radius:14px;padding:9px 12px;font-weight:600;font-size:14px} .top3d .grow{flex:1}
.fab{position:absolute;right:14px;bottom:100px;display:flex;flex-direction:column;gap:10px} .fab span{width:46px;height:46px;border-radius:50%;background:rgba(26,33,44,.95);display:flex;align-items:center;justify-content:center;font-size:20px}
.bg3d{position:absolute;top:44px;left:0;right:0;bottom:86px;background:radial-gradient(circle at 50% 45%,#2a3a55,#0d1117 70%)}
.bg3d::after{content:'🏠';position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-size:150px;opacity:.85}
"""
TABS = lambda on: f"""<div class="tabs">{''.join(f'<div class="{"on" if k == on else ""}"><i>{i}</i>{t}</div>' for k, i, t in
  [("start", "🏠", "Start"), ("rooms", "🚪", "Räume"), ("house", "🧊", "3D-Haus"), ("energy", "⚡", "Energie"), ("more", "☰", "Mehr")])}</div>"""
ST = '<div class="st"><span>19:42</span><span>▂▄▆ 🔋</span></div>'
room = lambda ic, n, s, lit=False: f'<div class="room{" lit" if lit else ""}"><div class="ic">{ic}</div><div class="tg">{"💡" if lit else "⏻"}</div><b>{n}</b><small>{s}</small></div>'
it = lambda ic, t, r="", cls="": f'<div class="it {cls}"><span class="ic">{ic}</span><span class="t">{t}</span><span class="r">{r}</span></div>'
START = f"""<div class="wrap"><div class="hsw">🏠 Demo-Haus <small>· Haupthaus ▾</small></div><div class="sub">Freitag, 20. November</div><h1>Guten Abend 👋</h1>
  <div class="chips"><span class="chip on">💡 11 an</span><span class="chip ok">🛡 Alarm aus</span><span class="chip warn">🪟 3 offen</span><span class="chip warn">🔋 2</span></div>
  <div class="sec"><b>Räume</b><span>Alle</span></div><div class="grid">{room('🛋', 'Wohnzimmer', '21,4° · 5 an', True)}{room('💻', 'Büro', '23,0° · 1 an', True)}
  {room('🍳', 'Küche', '22,1° · aus')}{room('🛏', 'Schlafzimmer', '18,6° · aus')}</div></div>"""

with sync_playwright() as p:
    b = p.chromium.launch()
    def page(name, html):
        c = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, locale="de-DE"); pg = c.new_page()
        pg.set_content(f'<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>{CSS}</style></head><body>{html}</body></html>')
        pg.wait_for_timeout(300); pg.screenshot(path=str(OUT / f"{name}.png")); c.close()
    # A: house and building at the top of Start
    page("n1-start-haus", f"{ST}{START}{TABS('start')}")
    page("n2-haus-waehlen", f"""{ST}{START}{TABS('start')}<div class="dim"></div><div class="sheet tall"><div class="grab"></div>
      <h2 style="margin:4px 4px 6px">Haus und Gebäude</h2>
      <div class="grp">Häuser</div>{it('🏠', 'Demo-Haus', '✓', 'on')}{it('🏡', 'Nachbarhaus', '')}{it('🏖', 'Ferienhaus', '')}
      <div class="grp">Gebäude im Demo-Haus</div>{it('🏘', 'Alle Gebäude', '')}{it('🏠', 'Haupthaus', '✓', 'on')}{it('🏚', 'Anbau', '')}{it('🚗', 'Garage', '')}</div>""")
    # B: settings like a phone's settings
    page("n3-einstellungen-liste", f"""{ST}<div class="wrap"><div class="back">‹ Mehr</div><h1>Einstellungen</h1><div class="search">🔍 Einstellung suchen</div>
      <div class="grp">Häufig</div>{it('🎨', 'Design und Sprache', 'Dunkel · Deutsch ›')}{it('⭐', 'Schnellzugriff', '›')}{it('🚨', 'Warnungen & Alarm', '›')}
      <div class="grp">Ansicht</div>{it('🧊', '3D-Bild', 'Schön ›')}{it('🏷', 'Was im Bild erscheint', '›')}{it('🏢', 'Etagen', '›')}{it('🌳', 'Haus außen', '›')}
      <div class="grp">Haus</div>{it('👥', 'Benutzer & Tablets', '3 ›')}{it('📱', 'Wandtablet', '›')}{it('🗂', 'Reiter unten', '›')}</div>{TABS('more')}""")
    page("n4-einstellungen-gruppe", f"""{ST}<div class="wrap"><div class="back">‹ Einstellungen</div><h1>Design und Sprache</h1>
      <div class="card"><div class="row"><b>Design</b></div><div class="seg" style="margin-top:10px"><span>Hell</span><span class="on">Dunkel</span><span>Hologramm</span></div></div>
      <div class="card"><div class="row"><b>Sprache</b><span class="sub">Deutsch ›</span></div></div>
      <div class="card"><div class="row"><b>Einheiten</b></div><div class="seg" style="margin-top:10px"><span class="on">Metrisch</span><span>Imperial</span></div></div>
      <div class="card"><div class="row"><span>Neue Version selbst laden</span><div class="sw on"><i></i></div></div></div>
      <div class="card"><div class="row"><span>Große Schrift</span><div class="sw"><i></i></div></div></div></div>{TABS('more')}""")
    # C: a slim 3D house
    page("n5-3d-schlank", f"""{ST}<div class="bg3d"></div><div class="top3d"><span class="pill">🏢 Erdgeschoss ▾</span><span class="grow"></span><span class="pill">⚠ 2</span><span class="pill">🔍</span></div>
      <div class="fab"><span>👁</span><span>🎨</span><span>🎬</span></div>{TABS('house')}""")
    page("n6-3d-ansicht", f"""{ST}<div class="bg3d"></div><div class="top3d"><span class="pill">🏢 Erdgeschoss ▾</span><span class="grow"></span><span class="pill">⚠ 2</span><span class="pill">🔍</span></div>
      {TABS('house')}<div class="dim"></div><div class="sheet tall"><div class="grab"></div><h2 style="margin:4px">Ansicht</h2>
      <div class="grp">Farben</div><div class="seg"><span class="on">Normal</span><span>Temp.</span><span>Feuchte</span><span>CO₂</span><span>Strom</span></div>
      <div class="grp">Bild</div>{it('🧱', 'Wände durchsichtig', '<div class="sw on"><i></i></div>')}{it('🏷', 'Raum-Schilder', '<div class="sw on"><i></i></div>')}{it('🏢', 'Etagen auseinander', '<div class="sw"><i></i></div>')}</div>""")
    # D: the ☰ menu as a list
    page("n7-menue", f"""{ST}<div class="bg3d"></div>{TABS('house')}<div class="dim"></div><div class="sheet tall"><div class="grab"></div><h2 style="margin:4px">Menü</h2>
      {it('✏️', 'Bearbeiten', '›')}{it('🏠', 'Haus und Gebäude', 'Demo-Haus ›')}{it('🎬', 'Anleitung (Videos)', '›')}{it('💾', 'Backup', '›')}{it('🛡', 'Sicherheit', '›')}
      {it('⚙️', 'Einstellungen', '›')}<div class="sub" style="text-align:center;margin-top:8px">Version 5.22.0 · alles aktuell ✓</div></div>""")
    # E: a chip opens its list from below
    page("n8-chip-liste", f"""{ST}{START}{TABS('start')}<div class="dim"></div><div class="sheet tall"><div class="grab"></div><h2 style="margin:4px">🪟 3 offen</h2>
      {it('🚪', 'Tür Wohnzimmer–Küche', 'offen')}{it('🪟', 'Fenster Terrasse', 'gekippt')}{it('🪟', 'Fenster Wohnzimmer', 'offen')}
      <div class="sub" style="margin:10px 4px">Antippen zeigt es im Haus</div></div>""")
    b.close()
