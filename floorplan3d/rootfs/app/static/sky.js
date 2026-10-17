/* Sky behind the 3D view (#418) and the weather in it (#419): where the sun is, which colours the sky has then, how the lawn is tinted,
 * what the weather entity looks like in the sky and as text. Pure (no three.js, no DOM): unit test tests/sky.test.mjs; skyui.js draws.
 * The sun comes from Home Assistant's sun.sun (the add-on sends `sun: { elev, rising, rise, set }`), without it from the clock. */

const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** the time zone's offset without summer time in minutes (as getTimezoneOffset: west positive) */
function stdOffset(date) {
  const y = date.getFullYear();
  return Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
}

/**
 * The sun from date and clock alone (no sun.sun): latitude `lat`, longitude from the time zone without summer time (15° per hour).
 * Good enough for the colour of the sky. { elev (degrees), rising (before noon), rise, set (the next sunrise / sunset as Date, null in
 * polar day or night) }
 */
export function approxSun(date, lat = 50, lon = -stdOffset(date) / 4) {
  const n = (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 864e5;   // day of the year (UTC, with fraction)
  const decl = -23.44 * Math.cos((2 * Math.PI * (Math.floor(n) + 10)) / 365);
  const b = (2 * Math.PI * (Math.floor(n) - 81)) / 364;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);    // equation of time, minutes
  const utc = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const ha = 15 * (utc + lon / 15 + eot / 60 - 12);                               // hour angle, degrees (0 at noon)
  const sinE = Math.sin(lat * D2R) * Math.sin(decl * D2R) + Math.cos(lat * D2R) * Math.cos(decl * D2R) * Math.cos(ha * D2R);
  const elev = Math.asin(clamp(sinE, -1, 1)) / D2R;
  const cosH0 = (Math.sin(-0.833 * D2R) - Math.sin(lat * D2R) * Math.sin(decl * D2R)) / (Math.cos(lat * D2R) * Math.cos(decl * D2R));
  let rise = null, set = null;
  if (cosH0 >= -1 && cosH0 <= 1) {
    const h0 = Math.acos(cosH0) / D2R, noon = 12 - lon / 15 - eot / 60;             // UTC hours
    const day0 = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const at = (hours) => { let t = day0 + hours * 36e5; while (t <= date.getTime()) t += 864e5; return new Date(t); };
    rise = at(noon - h0 / 15); set = at(noon + h0 / 15);
  }
  return { elev, rising: ((ha % 360) + 360) % 360 > 180, rise, set };
}

/** the sun now: sun.sun of Home Assistant when it reports its elevation, else approxSun */
export function sunNow(states, date) {
  const s = states?.['sun.sun']?.sun;
  if (s && Number.isFinite(s.elev)) {
    const d = (v) => { const x = v ? new Date(v) : null; return x && !isNaN(x) ? x : null; };
    return { elev: s.elev, rising: !!s.rising, rise: d(s.rise), set: d(s.set) };
  }
  return approxSun(date);
}

/** night | dawn | morning | day | evening | dusk */
export function skyPhase(elev, rising) {
  if (elev < -6) return 'night';
  if (elev < 0) return rising ? 'dawn' : 'dusk';
  if (elev < 8) return rising ? 'morning' : 'evening';
  return 'day';
}
export const PHASE_ICON = { night: '🌙', dawn: '🌄', morning: '🌅', day: '☀️', evening: '🌇', dusk: '🌆' };

/* colours of the sky (top, middle, near the horizon) at a sun elevation; in between they blend */
const KEYS = [
  [-18, ['#02040c', '#060b1f', '#0d1636']],
  [-10, ['#050a1d', '#0d1838', '#1d2a58']],
  [-4, ['#151b45', '#3c3a7a', '#b0607e']],
  [0, ['#2b2d5b', '#8e5ea2', '#f79a5e']],
  [5, ['#3a5fa8', '#c08aa0', '#ffc27a']],
  [12, ['#2f6bc4', '#79aee6', '#d6e9fa']],
  [40, ['#2a63bd', '#5d9be0', '#bfe0fb']],
];
/* how the lawn (and the earth's sides) is tinted at a sun elevation: [r, g, b] factors */
const GROUND = [[-12, [0.32, 0.36, 0.52]], [-4, [0.5, 0.5, 0.66]], [0, [0.82, 0.72, 0.68]], [6, [0.96, 0.86, 0.74]], [14, [1, 1, 1]]];

export const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const rgbHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
/** the value of a table [[x, value], ...] at x, blended between its neighbours (value: number array) */
function blend(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, v1] = table[i];
    if (x <= x1) { const [x0, v0] = table[i - 1]; return lerp(v0, v1, (x - x0) / (x1 - x0)); }
  }
  return table[table.length - 1][1];
}

/** grey of the same brightness, a little blue */
function grey(c) { const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; return [l * 0.96, l, l * 1.06]; }

/**
 * The colours of the sky: { top, mid, low } as '#rrggbb'. rising: the morning horizon is a little pinker than the evening one;
 * cloud 0..1: clouds turn it grey and darker.
 */
