/* Beispielbilder für docs/ideen-5.33 (2026-11-23, Wunsch des Besitzers: „eigene Bilderkarten designen für spezielle Alarme … hier oben soll
 * das Bild von dem Raum hin, hier die Informationen, hier die Uhrzeit … das ist die spezielle Benachrichtigung für Florian 1 … und in den
 * Abläufen sagen: löse Florian 1 aus“). Malt die Ideen nur fürs Foto in die echte Demo (make_pictures.py spielt diese Datei ein).
 * Nichts davon ist gebaut. I = die Bilder als data-URLs (Grundrisse von cardpics.py, Kamerabilder aus dem 3D-Haus der Demo). */
/* eslint-disable no-unused-vars */
const el = (tag, css, html) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; };
const FONT = "Inter, 'Segoe UI', Roboto, 'DejaVu Sans', sans-serif";
const SVG = {
  drop: '<path d="M12 2.5C9.2 7 5.5 10.4 5.5 14.6a6.5 6.5 0 0 0 13 0c0-4.2-3.7-7.6-6.5-12.1z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  cam: '<path d="M4 7h3l1.6-2h6.8L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4" fill="#0003"/>',
  door: '<path d="M6 3h12v18H6z" fill-opacity=".9"/><circle cx="15" cy="12.5" r="1.3" fill="#0006"/>',
  win: '<path d="M4 4h16v16H4zM11 4v16M4 11h16" fill="none" stroke="currentColor" stroke-width="2"/>',
  bulb: '<path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 19h6v2H9z"/>',
  lock: '<path d="M7 10V8a5 5 0 0 1 10 0v2h1v11H6V10zm2 0h6V8a3 3 0 0 0-6 0z"/>',
  temp: '<path d="M10 4a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0z"/>',
  person: '<circle cx="12" cy="7.5" r="4"/><path d="M4 21a8 8 0 0 1 16 0z"/>',
  clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M11 10h2v7h-2zM11 6.5h2v2h-2z" fill="#fff"/>',
  text: '<path d="M4 5h16v3h-6.5v12h-3V8H4z"/>',
  plan: '<path d="M3 4h18v16H3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h9V4M12 12v8M15 12h6" fill="none" stroke="currentColor" stroke-width="2"/>',
  chart: '<path d="M4 20V10h3v10zm6.5 0V4h3v16zM17 20v-7h3v7z"/>',
  line: '<path d="M3 11h18v2H3z"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" stroke="currentColor" stroke-width="2"/>',
};
const ico = (k, size = 20, color = 'currentColor') => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" style="color:${color};flex:none;display:block">${SVG[k]}</svg>`;

