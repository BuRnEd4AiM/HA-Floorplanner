// Unit tests for roofcut.js (#621: the roofs of an L-shaped house cut into each other; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const C = await import(`${dir}/roofcut.js`);
const D = await import(`${dir}/dormer.js`);
const S = await import(`${dir}/roofshape.js`);

const inside = (solids, [x, y, z], m = 0) => solids.some((s) => s.every(([nx, ny, nz, d]) => nx * x + ny * y + nz * z + d + m < 0));   // m: deeper inside than that
const area = (tris) => {
  let a = 0;
  for (let i = 0; i < tris.length; i += 3) {
    const [p, q, u] = tris.slice(i, i + 3), v = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], w = [u[0] - p[0], u[1] - p[1], u[2] - p[2]];
    a += Math.hypot(v[1] * w[2] - v[2] * w[1], v[2] * w[0] - v[0] * w[2], v[0] * w[1] - v[1] * w[0]) / 2;
  }
  return a;
};
const normal = (p, q, u) => { const v = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], w = [u[0] - p[0], u[1] - p[1], u[2] - p[2]]; return [v[1] * w[2] - v[2] * w[1], v[2] * w[0] - v[0] * w[2], v[0] * w[1] - v[1] * w[0]]; };
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

const mb = { x0: 0, x1: 10, z0: 0, z1: 6 };                      // the main roof: ridge along x at z 3
const main = { type: 'gable', pitch: 35, overhang: 0.4 };
const wb = { x0: 6, x1: 10, z0: 3, z1: 12 };                     // the wing: from the main ridge to z 12, its ridge along z at x 8
const wing = { type: 'gable', pitch: 35, overhang: 0.4, ridge: 'z' };
const tan35 = Math.tan((35 * Math.PI) / 180);

test('solid: a gable roof is the space under its two slopes over its base, out to its overhang', () => {
  const s = C.roofSolids(mb, main), F = S.roofFrame(mb, main);
  assert.equal(s.length, 1);
  assert.ok(inside(s, [5, 0.5, 3]) && inside(s, [5, F.h - 0.05, 3]) && !inside(s, [5, F.h + 0.05, 3]));
  assert.ok(inside(s, [-0.3, 0.1, 3]) && !inside(s, [-0.5, 0.1, 3]), 'to the end of the gable overhang');
  assert.ok(!inside(s, [5, -0.1, 3]), 'not under the base');
  assert.ok(inside(s, [5, 0.01, -0.35]) && !inside(s, [5, 0.01, -0.45]), 'to the eave');
  for (const p of S.roofFrame(mb, main) && D.roofSurface(mb, main)) assert.ok(!inside(s, p), 'its own surface is not inside it');
});
test('solid: hip, shed and steps; a flat roof cuts nothing', () => {
  const hip = C.roofSolids(mb, { ...main, type: 'hip' });
  assert.ok(inside(hip, [5, 1, 3]) && !inside(hip, [0, 2, 3]), 'the hip end leans in');
  const shed = C.roofSolids(mb, { type: 'shed', pitch: 10, overhang: 0.3, high: 'z0' }), h = 6.3 * Math.tan((10 * Math.PI) / 180);
  assert.ok(inside(shed, [5, h - 0.05, 0.01]) && !inside(shed, [5, 0.05, 6.29]) && inside(shed, [5, 0.02, 6]) && !inside(shed, [5, 0.1, -0.1]));
  const steps = C.roofSolids(mb, { ...main, steps: [{ side: 1, at: 5, out: 2 }] });
  assert.equal(steps.length, 2, 'one piece per stretch');
  assert.ok(inside(steps, [8, 0.05, 8.2]) && !inside(steps, [2, 0.05, 8.2]), 'the eave further out only from the step on');
  assert.deepEqual(C.roofSolids(mb, { type: 'flat' }), []);
  assert.deepEqual(C.roofSolids(null, main), []);
});

