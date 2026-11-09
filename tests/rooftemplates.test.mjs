// Unit tests for rooftemplates.js (ready-made roofs incl. the L roof and the „+“ roof, 5.1.0; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const T = await import(`${process.env.STATIC_DIR || '/tmp/static'}/rooftemplates.js`);
const bb = { x0: 0, x1: 10, z0: 0, z1: 7 };
let n = 0;
const uid = () => `u${++n}`;

test('every template has a key and a picture; unknown keys change nothing', () => {
  assert.deepEqual(T.TEMPLATES.map((x) => x.key), ['gable', 'dormers', 'hip', 'shed', 'flat', 'lshape', 'cross', 'canopy']);
  const r = { type: 'gable', pitch: 35 };
  assert.deepEqual(T.applyTemplate(r, 'nope', bb, uid), { type: 'gable', pitch: 35 });
});

test('shape and pitch; dormers come with the template „mit Gauben“, a flat roof keeps them aside (#669)', () => {
  const r = { type: 'gable', pitch: 35, overhang: 0.5 };
  T.applyTemplate(r, 'dormers', bb, uid);
  assert.equal(r.pitch, 38);
  assert.deepEqual(r.dormers.map((d) => [d.side, d.pos]), [[0, 0.25], [0, 0.75]]);
  T.applyTemplate(r, 'flat', bb, uid);
  assert.equal(r.type, 'flat'); assert.equal(r.dormers, undefined);
  T.applyTemplate(r, 'gable', bb, uid);
  assert.equal(r.dormers.length, 2);                                  // back from the flat roof: the dormers are there again
  T.applyTemplate(r, 'shed', bb, uid);
  assert.equal(r.type, 'shed'); assert.equal(r.pitch, 10); assert.equal(r.high, 'z0');
  const h = T.applyTemplate({}, 'hip', bb, uid);
  assert.deepEqual([h.type, h.pitch, h.overhang], ['hip', 30, 0.5]);
});

test('the L roof: a wing from the main ridge to side A at the end of the house, its ridge across; the „+“ roof: across the middle', () => {
  const r = T.applyTemplate({ type: 'gable', pitch: 35, ridge: 'x' }, 'lshape', bb, uid, (k) => `Flügel ${k}`);
  assert.equal(r.parts.length, 1);
  const w = r.parts[0];
  assert.deepEqual([w.tpl, w.type, w.ridge, w.level, w.name], [true, 'gable', 'z', 'main', 'Flügel lshape']);
  assert.deepEqual(w.box, { x0: 6, x1: 10, z0: 0, z1: 3.5 });      // 4 m wide (40 % of 10 m, below the depth of 7 m), front to ridge
  const c = T.applyTemplate(r, 'cross', bb, uid).parts;
  assert.equal(c.length, 1);                                         // the L wing went, the cross gable came
  assert.deepEqual(c[0].box, { x0: 2.75, x1: 7.25, z0: 0, z1: 7 });
  const deep = T.wingOf({ x0: 0, x1: 20, z0: 0, z1: 6 }, { type: 'gable' }, 'cross');
  assert.equal(+(deep.box.x1 - deep.box.x0).toFixed(2), 5.1);         // never wider than 85 % of the depth: its ridge stays lower
  const turned = T.wingOf({ x0: 0, x1: 6, z0: 0, z1: 12 }, { type: 'gable' }, 'l');
  assert.deepEqual(turned, { box: { x0: 0, x1: 3, z0: 7.2, z1: 12 }, ridge: 'x' });
});

test('own further roofs stay, template roofs go; the canopy sits in front of the house', () => {
  const r = { type: 'gable', parts: [{ id: 'garage', name: 'Garage', type: 'flat', box: { x0: 10, x1: 14, z0: 0, z1: 5 } }] };
  T.applyTemplate(r, 'canopy', bb, uid, () => 'Vordach');
  assert.deepEqual(r.parts.map((p) => [p.id === 'garage', !!p.tpl, p.type]), [[true, false, 'flat'], [false, true, 'shed']]);
  assert.equal(r.parts[1].name, 'Vordach');
  assert.deepEqual(r.parts[1].box, { x0: 0, x1: 10, z0: 7, z1: 9.5 });
  T.applyTemplate(r, 'gable', bb, uid);
  assert.deepEqual(r.parts.map((p) => p.id), ['garage']);
  const plain = T.applyTemplate({ type: 'gable', parts: [{ tpl: true }] }, 'hip', bb, uid);
  assert.equal(plain.parts, undefined);
});

test('own templates: what is kept, cleaned, and put back', () => {
  const r = { type: 'gable', pitch: 42, overhang: 0.6, gableWall: false, knee: 1.2, ridge: 'x', skylights: [{ id: 's' }],
    dormers: [{ id: 'd1', side: 1, pos: 0.3, w: 2, type: 'shed', window: { id: 'w' }, hostWall: 'x' }], parts: [{ id: 'p', tpl: true }] };
  const k = T.ownRoof(r);
  assert.deepEqual(k, { type: 'gable', pitch: 42, overhang: 0.6, gableWall: false, ridge: 'x', knee: 1.2, dormers: [{ side: 1, type: 'shed', pos: 0.3, w: 2 }] });
  const t = { type: 'hip', pitch: 30, skylights: [{ id: 's' }], parts: [{ id: 'own' }, { id: 'tp', tpl: true }] };
  T.applyOwn(t, k, uid);
  assert.deepEqual([t.type, t.pitch, t.knee, t.gableWall, t.dormers.length, t.dormers[0].side], ['gable', 42, 1.2, false, 1, 1]);
  assert.ok(t.dormers[0].id);
  assert.deepEqual(t.skylights, [{ id: 's' }]);
  assert.deepEqual(t.parts, [{ id: 'own' }]);
  const list = T.cleanOwn([{ name: ' Mein Dach ', roof: { type: 'weird', pitch: 99 } }, { name: '', roof: {} }, 'x', ...Array(20).fill({ name: 'a', roof: {} })]);
  assert.equal(list.length, T.MAX_OWN);
  assert.deepEqual(list[0], { name: 'Mein Dach', roof: { type: 'gable', pitch: 70 } });
});
