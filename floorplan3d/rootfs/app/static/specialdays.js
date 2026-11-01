/* 📅 Besondere Tage for the routines (the owner, 2026-11-01: "diese Automatisierung soll aber am folgenden Tag … Feiertag … oder einen
 * vordefinierten Tag … an diesem Tag anders sein, wie zum Beispiel an Halloween, an Heiligabend soll zum Beispiel der Rollladen nicht ganz
 * hochfahren"). One list of days for all routines (rules.json "days"), each of one kind: date (every year, also from … to), once (one day
 * or a few in a row), easter (days after Easter Sunday: Rosenmontag -48), holidays (Germany or one German state), calendar (a calendar of
 * Home Assistant, while it has an event). The block "Nur wenn: besonderer Tag" (if_special) asks it. The same rules as specialdays.py in
 * the add-on, which runs the routines (tests/test_specialdays.py checks that both agree). Pure (unit test: tests/specialdays.test.mjs);
 * specialdaysui.js draws the window "📅 Besondere Tage". */

export const KINDS = ['date', 'once', 'easter', 'holidays', 'calendar'];
export const REGIONS = ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
/** the names of the German states (place names, the same in every language) */
export const REGION_NAMES = { BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern', NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland', SN: 'Sachsen',
  ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen' };
export const MAX_DAYS = 30, MAX_ONCE = 366;
const DAY_ID = /^d_[a-z0-9]{1,16}$/, CAL = /^calendar\.[a-z0-9_]{1,100}$/, MD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, YMD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** the public holidays of Germany: [key, the day (MM-DD, days after Easter Sunday, or 'bbt': Buß- und Bettag), the states ('*': all)] */
export const HOLIDAYS = [
  ['newyear', '01-01', '*'], ['epiphany', '01-06', 'BW BY ST'], ['womensday', '03-08', 'BE MV'], ['goodfriday', -2, '*'], ['eastersunday', 0, 'BB HE'],
  ['eastermonday', 1, '*'], ['mayday', '05-01', '*'], ['ascension', 39, '*'], ['whitsunday', 49, 'BB HE'], ['whitmonday', 50, '*'],
  ['corpuschristi', 60, 'BW BY HE NW RP SL'], ['assumption', '08-15', 'SL'], ['childrensday', '09-20', 'TH'], ['unity', '10-03', '*'],
  ['reformation', '10-31', 'BB HB HH MV NI SN ST SH TH'], ['allsaints', '11-01', 'BW BY NW RP SL'], ['repentance', 'bbt', 'SN'],
  ['xmas1', '12-25', '*'], ['xmas2', '12-26', '*'],
];

const pad = (n) => String(n).padStart(2, '0');
/** a date (local) as YYYY-MM-DD */
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYmd = (s) => { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d); return x.getFullYear() === y && x.getMonth() === m - 1 && x.getDate() === d ? x : null; };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mdOk = (s) => typeof s === 'string' && MD.test(s) && !!fromYmd(`2024-${s}`);       // 2024: a leap year, 02-29 is a day
const ymdOk = (s) => typeof s === 'string' && YMD.test(s) && !!fromYmd(s);
const text = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, n) : '');

/** one day made safe, null when it is none (clean_day in specialdays.py) */
export function cleanDay(d) {
  if (!d || typeof d !== 'object' || typeof d.id !== 'string' || !DAY_ID.test(d.id) || !KINDS.includes(d.kind)) return null;
  const k = d.kind, out = { id: d.id, kind: k, name: text(d.name, 40), icon: text(d.icon, 8) };
  if (k === 'date') {
    if (!mdOk(d.md)) return null;
    out.md = d.md;
    if (mdOk(d.to) && d.to !== d.md) out.to = d.to;
  } else if (k === 'once') {
    if (!ymdOk(d.from)) return null;
    const a = fromYmd(d.from), b = ymdOk(d.to) ? fromYmd(d.to) : null;
    out.from = d.from;
    out.to = b && b >= a && b <= addDays(a, MAX_ONCE) ? d.to : d.from;
  } else if (k === 'easter') {
    out.off = Number.isInteger(d.off) ? Math.max(-70, Math.min(70, d.off)) : 0;
  } else if (k === 'holidays') {
    out.region = REGIONS.includes(d.region) ? d.region : 'DE';
  } else if (k === 'calendar') {
    if (typeof d.ent !== 'string' || !CAL.test(d.ent)) return null;
    out.ent = d.ent;
  }
  return out;
}
/** the list as it is kept: each id once, at most MAX_DAYS */
export function cleanDays(list) {
  const out = [], ids = new Set();
  for (const d of Array.isArray(list) ? list : []) {
    const c = cleanDay(d);
    if (c && !ids.has(c.id) && out.length < MAX_DAYS) { ids.add(c.id); out.push(c); }
  }
  return out;
}
/** the days a block asks for (empty: any special day) */
export const cleanIds = (v) => [...new Set((Array.isArray(v) ? v : []).filter((x) => typeof x === 'string' && DAY_ID.test(x)))].slice(0, MAX_DAYS);
/** a new id for a day: d_ and some letters, not one of taken */
export function newDayId(taken = [], rand = Math.random) {
  for (;;) { const id = `d_${Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0')}`; if (!taken.includes(id)) return id; }
}

