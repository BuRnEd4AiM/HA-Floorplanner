/* The room tiles above the view buttons (5.37.1, found on the owner's pictures 19 and 22 of docs/ideen-5.37): the row „Normal · Temp. ·
 * Feuchte … Ansicht“ (#modeBar) can wrap into two lines (a tablet held upright, a long language), and the room tiles stood at a fixed
 * 62 px above the bottom: they lay over the buttons. This sets the row's height on the stage as --mode-h; style.css puts the room tiles
 * (and what stands at the same height) above it. No pure logic: a ResizeObserver only. */

/** ctx: bar (#modeBar), stage (#stage). Returns { update() } */
export function initModeBarFit({ bar, stage }) {
  const update = () => {
    if (!bar || !stage) return;
    const h = bar.offsetParent ? Math.round(bar.getBoundingClientRect().height) : 0;
    const v = h > 0 ? `${h}px` : '';
    if (stage.style.getPropertyValue('--mode-h') !== v) {
      if (v) stage.style.setProperty('--mode-h', v); else stage.style.removeProperty('--mode-h');
    }
  };
  if (bar && typeof ResizeObserver === 'function') new ResizeObserver(update).observe(bar);
  update();
  return { update };
}
