/* 🖼 Bildkarten fürs Handy in the demo (5.33.0): the demo has no add-on that draws a card (piccard.py with Pillow), so the browser draws
 * the same card with a canvas: the same blocks, rows, sizes and colours, the demo's house and states (demo-data.js answers
 * api/piccards/preview with it). The demo has no camera pictures: a drawn stand-in. Keep it in step with piccard.py. */
import { cleanCard } from '../floorplan3d/rootfs/app/static/piccards.js';

const S = 2, W_PT = { tall: 480, wide: 640 }, RED = [226, 62, 52], YELLOW = [242, 180, 22];
const FONT = '"DejaVu Sans", Verdana, "Segoe UI", sans-serif';
const WORDS = {
  de: { alarm: 'ALARM', smoke: 'RAUCH', gas: 'GAS', co: 'KOHLENMONOXID', water: 'WASSER', test: 'TEST', flow: 'NACHRICHT', sensor: 'Melder', since: 'Seit', room: 'Raum',
    temp: 'Temperatur', hum: 'Feuchte', open: 'Offen', lights: 'Licht an', who: 'Zu Hause', weather: 'Draußen', alarmp: 'Alarmanlage', allShut: 'alles zu', allOff: 'alles aus',
    nobody: 'niemand', armed: 'scharf', disarmed: 'aus', triggered: 'ausgelöst', camera: 'KAMERA', demoCam: 'Kamerabild (in der Demo gemalt)', card: 'Karte', oclock: 'Uhr',
    days: 'Montag Dienstag Mittwoch Donnerstag Freitag Samstag Sonntag', months: 'Januar Februar März April Mai Juni Juli August September Oktober November Dezember',
    open1: 'OFFEN', on1: 'AN', sample: 'Beispiel' },
  en: { alarm: 'ALARM', smoke: 'SMOKE', gas: 'GAS', co: 'CARBON MONOXIDE', water: 'WATER', test: 'TEST', flow: 'MESSAGE', sensor: 'Sensor', since: 'Since', room: 'Room',
    temp: 'Temperature', hum: 'Humidity', open: 'Open', lights: 'Lights on', who: 'At home', weather: 'Outside', alarmp: 'Alarm', allShut: 'all shut', allOff: 'all off',
    nobody: 'nobody', armed: 'armed', disarmed: 'off', triggered: 'triggered', camera: 'CAMERA', demoCam: 'camera picture (drawn in the demo)', card: 'Card', oclock: '',
    days: 'Monday Tuesday Wednesday Thursday Friday Saturday Sunday', months: 'January February March April May June July August September October November December',
    open1: 'OPEN', on1: 'ON', sample: 'Sample' },
};
const words = (lang) => ({ ...WORDS.en, ...(WORDS[lang] || {}) });
const DEFAULT_NAMES = { de: ['Wasser-Alarm', 'Test 1', 'Gute Nacht'], en: ['Water alarm', 'Test 1', 'Good night'] };

