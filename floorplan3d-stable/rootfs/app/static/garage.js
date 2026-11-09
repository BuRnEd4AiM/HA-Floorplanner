/* Garage, carport and workshop: cars (small car, saloon, estate, SUV, sports car, pick-up), a van, campers (camper van, motorhome, motorhome
 * with alcove), a caravan, a trailer, a motorbike, a scooter, bikes (also an e-bike and a cargo bike), a ride-on mower and a robot mower; the
 * workbench, tool trolley and tool chest, shelves, the car lift and the machines of a workshop; carports, bins, a bike rack, cabinets and
 * garden tools. Own simple models in their real sizes, made of parts like the furniture in Scandinavian style (scandi.js lists these pieces
 * too, so models.js, plan2d.js and the side panel treat them alike). The bodies of the vehicles are side profiles drawn across their width
 * ('ext' parts, prof in shapes.js). Pure geometry, no three.js; the building blocks are in shapes.js, the format of a part in scandi.js.
 *
 * What lights up follows the device's entity like the pieces of leisure.js: a vehicle's head and tail lights, the displays of the robot mower
 * and the welder, the workshop lamps (they are lamps: they light the room). Unit tests: tests/garage.test.mjs */
import { B, C, S, rod, bar, legs, hline, vline, at, turnAll, tilted, wheelX, discZ, prof, arc, hoop } from './shapes.js';

const PI = Math.PI;

/** the finishes these pieces add (side panel: "Ausführung"): car paint, tool colours, galvanised steel, larch wood */
export const GARAGE_FINISHES = {
  carwhite: { c: '#eceff1', metal: 0.2, rough: 0.25 }, carblack: { c: '#1b1d20', metal: 0.35, rough: 0.22 }, silver: { c: '#b9bec3', metal: 0.7, rough: 0.28 },
  cargrey: { c: '#5c6268', metal: 0.5, rough: 0.28 }, carred: { c: '#b0171e', metal: 0.3, rough: 0.25 }, carblue: { c: '#1f4e98', metal: 0.4, rough: 0.25 },
  cargreen: { c: '#2f5c45', metal: 0.4, rough: 0.28 }, orange: { c: '#e2701d', rough: 0.45 }, signal: { c: '#efc11a', rough: 0.45 },
  galvanized: { c: '#a8afb4', metal: 0.6, rough: 0.45 }, larch: { c: '#c48f5a' },
};
/** the fixed materials these pieces add (glow: lights up with the entity; on: the colour it lights in when the entity tells none) */
export const GARAGE_MATS = {
  tyre: { c: '#1d1e20', rough: 0.85 }, rim: { c: '#c6cbd0', metal: 0.75, rough: 0.3 }, carglass: { c: '#1d2832', metal: 0.5, rough: 0.08 },
  headlight: { c: '#dde5ea', glow: true, on: '#fff4d6' }, taillight: { c: '#7a161a', glow: true, on: '#ff2b22' }, trim: { c: '#26272a', rough: 0.75 },
  plate: { c: '#f1f1ea', rough: 0.4 }, solar: { c: '#1b2a4d', metal: 0.4, rough: 0.25 }, roofsheet: { c: '#7b8289', metal: 0.4, rough: 0.5 },
  workwood: { c: '#d2a46c', rough: 0.75 }, pegboard: { c: '#c49b6c', rough: 0.9 }, hole: { c: '#3b2f25' }, safety: { c: '#f0c21b', rough: 0.5 },
  grip1: { c: '#c8302a', rough: 0.6 }, grip2: { c: '#e4b31a', rough: 0.6 }, grip3: { c: '#2e6dc6', rough: 0.6 }, stone: { c: '#8f8a80', rough: 1 },
  boxblue: { c: '#2d5fae', rough: 0.6 }, boxred: { c: '#c8432b', rough: 0.6 }, boxgrey: { c: '#55595e', rough: 0.6 }, cardboard: { c: '#b98a59', rough: 0.95 },
  bingrey: { c: '#3c4146', rough: 0.7 }, binbrown: { c: '#6a4428', rough: 0.7 }, binblue: { c: '#2556a6', rough: 0.6 }, binyellow: { c: '#e6bf22', rough: 0.6 },
  gas: { c: '#6d7a80', metal: 0.4, rough: 0.4 }, decor: { c: '#56626c', rough: 0.5 }, awning: { c: '#dfe2e3', rough: 0.5 },
};

const range = (n) => Array.from({ length: n }, (_, i) => i);
/** z of the line p -> q ([z, y]) at height y */
const zAt = (p, q, y) => p[0] + ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]);
/** the same thin profile on both sides of a body, its outside at ±x (side windows, stripes) */
const sides = (pts, x, m = 'carglass', t = 0.008) => [-1, 1].map((s) => prof(pts, t, s * (x + t / 2 - 0.002), m));
/** a window on one side (s: -1 left, 1 right; seen from the front, the left side of the vehicle is +x) */
const side = (s, pts, x, m = 'carglass', t = 0.008) => prof(pts, t, s * (x + t / 2 - 0.002), m);
/** an upright rectangle as a profile: from z0 to z1, y0 to y1 */
const rect = (z0, z1, y0, y1) => [[z0, y0], [z0, y1], [z1, y1], [z1, y0]];
/** the points of a wheel arch cut into a body's bottom edge (y0), round the wheel at (z, r) with the arch radius ra: from its back to its front */
function arch(z, r, ra, y0, n = 10) {
  const a = Math.asin(Math.max(-1, Math.min(1, (r - y0) / ra)));
  return arc(z, r, ra, PI + a, -a, n);
}
/** a car wheel on side s at z: the tyre (its outside at s * xo), the rim with five spokes and the hub */
function wheel(s, xo, z, r, t = 0.21) {
  const p = [wheelX(r, t, s * (xo - t / 2), r, z, 'tyre', 28), wheelX(r * 0.64, 0.006, s * (xo + 0.002), r, z, 'rim', 24),
    wheelX(r * 0.5, 0.004, s * (xo + 0.006), r, z, 'trim', 20), wheelX(r * 0.13, 0.02, s * (xo + 0.008), r, z, 'rim', 12)];
  range(5).forEach((i) => { const a = (i * 2 * PI) / 5 + 0.3; p.push(rod([s * (xo + 0.008), r, z], [s * (xo + 0.008), r + r * 0.56 * Math.sin(a), z + r * 0.56 * Math.cos(a)], r * 0.07, 'rim', 6)); });
  return p;
}
/** a fender over a wheel (motorbike, trailer): a curved band round (z, cy) from angle a0 to a1, w wide */
const fender = (z, cy, r, t, a0, a1, w, x = 0, m = 'f') => prof([...arc(z, cy, r + t, a0, a1, 8), ...arc(z, cy, r, a1, a0, 8)], w, x, m);

/* ---------- cars ---------- */
/** a car, front towards +z. o (all in metres, d... = distance behind the front bumper): L, W, r (wheel radius), fo (front overhang), wb
 *  (wheelbase), cl (ground clearance), hn (top of the nose), hb (belt line), hr (roof), ws / wt (bottom / top of the windscreen), rt / rb
 *  (top / bottom of the rear window), deck (the boot lid), bp (B-pillar; none: two doors, de: the rear edge of the door), qp (a pillar behind
 *  the rear door: a third window, estate and SUV), cw (width of the C-pillar), bed (a pick-up's load floor), rails (roof rails), tw (tyre width) */
function car(o) {
  const { L, W, r, fo, wb, cl = 0.14, hn, hb, hr, ws, wt, rt, rb, deck = hb, bp, qp, cw = 0.14, tw = 0.21, bed } = o;
  const Z = (d) => L / 2 - d, zf = Z(fo), zr = Z(fo + wb), ra = r + 0.05, Wc = W - 0.24, p = [];
  const back = bed ? [[Z(rb), hb], [Z(rb), bed], [Z(L - 0.03), bed], [Z(L), bed - 0.05]] : [[Z(rb), hb], [Z(L - 0.1), deck], [Z(L), deck - 0.1]];
  p.push(prof([[Z(0.07), cl], [Z(0), cl + 0.16], [Z(0), hn - 0.09], [Z(0.13), hn], [Z(ws), hb], ...back, [Z(L), cl + 0.2], [Z(L - 0.07), cl],
    ...arch(zr, r, ra, cl), ...arch(zf, r, ra, cl)], W, 0, 'f', 0.07));                                                 // the body with its wheel arches
  const wsP = [Z(ws), hb], wtP = [Z(wt), hr], rtP = [Z(rt), hr], rbP = [Z(rb), hb], F = (y) => zAt(wsP, wtP, y), R = (y) => zAt(rbP, rtP, y);
  p.push(prof([[F(hb - 0.05), hb - 0.05], [F(hr - 0.035), hr - 0.035], [Z(wt) - 0.12, hr], [Z(rt) + 0.12, hr], [R(hr - 0.035), hr - 0.035], [R(hb - 0.05), hb - 0.05]], Wc, 0, 'f', 0.06));
  p.push(bar([0, hb + 0.02, F(hb + 0.02)], [0, hr - 0.05, F(hr - 0.05)], Wc - 0.16, 0.012, 'carglass'),                 // windscreen
    bar([0, hb + 0.04, R(hb + 0.04)], [0, hr - 0.05, R(hr - 0.05)], Wc - 0.16, 0.012, 'carglass'));                      // rear window
  const g0 = hb + 0.03, g1 = hr - 0.07, A = (y) => F(y) - 0.09, Cp = (y) => R(y) + cw;
  if (!bp) p.push(...sides([[A(g0), g0], [A(g1), g1], [Cp(g1), g1], [Cp(g0), g0]], Wc / 2));                          // one window each side (two doors)
  else {
    const zb = Z(bp), zq = qp ? Z(qp) : null;
    p.push(...sides([[A(g0), g0], [A(g1), g1], [zb + 0.045, g1], [zb + 0.045, g0]], Wc / 2),
      ...sides(qp ? rect(zq + 0.05, zb - 0.045, g0, g1) : [[zb - 0.045, g0], [zb - 0.045, g1], [Cp(g1), g1], [Cp(g0), g0]], Wc / 2));
    if (qp) p.push(...sides([[zq - 0.05, g0], [zq - 0.05, g1], [Cp(g1), g1], [Cp(g0), g0]], Wc / 2));
  }
  const seams = bp ? [zf - ra - 0.06, Z(bp), zr + ra + 0.06] : [zf - ra - 0.06, Z(o.de)], tl = bed ? bed - 0.02 : deck - 0.27;
  [-1, 1].forEach((s) => {
    p.push(B(0.34, 0.09, 0.08, s * (W / 2 - 0.27), hn - 0.15, Z(0.035), 'headlight'),
      bed ? B(0.07, 0.22, 0.05, s * (W / 2 - 0.035), tl, Z(L) + 0.02, 'taillight') : B(0.3, 0.1, 0.06, s * (W / 2 - 0.22), tl, Z(L) + 0.02, 'taillight'),
      B(0.15, 0.09, 0.07, s * (Wc / 2 + 0.1), hb + 0.02, F(hb + 0.06) - 0.15, 'f'), B(0.07, 0.03, 0.05, s * (Wc / 2 + 0.03), hb + 0.045, F(hb + 0.06) - 0.15, 'trim'),
      ...wheel(s, W / 2 - 0.025, zf, r, tw), ...wheel(s, W / 2 - 0.025, zr, r, tw),
      ...seams.map((z) => vline(hb - 0.09 - cl - 0.12, s * W / 2, cl + 0.12, z)),
      ...seams.slice(1).map((z) => B(0.012, 0.025, 0.13, s * (W / 2 + 0.004), hb - 0.15, z + 0.13, 'trim')));
    if (o.rails) p.push(rod([s * (Wc / 2 - 0.1), hr + 0.035, Z(wt) - 0.2], [s * (Wc / 2 - 0.1), hr + 0.035, Z(rt) + 0.15], 0.012, 'trim'),
      B(0.03, 0.035, 0.05, s * (Wc / 2 - 0.1), hr, Z(wt) - 0.22, 'trim'), B(0.03, 0.035, 0.05, s * (Wc / 2 - 0.1), hr, Z(rt) + 0.17, 'trim'));
  });
  p.push(B(Math.max(0.3, W - 1.05), Math.max(0.05, hn - cl - 0.45), 0.04, 0, cl + 0.29, Z(0.012), 'trim'),             // grille
    B(0.52, 0.11, 0.012, 0, cl + 0.12, Z(0) + 0.004, 'plate'), B(0.52, 0.11, 0.012, 0, cl + 0.3, Z(L) - 0.004, 'plate'));
  if (bed) {                                                                                                              // the load bed of a pick-up
    const zm = (Z(rb) + Z(L)) / 2, len = L - rb;
    p.push(...[-1, 1].map((s) => B(0.07, hb + 0.04 - bed, len, s * (W / 2 - 0.035), bed, zm)), B(W - 0.14, hb + 0.04 - bed, 0.05, 0, bed, Z(L) + 0.025),
      B(W - 0.14, 0.01, len - 0.05, 0, bed, zm + 0.025, 'trim'), B(W - 0.3, 0.025, 0.012, 0, hb - 0.05, Z(L) - 0.002, 'trim'));
  }
  if (o.spoiler) p.push(B(W - 0.3, 0.025, 0.2, 0, deck + 0.06, Z(L - 0.12), 'trim'), ...[-1, 1].map((s) => B(0.04, 0.07, 0.1, s * (W / 2 - 0.4), deck - 0.02, Z(L - 0.12), 'trim')));
  return p;
}

