// Solar panels on the roof (#176): where a point lies on a roof surface, how a panel has to be tilted to lie on it,
// and how a field of panels (rows x columns) is laid out. Pure maths, no three.js, no DOM (unit test: tests/solarroof.test.mjs).

/** one panel: width (local x), depth (local z, the long side), the gap between panels in a field */
export const PANEL = { w: 1.0, d: 1.65, gap: 0.02 };
export const MOUNTS = ['auto', 'flat', 'stand'];
export const MAX_FIELD = 12;

/** The frame of a roof as roofGeometry draws it: the outline with overhang, the ridge axis a, the axis b across it,
 *  ridge height h, hip inset ins. `bb` is the base box, `r` the roof spec (type / pitch / overhang / ridge). */
export function roofFrame(bb, r) {
  const o = r.overhang ?? 0.4, x0 = bb.x0 - o, x1 = bb.x1 + o, z0 = bb.z0 - o, z1 = bb.z1 + o;
  const alongX = r.ridge ? r.ridge === 'x' : (x1 - x0) >= (z1 - z0);
  const [a0, a1, b0, b1] = alongX ? [x0, x1, z0, z1] : [z0, z1, x0, x1];   // a = ridge axis, b = across
  const half = (b1 - b0) / 2, bc = (b0 + b1) / 2;
  const flat = r.type === 'flat';
  const h = flat ? 0.15 : half * Math.tan(((r.pitch ?? 35) * Math.PI) / 180);
  const ins = r.type === 'hip' ? Math.min(half, (a1 - a0) / 2) : 0;
  return { x0, x1, z0, z1, alongX, a0, a1, b0, b1, half, bc, h, ins, flat };
}

/** The roof surface above (x, z): height over the roof base, the surface normal and the slope (radians).
 *  null when the point is not under this roof. A flat roof is its top plate (0.1 m). */
export function roofSurfaceAt(bb, r, x, z) {
  if (!bb) return null;
  const F = roofFrame(bb, r);
  if (x < F.x0 - 1e-9 || x > F.x1 + 1e-9 || z < F.z0 - 1e-9 || z > F.z1 + 1e-9) return null;
  if (F.flat) return { y: 0.1, n: [0, 1, 0], slope: 0 };
  const a = F.alongX ? x : z, b = F.alongX ? z : x;
  // the roof is the lowest of its planes: the two long sides, and with a hip roof the two ends
  const planes = [{ y: (F.h * (F.half - Math.abs(b - F.bc))) / F.half, run: F.half, da: 0, db: b >= F.bc ? 1 : -1 }];
  if (F.ins > 0) {
    planes.push({ y: (F.h * (a - F.a0)) / F.ins, run: F.ins, da: -1, db: 0 });
    planes.push({ y: (F.h * (F.a1 - a)) / F.ins, run: F.ins, da: 1, db: 0 });
  }
  const p = planes.reduce((m, q) => (q.y < m.y - 1e-9 ? q : m));
  const slope = Math.atan2(F.h, p.run);
  const [dx, dz] = F.alongX ? [p.da, p.db] : [p.db, p.da];                // downhill, horizontal
  const s = Math.sin(slope), c = Math.cos(slope);
  return { y: Math.max(0, p.y), n: [dx * s, c, dz * s], slope, down: [dx, dz] };
}

/** The highest roof over (x, z) among several: [{ bb, spec, y0 }] (the main roof and further roofs). Adds y0. */
export function roofSpot(roofs, x, z) {
  let best = null;
  for (const R of roofs || []) {
    const s = roofSurfaceAt(R.bb, R.spec, x, z);
    if (s && (!best || s.y + (R.y0 || 0) > best.y)) best = { ...s, y: s.y + (R.y0 || 0) };
  }
  return best;
}

/** Tilt (x) and roll (z) in radians so that a model turned by `rotDeg` around the vertical axis (Euler order YXZ,
 *  as the devices are placed) lies flat on a surface with normal n. The turn the user chose is kept. */
