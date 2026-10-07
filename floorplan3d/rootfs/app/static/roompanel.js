/* Room panel (live mode): all entities of a tapped room, grouped (lights, covers, switches, cameras, sensors, scenes), with switches, sliders and
 * the light controls; doors, gates and windows with their state; the heating panel next to it. Which doors and windows belong to a room and how
 * the rows are grouped are pure functions (tested); initRoomPanel draws. */
import { wallLength } from './walls.js';
import { distToPoly, polyArea, pointInPoly } from './rooms.js';
import { openingWalls, isDormerWall } from './dormerwin.js';
import { ACTIONS, ACTION_LABEL } from './livecontrols.js';
import { initHeatPanel } from './heatpanel.js';

export const RP_GROUPS = [['light', 'rp.light'], ['cover', 'rp.cover'], ['climate', 'rp.climate'], ['media_player', 'rp.media'], ['switch', 'rp.switch'], ['camera', 'rp.camera'], ['sensor', 'rp.sensor'], ['scene', 'rp.scene']];
/** the group of the room panel a domain is listed under */
export const rpGroupOf = (dom) => (dom === 'binary_sensor' ? 'sensor' : dom === 'fan' || dom === 'input_boolean' ? 'switch' : dom === 'script' ? 'scene' : dom);
export const inRoomPanel = (id) => RP_GROUPS.some(([g]) => g === rpGroupOf(id.split('.')[0]));

/** the doors / windows on the walls of a room (their middle within 35 cm of the room's outline), and the dormer windows over it */
export function roomOpenings(room, f) {
  const out = [];
  openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
    const L = wallLength(w) || 1, k = o.pos / L, x = w.a[0] + (w.b[0] - w.a[0]) * k, z = w.a[1] + (w.b[1] - w.a[1]) * k;
    if (distToPoly(x, z, room.points) < 0.35 || (isDormerWall(w) && pointInPoly(x, z, room.points))) out.push(o);
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
/** the area of a room as text: m² with one decimal, or whole ft² */
export const areaText = (points, imperial) => (imperial ? `${(polyArea(points) * 10.7639).toFixed(0)} ft²` : `${polyArea(points).toFixed(1)} m²`);

/** phones: the room panel is a bottom sheet over the narrow screen and the heating goes inside it (style.css uses the same width) */
export const SHEET_MEDIA = '(max-width: 760px)';

/** ctx: $, t, live (initLiveControls), floor(), states(), entities(), areas(), entityDevices(f), pointInPoly, onStates, imperial(), stateText(id), cams,
 *  settings(), openings: { entities(o), kind(o), KINDS, pane(o, i), isOpen(e), text(e) }, closeLivePopup(), leaveFocus() */
export function initRoomPanel(ctx) {
  const { $, t, live } = ctx;
  let forId = null;
  const openCtl = new Set();               // lights whose colour / effect / scene controls are unfolded in the room panel
  const heatBox = $('#heatPanel'), heatHome = heatBox.parentNode;
  const heat = initHeatPanel({ box: heatBox, t, states: () => ctx.states(), callService: (...a) => live.callService(...a), open: () => !!forId });
  /** the text on a row of the room panel */
  function rowValue(id) {
    const s = ctx.states()[id], dom = id.split('.')[0];
    if (dom === 'climate' && s && typeof s.ct === 'number') return `🌡 ${Math.round(s.ct * 10) / 10} °C · ${s.state}`;
    return ctx.stateText(id);
  }
  function close() { forId = null; $('#roomPanel').hidden = true; heatBox.hidden = true; }
  function open(id) { forId = id; ctx.closeLivePopup(); render(); }
  function render() {
    const box = $('#roomPanel'), states = ctx.states(), f = ctx.floor(), op = ctx.openings;
    const room = f?.rooms.find((r) => r.id === forId);
    if (!room) { close(); return; }
    box.hidden = false;
    box.replaceChildren();
    const head = document.createElement('div'); head.className = 'rp-head';
    const title = document.createElement('b'); title.textContent = room.name || '';
    const x = document.createElement('button'); x.className = 'rp-x'; x.textContent = '×'; x.addEventListener('click', () => { close(); ctx.leaveFocus(); });
    head.append(title, x);
    const area = document.createElement('div'); area.className = 'sub';
    area.textContent = areaText(room.points, ctx.imperial());
    box.append(head, area);
    if (matchMedia(SHEET_MEDIA).matches) box.append(heatBox);            // phones: the heating sits inside the room sheet, a second panel at the top left no room for the house
    else if (heatBox.parentNode !== heatHome) heatHome.append(heatBox);
    const rc = live.roomControls(room);
    if (rc) box.append(rc);
    const seen = new Set();                                    // one row per entity (an LED ring's sections may share one light)
    const devs = ctx.entityDevices(f).filter((d) => d.entity && ctx.pointInPoly(d.x, d.z, room.points) && !seen.has(d.entity) && seen.add(d.entity));
    const placedIds = new Set(ctx.entityDevices(f).map((d) => d.entity));
    const extra = (room.area ? ctx.areas().find((a) => a.id === room.area)?.entities || [] : [])
      .filter((id) => !placedIds.has(id) && states[id] && inRoomPanel(id))
      .map((id) => ({ entity: id, name: ctx.entities().find((e) => e.entity_id === id)?.name || id }));
    devs.push(...extra);
    heat.render(devs.filter((d) => d.entity.startsWith('climate.')));
    RP_GROUPS.forEach(([group, key]) => {
      if (group === 'climate') return;                          // thermostats have their own panel next to this one
      const list = devs.filter((d) => rpGroupOf(d.entity.split('.')[0]) === group);
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
        const v = document.createElement('span'); v.className = 'v'; v.textContent = rowValue(d.entity);
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
        const slider = (val, onChange) => {
          const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = val ?? 0;
          r.addEventListener('change', () => onChange(+r.value));
          row.append(r);
        };
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
        if (dom === 'cover') {
          ['open_cover', 'stop_cover', 'close_cover'].forEach((a) => {
            const b = document.createElement('button'); b.textContent = t(ACTION_LABEL[a]);
            b.addEventListener('click', () => live.callService(d.entity, a)); row.append(b);
          });
          if (st?.position != null) slider(st.position, (p) => live.callService(d.entity, 'set_cover_position', { position: p }));
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
        const multi = o.paneEntities?.some(Boolean);
        const count = multi ? (o.style === 'triple' ? 3 : 2) : 1;
        for (let i = 0; i < count; i++) {
          const e = multi ? op.pane(o, i) : o.entity;
          if (!e) continue;
          const row = document.createElement('div');
          row.className = 'row' + (op.isOpen(e) ? ' alert' : '');
          const n = document.createElement('span'); n.className = 'n'; n.textContent = (o.name || t(`prop.${o.type}`)) + (multi ? ` · ${t('pane.n', { n: i + 1 })}` : '');
          const v = document.createElement('span'); v.className = 'v'; v.textContent = op.text(e);
          row.append(n, v);
          if (e.startsWith('cover.')) {                          // a garage door or shutter-like opening can be driven from here
            ['open_cover', 'stop_cover', 'close_cover'].forEach((act) => {
              const b = document.createElement('button'); b.textContent = t(ACTION_LABEL[act]);
              b.addEventListener('click', () => live.callService(e, act)); row.append(b);
            });
          }
          box.append(row);
        }
      });
    });
    if (!devs.length && !ops.length) { const e = document.createElement('div'); e.className = 'sub'; e.textContent = t('rp.empty'); box.append(e); }
  }
  return { open, close, render, current: () => forId };
}
