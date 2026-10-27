/* Heights inside a floor (#566): a plateau in the ground and a room whose floor lies higher (or lower).
 * - A plateau is an area of the plot (layout.plot.areas, plotui.js) with `rise` (m over the lawn), its edge `edge` ('wall': a retaining
 *   wall, 'slope': a bank of lawn) and the wall's look `wall` (WALL_LOOKS). Everything that stands on it goes up with it, on every floor:
 *   rooms, walls, doors, windows, devices, stairs, the roofs over it. "▲ Plateau unter dieses Gebäude" lays one under the outline of a
 *   building (plateauRing), "＋ Außentreppe" puts steps (the device `steps`, stepsParts) in front of its front door (stepsAtDoor).
 * - A room has `raise` (m, minus: lower) over its floor: its floor and what stands in it go up; the ceiling stays, so what hangs from it
 *   (a device from CEILING_FROM up) and the walls stay. Doors and windows in its walls go up with the higher side (openingShift); where a
 *   door joins two floors of different height, steps lie on the lower side (doorSteps; room.steps === false: none).
 * Pure (no three.js, no DOM; unit test: tests/levels.test.mjs). */
import { pointInPoly } from './rooms.js';

export const LEVELS = { maxRise: 5, maxRaise: 3, lip: 0.2, stepMax: 0.18, tread: 0.28, ceilingFrom: 1.9, slopeRun: 1.5 };
export const EDGES = ['wall', 'slope'];
/** the looks of the retaining wall: colours of the stones (3D draws a pattern of them) and of the joints */
export const WALL_LOOKS = {
  stone: { icon: '🪨', stones: ['#9c9284', '#8a8173', '#a89d8d', '#7d7468'], joint: '#4f4a43', cap: '#c9c2b6' },
  concrete: { icon: '▫', stones: ['#b4b1ab'], joint: '#a19e98', cap: '#c8c5bf' },
  brick: { icon: '🧱', stones: ['#9b4f3a', '#8a4433', '#a65a43'], joint: '#d8d0c4', cap: '#b9b2a8' },
  gabion: { icon: '🧺', stones: ['#9a9a94', '#85857f', '#adada6', '#77776f'], joint: '#3b3d40', cap: '#5a5d61' },
};
export const WALL_KEYS = Object.keys(WALL_LOOKS);
/** things that are not lifted: the outdoor steps reach down to the lawn from the edge of the plateau */
export const NO_LIFT = new Set(['steps']);

const r2 = (v) => Math.round(v * 100) / 100;
const num = (v) => (v === null || v === '' || v === undefined ? NaN : +v);
/** a plateau's height as stored: 0.01 to LEVELS.maxRise m, else 0 (no plateau) */
export function cleanRise(v) { const n = num(v); return Number.isFinite(n) && n >= 0.01 ? r2(Math.min(LEVELS.maxRise, n)) : 0; }
/** a room's floor over (or under) its floor as stored: -maxRaise to maxRaise m, 0 = none */
export function cleanRaise(v) { const n = num(v); return Number.isFinite(n) && Math.abs(n) >= 0.01 ? r2(Math.max(-LEVELS.maxRaise, Math.min(LEVELS.maxRaise, n))) : 0; }
/** the plateau fields of an area as stored ({} for an ordinary area) */
export function cleanPlateau(a) {
  const rise = cleanRise(a?.rise);
  if (!rise) return {};
  return { rise, edge: EDGES.includes(a.edge) ? a.edge : 'wall', wall: WALL_KEYS.includes(a.wall) ? a.wall : 'stone' };
}
const okPoly = (p) => Array.isArray(p?.points) && p.points.length >= 3;
/** the plateaus among the areas of the plot, in the order they are drawn (the last one lies on top) */
export const plateausOf = (areas) => (areas || []).filter((a) => okPoly(a) && cleanRise(a.rise) > 0);
/** the height of the ground at (x, z): the plateau under it (the last drawn on top), 0 on the lawn */
export function groundAt(plateaus, x, z) {
  for (let i = plateaus.length - 1; i >= 0; i--) if (pointInPoly(x, z, plateaus[i].points)) return cleanRise(plateaus[i].rise);
  return 0;
}
/** the room of a floor under (x, z), null in none */
export const roomAt = (rooms, x, z) => (rooms || []).find((r) => okPoly(r) && pointInPoly(x, z, r.points)) || null;
/** the height of the floor of a room at (x, z) over its storey (0 outside rooms) */
export const raiseAt = (rooms, x, z) => cleanRaise(roomAt(rooms, x, z)?.raise);
/** a point inside a room (the mean of its corners when that lies inside, else a little inside its first corner) */
export function innerPoint(pts) {
  const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  if (pointInPoly(c[0], c[1], pts)) return c;
  for (let k = 0; k < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % pts.length], [cx, cz] = pts[(k + 2) % pts.length];
    const p = [(ax + bx + cx) / 3, (az + bz + cz) / 3];
    if (pointInPoly(p[0], p[1], pts)) return p;
  }
  return c;
}
/** does anything of the plan stand higher: a plateau or a room with a raised floor (else nothing needs to be lifted) */
export const hasLevels = (layout) => plateausOf(layout?.plot?.areas).length > 0 || (layout?.floors || []).some((f) => (f.rooms || []).some((r) => cleanRaise(r.raise)));

