/* The page 🌡 Klima of the tab bar (#483): a card per room (temperature, its thermostat like Home Assistant's: a circle, − / +, the modes
 * and presets, big or small as an admin chose (#495, thermostatui.js), heats / cools, humidity, air with "Lüften", an open window while it
 * heats, what the add-on's heating rules do there with 🚀 Boost and 🔎 Wird benutzt, #546), the thermostats and water heaters in no room,
 * a tip. Beside "Räume" the views 📋 Heiz-Regeln (heatrulesui.js) and 📅 Heizplan (heatplanui.js, #546). A tap on a room's name shows it in
 * the house. The rules are in climate.js (tested); this file draws. Several taps on − / + become one call (HEAT_DELAY, as in the heating
 * panel). Only a card whose content changed is drawn again; nothing is drawn while a knob is being dragged. */
import { climateRooms, looseClimates, climateTips, filterRooms, attention, wasting, hasClimate, FILTERS } from './climate.js';
import { heatMode } from './heating.js';
import { clampTarget, HEAT_DELAY } from './heatpanel.js';
import { weatherEntity } from './today.js';
import { roomEntityIds } from './roomtiles.js';
import { roomOpenings } from './roompanel.js';
import { openingEntities } from './openings.js';

/** ctx: t, el (the page), lang(), settings(), states(), layout() (the building shown), placed(floor) (its devices with entities),
 *  areaEntities(room), partOf() (the sensors of thermostats, roomReading), isOpen(entity), nameOf(entity), callService(entity, service, data), openRoom(floorIndex, roomId), board (pageboard.js,
 *  #484: the cards in the order an admin chose; keys room:<id>, loose, tip), thermo (thermostatui.js, #495), heat (heatrulesui.js), plan
 *  (heatplanui.js) (#546), diag (heatdiagui.js, 🩺 Protokoll, #579) */
