// Unit tests for houses.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const H = await import(`${process.env.STATIC_DIR || '/tmp/static'}/houses.js`);
const list = [{ id: 'main', name: 'Haus' }, { id: 'ferien', name: 'Ferienhaus Süd' }, { id: 'h3', name: 'Garage' }];

test('the house asked for in the address wins (by id or by name, any case)', () => {
  assert.equal(H.pickHouse(list, 'ferien', 'h3').id, 'ferien');
  assert.equal(H.pickHouse(list, '  FERIENHAUS süd ', null).id, 'ferien');
});
test('without a wish the last used house opens, else the first', () => {
  assert.equal(H.pickHouse(list, '', 'h3').id, 'h3');
  assert.equal(H.pickHouse(list, '', 'gone').id, 'main');
  assert.equal(H.pickHouse(list, null, null).id, 'main');
});
test('an unknown wish falls back to the last used house; no houses gives null', () => {
  assert.equal(H.pickHouse(list, 'nope', 'h3').id, 'h3');
  assert.equal(H.pickHouse([], 'x', 'y'), null);
});
test('only the untouched default house name is translated', () => {
  assert.equal(H.houseLabel({ id: 'main', name: 'Haus' }, 'House'), 'House');
  assert.equal(H.houseLabel({ id: 'main', name: 'Mein Zuhause' }, 'House'), 'Mein Zuhause');
  assert.equal(H.houseLabel({ id: 'x', name: 'Haus' }, 'House'), 'Haus');
});
test('layout address: old address without a house, escaped id with one', () => {
  assert.equal(H.layoutUrl(null), 'api/layout');
  assert.equal(H.layoutUrl('ferien'), 'api/layout?house=ferien');
  assert.equal(H.layoutUrl('a b&c'), 'api/layout?house=a%20b%26c');
});