/** how much the things of floor f go up: { any, ground(x, z), room(r) (its floor), device(d), wall(w), at(x, z) (ground + room) };
 *  `areas`: the areas of the plot */
export function lifter(f, areas) {
  const pl = plateausOf(areas), rooms = f?.rooms || [], raised = rooms.some((r) => cleanRaise(r.raise));
  const any = pl.length > 0 || raised;
  const ground = (x, z) => (pl.length ? groundAt(pl, x, z) : 0);
  const at = (x, z) => ground(x, z) + (raised ? raiseAt(rooms, x, z) : 0);
  return {
    any,
    ground,
    at,
    room: (r) => { if (!any || !okPoly(r)) return 0; const [x, z] = innerPoint(r.points); return ground(x, z) + cleanRaise(r.raise); },
    device: (d) => {
      if (!any || NO_LIFT.has(d?.type)) return 0;
      const x = +d.x || 0, z = +d.z || 0;
      return ground(x, z) + ((+d.y || 0) >= LEVELS.ceilingFrom ? 0 : (raised ? raiseAt(rooms, x, z) : 0));   // what hangs from the ceiling stays
    },
    wall: (w) => (any ? ground((w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2) : 0),
  };
}

/* ---------- doors and windows of raised rooms ---------- */
/** the two points beside an opening (left and right of the wall, just outside its faces) and the unit normal pointing to the first one */
export function besideOpening(w, op) {
  const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
  const cx = w.a[0] + ux * (+op.pos || 0), cz = w.a[1] + uz * (+op.pos || 0), t = (+w.thickness || 0.2) / 2 + 0.08, nx = -uz, nz = ux;
  return { c: [cx, cz], n: [nx, nz], u: [ux, uz], p1: [cx + nx * t, cz + nz * t], p2: [cx - nx * t, cz - nz * t] };
}
/** the floor heights on both sides of an opening (0 outside the rooms) */
export function sideLevels(w, op, rooms) {
  const s = besideOpening(w, op);
  return { ...s, l1: raiseAt(rooms, ...s.p1), l2: raiseAt(rooms, ...s.p2) };
}
/** how far an opening goes up: with the higher of the two floors beside it (never down), so that it still fits under the top of the wall */
export function openingShift(w, op, rooms, wallH) {
  const { l1, l2 } = sideLevels(w, op, rooms), up = Math.max(l1, l2, 0);
  if (!up) return 0;
  const room = (+w.height || +wallH || 2.6) - (+op.sill || 0) - (+op.height || 0) - 0.02;
  return r2(Math.max(0, Math.min(up, room)));
}
/** the wall with its doors and windows moved up beside raised rooms (the same wall when nothing moves) */
export function wallWithShift(w, rooms, wallH) {
  if (!(w.openings || []).length || !(rooms || []).some((r) => cleanRaise(r.raise) > 0)) return w;
  let moved = false;
  const openings = w.openings.map((op) => { const s = openingShift(w, op, rooms, wallH); if (!s) return op; moved = true; return { ...op, sill: r2((+op.sill || 0) + s) }; });
  return moved ? { ...w, openings } : w;
}
/** how many steps for a height difference h: risers of at most LEVELS.stepMax, { n, rise } */
export function stepCount(h) {
  const n = Math.max(1, Math.ceil(Math.abs(h) / LEVELS.stepMax - 1e-9));
  return { n, rise: Math.round((Math.abs(h) / n) * 1e4) / 1e4 };
}
/** the steps at the doors of floor f where the floors beside a door lie at different heights: the treads on the lower side, from the wall
 *  face outwards. [{ door, x, z (the middle of the tread), ux, uz (outwards), w (across), d (deep), bottom, top }] (heights over the
 *  storey); a room with steps === false gets none at its doors */
export function doorSteps(f) {
  const rooms = f?.rooms || [], out = [];
  if (!rooms.some((r) => cleanRaise(r.raise))) return out;
  (f.walls || []).forEach((w) => (w.openings || []).forEach((op) => {
    if (op.type !== 'door' || op.style === 'garage') return;
    const s = sideLevels(w, op, rooms), r1 = roomAt(rooms, ...s.p1), r2_ = roomAt(rooms, ...s.p2);
    if (r1?.steps === false || r2_?.steps === false) return;
    const diff = s.l1 - s.l2;
    if (Math.abs(diff) < 0.05) return;
    const lowFirst = diff < 0, sg = lowFirst ? 1 : -1, low = Math.min(s.l1, s.l2), high = Math.max(s.l1, s.l2);
    const ux = s.n[0] * sg, uz = s.n[1] * sg, face = (+w.thickness || 0.2) / 2, { n, rise } = stepCount(high - low);
    const width = Math.max(0.6, (+op.width || 0.9) + 0.1);
    for (let k = 1; k < n; k++) {
      const a = face + (k - 1) * LEVELS.tread, mid = a + LEVELS.tread / 2;
      out.push({ door: op.id, x: s.c[0] + ux * mid, z: s.c[1] + uz * mid, ux, uz, w: width, d: LEVELS.tread, bottom: low, top: r2(high - k * rise) });
    }
  }));
  return out;
}

/* ---------- the plateau under a building and the steps up to it ---------- */
const signed = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
/** the polygon moved outwards by d on every side (corners where the moved sides meet; a straight corner keeps its point moved along) */
export function offsetPoly(pts, d) {
  const n = pts.length, sg = signed(pts) >= 0 ? 1 : -1;
  const sides = pts.map((p, i) => {
    const q = pts[(i + 1) % n], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (q[0] - p[0]) / L, uz = (q[1] - p[1]) / L;
    const nx = uz * sg, nz = -ux * sg;                                 // outwards (the inside lies to the left of a side for sg > 0)
    return { p: [p[0] + nx * d, p[1] + nz * d], u: [ux, uz], n: [nx, nz] };
  });
  return pts.map((p, i) => {
    const A = sides[(i - 1 + n) % n], B = sides[i], den = A.u[0] * B.u[1] - A.u[1] * B.u[0];
    if (Math.abs(den) < 1e-6) return [r2(p[0] + B.n[0] * d), r2(p[1] + B.n[1] * d)];
    const t = ((B.p[0] - A.p[0]) * B.u[1] - (B.p[1] - A.p[1]) * B.u[0]) / den;
    return [r2(A.p[0] + A.u[0] * t), r2(A.p[1] + A.u[1] * t)];
  });
}
/** the outline of a plateau under a building: its footprint (rings of earth.js houseFootprint) moved out by `lip`; several rings or a very
 *  ragged one: the rectangle round them */
export function plateauRing(rings, lip = LEVELS.lip) {
  const ok = (rings || []).filter((r) => Array.isArray(r) && r.length >= 3);
  if (!ok.length) return null;
  if (ok.length === 1 && ok[0].length <= 24) return offsetPoly(ok[0], lip);
  const all = ok.flat(), xs = all.map((p) => p[0]), zs = all.map((p) => p[1]);
  const x0 = r2(Math.min(...xs) - lip), x1 = r2(Math.max(...xs) + lip), z0 = r2(Math.min(...zs) - lip), z1 = r2(Math.max(...zs) + lip);
  return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}
/** where a ray from (x, z) along (ux, uz) leaves the polygon: the distance, or null */
export function exitDistance(pts, x, z, ux, uz) {
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], ex = bx - ax, ez = bz - az, den = ux * ez - uz * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((ax - x) * ez - (az - z) * ex) / den, s = ((ax - x) * uz - (az - z) * ux) / den;
    if (t > 1e-6 && s >= -1e-9 && s <= 1 + 1e-9 && (best === null || t < best)) best = t;
  }
  return best;
}
/** the doors of floor f that lead outside (a room on one side only) and lie on the plateau: [{ wall, op, x, z, ux, uz (outwards), level
 *  (the room's floor over the storey) }] */
