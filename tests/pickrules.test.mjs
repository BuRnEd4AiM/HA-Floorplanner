// Unit tests for pickrules.js (what a tap in the live mode may hit, #234; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/pickrules.js`);

test('live mode: presence figures, camera cones, doors and windows take no tap', () => {
  assert.ok(P.skipInLive({ kind: 'device', id: 'p' }, 'presence'));
  assert.ok(P.skipInLive({ kind: 'device', id: 'c', cone: true }, 'camera'));
  assert.ok(P.skipInLive({ kind: 'opening', id: 'o' }));
});
test('live mode: the camera itself, lamps and rooms can still be tapped', () => {
  assert.ok(!P.skipInLive({ kind: 'device', id: 'c' }, 'camera'));
  assert.ok(!P.skipInLive({ kind: 'device', id: 'l' }, 'light'));
  assert.ok(!P.skipInLive({ kind: 'room', id: 'r' }));
  assert.ok(!P.skipInLive(null));
});
