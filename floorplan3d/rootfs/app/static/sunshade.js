/* ☀ Sonnenschutz (5.15.0) on the page: whether the sun shines on a window now, the way a window looks as words, and what the card says
 * of a shutter. The add-on decides (sunshade.py); this is only what the card shows while it has not said it yet. Pure (unit test:
 * tests/sunshade.test.mjs). */

/** the angle between two compass directions, 0 … 180 */
export function offAngle(a, b) {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return Math.min(d, 360 - d);
}

/** does the sun shine on a window looking to bearing (as sunshade.hits) */
export function hits(cfg, bearing, sun) {
  if (bearing == null || !sun || !cfg) return false;
  return sun.elev >= cfg.elev && offAngle(sun.az, bearing) <= cfg.angle;
}

/** N, NO, O … of a bearing (the keys of the texts ss.dir.*) */
export const DIRS = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
export const dirOf = (bearing) => (bearing == null ? null : DIRS[Math.floor((((bearing % 360) + 360) % 360 + 22.5) / 45) % 8]);

/** what the card says of a shutter: { k (sun | down | hand | shade | open | cool | clouds | nopos | skip | none | nodir), pos }; st: what the add-on
 *  said of it (status.sun[cover]) or nothing (it has not looked yet, or the rule is off: then the sun alone) */
export function shutterState(w, cfg, st, sun, skipped) {
  if (skipped) return { k: 'skip' };
  if (w.bearing == null) return { k: 'nodir' };
  if (st) {
    if (st.hand) return { k: 'hand', pos: st.pos };
    if (st.down) return { k: 'down', pos: st.pos, until: st.until };
    return { k: st.why === 'sun' ? 'sun' : st.why || 'shade', pos: st.pos };
  }
  return { k: hits(cfg, w.bearing, sun) ? 'sun' : 'shade' };
}

/** a limit of temperature that can be "egal" (null): the next value of − / + (null below the lowest, back from null at start) */
export function stepLimit(v, d, { min = 10, max = 40, start = 22 } = {}) {
  if (v == null) return d > 0 ? start : null;
  const n = Math.round((v + d) * 2) / 2;
  return n < min ? null : Math.min(max, n);
}

/** which way the top of plan `layout` looks (layout.north, degrees clockwise from north; 0: north is up), as roommap.north_of */
export function northOf(layout) {
  const v = layout?.north;
  return typeof v === 'number' && Number.isFinite(v) ? ((v % 360) + 360) % 360 : 0;
}
/** the next value of north for − / + (step degrees), always 0 … 359 */
export const turnNorth = (v, step) => ((Math.round((v + step) / 5) * 5) % 360 + 360) % 360;
/** the way window w looks now: in the house shown with the north set on this page (it may not be saved yet), else as the add-on said */
export function bearingNow(w, houseId, north) {
  return w.house === houseId && w.plan != null ? Math.round(((w.plan + north) % 360) * 10) / 10 : w.bearing ?? null;
}

/** ☀ the own routines that move cover e too (blocks "Rollladen" of ▶ Abläufe): their names, so the card says it (the sun rule leaves a
 *  shutter alone that something else moved, the owner: "pass auf das die regeln sich dann nicht beißen") */
export function otherRules(flows, e) {
  return (flows || []).filter((f) => f.on && (f.lanes || []).some((l) => (l.blocks || []).some((b) => b.k === 'cover' && (b.ents || []).includes(e))))
    .map((f) => f.name).filter(Boolean);
}
