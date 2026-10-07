// Unit tests for dormerwin.js (real windows in roof dormers; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const W = await import(`${dir}/dormerwin.js`);
const { roofY0 } = await import(`${dir}/attic.js`);
const { openingIn, removeFrom } = await import(`${dir}/edititems.js`);
const { roomOpenings } = await import(`${dir}/roompanel.js`);
const { openItems } = await import(`${dir}/openings.js`);

const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const elev = (i) => i * 2.8;
const bb = { x0: 0, x1: 10, z0: 0, z1: 6 };
let n = 0;
const uid = () => `id${++n}`;
function house(knee) {
  const roof = { type: 'gable', pitch: 35, overhang: 0.4, dormers: [{ id: 'd1', side: 0, pos: 0.5, w: 1.6, hw: 1.2 }] };
  if (knee != null) roof.knee = knee;
  return [
    { kind: 'floor', walls: [], rooms: [{ id: 'r0', name: 'Unten', points: sq(0, 0, 10, 6) }] },
    { kind: 'floor', walls: [{ id: 'w1', a: [0, 0], b: [10, 0], thickness: 0.2, openings: [] }], rooms: [{ id: 'r1', name: 'Studio', points: sq(0, 0, 10, 6) }] },
    { kind: 'roof', walls: [], rooms: [], roof },
  ];
}
const roofs = (floors) => (ri) => [{ bb, spec: floors[ri].roof, y0: roofY0(floors, ri, elev) }];

test('a dormer window on a knee wall roof belongs to the storey under the slopes, with its height over that floor', () => {
  const floors = house(1.0);
  W.syncDormerWindows(floors, roofs(floors), elev, uid);
  assert.equal(floors[2].dormerWalls.length, 0);
  assert.equal(floors[1].dormerWalls.length, 1);
  const w = floors[1].dormerWalls[0], o = floors[2].roof.dormers[0].window;
  assert.equal(w.openings[0], o, 'the window is the one stored on the dormer');
  assert.equal(o.type, 'window');
  assert.ok(Math.abs(o.width - 1.6 * 0.64) < 1e-3);
  assert.ok(Math.abs(o.height - 0.8) < 1e-3);
  // knee 1.0 on floor 1 (2.8 m): the roof starts at 3.8 m, the dormer wall at 0.8 m from the eave, the sill 0.22 m above that
  const yF = 0.8 * Math.tan((35 * Math.PI) / 180);
  assert.ok(Math.abs(o.sill - (1.0 + yF + 0.22)) < 1e-3, `${o.sill}`);
  assert.ok(Math.abs(o.pos - 0.8) < 1e-3);
  assert.ok(w.a[1] === w.b[1] && Math.abs(w.a[1] - 0.4) < 1e-9, 'front wall at 0.8 m from the eave (0.4 m overhang)');
});

test('without a knee wall the dormer window belongs to the roof floor', () => {
  const floors = house();
  W.syncDormerWindows(floors, roofs(floors), elev, uid);
  assert.equal(floors[2].dormerWalls.length, 1);
  assert.equal(floors[1].dormerWalls.length, 0);
});

test('the window keeps its id, style and sensor; no window when the dormer has none; never saved', () => {
  const floors = house(1.0);
  W.syncDormerWindows(floors, roofs(floors), elev, uid);
  const d = floors[2].roof.dormers[0], id = d.window.id;
  d.window.entity = 'binary_sensor.gaube';
  W.syncDormerWindows(floors, roofs(floors), elev, uid);
  assert.equal(d.window.id, id);
  assert.equal(floors[1].dormerWalls[0].openings[0].entity, 'binary_sensor.gaube');
  assert.ok(!('dormerWalls' in JSON.parse(JSON.stringify(floors[1]))));
  d.win = false;
  W.syncDormerWindows(floors, roofs(floors), elev, uid);
  assert.equal(floors[1].dormerWalls.length, 0);
});

test('openingWalls: the walls of a floor and its dormer windows; finding, deleting, room and open list', () => {
  const floors = house(1.0);
  W.syncDormerWindows(floors, roofs(floors), elev, uid);
  const f = floors[1], d = floors[2].roof.dormers[0], o = d.window;
  assert.equal(W.openingWalls(f).length, 2);
  assert.equal(W.openingWalls({ walls: [] }).length, 0);
  assert.ok(W.isDormerWall(f.dormerWalls[0]) && !W.isDormerWall(f.walls[0]));
  assert.equal(openingIn(f, o.id).opening, o);
  assert.ok(roomOpenings(f.rooms[0], f).includes(o), 'the dormer window is a window of the room under it');
  o.entity = 'binary_sensor.gaube';
  const env = { isOpen: (e) => e === 'binary_sensor.gaube', t: (k) => k, pointInPoly: () => true, distToPoly: () => 0 };
  assert.deepEqual(openItems(floors, env).map((x) => [x.floor, x.id, x.kind]), [[1, o.id, 'windows']]);
  removeFrom(f, 'opening', o.id);
  assert.equal(d.win, false, 'deleting the window takes it out of the dormer');
  assert.ok(d.window, 'its sensor is kept for when the window is switched on again');
});

test('the floor of a window: the highest storey under that roof at or below its middle', () => {
  const floors = house(1.0);
  assert.equal(W.windowFloor(floors, 2, 4.9, elev), 1);
  assert.equal(W.windowFloor(floors, 2, 6.0, elev), 2);
  assert.equal(W.windowFloor(house(), 2, 4.9, elev), 2, 'no knee wall: the storeys below are not under the slopes');
});
