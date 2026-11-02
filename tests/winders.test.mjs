// Unit tests for winders.js and the winder stairs of stairs.js (#623): an L or U stair that turns with wedge steps, a first flight longer
// than the second, a wall stair with solid steps (run like offline.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const W = await import(`${dir}/winders.js`);
const S = await import(`${dir}/stairs.js`);
const H = 2.65;
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const area = (p) => Math.abs(p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0)) / 2;

test('only L and U stairs have winders; how many: about as deep as the straight steps on the walking line', () => {
  assert.equal(W.hasWinders({ type: 'L', corner: 'winder' }), true);
  assert.equal(W.hasWinders({ type: 'L' }), false, 'a landing by default');
  assert.equal(W.hasWinders({ type: 'straight', corner: 'winder' }), false);
  assert.equal(W.winderCount({ type: 'L', corner: 'winder', w: 1, tread: 0.27 }), 3, 'a quarter turn of 1 m: 3 winders (0.26 m on the walking line)');
  assert.equal(W.winderCount({ type: 'U', corner: 'winder', w: 1, tread: 0.27 }, 0.1), 6);
  assert.equal(W.winderCount({ type: 'L', corner: 'winder', winders: 5 }), 5);
  assert.equal(W.winderCount({ type: 'L', corner: 'winder', winders: 20 }), 6, 'at most 6 on a quarter turn');
  assert.equal(W.winderCount({ type: 'U', corner: 'winder', winders: 1 }), 3, 'at least 3 on a half turn');
  assert.equal(W.winderCount({ type: 'L', winders: 4 }), 0, 'a landing has none');
});

test('the steps are shared out: about half in flight 1, or as many as set (a long first and a short second flight)', () => {
  assert.deepEqual(W.flightSplit({ type: 'L' }, 14), { n1: 6, c: 1, n2: 7 }, 'as before 4.60.0');
  assert.deepEqual(W.flightSplit({ type: 'L', split: 9 }, 14), { n1: 9, c: 1, n2: 4 });
  assert.deepEqual(W.flightSplit({ type: 'L', corner: 'winder', winders: 3, split: 9 }, 14), { n1: 9, c: 3, n2: 2 });
  assert.deepEqual(W.flightSplit({ type: 'L', split: 99 }, 14), { n1: 13, c: 1, n2: 0 }, 'flight 2 may have none');
  assert.deepEqual(W.flightSplit({ type: 'L', split: 0 }, 14), { n1: 6, c: 1, n2: 7 }, '0: about half');
});

test('the wedges of a quarter turn fill the corner square exactly, each one touches the inner corner', () => {
  const k = 4, ws = W.lWinders(2, 1, k);
  assert.equal(ws.length, k);
  near(ws.reduce((s, p) => s + area(p), 0), 1);
  ws.forEach((p) => { near(p[0][0], 2); near(p[0][1], 0.5); });
  near(ws[0][1][0], 2); near(ws[0][1][1], -0.5);                 // the first ray runs back along the end of flight 1
  near(ws.at(-1).at(-1)[0], 3); near(ws.at(-1).at(-1)[1], 0.5);  // the last one along the start of flight 2
});

test('the wedges of a half turn fill the corner of a U stair', () => {
  const w = 1, z1 = 0.6, z2 = 1.6, ws = W.uWinders(3, w, z1, z2, 6);
  near(ws.reduce((s, p) => s + area(p), 0), w * (z2 + w / 2));
});

for (const type of ['L', 'U']) {
  for (const turn of ['left', 'right']) {
    test(`${type}/${turn} with winders: one storey in even steps, the first flight as long as set`, () => {
      const st = { ...S.stairDefaults(type), turn, corner: 'winder', winders: type === 'L' ? 3 : 6, split: 8 };
      const { treads } = S.stairLocal(st, H), { n, rise } = S.stairSteps(H);
      assert.equal(treads.length, n - 1);
      treads.forEach((t, i) => near(t.top, (i + 1) * rise));
      assert.equal(treads.filter((t) => t.winder).length, st.winders);
      assert.ok(treads.slice(8, 8 + st.winders).every((t) => t.winder), 'the winders come right after flight 1');
      near(S.stairLength(st, H), 8 * st.tread);
      const b = S.stairBounds(st, H);
      assert.ok(turn === 'right' ? b.z0 > -st.w / 2 - 1e-6 : b.z1 < st.w / 2 + 1e-6, 'it turns to its side');
    });
  }
}

test('Miicki\'s cellar stair: 1 m wide, 2.65 m high, a long run, a quarter turn, a short run', () => {
  const st = { ...S.stairDefaults('L'), w: 1, tread: 0.27, corner: 'winder', winders: 3, split: 10 };
  const c = S.stairCounts(st, H);
  assert.deepEqual([c.T, c.n1, c.c, c.n2], [14, 10, 3, 1]);
  const b = S.stairBounds({ ...st, x: 0, z: 0, rot: 0 }, H);
  near(b.x1 - b.x0, 10 * 0.27 + 1, 1e-6);                        // 2.7 m of run plus the corner: about 3.7 m along the wall
});

test('a landing stays as before; its deeper landing is not used with winders', () => {
  const st = { ...S.stairDefaults('L'), landing: 0.5 };
  const a = S.stairBounds(st, H), b = S.stairBounds({ ...st, corner: 'winder' }, H);
  assert.ok(a.z1 - b.z1 > 0.4, 'winders: no deeper landing');
});

test('a wall stair can have solid steps down to the floor instead of thin plates', () => {
  const st = { type: 'wall', w: 0.9, tread: 0.27, path: [[0, 0], [3, 0], [3, 2]] };
  assert.ok(S.stairLocal(st, H).treads.every((t) => t.thin === S.THIN));
  assert.ok(S.stairLocal({ ...st, solid: true }, H).treads.every((t) => !t.thin));
});
