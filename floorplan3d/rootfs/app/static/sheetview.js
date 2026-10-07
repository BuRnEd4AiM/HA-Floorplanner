/* Phones: the room panel is a bottom sheet over the lower half of the 3D view. While it is open the picture is shifted up,
 * so the room sits in the middle of the free part above the sheet instead of behind it. The camera itself does not move
 * (turning and zooming still go around the room); only the projection gets an offset (camera.setViewOffset).
 * sheetShift is the pure rule (tested), initSheetView wires it to the page. */

/** how many pixels the picture moves up. view = the 3D canvas, sheet = the panel (both {left, top, right, bottom} on the page),
 *  null = panel closed. Only a sheet over the full lower part counts (at least 60% of the width, reaching the bottom edge);
 *  a panel at the side (tablet, desktop) moves nothing. */
export function sheetShift(view, sheet) {
  if (!sheet) return 0;
  const w = view.right - view.left, h = view.bottom - view.top;
  if (w <= 0 || h <= 0) return 0;
  const wide = Math.min(sheet.right, view.right) - Math.max(sheet.left, view.left) >= 0.6 * w;
  const atBottom = sheet.bottom >= view.bottom - 40;
  const free = Math.max(0, Math.min(sheet.top, view.bottom) - view.top);   // visible height above the sheet
  if (!wide || !atBottom || free >= 0.85 * h) return 0;
  return Math.round((h - Math.max(free, 0.3 * h)) / 2);                     // the middle of the free part (never less than 30% of the view)
}

/** how far the camera stands from a room it zooms into (size = the longer side in m). A narrow screen (phone held upright)
 *  shows less from side to side: the camera goes further back, so the room still fits across */
export function roomViewDist(size, aspect) {
  const base = size * 2.4 + 3;
  if (!(aspect > 0) || aspect >= 1) return base;
  return base / aspect;
}

/** ctx: camera, canvas, panel (the room panel element) */
export function initSheetView(ctx) {
  const { camera, canvas, panel } = ctx;
  let shift = 0;
  function apply() {
    const v = canvas.getBoundingClientRect();
    const s = sheetShift(v, panel.hidden ? null : panel.getBoundingClientRect());
    if (s === shift && (s === 0 || (camera.view?.fullWidth === v.width && camera.view?.fullHeight === v.height))) return;
    shift = s;
    if (s) camera.setViewOffset(v.width, v.height, 0, s, v.width, v.height);
    else camera.clearViewOffset();
  }
  new MutationObserver(apply).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  new ResizeObserver(apply).observe(panel);
  return { apply };
}
