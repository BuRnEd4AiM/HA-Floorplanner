/* The status line at the bottom left of the 3D picture (#status, style.css: over the compass): what was just done ("11 Lichter aus: Ganzes
 * Haus") or the hint of a tool. In the live view a message goes again after STATUS_LIVE_MS (2026-11-12: it stayed until the next one and
 * covered the buttons below it); in the editor it stays, a tool's hint is needed while drawing. */
export const STATUS_LIVE_MS = 6000;

let timer = 0;
/** the room the floor rail keeps free for the line: its height and a gap, 0 while it is empty or not shown */
export const statusGap = (h) => (h > 0 ? Math.ceil(h) + 8 : 0);

/** el shows txt; the floor rail of its stage ends above it (--status-gap, style.css) */
function put(el, txt) {
  el.textContent = txt;
  el.parentElement?.style.setProperty('--status-gap', `${statusGap(txt ? el.offsetHeight : 0)}px`);
}
/** show txt in el ('' hides it); live: the live view is shown (the message goes again by itself) */
export function showStatus(el, txt, live) {
  if (!el) return;
  put(el, txt);
  clearTimeout(timer);
  if (txt && live) timer = setTimeout(() => { if (el.textContent === txt) put(el, ''); }, STATUS_LIVE_MS);
}
