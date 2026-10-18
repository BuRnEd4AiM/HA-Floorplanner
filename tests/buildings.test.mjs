// Unit tests for buildings.js (several buildings in one plan, #409; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const B = await import(`${process.env.STATIC_DIR || '/tmp/static'}/buildings.js`);

const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const walls = (id, x0, z0, x1, z1) => [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]]
  .map(([a, b], i) => ({ id: `${id}w${i}`, a, b, thickness: 0.2, height: 2.6, openings: [] }));
/** the main house (0..8 x 0..6) over two floors and a garden house (14..18 x 0..4) on the ground floor only, a bench in the garden */
function plan() {
  return {
    version: 1,
    buildings: [{ id: 'main', name: 'Haupthaus' }, { id: 'gh', name: 'Gartenhaus' }],
    floors: [
      { id: 'eg', name: 'EG', walls: [...walls('m', 0, 0, 8, 6), ...walls('g', 14, 0, 18, 4)],
        rooms: [{ id: 'wz', name: 'Wohnen', points: sq(0, 0, 8, 6), building: 'main' }, { id: 'gr', name: 'Gartenraum', points: sq(14, 0, 18, 4), building: 'gh' }],
        devices: [{ id: 'l1', type: 'spot', x: 4, z: 3 }, { id: 'l2', type: 'spot', x: 16, z: 2 }, { id: 'wl', type: 'walllamp', x: 8.1, z: 3 }, { id: 'bank', type: 'bench', x: 11, z: 9 }],
        stairs: [{ id: 's1', type: 'straight', x: 1, z: 1, floors: 1 }] },
      { id: 'og', name: 'OG', walls: walls('o', 0, 0, 8, 6), rooms: [{ id: 'sz', name: 'Schlafen', points: sq(0, 0, 8, 6) }], devices: [{ id: 'l3', type: 'spot', x: 4, z: 3 }] },
      { id: 'dach', name: 'Dach', kind: 'roof', walls: [], rooms: [], devices: [], roof: { type: 'gable', pitch: 35, parts: [{ id: 'rp1', box: { x0: 14, x1: 18, z0: 0, z1: 4 }, level: 'eg' }] } },
    ],
  };
}

