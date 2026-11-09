/* The page ☀ Heute of the tab bar (#481), the start page of a wall tablet: the time, the weather with its forecast, the events of today and
 * tomorrow, the waste collection, who is at home and what in the house needs a look (open windows, lights on, the alarm, low batteries,
 * devices offline). Pure (unit test: tests/today.test.mjs); pagetoday.js asks the add-on (api/forecast, api/agenda) and draws. */

import { weatherLook } from './sky.js';

/** Home Assistant's weather condition -> its icon (the same as the sky's chips, sky.js) */
export const wxIcon = (c) => weatherLook(c)?.icon || '🌡️';

/** the weather entity of the page: the one of the settings when it exists, else the first one */
export function weatherEntity(settings, states) {
  const want = settings?.weatherEntity;
  if (want && states?.[want]) return want;
  return Object.keys(states || {}).filter((e) => e.startsWith('weather.')).sort()[0] || '';
}

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** "YYYY-MM-DD" (an all-day event) or an ISO time -> the local day "YYYY-MM-DD" */
function localDay(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(+d) ? '' : dayKey(d);
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** the days of a daily forecast from today on: [{ date, c, hi, lo, pp }], at most n */
export function nextDays(forecast, now = new Date(), n = 5) {
  const today = dayKey(now), seen = new Set();
  return (forecast || []).map((f) => ({ ...f, day: localDay(f.t) })).filter((f) => f.day && f.day >= today && !seen.has(f.day) && seen.add(f.day))
    .slice(0, n).map((f) => ({ date: new Date(`${f.day}T12:00:00`), c: f.c || '', hi: f.hi ?? null, lo: f.lo ?? null, pp: f.pp ?? null }));
}

/** events of the calendars -> { today, tomorrow: [{ title, time (Date or null when all day), allDay, cal }], waste: [{ title, when:
 *  'today' | 'tomorrow' | Date }] }. An all-day event lasting several days counts on each of them; the waste calendar's events only go
 *  into waste (its next three dates, from today); all-day ones first, then by time */
export function agendaDays(events, now = new Date(), wasteCal = '') {
  const today = dayKey(now), tomorrow = dayKey(addDays(now, 1));
  const out = { today: [], tomorrow: [], waste: [] };
  const on = (ev, day) => {
    if (ev.allDay) { const end = ev.e && /^\d{4}-\d{2}-\d{2}$/.test(ev.e) ? ev.e : dayKey(addDays(new Date(`${ev.s}T12:00:00`), 1)); return ev.s <= day && day < end; }
    return localDay(ev.s) === day;
  };
  (events || []).forEach((ev) => {
    if (!ev || typeof ev.s !== 'string') return;
    const item = { title: ev.title || '', time: ev.allDay ? null : new Date(ev.s), allDay: !!ev.allDay, cal: ev.cal || '' };
    if (wasteCal && ev.cal === wasteCal) {
      const d = ev.allDay ? ev.s : localDay(ev.s);
      if (d >= today) out.waste.push({ title: item.title, day: d, when: d === today ? 'today' : d === tomorrow ? 'tomorrow' : new Date(`${d}T12:00:00`) });
      return;
    }
    if (on(ev, today)) out.today.push(item);
    if (on(ev, tomorrow)) out.tomorrow.push(item);
  });
  const order = (p, q) => Number(q.allDay) - Number(p.allDay) || (p.time ? +p.time : 0) - (q.time ? +q.time : 0) || p.title.localeCompare(q.title);
  out.today.sort(order); out.tomorrow.sort(order);
  out.waste = out.waste.sort((p, q) => p.day.localeCompare(q.day) || p.title.localeCompare(q.title)).slice(0, 3).map(({ title, when }) => ({ title, when }));
  return out;
}

/** the people of Home Assistant (person.*): [{ id, name, home, where }], at home first, then by name; where: the zone, '' when away
 *  without one, null for unknown. names: { entity: its name in Home Assistant } */
export function people(states, names = {}) {
  return Object.entries(states || {}).filter(([e]) => e.startsWith('person.')).map(([id, s]) => {
    const st = s?.state || '';
    return { id, name: names[id] || s?.name || id.slice(7), home: st === 'home', where: st === 'home' ? '' : st === 'not_home' ? '' : st === 'unknown' || st === 'unavailable' ? null : st };
  }).sort((p, q) => Number(q.home) - Number(p.home) || p.name.localeCompare(q.name));
}

/** the rows of "Im Haus", only those with something to say: [{ key, n, names }]: open (doors, windows), lights, alarm (armed or going
 *  off), low (batteries), offline */
export function houseRows({ open = [], lights = 0, alarm = null, low = 0, offline = 0 } = {}) {
  const rows = [];
  if (open.length) rows.push({ key: 'open', n: open.length, names: open.slice(0, 4) });
  if (lights > 0) rows.push({ key: 'lights', n: lights, names: [] });
  if (alarm && alarm.state && alarm.state !== 'disarmed') rows.push({ key: 'alarm', n: 1, names: [alarm.state] });
  if (low > 0) rows.push({ key: 'low', n: low, names: [] });
  if (offline > 0) rows.push({ key: 'offline', n: offline, names: [] });
  return rows;
}

/** the first alarm panel of Home Assistant: { id, name, state }, or null */
export function alarmPanel(states, names = {}) {
  const id = Object.keys(states || {}).filter((e) => e.startsWith('alarm_control_panel.')).sort()[0];
  return id ? { id, name: names[id] || states[id].name || id, state: states[id].state } : null;
}

/** the days to ask the calendars for: from the start of today a week ahead (today, tomorrow and the next waste dates) */
export const agendaSpan = (now = new Date()) => ({ start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: addDays(now, 8) });
