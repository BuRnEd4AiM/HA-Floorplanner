/* Sauna and wellness, fitness, the bar, the home cinema, the PC corner, mirrors with LED light, air conditioners and fans: own simple models in their real sizes,
 * made of parts like the furniture in Scandinavian style (scandi.js, which lists these pieces too, so models.js, plan2d.js and the side
 * panel treat both alike). Pure geometry, no three.js; the building blocks are in shapes.js, the format of a part in scandi.js.
 *
 * What lights up follows the device's entity: 'glow' and the other lit materials (a sauna's stones, a screen, a display, the RGB parts of a
 * PC ...; `on`: their colour when the entity tells none). A piece with LED zones (leds: [...], materials 'z0', 'z1' ...) can link every
 * zone to an entity of its own (a mirror's backlight and its front light, the bar's counter edge and its plinth); a zone without one
 * follows the device's entity (ledzones.js). The air outlet of an air conditioner ('acvent', heat: true) turns blue while it cools and red
 * while it heats (heating.js, like a radiator). Unit tests: tests/leisure.test.mjs */
import { B, C, S, rod, bar, legs, hline, vline, at, turnAll, tilted, wheelX, discZ } from './shapes.js';

const PI = Math.PI, H = PI / 2;

/** the finishes these pieces add to the ones of scandi.js (side panel: "Ausführung") */
export const LEISURE_FINISHES = {
  spruce: { c: '#e2c792' }, hemlock: { c: '#d9b27c' }, cedar: { c: '#b8764a' }, thermo: { c: '#6f4a31' },
  red: { c: '#b3302b' }, anthracite: { c: '#3b3f45' }, purple: { c: '#6d4bb0', rough: 0.9 }, cognac: { c: '#8a4b26', rough: 0.55 },
};
/** the fixed materials these pieces add (glow: lights up with the entity; on: the colour it lights in when the entity tells none;
 *  zone: the LED zone it belongs to) */
export const LEISURE_MATS = {
  iron: { c: '#3a3d42', metal: 0.5, rough: 0.45 }, chrome: { c: '#d9dde0', metal: 0.8, rough: 0.2 }, steel: { c: '#b9bec2', metal: 0.6, rough: 0.3 },
  rubber: { c: '#26272a', rough: 0.9 }, bronzeglass: { c: '#8a6a4a', opacity: 0.45, rough: 0.1 }, smoke: { c: '#30363c', opacity: 0.4, rough: 0.1 },
  water: { c: '#3a9ec8', opacity: 0.5, rough: 0.05 }, acryl: { c: '#eef3f5', rough: 0.2 }, bartop: { c: '#2a2624', rough: 0.25 },
  felt: { c: '#2f7d4a', rough: 1 }, night: { c: '#141a2e', rough: 0.9 }, pcb: { c: '#1e2b24' }, popcorn: { c: '#f2d47a', rough: 0.95 },
  red: { c: '#b8262b' }, teamred: { c: '#c23b30' }, teamblue: { c: '#2f5aa8' }, cream: { c: '#efe3c4', rough: 0.8 }, dartred: { c: '#b8322a', rough: 0.8 },
  dartgreen: { c: '#2f7a43', rough: 0.8 }, dark: { c: '#1f1f1f', rough: 0.8 }, cork: { c: '#3a302a', rough: 1 },
  bottle1: { c: '#2f6b3a', rough: 0.15, metal: 0.1 }, bottle2: { c: '#6b3a1c', rough: 0.15, metal: 0.1 }, bottle3: { c: '#cfe0e4', rough: 0.1, metal: 0.1, opacity: 0.7 },
  bottle4: { c: '#24467e', rough: 0.15, metal: 0.1 }, bottle5: { c: '#8a1f2b', rough: 0.15, metal: 0.1 },
  poolY: { c: '#e8c11c', rough: 0.2 }, poolB: { c: '#1d4fa8', rough: 0.2 }, poolR: { c: '#c8282a', rough: 0.2 }, poolO: { c: '#e5731c', rough: 0.2 }, poolK: { c: '#151515', rough: 0.2 },
  ember: { c: '#5e5650', glow: true, on: '#ff5a1f' }, ir: { c: '#5a3a34', glow: true, on: '#ff3b1f' }, screen: { c: '#e9ecef', glow: true, on: '#dce8ff' },
  display: { c: '#1c2733', glow: true, on: '#9cc8ff' }, lens: { c: '#2b3440', glow: true, on: '#f4f8ff' }, rgb: { c: '#3a3f4a', glow: true, on: '#a050ff' },
  neon: { c: '#e7d6ee', glow: true, on: '#ff3fb4' }, stars: { c: '#c9d3e8', glow: true, on: '#f4f8ff' },
  acvent: { c: '#d3d8dc', rough: 0.4, heat: true }, acdisplay: { c: '#222a31', glow: true, on: '#6fd3ff' }, mesh: { c: '#b4b9bd', rough: 0.9 },
  copper: { c: '#b8743c', metal: 0.6, rough: 0.35 }, hose: { c: '#d6d8d9', rough: 0.85 },
  z0: { c: '#fff2cc', glow: true, zone: 0 }, z1: { c: '#fff2cc', glow: true, zone: 1 }, z2: { c: '#fff2cc', glow: true, zone: 2 }, z3: { c: '#fff2cc', glow: true, zone: 3 },
};

/** a row of the numbers 0..n-1 */
const range = (n) => Array.from({ length: n }, (_, i) => i);
/** always the same "random" numbers 0..1 for a seed */
function rand(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

/* ---------- sauna and wellness ---------- */
/** the sauna heater (w x d, its body `hgt` high on short legs) with its stones on top, glowing while it heats; (x, z) its middle */
function heater(x, z, w = 0.36, d = 0.3, hgt = 0.55) {
  const p = [B(w, hgt, d, x, 0.1, z, 'iron'), B(w + 0.02, 0.02, d + 0.02, x, 0.1 + hgt, z, 'iron'), ...at(legs(w, d, 0.1, 0.03, 0.02, 'iron'), x, 0, z),
    B(0.06, 0.03, 0.004, x - w / 2 + 0.06, 0.25, z + d / 2 + 0.002, 'ember'), hline(w - 0.06, x, 0.5, z + d / 2 + 0.001), hline(w - 0.06, x, 0.42, z + d / 2 + 0.001)];
  const rnd = rand(Math.round(w * 1000));
  for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) {
    const r = 0.045 + rnd() * 0.02;
    p.push(S(r, x + (i - 1) * (w / 3.2), 0.12 + hgt, z + (k - 1) * (d / 3.2), 'ember', 1, 0.8, 1));
  }
  [[-0.5, -0.5], [0.5, 0.4], [0, 0]].forEach(([i, k]) => p.push(S(0.05, x + i * w / 3.2, 0.12 + hgt + 0.06, z + k * d / 3.2, 'ember', 1, 0.8, 1)));
  return p;
}
/** a wooden bucket with a ladle, its foot at (x, y, z) */
const bucket = (x, y, z) => [C(0.1, 0.18, x, y, z, 'f2', 0.085, 16), C(0.102, 0.012, x, y + 0.03, z, 'iron', 0.092, 16), C(0.104, 0.012, x, y + 0.14, z, 'iron', 0.1, 16),
  rod([x + 0.03, y + 0.05, z], [x + 0.16, y + 0.3, z], 0.008, 'f2')];
/** a sauna cabin W x D x H: wooden walls and roof, a glass front (or a wooden one) with a bronze glass door on the right, two benches along
 *  the back, the heater with its stones in the front corner, LED light under the upper bench and above the backrest, a bucket */
function saunaCabin(W, D, H2, glassFront) {
  const t = 0.045, zf = D / 2 - t / 2, iw = W - 2 * t, zb = -D / 2 + t, p = [];
  p.push(B(t, H2 - t, D, -W / 2 + t / 2), B(t, H2 - t, D, W / 2 - t / 2), B(iw, H2 - t, t, 0, 0, zb - t / 2), B(W + 0.04, t, D + 0.04, 0, H2 - t, 0, 'f2'));
  const head = H2 - t - 0.22, gh = head - 0.06, dw = Math.min(0.7, iw * 0.55), dx = W / 2 - t - dw / 2, fw = iw - dw - 0.05;
  p.push(B(iw, 0.06, t, 0, 0, zf), B(iw, 0.22, t, 0, head, zf), B(0.05, gh, t, W / 2 - t - dw - 0.025, 0.06, zf));
  if (fw > 0.02) p.push(glassFront ? B(fw, gh, 0.01, -W / 2 + t + fw / 2, 0.06, zf, 'glass') : B(fw, gh, t, -W / 2 + t + fw / 2, 0.06, zf));
  p.push(B(dw - 0.01, gh - 0.01, 0.01, dx, 0.065, zf, 'bronzeglass'), B(0.03, 0.45, 0.035, dx - dw / 2 + 0.09, 0.85, zf + 0.025, 'f2'));
  const ub = Math.min(0.6, (D - 2 * t) * 0.42), lb = Math.min(0.45, (D - 2 * t) * 0.3);
  range(5).forEach((i) => p.push(B(iw, 0.028, ub / 5 - 0.02, 0, 0.95, zb + (i + 0.5) * (ub / 5), 'f2')));
  range(4).forEach((i) => p.push(B(iw, 0.028, lb / 4 - 0.02, 0, 0.45, zb + ub + (i + 0.5) * (lb / 4), 'f2')));
  p.push(B(iw, 0.5, 0.02, 0, 0.45, zb + ub - 0.06, 'f2'), B(iw, 0.45, 0.02, 0, 0, zb + ub + lb - 0.05, 'f2'),       // the fronts of the benches
    B(iw - 0.1, 0.012, 0.012, 0, 0.93, zb + ub - 0.035, 'glow'),                                                      // LED under the upper bench
    B(iw, 0.08, 0.02, 0, 1.15, zb + 0.01, 'f2'), B(iw, 0.08, 0.02, 0, 1.3, zb + 0.01, 'f2'), B(iw - 0.1, 0.015, 0.012, 0, 1.45, zb + 0.008, 'glow'),   // backrest, LED
    discZ(0.06, 0.02, -iw / 2 + 0.25, 1.75, zb + 0.01, 'f2'), discZ(0.048, 0.004, -iw / 2 + 0.25, 1.75, zb + 0.022, 'cream'),                     // thermometer
    ...heater(-W / 2 + t + 0.24, D / 2 - t - 0.06 - Math.min(0.3, D * 0.2) / 2, 0.36, Math.min(0.3, D * 0.2)),
    ...range(4).map((i) => B(0.035, 0.6, 0.02, -W / 2 + t + 0.1 + i * 0.1, 0.05, D / 2 - t - 0.03, 'f2')),                                 // the guard in front of it
    ...bucket(W / 2 - t - 0.25, 0.478, zb + ub + lb / 2));
  return p;
}
/** an infrared cabin: wooden walls, a glass front with the door, a bench, the glowing radiant panels at the back, the sides and the calves */
function saunaIr() {
  const W = 1.2, D = 1.05, H2 = 1.95, t = 0.04, iw = W - 2 * t, zb = -D / 2 + t, zf = D / 2 - t / 2;
  return [B(t, H2 - t, D, -W / 2 + t / 2), B(t, H2 - t, D, W / 2 - t / 2), B(iw, H2 - t, t, 0, 0, zb - t / 2), B(W + 0.03, t, D + 0.03, 0, H2 - t, 0, 'f2'),
    B(iw, 0.05, t, 0, 0, zf), B(iw, 0.15, t, 0, H2 - t - 0.15, zf), B(0.15, H2 - t - 0.2, t, -iw / 2 + 0.075, 0.05, zf), B(0.15, H2 - t - 0.2, t, iw / 2 - 0.075, 0.05, zf),
    B(iw - 0.3, H2 - t - 0.21, 0.01, 0, 0.055, zf, 'bronzeglass'), B(0.03, 0.4, 0.035, iw / 2 - 0.2, 0.85, zf + 0.025, 'f2'),
    B(0.07, 0.11, 0.008, iw / 2 - 0.075, 1.35, D / 2 + 0.004, 'display'),                                                // the control panel
    B(iw, 0.04, 0.45, 0, 0.45, zb + 0.225), B(iw, 0.45, 0.02, 0, 0, zb + 0.44),                                        // bench
    B(0.8, 0.7, 0.012, 0, 0.62, zb + 0.006, 'ir'), B(0.012, 0.6, 0.35, -iw / 2 + 0.006, 0.62, zb + 0.4, 'ir'), B(0.012, 0.6, 0.35, iw / 2 - 0.006, 0.62, zb + 0.4, 'ir'),
    B(0.7, 0.28, 0.012, 0, 0.08, zb + 0.6, 'ir'), B(0.2, 0.012, 0.1, 0, H2 - t - 0.012, 0, 'glow')];
}
/** the barrel sauna for the garden: a lying wooden barrel on two cradles with steel bands, a glass door in front, a lamp over it */
function saunaBarrel() {
  const R = 0.975, L = 2.4, hc = 0.14 + R, p = [];
  [-0.8, 0.8].forEach((z) => p.push(B(1.5, 0.14, 0.12, 0, 0, z, 'f2'), B(0.22, 0.32, 0.12, -0.62, 0.1, z, 'f2'), B(0.22, 0.32, 0.12, 0.62, 0.1, z, 'f2')));
  p.push(discZ(R, L, 0, hc, 0, 'f', 40), discZ(R - 0.045, 0.01, 0, hc, L / 2 + 0.005, 'f2', 40), discZ(R - 0.045, 0.01, 0, hc, -L / 2 - 0.005, 'f2', 40),
    ...[-0.9, 0, 0.9].map((z) => discZ(R + 0.006, 0.04, 0, hc, z, 'iron', 40)),
    B(0.74, 1.58, 0.03, 0, hc - 0.82, L / 2 + 0.025), B(0.62, 1.46, 0.012, 0, hc - 0.76, L / 2 + 0.046, 'bronzeglass'), B(0.03, 0.35, 0.04, 0.22, hc - 0.3, L / 2 + 0.07, 'f2'),
    B(0.1, 0.12, 0.06, 0, hc + 0.78, L / 2 + 0.035, 'glow'), B(0.14, 0.02, 0.08, 0, hc + 0.9, L / 2 + 0.04, 'iron'));
  return p;
}
/** a hot tub with LED light under the water: the cabinet with its panels, the acrylic rim and seats, the water, the steps in front */
function hotTub() {
  const S2 = 2.0, h = 0.86, t = 0.16, inner = S2 - 2 * t, p = [];
  [-1, 1].forEach((s) => p.push(B(S2, h, t, 0, 0, s * (S2 / 2 - t / 2)), B(t, h, inner, s * (S2 / 2 - t / 2), 0, 0),
    B(S2 + 0.02, 0.04, t + 0.01, 0, h, s * (S2 / 2 - t / 2), 'acryl'), B(t + 0.01, 0.04, inner, s * (S2 / 2 - t / 2), h, 0, 'acryl'),
    B(inner - 0.04, 0.012, 0.008, 0, 0.6, s * (inner / 2 - 0.004), 'glow'), B(0.008, 0.012, inner - 0.04, s * (inner / 2 - 0.004), 0.6, 0, 'glow')));
  p.push(B(inner, 0.02, inner, 0, 0.08, 0, 'acryl'), B(inner, 0.42, 0.45, 0, 0.1, -inner / 2 + 0.225, 'acryl'), B(0.45, 0.42, inner - 0.45, -inner / 2 + 0.225, 0.1, 0.225, 'acryl'),
    B(inner, 0.02, inner, 0, 0.72, 0, 'water'), B(0.26, 0.06, 0.12, -0.45, h + 0.04, -S2 / 2 + 0.09, 'black'), B(0.26, 0.06, 0.12, 0.45, h + 0.04, -S2 / 2 + 0.09, 'black'),
    B(0.14, 0.012, 0.07, inner / 2 - 0.1, h + 0.04, S2 / 2 - 0.08, 'display'),
    ...[-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((x) => vline(h - 0.1, x, 0.05, S2 / 2 + 0.001)),
    B(1.0, 0.2, 0.42, 0, 0, S2 / 2 + 0.21), B(1.0, 0.2, 0.2, 0, 0.2, S2 / 2 + 0.1));
  return p;
}
/** a cold plunge tub: a wooden tub of staves with steel bands, the water inside, a step in front */
function plungeTub() {
  const R = 0.55, h = 0.95, p = [C(R, h - 0.12, 0, 0, 0, 'f', R, 32), C(R - 0.04, 0.012, 0, h - 0.12, 0, 'water', R - 0.04, 32)];
  range(16).forEach((k) => {
    const a = (k * 2 * PI) / 16;
    p.push(B(0.22, 0.12, 0.04, (R - 0.02) * Math.sin(a), h - 0.12, (R - 0.02) * Math.cos(a), 'f', { ry: a }));
  });
  p.push(C(R + 0.006, 0.04, 0, 0.12, 0, 'iron', R + 0.006, 32), C(R + 0.006, 0.04, 0, 0.62, 0, 'iron', R + 0.006, 32), B(0.5, 0.28, 0.3, 0, 0, R + 0.14, 'f2'));
  return p;
}
/** a wooden relaxing lounger: two side rails along the shape (head raised, knees a little), slats across, legs */
function lounger() {
  const prof = [[-0.95, 0.85], [-0.35, 0.4], [0.35, 0.42], [0.95, 0.3]], p = [];
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 3; i++) p.push(bar([s * 0.3, prof[i][1] - 0.05, prof[i][0]], [s * 0.3, prof[i + 1][1] - 0.05, prof[i + 1][0]], 0.04, 0.08));
    p.push(B(0.05, prof[1][1] - 0.05, 0.05, s * 0.3, 0, prof[1][0]), B(0.05, prof[3][1] - 0.05, 0.05, s * 0.3, 0, prof[3][0] - 0.03), B(0.05, 0.62, 0.05, s * 0.3, 0, -0.62));
  });
  for (let i = 0; i < 3; i++) {
    const [z0, y0] = prof[i], [z1, y1] = prof[i + 1], n = Math.round(Math.hypot(z1 - z0, y1 - y0) / 0.09);
    for (let j = 0; j < n; j++) { const k = (j + 0.5) / n; p.push(B(0.66, 0.02, 0.065, 0, y0 + (y1 - y0) * k + 0.0, z0 + (z1 - z0) * k)); }
  }
  p.push(B(0.5, 0.05, 0.32, 0, 0.82, -0.82, 'cloth3', { rx: -0.65 }));
  return p;
}
/** a bucket shower for the wall: wall plate, arm, the wooden bucket that tips, the chain to pull */
function bucketShower() {
  return [B(0.14, 0.45, 0.03, 0, 0.18, -0.2, 'f2'), B(0.04, 0.04, 0.3, 0, 0.55, -0.04), rod([-0.17, 0.58, 0.08], [0.17, 0.58, 0.08], 0.01, 'iron'),
    C(0.17, 0.3, 0, 0.3, 0.08, 'f', 0.14, 20), C(0.172, 0.02, 0, 0.36, 0.08, 'iron', 0.16, 20), C(0.174, 0.02, 0, 0.54, 0.08, 'iron', 0.17, 20),
    rod([0, 0.6, -0.17], [0, 0.85, -0.17], 0.012, 'chrome'), rod([0.16, 0.45, 0.08], [0.2, 0.05, 0.08], 0.004, 'chrome'), S(0.02, 0.2, 0, 0.08, 'f2')];
}

