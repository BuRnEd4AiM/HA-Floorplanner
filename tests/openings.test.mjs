// Unit tests for openings.js and cutaway.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const O = await import(`${dir}/openings.js`);
const C = await import(`${dir}/cutaway.js`);
const G = await import(`${dir}/rooms.js`);
const on = new Set(['on', 'open']);

test('kind of an opening: a garage door is a gate, other doors are doors, the rest windows', () => {
  assert.equal(O.openKind({ type: 'door', style: 'garage' }), 'gates');
  assert.equal(O.openKind({ type: 'door', style: 'double' }), 'doors');
  assert.equal(O.openKind({ type: 'window' }), 'windows');
});
test('sensors of an opening: main and per pane, each once, a pane falls back to the main sensor', () => {
  const o = { entity: 'binary_sensor.a', paneEntities: ['binary_sensor.a', '', 'binary_sensor.c'] };
  assert.deepEqual(O.openingEntities(o), ['binary_sensor.a', 'binary_sensor.c']);
  assert.equal(O.paneEntity(o, 1), 'binary_sensor.a');
  assert.equal(O.paneEntity(o, 2), 'binary_sensor.c');
  assert.equal(O.paneEntity({}, 0), '');
});
test('open: on / open count, a garage door on its way too, closed and missing do not', () => {
  assert.ok(O.isOpenState({ state: 'on' }, on));
  assert.ok(O.isOpenState({ state: 'opening' }, on));
  assert.ok(O.isOpenState({ state: 'closing' }, on));
  assert.ok(!O.isOpenState({ state: 'off' }, on));
  assert.ok(!O.isOpenState(undefined, on));
});
test('the middle of an opening along its wall', () => {
  assert.deepEqual(O.openingPoint({ a: [0, 0], b: [4, 0] }, { pos: 1 }), [1, 0]);
  assert.deepEqual(O.openingPoint({ a: [2, 2], b: [2, 6] }, { pos: 3 }), [2, 5]);
});
test('open list: only open ones, with room (also a door on the edge), sorted by kind, top floor first', () => {
  const states = { 'b.d1': 'on', 'b.w1': 'on', 'b.w2': 'off', 'b.g': 'opening', 'b.up': 'on' };
  const isOpen = (e) => O.isOpenState(states[e] ? { state: states[e] } : undefined, on);
  const floors = [
    { rooms: [{ name: 'Flur', points: [[0, 0], [4, 0], [4, 3], [0, 3]] }], walls: [
      { a: [0, 0], b: [4, 0], openings: [{ id: 'd1', type: 'door', pos: 1, entity: 'b.d1' }, { id: 'w2', type: 'window', pos: 3, entity: 'b.w2' }] },
      { a: [10, 0], b: [14, 0], openings: [{ id: 'g', type: 'door', style: 'garage', pos: 2, entity: 'b.g', name: 'Garage' }] }] },
    { rooms: [{ name: 'Bad', points: [[0, 0], [4, 0], [4, 3], [0, 3]] }], walls: [
      { a: [0, 0], b: [0, 3], openings: [{ id: 'w1', type: 'window', pos: 1, entity: 'b.w1' }, { id: 'up', type: 'door', pos: 2, entity: 'b.up' }] }] }];
  const list = O.openItems(floors, { isOpen, t: (k) => k, pointInPoly: G.pointInPoly, distToPoly: G.distToPoly });
  assert.deepEqual(list.map((x) => x.id), ['up', 'd1', 'g', 'w1']);
  assert.deepEqual(list.map((x) => x.room), ['Bad', 'Flur', '', 'Bad']);
  assert.equal(list.find((x) => x.id === 'g').name, 'Garage');
  assert.equal(list.find((x) => x.id === 'd1').name, 'prop.door');
});

test('cutaway: the wall normal points away from the middle of the floor', () => {
  assert.deepEqual(C.outwardNormal({ a: [0, 0], b: [4, 0] }, 2, 2).map((v) => v + 0), [0, -1]);
  assert.deepEqual(C.outwardNormal({ a: [4, 0], b: [0, 0] }, 2, 2).map((v) => v + 0), [0, -1]);
  assert.deepEqual(C.outwardNormal({ a: [0, 4], b: [4, 4] }, 2, 2).map((v) => v + 0), [0, 1]);
});
test('cutaway: view direction on the ground, and "steep" when looking almost straight down', () => {
  const v = C.viewDirection({ x: 12, y: 5, z: 2 }, 2, 2, 0);
  assert.deepEqual([v.dx, v.dz, v.steep], [1, 0, false]);
  assert.equal(C.viewDirection({ x: 2.5, y: 20, z: 2 }, 2, 2, 0).steep, true);
});
const base = { lowWalls: false, halfCut: false, steep: false, cutaway: true, seeThrough: false, wallSee: 0.3 };
test('cutaway: a wall facing the camera sinks; walls at the back and low / half / steep views stay', () => {
  assert.deepEqual(C.wallTargets([1, 0], 1, 0, base), { low: C.CUT_LOW, fade: 1 });
  assert.deepEqual(C.wallTargets([-1, 0], 1, 0, base), { low: 1, fade: 1 });
  assert.deepEqual(C.wallTargets([0.1, 0.99], 1, 0, base), { low: 1, fade: 1 });     // nearly side-on
  for (const k of ['lowWalls', 'halfCut', 'steep']) assert.deepEqual(C.wallTargets([1, 0], 1, 0, { ...base, [k]: true }), { low: 1, fade: 1 }, k);
  assert.deepEqual(C.wallTargets([1, 0], 1, 0, { ...base, cutaway: false }), { low: 1, fade: 1 });
});
test('cutaway: see-through fades the wall instead of sinking it', () => {
  assert.deepEqual(C.wallTargets([1, 0], 1, 0, { ...base, seeThrough: true }), { low: 1, fade: 0.3 });
});
test('cutaway: approach moves 20 % of the way and snaps when close', () => {
  assert.equal(C.approach(1, 0, 0.002), 0.8);
  assert.equal(C.approach(0.0015, 0, 0.002), 0);
  assert.equal(C.approach(0.5, 0.5, 0.01), 0.5);
});