/** the three cards a house starts with (as piccard.defaults) */
export function defaultCards(lang = 'de') {
  const [a, b, c] = DEFAULT_NAMES[lang] || DEFAULT_NAMES.en;
  return [
    { id: 'wasser', name: a, color: '#d63c31', theme: 'light', width: 'tall', blocks: [{ k: 'head', text: '{kind}', clock: true }, { k: 'plan', show: 'floor', marks: false },
      { k: 'camera', ent: '', half: true }, { k: 'info', rows: ['sensor', 'since', 'temp', 'hum'] }, { k: 'foot' }] },
    { id: 'test1', name: b, color: '#d63c31', theme: 'dark', width: 'tall', blocks: [{ k: 'camera', ent: '' }, { k: 'clock', date: true }, { k: 'text', text: '{text}', big: true },
      { k: 'plan', show: 'floor', marks: false, half: true }, { k: 'info', rows: ['who', 'weather', 'alarm'] }, { k: 'foot' }] },
    { id: 'gutenacht', name: c, color: '#2d3f7a', theme: 'dark', width: 'tall', blocks: [{ k: 'head', text: c, clock: true }, { k: 'plan', show: 'floor', marks: true },
      { k: 'info', rows: ['open', 'lights', 'temp', 'alarm'] }, { k: 'foot' }] },
  ];
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const onColor = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] > 170 ? [27, 34, 48] : [255, 255, 255]);
const hm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const dec = (n, lang) => { const v = Math.abs(n) < 1000 ? String(Math.round(n * 10) / 10) : String(Math.round(n)); return lang === 'en' ? v : v.replace('.', ','); };
const inside = (x, z, pts) => {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x1, z1] = pts[i], [x2, z2] = pts[j];
    if ((z1 > z) !== (z2 > z) && x < ((x2 - x1) * (z - z1)) / ((z2 - z1) || 1e-12) + x1) hit = !hit;
  }
  return hit;
};
function theme(card) {
  return card.theme === 'dark'
    ? { bg: [20, 26, 37], text: [238, 242, 248], muted: [148, 161, 182], line: [44, 52, 66], chip: [35, 44, 60], planBg: [24, 29, 40], room: [44, 52, 68], roomLine: [78, 88, 108], wall: [196, 204, 220], planText: [186, 196, 214], win: [96, 170, 236] }
    : { bg: [255, 255, 255], text: [27, 34, 48], muted: [107, 116, 134], line: [233, 236, 241], chip: [238, 241, 246], planBg: [246, 247, 250], room: [214, 219, 227], roomLine: [150, 156, 166], wall: [52, 58, 70], planText: [60, 66, 78], win: [110, 175, 230] };
}

/** what a card shows: ctx {kind, title, name, text, place, floors, house, states, lang, now} */
export function fill(text, ctx) {
  const w = words(ctx.lang), p = ctx.place || {};
  const v = { kind: ctx.kind === 'flow' && ctx.title ? ctx.title : (w[ctx.kind] || String(ctx.kind || '').toUpperCase()), name: ctx.name || '', room: p.room?.name || '', floor: p.floor?.name || '',
    house: ctx.house || '', time: hm(ctx.now), text: ctx.text || '', title: ctx.title || '' };
  Object.assign(v, { art: v.kind, melder: v.name, raum: v.room, etage: v.floor, haus: v.house, zeit: v.time });
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)).trim();
}
const num = (st) => { const n = parseFloat(st?.state); return Number.isFinite(n) ? n : null; };
const value = (st, lang) => { if (!st) return '–'; const n = num(st), u = st.attributes?.unit_of_measurement || ''; return `${n !== null ? dec(n, lang) : st.state} ${u}`.trim(); };
const floorsOf = (ctx) => (ctx.place ? [ctx.place.floor] : ctx.floors || []);
function opened(ctx, floors = null) {
  const out = [];
  (floors || floorsOf(ctx)).forEach((f) => (f.walls || []).forEach((w) => {
    if (!w.a || !w.b) return;
    const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1;
    (w.openings || []).forEach((o) => {
      if (!['on', 'open', 'opening'].includes(ctx.states[o.entity]?.state)) return;
      const k = (o.pos || 0) / L, x = w.a[0] + (w.b[0] - w.a[0]) * k, z = w.a[1] + (w.b[1] - w.a[1]) * k;
      const room = (f.rooms || []).find((r) => (r.points || []).length >= 3 && [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]].some(([dx, dz]) => inside(x + dx, z + dz, r.points)));
      out.push([x, z, o.name || room?.name || o.entity, f.id]);
    });
  }));
  return out;
}
function lit(ctx, floors = null) {
  const out = [];
  (floors || floorsOf(ctx)).forEach((f) => (f.devices || []).forEach((d) => {
    if (d.entity?.startsWith('light.') && ctx.states[d.entity]?.state === 'on') out.push([d.x, d.z, d.name || d.entity, f.id]);
  }));
  return out;
}
const names = (items, n = 3) => { const u = [...new Set(items.map((x) => x[2]).filter(Boolean))]; return u.slice(0, n).join(', ') + (u.length > n ? ` +${u.length - n}` : ''); };
function roomValue(place, states, cls, lang) {
  const r = place?.room;
  if (!r) return '';
  for (const d of place.floor.devices || []) {
    if (!d.entity || !inside(d.x, d.z, r.points)) continue;
    const st = states[d.entity];
    if (d.entity.startsWith('sensor.') && st?.attributes?.device_class === cls && num(st) !== null) return value(st, lang);
  }
  return '';
}
export function rowValue(key, ctx) {
  const w = words(ctx.lang), st = ctx.states || {}, p = ctx.place || {};
  switch (key) {
    case 'sensor': return ctx.name || '';
    case 'since': return `${hm(ctx.now)} ${w.oclock}`.trim();
    case 'room': return [p.room?.name, p.floor?.name].filter(Boolean).join(' · ');
    case 'temp': {
      if (ctx.place) return roomValue(p, st, 'temperature', ctx.lang);
      const v = Object.entries(st).filter(([e, s]) => e.startsWith('sensor.') && s.attributes?.device_class === 'temperature').map(([, s]) => num(s)).filter((x) => x !== null && x > -30 && x < 60);
      return v.length ? `Ø ${dec(v.reduce((a, b) => a + b, 0) / v.length, ctx.lang)} °C` : '';
    }
    case 'hum': return ctx.place ? roomValue(p, st, 'humidity', ctx.lang) : '';
    case 'open': return names(opened(ctx)) || w.allShut;
    case 'lights': return names(lit(ctx)) || w.allOff;
    case 'who': {
      const ps = Object.entries(st).filter(([e]) => e.startsWith('person.'));
      if (!ps.length) return '';
      const home = ps.filter(([, s]) => s.state === 'home').map(([e, s]) => s.attributes?.friendly_name || e);
      return home.length ? home.slice(0, 3).join(', ') + (home.length > 3 ? ` +${home.length - 3}` : '') : w.nobody;
    }
    case 'weather': {
      const x = Object.entries(st).find(([e]) => e.startsWith('weather.'));
      if (!x) return '';
      const t = x[1].attributes?.temperature;
      const wx = ctx.lang === 'en' ? { partlycloudy: 'partly cloudy', 'clear-night': 'clear' } : { sunny: 'sonnig', 'clear-night': 'klar', cloudy: 'bewölkt', partlycloudy: 'teils bewölkt',
        rainy: 'Regen', pouring: 'Starkregen', snowy: 'Schnee', fog: 'Nebel', windy: 'windig', lightning: 'Gewitter', 'lightning-rainy': 'Gewitter' };
      return [typeof t === 'number' ? `${dec(t, ctx.lang)} °C` : '', wx[x[1].state] || x[1].state].filter(Boolean).join(' · ');
    }
    case 'alarm': {
      const x = Object.entries(st).find(([e]) => e.startsWith('alarm_control_panel.'));
      if (!x) return '';
      const s = x[1].state || '';
      return s === 'triggered' ? w.triggered : s === 'disarmed' ? w.disarmed : s.startsWith('armed') ? w.armed : s;
    }
    default: return '';
  }
}

