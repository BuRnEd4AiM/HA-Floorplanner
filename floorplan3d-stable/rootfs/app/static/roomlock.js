/* Locking (5.1.0, the owner's wish of 2026-11-09: "Räume sperren, dass diese nicht verschoben werden", pictures 7 and 9 in docs/ideen-5.1/):
 * a locked room keeps its shape and place: its corners, every wall along it (also the wall it shares with a room next to it, else the
 * locked room would change) and, as chosen, the doors and windows in those walls, the devices in it and its settings. „Grundriss fertig“
 * (layout.planLock) locks every wall, room, door, window, stair, block and floor opening of the house at once; devices stay free. Things
 * locked one by one (a device, a wall …, `locked: true`, the object list) stay locked as before. Until 5.0 a locked room could not be
 * dragged as a whole, but a wall next to it pulled its corners along: now a drag that would move one of its points is refused.
 * Pure (unit test: tests/roomlock.test.mjs): what is locked on a floor, and why. */

/** what a locked room keeps fixed besides its walls and corners (always): doors and windows in its walls, the devices in it, its settings */
export const LOCK_KEYS = ['openings', 'devices', 'settings'];
export const LOCK_DEFAULT = { openings: true, devices: false, settings: false };

const POLY = { room: 'rooms', block: 'blocks', hole: 'holes' };
const LISTS = { wall: 'walls', device: 'devices', stair: 'stairs', ...POLY };

/** the lock of room r: null when it is not locked, else what it keeps fixed ({ openings, devices, settings }) */
export function lockOf(r) {
  if (!r?.locked) return null;
  const o = r.lockOpts && typeof r.lockOpts === 'object' ? r.lockOpts : {};
  return Object.fromEntries(LOCK_KEYS.map((k) => [k, typeof o[k] === 'boolean' ? o[k] : LOCK_DEFAULT[k]]));
}
/** lock or unlock room r; opts: what it keeps fixed (only the values that differ from LOCK_DEFAULT are stored) */
export function setRoomLock(r, on, opts = null) {
  if (!r) return r;
  if (!on) { delete r.locked; delete r.lockOpts; return r; }
  r.locked = true;
  const keep = {};
  LOCK_KEYS.forEach((k) => { const v = opts && typeof opts[k] === 'boolean' ? opts[k] : r.lockOpts?.[k]; if (typeof v === 'boolean' && v !== LOCK_DEFAULT[k]) keep[k] = v; });
  if (Object.keys(keep).length) r.lockOpts = keep; else delete r.lockOpts;
  return r;
}
/** „Grundriss fertig“: { on, admin } (admin: only administrators may switch it off) */
export function planLockOf(layout) {
  const p = layout?.planLock;
  return { on: !!p?.on, admin: !!p?.admin };
}
/** switch „Grundriss fertig“ on or off; admin (only administrators may switch it off) is kept while it is off, as chosen */
export function setPlanLock(layout, on, admin) {
  if (!layout) return layout;
  if (!on && !admin) delete layout.planLock;
  else layout.planLock = { ...(on ? { on: true } : {}), ...(admin ? { admin: true } : {}) };
  return layout;
}
/** may this user switch the plan lock off: anybody who may edit, or only an administrator when it says so */
export const mayUnlockPlan = (layout, isAdmin) => !planLockOf(layout).on || !planLockOf(layout).admin || !!isAdmin;

/** the rooms of floor f that are locked: 'all' (every room, or none), 'some', 'none' (the tree of the house, a lock per floor) */
export function floorLockState(f) {
  const rs = (f?.rooms || []).filter((r) => r.points?.length >= 3);
  const n = rs.filter((r) => r.locked).length;
  return !rs.length || !n ? 'none' : n === rs.length ? 'all' : 'some';
}
/** lock or unlock every room of floor f (with opts, see setRoomLock) */
export function setFloorLock(f, on, opts = null) { (f?.rooms || []).forEach((r) => setRoomLock(r, on, opts)); return f; }

function inPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
/** does wall w lie along a stretch of the edge p→q of a room (parallel, on it within its half thickness, overlapping by more than 5 cm) */
export function wallAlong(w, p, q) {
  const ex = q[0] - p[0], ez = q[1] - p[1], L = Math.hypot(ex, ez);
  const wx = w.b[0] - w.a[0], wz = w.b[1] - w.a[1], W = Math.hypot(wx, wz);
  if (L < 1e-6 || W < 1e-6) return false;
  if (Math.abs(ex * wz - ez * wx) / (L * W) > 0.02) return false;            // not parallel (about 1°)
  const tol = Math.max(0.03, (+w.thickness || 0) / 2 + 0.02);
  const off = (pt) => Math.abs((pt[0] - w.a[0]) * wz - (pt[1] - w.a[1]) * wx) / W;   // distance of a point from the wall's line
  if (off(p) > tol || off(q) > tol) return false;
  const t = (pt) => ((pt[0] - w.a[0]) * wx + (pt[1] - w.a[1]) * wz) / W;     // along the wall
  const lo = Math.max(0, Math.min(t(p), t(q))), hi = Math.min(W, Math.max(t(p), t(q)));
  return hi - lo > 0.05;
}

/** everything locked on floor f of layout: { plan, points (Set of the very point arrays that must not move), why: Map(kind:id → reason) }.
 *  A reason: { plan: true } („Grundriss fertig“), { room: name } (a locked room), { own: true } (locked by itself) */
export function lockInfo(layout, f) {
  const why = new Map(), points = new Set(), plan = planLockOf(layout).on;
  const put = (kind, id, r) => { if (id != null && !why.has(`${kind}:${id}`)) why.set(`${kind}:${id}`, r); };
  if (!f) return { plan, points, why };
  const walls = f.walls || [];
  if (plan) {
    const R = { plan: true };
    walls.forEach((w) => { put('wall', w.id, R); points.add(w.a); points.add(w.b); (w.openings || []).forEach((o) => put('opening', o.id, R)); });
    Object.entries(POLY).forEach(([kind, key]) => (f[key] || []).forEach((r) => { put(kind, r.id, R); (r.points || []).forEach((q) => points.add(q)); }));
    (f.stairs || []).forEach((s) => put('stair', s.id, R));
  }
  (f.rooms || []).forEach((r) => {
    const L = lockOf(r);
    if (!L || !(r.points?.length >= 3)) return;
    const R = { room: r.name || '' };
    put('room', r.id, R);
    r.points.forEach((q) => points.add(q));
    const ps = r.points;
    walls.forEach((w) => {
      if (!ps.some((p, i) => wallAlong(w, p, ps[(i + 1) % ps.length]))) return;
      put('wall', w.id, R); points.add(w.a); points.add(w.b);
      if (L.openings) (w.openings || []).forEach((o) => put('opening', o.id, R));
    });
    if (L.devices) (f.devices || []).forEach((d) => { if (Number.isFinite(d.x) && Number.isFinite(d.z) && inPoly(d.x, d.z, ps)) put('device', d.id, R); });
    if (L.settings) put('settings', r.id, R);
  });
  const own = { own: true };                                       // locked one by one (the object list, the 🔒 of a device)
  Object.entries(LISTS).forEach(([kind, key]) => (f[key] || []).forEach((x) => {
    if (!x.locked) return;
    put(kind, x.id, own);
    if (kind === 'wall') { points.add(x.a); points.add(x.b); } else if (POLY[kind]) (x.points || []).forEach((q) => points.add(q));
  }));
  walls.forEach((w) => (w.openings || []).forEach((o) => { if (o.locked) put('opening', o.id, own); }));
  return { plan, points, why };
}
/** why thing (kind, id) is locked, or null */
export const lockedWhy = (info, kind, id) => info?.why.get(`${kind}:${id}`) || null;
/** the first of these point arrays that must not move gives the reason (its room, the plan); null when all may move */
export function pointsLockedWhy(info, f, pts) {
  const hit = (pts || []).find((q) => info?.points.has(q));
  if (!hit) return null;
  if (info.plan) return { plan: true };
  const r = (f?.rooms || []).find((x) => x.locked && (x.points || []).includes(hit));
  if (r) return { room: r.name || '' };
  const w = (f?.walls || []).find((x) => x.a === hit || x.b === hit);
  return (w && lockedWhy(info, 'wall', w.id)) || { own: true };
}
