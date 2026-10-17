/* Taking over the energy dashboard of Home Assistant (#407), and the setup check list of the tab "⚡ Rechnung": what the energy
 * dashboard knows (its power sensors; without them the power sensor next to its energy meter on the same device, marked as a guess) as
 * the settings of the tab, in the signs the tab counts with (grid: plus = drawn, battery: plus = charging; Home Assistant counts the
 * battery plus = discharging), its gas and water meters, and the list of what is set up and what is still missing.
 * Pure (no DOM, no three.js): unit test tests/energyprefs.test.mjs. The window part is energysetup.js. */
import { isPowerState, isLevelState, energyChecks } from './energycalc.js';
import { METER_TYPES } from './powerlogic.js';

const ent = (v) => (typeof v === 'string' && /^[a-z_]+\.[^\s:]+$/.test(v) ? v : '');   // an entity, not a statistic of another kind ("domain:x")
const IMPORT = /import|bezug|from_grid|consum|verbrauch|purchase/i, EXPORT = /export|einspeis|feed|return|to_grid|liefer|sold|sell/i;

/** the power sensors next to energy meter e (the same device, energy_siblings in server.py) */
const powerNear = (e, siblings, states) => (e ? (siblings?.[e] || []).filter((x) => isPowerState(states[x])) : []);
const levelNear = (e, siblings, states) => (e ? (siblings?.[e] || []).filter((x) => isLevelState(states[x])) : []);

/** the power sensor(s) of a source as Home Assistant keeps them: { split, from, to } (two sensors, each positive), { entity, flipped }
 *  (one sensor; flipped: its sign is the other way round than Home Assistant's), or null. The user's own choice (power_config) comes
 *  first: stat_rate itself may be a sensor Home Assistant made from it */
export function rateOf(src) {
  const pc = src?.power_config || {};
  if (ent(pc.stat_rate_from) || ent(pc.stat_rate_to)) return { split: true, from: ent(pc.stat_rate_from), to: ent(pc.stat_rate_to) };
  if (ent(pc.stat_rate_inverted)) return { entity: pc.stat_rate_inverted, flipped: true };
  if (ent(pc.stat_rate)) return { entity: pc.stat_rate, flipped: false };
  if (ent(src?.stat_rate)) return { entity: src.stat_rate, flipped: false };
  return null;
}

/** the grid as the tab keeps it ({ entity, invert } or { split, imp, exp }, guess: taken from the device of the energy meter), or null.
 *  Home Assistant's single sensor counts plus = from the grid, like the tab. Both the flat form and the older one (flow_from, flow_to,
 *  power) are read */
function gridOf(g, siblings, states) {
  const r = rateOf(g) || rateOf(Array.isArray(g.power) ? g.power[0] : null);
  if (r?.split) return { split: true, imp: r.from, exp: r.to };
  if (r) return { entity: r.entity, invert: r.flipped };
  const imp = ent(g.stat_energy_from) || ent(g.flow_from?.[0]?.stat_energy_from), exp = ent(g.stat_energy_to) || ent(g.flow_to?.[0]?.stat_energy_to);
  const pi = powerNear(imp, siblings, states), pe = powerNear(exp, siblings, states);
  if (pi.length === 1 && pe.length === 1 && pi[0] !== pe[0]) return { split: true, imp: pi[0], exp: pe[0], guess: true };
  const all = [...new Set([...pi, ...pe])];
  if (all.length > 1) {
    const i = all.find((x) => IMPORT.test(x)), x = all.find((y) => EXPORT.test(y));
    if (i && x && i !== x) return { split: true, imp: i, exp: x, guess: true };
  }
  return all.length ? { entity: all[0], invert: false, guess: true } : null;
}
/** the battery as the tab keeps it: { level, entity, invert } or { level, split, charge, discharge } (guess as above), or null. Home
 *  Assistant counts plus = discharging, the tab plus = charging: its single sensor is turned round */
function batteryOf(b, siblings, states) {
  const r = rateOf(b), from = ent(b.stat_energy_from), to = ent(b.stat_energy_to);
  const level = ent(b.stat_soc) || levelNear(from, siblings, states)[0] || levelNear(to, siblings, states)[0] || '';
  if (r?.split) return { level, split: true, charge: r.to, discharge: r.from };
  if (r) return { level, entity: r.entity, invert: !r.flipped };
  const near = [...new Set([...powerNear(from, siblings, states), ...powerNear(to, siblings, states)])];
  if (near.length) return { level, entity: near[0], invert: false, guess: true };
  return level ? { level } : null;
}

/** What the energy dashboard proposes for the tab: { grid, solar: [entities], solarGuess, battery, meters: [{ kind: 'gas' | 'water',
 *  entity }], more: [what it has more of than the tab can take: 'grid' | 'battery'], empty }. prefs: energy/get_prefs, siblings: the
 *  other sensors of each sensor's device, states: the add-on's entity states ({ state, unit, dc }) */
