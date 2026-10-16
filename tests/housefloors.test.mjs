// Unit tests for housefloors.js: the floors of the whole-house view with a small gap, pulled apart or stacked like a real house
// (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const H = await import(`${dir}/housefloors.js`);

const sq = (x0, z0, x1, z1) => ({ points: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]] });
const fl = (kind, rooms = [], extra = {}) => ({ kind, rooms, walls: [], blocks: [], ...extra });

test('only the whole-house view pulls the floors apart or stacks them; anything unknown is normal', () => {
  assert.equal(H.floorsMode({ houseFloors: 'stacked' }, true), 'stacked');
  assert.equal(H.floorsMode({ houseFloors: 'apart' }, true), 'apart');
  assert.equal(H.floorsMode({ houseFloors: 'stacked' }, false), 'normal');   // one floor shown: as built
  assert.equal(H.floorsMode({ houseFloors: 'bogus' }, true), 'normal');
  assert.equal(H.floorsMode({}, true), 'normal');
  assert.equal(H.floorsMode(null, true), 'normal');
  assert.deepEqual(H.HOUSE_FLOORS, ['normal', 'apart', 'stacked']);
});

test('the buttons of the view menu: a tap switches a way on, a second tap back to normal, the other button changes over', () => {
  assert.equal(H.toggleMode('normal', 'stacked'), 'stacked');
  assert.equal(H.toggleMode('stacked', 'stacked'), 'normal');
  assert.equal(H.toggleMode('apart', 'stacked'), 'stacked');
  assert.equal(H.toggleMode('stacked', 'apart'), 'apart');
});

test('floor heights: one storey per floor; apart lifts every floor off the one below, stacked keeps the storeys (the stairs fit)', () => {
  const at = (mode) => [0, 1, 2, 3].map((i) => H.floorElev(i, 1, 3, mode));   // basement, ground floor, upper floor, roof
  assert.deepEqual(at('normal'), [-3, 0, 3, 6]);
  assert.deepEqual(at('stacked'), [-3, 0, 3, 6]);
  const apart = at('apart');
  assert.equal(apart[0], -3);                                                // the lowest floor stays
  for (let i = 1; i < 4; i++) assert.ok(apart[i] - apart[i - 1] >= 3 + H.APART_GAP - 1e-9, `gap ${i}`);
});

test('the ceiling between two floors fills the gap between the walls and the floor above', () => {
  assert.equal(H.slabDepth(3, 2.6), 0.4);
  assert.equal(H.slabDepth(3, 2.5), 0.5);
  assert.equal(H.slabDepth(3, 3), 0);                                        // the walls reach the floor above: nothing to fill
  assert.equal(H.slabDepth(3, 3.2), 0);
  assert.equal(H.slabDepth(3, 2.99), 0);                                     // a centimetre is no ceiling
  assert.equal(H.slabDepth(3, undefined), 3);
});

test('which floor stands on a ceiling: one with something on it over another floor', () => {
  const floors = [fl('floor', [sq(0, 0, 5, 5)]), fl('floor', [sq(0, 0, 5, 5)]), fl('floor'), fl('roof', [], { walls: [{ a: [0, 0], b: [1, 0] }] })];
  assert.equal(H.hasSlab(floors, 0), false);                                 // the lowest floor stands on the ground
  assert.equal(H.hasSlab(floors, 1), true);
  assert.equal(H.hasSlab(floors, 2), false);                                 // an empty floor
  assert.equal(H.hasSlab(floors, 3), true);                                  // knee walls under the roof
  assert.equal(H.hasSlab(floors, 9), false);
  assert.equal(H.hasSlab([fl('floor'), fl('floor', [], { blocks: [sq(0, 0, 1, 1)] })], 1), true);
});

test('a floor is covered when a floor above it has rooms: a roof alone does not hide the floor under it', () => {
  const floors = [fl('basement', [sq(0, 0, 5, 5)]), fl('floor', [sq(0, 0, 5, 5)]), fl('floor', [sq(0, 0, 5, 5)]), fl('roof')];
  assert.deepEqual(floors.map((_, i) => H.isCovered(floors, i)), [true, true, false, false]);
  floors[3].rooms = [sq(1, 1, 4, 4)];                                        // a lived-in attic
  assert.deepEqual(floors.map((_, i) => H.isCovered(floors, i)), [true, true, true, false]);
  assert.equal(H.isCovered([fl('floor', [sq(0, 0, 1, 1)]), fl('floor', [{ points: [[0, 0], [1, 1]] }])], 0), false);   // not a room yet
});

test('under a roof the walls reach up to it; lower walls (a parapet) stay as they are', () => {
  assert.equal(H.wallUpTo(2.6, 2.6, 3), 3);
  assert.equal(H.wallUpTo(2.58, 2.6, 3), 3);
  assert.equal(H.wallUpTo(1.1, 2.6, 3), 1.1);
  assert.equal(H.wallUpTo(3.4, 2.6, 3), 3.4);                                // already taller
  assert.equal(H.wallUpTo(undefined, 2.6, 3), 3);                            // no height of its own: the wall height
  const floors = [fl('floor'), fl('floor'), fl('roof')];
  assert.deepEqual(floors.map((_, i) => H.underRoof(floors, i)), [false, true, false]);
  const box = { x0: 0, x1: 10, z0: 0, z1: 8 };
  assert.equal(H.wallUnder({ a: [0, 0], b: [10, 0] }, box), true);          // the outer wall along the eaves
  assert.equal(H.wallUnder({ a: [10.2, 2], b: [10.2, 6] }, box), true);     // its middle a little outside: still under the roof
  assert.equal(H.wallUnder({ a: [12, 0], b: [16, 0] }, box), false);        // the garage beside the house
  assert.equal(H.wallUnder({ a: [0, 0], b: [10, 0] }, null), false);
});

test('balls and labels of a covered floor stay in their room, under the ceiling', () => {
  assert.equal(H.inRoom(2.0, 2.6, 0.4), 2.0);
  assert.ok(Math.abs(H.inRoom(2.65, 2.6, 0.38) - 2.22) < 1e-9);
  const ball = H.inRoom(2.65, 2.6, 0.38);
  assert.ok(Math.abs(H.shutterLabelIn(3.2, ball, 2.6, 0.2) - (ball - 0.55)) < 1e-9);   // no room over the ball: the label goes under it
  assert.equal(H.shutterLabelIn(2.0, 1.4, 2.6, 0.2), 2.0);                    // room enough: it stays over the ball
});

test('the whole-house view shows the state of the devices on every floor, not only on the floor opened last (#392)', () => {
  assert.deepEqual(H.liveFloors(4, 1, true), [0, 1, 2, 3]);                  // the bug: floors above the last open one stayed dark, without balls
  assert.deepEqual(H.liveFloors(4, 1, false), [0, 1]);                       // one floor: it and the floors below (dimmed)
  assert.deepEqual(H.liveFloors(2, 5, false), [0, 1]);
  assert.deepEqual(H.liveFloors(0, 0, true), []);
});
