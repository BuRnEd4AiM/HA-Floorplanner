/* Automatic placement of a Home Assistant area's entities in a room: lights spread under the ceiling, switches next to
   the door, thermostats / cameras / sensors on free stretches of wall, door and window contacts onto the room's openings.
   Pure geometry, no DOM or three.js, so it can be tested on its own. */

const r3 = (v) => Math.round(v * 1000) / 1000;

const SENSOR_DC = new Set(['temperature', 'humidity', 'carbon_dioxide', 'illuminance', 'pm25', 'pm10', 'volatile_organic_compounds', 'aqi']);
const PRESENCE_DC = new Set(['motion', 'occupancy', 'presence']);
const SMOKE_DC = new Set(['smoke', 'gas', 'carbon_monoxide']);
const CONTACT_DC = { door: 'door', garage_door: 'door', window: 'window', opening: 'any' };

/** where an entity belongs: { type, layer: ceiling | floor | wall | opening, y?, want? } or null (not a thing to place) */
export function classify({ entity_id: id, domain, dc, unit }) {
  const dom = domain || id.split('.')[0];
  if (dom === 'light') return { type: 'light', layer: 'ceiling' };
  if (dom === 'switch' || dom === 'input_boolean' || dom === 'fan' || dom === 'cover') return { type: 'switch', layer: 'wall', nearDoor: true };
  if (dom === 'climate') return { type: 'thermostat', layer: 'wall', low: true };
  if (dom === 'media_player') return { type: 'tv_wall', layer: 'wall', long: true };
  if (dom === 'camera') return { type: 'camera', layer: 'wall' };
  if (dom === 'vacuum') return { type: 'vacuum', layer: 'floor' };
  if (dom === 'binary_sensor') {
    if (PRESENCE_DC.has(dc)) return { type: 'presence', layer: 'floor' };
    if (SMOKE_DC.has(dc)) return { type: 'smoke', layer: 'ceiling' };
    if (CONTACT_DC[dc]) return { layer: 'opening', want: CONTACT_DC[dc] };
    return null;
  }
  if (dom === 'sensor') {
    if (SENSOR_DC.has(dc) || unit === '°C' || unit === '°F') return { type: 'sensor', layer: 'wall', y: 1.6 };
    return null;                                            // energy, battery, signal, timestamps ... are no thing in the room
  }
  return null;                                              // scenes, scripts, automations, persons ...
}

export function pointInPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function distSeg(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / L2));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}
const distToPoly = (x, z, pts) => Math.min(...pts.map((p, i) => distSeg(x, z, p, pts[(i + 1) % pts.length])));
const signedArea = (p) => p.reduce((s, [x, z], i) => { const [x2, z2] = p[(i + 1) % p.length]; return s + x * z2 - x2 * z; }, 0) / 2;

/** grid points inside the room, at least `margin` from its outline */
function interior(pts, margin, step = 0.25) {
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]), out = [];
  for (let x = Math.min(...xs) + step / 2; x < Math.max(...xs); x += step)
    for (let z = Math.min(...zs) + step / 2; z < Math.max(...zs); z += step)
      if (pointInPoly(x, z, pts) && distToPoly(x, z, pts) >= margin) out.push([x, z]);
  return out;
}
/** n points spread out over the candidates (each one as far as possible from the others and from `taken`);
 *  with nothing taken the first one is the most central point */
