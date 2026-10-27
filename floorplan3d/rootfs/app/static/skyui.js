/* The sky behind the 3D view (#418) and the weather in it (#419): the gradient of the hour as the background of the see-through canvas
 * (the renderer has alpha), stars at night, the moon as it is now (moon.js: its phase, where it stands, pale by day), clouds, the lawn tinted, rain or snow falling over the picture in live mode and the chips at
 * the top right (time and sunset, weather); phones have one short line at the bottom instead (#skyLine, #445). Costs nothing per frame:
 * the sky is CSS, the rain a CSS animation of `transform` only, standing still in the "fast" performance mode (#138). The colours and
 * texts come from sky.js (tested). */
import { sunNow, approxSun, skyColors, skyCss, starAlpha, milkyWay, groundTint, weatherId, weatherLook, weatherText, sunText, shortSkyText, skyTimeOf, skyDateOf } from './sky.js';
import { homeGeo, moonPosition, moonPhase, moonSpot, moonAlpha, moonText, PHASE_EMOJI } from './moon.js';

const STAR_STEPS = 5, TILE = 640;

/** a tile of stars (seeded, the same every time), `alpha` how clearly they show: many faint ones, some clearer, a few bright ones with a
 *  soft glow, most white, some bluish or warm. Drawn sharp for the screen's pixels (tablets have two or more per CSS pixel). */
