/* 🏡 Things for the garden and the yard round the house (#538): a hedge, a garden bench, a table with four chairs, a lounger, a parasol, a
 * kettle grill and a gas grill, a fire bowl, a raised bed, planters, flowers, garden lamps, a trampoline, a sandbox, a swing, a pergola, a
 * greenhouse, a garden shed, a mailbox, a bird bath, a rotary dryer, stepping stones, a composter, a lounge corner and a garden gnome. Own
 * simple models in their real sizes, made of parts like the furniture in Scandinavian style (scandi.js lists these pieces too, so models.js,
 * plan2d.js and the side panel treat them alike); in the library group "Außen" with the tree and the fence. Pure geometry, no three.js; the
 * building blocks are in shapes.js, the format of a part in scandi.js. What glows (the lamps, the embers of the fire bowl) lights up with the
 * device's entity like the pieces of leisure.js. Unit tests: tests/yarddeco.test.mjs */
import { B, C, S, rod, bar, legs, at, turnAll, tilted, hline, discZ, wheelX, prof } from './shapes.js';

const PI = Math.PI;
const range = (n) => Array.from({ length: n }, (_, i) => i);

/** the finishes these pieces add (side panel: "Ausführung"): garden woods, rattan, the greens of a hedge, stones */
export const YARD_FINISHES = {
  teak: { c: '#a0714a', rough: 0.8 }, rattan: { c: '#8a6a48', rough: 0.95 }, hedge: { c: '#3f6b37', rough: 1 }, conifer: { c: '#2f5232', rough: 1 },
  boxwood: { c: '#4e7a3a', rough: 1 }, sandstone: { c: '#cdbb98', rough: 1 }, granite: { c: '#8c8c88', rough: 0.9 },
};
/** the fixed materials these pieces add */
export const YARD_MATS = {
  canvas: { c: '#efe9dc', rough: 0.9 }, cushion: { c: '#e6dfd0', rough: 0.95 }, net: { c: '#26272a', opacity: 0.25, rough: 0.9 }, padblue: { c: '#2e6dc6', rough: 0.7 },
  jump: { c: '#1d1e20', rough: 0.85 }, sand: { c: '#dcc794', rough: 1 }, flower1: { c: '#d64b6a', rough: 0.9 }, flower2: { c: '#f2c230', rough: 0.9 },
  flower3: { c: '#8e6ad8', rough: 0.9 }, flower4: { c: '#f4f1ea', rough: 0.9 }, gnomered: { c: '#c0392b', rough: 0.6 }, gnomeblue: { c: '#2c5aa0', rough: 0.6 },
  skin: { c: '#f1c8a5', rough: 0.6 }, beard: { c: '#f4f4f0', rough: 0.9 }, roofing: { c: '#3d3f42', rough: 0.85 }, ash: { c: '#3a3633', rough: 1 },
};

