/* The panes of a window (#606): how many it has (its style, or a number set in its properties, 1 .. 8), the edge every pane swings around
 * (bottom, top, left, right; one for the whole window or one per pane) and how many rows its contacts get in the room panel. walls.js
 * builds the panes in 3D with these, props.js shows the fields. Pure functions (no three.js, no DOM; unit test: tests/windowpanes.test.mjs). */

export const WINDOW_HINGES = ['bottom', 'top', 'left', 'right'];   // which edge a window pane swings around (default bottom)
export const MAX_PANES = 8;

/** the panes of a window's style: single 1, double 2 (also no style), triple 3, fixed 1 */
export const stylePanes = (o) => (o?.style === 'triple' ? 3 : o?.style === 'single' || o?.style === 'fixed' ? 1 : 2);
/** how many panes a window has: a number the user set (o.panes, 1 .. 8) overrides the style (fixed glazing always has one); 0 for a door */
export function windowPanes(o) {
  if (o?.type !== 'window') return 0;
  const n = Math.round(Number(o.panes));
  if (o.style !== 'fixed' && n >= 1 && n <= MAX_PANES) return n;
  return stylePanes(o);
}
/** the edge pane i of window o swings around: its own (o.paneHinges[i]), else the window's (o.hinge), else the bottom (older layouts) */
export function paneHinge(o, i = 0) {
  const own = Array.isArray(o?.paneHinges) ? o.paneHinges[i] : null;
  if (WINDOW_HINGES.includes(own)) return own;
  return WINDOW_HINGES.includes(o?.hinge) ? o.hinge : 'bottom';
}
/** the rows of door / window o in the room panel: one per pane once its panes have contacts of their own (o.paneEntities), else one */
export const contactRows = (o) => ((o?.paneEntities || []).some(Boolean) ? Math.max(1, windowPanes(o)) : 1);
