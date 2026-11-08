// Unit tests for windowpanes.js (#606): the panes of a window, their hinges and the rows of the room panel (run like offline.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const W = await import(`${dir}/windowpanes.js`);

test('the panes of a window: its style, or a number set in its properties (1 .. 8); fixed glazing has one, a door none', () => {
  assert.equal(W.windowPanes({ type: 'window' }), 2, 'no style: double');
  assert.equal(W.windowPanes({ type: 'window', style: 'single' }), 1);
  assert.equal(W.windowPanes({ type: 'window', style: 'triple' }), 3);
  assert.equal(W.windowPanes({ type: 'window', style: 'fixed' }), 1);
  assert.equal(W.windowPanes({ type: 'window', panes: 5 }), 5);
  assert.equal(W.windowPanes({ type: 'window', style: 'single', panes: 4 }), 4, 'the number overrides the style');
  assert.equal(W.windowPanes({ type: 'window', style: 'fixed', panes: 4 }), 1, 'fixed glazing keeps one pane');
  assert.equal(W.windowPanes({ type: 'window', panes: 9 }), 2, 'out of range: the style counts');
  assert.equal(W.windowPanes({ type: 'window', style: 'triple', panes: 0 }), 3);
  assert.equal(W.windowPanes({ type: 'window', panes: 2.6 }), 3, 'whole panes');
  assert.equal(W.windowPanes({ type: 'door', panes: 3 }), 0);
  assert.equal(W.windowPanes(null), 0);
  assert.equal(W.stylePanes('triple'), 3);
  assert.equal(W.stylePanes(undefined), 2);
  assert.equal(W.windowPanes({ type: 'window', style: 'double', panes: '4' }), 2, 'a text is no number of panes');
  assert.equal(W.windowPanes({ type: 'window', style: 'double', panes: true }), 2);
});

test('every pane of a window can swing around its own edge, with the window setting as the default', () => {
  const o = { type: 'window', paneHinges: ['left', 'right', 'top'] };
  assert.equal(W.paneHinge(o, 0), 'left');
  assert.equal(W.paneHinge(o, 1), 'right');
  assert.equal(W.paneHinge(o, 2), 'top');
  assert.equal(W.paneHinge({ type: 'window', hinge: 'right' }, 1), 'right', 'the window default');
  assert.equal(W.paneHinge({ type: 'window' }, 0), 'bottom', 'older layouts: bottom');
  assert.equal(W.paneHinge({ type: 'window', paneHinges: ['left'], hinge: 'top' }, 1), 'top', 'a missing entry: the default');
  assert.equal(W.paneHinge({ type: 'window', paneHinges: ['nope'], hinge: 'top' }, 0), 'top', 'an invalid entry: the default');
  assert.equal(W.paneHinge({ type: 'window', paneHinges: 'left' }, 0), 'bottom', 'not an array');
  assert.equal(W.paneHinge({ type: 'window', paneHinges: ['left', 'fixed', 'right'] }, 1), 'fixed', 'one pane can be fixed');
  assert.equal(W.paneHinge({ type: 'window', hinge: 'fixed' }, 0), 'bottom', 'the whole window is never fixed this way (that is the style)');
  assert.deepEqual(W.WINDOW_HINGES, ['bottom', 'top', 'left', 'right']);
  assert.deepEqual(W.PANE_HINGES, ['bottom', 'top', 'left', 'right', 'fixed']);
});

test('the room panel lists every pane with contacts of its own, also more than three (#606)', () => {
  assert.equal(W.contactRows({ type: 'window', entity: 'binary_sensor.a' }), 1, 'no pane contacts: one row');
  assert.equal(W.contactRows({ type: 'window', paneEntities: ['', ''] }), 1, 'empty pane contacts: one row');
  assert.equal(W.contactRows({ type: 'window', style: 'triple', paneEntities: ['binary_sensor.a'] }), 3);
  assert.equal(W.contactRows({ type: 'window', panes: 4, paneEntities: ['binary_sensor.a', '', '', 'binary_sensor.d'] }), 4, 'four panes: four rows');
  assert.equal(W.contactRows({ type: 'window', panes: 8, paneEntities: ['binary_sensor.a'] }), 8);
  assert.equal(W.contactRows({ type: 'window', style: 'fixed', paneEntities: ['binary_sensor.a'] }), 1);
  assert.equal(W.contactRows({ type: 'door', entity: 'binary_sensor.d' }), 1);
  assert.equal(W.contactRows({ type: 'window', style: 'triple', paneEntities: 'bad' }), 1, 'broken data: one row');
});