export function outerDoors(f, area) {
  const rooms = f?.rooms || [], out = [];
  (f?.walls || []).forEach((w) => (w.openings || []).forEach((op) => {
    if (op.type !== 'door') return;
    const s = besideOpening(w, op), r1 = roomAt(rooms, ...s.p1), r2_ = roomAt(rooms, ...s.p2);
    if (!!r1 === !!r2_ || (area && !pointInPoly(s.c[0], s.c[1], area.points))) return;
    const sg = r1 ? -1 : 1;
    out.push({ wall: w, op, x: s.c[0], z: s.c[1], ux: s.n[0] * sg, uz: s.n[1] * sg, level: cleanRaise((r1 || r2_).raise) });
  }));
  return out;
}
/** the outdoor steps up to the plateau `area` at a door of floor f (the front door first: a door named "Haus…"/"Front…"/"Eingang", else
 *  the one nearest the edge): the device's { x, z (its middle), rot (degrees: they run down along +z of their own frame), h, edge (where
 *  they meet the edge of the plateau), door }, or null */
export function stepsAtDoor(f, area) {
  const rise = cleanRise(area?.rise);
  if (!rise || !okPoly(area)) return null;
  const front = (d) => /haus|front|eingang|entr|main/i.test(d.op.name || '');
  const list = outerDoors(f, area).map((d) => ({ ...d, out: exitDistance(area.points, d.x, d.z, d.ux, d.uz) })).filter((d) => d.out !== null)
    .sort((p, q) => (front(q) - front(p)) || p.out - q.out);
  const d = list[0];
  if (!d) return null;
  const h = r2(rise + Math.max(0, d.level)), half = stepsDepth({ h }) / 2, ex = d.x + d.ux * d.out, ez = d.z + d.uz * d.out;
  return { x: r2(ex + d.ux * half), z: r2(ez + d.uz * half), rot: Math.round((Math.atan2(d.ux, d.uz) * 180) / Math.PI), h, edge: [r2(ex), r2(ez)], door: d.op.id };
}

