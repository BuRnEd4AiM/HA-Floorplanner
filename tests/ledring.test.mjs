// Pure geometry tests for ledring.js (run: cp floorplan3d/rootfs/app/static/ledring.js /tmp/ledring.mjs && LEDRING_MJS=/tmp/ledring.mjs node --test tests/ledring.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(process.env.LEDRING_MJS || '/tmp/ledring.mjs');
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const ROOM = [[0, 0], [4, 0], [4, 3], [0, 3]];

for (const [name, poly] of [['clockwise', ROOM], ['counter-clockwise', [...ROOM].reverse()]]) {
  test(`inset moves every edge inwards (${name})`, () => {
    const p = R.insetPoly(poly, 0.2);
    assert.equal(p.length, 4);
    const xs = p.map((q) => q[0]).sort((a, b) => a - b), zs = p.map((q) => q[1]).sort((a, b) => a - b);
    near(xs[0], 0.2); near(xs[3], 3.8); near(zs[0], 0.2); near(zs[3], 2.8);
  });
}

test('L-shaped room: inset keeps all six corners inside', () => {
  const L = [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]];
  const p = R.insetPoly(L, 0.1);
  assert.equal(p.length, 6);
  assert.deepEqual(p.map((q) => q.map((v) => +v.toFixed(3))), [[0.1, 0.1], [3.9, 0.1], [3.9, 1.9], [1.9, 1.9], [1.9, 3.9], [0.1, 3.9]]);
});

test('straight corners (collinear points) merge into one section', () => {
  const p = R.insetPoly([[0, 0], [2, 0], [4, 0], [4, 3], [0, 3]], 0.1);
  assert.equal(p.length, 4);
});

test('ring from a room: one empty section per wall, points relative to its centre', () => {
  const r = R.ringFromRoom(ROOM, 0.15);
  near(r.x, 2); near(r.z, 1.5);
  assert.equal(r.pts.length, 4); assert.equal(r.segs.length, 4); assert.equal(r.closed, true);
  const d = { ...r, rot: 0 };
  const e = R.ringEdges(d);
  assert.equal(e.length, 4);
  near(e.reduce((s, x) => s + x.len, 0), 2 * (3.7 + 2.7));
});

test('open ring has one section less, segs follow the count', () => {
  const d = { x: 0, z: 0, pts: [[0, 0], [1, 0], [1, 1]], closed: false, segs: [{ entity: 'light.a' }, {}, {}, {}] };
  assert.equal(R.ringCount(d), 2);
  R.fitSegs(d);
  assert.equal(d.segs.length, 2);
  d.closed = true; R.fitSegs(d);
  assert.equal(d.segs.length, 3);
});

test('sections without own light use the main entity; ringEntities has no duplicates', () => {
  const d = { x: 0, z: 0, pts: ROOM, entity: 'light.main', segs: [{ entity: 'light.a' }, {}, { entity: 'light.a' }, {}] };
  assert.equal(R.segEntity(d, 0), 'light.a');
  assert.equal(R.segEntity(d, 1), 'light.main');
  assert.deepEqual(R.ringEntities(d), ['light.a', 'light.main']);
});

test('world edges follow position and rotation like the 3D model', () => {
  const d = { x: 10, z: 5, rot: 90, pts: [[1, 0], [2, 0]], closed: false };
  const [e] = R.ringEdges(d);
  near(e.a[0], 10); near(e.a[1], 4);                      // three.js: turning +90 deg about y maps +x to -z
  near(e.b[0], 10); near(e.b[1], 3);
});
