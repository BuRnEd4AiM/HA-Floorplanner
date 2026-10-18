// Unit tests for floorcover.js (floor coverings, #427, more of them with colour, size and angle in #448; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const C = await import(`${dir}/floorcover.js`);
const F = await import(`${dir}/finishes.js`);

test('the coverings: every pattern offered for floors, the old ones first', () => {
  assert.deepEqual(C.COVERING_KEYS.slice(0, 3), ['parquet', 'parquetLight', 'parquetDark']);
  for (const k of ['tiles', 'tilesSmall', 'tilesDark', 'concrete', 'herringbone', 'marble', 'carpet', 'cobble']) assert.ok(C.COVERING_KEYS.includes(k), k);
  assert.ok(!C.COVERING_KEYS.includes('woodchip'), 'no woodchip on the floor');
  const small = C.floorFinish({ covering: 'tilesSmall' }), big = C.floorFinish({ covering: 'tiles' });
  assert.ok(small.size < big.size, 'small tiles are smaller');
});

test('only a known covering is kept', () => {
  assert.equal(C.cleanCovering('tiles'), 'tiles');
  for (const v of ['marble2', 'woodchip', '', null, undefined, 3, 'toString', '__proto__']) assert.equal(C.cleanCovering(v), undefined, String(v));
});

test('the finish of a floor: the covering with the changes of the room (colour, joints, size, angle)', () => {
  const f = C.floorFinish({ covering: 'tiles', floorLook: { color: '#112233', color2: '#ffffff', size: 0.6, angle: 45, junk: 1 } });
  assert.equal(f.key, 'tiles'); assert.equal(f.color, '#112233'); assert.equal(f.color2, '#ffffff'); assert.equal(f.size, 0.6); assert.equal(f.angle, 45);
  assert.equal(C.floorFinish({ floorLook: { color: '#112233' } }), null, 'a look without a covering is one colour');
  assert.equal(C.floorFinish({ covering: 'parquet', floorLook: 'x' }).color, F.PATTERNS.parquet.color);
});

test('the pattern is drawn on the 3D floor, not in the hologram theme or the "fast" mode', () => {
  const room = { color: '#123456', covering: 'parquet' };
  assert.equal(C.patternOf(room).key, 'parquet');
  assert.equal(C.patternOf(room, { holo: true }), null);
  assert.equal(C.patternOf(room, { low: true }), null);
  assert.equal(C.patternOf({ color: '#123456' }), null);
  assert.equal(C.patternOf({ covering: 'marble2' }), null);
  assert.equal(C.patternOf(null), null);
});

test('where no pattern is drawn (2D plan, thumbnails, fast mode) a covered room has the colour of its covering from afar', () => {
  assert.equal(C.floorHex({ color: '#123456', covering: 'concrete' }), F.PATTERNS.concrete.color);
  assert.equal(C.floorHex({ color: '#123456', covering: 'concrete', floorLook: { color: '#aabbcc' } }), '#aabbcc', 'its own colour');
  assert.equal(C.floorHex({ color: '#123456' }), '#123456');
  assert.equal(C.floorHex({ color: '#123456', covering: 'marble2' }), '#123456');
  assert.equal(C.floorHex({}), C.PLAIN);
});

test('the floor of the 3D view: a view colour hides the pattern, under the pattern the colour is white', () => {
  const room = { color: '#123456', covering: 'tiles' };
  assert.deepEqual(C.floorPaint(room, 0xff0000, true), { color: 0xff0000, pattern: false });
  assert.deepEqual(C.floorPaint(room, null, true), { color: '#ffffff', pattern: true });
  assert.deepEqual(C.floorPaint(room, null, false), { color: C.floorFinish(room).mean, pattern: false }, 'fast mode: the colour from afar');
  assert.deepEqual(C.floorPaint({ color: '#123456' }, null, false), { color: '#123456', pattern: false });
});
