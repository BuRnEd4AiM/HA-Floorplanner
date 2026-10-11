/* A roof with steps (#342): a house that is narrower at the front and wider at the back. Each eave side (side 0 = A at the low edge across
 * the ridge, side 1 = B) can have steps: from a point along the ridge (metres from the gable at the low end of the ridge axis: the base box's
 * x0 or z0) its eave lies further out (out > 0) or in (out < 0) than the base box, up to the next step. The ridge stays straight and at one
 * height and the eave stays at the height of the walls, so where the house is wider the slope is a little flatter; at a step a small
 * upright triangle closes the gap between the two slopes. Gable and flat roofs only (a hip roof keeps its rectangle).
 * Stored as roof.steps = [{ side, at, out }]. Pure, no three.js, no DOM (unit test: tests/roofsteps.test.mjs). */

export const MAX_STEPS = 20;
export const MIN_SECTION = 0.3;                                    // a piece of the eave is at least this long (m)
export const MAX_OUT = 20;                                         // how far an eave can move out (m)

const r3 = (v) => Math.round(v * 1000) / 1000;
const sideOf = (s) => (s?.side === 1 || s?.side === 'b' ? 1 : 0);

/** does the ridge run along x: the longer side unless set (the same rule as roofFrame) */
export const alongXOf = (bb, r) => (r?.ridge ? r.ridge === 'x' : bb.x1 - bb.x0 >= bb.z1 - bb.z0);
/** can roof r have steps (gable and flat roofs) */
export const stepsAllowed = (r) => !!r && r.type !== 'hip';
/** the base box along the ridge (a0, a1) and across it (b0, b1) */
const axes = (bb, alongX) => (alongX ? { a0: bb.x0, a1: bb.x1, b0: bb.z0, b1: bb.z1 } : { a0: bb.z0, a1: bb.z1, b0: bb.x0, b1: bb.x1 });
/** an eave moves in at most to 30 cm before the ridge, out at most MAX_OUT */
const clampOut = (o, depth) => Math.max(-Math.max(0, depth / 2 - 0.3), Math.min(MAX_OUT, o));

/** the pieces of the eave of one side: [{ a0, a1, out }] along the ridge (world x or z) from the start of the base box to its end; out: how
 *  far the eave lies outside the base box (negative: inside). Without steps one piece with out 0. A step at 0 moves the first piece; a step
 *  less than MIN_SECTION from the one before or from the end does not count */
export function sectionsOf(bb, r, side) {
  if (!bb) return [];
  const { a0, a1, b0, b1 } = axes(bb, alongXOf(bb, r)), len = a1 - a0;
  const steps = stepsAllowed(r) ? (r.steps || []).filter((s) => sideOf(s) === side && Number.isFinite(+s.at) && Number.isFinite(+s.out)) : [];
  const pts = steps.slice(0, MAX_STEPS).map((s) => ({ at: Math.max(0, Math.min(len, +s.at)), out: clampOut(+s.out, b1 - b0) })).sort((p, q) => p.at - q.at);
  const out = [];
  let cur = { a0, out: 0 };
  for (const p of pts) {
    if (p.at <= 1e-9 && !out.length && cur.a0 === a0) { cur.out = p.out; continue; }   // a step at the start: the first piece
    const at = a0 + p.at;
    if (at < cur.a0 + MIN_SECTION - 1e-9 || at > a1 - MIN_SECTION + 1e-9) continue;
    out.push({ a0: cur.a0, a1: at, out: cur.out });
    cur = { a0: at, out: p.out };
  }
  out.push({ a0: cur.a0, a1, out: cur.out });
  return out;
}

/** how far the eave of side `side` lies outside the base box at a (along the ridge); beyond the box the first or last piece counts */
export function outAt(bb, r, side, a) {
  const s = sectionsOf(bb, r, side);
  if (!s.length) return 0;
  return (s.find((q) => a < q.a1 - 1e-9) || s[s.length - 1]).out;
}
/** does roof r have an eave that is not on its base box */
export const hasSteps = (bb, r) => [0, 1].some((side) => sectionsOf(bb, r, side).some((s) => Math.abs(s.out) > 1e-9));

/** the pieces along the ridge where neither eave changes: [{ a0, a1, out0, out1 }], the first one from `from`, the last one to `to` (e.g. the
 *  ends of the roof with its overhang) */
export function intervals(bb, r, from, to) {
  const cuts = [0, 1].flatMap((side) => sectionsOf(bb, r, side).slice(1).map((s) => s.a0));
  const bounds = [from, ...[...new Set(cuts)].filter((c) => c > from + 1e-9 && c < to - 1e-9).sort((p, q) => p - q), to];
  return bounds.slice(0, -1).map((a, i) => {
    const m = (a + bounds[i + 1]) / 2;
    return { a0: a, a1: bounds[i + 1], out0: outAt(bb, r, 0, m), out1: outAt(bb, r, 1, m) };
  });
}

