/* Heights inside a floor (#566): a plateau in the ground and a room whose floor lies higher (or lower).
 * - A plateau is an area of the plot (layout.plot.areas, plotui.js) with `rise` (m over the lawn), its edge `edge` ('wall': a retaining
 *   wall, 'slope': a bank of lawn) and the wall's look `wall` (WALL_LOOKS). Everything that stands on it goes up with it, on the ground
 *   floor and every floor over it: rooms, walls, doors, windows, devices, stairs, the roofs over it. A basement (a floor under the ground
 *   floor) lies in the ground under the plateau and stays where it is (#713, plateauLifts); the stair from it up to the ground floor and the
 *   ceiling over it reach up to the plateau (stairLift, slabExtra). "▲ Plateau unter dieses Gebäude" lays one under the outline of a
 *   building (plateauRing), "＋ Außentreppe" puts steps (the device `steps`, stepsParts) in front of its front door (stepsAtDoor).
 * - A room has `raise` (m, minus: lower) over its floor: its floor and what stands in it go up; the ceiling stays, so what hangs from it
 *   (a device from CEILING_FROM up) and the walls stay. Doors and windows in its walls go up with the higher side (openingShift); where a
 *   door joins two floors of different height, steps lie on the lower side (doorSteps; room.steps === false: none).
 * Pure (no three.js, no DOM; unit test: tests/levels.test.mjs). */
import { pointInPoly } from './rooms.js';
import polygonClipping from './vendor/polygon-clipping.js';
import { splitWall, distAlong, canSplitAt } from './wallsplit.js';
import { porchBack } from './porchroof.js';

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

/* ---------- which floors a plateau lifts (#713) ---------- */
/** does a plateau lift floor i: the ground floor (groundIdx: the first floor that is not a basement) and the floors over it; a basement lies
 *  in the ground under the plateau and stays where it is (the owner, 2026-11-10: "ich habe nur ein Plateau im EG, aber im Keller ist jetzt
 *  auch der Boden erhöht") */
export const plateauLifts = (i, groundIdx = 0) => !(i < groundIdx);
/** the areas of the plot that lift floor i (for lifter): all of them from the ground floor up, none in a basement */
export const areasFor = (areas, i, groundIdx = 0) => (plateauLifts(i, groundIdx) ? areas || [] : []);
/** a stair from floor `from` up `n` floors (storey height H) where the plateau under it is h high: { y (its foot over floor `from`), scale
 *  (its height: 1 = n storeys) }. From a basement up to the ground floor it also climbs the plateau, so it arrives on the raised floor */
export function stairLift(from, n, groundIdx, h, H) {
  const y = plateauLifts(from, groundIdx) ? h || 0 : 0, top = plateauLifts(from + n, groundIdx) ? h || 0 : 0, run = n * H;
  return { y, scale: run > 0 ? (run + top - y) / run : 1 };
}
/** how much deeper the ceiling under floor i reaches when the plateau under it is h high: on the ground floor over a basement down by h,
 *  from the raised floor to the top of the basement walls (no gap between them); 0 elsewhere (the floor below goes up with it) */
export const slabExtra = (i, groundIdx, h) => (i === groundIdx && i > 0 ? h || 0 : 0);