/* ---------- vans and campers ---------- */
/** what every van and camper has: wheels, headlights, grille, plates, mirrors on long arms; Z(d) the z of a point d behind the front */
function vanBase(L, Wcab, r, fo, wb, cl, hn, ws, tw = 0.215) {
  const Z = (d) => L / 2 - d, zf = Z(fo), zr = Z(fo + wb), p = [];
  [-1, 1].forEach((s) => p.push(...wheel(s, Wcab / 2 - 0.04, zf, r, tw), ...wheel(s, Wcab / 2 - 0.04, zr, r, tw),
    B(0.3, 0.12, 0.08, s * (Wcab / 2 - 0.25), hn - 0.2, Z(0.035), 'headlight'),
    B(0.2, 0.04, 0.06, s * (Wcab / 2 + 0.08), hn + 0.3, Z(ws) - 0.08, 'trim'), B(0.05, 0.26, 0.12, s * (Wcab / 2 + 0.16), hn + 0.14, Z(ws) - 0.08, 'trim')));
  p.push(B(Wcab - 0.8, 0.2, 0.04, 0, hn - 0.36, Z(0.012), 'trim'), B(0.52, 0.11, 0.012, 0, cl + 0.13, Z(0) + 0.004, 'plate'));
  return p;
}
/** a van (people carrier): the body up to the roof in one profile, the windscreen on its slope, a band of windows, a sliding door on the left */
function van() {
  const L = 4.9, W = 1.9, r = 0.34, cl = 0.18, Z = (d) => L / 2 - d, zf = Z(0.95), zr = Z(3.95), ra = r + 0.05;
  const w0 = [Z(0.62), 1.08], w1 = [Z(1.3), 1.86], F = (y) => zAt(w0, w1, y);
  const p = [prof([[Z(0.06), cl], [Z(0), cl + 0.16], [Z(0), 0.84], [Z(0.14), 0.98], w0, w1, [Z(1.5), 1.97], [Z(L - 0.12), 1.97], [Z(L), 1.86], [Z(L), cl + 0.22],
    [Z(L - 0.07), cl], ...arch(zr, r, ra, cl), ...arch(zf, r, ra, cl)], W, 0, 'f', 0.09), bar([0, 1.1, F(1.1)], [0, 1.82, F(1.82)], W - 0.3, 0.012, 'carglass'),
  ...vanBase(L, W, r, 0.95, 3.0, cl, 0.86, 0.62)];
  const y0 = 1.12, y1 = 1.76;
  p.push(...sides([[F(y0) - 0.1, y0], [F(y1) - 0.1, y1], [Z(1.95), y1], [Z(1.95), y0]], W / 2), ...sides(rect(Z(2.85), Z(2.05), y0, y1), W / 2),
    ...sides(rect(Z(3.8), Z(2.95), y0, y1), W / 2), ...sides([[Z(4.72), y0], [Z(4.72), y1 - 0.04], [Z(3.9), y1], [Z(3.9), y0]], W / 2),
    B(1.5, 0.6, 0.012, 0, 1.15, Z(L) - 0.004, 'carglass'), B(0.52, 0.11, 0.012, 0, 0.5, Z(L) - 0.004, 'plate'),
    ...[Z(2.0), Z(3.0)].map((z) => vline(0.86, -W / 2, 0.24, z)), vline(0.86, W / 2, 0.24, Z(2.0)), B(0.012, 0.03, 0.14, -W / 2 - 0.004, 0.98, Z(3.0) + 0.13, 'trim'),
    rod([-W / 2 - 0.01, 1.08, Z(2.05)], [-W / 2 - 0.01, 1.08, Z(3.85)], 0.008, 'trim'),
    ...[-1, 1].map((s) => B(0.1, 0.32, 0.05, s * (W / 2 - 0.14), 0.72, Z(L) + 0.015, 'taillight')));
  return p;
}
/** a camper van on a big van with a high roof: the windscreen, cab windows, camper windows with white frames, the sliding door on the left,
 *  the awning, a solar panel and a roof light on top, the rear doors */
function camperVan() {
  const L = 5.99, W = 2.05, r = 0.36, cl = 0.2, Z = (d) => L / 2 - d, zf = Z(0.95), zr = Z(4.98), ra = r + 0.05, x = W / 2;
  const w0 = [Z(0.78), 1.16], w1 = [Z(1.55), 2.0], F = (y) => zAt(w0, w1, y);
  const p = [prof([[Z(0.06), cl], [Z(0), cl + 0.18], [Z(0), 0.8], [Z(0.14), 0.98], w0, w1, [Z(1.75), 2.45], [Z(2.0), 2.62], [Z(2.25), 2.65], [Z(L - 0.12), 2.65],
    [Z(L), 2.52], [Z(L), cl + 0.25], [Z(L - 0.07), cl], ...arch(zr, r, ra, cl), ...arch(zf, r, ra, cl)], W, 0, 'f', 0.1),
  bar([0, 1.18, F(1.18)], [0, 1.96, F(1.96)], W - 0.32, 0.012, 'carglass'), ...vanBase(L, W, r, 0.95, 4.03, cl, 0.82, 0.78)];
  const framed = (s, z0, z1, y0, y1) => [side(s, rect(z0, z1, y0, y1), x, 'white', 0.01), side(s, rect(z0 + 0.04, z1 - 0.04, y0 + 0.04, y1 - 0.04), x + 0.006)];
  p.push(...sides([[F(1.2) - 0.1, 1.2], [F(1.85) - 0.1, 1.85], [Z(2.05), 1.85], [Z(2.05), 1.2]], x),
    ...framed(-1, Z(3.0), Z(2.3), 1.3, 1.85), ...framed(1, Z(4.6), Z(3.5), 1.35, 1.9), ...framed(-1, Z(5.7), Z(5.15), 1.4, 1.85),
    ...[Z(2.15), Z(3.35)].map((z) => vline(1.95, -W / 2, 0.3, z)), vline(1.95, W / 2, 0.3, Z(2.15)), rod([-W / 2 - 0.01, 1.1, Z(2.2)], [-W / 2 - 0.01, 1.1, Z(3.3)], 0.008, 'trim'),
    B(0.11, 0.13, 3.6, -W / 2 - 0.04, 2.36, Z(3.7), 'awning'), B(1.0, 0.04, 1.65, -0.3, 2.65, Z(3.4), 'white'), B(0.96, 0.045, 1.6, -0.3, 2.65, Z(3.4), 'solar'),
    B(0.45, 0.1, 0.45, 0.4, 2.65, Z(4.9), 'acryl'), B(0.3, 0.08, 0.3, 0.45, 2.65, Z(2.6), 'acryl'),
    vline(2.2, 0, 0.3, Z(L) - 0.002), ...[-1, 1].map((s) => B(0.62, 0.45, 0.012, s * 0.42, 1.55, Z(L) - 0.004, 'carglass')),
    ...[-1, 1].map((s) => B(0.1, 0.32, 0.05, s * (W / 2 - 0.14), 0.62, Z(L) + 0.015, 'taillight')), B(0.52, 0.11, 0.012, 0, 0.45, Z(L) - 0.004, 'plate'));
  return p;
}
/** a motorhome on the cab of a van: the cab (2.05 m wide) and the wider living part behind it, low over the cab (semi-integrated) or with the
 *  alcove over it; windows with white frames, the entry door on the left, the awning, roof lights, a stripe along the side */
function motorhome(alcove) {
  const L = alcove ? 7.2 : 7.0, W = 2.32, Wc = 2.05, r = 0.36, cl = 0.2, H2 = alcove ? 3.15 : 2.9, Z = (d) => L / 2 - d, zf = Z(0.95), zr = Z(4.75), ra = r + 0.05;
  const w0 = [Z(0.78), 1.16], w1 = [Z(1.5), 1.98], F = (y) => zAt(w0, w1, y), floor = 0.4, x = W / 2;
  const cab = [[Z(0.06), cl], [Z(0), cl + 0.18], [Z(0), 0.8], [Z(0.14), 0.98], w0, w1, [Z(2.25), 1.98], [Z(2.25), cl], ...arch(zf, r, ra, cl)];
  const front = alcove ? [[Z(1.42), 2.0], [Z(0.42), 2.0], [Z(0.28), 2.22], [Z(0.31), 2.86], [Z(0.55), 3.1], [Z(0.9), H2]]
    : [[Z(1.42), 1.94], [Z(1.5), 2.2], [Z(1.7), 2.55], [Z(2.0), 2.8], [Z(2.4), H2]];
  const p = [prof(cab, Wc, 0, 'f', 0.09), prof([...front, [Z(L - 0.12), H2], [Z(L), H2 - 0.12], [Z(L), 0.62], [Z(L - 0.4), floor], ...arch(zr, r, ra, floor),
    [Z(2.25), floor], [Z(2.25), 1.92], [Z(1.5), 1.92]], W, 0, 'white', 0.08),
  bar([0, 1.18, F(1.18)], [0, 1.94, F(1.94)], Wc - 0.32, 0.012, 'carglass'), ...vanBase(L, Wc, r, 0.95, 3.8, cl, 0.82, 0.78)];
  const framed = (s, z0, z1, y0, y1) => [side(s, rect(z0, z1, y0, y1), x, 'trim', 0.01), side(s, rect(z0 + 0.035, z1 - 0.035, y0 + 0.035, y1 - 0.035), x + 0.006)];
  p.push(...sides([[F(1.2) - 0.1, 1.2], [F(1.85) - 0.1, 1.85], [Z(2.15), 1.85], [Z(2.15), 1.2]], Wc / 2),
    ...framed(1, Z(3.4), Z(2.5), 1.35, 1.95), ...framed(-1, Z(3.3), Z(2.5), 1.35, 1.95), ...framed(1, Z(6.0), Z(5.0), 1.4, 1.95), ...framed(-1, Z(6.3), Z(5.6), 1.45, 1.9),
    side(-1, rect(Z(4.45), Z(3.8), 0.5, 2.15), x, 'white', 0.012), side(-1, rect(Z(4.35), Z(3.9), 1.45, 1.95), x + 0.01),
    B(0.012, 0.03, 0.12, -(x + 0.004), 1.15, Z(4.3), 'trim'), B(0.5, 0.14, 0.3, -(x - 0.35), 0.22, Z(4.12), 'trim'),           // door handle, step
    ...sides([[Z(2.3), 0.85], [Z(2.3), 0.95], [Z(L - 0.1), 0.95], [Z(L - 0.1), 0.85]], x, 'decor'),
    B(0.12, 0.14, 4.2, -(x + 0.02), H2 - 0.3, Z(4.4), 'awning'), B(0.7, 0.09, 0.55, 0.3, H2, Z(3.1), 'acryl'), B(0.45, 0.09, 0.45, -0.4, H2, Z(5.7), 'acryl'),
    ...[-1, 1].map((s) => B(0.12, 0.45, 0.05, s * (W / 2 - 0.15), 0.85, Z(L) + 0.015, 'taillight')), B(0.52, 0.11, 0.012, 0, 0.7, Z(L) - 0.004, 'plate'),
    B(1.3, 0.25, 0.012, 0, H2 - 0.55, Z(L) - 0.004, 'decor'));
  if (alcove) p.push(B(1.0, 0.36, 0.02, 0, 2.38, Z(0.305), 'carglass'), ...sides(rect(Z(1.2), Z(0.6), 2.3, 2.75), x));
  return p;
}
/** a caravan: the box with its rounded roof, the big front window, side windows, the door on the left, one axle, the drawbar with its cover,
 *  the coupling and the jockey wheel, steadies at the corners */
