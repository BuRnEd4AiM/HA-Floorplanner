/* 📱 Handy wie eine App (5.22.0, docs/ideen-5.21 pictures 8–10): the pages Start and Räume, the sheet "Mehr" and a room as a page of its
 * own on the phone. The rules (which tabs, the order of the rooms, the chips) are appshell.js (tested); tabsui.js puts the bar together;
 * app.js gives what this needs through ctx. */
import { START, ROOMS, MORE, HOUSE, greeting, roomTiles, byFloor, statusChips, moreItems } from './appshell.js';

/**
 * ctx: t, lang(), host (#tabPages), rooms() ([{ fi, floor, id, name, temp, lights, open, occupied }] of the house shown), ground(),
 * icon(name) (a room's emoji), status() ({ lightsOn, alarm, offline, low, open, temp }), act(key) (a chip: the light list, the open windows …),
 * openRoom(fi, id) (the room as a page: its card), lightsOff(fi, id), snapshot() (a picture of the 3D house, data URL or ''),
 * show(tab), tabs() ([{ key, icon, name }] of the screen), tabName(key), canSettings(), openSettings(), classic() (back to the classic view),
 * num(v) (one decimal in the screen's language)
 */
export function initAppUi(ctx) {
  const { t } = ctx;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const button = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  const page = (key) => { const s = make('section', 'tabPage appPage'); s.dataset.page = key; s.hidden = true; ctx.host.append(s); return s; };
  const startEl = page(START), roomsEl = page(ROOMS);
  let picture = '', pictureAt = 0, drawnStart = '', drawnRooms = '';

  function tile(r) {
    const b = make('div', `apRoom${r.lights ? ' lit' : ''}`); b.dataset.room = r.id; b.dataset.floor = String(r.fi);
    b.tabIndex = 0; b.setAttribute('role', 'button');
    const tg = button('apToggle', r.lights ? '💡' : '⏻', (e) => { e.stopPropagation(); if (r.lights) ctx.lightsOff(r.fi, r.id); else ctx.openRoom(r.fi, r.id); });
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
    const sig = JSON.stringify([rooms, chips, greeting(now.getHours()), now.getDate(), t('app.rooms')]);
    if (Date.now() - pictureAt > 60000 || !picture) { picture = ctx.snapshot() || picture; pictureAt = Date.now(); }
    if (!force && sig === drawnStart && startEl.childElementCount) return;
    drawnStart = sig;
    let date;
    try { date = new Intl.DateTimeFormat(ctx.lang(), { weekday: 'long', day: 'numeric', month: 'long' }).format(now); } catch { date = now.toDateString(); }
    const head = make('div', 'apHead');
    head.append(make('div', 'apDate', date), make('h1', 'apHello', `${t(`app.hello.${greeting(now.getHours())}`)} 👋`));
    const chipRow = make('div', 'apChips');
    chips.forEach((c) => { const b = button(`apChip ${c.tone}`, `${c.icon} ${c.text}`, () => ctx.act(c.key)); b.dataset.chip = c.key; chipRow.append(b); });
    const house = button('apHouse', '', () => ctx.show(HOUSE)); house.dataset.act = 'appHouse';
    if (picture) { const img = make('img'); img.src = picture; img.alt = ''; house.append(img); }
    house.append(make('span', 'apHouseLab', `🧊 ${t('app.house3d')} ›`));
    const sec = make('div', 'apSec'); sec.append(make('b', '', t('app.rooms')), button('apLink', t('app.all'), () => ctx.show(ROOMS)));
    const grid = make('div', 'apGrid'); rooms.forEach((r) => grid.append(tile(r)));
    if (!rooms.length) grid.append(make('p', 'apEmpty', t('app.noRooms')));
    startEl.replaceChildren(head, chipRow, house, sec, grid);
  }
  function renderRooms(force = false) {
    const groups = byFloor(ctx.rooms(), ctx.ground());
    const sig = JSON.stringify([groups, t('app.rooms')]);
    if (!force && sig === drawnRooms && roomsEl.childElementCount) return;
    drawnRooms = sig;
    const out = [make('h1', 'apTitle', t('app.rooms'))];
    groups.forEach((g) => { out.push(make('div', 'apSec', null)); out.at(-1).append(make('b', '', g.floor)); const grid = make('div', 'apGrid'); g.rooms.forEach((r) => grid.append(tile(r))); out.push(grid); });
    if (!groups.length) out.push(make('p', 'apEmpty', t('app.noRooms')));
    roomsEl.replaceChildren(...out);
  }

  /* ---- "Mehr": a sheet with every other page, the settings and the classic view ---- */
  let sheet = null;
  function closeMore() { sheet?.remove(); sheet = null; }
  function openMore() {
    closeMore();
    sheet = make('div', 'apSheetBack'); sheet.dataset.sheet = MORE;
    const box = make('div', 'apSheet'); box.append(make('div', 'apGrab'), make('h2', '', t('app.more')));
    const list = make('div', 'apList');
    const tabs = ctx.tabs(), keys = moreItems(tabs.map((x) => x.key));
    keys.forEach((k) => {
      const x = tabs.find((y) => y.key === k);
      const b = button('apItem', '', () => { closeMore(); ctx.show(k); }); b.dataset.tab = k;
      b.append(make('span', 'apItemIcon', x.icon), make('span', '', ctx.tabName(x)), make('i', '', '›'));
      list.append(b);
    });
    if (ctx.canSettings()) {
      const s = button('apItem', '', () => { closeMore(); ctx.openSettings(); }); s.dataset.act = 'appSettings';
      s.append(make('span', 'apItemIcon', '⚙️'), make('span', '', t('app.settings')), make('i', '', '›'));
      list.append(s);
    }
    const c = button('apItem soft', '', () => { closeMore(); ctx.classic(); }); c.dataset.act = 'appClassic';
    c.append(make('span', 'apItemIcon', '🧩'), make('span', '', t('app.classic')), make('i', '', '›'));
    list.append(c);
    box.append(list);
    sheet.append(box);
    sheet.addEventListener('click', (e) => { if (e.target === sheet) closeMore(); });
    document.body.append(sheet);
  }

  return {
    /** the pages for tabsui.js */
    pages: () => ({
      [START]: { el: startEl, render: () => renderStart(true), update: () => renderStart(), has: () => true, reset: () => {} },
      [ROOMS]: { el: roomsEl, render: () => renderRooms(true), update: () => renderRooms(), has: () => true, reset: () => {} },
    }),
    openMore, closeMore,
  };
}
