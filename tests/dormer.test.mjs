// Unit tests for dormer.js (run: cp floorplan3d/rootfs/app/static/dormer.js /tmp/dormer.mjs && DORMER_MJS=/tmp/dormer.mjs node --test tests/dormer.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const D = await import(process.env.DORMER_MJS || '/tmp/dormer.mjs');
const bb = { x0: 0, x1: 10, z0: 0, z1: 6 };                       // ridge along x (the longer side), 6 m across
const roof = { type: 'gable', pitch: 35, overhang: 0.4 };
const flat = (tris) => tris.flat();
const maxY = (tris) => Math.max(...tris.map((p) => p[1]));

test('a dormer on a gable roof gives wall, roof and window', () => {
  const p = D.dormerParts(bb, roof, { side: 0, pos: 0.5 });
  assert.ok(p.wall.length > 0 && p.roof.length > 0 && p.glass.length > 0);
  assert.equal(p.wall.length % 3, 0);
  assert.equal(p.roof.length % 3, 0);
});

test('the dormer stays below the ridge of the main roof', () => {
  const ridge = (3 + 0.4) * Math.tan((35 * Math.PI) / 180);
  const p = D.dormerParts(bb, roof, { side: 1, pos: 0.2, hw: 99, eave: 0.2 });          // far too high: gets clamped
  assert.ok(maxY([...p.wall, ...p.roof]) < ridge, `${maxY([...p.wall, ...p.roof])} < ${ridge}`);
});

test('side 0 lies on the low-z slope, side 1 on the high-z slope', () => {
  const a = D.dormerParts(bb, roof, { side: 0 }).fit, b = D.dormerParts(bb, roof, { side: 1 }).fit;
  const za = D.dormerParts(bb, roof, { side: 0 }).wall.map((p) => p[2]), zb = D.dormerParts(bb, roof, { side: 1 }).wall.map((p) => p[2]);
  assert.ok(Math.max(...za) < 3, 'side 0 stays on the near half');
  assert.ok(Math.min(...zb) > 3, 'side 1 stays on the far half');
  assert.equal(a.side, 0); assert.equal(b.side, 1);
});

test('position moves the dormer along the ridge and stays on the roof', () => {
  const xs = (pos) => D.dormerParts(bb, roof, { pos }).wall.map((p) => p[0]);
  assert.ok(Math.min(...xs(0)) >= -0.4 && Math.max(...xs(1)) <= 10.4, 'inside the roof ends');
  assert.ok(Math.max(...xs(0)) < Math.min(...xs(1)), 'left is left of right');
});

test('a flat roof and a roof that is too small have no dormers', () => {
  assert.equal(D.dormerParts(bb, { ...roof, type: 'flat' }, {}), null);
  assert.equal(D.dormerParts({ x0: 0, x1: 1, z0: 0, z1: 1 }, roof, { w: 3 }), null);
  assert.equal(D.dormerParts(null, roof, {}), null);
});

test('flat dormer roof is horizontal, gable roof has a ridge', () => {
  const f = D.dormerParts(bb, roof, { type: 'flat', win: false });
  assert.equal(f.glass.length, 0);
  assert.equal(new Set(f.roof.map((p) => +p[1].toFixed(6))).size, 1, 'one height');
  const g = D.dormerParts(bb, roof, { type: 'gable' });
  assert.ok(new Set(g.roof.map((p) => +p[1].toFixed(6))).size > 1);
});

test('values are clamped and defaults filled in', () => {
  const n = D.fitDormer(bb, roof, { w: 0, hw: 0, eave: -5, pos: 7, type: 'nonsense', side: 5 });
  assert.ok(n.w >= 0.6 && n.hw >= 0.4 && n.eave >= 0.2 && n.pos === 1 && n.type === 'gable' && n.side === 0);
});

test('works with the ridge along z too', () => {
  const p = D.dormerParts({ x0: 0, x1: 6, z0: 0, z1: 10 }, roof, { side: 0 });
  assert.ok(p && Math.max(...p.wall.map((q) => q[0])) < 3 && flat(p.wall).every(Number.isFinite));
});

test('dormerWindow: the window in the front wall, the same size as the glass pane', () => {
  const n = D.fitDormer(bb, roof, { side: 0, pos: 0.5, w: 2, hw: 1.2 });
  const win = D.dormerWindow(n);
  assert.ok(Math.abs(win.width - 1.28) < 1e-9 && Math.abs(win.height - 0.8) < 1e-9 && win.sill === 0.22);
  assert.ok(Math.abs(Math.hypot(win.b[0] - win.a[0], win.b[1] - win.a[1]) - 2) < 1e-9, 'the front wall is as wide as the dormer');
  assert.equal(D.dormerWindow(D.fitDormer(bb, roof, { win: false })), null);
  assert.equal(D.dormerWindow(null), null);
});

