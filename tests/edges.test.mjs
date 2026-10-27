// Unit tests for edges.js (how the edges of the 3D picture are smoothed, #560; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const E = await import(`${process.env.STATIC_DIR || '/tmp/static'}/edges.js`);

test('the mode: the address wins, then this browser, else as before (smooth, off in the low-power mode)', () => {
  assert.equal(E.edgeMode('fxaa', 'still', false), 'fxaa');
  assert.equal(E.edgeMode(null, 'still', true), 'still');
  assert.equal(E.edgeMode('nonsense', null, false), 'msaa');
  assert.equal(E.edgeMode(null, null, true), 'off');
  assert.ok(E.canvasSmooth('msaa'));
  for (const m of ['still', 'fxaa', 'auto', 'off']) assert.ok(!E.canvasSmooth(m), m);
});
test('the way a frame is drawn', () => {
  assert.equal(E.framePath('msaa', true, false), 'direct');            // the canvas smooths by itself
  assert.equal(E.framePath('off', false, false), 'direct');
  assert.equal(E.framePath('fxaa', true, false), 'fxaa');
  assert.equal(E.framePath('still', true, false), 'direct');           // turning: fast
  assert.equal(E.framePath('still', false, false), 'smooth');          // standing: smooth
  assert.equal(E.framePath('auto', true, false), 'smooth');            // the graphics keeps up (or is not measured yet)
  assert.equal(E.framePath('auto', true, true), 'direct');             // too slow: like still
  assert.equal(E.framePath('auto', false, true), 'smooth');
});
test('the camera stands when it moves less than about half a pixel per frame', () => {
  const at = (x, ang) => ({ p: [x, 5, 10], q: [0, Math.sin(ang / 2), 0, Math.cos(ang / 2)] });
  assert.equal(E.cameraStep(null, at(0, 0), 10), Infinity);
  assert.ok(E.cameraStep(at(0, 0), at(0, 0), 10) < E.STILL_STEP);
  assert.ok(E.cameraStep(at(0, 0), at(0, 0.0001), 10) < E.STILL_STEP);    // the slow end of the glide
  assert.ok(E.cameraStep(at(0, 0), at(0, 0.01), 10) > E.STILL_STEP);      // turning
  assert.ok(E.cameraStep(at(0, 0), at(0.05, 0), 10) > E.STILL_STEP);      // shifted (or zoomed) by 5 cm at 10 m
  assert.ok(E.cameraStep(at(0, 0), at(0.002, 0), 10) < E.STILL_STEP);
});
test('weak graphics: fewer than 45 frames a second while the camera moves', () => {
  assert.equal(E.weakGraphics([]), null);
  assert.equal(E.weakGraphics(Array(E.WEAK_FRAMES - 1).fill(33)), null);
  assert.equal(E.weakGraphics(Array(E.WEAK_FRAMES).fill(33.3)), true);     // 30 frames
  assert.equal(E.weakGraphics(Array(E.WEAK_FRAMES).fill(16.7)), false);    // 60 frames
  assert.equal(E.weakGraphics([...Array(15).fill(16.7), ...Array(5).fill(60)]), false);   // a few slow frames are not enough
  assert.equal(E.weakGraphics([...Array(30).fill(33), ...Array(E.WEAK_FRAMES).fill(7)]), false);   // only the latest count
});