/** the outdoor steps (device `steps`): height h (to the top), width w, the landing on top `land` deep, a hand rail on both sides unless
 *  noRail; { h, w, land, n (risers), rise, tread } with defaults and limits */
export function stepsSize(d) {
  const c = (v, lo, hi, def) => { const n = num(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def; };
  const h = c(d?.h, 0.1, LEVELS.maxRise, 0.54), { n, rise } = stepCount(h);
  return { h, w: c(d?.w, 0.6, 6, 1.4), land: c(d?.land, 0, 4, 1.0), n, rise, tread: LEVELS.tread };
}
/** how deep the outdoor steps are: the landing and the treads */
export const stepsDepth = (d) => { const s = stepsSize(d); return r2(s.land + (s.n - 1) * s.tread); };
/** the boxes of the outdoor steps in their own frame (x across, y up from the lawn, z outwards from the edge of the plateau at z0 = -depth/2,
 *  the middle of the device at 0): [{ kind: land | step | post | rail, x0, x1, y0, y1, z0, z1 }]; a rail runs from post to post (from, to) */
export function stepsParts(d) {
  const off = -stepsDepth(d) / 2;
  return stepsLocal(d).map((p) => (p.kind === 'rail' ? { ...p, from: [p.from[0], p.from[1], r2(p.from[2] + off)], to: [p.to[0], p.to[1], r2(p.to[2] + off)] }
    : { ...p, z0: r2(p.z0 + off), z1: r2(p.z1 + off) }));
}
/** the same, z from the edge of the plateau (0) outwards */
export function stepsLocal(d) {
  const { h, w, land, n, rise, tread } = stepsSize(d), parts = [], hw = w / 2;
  if (land > 0) parts.push({ kind: 'land', x0: -hw, x1: hw, y0: 0, y1: h, z0: 0, z1: land });
  for (let k = 1; k < n; k++) parts.push({ kind: 'step', x0: -hw, x1: hw, y0: 0, y1: r2(h - k * rise), z0: land + (k - 1) * tread, z1: land + k * tread });
  if (d?.noRail) return parts;
  const RH = 0.9, end = land + (n - 1) * tread, zTop = Math.max(0.05, land - 0.05), zBot = Math.max(zTop + 0.05, end - 0.12), yBot = r2(h - (n - 1) * rise);
  [-1, 1].forEach((s) => {
    const x = s * (hw - 0.06);
    parts.push({ kind: 'post', x0: x - 0.025, x1: x + 0.025, y0: yBot, y1: yBot + RH, z0: zBot - 0.025, z1: zBot + 0.025 });
    parts.push({ kind: 'post', x0: x - 0.025, x1: x + 0.025, y0: h, y1: h + RH, z0: zTop - 0.025, z1: zTop + 0.025 });
    parts.push({ kind: 'rail', from: [x, h + RH, zTop], to: [x, yBot + RH, zBot] });
    if (land > 0.3) {
      parts.push({ kind: 'post', x0: x - 0.025, x1: x + 0.025, y0: h, y1: h + RH, z0: 0.03, z1: 0.08 });
      parts.push({ kind: 'rail', from: [x, h + RH, 0.055], to: [x, h + RH, zTop] });
    }
  });
  return parts;
}
