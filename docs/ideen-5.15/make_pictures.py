"""Beispielbilder für docs/ideen-5.15 (2026-11-17): neun neue Funktionen, nur fürs Foto in die echte Demo gemalt (mockup.js).
Aufruf (Demo vorher bauen: cd demo && npm ci && node build.mjs):
    python3 docs/ideen-5.15/make_pictures.py <ordner> [nummern …]
Die PNGs landen in <ordner>; danach mit to_jpg.py als JPG mit Nummer nach docs/ideen-5.15/."""
import base64
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ONLY = {int(a) for a in sys.argv[2:]}
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
MOCK = (Path(__file__).parent / "mockup.js").read_text()
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]
DESK = {"viewport": {"width": 1400, "height": 900}, "device_scale_factor": 2}


def open_demo(b, floor=1, sky="15:30", cam=(-4, 17, 19), **ctx):
    c = b.new_context(locale="de-DE", **(ctx or DESK))
    pg = c.new_page()
    pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
    pg.goto(demo + f"?debug=1&skytime={sky}&mode=live")
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000)
    pg.wait_for_timeout(1000)
    pg.evaluate(f"() => window.__fp.switchFloor({floor})"); pg.wait_for_timeout(1500)
    dx, h, dz = cam
    pg.evaluate(f"""() => {{ const fp = window.__fp, f = fp.layout.floors[{floor}];
      const xs = f.rooms.flatMap((r) => r.points.map((p) => p[0])), zs = f.rooms.flatMap((r) => r.points.map((p) => p[1]));
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2, y = fp.elev({floor});
      fp.camAt(cx + {dx}, y + {h}, cz + {dz}, cx + 1, cz); }}""")
    pg.wait_for_timeout(2500)
    pg.add_script_tag(content=MOCK)
    pg.wait_for_timeout(300)
    return c, pg


def shot(pg, n, name, **o):
    print(n, name, pg.evaluate(f"() => mockIdea({n}, {o!r})".replace("'", '"').replace("True", "true")))
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / f"{name}.png"))


def phone(b, name, body):
    """a phone lock screen with one message (an HTML page of its own)"""
    c = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="de-DE")
    pg = c.new_page()
    pg.set_content(f"""<html><body style="margin:0;height:844px;font-family:-apple-system,'Segoe UI',Inter,Roboto,sans-serif;color:#fff;
      background:linear-gradient(160deg,#1d2b4a,#3b2a52 55%,#a0584a)">
      <div style="text-align:center;padding-top:58px"><div style="font-size:18px;opacity:.85">Montag, 17. November</div>
      <div style="font-size:84px;font-weight:200;line-height:1.05">7:42</div></div>
      <div style="margin:26px 12px 0;background:rgba(245,245,250,.93);color:#111;border-radius:22px;padding:12px 14px;box-shadow:0 8px 30px rgba(0,0,0,.3)">
        <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#555"><span style="background:#18a0e0;color:#fff;border-radius:6px;padding:1px 5px">🏠</span>
          HOME ASSISTANT · 3D FLOORPLAN<span style="margin-left:auto">jetzt</span></div>
        {body}</div></body></html>""")
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / f"{name}.png"))
    c.close()


def want(n):
    return not ONLY or n in ONLY


with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    if want(1):
        c, pg = open_demo(b); shot(pg, 1, "1-sonne-haus"); shot(pg, 1, "1-sonne-einstellung", variant="settings"); c.close()
    if want(2):
        c, pg = open_demo(b); shot(pg, 2, "2-funk"); c.close()
    if want(3):
        c, pg = open_demo(b, floor=0, cam=(-3, 13, 15)); shot(pg, 3, "3-alarm-haus")
        q = pg.evaluate("() => mockIdea(3)"); pg.wait_for_timeout(500)
        x = max(230, min(1390 - 700, q["x"] - 350)); y = max(150, min(700 - 420, q["y"] - 230))
        img = base64.b64encode(pg.screenshot(clip={"x": x, "y": y, "width": 700, "height": 420})).decode()
        c.close()
        phone(b, "3-alarm-handy", f"""<div style="font-weight:700;font-size:16px;margin:6px 0 2px">💧 Wasser in der Waschküche!</div>
          <div style="font-size:14px">Wassermelder unter der Waschmaschine · Keller · seit 7:41</div>
          <img src="data:image/png;base64,{img}" style="width:100%;border-radius:12px;margin-top:8px;display:block">
          <div style="display:flex;gap:8px;margin-top:10px"><span style="flex:1;text-align:center;background:#e4e6ee;border-radius:10px;padding:8px;font-weight:600">🗺 Im Haus zeigen</span>
          <span style="flex:1;text-align:center;background:#e4e6ee;border-radius:10px;padding:8px;font-weight:600">🚰 Wasser zu</span></div>""")
    if want(4):
        c, pg = open_demo(b, sky="02:30"); shot(pg, 4, "4-stromfresser"); c.close()
    if want(5):
        c, pg = open_demo(b, sky="19:42"); shot(pg, 5, "5-urlaubslicht"); c.close()
    if want(6):
        c, pg = open_demo(b, sky="02:30"); shot(pg, 6, "6-nachtlicht"); c.close()
    if want(7):
        c, pg = open_demo(b); shot(pg, 7, "7-wartung"); c.close()
    if want(8):
        c, pg = open_demo(b, floor=2); shot(pg, 8, "8-gaeste"); c.close()
    if want(9):
        c, pg = open_demo(b); pg.evaluate("() => mockIdea(9)"); pg.wait_for_timeout(600)
        img = base64.b64encode(pg.screenshot(clip={"x": 380, "y": 230, "width": 640, "height": 380})).decode()
        c.close()
        bar = lambda name, heat, power: f"""<div style="display:grid;grid-template-columns:96px 1fr 58px;gap:6px;align-items:center;font-size:13px;margin:3px 0">
          <span>{name}</span><span style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:#e4e6ee">
          <i style="width:{heat}%;background:#e0583a"></i><i style="width:{power}%;background:#f2b416"></i></span><b style="text-align:right">{(heat + power) * 0.6:.0f} €</b></div>"""
        phone(b, "9-monatsbericht", f"""<div style="font-weight:700;font-size:16px;margin:6px 0 2px">📊 Dein Haus im Oktober</div>
          <div style="font-size:14px">🔥 Heizung 103 € · ⚡ Strom 79 € · 12 % weniger als Oktober 2025</div>
          <img src="data:image/png;base64,{img}" style="width:100%;border-radius:12px;margin-top:8px;display:block">
          <div style="margin-top:8px">{bar('Wohnzimmer', 68, 37)}{bar('Küche', 30, 52)}{bar('Bad', 38, 7)}{bar('Büro', 20, 32)}{bar('Schlafzimmer', 15, 5)}</div>
          <div style="font-size:12px;color:#555;margin-top:4px">■ <span style="color:#e0583a">Heizung</span> ■ <span style="color:#c49000">Strom</span> · Wohnzimmer war 1,5° wärmer als eingestellt</div>""")
    b.close()
