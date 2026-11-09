/* The card "🔋 Ladestand" on the page ⚡ Energie (#515, the owner: "dass man den Batterieladezustand nachvollziehen kann in einer Art
 * Diagramm … alles zusammen sehen oder nur einzeln … auch für unterschiedliche Häuser"): which batteries a house has, how fine the
 * statistics are asked for, the line of each battery from Home Assistant's statistics (mean, min, max) or its history, and what each
 * device remembers (together or one chart each, the batteries left out). Pure (no DOM): unit test tests/batterylevels.test.mjs;
 * batterycard.js draws, pageenergy.js asks api/energy/levels. */
import { isLevelState } from './energycalc.js';
import { HOUSE_COLORS } from './energyhistory.js';

export const MODES = ['together', 'single'];
export const MAX_BATTERIES = 12;                   // what api/energy/levels answers for at once
export const PREFS_KEY = 'fp.batteryCard';          // the device's choice (localStorage, the owner: "jedes Gerät für sich")
const ENTITY = /^[a-z_]+\.[a-z0-9_]+$/;
const DASHES = ['', '7 4', '2 3'];                  // a house's second and third battery: dashed, in the colour of the house
const MIN = 60000, DAY = 86400000;

/**
 * The batteries of a house: the charge sensor of ⚡ Rechnung (energy.battery.level), every battery of the plan whose sensor is a charge
 * in %, and haLevels (the charge sensors of Home Assistant's energy dashboard) when the house counts with that dashboard. nameOf(sensor):
 * its name in Home Assistant (for a battery without a name in the plan). [{ id (the sensor), name }], each sensor once, at most MAX_BATTERIES.
 */
export function houseBatteries(layout, states = {}, haLevels = [], nameOf = (id) => states[id]?.name) {
  const out = [], seen = new Set();
  const devs = (layout?.floors || []).flatMap((f) => f.devices || []).filter((d) => d && d.type === 'battery');
  const add = (id, name) => {
    if (typeof id !== 'string' || !ENTITY.test(id) || seen.has(id)) return;
    seen.add(id); out.push({ id, name: String(name || nameOf(id) || id).slice(0, 60) });
  };
  const set = layout?.energy?.battery?.level;
  add(set, devs.find((d) => d.entity === set)?.name);
  devs.forEach((d) => { if (isLevelState(states[d.entity])) add(d.entity, d.name); });
  (haLevels || []).forEach((id) => add(id, devs.find((d) => d.entity === id)?.name));
  return out.slice(0, MAX_BATTERIES);
}

/**
 * The batteries the card shows, with a colour each: houses [{ id, name, layout, ha (it counts with Home Assistant's energy dashboard) }].
 * One house: a colour per battery. Several (all houses, ⚖ Vergleichen): the colour of the house (as in ⚖ Vergleichen, its place in the
 * list), its second and third battery dashed, the name with the house in front. Home Assistant's charge sensors go to the first house
 * that counts with the dashboard only (a later one would show the same battery again). nameOf: as for houseBatteries.
 * [{ id, name, house, houseName, color, dash }]
 */
export function cardBatteries(houses, states = {}, haLevels = [], nameOf) {
  const list = houses || [], many = list.length > 1, out = [], seen = new Set();
  let haTaken = false;
  list.forEach((h, hi) => {
    const ha = h.ha && !haTaken ? haLevels : [];
    if (h.ha) haTaken = true;
    houseBatteries(h.layout, states, ha, nameOf).filter((b) => !seen.has(b.id)).forEach((b, k) => {
      seen.add(b.id);
      const color = many ? HOUSE_COLORS[hi % HOUSE_COLORS.length] : HOUSE_COLORS[out.length % HOUSE_COLORS.length];
      out.push({ ...b, house: h.id, houseName: h.name || '', name: many ? `${h.name} · ${b.name}` : b.name, color, dash: many ? DASHES[k % DASHES.length] : '' });
    });
  });
  return out.slice(0, MAX_BATTERIES);
}

/** how fine the statistics are asked for: a day in 5 minutes (Home Assistant keeps those about 10 days, an older day by hours), a week
 *  and a month by hours, a year by days */
