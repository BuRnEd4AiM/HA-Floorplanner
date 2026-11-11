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
  assert.equal(g(['climate.wz', 'weather.home']), false);         // a list is a group: one in the other building, the rest in none
  assert.equal(g(['climate.wz', 'sensor.waschmaschine']), true);
  assert.equal(g(['weather.home']), true);
  assert.equal(g([]), true);
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

test('the filter of a screen is worked out again when the building, the plan or the time changes', () => {
  let shown = 'anbau', n = 0, now = 0, layout = PLAN;
  const f = B.makeBuildingFilter({ layout: () => layout, shown: () => shown, areas: () => AREAS, ids: () => ['haus', 'anbau'], now: () => now,
    view: (b) => { n += 1; return viewOf(layout, b); }, members: () => [], ...H });
  assert.equal(f.shows('climate.wz'), false);
  assert.equal(f.shows('sensor.waschmaschine'), true);
  assert.equal(n, 2);                                             // once per building, not per question
  shown = 'haus';
  assert.equal(f.shows('climate.wz'), true);
  assert.equal(f.shows('sensor.waschmaschine'), false);
  assert.equal(n, 2);                                             // another building: what belongs where stays
  now = 5000;
  f.shows('x');
  assert.equal(n, 4);                                             // a few seconds later: anew (somebody may have edited)
  f.reset();
  f.shows('x');
  assert.equal(n, 6);                                             // the panel changed the plan: anew at once
  shown = null;
  assert.equal(f.shows('sensor.waschmaschine'), true);
});

/* ---- 5.5.0: the areas of Home Assistant, automations and scripts (the owner, 2026-11-11: "selbst wenn ich oben Gebäude 1 auswähle,
 *  werden mir Geräte und Automatisierungen von Gebäude 2 angezeigt") ---- */
const HA = [
  { id: 'a_wz', name: 'Wohnzimmer', entities: ['media_player.tv', 'climate.wz'], side: ['sensor.wz_signal'] },         // linked to a room of the house
  { id: 'a_hw', name: 'Waschküche', entities: ['sensor.waschmaschine', 'switch.trockner'], side: ['update.trockner'] },   // a device of it stands in the annex
  { id: 'a_keller', name: 'Keller Anbau', entities: ['light.keller'] },                                                  // nothing of it in the plan
  { id: 'a_hwr', name: 'hauswirtschaft ', entities: ['light.hwr'] },                                                     // called like a room of the annex
  { id: 'a_mix', name: 'Flur', entities: ['climate.wz', 'sensor.waschmaschine', 'light.flur'] },                         // devices in both
  { id: 'a_garten', name: 'Garten', entities: ['light.garten', 'switch.pumpe'] },                                         // only the plot
];
const ROOMS = [{ name: 'Wohnzimmer', b: 'haus' }, { name: 'Hauswirtschaft', b: 'anbau' }];
const H2 = { ...H, area: (r) => B.areaEntities(HA.find((a) => a.id === r.area)) };
const base = B.buildingSets(['haus', 'anbau'], (b) => viewOf(PLAN, b), H2);

test('an area of Home Assistant belongs to the building its devices stand in, else to the one with a room of its name', () => {
  const o = B.areaOwners(base, HA, {}, ROOMS);
  assert.deepEqual(o.get('a_wz'), { b: 'haus', how: 'devices' });
  assert.deepEqual(o.get('a_hw'), { b: 'anbau', how: 'devices' });       // the washing machine stands in the annex
  assert.deepEqual(o.get('a_keller'), { b: null, how: 'none' });
  assert.deepEqual(o.get('a_hwr'), { b: 'anbau', how: 'name' });
  assert.deepEqual(o.get('a_mix'), { b: null, how: 'mixed' });
  assert.deepEqual(o.get('a_garten'), { b: null, how: 'none' });         // the lamp on the plot is in every building's view: no vote
  assert.deepEqual(B.areaOwners(base, HA, {}, [...ROOMS, { name: 'hauswirtschaft', b: 'haus' }]).get('a_hwr'), { b: null, how: 'none' });   // a room of that name in both
  assert.equal(B.areaOwners(base, { a: 1 }, {}, ROOMS).size, 0);         // junk: no areas
});

test('an area chosen in the panel wins: a building, every building; a building that is gone does not count', () => {
  const o = B.areaOwners(base, HA, { a_keller: 'anbau', a_wz: 'anbau', a_garten: B.ALL, a_hw: 'weg' }, ROOMS);
  assert.deepEqual(o.get('a_keller'), { b: 'anbau', how: 'fixed' });
  assert.deepEqual(o.get('a_wz'), { b: 'anbau', how: 'fixed' });
  assert.deepEqual(o.get('a_garten'), { b: B.ALL, how: 'fixed' });
  assert.deepEqual(o.get('a_hw'), { b: 'anbau', how: 'devices' });
  assert.deepEqual(B.cleanAreaBuildings({ a_keller: 'anbau', a_wz: 'weg', a_garten: B.ALL, x: 5 }, ['haus', 'anbau']), { a_keller: 'anbau', a_garten: B.ALL });
  assert.deepEqual(B.cleanAreaBuildings({ a_keller: 'anbau', a_alt: 'haus' }, ['haus', 'anbau'], ['a_keller']), { a_keller: 'anbau' });
  assert.deepEqual(B.cleanAreaBuildings(['x'], ['haus']), {});
});

