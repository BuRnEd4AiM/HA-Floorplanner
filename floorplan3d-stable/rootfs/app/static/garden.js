/* 🌱 The garden on 🧺 Haushalt (#533, picture docs/ideen-4.3/8-haushalt.jpg): the watering zones (valves, or switches named like watering),
 * whether one runs and until when ("💧 10 min gießen": the add-on switches it off by itself, garden.py), when it last watered, the rain of
 * today and tomorrow from the forecast and the moisture of the soil. Found by their names or chosen in ⚙. Pure rules (unit test:
 * tests/garden.test.mjs); outdoorcards.js draws. */

export const MAX_ZONES = 6;
export const MINUTES = [5, 10, 15, 20, 30, 45, 60];
const ID = /^(valve|switch)\.[a-z0-9_]+$/;
const fold = (s) => String(s || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_');
/** a watering zone by its name (folded) */
const WATER = /(bewasserung|bewaesserung|beregnung|rasen|garten|sprinkler|irrigation|regner|giessen|giess|tropf|hochbeet|beet|watering|arrosage|riego|irrigazione|sproei|podlew|gardena)/;
const NOT_WATER = /(licht|light|lampe|lamp|beleuchtung|steckdose|socket|pumpe_pool|pool)/;
const has = (e, re) => re.test(fold(e.entity_id)) || re.test(fold(e.name));

/** the zones: chosen in ⚙ (settings.garden.zones), else every valve and every switch named like watering; at most MAX_ZONES */
export function findZones(entities, chosen) {
  const list = (entities || []).filter((e) => e && typeof e.entity_id === 'string');
  const own = Array.isArray(chosen) ? chosen.filter((x) => typeof x === 'string' && ID.test(x)) : [];
  if (own.length) return [...new Set(own)].slice(0, MAX_ZONES);
  return list.filter((e) => e.entity_id.startsWith('valve.') || (e.entity_id.startsWith('switch.') && has(e, WATER) && !has(e, NOT_WATER)))
    .map((e) => e.entity_id).slice(0, MAX_ZONES);
}
/** the soil moisture: a sensor of the class moisture (in %), one named like the garden first */
export function findMoisture(entities) {
  const list = (entities || []).filter((e) => e?.entity_id?.startsWith('sensor.') && (e.dc === 'moisture' || has(e, /bodenfeucht|soil_moisture|feuchte_boden/)) && e.unit === '%');
  return (list.find((e) => has(e, WATER)) || list[0])?.entity_id || '';
}
export const hasGarden = (zones) => Array.isArray(zones) && zones.length > 0;

/** is a zone watering now (a valve open or opening, a switch on) */
export const isOn = (s) => ['on', 'open', 'opening'].includes(s?.state);
/** the service that starts or stops a zone: valve open_valve / close_valve, switch turn_on / turn_off */
export const zoneService = (entity, on) => (String(entity).startsWith('valve.') ? (on ? 'open_valve' : 'close_valve') : (on ? 'turn_on' : 'turn_off'));

/** the rain of today and tomorrow in mm from a daily forecast ([{ t, p }]); null where it says nothing. now: ms */
export function rainOf(forecast, now = Date.now()) {
  const day = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  const today = day(now), tomorrow = day(now + 86400000), out = { today: null, tomorrow: null };
  (Array.isArray(forecast) ? forecast : []).forEach((r) => {
    const t = Date.parse(r?.t), p = Number(r?.p);
    if (!Number.isFinite(t) || !Number.isFinite(p)) return;
    if (day(t) === today && out.today == null) out.today = p;
    if (day(t) === tomorrow && out.tomorrow == null) out.tomorrow = p;
  });
  return out;
}

/** the card: { zones: [{ entity, name, on, until (ms, a timer of the add-on), since (ms of the last change) }], running, lastWater (ms: the
 *  last zone that stopped), rain, moisture (%) }. timers: { entity: until ms } (api/garden), names: entity -> name */
export function gardenView(zones, states = {}, { timers = {}, forecast = [], moisture = '', names = {}, now = Date.now() } = {}) {
  const rows = (zones || []).map((e) => {
    const s = states[e], until = Number(timers[e]);
    return { entity: e, name: names[e] || e, on: isOn(s), until: Number.isFinite(until) && until > now ? until : null, since: Number.isFinite(s?.lc) ? s.lc * 1000 : null };
  });
  const stopped = rows.filter((z) => !z.on && z.since).map((z) => z.since);
  const m = moisture ? parseFloat(states[moisture]?.state) : NaN;
  return { zones: rows, running: rows.some((z) => z.on), lastWater: stopped.length ? Math.max(...stopped) : null, rain: rainOf(forecast, now),
    moisture: Number.isFinite(m) ? Math.round(m) : null };
}

/** the garden's choices as kept in the settings (the server does the same: garden.clean_garden): { zones, minutes } */
export function cleanGarden(v) {
  const zones = Array.isArray(v?.zones) ? [...new Set(v.zones.filter((x) => typeof x === 'string' && ID.test(x)))].slice(0, MAX_ZONES) : [];
  return { zones, minutes: MINUTES.includes(Number(v?.minutes)) ? Number(v.minutes) : 10 };
}
