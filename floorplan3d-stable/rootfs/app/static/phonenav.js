/* Phones: the floors are a drop-down instead of a row of floor pills that has to be scrolled sideways. At the top: ☰ (tool bar,
 * phonemenu.js) and one button for the floor and the room ("● Erdgeschoss ▾", this module). Its list has the floors at the top and the rooms
 * of the floor below (5.8.0, docs/ideen-5.8 ⑦: with a button of their own the floor read "E…" and the rooms only "●"); a room's line taps
 * the same entry of the room menu of nav.js (#roomMenu, hidden on phones). Whether the button replaces the pills is decided in style.css
 * (narrow or very low screens only). phoneFloorModel is pure and tested in tests/phonenav.test.mjs. */

/** what the floor button says and what its list holds. lb: { house, rooms }; shown(fi): the floor has something of the building shown (#409);
 *  room: the room open now (its name) or null. label: the room, else the floor or the whole house; roomsHead: the heading over the rooms */
export function phoneFloorModel(floors, floorIdx, houseMode, lb, shown = () => true, room = null) {
  const items = floors.map((f, fi) => ({ kind: 'floor', fi, label: f.name, active: !houseMode && fi === floorIdx })).filter((it) => shown(it.fi));
  if (floors.length > 1 || floors.some((f) => f.devices.length)) items.push({ kind: 'house', label: lb.house, active: houseMode });
  const where = houseMode ? lb.house : floors[floorIdx]?.name || '';
  return { label: room || where, items, roomsHead: [lb.rooms, where].filter(Boolean).join(' · ') };
}

/** ctx: $, t, layout(), floorIdx(), houseMode(), switchFloor(i), setHouseMode(on), closeOthers() (the other drop-downs), floorShown(i) (#409) */
export function initPhoneNav(ctx) {
  const { $, t } = ctx;
  const btn = document.createElement('button'), menu = document.createElement('div');
  btn.id = 'phoneNavBtn'; btn.type = 'button'; btn.className = 'pill';
  btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
  menu.id = 'phoneNav'; menu.hidden = true;
  $('#navBar').prepend(btn);
  $('#stage').append(menu);
  function set(open) { menu.hidden = !open; btn.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); }
  btn.addEventListener('click', (e) => { e.stopPropagation(); const open = menu.hidden; if (open) ctx.closeOthers?.(); set(open); });
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) set(false); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) set(false); });

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function build() {
    const rb = $('#roomMenuBtn'), rooms = [...($('#roomMenu')?.children || [])];
    const room = rb?.classList.contains('active') ? rb.textContent : null;    // nav.js: the button names the room open now
    const m = phoneFloorModel(ctx.layout().floors, ctx.floorIdx(), ctx.houseMode(), { house: t('nav.house'), rooms: t('nav.rooms') }, (i) => ctx.floorShown?.(i) ?? true, room);
    btn.textContent = `${m.label} ▾`;
    btn.classList.toggle('occupied', !!rb?.classList.contains('occupied'));   // the green dot: someone is in a room here
    const floors = el('div', 'pnFloors');
    floors.append(...m.items.map((it) => {
      const b = el('button', 'pill' + (it.active ? ' active' : ''), it.label); b.type = 'button';
      b.addEventListener('click', () => {
        set(false);
        if (it.kind === 'floor') ctx.switchFloor(it.fi);
        else ctx.setHouseMode(!ctx.houseMode());
      });
      return b;
    }));
    const list = rooms.map((r) => {                                 // the rooms: a line taps the same entry of the room menu (nav.js)
      if (r.tagName !== 'BUTTON') return el('div', 'pnHead pnSub', r.textContent);
      const b = el('button', `${r.className} pnRoom`, r.textContent); b.type = 'button'; if (r.title) b.title = r.title;
      b.addEventListener('click', () => { set(false); r.click(); });
      return b;
    });
    menu.replaceChildren(el('div', 'pnHead', t('pn.floors')), floors, ...(list.length ? [el('div', 'pnHead', m.roomsHead), ...list] : []));
  }
  return { build, close: () => set(false) };
}
