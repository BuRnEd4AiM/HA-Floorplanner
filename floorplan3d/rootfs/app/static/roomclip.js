/* Isolation of a focused room (#137, step 24): is a point in the room (or close to its edge), which devices belong to it, the part of a wall
 * that runs along the room, and the point-in-polygon test the whole app uses. Pure geometry (unit test: tests/roomclip.test.mjs). */
import { wallLength } from './walls.js';
import { distToPoly } from './rooms.js';

export const ISO_TOL = 0.3;                // a point this close to the room's edge still belongs to it (walls, wall lamps)

/** is the point (x, z) inside the polygon pts [[x, z], ...] */
export function pointInPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
/** is (x, z) in the room or within ISO_TOL of its edge */
export const inIso = (room, x, z) => pointInPoly(x, z, room.points) || distToPoly(x, z, room.points) < ISO_TOL;
/** does a device at (x, z) belong to the isolated room: in it, or close to its edge (a wall lamp on its wall) but not inside another room of
 *  the floor (rooms: the floor's rooms), so a device just behind a wall the two rooms share stays in its own room (#358) */
export function deviceInIso(room, x, z, rooms = []) {
  if (pointInPoly(x, z, room.points)) return true;
  if (distToPoly(x, z, room.points) >= ISO_TOL) return false;
  return !rooms.some((r) => r.id !== room.id && (r.points || []).length > 2 && pointInPoly(x, z, r.points));
}
/** The part of wall w that runs along the room's outline or inside it (a long outer wall is cut down to this room; a wall inside the room,
 *  like the wall of a closet its outline takes in, stays with its door, #362), or null. */
export function clipWallToRoom(room, w) {
  const L = wallLength(w), N = Math.max(8, Math.ceil(L / 0.1));
  const near = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    near.push(inIso(room, w.a[0] + (w.b[0] - w.a[0]) * k, w.a[1] + (w.b[1] - w.a[1]) * k));
  }
  let best = null, start = -1;
  for (let i = 0; i <= N + 1; i++) {
    if (i <= N && near[i]) { if (start < 0) start = i; continue; }
    if (start >= 0 && (!best || i - start > best[1] - best[0])) best = [start, i - 1];
    start = -1;
  }
  if (!best || (best[1] - best[0]) / N * L < 0.3) return null;
  if (best[0] === 0 && best[1] === N) return w;
  const t0 = best[0] / N, t1 = best[1] / N;
  const at = (k) => [w.a[0] + (w.b[0] - w.a[0]) * k, w.a[1] + (w.b[1] - w.a[1]) * k];
  return {
    ...w, a: at(t0), b: at(t1),
    openings: (w.openings || []).filter((o) => o.pos >= t0 * L && o.pos <= t1 * L).map((o) => ({ ...o, pos: o.pos - t0 * L })),
  };
}

