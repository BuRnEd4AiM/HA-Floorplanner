/* Phones: the floors and the rooms are one drop-down instead of a row of floor pills that has to be scrolled sideways.
 * One button at the top ("Obergeschoss · Küche ▾") opens a list: the floors and the whole house, below the rooms of the floor shown.
 * A floor keeps the list open (so a room can be picked next), a room closes it. Whether the button replaces the pills is decided in
 * style.css (narrow or very low screens only). phoneNavModel is pure and tested in tests/phonenav.test.mjs. */
import { navEntries } from './nav.js';

/** what the button says and what the list holds. lb: { house, floors, rooms, allRooms }; occ(room, floor): somebody is in it */
export function phoneNavModel(floors, floorIdx, houseMode, focusedRoom, lb, occ = () => false) {
  const entries = navEntries(floors, floorIdx, houseMode);
  const focused = entries.find((e) => e.r.id === focusedRoom);
  const label = houseMode ? lb.house : [floors[floorIdx]?.name, focused?.r.name].filter(Boolean).join(' · ');
  const items = [{ kind: 'head', label: lb.floors }];
  floors.forEach((f, fi) => items.push({ kind: 'floor', fi, label: f.name, active: !houseMode && fi === floorIdx }));
  if (floors.length > 1 || floors.some((f) => f.devices.length)) items.push({ kind: 'house', label: lb.house, active: houseMode });
  if (entries.length) {
    items.push({ kind: 'head', label: lb.rooms });
    if (focused) items.push({ kind: 'all', label: lb.allRooms });
    let last = null;
    entries.forEach(({ r, fl, fi }) => {
      if (houseMode && fl !== last) { items.push({ kind: 'sub', label: fl.name }); last = fl; }
      items.push({ kind: 'room', fi, id: r.id, label: r.name, active: r.id === focusedRoom, occupied: !!occ(r, fl) });
    });
  }
  return { label: label || lb.rooms, items };
}

/** ctx: $, t, layout(), floorIdx(), houseMode(), focusedRoom(), switchFloor(i), setHouseMode(on), focusRoom(id), roomPanel, occupied(room, floor) */
export function initPhoneNav(ctx) {
  const { $, t } = ctx;
  const btn = document.createElement('button'), menu = document.createElement('div');
  btn.id = 'phoneNavBtn'; btn.type = 'button'; btn.className = 'pill';
  btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
  menu.id = 'phoneNav'; menu.hidden = true;
  $('#navBar').prepend(btn);
  $('#stage').append(menu);
  function set(open) { menu.hidden = !open; btn.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); }
  btn.addEventListener('click', (e) => { e.stopPropagation(); set(menu.hidden); });
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) set(false); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) set(false); });

  function pick(it) {
    const houseMode = ctx.houseMode(), focused = ctx.focusedRoom();
    if (it.kind === 'floor') { ctx.switchFloor(it.fi); return; }                    // stays open: the rooms of that floor are listed now
    if (it.kind === 'house') { ctx.setHouseMode(!houseMode); return; }
    set(false);
    if (it.kind === 'all') { ctx.focusRoom(null); ctx.roomPanel.close(); return; }
    if (houseMode) { ctx.switchFloor(it.fi); ctx.focusRoom(it.id); ctx.roomPanel.open(it.id); return; }
    const off = it.id === focused; ctx.focusRoom(off ? null : it.id); if (off) ctx.roomPanel.close(); else ctx.roomPanel.open(it.id);
  }

  function build() {
    const lb = { house: t('nav.house'), floors: t('nav.floors'), rooms: t('nav.rooms'), allRooms: t('nav.allRooms') };
    const m = phoneNavModel(ctx.layout().floors, ctx.floorIdx(), ctx.houseMode(), ctx.focusedRoom(), lb, ctx.occupied);
    btn.textContent = `${m.label} ▾`;
    menu.replaceChildren(...m.items.map((it) => {
      if (it.kind === 'head' || it.kind === 'sub') { const h = document.createElement('div'); h.className = it.kind === 'head' ? 'rmHead' : 'rmSub'; h.textContent = it.label; return h; }
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pill' + (it.active ? ' active' : '') + (it.kind === 'all' ? ' all' : '') + (it.occupied ? ' occupied' : '') + (it.kind === 'room' ? ' room' : '');
      b.textContent = it.label;
      b.addEventListener('click', () => pick(it));
      return b;
    }));
  }
  return { build, close: () => set(false) };
}