export function levelPeriod(kind, start, now = new Date()) {
  if (kind === 'day') return +now - +start < 9 * DAY ? '5minute' : 'hour';
  return kind === 'year' ? 'day' : 'hour';
}
/** the length of a row of that period in ms */
export const periodMs = (period) => (period === '5minute' ? 5 * MIN : period === 'day' ? DAY : 60 * MIN);

/**
 * The line of one battery: from the statistics ([[start ms, mean, min, max]], a point in the middle of its row) or, without them (a sensor
 * without state_class), from its history ([[ms, value]]: each value until the next one). Only what lies in [start, end) and before now,
 * every value cut to 0…100. [{ t, v, lo, hi }] in time order.
 */
export function levelPoints(data, id, start, end, period, now = new Date()) {
  const a = +start, b = Math.min(+end, +now), half = periodMs(period) / 2, cut = (x) => Math.max(0, Math.min(100, x));
  const ok = (x) => typeof x === 'number' && Number.isFinite(x);
  const rows = Array.isArray(data?.stats?.[id]) ? data.stats[id] : [];
  let pts = rows.filter((r) => Array.isArray(r) && ok(r[0]) && ok(r[1]))
    .map(([t, v, lo, hi]) => ({ t: Math.min(t + half, b), v: cut(v), lo: cut(ok(lo) ? lo : v), hi: cut(ok(hi) ? hi : v) }))
    .filter((p) => p.t >= a && p.t <= b);
  if (!pts.length) {
    const hist = (Array.isArray(data?.hist?.[id]) ? data.hist[id] : []).filter((r) => Array.isArray(r) && ok(r[0]) && ok(r[1])).sort((p, q) => p[0] - q[0]);
    const before = hist.filter((r) => r[0] < a).pop();                     // the value at the start: the last one before it
    pts = [...(before ? [[a, before[1]]] : []), ...hist.filter((r) => r[0] >= a && r[0] < b)].map(([t, v]) => ({ t, v: cut(v), lo: cut(v), hi: cut(v) }));
    if (pts.length && pts[pts.length - 1].t < b) pts.push({ ...pts[pts.length - 1], t: b });   // the last value holds until now
  }
  return pts.sort((p, q) => p.t - q.t);
}

/** the charge now (live, %) as the last point, when now lies in the period and after the last row (the statistics of an hour come
 *  only when it is over) */
export function withLive(points, live, now, start, end) {
  const n = +now, last = points[points.length - 1];
  if (typeof live !== 'number' || !Number.isFinite(live) || n < +start || n >= +end || (last && last.t >= n)) return points;
  const v = Math.max(0, Math.min(100, live));
  return [...points, { t: n, v, lo: v, hi: v }];
}

/** the line in pieces: a gap longer than `gap` ms (the sensor was away) breaks it */
export function splitGaps(points, gap) {
  const out = [];
  (points || []).forEach((p, i) => {
    if (!i || p.t - points[i - 1].t > gap) out.push([]);
    out[out.length - 1].push(p);
  });
  return out;
}

/** the lowest, highest and last charge of a line (null without points), and the time of the lowest and the highest */
export function levelSummary(points) {
  if (!points?.length) return null;
  let lo = points[0], hi = points[0];
  points.forEach((p) => { if (p.lo < lo.lo) lo = p; if (p.hi > hi.hi) hi = p; });
  return { min: lo.lo, minAt: lo.t, max: hi.hi, maxAt: hi.t, last: points[points.length - 1].v };
}

/** the device's choice as kept: { mode: together | single, hidden: [sensors left out] } */
export function cleanPrefs(p) {
  const hidden = Array.isArray(p?.hidden) ? [...new Set(p.hidden.filter((x) => typeof x === 'string' && ENTITY.test(x)))].slice(0, 40) : [];
  return { mode: MODES.includes(p?.mode) ? p.mode : 'together', hidden };
}
/** a battery shown again or left out */
export function toggleBattery(prefs, id) {
  const p = cleanPrefs(prefs);
  return { ...p, hidden: p.hidden.includes(id) ? p.hidden.filter((x) => x !== id) : [...p.hidden, id] };
}
/** the batteries shown: those not left out */
export const shownBatteries = (list, prefs) => (list || []).filter((b) => !cleanPrefs(prefs).hidden.includes(b.id));
