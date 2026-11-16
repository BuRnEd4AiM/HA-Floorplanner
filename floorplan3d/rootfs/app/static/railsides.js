/* 🏗 The railing of a balcony or roof terrace side by side (5.14.0, the owner: „ich hätte gerne, dass ich sagen kann, wie weit das Geländer in
 * einer Richtung geht oder ob eine Geländertür dort ist … bei mir geht das Geländer nur an zwei Seiten“). An open room (`terrace: true`,
 * balcony.js) keeps `railSides`: one entry per side, side k runs from points[k] to points[k + 1] (the last one back to points[0]);
 *   null (or missing)   as before: a railing wherever no wall, no other open room and no bridge is;
 *   { off: true }       no railing on this side;
 *   { from, to }        the railing only between these two spots (m from the side's first corner);
 *   { gate: { at, w } } a gate (Geländertür) with its middle `at` m from the first corner, `w` m wide.
 * `from`, `to` and `gate` go together. A wall or another open room still takes the railing away where it stands.
 * Here: the rules (which stretches get a railing, where the gates are, which sides the panel lists, a corner added or taken away keeps
 * the settings at their place). Pure (no three.js, no DOM); unit test: tests/railsides.test.mjs. */

export const GATE = { w: 0.9, min: 0.5, max: 2.5 };
const MIN_RUN = 0.15;                                                   // a stretch shorter than this gets no railing
const r3 = (v) => Math.round(v * 1000) / 1000;
const num = (v) => (v !== null && v !== '' && Number.isFinite(+v) ? +v : null);

/** the length of side k of the outline pts */
export function sideLen(pts, k) {
  const n = pts?.length || 0;
  if (n < 2) return 0;
  const a = pts[((k % n) + n) % n], b = pts[(k + 1) % n];
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** the setting of side k of a room, clamped to the side: { off, from, to, gate: { at, w } | null, len, own (anything set) } */
export function sideOf(room, k) {
  const len = sideLen(room?.points, k), v = Array.isArray(room?.railSides) ? room.railSides[k] : null;
  const out = { off: false, from: 0, to: len, gate: null, len, own: false };
  if (!v || typeof v !== 'object') return out;
  if (v.off) return { ...out, off: true, own: true };
  const f = num(v.from), t = num(v.to);
  out.from = Math.max(0, Math.min(len, f ?? 0));
  out.to = Math.max(out.from, Math.min(len, t ?? len));
  const g = v.gate && typeof v.gate === 'object' ? v.gate : null;
  if (g) {
    const w = Math.max(GATE.min, Math.min(GATE.max, num(g.w) ?? GATE.w, len));
    out.gate = { w, at: Math.max(w / 2, Math.min(len - w / 2, num(g.at) ?? len / 2)) };
  }
  out.own = out.from > 1e-3 || out.to < len - 1e-3 || !!out.gate;
  return out;
}

/** a side's setting as it is stored: null when it is as before, else only what differs (rounded to the mm) */
function stored(s) {
  if (s.off) return { off: true };
  const v = {};
  if (s.from > 1e-3) v.from = r3(s.from);
  if (s.to < s.len - 1e-3) v.to = r3(s.to);
  if (s.gate) v.gate = { at: r3(s.gate.at), w: r3(s.gate.w) };
  return Object.keys(v).length ? v : null;
}
/** keeps railSides as long as the outline and drops it when nothing is set */
function tidy(room) {
  const n = room.points?.length || 0, list = Array.isArray(room.railSides) ? room.railSides.slice(0, n) : [];
  while (list.length && !list[list.length - 1]) list.pop();
  for (let k = 0; k < list.length; k++) if (!list[k]) list[k] = null;
  if (list.length) room.railSides = list; else delete room.railSides;
}

/** changes side k of a room: patch { off, from, to, gate } (gate: { at, w } or null = no gate); the values are clamped to the side */
export function setSide(room, k, patch) {
  if (!room?.points || k < 0 || k >= room.points.length) return;
  const s = { ...sideOf(room, k), ...patch };
  if (patch.gate !== undefined) s.gate = patch.gate ? { at: patch.gate.at ?? s.len / 2, w: patch.gate.w ?? GATE.w } : null;
  const list = Array.isArray(room.railSides) ? room.railSides.slice() : [];
  while (list.length < room.points.length) list.push(null);
  const one = []; one[k] = { from: s.from, to: s.to, gate: s.gate };
  list[k] = s.off ? { off: true } : stored(sideOf({ points: room.points, railSides: one }, k));
  room.railSides = list;
  tidy(room);
}
/** all sides of a room back to „as before“ */
export function resetSides(room) { if (room) delete room.railSides; }

/** the stretches [u0, u1] (m along side k) where `covered(x, z)` is false (no wall, no other open room, no bridge arriving), looked at every
 *  `step` m */
function freeSpans(a, b, len, covered, step) {
  const spans = [], n = Math.max(1, Math.ceil(len / step));
  let start = null;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
    if (covered(x, z)) { if (start !== null) spans.push([start, (len * i) / n]); start = null; } else if (start === null) start = (len * i) / n;
  }
  if (start !== null) spans.push([start, len]);
  return spans;
}
/** [u0, u1] minus [g0, g1] */
const cut = ([u0, u1], [g0, g1]) => (g1 <= u0 || g0 >= u1 ? [[u0, u1]] : [[u0, Math.min(u1, g0)], [Math.max(u0, g1), u1]].filter(([p, q]) => q - p > 1e-6));

