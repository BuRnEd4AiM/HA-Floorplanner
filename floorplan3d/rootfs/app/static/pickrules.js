/* What a tap in the live mode may hit (#234): the live mode is for switching things, so what nobody switches has no hit box there, and a tap
 * meant for a lamp does not land on it by accident. Pure rules (unit test: tests/pickrules.test.mjs), the picking itself is in app.js. */

/** device types without a hit box in the live mode: a presence figure only shows who is home; a sensor (temperature, humidity, CO₂ ...) only
 *  shows a value, which the room and the overviews show too (#236) */
export const LIVE_NO_TAP = new Set(['presence', 'sensor']);

/** true when a hit object (its userData: kind, cone ...) of a device of `type` is ignored by a tap in the live mode:
 *  doors and windows, the field-of-view cone of a camera (only the camera itself can be tapped) and the types above */
export function skipInLive(data, type) {
  if (!data) return false;
  if (data.kind === 'opening' || data.cone) return true;
  return data.kind === 'device' && LIVE_NO_TAP.has(type);
}
