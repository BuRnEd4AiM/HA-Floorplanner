// Unit tests for today.js (the page ☀ Heute of the tab bar, #479; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const T = await import(`${process.env.STATIC_DIR || '/tmp/static'}/today.js`);
const now = new Date(2026, 9, 21, 14, 30);               // Wednesday, 21 October 2026, 14:30 (local time)
const at = (d, h, m = 0) => new Date(2026, 9, d, h, m).toISOString();

test('weather: an icon per condition, the entity of the settings or the first one', () => {
  assert.equal(T.wxIcon('sunny'), '☀️'); assert.equal(T.wxIcon('clear-night'), '🌙'); assert.equal(T.wxIcon('nonsense'), '🌡️');
  const st = { 'weather.b': { state: 'sunny' }, 'weather.a': { state: 'rainy' }, 'light.x': {} };
  assert.equal(T.weatherEntity({ weatherEntity: 'weather.b' }, st), 'weather.b');
  assert.equal(T.weatherEntity({ weatherEntity: 'weather.gone' }, st), 'weather.a');
  assert.equal(T.weatherEntity({}, {}), '');
});
test('forecast: the days from today on, each once, at most five', () => {
  const f = [20, 21, 21, 22, 23, 24, 25, 26].map((d, i) => ({ t: `2026-10-${d}T00:00:00`, c: 'rainy', hi: 10 + i, lo: 2, pp: 30 }));
  const days = T.nextDays(f, now);
  assert.equal(days.length, 5);
  assert.equal(days[0].date.getDate(), 21); assert.equal(days[0].hi, 11);                 // yesterday dropped, today's first row
  assert.equal(days[4].date.getDate(), 25);
  assert.deepEqual(T.nextDays(null, now), []);
});
test('agenda: today and tomorrow apart, all-day first, several days count on each, the waste calendar on its own', () => {
  const ev = [
    { s: at(21, 17, 30), e: at(21, 19), allDay: false, title: 'Fußball', cal: 'calendar.familie' },
    { s: at(21, 9), allDay: false, title: 'Zahnarzt', cal: 'calendar.familie' },
    { s: '2026-10-20', e: '2026-10-23', allDay: true, title: 'Ferien', cal: 'calendar.familie' },
    { s: at(22, 8), allDay: false, title: 'Bäcker', cal: 'calendar.familie' },
    { s: '2026-10-22', e: '2026-10-23', allDay: true, title: 'Gelber Sack', cal: 'calendar.muell' },
    { s: '2026-10-19', e: '2026-10-20', allDay: true, title: 'Papier (vorbei)', cal: 'calendar.muell' },
    { s: '2026-10-30', e: '2026-10-31', allDay: true, title: 'Restmüll', cal: 'calendar.muell' },
    { s: at(25, 9), allDay: false, title: 'später', cal: 'calendar.familie' }, null, { title: 'kaputt' }];
  const a = T.agendaDays(ev, now, 'calendar.muell');
  assert.deepEqual(a.today.map((x) => x.title), ['Ferien', 'Zahnarzt', 'Fußball']);
  assert.deepEqual(a.tomorrow.map((x) => x.title), ['Ferien', 'Bäcker']);
  assert.equal(a.today[1].time.getHours(), 9); assert.equal(a.today[0].time, null);
  assert.deepEqual(a.waste.map((x) => [x.title, typeof x.when === 'string' ? x.when : x.when.getDate()]), [['Gelber Sack', 'tomorrow'], ['Restmüll', 30]]);
  assert.equal(T.agendaDays(ev, now, '').today.length, 3);                                  // without a waste calendar: the bins are events too
});
test('people: at home first, the zone when away somewhere known', () => {
  const p = T.people({ 'person.max': { state: 'Arbeit', name: 'Max' }, 'person.anna': { state: 'home', name: 'Anna' }, 'person.lena': { state: 'not_home', name: 'Lena' },
    'person.oma': { state: 'unknown', name: 'Oma' }, 'sensor.x': { state: 'home' } });
  assert.deepEqual(p.map((x) => [x.name, x.home, x.where]), [['Anna', true, ''], ['Lena', false, ''], ['Max', false, 'Arbeit'], ['Oma', false, null]]);
  assert.equal(T.people({ 'person.max': { state: 'home' } }, { 'person.max': 'Max M.' })[0].name, 'Max M.');      // the name Home Assistant gives
  assert.equal(T.people({ 'person.max': { state: 'home' } })[0].name, 'max');
});
test('in the house: only rows with something to say; the alarm when armed', () => {
  assert.deepEqual(T.houseRows({}), []);
  const r = T.houseRows({ open: ['Küche', 'Bad', 'Flur', 'Büro', 'Keller'], lights: 3, alarm: { state: 'armed_away' }, low: 2, offline: 0 });
  assert.deepEqual(r.map((x) => x.key), ['open', 'lights', 'alarm', 'low']);
  assert.equal(r[0].n, 5); assert.equal(r[0].names.length, 4);
  assert.deepEqual(T.houseRows({ alarm: { state: 'disarmed' } }), []);
  assert.deepEqual(T.alarmPanel({ 'alarm_control_panel.haus': { state: 'disarmed', name: 'Haus' } }), { id: 'alarm_control_panel.haus', name: 'Haus', state: 'disarmed' });
  assert.equal(T.alarmPanel({}), null);
});
test('the days asked for: from today a week ahead', () => {
  const s = T.agendaSpan(now);
  assert.equal(+s.start, +new Date(2026, 9, 21)); assert.equal(+s.end, +new Date(2026, 9, 29));
});
