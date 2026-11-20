/* "🙈 Nicht überwachen" (#780): a device, a door / window or a whole floor that is only drawn (the flat upstairs that belongs to someone else,
 * a lamp that will never be smart) is left out of the watching: it is never "offline" or "no entity" (the 📴 pill, its list, the signs in 3D,
 * the device overview, the house check, the Today page all come from offline.js). Its own tick: d.noWatch / o.noWatch; the floor's: f.noWatch.
 * Pure (no three.js, no DOM; unit test: tests/nowatch.test.mjs). */
import { openingWalls } from './dormerwin.js';

/** is device / opening x on floor f left out of the watching: its own tick, or its floor's */
export const unwatched = (f, x = null) => !!(f?.noWatch || x?.noWatch);
/** the tick: on leaves x (device, opening or floor) out of the watching, off watches it again (nothing is stored then) */
export function setNoWatch(x, on) {
  if (!x) return x;
  if (on) x.noWatch = true; else delete x.noWatch;
  return x;
}
/** the device or door / window `id` of floor f (kind 'device' | 'opening'), null when there is none */
export function thingOf(f, kind, id) {
  if (!f) return null;
  if (kind === 'device') return (f.devices || []).find((d) => d.id === id) || null;
  if (kind === 'opening') {
    for (const w of openingWalls(f)) { const o = (w.openings || []).find((q) => q.id === id); if (o) return o; }
  }
  return null;
}
/** "🙈" in the list of offline devices: x = a row ({ floor, kind, id }) leaves that device / door / window out, { floor } alone the whole floor;
 *  layout: the whole plan (a building's view, buildings.js viewOf, keeps the floors' places but copies them: the tick goes onto the real one).
 *  true when something was left out */
export function leaveOut(layout, x) {
  const f = layout?.floors?.[x?.floor];
  if (!f) return false;
  const it = x.kind ? thingOf(f, x.kind, x.id) : f;
  if (!it) return false;
  setNoWatch(it, true);
  return true;
}
/** what is left out in layout: { floors: [names of floors left out], things: devices and doors / windows with their own tick (on floors
 *  that are watched) } — the line under the list of offline devices says it, so that nobody wonders where they went */
export function unwatchedSummary(layout) {
  const floors = [], out = { floors, things: 0 };
  (layout?.floors || []).forEach((f) => {
    if (f.noWatch) { floors.push(f.name || ''); return; }
    out.things += (f.devices || []).filter((d) => d.noWatch).length;
    openingWalls(f).forEach((w) => { out.things += (w.openings || []).filter((o) => o.noWatch).length; });
  });
  return out;
}
/** the floors (index, name, count) of the offline list (list: offlineDevices) that have more than one entry: for each a button that leaves the
 *  whole floor out at once (the flat upstairs, #780) */
export function floorsToLeaveOut(list, layout, min = 2) {
  const n = new Map();
  (list || []).forEach((x) => n.set(x.floor, (n.get(x.floor) || 0) + 1));
  return [...n].filter(([, c]) => c >= min).map(([fi, c]) => ({ floor: fi, name: layout?.floors?.[fi]?.name || '', n: c })).sort((a, b) => a.floor - b.floor);
}