test('the buildings of a plan; the switch from two on; an unknown building shows all', () => {
  const l = plan();
  assert.deepEqual(B.buildingsOf(l).map((b) => b.id), ['main', 'gh']);
  assert.equal(B.showSwitch(l), true);
  assert.equal(B.showSwitch({ buildings: [{ id: 'a' }] }), false);
  assert.deepEqual(B.buildingsOf({ buildings: [null, { name: 'x' }, { id: 'a', name: 'A' }] }), [{ id: 'a', name: 'A' }]);
  assert.equal(B.pickBuilding(l, 'gh'), 'gh');
  assert.equal(B.pickBuilding(l, 'gone'), null);
  assert.equal(B.viewOf(l, null), l);
  assert.equal(B.viewOf(l, 'gone'), l);
});
test('a room without a building takes it from a room on another floor that holds its middle (the floors above follow)', () => {
  const o = B.roomOwners(plan());
  assert.deepEqual(o[0].map((x) => [x.room.id, x.b, x.auto]), [['wz', 'main', false], ['gr', 'gh', false]]);
  assert.deepEqual(o[1].map((x) => [x.room.id, x.b, x.auto]), [['sz', 'main', true]]);
  const l = plan(); l.floors[1].rooms[0].building = 'gone';           // a building that was deleted: automatic again
  assert.equal(B.roomOwners(l)[1][0].b, 'main');
  delete l.buildings;
  assert.equal(B.roomOwners(l)[0][0].b, null);                         // no buildings: everything is the plot
});
test('the middle of an L-shaped room lies inside it', () => {
  const L = [[0, 0], [6, 0], [6, 1], [1, 1], [1, 6], [0, 6]];
  const [x, z] = B.insidePoint(L);
  assert.ok(x >= 0 && x <= 6 && z >= 0 && z <= 6 && (x <= 1 || z <= 1), String([x, z]));
});
test('the garden house alone: its room, walls, lamp and roof; the main house with its upper floor; the garden bench in both', () => {
  const l = plan(), gh = B.viewOf(l, 'gh'), mh = B.viewOf(l, 'main');
  assert.deepEqual(gh.floors[0].rooms.map((r) => r.id), ['gr']);
  assert.deepEqual(gh.floors[0].walls.map((w) => w.id), ['gw0', 'gw1', 'gw2', 'gw3']);
  assert.deepEqual(gh.floors[0].devices.map((d) => d.id), ['l2', 'bank']);            // the bench lies in no room: the plot, always
  assert.deepEqual(gh.floors[0].stairs, []);
  assert.equal(B.floorHas(gh.floors[1]), false);                                       // nothing of the garden house upstairs
  assert.deepEqual(mh.floors[0].devices.map((d) => d.id), ['l1', 'wl', 'bank']);       // the wall lamp just outside its wall belongs to it
  assert.deepEqual(mh.floors[0].stairs.map((s) => s.id), ['s1']);
  assert.ok(B.floorHas(mh.floors[1]) && mh.floors[1].devices.length === 1);
  assert.equal(gh.floors[0].devices[0], l.floors[0].devices[1]);                       // the same objects, only new lists
  assert.equal(l.floors[0].devices.length, 4);                                         // the plan itself is not changed
});
test('a wall between two attached buildings shows with both; a wall in no room shows always', () => {
  const l = plan();
  l.floors[0].rooms.push({ id: 'an', name: 'Anbau', points: sq(8, 0, 11, 6), building: 'gh' });
  l.floors[0].walls.push({ id: 'free', a: [30, 30], b: [32, 30], thickness: 0.2, openings: [] });
  const shared = 'mw1';                                                                 // x = 8: between the main house and the annex
  assert.ok(B.viewOf(l, 'gh').floors[0].walls.some((w) => w.id === shared));
  assert.ok(B.viewOf(l, 'main').floors[0].walls.some((w) => w.id === shared));
  assert.ok(B.viewOf(l, 'gh').floors[0].walls.some((w) => w.id === 'free') && B.viewOf(l, 'main').floors[0].walls.some((w) => w.id === 'free'));
  assert.ok(!B.viewOf(l, 'gh').floors[0].walls.some((w) => w.id === 'mw3'));            // the far wall of the main house
});
test('roofs: a further roof belongs to the building under it, the main roof to its own building or to all', () => {
  const l = plan(), f = l.floors[2];
  assert.equal(B.roofOwner(l, 2, f.roof.parts[0], f.roof.parts[0].box), 'gh');
  assert.equal(B.roofOwner(l, 2, f.roof, { x0: 0, x1: 8, z0: 0, z1: 6 }), null);
  f.roof.building = 'main';
  assert.equal(B.roofOwner(l, 2, f.roof, null), 'main');
  assert.equal(B.roofOwner(l, 2, { box: { x0: 40, x1: 41, z0: 0, z1: 1 } }, { x0: 40, x1: 41, z0: 0, z1: 1 }), null);   // over no room
});
test('every building its own roof: the tallest keeps the main roof, the others get one on top of their highest floor', () => {
  const l = plan();
  const boxes = (floors) => { const pts = floors.slice(0, 2).flatMap((f) => f.walls.flatMap((w) => [w.a, w.b])); if (!pts.length) return null;
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; };
  const r = B.roofsPerBuilding(l, 2, boxes);
  assert.equal(r.main, 'main');
  assert.deepEqual(r.parts, [{ building: 'gh', name: 'Gartenhaus', box: { x0: 14, x1: 18, z0: 0, z1: 4 }, level: 'eg' }]);
  assert.deepEqual(B.roofsPerBuilding({ floors: l.floors }, 2, boxes), { main: null, parts: [] });   // no buildings: nothing to do
});
test('floors are matched by level: basement, ground floor, upper floors, roof floors in their order', () => {
  const dst = [{ kind: 'basement' }, {}, {}, { kind: 'roof' }], src = [{}, {}, {}, { kind: 'roof' }];
  assert.equal(B.matchFloor(dst, src, 0), 1);
  assert.equal(B.matchFloor(dst, src, 1), 2);
  assert.equal(B.matchFloor(dst, src, 2), -1);                         // a second upper floor this plan does not have
  assert.equal(B.matchFloor(dst, src, 3), 3);
  assert.equal(B.matchFloor([{}], [{ kind: 'basement' }, {}], 0), -1);
});
test('bringing another plan in: on the floors of the same level, moved and turned, new ids, its rooms in the new building, its roof a further roof', () => {
  const dst = plan();
  dst.buildings = [{ id: 'main', name: 'Haupthaus' }];
  dst.floors[0].rooms.pop(); dst.floors[0].walls = dst.floors[0].walls.slice(0, 4); dst.floors[2].roof.parts = [];
  const src = { floors: [
    { id: 'e', name: 'EG', walls: walls('x', 0, 0, 4, 3), rooms: [{ id: 'r', name: 'Atelier', points: sq(0, 0, 4, 3) }], stairs: [],
      devices: [{ id: 'ring', type: 'ledring', room: 'r', x: 2, z: 1.5, rot: 0 }, { id: 'inv', type: 'inverter', x: 1, z: 1, rot: 90, cables: [{ id: 'c', to: 'ring' }] }] },
    { id: 'o', name: 'OG', walls: [], rooms: [{ id: 'r2', name: 'Studio', points: sq(0, 0, 4, 3) }], devices: [] },
    { id: 'u', name: 'Spitzboden', walls: [], rooms: [{ id: 'r3', name: 'Boden', points: sq(0, 0, 4, 3) }], devices: [] },
    { id: 'd', name: 'Dach', kind: 'roof', walls: [], rooms: [], devices: [], roof: { type: 'shed', pitch: 20, box: { x0: 0, x1: 4, z0: 0, z1: 3 } } },
  ] };
  const before = JSON.stringify(src);
  let n = 0;
  const res = B.mergePlan(dst, src, { x: 20, z: 0, rot: 90 }, 'nb', 'Atelierhaus', () => `id${++n}`);
  assert.equal(JSON.stringify(src), before);                            // the other plan stays as it was
  assert.deepEqual(dst.buildings.map((b) => b.id), ['main', 'nb']);
  assert.deepEqual(dst.floors.map((f) => f.name), ['EG', 'OG', 'Spitzboden', 'Dach']);   // its third floor is new, put in under the roof
  assert.equal(res.floors, 1);
  const eg = dst.floors[0], room = eg.rooms.find((r) => r.name === 'Atelier');
  assert.equal(room.building, 'nb');
  assert.ok(room.id.startsWith('id'));
  assert.deepEqual(room.points[1], [20, -4]);                           // turned by 90° round its origin, then moved by 20 m
  const ring = eg.devices.find((d) => d.type === 'ledring'), inv = eg.devices.find((d) => d.type === 'inverter');
  assert.equal(ring.room, room.id);
  assert.equal(inv.cables[0].to, ring.id);
  assert.equal(inv.rot, 180);
  const part = dst.floors[3].roof.parts[0];
  assert.deepEqual([part.building, part.type, part.level], ['nb', 'shed', dst.floors[2].id]);
  assert.deepEqual(part.box, { x0: 20, x1: 23, z0: -4, z1: 0 });
  assert.equal(B.roomOwners(dst)[1].find((x) => x.room.name === 'Studio').b, 'nb');
  assert.equal(new Set(dst.floors.flatMap((f) => [...f.rooms, ...f.walls, ...f.devices]).map((x) => x.id)).size, dst.floors.flatMap((f) => [...f.rooms, ...f.walls, ...f.devices]).length);
});

