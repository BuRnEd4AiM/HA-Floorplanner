/* 📱 Handy wie eine App (5.22.0, docs/ideen-5.21 pictures 8–10): the pages Start and Räume, the sheet "Mehr" and a room as a page of its
 * own on the phone. The rules (which tabs, the order of the rooms, the chips) are appshell.js (tested); tabsui.js puts the bar together;
 * app.js gives what this needs through ctx. */
import { START, ROOMS, MORE, HOUSE, greeting, roomTiles, byFloor, statusChips, moreItems } from './appshell.js';

/**
 * ctx: t, lang(), host (#tabPages), rooms() ([{ fi, floor, id, name, temp, lights, open, occupied }] of the house shown), ground(),
 * icon(name) (a room's emoji), status() ({ lightsOn, alarm, offline, low, open, temp }), act(key) (a chip: the light list, the open windows …),
 * openRoom(fi, id) (the room as a page: its card), lightsOff(fi, id), spin() (the canvas of the turning house, housespinui.js),
 * openHouse() (the 3D view from the picture),
 * show(tab), tabs() ([{ key, icon, name }] of the screen), tabName(key), canSettings(), openSettings(), classic() (back to the classic view),
 * num(v) (one decimal in the screen's language);
 * 5.23.0 (docs/ideen-5.22 pictures 45–52): places() ({ houses: [{ id, name, on }], buildings: [{ id, name, on }] }), pickHouse(id),
 * pickBuilding(id), chipList(key) ({ title, items: [{ icon, text, right, act() }], foot: { text, act() } } or null: the old way, act(key)),
 * menu() ([{ icon, text, act() }]: Bearbeiten, Anleitung, Backup, Sicherheit … for "Mehr"), houseButtons() ([{ key, icon, title,
 * source (the element whose buttons the sheet shows) }]: the round buttons over the 3D house)
 */
