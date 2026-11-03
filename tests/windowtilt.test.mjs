// Unit tests for windowtilt.js (#624): a window with a contact "offen" and a contact "gekippt", or a handle sensor that says "tilted"
// (run like offline.test.mjs); with openings.js, which builds on it
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const T = await import(`${dir}/windowtilt.js`);
const O = await import(`${dir}/openings.js`);
const on = new Set(['on', 'open']);
const win = { type: 'window', style: 'single', entity: 'binary_sensor.offen', tiltEntity: 'binary_sensor.kipp' };
const env = (states) => ({
  isOpen: (e) => O.isOpenState(states[e] ? (typeof states[e] === 'string' ? { state: states[e] } : states[e]) : undefined, on),
  stateOf: (e) => (states[e] ? (typeof states[e] === 'string' ? { state: states[e] } : states[e]) : undefined),
});

test('only a window that opens has a tilt contact: no door, no fixed glazing, no text that is not one', () => {
  assert.equal(T.tiltEntity(win), 'binary_sensor.kipp');
  assert.equal(T.tiltEntity({ ...win, type: 'door' }), '');
  assert.equal(T.tiltEntity({ ...win, style: 'fixed' }), '');
  assert.equal(T.tiltEntity({ type: 'window' }), '');
  assert.equal(T.tiltEntity({ type: 'window', tiltEntity: 5 }), '');
  assert.equal(T.tiltEntity(null), '');
});

test('the tilt contact is one of the sensors of the window (alarm, heating, rain warning, the list "offen")', () => {
  assert.deepEqual(O.openingEntities(win), ['binary_sensor.offen', 'binary_sensor.kipp']);
  assert.deepEqual(O.openingEntities({ ...win, entity: '' }), ['binary_sensor.kipp'], 'also without the contact "offen"');
  assert.deepEqual(O.openingEntities({ ...win, tiltEntity: 'binary_sensor.offen' }), ['binary_sensor.offen'], 'the same sensor twice: once');
  assert.deepEqual(O.openingEntities({ ...win, style: 'fixed' }), ['binary_sensor.offen'], 'fixed glazing does not tilt');
});

test('closed, tilted, open: the contact "offen" wins, the tilt contact alone says tilted', () => {
  const word = (s) => { const { isOpen, stateOf } = env(s); return T.windowWord(win, O.openingEntities(win), isOpen, stateOf); };
  assert.equal(word({ 'binary_sensor.offen': 'off', 'binary_sensor.kipp': 'off' }), 'closed');
  assert.equal(word({ 'binary_sensor.offen': 'off', 'binary_sensor.kipp': 'on' }), 'tilted');
  assert.equal(word({ 'binary_sensor.offen': 'on', 'binary_sensor.kipp': 'off' }), 'open');
  assert.equal(word({ 'binary_sensor.offen': 'on', 'binary_sensor.kipp': 'on' }), 'open', 'a sensor at the top is open in both cases');
  assert.equal(word({}), 'closed', 'no states yet');
});

test('a handle sensor that says "tilted" itself (state tilted, or the attribute window_state TILTED) needs no second contact', () => {
  const one = { type: 'window', entity: 'sensor.griff' };
  const word = (st) => { const { isOpen, stateOf } = env({ 'sensor.griff': st }); return T.windowWord(one, O.openingEntities(one), isOpen, stateOf); };
  assert.equal(word('tilted'), 'tilted');
  assert.equal(word('open'), 'open');
  assert.equal(word('closed'), 'closed');
  assert.equal(word({ state: 'on', attributes: { window_state: 'TILTED' } }), 'tilted');
  assert.equal(word({ state: 'on', attributes: { window_state: 'OPEN' } }), 'open');
  assert.ok(O.isOpenState({ state: 'tilted' }, on), 'tilted is not shut: it counts as open');
  assert.ok(T.saysTilted({ state: 'Tilted' }));
  assert.ok(!T.saysTilted({ state: 'on' }));
  assert.ok(!T.saysTilted(null));
});

test('the word of each contact: the tilt contact says "tilted" when it is open', () => {
  const { isOpen, stateOf } = env({ 'binary_sensor.offen': 'off', 'binary_sensor.kipp': 'on' });
  assert.equal(T.contactWord(win, 'binary_sensor.kipp', isOpen, stateOf), 'tilted');
  assert.equal(T.contactWord(win, 'binary_sensor.offen', isOpen, stateOf), 'closed');
  assert.equal(T.contactWord(win, '', isOpen, stateOf), 'closed');
  const b = env({ 'binary_sensor.offen': 'on' });
  assert.equal(T.contactWord(win, 'binary_sensor.offen', b.isOpen, b.stateOf), 'open');
});

test('which panes tilt: those that follow the main contact, else the first that opens; none without a tilt contact', () => {
  assert.deepEqual(T.tiltPanes(win, 1), [0]);
  assert.deepEqual(T.tiltPanes({ type: 'window' }, 1), [], 'no tilt contact');
  assert.deepEqual(T.tiltPanes(win, 0), []);
  const two = { ...win, style: 'double', paneEntities: ['binary_sensor.l', ''] };
  assert.deepEqual(O.tiltedPanes(two, 2), [1], 'pane 2 follows the main contact: it tilts');
  const own = { ...win, style: 'double', paneEntities: ['binary_sensor.l', 'binary_sensor.r'] };
  assert.deepEqual(O.tiltedPanes(own, 2), [0], 'every pane has its own contact: the first tilts');
  const fixed = { ...win, style: 'triple', paneHinges: ['fixed', 'left', 'right'] };
  assert.deepEqual(O.tiltedPanes(fixed, 3), [1, 2], 'a fixed pane never tilts');
});