/* ---------- fitness ---------- */
/** a barbell along x, its middle at (0, cy, z), `len` long, with plates (radii) on both sides */
function barbell(cy, z, len = 1.8, plates = [0.225, 0.17]) {
  const p = [rod([-len / 2, cy, z], [len / 2, cy, z], 0.014, 'chrome')], x0 = len / 2 - 0.4;
  [-1, 1].forEach((s) => {
    plates.forEach((r, i) => p.push(wheelX(r, 0.045, s * (x0 + 0.03 + i * 0.047), cy, z, 'rubber', 28)));
    p.push(wheelX(0.03, 0.03, s * (x0 + 0.03 + plates.length * 0.047), cy, z, 'chrome', 12), wheelX(0.035, 0.015, s * (x0 - 0.008), cy, z, 'chrome', 12));
  });
  return p;
}
/** pedals on cranks round the axle at (0, cy, z) */
const cranks = (cy, z) => [rod([-0.14, cy, z], [0.14, cy, z], 0.012, 'chrome'), bar([-0.13, cy, z], [-0.13, cy - 0.15, z + 0.08], 0.03, 0.015, 'chrome'),
  bar([0.13, cy, z], [0.13, cy + 0.15, z - 0.08], 0.03, 0.015, 'chrome'), B(0.1, 0.025, 0.07, -0.18, cy - 0.165, z + 0.08, 'black'), B(0.1, 0.025, 0.07, 0.18, cy + 0.135, z - 0.08, 'black')];
