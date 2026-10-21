// Unit tests for lightgroups.js (the light list "💡 n an" with groups of rooms, #471; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/lightgroups.js`);

const sq = (x, z, w = 4, d = 4) => [[x, z], [x + w, z], [x + w, z + d], [x, z + d]];
const floors = [
  { name: 'EG', rooms: [{ id: 'wz', name: 'Wohnzimmer', points: sq(0, 0) }, { id: 'ku', name: 'Küche', points: sq(4, 0), area: 'kitchen' }],
    devices: [{ entity: 'light.wz', x: 1, z: 1 }, { entity: 'light.stehlampe', x: 2, z: 2 }, { entity: 'switch.tv', x: 3, z: 3 }, { entity: 'light.garten', x: 20, z: 20 }] },
  { name: 'OG', rooms: [{ id: 'k1', name: 'Kind 1', points: sq(0, 0) }, { id: 'k2', name: '', points: sq(4, 0) }],
    devices: [{ entity: 'light.k1', x: 1, z: 1 }, { entity: 'light.k2', x: 5, z: 1 }] },
];
const areas = { kitchen: ['light.kueche', 'sensor.kueche_temp'] };
const on = new Set(['light.wz', 'light.garten', 'light.k1', 'light.kueche']);
const env = (groups, extra = {}) => ({ floors, groups, placed: (f) => f.devices, areaEntities: (r) => areas[r.area] || [], isOn: (e) => on.has(e), ...extra });

test('the whole house: every light placed (also outside the rooms, the garden) and those of the rooms\' areas, not switches', () => {
  const [house] = L.lightRows(env([]));
  assert.equal(house.id, L.HOUSE);
  assert.deepEqual(house.lights.sort(), ['light.garten', 'light.k1', 'light.k2', 'light.kueche', 'light.stehlampe', 'light.wz']);
  assert.deepEqual(house.on.sort(), ['light.garten', 'light.k1', 'light.kueche', 'light.wz']);
  assert.equal(house.rooms, 4);
  assert.equal(L.lightsOn(L.lightRows(env([]))), 4);
  assert.equal(L.lightsOn([]), 0);
});

test('groups: their rooms\' lights, in their order; a group without a room of this plan is left out', () => {
  const groups = [{ id: 'kids', name: 'Kinder', rooms: ['k1', 'k2'] }, { id: 'live', name: 'Wohnen', rooms: ['wz', 'ku'] }, { id: 'other', name: 'Nachbar', rooms: ['x9'] }];
  const rows = L.lightRows(env(groups));
  assert.deepEqual(rows.map((r) => r.id), ['*', 'kids', 'live']);
  assert.deepEqual(rows[1].lights, ['light.k1', 'light.k2']);
  assert.deepEqual(rows[1].on, ['light.k1']);
  assert.deepEqual(rows[2].lights.sort(), ['light.kueche', 'light.stehlampe', 'light.wz']);
  assert.deepEqual(rows[2].on.sort(), ['light.kueche', 'light.wz']);
});

test('somebody in a room of the row: it says so (only when asked, it costs a little)', () => {
  const groups = [{ id: 'kids', name: 'Kinder', rooms: ['k1', 'k2'] }, { id: 'live', name: 'Wohnen', rooms: ['wz'] }];
  const rows = L.lightRows(env(groups, { occupied: (r) => r.id === 'k2' }));
  assert.deepEqual(rows.map((r) => [r.id, r.occupied]), [['*', true], ['kids', true], ['live', false]]);
  assert.ok(L.lightRows(env(groups)).every((r) => r.occupied === false));
});

test('"Off" needs two taps on the same row within CONFIRM_MS (nothing goes off by accident)', () => {
  let s = L.confirmTap(null, '*', 1000);
  assert.deepEqual(s, { fire: false, armed: { id: '*', at: 1000 } });
  assert.deepEqual(L.confirmTap(s.armed, '*', 1000 + L.CONFIRM_MS), { fire: true, armed: null });
  assert.equal(L.confirmTap(s.armed, '*', 1001 + L.CONFIRM_MS).fire, false);           // too late: it asks again
  s = L.confirmTap(s.armed, 'kids', 1500);                                              // another row: that one asks first
  assert.deepEqual(s, { fire: false, armed: { id: 'kids', at: 1500 } });
  assert.equal(L.confirmTap({ id: 'kids', at: 2000 }, 'kids', 1900).fire, false);        // a clock that went back is no second tap
});

test('stored groups made safe: names, ids, rooms, at most MAX_GROUPS', () => {
  const g = L.cleanGroups([{ id: 'a', name: '  Kinder  ', rooms: ['k1', 'k1', '', 3, 'k2'] }, { id: 'a', name: '', rooms: 'x' }, null, 'x', { name: 'x'.repeat(80) }], (i) => `Gruppe ${i}`);
  assert.deepEqual(g[0], { id: 'a', name: 'Kinder', rooms: ['k1', 'k2'] });
  assert.deepEqual(g[1], { id: 'a_', name: 'Gruppe 2', rooms: [] });                     // the same id twice: made unique; no name: numbered
  assert.equal(g[2].id, 'g3'); assert.equal(g[2].name.length, L.MAX_NAME);
  assert.equal(g.length, 3);
  assert.deepEqual(L.cleanGroups('x'), []);
  assert.equal(L.cleanGroups(Array.from({ length: 20 }, (_, i) => ({ id: `g${i}`, name: 'n', rooms: [] }))).length, L.MAX_GROUPS);
});

test('the editor: rooms by floor and name, unnamed ones named; new ids never taken', () => {
  assert.deepEqual(L.roomChoices(floors, '?'), [
    { floor: 'EG', rooms: [{ id: 'ku', name: 'Küche' }, { id: 'wz', name: 'Wohnzimmer' }] },
    { floor: 'OG', rooms: [{ id: 'k2', name: '?' }, { id: 'k1', name: 'Kind 1' }] }]);
  assert.deepEqual(L.roomChoices([{ rooms: [] }, { name: '', rooms: [{ id: 'r', name: 'R' }] }]), [{ floor: '#2', rooms: [{ id: 'r', name: 'R' }] }]);
  const id = L.newGroupId([{ id: 'g0' }], () => 0);
  assert.equal(id, 'g0_');
  assert.match(L.newGroupId([], Math.random), /^g[0-9a-z]+$/);
});
