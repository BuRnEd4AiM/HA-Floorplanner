/* Navigation (#137, step 21): the floor pills and the room menu over the scene, the scroll arrows of that bar, the tablet's room button,
 * and the sizes the camera frames (a floor, the whole house, the centre of the walls). The pure part is tested in tests/nav.test.mjs. */

/** centre and size (at least 4 m) of a set of [x, z] points; null when there are none */
export function boundsOf(pts) {
  if (!pts.length) return null;
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, size: Math.max(x1 - x0, z1 - z0, 4) };
}
const floorPts = (f) => [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...f.devices.map((d) => [d.x, d.z])];
/** everything of the house; 12 m round the origin for an empty one */
export function houseBoundsOf(floors) { return boundsOf(floors.flatMap(floorPts)) || { cx: 0, cz: 0, size: 12 }; }
/** one floor (or only the isolated room); a roof floor frames the roof box `rb` of the house below it */
export function floorBoundsOf(f, floors, { iso = null, rb = null } = {}) {
  const pts = iso ? [...iso.points] : floorPts(f);
  if (rb && !iso) pts.push([rb.x0, rb.z0], [rb.x1, rb.z1]);
  return boundsOf(pts) || houseBoundsOf(floors);
}
/** centre of the walls of a floor (garden things and lamps outside the house must not pull it away); null without walls */
export function wallsCenterOf(f) {
  if (!f.walls.length) return null;
  const b = boundsOf(f.walls.flatMap((w) => [w.a, w.b]));
  return { cx: b.cx, cz: b.cz };
}
/** a room by its name (no matter the case and spaces) or its id, on any floor: { floor, room } */
export function findRoomByName(floors, name) {
  const n = String(name || '').trim().toLowerCase();
  for (let i = 0; i < floors.length; i++) {
    const r = floors[i].rooms.find((x) => x.name?.trim().toLowerCase() === n || x.id === name);
    if (r) return { floor: i, room: r };
  }
  return null;
}
/** the rooms in the room menu: those of the floor shown, or in the whole-house view those of every floor (top floor first); only named rooms */
export function navEntries(floors, floorIdx, houseMode) {
  return houseMode
    ? floors.map((fl, fi) => ({ fl, fi })).reverse().flatMap(({ fl, fi }) => fl.rooms.filter((r) => r.name).map((r) => ({ r, fl, fi })))
    : (floors[floorIdx]?.rooms || []).filter((r) => r.name).map((r) => ({ r, fl: floors[floorIdx], fi: floorIdx }));
}
/** somebody is in this room: a person / presence device inside it reports home or on (isOn(entity)) */
export function occupied(room, f, isOn, pointInPoly) {
  return f.devices.some((d) => d.type === 'presence' && d.entity && isOn(d.entity) && pointInPoly(d.x, d.z, room.points));
}

/** ctx: $, t, layout(), floorIdx(), houseMode(), focusedRoom(), settings(), tabletRoom(), isOn(entity), pointInPoly, switchFloor(i),
 *  setHouseMode(on), focusRoom(id), roomPanel, toggleMenu(menu, btn, open), floorRail(), renderPlanFloorsChip(), phoneNav() (phones, phonenav.js) */