function spread(cands, n, taken) {
  const chosen = [], used = [...taken];
  if (!cands.length) return chosen;
  const cx = cands.reduce((s, p) => s + p[0], 0) / cands.length, cz = cands.reduce((s, p) => s + p[1], 0) / cands.length;
  for (let k = 0; k < n; k++) {
    let best = null, bs = -Infinity;
    for (const p of cands) {
      const s = used.length ? Math.min(...used.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1]))) : -Math.hypot(p[0] - cx, p[1] - cz);
      if (s > bs + 1e-9) { bs = s; best = p; }
    }
    chosen.push(best); used.push(best);
  }
  return chosen;
}
/** n lights as an even grid (rows x cols fitted to the room's shape), falling back to spread points for odd shapes */
function lightGrid(pts, n, taken) {
  const cands = interior(pts, 0.4);
  if (!cands.length) return [];
  const xs = cands.map((p) => p[0]), zs = cands.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs) + 0.8, d = Math.max(...zs) - Math.min(...zs) + 0.8;
  const cols = Math.max(1, Math.round(Math.sqrt((n * w) / d))), rows = Math.ceil(n / cols);
  const x0 = Math.min(...xs) - 0.4, z0 = Math.min(...zs) - 0.4, grid = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) grid.push([x0 + (w * (c + 0.5)) / cols, z0 + (d * (r + 0.5)) / rows]);
  const ok = grid.filter(([x, z]) => pointInPoly(x, z, pts) && distToPoly(x, z, pts) >= 0.3 && !taken.some((q) => Math.hypot(x - q[0], z - q[1]) < 0.5));
  return ok.length >= n ? ok.slice(0, n) : [...ok, ...spread(cands, n - ok.length, [...taken, ...ok])];
}

/**
 * Plan where the entities of an area go.
 * room: { points }, items: [{ entity_id, domain, dc, unit }]
 * opts.openings: [{ id, type: 'door' | 'window', a: [x, z], b: [x, z], entity }] on the room's walls (world)
 * opts.existing: [{ x, z, layer }] devices already in the room
 * returns { devices: [{ entity, type, x, z, y?, rot }], openings: [{ id, entity }], skipped: [entity_id] }
 */
