// Only for the example pictures in this folder (injected into the demo with ?debug=1, see make_pictures.py), not part of the add-on.
// Mock-up of a wish of 2026-11-08: a button in the thermostat (🌡 Klima and the own card "Thermostat"): hold it, choose "Heizplan
// aussetzen" for 30 / 45 minutes, an hour or the rest of the day; meanwhile nobody's rule turns the thermostat back, one regulates by
// hand; an admin chooses who sees the button (per user like the other locks, per card / page).
window.mkPause = (() => {
  const css = `
  .mkLayer { position: fixed; inset: 0; z-index: 80; pointer-events: none; }
  .mkLayer .clCard { position: absolute; margin: 0; box-shadow: 0 0 0 3px #b48cff, 0 18px 50px rgba(0,0,0,.55); background: var(--panel); }
  .mkPause { display: flex; align-items: center; gap: 10px; width: 100%; margin: 12px 0 2px; padding: 9px 14px; border-radius: 14px; position: relative;
    overflow: hidden; border: 1px solid rgba(180, 140, 255, .65); background: rgba(180, 140, 255, .12); color: var(--text); font: inherit; text-align: left; }
  .mkPause .i { font-size: 22px; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: rgba(180, 140, 255, .25); flex: none; }
  .mkPause b { display: block; font-size: 15px; } .mkPause small { display: block; color: var(--muted); font-size: 12px; font-weight: 600; }
  .mkPause.hold::before { content: ''; position: absolute; inset: 0; width: 72%; background: linear-gradient(90deg, rgba(180, 140, 255, .45), rgba(180, 140, 255, .2)); }
  .mkPause.hold > * { position: relative; }
  .mkPause.on { border-color: #46a758; background: rgba(70, 167, 88, .14); } .mkPause.on .i { background: rgba(70, 167, 88, .3); }
  .mkFinger { position: absolute; z-index: 3; font-size: 40px; filter: drop-shadow(0 4px 8px rgba(0,0,0,.6)); }
  .mkSheet { position: absolute; width: 330px; padding: 16px; border-radius: 18px; background: var(--panel); border: 1px solid #b48cff; color: var(--text);
    box-shadow: 0 24px 70px rgba(0,0,0,.65); backdrop-filter: blur(12px); }
  .mkSheet h4 { margin: 0 0 4px; font-size: 17px; } .mkSheet p { margin: 0 0 12px; color: var(--muted); font-size: 13px; line-height: 1.35; }
  .mkOpt { display: flex; align-items: center; gap: 10px; padding: 11px 13px; margin: 6px 0; border-radius: 12px; background: var(--field); border: 1px solid var(--line); font-weight: 700; font-size: 15px; }
  .mkOpt small { margin-left: auto; color: var(--muted); font-weight: 600; font-size: 13px; }
  .mkOpt.pick { border-color: #b48cff; background: rgba(180, 140, 255, .2); }
  .mkFoot { display: flex; align-items: center; gap: 8px; margin-top: 10px; color: var(--muted); font-size: 12.5px; }
  .mkFoot .x { margin-left: auto; padding: 6px 12px; border-radius: 10px; border: 1px solid var(--line); font-weight: 700; color: var(--text); }
  .mkNote { position: absolute; z-index: 5; max-width: 300px; padding: 10px 14px; border-radius: 12px; background: #ffd45c; color: #2a2100; font-weight: 700;
    font-size: 14px; line-height: 1.35; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
  .mkNote::before { content: '💡 '; }
  .mkNew { position: absolute; top: -11px; right: 14px; padding: 2px 10px; border-radius: 999px; background: #46a758; color: #fff; font-size: 12px; font-weight: 800; z-index: 3; }
  .hrLine.mkMan { background: rgba(180, 140, 255, .16); box-shadow: inset 3px 0 0 #b48cff; }
  .mkTag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 800; background: rgba(180, 140, 255, .22);
    color: #d9c7ff; border: 1px solid rgba(180, 140, 255, .7); }
  /* the admin's settings */
  .mkModal { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,.6); display: grid; place-items: center; pointer-events: none; }
  .mkCols { display: grid; grid-template-columns: 1.15fr 1fr 1fr; gap: 16px; width: min(1340px, calc(100vw - 40px)); }
  .mkC { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 16px 18px; color: var(--text); position: relative; box-shadow: 0 24px 60px rgba(0,0,0,.55); }
  .mkC .where { color: var(--muted); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  .mkC h3 { margin: 0 0 12px; font-size: 18px; display: flex; align-items: center; gap: 10px; }
  .mkC h3 .mkSw { margin-left: auto; }
  .mkC h5 { margin: 14px 0 7px; font-size: 13px; color: var(--muted); }
  .mkRow { display: flex; align-items: center; gap: 10px; padding: 7px 0; font-size: 14px; font-weight: 600; border-top: 1px solid var(--line); }
  .mkRow:first-of-type { border-top: 0; } .mkRow .mkSw, .mkRow .mkBox { margin-left: auto; } .mkRow small { color: var(--muted); font-weight: 600; display: block; font-size: 12px; }
  .mkSw { width: 42px; height: 24px; border-radius: 999px; background: var(--field); border: 1px solid var(--line); position: relative; flex: none; }
  .mkSw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #8b98a5; }
  .mkSw.on { background: #46a758; border-color: #46a758; } .mkSw.on::after { left: 21px; background: #fff; }
  .mkBox { width: 22px; height: 22px; border-radius: 6px; border: 2px solid var(--muted); display: grid; place-items: center; font-weight: 900; font-size: 14px; flex: none; }
  .mkBox.on { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
  .mkSeg { display: flex; gap: 6px; flex-wrap: wrap; } .mkSeg span { padding: 6px 11px; border-radius: 999px; border: 1px solid var(--line); background: var(--field); font-weight: 700; font-size: 13px; }
  .mkSeg span.on { background: color-mix(in srgb, #b48cff 30%, transparent); border-color: #b48cff; }
  .mkField { padding: 8px 12px; border-radius: 10px; background: var(--field); border: 1px solid var(--line); font-weight: 600; font-size: 14px; }
  .mkUser { padding: 10px 12px; border-radius: 12px; background: var(--field); margin-bottom: 8px; }
  .mkUser b { font-size: 15px; } .mkUser .mkRow { border-color: rgba(255,255,255,.06); padding: 5px 0; font-size: 13.5px; }
  .mkHi { outline: 2px solid #b48cff; outline-offset: 3px; border-radius: 8px; }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);
  const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const layer = () => { const l = h('<div class="mkLayer"></div>'); document.body.append(l); return l; };

  /** the living room's card, copied over the page (the page may draw itself again meanwhile), with the plan's line instead of the window */
  function card(l) {
    const src = document.querySelector('.clCard[data-room=r1]'), r = src.getBoundingClientRect();
    const c = src.cloneNode(true);
    Object.assign(c.style, { left: `${r.left}px`, top: `${r.top - 6}px`, width: `${r.width}px`, height: 'auto', minHeight: `${r.height + 6}px`, gridColumn: '', gridRowEnd: '' });
    c.querySelector('.hrLine')?.remove();
    c.querySelector('.clRow')?.remove();
    c.querySelector('.rsRoom')?.remove();
    const line = h('<div class="hrLine"><span>☀️ Heizplan: Komfort 22° (bis 17:00)</span></div>');
    c.querySelector('.hrRoom').prepend(line);
    l.append(c);
    return c;
  }
  const button = (cls = '', b = 'Heizplan aussetzen', s = 'gedrückt halten · dann regelst du selbst', i = '⏸️') =>
    h(`<button class="mkPause ${cls}"><span class="i">${i}</span><span><b>${b}</b><small>${s}</small></span></button>`);
  const note = (l, text, x, y) => { const n = h(`<div class="mkNote">${text}</div>`); Object.assign(n.style, { left: `${x}px`, top: `${y}px` }); l.append(n); };

  /** 1: the new button under − / + */
  function knopf() {
    const l = layer(), c = card(l);
    c.querySelector('.thPM').after(button());
    c.append(h('<span class="mkNew">NEU</span>'));
    const r = c.getBoundingClientRect(), b = c.querySelector('.mkPause').getBoundingClientRect();
    note(l, 'Ein neuer Knopf in jedem Thermostat: kurz antippen tut nichts (kein Versehen), gedrückt halten öffnet die Auswahl.', r.right + 24, b.top - 30);
  }
  /** 2: held down: the choice of how long */
  function auswahl() {
    const l = layer(), c = card(l);
    c.querySelector('.thPM').after(button('hold', 'Heizplan aussetzen', 'halten … gleich geht die Auswahl auf'));
    const b = c.querySelector('.mkPause').getBoundingClientRect();
    const f = h('<div class="mkFinger">👆</div>'); Object.assign(f.style, { left: `${b.left + b.width * 0.62}px`, top: `${b.top + 8}px` }); l.append(f);
    const s = h(`<div class="mkSheet">
      <h4>⏸️ Heizplan aussetzen · Wohnzimmer</h4>
      <p>So lange stellt keine Regel das Thermostat zurück. Du drehst selbst, danach gilt wieder der Heizplan.</p>
      <div class="mkOpt">⏱ 30 Minuten <small>bis 13:00</small></div>
      <div class="mkOpt pick">⏱ 45 Minuten <small>bis 13:15</small></div>
      <div class="mkOpt">⏱ 1 Stunde <small>bis 13:30</small></div>
      <div class="mkOpt">📅 Bis zum nächsten Block <small>bis 17:00</small></div>
      <div class="mkOpt">🌙 Für heute <small>bis Mitternacht</small></div>
      <div class="mkFoot">🪟 Fenster offen schaltet trotzdem ab <span class="x">Abbrechen</span></div></div>`);
    const r = c.getBoundingClientRect();
    Object.assign(s.style, { left: `${r.right + 22}px`, top: `${Math.max(70, b.top - 300)}px` });
    l.append(s);
  }
  /** 3: paused: the line says until when, − / + are the user's own, "Fortsetzen" ends it early */
  function pausiert() {
    const l = layer(), c = card(l);
    c.querySelector('.thT').firstChild.textContent = '23,5';
    c.querySelector('.clBadge').replaceWith(h('<span class="mkTag">⏸️ bis 13:15</span>'));
    c.querySelector('.thPM').after(button('on', 'Heizplan fortsetzen', 'antippen · sofort wieder 22° (Komfort)', '▶'));
    c.querySelector('.hrLine').replaceWith(h('<div class="hrLine mkMan"><span>⏸️ Heizplan ausgesetzt bis 13:15 · du regelst selbst (23,5°)</span><button class="tpChip">＋15 Min</button></div>'));
    const r = c.getBoundingClientRect();
    note(l, 'Solange die Pause läuft, bleibt dein Wert. Kein „nach 10 Min zurück“, auch Abwesend, Nacht und Zu warm warten.', r.right + 24, r.top + 120);
    note(l, 'Danach stellt das Add-on wieder den Heizplan ein (um 13:15 also 22° Komfort).', r.right + 24, r.top + 260);
  }
  /** 4: what an admin sets: the rule, the card, the users */
  function einstellen() {
    const m = h(`<div class="mkModal"><div class="mkCols">
      <div class="mkC"><span class="mkNew">NEU</span><div class="where">🌡 Klima → 📋 Heiz-Regeln</div>
        <h3>⏸️ Heizplan aussetzen <span class="mkSw on"></span></h3>
        <h5>Diese Zeiten stehen zur Wahl</h5>
        <div class="mkSeg"><span>15 Min</span><span class="on">30 Min</span><span class="on">45 Min</span><span class="on">1 Std</span><span>2 Std</span><span class="on">Bis nächster Block</span><span class="on">Für heute</span></div>
        <h5>Was gilt trotzdem?</h5>
        <div class="mkRow">🪟 Fenster offen → Heizung aus<small></small><span class="mkSw on"></span></div>
        <div class="mkRow"><span>🔥 Zu warm → 5° runter<small>aus = man darf auch zu warm heizen</small></span><span class="mkSw"></span></div>
        <div class="mkRow"><span>✈️ Urlaub, 🚶 Abwesend, 🌙 Nacht<small>aus = sie warten bis zum Ende der Pause</small></span><span class="mkSw"></span></div>
        <h5>Höchstens</h5><div class="mkSeg"><span>2 Std</span><span>bis Mitternacht</span><span class="on">bis morgen früh 6:00</span></div></div>
      <div class="mkC"><div class="where">Seite bearbeiten → ⚙ an der Karte</div>
        <h3>🌡️ Karte „Thermostat“</h3>
        <div class="mkRow">Gerät <span class="mkField" style="margin-left:auto">Wohnzimmer Thermostat</span></div>
        <div class="mkRow">Größe <span class="mkSeg" style="margin-left:auto"><span class="on">Groß</span><span>Klein</span></span></div>
        <div class="mkRow mkHi"><span>⏸️ Knopf „Heizplan aussetzen“<small>nur in dieser Karte, auf dieser Seite (oder Fassung)</small></span><span class="mkSw on"></span></div>
        <div class="mkRow"><span>Auslösen<small>Halten verhindert ein Versehen</small></span><span class="mkSeg" style="margin-left:auto"><span class="on">Gedrückt halten</span><span>Antippen</span></span></div>
        <h5 style="margin-top:18px">Auf der Seite 🌡 Klima</h5>
        <div class="mkRow"><span>Knopf in jeder Raum-Karte<small>wie 🚀 Boost</small></span><span class="mkSw on"></span></div></div>
      <div class="mkC"><div class="where">⚙ → Benutzer & Tablets</div>
        <h3>👥 Wer darf aussetzen?</h3>
        <div class="mkUser"><b>👤 Papa</b> <small style="color:var(--muted)">Admin</small>
          <div class="mkRow">Geräte schalten <span class="mkBox on">✓</span></div>
          <div class="mkRow mkHi">⏸️ Heizplan aussetzen <span class="mkBox on">✓</span></div></div>
        <div class="mkUser"><b>📱 Tablet Flur</b>
          <div class="mkRow">Geräte schalten <span class="mkBox on">✓</span></div>
          <div class="mkRow mkHi">⏸️ Heizplan aussetzen <span class="mkBox on">✓</span></div></div>
        <div class="mkUser"><b>🧒 Kinder</b>
          <div class="mkRow">Geräte schalten <span class="mkBox on">✓</span></div>
          <div class="mkRow mkHi">⏸️ Heizplan aussetzen <span class="mkBox"></span></div>
          <div class="mkRow" style="color:var(--muted);font-size:12.5px">ohne Haken: der Knopf ist für sie nicht da, das Add-on lehnt es auch ab</div></div></div>
    </div></div>`);
    document.body.append(m);
  }
  return { knopf, auswahl, pausiert, einstellen };
})();
