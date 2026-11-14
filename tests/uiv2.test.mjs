// Unit tests for uiv2.js (4.73.0, „Oberfläche 2“): the switch, the sections, what a pane does, the kinds of window, the lines, the pictures
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const U = await import(`${dir}/uiv2.js`);
const win = (x = {}) => ({ id: 'o', type: 'window', style: 'double', pos: 2, width: 1.2, height: 1.2, sill: 0.9, ...x });

test('the choice: only "v2" is the new panel; ?ui=2 / v2 / neu picks it, ?ui=1 the old one, no ?ui says nothing', () => {
  assert.equal(U.cleanUi('v2'), 'v2');
  for (const v of ['classic', '', null, undefined, 2, 'V2x']) assert.equal(U.cleanUi(v), 'classic', String(v));
  assert.equal(U.uiFromQuery('?ui=2'), 'v2');
  assert.equal(U.uiFromQuery('?debug=1&ui=V2'), 'v2');
  assert.equal(U.uiFromQuery('?ui=neu'), 'v2');
  assert.equal(U.uiFromQuery('?ui=1'), 'classic');
  assert.equal(U.uiFromQuery('?ui=classic'), 'classic');
  assert.equal(U.uiFromQuery('?debug=1'), null);
  assert.equal(U.uiFromQuery(''), null);
});

test('the kind of panel: a window and a door differ, the rest by their kind', () => {
  assert.equal(U.panelKind('opening', win()), 'window');
  assert.equal(U.panelKind('opening', { type: 'door' }), 'door');
  assert.equal(U.panelKind('room', {}), 'room');
  assert.equal(U.panelKind('device', {}), 'device');
});

test('the marked fields are split into groups, fields before the first mark stay on top', () => {
  const els = ['name', 'M:size', 'w', 'h', 'M:panes', 'n', 'M:size', 'pos', 'M:del', 'x'];
  const g = U.groupMarked(els, (e) => (e.startsWith('M:') ? e.slice(2) : null));
  assert.deepEqual([...g.keys()], ['top', 'size', 'panes', 'del']);
  assert.deepEqual(g.get('top'), ['name']);
  assert.deepEqual(g.get('size'), ['w', 'h', 'pos'], 'a mark used twice adds to the same group, in order');
  assert.deepEqual(g.get('panes'), ['n']);
});

test('the sections in their order: only those with fields (or drawn by the panel), unknown ones open at the end, never top / del / panesList', () => {
  const g = new Map([['top', ['a']], ['contact', ['c']], ['size', ['s']], ['del', ['x']], ['panesList', ['p']], ['odd', ['o']], ['fixed', []]]);
  const order = U.sectionOrder('window', g, ['kind']);
  assert.deepEqual(order.map(([k]) => k), ['kind', 'size', 'contact', 'odd']);
  assert.equal(order.find(([k]) => k === 'odd')[2], true);
  assert.equal(order.find(([k]) => k === 'size')[2], true, 'size starts open');
  assert.equal(order.find(([k]) => k === 'contact')[2], false);
  assert.deepEqual(U.sectionOrder('device', new Map([['entity', [1]], ['place', [1]]])).map(([k]) => k), ['entity', 'place'], 'a device: what it controls first');
});

test('open or closed: as this device left it, else as the list says; junk is dropped', () => {
  assert.equal(U.isOpen('window', 'size', true, {}), true);
  assert.equal(U.isOpen('window', 'size', true, { 'window.size': false }), false);
  assert.equal(U.isOpen('window', 'contact', false, { 'window.contact': true }), true);
  assert.deepEqual(U.cleanOpen({ 'window.size': false, 'door.more': true, bad: true, 'x.y': 'yes', 'a.b.c': true }), { 'window.size': false, 'door.more': true });
  assert.deepEqual(U.cleanOpen(null), {});
  assert.deepEqual(U.cleanOpen([1]), {});
});

test('what a pane does: its hinge (bottom without one), fixed glazing is one fixed pane', () => {
  assert.deepEqual(U.paneKinds(win()), ['bottom', 'bottom']);
  assert.deepEqual(U.paneKinds(win({ hinge: 'left', style: 'single' })), ['left']);
  assert.deepEqual(U.paneKinds(win({ style: 'triple', paneHinges: ['left', 'fixed', 'right'] })), ['left', 'fixed', 'right']);
  assert.deepEqual(U.paneKinds(win({ style: 'fixed' })), ['fixed']);
  assert.deepEqual(U.paneKinds(win({ panes: 4 })), ['bottom', 'bottom', 'bottom', 'bottom']);
});

