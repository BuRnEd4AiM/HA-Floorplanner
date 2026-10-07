/* 2D blueprint editor. Works directly on the shared layout object, so everything drawn here is the same
   data the 3D view builds from (and vice versa). Rendering is plain SVG in screen coordinates. */

import { nanoBounds } from './nanoleaf.js';
import { kitchenLayout } from './kitchen.js';
import { solarField } from './solarroof.js';
import { rotPoint, readableAngle } from './planview.js';
import { bridgeSize } from './bridge.js';
import { pathWorld, ringSectionsWorld, segEntity, projectOnPath, setRange } from './ledring.js';
import { stairLocal, stairHit, polyToWorld, toWorld, toLocal, stairHandles, stairCounts, wallStairWidthAt, arrivingStairs, MIN_TREAD, MAX_TREAD } from './stairs.js';
import { boxItems } from './multisel.js';
import { roofAt, dragStep, roofHandles, resizeBox } from './roofmove.js';

const NS = 'http://www.w3.org/2000/svg';
const C = {
  wall: '#9fdcff', wallGhost: 'rgba(159,220,255,.25)', line: '#e8f6ff', sel: '#ffb04a', accent: '#23e0ff',
  grid1: 'rgba(160,215,255,.10)', grid2: 'rgba(160,215,255,.22)', text: '#eaf7ff', warn: '#ff4a3d',
};

const POLY_KINDS = new Set(['room', 'block', 'hole']);                     // shapes edited by their corners
const polyList = (f, kind) => (kind === 'room' ? f.rooms : kind === 'block' ? f.blocks || [] : f.holes || []);
const FLAT = new Set(['carpet', 'lawn', 'terrace', 'path', 'pool']);   // lie on the ground: drawn below, picked last
/* footprint (m) of every device type: [w, d] or radius for round ones */
const FOOT = {
  light: { r: 0.2 }, lamp: { r: 0.2 }, orb: { r: 0.11 }, strip: { w: 1, d: 0.06 }, panel_tri: { w: 0.24, d: 0.24 }, panel_hex: { w: 0.26, d: 0.26 }, panel_sq: { w: 0.24, d: 0.24 }, panel_bar: { w: 0.9, d: 0.06 }, nanoleaf: { w: 0.5, d: 0.06 }, tv_led: { w: 1.3, d: 0.06 }, switch: { w: 0.14, d: 0.14 }, sensor: { r: 0.09 }, thermostat: { w: 0.9, d: 0.16 },
  tv: { w: 1.2, d: 0.45 }, sofa: { w: 2.0, d: 0.9 }, bed: { w: 1.6, d: 2.0 }, table: { w: 1.4, d: 0.8 }, plant: { r: 0.3 },
  chair: { w: 0.42, d: 0.42 }, armchair: { w: 0.9, d: 0.85 }, desk: { w: 1.4, d: 0.7 }, diningtable: { w: 1.8, d: 0.95 },
  coffeetable: { w: 1.0, d: 0.55 }, wardrobe: { w: 1.5, d: 0.6 }, shelf: { w: 0.9, d: 0.34 }, sideboard: { w: 1.6, d: 0.42 },
  kitchen: { w: 2.4, d: 0.6 }, fridge: { w: 0.6, d: 0.65 }, washer: { w: 0.6, d: 0.6 }, bathtub: { w: 1.7, d: 0.75 },
  toilet: { w: 0.38, d: 0.5 }, basin: { w: 0.6, d: 0.45 }, shower: { w: 0.9, d: 0.9 }, carpet: { w: 2.0, d: 1.4 }, car: { w: 1.8, d: 4.2 },
  tree: { w: 2, d: 2 }, bush: { w: 1, d: 1 }, pool: { w: 4, d: 2.5 }, lawn: { w: 6, d: 4 }, terrace: { w: 4, d: 3 }, path: { w: 1, d: 4 }, fence: { w: 3, d: 0.12 },
  sofa2: { w: 2.66, d: 1.9 }, tvstand: { w: 1.6, d: 0.4 }, bookcase: { w: 0.9, d: 0.3 }, fireplace: { w: 1.2, d: 0.5 }, piano: { w: 1.5, d: 1.12 }, pouf: { r: 0.3 },
  sidetable: { r: 0.25 }, curtain: { w: 1.9, d: 0.1 }, barstool: { r: 0.2 }, stove: { w: 0.6, d: 0.6 }, oven: { w: 0.6, d: 0.55 }, dishwasher: { w: 0.6, d: 0.6 },
  sink: { w: 1.2, d: 0.6 }, island: { w: 1.9, d: 1.0 }, microwave: { w: 0.46, d: 0.35 }, mirror: { w: 0.62, d: 0.05 }, towelrad: { w: 0.5, d: 0.06 },
  doublebasin: { w: 1.2, d: 0.5 }, bed_single: { w: 0.95, d: 2.0 }, nightstand: { w: 0.45, d: 0.4 }, dresser: { w: 1.2, d: 0.5 }, crib: { w: 0.7, d: 1.3 },
  monitor: { w: 0.62, d: 0.37 }, officechair: { r: 0.3 }, printer: { w: 0.45, d: 0.35 }, pendant: { r: 0.2 }, walllamp: { r: 0.1 }, spot: { r: 0.06 },
  radiator: { w: 0.95, d: 0.1 }, boiler: { r: 0.25 }, camera: { r: 0.06 }, speaker: { w: 0.2, d: 0.2 }, vacuum: { r: 0.17 }, smoke: { r: 0.06 }, router: { w: 0.2, d: 0.14 }, presence: { r: 0.25 },
  picture: { w: 0.6, d: 0.06 }, tv_wall: { w: 1.25, d: 0.06 },
  door: { w: 0.95, d: 0.1 }, window: { w: 1.2, d: 0.1 },
};
const GLYPH = { light: '✦', lamp: '✦', orb: '●', strip: '', switch: '◧', sensor: '◉', thermostat: '≋', tv: '▭', plant: '❀', bed: '', sofa: '' };
FOOT.inverter = { w: 0.45, d: 0.16 }; FOOT.powermeter = { w: 0.22, d: 0.11 }; FOOT.fusebox = { w: 0.5, d: 0.18 }; FOOT.houseentry = { w: 0.3, d: 0.2 };
FOOT.battery = { w: 0.6, d: 0.22 }; FOOT.wallbox = { w: 0.25, d: 0.12 }; FOOT.solarpanel = { w: 1.0, d: 1.55 }; FOOT.watermeter = { w: 0.34, d: 0.11 }; FOOT.gasmeter = { w: 0.33, d: 0.2 }; FOOT.heatmeter = { w: 0.12, d: 0.08 };      // power things: the real size, not the 0.8 m default box
const DEFAULT_FOOT = { w: 0.8, d: 0.8 };

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