export function initAppUi(ctx) {
  const { t } = ctx;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const button = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  const page = (key) => { const s = make('section', 'tabPage appPage'); s.dataset.page = key; s.hidden = true; ctx.host.append(s); return s; };
  const startEl = page(START), roomsEl = page(ROOMS);
  let drawnStart = '', drawnRooms = '';

  /* ---- a list that comes from below (Mehr, Haus und Gebäude, a chip's list, the 3D house's buttons) ---- */
  let sheet = null;
  function closeSheet() { sheet?.remove(); sheet = null; }
  /** sections: [{ head, items: [{ icon, text, right, on, act, data }] }]; foot: { text, act } */
  function openSheet(key, title, sections, foot = null, extra = null) {
    closeSheet();
    sheet = make('div', 'apSheetBack'); sheet.dataset.sheet = key;
    const box = make('div', 'apSheet'); box.append(make('div', 'apGrab'), make('h2', '', title));
    sections.forEach((sec) => {
      if (sec.head) box.append(make('div', 'apGrp', sec.head));
      const list = make('div', 'apList');
      sec.items.forEach((x) => {
        const b = button(`apItem${x.on ? ' on' : ''}${x.soft ? ' soft' : ''}`, '', () => { if (!x.keep) closeSheet(); x.act(); });
        Object.entries(x.data || {}).forEach(([k, v]) => { b.dataset[k] = v; });
        b.append(make('span', 'apItemIcon', x.icon || ''), make('span', '', x.text), make('i', '', x.right ?? '›'));
        list.append(b);
      });
      box.append(list);
    });
    if (extra) box.append(extra);
    if (foot) { const f = button('apFoot', foot.text, () => { closeSheet(); foot.act(); }); f.dataset.act = 'sheetFoot'; box.append(f); }
    sheet.append(box);
    sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
    document.body.append(sheet);
    return box;
  }
  /** "really switch off?" (the owner, 2026-11-20: "nicht aus versehen das ganze zimmer ausmacht … nochmal bestätigen") */
  function confirmOff(title, act) {
    openSheet('confirm', title, [{ items: [{ icon: '⏻', text: t('app.offYes'), right: '', act, data: { act: 'confirmOff' } },
      { icon: '', text: t('app.cancel'), right: '', soft: true, act: () => {}, data: { act: 'confirmCancel' } }] }]);
  }
  /** 🏠 Haus und Gebäude (pictures 45, 46) */
  function placeLabel() {
    const pl = ctx.places?.() || { houses: [], buildings: [] }, h = pl.houses.find((x) => x.on), bd = pl.buildings.find((x) => x.on && x.id);
    return { text: [h?.name || '', bd?.name || ''].filter(Boolean).join(' · '), more: pl.houses.length > 1 || pl.buildings.length > 1 };
  }
  function openPlaces() {
    const pl = ctx.places?.() || { houses: [], buildings: [] }, secs = [];
    if (pl.houses.length > 1) secs.push({ head: t('app.houses'), items: pl.houses.map((h) => ({ icon: '🏠', text: h.name, right: h.on ? '✓' : '', on: h.on, act: () => ctx.pickHouse(h.id), data: { house: h.id } })) });
    if (pl.buildings.length > 1) secs.push({ head: t('app.buildings'), items: pl.buildings.map((x) => ({ icon: x.id ? '🏠' : '🏘', text: x.name, right: x.on ? '✓' : '', on: x.on, act: () => ctx.pickBuilding(x.id), data: { building: x.id || '*' } })) });
    openSheet('places', t('app.places'), secs);
  }
  function placeButton() {
    const l = placeLabel();
    if (!l.text) return null;
    const b = button(`apPlace${l.more ? '' : ' fixed'}`, `🏠 ${l.text}${l.more ? ' ▾' : ''}`, () => { if (l.more) openPlaces(); });
    b.dataset.act = 'appPlace';
    return b;
  }
  /** a chip: its list from below (picture 52), else the old way */
  function chip(key) {
    const l = ctx.chipList?.(key);
    if (!l) { ctx.act(key); return; }
    const foot = l.foot && { text: l.foot.text, act: () => setTimeout(() => confirmOff(l.foot.ask || l.foot.text, l.foot.act)) };   // "Alle aus" asks first too
    openSheet(`chip-${key}`, l.title, [{ items: l.items.map((x) => ({ ...x, keep: !!x.keep })) }], foot, l.items.length ? null : make('p', 'apEmpty', l.empty || t('app.nothing')));
  }

  function tile(r) {
    const b = make('div', `apRoom${r.lights ? ' lit' : ''}`); b.dataset.room = r.id; b.dataset.floor = String(r.fi);
    b.tabIndex = 0; b.setAttribute('role', 'button');
    const tg = button('apToggle', r.lights ? '💡' : '⏻', (e) => {
      e.stopPropagation();
      if (!r.lights) { ctx.openRoom(r.fi, r.id); return; }
      confirmOff(t(r.lights === 1 ? 'app.offAsk1' : 'app.offAsk', { room: r.name, n: r.lights }), () => ctx.lightsOff(r.fi, r.id));   // the owner: not by mistake, ask first
    });
    tg.title = t(r.lights ? 'app.allOff' : 'app.open1');
    const sub = [r.temp == null ? '' : `${ctx.num(r.temp)}°`, r.lights ? t('app.nOn', { n: r.lights }) : t('app.off'), r.open ? '🪟' : ''].filter(Boolean).join(' · ');
    b.append(make('span', 'apRoomIcon', ctx.icon(r.name)), tg, make('b', '', r.name), make('small', '', sub));
    const go = () => ctx.openRoom(r.fi, r.id);
    b.addEventListener('click', go);
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    return b;
  }

  function renderStart(force = false) {
    const now = new Date(), rooms = roomTiles(ctx.rooms(), 6), chips = statusChips(ctx.status(), t, ctx.num);
    const sig = JSON.stringify([rooms, chips, greeting(now.getHours()), now.getDate(), t('app.rooms'), placeLabel()]);
    if (!force && sig === drawnStart && startEl.childElementCount) return;
    drawnStart = sig;
    let date;
    try { date = new Intl.DateTimeFormat(ctx.lang(), { weekday: 'long', day: 'numeric', month: 'long' }).format(now); } catch { date = now.toDateString(); }
    const head = make('div', 'apHead');
    head.append(make('div', 'apDate', date), make('h1', 'apHello', `${t(`app.hello.${greeting(now.getHours())}`)} 👋`));
    const chipRow = make('div', 'apChips');
    chips.forEach((c) => { const b = button(`apChip ${c.tone}`, `${c.icon} ${c.text}`, () => chip(c.key)); b.dataset.chip = c.key; chipRow.append(b); });
    const house = button('apHouse', '', () => (ctx.openHouse ? ctx.openHouse() : ctx.show(HOUSE))); house.dataset.act = 'appHouse';
    const spin = ctx.spin?.();                                     // the whole building shown, turning (housespinui.js, 5.28.0)
    if (spin) house.append(spin);
    house.append(make('span', 'apHouseLab', `🧊 ${t('app.house3d')} ›`));
    const sec = make('div', 'apSec'); sec.append(make('b', '', t('app.rooms')), button('apLink', t('app.all'), () => ctx.show(ROOMS)));
    const grid = make('div', 'apGrid'); rooms.forEach((r) => grid.append(tile(r)));
    if (!rooms.length) grid.append(make('p', 'apEmpty', t('app.noRooms')));
    const place = placeButton();
    startEl.replaceChildren(...(place ? [place] : []), head, chipRow, house, sec, grid);
  }
  function renderRooms(force = false) {
    const groups = byFloor(ctx.rooms(), ctx.ground());
    const sig = JSON.stringify([groups, t('app.rooms'), placeLabel()]);
    if (!force && sig === drawnRooms && roomsEl.childElementCount) return;
    drawnRooms = sig;
    const place = placeButton();
    const out = [...(place ? [place] : []), make('h1', 'apTitle', t('app.rooms'))];
    groups.forEach((g) => { out.push(make('div', 'apSec', null)); out.at(-1).append(make('b', '', g.floor)); const grid = make('div', 'apGrid'); g.rooms.forEach((r) => grid.append(tile(r))); out.push(grid); });
    if (!groups.length) out.push(make('p', 'apEmpty', t('app.noRooms')));
    roomsEl.replaceChildren(...out);
  }

  /* ---- "Mehr": every other page, the menu of ☰ (picture 51), the settings and the classic view ---- */
  function openMore() {
    const tabs = ctx.tabs(), keys = moreItems(tabs.map((x) => x.key));
    const pages = keys.map((k) => { const x = tabs.find((y) => y.key === k); return { icon: x.icon, text: ctx.tabName(x), act: () => ctx.show(k), data: { tab: k } }; });
    const tools = [...(placeLabel().more ? [{ icon: '🏠', text: t('app.places'), right: `${placeLabel().text} ›`, act: () => setTimeout(openPlaces), data: { act: 'appPlaces' } }] : []),
      ...(ctx.menu?.() || [])];
    if (ctx.canSettings()) tools.push({ icon: '⚙️', text: t('app.settings'), act: () => ctx.openSettings(), data: { act: 'appSettings' } });
    tools.push({ icon: '🧩', text: t('app.classic'), soft: true, act: () => ctx.classic(), data: { act: 'appClassic' } });
    openSheet(MORE, t('app.more'), [{ items: pages }, { head: t('app.tools'), items: tools }]);
  }
  /* ---- the round buttons over the 3D house (pictures 49, 50): each opens the buttons of a part of the page as a list ---- */
  const fabs = make('div', 'apFabs'); fabs.hidden = true; document.body.append(fabs);
  function proxy(src) {
    const btns = [...(src?.querySelectorAll('button') || [])].filter((b) => !b.hidden && b.id !== 'viewMenuBtn' && getComputedStyle(b).display !== 'none' && b.textContent.trim());
    return btns.map((b) => ({ icon: '', text: b.textContent.trim(), right: b.classList.contains('active') || b.classList.contains('on') || b.getAttribute('aria-pressed') === 'true' ? '✓' : '',
      on: b.classList.contains('active') || b.classList.contains('on'), act: () => b.click() }));
  }
  function houseFabs(on) {
    fabs.hidden = !on;
    if (!on) return;
    const list = ctx.houseButtons?.() || [], sig = list.map((x) => x.key).join();
    if (fabs.dataset.sig === sig) return;
    fabs.dataset.sig = sig;
    fabs.replaceChildren(...list.map((x) => { const b = button('apFab', x.icon, () => openSheet(`fab-${x.key}`, x.title, [{ items: proxy(x.source()) }])); b.title = x.title; b.dataset.fab = x.key; return b; }));
  }

  return {
    /** the pages for tabsui.js */
    pages: () => ({
      [START]: { el: startEl, render: () => renderStart(true), update: () => renderStart(), has: () => true, reset: () => {} },
      [ROOMS]: { el: roomsEl, render: () => renderRooms(true), update: () => renderRooms(), has: () => true, reset: () => {} },
    }),
    openMore, closeMore: closeSheet, houseFabs, openPlaces,
  };
}
