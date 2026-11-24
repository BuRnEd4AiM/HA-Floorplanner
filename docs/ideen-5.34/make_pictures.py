"""Beispielbilder für docs/ideen-5.34 (2026-11-24): Platzhalter in den Texten einer Bildkarte mit einem Tipp einsetzen (der Besitzer: „wenn
ich nur … Raum rein schreibe, es einen Raum nimmt“). Die Knöpfe sind nur fürs Foto in den echten Editor der Demo gemalt; die Vorschau rechts
ist echt (die Platzhalter gibt es schon).
    cd demo && npm ci && node build.mjs && cd ..
    python3 docs/ideen-5.34/make_pictures.py <ordner>
    python3 docs/ideen-5.34/to_jpg.py <ordner> docs/ideen-5.34"""
import base64
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
demo = Path("demo/floorplan3d-demo.html").resolve().as_uri()
TEXT = "Wasser in {raum} ({etage}) um {zeit}. Gemeldet von {melder}."
CHIPS = [("raum", "Raum", "Waschküche"), ("etage", "Etage", "Keller"), ("melder", "Melder", "Keller Luftfeuchte"), ("zeit", "Uhrzeit", "{now}"),
         ("art", "Art", "WASSER"), ("haus", "Haus", "Demo-Haus"), ("text", "Nachricht", "der Text")]
CSS = """
.mkNew { outline: 3px solid #2ea057; outline-offset: 4px; border-radius: 10px; }
.mkChips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.mkChips .lbl { width: 100%; font-size: 12px; opacity: .75; }
.mkChip { border: 1px solid #2ea057; background: #2ea05722; color: inherit; border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 13px; }
.mkChip small { opacity: .65; margin-left: 4px; }
.mkField { min-height: 58px; border: 1px solid #8888; border-radius: 8px; padding: 8px 10px; line-height: 2; background: var(--bg, #fff2); font-size: 14px; }
.mkPill { display: inline-block; background: #2ea057; color: #fff; border-radius: 6px; padding: 0 8px; line-height: 1.6; font-weight: 600; margin: 0 2px; }
.mkTip { font-size: 12px; opacity: .8; margin-top: 6px; }
.mkTip b { color: #2ea057; }
"""


def editor(b, idea):
    c = b.new_context(viewport={"width": 1400, "height": 900}, device_scale_factor=2, locale="de-DE")
    pg = c.new_page()
    pg.add_init_script("try { localStorage.setItem('fp3d.welcome','1'); } catch (e) {}")
    pg.goto(demo + "?debug=1&mode=live", timeout=180000)
    pg.wait_for_function("window.__fp && window.__fp.ready()", timeout=180000)
    pg.wait_for_timeout(1200)
    pg.click("#tabBar [data-tab=routines]")
    pg.wait_for_selector("[data-page=routines] .pcTile[data-card=wasser]", timeout=60000)
    pg.click("[data-page=routines] .pcTile[data-card=wasser]")
    pg.wait_for_function("document.querySelector('#picCardDlg[open] #pcPreview')?.naturalWidth > 0", timeout=60000)
    pg.click("#picCardDlg [data-add=text]"); pg.wait_for_timeout(400)
    pg.fill("#picCardDlg .pcOpts [data-opt=text]", TEXT)
    pg.dispatch_event("#picCardDlg .pcOpts [data-opt=text]", "change"); pg.wait_for_timeout(500)
    pg.wait_for_function("document.querySelector('#pcPreview')?.naturalWidth > 0", timeout=60000)
    pg.wait_for_timeout(1500)
    pg.add_style_tag(content=CSS)
    now = pg.evaluate("new Date().toTimeString().slice(0, 5)")
    chips = [(k, label, ex.replace("{now}", now)) for k, label, ex in CHIPS]
    pg.evaluate("""([idea, chips, text]) => {
      const o = document.querySelector('#picCardDlg .pcOpts'), lab = o.querySelector('.pcField'), inp = lab.querySelector('input');
      lab.querySelector('small')?.remove();
      if (idea === 2) {                                         // the placeholders as green boxes in the field, no braces
        const f = document.createElement('div'); f.className = 'mkField';
        const names = Object.fromEntries(chips.map(([k, l]) => [k, l]));
        f.innerHTML = text.replace(/\\{(\\w+)\\}/g, (m, k) => `<span class="mkPill">${names[k] || k}</span>`);
        inp.replaceWith(f);
      }
      const box = document.createElement('div'); box.className = 'mkChips mkNew';
      box.innerHTML = `<div class="lbl">Antippen setzt es an der Stelle vom Strich ein – beim Senden steht dort das Echte:</div>` +
        chips.map(([k, l, ex]) => `<button class="mkChip">＋ ${l}<small>${ex}</small></button>`).join('');
      lab.after(box);
      const tip = document.createElement('div'); tip.className = 'mkTip';
      tip.innerHTML = idea === 2 ? 'Grüne Kästchen = wird beim Senden ersetzt. <b>⌫</b> löscht ein Kästchen ganz.'
                                 : 'Im Feld steht dann z. B. <b>{raum}</b>; rechts siehst du sofort, was daraus wird.';
      box.after(tip);
      o.scrollIntoView({ block: 'center' });
    }""", [idea, chips, TEXT])
    pg.wait_for_timeout(600)
    png = pg.screenshot()
    card = None
    if idea == 1:
        card = base64.b64decode(pg.evaluate("""async () => { const r = await fetch(document.querySelector('#pcPreview').src);
          const b = await r.blob(); return await new Promise((ok) => { const f = new FileReader(); f.onload = () => ok(f.result.split(',')[1]); f.readAsDataURL(b); }); }"""))
    c.close()
    return png, card, now


def telegram(b, card_png, now):
    c = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="de-DE")
    pg = c.new_page()
    img = base64.b64encode(card_png).decode()
    pg.set_content(f"""<html><body style="margin:0;height:844px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Inter,sans-serif;
      background:linear-gradient(160deg,#b9d7a2,#86b58f 60%,#6fa08c)">
      <div style="background:#fff;padding:8px 12px 9px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 3px #0002">
        <span style="font-size:26px;color:#3390ec">‹</span>
        <span style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#4fb3f6,#2a7fd4);display:grid;place-items:center;font-size:21px">🏠</span>
        <div><div style="font-weight:700;font-size:16px">Haus-Bot</div><div style="font-size:13px;color:#8a8f98">Bot</div></div></div>
      <div style="padding:10px 10px 0;display:flex;flex-direction:column;gap:8px">
        <div style="align-self:flex-start;max-width:318px;background:#fff;border-radius:14px 14px 14px 4px;overflow:hidden;box-shadow:0 1px 2px #0002">
          <img src="data:image/png;base64,{img}" style="width:318px;display:block">
          <div style="padding:7px 10px 6px;font-size:15px;line-height:1.35">Wasser erkannt<span style="float:right;margin:6px 0 0 10px;font-size:12px;color:#a0a6ae">{now}</span></div>
        </div></div></body></html>""")
    pg.wait_for_timeout(500)
    png = pg.screenshot()
    c.close()
    return png


with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
    png1, card, now = editor(b, 1)
    (OUT / "1-knoepfe.png").write_bytes(png1)
    (OUT / "2-kaestchen.png").write_bytes(editor(b, 2)[0])
    (OUT / "3-handy.png").write_bytes(telegram(b, card, now))
    b.close()
