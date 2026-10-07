// Unit tests for pickrules.js (what a tap in the live mode may hit, #234; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/pickrules.js`);

test('live mode: presence figures, camera cones, doors and windows take no tap', () => {
  assert.ok(P.skipInLive({ kind: 'device', id: 'p' }, 'presence'));
  assert.ok(P.skipInLive({ kind: 'device', id: 'c', cone: true }, 'camera'));
  assert.ok(P.skipInLive({ kind: 'opening', id: 'o' }));
});
test('live mode: the camera itself, lamps and rooms can still be tapped', () => {
  assert.ok(!P.skipInLive({ kind: 'device', id: 'c' }, 'camera'));
  assert.ok(!P.skipInLive({ kind: 'device', id: 'l' }, 'light'));
  assert.ok(!P.skipInLive({ kind: 'room', id: 'r' }));
  assert.ok(!P.skipInLive(null));
});
test('live mode (#236): temperature, humidity and CO2 sensors take no tap either', () => {
  assert.ok(P.skipInLive({ kind: 'device', id: 's' }, 'sensor'));
  assert.ok(!P.skipInLive({ kind: 'device', id: 't' }, 'thermostat'));        // a thermostat is still set by a tap
});
test('only what is linked to something can be tapped in the live mode', () => {
  assert.ok(P.linkedDevice({ entity: 'light.a' }));
  assert.ok(P.linkedDevice({ entity: '', ledEntity: 'light.tv' }));
  assert.ok(P.linkedDevice({ segs: [{}, { entity: 'light.s' }] }));
  assert.ok(!P.linkedDevice({ entity: '' }));
  assert.ok(!P.linkedDevice(null));
});
test('which hit wins: a door beats a device unless the device is clearly nearer; live taps land on the room', () => {
  const dev = (d) => ({ data: { kind: 'device', id: 'd' }, distance: d }), door = (d) => ({ data: { kind: 'opening', id: 'o' }, distance: d });
  const room = { data: { kind: 'room', id: 'r' }, distance: 9 }, wall = { data: { kind: 'wall', id: 'w' }, distance: 1 }, yes = () => true;
  assert.equal(P.chooseHit([door(5), dev(5.5)], false, yes).data.kind, 'opening');
  assert.equal(P.chooseHit([dev(3), door(5)], false, yes).data.kind, 'device');          // more than 1.2 m in front
  assert.equal(P.chooseHit([wall, dev(4)], false, yes).data.kind, 'device');             // walls never block a tap
  assert.equal(P.chooseHit([wall, room], false, yes), wall);                             // the editor: what comes first
  assert.equal(P.chooseHit([wall, room], true, yes), room);                              // live: the room
  assert.equal(P.chooseHit([door(2), room], true, () => false), room);                   // live: a door linked to nothing does not count
  assert.equal(P.chooseHit([], true, yes), null);
});
