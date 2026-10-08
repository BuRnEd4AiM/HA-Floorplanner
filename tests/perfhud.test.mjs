// Unit tests for perfhud.js (performance display; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/perfhud.js`);

const info = { calls: 120, tris: 345678, geo: 80, tex: 12, prog: 9, w: 1920, h: 1080, ratio: 1, low: false, idle: false, gpu: 'Test GPU', mem: 42, screen: '1920×1080 @1' };

test('the modes go round: off, FPS, all values', () => {
  assert.equal(P.nextMode('off'), 'fps');
  assert.equal(P.nextMode('fps'), 'all');
  assert.equal(P.nextMode('all'), 'off');
  assert.equal(P.nextMode('junk'), 'off');
});

test('start: the address wins, then what the browser remembers', () => {
  assert.equal(P.startMode(null, null), 'off');
  assert.equal(P.startMode(null, 'all'), 'all');
  assert.equal(P.startMode(null, 'junk'), 'off');
  assert.equal(P.startMode('1', null), 'fps');
  assert.equal(P.startMode('all', 'fps'), 'all');
  assert.equal(P.startMode('0', 'all'), 'off');
});

test('frames of the last second are counted, older ones are not', () => {
  const times = [0, 200, 1100, 1116, 1132, 1150], works = [50, 50, 4, 6, 5, 9];
  const s = P.frameStats(times, works, 1150);
  assert.equal(s.fps, 5);                       // 200 … 1150 lies inside, 0 is older than one second
  assert.equal(s.max, 900);
  assert.ok(Math.abs(s.avg - 237.5) < 1e-9);
  assert.equal(s.workMax, 50);
  assert.deepEqual(P.frameStats([], [], 500), { fps: 0, avg: 0, max: 0, work: 0, workMax: 0 });
});

test('the lines of the box', () => {
  const s = { fps: 60, avg: 16.7, max: 20, work: 3, workMax: 5 };
  assert.deepEqual(P.hudLines('off', s, info, 'de'), []);
  assert.deepEqual(P.hudLines('fps', s, info, 'de'), ['60 FPS']);
  assert.deepEqual(P.hudLines('fps', s, { ...info, idle: true }, 'de'), ['60 FPS 💤']);
  const all = P.hudLines('all', s, info, 'de');
  assert.equal(all[0], '60 FPS · Normal · aktiv');
  assert.ok(all.includes('Zeichenaufrufe: 120 · Dreiecke: 346 k'));
  assert.ok(all.includes('Grafik: Test GPU'));
  assert.ok(all.includes('Speicher: 42 MB'));
  const noMem = P.hudLines('all', s, { ...info, mem: null, gpu: '' }, 'en');
  assert.ok(!noMem.some((l) => l.startsWith('Memory') || l.startsWith('GPU')));
});

test('every language has the button texts; missing line labels fall back to English', () => {
  for (const l of ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl']) for (const k of ['btn', 'off', 'fps', 'all', 'tip']) assert.ok(P.tx(l, k), `${l}.${k}`);
  assert.equal(P.tx('fr', 'calls'), 'Draw calls');
  assert.equal(P.tx('xx', 'btn'), 'Performance');
});