export function planPlacement(room, items, { openings = [], existing = [], wallHeight = 2.6 } = {}) {
  const pts = room.points, inward = signedArea(pts) > 0 ? 1 : -1;
  const out = { devices: [], openings: [], skipped: [] };
  const groups = { ceiling: [], floor: [], wall: [], opening: [] };
  items.forEach((it) => { const c = classify(it); if (c) groups[c.layer].push({ it, c }); else out.skipped.push(it.entity_id); });

  // door and window contacts onto the openings that have no sensor yet (doors for door sensors, windows for window sensors)
  const free = openings.filter((o) => !o.entity);
  groups.opening.forEach(({ it, c }) => {
    const i = free.findIndex((o) => c.want === 'any' || o.type === c.want);
    if (i < 0) { out.skipped.push(it.entity_id); return; }
    out.openings.push({ id: free[i].id, entity: it.entity_id });
    free.splice(i, 1);
  });

  // ceiling: lights on an even grid, smoke detectors in the free spots between them
  const ceilTaken = existing.filter((e) => e.layer === 'ceiling').map((e) => [e.x, e.z]);
  const lights = groups.ceiling.filter((g) => g.c.type === 'light'), smoke = groups.ceiling.filter((g) => g.c.type !== 'light');
  lightGrid(pts, lights.length, ceilTaken).forEach((p, k) => {
    out.devices.push({ entity: lights[k].it.entity_id, type: 'light', x: r3(p[0]), z: r3(p[1]), y: r3(wallHeight - 0.05), rot: 0 });
    ceilTaken.push(p);
  });
  spread(interior(pts, 0.6), smoke.length, ceilTaken).forEach((p, k) => {
    out.devices.push({ entity: smoke[k].it.entity_id, type: smoke[k].c.type, x: r3(p[0]), z: r3(p[1]), y: r3(wallHeight - 0.05), rot: 0 });
    ceilTaken.push(p);
  });

  // floor: presence figures and robots, away from each other, from what stands there already, from the room name in the
  // middle and from the ceiling things (in the plan they would sit on top of each other)
  const allIn = interior(pts, 0.5), mid = allIn.length ? [allIn.reduce((s2, p) => s2 + p[0], 0) / allIn.length, allIn.reduce((s2, p) => s2 + p[1], 0) / allIn.length] : null;
  const floorTaken = [...existing.filter((e) => e.layer === 'floor').map((e) => [e.x, e.z]), ...ceilTaken, ...(mid ? [mid] : [])];
  spread(allIn, groups.floor.length, floorTaken).forEach((p, k) => {
    out.devices.push({ entity: groups.floor[k].it.entity_id, type: groups.floor[k].c.type, x: r3(p[0]), z: r3(p[1]), rot: 0 });
  });

  // walls: stations every 25 cm along the outline, not in front of doors / windows; switches start next to a door
  const doorSpans = openings.filter((o) => o.type === 'door'), winSpans = openings.filter((o) => o.type !== 'door');
  const stations = [];
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 0.6) return;
    const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, nx = -uz * inward, nz = ux * inward;
    for (let s = 0.3; s <= L - 0.3 + 1e-9; s += 0.25) {
      const p = [a[0] + ux * s, a[1] + uz * s];
      if (doorSpans.some((o) => distSeg(p[0], p[1], o.a, o.b) < 0.25)) continue;
      const win = winSpans.some((o) => distSeg(p[0], p[1], o.a, o.b) < 0.25);          // under a window: only for low things (heating)
      stations.push({ p: [p[0] + nx * 0.15, p[1] + nz * 0.15], rot: r3(((Math.atan2(nx, nz) * 180) / Math.PI + 360) % 360), edge: i, s, L, win });
    }
  });
  const wallTaken = existing.filter((e) => e.layer === 'wall').map((e) => [e.x, e.z]);
  const takeStation = (pick, low = false) => {
    const usable = stations.filter((st) => low || !st.win);
    const free2 = usable.filter((st) => !wallTaken.some((q) => Math.hypot(st.p[0] - q[0], st.p[1] - q[1]) < 0.45));
    const st = pick(free2.length ? free2 : usable);
    if (st) wallTaken.push(st.p);
    return st;
  };
  const doors = openings.filter((o) => o.type === 'door');
  const order = [...groups.wall].sort((x, y) => (y.c.nearDoor ? 1 : 0) - (x.c.nearDoor ? 1 : 0));   // switches first, so they get the door
  order.forEach(({ it, c }) => {
    let st;
    if (c.nearDoor && doors.length) {                                    // next to the door, on the handle side is unknown: the nearest free spot
      const dc = doors.map((o) => [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2]);
      st = takeStation((list) => list.reduce((best, x) => {
        const dd = Math.min(...dc.map((q) => Math.hypot(x.p[0] - q[0], x.p[1] - q[1])));
        return !best || dd < best.dd ? { ...x, dd } : best;
      }, null));
    } else if (c.low && winSpans.length) {                              // heating: under the middle of a window
      const wc = winSpans.map((o) => [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2]);
      st = takeStation((list) => list.reduce((best, x) => {
        const dd = Math.min(...wc.map((q) => Math.hypot(x.p[0] - q[0], x.p[1] - q[1])));
        return !best || dd < best.dd ? { ...x, dd } : best;
      }, null), true);
    } else if (c.long) {                                                 // a TV: middle of the longest free wall
      st = takeStation((list) => list.reduce((best, x) => (!best || x.L - Math.abs(x.s - x.L / 2) * 0.5 > best.L - Math.abs(best.s - best.L / 2) * 0.5 ? x : best), null));
    } else {                                                             // the rest: as far as possible from what hangs on the walls
      st = takeStation((list) => list.reduce((best, x) => {
        const sc = wallTaken.length ? Math.min(...wallTaken.map((q) => Math.hypot(x.p[0] - q[0], x.p[1] - q[1]))) : -Math.abs(x.s - x.L / 2);
        return !best || sc > best.sc ? { ...x, sc } : best;
      }, null));
    }
    if (!st) { out.skipped.push(it.entity_id); return; }
    out.devices.push({ entity: it.entity_id, type: c.type, x: r3(st.p[0]), z: r3(st.p[1]), rot: st.rot, ...(c.y ? { y: c.y } : {}), wall: true });
  });
  return out;
}