/* ================= die drei Beispielkarten (so kommen sie als ein Bild im Handy an) ================= */
function rowsHtml(rows, dark) {
  return rows.map(([k, label, value, col]) => `<div style="display:flex;align-items:center;gap:9px;padding:5px 0;${dark ? 'border-bottom:1px solid #ffffff14' : 'border-bottom:1px solid #e9ecf1'}">
    <span style="width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:${col || (dark ? '#2a3346' : '#eef1f6')};color:${col ? '#fff' : (dark ? '#c5cfdf' : '#4a5568')}">${ico(k, 16)}</span>
    <span style="font-size:13px;color:${dark ? '#94a1b6' : '#6b7486'};min-width:74px">${label}</span><b style="font-size:14px;margin-left:auto;text-align:right">${value}</b></div>`).join('');
}
function mockCard(kind, I) {
  const c = el('div', `width:480px;border-radius:18px;overflow:hidden;font-family:${FONT};box-shadow:0 2px 0 #0000`);
  c.className = 'fpCardMock';
  if (kind === 'wasser') {
    c.style.background = '#fff'; c.style.color = '#1b2230';
    c.innerHTML = `
      <div style="background:#d63c31;color:#fff;padding:14px 18px;display:flex;align-items:center;gap:12px">
        <span style="width:46px;height:46px;border-radius:50%;background:#ffffff2e;display:grid;place-items:center">${ico('drop', 28, '#fff')}</span>
        <div><div style="font-size:27px;font-weight:800;letter-spacing:.05em;line-height:1.05">WASSER</div><div style="font-size:15px;opacity:.93">Waschküche · Keller</div></div>
        <div style="margin-left:auto;text-align:right"><div style="font-size:30px;font-weight:800;line-height:1">07:41</div><div style="font-size:12.5px;opacity:.92">Mo, 23. Nov.</div></div>
      </div>
      <img src="${I.plan_wash}" style="width:100%;display:block">
      <div style="display:grid;grid-template-columns:205px 1fr;gap:14px;padding:12px 16px 10px">
        <div style="position:relative"><img src="${I.cam_wash}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block">
          <span style="position:absolute;left:6px;top:6px;background:#000a;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px">● KAMERA WASCHKÜCHE</span></div>
        <div>${rowsHtml([['drop', 'Melder', 'Waschmaschine'], ['clock', 'Seit', '07:41 Uhr'], ['temp', 'Raum', '17,5 °C'], ['info', 'Feuchte', '81 %']])}</div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:7px 16px 9px;font-size:11.5px;color:#8a93a4;border-top:1px solid #e9ecf1"><span>Demo-Haus</span><span>Karte „Wasser-Alarm“ · 3D Floorplan</span></div>`;
  } else if (kind === 'florian') {
    c.style.background = '#141a25'; c.style.color = '#eef2f8';
    c.innerHTML = `
      <div style="position:relative"><img src="${I.cam_door}" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;filter:saturate(.75) contrast(1.05)">
        <span style="position:absolute;left:10px;top:10px;background:#000b;color:#fff;font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:6px"><span style="color:#ff4d40">●</span> KAMERA HAUSTÜR</span>
        <span style="position:absolute;right:10px;bottom:9px;background:#000b;color:#fff;font:600 11.5px ui-monospace,monospace;padding:3px 7px;border-radius:6px">23.11.2026 21:47:12</span></div>
      <div style="padding:14px 18px 6px;display:flex;align-items:flex-end;gap:12px">
        <div style="font-size:64px;font-weight:800;line-height:.9;letter-spacing:-.02em">21:47</div>
        <div style="padding-bottom:4px"><div style="display:inline-block;background:#d63c31;color:#fff;font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;letter-spacing:.04em">ALARM SCHARF</div>
          <div style="font-size:14px;color:#9aa6bb;margin-top:4px">Montag, 23. November</div></div>
      </div>
      <div style="padding:2px 18px 0;font-size:23px;font-weight:800">Bewegung an der Haustür</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;padding:10px 18px 12px">
        ${[['person', 'Niemand zu Hause'], ['temp', 'Außen 4 °C'], ['bulb', 'Licht Eingang an']].map(([k, w]) => `<span style="display:flex;align-items:center;gap:6px;background:#232c3c;border-radius:999px;padding:5px 11px 5px 8px;font-size:13px;font-weight:600">${ico(k, 15, '#b9c5d8')}${w}</span>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:200px 1fr;gap:14px;padding:0 18px 14px;align-items:center">
        <img src="${I.plan_door}" style="width:100%;border-radius:10px;display:block">
        <div>${rowsHtml([['door', 'Haustür', 'zu'], ['lock', 'Schloss', 'offen', '#d6893a'], ['win', 'Fenster', 'alle zu']], true)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:7px 18px 9px;font-size:11.5px;color:#7d889c;border-top:1px solid #ffffff14"><span>Demo-Haus</span><span>Karte „Florian 1“ · 3D Floorplan</span></div>`;
  } else {
    c.style.background = '#101726'; c.style.color = '#eef2f8';
    c.innerHTML = `
      <div style="background:linear-gradient(120deg,#20325c,#2d2357);padding:14px 18px;display:flex;align-items:center;gap:12px">
        <span style="width:44px;height:44px;border-radius:50%;background:#ffffff1f;display:grid;place-items:center">${ico('moon', 26, '#ffd86b')}</span>
        <div><div style="font-size:23px;font-weight:800;line-height:1.1">Gute-Nacht-Check</div><div style="font-size:14px;opacity:.85">Erdgeschoss · 3 Dinge noch offen</div></div>
        <div style="margin-left:auto;font-size:30px;font-weight:800">22:30</div>
      </div>
      <img src="${I.plan_eg}" style="width:100%;display:block">
      <div style="padding:8px 18px 12px">${rowsHtml([['win', 'Fenster', 'Küche, Bad offen', '#d63c31'], ['bulb', 'Licht', 'Stehlampe an', '#d9a000'], ['lock', 'Haustür', 'zu, abgeschlossen', '#2e9b5f'], ['temp', 'Heizung', 'Ø 19,5 °C', '#3a7bd5']], true)}</div>
      <div style="display:flex;justify-content:space-between;padding:7px 18px 9px;font-size:11.5px;color:#7d889c;border-top:1px solid #ffffff14"><span>Demo-Haus</span><span>Karte „Gute Nacht“ · 3D Floorplan</span></div>`;
  }
  return c;
}

/* ================= Hilfen für die Fenster ================= */
const BTN = 'display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:9px;border:1px solid var(--line);background:var(--field);color:var(--text);font-size:13.5px;font-weight:600;white-space:nowrap';
const PRIMARY = BTN + ';background:var(--accent);border-color:var(--accent);color:var(--accent-text)';
const button = (text, primary, extra = '') => el('span', (primary ? PRIMARY : BTN) + ';' + extra, text);
function overlay(w, h, title, sub) {
  document.querySelectorAll('.mockOv').forEach((x) => x.remove());
  const ov = el('div', 'position:fixed;inset:0;background:#0009;z-index:99990;display:grid;place-items:center');
  ov.className = 'mockOv';
  const dlg = el('div', `width:${w}px;height:${h}px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 60px #000a;display:flex;flex-direction:column;overflow:hidden;color:var(--text);font-family:${FONT}`);
  const head = el('div', 'display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line)');
  head.append(el('div', 'font-size:18px;font-weight:800', title));
  if (sub) head.append(el('div', 'font-size:13px;color:var(--muted)', sub));
  head.append(el('div', 'margin-left:auto;display:flex;gap:8px', ''), el('span', 'font-size:20px;color:var(--muted);margin-left:8px', '✕'));
  const body = el('div', 'flex:1;min-height:0;display:flex;overflow:hidden');
  dlg.append(head, body); ov.append(dlg); document.body.append(ov);
  return { dlg, head, body, tools: head.children[head.children.length - 2] };
}
const SECT = 'font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:12px 0 6px';
const blockIcon = (k, col) => `<span style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${col}22;color:${col}">${ico(k, 18, col)}</span>`;
const BLOCKS = [['text', 'Überschrift', '#e0583a'], ['plan', 'Raumbild (Grundriss)', '#3fa9f5'], ['cam', 'Kamerabild', '#9b6cf0'], ['clock', 'Uhrzeit & Datum', '#f2b416'],
  ['info', 'Infos (Raum, Melder, seit …)', '#47c27a'], ['temp', 'Werte aus Home Assistant', '#e86fb0'], ['chart', 'Verlauf (24 h)', '#41c7c7'], ['person', 'Wer ist zu Hause', '#8fa3bf'],
  ['sun', 'Wetter', '#f2b416'], ['line', 'Trennlinie', '#8b98a5']];
function preview(card, label, scale = 0.78) {
  const box = el('div', 'display:flex;flex-direction:column;align-items:center;gap:8px');
  box.append(el('div', SECT + ';margin:0', label));
  const frame = el('div', `width:${480 * scale}px;height:${card.__h * scale}px;position:relative`);
  card.style.transform = `scale(${scale})`; card.style.transformOrigin = '0 0'; card.style.position = 'absolute'; card.style.left = '0'; card.style.top = '0';
  card.style.boxShadow = '0 8px 30px #0008';
  frame.append(card); box.append(frame);
  return box;
}
async function measured(kind, I) {
  const c = mockCard(kind, I);
  c.style.position = 'fixed'; c.style.left = '-2000px'; document.body.append(c);
  await Promise.all([...c.querySelectorAll('img')].map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; }))));
  c.__h = c.getBoundingClientRect().height; c.remove(); c.style.position = ''; c.style.left = '';
  return c;
}

