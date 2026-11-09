// Unit tests for openingstack.js (#694): two doors / windows one above the other at the same place on a wall (run like offline.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/openingstack.js`);

// ChrisSN86's terrace: a door 1.60 m wide and 2.20 m high, a window of the same width above it from 2.95 m, 0.65 m high
const door = { id: 'd', type: 'door', pos: 2, width: 1.6, height: 2.2, sill: 0 };
const high = { id: 'h', type: 'window', pos: 2, width: 1.6, height: 0.65, sill: 2.95 };
const wall = (...openings) => ({ id: 'w', a: [0, 0], b: [6, 0], thickness: 0.2, height: 3.8, openings });

test('heights: [sill, sill + height]; a door without a sill starts at the floor', () => {
  assert.deepEqual(S.spanOf(door), [0, 2.2]);
  assert.deepEqual(S.spanOf(high), [2.95, 3.6]);
  assert.deepEqual(S.spanOf({ height: 2 }), [0, 2]);
  assert.deepEqual(S.spanOf({ sill: '1.5', height: '0.5' }), [1.5, 2]);
  assert.deepEqual(S.spanOf(null), [0, 0]);
});

test('heights meet only when they overlap: touching frames are fine', () => {
  assert.equal(S.heightsMeet([0, 2.2], [2.95, 3.6]), false);
  assert.equal(S.heightsMeet([0, 2.2], [2.2, 3]), false, 'one sits on the other');
  assert.equal(S.heightsMeet([0, 2.2], [2.1, 3]), true);
  assert.equal(S.heightsMeet([0.9, 2.1], [0, 2.05]), true);
});

test('blocked: side by side as before (2 cm of wall between), one above the other only when the heights overlap', () => {
  const w = wall(door);
  assert.equal(S.blocked(w, 2, 1.6, null), true, 'without heights any opening there takes the place (as before #694)');
  assert.equal(S.blocked(w, 2, 1.6, null, high), false, 'the high window fits above the door');
  assert.equal(S.blocked(w, 2, 1.6, null, { sill: 0.9, height: 1.2 }), true, 'a normal window does not');
  assert.equal(S.blocked(w, 3.63, 1.6, null), false, '3 cm of wall between them');
  assert.equal(S.blocked(w, 3.61, 1.6, null), true, 'only 1 cm');
  assert.equal(S.blocked(w, 2, 1.6, 'd'), false, 'itself does not count');
  assert.equal(S.blocked(wall(door, high), 2.3, 1.6, 'h', high), false, 'the high window moves along above the door');
  assert.equal(S.blocked(wall(door, high), 2.3, 1.6, 'h', { sill: 2, height: 1 }), true, 'but not lower into it');
  assert.equal(S.blocked({}, 1, 1, null), false, 'a wall without openings');
});

test('the stack of an opening: who shares its stretch of the wall, lowest first; the upper one and its neighbours', () => {
  const side = { id: 's', type: 'window', pos: 4.5, width: 1, height: 1.2, sill: 0.9 };
  const w = wall(high, door, side);
  assert.deepEqual(S.stackOf(w, high).map((o) => o.id), ['d', 'h']);
  assert.deepEqual(S.stackOf(w, side).map((o) => o.id), ['s']);
  assert.equal(S.isAbove(w, high), true);
  assert.equal(S.isAbove(w, door), false);
  assert.equal(S.isAbove(w, side), false);
  assert.deepEqual(S.neighbours(w, door), { above: high, below: null });
  assert.deepEqual(S.neighbours(w, high), { above: null, below: door });
  assert.deepEqual(S.neighbours(w, side), { above: null, below: null });
  const narrow = { id: 'n', type: 'window', pos: 2.5, width: 0.6, height: 0.5, sill: 3 };
  assert.deepEqual(S.stackOf(wall(door, narrow), narrow).map((o) => o.id), ['d', 'n'], 'a narrower window over part of the door');
});

test('a second click picks the next one of the stack, round again; alone: null', () => {
  const w = wall(high, door);
  assert.equal(S.nextInStack(w, 'd'), 'h');
  assert.equal(S.nextInStack(w, 'h'), 'd');
  assert.equal(S.nextInStack(wall(door), 'd'), null);
  assert.equal(S.nextInStack(wall(door), 'x'), null);
});

test('a window above: 25 cm of wall over the opening, 15 cm under the top of the wall, 0.80 m or what fits (at least 0.30 m)', () => {
  assert.deepEqual(S.roomAbove(wall(door), door, 3.8), { sill: 2.45, height: 0.8 });
  assert.deepEqual(S.roomAbove(wall(door), door, 3.6), { sill: 2.45, height: 0.8 });
  assert.deepEqual(S.roomAbove(wall(door), door, 3.2), { sill: 2.45, height: 0.6 });
  assert.equal(S.roomAbove(wall(door), door, 2.6), null, 'a normal wall has no room over a door');
  assert.equal(S.roomAbove(wall(door, high), door, 3.8), null, 'there is one already');
  assert.equal(S.roomAbove(wall(door), null, 3.8), null);
  const wide = { id: 'x', type: 'window', pos: 3.4, width: 1.6, height: 1, sill: 2.6 };   // overlaps the place above the door at one side
  assert.equal(S.roomAbove(wall(door, wide), door, 3.8), null);
});

