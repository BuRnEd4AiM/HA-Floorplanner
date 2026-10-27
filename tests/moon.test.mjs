// Unit tests for moon.js (the moon in the sky, the owner's wish of 2026-10-27; run like offline.test.mjs, see there). The values to
// compare were worked out with PyEphem for Fulda (50.55° N, 9.68° E): full moon 2026-10-26 04:12 UTC, last quarter 2026-11-01 20:28,
// new moon 2026-11-09 07:02, first quarter 2026-11-17 11:48.
import test from 'node:test';
import assert from 'node:assert/strict';

const M = await import(`${process.env.STATIC_DIR || '/tmp/static'}/moon.js`);
const t = (k) => k;
const near = (a, b, d, msg) => assert.ok(Math.abs(a - b) <= d, `${msg}: ${a} not near ${b}`);

test('the phase: full, last quarter, new, first quarter, how much is lit', () => {
  const full = M.moonPhase(new Date('2026-10-26T04:12Z'));
  assert.equal(full.key, 'full'); near(full.fraction, 0.998, 0.01, 'full');
  const after = M.moonPhase(new Date('2026-10-27T06:00Z'));             // the morning of the owner's wish: a day after the full moon
  assert.equal(after.key, 'waningGibbous'); assert.equal(after.waxing, false); near(after.fraction, 0.983, 0.01, 'waning');
  assert.equal(M.moonPhase(new Date('2026-11-01T20:28Z')).key, 'lastQuarter');
  near(M.moonPhase(new Date('2026-11-01T12:00Z')).fraction, 0.541, 0.02, 'half');
  const nm = M.moonPhase(new Date('2026-11-09T07:00Z'));
  assert.equal(nm.key, 'new'); near(nm.fraction, 0.002, 0.01, 'new');
  const fq = M.moonPhase(new Date('2026-11-17T11:48Z'));
  assert.equal(fq.key, 'firstQuarter'); assert.equal(fq.waxing, true); near(fq.cycle, 0.25, 0.02, 'cycle');
  assert.equal(M.moonPhase(new Date('2026-11-12T12:00Z')).key, 'waxingCrescent');
  assert.equal(M.moonPhase(new Date('2026-11-21T12:00Z')).key, 'waxingGibbous');
  assert.equal(M.moonPhase(new Date('2026-11-05T12:00Z')).key, 'waningCrescent');
  assert.equal(Object.keys(M.PHASE_EMOJI).join(), M.PHASES.join());
});

test('where it stands for Fulda (a degree or two)', () => {
  const at = (d) => M.moonPosition(new Date(d), 50.55, 9.68);
  let p = at('2026-10-26T22:00Z'); near(p.alt, 53.75, 1.5, 'alt'); near(p.az, 138.22, 3, 'az');      // high in the south-east
  p = at('2026-10-27T05:00Z'); near(p.alt, 24.3, 1.5, 'alt'); near(p.az, 274.38, 3, 'az');            // setting in the west
  p = at('2026-11-02T03:00Z'); near(p.alt, 43.89, 1.5, 'alt'); near(p.az, 120.98, 3, 'az');
  p = at('2026-11-14T12:00Z'); near(p.alt, 2.43, 1.5, 'alt'); near(p.az, 137.33, 3, 'az');
});

test('home: zone.home of Home Assistant, else latitude 50 and the time zone', () => {
  assert.deepEqual(M.homeGeo({ 'zone.home': { geo: { lat: 50.6, lon: 9.7 } } }, new Date()), { lat: 50.6, lon: 9.7 });
  const g = M.homeGeo({}, new Date(2026, 9, 27));
  assert.equal(g.lat, 50); assert.ok(Number.isFinite(g.lon));
  assert.equal(M.homeGeo({ 'zone.home': { geo: { lat: 'x' } } }, new Date()).lat, 50);
});

test('on the screen: east on the left, high near the top, the lit side, the southern half of the earth', () => {
  const waxing = { waxing: true }, waning = { waxing: false };
  assert.deepEqual(M.moonSpot({ alt: 0, az: 90 }, waxing, 50), { x: 15, y: 32, show: true, right: true });
  assert.deepEqual(M.moonSpot({ alt: 90, az: 180 }, waning, 50), { x: 50, y: 14, show: true, right: false });
  assert.equal(M.moonSpot({ alt: 30, az: 270 }, waxing, 50).x, 85);
  assert.equal(M.moonSpot({ alt: 30, az: 10 }, waxing, 50).x, 15);        // in the north behind the viewer: at the edge
  assert.equal(M.moonSpot({ alt: -5, az: 120 }, waxing, 50).show, false);   // under the horizon
  assert.equal(M.moonSpot({ alt: 45, az: 135 }, waxing, 50).x, 32.5);       // south-east, half way up
  const s = M.moonSpot({ alt: 20, az: 90 }, waxing, -34);                 // Sydney: looking north, east on the right, lit on the left
  assert.equal(s.x, 85); assert.equal(s.right, false);
});

test('how clearly: bright at night, pale by day, behind clouds less, none behind an overcast sky', () => {
  assert.equal(M.moonAlpha(-20, 0, 1), 1);
  assert.equal(M.moonAlpha(30, 0, 1), 0.42);
  assert.ok(M.moonAlpha(-20, 0.75, 1) < 0.5 && M.moonAlpha(-20, 0.75, 1) > 0.2);
  assert.equal(M.moonAlpha(-20, 0.95, 1), 0);
  assert.ok(M.moonAlpha(-20, 0, 0.02) < M.moonAlpha(-20, 0, 0.5));        // a thin crescent is faint
});

test('the line of the chip', () => {
  assert.equal(M.moonText(M.moonPhase(new Date('2026-10-27T06:00Z')), t), '🌖 moon.waningGibbous · 98 %');
  assert.equal(M.moonText({ key: 'full', fraction: 1 }, t), '🌕 moon.full · 100 %');
});
