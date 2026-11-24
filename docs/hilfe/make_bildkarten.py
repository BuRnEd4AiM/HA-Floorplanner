"""Erklär-Grafik „Bildkarten einfach erklärt“ (2. Fassung: „ich verstehe diese Grafik noch nicht so richtig … visuell besser und einfach zu verstehen“)
Erster Anlass (der Besitzer, 2026-11-24: „erkläre mir, wie die Karten auf Input reagieren, dass ich weiß,
wie ich die richtig einsetzen kann, anhand von einer Grafik“). Dieselbe Karte, drei Auslöser; die Karten malt der echte Zeichner des
Add-ons (piccard.py) mit dem Haus der Demo.
    cd demo && npm ci && node build.mjs && cd ..
    python3 docs/hilfe/make_bildkarten.py            # → docs/hilfe/bildkarten.jpg
    git checkout demo/floorplan3d-demo.html"""
import base64
import datetime
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "floorplan3d" / "rootfs" / "app"))
import piccard as pc  # noqa: E402

SIMPLE = {"id": "meine", "name": "Meine Karte", "color": "#d63c31", "theme": "light", "width": "tall", "blocks": [
    {"k": "head", "text": "{kind}", "clock": True},
    {"k": "text", "text": "{kind}: {name} in {room} ({floor}) um {time}", "big": True},
    {"k": "plan", "show": "floor", "marks": False}, {"k": "foot"}]}
LABEL = {"kind": "Art", "text": "Nachricht", "room": "Raum", "floor": "Etage", "name": "Melder", "time": "Uhrzeit", "house": "Haus"}
SENTENCE = ["kind", ": ", "name", " in ", "room", " (", "floor", ") um ", "time"]   # the one sentence every row shows


def demo_house():
    demo = (ROOT / "demo" / "floorplan3d-demo.html").as_uri()
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        pg = b.new_page()
        pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
        pg.goto(demo + "?debug=1&mode=live", timeout=180000)
        pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=180000)
        lay = pg.evaluate("JSON.parse(JSON.stringify(window.__fp.layout))")
        st = pg.evaluate("JSON.parse(JSON.stringify(window.__fp.states()))")
        b.close()
    for e, x in st.items():                                   # the demo's states carry no names for persons: as Home Assistant has them
        if e.startswith("person.") and isinstance(x, dict):
            x.setdefault("attributes", {}).setdefault("friendly_name", e.split(".", 1)[1].replace("_", " ").title())
    return lay, st


def place(lay, floor_id, room_name):
    f = next(x for x in lay["floors"] if x["id"] == floor_id)
    r = next(x for x in f["rooms"] if x.get("name") == room_name)
    pts = r["points"]
    return {"house": "Demo-Haus", "floor": f, "room": r, "x": sum(p[0] for p in pts) / len(pts), "z": sum(p[1] for p in pts) / len(pts)}


def cases(lay, states):
    base = {"floors": lay["floors"], "house": "Demo-Haus", "states": states, "lang": "de", "camera": None, "camera_name": "", "preview": False}
    t1, t2, t3 = (datetime.datetime(2026, 11, 24, h, m) for h, m in ((7, 41), (18, 5), (22, 0)))
    return [
        {"icon": "💧", "title": "Ein Alarm", "what": "Der Wassermelder in der Waschküche schlägt an.", "ok": True,
         "ctx": {**base, "kind": "water", "name": "Wassermelder", "place": place(lay, "kg", "Waschküche"), "now": t1, "since": t1, "text": ""}},
        {"icon": "🚶", "title": "Ein Ablauf, den ein Gerät startet", "what": "Der Präsenzmelder im Büro startet den Ablauf „Licht im Büro“.", "ok": True,
         "ctx": {**base, "kind": "flow", "title": "Licht im Büro", "name": "Präsenz Büro", "place": place(lay, "eg", "Büro"), "now": t2, "since": t2, "text": ""}},
        {"icon": "🕙", "title": "Ein Ablauf mit Uhrzeit oder Knopf", "what": "Um 22:00 Uhr startet der Ablauf „Gute Nacht“. Kein Gerät, kein Raum.", "ok": False,
         "ctx": {**base, "kind": "flow", "title": "Gute Nacht", "name": "", "place": None, "now": t3, "since": t3, "text": ""}},
    ]


