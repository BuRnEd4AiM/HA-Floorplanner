/* Two doors / windows at the same place on a wall, one above the other (#694, ChrisSN86: in a higher part of the house a window sits
 * over each terrace door, "mit Wand dazwischen", each with its own roller shutter). Two openings may share their stretch of the wall when
 * their heights (sill .. sill + height) do not overlap; side by side they keep at least 2 cm of wall between them, as before.
 * walls.js asks blocked() and builds the wall round them with solidParts(), plan2d.js draws the gaps (alongGaps), the upper one dashed
 * (isAbove) and picks the next one of a stack with a second click (nextInStack), openingstackui.js puts a window above (roomAbove) and
 * props.js keeps a new height or sill from running into the other one (trySpan).
 * Pure functions (no three.js, no DOM; unit test: tests/openingstack.test.mjs). */

export const SIDE_GAP = 0.02;   // side by side: at least 2 cm of wall between two openings (as before #694)
export const LINTEL = 0.25;     // a window put above another one: the wall left between them
export const TOP_GAP = 0.15;    // ... and under the top of the wall
export const MIN_HIGH = 0.3;    // the lowest window put above another one (the smallest height the properties take)
export const HIGH_WANT = 0.8;   // ... and how high it is when there is room for more

const num = (v, d = 0) => (v === null || v === undefined || v === '' || !Number.isFinite(+v) ? d : +v);
const r2 = (v) => Math.round(v * 100) / 100;

/** the heights an opening (or { sill, height }) takes in its wall: [bottom, top] in m over the floor */
export const spanOf = (o) => { const s = num(o?.sill); return [s, s + Math.max(0, num(o?.height))]; };
/** do two height spans overlap? Touching is fine (the frames sit on each other) */
export const heightsMeet = (a, b) => a[0] < b[1] - 1e-6 && b[0] < a[1] - 1e-6;
/** do opening e and an opening `width` wide at `pos` come closer along the wall than `gap` (0: do they share a stretch of it)? */
export const alongMeet = (e, pos, width, gap = SIDE_GAP) => Math.abs(num(e?.pos) - pos) < (num(e?.width) + width) / 2 + gap;

/** is the place `width` wide at `pos` on wall w taken by another opening than ignoreId? With `span` (an opening or { sill, height }) only
 *  by one whose heights overlap it too: one above the other is fine. Without it any opening there takes it (as before #694). */
export function blocked(w, pos, width, ignoreId, span) {
  const v = span ? spanOf(span) : null;
  return (w?.openings || []).some((e) => e.id !== ignoreId && alongMeet(e, pos, width) && (!v || heightsMeet(spanOf(e), v)));
}

/** the openings of wall w that share o's stretch of the wall (o too), lowest first; [o] when it stands alone */
export function stackOf(w, o) {
  if (!o) return [];
  const list = (w?.openings || []).filter((e) => e === o || e.id === o.id || alongMeet(e, num(o.pos), num(o.width), 0));
  if (!list.includes(o) && !list.some((e) => e.id === o.id)) list.push(o);
  return list.sort((a, b) => spanOf(a)[0] - spanOf(b)[0]);
}
/** does another opening of wall w lie under o on its stretch of the wall (then o is the upper one: drawn dashed in the plan) */
export const isAbove = (w, o) => stackOf(w, o).some((e) => e !== o && e.id !== o.id && spanOf(e)[1] <= spanOf(o)[0] + 1e-6);
/** the openings of wall w right above and below o on its stretch: { above, below } (null where there is none) */
export function neighbours(w, o) {
  const [b, t] = spanOf(o), others = stackOf(w, o).filter((e) => e !== o && e.id !== o.id);
  const above = others.filter((e) => spanOf(e)[0] >= t - 1e-6).sort((p, q) => spanOf(p)[0] - spanOf(q)[0])[0] || null;
  const below = others.filter((e) => spanOf(e)[1] <= b + 1e-6).sort((p, q) => spanOf(q)[1] - spanOf(p)[1])[0] || null;
  return { above, below };
}
/** the id of the opening after `id` in its stack (from the bottom up, round again): a second click in the plan picks the other one; null
 *  when it stands alone */
