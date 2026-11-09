/* The calendar card (#495, the owner: "verschiedene Kalender … zusätzlich eine Karte einfach mit Terminkalendern"; pictures
 * docs/ideen-4.9/5-kalender.jpg and 6-kalender-einstellen.jpg): an own card of a page with several of Home Assistant's calendars, each in
 * its colour, for a time span (today and tomorrow, 7 or 14 days, a month), as a week (a column per day), a list, a month or only the
 * next event, and "＋ Termin" that puts a new event straight into a calendar of Home Assistant. Pure (unit test: tests/calcard.test.mjs;
 * boards.py checks the card the same way); calcardui.js asks the add-on (api/calendar/events) and draws. */

export const CAL_VIEWS = ['week', 'list', 'month', 'next'];
export const CAL_DAYS = [2, 7, 14, 31];
export const CAL_COLORS = ['blue', 'orange', 'green', 'red', 'purple', 'grey'];
export const CAL_HEX = { blue: '#3fa9f5', orange: '#f5a623', green: '#46a758', red: '#e5484d', purple: '#c678dd', grey: '#8b98a5' };
export const MAX_CALS = 10;
export const CALENDAR_ID = /^calendar\.[a-z0-9_]{1,200}$/;

/** the calendars of a card made safe: [{ id, color }], each once, at most MAX_CALS; a calendar without a colour takes the next free one */
export function cleanCals(v) {
  const out = [];
  (Array.isArray(v) ? v : []).forEach((c) => {
    const id = typeof c === 'string' ? c : c?.id;
    if (typeof id !== 'string' || !CALENDAR_ID.test(id) || out.some((x) => x.id === id) || out.length >= MAX_CALS) return;
    const color = CAL_COLORS.includes(c?.color) ? c.color : CAL_COLORS[out.length % CAL_COLORS.length];
    out.push({ id, color });
  });
  return out;
}

export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const dateOf = (s) => (isDate(s) ? new Date(`${s}T00:00:00`) : new Date(s));

/**
 * The days a card shows: { start, end (Dates, end the midnight after the last day), days: [Date] }. A month: the weeks from the Monday
 * on or before the 1st to the Sunday on or after the last day; else from today on, card.days days.
 */
export function calWindow(card, now = new Date()) {
  let start, n;
  if (card?.view === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1), last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    start = addDays(first, -((first.getDay() + 6) % 7));
    n = Math.round((addDays(last, 7 - ((last.getDay() + 6) % 7)) - start) / 86400000);
  } else {
    start = midnight(now);
    n = CAL_DAYS.includes(card?.days) ? card.days : 7;
  }
  const days = Array.from({ length: n }, (_, i) => addDays(start, i));
  return { start, end: addDays(start, n), days };
}

/**
 * An event of the add-on ({ s, e, allDay, title, cal }) as the card draws it: { title, cal, color, allDay, start, end (Dates; an all-day
 * event's end the midnight after its last day) }, null when it has no start or its calendar is not one of the card's.
 */
export function eventOf(ev, cals) {
  const cal = (cals || []).find((c) => c.id === ev?.cal);
  if (!cal || typeof ev.s !== 'string') return null;
  const start = dateOf(ev.s);
  if (Number.isNaN(+start)) return null;
  let end = ev.e ? dateOf(ev.e) : null;
  if (!end || Number.isNaN(+end) || end <= start) end = ev.allDay ? addDays(start, 1) : new Date(+start + 3600000);
  return { title: String(ev.title || ''), cal: cal.id, color: cal.color, allDay: !!ev.allDay, start, end };
}

const order = (a, b) => Number(b.allDay || b.cont) - Number(a.allDay || a.cont) || a.start - b.start || a.title.localeCompare(b.title);

/**
 * The events by day: Map(dayKey -> [{ ...event, cont (it began on an earlier day) }]) for the days of the window, all-day ones first, then
 * by time. An event lasting several days stands on each of its days.
 */
export function eventsByDay(events, cals, days) {
  const out = new Map((days || []).map((d) => [dayKey(d), []]));
  (events || []).map((ev) => eventOf(ev, cals)).filter(Boolean).forEach((ev) => {
    (days || []).forEach((d) => {
      const from = d, to = addDays(d, 1);
      if (ev.start < to && ev.end > from) out.get(dayKey(d)).push({ ...ev, cont: ev.start < from });
    });
  });
  out.forEach((l) => l.sort(order));
  return out;
}

/**
 * The next events, at most n: those going on now or to come, by their start. An all-day event that began on an earlier day (the
 * holidays since Monday) is left out; one of today counts.
 */
export function upcoming(events, cals, now = new Date(), n = 3) {
  const today = midnight(now);
  return (events || []).map((ev) => eventOf(ev, cals)).filter((ev) => ev && ev.end > now && !(ev.allDay && ev.start < today))
    .sort((a, b) => a.start - b.start || order(a, b)).slice(0, n);
}
/** the next event (upcoming), null when none is */
export const nextEvent = (events, cals, now = new Date()) => upcoming(events, cals, now, 1)[0] || null;

/** "today" | "tomorrow" | null for a day */
export function dayWord(d, now = new Date()) {
  const k = dayKey(d);
  return k === dayKey(now) ? 'today' : k === dayKey(addDays(now, 1)) ? 'tomorrow' : null;
}

/** the minutes of getTimezoneOffset() as Home Assistant reads a time zone: -120 -> "+02:00" */
export function isoOffset(minutes) {
  const m = -Math.round(minutes || 0), a = Math.abs(m);
  return `${m < 0 ? '-' : '+'}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}
const HM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * "＋ Termin": what was typed -> the data of Home Assistant's calendar.create_event, or { error } (the key of the text to show).
 * f: { title, day ('YYYY-MM-DD'), allDay, from ('HH:MM'), to ('HH:MM', empty: an hour later; earlier than from: the next day), toDay
 * (the last day of an all-day event, empty: the same day) }; offsetOf(date text, time text) -> the minutes of getTimezoneOffset() then.
 */
export function newEvent(f, offsetOf = () => new Date().getTimezoneOffset()) {
  const title = String(f?.title || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 200);
  if (!title) return { error: 'cal.needTitle' };
  if (!isDate(f.day) || Number.isNaN(+new Date(`${f.day}T00:00:00`))) return { error: 'cal.needDay' };
  if (f.allDay) {
    const last = isDate(f.toDay) && f.toDay >= f.day ? f.toDay : f.day;
    return { summary: title, start_date: f.day, end_date: dayKey(addDays(new Date(`${last}T00:00:00`), 1)) };
  }
  if (!HM.test(f.from || '')) return { error: 'cal.needTime' };
  const start = new Date(`${f.day}T${f.from}:00`);
  let end = HM.test(f.to || '') ? new Date(`${f.day}T${f.to}:00`) : new Date(+start + 3600000);
  if (end <= start) { const n = addDays(end, 1); end = new Date(n.getFullYear(), n.getMonth(), n.getDate(), end.getHours(), end.getMinutes()); }   // 22:00 to 01:00: into the next day
  const text = (d) => `${dayKey(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
  const at = (d) => `${text(d)}${isoOffset(offsetOf(dayKey(d), text(d).slice(11, 16)))}`;
  return { summary: title, start_date_time: at(start), end_date_time: at(end) };
}