/* ================= Bild 1: wo die Karten wohnen (▶ Abläufe → neuer Abschnitt „🖼 Bildkarten fürs Handy“) ================= */
async function mockPlace(I) {
  document.querySelector('[data-tab=routines]')?.click();
  await new Promise((r) => setTimeout(r, 700));
  const grid = document.querySelector('.tabPage:not([hidden]) .rtGrid') || document.querySelector('.rtGrid');
  const card = [...grid.children].find((c) => /Knöpfe nach Räumen/i.test(c.textContent)) || grid.querySelector('.roOwn');
  card.replaceChildren();
  const h = el('h3', '', `🖼 Bildkarten fürs Handy <span style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--muted);margin-left:8px">eigene Bilder für Telegram · bei Alarm und in Abläufen</span>`); h.className = 'peH roHead';
  const row = el('div', 'display:flex;gap:16px;align-items:flex-start;overflow:hidden;padding:6px 2px 4px');
  const items = [['wasser', 'Wasser-Alarm', 'bei Wasser · 💧'], ['florian', 'Florian 1', 'in 2 Abläufen'], ['abend', 'Gute Nacht', 'Ablauf „Gute Nacht“']];
  for (const [k, name, use] of items) {
    const c = await measured(k, I);
    const t = el('div', 'display:flex;flex-direction:column;gap:6px;width:200px');
    const f = el('div', `width:200px;height:${c.__h * 200 / 480}px;position:relative;border-radius:10px;overflow:hidden;box-shadow:0 4px 14px #0007;border:1px solid var(--line)`);
    c.style.transform = `scale(${200 / 480})`; c.style.transformOrigin = '0 0'; c.style.position = 'absolute'; f.append(c);
    t.append(f, el('div', 'font-weight:800;font-size:15px', name), el('div', 'font-size:12.5px;color:var(--muted)', use));
    row.append(t);
  }
  const add = el('div', 'width:200px;height:200px;border:2px dashed var(--accent);border-radius:12px;display:grid;place-items:center;text-align:center;color:var(--accent);font-weight:800;font-size:16px', '＋ Neue Bildkarte<br><span style="font-weight:500;font-size:12.5px;color:var(--muted)">leer oder aus einer Vorlage</span>');
  row.append(add);
  card.append(h, row);
  window.scrollTo(0, 0);
  return 'ok';
}

