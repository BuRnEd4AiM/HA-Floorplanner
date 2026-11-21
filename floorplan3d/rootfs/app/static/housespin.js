/* 🏠 The picture on the Start page turns (5.28.0, the owner 2026-11-21: "dass man dort das Haus sich drehen sieht … das Gebäude, wo
 * ausgewählt ist, in der Vollansicht"): the whole building shown, from a camera of its own that circles it slowly. The rules are here
 * (pure, tests/housespin.test.mjs); housespinui.js draws the picture. */

/** one turn takes this many seconds */
export const TURN_SECONDS = 40;
/** pictures a second (a phone: smooth enough, half the work of 60) */
export const SPIN_FPS = 30;
/** how steeply the camera looks down (radians, about 30°) */
export const SPIN_TILT = 0.52;
/** the house fills this much of the picture (1: a ball round it just fits; a house is no ball, so a little closer) */
export const SPIN_FILL = 1.45;

/** where the turning camera stands at `angle` (radians, 0 = on the +z side): it looks at the middle of the house and stands far enough
 *  away that the whole house fits the picture from every side. b: { cx, cz, size } as houseBoundsOf gives it; y0, y1: the bottom and
 *  the top of the house; fov: the camera's vertical field of view in degrees; aspect: width / height of the picture.
 *  Gives { pos: [x, y, z], target: [x, y, z] } */
export function spinPose(b, y0, y1, angle, { fov = 50, aspect = 2, tilt = SPIN_TILT, fill = SPIN_FILL } = {}) {
  const lo = Number.isFinite(y0) ? y0 : 0, hi = Number.isFinite(y1) ? Math.max(lo, y1) : lo;
  const size = Math.max(4, b?.size || 0), h = hi - lo, ty = (lo + hi) / 2, cx = b?.cx || 0, cz = b?.cz || 0;
  const radius = Math.sqrt((size * size) / 2 + (h * h) / 4);      // a ball round the house
  const half = (Math.max(10, Math.min(120, fov)) * Math.PI) / 360;
  const across = Math.atan(Math.tan(half) * Math.max(0.2, aspect || 1));   // half the field of view from left to right
  const dist = radius / Math.sin(Math.min(half, across)) / Math.max(0.5, fill);
  const flat = dist * Math.cos(tilt);
  return { pos: [cx + flat * Math.sin(angle), ty + dist * Math.sin(tilt), cz + flat * Math.cos(angle)], target: [cx, ty, cz] };
}
/** the angle `ms` milliseconds later: the same way round as the 3D view's own turning (OrbitControls' autoRotate); a long pause (the
 *  page hidden, the picture out of sight) does not make it jump */
export function spinStep(angle, ms) {
  const a = angle - (Math.min(Math.max(ms || 0, 0), 100) / 1000) * ((2 * Math.PI) / TURN_SECONDS);
  return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}
/** the part of the 3D view's canvas (cw × ch CSS pixels) the small picture of w × h CSS pixels is drawn in: smaller when it does not fit */
export function spinRegion(w, h, cw, ch) {
  if (!(w > 0 && h > 0 && cw > 0 && ch > 0)) return null;
  const s = Math.min(1, cw / w, ch / h);
  return { w: Math.max(1, Math.floor(w * s)), h: Math.max(1, Math.floor(h * s)) };
}
/** the picture can be seen: it has a size and lies (partly) inside the window of height vh */
export const spinSeen = (r, vh) => !!r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh;
/** OrbitControls' autoRotateSpeed for the same speed in the 3D view (1 = one turn a minute) */
export const spinSpeed = () => 60 / TURN_SECONDS;
