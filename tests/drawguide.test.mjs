// Unit tests for drawguide.js (right angle and parallel while drawing, 5.14.0; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const G = await import(`${dir}/drawguide.js`);
const near = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('almost square to the line before: the point moves onto the right angle', () => {
  const g = G.guideAt([0, 0], [4, 0], [4.2, 3], []);                         // 3.8° off square
  assert.equal(g.kind, 'right');
  near(g.p[0], 4); near(g.p[1], 3);
  assert.deepEqual(g.ref, [[0, 0], [4, 0]]);
  assert.ok(g.off > 3 && g.off < 4);
});

test('too far off: nothing happens', () => {
  const g = G.guideAt([0, 0], [4, 0], [4.5, 3], []);                         // 9.5° off
  assert.equal(g.kind, null);
  assert.deepEqual(g.p, [4.5, 3]);
  assert.equal(G.guideAt([0, 0], [4, 0], [4.2, 3], [], { tol: 2 }).kind, null);
});

test('the first line: square to a wall that ends where it starts', () => {
  const g = G.guideAt(null, [5, 0], [5.1, 2], [[[0, 0], [5, 0]], [[9, 9], [9, 12]]]);
  assert.equal(g.kind, 'right');
  near(g.p[0], 5); near(g.p[1], 2);
});

test('parallel to a wall of the floor (the owner\'s picture: a line along the plan that is a little off)', () => {
  const wall = [[0, 0], [0.1, 7]];                                          // a wall drawn on a slightly turned template
  const g = G.guideAt(null, [5, 0], [5.3, 6.5], [wall]);
  assert.equal(g.kind, 'parallel');
  const u = [0.1 / Math.hypot(0.1, 7), 7 / Math.hypot(0.1, 7)], d = [g.p[0] - 5, g.p[1]];
  near(u[0] * d[1] - u[1] * d[0], 0, 1e-3);                                 // exactly parallel now
  assert.deepEqual(g.ref, wall);
});

test('square wins when both fit about as well; the nearest parallel line when several fit', () => {
  const g = G.guideAt([0, 0], [4, 0], [4.05, 3], [[[10, 0], [10, 5]]]);      // square to the line before and parallel to the far wall
  assert.equal(g.kind, 'right');
  const two = G.guideAt(null, [0, 0], [0.1, 4], [[[20, 0], [20, 4]], [[2, 0], [2, 4]]]);
  assert.deepEqual(two.ref, [[2, 0], [2, 4]]);
});

test('a very short line is left alone', () => {
  assert.equal(G.guideAt([0, 0], [4, 0], [4.001, 0.03], []).kind, null);
});

test('the lines of a floor: walls, edges of rooms and areas, the lines drawn before (not the last one)', () => {
  const f = { walls: [{ a: [0, 0], b: [4, 0] }], rooms: [{ points: [[0, 0], [1, 0], [1, 1]] }] };
  const ls = G.guideLines(f, [{ points: [[5, 5], [6, 5], [6, 6], [5, 6]] }], [[0, 0], [1, 0], [1, 1]]);
  assert.equal(ls.length, 1 + 3 + 4 + 1);
  assert.deepEqual(ls[ls.length - 1], [[0, 0], [1, 0]]);
});
