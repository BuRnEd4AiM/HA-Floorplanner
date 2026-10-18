/* The add-on's own holiday alarm ("Urlaubs-Alarm", #456), the rules of the screens: which sensors and sirens can be picked (grouped, with
 * where they are in the plan), which chosen sensors are open now, what the lock screen says, the keypad. Pure, no DOM (unit test:
 * tests/guard.test.mjs); guardui.js draws it. The alarm itself runs in the add-on (guard.py), also with no screen open. */
import { pointInPoly } from './rooms.js';
import { openingEntities } from './openings.js';

/** the groups of sensors and what puts a binary sensor in them (its device class) */
export const SENSOR_GROUPS = [['door', ['door', 'garage_door', 'opening']], ['window', ['window']], ['motion', ['motion', 'occupancy', 'presence', 'moving', 'vibration']]];
/** the groups of what can be switched on at an alarm */
export const ACTION_GROUPS = [['siren', ['siren']], ['light', ['light']], ['switch', ['switch', 'input_boolean']], ['script', ['script', 'scene']]];
const OPEN = new Set(['on', 'open']);
const OFFLINE = new Set(['unavailable', 'unknown']);

/** 'open' | 'closed' | 'offline' of a sensor state */
export const stateWord = (s) => (OPEN.has(s) ? 'open' : OFFLINE.has(s) ? 'offline' : 'closed');

/** where an entity is in the plan: { floor, room, kind } (kind: 'door' / 'window' when it is the contact of an opening), null when not placed */
export function placeOf(layout, eid) {
  for (const f of layout?.floors || []) {
    const roomAt = (x, z) => (f.rooms || []).find((r) => r.name && (r.points || []).length >= 3 && pointInPoly(x, z, r.points))?.name || '';
    const d = (f.devices || []).find((q) => q.entity === eid);
    if (d) return { floor: f.name || '', room: roomAt(d.x, d.z), kind: null };
    for (const w of f.walls || []) {
      const o = (w.openings || []).find((q) => openingEntities(q).includes(eid));
      if (!o || !w.a || !w.b) continue;
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1, ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
      const x = w.a[0] + ux * (o.pos || 0), z = w.a[1] + uz * (o.pos || 0);
      return { floor: f.name || '', room: roomAt(x - uz * 0.3, z + ux * 0.3) || roomAt(x + uz * 0.3, z - ux * 0.3), kind: o.type === 'window' ? 'window' : 'door' };
    }
  }
  return null;
}

/** the sensors that can set it off, grouped: [{ group, items: [{ entity, name, where, state }] }]; a binary sensor counts by its device
 *  class, or because it is the contact of a door / window in the plan; chosen ones that Home Assistant no longer has are kept */
export function sensorChoices(entities, layout, chosen = []) {
  const groups = new Map(SENSOR_GROUPS.map(([g]) => [g, []]));
  const seen = new Set();
  const add = (g, e, name, state) => {
    if (seen.has(e)) return;
    seen.add(e);
    const p = placeOf(layout, e);
    groups.get(g).push({ entity: e, name: name || e, where: p ? [p.floor, p.room].filter(Boolean).join(' · ') : '', state: stateWord(state) });
  };
  for (const e of entities || []) {
    if (!String(e.entity_id).startsWith('binary_sensor.')) continue;
    const byClass = SENSOR_GROUPS.find(([, dcs]) => dcs.includes(e.dc))?.[0];
    const byPlan = placeOf(layout, e.entity_id)?.kind;
    if (byClass || byPlan) add(byClass || byPlan, e.entity_id, e.name, e.state);
  }
  const order = (a, b) => (!a.where - !b.where) || a.where.localeCompare(b.where) || a.name.localeCompare(b.name);   // placed ones first
  groups.forEach((items) => items.sort(order));
  chosen.filter((e) => !seen.has(e)).forEach((e) => add('door', e, e, 'unavailable'));                         // lost ones at the end
  return [...groups].filter(([, items]) => items.length).map(([group, items]) => ({ group, items }));
}

/** what can be switched on at an alarm, grouped: [{ group, items: [{ entity, name }] }] */
export function actionChoices(entities, chosen = []) {
  const out = ACTION_GROUPS.map(([group, doms]) => ({
    group,
    items: (entities || []).filter((e) => doms.includes(String(e.entity_id).split('.')[0])).map((e) => ({ entity: e.entity_id, name: e.name || e.entity_id })),
  }));
  chosen.filter((e) => !out.some((g) => g.items.some((i) => i.entity === e))).forEach((e) => out[0].items.push({ entity: e, name: e }));
  out.forEach((g) => g.items.sort((a, b) => a.name.localeCompare(b.name)));
  return out.filter((g) => g.items.length);
}

/** the chosen sensors that are open or offline now: [{ entity, name, state }] (said before arming) */
export function openNow(sensors, entities) {
  const by = new Map((entities || []).map((e) => [e.entity_id, e]));
  return (sensors || []).map((s) => ({ entity: s, name: by.get(s)?.name || s, state: stateWord(by.get(s)?.state ?? 'unavailable') }))
    .filter((s) => s.state !== 'closed');
}

/** seconds left now, counted on from when the add-on said it */
export const leftNow = (view, fetchedAt, now) => Math.max(0, Math.round((view?.left || 0) - (now - fetchedAt) / 1000));

/** what the lock screen shows: { show, tone, key, left, what } for a view of the add-on; show = false while off */
export function screenOf(view, left) {
  const p = view?.phase || 'off';
  if (p === 'off') return { show: false, tone: 'off', key: 'gd.off', left: 0, what: null };
  if (p === 'arming') return { show: true, tone: 'arming', key: 'gd.arming', left, what: null };
  if (p === 'armed') return { show: true, tone: 'armed', key: 'gd.armed', left: 0, what: null };
  if (p === 'entry') return { show: true, tone: 'entry', key: 'gd.entry', left, what: view.what };
  return { show: true, tone: 'alarm', key: view.what?.why === 'offline' ? 'gd.alarmOffline' : 'gd.alarm', left: 0, what: view.what };
}

/** the code after a key of the keypad: a digit (at most 8), '⌫' takes the last one away, 'C' clears */
export function pressKey(code, key) {
  if (key === '⌫') return code.slice(0, -1);
  if (key === 'C') return '';
  return /^[0-9]$/.test(key) && code.length < 8 ? code + key : code;
}
