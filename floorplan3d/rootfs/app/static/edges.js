/* How the edges of the 3D picture are smoothed (#560), chosen per device in ⚙ "Kantenglättung auf diesem Gerät":
 *   msaa  always (the browser's own smoothing of the canvas, as before: the nicest, costs the graphics the most, about 40 % of a frame, #557)
 *   still smooth when the picture stands: no smoothing while the camera moves (the steps are hardly seen then), smoothed as soon as it stands
 *   fxaa  smoothed afterwards: drawn without smoothing, then a small shader softens the steps along the edges (cheap, a little softer)
 *   auto  like msaa, but when the graphics cannot keep up while the camera moves (fewer than WEAK_FPS frames), like still
 *   off   no smoothing (as the low-power mode always was)
 * Without a choice it is as before: msaa, in the low-power mode off. Pure (unit test tests/edges.test.mjs); smoothedges.js draws. */

export const MODES = ['msaa', 'still', 'fxaa', 'auto', 'off'];
export const STORE_KEY = 'fp.edges';

/** the mode in use: ?edges= in the address wins, then what this browser keeps, else as before (low: the low-power mode) */
export function edgeMode(param, stored, low) {
  if (MODES.includes(param)) return param;
  if (MODES.includes(stored)) return stored;
  return low ? 'off' : 'msaa';
}
/** whether the canvas smooths by itself; that can only be chosen when the page starts, so every other mode smooths in a picture of its own */
export const canvasSmooth = (mode) => mode === 'msaa';

/** how this frame is drawn: 'direct' (straight onto the screen), 'smooth' (through a smoothed picture), 'fxaa' (through the soft-edge shader).
 *  moving: the camera moves visibly (see cameraStep), weak: the graphics was measured too slow (mode auto, see weakGraphics) */
export function framePath(mode, moving, weak) {
  if (mode === 'fxaa') return 'fxaa';
  if (mode === 'still') return moving ? 'direct' : 'smooth';
  if (mode === 'auto') return moving && weak ? 'direct' : 'smooth';
  return 'direct';                                                // msaa: the canvas smooths; off
}

/** a camera move below this per frame (turn in radians, or shift as a share of the distance to what it looks at) is less than half a pixel:
 *  the picture counts as standing, so the slow end of the camera's glide is already smoothed */
export const STILL_STEP = 4e-4;
/** the camera keeps counting as moving this long after its last visible move (ms): one frame without a move in the middle of a turn
 *  (the mouse paused for a moment) does not smooth and jump back */
export const MOVE_HOLD = 120;
/** how far the camera moved from frame a to frame b: a, b = { p: [x, y, z], q: [x, y, z, w] }, dist = its distance to what it looks at */
export function cameraStep(a, b, dist) {
  if (!a) return Infinity;
  const dot = Math.min(1, Math.abs(a.q[0] * b.q[0] + a.q[1] * b.q[1] + a.q[2] * b.q[2] + a.q[3] * b.q[3]));
  const turn = 2 * Math.acos(dot);
  const shift = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]) / Math.max(dist, 0.5);
  return Math.max(turn, shift);
}

/** mode auto: the graphics is too weak when the frames while the camera moves come slower than WEAK_FPS (median of the last WEAK_FRAMES
 *  gaps, ms). null while not enough frames were seen. Once weak it stays so until the page is opened again (no back and forth). */
export const WEAK_FPS = 45;
export const WEAK_FRAMES = 20;
export function weakGraphics(gaps) {
  if (gaps.length < WEAK_FRAMES) return null;
  const s = gaps.slice(-WEAK_FRAMES).sort((x, y) => x - y);
  const med = (s[(WEAK_FRAMES >> 1) - 1] + s[WEAK_FRAMES >> 1]) / 2;
  return med > 1000 / WEAK_FPS;
}
/** a gap between two frames counts for weakGraphics only when both were drawn while the camera moved and it is shorter than this (ms):
 *  a pause of the hand or a hidden tab says nothing about the graphics */
export const GAP_MAX = 200;
