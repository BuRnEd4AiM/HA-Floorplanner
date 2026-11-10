/* 🌡 Where the temperature and the humidity of a room come from (#705). Automatic (as always): the mean of the room's own sensors (placed
 * in it or in its Home Assistant area), its thermostat only when it has none. Per room it can instead be the thermostat (what it measures,
 * the other sensors are left out) or exactly one sensor: e.g. a switch whose own warmth makes its temperature too high stays in the area
 * for other things but does not count. Stored as rooms[].tempFrom / rooms[].humidFrom: 'climate' or an entity id; unset = automatic.
 * Everything that shows a room's reading follows it (labels and tiles, the colour views, the 🌡 Klima page, the voice search); the heating
 * rules keep their thermostat and their 🌡 Raumfühler.
 * Pure (no DOM; unit test: tests/roomsource.test.mjs); roomsourceui.js draws the fields, roomtiles.js roomReading takes the choice. */

/** the field of a room for each reading that can be chosen */
export const SOURCE_KEY = { temp: 'tempFrom', humid: 'humidFrom' };
/** the choice "the thermostat" */
export const THERMOSTAT = 'climate';

const ENTITY = /^[a-z_]+\.[a-z0-9_]+$/;

/** the reading of one entity (state s) for a mode, null when it has none: temp in °C, humid in %, co2 in ppm. A thermostat gives what it
 *  measures (ct / ch, temp and humid only), a sensor its state when its unit or device class fits */
export function entityReading(id, s, mode) {
  if (!s || typeof id !== 'string') return null;
  if (id.startsWith('climate.')) {
    const v = mode === 'temp' ? s.ct : mode === 'humid' ? s.ch : null;
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  if (!id.startsWith('sensor.')) return null;
  const num = parseFloat(s.state);
  if (Number.isNaN(num)) return null;
  if (mode === 'temp' && (s.unit === '°C' || s.unit === '°F' || s.dc === 'temperature')) return s.unit === '°F' ? ((num - 32) * 5) / 9 : num;
  if (mode === 'humid' && s.unit === '%' && (s.dc === 'humidity' || /feucht|humid/i.test(id))) return num;
  if (mode === 'co2' && (s.dc === 'carbon_dioxide' || (s.unit === 'ppm' && /co2/i.test(id)))) return num;
  return null;
}

/** the source of a room's reading: 'climate', an entity id, or '' (automatic; also for co2 and for anything unknown) */
export function sourceOf(room, mode) {
  const k = SOURCE_KEY[mode], v = k ? room?.[k] : '';
  return typeof v === 'string' && (v === THERMOSTAT || ENTITY.test(v)) ? v : '';
}

/** set the source of a room's reading (a change of the room): '' (automatic) removes the field */
export function setSource(room, mode, v) {
  const k = SOURCE_KEY[mode];
  if (!k || !room) return;
  if (v === THERMOSTAT || (typeof v === 'string' && ENTITY.test(v))) room[k] = v; else delete room[k];
}

/** is the entity a thermostat's own sensor or the thermostat itself (they count as "the thermostat"); partOf: { sensor: its thermostat } */
const isThermo = (id, partOf) => id.startsWith('climate.') || !!partOf?.[id];
const mean = (vals) => (vals.length ? vals.reduce((x, y) => x + y) / vals.length : null);

/** the readings of a room's entities: { own: [{ id, v }] (its sensors), thermo: [{ id, v }] (its thermostats and their sensors) } */
export function readings(ids, states, mode, partOf = {}) {
  const own = [], thermo = [];
  [...(ids || [])].forEach((id) => {
    const v = entityReading(id, states?.[id], mode);
    if (v !== null) (isThermo(id, partOf) ? thermo : own).push({ id, v });
  });
  return { own, thermo };
}

/** the value of a room's reading from its source `from` (sourceOf): one entity → its reading; 'climate' → the mean of its thermostats;
 *  '' → the mean of its own sensors, else of its thermostats. null when nothing reports (a chosen source that does not report: null, the
 *  others are not taken instead) */
export function readingFrom(ids, states, mode, partOf = {}, from = '') {
  if (from && from !== THERMOSTAT) return entityReading(from, states?.[from], mode);
  const { own, thermo } = readings(ids, states, mode, partOf);
  const list = from === THERMOSTAT ? thermo : own.length ? own : thermo;
  return mean(list.map((x) => x.v));
}

/** what the field of a room offers for a mode: { auto (the automatic value), thermo (the thermostat's value or null), sensors: [{ id, v }]
 *  (its own sensors, sorted by id; the chosen one too when it is not among them, v null when it does not report), show (worth a field:
 *  at least two things measure, or a choice is stored) } */
export function sourceChoices(ids, states, mode, partOf = {}, chosen = '') {
  const { own, thermo } = readings(ids, states, mode, partOf);
  const sensors = [...own].sort((a, b) => a.id.localeCompare(b.id));
  if (chosen && chosen !== THERMOSTAT && !sensors.some((x) => x.id === chosen)) sensors.push({ id: chosen, v: entityReading(chosen, states?.[chosen], mode) });
  const thermoV = mean(thermo.map((x) => x.v));
  const count = own.length + (thermo.length ? 1 : 0);
  return { auto: readingFrom(ids, states, mode, partOf, ''), thermo: thermoV, sensors, show: count >= 2 || !!chosen };
}
