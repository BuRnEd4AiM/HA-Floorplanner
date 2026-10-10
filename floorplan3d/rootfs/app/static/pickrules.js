/* What a tap in the live mode may hit (#234): the live mode is for switching things, so what nobody switches has no hit box there, and a tap
 * meant for a lamp does not land on it by accident. Also which of several things under the pointer wins. Pure rules (unit test:
 * tests/pickrules.test.mjs), the picking itself (the ray into the scene) is in picking.js. */

/** device types without a hit box in the live mode: a presence figure only shows who is home; a sensor (temperature, humidity, CO₂ ...) only
 *  shows a value, which the room and the overviews show too (#236) */
export const LIVE_NO_TAP = new Set(['presence', 'sensor']);

/** true when a hit object (its userData: kind, cone ...) of a device of `type` is ignored by a tap in the live mode:
 *  doors and windows (but the ball of a window's roller shutter, #331), the field-of-view cone of a camera (only the camera itself can be
 *  tapped) and the types above */
export function skipInLive(data, type) {
  if (!data) return false;
  if ((data.kind === 'opening' && !data.tapBall) || data.cone) return true;
  return data.kind === 'device' && LIVE_NO_TAP.has(type);
}

/** in the live mode only what is linked to something can be tapped (a light, a switch, a TV with a backlight, an LED ring with lights) */
export function linkedDevice(d) {
  return !!d && !!(d.entity || d.ledEntity || (d.segs || []).some((s) => s.entity));
}

/** in the live mode a device with a tap ball is tapped on its ball only (#262): a hit on its model (data without tapBall) does not count, so
 *  a tap into the room does not switch something by accident. The sections of an LED ring (data.seg) stay tappable, each is a light of its
 *  own. hasBall(id): the device's ball is shown */
export function ballOnly(data, live, hasBall) {
  return !!live && data?.kind === 'device' && !data.tapBall && data.seg == null && !!hasBall(data.id);
}

/** which of the hits under the pointer wins ([{ data: { kind, id }, distance }], nearest first). Walls never block a tap: a lamp behind a
 *  lowered or see-through wall is still hit. Between a device and a door / window the door / window wins unless the device is clearly in
 *  front of it (more than 1.2 m nearer to the camera); in the live mode only doors / windows linked to something count (openingLinked(id)),
 *  and without a device or an opening a tap lands on the room. In the editor anything else is taken as it comes. */
export function chooseHit(hits, live, openingLinked) {
  const op = hits.find((h) => h.data.kind === 'opening' && (!live || openingLinked(h.data.id)));
  const dv = hits.find((h) => h.data.kind === 'device');
  if (op && dv) return dv.distance < op.distance - 1.2 ? dv : op;
  if (op || dv) return op || dv;
  if (live) return hits.find((h) => h.data.kind === 'room') ?? null;
  return hits[0] ?? null;
}
