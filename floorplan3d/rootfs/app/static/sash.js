/* The sash of a window pane that opens (4.64.0, the owner after the example pictures: "Ja, mit Griff"; biggilottecassi in #624: the tilted
 * window should show more): four bars round its glass and a handle on the room side, across from the hinge. It hangs in the pane's pivot,
 * so it tilts and swings with the pane, in the colour of the window's frame (green shut, yellow tilted, red open). Before, a pane was only
 * its glass, and a tilted pane was hard to see. Fixed glazing and a fixed pane have no sash.
 * Pure (no three.js, no DOM; unit test: tests/sash.test.mjs); walls.js makes the boxes into one mesh per pane. */

export const SASH_BAR = 0.065;                   // the width of the profile (smaller on a narrow pane)
export const SASH_DEPTH = 0.06;                  // its depth across the wall

/** the boxes of the sash of a pane whose glass is x0..x1 × y0..y1 (in the pane's own frame, z = 0 the middle of the glass).
 *  hingeAt: the edge the pane swings round, 'x0' | 'x1' | 'y0' | 'y1'; room: +1 or −1, the side of the room along z (the handle).
 *  Returns [{ w, h, d, x, y, z }]: size and middle of every box; [] for a pane too small to have one */
export function sashParts({ x0, x1, y0, y1, hingeAt = 'y0', room = 1 }) {
  const W = x1 - x0, H = y1 - y0;
  if (!(W > 0.12 && H > 0.12)) return [];
  const b = Math.min(SASH_BAR, W * 0.15, H * 0.15), d = SASH_DEPTH, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const parts = [
    { w: W, h: b, d, x: cx, y: y1 - b / 2, z: 0 },               // top
    { w: W, h: b, d, x: cx, y: y0 + b / 2, z: 0 },               // bottom
    { w: b, h: H - 2 * b, d, x: x0 + b / 2, y: cy, z: 0 },       // left
    { w: b, h: H - 2 * b, d, x: x1 - b / 2, y: cy, z: 0 },       // right
  ];
  // the handle: on the bar across from the hinge, in its middle, on the room side; its lever lies along that bar
  const side = room < 0 ? -1 : 1, zb = side * (d / 2 + 0.012), zl = side * (d / 2 + 0.03);
  const across = { x0: 'x1', x1: 'x0', y0: 'y1', y1: 'y0' }[hingeAt] || 'y1';
  if (across === 'x0' || across === 'x1') {
    const x = across === 'x0' ? x0 + b / 2 : x1 - b / 2, lever = Math.min(0.13, H * 0.2);
    parts.push({ w: 0.03, h: 0.05, d: 0.024, x, y: cy, z: zb }, { w: 0.024, h: lever, d: 0.02, x, y: cy - lever / 2 + 0.012, z: zl });
  } else {
    const y = across === 'y0' ? y0 + b / 2 : y1 - b / 2, lever = Math.min(0.13, W * 0.2);
    parts.push({ w: 0.05, h: 0.03, d: 0.024, x: cx, y, z: zb }, { w: lever, h: 0.024, d: 0.02, x: cx + lever / 2 - 0.012, y, z: zl });
  }
  return parts;
}
