/* Kitchen run (Küchenzeile, #124): the geometry of a run built from modules, without any 3D library so that it can be tested.
 *
 * A run has up to three legs (straight, L, U). Every leg is a list of module names. The cabinets stand with their back on
 * the "back line" and reach out to the right of the direction of the leg (depth `d.depth`). Leg 1 starts at (0, 0) and runs
 * along +x. Leg 2 starts after the corner square of leg 1 and runs along +z; leg 3 starts after leg 2 and runs along -x and
 * owns its own corner square. Coordinates of the result are centred, so the device position is the middle of the run.
 */
export const MOD_W = { base: 0.6, drawers: 0.6, sink: 1.0, stove: 0.6, dish: 0.6, fridge: 0.6, tall: 0.6, gap: 0.6 };
export const MOD_TYPES = Object.keys(MOD_W);
export const MAX_LEGS = 3;
export const MAX_MODS = 16;
export const DEFAULT_LEGS = () => [['base', 'sink', 'dish', 'base', 'stove', 'base', 'fridge']];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** the legs of a run, cleaned: unknown modules dropped, at most MAX_LEGS legs of MAX_MODS modules each */
export function cleanLegs(legs) {
  const src = Array.isArray(legs) && legs.length ? legs : DEFAULT_LEGS();
  return src.slice(0, MAX_LEGS).map((l) => (Array.isArray(l) ? l.filter((m) => m in MOD_W).slice(0, MAX_MODS) : []));
}
export const legLength = (leg) => leg.reduce((s, m) => s + MOD_W[m], 0);

export function kitchenLayout(d = {}) {
  const D = clamp(Number.isFinite(d.depth) ? d.depth : 0.6, 0.4, 1.2);
  const legs = cleanLegs(d.legs);
  const lens = legs.map(legLength);
  const cells = [];
  let P = [0, 0], h = [1, 0];
  legs.forEach((mods, li) => {
    if (li === 1) { P = [lens[0], D]; h = [0, 1]; }
    if (li === 2) { P = [lens[0], D + lens[1] + D]; h = [-1, 0]; }
    const right = [-h[1], h[0]];
    let s = 0;
    mods.forEach((m, mi) => {
      const w = MOD_W[m];
      cells.push({
        type: m, leg: li, idx: mi, w, d: D, ang: Math.atan2(-h[1], h[0]),
        cx: P[0] + h[0] * (s + w / 2) + right[0] * D / 2,
        cz: P[1] + h[1] * (s + w / 2) + right[1] * D / 2,
      });
      s += w;
    });
  });
  if (!cells.length) return { cells, w: 0.6, d: D, depth: D, legs, lens };
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  cells.forEach((c) => {
    const ex = Math.abs(Math.cos(c.ang)) * c.w / 2 + Math.abs(Math.sin(c.ang)) * c.d / 2;
    const ez = Math.abs(Math.sin(c.ang)) * c.w / 2 + Math.abs(Math.cos(c.ang)) * c.d / 2;
    x0 = Math.min(x0, c.cx - ex); x1 = Math.max(x1, c.cx + ex); z0 = Math.min(z0, c.cz - ez); z1 = Math.max(z1, c.cz + ez);
  });
  const ox = (x0 + x1) / 2, oz = (z0 + z1) / 2;
  cells.forEach((c) => { c.cx -= ox; c.cz -= oz; });
  return { cells, w: x1 - x0, d: z1 - z0, depth: D, legs, lens };
}
