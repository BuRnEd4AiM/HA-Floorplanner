/* Room panel (live mode): all entities of a tapped room, grouped (lights, covers with the roller shutters of its windows, switches, cameras,
 * sensors, scenes), with switches, sliders and the light controls; doors, gates and windows with their state; the heating panel next to
 * it. Which doors and windows belong to a room and how the rows are grouped are pure functions (tested); initRoomPanel draws. */
import { wallLength } from './walls.js';
import { distToPoly, polyArea, pointInPoly } from './rooms.js';
import { fmtArea } from './i18n.js';
import { openingWalls } from './dormerwin.js';
import { ACTIONS } from './livecontrols.js';
import { initHeatPanel, splitHeatParts } from './heatpanel.js';
import { shutterEntity, floorShutters, shutterText } from './shutters.js';
import { contactRows } from './windowpanes.js';
import { coverControls, rpSlider } from './rpcover.js';

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
 *  windowText(o) (#624) }, closeLivePopup(), leaveFocus(),
 *  off() (optional: true = never opens, a dashboard card without the room panel, #13),
 *  alone() (optional: true = the page shows nothing but the room panel, a dashboard card for the controls of one room: it stays open and the
 *  heating goes inside it, #356) */
export function initRoomPanel(ctx) {
  const { $, t, live } = ctx;
  let forId = null;
  const openCtl = new Set();               // lights whose colour / effect / scene controls are unfolded in the room panel
  const heatBox = $('#heatPanel'), heatHome = heatBox.parentNode;
  const heat = initHeatPanel({ box: heatBox, t, states: () => ctx.states(), callService: (...a) => live.callService(...a), open: () => !!forId,
    stateText: (id) => ctx.stateText(id), isOn: (id) => ctx.onStates.has(ctx.states()[id]?.state), details: (id) => live.detailsButton(id, false, t('cam.openHa')) });
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
  /** everything the panel shows, as text: the room, its rows and the states of their entities (render(true) compares it) */
  function viewKey(room, f, states, op) {
    const devs = roomDevs(room, f, states), rc = live.roomIds?.(room) || { lights: [], scenes: [] };
    const ops = roomOpenings(room, f).filter((o) => op.entities(o).length);
    const ids = [...devs.map((d) => d.entity), ...rc.lights, ...rc.scenes, ...ops.flatMap((o) => openingIds(o, op))];
    return JSON.stringify([forId, room.name, room.points, devs.map((d) => [d.entity, d.name, d.opening?.id]), ops, ids.map((id) => states[id] ?? null),
      [...openCtl], ctx.imperial(), !!ctx.settings().cameraImages, t('rp.light'), matchMedia(SHEET_MEDIA).matches, !!ctx.alone?.()]);
  }
  /** the text on a row of the room panel */
  function rowValue(id, opening = null) {
    const s = ctx.states()[id], dom = id.split('.')[0];
    if (dom === 'climate' && s && typeof s.ct === 'number') return `🌡 ${Math.round(s.ct * 10) / 10} °C · ${s.state}`;
    if (dom === 'cover') return shutterText(s, t, opening);            // "60 % open" (and opening / closing for a cloth curtain)
    return ctx.stateText(id);
  }
  function hide() { forId = null; $('#roomPanel').hidden = true; heatBox.hidden = true; }
  function close() { if (!ctx.alone?.()) hide(); }                     // alone: the card that is only this panel keeps it open
  function open(id) { if (ctx.off?.()) return; forId = id; ctx.closeLivePopup(); render(); }   // off: a dashboard card without the room panel (#13)
  /* After a state update of the house (app.js, render(true)) the panel is drawn anew only when what it shows changed, and never while a
     finger or the mouse is pressed on it: drawn anew under the finger, a button lost its tap (2026-11-12, the quick positions of a
     shutter; the house's power sensors change every second) */
  let drawn = '', pressed = false;
  $('#roomPanel').addEventListener('pointerdown', () => { pressed = true; });
  ['pointerup', 'pointercancel'].forEach((ev) => window.addEventListener(ev, () => { pressed = false; }, true));
  /** the entities of a door's or window's rows: its contacts, the pane contacts and the tilt contact */
  const openingIds = (o, op) => [...op.entities(o), ...Array.from({ length: contactRows(o) }, (_, i) => op.pane(o, i)), op.tilt(o)].filter(Boolean);
  /** render(auto): auto = after a state update (skipped when nothing it shows changed or a pointer is pressed on it) */
  function render(auto = false) {
    const box = $('#roomPanel'), states = ctx.states(), f = ctx.floor(), op = ctx.openings;
    const room = f?.rooms.find((r) => r.id === forId);
    if (!room) { hide(); return; }
    if (auto && pressed && box.childElementCount) return;
    const key = viewKey(room, f, states, op);
    if (auto && box.childElementCount && key === drawn) return;
    drawn = key;
    box.hidden = false;
    box.replaceChildren();
    const head = document.createElement('div'); head.className = 'rp-head';
    const title = document.createElement('b'); title.textContent = room.name || '';
    const x = document.createElement('button'); x.className = 'rp-x'; x.textContent = '×'; x.addEventListener('click', () => { close(); ctx.leaveFocus(); });
    head.append(title);
    if (!ctx.alone?.()) head.append(x);                         // the card that is only this panel cannot be closed
    const area = document.createElement('div'); area.className = 'sub';
    area.textContent = areaText(room.points, ctx.imperial());
    box.append(head, area);
    if (matchMedia(SHEET_MEDIA).matches || ctx.alone?.()) box.append(heatBox);   // phones: the heating sits inside the room sheet, a second panel at the top left no room for the house
    else if (heatBox.parentNode !== heatHome) heatHome.append(heatBox);
    const rc = live.roomControls(room);
    if (rc) box.append(rc);
    const devs = roomDevs(room, f, states);
    const climates = devs.filter((d) => d.entity.startsWith('climate.'));
    const partOf = Object.assign({}, ...ctx.areas().map((a) => a.parts || {}));            // entity -> the thermostat of its device (#370)
    const { parts, rest } = splitHeatParts(devs, climates.map((d) => d.entity), partOf);   // a thermostat's child lock ... shows with the heating
    heat.render(climates, parts);
    RP_GROUPS.forEach(([group, key]) => {
      if (group === 'climate') return;                          // thermostats have their own panel next to this one
      const list = rest.filter((d) => rpGroupOf(d.entity.split('.')[0]) === group);
      if (!list.length) return;
      const h = document.createElement('h4'); h.textContent = t(key); box.append(h);
      if (group === 'light') {                                   // all lights of the room off in one tap
        const on = list.filter((d) => ctx.onStates.has(states[d.entity]?.state));
        if (on.length) {
          const off = document.createElement('button'); off.type = 'button'; off.className = 'rp-alloff'; off.textContent = t('rp.allOff');
          off.addEventListener('click', () => on.forEach((d) => live.callService(d.entity, 'turn_off')));
          h.append(off);
        }
      }
      list.forEach((d) => {
        const dom = d.entity.split('.')[0], st = states[d.entity];
        const row = document.createElement('div');
        row.className = 'row' + (st && ctx.onStates.has(st.state) ? ' on' : '');
        const n = document.createElement('span'); n.className = 'n'; n.textContent = d.name || d.entity;
        const v = document.createElement('span'); v.className = 'v'; v.textContent = rowValue(d.entity, d.opening);
        row.append(n, v);
        if (ACTIONS[dom] && dom !== 'cover') {
          if (ACTIONS[dom].includes('toggle') && dom !== 'scene' && dom !== 'script') {          // a slide switch like on a phone
            const sw = document.createElement('label'); sw.className = 'sw'; sw.title = t('live.toggle');
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!st && ctx.onStates.has(st.state);
            cb.addEventListener('change', () => live.callService(d.entity, cb.checked ? 'turn_on' : 'turn_off'));
            sw.append(cb, document.createElement('span'));
            row.append(sw);
          } else {
            const b = document.createElement('button');
            b.textContent = dom === 'scene' || dom === 'script' ? t('live.activate') : t('live.toggle');
            b.addEventListener('click', () => live.quickAction(d.entity));
            row.append(b);
          }
        }
        if (dom === 'camera' && ctx.settings().cameraImages) row.append(ctx.cams.camImage(d.entity));
        const slider = (val, onChange) => row.append(rpSlider(val, onChange));   // gives the focus back when let go (rpcover.js)
        const rmi = live.detailsButton(d.entity, true);
        if (rmi) row.append(rmi);
        if (dom === 'light') {                   // colours, effects and scenes right here: overlapping models are hard to tap in 3D
          const opened = openCtl.has(d.entity);
          const tb = document.createElement('button'); tb.className = 'rp-more' + (opened ? ' on' : ''); tb.textContent = '🎨'; tb.title = t('rp.lightMore');
          tb.addEventListener('click', () => { opened ? openCtl.delete(d.entity) : openCtl.add(d.entity); render(); });
          row.append(tb);
          if (opened) {
            const ctl = document.createElement('div'); ctl.className = 'rp-ctl';
            ctl.append(live.lightControls([d.entity]));
            const sc = live.sceneButtons(live.scenesWith([d.entity]), 'live.sceneWith'); if (sc) ctl.append(sc);
            row.append(ctl);
          }
        }
        if (dom === 'light' && st?.brightness != null && !openCtl.has(d.entity)) slider(st.brightness, (p) => live.callService(d.entity, 'turn_on', { brightness_pct: p }));
        if (dom === 'cover') {                   // ▲ ■ ▼, the slider and 0 · 25 · 50 · 75 · 100 % like the shutter's card (rpcover.js)
          row.classList.add('rpCoverRow');
          row.append(coverControls(d.entity, st, { t, callService: (...a) => live.callService(...a), opening: d.opening }));
        }
        box.append(row);
      });
    });
    const ops = roomOpenings(room, f).filter((o) => op.entities(o).length);
    op.KINDS.forEach((kind) => {                             // doors, gates (garage door ...) and windows, each under its own heading
      const list = ops.filter((o) => op.kind(o) === kind);
      if (!list.length) return;
      const h = document.createElement('h4'); h.textContent = t(`rp.${kind}`); box.append(h);
      list.forEach((o) => {
        const count = contactRows(o), multi = count > 1;                // one row per pane with contacts of their own (up to 8, #606)
        const tilt = multi ? op.tilt(o) : '';                           // and one for the tilt contact of such a window (#624)
        for (let i = 0; i < count + (tilt ? 1 : 0); i++) {
          const isTilt = i === count;
          const e = isTilt ? tilt : multi ? op.pane(o, i) : o.entity || op.entities(o)[0];
          if (!e) continue;
          const row = document.createElement('div');
          // one row for the whole window: "Offen", "Gekippt" (#624) or "Geschlossen" by all its contacts
          row.className = 'row' + ((multi ? op.isOpen(e) : op.entities(o).some(op.isOpen)) ? ' alert' : '');
          const n = document.createElement('span'); n.className = 'n';
          n.textContent = (o.name || t(`prop.${o.type}`)) + (isTilt ? ` · ${t('prop.tiltContact')}` : multi ? ` · ${t('pane.n', { n: i + 1 })}` : '');
          const v = document.createElement('span'); v.className = 'v'; v.textContent = multi ? op.contactText(o, e) : op.windowText(o);
          row.append(n, v);
          if (e.startsWith('cover.')) {                          // a garage door or shutter-like opening can be driven from here
            row.append(coverControls(e, ctx.states()[e], { t, callService: (...a) => live.callService(...a), plain: true }));
          }
          box.append(row);
        }
      });
    });
    if (!devs.length && !ops.length) { const e = document.createElement('div'); e.className = 'sub'; e.textContent = t('rp.empty'); box.append(e); }
  }
  return { open, close, render, current: () => forId };
}
