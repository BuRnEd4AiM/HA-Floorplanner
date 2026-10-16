/* Device overview (#376): a list that the button "📋 Geräte" at the top shows and hides: every placed device linked to Home Assistant and
 * every door / window with a sensor or a roller shutter, by floor and room, with its state, its battery (the battery entity of its device
 * in Home Assistant, server: battery_of in renames.py, or the battery level it reports itself) and whether it is offline. A tap on one
 * shows it in the plan. Filters: all, with a battery (the emptiest first), offline. The rows are pure (unit test: tests/devicelist.test.mjs);
 * initDeviceList draws the panel and redraws it only when something it shows changed. */
import { badgeText } from './badgetext.js';
import { ringEntities } from './ledring.js';
import { openingWalls } from './dormerwin.js';
import { openingEntities, openingPoint, isOpenState } from './openings.js';
import { shutterEntity, shutterLabel } from './shutters.js';
import { ballIcon, SWITCH_ICON } from './tapballs.js';

/** a battery at or under this level (%) is low */
export const LOW_BATTERY = 20;
export const FILTERS = ['all', 'battery', 'offline'];

const level = (n) => (Number.isFinite(n) ? { level: Math.max(0, Math.min(100, Math.round(n))), low: n <= LOW_BATTERY } : null);
const unknown = (s) => !s || s.state === 'unavailable' || s.state === 'unknown';
/** the battery of entity e: { level (0..100, null for a "battery low" sensor), low }, or null when it has none or it does not report.
 *  From the entity itself (a battery sensor, the battery level a vacuum reports: bat), else from its device's battery entity
 *  (batteryOf: entity -> battery entity) */
export function batteryInfo(e, states, batteryOf = {}) {
  if (!e) return null;
  const own = states[e];
  if (own && e.startsWith('sensor.') && own.dc === 'battery') return unknown(own) ? null : level(parseFloat(own.state));
  if (typeof own?.bat === 'number') return level(own.bat);
  const b = batteryOf[e], s = b ? states[b] : null;
  if (unknown(s)) return null;
  if (b.startsWith('binary_sensor.')) return { level: null, low: s.state === 'on' };
  return level(parseFloat(s.state));
}

/** the room a point belongs to: the one it is in, else (a door on the edge) the nearest one within 40 cm */
function roomAt(f, x, z, env, edge) {
  const inside = f.rooms.find((r) => env.pointInPoly(x, z, r.points));
  if (inside || !edge || !env.distToPoly) return inside || null;
  return f.rooms.map((r) => ({ r, d: env.distToPoly(x, z, r.points) })).filter((q) => q.d < 0.4).sort((p, q) => p.d - q.d)[0]?.r || null;
}

/**
 * The overview: [{ floor, name, rooms: [{ name, items }] }], floors in their order, rooms by name (things in no room last), items by name.
 * item: { kind: 'device' | 'opening', id, floor, name, entity, type, icon (as on its tap ball), value, battery (batteryInfo), off (why it is
 * offline, offline.js) }.
 * env: { layout, states, t, pointInPoly, distToPoly, onStates, batteryOf, offline (Map id -> reason), nameOf(entity) }
 */
