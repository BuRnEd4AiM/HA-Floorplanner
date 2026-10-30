// Unit tests for freegrid.js ("Frei anordnen": the cards of a page on a grid where an admin put them; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/freegrid.js`);
const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/pagelayout.js`);

test('places made safe: inside the grid, whole cells, known keys', () => {
  assert.deepEqual(F.cleanPlace([0, 0, 3, 2]), [0, 0, 3, 2]); assert.deepEqual(F.cleanPlace([9, 40, 3, 60]), [9, 40, 3, 60]);
  for (const bad of [[10, 0, 3, 2], [-1, 0, 2, 2], [0, 0, 0, 2], [0, -1, 2, 2], [0, 0, 2, 0], [0, 0, 2, 61], [0, 401, 2, 2], [0, 0, 2.5, 2], [0, 0, 2], 'x', [true, 0, 2, 2]]) {
    assert.equal(F.cleanPlace(bad), null, JSON.stringify(bad));
  }
  assert.deepEqual(F.cleanPlaces({ clock: [0, 0, 6, 4], 'Bad Key': [0, 0, 1, 1], c_x: [11, 0, 2, 1], room: 'x' }), { clock: [0, 0, 6, 4] });
  assert.equal(Object.keys(F.cleanPlaces(Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`k${i}`, [0, i, 1, 1]])))).length, F.MAX_PLACES);
});

test('the layout keeps "free" and the places only when there are (pagelayout.js), 🗑 and ↺ take them away', () => {
  assert.deepEqual(L.cleanLayout({}), { order: [], hidden: [], sizes: {}, sections: [], widths: {}, cards: [] });
  const l = L.cleanLayout({ free: true, places: { clock: [0, 0, 6, 4], c_text: [6, 0, 6, 2], bad: [11, 0, 5, 1] }, cards: [{ id: 'c_text', type: 'text', text: 'Hallo' }] });
  assert.equal(l.free, true); assert.deepEqual(l.places, { clock: [0, 0, 6, 4], c_text: [6, 0, 6, 2] });
  assert.equal(L.cleanLayout({ free: 'yes' }).free, undefined);
  assert.equal(L.emptyLayout(L.cleanLayout({ free: true })), false); assert.equal(L.emptyLayout(L.cleanLayout({ places: { a: [0, 0, 1, 1] } })), false);
  const d = L.dropCard(l, 'c_text');
  assert.deepEqual([d.free, d.places], [true, { clock: [0, 0, 6, 4] }]);
  const r = L.resetLayout(l);
  assert.deepEqual([r.free, r.places], [undefined, undefined]);
});

test('settle: the first keeps its place, a later one that hits it goes just below it, gaps stay', () => {
  assert.deepEqual(F.settle([{ key: 'a', at: [0, 0, 6, 3] }, { key: 'b', at: [3, 1, 6, 2] }, { key: 'c', at: [9, 1, 3, 2] }, { key: 'd', at: [0, 10, 3, 2] }]),
    { a: [0, 0, 6, 3], b: [3, 3, 6, 2], c: [9, 1, 3, 2], d: [0, 10, 3, 2] });
  // pushed down onto another: that one is passed too
  assert.deepEqual(F.settle([{ key: 'a', at: [0, 0, 12, 2] }, { key: 'b', at: [0, 1, 4, 2] }, { key: 'c', at: [0, 3, 4, 1] }]), { a: [0, 0, 12, 2], b: [0, 2, 4, 2], c: [0, 4, 4, 1] });
});

test('where every card goes: the stored places, new cards below them side by side', () => {
  const size = (k) => ({ n1: [6, 3], n2: [6, 2], n3: [4, 2] })[k];
  assert.deepEqual(F.arrangeFree(['a', 'n1', 'b', 'n2', 'n3'], { a: [0, 0, 3, 2], b: [9, 8, 3, 2], gone: [0, 20, 2, 2] }, size),
    { a: [0, 0, 3, 2], b: [9, 8, 3, 2], n1: [0, 10, 6, 3], n2: [6, 10, 6, 2], n3: [6, 12, 4, 2] });
  assert.deepEqual(F.arrangeFree(['a', 'b'], { a: [0, 0, 6, 4], b: [0, 2, 6, 2] }, size), { a: [0, 0, 6, 4], b: [0, 4, 6, 2] });   // stored ones that overlap
  assert.deepEqual(F.freeSpot({ a: [0, 0, 6, 2], b: [9, 0, 3, 2] }, 3, 2), [6, 0, 3, 2]);
});

test('a card dragged to the bottom right; dropped on another, that one moves down; sized, the ones below make room', () => {
  const p = { a: [0, 0, 6, 3], b: [6, 0, 6, 3], c: [0, 3, 12, 2] };
  assert.deepEqual(F.moveTo(p, 'a', 6, 12), { a: [6, 12, 6, 3], b: [6, 0, 6, 3], c: [0, 3, 12, 2] });                 // its old place stays empty
  assert.deepEqual(F.moveTo(p, 'a', 11, 12).a, [6, 12, 6, 3]);                                // kept inside the grid: as wide as before
  assert.deepEqual(F.moveTo(p, 'a', 20, 12), { a: [6, 12, 6, 3], b: [6, 0, 6, 3], c: [0, 3, 12, 2] });
  assert.deepEqual(F.moveTo(p, 'c', 0, 0), { c: [0, 0, 12, 2], a: [0, 2, 6, 3], b: [6, 2, 6, 3] });      // the two it lands on go below it
  assert.deepEqual(F.moveTo(p, 'x', 0, 0), p);
  assert.deepEqual(F.sizeTo(p, 'a', 6, 5), { a: [0, 0, 6, 5], b: [6, 0, 6, 3], c: [0, 5, 12, 2] });
  assert.deepEqual(F.sizeTo(p, 'b', 99, 0).b, [6, 0, 6, 1]);
  assert.deepEqual(F.readingOrder({ x: [9, 12, 3, 2], a: [0, 0, 3, 2], b: [6, 0, 3, 2], c: [0, 3, 3, 2] }), ['a', 'b', 'c', 'x']);
});

test('switched on: from where the cards stand on the screen (4 columns of the flowing grid → 12), on a phone packed', () => {
  // a grid 1392 px wide: a column of 12 is 103.17 px, a quarter of the page 337.5 px (3 columns)
  const rects = [{ key: 'w', left: 0, top: 0, width: 337.5, height: 150 }, { key: 'k', left: 351.5, top: 0, width: 337.5, height: 140 },
    { key: 'l', left: 703, top: 462, width: 689, height: 548 }, { key: 'd', left: 0, top: 176, width: 689, height: 88 }];
  assert.deepEqual(F.fromScreen(rects, 1392), { w: [0, 0, 3, 4], k: [3, 0, 3, 4], d: [0, 4, 6, 3], l: [6, 11, 6, 13] });
  assert.deepEqual(F.packed([{ key: 'a', w: 6, h: 3 }, { key: 'b', w: 3, h: 2 }, { key: 'c', w: 6, h: 2 }]), { a: [0, 0, 6, 3], b: [6, 0, 3, 2], c: [6, 2, 6, 2] });   // c fills the gap under b
  assert.equal(F.rowsFor(150), 4); assert.equal(F.rowsFor(1), 1); assert.equal(F.rowsFor(99999), F.MAX_H);
  assert.equal(F.colsFor(1), 3); assert.equal(F.colsFor(4), 12); assert.equal(F.colsFor(undefined), 3);
  assert.equal(F.spanOf(337.5, F.colWidth(1392)), 3); assert.equal(F.cellAt(240, 100), 2);
});