export function createPlan(ctx) {
  const root = document.createElement('div');
  root.id = 'plan2d';
  root.hidden = true;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'plan-svg');
  root.append(svg);
  ctx.stage.insertBefore(root, ctx.stage.firstChild);

  let visible = false;
  let s = 60, tx = 0, ty = 0;                 // px per metre + offset
  let rot = 0;                                // degrees the plan is turned on the screen (with the 3D view, #212)
  let W = 800, H = 600;
  let drawPts = [], cursor = null, shift = false;
  let hover = null, opPreview = null;
  let drag = null;                            // active pointer interaction
  let raf = 0, rebuildRaf = 0;
  let lastTap = null;
  let bgMode = null;                          // null | 'move' | 'calib' (background image tools)
  let calibPts = [], calibCur = null;

  const floor = () => ctx.floor();
  const sx = (x) => x * s + tx, sy = (z) => z * s + ty;
  const wx = (px) => (px - tx) / s, wz = (py) => (py - ty) / s;
  const grid = () => ctx.settings().grid || 0.25;
  const isLive = () => ctx.isLive();

  /* ---------- background image geometry (corners rotate around the image origin) ---------- */
  const bgRot = (b, lx, lz) => { const th = ((b.rot || 0) * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th); return [b.x + lx * c - lz * sn, b.z + lx * sn + lz * c]; };
  const bgCorners = (b) => { const h = b.w * (b.ar || 1); return [[0, 0], [b.w, 0], [b.w, h], [0, h]].map(([lx, lz]) => bgRot(b, lx, lz)); };

  /* ---------- geometry helpers ---------- */
  const dirOf = (w) => { const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1; return [(w.b[0] - w.a[0]) / L, (w.b[1] - w.a[1]) / L, L]; };
  const distSeg = (px, pz, a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
    const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / L2));
    return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
  };
  function footOf(d) {
    const base = FOOT[d.type] || DEFAULT_FOOT;
    const k = d.scale || 1;
    if (d.type === 'picture') return { w: (d.w || 0.6) * k, d: 0.06 };
    if (d.type === 'kitchenrun') { const l = kitchenLayout(d); return { w: l.w * k, d: l.d * k }; }
    if (d.type === 'bridge') { const b = bridgeSize(d); return { w: b.len * k * (d.sx || 1), d: b.width * k * (d.sz || 1) }; }   // metal bridge (#189)
    if (d.type === 'solarpanel' && ((d.cols || 1) > 1 || (d.rows || 1) > 1)) { const l = solarField(d); return { w: l.w * k * (d.sx || 1), d: l.d * k * (d.sz || 1) }; }   // a field of panels (#176)
    if (d.type === 'nanoleaf') return { w: nanoBounds(d.panels).w * k * (d.sx || 1), d: 0.06 };
    if (d.type === 'ledring') {                                   // not used for hits (those follow the line), only for sizes and labels
      const xs = (d.pts || [[0, 0]]).map((p) => p[0] * k * (d.sx || 1)), zs = (d.pts || [[0, 0]]).map((p) => p[1] * k * (d.sz || 1));
      return { w: Math.max(0.1, Math.max(...xs) - Math.min(...xs)), d: Math.max(0.1, Math.max(...zs) - Math.min(...zs)) };
    }
    const kx = k * (d.sx || 1), kz = k * (d.sz || 1);
    if (base.r) return (d.sx || 1) === 1 && (d.sz || 1) === 1 ? { r: base.r * k } : { w: 2 * base.r * kx, d: 2 * base.r * kz };
    return { w: base.w * kx, d: base.d * kz };
  }
  /* size handles of a selected device: middle of its local +x and +z edge */
  const baseFoot = (d) => { const b = FOOT[d.type] || DEFAULT_FOOT; return b.r ? { w: 2 * b.r, d: 2 * b.r } : b; };
  function devHandles(d) {
    const f = footOf(d), w = f.r ? 2 * f.r : f.w, dp = f.r ? 2 * f.r : f.d, th = (-(d.rot || 0) * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
    const W = (lx, lz) => [d.x + lx * c - lz * sn, d.z + lx * sn + lz * c];
    return { x: W(w / 2, 0), z: W(0, dp / 2) };
  }
  const devLocal = (d, x, z) => { const th = (-(d.rot || 0) * Math.PI) / 180, dx = x - d.x, dz = z - d.z; return [dx * Math.cos(th) + dz * Math.sin(th), -dx * Math.sin(th) + dz * Math.cos(th)]; };
  /** LED ring: is (x, z) on its line; which section is under it (-1: a gap without LEDs) */
  const ringTol = () => Math.max(0.1, 8 / s);
  const onRingPath = (d, x, z) => pathWorld(d).some((e) => distSeg(x, z, e.a, e.b) <= ringTol());
  function ringSegAt(d, x, z) {
    let best = -1, bd = ringTol();
    ringSectionsWorld(d).forEach((sc) => sc.pieces.forEach(([a, b]) => { const dd = distSeg(x, z, a, b); if (dd <= bd) { bd = dd; best = sc.i; } }));
    return best;
  }
  function devHit(d, x, z) {
    if (d.type === 'ledring') return onRingPath(d, x, z);          // only the line itself, the room inside stays free
    const f = footOf(d), pad = Math.max(0.05, 8 / s);
    const th = (-(d.rot || 0) * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
    const dx = x - d.x, dz = z - d.z;
    const lx = dx * c + dz * sn, lz = -dx * sn + dz * c;           // into device-local frame
    if (f.r) return Math.hypot(dx, dz) <= f.r + pad;
    return Math.abs(lx) <= f.w / 2 + pad && Math.abs(lz) <= f.d / 2 + pad;
  }

  /* Snap to nearby corner points first, then to the grid. `fine` = 5 cm grid (devices). */
  function snapPt(x, z, { fine = false, ends = true, free = false } = {}) {
    if (ends) {
      const f = floor(), tol = 10 / s;
      let best = null, bd = tol;
      const test = (p) => { const d = Math.hypot(p[0] - x, p[1] - z); if (d < bd) { bd = d; best = p; } };
      f.walls.forEach((w) => { test(w.a); test(w.b); });
      f.rooms.forEach((r) => r.points.forEach(test));
      (f.blocks || []).forEach((r) => r.points.forEach(test));
      (f.holes || []).forEach((r) => r.points.forEach(test));
      if (best) return [best[0], best[1]];
    }
    if (free) return [x, z];
    const g = fine ? 0.05 : grid();
    return [Math.round(x / g) * g, Math.round(z / g) * g];
  }
  function angleSnap(from, p) {
    const dx = p[0] - from[0], dz = p[1] - from[1], L = Math.hypot(dx, dz);
    if (!L) return p;
    const a = Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) * (Math.PI / 4);
    const g = grid();
    const l = Math.round(L / g) * g;
    return [from[0] + Math.cos(a) * l, from[1] + Math.sin(a) * l];
  }

  /* ---------- picking ---------- */
  function openingAt(x, z) {
    const tol = Math.max(0.12, 8 / s);
    let best = null, bd = Infinity;
    floor().walls.forEach((w) => {
      const [ux, uz, L] = dirOf(w);
      (w.openings || []).forEach((o) => {
        const cx = w.a[0] + ux * o.pos, cz = w.a[1] + uz * o.pos;
        const along = Math.abs((x - cx) * ux + (z - cz) * uz), across = Math.abs(-(x - cx) * uz + (z - cz) * ux);
        const swing = o.type === 'door' ? o.width : 0;                  // door leaf area counts a bit
        if (along <= o.width / 2 + tol && across <= Math.max(w.thickness / 2 + tol, swing * 0.15) && along + across < bd) { bd = along + across; best = { kind: 'opening', id: o.id }; }
      });
    });
    return best;
  }
  /* exact hits for a double click: the generous reach of pickAt (opening / device padding, a few pixels) must not take a
   * double click away from a wall that is right there */
  function onOpeningExact(id, x, z) {
    for (const w of floor().walls) {
      const o = (w.openings || []).find((q) => q.id === id);
      if (!o) continue;
      const [ux, uz] = dirOf(w);
      const cx = w.a[0] + ux * o.pos, cz = w.a[1] + uz * o.pos;
      return Math.abs((x - cx) * ux + (z - cz) * uz) <= o.width / 2 && Math.abs(-(x - cx) * uz + (z - cz) * ux) <= w.thickness / 2 + 0.03;
    }
    return false;
  }
  function onDeviceExact(id, x, z) {
    const d = floor().devices.find((q) => q.id === id);
    if (!d) return false;
    if (d.type === 'ledring') return true;
    const f = footOf(d), th = (-(d.rot || 0) * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
    const dx = x - d.x, dz = z - d.z;
    if (f.r) return Math.hypot(dx, dz) <= f.r;
    return Math.abs(dx * c + dz * sn) <= f.w / 2 && Math.abs(-dx * sn + dz * c) <= f.d / 2;
  }
  /** the line of a cable in the plan: straight when it hangs in the air, otherwise first along x, then along z like the real cable on the floor */
  const cableLine = (a, b, route) => (route === 'air' ? [a, b] : [a, [b[0], a[1]], b]);
  function cableAt(x, z) {
    const f = floor(), tol = Math.max(0.2, 9 / s);
    let best = null;
    f.devices.forEach((d) => ctx.cablesOf(d).forEach((c) => {
      const tg = f.devices.find((q) => q.id === c.to);
      if (!tg) return;
      const pts = cableLine([d.x, d.z], [tg.d?.x ?? tg.x, tg.d?.z ?? tg.z], c.route);
      for (let i = 1; i < pts.length; i++) { const k = distSeg(x, z, pts[i - 1], pts[i]); if (k <= tol && (!best || k < best.k)) best = { k, id: c.id }; }
    }));
    return best ? { kind: 'cable', id: best.id } : null;
  }
  function pickAt(x, z) {
    const f = floor();
    if (ctx.powerMode?.()) {                                                   // the power editor: only power devices, with a little room around them
      const pw = f.devices.filter((d) => ctx.isPowerType(d.type)), tol = Math.max(0.35, 14 / s);
      const near = pw.map((d) => ({ d, k: Math.hypot(d.x - x, d.z - z) })).filter((q) => q.k <= tol || devHit(q.d, x, z)).sort((a, b) => a.k - b.k)[0];
      return near ? { kind: 'device', id: near.d.id } : (ctx.showCables?.() ? cableAt(x, z) : null);
    }
    const pm = (d) => !ctx.powerMode?.() || ctx.isPowerType(d.type);          // the power editor: only power things are picked
    const devs = f.devices.filter((d) => pm(d) && devHit(d, x, z) && !FLAT.has(d.type)).sort((a, b) => {
      const fa = footOf(a), fb = footOf(b);
      return (fa.r ? fa.r * fa.r * 3 : fa.w * fa.d) - (fb.r ? fb.r * fb.r * 3 : fb.w * fb.d);   // smallest first
    });
    if (devs.length) return devs[0].type === 'ledring' ? { kind: 'device', id: devs[0].id, ...(ringSegAt(devs[0], x, z) >= 0 ? { seg: ringSegAt(devs[0], x, z) } : {}) } : { kind: 'device', id: devs[0].id };
    const op = openingAt(x, z);
    if (op) return op;
    const tol = Math.max(0.06, 7 / s);
    let wb = null, wd = Infinity;
    f.walls.forEach((w) => { const d = distSeg(x, z, w.a, w.b); if (d <= Math.max(w.thickness / 2, tol) && d < wd) { wd = d; wb = w; } });
    if (wb) return { kind: 'wall', id: wb.id };
    const stair = (f.stairs || []).find((q) => stairHit(q, x, z, ctx.floorH()));
    if (stair) return { kind: 'stair', id: stair.id };
    const rug = f.devices.find((d) => pm(d) && FLAT.has(d.type) && devHit(d, x, z));
    if (rug) return { kind: 'device', id: rug.id };
    const hole = (f.holes || []).filter((r) => ctx.pointInPoly(x, z, r.points));   // a floor opening lies in a room: it wins
    if (hole.length) return { kind: 'hole', id: hole[hole.length - 1].id };
    const rooms = f.rooms.filter((r) => ctx.pointInPoly(x, z, r.points));
    if (rooms.length) return { kind: 'room', id: rooms[rooms.length - 1].id };
    const blk = (f.blocks || []).filter((r) => ctx.pointInPoly(x, z, r.points));
    if (blk.length) return { kind: 'block', id: blk[blk.length - 1].id };
    if (f.kind === 'roof' && !isLive()) {                             // a roof of the open roof floor (#255): anything else on it comes first
      const rr = roofAt(ctx.roofRects?.() || [], x, z);
      if (rr) return { kind: 'roof', id: rr.id };
    }
    return null;
  }
  /** the roofs of the open roof floor as dashed outlines with their name (#255); the selected one stands out */
  function roofOutlines(f, sel) {
    if (f.kind !== 'roof') return '';
    return (ctx.roofRects?.() || []).map((r) => {
      const b = r.box, on = sel?.kind === 'roof' && sel.id === r.id;
      const poly = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]];
      return `<polygon points="${pts(poly)}" fill="${on ? 'rgba(232,120,90,.18)' : 'rgba(200,90,60,.06)'}" stroke="${on ? C.accent : '#e0785a'}" stroke-width="${on ? 3 : 2}" stroke-dasharray="9 5" pointer-events="none" data-roof="${r.id}"/>`
        + `<text x="${sx((b.x0 + b.x1) / 2)}" y="${sy(b.z0) + 16}" text-anchor="middle" font-size="12" fill="#e0785a" pointer-events="none">${esc(r.name || ctx.t('prop.roof'))}</text>`;
    }).join('');
  }
  /* handles of the selected wall (end points) or room (corners) */
  function handleAt(px, py) {
    const sel = ctx.getSelection();
    if (!sel || ctx.isItemLocked?.(sel.kind, sel.id)) return null;
    const f = floor();
    const near = (p) => Math.hypot(sx(p[0]) - px, sy(p[1]) - py) <= 11;
    if (sel.kind === 'roof') {                                   // a roof (#259): its corners and the middle of its sides change its size
      const r = (ctx.roofRects?.() || []).find((q) => q.id === sel.id);
      const hd = r && roofHandles(r.box).find((q) => near([q.x, q.z]));
      return hd ? { type: 'roof-size', id: r.id, which: hd.which, start: { ...r.box } } : null;
    }
    if (sel.kind === 'stair') {                                  // size handles: end of the run (length) and its side (width / radius)
      const st = (f.stairs || []).find((q) => q.id === sel.id);
      if (st) {
        const hs = stairHandles(st, ctx.floorH());
        for (const which of ['len', 'wid']) { if (hs[which] && near(toWorld(st, hs[which][0], hs[which][1]))) return { type: 'stair-size', which, st }; }
      }
      return null;
    }
    if (sel.kind === 'device') {
      const d = f.devices.find((q) => q.id === sel.id);
      if (d?.type === 'ledring' && !d.locked) {                  // LED ring: drag the start / end of a section along the band
        for (const sc of ringSectionsWorld(d)) for (const end of [0, 1]) if (near(sc.ends[end])) return { type: 'ring-end', d, i: sc.i, end };
        return null;
      }
      if (d && d.type !== 'picture' && d.type !== 'ledring' && d.type !== 'kitchenrun' && !d.locked) {
        const hs = devHandles(d);
        for (const which of ['x', 'z']) if (near(hs[which])) return { type: 'dev-size', which, d };
      }
      return null;
    }
    if (sel.kind === 'wall') {
      const w = f.walls.find((q) => q.id === sel.id);
      if (w) { if (near(w.a)) return { type: 'wall-end', wall: w, end: 'a' }; if (near(w.b)) return { type: 'wall-end', wall: w, end: 'b' }; }
    } else if (POLY_KINDS.has(sel.kind)) {
      const r = polyList(f, sel.kind).find((q) => q.id === sel.id);
      if (r) { const i = r.points.findIndex(near); if (i >= 0) return { type: 'room-pt', room: r, i }; }
    }
    return null;
  }

  /* ---------- rendering ---------- */
  function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
  function scheduleRebuild() { if (!rebuildRaf) rebuildRaf = requestAnimationFrame(() => { rebuildRaf = 0; ctx.rebuild3d(); }); }

  function wallPoly(a, b, t, extA = 0, extB = 0) {
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, nx = -uz * t / 2, nz = ux * t / 2;
    const A = [a[0] - ux * extA, a[1] - uz * extA], B = [b[0] + ux * extB, b[1] + uz * extB];
    return [[A[0] + nx, A[1] + nz], [B[0] + nx, B[1] + nz], [B[0] - nx, B[1] - nz], [A[0] - nx, A[1] - nz]];
  }
  const pts = (arr) => arr.map((p) => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ');
  const isOn = (e) => !!e && ctx.isOn(e);

  /** a green dashed frame round everything that is selected with Shift + click (#211) */
  function multiOutlines(f, H3) {
    const items = ctx.multiItems?.() || [];
    if (!items.length) return '';
    const frame = (poly) => `<polygon points="${pts(poly)}" fill="rgba(125,255,154,.08)" stroke="#7dff9a" stroke-width="2.4" stroke-dasharray="6 3" pointer-events="none"/>`;
    return items.map((x) => {
      if (x.kind === 'device') {
        const d = f.devices.find((v) => v.id === x.id);
        if (!d) return '';
        const fo = footOf(d), w = fo.r ? 2 * fo.r : fo.w, dp = fo.r ? 2 * fo.r : fo.d, th = (-(d.rot || 0) * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
        return frame([[-w / 2, -dp / 2], [w / 2, -dp / 2], [w / 2, dp / 2], [-w / 2, dp / 2]].map(([lx, lz]) => [d.x + lx * c - lz * sn, d.z + lx * sn + lz * c]));
      }
      if (x.kind === 'wall') { const w = f.walls.find((v) => v.id === x.id); return w ? frame(wallPoly(w.a, w.b, (w.thickness || 0.2) + 0.08)) : ''; }
      if (x.kind === 'room' || x.kind === 'block' || x.kind === 'hole') { const q = polyList(f, x.kind).find((v) => v.id === x.id); return q ? frame(q.points) : ''; }
      if (x.kind === 'stair') { const st = (f.stairs || []).find((v) => v.id === x.id); return st ? frame(polyToWorld(st, stairLocal(st, H3).hole)) : ''; }
      if (x.kind === 'opening') {
        for (const w of f.walls) {
          const op = (w.openings || []).find((v) => v.id === x.id);
          if (!op) continue;
          const [ux, uz, L] = dirOf(w), k = op.pos / L, cx = w.a[0] + (w.b[0] - w.a[0]) * k, cz = w.a[1] + (w.b[1] - w.a[1]) * k, hw = op.width / 2, t2 = (w.thickness || 0.2) / 2 + 0.06;
          return frame([[cx - ux * hw - uz * t2, cz - uz * hw + ux * t2], [cx + ux * hw - uz * t2, cz + uz * hw + ux * t2], [cx + ux * hw + uz * t2, cz + uz * hw - ux * t2], [cx - ux * hw + uz * t2, cz - uz * hw - ux * t2]]);
        }
      }
      return '';
    }).join('');
  }

  function render() {
    if (!visible) return;
    const r = root.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const f = floor();
    if (!f) { svg.innerHTML = ''; return; }
    const sel = ctx.getSelection();
    const live = isLive();
    let o = '';

    /* background image (edit mode only): a scan / photo of the floor plan to trace */
    const bg = f.bg;
    if (bg && bg.img && !bg.hidden && !live) {
      const bw = bg.w * s, bh = bw * (bg.ar || 1);
      o += `<image href="api/backgrounds/${esc(bg.img)}" x="${sx(bg.x).toFixed(1)}" y="${sy(bg.z).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" opacity="${bg.op ?? 0.5}" preserveAspectRatio="none" transform="rotate(${bg.rot || 0} ${sx(bg.x).toFixed(1)} ${sy(bg.z).toFixed(1)})" style="pointer-events:none"/>`;
    }

    /* grid */
    const step = s >= 40 ? 0.5 : s >= 18 ? 1 : 5, minor = s >= 90 ? 0.1 : null;
    const D = rot ? (Math.hypot(W, H) - Math.min(W, H)) / 2 + 10 : 0;      // a turned plan shows more than the screen rectangle
    const x0 = wx(-D), x1 = wx(W + D), z0 = wz(-D), z1 = wz(H + D);
    let g = '';
    const lines = (stp, col) => {
      let d = '';
      for (let x = Math.floor(x0 / stp) * stp; x <= x1; x += stp) d += `M${sx(x).toFixed(1)} ${-D}V${H + D}`;
      for (let z = Math.floor(z0 / stp) * stp; z <= z1; z += stp) d += `M${-D} ${sy(z).toFixed(1)}H${W + D}`;
      return `<path d="${d}" stroke="${col}" stroke-width="1" fill="none"/>`;
    };
    if (minor) g += lines(minor, 'rgba(160,215,255,.05)');
    g += lines(step, C.grid1);
    g += lines(step >= 5 ? 10 : step >= 1 ? 5 : 1, C.grid2);
    o += g;

    const plotB = ctx.layout().plot?.boundary;                 // the plot (Grundstück), dashed
    if (plotB?.length >= 3) o += `<polygon points="${pts(plotB)}" fill="rgba(60,255,176,.05)" stroke="rgba(60,255,176,.7)" stroke-width="1.5" stroke-dasharray="8 5"/>`;

    /* placeholder blocks: solid masses that stand in for floors you do not draw */
    const idxB = ctx.getFloorIdx(), H3 = ctx.floorH();
    ctx.layout().floors.forEach((fl, i) => {
      if (i > idxB) return;
      (fl.blocks || []).forEach((b) => {
        const cur = i === idxB, isSel = cur && sel?.kind === 'block' && sel.id === b.id;
        o += `<polygon points="${pts(b.points)}" fill="${cur ? 'rgba(110,150,230,.22)' : 'url(#hatch)'}" stroke="${isSel ? C.sel : 'rgba(150,190,255,.6)'}" stroke-width="${isSel ? 2 : 1.2}"${cur ? '' : ' stroke-dasharray="6 4"'}/>`;
        if (b.name && s >= 20) {
          const c = b.points.reduce((a, p) => [a[0] + p[0] / b.points.length, a[1] + p[1] / b.points.length], [0, 0]);
          o += `<text x="${sx(c[0])}" y="${sy(c[1])}" text-anchor="middle" font-size="12" fill="rgba(190,215,255,.8)" stroke="rgba(3,21,71,.85)" stroke-width="3" paint-order="stroke">${esc(b.name)}</text>`;
        }
      });
    });

    const idx = ctx.getFloorIdx();
    (ctx.ghostFloors ? ctx.ghostFloors() : []).forEach(({ i, col }) => {          // lowest floor first, so the nearer ones lie on top
      ctx.layout().floors[i].walls.forEach((w) => { o += `<polygon points="${pts(wallPoly(w.a, w.b, w.thickness, w.thickness / 2, w.thickness / 2))}" fill="${col}" fill-opacity=".2" stroke="${col}" stroke-opacity=".75" stroke-width="1" style="pointer-events:none"/>`; });
    });

    /* rooms */
    f.rooms.forEach((rm) => {
      const isSel = sel?.kind === 'room' && sel.id === rm.id;
      const heat = ctx.roomHeat ? ctx.roomHeat(rm, f) : null;
      const fill = heat || rm.color || '#8a7f70';
      o += `<polygon points="${pts(rm.points)}" fill="${fill}" fill-opacity="${heat ? 0.45 : 0.26}" stroke="${isSel ? C.sel : 'rgba(255,255,255,.25)'}" stroke-width="${isSel ? 2 : 1}" stroke-dasharray="${isSel ? '' : '4 4'}"/>`;
    });

    /* floor openings (Bodenöffnungen): cut out of this floor, hatched with an orange dashed rim */
    (f.holes || []).forEach((h) => {
      const isSel = sel?.kind === 'hole' && sel.id === h.id;
      o += `<polygon points="${pts(h.points)}" fill="url(#hatch)" stroke="${isSel ? C.sel : '#ff9f43'}" stroke-width="${isSel ? 2.2 : 1.6}" stroke-dasharray="7 4"/>`;
    });

    /* stairs: own stairs, plus the stairs of the floor below that arrive here (dashed) */
    const drawStair = (st, ghost, isSel) => {
      const g = stairLocal(st, H3);
      const col = isSel ? C.sel : ghost ? 'rgba(150,190,255,.6)' : C.accent;
      let out = '';
      g.treads.filter((t) => !t.storey).forEach((t) => { out += `<polygon points="${pts(polyToWorld(st, t.poly))}" fill="${ghost ? 'none' : 'rgba(35,224,255,.10)'}" stroke="${col}" stroke-width="1"${ghost ? ' stroke-dasharray="3 3"' : ''}/>`; });
      const ar = g.arrow.map(([lx, lz]) => toWorld(st, lx, lz));
      out += `<polyline points="${pts(ar)}" fill="none" stroke="${col}" stroke-width="1.6"/>`;
      const a = ar[ar.length - 2], b = ar[ar.length - 1];
      const ang = Math.atan2(sy(b[1]) - sy(a[1]), sx(b[0]) - sx(a[0])), hx = sx(b[0]), hy = sy(b[1]);
      out += `<polygon points="${hx},${hy} ${hx - 9 * Math.cos(ang - 0.4)},${hy - 9 * Math.sin(ang - 0.4)} ${hx - 9 * Math.cos(ang + 0.4)},${hy - 9 * Math.sin(ang + 0.4)}" fill="${col}"/>`;
      out += `<circle cx="${sx(st.x)}" cy="${sy(st.z)}" r="3.5" fill="${col}"/>`;
      return out;
    };
    const holeOf = (st) => `<polygon points="${pts(polyToWorld(st, stairLocal(st, H3).hole))}" fill="rgba(255,138,42,.12)" stroke="#ff8a2a" stroke-width="1.2" stroke-dasharray="5 3"/>`;
    arrivingStairs(ctx.layout().floors, idxB).forEach(({ st }) => { o += holeOf(st) + drawStair(st, true, false); });   // from lower floors, also over several floors
    (f.stairs || []).forEach((st) => {
      if (st.dir === 'down') o += holeOf(st);
      o += drawStair(st, false, sel?.kind === 'stair' && sel.id === st.id);
      if (st.name && s >= 30) o += `<text x="${sx(st.x)}" y="${sy(st.z) + 16}" text-anchor="middle" font-size="10" fill="${C.text}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${esc(st.name)}</text>`;
    });

    /* walls (split around openings) */
    f.walls.forEach((w) => {
      const [ux, uz, L] = dirOf(w);
      const ops = [...(w.openings || [])].sort((a, b) => a.pos - b.pos);
      let cur = 0;
      const t = w.thickness;
      const isSel = sel?.kind === 'wall' && sel.id === w.id;
      const col = isSel ? C.sel : C.wall;
      const seg = (from, to, extA, extB) => {
        if (to - from < 1e-3) return;
        const a = [w.a[0] + ux * from, w.a[1] + uz * from], b = [w.a[0] + ux * to, w.a[1] + uz * to];
        o += `<polygon points="${pts(wallPoly(a, b, t, extA, extB))}" fill="${col}" stroke="${col}" stroke-width="0.5"/>`;
      };
      ops.forEach((op, i) => { seg(cur, op.pos - op.width / 2, i === 0 ? t / 2 : 0, 0); cur = op.pos + op.width / 2; });
      seg(cur, L, ops.length ? 0 : t / 2, t / 2);
      if (!ops.length) { /* solid wall: caps handled above (both ends extended) */ }
    });
    /* openings */
    f.walls.forEach((w) => {
      const [ux, uz] = dirOf(w);
      const nx = -uz, nz = ux;
      (w.openings || []).forEach((op) => {
        const cx = w.a[0] + ux * op.pos, cz = w.a[1] + uz * op.pos, hw = op.width / 2;
        const isSel = sel?.kind === 'opening' && sel.id === op.id;
        const open = isOn(op.entity);
        const col = isSel ? C.sel : open ? C.warn : C.line;
        const P = (u, n) => [sx(cx + ux * u + nx * n), sy(cz + uz * u + nz * n)];
        const t = w.thickness / 2;
        const jamb = [P(-hw, -t), P(-hw, t), P(hw, -t), P(hw, t)];
        o += `<path d="M${jamb[0]}L${jamb[1]}M${jamb[2]}L${jamb[3]}" stroke="${col}" stroke-width="2" fill="none"/>`;
        if (op.type === 'door' && (op.style === 'open' || op.style === 'gap' || op.style === 'garage' || op.style === 'sliding')) {
          const q = op.style === 'sliding' ? t * .45 : 0;
          if (op.style === 'sliding') o += `<path d="M${P(-hw, -q)}L${P(0.08, -q)}M${P(-0.08, q)}L${P(hw, q)}" stroke="${col}" stroke-width="2.4" fill="none"/>`;
          else o += `<path d="M${P(-hw, 0)}L${P(hw, 0)}" stroke="${col}" stroke-width="1" stroke-dasharray="4 4" fill="none" opacity=".7"/>`;
        } else if (op.type === 'door' && op.style === 'double') {
          [-1, 1].forEach((sgn) => {                              // two leaves, hinged at both sides
            const lw = op.width / 2, hingeU = sgn * hw, closedU = 0;
            const hinge = P(hingeU, 0), closed = P(closedU, 0), leaf = P(hingeU, op.inv ? -lw : lw);
            const v0 = [leaf[0] - hinge[0], leaf[1] - hinge[1]], v1 = [closed[0] - hinge[0], closed[1] - hinge[1]];
            const sweep = v0[0] * v1[1] - v0[1] * v1[0] > 0 ? 1 : 0, R = lw * s;
            o += `<path d="M${hinge}L${leaf}" stroke="${col}" stroke-width="2.5" fill="none"/>`;
            o += `<path d="M${leaf}A${R} ${R} 0 0 ${sweep} ${closed}" stroke="${col}" stroke-width="1" stroke-dasharray="3 3" fill="none" opacity=".8"/>`;
          });
        } else if (op.type === 'door') {
          const hu = op.flip ? hw : -hw, closed = P(-hu, 0), hinge = P(hu, 0);
          const leaf = P(hu, op.inv ? -op.width : op.width);
          const v0 = [leaf[0] - hinge[0], leaf[1] - hinge[1]], v1 = [closed[0] - hinge[0], closed[1] - hinge[1]];
          const sweep = v0[0] * v1[1] - v0[1] * v1[0] > 0 ? 1 : 0;
          const R = op.width * s;
          o += `<path d="M${hinge}L${leaf}" stroke="${col}" stroke-width="2.5" fill="none"/>`;
          o += `<path d="M${leaf}A${R} ${R} 0 0 ${sweep} ${closed}" stroke="${col}" stroke-width="1" stroke-dasharray="3 3" fill="none" opacity=".8"/>`;
        } else {
          const a = P(-hw, 0), b = P(hw, 0), a1 = P(-hw, -t * .5), b1 = P(hw, -t * .5), a2 = P(-hw, t * .5), b2 = P(hw, t * .5);
          o += `<path d="M${a1}L${b1}M${a2}L${b2}" stroke="${col}" stroke-width="1.6" fill="none"/><path d="M${a}L${b}" stroke="${col}" stroke-width="1" opacity=".7"/>`;
        }
        const hit = `M${P(-hw, -t - 0.15)}L${P(hw, -t - 0.15)}L${P(hw, t + 0.15)}L${P(-hw, t + 0.15)}Z`;
        if (isSel) o += `<path d="${hit}" fill="rgba(255,176,74,.12)" stroke="${C.sel}" stroke-dasharray="4 3"/>`;
        if (live && op.entity) { const p = P(0, -t - 0.35); o += `<text x="${p[0]}" y="${p[1]}" fill="${open ? C.warn : C.text}" font-size="10" text-anchor="middle">${esc(ctx.openText(op.entity))}</text>`; }
      });
    });

    /* wall dimensions */
    if (s >= 28) {
      f.walls.forEach((w) => {
        const [ux, uz, L] = dirOf(w);
        if (L < 0.5) return;
        const nx = -uz, nz = ux;
        const mx = (w.a[0] + w.b[0]) / 2, mz = (w.a[1] + w.b[1]) / 2, off = w.thickness / 2 + 11 / s;
        const px = sx(mx + nx * off), py = sy(mz + nz * off);
        const ang = readableAngle(Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]) * 180 / Math.PI, rot);
        const isSel = sel?.kind === 'wall' && sel.id === w.id;
        o += `<text transform="translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${ang.toFixed(1)})" text-anchor="middle" dominant-baseline="middle" font-size="${isSel ? 12 : 10}" fill="${isSel ? C.sel : 'rgba(210,235,255,.75)'}">${esc(ctx.fmtLen(L))}</text>`;
      });
    }

    /* cameras: the field of view as a wedge (red while the motion sensor reports movement) */
    f.devices.forEach((d) => {
      if (d.type !== 'camera' || (d.fov ?? 90) <= 0) return;
      const fov = Math.max(10, Math.min(180, d.fov ?? 90)), range = Math.max(0.5, d.range ?? 4), r = (d.rot || 0) * Math.PI / 180, half = fov * Math.PI / 360, n = Math.max(6, Math.round(fov / 6));
      let path = `M${sx(d.x).toFixed(1)},${sy(d.z).toFixed(1)}`;
      for (let i = 0; i <= n; i++) { const a = r - half + (2 * half * i) / n; path += `L${sx(d.x + Math.sin(a) * range).toFixed(1)},${sy(d.z + Math.cos(a) * range).toFixed(1)}`; }
      const motion = !!d.motionEntity && isOn(d.motionEntity), col = motion ? '#ff3a3a' : C.accent;
      o += `<path d="${path}Z" fill="${col}" fill-opacity="${motion ? 0.3 : 0.13}" stroke="${col}" stroke-opacity=".6" stroke-width="1" style="pointer-events:none"/>`;
    });

    /* devices */
    const devs = [...f.devices].sort((a, b) => (FLAT.has(a.type) ? -1 : 0) - (FLAT.has(b.type) ? -1 : 0));
    devs.forEach((d) => {
      if (ctx.powerMode?.() && !ctx.isPowerType(d.type)) return;      // the power editor shows only the power things
      if (d.type === 'ledring') { o += drawRing(d, (sel?.kind === 'device' && sel.id === d.id), live); return; }
      if (d.type === 'kitchenrun') {                                   // the modules of the run, each one as its own box
        const ksel = (sel?.kind === 'device' && sel.id === d.id), kcol = ksel ? C.sel : C.accent, kon = d.entity && isOn(d.entity);
        const kk = d.scale || 1, kl = kitchenLayout(d), kfill = { sink: 'rgba(90,170,255,.28)', stove: kon ? 'rgba(255,170,60,.5)' : 'rgba(255,110,80,.25)', fridge: 'rgba(210,235,255,.3)', dish: 'rgba(170,200,255,.22)', gap: 'rgba(255,255,255,.04)' };
        o += `<g transform="translate(${sx(d.x).toFixed(1)},${sy(d.z).toFixed(1)}) rotate(${-(d.rot || 0)})">`;
        kl.cells.forEach((c) => {
          const ex = (Math.abs(Math.cos(c.ang)) * c.w + Math.abs(Math.sin(c.ang)) * c.d) * kk * s, ez = (Math.abs(Math.sin(c.ang)) * c.w + Math.abs(Math.cos(c.ang)) * c.d) * kk * s;
          o += `<rect x="${(c.cx * kk * s - ex / 2).toFixed(1)}" y="${(c.cz * kk * s - ez / 2).toFixed(1)}" width="${ex.toFixed(1)}" height="${ez.toFixed(1)}" fill="${kfill[c.type] || 'rgba(35,224,255,.14)'}" stroke="${kcol}" stroke-width="${ksel ? 1.8 : 1.1}"/>`;
        });
        o += '</g>';
        if ((d.name || d.entity) && s >= 36) o += `<text x="${sx(d.x)}" y="${sy(d.z) + 4}" text-anchor="middle" font-size="10" fill="${C.text}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${esc(d.name || '')}</text>`;
        return;
      }
      const fo = footOf(d);
      const isSel = (sel?.kind === 'device' && sel.id === d.id);
      const st = d.entity ? ctx.states()[d.entity] : null;
      const on = d.entity && isOn(d.entity);
      let fill = 'rgba(35,224,255,.14)', stroke = isSel ? C.sel : C.accent;
      const isLight = /^(light|switch)\./.test(d.entity || '');
      if (on && isLight) {
        const c = Array.isArray(st?.rgb) ? st.rgb : [255, 214, 120];
        fill = `rgba(${c[0]},${c[1]},${c[2]},.55)`;
      } else if (on) fill = 'rgba(80,255,170,.22)';
      const rot = -(d.rot || 0);
      const cx = sx(d.x), cy = sy(d.z);
      o += `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${rot})">`;
      if (on && isLight) o += `<circle r="${(fo.r || Math.max(fo.w, fo.d) / 2) * s * 2.6}" fill="url(#glow)" opacity=".7"/>`;
      if (fo.r) o += `<circle r="${fo.r * s}" fill="${fill}" stroke="${stroke}" stroke-width="${isSel ? 2.2 : 1.4}"/>`;
      else {
        const w = fo.w * s, h = fo.d * s;
        o += `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(4, h / 4)}" fill="${fill}" stroke="${stroke}" stroke-width="${isSel ? 2.2 : 1.4}"/>`;
        if (h > 8 && !FLAT.has(d.type)) o += `<line x1="${-w / 2 + 3}" y1="${h / 2 - 3}" x2="${w / 2 - 3}" y2="${h / 2 - 3}" stroke="${stroke}" stroke-width="1" opacity=".55"/>`;   // front edge
      }
      o += '</g>';
      if (d.type === 'bridge') {                                       // which end is the far one (#222): an arrow towards it, the height difference next to it
        const bs = bridgeSize(d);
        if (bs.rise || isSel) {
          const hl = (bs.len * (d.scale || 1) * (d.sx || 1) * s) / 2;
          o += `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${rot})" pointer-events="none"><line x1="${(-hl + 6).toFixed(1)}" y1="0" x2="${(hl - 12).toFixed(1)}" y2="0" stroke="#c38cff" stroke-width="2"/><polygon points="${(hl - 3).toFixed(1)},0 ${(hl - 13).toFixed(1)},-5 ${(hl - 13).toFixed(1)},5" fill="#c38cff"/></g>`;
          if (bs.rise) {
            const th = (-(d.rot || 0) * Math.PI) / 180, ex = d.x + (hl / s) * Math.cos(th), ez = d.z + (hl / s) * Math.sin(th);
            o += `<text x="${sx(ex).toFixed(1)}" y="${(sy(ez) - 10).toFixed(1)}" text-anchor="middle" font-size="11" fill="#e2c8ff" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${bs.rise > 0 ? '+' : '−'}${esc(ctx.fmtLen(Math.abs(bs.rise)))}</text>`;
          }
        }
      }
      const gl = GLYPH[d.type];
      if (gl && s >= 20) o += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${Math.max(9, Math.min(18, (fo.r ? fo.r * s * 1.4 : Math.min(fo.w, fo.d) * s * .6)))}" fill="${on ? '#fff' : C.accent}">${gl}</text>`;
      if (!FLAT.has(d.type) && (d.name || d.entity) && (s >= 48 || (live && s >= 34 && st && (st.unit || d.entity.startsWith('sensor.'))))) {
        const off = (fo.r || Math.max(fo.w, fo.d) / 2) * s + 10;
        const label = live && st ? `${d.name || ''}${st.unit || /^(sensor)\./.test(d.entity) ? ' · ' + ctx.stateText(d.entity) : ''}` : d.name || '';
        o += `<text x="${cx}" y="${cy + Math.min(off, 40)}" text-anchor="middle" font-size="10" fill="${C.text}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${esc(label)}</text>`;
      }
      if (!live && d.entity && s >= 34) o += `<circle cx="${cx + (fo.r || fo.w / 2) * s}" cy="${cy - (fo.r || fo.d / 2) * s}" r="3" fill="${on ? '#5dff9d' : 'rgba(255,255,255,.4)'}"/>`;
    });

    /* room labels on top */
    f.rooms.forEach((rm) => {
      if (!rm.name) return;
      const c = rm.points.reduce((a, p) => [a[0] + p[0] / rm.points.length, a[1] + p[1] / rm.points.length], [0, 0]);
      const area = ctx.area(rm.points);
      o += `<text x="${sx(c[0])}" y="${sy(c[1])}" text-anchor="middle" font-size="14" font-weight="700" fill="${C.text}" stroke="rgba(3,21,71,.85)" stroke-width="4" paint-order="stroke">${esc(rm.name)}</text>`;
      o += `<text x="${sx(c[0])}" y="${sy(c[1]) + 15}" text-anchor="middle" font-size="11" fill="rgba(210,235,255,.85)" stroke="rgba(3,21,71,.85)" stroke-width="3" paint-order="stroke">${esc(area)}</text>`;
    });

    /* selection handles */
    if (!live && sel) {
      const hnd = (p, fill = '#fff') => `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="6" fill="${fill}" stroke="${C.sel}" stroke-width="2"/>`;
      if (sel.kind === 'wall') { const w = f.walls.find((q) => q.id === sel.id); if (w) o += hnd(w.a) + hnd(w.b); }
      if (sel.kind === 'device') {
        const d = f.devices.find((q) => q.id === sel.id);
        if (d && d.type !== 'picture' && d.type !== 'ledring' && d.type !== 'kitchenrun' && !d.locked) { const hs = devHandles(d); ['x', 'z'].forEach((k) => { o += `<rect x="${sx(hs[k][0]) - 6}" y="${sy(hs[k][1]) - 6}" width="12" height="12" rx="2" fill="#fff" stroke="${C.sel}" stroke-width="2"/>`; }); }
      }
      if (sel.kind === 'stair') {
        const st = (f.stairs || []).find((q) => q.id === sel.id), hs = st && stairHandles(st, H3);
        if (st) ['len', 'wid'].forEach((k) => { if (hs[k]) { const p = toWorld(st, hs[k][0], hs[k][1]); o += `<rect x="${sx(p[0]) - 6}" y="${sy(p[1]) - 6}" width="12" height="12" rx="2" fill="#fff" stroke="${C.sel}" stroke-width="2"/>`; } });
      }
      if (POLY_KINDS.has(sel.kind)) { const rm = polyList(f, sel.kind).find((q) => q.id === sel.id); if (rm) rm.points.forEach((p) => { o += hnd(p); }); }
      if (sel.kind === 'roof') {                                 // the size handles of a roof (#259)
        const r = (ctx.roofRects?.() || []).find((q) => q.id === sel.id);
        if (r) roofHandles(r.box).forEach((q) => { o += `<rect x="${sx(q.x) - 6}" y="${sy(q.z) - 6}" width="12" height="12" rx="2" fill="#fff" stroke="${C.accent}" stroke-width="2" data-roofh="${q.which}"/>`; });
      }
    }

    /* power cables (#136): amber lines between power devices, along the floor like the real cable; a cable to another floor ends in an arrow */
    if (!live && ctx.showCables?.()) {
      const byId = new Map(); ctx.allDevices?.().forEach(({ d, fi }) => byId.set(d.id, { d, fi }));
      const here = ctx.floorIndex?.();
      f.devices.forEach((d) => ctx.cablesOf(d).forEach((c) => {
        const tg = byId.get(c.to);
        if (!tg) return;
        const sel2 = (sel?.kind === 'device' && (sel.id === d.id || sel.id === c.to)) || (sel?.kind === 'cable' && sel.id === c.id);
        const col = sel2 ? C.sel : ctx.cableColor(d, c);
        if (tg.fi !== here) {
          const up = tg.fi > here, p = [sx(d.x), sy(d.z)];
          o += `<path d="M${p[0]} ${p[1]}l0 ${up ? -18 : 18}" stroke="${col}" stroke-width="2" fill="none" stroke-dasharray="3 3"/><text x="${p[0] + 4}" y="${p[1] + (up ? -20 : 28)}" font-size="10" fill="${col}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${up ? '↑' : '↓'} ${esc(ctx.floorName?.(tg.fi) || '')}</text>`;
          return;
        }
        const a = [sx(d.x), sy(d.z)], b = [sx(tg.d.x), sy(tg.d.z)];
        const pts = cableLine(a, b, c.route);
        o += `<polyline points="${pts.map((q) => q.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round" ${c.route === 'air' ? 'stroke-dasharray="6 4"' : ''} opacity=".9"/>`;
      }));
    }

    /* hover + drafts */
    const tool = ctx.getTool();
    if (!live && tool === 'opening' && opPreview) {
      const { wall, pos, valid, def } = opPreview;
      const [ux, uz] = dirOf(wall);
      const cx = wall.a[0] + ux * pos, cz = wall.a[1] + uz * pos, hw = def.width / 2, t = wall.thickness / 2 + 0.1;
      const P = (u, n) => `${sx(cx + ux * u - uz * n)},${sy(cz + uz * u + ux * n)}`;
      o += `<polygon points="${P(-hw, -t)} ${P(hw, -t)} ${P(hw, t)} ${P(-hw, t)}" fill="${valid ? 'rgba(35,224,255,.35)' : 'rgba(255,74,61,.4)'}" stroke="${valid ? C.accent : C.warn}"/>`;
    }
    if (!live && tool === 'stairs' && ctx.getStairTemplate().type === 'wall') {          // a wall stair: the path is clicked along the wall
      const clicks = cursor ? [...drawPts, cursor] : drawPts, draft = ctx.wallStairDraft(clicks);
      if (draft) o += holeOf(draft) + drawStair(draft, false, true);
      drawPts.forEach((p) => { o += `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="4" fill="${C.accent}"/>`; });
    } else if (!live && tool === 'stairs' && cursor) {
      const tpl = { ...ctx.getStairTemplate(), x: cursor[0], z: cursor[1] };
      o += drawStair(tpl, false, true) + (tpl.dir === 'down' ? holeOf(tpl) : '');
    }
    if (!live && (tool === 'wall' || tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole') && drawPts.length) {
      const pl = cursor ? [...drawPts, cursor] : drawPts;
      o += `<polyline points="${pts(pl)}" fill="none" stroke="${C.accent}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
      if ((tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole') && drawPts.length >= 2) o += `<polygon points="${pts(pl)}" fill="rgba(35,224,255,.12)" stroke="none"/>`;
      drawPts.forEach((p) => { o += `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="4" fill="${C.accent}"/>`; });
      if (cursor) {
        const last = drawPts[drawPts.length - 1], L = Math.hypot(cursor[0] - last[0], cursor[1] - last[1]);
        o += `<text x="${sx((cursor[0] + last[0]) / 2)}" y="${sy((cursor[1] + last[1]) / 2) - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.accent}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${esc(ctx.fmtLen(L))}</text>`;
      }
    }
    if (!live && cursor && (tool === 'wall' || tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole' || tool === 'device' || tool === 'stairs')) o += `<circle cx="${sx(cursor[0])}" cy="${sy(cursor[1])}" r="5" fill="none" stroke="${C.accent}" stroke-width="1.5"/>`;

    if (!live && bgMode === 'move' && bg?.img && !bg.hidden) {   // frame and corner handles of the template
      const cs = bgCorners(bg);
      o += `<polygon points="${pts(cs)}" fill="none" stroke="#ff4fd8" stroke-width="1.5" stroke-dasharray="6 4"/>`;
      cs.forEach((p) => { o += `<rect x="${sx(p[0]) - 6}" y="${sy(p[1]) - 6}" width="12" height="12" rx="2" fill="#fff" stroke="#ff4fd8" stroke-width="2"/>`; });
    }
    if (!live && bgMode === 'calib' && calibPts.length) {
      const pl = calibCur && calibPts.length === 1 ? [...calibPts, calibCur] : calibPts;
      o += `<polyline points="${pts(pl)}" fill="none" stroke="#ff4fd8" stroke-width="2" stroke-dasharray="6 4"/>`;
      pl.forEach((p) => { o += `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="5" fill="#ff4fd8" stroke="#fff" stroke-width="1.5"/>`; });
    }

    const nbSegs = ctx.neighborOutlines?.() || [];                // the neighbour house on this level (#220), dashed
    if (nbSegs.length) o += `<path d="${nbSegs.map(([a, b]) => `M${sx(a[0]).toFixed(1)} ${sy(a[1]).toFixed(1)}L${sx(b[0]).toFixed(1)} ${sy(b[1]).toFixed(1)}`).join('')}" stroke="#c38cff" stroke-width="2" stroke-dasharray="7 5" fill="none" pointer-events="none"/>`;
    if (!live) o += roofOutlines(f, sel);
    o += multiOutlines(f, H3);
    if (drag?.type === 'multi' && drag.b) {                           // the frame being drawn (#247)
      const [a, b] = [drag.a, drag.b];
      o += `<rect x="${sx(Math.min(a[0], b[0]))}" y="${sy(Math.min(a[1], b[1]))}" width="${Math.abs(b[0] - a[0]) * s}" height="${Math.abs(b[1] - a[1]) * s}" fill="rgba(125,255,154,.10)" stroke="#7dff9a" stroke-width="1.5" stroke-dasharray="5 3" pointer-events="none"/>`;
    }
    svg.innerHTML = `<defs><pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="rgba(110,150,230,.10)"/><line x1="0" y1="0" x2="0" y2="9" stroke="rgba(150,190,255,.35)" stroke-width="2"/></pattern><radialGradient id="glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>${rot ? `<g transform="rotate(${rot.toFixed(2)} ${W / 2} ${H / 2})">${o}</g>` : o}`;
    if (rot) svg.querySelectorAll('text:not([transform])').forEach((el) => {     // labels stay upright in a turned plan
      el.setAttribute('transform', `rotate(${(-rot).toFixed(2)} ${el.getAttribute('x') || 0} ${el.getAttribute('y') || 0})`);
    });
  }

  /** LED ring: one line per section, lit sections in their light's colour, small dots at the corners */
  function drawRing(d, isSel, live) {
    let r = '';
    const ln = (a, b) => `x1="${sx(a[0]).toFixed(1)}" y1="${sy(a[1]).toFixed(1)}" x2="${sx(b[0]).toFixed(1)}" y2="${sy(b[1]).toFixed(1)}"`;
    const path = pathWorld(d);
    path.forEach((e) => { r += `<line ${ln(e.a, e.b)} stroke="${isSel ? C.sel : C.accent}" stroke-width="1" stroke-dasharray="3 4" opacity=".55"/>`; });   // where the band runs (gaps have no LEDs)
    const secs = ringSectionsWorld(d);
    secs.forEach((sc) => {
      const ent = segEntity(d, sc.i), on = ent && isOn(ent), st = ent ? ctx.states()[ent] : null;
      const c = on ? (Array.isArray(st?.rgb) ? st.rgb : [255, 214, 120]) : null;
      const col = c ? `rgb(${c[0]},${c[1]},${c[2]})` : isSel ? C.sel : C.accent;
      sc.pieces.forEach(([a, b]) => {
        if (c) r += `<line ${ln(a, b)} stroke="${col}" stroke-width="10" stroke-linecap="round" opacity=".35"/>`;
        r += `<line ${ln(a, b)} stroke="${col}" stroke-width="${isSel ? 4 : 3}" stroke-linecap="butt"${c || ent ? '' : ' stroke-dasharray="5 4"'}/>`;
      });
      if (!live && s >= 40) r += `<text x="${sx(sc.mid[0])}" y="${sy(sc.mid[1]) - 6}" text-anchor="middle" font-size="9" fill="${C.text}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">${sc.i + 1}</text>`;
    });
    if (isSel && !live) {
      if (path[0]) r += `<text x="${sx(path[0].a[0]) + 6}" y="${sy(path[0].a[1]) + 12}" font-size="9" fill="${C.sel}" stroke="rgba(3,21,71,.9)" stroke-width="3" paint-order="stroke">0 m</text>`;
      if (!d.locked) secs.forEach((sc) => sc.ends.forEach((p) => { r += `<rect x="${sx(p[0]) - 4}" y="${sy(p[1]) - 4}" width="8" height="8" rx="1.5" fill="#fff" stroke="${C.sel}" stroke-width="1.5"/>`; }));
    }
    return r;
  }

  /* ---------- view ---------- */
  function fit() {
    const r = root.getBoundingClientRect();
    W = r.width; H = r.height;
    const f = floor();
    if (!f || !W || !H) return;
    const p = [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((q) => q.points), ...(f.blocks || []).flatMap((q) => q.points), ...(f.holes || []).flatMap((q) => q.points), ...f.devices.map((d) => [d.x, d.z]), ...(f.stairs || []).map((d) => [d.x, d.z]),
      ...(f.kind === 'roof' ? (ctx.roofRects?.() || []).flatMap(({ box: b }) => [[b.x0, b.z0], [b.x1, b.z1]]) : [])];   // a roof floor: its roofs (#255)
    if (!p.length && f.bg?.img && !f.bg.hidden && !isLive()) p.push([f.bg.x, f.bg.z], [f.bg.x + f.bg.w, f.bg.z + f.bg.w * (f.bg.ar || 1)]);   // empty floor: frame the template
    if (!p.length) { s = 60; tx = W / 2 - 3 * s; ty = H / 2 - 2 * s; render(); return; }
    const xs = p.map((q) => q[0]), zs = p.map((q) => q[1]);
    const [a0, a1, b0, b1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    if (rot) {                                                    // a turned plan (#212): fit what it looks like turned, centred (it turns round the middle)
      const tp = p.map((q) => rotPoint(q, [0, 0], rot)), us = tp.map((q) => q[0]), vs = tp.map((q) => q[1]);
      const pw = Math.max(Math.max(...us) - Math.min(...us), 2), ph = Math.max(Math.max(...vs) - Math.min(...vs), 2);
      s = Math.max(12, Math.min(160, Math.min((W - 120) / pw, (H - 200) / ph)));
      tx = W / 2 - ((a0 + a1) / 2) * s; ty = H / 2 - ((b0 + b1) / 2) * s;
      render(); return;
    }
    const padX = 60, padTop = 130, padBottom = 70;
    s = Math.max(12, Math.min(160, Math.min((W - 2 * padX) / Math.max(a1 - a0, 2), (H - padTop - padBottom) / Math.max(b1 - b0, 2))));
    tx = (W - (a1 - a0) * s) / 2 - a0 * s;
    ty = padTop + ((H - padTop - padBottom) - (b1 - b0) * s) / 2 - b0 * s;
    render();
  }
  function zoomAt(px, py, k) {
    const ns = Math.max(8, Math.min(400, s * k));
    const wxp = wx(px), wzp = wz(py);
    s = ns; tx = px - wxp * s; ty = py - wzp * s;
    render();
  }

  /* ---------- pointer interaction ---------- */
  const local = (e) => { const r = root.getBoundingClientRect(), p = [e.clientX - r.left, e.clientY - r.top]; return rot ? rotPoint(p, [W / 2, H / 2], -rot) : p; };   // into the unturned plan
  const pointers = new Map();
  let pinch = null;

  function pickIfAllowed(x, z) {
    const h = pickAt(x, z);
    if (isLive() && h && h.kind === 'opening') {
      const o = ctx.findOpening(h.id);
      if (!o?.opening.entity) return null;
    }
    return h;
  }

  root.addEventListener('contextmenu', (e) => e.preventDefault());
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [px, py] = local(e);
    zoomAt(px, py, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  root.addEventListener('pointerdown', (e) => {
    const [px, py] = local(e);
    pointers.set(e.pointerId, [px, py]);
    root.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {                                   // pinch zoom
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s };
      drag = null;
      return;
    }
    const x = wx(px), z = wz(py);
    if (e.button === 1 || e.button === 2) { drag = { type: 'pan', px, py, tx, ty }; return; }
    if (e.button !== 0) return;
    const live = isLive();
    const tool = ctx.getTool();
    if (live) { drag = { type: 'tap', px, py, moved: false }; return; }
    if (bgMode === 'move' && floor()?.bg) {
      const b = floor().bg, cs = bgCorners(b);
      const ci = cs.findIndex((p) => Math.hypot(sx(p[0]) - px, sy(p[1]) - py) <= 12);
      if (ci >= 0) { drag = { type: 'bgscale', ci, opp: cs[(ci + 2) % 4], w0: b.w, px, py, moved: false }; return; }
      drag = { type: 'bgmove', px, py, ox: b.x, oz: b.z, sx0: x, sz0: z, moved: false };
      return;
    }
    if (bgMode === 'calib') { drag = { type: 'calib', px, py }; return; }

    if (tool === 'select') {
      const sel = ctx.getSelection();
      if ((e.shiftKey || e.ctrlKey || e.metaKey) && ctx.toggleMulti && !ctx.isLocked()) {   // Shift / Ctrl + click: several things at once (#211, #247)
        drag = { type: 'multi', px, py, a: [x, z], b: null, hit: pickAt(x, z) };             // ... or + drag: a frame round them
        return;
      }
      const hd = handleAt(px, py);
      if (hd) { drag = { ...startHandleDrag(hd), px, py }; return; }
      if (ctx.isLocked() && sel) {                               // locked: only the selection reacts
        const d0 = startDrag(sel, x, z, px, py, e);
        drag = d0 || { type: 'pan', px, py, tx, ty, locked: true };
        return;
      }
      const h = pickAt(x, z);
      if (h?.kind === 'roof') {                                       // a roof (#255): the first click selects it, a press on the selected roof drags it
        const was = sel?.kind === 'roof' && sel.id === h.id, r = was ? (ctx.roofRects?.() || []).find((q) => q.id === h.id) : null;
        if (!was) ctx.setSelection(h);
        drag = r ? { type: 'roof', id: h.id, start: { ...r.box }, sx: x, sz: z, moved: false, px, py } : { type: 'pan', px, py, tx, ty };
      } else if (h) {
        ctx.setSelection(h);
        drag = startDrag(h, x, z, px, py, e) || { type: 'pan', px, py, tx, ty };
      } else {
        drag = { type: 'pan', px, py, tx, ty, clear: true };
      }
    } else if (tool === 'erase') {
      drag = { type: 'erase', px, py };
    } else {
      drag = { type: 'tool', px, py, moved: false };
    }
  });

  let snapDone = false;
  function snapshotOnce() { if (!snapDone) { ctx.snapshot(); snapDone = true; } }

  function coincident(p, list) { return list.filter((q) => Math.abs(q[0] - p[0]) < 0.02 && Math.abs(q[1] - p[1]) < 0.02); }
  function allCornerRefs() {
    const f = floor();
    return [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...(f.blocks || []).flatMap((r) => r.points)];
  }
  function startHandleDrag(hd) {
    if (hd.type === 'dev-size') return { type: 'devsize', which: hd.which, d: hd.d, moved: false };
    if (hd.type === 'ring-end') return { type: 'ringend', d: hd.d, i: hd.i, end: hd.end, moved: false };
    if (hd.type === 'roof-size') return { type: 'roofsize', id: hd.id, which: hd.which, start: hd.start, moved: false };
    if (hd.type === 'stair-size') return { type: 'stairsize', which: hd.which, st: hd.st, moved: false };
    if (hd.type === 'wall-end') {
      const p = hd.wall[hd.end];
      const refs = coincident(p, allCornerRefs());
      return { type: 'points', refs: refs.map((q) => ({ q, ox: q[0], oz: q[1] })), start: [p[0], p[1]], wall: hd.wall, other: [...hd.wall[hd.end === 'a' ? 'b' : 'a']] };
    }
    return { type: 'points', refs: [{ q: hd.room.points[hd.i], ox: hd.room.points[hd.i][0], oz: hd.room.points[hd.i][1] }], start: [...hd.room.points[hd.i]], single: true };
  }
  function startDrag(h, x, z, px, py) {
    const f = floor();
    if (ctx.isItemLocked?.(h.kind, h.id)) return null;                  // locked: selectable, but not movable
    if (h.kind === 'device') {
      const d = f.devices.find((v) => v.id === h.id);
      return d ? { type: 'device', d, dx: d.x - x, dz: d.z - z, moved: false, px, py } : null;
    }
    if (h.kind === 'opening') {
      const fo = ctx.findOpening(h.id);
      return fo ? { type: 'opening', ...fo, moved: false, px, py } : null;
    }
    if (h.kind === 'wall') {
      const w = f.walls.find((q) => q.id === h.id);
      if (!w) return null;
      const all = allCornerRefs();
      const refs = [...new Set([...coincident(w.a, all), ...coincident(w.b, all)])];
      return { type: 'points', refs: refs.map((q) => ({ q, ox: q[0], oz: q[1] })), start: [x, z], moved: false, whole: true, px, py };
    }
    if (h.kind === 'stair') {
      const st = (f.stairs || []).find((q) => q.id === h.id);
      return st ? { type: 'stair', st, dx: st.x - x, dz: st.z - z, moved: false, px, py } : null;
    }
    if (POLY_KINDS.has(h.kind)) {
      const r = polyList(f, h.kind).find((q) => q.id === h.id);
      return r ? { type: 'points', refs: r.points.map((q) => ({ q, ox: q[0], oz: q[1] })), start: [x, z], moved: false, whole: true, px, py } : null;
    }
    return null;
  }

  root.addEventListener('pointermove', (e) => {
    const [px, py] = local(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [px, py]);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const ns = Math.max(8, Math.min(400, pinch.s * d / pinch.d));
      const wxp = wx(mx), wzp = wz(my);
      s = ns; tx = mx - wxp * s; ty = my - wzp * s;
      render();
      return;
    }
    shift = e.shiftKey;
    const x = wx(px), z = wz(py);
    const tool = ctx.getTool();

    if (drag) {
      const moved = Math.hypot(px - drag.px, py - drag.py) > 4;
      if (drag.type === 'pan') { tx = drag.tx + (px - drag.px); ty = drag.ty + (py - drag.py); render(); return; }
      if (drag.type === 'multi') { if (moved) { drag.b = [x, z]; render(); } return; }
      if (drag.type === 'devsize' && moved) {
        snapshotOnce();
        const d = drag.d, [lx, lz] = devLocal(d, x, z), b = baseFoot(d), k = d.scale || 1;
        const ext = Math.max(0.05, Math.round(2 * Math.abs(drag.which === 'x' ? lx : lz) * 20) / 20);   // 5 cm steps
        const v = Math.max(0.1, Math.min(10, ext / ((drag.which === 'x' ? b.w : b.d) * k)));
        const key = drag.which === 'x' ? 'sx' : 'sz';
        if (Math.abs(v - 1) < 0.01) delete d[key]; else d[key] = +v.toFixed(3);
        drag.moved = true; scheduleRebuild(); render();
        return;
      }
      if (drag.type === 'ringend' && moved) {
        snapshotOnce();
        const pos = Math.round(projectOnPath(drag.d, x, z) * 20) / 20;           // 5 cm steps along the band
        setRange(drag.d, drag.i, drag.end === 0 ? pos : null, drag.end === 1 ? pos : null);
        const sg = drag.d.segs[drag.i];
        ctx.setStatus(`${drag.i + 1}: ${ctx.fmtLen(sg.from)} – ${ctx.fmtLen(sg.to)} (${ctx.fmtLen(sg.to - sg.from)})`);
        drag.moved = true; scheduleRebuild(); render();
        return;
      }
      if (drag.type === 'stairsize' && moved) {
        snapshotOnce();
        const st = drag.st, [lx, lz] = toLocal(st, x, z), { T, n1 } = stairCounts(st, ctx.floorH());
        if (drag.which === 'len') st.tread = Math.max(MIN_TREAD, Math.min(MAX_TREAD, Math.round((lx / (st.type === 'straight' ? T : n1)) * 100) / 100));
        else if (st.type === 'wall') st.w = Math.max(0.6, Math.min(3, Math.round(wallStairWidthAt(st, lx, lz) * 20) / 20));
        else st.w = st.type === 'spiral' ? Math.max(0.5, Math.min(2.5, Math.round(Math.hypot(lx, lz) * 20) / 20)) : Math.max(0.6, Math.min(3, Math.round(2 * Math.abs(lz) * 20) / 20));
        drag.moved = true; scheduleRebuild(); render();
        return;
      }
      if (drag.type === 'bgscale' && moved) {                    // corner handle: uniform scale around the opposite corner
        snapshotOnce();
        const b = floor().bg, ar = b.ar || 1, th = ((b.rot || 0) * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
        const dxw = x - drag.opp[0], dzw = z - drag.opp[1];
        const dl = [dxw * c + dzw * sn, -dxw * sn + dzw * c];      // pointer relative to the fixed corner, in image axes
        const sg = [[-1, -1], [1, -1], [1, 1], [-1, 1]][drag.ci];
        const u = [sg[0] * drag.w0, sg[1] * drag.w0 * ar];
        const k = Math.max(0.5 / drag.w0, (dl[0] * u[0] + dl[1] * u[1]) / (u[0] * u[0] + u[1] * u[1]));
        const nw = drag.w0 * k, opp = [sg[0] > 0 ? 0 : nw, sg[1] > 0 ? 0 : nw * ar];
        b.w = +nw.toFixed(4);
        b.x = +(drag.opp[0] - (opp[0] * c - opp[1] * sn)).toFixed(4);
        b.z = +(drag.opp[1] - (opp[0] * sn + opp[1] * c)).toFixed(4);
        drag.moved = true; render();
        ctx.setStatus(`${ctx.t('bg.width')}: ${ctx.fmtLen(b.w)}`);
        return;
      }
      if (drag.type === 'bgmove' && moved) {
        snapshotOnce();
        const b = floor().bg;
        b.x = +(drag.ox + (x - drag.sx0)).toFixed(3); b.z = +(drag.oz + (z - drag.sz0)).toFixed(3);
        drag.moved = true; render();
        return;
      }
      if (drag.type === 'roofsize' && moved) {                    // a corner or side of a roof (#259): only the plan follows, the house is built on release
        const nb = resizeBox(drag.start, drag.which, x, z, e.altKey ? 0 : 0.05);   // 5 cm steps, Alt: free
        const now = (ctx.roofRects?.() || []).find((q) => q.id === drag.id)?.box;
        if (now && ['x0', 'x1', 'z0', 'z1'].some((k) => now[k] !== nb[k])) { snapshotOnce(); if (ctx.resizeRoof(drag.id, nb)) { drag.moved = true; render(); } }
        return;
      }
      if (drag.type === 'roof' && moved) {
        const now = (ctx.roofRects?.() || []).find((q) => q.id === drag.id)?.box;
        if (!now) return;
        const { dx, dz } = dragStep(drag.start, now, x - drag.sx, z - drag.sz, e.altKey ? 0 : 0.05);   // 5 cm steps, Alt: free
        if (dx || dz) { snapshotOnce(); ctx.dragRoof(drag.id, dx, dz); drag.moved = true; render(); }   // the 3D roof moves along, the house is built once on release (#257)
        return;
      }
      if (drag.type === 'stair' && moved) {
        snapshotOnce();
        const [nx, nz] = snapPt(x + drag.dx, z + drag.dz, { fine: true, ends: false, free: e.altKey });
        drag.st.x = nx; drag.st.z = nz; drag.moved = true;
        scheduleRebuild(); render();
        return;
      }
      if (drag.type === 'device' && moved) {
        if (drag.d.locked) return;
        snapshotOnce();
        const [nx, nz] = snapPt(x + drag.dx, z + drag.dz, { fine: true, ends: false, free: e.altKey });
        ctx.moveDeviceTo(drag.d, nx, nz); drag.moved = true;
        render();
        return;
      }
      if (drag.type === 'opening' && moved) {
        const { wall, opening } = drag;
        const raw = Math.round(ctx.projectOnWall(wall, [x, z]) / 0.05) * 0.05;
        const pos = ctx.clampOpeningPos(wall, opening.width, raw);
        if (pos !== null && !ctx.openingOverlaps(wall, pos, opening.width, opening.id) && Math.abs(pos - opening.pos) > 1e-6) {
          snapshotOnce();
          opening.pos = pos; drag.moved = true;
          scheduleRebuild(); render();
        }
        return;
      }
      if (drag.type === 'points' && (moved || drag.moved)) {
        snapshotOnce();
        let nx = x, nz = z;
        if (drag.whole) { nx = drag.refs[0].ox + (x - drag.start[0]); nz = drag.refs[0].oz + (z - drag.start[1]); }
        let p = snapPt(nx, nz, { ends: !drag.whole, free: e.altKey });
        if (!drag.whole && drag.wall && shift) p = angleSnap(drag.other, p);
        const ddx = p[0] - drag.refs[0].ox, ddz = p[1] - drag.refs[0].oz;
        drag.refs.forEach((r) => { r.q[0] = +(r.ox + ddx).toFixed(4); r.q[1] = +(r.oz + ddz).toFixed(4); });
        drag.moved = true;
        scheduleRebuild(); render();
        if (drag.wall) ctx.setStatus(`${ctx.t('length')}: ${ctx.fmtLen(Math.hypot(drag.wall.b[0] - drag.wall.a[0], drag.wall.b[1] - drag.wall.a[1]))}`);
        return;
      }
      return;
    }

    /* no button down: hover / previews */
    if (isLive()) return;
    if (bgMode === 'calib') { calibCur = [x, z]; if (calibPts.length) render(); return; }
    if (tool === 'stairs') {
      cursor = snapPt(x, z, { fine: true, ends: false });
      render();
    } else if (tool === 'wall' || tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole') {
      let p = snapPt(x, z, { free: e.altKey });
      if (drawPts.length && tool === 'wall' && shift) p = angleSnap(drawPts[drawPts.length - 1], p);
      cursor = p;
      if (drawPts.length && tool === 'wall') {
        const last = drawPts[drawPts.length - 1];
        ctx.setStatus(`${ctx.t('length')}: ${ctx.fmtLen(Math.hypot(p[0] - last[0], p[1] - last[1]))}`);
      }
      render();
    } else if (tool === 'device') {
      cursor = snapPt(x, z, { fine: true, ends: false });
      render();
    } else if (tool === 'opening') {
      opPreview = openingTarget(x, z);
      render();
    }
  });

  function openingTarget(x, z, def = ctx.OPENING_DEFAULTS[ctx.getOpeningType()]) {
    let best = null, bd = Math.max(0.3, 14 / s);
    floor().walls.forEach((w) => { const d = distSeg(x, z, w.a, w.b); if (d < bd) { bd = d; best = w; } });
    if (!best) return null;
    const raw = Math.round(ctx.projectOnWall(best, [x, z]) / 0.05) * 0.05;
    const width = ctx.fitOpeningWidth(best, def.width);
    if (width === null) return null;
    const fit = width === def.width ? def : { ...def, width };
    const pos = ctx.clampOpeningPos(best, width, raw);
    if (pos === null) return null;
    return { wall: best, pos, valid: !ctx.openingOverlaps(best, pos, width, null), def: fit };
  }

  root.addEventListener('pointerup', (e) => {
    const [px, py] = local(e);
    pointers.delete(e.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    const d = drag;
    drag = null;
    if (!d) return;
    const x = wx(px), z = wz(py);
    const moved = Math.hypot(px - (d.px ?? px), py - (d.py ?? py)) > 4;
    const tool = ctx.getTool();

    if (d.type === 'devsize') { if (d.moved) { ctx.commit(); ctx.setSelection(ctx.getSelection()); } snapDone = false; return; }
    if (d.type === 'ringend') { if (d.moved) { ctx.commit(); ctx.setSelection(ctx.getSelection()); } snapDone = false; return; }
    if (d.type === 'stairsize') { if (d.moved) { ctx.commit(); ctx.setSelection(ctx.getSelection()); } snapDone = false; return; }
    if (d.type === 'bgmove' || d.type === 'bgscale') { if (d.moved) { ctx.commit(); ctx.bgChanged(); } snapDone = false; return; }
    if (d.type === 'calib') {
      if (!moved) {
        calibPts.push([x, z]);
        if (calibPts.length === 2) { const [a, b] = calibPts; calibPts = []; calibCur = null; ctx.calibrate(a, b); } else ctx.setStatus(ctx.t('bg.calibB'));
        render();
      }
      return;
    }
    if (d.type === 'tap') { if (!moved) { const h = pickIfAllowed(x, z); ctx.liveTap(h); } return; }
    if (d.type === 'pan') {
      if (!moved && d.clear && !d.locked) { ctx.setSelection(null); }
      return;
    }
    if (d.type === 'multi') {                                         // a click toggles the thing under it, a frame adds what lies inside (#247)
      if (d.b) ctx.addMulti(boxItems(floor(), d.a, d.b, (kind, v) => kind !== 'device' || !ctx.powerMode?.() || ctx.isPowerType(v.type)));
      else if (d.hit) ctx.toggleMulti(d.hit);
      render();
      return;
    }
    if (d.type === 'erase') { if (!moved) { const h = pickAt(x, z); if (h) { ctx.snapshot(); ctx.deleteItem(h); } } return; }
    if (d.type === 'device' || d.type === 'opening' || d.type === 'points' || d.type === 'stair' || d.type === 'roof' || d.type === 'roofsize') {
      if (d.moved) { ctx.commit(); } snapDone = false;
      return;
    }
    if (d.type === 'tool' && !moved) {
      const now = performance.now();
      const dbl = lastTap && now - lastTap.t < 400 && Math.hypot(px - lastTap.px, py - lastTap.py) < 8;
      lastTap = { t: now, px, py };
      if (dbl && (tool === 'wall' || tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole')) { if (tool === 'wall') cancel(); else finishRoom(); return; }   // double tap ends the chain
      placeWith(tool, x, z, e);
    }
  });
  root.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); drag = null; pinch = null; snapDone = false; });

  function placeWith(tool, x, z, e) {
    const f = floor();
    if (tool === 'wall') {
      let p = snapPt(x, z, { free: e.altKey });
      const last = drawPts[drawPts.length - 1];
      if (last && shift) p = angleSnap(last, p);
      if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.01) { cancel(); return; }
      if (last) {
        ctx.snapshot();
        f.walls.push({ id: ctx.uid(), a: [...last], b: [...p], thickness: ctx.settings().wallThickness, height: ctx.settings().wallHeight, openings: [] });
        ctx.commit();
      }
      drawPts.push(p);
      render();
    } else if (tool === 'stairs') {
      const [px2, pz2] = snapPt(x, z, { fine: true, ends: false });
      if (ctx.getStairTemplate().type === 'wall') {             // wall stair: every click adds a point of the path, the same point twice (double click) ends it
        const last = drawPts[drawPts.length - 1];
        if (last && Math.hypot(px2 - last[0], pz2 - last[1]) < 0.01) { finishRoom(); return; }
        drawPts.push([px2, pz2]);
        ctx.setStatus(ctx.t('stair.wallNext'));
        render();
      } else ctx.placeStair(px2, pz2);
    } else if (tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole') {
      const p = snapPt(x, z, { free: e.altKey });
      if (drawPts.length >= 3 && Math.hypot(p[0] - drawPts[0][0], p[1] - drawPts[0][1]) < 0.01) { finishRoom(); return; }
      drawPts.push(p);
      render();
    } else if (tool === 'opening') {
      const tgt = openingTarget(x, z);
      if (tgt?.valid) {
        ctx.snapshot();
        const o = { id: ctx.uid(), type: ctx.getOpeningType(), pos: tgt.pos, ...tgt.def };
        (tgt.wall.openings ||= []).push(o);
        ctx.setSelection({ kind: 'opening', id: o.id });
        ctx.commit();
      }
    } else if (tool === 'cable') {
      const h = pickAt(x, z);
      if (h?.kind === 'device') ctx.cableClick(h.id);
    } else if (tool === 'device') {
      const [px2, pz2] = snapPt(x, z, { fine: true, ends: false });
      ctx.snapshot();
      const d = ctx.newDevice(px2, pz2);
      f.devices.push(d);
      ctx.setSelection({ kind: 'device', id: d.id });
      ctx.commit();
      ctx.holdPlaced();
    }
  }

  function finishRoom() {
    if (ctx.getTool() === 'stairs') { if (drawPts.length >= 2) ctx.placeWallStair(drawPts.map((p) => [...p])); cancel(); return; }   // the path of a wall stair
    if (drawPts.length >= 3 && ctx.getTool() === 'plot') {
      ctx.setPlot(drawPts.map((p) => [...p]));                  // the plot (Grundstück): the lawn takes its shape
    } else if (drawPts.length >= 3 && ctx.getTool() === 'hole') {
      ctx.addHole(drawPts.map((p) => [...p]));
    } else if (drawPts.length >= 3 && ctx.getTool() === 'block') {
      ctx.addBlock(drawPts.map((p) => [...p]));
    } else if (drawPts.length >= 3) {
      ctx.snapshot();
      floor().rooms.push({ id: ctx.uid(), name: `${ctx.t('prop.room')} ${floor().rooms.length + 1}`, color: '#8a7f70', points: drawPts.map((p) => [...p]) });
      ctx.commit();
    }
    cancel();
  }
  function cancel() { drawPts = []; cursor = null; opPreview = null; ctx.setStatus(''); render(); }

  root.addEventListener('dblclick', (e) => {
    if (isLive()) return;
    const tool = ctx.getTool();
    if (tool === 'wall') cancel();
    else if (tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole') finishRoom();
    else if (tool === 'select') {
      const [px, py] = local(e);
      const x = wx(px), z = wz(py);
      let h = pickAt(x, z);
      if (h?.kind === 'opening' && !onOpeningExact(h.id, x, z)) h = null;   // only beside a door / window, not on it: the wall counts
      if (h?.kind === 'device' && !onDeviceExact(h.id, x, z) && wallNear(x, z)) h = null;   // only in the padding around a device, and a wall is there
      if (h?.kind === 'device') { ctx.deviceDoubleClick(h.id); return; }
      const hd = handleAt(px, py);
      if (hd?.type === 'room-pt') {                                  // double click on a corner removes it (a room keeps at least 3)
        if (hd.room.points.length > 3) { ctx.snapshot(); hd.room.points.splice(hd.i, 1); ctx.commit(); }
        return;
      }
      const wallHit = h?.kind === 'wall' ? floor().walls.find((w) => w.id === h.id) : (h?.kind === 'opening' ? null : wallNear(x, z));
      if (wallHit) {                                                 // double click on (or close to) a wall adds a corner there: the wall becomes two
        if (!splitWallAt(wallHit, x, z)) ctx.setStatus(ctx.t('wall.splitNo'));
        return;
      }
      const edge = edgeAt(x, z);
      if (edge) {                                                    // double click on an edge adds a corner there
        ctx.snapshot();
        edge.poly.points.splice(edge.i + 1, 0, [+edge.pt[0].toFixed(3), +edge.pt[1].toFixed(3)]);
        ctx.setSelection({ kind: edge.kind, id: edge.poly.id });
        ctx.commit();
      }
    }
  });

  /* the wall closest to (x, z) within a generous reach (about 12 px), also when a room lies under the pointer */
  function wallNear(x, z) {
    const tol = Math.max(0.1, 12 / s);
    let best = null, bd = Infinity;
    floor().walls.forEach((w) => { const d = distSeg(x, z, w.a, w.b); if (d <= Math.max(w.thickness / 2, tol) && d < bd) { bd = d; best = w; } });
    return best;
  }
  /* split a wall in two at the point of it closest to (x, z); doors / windows go with the piece they sit on, the corner is
   * also added to the rooms and blocks that run along this wall, so moving it later keeps them together.
   * Returns false when there is no room for it (too close to an end or inside a door / window). */
  function splitWallAt(w, x, z) {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz);
    if (L < 0.2) return false;
    const t = ((x - w.a[0]) * dx + (z - w.a[1]) * dz) / (L * L), d = t * L;
    if (d < 0.1 || d > L - 0.1) return false;
    if ((w.openings || []).some((o) => Math.abs(o.pos - d) < o.width / 2 + 0.02)) return false;
    const pt = [+(w.a[0] + dx * t).toFixed(3), +(w.a[1] + dz * t).toFixed(3)];
    ctx.snapshot();
    const f = floor();
    const second = { ...w, id: ctx.uid(), a: [...pt], b: [...w.b], openings: (w.openings || []).filter((o) => o.pos > d).map((o) => ({ ...o, pos: o.pos - d })) };
    w.openings = (w.openings || []).filter((o) => o.pos <= d);
    w.b = [...pt];
    f.walls.splice(f.walls.indexOf(w) + 1, 0, second);
    [...f.rooms, ...(f.blocks || [])].forEach((poly) => {
      const ps = poly.points;
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i], b = ps[(i + 1) % ps.length];
        if (distSeg(pt[0], pt[1], a, b) < 0.03 && Math.hypot(pt[0] - a[0], pt[1] - a[1]) > 0.05 && Math.hypot(pt[0] - b[0], pt[1] - b[1]) > 0.05) { ps.splice(i + 1, 0, [...pt]); break; }
      }
    });
    ctx.setSelection({ kind: 'wall', id: w.id });
    ctx.commit();
    return true;
  }

  /* nearest edge of a room / block (the selected one wins) under the pointer, with the point on that edge */
  function edgeAt(x, z) {
    const f = floor(), sel = ctx.getSelection(), tol = Math.max(0.08, 10 / s);
    const polys = [...f.rooms.map((p) => ({ kind: 'room', poly: p })), ...(f.blocks || []).map((p) => ({ kind: 'block', poly: p })), ...(f.holes || []).map((p) => ({ kind: 'hole', poly: p }))];
    let best = null;
    polys.forEach(({ kind, poly }) => {
      const pts2 = poly.points, n = pts2.length;
      const bonus = sel && sel.kind === kind && sel.id === poly.id ? 0.5 : 1;             // prefer the selected shape
      for (let i = 0; i < n; i++) {
        const a = pts2[i], b = pts2[(i + 1) % n];
        const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
        if (L2 < 1e-6) continue;
        const t = ((x - a[0]) * dx + (z - a[1]) * dz) / L2;
        if (t < 0.02 || t > 0.98) continue;                                               // not on top of an existing corner
        const pt = [a[0] + dx * t, a[1] + dz * t], d = Math.hypot(x - pt[0], z - pt[1]) * bonus;
        if (d <= tol && (!best || d < best.d)) best = { kind, poly, i, pt, d };
      }
    });
    return best;
  }
  root.addEventListener('pointerleave', () => { if (!drag) { opPreview = null; if (!drawPts.length) cursor = null; render(); } });

  new ResizeObserver(() => { if (visible) schedule(); }).observe(root);

  return {
    footOf,
    el: root,
    show(v) {
      visible = v;
      root.hidden = !v;
      if (v) { requestAnimationFrame(() => { fit(); }); }
    },
    isVisible: () => visible,
    toClient: (x, z) => { const r = root.getBoundingClientRect(), [px, py] = rot ? rotPoint([sx(x), sy(z)], [W / 2, H / 2], rot) : [sx(x), sy(z)]; return [r.left + px, r.top + py]; },
    /** turn the plan on the screen (degrees, #212); small changes are ignored so a camera at rest does not redraw */
    setRotation(deg) { if (Math.abs(deg - rot) < 0.5 && (deg === 0) === (rot === 0)) return; rot = deg; render(); },
    rotation: () => rot,
    render: schedule,
    pickAt, splitWallAt, wallNear,           // for the browser tests
    fit,
    cancel,
    reset() { drawPts = []; cursor = null; opPreview = null; calibPts = []; calibCur = null; },
    setBgMode(m) { bgMode = m; calibPts = []; calibCur = null; root.classList.toggle('bgmode', !!m); render(); },
    hasDraft: () => drawPts.length > 0,
    finishRoom,
  };
}