/* ================= Idee 1: Bausteine untereinander (Bild 2 am Computer, Bild 3 am Handy) ================= */
function stackRow(k, name, sub, col, on = false) {
  const r = el('div', `display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid ${on ? 'var(--accent)' : 'var(--line)'};border-radius:10px;background:${on ? 'color-mix(in srgb, var(--accent) 12%, var(--field))' : 'var(--field)'};margin-bottom:6px`);
  r.innerHTML = `<span style="color:var(--muted);font-size:18px;cursor:grab">⠿</span>${blockIcon(k, col)}<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px">${name}</div><div style="font-size:12px;color:var(--muted)">${sub}</div></div>
    <span style="color:var(--muted);font-size:13px;letter-spacing:2px">▲ ▼</span><span style="color:var(--muted);font-size:15px">🗑</span>`;
  return r;
}
async function mockStack(I) {
  const { body, tools } = overlay(1260, 820, '🖼 Bildkarte: Wasser-Alarm', 'Idee 1 · Bausteine untereinander');
  tools.append(button('📨 Test an mich', false), button('✓ Speichern', true));
  const left = el('div', 'width:300px;padding:12px 16px;border-right:1px solid var(--line);overflow:hidden');
  left.innerHTML = `<div style="${SECT};margin-top:2px">Name</div><div style="${BTN};display:block;font-weight:700">Wasser-Alarm</div>
    <div style="${SECT}">Farbe</div><div style="display:flex;gap:8px">${['#d63c31', '#e8812f', '#2e9b5f', '#3a7bd5', '#2d2357', '#ffffff'].map((c, i) => `<span style="width:30px;height:30px;border-radius:50%;background:${c};border:${i === 0 ? '3px solid var(--text)' : '1px solid var(--line)'}"></span>`).join('')}</div>
    <div style="${SECT}">Hell oder dunkel</div><div style="display:flex;gap:6px">${button('☀ Hell', true).outerHTML}${button('🌙 Dunkel', false).outerHTML}</div>
    <div style="${SECT}">Form</div><div style="display:flex;gap:6px">${button('▯ Hoch', true).outerHTML}${button('▭ Quer', false).outerHTML}${button('□ Quadrat', false).outerHTML}</div>
    <div style="${SECT}">Benutzt in</div><div style="font-size:13px;line-height:1.6">🚨 Alarm: Wasser<br>▶ Ablauf „Waschmaschine läuft aus“</div>`;
  const mid = el('div', 'flex:1;padding:12px 16px;overflow:hidden');
  mid.innerHTML = `<div style="${SECT};margin-top:2px">Bausteine – von oben nach unten (ziehen oder ▲▼)</div>`;
  mid.append(stackRow('text', 'Überschrift', '„WASSER“ · groß · mit Uhrzeit rechts', '#e0583a'),
    stackRow('plan', 'Raumbild (Grundriss)', 'die Etage, der Raum rot, Ring am Melder', '#3fa9f5', true));
  const opts = el('div', 'margin:-2px 0 8px 46px;padding:8px 10px;border-left:3px solid var(--accent);font-size:12.5px;display:flex;flex-wrap:wrap;gap:6px;align-items:center');
  opts.innerHTML = `<span style="color:var(--muted)">Zeigt</span>${button('ganze Etage', true).outerHTML}${button('nur den Raum', false).outerHTML}<span style="color:var(--muted);margin-left:8px">Größe</span>${button('groß ▾', false).outerHTML}`;
  mid.append(opts,
    el('div', 'display:flex;gap:8px'),
    stackRow('cam', 'Kamerabild', 'die Kamera im Raum · links, halbe Breite', '#9b6cf0'),
    stackRow('info', 'Infos', 'Melder · seit · Temperatur · Feuchte des Raums', '#47c27a'),
    stackRow('line', 'Fußzeile', 'Haus · Name der Karte', '#8b98a5'));
  mid.children[4].remove();
  const add = el('div', 'margin-top:10px');
  add.innerHTML = `<div style="${SECT}">＋ Baustein dazu</div>`;
  const chips = el('div', 'display:flex;flex-wrap:wrap;gap:6px');
  BLOCKS.forEach(([k, n, col]) => { const ch = el('span', BTN + ';padding:5px 10px 5px 6px;font-weight:600'); ch.innerHTML = `${ico(k, 16, col)}${n}`; chips.append(ch); });
  add.append(chips); mid.append(add);
  mid.append(el('div', 'margin-top:12px;font-size:12.5px;color:var(--muted);line-height:1.5', 'Neben zwei Bausteinen ziehen = nebeneinander (wie Kamerabild und Infos). Platzhalter in Texten: {raum}, {melder}, {zeit}, {etage}, {wert:sensor.…}'));
  const right = el('div', 'width:440px;padding:12px 16px;border-left:1px solid var(--line);background:color-mix(in srgb, var(--bg) 60%, var(--panel));display:flex;justify-content:center;overflow:hidden');
  right.append(preview(await measured('wasser', I), 'So kommt sie an (mit dem Wasser im Keller)', 0.84));
  body.append(left, mid, right);
  return 'ok';
}
async function mockStackPhone(I) {
  document.querySelectorAll('.mockOv').forEach((x) => x.remove());
  const ov = el('div', `position:fixed;inset:0;background:var(--panel);z-index:99990;color:var(--text);font-family:${FONT};display:flex;flex-direction:column`);
  ov.className = 'mockOv';
  const head = el('div', 'display:flex;align-items:center;gap:8px;padding:12px 12px;border-bottom:1px solid var(--line)');
  head.innerHTML = `<span style="font-size:20px">‹</span><b style="font-size:17px">Wasser-Alarm</b><span style="margin-left:auto"></span>`;
  head.append(button('✓ Speichern', true));
  const tabs = el('div', 'display:flex;gap:6px;padding:8px 12px');
  tabs.append(button('👁 Vorschau', true, 'flex:1;justify-content:center'), button('⠿ Bausteine', false, 'flex:1;justify-content:center'), button('🎨 Farbe', false, 'flex:1;justify-content:center'));
  const pv = el('div', 'display:flex;justify-content:center;padding:4px 0 8px;border-bottom:1px solid var(--line);background:color-mix(in srgb, var(--bg) 60%, var(--panel))');
  const c = await measured('wasser', I); pv.append(preview(c, 'So kommt sie an', 0.62).children[1]);
  const list = el('div', 'padding:8px 12px;overflow:hidden;flex:1');
  list.innerHTML = `<div style="${SECT};margin-top:2px">Bausteine (ziehen am ⠿)</div>`;
  list.append(stackRow('text', 'Überschrift', 'WASSER · Uhrzeit rechts', '#e0583a'), stackRow('plan', 'Raumbild', 'Etage, Raum rot', '#3fa9f5', true),
    stackRow('cam', 'Kamerabild', 'links, halbe Breite', '#9b6cf0'), stackRow('info', 'Infos', 'Melder, seit, °C, %', '#47c27a'));
  list.append(button('＋ Baustein', false, 'width:100%;justify-content:center;border-style:dashed'));
  ov.append(head, tabs, pv, list); document.body.append(ov);
  return 'ok';
}

