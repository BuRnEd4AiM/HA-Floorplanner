// Unit tests for stairtool.js and blocks.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/stairtool.js`);
const B = await import(`${process.env.STATIC_DIR || '/tmp/static'}/blocks.js`);
const St = await import(`${process.env.STATIC_DIR || '/tmp/static'}/stairs.js`);
const H = 3.0;
const base = { ...St.stairDefaults('U'), type: 'U', x: 0, z: 0, rot: 0, dir: 'up', turn: 'right' };

test('shaft: four corners around the stair, the stair sits in the middle', () => {
  const p = S.shaftPlan(base, H, 0.2, 0, 10, 5);
  assert.equal(p.corners.length, 4);
  const xs = p.corners.map((c) => c[0]), zs = p.corners.map((c) => c[1]);
  assert.ok(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 10) < 0.06 && Math.abs((Math.min(...zs) + Math.max(...zs)) / 2 - 5) < 0.06);
  const placed = { ...base, ...p.stair }, lb = St.stairBounds(placed, H);         // local bounds, turned into the world
  const w = [[lb.x0, lb.z0], [lb.x1, lb.z0], [lb.x1, lb.z1], [lb.x0, lb.z1]].map(([x, z]) => St.toWorld(placed, x, z));
  const mx = (Math.min(...w.map((q) => q[0])) + Math.max(...w.map((q) => q[0]))) / 2, mz = (Math.min(...w.map((q) => q[1])) + Math.max(...w.map((q) => q[1]))) / 2;
  assert.ok(Math.abs(mx - 10) < 0.01 && Math.abs(mz - 5) < 0.01, `${mx},${mz}`);
});
test('shaft: walls keep clear space around the stair (0.2 m + half a wall thickness)', () => {
  const p = S.shaftPlan(base, H, 0.3, 0, 0, 0);
  const b = St.stairBounds({ ...base, ...p.stair }, H);
  const w = Math.max(...p.corners.map((c) => c[0])) - Math.min(...p.corners.map((c) => c[0]));
  assert.ok(Math.abs(w - ((b.x1 - b.x0) + 2 * (0.2 + 0.15))) < 0.12, `${w} vs ${(b.x1 - b.x0)}`);
});
test('shaft: corners are on the 5 cm grid', () => {
  const p = S.shaftPlan(base, H, 0.2, 37, 3.141, 2.718);
  for (const c of p.corners) for (const v of c) assert.ok(Math.abs(v / 0.05 - Math.round(v / 0.05)) < 1e-6, String(v));
});
test('shaft: a turn of 90 degrees swaps width and depth of the shell', () => {
  const a = S.shaftPlan(base, H, 0.2, 0, 0, 0), b = S.shaftPlan(base, H, 0.2, 90, 0, 0);
  const ext = (p, k) => Math.max(...p.corners.map((c) => c[k])) - Math.min(...p.corners.map((c) => c[k]));
  assert.ok(Math.abs(ext(a, 0) - ext(b, 1)) < 0.11 && Math.abs(ext(a, 1) - ext(b, 0)) < 0.11);
  assert.equal(b.stair.rot, 90);
});
test('shaft: any turn is normalised to 0..359', () => {
  assert.equal(S.shaftPlan(base, H, 0.2, -90, 0, 0).stair.rot, 270);
  assert.equal(S.shaftPlan(base, H, 0.2, 450, 0, 0).stair.rot, 90);
});
test('block target: the floor below, the same floor, or a new floor below the lowest one', () => {
  assert.deepEqual(B.blockTarget('below', 2), { target: 1, createBelow: false });
  assert.deepEqual(B.blockTarget('this', 2), { target: 2, createBelow: false });
  assert.deepEqual(B.blockTarget('this', 0), { target: 0, createBelow: false });
  assert.deepEqual(B.blockTarget('below', 0), { target: 0, createBelow: true });
});
test('floor shapes: no openings gives one shape, an opening in the middle makes a hole, an opening over the edge still works', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];
  assert.equal(B.floorShapes(sq, []).length, 1);
  const one = B.floorShapes(sq, [[[4, 4], [6, 4], [6, 6], [4, 6]]]);
  assert.equal(one.length, 1); assert.equal(one[0].holes.length, 1);
  const edge = B.floorShapes(sq, [[[8, 4], [12, 4], [12, 6], [8, 6]]]);
  assert.equal(edge.length, 1); assert.equal(edge[0].holes.length, 0);
});
test('floor openings: hand-drawn openings count, ones with fewer than 3 points do not', () => {
  const floors = [{ stairs: [], holes: [{ points: [[0, 0], [1, 0], [1, 1]] }, { points: [[0, 0], [1, 0]] }] }];
  assert.equal(B.floorOpenings(floors, 0, 3).length, 1);
  assert.equal(B.floorOpenings(floors, 5, 3).length, 0);
});