export function panelTilt(n, rotDeg) {
  const t = ((rotDeg || 0) * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  const lx = n[0] * c - n[2] * s, ly = n[1], lz = n[0] * s + n[2] * c;   // the normal seen from the turned model
  return { tiltX: Math.atan2(lz, ly), tiltZ: Math.asin(Math.max(-1, Math.min(1, -lx))) };
}

/** How the panel is mounted: lying flat on a sloped roof, on a stand on a flat roof or the ground; or as chosen. */
export function mountOf(d, spot) {
  if (d?.mount === 'flat' || d?.mount === 'stand') return d.mount;
  return spot && spot.slope > 0.02 ? 'flat' : 'stand';
}

/** A field of panels: columns along local x, rows along local z, centred on the device position. */
export function solarField(d) {
  const n = (v) => Math.max(1, Math.min(MAX_FIELD, Math.round(Number(v) || 1)));
  const cols = n(d?.cols), rows = n(d?.rows);
  const w = cols * PANEL.w + (cols - 1) * PANEL.gap, dp = rows * PANEL.d + (rows - 1) * PANEL.gap;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: -w / 2 + PANEL.w / 2 + c * (PANEL.w + PANEL.gap), z: -dp / 2 + PANEL.d / 2 + r * (PANEL.d + PANEL.gap) });
  return { cols, rows, w, d: dp, cells };
}

/** Where a solar panel device on a roof floor sits: its mount, the lift onto the roof and (lying flat on a slope) its tilt. */
export function solarPose(d, roofs) {
  const spot = roofSpot(roofs, d.x, d.z), mount = mountOf(d, spot);
  if (!spot) return { mount, y: 0, tilt: null };
  return { mount, y: spot.y, tilt: mount === 'flat' && spot.slope > 0 ? panelTilt(spot.n, d.rot) : null };
}

/** a panel on a rack: tilted by `tilt` (radians, its +z end up) round a pivot `pivot` m above the ground, at least `clear` m above it everywhere */
export const STAND = { tilt: 0.5, pivot: 0.55, clear: 0.15, postX: 0.35, postZ: 0.55 };

/** The rack of one panel of a field (cell = { x, z } in model-local metres): how high its pivot sits and its posts
 *  { x, z, y0 (ground), y1 (under the panel) }. groundAt(lx, lz) is the height of the ground (the roof) under a model-local point,
 *  relative to the model origin; on a sloped roof the posts reach down to the roof and the panel is lifted clear of it (#208). */
export function standParts(cell, groundAt = () => 0) {
  const s = Math.sin(STAND.tilt), c = Math.cos(STAND.tilt), half = PANEL.d / 2;
  const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => [cell.x + (sx * PANEL.w) / 2, cell.z + sz * c * half]));
  const top = Math.max(0, groundAt(cell.x, cell.z), ...corners.map(([x, z]) => groundAt(x, z)));
  const lift = Math.max(STAND.pivot, top + STAND.clear + s * half);                 // the low edge (lift - s * half) stays clear of the ground
  const posts = [];
  for (const zp of [-STAND.postZ, STAND.postZ]) for (const sx of [-1, 1]) {
    const x = cell.x + sx * STAND.postX, z = cell.z + c * zp;
    posts.push({ x, z, y0: groundAt(x, z), y1: lift + s * zp });
  }
  return { lift, posts };
}

/** groundAt for standParts: the roof under a model-local point of device d (turned by d.rot, scaled), relative to the model origin at
 *  height baseY over the roof floor; 0 where no roof is under it */
export function groundFn(d, roofs, baseY) {
  const t = ((d.rot || 0) * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), k = d.scale || 1;
  const kx = k * (d.sx || 1), ky = k * (d.sy || 1), kz = k * (d.sz || 1);
  return (lx, lz) => {
    const x = lx * kx, z = lz * kz, sp = roofSpot(roofs, d.x + x * c + z * s, d.z - x * s + z * c);
    return sp ? (sp.y - baseY) / ky : 0;
  };
}
