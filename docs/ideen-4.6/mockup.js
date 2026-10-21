// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Mock-up of #484, the owner's wish of 2026-10-21: "dass ich als Admin die einzelnen Dashboards bearbeiten kann wie im HA-Dashboard":
// the pages of the tab bar in an edit mode (cards moved and hidden), own cards with any device, own pages.
window.mk46 = (() => {
  const css = `
  .mkStrip { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: -4px 0 14px; padding: 10px 14px; border-radius: 14px;
    background: color-mix(in srgb, var(--accent) 14%, var(--panel)); border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent); }
  .mkStrip b { font-size: 16px; } .mkStrip .sub { color: var(--muted); font-size: 13px; flex: 1; min-width: 200px; }
  .mkB { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--field);
    color: var(--text); font-weight: 700; font-size: 14px; }
  .mkB.blue { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
  .mkE { position: relative; outline: 2px dashed color-mix(in srgb, var(--accent) 60%, transparent); outline-offset: 3px; }
  .mkTools { position: absolute; top: -14px; right: 10px; display: flex; gap: 4px; z-index: 2; }
  .mkTools span { width: 30px; height: 28px; display: grid; place-items: center; border-radius: 8px; background: var(--panel); border: 1px solid var(--line);
    font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,.35); }
  .mkTools span.grip { cursor: grab; letter-spacing: -2px; color: var(--muted); }
  .mkOff { opacity: .38; } .mkOffTag { position: absolute; left: 12px; top: -12px; padding: 2px 10px; border-radius: 999px; background: #3a3f46; color: #fff; font-size: 12px; font-weight: 700; z-index: 2; }
  .mkOwnTag { position: absolute; left: 12px; top: -12px; padding: 2px 10px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 80%, #000); color: #fff; font-size: 12px; font-weight: 700; z-index: 2; }
  .mkAdd { display: grid; place-items: center; min-height: 92px; border-radius: 16px; border: 2px dashed color-mix(in srgb, var(--accent) 60%, transparent);
    color: var(--accent); font-weight: 800; font-size: 16px; background: color-mix(in srgb, var(--accent) 6%, transparent); }
  .mkDrag { transform: rotate(-1.5deg) translate(18px, 26px); box-shadow: 0 18px 40px rgba(0,0,0,.55); z-index: 5; }
  .mkGhost { border: 2px dashed var(--accent); border-radius: 16px; min-height: 70px; background: color-mix(in srgb, var(--accent) 10%, transparent); }
  .mkModal { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.55); display: grid; place-items: center; }
  .mkBox { width: min(820px, calc(100vw - 40px)); background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 20px 22px; color: var(--text);
    box-shadow: 0 30px 80px rgba(0,0,0,.6); backdrop-filter: blur(20px); }
  .mkBox h3 { margin: 0 0 4px; font-size: 21px; } .mkBox .sub { color: var(--muted); margin: 0 0 14px; }
  .mkTypes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .mkType { display: flex; flex-direction: column; gap: 4px; padding: 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--field); min-height: 96px; }
  .mkType .i { font-size: 26px; } .mkType b { font-size: 15px; } .mkType small { color: var(--muted); font-size: 12px; line-height: 1.3; }
  .mkType.sel { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .mkCols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; }
  .mkF { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; } .mkF label { font-size: 13px; color: var(--muted); font-weight: 600; }
  .mkIn { padding: 9px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--field); color: var(--text); font-size: 15px; display: flex; align-items: center; gap: 8px; }
  .mkIn small { color: var(--muted); margin-left: auto; font-size: 12px; }
  .mkSeg { display: flex; gap: 6px; flex-wrap: wrap; } .mkSeg span { padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--field); font-weight: 600; font-size: 13px; }
  .mkSeg span.on { background: color-mix(in srgb, var(--accent) 24%, transparent); border-color: var(--accent); }
  .mkList { border: 1px solid var(--line); border-radius: 10px; margin-top: 4px; overflow: hidden; } .mkList div { padding: 7px 12px; border-top: 1px solid var(--line); font-size: 14px; display: flex; gap: 8px; }
  .mkList div:first-child { border-top: 0; } .mkList div.on { background: color-mix(in srgb, var(--accent) 18%, transparent); } .mkList small { margin-left: auto; color: var(--muted); }
  .mkBtns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }
  .mkPrev { border-radius: 16px; padding: 10px; background: rgba(0,0,0,.18); }
  .mkPrev > small { display: block; color: var(--muted); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 8px 4px; }
  .mkGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  .mkC { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; min-width: 0; }
  .mkC h4 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
  .mkC .big { font-size: 34px; font-weight: 800; letter-spacing: -.02em; } .mkC .muted { color: var(--muted); font-size: 13px; }
  .mkSw { width: 52px; height: 30px; border-radius: 15px; background: var(--accent); position: relative; flex: none; } .mkSw::after { content: ''; position: absolute; right: 3px; top: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; }
  .mkSw.off { background: var(--field); border: 1px solid var(--line); } .mkSw.off::after { left: 3px; right: auto; }
  .mkRow { display: flex; align-items: center; gap: 10px; } .mkRow .g { flex: 1; }
  .mkBar { height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; margin-top: 8px; } .mkBar i { display: block; height: 100%; background: #46a758; }
  .mkSlider { height: 10px; border-radius: 5px; background: linear-gradient(90deg, #ffcf70 70%, var(--field) 70%); margin: 12px 0 4px; position: relative; }
  .mkSlider::after { content: ''; position: absolute; left: calc(70% - 10px); top: -6px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.4); }
  .mkSpan2 { grid-column: span 2; }
  #tabBar button.mkTab .ti { font-size: 22px; }
  .mkGarden #tabBar button[data-tab].active { background: transparent; box-shadow: none; color: var(--muted); }
  .mkTabEdit #tabBar button[data-tab], .mkTabEdit #tabBar button.mkTab { outline: 2px dashed color-mix(in srgb, var(--accent) 55%, transparent); outline-offset: -3px; position: relative; }
  .mkTabEdit #tabBar button[data-tab]::before, .mkTabEdit #tabBar button.mkTab::before { content: '⠿'; position: absolute; left: 6px; top: 4px; color: var(--muted); font-size: 12px; }
  .mkEmo { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; } .mkEmo span { display: grid; place-items: center; height: 40px; border-radius: 10px; background: var(--field); font-size: 22px; border: 1px solid var(--line); }
  .mkEmo span.on { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); background: color-mix(in srgb, var(--accent) 20%, transparent); }
  `;
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  function setup() {
    if (!document.getElementById('mk46css')) { const s = document.createElement('style'); s.id = 'mk46css'; s.textContent = css; document.head.append(s); }
  }
  const tab = async (k) => { document.querySelector(`#tabBar [data-tab=${k}]`)?.click(); await new Promise((r) => setTimeout(r, 2000)); };   // the page has loaded what it asks for
  /** the page does not draw itself again (the clock, the states): the picture keeps what the mock-up adds */
  const freeze = (page) => { page.replaceChildren = () => {}; return page; };
  const tools = (own) => el(`<div class="mkTools"><span class="grip" title="ziehen">⠿⠿</span>${own ? '<span>⚙️</span><span>🗑</span>' : '<span>👁</span>'}</div>`);
  const strip = (page) => el(`<div class="mkStrip"><b>✎ Seite „${page}“ bearbeiten</b><span class="sub">Karten ziehen zum Verschieben · 👁 blendet aus · ⚙️ stellt eine eigene Karte ein</span>
    <span class="mkB">＋ Karte</span><span class="mkB">↺ Wie am Anfang</span><span class="mkB blue">✓ Fertig</span></div>`);
  const sprinkler = () => el(`<div class="tpCard mkE"><span class="mkOwnTag">eigene Karte</span><h3 class="peH">💧 Bewässerung Garten</h3>
    <div class="mkRow"><span class="g"><b style="font-size:18px">läuft</b><br><span class="muted" style="color:var(--muted);font-size:13px">noch 12 min · Rasen vorne</span></span><span class="mkSw"></span></div></div>`);

  /** ☀ Heute in the edit mode: a pencil strip, every card with a grip and 👁, the waste card hidden, an own card, "+ Karte" */
  async function editToday({ drag = false } = {}) {
    setup(); await tab('today');
    const page = freeze(document.querySelector('[data-page=today]'));
    page.prepend(strip('Heute'));
    const cards = [...page.querySelectorAll('.tdCol > .tpCard')];
    cards.forEach((c) => { c.classList.add('mkE'); c.append(tools(false)); });
    const waste = page.querySelector('.tdWaste');
    if (waste) { waste.classList.add('mkOff'); waste.prepend(el('<span class="mkOffTag">ausgeblendet</span>')); }
    const cols = page.querySelectorAll('.tdCol');
    const own = sprinkler(); own.append(tools(true)); cols[2]?.append(own);
    cols[2]?.append(el('<div class="mkAdd">＋ Karte hinzufügen</div>'));
    if (drag) {                                        // the pinboard on its way to the top of the middle column
      const pin = page.querySelector('.tdPin');
      if (pin && cols[1]) { cols[1].prepend(el('<div class="mkGhost"></div>')); pin.classList.add('mkDrag'); }
    }
  }
  const TYPES = [['🔘', 'Knopf', 'Szene, Skript oder Gerät mit einem Tipp'], ['⏻', 'Schalter', 'An / aus mit Schiebeschalter'], ['🔢', 'Wert', 'Eine Zahl groß, z. B. Temperatur, Akku'],
    ['📈', 'Verlauf', 'Linie der letzten Stunden oder Tage'], ['💡', 'Licht', 'An / aus, Helligkeit, Farbe'], ['🌡️', 'Thermostat', 'Ist, Soll mit − / +'],
    ['🪟', 'Rollladen', 'Auf, Stopp, Zu und Position'], ['📷', 'Kamera', 'Standbild, antippen: live'], ['🧩', 'Mehrere Geräte', 'Eine Liste mit Schaltern und Werten'],
    ['🏠', 'Raum', 'Eine Raum-Kachel wie unten im Haus'], ['📝', 'Text', 'Überschrift oder eigener Hinweis'], ['☀️', 'Fertige Karte', 'Wetter, Müll, Pinnwand … von anderen Seiten']];
  /** the window "Karte hinzufügen" over ☀ Heute in the edit mode */
  async function addCard() {
    await editToday();
    document.body.append(el(`<div class="mkModal"><div class="mkBox"><h3>＋ Karte hinzufügen</h3><p class="sub">Was soll die Karte zeigen? Danach wählst du das Gerät.</p>
      <div class="mkTypes">${TYPES.map(([i, n, d], k) => `<div class="mkType${k === 3 ? ' sel' : ''}"><span class="i">${i}</span><b>${n}</b><small>${d}</small></div>`).join('')}</div>
      <div class="mkBtns"><span class="mkB">Abbrechen</span><span class="mkB blue">Weiter ›</span></div></div></div>`));
  }
  /** a line chart of a day for the preview */
  function chart(w = 340, h = 120) {
    const pts = Array.from({ length: 25 }, (_, i) => [i, 9 + 5 * Math.sin((i - 9) / 24 * Math.PI * 2) + (i > 14 ? -1 : 0) + Math.sin(i * 1.7) * .4]);
    const x = (i) => 28 + i / 24 * (w - 36), y = (v) => h - 18 - (v - 2) / 14 * (h - 30);
    const d = pts.map(([i, v], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%"><g stroke="rgba(255,255,255,.12)">${[4, 8, 12, 16].map((v) => `<line x1="28" x2="${w - 8}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
      <g fill="#8b98a5" font-size="10">${[4, 8, 12, 16].map((v) => `<text x="2" y="${y(v) + 3}">${v}°</text>`).join('')}${[0, 6, 12, 18, 24].map((i) => `<text x="${x(i) - 6}" y="${h - 4}">${i}</text>`).join('')}</g>
      <path d="${d} L${x(24)},${h - 18} L${x(0)},${h - 18} Z" fill="rgba(63,169,245,.18)"/><path d="${d}" fill="none" stroke="#3fa9f5" stroke-width="2.5"/></svg>`;
  }
  /** the card editor: the device chosen from a searchable list, name, time span, width; the preview on the right */
  async function cardEditor() {
    await editToday();
    document.body.append(el(`<div class="mkModal"><div class="mkBox"><h3>📈 Karte „Verlauf“ einstellen</h3><p class="sub">Links einstellen, rechts siehst du gleich, wie sie aussieht.</p>
      <div class="mkCols"><div>
        <div class="mkF"><label>Gerät</label><div class="mkIn">🔎 außen<small>3 Treffer</small></div>
          <div class="mkList"><div class="on">🌡️ Außentemperatur <small>sensor.aussen_temp</small></div><div>💧 Außen Luftfeuchte <small>sensor.aussen_feuchte</small></div><div>☀️ Außen Helligkeit <small>sensor.aussen_lux</small></div></div></div>
        <div class="mkF"><label>Name auf der Karte</label><div class="mkIn">Draußen</div></div>
        <div class="mkF"><label>Zeitraum</label><div class="mkSeg"><span>6 Std.</span><span class="on">24 Std.</span><span>7 Tage</span><span>30 Tage</span></div></div>
        <div class="mkF"><label>Breite</label><div class="mkSeg"><span>schmal</span><span class="on">normal</span><span>breit</span><span>ganze Zeile</span></div></div>
        <div class="mkF"><label>Farbe</label><div class="mkSeg"><span class="on">🔵 Blau</span><span>🟠 Orange</span><span>🟢 Grün</span><span>🔴 Rot</span></div></div>
      </div><div class="mkPrev"><small>Vorschau</small><div class="tpCard"><h3 class="peH">📈 Draußen</h3><div style="display:flex;align-items:baseline;gap:10px"><span style="font-size:34px;font-weight:800">14,0°</span><span style="color:var(--muted)">höchstens 15,8° · tiefstens 4,6°</span></div>${chart()}</div></div></div>
      <div class="mkBtns"><span class="mkB">‹ Zurück</span><span class="mkB">Abbrechen</span><span class="mkB blue">✓ Karte hinzufügen</span></div></div></div>`));
  }
  function gardenTab(active = true) {
    const bar = document.getElementById('tabBar'), fam = bar.querySelector('[data-tab=family]');
    bar.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', false));
    const b = el(`<button type="button" class="mkTab${active ? ' active' : ''}"><span class="ti">🌱</span>Garten</button>`);
    bar.insertBefore(b, fam?.nextSibling || bar.querySelector('.tbFull'));
    return b;
  }
  /** an own page "🌱 Garten", filled with own cards */
  async function ownPage() {
    setup(); await tab('family');
    gardenTab(); document.body.classList.add('mkGarden');
    const page = document.querySelector('[data-page=family]');
    page.replaceChildren(el('<div class="tpHead"><h2>🌱 Garten</h2><span class="tpSub">eigene Seite · ✎ zum Bearbeiten</span></div>'), el(`<div class="mkGrid">
      <div class="mkC"><h4>💧 Bewässerung</h4><div class="mkRow"><span class="g"><span class="big" style="font-size:24px">läuft</span><br><span class="muted">noch 12 min · Rasen vorne</span></span><span class="mkSw"></span></div></div>
      <div class="mkC"><h4>🌱 Bodenfeuchte</h4><span class="big">34 %</span><span class="muted"> trocken ab 25 %</span><div class="mkBar"><i style="width:34%"></i></div></div>
      <div class="mkC mkSpan2"><h4>📈 Draußen, 24 Std.</h4><div style="display:flex;align-items:baseline;gap:10px"><span class="big">14,0°</span><span class="muted">höchstens 15,8° · tiefstens 4,6°</span></div>${chart(560, 110)}</div>
      <div class="mkC"><h4>🤖 Rasenmäher</h4><div class="mkRow"><span class="g"><b style="font-size:18px">mäht</b><br><span class="muted">🔋 80 % · seit 14:10</span></span></div>
        <div class="mkRow" style="margin-top:10px;gap:6px"><span class="mkB">⏸ Pause</span><span class="mkB">🏠 Heim</span></div></div>
      <div class="mkC"><h4>💡 Gartenlicht</h4><div class="mkRow"><span class="g"><b style="font-size:18px">an · 70 %</b></span><span class="mkSw"></span></div><div class="mkSlider"></div></div>
      <div class="mkC"><h4>🏊 Pool</h4><div class="mkRow"><span class="g"><span class="big">24,5°</span><br><span class="muted">Pumpe</span></span><span class="mkSw off"></span></div></div>
      <div class="mkC" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center"><span style="font-size:40px">🔥</span><b style="font-size:18px">Grillabend</b><span class="muted">Szene · Licht, Musik</span></div>
    </div>`));
  }
  /** the tab bar in the edit mode: every tab can be moved, "+ Seite"; the window for a new page */
  async function newPage() {
    setup(); await tab('today');
    document.body.classList.add('mkTabEdit');
    const bar = document.getElementById('tabBar');
    bar.querySelector('.tbFull')?.replaceWith(el('<button type="button" class="mkTab" style="color:var(--accent)"><span class="ti">＋</span>Seite</button>'));
    const page = freeze(document.querySelector('[data-page=today]'));
    page.prepend(el(`<div class="mkStrip"><b>✎ Reiter bearbeiten</b><span class="sub">Unten Reiter ziehen, um die Reihenfolge zu ändern · ＋ Seite legt eine eigene an · wer welche Reiter sieht: ⚙ → Benutzer & Tablets</span><span class="mkB blue">✓ Fertig</span></div>`));
    const emo = ['🌱', '🏊', '🚗', '🐶', '🎮', '🛏️', '🍳', '🧒', '🏡', '🔧', '🌤️', '🔒', '🎄', '🎉', '📚', '💼', '🧘', '🐔', '🚲', '⭐'];
    document.body.append(el(`<div class="mkModal"><div class="mkBox" style="width:min(640px,calc(100vw - 40px))"><h3>＋ Neue Seite</h3><p class="sub">Eine eigene Seite unten in der Leiste, für alle gleich. Danach füllst du sie mit Karten.</p>
      <div class="mkF"><label>Name</label><div class="mkIn">Garten</div></div>
      <div class="mkF"><label>Symbol</label><div class="mkEmo">${emo.map((e, i) => `<span class="${i ? '' : 'on'}">${e}</span>`).join('')}</div></div>
      <div class="mkF"><label>Anfangen mit</label><div class="mkSeg"><span>leerer Seite</span><span class="on">Vorschlag: alle Geräte des Bereichs „Garten“</span><span>Kopie von „Heute“</span></div></div>
      <div class="mkF"><label>Kommt in der Leiste</label><div class="mkSeg"><span>vorne</span><span class="on">nach „Familie“</span><span>hinten</span></div></div>
      <div class="mkBtns"><span class="mkB">Abbrechen</span><span class="mkB blue">✓ Seite anlegen</span></div></div></div>`));
  }
  /** Klima in the edit mode: the room cards in their own order, one hidden, the tip card moved up */
  async function editClimate() {
    setup(); await tab('climate');
    const page = document.querySelector('[data-page=climate]');
    page.prepend(strip('Klima'));
    const cards = [...page.querySelectorAll('.clCard, .clBelow > .tpCard')];
    cards.forEach((c) => { c.classList.add('mkE'); c.append(tools(false)); });
    const kueche = cards.find((c) => c.querySelector('.clName')?.textContent === 'Küche');
    if (kueche) { kueche.classList.add('mkOff'); kueche.prepend(el('<span class="mkOffTag">ausgeblendet</span>')); }
    freeze(page);
    page.querySelector('.clGrid')?.append(el('<div class="mkAdd">＋ Karte hinzufügen</div>'));
  }
  return { editToday, addCard, cardEditor, ownPage, newPage, editClimate };
})();
