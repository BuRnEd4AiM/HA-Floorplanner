/* Choosing a Home Assistant entity: the searchable picker of the side panel (search box + list grouped by area, the room's area first) and the
 * plain <select> of the library. Grouping and searching are pure functions (tested). */

/** entities grouped by Home Assistant area, the room's area first, entities without an area last: [{ key, items }] (key '' = no area) */
export function groupByArea(list, room, areaOf, areas) {
  const byArea = new Map();
  list.forEach((e) => { const k = areaOf[e.entity_id] || ''; if (!byArea.has(k)) byArea.set(k, []); byArea.get(k).push(e); });
  const nameOf = (k) => areas.find((q) => q.id === k)?.name || k;
  const keys = [...byArea.keys()].sort((x, y) => {
    if (room?.area && x === room.area) return -1;
    if (room?.area && y === room.area) return 1;
    if (!x) return 1; if (!y) return -1;
    return nameOf(x).localeCompare(nameOf(y));
  });
  return keys.map((k) => ({ key: k, items: byArea.get(k) }));
}

/** the entities that match a search: every word must appear in the id, the name or the area name (case does not matter); at most `max` */
export function searchEntities(list, query, areaName, max = 300) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((e) => words.every((w) => `${e.entity_id} ${e.name} ${areaName(e)}`.toLowerCase().includes(w))).slice(0, max);
}

/** ctx: t, areas(), areaOf() */
export function initEntityPicker(ctx) {
  const { t } = ctx;
  const areaNameOf = (k) => ctx.areas().find((q) => q.id === k)?.name || k;
  const groupLabel = (k, room) => (k ? (room?.area === k ? t('area.here', { n: areaNameOf(k) }) : areaNameOf(k)) : t('area.unassigned'));

  /** fill a <select> with entities grouped by HA area; the area of `room` comes first */
  function addEntityOptions(sel, list, room, current) {
    const useGroups = ctx.areas().length > 0;
    groupByArea(list, room, ctx.areaOf(), ctx.areas()).forEach(({ key, items }) => {
      const parent = useGroups ? Object.assign(document.createElement('optgroup'), { label: groupLabel(key, room) }) : sel;
      items.forEach((e) => parent.append(new Option(`${e.name} (${e.entity_id})`, e.entity_id)));
      if (useGroups) sel.append(parent);
    });
    if (current && !list.some((e) => e.entity_id === current)) sel.add(new Option(current, current));
  }

  /* Searchable entity picker: search box + roomy result list (full names wrap, grouped by area).
     Search matches name, entity id and area; several words = AND; Enter picks the first match. */
  function entityPicker(list, room, current, onChange) {
    const wrap = document.createElement('div'); wrap.className = 'entPicker';
    const cur = document.createElement('div'); cur.className = 'entCur';
    const search = document.createElement('input'); search.type = 'search'; search.placeholder = t('panel.entitySearch');
    const box = document.createElement('div'); box.className = 'entList'; box.hidden = true;
    const areaName = (e) => (ctx.areas().find((x) => x.id === ctx.areaOf()[e.entity_id])?.name || '').toLowerCase();
    let matches = [];
    const showCur = () => {
      const e = list.find((x) => x.entity_id === current);
      cur.textContent = ''; cur.classList.toggle('none', !current);
      if (!current) { cur.textContent = t('panel.noEntity'); return; }
      const n = document.createElement('b'); n.textContent = e?.name || current;
      const id = document.createElement('small'); id.textContent = current;
      cur.append(n, id);
    };
    const choose = (id) => { current = id; search.value = ''; box.hidden = true; showCur(); onChange(id); };
    const item = (id, name, sub) => {
      const it = document.createElement('div'); it.className = 'entItem' + (id === current ? ' sel' : ''); it.dataset.id = id;
      const n = document.createElement('span'); n.textContent = name; it.append(n);
      if (sub) { const s = document.createElement('small'); s.textContent = sub; it.append(s); }
      it.addEventListener('pointerdown', (ev) => { ev.preventDefault(); choose(id); });
      return it;
    };
    const fill = () => {
      matches = searchEntities(list, search.value, areaName);
      box.innerHTML = '';
      box.append(item('', t('panel.noEntity'), ''));
      const withLabels = ctx.areas().length > 0;
      groupByArea(matches, room, ctx.areaOf(), ctx.areas()).forEach((g) => {
        if (withLabels) { const h = document.createElement('div'); h.className = 'entGroup'; h.textContent = groupLabel(g.key, room); box.append(h); }
        g.items.forEach((e) => box.append(item(e.entity_id, e.name, e.entity_id)));
      });
      if (!matches.length) { const n = document.createElement('div'); n.className = 'entEmpty'; n.textContent = '–'; box.append(n); }
    };
    search.addEventListener('focus', () => { fill(); box.hidden = false; });
    search.addEventListener('input', () => { fill(); box.hidden = false; });
    search.addEventListener('blur', () => { box.hidden = true; });
    search.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { search.blur(); return; }
      if (ev.key !== 'Enter' || !matches.length) return;
      ev.preventDefault(); choose(matches[0].entity_id);
    });
    wrap.append(cur, search, box); showCur();
    return wrap;
  }
  return { entityPicker, addEntityOptions };
}
