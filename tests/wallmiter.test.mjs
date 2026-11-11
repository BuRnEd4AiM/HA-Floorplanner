// Unit tests for wallmiter.js: mitre joints at slanted corners (#724). Run like offline.test.mjs (STATIC_DIR = a copy of the static folder).
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const M = await import(`${dir}/wallmiter.js`);
const W = (id, a, b, t = 0.24, more = {}) => ({ id, a, b, thickness: t, height: 2.6, openings: [], ...more });
const close = (x, y, eps = 1e-9) => Math.abs(x - y) < eps;

/** the end point of a face (s = 1 left, -1 right) of wall w past its end e, with the reach r */
function faceEnd(w, e, s, r) {
  const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]), u = [(w.b[0] - w.a[0]) / L, (w.b[1] - w.a[1]) / L], n = [-u[1], u[0]];
  const E = w[e], out = e === 'a' ? [-u[0], -u[1]] : u;                  // past the end: away from the wall
  return [E[0] + (s * n[0] * w.thickness) / 2 + out[0] * r, E[1] + (s * n[1] * w.thickness) / 2 + out[1] * r];
}
/** do the faces of two walls meeting at a corner end in the same two points (a real mitre, no notch, nothing sticking out) */
function meets(w, e, rw, o, oe, ro) {
  const pw = [faceEnd(w, e, 1, rw[0]), faceEnd(w, e, -1, rw[1])], po = [faceEnd(o, oe, 1, ro[0]), faceEnd(o, oe, -1, ro[1])];
  const same = (p, q) => close(p[0], q[0], 1e-6) && close(p[1], q[1], 1e-6);
  return pw.every((p) => po.some((q) => same(p, q)));
}

test('90°: the square ends stay (they fill the corner exactly)', () => {
  const r = M.miterEnds([W('w1', [0, 0], [4, 0]), W('w2', [4, 0], [4, 3])]);
  assert.deepEqual(r, [{ a: null, b: null }, { a: null, b: null }]);
});

test('135° (a gallery with slanted walls): both faces of both walls meet in the same two points', () => {
  const w1 = W('w1', [0, 0], [4, 0]), w2 = W('w2', [4, 0], [6, 2]);
  const [e1, e2] = M.miterEnds([w1, w2]);
  assert.ok(e1.b && e2.a && !e1.a && !e2.b, JSON.stringify([e1, e2]));
  assert.ok(meets(w1, 'b', e1.b, w2, 'a', e2.a));
  // the corner turns left: the outer face (right of w1) runs on past the corner by t / 2 · tan(22.5°), the inner one stops as much before it
  // (before: both t / 2 square, the corner of the box stuck out past the other wall and left a notch outside)
  const k = 0.12 * Math.tan(Math.PI / 8);
  assert.ok(close(e1.b[1], k, 1e-9) && close(e1.b[0], -k, 1e-9), JSON.stringify(e1.b));
});

test('45°, other directions and either end: still a mitre', () => {
  for (const [a, b, c] of [[[0, 0], [4, 0], [1, 3]], [[0, 0], [4, 0], [7, -3]], [[3, 2], [0, 0], [-3, 1]]]) {
    const w1 = W('w1', a, b), w2 = W('w2', c, b);                       // w2 runs into the corner (its end b there)
    const [e1, e2] = M.miterEnds([w1, w2]);
    assert.ok(e1.b && e2.b, JSON.stringify([a, b, c, e1, e2]));
    assert.ok(meets(w1, 'b', e1.b, w2, 'b', e2.b), JSON.stringify([a, b, c]));
  }
});

test('different thicknesses: the mitre goes through where the inner and where the outer faces meet', () => {
  const w1 = W('w1', [0, 0], [4, 0], 0.36), w2 = W('w2', [4, 0], [6, 2], 0.12);
  const [e1, e2] = M.miterEnds([w1, w2]);
  assert.ok(e1.b && e2.a && meets(w1, 'b', e1.b, w2, 'a', e2.a));
});

