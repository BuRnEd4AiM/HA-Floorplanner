// Unit tests for floorrail.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/floorrail.js`);

/** a canvas that only records what is drawn */
function fakeCanvas(W = 240, H = 130) {
  const polys = []; let cur = [];
  const ctx = { clearRect() {}, beginPath() { cur = []; }, moveTo(x, y) { cur.push([x, y]); }, lineTo(x, y) { cur.push([x, y]); }, closePath() {},
    fill() { polys.push({ q: cur, fill: this.fillStyle }); }, stroke() { polys.push({ q: cur, stroke: this.strokeStyle }); } };
  return { width: W, height: H, polys, getContext: () => ctx };
}
const opts = { holo: false, accent: '#3df2ff', wallHeight: 2.6 };
const floor = (over = {}) => ({ walls: [{ a: [0, 0], b: [8, 0], openings: [{ type: 'window', pos: 4, width: 1.2, height: 1.2, sill: 0.9 }] }, { a: [8, 0], b: [8, 6] }, { a: [8, 6], b: [0, 6] }, { a: [0, 6], b: [0, 0] }],
  rooms: [{ points: [[0, 0], [8, 0], [8, 6], [0, 6]], color: '#aabbcc' }], devices: [], ...over });

test('shade: scales #rrggbb, clamps, leaves other values alone', () => {
  assert.equal(R.shade('#808080', 0.5), 'rgb(64,64,64)');
  assert.equal(R.shade('#ffffff', 2), 'rgb(255,255,255)');
  assert.equal(R.shade('red', 0.5), 'red');
  assert.equal(R.shade(undefined, 0.5), '#888');
});
test('an empty floor draws nothing', () => {
  const cv = fakeCanvas();
  R.drawThumb(cv, { walls: [], rooms: [], devices: [] }, null, opts);
  assert.equal(cv.polys.length, 0);
});
test('a floor draws rooms, wall faces and window; everything stays inside the picture', () => {
  const cv = fakeCanvas();
  R.drawThumb(cv, floor(), null, opts);
  assert.ok(cv.polys.length >= 1 + 4 * 2 + 1, String(cv.polys.length));
  assert.ok(cv.polys.some((p) => p.fill === 'rgb(156,201,238)' || /^rgb\(1[0-9]{2},2[0-9]{2},2[0-9]{2}\)$/.test(p.fill || '')), 'window colour');
  for (const p of cv.polys) for (const [x, y] of p.q) assert.ok(x >= -1 && x <= 241 && y >= -1 && y <= 131, `${x},${y}`);
});
test('holo style draws outlines in the accent colour instead of filled walls', () => {
  const cv = fakeCanvas();
  R.drawThumb(cv, floor({ rooms: [] }), null, { ...opts, holo: true });
  assert.ok(cv.polys.some((p) => p.stroke === '#3df2ff'));
  assert.ok(!cv.polys.some((p) => p.fill === 'rgb(217,212,204)'));
});
test('a roof is drawn as two slopes and a gable end', () => {
  const cv = fakeCanvas();
  R.drawThumb(cv, { kind: 'roof', walls: [], rooms: [], devices: [] }, { x0: 0, x1: 10, z0: 0, z1: 6 }, opts);
  assert.equal(cv.polys.filter((p) => p.fill).length, 3);
});
