// Unit tests for voiceaudio.js (the 🎤 of the voice search for Home Assistant's Assist, #509; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const A = await import(`${process.env.STATIC_DIR || '/tmp/static'}/voiceaudio.js`);

test('toPcm16: 48 kHz floats -> 16 kHz 16-bit, the mean of three', () => {
  const f = new Float32Array([0, 0.3, 0.6, 1, 1, 1, -1, -1, -1, 0.5]);
  const p = A.toPcm16(f, 48000);
  assert.equal(p.length, 3);                                   // the last odd sample is left over
  assert.deepEqual([...p], [Math.round(0.3 * 0x7fff), 0x7fff, -0x8000]);
  assert.equal(A.toPcm16(new Float32Array(16000), 16000).length, 16000);
  assert.deepEqual([...A.toPcm16(new Float32Array([2, -2]), 16000)], [0x7fff, -0x8000]);   // clipped
  assert.equal(A.toPcm16(new Float32Array(441), 44100).length, 160);
});

test('joinPcm and loudness', () => {
  assert.deepEqual([...A.joinPcm([new Int16Array([1, 2]), new Int16Array([]), new Int16Array([3])])], [1, 2, 3]);
  assert.equal(A.loudness(new Float32Array([])), 0);
  assert.equal(A.loudness(new Float32Array([0.5, -0.5])), 0.5);
});

test('step: speech, then a pause ends it; nobody speaks; too long', () => {
  let s = A.listener(0);
  assert.equal(A.step(s, 0.004, 100), 'go');                   // the room's noise
  assert.equal(A.step(s, 0.1, 300), 'go');                     // speech
  assert.ok(s.heard);
  assert.equal(A.step(s, 0.005, 500), 'go');                   // quiet again ...
  assert.equal(A.step(s, 0.2, 900), 'go');                     // ... a short pause between words
  assert.equal(s.quiet, null);
  assert.equal(A.step(s, 0.005, 1000), 'go');
  assert.equal(A.step(s, 0.005, 1000 + A.PAUSE_MS), 'done');
  s = A.listener(0);
  assert.equal(A.step(s, 0.01, 3000), 'go');
  assert.equal(A.step(s, 0.012, A.WAIT_MS), 'nothing');
  s = A.listener(0);
  A.step(s, 0.01, 10);
  assert.equal(A.step(s, 0.025, 20), 'go'); assert.ok(!s.heard);   // louder than 0.02 but not three times the noise
  s = A.listener(0);
  A.step(s, 0.3, 10);
  assert.equal(A.step(s, 0.3, A.MAX_MS), 'done');               // talks on and on
});
