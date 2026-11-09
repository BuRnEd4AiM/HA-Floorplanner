/* The panes of a window (#606): how many it has (its style, or a number set in its properties, 1 .. 8), the edge every pane swings around
 * (bottom, top, left, right; one for the whole window or one per pane, where a pane can also be 'fixed') and how many rows its contacts
 * get in the room panel. And the fixed glass below or above the panes (#679, markweiffenbach: tall windows from the floor to the ceiling,
 * "the lower part (about 0–1.10 m) is fixed glazing, and only the upper part (about 1.10–2.20 m) opens or tilts"): o.fixedBelow and
 * o.fixedAbove, its height in m from the bottom / top edge of the window; the panes that open (and their contacts) fill the rest.
 * walls.js builds the panes in 3D with these (and exports them too), props.js and fixedglassui.js show the fields. Pure functions
 * (no three.js, no DOM; unit test: tests/windowpanes.test.mjs). */

export const WINDOW_HINGES = ['bottom', 'top', 'left', 'right'];   // which edge a window pane swings around (default bottom)
export const PANE_HINGES = [...WINDOW_HINGES, 'fixed'];             // one pane can also be fixed (e.g. the middle of a triple window)
export const MAX_PANES = 8;

/** how many panes a window has by its style (single 1, double 2 (also no style), triple 3, fixed 1) */
export const stylePanes = (style) => (style === 'fixed' ? 1 : style === 'triple' ? 3 : style === 'single' ? 1 : 2);
/** how many panes a window has: a number the user set (o.panes, 1 .. 8) overrides the style (fixed glazing always has one); 0 for a door */
export function windowPanes(o) {
  if (o?.type !== 'window') return 0;
  const n = typeof o.panes === 'number' && Number.isFinite(o.panes) ? Math.round(o.panes) : NaN;
  if (o.style !== 'fixed' && n >= 1 && n <= MAX_PANES) return n;
  return stylePanes(o.style);
}
/** the edge pane i of window o swings around (or 'fixed'): its own (o.paneHinges[i]), else the window's (o.hinge), else the bottom
 *  (older layouts). A fixed pane has no contact of its own and never opens. */
export function paneHinge(o, i = 0) {
  const own = Array.isArray(o?.paneHinges) ? o.paneHinges[i] : null;
  if (PANE_HINGES.includes(own)) return own;
  return WINDOW_HINGES.includes(o?.hinge) ? o.hinge : 'bottom';
}
/** the rows of door / window o in the room panel: one per pane once its panes have contacts of their own (o.paneEntities, also the panes
 *  a custom count added), else one */
export const contactRows = (o) => (Array.isArray(o?.paneEntities) && o.paneEntities.some(Boolean) ? Math.max(1, windowPanes(o)) : 1);

/* Fixed glass below / above the panes (#679): an Unterlicht (below) and an Oberlicht (transom, above), each its own pane without a contact
 * across the whole window, with a bar between it and the panes that open. */
export const FIXED_MIN = 0.2;                   // the lowest fixed glass (m): less is no glass at all (0)
export const SASH_MIN = 0.3;                    // what the panes that open keep at least (m)
const cm = (v) => Math.round(v * 100) / 100;
const raw = (o, key) => (typeof o?.[key] === 'number' && Number.isFinite(o[key]) && o[key] > 0 ? o[key] : 0);
/** can window o have fixed glass below / above its panes? (a window that opens; fixed glazing is one pane anyway, a door has none) */
export const canFixGlass = (o) => o?.type === 'window' && o.style !== 'fixed';
/** the fixed glass of window o: { below, above } in m (0 = none), as it is built: below first, each at least FIXED_MIN, and together
 *  only so high that the panes that open keep SASH_MIN of the window's height (a lower window shrinks them, the stored values stay) */
export function fixedGlass(o) {
  if (!canFixGlass(o)) return { below: 0, above: 0 };
  const room = Math.max(0, (Number(o.height) || 0) - SASH_MIN);
  let below = Math.min(raw(o, 'fixedBelow'), room);
  if (below < FIXED_MIN) below = 0;
  let above = Math.min(raw(o, 'fixedAbove'), room - below);
  if (above < FIXED_MIN) above = 0;
  return { below: cm(below), above: cm(above) };
}
/** set the fixed glass below ('fixedBelow') or above ('fixedAbove') of window o to v m (whole cm): 0, empty or less than FIXED_MIN
 *  removes it, more than fits is cut to what fits; returns the height it has now (fixedGlass) */
export function setFixedGlass(o, key, v) {
  if (!canFixGlass(o) || (key !== 'fixedBelow' && key !== 'fixedAbove')) return 0;
  const n = Number(v), which = key === 'fixedBelow' ? 'below' : 'above';
  delete o[key];
  if (!(Number.isFinite(n) && n >= FIXED_MIN)) return 0;
  o[key] = cm(n);
  const got = fixedGlass(o)[which];
  if (got) o[key] = got; else delete o[key];
  return got;
}
/** the heights of the parts of window o (from its bottom edge, y = 0 at the sill) whose frame is ft thick: lo / hi the fixed glass below /
 *  above ([y0, y1] or null), sash the panes that open, bars the middles of the bars between them (the bottom edge of the frame is at 0
 *  with a sill and without one; the panes start at ft as before) */
export function glassBands(o, ft = 0.05) {
  const h = Number(o?.height) || 0, { below, above } = fixedGlass(o);
  return {
    lo: below ? [ft, below - ft / 2] : null,
    hi: above ? [h - above + ft / 2, h - ft] : null,
    sash: [below ? below + ft / 2 : ft, above ? h - above - ft / 2 : h - ft],
    bars: [...(below ? [below] : []), ...(above ? [cm(h - above)] : [])],
  };
}
