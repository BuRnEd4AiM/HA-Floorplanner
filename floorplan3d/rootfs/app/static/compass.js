/* Compass (3D view): the ring with N / E / S / W stands still (north is up), only the needle turns to where the camera looks.
 * The angle keeps counting beyond 360 degrees (see unwrap), otherwise the needle would spin all the way back at the jump from 359 to 0. */

/** the angle that means the same direction as `next` (modulo 360) but lies closest to `prev`: continuous, may grow beyond +-360 */
export function unwrap(prev, next) {
  const d = ((((next - prev) % 360) + 540) % 360) - 180;
  return prev + d;
}
/** degrees clockwise from north the camera looks to; dx, dz = camera minus target (x to the east, z to the south) */
export const headingOf = (dx, dz) => (Math.atan2(-dx, dz) * 180) / Math.PI;
/** index 0..7 (N, NE, E, SE, S, SW, W, NW) of the side of the house we look from */
export const sideIndex = (dx, dz) => Math.round((((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360) / 45) % 8;

/** ctx: $, t, camera, controls */
export function initCompass(ctx) {
  const { $, t } = ctx;
  let shown = '', angle = 0;               // what the compass shows right now (it is only redrawn when something changed) and the continuous needle angle
  function update() {
    const dx = ctx.camera.position.x - ctx.controls.target.x, dz = ctx.camera.position.z - ctx.controls.target.z;
    if (Math.hypot(dx, dz) < 1e-6) return;
    const next = unwrap(angle, headingOf(dx, dz));
    const text = t('compass.from', { d: t('compass.dirs').split(',')[sideIndex(dx, dz)] });
    const key = `${Math.round(next)}|${text}`;
    if (key === shown) return;
    shown = key; angle = next;
    $('#compassNeedle').setAttribute('transform', `rotate(${next.toFixed(1)})`);
    $('#compassFrom').textContent = text;
    const letters = t('compass.letters').split(',');                      // N, E, S, W in this language
    document.querySelectorAll('#compassRose .cL').forEach((el, i) => { el.textContent = letters[i] || el.textContent; });
  }
  return { update };
}