/* ---- the dates ---- */
/** Easter Sunday of a year (Gregorian calendar, the "anonymous" rule) */
export function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const m = (32 + 2 * e + 2 * i - h - k) % 7, n = Math.floor((a + 11 * h + 22 * m) / 451);
  const month = Math.floor((h + m - 7 * n + 114) / 31), day = ((h + m - 7 * n + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
/** the public holidays of a year in Germany (DE: those of the whole country) or one state: [{ date (YYYY-MM-DD), key }] by date */
export function holidays(region, year) {
  const e = easter(year), out = [];
  for (const [key, when, where] of HOLIDAYS) {
    if (where !== '*' && !where.split(' ').includes(region)) continue;
    let d;
    if (typeof when === 'number') d = addDays(e, when);
    else if (when === 'bbt') { const nov22 = new Date(year, 10, 22); d = addDays(nov22, -((nov22.getDay() - 3 + 7) % 7)); }   // the Wednesday before 23 November
    else d = new Date(year, Number(when.slice(0, 2)) - 1, Number(when.slice(3)));
    out.push({ date: ymd(d), key });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
const inMd = (md, a, b) => (a <= b ? a <= md && md <= b : md >= a || md <= b);

/** is date d (a Date, local) one of this special day; a calendar: is it on now (states: { entity: { state } }) */
export function onDay(day, d, states = {}) {
  const k = day.kind, s = ymd(d), md = s.slice(5);
  if (k === 'date') return inMd(md, day.md, day.to || day.md);
  if (k === 'once') return day.from <= s && s <= day.to;
  if (k === 'easter') return ymd(addDays(easter(d.getFullYear()), day.off)) === s;
  if (k === 'holidays') return holidays(day.region, d.getFullYear()).some((h) => h.date === s);
  if (k === 'calendar') return states?.[day.ent]?.state === 'on';
  return false;
}
/** the ids of the special days date d is */
export const which = (days, d, states = {}) => (days || []).filter((x) => onDay(x, d, states)).map((x) => x.id);
/** is date d one of the days ids (empty: any of the list) */
export const isSpecial = (days, ids, d, states = {}) => (days || []).some((x) => (!ids?.length || ids.includes(x.id)) && onDay(x, d, states));

/** when the day comes next, from date d on (d itself counts): { date (a Date), key (a holiday's) } or null (a calendar, a day gone by) */
export function nextOf(day, d) {
  const today = ymd(d);
  if (day.kind === 'calendar') return null;
  if (day.kind === 'once') return day.to < today ? null : { date: fromYmd(day.from > today ? day.from : today) };
  if (day.kind === 'holidays') {
    for (const y of [d.getFullYear(), d.getFullYear() + 1]) { const h = holidays(day.region, y).find((x) => x.date >= today); if (h) return { date: fromYmd(h.date), key: h.key }; }
    return null;
  }
  for (let i = 0; i <= 366; i++) { const x = addDays(d, i); if (onDay(day, x)) return { date: x }; }
  return null;
}

/* ---- in words ---- */
const dm = (md, lang) => { try { return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(new Date(2024, Number(md.slice(0, 2)) - 1, Number(md.slice(3)))); } catch { return md; } };
const dmy = (s, lang) => { try { return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(fromYmd(s)); } catch { return s; } };
/** a short date to show: "24. Dez." */
export function shortDate(d, lang) { try { return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(d); } catch { return ymd(d).slice(5); } }
/** a date to show: "Do., 24. Dez." */
export function dateText(d, lang) { try { return new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short' }).format(d); } catch { return ymd(d); } }

/** what a day is, in words: "24. Dez. – 26. Dez. · jedes Jahr", "Feiertage Baden-Württemberg", "Kalender Feiertage" (nameOf: an entity's name) */
export function kindText(day, t, lang, nameOf = (e) => e) {
  switch (day.kind) {
    case 'date': return `${day.to ? `${dm(day.md, lang)} – ${dm(day.to, lang)}` : dm(day.md, lang)} · ${t('sd.everyYear')}`;
    case 'once': return day.to !== day.from ? `${dmy(day.from, lang)} – ${dmy(day.to, lang)}` : dmy(day.from, lang);
    case 'easter': return day.off === 0 ? t('sd.easterSunday') : t(day.off < 0 ? 'sd.beforeEaster' : 'sd.afterEaster', { n: Math.abs(day.off) });
    case 'holidays': return day.region === 'DE' ? t('sd.holidaysDE') : t('sd.holidaysOf', { region: REGION_NAMES[day.region] || day.region });
    case 'calendar': return day.ent ? t('sd.calendarOf', { name: nameOf(day.ent) || day.ent }) : t('sd.calendar');
    default: return '';
  }
}
/** the name of a day to show: its own name, else what it is */
export const dayName = (day, t, lang, nameOf) => day.name || kindText(day, t, lang, nameOf);
/** the icon of a day: its own, else one for its kind */
export const dayIcon = (day) => day.icon || { date: '📅', once: '📌', easter: '🐣', holidays: '🎉', calendar: '🗓️' }[day.kind] || '📅';

/** the days of the block "Nur wenn: besonderer Tag" in words: "Heiligabend", "Heiligabend, Halloween", "ein besonderer Tag" (ids empty) */
export function idsText(days, ids, t, lang, nameOf) {
  if (!ids?.length) return t('sd.anyDay');
  const names = ids.map((id) => (days || []).find((x) => x.id === id)).filter(Boolean).map((x) => dayName(x, t, lang, nameOf));
  if (!names.length) return t('sd.gone');
  return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
}

/* ---- ready days to add with one tap ---- */
/** is a ready day already in the list (the same date, the same holidays …): its "＋" is not offered twice */
export function hasPreset(days, p) {
  const same = (a, b) => ['kind', 'md', 'to', 'off', 'region'].every((k) => (a[k] ?? null) === (b[k] ?? null));
  return p.key !== 'own' && ['date', 'easter', 'holidays'].includes(p.day.kind) && (days || []).some((d) => same(d, p.day));
}
/** the ready days of "＋ Tag" (today: a Date): [{ key, icon, day (without id and name: the name is t(`sd.p.<key>`)) }] */
export function presets(today) {
  const tomorrow = addDays(today, 1);
  return [
    { key: 'holidays', icon: '🎉', day: { kind: 'holidays', region: 'DE' } },
    { key: 'xmasEve', icon: '🎄', day: { kind: 'date', md: '12-24' } },
    { key: 'xmas', icon: '🎁', day: { kind: 'date', md: '12-24', to: '12-26' } },
    { key: 'nye', icon: '🎆', day: { kind: 'date', md: '12-31' } },
    { key: 'halloween', icon: '🎃', day: { kind: 'date', md: '10-31' } },
    { key: 'nikolaus', icon: '🎅', day: { kind: 'date', md: '12-06' } },
    { key: 'carnival', icon: '🎭', day: { kind: 'easter', off: -48 } },
    { key: 'tomorrow', icon: '📌', day: { kind: 'once', from: ymd(tomorrow), to: ymd(tomorrow) } },
    { key: 'vacation', icon: '🏖️', day: { kind: 'once', from: ymd(today), to: ymd(addDays(today, 13)) } },
    { key: 'own', icon: '📅', day: { kind: 'date', md: ymd(today).slice(5) } },
    { key: 'calendar', icon: '🗓️', day: { kind: 'calendar', ent: '' } },
  ];
}

/* ---- "An besonderen Tagen anders": a lane as two ---- */
/** lane l of a routine split in two (the routine's lanes as a new list, or null when there is no room for one more): the lane itself
 *  gets "Nur wenn: kein besonderer Tag" right after its trigger, a copy (new id newId) "Nur wenn: besonderer Tag" — the user then changes
 *  what the copy does (the shutter only to 50 %, a later time). ids: the days (empty: any); maxLanes, maxBlocks: the limits of a routine */
export function splitLane(lanes, l, ids, newId, { maxLanes = 4, maxBlocks = 12 } = {}) {
  const lane = lanes[l];
  if (!lane || lanes.length >= maxLanes || lane.blocks.length >= maxBlocks) return null;
  const cond = (is) => ({ k: 'if_special', is, days: [...(ids || [])] });
  const plain = { ...lane, blocks: [lane.blocks[0], cond('no'), ...lane.blocks.slice(1)].map((b) => JSON.parse(JSON.stringify(b))) };
  const copy = { id: newId, blocks: [lane.blocks[0], cond('yes'), ...lane.blocks.slice(1)].map((b) => JSON.parse(JSON.stringify(b))) };
  return [...lanes.slice(0, l), plain, copy, ...lanes.slice(l + 1)];
}
