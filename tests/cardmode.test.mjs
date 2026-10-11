// Unit tests for cardmode.js (the add-on page inside the dashboard card, #13; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/cardmode.js`);
const P = (s) => new URLSearchParams(s);

test('without ?card the page is not in a card', () => {
  assert.equal(C.cardOptions(P('')), null);
  assert.equal(C.cardOptions(P('kiosk=1&floor=OG')), null);
  assert.equal(C.cardOptions(P('card=0')), null);
  assert.equal(C.cardOptions(P('card=false')), null);
});
test('a card without options: everything as in the add-on, room panel and bars shown', () => {
  assert.deepEqual(C.cardOptions(P('card=1')), { floor: null, heat: null, roomPanel: true, nav: true, bar: true, look: {} });
});
test('the options of the card are read from the address', () => {
  const o = C.cardOptions(P('card=1&floor=Obergeschoss&heatmap=temp&room_panel=0&show_nav=false&show_bar=0&theme=light&walls=see_through'
    + '&labels=none&alerts=0&idle_return=5&night=sun'));
  assert.equal(o.floor, 'Obergeschoss'); assert.equal(o.heat, 'temp');
  assert.equal(o.roomPanel, false); assert.equal(o.nav, false); assert.equal(o.bar, false);
  assert.deepEqual(o.look, { cutaway: true, seeThrough: true, lowWalls: false, theme: 'light', labelMode: 'none', alerts: false, idleReturn: 5, nightDim: 'sun' });
});
test('the walls option stands for the wall settings', () => {
  assert.deepEqual(C.cardOptions(P('card=1&walls=low')).look, { lowWalls: true });
  assert.deepEqual(C.cardOptions(P('card=1&walls=full')).look, { cutaway: false, seeThrough: false, lowWalls: false });
  assert.deepEqual(C.cardOptions(P('card=1&walls=auto')).look, { cutaway: true, seeThrough: false, lowWalls: false });
});
test('unknown values are left out (the add-on settings stay)', () => {
  const o = C.cardOptions(P('card=1&theme=pink&walls=glass&labels=many&idle_return=-3&night=always&heatmap=wind&alerts='));
  assert.deepEqual(o.look, {}); assert.equal(o.heat, null);
  assert.deepEqual(C.cardOptions(P('card=1&idle_return=99999')).look, {});
  assert.deepEqual(C.cardOptions(P('card=1&idle_return=0')).look, { idleReturn: 0 });
  assert.deepEqual(C.cardOptions(P('card=1&alerts=1')).look, { alerts: true });
  assert.equal(C.cardOptions(P('card=1&room_panel=1')).roomPanel, true);
});
const floors = [{ id: 'k', name: 'Keller' }, { id: 'eg', name: 'Erdgeschoss' }, { id: 'og', name: ' Obergeschoss ' }, { id: 'd', name: 'Dach' }];
test('the floor of the card: by name (any case), id, number from the ground floor, or the whole house', () => {
  assert.deepEqual(C.cardFloor(floors, 'obergeschoss', 1), { floor: 2 });
  assert.deepEqual(C.cardFloor(floors, 'eg', 1), { floor: 1 });
  assert.deepEqual(C.cardFloor(floors, '0', 1), { floor: 1 });
  assert.deepEqual(C.cardFloor(floors, '1', 1), { floor: 2 });
  assert.deepEqual(C.cardFloor(floors, '-1', 1), { floor: 0 });
  assert.deepEqual(C.cardFloor(floors, 2, 1), { floor: 3 });
  assert.deepEqual(C.cardFloor(floors, 'house', 1), { whole: true });
  assert.deepEqual(C.cardFloor(floors, 'ALL', 1), { whole: true });
});
test('no such floor: the start stays automatic', () => {
  assert.equal(C.cardFloor(floors, 'Garten', 1), null);
  assert.equal(C.cardFloor(floors, '5', 1), null);
  assert.equal(C.cardFloor(floors, '-2', 1), null);
  assert.equal(C.cardFloor(floors, '', 1), null);
  assert.equal(C.cardFloor(floors, null, 1), null);
  assert.equal(C.cardFloor([], 'house'), null);
});