test('L-shaped house: the wing loses what lies inside the main roof, the main roof the slope under the wing (#621)', () => {
  const ms = C.roofSolids(mb, main), ws = C.roofSolids(wb, wing);
  const mt = D.roofSurface(mb, main), wt = D.roofSurface(wb, wing);
  const mc = C.cutTris(mt, ws), wc = C.cutTris(wt, ms);
  assert.ok(area(mc) < area(mt) - 1 && area(wc) < area(wt) - 1, 'both lose a part');
  assert.ok(mc.every((p) => !inside(ws, p, 1e-3)) && wc.every((p) => !inside(ms, p, 1e-3)), 'nothing is left inside the other roof');
  const cent = (tris) => tris.flatMap((p, i) => (i % 3 ? [] : [[0, 1, 2].map((k) => (tris[i][k] + tris[i + 1][k] + tris[i + 2][k]) / 3)]));
  assert.ok(!cent(mc).some(([x, , z]) => x > 7.5 && x < 8.5 && z > 4 && z < 6), 'the main slope under the wing\'s ridge is gone');
  // the main slope keeps its middle on either side of the wing, and the wing its part outside the main roof
  const mid = (tris, x, z) => tris.some((p, i) => i % 3 === 0 && (() => { const t = tris.slice(i, i + 3), cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cz = (t[0][2] + t[1][2] + t[2][2]) / 3; return Math.abs(cx - x) < 1.5 && Math.abs(cz - z) < 1.5; })());
  assert.ok(mid(mc, 2, 4.5), 'the main slope beside the wing stays');
  assert.ok(mid(wc, 8, 10), 'the wing outside the main roof stays');
  // the cut runs along the valley: a point of the wing's slope just outside the main roof is kept, just inside it is cut
  const F = S.roofFrame(mb, main), mainY = (z) => F.h * (6.4 - z) / 3.4, wingY = (x) => (x <= 8 ? (x - 5.6) : (10.4 - x)) * tan35;
  // on x = 7 the wing slope (y 1.4 tan35) meets the main slope where mainY(z) equals it
  const zv = 6.4 - (wingY(7) * 3.4) / F.h;
  assert.ok(near(mainY(zv), wingY(7)));
  const edge = wc.filter((p) => near(p[0], 7, 0.02) && p[2] < zv + 0.5);
  assert.ok(wc.some((p) => p[2] < 6.4 && p[2] > 3.5), 'the wing reaches into the main roof up to the valley');
  assert.ok(edge.every((p) => p[2] >= zv - 0.02), 'not further');
  const zmin = Math.min(...wc.map((p) => p[2]));                   // nothing is left along its eave inside the main roof either
  assert.ok(zmin > 6.4 - (wingY(8) * 3.4) / F.h - 0.02, `${zmin}`);
  // every piece kept faces the way its triangle did (up)
  for (let i = 0; i < wc.length; i += 3) assert.ok(normal(wc[i], wc[i + 1], wc[i + 2])[1] > -1e-9);
});
test('cut: roofs that only touch keep everything; a roof lower down is moved into the frame (liftSolids)', () => {
  const ms = C.roofSolids(mb, main), apart = { x0: 20, x1: 24, z0: 0, z1: 6 };
  const t = D.roofSurface(apart, main);
  assert.deepEqual(C.cutTris(t, ms), t, 'untouched');
  const mt = D.roofSurface(mb, main);
  assert.ok(near(area(C.cutTris(mt, C.roofSolids(mb, main))), area(mt), 1e-6), 'a roof does not cut its own surface');
  const next = { x0: 10, x1: 16, z0: 0, z1: 6 }, nt = D.roofSurface(next, main);   // the house goes on along the ridge: the slopes lie in one plane
  assert.ok(near(area(C.cutTris(nt, ms)), area(nt), 1e-6) && near(area(C.cutTris(mt, C.roofSolids(next, main))), area(mt), 1e-6), 'one roof in the slope of the other stays');
  const high = C.liftSolids(C.roofSolids(wb, wing), 10);          // the wing 10 m higher: it no longer reaches the main roof
  assert.ok(near(area(C.cutTris(mt, high)), area(mt), 1e-6));
  assert.ok(area(C.cutTris(mt, C.liftSolids(C.roofSolids(wb, wing), 0))) < area(mt) - 1);
});
