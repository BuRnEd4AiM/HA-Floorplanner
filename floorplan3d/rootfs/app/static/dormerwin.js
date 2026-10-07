/* Real windows in roof dormers (Dachgauben): the window in a dormer's front wall is a window like the ones in the walls: it can get a
 * contact sensor (also one per pane), turns red and tilts open when it is open, shows in the list "n open", in the room panel and in the
 * search. Its size and place come from the dormer (set in the roof panel); style, name and sensors are stored on the dormer (d.window).
 * Each dormer window sits in a short wall of its own that is never saved and never drawn as a wall (f.dormerWalls): openingWalls(f)
 * gives the walls of a floor together with them, for everything that looks for doors and windows. Pure, no three.js, no DOM
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

/** finds the windows of every dormer of every roof floor and hangs their front walls onto the floor they belong to (f.dormerWalls, not
 *  enumerable, so never saved). A dormer window gets its stored part (d.window: id, style, name, sensors) the first time; its size and
 *  place are taken from the dormer each time. roofs(ri): the roofs of roof floor ri as [{ bb, spec, y0 }]; elev(i): the height of floor
 *  i; uid(): a new id. Returns the dormer walls per floor. */
export function syncDormerWindows(floors, roofs, elev, uid) {
  const out = floors.map(() => []);
  floors.forEach((f, ri) => {
    if (f.kind !== 'roof') return;
    roofs(ri).forEach((R) => (R.spec?.type === 'flat' ? [] : R.spec?.dormers || []).forEach((d) => {
      const n = fitDormer(R.bb, R.spec, d), win = dormerWindow(n);
      if (!win) return;
      const o = (d.window ||= { id: uid(), type: 'window', style: win.width >= 1.1 ? 'double' : 'single' });
      const base = elev(ri) + (R.y0 || 0) + n.yF + win.sill;              // the lower edge of the window over the ground
      const fi = windowFloor(floors, ri, base + win.height / 2, elev);
      Object.assign(o, { type: 'window', width: r3(win.width), height: r3(win.height), sill: r3(base - elev(fi)), pos: r3(n.w / 2) });
      out[fi].push({ id: `dormer-${o.id}`, a: win.a, b: win.b, thickness: THICK, height: o.sill + o.height, openings: [o], dormer: d });
    }));
  });
  floors.forEach((f, i) => Object.defineProperty(f, 'dormerWalls', { value: out[i], configurable: true, writable: true, enumerable: false }));
  return out;
}