export function deviceRows(env) {
  const { layout, states, t } = env, off = env.offline || new Map(), batteryOf = env.batteryOf || {};
  const nameOf = env.nameOf || (() => '');
  return (layout?.floors || []).map((f, fi) => {
    const rooms = new Map(), add = (room, item) => {
      const k = room?.id ?? '';
      if (!rooms.has(k)) rooms.set(k, { name: room?.name || t('dl.noRoom'), none: !room, items: [] });
      rooms.get(k).items.push(item);
    };
    f.devices.forEach((d) => {
      const e = d.entity || ringEntities(d)[0] || (d.leds || []).find(Boolean) || '';   // an LED ring, a piece with LED zones (ledzones.js): its first light
      if (!e) return;                                              // only what is linked
      const s = states[e];
      const icon = ballIcon(d, (x) => states[x]?.dc);
      add(roomAt(f, d.x, d.z, env, false), { kind: 'device', id: d.id, floor: fi, name: d.name || nameOf(e) || t(`dev.${d.type}`), entity: e, type: d.type,
        icon: icon === SWITCH_ICON ? '⏻' : icon, value: badgeText(s, e, t, d.type), battery: batteryInfo(e, states, batteryOf), off: off.get(d.id) || null });
    });
    openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
      const ents = openingEntities(o), sh = shutterEntity(o);
      if (!ents.length && !sh) return;
      const [x, z] = openingPoint(w, o), vals = [];
      if (ents.length) vals.push(ents.some((e) => isOpenState(states[e], env.onStates)) ? t('state.open') : ents.some((e) => states[e]) ? t('state.closed') : '—');
      if (sh) vals.push(shutterLabel(states[sh], t));
      const bat = [...ents, sh].filter(Boolean).map((e) => batteryInfo(e, states, batteryOf)).filter(Boolean)
        .sort((p, q) => Number(q.low) - Number(p.low) || (p.level ?? 101) - (q.level ?? 101))[0] || null;   // the emptiest of its sensors
      add(roomAt(f, x, z, env, true), { kind: 'opening', id: o.id, floor: fi, name: o.name || t(`prop.${o.type}`), entity: ents[0] || sh, type: o.type,
        icon: o.type === 'door' ? (o.style === 'garage' ? '🚗' : '🚪') : '🪟', value: vals.join(' · '), battery: bat, off: off.get(o.id) || null });
    }));
    const list = [...rooms.values()].sort((p, q) => Number(p.none) - Number(q.none) || p.name.localeCompare(q.name));
    list.forEach((r) => r.items.sort((p, q) => p.name.localeCompare(q.name)));
    return { floor: fi, name: f.name || '', rooms: list };
  }).filter((f) => f.rooms.length);
}

/** the overview with only the things of filter ('all' | 'battery' | 'offline'); with a battery the emptiest come first in each room.
 *  Rooms and floors that are left empty go */
export function filterRows(floors, filter = 'all') {
  const keep = filter === 'battery' ? (it) => !!it.battery : filter === 'offline' ? (it) => !!it.off : () => true;
  const order = filter === 'battery' ? (p, q) => Number(q.battery.low) - Number(p.battery.low) || (p.battery.level ?? 101) - (q.battery.level ?? 101) || p.name.localeCompare(q.name) : null;
  return floors.map((f) => ({ ...f, rooms: f.rooms.map((r) => {
    const items = r.items.filter(keep);
    return { ...r, items: order ? items.sort(order) : items };
  }).filter((r) => r.items.length) })).filter((f) => f.rooms.length);
}

/** counts for the head of the list and the button: { n: things, battery: with a battery, low: low batteries, off: offline } */
export function summary(floors) {
  const all = floors.flatMap((f) => f.rooms.flatMap((r) => r.items));
  return { n: all.length, battery: all.filter((i) => i.battery).length, low: all.filter((i) => i.battery?.low).length, off: all.filter((i) => i.off).length };
}

/** the text of a battery: "🔋 85 %", low "🪫 12 %"; a "battery low" sensor: "🪫" / "🔋 ok" */
export function batteryText(b, t) {
  if (!b) return '';
  if (b.level == null) return b.low ? `🪫 ${t('dl.low')}` : `🔋 ${t('dl.ok')}`;
  return `${b.low ? '🪫' : '🔋'} ${b.level} %`;
}

/** ctx: $, t, layout(), states(), batteryOf(), offline() (Map id -> reason), onStates, pointInPoly, distToPoly, nameOf(entity), ready()
 *  (the states are loaded), show(target) ({ floor, kind, id }: point it out in the plan),
 *  narrow() (a phone: the list closes after a tap) */
