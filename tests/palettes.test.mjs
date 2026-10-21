// Unit tests for palettes.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/palettes.js`);
const types = { light: {}, lamp: {}, sofa: {}, fridge: {}, secret: { hidden: true } };
const cats = { light: 'lighting', lamp: 'lighting', sofa: 'living', fridge: 'kitchen', secret: 'smart' };
const names = { light: 'Light', lamp: 'Floor lamp', sofa: 'Sofa', fridge: 'Fridge', secret: 'Secret' };
const f = (cat, query) => P.filterDevices(types, { cat, query, catOf: (k) => cats[k], name: (k) => names[k] });

test('all categories: everything except hidden types', () => {
  assert.deepEqual(f('all', ''), ['light', 'lamp', 'sofa', 'fridge']);
});
test('a category only shows its own types', () => {
  assert.deepEqual(f('lighting', ''), ['light', 'lamp']);
  assert.deepEqual(f('smart', ''), []);                      // the only one is hidden
});
test('search by the shown name, by the key and case-insensitively', () => {
  assert.deepEqual(f('all', 'FLOOR'), ['lamp']);
  assert.deepEqual(f('all', '  sofa '), ['sofa']);
  assert.deepEqual(f('all', 'fri'), ['fridge']);
});
test('search finds things under everyday names (aliases)', () => {
  assert.deepEqual(f('all', 'kühlschrank'), ['fridge']);
  assert.deepEqual(f('all', 'couch'), ['sofa']);
  assert.deepEqual(f('all', 'stehlampe'), ['lamp']);
});
test('search and category work together', () => {
  assert.deepEqual(f('living', 'lamp'), []);
  assert.deepEqual(f('lighting', 'lamp'), ['light', 'lamp']);      // the light is also called "lampe" in everyday words
  assert.deepEqual(f('lighting', 'floor'), ['lamp']);
});
test('models: yours are always shown, shipped ones only when they match; spaces and dashes do not matter', () => {
  const ms = [{ name: 'my-chair' }, { name: 'Oak-Table', builtin: true }, { name: 'Sofa-Big', builtin: true }];
  assert.equal(P.filterModels(ms, '').length, 3);
  assert.deepEqual(P.filterModels(ms, 'oak table').map((m) => m.name), ['my-chair', 'Oak-Table']);
  assert.deepEqual(P.filterModels(ms, 'xyz').map((m) => m.name), ['my-chair']);
});

test('"last used" (#471): newest first, each once, at most RECENT_MAX', () => {
  assert.deepEqual(P.recentList(['sofa', 'lamp'], 'light'), ['light', 'sofa', 'lamp']);
  assert.deepEqual(P.recentList(['sofa', 'lamp', 'light'], 'light'), ['light', 'sofa', 'lamp']);
  assert.deepEqual(P.recentList(['a', 'a', '', 3, 'b']), ['a', 'b']);
  assert.deepEqual(P.recentList('junk', 'sofa'), ['sofa']);
  assert.equal(P.recentList(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 'x').length, P.RECENT_MAX);
});
test('"last used" shows in "All" without a search, only what still exists', () => {
  const models = [{ name: 'my-chair.glb' }];
  const list = ['glb:my-chair.glb', 'glb:gone.glb', 'secret', 'sofa', 'dropped'];
  assert.deepEqual(P.recentShown(list, { cat: 'all', query: '', types, models }), ['glb:my-chair.glb', 'sofa']);
  assert.deepEqual(P.recentShown(list, { cat: 'living', query: '', types, models }), []);
  assert.deepEqual(P.recentShown(list, { cat: 'all', query: 'so', types, models }), []);
});
