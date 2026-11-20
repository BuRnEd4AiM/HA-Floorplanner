"""Beispielbilder für docs/ideen-5.21 (2026-11-20): Haus-Check, Erste Schritte und drei neue Vorschläge, nur fürs Foto in die echte Demo gemalt (mockup.js).
Aufruf (Demo vorher bauen: cd demo && npm ci && node build.mjs):
    python3 docs/ideen-5.21/make_pictures.py <ordner> [nummern …]
Die PNGs landen in <ordner>; danach mit to_jpg.py als JPG mit Nummer nach docs/ideen-5.21/."""
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
        c, pg = open_demo(b); shot(pg, 1, "1-hauscheck"); c.close()
    if want(2):
        c, pg = open_demo(b); shot(pg, 2, "2-erste-schritte"); c.close()
    if want(3):
        c, pg = open_demo(b, sky="12:30"); shot(pg, 3, "3-sonnenstrom"); c.close()
    if want(4):
        c, pg = open_demo(b, floor=0, cam=(-3, 13, 15)); shot(pg, 4, "4-leck"); c.close()
    if want(5):
        c, pg = open_demo(b, floor=0, cam=(-3, 13, 15)); shot(pg, 5, "5-steckbrief"); c.close()
    b.close()
