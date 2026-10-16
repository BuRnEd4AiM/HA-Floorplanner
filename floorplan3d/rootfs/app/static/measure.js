/* Measuring in the 2D plan (tool "Messen", key M): where a click lands (a corner, the face of a wall, else the free point), the distance
 * between two points with its parts, and for two walls their distance (between the faces and between the middle lines) and the angle
 * between them, with what moves when a distance or an angle is typed in: the second wall, the walls joined to it stretch along.
 * Pure (unit test: tests/measure.test.mjs); measuretool.js shows it in the side panel and in 3D, plan2d.js draws measureSvg in the plan. */
import { readableAngle } from './planview.js';

const NEAR = 0.02;                                        // 2 cm: points closer than this are the same point
export const PARALLEL_DEG = 0.5;                          // walls that differ by less than this in direction count as parallel
const SIN_PAR = Math.sin((PARALLEL_DEG * Math.PI) / 180);
const COL = { line: '#ffd84a', stay: '#23e0ff', moves: '#ffb04a', perp: '#7dff9a', dark: 'rgba(3,21,71,.9)' };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const len = (v) => Math.hypot(v[0], v[1]);
const unit = (v) => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const turn = (v, th) => [v[0] * Math.cos(th) - v[1] * Math.sin(th), v[0] * Math.sin(th) + v[1] * Math.cos(th)];
const same = (p, q) => Math.abs(p[0] - q[0]) < NEAR && Math.abs(p[1] - q[1]) < NEAR;
const r4 = (v) => +v.toFixed(4);
const thick = (w) => w.thickness ?? 0.2;
const dirOf = (w) => unit(sub(w.b, w.a));
const normal = (d) => [-d[1], d[0]];
const mid = (w) => [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
/** distance of point p from the segment a–b */
export function distSeg(p, a, b) {
  const d = sub(b, a), L2 = dot(d, d) || 1e-12, k = Math.max(0, Math.min(1, dot(sub(p, a), d) / L2));
  return Math.hypot(p[0] - (a[0] + d[0] * k), p[1] - (a[1] + d[1] * k));
}
/** where the line through p (direction d) crosses the line through q (direction e); null when they are parallel */
function lineCross(p, d, q, e) {
  const c = cross(d, e);
  if (Math.abs(c) < 1e-9) return null;
  const k = cross(sub(q, p), e) / c;
  return [p[0] + d[0] * k, p[1] + d[1] * k];
}
/** where the middle lines of two walls cross; null when the walls are parallel */
export const crossing = (wa, wb) => (Math.abs(cross(dirOf(wa), dirOf(wb))) < SIN_PAR ? null : lineCross(wa.a, dirOf(wa), wb.a, dirOf(wb)));

/** the corners of the wall faces where walls meet (an L or a T): the inner and outer corner you see in the plan, [[x, z], ...] */
export function faceCorners(f) {
  const out = [];
  f.walls.forEach((wb) => [[wb.a, wb.b], [wb.b, wb.a]].forEach(([p, other]) => {
    const db = dirOf(wb), nb = normal(db), hb = thick(wb) / 2, rb = unit(sub(other, p));   // rb: from the joint into wall b
    f.walls.forEach((wa) => {
      if (wa === wb || distSeg(p, wa.a, wa.b) > NEAR) return;
      const da = dirOf(wa);
      if (Math.abs(cross(da, db)) < SIN_PAR) return;
      const na = normal(da), ha = thick(wa) / 2, end = same(p, wa.a) ? wa.b : same(p, wa.b) ? wa.a : null;
      const ra = end && unit(sub(end, p));                                                  // an L: from the joint into wall a; a T: none
      for (const sa of [-1, 1]) for (const sb of [-1, 1]) {
        const ka = dot([na[0] * sa, na[1] * sa], rb), kb = dot([nb[0] * sb, nb[1] * sb], ra || [0, 0]);
        if (ra ? Math.sign(ka) !== Math.sign(kb) : ka <= 0) continue;                       // an L: the inner and the outer corner, a T: the two on b's side
        const q = lineCross([wa.a[0] + na[0] * sa * ha, wa.a[1] + na[1] * sa * ha], da, [wb.a[0] + nb[0] * sb * hb, wb.a[1] + nb[1] * sb * hb], db);
        if (q && len(sub(q, p)) <= 2 * (ha + hb)) out.push(q);
      }
    });
  }));
  return out;
}

/** where a click at (x, z) lands: the nearest corner within tol.corner (a wall end, a corner of a wall face, a room / block / floor opening
 *  corner), else the face of the wall under it (the side the pointer is on; within tol.wall), else the free point. free: no snapping (Alt).
 *  A point on a wall remembers where on the wall it is ({ wall, t: 0..1 along it, off: across, + the face side }), so it follows the wall. */
export function measurePoint(f, x, z, tol = {}, free = false) {
  const tc = tol.corner ?? 0.15, tw = tol.wall ?? 0.08;
  if (free || !f) return { x, z };
  let best = null, bd = tc;
  const test = (p, extra) => { const d = Math.hypot(p[0] - x, p[1] - z); if (d < bd) { bd = d; best = { x: p[0], z: p[1], ...extra, corner: true }; } };
  f.walls.forEach((w) => { test(w.a, { wall: w.id, t: 0, off: 0 }); test(w.b, { wall: w.id, t: 1, off: 0 }); });
  faceCorners(f).forEach((p) => test(p));
  [...(f.rooms || []), ...(f.blocks || []), ...(f.holes || [])].forEach((r) => r.points.forEach((p) => test(p)));
  if (best) return best;
  let hit = null, hd = Infinity;
  f.walls.forEach((w) => {
    const d = distSeg([x, z], w.a, w.b);
    if (d <= thick(w) / 2 + tw && d < hd) { hd = d; hit = w; }
  });
  if (!hit) return { x, z };
  const d = dirOf(hit), L = len(sub(hit.b, hit.a)) || 1, r = sub([x, z], hit.a);
  const t = Math.max(0, Math.min(1, dot(r, d) / L)), off = (cross(d, r) < 0 ? -1 : 1) * thick(hit) / 2;
  const p = { wall: hit.id, t: +t.toFixed(5), off };
  const [px, pz] = pointXZ(f, p);
  return { x: px, z: pz, ...p };
}
/** [x, z] of a measure point on floor f: a point on a wall goes where the wall is now */
export function pointXZ(f, p) {
  const w = p.wall && f?.walls.find((q) => q.id === p.wall);
  if (!w) return [p.x, p.z];
  const d = dirOf(w), n = normal(d), L = len(sub(w.b, w.a));
  return [w.a[0] + d[0] * p.t * L + n[0] * p.off, w.a[1] + d[1] * p.t * L + n[1] * p.off];
}
/** the line from a to b: its length, how far across (dx) and down (dz) the plan, and its slope against the plan's x axis (0..90°) */
export function lineInfo(a, b) {
  const dx = Math.abs(b[0] - a[0]), dz = Math.abs(b[1] - a[1]);
  return { len: Math.hypot(dx, dz), dx, dz, deg: dx || dz ? (Math.atan2(dz, dx) * 180) / Math.PI : 0 };
}

/** which way each wall points for the angle between them (fixed when the walls are picked, so the angle does not jump when a wall
 *  turns): from where their lines cross towards the point clicked on it (on the crossing itself: towards its far end); parallel walls
 *  point the same way (0°). { sa, sb } (+1: from a to b of the wall, -1: the other way) */
export function pairOrient(wa, wb, pa, pb) {
  const da = dirOf(wa), db = dirOf(wb), P = crossing(wa, wb);
  if (!P) return { sa: 1, sb: dot(da, db) >= 0 ? 1 : -1 };
  const side = (w, d, p) => {
    const k = dot(sub(p, P), d);
    if (Math.abs(k) > NEAR) return Math.sign(k);
    const far = len(sub(w.a, P)) > len(sub(w.b, P)) ? w.a : w.b;
    return Math.sign(dot(sub(far, P), d)) || 1;
  };
  return { sa: side(wa, da, pa), sb: side(wb, db, pb) };
}
/** two walls: { parallel, angle (0..180°, between the directions of pairOrient o), crossing (where the lines meet, null if parallel),
 *  and for parallel walls center (distance of the middle lines), clear (between the faces that look at each other), inline (on one line) } */
export function wallPair(wa, wb, o = { sa: 1, sb: 1 }) {
  const da = dirOf(wa), db = dirOf(wb), u = [da[0] * o.sa, da[1] * o.sa], v = [db[0] * o.sb, db[1] * o.sb];
  const angle = (Math.acos(Math.max(-1, Math.min(1, dot(u, v)))) * 180) / Math.PI;
  const P = crossing(wa, wb);
  if (P) return { parallel: false, angle, crossing: P };
  const center = Math.abs(cross(da, sub(mid(wb), wa.a)));
  return { parallel: true, angle, crossing: null, center, clear: center - thick(wa) / 2 - thick(wb) / 2, inline: center < NEAR };
}
/** how far wall b has to move (at right angles, [dx, dz]) so that its distance to the parallel wall a becomes `target` metres; kind
 *  'clear': between the faces, 'center': between the middle lines. null: not parallel, on one line, or the walls would overlap */
export function distanceShift(wa, wb, target, kind = 'clear') {
  const pr = wallPair(wa, wb);
  if (!pr.parallel || pr.inline || !Number.isFinite(target)) return null;
  const gap = kind === 'center' ? target - thick(wa) / 2 - thick(wb) / 2 : target;
  if (gap < -1e-9) return null;
  const n = normal(dirOf(wa)), side = Math.sign(dot(sub(mid(wb), wa.a), n)) || 1, k = side * (target - (kind === 'center' ? pr.center : pr.clear));
  return [n[0] * k, n[1] * k];
}
/** how wall b turns so that the angle to wall a becomes `deg` (0..180, directions of pairOrient o): round `pivot` by `turn` radians.
 *  The pivot is where the lines cross when that is on wall b, else the end of b nearer to it (parallel walls: the end nearer to a, and b
 *  turns away from a). null: no valid angle */
export function angleTurn(wa, wb, o, deg) {
  if (!Number.isFinite(deg) || deg < 0 || deg > 180) return null;
  const da = dirOf(wa), db = dirOf(wb), u = [da[0] * o.sa, da[1] * o.sa], v = [db[0] * o.sb, db[1] * o.sb], P = crossing(wa, wb);
  const th = (deg * Math.PI) / 180;
  const by = (w) => Math.atan2(cross(v, w), dot(v, w));                     // the turn from v to w
  if (P) {
    const pivot = distSeg(P, wb.a, wb.b) < NEAR ? P : len(sub(wb.a, P)) <= len(sub(wb.b, P)) ? [...wb.a] : [...wb.b];
    return { pivot, turn: by(turn(u, (Math.sign(cross(u, v)) || 1) * th)) };
  }
  const pivot = distSeg(wb.a, wa.a, wa.b) <= distSeg(wb.b, wa.a, wa.b) ? [...wb.a] : [...wb.b];
  const far = sub(same(pivot, wb.a) ? wb.b : wb.a, pivot), side = Math.sign(cross(da, sub(mid(wb), wa.a))) || 1;
  const away = (tr) => { const q = turn(far, tr); return side * cross(da, sub([pivot[0] + q[0], pivot[1] + q[1]], wa.a)); };   // how far b's far end is from a's line
  const plus = by(turn(u, th)), minus = by(turn(u, -th));
  return { pivot, turn: away(plus) >= away(minus) ? plus : minus };
}

/** the walls that make one straight wall with w: on its line and joined to it end to end (or overlapping it), like a wall drawn in several
 *  pieces; w first, never `stop` */
export function wallRun(f, w, stop = null) {
  const d = dirOf(w), run = [w];
  const onLine = (q) => Math.abs(cross(d, dirOf(q))) < SIN_PAR && Math.abs(cross(d, sub(q.a, w.a))) < NEAR;
  const touch = (p, q) => [q.a, q.b].some((e) => distSeg(e, p.a, p.b) < NEAR) || [p.a, p.b].some((e) => distSeg(e, q.a, q.b) < NEAR);
  for (let i = 0; i < run.length; i++) {
    const cur = run[i];
    f.walls.forEach((q) => { if (!run.includes(q) && q !== stop && onLine(q) && touch(cur, q)) run.push(q); });
  }
  return run;
}
/** the corner points that move with the walls of `run`: every wall, room and block corner lying on them (2 cm), so the walls joined to
 *  them (also one that ends in the middle of them) stretch along and the rooms follow; never a corner of `keep` (the wall that stays) */
export function pointsOn(f, run, keep = null) {
  const all = new Set([...f.walls.filter((w) => w !== keep).flatMap((w) => [w.a, w.b]), ...(f.rooms || []).flatMap((r) => r.points), ...(f.blocks || []).flatMap((r) => r.points)]);
  return [...all].filter((p) => run.some((w) => distSeg(p, w.a, w.b) < NEAR));
}

/* ---------- a measurement: { floor, a, b, pair } (a, b: measure points, pair: { stay, moves (wall ids), o (pairOrient of stay, moves) }) ---------- */

/** the measurement after a click at point pt: the first click starts one, the second ends it (two points on two walls: a pair of walls),
 *  the next starts a new one */
export function nextMeasure(m, pt, f, floor) {
  if (!m || !m.a || m.b || m.floor !== floor) return { floor, a: pt, b: null, pair: null };
  const wa = !pt.corner && !m.a.corner && m.a.wall && f.walls.find((w) => w.id === m.a.wall), wb = !pt.corner && pt.wall && f.walls.find((w) => w.id === pt.wall);
  const pair = wa && wb && wa !== wb ? { stay: wa.id, moves: wb.id, o: pairOrient(wa, wb, pointXZ(f, m.a), pointXZ(f, pt)) } : null;
  return { floor, a: m.a, b: pt, pair };
}
/** the other wall of the pair moves instead */
export const swapPair = (m) => (m?.pair ? { ...m, pair: { stay: m.pair.moves, moves: m.pair.stay, o: { sa: m.pair.o.sb, sb: m.pair.o.sa } } } : m);
/** the two walls of the pair on floor f: { stay, moves } (null when one of them is gone) */
export function pairWalls(f, m) {
  const stay = m?.pair && f?.walls.find((w) => w.id === m.pair.stay), moves = m?.pair && f?.walls.find((w) => w.id === m.pair.moves);
  return stay && moves ? { stay, moves } : null;
}
/** everything shown about measurement m: { a, b ([x, z]), line (lineInfo), pair (wallPair) } or null */
export function measureInfo(f, m) {
  if (!m?.a || !m.b) return null;
  const a = pointXZ(f, m.a), b = pointXZ(f, m.b), pw = pairWalls(f, m);
  return { a, b, line: lineInfo(a, b), pair: pw ? wallPair(pw.stay, pw.moves, m.pair.o) : null };
}
/** move the second wall of the pair (with the whole straight wall it belongs to) so the distance becomes `target` m (kind 'clear' | 'center');
 *  before(): called just before anything changes (the undo step). 'ok', 'locked' (a wall that moves is locked), 'no' (not possible) */
export function setDistance(f, m, target, kind = 'clear', before = () => {}) {
  const pw = pairWalls(f, m);
  const sh = pw && distanceShift(pw.stay, pw.moves, target, kind);
  if (!sh) return 'no';
  const run = wallRun(f, pw.moves, pw.stay);
  if (run.some((w) => w.locked)) return 'locked';
  before();
  pointsOn(f, run, pw.stay).forEach((p) => { p[0] = r4(p[0] + sh[0]); p[1] = r4(p[1] + sh[1]); });
  return 'ok';
}
/** turn the second wall of the pair so the angle becomes `deg`; before() as in setDistance; 'ok', 'locked', 'no' */
export function setAngle(f, m, deg, before = () => {}) {
  const pw = pairWalls(f, m);
  const tr = pw && angleTurn(pw.stay, pw.moves, m.pair.o, deg);
  if (!tr) return 'no';
  if (pw.moves.locked) return 'locked';
  before();
  pointsOn(f, [pw.moves], pw.stay).filter((p) => !same(p, tr.pivot)).forEach((p) => {
    const q = turn(sub(p, tr.pivot), tr.turn);
    p[0] = r4(tr.pivot[0] + q[0]); p[1] = r4(tr.pivot[1] + q[1]);
  });
  return 'ok';
}

/* ---------- drawing in the 2D plan ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** the outline of wall w, `pad` metres wider than the wall all round */
function outline(w, pad) {
  const d = dirOf(w), n = normal(d), h = thick(w) / 2 + pad, e = thick(w) / 2 + pad;
  const A = [w.a[0] - d[0] * e, w.a[1] - d[1] * e], B = [w.b[0] + d[0] * e, w.b[1] + d[1] * e];
  return [[A[0] + n[0] * h, A[1] + n[1] * h], [B[0] + n[0] * h, B[1] + n[1] * h], [B[0] - n[0] * h, B[1] - n[1] * h], [A[0] - n[0] * h, A[1] - n[1] * h]];
}
/** SVG of measurement m on floor f (plus the point under the pointer, `hover`, while points are picked). view: { sx(x), sy(z), s (px per
 *  metre), rot (degrees the plan is turned), fmtLen(m) } */
export function measureSvg(f, m, hover, view) {
  const { sx, sy, s, rot = 0, fmtLen } = view;
  const P = (p) => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`;
  const label = (a, b, txt, col, away = 12) => {                // a text along the line a–b, beside it, on a dark pill (readable over room names)
    const ang = readableAngle((Math.atan2(sy(b[1]) - sy(a[1]), sx(b[0]) - sx(a[0])) * 180) / Math.PI, rot), th = (ang * Math.PI) / 180;
    const x = (sx(a[0]) + sx(b[0])) / 2 + Math.sin(th) * away, y = (sy(a[1]) + sy(b[1])) / 2 - Math.cos(th) * away, w = txt.length * 7.6 + 10;
    const tr = `transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${ang.toFixed(1)})"`;
    return `<rect ${tr} x="${(-w / 2).toFixed(1)}" y="-9" width="${w.toFixed(1)}" height="18" rx="9" fill="${COL.dark}" pointer-events="none"/>`
      + `<text class="msLabel" ${tr} text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="700" fill="${col}" pointer-events="none">${esc(txt)}</text>`;
  };
  const line = (a, b, col, dash = '') => {
    const ex = sx(b[0]) - sx(a[0]), ey = sy(b[1]) - sy(a[1]), L = Math.hypot(ex, ey) || 1, tx = (-ey / L) * 7, ty = (ex / L) * 7;
    const tick = (p) => `M${(sx(p[0]) - tx).toFixed(1)} ${(sy(p[1]) - ty).toFixed(1)}L${(sx(p[0]) + tx).toFixed(1)} ${(sy(p[1]) + ty).toFixed(1)}`;
    return `<path d="M${P(a)}L${P(b)}" stroke="${col}" stroke-width="2" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''} pointer-events="none"/>`
      + `<path d="${tick(a)}${tick(b)}" stroke="${col}" stroke-width="2" fill="none" pointer-events="none"/>`;
  };
  const dotAt = (p, col) => `<circle cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="4" fill="${col}" stroke="${COL.dark}" stroke-width="1.5" pointer-events="none"/>`;
  let o = '';
  const pw = m?.b ? pairWalls(f, m) : null;
  if (pw) {
    o += `<polygon class="msStay" points="${outline(pw.stay, 0.05).map(P).join(' ')}" fill="none" stroke="${COL.stay}" stroke-width="2" stroke-dasharray="6 4" pointer-events="none"/>`;
    o += `<polygon class="msMoves" points="${outline(pw.moves, 0.05).map(P).join(' ')}" fill="rgba(255,176,74,.12)" stroke="${COL.moves}" stroke-width="2.5" pointer-events="none"/>`;
  }
  const a = m?.a ? pointXZ(f, m.a) : null;
  const b = m?.b ? pointXZ(f, m.b) : a && hover ? [hover.x, hover.z] : null;
  if (a && b) {
    o += line(a, b, COL.line, m.b ? '' : '6 4') + dotAt(a, COL.line) + dotAt(b, COL.line);
    if (len(sub(b, a)) * s > 24) o += label(a, b, fmtLen(len(sub(b, a))), COL.line);
  } else if (a) o += dotAt(a, COL.line);
  if (pw) {
    const pr = wallPair(pw.stay, pw.moves, m.pair.o);
    if (pr.parallel && !pr.inline) {                             // the distance between the faces at right angles, from the first point
      const d = dirOf(pw.stay), n = normal(d), side = Math.sign(dot(sub(mid(pw.moves), pw.stay.a), n)) || 1;
      const from = [pw.stay.a[0] + n[0] * side * thick(pw.stay) / 2, pw.stay.a[1] + n[1] * side * thick(pw.stay) / 2];
      const k = dot(sub(a, pw.stay.a), d), p0 = [from[0] + d[0] * k, from[1] + d[1] * k], p1 = [p0[0] + n[0] * side * pr.clear, p0[1] + n[1] * side * pr.clear];
      const shown = lineInfo(a, b), same2 = Math.abs(shown.len - pr.clear) < 0.01 && len(sub(p0, a)) < 0.01;
      if (!same2 && pr.clear > 0.01) o += line(p0, p1, COL.perp, '4 3') + label(p0, p1, `⟂ ${fmtLen(pr.clear)}`, COL.perp, -12);
    } else if (!pr.parallel) {                                  // walls that meet: the angle in the corner
      const C = pr.crossing, near = Math.max(distSeg(C, pw.stay.a, pw.stay.b), distSeg(C, pw.moves.a, pw.moves.b));
      if (near < 1.5) {
        const da = dirOf(pw.stay), db = dirOf(pw.moves), u = [da[0] * m.pair.o.sa, da[1] * m.pair.o.sa], v = [db[0] * m.pair.o.sb, db[1] * m.pair.o.sb];
        const r = 26, cx = sx(C[0]), cy = sy(C[1]), sweep = cross(u, v) > 0 ? 1 : 0, bis = unit([u[0] + v[0], u[1] + v[1]]);
        o += `<path class="msArc" d="M${(cx + u[0] * r).toFixed(1)} ${(cy + u[1] * r).toFixed(1)}A${r} ${r} 0 0 ${sweep} ${(cx + v[0] * r).toFixed(1)} ${(cy + v[1] * r).toFixed(1)}" stroke="${COL.perp}" stroke-width="2" fill="none" pointer-events="none"/>`;
        const lx = cx + (len(bis) > 0.5 ? bis[0] : -u[1]) * (r + 16), ly = cy + (len(bis) > 0.5 ? bis[1] : u[0]) * (r + 16);
        o += `<text class="msAngle" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="700" fill="${COL.perp}" stroke="${COL.dark}" stroke-width="3.5" paint-order="stroke" pointer-events="none">${pr.angle.toFixed(1)}°</text>`;
      }
    }
  }
  if (hover) {                                                  // where the next click lands: a square on a corner, a ring on a wall face, a cross free
    const hx = sx(hover.x), hy = sy(hover.z);
    o += hover.corner ? `<rect x="${(hx - 6).toFixed(1)}" y="${(hy - 6).toFixed(1)}" width="12" height="12" fill="none" stroke="${COL.line}" stroke-width="2" pointer-events="none"/>`
      : hover.wall ? `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="6" fill="none" stroke="${COL.line}" stroke-width="2" pointer-events="none"/>`
        : `<path d="M${hx - 6} ${hy}H${hx + 6}M${hx} ${hy - 6}V${hy + 6}" stroke="${COL.line}" stroke-width="1.5" pointer-events="none"/>`;
  }
  return o;
}
