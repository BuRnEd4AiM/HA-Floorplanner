/* The strip kept clear of the iPhone's home bar at the bottom of the screen. iOS gives a page in a frame the same safe-area value as
 * the whole screen, also where the frame does not reach the screen's bottom edge: in the Home Assistant app (add-on panel) Home
 * Assistant keeps the strip clear below the frame, and the tab bar kept it clear a second time (an empty band on the phone).
 * The page sets --frame-gap on <html>: how far below the frame the page around it already keeps clear; style.css takes it off the
 * safe-area value (--safe-b) and the parts of the 3D picture use --stage-b (0 while the tab bar lies below them).
 * frameGap is pure logic (unit test: tests/safearea.test.mjs). */

/** a frame of another address (the Docker version as a panel, a dashboard card): the page around keeps clear, nothing is taken twice */
export const OUTSIDE = 9999;

/**
 * How far below this page the page around it already keeps clear, in px. framed: shown in a frame; full: in full screen (the frame then
 * covers the whole screen); parentHeight / frameBottom: the height of the page around and the bottom of the frame in it (null where
 * they cannot be read: a frame of another address).
 */
export function frameGap({ framed, full, parentHeight, frameBottom }) {
  if (!framed || full) return 0;
  if (!Number.isFinite(parentHeight) || !Number.isFinite(frameBottom)) return OUTSIDE;
  return Math.max(0, Math.round(parentHeight - frameBottom));
}

/** measures the frame now, after a resize, a turn and full screen */
export function initSafeArea() {
  const root = document.documentElement;
  function measure() {
    let framed = true, parentHeight = null, frameBottom = null;
    try { framed = window.self !== window.top; } catch { /* a frame of another address */ }
    try {
      const fe = window.frameElement;                                   // null for a frame of another address
      if (fe) { parentHeight = window.parent.innerHeight; frameBottom = fe.getBoundingClientRect().bottom; }
    } catch { /* another address */ }
    const full = !!(document.fullscreenElement || document.webkitFullscreenElement);
    root.style.setProperty('--frame-gap', `${frameGap({ framed, full, parentHeight, frameBottom })}px`);
  }
  measure();
  addEventListener('resize', measure);
  addEventListener('orientationchange', measure);
  document.addEventListener('fullscreenchange', measure);
  document.addEventListener('webkitfullscreenchange', measure);
  return { measure };
}
