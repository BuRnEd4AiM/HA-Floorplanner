// Unit tests for yarddeco.js: the things for the garden and the yard round the house, #538 (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const Y = await import(`${dir}/yarddeco.js`);
const S = await import(`${dir}/scandi.js`);
const L = await import(`${dir}/leisure.js`);
const G = await import(`${dir}/garage.js`);
const { DEVICE_TYPES, CATEGORIES, catOf } = await import(`${dir}/models.js`);
const { t, setLanguage } = await import(`${dir}/i18n.js`);
const HEX = /^#[0-9a-f]{6}$/;
const KEYS = Object.keys(Y.YARD);
const box = (k) => S.bounds(S.partsOf(k));

test('25 pieces and more, in the library group "Außen" with a German name, search words and parts; none takes the name of another piece', () => {
  assert.ok(KEYS.length >= 25, KEYS.length);
  const others = new Set([...Object.keys(L.LEISURE), ...Object.keys(G.GARAGE)]);
  for (const k of KEYS) {
    const d = Y.YARD[k];
    assert.equal(d.cat, 'outdoor', k);
    assert.ok(d.label && d.search && S.partsOf(k).length > 0, k);
    assert.ok(!others.has(k), `${k} is already a piece of leisure.js or garage.js`);
    assert.equal(S.SCANDI[k], d, k);
    assert.equal(DEVICE_TYPES[k].label, d.label);
    assert.equal(catOf(k), 'outdoor', k);
    assert.ok(CATEGORIES.outdoor.includes(k), k);
  }
  for (const k of ['tree', 'bush', 'fence', 'pool']) assert.ok(CATEGORIES.outdoor.includes(k), k);   // the old garden things stay
});
test('the finishes and materials are new names (nothing of the others is replaced) and each piece is drawn in every finish it offers', () => {
  const base = Object.keys(S.FINISHES).filter((k) => !(k in Y.YARD_FINISHES));
  for (const k of Object.keys(Y.YARD_FINISHES)) { assert.match(k, /^[a-z]{2,20}$/); assert.ok(!base.includes(k), k); assert.deepEqual(S.FINISHES[k], Y.YARD_FINISHES[k]); }
  for (const k of Object.keys(Y.YARD_MATS)) assert.deepEqual(S.MATS[k], Y.YARD_MATS[k], `${k} is replaced by another material`);
  for (const k of KEYS) {
    const fins = Y.YARD[k].fin.length ? Y.YARD[k].fin : [null];
    for (const f of Y.YARD[k].fin) assert.ok(S.FINISHES[f], `${k}: ${f}`);
    for (const p of S.partsOf(k)) {
      const sizes = p.s === 'box' || p.s === 'ext' ? [p.w, p.h, p.d] : p.s === 'cyl' ? [p.r, p.r2, p.h] : [p.r, p.sx, p.sy, p.sz];
      assert.ok(sizes.every((v) => Number.isFinite(v) && v > 0), `${k}: ${JSON.stringify(p)}`);
      assert.ok([p.x, p.y, p.z, p.rx || 0, p.ry || 0, p.rz || 0].every(Number.isFinite), `${k}: ${JSON.stringify(p)}`);
      for (const f of fins) assert.match(S.matOf(p.m, f)?.c || '', HEX, `${k}: ${p.m} in ${f}`);
    }
  }
});
test('every piece stands on the ground, is centred and has the size of the real thing', () => {
  const size = (k) => { const bb = box(k); return [bb.x1 - bb.x0, bb.y1 - bb.y0, bb.z1 - bb.z0]; };
  for (const k of KEYS) {
    const bb = box(k);
    assert.ok(bb.y0 > -0.005 && bb.y0 < 0.03, `${k} starts at ${bb.y0}`);
    assert.ok(Math.abs(bb.x0 + bb.x1) < 0.002 && Math.abs(bb.z0 + bb.z1) < 0.002, `${k} is not centred`);
    assert.ok(bb.y1 < 2.8, `${k} is ${bb.y1} m high`);
  }
  const near = (k, w, h, d, eps = 0.15) => size(k).forEach((v, i) => assert.ok(Math.abs(v - [w, h, d][i]) < eps, `${k}: ${size(k).map((q) => q.toFixed(2))}`));
  near('garden_bench', 1.5, 0.9, 0.55); near('trampoline', 3, 2.6, 3); near('garden_shed', 2.6, 2.55, 2.4); near('greenhouse', 2.5, 2.2, 1.9);
  near('garden_gnome', 0.23, 0.45, 0.18, 0.06); near('parasol', 3, 2.45, 3); near('raised_bed', 1.68, 0.87, 0.88);
  assert.ok(S.footOf('parasol').r > 1.4 && S.footOf('fire_bowl').r < 0.5);       // round in the plan
  assert.deepEqual(Y.YARD_FLAT, ['stepping_stones']);
  assert.ok(box('stepping_stones').y1 < 0.05);
});
test('what lights up follows the entity: the lamps and the embers of the fire bowl; the trampoline net lets you see through', () => {
  const mats = (k) => new Set(S.partsOf(k).map((p) => p.m));
  for (const k of ['garden_lamp', 'lamp_post']) assert.ok(S.matOf('glow', null).glow && mats(k).has('glow'), k);
  assert.ok(mats('fire_bowl').has('ember') && S.matOf('ember', null).glow);
  assert.ok(S.matOf('net', null).opacity < 0.5 && mats('trampoline').has('net'));
  assert.equal(S.partsOf('trampoline').filter((p) => p.m === 'net').length, 24);
});
test('every piece has its name in every language', async () => {
  globalThis.document ??= { documentElement: {} };                 // setLanguage marks the page's language
  for (const l of ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl', 'zh']) {
    setLanguage(l);
    for (const k of KEYS) assert.notEqual(t(`dev.${k}`), `dev.${k}`, `${l}: ${k}`);
    for (const f of Object.keys(Y.YARD_FINISHES)) assert.notEqual(t(`fin.${f}`), `fin.${f}`, `${l}: ${f}`);
  }
  setLanguage('de');
  assert.equal(t('dev.garden_gnome'), 'Gartenzwerg');
});
