/* The values of a bar under the finger or the mouse (⚡ Energie, ⚖ Vergleichen): each column of a bar chart is a <g data-tip="…"> with a
 * clear rectangle over its whole height; a tap or the mouse on it shows the text in a small box beside it, inside the chart. Before, the
 * values were an SVG <title>: a mouse got the browser's tooltip after a moment, a finger (tablet, phone) got nothing.
 * tipLeft is pure logic (unit test: tests/bartip.test.mjs). */

/** where the box goes, in px from the left of the chart: beside the pointer (left of it in the right half), never out of the chart */
export function tipLeft({ x, width, tip, gap = 10 }) {
  const left = x > width / 2 ? x - tip - gap : x + gap;
  return Math.round(Math.max(0, Math.min(width - tip, left)));
}

let shown = null;                                                    // the box that shows: { wrap, hide }; a tap elsewhere puts it away
let watching = false;
function watch() {
  if (watching) return;
  watching = true;                                                   // one listener for all charts (they are drawn again and again)
  document.addEventListener('pointerdown', (e) => { if (shown && !shown.wrap.contains(e.target)) shown.hide(); }, true);
}

/** svg: a chart with columns <g data-tip>; returns a box holding the chart and the tip (to put where the chart went) */
export function withBarTips(svg) {
  const wrap = document.createElement('div'), box = document.createElement('div');
  wrap.className = 'btWrap'; box.className = 'barTip'; box.hidden = true;
  wrap.append(svg, box);
  let on = null;
  const hide = () => { box.hidden = true; on?.classList.remove('btOn'); on = null; if (shown?.wrap === wrap) shown = null; };
  const show = (e) => {
    const g = e.target.closest?.('[data-tip]');
    if (!g || !svg.contains(g)) { hide(); return; }
    if (g !== on) { on?.classList.remove('btOn'); on = g; g.classList.add('btOn'); box.textContent = g.dataset.tip; }
    box.hidden = false; shown = { wrap, hide }; watch();
    const r = wrap.getBoundingClientRect();
    box.style.left = `${tipLeft({ x: e.clientX - r.left, width: r.width, tip: box.offsetWidth })}px`;
  };
  svg.addEventListener('pointermove', show);
  svg.addEventListener('pointerdown', show);
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  return wrap;
}
