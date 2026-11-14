/* Room panel (live mode): all entities of a tapped room. Since 5.10.0 a card with tabs (docs/ideen-5.10, the owner's choice: idea 3 and 4):
 * on top the room's values as chips, then 💡 Licht (scenes, the lights as rows to swipe), 🪟 Rollo (with the roller shutters of its
 * windows), 🌡 Klima (the heating with what its plan does now, the sensors), 📺 Geräte (media, switches, cameras), 🚪 Fenster (doors,
 * gates, windows). On phones it first comes small (chips and big buttons) and shows everything when pulled up. Which doors and windows
 * belong to a room and how the rows are grouped are pure functions (tested; the card's decisions: roomcard.js); initRoomPanel draws
 * (its pieces: roomcardui.js). */
import { wallLength } from './walls.js';
import { distToPoly, polyArea, pointInPoly } from './rooms.js';
import { fmtArea } from './i18n.js';
import { openingWalls } from './dormerwin.js';
import { ACTIONS } from './livecontrols.js';
import { initHeatPanel, splitHeatParts } from './heatpanel.js';
import { shutterEntity, floorShutters, shutterText } from './shutters.js';
import { contactRows } from './windowpanes.js';
import { coverControls } from './rpcover.js';
import { readingFrom, sourceOf } from './roomsource.js';
import { roomTabs, pickTab, tabGroup, roomChips, roomPower, quickKeys, quickTab, roomIcon, TAB_ICON } from './roomcard.js';
import { initRoomCardUi } from './roomcardui.js';

export const RP_GROUPS = [['light', 'rp.light'], ['cover', 'rp.cover'], ['climate', 'rp.climate'], ['media_player', 'rp.media'], ['switch', 'rp.switch'], ['camera', 'rp.camera'], ['sensor', 'rp.sensor'], ['scene', 'rp.scene']];
/** the group of the room panel a domain is listed under */
export const rpGroupOf = (dom) => (dom === 'binary_sensor' ? 'sensor' : dom === 'fan' || dom === 'input_boolean' ? 'switch' : dom === 'script' ? 'scene' : dom);
export const inRoomPanel = (id) => RP_GROUPS.some(([g]) => g === rpGroupOf(id.split('.')[0]));

/** the doors / windows on the walls of a room (their middle within 35 cm of the room's outline) and those inside the outline: the dormer
 *  windows over it and a door in a wall inside the room (the door of a closet the room's outline takes in, #362) */
export function roomOpenings(room, f) {
  const out = [];
  openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
    const L = wallLength(w) || 1, k = o.pos / L, x = w.a[0] + (w.b[0] - w.a[0]) * k, z = w.a[1] + (w.b[1] - w.a[1]) * k;
    if (distToPoly(x, z, room.points) < 0.35 || pointInPoly(x, z, room.points)) out.push(o);
  }));
  return out;
}
/** doors / windows on the room's walls with their span in floor coordinates (for automatic placement) */
export function roomOpeningSpans(room, f) {
  const mine = new Set(roomOpenings(room, f));
  return openingWalls(f).flatMap((w) => {
    const L = wallLength(w) || 1, ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
    return (w.openings || []).filter((o) => mine.has(o)).map((o) => ({
      id: o.id, type: o.type, entity: o.entity || '',
      a: [w.a[0] + ux * (o.pos - o.width / 2), w.a[1] + uz * (o.pos - o.width / 2)], b: [w.a[0] + ux * (o.pos + o.width / 2), w.a[1] + uz * (o.pos + o.width / 2)],
    }));
  });
}
/** the covers of the windows of a room (#331) as rows of the room panel ({ entity, name, opening }), each entity once (seen: the entities
 *  listed already); name: the window's name, else Home Assistant's name of the cover, else `fallback` */
export function roomShutters(room, f, seen, nameOf, fallback) {
  return roomOpenings(room, f).map((o) => ({ entity: shutterEntity(o), name: o.name || nameOf(shutterEntity(o)) || fallback, opening: o }))
    .filter((d) => d.entity && !seen.has(d.entity) && seen.add(d.entity));
}
/** how many sensor rows a window shows in the room panel: one per pane when it has per-pane sensors (also the panes the custom count
 *  added), else the main contact only */
