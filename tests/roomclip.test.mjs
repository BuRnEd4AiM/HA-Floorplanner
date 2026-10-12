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
test('a device belongs to the room: inside it, or close to its edge, but not when it stands in the room behind the wall (#358)', () => {
  const next = { id: 'next', points: [[4, 0], [8, 0], [8, 3], [4, 3]] };              // shares the wall x = 4
  const mine = { ...room, id: 'mine' };
  const rooms = [mine, next];
  assert.ok(R.deviceInIso(mine, 2, 1.5, rooms));                                     // in the room
  assert.ok(!R.deviceInIso(mine, 4.2, 1.5, rooms));                                  // 20 cm behind the shared wall: the next room's lamp
  assert.ok(R.deviceInIso(next, 4.2, 1.5, rooms));                                   // ... shown in that room
  assert.ok(R.deviceInIso(mine, 2, -0.2, rooms));                                    // 20 cm outside an outer wall: a wall lamp, still this room's
  assert.ok(R.deviceInIso(mine, 4.2, 1.5));                                          // without the other rooms as before
  assert.ok(!R.deviceInIso(mine, 2, -0.5, rooms));                                   // too far away
  assert.ok(R.deviceInIso(mine, 3.9, 1.5, [mine, { id: 'x', points: [[3, 1], [5, 1], [5, 2], [3, 2]] }]));   // inside the room wins over an overlap
  assert.ok(R.deviceInIso(mine, 4.2, 1.5, [mine, { id: 'bad', points: [[4, 0], [8, 0]] }]));               // a room without an outline does not count
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
