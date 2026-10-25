/* 🚗 The car on 🧺 Haushalt (#533, picture docs/ideen-4.3/8-haushalt.jpg): its charge, the range, whether and how fast it charges, when it
 * is full, and "☀ Nur mit Sonne laden". The entities are found by their names (Auto, car, evcc, the makes …) or chosen in ⚙; "only with
 * the sun" is evcc's mode (a select with "pv" and "now") or a switch chosen in ⚙. Pure rules (unit test: tests/car.test.mjs);
 * outdoorcards.js draws. */

export const CAR_ROLES = ['battery', 'range', 'charging', 'power', 'ends', 'mode'];
const ID = /^[a-z_]+\.[a-z0-9_]+$/;
/** words of a car in an entity id or name (folded: lower case, no accents) */
const CAR = /(^|[^a-z])(auto|car|cars|pkw|fahrzeug|vehicle|elektroauto|e_?auto|evcc|tesla|model_?[3ysx]|id_?[3457]|enyaq|zoe|ioniq|polestar|kona|leaf|e_?golf|skoda|volkswagen|vw|bmw|i[34x]|renault|hyundai|kia|niro|ev[69]|mg4|byd|cupra|mustang|taycan|e_?tron|wallbox|charger|ladestation|loadpoint)([^a-z]|$)/;
const fold = (s) => String(s || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_');
const carry = (e) => CAR.test(fold(e.entity_id)) || CAR.test(fold(e.name));
const has = (e, re) => re.test(fold(e.entity_id)) || re.test(fold(e.name));
const dom = (id) => String(id || '').split('.')[0];
const POWER = { W: 1, kW: 1000, MW: 1e6 };

/** the car's entities: those chosen in ⚙ (settings.car), the rest found among Home Assistant's entities [{ entity_id, name, unit, dc,
 *  ctl }]; { battery, range, charging, power, ends, mode, name } ('' where none) */
export function findCar(entities, chosen = {}) {
  const list = (entities || []).filter((e) => e && typeof e.entity_id === 'string');
  const pick = (role, test) => {
    const c = chosen?.[role];
    if (typeof c === 'string' && ID.test(c)) return c;
    return list.find(test)?.entity_id || '';
  };
  const out = {
    battery: pick('battery', (e) => dom(e.entity_id) === 'sensor' && e.unit === '%' && carry(e) && (e.dc === 'battery' || has(e, /soc|ladestand|ladung|akku|battery|batterie|charge_level|state_of_charge/))),
    range: pick('range', (e) => dom(e.entity_id) === 'sensor' && (e.unit === 'km' || e.unit === 'mi') && (carry(e) || has(e, /reichweite|range|autonomie|autonomia|zasieg/))),
    charging: pick('charging', (e) => dom(e.entity_id) === 'binary_sensor' && carry(e) && (e.dc === 'battery_charging' || has(e, /charging|laedt|ladt|lädt|laden|ladevorgang|charge/))),
    power: pick('power', (e) => dom(e.entity_id) === 'sensor' && POWER[e.unit] && (has(e, /wallbox|charger|ladestation|ladeleistung|charge_power|charging_power|loadpoint/) || (carry(e) && has(e, /charg|lade/)))),
    ends: pick('ends', (e) => dom(e.entity_id) === 'sensor' && carry(e) && (e.dc === 'timestamp' || ['min', 'h'].includes(e.unit)) && has(e, /end|ende|fertig|full|voll|remaining|verbleib|restzeit|time_to/)),
    mode: pick('mode', (e) => dom(e.entity_id) === 'select' && (e.ctl?.options || []).includes('pv') && (e.ctl?.options || []).includes('now')),
  };
  out.name = typeof chosen?.name === 'string' && chosen.name.trim() ? chosen.name.trim().slice(0, 40) : '';
  return out;
}
/** is there a car at all (its charge or its range) */
export const hasCar = (found) => !!(found?.battery || found?.range);

const num = (s) => { const n = parseFloat(s?.state); return Number.isFinite(n) ? n : null; };
/** "☀ Nur mit Sonne laden" now: { entity, on, kind ('select': evcc's pv / now, 'switch': on / off) } or null without one */
export function solarMode(found, states = {}) {
  const e = found?.mode, s = e ? states[e] : null;
  if (!e) return null;
  if (dom(e) === 'select') return { entity: e, on: s?.state === 'pv' || s?.state === 'minpv', kind: 'select' };
  return { entity: e, on: s?.state === 'on', kind: 'switch' };
}
/** what a tap on "☀ Nur mit Sonne laden" does: [entity, service, data] */
export function solarCall(mode, wantOn) {
  if (!mode) return null;
  if (mode.kind === 'select') return [mode.entity, 'select_option', { option: wantOn ? 'pv' : 'now' }];
  return [mode.entity, wantOn ? 'turn_on' : 'turn_off', undefined];
}

/** the card: { level (%), range, rangeUnit, charging, watts, ends (ms or null), solar } from the states now; now: ms */
export function carView(found, states = {}, now = Date.now()) {
  const st = (role) => (found?.[role] ? states[found[role]] : null);
  const level = num(st('battery')), range = num(st('range')), p = num(st('power'));
  const watts = p == null ? null : Math.max(0, p * (POWER[st('power')?.unit] || 1));
  const ch = st('charging');
  const charging = ch ? ch.state === 'on' : watts != null ? watts > 50 : false;
  let ends = null;
  const e = st('ends');
  if (e && charging) {
    if (['min', 'h'].includes(e.unit)) { const v = num(e); if (v != null && v > 0) ends = now + v * (e.unit === 'h' ? 3600000 : 60000); }
    else { const t = Date.parse(e.state); if (Number.isFinite(t) && t > now) ends = t; }
  }
  return { level: level == null ? null : Math.max(0, Math.min(100, Math.round(level))), range: range == null ? null : Math.round(range),
    rangeUnit: st('range')?.unit || 'km', charging, watts, ends, solar: solarMode(found, states) };
}

/** the car's choices as kept in the settings (the server does the same: garden.clean_car); junk -> {} */
export function cleanCar(v) {
  const out = {};
  if (!v || typeof v !== 'object') return out;
  CAR_ROLES.forEach((r) => { if (typeof v[r] === 'string' && ID.test(v[r])) out[r] = v[r]; });
  if (typeof v.name === 'string' && v.name.trim()) out.name = v.name.trim().slice(0, 40);
  return out;
}
