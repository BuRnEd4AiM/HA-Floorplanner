// Unit tests for buildingents.js (#677: with a building chosen at the top every page shows only what belongs to it; run like
// offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = process.env.STATIC_DIR || '/tmp/static';
const B = await import(`${S}/buildingents.js`);
const { viewOf } = await import(`${S}/buildings.js`);
const { cleanCustomTabs } = await import(`${S}/tabs.js`);

const sq = (x, z, w = 4) => [[x, z], [x + w, z], [x + w, z + w], [x, z + w]];
/** a plan with two buildings side by side and a lamp in the garden between them */
const PLAN = {
  buildings: [{ id: 'haus', name: 'Haupthaus' }, { id: 'anbau', name: 'Anbau' }],
  floors: [{ name: 'EG', rooms: [{ id: 'wz', name: 'Wohnzimmer', points: sq(0, 0), building: 'haus', area: 'a_wz' },
    { id: 'hw', name: 'Hauswirtschaft', points: sq(10, 0), building: 'anbau' }],
  walls: [{ id: 'w1', a: [0, 0], b: [4, 0], openings: [{ id: 'o1', type: 'window', entity: 'binary_sensor.fenster_wz' }] }],
  devices: [{ id: 'd1', type: 'thermostat', entity: 'climate.wz', x: 2, z: 2 }, { id: 'd2', type: 'washer', entity: 'sensor.waschmaschine', x: 12, z: 2 },
    { id: 'd3', type: 'lamp', entity: 'light.garten', x: 7, z: 9 }] }],
};
const AREAS = { a_wz: ['media_player.tv', 'climate.wz'] };
const H = { devices: (f) => (f.devices || []).map((d) => d.entity), openings: (f) => (f.walls || []).flatMap((w) => (w.openings || []).map((o) => o.entity)),
  area: (r) => AREAS[r.area] || [] };
const sets = B.buildingSets(['haus', 'anbau'], (b) => viewOf(PLAN, b), H);

test('the entities of each building: devices, windows in its walls, the area of its rooms; the garden in both', () => {
  assert.deepEqual([...sets.get('haus')].sort(), ['binary_sensor.fenster_wz', 'climate.wz', 'light.garten', 'media_player.tv']);
  assert.deepEqual([...sets.get('anbau')].sort(), ['light.garten', 'sensor.waschmaschine']);
});

test('the filter: what belongs to another building is left out, what belongs to none always shows', () => {
  const anbau = B.buildingFilter(sets, 'anbau');
  assert.equal(anbau('sensor.waschmaschine'), true);
  assert.equal(anbau('climate.wz'), false);
  assert.equal(anbau('media_player.tv'), false);                 // in the area of the living room
  assert.equal(anbau('light.garten'), true);                     // the plot
  assert.equal(anbau('weather.home'), true);                     // in no building
  assert.equal(anbau(''), true);
  const haus = B.buildingFilter(sets, 'haus');
  assert.equal(haus('sensor.waschmaschine'), false);
  assert.equal(haus('climate.wz'), true);
  assert.equal(B.buildingFilter(sets, null)('climate.wz'), true); // all buildings shown
  const groups = { 'light.wz_alle': ['climate.wz', 'media_player.tv'], 'light.alle': ['climate.wz', 'sensor.waschmaschine'], 'scene.leer': [] };
  const g = B.buildingFilter(sets, 'anbau', (e) => groups[e]);
  assert.equal(g('light.wz_alle'), false);                        // a group in no building: all its members in the other one
  assert.equal(g('light.alle'), true);                            // one of them here
  assert.equal(g('scene.leer'), true);
  assert.equal(B.buildingFilter(sets, 'weg')('climate.wz'), true);   // an unknown one: everything
});

test('own cards: with devices only when one of them shows, a room card in its building, the others always', () => {
  const shows = B.buildingFilter(sets, 'anbau'), rooms = (id) => id === 'hw';
  assert.equal(B.cardShows({ type: 'thermostat' }, ['climate.wz'], shows, rooms), false);
  assert.equal(B.cardShows({ type: 'graph' }, ['climate.wz', 'sensor.waschmaschine'], shows, rooms), true);
  assert.equal(B.cardShows({ type: 'text' }, [], shows, rooms), true);
  assert.equal(B.cardShows({ type: 'room', room: 'wz' }, [], shows, rooms), false);
  assert.equal(B.cardShows({ type: 'room', room: 'hw' }, [], shows, rooms), true);
});

test('an own page of one building shows only with it or with all of them', () => {
  assert.equal(B.pageShows({ id: 'p_x', building: 'haus' }, 'anbau'), false);
  assert.equal(B.pageShows({ id: 'p_x', building: 'haus' }, 'haus'), true);
  assert.equal(B.pageShows({ id: 'p_x', building: 'haus' }, null), true);
  assert.equal(B.pageShows({ id: 'p_x' }, 'anbau'), true);
  assert.deepEqual(cleanCustomTabs([{ id: 'p_abc', name: 'Anbau', icon: '🏠', building: 'anbau' }, { id: 'p_def', name: 'X', building: 'bad id!' }]),
    [{ id: 'p_abc', name: 'Anbau', icon: '🏠', building: 'anbau' }, { id: 'p_def', name: 'X', icon: '⭐' }]);
  assert.equal(B.cleanPageBuilding('anbau'), 'anbau');
  assert.equal(B.cleanPageBuilding('x y'), '');
});
