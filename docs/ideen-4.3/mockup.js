// Only for the example pictures in this folder (injected into the demo with ?debug=1, see docs/UEBERGABE.md), not part of the add-on.
// Mock-up of the tab bar at the bottom and the eight new pages (#?, the owner's wish of 2026-10-21: "nur noch dieses Programm").
window.mk43 = (() => {
  const st = (id) => { const s = window.__fp.states()[id]; return s ? s.state : ''; };
  const num = (id, d = 1) => { const v = parseFloat(st(id)); return Number.isFinite(v) ? v.toFixed(d).replace('.', ',') : '–'; };

  const css = `
  #mkBar { position: fixed; left: 0; right: 0; bottom: 0; height: 66px; z-index: 60; display: flex; justify-content: center; gap: 4px;
    padding: 6px 10px 8px; background: rgba(16,22,30,.94); backdrop-filter: blur(14px) saturate(140%); border-top: 1px solid rgba(255,255,255,.14); }
  #mkBar button { flex: 0 1 118px; border: 0; border-radius: 12px; background: transparent; color: #aeb8c4; font: 600 12px/1.2 system-ui, sans-serif;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; position: relative; }
  #mkBar button .i { font-size: 22px; line-height: 1; filter: saturate(.85); }
  #mkBar button.on { background: rgba(78,166,255,.2); color: #fff; box-shadow: inset 0 0 0 1px rgba(78,166,255,.55); }
  #mkBar button .dot { position: absolute; top: 4px; right: calc(50% - 22px); min-width: 16px; height: 16px; border-radius: 8px; background: #e5484d; color: #fff;
    font-size: 10px; line-height: 16px; padding: 0 4px; }
  body.mkTabs #modeBar { bottom: 80px !important; } body.mkTabs #roomTiles { bottom: 124px !important; }
  body.mkTabs #findBtn { bottom: 80px !important; } body.mkTabs #compass, body.mkTabs .compass { bottom: 124px !important; }
  #mkPage { position: fixed; left: 0; right: 0; top: 51px; bottom: 66px; z-index: 55; overflow: hidden; padding: 18px 22px; color: #e8edf3;
    font: 15px/1.35 system-ui, sans-serif; background: linear-gradient(180deg, rgba(14,20,28,.94), rgba(10,14,20,.97)); backdrop-filter: blur(18px); }
  #mkPage h1 { font-size: 22px; margin: 0 0 12px; font-weight: 700; display: flex; align-items: center; gap: 12px; }
  #mkPage h1 .sub { font-size: 14px; font-weight: 500; color: #9aa6b4; }
  #mkPage h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #8d99a8; margin: 0 0 8px; font-weight: 700; }
  .mkGrid { display: grid; gap: 14px; }
  .mkCard { background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 14px 16px; }
  .mkRow { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-top: 1px solid rgba(255,255,255,.07); }
  .mkRow:first-of-type { border-top: 0; }
  .mkRow .g { flex: 1; } .mkRow .v { font-weight: 700; } .muted { color: #93a0ae; } .small { font-size: 13px; }
  .mkChip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.12); font-weight: 600; font-size: 14px; }
  .mkChip.on { background: rgba(78,166,255,.22); border-color: rgba(78,166,255,.6); color: #fff; }
  .mkChip.red { background: rgba(229,72,77,.18); border-color: rgba(229,72,77,.55); }
  .mkChip.amber { background: rgba(245,166,35,.16); border-color: rgba(245,166,35,.5); }
  .mkChip.green { background: rgba(70,167,88,.18); border-color: rgba(70,167,88,.55); }
  .mkBtn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.09); color: #fff; font-weight: 700; font-size: 15px; }
  .mkBtn.blue { background: #2f7fd6; border-color: #4ea6ff; } .mkBtn.red { background: #c9363b; border-color: #e5484d; } .mkBtn.green { background: #2f8f45; border-color: #46a758; }
  .big { font-size: 40px; font-weight: 800; letter-spacing: -.02em; line-height: 1.05; }
  .huge { font-size: 76px; font-weight: 800; letter-spacing: -.03em; line-height: 1; }
  .bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,.1); overflow: hidden; } .bar > i { display: block; height: 100%; border-radius: 4px; }
  .ava { width: 54px; height: 54px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 22px; color: #fff; flex: none; }
  .note { background: #f5e7a8; color: #3b3216; border-radius: 6px; padding: 12px 14px; font: 600 16px/1.3 'Segoe Print', 'Comic Sans MS', system-ui; box-shadow: 0 6px 16px rgba(0,0,0,.35); }
  .mkModal { position: fixed; inset: 0; z-index: 70; background: rgba(0,0,0,.55); display: grid; place-items: center; }
  .mkModal .box { width: 560px; background: #18202b; border: 1px solid rgba(255,255,255,.16); border-radius: 20px; padding: 22px 24px; color: #e8edf3;
    font: 15px/1.4 system-ui, sans-serif; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
  .cam { position: relative; border-radius: 14px; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,.12); }
  .cam img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .cam .lbl { position: absolute; left: 10px; top: 10px; } .cam .rec { position: absolute; right: 10px; top: 10px; }
  .cam .time { position: absolute; right: 10px; bottom: 10px; font: 600 12px/1 ui-monospace, monospace; color: #fff; background: rgba(0,0,0,.5); padding: 4px 6px; border-radius: 6px; }
  .tick { width: 18px; height: 18px; border-radius: 5px; display: inline-grid; place-items: center; font-size: 12px; font-weight: 800; }
  .tick.y { background: #2f7fd6; color: #fff; } .tick.n { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2); }
  table.mkT { border-collapse: collapse; width: 100%; font-size: 14px; } table.mkT th { font-size: 12px; color: #93a0ae; font-weight: 700; padding: 6px 4px; text-align: center; }
  table.mkT th:first-child, table.mkT td:first-child { text-align: left; } table.mkT td { padding: 9px 4px; text-align: center; border-top: 1px solid rgba(255,255,255,.08); }
  `;

  const TABS = [['haus', '🏠', 'Haus'], ['heute', '☀️', 'Heute'], ['energie', '⚡', 'Energie'], ['klima', '🌡️', 'Klima'], ['kameras', '📷', 'Kameras'],
    ['musik', '🎵', 'Musik & TV'], ['haushalt', '🧺', 'Haushalt'], ['ablaeufe', '▶️', 'Abläufe'], ['familie', '👨‍👩‍👧', 'Familie']];

  function setup() {
    if (document.getElementById('mkCss')) return;
    const s = document.createElement('style'); s.id = 'mkCss'; s.textContent = css; document.head.append(s);
    document.body.classList.add('mkTabs');
  }
  /** the tab bar at the bottom; `only` = the tabs a user has, `dots` = {tab: badge} */
  function bar(active = 'haus', { only = null, dots = { haushalt: '1' }, more = false } = {}) {
    setup();
    let b = document.getElementById('mkBar'); if (!b) { b = document.createElement('nav'); b.id = 'mkBar'; document.body.append(b); }
    b.innerHTML = TABS.filter(([k]) => !only || only.includes(k)).map(([k, i, n]) =>
      `<button class="${k === active ? 'on' : ''}"><span class="i">${i}</span>${n}${dots[k] ? `<span class="dot">${dots[k]}</span>` : ''}</button>`).join('')
      + (more ? '<button><span class="i">⋯</span>Mehr<span class="dot">1</span></button>' : '');
  }
  function page(html) {
    setup();
    let p = document.getElementById('mkPage'); if (!p) { p = document.createElement('section'); p.id = 'mkPage'; document.body.append(p); }
    const h = document.querySelector('header'); p.style.top = (h ? h.getBoundingClientRect().bottom : 0) + 'px';
    p.innerHTML = html;
  }
  function modal(html) { const m = document.createElement('div'); m.className = 'mkModal'; m.innerHTML = `<div class="box">${html}</div>`; document.body.append(m); }
  /** the tablet view: only what someone without editing sees in the top bar */
  function tabletHeader() {
    ['#modeSwitch', '#view2d', '#view3d', '#viewSplit', '#fitBtn', '#backupBtn', '#timelineBtn'].forEach((q) => document.querySelectorAll(q).forEach((e) => { e.style.display = 'none'; }));
    document.querySelectorAll('header button').forEach((e) => { if (/Einpassen|Backup|Sicherheit|Bearbeiten|^2D|^3D/.test(e.textContent.trim())) e.style.display = 'none'; });
  }

  // ---------- ☀ Heute ----------
  function heute() {
    bar('heute');
    page(`
    <div class="mkGrid" style="grid-template-columns: 1.15fr 1fr 1fr; height: 100%;">
      <div class="mkGrid" style="grid-template-rows: auto auto 1fr;">
        <div class="mkCard" style="padding: 18px 20px;">
          <div class="huge">12:30</div>
          <div style="font-size: 20px; font-weight: 600; margin-top: 6px;">Mittwoch, 21. Oktober</div>
        </div>
        <div class="mkCard">
          <div style="display:flex; align-items:center; gap: 14px;">
            <div style="font-size: 54px;">⛅</div>
            <div><div class="big">14 °C</div><div class="muted">Teilweise bewölkt · Wind 12 km/h</div></div>
          </div>
          <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 12px; text-align:center;" class="small">
            ${[['15 Uhr', '⛅', '15°'], ['18 Uhr', '🌥️', '12°'], ['Do', '🌧️', '11° / 6°'], ['Fr', '🌦️', '13° / 7°'], ['Sa', '☀️', '16° / 5°']].map(([d, i, t]) =>
              `<div class="mkCard" style="padding: 8px 4px;"><div class="muted">${d}</div><div style="font-size: 22px;">${i}</div><b>${t}</b></div>`).join('')}
          </div>
        </div>
        <div class="mkCard">
          <h2>Pinnwand</h2>
          <div style="display:flex; gap: 12px;">
            <div class="note" style="transform: rotate(-1.5deg); flex: 1;">Bin um 6 da 🚗<div class="small" style="opacity:.7; margin-top: 4px;">Max · 11:48</div></div>
            <div class="note" style="transform: rotate(1.2deg); flex: 1; background: #cfe8c6;">Katze füttern! 🐱<div class="small" style="opacity:.7; margin-top: 4px;">Anna · 08:10</div></div>
          </div>
        </div>
      </div>
      <div class="mkGrid" style="grid-template-rows: auto auto 1fr;">
        <div class="mkCard">
          <h2>Termine heute</h2>
          <div class="mkRow"><b style="width: 54px;">15:00</b><span class="g">Zahnarzt</span><span class="mkChip" style="padding: 3px 9px; font-size: 12px;">Anna</span></div>
          <div class="mkRow"><b style="width: 54px;">17:30</b><span class="g">Fußball-Training</span><span class="mkChip" style="padding: 3px 9px; font-size: 12px;">Max</span></div>
          <div class="mkRow"><b style="width: 54px;">19:00</b><span class="g">Elternabend</span><span class="mkChip" style="padding: 3px 9px; font-size: 12px;">Familie</span></div>
        </div>
        <div class="mkCard" style="display:flex; align-items:center; gap: 14px;">
          <div style="font-size: 42px;">🟡</div>
          <div><h2 style="margin:0;">Müll</h2><div style="font-size: 20px; font-weight: 700;">Morgen: Gelber Sack</div><div class="muted small">Fr: Restmüll · Mo: Papier</div></div>
        </div>
        <div class="mkCard">
          <h2>Wer ist da</h2>
          <div class="mkRow"><div class="ava" style="background:#8e5bd6; width:40px; height:40px; font-size:17px;">A</div><span class="g"><b>Anna</b><br><span class="muted small">zu Hause seit 11:02</span></span><span class="mkChip green">🏠 da</span></div>
          <div class="mkRow"><div class="ava" style="background:#2f7fd6; width:40px; height:40px; font-size:17px;">M</div><span class="g"><b>Max</b><br><span class="muted small">Arbeit · etwa 25 min weg</span></span><span class="mkChip">🚗 unterwegs</span></div>
        </div>
      </div>
      <div class="mkGrid" style="grid-template-rows: auto auto 1fr;">
        <div class="mkCard">
          <h2>Im Haus</h2>
          <div class="mkRow"><span>🪟</span><span class="g">2 Fenster offen<br><span class="muted small">Küche, Wohnzimmer</span></span><span class="mkChip red">offen</span></div>
          <div class="mkRow"><span>💡</span><span class="g">10 Lichter an</span><span class="mkChip amber">Alle aus</span></div>
          <div class="mkRow"><span>🛡️</span><span class="g">Alarm aus</span><span class="mkChip">Scharf</span></div>
          <div class="mkRow"><span>🪫</span><span class="g">2 Batterien fast leer<br><span class="muted small">Fenster Küche 12 %, Keller 8 %</span></span><span class="mkChip red">!</span></div>
        </div>
        <div class="mkCard">
          <h2>Strom jetzt</h2>
          <div style="display:flex; gap: 18px; align-items: baseline;">
            <div><div class="big" style="font-size: 32px;">☀️ ${num('sensor.pv_dach', 0).replace(/(\d)(\d{3})$/, '$1.$2')} W</div><div class="muted small">vom Dach</div></div>
            <div><div class="big" style="font-size: 32px;">🔋 ${num('sensor.batterie_ladung', 0)} %</div><div class="muted small">lädt</div></div>
          </div>
          <div class="muted small" style="margin-top: 8px;">Heute bis jetzt: 14,2 kWh gemacht · 6,8 kWh gebraucht</div>
        </div>
        <div class="mkCard">
          <h2>Im Haushalt</h2>
          <div class="mkRow"><span>🫧</span><span class="g">Waschmaschine</span><b>noch 42 min</b></div>
          <div class="mkRow"><span>🍽️</span><span class="g">Spülmaschine</span><span class="mkChip green">fertig ✓</span></div>
        </div>
      </div>
    </div>`);
  }

  // ---------- ⚡ Energie ----------
  function energie() {
    bar('energie');
    // a day: per hour what the house used, split into "from sun / battery" and "from the grid" (kWh)
    const use = [0.32, 0.28, 0.27, 0.26, 0.27, 0.31, 0.52, 0.81, 0.66, 0.48, 0.45, 0.58, 0.71];
    const own = [0.12, 0.1, 0.08, 0.06, 0.05, 0.06, 0.18, 0.55, 0.66, 0.48, 0.45, 0.58, 0.71];
    const W = 640, H = 210, pad = 30, bw = (W - pad) / 24, max = 1;
    const y = (v) => H - 22 - v / max * (H - 40);
    let bars = '';
    for (let h = 0; h < 24; h++) {
      const x = pad + h * bw + 3, w = bw - 6;
      if (h < use.length) {
        const g = use[h] - own[h];
        // own share at the bottom, the grid on top, a 2px gap between them, round ends only at the top of the stack
        bars += g > 0.01 ? `<rect x="${x}" y="${y(own[h])}" width="${w}" height="${H - 22 - y(own[h])}" fill="#cc7a00"/>`
          : `<path d="M${x} ${H - 22} V${y(own[h]) + 4} q0 -4 4 -4 h${w - 8} q4 0 4 4 V${H - 22} Z" fill="#cc7a00"/>`;
        if (g > 0.01) bars += `<path d="M${x} ${y(own[h]) - 2} V${y(use[h]) + 4} q0 -4 4 -4 h${w - 8} q4 0 4 4 V${y(own[h]) - 2} Z" fill="#488fc2"/>`;
      } else bars += `<rect x="${x}" y="${H - 24}" width="${w}" height="2" fill="rgba(255,255,255,.12)"/>`;
    }
    const grid = [0, 0.5, 1].map((v) => `<line x1="${pad}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,.08)"/><text x="${pad - 6}" y="${y(v) + 4}" fill="#93a0ae" font-size="11" text-anchor="end">${String(v).replace('.', ',')}</text>`).join('');
    const hours = [0, 6, 12, 18, 23].map((h) => `<text x="${pad + h * bw + bw / 2}" y="${H - 4}" fill="#93a0ae" font-size="11" text-anchor="${h === 23 ? 'end' : 'middle'}">${h} Uhr</text>`).join('');
    const tile = (lbl, v, unit, sub, col) => `<div class="mkCard" style="padding: 12px 14px;"><div class="muted small" style="display:flex; align-items:center; gap:6px;">${col ? `<i style="width:10px;height:10px;border-radius:3px;background:${col};display:inline-block"></i>` : ''}${lbl}</div><div style="font-size: 28px; font-weight: 800;">${v} <span style="font-size: 15px; font-weight: 600;">${unit}</span></div><div class="muted small">${sub}</div></div>`;
    page(`
    <h1>⚡ Energie
      <span class="mkChip on">Demo-Haus</span><span class="mkChip">Ferienhaus</span><span class="mkChip">Beide zusammen</span>
      <span style="flex:1"></span>
      <span class="mkChip on">Heute</span><span class="mkChip">Woche</span><span class="mkChip">Monat</span><span class="mkChip">Jahr</span>
    </h1>
    <div class="mkGrid" style="grid-template-columns: repeat(5, 1fr); margin-bottom: 14px;">
      ${tile('Verbraucht', '6,8', 'kWh', 'gestern um die Zeit: 7,5', '')}
      ${tile('Vom Dach', '14,2', 'kWh', 'davon 8,9 ins Netz', '#cc7a00')}
      ${tile('Aus dem Netz', '1,4', 'kWh', 'eingespeist: 8,9 kWh', '#488fc2')}
      ${tile('Selbst gemacht', '79', '%', 'vom Verbrauch heute', '')}
      ${tile('Kosten heute', '0,45', '€', '− 0,71 € Einspeisung', '')}
    </div>
    <div class="mkGrid" style="grid-template-columns: 1.6fr 1fr;">
      <div class="mkCard">
        <h2>Verbrauch pro Stunde</h2>
        <svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${grid}${bars}${hours}
          <line x1="${pad + 12.5 * bw}" x2="${pad + 12.5 * bw}" y1="10" y2="${H - 22}" stroke="rgba(255,255,255,.35)" stroke-dasharray="3 3"/>
          <text x="${pad + 12.5 * bw + 6}" y="20" fill="#e8edf3" font-size="11">jetzt</text>
        </svg>
        <div style="display:flex; gap: 18px; margin-top: 8px;" class="small">
          <span><i style="width:12px;height:12px;border-radius:3px;background:#cc7a00;display:inline-block;vertical-align:-1px"></i> von Sonne und Batterie</span>
          <span><i style="width:12px;height:12px;border-radius:3px;background:#488fc2;display:inline-block;vertical-align:-1px"></i> aus dem Netz</span>
          <span class="muted">kWh</span>
        </div>
      </div>
      <div class="mkCard">
        <h2>Größte Verbraucher heute</h2>
        ${[['Wärmepumpe', 2.1], ['Wohnzimmer (TV, Licht)', 1.2], ['Küche', 1.0], ['Büro', 0.8], ['Waschmaschine', 0.7]].map(([n, v]) =>
          `<div class="mkRow"><span class="g">${n}</span><span style="width: 110px;" class="bar"><i style="width:${v / 2.1 * 100}%; background:#8d99a8"></i></span><b style="width: 64px; text-align:right">${String(v).replace('.', ',')} kWh</b></div>`).join('')}
        <div class="mkRow"><span class="g muted">Rest (ohne eigenen Sensor)</span><b>1,0 kWh</b></div>
      </div>
    </div>
    <div class="mkGrid" style="grid-template-columns: repeat(3, 1fr); margin-top: 14px;">
      ${tile('🔥 Gas heute', '3,1', 'm³', 'Zähler: ' + num('sensor.gaszaehler') + ' m³', '')}
      ${tile('💧 Wasser heute', '214', 'Liter', 'Zähler: ' + num('sensor.wasserzaehler') + ' m³', '')}
      ${tile('♨️ Wärme heute', '18', 'kWh', 'Zähler: ' + num('sensor.waermemenge', 0) + ' kWh', '')}
    </div>`);
  }

  // ---------- 🌡 Klima ----------
  function klima() {
    bar('klima');
    const rooms = [
      ['Wohnzimmer', 'sensor.wohnzimmer_temp', 21.5, 'heizt', 920, 48],
      ['Küche', 'sensor.kueche_temp', 21, '', 0, 52],
      ['Büro', 'sensor.buero_temp', 22, 'kühlt', 0, 45],
      ['Schlafzimmer', 'sensor.schlafzimmer_temp', 18, '', 1350, 55],
      ['Kinderzimmer', 'sensor.kinder_temp', 20, '', 640, 50],
      ['Gästezimmer', 'sensor.gast_temp', 17, '', 0, 49],
      ['Bad', null, 23, 'heizt', 0, 64],
      ['Studio', 'sensor.studio_temp', 21, '', 0, 41],
    ];
    const card = ([n, s, soll, mode, co2, hum]) => {
      const t = s ? num(s) : '22,8';
      const air = co2 >= 1200 ? `<span class="mkChip red" style="font-size:12px;padding:3px 9px">🪟 Lüften · ${co2} ppm</span>` : co2 ? `<span class="mkChip green" style="font-size:12px;padding:3px 9px">Luft gut · ${co2} ppm</span>` : `<span class="muted small">💧 ${hum} %</span>`;
      const m = mode === 'heizt' ? '<span class="mkChip red" style="font-size:12px;padding:3px 9px">🔥 heizt</span>' : mode === 'kühlt' ? '<span class="mkChip on" style="font-size:12px;padding:3px 9px">❄️ kühlt</span>' : '<span class="muted small">aus</span>';
      return `<div class="mkCard" style="${co2 >= 1200 ? 'border-color: rgba(229,72,77,.6);' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center;"><b style="font-size: 17px;">${n}</b>${m}</div>
        <div style="display:flex; align-items:baseline; gap: 10px; margin: 6px 0;"><span class="big">${t}°</span><span class="muted">Soll ${String(soll).replace('.', ',')}°</span></div>
        <div style="display:flex; align-items:center; gap: 8px;"><span class="mkBtn" style="padding: 6px 14px;">−</span><span class="mkBtn" style="padding: 6px 14px;">+</span><span style="flex:1"></span>${air}</div>
      </div>`;
    };
    page(`
    <h1>🌡️ Klima <span class="sub">Erdgeschoss und Obergeschoss · draußen 14 °C</span>
      <span style="flex:1"></span><span class="mkChip on">Alle Räume</span><span class="mkChip">Nur zu warm / zu kalt</span><span class="mkChip">🌙 Nachtabsenkung: 22–6 Uhr</span></h1>
    <div class="mkGrid" style="grid-template-columns: repeat(4, 1fr);">${rooms.map(card).join('')}</div>
    <div class="mkGrid" style="grid-template-columns: 1fr 1fr; margin-top: 14px;">
      <div class="mkCard"><h2>Wärmepumpe</h2><div class="mkRow"><span class="g">Läuft · Vorlauf 34 °C</span><b>1,2 kW</b></div><div class="mkRow"><span class="g">Warmwasser</span><b>48 °C</b></div></div>
      <div class="mkCard"><h2>Tipp</h2><div style="font-size: 16px;">Im <b>Schlafzimmer</b> ist die Luft schlecht (1350 ppm). 5 Minuten Fenster auf, die Heizung geht so lange von selbst aus.</div></div>
    </div>`);
  }

  // ---------- 📷 Kameras ----------
  function kameras(imgs) {
    bar('kameras');
    const cam = (img, n, extra = '') => `<div class="cam" style="height: 100%;"><img src="${img}"><span class="mkChip lbl" style="background:rgba(0,0,0,.55)">${n}</span>${extra}<span class="time">21.10. 12:30:14</span></div>`;
    page(`
    <h1>📷 Kameras <span class="sub">live</span><span style="flex:1"></span>
      <span class="mkChip green">🛡️ Alarm aus</span><span class="mkChip">📼 Verlauf von heute</span><span class="mkChip on">Alle</span><span class="mkChip">Nur mit Bewegung</span></h1>
    <div class="mkGrid" style="grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; height: calc(100% - 52px);">
      ${cam(imgs[0], '🚪 Einfahrt', '<span class="mkChip red rec" style="background:rgba(201,54,59,.85)">🏃 Bewegung</span>')}
      ${cam(imgs[1], 'Wohnzimmer')}
      ${cam(imgs[2], 'Büro')}
      ${cam(imgs[3], 'Garage')}
    </div>`);
  }
  /** someone rings: the door camera comes over everything, on every tablet */
  function klingel(img) {
    bar('haus');
    const m = document.createElement('div'); m.className = 'mkModal';
    m.innerHTML = `<div class="box" style="width: 760px; padding: 0; overflow: hidden;">
      <div style="padding: 14px 20px; display:flex; align-items:center; gap: 12px; background: #c9363b;"><span style="font-size: 26px;">🔔</span><b style="font-size: 20px; flex:1">Es klingelt an der Haustür</b><span class="small">12:30</span></div>
      <div class="cam" style="border-radius: 0; height: 380px; border: 0;"><img src="${img}"><span class="time">LIVE</span></div>
      <div style="display:flex; gap: 12px; padding: 16px 20px;">
        <span class="mkBtn green" style="flex:1">🎙️ Sprechen</span><span class="mkBtn blue" style="flex:1">🔓 Tür öffnen</span><span class="mkBtn" style="flex:1">✕ Schließen</span>
      </div></div>`;
    document.body.append(m);
  }

  // ---------- 🎵 Musik & TV ----------
  function musik() {
    bar('musik');
    const art = (a, b) => `<div style="width: 96px; height: 96px; border-radius: 12px; background: linear-gradient(135deg, ${a}, ${b}); flex: none; display:grid; place-items:center; font-size: 34px;">♪</div>`;
    const ctl = '<div style="display:flex; gap: 8px; margin-top: 10px;"><span class="mkBtn">⏮</span><span class="mkBtn blue">❚❚</span><span class="mkBtn">⏭</span></div>';
    const vol = (v) => `<div style="display:flex; align-items:center; gap: 8px; margin-top: 10px;"><span>🔈</span><span class="bar" style="flex:1; height: 10px;"><i style="width:${v}%; background:#4ea6ff"></i></span><b style="width: 40px">${v} %</b></div>`;
    page(`
    <h1>🎵 Musik & TV <span style="flex:1"></span><span class="mkChip">🔗 Räume zusammen</span><span class="mkChip">❚❚ Alles stopp</span></h1>
    <div class="mkGrid" style="grid-template-columns: 1fr 1fr;">
      <div class="mkCard" style="display:flex; gap: 16px;">${art('#f2994a', '#eb5757')}
        <div style="flex:1"><div class="muted small">Wohnzimmer · Sonos</div><div style="font-size: 20px; font-weight: 800;">Feel It Still</div><div class="muted">Portugal. The Man</div>${ctl}${vol(35)}</div></div>
      <div class="mkCard" style="display:flex; gap: 16px;"><div style="width: 96px; height: 96px; border-radius: 12px; background: #141414; flex: none; display:grid; place-items:center; font: 900 22px system-ui; color:#e50914;">N</div>
        <div style="flex:1"><div class="muted small">Wohnzimmer · Fernseher</div><div style="font-size: 20px; font-weight: 800;">Netflix</div><div class="muted">läuft seit 11:40</div>
        <div style="display:flex; gap: 8px; margin-top: 10px;"><span class="mkBtn">⏻ Aus</span><span class="mkBtn">📺 Quelle</span><span class="mkBtn blue">❚❚</span></div>${vol(22)}</div></div>
      <div class="mkCard" style="display:flex; gap: 16px; opacity: .85">${art('#6fcf97', '#2d9cdb')}
        <div style="flex:1"><div class="muted small">Küche · Radio</div><div style="font-size: 20px; font-weight: 800;">aus</div><div class="muted">zuletzt: SWR3</div><div style="display:flex; gap: 8px; margin-top: 10px;"><span class="mkBtn blue">▶ SWR3</span><span class="mkBtn">▶ Wie Wohnzimmer</span></div></div></div>
      <div class="mkCard" style="display:flex; gap: 16px; opacity: .85">${art('#bb6bd9', '#56ccf2')}
        <div style="flex:1"><div class="muted small">Kinderzimmer · Lautsprecher</div><div style="font-size: 20px; font-weight: 800;">Pause</div><div class="muted">Die drei ??? · Folge 214</div><div style="display:flex; gap: 8px; margin-top: 10px;"><span class="mkBtn blue">▶</span></div>${vol(18)}</div></div>
    </div>
    <div class="mkCard" style="margin-top: 14px;"><h2>Radiosender</h2><div style="display:flex; gap: 10px; flex-wrap: wrap;">
      ${['SWR3', 'Bayern 3', '1LIVE', 'Antenne', 'Deutschlandfunk', 'Klassik Radio', 'Kinderlieder'].map((r) => `<span class="mkBtn">📻 ${r}</span>`).join('')}</div></div>`);
  }

  // ---------- 🧺 Haushalt ----------
  function haushalt() {
    bar('haushalt');
    const dev = (i, n, state, sub, pct, col, btn) => `<div class="mkCard"><div style="display:flex; align-items:center; gap: 12px;"><span style="font-size: 32px">${i}</span>
      <div style="flex:1"><b style="font-size: 17px">${n}</b><div class="muted small">${sub}</div></div>${state}</div>
      ${pct != null ? `<div class="bar" style="margin-top: 12px; height: 10px"><i style="width:${pct}%; background:${col}"></i></div>` : ''}${btn ? `<div style="display:flex; gap: 8px; margin-top: 12px;">${btn}</div>` : ''}</div>`;
    page(`
    <h1>🧺 Haushalt</h1>
    <div class="mkGrid" style="grid-template-columns: 1fr 1fr 1fr;">
      ${dev('🫧', 'Waschmaschine', '<b style="font-size: 20px">noch 42 min</b>', 'Baumwolle 40° · fertig um 13:12', 62, '#4ea6ff', '<span class="mkBtn">🔔 Sag mir Bescheid</span>')}
      ${dev('🌀', 'Trockner', '<span class="muted">aus</span>', 'zuletzt gestern 19:40', null, '', '')}
      ${dev('🍽️', 'Spülmaschine', '<span class="mkChip green">fertig ✓</span>', 'seit 11:55 · bitte ausräumen', null, '', '<span class="mkBtn">✓ Ausgeräumt</span>')}
      ${dev('🤖', 'Saugroboter', '<span class="mkChip">in der Station</span>', 'Akku 100 % · zuletzt gesaugt heute 9:10', null, '', '<span class="mkBtn blue">▶ Ganzes Haus</span><span class="mkBtn">Nur Küche</span><span class="mkBtn">Nur Flur</span>')}
      ${dev('🚗', 'Auto', '<b style="font-size: 20px">64 %</b>', 'lädt mit 3,2 kW · voll um 17:30', 64, '#46a758', '<span class="mkBtn">☀️ Nur mit Sonne laden</span>')}
      ${dev('🌱', 'Garten', '<span class="muted">Bewässerung aus</span>', 'Regen morgen: 4 mm · heute 87 l gegossen', null, '', '<span class="mkBtn">💧 10 min gießen</span>')}
    </div>
    <div class="mkGrid" style="grid-template-columns: 1fr 1fr; margin-top: 14px;">
      <div class="mkCard"><h2>Einkaufsliste</h2>
        ${['Milch', 'Brot', 'Kaffee', 'Katzenfutter', 'Batterien AAA'].map((x, i) => `<div class="mkRow"><span class="tick ${i === 2 ? 'y' : 'n'}">${i === 2 ? '✓' : ''}</span><span class="g" style="${i === 2 ? 'text-decoration: line-through; opacity:.5' : ''}">${x}</span></div>`).join('')}
        <div class="mkRow"><span class="muted">＋ Neu …</span></div></div>
      <div class="mkCard"><h2>Müll</h2>
        ${[['🟡', 'Gelber Sack', 'morgen'], ['⚫', 'Restmüll', 'Freitag'], ['🔵', 'Papier', 'Montag'], ['🟤', 'Bio', 'Di, 28.10.']].map(([i, n, d], k) => `<div class="mkRow"><span style="font-size: 20px">${i}</span><span class="g">${n}</span><b class="${k ? 'muted' : ''}">${d}</b></div>`).join('')}</div>
    </div>`);
  }

  // ---------- ▶ Abläufe ----------
  function ablaeufe(check = true) {
    bar('ablaeufe');
    const b = (i, n, sub, col = 'rgba(255,255,255,.06)') => `<div class="mkCard" style="background:${col}; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap: 6px; min-height: 150px;">
      <div style="font-size: 46px">${i}</div><b style="font-size: 19px">${n}</b><span class="muted small">${sub}</span></div>`;
    page(`
    <h1>▶️ Abläufe <span class="sub">ein Tipp, alles passiert</span></h1>
    <div class="mkGrid" style="grid-template-columns: repeat(4, 1fr);">
      ${b('🚪', 'Ich gehe', 'prüft offene Fenster · alles aus · Alarm scharf', 'rgba(229,72,77,.12)')}
      ${b('🏠', 'Ich bin da', 'Alarm aus · Flur-Licht · Heizung normal', 'rgba(70,167,88,.12)')}
      ${b('🌙', 'Gute Nacht', 'prüft Türen · Licht aus · Rollläden zu', 'rgba(78,166,255,.12)')}
      ${b('☀️', 'Guten Morgen', 'Rollläden auf · Kaffee · Radio')}
      ${b('🎬', 'Filmabend', 'Licht gedimmt · TV an · Rollladen zu')}
      ${b('🛋️', 'Wohnzimmer gemütlich', 'Szene')}
      ${b('💡', 'Alle Lichter aus', 'ganzes Haus')}
      ${b('🏖️', 'Urlaub', 'Urlaubs-Alarm · Anwesenheit vortäuschen')}
    </div>`);
    if (check) modal(`
      <div style="display:flex; align-items:center; gap: 12px; margin-bottom: 10px;"><span style="font-size: 34px">🚪</span><b style="font-size: 21px">Bevor du gehst …</b></div>
      <div class="mkRow"><span>🪟</span><span class="g"><b>2 Fenster offen</b><br><span class="muted small">Küche, Wohnzimmer</span></span><span class="mkChip red">offen</span></div>
      <div class="mkRow"><span>💡</span><span class="g"><b>10 Lichter an</b></span><span class="mkChip amber">gehen aus</span></div>
      <div class="mkRow"><span>📺</span><span class="g"><b>Fernseher läuft</b></span><span class="mkChip amber">geht aus</span></div>
      <div class="mkRow"><span>🔥</span><span class="g"><b>Herd aus</b></span><span class="mkChip green">✓</span></div>
      <div style="display:flex; gap: 10px; margin-top: 16px;"><span class="mkBtn" style="flex:1">Zurück</span><span class="mkBtn red" style="flex:2">Trotzdem: alles aus + Alarm scharf</span></div>`);
  }

  // ---------- 👨‍👩‍👧 Familie ----------
  function familie() {
    bar('familie');
    const p = (c, l, n, where, sub, chip, bat) => `<div class="mkCard" style="display:flex; align-items:center; gap: 14px;"><div class="ava" style="background:${c}">${l}</div>
      <div style="flex:1"><b style="font-size: 18px">${n}</b><div>${where}</div><div class="muted small">${sub}</div></div><div style="text-align:right">${chip}<div class="muted small" style="margin-top: 6px">📱 ${bat} %</div></div></div>`;
    page(`
    <h1>👨‍👩‍👧 Familie</h1>
    <div class="mkGrid" style="grid-template-columns: 1fr 1.2fr; height: calc(100% - 46px);">
      <div class="mkGrid" style="align-content: start;">
        ${p('#8e5bd6', 'A', 'Anna', '🏠 zu Hause', 'seit 11:02 · im Wohnzimmer', '<span class="mkChip green">da</span>', 78)}
        ${p('#2f7fd6', 'M', 'Max', '🏢 Arbeit', 'losgefahren? nein · etwa 25 min weg', '<span class="mkChip">unterwegs</span>', 45)}
        ${p('#d68a2f', 'L', 'Lena', '⚽ Sportplatz', 'seit 15:05 · kommt meist 17:00', '<span class="mkChip">unterwegs</span>', 23)}
        ${p('#46a758', 'O', 'Oma', '🏡 Ferienhaus', 'zweites Haus · Heizung 20 °C', '<span class="mkChip">dort</span>', 91)}
      </div>
      <div class="mkCard" style="background: rgba(120,90,50,.18);">
        <h2>Pinnwand</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 6px;">
          <div class="note" style="transform: rotate(-1.5deg)">Bin um 6 da 🚗<div class="small" style="opacity:.7; margin-top: 6px">Max · 11:48</div></div>
          <div class="note" style="transform: rotate(1.2deg); background: #cfe8c6">Katze füttern! 🐱<div class="small" style="opacity:.7; margin-top: 6px">Anna · 08:10</div></div>
          <div class="note" style="transform: rotate(.8deg); background: #c9e2f5">Lena: Training fällt Do aus<div class="small" style="opacity:.7; margin-top: 6px">Anna · gestern</div></div>
          <div class="note" style="transform: rotate(-.6deg); background: #f3cfe0">Schornsteinfeger Mo 9 Uhr<div class="small" style="opacity:.7; margin-top: 6px">Max · Mo</div></div>
        </div>
        <div style="display:flex; gap: 10px; margin-top: 18px"><span class="mkBtn blue">✏️ Neue Notiz</span><span class="mkBtn">📲 Auch aufs Handy schicken</span></div>
      </div>
    </div>`);
  }

  // ---------- 👥 Benutzer: who gets which tab ----------
  function benutzer() {
    bar('haus');
    const T = ['🏠', '☀️', '⚡', '🌡️', '📷', '🎵', '🧺', '▶️', '👨‍👩‍👧'];
    const row = (n, sub, on, start, rights) => `<tr><td><b>${n}</b><br><span class="muted small">${sub}</span></td>${T.map((_, i) => `<td><span class="tick ${on.includes(i) ? 'y' : 'n'}">${on.includes(i) ? '✓' : ''}</span></td>`).join('')}
      <td><span class="mkChip" style="font-size: 12px; padding: 3px 9px">${T[start]} ${['Haus', 'Heute', 'Energie', 'Klima', 'Kameras', 'Musik', 'Haushalt', 'Abläufe', 'Familie'][start]} ▾</span></td><td class="small">${rights}</td></tr>`;
    modal(`
      <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 8px"><b style="font-size: 20px; flex:1">👥 Benutzer & Tablets → Reiter</b><span class="muted">✕</span></div>
      <div class="muted small" style="margin-bottom: 10px">Wer sieht welche Reiter, und mit welchem fängt das Gerät an.</div>
      <table class="mkT"><tr><th>Benutzer</th>${T.map((i) => `<th style="font-size: 16px">${i}</th>`).join('')}<th>Start</th><th>Darf</th></tr>
        ${row('Du', 'Admin', [0, 1, 2, 3, 4, 5, 6, 7, 8], 0, 'alles')}
        ${row('tablet_kueche', 'Küchen-Tablet', [0, 1, 3, 4, 5, 6, 7, 8], 1, 'schalten')}
        ${row('tablet_flur', 'Flur, an der Tür', [0, 1, 4, 7], 4, 'schalten')}
        ${row('lena', 'Kind', [0, 5], 0, 'nur ihr Zimmer')}
        ${row('gast', 'Gäste', [0, 5], 0, 'Licht + Musik')}
      </table>
      <div class="mkCard" style="margin-top: 14px; display:flex; align-items:center; gap: 12px"><span style="font-size: 26px">📱</span><div style="flex:1"><b>Tablet einrichten</b><div class="muted small">Startseite, Vollbild, ohne Seitenleiste: Schritt für Schritt</div></div><span class="mkBtn blue">Anleitung</span></div>`);
    document.querySelector('.mkModal .box').style.width = '820px';
  }

  // ---------- 📱 the phone: four tabs and "Mehr", the page "Heute" in one column ----------
  function handy() {
    bar('heute', { only: ['haus', 'heute', 'energie', 'kameras'], more: true, dots: {} });
    document.getElementById('mkCss').textContent += `#mkPage { padding: 12px; overflow: hidden; } #mkBar button { flex: 1 1 0; } .huge { font-size: 52px; }`;
    page(`
    <div class="mkGrid" style="gap: 10px;">
      <div class="mkCard" style="display:flex; align-items:center; gap: 12px;">
        <div style="flex:1"><div class="huge">12:30</div><div style="font-weight: 600;">Mittwoch, 21. Oktober</div></div>
        <div style="text-align:center"><div style="font-size: 40px">⛅</div><b style="font-size: 20px">14 °C</b></div>
      </div>
      <div class="mkCard">
        <h2>Im Haus</h2>
        <div class="mkRow"><span>🪟</span><span class="g">2 Fenster offen<br><span class="muted small">Küche, Wohnzimmer</span></span><span class="mkChip red">offen</span></div>
        <div class="mkRow"><span>💡</span><span class="g">10 Lichter an</span><span class="mkChip amber">Alle aus</span></div>
        <div class="mkRow"><span>🪫</span><span class="g">2 Batterien fast leer</span><span class="mkChip red">!</span></div>
      </div>
      <div class="mkCard">
        <h2>Termine heute</h2>
        <div class="mkRow"><b style="width: 50px;">15:00</b><span class="g">Zahnarzt</span><span class="muted small">Anna</span></div>
        <div class="mkRow"><b style="width: 50px;">17:30</b><span class="g">Fußball-Training</span><span class="muted small">Max</span></div>
      </div>
      <div class="mkCard" style="display:flex; align-items:center; gap: 12px;"><span style="font-size: 30px">🟡</span><div><b>Morgen: Gelber Sack</b><div class="muted small">Fr: Restmüll</div></div></div>
      <div class="mkCard" style="display:flex; gap: 16px;"><div><b style="font-size: 22px">☀️ 4.100 W</b><div class="muted small">vom Dach</div></div><div><b style="font-size: 22px">🔋 82 %</b><div class="muted small">lädt</div></div></div>
    </div>`);
  }

  return { handy, bar, page, modal, tabletHeader, heute, energie, klima, kameras, klingel, musik, haushalt, ablaeufe, familie, benutzer };
})();