function caravan() {
  const L = 6.6, W = 2.3, r = 0.3, fl = 0.42, Z = (d) => L / 2 - d, za = Z(4.35), x = W / 2;
  const f0 = [Z(1.28), 1.0], f1 = [Z(1.36), 2.35], F = (y) => zAt(f0, f1, y);
  const p = [prof([[Z(1.42), fl], [Z(1.32), 0.62], f0, f1, [Z(1.55), 2.58], [Z(1.8), 2.6], [Z(L - 0.15), 2.6], [Z(L), 2.45], [Z(L), 0.55], [Z(L - 0.12), fl],
    ...arch(za, r, r + 0.06, fl)], W, 0, 'f', 0.1), bar([0, 1.45, F(1.45)], [0, 2.12, F(2.12)], 1.5, 0.014, 'carglass')];
  const framed = (s, z0, z1, y0, y1) => [side(s, rect(z0, z1, y0, y1), x, 'trim', 0.01), side(s, rect(z0 + 0.035, z1 - 0.035, y0 + 0.035, y1 - 0.035), x + 0.006)];
  [-1, 1].forEach((s) => p.push(...wheel(s, x - 0.12, za, r, 0.19), ...framed(s, Z(2.6), Z(1.7), 1.25, 1.85), ...framed(s, Z(6.3), Z(5.3), 1.3, 1.85),
    rod([s * (x - 0.2), fl, Z(1.5)], [s * (x - 0.2), 0, Z(1.5)], 0.02, 'iron'), rod([s * (x - 0.2), fl, Z(L - 0.2)], [s * (x - 0.2), 0, Z(L - 0.2)], 0.02, 'iron'),
    B(0.12, 0.38, 0.05, s * (x - 0.15), 0.75, Z(L) + 0.015, 'taillight'), bar([s * 0.55, fl - 0.04, Z(1.45)], [0, fl - 0.04, Z(0.2)], 0.07, 0.1, 'iron')));
  p.push(...framed(1, Z(4.0), Z(3.0), 1.3, 1.85), side(-1, rect(Z(3.9), Z(3.3), 0.55, 2.1), x, 'white', 0.012), side(-1, rect(Z(3.82), Z(3.38), 1.45, 1.95), x + 0.01),
    B(0.012, 0.03, 0.12, -(x + 0.004), 1.2, Z(3.8), 'trim'), B(0.55, 0.16, 0.3, -(x - 0.28), 0.22, Z(3.6), 'trim'),
    B(0.95, 0.35, 0.5, 0, fl + 0.04, Z(0.95), 'white'), B(0.12, 0.13, 0.32, 0, fl - 0.08, Z(0.14), 'iron'), rod([0, fl + 0.1, Z(0.05)], [0, fl + 0.18, Z(0.25)], 0.012, 'iron'),
    rod([0.15, fl, Z(0.55)], [0.15, 0.12, Z(0.55)], 0.025, 'iron'), wheelX(0.1, 0.06, 0.15, 0.1, Z(0.55), 'tyre', 16),
    B(0.52, 0.11, 0.012, 0, 0.65, Z(L) - 0.004, 'plate'), B(0.8, 0.5, 0.012, 0, 1.55, Z(L) - 0.004, 'carglass'), B(0.55, 0.09, 0.4, 0, 2.6, Z(3.5), 'acryl'));
  return p;
}
/** a car trailer: the load box with its sides on a frame, one axle with fenders outside the box, the drawbar, lights at the back */
function trailer() {
  const zb = -0.55, Lb = 2.5, Wb = 1.3, fl = 0.55, p = [];
  p.push(B(Wb, 0.04, Lb, 0, fl, zb, 'wood'), B(Wb, 0.4, 0.03, 0, fl, zb - Lb / 2 + 0.015), B(Wb, 0.4, 0.03, 0, fl, zb + Lb / 2 - 0.015),
    ...[-1, 1].map((s) => B(0.03, 0.4, Lb - 0.06, s * (Wb / 2 - 0.015), fl, zb)), ...[-1, 1].map((s) => B(0.06, 0.08, Lb, s * 0.45, fl - 0.08, zb, 'iron')),
    rod([-0.78, 0.28, zb], [0.78, 0.28, zb], 0.03, 'iron'), B(1.3, 0.06, 0.06, 0, fl - 0.14, zb - Lb / 2 + 0.05, 'iron'));
  [-1, 1].forEach((s) => p.push(wheelX(0.28, 0.165, s * 0.69, 0.28, zb, 'tyre', 24), wheelX(0.18, 0.17, s * 0.69, 0.28, zb, 'rim', 20),
    fender(zb, 0.28, 0.33, 0.025, 0.1, PI - 0.1, 0.22, s * 0.69), bar([s * 0.45, fl - 0.06, zb + Lb / 2], [0, fl - 0.06, zb + Lb / 2 + 1.0], 0.07, 0.08, 'iron'),
    B(0.16, 0.08, 0.05, s * 0.55, fl - 0.12, zb - Lb / 2 - 0.01, 'taillight')));
  p.push(B(0.12, 0.12, 0.3, 0, fl - 0.18, zb + Lb / 2 + 1.0, 'iron'), rod([0.12, fl - 0.05, zb + Lb / 2 + 0.6], [0.12, 0.1, zb + Lb / 2 + 0.6], 0.022, 'iron'),
    wheelX(0.09, 0.05, 0.12, 0.09, zb + Lb / 2 + 0.6, 'tyre', 14), B(0.52, 0.11, 0.012, 0, fl - 0.26, zb - Lb / 2 - 0.03, 'plate'));
  return p;
}

/* ---------- two wheels, mowers ---------- */
function motorbike() {
  const r = 0.31, zf = 0.72, zr = -0.72, p = [];
  p.push(wheelX(r, 0.17, 0, r, zr, 'tyre', 28), wheelX(0.22, 0.175, 0, r, zr, 'rim', 20), wheelX(r, 0.12, 0, r, zf, 'tyre', 28), wheelX(0.22, 0.125, 0, r, zf, 'rim', 20),
    wheelX(0.15, 0.006, 0.075, r, zf, 'chrome', 20), wheelX(0.15, 0.006, -0.075, r, zf, 'chrome', 20),
    fender(zf, r, r + 0.03, 0.02, 0.15 * PI, 0.9 * PI, 0.13), fender(zr, r, r + 0.03, 0.02, 0.45 * PI, 0.95 * PI, 0.16, 0, 'trim'),
    prof([[0.42, 0.88], [0.3, 1.0], [0.0, 1.03], [-0.18, 0.96], [-0.2, 0.84], [0.3, 0.78]], 0.32, 0, 'f', 0.05),                     // tank
    prof([[-0.16, 0.86], [-0.2, 0.93], [-0.55, 0.92], [-0.75, 0.97], [-0.82, 0.93], [-0.72, 0.84]], 0.28, 0, 'trim', 0.025),        // seat
    prof([[-0.18, 0.86], [-0.72, 0.86], [-0.98, 0.93], [-0.95, 0.8], [-0.55, 0.62], [-0.2, 0.62]], 0.24, 0, 'f', 0.05),           // tail
    B(0.11, 0.045, 0.04, 0, 0.86, -0.96, 'taillight'), bar([0, 0.78, -0.85], [0, 0.56, -1.0], 0.12, 0.02, 'trim'), B(0.2, 0.13, 0.01, 0, 0.47, -1.03, 'plate'),
    B(0.3, 0.3, 0.42, 0, 0.22, 0.06, 'iron'), B(0.25, 0.25, 0.2, 0, 0.46, 0.2, 'iron', { rx: 0.35 }), wheelX(0.1, 0.33, 0, 0.34, 0.0, 'chrome', 18),
    ...range(4).map((i) => B(0.29, 0.008, 0.22, 0, 0.5 + i * 0.045, 0.19 + i * 0.016, 'chrome', { rx: 0.35 })),
    bar([0, 0.94, 0.46], [0, 0.84, -0.2], 0.06, 0.05, 'iron'), bar([0, 0.92, 0.46], [0, 0.42, 0.32], 0.05, 0.05, 'iron'),
    rod([0.12, 0.25, 0.28], [0.17, 0.3, -0.3], 0.025, 'chrome'), rod([0.17, 0.33, -0.3], [0.18, 0.5, -0.86], 0.05, 'chrome'),
    rod([0, 0.95, 0.47], [0, 1.0, 0.45], 0.035, 'iron'), rod([-0.36, 1.08, 0.4], [0.36, 1.08, 0.4], 0.012, 'iron'),
    discZ(0.09, 0.1, 0, 0.92, 0.57, 'f'), discZ(0.075, 0.01, 0, 0.92, 0.625, 'headlight'));
  [-1, 1].forEach((s) => p.push(rod([s * 0.08, r, zf], [s * 0.08, 0.98, zf - 0.25], 0.022, 'chrome'), rod([s * 0.06, 1.0, 0.45], [s * 0.18, 1.08, 0.41], 0.012, 'iron'),
    rod([s * 0.3, 1.08, 0.4], [s * 0.38, 1.08, 0.4], 0.018, 'rubber'), rod([s * 0.28, 1.08, 0.4], [s * 0.32, 1.26, 0.42], 0.006, 'iron'), B(0.1, 0.06, 0.02, s * 0.33, 1.23, 0.43, 'black'),
    bar([s * 0.1, 0.38, -0.12], [s * 0.1, r, zr], 0.03, 0.06, 'iron'), rod([s * 0.1, 0.42, -0.6], [s * 0.1, 0.84, -0.42], 0.02, 'red'),
    rod([s * 0.06, 0.3, -0.12], [s * 0.2, 0.3, -0.12], 0.012, 'iron')));
  return p;
}
function scooter() {
  const r = 0.2, zf = 0.62, zr = -0.6, p = [];
  p.push(wheelX(r, 0.11, 0, r, zr, 'tyre', 24), wheelX(0.13, 0.115, 0, r, zr, 'rim', 18), wheelX(r, 0.1, 0, r, zf, 'tyre', 24), wheelX(0.13, 0.105, 0, r, zf, 'rim', 18),
    prof([[-0.18, 0.28], [-0.22, 0.72], [-0.5, 0.8], [-0.82, 0.72], [-0.88, 0.48], [-0.72, 0.3]], 0.42, 0, 'f', 0.09),                // the rear cowl over the engine
    prof([[-0.2, 0.76], [-0.24, 0.84], [-0.7, 0.86], [-0.78, 0.8], [-0.7, 0.74]], 0.3, 0, 'trim', 0.025),                            // seat
    B(0.32, 0.06, 0.55, 0, 0.2, 0.05, 'trim'), prof([[0.32, 0.22], [0.42, 0.6], [0.5, 1.0], [0.42, 1.02], [0.33, 0.62], [0.24, 0.26]], 0.44, 0, 'f', 0.025),   // floor, leg shield
    fender(zf, r, r + 0.03, 0.04, 0.1 * PI, 0.95 * PI, 0.16), rod([0, 0.25, zf], [0, 0.98, 0.48], 0.03, 'iron'),
    B(0.56, 0.09, 0.13, 0, 0.98, 0.47, 'f'), discZ(0.06, 0.03, 0, 1.03, 0.545, 'headlight'), B(0.1, 0.05, 0.04, 0, 0.72, -0.87, 'taillight'),
    B(0.17, 0.12, 0.01, 0, 0.42, -0.9, 'plate'), B(0.14, 0.14, 0.32, 0.1, 0.18, -0.35, 'iron'));
  [-1, 1].forEach((s) => p.push(rod([s * 0.27, 1.02, 0.47], [s * 0.35, 1.02, 0.47], 0.017, 'rubber'), rod([s * 0.22, 1.05, 0.46], [s * 0.26, 1.2, 0.48], 0.006, 'iron'),
    B(0.09, 0.055, 0.02, s * 0.27, 1.18, 0.49, 'black')));
  return p;
}
/** a bicycle (28 inch): wheels you see through, the frame, handlebar, saddle, cranks, mudguards, a rack, lights; the e-bike has a low frame,
 *  the battery on the down tube, the motor at the cranks and a display */