/* ---- drawing ---- */
const font = (pt, bold) => `${bold ? 'bold ' : ''}${Math.round(pt * S)}px ${FONT}`;
function text(g, s, x, y, f, color, align = 'left', base = 'alphabetic') { g.font = f; g.fillStyle = css(color); g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y); }
function fit(g, s, pt, maxw, bold, smallest = 10) { let p = pt; g.font = font(p, bold); while (p > smallest && g.measureText(s).width > maxw) { p -= 1; g.font = font(p, bold); } return p; }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
function icon(g, kind, x, y, s, c) {
  g.fillStyle = css(c); g.strokeStyle = css(c); g.lineWidth = Math.max(2, s * 0.09);
  const cx = x + s / 2, cy = y + s / 2;
  g.beginPath();
  if (kind === 'water' || kind === 'hum') { g.moveTo(cx, y + s * 0.08); g.lineTo(cx - s * 0.3, cy + s * 0.05); g.lineTo(cx + s * 0.3, cy + s * 0.05); g.fill(); g.beginPath(); g.ellipse(cx, cy + s * 0.15, s * 0.3, s * 0.27, 0, 0, 7); g.fill(); }
  else if (kind === 'smoke') { g.moveTo(cx, y + s * 0.05); g.lineTo(cx + s * 0.32, cy + s * 0.1); g.lineTo(cx + s * 0.25, y + s * 0.9); g.lineTo(cx - s * 0.25, y + s * 0.9); g.lineTo(cx - s * 0.32, cy + s * 0.1); g.fill(); }
  else if (kind === 'gas' || kind === 'co') { g.moveTo(cx, y + s * 0.08); g.lineTo(x + s * 0.95, y + s * 0.9); g.lineTo(x + s * 0.05, y + s * 0.9); g.fill(); }
  else if (['since', 'clock'].includes(kind)) { g.arc(cx, cy, s * 0.4, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, y + s * 0.28); g.moveTo(cx, cy); g.lineTo(cx + s * 0.2, cy + s * 0.12); g.stroke(); }
  else if (kind === 'temp') { rrect(g, cx - s * 0.1, y + s * 0.08, s * 0.2, s * 0.62, s * 0.1); g.fill(); g.beginPath(); g.arc(cx, y + s * 0.76, s * 0.19, 0, 7); g.fill(); }
  else if (['who', 'sensor'].includes(kind)) { g.arc(cx, y + s * 0.28, s * 0.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx, y + s * 0.92, s * 0.38, s * 0.37, 0, Math.PI, 0); g.fill(); }
  else if (kind === 'lights') { g.arc(cx, y + s * 0.36, s * 0.3, 0, 7); g.fill(); g.fillRect(cx - s * 0.15, y + s * 0.6, s * 0.3, s * 0.18); g.fillRect(cx - s * 0.12, y + s * 0.82, s * 0.24, s * 0.1); }
  else if (kind === 'open') { g.strokeRect(x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.76); g.beginPath(); g.moveTo(cx, y + s * 0.12); g.lineTo(cx, y + s * 0.88); g.moveTo(x + s * 0.12, cy); g.lineTo(x + s * 0.88, cy); g.stroke(); }
  else if (kind === 'weather') { g.arc(cx, cy, s * 0.22, 0, 7); g.fill(); for (let i = 0; i < 8; i += 1) { const a = (i * Math.PI) / 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3); g.lineTo(cx + Math.cos(a) * s * 0.44, cy + Math.sin(a) * s * 0.44); g.stroke(); } }
  else if (kind === 'camera') { rrect(g, x + s * 0.08, y + s * 0.28, s * 0.84, s * 0.58, s * 0.1); g.fill(); g.fillRect(cx - s * 0.16, y + s * 0.16, s * 0.32, s * 0.14); g.fillStyle = css(onColor(c)); g.beginPath(); g.arc(cx, cy + s * 0.09, s * 0.17, 0, 7); g.fill(); }
  else { g.arc(cx, y + s * 0.42, s * 0.32, Math.PI, 0); g.fill(); g.fillRect(cx - s * 0.32, y + s * 0.42, s * 0.64, s * 0.3); g.fillRect(cx - s * 0.42, y + s * 0.7, s * 0.84, s * 0.08); g.beginPath(); g.arc(cx, y + s * 0.88, s * 0.08, 0, 7); g.fill(); }
}
function bounds(floors, room) {
  const xs = [], zs = [];
  let pad = 0.8;
  if (room) { room.points.forEach((p) => { xs.push(p[0]); zs.push(p[1]); }); pad = 1.6; } else {
    floors.forEach((f) => { (f.rooms || []).forEach((r) => (r.points || []).forEach((p) => { xs.push(p[0]); zs.push(p[1]); }));
      (f.walls || []).forEach((w) => [w.a, w.b].forEach((p) => { if (p) { xs.push(p[0]); zs.push(p[1]); } })); });
  }
  if (!xs.length) return null;
  return [Math.min(...xs) - pad, Math.min(...zs) - pad, Math.max(...xs) + pad, Math.max(...zs) + pad];
}
function planFloor(ctx, marks, want = '') {
  const chosen = want && [ctx.place?.floor, ...(ctx.floors || [])].find((f) => f && f.id === want);   // a chosen floor (piccard.plan_floor)
  if (chosen) return chosen;
  if (ctx.place) return ctx.place.floor;
  const floors = (ctx.floors || []).filter((f) => (f.rooms || []).length);
  if (marks) {
    const count = {};
    [...opened(ctx), ...lit(ctx)].forEach((x) => { count[x[3]] = (count[x[3]] || 0) + 1; });
    if (Object.keys(count).length) return floors.reduce((a, b) => ((count[b.id] || 0) > (count[a.id] || 0) ? b : a), floors[0]);
  }
  return floors.find((f) => !['basement', 'roof'].includes(f.kind)) || floors[0];
}
function drawPlan(ctx, th, widthPx, show, marks, want = '') {
  const f = planFloor(ctx, marks, want);
  if (!f) return null;
  const place = ctx.place && ctx.place.floor?.id === f.id ? ctx.place : {}, room = place.room;   // another floor than the sensor's: no red room, no ring
  const b = bounds([f], show === 'room' ? room : null);
  if (!b) return null;
  let [x0, z0, x1, z1] = b;
  const wM = Math.max(x1 - x0, 3);
  let hM = Math.max(z1 - z0, 3);
  if (hM / wM < 0.45) { const m = (0.45 * wM - hM) / 2; z0 -= m; z1 += m; hM = 0.45 * wM; }
  if (hM / wM > 0.95) { hM = 0.95 * wM; const mz = (z0 + z1) / 2; z0 = mz - hM / 2; }
  const s = widthPx / wM, W = Math.round(widthPx), H = Math.round(hM * s);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const P = (x, z) => [(x - x0) * s, (z - z0) * s];
  g.fillStyle = css(th.planBg); g.fillRect(0, 0, W, H);
  (f.rooms || []).forEach((r) => {
    if ((r.points || []).length < 3) return;
    const mine = room && r === room;
    g.beginPath(); r.points.forEach((p, i) => { const [px, pz] = P(p[0], p[1]); if (i) g.lineTo(px, pz); else g.moveTo(px, pz); }); g.closePath();
    g.fillStyle = mine ? css(RED, 0.43) : css(th.room); g.fill();
    g.strokeStyle = css(mine ? RED : th.roomLine); g.lineWidth = Math.max(2, s * (mine ? 0.08 : 0.04)); g.stroke();
  });
  (f.walls || []).forEach((w) => {
    if (!w.a || !w.b) return;
    const a = P(w.a[0], w.a[1]), c = P(w.b[0], w.b[1]);
    g.strokeStyle = css(th.wall); g.lineWidth = Math.max(3, (w.thickness || 0.2) * s * 0.8); g.beginPath(); g.moveTo(...a); g.lineTo(...c); g.stroke();
    const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1;
    (w.openings || []).forEach((o) => {
      const k0 = Math.max(0, ((o.pos || 0) - (o.width || 0.9) / 2) / L), k1 = Math.min(1, ((o.pos || 0) + (o.width || 0.9) / 2) / L);
      g.strokeStyle = css(o.type === 'window' ? th.win : th.planBg); g.lineWidth = Math.max(3, 0.13 * s);
      g.beginPath(); g.moveTo(a[0] + (c[0] - a[0]) * k0, a[1] + (c[1] - a[1]) * k0); g.lineTo(a[0] + (c[0] - a[0]) * k1, a[1] + (c[1] - a[1]) * k1); g.stroke();
    });
  });
  const small = font(Math.max(7, Math.min(15, s * 0.17)), true);
  const ring = place.x != null ? [place.x, place.z] : null;
  (f.rooms || []).forEach((r) => {
    if ((r.points || []).length < 3 || !r.name) return;
    const cx = r.points.reduce((a, p) => a + p[0], 0) / r.points.length, cz = r.points.reduce((a, p) => a + p[1], 0) / r.points.length;
    let [tx, tz] = P(cx, cz);
    if (ring) { const [sx, sz] = P(...ring); if (Math.abs(tx - sx) < s * 1.6 && Math.abs(tz - sz) < s * 0.9) tz += tz <= sz ? s * 0.9 : -s * 0.9; }
    g.font = small;
    if (tx > 0 && tx < W && tz > 0 && tz < H && g.measureText(r.name).width < W * 0.9) {
      const mine = room && r === room;
      text(g, r.name, tx, tz, small, mine ? (th.bg[0] > 128 ? [150, 20, 20] : [255, 235, 232]) : th.planText, 'center', 'middle');
    }
  });
  const w = words(ctx.lang);
  if (marks) {
    [[opened(ctx, [f]), RED, w.open1], [lit(ctx, [f]), YELLOW, w.on1]].forEach(([items, col, word]) => items.forEach(([x, z, , fid]) => {
      if (fid !== f.id) return;
      const [px, pz] = P(x, z), rr = Math.max(10, s * 0.26);
      g.fillStyle = css(col, 0.27); g.beginPath(); g.arc(px, pz, rr + 6, 0, 7); g.fill();
      g.fillStyle = css(col); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(px, pz, rr, 0, 7); g.fill(); g.stroke();
      const f2 = font(Math.max(6, Math.min(12, s * 0.12)), true); g.font = f2;
      const tw = g.measureText(word).width, bx = px - tw / 2 - 7, by = Math.max(2, pz - rr - 34);
      g.fillStyle = css(col); rrect(g, bx, by, tw + 14, 26, 6); g.fill();
      text(g, word, bx + 7, by + 13, f2, [255, 255, 255], 'left', 'middle');
    }));
  }
  if (ring) {
    const [px, pz] = P(...ring), rr = Math.max(22, Math.min(70, s * 0.7));
    g.strokeStyle = css(RED, 0.35); g.lineWidth = 10; g.beginPath(); g.arc(px, pz, rr + 5, 0, 7); g.stroke();
    g.strokeStyle = css(RED); g.lineWidth = 6; g.beginPath(); g.arc(px, pz, rr, 0, 7); g.stroke();
    const word = ctx.kind !== 'flow' ? w[ctx.kind] || '' : '';
    if (word && word.length <= 12) {
      const f2 = font(Math.max(8, Math.min(15, s * 0.17)), true); g.font = f2;
      const tw = g.measureText(word).width, bx = Math.min(Math.max(4, px - tw / 2 - 11), W - tw - 26), by = Math.max(4, pz - rr - 62);
      g.fillStyle = css(RED); rrect(g, bx, by, tw + 22, 40, 9); g.fill();
      text(g, word, bx + 11, by + 20, f2, [255, 255, 255], 'left', 'middle');
    }
  }
  return cv;
}
/** the demo's stand-in for a camera picture */
function demoCamera(w, h, ctx) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#3a4a5c'); gr.addColorStop(1, '#151b22'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a2f36'; g.fillRect(0, h * 0.7, w, h * 0.3);
  g.fillStyle = '#1d252e'; g.fillRect(w * 0.1, h * 0.25, w * 0.24, h * 0.42);
  g.fillStyle = '#4a3a30'; g.fillRect(w * 0.62, h * 0.47, w * 0.27, h * 0.22);
  text(g, words(ctx.lang).demoCam, w / 2, h * 0.88, font(9), [160, 255, 238], 'center', 'middle');
  return cv;
}
function block(card, b, ctx, th, g, x, y, w, fullW, col) {
  const wd = words(ctx.lang), color = rgb(card.color), pad = 16 * S;
  switch (b.k) {
    case 'head': {
      const h = 74 * S, fg = onColor(color);
      g.fillStyle = card.color; g.fillRect(0, y, fullW, h);
      g.fillStyle = css(fg, 0.18); g.beginPath(); g.arc(41 * S, y + 37 * S, 23 * S, 0, 7); g.fill();
      icon(g, ctx.kind, 27 * S, y + 23 * S, 28 * S, fg);
      let right = 0;
      if (b.clock) {
        g.font = font(30, true); const tw = g.measureText(hm(ctx.now)).width;
        text(g, hm(ctx.now), fullW - 18 * S, y + 32 * S, font(30, true), fg, 'right');
        const d = ctx.now, short = `${wd.days.split(' ')[(d.getDay() + 6) % 7].slice(0, 2)}, ${d.getDate()}. ${wd.months.split(' ')[d.getMonth()].slice(0, 3)}.`;
        text(g, short, fullW - 18 * S, y + 52 * S, font(12.5), fg, 'right');
        right = tw + 30 * S;
      }
      const title = fill(b.text || '{kind}', ctx) || wd[ctx.kind] || '', maxw = fullW - 76 * S - right;
      text(g, title, 76 * S, y + 36 * S, font(fit(g, title, 27, maxw, true, 14), true), fg);
      const sub = [ctx.place?.room?.name, ctx.place?.floor?.name].filter(Boolean).join(' · ') || ctx.house || '';
      if (sub) text(g, sub, 76 * S, y + 57 * S, font(fit(g, sub, 15, maxw, false)), fg);
      return h;
    }
    case 'plan': {
      const whole = !b.half && col === 'full', pic = drawPlan(ctx, th, whole ? fullW : w, b.show, b.marks, b.floor || '');
      if (!pic) return 0;
      if (whole) g.drawImage(pic, 0, y); else { g.save(); rrect(g, x, y, w, pic.height, 10 * S); g.clip(); g.drawImage(pic, x, y); g.restore(); }
      return pic.height;
    }
    case 'camera': {
      const whole = col === 'full', bx = whole ? 0 : x, bw = whole ? fullW : w, h = Math.round(bw * (whole ? 9 / 16 : 3 / 4));
      g.save(); if (!whole) { rrect(g, bx, y, bw, h, 10 * S); g.clip(); }
      g.drawImage(demoCamera(bw, h, ctx), bx, y); g.restore();
      const label = `${wd.camera} ${ctx.cameraName || ''}`.trim().toUpperCase(), fl = font(whole ? 11.5 : 10, true);
      g.font = fl; const lw = g.measureText(label).width, lx = bx + (whole ? 10 : 6) * S, ly = y + (whole ? 10 : 6) * S;
      g.fillStyle = 'rgba(0,0,0,.68)'; rrect(g, lx, ly, lw + 22 * S, 20 * S, 6 * S); g.fill();
      g.fillStyle = 'rgb(255,77,64)'; g.beginPath(); g.arc(lx + 9 * S, ly + 10 * S, 3 * S, 0, 7); g.fill();
      text(g, label, lx + 16 * S, ly + 10 * S, fl, [255, 255, 255], 'left', 'middle');
      return h;
    }
    case 'clock': {
      const t = hm(ctx.now), pt = fit(g, t, 64, w * 0.62, true, 30);
      text(g, t, x, y + 8 * S, font(pt, true), th.text, 'left', 'top');
      g.font = font(pt, true); const tw = g.measureText(t).width, bottom = y + 8 * S + pt * S * 0.78;
      if (b.date) {
        const d = ctx.now, dw = ctx.lang === 'en' ? `${wd.days.split(' ')[(d.getDay() + 6) % 7]}, ${d.getDate()} ${wd.months.split(' ')[d.getMonth()]}` : `${wd.days.split(' ')[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${wd.months.split(' ')[d.getMonth()]}`;
        text(g, dw, x + tw + 14 * S, bottom, font(fit(g, dw, 14, Math.max(40, w - tw - 14 * S))), th.muted);
      }
      return bottom - y + 10 * S;
    }
    case 'info': case 'values': {
      let rows = [];
      if (b.k === 'info') rows = (b.rows || []).map((k) => [k, k === 'alarm' ? wd.alarmp : wd[k], rowValue(k, ctx)]).filter((r) => r[2] || ctx.preview).map((r) => [r[0], r[1], r[2] || '–']);
      else rows = (b.ents || []).map((e) => { const st = ctx.states[e]; const dom = e.split('.')[0]; return [st?.attributes?.device_class === 'temperature' ? 'temp' : ['light', 'switch'].includes(dom) ? 'lights' : ['binary_sensor', 'cover'].includes(dom) ? 'open' : 'info', st?.attributes?.friendly_name || e, value(st, ctx.lang)]; });
      if (!rows.length) return 0;
      const rh = 34 * S;
      rows.forEach(([k, label, v], i) => {
        const ry = y + i * rh;
        g.fillStyle = css(th.chip); rrect(g, x, ry + 4 * S, 26 * S, 26 * S, 8 * S); g.fill();
        icon(g, k, x + 5 * S, ry + 9 * S, 16 * S, k === 'open' ? RED : k === 'lights' ? YELLOW : th.muted);
        g.font = font(13); let l = label; while (l.length > 3 && g.measureText(l).width > w * 0.42) l = l.slice(0, -1);
        if (l !== label) l += '…';
        text(g, l, x + 35 * S, ry + 17 * S, font(13), th.muted, 'left', 'middle');
        const lw = g.measureText(l).width, vmax = w - 35 * S - lw - 10 * S, pt = fit(g, v, 14, vmax, true, 9);
        g.font = font(pt, true); let vv = v; while (vv.length > 1 && g.measureText(vv).width > vmax) vv = vv.slice(0, -1);
        text(g, vv === v ? v : `${vv}…`, x + w, ry + 17 * S, font(pt, true), th.text, 'right', 'middle');
        g.fillStyle = css(th.line); g.fillRect(x, ry + rh - 1, w, Math.max(1, S));
      });
      return rows.length * rh;
    }
    case 'text': {
      const s = fill(b.text || '', ctx);
      if (!s) return 0;
      const f = font(b.big ? 23 : 15, !!b.big), lh = (b.big ? 30 : 21) * S, lines = [];
      g.font = f;
      s.split('\n').forEach((para) => { let line = ''; para.split(/\s+/).forEach((word) => { const t = `${line} ${word}`.trim(); if (g.measureText(t).width <= w || !line) line = t; else { lines.push(line); line = word; } }); lines.push(line); });
      lines.slice(0, 6).forEach((line, i) => text(g, line, x, y + i * lh + 2 * S, f, th.text, 'left', 'top'));
      return Math.min(lines.length, 6) * lh + 4 * S;
    }
    case 'line': g.fillStyle = css(th.line); g.fillRect(pad, y + 5 * S, fullW - 2 * pad, 2 * S); return 12 * S;
    case 'foot':
      g.fillStyle = css(th.line); g.fillRect(0, y, fullW, Math.max(1, S));
      text(g, ctx.house || '', pad, y + 16 * S, font(11.5), th.muted, 'left', 'middle');
      text(g, `${wd.card} „${card.name}“ · 3D Floorplan`, fullW - pad, y + 16 * S, font(11.5), th.muted, 'right', 'middle');
      return 32 * S;
    default: return 0;
  }
}
function rowsOf(blocks) {
  const out = [];
  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i].half && i + 1 < blocks.length && !['head', 'line', 'foot'].includes(blocks[i + 1].k)) { out.push([blocks[i], blocks[i + 1]]); i += 1; } else out.push([blocks[i]]);
  }
  return out;
}
/** the card as a PNG (a Blob), as the add-on would draw it */
export async function renderCard(rawCard, ctx) {
  const card = cleanCard(rawCard), th = theme(card), W = W_PT[card.width] * S;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = 6000;
  const g = cv.getContext('2d');
  g.fillStyle = css(th.bg); g.fillRect(0, 0, W, cv.height);
  const pad = 16 * S, gap = 10 * S;
  let y = 0, last = null;
  if (!card.blocks.length) card.blocks.push({ k: 'head', text: '{kind}', clock: true });
  for (const row of rowsOf(card.blocks)) {
    const edge = ['head', 'foot'].includes(row[0].k) || (row.length === 1 && ['camera', 'plan'].includes(row[0].k));
    if (!edge && last !== 'edge') y += y ? gap : pad; else if (!edge) y += gap + 2 * S;
    let h;
    if (row.length === 1) h = block(card, row[0], ctx, th, g, pad, y, W - 2 * pad, W, 'full');
    else { const cw = Math.floor((W - 2 * pad - 14 * S) / 2); h = Math.max(block(card, row[0], ctx, th, g, pad, y, cw, W, 'left'), block(card, row[1], ctx, th, g, pad + cw + 14 * S, y, cw, W, 'right')); }
    if (h) { y += h; last = edge ? 'edge' : 'inner'; }
  }
  if (last === 'inner') y += pad;
  const out = document.createElement('canvas'); out.width = W; out.height = Math.max(Math.round(y), 40 * S);
  out.getContext('2d').drawImage(cv, 0, 0);
  return new Promise((ok) => out.toBlob(ok, 'image/png'));
}

/** a sample place for the editor's picture: the room of a device with this entity, else the first room with a light (the demo's house) */
export function samplePlace(layout, eid) {
  for (const f of layout.floors || []) {
    for (const d of f.devices || []) {
      if (eid ? d.entity === eid : /feucht|wasser|water|moist/i.test(d.entity || '')) {
        const room = (f.rooms || []).find((r) => (r.points || []).length >= 3 && inside(d.x, d.z, r.points));
        if (room) return { floor: f, room, x: d.x, z: d.z };
      }
    }
  }
  return eid ? null : (layout.floors || []).reduce((found, f) => found || (f.devices || []).filter((d) => d.entity?.startsWith('light.')).map((d) => {
    const room = (f.rooms || []).find((r) => (r.points || []).length >= 3 && inside(d.x, d.z, r.points));
    return room ? { floor: f, room, x: d.x, z: d.z } : null;
  }).find(Boolean), null);
}
