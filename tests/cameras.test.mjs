// Unit tests for cameras.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/cameras.js`);
const on = new Set(['on']);
const inRoom = (x, z, pts) => x >= pts[0][0] && x <= pts[2][0] && z >= pts[0][1] && z <= pts[2][1];
const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

test('cone: first point is the camera, the fan has fov/6 steps and reaches the range', () => {
  const p = C.conePoints({ fov: 90, range: 4, rot: 0 });
  assert.deepEqual(p[0], [0, 0]);
  assert.equal(p.length, 1 + 15 + 1);
  for (const [x, z] of p.slice(1)) assert.ok(Math.abs(Math.hypot(x, z) - 4) < 1e-9);
});
test('cone: looks along +z for rot 0 and turns with rot; fov and range are clamped', () => {
  const mid = (p) => p[Math.ceil(p.length / 2)];
  assert.ok(mid(C.conePoints({ fov: 60, range: 2, rot: 0 }))[1] > 1.9);
  assert.ok(mid(C.conePoints({ fov: 60, range: 2, rot: 90 }))[0] > 1.9);
  assert.ok(C.conePoints({ fov: 999, range: 0 }).length > 2);
  assert.ok(Math.hypot(...C.conePoints({ fov: 90, range: 0 })[1]) >= 0.5 - 1e-9);
});
const layout = { floors: [
  { name: 'EG', rooms: [{ name: 'Flur', points: sq(0, 0, 4, 4) }, { name: 'Küche', points: sq(5, 0, 9, 4) }], devices: [
    { id: 'c1', type: 'camera', entity: 'camera.flur', name: 'Flur-Cam', x: 1, z: 1, motionEntity: 'binary_sensor.m1' },
    { id: 'c2', type: 'camera', entity: 'camera.kueche', name: 'Küche-Cam', x: 6, z: 1 },
    { id: 's1', type: 'sensor', entity: 'binary_sensor.pir', name: 'PIR', x: 2, z: 2 },
    { id: 'l1', type: 'light', entity: 'light.x', x: 2, z: 2 },
    { id: 'cx', type: 'camera', entity: 'light.nocamera', x: 2, z: 2 } ] },
  { name: 'OG', rooms: [], devices: [{ id: 'c3', type: 'camera', entity: 'camera.og', name: 'OG-Cam', x: 1, z: 1 }] } ] };
const states = { 'binary_sensor.m1': { state: 'on' }, 'binary_sensor.pir': { state: 'off', dc: 'motion' } };
const env = (st = states) => ({ layout, states: st, onStates: on, pointInPoly: inRoom });

test('list: cameras with a camera entity and motion sensors, with room; motion first, then floor', () => {
  const l = C.cameraEntries(env());
  assert.equal(l.length, 4);
  assert.equal(l[0].d.id, 'c1'); assert.equal(l[0].motion, true); assert.equal(l[0].room, 'Flur');
  assert.ok(!l.some((x) => x.d.id === 'l1' || x.d.id === 'cx'));
  assert.equal(l.find((x) => x.d.id === 's1').kind, 'sensor');
  assert.equal(l.find((x) => x.d.id === 'c3').room, '');
});
test('motion places: room names, floor name when the camera hangs in no room, no duplicates', () => {
  const st = { ...states, 'binary_sensor.pir': { state: 'on', dc: 'motion' } };
  assert.deepEqual(C.motionPlaces(C.cameraEntries(env(st)), layout), ['Flur']);
  const l = C.cameraEntries(env()); l.find((x) => x.d.id === 'c3').motion = true;
  assert.deepEqual(C.motionPlaces(l, layout).sort(), ['Flur', 'OG']);
});
test('groups: one per floor+room, groups with movement first', () => {
  const g = C.groupCameras(C.cameraEntries(env()));
  assert.equal(g[0].room, 'Flur');
  assert.ok(g.length >= 3);
  assert.equal(g.reduce((n, x) => n + x.cams.length, 0), 4);
});