function treadmill() {
  const p = [B(0.82, 0.16, 1.7, 0, 0.03, 0.1, 'black'), B(0.56, 0.02, 1.5, 0, 0.19, 0.12, 'rubber'), B(0.86, 0.26, 0.34, 0, 0, -0.78), B(0.84, 0.05, 0.08, 0, 0, 0.92, 'black'),
    ...[-1, 1].map((s) => B(0.12, 0.03, 1.5, s * 0.34, 0.19, 0.12, 'f2'))];
  [-1, 1].forEach((s) => p.push(bar([s * 0.38, 0.2, -0.8], [s * 0.36, 1.2, -0.66], 0.06, 0.05, 'f2'), rod([s * 0.36, 1.08, -0.62], [s * 0.36, 1.08, -0.18], 0.016, 'rubber')));
  p.push(tilted(0.8, 0.34, 0.08, 0, 1.3, -0.62, -0.55), tilted(0.4, 0.16, 0.01, 0, 1.31, -0.62, -0.55, 'display', 0.045));
  return p;
}
function exerciseBike() {
  return [B(0.55, 0.05, 0.08, 0, 0, -0.42, 'f2'), B(0.55, 0.05, 0.08, 0, 0, 0.45, 'f2'), bar([0, 0.05, 0.45], [0, 0.32, 0.05], 0.07, 0.05, 'f2'), bar([0, 0.05, -0.42], [0, 0.32, -0.15], 0.07, 0.05, 'f2'),
    wheelX(0.24, 0.1, 0, 0.42, -0.12), bar([0, 0.4, 0.1], [0, 0.82, 0.28], 0.05, 0.05, 'f2'), B(0.18, 0.06, 0.28, 0, 0.82, 0.3, 'black'),
    bar([0, 0.55, -0.22], [0, 1.12, -0.34], 0.05, 0.05, 'f2'), rod([-0.2, 1.1, -0.3], [0.2, 1.1, -0.3], 0.016, 'rubber'),
    tilted(0.2, 0.13, 0.04, 0, 1.2, -0.36, -0.6, 'f2'), tilted(0.15, 0.08, 0.008, 0, 1.2, -0.36, -0.6, 'display', 0.024), ...cranks(0.42, -0.02)];
}
function spinBike() {
  return [B(0.5, 0.05, 0.08, 0, 0, -0.5, 'black'), B(0.5, 0.05, 0.08, 0, 0, 0.5, 'black'), bar([0, 0.05, 0.5], [0, 0.45, 0.0], 0.07, 0.06), bar([0, 0.05, -0.5], [0, 0.45, -0.05], 0.07, 0.06),
    wheelX(0.25, 0.045, 0, 0.3, -0.4, 'chrome', 32), wheelX(0.12, 0.05, 0, 0.3, -0.4, 'black'), bar([0, 0.45, -0.05], [0, 0.3, -0.4], 0.05, 0.03),
    bar([0, 0.45, 0.05], [0, 0.85, 0.2], 0.05, 0.05), B(0.15, 0.06, 0.27, 0, 0.85, 0.22, 'black'), bar([0, 0.45, -0.08], [0, 1.0, -0.3], 0.05, 0.05),
    rod([-0.22, 1.0, -0.3], [0.22, 1.0, -0.3], 0.015, 'rubber'), rod([-0.22, 1.0, -0.3], [-0.1, 1.04, -0.52], 0.015, 'rubber'), rod([0.22, 1.0, -0.3], [0.1, 1.04, -0.52], 0.015, 'rubber'),
    C(0.025, 0.05, 0, 0.47, -0.1, 'red'), ...cranks(0.38, -0.05)];
}
function rower() {
  return [B(0.12, 0.05, 1.5, 0, 0.2, 0.35), B(0.5, 0.2, 0.08, 0, 0, 1.06), B(0.6, 0.06, 0.6, 0, 0, -0.7), C(0.27, 0.22, 0, 0.06, -0.7, 'water', 0.27, 32), C(0.1, 0.02, 0, 0.28, -0.7, 'black', 0.1, 20),
    bar([0, 0.06, -0.98], [0, 0.66, -0.92], 0.08, 0.05), B(0.16, 0.12, 0.06, 0, 0.62, -0.9, 'black'), B(0.1, 0.06, 0.006, 0, 0.65, -0.867, 'display'),
    B(0.3, 0.06, 0.3, 0, 0.25, 0.35, 'black'), tilted(0.12, 0.3, 0.03, -0.1, 0.38, -0.36, -0.7, 'black'), tilted(0.12, 0.3, 0.03, 0.1, 0.38, -0.36, -0.7, 'black'),
    rod([-0.25, 0.45, -0.58], [0.25, 0.45, -0.58], 0.015, 'rubber'), rod([0, 0.28, -0.64], [0, 0.45, -0.58], 0.004, 'black')];
}
function crossTrainer() {
  const p = [B(0.12, 0.08, 1.5, 0, 0, 0, 'black'), B(0.62, 0.06, 0.08, 0, 0, 0.72, 'black'), B(0.62, 0.06, 0.08, 0, 0, -0.68, 'black'), B(0.2, 0.1, 0.4, 0, 0.06, -0.45),
    wheelX(0.23, 0.2, 0, 0.32, -0.45), bar([0, 0.06, -0.3], [0, 1.25, -0.3], 0.06, 0.06, 'f2'), rod([-0.26, 1.0, -0.22], [0.26, 1.0, -0.22], 0.02, 'iron'),
    tilted(0.3, 0.18, 0.05, 0, 1.32, -0.32, -0.5, 'f2'), tilted(0.2, 0.1, 0.008, 0, 1.33, -0.32, -0.5, 'display', 0.03)];
  [-1, 1].forEach((s) => p.push(bar([s * 0.14, 0.32, -0.45], [s * 0.14, 0.1, 0.62], 0.05, 0.03, 'iron'), B(0.13, 0.03, 0.36, s * 0.14, 0.2, 0.15, 'rubber'),
    bar([s * 0.26, 0.24, 0.02], [s * 0.26, 1.55, -0.25], 0.035, 0.035, 'iron'), rod([s * 0.26, 1.15, -0.17], [s * 0.26, 1.55, -0.25], 0.018, 'rubber'), bar([s * 0.26, 0.24, 0.02], [s * 0.15, 0.24, 0.02], 0.03, 0.03, 'iron')));
  return p;
}
function weightBench() {
  const p = [B(0.3, 0.07, 1.15, 0, 0.42, 0.2), B(0.07, 0.07, 1.15, 0, 0.35, 0.2, 'iron'), B(0.5, 0.05, 0.07, 0, 0, 0.72, 'iron'), B(0.06, 0.35, 0.06, 0, 0.05, 0.7, 'iron'),
    B(0.06, 0.35, 0.06, 0, 0.05, -0.32, 'iron'), B(0.07, 0.05, 0.2, 0, 0, -0.42, 'iron'), B(1.16, 0.05, 0.07, 0, 0, -0.5, 'iron'), ...barbell(1.08, -0.44)];
  [-1, 1].forEach((s) => p.push(B(0.06, 1.1, 0.06, s * 0.55, 0.05, -0.5, 'iron'), B(0.06, 0.05, 0.5, s * 0.55, 0, -0.5, 'iron'), B(0.06, 0.07, 0.08, s * 0.55, 0.98, -0.44, 'iron')));
  return p;
}
function powerRack() {
  const W = 1.2, D = 1.2, Hh = 2.2, t = 0.07, xs = W / 2 - t / 2, zs = D / 2 - t / 2, p = [];
  [-1, 1].forEach((i) => {
    [-1, 1].forEach((k) => p.push(B(t, Hh, t, i * xs, 0, k * zs)));
    p.push(B(t, t, D - 2 * t, i * xs, Hh - t, 0), B(t, 0.05, D + 0.2, i * xs, 0, 0), rod([i * (xs - 0.05), 0.62, -zs], [i * (xs - 0.05), 0.62, zs], 0.02, 'chrome'),
      B(0.06, 0.08, 0.1, i * xs, 1.3, zs + 0.06, 'f2'), rod([i * xs, 0.4, -D / 2], [i * xs, 0.4, -D / 2 - 0.24], 0.025, 'f2'), discZ(0.225, 0.045, i * xs, 0.4, -D / 2 - 0.12, 'rubber', 28));
  });
  p.push(B(W - 2 * t, t, t, 0, Hh - t, -zs), rod([-W / 2 - 0.05, Hh - 0.12, zs + 0.08], [W / 2 + 0.05, Hh - 0.12, zs + 0.08], 0.016, 'chrome'), ...barbell(1.42, zs + 0.06, 2.0));
  return p;
}
function cableStation() {
  const p = [B(0.7, 0.06, 0.12, 0, 0, -0.75), B(0.12, 0.06, 1.5, 0, 0, -0.05), B(0.6, 0.06, 0.1, 0, 0, 0.66), B(0.68, 0.08, 0.08, 0, 2.0, -0.75), B(0.08, 0.08, 1.04, 0, 1.96, -0.23),
    wheelX(0.05, 0.03, 0, 1.9, 0.25, 'black'), rod([0, 1.86, 0.27], [0, 1.45, 0.27], 0.003, 'black'), rod([-0.5, 1.45, 0.27], [0.5, 1.45, 0.27], 0.013, 'chrome'),
    rod([-0.5, 1.45, 0.27], [-0.36, 1.45, 0.27], 0.02, 'rubber'), rod([0.36, 1.45, 0.27], [0.5, 1.45, 0.27], 0.02, 'rubber'), rod([0, 0.47, -0.75], [0, 1.95, -0.75], 0.004, 'black'),
    B(0.06, 0.45, 0.06, 0, 0.06, 0.32), B(0.36, 0.08, 0.34, 0, 0.5, 0.32, 'black'), B(0.05, 0.2, 0.05, 0, 0.55, 0.16), wheelX(0.06, 0.24, -0.14, 0.76, 0.16, 'black'), wheelX(0.06, 0.24, 0.14, 0.76, 0.16, 'black'),
    bar([0, 0.5, 0.48], [0, 0.18, 0.6], 0.05, 0.05), wheelX(0.055, 0.32, 0, 0.18, 0.62, 'black')];
  [-1, 1].forEach((s) => p.push(B(0.08, 2.0, 0.08, s * 0.3, 0.06, -0.75), rod([s * 0.11, 0.08, -0.75], [s * 0.11, 1.8, -0.75], 0.01, 'chrome')));
  range(14).forEach((i) => p.push(B(0.3, 0.022, 0.12, 0, 0.1 + i * 0.026, -0.75, 'iron')));
  return p;
}
function dumbbellRack() {
  const p = [];
  [-1, 1].forEach((s) => p.push(bar([s * 0.62, 0.02, 0.24], [s * 0.62, 0.8, 0.02], 0.05, 0.05), bar([s * 0.62, 0.02, -0.24], [s * 0.62, 0.8, -0.02], 0.05, 0.05)));
  p.push(B(1.24, 0.03, 0.3, 0, 0.42, 0.1), B(1.24, 0.03, 0.26, 0, 0.75, -0.06));
  [[0.45, 0.1, 0.06], [0.78, -0.06, 0.042]].forEach(([y, z, r0], tier) => range(5).forEach((i) => {
    const x = -0.48 + i * 0.24, r = r0 + i * 0.006;
    p.push(rod([x, y + r, z - 0.09], [x, y + r, z + 0.09], 0.016, 'chrome'), discZ(r, 0.055, x, y + r, z - 0.115 + (tier ? 0.01 : 0), 'rubber', 6), discZ(r, 0.055, x, y + r, z + 0.115 - (tier ? 0.01 : 0), 'rubber', 6));
  }));
  return p;
}
function punchingBag() {
  const p = [C(0.18, 1.0, 0, 0.45, 0, 'f', 0.18, 24), C(0.182, 0.03, 0, 1.43, 0, 'black', 0.182, 24), C(0.182, 0.03, 0, 0.44, 0, 'black', 0.182, 24), C(0.182, 0.06, 0, 0.9, 0, 'black', 0.182, 24)];
  range(4).forEach((k) => { const a = k * H + PI / 4; p.push(rod([0.14 * Math.sin(a), 1.46, 0.14 * Math.cos(a)], [0, 1.95, 0], 0.005, 'chrome')); });
  p.push(S(0.025, 0, 1.92, 0, 'chrome'), rod([0, 1.96, 0], [0, 2.4, 0], 0.008, 'chrome'), C(0.05, 0.02, 0, 2.4, 0, 'chrome'));
  return p;
}
function kettlebell(r, x, z) {
  return [S(r, x, 0, z, 'f', 1, 0.95, 1), rod([x - r * 0.55, r * 1.55, z], [x - r * 0.5, r * 2.3, z], r * 0.18, 'f'), rod([x + r * 0.55, r * 1.55, z], [x + r * 0.5, r * 2.3, z], r * 0.18, 'f'),
    rod([x - r * 0.5, r * 2.3, z], [x + r * 0.5, r * 2.3, z], r * 0.18, 'f')];
}
/** a wall mirror w x h with LED light behind it (it shows round its edge and lights the wall), m: the LED's material (the lamp or a zone);
 *  its bottom edge on y = 0, the back on the wall */
const ledMirror = (w, h, m = 'glow') => [B(w + 0.03, h + 0.03, 0.006, 0, 0, -0.012, m), B(w - 0.1, h - 0.1, 0.014, 0, 0.065, -0.005, 'black'), B(w, h, 0.006, 0, 0.015, 0.011, 'mirror')];
/** a big mirror with two LED zones: the light behind it (zone 0) and two frosted light bands in front, left and right (zone 1) */
const twoZoneMirror = (w, h, band = 0.06, inset = 0.1) => [...ledMirror(w, h, 'z0'), B(band, h - 0.16, 0.002, -(w / 2 - inset), 0.095, 0.0155, 'z1'),
  B(band, h - 0.16, 0.002, w / 2 - inset, 0.095, 0.0155, 'z1')];

/* ---------- the bar ---------- */
/** bottles standing in a row from x0 to x1 on y at z, colours and sizes always the same for a seed */
function bottles(x0, x1, y, z, seed, step = 0.09) {
  const rnd = rand(seed), p = [];
  for (let x = x0; x <= x1 + 1e-6; x += step) {
    const r = 0.03 + rnd() * 0.012, h = 0.17 + rnd() * 0.08, m = `bottle${1 + Math.floor(rnd() * 5)}`;
    p.push(C(r, h, x, y, z, m, r, 12), C(r * 0.35, 0.08, x, y + h, z, m, r * 0.7, 8));
  }
  return p;
}
/** a straight bar counter `len` long: the body in the finish, a stainless work top behind, the raised guest counter in front with LED along
 *  and under its edge (zone 0) and LED at the plinth that lights the floor (zone 1), a foot rail */
function barCounter(len = 2.4) {
  const p = [B(len - 0.04, 0.08, 0.6, 0, 0, -0.15, 'black'), B(len, 0.8, 0.66, 0, 0.08, -0.15), B(len + 0.02, 0.03, 0.66, 0, 0.88, -0.15, 'steel'),
    B(len, 0.18, 0.06, 0, 0.88, 0.15), B(len + 0.1, 0.04, 0.34, 0, 1.06, 0.2, 'bartop'), B(len, 0.01, 0.015, 0, 1.048, 0.35, 'z0'), B(len + 0.1, 0.012, 0.004, 0, 1.074, 0.372, 'z0'),
    B(len - 0.04, 0.012, 0.015, 0, 0.068, 0.17, 'z1'), B(len - 0.04, 0.002, 0.08, 0, 0.003, 0.22, 'z1'),
    rod([-len / 2 + 0.05, 0.2, 0.3], [len / 2 - 0.05, 0.2, 0.3], 0.025, 'chrome')];
  range(Math.floor(len / 0.4) - 1).forEach((i) => p.push(vline(0.78, -len / 2 + 0.4 * (i + 1), 0.09, 0.181)));
  [-1, 1].forEach((s) => p.push(rod([s * (len / 2 - 0.25), 0.2, 0.181], [s * (len / 2 - 0.25), 0.2, 0.3], 0.012, 'chrome')));
  p.push(...bottles(-0.6, -0.3, 0.91, -0.35, 5), C(0.035, 0.1, 0.3, 0.91, -0.3, 'glass', 0.03, 12), C(0.035, 0.1, 0.4, 0.91, -0.3, 'glass', 0.03, 12));
  return p;
}
/* what hangs from the ceiling over a bar counter (the variants of bar_counter and bar_corner): it follows the counter, straight or round
 * the corner, and lies inside its footprint (the plan and the wall stop stay as they are); its light is the LED zone 'ceiling' (z2) */
/** the ways to build it, the first is the default: nothing, a glass rack with the glasses hanging upside down and LED under its board, a
 *  floating ceiling panel with light on top and downlights under it, pendant lamps on a ceiling track */
export const BAR_CEILINGS = ['none', 'rack', 'canopy', 'pendants'];
/** the ceiling it hangs from: the usual room height (the default wall height) */
export const BAR_CEIL = 2.6;
/** the LED zones of a bar counter: the counter edge and the plinth, with a ceiling part its light too */
const barLeds = (v) => (v && v !== 'none' ? ['counter', 'floor', 'ceiling'] : ['counter', 'floor']);
/** where the ceiling part goes over a counter: boards [cx, cz, w, d] joined without overlapping, their outline (corners in order), the track of
 *  the pendant lamps (a line through the middle) and the lamps on it */
const OVER_BAR = { boards: [[0, -0.05, 2.0, 0.5]], outline: [[-1, -0.3], [1, -0.3], [1, 0.2], [-1, 0.2]], track: [[-1, -0.05], [1, -0.05]], lamps: [[-0.7, -0.05], [0, -0.05], [0.7, -0.05]] };
const OVER_CORNER = { boards: [[0.1, -0.05, 2.2, 0.5], [0.95, -0.9, 0.5, 1.2]], outline: [[-1, -0.3], [0.7, -0.3], [0.7, -1.5], [1.2, -1.5], [1.2, 0.2], [-1, 0.2]],
  track: [[-1, -0.05], [0.95, -0.05], [0.95, -1.45]], lamps: [[-0.7, -0.05], [0.15, -0.05], [0.95, -0.05], [0.95, -0.75], [0.95, -1.4]] };
