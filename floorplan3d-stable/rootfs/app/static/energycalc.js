/* The power bookkeeping (#378): which Home Assistant sensor is what (grid, solar, battery, house, rooms), how the power of the house adds
 * up, what does not add up (checks), and the text of the power overview (the pill at the top left, also in live mode). Set in the tab
 * "⚡ Rechnung" of the power editor (energyui.js) and saved with the house in layout.energy; what is not set there comes from the power
 * devices of the plan, as before. Pure (no three.js, no DOM): unit test tests/energycalc.test.mjs.
 *
 * layout.energy, everything optional:
 *   grid:    { split, entity, invert, imp, exp }  one sensor (plus = drawn from the grid, minus = fed in; invert turns it round), or two
 *                                                 (split): drawn (imp) and fed in (exp), both counted as positive
 *   solar:   { entities: [] }                     the production, added up
 *   battery: { level, split, entity, invert, charge, discharge, balance }
 *                                                 level: the charge in %; one sensor (plus = charging; invert turns it round) or two
 *                                                 (split); balance false leaves the battery out of the consumption (a hybrid inverter
 *                                                 whose production sensor already includes it)
 *   house:   { entity }                           a sensor of the house's consumption: shown instead of the calculated one, which it is
 *                                                 compared with
 *   rooms:   { roomId: [entities] }               what the rooms use (plugs, sub-meters); the rest is what no room accounts for */
import { unitFactor, fmtWatts } from './powerlogic.js';

/** below this many watts a battery counts as idle */
export const IDLE = 20;
/** how far below zero the calculated consumption may be before a sign is probably wrong (meters do not tick at the same moment) */
export const TOLERANCE = 50;

/** watts with a minus in front when below 0 (fmtWatts leaves the sign out) */
export const fmtSigned = (w) => `${w < 0 ? '−' : ''}${fmtWatts(w)}`;

const ids = (v) => [...new Set((Array.isArray(v) ? v : []).filter((e) => typeof e === 'string' && e))];
const one = (v) => (typeof v === 'string' ? v : '');
const z = (n) => n + 0;                                                    // no -0 (from turning 0 round)

/** watts of a sensor (kW and MW converted); null without a number, and for a charge level (%) */
export function sensorWatts(states, e) {
  const s = e ? states[e] : null;
  if (!s || (s.unit || '') === '%') return null;
  const n = parseFloat(s.state);
  return Number.isFinite(n) ? n * unitFactor(s.unit) : null;
}
/** a state that is a power (W, kW, MW or device class power): what the lists of the tab offer */
export const isPowerState = (s) => !!s && (s.dc === 'power' || /^[kKmM]?W$/.test(s.unit || ''));
/** a state that is a charge level in % */
export const isLevelState = (s) => !!s && (s.unit || '') === '%' && Number.isFinite(parseFloat(s.state));

const linked = (devices, type) => devices.filter((d) => d.type === type && d.entity);

/**
 * What each part is read from: the tab's choice ('set'), else the power devices of the plan ('plan'), else nothing (null).
 * { grid: { split, net: [], imp, exp, invert, from, devices }, solar: { entities, from, devices },
 *   battery: { level, levelFrom, split, charge, discharge, power: [{ e, invert }], balance, from, devices }, house, rooms: { roomId: [] } }
 */
export function energySources(cfg, devices = [], states = {}) {
  const c = cfg && typeof cfg === 'object' ? cfg : {}, g = c.grid || {}, b = c.battery || {};
  const meters = linked(devices, 'powermeter').length ? linked(devices, 'powermeter') : linked(devices, 'houseentry');
  let grid;
  if (g.split && (g.imp || g.exp)) grid = { split: true, net: [], imp: one(g.imp), exp: one(g.exp), invert: false, from: 'set', devices: [] };
  else if (!g.split && g.entity) grid = { split: false, net: [g.entity], imp: '', exp: '', invert: !!g.invert, from: 'set', devices: [] };
  else grid = { split: false, net: meters.map((d) => d.entity), imp: '', exp: '', invert: !!g.invert, from: meters.length ? 'plan' : null, devices: meters };

  const pv = ids(c.solar?.entities), auto = linked(devices, 'inverter').length ? linked(devices, 'inverter') : linked(devices, 'solarpanel');
  const solar = pv.length ? { entities: pv, from: 'set', devices: [] } : { entities: auto.map((d) => d.entity), from: auto.length ? 'plan' : null, devices: auto };

  const bats = devices.filter((d) => d.type === 'battery');
  const lvAuto = bats.find((d) => d.entity && isLevelState(states[d.entity]))?.entity || '';
  const own = b.split ? !!(b.charge || b.discharge) : !!b.entity;
  const power = own ? (b.split ? [] : [{ e: b.entity, invert: !!b.invert }])
    : bats.map((d) => ({ e: d.batPower || (d.entity !== lvAuto ? d.entity || '' : ''), invert: !!d.batInvert !== !!b.invert })).filter((x) => x.e);
  const battery = { level: one(b.level) || lvAuto, levelFrom: b.level ? 'set' : lvAuto ? 'plan' : null, split: !!b.split && own,
    charge: own ? one(b.charge) : '', discharge: own ? one(b.discharge) : '', power, balance: b.balance !== false,
    from: own ? 'set' : power.length ? 'plan' : null, devices: own ? [] : bats };

  const rooms = {};
  Object.entries(c.rooms && typeof c.rooms === 'object' ? c.rooms : {}).forEach(([k, v]) => { const l = ids(v); if (l.length) rooms[k] = l; });
  return { grid, solar, battery, house: one(c.house?.entity), rooms };
}

