// Unit tests for edititems.js (delete, arrow keys, shortcut keys; split step 20 part 1 of #137; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const E = await import(`${process.env.STATIC_DIR || '/tmp/static'}/edititems.js`);
const floor = () => ({
  walls: [{ id: 'w1', a: [0, 0], b: [4, 0], openings: [{ id: 'o1', pos: 1, width: 0.9 }] }, { id: 'w2', a: [4, 0], b: [4, 3], openings: [] }, { id: 'w3', a: [9, 9], b: [9, 12] }],
  rooms: [{ id: 'r1', points: [[0, 0], [4, 0], [4, 3], [0, 3]] }], devices: [{ id: 'd1', x: 1, z: 1 }], stairs: [{ id: 's1' }],
});

test('the thing behind a selection, doors and windows inside their wall', () => {
  const f = floor();
  assert.equal(E.itemIn(f, 'device', 'd1'), f.devices[0]);
  assert.equal(E.itemIn(f, 'opening', 'o1'), f.walls[0].openings[0]);
  assert.equal(E.openingIn(f, 'o1').wall, f.walls[0]);
  assert.equal(E.itemIn(f, 'block', 'x'), null);                           // a floor without blocks
  assert.equal(E.itemIn(null, 'wall', 'w1'), null);
});
test('deleting takes the thing off its list, a door off its wall', () => {
  const f = floor();
  E.removeFrom(f, 'device', 'd1'); E.removeFrom(f, 'opening', 'o1'); E.removeFrom(f, 'stair', 's1'); E.removeFrom(f, 'hole', 'h');
  assert.deepEqual(f.devices, []); assert.deepEqual(f.walls[0].openings, []); assert.deepEqual(f.stairs, []); assert.deepEqual(f.holes, []);
  assert.equal(f.walls.length, 3);
});
test('a wall moved with the arrow keys takes the corners joined to it along, not the others', () => {
  const f = floor(), pts = E.jointPoints(f, f.walls[0]);
  assert.ok(pts.includes(f.walls[0].a) && pts.includes(f.walls[1].a) && pts.includes(f.rooms[0].points[0]) && pts.includes(f.rooms[0].points[1]));
  assert.ok(!pts.includes(f.walls[1].b) && !pts.includes(f.walls[2].a));
});
test('Q / E turn by 15°, kept within 0..359', () => {
  assert.equal(E.turned(0, 'q'), 345); assert.equal(E.turned(350, 'e'), 5); assert.equal(E.turned(undefined, 'e'), 15);
});
test('keys: undo, delete, turn, floor up / down, nudge steps, tools; nothing in the live mode', () => {
  const s = { live: false, selKind: null, grid: 0.25, floorIdx: 1, floors: 3 }, none = { ctrl: false, alt: false, shift: false };
  assert.deepEqual(E.keyCommand('z', { ...none, ctrl: true }, s), { do: 'undo' });
  assert.deepEqual(E.keyCommand('delete', none, s), { do: 'delete' });
  assert.equal(E.keyCommand('q', none, s), null);                                      // nothing selected to turn
  assert.deepEqual(E.keyCommand('e', none, { ...s, selKind: 'device' }), { do: 'turn', key: 'e' });
  assert.equal(E.keyCommand('q', none, { ...s, selKind: 'wall' }), null);              // walls do not turn
  assert.deepEqual(E.keyCommand('arrowup', none, s), { do: 'floor', to: 2 });
  assert.equal(E.keyCommand('arrowdown', none, { ...s, floorIdx: 0 }), null);          // no floor below the lowest
  assert.equal(E.keyCommand('arrowup', { ...none, shift: true }, s), null);
  assert.deepEqual(E.keyCommand('arrowleft', none, { ...s, selKind: 'wall' }), { do: 'nudge', dx: -0.25, dz: 0 });
  assert.deepEqual(E.keyCommand('arrowdown', { ...none, shift: true }, { ...s, selKind: 'room' }), { do: 'nudge', dx: 0, dz: 0.1 });
  assert.deepEqual(E.keyCommand('arrowup', { ...none, alt: true }, { ...s, selKind: 'room' }), { do: 'nudge', dx: 0, dz: -0.01 });
  assert.equal(E.keyCommand('arrowup', { ...none, ctrl: true }, { ...s, selKind: 'room' }), null);
  assert.deepEqual(E.keyCommand('w', none, s), { do: 'tool', tool: 'wall' });
  assert.deepEqual(E.keyCommand('t', none, s), { do: 'tool', tool: 'stairs' });
  assert.equal(E.keyCommand('x', none, s), null);
  assert.equal(E.keyCommand('delete', none, { ...s, live: true }), null);
});