/** is (x, z) inside the outline */
function inside(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
/** a box along every edge of the outline, `inset` metres inside it: h high from y, t thick, in m */
const edges = (poly, inset, y, h, t, m, cut = 0) => poly.map((a, i) => {
  const b = poly[(i + 1) % poly.length], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, alongX = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
  const len = Math.abs(alongX ? b[0] - a[0] : b[1] - a[1]) - cut, s = inside(poly, mx + (alongX ? 0 : 0.01), mz + (alongX ? 0.01 : 0)) ? 1 : -1;
  return alongX ? B(len, h, t, mx, y, mz + s * (inset + t / 2), m) : B(t, h, len, mx + s * (inset + t / 2), y, mz, m);
});
/** where it hangs from the ceiling: near every corner of the outline, inside it */
const hangers = (poly, k = 0.06) => poly.map(([x, z]) => [[k, k], [-k, k], [k, -k], [-k, -k]].map(([dx, dz]) => [x + dx, z + dz]).find(([x2, z2]) => inside(poly, x2, z2)));
/** a rod or cable from y up to the ceiling with a small plate there */
const toCeiling = ([x, z], y, r, m) => [rod([x, y, z], [x, BAR_CEIL - 0.012, z], r, m), C(0.035, 0.012, x, BAR_CEIL - 0.012, z, m, 0.035, 16)];
/** a wine glass hanging upside down from a rail at y: its foot, the stem, the bowl open to the floor */
const hangingGlass = (x, y, z) => [C(0.032, 0.004, x, y - 0.004, z, 'glass', 0.032, 12), C(0.004, 0.07, x, y - 0.074, z, 'glass', 0.004, 6), C(0.022, 0.13, x, y - 0.204, z, 'glass', 0.04, 14)];
/** the ceiling part v (BAR_CEILINGS) over a counter, placed by `o` (OVER_BAR, OVER_CORNER) */
function barCeiling(v, o) {
  const p = [];
  if (v === 'rack') {                                    // a board in the finish on a steel frame, two rails of glasses under it along its long side, LED along its edges
    const y = 2.15;
    o.boards.forEach(([cx, cz, w, d]) => {
      p.push(B(w, 0.03, d, cx, y, cz));
      const alongX = w >= d, L = alongX ? w : d, D = alongX ? d : w;
      [-D / 4, D / 4].forEach((v2) => {
        p.push(alongX ? B(L - 0.04, 0.01, 0.025, cx, y - 0.035, cz + v2, 'chrome') : B(0.025, 0.01, L - 0.04, cx + v2, y - 0.035, cz, 'chrome'));
        for (let u = -L / 2 + 0.07; u <= L / 2 - 0.07 + 1e-6; u += 0.14) p.push(...hangingGlass(alongX ? cx + u : cx + v2, y - 0.035, alongX ? cz + v2 : cz + u));
      });
    });
    p.push(...edges(o.outline, 0, y - 0.05, 0.05, 0.02, 'iron'), ...edges(o.outline, 0.04, y - 0.009, 0.008, 0.012, 'z2', 0.1));
    hangers(o.outline).forEach((q) => p.push(...toCeiling(q, y + 0.03, 0.006, 'chrome')));
  } else if (v === 'canopy') {                           // a floating panel in the finish on four (six) cables, light all round on top and downlights under it
    const y = 2.3;
    o.boards.forEach(([cx, cz, w, d]) => p.push(B(w, 0.05, d, cx, y, cz)));
    p.push(...edges(o.outline, 0.05, y + 0.05, 0.012, 0.02, 'z2', 0.1));
    o.lamps.forEach(([x, z]) => p.push(C(0.035, 0.004, x, y - 0.004, z, 'z2', 0.035, 16)));
    hangers(o.outline, 0.08).forEach((q) => p.push(...toCeiling(q, y + 0.05, 0.002, 'iron')));
  } else if (v === 'pendants') {                         // a black track on the ceiling, a pendant lamp on a cable from it at every lamp
    for (let i = 1; i < o.track.length; i++) {
      const [a, b] = [o.track[i - 1], o.track[i]], alongX = a[1] === b[1];
      p.push(alongX ? B(Math.abs(b[0] - a[0]) + 0.04, 0.03, 0.04, (a[0] + b[0]) / 2, BAR_CEIL - 0.03, a[1], 'black') : B(0.04, 0.03, Math.abs(b[1] - a[1]) + 0.04, a[0], BAR_CEIL - 0.03, (a[1] + b[1]) / 2, 'black'));
    }
    o.lamps.forEach(([x, z]) => p.push(rod([x, 2.01, z], [x, BAR_CEIL - 0.03, z], 0.003, 'black'), C(0.035, 0.16, x, 1.85, z, 'iron', 0.13, 24),
      C(0.12, 0.004, x, 1.848, z, 'z2', 0.12, 20), S(0.03, x, 1.87, z, 'z2')));
  }
  return p;
}
/** a bar counter round the corner: the long run of 2.4 m and a return of 1.2 m to the back on the right, LED like the straight one */
function barCorner() {
  const p = [B(2.36, 0.08, 0.6, 0, 0, -0.15, 'black'), B(0.6, 0.08, 1.22, 0.87, 0, -1.09, 'black'), B(2.4, 0.8, 0.66, 0, 0.08, -0.15), B(0.66, 0.8, 1.22, 0.87, 0.08, -1.09),
    B(2.42, 0.03, 0.66, 0, 0.88, -0.15, 'steel'), B(0.67, 0.03, 1.22, 0.875, 0.88, -1.09, 'steel'), B(2.4, 0.18, 0.06, 0, 0.88, 0.15), B(0.06, 0.18, 1.82, 1.17, 0.88, -0.79),
    B(2.62, 0.04, 0.34, 0.06, 1.06, 0.2, 'bartop'), B(0.34, 0.04, 1.78, 1.2, 1.06, -0.86, 'bartop'),
    B(2.4, 0.01, 0.015, 0.06, 1.048, 0.35, 'z0'), B(0.015, 0.01, 1.7, 1.35, 1.048, -0.86, 'z0'), B(2.62, 0.012, 0.004, 0.06, 1.074, 0.372, 'z0'), B(0.004, 0.012, 2.12, 1.372, 1.074, -0.69, 'z0'),
    B(2.36, 0.012, 0.015, 0, 0.068, 0.17, 'z1'), B(0.015, 0.012, 1.2, 1.19, 0.068, -1.09, 'z1'), B(2.36, 0.002, 0.08, 0, 0.003, 0.22, 'z1'), B(0.08, 0.002, 1.28, 1.24, 0.003, -1.05, 'z1'),
    rod([-1.15, 0.2, 0.3], [1.32, 0.2, 0.3], 0.025, 'chrome'), rod([1.32, 0.2, 0.3], [1.32, 0.2, -1.6], 0.025, 'chrome'),
    ...[-0.8, -0.4, 0, 0.4, 0.8].map((x) => vline(0.78, x, 0.09, 0.181)), ...[-0.5, -1.0, -1.5].map((z) => B(0.004, 0.78, 0.004, 1.201, 0.09, z, 'line')),
    ...bottles(-0.7, -0.4, 0.91, -0.35, 9)];
  return p;
}
/** the back bar: a cabinet with doors, a mirror behind glass shelves full of bottles, LED under the top and every shelf */
function backBar() {
  const W = 2.0, D = 0.45, sd = 0.28, zc = -D / 2 + sd / 2, p = [B(W - 0.04, 0.08, D - 0.05, 0, 0, -0.02, 'black'), B(W, 0.82, D, 0, 0.08), B(W + 0.02, 0.03, D + 0.02, 0, 0.9, 0, 'bartop'),
    ...[-0.5, 0, 0.5].map((x) => vline(0.8, x, 0.09, D / 2 + 0.001)), ...[-0.55, -0.45, 0.45, 0.55].map((x) => B(0.012, 0.18, 0.02, x, 0.62, D / 2 + 0.01, 'chrome')),
    B(0.03, 1.2, sd, -W / 2 + 0.015, 0.93, zc), B(0.03, 1.2, sd, W / 2 - 0.015, 0.93, zc), B(W, 0.06, sd + 0.02, 0, 2.13, zc + 0.01), B(W - 0.06, 1.2, 0.01, 0, 0.93, -D / 2 + 0.005, 'mirror'),
    B(W - 0.1, 0.008, 0.015, 0, 2.12, zc + sd / 2 - 0.03, 'glow'), B(W - 0.1, 0.008, 0.01, 0, 0.93, -D / 2 + 0.02, 'glow'), ...bottles(-0.85, 0.85, 0.93, -D / 2 + 0.08, 3, 0.1)];
  [1.3, 1.65].forEach((y, i) => p.push(B(W - 0.06, 0.012, sd - 0.03, 0, y, zc + 0.01, 'glass'), B(W - 0.1, 0.006, 0.012, 0, y - 0.007, zc + sd / 2 - 0.03, 'glow'), ...bottles(-0.85, 0.85, y + 0.012, zc, 11 + i * 7, 0.1)));
  p.push(...[-0.2, -0.1, 0, 0.1].map((x) => C(0.035, 0.1, x, 0.93, 0.12, 'glass', 0.03, 12)));
  return p;
}
function barStoolBack() {
  const p = [C(0.22, 0.025, 0, 0, 0, 'chrome', 0.23, 28), C(0.03, 0.66, 0, 0.025, 0, 'chrome', 0.03, 12), C(0.2, 0.075, 0, 0.7, 0, 'f', 0.19, 24),
    rod([0, 0.3, 0.2], [0, 0.3, 0], 0.008, 'chrome'), rod([-0.12, 0.76, -0.15], [-0.12, 0.95, -0.2], 0.01, 'chrome'), rod([0.12, 0.76, -0.15], [0.12, 0.95, -0.2], 0.01, 'chrome'),
    tilted(0.38, 0.2, 0.05, 0, 1.0, -0.21, -0.15)];
  range(10).forEach((k) => { const a = (k * 2 * PI) / 10, b = ((k + 1) * 2 * PI) / 10; p.push(rod([0.2 * Math.sin(a), 0.3, 0.2 * Math.cos(a)], [0.2 * Math.sin(b), 0.3, 0.2 * Math.cos(b)], 0.009, 'chrome')); });
  return p;
}
/** a fridge with a glass door, lit inside: wine bottles lying on wooden shelves, or bottles standing on wire shelves */
function glassFridge(W, Hh, D, wine) {
  const t = 0.03, zf = D / 2 - 0.02, p = [B(t, Hh, D - 0.04, -W / 2 + t / 2, 0, -0.02), B(t, Hh, D - 0.04, W / 2 - t / 2, 0, -0.02), B(W - 2 * t, 0.1, D - 0.04, 0, 0, -0.02),
    B(W - 2 * t, t, D - 0.04, 0, Hh - t, -0.02), B(W - 2 * t, Hh - 0.1 - t, t, 0, 0.1, -D / 2 + t / 2, 'black'),
    B(W, 0.05, 0.03, 0, 0.1, zf), B(W, 0.05, 0.03, 0, Hh - 0.05, zf), B(0.05, Hh - 0.2, 0.03, -W / 2 + 0.025, 0.15, zf), B(0.05, Hh - 0.2, 0.03, W / 2 - 0.025, 0.15, zf),
    B(W - 0.1, Hh - 0.2, 0.008, 0, 0.15, zf, 'smoke'), B(0.02, Math.min(0.6, Hh * 0.5), 0.03, W / 2 - 0.07, Hh * 0.35, zf + 0.03, 'chrome'),
    B(W - 0.12, 0.012, 0.012, 0, Hh - t - 0.015, zf - 0.04, 'glow'), B(0.012, Hh - 0.25, 0.012, -W / 2 + t + 0.01, 0.12, zf - 0.04, 'glow')];
  if (wine) {
    const rows = Math.floor((Hh - 0.2) / 0.19);
    range(rows).forEach((j) => {
      const y = 0.13 + j * 0.19;
      p.push(B(W - 2 * t, 0.015, D - 0.12, 0, y, -0.04, 'birch'));
      range(4).forEach((i) => { const x = -W / 2 + 0.11 + i * ((W - 0.22) / 3), cy = y + 0.052; p.push({ ...discZ(0.037, 0.22, x, cy, -0.07, 'bottle1', 12) }, discZ(0.013, 0.08, x, cy, 0.08, 'bottle1', 8)); });
    });
  } else {
    [0.12, 0.45].forEach((y, j) => p.push(B(W - 2 * t, 0.01, D - 0.12, 0, y, -0.04, 'steel'), ...bottles(-W / 2 + 0.09, W / 2 - 0.09, y + 0.01, -0.04, 21 + j, 0.085)));
  }
  return p;
}
function beerTap() {
  return [B(0.42, 0.025, 0.16, 0, 0, 0.06, 'chrome'), B(0.38, 0.004, 0.12, 0, 0.025, 0.06, 'line'), C(0.04, 0.42, 0, 0, -0.06, 'chrome', 0.05, 20),
    rod([-0.16, 0.38, -0.06], [0.16, 0.38, -0.06], 0.03, 'chrome'), discZ(0.065, 0.012, 0, 0.25, -0.012, 'glow', 28),
    ...[-0.12, 0.12].flatMap((x) => [rod([x, 0.38, -0.06], [x, 0.29, 0.03], 0.012, 'chrome'), tilted(0.035, 0.17, 0.035, x, 0.48, -0.06, -0.2, 'black')])];
}
/** a neon sign on clear acrylic: a cocktail glass with an olive on a pick */
function neonSign() {
  const L = (a, b) => rod([a[0], a[1], 0.006], [b[0], b[1], 0.006], 0.007, 'neon', 8), p = [B(0.6, 0.62, 0.008, 0, 0, -0.008, 'glass')];
  p.push(L([-0.2, 0.52], [0.2, 0.52]), L([-0.2, 0.52], [0, 0.28]), L([0.2, 0.52], [0, 0.28]), L([0, 0.28], [0, 0.1]), L([-0.1, 0.09], [0.1, 0.09]), L([-0.02, 0.38], [0.16, 0.58]));
  range(8).forEach((k) => { const a = (k * 2 * PI) / 8, b = ((k + 1) * 2 * PI) / 8; p.push(L([0.035 + 0.035 * Math.cos(a), 0.43 + 0.035 * Math.sin(a)], [0.035 + 0.035 * Math.cos(b), 0.43 + 0.035 * Math.sin(b)])); });
  return p;
}
function dartboard() {
  const cy = 0.3, p = [discZ(0.3, 0.025, 0, cy, -0.02, 'dark', 40), discZ(0.225, 0.04, 0, cy, 0.0125, 'cork', 40), discZ(0.17, 0.003, 0, cy, 0.034, 'dartred', 40),
    discZ(0.162, 0.003, 0, cy, 0.035, 'dark', 40), discZ(0.107, 0.003, 0, cy, 0.036, 'dartgreen', 40), discZ(0.099, 0.003, 0, cy, 0.037, 'cream', 40),
    discZ(0.016, 0.003, 0, cy, 0.038, 'dartgreen', 20), discZ(0.0064, 0.003, 0, cy, 0.039, 'dartred', 16)];
  range(20).forEach((k) => { const a = (k + 0.5) * (2 * PI) / 20; p.push(rod([0.016 * Math.cos(a), cy + 0.016 * Math.sin(a), 0.039], [0.17 * Math.cos(a), cy + 0.17 * Math.sin(a), 0.039], 0.0012, 'chrome', 4)); });
  [[0.03, 0.06], [-0.05, -0.02]].forEach(([dx, dy]) => p.push(rod([dx, cy + dy, 0.04], [dx + 0.02, cy + dy + 0.02, 0.15], 0.004, 'chrome', 6), B(0.03, 0.03, 0.002, dx + 0.022, cy + dy + 0.006, 0.15, 'red')));
  return p;
}
function poolTable() {
  const L = 2.5, W = 1.4, p = [B(L - 0.2, 0.2, W - 0.2, 0, 0.53, 0), B(L - 0.26, 0.03, W - 0.26, 0, 0.72, 0, 'felt')];
  [-1, 1].forEach((i) => [-1, 1].forEach((k) => p.push(B(0.16, 0.53, 0.16, i * (L / 2 - 0.25), 0, k * (W / 2 - 0.22), 'f2'))));
  [-1, 1].forEach((k) => p.push(B(L, 0.06, 0.13, 0, 0.73, k * (W / 2 - 0.065)), B(0.13, 0.06, W - 0.26, k * (L / 2 - 0.065), 0.73, 0),
    B(L - 0.36, 0.035, 0.04, 0, 0.75, k * (W / 2 - 0.15), 'felt'), B(0.04, 0.035, W - 0.4, k * (L / 2 - 0.15), 0.75, 0, 'felt')));
  [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]].forEach(([i, k]) => p.push(C(0.06, 0.012, i * (L / 2 - 0.13), 0.79, k * (W / 2 - (i ? 0.13 : 0.1)), 'black', 0.06, 16)));
  [[0.5, 0, 'poolY'], [0.55, -0.03, 'poolB'], [0.55, 0.03, 'poolR'], [0.6, -0.06, 'poolO'], [0.6, 0, 'poolK'], [0.6, 0.06, 'dartgreen'], [-0.6, 0.1, 'white']]
    .forEach(([x, z, m]) => p.push(S(0.0285, x, 0.75, z, m)));
  p.push(rod([-1.1, 0.8, 0.25], [0.2, 0.79, 0.35], 0.01, 'wood'));
  return p;
}
function poolLamp() {
  const p = [B(1.5, 0.05, 0.1, 0, 0.18, 0), rod([-0.6, 0.23, 0], [-0.6, 0.7, 0], 0.003, 'black'), rod([0.6, 0.23, 0], [0.6, 0.7, 0], 0.003, 'black'),
    C(0.05, 0.02, -0.6, 0.7, 0, 'black', 0.05, 16), C(0.05, 0.02, 0.6, 0.7, 0, 'black', 0.05, 16)];
  [-0.5, 0, 0.5].forEach((x) => p.push(C(0.07, 0.16, x, 0.02, 0, 'f', 0.21, 24), C(0.2, 0.006, x, 0.014, 0, 'glow', 0.2, 24)));
  return p;
}
function kicker() {
  const p = [B(1.18, 0.02, 0.64, 0, 0.72, 0, 'felt'), B(1.22, 0.1, 0.7, 0, 0.62, 0), B(1.22, 0.3, 0.03, 0, 0.62, -0.335), B(1.22, 0.3, 0.03, 0, 0.62, 0.335),
    B(0.03, 0.3, 0.64, -0.595, 0.62, 0), B(0.03, 0.3, 0.64, 0.595, 0.62, 0), B(0.012, 0.07, 0.2, -0.575, 0.74, 0, 'black'), B(0.012, 0.07, 0.2, 0.575, 0.74, 0, 'black')];
  [-1, 1].forEach((i) => [-1, 1].forEach((k) => p.push(B(0.08, 0.62, 0.08, i * 0.55, 0, k * 0.27))));
  const teams = ['teamred', 'teamred', 'teamblue', 'teamred', 'teamblue', 'teamred', 'teamblue', 'teamblue'], count = [1, 2, 3, 5, 5, 3, 2, 1];
  range(8).forEach((i) => {
    const x = -0.525 + i * 0.15, side = teams[i] === 'teamred' ? 1 : -1, n = count[i], gap = n === 2 ? 0.24 : n === 3 ? 0.2 : 0.12;
    p.push(rod([x, 0.85, -0.6], [x, 0.85, 0.6], 0.007, 'chrome'), rod([x, 0.85, side * 0.47], [x, 0.85, side * 0.62], 0.018, 'black'));
    range(n).forEach((j) => p.push(B(0.035, 0.13, 0.03, x, 0.75, (j - (n - 1) / 2) * gap, teams[i])));
  });
  return p;
}

