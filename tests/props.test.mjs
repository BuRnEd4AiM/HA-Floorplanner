// Unit tests for props.js, objlist.js, roomentities.js and entitypicker.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const P = await import(`${dir}/props.js`);
const O = await import(`${dir}/objlist.js`);
const RE = await import(`${dir}/roomentities.js`);
const E = await import(`${dir}/entitypicker.js`);
const G = await import(`${dir}/rooms.js`);
const t = (k, p) => (p ? `${k}:${JSON.stringify(p)}` : k);

test('panel title: the type of an opening or stair, otherwise the kind of object', () => {
  assert.equal(P.propsTitleKey('opening', { type: 'window' }), 'prop.window');
  assert.equal(P.propsTitleKey('stair', { type: 'wall' }), 'stair.wall');
  assert.equal(P.propsTitleKey('device', { type: 'sofa' }), 'prop.device');
});
test('hide model: lamps, LED-like things, light entities and presence sensors, not furniture', () => {
  const env = { ledLike: { strip: 1 }, catOf: (ty) => (ty === 'pendant' ? 'lighting' : 'living') };
  assert.ok(P.canHideModel({ type: 'strip' }, env));
  assert.ok(P.canHideModel({ type: 'pendant' }, env));
  assert.ok(P.canHideModel({ type: 'box', entity: 'light.x' }, env));
  assert.ok(P.canHideModel({ type: 'presence' }, env));
  assert.ok(!P.canHideModel({ type: 'sofa', entity: 'switch.x' }, env));
});
test('pane contacts: 2 for a double (or plain) window, 3 for a triple, none for doors and fixed windows', () => {
  assert.equal(P.paneCount({ type: 'window' }), 2);
  assert.equal(P.paneCount({ type: 'window', style: 'double' }), 2);
  assert.equal(P.paneCount({ type: 'window', style: 'triple' }), 3);
  assert.equal(P.paneCount({ type: 'window', style: 'fixed' }), 0);
  assert.equal(P.paneCount({ type: 'door', style: 'double' }), 0);
});
test('stretch: limited to 0.1 .. 10, no stretch (1) is dropped', () => {
  assert.equal(P.stretchValue(1), null);
  assert.equal(P.stretchValue(1.003), null);
  assert.equal(P.stretchValue(2), 2);
  assert.equal(P.stretchValue(50), 10);
  assert.equal(P.stretchValue(0), 0.1);
});

const f = {
  rooms: [{ id: 'r1', name: 'Küche', points: [[0, 0], [4, 0], [4, 3], [0, 3]] }, { id: 'r2', name: '', points: [[4, 0], [8, 0], [8, 3], [4, 3]] }],
  walls: [{ id: 'w1', a: [0, 0], b: [8, 0], openings: [{ id: 'o1', type: 'door', pos: 2, width: 0.9 }, { id: 'o2', type: 'window', pos: 6, width: 1, name: 'Fenster' }] },
    { id: 'w2', a: [20, 0], b: [22, 0], openings: [{ id: 'o3', type: 'window', pos: 1, width: 1 }] }],
  devices: [{ id: 'd1', type: 'sofa', x: 1, z: 1 }, { id: 'd2', type: 'light', x: 5, z: 1, name: 'Lampe' }, { id: 'd3', type: 'tree', x: 30, z: 30 }],
  stairs: [{ id: 's1', type: 'wall' }], blocks: [{ id: 'b1' }], holes: [{ id: 'h1' }],
};
test('object list: each room with its doors / windows and devices, then the rest, walls, stairs, blocks, openings', () => {
  const g = O.objectGroups(f, { t, pointInPoly: G.pointInPoly });
  assert.deepEqual(g.map((x) => x[0]), ['room:r1', 'room:r2', 'obj.noRoom', 'obj.walls', 'obj.stairs', 'obj.blocks', 'obj.holes']);
  assert.deepEqual(g[0][1].map((i) => i.id), ['r1', 'o1', 'd1']);
  assert.deepEqual(g[1][1].map((i) => i.id), ['r2', 'o2', 'd2']);
  assert.equal(g[1][2], 'prop.room');                       // a room without a name
  assert.deepEqual(g[2][1].map((i) => i.id), ['o3', 'd3']);
  assert.equal(g[3][1][0].label, 'prop.wall 1 · 8.0 m');
  assert.equal(g[4][1][0].label, 'stair.wall');
});
test('object list: an object on the border of two rooms is listed once, in the first room', () => {
  const g = O.objectGroups({ ...f, devices: [{ id: 'dx', type: 'lamp', x: 4, z: 1.5 }] }, { t, pointInPoly: () => true });
  const all = g.flatMap((x) => x[1]).filter((i) => i.id === 'dx');
  assert.equal(all.length, 1);
});
test('room entities: the fallback type of an entity and the spot in the room', () => {
  assert.equal(RE.fallbackType('climate.k'), 'thermostat');
  assert.equal(RE.fallbackType('person.anna'), 'presence');
  assert.equal(RE.fallbackType('sensor.energie'), 'sensor');
  assert.equal(RE.fallbackType('weather.home'), 'sensor');
  assert.deepEqual(RE.fallbackSpot([[0, 0], [4, 0], [4, 2], [0, 2]], G.pointInPoly), [2, 1]);
  const L = [[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]];          // L-shaped: the middle of its box is outside
  assert.deepEqual(RE.fallbackSpot(L, G.pointInPoly), [0.5, 0.5]);
});
const ents = [{ entity_id: 'light.kueche', name: 'Küche Decke' }, { entity_id: 'light.bad', name: 'Bad Spiegel' }, { entity_id: 'sensor.x', name: 'Temperatur' }];
const areaOf = { 'light.kueche': 'k', 'light.bad': 'b' }, areas = [{ id: 'b', name: 'Bad' }, { id: 'k', name: 'Küche' }];
test('entity groups: the room area first, then by area name, entities without an area last', () => {
  assert.deepEqual(E.groupByArea(ents, { area: 'k' }, areaOf, areas).map((g) => g.key), ['k', 'b', '']);
  assert.deepEqual(E.groupByArea(ents, null, areaOf, areas).map((g) => g.key), ['b', 'k', '']);
});
test('entity search: every word must match id, name or area, case does not matter, limited', () => {
  const areaName = (e) => (areas.find((a) => a.id === areaOf[e.entity_id])?.name || '').toLowerCase();
  assert.deepEqual(E.searchEntities(ents, 'küche', areaName).map((e) => e.entity_id), ['light.kueche']);
  assert.deepEqual(E.searchEntities(ents, 'LIGHT bad', areaName).map((e) => e.entity_id), ['light.bad']);
  assert.equal(E.searchEntities(ents, '', areaName).length, 3);
  assert.equal(E.searchEntities(ents, '', areaName, 2).length, 2);
});
