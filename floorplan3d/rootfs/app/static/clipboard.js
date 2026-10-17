/* Copy, paste and duplicate (#405): Ctrl+C keeps a copy of what is selected (one thing or several together), Ctrl+V puts it onto the
 * open floor, Ctrl+D does both at once (the copy kept by Ctrl+C stays). On the floor it came from the copy lands a little to the side,
 * each further paste one step more; on another floor (or in another house) at the same place, e.g. the same lamp one storey higher.
 * Everything gets new ids, nothing of the copy is locked. A door or window copied without its wall goes into the same wall, at the next
 * free place beside it. The copy and paste rules are pure (no DOM, no three.js; unit test: tests/clipboard.test.mjs); initClipboard
 * keeps the copy and applies it to the open floor. */
import { clampOpeningPos, openingOverlaps } from './walls.js';

const LISTS = { device: 'devices', wall: 'walls', room: 'rooms', block: 'blocks', stair: 'stairs', hole: 'holes' };
/** metres a copy lands to the right and down (in the plan) of the one before, on the same floor */
export const PASTE_STEP = 0.5;
const r4 = (v) => +v.toFixed(4);

/** the copy of `items` ([{ kind, id }]) on floor f: { floor: id of f, things: [{ kind, obj }], openings: [{ wall: its id, obj }],
 *  times: {} (how often it was pasted on each floor) }, null when nothing of it can be copied. Cables, roofs and the like are left out;
 *  a door or window selected together with its wall goes with the wall only */
export function copyOf(f, items) {
  if (!f) return null;
  const things = [], openings = [], walls = new Set(items.filter((x) => x.kind === 'wall').map((x) => x.id)), seen = new Set();
  for (const it of items) {
    if (seen.has(`${it.kind}:${it.id}`)) continue;
    seen.add(`${it.kind}:${it.id}`);
    if (it.kind === 'opening') {
      const w = (f.walls || []).find((v) => (v.openings || []).some((o) => o.id === it.id));
      if (w && !walls.has(w.id)) openings.push({ wall: w.id, obj: structuredClone(w.openings.find((o) => o.id === it.id)) });
      continue;
    }
    const obj = LISTS[it.kind] && (f[LISTS[it.kind]] || []).find((v) => v.id === it.id);
    if (obj) things.push({ kind: it.kind, obj: structuredClone(obj) });
  }
  return things.length || openings.length ? { floor: f.id, things, openings, times: {} } : null;
}
/** how many things a copy holds */
export const copyCount = (clip) => (clip ? clip.things.length + clip.openings.length : 0);
/** thing `o` of kind `kind` moved by (dx, dz) */
export function shifted(kind, o, dx, dz) {
  if (kind === 'device' || kind === 'stair') { o.x = r4((o.x || 0) + dx); o.z = r4((o.z || 0) + dz); }
  else if (kind === 'wall') { o.a = [r4(o.a[0] + dx), r4(o.a[1] + dz)]; o.b = [r4(o.b[0] + dx), r4(o.b[1] + dz)]; }
  else if (Array.isArray(o.points)) o.points = o.points.map(([x, z]) => [r4(x + dx), r4(z + dz)]);
  return o;
}
/** where a copy of door / window o fits into wall w: the first free place one width (+ 10 cm) beside position `from`, then two widths
 *  and so on, to the right first, then to the left; null when there is none */
export function freeSpot(w, o, from) {
  const step = o.width + 0.1;
  for (let k = 1; k <= 40; k++) {
    for (const dir of [1, -1]) {
      const want = from + dir * k * step, pos = clampOpeningPos(w, o.width, want);
      if (pos !== null && Math.abs(pos - want) < 1e-6 && !openingOverlaps(w, pos, o.width)) return r4(pos);
    }
  }
  return null;
}
/** put copy `clip` onto floor f (changes f and clip.times); uid() gives new ids. Returns { items: the new things [{ kind, id }],
 *  skipped: doors / windows that found no wall or no room in it } */
export function pasteInto(f, clip, uid) {
  const n = clip.times[f.id] ?? (clip.floor === f.id ? 1 : 0), d = n * PASTE_STEP;
  clip.times[f.id] = n + 1;
  const ids = new Map(clip.things.map((x) => [x.obj.id, uid()])), items = [];
  for (const { kind, obj } of clip.things) {
    const o = shifted(kind, structuredClone(obj), d, d);
    o.id = ids.get(obj.id);
    delete o.locked;
    if (kind === 'wall') o.openings = (o.openings || []).map((op) => ({ ...op, id: uid() }));
    if (kind === 'device' && ids.has(o.room)) o.room = ids.get(o.room);   // an LED ring copied with its room follows the copied room
    f[LISTS[kind]] = [...(f[LISTS[kind]] || []), o];
    items.push({ kind, id: o.id });
  }
  let skipped = 0;
  for (const c of clip.openings) {
    const w = (f.walls || []).find((v) => v.id === c.wall);
    const pos = w ? freeSpot(w, c.obj, c.obj.pos) : null;
    if (pos === null) { skipped++; continue; }
    const o = { ...structuredClone(c.obj), id: uid(), pos };
    delete o.locked;
    w.openings = [...(w.openings || []), o];
    items.push({ kind: 'opening', id: o.id });
  }
  return { items, skipped };
}
/** something of copy `clip` would land on floor f (not only doors / windows without their wall or without room in it) */
export const pastable = (f, clip) => clip.things.length > 0
  || clip.openings.some((c) => { const w = (f.walls || []).find((v) => v.id === c.wall); return !!w && freeSpot(w, c.obj, c.obj.pos) !== null; });

/** ctx: t, floor(), items() (what is selected: the list of several, or the one thing), select(items) (exactly these become the selection),
 *  snapshot(), changed(), setStatus(txt), uid() */
export function initClipboard(ctx) {
  let clip = null;
  const t = ctx.t;
  /** Ctrl+C: false when nothing that can be copied is selected */
  function copy() {
    const c = copyOf(ctx.floor(), ctx.items());
    if (!c) { ctx.setStatus(t('clip.nothing')); return false; }
    clip = c;
    ctx.setStatus(t('clip.copied', { n: copyCount(c) }));
    return true;
  }
  function put(c) {
    const f = ctx.floor();
    if (!f) return false;
    if (!pastable(f, c)) { ctx.setStatus(t('clip.noRoom', { n: 0, k: c.openings.length })); return true; }
    ctx.snapshot();
    const { items, skipped } = pasteInto(f, c, ctx.uid);
    if (items.length) { ctx.changed(); ctx.select(items); }
    ctx.setStatus(skipped ? t('clip.noRoom', { n: items.length, k: skipped }) : t('clip.pasted', { n: items.length }));
    return true;
  }
  /** Ctrl+V: false when nothing was copied yet */
  const paste = () => (clip ? put(clip) : false);
  /** Ctrl+D: a copy of the selection right beside it, the copy of Ctrl+C stays as it is */
  function duplicate() {
    const c = copyOf(ctx.floor(), ctx.items());
    if (!c) { ctx.setStatus(t('clip.nothing')); return false; }
    return put(c);
  }
  return { copy, paste, duplicate, has: () => !!clip };
}
