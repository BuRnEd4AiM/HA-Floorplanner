/* 🏗 The railing of balconies and roof terraces in the 2D plan (5.14.0): a light line where it runs, a gate (Geländertür) as a gap with its
 * leaf and swing; while editing, the selected open room shows its sides with a number (the same as in its properties: „Seite 1“ …), and
 * handles at the ends of the railing and on the gate to drag along the side. The rules are in railsides.js; balcony.js says which spots a
 * wall, another open room or a bridge already closes. Used by plan2d.js. */
import { railPlan, listedSides, sideOf, setSide } from './railsides.js';
import { railCover } from './balcony.js';
import { pointInPoly } from './rooms.js';

const RAIL = '#f1dcb2', OFF = 'rgba(255,255,255,.35)', BADGE = '#ffb74d';
const OUT = 14;                                                          // the handles and numbers sit this many px outside the side

/** the unit vector along side { a, b } and the one pointing out of the room */
function frame(room, a, b) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
  const out = pointInPoly(mx - uz * 0.05, mz + ux * 0.05, room.points) ? [uz, -ux] : [-uz, ux];
  return { ux, uz, out };
}

/** v: { sx, sy, s (px per m) } */
export function initRail2d(v) {
  const { sx, sy } = v;
  const ln = (a, b) => `x1="${sx(a[0]).toFixed(1)}" y1="${sy(a[1]).toFixed(1)}" x2="${sx(b[0]).toFixed(1)}" y2="${sy(b[1]).toFixed(1)}"`;
  /** a point d px off (x, z) in the direction (dx, dz) on the screen */
  const off = (p, d, dir) => [sx(p[0]) + dir[0] * d, sy(p[1]) + dir[1] * d];

  /** the handles of the selected open room: [{ k, which: 'from' | 'to' | 'gate', px: [x, y] }] */
  function handles(room, f) {
    if (!room?.terrace) return [];
    const list = [];
    listedSides(room, railCover(room, f)).forEach(({ k, a, b }) => {
      const s = sideOf(room, k);
      if (s.off) return;
      const { ux, uz, out } = frame(room, a, b), at = (u) => [a[0] + ux * u, a[1] + uz * u];
      list.push({ k, which: 'from', px: off(at(s.from), OUT, out) }, { k, which: 'to', px: off(at(s.to), OUT, out) });
      if (s.gate) list.push({ k, which: 'gate', px: off(at(s.gate.at), OUT, out) });
    });
    return list;
  }
  /** the handle under the pointer (px, py), within r px, with its distance: { k, which, d } or null */
  function handleAt(room, f, px, py, r = 10) {
    let best = null;
    handles(room, f).forEach((h) => { const d = Math.hypot(h.px[0] - px, h.px[1] - py); if (d <= r && (!best || d < best.d)) best = { k: h.k, which: h.which, d }; });
    return best;
  }

  /** the railing of every open room of floor f (a line, gates as a gap with leaf and swing); with `sel` (the selected open room, while
   *  editing) its sides with their numbers (off: a dashed grey line) and the handles */
  function svg(f, sel, editing) {
    let o = '';
    (f?.rooms || []).forEach((room) => {
      if (!room.terrace || !(room.points?.length >= 3)) return;
      const cover = railCover(room, f), { runs, gates } = railPlan(room, cover);
      runs.forEach((r) => { o += `<line class="rail2d" data-side="${r.k}" ${ln(r.a, r.b)} stroke="${RAIL}" stroke-width="3" stroke-linecap="round" pointer-events="none"/>`; });
      gates.forEach((g) => {
        const L = Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1]), { out } = frame(room, g.a, g.b);
        const leaf = [g.a[0] - out[0] * L, g.a[1] - out[1] * L], R = L * v.s(), A = [sx(g.a[0]), sy(g.a[1])];
        const lp = [sx(leaf[0]), sy(leaf[1])], bp = [sx(g.b[0]), sy(g.b[1])];
        const v0 = [lp[0] - A[0], lp[1] - A[1]], v1 = [bp[0] - A[0], bp[1] - A[1]], sweep = v0[0] * v1[1] - v0[1] * v1[0] > 0 ? 1 : 0;
        o += `<g class="gate2d" data-side="${g.k}" pointer-events="none"><line ${ln(g.a, leaf)} stroke="${RAIL}" stroke-width="2.5"/>`
          + `<path d="M${lp[0].toFixed(1)},${lp[1].toFixed(1)}A${R.toFixed(1)} ${R.toFixed(1)} 0 0 ${sweep} ${bp[0].toFixed(1)},${bp[1].toFixed(1)}" stroke="${RAIL}" stroke-width="1" stroke-dasharray="3 3" fill="none" opacity=".85"/></g>`;
      });
      if (!editing || sel?.id !== room.id) return;
      listedSides(room, cover).forEach(({ k, n, a, b, mid }) => {
        const s = sideOf(room, k), { out } = frame(room, a, b);
        if (s.off) o += `<line class="railOff2d" data-side="${k}" ${ln(a, b)} stroke="${OFF}" stroke-width="2" stroke-dasharray="2 5" pointer-events="none"/>`;
        const [cx, cy] = off(mid, OUT + 10, out);
        o += `<g class="railSide2d" data-side="${k}" data-n="${n}" pointer-events="none" opacity="${s.off ? 0.55 : 1}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9" fill="${s.off ? '#7d8796' : BADGE}" stroke="#2a1d10" stroke-width="1.2"/>`
          + `<text x="${cx.toFixed(1)}" y="${(cy + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="700" fill="#1d1408">${n}</text></g>`;
      });
      handles(room, f).forEach((h) => {
        const [x, y] = h.px;
        o += h.which === 'gate'
          ? `<rect class="railHandle" data-side="${h.k}" data-which="gate" x="${(x - 6).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="12" height="12" rx="2" fill="${BADGE}" stroke="#fff" stroke-width="2"/>`
          : `<rect class="railHandle" data-side="${h.k}" data-which="${h.which}" x="${(x - 5).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="10" height="10" fill="#fff" stroke="${BADGE}" stroke-width="2.5" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      });
    });
    return o;
  }

  /** a handle dragged to (x, z): the end of the railing or the gate of side k follows along the side (5 cm steps); the line for the status
   *  bar: { n (the side's number), from, to, gate } */
  function drag(room, f, k, which, x, z) {
    const pts = room.points, a = pts[k], b = pts[(k + 1) % pts.length], s = sideOf(room, k);
    const u = Math.max(0, Math.min(s.len, Math.round((((x - a[0]) * (b[0] - a[0]) + (z - a[1]) * (b[1] - a[1])) / (s.len || 1)) * 20) / 20));
    if (which === 'from') setSide(room, k, { from: Math.min(u, s.to - 0.1) });
    else if (which === 'to') setSide(room, k, { to: Math.max(u, s.from + 0.1) });
    else if (s.gate) setSide(room, k, { gate: { at: u, w: s.gate.w } });
    const now = sideOf(room, k), n = listedSides(room, railCover(room, f)).find((q) => q.k === k)?.n || k + 1;
    return { n, from: now.from, to: now.to, gate: now.gate };
  }
  return { svg, handles, handleAt, drag };
}
