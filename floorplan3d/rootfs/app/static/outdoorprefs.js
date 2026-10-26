/* The settings of 🚗 the car and 🌱 the garden (#533) in ⚙ → 🗂 Reiter unten → Haushalt: which entity is the car's charge, range, charging,
 * charging power, time until full and "nur mit Sonne laden" (empty: found by its name, car.js), its name; which valves or switches are
 * watering zones (none ticked: found by their names, garden.js) and how long "💧 gießen" waters. A part of the settings form (settings.js
 * parts: fill / read); the server keeps them in settings.car / settings.garden (garden.py clean_car, clean_garden). */
import { CAR_ROLES, cleanCar, findCar } from './car.js';
import { cleanGarden, findZones, MINUTES } from './garden.js';

/** which entities may be chosen for a role of the car */
const FITS = {
  battery: (e) => e.entity_id.startsWith('sensor.') && e.unit === '%',
  range: (e) => e.entity_id.startsWith('sensor.') && (e.unit === 'km' || e.unit === 'mi'),
  charging: (e) => e.entity_id.startsWith('binary_sensor.'),
  power: (e) => e.entity_id.startsWith('sensor.') && ['W', 'kW'].includes(e.unit),
  ends: (e) => e.entity_id.startsWith('sensor.') && (e.dc === 'timestamp' || ['min', 'h'].includes(e.unit)),
  mode: (e) => /^(select|switch|input_boolean)\./.test(e.entity_id),
};

/** ctx: $, t, entities() (Home Assistant's entities [{ entity_id, name, unit, dc }]) */
export function initOutdoorPrefs(ctx) {
  const { $, t } = ctx;
  const carBox = $('#setCar'), carName = $('#setCarName'), zoneBox = $('#setZones'), minutes = $('#setWaterMinutes'), found = $('#outdoorFound');
  const make = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const byName = (a, b) => (a.name || a.entity_id).localeCompare(b.name || b.entity_id);
  const label = (e) => (e.name && e.name !== e.entity_id ? `${e.name} (${e.entity_id})` : e.entity_id);
  minutes.replaceChildren(...MINUTES.map((m) => new Option(t('garden.minutes', { n: m }), String(m))));

  function carRows(chosen) {
    const all = ctx.entities();
    carBox.replaceChildren(...CAR_ROLES.map((role) => {
      const l = make('label', 'odPref'), sel = make('select');
      sel.dataset.role = role;
      const opts = all.filter(FITS[role]).sort(byName);
      sel.append(new Option(t('car.auto'), ''), ...opts.map((e) => new Option(label(e), e.entity_id)));
      if (chosen[role] && !opts.some((e) => e.entity_id === chosen[role])) sel.add(new Option(chosen[role], chosen[role]));
      sel.value = chosen[role] || '';
      l.append(document.createTextNode(t(`car.role.${role}`)), sel);
      return l;
    }));
  }
  function zoneRows(chosen) {
    const all = ctx.entities().filter((e) => /^(valve|switch)\./.test(e.entity_id)).sort(byName);
    const ticked = new Set(chosen);
    zoneBox.replaceChildren(...all.map((e) => {
      const l = make('label', 'lockItem'), cb = make('input');
      cb.type = 'checkbox'; cb.value = e.entity_id; cb.checked = ticked.has(e.entity_id);
      l.append(cb, document.createTextNode(` ${label(e)}`));
      return l;
    }));
    if (!all.length) zoneBox.append(Object.assign(make('p', 'sub'), { textContent: t('garden.noZones') }));
  }
  function foundText(car, garden) {
    const f = findCar(ctx.entities(), car), z = findZones(ctx.entities(), garden.zones), parts = [];
    if (f.battery || f.range) parts.push(`🚗 ${[f.battery, f.range, f.mode].filter(Boolean).join(', ')}`);
    if (z.length) parts.push(`🌱 ${z.join(', ')}`);
    return parts.length ? `${t('car.found')} ${parts.join(' · ')}` : t('car.notFound');
  }
  return {
    fill(settings) {
      const car = cleanCar(settings.car), garden = cleanGarden(settings.garden);
      if (!carBox.contains(document.activeElement)) carRows(car);
      if (document.activeElement !== carName) carName.value = car.name || '';
      if (!zoneBox.contains(document.activeElement)) zoneRows(garden.zones);
      minutes.value = String(garden.minutes);
      found.textContent = foundText(car, garden);
    },
    read(next) {
      const car = {};
      carBox.querySelectorAll('select[data-role]').forEach((s) => { if (s.value) car[s.dataset.role] = s.value; });
      if (carName.value.trim()) car.name = carName.value;
      next.car = cleanCar(car);
      next.garden = cleanGarden({ zones: [...zoneBox.querySelectorAll('input:checked')].map((c) => c.value), minutes: Number(minutes.value) });
    },
  };
}
