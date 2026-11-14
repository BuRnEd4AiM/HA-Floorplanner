// Unit tests for rooflook.js (the colour and the cover of a roof, #752; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const R = await import(`${dir}/rooflook.js`);
const P = await import(`${dir}/patterns.js`);

const HEX = /^#[0-9a-f]{6}$/;
test('nothing set: brick red slopes and dark red dormers, smooth, as always', () => {
  assert.equal(R.roofHex({}), '#a4493b');
  assert.equal(R.dormerHex({}), '#8f3b2f');
  assert.equal(R.roofFinish({}), null);
  assert.equal(R.roofFinish(null), null);
  assert.deepEqual(R.roofLook({ color: 'red', cover: 'straw' }), {});
});

test('the colours to tap: brick red first, dark grey and anthracite among them, every one a colour', () => {
  assert.equal(R.ROOF_COLORS[0][1], R.ROOF_RED);
  const keys = R.ROOF_COLORS.map(([k]) => k);
  for (const k of ['red', 'engobe', 'anthracite', 'darkgrey', 'slate', 'brown']) assert.ok(keys.includes(k), k);
  R.ROOF_COLORS.forEach(([, c]) => assert.match(c, HEX));
  assert.equal(new Set(keys).size, keys.length);
});

test('dark grey tiles (Miicki): the colour and the cover kept, the dormers a little darker', () => {
  const r = { type: 'gable' };
  R.setRoofLook(r, { color: '#5C6066', cover: 'tiles' });
  assert.deepEqual(R.roofLook(r), { color: '#5c6066', cover: 'tiles' });
  assert.equal(R.roofHex(r), '#5c6066');
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ((n >> 8) & 255) + (n & 255); };
  assert.ok(lum(R.dormerHex(r)) < lum(R.roofHex(r)), 'the dormers are darker');
  const fin = R.roofFinish(r), fd = R.roofFinish(r, true);
  assert.equal(fin.kind, 'rooftiles');
  assert.equal(fin.color, '#5c6066');
  assert.equal(fd.color, R.dormerHex(r));
  assert.ok(fin.rep[0] > 0 && fin.rep[1] > fin.rep[0], 'a tile a little longer than wide');
  assert.match(fin.mean, HEX);
  R.setRoofLook(r, { color: null });
  assert.equal(r.color, undefined, 'back to brick red');
  R.setRoofLook(r, { color: '#a4493b' });
  assert.equal(r.color, undefined, 'brick red is not stored');
  R.setRoofLook(r, { cover: '' });
  assert.equal(r.cover, undefined, 'smooth again');
});

test('every cover draws the whole picture and its relief with a known kind', () => {
  for (const k of R.COVER_KEYS) {
    const fin = R.roofFinish({ cover: k, color: '#3a3e43' });
    assert.ok(fin.kind in P.KINDS, k);
    for (const height of [false, true]) {
      let all = false;
      const g = new Proxy({}, { get: (o, m) => (m === 'fillRect' ? (x, y, w, h) => { if (x <= 0 && y <= 0 && w >= 64 && h >= 64) all = true; } : m === 'createImageData' ? (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }) : () => {}), set: () => true });
      P.drawPattern(g, 64, fin, height);
      assert.ok(all, `${k} ${height ? 'relief' : 'colour'} covers the picture`);
    }
  }
});

test('texture coordinates: rows along the eaves, up the slope, the same on both sides of a seam', () => {
  const fin = { angle: 0, rep: [1, 1] };
  // a slope rising towards +x at 45°: (0,0,0) (1,1,0) (0,0,1)
  const uv = R.slopeUVs([0, 0, 0, 1, 1, 0, 0, 0, 1], fin);
  assert.equal(uv.length, 6);
  assert.ok(Math.abs(uv[3] - Math.SQRT2) < 1e-9, 'up the slope: the length along it');
  assert.ok(Math.abs(uv[2] - uv[0]) < 1e-9, 'the first two corners lie on one row along the eaves, u apart only by the eaves');
  assert.ok(Math.abs(Math.abs(uv[4] - uv[0]) - 1) < 1e-9, 'along the eaves: one metre');
  // the same slope from the other side of the house (normal pointing down: turned up) gives the same rows
  const back = R.slopeUVs([0, 0, 0, 0, 0, 1, 1, 1, 0], fin);
  assert.ok(Math.abs(back[5] - Math.SQRT2) < 1e-9);
  // flat: x and z; a triangle without area: zeros
  assert.deepEqual(R.slopeUVs([0, 0, 0, 2, 0, 0, 0, 0, 3], fin).map((v) => Math.abs(v)), [0, 0, 2, 0, 0, 3]);
  assert.deepEqual(R.slopeUVs([0, 0, 0, 1, 0, 0, 2, 0, 0], fin), [0, 0, 0, 0, 0, 0]);
});
