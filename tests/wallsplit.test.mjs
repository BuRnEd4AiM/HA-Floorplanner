// Unit tests for wallsplit.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/wallsplit.js`);
let n = 0;
const uid = () => `n${++n}`;
const wall = (o = {}) => ({ id: 'w', a: [0, 0], b: [10, 0], height: 2.5, thickness: 0.2, openings: [], ...o });

test('splits a wall at an exact distance, also 30 cm from a corner', () => {
  const w = wall(), f = { walls: [w], rooms: [] };
  const s = S.splitWall(f, w, 0.3, uid);
  assert.deepEqual([w.a, w.b, s.a, s.b], [[0, 0], [0.3, 0], [0.3, 0], [10, 0]]);
  assert.equal(f.walls[1], s);
  assert.equal(s.height, 2.5);
});
test('no corner closer than 5 cm to an end, nor inside a door or window', () => {
  const w = wall({ openings: [{ id: 'd', pos: 5, width: 0.9 }] }), f = { walls: [w], rooms: [] };
  assert.equal(S.splitWall(f, w, 0.02, uid), null);
  assert.equal(S.splitWall(f, w, 9.99, uid), null);
  assert.equal(S.splitWall(f, w, 5.2, uid), null);
  assert.equal(f.walls.length, 1);
  assert.ok(S.splitWall(f, w, 0.05, uid));
});
test('doors and windows go with their piece, their place counted from the new start', () => {
  const w = wall({ openings: [{ id: 'd', pos: 2, width: 0.9 }, { id: 'f', pos: 7, width: 1.2 }] }), f = { walls: [w], rooms: [] };
  const s = S.splitWall(f, w, 4, uid);
  assert.deepEqual(w.openings.map((o) => [o.id, o.pos]), [['d', 2]]);
  assert.deepEqual(s.openings.map((o) => [o.id, o.pos]), [['f', 3]]);
});
test('a room along the wall gets the corner too', () => {
  const w = wall(), room = { id: 'r', points: [[0, 0], [10, 0], [10, 4], [0, 4]] }, f = { walls: [w], rooms: [room], blocks: [] };
  S.splitWall(f, w, 2.5, uid);
  assert.deepEqual(room.points, [[0, 0], [2.5, 0], [10, 0], [10, 4], [0, 4]]);
});
test('equal parts: 4 pieces of 2.5 m, in order', () => {
  const w = wall(), f = { walls: [w], rooms: [] };
  const p = S.splitEqual(f, w, 4, uid);
  assert.deepEqual(p.map((x) => [x.a[0], x.b[0]]), [[0, 2.5], [2.5, 5], [5, 7.5], [7.5, 10]]);
  assert.deepEqual(f.walls, p);
});
test('equal parts refuse when a corner would hit a door (nothing changes)', () => {
  const w = wall({ openings: [{ id: 'd', pos: 5, width: 0.9 }] }), f = { walls: [w], rooms: [] };
  assert.equal(S.splitEqual(f, w, 2, uid), null);
  assert.equal(f.walls.length, 1);
  assert.equal(S.splitEqual(f, w, 1, uid), null);
});
test('distance along a slanted wall', () => {
  const w = wall({ a: [0, 0], b: [3, 4] });
  assert.equal(S.wallLength(w), 5);
  assert.ok(Math.abs(S.distAlong(w, 1.5, 2) - 2.5) < 1e-9);
});