export function initClimatePage(ctx) {
  const { t, el } = ctx;
  const pending = new Map();                         // entity -> { v, timer }: a target tapped but not sent yet
  let filter = 'all', drawn = '', grid = null, view = 'rooms', viewDrawn = '';   // view: rooms | rules | plan (#546) | diag (#579)
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const lang = () => ctx.lang() || 'de';
  const imperial = () => ctx.settings().units === 'imperial';
  const num = (v, d = 1) => { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch { return v.toFixed(d); } };
  const deg = (c, d = 1) => (c === null || c === undefined ? '–' : `${num(imperial() ? c * 9 / 5 + 32 : c, d)}°`);   // °F only shown, the thermostat gets °C
  const goal = (e) => pending.get(e)?.v ?? ctx.states()[e]?.tt;
  /** the rooms of every floor: [{ id, name, floor, floorName, ids (its entities), open (the names of its open windows and doors) }] */
  const rooms = () => ctx.layout().floors.flatMap((f, fi) => (f.rooms || []).filter((r) => r.name).map((r) => ({
    id: r.id, name: r.name, floor: fi, floorName: f.name || '', ids: [...roomEntityIds(r, ctx.placed(f), ctx.areaEntities(r))],
    open: roomOpenings(r, f).filter((o) => openingEntities(o).some((e) => ctx.isOpen(e))).map((o) => o.name || t(`prop.${o.type}`)),
  })));
  const placedIds = () => ctx.layout().floors.flatMap((f) => (f.devices || []).map((d) => d.entity).filter(Boolean));

  function send(e, v) {
    v = clampTarget(ctx.states()[e], v);
    const old = pending.get(e); if (old) clearTimeout(old.timer);
    pending.set(e, { v, timer: setTimeout(() => { pending.delete(e); ctx.callService(e, 'set_temperature', { temperature: v }); }, HEAT_DELAY) });
    draw(false);
  }
  function badge(mode) {
    if (!mode) return null;
    const text = mode === 'heating' ? `🔥 ${t('heat.heating')}` : mode === 'cooling' ? `❄ ${t('heat.cooling')}` : mode === 'off' ? t('heat.off') : t('heat.idle');
    return make('span', `clBadge ${mode}`, text);
  }
  /** − and + of a thermostat (only while it is not off and has a target; the target itself stands beside the temperature) */
  function stepper(e) {
    const s = ctx.states()[e], v = goal(e);
    if (!s || s.state === 'off' || typeof v !== 'number') return null;
    const step = s.tstep || 0.5, box = make('div', 'clStep');
    box.append(btn('clMinus', '−', () => send(e, v - step), t('heat.minus')), btn('clPlus', '+', () => send(e, v + step), t('heat.plus')));
    return box;
  }
  const target = (e) => { const s = ctx.states()[e]; return t('cl.target', { v: deg(goal(e), (s?.tstep || 0.5) < 1 ? 1 : 0) }); };
  function roomCard(r, floors, size) {
    const look = attention(r), warn = wasting(r);
    const c = make('div', `tpCard clCard${warn || r.air === 'bad' ? ' alert' : ''}`); c.dataset.room = r.id;
    const head = make('div', 'clHead'), where = make('div', 'clWhere');
    where.append(btn('clName', r.name, () => ctx.openRoom(r.floor, r.id), t('cl.showRoom')));
    if (floors > 1 && r.floorName) where.append(make('small', 'clFloor', r.floorName));
    head.append(where);
    const b = badge(r.mode); if (b) head.append(b);
    const th = r.climate ? ctx.thermo.render(r.climate, size).el : null;     // the thermostat as a circle (#495)
    const row = make('div', 'clRow');
    if (th) {
      c.append(head, th);
      if (r.temp !== null && Math.abs(r.temp - (ctx.states()[r.climate]?.ct ?? r.temp)) >= 0.3) row.append(make('span', `tpSub clRoomTemp${look ? ` ${look}` : ''}`, t('cl.roomTemp', { v: deg(r.temp) })));
    } else {
      const now = make('div', 'clNow');
      now.append(make('b', `clTemp${look ? ` ${look}` : ''}`, deg(r.temp)));
      c.append(head, now);
    }
    const tags = make('div', 'clTags');
    if (th && look) tags.append(make('span', `tpChip ${look}`, `🌡 ${t(look === 'warm' ? 'cl.tooWarm' : 'cl.tooCold')}`));   // the circle has no coloured number: say it
    if (r.co2 !== null) tags.append(make('span', `tpChip ${r.air === 'bad' ? 'alert' : 'green'}`, r.air === 'bad' ? `🪟 ${t('cl.airOut', { n: Math.round(r.co2) })}` : t('cl.airOk', { n: Math.round(r.co2) })));
    if (r.humid !== null) tags.append(make('span', 'clHumid', `💧 ${Math.round(r.humid)} %`));
    row.append(tags);
    if (row.querySelector('*')) c.append(row);
    const rules = ctx.heat.roomExtras(r);            // what the add-on's heating rules do here, 🚀, 🔎 (#546)
    if (rules) c.append(rules);
    if (warn && !(ctx.heat.paused(r))) {
      const w = make('div', 'clWarn');
      w.append(make('span', '', `🪟 ${t('cl.openWarn', { names: r.open.slice(0, 3).join(', ') })}`));
      const s = ctx.states()[r.climate];
      if (Array.isArray(s?.modes) && s.modes.includes('off')) w.append(btn('tpChip', t('cl.heatOff'), () => ctx.callService(r.climate, 'set_hvac_mode', { hvac_mode: 'off' })));
      c.append(w);
    }
    return c;
  }
  /** a thermostat or water heater in no room: its name, what it does, the temperature now and its target */
  function looseRow(x) {
    const s = ctx.states()[x.entity], r = make('div', 'clLoose');
    const what = make('div', 'clLooseName');
    what.append(make('b', '', ctx.nameOf(x.entity) || x.entity));
    const mode = x.kind === 'climate' ? badge(heatMode(x.entity, s)) : make('span', 'tpSub', s?.state && s.state !== 'unknown' ? (t(`cl.wh.${s.state}`) === `cl.wh.${s.state}` ? s.state : t(`cl.wh.${s.state}`)) : '');
    if (mode) what.append(mode);
    r.append(what);
    const vals = make('div', 'clLooseVals');
    if (typeof s?.ct === 'number') vals.append(make('b', 'clLooseNow', deg(s.ct)));
    if (typeof s?.tt === 'number' && s.state !== 'off') vals.append(make('span', 'tpSub clSoll', x.kind === 'climate' ? target(x.entity) : t('cl.target', { v: deg(s.tt, 0) })));
    if (x.kind === 'climate') { const st = stepper(x.entity); if (st) vals.append(st); }
    r.append(vals);
    return r;
  }

  function model() {
    const st = ctx.states(), list = climateRooms(rooms(), st, ctx.settings().co2Stops, ctx.partOf?.());
    const loose = looseClimates(st, list.flatMap((r) => r.ids.filter((e) => e.startsWith('climate.') || e.startsWith('water_heater.'))));
    const wx = weatherEntity(ctx.settings(), st);
    return { rooms: list, loose, tips: climateTips(list), outside: st[wx]?.wx?.t ?? null };
  }
  /** the head of the page: the title, the outside temperature, the filters (rooms) and the views (#546) */
  function head(m) {
    const h = make('div', 'tpHead');
    h.append(make('h2', '', `🌡️ ${t('tab.climate')}`));
    if (m.outside !== null) h.append(make('span', 'tpSub', t('cl.outside', { v: deg(m.outside) })));
    const tools = make('div', 'tpTools');
    if (view === 'rooms') FILTERS.forEach((f) => { const b = btn(`tpChip${f === filter ? ' on' : ''}`, t(`cl.filter.${f}`), () => { filter = f; draw(true); }); b.dataset.filter = f; tools.append(b); });
    else tools.append(btn('tpChip', t('cl.view.rooms'), () => show('rooms')));
    [['rules', `📋 ${t('cl.view.rules')}`], ['plan', `📅 ${t('cl.view.plan')}`], ...(ctx.diag ? [['diag', `🩺 ${t('cl.view.diag')}`]] : [])].forEach(([v, text]) => {
      const b = btn(`tpChip${view === v ? ' on' : ''}`, text, () => show(v)); b.dataset.view = v; tools.append(b);
    });
    h.append(tools);
    return h;
  }
  function show(v) { view = v; drawn = ''; viewDrawn = ''; grid = null; draw(true); el.scrollTop = 0; }
  function drawView(force) {
    const ui = view === 'plan' ? ctx.plan : view === 'diag' ? ctx.diag : ctx.heat;
    if (!force && (ui.busy?.() || el.contains(document.activeElement) && document.activeElement.matches('input'))) return;   // a drag or a field being typed in
    const m = model(), sig = JSON.stringify([view, ui.viewSig(), m.outside, imperial(), t('tab.climate')]);
    if (!force && sig === viewDrawn) return;
    viewDrawn = sig; drawn = ''; grid = null;
    el.replaceChildren(head(m), ui.view());
  }
  function draw(force = false) {
    if (ctx.thermo.busy()) return;                  // a knob is being dragged: nothing moves under the finger (#495)
    if (view !== 'rooms') { drawView(force); return; }
    viewDrawn = '';
    const m = model(), st = ctx.states();
    const shown = filterRooms(m.rooms, filter), floors = new Set(m.rooms.map((r) => r.floor)).size;
    const headSig = JSON.stringify([m.outside, filter, imperial(), shown.length, m.rooms.length, t('tab.climate')]);
    if (force || headSig !== drawn || !grid || !el.contains(grid)) {
      drawn = headSig;
      const out = [head(m)];
      if (!shown.length) out.push(make('p', 'tpSub', m.rooms.length ? t('cl.allFine') : t('cl.noRooms')));
      if (force || !grid) grid = make('div', 'clGrid');
      el.replaceChildren(...out, grid);
    }
    const common = [imperial(), t('tab.climate'), floors];
    const items = shown.map((r) => {
      const key = `room:${r.id}`, size = ctx.board.size('climate', key);
      return { key, width: 1, sized: r.climate ? 'big' : null, make: () => roomCard(r, floors, size),
        sig: JSON.stringify([r.id, r.name, r.floorName, r.temp, r.humid, r.co2, r.air, r.mode, r.open, r.climate ? ctx.thermo.sig(r.climate) : null, size, ctx.heat.sig(r), ...common]) };
    });
    if (m.loose.length) {
      items.push({ key: 'loose', width: 2, make: () => {
        const c = make('div', 'tpCard clLooseCard'); c.append(make('h3', 'peH', t('cl.loose')));
        m.loose.forEach((x) => c.append(looseRow(x)));
        return c;
      }, sig: JSON.stringify([m.loose.map((x) => [x.entity, st[x.entity]?.state, st[x.entity]?.ct, st[x.entity]?.tt, st[x.entity]?.hvac, pending.get(x.entity)?.v]), ...common]) });
    }
    if (m.tips.length) {
      const tip = m.tips[0];
      items.push({ key: 'tip', width: 2, make: () => {
        const c = make('div', 'tpCard clTip'); c.append(make('h3', 'peH', t('cl.tip')));
        c.append(make('p', '', tip.key === 'window' ? t('cl.tip.window', { room: tip.room }) : t('cl.tip.air', { room: tip.room, n: Math.round(tip.co2) })));
        return c;
      }, sig: JSON.stringify([tip, ...common]) });
    }
    ctx.board.fill('climate', grid, items, { min: 260 });
  }
  return {
    render: () => draw(true),
    update: () => draw(false),
    has: () => hasClimate(ctx.states(), placedIds()),
    reset: () => { filter = 'all'; drawn = ''; grid = null; if (!ctx.plan.dirty()) view = 'rooms'; },
    show,                                           // a view of the page: rooms | rules | plan (#546)
    /** every room of the house shown with its entities ({ id, name, floorName, ids }): the sensors in a thermostat's room (#573) */
    sensorRooms: () => rooms().map((r) => ({ id: r.id, name: r.name, floorName: r.floorName, ids: r.ids })),
    /** the rooms of the house shown with their thermostat, for the heating rules and the schedule (#546) */
    heatRooms: () => climateRooms(rooms(), ctx.states(), ctx.settings().co2Stops, ctx.partOf?.()).filter((r) => r.climate).map((r) => ({ id: r.id, name: r.name, climate: r.climate })),
  };
}
