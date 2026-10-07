// Unit tests for attic.js (a lived-in attic with a knee wall, #260; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const A = await import(`${process.env.STATIC_DIR || '/tmp/static'}/attic.js`);
const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/solarroof.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const bb = { x0: 0, x1: 10, z0: 0, z1: 8 };

test('knee wall: only a number counts, kept between 0 and the storey height; the roof drops by the rest', () => {
  assert.equal(A.kneeOf({}, 3), null);
  assert.equal(A.kneeOf({ knee: '' }, 3), null);
  assert.equal(A.kneeOf({ knee: 'x' }, 3), null);
  assert.equal(A.kneeOf({ knee: 1 }, 3), 1);
  assert.equal(A.kneeOf({ knee: 5 }, 3), 3);
  assert.equal(A.kneeOf({ knee: -1 }, 3), 0);
  assert.equal(A.kneeDrop({ knee: 1 }, 3), -2);                 // the roof starts 1 m above the floor of the storey below
  assert.equal(A.kneeDrop({ type: 'gable' }, 3), 0);            // as before: on top of it
});

test('which roof floor cuts the walls: the roof floor itself, and the storey below only with a knee wall', () => {
  const fl = [{ kind: 'floor' }, { kind: 'floor' }, { kind: 'roof', roof: { knee: 1 } }];
  assert.deepEqual([0, 1, 2].map((i) => A.clipRoofFloor(fl, i, 3)), [-1, 2, 2]);
  fl[2].roof = {};
  assert.deepEqual([0, 1, 2].map((i) => A.clipRoofFloor(fl, i, 3)), [-1, -1, 2]);
});

test('gable roof planes: under the slopes is kept, above is cut, a little under the surface; flat roofs cut nothing', () => {
  for (const ridge of ['x', 'z']) {
    const spec = { type: 'gable', pitch: 35, overhang: 0.4, ridge };
    const P = A.roofPlanes(bb, spec, -2);
    assert.equal(P.length, 2);
    for (const [x, z] of [[1, 1], [5, 4], [9, 7], [2, 6]]) {
      const top = S.roofSurfaceAt(bb, spec, x, z).y - 2;           // the roof surface over this point, lifted by y0
      assert.ok(A.underRoof(P, x, top - 0.05, z), `under at ${ridge} ${x},${z}`);
      assert.ok(!A.underRoof(P, x, top + 0.01, z), `above at ${ridge} ${x},${z}`);
      assert.ok(!A.underRoof(P, x, top - 0.01, z), 'the wall ends a few cm under the roof');
    }
  }
  assert.deepEqual(A.roofPlanes(bb, { type: 'flat' }, 0), []);
  assert.deepEqual(A.roofPlanes(null, { type: 'gable' }, 0), []);
});

test('hip roof: the ends slope too', () => {
  const spec = { type: 'hip', pitch: 40, overhang: 0.3 };
  const P = A.roofPlanes(bb, spec, 0);
  assert.equal(P.length, 4);
  for (const [x, z] of [[0.2, 4], [9.8, 4], [5, 0.5], [5, 4]]) {
    const top = S.roofSurfaceAt(bb, spec, x, z).y;
    assert.ok(A.underRoof(P, x, top - 0.05, z) && !A.underRoof(P, x, top + 0.01, z), `${x},${z}`);
  }
  P.forEach(([a, b, c]) => near(Math.hypot(a, b, c), 1));        // unit normals (three.js clipping planes)
});