function bicycle(e) {
  const r = 0.35, zf = 0.54, zr = -0.53, cy = 0.3, cs = [0, 0.86, -0.2], head = [0, 0.74, 0.4], top = [0, 0.88, 0.37], p = [];
  [zf, zr].forEach((z) => {
    p.push(...hoop(0, r, z, r - 0.018, 0.018, 'tyre'), ...hoop(0, r, z, r - 0.045, 0.008, 'rim'), wheelX(0.03, 0.1, 0, r, z, 'steel', 12));
    range(12).forEach((i) => { const a = (i * PI) / 6; p.push(rod([i % 2 ? 0.03 : -0.03, r, z], [0, r + (r - 0.05) * Math.sin(a), z + (r - 0.05) * Math.cos(a)], 0.0015, 'steel', 4)); });
    p.push(fender(z, r, r + 0.02, 0.012, z > 0 ? 0.05 * PI : 0.35 * PI, z > 0 ? 0.75 * PI : 1.05 * PI, 0.06));
  });
  const bb = [0, cy, -0.02];
  if (e) p.push(rod(head, [0, 0.42, 0.12], 0.024, 'f'), rod([0, 0.42, 0.12], bb, 0.024, 'f'), bar([0, 0.72, 0.33], [0, 0.48, 0.16], 0.07, 0.07, 'black'),
    wheelX(0.08, 0.14, 0, cy, -0.02, 'black', 16), B(0.06, 0.035, 0.012, 0, 1.02, 0.33, 'display'));
  else p.push(rod(head, bb, 0.02, 'f'), rod(cs, top, 0.018, 'f'));
  p.push(rod(bb, cs, 0.019, 'f'), rod(head, top, 0.022, 'f'), rod(top, [0, 1.0, 0.33], 0.014, 'iron'), rod([-0.3, 1.0, 0.3], [0.3, 1.0, 0.3], 0.011, 'iron'),
    rod(cs, [0, 0.98, -0.24], 0.013, 'chrome'), prof([[-0.16, 0.98], [-0.14, 1.02], [0.0, 1.03], [0.08, 1.0], [0.0, 0.97]], 0.16, 0, 'trim', 0.012),
    wheelX(0.1, 0.006, 0.06, cy, -0.02, 'steel', 20), rod([0.075, cy, -0.02], [0.075, cy - 0.15, 0.04], 0.01, 'iron'), rod([-0.075, cy, -0.02], [-0.075, cy + 0.15, -0.08], 0.01, 'iron'),
    B(0.09, 0.02, 0.05, 0.11, cy - 0.16, 0.04, 'black'), B(0.09, 0.02, 0.05, -0.11, cy + 0.14, -0.08, 'black'),
    B(0.14, 0.012, 0.36, 0, 0.78, -0.42, 'iron'), B(0.06, 0.04, 0.03, 0, 0.75, -0.62, 'taillight'), discZ(0.03, 0.05, 0, 0.82, 0.47, 'headlight'));
  [-1, 1].forEach((s) => p.push(rod([s * 0.03, 0.72, 0.4], [s * 0.05, r, zf], 0.013, 'f'), rod(bb, [s * 0.06, r, zr], 0.012, 'f'), rod(cs, [s * 0.06, r, zr], 0.011, 'f'),
    rod([s * 0.06, 0.78, -0.3], [s * 0.06, r, zr - 0.05], 0.006, 'iron'), rod([s * 0.24, 1.0, 0.3], [s * 0.32, 1.0, 0.3], 0.016, 'rubber')));
  return p;
}
/** a cargo bike (long john) with an electric motor: the small front wheel, the wooden box, the long frame, the steering rod */
function cargoBike() {
  const r = 0.35, rf = 0.25, zr = -0.95, zf = 1.15, cy = 0.3, cs = [0, 0.86, -0.62], p = [];
  [[zf, rf], [zr, r]].forEach(([z, rr]) => {
    p.push(...hoop(0, rr, z, rr - 0.018, 0.018, 'tyre'), ...hoop(0, rr, z, rr - 0.045, 0.008, 'rim'), wheelX(0.03, 0.1, 0, rr, z, 'steel', 12));
    range(12).forEach((i) => { const a = (i * PI) / 6; p.push(rod([i % 2 ? 0.03 : -0.03, rr, z], [0, rr + (rr - 0.05) * Math.sin(a), z + (rr - 0.05) * Math.cos(a)], 0.0015, 'steel', 4)); });
  });
  p.push(B(0.6, 0.38, 0.8, 0, 0.32, 0.55, 'birch'), B(0.54, 0.02, 0.74, 0, 0.66, 0.55, 'wood'), B(0.62, 0.04, 0.82, 0, 0.3, 0.55, 'iron'),
    rod([0, 0.3, -0.42], [0, 0.3, 0.95], 0.028, 'f'), rod([0, 0.3, 0.95], [0, rf, zf], 0.022, 'f'), rod([0, 0.3, -0.42], [0, 0.78, -0.12], 0.026, 'f'),
    rod([0, 0.78, -0.12], [0, 1.02, -0.1], 0.016, 'iron'), rod([-0.3, 1.02, -0.12], [0.3, 1.02, -0.12], 0.011, 'iron'), rod([0, 0.6, -0.1], [0, 0.34, 0.98], 0.008, 'iron'),
    rod([0, 0.3, -0.42], cs, 0.02, 'f'), rod(cs, [0, 0.98, -0.66], 0.013, 'chrome'), prof([[-0.58, 0.98], [-0.56, 1.02], [-0.42, 1.03], [-0.34, 1.0], [-0.42, 0.97]], 0.16, 0, 'trim', 0.012),
    wheelX(0.08, 0.14, 0, cy, -0.42, 'black', 16), bar([0, 0.72, -0.62], [0, 0.48, -0.5], 0.07, 0.08, 'black'), B(0.06, 0.035, 0.012, 0, 1.04, -0.13, 'display'),
    discZ(0.03, 0.05, 0, 0.75, 0.97, 'headlight'), B(0.06, 0.04, 0.03, 0, 0.72, -1.2, 'taillight'), fender(zr, r, r + 0.02, 0.012, 0.35 * PI, 1.05 * PI, 0.06));
  [-1, 1].forEach((s) => p.push(rod([0, 0.3, -0.42], [s * 0.06, r, zr], 0.012, 'f'), rod(cs, [s * 0.06, r, zr], 0.011, 'f'), rod([s * 0.24, 1.02, -0.12], [s * 0.32, 1.02, -0.12], 0.016, 'rubber'),
    rod([s * 0.07, cy, -0.42], [s * 0.07, cy + s * 0.15, -0.42 - s * 0.06], 0.01, 'iron')));
  return p;
}
/** a ride-on mower: bonnet, rear body with seat and steering wheel, big rear wheels, the mowing deck under it, the grass box behind */
function rideOnMower() {
  const p = [prof([[0.9, 0.3], [0.92, 0.6], [0.8, 0.72], [0.15, 0.76], [0.1, 0.45], [0.2, 0.3]], 0.55, 0, 'f', 0.06),
    prof([[0.12, 0.42], [0.08, 0.62], [-0.55, 0.68], [-0.88, 0.62], [-0.88, 0.42]], 0.94, 0, 'f', 0.05), prof([[0.0, 0.68], [-0.02, 0.76], [-0.42, 0.78], [-0.45, 0.68]], 0.42, 0, 'trim', 0.025),
    B(0.42, 0.3, 0.06, 0, 0.74, -0.48, 'trim', { rx: -0.2 }), rod([0, 0.7, 0.2], [0, 0.98, 0.08], 0.02, 'iron'), { ...C(0.16, 0.03, 0, 0.97, 0.06, 'trim', 0.16, 20), rx: -0.45 },
    B(1.05, 0.12, 0.6, 0, 0.08, 0.06, 'f2'), B(0.75, 0.45, 0.45, 0, 0.42, -1.1, 'trim'), B(0.77, 0.04, 0.47, 0, 0.87, -1.1, 'f'),
    ...[-1, 1].map((s) => B(0.12, 0.06, 0.03, s * 0.15, 0.55, 0.92, 'headlight'))];
  [-1, 1].forEach((s) => p.push(wheelX(0.29, 0.22, s * 0.36, 0.29, -0.45, 'tyre', 24), wheelX(0.16, 0.225, s * 0.36, 0.29, -0.45, 'rim', 18),
    wheelX(0.19, 0.14, s * 0.32, 0.19, 0.62, 'tyre', 20), wheelX(0.1, 0.145, s * 0.32, 0.19, 0.62, 'rim', 16)));
  return p;
}
/** a robot mower with its charging station in front of it; its display glows while it mows */
function robotMower() {
  const p = [prof([[0.31, 0.06], [0.29, 0.16], [0.16, 0.25], [-0.15, 0.26], [-0.29, 0.2], [-0.31, 0.06]], 0.46, 0, 'f', 0.05),
    B(0.4, 0.06, 0.58, 0, 0.0, 0.0, 'trim'), C(0.045, 0.02, 0.0, 0.255, -0.05, 'red', 0.045, 16), B(0.14, 0.01, 0.05, 0, 0.255, 0.07, 'display'),
    C(0.035, 0.05, 0, 0, 0.22, 'tyre', 0.035, 12), B(0.48, 0.02, 0.5, 0, 0, 0.62, 'trim'), B(0.3, 0.32, 0.12, 0, 0.02, 0.84, 'f2'), B(0.08, 0.02, 0.01, 0, 0.28, 0.78, 'display')];
  [-1, 1].forEach((s) => p.push(wheelX(0.11, 0.05, s * 0.25, 0.11, -0.12, 'tyre', 20), wheelX(0.06, 0.055, s * 0.25, 0.11, -0.12, 'trim', 12), B(0.06, 0.01, 0.06, s * 0.12, 0.02, 0.55, 'chrome')));
  return p;
}

/* ---------- workshop ---------- */
/** tools on a pegboard whose face is at z, from x0 along 1.1 m, their hooks at y0 (a hammer, screwdrivers, spanners, pliers, a saw, a tape) */
function boardTools(x0, y0, z) {
  const p = [B(0.025, 0.3, 0.018, x0, y0 - 0.32, z + 0.03, 'workwood'), B(0.11, 0.035, 0.03, x0, y0 - 0.03, z + 0.03, 'iron')];
  [['grip1', 0.14], ['grip2', 0.2], ['grip3', 0.26], ['grip1', 0.32]].forEach(([g, dx]) => p.push(C(0.014, 0.1, x0 + dx, y0 - 0.1, z + 0.03, g, 0.014, 10), rod([x0 + dx, y0 - 0.1, z + 0.03], [x0 + dx, y0 - 0.25, z + 0.03], 0.004, 'steel')));
  range(4).forEach((i) => p.push(B(0.022, 0.13 + i * 0.03, 0.006, x0 + 0.44 + i * 0.05, y0 - 0.15 - i * 0.03, z + 0.02, 'chrome'), B(0.04, 0.03, 0.006, x0 + 0.44 + i * 0.05, y0 - 0.03, z + 0.02, 'chrome')));
  p.push(rod([x0 + 0.7, y0 - 0.25, z + 0.02], [x0 + 0.68, y0 - 0.02, z + 0.02], 0.009, 'grip1'), rod([x0 + 0.74, y0 - 0.25, z + 0.02], [x0 + 0.76, y0 - 0.02, z + 0.02], 0.009, 'grip1'),
    B(0.36, 0.11, 0.002, x0 + 0.94, y0 - 0.32, z + 0.012, 'steel'), B(0.11, 0.12, 0.025, x0 + 1.15, y0 - 0.32, z + 0.02, 'red'), discZ(0.035, 0.03, x0 + 0.85, y0 - 0.06, z + 0.02, 'safety'));
  return p;
}
/** a pegboard w x h from y0, its face at z: the board and its rows of holes */
function pegboard(w, h, y0, z) {
  const p = [B(w, h, 0.016, 0, y0, z - 0.008, 'pegboard')], n = Math.floor(w / 0.1), m = Math.floor(h / 0.1);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) p.push(B(0.008, 0.008, 0.002, -w / 2 + (i + 0.5) * (w / n), y0 + (j + 0.5) * (h / m), z, 'hole'));
  return p;
}
/** the workbench: beech top, frame in the finish, a drawer cabinet on the left, a shelf below, the vice on the right, a few tools on top;
 *  with the pegboard: tools on the wall behind it, a shelf on top and an LED light under it */
