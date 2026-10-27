/* How often the 3D picture is drawn (step 22 of the split, #137): smoothly while something happens, only a few frames a second when nothing
 * has happened for a while, and fewer still on a weak tablet (low-power mode), to save battery and keep the device cool. The shadows (about
 * half of the work of a frame) are only drawn again when something changed (#253). Pure (unit test:
 * tests/frameloop.test.mjs); the drawing loop itself is in app.js. */

/** after this long without a touch, key or change the picture counts as idle (ms) */
export const IDLE_AFTER = { low: 4000, normal: 15000 };
/** the shortest time between two frames (ms): idle, idle in low-power mode, busy in low-power mode (busy otherwise: every frame) */
export const FRAME_GAP = { idle: 250, idleLow: 500, busyLow: 33 };
/** a throttled frame may come this much early (ms): the screen's frames are never exactly the same distance apart, and a frame that was
 *  0.1 ms too early waited a whole frame more, so the 30 frames of the low-power mode came unevenly (16, 33, 50 ms) and the picture jerked */
export const SLACK = 4;
/** the camera counts as moved by hand for this long after the last drag, wheel or camera change (ms): then the low-power mode draws every
 *  frame too, so turning the house with a finger or the mouse is smooth; it rests again as soon as the picture stands */
export const MOVING = 200;

/** the shadows are drawn again only when something that casts one changed (`dirty`), and at least every SHADOW_REFRESH ms while the
 *  picture is drawn anyway, so a change nobody reported is gone soon; turning the camera alone never needs new shadows (the sun stands still).
 *  A frame with new shadows takes about a third longer: while the camera is moved the safety refresh waits up to SHADOW_REFRESH_MOVING
 *  (one late frame every second was felt as a jerk), and walls that sink while the camera turns get new shadows at most every SHADOW_SINKING
 *  ms and once more when they stand (before: in every frame of their way down) */
export const SHADOW_REFRESH = 1000;
export const SHADOW_REFRESH_MOVING = 5000;
export const SHADOW_SINKING = 300;
/** dirty: something changed; now, lastShadow: ms; o: { sinking (walls move this frame), sank (they moved since the last shadows),
 *  lastMove (the camera's last move, see MOVING) } */
export function shadowDue(dirty, now, lastShadow, o = {}) {
  if (dirty) return true;
  const since = now - lastShadow;
  if (o.sank) return !o.sinking || since >= SHADOW_SINKING;
  return since >= (now - (o.lastMove ?? -Infinity) < MOVING ? SHADOW_REFRESH_MOVING : SHADOW_REFRESH);
}

/** should the animation frame at `now` be drawn? lastActive: the last touch or change, lastFrame: the last frame drawn while throttled,
 *  low: low-power mode, lastMove: the camera's last move (see MOVING). { draw, throttled (then remember `now` as lastFrame), idle } */
export function frameDue(now, lastActive, lastFrame, low, lastMove = -Infinity) {
  const idle = now - lastActive > (low ? IDLE_AFTER.low : IDLE_AFTER.normal);
  if (!idle && (!low || now - lastMove < MOVING)) return { draw: true, throttled: false, idle };
  const gap = idle ? (low ? FRAME_GAP.idleLow : FRAME_GAP.idle) : FRAME_GAP.busyLow;
  return { draw: now - lastFrame >= gap - SLACK, throttled: true, idle };
}

/** the camera glides to rest (OrbitControls' damping): three.js takes DAMPING of the rest of a move in every frame, which is right for 60
 *  frames a second only. At 30 frames the picture followed the mouse half as fast, and with uneven frames it jumped on and stood still in
 *  turn. dampingFor(dt) is the share for a frame dt ms after the one before, so the camera moves the same per second at any frame rate
 *  (a frame after a long pause counts as at most MAX_STEP ms) */
export const DAMPING = 0.05;
export const MAX_STEP = 100;
export const dampingFor = (dt) => 1 - (1 - DAMPING) ** (Math.min(Math.max(dt, 1), MAX_STEP) / (1000 / 60));
