// Pure placement tests for autoplace.js (run: cp floorplan3d/rootfs/app/static/autoplace.js /tmp/autoplace.mjs && AUTOPLACE_MJS=/tmp/autoplace.mjs node --test tests/autoplace.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const A = await import(process.env.AUTOPLACE_MJS || '/tmp/autoplace.mjs');
const ROOM = { points: [[0, 0], [5, 0], [5, 4], [0, 4]] };
const DOOR = { id: 'o1', type: 'door', a: [0.5, 0], b: [1.4, 0], entity: '' };
const WIN = { id: 'o2', type: 'window', a: [2, 4], b: [3.2, 4], entity: '' };
const e = (entity_id, dc, unit) => ({ entity_id, domain: entity_id.split('.')[0], dc, unit });
const inside = (d) => A.pointInPoly(d.x, d.z, ROOM.points);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('what is placed where: lights, switches, sensors, presence, smoke; noise is skipped', () => {
  assert.equal(A.classify(e('light.a')).layer, 'ceiling');
  assert.equal(A.classify(e('switch.a')).type, 'switch');
  assert.equal(A.classify(e('climate.a')).type, 'thermostat');
  assert.equal(A.classify(e('sensor.t', 'temperature', '°C')).type, 'sensor');
  assert.equal(A.classify(e('binary_sensor.m', 'motion')).type, 'presence');
  assert.equal(A.classify(e('binary_sensor.s', 'smoke')).type, 'smoke');
  assert.equal(A.classify(e('binary_sensor.w', 'window')).layer, 'opening');
  for (const n of [e('sensor.bat', 'battery', '%'), e('sensor.rssi', 'signal_strength', 'dBm'), e('sensor.kwh', 'energy', 'kWh'), e('scene.x'), e('automation.x'), e('binary_sensor.upd', 'update')]) assert.equal(A.classify(n), null, n.entity_id);
});

test('lights are spread evenly under the ceiling, inside the room and apart', () => {
  const p = A.planPlacement(ROOM, [e('light.1'), e('light.2'), e('light.3'), e('light.4')], { wallHeight: 2.6 });
  assert.equal(p.devices.length, 4);
  p.devices.forEach((d) => { assert.ok(inside(d)); assert.equal(d.y, 2.55); assert.equal(d.type, 'light'); });
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(dist(p.devices[i], p.devices[j]) > 1.5);
  const one = A.planPlacement(ROOM, [e('light.1')]).devices[0];
  assert.ok(Math.abs(one.x - 2.5) < 0.3 && Math.abs(one.z - 2) < 0.3, JSON.stringify(one));   // a single light hangs in the middle
});

test('the switch goes next to the door, wall things not in front of door or window', () => {
  const p = A.planPlacement(ROOM, [e('sensor.t', 'temperature', '°C'), e('switch.licht'), e('climate.h')], { openings: [DOOR, WIN] });
  const sw = p.devices.find((d) => d.entity === 'switch.licht');
  assert.ok(Math.hypot(sw.x - 0.95, sw.z) < 1.2, JSON.stringify(sw));
  p.devices.forEach((d) => {
    assert.ok(d.wall && inside(d));
    assert.ok(!(d.z < 0.3 && d.x > 0.3 && d.x < 1.6), `${d.entity} in front of the door`);
    if (d.type !== 'thermostat') assert.ok(!(d.z > 3.7 && d.x > 1.8 && d.x < 3.4), `${d.entity} in front of the window`);   // heating belongs under it
  });
  assert.ok(dist(p.devices[0], p.devices[1]) > 0.4 && dist(p.devices[1], p.devices[2]) > 0.4 && dist(p.devices[0], p.devices[2]) > 0.4);
  const t = p.devices.find((d) => d.entity === 'sensor.t');
  assert.equal(t.y, 1.6);
});

test('heating goes under the window, the motion figure not under a lamp or onto the room name', () => {
  const p = A.planPlacement(ROOM, [e('climate.h'), e('light.1'), e('binary_sensor.s', 'smoke'), e('binary_sensor.m', 'motion')], { openings: [DOOR, WIN] });
  const h = p.devices.find((d) => d.entity === 'climate.h');
  assert.ok(Math.abs(h.x - 2.6) < 0.3 && h.z > 3.7, JSON.stringify(h));
  const m = p.devices.find((d) => d.entity === 'binary_sensor.m');
  p.devices.filter((d) => d !== m && d.y > 2).forEach((d) => assert.ok(dist(m, d) > 0.6, `${JSON.stringify(m)} under ${d.entity}`));
  assert.ok(dist(m, { x: 2.5, z: 2 }) > 0.6, JSON.stringify(m));
});

test('wall things face into the room', () => {
  const p = A.planPlacement(ROOM, [e('camera.c'), e('climate.h'), e('switch.a'), e('switch.b')]);
  p.devices.forEach((d) => {
    const a = (d.rot * Math.PI) / 180, fx = d.x + Math.sin(a) * 0.5, fz = d.z + Math.cos(a) * 0.5;
    assert.ok(A.pointInPoly(fx, fz, ROOM.points), `${d.entity} faces out (rot ${d.rot})`);
  });
});

test('contacts go onto matching doors and windows that have no sensor yet; extra ones are skipped', () => {
  const p = A.planPlacement(ROOM, [e('binary_sensor.fenster', 'window'), e('binary_sensor.tuer', 'door'), e('binary_sensor.fenster2', 'window')],
    { openings: [DOOR, WIN] });
  assert.deepEqual(p.openings, [{ id: 'o2', entity: 'binary_sensor.fenster' }, { id: 'o1', entity: 'binary_sensor.tuer' }]);
  assert.deepEqual(p.skipped, ['binary_sensor.fenster2']);
  const q = A.planPlacement(ROOM, [e('binary_sensor.x', 'window')], { openings: [{ ...WIN, entity: 'binary_sensor.old' }] });
  assert.deepEqual(q.openings, []);
});

test('what is already in the room is kept clear of', () => {
  const p = A.planPlacement(ROOM, [e('light.new')], { existing: [{ x: 2.5, z: 2, layer: 'ceiling' }] });
  assert.ok(dist(p.devices[0], { x: 2.5, z: 2 }) > 0.8, JSON.stringify(p.devices[0]));
});

test('L-shaped room: everything stays inside', () => {
  const L = { points: [[0, 0], [6, 0], [6, 2.5], [2.5, 2.5], [2.5, 6], [0, 6]] };
  const items = [e('light.1'), e('light.2'), e('light.3'), e('binary_sensor.m', 'motion'), e('switch.a'), e('sensor.h', 'humidity', '%'), e('media_player.tv')];
  const p = A.planPlacement(L, items);
  assert.equal(p.devices.length, items.length);
  p.devices.forEach((d) => assert.ok(A.pointInPoly(d.x, d.z, L.points), JSON.stringify(d)));
});