export const paneRowCount = contactRows;   // windowpanes.js, unit test there
/** the area of a room as text: m² with one decimal, or whole ft² */
export const areaText = (points, imperial) => fmtArea(polyArea(points), imperial);

/** phones: the room panel is a bottom sheet over the narrow screen and the heating goes inside it (style.css uses the same width) */
export const SHEET_MEDIA = '(max-width: 760px)';

/** ctx: $, t, live (initLiveControls), floor(), states(), entities(), areas(), entityDevices(f), pointInPoly, onStates, imperial(), stateText(id), cams,
 *  settings(), openings: { entities(o), kind(o), KINDS, pane(o, i), isOpen(e), text(e), tilt(o), contactText(o, e),
 *  windowText(o) (#624) }, closeLivePopup(), leaveFocus(), num(v, digits) (a number in the screen's language),
 *  co2Limit() (ppm from which a room should be aired), heat: { extras(roomId, climate) (what the heating rules do there: the line, 🚀, 🔎,
 *  or null), line(roomId) ({ icon, tone, text } or null), sig(roomId, climate), pause(entity) (⏸️ Heizplan aussetzen, or null), busy() },
 *  off() (optional: true = never opens, a dashboard card without the room panel, #13),
 *  alone() (optional: true = the page shows nothing but the room panel, a dashboard card for the controls of one room: it stays open, #356) */
