// Unit tests for roomgroups.js (▶ Abläufe by room; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const G = await import(`${process.env.STATIC_DIR || '/tmp/static'}/roomgroups.js`);
const areas = [{ id: 'wz', name: 'Wohnzimmer', entities: ['light.wz', 'light.stehlampe', 'cover.wz', 'scene.wz_aus', 'light.schlaf'] },
  { id: 'buero', name: 'Büro', entities: ['light.buero'] }, { id: 'schlaf', name: 'Schlafzimmer', entities: ['light.schlaf', 'automation.wecker'] }];
const areaOf = G.areaIndex(areas);

test('the area of each entity, the first area that lists it when two do', () => {
  assert.equal(areaOf['light.wz'], 'wz');
  assert.equal(areaOf['light.schlaf'], 'wz');
  assert.equal(areaOf['sensor.none'], undefined);
  assert.deepEqual(G.areaIndex(null), {});
});

test('its own area first, else every area of what it uses, each once', () => {
  assert.deepEqual(G.roomsOf('automation.wecker', ['light.wz'], areaOf), ['schlaf']);
  assert.deepEqual(G.roomsOf('automation.licht', ['light.buero', 'light.wz', 'light.stehlampe'], areaOf), ['buero', 'wz']);
  assert.deepEqual(G.roomsOf('script.filmabend', [], areaOf), []);
  assert.deepEqual(G.roomsOf('', ['sensor.none'], areaOf), []);
  assert.deepEqual(G.roomsOf('scene.wz_aus', null, areaOf), ['wz']);
});

test('the entities of a routine of the add-on, in every lane', () => {
  const f = { lanes: [{ blocks: [{ k: 'motion', ents: ['binary_sensor.wz'] }, { k: 'dark' }, { k: 'light', ents: ['light.stehlampe'] }] }, { blocks: [{ k: 'cover', ents: ['cover.wz'] }] }] };
  assert.deepEqual(G.flowEnts(f), ['binary_sensor.wz', 'light.stehlampe', 'cover.wz']);
  assert.deepEqual(G.flowEnts(null), []);
  assert.deepEqual(G.flowEnts({ lanes: [{ blocks: [{ ents: 'x' }] }] }), []);
});

test('the groups: the rooms with something in them by name, a thing in each of its rooms, the rest loose', () => {
  const items = [{ n: 'a', r: ['wz'] }, { n: 'b', r: ['wz', 'schlaf'] }, { n: 'c', r: [] }, { n: 'd', r: ['gone'] }];
  const g = G.groupRooms(items, (x) => x.r, areas);
  assert.deepEqual(g.loose.map((x) => x.n), ['c', 'd']);                           // an area that is no more: no room
  assert.deepEqual(g.rooms.map((r) => [r.id, r.name, r.items.map((x) => x.n)]), [['schlaf', 'Schlafzimmer', ['b']], ['wz', 'Wohnzimmer', ['a', 'b']]]);
  assert.deepEqual(G.groupRooms([], () => [], areas), { loose: [], rooms: [] });
  assert.deepEqual(G.groupRooms([{ n: 'x' }], () => ['wz'], []).loose.length, 1);  // Home Assistant has no areas: all loose
});

test('the two views, a room icon by its name', () => {
  assert.equal(G.cleanView('rooms'), 'rooms');
  assert.equal(G.cleanView('x'), 'lists');
  assert.equal(G.cleanView(null), 'lists');
  assert.equal(G.roomIcon('Wohnzimmer'), '🛋');
  assert.equal(G.roomIcon('Living room'), '🛋');
  assert.equal(G.roomIcon('Kinderbad'), '🛁');
  assert.equal(G.roomIcon('Eingang'), '🚪');
  assert.equal(G.roomIcon('Esszimmer'), '🍽');
  assert.equal(G.roomIcon('Fitness'), '🏠');
  assert.equal(G.roomIcon(''), '🏠');
});
