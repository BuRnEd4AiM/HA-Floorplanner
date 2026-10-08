// Unit tests for phonestatus.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/phonestatus.js`);

test('nothing shown: no button', () => {
  assert.equal(P.phoneStatusModel([{ hidden: true, alert: false }, { hidden: true, alert: true }]).show, false);
  assert.equal(P.phoneStatusModel([]).show, false);
});

test('values without warnings: the plain button', () => {
  const m = P.phoneStatusModel([{ hidden: false, alert: false }, { hidden: true, alert: false }]);
  assert.deepEqual(m, { show: true, alerts: 0, label: '📊' });
});

test('warnings are counted, hidden pills are not', () => {
  const m = P.phoneStatusModel([{ hidden: false, alert: true }, { hidden: false, alert: true }, { hidden: true, alert: true }, { hidden: false, alert: false }]);
  assert.equal(m.alerts, 2);
  assert.equal(m.label, '⚠️ 2');
});

test('the five values of the top bar are folded', () => {
  assert.deepEqual(P.STATUS_PILLS, ['energyPill', 'meterPill', 'offlinePill', 'openPill', 'camPill']);
});
