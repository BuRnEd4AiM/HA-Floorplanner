/* Start view (#315): the view a screen opens with and comes back to on a wall tablet (kiosk.js) can be saved: the house, the floor or the
 * whole house, the room and where the camera stands. Saved for everybody ("*") and per user (users dialog), in settings.startViews;
 * without one the start stays automatic (the user's room or the ground floor). The rules are pure (unit test: tests/startview.test.mjs),
 * initStartView takes the current view and goes back to a saved one. */

/** the key of the start view for everybody (users without their own) */
export const ALL = '*';
const vec = (v) => (Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) < 1e5)
  ? v.map((x) => +x.toFixed(3)) : null);
const str = (v, n) => (typeof v === 'string' && v.length <= n ? v : '');

/** a start view with only what belongs in it ({ house, floor (its id), idx (its place), whole, room, cam, target }); null for junk */
export function cleanStartView(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const cam = vec(v.cam), target = vec(v.target);
  if (!cam || !target) return null;
  const idx = Number.isInteger(v.idx) && v.idx >= 0 && v.idx < 100 ? v.idx : -1;     // the floor's place in the list, for old plans without floor ids
  return { house: str(v.house, 32), floor: str(v.floor, 40), idx, whole: v.whole === true, room: str(v.room, 40) || null, cam, target };
}
/** { user or "*": start view }: junk dropped, at most 50 */
export function cleanStartViews(o) {
  const out = {};
  if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
  for (const [k, v] of Object.entries(o).slice(0, 50)) { const c = cleanStartView(v); if (k && c) out[String(k).slice(0, 80)] = c; }
  return out;
}

/** what a start view means in the open house: { floorIdx, whole, room, cam, target }; null when it belongs to another house or its floor is
 *  gone (then the start stays automatic). floors: [{ id, rooms: [{ id }] }] */
export function resolveStart(v, houseId, floors) {
  const c = cleanStartView(v);
  if (!c || (c.house && houseId && c.house !== houseId)) return null;
  const fi = c.floor ? (floors || []).findIndex((f) => f.id === c.floor) : c.idx < (floors || []).length ? c.idx : -1;
  if (fi < 0 && !c.whole) return null;
  const room = fi >= 0 && c.room && (floors[fi].rooms || []).some((r) => r.id === c.room) ? c.room : null;
  return { floorIdx: fi, whole: c.whole, room, cam: c.cam, target: c.target };
}

/** the text for a start view: "Erdgeschoss · Wohnzimmer", "Ganzes Haus" ...; '' when it does not fit the open house. names: { whole } */
export function describeStart(v, houseId, floors, names) {
  const r = resolveStart(v, houseId, floors);
  if (!r) return '';
  if (r.whole) return names.whole;
  const f = floors[r.floorIdx], room = r.room && (f.rooms || []).find((x) => x.id === r.room);
  return [f.name, room?.name].filter(Boolean).join(' · ');
}

/** ctx: $, t, settings(), commit() (save the settings), houseId(), houses() ([{ id }]), layout(), houseMode(), floorIdx(), focusedRoom(), camera, controls, setHouseMode(on), switchFloor(i),
 *  focusRoom(id), switchHouse(id) (async) */
export function initStartView(ctx) {
  /** the view shown now, ready to be saved */
  function capture() {
    const { camera, controls } = ctx, p = camera.position, q = controls.target;
    return cleanStartView({ house: ctx.houseId() || '', floor: ctx.layout().floors[ctx.floorIdx()]?.id || '', idx: ctx.floorIdx(), whole: !!ctx.houseMode(),
      room: ctx.houseMode() ? null : ctx.focusedRoom() || null, cam: [p.x, p.y, p.z], target: [q.x, q.y, q.z] });
  }
  /** go to a saved start view; false when there is none for this house (the caller then does the automatic start) */
  async function apply(v) {
    const c = cleanStartView(v);
    if (!c) return false;
    if (c.house && c.house !== ctx.houseId() && ctx.houses().some((h) => h.id === c.house)) await ctx.switchHouse(c.house);
    const r = resolveStart(c, ctx.houseId(), ctx.layout().floors);
    if (!r) return false;
    if (r.whole) { if (!ctx.houseMode()) ctx.setHouseMode(true); }
    else { ctx.switchFloor(r.floorIdx); if (r.room) ctx.focusRoom(r.room); }
    ctx.controls.target.set(...r.target);
    ctx.camera.position.set(...r.cam);
    ctx.controls.update();
    return true;
  }
  /* ---- settings dialog: the start view of everybody ---- */
  const { $, t } = ctx;
  function render() {
    const v = ctx.settings().startViews?.[ALL], el = $('#svState');
    if (!el) return;
    el.textContent = v ? t('sv.saved', { where: describeStart(v, ctx.houseId(), ctx.layout().floors, { whole: t('sv.whole') }) || '–' }) : t('sv.none');
    $('#svAuto').disabled = !v;
  }
  function setAll(v) {
    const s = ctx.settings(), next = { ...(s.startViews || {}) };
    if (v) next[ALL] = v; else delete next[ALL];
    s.startViews = next;
    ctx.commit(); render();
  }
  $('#svTake')?.addEventListener('click', () => setAll(capture()));
  $('#svAuto')?.addEventListener('click', () => setAll(null));
  $('#settingsBtn')?.addEventListener('click', render);
  return { capture, apply, render };
}
