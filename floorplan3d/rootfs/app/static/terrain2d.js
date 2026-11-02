/* ⛰ The terrain in the 2D plan (#629): the contour lines (every 0.25, 0.5 or 1 m; the whole metres stronger, each with its height at its
 * left end), inside the plot when one is drawn; with the tool "Grundstück" in the mode "Gelände" the spot heights: a dot with its number and
 * height, the selected one ringed. SVG strings for plan2d.js; the hit test of a spot height. No three.js. */
import { cleanTerrain, heightField, contourLines } from './terrain.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** a height with its sign: +0,50 m, −3,00 m, ±0,00 m (fmtLen formats the amount in the unit shown) */
export const fmtH = (h, fmtLen) => `${h > 0.004 ? '+' : h < -0.004 ? '−' : '±'}${fmtLen(Math.abs(h))}`;
/** the numbers of the spot heights: ① ② ... ⑳, then (21) */
export const pointNo = (i) => (i < 20 ? String.fromCharCode(0x2460 + i) : `(${i + 1})`);

let memo = { key: '', lines: [] };
/** the contour lines of a terrain over box [x0, x1, z0, z1], worked out again only when the terrain or the box change */
export function contoursOf(terrain, box) {
  const c = cleanTerrain(terrain), key = JSON.stringify([c, box]);
  if (key !== memo.key) memo = { key, lines: c && c.contours ? contourLines(heightField(c), box, c.contours, Math.max(0.2, Math.min(0.5, (box[1] - box[0]) / 160))) : [] };
  return memo.lines;
}

/** the spot height near (x, z) within tol m: its id, or null */
export function hitPoint(terrain, x, z, tol) {
  let best = null, bd = tol;
  (cleanTerrain(terrain)?.points || []).forEach((p) => { const d = Math.hypot(p.x - x, p.z - z); if (d <= bd) { bd = d; best = p.id; } });
  return best;
}

/** the SVG of the terrain: o = { terrain, box, clip (the plot's corners or null), sx(x), sy(z), s (px per m), live, edit (the mode
 *  "Gelände"), sel (id of the selected point), fmtLen(m) } */
export function terrainSvg(o) {
  const c = cleanTerrain(o.terrain);
  if (!c || o.live) return '';
  let out = '';
  const lines = contoursOf(o.terrain, o.box);
  if (lines.length) {
    const clip = o.clip?.length >= 3 ? `<clipPath id="terrainClip"><polygon points="${o.clip.map(([x, z]) => `${o.sx(x).toFixed(1)},${o.sy(z).toFixed(1)}`).join(' ')}"/></clipPath>` : '';
    out += `${clip}<g class="terrainLines"${clip ? ' clip-path="url(#terrainClip)"' : ''} pointer-events="none">`;
    lines.forEach((l) => {
      const major = Math.abs(l.level - Math.round(l.level)) < 1e-6;
      const d = l.segs.map(([xa, za, xb, zb]) => `M${o.sx(xa).toFixed(1)} ${o.sy(za).toFixed(1)}L${o.sx(xb).toFixed(1)} ${o.sy(zb).toFixed(1)}`).join('');
      out += `<path d="${d}" stroke="${major ? '#e0a060' : '#c98a4b'}" stroke-width="${major ? 1.8 : 1.1}" stroke-opacity="${o.edit ? 0.95 : 0.6}" fill="none"${major ? '' : ' stroke-dasharray="6 4"'} data-level="${l.level}"/>`;
    });
    if (o.s >= 10) lines.forEach((l) => {                       // its height at the left end of the line
      const seg = l.segs.reduce((m, q) => (Math.min(q[0], q[2]) < Math.min(m[0], m[2]) ? q : m));
      const [x, z] = seg[0] <= seg[2] ? [seg[0], seg[1]] : [seg[2], seg[3]];
      out += `<text x="${(o.sx(x) + 4).toFixed(1)}" y="${(o.sy(z) - 4).toFixed(1)}" font-size="10.5" fill="#f0c08a" stroke="rgba(3,21,71,.85)" stroke-width="3" paint-order="stroke">${esc(fmtH(l.level, o.fmtLen))}</text>`;
    });
    out += '</g>';
  }
  if (o.edit) c.points.forEach((p, i) => {
    const X = o.sx(p.x), Y = o.sy(p.z), on = p.id === o.sel;
    if (on) out += `<circle cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" r="13" fill="none" stroke="#ffb04a" stroke-width="2.5"/>`;
    out += `<circle class="terrainPoint" data-tpoint="${esc(p.id)}" cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" r="8" fill="#e0582c" stroke="#fff" stroke-width="2.5"/>`;
    out += `<text x="${(X + 14).toFixed(1)}" y="${(Y + 4.5).toFixed(1)}" font-size="13" font-weight="700" fill="#fff" stroke="#9a3412" stroke-width="4" paint-order="stroke" pointer-events="none">${esc(`${pointNo(i)} ${fmtH(p.h, o.fmtLen)}`)}</text>`;
  });
  return out;
}
