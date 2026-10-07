/* How often the 3D picture is drawn (step 22 of the split, #137): smoothly while something happens, only a few frames a second when nothing
 * has happened for a while, and fewer still on a weak tablet (low-power mode), to save battery and keep the device cool. The shadows (about
 * half of the work of a frame) are only drawn again when something changed (#253). Pure (unit test:
 * tests/frameloop.test.mjs); the drawing loop itself is in app.js. */

/** after this long without a touch, key or change the picture counts as idle (ms) */
export const IDLE_AFTER = { low: 4000, normal: 15000 };
/** the shortest time between two frames (ms): idle, idle in low-power mode, busy in low-power mode (busy otherwise: every frame) */
export const FRAME_GAP = { idle: 250, idleLow: 500, busyLow: 33 };

/** the shadows are drawn again only when something that casts one changed (`dirty`), and at least every SHADOW_REFRESH ms while the
 *  picture is drawn anyway, so a change nobody reported is gone soon; turning the camera alone never needs new shadows (the sun stands still) */
export const SHADOW_REFRESH = 1000;
export const shadowDue = (dirty, now, lastShadow) => dirty || now - lastShadow >= SHADOW_REFRESH;

/** should the animation frame at `now` be drawn? lastActive: the last touch or change, lastFrame: the last frame drawn while throttled,
 *  low: low-power mode. { draw, throttled (then remember `now` as lastFrame), idle } */
export function frameDue(now, lastActive, lastFrame, low) {
  const idle = now - lastActive > (low ? IDLE_AFTER.low : IDLE_AFTER.normal);
  if (!low && !idle) return { draw: true, throttled: false, idle };
  const gap = idle ? (low ? FRAME_GAP.idleLow : FRAME_GAP.idle) : FRAME_GAP.busyLow;
  return { draw: now - lastFrame >= gap, throttled: true, idle };
}
