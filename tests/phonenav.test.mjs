// Unit tests for phonenav.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/phonenav.js`);
const lb = { house: 'Ganzes Haus', floors: 'Etagen', rooms: 'Zimmer', allRooms: 'Alle' };
const room = (id, name) => ({ id, name, points: [[0, 0], [1, 0], [1, 1]] });
const floors = [
  { name: 'Keller', rooms: [room('k1', 'Hobbyraum')], devices: [] },
  { name: 'Erdgeschoss', rooms: [room('e1', 'Küche'), room('e2', 'Bad'), room('e3', '')], devices: [] },
  { name: 'Obergeschoss', rooms: [], devices: [] },
];
const kinds = (m) => m.items.map((i) => i.kind);

test('the button names the floor shown, and the room when one is chosen', () => {
  assert.equal(P.phoneNavModel(floors, 1, false, null, lb).label, 'Erdgeschoss');
  assert.equal(P.phoneNavModel(floors, 1, false, 'e1', lb).label, 'Erdgeschoss · Küche');
  assert.equal(P.phoneNavModel(floors, 1, true, null, lb).label, 'Ganzes Haus');
});
test('the list: every floor, the whole house, then the named rooms of the floor shown', () => {
  const m = P.phoneNavModel(floors, 1, false, null, lb);
  assert.deepEqual(kinds(m), ['head', 'floor', 'floor', 'floor', 'house', 'head', 'room', 'room']);
  assert.deepEqual(m.items.filter((i) => i.kind === 'floor').map((i) => [i.label, i.active]), [['Keller', false], ['Erdgeschoss', true], ['Obergeschoss', false]]);
  assert.deepEqual(m.items.filter((i) => i.kind === 'room').map((i) => [i.label, i.fi, i.id]), [['Küche', 1, 'e1'], ['Bad', 1, 'e2']]);
});
test('a chosen room is marked and "all" comes first; a floor without rooms has no room part', () => {
  const m = P.phoneNavModel(floors, 1, false, 'e2', lb);
  assert.equal(m.items.find((i) => i.kind === 'room' && i.active).id, 'e2');
  assert.equal(m.items[kinds(m).indexOf('head', 1) + 1].kind, 'all');
  assert.deepEqual(kinds(P.phoneNavModel(floors, 2, false, null, lb)), ['head', 'floor', 'floor', 'floor', 'house']);
});
test('whole house: the rooms of every floor, top floor first, under the floor name', () => {
  const m = P.phoneNavModel(floors, 0, true, null, lb);
  assert.ok(m.items.find((i) => i.kind === 'house').active);
  assert.ok(!m.items.some((i) => i.kind === 'floor' && i.active));
  const tail = m.items.slice(kinds(m).indexOf('head', 1) + 1).map((i) => i.label);
  assert.deepEqual(tail, ['Erdgeschoss', 'Küche', 'Bad', 'Keller', 'Hobbyraum']);
});
test('a single empty floor has no whole-house entry; occupied rooms are marked', () => {
  const one = [{ name: 'Wohnung', rooms: [room('w1', 'Flur')], devices: [] }];
  const m = P.phoneNavModel(one, 0, false, null, lb, (r) => r.id === 'w1');
  assert.ok(!kinds(m).includes('house'));
  assert.equal(m.items.find((i) => i.kind === 'room').occupied, true);
});
