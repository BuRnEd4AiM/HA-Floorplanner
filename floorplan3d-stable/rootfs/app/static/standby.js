/* 🔌 Stromfresser (the owner's choice 2026-11-19, picture docs/ideen-5.15/06): what the house draws while everybody sleeps (2–5 o'clock, the
 * mean of the last 14 nights) from Home Assistant's long-term statistics (the meters of the page ⚡ Energie, one row per hour), the devices
 * of the energy dashboard that draw most at night, what that costs in a year, and a ready routine "switch the plugs off at night". Which
 * device is "always on" (fridge, router …) is guessed from its name: it is shown, but never offered to switch off.
 * Pure (no DOM, no three.js): unit test tests/standby.test.mjs. The card is drawn by standbycard.js. */
import { METER_KEYS } from './energyhistory.js';

/** the hours that count: the rows starting 2:00, 3:00 and 4:00 (2–5 o'clock) */
export const NIGHT_HOURS = [2, 3, 4];
export const NIGHTS = 14;
/** the routine of "⏰ Nachts abschalten": off at OFF, on again at ON (the owner's choice: a routine he can change afterwards) */
export const OFF = '01:00', ON = '06:00';
export const OFF_HOURS = 5;
/** below this a device counts as off at night */
export const MIN_W = 1;
const ALWAYS = /k[uü]hl|kuehl|gefrier|fridge|freez|router|fritz|modem|repeater|\bmesh\b|\bnas\b|server|aquar|pumpe|\bpump|heizung|heat ?pump|w[äa]rmepumpe|boiler|alarm|kamera|camera|hub\b|bridge|gateway|zentrale/i;

/** is a device one that has to run all night (fridge, router, heating pump …), by its name or id */
export const alwaysOn = (d) => ALWAYS.test(`${d?.name || ''} ${d?.id || ''}`);

/** the span to ask the statistics for: from `nights` days ago at 0:00 to the end of the last night that is over (5:00 today, or
 *  yesterday's when it is not 5 o'clock yet): { start, end, buckets: [Date of every night hour] } */
export function nightSpan(now = new Date(), nights = NIGHTS) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = now.getHours() >= 5 ? 0 : -1;                       // the last night that is over: last night, or the one before
  const buckets = [];
  for (let n = last - nights + 1; n <= last; n++) NIGHT_HOURS.forEach((h) => buckets.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n, h)));
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + last - nights + 1);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + last, 5);
  return { start, end, buckets };
}

/** {start ms: kWh} of one statistic, only numbers */
function byHour(rows) {
  const m = new Map();
  (Array.isArray(rows) ? rows : []).forEach((r) => { if (Array.isArray(r) && Number.isFinite(r[1])) m.set(r[0], (m.get(r[0]) || 0) + r[1]); });
  return m;
}

/** what the house and its devices draw at night, in watts (an hour's kWh × 1000 is its mean in W):
 *  stats: { id: [[start ms, kWh]] } (api/energy/stats, period hour); meters: the house's meters (energyhistory.js); devices: [{ id, name }];
 *  buckets: nightSpan().buckets. -> { watts (the house, null without data), hours (night hours with data), nights,
 *  devices: [{ id, name, w, always }] (largest first, none below MIN_W), known (W of the listed devices), rest (W no device accounts for) } */
export function nightLoad(stats, meters, devices, buckets) {
  const want = new Set((buckets || []).map((d) => +d));
  const maps = {};
  METER_KEYS.filter((k) => k !== 'gas' && k !== 'water').forEach((k) => { maps[k] = (meters?.[k] || []).map((id) => byHour(stats?.[id])); });
  let sum = 0, hours = 0;
  const nightsSeen = new Set();
  want.forEach((ms) => {
    const v = {};
    let any = false;
    Object.entries(maps).forEach(([k, list]) => { v[k] = 0; list.forEach((m) => { if (m.has(ms)) { any = true; v[k] += m.get(ms); } }); });
    if (!any) return;
    sum += Math.max(0, v.from + v.solar + v.batOut - v.to - v.batIn);
    hours++;
    const d = new Date(ms); nightsSeen.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });
  const watts = hours ? (sum / hours) * 1000 : null;
  const list = (Array.isArray(devices) ? devices : []).map((d) => {
    const m = byHour(stats?.[d.id]);
    let s = 0, n = 0;
    want.forEach((ms) => { if (m.has(ms)) { s += m.get(ms); n++; } });
    return { id: d.id, name: d.name || '', w: n ? (s / n) * 1000 : 0, always: alwaysOn(d) };
  }).filter((d) => d.w >= MIN_W).sort((a, b) => b.w - a.w);
  const known = list.reduce((s, d) => s + d.w, 0);
  return { watts, hours, nights: nightsSeen.size, devices: list, known, rest: watts == null ? null : Math.max(0, watts - known) };
}

/** € in a year for a constant draw of w watts (price per kWh), null without a price */
export const perYear = (w, price) => (Number(price) > 0 && Number.isFinite(w) ? (w / 1000) * 8760 * Number(price) : null);
/** € in a year saved by switching w watts off for OFF_HOURS every night */
export const savedPerYear = (w, price, hours = OFF_HOURS) => (Number(price) > 0 && Number.isFinite(w) ? (w / 1000) * hours * 365 * Number(price) : null);

/** the devices "⏰ Nachts abschalten" offers: not always on, with a switch of their own (plugs: { statistic id: switch entity }) */
export const switchable = (load, plugs) => (load?.devices || []).filter((d) => !d.always && plugs?.[d.id]).map((d) => ({ ...d, plug: plugs[d.id] }));

/** the routine for the chosen switches: off at OFF, on again at ON, every day (flows.py); null without switches */
export function nightFlow(plugs, name) {
  const ents = [...new Set((plugs || []).filter((e) => typeof e === 'string' && e))].slice(0, 20);
  if (!ents.length) return null;
  return { id: null, name, on: true, lanes: [
    { id: 'l1', blocks: [{ k: 'time', at: OFF, days: [] }, { k: 'switch', ents, same: false, do: 'off' }] },
    { id: 'l2', blocks: [{ k: 'time', at: ON, days: [] }, { k: 'switch', ents, same: false, do: 'on' }] }] };
}

/** the three parts of the bar (% of the house's night draw): standby devices, always-on devices, the rest no device accounts for */
export function barParts(load) {
  const all = load?.watts;
  if (!(all > 0)) return null;
  const sb = load.devices.filter((d) => !d.always).reduce((s, d) => s + d.w, 0), on = load.devices.filter((d) => d.always).reduce((s, d) => s + d.w, 0);
  const pct = (w) => Math.max(0, Math.min(100, Math.round((w / Math.max(all, sb + on)) * 100)));
  const a = pct(sb), b = Math.min(100 - a, pct(on));
  return { standby: a, always: b, rest: 100 - a - b };
}
