/* Stair geometry (no THREE dependency, shared by the 3D view, the 2D plan and the tests).
 *
 * Stair data: { id, type: 'straight'|'L'|'U'|'spiral', x, z, rot, w, tread, turn: 'left'|'right', dir: 'up'|'down', name }
 *  - (x, z) is the start of the stair (bottom, centre of the first step), `rot` turns it around that point (degrees).
 *  - local frame: +x = walking direction of the first flight, +z = to the right of it (screen: down).
 *  - dir 'up'   : the stair belongs to this floor and climbs to the floor above (hole in the floor above).
 *  - dir 'down' : the stair comes up from the floor below to this floor (hole in this floor).
 * All lengths in metres. `H` is the floor-to-floor height.
 */

export const STAIR_TYPES = ['straight', 'L', 'U', 'spiral'];
export const HEADROOM = 2.0;         // height needed above the steps, decides where the floor opening starts
const GAP = 0.1;                     // gap between the two flights of a U stair

export function stairDefaults(type) {
  return { type, w: type === 'spiral' ? 0.9 : 1.0, tread: 0.27, turn: 'right', dir: 'up' };
}

/** number of risers for the floor height, and the rise of one step */
export function stairSteps(H) {
  const n = Math.max(3, Math.round(H / 0.18));
  return { n, rise: H / n };
}

const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/**
 * Local geometry of a stair.
 * Returns { treads: [{ poly, top }], hole: [[x,z],...], arrow: [[x,z],[x,z]] }
 *  - treads: solid step blocks, `top` = height of the walking surface above the stair's start level
 *  - hole  : outline of the opening needed in the floor above the steps that are closer than HEADROOM to it
 */
export function stairLocal(st, H) {
  const { n, rise } = stairSteps(H);
  const T = n - 1;                                     // treads; the last riser arrives at the upper floor
  const w = st.w || 1, d = st.tread || 0.27, sg = st.turn === 'left' ? -1 : 1;
  const treads = [];
  let hole, arrow;
  const flip = (poly) => poly.map(([x, z]) => [x, z * sg]);   // mirror to the chosen turning side (z only, x untouched)
  const firstOver = (from, count) => {                 // first tread index that needs headroom
    for (let k = from; k < from + count; k++) if ((k + 1) * rise > H - HEADROOM) return k;
    return from + count - 1;
  };

  if (st.type === 'spiral') {
    const R = w, a = (2 * Math.PI) / T, dirn = sg;
    for (let k = 0; k < T; k++) {
      const a0 = k * a * dirn, a1 = (k + 1) * a * dirn, seg = 3;
      const poly = [[0, 0]];
      for (let s = 0; s <= seg; s++) { const q = a0 + ((a1 - a0) * s) / seg; poly.push([Math.cos(q) * R, Math.sin(q) * R]); }
      treads.push({ poly, top: (k + 1) * rise });
    }
    hole = Array.from({ length: 20 }, (_, i) => [Math.cos((i / 20) * 2 * Math.PI) * (R + 0.05), Math.sin((i / 20) * 2 * Math.PI) * (R + 0.05)]);
    arrow = [[0, 0], [Math.cos(T * a * dirn * 0.95) * R * 0.85, Math.sin(T * a * dirn * 0.95) * R * 0.85]];
    return { treads, hole, arrow };
  }

  if (st.type === 'straight') {
    for (let k = 0; k < T; k++) treads.push({ poly: rect(k * d, (k + 1) * d, -w / 2, w / 2), top: (k + 1) * rise });
    const k0 = firstOver(0, T);
    hole = rect(k0 * d, T * d, -w / 2, w / 2);
    arrow = [[0, 0], [T * d, 0]];
    return { treads, hole, arrow };
  }

  const n1 = Math.floor((T - 1) / 2), n2 = T - 1 - n1;   // flight 1, landing (one step), flight 2
  for (let k = 0; k < n1; k++) treads.push({ poly: rect(k * d, (k + 1) * d, -w / 2, w / 2), top: (k + 1) * rise });
  const xa = n1 * d, xb = xa + w, landTop = (n1 + 1) * rise;

  if (st.type === 'L') {
    treads.push({ poly: flip(rect(xa, xb, -w / 2, w / 2)), top: landTop });
    for (let j = 0; j < n2; j++) treads.push({ poly: flip(rect(xa, xb, w / 2 + j * d, w / 2 + (j + 1) * d)), top: (n1 + 2 + j) * rise });
    hole = flip(rect(xa, xb, -w / 2, w / 2 + n2 * d));
    arrow = [[0, 0], [xa + w / 2, 0], [xa + w / 2, (w / 2 + n2 * d) * sg]];
    return { treads, hole, arrow };
  }

  // U: flight 2 returns next to flight 1
  const z1 = w / 2 + GAP, z2 = z1 + w;
  treads.push({ poly: flip(rect(xa, xb, -w / 2, z2)), top: landTop });
  for (let j = 0; j < n2; j++) treads.push({ poly: flip(rect(xa - (j + 1) * d, xa - j * d, z1, z2)), top: (n1 + 2 + j) * rise });
  const xl = xa - n2 * d;
  hole = flip([[xl, z1], [xa, z1], [xa, -w / 2], [xb, -w / 2], [xb, z2], [xl, z2]]);
  arrow = [[0, 0], [xa + w / 2, 0], [xa + w / 2, (z1 + w / 2) * sg], [xl, (z1 + w / 2) * sg]];
  return { treads, hole, arrow };
}

