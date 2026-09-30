/* Nanoleaf layout: shapes, snapping and the small 2D editor.
   A layout is a list of panels { s: 'tri'|'hex'|'sq'|'bar', x, y, r } in metres, centred on (0,0) of the device;
   x runs to the right, y upwards in the wall plane, r is the rotation in degrees (counter-clockwise). */

const ngon = (n, r) => Array.from({ length: n }, (_, k) => [Math.cos((k * 2 * Math.PI) / n) * r, Math.sin((k * 2 * Math.PI) / n) * r]);
export const SHAPES = {
  tri: [[-0.12, -0.069], [0.12, -0.069], [0, 0.139]],
  hex: ngon(6, 0.13),
  sq:  [[-0.12, -0.12], [0.12, -0.12], [0.12, 0.12], [-0.12, 0.12]],
  bar: [[-0.45, -0.02], [0.45, -0.02], [0.45, 0.02], [-0.45, 0.02]],
};
export const SHAPE_KEYS = Object.keys(SHAPES);
export const DEFAULT_PANELS = [{ s: 'sq', x: -0.12, y: 0, r: 0 }, { s: 'sq', x: 0.12, y: 0, r: 0 }];
const STEP = 30;

export function polyOf(p) {
  const a = (p.r * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return SHAPES[p.s].map(([x, y]) => [p.x + x * c - y * s, p.y + x * s + y * c]);
}
function edgesOf(poly) {
  return poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return { m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n: [dy / L, -dx / L] };
  });
}
export function nanoBounds(panels) {
  if (!panels?.length) panels = DEFAULT_PANELS;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  panels.forEach((p) => polyOf(p).forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
/** shift the layout so its bounding box is centred on the origin */
export function centred(panels) {
  const b = nanoBounds(panels), r2 = (v) => +v.toFixed(4);
  return panels.map((p) => ({ s: p.s, x: r2(p.x - b.cx), y: r2(p.y - b.cy), r: p.r }));
}

/* do two convex polygons overlap by more than a hair? (separating axis test) */
function overlaps(A, B, tol = 0.003) {
  for (const P of [A, B]) {
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], ax = b[1] - a[1], ay = -(b[0] - a[0]), L = Math.hypot(ax, ay) || 1;
      const nx = ax / L, ny = ay / L;
      let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
      A.forEach(([x, y]) => { const d = x * nx + y * ny; a0 = Math.min(a0, d); a1 = Math.max(a1, d); });
      B.forEach(([x, y]) => { const d = x * nx + y * ny; b0 = Math.min(b0, d); b1 = Math.max(b1, d); });
      if (a1 <= b0 + tol || b1 <= a0 + tol) return false;
    }
  }
  return true;
}
const free = (cand, panels) => { const pc = polyOf(cand); return !panels.some((q) => overlaps(pc, polyOf(q))); };

/** where does a new panel of shape `s` go when the pointer is at (x,y)? Edges click onto neighbouring edges;
 *  far from any panel it is placed freely with rotation `rot`. Returns { panel, snapped, ok } */
export function placeAt(panels, s, x, y, rot = 0, reach = 0.22) {
  const free0 = { s, x: +x.toFixed(3), y: +y.toFixed(3), r: rot };
  if (!panels.length) return { panel: free0, snapped: false, ok: true };
  const all = panels.flatMap((p) => edgesOf(polyOf(p)));
  let best = null;
  for (let r = 0; r < 360; r += STEP) {
    const probe = { s, x: 0, y: 0, r }, mine = edgesOf(polyOf(probe));
    for (const f of mine) for (const e of all) {
      if (f.n[0] * e.n[0] + f.n[1] * e.n[1] > -0.985) continue;
      const cand = { s, x: e.m[0] - f.m[0], y: e.m[1] - f.m[1], r };
      const dist = Math.hypot(cand.x - x, cand.y - y) + (r === rot ? 0 : 0.015);
      if (dist > reach + 0.4 || (best && dist >= best.dist)) continue;
      if (!free(cand, panels)) continue;
      best = { dist, cand };
    }
  }
  if (best && best.dist <= reach + 0.05) return { panel: { ...best.cand, x: +best.cand.x.toFixed(4), y: +best.cand.y.toFixed(4) }, snapped: true, ok: true };
  return { panel: free0, snapped: false, ok: free(free0, panels) };
}