export function skyColors(elev, rising = false, cloud = 0) {
  const k = clamp(cloud, 0, 1);
  const parts = [0, 1, 2].map((i) => blend(KEYS.map(([e, cs]) => [e, hexRgb(cs[i])]), elev));
  if (rising && elev > -6 && elev < 8) parts[2] = lerp(parts[2], hexRgb('#f2a0b4'), 0.3 * (1 - Math.abs(elev - 1) / 7));
  const [top, mid, low] = parts.map((c) => lerp(c, grey(c), k * 0.85).map((v) => v * (1 - 0.25 * k)));
  return { top: rgbHex(top), mid: rgbHex(mid), low: rgbHex(low) };
}

/** how clearly the stars show (0..1): only at night and without clouds */
export const starAlpha = (elev, cloud = 0) => clamp((-elev - 4) / 8, 0, 1) * (1 - clamp(cloud, 0, 1));

/** the lawn's tint [r, g, b]: darker and bluer at night, warmer at sunrise and sunset, a little darker under clouds */
export function groundTint(elev, cloud = 0) {
  const k = 1 - 0.2 * clamp(cloud, 0, 1);
  return blend(GROUND, elev).map((v) => +(v * k).toFixed(3));
}

/** the CSS background of the sky: the gradient from the horizon (bottom) to the top; extra layers (stars, clouds) go in front */
export function skyCss(c, layers = []) {
  return [...layers, `linear-gradient(to top, ${c.low} 0%, ${c.mid} 45%, ${c.top} 100%)`].join(', ');
}

/* the states of Home Assistant's weather entities: how cloudy the sky is (0..1), what falls (rain | snow) and the symbol */
const WX = {
  'clear-night': { cloud: 0, icon: '🌙' }, sunny: { cloud: 0, icon: '☀️' }, partlycloudy: { cloud: 0.35, icon: '⛅' }, cloudy: { cloud: 0.75, icon: '☁️' },
  fog: { cloud: 0.85, icon: '🌫️' }, windy: { cloud: 0.2, icon: '💨' }, 'windy-variant': { cloud: 0.5, icon: '💨' }, exceptional: { cloud: 0.6, icon: '⚠️' },
  rainy: { cloud: 0.8, fall: 'rain', icon: '🌧️' }, pouring: { cloud: 0.95, fall: 'rain', heavy: true, icon: '🌧️' },
  'lightning-rainy': { cloud: 0.95, fall: 'rain', heavy: true, icon: '⛈️' }, lightning: { cloud: 0.85, icon: '🌩️' },
  hail: { cloud: 0.9, fall: 'rain', heavy: true, icon: '🌨️' }, snowy: { cloud: 0.75, fall: 'snow', icon: '🌨️' }, 'snowy-rainy': { cloud: 0.85, fall: 'snow', icon: '🌨️' },
};
export const WEATHER_STATES = Object.keys(WX);

/** the weather entity to use: `id` when given (and known), else the first weather.* there is; null without one */
export function weatherId(states, id = '') {
  if (id) return states?.[id] ? id : null;
  return Object.keys(states || {}).find((k) => k.startsWith('weather.')) || null;
}

/** what the weather looks like: { key (the state), cloud, fall (rain | snow | null), heavy, icon }; null for an unknown state */
export function weatherLook(state) {
  const w = WX[state];
  return w ? { key: state, cloud: w.cloud, fall: w.fall || null, heavy: !!w.heavy, icon: w.icon } : null;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
/** the weather as a line: "🌧️ Regen · 11 °C · Wind 24 km/h" (s: the entity's state with `wx: { t, tu, w, wu }`); null without a known state */
export function weatherText(s, t) {
  const look = s && weatherLook(s.state);
  if (!look) return null;
  const parts = [`${look.icon} ${t(`wx.${look.key}`)}`];
  const temp = num(s.wx?.t), wind = num(s.wx?.w);
  if (temp !== null) parts.push(`${Math.round(temp)} ${s.wx.tu || '°C'}`);
  if (wind !== null) parts.push(t('wx.wind', { v: `${Math.round(wind)} ${s.wx.wu || 'km/h'}` }));
  return parts.join(' · ');
}

const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
/** the line of the time chip: "🌇 Abend · 18:45 · Sonnenuntergang 18:52" (the next sunset while the sun is up, else the next sunrise) */
export function sunText(sun, date, t) {
  const ph = skyPhase(sun.elev, sun.rising);
  const parts = [`${PHASE_ICON[ph]} ${t(`sky.${ph}`)}`, hhmm(date)];
  const up = sun.elev > -0.833;
  const next = up ? sun.set : sun.rise;
  if (next) parts.push(t(up ? 'sky.set' : 'sky.rise', { t: hhmm(next) }));
  return parts.join(' · ');
}

/** "HH:MM" of the address (?skytime=21:30) as that time today, for trying the sky out; null for anything else */
export function skyTimeOf(text, today) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(text || '').trim());
  if (!m || +m[1] > 23 || +m[2] > 59) return null;
  const d = new Date(today); d.setHours(+m[1], +m[2], 0, 0);
  return d;
}
