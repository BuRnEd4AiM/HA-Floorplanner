// Unit tests for leisure.js (sauna, fitness, bar, cinema, PC, LED mirrors) and the building blocks in shapes.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const L = await import(`${dir}/leisure.js`);
const S = await import(`${dir}/scandi.js`);
const SH = await import(`${dir}/shapes.js`);
const { LAMP_TYPES, LIGHT_PROFILE, isLamp } = await import(`${dir}/lamplight.js`);
const { WALL_TYPES } = await import(`${dir}/placement.js`);
const { WALL_HUNG } = await import(`${dir}/collide.js`);
const { DEVICE_TYPES, CATEGORIES, catOf } = await import(`${dir}/models.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const HEX = /^#[0-9a-f]{6}$/;
const KEYS = Object.keys(L.LEISURE);
const size = (k) => { const bb = S.bounds(S.partsOf(k)); return [bb.x1 - bb.x0, bb.y1 - bb.y0, bb.z1 - bb.z0].map((v) => +v.toFixed(2)); };
const mats = (k) => new Set(S.partsOf(k).map((p) => p.m));

test('more than 50 pieces, each in a library group with a German name, search words and parts', () => {
  assert.ok(KEYS.length >= 50, KEYS.length);
  for (const k of KEYS) {
    const d = L.LEISURE[k];
    assert.ok([...L.LEISURE_CATS, 'bath', 'entry', 'office'].includes(d.cat), k);
    assert.ok(d.label && d.search && S.partsOf(k).length > 0, k);
    assert.equal(DEVICE_TYPES[k].label, d.label);
    assert.equal(DEVICE_TYPES[k].y, d.y || 0);
  }
  for (const c of L.LEISURE_CATS) assert.ok(KEYS.filter((k) => L.LEISURE[k].cat === c).length >= 8, c);
});
test('the library: the new groups come before the lamps, every piece is in its own group (an LED mirror in the bathroom, not with the lamps)', () => {
  const cats = Object.keys(CATEGORIES);
  for (const c of L.LEISURE_CATS) assert.ok(cats.indexOf(c) > cats.indexOf('entry') && cats.indexOf(c) < cats.indexOf('lighting'), c);
  for (const k of KEYS) assert.equal(catOf(k), L.LEISURE[k].cat, k);
  assert.equal(catOf('sauna_cabin'), 'wellness'); assert.equal(catOf('treadmill'), 'fitness'); assert.equal(catOf('bar_counter'), 'bar');
  assert.equal(catOf('projector'), 'cinema'); assert.equal(catOf('pc_gaming'), 'office'); assert.equal(catOf('mirror_led_zones'), 'bath');
});
test('every part has a real size and a known material in every finish of its piece', () => {
  for (const k of KEYS) {
    const fins = L.LEISURE[k].fin.length ? L.LEISURE[k].fin : [null];
    for (const f of L.LEISURE[k].fin) assert.ok(S.FINISHES[f], `${k}: ${f}`);
    for (const p of S.partsOf(k)) {
      const sizes = p.s === 'box' ? [p.w, p.h, p.d] : p.s === 'cyl' ? [p.r, p.r2, p.h] : [p.r, p.sx, p.sy, p.sz];
      assert.ok(sizes.every((v) => Number.isFinite(v) && v > 0), `${k}: ${JSON.stringify(p)}`);
      assert.ok([p.x, p.y, p.z, p.rx || 0, p.ry || 0, p.rz || 0].every(Number.isFinite), `${k}: ${JSON.stringify(p)}`);
      for (const f of fins) assert.match(S.matOf(p.m, f)?.c || '', HEX, `${k}: ${p.m} in ${f}`);
    }
  }
});
test('every piece stands on the floor (a hanging punching bag from its chain), is centred, and the plan footprint is its real size', () => {
  for (const k of KEYS) {
    const bb = S.bounds(S.partsOf(k));
    assert.ok(bb.y0 > -0.005 && bb.y0 < (k === 'punchingbag' ? 0.5 : 0.02), `${k} starts at ${bb.y0}`);
    assert.ok(Math.abs(bb.x0 + bb.x1) < 0.002 && Math.abs(bb.z0 + bb.z1) < 0.002, `${k} is not centred`);
    assert.ok(bb.y1 < 2.5 && (L.LEISURE[k].y || 0) + bb.y1 < 2.55, `${k} reaches ${bb.y1} m (placed at ${L.LEISURE[k].y})`);
    const f = S.footOf(k);
    if (L.LEISURE[k].round) near(f.r, Math.max(bb.x1 - bb.x0, bb.z1 - bb.z0) / 2, 0.01);
    else { near(f.w, bb.x1 - bb.x0, 0.006); near(f.d, bb.z1 - bb.z0, 0.006); assert.ok(f.w > 0.1 && f.d > 0.01 && f.w < 3 && f.d < 3, k); }
  }
});
test('real sizes: the sauna cabins, the pool table, the screen, the treadmill, the bar counter, the 3 cinema seats', () => {
  assert.deepEqual(size('sauna_cabin'), [2.04, 2.05, 1.84]);
  assert.deepEqual(size('sauna_small'), [1.34, 2, 1.24]);
  assert.deepEqual(size('pooltable'), [2.5, 0.81, 1.4]);
  assert.deepEqual(size('screen_frame'), [2.82, 1.66, 0.04]);
  assert.equal(size('treadmill')[2], 1.91);
  assert.equal(size('bar_counter')[0], 2.5);
  assert.equal(size('cinema_row')[0], 2.4);
  assert.equal(size('powerrack')[1], 2.2);
});
test('wall pieces are flat enough to hang (mirrors and screens a few centimetres), the projector and the star sky hang from the ceiling', () => {
  for (const k of L.LEISURE_WALL) assert.ok(S.footOf(k).d <= 0.5, `${k} is ${S.footOf(k).d} m deep`);
  for (const k of ['mirror_led', 'mirror_led_round', 'mirror_led_zones', 'mirror_led_tall', 'mirror_gym', 'screen_frame', 'neon_sign', 'acoustic_panel']) assert.ok(S.footOf(k).d <= 0.04, k);
  for (const k of L.LEISURE_WALL) assert.ok(WALL_TYPES.has(k) && WALL_HUNG.includes(k), k);
  for (const k of ['projector', 'pool_lamp', 'starsky']) assert.ok(L.LEISURE_HUNG.includes(k) && WALL_HUNG.includes(k) && !WALL_TYPES.has(k), k);
  assert.ok(!WALL_TYPES.has('sauna_cabin') && !WALL_HUNG.includes('treadmill'));
  assert.equal(L.LEISURE.projector.y, 2.0);
  assert.deepEqual(L.LEISURE_FLAT.sort(), ['gymfloor', 'starsky', 'yogamat']);
});
test('the lamps (LED mirrors, the LED bar, the neon sign ...) are lamps that glow and light their room in their own way', () => {
  for (const k of L.LEISURE_LAMPS) {
    assert.ok(LAMP_TYPES.includes(k) && isLamp({ type: k }), k);
    assert.ok(S.partsOf(k).some((p) => S.matOf(p.m, S.finishOf(k)).glow), `${k} does not glow`);
    assert.deepEqual(LIGHT_PROFILE[k], L.LEISURE[k].light, k);
  }
  for (const k of ['mirror_led', 'mirror_led_zones', 'bar_counter', 'neon_sign', 'starsky', 'pool_lamp']) assert.ok(L.LEISURE_LAMPS.includes(k), k);
  for (const k of ['sauna_cabin', 'treadmill', 'projector', 'pc_gaming']) assert.ok(!isLamp({ type: k }), k);
  assert.ok(isLamp({ type: 'ledzone' }) && LIGHT_PROFILE.ledzone);
});
test('lit parts: the sauna stones, the screen, the displays, the RGB of a PC light up in their own colour', () => {
  for (const [m, on] of [['ember', '#ff5a1f'], ['screen', '#dce8ff'], ['rgb', '#a050ff']]) assert.equal(S.matOf(m).on, on);
  for (const m of Object.keys(L.LEISURE_MATS)) if (L.LEISURE_MATS[m].on) assert.match(L.LEISURE_MATS[m].on, HEX, m);
  assert.ok(mats('sauna_cabin').has('ember') && mats('sauna_cabin').has('glow'));
  assert.ok(mats('screen_frame').has('screen') && mats('pc_gaming').has('rgb') && mats('projector').has('lens') && mats('treadmill').has('display'));
});
test('LED zones: a piece with zones has parts in every zone and none beyond them; no other piece has zone parts', () => {
  const withZones = KEYS.filter((k) => L.LEISURE[k].leds);
  assert.deepEqual(withZones.sort(), ['bar_corner', 'bar_counter', 'mirror_cabinet', 'mirror_gym', 'mirror_hollywood', 'mirror_led_tall', 'mirror_led_zones']);
  for (const k of ['mirror_gym', 'mirror_led_tall']) assert.deepEqual(L.LEISURE[k].leds, ['back', 'front'], k);     // the big mirrors: behind and in front
  for (const k of KEYS) {
    const zs = [...mats(k)].filter((m) => /^z\d$/.test(m)).map((m) => S.matOf(m).zone).sort();
    assert.deepEqual(zs, (L.LEISURE[k].leds || []).map((_, i) => i), k);
  }
  assert.deepEqual(L.LEISURE.mirror_led_zones.leds, ['back', 'front', 'bottom']);
  for (let i = 0; i < 4; i++) assert.ok(S.matOf(`z${i}`).glow && S.matOf(`z${i}`).zone === i);
});
test('the PC desk in every monitor layout: real parts, on the floor, centred, as wide as its monitors need; the default is two', () => {
  assert.deepEqual(S.variantChoices('pc_setup'), ['two', 'one', 'three', 'four', 'curved', 'curved2']);
  assert.deepEqual(Object.keys(L.MONITOR_LAYOUTS), S.variantChoices('pc_setup'));
  const widths = { two: 1.6, one: 1.4, three: 1.8, four: 1.6, curved: 1.6, curved2: 1.8 };
  for (const v of S.variantChoices('pc_setup')) {
    const parts = S.partsOf('pc_setup', v), bb = S.bounds(parts);
    for (const p of parts) for (const f of L.LEISURE.pc_setup.fin) assert.match(S.matOf(p.m, f)?.c || '', HEX, `${v}: ${p.m}`);
    assert.ok(bb.y0 > -0.005 && bb.y1 < 1.7 && Math.abs(bb.x0 + bb.x1) < 0.002 && Math.abs(bb.z0 + bb.z1) < 0.002, v);
    assert.deepEqual(S.footOf('pc_setup', v), { w: widths[v], d: 0.8 }, v);
    assert.ok(parts.some((p) => p.m === 'display'), v);
  }
  const screens = (v) => S.partsOf('pc_setup', v).filter((p) => p.m === 'display').length;
  assert.deepEqual(['one', 'two', 'three', 'four'].map(screens), [1, 2, 3, 4]);
  assert.equal(screens('curved2'), 8 + 2);                    // the curved one is made of 8 pieces
  assert.equal(S.partsOf('pc_setup'), S.partsOf('pc_setup', 'two'));
  assert.equal(S.partsOf('pc_setup', 'nope'), S.partsOf('pc_setup', 'two'));
  assert.notEqual(S.partsOf('pc_setup', 'three'), S.partsOf('pc_setup', 'two'));
  assert.equal(S.variantOf('pc_setup', { variant: 'four' }), 'four');
  assert.equal(S.variantOf('pc_setup', { variant: 'x' }), 'two');
  assert.equal(S.variantOf('pc_setup', {}), 'two');
  assert.equal(S.variantOf('sofa_3', { variant: 'four' }), null);
  assert.equal(S.variantChoices('sauna_cabin'), null);
  assert.equal(S.partsOf('sofa_3', 'four'), S.partsOf('sofa_3'));     // a piece without variants ignores one
});
test('every piece the ball has an icon for and the search finds by its everyday name', () => {
  for (const k of KEYS) assert.ok(!L.LEISURE[k].icon || typeof L.LEISURE[k].icon === 'string', k);
  assert.ok(L.LEISURE.sauna_cabin.search.includes('sauna') && L.LEISURE.treadmill.search.includes('laufband') && L.LEISURE.projector.search.includes('beamer'));
});
test('shapes: moving parts, turning them round y (also parts turned already), a tilted panel, wheels and discs', () => {
  const box = { s: 'box', w: 1, h: 0.2, d: 0.1, x: 1, y: 0, z: 0 };
  assert.deepEqual(SH.at([box], 1, 2, 3)[0], { ...box, x: 2, y: 2, z: 3 });
  const [t] = SH.turnAll([box], Math.PI / 2);
  near(t.x, 0); near(t.z, -1); assert.equal(t.ord, 'YXZ'); near(t.ry, Math.PI / 2);
  const end = S.pointOf(t, [0.5, 0, 0]);                       // the box along x now lies along -z
  near(end[0], 0); near(end[2], -1.5);
  const tilt = SH.turnAll([{ ...box, x: 0, rx: -0.3 }], Math.PI / 2)[0];
  const top = S.pointOf(tilt, [0, 0.1, 0]), plain = S.pointOf({ ...box, x: 0, rx: -0.3 }, [0, 0.1, 0]);
  near(top[0], plain[2]); near(top[1], plain[1]); near(top[2], -plain[0]);     // turned as a whole: x <- z, z <- -x
  assert.throws(() => SH.turnAll([{ ...box, ry: 0.2, rx: 0.1 }], 1));
  const pan = SH.tilted(0.4, 0.2, 0.02, 0, 1.2, 0, -0.5, 'display', 0.05);
  const mid = S.pointOf(pan, [0, 0, 0]);
  near(mid[1], 1.2 + 0.05 * Math.sin(0.5)); near(mid[2], 0.05 * Math.cos(0.5));   // moved along its front, up and forward
  const w = SH.wheelX(0.2, 0.05, 0, 0.3, 0, 'rubber'), dz = SH.discZ(0.2, 0.05, 0, 0.3, 0, 'rubber');
  const bw = S.bounds([w]), bd = S.bounds([dz]);
  near(bw.x1 - bw.x0, 0.05); near(bw.y0, 0.1); near(bw.z1 - bw.z0, 0.4);
  near(bd.z1 - bd.z0, 0.05); near(bd.y1, 0.5); near(bd.x1 - bd.x0, 0.4);
});
