/* 🍏 Glas (5.37.0, the owner's wish 2026-11-26: "ein Theme, dass es so aussieht, als wäre es von Apple … die Hintergründe", "auch unten die
 * Leiste und alles drum und dran"; "nur ein Design … eine Option und kein Muss"; the pictures in docs/ideen-5.37): two more designs next to
 * Hologramm, Dunkel and Hell: "glass" (dark) and "glasslight". Never the default. They build on the dark and the light theme (<html
 * data-theme> stays "dark" / "light", so every rule of those still holds) and add <html data-glass="dark|light">: cards and bars of milk
 * glass (style.css, "Glas-Design"), and behind the pages the own house, blurred (like picture 3 the owner liked). The picture is taken from
 * the 3D view once per house (kept in this browser), made small, soft and darker (or lighter) here and set as --glass-wall; style.css has
 * colours to fall back on. The rules are pure (tests/glasstheme.test.mjs); initGlassWall takes the picture. */

/** the glass designs and the theme each builds on */
export const GLASS = { glass: 'dark', glasslight: 'light' };
/** a glass design? */
export const isGlass = (theme) => Object.prototype.hasOwnProperty.call(GLASS, theme);
/** the theme the 3D view and every other rule use: glass -> dark, glasslight -> light, the others stay */
export const baseTheme = (theme) => GLASS[theme] || theme;
/** what <html data-glass> gets: 'dark', 'light' or null (no glass) */
export const glassMode = (theme) => GLASS[theme] || null;

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
/** one pixel of the wall picture: dark glass a little more colourful and darker (55 %), light glass lighter and mixed with white (55 %),
 *  so the cards stay easy to read on it. [r, g, b] -> [r, g, b] */
export function tone([r, g, b], mode) {
  const grey = 0.299 * r + 0.587 * g + 0.114 * b, sat = 1.4;
  let c = [r, g, b].map((v) => grey + (v - grey) * sat);
  if (mode === 'light') c = c.map((v) => v * 1.2 * 0.45 + 247 * 0.55);
  else c = c.map((v) => v * 0.55);
  return c.map(clamp);
}
/** the size of the small, soft picture: about `px` pixels on the long side, the shape of the view; null for an empty view */
export function wallSize(w, h, px = 160) {
  if (!(w > 0 && h > 0)) return null;
  const k = px / Math.max(w, h);
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}
/** the colours of the sky behind a see-through 3D view, from its CSS background (skyui.js puts a gradient there, stars and moon as
 *  pictures): [top, bottom] of the first gradient, or the fallback */
export function skyColors(css, fallback) {
  const at = String(css || '').indexOf('gradient(');
  if (at < 0) return fallback;
  const cols = String(css).slice(at).match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi);
  return cols && cols.length ? [cols[0], cols[cols.length - 1]] : fallback;
}
/** the key the picture is kept under in this browser, one per house */
export const wallKey = (houseId) => `fp.glassWall.${houseId || 'default'}`;

/** ctx: canvas (the 3D view), render() (draws it once, so it can be read right after), houseId(), theme() (the chosen design), sky()
 *  ([top, bottom] colours behind a see-through sky), ready() (the house is built: before that no picture is taken). Returns { update(force) }: sets the picture of this house (taken now when there is
 *  none yet or force) while a glass design is chosen. */
export function initGlassWall(ctx) {
  const root = document.documentElement;
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const keep = (k, v) => { try { localStorage.setItem(k, v); } catch { /* full or blocked: only this visit */ } };
  let shownFor = '';
  const taken = new Set();                                           // pictures taken on this visit: the kept one is shown at once, then made new once
  /** the picture of the 3D view, small, soft and toned for the mode; null when the view cannot be read */
  function take(mode) {
    const src = ctx.canvas, size = wallSize(src?.width, src?.height);
    if (!size) return null;
    try {
      ctx.render();
      const tiny = document.createElement('canvas');                 // first very small: that is the blur
      tiny.width = Math.max(1, Math.round(size.w / 5)); tiny.height = Math.max(1, Math.round(size.h / 5));
      const t = tiny.getContext('2d');
      const [top, bottom] = ctx.sky?.() || ['#3b4a7a', '#c9a98a'];
      const g = t.createLinearGradient(0, 0, 0, tiny.height); g.addColorStop(0, top); g.addColorStop(1, bottom);
      t.fillStyle = g; t.fillRect(0, 0, tiny.width, tiny.height);   // behind a see-through sky
      t.imageSmoothingQuality = 'high';
      t.drawImage(src, 0, 0, tiny.width, tiny.height);
      const out = document.createElement('canvas');                  // then larger again, smooth: soft colour fields
      out.width = size.w; out.height = size.h;
      const o = out.getContext('2d');
      o.imageSmoothingQuality = 'high';
      o.drawImage(tiny, 0, 0, size.w, size.h);
      const img = o.getImageData(0, 0, size.w, size.h), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const [r, gg, b] = tone([d[i], d[i + 1], d[i + 2]], mode); d[i] = r; d[i + 1] = gg; d[i + 2] = b; }
      o.putImageData(img, 0, 0);
      return out.toDataURL('image/jpeg', 0.85);
    } catch { return null; }                                         // a browser that does not let the view be read: the colours of style.css
  }
  function update(force = false) {
    const mode = glassMode(ctx.theme());
    if (!mode) { root.style.removeProperty('--glass-wall'); shownFor = ''; return; }
    const key = `${wallKey(ctx.houseId())}.${mode}`;
    if (shownFor !== key) {                                          // another house or mode: the kept picture at once
      const kept = read(key);
      root.style.removeProperty('--glass-wall');
      if (kept) root.style.setProperty('--glass-wall', `url("${kept}")`);
      shownFor = key;
    }
    if ((!force && taken.has(key)) || !ctx.ready?.()) return;
    const url = take(mode);                                          // the house as it looks now (once per visit, or when asked)
    if (url) { keep(key, url); taken.add(key); root.style.setProperty('--glass-wall', `url("${url}")`); }
  }
  return { update };
}
