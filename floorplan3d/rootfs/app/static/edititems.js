/* Editing the things of a floor with the keyboard (step 20 of the split, part 1, #137): delete, move with the arrow keys (walls take the
 * corners joined to them along), turn with Q / E, and the shortcut keys. Which key does what and the list changes are pure (unit test:
 * tests/edititems.test.mjs); initEditItems applies them to the open floor and listens to the keyboard. */
import { clampOpeningPos, openingOverlaps } from './walls.js';

const LISTS = { wall: 'walls', room: 'rooms', device: 'devices', stair: 'stairs', block: 'blocks', hole: 'holes' };
const TOOL_KEYS = { v: 'select', w: 'wall', b: 'block', t: 'stairs', r: 'room', o: 'opening', d: 'device' };
const DRAFT_TOOLS = new Set(['room', 'block', 'plot', 'hole', 'stairs']);   // tools whose outline Enter closes

/** the door / window `id` on floor f: { wall, opening } or null */
export function openingIn(f, id) {
  for (const wall of f?.walls || []) { const opening = (wall.openings || []).find((o) => o.id === id); if (opening) return { wall, opening }; }
  return null;
}
/** the plan object behind a selection (wall, room, opening, device, stair, block, floor opening) on floor f, null if there is none */
export function itemIn(f, kind, id) {
  if (!f) return null;
  if (kind === 'opening') return openingIn(f, id)?.opening || null;
  return (f[LISTS[kind]] || []).find((q) => q.id === id) || null;
}
/** take a thing off floor f (a door / window off its wall); the lists are replaced, not changed in place */
export function removeFrom(f, kind, id) {
  if (kind === 'opening') {
    const found = openingIn(f, id);
    if (found) found.wall.openings = found.wall.openings.filter((x) => x.id !== id);
    return;
  }
  const key = LISTS[kind];
  if (key) f[key] = (f[key] || []).filter((x) => x.id !== id);
}
/** the corner points that move with wall w: its ends and every wall, room or block corner lying on them (within 2 cm) */
export function jointPoints(f, w) {
  const all = [...f.walls.flatMap((v) => [v.a, v.b]), ...f.rooms.flatMap((r) => r.points), ...(f.blocks || []).flatMap((r) => r.points)];
  const near = (p) => all.filter((q) => Math.abs(q[0] - p[0]) < 0.02 && Math.abs(q[1] - p[1]) < 0.02);
  return [...new Set([...near(w.a), ...near(w.b)])];
}
/** Q / E: turn by 15° left / right, kept within 0..359 */
export const turned = (rot, key) => ((rot || 0) + (key === 'q' ? -15 : 15) + 360) % 360;

/** what a key does: { do: 'undo' | 'delete' | 'turn' | 'floor' | 'nudge' | 'tool', ... } or null. k: the key in lower case, mods: { ctrl, alt,
 *  shift } (ctrl = Ctrl or Cmd), s: { live, selKind (kind of the selection or null), grid, floorIdx, floors } */
export function keyCommand(k, mods, s) {
  if (s.live) return null;
  if (mods.ctrl && k === 'z') return { do: 'undo' };
  if (k === 'delete' || k === 'backspace') return { do: 'delete' };
  if ((k === 'q' || k === 'e') && (s.selKind === 'stair' || s.selKind === 'device')) return { do: 'turn', key: k };
  if ((k === 'arrowup' || k === 'arrowdown') && !s.selKind && !mods.ctrl && !mods.alt && !mods.shift) {   // nothing selected: up / down change the floor
    const i = s.floorIdx + (k === 'arrowup' ? 1 : -1);
    return i >= 0 && i < s.floors ? { do: 'floor', to: i } : null;
  }
  if (k.startsWith('arrow') && s.selKind && !mods.ctrl) {
    const step = mods.alt ? 0.01 : mods.shift ? 0.1 : s.grid;               // Alt 1 cm, Shift 10 cm, otherwise one grid step
    return { do: 'nudge', dx: k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0, dz: k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0 };
  }
  if (TOOL_KEYS[k]) return { do: 'tool', tool: TOOL_KEYS[k] };
  return null;
}

