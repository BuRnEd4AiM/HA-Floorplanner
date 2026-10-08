// Unit tests for timeline.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const T = await import(`${process.env.STATIC_DIR || '/tmp/static'}/timeline.js`);

const day = {
  start: 1000, end: 1000 + 86400, now: 5000,
  lines: [
    { t: 1000, snap: { 'light.a': { state: 'off' }, 'binary_sensor.door': { state: 'off' } } },
    { t: 1200, e: 'light.a', s: { state: 'on', brightness: 50 } },
    { t: 1300, e: 'light.a', s: { state: 'on', brightness: 90 } },
    { t: 1400, e: 'binary_sensor.door', s: { state: 'on' } },
    { t: 1350, e: 'sensor.temp', s: { state: '21.5', unit: '°C' } },
    { t: 1500, e: 'light.a', s: { state: 'off' } },
    { t: 'x', e: 'light.a', s: {} },
    { t: 1600, e: 'light.b' },
  ],
};

test('a day is parsed in time order, junk left out, today ends now', () => {
  const d = T.parseDay(day);
  assert.equal(d.frames.length, 6);
  assert.deepEqual(d.frames.map((f) => f.t), [1000, 1200, 1300, 1350, 1400, 1500]);
  assert.equal(d.end, 5000);
  assert.equal(T.parseDay({ ...day, now: 999999 }).end, 1000 + 86400);
  assert.deepEqual(T.parseDay(null).frames, []);
});

test('the player knows the states at any moment, forwards and back', () => {
  const { frames } = T.parseDay(day);
  for (const every of [400, 2]) {
    const p = T.makePlayer(frames, every);
    assert.equal(p.seek(1100).states['light.a'].state, 'off');
    assert.equal(p.seek(1250).states['light.a'].brightness, 50);
    assert.equal(p.seek(1450).states['binary_sensor.door'].state, 'on');
    assert.equal(p.seek(1450).states['light.a'].brightness, 90);
    assert.equal(p.seek(1210).states['binary_sensor.door'].state, 'off');      // back again
    assert.equal(p.seek(1210).states['light.a'].brightness, 50);
    assert.equal(p.seek(999).states['light.a'], undefined);
    assert.equal(p.seek(99999).states['light.a'].state, 'off');
  }
});

test('the states of one seek are not changed by the next', () => {
  const p = T.makePlayer(T.parseDay(day).frames);
  const a = p.seek(1250).states;
  p.seek(1600);
  assert.equal(a['light.a'].brightness, 50);
});

test('events: only real switches, not a dimmed lamp or a sensor value', () => {
  const ev = T.eventList(T.parseDay(day).frames);
  assert.deepEqual(ev.map((e) => [e.t, e.id, e.from, e.to]), [[1200, 'light.a', 'off', 'on'], [1400, 'binary_sensor.door', 'off', 'on'], [1500, 'light.a', 'on', 'off']]);
  assert.equal(T.eventKind(ev[0]), 'on');
  assert.equal(T.eventKind(ev[2]), 'off');
  assert.equal(T.eventKind({ to: 'unavailable' }), 'other');
});

test('jumping from event to event', () => {
  const ev = T.eventList(T.parseDay(day).frames);
  assert.equal(T.nextEvent(ev, 1000).t, 1200);
  assert.equal(T.nextEvent(ev, 1200).t, 1400);
  assert.equal(T.nextEvent(ev, 1500), null);
  assert.equal(T.prevEvent(ev, 1400).t, 1200);
  assert.equal(T.prevEvent(ev, 1200), null);
  assert.deepEqual(T.eventsAround(ev, 1450, 1, 1).map((e) => e.t), [1400, 1500]);
  assert.deepEqual(T.eventsAround(ev, 9999, 2, 2).map((e) => e.t), [1400, 1500]);
});

test('bars of the time line and playing on', () => {
  const ev = T.eventList(T.parseDay(day).frames);
  assert.deepEqual(T.buckets(ev, 1000, 2000, 2), [2, 1]);
  assert.deepEqual(T.buckets(ev, 1000, 2000, 0), [3]);
  assert.deepEqual(T.advance(100, 2, 60, 1000), { t: 220, done: false });
  assert.deepEqual(T.advance(990, 1, 60, 1000), { t: 1000, done: true });
});

test('days, today, clock and entity form', () => {
  assert.deepEqual(T.dayChoices([{ day: '2026-10-08', size: 5 }, { day: '../x' }, null], '2026-10-08'), [{ day: '2026-10-08', size: 5, today: true }]);
  assert.equal(T.todayIso(new Date(2026, 0, 5, 12)), '2026-01-05');
  assert.match(T.clock(0), /^\d\d:\d\d:\d\d$/);
  assert.match(T.clock(0, false), /^\d\d:\d\d$/);
});

test('the entity list as it was: recorded fields replace the live ones, the rest stays', () => {
  const live = [{ entity_id: 'light.a', name: 'Lamp', domain: 'light', state: 'on', brightness: 80, fx: ['Rainbow'] }, { entity_id: 'sensor.x', name: 'X', state: '5' }];
  const out = T.replayEntities(live, { 'light.a': { state: 'off' }, 'light.gone': { state: 'on', brightness: 10 } });
  assert.equal(out[0].state, 'off');
  assert.equal(out[0].brightness, null);                   // not recorded at that moment = empty, not today's value
  assert.equal(out[0].name, 'Lamp');
  assert.deepEqual(out[0].fx, ['Rainbow']);
  assert.equal(out[1], live[1]);
  assert.equal(out[2].entity_id, 'light.gone');
  assert.equal(out[2].brightness, 10);
  assert.equal(live[0].state, 'on');                       // the live list itself is untouched
});
