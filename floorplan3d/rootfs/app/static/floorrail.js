/* Floor rail: a side bar with a little isometric picture of every floor (rooms, walls with windows and doors, or the roof) and a button for the whole
 * house. The drawing is done by drawThumb (a plain 2D canvas, tested with a fake canvas); initFloorRail builds the buttons. */

const ISO = (x, z, h) => [(x - z) * 0.866, (x + z) * 0.5 - h];

/** multiply a #rrggbb colour by k (shade); anything else is returned as it is */
export function shade(hex, k) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex || '#888';
  const v = parseInt(m[1], 16);
  const c = (sh) => Math.max(0, Math.min(255, Math.round(((v >> sh) & 255) * k)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

/** Draws one floor into a canvas. f: the floor, rb: roof box { x0, x1, z0, z1 } for a roof floor (else null),
 *  opts: { holo, accent, wallHeight } */
export function drawThumb(cv, f, rb, opts) {
  const { holo, accent, wallHeight } = opts;
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  const pts = rb ? [[rb.x0, rb.z0], [rb.x1, rb.z1], [rb.x0, rb.z1], [rb.x1, rb.z0]] : [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points)];
  if (!pts.length) return;
  const hMax = rb ? 1.8 : Math.max(wallHeight || 2.6, ...f.walls.map((w) => w.height || 0));
  const proj = pts.flatMap(([x, z]) => [ISO(x, z, 0), ISO(x, z, hMax)]);
  const us = proj.map((p) => p[0]), vs = proj.map((p) => p[1]);
  const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
  const k = Math.min((W * 0.86) / Math.max(u1 - u0, 1), (H * 0.62) / Math.max(v1 - v0, 1));   // every floor fills its picture
  const P = (x, z, h) => { const [u, v] = ISO(x, z, h); return [W / 2 + (u - (u0 + u1) / 2) * k, H * 0.4 + (v - (v0 + v1) / 2) * k]; };
  const poly = (q, fill, stroke) => {
    ctx.beginPath(); q.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.stroke(); }
  };
  if (rb) {                                               // roof: two slopes and the gable ends over the footprint of the house
    const m = (rb.z0 + rb.z1) / 2, hr = Math.min(1.8, Math.max(0.8, (rb.z1 - rb.z0) * 0.25));
    const r0 = P(rb.x0, m, hr), r1 = P(rb.x1, m, hr);
    const c00 = P(rb.x0, rb.z0, 0), c10 = P(rb.x1, rb.z0, 0), c01 = P(rb.x0, rb.z1, 0), c11 = P(rb.x1, rb.z1, 0);
    poly([c00, c10, r1, r0], holo ? null : '#8c4234', holo ? accent : null);
    poly([c01, c11, r1, r0], holo ? null : '#a8503f', holo ? accent : null);
    poly([c10, c11, r1], holo ? null : '#6f332a', holo ? accent : null);
    return;
  }
  f.rooms.forEach((r) => poly(r.points.map(([x, z]) => P(x, z, 0)), holo ? accent + '30' : r.color || '#8a7f70', holo ? accent : 'rgba(0,0,0,.25)'));
  const base = '#d9d4cc';
  [...f.walls].sort((p, q) => (p.a[0] + p.a[1] + p.b[0] + p.b[1]) - (q.a[0] + q.a[1] + q.b[0] + q.b[1])).forEach((w) => {
    const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    if (len < 0.01) return;
    const h = w.height || 2.6, t = w.thickness || 0.2;
    const d = [(w.b[0] - w.a[0]) / len, (w.b[1] - w.a[1]) / len];
    let n = [-d[1], d[0]];
    if (n[0] + n[1] < 0) n = [-n[0], -n[1]];             // the side that faces the viewer
    const o = [n[0] * t / 2, n[1] * t / 2];
    const A = [w.a[0] + o[0], w.a[1] + o[1]], B = [w.b[0] + o[0], w.b[1] + o[1]];
    const k0 = Math.abs(n[0]) > Math.abs(n[1]) ? 0.74 : 0.92;       // the side facing +x is in the shade
    if (holo) { poly([P(...A, 0), P(...B, 0), P(...B, h), P(...A, h)], accent + '22', accent); return; }
    poly([P(...A, 0), P(...B, 0), P(...B, h), P(...A, h)], shade(base, k0));
    (w.openings || []).forEach((op) => {
      const u0o = op.pos - op.width / 2, u1o = op.pos + op.width / 2, y0 = op.sill || 0, y1 = Math.min(h, y0 + op.height);
      const at = (u, y) => P(A[0] + d[0] * u, A[1] + d[1] * u, y);
      const col = op.type === 'window' ? '#9cc9ee' : (op.style === 'open' || op.style === 'gap') ? '#3a3632' : '#8a6a48';
      poly([at(u0o, y0), at(u1o, y0), at(u1o, y1), at(u0o, y1)], shade(col, k0 > 0.8 ? 1 : 0.85), 'rgba(255,255,255,.55)');
    });
    poly([P(w.a[0] - o[0], w.a[1] - o[1], h), P(w.b[0] - o[0], w.b[1] - o[1], h), P(...B, h), P(...A, h)], shade(base, 1.08));
  });
}

/** ctx: $, t, layout(), floorIdx(), houseMode(), isHolo(), settings(), roofBox(i), switchFloor(i), setHouseMode(on) */
export function initFloorRail(ctx) {
  const { $, t } = ctx;
  const thumbs = [];                                   // { cv, i }
  let timer = 0;
  function draw() {
    if (!thumbs.length) return;
    const layout = ctx.layout();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3df2ff';
    thumbs.forEach(({ cv, i }) => {
      const f = layout.floors[i];
      drawThumb(cv, f, f.kind === 'roof' ? ctx.roofBox(i) : null, { holo: ctx.isHolo(), accent, wallHeight: ctx.settings().wallHeight || 2.6 });
    });
  }
  function build() {
    const rail = $('#floorRail');
    if (!rail) return;
    const layout = ctx.layout(), houseMode = ctx.houseMode(), floorIdx = ctx.floorIdx();
    thumbs.length = 0;
    const mk = (cls, label, onClick, title = '') => {
      const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.title = title; b.addEventListener('click', onClick);
      const sp = document.createElement('span'); sp.textContent = label; b.append(sp);
      return b;
    };
    const items = [];
    if (layout.floors.length > 1 || layout.floors.some((x) => x.devices.length)) {
      const h = mk('railHouse' + (houseMode ? ' active' : ''), t('nav.house'), () => ctx.setHouseMode(!ctx.houseMode()), t('nav.houseTip'));
      h.prepend(document.createTextNode('⌂ '));
      items.push(h);
    }
    for (let i = layout.floors.length - 1; i >= 0; i--) {   // top floor first, like the building
      const b = mk('floorThumb' + (i === floorIdx && !houseMode ? ' active' : ''), layout.floors[i].name, () => ctx.switchFloor(i));
      b.dataset.floor = i;
      const cv = document.createElement('canvas'); cv.width = 240; cv.height = 130;
      b.prepend(cv);
      thumbs.push({ cv, i });
      items.push(b);
    }
    rail.replaceChildren(...items);
    draw();
  }
  /** redraw the thumbnails shortly after the layout changed (not on every drag step) */
  function schedule() { clearTimeout(timer); timer = setTimeout(draw, 250); }
  return { build, draw, schedule };
}