/* ---------- the home cinema ---------- */
function cinemaSeats(n) {
  const sw = 0.6, aw = 0.15, D = 0.95, W = n * sw + (n + 1) * aw, p = [B(W - 0.1, 0.04, D - 0.15, 0, 0, 0, 'black'), B(W - 0.2, 0.01, 0.012, 0, 0.015, D / 2 - 0.07, 'glow')];
  for (let i = 0; i <= n; i++) {
    const x = -W / 2 + aw / 2 + i * (sw + aw);
    p.push(B(aw, 0.58, D - 0.05, x, 0.04, 0.02), C(0.045, 0.004, x, 0.62, 0.27, 'glow', 0.045, 16), C(0.038, 0.004, x, 0.6205, 0.27, 'black', 0.038, 16));
  }
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + aw + sw / 2 + i * (sw + aw);
    p.push(B(sw, 0.25, D - 0.1, x, 0.04, 0.02, 'f2'), B(sw - 0.02, 0.16, 0.62, x, 0.29, 0.12), tilted(sw - 0.02, 0.74, 0.22, x, 0.72, -0.33, -0.18),
      tilted(sw - 0.12, 0.16, 0.08, x, 0.95, -0.37, -0.18, 'f', 0.15), B(sw - 0.04, 0.28, 0.05, x, 0.08, D / 2 - 0.03, 'f2'));
  }
  return p;
}
function popcorn() {
  return [B(0.5, 0.75, 0.38, 0, 0.1, 0, 'red'), wheelX(0.12, 0.04, -0.27, 0.12, 0.05, 'black'), wheelX(0.12, 0.04, 0.27, 0.12, 0.05, 'black'), B(0.06, 0.1, 0.06, -0.18, 0, -0.14, 'black'),
    B(0.06, 0.1, 0.06, 0.18, 0, -0.14, 'black'), B(0.52, 0.03, 0.4, 0, 0.85, 0, 'chrome'), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => B(0.025, 0.48, 0.025, i * 0.24, 0.88, k * 0.18, 'red')),
    B(0.47, 0.46, 0.35, 0, 0.88, 0, 'glass'), B(0.44, 0.12, 0.32, 0, 0.88, 0, 'popcorn'), S(0.13, -0.08, 0.93, 0.02, 'popcorn', 1.3, 0.6, 1), C(0.09, 0.1, 0, 1.18, 0, 'chrome', 0.07, 20),
    rod([0, 1.28, 0], [0, 1.36, 0], 0.01, 'chrome'), B(0.56, 0.06, 0.42, 0, 1.36, 0, 'red'), tilted(0.52, 0.12, 0.3, 0, 1.47, 0, 0, 'red'), B(0.4, 0.01, 0.06, 0, 1.345, 0.12, 'glow'),
    rod([-0.2, 0.92, -0.24], [0.2, 0.92, -0.24], 0.012, 'chrome'), rod([-0.2, 0.92, -0.24], [-0.2, 0.86, -0.18], 0.01, 'chrome'), rod([0.2, 0.92, -0.24], [0.2, 0.86, -0.18], 0.01, 'chrome')];
}
/** a floor-standing speaker on a plinth with spikes: tweeter and two woofers in front */
function floorSpeaker() {
  return [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.012, 0.02, i * 0.11, 0, k * 0.14, 'chrome', 0.003, 8)), B(0.28, 0.03, 0.36, 0, 0.02, 0, 'black'),
    B(0.22, 1.0, 0.32, 0, 0.05, 0), discZ(0.035, 0.01, 0, 0.93, 0.165, 'black'), discZ(0.015, 0.006, 0, 0.93, 0.172, 'chrome'),
    ...[0.73, 0.5].flatMap((y) => [discZ(0.075, 0.012, 0, y, 0.166, 'black'), discZ(0.06, 0.006, 0, y, 0.173, 'rubber'), discZ(0.022, 0.006, 0, y, 0.176, 'chrome')])];
}
function subwoofer() {
  return [B(0.38, 0.4, 0.4, 0, 0.03, 0), discZ(0.155, 0.015, 0, 0.23, 0.2075, 'black', 28), discZ(0.12, 0.006, 0, 0.23, 0.215, 'rubber', 28), discZ(0.04, 0.008, 0, 0.23, 0.218, 'chrome'),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.025, 0.03, i * 0.15, 0, k * 0.15, 'black', 0.025, 12)), B(0.06, 0.015, 0.004, 0.13, 0.06, 0.202, 'display')];
}
function slatPanel() {
  return [B(0.6, 1.2, 0.012, 0, 0, -0.012, 'black'), ...range(13).map((i) => B(0.027, 1.2, 0.02, -0.276 + i * 0.046, 0, 0.004))];
}
function starSky() {
  const rnd = rand(77), p = [B(2.0, 0.02, 2.0, 0, 0.004, 0, 'night')];
  range(70).forEach((i) => p.push(C(0.004 + rnd() * 0.005, 0.004, -0.96 + rnd() * 1.92, i % 2 ? 0.023 : 0, -0.96 + rnd() * 1.92, 'stars', 0.004 + 0.002, 6)));
  return p;
}

/* ---------- PC corner ---------- */
/** a PC tower (22 x 48 x 46 cm): closed with its power button, or a gaming PC with a glass side, RGB fans and lit parts inside */
function pcTower(gaming) {
  const W = 0.22, Hh = 0.48, D = 0.46, feet = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => B(0.03, 0.02, 0.05, i * 0.08, 0, k * 0.19, 'black'));
  if (!gaming) {
    return [...feet, B(W, Hh, D, 0, 0.02, 0), B(W - 0.04, 0.12, 0.004, 0, 0.32, D / 2 + 0.002, 'f2'), discZ(0.012, 0.006, 0, 0.45, D / 2 + 0.003, 'glow', 16),
      B(0.05, 0.012, 0.004, -0.05, 0.42, D / 2 + 0.002, 'black'), ...range(4).map((i) => hline(W - 0.06, 0, 0.08 + i * 0.03, D / 2 + 0.001))];
  }
  const p = [...feet, B(0.01, Hh, D, W / 2 - 0.005, 0.02, 0), B(W - 0.01, 0.01, D, -0.005, 0.02 + Hh - 0.01, 0), B(W - 0.01, 0.04, D, -0.005, 0.02, 0), B(W - 0.01, Hh - 0.05, 0.01, -0.005, 0.06, -D / 2 + 0.005),
    B(W, Hh, 0.02, 0, 0.02, D / 2 - 0.01, 'black'), B(0.005, Hh - 0.03, D - 0.03, -W / 2 + 0.0025, 0.035, 0, 'glass'),
    B(W - 0.03, 0.1, D - 0.04, 0, 0.06, 0, 'black'), B(0.004, 0.3, 0.3, W / 2 - 0.012, 0.17, -0.04, 'pcb'), B(0.13, 0.045, 0.3, 0.02, 0.2, 0.0, 'black'), B(0.004, 0.008, 0.25, -0.047, 0.225, 0.0, 'rgb'),
    wheelX(0.035, 0.03, 0.08, 0.38, -0.06, 'rgb', 20), ...range(4).map((i) => B(0.004, 0.035, 0.13, 0.04 + i * 0.012, 0.36, 0.06, 'rgb')),
    B(0.004, 0.006, D - 0.06, -0.09, Hh - 0.005, 0, 'rgb')];
  [0.13, 0.27, 0.41].forEach((y) => p.push(discZ(0.06, 0.004, 0, y + 0.02, D / 2 + 0.002, 'rgb', 20), discZ(0.048, 0.004, 0, y + 0.02, D / 2 + 0.004, 'black', 20), discZ(0.015, 0.004, 0, y + 0.02, D / 2 + 0.006, 'rgb', 12)));
  return p;
}
/** a monitor (0.62 wide, 27 inch) on its stand, its screen at y over the desk at 0.75, turned by a, standing at (x, z) */
/** the screen of a 27-inch monitor (0.62 x 0.37) without a stand, its bottom at y0, turned by a, its middle at (x, z) */
const panel27 = (x, y0, z, a) => at(turnAll([B(0.62, 0.37, 0.025, 0, y0, 0, 'black'), B(0.6, 0.345, 0.004, 0, y0 + 0.012, 0.0145, 'display')], a), x, 0, z);
/** a 27-inch monitor on its stand on the desk (0.75) */
const monitor = (x, z, a) => [...panel27(x, 0.92, z, a), ...at(turnAll([B(0.05, 0.18, 0.03, 0, 0.75, -0.035, 'iron'), B(0.22, 0.012, 0.18, 0, 0.75, -0.03, 'iron')], a), x, 0, z)];
/** a 24-inch monitor turned upright (portrait: 0.34 wide, 0.56 high) on its stand */
const portrait = (x, z, a) => at(turnAll([B(0.34, 0.56, 0.025, 0, 0.86, 0, 'black'), B(0.32, 0.54, 0.004, 0, 0.87, 0.0145, 'display'), B(0.05, 0.13, 0.03, 0, 0.75, -0.035, 'iron'),
  B(0.2, 0.012, 0.18, 0, 0.75, -0.03, 'iron')], a), x, 0, z);
