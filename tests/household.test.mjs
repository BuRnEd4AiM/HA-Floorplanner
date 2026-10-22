// Unit tests for household.js (the page 🧺 Haushalt of the tab bar, #490; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const H = await import(`${process.env.STATIC_DIR || '/tmp/static'}/household.js`);
const NOW = Date.parse('2026-10-22T12:00:00Z');
const at = (min) => new Date(NOW + min * 60000).toISOString();

test('a running machine: the program, when it ends, the minutes left and how far it is', () => {
  const v = H.applianceView({ kind: 'washer', phase: 'running', since: at(-60), endsAt: at(42), program: 'Baumwolle 40°', progress: null }, NOW);
  assert.equal(v.tone, 'running');
  assert.deepEqual(v.line, [{ key: 'hh.program', vars: { p: 'Baumwolle 40°' } }, { key: 'hh.endsAt', vars: { at: at(42) } }]);
  assert.deepEqual(v.right, { key: 'hh.left', vars: { n: 42 } });
  assert.equal(v.bar, 59); assert.equal(v.ack, false);
  assert.equal(H.applianceView({ kind: 'washer', phase: 'running', since: at(-5), progress: 61 }, NOW).bar, 61);
  const p = H.applianceView({ kind: 'dryer', phase: 'running', since: at(-5) }, NOW);
  assert.deepEqual(p.line, [{ key: 'hh.since', vars: { at: at(-5) } }]); assert.deepEqual(p.right, { key: 'hh.runningShort' }); assert.equal(p.bar, null);
  assert.deepEqual(H.applianceView({ kind: 'dryer', phase: 'running' }, NOW).line, [{ key: 'hh.running' }]);
});

test('done waits for "Ausgeräumt"; off says when it last ran; waiting, error and gone', () => {
  const d = H.applianceView({ kind: 'dishwasher', phase: 'done', since: at(-30) }, NOW);
  assert.equal(d.tone, 'done'); assert.equal(d.badge, 'hh.badgeDone'); assert.equal(d.ack, true); assert.equal(d.right, null);
  assert.deepEqual(d.line, [{ key: 'hh.doneSince', vars: { at: at(-30) } }, { key: 'hh.empty' }]);
  const o = H.applianceView({ kind: 'dryer', phase: 'off', since: at(-1000) }, NOW);
  assert.deepEqual([o.tone, o.line, o.right], ['off', [{ key: 'hh.last', vars: { at: at(-1000) } }], { key: 'hh.off' }]);
  assert.deepEqual(H.applianceView({ kind: 'dryer', phase: 'off' }, NOW).line, []);
  assert.deepEqual(H.applianceView({ kind: 'washer', phase: 'waiting', state: 'DelayedStart' }, NOW).line, [{ key: 'hh.state', vars: { s: 'DelayedStart' } }]);
  assert.equal(H.applianceView({ kind: 'washer', phase: 'error' }, NOW).badge, 'hh.badgeError');
  assert.deepEqual(H.applianceView({ kind: 'washer', phase: 'gone' }, NOW).line, [{ key: 'hh.gone' }]);
  assert.equal(H.doneCount([{ phase: 'done' }, { phase: 'off' }, { phase: 'done' }]), 2); assert.equal(H.doneCount(null), 0);
});

test('times: minutes left, today / yesterday / another day', () => {
  assert.equal(H.minutesLeft(at(0.5), NOW), 1); assert.equal(H.minutesLeft(at(-1), NOW), null); assert.equal(H.minutesLeft(null, NOW), null);
  assert.equal(H.dayOf(at(-60), NOW), 'today'); assert.equal(H.dayOf(at(-24 * 60), NOW), 'yesterday'); assert.equal(H.dayOf(at(-5 * 24 * 60), NOW), 'date');
  assert.equal(H.dayOf('junk', NOW), null);
});

test('robot vacuums, whether the page has something, a new item of the list', () => {
  const st = { 'vacuum.robo': { state: 'docked', bat: 99.6, name: 'Saugroboter' }, 'vacuum.b': { state: 'cleaning' }, 'light.x': { state: 'on' } };
  assert.deepEqual(H.vacuums(st, { 'vacuum.b': 'Akku-Bot' }), [{ entity: 'vacuum.b', name: 'Akku-Bot', state: 'cleaning', battery: null },
    { entity: 'vacuum.robo', name: 'Saugroboter', state: 'docked', battery: 100 }]);
  assert.equal(H.hasHousehold(st, []), true); assert.equal(H.hasHousehold({ 'todo.einkauf': {} }, []), true);
  assert.equal(H.hasHousehold({ 'light.x': {} }, [{ kind: 'washer' }]), true); assert.equal(H.hasHousehold({ 'light.x': {} }, []), false);
  assert.equal(H.cleanItem('  Milch\n 2 l '), 'Milch 2 l'); assert.equal(H.cleanItem(' '), ''); assert.equal(H.cleanItem(5), '');
  assert.equal(H.cleanItem('x'.repeat(300)).length, 200);
});
