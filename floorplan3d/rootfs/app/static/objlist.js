/* Object list (edit mode): every object of the floor in the side panel, grouped by room (the room, its doors / windows and its furniture), then
 * what is in no room, walls, stairs, blocks and floor openings. Things that are hard to hit in 3D can be selected (and locked) from here.
 * The grouping is a pure function (tested); initObjList draws the list. */
import { wallLength } from './walls.js';
import { openingWalls } from './dormerwin.js';
import { roomOpenings } from './roompanel.js';

/** [[key, items, title?]] with items { kind, id, label }; every object appears once (in the first room that claims it).
 *  env: { t, pointInPoly } */
export function objectGroups(f, env) {
  const { t } = env;
  const used = new Set();
  const take = (list) => list.filter((it) => { if (used.has(it.id)) return false; used.add(it.id); return true; });
  const devItem = (d) => ({ kind: 'device', id: d.id, label: d.name || t(`dev.${d.type}`) });
  const opItem = (o) => ({ kind: 'opening', id: o.id, label: o.name || t(`prop.${o.type}`) });
  const groups = [];
  f.rooms.forEach((r) => {
    const items = [{ kind: 'room', id: r.id, label: `▣ ${r.name || t('prop.room')}` },
      ...take(roomOpenings(r, f).map(opItem)), ...take(f.devices.filter((d) => env.pointInPoly(d.x, d.z, r.points)).map(devItem))];
    groups.push([`room:${r.id}`, items, r.name || t('prop.room')]);
  });
  const restOps = take(openingWalls(f).flatMap((w) => (w.openings || []).map(opItem)));
  const restDevs = take(f.devices.map(devItem));
  if (restOps.length || restDevs.length) groups.push(['obj.noRoom', [...restOps, ...restDevs], t('obj.noRoom')]);
  groups.push(
    ['obj.walls', f.walls.map((w, i) => ({ kind: 'wall', id: w.id, label: `${t('prop.wall')} ${i + 1} · ${wallLength(w).toFixed(1)} m` }))],
    ['obj.stairs', (f.stairs || []).map((s) => ({ kind: 'stair', id: s.id, label: s.name || t(`stair.${s.type}`) }))],
    ['obj.blocks', (f.blocks || []).map((b) => ({ kind: 'block', id: b.id, label: b.name || t('prop.block') }))],
    ['obj.holes', (f.holes || []).map((h, i) => ({ kind: 'hole', id: h.id, label: `${t('prop.hole')} ${i + 1}` }))],
  );
  return groups;
}

/** ctx: $, t, floor(), isLive(), selection(), locked(), lockTo(sel) (select it and lock), releaseLock(), registry, tool(), setTool(name),
 *  itemOf(kind, id), snapshot(), changed(), renderProps(), plan(), pointInPoly */
export function initObjList(ctx) {
  const { $, t } = ctx;
  const groupOpen = {};
  let filter = '';
  function render() {
    const box = $('#objList'), body = $('#objListBody');
    if (!box || !body) return;
    const f = ctx.floor();
    if (ctx.isLive() || !f) { box.hidden = true; return; }
    box.hidden = false;
    body.replaceChildren();
    const locked = ctx.locked(), selection = ctx.selection();
    const lockBar = document.createElement('div'); lockBar.className = 'lockbar' + (locked ? ' on' : '');
    const lockTxt = document.createElement('span'); lockTxt.textContent = locked ? t('obj.locked') : t('obj.hint');
    lockBar.append(lockTxt);
    if (locked) {
      const rb = document.createElement('button'); rb.textContent = t('obj.release');
      rb.addEventListener('click', () => ctx.releaseLock());
      lockBar.append(rb);
    }
    body.append(lockBar);
    const fi = document.createElement('input'); fi.type = 'search'; fi.className = 'objfilter'; fi.placeholder = t('obj.filter'); fi.value = filter;
    fi.addEventListener('input', () => { filter = fi.value; const pos = fi.selectionStart; render(); const n = $('#objListBody .objfilter'); n?.focus(); n?.setSelectionRange(pos, pos); });
    body.append(fi);
    const q = (filter || '').trim().toLowerCase();
    objectGroups(f, { t, pointInPoly: ctx.pointInPoly }).forEach(([key, allItems, title]) => {
      const items = q ? allItems.filter((it) => it.label.toLowerCase().includes(q)) : allItems;
      if (!items.length) return;
      const det = document.createElement('details');
      const holdsSel = items.some((it) => it.id === selection?.id);
      det.open = q ? true : holdsSel || (groupOpen[key] ?? false);
      det.addEventListener('toggle', () => { groupOpen[key] = det.open; });
      const sum = document.createElement('summary'); sum.textContent = `${title ?? t(key)} (${items.length})`;
      det.append(sum);
      items.forEach((it) => {
        const rowEl = document.createElement('div'); rowEl.className = 'objrow';
        const lk = document.createElement('input'); lk.type = 'checkbox'; lk.className = 'objlock'; lk.title = t('prop.lock');
        lk.checked = !!ctx.itemOf(it.kind, it.id)?.locked;
        lk.addEventListener('change', () => { const o = ctx.itemOf(it.kind, it.id); if (!o) return; ctx.snapshot(); if (lk.checked) o.locked = true; else delete o.locked; ctx.changed(); ctx.renderProps(); ctx.plan()?.render(); });
        const b = document.createElement('button');
        b.className = 'obj' + (selection?.id === it.id ? ' active' : '') + (ctx.itemOf(it.kind, it.id)?.locked ? ' locked' : '');
        b.textContent = it.label;
        b.addEventListener('click', () => {
          if (!ctx.registry.get(it.id)) return;
          if (ctx.selection()?.id === it.id && ctx.locked()) { ctx.releaseLock(); return; }   // click again: release
          if (ctx.tool() !== 'select') ctx.setTool('select');
          ctx.lockTo({ kind: it.kind, id: it.id });
        });
        rowEl.append(lk, b);
        det.append(rowEl);
      });
      body.append(det);
    });
  }
  return { render };
}
