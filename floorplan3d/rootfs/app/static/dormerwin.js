/* Real windows in roof dormers (Dachgauben): the window in a dormer's front wall is a window like the ones in the walls: it can get a
 * contact sensor (also one per pane), turns red and tilts open when it is open, shows in the list "n open", in the room panel and in the
 * search. Its size and place come from the dormer (set in the roof panel); style, name and sensors are stored on the dormer (d.window).
 * When a wall of the room under the dormer runs right behind the dormer's front, the window is cut into that wall (#275), so it shows
 * in the room; otherwise it sits in a short wall of its own in the dormer's front. Either way it hangs on a wall object that is never
 * saved (f.dormerWalls): openingWalls(f) gives the walls of a floor together with them, for everything that looks for doors and windows. Pure, no three.js, no DOM
 * (unit test: tests/dormerwin.test.mjs). */
import { fitDormer, dormerWindow } from './dormer.js';
import { clipRoofFloor } from './attic.js';

const THICK = 0.1;                                                   // the dormer's front wall (for the window frame)
const r3 = (v) => Math.round(v * 1000) / 1000;

/** the walls of floor f that carry doors and windows: its own and the front walls of the dormer windows that belong to it */
export const openingWalls = (f) => (f?.dormerWalls?.length ? [...f.walls, ...f.dormerWalls] : f?.walls || []);
/** is w the front wall of a dormer window (not a wall of the plan) */
export const isDormerWall = (w) => !!w?.dormer;

/** which floor the window of a dormer on roof floor ri belongs to: the storey whose floor is the highest one at or below y (the middle
 *  of the window), among the storeys whose walls reach up under this roof (#260, #265), else the roof floor itself */
export function windowFloor(floors, ri, y, elev) {
  let best = ri;
  for (let k = 0; k <= ri; k++) if (clipRoofFloor(floors, k) === ri && elev(k) <= y + 1e-6) best = k;
  return best;
}

/** the dormer windows of every dormer of every roof floor, each with the floor it belongs to: [{ d, n (fitDormer), win (dormerWindow),
 *  ri, fi, base (lower edge of the window over the ground) }]. roofs(ri): the roofs of roof floor ri as [{ bb, spec, y0 }]. */
export function dormerWindows(floors, roofs, elev) {
  const out = [];
  floors.forEach((f, ri) => {
    if (f.kind !== 'roof') return;
    roofs(ri).forEach((R) => (R.spec?.type === 'flat' ? [] : R.spec?.dormers || []).forEach((d) => {
      const n = fitDormer(R.bb, R.spec, d), win = dormerWindow(n);
      if (!win) return;
      const base = elev(ri) + (R.y0 || 0) + n.yF + win.sill;
      out.push({ d, n, win, ri, fi: windowFloor(floors, ri, base + win.height / 2, elev), base });
    }));
  });
  return out;
}

const PARALLEL = 0.05;                                               // sin of the angle up to which a wall counts as parallel to the dormer's front
/** the walls (of one floor) parallel to the front of a dormer window that run behind the whole window: [{ wall, s, pos }], s = how far
 *  the wall lies behind the front (towards the ridge; negative: in front of it, towards the eave), pos = the window's middle along the wall */
export function wallsBehind(walls, n, win) {
  const dx = win.b[0] - win.a[0], dz = win.b[1] - win.a[1], L0 = Math.hypot(dx, dz) || 1, ux = dx / L0, uz = dz / L0;
  const sg = n.side === 0 ? 1 : -1, inw = n.F.alongX ? [0, sg] : [sg, 0];  // from the front towards the ridge
  const cx = (win.a[0] + win.b[0]) / 2, cz = (win.a[1] + win.b[1]) / 2;
  const out = [];
  for (const w of walls) {
    const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    if (L < 0.1) continue;
    const wx = (w.b[0] - w.a[0]) / L, wz = (w.b[1] - w.a[1]) / L;
    if (Math.abs(ux * wz - uz * wx) > PARALLEL) continue;
    const s = ((w.a[0] + w.b[0]) / 2 - cx) * inw[0] + ((w.a[1] + w.b[1]) / 2 - cz) * inw[1];
    const pos = (cx - w.a[0]) * wx + (cz - w.a[1]) * wz;
    if (pos - win.width / 2 < 0.05 || pos + win.width / 2 > L - 0.05) continue;   // the window must lie in front of the wall, not beside it
    out.push({ wall: w, s, pos });
  }
  return out;
}
/** the wall the window of a dormer goes into (#275): a wall of its floor parallel to the dormer's front, behind the whole window, from
 *  25 cm in front of the front (the wall's thickness) back to where the dormer meets the roof (the walls in there reach up into the
 *  dormer), with no other door / window in the way; the nearest one. null: the window stays in the dormer's front. */
