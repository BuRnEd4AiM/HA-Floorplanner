/* The page ⚡ Energie of the tab bar (#481): what a period (today by hours, a week or a month by days, a year by months) used, made, drew
 * from the grid and fed in, from Home Assistant's long-term statistics of the meters (kWh, m³). Each house counts with its own meters
 * (⚡ Rechnung → "Zähler", layout.energy.meters), without them with those of Home Assistant's energy dashboard; "all houses" adds them up,
 * each meter once. Pure (unit test: tests/energyhistory.test.mjs); pageenergy.js draws, energymetersui.js sets the meters.
 *
 * Meter kinds: from (drawn from the grid), to (fed in), solar, batIn (into the battery), batOut (out of it), gas, water. */

export const KINDS = ['day', 'week', 'month', 'year'];
export const METER_KEYS = ['from', 'to', 'solar', 'batIn', 'batOut', 'gas', 'water'];
const STAT = /^[a-z0-9_]+[.:][a-z0-9_]+$/;

/** the period `kind` moved by `offset` (0 = this one, -1 = the one before …) around `now`, in the browser's time:
 *  { start, end (Date), period (how Home Assistant groups: hour | day | month), buckets: [Date] (the start of each bar) } */
export function periodRange(kind, offset = 0, now = new Date()) {
  const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = [];
  let e, period;
  if (kind === 'week') {
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7) + 7 * offset);          // Monday
    for (let i = 0; i < 7; i++) buckets.push(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
    e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7); period = 'day';
  } else if (kind === 'month') {
    s.setDate(1); s.setMonth(s.getMonth() + offset);
    e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
    for (let d = new Date(s); d < e; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) buckets.push(d);
    period = 'day';
  } else if (kind === 'year') {
    s.setMonth(0, 1); s.setFullYear(s.getFullYear() + offset);
    for (let m = 0; m < 12; m++) buckets.push(new Date(s.getFullYear(), m, 1));
    e = new Date(s.getFullYear() + 1, 0, 1); period = 'month';
  } else {
    s.setDate(s.getDate() + offset);
    for (let h = 0; h < 24; h++) buckets.push(new Date(s.getFullYear(), s.getMonth(), s.getDate(), h));
    e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1); period = 'hour';
  }
  return { kind: KINDS.includes(kind) ? kind : 'day', start: s, end: e, period, buckets };
}