// ---- shed dormer (Schleppgaube, #339), start along the ridge, hole in the main roof
const tan35 = Math.tan((35 * Math.PI) / 180);
const area = (tris) => { let s = 0; for (let i = 0; i < tris.length; i += 3) { const [a, b, c] = [tris[i], tris[i + 1], tris[i + 2]];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  s += Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2; } return s; };

test('shed dormer: its roof is one plane that runs up flatter than the main roof and meets it below the ridge', () => {
  const p = D.dormerParts(bb, roof, { type: 'shed', side: 0, w: 4, hw: 1, eave: 0.4, win: false });
  const n = p.fit, ts = Math.tan((15 * Math.PI) / 180);
  assert.equal(n.sp, 15, 'the default pitch');
  assert.ok(Math.abs(n.ts - ts) < 1e-12 && n.gh === 0);
  for (const q of p.roof) {                                        // every corner on the plane y = yT + (e - eave) * ts (z = e - 0.4 on side 0)
    const e = q[2] + 0.4;
    assert.ok(Math.abs(q[1] - (n.yT + (e - n.eave) * ts)) < 1e-9, `${q} on the shed plane`);
  }
  const back = p.roof.filter((q) => Math.abs(q[2] + 0.4 - n.eR) < 1e-9);
  assert.ok(back.length > 0 && back.every((q) => Math.abs(q[1] - n.eR * tan35) < 1e-9), 'the back edge lies on the main slope');
  assert.ok(n.eR < 3.4 && n.eT === n.eR, 'meets the main roof before the ridge');
});

test('shed dormer: stays below the ridge, its pitch stays flatter than the main roof', () => {
  const ridge = 3.4 * tan35;
  const p = D.dormerParts(bb, roof, { type: 'shed', hw: 99, eave: 0.4 });
  assert.ok(maxY([...p.wall, ...p.roof]) < ridge, `${maxY([...p.wall, ...p.roof])} < ${ridge}`);
  const big = { x0: 0, x1: 12, z0: 0, z1: 10 }, bigRidge = 5.4 * tan35, low = { type: 'shed', hw: 0.5, eave: 0.4 };
  const steep = D.fitDormer(big, roof, { ...low, sp: 80 });          // the steepest roof that still meets the main roof below the ridge
  assert.ok(steep.sp > 25 && steep.sp <= 32 && steep.eR * tan35 < bigRidge, `${steep.sp}: never steeper than 3° under the main roof`);
  assert.equal(D.fitDormer(big, roof, { ...low, sp: 0.5 }).sp, 2);
  assert.equal(D.fitDormer(big, roof, { ...low, sp: 'x' }).sp, 15);
  const high = D.fitDormer(big, roof, { type: 'shed', hw: 2.2, eave: 0.4, sp: 15 });   // a high wall: the wall stays, the roof gets flatter
  assert.ok(high.hw === 2.2 && high.sp < 15 && high.eR * tan35 < bigRidge, `${high.sp}`);
  const top = D.fitDormer(bb, roof, { type: 'shed', hw: 3, eave: 0.4 });            // too high for this roof: the wall gets lower too
  assert.ok(top.sp === 2 && top.hw < 3 && top.eR * tan35 < ridge);
});

test('shed and flat dormers may be long, a gable dormer stays at most 5 m wide', () => {
  assert.equal(D.fitDormer(bb, roof, { type: 'shed', w: 7 }).w, 7);
  assert.equal(D.fitDormer(bb, roof, { type: 'flat', w: 7 }).w, 7);
  assert.equal(D.fitDormer(bb, roof, { type: 'gable', w: 7 }).w, 5);
  assert.equal(D.fitDormer(bb, roof, { type: 'shed', w: 12 }), null, 'longer than the roof');
});

test('the window of a long shed dormer stays window-sized and in the middle of its front', () => {
  const n = D.fitDormer(bb, roof, { type: 'shed', w: 6, hw: 1.6 }), win = D.dormerWindow(n);
  assert.equal(win.width, 1.2);
  assert.ok(Math.abs(Math.hypot(win.b[0] - win.a[0], win.b[1] - win.a[1]) - 6) < 1e-9, 'the front wall is the whole dormer');
  assert.ok(Math.abs(D.dormerWindow(D.fitDormer(bb, roof, { type: 'flat', w: 2 })).width - 1.28) < 1e-9, 'other dormers as before');
});

test('start along the ridge: metres from the gable end of the house, and back to pos', () => {
  const d = { type: 'shed', w: 4 };
  assert.ok(Math.abs(D.dormerStart(bb, roof, { ...d, pos: 0 }) - (-0.4 + 0.1)) < 1e-9, 'pos 0: right after the roof edge');
  const pos = D.posForStart(bb, roof, d, 3.5);
  assert.ok(Math.abs(D.dormerStart(bb, roof, { ...d, pos }) - 3.5) < 1e-9, 'begins 3.5 m from the gable');
  assert.equal(D.posForStart(bb, roof, d, 99), 1, 'as far as the roof goes');
  assert.equal(D.posForStart(bb, roof, d, -9), 0);
  const zr = { x0: 0, x1: 6, z0: 2, z1: 12 };                     // ridge along z: measured from z0
  assert.ok(Math.abs(D.dormerStart(zr, roof, { ...d, pos: D.posForStart(zr, roof, d, 1) }) - 1) < 1e-9);
  assert.equal(D.dormerStart(bb, { ...roof, type: 'flat' }, d), null);
  assert.equal(D.posForStart(bb, { ...roof, type: 'flat' }, { pos: 0.3 }, 2), 0.3);
});

