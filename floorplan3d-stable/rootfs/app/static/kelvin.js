/* White tones in Kelvin (#564, the owner: "bei Lampen zum Beispiel so eine Kelvin-Anzeige"): the range of white tones a light can do (Home
 * Assistant says it: min/max_color_temp_kelvin, the server's kmin/kmax), a white tone as a colour to show and in words, the colours of the
 * slider. Pure (unit test: tests/kelvin.test.mjs); the slider is kelvinui.js, used by the scene editor and the light controls. */

export const K_LOW = 2000, K_HIGH = 6500;          // the range when a light does not say (Home Assistant turns a white tone into a colour then)
const num = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const r100 = (v) => Math.round(v / 100) * 100;

/** a white tone as a colour to show */
export function kelvinRgb(k) {
  const t = Math.max(0, Math.min(1, (k - 2000) / 4500));
  return [255, Math.round(170 + 75 * t), Math.round(80 + 175 * t)];
}

/** the white tones of one light ([low, high]), the usual ones when it does not say */
export function lightRange(st) {
  const lo = st?.kmin, hi = st?.kmax;
  return num(lo) && num(hi) && hi > lo ? [r100(lo), r100(hi)] : [K_LOW, K_HIGH];
}

/** the white tones the lights can do together ([low, high]); null when none of them says it can do white tones */
export function kelvinRange(states) {
  const known = (states || []).filter((s) => num(s?.kmin) && num(s?.kmax) && s.kmax > s.kmin);
  if (!known.length) return null;
  const lo = Math.max(...known.map((s) => s.kmin)), hi = Math.min(...known.map((s) => s.kmax));
  return lo < hi ? [r100(lo), r100(hi)] : [r100(Math.min(...known.map((s) => s.kmin))), r100(Math.max(...known.map((s) => s.kmax)))];
}

/** the white tone a light shows now (only in its white mode, the server's kel), else null */
export const kelvinNow = (st) => (num(st?.kel) ? Math.round(st.kel) : null);

/** a white tone in a word: 'warm' (candle to light bulb), 'neutral', 'cold' (daylight) */
export const kelvinWord = (k) => (k < 3300 ? 'warm' : k < 5300 ? 'neutral' : 'cold');

/** "2700 K · Warmweiß"; t('kel.warm') … */
export const kelvinText = (k, t) => `${Math.round(k)} K · ${t(`kel.${kelvinWord(k)}`)}`;

/** the slider's background from its warm to its cold end */
export function kelvinGradient(lo, hi) {
  const at = (k) => `rgb(${kelvinRgb(k).join(', ')})`;
  return `linear-gradient(90deg, ${at(lo)}, ${at((lo + hi) / 2)}, ${at(hi)})`;
}

/** a value of the slider kept in the range, in steps of 50 K */
export function clampKelvin(v, [lo, hi]) {
  return Math.max(lo, Math.min(hi, Math.round(v / 50) * 50));
}
