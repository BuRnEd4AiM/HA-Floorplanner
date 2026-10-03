// Unit tests for toolbar.js (run: cp floorplan3d/rootfs/app/static/toolbar.js /tmp/toolbar.mjs && TOOLBAR_MJS=/tmp/toolbar.mjs node --test tests/toolbar.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const T = await import(process.env.TOOLBAR_MJS || '/tmp/toolbar.mjs');
const ids = T.TOOLS.map(([id]) => id);

test('nothing stored: every tool in default order, the import is folded', () => {
  const c = T.normalise(null);
  assert.deepEqual(c.order, ids);
  assert.deepEqual(c.hidden, []);
  assert.deepEqual(c.folded, ['import']);
});
test('unknown ids are dropped and tools missing from an old choice are added at the end', () => {
  const c = T.normalise({ order: ['wall', 'ufo', 'select'], hidden: ['ufo', 'room'], folded: ['block', 'ufo'] });
  assert.deepEqual(c.order.slice(0, 2), ['wall', 'select']);
  assert.equal(c.order.length, ids.length);
  assert.deepEqual(c.hidden, ['room']);
  assert.deepEqual(c.folded, ['block']);
});
test('the selection tool can not be hidden', () => {
  assert.deepEqual(T.normalise({ hidden: ['select', 'wall'] }).hidden, ['wall']);
});
test('duplicates in the order are removed', () => {
  const c = T.normalise({ order: ['wall', 'wall', 'room'] });
  assert.equal(new Set(c.order).size, c.order.length);
});
test('garbage input falls back to the defaults', () => {
  assert.deepEqual(T.normalise('x').order, ids);
  assert.deepEqual(T.normalise({ order: 5, hidden: 'a', folded: {} }).hidden, []);
});
