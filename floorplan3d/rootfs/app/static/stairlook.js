/* The look of a stair (#753, Miicki: "Treppen mit denselben Bodenbelägen belegen können wie die Räume … Ausserdem soll die Farbe des
 * Geländers bzw. Handlaufs einstellbar sein"): the treads take a floor covering like a room (stair.covering, stair.floorLook: parquet,
 * tiles, stone, concrete … with colour, size and angle; finishes.js) or one colour (stair.color); the risers and strings their own colour
 * (stair.riser; none: like the treads); the hand rail and balusters a colour (stair.rail: stainless steel, black, white, wood …). Nothing
 * set: beige steps and a grey rail as always. Pure (unit test: tests/stairlook.test.mjs); stairtool.js draws it. */
import { cleanHex, cleanLook, planeUV } from './finishes.js';
import { cleanCovering, floorFinish } from './floorcover.js';

export const STEP_HEX = '#c9bba1';
export const RAIL_HEX = '#7c838b';
/** colours to tap for the treads without a covering, the risers and the rail: [key, colour] (names under look.c.<key>) */
export const STEP_COLORS = [['beige', STEP_HEX], ['white', '#f2f0ea'], ['lightgrey', '#c9c9c6'], ['concrete', '#9a9a96'], ['anthracite', '#3a3e43'], ['oak', '#c49a6c'], ['walnut', '#6b4a33']];
export const RISER_COLORS = [['white', '#f2f0ea'], ['lightgrey', '#c9c9c6'], ['concrete', '#9a9a96'], ['anthracite', '#3a3e43'], ['black', '#232528'], ['oak', '#c49a6c'], ['walnut', '#6b4a33']];
export const RAIL_COLORS = [['steel', '#c9ccd0'], ['grey', RAIL_HEX], ['anthracite', '#3a3e43'], ['black', '#232528'], ['white', '#f2f2f0'], ['oak', '#b88a5c'], ['walnut', '#6b4a33']];
const WOOD = new Set(['#c49a6c', '#b88a5c', '#6b4a33']);

/** the finish of the treads (finishes.js resolve) or null: one colour */
export const treadFinish = (st) => floorFinish(st);
/** the colour of the treads: their covering's colour from afar, else their own, else beige */
export const treadHex = (st) => treadFinish(st)?.mean || cleanHex(st?.color) || STEP_HEX;
/** the colour of the risers and strings: their own, else the treads' */
export const riserHex = (st) => cleanHex(st?.riser) || treadHex(st);
/** the hand rail: { color, metal } (wood is not shiny) */
export function railLook(st) {
  const c = cleanHex(st?.rail) || RAIL_HEX;
  return { color: c, metal: !WOOD.has(c) };
}
/** do the treads and the risers look alike (one material for the whole step, as always) */
export const oneLook = (st) => !treadFinish(st) && riserHex(st) === treadHex(st);

/** set what a stair looks like (patch: covering + floorLook, color, riser, rail; null or '' takes one away); returns st */
export function setStairLook(st, patch) {
  if ('covering' in patch) {
    const k = cleanCovering(patch.covering);
    if (k) st.covering = k; else { delete st.covering; delete st.floorLook; }
  }
  if ('floorLook' in patch) { const l = st.covering && cleanLook(patch.floorLook); if (l) st.floorLook = l; else delete st.floorLook; }
  for (const [key, def] of [['color', STEP_HEX], ['riser', null], ['rail', RAIL_HEX]]) {
    if (!(key in patch)) continue;
    const c = cleanHex(patch[key]);
    if (c && c !== def) st[key] = c; else delete st[key];
  }
  return st;
}
/** the look of a room's floor for a stair ("wie der Raum": its covering with colour, size and angle, or its colour) */
export function lookOfRoom(room) {
  const k = cleanCovering(room?.covering);
  if (k) return { covering: k, floorLook: cleanLook(room.floorLook) || null, color: null };
  return { covering: null, color: cleanHex(room?.color) || null };
}

/** texture coordinates of a tread: its outline poly ([[x, z], …]) gives the direction (the planks run along its longest edge, across the
 *  way you walk, from the start of that edge); xz: the points to map ([[x, z], …]); returns [[u, v], …] in pictures of finish fin */
export function treadUVs(fin, poly, xz) {
  let best = 0, ax = 0, az = 0, cx = 1, sz = 0;
  (poly || []).forEach((p, i) => {
    const q = poly[(i + 1) % poly.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (l > best + 1e-9) { best = l; ax = p[0]; az = p[1]; cx = (q[0] - p[0]) / l; sz = (q[1] - p[1]) / l; }
  });
  return xz.map(([x, z]) => { const dx = x - ax, dz = z - az; return planeUV(fin, dx * cx + dz * sz, -dx * sz + dz * cx); });
}
