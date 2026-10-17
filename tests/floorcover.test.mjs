// Unit tests for floorcover.js (floor coverings, #427; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const C = await import(`${dir}/floorcover.js`);

test('the coverings: parquet, tiles and concrete, each with a pattern, a size and a colour from afar', () => {
  assert.deepEqual(C.COVERING_KEYS, ['parquet', 'parquetLight', 'parquetDark', 'tiles', 'tilesSmall', 'tilesDark', 'concrete']);
  for (const [k, c] of Object.entries(C.COVERINGS)) {
    assert.ok(['planks', 'tiles', 'concrete'].includes(c.kind), k);
    assert.ok(c.size > 0 && /^#[0-9a-f]{6}$/.test(c.mean), k);
    if (c.kind === 'tiles') assert.ok(Number.isInteger(c.n) && c.n > 0 && c.a && c.b && c.grout, k);
    else assert.match(c.base, /^#[0-9a-f]{6}$/, k);
  }
  assert.ok(C.COVERINGS.tilesSmall.size / C.COVERINGS.tilesSmall.n < C.COVERINGS.tiles.size / C.COVERINGS.tiles.n, 'small tiles are smaller');
});

test('only a known covering is kept', () => {
  assert.equal(C.cleanCovering('tiles'), 'tiles');
  for (const v of ['marble', '', null, undefined, 3, 'toString', '__proto__']) assert.equal(C.cleanCovering(v), undefined, String(v));
});

test('the pattern is drawn on the 3D floor, not in the hologram theme or the "fast" mode', () => {
  const room = { color: '#123456', covering: 'parquet' };
  assert.equal(C.patternOf(room), 'parquet');
  assert.equal(C.patternOf(room, { holo: true }), null);
  assert.equal(C.patternOf(room, { low: true }), null);
  assert.equal(C.patternOf({ color: '#123456' }), null);
  assert.equal(C.patternOf({ covering: 'marble' }), null);
  assert.equal(C.patternOf(null), null);
});

test('where no pattern is drawn (2D plan, thumbnails, fast mode) a covered room has the colour of its covering', () => {
  assert.equal(C.floorHex({ color: '#123456', covering: 'concrete' }), C.COVERINGS.concrete.mean);
  assert.equal(C.floorHex({ color: '#123456' }), '#123456');
  assert.equal(C.floorHex({ color: '#123456', covering: 'marble' }), '#123456');
  assert.equal(C.floorHex({}), C.PLAIN);
});

test('the floor of the 3D view: a view colour hides the pattern, under the pattern the colour is white', () => {
  const room = { color: '#123456', covering: 'tiles' };
  assert.deepEqual(C.floorPaint(room, 0xff0000, true), { color: 0xff0000, pattern: false });
  assert.deepEqual(C.floorPaint(room, null, true), { color: '#ffffff', pattern: true });
  assert.deepEqual(C.floorPaint(room, null, false), { color: C.COVERINGS.tiles.mean, pattern: false }, 'fast mode: the mean colour');
  assert.deepEqual(C.floorPaint({ color: '#123456' }, null, false), { color: '#123456', pattern: false });
});