export function hostWall(walls, n, win) {
  const depth = n.eT - n.eave;
  const ok = wallsBehind(walls, n, win).filter(({ wall, s, pos }) => s >= -0.25 && s <= depth
    && !(wall.openings || []).some((o) => Math.abs(o.pos - pos) < (o.width + win.width) / 2 + 0.02));
  return ok.sort((p, q) => Math.abs(p.s) - Math.abs(q.s))[0] || null;
}
/** "Put the front on the wall": the distance from the eave that brings the dormer's front onto the nearest wall of the room under it
 *  (parallel, behind the whole window, up to 3 m away), or null when there is no such wall */
export function eaveOntoWall(walls, n, win) {
  const c = wallsBehind(walls, n, win).filter(({ s }) => Math.abs(s) <= 3).sort((p, q) => Math.abs(p.s) - Math.abs(q.s))[0];
  return c ? Math.round((n.eave + c.s) * 1000) / 1000 : null;
}

/** finds the windows of every dormer of every roof floor and hangs them onto the floor they belong to (f.dormerWalls, not enumerable, so
 *  never saved): in a wall of the room under the dormer when one runs right behind the dormer's front (hostWall: the window is cut into
 *  that wall, the wall object is a copy that only carries the window), else in a short wall of its own in the dormer's front. A dormer
 *  window gets its stored part (d.window: id, style, name, sensors) the first time; size and place are taken from the dormer each time.
 *  d.hostWall (not saved) tells the roof to keep the glass pane in the dormer's front. elev(i): the height of floor i; uid(): a new id.
 *  Returns the dormer walls per floor. */
export function syncDormerWindows(floors, roofs, elev, uid) {
  const out = floors.map(() => []);
  for (const { d, n, win, fi, base } of dormerWindows(floors, roofs, elev)) {
    const o = (d.window ||= { id: uid(), type: 'window', style: win.width >= 1.1 ? 'double' : 'single' });
    Object.assign(o, { type: 'window', width: r3(win.width), height: r3(win.height), sill: r3(base - elev(fi)), pos: r3(n.w / 2) });
    const h = hostWall(floors[fi].walls || [], n, win);
    Object.defineProperty(d, 'hostWall', { value: h ? h.wall.id : null, configurable: true, writable: true, enumerable: false });
    if (h) {
      const H = h.wall.height || 2.6;                                       // the window stays inside the wall it is cut into
      if (o.sill + o.height > H - 0.05) o.sill = r3(Math.max(0.1, H - 0.05 - o.height));
      if (o.sill + o.height > H - 0.05) o.height = r3(Math.max(0.3, H - 0.05 - o.sill));
      o.pos = r3(h.pos);
      out[fi].push({ id: `dormer-${o.id}`, a: h.wall.a, b: h.wall.b, thickness: h.wall.thickness, height: H, openings: [o], dormer: d, host: h.wall.id });
    } else {
      out[fi].push({ id: `dormer-${o.id}`, a: win.a, b: win.b, thickness: THICK, height: o.sill + o.height, openings: [o], dormer: d });
    }
  }
  floors.forEach((f, i) => Object.defineProperty(f, 'dormerWalls', { value: out[i], configurable: true, writable: true, enumerable: false }));
  return out;
}