/* ================= Idee 2: freie Fläche (ziehen und größer machen wie in einem Malprogramm) ================= */
async function mockFree(I) {
  const { body, tools } = overlay(1260, 820, '🖼 Bildkarte: Florian 1', 'Idee 2 · Freie Fläche');
  tools.append(button('↶', false), button('📨 Test an mich', false), button('✓ Speichern', true));
  const left = el('div', 'width:230px;padding:12px 14px;border-right:1px solid var(--line);overflow:hidden');
  left.innerHTML = `<div style="${SECT};margin-top:2px">Bausteine – auf die Karte ziehen</div>`;
  BLOCKS.forEach(([k, n, col]) => {
    const r = el('div', 'display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--line);border-radius:9px;background:var(--field);margin-bottom:5px;font-size:13px;font-weight:600');
    r.innerHTML = `${blockIcon(k, col)}${n}`; left.append(r);
  });
  const mid = el('div', 'flex:1;display:grid;place-items:center;background-color:color-mix(in srgb, var(--bg) 70%, var(--panel));background-image:radial-gradient(var(--line) 1px, transparent 1px);background-size:16px 16px;position:relative;overflow:hidden');
  const c = await measured('florian', I);
  const scale = 1.02, frame = el('div', `width:${480 * scale}px;height:${c.__h * scale}px;position:relative;outline:1px dashed var(--muted);outline-offset:6px`);
  c.style.transform = `scale(${scale})`; c.style.transformOrigin = '0 0'; c.style.position = 'absolute'; c.style.boxShadow = '0 8px 30px #0008';
  frame.append(c);
  // the grid of the card and the chosen block (the time) with its handles
  const g = el('div', `position:absolute;inset:0;background-image:linear-gradient(#3fa9f522 1px, transparent 1px),linear-gradient(90deg,#3fa9f522 1px, transparent 1px);background-size:${480 * scale / 12}px ${480 * scale / 12}px;pointer-events:none`);
  frame.append(g);
  const sel = (x, y, w, h, label, main, right) => {
    const s = el('div', `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border:2px ${main ? 'solid' : 'dashed'} ${main ? '#3fa9f5' : '#3fa9f599'};border-radius:6px`);
    if (main) {
      [[-6, -6], [w - 6, -6], [-6, h - 6], [w - 6, h - 6], [w / 2 - 6, -6], [w / 2 - 6, h - 6], [-6, h / 2 - 6], [w - 6, h / 2 - 6]].forEach(([a, b]) => s.append(el('span', `position:absolute;left:${a - 2}px;top:${b - 2}px;width:12px;height:12px;background:#fff;border:2px solid #3fa9f5;border-radius:3px`)));
    }
    s.append(el('span', `position:absolute;${right ? 'right:-2px' : 'left:-2px'};top:-24px;background:${main ? '#3fa9f5' : '#3fa9f5aa'};color:#fff;font-size:11.5px;font-weight:700;padding:2px 7px;border-radius:5px;white-space:nowrap`, label));
    frame.append(s);
  };
  const k = scale;
  sel(0, 0, 480 * k, 270 * k, 'Kamerabild · Haustür', false);
  sel(14 * k, 282 * k, 160 * k, 66 * k, 'Uhrzeit', true);
  sel(14 * k, 352 * k, 452 * k, 34 * k, 'Überschrift', false, true);
  mid.append(frame);
  mid.append(el('div', 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:12.5px;color:var(--muted);background:var(--panel);padding:5px 12px;border-radius:999px;border:1px solid var(--line)', 'Ziehen = verschieben · Ecken ziehen = größer · rastet im Raster ein'));
  const right = el('div', 'width:290px;padding:12px 16px;border-left:1px solid var(--line);overflow:hidden;font-size:13px');
  right.innerHTML = `<div style="${SECT};margin-top:2px">Gewählt: Uhrzeit</div>
    <div style="${SECT}">Zeigt</div><div style="display:flex;flex-wrap:wrap;gap:6px">${button('21:47', true).outerHTML}${button('21:47:12', false).outerHTML}${button('Mo 21:47', false).outerHTML}</div>
    <div style="${SECT}">Schriftgröße</div><div style="display:flex;align-items:center;gap:8px"><span style="flex:1;height:6px;border-radius:3px;background:linear-gradient(90deg,var(--accent) 78%,var(--line) 78%)"></span><b>64</b></div>
    <div style="${SECT}">Farbe</div><div style="display:flex;gap:7px">${['#eef2f8', '#ffd86b', '#ff4d40', '#47c27a', '#3fa9f5'].map((c2, i) => `<span style="width:26px;height:26px;border-radius:50%;background:${c2};border:${i === 0 ? '3px solid var(--accent)' : '1px solid var(--line)'}"></span>`).join('')}</div>
    <div style="${SECT}">Ausrichtung</div><div style="display:flex;gap:6px">${button('⟸', true).outerHTML}${button('⟺', false).outerHTML}${button('⟹', false).outerHTML}</div>
    <div style="${SECT}">Ebene</div><div style="display:flex;gap:6px">${button('nach vorn', false).outerHTML}${button('nach hinten', false).outerHTML}</div>
    <div style="${SECT}">Ort auf der Karte</div><div style="color:var(--muted);line-height:1.5">links 1 · oben 12 · Breite 4 · Höhe 3<br>(in Kästchen des Rasters)</div>
    <div style="margin-top:14px">${button('🗑 Baustein löschen', false).outerHTML}</div>`;
  body.append(left, mid, right);
  return 'ok';
}

/* ================= Idee 3: eine Vorlage wählen, dann nur noch die Felder füllen ================= */
function wire(kind) {
  const W = 'background:#ffffff1c;border-radius:4px';
  const box = (css, t) => `<div style="${W};${css};display:grid;place-items:center;font-size:10px;font-weight:700;color:#cfd8e6">${t || ''}</div>`;
  const layouts = {
    a: `${box('height:14px;background:#d63c31cc', 'Titel · Zeit')}${box('height:58px;margin-top:4px', 'Raumbild')}<div style="display:flex;gap:4px;margin-top:4px">${box('flex:1;height:34px', 'Kamera')}${box('flex:1;height:34px', 'Infos')}</div>`,
    b: `${box('height:62px', 'Kamera groß')}${box('height:22px;margin-top:4px', 'Uhrzeit groß')}${box('height:12px;margin-top:4px', 'Titel')}<div style="display:flex;gap:4px;margin-top:4px">${box('flex:1;height:18px', 'Plan')}${box('flex:1;height:18px', 'Infos')}</div>`,
    c: `${box('height:14px;background:#3a5fb0cc', 'Titel · Zeit')}${box('height:56px;margin-top:4px', 'Grundriss Etage')}${box('height:40px;margin-top:4px', 'Liste')}`,
    d: `<div style="display:flex;gap:4px">${box('flex:1;height:52px', 'Raumbild')}${box('flex:1;height:52px', 'Kamera')}</div>${box('height:14px;margin-top:4px;background:#e8812fcc', 'Titel')}${box('height:44px;margin-top:4px', 'Infos')}`,
    e: `${box('height:44px', 'Uhrzeit riesig')}${box('height:16px;margin-top:4px', 'Titel')}${box('height:54px;margin-top:4px', 'Text')}`,
    f: `${box('height:14px;background:#2e9b5fcc', 'Titel')}<div style="display:flex;gap:4px;margin-top:4px">${box('flex:1;height:36px', 'Wert')}${box('flex:1;height:36px', 'Wert')}</div>${box('height:58px;margin-top:4px', 'Verlauf 24 h')}`,
  };
  return `<div style="width:100%;box-sizing:border-box;padding:7px;background:#141a25;border-radius:8px">${layouts[kind]}</div>`;
}
async function mockTemplates(I) {
  const { body, tools } = overlay(1260, 820, '🖼 Neue Bildkarte', 'Idee 3 · Vorlage wählen');
  tools.append(button('📨 Test an mich', false), button('✓ Speichern', true));
  const left = el('div', 'flex:1;padding:12px 18px;overflow:hidden');
  left.innerHTML = `<div style="${SECT};margin-top:2px">① Vorlage wählen</div>`;
  const grid = el('div', 'display:grid;grid-template-columns:repeat(6, minmax(0, 1fr));gap:8px');
  [['a', 'Alarm mit Raum', true], ['b', 'Kamera groß'], ['c', 'Etage mit Liste'], ['d', 'Zwei Bilder'], ['e', 'Uhr groß'], ['f', 'Werte & Verlauf']].forEach(([k, n, on]) => {
    const t = el('div', `min-width:0;padding:6px;border-radius:12px;border:2px solid ${on ? 'var(--accent)' : 'var(--line)'};background:var(--field);display:flex;flex-direction:column;align-items:center;gap:6px`);
    t.innerHTML = `${wire(k)}<div style="font-size:12.5px;font-weight:700;text-align:center">${on ? '✓ ' : ''}${n}</div>`;
    grid.append(t);
  });
  left.append(grid);
  const slots = el('div', '');
  slots.innerHTML = `<div style="${SECT};margin-top:16px">② Was in die Felder kommt</div>`;
  const slot = (n, label, value, help) => `<div style="display:grid;grid-template-columns:28px 120px 1fr;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)">
    <span style="width:24px;height:24px;border-radius:50%;background:var(--accent);color:var(--accent-text);display:grid;place-items:center;font-weight:800;font-size:13px">${n}</span>
    <span style="font-size:13px;color:var(--muted)">${label}</span><span style="${BTN};justify-content:space-between">${value}<span style="color:var(--muted)">▾ ${help || ''}</span></span></div>`;
  slots.innerHTML += slot(1, 'Titel', 'WASSER (die Art des Alarms)') + slot(2, 'Zeit rechts', '07:41 · mit Datum') + slot(3, 'Raumbild', 'Grundriss der Etage, Raum rot')
    + slot(4, 'Kamera', 'Kamera im Raum (von selbst)') + slot(5, 'Infos', 'Melder · seit · °C · Feuchte');
  left.append(slots);
  const col = el('div', '');
  col.innerHTML = `<div style="${SECT};margin-top:14px">③ Farbe</div><div style="display:flex;gap:8px;align-items:center">${['#d63c31', '#e8812f', '#2e9b5f', '#3a7bd5', '#2d2357'].map((c, i) => `<span style="width:30px;height:30px;border-radius:50%;background:${c};border:${i === 0 ? '3px solid var(--text)' : '1px solid var(--line)'}"></span>`).join('')}<span style="margin-left:14px">${button('☀ Hell', true).outerHTML} ${button('🌙 Dunkel', false).outerHTML}</span></div>`;
  left.append(col);
  const right = el('div', 'width:440px;padding:12px 16px;border-left:1px solid var(--line);background:color-mix(in srgb, var(--bg) 60%, var(--panel));display:flex;justify-content:center;overflow:hidden');
  const c = await measured('wasser', I);
  const pv = preview(c, 'Vorschau', 0.84);
  // the numbers of the fields on the preview
  const f = pv.children[1];
  [[1, 2, 2], [2, 336, 16], [3, 8, 100], [4, 6, 348], [5, 224, 348]].forEach(([n, x, y]) => f.append(el('span', `position:absolute;left:${x * 0.84}px;top:${y * 0.84}px;width:26px;height:26px;border-radius:50%;background:var(--accent);color:var(--accent-text);display:grid;place-items:center;font-weight:800;font-size:14px;box-shadow:0 2px 8px #0008;z-index:2`, String(n))));
  right.append(pv);
  body.append(left, right);
  return 'ok';
}

/* ================= Bild 9: im Ablauf „Florian 1“ schicken ================= */
async function mockFlow(I) {
  document.querySelector('[data-tab=routines]')?.click();
  await new Promise((r) => setTimeout(r, 600));
  document.querySelector('[data-act=tplFlow]')?.click();
  await new Promise((r) => setTimeout(r, 300));
  document.querySelector('[data-tpl=door]')?.click();
  await new Promise((r) => setTimeout(r, 900));
  const name = [...document.querySelectorAll('input')].find((i) => /Haustür lange offen/.test(i.value));
  if (name) name.value = 'Haustür nachts → Florian 1';
  const blk = [...document.querySelectorAll('*')].filter((e) => e.children.length < 4 && /^🔔?\s*Nachricht/.test(e.textContent.trim()) && e.offsetParent);
  blk.at(-1)?.click();
  await new Promise((r) => setTimeout(r, 500));
  const ta = document.querySelector('textarea.feText');
  const side = ta?.closest('div[class]')?.parentElement;
  if (!ta) return 'no textarea';
  ta.value = 'Bewegung an der Haustür ({room})';
  const box = el('div', 'margin:10px 0 6px;padding:10px;border:1px solid var(--accent);border-radius:10px;background:color-mix(in srgb, var(--accent) 10%, var(--panel))');
  box.innerHTML = `<div style="font-weight:800;font-size:14px;margin-bottom:6px">🖼 Als Bildkarte schicken</div>
    <div style="${BTN};justify-content:space-between;display:flex">Florian 1 <span style="color:var(--muted)">▾</span></div>
    <div style="font-size:12px;color:var(--muted);margin:6px 0 8px">Der Text oben steht unter dem Bild. „Raum“ der Karte = der Raum des Geräts, das ausgelöst hat.</div>`;
  const c = await measured('florian', I);
  const pw = Math.min(250, (side?.clientWidth || 300) - 48);
  const f = el('div', `width:${pw}px;height:${c.__h * pw / 480}px;position:relative;border-radius:10px;overflow:hidden;margin:0 auto`);
  c.style.transform = `scale(${pw / 480})`; c.style.transformOrigin = '0 0'; c.style.position = 'absolute'; f.append(c); box.append(f);
  const fieldRow = ta.closest('.feField, label, div');
  (fieldRow?.parentElement || side).insertBefore(box, fieldRow?.nextSibling || null);
  document.querySelectorAll('.feMissing').forEach((m) => { m.style.display = 'none'; });
  // the block on the board says it too
  [...document.querySelectorAll('*')].filter((s) => s.children.length === 0 && /^„?Die Haustür ist seit/.test(s.textContent.trim())).forEach((s) => { s.textContent = '🖼 Florian 1 · „Bewegung an der Haustür …“'; });
  [...document.querySelectorAll('*')].filter((s) => s.children.length === 0 && /Nachricht \(„Die Haustür ist seit 5 Minuten offen/.test(s.textContent)).forEach((s) => {
    s.textContent = s.textContent.replace(/Nachricht \(„Die Haustür ist seit 5 Minuten offen \(\{name\}\)“\)/, 'Bildkarte „Florian 1“ mit „Bewegung an der Haustür ({room})“'); });
  return 'ok';
}

/* ================= Bild 10: welche Karte bei welchem Alarm (⚙ → Warnungen & Alarm → Nachricht aufs Handy) ================= */
async function mockAlarm(I) {
  const box = document.querySelector('#alarmNotify');
  if (!box) return 'no box';
  const via = box.querySelector('#anVia'); via.value = 'tgbot'; via.dispatchEvent(new Event('change'));
  box.querySelector('#anOn').checked = true;
  const kinds = box.querySelector('.anKinds'); kinds.style.display = 'none';
  kinds.previousElementSibling.style.display = 'none';
  const t = el('div', 'margin:6px 0 12px;border:1px solid var(--line);border-radius:10px;overflow:hidden');
  const rows = [['🚨', 'Alarmanlage löst aus', 'Florian 1', true], ['🔥', 'Rauchmelder', 'Feuer (rot, Etage)', true], ['⚠️', 'Gasmelder', 'Standard (Grundriss)', true],
    ['☠️', 'Kohlenmonoxid', 'Standard (Grundriss)', true], ['💧', 'Wassermelder', 'Wasser-Alarm', true], ['✅', 'Wieder normal', 'nur Text', false]];
  t.innerHTML = `<div style="display:grid;grid-template-columns:34px 1fr 1.2fr;gap:8px;padding:7px 10px;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:var(--field)"><span></span><span>Melden, wenn …</span><span>🖼 Bildkarte</span></div>`
    + rows.map(([i, n, card, on]) => `<div style="display:grid;grid-template-columns:34px 1fr 1.2fr;gap:8px;align-items:center;padding:7px 10px;border-top:1px solid var(--line)">
      <span style="font-size:18px">${i}</span><span style="display:flex;align-items:center;gap:8px"><span style="width:34px;height:20px;border-radius:999px;background:${on ? 'var(--accent)' : 'var(--line)'};position:relative"><span style="position:absolute;top:2px;${on ? 'right:2px' : 'left:2px'};width:16px;height:16px;border-radius:50%;background:#fff"></span></span>${n}</span>
      <span style="${BTN};display:flex;justify-content:space-between">${card}<span style="color:var(--muted)">▾</span></span></div>`).join('');
  kinds.after(t);
  const note = el('div', 'font-size:12.5px;color:var(--muted);margin:-4px 0 10px', '„Standard“ = wie heute (Grundriss mit dem Raum in Rot und das Kamerabild). Eigene Karten machst du unter ▶ Abläufe → 🖼 Bildkarten.');
  t.after(note);
  const steps = box.querySelector('.anBot .anStepsBox'); if (steps) steps.style.display = 'none';
  box.querySelector('.anBot > p.sub')?.remove();
  box.scrollIntoView({ block: 'start' });
  return 'ok';
}

/* ================= der Einstieg für make_pictures.py ================= */
async function mockIdea(n, I) {
  if (n === 'card') return null;
  if (n === 1) return mockPlace(I);
  if (n === 2) return mockStack(I);
  if (n === 3) return mockStackPhone(I);
  if (n === 4) return mockFree(I);
  if (n === 5) return mockTemplates(I);
  if (n === 9) return mockFlow(I);
  if (n === 10) return mockAlarm(I);
  return 'unknown';
}