test('set what one pane does, like the fields of the classic panel', () => {
  const a = U.setPaneKind(win({ style: 'single' }), 0, 'left');
  assert.equal(a.hinge, 'left');
  U.setPaneKind(a, 0, 'bottom');
  assert.equal('hinge' in a, false, 'bottom is the default and not stored');
  const f = U.setPaneKind(win({ style: 'single', hinge: 'left', tiltEntity: 'binary_sensor.k', tiltDeg: 20, fixedBelow: 1 }), 0, 'fixed');
  assert.equal(f.style, 'fixed');
  for (const k of ['tiltEntity', 'tiltDeg', 'fixedBelow']) assert.equal(k in f, false, k);
  U.setPaneKind(f, 0, 'right');
  assert.equal(f.style, 'single', 'fixed glazing that opens again: one pane');
  assert.equal(f.hinge, 'right');
  const d = U.setPaneKind(win({ paneEntities: ['binary_sensor.a', 'binary_sensor.b'] }), 1, 'right');
  assert.deepEqual(d.paneHinges, ['bottom', 'right']);
  U.setPaneKind(d, 1, 'fixed');
  assert.deepEqual(d.paneHinges, ['bottom', 'fixed']);
  assert.deepEqual(d.paneEntities, ['binary_sensor.a', ''], 'a fixed pane loses its own contact');
  U.setPaneKind(d, 1, 'bottom');
  assert.equal('paneHinges' in d, false, 'all like the window: no list');
  const h = U.setPaneKind(win({ hinge: 'left' }), 0, 'right');
  assert.deepEqual(h.paneHinges, ['right', 'left'], 'several panes: the others keep the window\'s hinge');
  assert.equal(U.setPaneKind(win(), 0, 'sideways').paneHinges, undefined, 'an unknown kind changes nothing');
  assert.deepEqual(U.setPaneKind({ type: 'door', style: 'single' }, 0, 'left'), { type: 'door', style: 'single' }, 'a door has no panes');
});

test('the number of panes: the style stays, the number overrides it; contacts and hinges shrink with it', () => {
  const o = U.setPaneCount(win({ paneEntities: ['a', 'b'], paneHinges: ['left', 'right'] }), 3);
  assert.equal(o.panes, 3);
  U.setPaneCount(o, 2);
  assert.equal('panes' in o, false, 'two is what a double window has');
  U.setPaneCount(o, 1);
  assert.equal(o.panes, 1);
  assert.equal('paneEntities' in o, false);
  assert.equal('paneHinges' in o, false);
  assert.equal(U.setPaneCount(win(), 99).panes, 8, 'at most 8');
  assert.equal('panes' in U.setPaneCount(win({ style: 'fixed' }), 3), false, 'fixed glazing keeps one pane');
});

test('the words under a pane', () => {
  assert.equal(U.paneCaption(win(), 'left'), 'v2.cap.turn');
  assert.equal(U.paneCaption(win({ tiltEntity: 'binary_sensor.k' }), 'right'), 'v2.cap.turnTilt');
  assert.equal(U.paneCaption(win(), 'bottom'), 'v2.cap.tilt');
  assert.equal(U.paneCaption(win(), 'top'), 'v2.cap.top');
  assert.equal(U.paneCaption(win(), 'fixed'), 'v2.cap.fixed');
});

