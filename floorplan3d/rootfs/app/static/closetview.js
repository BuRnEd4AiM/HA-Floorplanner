/* Cabinet builder: the drawings of the editor (closetui.js) as SVG text: the front with its columns (tap one to edit it), the side as a cut
 * through the chosen column, and the marks of a cabinet in the 2D plan. No DOM, no three.js (unit test: tests/closet.test.mjs); the
 * positions come from closetLayout in closet.js, the same the 3D model is built from. */
import { closetLayout, topLine, topAt, T, GAP } from './closet.js';

const f1 = (v) => v.toFixed(1);
const pts = (list) => list.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/** a colour a bit darker (k < 1) or lighter (k > 1), as #rrggbb */
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), ch = (v) => Math.max(0, Math.min(255, Math.round(k <= 1 ? v * k : v + (255 - v) * (k - 1))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
}
const METAL = { steel: '#aab1b8', black: '#2a2b2e', brass: '#b8955a' };
const HALO = 'stroke="var(--bg, #06121f)" stroke-width="3" paint-order="stroke"';   // text over the drawing stays readable
let seq = 0;                                       // every drawing its own clip path (several can be on the page at once)
const FACE = { glass: 'rgba(170,215,235,.35)', mirror: '#cfdbe2' };

/** the front of the cabinet. o: { sel (the chosen column), doors (draw the doors; else only their outline, to see inside), len(m) (a length
 *  as text), w, h (size of the drawing in px) }; every column has an invisible rect with data-col to tap */
export function frontView(cab, o = {}) {
  const L = closetLayout(cab), { c, W, H, P, x0, z0, z1 } = L, VW = o.w || 560, VH = o.h || 420, ml = 54, mr = 16, mt = 18, mb = 46;
  const s = Math.min((VW - ml - mr) / W, (VH - mt - mb) / H), X = (x) => ml + (x - x0) * s + ((VW - ml - mr) - W * s) / 2, Y = (y) => VH - mb - y * s;
  const len = o.len || ((m) => `${Math.round(m * 100)} cm`), metal = METAL[c.metal] || METAL.steel, line = 'rgba(0,0,0,.45)';
  const outline = (z) => [[x0, 0], [-x0, 0], ...topLine(c, 'x', z, x0, -x0).reverse()].map(([x, y]) => [X(x), Y(y)]);
  const rect = (xa, ya, xb, yb, fill, extra = '') => `<rect x="${f1(X(xa))}" y="${f1(Y(yb))}" width="${f1((xb - xa) * s)}" height="${f1(Math.max(0.5, (yb - ya) * s))}" fill="${fill}" ${extra}/>`;
  const id = `closetClip${++seq}`, front = outline(z1), back = c.slopes.some((q) => q.side === 'back' || q.side === 'front') ? outline(z0) : null;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" class="closetFront"><defs><clipPath id="${id}"><polygon points="${pts(front)}"/></clipPath></defs>`;
  if (back) out += `<polygon points="${pts(back)}" fill="none" stroke="currentColor" stroke-dasharray="5 4" opacity=".5"/>`;
  out += `<polygon points="${pts(front)}" fill="${c.body}" stroke="${line}" stroke-width="1.5"/><g clip-path="url(#${id})">`;
  if (P > 0.005) out += rect(x0 + T, 0, -x0 - T, P, shade(c.body, 0.7));
  L.cols.forEach((q) => {
    out += rect(q.ia, q.yA, q.ib, H, shade(c.body, 0.84));                                       // the inside (its back wall)
    if (q.i > 0) out += rect(q.xa - T / 2, P, q.xa + T / 2, H, c.body, `stroke="${line}" stroke-width=".6"`);
    if (q.low) out += rect(q.ia, q.yD, q.ib, q.yD + T, c.body, `stroke="${line}" stroke-width=".6"`);
    q.shelves.forEach((y) => { out += rect(q.ia, y, q.ib, y + T, shade(c.body, 1.05), `stroke="${line}" stroke-width=".6"`); });
    q.rails.forEach((r) => {
      out += `<line x1="${f1(X(r.x0))}" y1="${f1(Y(r.y))}" x2="${f1(X(r.x1))}" y2="${f1(Y(r.y))}" stroke="${metal}" stroke-width="3" stroke-linecap="round"/>`;
      const n = Math.max(1, Math.floor((r.x1 - r.x0) / 0.12));
      for (let k = 0; k < n; k++) {                                                              // hangers with clothes
        const hx = X(r.x0 + ((k + 0.5) * (r.x1 - r.x0)) / n), hy = Y(r.y), hl = Math.min(0.9, r.y - q.yA - 0.05) * s;
        if (hl > 8) out += `<path d="M${f1(hx)},${f1(hy)} l-${f1(Math.min(16, s * 0.07))},10 v${f1(hl - 10)} h${f1(2 * Math.min(16, s * 0.07))} v-${f1(hl - 10)} z" fill="${['#7d93b2', '#b28a7d', '#8fa88a', '#c7b07a'][k % 4]}" opacity=".55"/>`;
      }
    });
    if (q.led) out += rect(q.ia + 0.02, q.led.y - 0.01, q.ib - 0.02, q.led.y, '#ffe9a8');
    q.drawers.forEach((d) => {
      out += rect(q.xa + GAP / 2, d.y0, q.xb - GAP / 2, d.y1, c.front, `stroke="${line}" stroke-width=".8"`);
      if (c.handle !== 'none') out += handleMark(X((q.xa + q.xb) / 2), Y(d.y1 - Math.min(0.06, (d.y1 - d.y0) / 2)), c.handle, 'h', (q.xb - q.xa) * s, metal);
    });
    if (q.filler) out += rect(q.xa + GAP / 2, q.filler.y0, q.xb - GAP / 2, H, c.front, `stroke="${line}" stroke-width=".8"`);
    if (q.door) {
      const extra = o.doors ? `stroke="${line}" stroke-width=".8"` : `fill-opacity="0" stroke="${line}" stroke-width="1" stroke-dasharray="4 3"`;
      out += rect(q.xa + GAP / 2, q.door.y0, q.xb - GAP / 2, H, FACE[q.front] || c.front, `${extra} data-door="${q.i}"`);
      if (o.doors && c.handle !== 'none') {
        const hx = q.hinge === 'l' ? q.xb - 0.04 : q.xa + 0.04, top = topAt(c, hx, z1) - GAP;
        out += handleMark(X(hx), Y(Math.min(1.05, (q.door.y0 + top) / 2)), c.handle, 'v', 0, metal, Math.max(0, (top - q.door.y0) * s));
      }
      if (o.doors) {                                                                         // which way the door opens: a thin triangle to the hinge
        const ha = q.hinge === 'l' ? q.xa + 0.02 : q.xb - 0.02, hb = q.hinge === 'l' ? q.xb - 0.02 : q.xa + 0.02;
        out += `<polyline points="${f1(X(hb))},${f1(Y(q.door.y0 + 0.03))} ${f1(X(ha))},${f1(Y((q.door.y0 + Math.min(H, q.frontLow)) / 2))} ${f1(X(hb))},${f1(Y(Math.min(H, q.frontLow) - 0.03))}" fill="none" stroke="${line}" stroke-width=".7" stroke-dasharray="3 3" opacity=".6"/>`;
      }
    }
  });
  out += '</g>';
  L.cols.forEach((q) => {                                                                     // widths under the columns, the chosen one marked
    if (q.i === o.sel) out += `<rect x="${f1(X(q.xa) + 1.5)}" y="${f1(Y(H) + 1.5)}" width="${f1((q.xb - q.xa) * s - 3)}" height="${f1(H * s - 3)}" fill="none" stroke="var(--accent, #23e0ff)" stroke-width="3" pointer-events="none"/>`;
    out += `<text x="${f1(X((q.xa + q.xb) / 2))}" y="${f1(Y(0) + 15)}" text-anchor="middle" font-size="12" fill="currentColor"${q.i === o.sel ? ' font-weight="700"' : ''}>${esc(len(q.xb - q.xa))}</text>`;
    out += `<rect x="${f1(X(q.xa))}" y="${f1(Y(H))}" width="${f1((q.xb - q.xa) * s)}" height="${f1(H * s + 20)}" fill="transparent" data-col="${q.i}" style="cursor:pointer"/>`;
  });
  out += dim(X(x0), Y(0) + 32, X(-x0), Y(0) + 32, esc(len(W)), 'h');
  out += dim(ml - 30, Y(0), ml - 30, Y(H), esc(len(H)), 'v');
  c.slopes.filter((q) => q.side === 'left' || q.side === 'right').forEach((q) => {
    const xe = q.side === 'left' ? x0 : -x0, y = Math.min(H, q.low), tx = X(xe) + (q.side === 'left' ? 6 : -6);
    out += `<text x="${f1(tx)}" y="${f1(Y(y) - 6)}" text-anchor="${q.side === 'left' ? 'start' : 'end'}" font-size="11" fill="currentColor" ${HALO}>${esc(len(y))} · ${q.deg}°</text>`;
  });
  return `${out}</svg>`;
}
function handleMark(x, y, style, dir, w, color, room = 60) {
  if (style === 'knob') return `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="${color}"/>`;
  if (dir === 'h') { const half = style === 'long' ? w / 2 - 6 : Math.min(14, w / 4); return `<line x1="${f1(x - half)}" y1="${f1(y)}" x2="${f1(x + half)}" y2="${f1(y)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`; }
  const half = style === 'long' ? room / 2 - 8 : Math.min(20, room / 4);
  return `<line x1="${f1(x)}" y1="${f1(y - half)}" x2="${f1(x)}" y2="${f1(y + half)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
}
function dim(xa, ya, xb, yb, text, dir) {
  const tick = dir === 'h' ? (x, y) => `M${f1(x)},${f1(y - 4)} v8` : (x, y) => `M${f1(x - 4)},${f1(y)} h8`;
  const label = dir === 'h' ? `<text x="${f1((xa + xb) / 2)}" y="${f1(ya - 4)}" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">${text}</text>`
    : `<text x="${f1(xa - 6)}" y="${f1((ya + yb) / 2)}" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" transform="rotate(-90 ${f1(xa - 6)} ${f1((ya + yb) / 2)})">${text}</text>`;
  return `<path d="M${f1(xa)},${f1(ya)} L${f1(xb)},${f1(yb)} ${tick(xa, ya)} ${tick(xb, yb)}" stroke="currentColor" stroke-width="1" fill="none" opacity=".7"/>${label}`;
}

/** the side of the cabinet as a cut through the chosen column (o.sel), the back on the left and the front on the right; o: { sel, len, w, h } */
export function sideView(cab, o = {}) {
  const L = closetLayout(cab), { c, H, D, P, z0, z1 } = L, q = L.cols[Math.min(o.sel || 0, L.cols.length - 1)], VW = o.w || 220, VH = o.h || 420, ml = 16, mr = 16, mt = 18, mb = 46;
  const xm = (q.xa + q.xb) / 2, s = Math.min((VW - ml - mr) / (D + 0.06), (VH - mt - mb) / H), Z = (z) => ml + (z - z0) * s + ((VW - ml - mr) - (D + 0.06) * s) / 2, Y = (y) => VH - mb - y * s;
  const len = o.len || ((m) => `${Math.round(m * 100)} cm`), line = 'rgba(0,0,0,.45)', metal = METAL[c.metal] || METAL.steel;
  const prof = [[z0, 0], [z1, 0], ...topLine(c, 'z', xm, z0, z1).reverse()].map(([z, y]) => [Z(z), Y(y)]);
  const rect = (za, ya, zb, yb, fill, extra = '') => `<rect x="${f1(Z(za))}" y="${f1(Y(yb))}" width="${f1((zb - za) * s)}" height="${f1(Math.max(0.5, (yb - ya) * s))}" fill="${fill}" ${extra}/>`;
  const id = `closetSide${++seq}`;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" class="closetSide"><defs><clipPath id="${id}"><polygon points="${pts(prof)}"/></clipPath></defs>`;
  out += `<polygon points="${pts(prof)}" fill="${shade(c.body, 0.84)}" stroke="${line}" stroke-width="1.5"/><g clip-path="url(#${id})">`;
  if (P > 0.005) out += rect(z0 + 0.02, 0, z1 - 0.04, P, shade(c.body, 0.7));
  out += rect(z0, P, z1, P + T, c.body) + rect(z0, P, z0 + 0.008, H, shade(c.body, 0.75));
  if (q.low) out += rect(z0, q.yD, z1, q.yD + T, c.body, `stroke="${line}" stroke-width=".6"`);
  q.shelves.forEach((y) => { out += rect(z0 + 0.008, y, z1 - 0.01, y + T, shade(c.body, 1.05), `stroke="${line}" stroke-width=".6"`); });
  q.rails.forEach((r) => { out += `<circle cx="${f1(Z(0))}" cy="${f1(Y(r.y))}" r="${f1(Math.max(2.5, 0.0125 * s))}" fill="${metal}"/>`; });
  out += '</g>';
  q.drawers.forEach((d) => { out += rect(z1, d.y0, z1 + 0.019, d.y1, c.front, `stroke="${line}" stroke-width=".6"`); });
  const fTop = topAt(c, xm, z1) - GAP;
  if (q.door) out += rect(z1, q.door.y0, z1 + 0.019, fTop, FACE[q.front] || c.front, `stroke="${line}" stroke-width=".6"`);
  if (q.filler) out += rect(z1, q.filler.y0, z1 + 0.019, fTop, c.front, `stroke="${line}" stroke-width=".6"`);
  out += dim(Z(z0), Y(0) + 32, Z(z1), Y(0) + 32, esc(len(D)), 'h');
  c.slopes.filter((r) => r.side === 'back' || r.side === 'front').forEach((r) => {
    const ze = r.side === 'back' ? z0 : z1, y = Math.min(H, r.low);
    out += `<text x="${f1(Z(ze) + (r.side === 'back' ? 4 : -4))}" y="${f1(Y(y) - 6)}" text-anchor="${r.side === 'back' ? 'start' : 'end'}" font-size="11" fill="currentColor" ${HALO}>${esc(len(y))} · ${r.deg}°</text>`;
  });
  return `${out}</svg>`;
}

/** the marks of a cabinet in the 2D plan, inside the device's group (local frame, k px per metre): the columns, and where it is lower under a slope */
export function planMarks(cab, k, mirror, stroke) {
  const L = closetLayout(cab), { c, W, D, x0, z0 } = L, m = mirror ? -1 : 1;
  let out = '';
  c.slopes.forEach((q) => {                                                                   // the part under the slope (lower than the full height)
    const reach = (c.h - q.low) / Math.tan((q.deg * Math.PI) / 180), across = q.side === 'left' || q.side === 'right', size = across ? W : D, lo = across ? x0 : z0;
    const [u0, u1] = q.side === 'left' || q.side === 'back' ? [lo, lo + Math.min(size, reach)] : [lo + Math.max(0, size - reach), lo + size];
    if (u1 - u0 < 0.005) return;
    out += across
      ? `<rect x="${f1(Math.min(m * u0, m * u1) * k)}" y="${f1((-D / 2) * k)}" width="${f1((u1 - u0) * k)}" height="${f1(D * k)}" fill="rgba(255,170,70,.25)" pointer-events="none"/>`
      : `<rect x="${f1((-W / 2) * k)}" y="${f1(u0 * k)}" width="${f1(W * k)}" height="${f1((u1 - u0) * k)}" fill="rgba(255,170,70,.25)" pointer-events="none"/>`;
  });
  L.cols.forEach((q) => { if (q.i > 0) out += `<line x1="${f1(m * q.xa * k)}" y1="${f1((-D / 2) * k + 2)}" x2="${f1(m * q.xa * k)}" y2="${f1((D / 2) * k - 2)}" stroke="${stroke}" stroke-width=".8" opacity=".6" pointer-events="none"/>`; });
  return out;
}
