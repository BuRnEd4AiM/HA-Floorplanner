/* 🚆 The card "Zug" (#550, the owner: "dass man sich so seine Verbindung reinmacht, um zu schauen, ob morgens der Zug richtig kommt oder
 * nicht"): which departure is "mein Zug", whether it is on time, late or cancelled, when it really leaves and in how many minutes, a changed
 * platform. The rows come from the add-on (api/train, trains.py). Pure (unit test: tests/trains.test.mjs); traincard.js draws the card. */

const toMin = (hhmm) => (/^\d{2}:\d{2}$/.test(hhmm || '') ? +hhmm.slice(0, 2) * 60 + +hhmm.slice(3) : null);
export const hhmm = (m) => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;

/** a departure as it is: { kind: ok | late | bad | gone | unknown, delay (minutes, 0 on time), real ("07:17": when it really leaves) } */
export function statusOf(row) {
  if (!row) return { kind: 'unknown', delay: null, real: '' };
  if (row.cancelled) return { kind: 'gone', delay: null, real: row.at };
  if (row.delay == null) return { kind: 'unknown', delay: null, real: row.at };
  const d = Math.max(0, row.delay), real = hhmm(toMin(row.at) + d);
  return { kind: d === 0 ? 'ok' : d <= 5 ? 'late' : 'bad', delay: d, real };
}

/** minutes from now (a Date) until the train really leaves; a time just after midnight counts as tomorrow */
export function minutesTo(row, now) {
  const s = statusOf(row), m = toMin(s.real), n = now.getHours() * 60 + now.getMinutes();
  if (m == null) return null;
  let d = m - n;
  if (d < -720) d += 1440;
  if (d > 720) d -= 1440;
  return d;
}

/** has the platform changed (the planned one is known and another) */
export const platformChanged = (row) => !!(row?.platform && row?.planned && row.platform !== row.planned);

/** "mein Zug": the departure planned at mine ("07:12"); else the first planned up to 10 minutes later (the timetable moved a little);
 *  null when it is not among the rows (gone already, or not today) */
export function mineOf(rows, mine) {
  const m = toMin(mine);
  if (m == null) return null;
  return (rows || []).find((r) => r.at === mine) || (rows || []).find((r) => { const d = toMin(r.at) - m; return d > 0 && d <= 10; }) || null;
}

/** the departures to list: not those that left more than a minute ago, at most count, "mein Zug" not a second time */
export function nextRows(rows, now, count, mine) {
  return (rows || []).filter((r) => r !== mine && (minutesTo(r, now) ?? 0) >= -1).slice(0, count);
}

/** the minutes in words: "jetzt", "in 5 Min", "in 1 Std 10 Min" */
export function inWords(min, t) {
  if (min == null) return '';
  if (min <= 0) return t('tr.now');
  return min < 60 ? t('tr.inMin', { n: min }) : t('tr.inHour', { h: Math.floor(min / 60), m: min % 60 });
}
