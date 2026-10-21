/* The page 🌡 Klima of the tab bar (#483): a card per room with its temperature, humidity and air (CO₂), the target of its thermostat with
 * − / +, whether it heats or cools, "Lüften" when the air is bad and a warning when a window is open while it heats; below the thermostats
 * and water heaters (a heat pump's hot water) that are in no room, and a tip. Pure (unit test: tests/climate.test.mjs); pageclimate.js
 * draws. The readings are the ones of the room tiles (roomReading in roomtiles.js). */
import { roomReading } from './roomtiles.js';
import { heatMode } from './heating.js';

/** the CO₂ (ppm) from which a room should be aired: the third stop of the colour scale "CO₂" (settings.co2Stops, normally 1200 ppm) */
export function airLimit(stops) {
  const vs = (Array.isArray(stops) ? stops : []).map((s) => s?.v).filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  return vs.length >= 3 ? vs[2] : 1200;
}

/** what the card of a room shows: { temp, humid, co2 (or null each), air: 'good' | 'bad' | null, climate (the room's first thermostat or
 *  air conditioner, or null), mode (heatMode: heating | cooling | idle | off, null), target (its target temperature, null) }.
 *  ids: the room's entities (roomEntityIds), stops: settings.co2Stops */
export function roomClimate(ids, states, stops) {
  const list = [...ids];
  const temp = roomReading(list, states, 'temp'), humid = roomReading(list, states, 'humid'), co2 = roomReading(list, states, 'co2');
  const climate = list.filter((e) => e.startsWith('climate.') && states[e]).sort()[0] || null;
  const s = climate ? states[climate] : null;
  return {
    temp, humid, co2,
    air: co2 === null ? null : co2 >= airLimit(stops) ? 'bad' : 'good',
    climate, mode: climate ? heatMode(climate, s) : null,
    target: s && s.state !== 'off' && typeof s.tt === 'number' ? s.tt : null,
  };
}

/**
 * The rooms of the page: rooms [{ id, name, floor, ids, open: [names of its open windows and doors] }] with what roomClimate says, only
 * those with a temperature or a thermostat; in the order given (floor by floor).
 */
export function climateRooms(rooms, states, stops) {
  return (rooms || []).map((r) => ({ ...r, open: r.open || [], ...roomClimate(r.ids || [], states || {}, stops) }))
    .filter((r) => r.temp !== null || r.climate);
}

/** too cold or too warm? 'cold' | 'warm' | null: more than 1 ° under its target or 1.5 ° over it; a room without a target under 17 ° or
 *  over 26 ° */
export function attention(r) {
  if (r.temp === null || r.temp === undefined) return null;
  if (typeof r.target === 'number') return r.temp < r.target - 1 ? 'cold' : r.temp > r.target + 1.5 ? 'warm' : null;
  return r.temp < 17 ? 'cold' : r.temp > 26 ? 'warm' : null;
}

/** a window or door open while the room heats (or cools): the heating works for the garden */
export const wasting = (r) => (r.open || []).length > 0 && (r.mode === 'heating' || r.mode === 'cooling');

/** the thermostats, air conditioners and water heaters (a heat pump's hot water) that are in none of the rooms: [{ entity, kind:
 *  'climate' | 'water' }], by entity id */
export function looseClimates(states, inRooms) {
  const taken = new Set(inRooms || []);
  return Object.keys(states || {}).filter((e) => (e.startsWith('climate.') || e.startsWith('water_heater.')) && !taken.has(e)).sort()
    .map((entity) => ({ entity, kind: entity.startsWith('water_heater.') ? 'water' : 'climate' }));
}

/** the tips under the rooms, the most useful first: an open window while it heats, then bad air (the worst first); [{ key: 'window' |
 *  'air', room (its name), co2 }] */
export function climateTips(rooms) {
  const tips = (rooms || []).filter(wasting).map((r) => ({ key: 'window', room: r.name, co2: r.co2 }));
  (rooms || []).filter((r) => r.air === 'bad').sort((a, b) => b.co2 - a.co2).forEach((r) => tips.push({ key: 'air', room: r.name, co2: r.co2 }));
  return tips;
}

/** has the page anything to show: a thermostat or water heater, or a temperature sensor in the plan (tempIds: the entities placed in it) */
export function hasClimate(states, placedIds = []) {
  const st = states || {};
  if (Object.keys(st).some((e) => e.startsWith('climate.') || e.startsWith('water_heater.'))) return true;
  return placedIds.some((e) => e.startsWith('sensor.') && st[e] && (st[e].unit === '°C' || st[e].unit === '°F' || st[e].dc === 'temperature'));
}

/** the filter chips: all rooms, or only those too warm / too cold, with an open window while heating or with bad air */
export const FILTERS = ['all', 'notice'];
export const noticed = (r) => !!attention(r) || wasting(r) || r.air === 'bad';
export const filterRooms = (rooms, f) => (f === 'notice' ? rooms.filter(noticed) : rooms);
