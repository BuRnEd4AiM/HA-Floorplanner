/* Room entities (edit mode): the list under a selected room with its placed devices, its doors / windows and the entities of its Home Assistant
 * area that are not placed yet, each with a live state. Unplaced entities are put where they belong with one click (autoplace.js); what the
 * room has no place for is set in the middle as a plain device. The fallback choices are pure functions (tested). */
import { roomOpenings } from './roompanel.js';

/** the device type an entity becomes when the room has no better place for it */
export const DOMAIN_DEVICE = { light: 'light', cover: 'switch', switch: 'switch', climate: 'thermostat', media_player: 'tv', sensor: 'sensor', binary_sensor: 'sensor', person: 'presence', device_tracker: 'presence' };
export const fallbackType = (entityId) => DOMAIN_DEVICE[entityId.split('.')[0]] || 'sensor';
/** the middle of the room's bounding box, or a point just inside its first corner when the middle is outside (an L-shaped room) */
export function fallbackSpot(points, pointInPoly) {
  const xs = points.map((p) => p[0]), zs = points.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  return pointInPoly(cx, cz, points) ? [cx, cz] : [points[0][0] + 0.5, points[0][1] + 0.5];
}

/** ctx: $, t, floor(), roomCtx(), selection(), locked(), lockTo(sel), select(sel) (without lock), releaseLock(), refreshSelection(), entityDevices(f),
 *  pointInPoly, stateText(id), areas(), areaOf(), openingEntities(o), classify(info), entityInfo(id), autoPlace(room, ids), setStatus(txt),
 *  snapshot(), changed(), uid(), deviceY(type) */
export function initRoomEntities(ctx) {
  const { $, t } = ctx;
  let filter = '';
  function render() {
    const box = $('#roomEnts');
    const roomId = ctx.roomCtx(), f = ctx.floor();
    const room = roomId ? f?.rooms.find((r) => r.id === roomId) : null;
    if (!box || !room) return;
    const selection = ctx.selection(), locked = ctx.locked(), areas = ctx.areas(), areaOf = ctx.areaOf();
    const hadFocus = document.activeElement?.id === 'roomEntSearch';
    box.replaceChildren();
    const h = document.createElement('h4'); h.textContent = t('prop.roomEntities'); box.append(h);
    const rs = document.createElement('input'); rs.type = 'search'; rs.id = 'roomEntSearch'; rs.placeholder = t('panel.entitySearch'); rs.value = filter;
    const applyFilter = () => {              // filter in place, so typing is never interrupted by a re-render
      const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
      box.querySelectorAll('.re-row').forEach((r) => { r.hidden = !words.every((w) => r.dataset.q.includes(w)); });
    };
    rs.addEventListener('input', () => { filter = rs.value; applyFilter(); });
    box.append(rs);
    const placed = f.devices.filter((d) => ctx.pointInPoly(d.x, d.z, room.points));
    const placedIds = new Set(ctx.entityDevices(f).map((d) => d.entity).filter(Boolean));
    const row = (title, entity, btn) => {
      const r = document.createElement('div'); r.className = 're-row';
      const n = document.createElement('span'); n.className = 're-n'; n.textContent = title;
      const s = document.createElement('span'); s.className = 're-s'; s.textContent = entity ? `${entity} · ${ctx.stateText(entity)}` : t('re.noEntity');
      r.append(n, s);
      r.dataset.q = `${title} ${entity || ''} ${areas.find((x) => x.id === areaOf[entity])?.name || ''}`.toLowerCase();
      if (btn) r.append(btn);
      box.append(r);
      return r;
    };
    const pickRow = (r, kind, id) => {
      r.classList.add('placed');
      if (selection?.id === id) r.classList.add('active');
      r.addEventListener('click', () => { if (ctx.selection()?.id === id && ctx.locked()) { ctx.releaseLock(); return; } ctx.lockTo({ kind, id }); });
    };
    placed.forEach((d) => pickRow(row(d.name || t(`dev.${d.type}`), d.entity, null), 'device', d.id));
    roomOpenings(room, f).forEach((o) => pickRow(row(o.name || t(`prop.${o.type}`), o.entity, null), 'opening', o.id));
    f.walls.forEach((w) => (w.openings || []).forEach((o) => ctx.openingEntities(o).forEach((e) => placedIds.add(e))));   // contacts already on a door / window
    const extra = (room.area ? areas.find((x) => x.id === room.area)?.entities || [] : []).filter((id) => !placedIds.has(id));
    const placeable = extra.filter((id) => ctx.classify(ctx.entityInfo(id)));
    if (placeable.length) {                                  // one click: every thing of the area where it belongs
      const ab = document.createElement('button'); ab.type = 'button'; ab.id = 'reAutoPlace'; ab.className = 're-auto';
      ab.textContent = t('auto.all', { n: placeable.length }); ab.title = t('auto.hint');
      ab.addEventListener('click', () => {
        const plan = ctx.autoPlace(room, placeable);
        ctx.setStatus(t('auto.done', { n: plan.devices.length, o: plan.openings.length, s: plan.skipped.length }));
      });
      box.append(ab);
    }
    extra.forEach((id) => {
      const b = document.createElement('button'); b.textContent = t('re.place');
      b.addEventListener('click', () => {
        const plan = ctx.autoPlace(room, [id]);
        if (plan.devices[0]) ctx.select({ kind: 'device', id: plan.devices[0].id });
        else if (!plan.openings.length) {                    // nothing the room has a place for (energy sensor, scene ...): as before, in the middle
          ctx.snapshot();
          const type = fallbackType(id), [x, z] = fallbackSpot(room.points, ctx.pointInPoly);
          const d = { id: ctx.uid(), type, x, z, y: ctx.deviceY(type), rot: 0, scale: 1, name: ctx.entityInfo(id).name || id, entity: id };
          ctx.floor().devices.push(d);
          ctx.select({ kind: 'device', id: d.id });
          ctx.changed();
        }
        ctx.refreshSelection();
      });
      row(ctx.entityInfo(id).name || id, id, b).classList.add('unplaced');
    });
    applyFilter();
    if (hadFocus) { rs.focus(); rs.setSelectionRange(rs.value.length, rs.value.length); }
    if (!placed.length && !extra.length && !box.querySelector('.re-row')) { const e = document.createElement('div'); e.className = 'sub'; e.textContent = t('re.empty'); box.append(e); }
  }
  return { render };
}
