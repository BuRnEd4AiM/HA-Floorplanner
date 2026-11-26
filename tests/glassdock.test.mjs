/* 🍏 Glas-Kapsel (5.37.2, glassdock.js): one capsule around the scenes and the tab bar, the picture running on under them */
import test from 'node:test';
import assert from 'node:assert/strict';

const D = await import(`${process.env.STATIC_DIR || '/tmp/static'}/glassdock.js`);
const r = (left, top, right, bottom) => ({ left, top, right, bottom });

test('the capsule takes in both rows, as wide as the wider one, with a small edge', () => {
  assert.deepEqual(D.dockBox([r(200, 700, 1200, 760), r(150, 770, 1250, 830)]), { left: 144, top: 694, width: 1112, height: 142 });
  assert.deepEqual(D.dockBox([r(10, 10, 20, 20)], 0), { left: 10, top: 10, width: 10, height: 10 });
});
test('a hidden row (no size) is left out; none at all: no capsule', () => {
  assert.deepEqual(D.dockBox([r(0, 0, 0, 0), r(150, 770, 1250, 830)]), { left: 144, top: 764, width: 1112, height: 72 });
  assert.equal(D.dockBox([r(0, 0, 0, 0), null, undefined]), null);
  assert.equal(D.dockBox([]), null);
  assert.equal(D.dockBox(null), null);
});
test('how far the picture runs on: the screen below the stage, never less than 0', () => {
  assert.equal(D.dockHeight(900, 763), 137);
  assert.equal(D.dockHeight(900, 900), 0);
  assert.equal(D.dockHeight(900, 950), 0);
  assert.equal(D.dockHeight(undefined, 10), 0);
});
test('only in a glass design, on a wider screen, not while editing the tabs', () => {
  assert.equal(D.dockWanted({ glass: true, wide: true, tabEditing: false }), true);
  assert.equal(D.dockWanted({ glass: false, wide: true, tabEditing: false }), false);
  assert.equal(D.dockWanted({ glass: true, wide: false, tabEditing: false }), false);
  assert.equal(D.dockWanted({ glass: true, wide: true, tabEditing: true }), false);
});
