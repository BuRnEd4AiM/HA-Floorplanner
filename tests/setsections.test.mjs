// Unit tests for setsections.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/setsections.js`);

test('the page shown: the remembered one while it is there, else the first', () => {
  assert.equal(S.pickPage('car', ['today', 'car']), 'car');
  assert.equal(S.pickPage('gone', ['today', 'car']), 'today');
  assert.equal(S.pickPage(null, []), null);
});
test('a page button is its heading without what follows a colon', () => {
  assert.equal(S.pageLabel('🎵 Musik & TV: Radiosender'), '🎵 Musik & TV');
  assert.equal(S.pageLabel('☀ Heute'), '☀ Heute');
  assert.equal(S.pageLabel('🎵 音乐：电台'), '🎵 音乐');
  assert.equal(S.pageLabel(undefined), '');
});
test('warnings: on or off', () => {
  assert.equal(S.warnState(true).badge, 'on');
  assert.equal(S.warnState(false).badge, 'off');
});
test('holiday alarm: nothing known yet, not an editor, not ready, off, armed, going off', () => {
  assert.equal(S.guardState(null), null);
  assert.deepEqual(S.guardState({ ready: 'sensors' }), { edit: false, badge: '' });
  const cfg = { sensors: ['a', 'b', 'c'], hasCode: true, delay: 20 };
  assert.deepEqual(S.guardState({ cfg: { sensors: [], hasCode: false, delay: 20 }, ready: 'sensors', view: { phase: 'off' } }),
    { edit: true, badge: 'notReady', sensors: 0, code: false, delay: 20 });
  assert.deepEqual(S.guardState({ cfg, ready: null, view: { phase: 'off' } }), { edit: true, badge: 'off', sensors: 3, code: true, delay: 20 });
  assert.equal(S.guardState({ cfg, view: { phase: 'arming' } }).badge, 'armed');
  assert.equal(S.guardState({ cfg, view: { phase: 'armed' } }).badge, 'armed');
  assert.equal(S.guardState({ cfg, view: { phase: 'entry' } }).badge, 'alarm');
  assert.equal(S.guardState({ cfg, view: { phase: 'alarm' } }).badge, 'alarm');
});
test('message to the phone: not an editor, on, off, something missing', () => {
  assert.equal(S.notifyState(null), null);
  assert.deepEqual(S.notifyState({ via: 'telegram', ready: null }), { badge: 'on', via: 'telegram', missing: '' });
  assert.deepEqual(S.notifyState({ ready: 'off' }), { badge: 'off', via: 'whatsapp', missing: '' });
  assert.deepEqual(S.notifyState({ via: 'whatsapp', ready: 'apikey' }), { badge: 'notReady', via: 'whatsapp', missing: 'apikey' });
});
test('every badge has a look', () => {
  ['on', 'off', 'notReady', 'armed', 'alarm', 'disarmed'].forEach((b) => assert.ok(S.BADGE_CLASS[b], b));
});
