// Unit tests for phonemenu.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/phonemenu.js`);

test('a touch screen held upright or sideways is a phone', () => {
  assert.equal(P.isPhoneScreen({ coarse: true, w: 390, h: 844 }), true);
  assert.equal(P.isPhoneScreen({ coarse: true, w: 844, h: 390 }), true);
});

test('tablets and narrow desktop windows are no phone', () => {
  assert.equal(P.isPhoneScreen({ coarse: true, w: 1024, h: 768 }), false);
  assert.equal(P.isPhoneScreen({ coarse: false, w: 390, h: 844 }), false);
  assert.equal(P.isPhoneScreen({ coarse: undefined, w: 390, h: 844 }), false);
});

test('phones always live and 3D, other screens keep their choice', () => {
  assert.deepEqual(P.phoneView(true, { mode: 'edit', layoutMode: 'split' }), { mode: 'live', layoutMode: '3d' });
  assert.deepEqual(P.phoneView(false, { mode: 'edit', layoutMode: 'split' }), { mode: 'edit', layoutMode: 'split' });
});
