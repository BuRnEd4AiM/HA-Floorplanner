/* 🔔 The doorbell (owner's choice 2026-10-25, picture docs/ideen-4.3/6-klingel.jpg): when somebody rings, every screen in the live mode shows
 * the camera at the door, with "Tür öffnen" and "Schließen". Which entities ring, which camera and which door opener belong to them, and when
 * a change of state is a ring. Pure rules (unit test: tests/doorbell.test.mjs); doorbellui.js shows the window. */

export const MAX_BELLS = 4;
export const RING_MS = 2 * 60 * 1000;              // the window closes by itself after 2 minutes (a new ring starts them again)
export const CONFIRM_MS = 4000;                    // "Tür öffnen" asks once more ("Sicher? Öffnen") for 4 seconds
const ID = /^[a-z_]+\.[a-z0-9_]+$/;
const BELL_DOMAINS = new Set(['event', 'binary_sensor']);
const OPEN_DOMAINS = new Set(['lock', 'button', 'input_button', 'switch', 'script']);
const BELL_WORDS = /klingel|doorbell|door_bell|tuerklingel|türklingel|sonnette|timbre|campanello|deurbel|dzwonek/i;
const DEAD = new Set(['unavailable', 'unknown', '', undefined, null]);

/** the doorbells an admin chose in ⚙ ([{ entity, camera, open, name }], at most MAX_BELLS), every field checked; junk -> [] */
export function cleanBells(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach((b) => {
    if (!b || typeof b !== 'object' || out.length >= MAX_BELLS) return;
    const entity = typeof b.entity === 'string' && ID.test(b.entity) && BELL_DOMAINS.has(b.entity.split('.')[0]) ? b.entity : '';
    if (!entity || out.some((x) => x.entity === entity)) return;
    const camera = typeof b.camera === 'string' && /^camera\.[a-z0-9_]+$/.test(b.camera) ? b.camera : '';
    const open = typeof b.open === 'string' && ID.test(b.open) && OPEN_DOMAINS.has(b.open.split('.')[0]) ? b.open : '';
    out.push({ entity, camera, open, name: typeof b.name === 'string' ? b.name.trim().slice(0, 40) : '' });
  });
  return out;
}

/** is this entity (a state of the add-on: { entity_id, name, dc }) a doorbell by itself: an event of the class "doorbell", or a binary
 *  sensor named like one (Klingel, doorbell …) */
export function looksLikeBell(e) {
  const id = e?.entity_id || '', dom = id.split('.')[0];
  if (dom === 'event') return e.dc === 'doorbell' || BELL_WORDS.test(id) || BELL_WORDS.test(e.name || '');
  if (dom === 'binary_sensor') return BELL_WORDS.test(id) || BELL_WORDS.test(e.name || '');
  return false;
}

/** the words of an entity id without its domain and the usual endings: "event.haustuer_ding" -> ["haustuer"] */
const words = (id) => String(id || '').split('.').pop().split('_').filter((w) => w && !/^(ding|ring|klingel|doorbell|bell|press|event|button|camera|kamera|cam|lock|schloss|door|tuer|tür|open|oeffner|opener|summer)$/.test(w));

/** the camera of a bell: the one chosen, else the camera whose id shares a word with the bell's ("event.haustuer_ding" -> camera.haustuer),
 *  else the only camera there is; '' when none fits */
export function bellCamera(bell, cameras) {
  if (bell?.camera) return bell.camera;
  const ids = (cameras || []).filter((c) => /^camera\./.test(c));
  const mine = new Set(words(bell?.entity));
  const hit = ids.find((c) => words(c).some((w) => mine.has(w)));
  return hit || (ids.length === 1 ? ids[0] : '');
}

/** the bells to watch: those chosen in ⚙, else every entity that looks like a bell (at most MAX_BELLS), each with its camera */
export function findBells(entities, chosen) {
  const list = entities || [], cams = list.map((e) => e.entity_id).filter((id) => id?.startsWith('camera.'));
  const named = new Map(list.map((e) => [e.entity_id, e.name]));
  const bells = cleanBells(chosen).length ? cleanBells(chosen)
    : list.filter(looksLikeBell).slice(0, MAX_BELLS).map((e) => ({ entity: e.entity_id, camera: '', open: '', name: '' }));
  return bells.map((b) => ({ ...b, camera: bellCamera(b, cams), name: b.name || named.get(b.entity) || b.entity }));
}

/** did it ring between the state seen before (`was`, undefined: not seen yet) and the state now: an event got a new time stamp (one of
 *  the last 5 minutes: an old one comes back after a restart of Home Assistant), a binary sensor went from off to on. Never on the first
 *  sight and never from or to unavailable. clock: ms now */
export function isRing(entity, was, now, clock = Date.now()) {
  if (was === undefined || DEAD.has(now) || DEAD.has(was) || now === was) return false;
  if (entity.startsWith('event.')) { const at = Date.parse(now); return !Number.isFinite(at) || at > clock - 5 * 60000; }
  return was === 'off' && now === 'on';
}

/** the service that opens the door with entity `open`: [domain, service] or null */
export function openService(open) {
  const dom = String(open || '').split('.')[0];
  return { lock: ['lock', 'unlock'], button: ['button', 'press'], input_button: ['input_button', 'press'], switch: ['switch', 'turn_on'],
    script: ['script', 'turn_on'] }[dom] || null;
}
