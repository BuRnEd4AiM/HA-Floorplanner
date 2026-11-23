"""Beispielbilder für docs/ideen-5.33 (2026-11-23): eigene Bildkarten fürs Handy, nur fürs Foto in die echte Demo gemalt (mockup.js).
Aufruf (Demo vorher bauen: cd demo && npm ci && node build.mjs):
    python3 docs/ideen-5.33/make_pictures.py <ordner> [nummern …]
Die PNGs landen in <ordner>; danach mit to_jpg.py als JPG mit Nummer nach docs/ideen-5.33/."""
import base64
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
import cardpics  # noqa: E402

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ONLY = {int(a) for a in sys.argv[2:]}
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
MOCK = (Path(__file__).parent / "mockup.js").read_text()
ARGS = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]
OPEN_SETTING = """(s) => { const el = document.querySelector(s), g = el?.closest('details.setGroup');
  for (let d = el?.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
  if (g) { g.open = true; g.closest('dialog')?.dispatchEvent(new CustomEvent('sg-show', { detail: g.dataset.group })); }
  el?.dispatchEvent(new CustomEvent('sg-reveal', { bubbles: true })); }"""


def uri(png, kind="png"):
    return f"data:image/{kind};base64," + base64.b64encode(png).decode()


def open_demo(b, sky="15:30", vp=(1400, 900), mode="live"):
    c = b.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=2, locale="de-DE")
    pg = c.new_page()
    pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
    pg.goto(demo + f"?debug=1&skytime={sky}&mode={mode}", timeout=180000)
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=180000)
    pg.wait_for_timeout(1200)
    pg.add_script_tag(content=MOCK)
    return c, pg


def still(b, sky, floor, cam):
    """a „camera picture“: the 3D house of the demo from where a camera would hang, only the 3D picture"""
    c = b.new_context(viewport={"width": 1400, "height": 900}, locale="de-DE")
    pg = c.new_page()
    pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
    pg.goto(demo + f"?debug=1&mode=live&skytime={sky}", timeout=180000)
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=180000)
    pg.wait_for_timeout(800)
    pg.evaluate(f"() => window.__fp.switchFloor({floor})"); pg.wait_for_timeout(1200)
    x, y, z, tx, tz = cam
    pg.evaluate(f"() => {{ const fp = window.__fp; fp.camAt({x}, fp.elev({floor}) + {y}, {z}, {tx}, {tz}); const s = fp.settings(); if (s) s.seeThrough = false; }}")
    pg.add_style_tag(content="body * { visibility: hidden !important; } canvas, canvas * { visibility: visible !important; }")
    pg.wait_for_timeout(3000)
    png = pg.screenshot(clip={"x": 220, "y": 120, "width": 960, "height": 600}, type="jpeg", quality=85)
    lay = pg.evaluate("JSON.parse(JSON.stringify(window.__fp.layout))")
    c.close()
    return png, lay


def telegram(b, name, card_png, caption, clock, earlier=""):
    """the card as it arrives: a Telegram chat with the house's own bot"""
    c = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="de-DE")
    pg = c.new_page()
    img = base64.b64encode(card_png).decode()
    pg.set_content(f"""<html><body style="margin:0;height:844px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Inter,sans-serif;
      background:#9bbf8a;background-image:radial-gradient(#ffffff30 2px, transparent 2px),linear-gradient(160deg,#b9d7a2,#86b58f 60%,#6fa08c);background-size:26px 26px,100% 100%">
      <div style="background:#fff;padding:8px 12px 9px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px #0002">
        <span style="font-size:26px;color:#3390ec">‹</span>
        <span style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#4fb3f6,#2a7fd4);display:grid;place-items:center;font-size:21px">🏠</span>
        <div><div style="font-weight:700;font-size:16px">Haus-Bot</div><div style="font-size:13px;color:#8a8f98">Bot</div></div></div>
      <div style="padding:10px 10px 0;display:flex;flex-direction:column;gap:8px">
        <div style="align-self:center;background:#0000002b;color:#fff;font-size:13px;font-weight:600;padding:3px 10px;border-radius:999px">Heute</div>
        {earlier}
        <div style="align-self:flex-start;max-width:318px;background:#fff;border-radius:14px 14px 14px 4px;overflow:hidden;box-shadow:0 1px 2px #0002">
          <img src="data:image/png;base64,{img}" style="width:318px;display:block">
          <div style="padding:7px 10px 6px;font-size:15px;line-height:1.35">{caption}<span style="float:right;margin:6px 0 0 10px;font-size:12px;color:#a0a6ae">{clock}</span></div>
        </div>
      </div>
      <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;padding:10px 12px 26px;display:flex;align-items:center;gap:10px;color:#9aa0a8;font-size:16px">
        <span style="font-size:22px">☺</span><span style="flex:1">Nachricht</span><span style="font-size:20px">📎</span><span style="font-size:20px">🎤</span></div>
    </body></html>""")
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / f"{name}.png"))
    c.close()


