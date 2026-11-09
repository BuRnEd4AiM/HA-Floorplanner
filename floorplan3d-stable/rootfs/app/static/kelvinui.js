/* The white tone slider with its value in Kelvin (#564): "Weißton  2700 K · Warmweiß" over a slider coloured from warm to cold. The scene
 * editor (sceneedit.js) and the light controls (livecontrols.js) use it; the rules are in kelvin.js (tested). */
import { kelvinText, kelvinGradient, clampKelvin } from './kelvin.js';

/** o: t, range [low, high], value (Kelvin, or null when the light shows a colour now: the slider stands in the middle, "–"), label (its
 *  text, default "Weißton"), onChange(kelvin) (let go) */
export function kelvinSlider(o) {
  const { t, range: [lo, hi] } = o;
  const box = document.createElement('div'); box.className = 'kelSlider';
  const head = document.createElement('div'); head.className = 'kelHead';
  const name = document.createElement('span'); name.textContent = o.label || t('kel.title');
  const val = document.createElement('b'); val.className = 'kelVal';
  const show = (k) => { val.textContent = k == null ? '–' : kelvinText(k, t); };
  show(o.value == null ? null : clampKelvin(o.value, [lo, hi]));
  head.append(name, val);
  const r = document.createElement('input'); r.type = 'range'; r.className = 'kelRange'; r.min = lo; r.max = hi; r.step = 50;
  r.value = o.value == null ? Math.round((lo + hi) / 2) : clampKelvin(o.value, [lo, hi]);
  r.style.background = kelvinGradient(lo, hi);
  r.addEventListener('input', () => show(+r.value));
  r.addEventListener('change', () => o.onChange(+r.value));
  box.append(head, r);
  return box;
}
