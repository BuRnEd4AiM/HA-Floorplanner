// Unit tests for rooms.js (run: cp floorplan3d/rootfs/app/static/rooms.js /tmp/rooms.mjs && ROOMS_MJS=/tmp/rooms.mjs node --test tests/rooms.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(process.env.ROOMS_MJS || '/tmp/rooms.mjs');
const W = (a, b) => ({ a, b });
const rect = (x0, z0, x1, z1) => [W([x0, z0], [x1, z0]), W([x1, z0], [x1, z1]), W([x1, z1], [x0, z1]), W([x0, z1], [x0, z0])];
const areas = (rooms) => rooms.map((r) => +r.area.toFixed(3)).sort((a, b) => a - b);

test('one closed rectangle is one room', () => {
  const rooms = R.detectRooms(rect(0, 0, 4, 3));
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0].area, 12);
  assert.equal(rooms[0].points.length, 4);
});

test('walls drawn in the other direction give the same room', () => {
  const walls = rect(0, 0, 4, 3).map((w) => W(w.b, w.a));
  assert.deepEqual(areas(R.detectRooms(walls)), [12]);
});

test('an open shape is no room', () => {
  const walls = rect(0, 0, 4, 3).slice(0, 3);
  assert.equal(R.detectRooms(walls).length, 0);
});

test('a wall that ends in the middle of nowhere does not close anything', () => {
  const walls = [...rect(0, 0, 4, 3), W([2, 0], [2, 1.5])];            // dead-end stub inside the room
  assert.deepEqual(areas(R.detectRooms(walls)), [12]);
});

test('a dividing wall (T-junction at both ends) makes two rooms', () => {
  const walls = [...rect(0, 0, 6, 3), W([2, 0], [2, 3])];
  assert.deepEqual(areas(R.detectRooms(walls)), [6, 12]);
});

test('walls that cross each other split the area into four', () => {
  const walls = [...rect(0, 0, 4, 4), W([2, 0], [2, 4]), W([0, 2], [4, 2])];
  assert.deepEqual(areas(R.detectRooms(walls)), [4, 4, 4, 4]);
});

test('a wall drawn in two pieces on one line still closes the room', () => {
  const walls = [W([0, 0], [2, 0]), W([2, 0], [4, 0]), W([4, 0], [4, 3]), W([4, 3], [0, 3]), W([0, 3], [0, 0])];
  const rooms = R.detectRooms(walls);
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0].points.length, 4);                              // the middle point on the straight wall is dropped
});

test('corners that are 1 cm off still close the room', () => {
  const walls = [W([0, 0], [4, 0]), W([4.01, 0.005], [4, 3]), W([4, 3.01], [0, 3]), W([0.01, 3], [0, 0])];
  assert.equal(R.detectRooms(walls).length, 1);
});

test('an L shaped room is one polygon', () => {
  const pts = [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]];
  const walls = pts.map((p, i) => W(p, pts[(i + 1) % pts.length]));
  const rooms = R.detectRooms(walls);
  assert.equal(rooms.length, 1);
  assert.equal(rooms[0].area, 12);
  assert.equal(rooms[0].points.length, 6);
});

test('areas that already are a room are skipped', () => {
  const walls = [...rect(0, 0, 6, 3), W([2, 0], [2, 3])];
  const existing = [{ points: [[0, 0], [2, 0], [2, 3], [0, 3]] }];
  assert.deepEqual(areas(R.detectRooms(walls, existing)), [12]);
});

test('tiny closed gaps are ignored', () => {
  const walls = [...rect(0, 0, 4, 3), ...rect(1, 1, 1.3, 1.3)];
  assert.deepEqual(areas(R.detectRooms(walls)), [12]);
});
