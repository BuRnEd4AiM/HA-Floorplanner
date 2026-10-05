// Unit tests for floorpanel.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/floorpanel.js`);
const t = (k) => k;

test('a new floor is empty; a roof floor gets the default roof (its own copy)', () => {
  const f = F.newFloor('floor', 'OG', 'x1');
  assert.deepEqual(f, { id: 'x1', name: 'OG', kind: 'floor', walls: [], rooms: [], devices: [], blocks: [], stairs: [] });
  const r1 = F.newFloor('roof', 'Dach', 'r1'), r2 = F.newFloor('roof', 'Dach', 'r2');
  assert.deepEqual(r1.roof, { type: 'gable', pitch: 35, overhang: 0.4 });
  r1.roof.pitch = 50;
  assert.equal(r2.roof.pitch, 35);
});
test('offered names: basement, roof, or "new floor" with the next number', () => {
  assert.equal(F.floorLabel('basement', 3, t), 'floor.basement');
  assert.equal(F.floorLabel('roof', 3, t), 'floor.roof');
  assert.equal(F.floorLabel('floor', 3, t), 'floor.new 4');
});
test('pitch: 5° to 70°, nonsense gives 35°', () => {
  assert.equal(F.clampPitch('45'), 45);
  assert.equal(F.clampPitch(90), 70);
  assert.equal(F.clampPitch(1), 5);
  assert.equal(F.clampPitch('x'), 35);
});
test('moving a floor swaps it with its neighbour; at the ends nothing happens', () => {
  const fl = ['K', 'EG', 'OG'];
  assert.equal(F.swapFloors(fl, 1, 1), 2); assert.deepEqual(fl, ['K', 'OG', 'EG']);
  assert.equal(F.swapFloors(fl, 0, -1), null); assert.deepEqual(fl, ['K', 'OG', 'EG']);
  assert.equal(F.swapFloors(fl, 2, 1), null);
});
test('base box: left / top move the box, width / depth move the far edge, never smaller than 1 m', () => {
  const b = { x0: 0, x1: 4, z0: 0, z1: 3 };
  assert.deepEqual(F.editBox({ ...b }, 'left', 2), { x0: 2, x1: 6, z0: 0, z1: 3 });
  assert.deepEqual(F.editBox({ ...b }, 'top', -1), { x0: 0, x1: 4, z0: -1, z1: 2 });
  assert.deepEqual(F.editBox({ ...b }, 'width', 6), { x0: 0, x1: 6, z0: 0, z1: 3 });
  assert.deepEqual(F.editBox({ ...b }, 'depth', 0.2), { x0: 0, x1: 4, z0: 0, z1: 1 });
  assert.deepEqual(F.editBox({ x0: 0, x1: 0.5, z0: 0, z1: 3 }, 'top', 0), { x0: 0, x1: 1, z0: 0, z1: 3 });
});
test('base of a further roof: the outline of the floor, or 4 x 4 m', () => {
  const f = { walls: [{ a: [1, 2], b: [9, 2] }], rooms: [{ points: [[1, 2], [9, 2], [9, 7], [1, 7]] }] };
  assert.deepEqual(F.boxOf(f), { x0: 1, x1: 9, z0: 2, z1: 7 });
  assert.deepEqual(F.boxOf(undefined), { x0: 0, x1: 4, z0: 0, z1: 4 });
  assert.deepEqual(F.boxOf({ walls: [], rooms: [] }), { x0: 0, x1: 4, z0: 0, z1: 4 });
});
test('new dormers alternate sides and spread out: middle, quarter, three quarters', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(F.nextDormerSpot), [
    { side: 0, pos: 0.5 }, { side: 1, pos: 0.5 }, { side: 0, pos: 0.25 }, { side: 1, pos: 0.25 }, { side: 0, pos: 0.75 }, { side: 1, pos: 0.75 }, { side: 0, pos: 0.5 }]);
});
