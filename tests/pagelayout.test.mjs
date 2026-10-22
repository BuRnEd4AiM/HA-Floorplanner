// Unit tests for pagelayout.js (the pages arranged like a dashboard, #484; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/pagelayout.js`);
const text = (id) => ({ id, type: 'text', text: 'x' });

test('a layout made safe: keys once, own cards valid and once', () => {
  const l = L.cleanLayout({ order: ['clock', 'clock', 'BAD KEY', 'c_abc'], hidden: ['waste', 5], cards: [text('c_abc'), text('c_abc'), { id: 'c_def', type: 'light', entity: 'switch.x' }, null] });
  assert.deepEqual(l.order, ['clock', 'c_abc']); assert.deepEqual(l.hidden, ['waste']); assert.deepEqual(l.cards.map((c) => c.id), ['c_abc']);
  assert.deepEqual(L.cleanLayout(null), { order: [], hidden: [], sizes: {}, sections: [], widths: {}, cards: [] });
  assert.deepEqual(L.cleanLayout({ sizes: { 'room:r1': 'small', 'room:r2': 'huge', 'BAD KEY': 'small' } }).sizes, { 'room:r1': 'small' });   // #495
  assert.deepEqual(Object.keys(L.cleanLayouts({ today: { hidden: ['x'] }, nope: { hidden: ['x'] }, climate: {} }, ['today', 'climate'])), ['today']);
  assert.deepEqual(L.cleanLayouts([1], ['today']), {});
});
test('arrange: the saved order first, a new built-in card after the one before it, own cards at the end, hidden marked', () => {
  const keys = (a) => a.map((x) => x.key);
  assert.deepEqual(keys(L.arrange(['a', 'b', 'c'], {})), ['a', 'b', 'c']);
  assert.deepEqual(keys(L.arrange(['a', 'b', 'c'], { order: ['c', 'a', 'b'] })), ['c', 'a', 'b']);
  assert.deepEqual(keys(L.arrange(['a', 'b', 'n', 'c'], { order: ['c', 'a', 'b'] })), ['c', 'a', 'b', 'n']);      // n new: after b
  assert.deepEqual(keys(L.arrange(['n', 'a'], { order: ['a'] })), ['n', 'a']);                                    // nothing before it: first
  assert.deepEqual(keys(L.arrange(['a'], { order: ['gone', 'a'] })), ['a']);                                      // a card that is no more
  const own = L.arrange(['a', 'b'], { order: ['c_xx1', 'b', 'a'], hidden: ['b'], cards: [text('c_xx1'), text('c_xx2')] });
  assert.deepEqual(keys(own), ['c_xx1', 'b', 'a', 'c_xx2']);
  assert.equal(own[0].own.type, 'text'); assert.equal(own[1].own, null); assert.equal(own[1].hidden, true); assert.equal(own[2].hidden, false);
});
test('moving, hiding, adding, changing, taking away, starting again', () => {
  assert.deepEqual(L.moveKey(['a', 'b', 'c'], 'c', 'a'), ['c', 'a', 'b']);
  assert.deepEqual(L.moveKey(['a', 'b', 'c'], 'a', null), ['b', 'c', 'a']);
  assert.deepEqual(L.moveKey(['a', 'b', 'c'], 'a', 'gone'), ['b', 'c', 'a']);
  assert.deepEqual(L.withOrder({}, ['b', 'a', 'b']).order, ['b', 'a']);
  const h = L.toggleHidden({}, 'waste');
  assert.deepEqual(h.hidden, ['waste']); assert.deepEqual(L.toggleHidden(h, 'waste').hidden, []);
  let l = L.putCard({ order: ['a', 'b'] }, text('c_new'));
  assert.deepEqual(l.order, ['a', 'b', 'c_new']); assert.equal(l.cards.length, 1);
  l = L.putCard(l, { id: 'c_new', type: 'text', text: 'changed' });
  assert.equal(l.cards[0].text, 'changed'); assert.equal(l.cards.length, 1);
  assert.equal(L.putCard({}, { id: 'c_bad', type: 'light', entity: 'sensor.x' }).cards.length, 0);
  const full = { cards: Array.from({ length: L.MAX_OWN }, (_, i) => text(`c_${String(i).padStart(3, '0')}`)) };
  assert.equal(L.putCard(full, text('c_more')).cards.length, L.MAX_OWN);
  const d = L.dropCard({ order: ['a', 'c_new'], hidden: ['c_new'], cards: [text('c_new')] }, 'c_new');
  assert.deepEqual(d, { order: ['a'], hidden: [], sizes: {}, widths: {}, sections: [], cards: [] });
  assert.deepEqual(L.resetLayout({ order: ['b', 'a'], hidden: ['a'], cards: [text('c_kkk')] }).order, []);
  assert.equal(L.resetLayout({ cards: [text('c_kkk')] }).cards.length, 1);
  const s = L.withSize({}, 'room:r1', 'small');                       // #495: a thermostat on 🌡 Klima big or small
  assert.equal(L.sizeOf(s, 'room:r1'), 'small'); assert.equal(L.sizeOf(s, 'room:r2'), 'big'); assert.equal(L.sizeOf({}, 'x', 'small'), 'small');
  assert.deepEqual(L.withSize(s, 'room:r1', 'huge').sizes, { 'room:r1': 'small' });
  assert.equal(L.emptyLayout(L.cleanLayout(s)), false); assert.equal(L.emptyLayout(L.cleanLayout({})), true);
  assert.deepEqual(L.resetLayout(s).sizes, {}); assert.deepEqual(L.dropCard(s, 'room:r1').sizes, {});
});
test('a new card id, the rows of the masonry grid', () => {
  let i = 0; const seq = [0.5, 0.5, 0.25];
  const a = L.newCardId([], () => seq[i++ % 3]), b = L.newCardId([a], () => 0.5);
  assert.match(a, /^c_[a-z0-9]{6}$/); assert.notEqual(a, b);
  assert.equal(L.rowSpan(100), Math.ceil(114 / 22)); assert.equal(L.rowSpan(0), 1);
});