/** a curved ultrawide monitor (34 inch: 0.82 wide, curved with a radius of 1.5 m): flat pieces along the curve, the edges come forward */
function curved(x, z, w = 0.82) {
  const R = 1.5, n = 8, sw = 2 * (R - 0.02) * Math.sin(w / R / n / 2), p = [B(0.06, 0.17, 0.04, 0, 0.75, -0.04, 'iron'), B(0.3, 0.012, 0.2, 0, 0.75, -0.04, 'iron')];
  for (let i = 0; i < n; i++) {                                // the screen pieces just touch each other (sw: their width on the curve 2 cm in front), the frame well behind them
    const a = ((i + 0.5) / n - 0.5) * (w / R);
    p.push(...at(turnAll([B(w / n, 0.37, 0.02, 0, 0.9, -0.012, 'black'), B(sw, 0.345, 0.004, 0, 0.912, 0.02, 'display')], -a), R * Math.sin(a), 0, R * (1 - Math.cos(a))));
  }
  return at(p, x, 0, z);
}
/** how the monitors of the PC desk stand (the variants of pc_setup, the first is the default): one, two side by side, three side by side,
 *  four (2 x 2 on a monitor arm), a curved one, a curved one with two upright beside it; the desk is as wide as they need */
export const MONITOR_LAYOUTS = {
  two: { w: 1.6, screens: () => [...monitor(-0.33, -0.17, 0.22), ...monitor(0.33, -0.17, -0.22)] },
  one: { w: 1.4, screens: () => monitor(0, -0.17, 0) },
  three: { w: 1.8, screens: () => [...monitor(0, -0.19, 0), ...monitor(-0.6, -0.055, 0.45), ...monitor(0.6, -0.055, -0.45)] },
  four: { w: 1.6, screens: () => [...[-1, 1].flatMap((s) => [...panel27(s * 0.32, 0.86, -0.17, -s * 0.18), ...panel27(s * 0.32, 1.25, -0.19, -s * 0.18),
    B(0.3, 0.025, 0.025, s * 0.15, 1.04, -0.23, 'iron'), B(0.3, 0.025, 0.025, s * 0.15, 1.43, -0.25, 'iron')]),
    rod([0, 0.75, -0.3], [0, 1.6, -0.3], 0.02, 'iron'), B(0.08, 0.05, 0.12, 0, 0.7, -0.33, 'iron')] },
  curved: { w: 1.6, screens: () => curved(0, -0.2) },
  curved2: { w: 1.8, screens: () => [...curved(0, -0.2), ...portrait(-0.565, -0.065, 0.5), ...portrait(0.565, -0.065, -0.5)] },
};
/** the PC desk: its monitors (layout), keyboard and mouse on a desk mat, the gaming PC under the desk on the right, an RGB strip at the back */
function pcSetup(layout = 'two') {
  const L = MONITOR_LAYOUTS[layout] || MONITOR_LAYOUTS.two, W = L.w, s = W / 2;
  return [B(W, 0.03, 0.8, 0, 0.72), B(0.04, 0.72, 0.7, -s + 0.04, 0, 0, 'f2'), B(0.04, 0.72, 0.7, s - 0.04, 0, 0, 'f2'), B(W - 0.12, 0.35, 0.02, 0, 0.35, -0.33, 'f2'),
    ...L.screens(), B(0.9, 0.003, 0.35, 0.08, 0.75, 0.17, 'rubber'), B(0.44, 0.022, 0.14, -0.05, 0.753, 0.15, 'black'),
    B(0.42, 0.004, 0.12, -0.05, 0.775, 0.15, 'rgb'), B(0.065, 0.035, 0.11, 0.33, 0.753, 0.16, 'black'), B(W - 0.1, 0.008, 0.01, 0, 0.71, -0.385, 'rgb'), ...at(pcTower(true), s - 0.3, 0, -0.06)];
}
function laptop() {
  return [B(0.34, 0.016, 0.24, 0, 0, 0), B(0.3, 0.002, 0.11, 0, 0.016, -0.03, 'black'), B(0.1, 0.002, 0.06, 0, 0.016, 0.075, 'f2'),
    tilted(0.34, 0.23, 0.008, 0, 0.126, -0.154, -0.3), tilted(0.31, 0.2, 0.002, 0, 0.126, -0.154, -0.3, 'display', 0.005)];
}
function gamingChair() {
  const p = [C(0.035, 0.06, 0, 0.05, 0, 'black'), C(0.028, 0.32, 0, 0.1, 0, 'chrome', 0.028, 12), B(0.52, 0.1, 0.5, 0, 0.42, 0.02, 'black'), B(0.08, 0.06, 0.48, -0.24, 0.5, 0.02), B(0.08, 0.06, 0.48, 0.24, 0.5, 0.02),
    tilted(0.54, 0.85, 0.09, 0, 0.985, -0.27, -0.12, 'black'), tilted(0.07, 0.62, 0.11, -0.255, 0.95, -0.27, -0.12, 'f', 0.015), tilted(0.07, 0.62, 0.11, 0.255, 0.95, -0.27, -0.12, 'f', 0.015),
    tilted(0.1, 0.62, 0.01, 0, 0.92, -0.27, -0.12, 'f', 0.05), tilted(0.26, 0.12, 0.07, 0, 1.25, -0.302, -0.12, 'black', 0.08), tilted(0.3, 0.13, 0.07, 0, 0.66, -0.23, -0.12, 'f', 0.08)];
  range(5).forEach((k) => { const a = (k * 2 * PI) / 5, x = 0.32 * Math.sin(a), z = 0.32 * Math.cos(a); p.push(bar([0, 0.075, 0], [x, 0.05, z], 0.045, 0.03, 'black'), S(0.028, x, 0, z, 'black')); });
  [-1, 1].forEach((s) => p.push(B(0.03, 0.2, 0.04, s * 0.3, 0.47, -0.02, 'black'), B(0.08, 0.025, 0.26, s * 0.3, 0.67, 0.0, 'black')));
  return p;
}
function serverRack() {
  const W = 0.6, Hh = 1.0, D = 0.6, p = [B(0.02, Hh, D, -W / 2 + 0.01, 0, 0), B(0.02, Hh, D, W / 2 - 0.01, 0, 0), B(W - 0.04, 0.02, D, 0, Hh - 0.02, 0), B(W - 0.04, 0.05, D, 0, 0, 0),
    B(W - 0.04, Hh - 0.07, 0.02, 0, 0.05, -D / 2 + 0.01), B(W - 0.04, Hh - 0.07, 0.006, 0, 0.05, D / 2 - 0.003, 'smoke'), B(0.015, 0.25, 0.02, W / 2 - 0.05, 0.45, D / 2 + 0.008, 'chrome')];
  [[0.08, 0.18, 'iron'], [0.3, 0.09, 'iron'], [0.42, 0.045, 'black'], [0.5, 0.045, 'black'], [0.6, 0.09, 'iron'], [0.75, 0.045, 'black']].forEach(([y, h, m]) => p.push(
    B(0.48, h, D - 0.12, 0, y, 0.0, m), B(0.3, 0.006, 0.002, -0.05, y + h / 2, (D - 0.12) / 2 + 0.002, 'display')));
  return p;
}

/* ---------- mirrors with LED ---------- */
/** a round mirror with LED light behind it */
const roundMirror = (r) => [discZ(r + 0.015, 0.006, 0, r + 0.015, -0.012, 'glow', 48), discZ(r - 0.06, 0.014, 0, r + 0.015, -0.005, 'black', 32), discZ(r, 0.006, 0, r + 0.015, 0.011, 'mirror', 48)];
/** an LED mirror with three zones: the light behind it (zone 0), two frosted light bands in front (zone 1), a light underneath (zone 2) */
function zoneMirror() {
  const w = 1.2, h = 0.8;
  return [...ledMirror(w, h, 'z0').map((q) => ({ ...q, y: q.y + 0.004 })), B(0.06, h - 0.16, 0.002, -(w / 2 - 0.1), 0.099, 0.0155, 'z1'), B(0.06, h - 0.16, 0.002, w / 2 - 0.1, 0.099, 0.0155, 'z1'),
    B(w - 0.2, 0.012, 0.016, 0, 0.006, 0.002, 'z2'), discZ(0.012, 0.002, w / 2 - 0.09, 0.08, 0.0155, 'white', 16)];
}
/** a make-up mirror with bulbs round it (zone 0) and LED behind it (zone 1) */
function hollywoodMirror() {
  const p = [B(0.83, 0.63, 0.006, 0, 0, -0.025, 'z1'), B(0.8, 0.6, 0.03, 0, 0.015, -0.007), B(0.66, 0.46, 0.006, 0, 0.085, 0.011, 'mirror')];
  [-0.3, -0.1, 0.1, 0.3].forEach((x) => p.push(S(0.022, x, 0.555, 0.03, 'z0')));
  [0.16, 0.315, 0.47].forEach((y) => p.push(S(0.022, -0.365, y - 0.022, 0.03, 'z0'), S(0.022, 0.365, y - 0.022, 0.03, 'z0')));
  return p;
}
/** a mirror cabinet: two mirror doors, a light bar on top (zone 0) and a light underneath (zone 1) */
function mirrorCabinet() {
  return [B(0.8, 0.7, 0.13, 0, 0.01, -0.01), B(0.398, 0.62, 0.018, -0.201, 0.03, 0.064, 'mirror'), B(0.398, 0.62, 0.018, 0.201, 0.03, 0.064, 'mirror'),
    B(0.8, 0.055, 0.02, 0, 0.655, 0.064, 'z0'), B(0.6, 0.01, 0.08, 0, 0, 0.0, 'z1')];
}

/* ---------- climate: air conditioners, fans, air purifier ---------- */
/** n blades of a fan turning round z (facing the front), r long and w wide, round (cx, cy) at z */
const fanBlades = (n, r, cx, cy, z, m, w, t = 0.006) => range(n).map((i) => {
  const a = (i * 2 * PI) / n + 0.3;
  return B(w, r, t, cx - Math.sin(a) * (r / 2 + 0.02), cy + Math.cos(a) * (r / 2 + 0.02) - r / 2, z, m, { rz: a });
});
/** the indoor unit of a split air conditioner (0.9 m wide), on the wall: the front, the flap the air comes out of (blue while it cools, red
 *  while it heats), its display */
function acWall() {
  return [B(0.9, 0.24, 0.2, 0, 0.06, -0.01), B(0.9, 0.05, 0.15, 0, 0.01, -0.035), B(0.9, 0.22, 0.012, 0, 0.08, 0.096), hline(0.88, 0, 0.19, 0.103),
    tilted(0.84, 0.055, 0.012, 0, 0.035, 0.055, -0.55, 'acvent'), B(0.84, 0.004, 0.11, 0, 0.006, -0.02, 'line'),
    B(0.07, 0.022, 0.004, 0.3, 0.13, 0.103, 'acdisplay'), B(0.006, 0.006, 0.004, 0.36, 0.135, 0.103, 'acdisplay')];
}
/** the outdoor unit of an air conditioner or a heat pump: on two rails, the big fan behind its grille, the pipes at the side */
function acOutdoor() {
  const fx = -0.12, fy = 0.34;
  return [B(0.05, 0.05, 0.34, -0.3, 0, 0, 'iron'), B(0.05, 0.05, 0.34, 0.3, 0, 0, 'iron'), B(0.8, 0.55, 0.3, 0, 0.05, 0), B(0.82, 0.02, 0.32, 0, 0.6, 0, 'f2'),
    discZ(0.225, 0.006, fx, fy, 0.153, 'f2'), discZ(0.205, 0.004, fx, fy, 0.157, 'dark'), ...fanBlades(3, 0.17, fx, fy, 0.165, 'mesh', 0.09),
    discZ(0.04, 0.02, fx, fy, 0.17, 'iron'), ...range(7).map((i) => B(0.42, 0.006, 0.006, fx, fy - 0.18 + i * 0.06, 0.176, 'iron')), B(0.17, 0.22, 0.004, 0.28, 0.1, 0.151, 'f2'),
    rod([0.4, 0.2, 0.05], [0.44, 0.2, 0.05], 0.012, 'copper'), rod([0.4, 0.26, 0.05], [0.44, 0.26, 0.05], 0.009, 'copper')];
}
/** a portable air conditioner on castors: the air comes out on top, the hot air leaves through the hose at the back */
function acPortable() {
  const p = [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.022, 0.04, i * 0.18, 0, k * 0.14, 'black', 0.022, 10)), B(0.45, 0.7, 0.36, 0, 0.04, 0),
    B(0.36, 0.012, 0.15, 0, 0.74, 0.08, 'acvent'), ...range(5).map((i) => B(0.34, 0.006, 0.006, 0, 0.75, 0.02 + i * 0.03, 'line')),
    B(0.11, 0.03, 0.004, 0, 0.62, 0.182, 'acdisplay'), ...range(6).map((i) => hline(0.32, 0, 0.12 + i * 0.05, 0.181))];
  const hose = [[0, 0.5, -0.18], [0, 0.55, -0.27], [0, 0.66, -0.33], [0, 0.82, -0.36], [0, 1.0, -0.37]];
  for (let i = 1; i < hose.length; i++) p.push(rod(hose[i - 1], hose[i], 0.065, 'hose', 16));
  return p;
}
/** a ceiling cassette (60 x 60): the panel with an air outlet on each side, the grille in the middle, the box above in the ceiling */
function acCeiling() {
  return [B(0.57, 0.1, 0.57, 0, 0.033, 0, 'f2'), B(0.62, 0.03, 0.62, 0, 0.003, 0), B(0.32, 0.004, 0.32, 0, 0.001, 0, 'mesh'),
    B(0.4, 0.006, 0.05, 0, 0, 0.24, 'acvent'), B(0.4, 0.006, 0.05, 0, 0, -0.24, 'acvent'), B(0.05, 0.006, 0.4, 0.24, 0, 0, 'acvent'), B(0.05, 0.006, 0.4, -0.24, 0, 0, 'acvent'),
    B(0.03, 0.004, 0.015, 0.25, 0, 0.27, 'acdisplay')];
}
/** a ceiling fan with a light (its own LED zone): the light under the motor, five blades, the rod up to the ceiling */
function fanCeiling() {
  return [S(0.1, 0, 0, 0, 'z0', 1, 0.55, 1), C(0.13, 0.12, 0, 0.08, 0, 'steel', 0.11, 24),
    ...range(5).flatMap((i) => { const a = (i * 2 * PI) / 5; return turnAll([B(0.13, 0.008, 0.52, 0, 0.13, 0.42), B(0.035, 0.012, 0.16, 0, 0.125, 0.15, 'steel')], a); }),
    C(0.015, 0.16, 0, 0.2, 0, 'steel', 0.015, 10), C(0.07, 0.05, 0, 0.36, 0, 'steel', 0.05, 20)];
}
/** a standing fan: its foot, the pole, the motor and the blades behind a round guard; its display glows while it runs */
function fanStand() {
  return [C(0.17, 0.04, 0, 0, 0, 'f', 0.18, 28), C(0.018, 0.95, 0, 0.04, 0, 'steel', 0.018, 10), B(0.05, 0.004, 0.025, 0, 0.04, 0.11, 'acdisplay'),
    B(0.04, 0.1, 0.04, 0, 0.98, -0.03), discZ(0.065, 0.14, 0, 1.1, -0.06), ...fanBlades(3, 0.17, 0, 1.1, 0.06, 'f', 0.1),
    discZ(0.21, 0.1, 0, 1.1, 0.06, 'smoke', 40), discZ(0.04, 0.012, 0, 1.1, 0.115)];
}
/** a tower fan: a slim column on a round foot, the air comes out of the slot in front; the display on top glows while it runs */
const fanTower = () => [C(0.16, 0.04, 0, 0, 0, 'f', 0.17, 28), C(0.11, 1.0, 0, 0.04, 0, 'f', 0.11, 28), B(0.07, 0.72, 0.02, 0, 0.18, 0.1, 'mesh'),
  C(0.07, 0.004, 0, 1.04, 0.01, 'acdisplay', 0.07, 20)];
