/* Beispielbilder für docs/ideen-5.21 (2026-11-20): Haus-Check, Erste Schritte und drei neue Vorschläge, nur fürs Foto in die echte Demo gemalt (nichts wird gespeichert,
 * nichts geschaltet). Karten und Marken liegen als HTML über dem 3D-Bild; eine Marke sitzt dort, wo das Gerät oder Fenster im Bild ist
 * (window.__fp.screenOf). Aufruf über make_pictures.py: mockIdea(1 … 5, { variant }). */
(() => {
  const css = (id, s) => { let e = document.getElementById(id); if (!e) { e = document.createElement('style'); e.id = id; document.head.append(e); } e.textContent = s; };
  const $ = (s, r = document) => r.querySelector(s);
  const fp = () => window.__fp;
  const layer = () => {
    let l = $('#mkLayer');
    if (!l) { l = document.createElement('div'); l.id = 'mkLayer'; document.body.append(l); }
    return l;
  };
  const clear = () => { layer().innerHTML = ''; };
  const add = (html, style = {}) => { const d = document.createElement('div'); d.innerHTML = html; Object.assign(d.style, style); layer().append(d.firstElementChild || d); return layer().lastElementChild; };
  /** a card at a fixed place on the screen */
  const card = (html, pos, w = 360) => add(`<div class="mkCard" style="width:${w}px">${html}</div>`, {}) && Object.assign(layer().lastElementChild.style, pos);
  /** a small sign over device / window `id` (dx, dy: shift on screen) */
  function mark(id, html, cls = '', dx = 0, dy = 0) {
    const p = fp().screenOf(id);
    if (!p) { console.warn('no screen point for', id); return null; }
    const e = add(`<div class="mkMark ${cls}">${html}</div>`);
    e.style.left = `${p.x + dx}px`; e.style.top = `${p.y + dy}px`;
    return p;
  }
  /** a glowing dotted line through the screen points of `ids` */
  function path(ids, color = '#ffd27a') {
    const pts = ids.map((id) => fp().screenOf(id)).filter(Boolean);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    add(`<svg class="mkSvg" width="${innerWidth}" height="${innerHeight}"><path d="${d}" stroke="${color}" stroke-width="22" opacity=".35" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" stroke="${color}" stroke-width="7" stroke-dasharray="2 14" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    return pts;
  }
  /** sun rays from screen point (sx, sy) to the windows `ids` */
  function rays(sx, sy, ids) {
    const pts = ids.map((id) => fp().screenOf(id)).filter(Boolean);
    add(`<svg class="mkSvg" width="${innerWidth}" height="${innerHeight}">${pts.map((p) => `<line x1="${sx}" y1="${sy}" x2="${p.x}" y2="${p.y}" stroke="#ffc83c" stroke-width="18" opacity=".18" stroke-linecap="round"/>
      <line x1="${sx}" y1="${sy}" x2="${p.x}" y2="${p.y}" stroke="#ffd65a" stroke-width="3" stroke-dasharray="10 8"/>`).join('')}</svg>`);
    add(`<div class="mkSun" style="left:${sx}px;top:${sy}px">☀️</div>`);
  }
  const row = (a, b = '', cls = '') => `<div class="mkRow ${cls}"><span>${a}</span><b>${b}</b></div>`;
  const sw = (on = true) => `<span class="mkSw ${on ? 'on' : ''}"><i></i></span>`;
  const btn = (t, cls = '') => `<span class="mkBtn ${cls}">${t}</span>`;
  const chip = (t, cls = '') => `<span class="mkChip ${cls}">${t}</span>`;

  css('mkCss', `
    #mkLayer { position: fixed; inset: 0; z-index: 9000; pointer-events: none; font-family: inherit; }
    #mkLayer .mkSvg { position: absolute; left: 0; top: 0; }
    .mkCard { position: absolute; background: rgba(20, 26, 38, .94); color: #eef2f7; border: 1px solid rgba(255,255,255,.14); border-radius: 16px;
      padding: 14px 16px; box-shadow: 0 10px 40px rgba(0,0,0,.45); font-size: 14px; line-height: 1.35; backdrop-filter: blur(8px); }
    .mkCard h3 { margin: 0 0 4px; font-size: 18px; display: flex; align-items: center; gap: 8px; }
    .mkCard .mkSub { color: #9fb0c6; font-size: 12.5px; margin-bottom: 10px; }
    .mkCard h4 { margin: 12px 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #8fa3bd; }
    .mkRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 10px; margin: 4px 0; border-radius: 10px; background: rgba(255,255,255,.05); }
    .mkRow b { font-weight: 600; white-space: nowrap; }
    .mkRow.warn { background: rgba(240, 160, 40, .16); } .mkRow.bad { background: rgba(230, 70, 60, .18); } .mkRow.good { background: rgba(60, 190, 110, .14); }
    .mkSw { width: 40px; height: 22px; border-radius: 11px; background: #44506a; display: inline-block; position: relative; vertical-align: middle; }
    .mkSw i { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; }
    .mkSw.on { background: #2f9e5b; } .mkSw.on i { left: 21px; }
    .mkBtn { display: inline-block; padding: 7px 12px; border-radius: 10px; background: #2b3a55; margin: 3px 4px 3px 0; font-weight: 600; font-size: 13px; }
    .mkBtn.blue { background: #2f7dd8; } .mkBtn.green { background: #2f9e5b; } .mkBtn.red { background: #c9443a; } .mkBtn.ghost { background: rgba(255,255,255,.08); }
    .mkChip { display: inline-block; padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,.1); font-size: 12.5px; margin: 2px 4px 2px 0; }
    .mkChip.sun { background: rgba(255, 196, 60, .25); color: #ffd979; } .mkChip.red { background: rgba(230,70,60,.3); color: #ffb2aa; }
    .mkChip.green { background: rgba(60,190,110,.25); color: #9ff0bf; } .mkChip.yellow { background: rgba(240,190,40,.28); color: #ffe08a; }
    .mkMark { position: absolute; transform: translate(-50%, -100%); white-space: nowrap; padding: 5px 10px; border-radius: 12px; font-weight: 700; font-size: 13px;
      background: rgba(20,26,38,.92); color: #fff; border: 2px solid #fff; box-shadow: 0 4px 16px rgba(0,0,0,.4); }
    .mkMark::after { content: ''; position: absolute; left: 50%; bottom: -9px; transform: translateX(-50%); border: 7px solid transparent; border-top-color: inherit; border-bottom: 0; }
    .mkMark.sun { background: #f2a516; border-color: #ffe08a; color: #231600; } .mkMark.shade { background: #3a4a66; border-color: #8fa3bd; }
    .mkMark.good { background: #23874b; border-color: #8ff0b4; } .mkMark.mid { background: #c79a10; border-color: #ffe08a; color: #231600; } .mkMark.bad { background: #c9443a; border-color: #ffb2aa; }
    .mkMark.dot { padding: 0; width: 22px; height: 22px; border-radius: 50%; transform: translate(-50%, -50%); }
    .mkMark.dot::after { display: none; }
    .mkMark.sig { width: 26px; height: 26px; box-shadow: 0 0 0 6px rgba(255,255,255,.15), 0 0 18px rgba(0,0,0,.5); }
    .mkMark.glow { background: #ffd27a; border-color: #fff4cf; color: #2a1c00; box-shadow: 0 0 30px 12px rgba(255, 210, 122, .55); }
    .mkMark.tool { background: #e0832b; border-color: #ffd0a0; }
    .mkMark.guest { background: #6a4fd8; border-color: #c8bbff; }
    .mkRing { position: absolute; transform: translate(-50%, -50%); border-radius: 50%; border: 4px solid #ff4d40; box-shadow: 0 0 0 8px rgba(255,77,64,.25), 0 0 40px rgba(255,77,64,.6); }
    .mkBar { height: 10px; border-radius: 5px; background: rgba(255,255,255,.08); overflow: hidden; margin-top: 4px; }
    .mkBar i { display: block; height: 100%; border-radius: 5px; }
    .mkTl { display: grid; grid-template-columns: 124px 1fr; gap: 4px 8px; align-items: center; font-size: 12.5px; margin-top: 6px; }
    .mkTl .tr { position: relative; height: 14px; background: rgba(255,255,255,.06); border-radius: 4px; }
    .mkTl .tr i { position: absolute; top: 0; bottom: 0; background: #ffd27a; border-radius: 4px; opacity: .9; }
    .mkTl .ax { display: flex; justify-content: space-between; color: #8fa3bd; font-size: 11px; grid-column: 2; }
    .mkQr { width: 120px; height: 120px; background: #fff; border-radius: 8px; padding: 8px; display: grid; grid-template-columns: repeat(21, 1fr); }
    .mkQr i { background: #fff; } .mkQr i.b { background: #111; }
    #roomTiles, #sceneBar, #roomLabels, #skyChips, #floorCards { visibility: hidden !important; }
    .mkSun { position: absolute; font-size: 64px; transform: translate(-50%, -50%); filter: drop-shadow(0 0 24px rgba(255,200,60,.9)); }
  `);

  const hide = (sel) => { const e = $(sel); if (e) e.style.visibility = 'hidden'; };

  /* ---------- the nine ideas ---------- */
  /* ---------- the ideas ---------- */
  const IDEAS = {
    /* 🩺 Haus-Check (with 🔧 Wartung): everything that needs a look, in one place */
    1() {
      mark('dc_ac', '🔧 Filter', 'tool'); mark('d18', '📡 schwach', 'mid', 0, -6); mark('d12', '🔋 9 %', 'bad', 0, -4);
      card(`<h3>🩺 Haus-Check</h3><div class="mkSub">Alles, was einen Blick braucht – an einem Ort. Ein Tipp zeigt es im Haus.</div>
        <div style="display:flex;gap:6px;margin-bottom:8px">${chip('2 dringend', 'red')}${chip('3 bald', 'yellow')}${chip('41 in Ordnung', 'green')}</div>
        <h4>Dringend</h4>
        ${row('🔋 Fenster Küche · Batterie 9 %', btn('Zeigen', 'ghost'), 'bad')}${row('📴 Bewegungsmelder Flur · offline seit 2 Tagen', btn('Zeigen', 'ghost'), 'bad')}
        <h4>Bald</h4>
        ${row('🔧 Klimaanlage Büro · Filter reinigen', btn('✓ Erledigt', 'green'), 'warn')}${row('📡 Thermostat Büro · Funk schwach (LQI 31)', btn('Zeigen', 'ghost'), 'warn')}
        ${row('⬆ Home Assistant 2026.12 · Update da', btn('Ansehen', 'ghost'), 'warn')}
        <h4>Wartung</h4>
        ${row('🚨 Rauchmelder testen', 'in 3 Wochen')}${row('🔥 Heizkörper entlüften', 'im Oktober')}
        <div style="margin-top:8px">${btn('+ Erinnerung', 'blue')}${btn('Vorschläge für meine Geräte', 'ghost')}</div>`, { right: '24px', top: '64px' }, 420);
      add('<div class="mkMark tool" style="left:13%;top:112px;font-size:15px">🩺 2</div>');
    },
    /* 🧭 Erste Schritte: the assistant for a new house */
    2() {
      card(`<h3>🧭 Erste Schritte</h3><div class="mkSub">In vier Schritten vom leeren Plan zum fertigen Haus – jederzeit unterbrechen, später weitermachen.</div>
        ${row('✅ 1 · Grundriss zeichnen oder Vorlage', 'fertig', 'good')}
        ${row('✅ 2 · Räume mit den Bereichen von Home Assistant verbinden', '8 von 9', 'good')}
        <div class="mkRow warn" style="display:block"><b>➡ 3 · Geräte setzen</b><div class="mkSub" style="margin:4px 0 6px">
          Home Assistant kennt 46 Geräte in deinen Bereichen. Das Add-on stellt sie in ihren Raum – du schiebst sie danach an die richtige Stelle.</div>
          ${btn('✨ Alle 46 automatisch setzen', 'blue')}${btn('Einzeln', 'ghost')}</div>
        ${row('4 · Live-Ansicht, Reiter und Tablets', 'danach')}
        <div class="mkBar" style="margin-top:10px"><i style="width:55%;background:#2f9e5b"></i></div>
        <div class="mkSub" style="margin-top:4px">55 % · ⏭ Überspringen · 🎬 Video dazu</div>`, { left: '50%', top: '90px', transform: 'translateX(-50%)' }, 520);
    },
    /* ☀ Sonnenstrom-Tipp: when the sun makes more than the house uses */
    3() {
      mark('pv_dach', '☀ 4,1 kW', 'sun', 0, -10);
      card(`<h3>☀ Jetzt ist Sonnenstrom übrig</h3><div class="mkSub">Das Dach macht 4,1 kW, das Haus braucht 0,9 kW – 3,2 kW gehen sonst fürs Einspeisen weg (8 ct statt 32 ct).</div>
        <h4>Gute Zeit für</h4>
        ${row('🫧 Waschmaschine starten', btn('▶ Jetzt', 'green'))}${row('🍽 Spülmaschine', btn('▶ Jetzt', 'green'))}${row('🚗 Auto laden (Wallbox)', btn('▶ Jetzt', 'green'))}
        <h4>Heute noch</h4>
        <div class="mkTl"><span>☀ übrig</span><div class="tr"><i style="left:8%;width:46%;background:#f2b416"></i></div>
          <div class="ax"><span>9</span><span>11</span><span>13</span><span>15</span><span>17 Uhr</span></div></div>
        <div class="mkSub" style="margin-top:8px">Bis etwa 14:30 · auch als Nachricht aufs Handy, wenn du willst</div>`, { right: '24px', top: '64px' }, 400);
      add('<div class="mkMark sun" style="left:44%;top:120px;transform:translateX(-50%);font-size:16px">☀ 3,2 kW übrig – jetzt waschen?</div>');
    },
    /* 💧 Leck-Wächter: water at night */
    4() {
      mark('k_m1', '💧 0,8 l/h nachts', 'bad', 0, -6);
      card(`<h3>💧 Leck-Wächter</h3><div class="mkSub">Der Wasserzähler läuft nachts (2–5 Uhr), obwohl alle schlafen – das kann ein tropfender Hahn oder eine undichte Toilette sein.</div>
        <div style="font-size:30px;font-weight:800">0,8 l/h <span style="font-size:15px;font-weight:600;color:#ffb2aa">≈ 7 m³ im Jahr</span></div>
        ${row('Letzte 7 Nächte', '▁▁▂▅▆▆▇')}${row('Seit', 'Mittwoch, vorher 0')}
        <div class="mkSub" style="margin:10px 0 6px">💡 Tipp: Spülkasten im Bad oben prüfen – dort ist es am häufigsten.</div>
        ${btn('🔔 Bei mehr als 2 l/h warnen', 'blue')}${btn('Ist in Ordnung', 'ghost')}`, { right: '24px', top: '64px' }, 400);
    },
    /* 🧾 Geräte-Steckbrief: manual, warranty, purchase per device */
    5() {
      mark('k_d7', '🧾', 'tool', 0, -6);
      card(`<h3>🫧 Waschmaschine · Steckbrief</h3><div class="mkSub">Alles zu einem Gerät an einer Stelle – ein Tipp auf das Gerät im Haus.</div>
        ${row('Hersteller / Modell', 'Bosch WAX32M40')}${row('Gekauft', 'März 2023 · MediaMarkt')}
        ${row('🛡 Garantie', 'noch 4 Monate', 'warn')}${row('📄 Anleitung', btn('PDF öffnen', 'ghost'))}${row('🧾 Rechnung', btn('Foto', 'ghost'))}
        <h4>Wartung</h4>${row('Flusensieb reinigen', 'alle 3 Monate · in 9 Tagen')}
        <h4>Verbrauch</h4>${row('Strom diesen Monat', '14 kWh · 4,50 €')}
        <div style="margin-top:8px">${btn('✏ Bearbeiten', 'blue')}${btn('🔧 Erinnerung', 'ghost')}</div>`, { right: '24px', top: '64px' }, 400);
    },
  };

  window.mockIdea = (n, o = {}) => {
    clear();
    const r = IDEAS[n](o);
    return r || layer().children.length;
  };
})();
