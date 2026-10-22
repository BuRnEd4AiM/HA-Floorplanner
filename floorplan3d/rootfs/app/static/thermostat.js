/* A thermostat like Home Assistant's own card (#495): a circle with the target to drag, the temperature now on it, − / + below, the modes
 * (Heizen, Auto, Aus … as the device offers them), its presets and fan modes; large or small. Pure (unit test: tests/thermostat.test.mjs):
 * the arc, the angle of a value and the value under the finger; thermostatui.js draws it, the page 🌡 Klima and the own card "Thermostat"
 * use it. */
import { clampTarget } from './heatpanel.js';

/** the modes in Home Assistant's order, with their symbols */
export const MODE_ORDER = ['heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only', 'off'];
export const MODE_ICON = { heat: '🔥', cool: '❄️', heat_cool: '♨️', auto: '⟳', dry: '💧', fan_only: '🌀', off: '⏻' };
export const SIZES = ['big', 'small'];
/** the circle: open at the bottom, from 135° (bottom left) clockwise over the top to 405° (bottom right) */
export const START = 135, SWEEP = 270;

/** the limits of a thermostat: { lo, hi, step } (7 to 30 °C, step 0.5 when it does not say) */
export function limits(s) {
  const lo = Number.isFinite(s?.tmin) ? s.tmin : 7, hi = Number.isFinite(s?.tmax) && s.tmax > lo ? s.tmax : Math.max(lo + 1, 30);
  return { lo, hi, step: s?.tstep > 0 ? s.tstep : 0.5 };
}
/** the angle (degrees, as in START) of a value between lo and hi; values outside sit at the ends */
export function angleOf(v, lo, hi) {
  const k = hi > lo ? (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) : 0;
  return START + k * SWEEP;
}
/** a point on the circle round (cx, cy) with radius r at an angle in degrees */
export function pointAt(cx, cy, r, a) {
  const rad = (a * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}
/** the SVG path of the arc from angle a0 to a1 (clockwise) */
export function arcPath(cx, cy, r, a0, a1) {
  const [x0, y0] = pointAt(cx, cy, r, a0), [x1, y1] = pointAt(cx, cy, r, Math.max(a0 + 0.01, a1));
  const f = (n) => Number(n.toFixed(2));
  return `M${f(x0)} ${f(y0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`;
}
/** the value under the finger at (x, y) for the circle round (cx, cy): on the thermostat's steps and inside its limits; in the gap at the
 *  bottom the nearer end */
export function valueAt(x, y, cx, cy, s) {
  const { lo, hi } = limits(s);
  let a = ((Math.atan2(y - cy, x - cx) * 180) / Math.PI - START + 720) % 360;
  if (a > SWEEP) a = a - SWEEP < (360 - SWEEP) / 2 ? SWEEP : 0;
  return clampTarget(s, lo + (a / SWEEP) * (hi - lo));
}

/** the colour of the circle: heat (orange), cool (blue), auto (green to orange), dry / fan (grey-blue) or off (grey) */
export function tone(s) {
  const m = s?.state;
  if (!m || m === 'off' || m === 'unavailable' || m === 'unknown') return 'off';
  if (m === 'cool') return 'cool';
  if (m === 'auto' || m === 'heat_cool') return 'auto';
  if (m === 'dry' || m === 'fan_only') return 'fan';
  return 'heat';
}

/**
 * What the card of a thermostat shows: { now (°C or null), target (the wanted one, a target being tapped in first; null when off or there
 * is none), off, tone, action ('heating' | 'cooling' | 'idle' | 'off'), modes: [{ key, icon, on }] in Home Assistant's order, presets /
 * fans: { list, value } or null, lo, hi, step }; null for no state.
 */
export function thermoModel(s, wanted = null) {
  if (!s) return null;
  const { lo, hi, step } = limits(s);
  const off = s.state === 'off';
  const t = typeof wanted === 'number' ? wanted : s.tt;
  const order = (m) => (MODE_ORDER.includes(m) ? MODE_ORDER.indexOf(m) : MODE_ORDER.length);
  const modes = (Array.isArray(s.modes) ? s.modes : []).filter((m) => typeof m === 'string').slice()
    .sort((a, b) => order(a) - order(b)).map((key) => ({ key, icon: MODE_ICON[key] || '•', on: key === s.state }));
  const c = s.ctl || {};
  return {
    now: typeof s.ct === 'number' ? s.ct : null,
    target: !off && typeof t === 'number' ? t : null,
    off, tone: tone(s), action: off ? 'off' : s.hvac || 'idle', modes,
    presets: Array.isArray(c.presets) && c.presets.length ? { list: c.presets, value: c.preset || '' } : null,
    fans: Array.isArray(c.fans) && c.fans.length ? { list: c.fans, value: c.fan || '' } : null,
    lo, hi, step,
  };
}

/** a card's size: 'big' or 'small' (anything else: big) */
export const cleanSize = (v) => (SIZES.includes(v) ? v : 'big');
