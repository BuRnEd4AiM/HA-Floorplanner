// Unit tests for housespin.js (🏠 the turning house on the Start page, 5.28.0; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/housespin.js`);
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('the camera looks at the middle of the house, from above, at the same distance all the way round', () => {
  const b = { cx: 5, cz: -3, size: 12 };
  const dists = [0, 1, 2, 3, 4, 5, 6].map((a) => {
    const p = S.spinPose(b, 0, 6, a);
    assert.deepEqual(p.target, [5, 3, -3]);
    assert.ok(p.pos[1] > 3, 'from above');
    return Math.hypot(p.pos[0] - 5, p.pos[1] - 3, p.pos[2] + 3);
  });
  dists.forEach((d) => assert.ok(near(d, dists[0])));
  const a0 = S.spinPose(b, 0, 6, 0);
  assert.ok(near(a0.pos[0], 5) && a0.pos[2] > -3, 'angle 0: on the +z side');
});

test('a bigger or taller house, a narrower picture: the camera goes further away', () => {
  const d = (b, y1, opt) => { const p = S.spinPose(b, 0, y1, 0, opt); return Math.hypot(p.pos[0] - p.target[0], p.pos[1] - p.target[1], p.pos[2] - p.target[2]); };
  const small = { cx: 0, cz: 0, size: 8 }, big = { cx: 0, cz: 0, size: 20 };
  assert.ok(d(big, 6) > d(small, 6));
  assert.ok(d(small, 12) > d(small, 6));
  assert.ok(d(small, 6, { aspect: 0.6 }) > d(small, 6, { aspect: 2 }), 'portrait: the width limits');
  assert.ok(d(small, 6, { fill: 1.5 }) < d(small, 6, { fill: 1 }), 'fill: closer');
});

test('the whole house fits: every corner of its box lies inside the field of view (with SPIN_FILL 1 at least)', () => {
  const b = { cx: 2, cz: 1, size: 14 }, y0 = 0, y1 = 8, fov = 50, aspect = 2.2;
  for (const a of [0, 0.4, 1.3, 2.9, 4.4]) {
    const p = S.spinPose(b, y0, y1, a, { fov, aspect, fill: 1 });
    const [px, py, pz] = p.pos, [tx, ty, tz] = p.target;
    const f = [tx - px, ty - py, tz - pz], fl = Math.hypot(...f); f.forEach((_, i) => { f[i] /= fl; });
    for (const x of [b.cx - 7, b.cx + 7]) for (const z of [b.cz - 7, b.cz + 7]) for (const y of [y0, y1]) {
      const v = [x - px, y - py, z - pz], vl = Math.hypot(...v);
      const ang = Math.acos((v[0] * f[0] + v[1] * f[1] + v[2] * f[2]) / vl);
      assert.ok(ang < (fov * Math.PI) / 360 + 1e-9, `corner ${x},${y},${z} at ${a}`);
    }
  }
});

test('odd input does not break it', () => {
  const p = S.spinPose(null, NaN, undefined, 0);
  p.pos.concat(p.target).forEach((v) => assert.ok(Number.isFinite(v)));
  const q = S.spinPose({ cx: 0, cz: 0, size: 0 }, 5, 2, 1, { fov: 500, aspect: 0 });
  q.pos.forEach((v) => assert.ok(Number.isFinite(v)));
});

test('it turns once in TURN_SECONDS, the same way round as OrbitControls, and a long pause does not make it jump', () => {
  let a = 1;
  for (let i = 0; i < S.TURN_SECONDS * 20; i++) a = S.spinStep(a, 50);
  assert.ok(near(a, 1, 1e-6), String(a));
  assert.ok(S.spinStep(1, 50) < 1, 'the angle goes down (autoRotate turns theta down)');
  assert.ok(near(S.spinStep(1, 60000), S.spinStep(1, 100)), 'a minute away: one step');
  assert.ok(near(S.spinStep(1, -5), 1));
  const w = S.spinStep(0.001, 100);
  assert.ok(w > 6 && w < 2 * Math.PI, 'stays between 0 and 2π');
  assert.ok(near(S.spinSpeed(), 60 / S.TURN_SECONDS));
});

test('the part of the 3D canvas: the picture itself, smaller when the canvas is smaller', () => {
  assert.deepEqual(S.spinRegion(360, 210, 390, 800), { w: 360, h: 210 });
  assert.deepEqual(S.spinRegion(800, 400, 400, 900), { w: 400, h: 200 });
  assert.deepEqual(S.spinRegion(300, 200, 1000, 100), { w: 150, h: 100 });
  assert.equal(S.spinRegion(0, 200, 400, 800), null);
  assert.equal(S.spinRegion(300, 200, 0, 0), null);
});

test('it is drawn only while it can be seen', () => {
  assert.ok(S.spinSeen({ width: 300, height: 200, top: 100, bottom: 300 }, 800));
  assert.ok(S.spinSeen({ width: 300, height: 200, top: -150, bottom: 50 }, 800), 'partly');
  assert.ok(!S.spinSeen({ width: 300, height: 200, top: -250, bottom: -50 }, 800), 'scrolled up');
  assert.ok(!S.spinSeen({ width: 300, height: 200, top: 900, bottom: 1100 }, 800), 'below');
  assert.ok(!S.spinSeen({ width: 0, height: 0, top: 0, bottom: 0 }, 800), 'hidden');
  assert.ok(!S.spinSeen(null, 800));
});
