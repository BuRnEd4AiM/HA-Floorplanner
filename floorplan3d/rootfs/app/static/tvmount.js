/* Wall TV on a swivel arm (tv_arm): a TV on an articulated wall bracket that stands off the wall. In the side panel: its size, how far it is
 * swung to the side, how far it stands off the wall and how far it is tilted down. Swung or tilted, the arm pulls the TV out as far as it
 * needs so that it never touches the wall. Like the other TVs it has a backlight behind it (ledEntity, shown only when linked). Pure geometry
 * in the part format of scandi.js (models.js builds the meshes from it). Unit test: tests/tvmount.test.mjs */
import { B, C, at, bar, tiltX, turnAll } from './shapes.js';

/** the sizes: screen diagonal (inches) -> width and height of the TV with its frame (m) */
export const TV_SIZES = { 43: [0.97, 0.57], 50: [1.12, 0.65], 55: [1.23, 0.72], 65: [1.45, 0.84], 75: [1.68, 0.97], 85: [1.9, 1.09] };
/** the limits: swing and tilt (degrees, either way), distance from the wall to the back of the TV (m); the defaults */
export const ARM = { swing: 80, tilt: 15, minReach: 0.08, maxReach: 0.8, reach: 0.15, size: '55' };
/** the wall face lies at local z = -0.02 (the default distance of a wall piece from the wall, placement.js) */
export const WALL_Z = -0.02;
const PLATE = 0.015, KNUCKLE = 0.035, FRAME = 0.03, LED_Z = 0.015;     // wall plate thickness; joint behind the TV's back; LED frame around the TV

const num = (v, dflt) => (v === '' || v == null || !Number.isFinite(+v) ? dflt : +v);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rad = (deg) => (deg * Math.PI) / 180;

/** how far the back of the TV must stand off the wall so that its backlight frame stays clear of the wall plate, swung by `swing` and tilted
 *  by `tilt` (degrees): the lowest corner of the turned frame (turned round the joint) must stay in front of the plate */
export function neededReach(w, h, swing, tilt) {
  const sa = Math.abs(Math.sin(rad(swing))), ca = Math.cos(rad(swing)), st = Math.abs(Math.sin(rad(tilt))), ct = Math.cos(rad(tilt));
  const W = w / 2 + FRAME, H = h / 2 + FRAME;
  return KNUCKLE + PLATE + 0.01 + W * sa + ca * (H * st - LED_Z * ct);
}

/** the pose of a device: size (as stored, a key of TV_SIZES), width and height, swing, tilt (degrees), the distance asked for (reach) and the
 *  one the arm takes (out: reach, or more when the TV would touch the wall) */
export function armPose(d = {}) {
  const size = TV_SIZES[d.tvSize] ? String(d.tvSize) : ARM.size, [w, h] = TV_SIZES[size];
  const swing = clamp(num(d.armSwing, 0), -ARM.swing, ARM.swing), tilt = clamp(num(d.armTilt, 0), -ARM.tilt, ARM.tilt);
  const reach = clamp(num(d.armReach, ARM.reach), ARM.minReach, ARM.maxReach);
  return { size, w, h, swing, tilt, reach, out: Math.max(reach, neededReach(w, h, swing, tilt)) };
}

/** the parts: the wall plate, the two folding arms (stacked, the elbow on the side that swings away from the wall), the joint, and the TV
 *  (VESA plate, body, screen, backlight frame) turned round the joint. Materials: plate, arm, tvbody, screen (glows with the entity), led
 *  (the backlight; models.js shows it only with a backlight entity). The device's height (y) is the TV's lower edge when it hangs straight. */
export function tvArmParts(d = {}) {
  const p = armPose(d), cy = p.h / 2, zb = WALL_Z + p.out, zk = zb - KNUCKLE, z0 = WALL_Z + PLATE + 0.02;
  const side = p.swing > 0 ? -1 : 1, dist = zk - z0, L = Math.max(0.3, dist / 2 + 0.03), ex = side * Math.sqrt(Math.max(0, L * L - (dist / 2) ** 2));
  const elbow = [ex, cy, z0 + dist / 2];
  const wall = [
    B(0.16, 0.34, PLATE, 0, cy - 0.17, WALL_Z + PLATE / 2, 'plate'),
    B(0.05, 0.12, 0.022, 0, cy - 0.06, WALL_Z + PLATE + 0.011, 'arm'),                    // the bracket the arm hangs in
    C(0.018, 0.1, 0, cy - 0.05, z0, 'arm', 0.018, 12),                                     // hinge at the wall
    bar([0, cy + 0.02, z0], [elbow[0], cy + 0.02, elbow[2]], 0.045, 0.026, 'arm'),            // upper arm: wall -> elbow
    C(0.02, 0.1, elbow[0], cy - 0.05, elbow[2], 'arm', 0.02, 12),                          // elbow
    bar([elbow[0], cy - 0.02, elbow[2]], [0, cy - 0.02, zk], 0.045, 0.026, 'arm'),            // lower arm: elbow -> joint
    C(0.02, 0.1, 0, cy - 0.05, zk, 'arm', 0.02, 12),                                       // the joint the TV swivels and tilts on
  ];
  const W = p.w + 2 * FRAME, H = p.h + 2 * FRAME, t = FRAME;
  const tv = [
    B(0.2, 0.2, 0.015, 0, cy - 0.1, zb - 0.0075, 'arm'),                                   // VESA plate on the TV's back
    B(p.w, p.h, 0.05, 0, 0, zb + 0.025, 'tvbody'),
    B(p.w - 0.06, p.h - 0.06, 0.01, 0, 0.03, zb + 0.055, 'screen'),
    B(W, t, 0.02, 0, cy + (H - t) / 2 - t / 2, zk + LED_Z + 0.01, 'led'), B(W, t, 0.02, 0, cy - (H - t) / 2 - t / 2, zk + LED_Z + 0.01, 'led'),
    B(t, H, 0.02, (W - t) / 2, cy - H / 2, zk + LED_Z + 0.01, 'led'), B(t, H, 0.02, -(W - t) / 2, cy - H / 2, zk + LED_Z + 0.01, 'led'),
  ];
  tiltX(tv, rad(p.tilt), cy, zk);
  return [...wall, ...at(turnAll(at(tv, 0, 0, -zk), rad(p.swing)), 0, 0, zk)];
}
