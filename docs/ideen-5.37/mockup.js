/* Beispielbilder ideen-5.37 (2026-11-26): die Seite ⚡ Energie fotorealistischer und moderner. Nur fürs Foto in die echte Demo gemalt
 * (make_pictures.cjs ruft window.__mk(idee, hausbild) auf); die Zahlen sind die der Demo (Tag, Demo-Haus). */
window.__mk = (idea, house) => {
  const page = document.querySelector('[data-page=energy]');
  [...page.children].forEach((c) => { c.style.display = 'none'; });
  const own = [0.55, 0.5, 0.52, 0.4, 0, 0, 0, 0, 0.05], grid = [0, 0, 0, 0.07, 0.48, 0.5, 0.98, 1.02, 0.97];
  const css = `
  .mk { --o:#ffb02e; --g:#4fa3ff; --b:#e8559a; --h:#3ddc84; font-family: inherit; color:#eef2f7; padding: 18px 24px 40px; }
  .mk * { box-sizing: border-box; }
  .mkHead { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
  .mkHead h1 { font-size:26px; margin:0 8px 0 0; font-weight:800; letter-spacing:-.5px; }
  .mkSeg { display:flex; background:#ffffff10; border:1px solid #ffffff1a; border-radius:999px; padding:3px; }
  .mkSeg span { padding:6px 14px; border-radius:999px; font-size:14px; opacity:.75; }
  .mkSeg span.on { background:#ffffff; color:#111; opacity:1; font-weight:700; }
  .mkSp { flex:1; }
  .mkHero { position:relative; border-radius:28px; overflow:hidden; background:radial-gradient(120% 90% at 30% 20%, #2a3550, #0d1118 70%);
    border:1px solid #ffffff14; box-shadow: 0 30px 60px #0008; display:grid; grid-template-columns: 62% 38%; height:560px; }
  .mkStage { position:relative; height:100%; overflow:hidden; }
  .mkWrap { position:absolute; left:-4%; top:-10%; width:112%; aspect-ratio:3/2; }
  .mkWrap img { width:100%; height:100%; display:block; filter: saturate(1.15) contrast(1.08) brightness(1.05);
    -webkit-mask-image: radial-gradient(70% 70% at 45% 50%, #000 55%, transparent 100%); mask-image: radial-gradient(70% 70% at 45% 50%, #000 55%, transparent 100%); }
  .mkWrap svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .mkPill { position:absolute; transform:translate(-50%,-50%); display:flex; align-items:center; gap:10px; padding:10px 16px 10px 10px; border-radius:18px;
    background:#0e1420b8; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border:1px solid #ffffff26; box-shadow:0 10px 30px #0007; white-space:nowrap; }
  .mkPill i { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; font-style:normal; font-size:20px; }
  .mkPill b { display:block; font-size:22px; font-weight:800; letter-spacing:-.4px; line-height:1.05; }
  .mkPill small { display:block; font-size:12px; opacity:.7; }
  .mkSide { padding:34px 34px 30px 10px; display:flex; flex-direction:column; gap:18px; z-index:1; }
  .mkSide .lbl { font-size:13px; letter-spacing:1.5px; text-transform:uppercase; opacity:.6; font-weight:700; }
  .mkBig { font-size:64px; font-weight:800; letter-spacing:-2px; line-height:1; }
  .mkBig small { font-size:22px; font-weight:600; opacity:.7; letter-spacing:0; margin-left:6px; }
  .mkSplit { height:14px; border-radius:999px; overflow:hidden; display:flex; background:#ffffff12; }
  .mkSplit div:first-child { background:linear-gradient(90deg,#ffcf5a,#ff9f1c); box-shadow:0 0 18px #ffb02e88; }
  .mkSplit div:last-child { background:linear-gradient(90deg,#4fa3ff,#2f6fd6); }
  .mkKeys { display:flex; justify-content:space-between; font-size:13px; opacity:.85; }
  .mkMini { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .mkMini div { background:#ffffff0c; border:1px solid #ffffff14; border-radius:16px; padding:12px 14px; }
  .mkMini b { font-size:24px; font-weight:800; display:block; }
  .mkMini small { opacity:.65; font-size:12px; }
  .mkRow { display:grid; grid-template-columns: 2fr 1fr; gap:18px; margin-top:18px; }
  .mkCard { border-radius:24px; padding:20px 22px; background:linear-gradient(160deg,#1b2333,#121822); border:1px solid #ffffff12; box-shadow:0 20px 40px #0006; }
  .mkCard h3 { margin:0 0 12px; font-size:13px; letter-spacing:1.5px; text-transform:uppercase; opacity:.6; }
  .mkDev { display:flex; align-items:center; gap:12px; padding:9px 0; border-bottom:1px solid #ffffff0d; }
  .mkDev:last-child { border:0; }
  .mkDev i { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; font-style:normal; font-size:21px; background:linear-gradient(145deg,#2c3850,#1a2130); box-shadow: inset 0 1px 0 #ffffff1c; }
  .mkDev span { flex:1; font-size:15px; }
  .mkDev .bar { width:110px; height:8px; border-radius:99px; background:#ffffff10; overflow:hidden; }
  .mkDev .bar div { height:100%; border-radius:99px; background:linear-gradient(90deg,#ff9f1c,#ff5e3a); }
  .mkDev b { width:78px; text-align:right; font-size:15px; }
  /* Idee 2: Glas */
  .mkGlass { position:relative; overflow:hidden; }
  .mkBg { position:absolute; inset:0; z-index:0; background-size:cover; background-position:center; filter: blur(28px) saturate(1.4) brightness(.55); transform:scale(1.15); }
  .mkGlass > .mkIn { position:relative; z-index:1; }
  .mkGlass .mkCard { background:#ffffff12; backdrop-filter: blur(22px) saturate(1.3); -webkit-backdrop-filter: blur(22px) saturate(1.3); border:1px solid #ffffff2a; box-shadow: 0 20px 50px #0005, inset 0 1px 0 #ffffff30; }
  .mkTiles { display:grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap:16px; }
  .mkT b { font-size:38px; font-weight:800; letter-spacing:-1px; display:block; line-height:1.1; }
  .mkT b small { font-size:16px; opacity:.7; font-weight:600; }
  .mkT .s { font-size:13px; opacity:.7; }
  .mkT .ic { width:44px; height:44px; border-radius:14px; display:grid; place-items:center; font-size:22px; margin-bottom:12px; }
  .mkRing { display:flex; align-items:center; gap:18px; }
  .mkBat { width:150px; height:64px; border-radius:14px; border:3px solid #ffffffcc; position:relative; padding:5px; }
  .mkBat::after { content:''; position:absolute; right:-11px; top:20px; width:7px; height:18px; border-radius:0 4px 4px 0; background:#ffffffcc; }
  .mkBat div { height:100%; border-radius:8px; background:linear-gradient(90deg,#2ecf73,#7dffb0); box-shadow:0 0 24px #3ddc8499; }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const box = document.createElement('div'); box.className = 'mk'; page.appendChild(box);
  page.scrollTop = 0;

  const head = `<div class="mkHead"><h1>⚡ Energie</h1><div class="mkSeg"><span class="on">Demo-Haus</span><span>Nachbarhaus</span><span>Alle</span><span>⚖ Vergleichen</span></div>
    <div class="mkSp"></div><div class="mkSeg"><span>‹</span><span class="on">Heute</span><span>›</span></div><div class="mkSeg"><span class="on">Tag</span><span>Woche</span><span>Monat</span><span>Jahr</span></div></div>`;

  // flow lines over the picture of the house (viewBox = the picture, 1200 x 800)
  const flow = (d, col, w = 5) => `<path d="${d}" stroke="${col}" stroke-width="${w * 3}" fill="none" opacity=".25" filter="url(#mkBlur)" stroke-linecap="round"/>
     <path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
     <path d="${d}" stroke="#fff" stroke-width="${w * 0.9}" fill="none" stroke-linecap="round" stroke-dasharray="2 34" opacity=".95"/>`;
  const svg = `<svg viewBox="0 0 1200 800" preserveAspectRatio="none"><defs><filter id="mkBlur"><feGaussianBlur stdDeviation="6"/></filter></defs>
     ${flow('M 330 150 C 340 230, 380 300, 450 430', '#ffb02e')}
     ${flow('M -40 640 C 120 600, 260 560, 450 470', '#4fa3ff', 4)}
     ${flow('M 450 470 C 400 560, 360 610, 320 640', '#e8559a', 4)}
     ${flow('M 870 590 C 760 560, 620 520, 470 470', '#ffb02e', 3)}
     <circle cx="450" cy="455" r="16" fill="#3ddc84"/><circle cx="450" cy="455" r="40" fill="#3ddc84" opacity=".25" filter="url(#mkBlur)"/></svg>`;
  const pill = (x, y, ic, bg, val, sub) => `<div class="mkPill" style="left:${x}%;top:${y}%"><i style="background:${bg}">${ic}</i><div><b>${val}</b><small>${sub}</small></div></div>`;
  const pills = pill(42, 20, '☀️', 'linear-gradient(145deg,#ffcf5a,#ff9f1c)', '800 W', 'Sonne (Dach + Garten)') +
    pill(11, 76, '⚡', 'linear-gradient(145deg,#6fb6ff,#2f6fd6)', '131 W', 'aus dem Netz') +
    pill(24, 88, '🔋', 'linear-gradient(145deg,#ff8ac0,#c93a7d)', '82 %', 'lädt mit 650 W') +
    pill(58, 50, '🏠', 'linear-gradient(145deg,#6ff0a6,#22a85e)', '1,58 kW', 'Haus braucht jetzt');
  const devs = [['♨️', 'Wärmepumpe', 2.31], ['🧊', 'Kühlschrank', 0.36], ['🖥️', 'Büro (PC)', 0.20], ['📺', 'Fernseher', 0.16]]
    .map(([i, n, v]) => `<div class="mkDev"><i>${i}</i><span>${n}</span><div class="bar"><div style="width:${(v / 2.31) * 100}%"></div></div><b>${v.toFixed(2).replace('.', ',')} kWh</b></div>`).join('');

  // smooth area chart of today (hours 0..23, only up to now)
  const chart = (W, H, bars) => {
    const max = 1.1, x = (h) => 30 + (h / 23) * (W - 40), y = (v) => H - 26 - (v / max) * (H - 50);
    if (bars) {
      let s = '';
      for (let h = 0; h < 24; h++) {
        const bw = (W - 40) / 24 - 8, bx = x(h) - bw / 2;
        if (h >= own.length) { s += `<rect x="${bx}" y="${H - 30}" width="${bw}" height="4" rx="2" fill="#ffffff14"/>`; continue; }
        const go = own[h], gg = grid[h];
        s += `<rect x="${bx}" y="${y(go + gg)}" width="${bw}" height="${y(0) - y(go + gg)}" rx="7" fill="url(#mkG)"/>`;
        if (go) s += `<rect x="${bx}" y="${y(go)}" width="${bw}" height="${y(0) - y(go)}" rx="7" fill="url(#mkO)"/>`;
      }
      return s;
    }
    const line = (arr) => arr.map((v, h) => `${h ? 'L' : 'M'} ${x(h)} ${y(v)}`).join(' ');
    const sum = own.map((v, h) => v + grid[h]);
    const area = (arr) => `${line(arr)} L ${x(arr.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
    return `<path d="${area(sum)}" fill="url(#mkG)"/><path d="${area(own)}" fill="url(#mkO)"/>
      <path d="${line(sum)}" stroke="#7cc0ff" stroke-width="3" fill="none"/><path d="${line(own)}" stroke="#ffc24d" stroke-width="3" fill="none"/>
      <circle cx="${x(8)}" cy="${y(sum[8])}" r="7" fill="#fff"/><circle cx="${x(8)}" cy="${y(sum[8])}" r="16" fill="#fff" opacity=".2"/>`;
  };
  const chartSvg = (W, H, bars) => `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}"><defs>
     <linearGradient id="mkO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc24d"/><stop offset="1" stop-color="#ff8a00" stop-opacity="${bars ? 1 : 0.15}"/></linearGradient>
     <linearGradient id="mkG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb6ff"/><stop offset="1" stop-color="#2f6fd6" stop-opacity="${bars ? 1 : 0.1}"/></linearGradient></defs>
     ${[0, 6, 12, 18].map((h) => `<text x="${30 + (h / 23) * (W - 40)}" y="${H - 4}" fill="#ffffff80" font-size="13" text-anchor="middle">${h} Uhr</text>`).join('')}
     ${chart(W, H, bars)}</svg>`;

  if (idea === 1) {
    box.innerHTML = head + `<div class="mkHero"><div class="mkStage"><div class="mkWrap"><img src="${house}">${svg}${pills}</div></div>
      <div class="mkSide"><div class="lbl">Heute verbraucht</div><div class="mkBig">6,29<small>kWh</small></div>
      <div class="mkSplit"><div style="width:33%"></div><div style="width:67%"></div></div>
      <div class="mkKeys"><span>☀️ 33 % selbst gemacht</span><span>⚡ 67 % aus dem Netz</span></div>
      <div class="mkMini"><div><small>Kosten heute</small><b>1,35 €</b></div><div><small>Gestern um die Zeit</small><b>6,23 kWh</b></div>
      <div><small>Vom Dach</small><b>0,07 kWh</b></div><div><small>Eingespeist</small><b>0,00 kWh</b></div></div></div></div>
      <div class="mkRow"><div class="mkCard"><h3>Verbrauch pro Stunde</h3>${chartSvg(860, 230, true)}</div><div class="mkCard"><h3>Größte Verbraucher</h3>${devs}</div></div>`;
  } else if (idea === 2) {
    box.className = 'mk mkGlass';
    const ring = `<svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="38" stroke="#ffffff1f" stroke-width="12" fill="none"/>
      <circle cx="48" cy="48" r="38" stroke="url(#mkR)" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${0.33 * 238.8} 239" transform="rotate(-90 48 48)"/>
      <defs><linearGradient id="mkR"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff9f1c"/></linearGradient></defs>
      <text x="48" y="55" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">33%</text></svg>`;
    const tile = (ic, bg, lbl, val, unit, sub) => `<div class="mkCard mkT"><div class="ic" style="background:${bg}">${ic}</div><div class="s">${lbl}</div><b>${val}<small> ${unit}</small></b><div class="s">${sub}</div></div>`;
    box.innerHTML = `<div class="mkBg" style="background-image:url(${house})"></div><div class="mkIn">` + head +
      `<div class="mkTiles"><div class="mkCard mkT"><div class="mkRing">${ring}<div><div class="s">Selbst gemacht</div><b>2,07<small> kWh</small></b><div class="s">von 6,29 kWh heute</div></div></div></div>` +
      tile('⚡', 'linear-gradient(145deg,#6fb6ff,#2f6fd6)', 'Aus dem Netz', '4,22', 'kWh', 'eingespeist: 0,00') +
      tile('☀️', 'linear-gradient(145deg,#ffcf5a,#ff9f1c)', 'Vom Dach', '0,07', 'kWh', 'jetzt 800 W') +
      tile('💶', 'linear-gradient(145deg,#6ff0a6,#22a85e)', 'Kosten', '1,35', '€', 'gestern um die Zeit 1,33 €') + `</div>
      <div class="mkRow"><div class="mkCard"><h3>Heute · Verbrauch</h3>${chartSvg(860, 250, false)}
        <div style="display:flex;gap:18px;font-size:13px;opacity:.85"><span>🟠 von Sonne und Batterie</span><span>🔵 aus dem Netz</span></div></div>
        <div class="mkCard"><h3>Hausbatterie</h3><div style="display:flex;align-items:center;gap:22px"><div class="mkBat"><div style="width:82%"></div></div>
        <div><b style="font-size:40px;font-weight:800">82 %</b><div style="opacity:.7;font-size:13px">lädt mit 650 W · voll um 10:10</div></div></div>
        <h3 style="margin-top:22px">Größte Verbraucher</h3>${devs}</div></div></div>`;
  } else if (idea === 3) {
    box.style.padding = '14px 14px 30px';
    box.innerHTML = `<div class="mkHead" style="margin-bottom:12px"><h1 style="font-size:22px;white-space:nowrap">⚡ Energie</h1><div class="mkSp"></div><div class="mkSeg"><span class="on">Tag</span><span>Woche</span><span>Monat</span></div></div>
      <div class="mkHero" style="grid-template-columns:1fr;height:370px"><div class="mkStage"><div class="mkWrap" style="left:-30%;top:-2%;width:165%">
        <img src="${house}">${svg.replace(/stroke-width="(\d+)"/g, (m, w) => `stroke-width="${w * 1.6}"`)}</div>
        ${pill(30, 10, '☀️', 'linear-gradient(145deg,#ffcf5a,#ff9f1c)', '800 W', 'Sonne')}${pill(74, 32, '🏠', 'linear-gradient(145deg,#6ff0a6,#22a85e)', '1,58 kW', 'Haus')}
        ${pill(24, 66, '⚡', 'linear-gradient(145deg,#6fb6ff,#2f6fd6)', '131 W', 'Netz')}${pill(68, 84, '🔋', 'linear-gradient(145deg,#ff8ac0,#c93a7d)', '82 %', 'lädt 650 W')}</div></div>
      <div class="mkCard" style="margin-top:14px"><div class="lbl" style="font-size:12px;letter-spacing:1.5px;opacity:.6;font-weight:700">HEUTE VERBRAUCHT</div>
        <div class="mkBig" style="font-size:48px;margin:6px 0 12px">6,29<small>kWh</small></div>
        <div class="mkSplit"><div style="width:33%"></div><div style="width:67%"></div></div>
        <div class="mkKeys" style="margin-top:8px"><span>☀️ 33 % selbst</span><span>⚡ 67 % Netz</span><span>💶 1,35 €</span></div></div>
      <div class="mkCard" style="margin-top:14px"><h3>Größte Verbraucher</h3>${devs.replace(/width:110px/g, '')}</div>`;
    box.querySelectorAll('.mkDev .bar').forEach((b) => { b.style.width = '60px'; });
  }
};
