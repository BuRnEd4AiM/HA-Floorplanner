"""Beispielbilder: die Seite eines Raums am Handy mit dem Raum, der sich oben dreht – verschiedene Arten (docs/ideen-5.23, 2026-11-20, der
Besitzer: „Beispielbilder … dass sich der Raum oben drüber dreht, dass es auch so ein bisschen mehr eingebettet ist … verschiedene Arten“).
Die echte Demo (5.23.1, Raum-Seite), je Variante etwas CSS und ein paar Elemente nur fürs Foto. Aufruf (Demo vorher bauen):
    python3 docs/ideen-5.23/room_variants.py <ordner>"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
PHONE = {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2, "is_mobile": True, "has_touch": True, "locale": "de-DE",
         "timezone_id": "Europe/Berlin"}
BG = "#0d1117"
# (name, css, html over it, js)
VARIANTS = [
    ("a-heute", "", "", ""),
    ("b-karte", f"""body.appRoom #roomPanel {{ z-index: 7 !important; top: 46vh !important; }}
      #mkFrame {{ position: fixed; top: 60px; left: 14px; right: 14px; height: calc(46vh - 72px); border-radius: 24px; box-shadow: 0 0 0 2000px {BG};
        outline: 1px solid rgba(255,255,255,.12); pointer-events: none; z-index: 4; }}
      #mkTitle {{ position: fixed; top: calc(46vh - 56px); left: 28px; z-index: 6; font: 700 15px system-ui; color: #fff; background: rgba(13,17,23,.7);
        padding: 6px 10px; border-radius: 10px; }}""",
     '<div id="mkFrame"></div><div id="mkTitle">🔄 dreht sich · antippen zum Drehen</div>', ""),
    ("c-gross-verlauf", f"""body.appRoom #roomPanel {{ z-index: 7 !important; top: 48vh !important; background: {BG} !important; border: 0 !important; box-shadow: none !important; }}
      body.appRoom #roomPanel .rp-head {{ display: none !important; }}
      #mkFade {{ position: fixed; left: 0; right: 0; top: calc(48vh - 110px); height: 110px; background: linear-gradient(to bottom, transparent, {BG});
        z-index: 5; pointer-events: none; }}
      #mkName {{ position: fixed; left: 20px; top: calc(48vh - 74px); z-index: 6; color: #fff; font: 800 30px system-ui; text-shadow: 0 2px 10px #000; }}
      #mkName small {{ display: block; font: 600 14px system-ui; color: #c9d4e3; }}""",
     '<div id="mkFade"></div><div id="mkName">🛋 Wohnzimmer<small>21,4 °C · 48 % · 5 Lichter an</small></div>', ""),
    ("d-kreis", f"""body.appRoom #roomPanel {{ z-index: 7 !important; top: 40vh !important; }}
      #mkFrame {{ position: fixed; top: 64px; left: 50%; transform: translateX(-50%); width: min(260px, calc(40vh - 80px)); aspect-ratio: 1; border-radius: 50%;
        box-shadow: 0 0 0 2000px {BG}, inset 0 0 0 3px #4ea1ff; pointer-events: none; z-index: 4; }}""",
     '<div id="mkFrame"></div>', ""),
    ("e-klein", f"""body.appRoom #roomPanel {{ z-index: 7 !important; top: 30vh !important; }}
      #mkFrame {{ position: fixed; top: 60px; left: 14px; right: 14px; height: calc(30vh - 70px); border-radius: 20px; box-shadow: 0 0 0 2000px {BG};
        outline: 1px solid rgba(255,255,255,.12); pointer-events: none; z-index: 4; }}
      #mkGrip {{ position: fixed; top: calc(30vh - 18px); left: 50%; transform: translateX(-50%); z-index: 6; color: #8b97a8; font: 600 12px system-ui; }}""",
     '<div id="mkFrame"></div><div id="mkGrip">⌄ ziehen für größer</div>', ""),
    ("f-gross", f"""body.appRoom #roomPanel {{ z-index: 7 !important; top: 66vh !important; }}
      #mkFrame {{ position: fixed; top: 60px; left: 14px; right: 14px; height: calc(66vh - 72px); border-radius: 24px; box-shadow: 0 0 0 2000px {BG};
        outline: 1px solid rgba(255,255,255,.12); pointer-events: none; z-index: 4; }}
      #mkGrip {{ position: fixed; top: calc(66vh - 18px); left: 50%; transform: translateX(-50%); z-index: 6; color: #8b97a8; font: 600 12px system-ui; }}""",
     '<div id="mkFrame"></div><div id="mkGrip">⌃ ziehen für mehr Knöpfe</div>', ""),
    ("g-von-oben", f"""body.appRoom #roomPanel {{ z-index: 7 !important; top: 46vh !important; }}
      #mkFrame {{ position: fixed; top: 60px; left: 14px; right: 14px; height: calc(46vh - 72px); border-radius: 24px; box-shadow: 0 0 0 2000px {BG};
        outline: 1px solid rgba(255,255,255,.12); pointer-events: none; z-index: 4; }}
      #mkTitle {{ position: fixed; top: calc(46vh - 56px); left: 28px; z-index: 6; font: 700 14px system-ui; color: #fff; background: rgba(13,17,23,.7); padding: 6px 10px; border-radius: 10px; }}""",
     '<div id="mkFrame"></div><div id="mkTitle">🗺 von oben · Lampen antippen</div>',
     """() => { const fp = window.__fp, c = fp.camera ? fp.camera() : null; }"""),
]

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    for name, css, html, js in VARIANTS:
        c = b.new_context(**PHONE); pg = c.new_page()
        pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
        pg.goto(demo + "?debug=1&skytime=13:00"); pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000); pg.wait_for_timeout(2500)
        pg.tap("#tabBar [data-tab=rooms]"); pg.wait_for_timeout(700)
        pg.locator("[data-page=rooms] .apRoom", has_text="Wohnzimmer").first.tap(); pg.wait_for_timeout(1500)
        if css:
            pg.add_style_tag(content=css)
        if html:
            pg.evaluate("(h) => { const d = document.createElement('div'); d.id = 'mkLayer'; d.innerHTML = h; document.body.append(d); }", html)
        if name == "g-von-oben":                     # the camera straight above the room, not turning
            pg.evaluate("""() => { const fp = window.__fp, f = fp.layout.floors[fp.floorIdx()], r = f.rooms.find((x) => x.name === 'Wohnzimmer');
              const xs = r.points.map((q) => q[0]), zs = r.points.map((q) => q[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
              fp.camAt(cx, fp.elev(fp.floorIdx()) + 13, cz + 0.6, cx, cz); }""")
            pg.evaluate("() => { const b = document.querySelector('#appBack'); }")
            pg.wait_for_timeout(300)
            pg.evaluate("() => { try { window.__fp.controls && (window.__fp.controls().autoRotate = false); } catch (e) {} }")
        pg.evaluate("() => window.dispatchEvent(new Event('resize'))")
        pg.wait_for_timeout(2500)
        pg.screenshot(path=str(OUT / f"{name}.png")); c.close()
        print(name)
    b.close()