def want(n):
    return not ONLY or n in ONLY


with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    cam_door, lay = still(b, "21:47", 1, (8.6, 2.8, -9.5, 11.0, 0.0))
    cam_wash, _ = still(b, "07:41", 0, (9.6, 2.3, 6.8, 1.0, 4.8))
    I = {"cam_door": uri(cam_door, "jpeg"), "cam_wash": uri(cam_wash, "jpeg"),
         "plan_wash": uri(cardpics.plan(lay, 0, room="Waschküche", ring=(8.4, 5.9, "WASSER"), ratio=0.55)),
         "plan_eg": uri(cardpics.plan(lay, 1, theme="dark", ratio=0.62, marks=[
             (8.0, 0.0, (226, 62, 52), "OFFEN"), (1.5, 7.0, (226, 62, 52), "OFFEN"), (5.2, 3.9, (242, 180, 22), "AN")])),
         "plan_door": uri(cardpics.plan(lay, 1, theme="dark", ring=(12.5, 0.3, "TÜR"), ratio=0.62))}
    ARG = json.dumps(I)

    # the three cards as pictures (as the add-on would send them)
    c, pg = open_demo(b)
    cards = {}
    for k in ("wasser", "florian", "abend"):
        pg.evaluate(f"""async (I) => {{ document.querySelectorAll('.fpCardMock').forEach((x) => x.remove());
          const c = mockCard('{k}', I); c.style.position = 'fixed'; c.style.left = '10px'; c.style.top = '10px'; c.style.zIndex = 99999; c.style.borderRadius = '0'; document.body.append(c);
          await Promise.all([...c.querySelectorAll('img')].map((i) => i.complete ? null : new Promise((r) => {{ i.onload = r; }}))); }}""", I)
        pg.wait_for_timeout(300)
        cards[k] = pg.locator(".fpCardMock").screenshot()
        (OUT / f"karte-{k}.png").write_bytes(cards[k])
    pg.evaluate("document.querySelectorAll('.fpCardMock').forEach((x) => x.remove())")
    c.close()

    for n, name, vp in [(1, "1-ort", (1400, 900)), (2, "2-bausteine", (1400, 900)), (3, "3-bausteine-handy", (390, 844)),
                        (4, "4-freie-flaeche", (1400, 900)), (5, "5-vorlagen", (1400, 900))]:
        if want(n):
            c, pg = open_demo(b, vp=vp)
            print(n, name, pg.evaluate(f"(I) => mockIdea({n}, I)", I))
            pg.wait_for_timeout(900)
            pg.screenshot(path=str(OUT / f"{name}.png"))
            c.close()
    if want(6):
        telegram(b, "6-handy-wasser", cards["wasser"], "💧 <b>Wasser erkannt:</b> Waschmaschine · Keller · Waschküche", "07:41",
                 '<div style="align-self:flex-start;background:#fff;border-radius:14px;padding:7px 10px;font-size:15px;max-width:290px">✅ Test: die Alarm-Benachrichtigung vom 3D Floorplan funktioniert. <span style="font-size:12px;color:#a0a6ae">07:12</span></div>')
    if want(7):
        telegram(b, "7-handy-florian1", cards["florian"], "🚪 <b>Florian 1:</b> Bewegung an der Haustür", "21:47")
    if want(8):
        telegram(b, "8-handy-gute-nacht", cards["abend"], "🌙 <b>Gute Nacht:</b> 2 Fenster offen, 1 Licht an", "22:30")
    if want(9):
        c, pg = open_demo(b)
        print(9, pg.evaluate("(I) => mockIdea(9, I)", I))
        pg.wait_for_timeout(900)
        pg.screenshot(path=str(OUT / "9-ablauf.png"))
        c.close()
    if want(10):
        c, pg = open_demo(b, mode="edit")
        pg.click("#settingsBtn"); pg.wait_for_timeout(800)
        pg.evaluate(OPEN_SETTING, "#alarmNotify"); pg.wait_for_timeout(600)
        print(10, pg.evaluate("(I) => mockIdea(10, I)", I))
        pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / "10-alarm.png"))
        c.close()
    b.close()