export function nextInStack(w, id) {
  const o = (w?.openings || []).find((e) => e.id === id);
  const st = stackOf(w, o);
  if (st.length < 2) return null;
  const i = st.findIndex((e) => e.id === id);
  return st[(i + 1) % st.length].id;
}

/** set o.height or o.sill (`key`) to v unless o would then run into another opening of wall w above or below it (one it did not run
 *  into before: a layout from before #694 keeps working). Returns true when it was set. */
export function trySpan(w, o, key, v) {
  const hits = (span) => new Set((w?.openings || []).filter((e) => e !== o && e.id !== o.id && alongMeet(e, num(o.pos), num(o.width)) && heightsMeet(spanOf(e), span)).map((e) => e.id));
  const before = hits(spanOf(o)), after = hits(spanOf({ ...o, [key]: v }));
  if ([...after].some((id) => !before.has(id))) return false;
  o[key] = v;
  return true;
}

/** where a window goes above opening o on wall w (wall height H): { sill, height } with LINTEL of wall between them and TOP_GAP under
 *  the top of the wall, HIGH_WANT high when there is room for it, at least MIN_HIGH; null when there is no room or one is there already */
export function roomAbove(w, o, H) {
  if (!o) return null;
  if (neighbours(w, o).above) return null;
  const sill = r2(spanOf(o)[1] + LINTEL), top = num(H, 2.6) - TOP_GAP;
  const height = r2(Math.min(HIGH_WANT, top - sill));
  if (height < MIN_HIGH - 1e-6) return null;
  const v = [sill, sill + height];
  if ((w?.openings || []).some((e) => e.id !== o.id && alongMeet(e, num(o.pos), num(o.width)) && heightsMeet(spanOf(e), v))) return null;   // a wider neighbour up there
  return { sill, height };
}

/** the solid parts of a wall `len` long, `t` thick and `H` high round its openings, in the wall's own x (its middle at 0, the ends
 *  reach t / 2 past a and b, as the wall pieces always did) and y (from the floor): [{ x0, x1, y0, y1 }]. Along the wall it is cut where
 *  an opening starts or ends; each piece keeps the heights none of the openings over it take, so the wall stays between two openings
 *  one above the other. Side by side it gives the same pieces as before #694 (the wall before, above and below each opening). */
export function solidParts(len, t, H, openings) {
  const half = len / 2, X0 = -half - t / 2, X1 = half + t / 2;
  const cuts = (openings || []).map((o) => {
    const c = num(o.pos) - half, w = num(o.width), [y0, y1] = spanOf(o);
    return { a: c - w / 2, b: c + w / 2, y0, y1 };
  }).filter((q) => q.b - q.a > 1e-9);
  const xs = [...new Set([X0, X1, ...cuts.flatMap((q) => [q.a, q.b])])].filter((x) => x >= X0 && x <= X1).sort((p, q) => p - q);
  const out = [];
  for (let i = 0; i + 1 < xs.length; i++) {
    const x0 = xs[i], x1 = xs[i + 1], m = (x0 + x1) / 2;
    if (x1 - x0 < 0.001) continue;
    const holes = cuts.filter((q) => q.a < m && m < q.b).map((q) => [q.y0, q.y1]).sort((p, q) => p[0] - q[0]);
    let y = 0;
    for (const [h0, h1] of holes) {
      if (h0 > y) out.push({ x0, x1, y0: y, y1: Math.min(h0, H) });
      y = Math.max(y, h1);
      if (y >= H) break;
    }
    if (y < H) out.push({ x0, x1, y0: y, y1: H });
  }
  return out.filter((p) => p.y1 - p.y0 >= 0.001);
}

/** where the plan leaves a gap in a wall for its openings: their stretches along it (from a), joined where they overlap, in order:
 *  [[from, to], ...]. Two openings one above the other make one gap. */
export function alongGaps(openings) {
  const iv = (openings || []).map((o) => [num(o.pos) - num(o.width) / 2, num(o.pos) + num(o.width) / 2]).filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
  const out = [];
  for (const [a, b] of iv) {
    const last = out[out.length - 1];
    if (last && a < last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}