function hedge() {
  const p = [B(1.9, 1.25, 0.6, 0, 0, 0, 'f')];
  range(5).forEach((i) => {
    const x = -0.76 + i * 0.38;
    p.push(S(0.3, x, 1.0, 0, 'f', 1.05, 0.8, 1.05), S(0.22, x + (i < 4 ? 0.19 : -0.19), 0.6, 0.18, 'f2', 1, 1, 0.9), S(0.22, x, 0.35, -0.18, 'f2', 1, 1, 0.9));
  });
  return p;
}
/** a garden bench: wooden slats on cast iron sides */
function gardenBench() {
  const W = 1.5, p = [];
  range(4).forEach((i) => p.push(B(W, 0.03, 0.09, 0, 0.42, -0.2 + i * 0.105)));
  range(3).forEach((i) => p.push(tilted(W, 0.09, 0.025, 0, 0.6 + i * 0.12, -0.27 - i * 0.025, -0.2, 'f')));
  [-1, 1].forEach((s) => {
    const x = s * (W / 2 - 0.06);
    p.push(B(0.04, 0.42, 0.04, x, 0, 0.12, 'iron'), B(0.04, 0.86, 0.04, x, 0, -0.29, 'iron'), B(0.04, 0.04, 0.45, x, 0.38, -0.08, 'iron'),
      B(0.05, 0.035, 0.5, x, 0.64, -0.05, 'f'), B(0.035, 0.22, 0.035, x, 0.42, 0.14, 'iron'));
  });
  return p;
}
/** a garden chair facing +z (slatted seat and back) */
function chair() {
  const p = [...range(4).map((i) => B(0.46, 0.03, 0.1, 0, 0.44, -0.17 + i * 0.115)), ...legs(0.44, 0.44, 0.44, 0.04, 0, 'f')];
  [-1, 1].forEach((s) => p.push(B(0.04, 0.46, 0.04, s * 0.2, 0.44, -0.2)));
  range(3).forEach((i) => p.push(B(0.44, 0.07, 0.025, 0, 0.56 + i * 0.11, -0.2)));
  return p;
}
function gardenSet() {
  const p = [...range(8).map((i) => B(0.18, 0.035, 0.9, -0.7 + i * 0.2, 0.72, 0)), ...legs(1.5, 0.8, 0.72, 0.06, 0.02, 'f'),
    B(1.4, 0.06, 0.04, 0, 0.6, 0.32, 'f2'), B(1.4, 0.06, 0.04, 0, 0.6, -0.32, 'f2')];
  [[-0.4, 0.75, PI], [0.4, 0.75, PI], [-0.4, -0.75, 0], [0.4, -0.75, 0]].forEach(([x, z, a]) => p.push(...at(turnAll(chair(), a), x, 0, z)));
  return p;
}
function lounger() {
  const p = [B(0.68, 0.06, 1.35, 0, 0.3, 0.25), B(0.62, 0.07, 1.3, 0, 0.36, 0.25, 'cushion'),
    tilted(0.68, 0.7, 0.06, 0, 0.62, -0.62, -0.95, 'f'), tilted(0.62, 0.66, 0.07, 0, 0.66, -0.58, -0.95, 'cushion', 0.06)];
  [-1, 1].forEach((s) => p.push(B(0.05, 0.3, 0.05, s * 0.3, 0, 0.85), B(0.05, 0.3, 0.05, s * 0.3, 0, -0.35)));
  return p;
}
function parasol() {
  return [B(0.5, 0.08, 0.5, 0, 0, 0, 'stone'), C(0.025, 2.32, 0, 0.08, 0, 'steel', 0.025, 10), C(0.06, 0.45, 0, 1.95, 0, 'f', 1.5, 8),
    C(1.5, 0.12, 0, 1.83, 0, 'f2', 1.5, 8), S(0.05, 0, 2.38, 0, 'steel')];
}
function kettleGrill() {
  const p = [S(0.29, 0, 0.52, 0, 'f', 1, 1.15, 1), C(0.296, 0.02, 0, 0.84, 0, 'steel', 0.296, 24), B(0.14, 0.03, 0.03, 0, 1.2, 0, 'black'),
    B(0.02, 0.05, 0.02, -0.06, 1.16, 0, 'steel'), B(0.02, 0.05, 0.02, 0.06, 1.16, 0, 'steel'), C(0.16, 0.02, 0, 0.2, 0, 'steel', 0.16, 3)];
  [0, 2.1, 4.2].forEach((a, i) => {
    const c = Math.sin(a), s = Math.cos(a);
    p.push(rod([0.2 * c, 0.62, 0.2 * s], [0.33 * c, 0.02, 0.33 * s], 0.014, 'black'));
    if (i === 0) p.push(wheelX(0.07, 0.03, 0.33 * c, 0.07, 0.33 * s, 'tyre', 14));
  });
  return p;
}
function gasGrill() {
  const p = [B(0.75, 0.72, 0.5, 0, 0.12, 0), B(0.002, 0.6, 0.002, 0, 0.18, 0.251, 'line'), B(0.75, 0.24, 0.5, 0, 0.84, 0, 'steel'),
    wheelX(0.25, 0.74, 0, 1.08, 0, 'f', 16), rod([-0.3, 1.2, 0.31], [0.3, 1.2, 0.31], 0.012, 'steel'),
    ...[-1, 1].map((s) => B(0.34, 0.03, 0.45, s * 0.555, 0.98, 0, 'steel')), ...range(4).map((i) => discZ(0.025, 0.03, -0.24 + i * 0.16, 0.96, 0.265, 'black', 12))];
  [-1, 1].forEach((s) => p.push(B(0.05, 0.12, 0.05, s * 0.33, 0, 0.2, 'black'), wheelX(0.07, 0.04, s * 0.35, 0.07, -0.18, 'tyre', 14)));
  return p;
}
function fireBowl() {
  const p = [C(0.22, 0.18, 0, 0, 0, 'f2', 0.3, 20), C(0.42, 0.22, 0, 0.18, 0, 'f', 0.2, 28), C(0.4, 0.02, 0, 0.39, 0, 'ash', 0.4, 28),
    rod([-0.25, 0.43, -0.06], [0.25, 0.43, 0.06], 0.04, 'wood'), rod([-0.06, 0.47, 0.24], [0.06, 0.47, -0.24], 0.04, 'wood'), rod([-0.2, 0.43, 0.16], [0.18, 0.43, -0.18], 0.035, 'wood')];
  [[0, 0], [0.1, 0.08], [-0.09, -0.07], [0.05, -0.12], [-0.12, 0.1]].forEach(([x, z]) => p.push(S(0.05, x, 0.41, z, 'ember', 1, 0.7, 1)));
  return p;
}
function raisedBed() {
  const W = 1.6, D = 0.8, H = 0.8, p = [B(W, H, 0.04, 0, 0, D / 2 - 0.02), B(W, H, 0.04, 0, 0, -D / 2 + 0.02), B(0.04, H, D - 0.08, W / 2 - 0.02, 0, 0), B(0.04, H, D - 0.08, -W / 2 + 0.02, 0, 0),
    B(W - 0.08, 0.04, D - 0.08, 0, H - 0.08, 0, 'soil'), ...[-1, 1].map((s) => B(W + 0.08, 0.03, 0.12, 0, H, s * (D / 2 - 0.02), 'f2'))];
  [1, 2, 3].forEach((i) => [-1, 1].forEach((s) => p.push(hline(W, 0, i * 0.2, s * (D / 2 + 0.001)))));
  range(6).forEach((i) => [-0.17, 0.17].forEach((z, k) => p.push(S(0.1, -0.6 + i * 0.24, H - 0.05, z, (i + k) % 3 === 0 ? 'stem' : 'leaf', 1, 0.6, 1))));
  return p;
}
function planter() {
  return [B(0.5, 0.5, 0.5, 0, 0, 0, 'f'), B(0.44, 0.02, 0.44, 0, 0.47, 0, 'soil'), S(0.28, 0, 0.42, 0, 'leaf', 1, 0.95, 1)];
}
function flowers() {
  const p = [S(0.22, 0, 0, 0, 'leaf', 1, 0.7, 1), S(0.18, 0.2, 0, 0.1, 'stem', 1, 0.8, 1), S(0.17, -0.18, 0, -0.12, 'leaf', 1, 0.8, 1), S(0.15, -0.1, 0, 0.17, 'stem', 1, 0.8, 1)];
  [[0, 0.3, 0], [0.12, 0.27, 0.08], [-0.13, 0.25, 0.05], [0.2, 0.24, -0.05], [-0.2, 0.23, -0.15], [0.05, 0.26, -0.15], [-0.05, 0.22, 0.24], [0.25, 0.2, 0.18], [-0.27, 0.2, 0.1]]
    .forEach(([x, y, z], i) => p.push(S(0.045, x, y, z, `flower${(i % 4) + 1}`)));
  return p;
}
function gardenLamp() {
  return [B(0.2, 0.03, 0.2, 0, 0, 0, 'f2'), C(0.07, 0.6, 0, 0.03, 0, 'f', 0.07, 20), C(0.065, 0.1, 0, 0.63, 0, 'glow', 0.065, 20), C(0.09, 0.03, 0, 0.73, 0, 'f', 0.09, 20)];
}
function lampPost() {
  const p = [B(0.24, 0.06, 0.24, 0, 0, 0, 'f'), C(0.04, 1.9, 0, 0.06, 0, 'f', 0.05, 12), B(0.2, 0.3, 0.2, 0, 1.96, 0, 'glow'), B(0.24, 0.03, 0.24, 0, 1.94, 0, 'f'),
    { ...C(0.03, 0.14, 0, 2.26, 0, 'f', 0.19, 4), ry: PI / 4 }, S(0.03, 0, 2.38, 0, 'f')];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.02, 0.3, 0.02, i * 0.1, 1.96, k * 0.1, 'f')));
  return p;
}
function trampoline() {
  const R = 1.5, p = [C(R, 0.06, 0, 0.84, 0, 'f', R, 32), C(1.2, 0.012, 0, 0.9, 0, 'jump', 1.2, 32)];
  range(6).forEach((i) => { const a = (i * PI) / 3, c = Math.cos(a), s = Math.sin(a); p.push(rod([1.42 * c, 0.84, 1.42 * s], [1.36 * c, 0.01, 1.36 * s], 0.025, 'steel')); });
  const tops = range(12).map((i) => { const a = (i * PI) / 6; return [1.48 * Math.cos(a), 2.6, 1.48 * Math.sin(a)]; });
  tops.forEach((q, i) => p.push(rod([q[0], 0.84, q[2]], q, 0.02, 'black'), rod(q, tops[(i + 1) % 12], 0.012, 'black')));
  range(24).forEach((i) => {
    const a = ((i + 0.5) * PI) / 12;
    p.push(B(0.39, 1.68, 0.008, 1.47 * Math.cos(a), 0.9, 1.47 * Math.sin(a), 'net', { ry: -(a + PI / 2) }));
  });
  return p;
}
function sandbox() {
  const p = [B(1.6, 0.3, 0.05, 0, 0, 0.775), B(1.6, 0.3, 0.05, 0, 0, -0.775), B(0.05, 0.3, 1.5, 0.775, 0, 0), B(0.05, 0.3, 1.5, -0.775, 0, 0), B(1.5, 0.2, 1.5, 0, 0, 0, 'sand')];
  [[-1, -1], [1, 1]].forEach(([i, k]) => p.push(B(0.32, 0.03, 0.32, i * 0.64, 0.3, k * 0.64, 'f2')));
  p.push(C(0.08, 0.12, 0.3, 0.2, 0.2, 'padblue', 0.06, 12), B(0.06, 0.01, 0.2, -0.2, 0.2, 0.1, 'gnomered'));
  return p;
}
function swing() {
  const p = [B(2.7, 0.12, 0.12, 0, 2.15, 0)];
  [-1.2, 1.2].forEach((x) => [-1, 1].forEach((k) => p.push(bar([x, 2.15, 0], [x, 0.035, k * 0.75], 0.1, 0.1, 'f'))));
  [[-0.55, 'padblue'], [0.55, 'gnomered']].forEach(([x, m]) => p.push(rod([x - 0.2, 2.15, 0], [x - 0.2, 0.45, 0], 0.008, 'line'), rod([x + 0.2, 2.15, 0], [x + 0.2, 0.45, 0], 0.008, 'line'), B(0.45, 0.03, 0.2, x, 0.42, 0, m)));
  return p;
}
function pergola() {
  const p = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.12, 2.4, 0.12, i * 1.44, 0, k * 1.44)));
  [-1, 1].forEach((k) => p.push(B(3.2, 0.2, 0.08, 0, 2.3, k * 1.44)));
  range(7).forEach((i) => p.push(B(0.06, 0.16, 3.3, -1.5 + i * 0.5, 2.5, 0, 'f2')));
  return p;
}
function greenhouse() {
  const W = 2.5, D = 1.9, H = 1.5, p = [B(W, H, 0.01, 0, 0.02, D / 2, 'glass'), B(W, H, 0.01, 0, 0.02, -D / 2, 'glass'), B(0.01, H, D, W / 2, 0.02, 0, 'glass'),
    B(0.01, H, D, -W / 2, 0.02, 0, 'glass'), prof([[-D / 2, H + 0.02], [D / 2, H + 0.02], [0, 2.2]], W, 0, 'glass'), B(W, 0.04, 0.04, 0, 2.17, 0, 'f')];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.04, H + 0.02, 0.04, i * (W / 2 - 0.02), 0, k * (D / 2 - 0.02), 'f')));
  [-1, 1].forEach((k) => {
    p.push(B(W, 0.04, 0.04, 0, H, k * (D / 2 - 0.02), 'f'), B(W, 0.06, 0.04, 0, 0, k * (D / 2 - 0.02), 'f'));
    range(4).forEach((i) => p.push(B(0.03, H, 0.03, -0.75 + i * 0.5, 0.02, k * (D / 2 - 0.01), 'f')));
  });
  p.push(B(2.2, 0.03, 0.5, 0, 0.8, -0.6, 'workwood'), ...legs(2.1, 0.45, 0.8, 0.03, 0, 'f'));
  range(5).forEach((i) => p.push(C(0.07, 0.12, -0.8 + i * 0.4, 0.83, -0.6, 'pot', 0.05, 12), S(0.08, -0.8 + i * 0.4, 0.93, -0.6, 'leaf')));
  return p;
}
function gardenShed() {
  const W = 2.4, D = 2.0, H = 2.0, p = [B(W, H, 0.06, 0, 0, D / 2 - 0.03), B(W, H, 0.06, 0, 0, -D / 2 + 0.03), B(0.06, H, D - 0.12, W / 2 - 0.03, 0, 0), B(0.06, H, D - 0.12, -W / 2 + 0.03, 0, 0),
    prof([[-D / 2, H], [D / 2, H], [0, 2.5]], W, 0, 'f'), B(0.9, 1.85, 0.02, -0.5, 0.02, D / 2 + 0.01, 'f2'), B(0.03, 0.03, 0.05, -0.15, 1.0, D / 2 + 0.035, 'steel'),
    B(0.02, 0.5, 0.7, W / 2 + 0.005, 1.1, 0, 'glass'), B(0.62, 0.6, 0.02, 0.6, 1.0, D / 2 + 0.005, 'glass')];
  const s = Math.atan2(0.55, 1.15);
  [-1, 1].forEach((k) => p.push(tilted(W + 0.2, Math.hypot(0.55, 1.15) + 0.1, 0.04, 0, 2.245, k * 0.575, k * -(PI / 2 - s), 'roofing')));
  range(6).forEach((i) => p.push(hline(W, 0, 0.3 + i * 0.3, D / 2 + 0.001), hline(W, 0, 0.3 + i * 0.3, -D / 2 - 0.001)));
  return p;
}
function mailbox() {
  return [B(0.08, 1.0, 0.08, 0, 0, -0.03, 'f2'), B(0.38, 0.32, 0.15, 0, 1.0, 0, 'f'), hline(0.25, 0, 1.25, 0.076), B(0.1, 0.03, 0.004, 0, 1.12, 0.077, 'white'),
    B(0.38, 0.1, 0.13, 0, 0.88, 0, 'f2'), B(0.28, 0.2, 0.2, 0, 0, -0.03, 'f2')];
}
function gnome() {
  return [B(0.05, 0.04, 0.08, -0.035, 0, 0.01, 'black'), B(0.05, 0.04, 0.08, 0.035, 0, 0.01, 'black'), C(0.08, 0.1, 0, 0.04, 0, 'gnomeblue', 0.09, 14),
    C(0.07, 0.12, 0, 0.13, 0, 'gnomered', 0.085, 14), C(0.082, 0.015, 0, 0.17, 0, 'black', 0.082, 14), S(0.055, 0, 0.24, 0.005, 'skin'), S(0.05, 0, 0.2, 0.04, 'beard', 1, 1.1, 0.7),
    S(0.015, 0, 0.27, 0.06, 'skin'), C(0.003, 0.16, 0, 0.32, -0.005, 'gnomered', 0.06, 14), S(0.03, -0.085, 0.15, 0.01, 'gnomered', 1, 1.6, 1), S(0.03, 0.085, 0.15, 0.01, 'gnomered', 1, 1.6, 1)];
}
function birdBath() {
  return [C(0.15, 0.05, 0, 0, 0, 'f', 0.18, 16), C(0.07, 0.6, 0, 0.05, 0, 'f', 0.09, 16), C(0.3, 0.08, 0, 0.65, 0, 'f', 0.14, 24), C(0.27, 0.01, 0, 0.72, 0, 'water', 0.27, 24)];
}
function rotaryDryer() {
  const p = [C(0.02, 1.8, 0, 0, 0, 'f', 0.02, 10)], corner = (r, i) => { const a = PI / 4 + (i * PI) / 2; return [r * Math.cos(a), 1.72, r * Math.sin(a)]; };
  range(4).forEach((i) => p.push(rod([0, 1.6, 0], corner(1.3, i), 0.012, 'f')));
  [0.45, 0.8, 1.15].forEach((r) => range(4).forEach((i) => p.push(rod(corner(r, i), corner(r, (i + 1) % 4), 0.003, 'line', 6))));
  const z = 0.8 * Math.SQRT1_2;
  p.push(B(0.4, 0.55, 0.01, -0.25, 1.17, z, 'cloth2'), B(0.4, 0.55, 0.01, 0.25, 1.17, z, 'cloth4'));
  return p;
}
function steppingStones() {
  return [[0.05, -1.0, 0.2], [-0.06, -0.5, 0.18], [0.06, 0, 0.21], [-0.05, 0.5, 0.19], [0.04, 1.0, 0.2]].map(([x, z, r]) => C(r, 0.03, x, 0, z, 'f', r, 10));
}
function composter() {
  const p = [B(0.94, 0.55, 0.94, 0, 0, 0, 'soil')];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.05, 0.85, 0.05, i * 0.475, 0, k * 0.475, 'f2')));
  range(5).forEach((i) => {
    const y = 0.04 + i * 0.16;
    p.push(B(1.0, 0.1, 0.03, 0, y, 0.485), B(1.0, 0.1, 0.03, 0, y, -0.485), B(0.03, 0.1, 0.94, 0.485, y, 0), B(0.03, 0.1, 0.94, -0.485, y, 0));
  });
  return p;
}
function loungeSet() {
  return [B(2.2, 0.38, 0.8, 0, 0, -0.7), B(2.2, 0.35, 0.15, 0, 0.38, -1.025), B(0.8, 0.38, 1.4, -0.7, 0, 0.4), B(0.15, 0.35, 1.4, -1.025, 0.38, 0.4),
    B(0.12, 0.22, 0.8, 1.04, 0.38, -0.7), B(0.8, 0.22, 0.12, -0.7, 0.38, 1.04),
    B(1.95, 0.12, 0.64, 0.03, 0.38, -0.66, 'cushion'), B(0.64, 0.12, 1.28, -0.66, 0.38, 0.39, 'cushion'),
    ...range(3).map((i) => tilted(0.6, 0.42, 0.14, -0.55 + i * 0.62, 0.69, -0.86, -0.2, 'cushion')),
    ...range(2).map((i) => at(turnAll([tilted(0.6, 0.42, 0.14, 0, 0.69, 0, -0.2, 'cushion')], PI / 2), -0.86, 0, 0.1 + i * 0.62)[0]),
    B(0.9, 0.33, 0.6, 0.45, 0, 0.45), B(0.86, 0.02, 0.56, 0.45, 0.33, 0.45, 'glass')];
}

