// Unit tests for bridge.js (metal bridge, #189; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const B = await import(`${dir}/bridge.js`);

test('size: 3 x 1.2 m by default, limits kept', () => {
  assert.deepEqual(B.bridgeSize({}), { len: 3, width: 1.2, rise: 0 });
  assert.deepEqual(B.bridgeSize({ len: 4.5, w: 2 }), { len: 4.5, width: 2, rise: 0 });
  assert.deepEqual(B.bridgeSize({ len: 100, w: 0.1 }), { len: B.BRIDGE.maxLen, width: B.BRIDGE.minWidth, rise: 0 });
  assert.deepEqual(B.bridgeSize({ len: 'x', w: null }), { len: 3, width: 1.2, rise: 0 });
});
test('the deck is as long and wide as the bridge, its top at floor level, beams below', () => {
  const p = B.bridgeParts({ len: 4, w: 1.5 });
  const deck = p.find((x) => x.kind === 'deck');
  assert.equal(deck.w, 4); assert.equal(deck.d, 1.5); assert.ok(Math.abs(deck.y + deck.h) < 1e-9);
  const beams = p.filter((x) => x.kind === 'beam');
  assert.equal(beams.length, 2); assert.ok(beams.every((b) => b.y + b.h <= deck.y + 1e-9));
});
test('railing on both sides: posts about every metre, from end to end, a hand rail at 1 m', () => {
  const p = B.bridgeParts({ len: 3 });
  const posts = p.filter((x) => x.kind === 'post');
  assert.equal(posts.length, 8);                                     // 4 per side
  assert.deepEqual([...new Set(posts.map((x) => x.x))].sort((a, b) => a - b), [-1.5, -0.5, 0.5, 1.5]);
  assert.equal(p.filter((x) => x.kind === 'rail').length, 4);
  assert.ok(Math.abs(Math.max(...p.map((x) => x.y + x.h)) - B.BRIDGE.railH) < 1e-9);
});
test('without railing only deck and beams', () => {
  assert.deepEqual(B.bridgeParts({ noRail: true }).map((x) => x.kind), ['deck', 'beam', 'beam']);
});
test('height difference (#222): the far end that much higher, everything slopes evenly', () => {
  const p = B.bridgeParts({ len: 3, rise: 0.6 });
  const deck = p.find((x) => x.kind === 'deck');
  assert.ok(Math.abs(deck.tilt - Math.atan2(0.6, 3)) < 1e-9);
  assert.ok(Math.abs(deck.w - Math.hypot(3, 0.6)) < 1e-9);                  // the sloping deck is longer than the plan length
  const posts = p.filter((x) => x.kind === 'post').sort((a, b) => a.x - b.x);
  assert.ok(Math.abs(posts[0].y) < 1e-9 && Math.abs(posts[posts.length - 1].y - 0.6) < 1e-9);   // start at 0, far end 0.6 m up
  assert.ok(p.filter((x) => x.kind === 'rail').every((r) => Math.abs(r.tilt - deck.tilt) < 1e-9));
});
test('height difference (#222): lower is negative, limited to 3 m, none = flat as before', () => {
  assert.equal(B.bridgeSize({ rise: -0.4 }).rise, -0.4);
  assert.equal(B.bridgeSize({ rise: 9 }).rise, B.BRIDGE.maxRise);
  assert.equal(B.bridgeSize({}).rise, 0);
  assert.ok(B.bridgeParts({}).every((x) => !x.tilt));
});
