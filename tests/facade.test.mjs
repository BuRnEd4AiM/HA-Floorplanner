// Unit tests for facade.js (window frames and walls, #428; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const F = await import(`${dir}/facade.js`);

test('white window frames and the walls as always, unless anthracite is chosen', () => {
  assert.deepEqual(F.facadeOf({}), { frame: '#f4f4f4', wall: '#d9d4cc' });
  assert.deepEqual(F.facadeOf({ windowFrames: 'white' }), F.FACADES.white);
  assert.deepEqual(F.facadeOf({ windowFrames: 'pink' }), F.FACADES.white);
  assert.deepEqual(F.facadeOf(null), F.FACADES.white);
  assert.deepEqual(F.FACADE_KEYS, ['white', 'anthracite']);
});

test('anthracite: dark frames and lighter walls', () => {
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ((n >> 8) & 255) + (n & 255); };
  const a = F.facadeOf({ windowFrames: 'anthracite' });
  assert.ok(lum(a.frame) < lum(F.FACADES.white.frame) / 3, 'the frames are dark');
  assert.ok(lum(a.wall) > lum(F.FACADES.white.wall), 'the walls are lighter');
});