test('the solid parts round openings side by side are the same as before #694: before, below and above each opening', () => {
  const win = { id: 'w1', type: 'window', pos: 1.5, width: 1, height: 1.2, sill: 0.9 };
  const d = { id: 'd1', type: 'door', pos: 4, width: 0.9, height: 2.05, sill: 0 };
  const got = S.solidParts(6, 0.2, 2.6, [d, win]);
  const r = (p) => [p.x0, p.x1, p.y0, p.y1].map((v) => Math.round(v * 1000) / 1000);
  assert.deepEqual(got.map(r), [
    [-3.1, -2], [-2, -1], [-2, -1], [-1, 0.55], [0.55, 1.45], [1.45, 3.1],
  ].map(([x0, x1], i) => [x0, x1, ...[[0, 2.6], [0, 0.9], [2.1, 2.6], [0, 2.6], [2.05, 2.6], [0, 2.6]][i]]));
  assert.deepEqual(S.solidParts(6, 0.2, 2.6, []).map(r), [[-3.1, 3.1, 0, 2.6]], 'a wall without openings: one piece');
});

test('the wall stays between a door and the window above it, and above the window', () => {
  const got = S.solidParts(6, 0.2, 3.8, [door, high]);
  const mid = got.filter((p) => Math.abs(p.x0 + 1.8) < 1e-9);   // over the door: x from -1.8 to -0.2
  assert.deepEqual(mid.map((p) => [p.y0, p.y1]), [[2.2, 2.95], [3.6, 3.8]]);
  const narrow = { id: 'n', type: 'window', pos: 2, width: 0.8, height: 0.65, sill: 2.95 };
  const parts = S.solidParts(6, 0.2, 3.8, [door, narrow]);
  const at = (x) => parts.filter((p) => p.x0 < x && x < p.x1).map((p) => [p.y0, p.y1]);
  assert.deepEqual(at(-1.7), [[2.2, 3.8]], 'beside the narrow window: wall up to the top');
  assert.deepEqual(at(-1), [[2.2, 2.95], [3.6, 3.8]], 'under and over the narrow window');
  assert.deepEqual(at(0), [[0, 3.8]], 'beside the door');
});

test('an opening above a cut wall (half section) leaves the wall whole; one reaching over its top cuts it to the top', () => {
  const r = (ps) => ps.map((p) => [p.y0, p.y1]);
  assert.deepEqual(r(S.solidParts(6, 0.2, 1.3, [high]).filter((p) => p.x0 > -1.81 && p.x1 < -0.19)), [[0, 1.3]]);
  assert.deepEqual(r(S.solidParts(6, 0.2, 3.2, [high]).filter((p) => p.x0 > -1.81 && p.x1 < -0.19)), [[0, 2.95]]);
});

test('the gaps of the plan: one for two openings one above the other, apart side by side', () => {
  assert.deepEqual(S.alongGaps([door, high]), [[1.2, 2.8]]);
  assert.deepEqual(S.alongGaps([{ pos: 4, width: 1 }, { pos: 1, width: 1 }]), [[0.5, 1.5], [3.5, 4.5]]);
  assert.deepEqual(S.alongGaps([door, { pos: 2.8, width: 0.6 }]).map((g) => g.map((v) => Math.round(v * 1000) / 1000)), [[1.2, 3.1]], 'a window over part of the door and beyond it');
  assert.deepEqual(S.alongGaps([]), []);
});

test('a new height or sill must not run into the opening above or below; one that did already (an old layout) may still change', () => {
  const d = { ...door }, h = { ...high }, w = wall(d, h);
  assert.equal(S.trySpan(w, d, 'height', 2.4), true);
  assert.equal(d.height, 2.4);
  assert.equal(S.trySpan(w, d, 'height', 3), false, 'into the window above');
  assert.equal(d.height, 2.4, 'kept');
  assert.equal(S.trySpan(w, h, 'sill', 2.3), false);
  assert.equal(S.trySpan(w, h, 'sill', 2.5), true);
  const side = { id: 's', type: 'window', pos: 4.5, width: 1, height: 1.2, sill: 0.9 };
  assert.equal(S.trySpan(wall(d, side), side, 'height', 2.5), true, 'side by side heights do not matter');
  const old = { id: 'o', type: 'window', pos: 2.2, width: 1, height: 1.2, sill: 0.9 };   // saved overlapping the door before #694
  assert.equal(S.trySpan(wall(d, old), old, 'height', 1), true);
});