test('everything of an area follows its building: what is not in the plan, the hidden entities, the area itself', () => {
  const sets = B.withAreas(base, HA, B.areaOwners(base, HA, { a_keller: 'anbau', a_garten: B.ALL }, ROOMS));
  const haus = B.buildingFilter(sets, 'haus'), anbau = B.buildingFilter(sets, 'anbau');
  assert.equal(haus('switch.trockner'), false);                   // not in the plan, in the area of the washing machine
  assert.equal(haus('update.trockner'), false);                   // a hidden entity of that area
  assert.equal(anbau('switch.trockner'), true);
  assert.equal(haus('light.keller'), false);                      // chosen for the annex
  assert.equal(haus('light.hwr'), false);                         // by the room's name
  assert.equal(haus('sensor.wz_signal'), true);
  assert.equal(anbau('sensor.wz_signal'), false);
  assert.equal(haus('light.flur'), true);                         // an area with devices in both buildings: only what stands somewhere counts
  assert.equal(anbau('light.flur'), true);
  assert.equal(haus('switch.pumpe'), true);                       // chosen for every building
  assert.equal(anbau('switch.pumpe'), true);
  assert.equal(haus(B.areaKey('a_keller')), false);               // an automation naming the area
  assert.equal(anbau(B.areaKey('a_keller')), true);
  assert.equal(base.get('anbau').has('light.keller'), false);     // the sets of the plan are not changed
});

test('an automation, a script, a scene: with the building of what they use, through a script and a scene too', () => {
  const sets = B.withAreas(base, HA, B.areaOwners(base, HA, { a_keller: 'anbau' }, ROOMS));
  const uses = { 'automation.wasch': ['sensor.waschmaschine', 'sun.sun'], 'automation.tv': ['media_player.tv'], 'automation.sonne': ['sun.sun', 'weather.home'],
    'automation.keller': [B.areaKey('a_keller')], 'automation.beide': ['climate.wz', 'switch.trockner'], 'automation.kette': ['script.abend'],
    'script.abend': ['scene.abend'], 'scene.abend': ['media_player.tv'], 'script.kreis': ['script.kreis2'], 'script.kreis2': ['script.kreis'],
    'script.tief': ['script.t1'], 'script.t1': ['script.t2'], 'script.t2': ['script.t3'], 'script.t3': ['media_player.tv'] };
  const m = (e) => uses[e] || [];
  const haus = B.buildingFilter(sets, 'haus', m), anbau = B.buildingFilter(sets, 'anbau', m);
  assert.equal(haus('automation.wasch'), false);                  // the sun is in no building: the washing machine decides
  assert.equal(anbau('automation.wasch'), true);
  assert.equal(anbau('automation.tv'), false);
  assert.equal(haus('automation.sonne'), true);                   // nothing of it in a building: always
  assert.equal(anbau('automation.sonne'), true);
  assert.equal(haus('automation.keller'), false);
  assert.equal(anbau('automation.keller'), true);
  assert.equal(haus('automation.beide'), true);                   // devices in both: with both
  assert.equal(anbau('automation.beide'), true);
  assert.equal(anbau('automation.kette'), false);                 // automation → script → scene → the TV of the house
  assert.equal(haus('automation.kette'), true);
  assert.equal(anbau('script.kreis'), true);                      // a circle ends, nothing in a building
  assert.equal(anbau('script.tief'), true);                       // too deep to follow: as if in no building
  assert.deepEqual([...B.entityBuildings(sets, 'automation.beide', m)].sort(), ['anbau', 'haus']);
  assert.deepEqual([...B.entityBuildings(sets, 'automation.sonne', m)], []);
  assert.deepEqual([...B.entityBuildings(sets, ['light.keller', 'sun.sun'], m)], ['anbau']);
});

test('an own card with a device of the other building and one of no building does not show; a mixed one does', () => {
  const sets = B.withAreas(base, HA, B.areaOwners(base, HA, {}, ROOMS)), shows = B.buildingFilter(sets, 'anbau');
  assert.equal(B.cardShows({ type: 'graph' }, ['climate.wz', 'sensor.aussen'], shows), false);
  assert.equal(B.cardShows({ type: 'entities' }, ['climate.wz', 'switch.trockner'], shows), true);
  assert.equal(B.cardShows({ type: 'value' }, ['sensor.aussen'], shows), true);
});

test('the filter of a screen knows the areas: who owns which, also what each would take by itself', () => {
  let shown = 'haus';
  const plan = { ...PLAN, areaBuildings: { a_keller: 'anbau', a_hw: 'haus' } };
  const f = B.makeBuildingFilter({ layout: () => plan, shown: () => shown, areas: () => HA, ids: () => ['haus', 'anbau'], now: () => 0, view: (b) => viewOf(plan, b),
    members: (e) => (e === 'automation.keller' ? [B.areaKey('a_keller')] : []), rooms: () => ROOMS, ...H2 });
  assert.equal(f.shows('light.keller'), false);
  assert.equal(f.shows('automation.keller'), false);
  assert.equal(f.shows(['light.keller', 'climate.wz']), true);
  assert.equal(f.shows('switch.trockner'), true);                 // the area chosen for the house, though the washing machine stands in the annex
  shown = 'anbau';
  assert.equal(f.shows('light.keller'), true);
  assert.equal(f.shows('sensor.waschmaschine'), true);            // it stands there: with both
  assert.deepEqual(f.owners().get('a_hw'), { b: 'haus', how: 'fixed' });
  assert.deepEqual(f.autoOwners().get('a_hw'), { b: 'anbau', how: 'devices' });
  assert.deepEqual(f.autoOwners().get('a_keller'), { b: null, how: 'none' });
  assert.equal(f.sets().get('anbau').has('light.keller'), true);
});
