/* Phones: the floors are a drop-down instead of a row of floor pills that has to be scrolled sideways. At the top there are three
 * buttons side by side: ☰ (tool bar, phonemenu.js), the floor ("Obergeschoss ▾", this module) and the rooms ("Zimmer ▾", the room
 * menu of nav.js). Whether the floor button replaces the pills is decided in style.css (narrow or very low screens only).
 * phoneFloorModel is pure and tested in tests/phonenav.test.mjs. */

/** what the floor button says and what its list holds. lb: { house } */
export function phoneFloorModel(floors, floorIdx, houseMode, lb) {
  const items = floors.map((f, fi) => ({ kind: 'floor', fi, label: f.name, active: !houseMode && fi === floorIdx }));
  if (floors.length > 1 || floors.some((f) => f.devices.length)) items.push({ kind: 'house', label: lb.house, active: houseMode });
  return { label: houseMode ? lb.house : floors[floorIdx]?.name || '', items };
}

/** ctx: $, t, layout(), floorIdx(), houseMode(), switchFloor(i), setHouseMode(on), closeOthers() (the other drop-downs) */
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

  function build() {
    const m = phoneFloorModel(ctx.layout().floors, ctx.floorIdx(), ctx.houseMode(), { house: t('nav.house') });
    btn.textContent = `${m.label} ▾`;
    menu.replaceChildren(...m.items.map((it) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pill' + (it.active ? ' active' : '');
      b.textContent = it.label;
      b.addEventListener('click', () => {
        set(false);
        if (it.kind === 'floor') ctx.switchFloor(it.fi);
        else ctx.setHouseMode(!ctx.houseMode());
      });
      return b;
    }));
  }
  return { build, close: () => set(false) };
}
