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
  assert.equal(W.stylePanes({ style: 'triple' }), 3);
  assert.equal(W.stylePanes({}), 2);
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
  assert.deepEqual(W.WINDOW_HINGES, ['bottom', 'top', 'left', 'right']);
});

test('the room panel lists every pane with contacts of its own, also more than three (#606)', () => {
  assert.equal(W.contactRows({ type: 'window', entity: 'binary_sensor.a' }), 1, 'no pane contacts: one row');
  assert.equal(W.contactRows({ type: 'window', paneEntities: ['', ''] }), 1, 'empty pane contacts: one row');
  assert.equal(W.contactRows({ type: 'window', style: 'triple', paneEntities: ['binary_sensor.a'] }), 3);
  assert.equal(W.contactRows({ type: 'window', panes: 4, paneEntities: ['binary_sensor.a', '', '', 'binary_sensor.d'] }), 4, 'four panes: four rows');
  assert.equal(W.contactRows({ type: 'window', panes: 8, paneEntities: ['binary_sensor.a'] }), 8);
  assert.equal(W.contactRows({ type: 'window', style: 'fixed', paneEntities: ['binary_sensor.a'] }), 1);
  assert.equal(W.contactRows({ type: 'door', entity: 'binary_sensor.d' }), 1);
});