test('the window drawn half open: one pane group per pane to tap, the chosen one marked, captions, fixed glass bands', () => {
  const s = U.windowSvg(win({ style: 'triple', paneHinges: ['left', 'fixed', 'bottom'] }), { sel: 2, captions: ['dreht', 'fest', '<kippt>'] });
  assert.equal((s.match(/data-pane="/g) || []).length, 3);
  assert.match(s, /data-pane="2" class="v2Pane on"/);
  assert.match(s, /&lt;kippt&gt;/, 'captions are escaped');
  assert.equal((s.match(/<polygon/g) || []).length, 2, 'the turned and the tilted pane are drawn open, the fixed one flat');
  const tall = U.windowSvg(win({ style: 'single', width: 0.9, height: 2.2, sill: 0, fixedBelow: 1.1 }));
  assert.match(tall, /^<svg class="v2Win"/);
  const bands = (tall.match(/fill="#cfe5f8"/g) || []).length;
  assert.equal(bands, 1, 'the fixed glass below is a band of its own');
  const wide = U.windowSvg(win({ width: 6, height: 1 }), { maxW: 200 });
  assert.match(wide, /width="216"/, 'a very wide window is made smaller to fit');
});

test('the kinds of window: which one a window is, and making it another', () => {
  const P = {
    window: { type: 'window', style: 'single', width: 1.0, height: 1.2, sill: 0.9 },
    window2: { type: 'window', style: 'double', width: 1.8, height: 1.2, sill: 0.9 },
    windowFloor: { type: 'window', style: 'single', width: 0.9, height: 2.2, sill: 0, fixedBelow: 1.1 },
    windowFixed: { type: 'window', style: 'fixed', width: 1.6, height: 1.4, sill: 0.6 },
    door: { type: 'door', style: 'single', width: 0.9, height: 2.05, sill: 0 },
  };
  assert.equal(U.windowKind(win({ width: 1.8 }), P), 'window2');
  assert.equal(U.windowKind(win({ style: 'single', width: 0.9, height: 2.2, sill: 0, fixedBelow: 1.1 }), P), 'windowFloor');
  assert.equal(U.windowKind(win({ width: 1.75 }), P), '', 'own sizes');
  assert.equal(U.windowKind(win({ width: 1.8, panes: 3 }), P), '', 'own number of panes');
  const o = U.applyWindowKind(win({ style: 'single', hinge: 'left', panes: 3, paneHinges: ['left', 'left', 'left'], paneEntities: ['a', 'b', 'c'], fixedAbove: 0.4 }), P.window2);
  assert.deepEqual([o.style, o.width, o.height, o.sill, o.hinge], ['double', 1.8, 1.2, 0.9, 'left']);
  for (const k of ['panes', 'paneHinges', 'fixedAbove', 'fixedBelow']) assert.equal(k in o, false, k);
  assert.deepEqual(o.paneEntities, ['a', 'b'], 'contacts only for the panes it has');
  U.applyWindowKind(o, P.windowFloor);
  assert.equal(o.fixedBelow, 1.1);
  assert.equal('paneEntities' in o, false, 'one pane: no own contacts');
  U.applyWindowKind(Object.assign(o, { tiltEntity: 'k', tiltDeg: 20 }), P.windowFixed);
  for (const k of ['tiltEntity', 'tiltDeg', 'fixedBelow']) assert.equal(k in o, false, k);
  assert.deepEqual(U.applyWindowKind({ type: 'door' }, P.window), { type: 'door' }, 'a door stays a door');
});

test('the lines of the sections say what is set', () => {
  const len = (m) => `${(+m).toFixed(2).replace('.', ',')} m`;
  const t = (k, v = {}) => `${k}${JSON.stringify(v)}`;
  const say = (pk, key, it) => U.sayLine(t, U.summary(pk, key, it, { len, name: (e) => e.toUpperCase() }));
  assert.equal(say('window', 'size', win()), 'v2.sum.size{"w":"1,20 m","h":"1,20 m","s":"0,90 m"}');
  assert.equal(say('door', 'size', { type: 'door', width: 0.9, height: 2.05 }), 'v2.sum.sizeDoor{"w":"0,90 m","h":"2,05 m"}');
  assert.match(say('window', 'panes', win({ hinge: 'left', tiltEntity: 'k' })), /"n":2,"how":"v2.cap.turnTilt\{\}","dir":"v2.in\{\}"/);
  assert.match(say('window', 'panes', win({ openOutward: true })), /"how":"v2.cap.tilt\{\}","dir":"v2.out\{\}"/);
  assert.equal(say('window', 'panes', win({ style: 'fixed' })), 'v2.sum.fixedGlazing{}');
  assert.equal(say('window', 'fixed', win()), 'v2.sum.none{}');
  assert.equal(say('window', 'fixed', win({ height: 2.2, fixedBelow: 1.1 })), 'v2.sum.fixedGlass{"lo":"1,10 m","hi":"–"}');
  assert.equal(say('window', 'contact', win()), 'v2.sum.noContact{}');
  assert.equal(say('window', 'contact', win({ entity: 'binary_sensor.f' })), 'v2.sum.contact{"e":"BINARY_SENSOR.F"}');
  assert.equal(say('window', 'contact', win({ entity: 'a', tiltEntity: 'b' })), 'v2.sum.contactTilt{"e":"A"}');
  assert.equal(say('window', 'contact', win({ paneEntities: ['a', '', 'b'] })), 'v2.sum.contact{"e":"2 ×"}');
  assert.equal(say('window', 'shutter', win()), 'v2.sum.noneM{}');
  assert.equal(say('window', 'shutter', win({ shutter: true })), 'v2.sum.yes{}');
  assert.equal(say('window', 'shutter', win({ shutter: true, shutterEntity: 'cover.r' })), 'v2.sum.is{"x":"COVER.R"}');
  assert.equal(say('window', 'more', win()), 'v2.sum.tiltDeg{"d":14}');
  assert.equal(say('window', 'more', win({ tiltDeg: 30 })), 'v2.sum.tiltDeg{"d":30}');
  assert.equal(say('door', 'style', { type: 'door', style: 'sliding' }), 'st.sliding{}');
  assert.equal(say('device', 'entity', { entity: 'light.a' }), 'v2.sum.is{"x":"LIGHT.A"}');
  assert.equal(say('device', 'entity', {}), 'v2.sum.noEntity{}');
  assert.equal(say('device', 'place', { x: 1, z: 2, rot: 90 }), 'v2.sum.place{"x":"1,00 m","z":"2,00 m","r":90,"y":"0,00 m"}');
  assert.equal(say('device', 'tilt', {}), 'v2.sum.nothing{}');
  assert.equal(say('device', 'tilt', { tiltX: 15, mirror: true }), 'v2.sum.mirror{"x":"15°"}');
  assert.equal(say('device', 'dsize', { scale: 1.5 }), 'v2.sum.scale{"k":1.5}');
  assert.equal(say('wall', 'wsize', { thickness: 0.24, height: 2.6 }), 'v2.sum.wall{"d":"0,24 m","h":"2,60 m"}');
  assert.equal(U.sayLine(t, 'plain'), 'plain');
  assert.equal(say('device', 'look', {}), '', 'no line for a section that says enough');
  assert.equal(say('door', 'more', { type: 'door' }), '');
});

test('the floor seen from the side: the difference in cm, a lower floor drawn lower', () => {
  const down = U.levelSvg(-0.15, { storey: 'Flur', room: 'Wohnzimmer' });
  assert.match(down, /−15</);
  assert.match(down, />Flur</);
  assert.match(down, /y="49" width="72"/, '15 cm lower: 9 px lower');
  assert.match(U.levelSvg(0.3), /\+30</);
  assert.doesNotMatch(U.levelSvg(0), /#ffd45c/, 'no difference: no measure');
  assert.match(U.levelSvg(5), /\+100</, 'at most 1 m');
  assert.match(U.levelSvg(0, { room: '<b>' }), /&lt;b&gt;/);
});

test('the head: its sign and the path above it', () => {
  assert.equal(U.headIcon('window', {}), '🪟');
  assert.equal(U.headIcon('door', { style: 'garage' }), '🚗');
  assert.equal(U.headIcon('device', { type: 'tv_wall' }, 'living'), '📺');
  assert.equal(U.headIcon('device', { type: 'lamp' }, 'lighting'), '💡');
  assert.equal(U.headIcon('device', { type: 'x' }, 'nope'), '📦');
  const c = U.crumbs({ house: 'Demo', floor: 'EG', room: { id: 'r1', name: 'Wohnzimmer' }, name: 'Fenster', kind: 'opening' });
  assert.deepEqual(c.map((x) => x.text), ['🏠 Demo', 'EG', 'Wohnzimmer', 'Fenster']);
  assert.deepEqual(c[2].sel, { kind: 'room', id: 'r1' });
  assert.equal(c[3].sel, undefined, 'the object itself: no tap');
  assert.deepEqual(U.crumbs({ house: 'Demo', floor: 'EG', room: { id: 'r1', name: 'Wohnzimmer' }, name: 'Wohnzimmer', kind: 'room' }).map((x) => x.text), ['🏠 Demo', 'EG', 'Wohnzimmer']);
});

test('5.7.0: stairs, floor openings and blocks get sections; the plot, its areas and cables get the head of the new panel', () => {
  for (const k of ['stair', 'hole', 'block', 'plot', 'yard', 'cable']) assert.ok(U.V2_KINDS.includes(k), k);
  assert.deepEqual(U.SECTIONS.stair.map(([k]) => k), ['form', 'corner', 'steps', 'look', 'place']);
  assert.deepEqual(U.SECTIONS.hole.map(([k]) => k), ['form']);
  assert.deepEqual(U.SECTIONS.block.map(([k]) => k), ['bsize']);
  // a straight stair has no corner fields: that section is left out
  const groups = new Map([['top', [1]], ['form', [1, 2]], ['steps', [1]], ['corner', []], ['place', [1, 2, 3]]]);
  assert.deepEqual(U.sectionOrder('stair', groups).map(([k]) => k), ['form', 'steps', 'place']);
  assert.deepEqual([U.headIcon('stair', {}), U.headIcon('hole', {}), U.headIcon('block', {}), U.headIcon('plot', {}), U.headIcon('yard', {}), U.headIcon('cable', {})],
    ['🪜', '⬚', '🧊', '🗺', '🌱', '🔌']);
});

test('5.7.0: the lines of the stair, the floor opening and the block', () => {
  const len = (m) => `${(+m).toFixed(2)} m`;
  assert.deepEqual(U.summary('stair', 'form', { dir: 'up', w: 1 }, { len }), ['v2.sum.stairForm', { dir: { key: 'stair.up' }, w: '1.00 m' }]);
  assert.deepEqual(U.summary('stair', 'form', { dir: 'down', w: 0.9 }, { len })[1].dir, { key: 'stair.down' });
  assert.deepEqual(U.summary('stair', 'steps', { steps: 15 }, { len }), ['v2.sum.steps', { n: 15 }]);
  assert.deepEqual(U.summary('stair', 'steps', {}, { len }), ['v2.sum.stepsAuto', {}]);
  assert.deepEqual(U.summary('stair', 'place', { x: 6.5, z: 3.9, rot: 90 }, { len }), ['v2.sum.where', { x: '6.50 m', z: '3.90 m', r: 90 }]);
  assert.equal(U.summary('stair', 'corner', {}, { len }), null);
  const hole = { points: [[0, 0], [2, 0], [2, 1.5], [0, 1.5]] };
  assert.deepEqual(U.summary('hole', 'form', hole, { len }), ['v2.sum.holeForm', { n: 4, a: '3.0 m²' }]);
  assert.deepEqual(U.summary('hole', 'form', hole, { len, area: (m2) => `${m2} qm` }), ['v2.sum.holeForm', { n: 4, a: '3 qm' }]);
  assert.deepEqual(U.summary('block', 'bsize', { h: 1.2 }, { len }), ['v2.sum.height', { h: '1.20 m' }]);
  assert.deepEqual(U.summary('block', 'bsize', {}, { len }), ['v2.sum.heightFloor', {}]);
});

test('5.7.0: the path of the plot and of a garden area has no floor (they are outside)', () => {
  assert.deepEqual(U.crumbs({ house: 'Haus', floor: 'EG', name: 'Grundstück', kind: 'plot' }).map((c) => c.text), ['🏠 Haus', 'Grundstück']);
  assert.deepEqual(U.crumbs({ house: 'Haus', floor: 'EG', name: 'Beet', kind: 'yard' }).map((c) => c.text), ['🏠 Haus', 'Beet']);
  assert.deepEqual(U.crumbs({ house: 'Haus', floor: 'EG', name: 'Treppe', kind: 'stair' }).map((c) => c.text), ['🏠 Haus', 'EG', 'Treppe']);
});

test('#753 / #754: a stair, a door and a window have a section „Aussehen“ that says what is set', () => {
  for (const pk of ['window', 'door', 'stair']) assert.ok(U.SECTIONS[pk].some(([k]) => k === 'look'), pk);
  assert.deepEqual(U.summary('door', 'look', { type: 'door' }), ['v2.sum.houseColors', {}]);
  assert.deepEqual(U.summary('window', 'look', { type: 'window', look: { frame: '#ffffff' } }), ['v2.sum.ownColors', {}]);
  assert.deepEqual(U.summary('stair', 'look', { covering: 'parquet' }), ['v2.sum.is', { x: { key: 'cover.parquet' } }]);
  assert.deepEqual(U.summary('stair', 'look', { rail: '#232528' }), ['v2.sum.ownColors', {}]);
  assert.equal(U.summary('stair', 'look', {}), null);
});