/** the outline of the house under roof r: its base box with the steps, [[x, z], ...] going round (for the 2D plan) */
export function outline(bb, r) {
  const alongX = alongXOf(bb, r), { a0, a1, b0, b1 } = axes(bb, alongX), iv = intervals(bb, r, a0, a1);
  const P = (a, b) => (alongX ? [r3(a), r3(b)] : [r3(b), r3(a)]);
  const pts = [...iv.flatMap((s) => [P(s.a0, b0 - s.out0), P(s.a1, b0 - s.out0)]), ...[...iv].reverse().flatMap((s) => [P(s.a1, b1 + s.out1), P(s.a0, b1 + s.out1)])];
  const uniq = pts.filter((p, i) => { const q = pts[(i + pts.length - 1) % pts.length]; return p[0] !== q[0] || p[1] !== q[1]; });
  return uniq.filter((p, i) => {                                   // no corner in the middle of a straight edge
    const q = uniq[(i + uniq.length - 1) % uniq.length], n = uniq[(i + 1) % uniq.length];
    return Math.abs((p[0] - q[0]) * (n[1] - p[1]) - (p[1] - q[1]) * (n[0] - p[0])) > 1e-9;
  });
}

/** the handles of the pieces of the eaves in the 2D plan, on the sides with a step: the middle of each piece, [{ side, i, x, z }] */
export function stepHandles(bb, r) {
  const alongX = alongXOf(bb, r), { b0, b1 } = axes(bb, alongX), out = [];
  for (const side of [0, 1]) {
    const secs = sectionsOf(bb, r, side);
    if (secs.length < 2) continue;
    secs.forEach((s, i) => {
      const a = (s.a0 + s.a1) / 2, b = side === 0 ? b0 - s.out : b1 + s.out;
      out.push({ side, i, x: alongX ? a : b, z: alongX ? b : a });
    });
  }
  return out;
}

/** a new step where the point (x, z) lies on an eave of roof r (at most tol m away): the piece after it keeps the eave until its handle is
 *  dragged. The side, or null when the point is on no eave (or too near a step or an end) */
export function addStepAt(bb, r, x, z, tol) {
  if (!bb || !stepsAllowed(r) || (r.steps || []).length >= MAX_STEPS) return null;
  const alongX = alongXOf(bb, r), { a0, a1, b0, b1 } = axes(bb, alongX), a = alongX ? x : z, b = alongX ? z : x;
  if (a < a0 + MIN_SECTION || a > a1 - MIN_SECTION) return null;
  for (const side of [0, 1]) {
    const o = outAt(bb, r, side, a);
    if (Math.abs(b - (side === 0 ? b0 - o : b1 + o)) > tol) continue;
    if (sectionsOf(bb, r, side).some((s, i) => i > 0 && Math.abs(s.a0 - a) < MIN_SECTION)) return null;
    (r.steps ||= []).push({ side, at: r3(a - a0), out: r3(o) });
    return side;
  }
  return null;
}

/** the stored step that starts piece i of side `side`; for the first piece one at 0 is made when `make` and there is none */
function stepFor(bb, r, side, i, make) {
  const s = sectionsOf(bb, r, side)[i];
  if (!s || !stepsAllowed(r)) return null;
  const at = i === 0 ? 0 : s.a0 - axes(bb, alongXOf(bb, r)).a0;
  let st = (r.steps || []).find((q) => sideOf(q) === side && Math.abs(Math.max(0, +q.at) - at) < 1e-6);
  if (!st && make && i === 0) (r.steps ||= []).push((st = { side, at: 0, out: 0 }));
  return st || null;
}
/** piece i of the eave of side `side` dragged to the point (x, z): its eave goes there (out from the base box, on the `grid`, 0 = free). true
 *  when it changed */
export function moveSection(bb, r, side, i, x, z, grid) {
  if (!bb || !stepsAllowed(r)) return false;
  const alongX = alongXOf(bb, r), { b0, b1 } = axes(bb, alongX), b = alongX ? z : x;
  let o = side === 0 ? b0 - b : b - b1;
  if (grid > 0) o = Math.round(o / grid) * grid;
  o = r3(clampOut(o, b1 - b0));
  const st = stepFor(bb, r, side, i, true);
  if (!st || Math.abs(+st.out - o) < 1e-9) return false;
  st.out = o;
  return true;
}
/** remove the step that starts piece i of side `side` (the first piece: its eave goes back onto the base box). true when removed */
export function removeStep(bb, r, side, i) {
  const st = stepFor(bb, r, side, i, false);
  if (!st) return false;
  r.steps = r.steps.filter((q) => q !== st);
  if (!r.steps.length) delete r.steps;
  return true;
}

/** the frame of one slope piece, from the roof's frame F (roofFrame): the eave of side `side` moved out by `out` (b0 or b1, the distance to
 *  the ridge `half` and the slope `tan` change; the ridge bc and its height h stay) */
export function sectionFrame(F, side, out) {
  const bc = F.bc ?? (F.b0 + F.b1) / 2, h = F.h ?? F.half * F.tan;
  if (!out) return { ...F, bc, h };
  const half = F.half + out;
  return { ...F, bc, h, half, tan: h / half, ...(side === 0 ? { b0: F.b0 - out } : { b1: F.b1 + out }) };
}

/** keep the steps of a roof that make sense (import, panel): [{ side 0|1, at, out }] in metres */
export function cleanSteps(list) {
  return (Array.isArray(list) ? list : []).slice(0, MAX_STEPS).filter((s) => s && Number.isFinite(+s.at) && Number.isFinite(+s.out))
    .map((s) => ({ side: sideOf(s), at: r3(Math.max(0, +s.at)), out: r3(Math.max(-MAX_OUT, Math.min(MAX_OUT, +s.out))) }));
}
