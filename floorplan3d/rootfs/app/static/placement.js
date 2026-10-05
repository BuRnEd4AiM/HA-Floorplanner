/* Placing things (#137, step 22): catching a point on the grid or a wall corner, clicking a wall-hung device flat onto the nearest wall
 * face, an LED ring all around the room it is placed in. Pure functions (unit test: tests/placement.test.mjs). */
import { ringFromRoom } from './ledring.js';

/** things that light up like an LED (glow instead of a lamp light) */
export const LED_LIKE = { strip: 1, tv_led: 1, nanoleaf: 1, panel_tri: 1, panel_hex: 1, panel_sq: 1, panel_bar: 1, orb: 1 };
/** wall-hung devices: pictures, mirrors, panels, radiators, meters ...; they click onto the nearest wall when placed */
export const WALL_TYPES = new Set(['picture', 'tv_wall', 'mirror', 'walllamp', 'radiator', 'towelrad', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'tv_led', 'camera', 'thermostat', 'switch', 'inverter', 'powermeter', 'fusebox', 'wallbox', 'gasmeter', 'heatmeter']);

/** a wall end within 30 cm catches the point, else the grid of `step` metres */
export function snapPoint([x, z], walls, step) {
  for (const w of walls) for (const q of [w.a, w.b]) {
    if (Math.hypot(q[0] - x, q[1] - z) < 0.3) return [q[0], q[1]];
  }
  return [Math.round(x / step) * step, Math.round(z / step) * step];
}

/** put the device d flat on the closest wall (within `maxDist`), facing the side it is on (or, with `keepFacing`, the way it already
 *  faces); a face inside a room wins. Changes d.x, d.z, d.rot; false when no wall is near. */
export function snapToWall(d, walls, rooms, pointInPoly, maxDist = 2, keepFacing = false) {
  const inRoom = (x, z) => rooms.some((r) => pointInPoly(x, z, r.points));
  let best = null;
  walls.forEach((w) => {
    const [ax, az] = w.a, [bx, bz] = w.b, sx = bx - ax, sz = bz - az, L2 = sx * sx + sz * sz || 1;
    const u = Math.max(0, Math.min(1, ((d.x - ax) * sx + (d.z - az) * sz) / L2));
    const px = ax + sx * u, pz = az + sz * u, dist = Math.hypot(d.x - px, d.z - pz);
    if (dist > maxDist + w.thickness / 2) return;
    const len = Math.hypot(sx, sz) || 1, n0x = -sz / len, n0z = sx / len, off = w.thickness / 2 + 0.02;
    // which face of the wall: the interior (a room) wins, else the side the device is on, else the way it already faces
    const okPlus = inRoom(px + n0x * off, pz + n0z * off), okMinus = inRoom(px - n0x * off, pz - n0z * off);
    const rot = ((d.rot || 0) * Math.PI) / 180, face = n0x * Math.sin(rot) + n0z * Math.cos(rot), onSide = n0x * (d.x - px) + n0z * (d.z - pz);
    let sign;
    if (rooms.length && okPlus !== okMinus) sign = okPlus ? 1 : -1;
    else if (Math.abs(onSide) > 0.03) sign = onSide > 0 ? 1 : -1;
    else sign = (keepFacing || Math.abs(face) > 0.05) && Math.abs(face) > 0.05 ? (face > 0 ? 1 : -1) : 1;
    const inside = rooms.length ? (sign > 0 ? okPlus : okMinus) : true;
    const score = dist + (inside ? 0 : 0.6);                  // prefer a wall whose inner face is in a room
    if (!best || score < best.score) best = { score, px, pz, nx: n0x * sign, nz: n0z * sign, off };
  });
  if (!best) return false;
  d.x = +(best.px + best.nx * best.off).toFixed(3); d.z = +(best.pz + best.nz * best.off).toFixed(3);
  d.rot = ((Math.round((Math.atan2(best.nx, best.nz) * 180) / Math.PI * 10) / 10) % 360 + 360) % 360;
  return true;
}

/** an LED ring along the walls of `room`, `inset` metres from its outline, just under the ceiling; a 2 x 2 m square at (x, z) outside rooms */
export function ringAround(room, x, z, inset, wallHeight) {
  const r = room ? ringFromRoom(room.points, inset) : { x, z, pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]], closed: true, segs: [{}, {}, {}, {}] };
  return { ...r, y: +(wallHeight - 0.1).toFixed(2), inset, rot: 0, ...(room ? { room: room.id } : {}) };
}