/** is (x, z) in the outline pts or within `tol` m of one of its sides */
function onPoly(pts, x, z, tol = 0.05) {
  if (pointInPoly(x, z, pts)) return true;
  return pts.some((a, k) => {
    const b = pts[(k + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
    return Math.hypot(x - (a[0] + u * dx), z - (a[1] + u * dz)) < tol;
  });
}
/** the highest plateau a corner or the middle of a side of the outline pts lies on (0: none) */
export function edgeLift(plateaus, pts) {
  let h = 0;
  pts.forEach((a, k) => {
    const b = pts[(k + 1) % pts.length];
    h = Math.max(h, groundAt(plateaus, a[0], a[1]), groundAt(plateaus, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
  });
  return h;
}

/** how much the things of floor f go up: { any, ground(x, z), room(r) (its floor), device(d), wall(w), at(x, z) (ground + room) };
 *  `areas`: the areas of the plot; `ter`: on a slope (#629, terrain.js) and the ground floor { at(x, z) (the height of the ground),
 *  stands(d) (the device stands on the ground: a garden thing, outside the house) }: such a device goes up or down with the ground (on a
 *  plateau: with the plateau). The house itself never moves with the ground. `upper`: f lies above the ground floor; there a room that
 *  reaches out beyond the plateaus (a balcony hanging on the house) goes up with the plateau it touches (edgeLift), and so does what stands
 *  in it or on its edge (5.14.0, the owner: the balcony stayed 60 cm lower than the rooms on the plateau, „ich glaube das liegt daran, dass
 *  unten ein Plateau ist“) */
export function lifter(f, areas, ter = null, upper = false) {
  const pl = plateausOf(areas), rooms = f?.rooms || [], raised = rooms.some((r) => cleanRaise(r.raise));
  const any = pl.length > 0 || raised || !!ter;
  const base = (x, z) => (pl.length ? groundAt(pl, x, z) : 0);
  const hung = [];                                                    // [[room, height]]: the rooms of an upper floor off the plateaus that hang on it
  if (upper && pl.length) rooms.forEach((r) => {
    if (!okPoly(r) || base(...innerPoint(r.points))) return;
    const h = edgeLift(pl, r.points);
    if (h) hung.push([r, h]);
  });
  const low = upper ? [] : rooms.filter((r) => r.onGround && okPoly(r));   // a garage on the ground floor stays on the lawn (5.14.0, groundCut)
  const lowWalls = new Set(low.flatMap((r) => wallsOf(f, r).mine));   // its own walls stay down with it, also on a plateau not cut (5.28.5, #789)
  const ground = (x, z, withLow = true) => {
    if (withLow && low.length && low.some((r) => pointInPoly(x, z, r.points))) return 0;
    const g = base(x, z);
    if (g || !hung.length) return g;
    return hung.find(([r]) => onPoly(r.points, x, z))?.[1] || 0;
  };
  const at = (x, z) => ground(x, z) + (raised ? raiseAt(rooms, x, z) : 0);
  return {
    any,
    ground,
    at,
    room: (r) => { if (!any || !okPoly(r)) return 0; const [x, z] = innerPoint(r.points); return ground(x, z) + cleanRaise(r.raise); },
    device: (d) => {
      if (!any) return 0;
      if (NO_LIFT.has(d?.type)) return ter && !base(+d.x || 0, +d.z || 0) ? ter.at(+d.x || 0, +d.z || 0) : 0;   // outdoor steps: on the lawn, also on a slope (#786)
      if (d?.type === 'porchroof') return ground(...porchBack(d));      // a canopy goes up with the house at its back edge, never with the ground (#786)
      const x = +d.x || 0, z = +d.z || 0;
      if (ter?.stands(d)) return ground(x, z) || ter.at(x, z);      // on a slope: on the ground, on a plateau with the plateau
      return ground(x, z) + ((+d.y || 0) >= LEVELS.ceilingFrom ? 0 : (raised ? raiseAt(rooms, x, z) : 0));   // what hangs from the ceiling stays
    },
    wall: (w) => (!any || lowWalls.has(w) ? 0 : ground((w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2, !lowWalls.size)),   // the house's walls: never down with a garage
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
/* ---------- a garage on the lawn beside the house on a plateau (5.14.0) ---------- */
const ring4 = (pts) => [...pts.map((p) => [+p[0], +p[1]]), [+pts[0][0], +pts[0][1]]];
const r3 = (v) => Math.round(v * 1000) / 1000;
const ringArea = (r) => Math.abs(r.reduce((a, p, k) => { const q = r[(k + 1) % r.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
/** rooms and walls (with their thickness and `grow` m more all round) as polygons of polygon-clipping */
function massOf(rooms, walls, grow) {
  const out = rooms.filter(okPoly).map((r) => [ring4(r.points)]);
  walls.forEach((w) => {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz);
    if (L < 1e-3) return;
    const t = (+w.thickness || 0.2) / 2 + grow, nx = (-dz / L) * t, nz = (dx / L) * t, ex = (dx / L) * t, ez = (dz / L) * t;
    out.push([ring4([[w.a[0] - ex + nx, w.a[1] - ez + nz], [w.b[0] + ex + nx, w.b[1] + ez + nz], [w.b[0] + ex - nx, w.b[1] + ez - nz], [w.a[0] - ex - nx, w.a[1] - ez - nz]])]);
  });
  return out;
}
/** „🚗 Steht unten auf dem Rasen“ (5.14.0, the owner: „bei Garagen sollte das ja bis zum Boden gehen“): room `room` of the ground floor
 *  (index gi) gets `onGround` and is cut out of the plateaus it lies on (with its own walls and the plateau's lip round them, not the walls
 *  it shares with the house), so its floor lies on the lawn; `on` false gives it back to the plateau it touches. Changes the plateaus'
 *  points; returns how many plateaus changed (-1: the room lies in the middle of a plateau, a hole cannot be cut) */
/** the walls of floor f that are room's own (round it, not shared with another room that is not on the lawn) and those of the rest */
function wallsOf(f, room) {
  const rest = (f.rooms || []).filter((r) => r !== room && !r.onGround && !r.terrace && okPoly(r));
  const near = (r, w) => onPoly(r.points, (w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2, (+w.thickness || 0.2) / 2 + 0.05);
  return { rest, mine: (f.walls || []).filter((w) => near(room, w) && !rest.some((r) => near(r, w))), theirs: (f.walls || []).filter((w) => rest.some((r) => near(r, w))) };
}
/** the ceiling a ground floor stands on (over a basement), in pieces at their height (5.28.5, the owner's photo: the garage „ist noch immer
 *  irgendwie angehoben, obwohl da kein Plateau drunter ist“): the outline `ring` of floor f goes up by `lift` (the plateau at its inside),
 *  but under a room on the lawn (onGround, with its own walls) it stays down. [{ lift, ring, holes }] (rings of [x, z], not closed) */
export function slabPieces(f, ring, lift) {
  const low = lift ? (f?.rooms || []).filter((r) => r.onGround && okPoly(r)) : [];
  if (!low.length) return [{ lift, ring, holes: [] }];
  const open = (poly) => ({ ring: poly[0].slice(0, -1), holes: poly.slice(1).map((h) => h.slice(0, -1)) });
  try {
    const mass = polygonClipping.union(...low.flatMap((r) => {   // the room with its own walls, not the walls it shares with the house
      const { rest, mine, theirs } = wallsOf(f, r), keep = massOf(rest, theirs, 0.01), own = massOf([r], mine, 0);
      return keep.length ? polygonClipping.difference(polygonClipping.union(...own), ...keep) : polygonClipping.union(...own);
    }));
    const me = [ring4(ring)], down = polygonClipping.intersection(me, mass);
    if (!down.length) return [{ lift, ring, holes: [] }];
    return [...polygonClipping.difference(me, mass).map((poly) => ({ lift, ...open(poly) })), ...down.map((poly) => ({ lift: 0, ...open(poly) }))];
  } catch { return [{ lift, ring, holes: [] }]; }
}
/** the walls of floor f that run on past a corner of room (a long wall along the house and the garage): split there, so the room's piece is a
 *  wall of its own that can stay down with it (5.28.5, the owner: „dass die Wand mit einer Wand Kontakt hat, die auf einem Plateau ist“).
 *  uid() makes the new ids; returns how many were split */
export function splitAtCorners(f, room, uid) {
  if (!f || !okPoly(room) || typeof uid !== 'function') return 0;
  let n = 0;
  room.points.forEach(([x, z]) => {
    const w = (f.walls || []).find((v) => {
      const d = distAlong(v, x, z), L = Math.hypot(v.b[0] - v.a[0], v.b[1] - v.a[1]);
      if (!L || d < 0.05 || d > L - 0.05) return false;
      const px = v.a[0] + ((v.b[0] - v.a[0]) * d) / L, pz = v.a[1] + ((v.b[1] - v.a[1]) * d) / L;
      return Math.hypot(px - x, pz - z) <= (+v.thickness || 0.2) / 2 + 0.02 && canSplitAt(v, d);
    });
    if (w && splitWall(f, w, distAlong(w, x, z), uid)) n++;
  });
  return n;
}
export function groundCut(layout, gi, room, on, uid = null) {
  const f = layout?.floors?.[gi], areas = layout?.plot?.areas || [];
  if (!f || !okPoly(room)) return 0;
  if (on) room.onGround = true; else delete room.onGround;
  if (on) splitAtCorners(f, room, uid);
  const { rest, mine, theirs } = wallsOf(f, room);
  let region, house;
  try {
    const keep = massOf(rest, theirs, 0.01), own = massOf([room], mine, LEVELS.lip);
    region = keep.length ? polygonClipping.difference(polygonClipping.union(...own), ...keep) : polygonClipping.union(...own);
    house = massOf(rest, theirs, LEVELS.lip + 0.01);              // the rest of the house with the plateau's lip round it
  } catch { return 0; }
  if (!region.length) return 0;
  /** what goes with the room: the room itself and the pieces of the plateau beyond the house that touch it (a plateau drawn as a box round
   *  house and garage leaves no strip in front of the garage) */
  const cutOf = (plateau) => {
    try {
      const pieces = house.length ? polygonClipping.difference(plateau, ...house) : [];
      const touch = pieces.filter((pc) => polygonClipping.intersection(pc, region).length > 0);
      return touch.length ? polygonClipping.union(...region, ...touch) : region;
    } catch { return region; }
  };
  let changed = 0;
  areas.forEach((a) => {
    if (!(cleanRise(a.rise) > 0) || !okPoly(a)) return;
    let res;
    try { res = on ? polygonClipping.difference([ring4(a.points)], ...cutOf([ring4(a.points)])) : polygonClipping.union([ring4(a.points)], ...region); } catch { return; }
    if (!on && res.length !== 1) return;                         // not next to this plateau: it stays as it is
    const best = res.map((poly) => ({ poly, area: ringArea(poly[0].slice(0, -1)) })).sort((x, y) => y.area - x.area)[0];
    if (!best) return;
    if (best.poly.length > 1) { changed = changed || -1; return; }     // it would leave a hole
    const pts = best.poly[0].slice(0, -1).map(([x, z]) => [r3(x), r3(z)]);
    if (Math.abs(ringArea(pts) - ringArea(a.points)) < 1e-3) return;   // nothing to cut here
    a.points = pts;
    changed = changed < 0 ? changed : changed + 1;
  });
  return changed;
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

/** the outdoor steps at a door of the ground floor f where the ground outside lies lower (a slope, #786: the ground lowered with
 *  "⛰ Gelände" instead of a plateau): the front door first, else the door with the biggest step down. at(x, z): the height of the ground;
 *  plats: the plateaus (a door on one gets its steps from the plateau). Same result as stepsAtDoor, or null (no door 10 cm over the ground) */
export function stepsAtDoorOnGround(f, at, plats = []) {
  const front = (d) => /haus|front|eingang|entr|main/i.test(d.op.name || '');
  const list = outerDoors(f, null).filter((d) => !plats.some((a) => okPoly(a) && pointInPoly(d.x, d.z, a.points))).map((d) => {
    const th = (+d.wall.thickness || 0.2) / 2, ex = d.x + d.ux * th, ez = d.z + d.uz * th;
    let h = Math.max(0, d.level) - at(ex + d.ux * 0.5, ez + d.uz * 0.5);
    for (let k = 0; k < 2; k++) {                                     // the steps stand on the ground under their middle (lifter): measure it there
      const half = stepsDepth({ h }) / 2;
      h = Math.max(0, d.level) - at(ex + d.ux * half, ez + d.uz * half);
    }
    const half = stepsDepth({ h }) / 2;
    return { d, h: r2(h), ex, ez, half };
  }).filter((q) => q.h >= 0.1).sort((p, q) => (front(q.d) - front(p.d)) || q.h - p.h);
  const q = list[0];
  if (!q) return null;
  const { d } = q;
  return { x: r2(q.ex + d.ux * q.half), z: r2(q.ez + d.uz * q.half), rot: Math.round((Math.atan2(d.ux, d.uz) * 180) / Math.PI), h: q.h, edge: [r2(q.ex), r2(q.ez)], door: d.op.id };
}

/** the outdoor steps (device `steps`): height h (to the top), width w, the landing on top `land` deep; `count`: how many risers (the
 *  landing's included, #786: 65 cm as 3 steps of 22 cm instead of 4 of 16), empty = as many as make them at most 18 cm; `rail`: where the
 *  hand rail runs, seen from the bottom of the steps ('both', 'left', 'right', 'none'; the old `noRail` = 'none'), `railLook`: 'black' or
 *  'steel' (stainless with bars across). { h, w, land, n (risers), rise, tread, rail, look } with defaults and limits */
export function stepsSize(d) {
  const c = (v, lo, hi, def) => { const n = num(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def; };
  const h = c(d?.h, 0.1, LEVELS.maxRise, 0.54), auto = stepCount(h), [lo, hi] = stepsCountRange(h), k = Math.round(num(d?.count));
  const n = Number.isFinite(k) && k > 0 ? Math.max(lo, Math.min(hi, k)) : auto.n;
  return { h, w: c(d?.w, 0.6, 6, 1.4), land: c(d?.land, 0, 4, 1.0), n, rise: Math.round((h / n) * 1e4) / 1e4, tread: LEVELS.tread,
    rail: stepsRail(d), look: d?.railLook === 'steel' ? 'steel' : 'black' };
}
/** how many risers outdoor steps of height h can have: each one from 25 cm down to 12 cm high, [least, most] */
export function stepsCountRange(h) {
  const a = Math.abs(num(h)) || 0;
  const lo = Math.max(1, Math.ceil(a / 0.25 - 1e-9)), hi = Math.max(lo, Math.floor(a / 0.12 + 1e-9));
  return [lo, hi];
}
export const STEPS_RAILS = ['both', 'left', 'right', 'none'];
/** where the hand rail of outdoor steps runs: 'both' (the default), 'left', 'right' (seen from the bottom, looking up at the door) or 'none' */
export function stepsRail(d) {
  if (STEPS_RAILS.includes(d?.rail)) return d.rail;
  return d?.noRail ? 'none' : 'both';
}
/** how deep the outdoor steps are: the landing and the treads */
export const stepsDepth = (d) => { const s = stepsSize(d); return r2(s.land + (s.n - 1) * s.tread); };
/** the boxes of the outdoor steps in their own frame (x across, y up from the lawn, z outwards from the edge of the plateau at z0 = -depth/2,
 *  the middle of the device at 0): [{ kind: land | step | post | rail | bar, x0, x1, y0, y1, z0, z1 }]; a rail (and a bar of a stainless
 *  railing) runs from post to post (from, to) */
export function stepsParts(d) {
  const off = -stepsDepth(d) / 2;
  return stepsLocal(d).map((p) => (p.from ? { ...p, from: [p.from[0], p.from[1], r2(p.from[2] + off)], to: [p.to[0], p.to[1], r2(p.to[2] + off)] }
    : { ...p, z0: r2(p.z0 + off), z1: r2(p.z1 + off) }));
}
/** the same, z from the edge of the plateau (0) outwards */
export function stepsLocal(d) {
  const { h, w, land, n, rise, tread } = stepsSize(d), parts = [], hw = w / 2;
  if (land > 0) parts.push({ kind: 'land', x0: -hw, x1: hw, y0: 0, y1: h, z0: 0, z1: land });
  for (let k = 1; k < n; k++) parts.push({ kind: 'step', x0: -hw, x1: hw, y0: 0, y1: r2(h - k * rise), z0: land + (k - 1) * tread, z1: land + k * tread });
  const { rail, look } = stepsSize(d);
  if (rail === 'none') return parts;
  const RH = 0.9, end = land + (n - 1) * tread, zTop = Math.max(0.05, land - 0.05), zBot = Math.max(zTop + 0.05, end - 0.12), yBot = r2(h - (n - 1) * rise);
  const bars = look === 'steel' ? [0.2, 0.4, 0.6] : [];               // stainless: bars across between the posts, under the hand rail
  // seen from the bottom (looking up at the door along -z) the left side is -x
  (rail === 'both' ? [-1, 1] : [rail === 'left' ? -1 : 1]).forEach((s) => {
    const x = s * (hw - 0.06);
    parts.push({ kind: 'post', x0: x - 0.025, x1: x + 0.025, y0: yBot, y1: yBot + RH, z0: zBot - 0.025, z1: zBot + 0.025 });
    parts.push({ kind: 'post', x0: x - 0.025, x1: x + 0.025, y0: h, y1: h + RH, z0: zTop - 0.025, z1: zTop + 0.025 });
    parts.push({ kind: 'rail', from: [x, h + RH, zTop], to: [x, yBot + RH, zBot] });
    bars.forEach((b) => parts.push({ kind: 'bar', from: [x, h + b, zTop], to: [x, yBot + b, zBot] }));
    if (land > 0.3) {
      parts.push({ kind: 'post', x0: x - 0.025, x1: x + 0.025, y0: h, y1: h + RH, z0: 0.03, z1: 0.08 });
      parts.push({ kind: 'rail', from: [x, h + RH, 0.055], to: [x, h + RH, zTop] });
      bars.forEach((b) => parts.push({ kind: 'bar', from: [x, h + b, 0.055], to: [x, h + b, zTop] }));
    }
  });
  return parts;
}
