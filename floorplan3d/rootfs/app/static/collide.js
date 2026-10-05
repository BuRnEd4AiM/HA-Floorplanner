/* Wall stop (#137, step 20): things cannot be pushed into the wall body. The device footprint and the wall thickness count, the move
 * slides along the wall instead of freezing, and door openings let it through. Wall-hung items, outdoor items and ceiling-free objects
 * are exempt. Pure functions (unit test: tests/collide.test.mjs); a footprint is { w, d } or { r } as plan2d's footOf gives it. */

/** things that hang on the wall or the ceiling: they may touch the wall */
export const WALL_HUNG = ['picture', 'tv_wall', 'mirror', 'walllamp', 'radiator', 'towelrad', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'tv_led', 'camera', 'thermostat', 'switch', 'curtain', 'spot', 'pendant', 'smoke'];
/** never stopped besides those: the LED ring (follows the walls) and the bridge (spans across walls); the caller adds the outdoor things */
export const STOP_EXEMPT_BASE = ['ledring', 'bridge', ...WALL_HUNG];

/** how deep the footprint of m standing at (x, z) reaches into the body of wall w (> 0: it overlaps; -1 in a doorway) */
export function penetration(m, x, z, w, foot) {
  const [ax, az] = w.a, [bx, bz] = w.b, sx = bx - ax, sz = bz - az, L = Math.hypot(sx, sz) || 1e-9, ux = sx / L, uz = sz / L;
  const along = (x - ax) * ux + (z - az) * uz;
  const dist = Math.hypot(x - (ax + ux * Math.max(0, Math.min(L, along))), z - (az + uz * Math.max(0, Math.min(L, along))));
  if ((w.openings || []).some((o) => o.type === 'door' && Math.abs(o.pos - along) <= o.width / 2)) return -1;   // through the doorway
  const f = foot, hw = f.r ?? f.w / 2, hd = f.r ?? f.d / 2, th = ((m.rot || 0) * Math.PI) / 180;
  const nx = -uz, nz = ux;                                                            // wall normal
  const cu = Math.cos(th), su = -Math.sin(th), cv = Math.sin(th), sv = Math.cos(th);  // device axes
  const rad = hw * Math.abs(nx * cu + nz * su) + hd * Math.abs(nx * cv + nz * sv);      // half extent of the footprint across the wall
  return (w.thickness || 0.2) / 2 + rad - dist;                                        // > 0: overlaps the wall body
}
/** clamp the displacement (dx,dz) of the given members (types in `exempt`, a Set, are not stopped) so none of them moves deeper into a wall; slide along it when possible */
export function stopMove(members, dx, dz, walls, footOf, exempt) {
  const ms = members.filter((m) => !exempt.has(m.type));
  if (!ms.length) return [dx, dz];
  // the move is checked in small steps so a fast drag cannot tunnel through a wall
  const bad = (ex, ez) => {
    const n = Math.min(80, Math.max(1, Math.ceil(Math.hypot(ex, ez) / 0.04)));
    return walls.find((w) => ms.some((m) => {
      let prev = penetration(m, m.x, m.z, w, footOf(m));
      for (let i = 1; i <= n; i++) {
        const p1 = penetration(m, m.x + (ex * i) / n, m.z + (ez * i) / n, w, footOf(m));
        if (p1 > 0.001 && p1 > prev + 1e-4) return true;
        prev = p1;
      }
      return false;
    }));
  };
  let w = bad(dx, dz);
  if (!w) return [dx, dz];
  for (let i = 0; i < 3 && w; i++) {                                                  // slide: keep only the part of the move along the blocking wall
    const [ax, az] = w.a, L = Math.hypot(w.b[0] - ax, w.b[1] - az) || 1, ux = (w.b[0] - ax) / L, uz = (w.b[1] - az) / L, k = dx * ux + dz * uz;
    dx = ux * k; dz = uz * k;
    w = bad(dx, dz);
  }
  return w ? [0, 0] : [dx, dz];
}