export function initNav(ctx) {
  const { $, t } = ctx;
  let navKey = '';
  const isOccupied = (r, fl) => occupied(r, fl, ctx.isOn, ctx.pointInPoly);

  function pill(label, active, onClick, title = '', extra = '') {
    const b = document.createElement('button');
    b.className = 'pill' + (active ? ' active' : '') + extra;
    b.textContent = label;
    if (title) b.title = title;
    b.addEventListener('click', onClick);
    return b;
  }

  function buildNav(force = false) {
    const layout = ctx.layout(), floorIdx = ctx.floorIdx(), houseMode = ctx.houseMode(), focusedRoom = ctx.focusedRoom();
    if (!layout.floors[floorIdx]) return;
    const entries = navEntries(layout.floors, floorIdx, houseMode);   // whole-house view: a tap opens that floor and the room
    const key = JSON.stringify([houseMode, floorIdx, layout.floors.map((x) => x.kind), layout.floors.map((x) => x.name), entries.map(({ r, fl }) => [r.id, r.name, isOccupied(r, fl)]), focusedRoom, ctx.settings().language]);
    if (!force && key === navKey) return;
    navKey = key;
    $('#floorPills').replaceChildren(...layout.floors.map((x, i) => pill(x.name, i === floorIdx && !houseMode, () => ctx.switchFloor(i))),
      ...(layout.floors.length > 1 || layout.floors.some((x) => x.devices.length) ? [pill(t('nav.house'), houseMode, () => ctx.setHouseMode(!houseMode), t('nav.houseTip'))] : []));
    // the rooms are one drop-down instead of a row of buttons (a long row has to be scrolled on a tablet)
    const btn = $('#roomMenuBtn'), menu = $('#roomMenu');
    const focusedName = entries.find((e) => e.r.id === focusedRoom)?.r.name;
    btn.hidden = !entries.length;
    btn.textContent = focusedName || t('nav.rooms');
    btn.classList.toggle('active', !!focusedName);
    btn.classList.toggle('occupied', entries.some(({ r, fl }) => isOccupied(r, fl)));
    const items = [];
    if (focusedRoom) items.push(pill(t('nav.allRooms'), false, () => { ctx.toggleMenu(menu, btn, false); ctx.focusRoom(null); ctx.roomPanel.close(); }, '', ' all'));
    let lastFloor = null;
    entries.forEach(({ r, fl, fi }) => {
      if (houseMode && fl !== lastFloor) { const hd = document.createElement('div'); hd.className = 'rmHead'; hd.textContent = fl.name; items.push(hd); lastFloor = fl; }
      const occ = isOccupied(r, fl);
      items.push(pill(r.name, r.id === focusedRoom, () => {
        ctx.toggleMenu(menu, btn, false);
        if (houseMode) { ctx.switchFloor(fi); ctx.focusRoom(r.id); ctx.roomPanel.open(r.id); return; }
        const off = r.id === focusedRoom; ctx.focusRoom(off ? null : r.id); if (off) ctx.roomPanel.close(); else ctx.roomPanel.open(r.id);
      }, occ ? t('nav.occupied') : '', occ ? ' occupied' : ''));
    });
    menu.replaceChildren(...items);
    $('#navSep').hidden = !entries.length;
    ctx.floorRail().build();
    ctx.phoneNav?.()?.build();
    ctx.renderPlanFloorsChip();
    updateHouseToggle();
  }

  /* the pills over the scene scroll sideways when they do not fit (tablets): arrows at the ends, the mouse wheel scrolls too */
  const navBar = $('#navBar');
  function updateNavArrows() {
    const max = navBar.scrollWidth - navBar.clientWidth;
    $('#navLeft').hidden = navBar.scrollLeft <= 2;
    $('#navRight').hidden = navBar.scrollLeft >= max - 2;
  }
  navBar.addEventListener('scroll', updateNavArrows, { passive: true });
  new ResizeObserver(updateNavArrows).observe(navBar);
  new MutationObserver(updateNavArrows).observe(navBar, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  $('#navLeft').addEventListener('click', () => navBar.scrollBy({ left: -navBar.clientWidth * 0.7, behavior: 'smooth' }));
  $('#navRight').addEventListener('click', () => navBar.scrollBy({ left: navBar.clientWidth * 0.7, behavior: 'smooth' }));
  navBar.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || navBar.scrollWidth <= navBar.clientWidth) return;
    navBar.scrollLeft += e.deltaY; e.preventDefault();
  }, { passive: false });

  /* a tablet locked to one room: a button to go from the room to the whole floor and back */
  function updateHouseToggle() {
    const b = $('#houseToggle'), room = ctx.tabletRoom();
    b.hidden = !room;
    if (!room) return;
    b.textContent = ctx.focusedRoom() ? t('nav.wholeFloor') : `‹ ${room}`;
  }
  $('#houseToggle').addEventListener('click', () => {
    const hit = findRoomByName(ctx.layout().floors, ctx.tabletRoom());
    if (!hit) return;
    if (ctx.focusedRoom()) { ctx.focusRoom(null); ctx.roomPanel.close(); }
    else { ctx.switchFloor(hit.floor); ctx.focusRoom(hit.room.id); ctx.roomPanel.open(hit.room.id); }
  });

  return { build: buildNav, updateArrows: updateNavArrows, updateHouseToggle };
}