/** the pieces: cat (library group), label (German, the translations are in i18n.js / lang/*.js), fin (the finishes, the first is the
 *  default), search (more words the library search finds it by), round (round footprint), icon (of the ball to tap in the live mode),
 *  flat (lies on the ground: drawn under the rest of the plan), parts() */
const WOOD = ['teak', 'larch', 'white', 'anthracite'];
export const YARD = {
  hedge: { cat: 'outdoor', label: 'Hecke (2 m)', fin: ['hedge', 'conifer', 'boxwood'], search: 'hecke heckenpflanze sichtschutz liguster thuja kirschlorbeer garten', parts: hedge },
  garden_bench: { cat: 'outdoor', label: 'Gartenbank', fin: WOOD, search: 'gartenbank bank parkbank sitzbank holzbank garten terrasse', parts: gardenBench },
  garden_set: { cat: 'outdoor', label: 'Gartentisch mit 4 Stühlen', fin: WOOD, search: 'gartentisch gartenstühle gartenstuehle sitzgruppe gartenmöbel gartenmoebel terrasse essen', parts: gardenSet },
  sun_lounger: { cat: 'outdoor', label: 'Sonnenliege', fin: ['white', 'anthracite', 'teak', 'rattan'], search: 'sonnenliege liege gartenliege relaxliege pool terrasse', parts: lounger },
  parasol: { cat: 'outdoor', label: 'Sonnenschirm', fin: ['beige', 'white', 'grey', 'terracotta', 'green', 'blue'], search: 'sonnenschirm schirm schatten ampelschirm terrasse', round: true, parts: parasol },
  grill_kettle: { cat: 'outdoor', label: 'Kugelgrill', fin: ['black', 'red', 'anthracite', 'green'], search: 'grill kugelgrill holzkohle grillen bbq barbecue weber', icon: '🔥', round: true, parts: kettleGrill },
  grill_gas: { cat: 'outdoor', label: 'Gasgrill', fin: ['black', 'silver', 'anthracite', 'red'], search: 'gasgrill grill grillen bbq barbecue outdoorküche outdoorkueche', icon: '🔥', parts: gasGrill },
  fire_bowl: { cat: 'outdoor', label: 'Feuerschale', fin: ['rust', 'black', 'anthracite'], search: 'feuerschale feuerstelle feuer lagerfeuer feuerkorb cortenstahl', icon: '🔥', round: true, parts: fireBowl },
  raised_bed: { cat: 'outdoor', label: 'Hochbeet', fin: ['larch', 'teak', 'anthracite', 'galvanized'], search: 'hochbeet beet gemüse gemuese kräuter kraeuter salat garten', parts: raisedBed },
  planter: { cat: 'outdoor', label: 'Pflanzkübel mit Buchskugel', fin: ['anthracite', 'terracotta', 'white', 'rust', 'granite'], search: 'pflanzkübel pflanzkuebel kübel kuebel buchs buchskugel blumentopf terrasse eingang', parts: planter },
  flowers: { cat: 'outdoor', label: 'Blumen (Staude)', fin: [], search: 'blumen staude stauden blüten blueten pflanzen beet', parts: flowers },
  garden_lamp: { cat: 'outdoor', label: 'Pollerleuchte', fin: ['anthracite', 'black', 'galvanized', 'white'], search: 'pollerleuchte gartenleuchte wegeleuchte außenleuchte aussenleuchte licht weg', icon: '💡', round: true, parts: gardenLamp },
  lamp_post: { cat: 'outdoor', label: 'Gartenlaterne', fin: ['black', 'anthracite', 'green', 'white'], search: 'laterne gartenlaterne mastleuchte außenleuchte aussenleuchte licht einfahrt', icon: '💡', parts: lampPost },
  trampoline: { cat: 'outdoor', label: 'Trampolin (Ø 3 m)', fin: ['green', 'blue', 'black', 'grey'], search: 'trampolin gartentrampolin springen kinder netz', round: true, parts: trampoline },
  sandbox: { cat: 'outdoor', label: 'Sandkasten', fin: ['larch', 'pine', 'teak', 'green'], search: 'sandkasten sandkiste sand spielen kinder', parts: sandbox },
  swing: { cat: 'outdoor', label: 'Doppelschaukel', fin: ['larch', 'pine', 'teak', 'anthracite'], search: 'schaukel doppelschaukel schaukelgestell spielplatz kinder', parts: swing },
  pergola: { cat: 'outdoor', label: 'Pergola (3 × 3 m)', fin: ['larch', 'anthracite', 'white', 'teak'], search: 'pergola laube rankgerüst rankgeruest überdachung ueberdachung terrasse', parts: pergola },
  greenhouse: { cat: 'outdoor', label: 'Gewächshaus', fin: ['alu', 'green', 'anthracite', 'white'], search: 'gewächshaus gewaechshaus treibhaus glashaus tomaten pflanzen garten', parts: greenhouse },
  garden_shed: { cat: 'outdoor', label: 'Gartenhaus', fin: ['larch', 'anthracite', 'white', 'green'], search: 'gartenhaus gerätehaus geraetehaus schuppen gartenhütte gartenhuette holzhaus', parts: gardenShed },
  mailbox: { cat: 'outdoor', label: 'Briefkasten mit Pfosten', fin: ['anthracite', 'galvanized', 'red', 'black', 'white'], search: 'briefkasten post pfosten standbriefkasten zeitung einfahrt', icon: '📬', parts: mailbox },
  bird_bath: { cat: 'outdoor', label: 'Vogeltränke', fin: ['sandstone', 'granite', 'white'], search: 'vogeltränke vogeltraenke vogelbad vögel voegel wasser garten', round: true, parts: birdBath },
  rotary_dryer: { cat: 'outdoor', label: 'Wäschespinne', fin: ['alu', 'white', 'anthracite'], search: 'wäschespinne waeschespinne wäscheleine waescheleine trocknen wäsche waesche', round: true, parts: rotaryDryer },
  stepping_stones: { cat: 'outdoor', label: 'Trittsteine (5 Stück)', fin: ['granite', 'sandstone', 'grey'], search: 'trittsteine trittplatten steine weg rasen gartenweg', flat: true, parts: steppingStones },
  composter: { cat: 'outdoor', label: 'Komposter', fin: ['larch', 'green', 'anthracite'], search: 'komposter kompost biomüll biomuell garten erde', parts: composter },
  lounge_set: { cat: 'outdoor', label: 'Lounge-Ecke', fin: ['rattan', 'anthracite', 'teak', 'white'], search: 'lounge loungemöbel loungemoebel gartensofa ecksofa rattan terrasse', parts: loungeSet },
  garden_gnome: { cat: 'outdoor', label: 'Gartenzwerg', fin: [], search: 'gartenzwerg zwerg gnom deko garten', parts: gnome },
};
/** what lies flat on the ground (plan2d.js draws it under the rest) */
export const YARD_FLAT = Object.keys(YARD).filter((k) => YARD[k].flat);