export function fromEnergyPrefs(prefs, siblings = {}, states = {}) {
  const src = Array.isArray(prefs?.energy_sources) ? prefs.energy_sources : [];
  const of = (type) => src.filter((s) => s && s.type === type);
  const grids = of('grid'), bats = of('battery'), out = { grid: null, solar: [], solarGuess: false, battery: null, meters: [], more: [] };
  for (const g of grids) { out.grid = gridOf(g, siblings, states); if (out.grid) break; }
  of('solar').forEach((s) => {
    const r = rateOf(s), e = r && !r.split ? r.entity : powerNear(ent(s.stat_energy_from), siblings, states)[0];
    if (!e || out.solar.includes(e)) return;
    out.solar.push(e);
    if (!r) out.solarGuess = true;
  });
  for (const b of bats) { out.battery = batteryOf(b, siblings, states); if (out.battery) break; }
  if (grids.length > 1) out.more.push('grid');
  if (bats.length > 1) out.more.push('battery');
  ['gas', 'water'].forEach((kind) => of(kind).forEach((s) => { const e = ent(s.stat_energy_from); if (e) out.meters.push({ kind, entity: e }); }));
  out.empty = !out.grid && !out.solar.length && !out.battery && !out.meters.length;
  return out;
}

/** put a proposal into the tab's settings (energy: layout.energy, changed in place): grid, solar and battery are replaced by what the
 *  energy dashboard says (the battery keeps "not counted in the consumption"); the rooms and the house sensor stay. Returns the parts set */
export function applyPrefs(energy, prop) {
  const done = [];
  const g = prop?.grid;
  if (g?.split) { energy.grid = { split: true, ...(g.imp ? { imp: g.imp } : {}), ...(g.exp ? { exp: g.exp } : {}) }; done.push('grid'); }
  else if (g?.entity) { energy.grid = { entity: g.entity, ...(g.invert ? { invert: true } : {}) }; done.push('grid'); }
  if (prop?.solar?.length) { energy.solar = { entities: [...prop.solar] }; done.push('solar'); }
  const b = prop?.battery;
  if (b) {
    const keep = energy.battery?.balance === false ? { balance: false } : {};
    const power = b.split ? { split: true, ...(b.charge ? { charge: b.charge } : {}), ...(b.discharge ? { discharge: b.discharge } : {}) }
      : b.entity ? { entity: b.entity, ...(b.invert ? { invert: true } : {}) } : {};
    energy.battery = { ...keep, ...(b.level ? { level: b.level } : {}), ...power };
    done.push('battery');
  }
  return done;
}

const reading = (states, e) => Number.isFinite(parseFloat(states?.[e]?.state));

/**
 * The setup check list: [{ key, level: 'ok' | 'todo' | 'warn' | 'info', params }], in the order of the tab.
 *   grid    ok: set and a value now · warn: set, no value · todo: not set (the calculation needs it)
 *   solar / battery   ok · warn: set, no value · info: none (fine without)
 *   house   ok: a sensor of its own · info: calculated
 *   rooms   ok: every room has a sensor · info: n of m rooms (left out in a plan without rooms)
 *   meters  ok: n placed, each with a reading · warn: a meter without a reading · todo: meters of the energy dashboard not in the plan
 *           (params.missing: [{ kind, entity }]) · info: none
 *   sums    ok: nothing off · warn: n things do not add up (shown above with buttons)
 * bal: energyBalance(...), prop: fromEnergyPrefs(...) or null (not asked yet)
 */
export function setupChecklist(bal, layout, states, prop = null) {
  const out = [], src = bal.sources, item = (key, level, params = {}) => out.push({ key, level, params });
  if (!src.grid.from) item('grid', 'todo');
  else item('grid', bal.grid === null ? 'warn' : 'ok');
  if (!src.solar.from) item('solar', 'info');
  else item('solar', bal.prod === null ? 'warn' : 'ok');
  if (!src.battery.from && !src.battery.levelFrom) item('battery', 'info');
  else item('battery', bal.battery ? 'ok' : 'warn');
  item('house', bal.measured !== null ? 'ok' : 'info');
  const rooms = (layout?.floors || []).reduce((n, f) => n + (f.kind === 'roof' ? 0 : (f.rooms || []).length), 0), withSensor = bal.rooms.length;
  if (rooms) item('rooms', withSensor >= rooms ? 'ok' : 'info', { n: withSensor, m: rooms });   // a plan without rooms: nothing to say
  const meters = (layout?.floors || []).flatMap((f) => f.devices || []).filter((d) => METER_TYPES.has(d.type) && d.entity);
  const placed = new Set(meters.map((d) => d.entity)), missing = (prop?.meters || []).filter((m) => !placed.has(m.entity));
  if (missing.length) item('meters', 'todo', { n: missing.length, missing });
  else if (meters.some((d) => !reading(states, d.entity))) item('meters', 'warn', { n: meters.filter((d) => !reading(states, d.entity)).length });
  else item('meters', meters.length ? 'ok' : 'info', { n: meters.length });
  const off = energyChecks(bal).length;
  if (src.grid.from) item('sums', off ? 'warn' : 'ok', { n: off });
  return out;
}
