/* ⚡ Energie in the glass designs (5.37.0, idea 2 of docs/ideen-5.37, picture 3: "Nur Idee 2 (Bild 3)"): a ring for "Selbst gemacht", a
 * soft area instead of the bars, the house battery as a battery, a small coloured icon on each tile. pageenergy.js and batterycard.js
 * draw these always and style.css shows them only with <html data-glass> (the other designs keep the page as it was). The shapes are
 * pure (tests/energyglass.test.mjs). */

/** the small icon of a tile in the glass designs: [emoji, colour of its square] */
export const TILE_ICONS = {
  used: ['🏠', '#5e5ce6'], solar: ['☀️', '#ff9f0a'], fromGrid: ['⚡', '#0a84ff'], autarky: ['♻️', '#30d158'], cost: ['💶', '#34c759'],
  gas: ['🔥', '#ff6b3d'], water: ['💧', '#32ade6'],
};

/** the ring of "Selbst gemacht": how much of the circle (r) is drawn, as stroke-dasharray "drawn rest"; pct is cut to 0 ... 100 */
export function ringDash(pct, r) {
  const c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, Number(pct) || 0));
  return `${((c * p) / 100).toFixed(2)} ${c.toFixed(2)}`;
}

/** the colour of a battery's charge: green from 50 %, amber from 20 %, red below */
export const levelColor = (pct) => (pct >= 50 ? '#30d158' : pct >= 20 ? '#ff9f0a' : '#ff453a');

/** a smooth line through points [[x, y] ...] (Catmull-Rom as cubic curves), the y kept between lo and hi so it never bulges below the
 *  floor or over the top; '' for no points */
export function smoothLine(pts, lo = -Infinity, hi = Infinity) {
  if (!pts.length) return '';
  const f = (v) => v.toFixed(1), cl = (v) => Math.max(lo, Math.min(hi, v));
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, cl(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, cl(p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** the soft area of the chart: rows [{ use, own }], n of them drawn (the ones up to now), x(i) the middle of a column, y(v) the height
 *  of a value, base the floor. { total, own } as closed areas, { totalLine, ownLine } as lines, end [x, y] the last point of the total
 *  (a dot there); null when nothing is to be drawn */
export function areaPaths(rows, n, x, y, base) {
  const k = Math.max(0, Math.min(rows.length, n));
  if (!k) return null;
  const tot = [], own = [];
  for (let i = 0; i < k; i++) {
    const r = rows[i] || {}, use = Math.max(0, r.use || 0), o = Math.max(0, Math.min(use, r.own || 0));
    tot.push([x(i), y(use)]); own.push([x(i), y(o)]);
  }
  const top = Math.min(...tot.map((p) => p[1]));
  const totalLine = smoothLine(tot, top, base), ownLine = smoothLine(own, top, base);
  const close = (line, pts) => `${line} L${pts[pts.length - 1][0].toFixed(1)} ${base} L${pts[0][0].toFixed(1)} ${base} Z`;
  return { total: close(totalLine, tot), own: close(ownLine, own), totalLine, ownLine, end: tot[tot.length - 1] };
}
