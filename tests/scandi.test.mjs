// Unit tests for scandi.js (furniture in Scandinavian style: parts, footprint, finishes; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/scandi.js`);
const { LAMP_TYPES } = await import(`${dir}/lamplight.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const HEX = /^#[0-9a-f]{6}$/;
const CATS = ['living', 'kitchen', 'bath', 'bedroom', 'kids', 'office', 'entry', 'lighting', 'decor'];

test('more than 50 pieces, each with a group, a German name, search words and parts', () => {
  assert.ok(S.SCANDI_TYPES.length >= 50, S.SCANDI_TYPES.length);
  for (const k of S.SCANDI_TYPES) {
    const d = S.SCANDI[k];
    assert.ok(CATS.includes(d.cat), k);
    assert.ok(d.label && d.search, k);
    assert.ok(S.partsOf(k).length > 0, k);
  }
});
test('every part has a real size and a known material in every finish of its piece', () => {
  for (const k of S.SCANDI_TYPES) {
    const fins = S.SCANDI[k].fin.length ? S.SCANDI[k].fin : [null];
    for (const p of S.partsOf(k)) {
      const sizes = p.s === 'box' ? [p.w, p.h, p.d] : p.s === 'cyl' ? [p.r, p.r2, p.h] : [p.r, p.sx, p.sy, p.sz];
      assert.ok(['box', 'cyl', 'ball'].includes(p.s), k);
      assert.ok(sizes.every((v) => Number.isFinite(v) && v > 0), `${k}: ${JSON.stringify(p)}`);
      assert.ok([p.x, p.y, p.z, p.rx || 0, p.ry || 0, p.rz || 0].every(Number.isFinite), `${k}: ${JSON.stringify(p)}`);
      for (const f of fins) assert.match(S.matOf(p.m, f)?.c || '', HEX, `${k}: ${p.m} in ${f}`);
    }
  }
});
test('every piece stands on the floor, is centred on its footprint, and the plan footprint is its real size', () => {
  for (const k of S.SCANDI_TYPES) {
    const bb = S.bounds(S.partsOf(k));
    assert.ok(bb.y0 > -0.005, `${k} reaches below the floor: ${bb.y0}`);
    assert.ok(Math.abs(bb.x0 + bb.x1) < 0.002 && Math.abs(bb.z0 + bb.z1) < 0.002, `${k} is not centred`);
    assert.ok(bb.y1 < 2.5, `${k} is ${bb.y1} m high`);
    const f = S.footOf(k);
    if (S.SCANDI[k].round) near(f.r, Math.max(bb.x1 - bb.x0, bb.z1 - bb.z0) / 2, 0.01);
    else { near(f.w, bb.x1 - bb.x0, 0.006); near(f.d, bb.z1 - bb.z0, 0.006); assert.ok(f.w > 0.1 && f.d > 0.1 && f.w < 3 && f.d < 3, k); }
  }
});
test('the real sizes of the classics: cube shelves of 77 / 147 cm, the tall bookcase, the wardrobe, the double bed', () => {
  const size = (k) => { const bb = S.bounds(S.partsOf(k)); return [bb.x1 - bb.x0, bb.y1 - bb.y0, bb.z1 - bb.z0].map((v) => +v.toFixed(2)); };
  assert.deepEqual(size('shelf_cube2x2'), [0.77, 0.77, 0.39]);
  assert.deepEqual(size('shelf_cube4x4').slice(0, 2), [1.47, 1.47]);
  assert.deepEqual(size('shelf_cube4x1').slice(0, 2), [1.47, 0.42]);
  assert.deepEqual(size('shelf_book'), [0.8, 2.02, 0.28]);
  assert.equal(size('wardrobe2')[1], 2.36);
  assert.deepEqual(size('bed_high'), [1.76, 1, 2.09]);
  assert.deepEqual(size('dresser6'), [1.6, 0.78, 0.48]);
});
test('the parts are the same list every time (built once)', () => {
  assert.equal(S.partsOf('vitrine'), S.partsOf('vitrine'));
  assert.deepEqual(S.partsOf('nope'), []);
});
test('finishes: the chosen one, else the first; nothing to choose with one or none', () => {
  assert.equal(S.finishOf('shelf_cube2x2', {}), 'white');
  assert.equal(S.finishOf('shelf_cube2x2', { finish: 'oak' }), 'oak');
  assert.equal(S.finishOf('shelf_cube2x2', { finish: 'rust' }), 'white');      // not a finish of this piece
  assert.equal(S.finishOf('shark', { finish: 'oak' }), null);
  assert.deepEqual(S.finishChoices('shelf_pine'), ['pine', 'white', 'grey']);
  assert.equal(S.finishChoices('highchair'), null);
  assert.equal(S.finishChoices('shark'), null);
  assert.equal(S.finishChoices('sofa'), null);
  for (const k of S.SCANDI_TYPES) for (const f of S.SCANDI[k].fin) assert.ok(S.FINISHES[f], `${k}: ${f}`);
});
test('materials: the finish, the finish a little darker, the fixed ones', () => {
  assert.equal(S.matOf('f', 'oak').c, S.FINISHES.oak.c);
  assert.equal(S.matOf('f2', 'oak').c, S.shade(S.FINISHES.oak.c, 0.8));
  assert.equal(S.matOf('f', 'nope').c, S.FINISHES.white.c);
  assert.equal(S.matOf('glass', 'oak').opacity, 0.3);
  assert.equal(S.shade('#808080', 0.5), '#404040');
  assert.equal(S.shade('#ffffff', 2), '#ffffff');
});
test('the lamps are in the lighting group and glow; nothing else does', () => {
  for (const k of S.SCANDI_TYPES) {
    const glows = S.partsOf(k).some((p) => S.matOf(p.m, S.finishOf(k)).glow);
    assert.equal(glows, S.SCANDI[k].cat === 'lighting', k);
    if (S.SCANDI[k].cat === 'lighting') assert.ok(LAMP_TYPES.includes(k), k);
  }
  assert.equal(S.SCANDI.pendant_paper.y, 1.9);
});
test('turning: a part points from its middle as three.js turns it (order XYZ and YXZ)', () => {
  const box = { s: 'box', w: 0.1, h: 1, d: 0.1, x: 0, y: 0, z: 0 };
  const top = (p) => S.pointOf(p, [0, p.h / 2, 0]);
  top({ ...box, rz: Math.PI / 2 }).forEach((v, i) => near(v, [-0.5, 0.5, 0][i]));          // turned round z: the top points to -x
  top({ ...box, rx: Math.PI / 2 }).forEach((v, i) => near(v, [0, 0.5, 0.5][i]));           // round x: to +z
  const flat = { s: 'box', w: 0.1, h: 0.1, d: 1, x: 0, y: 0, z: 0, ord: 'YXZ', ry: Math.PI / 2, rx: 0.3 };
  const end = S.pointOf(flat, [0, 0, 0.5]);
  near(end[0], 0.5 * Math.cos(0.3)); near(end[1], 0.05 - 0.5 * Math.sin(0.3)); near(end[2], 0, 1e-9);      // turned to +x, then tilted down
  near(S.pointOf(flat, [0.05, 0, 0])[1], 0.05);                                                             // its width stays level
});
test('bounds: a box, a lying cylinder, a squashed ball', () => {
  const bb = S.bounds([{ s: 'box', w: 2, h: 1, d: 0.5, x: 1, y: 0.2, z: 0 }, { s: 'cyl', r: 0.1, r2: 0.2, h: 1, x: 0, y: 0, z: 0, rz: Math.PI / 2 }, { s: 'ball', r: 0.5, sx: 2, sy: 0.5, sz: 1, x: 0, y: 0, z: -1 }]);
  near(bb.x0, -1); near(bb.x1, 2); near(bb.y0, 0); near(bb.y1, 1.2); near(bb.z0, -1.5); near(bb.z1, 0.25);
});
