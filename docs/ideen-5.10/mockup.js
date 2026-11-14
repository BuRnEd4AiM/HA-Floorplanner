/* Beispielbilder für docs/ideen-5.10 (2026-11-14): neue Entwürfe der Raumkarte (Live, ein Raum angetippt), nur fürs Foto in die echte
 * Demo gemalt (nichts wird gespeichert). Die Zeilen der heutigen Raumkarte (#roomPanel, #heatPanel) werden gelesen und in einem neuen
 * Kasten (#mkCard) anders gezeichnet. Aufruf über make_pictures.py: mockRoom(1 … 5, { phone, full }). */
(() => {
  const css = (id, s) => { let e = document.getElementById(id); if (!e) { e = document.createElement('style'); e.id = id; document.head.append(e); } e.textContent = s; };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (s) => { const m = String(s).replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; };
  const de = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('de-DE');

  /* ---------- die heutige Karte lesen ---------- */
  const GROUP = { licht: 'light', 'rollläden': 'cover', medien: 'media', schalter: 'switch', sensoren: 'sensor', 'szenen & skripte': 'scene',
    'türen': 'door', fenster: 'window', tore: 'gate', kameras: 'camera' };
  function scrape() {
    const box = $('#roomPanel'), f = floorOf();
    const D = { name: $('.rp-head b', box).textContent, area: $(':scope > .sub', box).textContent, g: {}, scenes: [], heat: null };
    const rc = $('.roomctl', box);
    if (rc) { D.lightsSub = $(':scope > .sub', rc)?.textContent || ''; D.scenes = $$('.scenes button', rc).map((b) => b.textContent); }
    let g = null;
    for (const el of box.children) {
      if (el.tagName === 'H4') { g = GROUP[el.firstChild.textContent.trim().toLowerCase()] || 'other'; D.g[g] = []; continue; }
      if (!el.classList.contains('row') || !g) continue;
      const n = $('.n', el)?.textContent || '', dev = (f.devices || []).find((d) => d.name === n);
      const r = $(':scope > input[type=range]', el);
      D.g[g].push({ n, v: $('.v', el)?.textContent || '', on: el.classList.contains('on'), alert: el.classList.contains('alert'),
        bri: r ? +r.value : null, type: dev?.type || '', entity: dev?.entity || '' });
    }
    const hp = $('#heatPanel .hp');
    if (hp) {
      const cl = (f.devices || []).find((d) => d.entity?.startsWith('climate.') && window.__fp.states()[d.entity] && pointIn(d.x, d.z, room().points));
      const st = cl ? window.__fp.states()[cl.entity] : {};
      D.heat = { name: $('.hp-name', hp).textContent, now: st.ct ?? num($('.hp-now', hp).textContent), target: st.tt, hum: st.ch, badge: $('.hp-badge', hp).textContent,
        modes: $$('.hp-modes:not(.hp-presets) button', hp).map((b) => [b.textContent, b.classList.contains('on')]),
        presets: $$('.hp-presets button', hp).map((b) => [b.textContent, b.classList.contains('on')]), min: st.tmin ?? 16, max: st.tmax ?? 26 };
    }
    return D;
  }
  const floorOf = () => { const fp = window.__fp, i = typeof fp.floorIdx === 'function' ? fp.floorIdx() : fp.floorIdx; return fp.layout.floors[i]; };
  const room = () => { const f = floorOf(); return f.rooms.find((r) => r.id === window.__fp.focusedRoom()) || f.rooms[0]; };
  function pointIn(x, z, pts) {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, zi] = pts[i], [xj, zj] = pts[j];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins;
    }
    return ins;
  }

  /* ---------- Symbole ---------- */
  const roomIco = (n) => (/wohn/i.test(n) ? '🛋️' : /schlaf|^sz/i.test(n) ? '🛏️' : /küche/i.test(n) ? '🍳' : /bad/i.test(n) ? '🛁' : /büro|arbeit/i.test(n) ? '💻'
    : /kind/i.test(n) ? '🧸' : '🏠');
  const devIco = (g, d) => {
    const n = d.n, t = d.type;
    if (g === 'light') return t === 'nanoleaf' || /nanoleaf/i.test(n) ? '🔷' : t === 'strip' || /led|voute/i.test(n) ? '✨' : /fernseh|tv/i.test(n) ? '📺' : '💡';
    if (g === 'media') return t === 'speaker' || /laut|sonos/i.test(n) ? '🔊' : '📺';
    if (g === 'switch') return t.startsWith('fan') || /ventil/i.test(n) ? '🌀' : '🔌';
    if (g === 'cover') return '🪟';
    if (g === 'door') return '🚪';
    if (g === 'window') return '🪟';
    if (g === 'camera') return '📷';
    return '•';
  };
  const sceneIco = (n) => (/gemütlich|cozy/i.test(n) ? '🛋️' : /\baus\b|off/i.test(n) ? '🌙' : /tv|film|kino/i.test(n) ? '🎬' : /morgen/i.test(n) ? '☀️' : /lesen/i.test(n) ? '📖' : '✨');
  const shortScene = (n, room) => n.replace(new RegExp('^' + room + '\\s+', 'i'), '');
  const shortDev = (n) => n.replace(/\s*\(.*?\)\s*/g, '').replace(/ Wohnzimmer$/, '');

  /** die Werte des Raums als kleine Chips (Temperatur, Luftfeuchte, CO₂, Strom, offene Fenster / Türen) */
  function chips(D, max = 9) {
    const out = [], s = D.g.sensor || [];
    const temp = D.heat?.now ?? num(s.find((x) => /°C/.test(x.v))?.v);
    if (temp != null) out.push(['🌡️', `${de(temp)} °C`, '']);
    if (D.heat?.hum != null) out.push(['💧', `${D.heat.hum} %`, '']);
    const co2 = s.find((x) => /ppm/.test(x.v));
    if (co2) { const v = num(co2.v); out.push(['🫧', `${v} ppm`, v > 1200 ? 'bad' : v > 800 ? 'warn' : 'good']); }
    const w = s.find((x) => /\bW$/.test(x.v));
    if (w) out.push(['⚡', w.v.replace(' W', ' W'), '']);
    const openW = (D.g.window || []).filter((x) => x.alert).length, openD = (D.g.door || []).filter((x) => x.alert).length;
    if (openW + openD) out.push(['🪟', `${openW + openD} offen`, 'bad']);
    return `<div class="mkChips">${out.slice(0, max).map(([i, v, c]) => `<span class="mkChip ${c}"><i>${i}</i>${esc(v)}</span>`).join('')}</div>`;
  }
  const lights = (D) => D.g.light || [];
  const lightsOn = (D) => lights(D).filter((l) => l.on);
  const head = (D, extra = '') => `
    <div class="mkHead">
      <div class="mkRoomIco">${roomIco(D.name)}</div>
      <div class="mkTitle"><b>${esc(D.name)}</b><small>${esc(D.area)} · ${lightsOn(D).length ? `💡 ${lightsOn(D).length} von ${lights(D).length} an` : 'alle Lichter aus'}</small></div>
      ${extra}<button class="mkX" type="button">×</button>
    </div>`;
  const coverPct = (D) => num((D.g.cover || [])[0]?.v) ?? 0;

  /* ---------- gemeinsame Bausteine ---------- */
  const scenesRow = (D, cls = 'mkScenes') => D.scenes.length ? `<div class="${cls}">${D.scenes.map((s, i) =>
    `<button type="button" class="${i === 0 ? 'act' : ''}"><i>${sceneIco(s)}</i><span>${esc(shortScene(s, D.name))}</span></button>`).join('')}</div>` : '';
  const shutterSvg = (pct, w = 46, h = 56) => {             // ein Fenster mit dem Rollladen davor (pct = offen)
    const closed = Math.round((h - 8) * (100 - pct) / 100), slats = Math.max(0, Math.floor(closed / 4));
    return `<svg class="mkShut" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="4" fill="url(#mkSky)" stroke="currentColor" stroke-opacity=".5"/>
      <line x1="${w / 2}" y1="4" x2="${w / 2}" y2="${h - 4}" stroke="currentColor" stroke-opacity=".35"/>
      <rect x="3" y="3" width="${w - 6}" height="${closed}" fill="#9aa7b4"/>
      ${Array.from({ length: slats }, (_, i) => `<line x1="3" x2="${w - 3}" y1="${3 + (i + 1) * 4}" y2="${3 + (i + 1) * 4}" stroke="#6b7783" stroke-width="1"/>`).join('')}
      <defs><linearGradient id="mkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f7d"/><stop offset="1" stop-color="#11223a"/></linearGradient></defs>
    </svg>`;
  };
  function dial(H, size = 150) {                              // runder Regler der Heizung (Bogen von 135° bis 405°)
    const r = size / 2 - 12, c = size / 2, a0 = 135, a1 = 405;
    const ang = (v) => a0 + (a1 - a0) * Math.min(1, Math.max(0, (v - H.min) / (H.max - H.min)));
    const pt = (a) => [c + r * Math.cos(a * Math.PI / 180), c + r * Math.sin(a * Math.PI / 180)];
    const arc = (x, y) => { const [sx, sy] = pt(x), [ex, ey] = pt(y); return `M ${sx} ${sy} A ${r} ${r} 0 ${y - x > 180 ? 1 : 0} 1 ${ex} ${ey}`; };
    const on = !/aus/i.test(H.badge), tA = ang(H.target ?? H.now), [kx, ky] = pt(tA), [nx, ny] = pt(ang(H.now));
    return `<svg class="mkDial" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <defs><linearGradient id="mkHeatG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3fa9f5"/><stop offset=".55" stop-color="#ffb347"/><stop offset="1" stop-color="#ff5a36"/></linearGradient></defs>
      <path d="${arc(a0, a1)}" stroke="rgba(255,255,255,.10)" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="${arc(a0, tA)}" stroke="url(#mkHeatG)" stroke-opacity="${on ? 1 : 0.45}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <circle cx="${nx}" cy="${ny}" r="3" fill="#fff" opacity=".8"/>
      <circle cx="${kx}" cy="${ky}" r="9" fill="#fff" stroke="rgba(0,0,0,.25)"/>
      <text x="${c}" y="${c + 2}" text-anchor="middle" font-size="${size * 0.2}" font-weight="700" fill="currentColor">${de(H.now)}°</text>
      <text x="${c}" y="${c + size * 0.16}" text-anchor="middle" font-size="${size * 0.085}" fill="currentColor" opacity=".6">Ziel ${de(H.target ?? H.now)}°</text>
    </svg>`;
  }
  const windowsList = (D) => {
    const items = [...(D.g.window || []).map((x) => ['window', x]), ...(D.g.door || []).map((x) => ['door', x]), ...(D.g.gate || []).map((x) => ['gate', x])];
    if (!items.length) return '';
    return `<div class="mkOpenings">${items.map(([g, x]) => {
      const tilt = /gekippt/i.test(x.v), cls = x.alert ? (tilt ? 'warn' : 'bad') : 'ok';
      return `<span class="mkOp ${cls}"><i>${devIco(g, x)}</i><span>${esc(shortDev(x.n).replace(/^Fenster /, '').replace(/^Tür /, 'Tür '))}</span><b>${esc(x.v)}</b></span>`;
    }).join('')}</div>`;
  };
  const sec = (title, right = '') => `<div class="mkSec"><span>${title}</span>${right}</div>`;

  /* ---------- Idee 1: Kacheln ---------- */
  function idea1(D) {
    const tile = (g, d, extra = '') => {
      const st = d.on ? (d.bri != null && g === 'light' ? `An · ${d.bri} %` : d.v) : d.v;
      return `<button type="button" class="mkTile ${d.on ? 'on' : ''} ${g}" style="--b:${d.on && d.bri != null ? d.bri : 0}%">
        <i class="ti">${devIco(g, d)}</i><span class="tt"><span class="tn">${esc(shortDev(d.n))}</span><span class="tv">${esc(st)}</span></span><span class="tm">›</span>${extra}
        ${g === 'light' ? '<em class="tb"></em>' : ''}</button>`;
    };
    const H = D.heat, cov = (D.g.cover || [])[0];
    let h = head(D) + chips(D);
    h += scenesRow(D);
    if (lights(D).length) h += sec('Licht', lightsOn(D).length ? '<button type="button" class="mkPill">Alle aus</button>' : '') + `<div class="mkGrid">${lights(D).map((d) => tile('light', d)).join('')}</div>`;
    if (H || cov) {
      h += sec('Klima & Rollladen');
      if (H) h += `<div class="mkWide heat"><i class="ti">🔥</i><div class="wt"><span class="tn">${esc(H.name)} <em class="hb">${esc(H.badge)}</em></span><span class="tv">jetzt ${de(H.now)}° · ${esc(H.presets.find((p) => p[1])?.[0] || '')}</span></div>
        <div class="pm"><button type="button">−</button><span>${de(H.target ?? H.now)}°</span><button type="button">+</button></div></div>`;
      if (cov) h += `<div class="mkWide cover">${shutterSvg(coverPct(D), 34, 40)}<div class="wt"><span class="tn">${esc(shortDev(cov.n))}</span><span class="tv">${esc(cov.v)}</span></div>
        <div class="ud"><button type="button">▲</button><button type="button">■</button><button type="button">▼</button></div><em class="cb" style="--p:${coverPct(D)}%"></em></div>`;
    }
    const other = [...(D.g.media || []).map((d) => ['media', d]), ...(D.g.switch || []).map((d) => ['switch', d])];
    if (other.length) h += sec('Geräte') + `<div class="mkGrid">${other.map(([g, d]) => tile(g, { ...d, on: d.on || /läuft|an$/i.test(d.v) })).join('')}</div>`;
    if (D.g.window || D.g.door) h += sec('Fenster & Türen') + windowsList(D);
    return h;
  }

  /* ---------- Idee 2: große Schieber ---------- */
  function idea2(D) {
    const on = lightsOn(D), avg = on.length ? Math.round(on.reduce((a, l) => a + (l.bri ?? 100), 0) / on.length) : 0, H = D.heat;
    let h = head(D) + chips(D);
    if (lights(D).length) h += `<div class="mkBig ${on.length ? 'on' : ''}" style="--b:${avg}%"><em></em><i>💡</i><div><b>Alle Lichter</b><small>${on.length} von ${lights(D).length} an</small></div><span>${on.length ? avg + ' %' : 'aus'}</span></div>
      <div class="mkMini"><button type="button"><i style="background:conic-gradient(#ff3b30,#ffd60a,#34c759,#23e0ff,#0a84ff,#bf5af2,#ff3b30)"></i>Farbe</button>
      <button type="button"><i style="background:linear-gradient(90deg,#ffad58,#fff5ff)"></i>Weißton</button><button type="button">⏻ Alle aus</button></div>`;
    const cov = (D.g.cover || [])[0];
    if (cov || H) {
      h += '<div class="mkDuo">';
      if (cov) {
        const p = coverPct(D);
        h += `<div class="mkBox"><div class="bt">${esc(shortDev(cov.n))}<b>${p} %</b></div>
          <div class="mkWin"><div class="sky"></div><div class="shut" style="height:${100 - p}%"><i></i></div><div class="cross"></div></div>
          <div class="ud"><button type="button">▲</button><button type="button">■</button><button type="button">▼</button></div></div>`;
      }
      if (H) h += `<div class="mkBox heat"><div class="bt">${esc(H.name)}<b class="badge">${esc(H.badge)}</b></div>${dial(H, 132)}
          <div class="pm"><button type="button">−</button><button type="button">+</button></div></div>`;
      h += '</div>';
    }
    if (lights(D).length) h += sec('Lichter einzeln') + lights(D).map((d) => `<div class="mkFat ${d.on ? 'on' : ''}" style="--b:${d.on ? d.bri ?? 100 : 0}%"><em></em>
        <i>${devIco('light', d)}</i><span>${esc(shortDev(d.n))}</span><b>${d.on ? (d.bri ?? 100) + ' %' : 'aus'}</b></div>`).join('');
    if (D.scenes.length) h += sec('Szenen') + scenesRow(D, 'mkScenes tiles');
    const media = D.g.media || [];
    if (media.length) h += sec('Medien') + media.map((d) => `<div class="mkPlayer"><i>${devIco('media', d)}</i><div><b>${esc(shortDev(d.n))}</b><small>${esc(d.v)}</small></div>
        <div class="pc"><button type="button">⏮</button><button type="button" class="pp">⏸</button><button type="button">⏭</button></div></div>`).join('');
    return h;
  }

  /* ---------- Idee 3: Reiter ---------- */
  function idea3(D, tab = 'light') {
    const H = D.heat, cov = (D.g.cover || [])[0];
    const openN = [...(D.g.window || []), ...(D.g.door || [])].filter((x) => x.alert).length;
    const tabs = [
      ['light', '💡', 'Licht', lights(D).length ? `${lightsOn(D).length}/${lights(D).length}` : ''],
      ['cover', '🪟', 'Rollo', cov ? `${coverPct(D)} %` : ''],
      ['climate', '🌡️', 'Klima', H ? `${de(H.now)}°` : ''],
      ['media', '📺', 'Geräte', (D.g.media || []).length + (D.g.switch || []).length || ''],
      ['open', '🚪', 'Fenster', openN ? `${openN} offen` : ''],
    ].filter((x) => x[3] !== '');
    let h = head(D) + chips(D, 4);
    h += `<div class="mkTabs">${tabs.map(([k, i, l, b]) => `<button type="button" class="${k === tab ? 'on' : ''} ${k === 'open' && openN ? 'alarm' : ''}"><i>${i}</i><span>${l}</span><small>${b}</small></button>`).join('')}</div>`;
    h += '<div class="mkTabBody">';
    if (tab === 'light') {
      h += scenesRow(D);
      h += sec(`${lightsOn(D).length} von ${lights(D).length} an`, '<span class="mkPills"><button type="button" class="mkPill">Alle an</button><button type="button" class="mkPill">Alle aus</button></span>');
      h += lights(D).map((d) => `<div class="mkRow ${d.on ? 'on' : ''}" style="--b:${d.on ? d.bri ?? 100 : 0}%"><em></em><i>${devIco('light', d)}</i>
        <span>${esc(shortDev(d.n))}</span><small>${d.on ? (d.bri ?? 100) + ' %' : 'aus'}</small><label class="mkSw ${d.on ? 'on' : ''}"><b></b></label></div>`).join('');
      h += `<details class="mkMore"><summary>🎨 Farbe &amp; Weißton für alle Lichter</summary></details>`;
    }
    if (tab === 'climate' && H) {
      h += `<div class="mkClimate"><div class="now"><small>Jetzt</small><b>${de(H.now)}°</b>${H.hum != null ? `<small>💧 ${H.hum} %</small>` : ''}</div>
        <div class="set"><small>Ziel</small><div class="pm"><button type="button">−</button><b>${de(H.target ?? H.now)}°</b><button type="button">+</button></div></div></div>
        <div class="mkSeg2 three">${H.modes.map(([l, o]) => `<button type="button" class="${o ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>
        <div class="mkPresets">${H.presets.map(([l, o]) => `<button type="button" class="${o ? 'on' : ''}">${{ Eco: '🌿', Komfort: '😊', Abwesend: '🧳', Boost: '🚀' }[l] || ''} ${esc(l)}</button>`).join('')}</div>`;
      const s = D.g.sensor || [];
      h += sec('Werte im Raum') + `<div class="mkVals">${s.map((x) => `<div class="${/ppm/.test(x.v) && num(x.v) > 800 ? 'warn' : ''}"><small>${esc(shortDev(x.n).replace(/^Temperatur$/, 'Temperatur'))}</small><b>${esc(x.v.replace('.', ','))}</b></div>`).join('')}</div>`;
    }
    h += '</div>';
    return h;
  }

  /* ---------- Idee 4: Handy erst kurz ---------- */
  function idea4(D) {
    const on = lightsOn(D), H = D.heat, p = coverPct(D);
    let h = `<div class="mkGrab"></div>` + head(D) + chips(D, 4);
    h += `<div class="mkQuick">
      <button type="button" class="${on.length ? 'on' : ''}"><i>💡</i><b>Licht</b><small>${on.length ? `${on.length} an` : 'aus'}</small></button>
      ${D.scenes.length ? `<button type="button"><i>${sceneIco(D.scenes[0])}</i><b>Szenen</b><small>${D.scenes.length}</small></button>` : ''}
      ${(D.g.cover || []).length ? `<button type="button"><i>🪟</i><b>Rollo</b><small>${p} %</small></button>` : ''}
      ${H ? `<button type="button"><i>🌡️</i><b>Heizung</b><small>${de(H.now)}°</small></button>` : ''}
    </div>
    <div class="mkHint">⌃ hochziehen: alle ${Object.values(D.g).reduce((a, l) => a + l.length, 0)} Geräte und Werte</div>`;
    return h;
  }

  /* ---------- Idee 5: kleiner Grundriss zum Antippen ---------- */
  function plan(D, W = 360, Hh = 250) {
    const f = floorOf(), r = room(), pts = r.points;
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const pad = 30, k = Math.min((W - 2 * pad) / (x1 - x0), (Hh - 2 * pad) / (z1 - z0));
    const ox = (W - (x1 - x0) * k) / 2, oz = (Hh - (z1 - z0) * k) / 2;
    const X = (x) => ox + (x - x0) * k, Z = (z) => oz + (z - z0) * k;
    const poly = pts.map((p) => `${X(p[0])},${Z(p[1])}`).join(' ');
    let s = `<svg class="mkPlan" viewBox="0 0 ${W} ${Hh}" width="100%">
      <defs><radialGradient id="mkGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".85"/><stop offset=".45" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
      <pattern id="mkFloor" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#2a2420"/><line x1="0" y1="0" x2="0" y2="14" stroke="#3a312a" stroke-width="5"/></pattern></defs>
      <clipPath id="mkClip"><polygon points="${poly}"/></clipPath>
      <polygon points="${poly}" fill="url(#mkFloor)" stroke="#c9d3dc" stroke-width="5" stroke-linejoin="round"/>`;
    const devs = (f.devices || []).filter((d) => pointIn(d.x, d.z, pts));
    const FURN = { sofa: [2.2, 0.9], table: [1.0, 0.6], armchair: [0.85, 0.85], carpet: [2.4, 1.7], shelf: [1.4, 0.4], bed: [1.8, 2.1], desk: [1.4, 0.7] };
    devs.filter((d) => FURN[d.type]).forEach((d) => {
      const [w, dd] = FURN[d.type].map((v) => v * (d.scale || 1) * k), rot = d.rot || 0;
      s += `<rect x="${X(d.x) - w / 2}" y="${Z(d.z) - dd / 2}" width="${w}" height="${dd}" rx="${d.type === 'carpet' ? 4 : 7}" transform="rotate(${rot} ${X(d.x)} ${Z(d.z)})"
        fill="${d.type === 'carpet' ? 'rgba(160,120,90,.25)' : 'rgba(210,220,230,.13)'}" stroke="rgba(210,220,230,.28)"/>`;
    });
    // Fenster und Türen auf den Wänden des Raums
    (f.walls || []).forEach((w) => (w.openings || []).forEach((o) => {
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1, ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
      const cx = w.a[0] + ux * o.pos, cz = w.a[1] + uz * o.pos;
      const near = pts.some((p, i) => { const q = pts[(i + 1) % pts.length]; const t = Math.max(0, Math.min(1, ((cx - p[0]) * (q[0] - p[0]) + (cz - p[1]) * (q[1] - p[1])) / ((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 || 1)));
        return Math.hypot(cx - (p[0] + t * (q[0] - p[0])), cz - (p[1] + t * (q[1] - p[1]))) < 0.35; });
      if (!near) return;
      const [cx0, cz0] = [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length];
      const sg = Math.sign((cx - cx0) * -uz + (cz - cz0) * ux) || 1, nx = -uz * sg, nz = ux * sg;   // nach außen
      const a = [cx - ux * o.width / 2, cz - uz * o.width / 2], b = [cx + ux * o.width / 2, cz + uz * o.width / 2];
      const row = [...(D.g.window || []), ...(D.g.door || [])].find((x) => x.n === o.name);
      const col = row?.alert ? (/gekippt/i.test(row.v) ? '#ffb347' : '#ff5a4d') : o.type === 'door' ? '#c9d3dc' : '#6fc3ff';
      if (o.type === 'door') {
        s += `<line x1="${X(a[0])}" y1="${Z(a[1])}" x2="${X(b[0])}" y2="${Z(b[1])}" stroke="#1a2129" stroke-width="7"/>
          <path d="M ${X(a[0])} ${Z(a[1])} L ${X(a[0]) - nx * o.width * k} ${Z(a[1]) - nz * o.width * k} A ${o.width * k} ${o.width * k} 0 0 ${(nz * ux - nx * uz) > 0 ? 1 : 0} ${X(b[0])} ${Z(b[1])}" fill="none" stroke="${col}" stroke-width="1.6" stroke-dasharray="${row?.alert ? '0' : '3 3'}"/>`;
      } else s += `<line x1="${X(a[0])}" y1="${Z(a[1])}" x2="${X(b[0])}" y2="${Z(b[1])}" stroke="${col}" stroke-width="7" stroke-linecap="round"/>`;
      if (row?.alert) s += `<text x="${X(cx) + nx * 14}" y="${Z(cz) + nz * 14 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="${col}">${esc(row.v.toLowerCase())}</text>`;
    }));
    // Geräte mit Home-Assistant-Entität als runde Knöpfe
    const all = Object.entries(D.g).flatMap(([g, l]) => l.map((d) => [g, d]));
    const seen = new Set();
    devs.filter((d) => d.entity && !FURN[d.type] && !seen.has(d.entity) && seen.add(d.entity)).forEach((d) => {
      const hit = all.find(([, x]) => x.n === d.name), g = hit?.[0] || (d.entity.startsWith('climate.') ? 'climate' : ''), row = hit?.[1];
      if (!g || g === 'sensor') return;
      const on = row?.on || /läuft/i.test(row?.v || '');
      const ico = g === 'climate' ? '🌡️' : g === 'sensor' ? (/ppm/.test(row.v) ? '🫧' : /W$/.test(row.v) ? '⚡' : '🌡️') : devIco(g, { n: d.name, type: d.type });
      const x = X(d.x), y = Z(d.z), small = g === 'sensor';
      if (g === 'light' && on) s += `<circle cx="${x}" cy="${y}" r="${46 * (row.bri ?? 100) / 100 + 14}" fill="url(#mkGlow)" clip-path="url(#mkClip)"/>`;
      s += `<g class="pd ${g} ${on ? 'on' : ''}"><circle cx="${x}" cy="${y}" r="${small ? 11 : 15}" fill="${on ? (g === 'light' ? '#ffcf5c' : '#3fa9f5') : 'rgba(20,28,36,.92)'}"
        stroke="${on ? '#fff' : 'rgba(201,211,220,.55)'}" stroke-width="1.5"/><text x="${x}" y="${y + (small ? 4 : 5)}" text-anchor="middle" font-size="${small ? 11 : 14}">${ico}</text>`;
      if (g === 'climate' || g === 'cover') {
        const v = g === 'climate' ? `${de(D.heat?.now ?? 0)}°` : `${coverPct(D)} %`;
        const lx = g === 'cover' ? x - (v.length * 6.2 + 10) / 2 : x + 13, ly = g === 'cover' ? y + 17 : y - 9;
        s += `<rect x="${lx}" y="${ly}" width="${v.length * 6.2 + 10}" height="16" rx="8" fill="rgba(10,14,20,.85)"/><text x="${lx + 5}" y="${ly + 12}" font-size="10.5" fill="#dfe8f0">${esc(v)}</text>`;
      }
      s += '</g>';
    });
    return s + '</svg>';
  }
  function idea5(D) {
    let h = head(D) + chips(D);
    h += `<div class="mkPlanBox">${plan(D)}<div class="mkPlanHint">Tippen = an / aus · lange drücken = mehr</div></div>`;
    h += scenesRow(D);
    const on = lightsOn(D);
    h += `<div class="mkSeg2"><button type="button">💡 Alle an</button><button type="button">Alle aus</button></div>`;
    const H = D.heat, cov = (D.g.cover || [])[0];
    h += '<div class="mkStrip">';
    if (on.length) h += `<div><small>Licht</small><b>${on.length} an</b></div>`;
    if (cov) h += `<div><small>Rollo</small><b>${coverPct(D)} %</b></div>`;
    if (H) h += `<div><small>Heizung</small><b>${esc(H.badge)} · ${de(H.target ?? H.now)}°</b></div>`;
    h += '</div>';
    return h;
  }

  /* ---------- Aussehen ---------- */
  css('mkRoomCard', `
    #roomPanel.mkGhost { visibility: hidden !important; }
    #heatPanel.mkGhost { display: none !important; }
    #mkCard { position: absolute; z-index: 6; overflow: hidden auto; scrollbar-width: none; color: var(--text);
      background: linear-gradient(180deg, rgba(30,40,52,.94), rgba(18,24,32,.96)); border: 1px solid rgba(255,255,255,.08);
      border-radius: 24px; box-shadow: 0 18px 50px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06); padding: 16px 16px 18px;
      backdrop-filter: blur(14px); font-size: 14px; }
    #mkCard::-webkit-scrollbar { display: none; }
    #mkCard.desk { top: 62px; right: 12px; bottom: 12px; width: 384px; }
    #mkCard.phone .mkTile { padding: 9px 6px 9px 8px !important; gap: 8px; } #mkCard.phone .mkTile .tm { display: none; } #mkCard.phone .mkTile .tn { font-size: 13.5px; }
    #mkCard.phone { left: 10px; right: 10px; bottom: 10px; max-height: 64%; border-radius: 26px; }
    #mkCard button { font: inherit; color: inherit; }
    .mkHead { display: flex; align-items: center; gap: 12px; }
    .mkRoomIco { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; font-size: 24px;
      background: linear-gradient(135deg, rgba(255,190,90,.30), rgba(255,140,60,.12)); border: 1px solid rgba(255,190,90,.35); flex: none; }
    .mkTitle { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .mkTitle b { font-size: 20px; letter-spacing: -.01em; line-height: 1.15; }
    .mkTitle small { color: var(--muted); font-size: 12.5px; margin-top: 2px; }
    .mkX { width: 34px; height: 34px; border-radius: 50%; border: 0 !important; background: rgba(255,255,255,.08) !important; font-size: 20px !important;
      padding: 0 !important; display: grid; place-items: center; color: var(--muted) !important; flex: none; }
    .mkChips { display: flex; gap: 6px; flex-wrap: wrap; margin: 12px 0 2px; }
    #mkCard.phone .mkChips { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-right: -16px; padding-right: 16px; -webkit-mask-image: linear-gradient(90deg, #000 88%, transparent); mask-image: linear-gradient(90deg, #000 88%, transparent); }
    .mkChip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px 5px 8px; border-radius: 999px; font-size: 12.5px; font-weight: 600;
      background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.07); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .mkChip i { font-style: normal; font-size: 13px; }
    .mkChip.good { color: #7ee2a8; } .mkChip.warn { color: #ffc46b; background: rgba(255,179,71,.12); border-color: rgba(255,179,71,.3); }
    .mkChip.bad { color: #ff8a80; background: rgba(255,90,77,.13); border-color: rgba(255,90,77,.35); }
    .mkSec { display: flex; align-items: center; justify-content: space-between; margin: 16px 2px 8px; font-size: 11.5px; font-weight: 700;
      letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
    .mkPill { border: 1px solid rgba(255,255,255,.12) !important; background: rgba(255,255,255,.06) !important; border-radius: 999px !important;
      padding: 3px 12px !important; font-size: 12px !important; letter-spacing: 0; text-transform: none; font-weight: 600; min-height: 0 !important; }
    .mkScenes { display: flex; gap: 8px; margin: 14px 0 0; overflow-x: auto; scrollbar-width: none; -webkit-mask-image: linear-gradient(90deg, #000 85%, transparent); mask-image: linear-gradient(90deg, #000 85%, transparent); }
    .mkScenes.tiles { -webkit-mask-image: none; mask-image: none; }
    .mkScenes button { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px 6px 6px !important; border-radius: 999px !important;
      background: rgba(255,255,255,.06) !important; border: 1px solid rgba(255,255,255,.10) !important; white-space: nowrap; font-weight: 600; font-size: 13.5px; }
    .mkScenes button i { font-style: normal; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.08); font-size: 16px; }
    .mkScenes button.act { background: linear-gradient(135deg, rgba(160,110,255,.35), rgba(90,140,255,.25)) !important; border-color: rgba(170,140,255,.6) !important; }
    .mkScenes.tiles { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 0; }
    .mkScenes.tiles button { flex-direction: column; padding: 12px 6px !important; border-radius: 18px !important; gap: 6px; font-size: 12.5px; white-space: normal; text-align: center; }
    .mkScenes.tiles button i { width: 42px; height: 42px; font-size: 22px; }
    /* Idee 1 */
    .mkGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .mkTile { position: relative; overflow: hidden; display: flex; align-items: center; text-align: left; gap: 10px; min-height: 64px;
      padding: 10px 8px 10px 10px !important; border-radius: 18px !important; background: rgba(255,255,255,.055) !important; border: 1px solid rgba(255,255,255,.08) !important; }
    .mkTile .ti { font-style: normal; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.09); font-size: 18px; flex: none; }
    .mkTile .tt { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .mkTile .tm { color: var(--muted); font-size: 18px; opacity: .6; }
    .mkTile .tn { font-weight: 650; font-size: 14px; line-height: 1.2; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mkTile .tv { font-size: 12.5px; color: var(--muted); white-space: nowrap; }
    .mkTile.on { background: linear-gradient(150deg, rgba(255,200,110,.30), rgba(255,150,60,.10) 70%) !important; border-color: rgba(255,195,100,.55) !important;
      box-shadow: 0 0 22px rgba(255,170,70,.18); }
    .mkTile.on .ti { background: #ffcf5c; box-shadow: 0 0 16px rgba(255,200,90,.7); }
    .mkTile.on .tv { color: #ffd896; }
    .mkTile.media.on, .mkTile.switch.on { background: linear-gradient(150deg, rgba(63,169,245,.30), rgba(63,169,245,.08) 70%) !important; border-color: rgba(100,185,250,.55) !important; box-shadow: none; }
    .mkTile.media.on .ti, .mkTile.switch.on .ti { background: #3fa9f5; box-shadow: 0 0 14px rgba(63,169,245,.6); }
    .mkTile.media.on .tv, .mkTile.switch.on .tv { color: #9fd3ff; }
    .mkTile .tb { position: absolute; left: 0; bottom: 0; height: 4px; width: var(--b); background: linear-gradient(90deg, #ffb347, #ffe08a); border-radius: 0 4px 0 0; }
    .mkWide { position: relative; overflow: hidden; display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 18px; margin-bottom: 8px;
      background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.08); }
    .mkWide .ti { font-style: normal; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,120,60,.18); font-size: 20px; flex: none; }
    .mkWide .wt { display: flex; flex-direction: column; flex: 1; min-width: 0; } .mkWide .tn { font-weight: 650; } .mkWide .tv { font-size: 12.5px; color: var(--muted); }
    .mkWide .hb { font-style: normal; font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: rgba(255,255,255,.1); color: var(--muted); margin-left: 4px; }
    .mkWide .tv { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mkWide .big { font-size: 26px; font-weight: 750; font-variant-numeric: tabular-nums; }
    .pm { display: flex; align-items: center; gap: 6px; } .pm span, .pm b { min-width: 42px; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
    .pm button, .ud button { width: 36px; height: 36px; border-radius: 50% !important; padding: 0 !important; font-size: 18px; background: rgba(255,255,255,.08) !important; border: 1px solid rgba(255,255,255,.1) !important; display: grid; place-items: center; }
    .ud { display: flex; gap: 6px; } .ud button { font-size: 12px; }
    .mkWide.cover .cb { position: absolute; left: 0; bottom: 0; height: 4px; width: var(--p); background: linear-gradient(90deg, #3fa9f5, #8fd6ff); }
    .mkShut { flex: none; color: #c9d3dc; }
    .mkOpenings { display: flex; flex-direction: column; gap: 6px; }
    .mkOp { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 14px; background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.07); }
    .mkOp i { font-style: normal; } .mkOp span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .mkOp b { font-size: 12.5px; }
    .mkOp.bad { border-color: rgba(255,90,77,.45); } .mkOp.bad b { color: #ff8a80; } .mkOp.warn { border-color: rgba(255,179,71,.45); } .mkOp.warn b { color: #ffc46b; } .mkOp.ok b { color: #7ee2a8; }
    /* Idee 2 */
    .mkBig { position: relative; overflow: hidden; display: flex; align-items: center; gap: 12px; height: 76px; margin-top: 14px; padding: 0 18px; border-radius: 22px;
      background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); }
    .mkBig em, .mkFat em, .mkRow em { position: absolute; inset: 0 auto 0 0; width: var(--b); background: linear-gradient(90deg, rgba(235,140,40,.80), rgba(255,190,80,.92)); }
    .mkRow em { background: linear-gradient(90deg, rgba(255,170,60,.30), rgba(255,210,120,.42)); }
    .mkBig em::after, .mkFat em::after { content: ''; position: absolute; right: 8px; top: 50%; width: 5px; height: 44%; transform: translateY(-50%); border-radius: 3px; background: rgba(255,255,255,.85); }
    .mkBig > :not(em) { position: relative; } .mkBig i { font-style: normal; font-size: 26px; } .mkBig div { flex: 1; display: flex; flex-direction: column; }
    .mkBig b { font-size: 17px; } .mkBig small { color: rgba(255,255,255,.75); } .mkBig > span { font-size: 22px; font-weight: 750; font-variant-numeric: tabular-nums; }
    .mkBig, .mkFat { text-shadow: 0 1px 3px rgba(0,0,0,.45); } .mkBig.on small { color: rgba(255,255,255,.85); }
    .mkMini { display: flex; gap: 8px; margin-top: 8px; }
    .mkMini button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 8px 6px !important; border-radius: 14px !important; font-size: 13px; font-weight: 600;
      background: rgba(255,255,255,.06) !important; border: 1px solid rgba(255,255,255,.1) !important; }
    .mkMini i { width: 16px; height: 16px; border-radius: 50%; display: inline-block; }
    .mkDuo { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
    .mkBox { border-radius: 20px; background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.08); padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .mkBox .bt { width: 100%; display: flex; justify-content: space-between; align-items: center; font-weight: 650; font-size: 13px; }
    .mkBox .bt b { font-variant-numeric: tabular-nums; } .mkBox .badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.1); color: var(--muted); }
    .mkWin { position: relative; width: 92px; height: 120px; border-radius: 8px; overflow: hidden; border: 3px solid #c9d3dc; }
    .mkWin .sky { position: absolute; inset: 0; background: linear-gradient(180deg, #0b1a33, #23406b 70%, #3b5f8f); }
    .mkWin .sky::after { content: ''; position: absolute; right: 16px; bottom: 26px; width: 12px; height: 12px; border-radius: 50%; background: #f6f1d5; box-shadow: 0 0 12px #f6f1d5; }
    .mkWin .shut { position: absolute; left: 0; right: 0; top: 0; background: repeating-linear-gradient(180deg, #a9b4bf 0 6px, #7d8893 6px 7px); }
    .mkWin .shut i { position: absolute; left: 50%; bottom: -1px; width: 26px; height: 7px; transform: translateX(-50%); border-radius: 4px 4px 0 0; background: #fff; }
    .mkWin .cross { position: absolute; left: 50%; top: 0; bottom: 0; width: 3px; transform: translateX(-50%); background: #c9d3dc; }
    .mkDial { color: var(--text); margin: -4px 0 -10px; }
    .mkFat { position: relative; overflow: hidden; display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 14px; margin-bottom: 7px; border-radius: 16px;
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); }
    .mkFat > :not(em) { position: relative; } .mkFat i { font-style: normal; font-size: 18px; } .mkFat span { flex: 1; font-weight: 600; }
    .mkFat b { font-variant-numeric: tabular-nums; font-size: 13px; } .mkFat:not(.on) b { color: var(--muted); font-weight: 500; }
    .mkFat.on { border-color: rgba(255,195,100,.5); } .mkFat.on b { color: #fff; } .mkFat.on em::after { height: 50%; }
    .mkPlayer { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 16px; margin-bottom: 7px; background: linear-gradient(135deg, rgba(63,169,245,.20), rgba(140,90,255,.12)); border: 1px solid rgba(110,170,250,.35); }
    .mkPlayer i { font-style: normal; font-size: 20px; } .mkPlayer div:not(.pc) { flex: 1; display: flex; flex-direction: column; } .mkPlayer small { color: #9fd3ff; }
    .mkPlayer .pc { display: flex; gap: 4px; } .mkPlayer .pc button { width: 32px; height: 32px; border-radius: 50% !important; padding: 0 !important; border: 0 !important; background: rgba(255,255,255,.08) !important; font-size: 12px; }
    .mkPlayer .pc .pp { background: #fff !important; color: #111 !important; }
    /* Idee 3 */
    .mkTabs { display: flex; gap: 6px; margin: 14px -2px 0; overflow-x: auto; scrollbar-width: none; padding: 2px; }
    .mkTabs button { flex: 1 0 auto; min-width: 62px; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 8px 6px 7px !important; border-radius: 16px !important;
      background: rgba(255,255,255,.05) !important; border: 1px solid rgba(255,255,255,.08) !important; position: relative; }
    .mkTabs i { font-style: normal; font-size: 19px; } .mkTabs span { font-size: 12px; font-weight: 650; } .mkTabs small { font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
    .mkTabs button.on { background: var(--accent) !important; border-color: var(--accent) !important; color: var(--accent-text); box-shadow: 0 6px 18px rgba(63,169,245,.35); }
    .mkTabs button.on small { color: inherit; opacity: .8; }
    .mkTabs button.alarm::after { content: ''; position: absolute; top: 6px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: #ff5a4d; box-shadow: 0 0 0 2px rgba(18,24,32,1); }
    .mkTabBody { margin-top: 4px; } .mkPills { display: flex; gap: 6px; }
    #mkCard.phone .mkTabs button { padding: 6px 4px 5px !important; } #mkCard.phone .mkTabs i { font-size: 17px; }
    .mkSeg2 { display: flex; margin: 12px 0 10px; border-radius: 14px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); padding: 3px; gap: 3px; }
    .mkSeg2 button { flex: 1; border: 0 !important; background: none !important; border-radius: 11px !important; padding: 8px !important; font-weight: 650; font-size: 13.5px; }
    .mkSeg2:not(.three) button + button { border-left: 1px solid rgba(255,255,255,.1) !important; border-radius: 0 11px 11px 0 !important; }
    .mkSeg2.three button.on { background: var(--accent) !important; color: var(--accent-text); }
    .mkRow { position: relative; overflow: hidden; display: flex; align-items: center; gap: 10px; height: 54px; padding: 0 12px; margin-bottom: 7px; border-radius: 16px;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); }
    .mkRow em { background: linear-gradient(90deg, rgba(255,170,60,.30), rgba(255,210,120,.42)); border-right: 2px solid rgba(255,225,150,.9); }
    .mkRow:not(.on) em { display: none; } .mkRow > :not(em) { position: relative; } .mkRow i { font-style: normal; font-size: 18px; width: 24px; text-align: center; } .mkRow span { flex: 1; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mkRow small { font-variant-numeric: tabular-nums; color: var(--muted); font-weight: 600; } .mkRow.on small { color: #ffe1a6; }
    .mkSw { width: 46px; height: 28px; border-radius: 14px; background: rgba(255,255,255,.14); position: relative; flex: none; }
    .mkSw b { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.4); }
    .mkSw.on { background: #ffb347; } .mkSw.on b { left: 21px; }
    .mkMore { margin-top: 4px; border-radius: 14px; border: 1px dashed rgba(255,255,255,.18); }
    .mkMore summary { list-style: none; padding: 10px 12px; font-weight: 600; color: var(--muted); display: flex; justify-content: space-between; }
    .mkMore summary::after { content: '▸'; } .mkMore summary::-webkit-details-marker { display: none; }
    .mkClimate { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
    .mkClimate > div { border-radius: 18px; padding: 12px 14px; background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; gap: 4px; }
    .mkClimate small { color: var(--muted); font-size: 12px; } .mkClimate .now b { font-size: 34px; font-weight: 750; line-height: 1.05; font-variant-numeric: tabular-nums; }
    .mkClimate .set { background: linear-gradient(150deg, rgba(255,140,60,.22), rgba(255,90,54,.06)) !important; border-color: rgba(255,150,80,.4) !important; }
    .mkClimate .set .pm b { font-size: 22px; } .mkClimate .set .pm { justify-content: space-between; margin-top: 4px; }
    .mkPresets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .mkPresets button { padding: 8px 4px !important; border-radius: 12px !important; font-size: 12.5px; font-weight: 600; background: rgba(255,255,255,.05) !important; border: 1px solid rgba(255,255,255,.08) !important; }
    .mkPresets button.on { border-color: var(--accent) !important; background: rgba(63,169,245,.18) !important; }
    .mkVals { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .mkVals div { border-radius: 16px; padding: 10px 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; }
    .mkVals small { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .mkVals b { font-size: 19px; font-variant-numeric: tabular-nums; }
    .mkVals .warn { border-color: rgba(255,179,71,.45); } .mkVals .warn b { color: #ffc46b; }
    /* Idee 4 */
    .mkGrab { width: 44px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.28); margin: -6px auto 12px; }
    .mkQuick { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; }
    .mkQuick button { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 4px 10px !important; border-radius: 20px !important;
      background: rgba(255,255,255,.06) !important; border: 1px solid rgba(255,255,255,.1) !important; }
    .mkQuick i { font-style: normal; font-size: 22px; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.09); margin-bottom: 4px; }
    .mkQuick b { font-size: 13px; } .mkQuick small { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
    .mkQuick button.on { background: linear-gradient(160deg, rgba(255,200,110,.32), rgba(255,150,60,.08)) !important; border-color: rgba(255,195,100,.55) !important; }
    .mkQuick button.on i { background: #ffcf5c; box-shadow: 0 0 16px rgba(255,200,90,.7); } .mkQuick button.on small { color: #ffd896; }
    .mkHint { text-align: center; color: var(--muted); font-size: 12.5px; margin-top: 12px; }
    #mkCard.full { top: 8px; max-height: none; }
    /* Idee 5 */
    .mkPlanBox { margin-top: 12px; border-radius: 20px; background: radial-gradient(120% 100% at 50% 0%, rgba(63,169,245,.10), rgba(0,0,0,.18)); border: 1px solid rgba(255,255,255,.08); padding: 6px 6px 8px; }
    .mkPlan { display: block; } .mkPlanHint { text-align: center; font-size: 11.5px; color: var(--muted); }
    .mkStrip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .mkStrip div { border-radius: 14px; padding: 8px 10px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; }
    .mkStrip small { color: var(--muted); font-size: 11.5px; } .mkStrip b { font-size: 14px; }
    /* die Nummer des Entwurfs oben in der Karte (nur im Foto) */
    #mkCard .mkTag { position: absolute; top: 0; left: 50%; transform: translateX(-50%); }
  `);

  /** zeichnet den Entwurf n über die heutige Raumkarte. opt: { phone, full (Idee 4 hochgezogen), tab (Idee 3) } */
  window.mockRoom = (n, opt = {}) => {
    const D = scrape();
    let card = document.getElementById('mkCard');
    if (!card) { card = document.createElement('div'); card.id = 'mkCard'; $('#stage').append(card); }
    card.className = (opt.phone ? 'phone' : 'desk') + (opt.full ? ' full' : '');
    card.innerHTML = n === 1 ? idea1(D) : n === 2 ? idea2(D) : n === 3 ? idea3(D, opt.tab) : n === 4 ? (opt.full ? '<div class="mkGrab"></div>' + idea1(D) : idea4(D)) : idea5(D);
    $('#roomPanel').classList.add('mkGhost'); $('#heatPanel').classList.add('mkGhost');
    // die heutige Karte (unsichtbar) bekommt die Größe der neuen: am Handy schiebt die App das Bild dann über die Karte (sheetview.js)
    const rp = $('#roomPanel'), r = card.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
    if (opt.phone) Object.assign(rp.style, { top: `${r.top - s.top}px`, bottom: `${s.bottom - r.bottom}px`, maxHeight: 'none', height: 'auto' });
    window.dispatchEvent(new Event('resize'));
    return { h: card.scrollHeight, vis: card.clientHeight };
  };
})();