/** the sensors that are grid, solar, battery or house (a room must not count them again) */
export function sourceEntities(src) {
  const b = src.battery;
  return new Set([...src.grid.net, src.grid.imp, src.grid.exp, ...src.solar.entities, src.house, b.level, b.charge, b.discharge, ...b.power.map((p) => p.e)].filter(Boolean));
}

/** the battery now: { v (charge in %, or null), flow (watts, plus = charging, or null), dir (1 charging, -1 discharging, 0 idle, null unknown) }, or null */
export function batteryNow(states, b) {
  const ls = b.level ? states[b.level] : null, lv = ls ? parseFloat(ls.state) : NaN;
  let flow = null, dir = null;
  if (b.split) {
    const c = sensorWatts(states, b.charge), d = sensorWatts(states, b.discharge);
    if (c !== null || d !== null) flow = z(Math.abs(c ?? 0) - Math.abs(d ?? 0));
  } else {
    b.power.forEach(({ e, invert }) => {
      const s = states[e];
      if (!s) return;
      const txt = String(s.state).toLowerCase();                          // a text sensor only tells the direction
      if (/^(charging|laden|lädt)/.test(txt)) { dir = dir ?? 1; return; }
      if (/^(discharging|entladen|entlädt)/.test(txt)) { dir = dir ?? -1; return; }
      const w = sensorWatts(states, e);
      if (w !== null) flow = z((flow ?? 0) + (invert ? -w : w));
    });
  }
  if (flow !== null) dir = Math.abs(flow) < IDLE ? 0 : Math.sign(flow);
  const v = Number.isFinite(lv) ? lv : null;
  return v !== null || flow !== null || dir !== null ? { v, flow, dir } : null;
}

