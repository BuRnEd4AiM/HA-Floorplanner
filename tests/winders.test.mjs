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

/* ---- #671 (Oely99): an L stair that turns twice the same way ("unten und oben viertelgewendelt"), no first flight, steps per storey ---- */
const H2 = 2.75;
const row = { ...S.stairDefaults('L'), w: 0.95, tread: 0.27, corner: 'winder', winders: 3, split: 0, corner2: 'winder', winders2: 5, split2: 6 };

test('a second corner: only on L stairs, winders as many as set (2 .. 6) or as at the first corner', () => {
  assert.equal(W.hasCorner2({ type: 'L', corner2: 'winder' }), true);
  assert.equal(W.hasCorner2({ type: 'L', corner2: 'landing' }), true);
  assert.equal(W.hasCorner2({ type: 'U', corner2: 'winder' }), false);
  assert.equal(W.hasCorner2({ type: 'L', corner2: 'bogus' }), false);
  assert.equal(W.winderCount2({ type: 'L', corner2: 'winder', winders2: 5 }), 5);
  assert.equal(W.winderCount2({ type: 'L', corner2: 'winder', winders2: 9 }), 6);
  assert.equal(W.winderCount2({ type: 'L', corner2: 'winder', w: 1, tread: 0.27 }), 3);
  assert.equal(W.winderCount2({ type: 'L', corner2: 'landing', winders2: 5 }), 0);
});

test('the steps of a stair with two corners: flight 1, corner, middle flight, corner, last flight; split 0 with winders: no first flight', () => {
  assert.deepEqual(W.flightSplit(row, 14), { n1: 0, c: 3, n2: 6, c2: 5, n3: 0 });
  assert.deepEqual(W.flightSplit({ ...row, split2: 4 }, 14), { n1: 0, c: 3, n2: 4, c2: 5, n3: 2 });
  assert.deepEqual(W.flightSplit({ type: 'L', corner2: 'landing' }, 16), { n1: 3, c: 1, n2: 8, c2: 1, n3: 3 }, 'without split: a long middle flight');
  assert.deepEqual(W.flightSplit({ type: 'L', corner2: 'landing', split: 0 }, 16), { n1: 3, c: 1, n2: 8, c2: 1, n3: 3 }, 'a landing needs a first flight');
  assert.deepEqual(W.flightSplit({ type: 'L', corner: 'winder', winders: 3, split: 0 }, 14), { n1: 0, c: 3, n2: 11 }, 'one corner, no first flight');
  assert.deepEqual(W.flightSplit({ ...row, split2: 40 }, 14), { n1: 0, c: 3, n2: 6, c2: 5, n3: 0 }, 'the middle flight takes at most what is left');
});

test('Oely99\'s row-house stair: 0.95 m wide, 2.75 m storey, 14 steps, 3 winders at the bottom, a flight, 5 winders at the top', () => {
  const c = S.stairCounts(row, H2);
  assert.deepEqual([c.T, c.n1, c.c, c.n2, c.c2, c.n3], [14, 0, 3, 6, 5, 0]);
  const { treads, hole } = S.stairLocal(row, H2), { rise } = S.stairSteps(H2, row);
  assert.equal(treads.length, 14);
  treads.forEach((t, i) => near(t.top, (i + 1) * rise));
  assert.deepEqual(treads.map((t) => !!t.winder), [...Array(3).fill(true), ...Array(6).fill(false), ...Array(5).fill(true)]);
  const w = 0.95, foot = 2 * w * w + 6 * 0.27 * w;
  near(treads.reduce((s, t) => s + area(t.poly), 0), foot, 1e-6);   // the steps do not overlap ...
  near(area(hole), foot, 1e-6);                                      // ... and the opening is just the stair
  const last = treads.at(-1).poly.at(-1);                            // the last winder leaves back along -x, beside the middle flight
  near(last[0], 0); near(last[1], w / 2 + 6 * 0.27 + w);
  const b = S.stairBounds({ ...row, x: 0, z: 0, rot: 0 }, H2);
  near(b.x0, 0); near(b.x1, w); near(b.z0, -w / 2); near(b.z1, w / 2 + 6 * 0.27 + w);
  const lb = S.stairBounds({ ...row, turn: 'left', x: 0, z: 0, rot: 0 }, H2);
  near(lb.z1, w / 2); near(lb.z0, -(w / 2 + 6 * 0.27 + w));          // turned to the left: mirrored
});

test('two landings and three flights: the last flight comes back beside the first, the opening is one piece', () => {
  const st = { ...S.stairDefaults('L'), corner2: 'landing', landing: 0.3 };
  const { treads, hole, arrow } = S.stairLocal(st, 3), c = S.stairCounts(st, 3);
  assert.equal(treads.length, c.T);
  const { rise } = S.stairSteps(3);
  treads.forEach((t, i) => near(t.top, (i + 1) * rise));
  near(area(hole), treads.reduce((s, t) => s + area(t.poly), 0), 1e-6);
  assert.equal(arrow.length, 4);
  assert.ok(arrow.at(-1)[0] < arrow.at(-2)[0], 'the arrow ends going back');
  const two = S.stairLocal({ ...st, floors: 2 }, 3);
  assert.equal(two.treads.length, 2 * c.T, 'over two floors the same stair again');
});

test('steps per storey (#671): about 18 cm high by themselves, or as many as set (from 25 cm down to 12 cm high)', () => {
  assert.equal(S.autoSteps(3), 16);
  assert.equal(S.autoSteps(2.75), 14, 'a storey of 2.75 m: 14 steps');
  assert.deepEqual(S.stepsRange(3), [11, 24]);
  assert.equal(S.stairSteps(3, { steps: 14 }).n, 15);
  near(S.stairSteps(3, { steps: 14 }).rise, 0.2);
  assert.equal(S.stairSteps(3, { steps: 4 }).n, 12, 'too steep: kept to 25 cm');
  assert.equal(S.stairSteps(3, { steps: 99 }).n, 25);
  assert.equal(S.stairSteps(3, { steps: '' }).n, 17, 'nothing set: by itself');
  assert.equal(S.stairCounts({ ...S.stairDefaults('straight'), steps: 13 }, 3).T, 13);
  assert.equal(S.stairLocal({ ...S.stairDefaults('spiral'), steps: 12 }, 3).treads.filter((t) => !t.exit).length, 12);
  assert.equal(S.stairLocal({ type: 'wall', w: 0.9, tread: 0.27, path: [[0, 0], [4, 0]], steps: 12 }, 3).treads.length, 12);
});

test('without a first flight the length handle and the field "Länge" set the next flight', () => {
  const st = { ...S.stairDefaults('L'), corner: 'winder', winders: 3, split: 0, tread: 0.25 };
  const c = S.stairCounts(st, 3);
  near(S.stairLength(st, 3), c.n2 * 0.25);
  const h = S.stairHandles(st, 3);
  near(h.len[0], 0.5); near(h.len[1], 0.5 + c.n2 * 0.25);
  assert.equal(S.treadAt(st, 3, h.len[0], h.len[1]), 0.25);
  assert.equal(S.treadAt(st, 3, 0.5, 0.5 + c.n2 * 0.3), 0.3);
  near(h.wid[1], -0.5, 1e-9);                                        // the width handle on the outer side of the winders
  assert.equal(S.treadAt({ ...S.stairDefaults('L'), split: 5 }, 3, 5 * 0.3, 0), 0.3, 'with a first flight as before');
});