/** where the railing of a room runs and where its gates are: { runs: [{ a, b, k }], gates: [{ a, b, k }] } (a, b: [x, z]). As before along
 *  every edge where `covered(x, z)` is false, now only between `from` and `to` of a side, not on a side that is off and not where a gate is;
 *  each stretch longer than 15 cm. A gate is drawn when its middle is not covered. */
export function railPlan(room, covered = () => false, step = 0.2) {
  const pts = room?.points || [], runs = [], gates = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k], b = pts[(k + 1) % pts.length], s = sideOf(room, k);
    if (s.off || s.len < 0.1) continue;
    const at = (u) => [a[0] + ((b[0] - a[0]) * u) / s.len, a[1] + ((b[1] - a[1]) * u) / s.len];
    const g = s.gate ? [s.gate.at - s.gate.w / 2, s.gate.at + s.gate.w / 2] : null;
    freeSpans(a, b, s.len, covered, step).forEach(([u0, u1]) => {
      const lo = Math.max(u0, s.from), hi = Math.min(u1, s.to);
      if (hi - lo <= 1e-6) return;
      (g ? cut([lo, hi], g) : [[lo, hi]]).forEach(([p, q]) => { if (q - p > MIN_RUN) runs.push({ a: at(p), b: at(q), k }); });
    });
    if (g) { const m = at(s.gate.at); if (!covered(m[0], m[1])) gates.push({ a: at(g[0]), b: at(g[1]), k }); }
  }
  return { runs, gates };
}

/** the sides the panel and the plan list, numbered 1, 2, …: every side where a railing would run without a setting (some of it is not
 *  covered), and every side with a setting; [{ k, n, len, a, b, mid: [x, z] }] */
export function listedSides(room, covered = () => false, step = 0.2) {
  const pts = room?.points || [], out = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k], b = pts[(k + 1) % pts.length], len = sideLen(pts, k);
    if (len < 0.1) continue;
    const open = freeSpans(a, b, len, covered, step).some(([u0, u1]) => u1 - u0 > MIN_RUN);
    if (!open && !sideOf(room, k).own && !sideOf(room, k).off) continue;
    out.push({ k, n: out.length + 1, len, a, b, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] });
  }
  return out;
}

/** a corner was added on side i, d m from its first corner (the side becomes sides i and i + 1): the settings stay where they were */
export function splitSide(room, i, d) {
  if (!Array.isArray(room?.railSides)) return;
  const list = room.railSides.slice(), v = list[i] || null;
  let first = v, second = v;
  if (v && !v.off) {
    const f = num(v.from) ?? 0, t = num(v.to), g = v.gate;
    const part = (lo, hi) => {
      const o = {};
      const from = Math.max(f, lo), to = t == null ? hi : Math.min(t, hi);
      if (to - from <= 1e-6) return { off: true };
      if (from > lo + 1e-3) o.from = r3(from - lo);
      if (t != null && to < hi - 1e-3) o.to = r3(to - lo);
      if (g && num(g.at) != null && num(g.at) >= lo && num(g.at) < hi) o.gate = { at: r3(+g.at - lo), w: g.w };
      return Object.keys(o).length ? o : null;
    };
    first = part(0, d); second = part(d, Infinity);
  }
  list.splice(i, 1, first, second);
  room.railSides = list;
  tidy(room);
}
/** corner i is taken away (the sides i - 1 and i become one, starting at the same corner as side i - 1): side i - 1 keeps its setting */
export function dropCorner(room, i) {
  if (!Array.isArray(room?.railSides)) return;
  const list = room.railSides.slice();
  list.splice(i, 1);
  room.railSides = list;
  tidy(room);
}
