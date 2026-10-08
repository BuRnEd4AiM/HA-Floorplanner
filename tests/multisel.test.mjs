// Unit tests for multisel.js (several things at once, #211; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const M = await import(`${dir}/multisel.js`);
const A = { kind: 'device', id: 'a' }, B = { kind: 'wall', id: 'b' }, C = { kind: 'opening', id: 'c' };

test('Shift + click adds to the selection that is already there; the last one is shown', () => {
  let r = M.toggleMulti([], A, B);
  assert.deepEqual(r, { list: [A, B], selection: B });
  r = M.toggleMulti(r.list, r.selection, C);
  assert.deepEqual(r.list, [A, B, C]); assert.deepEqual(r.selection, C);
});
test('Shift + click on a selected thing takes it out; one left is a normal selection', () => {
  let r = M.toggleMulti([A, B, C], C, B);
  assert.deepEqual(r.list, [A, C]);
  r = M.toggleMulti(r.list, r.selection, A);
  assert.deepEqual(r, { list: [], selection: C });
  assert.deepEqual(M.toggleMulti([], A, A), { list: [], selection: null });
});
test('with nothing selected the first Shift + click just selects; a click on nothing changes nothing', () => {
  assert.deepEqual(M.toggleMulti([], null, A), { list: [], selection: A });
  assert.deepEqual(M.toggleMulti([A, B], B, null), { list: [A, B], selection: B });
});
test('delete order: doors and windows first, cables left out, else the single selection', () => {
  assert.deepEqual(M.deleteOrder([B, C, A, { kind: 'cable', id: 'k' }], A), [C, B, A]);
  assert.deepEqual(M.deleteOrder([], A), [A]);
  assert.deepEqual(M.deleteOrder([], null), []);
});
test('frame in the plan (#247): what lies wholly inside is picked, by kind', () => {
  const sq = (x, z, s) => [[x, z], [x + s, z], [x + s, z + s], [x, z + s]];
  const f = {
    devices: [{ id: 'd1', x: 1, z: 1, type: 'sofa' }, { id: 'd2', x: 9, z: 9, type: 'lamp' }, { id: 'p1', x: 2, z: 2, type: 'inverter' }],
    walls: [{ id: 'w1', a: [0.5, 0.5], b: [3, 0.5] }, { id: 'w2', a: [0.5, 0.5], b: [8, 0.5] }],
    rooms: [{ id: 'r1', points: sq(0.5, 0.5, 2) }, { id: 'r2', points: sq(0.5, 0.5, 6) }],
    blocks: [], holes: [{ id: 'h1', points: sq(1, 1, 1) }], stairs: [{ id: 's1', x: 3, z: 3 }],
  };
  const ids = (items) => items.map((x) => `${x.kind}:${x.id}`).sort();
  assert.deepEqual(ids(M.boxItems(f, [4, 4], [0, 0])), ['device:d1', 'device:p1', 'hole:h1', 'room:r1', 'stair:s1', 'wall:w1']);   // corners in any order
  assert.deepEqual(ids(M.boxItems(f, [0, 0], [4, 4], (kind, v) => kind !== 'device' || v.type === 'inverter')).filter((x) => x.startsWith('device')), ['device:p1']);
  assert.deepEqual(M.boxItems({ devices: [], walls: [], rooms: [] }, [0, 0], [1, 1]), []);   // a floor without stairs, blocks or holes
});
test('frame adds to the selection, never takes out, no doubles; the last one is shown', () => {
  assert.deepEqual(M.addMulti([], A, [B, A, B]), { list: [A, B], selection: B });
  assert.deepEqual(M.addMulti([A, B], B, [C]), { list: [A, B, C], selection: C });
  assert.deepEqual(M.addMulti([], null, [A]), { list: [], selection: A });
  assert.deepEqual(M.addMulti([], null, []), { list: [], selection: null });
});
test('group move: devices, stairs, room corners and walls with the corners joined to them move by the same amount; locked ones stay', () => {
  const f = {
    devices: [{ id: 'd1', x: 1, z: 1 }, { id: 'd2', x: 5, z: 5, locked: true }, { id: 'd3', x: 9, z: 9 }],
    stairs: [{ id: 's1', x: 2, z: 0 }],
    walls: [{ id: 'w1', a: [0, 0], b: [4, 0] }, { id: 'w2', a: [4, 0], b: [4, 3] }],
    rooms: [{ id: 'r1', points: [[0, 0], [4, 0], [4, 3], [0, 3]] }], blocks: [], holes: [{ id: 'h1', points: [[1, 1], [2, 1], [2, 2]] }],
  };
  const items = [{ kind: 'device', id: 'd1' }, { kind: 'device', id: 'd2' }, { kind: 'stair', id: 's1' }, { kind: 'wall', id: 'w1' }, { kind: 'hole', id: 'h1' }, { kind: 'opening', id: 'o' }];
  const g = M.groupTargets(f, items);
  assert.equal(g.devices.length, 1);
  const moved = M.moveGroup(g, 0.5, -1);
  assert.deepEqual(moved.map((d) => d.id), ['d1']);
  assert.deepEqual([f.devices[0].x, f.devices[0].z], [1.5, 0]);
  assert.deepEqual([f.devices[1].x, f.devices[2].x], [5, 9]);
  assert.deepEqual([f.stairs[0].x, f.stairs[0].z], [2.5, -1]);
  assert.deepEqual(f.walls[0], { id: 'w1', a: [0.5, -1], b: [4.5, -1] });
  assert.deepEqual(f.walls[1].a, [4.5, -1]); assert.deepEqual(f.walls[1].b, [4, 3]);       // the joined wall stretches along
  assert.deepEqual(f.rooms[0].points[0], [0.5, -1]); assert.deepEqual(f.rooms[0].points[2], [4, 3]);
  assert.deepEqual(f.holes[0].points, [[1.5, 0], [2.5, 0], [2.5, 1]]);
  M.moveGroup(g, 0, 0);                                                              // always from the start values
  assert.deepEqual(f.walls[0].a, [0, 0]); assert.deepEqual([f.devices[0].x, f.devices[0].z], [1, 1]);
});
test('group move: locked(kind, id) leaves things out, every corner only once', () => {
  const f = { devices: [{ id: 'd1', x: 0, z: 0 }], walls: [{ id: 'w1', a: [0, 0], b: [1, 0] }, { id: 'w2', a: [1, 0], b: [2, 0] }], rooms: [], blocks: [], holes: [] };
  const g = M.groupTargets(f, [{ kind: 'device', id: 'd1' }, { kind: 'wall', id: 'w1' }, { kind: 'wall', id: 'w2' }], (k) => k === 'device');
  assert.equal(g.devices.length, 0); assert.equal(g.points.length, 4);
});
