/* Settings dialog, the two table-like parts: the tablet assignments (user -> room and view) and the colour scales (temperature, humidity, CO2).
 * What a row list means is decided by pure functions (tested); initSettingsUi draws the rows and reads them back. The rest of the settings
 * (the simple fields, apply and save) stays in app.js. */

export const VIEW_OPTS = ['3d', '2d', 'split', 'all'];

/** rooms for the tablet dropdown of one house: { house, rooms: [{ name, floor }] }, top floor first, roofs and unnamed rooms left out */
export function roomsByHouse(lay, houseName) {
  const rooms = [...(lay.floors || [])].reverse().filter((f) => f.kind !== 'roof')
    .flatMap((f) => (f.rooms || []).filter((r) => r.name).map((r) => ({ name: r.name, floor: f.name })));
  return { house: houseName, rooms };
}

/** the users that have a room or a view, as [{ user, room, view }] (view defaults to 3d) */
export function tabletEntries(settings) {
  const rooms = settings.userRooms || {}, views = settings.userViews || {};
  return [...new Set([...Object.keys(rooms), ...Object.keys(views)])].map((user) => ({ user, room: rooms[user] || '', view: views[user] || '3d' }));
}

/** rows typed in the dialog [{ user, room, view }] -> { rooms, views }; rows without a user are dropped, "whole house" has no room entry */
export function collectTablets(rows) {
  const rooms = {}, views = {};
  rows.forEach((r) => {
    const u = (r.user || '').trim();
    if (!u) return;
    if (r.room) rooms[u] = r.room;
    views[u] = r.view;
  });
  return { rooms, views };
}

/** colour stops typed in the dialog [{ v, c }] (v is a number or a string): sorted by value, rows without a number dropped; fewer than two -> fallback */
export function normalizeStops(rows, fallback) {
  const ok = rows.map((r) => ({ v: parseFloat(r.v), c: r.c })).filter((s) => Number.isFinite(s.v));
  return ok.length >= 2 ? ok.sort((x, y) => x.v - y.v) : fallback;
}

/** ctx: $, t, settings() (the current object, changed in place by the colour scales), defaults (the default settings), layout(), houses() ([{ id, name }]),
 *  houseId(), houseName(), commit() (save the settings) */
export function initSettingsUi(ctx) {
  const { $, t } = ctx;
  let roomGroups = null;                       // filled with all houses when the users dialog opens, until then only the open house
  const currentRoomGroups = () => [roomsByHouse(ctx.layout(), ctx.houseName())];
  async function loadRoomGroups() {
    const houses = ctx.houses();
    if (houses.length < 2) { roomGroups = null; return false; }
    const out = [];
    for (const h of houses) {
      if (h.id === ctx.houseId()) { out.push(roomsByHouse(ctx.layout(), h.name)); continue; }
      try { const r = await fetch(`api/layout?house=${encodeURIComponent(h.id)}`); if (r.ok) out.push(roomsByHouse(await r.json(), h.name)); } catch { /* skip a house that cannot be read */ }
    }
    roomGroups = out;
    return true;
  }
  async function loadHaUsers() {
    let users = [];
    try { const r = await fetch('api/users'); users = r.ok ? await r.json() : []; } catch { users = []; }
    const dl = $('#haUsers'); dl.replaceChildren();
    users.forEach((u) => { const o = document.createElement('option'); o.value = u.username; o.label = u.name; dl.append(o); });
  }
  function tabletRow(user = '', room = '', view = '3d') {
    const row = document.createElement('div'); row.className = 'stop tablet';
    const u = document.createElement('input'); u.type = 'text'; u.value = user; u.dataset.role = 'user'; u.placeholder = t('set.tabletUser'); u.setAttribute('list', 'haUsers');
    const sel = document.createElement('select'); sel.dataset.role = 'room';
    sel.add(new Option(t('set.wholeHouse'), ''));
    const groups = roomGroups || currentRoomGroups();
    groups.forEach((g) => {
      if (!g.rooms.length) return;
      const og = document.createElement('optgroup'); og.label = g.house || t('set.wholeHouse');
      g.rooms.forEach((r) => og.append(new Option(`${r.name} · ${r.floor}`, r.name)));
      sel.append(og);
    });
    if (room && !groups.some((g) => g.rooms.some((r) => r.name === room))) sel.add(new Option(room, room));
    sel.value = room;
    const vs = document.createElement('select'); vs.dataset.role = 'view';
    VIEW_OPTS.forEach((v) => vs.add(new Option(t(`set.view.${v}`), v)));
    vs.value = VIEW_OPTS.includes(view) ? view : '3d';
    const del = document.createElement('button'); del.type = 'button'; del.textContent = '×';
    del.addEventListener('click', () => { row.remove(); ctx.commit(); });
    row.append(u, sel, vs, del);
    return row;
  }
  function renderTablets() {
    const box = $('#tabletRows');
    box.replaceChildren();
    tabletEntries(ctx.settings()).forEach((e) => box.append(tabletRow(e.user, e.room, e.view)));
  }
  function readTablets() {
    return collectTablets([...document.querySelectorAll('#tabletRows .tablet')].map((r) => ({
      user: r.querySelector('[data-role=user]').value, room: r.querySelector('[data-role=room]').value, view: r.querySelector('[data-role=view]').value })));
  }
  $('#addTablet').addEventListener('click', () => {
    const row = tabletRow(); $('#tabletRows').append(row); row.querySelector('input').focus();
  });
  function renderStops(sel, key, unit) {
    const box = $(sel), settings = ctx.settings();
    box.replaceChildren();
    settings[key].forEach((s, i) => {
      const row = document.createElement('div'); row.className = 'stop';
      const num = document.createElement('input'); num.type = 'number'; num.step = 'any'; num.value = s.v; num.dataset.role = 'v';
      const u = document.createElement('span'); u.textContent = unit;
      const col = document.createElement('input'); col.type = 'color'; col.value = s.c; col.dataset.role = 'c';
      const del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.title = t('set.removeStop');
      del.disabled = settings[key].length <= 2;
      del.addEventListener('click', () => { settings[key].splice(i, 1); renderStops(sel, key, unit); ctx.commit(); });
      row.append(num, u, col, del);
      box.append(row);
    });
    const bar = document.createElement('div'); bar.className = 'stopBar';
    bar.style.background = `linear-gradient(90deg, ${settings[key].map((s) => s.c).join(',')})`;
    const add = document.createElement('button'); add.type = 'button'; add.textContent = t('set.addStop');
    add.disabled = settings[key].length >= 10;
    add.addEventListener('click', () => {
      const last = settings[key][settings[key].length - 1];
      settings[key].push({ v: last.v + 5, c: last.c }); renderStops(sel, key, unit); ctx.commit();
    });
    const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = t('set.resetStops');
    reset.addEventListener('click', () => { settings[key] = structuredClone(ctx.defaults[key]); renderStops(sel, key, unit); ctx.commit(); });
    const tools = document.createElement('div'); tools.className = 'stopTools'; tools.append(add, reset);
    box.append(bar, tools);
  }
  function readStops(sel, fallback) {
    return normalizeStops([...$(sel).querySelectorAll('.stop')].map((r) => ({ v: r.querySelector('[data-role=v]').value, c: r.querySelector('[data-role=c]').value })), fallback);
  }
  return { renderTablets, readTablets, renderStops, readStops, loadRoomGroups, loadHaUsers, hasRoomGroups: () => !!roomGroups };
}
