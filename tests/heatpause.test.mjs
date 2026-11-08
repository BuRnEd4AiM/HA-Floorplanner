// Unit tests for heatpause.js (⏸️ Heizplan aussetzen: the choices of a thermostat's button and until when, who gets it; run like
// offline.test.mjs, see there). The add-on decides the same way: tests/test_heatrules.py (pause_until, next_block).
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/heatpause.js`);
const PLAN = { days: Array(7).fill([[0, 'night'], [360, 'comfort'], [480, 'eco'], [1020, 'comfort'], [1320, 'night']]) };
const HEAT = { pause: { on: true, opts: ['45', 'block', 'day'] }, schedule: { on: true, rooms: { 'main/r1': PLAN } } };
const MON = (h, m, s = 0) => new Date(2026, 9, 26, h, m, s);   // a Monday
const t = (k, v = {}) => `${k}${JSON.stringify(v)}`;

test('the level of a schedule, also before the first block of a day', () => {
  assert.equal(P.planAt(PLAN, 0, 12 * 60), 'eco');
  assert.equal(P.planAt({ days: [[[480, 'comfort']], [], [], [], [], [], []] }, 1, 60), 'comfort');   // Tuesday 1:00: Monday's last block
  assert.equal(P.planAt({ days: [] }, 0, 0), null);
});

test('the next block: the next change of the level (the same as heatrules.next_block)', () => {
  assert.equal(P.nextBlock(PLAN, MON(12, 30)), 4 * 60 + 30);                    // 17:00 comfort
  assert.equal(P.nextBlock(PLAN, MON(23, 0)), 7 * 60);                          // the next day's comfort (night at 0:00 is no change)
  assert.equal(P.nextBlock(null, MON(12, 30)), null);
  assert.equal(P.nextBlock({ days: Array(7).fill([[0, 'eco']]) }, MON(12, 30)), null);   // always the same: none
});

test('the choices of a button and until when, as the admin offers them', () => {
  const d = MON(12, 30, 20), c = P.pauseChoices(HEAT, 'main/r1', d);
  assert.deepEqual(c.map((x) => x.k), ['45', 'block', 'day']);
  assert.equal(c[0].until, d.getTime() + 45 * 60000);
  assert.equal(new Date(c[1].until).getHours(), 17);
  assert.equal(new Date(c[2].until).getTime(), new Date(2026, 9, 27, 0, 0).getTime());   // until midnight
  assert.deepEqual(P.pauseChoices(HEAT, 'main/r2', d).map((x) => x.k), ['45', 'day']);   // no schedule there: no "next block"
  assert.deepEqual(P.pauseChoices({ ...HEAT, schedule: { ...HEAT.schedule, on: false } }, 'main/r1', d).map((x) => x.k), ['45', 'day']);
  assert.deepEqual(P.pauseChoices({ pause: { on: true, opts: [] } }, 'x', d).map((x) => x.k), ['30', '45', '60', 'day']);   // none chosen: the usual ones
  assert.deepEqual(P.pauseChoices({ pause: { on: false } }, 'x', d), []);
  assert.deepEqual(P.pauseChoices(null, 'x', d), []);
});

test('the text of a choice', () => {
  assert.equal(P.optText('45', t), 'fl.min{"n":45}');
  assert.equal(P.optText('60', t), 'fl.hour{"n":1}');
  assert.equal(P.optText('90', t), 'fl.min{"n":90}');
  assert.equal(P.optText('block', t), 'hp.opt.block{}');
  assert.equal(P.optText('day', t), 'hp.opt.day{}');
});

test('who gets the button: the pause on, a thermostat that heats, no lock, the card does not hide it', () => {
  assert.equal(P.canPause(HEAT), true);
  assert.equal(P.canPause({ pause: { on: false } }), false);
  assert.equal(P.canPause(null), false);
  assert.equal(P.canPause(HEAT, { heater: false }), false);                     // an air conditioner: only the window rule
  assert.equal(P.canPause(HEAT, { locks: ['heatPause'] }), false);
  assert.equal(P.canPause(HEAT, { locks: ['control'] }), false);
  assert.equal(P.canPause(HEAT, { locks: ['cameras'] }), true);
  assert.equal(P.canPause(HEAT, { card: { pause: false } }), false);
  assert.equal(P.canPause(HEAT, { card: { size: 'big' } }), true);
});

test('a paused room and the text of until when', () => {
  assert.deepEqual(P.pauseState({ why: 'pause', pause: 1000 }), { on: true, until: 1000000 });
  assert.deepEqual(P.pauseState({ why: 'window', pause: 1000 }), { on: true, until: 1000000 });   // the window during the pause
  assert.deepEqual(P.pauseState({ why: 'schedule', pause: null }), { on: false, until: null });
  assert.deepEqual(P.pauseState(null), { on: false, until: null });
  const now = MON(12, 30).getTime();
  assert.equal(P.untilText(MON(13, 15).getTime(), t, now), '13:15');
  assert.equal(P.untilText(new Date(2026, 9, 27, 0, 0).getTime(), t, now), 'hp.midnight{}');
  assert.equal(P.untilText(new Date(2026, 9, 27, 6, 0).getTime(), t, now), 'hp.tomorrow{"at":"06:00"}');
});
