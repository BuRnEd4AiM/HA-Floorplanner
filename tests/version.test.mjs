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
