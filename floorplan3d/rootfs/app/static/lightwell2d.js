/* 🕳 The light wells in the 2D plan (#786): in front of a basement window under the ground a rectangle with the bars of its grating, the
 * window's colour when it is selected. Pure (an SVG string from lightwell.js lightWells' entries); plan2d.js adds it under the openings. */

const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** the SVG of the wells: wells (lightWells' entries), sx / sy (plan → screen), sel (the selection), C (the plan's colours: line, sel) */
export function wellsSvg({ wells, sx, sy, sel = null, C = {} }) {
  let o = '';
  (wells || []).forEach((wl) => {
    const isSel = sel?.kind === 'opening' && sel.id === wl.op.id, col = isSel ? C.sel || '#ffb04a' : C.line || '#cfd8e3';
    const P = (u, n) => `${sx(wl.x + wl.ux * u + wl.nx * n).toFixed(1)},${sy(wl.z + wl.uz * u + wl.nz * n).toFixed(1)}`;
    const hw = wl.w / 2, d = wl.d;
    o += `<g class="well2d" data-id="${esc(wl.op.id)}">`;
    o += `<polygon points="${P(-hw, 0)} ${P(hw, 0)} ${P(hw, d)} ${P(-hw, d)}" fill="rgba(150,160,170,.18)" stroke="${col}" stroke-width="1.4"/>`;
    const n = Math.max(2, Math.round(wl.w / 0.12));                  // the bars of the grating, out from the wall
    let bars = '';
    for (let i = 1; i < n; i++) { const u = -hw + (wl.w * i) / n; bars += `M${P(u, 0.03)}L${P(u, d - 0.03)}`; }
    o += `<path d="${bars}" stroke="${col}" stroke-width="0.7" opacity=".55" fill="none"/>`;
    o += '</g>';
  });
  return o;
}
