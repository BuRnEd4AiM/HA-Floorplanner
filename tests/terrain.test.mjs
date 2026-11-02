// Unit tests for terrain.js (the ground of the plot on a slope, #629; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const T = await import(`${dir}/terrain.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const P = (x, z, h, id = '') => ({ id, x, z, h });

test('stored: points with numbers only, heights within ±20 m, a place only once, the contour distance', () => {
  assert.equal(T.cleanTerrain(null), null);
  assert.equal(T.cleanTerrain({ points: [] }), null);
  assert.equal(T.cleanTerrain({ points: [{ x: 1, z: 2 }, { x: 'a', z: 1, h: 1 }, null] }), null);
  const c = T.cleanTerrain({ points: [P(1.234, 2, -3.456, 'a'), P(5, 5, 99, 'b'), P(1.23, 2, -1, 'c')], contours: 0.25 });
  assert.deepEqual(c.points, [{ id: 'c', x: 1.23, z: 2, h: -1 }, { id: 'b', x: 5, z: 5, h: 20 }]);
  assert.equal(c.contours, 0.25);
  assert.equal(T.cleanTerrain({ points: [P(0, 0, 1)] }).contours, 0.5);
  assert.equal(T.cleanTerrain({ points: [P(0, 0, 1)], contours: 0 }).contours, 0);
  assert.equal(T.cleanTerrain({ points: [P(0, 0, 1)], contours: 3 }).contours, 0.5);
  assert.equal(T.cleanTerrain({ points: Array.from({ length: 60 }, (_, i) => P(i, 0, 0)) }).points.length, T.TERRAIN.maxPoints);
  assert.equal(T.hasTerrain({ plot: { terrain: { points: [P(0, 0, 0)] } } }), true);
  assert.equal(T.hasTerrain({ plot: {} }), false);
});

test('no point: flat at 0; one point: its height everywhere', () => {
  assert.equal(T.heightField(null)(3, 4), 0);
  const f = T.heightField({ points: [P(2, 2, -1.5)] });
  assert.equal(f(-50, 80), -1.5);
});

test('two points: an even slope between them, level before and behind (the garden above, the street below)', () => {
  const f = T.heightField({ points: [P(5, 7, 0), P(5, -1, -3)] });
  near(f(5, 7), 0); near(f(5, -1), -3); near(f(5, 3), -1.5);
  near(f(-20, 3), -1.5);                                        // the same height across the slope
  near(f(5, 20), 0); near(f(5, -10), -3);                       // level behind the points
  const g = T.heightField({ points: [P(0, 0, 0), P(10, 0, 2), P(4, 0, 2)] });   // on one line: straight from point to point
  near(g(2, 5), 1); near(g(7, -3), 2); near(g(-5, 0), 0); near(g(30, 0), 2);
});

test('three and more: straight inside the triangles, the edge height outside', () => {
  const f = T.heightField({ points: [P(0, 0, 0), P(10, 0, 0), P(0, 10, 3)] });
  near(f(0, 5), 1.5); near(f(2, 2), 0.6); near(f(5, 0), 0);
  near(f(5, -10), 0);                                           // in front of the edge (0, 0)-(10, 0): its height
  near(f(-10, 10), 3);                                          // beside the point (0, 10)
  const sq = T.heightField({ points: [P(0, 0, 0), P(10, 0, 0), P(10, 10, 2), P(0, 10, 2)] });
  near(sq(5, 5), 1); near(sq(3, 7.5), 1.5); near(sq(20, 5), 1);
  const tri = T.delaunay([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5]]);
  assert.equal(tri.length, 4);
});

test('the lowest and highest ground over a house', () => {
  const f = T.heightField({ points: [P(5, 7, 0), P(5, -1, -3)] });
  const [lo, hi] = T.rangeOver(f, rect(0, 0, 10, 7));
  near(lo, -3 * 7 / 8); near(hi, 0);
});