/** ctx: t, floor(), floorIdx(), floors() (how many), settings(), selection(), setSelection(sel), isLive(), tool(), snapshot(), changed(),
 *  setStatus(txt), undo(), moveDeviceTo(d, x, z), power ({ deleteCable(id), dropCablesTo(id) }), multi ({ items(), deleteAll() }),
 *  switchFloor(i), setTool(name), escape() (stop drawing, close popups ...), finishDraft() (true when Enter closed an outline) */
export function initEditItems(ctx) {
  /** delete one thing; batch: several in a row (#211), the caller rebuilds once */
  function deleteItem({ kind, id }, batch = false) {
    if (kind === 'cable') {
      if (ctx.power.deleteCable(id)) { if (ctx.selection()?.id === id) ctx.setSelection(null); ctx.changed(); }
      return;
    }
    const f = ctx.floor();
    if (itemIn(f, kind, id)?.locked) { ctx.setStatus(ctx.t('prop.lockedHint')); return; }
    removeFrom(f, kind, id);
    if (kind === 'device') ctx.power.dropCablesTo(id);
    if (ctx.selection()?.id === id) ctx.setSelection(null);
    if (!batch) ctx.changed();
  }
  /** Arrow keys: move the selected thing by (dx, dz) metres. Openings slide along their wall (left/up = towards a, right/down = towards b). */
  function nudgeSelection(dx, dz) {
    if (!dx && !dz) return;
    const f = ctx.floor(), sel = ctx.selection();
    if (sel.kind === 'opening') {
      const found = openingIn(f, sel.id);
      if (!found || found.opening.locked) return;
      const o = found.opening;
      const p = clampOpeningPos(found.wall, o.width, o.pos + (dx || dz));
      if (p === null || p === o.pos || openingOverlaps(found.wall, p, o.width, o.id)) return;
      ctx.snapshot(); o.pos = +p.toFixed(4); ctx.changed(); return;
    }
    const item = itemIn(f, sel.kind, sel.id);
    if (item?.locked) return;
    if (sel.kind === 'device') {
      if (item) { ctx.snapshot(); ctx.moveDeviceTo(item, item.x + dx, item.z + dz); ctx.changed(); }
      return;
    }
    if (sel.kind === 'stair') {
      if (item) { ctx.snapshot(); item.x = +(item.x + dx).toFixed(4); item.z = +(item.z + dz).toFixed(4); ctx.changed(); }
      return;
    }
    // like dragging in the 2D editor: walls joined at the corners stretch along
    const pts = sel.kind === 'wall' ? (item ? jointPoints(f, item) : null) : ['room', 'block', 'hole'].includes(sel.kind) ? item?.points || null : null;
    if (pts?.length) { ctx.snapshot(); pts.forEach((q) => { q[0] = +(q[0] + dx).toFixed(4); q[1] = +(q[1] + dz).toFixed(4); }); ctx.changed(); }
  }
  window.addEventListener('keydown', (e) => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && e.key !== 'Escape') return;
    const k = e.key.toLowerCase();
    if (k === 'enter' && DRAFT_TOOLS.has(ctx.tool()) && ctx.finishDraft()) return;
    if (k === 'escape') { ctx.escape(); return; }
    const sel = ctx.selection();
    const c = keyCommand(k, { ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, shift: e.shiftKey },
      { live: ctx.isLive(), selKind: sel?.kind || null, grid: ctx.settings().grid, floorIdx: ctx.floorIdx(), floors: ctx.floors() });
    if (!c) return;
    if (c.do === 'undo') { e.preventDefault(); ctx.undo(); }
    else if (c.do === 'delete') { if (ctx.multi.items().length) ctx.multi.deleteAll(); else if (sel) { ctx.snapshot(); deleteItem(sel); } }
    else if (c.do === 'turn') {
      const item = itemIn(ctx.floor(), sel.kind, sel.id);
      if (item) { ctx.snapshot(); item.rot = turned(item.rot, c.key); ctx.changed(); }
    } else if (c.do === 'floor') { e.preventDefault(); ctx.switchFloor(c.to); }
    else if (c.do === 'nudge') { e.preventDefault(); nudgeSelection(c.dx, c.dz); }
    else if (c.do === 'tool') ctx.setTool(c.tool);
  });
  return { deleteItem, nudgeSelection, itemOf: (kind, id) => itemIn(ctx.floor(), kind, id) };
}