function drawStars(alpha) {
  const px = Math.min(2, window.devicePixelRatio || 1), c = document.createElement('canvas');
  c.width = c.height = Math.round(TILE * px);
  const g = c.getContext('2d'); g.scale(px, px);
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tint = () => { const k = rnd(); return k < 0.16 ? '196,214,255' : k < 0.26 ? '255,230,196' : '255,255,255'; };
  const dot = (x, y, r, a, col) => { g.fillStyle = `rgba(${col},${a.toFixed(3)})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  for (let i = 0; i < 330; i++) dot(rnd() * TILE, rnd() * TILE, 0.4 + rnd() * 0.4, alpha * (0.22 + rnd() * 0.4), tint());
  for (let i = 0; i < 70; i++) dot(rnd() * TILE, rnd() * TILE, 0.8 + rnd() * 0.5, alpha * (0.5 + rnd() * 0.45), tint());
  for (let i = 0; i < 12; i++) {
    const r = 5 + rnd() * 5, x = r + rnd() * (TILE - 2 * r), y = r + rnd() * (TILE - 2 * r), col = tint();   // the glow stays inside the tile
    const glow = g.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, `rgba(${col},${(0.4 * alpha).toFixed(3)})`); glow.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = glow; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    dot(x, y, 1.2 + rnd() * 0.6, alpha, col);
  }
  return c.toDataURL();
}
/* the grey seas of the moon's face as seen from the north (x right, y down, in radii): Imbrium, Serenitatis, Tranquillitatis, Crisium,
 * Procellarum, Nubium, Fecunditatis */
const SEAS = [[-0.35, -0.38, 0.28, 0.22], [0.12, -0.33, 0.16, 0.14], [0.28, -0.05, 0.2, 0.16], [0.62, -0.25, 0.11, 0.09], [-0.55, 0, 0.25, 0.38],
  [-0.18, 0.38, 0.18, 0.13], [0.5, 0.18, 0.13, 0.15]];

/** the moon as a picture: the lit part as it is now (its edge an ellipse), its seas, at night the dark part faint (earthshine) and a soft
 *  glow (`night` 0..1). `size` the disc in CSS pixels, the picture three times as wide for the glow; `right` the lit side; `south` upside
 *  down (as it looks from the southern half of the earth) */
function drawMoon(fraction, right, alpha, night, size, south) {
  const px = Math.min(2, window.devicePixelRatio || 1), S = size * 3, c = document.createElement('canvas');
  c.width = c.height = Math.round(S * px);
  const g = c.getContext('2d'); g.scale(px, px);
  const cx = S / 2, cy = S / 2, r = size / 2, a = (k) => (k * alpha).toFixed(3);
  if (night > 0) {
    const gl = g.createRadialGradient(cx, cy, r * 0.9, cx, cy, S / 2);
    gl.addColorStop(0, `rgba(232,238,255,${a(0.3 * night * fraction)})`); gl.addColorStop(1, 'rgba(232,238,255,0)');
    g.fillStyle = gl; g.fillRect(0, 0, S, S);
    g.fillStyle = `rgba(74,82,104,${a(0.4 * night)})`; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  }
  const k = 2 * fraction - 1;                                       // -1 new, 0 half, 1 full
  if (!right) { g.translate(S, 0); g.scale(-1, 1); }
  g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);   // the lit half, then back along the edge of light and dark
  g.ellipse(cx, cy, r * Math.abs(k), r, 0, Math.PI / 2, k > 0 ? 1.5 * Math.PI : -Math.PI / 2, k < 0);
  g.closePath(); g.clip();
  g.setTransform(px, 0, 0, px, 0, 0);                               // the clip stays, the face is not mirrored
  const lit = g.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
  lit.addColorStop(0, `rgba(250,248,238,${a(1)})`); lit.addColorStop(1, `rgba(214,209,194,${a(1)})`);
  g.fillStyle = lit; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  g.fillStyle = `rgba(150,150,142,${a(0.3)})`;
  SEAS.forEach(([x, y, w, h]) => { const f = south ? -1 : 1; g.beginPath(); g.ellipse(cx + f * x * r, cy + f * y * r, w * r, h * r, 0, 0, 7); g.fill(); });
  return c.toDataURL();
}
/** a tile of falling rain (streaks) or snow (flakes) */
function drawFall(kind, heavy) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  let seed = kind === 'snow' ? 5 : 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = kind === 'snow' ? (heavy ? 90 : 55) : (heavy ? 130 : 70);
  for (let i = 0; i < n; i++) {
    const x = rnd() * 256, y = rnd() * 256;
    if (kind === 'snow') {
      g.fillStyle = `rgba(255,255,255,${0.5 + rnd() * 0.45})`; g.beginPath(); g.arc(x, y, 1 + rnd() * 1.8, 0, 7); g.fill();
    } else {
      const len = 12 + rnd() * 14;
      g.strokeStyle = `rgba(215,228,245,${0.22 + rnd() * 0.3})`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * 0.15, y + len); g.stroke();
    }
  }
  return c.toDataURL();
}
/** soft clouds in front of the gradient: lighter by day, dark grey at night */
function cloudLayers(cloud, elev) {
  const day = Math.max(0, Math.min(1, (elev + 6) / 14)), a = (0.25 + 0.4 * cloud).toFixed(2);
  const col = day > 0.5 ? '228,232,238' : day > 0.1 ? '150,140,160' : '40,46,60';
  return [[20, 8, 30, 14], [62, 4, 36, 16], [88, 14, 26, 12], [40, 18, 30, 10]].slice(0, cloud > 0.7 ? 4 : 3)
    .map(([x, y, w, h]) => `radial-gradient(ellipse ${w}% ${h}% at ${x}% ${y}%, rgba(${col},${a}), rgba(${col},0) 70%)`);
}

/** ctx: $, t, canvas, settings(), states(), isLive(), isHolo(), low() (fast performance mode), earthTint([r, g, b] | null), params (URLSearchParams) */
export function initSky(ctx) {
  const { $, t } = ctx;
  const stars = new Map(), falls = new Map(), moons = new Map();
  let lastCss = null, lastTint = '', lastChips = '', lastLine = '', lastFall = '';
  const fixed = () => {                     // ?skytime=21:30: the sky at that time today, ?skydate=2026-11-01 on that day (to try it out)
    const day = skyDateOf(ctx.params.get('skydate'), new Date());
    return skyTimeOf(ctx.params.get('skytime'), day || new Date()) || day;
  };
  const on = () => ctx.settings().sky !== 'off' && !ctx.isHolo();
  function starLayer(a) {
    const step = Math.round(a * STAR_STEPS);
    if (!step) return null;
    if (!stars.has(step)) stars.set(step, drawStars(step / STAR_STEPS));
    return `url(${stars.get(step)}) 0 0 / ${TILE}px ${TILE}px`;
  }
  /** the moon's layer in the sky, or null while it is under the horizon or hidden by clouds */
  function moonLayer(date, elev, cloud) {
    const geo = homeGeo(ctx.states(), date), phase = moonPhase(date), spot = moonSpot(moonPosition(date, geo.lat, geo.lon), phase, geo.lat);
    const alpha = spot.show ? Math.round(moonAlpha(elev, cloud, phase.fraction) * 20) / 20 : 0;
    if (!alpha) return { phase, css: null };
    const size = ctx.canvas.clientWidth < 700 ? 30 : 44, night = Math.round(Math.max(0, Math.min(1, -elev / 8)) * 10) / 10;
    const f = Math.round(phase.fraction * 40) / 40, key = [f, spot.right, alpha, night, size, geo.lat < 0].join('|');
    if (!moons.has(key)) { if (moons.size > 24) moons.clear(); moons.set(key, drawMoon(f, spot.right, alpha, night, size, geo.lat < 0)); }
    return { phase, css: `url(${moons.get(key)}) ${spot.x}% ${spot.y}% / ${size * 3}px ${size * 3}px no-repeat` };
  }
  function off() {
    if (lastCss !== null) { ctx.canvas.style.background = ''; lastCss = null; }
    if (lastTint) { ctx.earthTint(null); lastTint = ''; }
    $('#skyChips').hidden = true; lastChips = '';
    line('');
    $('#wxFall').hidden = true; lastFall = '';
  }
  /** the short line at the bottom of a phone (style.css shows it there only; the view buttons move up for it) */
  function line(text) {
    if (text === lastLine) return;
    const el = $('#skyLine');
    el.textContent = text; el.hidden = !text; document.body.classList.toggle('skyline', !!text); lastLine = text;
  }
  /** the weather entity's state and how it looks; nulls without one */
  function weather() {
    const states = ctx.states(), id = weatherId(states, ctx.settings().weatherEntity), s = id ? states[id] : null;
    return { s, look: s ? weatherLook(s.state) : null };
  }
  /** draw the sky for now; called each minute, on new states and when the settings or the mode change */
  function apply() {
    if (!on()) { off(); return; }
    const at = fixed(), date = at || new Date();
    const sun = at ? approxSun(date) : sunNow(ctx.states(), date);
    const { s: ws, look } = weather(), cloud = look?.cloud || 0;
    const sa = starAlpha(sun.elev, cloud), moon = moonLayer(date, sun.elev, cloud);   // the clouds in front, the moon, stars and Milky Way behind them
    const layers = [...(cloud >= 0.3 ? cloudLayers(cloud, sun.elev) : []), moon.css, starLayer(sa), milkyWay(sa)].filter(Boolean);
    const css = skyCss(skyColors(sun.elev, sun.rising, cloud), layers);
    if (css !== lastCss) { ctx.canvas.style.background = css; lastCss = css; }
    const tint = groundTint(sun.elev, cloud), tk = tint.join();
    if (tk !== lastTint) { ctx.earthTint(tint); lastTint = tk; }
    const live = ctx.isLive();
    const lines = live ? [sunText(sun, date, t, PHASE_EMOJI[moon.phase.key]), moonText(moon.phase, t), weatherText(ws, t)].filter(Boolean) : [];
    const ck = lines.join('|');
    if (ck !== lastChips) {
      const box = $('#skyChips');
      box.replaceChildren(...lines.map((l) => { const d = document.createElement('div'); d.className = 'skyChip'; d.textContent = l; return d; }));
      box.hidden = !lines.length; lastChips = ck;
    }
    line(live ? shortSkyText(sun, date, ws, t, PHASE_EMOJI[moon.phase.key]) : '');
    const fk = live && look?.fall ? `${look.fall}${look.heavy ? '+' : ''}` : '';
    const still = !!ctx.low();
    if (fk + still !== lastFall) {
      const el = $('#wxFall');
      el.hidden = !fk;
      if (fk) {
        if (!falls.has(fk)) falls.set(fk, drawFall(look.fall, look.heavy));
        el.className = `${look.fall}${look.heavy ? ' heavy' : ''}${still ? ' still' : ''}`;
        el.style.setProperty('--fall', `url(${falls.get(fk)})`);
      }
      lastFall = fk + still;
    }
  }
  setInterval(apply, 60000);
  return { apply, on };
}
