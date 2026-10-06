// Unit tests for roomclip.js (isolation of a focused room, #137 step 24; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/roomclip.js`);
const room = { points: [[0, 0], [4, 0], [4, 3], [0, 3]] };

test('point in polygon', () => {
  assert.ok(R.pointInPoly(1, 1, room.points));
  assert.ok(!R.pointInPoly(5, 1, room.points));
  assert.ok(R.pointInPoly(1, 1, [[0, 0], [2, 0], [2, 2], [1, 1.5], [0, 2]]));         // a concave outline
  assert.ok(!R.pointInPoly(1, 1.9, [[0, 0], [2, 0], [2, 2], [1, 1.5], [0, 2]]));
});
test('in the room: inside, or close to its edge (a wall lamp)', () => {
  assert.ok(R.inIso(room, 2, 1.5));
  assert.ok(R.inIso(room, 4.2, 1.5));
  assert.ok(!R.inIso(room, 4.5, 1.5));
});
test('a wall along the room is kept, a long outer wall is cut down to the room, openings move along, a wall elsewhere is dropped', () => {
  const along = { a: [0, 0], b: [4, 0], openings: [] };
  assert.equal(R.clipWallToRoom(room, along), along);
  const long = { a: [0, 0], b: [10, 0], openings: [{ id: 'd', pos: 2 }, { id: 'far', pos: 8 }] };
  const c = R.clipWallToRoom(room, long);
  assert.ok(Math.abs(c.a[0]) < 1e-9 && Math.abs(c.b[0] - 4) <= R.ISO_TOL + 0.05, JSON.stringify(c));
  assert.deepEqual(c.openings.map((o) => o.id), ['d']);
  assert.equal(R.clipWallToRoom(room, { a: [8, 8], b: [10, 8] }), null);
});
