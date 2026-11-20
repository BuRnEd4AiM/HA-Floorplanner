"""Beispielbilder fürs Handy wie eine App (docs/ideen-5.21, 2026-11-20, der Besitzer: „eine bessere ansicht fürs handy das es nicht so
selbstgebaut wirkt … mehr nach einer app aussieht … intuitiver“): heute (die echte Demo am Handy) und drei neue Bildschirme als
HTML-Entwurf (Start, Raum, Haus in 3D). Aufruf (Demo vorher bauen): python3 docs/ideen-5.21/app_mock.py <ordner>"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
PHONE = {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2, "is_mobile": True, "has_touch": True, "locale": "de-DE"}

CSS = """
*{box-sizing:border-box} body{margin:0;width:390px;height:844px;overflow:hidden;font-family:-apple-system,'SF Pro Text','Segoe UI',Inter,Roboto,sans-serif;
 background:#0d1117;color:#f2f5f9} .st{height:44px;display:flex;justify-content:space-between;align-items:center;padding:0 26px;font-weight:600;font-size:15px}
.wrap{padding:4px 18px 110px;height:800px;overflow:hidden} h1{font-size:30px;margin:6px 0 2px;letter-spacing:-.02em} .sub{color:#8b97a8;font-size:14px}
.chips{display:flex;gap:8px;margin:14px 0 4px;overflow:hidden} .chip{flex:none;padding:9px 13px;border-radius:14px;background:#1a212c;font-size:13.5px;font-weight:600}
.chip.on{background:#3a2f12;color:#ffd36b} .chip.warn{background:#3a1d1a;color:#ffaa9e} .chip.ok{background:#14301f;color:#8ff0b4}
.sec{display:flex;justify-content:space-between;align-items:baseline;margin:20px 2px 10px} .sec b{font-size:19px} .sec span{color:#4ea1ff;font-size:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px} .room{background:#1a212c;border-radius:20px;padding:14px;height:112px;position:relative}
.room .ic{font-size:26px} .room b{display:block;font-size:16px;margin-top:6px} .room small{color:#8b97a8;font-size:13px}
.room.lit{background:linear-gradient(150deg,#3b3114,#1a212c 70%)} .room .tg{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;
 background:#2a3342;display:flex;align-items:center;justify-content:center;font-size:16px} .room.lit .tg{background:#ffcf4a;color:#2a1c00}
.house{height:150px;border-radius:22px;background:#1a212c;overflow:hidden;position:relative;margin-top:14px} .house img{width:100%;height:100%;object-fit:cover}
.house .lab{position:absolute;left:12px;bottom:10px;background:rgba(13,17,23,.75);padding:6px 10px;border-radius:12px;font-size:13px;font-weight:600}
.tabs{position:absolute;left:0;right:0;bottom:0;height:86px;background:rgba(18,23,31,.96);border-top:1px solid #222b38;display:flex;justify-content:space-around;padding-top:9px}
.tabs div{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;color:#7d889a;width:70px} .tabs i{font-style:normal;font-size:23px;filter:grayscale(1);opacity:.7}
.tabs .on{color:#4ea1ff} .tabs .on i{filter:none;opacity:1}
.big{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px} .tile{background:#1a212c;border-radius:18px;padding:12px;height:96px;display:flex;flex-direction:column;justify-content:space-between}
.tile.on{background:#f4f1e8;color:#1a1300} .tile.on small{color:#6b5a2a} .tile b{font-size:14px} .tile small{font-size:12px;color:#8b97a8} .tile span{font-size:22px}
.card{background:#1a212c;border-radius:20px;padding:14px;margin-top:12px} .row{display:flex;justify-content:space-between;align-items:center}
.slider{height:46px;border-radius:14px;background:#2a3342;margin-top:10px;position:relative;overflow:hidden} .slider i{position:absolute;left:0;top:0;bottom:0;background:#4ea1ff}
.slider span{position:absolute;left:14px;top:13px;font-weight:600}
.ring{width:150px;height:150px;border-radius:50%;margin:6px auto;background:conic-gradient(#ff8a3d 0 62%,#2a3342 62% 100%);display:flex;align-items:center;justify-content:center}
.ring div{width:122px;height:122px;border-radius:50%;background:#1a212c;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring b{font-size:34px} .pm{display:flex;justify-content:center;gap:40px;margin-top:4px} .pm span{width:44px;height:44px;border-radius:50%;background:#2a3342;display:flex;align-items:center;justify-content:center;font-size:24px}
.back{color:#4ea1ff;font-size:16px;margin:2px 0 6px}
.sheet{position:absolute;left:0;right:0;bottom:86px;background:#151b24;border-radius:24px 24px 0 0;padding:10px 18px 14px;box-shadow:0 -10px 30px rgba(0,0,0,.5)}
.grab{width:40px;height:5px;border-radius:3px;background:#3a4556;margin:0 auto 10px}
.floors{position:absolute;top:58px;left:14px;display:flex;flex-direction:column;gap:8px} .floors span{background:rgba(26,33,44,.9);padding:8px 12px;border-radius:12px;font-size:13px;font-weight:600}
.floors span.on{background:#4ea1ff;color:#04203f}
"""
TABS = lambda on: f"""<div class="tabs">{''.join(f'<div class="{"on" if k == on else ""}"><i>{i}</i>{t}</div>' for k, i, t in
  [("start", "🏠", "Start"), ("rooms", "🚪", "Räume"), ("house", "🧊", "3D-Haus"), ("energy", "⚡", "Energie"), ("more", "☰", "Mehr")])}</div>"""
ST = '<div class="st"><span>19:42</span><span>▂▄▆ 🔋</span></div>'


def page(b, name, html):
    c = b.new_context(**PHONE); pg = c.new_page()
    pg.set_content(f"<html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><style>{CSS}</style></head><body>{html}</body></html>")
    pg.wait_for_timeout(400); pg.screenshot(path=str(OUT / f"{name}.png")); c.close()


with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    # heute: die echte Demo am Handy
    c = b.new_context(**PHONE); pg = c.new_page()
    pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
    pg.goto(demo + "?debug=1&skytime=19:42&mode=live"); pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000); pg.wait_for_timeout(3000)
    pg.screenshot(path=str(OUT / "6-handy-heute.png"))
    house = pg.screenshot(type="jpeg", quality=70, clip={"x": 0, "y": 150, "width": 390, "height": 380})
    pg.click("#tabBar [data-tab=today]") if pg.is_visible("#tabBar [data-tab=today]") else None
    pg.wait_for_timeout(1500); pg.screenshot(path=str(OUT / "6b-handy-heute-seite.png")); c.close()
    import base64
    img = "data:image/jpeg;base64," + base64.b64encode(house).decode()
    room = lambda ic, n, s, lit=False: f'<div class="room{" lit" if lit else ""}"><div class="ic">{ic}</div><div class="tg">{"💡" if lit else "⏻"}</div><b>{n}</b><small>{s}</small></div>'
    page(b, "7-app-start", f"""{ST}<div class="wrap"><div class="sub">Donnerstag, 20. November</div><h1>Guten Abend 👋</h1>
      <div class="chips"><span class="chip on">💡 11 an</span><span class="chip ok">🛡 Alarm aus</span><span class="chip warn">🔋 1 leer</span><span class="chip">🌡 21,4°</span></div>
      <div class="house"><img src="{img}"><div class="lab">🧊 Haus in 3D ansehen ›</div></div>
      <div class="sec"><b>Räume</b><span>Alle</span></div>
      <div class="grid">{room('🛋', 'Wohnzimmer', '21,4° · 5 Lichter an', True)}{room('🍳', 'Küche', '20,8° · aus')}{room('🛏', 'Schlafzimmer', '18,5° · aus')}
      {room('🛁', 'Bad', '22,1° · 1 Licht an', True)}</div></div>{TABS("start")}""")
    tile = lambda ic, n, s, on=False: f'<div class="tile{" on" if on else ""}"><span>{ic}</span><div><b>{n}</b><br><small>{s}</small></div></div>'
    page(b, "8-app-raum", f"""{ST}<div class="wrap"><div class="back">‹ Räume</div><h1>🛋 Wohnzimmer</h1><div class="sub">21,4 °C · 48 % · 920 ppm</div>
      <div class="sec"><b>Licht</b><span>Alle aus</span></div>
      <div class="big">{tile('💡', 'Decke', '70 %', True)}{tile('🛋', 'Stehlampe', '100 %', True)}{tile('✨', 'LED Sofa', '45 %', True)}
      {tile('📺', 'TV-Licht', 'aus')}{tile('🔷', 'Nanoleaf', '80 %', True)}{tile('🎬', 'Szene', 'Gemütlich')}</div>
      <div class="card"><div class="row"><b>🪟 Rollladen</b><span class="sub">60 % offen</span></div><div class="slider"><i style="width:60%"></i><span>60 %</span></div></div>
      <div class="card"><div class="row"><b>🌡 Heizung</b><span class="sub">heizt</span></div>
        <div class="ring"><div><b>22°</b><small class="sub">jetzt 21,4°</small></div></div><div class="pm"><span>−</span><span>+</span></div></div></div>{TABS("rooms")}""")
    page(b, "9-app-haus", f"""{ST}<div style="position:absolute;top:44px;left:0;right:0;bottom:86px;background:url('{img}') center/cover"></div>
      <div class="floors"><span>Dach</span><span>OG</span><span class="on">EG</span><span>Keller</span></div>
      <div class="sheet"><div class="grab"></div><div class="row"><b style="font-size:18px">🛋 Wohnzimmer</b><span class="sub">21,4° · 5 an</span></div>
        <div class="big" style="margin-top:10px">{tile('💡', 'Licht', '5 an', True)}{tile('🪟', 'Rollo', '60 %')}{tile('🌡', 'Heizung', '22°')}</div>
        <div class="sub" style="margin-top:10px;text-align:center">Raum im Haus antippen · nach oben ziehen für mehr</div></div>{TABS("house")}""")
    b.close()
