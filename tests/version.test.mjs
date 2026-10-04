// Unit tests for version.js (run: cp floorplan3d/rootfs/app/static/version.js /tmp/version.mjs && VERSION_MJS=/tmp/version.mjs node --test tests/version.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const V = await import(process.env.VERSION_MJS || '/tmp/version.mjs');

test('sha256 of known text', async () => {
  const buf = new TextEncoder().encode('abc').buffer;
  assert.equal(await V.sha256(buf), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('diffHashes lists changed and missing files, sorted', () => {
  const want = { 'b.js': '2', 'a.js': '1', 'c.js': '3' };
  assert.deepEqual(V.diffHashes(want, { 'a.js': '1', 'b.js': 'x' }), ['b.js', 'c.js']);
  assert.deepEqual(V.diffHashes(want, { 'a.js': '1', 'b.js': '2', 'c.js': '3' }), []);
});
test('extra files on the browser side do not count', () => {
  assert.deepEqual(V.diffHashes({ 'a.js': '1' }, { 'a.js': '1', 'z.js': '9' }), []);
});

test('sha256Js matches crypto.subtle (empty, short, block borders, large random data)', async () => {
  const web = async (u8) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', u8))].map((b) => b.toString(16).padStart(2, '0')).join('');
  assert.equal(V.sha256Js(new Uint8Array(0).buffer), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(V.sha256Js(new TextEncoder().encode('abc').buffer), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  for (const n of [1, 55, 56, 63, 64, 65, 119, 120, 1000, 300001]) {
    const u8 = new Uint8Array(n); for (let i = 0; i < n; i++) u8[i] = (i * 31 + n) & 255;
    assert.equal(V.sha256Js(u8.buffer), await web(u8), `length ${n}`);
  }
});
test('updateAvailable: only when GitHub is newer', () => {
  assert.equal(V.updateAvailable({ state: 'behind', version: '9.9.9' }), true);
  for (const state of ['same', 'differs', 'unreachable']) assert.equal(V.updateAvailable({ state }), false);
  assert.equal(V.updateAvailable(null), false);
});
