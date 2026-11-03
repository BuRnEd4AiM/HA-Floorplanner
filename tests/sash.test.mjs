// Unit tests for sash.js: the sash of a window pane that opens, four bars round its glass and a handle on the room side across from the
// hinge (4.64.0, #624: a tilted window should show more) (run like offline.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/sash.js`);
const near = (a, b) => Math.abs(a - b) < 1e-9;
const box = (p) => ({ x0: p.x - p.w / 2, x1: p.x + p.w / 2, y0: p.y - p.h / 2, y1: p.y + p.h / 2, z0: p.z - p.d / 2, z1: p.z + p.d / 2 });

test('four bars lie on the edge of the glass, inside it, and the handle after them', () => {
  const parts = S.sashParts({ x0: 0, x1: 1, y0: 0, y1: 1.3, hingeAt: 'x0', room: 1 });
  assert.equal(parts.length, 6);
  const bars = parts.slice(0, 4).map(box);
  bars.forEach((b) => assert.ok(b.x0 >= -1e-9 && b.x1 <= 1 + 1e-9 && b.y0 >= -1e-9 && b.y1 <= 1.3 + 1e-9, 'inside the glass'));
  assert.ok(near(bars[0].y1, 1.3) && near(bars[1].y0, 0) && near(bars[2].x0, 0) && near(bars[3].x1, 1), 'on its edges');
  assert.ok(near(bars[0].x1 - bars[0].x0, 1) && near(bars[2].y1 - bars[2].y0, 1.3 - 2 * S.SASH_BAR), 'the side bars between top and bottom');
  bars.forEach((b) => assert.ok(near(b.z0, -S.SASH_DEPTH / 2) && near(b.z1, S.SASH_DEPTH / 2)));
});

test('the handle sits across from the hinge, in the middle of that bar, on the room side', () => {
  const handle = (o) => S.sashParts(o).slice(4).map(box);
  const [l0] = handle({ x0: 0, x1: 1, y0: 0, y1: 1.2, hingeAt: 'x0', room: 1 });
  assert.ok(l0.x1 > 0.9 && near((l0.y0 + l0.y1) / 2, 0.6) && l0.z0 > S.SASH_DEPTH / 2 - 1e-9, 'hinge left: handle right, room +z');
  const [r0] = handle({ x0: -1, x1: 0, y0: 0, y1: 1.2, hingeAt: 'x1', room: -1 });
  assert.ok(r0.x0 < -0.9 && r0.z1 < -S.SASH_DEPTH / 2 + 1e-9, 'hinge right: handle left, room −z');
  const [b0, lever] = handle({ x0: 0, x1: 1, y0: 0, y1: 1.2, hingeAt: 'y0', room: 1 });
  assert.ok(b0.y1 > 1.1 && near((b0.x0 + b0.x1) / 2, 0.5), 'a tilt window (hinge at the bottom): handle at the top in the middle');
  assert.ok(lever.x1 - lever.x0 > lever.y1 - lever.y0, '… its lever lies along the top bar');
  const [t0] = handle({ x0: 0, x1: 0.8, y0: -1.2, y1: 0, hingeAt: 'y1', room: 1 });
  assert.ok(t0.y0 < -1.1, 'a roof window (hinge at the top): handle at the bottom');
});

test('a narrow pane gets narrower bars, a tiny one none', () => {
  const thin = S.sashParts({ x0: 0, x1: 0.3, y0: 0, y1: 1, hingeAt: 'x0' });
  assert.ok(near(thin[2].w, 0.3 * 0.15), 'at most 15 % of the pane');
  assert.deepEqual(S.sashParts({ x0: 0, x1: 0.1, y0: 0, y1: 1 }), []);
  assert.deepEqual(S.sashParts({ x0: 0, x1: 1, y0: 0, y1: NaN }), []);
});
