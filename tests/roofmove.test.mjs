// Unit tests for roofmove.js (moving roofs, #255; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/roofmove.js`);
const auto = { x0: 0, x1: 10, z0: 0, z1: 8 };
const roofFloor = () => ({
  id: 'dach', kind: 'roof', devices: [{ id: 's1', type: 'solarpanel', x: 2, z: 2 }, { id: 's2', type: 'solarpanel', x: 20, z: 2 }, { id: 'l', type: 'light', x: 3, z: 3 }],
  roof: { type: 'gable', parts: [{ id: 'rp1', name: 'Garage', box: { x0: 12, x1: 16, z0: 0, z1: 5 } }, { id: 'rp2', box: { x0: 1, x1: 3, z0: 1, z1: 3 } }] },
});

test('the roofs of a roof floor: the main one (from the house until moved) and the further ones; none on other floors', () => {
  const r = R.roofRects(roofFloor(), auto);
  assert.deepEqual(r.map((x) => [x.id, x.main, x.name]), [['dach:roof', true, ''], ['rp1', false, 'Garage'], ['rp2', false, '']]);
  assert.deepEqual(r[0].box, auto);
  assert.deepEqual(R.roofRects({ kind: 'floor' }, auto), []);
  assert.deepEqual(R.roofRects({ id: 'd', kind: 'roof' }, null), []);              // nothing below the roof yet
});
test('the roof under a point: the small further roof inside the main one wins', () => {
  const r = R.roofRects(roofFloor(), auto);
  assert.equal(R.roofAt(r, 2, 2).id, 'rp2');
  assert.equal(R.roofAt(r, 8, 6).id, 'dach:roof');
  assert.equal(R.roofAt(r, 14, 1).id, 'rp1');
  assert.equal(R.roofAt(r, 30, 30), null);
});
test('moving the main roof gives it a box of its own; its solar panels go along, other things stay', () => {
  const f = roofFloor();
  assert.equal(R.moveRoof(f, 'dach:roof', 1.5, -0.5, auto), true);
  assert.deepEqual(f.roof.box, { x0: 1.5, x1: 11.5, z0: -0.5, z1: 7.5 });
  assert.deepEqual([f.devices[0].x, f.devices[0].z], [3.5, 1.5]);                  // on the roof
  assert.deepEqual([f.devices[1].x, f.devices[2].x], [20, 3]);                     // elsewhere / not a panel
  assert.deepEqual(auto, { x0: 0, x1: 10, z0: 0, z1: 8 });                         // the house's box is not touched
});
test('moving a further roof; unknown roof or no move changes nothing', () => {
  const f = roofFloor();
  R.moveRoof(f, 'rp1', -2, 1, auto);
  assert.deepEqual(f.roof.parts[0].box, { x0: 10, x1: 14, z0: 1, z1: 6 });
  assert.equal(f.roof.box, undefined);                                             // the main roof keeps following the house
  assert.equal(R.moveRoof(f, 'nope', 1, 1, auto), false);
  assert.equal(R.moveRoof(f, 'rp1', 0, 0, auto), false);
  assert.equal(R.moveRoof({ id: 'x', kind: 'roof', roof: {} }, 'x:roof', 1, 0, null), false);   // no house below: nothing to move
});
test('dragging: the corner snaps to the grid, the step is what is still missing', () => {
  const start = { x0: 1, z0: 2 };
  assert.deepEqual(R.dragStep(start, start, 0.62, -0.31, 0.25), { dx: 0.5, dz: -0.25 });
  assert.deepEqual(R.dragStep(start, { x0: 1.5, z0: 1.75 }, 0.62, -0.31, 0.25), { dx: 0, dz: 0 });
  assert.deepEqual(R.dragStep(start, start, 0.62, -0.31, 0), { dx: 0.62, dz: -0.31 });
});
