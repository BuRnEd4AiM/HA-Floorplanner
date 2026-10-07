/* Warnings (#58): smoke, gas, CO, water, alarm, window open in the rain. The banner at the top, the red pulsing room and the jump to the room.
 * What counts as a warning is decided in alerts.js (tested); this part finds the room of the entity and draws the banner. */
import { findAlerts } from './alerts.js';
import { ringEntities } from './ledring.js';
import { wallLength } from './walls.js';
import { openingWalls } from './dormerwin.js';

const ALERT_ICON = { smoke: '🔥', gas: '⚠️', co: '☠️', water: '💧', alarm: '🚨', rain: '🌧️' };

/** ctx: $, t, layout(), entities(), settings(), areaOf(), pointInPoly, openingEntities, build(), isLive(), houseMode(), floorIdx(), switchFloor(i), focusRoom(id), openRoomPanel(id), kioskTouched() */
export function initAlertsUi(ctx) {
  const { $, t } = ctx;
  const pulses = [];                 // materials of the red room overlays (filled by build() in app.js), pulsed in animate()
  let alerts = [], alertSig = '', alertRooms = new Set();
  /** where an entity is in the plan: the floor and room of the device / window it is bound to, else the room of its HA area */
  function locateEntity(id) {
    for (let fi = 0; fi < ctx.layout().floors.length; fi++) {
      const f = ctx.layout().floors[fi], roomAt = (x, z) => f.rooms.find((r) => ctx.pointInPoly(x, z, r.points))?.id || null;
      const d = f.devices.find((q) => q.entity === id || q.ledEntity === id || (q.type === 'ledring' && ringEntities(q).includes(id)));
      if (d) return { floor: fi, roomId: roomAt(d.x, d.z) };
      for (const w of openingWalls(f)) {
        const o = (w.openings || []).find((q) => ctx.openingEntities(q).includes(id));
        if (!o) continue;
        const L = wallLength(w) || 1, ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L, x = w.a[0] + ux * o.pos, z = w.a[1] + uz * o.pos;
        return { floor: fi, roomId: roomAt(x - uz * 0.3, z + ux * 0.3) || roomAt(x + uz * 0.3, z - ux * 0.3) };   // the room on either side
      }
    }
    const ar = ctx.areaOf()[id];
    if (ar) for (let fi = 0; fi < ctx.layout().floors.length; fi++) { const r = ctx.layout().floors[fi].rooms.find((q) => q.area === ar); if (r) return { floor: fi, roomId: r.id }; }
    return null;
  }
  function updateAlerts() {
    if (!ctx.entities().length) return;
    const windows = [];
    ctx.layout().floors.forEach((f) => openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
      if (o.type === 'window') ctx.openingEntities(o).forEach((e) => windows.push({ entity: e, name: o.name || ctx.entities().find((x) => x.entity_id === e)?.name || t('prop.window') }));
    })));
    const list = ctx.settings().alerts === false ? [] : findAlerts(ctx.entities(), windows, ctx.settings().weatherEntity).map((a) => ({ ...a, at: locateEntity(a.entity) }));
    const sig = JSON.stringify(list.map((a) => [a.kind, a.entity, a.at]));
    if (sig === alertSig) return;
    const before = new Set(alerts.map((a) => a.kind + a.entity));
    alerts = list; alertSig = sig;
    renderAlertBar();
    const rooms = new Set(list.map((a) => a.at?.roomId).filter(Boolean));
    if ([...rooms].sort().join() !== [...alertRooms].sort().join()) { alertRooms = rooms; ctx.build(); }
    const fresh = list.find((a) => !before.has(a.kind + a.entity));
    if (fresh && ctx.settings().alertJump && ctx.isLive()) jumpToAlert(fresh);
  }
  function renderAlertBar() {
    const bar = $('#alertBar');
    bar.replaceChildren(...alerts.map((a) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'alertItem';
      const room = a.at?.roomId && ctx.layout().floors[a.at.floor]?.rooms.find((r) => r.id === a.at.roomId)?.name;
      b.textContent = `${ALERT_ICON[a.kind] || '⚠️'} ${t(`alert.${a.kind}`)}${room ? ` · ${room}` : ''} · ${a.name}`;
      b.addEventListener('click', () => jumpToAlert(a));
      return b;
    }));
    bar.hidden = !alerts.length;
  }
  function jumpToAlert(a) {
    if (!a.at) return;
    if (ctx.houseMode() || ctx.floorIdx() !== a.at.floor) ctx.switchFloor(a.at.floor);
    if (a.at.roomId) { ctx.focusRoom(a.at.roomId); if (ctx.isLive()) ctx.openRoomPanel(a.at.roomId); }
    ctx.kioskTouched();
  }
  return {
    update: updateAlerts,
    pulses,                                               // app.js empties it on a rebuild and fills it with the red room floors
    hasRoom: (id) => alertRooms.has(id),
    list: () => alerts.map((a) => ({ kind: a.kind, entity: a.entity, at: a.at })),
    /** every frame: the red floors pulse; true while something pulses (keeps the screen awake) */
    animate(now) {
      if (!pulses.length) return false;
      const k = 0.22 + 0.2 * Math.sin(now / 260); pulses.forEach((m) => { m.opacity = k; });
      return true;
    },
  };
}
