import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
S = Path(sys.argv[1]); OUT = S / "ideen"
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
MOCK = (Path(__file__).parent / "mockup.js").read_text()
CLIP = {"x": 560, "y": 0, "width": 940, "height": 900}

def page(b):
    pg = b.new_page(viewport={"width": 1500, "height": 900}, device_scale_factor=2, locale="de-DE")
    pg.add_init_script("try { localStorage.setItem('fp.ui', 'v2'); localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
    pg.goto(demo + "?debug=1&mode=edit&ui=2&skytime=13:00"); pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=120000)
    pg.add_script_tag(content=MOCK); pg.wait_for_timeout(800)
    return pg

def stair_info(pg):
    return pg.evaluate("""() => { const b = document.getElementById('propsBody');
      const v = (l) => { const r = [...b.querySelectorAll('.prop')].find(k => k.querySelector('label')?.textContent.trim() === l); const i = r?.querySelector('input,select'); return i ? (i.value || i.placeholder) : ''; };
      return { dir: v('Richtung'), floors: v('Etagen'), w: v('Breite'), steps: v('Stufen je Etage'), len: v('Länge'), rot: v('Drehung °'), x: v('X'), z: v('Z'), rise: document.getElementById('stairRise')?.textContent || '' }; }""")

de = lambda x: str(x).replace(".", ",")
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    # 1 + 2: die Treppe heute und in „✨ Neu“
    pg = page(b)
    pg.evaluate("() => { window.__fp.switchFloor(1); window.__fp.select('stair', 'st1'); }"); pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / "1-treppe-heute.png"), clip=CLIP)
    si = stair_info(pg); print(si)
    rise = si["rise"].split(" hoch")[0].replace("Eine Stufe ist ", "")
    spec = {"crumbs": ["🏠 Demo-Haus", "Erdgeschoss", "Treppe"], "icon": "🪜", "title": "Treppe",
            "sub": "Gerade Treppe · Erdgeschoss → Obergeschoss",
            "chips": [[f"↔ {de(float(si['w'])):s} m breit", ""], [f"{si['steps']} Stufen · je {de(rise)}", "ok"]],
            "acts": [["🔓", "Sperren"], ["⇉", "Übernehmen"], ["🗑", "Löschen", "del"]],
            "top": ["Name"],
            "sections": [
              {"icon": "📐", "title": "Form & Maße", "open": True, "sum": f"nach oben · {de(si['w'])} × {de(si['len'])} m", "labels": ["Richtung", "Etagen", "Breite", "Länge"]},
              {"icon": "🪜", "title": "Stufen", "open": True, "sum": f"{si['steps']} je Etage · {de(rise)} hoch", "labels": ["Stufen je Etage"], "sel": ["#stairRise"]},
              {"icon": "📍", "title": "Lage", "open": False, "sum": f"X {de(si['x'])} m · Z {de(si['z'])} m · {si['rot']}°", "labels": ["Drehung °", "X", "Z"]},
            ]}
    pg.evaluate("(s) => window.v2mock(s)", spec); pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT / "2-treppe-neu.png"), clip=CLIP)
    pg.close()
    # 3: die Bodenöffnung in „✨ Neu“
    pg = page(b)
    area = pg.evaluate("""() => { const h = window.__fp.layout.floors[3].holes[0], P = h.points; let a = 0;
      for (let i = 0; i < P.length; i++) { const [x1, z1] = P[i], [x2, z2] = P[(i + 1) % P.length]; a += x1 * z2 - x2 * z1; } return Math.abs(a / 2); }""")
    pg.evaluate("() => { window.__fp.switchFloor(3); window.__fp.select('hole', 'h1'); }"); pg.wait_for_timeout(1200)
    spec = {"crumbs": ["🏠 Demo-Haus", "Dachgeschoss", "Bodenöffnung"], "icon": "⬚", "title": "Bodenöffnung",
            "sub": "Offen nach unten · Dachgeschoss", "chips": [[f"📐 {de(round(area, 1))} m²", ""]],
            "acts": [["🔓", "Sperren"], ["🗑", "Löschen", "del"]],
            "sections": [
              {"icon": "📐", "title": "Form", "open": True, "sum": f"{len(pg.evaluate('window.__fp.layout.floors[3].holes[0].points'))} Ecken · {de(round(area, 1))} m²",
               "html": ['<p class="sub">Ecken im Plan ziehen ändert die Form. Ein Block darunter wird dort mit ausgeschnitten.</p>']}
            ]}
    pg.evaluate("(s) => window.v2mock(s)", spec); pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT / "3-bodenoeffnung-neu.png"), clip=CLIP)
    pg.close()
    # 4 + 5: der Haus-Baum heute (Häuser und Gebäude unten aufgeklappt) und neu (🔒 und ⋯ am Haus)
    pg = page(b)
    pg.evaluate("() => { document.querySelectorAll('#housePanel, #buildingPanel').forEach(d => d.open = true); }")
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "4-haus-heute.png"), clip=CLIP)
    pg.evaluate("() => { document.getElementById('panel').scrollTop = 99999; }"); pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / "4b-haus-heute-unten.png"), clip=CLIP)
    pg.close()
    pg = page(b)
    pg.evaluate("() => window.v2homeMock()"); pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT / "5-haus-neu.png"), clip=CLIP)
    pg.close()
    b.close()
