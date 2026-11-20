// Unit tests for firststeps.js (🧭 Erste Schritte; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/firststeps.js`);
const states = (p) => p.steps.map((s) => s.state).join(' ');

test('an empty house: step 1 is open, nothing done', () => {
  const p = F.progress({ rooms: 0, linked: 0, areas: 5, toLink: 0, unplaced: 0, devices: 0 });
  assert.equal(p.now, 'draw'); assert.equal(states(p), 'now later later later'); assert.equal(p.percent, 0); assert.equal(p.done, false);
});

test('rooms drawn, some linked: step 2 open with its part in the percent', () => {
  const p = F.progress({ rooms: 4, linked: 1, areas: 5, toLink: 2, unplaced: 3, devices: 0 });
  assert.equal(p.now, 'link'); assert.equal(states(p), 'done now later later'); assert.equal(p.percent, 31);   // 25 + 25 * 1/4
});

test('linking is done when nothing more links by name (the picture: 8 of 9), or every room is linked, or Home Assistant has no areas', () => {
  assert.equal(F.progress({ rooms: 9, linked: 8, areas: 9, toLink: 0, unplaced: 46, devices: 0 }).now, 'place');
  assert.equal(F.progress({ rooms: 3, linked: 3, areas: 9, toLink: 0, unplaced: 2, devices: 1 }).now, 'place');
  assert.equal(F.progress({ rooms: 3, linked: 0, areas: 0, toLink: 0, unplaced: 0, devices: 2 }).now, 'live');
  assert.equal(F.progress({ rooms: 3, linked: 0, areas: 4, toLink: 0, unplaced: 0, devices: 0 }).now, 'link');   // none linked yet
});

test('placing: the part is placed / (placed + still to place); then the live view; all done', () => {
  const p = F.progress({ rooms: 9, linked: 8, areas: 9, toLink: 0, unplaced: 30, devices: 10 });
  assert.equal(p.percent, 56);                                      // 50 + 25 * 10/40
  assert.equal(F.progress({ rooms: 9, linked: 9, areas: 9, toLink: 0, unplaced: 0, devices: 40 }).now, 'live');
  const all = F.progress({ rooms: 9, linked: 9, areas: 9, toLink: 0, unplaced: 0, devices: 40, liveSeen: true });
  assert.equal(all.done, true); assert.equal(all.percent, 100); assert.equal(states(all), 'done done done done');
});

test('toPlace: the linked rooms with entities not in the plan, each entity once, only placeable ones', () => {
  const layout = { floors: [{ rooms: [{ id: 'r1', area: 'kitchen' }, { id: 'r2' }] }, { rooms: [{ id: 'r3', area: 'kitchen' }, { id: 'r4', area: 'bath' }] }] };
  const areas = [{ id: 'kitchen', entities: ['light.k', 'sensor.energy', 'switch.k'] }, { id: 'bath', entities: ['light.b'] }];
  const out = F.toPlace(layout, areas, new Set(['switch.k']), (id) => id !== 'sensor.energy');
  assert.deepEqual(out.map((x) => [x.fi, x.room.id, x.ids]), [[0, 'r1', ['light.k']], [1, 'r4', ['light.b']]]);
  assert.deepEqual(F.toPlace(layout, [], new Set()), []);
  assert.deepEqual(F.firstUnlinked(layout), { fi: 0, room: { id: 'r2' } });
  assert.equal(F.firstUnlinked({ floors: [{ rooms: [{ id: 'a', area: 'x' }] }] }), null);
});