def pill(k):
    return f'<span class="pill">{LABEL[k]}</span>'


def template():
    return "".join(pill(p) if p in LABEL else p for p in SENTENCE)


def filled(ctx):
    """the sentence as it arrives: every box its value (yellow), an empty one a red question mark"""
    out = ""
    for p in SENTENCE:
        if p in LABEL:
            v = pc.fill("{" + p + "}", ctx)
            out += f'<span class="val">{v}</span>' if v else '<span class="gap">?</span>'
        else:
            out += p
    return out


def html(cs, phone_png):
    img = base64.b64encode(phone_png).decode()
    rows = ""
    for n, c in zip("ABC", cs):
        warn = ('<div class="warn">⚠️ Kein Gerät → <b>Raum</b>, <b>Etage</b> und <b>Melder</b> bleiben leer.</div>' if not c["ok"] else
                '<div class="good">✅ Alle Kästchen werden gefüllt.</div>')
        rows += f"""<div class="row {'bad' if not c['ok'] else ''}">
          <div class="trig"><div class="big">{c["icon"]}</div><div><div class="n">{n}</div></div></div>
          <div class="body"><div class="t">{c["title"]}</div><div class="w">{c["what"]}</div>
            <div class="arrive"><span class="lbl">📱 Es kommt an:</span><div class="bubble">{filled(c["ctx"])}</div></div>{warn}</div></div>"""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
    body {{ margin: 0; background: #eef1f6; font-family: Inter, 'Segoe UI', Roboto, 'DejaVu Sans', sans-serif; color: #1b2230; width: 1100px; }}
    .wrap {{ padding: 36px 40px 44px; }}
    h1 {{ margin: 0 0 8px; font-size: 44px; line-height: 1.15; }}
    .lead {{ font-size: 24px; color: #3d475a; margin-bottom: 28px; line-height: 1.4; }}
    .pill {{ display: inline-block; background: #2ea057; color: #fff; border-radius: 8px; padding: 2px 12px; font-weight: 800; margin: 2px 2px; }}
    .box {{ background: #fff; border-radius: 22px; box-shadow: 0 3px 12px #0001; padding: 26px 30px; margin-bottom: 26px; }}
    h2 {{ margin: 0 0 18px; font-size: 30px; display: flex; align-items: center; gap: 14px; }}
    .step {{ background: #3a7bd5; color: #fff; border-radius: 50%; width: 48px; height: 48px; display: grid; place-items: center; font-size: 28px; flex: none; }}
    .hero {{ display: grid; grid-template-columns: 1fr 60px 380px; align-items: center; gap: 10px; }}
    .write {{ font-size: 30px; line-height: 2; background: #f6f8fb; border: 3px dashed #c8d0dc; border-radius: 18px; padding: 18px 22px; }}
    .write small {{ display: block; font-size: 19px; color: #5a6478; line-height: 1.4; margin-top: 8px; }}
    .arr {{ font-size: 54px; text-align: center; color: #3a7bd5; }}
    .phone {{ background: #1b2230; border-radius: 38px; padding: 14px; box-shadow: 0 8px 26px #0003; }}
    .phone .scr {{ background: linear-gradient(160deg,#b9d7a2,#86b58f); border-radius: 26px; padding: 14px 10px; }}
    .phone img {{ width: 100%; border-radius: 12px; display: block; }}
    .phone .cap {{ background: #fff; border-radius: 0 0 12px 12px; font-size: 15px; padding: 6px 10px; margin-top: -4px; }}
    .trigline {{ margin-top: 16px; font-size: 22px; background: #fff7e0; border-radius: 14px; padding: 10px 16px; }}
    .tmpl {{ font-size: 26px; background: #f6f8fb; border-radius: 14px; padding: 10px 18px; margin-bottom: 20px; line-height: 1.9; }}
    .tmpl b {{ font-size: 20px; color: #5a6478; margin-right: 8px; }}
    .row {{ display: grid; grid-template-columns: 120px 1fr; gap: 18px; padding: 20px 0; border-top: 2px solid #eef0f4; }}
    .row:first-of-type {{ border-top: none; }}
    .trig {{ position: relative; }} .big {{ font-size: 76px; text-align: center; line-height: 1.1; }}
    .n {{ position: absolute; top: -4px; left: 0; background: #3a7bd5; color: #fff; border-radius: 50%; width: 38px; height: 38px; display: grid; place-items: center; font-weight: 800; font-size: 22px; }}
    .t {{ font-size: 28px; font-weight: 800; }} .w {{ font-size: 21px; color: #3d475a; margin: 4px 0 12px; }}
    .arrive {{ display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }}
    .lbl {{ font-size: 19px; color: #5a6478; font-weight: 700; }}
    .bubble {{ font-size: 25px; background: #e7f6ec; border-radius: 16px 16px 16px 4px; padding: 10px 16px; line-height: 1.7; }}
    .row.bad .bubble {{ background: #fdecea; }}
    .val {{ background: #ffe27a; border-radius: 6px; padding: 1px 6px; font-weight: 700; }}
    .gap {{ background: #d63c31; color: #fff; border-radius: 6px; padding: 1px 12px; font-weight: 900; }}
    .good {{ font-size: 20px; color: #1f7a43; margin-top: 10px; font-weight: 700; }}
    .warn {{ font-size: 21px; color: #9c2318; margin-top: 10px; }}
    .tips {{ display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }}
    .tip {{ border-radius: 18px; padding: 18px 20px; font-size: 22px; line-height: 1.45; }}
    .tip .ic {{ font-size: 40px; display: block; margin-bottom: 6px; }}
    .tip.g {{ background: #e7f6ec; }} .tip.r {{ background: #fdecea; }} .tip.b {{ background: #e8f0fb; grid-column: 1 / -1; }}
    </style></head><body><div class="wrap">
    <h1>🖼 Bildkarten einfach erklärt</h1>
    <div class="lead">Die <span class="pill">grünen Kästchen</span> sind <b>Lücken</b>. Du schreibst die Karte nur <b>einmal</b>.
      Erst wenn etwas passiert, füllt das Add-on die Lücken mit dem, was gerade passiert ist.</div>

    <div class="box"><h2><span class="step">1</span>So funktioniert es</h2>
      <div class="hero">
        <div><div class="write">{template()}<small>✏️ Das schreibst du <b>einmal</b> in den Baustein „Text“.</small></div>
          <div class="trigline">⚡ Dann passiert etwas: <b>💧 der Wassermelder in der Waschküche schlägt an.</b></div></div>
        <div class="arr">➜</div>
        <div class="phone"><div class="scr"><img src="data:image/png;base64,{img}"><div class="cap">📱 kommt aufs Handy</div></div></div>
      </div></div>

    <div class="box"><h2><span class="step">2</span>Was in die Lücken kommt, hängt davon ab, <u>was</u> passiert</h2>
      <div class="tmpl"><b>Deine Karte:</b>{template()}</div>
      {rows}</div>

    <div class="box"><h2><span class="step">3</span>Merke</h2><div class="tips">
      <div class="tip g"><span class="ic">✅</span>Bei einem <b>Alarm</b> oder einem Ablauf, den ein <b>Gerät</b> startet, kannst du <b>alle</b> Kästchen nehmen.</div>
      <div class="tip r"><span class="ic">⚠️</span>Bei einem Ablauf mit <b>Uhrzeit</b> oder <b>Knopf</b> nur {pill("time")} {pill("house")} {pill("kind")} {pill("text")} nehmen. Beim Raumbild ein festes <b>Stockwerk</b> wählen.</div>
      <div class="tip b"><span class="ic">📨</span>Bildkarten kommen über <b>„Telegram – eigener Bot“</b> oder die <b>Home-Assistant-App</b> (Benachrichtigungsdienst „mobile_app_…“). Wo du sie einstellst: bei einem <b>Alarm</b> unter ⚙ → Warnungen &amp; Alarm → Nachricht aufs Handy, bei einem <b>Ablauf</b> im Baustein „🔔 Nachricht“ → „🖼 Als Bildkarte schicken“.</div>
    </div></div>
    </div></body></html>"""


def main():
    lay, states = demo_house()
    cs = cases(lay, states)
    phone = pc.render(SIMPLE, cs[0]["ctx"])
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1100, "height": 1000}, device_scale_factor=2)
        pg.set_content(html(cs, phone))
        pg.wait_for_timeout(500)
        out = Path(__file__).parent / "bildkarten.jpg"
        pg.screenshot(path=str(out), full_page=True, type="jpeg", quality=82)
        b.close()
    print(out, out.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
