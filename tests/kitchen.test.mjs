// Unit tests for kitchen.js (run: cp floorplan3d/rootfs/app/static/kitchen.js /tmp/kitchen.mjs && KITCHEN_MJS=/tmp/kitchen.mjs node --test tests/kitchen.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const K = await import(process.env.KITCHEN_MJS || '/tmp/kitchen.mjs');
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const boxOf = (c) => {                                  // the cells are turned by multiples of 90 degrees: axis-aligned boxes
  const ex = Math.abs(Math.cos(c.ang)) * c.w / 2 + Math.abs(Math.sin(c.ang)) * c.d / 2, ez = Math.abs(Math.sin(c.ang)) * c.w / 2 + Math.abs(Math.cos(c.ang)) * c.d / 2;
  return [c.cx - ex, c.cx + ex, c.cz - ez, c.cz + ez];
};
const overlap = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[2], b[2]));

test('the default is a straight run of 4.6 m, centred', () => {
  const l = K.kitchenLayout({});
  assert.equal(l.cells.length, 7);
  near(l.w, 4.6); near(l.d, 0.6);
  const xs = l.cells.map((c) => c.cx);
  near((Math.min(...xs) + Math.max(...xs)) / 2, 0);                     // centred on the device position
  assert.deepEqual(l.cells.map((c) => c.type), K.DEFAULT_LEGS()[0]);
});

test('an L-shape: the second leg starts after the corner square of the first', () => {
  const l = K.kitchenLayout({ legs: [['base', 'base', 'base', 'base'], ['base', 'sink', 'base']] });
  near(l.w, 2.4); near(l.d, 0.6 + 2.2);
  assert.equal(l.cells.filter((c) => c.leg === 1).length, 3);
  const boxes = l.cells.map(boxOf);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) assert.ok(overlap(boxes[i], boxes[j]) < 1e-9, `cells ${i} and ${j} overlap`);
});

test('a U-shape: three legs, nothing overlaps, the legs face each other', () => {
  const l = K.kitchenLayout({ legs: [['base', 'base', 'base', 'base'], ['base', 'base'], ['base', 'base', 'base', 'base']] });
  near(l.w, 2.4); near(l.d, 2 * 0.6 + 1.2);
  const boxes = l.cells.map(boxOf);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) assert.ok(overlap(boxes[i], boxes[j]) < 1e-9, `cells ${i} and ${j} overlap`);
  const leg3 = l.cells.filter((c) => c.leg === 2), leg1 = l.cells.filter((c) => c.leg === 0);
  assert.ok(leg3[0].cz > leg1[0].cz + 1.5);                              // the third leg is on the other side of the room
});

test('depth is limited, unknown modules and too many legs / modules are dropped', () => {
  assert.equal(K.kitchenLayout({ depth: 5 }).depth, 1.2);
  assert.equal(K.kitchenLayout({ depth: 0.1 }).depth, 0.4);
  const legs = K.cleanLegs([['base', 'banana', 'sink'], 'junk', ['base'], ['base'], ['base']]);
  assert.equal(legs.length, 3);
  assert.deepEqual(legs[0], ['base', 'sink']);
  assert.deepEqual(legs[1], []);
  assert.equal(K.cleanLegs([new Array(40).fill('base')])[0].length, K.MAX_MODS);
});

test('an empty run still has a size, so it can be seen and picked', () => {
  const l = K.kitchenLayout({ legs: [[]] });
  assert.equal(l.cells.length, 0);
  assert.ok(l.w > 0 && l.d > 0);
});
