/* calcard.js (#495): the calendar card: its calendars and colours, its days, the events by day, the next one, "＋ Termin" */
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/calcard.js`);
const K = await import(`${process.env.STATIC_DIR || '/tmp/static'}/cards.js`);

test('the calendars of a card: each once, a colour each', () => {
  assert.deepEqual(C.cleanCals([{ id: 'calendar.familie', color: 'green' }, 'calendar.arbeit', { id: 'calendar.familie' }, { id: 'Calendar.X' }, 7, { id: 'calendar.s', color: 'pink' }]),
    [{ id: 'calendar.familie', color: 'green' }, { id: 'calendar.arbeit', color: 'orange' }, { id: 'calendar.s', color: 'green' }]);
  assert.equal(C.cleanCals(Array.from({ length: 15 }, (_, i) => `calendar.c${i}`)).length, C.MAX_CALS);
  const card = K.cleanCard({ id: 'c_cal', type: 'calendar', cals: ['calendar.a'], days: 5, view: 'year' });
  assert.deepEqual(card, { id: 'c_cal', type: 'calendar', name: '', width: 3, cals: [{ id: 'calendar.a', color: 'blue' }], days: 7, view: 'week', add: true });
  assert.equal(K.cleanCard({ id: 'c_cal', type: 'calendar', cals: [] }), null);
  assert.equal(K.cleanCard({ id: 'c_cal', type: 'calendar', cals: ['calendar.a'], add: false, view: 'list', days: 14 }).add, false);
});

test('the days of the card: from today, or the weeks of the month', () => {
  const now = new Date(2026, 9, 22, 18, 30);                 // Thursday
  const w = C.calWindow({ days: 7 }, now);
  assert.equal(w.days.length, 7); assert.equal(C.dayKey(w.start), '2026-10-22'); assert.equal(C.dayKey(w.end), '2026-10-29');
  assert.equal(C.calWindow({ days: 2 }, now).days.length, 2);
  const m = C.calWindow({ view: 'month', days: 2 }, now);
  assert.equal(C.dayKey(m.start), '2026-09-28');           // the Monday before the 1st
  assert.equal(C.dayKey(m.days.at(-1)), '2026-11-01');     // the Sunday after the 31st
  assert.equal(m.days.length % 7, 0);
  assert.ok((m.end - m.start) / 86400000 <= 42);
});

test('the events by day: several days, all day first, only the card\'s calendars', () => {
  const now = new Date(2026, 9, 22, 8, 0), cals = [{ id: 'calendar.a', color: 'blue' }, { id: 'calendar.b', color: 'red' }];
  const at = (d, h, m, title, cal = 'calendar.a', len = 1) => ({ s: new Date(2026, 9, d, h, m).toISOString(), e: new Date(2026, 9, d, h + len, m).toISOString(), allDay: false, title, cal });
  const ev = [at(22, 15, 0, 'Zahnarzt'), at(22, 9, 0, 'Team', 'calendar.b'), { s: '2026-10-22', e: '2026-10-25', allDay: true, title: 'Ferien', cal: 'calendar.a' },
    at(23, 23, 0, 'Nachtfahrt', 'calendar.a', 3), at(22, 10, 0, 'fremd', 'calendar.x'), { s: 'kaputt', title: 'x', cal: 'calendar.a' }];
  const by = C.eventsByDay(ev, cals, C.calWindow({ days: 7 }, now).days);
  assert.deepEqual(by.get('2026-10-22').map((e) => e.title), ['Ferien', 'Team', 'Zahnarzt']);
  assert.equal(by.get('2026-10-22')[1].color, 'red');
  assert.deepEqual(new Set(by.get('2026-10-24').map((e) => e.title)), new Set(['Ferien', 'Nachtfahrt']));
  assert.ok(by.get('2026-10-24').every((e) => e.cont));
  assert.deepEqual(by.get('2026-10-25'), []);               // the all-day event ends the day before its end date
  const next = C.nextEvent(ev, cals, new Date(2026, 9, 22, 9, 30));
  assert.equal(next.title, 'Ferien');                        // going on (all day)
  assert.equal(C.nextEvent(ev.filter((e) => !e.allDay), cals, new Date(2026, 9, 22, 10, 30)).title, 'Zahnarzt');
  assert.equal(C.nextEvent([], cals, now), null);
  const later = C.upcoming(ev, cals, new Date(2026, 9, 23, 7, 0));        // the holidays began yesterday: left out
  assert.deepEqual(later.map((e) => e.title), ['Nachtfahrt']);
  assert.equal(C.upcoming(ev, cals, new Date(2026, 9, 22, 8, 0), 2).length, 2);
  assert.equal(C.dayWord(new Date(2026, 9, 23), now), 'tomorrow'); assert.equal(C.dayWord(new Date(2026, 9, 25), now), null);
});

test('"＋ Termin": a title, a day, all day or from / to with the time zone', () => {
  const off = () => -120;                                    // Berlin in summer: +02:00
  assert.deepEqual(C.newEvent({ title: ' Zahnarzt ', day: '2026-10-23', from: '15:00', to: '16:30' }, off),
    { summary: 'Zahnarzt', start_date_time: '2026-10-23T15:00:00+02:00', end_date_time: '2026-10-23T16:30:00+02:00' });
  assert.equal(C.newEvent({ title: 'Kino', day: '2026-10-23', from: '20:15' }, off).end_date_time, '2026-10-23T21:15:00+02:00');   // an hour
  assert.equal(C.newEvent({ title: 'Nacht', day: '2026-10-31', from: '22:00', to: '01:00' }, off).end_date_time, '2026-11-01T01:00:00+02:00');
  assert.deepEqual(C.newEvent({ title: 'Ferien', day: '2026-10-26', allDay: true, toDay: '2026-10-30' }), { summary: 'Ferien', start_date: '2026-10-26', end_date: '2026-10-31' });
  assert.equal(C.newEvent({ title: 'Ferien', day: '2026-10-31', allDay: true }).end_date, '2026-11-01');
  assert.equal(C.newEvent({ title: '', day: '2026-10-23', allDay: true }).error, 'cal.needTitle');
  assert.equal(C.newEvent({ title: 'x', day: '23.10.2026', allDay: true }).error, 'cal.needDay');
  assert.equal(C.newEvent({ title: 'x', day: '2026-10-23', from: '25:00' }).error, 'cal.needTime');
  assert.equal(C.isoOffset(-120), '+02:00'); assert.equal(C.isoOffset(300), '-05:00'); assert.equal(C.isoOffset(-330), '+05:30'); assert.equal(C.isoOffset(0), '+00:00');
});