test('fixed glass below / above the panes that open (#679): its height, cut to what fits, none for fixed glazing or a door', () => {
  const tall = { type: 'window', style: 'single', height: 2.2, sill: 0 };
  assert.deepEqual(W.fixedGlass(tall), { below: 0, above: 0 }, 'none set: none');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedBelow: 1.1 }), { below: 1.1, above: 0 }, 'the window of the issue: 0 .. 1.10 m fixed');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedAbove: 0.45 }), { below: 0, above: 0.45 }, 'a transom');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedBelow: 1, fixedAbove: 0.5 }), { below: 1, above: 0.5 }, 'both');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedBelow: 2.1 }), { below: 1.9, above: 0 }, 'the panes keep 30 cm');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedBelow: 1.5, fixedAbove: 0.6 }), { below: 1.5, above: 0.4 }, 'below first, then above');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedBelow: 1.8, fixedAbove: 0.6 }), { below: 1.8, above: 0 }, 'too little left above: none');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedBelow: 0.1 }), { below: 0, above: 0 }, 'less than 20 cm: none');
  assert.deepEqual(W.fixedGlass({ ...tall, height: 0.45, fixedBelow: 0.3 }), { below: 0, above: 0 }, 'a small window has no room for it');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedBelow: 1.104 }), { below: 1.1, above: 0 }, 'whole cm');
  assert.deepEqual(W.fixedGlass({ ...tall, style: 'fixed', fixedBelow: 1.1 }), { below: 0, above: 0 }, 'fixed glazing is one pane');
  assert.deepEqual(W.fixedGlass({ type: 'door', height: 2.1, fixedAbove: 0.4 }), { below: 0, above: 0 }, 'a door has none');
  assert.deepEqual(W.fixedGlass({ ...tall, fixedBelow: '1.1', fixedAbove: -1 }), { below: 0, above: 0 }, 'broken data: none');
  assert.deepEqual(W.fixedGlass(null), { below: 0, above: 0 });
  assert.equal(W.canFixGlass({ type: 'window' }), true, 'no style: a double window');
  assert.equal(W.canFixGlass({ type: 'window', style: 'fixed' }), false);
});

test('setting the fixed glass: whole cm, 0 or too little removes it, more than fits is cut (#679)', () => {
  const o = { type: 'window', style: 'single', height: 2.2, sill: 0 };
  assert.equal(W.setFixedGlass(o, 'fixedBelow', 1.1), 1.1);
  assert.equal(o.fixedBelow, 1.1);
  assert.equal(W.setFixedGlass(o, 'fixedAbove', '0.333'), 0.33, 'a text from the field, whole cm');
  assert.equal(o.fixedAbove, 0.33);
  assert.equal(W.setFixedGlass(o, 'fixedAbove', 5), 0.8, 'cut to what fits beside the glass below');
  assert.equal(o.fixedAbove, 0.8);
  assert.equal(W.setFixedGlass(o, 'fixedAbove', 0), 0);
  assert.ok(!('fixedAbove' in o), '0 removes it');
  assert.equal(W.setFixedGlass(o, 'fixedBelow', 0.15), 0);
  assert.ok(!('fixedBelow' in o), 'less than 20 cm removes it');
  assert.equal(W.setFixedGlass(o, 'fixedBelow', ''), 0, 'an empty field removes it');
  assert.equal(W.setFixedGlass(o, 'fixedBelow', 9), 1.9, 'the panes keep 30 cm');
  o.fixedAbove = 0.5;
  assert.equal(W.setFixedGlass(o, 'fixedAbove', 0.5), 0, 'no room left above: removed');
  assert.ok(!('fixedAbove' in o));
  assert.equal(W.setFixedGlass(o, 'nope', 1), 0, 'only the two keys');
  assert.ok(!('nope' in o));
  const fixed = { type: 'window', style: 'fixed', height: 2.2 };
  assert.equal(W.setFixedGlass(fixed, 'fixedBelow', 1), 0);
  assert.ok(!('fixedBelow' in fixed), 'fixed glazing gets none');
});

test('the parts of a window from bottom to top: fixed glass, bars, the panes that open (#679)', () => {
  const ft = 0.05, o = { type: 'window', style: 'single', height: 2.2, sill: 0 };
  assert.deepEqual(W.glassBands(o, ft), { lo: null, hi: null, sash: [ft, 2.2 - ft], bars: [] }, 'no fixed glass: the panes as before');
  const b = W.glassBands({ ...o, fixedBelow: 1.1 }, ft);
  assert.deepEqual(b.lo, [ft, 1.1 - ft / 2]);
  assert.equal(b.hi, null);
  assert.deepEqual(b.sash, [1.1 + ft / 2, 2.2 - ft]);
  assert.deepEqual(b.bars, [1.1]);
  const both = W.glassBands({ ...o, fixedBelow: 0.8, fixedAbove: 0.5 }, ft);
  assert.deepEqual(both.lo, [ft, 0.8 - ft / 2]);
  assert.ok(Math.abs(both.hi[0] - (1.7 + ft / 2)) < 1e-9 && Math.abs(both.hi[1] - (2.2 - ft)) < 1e-9, JSON.stringify(both.hi));
  assert.ok(Math.abs(both.sash[0] - (0.8 + ft / 2)) < 1e-9 && Math.abs(both.sash[1] - (1.7 - ft / 2)) < 1e-9, JSON.stringify(both.sash));
  assert.deepEqual(both.bars, [0.8, 1.7]);
  for (const [below, above] of [[0.2, 0], [0, 0.2], [1.9, 0], [1.5, 0.4], [0.2, 0.2]]) {   // every part has a height, the panes keep theirs
    const g = W.glassBands({ ...o, fixedBelow: below, fixedAbove: above }, ft);
    [g.lo, g.hi, g.sash].filter(Boolean).forEach(([y0, y1]) => assert.ok(y1 > y0, JSON.stringify({ below, above, g })));
    assert.ok(g.sash[1] - g.sash[0] >= W.SASH_MIN - 1.5 * ft - 1e-9, JSON.stringify({ below, above, g }));   // less half a bar and the frame
  }
});