function workbench(peg) {
  const W = 2.0, D = 0.75, p = [B(W, 0.04, D, 0, 0.86, 0, 'workwood'), ...legs(W, D, 0.86, 0.05, 0.02), B(W - 0.1, 0.05, 0.04, 0, 0.15, D / 2 - 0.05), B(W - 0.1, 0.05, 0.04, 0, 0.15, -D / 2 + 0.05),
    B(W - 0.1, 0.02, D - 0.1, 0, 0.2, 0, 'workwood'), B(0.58, 0.62, D - 0.1, -W / 2 + 0.36, 0.22, 0, 'f2')];
  range(4).forEach((i) => p.push(B(0.56, 0.145, 0.015, -W / 2 + 0.36, 0.23 + i * 0.155, D / 2 - 0.045, 'f'), B(0.3, 0.015, 0.02, -W / 2 + 0.36, 0.33 + i * 0.155, D / 2 - 0.03, 'steel')));
  p.push(B(0.16, 0.07, 0.22, W / 2 - 0.32, 0.9, D / 2 - 0.1, 'iron'), B(0.18, 0.09, 0.03, W / 2 - 0.32, 0.97, D / 2 - 0.03, 'steel'), B(0.18, 0.09, 0.03, W / 2 - 0.32, 0.97, D / 2 - 0.08, 'steel'),
    rod([W / 2 - 0.32, 1.0, D / 2], [W / 2 - 0.32, 1.0, D / 2 + 0.12], 0.012, 'chrome'), rod([W / 2 - 0.42, 1.0, D / 2 + 0.12], [W / 2 - 0.22, 1.0, D / 2 + 0.12], 0.008, 'chrome'),
    B(0.45, 0.17, 0.22, -0.35, 0.9, -0.18, 'red'), B(0.2, 0.025, 0.04, -0.35, 1.07, -0.18, 'black'), B(0.6, 0.02, 0.12, 0.25, 0.9, 0.12, 'birch'),
    rod([0.05, 0.915, 0.25], [0.32, 0.915, 0.28], 0.012, 'workwood'), B(0.03, 0.03, 0.1, 0.33, 0.9, 0.28, 'iron'));
  if (peg) {
    p.push(...pegboard(W - 0.1, 0.9, 0.95, -D / 2 + 0.03), ...[-1, 1].map((s) => B(0.05, 1.1, 0.04, s * (W / 2 - 0.03), 0.9, -D / 2 + 0.02)),
      B(W, 0.025, 0.28, 0, 1.97, -D / 2 + 0.14), B(W - 0.2, 0.02, 0.04, 0, 1.945, -D / 2 + 0.24, 'glow'), ...boardTools(-0.75, 1.65, -D / 2 + 0.03),
      ...[[-0.8, 'boxblue'], [-0.35, 'boxred'], [0.1, 'boxblue'], [0.55, 'cardboard']].map(([x, m]) => B(0.36, 0.18, 0.24, x, 1.995, -D / 2 + 0.14, m)));
  }
  return p;
}
/** a rolling tool trolley: drawers, the top tray with a rubber mat, a handle at the side, castors */
function toolTrolley() {
  const W = 0.72, D = 0.46, p = [B(W - 0.04, 0.72, D - 0.02, 0, 0.11, 0), B(W, 0.03, D, 0, 0.83, 0), B(W - 0.06, 0.005, D - 0.06, 0, 0.86, 0, 'rubber'),
    B(W, 0.05, 0.02, 0, 0.86, D / 2 - 0.01), B(W, 0.05, 0.02, 0, 0.86, -D / 2 + 0.01), B(0.02, 0.05, D, W / 2 - 0.01, 0.86), B(0.02, 0.05, D, -W / 2 + 0.01, 0.86),
    B(W - 0.02, 0.03, D, 0, 0.09, 0, 'f2'), rod([W / 2 + 0.03, 0.75, -0.15], [W / 2 + 0.03, 0.75, 0.15], 0.012, 'chrome'),
    ...[-0.15, 0.15].map((z) => rod([W / 2 - 0.02, 0.75, z], [W / 2 + 0.03, 0.75, z], 0.01, 'chrome'))];
  let y = 0.13;
  [0.08, 0.08, 0.08, 0.1, 0.12, 0.2].forEach((h) => { p.push(hline(W - 0.08, 0, y + h, D / 2 - 0.009), B(W - 0.18, 0.014, 0.02, 0, y + h - 0.035, D / 2), B(0.06, 0.02, 0.003, W / 2 - 0.12, y + h - 0.035, D / 2 - 0.009, 'white')); y += h + 0.01; });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(wheelX(0.045, 0.03, i * (W / 2 - 0.06), 0.045, k * (D / 2 - 0.06), 'rubber', 14), B(0.05, 0.03, 0.05, i * (W / 2 - 0.06), 0.08, k * (D / 2 - 0.06), 'steel')));
  return p;
}
/** a big tool chest: the roller cabinet with eight drawers and the chest on top with its lid and five drawers */
function toolChest() {
  const W = 1.05, D = 0.5, p = [B(W, 0.86, D, 0, 0.13), B(W + 0.02, 0.03, D + 0.02, 0, 0.99, 0, 'rubber'), B(W - 0.04, 0.46, D - 0.08, 0, 1.02, -0.02), B(W - 0.02, 0.05, D - 0.06, 0, 1.48, -0.02, 'f2')];
  let y = 0.15;
  [0.07, 0.07, 0.07, 0.07, 0.09, 0.09, 0.14, 0.18].forEach((h) => { p.push(hline(W - 0.04, 0, y + h, D / 2 + 0.001), B(W - 0.2, 0.014, 0.02, 0, y + h - 0.035, D / 2 + 0.01, 'chrome')); y += h + 0.01; });
  y = 1.04;
  [0.06, 0.06, 0.07, 0.08, 0.1].forEach((h) => { p.push(hline(W - 0.08, 0, y + h, D / 2 - 0.039), B(W - 0.24, 0.012, 0.02, 0, y + h - 0.03, D / 2 - 0.03, 'chrome')); y += h + 0.01; });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(wheelX(0.06, 0.04, i * (W / 2 - 0.08), 0.06, k * (D / 2 - 0.08), 'rubber', 14), B(0.06, 0.04, 0.06, i * (W / 2 - 0.08), 0.1, k * (D / 2 - 0.08), 'steel')));
  p.push(rod([-W / 2 - 0.05, 0.8, -0.18], [-W / 2 - 0.05, 0.8, 0.18], 0.014, 'chrome'), ...[-0.18, 0.18].map((z) => rod([-W / 2, 0.8, z], [-W / 2 - 0.05, 0.8, z], 0.012, 'chrome')));
  return p;
}
/** a heavy-duty shelf with five shelves: posts and beams in the finish, chipboard shelves, crates, boxes and paint pots */
function heavyShelf() {
  const W = 1.8, D = 0.6, p = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.04, 1.8, 0.04, i * (W / 2 - 0.02), 0, k * (D / 2 - 0.02))));
  [0.08, 0.5, 0.92, 1.34, 1.74].forEach((y) => p.push(B(W - 0.04, 0.018, D - 0.02, 0, y + 0.03, 0, 'workwood'), B(W - 0.08, 0.05, 0.02, 0, y, D / 2 - 0.02), B(W - 0.08, 0.05, 0.02, 0, y, -D / 2 + 0.02)));
  p.push(...[-0.6, 0, 0.6].map((x, i) => B(0.4, 0.3, 0.56, x, 0.128, 0, i === 1 ? 'boxblue' : 'boxgrey')),
    ...[-0.7, -0.45, -0.2].map((x, i) => C(0.1, 0.22, x, 0.548, 0.1, i === 1 ? 'boxblue' : 'white', 0.1, 16)), B(0.5, 0.3, 0.4, 0.45, 0.548, 0, 'cardboard'),
    ...[-0.6, 0, 0.6].map((x) => B(0.4, 0.22, 0.56, x, 0.968, 0, 'boxred')), B(0.7, 0.32, 0.45, -0.4, 1.388, 0, 'cardboard'), B(0.45, 0.25, 0.4, 0.45, 1.388, 0, 'cardboard'),
    ...storedWheel(0.42, 1.788, 0, true), ...storedWheel(0.42, 2.0, 0, true));
  return p;
}
/** a wall rail with stacking bins in three rows */
function binWall() {
  const p = [B(1.0, 0.9, 0.02, 0, 0, -0.09, 'steel')], mats = ['boxblue', 'boxred', 'safety'];
  range(3).forEach((j) => range(4).forEach((i) => {
    const x = -0.36 + i * 0.24, y = 0.06 + j * 0.28, m = mats[j];
    p.push(B(0.2, 0.15, 0.17, x, y, -0.0, m), B(0.2, 0.08, 0.02, x, y, 0.09, m), B(0.08, 0.025, 0.004, x, y + 0.04, 0.101, 'white'));
  }));
  return p;
}
/** a two-post car lift: the columns with their base plates, the carriages and four swing arms with rubber pads, the power unit, the floor cover */
function carLift() {
  const xc = 1.55, p = [B(2.8, 0.025, 0.36, 0, 0, 0, 'iron')];
  [-1, 1].forEach((s) => {
    p.push(B(0.6, 0.02, 0.6, s * xc, 0, 0, 'iron'), B(0.32, 2.73, 0.36, s * xc, 0.02, 0), B(0.2, 2.6, 0.04, s * (xc - 0.14), 0.08, 0, 'iron'),
      B(0.22, 0.42, 0.4, s * (xc - 0.24), 0.32, 0, 'f2'), B(0.04, 2.6, 0.01, s * xc, 0.08, 0.181, 'safety'));
    [[0.95, 0.62], [-0.8, 0.5]].forEach(([dz, len]) => {
      const x1 = s * (xc - 0.3 - len * 0.55);
      p.push(bar([s * (xc - 0.3), 0.36, Math.sign(dz) * 0.15], [x1, 0.36, dz], 0.1, 0.06, 'f2'), C(0.06, 0.06, x1, 0.39, dz, 'rubber', 0.06, 14));
    });
  });
  p.push(B(0.2, 0.35, 0.22, xc + 0.28, 0.9, 0, 'f2'), C(0.07, 0.3, xc + 0.28, 1.25, 0, 'iron', 0.07, 14), B(0.12, 0.16, 0.02, xc + 0.28, 1.0, 0.115, 'black'), B(0.04, 0.04, 0.02, xc + 0.28, 1.08, 0.125, 'display'));
  return p;
}
function floorJack() {
  const p = [B(0.3, 0.06, 0.7, 0, 0.06, 0), ...[-1, 1].map((s) => B(0.012, 0.14, 0.72, s * 0.15, 0.06, 0)), bar([0, 0.16, -0.15], [0, 0.24, 0.33], 0.12, 0.05),
    C(0.06, 0.03, 0, 0.26, 0.34, 'iron', 0.06, 16), C(0.03, 0.14, 0, 0.12, -0.2, 'chrome', 0.03, 12), rod([0, 0.16, -0.32], [0, 0.92, -0.62], 0.016, 'chrome'),
    rod([0, 0.86, -0.6], [0, 0.98, -0.65], 0.024, 'rubber')];
  [-1, 1].forEach((s) => p.push(wheelX(0.05, 0.04, s * 0.17, 0.05, 0.28, 'iron', 14), wheelX(0.04, 0.04, s * 0.12, 0.04, -0.32, 'rubber', 12)));
  return p;
}
function compressor() {
  const p = [wheelX(0.17, 0.62, 0, 0.27, 0, 'f', 24), S(0.17, -0.31, 0.1, 0, 'f', 0.3, 1, 1), S(0.17, 0.31, 0.1, 0, 'f', 0.3, 1, 1),
    wheelX(0.08, 0.26, 0.02, 0.5, -0.02, 'iron', 16), C(0.055, 0.12, -0.2, 0.42, 0.02, 'f2', 0.055, 14), ...range(4).map((i) => C(0.07, 0.008, -0.2, 0.46 + i * 0.025, 0.02, 'f2', 0.07, 14)),
    B(0.14, 0.1, 0.08, 0.2, 0.44, 0.08, 'black'), discZ(0.03, 0.02, 0.15, 0.52, 0.13, 'cream'), discZ(0.03, 0.02, 0.24, 0.52, 0.13, 'cream'),
    rod([-0.38, 0.45, -0.1], [-0.38, 0.6, -0.1], 0.012, 'iron'), rod([-0.38, 0.6, -0.1], [-0.38, 0.6, 0.1], 0.012, 'iron'), rod([-0.38, 0.45, 0.1], [-0.38, 0.6, 0.1], 0.012, 'iron'),
    B(0.06, 0.04, 0.2, 0.25, 0, 0, 'rubber')];
  [-1, 1].forEach((s) => p.push(wheelX(0.08, 0.04, -0.22, 0.08, s * 0.16, 'tyre', 16)));
  return p;
}
function drillPress() {
  return [B(0.42, 0.06, 0.6, 0, 0, 0), C(0.04, 1.5, 0, 0.06, -0.18, 'chrome', 0.04, 14), C(0.16, 0.025, 0, 0.78, 0.04, 'f', 0.16, 24), B(0.1, 0.06, 0.2, 0, 0.74, -0.1),
    B(0.28, 0.32, 0.5, 0, 1.25, -0.03), B(0.3, 0.12, 0.56, 0, 1.57, -0.04, 'f2'), C(0.09, 0.26, 0, 1.3, -0.36, 'f2', 0.09, 18), C(0.035, 0.14, 0, 1.12, 0.13, 'chrome', 0.035, 12),
    C(0.012, 0.06, 0, 1.06, 0.13, 'chrome', 0.026, 12), C(0.03, 0.06, 0.16, 1.4, 0.06, 'iron', 0.03, 12), ...range(3).map((i) => { const a = (i * 2 * PI) / 3; return rod([0.16, 1.43, 0.06], [0.3, 1.43 + 0.16 * Math.sin(a), 0.06 + 0.16 * Math.cos(a)], 0.008, 'chrome'); }),
    B(0.06, 0.06, 0.02, -0.08, 1.38, 0.225, 'red')];
}
function tableSaw() {
  const p = [B(0.55, 0.3, 0.5, 0, 0.55, 0), B(0.8, 0.03, 0.65, 0, 0.85, 0, 'steel'), wheelX(0.125, 0.003, 0, 0.82, 0.02, 'steel', 32), B(0.012, 0.1, 0.05, 0, 0.86, -0.13, 'steel'),
    B(0.06, 0.07, 0.3, 0, 0.98, 0.02, 'smoke'), B(0.04, 0.07, 0.65, 0.27, 0.88, 0, 'f'), B(0.1, 0.07, 0.06, 0.27, 0.86, 0.33, 'f'), B(0.08, 0.06, 0.03, -0.15, 0.68, 0.26, 'red'),
    C(0.05, 0.04, 0, 0.62, 0.26, 'black', 0.05, 14)];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(rod([i * 0.24, 0.56, k * 0.2], [i * 0.36, 0.014, k * 0.32], 0.016, 'iron')));
  return p;
}
function benchGrinder() {
  const p = [C(0.2, 0.03, 0, 0, 0, 'iron', 0.22, 20), C(0.03, 0.8, 0, 0.03, 0, 'f', 0.03, 12), B(0.36, 0.015, 0.2, 0, 0.83, 0, 'iron'), B(0.2, 0.04, 0.14, 0, 0.845, 0, 'f'),
    wheelX(0.08, 0.2, 0, 0.94, 0, 'f', 18), B(0.05, 0.03, 0.02, 0, 0.96, 0.085, 'red')];
  [-1, 1].forEach((s) => p.push(wheelX(0.1, 0.025, s * 0.16, 0.94, 0, 'stone', 22), fender(0, 0.94, 0.11, 0.02, -0.3, PI + 0.3, 0.045, s * 0.16, 'f2'),
    tilted(0.07, 0.06, 0.004, s * 0.16, 1.07, 0.1, -0.6, 'smoke')));
  return p;
}
function welder() {
  const p = [B(0.5, 0.03, 0.85, 0, 0.12, 0, 'iron'), B(0.3, 0.45, 0.58, 0, 0.15, 0.12), B(0.26, 0.3, 0.01, 0, 0.25, 0.415, 'black'), B(0.08, 0.04, 0.005, -0.05, 0.47, 0.421, 'display'),
    discZ(0.025, 0.02, 0.06, 0.48, 0.425, 'black'), discZ(0.025, 0.02, 0.06, 0.38, 0.425, 'black'), C(0.11, 1.1, 0, 0.15, -0.28, 'gas', 0.11, 20), S(0.11, 0, 1.18, -0.28, 'gas', 1, 0.5, 1),
    C(0.025, 0.08, 0, 1.28, -0.28, 'chrome', 0.025, 10), discZ(0.03, 0.03, 0.05, 1.3, -0.26, 'cream'), rod([0, 0.15, -0.42], [0, 1.2, -0.42], 0.012, 'iron'),
    rod([0, 1.2, -0.42], [0, 1.2, 0.0], 0.012, 'iron'), rod([0.08, 0.3, 0.42], [0.2, 0.55, 0.3], 0.012, 'black'), rod([0.2, 0.55, 0.3], [0.18, 0.62, 0.0], 0.012, 'black'), B(0.03, 0.18, 0.04, 0.18, 0.62, -0.02, 'black')];
  [-1, 1].forEach((s) => p.push(wheelX(0.12, 0.04, s * 0.27, 0.12, -0.3, 'tyre', 18), C(0.04, 0.08, s * 0.18, 0, 0.35, 'rubber', 0.04, 10)));
  return p;
}
function shopVac() {
  return [C(0.2, 0.42, 0, 0.08, 0, 'f', 0.18, 24), C(0.21, 0.14, 0, 0.5, 0, 'black', 0.21, 24), rod([-0.1, 0.64, 0], [-0.1, 0.72, 0], 0.012, 'black'), rod([0.1, 0.64, 0], [0.1, 0.72, 0], 0.012, 'black'),
    rod([-0.1, 0.72, 0], [0.1, 0.72, 0], 0.016, 'black'), C(0.035, 0.05, 0, 0.36, 0.19, 'black', 0.035, 12), rod([0, 0.38, 0.22], [0.12, 0.2, 0.32], 0.025, 'black'),
    rod([0.12, 0.2, 0.32], [0.25, 0.1, 0.12], 0.025, 'black'), rod([0.25, 0.1, 0.12], [0.22, 0.3, -0.12], 0.025, 'black'), C(0.19, 0.06, 0, 0.02, 0, 'black', 0.2, 20),
    ...[0, 1, 2, 3].map((i) => { const a = (i * PI) / 2 + PI / 4; return C(0.03, 0.03, 0.17 * Math.sin(a), 0, 0.17 * Math.cos(a), 'rubber', 0.03, 10); }), B(0.06, 0.03, 0.03, 0, 0.58, 0.2, 'red')];
}
/** a wheel lying flat or standing (a stored tyre on its rim) */
const storedWheel = (x, y, z, flat) => (flat ? [C(0.32, 0.21, x, y, z, 'tyre', 0.32, 28), C(0.21, 0.004, x, y + 0.21, z, 'rim', 0.21, 22), C(0.05, 0.01, x, y + 0.212, z, 'rim', 0.05, 12)]
  : [wheelX(0.32, 0.21, x, y + 0.32, z, 'tyre', 28), wheelX(0.21, 0.215, x, y + 0.32, z, 'rim', 22)]);
