/* ⚡ Energie in the glass designs (5.37.0, energyglass.js): the ring, the battery's colour and the soft area of the chart */
import test from 'node:test';
import assert from 'node:assert/strict';

const E = await import(`${process.env.STATIC_DIR || '/tmp/static'}/energyglass.js`);

test('the ring: the share of the circle, cut to 0 ... 100 %', () => {
  const c = 2 * Math.PI * 30;
  assert.equal(E.ringDash(50, 30), `${(c / 2).toFixed(2)} ${c.toFixed(2)}`);
  assert.equal(E.ringDash(-5, 30), `0.00 ${c.toFixed(2)}`);
  assert.equal(E.ringDash(140, 30), `${c.toFixed(2)} ${c.toFixed(2)}`);
  assert.equal(E.ringDash(undefined, 30), `0.00 ${c.toFixed(2)}`);
});

test('the battery: green, amber, red', () => {
  assert.equal(E.levelColor(82), '#30d158');
  assert.equal(E.levelColor(50), '#30d158');
  assert.equal(E.levelColor(35), '#ff9f0a');
  assert.equal(E.levelColor(5), '#ff453a');
});

test('the soft area: up to now only, never below the floor, the dot at the last value', () => {
  const rows = [{ use: 0.5, own: 0.5 }, { use: 0.6, own: 0.1 }, { use: 1, own: 0 }, { use: 0, own: 0 }, { use: 0, own: 0 }];
  const x = (i) => 10 + i * 20, y = (v) => 100 - v * 80, base = 100;
  const a = E.areaPaths(rows, 3, x, y, base);
  assert.ok(a.total.startsWith('M10.0 60.0'));
  assert.ok(a.total.endsWith(`L50.0 ${base} L10.0 ${base} Z`), 'closed on the floor, up to the third column');
  assert.deepEqual(a.end, [50, 20]);
  const ys = [...a.ownLine.matchAll(/(-?\d+\.\d)/g)].map((m) => +m[1]).filter((_, i) => i % 2 === 1);
  assert.ok(ys.every((v) => v <= base && v >= 20), 'the curve stays between the top and the floor');
  assert.equal(E.areaPaths(rows, 0, x, y, base), null);
  assert.equal(E.areaPaths([], 5, x, y, base), null);
  const one = E.areaPaths([{ use: 1, own: 2 }], 1, x, y, base);          // more own than used: cut to what was used
  assert.ok(one.own.startsWith('M10.0 20.0'));
});

test('a smooth line through the points', () => {
  assert.equal(E.smoothLine([]), '');
  assert.equal(E.smoothLine([[0, 0]]), 'M0.0 0.0');
  assert.match(E.smoothLine([[0, 0], [10, 10], [20, 0]]), /^M0\.0 0\.0 C.* 10\.0 10\.0 C.* 20\.0 0\.0$/);
});

test('every tile icon has an emoji and a colour', () => {
  for (const [k, [ic, col]] of Object.entries(E.TILE_ICONS)) { assert.ok(ic, k); assert.match(col, /^#[0-9a-f]{6}$/, k); }
});
