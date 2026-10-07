// Unit tests for attic.js (a lived-in attic with a knee wall, #260; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const A = await import(`${process.env.STATIC_DIR || '/tmp/static'}/attic.js`);
const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/solarroof.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const bb = { x0: 0, x1: 10, z0: 0, z1: 8 };

test('knee wall: only a number counts, never below 0', () => {
  assert.equal(A.kneeOf({}), null);
  assert.equal(A.kneeOf({ knee: '' }), null);
  assert.equal(A.kneeOf({ knee: 'x' }), null);
  assert.equal(A.kneeOf({ knee: 1 }), 1);
  assert.equal(A.kneeOf({ knee: 5 }, 3), 3);
  assert.equal(A.kneeOf({ knee: -1 }), 0);
});

const elev = (i) => i * 3;
test('where the roof starts: on the storey right below, or on a chosen one further down (#265); without a knee wall on top as before', () => {
  const fl = [{ id: 'eg', kind: 'floor' }, { id: 'og', kind: 'floor' }, { id: 'dg', kind: 'floor' }, { id: 'd', kind: 'roof', roof: { knee: 1 } }];
  assert.equal(A.roofBaseIdx(fl, 3), 2);
  assert.equal(A.roofY0(fl, 3, elev), -2);                       // 1 m above the floor of the Dachgeschoss
  fl[3].roof.base = 'og';
  assert.equal(A.roofBaseIdx(fl, 3), 1);
  assert.equal(A.roofY0(fl, 3, elev), -5);                       // two storeys under the slopes
  fl[3].roof.base = 'nope';
  assert.equal(A.roofBaseIdx(fl, 3), 2);                          // an unknown floor: the one right below
  delete fl[3].roof.knee;
  assert.equal(A.roofY0(fl, 3, elev), 0);
});

test('which roof floor cuts the walls: the roof floor itself, and the storeys from where its roof starts', () => {
  const fl = [{ id: 'eg', kind: 'floor' }, { id: 'og', kind: 'floor' }, { id: 'dg', kind: 'floor' }, { id: 'd', kind: 'roof', roof: { knee: 1 } }];
  assert.deepEqual([0, 1, 2, 3].map((i) => A.clipRoofFloor(fl, i)), [-1, -1, 3, 3]);
  fl[3].roof.base = 'og';
  assert.deepEqual([0, 1, 2, 3].map((i) => A.clipRoofFloor(fl, i)), [-1, 3, 3, 3]);
  fl[3].roof = {};
  assert.deepEqual([0, 1, 2, 3].map((i) => A.clipRoofFloor(fl, i)), [-1, -1, -1, 3]);
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

test('dormers (#265): inside a dormer the wall is kept up to its ceiling, beside it the slope cuts', () => {
  const spec = { type: 'gable', pitch: 35, overhang: 0.4, ridge: 'x', dormers: [{ side: 0, pos: 0.5, w: 2, hw: 1.4, eave: 1, type: 'flat' }] };
  const P = A.roofPlanes(bb, spec, 0), R = A.dormerRooms(bb, spec, 0);
  assert.equal(R.length, 1);
  const q = R[0], x = (q.x0 + q.x1) / 2, z = q.z0 + 0.3;          // inside the dormer, a little behind its front wall
  const slope = S.roofSurfaceAt(bb, spec, x, z).y;
  assert.ok(q.top > slope + 0.5, 'the dormer ceiling is well above the slope there');
  assert.ok(A.keptAt(P, R, x, slope + 0.4, z), 'kept inside the dormer');
  assert.ok(!A.keptAt(P, R, x, q.top + 0.1, z), 'cut above the dormer ceiling');
  assert.ok(!A.keptAt(P, R, q.x1 + 0.3, slope + 0.4, z), 'cut beside the dormer');
  assert.ok(!A.underRoof(P, x, slope + 0.4, z), 'without the dormer it would be cut');
  const g = A.dormerRooms(bb, { ...spec, dormers: [{ ...spec.dormers[0], type: 'gable' }] }, 0)[0];
  assert.ok(g.gh > 0 && A.keptAt(P, [g], g.at, g.top + g.gh * 0.9, z) && !A.keptAt(P, [g], g.x0 + 0.05, g.top + g.gh * 0.9, z), 'a gable dormer is higher in its middle');
  assert.deepEqual(A.dormerRooms(bb, { type: 'flat', dormers: spec.dormers }, 0), []);
});

test('ridge height: set by the pitch, and the pitch for a typed height', () => {
  const spec = { type: 'gable', pitch: 35, overhang: 0.4, ridge: 'x' };   // 8 m deep: 4 m from the wall line to the ridge
  near(A.ridgeHeight(bb, spec), 4 * Math.tan((35 * Math.PI) / 180));
  near(A.pitchFor(bb, spec, 4), 45, 0.06);
  assert.equal(A.pitchFor(bb, spec, 100), 70);
  assert.equal(A.pitchFor(bb, spec, 0), 5);
  assert.equal(A.ridgeHeight(bb, { type: 'flat' }), 0);
});
