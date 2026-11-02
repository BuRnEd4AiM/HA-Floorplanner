// Unit tests for floorpanel.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/floorpanel.js`);
const DM = await import(`${process.env.STATIC_DIR || '/tmp/static'}/dormer.js`);
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

test('dormer width (#339): the start (distance from the gable) stays where it is', () => {
  const bb = { x0: 0, x1: 10, z0: 0, z1: 6 }, r = { type: 'gable', pitch: 35, overhang: 0.4 };
  const d = { type: 'shed', w: 2, pos: 0 };
  d.pos = DM.posForStart(bb, r, d, 3);
  F.setDormerWidth(bb, r, d, 5);
  assert.equal(d.w, 5);
  assert.ok(Math.abs(DM.dormerStart(bb, r, d) - 3) < 1e-9);
  const e = { w: 2, pos: 0.4 };
  F.setDormerWidth(null, r, e, 3);                                   // no roof box: only the width
  assert.deepEqual(e, { w: 3, pos: 0.4 });
});
test('dormer type (#339): a shed dormer goes onto the outer wall, a shed pitch stays sensible', () => {
  const d = { type: 'gable', eave: 0.8 };
  F.setDormerType(d, 'flat', { overhang: 0.5 });
  assert.deepEqual(d, { type: 'flat', eave: 0.8 });
  F.setDormerType(d, 'shed', { overhang: 0.5 });
  assert.deepEqual(d, { type: 'shed', eave: 0.5 });
  F.setDormerType(d, 'shed', { overhang: 0 });
  assert.equal(d.eave, 0.2);
  assert.deepEqual([F.clampShedPitch(12), F.clampShedPitch(0), F.clampShedPitch(99), F.clampShedPitch('x'), F.clampShedPitch(1)], [12, 15, 60, 15, 2]);
});
test('a new step (#342): side A, in the middle of the house, 50 cm out', () => {
  assert.deepEqual(F.newStep({ x0: 0, x1: 12, z0: 0, z1: 9 }, { type: 'gable' }), { side: 0, at: 6, out: 0.5 });
  assert.deepEqual(F.newStep({ x0: 0, x1: 6, z0: 0, z1: 9 }, { type: 'gable' }), { side: 0, at: 4.5, out: 0.5 }, 'ridge along z: along z');
  assert.equal(F.newStep(null, {}).at, 2);
});
test('the second wing of an L-shaped house (#621): the rooms outside the main roof, up to the main ridge, its ridge across', () => {
  const room = (pts) => ({ points: pts });
  const L = { walls: [], rooms: [room([[0, 0], [12, 0], [12, 8], [0, 8]]), room([[0, 8], [7, 8], [7, 15], [0, 15]])] };
  const mb = { x0: 0, x1: 12, z0: 0, z1: 8 };
  assert.deepEqual(F.wingBox(L, mb, true), { x0: 0, x1: 7, z0: 4, z1: 15, ridge: 'z' }, 'behind the main roof: from its ridge (z 4) to the end of the wing');
  const front = { walls: [], rooms: [room([[0, 0], [12, 0], [12, 8], [0, 8]]), room([[5, -6], [12, -6], [12, 0], [5, 0]])] };
  assert.deepEqual(F.wingBox(front, mb, true), { x0: 5, x1: 12, z0: -6, z1: 4, ridge: 'z' }, 'in front of it');
  const side = { walls: [], rooms: [room([[0, 0], [8, 0], [8, 12], [0, 12]]), room([[8, 0], [15, 0], [15, 7], [8, 7]])] };
  assert.deepEqual(F.wingBox(side, { x0: 0, x1: 8, z0: 0, z1: 12 }, false), { x0: 4, x1: 15, z0: 0, z1: 7, ridge: 'x' }, 'ridge along z, the wing to the right');
  const walls = { rooms: [], walls: [[[0, 0], [12, 0]], [[12, 0], [12, 8]], [[12, 8], [7, 8]], [[7, 8], [7, 15]], [[7, 15], [0, 15]], [[0, 15], [0, 0]]].map(([a, b]) => ({ a, b })) };
  assert.deepEqual(F.wingBox(walls, mb, true), { x0: 0, x1: 7, z0: 4, z1: 15, ridge: 'z' }, 'no rooms: the walls outside');
  assert.equal(F.wingBox({ walls: [], rooms: [room([[1, 1], [11, 1], [11, 7], [1, 7]])] }, mb, true), null, 'everything under the main roof');
  assert.equal(F.wingBox(null, mb, true), null);
  const end = { walls: [], rooms: [room([[0, 0], [12, 0], [12, 8], [0, 8]]), room([[12, 0], [18, 0], [18, 14], [12, 14]])] };
  assert.deepEqual(F.wingBox(end, mb, true), { x0: 12, x1: 18, z0: 0, z1: 14 }, 'beyond its gable end: no ridge given (along its longer side)');
  // rooms across the edge of the main roof: only what lies beyond it counts; `limit` leaves out a garage under a roof terrace
  const split = { walls: [], rooms: [room([[0, 0], [8, 0], [8, 7], [0, 7]]), room([[8, 0], [15, 0], [15, 7], [8, 7]])] };
  assert.deepEqual(F.wingBox(split, { x0: 0, x1: 5, z0: 0, z1: 7 }, false, { x0: 0, x1: 10, z0: 0, z1: 7 }), { x0: 2.5, x1: 10, z0: 0, z1: 7, ridge: 'x' });
  const apart = { walls: [], rooms: [room([[0, 0], [12, 0], [12, 8], [0, 8]]), room([[2, 10], [6, 10], [6, 14], [2, 14]])] };
  assert.deepEqual(F.wingBox(apart, mb, true), { x0: 2, x1: 6, z0: 10, z1: 14 }, 'a building standing apart: not joined to the main roof');
});
test('a new roof shape (#628): a shed roof loses dormers and steps, gets a shed pitch and leans against the main roof', () => {
  const mb = { x0: 0, x1: 10, z0: 0, z1: 6 };
  const p = { type: 'gable', pitch: 35, overhang: 0.4, dormers: [{}], steps: [{ side: 0, at: 1, out: 1 }], box: { x0: 0, x1: 10, z0: 6, z1: 9 } };
  F.setRoofType(p, 'shed', mb);
  assert.deepEqual([p.type, p.pitch, p.high, p.dormers, p.steps], ['shed', 10, 'z0', undefined, undefined]);
  const q = { type: 'gable', pitch: 22, box: { x0: -3, x1: 0, z0: 0, z1: 6 } };
  F.setRoofType(q, 'shed', mb);
  assert.deepEqual([q.pitch, q.high], [22, 'x1'], 'a pitch a shed roof can have stays; it lies left of the house');
  assert.equal(F.setRoofType({ type: 'gable', pitch: 40 }, 'shed').pitch, 10, 'a gable roof\'s 40° is too steep');
  const m = { type: 'gable', pitch: 35, dormers: [{}] };
  F.setRoofType(m, 'shed');
  assert.equal(m.high, 'z0', 'the main roof: high at the top unless chosen');
  F.setRoofType(m, 'hip');
  assert.equal(m.type, 'hip');
  assert.equal(F.setRoofType({}, 'nonsense').type, 'gable');
  const f = F.setRoofType({ type: 'gable', dormers: [{}] }, 'flat');
  assert.equal(f.dormers, undefined);
});