/* ---------------- the editor dialog ---------------- */
export function openNanoEditor({ panels, t, onSave }) {
  let list = (panels?.length ? panels : []).map((p) => ({ ...p }));
  let shape = 'tri', rot = 0, mode = 'add', hover = null, hist = [];
  const dlg = document.createElement('dialog');
  dlg.id = 'nanoDialog';
  dlg.innerHTML = `<form method="dialog" novalidate>
    <div class="dlgHead"><h2>${t('nano.title')}</h2><button type="submit" value="cancel" class="dlgClose" formnovalidate aria-label="${t('close')}">✕</button></div>
    <p class="hint">${t('nano.hint')}</p>
    <div class="nanoBar">${SHAPE_KEYS.map((k) => `<button type="button" data-shape="${k}" title="${t('dev.panel_' + k)}">${{ tri: '▲', hex: '⬢', sq: '■', bar: '▬' }[k]}</button>`).join('')}
      <span class="sep"></span>
      <button type="button" id="nanoRot">↻ ${t('nano.rotate')}</button>
      <button type="button" id="nanoDel">🗑 ${t('nano.eraser')}</button>
      <button type="button" id="nanoUndo">↶ ${t('nano.undo')}</button>
      <button type="button" id="nanoClear">${t('nano.clear')}</button></div>
    <canvas id="nanoCanvas" width="720" height="460"></canvas>
    <div class="nanoFoot"><span id="nanoCount"></span><span class="grow"></span>
      <button type="submit" value="cancel" formnovalidate>${t('cancel')}</button>
      <button type="button" id="nanoOk" class="primary">${t('nano.apply')}</button></div>
  </form>`;
  document.body.append(dlg);
  const cv = dlg.querySelector('#nanoCanvas'), cx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const view = () => {
    const b = list.length ? nanoBounds(list) : { cx: 0, cy: 0, w: 0, h: 0 };
    const sc = Math.min(W / (Math.max(b.w, 0.6) + 1.3), H / (Math.max(b.h, 0.5) + 1.1), 900);
    return { sc, ox: W / 2 - b.cx * sc, oy: H / 2 + b.cy * sc };
  };
  const toPx = (v, x, y) => [v.ox + x * v.sc, v.oy - y * v.sc];
  const toWorld = (v, px, py) => [(px - v.ox) / v.sc, (v.oy - py) / v.sc];
  const css = getComputedStyle(document.documentElement);
  const col = (n, d) => (css.getPropertyValue(n).trim() || d);
  function draw() {
    const v = view();
    cx.clearRect(0, 0, W, H);
    cx.fillStyle = col('--bg', '#06121f'); cx.fillRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(160,215,255,.12)'; cx.lineWidth = 1;
    for (let g = Math.ceil(toWorld(v, 0, 0)[0] / 0.1) * 0.1; toPx(v, g, 0)[0] < W; g += 0.1) { const px = toPx(v, g, 0)[0]; cx.beginPath(); cx.moveTo(px, 0); cx.lineTo(px, H); cx.stroke(); }
    for (let g = Math.floor(toWorld(v, 0, H)[1] / 0.1) * 0.1; toPx(v, 0, g)[1] > 0; g += 0.1) { const py = toPx(v, 0, g)[1]; cx.beginPath(); cx.moveTo(0, py); cx.lineTo(W, py); cx.stroke(); }
    const path = (p) => { const poly = polyOf(p); cx.beginPath(); poly.forEach(([x, y], i) => { const [px, py] = toPx(v, x, y); i ? cx.lineTo(px, py) : cx.moveTo(px, py); }); cx.closePath(); };
    list.forEach((p) => { path(p); cx.fillStyle = 'rgba(35,224,255,.28)'; cx.fill(); cx.strokeStyle = '#23e0ff'; cx.lineWidth = 2; cx.stroke(); });
    if (hover) {
      if (mode === 'del') {
        const hit = pick(hover[0], hover[1]);
        if (hit) { path(hit); cx.fillStyle = 'rgba(255,74,61,.45)'; cx.fill(); }
      } else {
        const r = placeAt(list, shape, hover[0], hover[1], rot);
        path(r.panel); cx.fillStyle = r.ok ? 'rgba(255,214,120,.45)' : 'rgba(255,74,61,.4)'; cx.fill();
        cx.strokeStyle = r.ok ? '#ffd678' : '#ff4a3d'; cx.setLineDash([6, 4]); cx.lineWidth = 2; cx.stroke(); cx.setLineDash([]);
        hover.res = r;
      }
    }
    if (list.length) {
      const b = nanoBounds(list), [x0, y0] = toPx(v, b.x0, b.y1), [x1] = toPx(v, b.x1, b.y1);
      cx.fillStyle = col('--dim', '#9fb6c9'); cx.font = '12px sans-serif'; cx.textAlign = 'center';
      cx.fillText(`${(b.w * 100).toFixed(0)} × ${(b.h * 100).toFixed(0)} cm`, (x0 + x1) / 2, y0 - 8);
    }
    dlg.querySelector('#nanoCount').textContent = t('nano.count').replace('{n}', list.length);
    dlg.querySelectorAll('[data-shape]').forEach((b) => b.classList.toggle('on', mode === 'add' && b.dataset.shape === shape));
    dlg.querySelector('#nanoDel').classList.toggle('on', mode === 'del');
  }
  const pick = (x, y) => [...list].reverse().find((p) => {
    const poly = polyOf(p); let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
  const push = () => { hist.push(JSON.stringify(list)); if (hist.length > 60) hist.shift(); };
  const ptr = (e) => { const r = cv.getBoundingClientRect(), v = view(); return toWorld(v, ((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height); };
  cv.addEventListener('pointermove', (e) => { hover = ptr(e); draw(); });
  cv.addEventListener('pointerleave', () => { hover = null; draw(); });
  cv.addEventListener('contextmenu', (e) => { e.preventDefault(); const h = pick(...ptr(e)); if (h) { push(); list.splice(list.indexOf(h), 1); draw(); } });
  cv.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const [x, y] = ptr(e);
    if (mode === 'del') { const h = pick(x, y); if (h) { push(); list.splice(list.indexOf(h), 1); } }
    else { const r = placeAt(list, shape, x, y, rot); if (r.ok) { push(); list.push(r.panel); } }
    hover = [x, y]; draw();
  });
  dlg.querySelectorAll('[data-shape]').forEach((b) => b.addEventListener('click', () => { shape = b.dataset.shape; mode = 'add'; draw(); }));
  dlg.querySelector('#nanoRot').addEventListener('click', () => { rot = (rot + STEP) % 360; draw(); });
  dlg.querySelector('#nanoDel').addEventListener('click', () => { mode = mode === 'del' ? 'add' : 'del'; draw(); });
  const undo = () => { if (hist.length) { list = JSON.parse(hist.pop()); draw(); } };
  dlg.querySelector('#nanoUndo').addEventListener('click', undo);
  dlg.querySelector('#nanoClear').addEventListener('click', () => { if (list.length) { push(); list = []; draw(); } });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') { rot = (rot + STEP) % 360; draw(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  });
  dlg.querySelector('#nanoOk').addEventListener('click', () => {
    if (list.length) onSave(centred(list));
    dlg.close();
  });
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal();
  draw();
}