/** an air purifier: a round column, the filter all round it, the grille on top and a ring of light under it */
const airPurifier = () => [C(0.14, 0.06, 0, 0, 0, 'f', 0.14, 32), C(0.142, 0.36, 0, 0.06, 0, 'mesh', 0.142, 32), C(0.14, 0.07, 0, 0.42, 0, 'f', 0.14, 32),
  C(0.142, 0.012, 0, 0.49, 0, 'acdisplay', 0.142, 32), C(0.13, 0.03, 0, 0.502, 0, 'dark', 0.13, 32)];
/** a dehumidifier on castors: the water tank in front (you see the water), the grille and the display on top */
const dehumidifier = () => [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.018, 0.03, i * 0.14, 0, k * 0.09, 'black', 0.018, 10)), B(0.35, 0.52, 0.25, 0, 0.03, 0),
  B(0.3, 0.2, 0.008, 0, 0.05, 0.128, 'smoke'), B(0.28, 0.07, 0.006, 0, 0.06, 0.131, 'water'), B(0.28, 0.006, 0.14, 0, 0.55, 0.03, 'mesh'), B(0.08, 0.004, 0.04, 0, 0.55, -0.08, 'acdisplay')];

/** the pieces: cat (library group), label (German, the translations are in i18n.js / lang/*.js), fin (the finishes, the first is the default),
 *  search (more words the library search finds it by), y (height over the floor when placed), round (round footprint), icon (of the ball to
 *  tap in the live mode), leds (the LED zones, see ledzones.js), lamp (a lamp: lights its room, also when switched by a relay), light (how far
 *  and how strongly it lights its room, lamplight.js), wall (hangs on the wall: clicks onto it, not stopped by it), ceil (hangs from the
 *  ceiling), flat (lies on the floor: drawn under the rest of the plan), variants (ways to build it, chosen on the device: `variant`; the first
 *  is the default; pc_setup: MONITOR_LAYOUTS, the bar counters: BAR_CEILINGS), variantLabel / variantHint (the name of that choice in the side panel,
 *  else 'prop.variant', and a hint under it), sizeVariant (the variant whose size the side panel shows), leds also as a function of the variant, cool (an air conditioner: on a plain switch it cools), parts(variant) */
