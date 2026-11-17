/* Beispielbilder für docs/ideen-5.15 (2026-11-17): neun neue Funktionen, nur fürs Foto in die echte Demo gemalt (nichts wird gespeichert,
 * nichts geschaltet). Karten und Marken liegen als HTML über dem 3D-Bild; eine Marke sitzt dort, wo das Gerät oder Fenster im Bild ist
 * (window.__fp.screenOf). Aufruf über make_pictures.py: mockIdea(1 … 9, { variant }). */
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
  const IDEAS = {
    /* ☀ Rollläden nach der Sonne */
    1(o) {
      if (o.variant === 'settings') {
        card(`<h3>☀ Sonnenschutz</h3><div class="mkSub">Rollläden fahren nur dort runter, wo die Sonne wirklich auf das Fenster scheint. Die Richtung jedes Fensters kennt das Haus schon.</div>
          ${row('Sonnenschutz an', sw(true))}
          <h4>Wann</h4>
          ${row('Sonne höher als', '15°')}${row('Draußen wärmer als', '22 °C')}${row('oder im Raum wärmer als', '24 °C')}${row('Nur wenn niemand im Raum ist', sw(false))}
          <h4>Wie weit</h4>
          ${row('Rollladen fährt auf', '30 %')}${row('Wieder hoch, wenn Sonne weg seit', '20 Min')}
          <h4>Fenster (selbst erkannt)</h4>
          ${row('🪟 Wohnzimmer · nach Süd-West', chip('☀ jetzt Sonne', 'sun'))}
          ${row('🪟 Küche · nach Süd', chip('☀ jetzt Sonne', 'sun'))}
          ${row('🪟 Schlafzimmer · nach Nord-Ost', chip('Schatten'))}
          ${row('🪟 Büro · nach Nord', chip('Schatten'))}
          <div style="margin-top:10px">${btn('▶ Jetzt ausprobieren', 'blue')}${btn('Ausnahme: Fenster offen → oben lassen', 'ghost')}</div>`, { right: '24px', top: '64px' }, 400);
        return;
      }
      rays(330, 300, ['o1', 'o3']);
      mark('o1', '☀ Sonne drauf · Rollladen 30 %', 'sun', 0, -14);
      mark('o3', '☀ Sonne drauf · Rollladen 30 %', 'sun', 0, -14);
      mark('o7', '☁ Schatten · bleibt oben', 'shade', 0, -14);
      mark('o9', '☁ Schatten · bleibt oben', 'shade', 0, -14);
      card(`<h3>☀ Sonnenschutz läuft</h3><div class="mkSub">15:30 · Sonne im Süd-Westen, 34° hoch · draußen 26 °C</div>
        ${row('🪟 Wohnzimmer', chip('▼ 30 %', 'sun'))}${row('🪟 Küche', chip('▼ 30 %', 'sun'))}${row('🪟 Schlafzimmer, Büro', chip('oben (Schatten)'))}
        <div class="mkSub" style="margin:8px 0 0">Um 17:10 ist die Sonne weg: dann fahren sie wieder hoch.</div>`, { right: '24px', top: '64px' }, 340);
    },
    /* 📡 Funk-Karte */
    2() {
      const sig = [['d4', 'good', '−52 dBm'], ['d5', 'good', '−58'], ['d10', 'mid', '−74'], ['d13', 'good', '−61'], ['d15', 'bad', '−89 dBm', -80], ['d18', 'mid', '−77'],
        ['d6', 'good', '−55'], ['d8', 'good', '−60'], ['d11', 'mid', '−79'], ['d14', 'bad', '−86 dBm', 0, -50], ['d16', 'bad', '−91 dBm', 70], ['d19', 'mid', '−72'], ['dc_ac', 'good', '−49']];
      sig.forEach(([id, c, v, dx = 0, dy = 0]) => (c === 'bad' ? mark(id, `📶 ${v}`, c, dx, dy - 16) : mark(id, '', `dot ${c} sig`)));
      mark('o3', '📡 Verstärker hier?', 'mid', 0, -40);
      card(`<h3>📡 Empfang im Haus</h3><div class="mkSub">Zigbee, Z-Wave, WLAN und Bluetooth: wie gut jedes Gerät seinen Sender hört</div>
        <div>${chip('● gut 7', 'green')}${chip('● mittel 4', 'yellow')}${chip('● schwach 3', 'red')}</div>
        <h4>Am schwächsten</h4>
        ${row('💧 Luftfeuchte Bad · Zigbee', '−91 dBm', 'bad')}${row('💡 Badlicht · Zigbee', '−89 dBm', 'bad')}${row('🌡 Schlafzimmer · Zigbee', '−86 dBm', 'bad')}
        <div class="mkSub" style="margin:10px 0 0">💡 Tipp: ein Zigbee-Gerät mit Strom (Steckdose, Lampe) zwischen Küche und Bad verstärkt das Netz. 3× „nicht erreichbar“ diese Woche: alle im Bad.</div>
        <div style="margin-top:8px">${btn('Zigbee')}${btn('WLAN', 'ghost')}${btn('Bluetooth', 'ghost')}</div>`, { right: '24px', top: '64px' }, 380);
    },
    /* 📸 Bild bei Alarm: the room marked in the house (the phone message is made by make_pictures.py) */
    3() {
      const p = fp().screenOf('k_d7');
      if (p) add(`<div class="mkRing" style="left:${p.x}px;top:${p.y}px;width:140px;height:140px"></div>`);
      mark('k_d7', '💧 Wasser!', 'bad', 0, -74);
      return p;
    },
    /* 🔌 Stromfresser */
    4() {
      [['d1', '📺 18 W · 47 €/Jahr', -40, -10], ['dc_sp', '🔊 6 W · 16 €', 30, 30], ['dc_ac', '❄ 9 W · 24 €', 60, -50], ['dc_fan', '🌀 3 W · 8 €'], ['d18', '🖥 22 W · 58 €', 0, 10]].forEach(([id, t, dx = 0, dy = 0]) => mark(id, t, 'bad', dx, dy));
      card(`<h3>🔌 Stromfresser</h3><div class="mkSub">Was das Haus zieht, wenn alle schlafen (2–5 Uhr, Mittel der letzten 14 Nächte)</div>
        <div style="font-size:30px;font-weight:800">142 W <span style="font-size:15px;font-weight:600;color:#ffb2aa">≈ 373 € im Jahr</span></div>
        <div class="mkBar"><i style="width:100%;background:linear-gradient(90deg,#c9443a 0 41%,#e0832b 41% 72%,#5d6f8a 72%)"></i></div>
        <div class="mkSub" style="margin:4px 0 8px">rot: Geräte im Standby · orange: läuft immer (Kühlschrank, Router) · grau: unbekannt</div>
        ${row('🖥 Büro: PC und Bildschirm', '22 W · 58 €', 'bad')}${row('📺 Fernseher Wohnzimmer', '18 W · 47 €', 'bad')}${row('❄ Klimaanlage Büro', '9 W · 24 €', 'bad')}${row('🔊 Lautsprecher', '6 W · 16 €', 'warn')}
        <div class="mkSub" style="margin:10px 0 6px">💡 Eine Steckdose schaltet nachts ab: spart etwa 105 € im Jahr.</div>
        ${btn('⏰ Nachts abschalten …', 'blue')}${btn('Ist in Ordnung', 'ghost')}`, { right: '24px', top: '64px' }, 380);
    },
    /* 🏠 Urlaubs-Licht */
    5() {
      ['d4', 'd10', 'd13'].forEach((id) => mark(id, '', 'dot glow'));
      const bars = (list) => `<div class="tr">${list.map(([a, b]) => `<i style="left:${((a - 17) / 7) * 100}%;width:${((b - a) / 7) * 100}%"></i>`).join('')}</div>`;
      card(`<h3>🏠 Urlaubs-Licht</h3><div class="mkSub">Wenn alle weg sind, gehen die Lichter abends so an und aus wie bei euch – gelernt aus den letzten 14 Tagen, jeden Tag ein bisschen anders.</div>
        ${row('Urlaubs-Licht', sw(true))}${row('Startet', 'wenn niemand zu Hause ist')}${row('Rollläden mit', sw(true))}${row('Fernseher-Licht im Wohnzimmer', sw(true))}
        <h4>Heute Abend (geplant)</h4>
        <div class="mkTl">
          <span>💡 Wohnzimmer</span>${bars([[17.6, 22.9]])}
          <span>💡 Küche</span>${bars([[18.1, 19.4], [21.2, 21.6]])}
          <span>💡 Bad</span>${bars([[20.4, 20.6], [22.7, 23.0]])}
          <span>💡 Schlafzimmer</span>${bars([[22.6, 23.4]])}
          <span>🪟 Rollläden</span>${bars([[17.3, 17.4]])}
          <div class="ax"><span>17</span><span>19</span><span>21</span><span>23</span><span>24 Uhr</span></div>
        </div>
        <div class="mkSub" style="margin:10px 0 0">Jetzt 19:42: an sind Wohnzimmer und Küche · der Alarm bleibt scharf.</div>`, { right: '24px', top: '64px' }, 400);
      add('<div class="mkMark guest" style="left:40%;top:150px;transform:translateX(-50%);font-size:16px">🏠 Urlaub · Licht spielt „wir sind da“</div>');
    },
    /* 🌙 Nachtlicht-Weg */
    6() {
      path(['d12', 'd19', 'd15'], '#ffd27a');
      mark('d12', '🛏 Start: Bewegung am Bett', 'shade', 0, 70);
      mark('d19', '💡 Flur 10 %', 'glow', 0, -8);
      mark('d15', '💡 Bad 20 %', 'glow', 0, -8);
      card(`<h3>🌙 Nachtlicht-Weg</h3><div class="mkSub">Nachts geht bei Bewegung nur ein schwaches Licht auf dem Weg an – nicht das grelle Deckenlicht.</div>
        ${row('Nachtlicht-Weg', sw(true))}${row('Wann', '23:00 – 6:00')}${row('Startet bei Bewegung', '🛏 Schlafzimmer')}
        <h4>Der Weg (im Plan gezogen)</h4>
        ${row('1 · 💡 Flur', '10 % · warmweiß')}${row('2 · 💡 Bad', '20 % · warmweiß')}
        ${row('Aus nach', '3 Min ohne Bewegung')}${row('Nicht, wenn Partner schläft (Bett-Sensor)', sw(false))}
        <div style="margin-top:8px">${btn('✏ Weg im Plan ändern', 'blue')}${btn('+ Zweiter Weg (Kinderzimmer)', 'ghost')}</div>`, { right: '24px', top: '64px' }, 380);
    },
    /* 🔧 Wartung */
    7() {
      mark('dc_ac', '🔧 Filter fällig', 'tool');
      mark('rd1', '🔧 Entlüften', 'tool', 0, -6);
      mark('dc_vac', '🔧 Bürste', 'tool');
      card(`<h3>🔧 Wartung</h3><div class="mkSub">Erinnert am Gerät im Haus und aufs Handy – „Erledigt“ startet die Zeit neu.</div>
        <h4>Fällig</h4>
        ${row('❄ Klimaanlage Büro · Filter reinigen', btn('✓ Erledigt', 'green'), 'bad')}
        ${row('🧹 Saugroboter · Bürste tauschen', btn('✓ Erledigt', 'green'), 'warn')}
        <h4>Bald</h4>
        ${row('🔥 Heizkörper entlüften', 'in 5 Tagen · jeden Herbst')}${row('🫧 Waschmaschine · Flusensieb', 'in 9 Tagen · alle 3 Monate')}
        ${row('🚨 Rauchmelder testen', 'in 3 Wochen · jedes Jahr')}${row('🔋 Batterie Fenster Küche', '12 % · bald tauschen')}
        <div style="margin-top:8px">${btn('+ Erinnerung', 'blue')}${btn('Vorschläge für meine Geräte', 'ghost')}</div>`, { right: '24px', top: '64px' }, 400);
    },
    /* 👥 Gäste-Modus */
    8() {
      const qr = Array.from({ length: 441 }, (_, i) => {
        const x = i % 21, y = Math.floor(i / 21), f = (a, b) => x >= a && x < a + 7 && y >= b && y < b + 7;
        const fin = f(0, 0) || f(14, 0) || f(0, 14);
        const ring = fin && ((x % 14 === 0 || x % 14 === 6 || y % 14 === 0 || y % 14 === 6) || ((x % 14) >= 2 && (x % 14) <= 4 && (y % 14) >= 2 && (y % 14) <= 4));
        const r = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        return `<i class="${fin ? (ring ? 'b' : '') : Math.abs(r) > 0.52 ? 'b' : ''}"></i>`;
      }).join('');
      add('<div class="mkMark guest" style="left:40%;top:150px;transform:translateX(-50%);font-size:16px">👥 Gäste da · bis Sonntag</div>');
      mark('e5', '🌡 Gästezimmer → 21 °C', 'guest', 0, -10);
      card(`<h3>👥 Gäste-Modus</h3><div class="mkSub">Ein Tipp, wenn Besuch kommt – alles wieder normal, wenn er geht.</div>
        ${row('Gäste da', sw(true))}${row('Bis', 'So, 23.11. · 12:00')}
        <h4>Was dann anders ist</h4>
        ${row('🌡 Gästezimmer heizt auf', '21 °C (sonst 16 °C)')}${row('🌙 Flurlicht nachts', '10 % bei Bewegung')}
        ${row('📱 Gast-Tablet', '✋ Licht und Rollo im Gästezimmer')}${row('🛡 Alarm nachts', 'nur Erdgeschoss außen')}${row('🔔 Benachrichtigungen', 'leiser')}
        <h4>WLAN für Gäste</h4>
        <div style="display:flex;gap:14px;align-items:center"><div class="mkQr">${qr}</div>
          <div><b>Gast-WLAN</b><br><span class="mkSub">Mit der Handy-Kamera scannen, dann ist man drin. Auch zum Ausdrucken.</span></div></div>`, { right: '24px', top: '64px' }, 400);
    },
    /* 📊 Monatsbericht: the colours of the rooms (the phone message is made by make_pictures.py) */
    9() {
      [['d4', '🔥 41 € · ⚡ 22 €', 'bad'], ['d10', '🔥 18 € · ⚡ 31 €', 'mid'], ['d13', '🔥 9 € · ⚡ 3 €', 'good'], ['d15', '🔥 23 € · ⚡ 4 €', 'mid'], ['d18', '🔥 12 € · ⚡ 19 €', 'mid']]
        .forEach(([id, t, c]) => mark(id, t, c));
    },
  };

  window.mockIdea = (n, o = {}) => {
    clear();
    const r = IDEAS[n](o);
    return r || layer().children.length;
  };
  hide('#roomTiles'); hide('#sceneBar');
})();
