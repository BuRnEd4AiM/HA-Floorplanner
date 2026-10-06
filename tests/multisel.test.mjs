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