export const LEISURE = {
  sauna_cabin: { cat: 'wellness', label: 'Sauna mit Glasfront', fin: ['spruce', 'hemlock', 'cedar', 'thermo'], search: 'sauna saunakabine finnische sauna wellness glasfront', icon: '🧖', parts: () => saunaCabin(2.0, 1.8, 2.05, true) },
  sauna_small: { cat: 'wellness', label: 'Sauna klein', fin: ['spruce', 'hemlock', 'cedar', 'thermo'], search: 'sauna saunakabine finnische sauna wellness klein', icon: '🧖', parts: () => saunaCabin(1.3, 1.2, 2.0, false) },
  sauna_ir: { cat: 'wellness', label: 'Infrarotkabine', fin: ['hemlock', 'spruce', 'cedar'], search: 'infrarot infrarotkabine wärmekabine waermekabine sauna wellness', icon: '🧖', parts: saunaIr },
  sauna_barrel: { cat: 'wellness', label: 'Fass-Sauna (Garten)', fin: ['spruce', 'thermo', 'cedar'], search: 'fasssauna fass sauna garten aussen außensauna barrel wellness', icon: '🧖', parts: saunaBarrel },
  sauna_heater: { cat: 'wellness', label: 'Saunaofen', fin: [], search: 'saunaofen ofen sauna steine aufguss', icon: '🔥', parts: () => [...heater(0, 0, 0.42, 0.32, 0.6), ...range(4).map((i) => B(0.035, 0.66, 0.02, -0.15 + i * 0.1, 0.06, 0.22, 'birch'))] },
  hottub: { cat: 'wellness', label: 'Whirlpool mit LED', fin: ['grey', 'thermo', 'anthracite', 'walnut'], search: 'whirlpool jacuzzi hot tub spa wellness led', icon: '♨', parts: hotTub },
  plunge_tub: { cat: 'wellness', label: 'Tauchbecken', fin: ['thermo', 'spruce', 'cedar'], search: 'tauchbecken eistonne kaltwasser abkühlen abkuehlen bottich wellness', parts: plungeTub },
  lounger: { cat: 'wellness', label: 'Ruheliege', fin: ['thermo', 'hemlock', 'oak'], search: 'ruheliege liege relaxliege saunaliege wellness', parts: lounger },
  bucket_shower: { cat: 'wellness', label: 'Kübeldusche', fin: ['cedar', 'thermo', 'spruce'], search: 'kübeldusche kuebeldusche schwalldusche eimerdusche sauna dusche', y: 1.4, wall: true, parts: bucketShower },
  treadmill: { cat: 'fitness', label: 'Laufband', fin: ['darkgrey', 'black', 'white'], search: 'laufband treadmill cardio fitness joggen', icon: '🏃', parts: treadmill },
  bike_trainer: { cat: 'fitness', label: 'Heimtrainer', fin: ['darkgrey', 'black', 'white'], search: 'heimtrainer ergometer fahrrad fitness cardio bike', icon: '🚴', parts: exerciseBike },
  bike_spin: { cat: 'fitness', label: 'Indoor-Cycle', fin: ['black', 'red', 'white'], search: 'spinning indoor cycle cycling fahrrad fitness bike', icon: '🚴', parts: spinBike },
  rower: { cat: 'fitness', label: 'Rudergerät', fin: ['oak', 'walnut', 'black'], search: 'rudergerät ruderergometer rudern rower wasser fitness', icon: '🚣', parts: rower },
  crosstrainer: { cat: 'fitness', label: 'Crosstrainer', fin: ['darkgrey', 'black', 'white'], search: 'crosstrainer ellipsentrainer cardio fitness', icon: '🏃', parts: crossTrainer },
  weightbench: { cat: 'fitness', label: 'Hantelbank mit Langhantel', fin: ['black', 'red', 'darkgrey'], search: 'hantelbank bankdrücken bankdruecken langhantel gewichte kraft fitness', parts: weightBench },
  powerrack: { cat: 'fitness', label: 'Power Rack', fin: ['black', 'red', 'anthracite'], search: 'power rack kraftstation käfig kaefig squat kniebeuge klimmzug langhantel fitness', parts: powerRack },
  cablestation: { cat: 'fitness', label: 'Kraftstation mit Seilzug', fin: ['anthracite', 'black', 'white'], search: 'kraftstation seilzug latzug multistation fitness', parts: cableStation },
  dumbbells: { cat: 'fitness', label: 'Kurzhantel-Ablage', fin: ['black', 'anthracite'], search: 'kurzhantel hanteln hantelablage dumbbell fitness', parts: dumbbellRack },
  punchingbag: { cat: 'fitness', label: 'Boxsack', fin: ['black', 'red', 'cognac'], search: 'boxsack boxen kampfsport punching bag fitness', round: true, parts: punchingBag },
  kettlebells: { cat: 'fitness', label: 'Kettlebells', fin: ['black', 'anthracite', 'red'], search: 'kettlebell kugelhantel gewichte fitness', parts: () => [...kettlebell(0.08, -0.22, 0), ...kettlebell(0.095, 0, 0), ...kettlebell(0.11, 0.25, 0)] },
  gymball: { cat: 'fitness', label: 'Gymnastikball', fin: ['blue', 'grey', 'green', 'purple', 'red', 'black'], search: 'gymnastikball sitzball pezziball fitnessball yoga', round: true, parts: () => [S(0.325, 0, 0, 0)] },
  yogamat: { cat: 'fitness', label: 'Yogamatte', fin: ['purple', 'blue', 'green', 'black', 'grey'], search: 'yoga yogamatte matte gymnastik pilates fitness', flat: true,
    parts: () => [B(0.61, 0.005, 1.83, 0, 0, 0), B(0.23, 0.076, 0.15, -0.13, 0.005, -0.75, 'f2'), B(0.23, 0.076, 0.15, 0.13, 0.005, -0.75, 'f2')] },
  gymfloor: { cat: 'fitness', label: 'Sportboden (Matten)', fin: ['black', 'anthracite', 'blue'], search: 'sportboden bodenmatten bodenschutz puzzlematten gummimatten fitness', flat: true,
    parts: () => range(16).map((i) => B(0.497, 0.02, 0.497, -0.75 + (i % 4) * 0.5, 0, -0.75 + Math.floor(i / 4) * 0.5)) },
  wallbars: { cat: 'fitness', label: 'Sprossenwand', fin: ['birch', 'pine', 'oak'], search: 'sprossenwand turnen klettern gymnastik fitness', wall: true,
    parts: () => [B(0.055, 2.4, 0.13, -0.4225, 0, 0), B(0.055, 2.4, 0.13, 0.4225, 0, 0), ...range(16).map((i) => rod([-0.4, 0.12 + i * 0.145, 0.01], [0.4, 0.12 + i * 0.145, 0.01], 0.017, 'f'))] },
  mirror_gym: { cat: 'fitness', label: 'Spiegelwand mit LED', fin: [], search: 'spiegel spiegelwand led indirekt beleuchtet fitness tanz', y: 0.3, wall: true, lamp: true, light: { r: 0.6, k: 0.5 }, leds: ['back', 'front'], parts: () => twoZoneMirror(2.0, 1.8) },
  bar_counter: { cat: 'bar', label: 'Bartheke mit LED', fin: ['blackbrown', 'oak', 'walnut', 'white', 'anthracite'], search: 'bar theke bartheke tresen led beleuchtet hausbar gläserregal glaeserregal gläserhalter deckensegel pendelleuchte', icon: '🍸', leds: barLeds, lamp: true, light: { r: 0.55, k: 0.5 },
    variants: BAR_CEILINGS, variantLabel: 'prop.barCeiling', variantHint: 'prop.barCeilingHint', sizeVariant: 'none', parts: (v) => [...barCounter(2.4), ...barCeiling(v, OVER_BAR)] },
  bar_corner: { cat: 'bar', label: 'Bartheke über Eck mit LED', fin: ['blackbrown', 'oak', 'walnut', 'white', 'anthracite'], search: 'bar theke bartheke tresen eck l-form led beleuchtet hausbar gläserregal glaeserregal gläserhalter deckensegel pendelleuchte', icon: '🍸', leds: barLeds, lamp: true, light: { r: 0.6, k: 0.5 },
    variants: BAR_CEILINGS, variantLabel: 'prop.barCeiling', variantHint: 'prop.barCeilingHint', sizeVariant: 'none', parts: (v) => [...barCorner(), ...barCeiling(v, OVER_CORNER)] },
  backbar: { cat: 'bar', label: 'Barregal mit Flaschen', fin: ['blackbrown', 'oak', 'walnut', 'white', 'anthracite'], search: 'barregal rückbuffet rueckbuffet flaschen spirituosen regal led hausbar', icon: '🍸', lamp: true, light: { r: 0.5, k: 0.45 }, parts: backBar },
  barstool_back: { cat: 'bar', label: 'Barhocker mit Lehne', fin: ['black', 'cognac', 'darkgrey', 'red', 'white'], search: 'barhocker hocker tresenhocker bar', round: true, parts: barStoolBack },
  bar_table: { cat: 'bar', label: 'Stehtisch', fin: ['black', 'white', 'oak', 'walnut'], search: 'stehtisch bistrotisch bartisch bar', round: true, parts: () => [C(0.35, 0.035, 0, 1.065, 0, 'f', 0.35, 36), C(0.035, 1.02, 0, 0.045, 0, 'chrome', 0.035, 12), C(0.24, 0.045, 0, 0, 0, 'iron', 0.26, 32)] },
  wine_fridge: { cat: 'bar', label: 'Weinkühlschrank', fin: ['black', 'anthracite', 'white'], search: 'weinkühlschrank weinkuehlschrank weinklimaschrank wein kühlschrank bar', icon: '🍷', parts: () => glassFridge(0.6, 1.8, 0.6, true) },
  drinks_fridge: { cat: 'bar', label: 'Getränkekühlschrank', fin: ['black', 'anthracite', 'white'], search: 'getränkekühlschrank getraenkekuehlschrank flaschenkühlschrank bier kühlschrank bar', icon: '🍺', parts: () => glassFridge(0.6, 0.85, 0.58, false) },
  beer_tap: { cat: 'bar', label: 'Zapfanlage', fin: [], search: 'zapfanlage zapfhahn bier zapfsäule zapfsaeule bar', y: 1.1, icon: '🍺', parts: beerTap },
  neon_sign: { cat: 'bar', label: 'Neon-Schild Cocktail', fin: [], search: 'neon neonschild leuchtschild cocktail schild led bar', y: 1.5, wall: true, lamp: true, light: { r: 0.35, k: 0.4 }, parts: neonSign },
  dartboard: { cat: 'bar', label: 'Dartscheibe', fin: [], search: 'dart dartscheibe darts spiel bar', y: 1.43, wall: true, parts: dartboard },
  pooltable: { cat: 'bar', label: 'Billardtisch', fin: ['walnut', 'oak', 'black', 'white'], search: 'billard billardtisch pool snooker spieltisch bar', parts: poolTable },
  pool_lamp: { cat: 'bar', label: 'Billardlampe', fin: ['black', 'green', 'red'], search: 'billardlampe billard lampe pendelleuchte leuchte bar', y: 1.75, ceil: true, lamp: true, light: { r: 0.7, k: 0.65 }, parts: poolLamp },
  kicker: { cat: 'bar', label: 'Tischkicker', fin: ['oak', 'black', 'white', 'walnut'], search: 'kicker tischkicker tischfussball tischfußball spiel bar', parts: kicker },
  screen_frame: { cat: 'cinema', label: 'Leinwand mit Rahmen', fin: ['black', 'darkgrey'], search: 'leinwand rahmenleinwand beamer projektor kino heimkino screen', y: 0.6, wall: true, icon: '🎬', parts: () => [B(2.82, 1.66, 0.04, 0, 0, 0), B(2.66, 1.5, 0.004, 0, 0.08, 0.021, 'screen')] },
  screen_roll: { cat: 'cinema', label: 'Motorleinwand', fin: ['white', 'black'], search: 'leinwand motorleinwand rollo rollleinwand elektrisch beamer projektor kino heimkino screen', y: 0.45, wall: true, icon: '🎬',
    parts: () => [B(2.66, 0.03, 0.025, 0, 0, 0, 'black'), B(2.6, 0.06, 0.003, 0, 0.03, 0, 'black'), B(2.6, 1.46, 0.003, 0, 0.09, 0, 'screen'), B(2.6, 0.3, 0.003, 0, 1.55, 0, 'black'), B(2.86, 0.1, 0.1, 0, 1.85, -0.035)] },
  projector: { cat: 'cinema', label: 'Beamer (Decke)', fin: ['white', 'black'], search: 'beamer projektor deckenhalterung kino heimkino projector', y: 2.0, ceil: true, icon: '📽',
    parts: () => [B(0.42, 0.13, 0.34, 0, 0, 0), discZ(0.05, 0.03, 0.1, 0.065, 0.185, 'black'), discZ(0.036, 0.004, 0.1, 0.065, 0.2015, 'lens'), B(0.012, 0.006, 0.004, -0.17, 0.1, 0.171, 'lens'),
      ...range(4).map((i) => B(0.08, 0.006, 0.004, -0.09, 0.03 + i * 0.02, 0.171, 'line')), C(0.03, 0.06, 0, 0.13, 0, 'black'), rod([0, 0.19, 0], [0, 0.45, 0], 0.02, 'black'), C(0.08, 0.012, 0, 0.45, 0, 'black')] },
  cinema_seat: { cat: 'cinema', label: 'Kinosessel', fin: ['black', 'cognac', 'red', 'darkgrey'], search: 'kinosessel relaxsessel heimkino kino sessel recliner', parts: () => cinemaSeats(1) },
  cinema_row: { cat: 'cinema', label: 'Kinosessel 3er-Reihe', fin: ['black', 'cognac', 'red', 'darkgrey'], search: 'kinosessel kinoreihe heimkino kino sessel recliner sofa', parts: () => cinemaSeats(3) },
  popcorn: { cat: 'cinema', label: 'Popcornmaschine', fin: [], search: 'popcorn popcornmaschine kino heimkino', icon: '🍿', parts: popcorn },
  speaker_floor: { cat: 'cinema', label: 'Standlautsprecher', fin: ['black', 'walnut', 'white'], search: 'standlautsprecher lautsprecher box boxen hifi kino heimkino speaker', icon: '🔊', parts: floorSpeaker },
  subwoofer: { cat: 'cinema', label: 'Subwoofer', fin: ['black', 'walnut', 'white'], search: 'subwoofer bass lautsprecher hifi kino heimkino', icon: '🔊', parts: subwoofer },
  acoustic_panel: { cat: 'cinema', label: 'Akustikpaneel (Lamellen)', fin: ['oak', 'walnut', 'black', 'white'], search: 'akustikpaneel akustik lamellen holzlamellen wandpaneel kino heimkino', y: 0.9, wall: true, parts: slatPanel },
  starsky: { cat: 'cinema', label: 'Sternenhimmel (LED)', fin: [], search: 'sternenhimmel sterne led glasfaser decke kino heimkino', y: 2.47, ceil: true, flat: true, lamp: true, light: { r: 0.6, k: 0.3 }, parts: starSky },
  pc_tower: { cat: 'office', label: 'PC (Tower)', fin: ['black', 'white', 'grey'], search: 'pc computer rechner tower', icon: '🖥', parts: () => pcTower(false) },
  pc_gaming: { cat: 'office', label: 'Gaming-PC mit RGB', fin: ['black', 'white'], search: 'gaming pc computer rechner rgb tower', icon: '🖥', parts: () => pcTower(true) },
  pc_setup: { cat: 'office', label: 'Gaming-PC-Arbeitsplatz', fin: ['black', 'white', 'oak'], search: 'pc computer gaming setup schreibtisch monitor bildschirm zwei drei vier curved hochkant rgb', variants: Object.keys(MONITOR_LAYOUTS), icon: '🖥', parts: (v) => pcSetup(v) },
  laptop: { cat: 'office', label: 'Laptop', fin: ['alu', 'black', 'grey'], search: 'laptop notebook computer macbook', y: 0.75, icon: '💻', parts: laptop },
  gaming_chair: { cat: 'office', label: 'Gaming-Stuhl', fin: ['red', 'blue', 'green', 'white', 'black'], search: 'gaming stuhl gamingstuhl gaming chair bürostuhl buerostuhl', parts: gamingChair },
  server_rack: { cat: 'office', label: 'Netzwerkschrank', fin: ['black', 'white'], search: 'netzwerkschrank serverschrank rack server homelab nas switch router', icon: '🖧', parts: serverRack },
  mirror_led: { cat: 'bath', label: 'Spiegel mit indirekter LED', fin: [], search: 'spiegel led indirekt beleuchtet badspiegel lichtspiegel', y: 1.15, wall: true, lamp: true, light: { r: 0.4, k: 0.4 }, parts: () => ledMirror(1.0, 0.7) },
  mirror_led_round: { cat: 'bath', label: 'Runder Spiegel mit LED', fin: [], search: 'spiegel rund led indirekt beleuchtet badspiegel lichtspiegel', y: 1.15, wall: true, lamp: true, light: { r: 0.4, k: 0.4 }, parts: () => roundMirror(0.4) },
  mirror_led_zones: { cat: 'bath', label: 'LED-Spiegel mit 3 Zonen', fin: [], search: 'spiegel led zonen mehrere indirekt beleuchtet badspiegel lichtspiegel', y: 1.1, wall: true, lamp: true, light: { r: 0.45, k: 0.45 }, leds: ['back', 'front', 'bottom'], parts: zoneMirror },
  mirror_hollywood: { cat: 'bath', label: 'Hollywood-Spiegel', fin: ['white', 'black'], search: 'hollywood spiegel schminkspiegel glühbirnen gluehbirnen led beleuchtet', y: 1.1, wall: true, lamp: true, light: { r: 0.4, k: 0.45 }, leds: ['bulbs', 'back'], parts: hollywoodMirror },
  mirror_cabinet: { cat: 'bath', label: 'Spiegelschrank mit LED', fin: ['white', 'oak', 'grey', 'anthracite'], search: 'spiegelschrank spiegel schrank led beleuchtet bad', y: 1.2, wall: true, lamp: true, light: { r: 0.4, k: 0.4 }, leds: ['top', 'bottom'], parts: mirrorCabinet },
  mirror_led_tall: { cat: 'entry', label: 'Ganzkörperspiegel mit LED', fin: [], search: 'spiegel ganzkörperspiegel ganzkoerperspiegel led indirekt beleuchtet flur', y: 0.25, wall: true, lamp: true, light: { r: 0.45, k: 0.4 }, leds: ['back', 'front'], parts: () => twoZoneMirror(0.6, 1.7, 0.05, 0.07) },
  ac_wall: { cat: 'climate', label: 'Klimagerät (Split, Wand)', fin: ['white', 'black', 'grey'], search: 'klima klimaanlage klimagerät klimageraet split innengerät innengeraet wandgerät air conditioner kühlen kuehlen', y: 2.0, wall: true, cool: true, icon: '❄', parts: acWall },
  ac_outdoor: { cat: 'climate', label: 'Klima-Außengerät / Wärmepumpe', fin: ['white', 'grey', 'anthracite'], search: 'klima klimaanlage außengerät aussengeraet split wärmepumpe waermepumpe heatpump outdoor', icon: '❄', parts: acOutdoor },
  ac_portable: { cat: 'climate', label: 'Mobiles Klimagerät', fin: ['white', 'black', 'grey'], search: 'klima klimagerät klimageraet mobil mobiles monoblock abluftschlauch air conditioner kühlen kuehlen', cool: true, icon: '❄', parts: acPortable },
  ac_ceiling: { cat: 'climate', label: 'Klima-Deckenkassette', fin: ['white', 'grey'], search: 'klima klimaanlage deckenkassette kassette decke deckengerät deckengeraet air conditioner', y: 2.37, ceil: true, flat: true, cool: true, icon: '❄', parts: acCeiling },
  fan_ceiling: { cat: 'climate', label: 'Deckenventilator mit Licht', fin: ['walnut', 'oak', 'white', 'black'], search: 'ventilator deckenventilator lüfter luefter decke licht lampe fan', y: 2.09, ceil: true, leds: ['light'], icon: '🌀', parts: fanCeiling },
  fan_stand: { cat: 'climate', label: 'Standventilator', fin: ['white', 'black', 'grey'], search: 'ventilator standventilator lüfter luefter fan', icon: '🌀', parts: fanStand },
  fan_tower: { cat: 'climate', label: 'Turmventilator', fin: ['white', 'black', 'grey'], search: 'ventilator turmventilator säulenventilator saeulenventilator lüfter luefter fan', round: true, icon: '🌀', parts: fanTower },
  air_purifier: { cat: 'climate', label: 'Luftreiniger', fin: ['white', 'grey', 'black'], search: 'luftreiniger luftfilter purifier hepa luft', round: true, icon: '🌬', parts: airPurifier },
  dehumidifier: { cat: 'climate', label: 'Luftentfeuchter', fin: ['white', 'grey', 'black'], search: 'luftentfeuchter entfeuchter feuchtigkeit dehumidifier keller', icon: '💧', parts: dehumidifier },
};
const keys = (flag) => Object.keys(LEISURE).filter((k) => LEISURE[k][flag]);
/** the lamps among them (lamplight.js), how they light the room, what hangs on the wall or the ceiling (placement.js, collide.js), what lies flat */
export const LEISURE_LAMPS = keys('lamp');
export const LEISURE_LIGHT = Object.fromEntries(keys('light').map((k) => [k, LEISURE[k].light]));
export const LEISURE_WALL = keys('wall');
export const LEISURE_HUNG = [...keys('wall'), ...keys('ceil')];
export const LEISURE_FLAT = keys('flat');
/** the library groups these pieces add (models.js puts them before the lamps) */
export const LEISURE_CATS = ['wellness', 'fitness', 'bar', 'cinema', 'climate'];
/** the air conditioners: on a plain switch they cool while they are on (heating.js) */
export const LEISURE_COOL = keys('cool');