/** tread counts: T treads in total; L/U stairs split into flight 1 (n1), landing and flight 2 (n2) */
export function stairCounts(st, H) {
  const T = stairSteps(H).n - 1, n1 = Math.floor((T - 1) / 2);
  return { T, n1, n2: T - 1 - n1 };
}
/** length of the (first) run in metres, null for spiral stairs */
export function stairLength(st, H) {
  if (st.type === 'spiral') return null;
  const { T, n1 } = stairCounts(st, H);
  return (st.type === 'straight' ? T : n1) * (st.tread || 0.27);
}
/** local positions of the two size handles: `len` at the end of the first run, `wid` at its side */
export function stairHandles(st, H) {
  const w = st.w || 1;
  if (st.type === 'spiral') return { len: null, wid: [w, 0] };
  const L = stairLength(st, H);
  return { len: [L, 0], wid: [L / 2, w / 2] };
}

/* ---- local <-> world (same convention as devices: rot degrees, three.js rotation.y) ---- */
export function toWorld(st, lx, lz) {
  const th = ((st.rot || 0) * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  return [st.x + lx * c + lz * s, st.z - lx * s + lz * c];
}
export function toLocal(st, x, z) {
  const th = ((st.rot || 0) * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  const dx = x - st.x, dz = z - st.z;
  return [dx * c - dz * s, dx * s + dz * c];
}
export const polyToWorld = (st, poly) => poly.map(([x, z]) => toWorld(st, x, z));

function inPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** is the world point on one of the stair's treads? */
export function stairHit(st, x, z, H, pad = 0) {
  const [lx, lz] = toLocal(st, x, z);
  const g = stairLocal(st, H);
  return g.treads.some((t) => inPoly(lx, lz, t.poly)) || (pad > 0 && g.treads.some((t) => t.poly.some(([px, pz]) => Math.hypot(px - lx, pz - lz) < pad)));
}

/** local bounding box of all treads: { x0, x1, z0, z1 } */
export function stairBounds(st, H) {
  const pts = stairLocal(st, H).treads.flatMap((t) => t.poly);
  return {
    x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])),
    z0: Math.min(...pts.map((p) => p[1])), z1: Math.max(...pts.map((p) => p[1])),
  };
}

/** world polygon of the floor opening, or null */
export const stairHoleWorld = (st, H) => polyToWorld(st, stairLocal(st, H).hole);

/**
 * Openings a floor needs: stairs of the floor below that climb to it plus its own stairs that come up from below.
 * `floors` is layout.floors, `i` the index of the floor whose rooms get the holes.
 */
export function holesForFloor(floors, i, H) {
  const out = [];
  (floors[i - 1]?.stairs || []).forEach((st) => { if ((st.dir || 'up') === 'up') out.push(stairHoleWorld(st, H)); });
  (floors[i]?.stairs || []).forEach((st) => { if (st.dir === 'down') out.push(stairHoleWorld(st, H)); });
  return out;
}
