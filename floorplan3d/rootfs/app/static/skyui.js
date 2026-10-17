/* The sky behind the 3D view (#418) and the weather in it (#419): the gradient of the hour as the background of the see-through canvas
 * (the renderer has alpha), stars at night, clouds, the lawn tinted, rain or snow falling over the picture in live mode and the chips at
 * the top right (time and sunset, weather). Costs nothing per frame: the sky is CSS, the rain a CSS animation of `transform` only,
 * standing still in the "fast" performance mode (#138). The colours and texts come from sky.js (tested). */
import { sunNow, approxSun, skyColors, skyCss, starAlpha, groundTint, weatherId, weatherLook, weatherText, sunText, skyTimeOf } from './sky.js';

const STAR_STEPS = 5, TILE = 512;

/** a tile of stars (seeded, the same every time), `alpha` how clearly they show */
function drawStars(alpha) {
  const c = document.createElement('canvas'); c.width = c.height = TILE;
  const g = c.getContext('2d');
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    const x = rnd() * TILE, y = rnd() * TILE, big = rnd() < 0.1;
    g.globalAlpha = alpha * (0.35 + rnd() * 0.65);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, big ? 1.5 : 0.7 + rnd() * 0.5, 0, 7); g.fill();
  }
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
  const stars = new Map(), falls = new Map();
  let lastCss = null, lastTint = '', lastChips = '', lastFall = '';
  const fixed = () => skyTimeOf(ctx.params.get('skytime'), new Date());   // ?skytime=21:30: the sky at that time today (to try it out)
  const on = () => ctx.settings().sky !== 'off' && !ctx.isHolo();
  function starLayer(a) {
    const step = Math.round(a * STAR_STEPS);
    if (!step) return null;
    if (!stars.has(step)) stars.set(step, drawStars(step / STAR_STEPS));
    return `url(${stars.get(step)}) 0 0 / ${TILE}px ${TILE}px`;
  }
  function off() {
    if (lastCss !== null) { ctx.canvas.style.background = ''; lastCss = null; }
    if (lastTint) { ctx.earthTint(null); lastTint = ''; }
    $('#skyChips').hidden = true; lastChips = '';
    $('#wxFall').hidden = true; lastFall = '';
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
    const layers = [starLayer(starAlpha(sun.elev, cloud)), ...(cloud >= 0.3 ? cloudLayers(cloud, sun.elev) : [])].filter(Boolean);
    const css = skyCss(skyColors(sun.elev, sun.rising, cloud), layers);
    if (css !== lastCss) { ctx.canvas.style.background = css; lastCss = css; }
    const tint = groundTint(sun.elev, cloud), tk = tint.join();
    if (tk !== lastTint) { ctx.earthTint(tint); lastTint = tk; }
    const live = ctx.isLive();
    const lines = live ? [sunText(sun, date, t), weatherText(ws, t)].filter(Boolean) : [];
    const ck = lines.join('|');
    if (ck !== lastChips) {
      const box = $('#skyChips');
      box.replaceChildren(...lines.map((l) => { const d = document.createElement('div'); d.className = 'skyChip'; d.textContent = l; return d; }));
      box.hidden = !lines.length; lastChips = ck;
    }
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
