/* Power add-on, the pure part (no three.js, no DOM, so it can be tested): power device types, cables (route, kind, colour),
 * watts of a sensor, the overview numbers (production, grid, consumption, battery) and the text of the overview pill. */
export const POWER_TYPES = new Set(['solarpanel', 'inverter', 'powermeter', 'houseentry', 'fusebox', 'battery', 'wallbox']);
/** meters of water, gas and heat: energy too, so the power editor keeps showing them (#207), but they have no cables */
export const METER_TYPES = new Set(['watermeter', 'gasmeter', 'heatmeter']);
/** what the power editor shows */
export const showsInPowerEditor = (type) => POWER_TYPES.has(type) || METER_TYPES.has(type);
export const CABLE_ROUTES = ['floor', 'through', 'air'];
/** what a cable carries decides its colour: grid (the connection to the public grid, also what is fed in), own solar, battery, consumption */
export const CABLE_KINDS = { grid: '#ff6b6b', solar: '#7dff9a', battery: '#5aa9ff', load: '#ffb347' };
export const KIND_OF_TYPE = { houseentry: 'grid', powermeter: 'grid', solarpanel: 'solar', inverter: 'solar', battery: 'battery', fusebox: 'load', wallbox: 'load' };
export const cableKind = (d, c) => (c.kind in CABLE_KINDS ? c.kind : KIND_OF_TYPE[d.type] || 'load');
export const cableColor = (d, c) => CABLE_KINDS[cableKind(d, c)];
/** the cables of a device; the single `feeds` of the first version counts as an air cable */
export const cablesOf = (d) => (Array.isArray(d.cables) ? d.cables : d.feeds ? [{ id: `${d.id}-f`, to: d.feeds, route: 'air' }] : []);
/** the cables array of a device for editing: an old `feeds` is turned into a real cable first */
export function ownCables(d) {
  if (!Array.isArray(d.cables)) { d.cables = cablesOf(d).map((c) => ({ ...c })); delete d.feeds; }
  return d.cables;
}
const unitFactor = (unit) => (/^k/i.test(unit || '') ? 1000 : /^m/i.test(unit || '') ? 1e6 : 1);
/** watts of a device's entity (kW and MW are converted), null if it has no number; a cable can carry its own sensor */
export function powerWatts(states, d, c) {
  const e = c?.entity || d.entity, s = e ? states[e] : null;
  if (s && s.unit === '%') return null;                                  // a charge level is not a power
  const n = s ? parseFloat(s.state) : NaN;
  return Number.isFinite(n) ? n * unitFactor(s.unit) : null;
}
export const fmtWatts = (w) => (Math.abs(w) >= 1000 ? `${(Math.abs(w) / 1000).toFixed(2)} kW` : `${Math.round(Math.abs(w))} W`);

/** the points [x, y, z] of a cable: `air` hangs between the two, `floor` runs along the floor of the first and then up,
 *  `through` goes through the floors first, then along the floor of the second; fyA / fyB are the floor levels of the two ends */
export function cablePoints(route, pa, pb, fyA, fyB) {
  if (route === 'air') {
    const len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]);
    return [pa, [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 + 0.2 + len * 0.05, (pa[2] + pb[2]) / 2], pb];
  }
  const lift = 0.05, yA = fyA + lift, yB = fyB + lift;
  if (route === 'through') return [pa, [pa[0], yA, pa[2]], [pa[0], yB, pa[2]], [pb[0], yB, pa[2]], [pb[0], yB, pb[2]], pb];
  return [pa, [pa[0], yA, pa[2]], [pb[0], yA, pa[2]], [pb[0], yA, pb[2]], pb];
}

/** charging (plus) or discharging (minus) in watts from the battery's sensors; null when nothing tells. `level` is the battery that reports the charge in % */
export function batteryFlow(states, bats, level) {
  for (const d of bats) {
    const e = d.batPower || (!level || level.d !== d ? d.entity : ''), s = e ? states[e] : null;
    if (!s) continue;
    const txt = String(s.state).toLowerCase();
    if (/^(charging|laden|lädt)/.test(txt)) return 1;
    if (/^(discharging|entladen|entlädt)/.test(txt)) return -1;
    const n = parseFloat(s.state);
    if (Number.isFinite(n) && (s.unit || '') !== '%') return n * unitFactor(s.unit) * (d.batInvert ? -1 : 1);
  }
  return null;
}
/** the numbers of the overview: production (inverters, else solar panels), grid (plus = drawn, minus = fed in), consumption = production + grid, battery */
export function energySummary(states, devices) {
  const sum = (types) => { const v = devices.filter((d) => types.includes(d.type)).map((d) => powerWatts(states, d)).filter((x) => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
  const raw = sum(['inverter']) ?? sum(['solarpanel']), prod = raw === null ? null : Math.max(0, raw), grid = sum(['powermeter']) ?? sum(['houseentry']);
  const bats = devices.filter((d) => d.type === 'battery');
  const lv = bats.map((d) => ({ d, s: states[d.entity] })).find((x) => x.s && Number.isFinite(parseFloat(x.s.state)) && (x.s.unit || '') === '%');
  const flow = batteryFlow(states, bats, lv);
  const load = prod !== null || grid !== null ? Math.max(0, (prod ?? 0) + (grid ?? 0)) : null;
  return { prod, grid, load, battery: lv || flow !== null ? { v: lv ? parseFloat(lv.s.state) : null, flow } : null };
}
/** the text of the overview pill and its tooltip, null when there is nothing to show */
export function energyText(e, t) {
  const parts = [], tips = [];
  if (e.prod !== null) { parts.push(`☀ ${fmtWatts(e.prod)}`); tips.push(`${t('power.sum.prod')}: ${fmtWatts(e.prod)}`); }
  if (e.grid !== null) { parts.push(`⚡ ${fmtWatts(e.grid)}`); tips.push(`${t(e.grid < 0 ? 'power.sum.feedIn' : 'power.sum.draw')}: ${fmtWatts(e.grid)}`); }
  if (e.load !== null) { parts.push(`⌂ ${fmtWatts(e.load)}`); tips.push(`${t('power.sum.load')}: ${fmtWatts(e.load)}`); }
  if (e.battery) {
    const f = e.battery.flow, lvl = e.battery.v === null ? '' : `${Math.round(e.battery.v)} %`;
    const dir = f === null || Math.abs(f) < 20 ? '' : f > 0 ? ` ↑ ${fmtWatts(f)}` : ` ↓ ${fmtWatts(f)}`;      // up = charging, down = discharging
    const word = f === null ? '' : Math.abs(f) < 20 ? t('power.sum.idle') : f > 0 ? t('power.sum.charging') : t('power.sum.discharging');
    parts.push(`🔋 ${lvl}${dir}`.trim()); tips.push(`${t('power.sum.battery')}: ${[lvl, word].filter(Boolean).join(' · ')}`);
  }
  return parts.length ? { text: parts.join(' · '), title: tips.join('\n') } : null;
}
