/* The settings of 🚗 the car and 🌱 the garden (#533) in ⚙ → 🗂 Reiter unten → Haushalt: which entity is the car's charge, range, charging,
 * charging power, time until full and "nur mit Sonne laden" (empty: found by its name, car.js), its name; "＋ Weiteres Auto" (#631): more
 * cars, each with its own entities and name (settings.cars, nothing found by name there); which valves or switches are
 * watering zones (none ticked: found by their names, garden.js) and how long "💧 gießen" waters. A part of the settings form (settings.js
 * parts: fill / read); the server keeps them in settings.car / settings.garden (garden.py clean_car, clean_garden). */
import { CAR_ROLES, MAX_CARS, cleanCar, cleanCars, findCar } from './car.js';
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
  const carBox = $('#setCar'), carName = $('#setCarName'), moreBox = $('#setCars'), addCar = $('#addCar'), zoneBox = $('#setZones'), minutes = $('#setWaterMinutes'), found = $('#outdoorFound');
  const make = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const byName = (a, b) => (a.name || a.entity_id).localeCompare(b.name || b.entity_id);
  const label = (e) => (e.name && e.name !== e.entity_id ? `${e.name} (${e.entity_id})` : e.entity_id);
  minutes.replaceChildren(...MINUTES.map((m) => new Option(t('garden.minutes', { n: m }), String(m))));

  /** the drop-downs of a car's entities; none: "automatisch" for the first car, "–" for the more cars (nothing is found for them) */
  function roleSelects(chosen, none = t('car.auto')) {
    const all = ctx.entities();
    return CAR_ROLES.map((role) => {
      const l = make('label', 'odPref'), sel = make('select');
      sel.dataset.role = role;
      const opts = all.filter(FITS[role]).sort(byName);
      sel.append(new Option(none, ''), ...opts.map((e) => new Option(label(e), e.entity_id)));
      if (chosen[role] && !opts.some((e) => e.entity_id === chosen[role])) sel.add(new Option(chosen[role], chosen[role]));
      sel.value = chosen[role] || '';
      l.append(document.createTextNode(t(`car.role.${role}`)), sel);
      return l;
    });
  }
  const carRows = (chosen) => carBox.replaceChildren(...roleSelects(chosen));
  /** one more car (#631): its number, × to remove it, its entities and its name */
  function moreCar(chosen = {}) {
    const box = make('div', 'odCar'), head = make('div', 'odCarHead'), title = make('b'), del = make('button');
    del.type = 'button'; del.textContent = '×'; del.title = t('car.remove');
    del.addEventListener('click', () => { box.remove(); number(); addCar.disabled = false; moreBox.dispatchEvent(new Event('change', { bubbles: true })); });   // the dialog saves on a change
    head.append(title, del);
    const roles = make('div', 'odPrefs'); roles.append(...roleSelects(chosen, '–'));
    const row = make('div', 'row'), nl = make('label'), name = make('input');
    name.type = 'text'; name.maxLength = 40; name.placeholder = t('car.namePh'); name.value = chosen.name || ''; name.dataset.role = 'name';
    nl.textContent = t('car.name'); row.append(nl, name);
    box.append(head, roles, row);
    return box;
  }
  /** "🚗 Auto 2", "🚗 Auto 3" … over the more cars */
  const number = () => moreBox.querySelectorAll('.odCar').forEach((b, i) => { b.querySelector('.odCarHead b').textContent = `🚗 ${t('car.title')} ${i + 2}`; });
  const typedCars = () => [...moreBox.querySelectorAll('.odCar')].map((b) => {
    const c = {};
    b.querySelectorAll('select[data-role]').forEach((s) => { if (s.value) c[s.dataset.role] = s.value; });
    const n = b.querySelector('input[data-role=name]').value;
    if (n.trim()) c.name = n;
    return c;
  });
  function moreRows(chosen) {
    // the dialog saves on every change and fills itself again: when the boxes already say this, they stay (with a new, still empty car)
    if (JSON.stringify(cleanCars(typedCars())) !== JSON.stringify(chosen) && !moreBox.contains(document.activeElement)) {
      moreBox.replaceChildren(...chosen.map(moreCar));
    }
    number();
    addCar.disabled = moreBox.childElementCount >= MAX_CARS;
  }
  addCar.addEventListener('click', () => {
    if (moreBox.childElementCount >= MAX_CARS) return;
    const b = moreCar(); moreBox.append(b); number(); addCar.disabled = moreBox.childElementCount >= MAX_CARS;
    b.querySelector('select').focus();
  });
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
      moreRows(cleanCars(settings.cars));
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
      next.cars = cleanCars(typedCars());
      next.garden = cleanGarden({ zones: [...zoneBox.querySelectorAll('input:checked')].map((c) => c.value), minutes: Number(minutes.value) });
    },
  };
}