/** a tyre rack with two levels of four wheels standing on their treads */
function tyreRack() {
  const p = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.04, 1.62, 0.04, i * 0.53, 0, k * 0.3)));
  [0.08, 0.84].forEach((y) => { p.push(...[-0.14, 0.14].map((z) => B(1.1, 0.03, 0.03, 0, y, z)), ...[-1, 1].map((i) => B(0.04, 0.03, 0.64, i * 0.53, y, 0))); range(4).forEach((i) => p.push(...storedWheel(-0.36 + i * 0.24, y + 0.0, 0, false))); });
  p.push(...[-1, 1].map((i) => B(0.04, 0.03, 0.64, i * 0.53, 1.59, 0)));
  return p;
}
function ladder() {
  const p = [];
  [-1, 1].forEach((s) => p.push(bar([s * 0.25, 0.015, 0.36], [s * 0.19, 1.58, 0.02], 0.06, 0.025), bar([s * 0.19, 1.58, -0.16], [s * 0.25, 0.015, -0.56], 0.05, 0.025),
    B(0.07, 0.03, 0.05, s * 0.25, 0, 0.36, 'rubber'), B(0.06, 0.03, 0.05, s * 0.25, 0, -0.56, 'rubber'), rod([s * 0.23, 0.7, 0.2], [s * 0.23, 0.7, -0.38], 0.008, 'iron')));
  range(5).forEach((i) => { const t = (i + 1) / 6; p.push(B(0.36 + (1 - t) * 0.1, 0.025, 0.1, 0, t * 1.58 - 0.02, 0.36 - t * 0.34)); });
  p.push(B(0.42, 0.04, 0.3, 0, 1.56, -0.07, 'f2'), B(0.38, 0.06, 0.24, 0, 1.6, -0.08, 'boxgrey'));
  return p;
}
function extinguisher() {
  return [B(0.07, 0.22, 0.02, 0, 0.12, -0.09, 'steel'), C(0.08, 0.46, 0, 0, 0, 'red', 0.08, 20), S(0.08, 0, 0.42, 0, 'red', 1, 0.5, 1), C(0.022, 0.05, 0, 0.5, 0, 'chrome', 0.022, 10),
    B(0.03, 0.015, 0.12, 0, 0.55, 0.03, 'black'), discZ(0.018, 0.01, 0.03, 0.51, 0.025, 'cream'), rod([-0.02, 0.52, 0.02], [-0.09, 0.4, 0.03], 0.008, 'black'),
    rod([-0.09, 0.4, 0.03], [-0.09, 0.08, 0.04], 0.008, 'black'), B(0.08, 0.12, 0.002, 0, 0.18, 0.08, 'white')];
}
/** a 240 l wheelie bin in colour m: body, rim, lid, the handle and the wheels at the back; x its middle */
const bin = (x, m) => [B(0.56, 0.9, 0.66, x, 0.07, 0.02, m), B(0.58, 0.06, 0.7, x, 0.97, 0.02, m), B(0.6, 0.04, 0.74, x, 1.03, 0.0, m), rod([x - 0.22, 1.0, -0.36], [x + 0.22, 1.0, -0.36], 0.015, m),
  rod([x - 0.25, 0.1, -0.29], [x + 0.25, 0.1, -0.29], 0.012, 'iron'), wheelX(0.1, 0.05, x - 0.25, 0.1, -0.29, 'tyre', 16), wheelX(0.1, 0.05, x + 0.25, 0.1, -0.29, 'tyre', 16)];
/** a carport for one car or two (n), its posts, beams and rafters in the finish, a flat roof with its fascia, a gutter and a downpipe at the
 *  back, head braces; solar: panels on the roof */
