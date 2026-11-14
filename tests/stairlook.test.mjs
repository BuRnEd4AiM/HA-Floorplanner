// Unit tests for stairlook.js (the covering of a stair's treads, its risers and hand rail, #753; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/stairlook.js`);

const HEX = /^#[0-9a-f]{6}$/;
test('nothing set: beige steps, one material, a grey metal rail, as always', () => {
  assert.equal(S.treadHex({}), '#c9bba1');
  assert.equal(S.riserHex({}), '#c9bba1');
  assert.deepEqual(S.railLook({}), { color: '#7c838b', metal: true });
  assert.equal(S.treadFinish({}), null);
  assert.ok(S.oneLook({}));
  for (const list of [S.STEP_COLORS, S.RISER_COLORS, S.RAIL_COLORS]) list.forEach(([, c]) => assert.match(c, HEX));
});

test('parquet on the treads, white risers, a black rail (and wood is not shiny)', () => {
  const st = { type: 'straight' };
  S.setStairLook(st, { covering: 'parquet' });
  S.setStairLook(st, { floorLook: { color: '#8F6A48', angle: 90 }, riser: '#F2F0EA', rail: '#232528' });
  assert.deepEqual([st.covering, st.floorLook, st.riser, st.rail], ['parquet', { color: '#8f6a48', angle: 90 }, '#f2f0ea', '#232528']);
  const fin = S.treadFinish(st);
  assert.equal(fin.key, 'parquet');
  assert.equal(fin.color, '#8f6a48');
  assert.equal(S.riserHex(st), '#f2f0ea');
  assert.ok(!S.oneLook(st));
  assert.deepEqual(S.railLook(st), { color: '#232528', metal: true });
  assert.equal(S.railLook({ rail: '#b88a5c' }).metal, false, 'an oak rail is matt');
  S.setStairLook(st, { riser: null });
  assert.equal(S.riserHex(st), fin.mean, 'without a riser colour: the colour of the treads from afar');
  S.setStairLook(st, { covering: null });
  assert.equal(st.covering, undefined);
  assert.equal(st.floorLook, undefined, 'its look goes with it');
  S.setStairLook(st, { color: '#c9bba1', rail: '#7c838b' });
  assert.equal(st.color, undefined, 'the default colours are not stored');
  assert.equal(st.rail, undefined);
  S.setStairLook(st, { covering: 'woodchip' });
  assert.equal(st.covering, undefined, 'only floor coverings');
});

test('"wie der Raum": the covering of a room with its look, or its colour', () => {
  assert.deepEqual(S.lookOfRoom({ covering: 'tiles', floorLook: { color: '#ffffff' }, color: '#123456' }), { covering: 'tiles', floorLook: { color: '#ffffff' }, color: null });
  assert.deepEqual(S.lookOfRoom({ covering: 'tiles' }), { covering: 'tiles', floorLook: null, color: null });
  assert.deepEqual(S.lookOfRoom({ color: '#123456' }), { covering: null, color: '#123456' });
  assert.deepEqual(S.lookOfRoom(null), { covering: null, color: null });
});

test('tread texture: the planks run along the longest edge of each tread (across the way you walk)', () => {
  const fin = { angle: 0, rep: [1, 1] };
  // a tread 0.25 deep (x, the way you walk) and 1.0 wide (z)
  const poly = [[0, -0.5], [0.25, -0.5], [0.25, 0.5], [0, 0.5]];
  const uv = S.treadUVs(fin, poly, [[0.25, -0.5], [0.25, 0.5], [0, 0.5]]);
  assert.ok(Math.abs(uv[0][0]) < 1e-9 && Math.abs(uv[0][1]) < 1e-9, 'from the start of the longest edge');
  assert.ok(Math.abs(uv[1][0] - 1) < 1e-9 && Math.abs(uv[1][1]) < 1e-9, 'u along it: one metre');
  assert.ok(Math.abs(Math.abs(uv[2][1]) - 0.25) < 1e-9, 'v across it: the depth');
  assert.deepEqual(S.treadUVs(fin, [], [[1, 2]]), [[1, 2]], 'no outline: x and z');
});
