// Unit tests for sunshade.js (☀ Sonnenschutz on the page, 5.15.0): whether the sun shines on a window, the way it looks as words, what the
// card says of a shutter, the − / + of a limit that can be "egal" (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/sunshade.js`);
const cfg = { on: true, elev: 15, angle: 75, out: 22, inside: 24, pos: 30, back: 20, open: true, clouds: true, skip: [] };

test('the angle between two directions and whether the sun shines on a window (as sunshade.py)', () => {
  assert.equal(S.offAngle(350, 10), 20);
  assert.equal(S.offAngle(10, 190), 180);
  assert.equal(S.hits(cfg, 180, { az: 200, elev: 30 }), true);
  assert.equal(S.hits(cfg, 180, { az: 270, elev: 30 }), false);      // 90° to the side
  assert.equal(S.hits(cfg, 180, { az: 180, elev: 10 }), false);      // too low
  assert.equal(S.hits(cfg, null, { az: 180, elev: 30 }), false);
  assert.equal(S.hits(cfg, 180, null), false);
});

test('the way a window looks as a word', () => {
  assert.deepEqual([0, 44, 46, 90, 180, 225, 270, 337, 359, -90].map(S.dirOf), ['N', 'NO', 'NO', 'O', 'S', 'SW', 'W', 'NW', 'N', 'W']);
  assert.equal(S.dirOf(null), null);
});

test('what the card says of a shutter: the add-on first, else the sun alone', () => {
  const w = { cover: 'cover.k', bearing: 180 };
  assert.deepEqual(S.shutterState(w, cfg, null, { az: 180, elev: 40 }, false), { k: 'sun' });
  assert.deepEqual(S.shutterState(w, cfg, null, { az: 0, elev: 40 }, false), { k: 'shade' });
  assert.deepEqual(S.shutterState(w, cfg, { down: true, pos: 30, until: 99 }, null, false), { k: 'down', pos: 30, until: 99 });
  assert.deepEqual(S.shutterState(w, cfg, { down: true, hand: true, pos: 0 }, null, false), { k: 'hand', pos: 0 });
  assert.deepEqual(S.shutterState(w, cfg, { why: 'open', pos: 100 }, null, false), { k: 'open', pos: 100 });
  assert.deepEqual(S.shutterState(w, cfg, null, null, true), { k: 'skip' });
  assert.deepEqual(S.shutterState({ cover: 'cover.g', bearing: null }, cfg, null, null, false), { k: 'nodir' });
});

test('a limit of temperature goes down to "egal" and back', () => {
  assert.equal(S.stepLimit(22, 0.5), 22.5);
  assert.equal(S.stepLimit(10, -0.5), null);
  assert.equal(S.stepLimit(null, 0.5), 22);
  assert.equal(S.stepLimit(null, -0.5), null);
  assert.equal(S.stepLimit(40, 0.5), 40);
});

test('where north is: kept 0 … 359, turned in steps, the windows of the house shown follow at once', () => {
  assert.equal(S.northOf({ north: 90 }), 90);
  assert.equal(S.northOf({ north: -45 }), 315);
  assert.equal(S.northOf({}), 0);
  assert.equal(S.northOf(null), 0);
  assert.equal(S.turnNorth(0, -5), 355);
  assert.equal(S.turnNorth(355, 5), 0);
  assert.equal(S.turnNorth(42, 5), 45);
  const w = { house: 'main', plan: 180, bearing: 180 };
  assert.equal(S.bearingNow(w, 'main', 90), 270);
  assert.equal(S.bearingNow(w, 'other', 90), 180);                 // another house: as the add-on said
  assert.equal(S.bearingNow({ house: 'main', plan: null, bearing: null }, 'main', 90), null);
});

test('the own routines that move the same shutter are named (the rules must not fight)', () => {
  const flows = [{ name: 'Rollläden am Abend', on: true, lanes: [{ blocks: [{ k: 'sun', ev: 'set' }, { k: 'cover', ents: ['cover.k', 'cover.x'], do: 'close' }] }] },
    { name: 'Aus', on: false, lanes: [{ blocks: [{ k: 'cover', ents: ['cover.k'] }] }] },
    { name: 'Licht', on: true, lanes: [{ blocks: [{ k: 'switch', ents: ['cover.k'] }] }] }];
  assert.deepEqual(S.otherRules(flows, 'cover.k'), ['Rollläden am Abend']);
  assert.deepEqual(S.otherRules(flows, 'cover.y'), []);
  assert.deepEqual(S.otherRules(null, 'cover.k'), []);
});