test('three walls at a point, a free end, straight on, a very sharp angle, a low wall at a high one: square as before', () => {
  const three = M.miterEnds([W('a', [0, 0], [4, 0]), W('b', [4, 0], [6, 2]), W('c', [4, 0], [4, -3])]);
  assert.ok(three.every((x) => !x.a && !x.b));
  assert.ok(M.miterEnds([W('a', [0, 0], [4, 0]), W('b', [4, 0], [8, 0.01])]).every((x) => !x.a && !x.b));   // 180° (almost)
  assert.ok(M.miterEnds([W('a', [0, 0], [4, 0]), W('b', [4, 0], [0, 0.4])]).every((x) => !x.a && !x.b));    // about 6°: far too long a point
  assert.ok(M.miterEnds([W('a', [0, 0], [4, 0]), W('b', [4, 0], [6, 2], 0.24, { height: 1 })]).every((x) => !x.a && !x.b));   // a parapet
  assert.ok(M.miterEnds([W('a', [0, 0], [4, 0]), W('b', [4.005, 0.004], [6, 2])]).some((x) => x.b));        // within 1 cm: one corner
});

test('an opening next to the corner keeps the square ends of both walls (it would reach into the slanted part)', () => {
  const near = W('w1', [0, 0], [4, 0], 0.24, { openings: [{ id: 'o', type: 'window', pos: 3.45, width: 1 }] });   // 5 cm to the corner
  const r = M.miterEnds([near, W('w2', [4, 0], [6, 2])]);
  assert.ok(!r[0].b && !r[1].a, JSON.stringify(r));
  const far = W('w1', [0, 0], [4, 0], 0.24, { openings: [{ id: 'o', type: 'window', pos: 2, width: 1 }] });
  assert.ok(M.miterEnds([far, W('w2', [4, 0], [6, 2])])[0].b);
});

test('the outline in the plan: square ends without a mitre, the mitre points with it', () => {
  const w = W('w1', [0, 0], [4, 0]);
  assert.deepEqual(M.wallOutline(w).map((p) => p.map((x) => +x.toFixed(3))), [[-0.12, 0.12], [4.12, 0.12], [4.12, -0.12], [-0.12, -0.12]]);
  const w2 = W('w2', [4, 0], [6, 2]);
  const [e1, e2] = M.miterEnds([w, w2]);
  const o1 = M.wallOutline(w, e1), o2 = M.wallOutline(w2, e2);
  const same = (p, q) => close(p[0], q[0], 1e-6) && close(p[1], q[1], 1e-6);
  assert.ok(same(o1[1], o2.find((q) => same(q, o1[1])) || [NaN, NaN]) && same(o1[2], o2.find((q) => same(q, o1[2])) || [NaN, NaN]),
    JSON.stringify([o1, o2]));
  assert.deepEqual(M.wallOutline({ a: [1, 1], b: [1, 1] }), []);
});

test('garbage stays calm', () => {
  assert.deepEqual(M.miterEnds(null), []);
  assert.deepEqual(M.miterEnds([{ id: 'x' }]), [{ a: null, b: null }]);
  assert.deepEqual(M.miterEnds([W('a', [0, 0], [0, 0]), W('b', [0, 0], [1, 1])]), [{ a: null, b: null }, { a: null, b: null }]);
});

test('the faces of a slanted piece: 6 faces, every normal points outward, a square piece is the box', () => {
  const centre = (p) => [0, 1, 2].map((k) => p.reduce((s, q) => s + q[k], 0) / p.length);
  for (const [l0, l1, r0, r1] of [[-2.05, 2, -1.95, 2], [-2, 2.3, -2, 1.8], [-2, 2, -2, 2]]) {
    const { pos, nor, uv, idx } = M.prismFaces(l0, l1, r0, r1, 0, 2.6, 0.24);
    assert.equal(pos.length, 72); assert.equal(nor.length, 72); assert.equal(uv.length, 48); assert.equal(idx.length, 36);
    const pts = []; for (let i = 0; i < pos.length; i += 3) pts.push(pos.slice(i, i + 3));
    const c = centre(pts);
    for (let f = 0; f < 6; f++) {
      const fc = centre(pts.slice(f * 4, f * 4 + 4)), n = nor.slice(f * 12, f * 12 + 3);
      assert.ok((fc[0] - c[0]) * n[0] + (fc[1] - c[1]) * n[1] + (fc[2] - c[2]) * n[2] > 0, `face ${f} of ${[l0, l1, r0, r1]}`);
      assert.ok(Math.abs(Math.hypot(...n) - 1) < 1e-9);
    }
  }
  const sq = M.prismFaces(-1, 1, -1, 1, 0, 1, 0.2);
  const xs = []; for (let i = 0; i < sq.pos.length; i += 3) xs.push(sq.pos[i]);
  assert.deepEqual([...new Set(xs)].sort(), [-1, 1]);
});
