// Unit tests for floorcards.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/floorcards.js`);
const on = new Set(['on']);
const floor = (over = {}) => ({ name: 'EG', walls: [{ a: [0, 0], b: [10, 0], openings: [] }], rooms: [{ points: [[0, 0], [10, 0], [10, 6], [0, 6]] }], devices: [], ...over });

test('floors with a card: no roofs, no empty floors', () => {
  const l = { floors: [floor(), floor({ kind: 'roof' }), floor({ walls: [], rooms: [] }), floor({ walls: [], name: 'OG' })] };
  assert.deepEqual(F.cardFloors(l).map((x) => x.i), [0, 3]);
});
test('bounds cover walls and rooms', () => {
  assert.deepEqual(F.floorBounds(floor()), { x0: 0, x1: 10, z0: 0, z1: 6 });
  assert.deepEqual(F.floorBounds(floor({ walls: [{ a: [-2, -1], b: [3, 9] }] })), { x0: -2, x1: 10, z0: -1, z1: 9 });
});
test('counts: lights that are on, windows that are open (doors and closed windows do not count)', () => {
  const f = floor({
    devices: [{ entity: 'light.a' }, { entity: 'light.b' }, { entity: 'switch.c' }, {}],
    walls: [{ a: [0, 0], b: [1, 0], openings: [{ type: 'window', entity: 'binary_sensor.w1' }, { type: 'window', entity: 'binary_sensor.w2' }, { type: 'door', entity: 'binary_sensor.d' }, { type: 'window' }] }],
  });
  const states = { 'light.a': { state: 'on' }, 'light.b': { state: 'off' }, 'switch.c': { state: 'on' }, 'binary_sensor.w1': { state: 'on' }, 'binary_sensor.d': { state: 'on' } };
  const r = F.floorCounts(f, { states, onStates: on, isOpen: (e) => !!e && states[e]?.state === 'on' });
  assert.deepEqual(r, { lights: 1, windows: 1 });
});
test('widths: the narrow form is never wider than the wide one', () => {
  const r = F.cardWidths('Erdgeschoss', ['3 Räume', '2 Lichter an', '1 Fenster offen']);
  assert.ok(r.narrowW < r.natW && r.narrowW > 26);
});
test('cards go right of the house when there is room', () => {
  const r = F.arrangeCards([{ y: 200, height: 44, natW: 200, narrowW: 120 }], { w: 1000, h: 700, ox: 0, minX: 300, maxX: 600 });
  assert.equal(r.narrow, false); assert.equal(r.x, 616); assert.equal(r.ys[0], 178);
});
test('cards go left when the right side is full, and narrow when both sides are', () => {
  const left = F.arrangeCards([{ y: 200, natW: 200, narrowW: 120 }], { w: 1000, h: 700, ox: 0, minX: 400, maxX: 900 });
  assert.equal(left.narrow, false); assert.equal(left.x, 184);
  const both = F.arrangeCards([{ y: 200, natW: 200, narrowW: 120 }], { w: 500, h: 700, ox: 0, minX: 100, maxX: 450 });
  assert.equal(both.narrow, true);
});
test('zoomed in (#294): the cards stay beside the house, never on top of it, even off screen', () => {
  const r = F.arrangeCards([{ y: 200, natW: 120, narrowW: 120 }], { w: 400, h: 700, ox: 0, minX: -100, maxX: 380 });
  assert.equal(r.x, 396);                       // right of the house (more room there), partly off screen
  const l = F.arrangeCards([{ y: 200, natW: 120, narrowW: 120 }], { w: 400, h: 700, ox: 0, minX: 20, maxX: 600 });
  assert.equal(l.x, 20 - 16 - 120);             // left of the house
});
test('cards that lie on top of each other are pushed apart, in the original order', () => {
  const r = F.arrangeCards([{ y: 300, height: 40, natW: 100 }, { y: 300, height: 40, natW: 100 }, { y: 100, height: 40, natW: 100 }], { w: 1000, h: 700, ox: 0, minX: 0, maxX: 100 });
  assert.ok(r.ys[2] < r.ys[0] && r.ys[0] + 40 + 6 <= r.ys[1] + 1e-9, r.ys.join());
});
test('the lowest card stays above the bottom buttons', () => {
  const r = F.arrangeCards([{ y: 690, height: 44, natW: 100 }], { w: 1000, h: 700, ox: 0, minX: 0, maxX: 100 });
  assert.ok(r.ys[0] + 44 <= 700 - 64 + 22 + 1e-9, String(r.ys[0]));
});
test('phones (#290): the short line has icons, lights and windows only when there are any', () => {
  assert.deepEqual(F.compactParts({ rooms: 6, lights: 7, windows: 1 }), ['▦ 6', '💡 7', '🪟 1']);
  assert.deepEqual(F.compactParts({ rooms: 3, lights: 0, windows: 0 }), ['▦ 3']);
});
test('phones (#290): the short card is much narrower than the narrow card', () => {
  const parts = ['Räume: 6', 'Lichter an: 7', 'Fenster offen: 1'];
  assert.ok(F.compactWidth('Erdgeschoss', F.compactParts({ rooms: 6, lights: 7, windows: 1 })) < F.cardWidths('Erdgeschoss', parts).narrowW);
});
test('phones (#292): a free column on the right for the cards, only on phones with cards', () => {
  assert.equal(F.cardColumn({ w: 390, phone: true, cards: 4 }), 125);
  assert.equal(F.cardColumn({ w: 320, phone: true, cards: 2 }), 118);
  assert.equal(F.cardColumn({ w: 760, phone: true, cards: 2 }), 150);
  assert.equal(F.cardColumn({ w: 1200, phone: false, cards: 4 }), 0);
  assert.equal(F.cardColumn({ w: 390, phone: true, cards: 0 }), 0);
});
test('phones (#292): the camera goes back so the house fits left of the column', () => {
  assert.equal(F.columnZoom(400, 100), 400 / 300);
  assert.equal(F.columnZoom(400, 0), 1);
  assert.equal(F.columnZoom(0, 100), 1);
});

test('the cards hide while a room is opened in the whole-house view, and in 2D only', () => {
  assert.equal(F.cardsShown({ house: true, mode: '3d', focused: false }), true);
  assert.equal(F.cardsShown({ house: true, mode: '3d', focused: true }), false);
  assert.equal(F.cardsShown({ house: true, mode: '2d', focused: false }), false);
  assert.equal(F.cardsShown({ house: false, mode: '3d', focused: false }), false);
});
