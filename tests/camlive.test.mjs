// Unit tests for camlive.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/camlive.js`);

test('live picture (#383): it played and broke off: straight on, the count of failed tries starts again', () => {
  assert.deepEqual(L.liveNext({ played: true, fails: 2 }), { wait: 1000, fails: 0 });
});
test('live picture: tries that never play wait longer, the third one gives up for still images', () => {
  assert.deepEqual(L.liveNext({ status: 502, fails: 0 }), { wait: 2000, fails: 1 });
  assert.deepEqual(L.liveNext({ status: 0, fails: 1 }), { wait: 4000, fails: 2 });
  assert.deepEqual(L.liveNext({ fails: L.LIVE_TRIES - 1 }), { still: true, fails: L.LIVE_TRIES });
});
test('live picture: switched off, locked or a camera without stream: still images at once', () => {
  for (const status of [403, 404]) assert.equal(L.liveNext({ status, fails: 0 }).still, true);
  assert.equal(L.liveNext({ status: 404, played: true }).still, true);
});
test('play way: hls.js where it works, else the browser itself (Safari), else none', () => {
  assert.equal(L.playWay({ hlsJs: true, native: true }), 'hls');
  assert.equal(L.playWay({ hlsJs: false, native: true }), 'native');
  assert.equal(L.playWay({ hlsJs: false, native: false }), null);
});
test('hls.js settings: no worker (the module build has none), low latency, Home Assistant\'s long timeouts', () => {
  assert.equal(L.HLS_CONFIG.enableWorker, false);
  assert.equal(L.HLS_CONFIG.lowLatencyMode, true);
  assert.ok(L.HLS_CONFIG.manifestLoadingTimeOut >= 30000 && L.HLS_CONFIG.fragLoadingTimeOut >= 30000);
  assert.ok(Object.isFrozen(L.HLS_CONFIG));
});