/** a date as Home Assistant wants it: ISO with the browser's offset ("2026-10-21T00:00:00+02:00") */
export function isoLocal(d) {
  const p = (n) => String(Math.abs(n)).padStart(2, '0'), off = -d.getTimezoneOffset();
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${off >= 0 ? '+' : '-'}${p(Math.trunc(off / 60))}:${p(off % 60)}`;
}

/** meters as kept: { kind: [statistic ids] }, only known kinds and real ids, each once */
export function cleanMeters(m) {
  const out = {};
  METER_KEYS.forEach((k) => { const l = Array.isArray(m?.[k]) ? m[k] : []; out[k] = [...new Set(l.filter((x) => typeof x === 'string' && STAT.test(x)))]; });
  return out;
}
export const hasMeters = (m) => METER_KEYS.some((k) => (m?.[k] || []).length > 0);
/** the meters a house counts with: its own when it has any (⚡ Rechnung), else those of Home Assistant's energy dashboard; own: which */
export function houseMeters(energy, ha) {
  const own = cleanMeters(energy?.meters);
  return hasMeters(own) ? { meters: own, own: true } : { meters: cleanMeters(ha), own: false };
}
/** several houses together: every meter once */
export function mergeMeters(list) {
  const out = cleanMeters({});
  list.forEach((m) => METER_KEYS.forEach((k) => (m?.[k] || []).forEach((id) => { if (!out[k].includes(id)) out[k].push(id); })));
  return out;
}
/** every statistic to ask for: the meters and the devices */
export const meterIds = (m, devices = []) => [...new Set([...METER_KEYS.flatMap((k) => m?.[k] || []), ...devices.map((d) => d.id)])];

const zero = () => ({ from: 0, to: 0, solar: 0, batIn: 0, batOut: 0, gas: 0, water: 0, use: 0, own: 0 });
/** the bar a row of the statistics belongs to (the last bucket starting at or before it), -1 outside */
function bucketOf(ms, starts, end) {
  if (ms < starts[0] || ms >= end) return -1;
  let i = 0;
  while (i + 1 < starts.length && starts[i + 1] <= ms) i++;
  return i;
}
/** the house's use: what came from the grid, the sun and the battery, less what went out and into the battery; what the house made
 *  itself (own) is what it used without the grid */
function finish(r) {
  r.use = Math.max(0, r.from + r.solar + r.batOut - r.to - r.batIn);
  r.own = Math.max(0, r.use - r.from);
  return r;
}
/** statistics { id: [[start ms, change]] } -> one row per bar { from, to, solar, batIn, batOut, gas, water, use, own } */
export function bars(stats, meters, buckets, end) {
  const starts = buckets.map((d) => +d), stop = +end, rows = buckets.map(zero);
  METER_KEYS.forEach((k) => (meters?.[k] || []).forEach((id) => (stats?.[id] || []).forEach(([ms, change]) => {
    if (typeof change !== 'number' || !Number.isFinite(change)) return;
    const i = bucketOf(ms, starts, stop);
    if (i >= 0) rows[i][k] += change;
  })));
  return rows.map(finish);
}
/** the sums of rows (all, or the first n), with autarky (% of the use the house made itself) and self use (% of the sun used at home) */
export function totals(rows, n = rows.length) {
  const t = zero();
  rows.slice(0, n).forEach((r) => METER_KEYS.forEach((k) => { t[k] += r[k]; }));
  finish(t);
  return { ...t, autarky: t.use > 0 ? Math.round((t.own / t.use) * 100) : null, selfUse: t.solar > 0 ? Math.round((Math.max(0, t.solar - t.to) / t.solar) * 100) : null };
}
/** what it cost with prices per kWh { buy, sell }: { buy (paid), sell (paid back), net }, null without a price */
export function cost(t, price) {
  const b = Number(price?.buy), s = Number(price?.sell);
  if (!(b > 0)) return null;
  const buy = t.from * b, sell = s > 0 ? t.to * s : 0;
  return { buy, sell, net: buy - sell };
}
/** the price a house counts with: its own (⚡ Rechnung) or that of the energy dashboard */
export function priceOf(energy, ha) {
  const own = energy?.price || {};
  return Number(own.buy) > 0 ? { buy: Number(own.buy), sell: Number(own.sell) > 0 ? Number(own.sell) : 0 } : ha?.buy > 0 ? { buy: ha.buy, sell: ha.sell > 0 ? ha.sell : 0 } : null;
}
/** the devices that used most in the span: [{ id, name, kwh }], largest first, at most n, none without use */
export function topDevices(stats, devices, start, end, n = 6) {
  const a = +start, b = +end;
  return devices.map((d) => ({ ...d, kwh: (stats?.[d.id] || []).reduce((s, [ms, c]) => (ms >= a && ms < b && Number.isFinite(c) ? s + c : s), 0) }))
    .filter((d) => d.kwh > 0.0005).sort((p, q) => q.kwh - p.kwh).slice(0, n);
}
/** how many bars of the current period have begun by `now` (all of a past one): to compare "so far" with the period before */
export const elapsed = (buckets, now = new Date()) => buckets.filter((d) => +d <= +now).length;
/** a number of kWh (or m³) for the page: 2 decimals under 10, 1 under 100, else none */
export function fmtAmount(v, lang = 'de') {
  if (v == null || !Number.isFinite(v)) return '–';
  const d = Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0;
  return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d });
}
/** the highest bar (for the scale), at least 0.1 */
export const barMax = (rows) => Math.max(0.1, ...rows.map((r) => Math.max(r.use, r.from + r.own)));
/** the span of the previous period, to ask for both at once */
export const withPrevious = (kind, offset, now) => ({ cur: periodRange(kind, offset, now), prev: periodRange(kind, offset - 1, now) });

const ENERGY_UNITS = new Set(['Wh', 'kWh', 'MWh', 'GJ', 'MJ']), VOLUME_UNITS = new Set(['m³', 'L', 'l', 'ft³', 'gal', 'CCF']);
/** what a sensor can be as a meter, by its unit: 'energy' (kWh …), 'volume' (m³, L …) or null */
export function meterKind(state) {
  const u = state?.unit || '';
  return ENERGY_UNITS.has(u) ? 'energy' : VOLUME_UNITS.has(u) ? 'volume' : null;
}
/** the kinds a meter of this sort can be: energy for the grid, sun and battery (and gas in kWh), volume for gas and water */
export const KIND_SORT = { from: ['energy'], to: ['energy'], solar: ['energy'], batIn: ['energy'], batOut: ['energy'], gas: ['volume', 'energy'], water: ['volume'] };
