"""Erklär-Grafik „So reagiert eine Bildkarte“ (der Besitzer, 2026-11-24: „erkläre mir, wie die Karten auf Input reagieren, dass ich weiß,
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
import alarmnotify as an  # noqa: E402
import piccard as pc  # noqa: E402

CARD = {"id": "meine", "name": "Meine Karte", "color": "#3a7bd5", "theme": "light", "width": "tall", "blocks": [
    {"k": "head", "text": "{kind}", "clock": True},
    {"k": "text", "text": "{text}", "big": False},
    {"k": "text", "text": "{name} · {room} ({floor}) · {time} Uhr", "big": False},
    {"k": "plan", "show": "floor", "marks": False},
    {"k": "info", "rows": ["sensor", "room", "who"]},
    {"k": "foot"}]}
CARD_ROWS = [("Überschrift", ["kind"]), ("Text", ["text"]), ("Text", ["name", " · ", "room", " (", "floor", ") · ", "time", " Uhr"]),
             ("Raumbild", None), ("Infos", None), ("Fußzeile", None)]
LABEL = {"kind": "Art", "text": "Nachricht", "room": "Raum", "floor": "Etage", "name": "Melder", "time": "Uhrzeit", "house": "Haus"}


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
    water = place(lay, "kg", "Waschküche")
    office = place(lay, "eg", "Büro")
    return [
        {"num": "①", "title": "Alarm", "how": "Der Wassermelder in der Waschküche schlägt an.",
         "where": "⚙ Einstellungen → Warnungen & Alarm → Nachricht aufs Handy → „Telegram – eigener Bot“ → 🖼 Bildkarte je Alarm: Wasser → „Meine Karte“",
         "ctx": {**base, "kind": "water", "name": "Wassermelder", "place": water, "now": t1, "since": t1,
                 "text": an.text("alarm", "water", "Wassermelder", "Waschküche (Keller)", "de", "07:41").replace("\n", " · ")}},
        {"num": "②", "title": "Ablauf mit Gerät", "how": "Ablauf „Licht im Büro“: WENN Präsenz im Büro → DANN 🔔 Nachricht „Jemand ist im Büro“.",
         "where": "▶ Abläufe → Ablauf → Baustein „🔔 Nachricht“ → 🖼 Als Bildkarte schicken: „Meine Karte“",
         "ctx": {**base, "kind": "flow", "title": "Licht im Büro", "name": "Präsenz Büro", "place": office, "now": t2, "since": t2,
                 "text": "Jemand ist im Büro"}},
        {"num": "③", "title": "Ablauf ohne Gerät", "how": "Ablauf „Gute Nacht“: WENN es 22:00 Uhr ist (oder ein Knopf) → DANN 🔔 Nachricht, Text leer.",
         "where": "wie ②, aber der Auslöser ist eine Uhrzeit oder ein Knopf: es gibt kein Gerät und keinen Raum",
         "ctx": {**base, "kind": "flow", "title": "Gute Nacht", "name": "", "place": None, "now": t3, "since": t3, "text": ""},
         "note": '<div class="note">⚠ Leere Kästchen lassen Lücken: aus „<span class="pill">Melder</span> · <span class="pill">Raum</span> '
                 '(<span class="pill">Etage</span>) · <span class="pill">Uhrzeit</span> Uhr“ wird „· () · 22:00 Uhr“. Für ③ also lieber nur '
                 '<span class="pill">Uhrzeit</span> <span class="pill">Haus</span> <span class="pill">Art</span>.</div>'},
    ]


def values(ctx):
    """what each green box becomes (as piccard.fill)"""
    return {k: pc.fill("{" + k + "}", ctx) for k in LABEL}


def pill(k):
    return f'<span class="pill">{LABEL[k]}</span>'


def html(cs):
    rows = "".join(f'<div class="blk"><b>{n}</b> {"".join(pill(p) if p in LABEL else p for p in parts) if parts else "<i>malt sich selbst</i>"}</div>'
                   for n, parts in CARD_ROWS)
    cols = ""
    for c in cs:
        v = values(c["ctx"])
        img = base64.b64encode(c["png"]).decode()
        table = "".join(f'<tr><td>{pill(k)}</td><td>{v[k] or "<span class=empty>leer</span>"}</td></tr>' for k in LABEL)
        cols += f"""<div class="col"><div class="colhead"><span class="num">{c["num"]}</span>{c["title"]}</div>
          <div class="how">⚡ {c["how"]}</div>
          <img src="data:image/png;base64,{img}">
          <table>{table}</table>{c.get("note", "")}<div class="where">📍 {c["where"]}</div></div>"""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
    body {{ margin: 0; background: #eef1f6; font-family: Inter, 'Segoe UI', Roboto, 'DejaVu Sans', sans-serif; color: #1b2230; width: 1500px; }}
    .wrap {{ padding: 34px 40px 40px; }}
    h1 {{ margin: 0 0 6px; font-size: 38px; }} .sub {{ font-size: 19px; color: #4a5468; margin-bottom: 24px; }}
    .card {{ background: #fff; border-radius: 16px; box-shadow: 0 2px 8px #0001; padding: 18px 22px; margin-bottom: 22px; }}
    .design {{ display: flex; gap: 26px; align-items: center; }}
    .design h2, .tips h2 {{ margin: 0 0 10px; font-size: 22px; }}
    .blk {{ font-size: 17px; padding: 6px 0; border-bottom: 1px solid #eef0f4; }} .blk b {{ display: inline-block; width: 120px; color: #4a5468; font-weight: 600; }}
    .pill {{ display: inline-block; background: #2ea057; color: #fff; border-radius: 6px; padding: 1px 9px; font-weight: 700; font-size: 15px; margin: 0 1px; }}
    .arrow {{ font-size: 18px; color: #4a5468; max-width: 470px; line-height: 1.45; }}
    .cols {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-bottom: 22px; }}
    .col {{ background: #fff; border-radius: 16px; box-shadow: 0 2px 8px #0001; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }}
    .colhead {{ font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; }}
    .num {{ background: #3a7bd5; color: #fff; border-radius: 50%; width: 38px; height: 38px; display: grid; place-items: center; font-size: 22px; }}
    .how {{ font-size: 16px; background: #fff7e0; border-radius: 10px; padding: 8px 10px; min-height: 48px; }}
    .col img {{ width: 100%; border-radius: 12px; box-shadow: 0 1px 6px #0002; }}
    table {{ border-collapse: collapse; font-size: 16px; }} td {{ padding: 4px 6px; vertical-align: top; }} td:first-child {{ width: 108px; }}
    .empty {{ color: #b0372b; font-weight: 700; }}
    .note {{ font-size: 15px; background: #fdecea; color: #7a1d14; border-radius: 10px; padding: 8px 10px; line-height: 1.6; }}
    .where {{ font-size: 14px; color: #4a5468; margin-top: auto; }}
    .tips ul {{ margin: 0; padding-left: 22px; font-size: 18px; line-height: 1.55; }}
    </style></head><body><div class="wrap">
    <h1>🖼 So reagiert eine Bildkarte</h1>
    <div class="sub">Dieselbe Karte, drei Auslöser. Die <span class="pill">grünen Kästchen</span> holen sich ihren Wert von dem, was die Karte auslöst.
      Die Karten unten hat das Add-on selbst gemalt (mit dem Haus der Demo).</div>
    <div class="card design"><div style="flex:1"><h2>Deine Karte „Meine Karte“ im Editor</h2>{rows}</div>
      <div class="arrow">Du baust die Karte <b>einmal</b>. Was in den Kästchen steht, entscheidet sich erst <b>beim Senden</b>:<br>
      ① ein Alarm → der Melder, sein Raum, seine Etage<br>② ein Ablauf mit Gerät → das Gerät, das ihn ausgelöst hat<br>
      ③ ein Ablauf mit Uhrzeit oder Knopf → <b>kein</b> Gerät: Raum, Etage, Melder bleiben leer</div></div>
    <div class="cols">{cols}</div>
    <div class="card tips"><h2>💡 Tipps, damit es klappt</h2><ul>
      <li><b>Art</b> ist bei einem Alarm WASSER, RAUCH, GAS …, bei einem Ablauf sein <b>Name</b>.</li>
      <li><b>Nachricht</b> ist bei einem Alarm der Text der Warnung, bei einem Ablauf der Text im Baustein „🔔 Nachricht“ (mit Karte darf er leer bleiben).</li>
      <li>Für Abläufe mit <b>Uhrzeit oder Knopf</b> (③): <span class="pill">Raum</span> <span class="pill">Etage</span> <span class="pill">Melder</span> weglassen und beim Raumbild ein festes <b>Stockwerk</b> wählen. Gut passen <span class="pill">Uhrzeit</span> <span class="pill">Haus</span> <span class="pill">Art</span>, „Wer ist zu Hause“, „Offene Fenster“, „Licht an“.</li>
      <li>Eine Info-Zeile ohne Wert fällt weg; das Kamerabild „von selbst“ braucht eine Kamera im Raum (bei ③ also eine fest gewählte).</li>
      <li>Karten kommen nur über <b>„Telegram – eigener Bot“</b>. Die Vorschau im Editor nimmt einen Raum deines Hauses als Beispiel.</li>
    </ul></div></div></body></html>"""


def main():
    lay, states = demo_house()
    cs = cases(lay, states)
    for c in cs:
        c["png"] = pc.render(CARD, c["ctx"])
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1500, "height": 1000}, device_scale_factor=1.5)
        pg.set_content(html(cs))
        pg.wait_for_timeout(500)
        out = Path(__file__).parent / "bildkarten.jpg"
        pg.screenshot(path=str(out), full_page=True, type="jpeg", quality=82)
        b.close()
    print(out, out.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