/* ---- #451: the owner's house: a long wall along both buildings, a big room downstairs under a room upstairs, the device list ---- */
const DL = await import(`${process.env.STATIC_DIR || '/tmp/static'}/devicelist.js`);
const RC = await import(`${process.env.STATIC_DIR || '/tmp/static'}/roomclip.js`);

test('the floors a thing without a building takes it from: towards the ground floor, never from the floors above it (#451)', () => {
  const floors = [{ kind: 'basement' }, {}, {}, { kind: 'roof' }];
  assert.deepEqual(B.groundward(floors, 0), [1]);                      // the basement: the ground floor above it
  assert.deepEqual(B.groundward(floors, 1), []);                       // the ground floor: none
  assert.deepEqual(B.groundward(floors, 3), [2, 1]);                   // upstairs: the floors below, the nearest first
  assert.deepEqual(B.groundward([{}, {}], 0), []);
  const l = plan();
  delete l.floors[0].rooms[0].building;                                // the room downstairs without a building ...
  l.floors[1].rooms[0].building = 'gh';                                // ... under a room upstairs that has one: it stays with the plot
  assert.equal(B.roomOwners(l)[0][0].b, null);
  assert.equal(B.inheritedBuilding(l, 0, l.floors[0].rooms[0]), null);
  assert.ok(B.viewOf(l, 'main').floors[0].rooms.some((r) => r.id === 'wz'));   // and still shows with the other building
  l.floors.unshift({ id: 'kg', name: 'Keller', kind: 'basement', walls: [], rooms: [{ id: 'k', name: 'Keller', points: sq(0, 0, 8, 6) }], devices: [] });
  l.floors[1].rooms[0].building = 'main';
  assert.equal(B.roomOwners(l)[0][0].b, 'main');                       // the basement follows the ground floor above it
});
test('a big room downstairs does not follow a small room upstairs that lies over its middle (#451)', () => {
  const l = { buildings: [{ id: 'g1', name: 'Gebäude 1' }, { id: 'g2', name: 'Gebäude 2' }], floors: [
    { id: 'eg', name: 'EG', walls: walls('e', 0, 0, 20, 8), rooms: [{ id: 'r1', name: 'Raum 1', points: sq(0, 0, 20, 8) }], devices: [] },
    { id: 'os', name: '1. Stock', walls: walls('w', 8, 2, 12, 6), rooms: [{ id: 'wzfa', name: 'WZFA', points: sq(8, 2, 12, 6), building: 'g2' }], devices: [] },
  ] };
  assert.equal(B.roomOwners(l)[0][0].b, null);
  const g1 = B.viewOf(l, 'g1');
  assert.deepEqual(g1.floors[0].rooms.map((r) => r.id), ['r1']);        // Raum 1 and its walls stay
  assert.equal(g1.floors[0].walls.length, 4);
  assert.deepEqual(g1.floors[1].rooms, []);
});
test('a long wall along both buildings shows only along the rooms shown; a wall meeting it from the other building does not stick out (#451)', () => {
  const l = plan();
  l.floors[0].rooms.push({ id: 'an', name: 'Anbau', points: sq(8, 0, 14, 6), building: 'gh' });
  l.floors[0].walls = [
    { id: 'long', a: [0, 0], b: [14, 0], thickness: 0.2, height: 2.6, openings: [{ id: 'door', type: 'door', pos: 3, width: 0.9 }, { id: 'win', type: 'window', pos: 11, width: 1.2, entity: 'binary_sensor.win' }] },
    { id: 'mid', a: [8, 0], b: [8, 6], thickness: 0.2, height: 2.6, openings: [] },              // between the two: whole with both
    { id: 'in', a: [0, 3], b: [8, 3], thickness: 0.1, height: 2.6, openings: [] },               // inside the main house, up to the annex
  ];
  const gh = B.viewOf(l, 'gh').floors[0], mh = B.viewOf(l, 'main').floors[0];
  const [[t0, t1]] = gh.wallCuts.get('long');
  assert.ok(t0 * 14 > 7.5 && t0 * 14 < 8 && t1 === 1, String([t0, t1]));
  const [[u0, u1]] = mh.wallCuts.get('long');
  assert.ok(u0 === 0 && u1 * 14 > 8 && u1 * 14 < 8.5, String([u0, u1]));
  assert.ok(!gh.wallCuts.has('mid') && gh.walls.some((w) => w.id === 'mid') && mh.walls.some((w) => w.id === 'mid'));
  assert.ok(!gh.walls.some((w) => w.id === 'in') && mh.walls.some((w) => w.id === 'in') && !mh.wallCuts.has('in'));
  const piece = RC.cutWall(l.floors[0].walls[0], t0, t1);
  assert.equal(piece.id, 'long');                                      // still that wall when picked
  assert.deepEqual(piece.openings.map((o) => o.id), ['win']);
  assert.ok(Math.abs(piece.openings[0].pos - (11 - t0 * 14)) < 1e-9);
  assert.equal(RC.cutWall(l.floors[0].walls[0], 0, 1), l.floors[0].walls[0]);
  assert.equal(l.floors[0].walls[0].openings.length, 2);               // the plan itself is not changed
  // the device list of one building: its devices and the doors / windows on its part of the wall only
  const env = (layout) => ({ layout, states: { 'light.l1': { state: 'on' }, 'light.l2': { state: 'off' }, 'binary_sensor.win': { state: 'off' } }, t: (k) => k,
    pointInPoly: RC.pointInPoly, onStates: new Set(['on']) });
  l.floors[0].devices = [{ id: 'l1', type: 'spot', x: 4, z: 3, entity: 'light.l1' }, { id: 'l2', type: 'spot', x: 11, z: 3, entity: 'light.l2' }];
  const ids = (layout) => DL.deviceRows(env(layout)).flatMap((f) => f.rooms.flatMap((r) => r.items.map((i) => i.id))).sort();
  assert.deepEqual(ids(l), ['l1', 'l2', 'win']);                      // all buildings: everything
  assert.deepEqual(ids(B.viewOf(l, 'gh')), ['l2', 'win']);
  assert.deepEqual(ids(B.viewOf(l, 'main')), ['l1']);
});
test('what lies in no room upstairs belongs to the room under it; in no room on the ground floor to the plot (#451)', () => {
  const l = plan();
  l.floors[1].walls.push({ id: 'stub', a: [16, 1], b: [16, 3], thickness: 0.2, height: 2.6, openings: [] });   // over the garden room
  l.floors[1].devices.push({ id: 'up', type: 'spot', x: 16, z: 2 }, { id: 'air', type: 'spot', x: 30, z: 30 });
  const gh = B.viewOf(l, 'gh').floors[1], mh = B.viewOf(l, 'main').floors[1];
  assert.ok(gh.walls.some((w) => w.id === 'stub') && !mh.walls.some((w) => w.id === 'stub'));
  assert.deepEqual(gh.devices.map((d) => d.id), ['up', 'air']);        // over no room at all: the plot, always
  assert.deepEqual(mh.devices.map((d) => d.id), ['l3', 'air']);
  assert.deepEqual(B.viewOf(l, 'gh').floors[0].devices.map((d) => d.id), ['l2', 'bank']);   // the garden bench (ground floor, no room): always
});