/** the roof as it was drawn before #339 (no holes) */
function oldRoof(bb, r) {
  const F = D.roofFrame(bb, r), h = F.half * F.tan, bc = (F.b0 + F.b1) / 2, { a0, a1, b0, b1, ins } = F, tris = [];
  const P = (a, b, y) => (F.alongX ? [a, y, b] : [b, y, a]), quad = (p, q, u, v) => tris.push(p, q, u, p, u, v);
  quad(P(a0, b0, 0), P(a1, b0, 0), P(a1 - ins, bc, h), P(a0 + ins, bc, h));
  quad(P(a1, b1, 0), P(a0, b1, 0), P(a0 + ins, bc, h), P(a1 - ins, bc, h));
  tris.push(P(a0, b1, 0), P(a0, b0, 0), P(a0 + ins, bc, h), P(a1, b0, 0), P(a1, b1, 0), P(a1 - ins, bc, h));
  return tris;
}

test('roof surface: without dormers the same roof as before (gable and hip, ridge along x or z)', () => {
  for (const r of [roof, { ...roof, type: 'hip' }, { ...roof, ridge: 'z' }]) {
    const s = D.roofSurface(bb, r);
    assert.ok(Math.abs(area(s) - area(oldRoof(bb, r))) < 1e-9, r.type);
    assert.equal(s.length % 3, 0);
  }
});

test('roof surface: a hole under every dormer, as big as the dormer where it meets the slope', () => {
  for (const r0 of [roof, { ...roof, type: 'hip' }]) {
    const r = { ...r0, dormers: [{ type: 'shed', side: 0, pos: 0.3, w: 2.5, hw: 1.5, eave: 0.4 }, { type: 'gable', side: 1, pos: 0.6 }] };
    const s = D.roofSurface(bb, r), ns = r.dormers.map((d) => D.fitDormer(bb, r, d));
    const hole = ns.reduce((sum, n) => sum + (n.w * (n.eT - n.eave)) / Math.cos((35 * Math.PI) / 180), 0);
    assert.ok(Math.abs(area(oldRoof(bb, r)) - area(s) - hole) < 1e-9, `${r.type}: ${area(oldRoof(bb, r)) - area(s)} = ${hole}`);
    for (let i = 0; i < s.length; i += 3) {                        // nothing of the slope is left inside a dormer
      const cx = (s[i][0] + s[i + 1][0] + s[i + 2][0]) / 3, cz = (s[i][2] + s[i + 1][2] + s[i + 2][2]) / 3;
      for (const n of ns) {
        const e = n.side === 0 ? cz + 0.4 : 6.4 - cz;
        assert.ok(!(Math.abs(cx - n.at) < n.w / 2 - 1e-6 && e > n.eave + 1e-6 && e < n.eT - 1e-6), `triangle ${i / 3} under a dormer`);
      }
    }
  }
});

test('front wall with holes (#341): the windows of the wall behind show through, the rest stays closed', () => {
  const d = { type: 'shed', side: 0, pos: 0.5, w: 6, hw: 1.6, eave: 0.4, sp: 10, win: false };
  const n = D.fitDormer(bb, roof, d), front = (p) => p.wall.slice(0, p.wall.length - 6);   // the two cheeks come last
  const full = area(front(D.dormerParts(bb, roof, d)));
  assert.ok(Math.abs(full - 6 * (n.yT - n.yF + 0.05)) < 1e-9);
  const holes = [{ u0: -2, u1: -1, y0: n.yF + 0.3, y1: n.yF + 1.2 }, { u0: 1, u1: 2, y0: n.yF + 0.3, y1: n.yF + 1.2 }];
  const p = D.dormerParts(bb, roof, d, holes), f = front(p);
  assert.ok(Math.abs(area(f) - (full - 2 * 0.9)) < 1e-9, 'two holes of 1 x 0.9 m');
  for (let i = 0; i < f.length; i += 3) {
    const u = (f[i][0] + f[i + 1][0] + f[i + 2][0]) / 3 - n.at, y = (f[i][1] + f[i + 1][1] + f[i + 2][1]) / 3;
    assert.ok(!holes.some((h) => u > h.u0 && u < h.u1 && y > h.y0 && y < h.y1), 'nothing of the front wall in a hole');
  }
  assert.equal(p.roof.length, D.dormerParts(bb, roof, d).roof.length, 'the roof of the dormer stays');
});