test('triangles split until no side is longer than asked, the surface stays the same', () => {
  const big = [0, 0, 0, 10, 0, 0, 0, 0, 10];
  const out = T.splitTris(big, 1);
  assert.equal(out.length % 9, 0);
  let area = 0, longest = 0;
  for (let i = 0; i < out.length; i += 9) {
    const [ax, , az, bx, , bz, cx, , cz] = out.slice(i, i + 9);
    area += Math.abs((bx - ax) * (cz - az) - (cx - ax) * (bz - az)) / 2;
    longest = Math.max(longest, Math.hypot(bx - ax, bz - az), Math.hypot(cx - bx, cz - bz), Math.hypot(ax - cx, az - cz));
  }
  near(area, 50, 1e-6); assert.ok(longest <= 1 + 1e-9);
  assert.ok(T.splitTris(big, 0.01, 500).length / 9 <= 500);
  assert.deepEqual(T.flatTris([0, 0, 0, 1, 0, 0, 0, 0, 1], [2, 1, 0]), [0, 0, 1, 1, 0, 0, 0, 0, 0]);
});

test('contour lines every half metre across the slope, none on level ground', () => {
  const f = T.heightField({ points: [P(5, 7, 0), P(5, -1, -3)] });
  const c = T.contourLines(f, [0, 10, -2, 8], 0.5, 0.5);
  assert.deepEqual(c.map((l) => l.level), [-2.5, -2, -1.5, -1, -0.5]);
  const at = (lv) => c.find((l) => l.level === lv).segs;
  at(-1.5).forEach(([, za, , zb]) => { near(za, 3, 1e-2); near(zb, 3, 1e-2); });   // the line of -1,5 m runs across at z = 3
  assert.deepEqual(T.contourLines(() => 1, [0, 10, 0, 10]), []);
  assert.deepEqual(T.contourLines(f, [0, 10, -2, 8], 0), []);
});

test('a slope in one step: 0 at the far face of the house, one storey lower at the near face', () => {
  const [hi, lo] = T.slopePoints(rect(0, 0, 10, 7), [5, -6], 3);
  assert.deepEqual(hi, { x: 5, z: 7, h: 0 });
  assert.deepEqual(lo, { x: 5, z: 0, h: -3 });
  assert.equal(T.slopePoints(rect(0, 0, 10, 7), [5, 3.5], 3), null);
  assert.equal(T.slopePoints([], [0, 0], 3), null);
});

test('what stands on the ground: garden things and what stands away from the walls, not in rooms, not on the facade', () => {
  const f = { rooms: [{ points: rect(0, 0, 10, 7) }], blocks: [{ points: rect(10, 0, 12, 2) }], walls: [{ a: [0, 0], b: [10, 0], thickness: 0.3 }] };
  const garden = new Set(['tree', 'garden_lamp']);
  assert.equal(T.onTerrain({ type: 'tree', x: 3, z: -0.3 }, f, garden), true);       // a garden thing close to the wall
  assert.equal(T.onTerrain({ type: 'light', x: 3, z: -0.3 }, f, garden), false);      // a lamp on the facade
  assert.equal(T.onTerrain({ type: 'car', x: 3, z: -3 }, f, garden), true);           // a car in front of the house
  assert.equal(T.onTerrain({ type: 'tree', x: 3, z: 3 }, f, garden), false);          // in a room
  assert.equal(T.onTerrain({ type: 'tree', x: 11, z: 1 }, f, garden), false);         // on a block (a balcony)
});

test('a slope in one step runs square to the house, even when the tap lies a bit to the side', () => {
  const house = rect(0, 0, 10, 7);
  near(T.mainAxis([house]), 0);
  const [hi, lo] = T.slopePoints(house, [1, -6], 3, T.mainAxis([house]));
  assert.deepEqual([hi.x, hi.z, lo.x, lo.z], [5, 7, 5, 0]);
  const [h2, l2] = T.slopePoints(house, [20, 5], 2, 0);          // towards the side: along x
  assert.deepEqual([h2.x, h2.z, l2.x, l2.z, l2.h], [0, 3.5, 10, 3.5, -2]);
  assert.equal(T.mainAxis([]), null);
});
