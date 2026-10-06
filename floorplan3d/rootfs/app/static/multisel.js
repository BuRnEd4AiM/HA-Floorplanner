/* Several things at once (#211): Shift (or Ctrl, #247) + click adds a thing to the selection or takes it out again, Shift / Ctrl + drag in
 * the plan selects everything inside the frame, Delete removes them all in one undo step. The list logic is pure (unit test: tests/multisel.test.mjs); initMultiSelect keeps the list, the 3D outlines and the
 * box in the properties panel. A selection of one thing is the normal selection, the list only exists from two things on. */
import * as THREE from './vendor/three.module.min.js';

const same = (a, b) => !!a && !!b && a.kind === b.kind && a.id === b.id;
/** Shift + click on `item`: the new list and the thing that is shown in the panel (the last one added) */
export function toggleMulti(list, current, item) {
  if (!item) return { list, selection: current };
  const start = list.length ? list : current ? [current] : [];
  const next = start.some((x) => same(x, item)) ? start.filter((x) => !same(x, item)) : [...start, { kind: item.kind, id: item.id }];
  return { list: next.length > 1 ? next : [], selection: next[next.length - 1] || null };
}
/** the things to delete: the list, or the single selection; doors and windows first (they go with their wall anyway), cables are left out */
export function deleteOrder(list, current) {
  const all = (list.length ? list : current ? [current] : []).filter((x) => x.kind !== 'cable');
  return [...all.filter((x) => x.kind === 'opening'), ...all.filter((x) => x.kind !== 'opening')];
}

/** Shift / Ctrl + drag in the plan (#247): everything that lies wholly inside the frame between the corners a and b ([x, z]) on floor f:
 *  devices by their centre, walls with both ends, rooms, blocks and floor openings with all corners, stairs by their start. pick(kind, d)
 *  can leave things out (the power editor shows only power devices) */
export function boxItems(f, a, b, pick = () => true) {
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), z0 = Math.min(a[1], b[1]), z1 = Math.max(a[1], b[1]);
  const inside = ([x, z]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
  const out = [], take = (kind, list, test) => (list || []).forEach((v) => { if (test(v) && pick(kind, v)) out.push({ kind, id: v.id }); });
  take('device', f.devices, (d) => inside([d.x, d.z]));
  take('wall', f.walls, (w) => inside(w.a) && inside(w.b));
  take('stair', f.stairs, (q) => inside([q.x, q.z]));
  for (const [kind, list] of [['room', f.rooms], ['block', f.blocks], ['hole', f.holes]]) take(kind, list, (r) => r.points?.length && r.points.every(inside));
  return out;
}
/** add `items` to the selection (the frame never takes things out); like toggleMulti, the last one is shown */
export function addMulti(list, current, items) {
  const start = list.length ? list : current ? [current] : [];
  const next = [...start, ...items.filter((x, i) => !start.some((y) => same(x, y)) && items.findIndex((y) => same(x, y)) === i).map((x) => ({ kind: x.kind, id: x.id }))];
  return { list: next.length > 1 ? next : [], selection: next[next.length - 1] || null };
}

/** ctx: $, t, scene, registry, openingMesh(id), selection(), setSelection(sel), deleteItem(sel, batch), snapshot(), changed(), setStatus(txt) */
export function initMultiSelect(ctx) {
  const { $, t } = ctx;
  let list = [], helpers = [];
  const has = (kind, id) => list.some((x) => x.kind === kind && x.id === id);
  function outline() {
    helpers.forEach((h) => { ctx.scene.remove(h); h.geometry?.dispose(); });
    helpers = list.map((x) => (x.kind === 'opening' ? ctx.openingMesh(x.id) : ctx.registry.get(x.id))).filter(Boolean).map((o) => {
      const h = new THREE.BoxHelper(o, 0x7dff9a); ctx.scene.add(h); return h;
    });
  }
  function toggle(item) {
    const r = toggleMulti(list, ctx.selection(), item);
    list = r.list;
    ctx.setSelection(r.selection);
    if (list.length) ctx.setStatus(t('multi.count', { n: list.length }));
  }
  /** the things inside a frame drawn in the plan (#247) join the selection */
  function addAll(items) {
    if (!items.length) return;
    const r = addMulti(list, ctx.selection(), items);
    list = r.list;
    ctx.setSelection(r.selection);
    if (list.length) ctx.setStatus(t('multi.count', { n: list.length }));
  }
  function clear() { if (!list.length) return; list = []; outline(); }
  /** delete everything that is selected in one undo step; false when nothing is */
  function deleteAll() {
    const items = deleteOrder(list, ctx.selection());
    if (!items.length) return false;
    ctx.snapshot();
    items.forEach((x) => ctx.deleteItem(x, true));
    list = []; ctx.setSelection(null); ctx.changed();
    if (items.length > 1) ctx.setStatus(t('multi.deleted', { n: items.length }));
    return true;
  }
  /** the box at the top of the properties panel while several things are selected */
  function box() {
    if (list.length < 2) return null;
    const d = document.createElement('div'); d.className = 'multiBox'; d.id = 'multiBox';
    const p = document.createElement('p'); p.textContent = t('multi.count', { n: list.length });
    const b = document.createElement('button'); b.type = 'button'; b.className = 'danger'; b.id = 'multiDelete'; b.textContent = t('multi.delete', { n: list.length });
    b.addEventListener('click', () => deleteAll());
    const c = document.createElement('button'); c.type = 'button'; c.textContent = t('multi.clear');
    c.addEventListener('click', () => { clear(); ctx.setSelection(null); });
    d.append(p, b, c);
    return d;
  }
  return { toggle, addAll, clear, deleteAll, box, outline, has, items: () => list };
}