function carport(n, solar) {
  const W = n === 1 ? 3.0 : 5.8, D = 5.0, h = 2.2, xs = W / 2 - 0.06, p = [];
  [-1, 1].forEach((s) => {
    [-D / 2 + 0.3, 0, D / 2 - 0.3].forEach((z) => p.push(B(0.12, h, 0.12, s * xs, 0, z), B(0.16, 0.12, 0.16, s * xs, 0, z, 'steel'),
      bar([s * xs, h - 0.45, z + (z > 0 ? -0.06 : 0.06)], [s * xs, h, z + (z > 0 ? -0.5 : 0.5)], 0.08, 0.08)));
    p.push(B(0.1, 0.2, D, s * xs, h, 0));
  });
  range(Math.round(D / 0.7) + 1).forEach((i) => p.push(B(W + 0.1, 0.12, 0.06, 0, h + 0.2, -D / 2 + 0.03 + i * ((D - 0.06) / Math.round(D / 0.7)))));
  p.push(B(W + 0.3, 0.02, D + 0.3, 0, h + 0.32, 0, 'roofsheet'), B(W + 0.3, 0.18, 0.03, 0, h + 0.2, D / 2 + 0.135), B(W + 0.3, 0.18, 0.03, 0, h + 0.2, -D / 2 - 0.135),
    B(0.03, 0.18, D + 0.3, W / 2 + 0.135, h + 0.2, 0), B(0.03, 0.18, D + 0.3, -W / 2 - 0.135, h + 0.2, 0),
    rod([-W / 2 - 0.15, h + 0.24, -D / 2 - 0.2], [W / 2 + 0.15, h + 0.24, -D / 2 - 0.2], 0.05, 'steel'), rod([W / 2 + 0.1, h + 0.24, -D / 2 - 0.2], [W / 2 + 0.1, 0, -D / 2 - 0.2], 0.04, 'steel'));
  if (solar) range(5).forEach((i) => range(3).forEach((j) => {
    const x = -2.3 + i * 1.15, z = -1.72 + j * 1.72;
    p.push(B(1.13, 0.035, 1.7, x, h + 0.34, z, 'steel'), B(1.09, 0.04, 1.66, x, h + 0.34, z, 'solar'));
  }));
  return p;
}
/** a box for two bins: frame, slatted doors and sides, the lid */
function binBox() {
  const W = 1.45, D = 0.85, Hh = 1.3, p = [B(W, 0.04, D, 0, Hh - 0.04, 0, 'f2')];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.05, Hh - 0.04, 0.05, i * (W / 2 - 0.025), 0, k * (D / 2 - 0.025))));
  p.push(B(0.04, Hh - 0.04, 0.05, 0, 0, D / 2 - 0.025), B(W, Hh - 0.04, 0.02, 0, 0, -D / 2 + 0.01, 'f2'));
  range(7).forEach((j) => {
    const y = 0.06 + j * 0.17;
    p.push(...[-1, 1].map((s) => B(W / 2 - 0.06, 0.12, 0.02, s * (W / 4), y, D / 2 - 0.005)), ...[-1, 1].map((s) => B(0.02, 0.12, D - 0.1, s * (W / 2 - 0.005), y, 0)));
  });
  p.push(...[-1, 1].map((s) => B(0.02, 0.15, 0.03, s * 0.08, 0.6, D / 2 + 0.02, 'steel')));
  return p;
}
function bikeRack() {
  const p = [B(2.0, 0.03, 0.04, 0, 0, 0.18), B(2.0, 0.03, 0.04, 0, 0, -0.18)];
  range(5).forEach((i) => {
    const x = -0.8 + i * 0.4;
    p.push(rod([x - 0.035, 0.03, 0.2], [x - 0.035, 0.36, 0.05], 0.008), rod([x + 0.035, 0.03, 0.2], [x + 0.035, 0.36, 0.05], 0.008),
      rod([x - 0.035, 0.03, -0.18], [x - 0.035, 0.36, 0.05], 0.008), rod([x + 0.035, 0.03, -0.18], [x + 0.035, 0.36, 0.05], 0.008), rod([x - 0.035, 0.36, 0.05], [x + 0.035, 0.36, 0.05], 0.008));
  });
  return p;
}
/** a bike hung flat along the wall on two hooks under a rail */
function bikeWall() {
  return [B(1.2, 0.08, 0.03, 0, 1.08, -0.3, 'steel'), ...[-0.3, 0.3].flatMap((x) => [rod([x, 1.12, -0.3], [x, 1.12, -0.05], 0.01, 'rubber'), rod([x, 1.12, -0.05], [x, 1.04, -0.02], 0.01, 'rubber')]),
    ...at(turnAll(bicycle(false), PI / 2), 0, 0.02, 0)];
}
/** a ceiling rack: four rods to the ceiling, a frame with a mesh floor, crates and a box on it */
function ceilingRack() {
  const W = 2.4, D = 1.2, p = [B(W, 0.03, D, 0, 0, 0, 'mesh'), B(W, 0.05, 0.04, 0, 0, D / 2 - 0.02), B(W, 0.05, 0.04, 0, 0, -D / 2 + 0.02), B(0.04, 0.05, D, W / 2 - 0.02), B(0.04, 0.05, D, -W / 2 + 0.02)];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.04, 0.58, 0.04, i * (W / 2 - 0.02), 0, k * (D / 2 - 0.02)), B(0.12, 0.01, 0.12, i * (W / 2 - 0.02), 0.58, k * (D / 2 - 0.02))));
  p.push(...[-0.8, -0.35, 0.1].map((x, i) => B(0.4, 0.3, 0.6, x, 0.03, 0.2, i === 1 ? 'boxblue' : 'boxgrey')), B(0.7, 0.25, 0.45, 0.65, 0.03, -0.2, 'cardboard'), B(1.6, 0.18, 0.55, -0.3, 0.03, -0.3, 'trim'));
  return p;
}
function cabinet() {
  const p = [B(0.92, 1.9, 0.5, 0, 0.05), B(0.86, 0.05, 0.46, 0, 0, 0, 'black'), vline(1.84, 0, 0.08, 0.251), B(0.03, 0.18, 0.03, 0.05, 0.95, 0.26, 'chrome')];
  [-1, 1].forEach((s) => range(4).forEach((i) => p.push(hline(0.22, s * 0.22, 1.65 + i * 0.04, 0.251), hline(0.22, s * 0.22, 0.2 + i * 0.04, 0.251))));
  return p;
}
function wheelbarrow() {
  return [prof([[0.33, 0.78], [-0.42, 0.78], [-0.28, 0.45], [0.12, 0.4]], 0.62, 0, 'f', 0.04), B(0.54, 0.008, 0.62, 0, 0.775, -0.04, 'f2'), wheelX(0.19, 0.08, 0, 0.19, 0.45, 'tyre', 20),
    wheelX(0.1, 0.085, 0, 0.19, 0.45, 'rim', 14), ...[-1, 1].flatMap((s) => [bar([s * 0.05, 0.19, 0.45], [s * 0.28, 0.6, -0.98], 0.03, 0.035, 'iron'), rod([s * 0.28, 0.6, -0.92], [s * 0.3, 0.62, -1.08], 0.02, 'rubber'),
      rod([s * 0.22, 0.48, -0.45], [s * 0.24, 0.012, -0.55], 0.014, 'iron')])];
}
function lawnMower() {
  return [prof([[0.3, 0.06], [0.32, 0.18], [0.2, 0.27], [-0.25, 0.27], [-0.28, 0.06]], 0.52, 0, 'f', 0.05), C(0.1, 0.12, 0, 0.27, 0.0, 'iron', 0.1, 16), C(0.11, 0.03, 0, 0.39, 0.0, 'f2', 0.1, 16),
    B(0.4, 0.28, 0.35, 0, 0.12, -0.45, 'trim'), B(0.42, 0.03, 0.37, 0, 0.4, -0.45, 'f2'),
    ...[-1, 1].flatMap((s) => [wheelX(0.1, 0.04, s * 0.28, 0.1, 0.2, 'tyre', 16), wheelX(0.12, 0.045, s * 0.28, 0.12, -0.22, 'tyre', 16), rod([s * 0.2, 0.25, -0.25], [s * 0.22, 0.98, -0.8], 0.012, 'iron')]),
    rod([-0.22, 0.98, -0.8], [0.22, 0.98, -0.8], 0.014, 'rubber')];
}
/** a rail with holders on the wall and the garden tools standing in them: a rake, a spade, a broom, a hoe */
function gardenTools() {
  const p = [B(1.2, 0.06, 0.03, 0, 1.42, -0.06, 'steel')];
  [[-0.42, 'rake'], [-0.14, 'spade'], [0.14, 'broom'], [0.42, 'hoe']].forEach(([x, k]) => {
    p.push(rod([x, 0.05, 0.0], [x, 1.55, -0.03], 0.014, 'workwood'), rod([x - 0.04, 1.45, -0.05], [x - 0.04, 1.45, 0.02], 0.006, 'steel'), rod([x + 0.04, 1.45, -0.05], [x + 0.04, 1.45, 0.02], 0.006, 'steel'));
    if (k === 'rake') p.push(B(0.36, 0.025, 0.025, x, 0.05, 0.0, 'grip2'), ...range(10).map((i) => B(0.008, 0.05, 0.008, x - 0.16 + i * 0.036, 0, 0.0, 'grip2')));
    if (k === 'spade') p.push(B(0.18, 0.26, 0.008, x, 0, 0.0, 'steel'));
    if (k === 'broom') p.push(B(0.36, 0.05, 0.06, x, 0.07, 0.0, 'workwood'), B(0.34, 0.07, 0.05, x, 0, 0.0, 'black'));
    if (k === 'hoe') p.push(B(0.14, 0.1, 0.008, x, 0.0, 0.03, 'steel', { rx: 0.4 }));
  });
  return p;
}
function pressureWasher() {
  return [B(0.3, 0.52, 0.3, 0, 0.12, 0), B(0.32, 0.04, 0.32, 0, 0.62, 0, 'black'), rod([-0.12, 0.62, -0.13], [-0.12, 0.95, -0.15], 0.012, 'black'), rod([0.12, 0.62, -0.13], [0.12, 0.95, -0.15], 0.012, 'black'),
    rod([-0.12, 0.95, -0.15], [0.12, 0.95, -0.15], 0.016, 'black'), discZ(0.13, 0.06, 0, 0.42, 0.18, 'black', 20), discZ(0.08, 0.065, 0, 0.42, 0.18, 'f2', 16),
    rod([0.17, 0.25, 0.05], [0.17, 0.85, 0.05], 0.01, 'black'), B(0.04, 0.12, 0.05, 0.17, 0.82, 0.05, 'f'), discZ(0.025, 0.01, 0.08, 0.55, 0.153, 'black'),
    ...[-1, 1].map((s) => wheelX(0.1, 0.05, s * 0.18, 0.1, -0.08, 'tyre', 16)), B(0.2, 0.05, 0.06, 0, 0, 0.12, 'rubber')];
}

/** the pieces: cat (library group), label (German, the translations are in i18n.js / lang/*.js), fin (the finishes, the first is the default),
 *  search (more words the library search finds it by), y (height over the floor when placed), round (round footprint), icon (of the ball to
 *  tap in the live mode), lamp (a lamp: lights its room), light (how far and how strongly, lamplight.js), wall (hangs on the wall), ceil (hangs
 *  from the ceiling), flat (lies on the floor: drawn under the rest of the plan), parts() */