export function initDeviceList(ctx) {
  const { $, t } = ctx;
  const pill = $('#devicesPill'), box = $('#devicePanel');
  let filter = 'all', sig = '';
  const env = () => ({ layout: ctx.layout(), states: ctx.states(), t, pointInPoly: ctx.pointInPoly, distToPoly: ctx.distToPoly, onStates: ctx.onStates,
    batteryOf: ctx.batteryOf(), offline: ctx.offline(), nameOf: ctx.nameOf });
  const isOpen = () => !box.hidden;
  function set(open) {
    box.hidden = !open; pill.classList.toggle('active', open); pill.setAttribute('aria-expanded', String(open));
    sig = '';
    if (open) render();
  }
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function render(rows = deviceRows(env())) {
    const shown = filterRows(rows, filter), sum = summary(rows);
    const key = JSON.stringify([filter, shown, t('dl.title')]);
    if (key === sig) return;
    sig = key;
    box.replaceChildren();
    const head = el('div', 'dl-head'), x = el('button', 'dl-x', '✕');
    x.type = 'button'; x.title = t('close'); x.addEventListener('click', () => set(false));
    head.append(el('b', '', t('dl.title')), x);
    const chips = el('div', 'dl-filters');
    FILTERS.forEach((k) => {
      const b = el('button', k === filter ? 'pill active' : 'pill', t(`dl.${k}`) + (k === 'battery' && sum.low ? ` (🪫 ${sum.low})` : k === 'offline' && sum.off ? ` (${sum.off})` : ''));
      b.type = 'button'; b.dataset.filter = k;
      b.addEventListener('click', () => { filter = k; sig = ''; render(); });
      chips.append(b);
    });
    const info = el('p', 'sub dl-sum', [t('dl.sum', { n: sum.n }), sum.low ? t('dl.sumLow', { n: sum.low }) : '', sum.off ? t('dl.sumOff', { n: sum.off }) : ''].filter(Boolean).join(' · '));
    box.append(head, chips, info);
    if (!shown.length) { box.append(el('p', 'sub', t('dl.none'))); return; }
    const many = shown.length > 1 || ctx.layout().floors.length > 1;
    shown.forEach((f) => {
      if (many) box.append(el('h4', 'dl-floor', f.name));
      f.rooms.forEach((r) => {
        box.append(el('h5', 'dl-room', r.name));
        const ul = el('ul', 'dl-list');
        r.items.forEach((it) => {
          const li = el('li'), b = el('button', 'dl-row' + (it.off ? ' off' : ''));
          b.type = 'button'; b.dataset.id = it.id; b.title = it.entity;
          b.append(el('span', 'dl-ic', it.icon || '•'), el('span', 'dl-n', it.name));
          const right = el('span', 'dl-v');
          if (it.off) right.append(el('span', `offWhy ${it.off}`, t(`off.${it.off}`)));
          else right.append(el('span', 'dl-state', it.value));
          if (it.battery) right.append(el('span', 'dl-bat' + (it.battery.low ? ' low' : ''), batteryText(it.battery, t)));
          b.append(right);
          b.addEventListener('click', () => { if (ctx.narrow?.()) set(false); ctx.show({ floor: it.floor, kind: it.kind, id: it.id }); });
          li.append(b); ul.append(li);
        });
        box.append(ul);
      });
    });
  }
  /** after every state update: the button (with the number of low batteries), and the list while it is open */
  function update() {
    pill.hidden = !ctx.ready();
    if (pill.hidden) { if (isOpen()) set(false); return; }
    const rows = deviceRows(env()), low = summary(rows).low;
    pill.textContent = low ? t('dl.pillLow', { n: low }) : t('dl.pill');
    if (isOpen()) render(rows);
  }
  pill.addEventListener('click', (e) => { e.stopPropagation(); set(!isOpen()); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen() && !document.querySelector('dialog[open]')) set(false); });
  return { update, open: () => set(true), close: () => set(false), isOpen, setFilter: (k) => { filter = FILTERS.includes(k) ? k : 'all'; sig = ''; if (isOpen()) render(); } };
}