test('a pane in 3D: open swings, tilted leans in, closed stays', () => {
  const s = (o, k) => env({ 'binary_sensor.offen': o, 'binary_sensor.kipp': k });
  const pane = (o, k, tilts = true) => { const { isOpen, stateOf } = s(o, k); return T.paneWord(win, 'binary_sensor.offen', tilts, isOpen, stateOf); };
  assert.equal(pane('off', 'on'), 'tilted');
  assert.equal(pane('on', 'on'), 'open');
  assert.equal(pane('off', 'off'), 'closed');
  assert.equal(pane('off', 'on', false), 'closed', 'a pane the tilt contact does not tilt');
});

test('the look: a tilted window is yellow, all of it; an open one red', () => {
  const of = () => ({ state: 'on' });
  assert.equal(O.contactLook(['a', 'b'], true, of, true), 'tilted');
  assert.equal(O.contactLook(['a', 'b'], true, of, false), 'open');
  assert.equal(O.contactLook(['a'], true, of), 'open', 'without the 4th argument as before');
  assert.equal(O.partHex('glass', 'tilted', 0x123456), T.TILT_HEX);
  assert.equal(O.partHex('frame', 'tilted', 0x123456), T.TILT_HEX);
  assert.notEqual(T.TILT_HEX, O.OPEN_HEX);
  assert.notEqual(T.TILT_HEX, O.OFFLINE_HEX);
});

test('the list "offen" marks a window that is only tilted', () => {
  const floors = [{ rooms: [{ name: 'Wohnen', points: [[0, 0], [4, 0], [4, 4], [0, 4]] }],
    walls: [{ a: [0, 0], b: [4, 0], openings: [{ id: 'w', pos: 2, ...win }] }] }];
  const list = (s) => O.openItems(floors, { ...env(s), t: (k) => k, pointInPoly: () => true, distToPoly: () => 0 });
  assert.equal(list({ 'binary_sensor.kipp': 'on' })[0].tilted, true);
  assert.equal(list({ 'binary_sensor.kipp': 'on', 'binary_sensor.offen': 'on' })[0].tilted, false);
  assert.equal(list({}).length, 0);
});

test('the pill "n offen" counts a tilt-and-turn pane once, also with both contacts open', () => {
  const c = (s) => O.openCount(win, env(s).isOpen);
  assert.equal(c({ 'binary_sensor.offen': 'on', 'binary_sensor.kipp': 'on' }), 1);
  assert.equal(c({ 'binary_sensor.kipp': 'on' }), 1);
  assert.equal(c({ 'binary_sensor.offen': 'on' }), 1);
  assert.equal(c({}), 0);
  const panes = { type: 'window', entity: 'binary_sensor.a', paneEntities: ['binary_sensor.a', 'binary_sensor.b'] };
  assert.equal(O.openCount(panes, env({ 'binary_sensor.a': 'on', 'binary_sensor.b': 'on' }).isOpen), 2, 'two panes open are two, as before');
});

test('the tilt angle of a window (biggilottecassi: "noch ein bisschen mehr"): 14° without one, whole degrees from 5 to 45', () => {
  assert.equal(T.tiltDeg(win), 14);
  assert.equal(T.tiltDeg({ ...win, tiltDeg: 30 }), 30);
  assert.equal(T.tiltDeg({ ...win, tiltDeg: 99 }), 45, 'not more than 45');
  assert.equal(T.tiltDeg({ ...win, tiltDeg: 2 }), 5, 'not less than 5');
  assert.equal(T.tiltDeg({ ...win, tiltDeg: 22.6 }), 23);
  for (const bad of ['', 'abc', null, -10, 0, NaN]) assert.equal(T.tiltDeg({ ...win, tiltDeg: bad }), 14, String(bad));
  assert.equal(T.tiltDeg(null), 14);
  assert.ok(Math.abs(T.tiltAngle({ ...win, tiltDeg: 30 }) - Math.PI / 6) < 1e-9);
  assert.ok(Math.abs(T.tiltAngle(win) - T.TILT_ANGLE) < 1e-9 && Math.abs(T.TILT_ANGLE - 0.2443) < 0.001, 'about 14°, as before');
});

test('set the tilt angle typed in: kept in 5..45, 14 is not stored', () => {
  const o = { ...win };
  assert.equal(T.setTiltDeg(o, '30'), 30); assert.equal(o.tiltDeg, 30);
  assert.equal(T.setTiltDeg(o, 80), 45); assert.equal(o.tiltDeg, 45);
  assert.equal(T.setTiltDeg(o, 14), 14); assert.equal('tiltDeg' in o, false);
  o.tiltDeg = 20; assert.equal(T.setTiltDeg(o, ''), 14, 'an empty field: back to 14'); assert.equal('tiltDeg' in o, false);
});

test('"Für alle Fenster": the angle for every window that opens, not for doors and fixed glazing', () => {
  const list = [{ type: 'window', style: 'single' }, { type: 'window' }, { type: 'window', style: 'fixed' }, { type: 'door' }, { type: 'window', tiltDeg: 40 }];
  assert.equal(T.tiltAll(list, 25), 3);
  assert.deepEqual(list.map((o) => o.tiltDeg), [25, 25, undefined, undefined, 25]);
  assert.equal(T.tiltAll(list, 14), 3);
  assert.ok(list.every((o) => !('tiltDeg' in o)), 'back to 14: nothing stored');
  assert.equal(T.canTilt({ type: 'window', style: 'fixed' }), false);
  assert.equal(T.canTilt({ type: 'door' }), false);
});