export function initRoomPanel(ctx) {
  const { $, t, live } = ctx;
  let forId = null;
  let tab = null;                          // the tab chosen last (it stays when another room has it too)
  let full = false;                        // phones: the card pulled up (everything) instead of small
  let colorsOpen = false;                  // "🎨 Farbe & Weißton für alle" unfolded
  const openCtl = new Set();               // lights whose colour / effect / scene controls are unfolded
  const heatBox = $('#heatPanel'), heatHome = heatBox.parentNode;
  const box0 = $('#roomPanel');
  const shownTab = () => tabGroup(tab || '');
  const heat = initHeatPanel({ box: heatBox, t, states: () => ctx.states(), callService: (...a) => live.callService(...a), open: () => !!forId && shownTab() === 'climate',
    stateText: (id) => ctx.stateText(id), isOn: (id) => ctx.onStates.has(ctx.states()[id]?.state), details: (id) => live.detailsButton(id, false, t('cam.openHa')),
    extra: (e) => ctx.heat?.pause?.(e) || null });
  const ui = initRoomCardUi({ t, states: () => ctx.states(), callService: (...a) => live.callService(...a), live });
  const phone = () => matchMedia(SHEET_MEDIA).matches && !ctx.alone?.();
  const num = (v, d = 1) => (ctx.num ? ctx.num(v, d) : String(Math.round(v * 10 ** d) / 10 ** d));
  /** the devices of the room's rows: placed in it, the shutters of its windows, the rest of its Home Assistant area */
  function roomDevs(room, f, states) {
    const seen = new Set();                                    // one row per entity (an LED ring's sections may share one light)
    const devs = ctx.entityDevices(f).filter((d) => d.entity && ctx.pointInPoly(d.x, d.z, room.points) && !seen.has(d.entity) && seen.add(d.entity));
    const nameOf = (id) => ctx.entities().find((e) => e.entity_id === id)?.name;
    devs.push(...roomShutters(room, f, seen, nameOf, t('curtain.title')));                    // the roller shutters of its windows (#331)
    const placedIds = new Set([...ctx.entityDevices(f).map((d) => d.entity), ...floorShutters(f)]);
    const extra = (room.area ? ctx.areas().find((a) => a.id === room.area)?.entities || [] : [])
      .filter((id) => !placedIds.has(id) && states[id] && inRoomPanel(id))
      .map((id) => ({ entity: id, name: nameOf(id) || id }));
    devs.push(...extra);
    return devs;
  }
  /** everything the card needs, worked out once per drawing */
  function model(room, f, states) {
    const op = ctx.openings, devs = roomDevs(room, f, states);
    const climates = devs.filter((d) => d.entity.startsWith('climate.'));
    const partOf = Object.assign({}, ...ctx.areas().map((a) => a.parts || {}));            // entity -> the thermostat of its device (#370)
    const { parts, rest } = splitHeatParts(devs, climates.map((d) => d.entity), partOf);   // a thermostat's child lock ... shows with the heating
    const by = {};
    rest.forEach((d) => { const g = rpGroupOf(d.entity.split('.')[0]); if (RP_GROUPS.some(([k]) => k === g)) (by[g] ||= []).push(d); });
    const rc = live.roomIds?.(room) || { lights: [], scenes: [] };
    const lights = by.light || [];
    rc.lights.filter((id) => !lights.some((d) => d.entity === id)).forEach((id) => lights.push({ entity: id, name: live.nameOf(id) }));
    const scenes = [...new Set([...rc.scenes, ...(by.scene || []).map((d) => d.entity)])].filter((id) => states[id]);
    const ops = roomOpenings(room, f).filter((o) => op.entities(o).length);
    const isOn = (e) => ctx.onStates.has(states[e]?.state);
    const area = room.area ? ctx.areas().find((a) => a.id === room.area)?.entities || [] : [];
    const ids = new Set([...ctx.entityDevices(f).filter((d) => d.entity && ctx.pointInPoly(d.x, d.z, room.points)).map((d) => d.entity), ...area]);
    const read = (mode) => readingFrom(ids, states, mode, partOf, sourceOf(room, mode));
    const openN = ops.filter((o) => op.entities(o).some(op.isOpen)).length;
    const devices = [...(by.media_player || []), ...(by.switch || []), ...(by.camera || [])];
    const temp = read('temp');
    const line = climates.length ? ctx.heat?.line?.(room.id) || null : null;
    const covers = (by.cover || []).map((d) => states[d.entity]?.position ?? null);
    const counts = { lights: lights.length, lightsOn: lights.filter((d) => isOn(d.entity)).length, scenes: scenes.length, covers, thermostats: climates.length, temp,
      sensors: (by.sensor || []).length, devices: devices.length, devicesOn: devices.filter((d) => isOn(d.entity) || states[d.entity]?.state === 'playing').length,
      openings: ops.length, open: openN, heatIcon: line && line.icon !== '📋' ? line.icon : '' };
    const tabs = roomTabs(counts, t, (v) => `${num(ctx.imperial() ? v * 9 / 5 + 32 : v)}°`);
    const chips = roomChips({ temp, humid: read('humid'), co2: read('co2'), power: roomPower(ids, states), open: openN, co2Bad: ctx.co2Limit?.() ?? 1200 }, num, ctx.imperial());
    return { devs, climates, parts, by, lights, scenes, ops, counts, tabs, chips, line };
  }
  /** everything the panel shows, as text: the room, its rows and the states of their entities (render(true) compares it) */
  function viewKey(room, f, states, op, m) {
    const ids = [...m.devs.map((d) => d.entity), ...m.lights.map((d) => d.entity), ...m.scenes, ...m.ops.flatMap((o) => openingIds(o, op))];
    return JSON.stringify([forId, room.name, room.points, m.devs.map((d) => [d.entity, d.name, d.opening?.id]), m.ops, ids.map((id) => states[id] ?? null),
      [...openCtl], ctx.imperial(), !!ctx.settings().cameraImages, t('rp.light'), matchMedia(SHEET_MEDIA).matches, !!ctx.alone?.(), tab, full, colorsOpen,
      m.chips, m.line, m.climates.length ? ctx.heat?.sig?.(room.id, m.climates[0].entity) ?? null : null]);
  }
  /** the text on a row of the room panel */
  function rowValue(id, opening = null) {
    const s = ctx.states()[id], dom = id.split('.')[0];
    if (dom === 'climate' && s && typeof s.ct === 'number') return `🌡 ${Math.round(s.ct * 10) / 10} °C · ${s.state}`;
    if (dom === 'cover') return shutterText(s, t, opening);            // "60 % open" (and opening / closing for a cloth curtain)
    return ctx.stateText(id);
  }
  function parkHeat() { if (heatBox.parentNode !== heatHome) heatHome.append(heatBox); heatBox.hidden = true; }
  function hide() { forId = null; box0.hidden = true; box0.classList.remove('rpPeek', 'rpFull'); parkHeat(); }
  function close() { if (!ctx.alone?.()) hide(); }                     // alone: the card that is only this panel keeps it open
  function open(id) {                                                  // off: a dashboard card without the room panel (#13)
    if (ctx.off?.()) return;
    if (id !== forId) { full = false; openCtl.clear(); colorsOpen = false; }
    forId = id; ctx.closeLivePopup(); render();
  }
  /** show a tab (and on phones the whole card) */
  function show(k) { tab = k; if (phone()) full = true; render(); box0.scrollTop = 0; }
  /* After a state update of the house (app.js, render(true)) the panel is drawn anew only when what it shows changed, and never while a
     finger or the mouse is pressed on it: drawn anew under the finger, a button lost its tap (2026-11-12, the quick positions of a
     shutter; the house's power sensors change every second) */
  let drawn = '', pressed = false;
  box0.addEventListener('pointerdown', () => { pressed = true; });
  ['pointerup', 'pointercancel'].forEach((ev) => window.addEventListener(ev, () => { pressed = false; }, true));
  /** the entities of a door's or window's rows: its contacts, the pane contacts and the tilt contact */
  const openingIds = (o, op) => [...op.entities(o), ...Array.from({ length: contactRows(o) }, (_, i) => op.pane(o, i)), op.tilt(o)].filter(Boolean);
  const make = ui.make;
  /** a row of the room panel (all but lights): name, value, switch or button, camera picture, ⓘ, the controls of a cover */
  function deviceRow(d) {
    const states = ctx.states(), dom = d.entity.split('.')[0], st = states[d.entity];
    const row = make('div', 'row' + (st && ctx.onStates.has(st.state) ? ' on' : ''));
    row.dataset.e = d.entity;
    row.append(make('span', 'n', d.name || d.entity), make('span', 'v', rowValue(d.entity, d.opening)));
    if (ACTIONS[dom] && dom !== 'cover') {
      if (ACTIONS[dom].includes('toggle') && dom !== 'scene' && dom !== 'script') {          // a slide switch like on a phone
        const sw = make('label', 'sw'); sw.title = t('live.toggle');
        const cb = make('input'); cb.type = 'checkbox'; cb.checked = !!st && ctx.onStates.has(st.state);
        cb.addEventListener('change', () => live.callService(d.entity, cb.checked ? 'turn_on' : 'turn_off'));
        sw.append(cb, make('span'));
        row.append(sw);
      } else row.append(ui.button('', t('live.toggle'), () => live.quickAction(d.entity)));
    }
    if (dom === 'camera' && ctx.settings().cameraImages) row.append(ctx.cams.camImage(d.entity));
    const rmi = live.detailsButton(d.entity, true);
    if (rmi) row.append(rmi);
    if (dom === 'cover') {                   // ▲ ■ ▼, the slider and 0 · 25 · 50 · 75 · 100 % like the shutter's card (rpcover.js)
      row.classList.add('rpCoverRow');
      row.append(coverControls(d.entity, st, { t, callService: (...a) => live.callService(...a), opening: d.opening }));
    }
    return row;
  }
  const h4 = (key, ...extra) => { const h = make('h4', '', t(key)); h.append(...extra); return h; };
  /** 💡 Licht: the scenes, "Alle an" / "Alle aus", the lights as rows, colours for all of them */
  function lightTab(room, m, body) {
    const states = ctx.states(), lights = m.lights;
    const sc = ui.scenes(m.scenes, room.name || ''); if (sc) body.append(sc);
    if (!lights.length) return;
    const on = lights.filter((d) => ctx.onStates.has(states[d.entity]?.state)), off = lights.filter((d) => !on.includes(d));
    const pills = make('span', 'rpPills');
    if (off.length) pills.append(ui.button('rp-allon', t('live.allOn'), () => off.forEach((d) => live.callService(d.entity, 'turn_on'))));
    if (on.length) pills.append(ui.button('rp-alloff', t('rp.allOff'), () => on.forEach((d) => live.callService(d.entity, 'turn_off'))));
    body.append(h4('rp.light', pills));
    lights.forEach((d) => body.append(...ui.lightRow(d, openCtl.has(d.entity), () => {
      if (openCtl.has(d.entity)) openCtl.delete(d.entity); else openCtl.add(d.entity);
      render();
    })));
    if (lights.length > 1) {                // colours, white tone and effects for all lamps at once (before 5.10.0 always open on top)
      const det = make('details', 'rpColors'); det.open = colorsOpen;
      det.append(make('summary', '', `🎨 ${t('rp.colorsAll')}`));
      det.addEventListener('toggle', () => { colorsOpen = det.open; });
      det.append(live.lightControls(lights.map((d) => d.entity)));
      body.append(det);
    }
  }
  /** 🌡 Klima: what the heating rules do now (📅 Heizplan …, ⏸️ ausgesetzt), the thermostats, the sensors as tiles */
  function climateTab(room, m, body) {
    const ex = m.climates.length ? ctx.heat?.extras?.(room.id, m.climates[0].entity) : null;
    if (ex) { ex.classList.add('rpRules'); body.append(ex); }
    if (m.climates.length) { body.append(heatBox); heat.render(m.climates, m.parts); }
    const sensors = m.by.sensor || [];
    if (sensors.length) {
      if (m.climates.length) body.append(h4('rp.sensor'));
      const co2Bad = ctx.co2Limit?.() ?? 1200;
      body.append(ui.values(sensors.map((d) => {
        const s = ctx.states()[d.entity], v = parseFloat(s?.state);
        const tone = s?.unit === 'ppm' && Number.isFinite(v) ? (v >= co2Bad ? 'bad' : v >= 800 ? 'warn' : '') : d.entity.startsWith('binary_sensor.') && s?.state === 'on' ? 'warn' : '';
        return { entity: d.entity, name: d.name || d.entity, value: ctx.stateText(d.entity), tone };
      })));
    }
  }
  /** 🚪 Fenster: doors, gates (garage door ...) and windows, each under its own heading */
  function openTab(m, body) {
    const op = ctx.openings;
    op.KINDS.forEach((kind) => {
      const list = m.ops.filter((o) => op.kind(o) === kind);
      if (!list.length) return;
      body.append(h4(`rp.${kind}`));
      list.forEach((o) => {
        const count = contactRows(o), multi = count > 1;                // one row per pane with contacts of their own (up to 8, #606)
        const tilt = multi ? op.tilt(o) : '';                           // and one for the tilt contact of such a window (#624)
        for (let i = 0; i < count + (tilt ? 1 : 0); i++) {
          const isTilt = i === count;
          const e = isTilt ? tilt : multi ? op.pane(o, i) : o.entity || op.entities(o)[0];
          if (!e) continue;
          // one row for the whole window: "Offen", "Gekippt" (#624) or "Geschlossen" by all its contacts
          const row = make('div', 'row' + ((multi ? op.isOpen(e) : op.entities(o).some(op.isOpen)) ? ' alert' : ''));
          row.append(make('span', 'n', (o.name || t(`prop.${o.type}`)) + (isTilt ? ` · ${t('prop.tiltContact')}` : multi ? ` · ${t('pane.n', { n: i + 1 })}` : '')),
            make('span', 'v', multi ? op.contactText(o, e) : op.windowText(o)));
          if (e.startsWith('cover.')) {                          // a garage door or shutter-like opening can be driven from here
            row.append(coverControls(e, ctx.states()[e], { t, callService: (...a) => live.callService(...a), plain: true }));
          }
          body.append(row);
        }
      });
    });
  }
  /** the big buttons of the small card on phones */
  function quickList(m) {
    const c = m.counts, tb = Object.fromEntries(m.tabs.map((x) => [x.key, x]));
    return quickKeys(m.tabs, c.scenes).map((k) => {
      if (k === 'light') return { key: k, icon: '💡', label: t('rp.tab.light'), sub: c.lights ? (c.lightsOn ? t('rp.nOn', { n: c.lightsOn }) : t('lc.off')) : `${c.scenes}`, on: c.lightsOn > 0 };
      if (k === 'scenes') return { key: k, icon: '🎬', label: t('rc.scenes'), sub: `${c.scenes}` };
      return { key: k, icon: TAB_ICON[k], label: t(`rp.tab.${k}`), sub: tb[k]?.badge || '', on: k === 'open' && c.open > 0 };
    });
  }
  /** render(auto): auto = after a state update (skipped when nothing it shows changed or a pointer is pressed on it) */
  function render(auto = false) {
    const box = box0, states = ctx.states(), f = ctx.floor(), op = ctx.openings;
    const room = f?.rooms.find((r) => r.id === forId);
    if (!room) { hide(); return; }
    if (auto && (pressed || ui.busy() || ctx.heat?.busy?.()) && box.childElementCount) return;
    const m = model(room, f, states);
    tab = pickTab(m.tabs, tab);
    const key = viewKey(room, f, states, op, m);
    if (auto && box.childElementCount && key === drawn) return;
    drawn = key;
    const small = phone() && !full;
    box.hidden = false;
    box.classList.toggle('rpPeek', small); box.classList.toggle('rpFull', phone() && full);
    parkHeat();
    box.replaceChildren();
    if (phone()) box.append(ui.grip(box, full, (mv) => {
      if (mv === 'close') { close(); ctx.leaveFocus(); return; }
      full = mv === 'full' ? true : mv === 'peek' ? false : !full;
      render(); box.scrollTop = 0;
    }));
    const c = m.counts, sub = [areaText(room.points, ctx.imperial())];
    if (c.lights) sub.push(c.lightsOn ? `💡 ${t('rp.lightsOn', { on: c.lightsOn, n: c.lights })}` : `💡 ${t('rp.lightsNone')}`);
    box.append(ui.head(roomIcon(room.name), room.name || '', sub.join(' · '), ctx.alone?.() ? null : () => { close(); ctx.leaveFocus(); }));
    if (m.chips.length) box.append(ui.chips(m.chips, (k) => show(m.tabs.some((x) => x.key === k) ? k : k === 'climate' ? 'values' : k)));
    if (!m.tabs.length) { box.append(make('div', 'sub rpEmpty', t('rp.empty'))); return; }
    if (small) {                                                   // phones: first small, the house stays in sight (idea 4)
      box.append(ui.quick(quickList(m), (k) => show(quickTab(k))));
      if (m.line) box.append(make('div', `hrLine rpLine ${m.line.tone || ''}`.trim(), `${m.line.icon} ${m.line.text}`));   // the heating plan does not get lost (the owner)
      box.append(ui.button('rpMore', `⌃ ${t('rp.more')}`, () => { full = true; render(); }));
      return;
    }
    if (m.tabs.length > 1) box.append(ui.tabs(m.tabs, tab, (k) => show(k)));
    const body = make('div', 'rpBody'); body.dataset.tab = tab;
    const g = tabGroup(tab);
    if (g === 'light') lightTab(room, m, body);
    else if (g === 'cover') (m.by.cover || []).forEach((d) => body.append(deviceRow(d)));
    else if (g === 'climate') climateTab(room, m, body);
    else if (g === 'devices') [['media_player', 'rp.media'], ['switch', 'rp.switch'], ['camera', 'rp.camera']].forEach(([k, label]) => {
      const list = m.by[k] || [];
      if (!list.length) return;
      body.append(h4(label));
      list.forEach((d) => body.append(deviceRow(d)));
    });
    else if (g === 'open') openTab(m, body);
    box.append(body);
  }
  return { open, close, render, current: () => forId, tab: () => tab, full: () => full, show };
}
