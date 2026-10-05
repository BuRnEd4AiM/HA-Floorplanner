// Unit tests for nav.js (navigation, camera frames; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const N = await import(`${dir}/nav.js`);

const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const fl = (o = {}) => ({ walls: [], rooms: [], devices: [], ...o });

test('bounds: centre and size, at least 4 m; none without points', () => {
  assert.deepEqual(N.boundsOf([[0, 0], [10, 6]]), { cx: 5, cz: 3, size: 10 });
  assert.deepEqual(N.boundsOf([[1, 1], [2, 2]]), { cx: 1.5, cz: 1.5, size: 4 });
  assert.equal(N.boundsOf([]), null);
});
test('house bounds: walls, rooms and devices of every floor; 12 m for an empty house', () => {
  const floors = [fl({ walls: [{ a: [0, 0], b: [8, 0] }] }), fl({ devices: [{ x: 20, z: 4 }] })];
  assert.deepEqual(N.houseBoundsOf(floors), { cx: 10, cz: 2, size: 20 });
  assert.deepEqual(N.houseBoundsOf([fl()]), { cx: 0, cz: 0, size: 12 });
});
test('floor bounds: the isolated room only; a roof floor frames the roof box; an empty floor frames the house', () => {
  const f = fl({ rooms: [{ points: sq(0, 0, 10, 10) }, { points: sq(10, 0, 20, 10) }] });
  assert.deepEqual(N.floorBoundsOf(f, [f], { iso: { points: sq(10, 0, 20, 10) } }), { cx: 15, cz: 5, size: 10 });
  assert.deepEqual(N.floorBoundsOf(fl(), [f, fl()], { rb: { x0: 0, x1: 12, z0: 0, z1: 6 } }), { cx: 6, cz: 3, size: 12 });
  assert.deepEqual(N.floorBoundsOf(fl(), [f, fl()]), { cx: 10, cz: 5, size: 20 });
});
test('walls centre: garden things do not count; none without walls', () => {
  const f = fl({ walls: [{ a: [0, 0], b: [4, 0] }, { a: [4, 0], b: [4, 2] }], devices: [{ x: 30, z: 30 }] });
  assert.deepEqual(N.wallsCenterOf(f), { cx: 2, cz: 1 });
  assert.equal(N.wallsCenterOf(fl()), null);
});
test('find a room by name (case and spaces do not matter) or id, on any floor', () => {
  const floors = [fl({ rooms: [{ id: 'a', name: 'Küche' }] }), fl({ rooms: [{ id: 'b', name: ' Bad ' }] })];
  assert.deepEqual(N.findRoomByName(floors, 'bad'), { floor: 1, room: floors[1].rooms[0] });
  assert.equal(N.findRoomByName(floors, 'a').room.name, 'Küche');
  assert.equal(N.findRoomByName(floors, 'Keller'), null);
  assert.equal(N.findRoomByName(floors, null), null);
});
test('room menu: named rooms of the floor; in the whole-house view every floor, top floor first', () => {
  const floors = [fl({ rooms: [{ id: 'k', name: 'Küche' }, { id: 'x', name: '' }] }), fl({ rooms: [{ id: 'b', name: 'Bad' }] })];
  assert.deepEqual(N.navEntries(floors, 0, false).map((e) => e.r.id), ['k']);
  assert.deepEqual(N.navEntries(floors, 0, true).map((e) => [e.r.id, e.fi]), [['b', 1], ['k', 0]]);
  assert.deepEqual(N.navEntries(floors, 5, false), []);
});
test('occupied: a presence device inside the room that is on', () => {
  const room = { points: sq(0, 0, 4, 4) }, inside = (x, z, p) => x >= p[0][0] && x <= p[2][0] && z >= p[0][1] && z <= p[2][1];
  const f = fl({ devices: [{ type: 'presence', entity: 'person.a', x: 1, z: 1 }, { type: 'presence', entity: 'person.b', x: 9, z: 9 }] });
  assert.equal(N.occupied(room, f, (e) => e === 'person.a', inside), true);
  assert.equal(N.occupied(room, f, (e) => e === 'person.b', inside), false);
  assert.equal(N.occupied(room, fl({ devices: [{ type: 'lamp', entity: 'light.x', x: 1, z: 1 }] }), () => true, inside), false);
});