const add = (vals) => { const v = vals.filter((x) => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
/** the calculated consumption: production + grid (plus = drawn) - battery (plus = charging); null without production and grid */
const calcLoad = (prod, grid, bat) => (prod !== null || grid !== null ? z((prod ?? 0) + (grid ?? 0) - bat) : null);

/**
 * The power of the house now. { prod (production, never below 0), grid (plus = drawn, minus = fed in), imp, exp (drawn, fed in),
 * battery (batteryNow), counted (the battery's watts in the consumption), calc (calculated consumption, may be below 0 when a sign is
 * wrong), measured (the house sensor), load (what is shown: measured, else calculated, never below 0), rooms: [{ id, floor, name,
 * entities, watts }], roomsSum, rest (load - rooms), self (own production used in the house or stored), autarky (% of the consumption
 * not drawn from the grid), twice (sensors that would be counted twice), sources (energySources) }
 */
export function energyBalance(states, layout) {
  const floors = layout?.floors || [], devices = floors.flatMap((f) => f.devices || []);
  const src = energySources(layout?.energy, devices, states);
  const watts = (es) => add(es.map((e) => sensorWatts(states, e)));
  const raw = watts(src.solar.entities), prod = raw === null ? null : Math.max(0, raw);
  let grid = null;
  if (src.grid.split) {
    const i = sensorWatts(states, src.grid.imp), x = sensorWatts(states, src.grid.exp);
    if (i !== null || x !== null) grid = z(Math.abs(i ?? 0) - Math.abs(x ?? 0));
  } else {
    const n = watts(src.grid.net);
    grid = n === null ? null : z(src.grid.invert ? -n : n);
  }
  const battery = batteryNow(states, src.battery);
  const counted = src.battery.balance && battery?.flow != null ? battery.flow : 0;
  const calc = calcLoad(prod, grid, counted);
  const measured = sensorWatts(states, src.house);
  const load = measured !== null ? Math.max(0, measured) : calc === null ? null : Math.max(0, calc);

  const used = sourceEntities(src), seen = new Set(), twice = new Set(), rooms = [];
  floors.forEach((f, fi) => (f.rooms || []).forEach((r) => {
    const es = src.rooms[r.id];
    if (!es) return;
    const mine = es.filter((e) => { if (used.has(e) || seen.has(e)) { twice.add(e); return false; } seen.add(e); return true; });
    rooms.push({ id: r.id, floor: fi, name: r.name || '', entities: es, watts: watts(mine) });
  }));
  const roomsSum = add(rooms.map((r) => r.watts)), rest = load !== null && roomsSum !== null ? z(load - roomsSum) : null;
  const imp = grid === null ? null : Math.max(0, grid), exp = grid === null ? null : z(Math.max(0, -grid));
  const self = prod === null ? null : Math.max(0, prod - (exp ?? 0));
  const autarky = load && grid !== null ? Math.max(0, Math.min(100, Math.round((1 - imp / load) * 100))) : null;
  return { prod, grid, imp, exp, battery, counted, calc, measured, load, rooms, roomsSum, rest, self, autarky, twice: [...twice], sources: src };
}

/** which signs, turned round, would make the calculation add up: ['grid', 'battery'] (each only when it is one sensor that can be turned);
 *  with a house sensor the ones that bring the calculation closer to it, else the ones that bring it to 0 or above */
export function signFixes(bal) {
  const { prod, grid, counted, calc, measured, sources: src } = bal;
  if (calc === null) return [];
  const tries = [];
  if (grid !== null && !src.grid.split && src.grid.net.length) tries.push(['grid', calcLoad(prod, -grid, counted)]);
  if (counted && !src.battery.split) tries.push(['battery', calcLoad(prod, grid, -counted)]);
  if (measured !== null) return tries.filter(([, c]) => Math.abs(c - measured) < Math.abs(calc - measured) / 2).map(([k]) => k);
  return tries.filter(([, c]) => c >= -TOLERANCE).map(([k]) => k);
}

/**
 * What does not add up: [{ code, params, fixes }]. negative: the calculated consumption is below 0 (a sign is wrong); differs: the house
 * sensor and the calculation are far apart; rooms: the rooms use more than the house; twice: a sensor counted twice.
 * fixes: signFixes (buttons to turn a sign round).
 */
export function energyChecks(bal) {
  const out = [], { calc, measured, load, roomsSum } = bal;
  if (calc !== null && calc < -TOLERANCE && measured === null) out.push({ code: 'negative', params: { w: fmtWatts(calc) }, fixes: signFixes(bal) });
  if (calc !== null && measured !== null && Math.abs(calc - measured) > Math.max(100, Math.abs(measured) * 0.15)) {
    out.push({ code: 'differs', params: { calc: fmtSigned(calc), measured: fmtWatts(measured) }, fixes: signFixes(bal) });
  }
  if (roomsSum !== null && load !== null && roomsSum > load + Math.max(TOLERANCE, load * 0.1)) out.push({ code: 'rooms', params: { rooms: fmtWatts(roomsSum), load: fmtWatts(load) }, fixes: [] });
  if (bal.twice.length) out.push({ code: 'twice', params: { list: bal.twice.join(', ') }, fixes: [] });
  return out;
}

/** turn the sign of 'grid' or 'battery' round in the tab's settings (energy: layout.energy, changed in place) */
export function flipSign(energy, part) {
  const p = (energy[part] = energy[part] || {});
  if (p.invert) delete p.invert; else p.invert = true;
}

/**
 * Sensors for the rooms that measure power: placed in the room or in its Home Assistant area. { roomId: [entities] }, only rooms that get
 * one; sensors that already are grid, solar, battery or house, or already in a room, are left out. inPoly(x, z, points)
 */
export function suggestRooms(layout, states, areaOf, inPoly) {
  const src = energySources(layout?.energy, (layout?.floors || []).flatMap((f) => f.devices || []), states);
  const used = new Set([...sourceEntities(src), ...Object.values(src.rooms).flat()]), out = {};
  const byArea = new Map();
  Object.entries(areaOf || {}).forEach(([e, a]) => { if (!byArea.has(a)) byArea.set(a, []); byArea.get(a).push(e); });
  (layout?.floors || []).forEach((f) => (f.rooms || []).forEach((r) => {
    const cand = new Set(r.area ? byArea.get(r.area) || [] : []);
    (f.devices || []).forEach((d) => { if (d.entity && r.points && inPoly(d.x, d.z, r.points)) cand.add(d.entity); });
    const pick = [...cand].filter((e) => e.startsWith('sensor.') && isPowerState(states[e]) && !used.has(e)).sort();
    if (!pick.length) return;
    out[r.id] = pick; pick.forEach((e) => used.add(e));
  }));
  return out;
}

/**
 * The calculation as the tab shows it, line by line: [{ sign ('', '+', '−', '='), label, value, cls ('sum', 'bad', 'room', 'extra') }].
 * Production, + drawn / − fed in, − charging / + discharging (or not counted), = calculated, the measured one, the rooms and the rest,
 * own use of the solar power and autarky.
 */
export function balanceRows(bal, t) {
  const rows = [], row = (sign, key, value, cls = '') => rows.push({ sign, label: t(key), value, cls });
  if (bal.prod !== null) row('', 'energy.r.prod', fmtWatts(bal.prod));
  if (bal.grid !== null) row(bal.grid < 0 ? '−' : '+', bal.grid < 0 ? 'energy.r.feedIn' : 'energy.r.draw', fmtWatts(bal.grid));
  const f = bal.battery?.flow;
  if (f != null && f !== 0) {
    if (!bal.sources.battery.balance) row('', 'energy.r.batOff', fmtSigned(f));
    else row(f > 0 ? '−' : '+', f > 0 ? 'energy.r.charge' : 'energy.r.discharge', fmtWatts(f));
  }
  if (bal.calc !== null) row('=', 'energy.r.calc', fmtSigned(bal.calc), bal.calc < -TOLERANCE ? 'bad' : bal.measured === null ? 'sum' : '');
  if (bal.measured !== null) row('', 'energy.r.measured', fmtWatts(bal.measured), 'sum');
  bal.rooms.forEach((r) => rows.push({ sign: '', label: `↳ ${r.name || t('energy.room')}`, value: r.watts === null ? '–' : fmtWatts(r.watts), cls: 'room' }));
  if (bal.rest !== null) row('', 'energy.r.rest', fmtSigned(bal.rest), bal.rest < -Math.max(TOLERANCE, (bal.load || 0) * 0.1) ? 'bad room' : 'room');
  if (bal.prod) row('', 'energy.r.self', fmtWatts(bal.self), 'extra');
  if (bal.autarky !== null) row('', 'energy.r.autarky', `${bal.autarky} %`, 'extra');
  return rows;
}

/** the text of the power overview pill and its tooltip, null when there is nothing to show (the meters have their own pill, meterText) */
export function energyText(e, t) {
  const parts = [], tips = [];
  if (e.prod !== null) { parts.push(`☀ ${fmtWatts(e.prod)}`); tips.push(`${t('power.sum.prod')}: ${fmtWatts(e.prod)}`); }
  if (e.grid !== null) { parts.push(`⚡ ${fmtWatts(e.grid)}`); tips.push(`${t(e.grid < 0 ? 'power.sum.feedIn' : 'power.sum.draw')}: ${fmtWatts(e.grid)}`); }
  if (e.load !== null) { parts.push(`⌂ ${fmtWatts(e.load)}`); tips.push(`${t(e.measured != null ? 'power.sum.loadMeasured' : 'power.sum.load')}: ${fmtWatts(e.load)}`); }
  if (e.battery) {
    const f = e.battery.flow, dir = e.battery.dir ?? (f == null ? null : Math.abs(f) < IDLE ? 0 : Math.sign(f));
    const lvl = e.battery.v == null ? '' : `${Math.round(e.battery.v)} %`;
    const arrow = dir > 0 ? '↑' : dir < 0 ? '↓' : '', amount = arrow && f != null ? ` ${fmtWatts(f)}` : '';   // up = charging, down = discharging
    const word = dir == null ? '' : dir === 0 ? t('power.sum.idle') : dir > 0 ? t('power.sum.charging') : t('power.sum.discharging');
    parts.push(`🔋 ${lvl}${arrow ? ` ${arrow}` : ''}${amount}`.replace(/\s+/g, ' ').trim()); tips.push(`${t('power.sum.battery')}: ${[lvl, word].filter(Boolean).join(' · ')}`);
  }
  if (e.rooms?.length) {
    const shown = e.rooms.filter((r) => r.watts !== null).sort((p, q) => q.watts - p.watts);
    if (shown.length) tips.push(`${t('power.sum.rooms')}: ${shown.map((r) => `${r.name || '?'} ${fmtWatts(r.watts)}`).join(', ')}`);
    if (e.rest != null) tips.push(`${t('power.sum.rest')}: ${fmtSigned(e.rest)}`);
  }
  return parts.length ? { text: parts.join(' · '), title: tips.join('\n') } : null;
}