const CAR = ['silver', 'carwhite', 'carblack', 'cargrey', 'carred', 'carblue', 'cargreen'];
export const GARAGE = {
  car_small: { cat: 'vehicles', label: 'Kleinwagen', fin: ['carred', ...CAR.filter((f) => f !== 'carred')], search: 'auto pkw kleinwagen polo corsa fiesta golf fahrzeug', icon: '🚗',
    parts: () => car({ L: 4.05, W: 1.75, r: 0.31, fo: 0.8, wb: 2.55, hn: 0.72, hb: 0.96, hr: 1.46, ws: 1.15, wt: 1.85, rt: 3.55, rb: 3.92, bp: 2.45, cw: 0.2 }) },
  car_sedan: { cat: 'vehicles', label: 'Limousine', fin: CAR, search: 'auto pkw limousine stufenheck fahrzeug', icon: '🚗',
    parts: () => car({ L: 4.75, W: 1.83, r: 0.33, fo: 0.95, wb: 2.85, hn: 0.7, hb: 0.98, hr: 1.45, ws: 1.45, wt: 2.15, rt: 3.25, rb: 3.95, deck: 1.0, bp: 2.55 }) },
  car_estate: { cat: 'vehicles', label: 'Kombi', fin: ['cargrey', ...CAR.filter((f) => f !== 'cargrey')], search: 'auto pkw kombi variant avant touring fahrzeug', icon: '🚗',
    parts: () => car({ L: 4.8, W: 1.83, r: 0.33, fo: 0.92, wb: 2.85, hn: 0.7, hb: 0.98, hr: 1.5, ws: 1.45, wt: 2.15, rt: 4.35, rb: 4.68, bp: 2.55, qp: 3.55, cw: 0.1, rails: true }) },
  car_suv: { cat: 'vehicles', label: 'SUV', fin: ['carwhite', ...CAR.filter((f) => f !== 'carwhite')], search: 'auto pkw suv geländewagen gelaendewagen offroad fahrzeug', icon: '🚙',
    parts: () => car({ L: 4.7, W: 1.9, r: 0.37, fo: 0.92, wb: 2.8, cl: 0.2, hn: 0.9, hb: 1.1, hr: 1.72, ws: 1.35, wt: 2.0, rt: 4.3, rb: 4.6, bp: 2.45, qp: 3.5, cw: 0.1, tw: 0.24, rails: true }) },
  car_sports: { cat: 'vehicles', label: 'Sportwagen', fin: ['carred', 'signal', ...CAR.filter((f) => f !== 'carred')], search: 'auto pkw sportwagen coupé coupe cabrio fahrzeug', icon: '🏎',
    parts: () => car({ L: 4.45, W: 1.9, r: 0.34, fo: 1.0, wb: 2.45, cl: 0.11, hn: 0.56, hb: 0.86, hr: 1.27, ws: 1.7, wt: 2.4, rt: 2.85, rb: 4.0, deck: 0.92, de: 2.75, cw: 0.3, tw: 0.25, spoiler: true }) },
  pickup: { cat: 'vehicles', label: 'Pick-up', fin: ['cargrey', ...CAR.filter((f) => f !== 'cargrey')], search: 'auto pickup pick-up pritsche geländewagen gelaendewagen fahrzeug', icon: '🛻',
    parts: () => car({ L: 5.3, W: 1.9, r: 0.38, fo: 0.95, wb: 3.2, cl: 0.22, hn: 0.98, hb: 1.15, hr: 1.8, ws: 1.5, wt: 2.15, rt: 3.12, rb: 3.2, bp: 2.6, cw: 0.12, tw: 0.25, bed: 0.9 }) },
  van: { cat: 'vehicles', label: 'Transporter / Kleinbus', fin: ['carwhite', ...CAR.filter((f) => f !== 'carwhite')], search: 'transporter kleinbus bus van bulli multivan fahrzeug', icon: '🚐', parts: van },
  camper_van: { cat: 'vehicles', label: 'Kastenwagen (Camper)', fin: ['silver', 'carwhite', 'cargrey', 'carblack', 'carblue'], search: 'camper kastenwagen campingbus wohnmobil van ducato sprinter camping', icon: '🚐', parts: camperVan },
  motorhome: { cat: 'vehicles', label: 'Wohnmobil', fin: ['carwhite', 'silver', 'cargrey'], search: 'wohnmobil teilintegriert reisemobil camper camping', icon: '🚐', parts: () => motorhome(false) },
  motorhome_alcove: { cat: 'vehicles', label: 'Alkoven-Wohnmobil', fin: ['carwhite', 'silver', 'cargrey'], search: 'wohnmobil alkoven reisemobil camper camping', icon: '🚐', parts: () => motorhome(true) },
  caravan: { cat: 'vehicles', label: 'Wohnwagen', fin: ['carwhite', 'silver', 'cargrey'], search: 'wohnwagen caravan anhänger anhaenger camping', parts: caravan },
  trailer: { cat: 'vehicles', label: 'PKW-Anhänger', fin: ['galvanized', 'carblack', 'cargrey'], search: 'anhänger anhaenger pkw-anhänger hänger haenger trailer', parts: trailer },
  motorbike: { cat: 'vehicles', label: 'Motorrad', fin: ['carblack', 'carred', 'carblue', 'silver', 'orange', 'cargreen'], search: 'motorrad motorbike bike krad maschine', icon: '🏍', parts: motorbike },
  scooter: { cat: 'vehicles', label: 'Motorroller', fin: ['carwhite', 'carred', 'cargreen', 'carblue', 'carblack', 'signal'], search: 'roller motorroller vespa scooter moped', icon: '🛵', parts: scooter },
  bicycle: { cat: 'vehicles', label: 'Fahrrad', fin: ['carblack', 'silver', 'carred', 'carblue', 'cargreen', 'carwhite'], search: 'fahrrad rad bike citybike trekkingrad velo', icon: '🚲', parts: () => bicycle(false) },
  ebike: { cat: 'vehicles', label: 'E-Bike', fin: ['cargrey', 'carblack', 'carwhite', 'carblue', 'cargreen'], search: 'ebike e-bike pedelec elektrorad fahrrad akku laden', icon: '🚲', parts: () => bicycle(true) },
  cargo_bike: { cat: 'vehicles', label: 'Lastenrad', fin: ['carblack', 'cargreen', 'carblue', 'carred'], search: 'lastenrad cargobike lastenfahrrad e-lastenrad fahrrad kinder transport', icon: '🚲', parts: cargoBike },
  ride_mower: { cat: 'vehicles', label: 'Aufsitzmäher', fin: ['cargreen', 'carred', 'orange', 'signal', 'carblack'], search: 'aufsitzmäher aufsitzmaeher rasentraktor rasenmäher rasenmaeher traktor garten', parts: rideOnMower },
  robot_mower: { cat: 'vehicles', label: 'Mähroboter mit Ladestation', fin: ['orange', 'cargreen', 'cargrey', 'carwhite'], search: 'mähroboter maehroboter rasenroboter robotermäher rasenmäher rasenmaeher lawn mower garten', icon: '🌱', parts: robotMower },
  workbench: { cat: 'workshop', label: 'Werkbank', fin: ['anthracite', 'carblue', 'carred', 'cargreen'], search: 'werkbank werktisch hobelbank schraubstock werkstatt', parts: () => workbench(false) },
  workbench_peg: { cat: 'workshop', label: 'Werkbank mit Lochwand und Licht', fin: ['anthracite', 'carblue', 'carred', 'cargreen'], search: 'werkbank lochwand werkzeugwand werkzeug licht led werkstatt', lamp: true, light: { r: 0.5, k: 0.55 }, parts: () => workbench(true) },
  pegboard: { cat: 'workshop', label: 'Lochwand mit Werkzeug', fin: [], search: 'lochwand lochplatte werkzeugwand werkzeug hammer schraubendreher werkstatt', y: 1.0, wall: true, parts: () => [...pegboard(1.3, 0.6, 0, 0.016), ...boardTools(-0.58, 0.48, 0.016)] },
  tool_trolley: { cat: 'workshop', label: 'Werkstattwagen', fin: ['red', 'carblue', 'anthracite', 'orange', 'carblack'], search: 'werkstattwagen werkzeugwagen rollwagen schubladen werkzeug werkstatt', parts: toolTrolley },
  tool_chest: { cat: 'workshop', label: 'Werkzeugschrank', fin: ['red', 'carblue', 'anthracite', 'carblack'], search: 'werkzeugschrank werkzeugkiste rollschrank schubladen werkzeug werkstatt', parts: toolChest },
  shelf_heavy: { cat: 'workshop', label: 'Schwerlastregal', fin: ['galvanized', 'carblue', 'anthracite', 'orange'], search: 'schwerlastregal regal steckregal lagerregal kisten keller garage werkstatt', parts: heavyShelf },
  bin_wall: { cat: 'workshop', label: 'Wand mit Sichtlagerkästen', fin: [], search: 'sichtlagerkästen sichtlagerkaesten kleinteile boxen schrauben wand werkstatt', y: 1.0, wall: true, parts: binWall },
  car_lift: { cat: 'workshop', label: 'Hebebühne', fin: ['carblue', 'carred', 'cargrey', 'signal'], search: 'hebebühne hebebuehne 2-säulen zweisäulen bühne auto werkstatt', icon: '🔧', parts: carLift },
  floor_jack: { cat: 'workshop', label: 'Rangierwagenheber', fin: ['carred', 'carblack', 'signal'], search: 'wagenheber rangierwagenheber heber reifenwechsel werkstatt', parts: floorJack },
  compressor: { cat: 'workshop', label: 'Kompressor', fin: ['carred', 'orange', 'carblue', 'anthracite'], search: 'kompressor druckluft luft reifen werkstatt', icon: '💨', parts: compressor },
  drill_press: { cat: 'workshop', label: 'Standbohrmaschine', fin: ['cargreen', 'carblue', 'cargrey', 'carred'], search: 'standbohrmaschine säulenbohrmaschine saeulenbohrmaschine bohrmaschine bohren werkstatt', icon: '🔧', parts: drillPress },
  table_saw: { cat: 'workshop', label: 'Tischkreissäge', fin: ['carblue', 'carred', 'orange', 'signal'], search: 'tischkreissäge tischkreissaege kreissäge kreissaege säge saege holz werkstatt', icon: '🪚', parts: tableSaw },
  bench_grinder: { cat: 'workshop', label: 'Schleifbock', fin: ['cargreen', 'carblue', 'cargrey', 'orange'], search: 'schleifbock doppelschleifer schleifen schärfen schaerfen werkstatt', parts: benchGrinder },
  welder: { cat: 'workshop', label: 'Schweißgerät', fin: ['carblue', 'carred', 'orange', 'signal'], search: 'schweißgerät schweissgeraet schweißen schweissen mig mag gasflasche werkstatt', icon: '⚡', parts: welder },
  shop_vac: { cat: 'workshop', label: 'Werkstattsauger', fin: ['signal', 'carblue', 'carred', 'cargreen'], search: 'werkstattsauger industriesauger nasssauger sauger staubsauger werkstatt', icon: '🧹', parts: shopVac },
  tyre_rack: { cat: 'workshop', label: 'Reifenregal', fin: ['galvanized', 'anthracite', 'carblue'], search: 'reifenregal reifen räder raeder sommerreifen winterreifen regal garage', parts: tyreRack },
  tyre_stack: { cat: 'workshop', label: 'Reifensatz (gestapelt)', fin: [], search: 'reifen räder raeder reifensatz sommerreifen winterreifen stapel garage', round: true, parts: () => range(4).flatMap((i) => storedWheel(0, i * 0.215, 0, true)) },
  ladder: { cat: 'workshop', label: 'Stehleiter', fin: ['alu', 'signal', 'orange'], search: 'leiter stehleiter trittleiter haushaltsleiter', parts: ladder },
  work_lamp: { cat: 'workshop', label: 'LED-Werkstattleuchte', fin: ['white', 'grey'], search: 'werkstattleuchte feuchtraumleuchte wannenleuchte led leuchte lampe decke garage werkstatt', y: 2.1, ceil: true, lamp: true, light: { r: 0.85, k: 0.75 },
    parts: () => [B(1.5, 0.05, 0.1, 0, 0.015, 0), B(1.48, 0.016, 0.085, 0, 0, 0, 'glow'), ...[-0.55, 0.55].flatMap((x) => [rod([x, 0.065, 0], [x, 0.39, 0], 0.003, 'steel'), C(0.03, 0.01, x, 0.39, 0, 'white', 0.03, 12)])] },
  highbay_lamp: { cat: 'workshop', label: 'Hallenstrahler (UFO)', fin: ['anthracite', 'black'], search: 'hallenstrahler ufo hallenleuchte led leuchte lampe decke garage werkstatt', y: 2.05, ceil: true, lamp: true, light: { r: 0.9, k: 0.8 },
    parts: () => [C(0.15, 0.02, 0, 0, 0, 'glow', 0.15, 24), C(0.15, 0.05, 0, 0.02, 0, 'f', 0.15, 24), ...range(12).map((i) => { const a = (i * PI) / 6; return B(0.008, 0.07, 0.11, 0.09 * Math.sin(a), 0.07, 0.09 * Math.cos(a), 'f', { ry: a }); }),
      C(0.03, 0.06, 0, 0.14, 0, 'f', 0.03, 12), rod([0, 0.2, 0], [0, 0.42, 0], 0.006, 'steel'), C(0.04, 0.01, 0, 0.42, 0, 'f', 0.04, 12)] },
  extinguisher: { cat: 'workshop', label: 'Feuerlöscher', fin: [], search: 'feuerlöscher feuerloescher brandschutz feuer löscher', y: 0.8, wall: true, parts: extinguisher },
  oil_drum: { cat: 'workshop', label: 'Ölfass', fin: ['carblue', 'carred', 'carblack', 'cargreen', 'orange'], search: 'ölfass oelfass fass tonne öl oel 200 liter', round: true,
    parts: () => [C(0.29, 0.88, 0, 0, 0, 'f', 0.29, 28), ...[0.0, 0.29, 0.59, 0.865].map((y) => C(0.297, 0.018, 0, y, 0, 'f2', 0.297, 28)), C(0.03, 0.01, 0.15, 0.88, 0.1, 'iron', 0.03, 10), C(0.02, 0.01, -0.15, 0.88, -0.1, 'iron', 0.02, 10)] },
  creeper: { cat: 'workshop', label: 'Rollbrett (Montageliege)', fin: ['carred', 'carblack', 'carblue'], search: 'rollbrett montageliege werkstattliege rollliege auto werkstatt',
    parts: () => [B(0.42, 0.03, 0.95, 0, 0.07, 0), B(0.38, 0.03, 0.9, 0, 0.1, -0.02, 'trim'), B(0.3, 0.04, 0.18, 0, 0.12, 0.36, 'trim'),
      ...[[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]].flatMap(([i, k]) => [C(0.035, 0.05, i * 0.17, 0, k * 0.4, 'rubber', 0.035, 10), B(0.04, 0.03, 0.04, i * 0.17, 0.045, k * 0.4, 'steel')])] },
  carport: { cat: 'garage', label: 'Carport', fin: ['larch', 'anthracite', 'white', 'galvanized'], search: 'carport unterstand autodach überdachung ueberdachung stellplatz garage', parts: () => carport(1, false) },
  carport_double: { cat: 'garage', label: 'Doppelcarport', fin: ['larch', 'anthracite', 'white', 'galvanized'], search: 'doppelcarport carport zwei autos unterstand überdachung ueberdachung stellplatz garage', parts: () => carport(2, false) },
  carport_solar: { cat: 'garage', label: 'Solarcarport', fin: ['anthracite', 'larch', 'white', 'galvanized'], search: 'solarcarport carport solar photovoltaik pv solardach überdachung ueberdachung stellplatz', icon: '☀', parts: () => carport(2, true) },
  bins: { cat: 'garage', label: 'Mülltonnen (4 Stück)', fin: [], search: 'mülltonnen muelltonnen tonne abfall restmüll biotonne papier gelbe tonne müll muell',
    parts: () => [...bin(-0.93, 'bingrey'), ...bin(-0.31, 'binbrown'), ...bin(0.31, 'binblue'), ...bin(0.93, 'binyellow')] },
  bin_box: { cat: 'garage', label: 'Mülltonnenbox', fin: ['anthracite', 'larch', 'grey', 'galvanized'], search: 'mülltonnenbox muelltonnenbox mülltonnenverkleidung tonnenbox mülltonnen muelltonnen', parts: binBox },
  bike_rack: { cat: 'garage', label: 'Fahrradständer', fin: ['galvanized', 'anthracite', 'carblack'], search: 'fahrradständer fahrradstaender radständer fahrrad bügel abstellen', parts: bikeRack },
  bike_wall: { cat: 'garage', label: 'Fahrrad an der Wand', fin: ['carblack', 'silver', 'carred', 'carblue', 'cargreen'], search: 'fahrrad wandhalter wandhalterung aufhängen aufhaengen fahrradhalter wand', y: 1.0, wall: true, parts: bikeWall },
  ceiling_rack: { cat: 'garage', label: 'Deckenregal', fin: ['galvanized', 'anthracite', 'white'], search: 'deckenregal deckenlift garagenregal decke lagern stauraum garage', y: 1.9, ceil: true, parts: ceilingRack },
  garage_cabinet: { cat: 'garage', label: 'Metallschrank', fin: ['anthracite', 'lightgrey', 'carblue', 'carred'], search: 'metallschrank stahlschrank garagenschrank spind werkzeugschrank garage werkstatt', parts: cabinet },
  wheelbarrow: { cat: 'garage', label: 'Schubkarre', fin: ['cargreen', 'carred', 'galvanized', 'carblue'], search: 'schubkarre schubkarren karre garten bau', parts: wheelbarrow },
  lawn_mower: { cat: 'garage', label: 'Rasenmäher', fin: ['cargreen', 'carred', 'orange', 'signal'], search: 'rasenmäher rasenmaeher mäher maeher garten', icon: '🌱', parts: lawnMower },
  garden_tools: { cat: 'garage', label: 'Gartengeräte an der Wand', fin: [], search: 'gartengeräte gartengeraete rechen harke spaten besen hacke gerätehalter wand garten', wall: true, parts: gardenTools },
  pressure_washer: { cat: 'garage', label: 'Hochdruckreiniger', fin: ['signal', 'carblue', 'carred', 'cargreen'], search: 'hochdruckreiniger kärcher kaercher dampfstrahler reinigen auto', icon: '💦', parts: pressureWasher },
  wheel_stop: { cat: 'garage', label: 'Radstopper (Paar)', fin: [], search: 'radstopper parkstopper anschlag parkhilfe einparken garage boden', flat: true,
    parts: () => [-0.75, 0.75].flatMap((x) => [B(0.5, 0.1, 0.15, x, 0, 0, 'rubber'), B(0.08, 0.004, 0.15, x - 0.12, 0.1, 0, 'safety'), B(0.08, 0.004, 0.15, x + 0.12, 0.1, 0, 'safety')]) },
};
const keys = (flag) => Object.keys(GARAGE).filter((k) => GARAGE[k][flag]);
/** the lamps among them (lamplight.js), how they light the room, what hangs on the wall or the ceiling (placement.js, collide.js), what lies flat */
export const GARAGE_LAMPS = keys('lamp');
export const GARAGE_LIGHT = Object.fromEntries(keys('light').map((k) => [k, GARAGE[k].light]));
export const GARAGE_WALL = keys('wall');
export const GARAGE_HUNG = [...keys('wall'), ...keys('ceil')];
export const GARAGE_FLAT = keys('flat');
/** the library groups these pieces add (models.js puts them before the lamps) */
export const GARAGE_CATS = ['vehicles', 'workshop', 'garage'];
