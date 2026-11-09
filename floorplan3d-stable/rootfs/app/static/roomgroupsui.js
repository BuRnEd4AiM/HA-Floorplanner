/* ▶ Abläufe by room (roomgroups.js has the rules; pictures docs/ideen-4.43/): the switch "☰ Nach Listen / 🏠 Nach Räumen" (kept on this
 * device), a list by room (what has no room open on top, then a closed room for each, "▾ Alle aufklappen" / "▸ Alle zuklappen"), and the
 * card of the rooms with everything of a room in it. A closed room draws nothing but its line, so a long list stays quick. Rooms are open
 * only until the page is loaded again (the owner: "immer alle zu"). routinesown.js and pageroutines.js put them on the page. */
import { groupRooms, roomIcon, cleanView } from './roomgroups.js';

const KEY = 'fp3d.routinesView';

/** ctx: t, areas() (Home Assistant's: [{id, name}]), changed() (draw the page again) */
export function initRoomGroups(ctx) {
  const { t } = ctx;
  const open = new Set();                            // `${list}/${area}` opened
  let view = 'lists';
  try { view = cleanView(localStorage.getItem(KEY)); } catch { /* no storage: the lists */ }
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  const count = (unit, n) => t(n === 1 ? `rg.one.${unit}` : `rg.n.${unit}`, { n });

  /** Home Assistant has areas: otherwise every list stays as it was */
  const on = () => (ctx.areas() || []).length > 0;
  const shown = () => (on() ? view : 'lists');
  function setView(v) {
    view = cleanView(v);
    try { localStorage.setItem(KEY, view); } catch { /* not kept */ }
    ctx.changed();
  }
  function switcher() {
    const box = make('div', 'rgView'); box.setAttribute('role', 'group'); box.title = t('rg.viewHint');
    [['lists', `☰ ${t('rg.lists')}`], ['rooms', `🏠 ${t('rg.rooms')}`]].forEach(([k, text]) => {
      const b = btn(`tpChip${shown() === k ? ' on' : ''}`, text, () => setView(k)); b.dataset.view = k; b.setAttribute('aria-pressed', String(shown() === k));
      box.append(b);
    });
    return box;
  }
  function allBar(list, rooms) {
    const bar = make('div', 'rgAll'); bar.dataset.rgList = list;
    const keys = rooms.map((r) => `${list}/${r.id}`);
    const a = btn('tpChip', `▾ ${t('rg.openAll')}`, () => { keys.forEach((k) => open.add(k)); ctx.changed(); }); a.dataset.rgAll = 'open';
    const z = btn('tpChip', `▸ ${t('rg.closeAll')}`, () => { keys.forEach((k) => open.delete(k)); ctx.changed(); }); z.dataset.rgAll = 'close';
    bar.append(a, z, make('span', 'tpSub', count('room', rooms.length)));
    return bar;
  }
  /** one room: its line (icon, name, how many, the names while it is closed) and, opened, body() */
  function room(list, r, sum, names, body) {
    const k = `${list}/${r.id}`, isOpen = open.has(k);
    const box = make('div', `rgRoom${isOpen ? ' open' : ''}`); box.dataset.room = r.id; box.dataset.rgList = list;
    const head = btn('rgHead', '', () => { if (open.has(k)) open.delete(k); else open.add(k); ctx.changed(); });
    head.setAttribute('aria-expanded', String(isOpen));
    head.append(make('span', 'chev', '›'), make('span', 'ic', roomIcon(r.name)), make('b', '', r.name));
    sum.forEach((s) => head.append(make('span', 'n', s)));
    if (!isOpen && names.length) head.append(make('span', 'pre', names.join(' · ')));
    box.append(head);
    if (isOpen) { const b = make('div', 'rgBody'); b.append(...body()); box.append(b); }
    return box;
  }

  /** a list by room: [elements] (the bar, what has no room, the rooms). spec: {items, roomsFor(item) -> [area id], row(item) -> element,
   *  nameOf(item), unit ('tile' | 'flow' | 'auto' | 'scene'), tiles (the rows are big buttons: in a grid), max (at most this many without a
   *  room unless all), more(n) (the button "Alle n zeigen" / "weniger" after them)} */
  function list(key, spec) {
    const g = groupRooms(spec.items, spec.roomsFor, ctx.areas() || []);
    const rows = (items) => (spec.tiles ? [grid(items.map(spec.row))] : items.map(spec.row));
    const out = [];
    if (g.rooms.length) out.push(allBar(key, g.rooms));
    const cut = spec.max && !spec.all && g.loose.length > spec.max;
    if (g.loose.length) out.push(...rows(cut ? g.loose.slice(0, spec.max) : g.loose));
    if (spec.more && spec.max && g.loose.length > spec.max) out.push(spec.more(g.loose.length));
    g.rooms.forEach((r) => out.push(room(key, r, [count(spec.unit, r.items.length)], r.items.map(spec.nameOf), () => rows(r.items))));
    return { els: out, rooms: g.rooms.length, loose: g.loose.length };
  }
  function grid(els) {
    const box = make('div', 'rgTiles');
    box.append(...els);
    return box;
  }

  /** the card of the rooms: kinds [{key, title, ...spec as in list}] in their order; what has no room on top (open), then a room for each
   *  area with something of any kind, everything of the room in it */
  function rooms(kinds) {
    const areas = ctx.areas() || [], out = [];
    const groups = kinds.map((k) => ({ k, g: groupRooms(k.items, k.roomsFor, areas) }));
    const ids = areas.filter((a) => groups.some(({ g }) => g.rooms.some((r) => r.id === a.id))).sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    const part = (k, items) => [make('p', 'rgSub', k.title), ...(k.tiles ? [grid(items.map(k.row))] : items.map(k.row))];
    if (ids.length) out.push(allBar('rooms', ids));
    groups.forEach(({ k, g }) => { if (g.loose.length) out.push(...part(k, g.loose)); });
    ids.forEach((a) => {
      const here = groups.map(({ k, g }) => ({ k, items: g.rooms.find((r) => r.id === a.id)?.items || [] })).filter((x) => x.items.length);
      out.push(room('rooms', { id: a.id, name: a.name || a.id }, here.map((x) => count(x.k.unit, x.items.length)), [], () => here.flatMap((x) => part(x.k, x.items))));
    });
    return out;
  }

  return { on, view: shown, setView, switcher, list, rooms, sig: () => JSON.stringify([shown(), [...open].sort(), (ctx.areas() || []).map((a) => [a.id, a.name, (a.entities || []).length])]) };
}
