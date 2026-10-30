// Unit tests for lightslider.js (the card "Lichtsteuerung", #597; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/lightslider.js`);
const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/cards.js`);
const K = await import(`${process.env.STATIC_DIR || '/tmp/static'}/kelvin.js`);

test('rows: lamps, light groups and switches, each once, names and icons cut', () => {
  assert.equal(L.fitsRow('light.wz'), true); assert.equal(L.fitsRow('switch.gang'), true); assert.equal(L.fitsRow('fan.x'), false); assert.equal(L.fitsRow('Light.X'), false);
  assert.deepEqual(L.cleanRows([{ e: 'light.wz', name: ' Woonkamer ', icon: '🛋' }, { e: 'light.wz' }, { e: 'switch.gang' }, { e: 'sensor.x' }, 'light.y',
    { e: 'light.k', name: 'ä'.repeat(40), icon: 'x'.repeat(20) }]),
  [{ e: 'light.wz', name: 'Woonkamer', icon: '🛋' }, { e: 'switch.gang', name: '', icon: '' }, { e: 'light.k', name: 'ä'.repeat(30), icon: 'x'.repeat(8) }]);
  assert.equal(L.cleanRows(Array.from({ length: 20 }, (_, i) => ({ e: `light.l${i}` }))).length, L.MAX_ROWS);
});

test('the card made safe like in boards.py (tests/test_boards.py has the same cards)', () => {
  const c = C.cleanCard({ id: 'c_licht', type: 'lights', name: 'Licht', rows: [{ e: 'light.wz', name: ' Woonkamer ', icon: '🛋' }, { e: 'light.wz' },
    { e: 'switch.gang' }, { e: 'sensor.x' }, 'light.y', { e: 'light.k', name: 'ä'.repeat(40), icon: 'x'.repeat(20) }], allOff: true, popup: true, hook: true });
  assert.deepEqual(c, { id: 'c_licht', type: 'lights', name: 'Licht', width: 1, rows: [{ e: 'light.wz', name: 'Woonkamer', icon: '🛋' },
    { e: 'switch.gang', name: '', icon: '' }, { e: 'light.k', name: 'ä'.repeat(30), icon: 'x'.repeat(8) }], allOff: true, expand: true, popup: true, hook: true });
  const d = C.cleanCard({ id: 'c_licht', type: 'lights', rows: [{ e: 'light.a' }], expand: false, hook: true });
  assert.deepEqual([d.allOff, d.expand, d.popup, d.hook], [false, false, false, false]);
  assert.equal(C.cleanCard({ id: 'c_licht', type: 'lights', rows: [] }), null);
  assert.deepEqual(C.cardEntities(c), ['light.wz', 'switch.gang', 'light.k']);
});

test('how a row looks: on with its brightness and colour, off, not there', () => {
  assert.deepEqual(L.rowLook('light.wz', { state: 'on', brightness: 75, rgb: [255, 120, 40] }), { kind: 'on', dim: true, pct: 75, rgb: [255, 120, 40] });
  assert.deepEqual(L.rowLook('light.wz', { state: 'on', brightness: 0.2 }).pct, 1);                         // on is never empty
  assert.deepEqual(L.rowLook('light.wz', { state: 'on', kel: 6500 }).rgb, K.kelvinRgb(6500));               // a white tone, no colour
  assert.deepEqual(L.rowLook('light.wz', { state: 'on' }), { kind: 'on', dim: true, pct: 100, rgb: L.WARM });
  assert.deepEqual(L.rowLook('light.relais', { state: 'on', brightness: 40, dim: false }), { kind: 'on', dim: false, pct: 100, rgb: L.WARM });
  assert.deepEqual(L.rowLook('switch.gang', { state: 'on' }).dim, false);
  assert.equal(L.rowLook('light.wz', { state: 'off', brightness: null }).kind, 'off'); assert.equal(L.rowLook('light.wz', { state: 'off' }).pct, 0);
  assert.equal(L.rowLook('light.keuken', { state: 'unavailable' }).kind, 'na'); assert.equal(L.rowLook('light.keuken', { state: 'unknown' }).kind, 'na');
  assert.equal(L.rowLook('light.gone', undefined).kind, 'missing');
  assert.deepEqual(L.rowLook('light.x', { state: 'on', rgb: [300, -4, 'x'] }).rgb, L.WARM);
});

test('what a row says, also while it is dragged', () => {
  assert.deepEqual(L.statusOf(L.rowLook('light.a', { state: 'on', brightness: 31 })), { key: 'pct', pct: 31 });
  assert.deepEqual(L.statusOf(L.rowLook('switch.a', { state: 'on' })), { key: 'on', pct: 100 });
  assert.deepEqual(L.statusOf(L.rowLook('light.a', { state: 'off' })), { key: 'off', pct: 0 });
  assert.deepEqual(L.statusOf(L.rowLook('light.a', { state: 'unavailable' })), { key: 'na', pct: 0 });
  assert.deepEqual(L.statusOf(L.rowLook('light.a', { state: 'off' }), 60), { key: 'pct', pct: 60 });
  assert.deepEqual(L.statusOf(L.rowLook('light.a', { state: 'on' }), 0), { key: 'off', pct: 0 });
});

test('dragging: the brightness under the finger, the call when it lets go', () => {
  assert.equal(L.pctAt(150, 100, 200), 25); assert.equal(L.pctAt(50, 100, 200), 0); assert.equal(L.pctAt(999, 100, 200), 100); assert.equal(L.pctAt(5, 0, 0), 0);
  assert.deepEqual(L.dragCall(0), { service: 'turn_off', data: null });
  assert.deepEqual(L.dragCall(42.4), { service: 'turn_on', data: { brightness_pct: 42 } });
  assert.deepEqual(L.dragCall(140), { service: 'turn_on', data: { brightness_pct: 100 } });
});

test('a light group opens to its lamps, "Alle aus" takes the rows that are on', () => {
  assert.deepEqual(L.membersOf('light.wz', { members: ['light.a', 'light.wz', 'light.a', 'sensor.x', 'switch.b'] }), ['light.a', 'switch.b']);
  assert.deepEqual(L.membersOf('switch.x', { members: ['light.a'] }), []); assert.deepEqual(L.membersOf('light.z2m', { state: 'on' }), []);
  assert.deepEqual(L.onRows([{ e: 'light.a' }, { e: 'light.b' }, { e: 'switch.c' }], { 'light.a': { state: 'on' }, 'light.b': { state: 'off' }, 'switch.c': { state: 'on' } }), ['light.a', 'switch.c']);
});

test('a bar with several lamps of its own (the owner: "pro Kachel mehrere Lampen"): cleaned, its lamps, what it opens to', () => {
  const rows = L.cleanRows([{ e: 'light.a', more: ['light.b', 'light.a', 'sensor.x', 'light.b', 'switch.c', 7], name: 'Küche' }, { e: 'light.a', more: ['light.b', 'switch.c'] },
    { e: 'light.a' }, { e: 'light.b', more: [] }, { e: 'sensor.x', more: ['light.d'] }, { e: 'light.e', more: 'light.f' }]);
  assert.deepEqual(rows, [{ e: 'light.a', more: ['light.b', 'switch.c'], name: 'Küche', icon: '' }, { e: 'light.a', name: '', icon: '' },
    { e: 'light.b', name: '', icon: '' }, { e: 'light.e', name: '', icon: '' }]);                     // a lamp may be in several bars, the same bar once
  assert.equal(L.cleanRows([{ e: 'light.x', more: Array.from({ length: 30 }, (_, i) => `light.l${i}`) }])[0].more.length, L.MAX_LAMPS - 1);
  assert.deepEqual(L.rowLamps(rows[0]), ['light.a', 'light.b', 'switch.c']); assert.equal(L.rowKey(rows[0]), 'light.a,light.b,switch.c'); assert.equal(L.rowKey(rows[1]), 'light.a');
  assert.deepEqual(L.rowMembers(rows[0], { 'light.a': { members: ['light.z'] } }), ['light.a', 'light.b', 'switch.c']);   // its own lamps, not those of a group
  assert.deepEqual(L.rowMembers(rows[1], { 'light.a': { members: ['light.z'] } }), ['light.z']);
  assert.deepEqual(C.cardEntities({ type: 'lights', rows }), ['light.a', 'light.b', 'switch.c', 'light.e']);
  assert.deepEqual(L.onRows(rows, { 'light.a': { state: 'off' }, 'light.b': { state: 'on' }, 'switch.c': { state: 'on' }, 'light.e': { state: 'on' } }), ['light.b', 'switch.c', 'light.e']);
});

test('how a bar of several lamps looks: on when one is, as bright as they are on average, grey when none can be used', () => {
  const s = { 'light.a': { state: 'on', brightness: 80, rgb: [255, 0, 0] }, 'light.b': { state: 'on', brightness: 40 }, 'switch.c': { state: 'on' }, 'light.d': { state: 'off' },
    'light.na': { state: 'unavailable' }, 'light.relais': { state: 'on', dim: false } };
  assert.deepEqual(L.lampsLook(['light.a', 'light.b', 'switch.c'], s), { kind: 'on', dim: true, pct: 60, rgb: [255, 0, 0] });   // the switch has no brightness
  assert.deepEqual(L.lampsLook(['light.d', 'light.b'], s), { kind: 'on', dim: true, pct: 40, rgb: L.WARM });
  assert.deepEqual(L.lampsLook(['light.d', 'light.na'], s), { kind: 'off', dim: true, pct: 0, rgb: L.WARM });
  assert.deepEqual(L.lampsLook(['switch.c', 'light.relais'], s), { kind: 'on', dim: false, pct: 100, rgb: L.WARM });
  assert.equal(L.lampsLook(['light.na', 'light.gone'], s).kind, 'na'); assert.equal(L.lampsLook(['light.gone', 'light.weg'], s).kind, 'missing');
  assert.deepEqual(L.lampsLook(['light.a'], s), L.rowLook('light.a', s['light.a']));                   // one lamp: as before
});

test('what a bar of several lamps sends: off to those on, on to all that can be used, a brightness to those that dim', () => {
  const s = { 'light.a': { state: 'on', brightness: 80 }, 'light.b': { state: 'off' }, 'switch.c': { state: 'off' }, 'light.na': { state: 'unavailable' } };
  const lamps = ['light.a', 'light.b', 'switch.c', 'light.na'];
  assert.deepEqual(L.rowCalls(lamps, s, { on: false }), [['light.a', 'turn_off', null]]);
  assert.deepEqual(L.rowCalls(lamps, s, { on: true }), [['light.a', 'turn_on', null], ['light.b', 'turn_on', null], ['switch.c', 'turn_on', null]]);
  assert.deepEqual(L.rowCalls(lamps, s, { pct: 35 }), [['light.a', 'turn_on', { brightness_pct: 35 }], ['light.b', 'turn_on', { brightness_pct: 35 }], ['switch.c', 'turn_on', null]]);
  assert.deepEqual(L.rowCalls(lamps, s, { pct: 0 }), [['light.a', 'turn_off', null]]);
  assert.deepEqual(L.rowCalls(['light.b'], s, { on: false }), [['light.b', 'turn_off', null]]);      // one lamp: as before, whatever it says
  assert.deepEqual(L.rowCalls(['light.b'], s, { pct: 50 }), [['light.b', 'turn_on', { brightness_pct: 50 }]]);
});

test('the light card a tap opens: by its id, else the window of "Lichter an", the version one sees first', () => {
  const card = (id, more) => ({ id, type: 'lights', rows: [{ e: 'light.a' }], ...more });
  const settings = { pageLayouts: { today: { cards: [card('c_alle', { popup: true, hook: true }), { id: 'c_txt', type: 'text' }] }, p_licht: { cards: [card('c_grid')] } },
    pageVariants: { today: [{ id: 'v_kids01', layout: { cards: [card('c_alle', { name: 'Kinder', popup: true, hook: true })] } }] } };
  const all = L.lightCards(settings);
  assert.deepEqual(all.map((c) => [c.id, c.page, c.version, c.hook]), [['c_alle', 'today', '', true], ['c_grid', 'p_licht', '', false], ['c_alle', 'today', 'v_kids01', true]]);
  assert.equal(L.pickLightCard(all, { id: 'c_grid' }).id, 'c_grid');
  assert.equal(L.pickLightCard(all, { hook: true }).name, undefined);
  assert.equal(L.pickLightCard(all, { hook: true, seen: (p) => (p === 'today' ? 'v_kids01' : '') }).name, 'Kinder');
  assert.equal(L.pickLightCard(all, { id: 'c_none' }), null); assert.equal(L.pickLightCard(L.lightCards({}), { hook: true }), null);
});
