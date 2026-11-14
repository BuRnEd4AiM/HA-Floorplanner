// Unit tests for doorlook.js (the colours of doors and windows, #754; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const D = await import(`${dir}/doorlook.js`);

const HEX = /^#[0-9a-f]{6}$/;
test('nothing set: a wooden leaf and a white frame; window frames as the setting says', () => {
  assert.deepEqual(D.openingColors({ type: 'door' }), { leaf: '#8a6a48', frame: '#f4f4f4' });
  assert.deepEqual(D.openingColors({ type: 'door' }, { settings: {}, outer: true }), { leaf: '#8a6a48', frame: '#f4f4f4' });
  assert.equal(D.openingColors({ type: 'window' }).frame, '#f4f4f4');
  assert.equal(D.openingColors({ type: 'window' }, { windowFrame: '#2e3338' }).frame, '#2e3338');
  for (const list of [D.LEAF_COLORS, D.FRAME_COLORS]) list.forEach(([, c]) => assert.match(c, HEX));
});

test('the house: white inner doors, an anthracite front door; one door of its own wins', () => {
  const settings = { doorLeaf: '#F4F4F4', doorFrame: '', outerDoorLeaf: '#3a3e43', outerDoorFrame: 'pink' };
  assert.deepEqual(D.houseDoors(settings), { inner: { leaf: '#f4f4f4', frame: '#f4f4f4' }, outer: { leaf: '#3a3e43', frame: '#f4f4f4' } });
  assert.deepEqual(D.openingColors({ type: 'door' }, { settings }), { leaf: '#f4f4f4', frame: '#f4f4f4' });
  assert.deepEqual(D.openingColors({ type: 'door' }, { settings, outer: true }), { leaf: '#3a3e43', frame: '#f4f4f4' });
  const own = { type: 'door', look: { leaf: '#8C2F2A' } };
  assert.deepEqual(D.openingColors(own, { settings, outer: true }), { leaf: '#8c2f2a', frame: '#f4f4f4' });
  assert.deepEqual(D.houseDoors({ doorLeaf: '#5e4330' }).outer.leaf, '#5e4330', 'the doors to the outside as the inner ones when not set');
});

test('a window keeps only its frame; set and take away one colour', () => {
  const w = { type: 'window' };
  D.setOpeningLook(w, 'leaf', '#ffffff');
  assert.equal(w.look, undefined, 'a window has no leaf');
  D.setOpeningLook(w, 'frame', '#6B4A33');
  assert.deepEqual(w.look, { frame: '#6b4a33' });
  assert.equal(D.openingColors(w, { windowFrame: '#2e3338' }).frame, '#6b4a33');
  D.setOpeningLook(w, 'frame', null);
  assert.equal(w.look, undefined);
  const d = { type: 'door' };
  D.setOpeningLook(d, 'leaf', '#ffffff'); D.setOpeningLook(d, 'frame', '#1f2022');
  assert.deepEqual(d.look, { leaf: '#ffffff', frame: '#1f2022' });
  D.setOpeningLook(d, 'leaf', 'x');
  assert.deepEqual(d.look, { frame: '#1f2022' });
  assert.equal(D.cleanOpeningLook('x'), undefined);
});

test('which doors lead outside: a room on one side only', () => {
  const rooms = [{ points: [[0, 0], [4, 0], [4, 4], [0, 4]] }, { points: [[4, 0], [8, 0], [8, 4], [4, 4]] }];
  const outer = { a: [0, 0], b: [4, 0], thickness: 0.2 }, inner = { a: [4, 0], b: [4, 4], thickness: 0.2 };
  assert.equal(D.leadsOut(outer, { pos: 2 }, rooms), true, 'the front wall');
  assert.equal(D.leadsOut(inner, { pos: 2 }, rooms), false, 'between two rooms');
  assert.equal(D.leadsOut(inner, { pos: 2 }, []), false, 'no rooms drawn: no side is a room');
  // a corridor that is no room: inside the outline of the house, so the door from the room into it is no door to the outside
  const corridor = [rooms[0]], house = [[[0, 0], [8, 0], [8, 4], [0, 4]]];
  assert.equal(D.leadsOut(inner, { pos: 2 }, corridor), true, 'without the outline the corridor looks like outside');
  assert.equal(D.leadsOut(inner, { pos: 2 }, corridor, house), false, 'with it: inside');
  assert.equal(D.leadsOut(outer, { pos: 2 }, corridor, house), true, 'the front wall still leads out');
  // a terrace is outside, even as a room of its own
  const terrace = [rooms[0], { ...rooms[1], terrace: true }];
  assert.equal(D.leadsOut(inner, { pos: 2 }, terrace, house), true, 'the door onto the terrace leads out');
});
