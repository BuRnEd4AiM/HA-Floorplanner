// Unit tests for welcome.js (run: cp floorplan3d/rootfs/app/static/welcome.js /tmp/welcome.mjs && WELCOME_MJS=/tmp/welcome.mjs node --test tests/welcome.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const W = await import(process.env.WELCOME_MJS || '/tmp/welcome.mjs');

test('a house with only empty floors is empty', () => {
  assert.equal(W.isEmptyLayout({ floors: [{ walls: [], rooms: [], devices: [] }] }), true);
  assert.equal(W.isEmptyLayout({ floors: [] }), true);
  assert.equal(W.isEmptyLayout(null), true);
});
test('anything on any floor makes the house not empty', () => {
  for (const key of ['walls', 'rooms', 'devices', 'blocks', 'stairs']) {
    assert.equal(W.isEmptyLayout({ floors: [{ walls: [] }, { [key]: [{}] }] }), false, key);
  }
});
