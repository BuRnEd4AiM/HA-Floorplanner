/* The page ▶ Abläufe of the tab bar (#483): big buttons for scenes, scripts and buttons of Home Assistant (an admin picks them in ⚙ →
 * "Reiter unten", none picked: every scene and script), and the two checks "Ich gehe" and "Gute Nacht": before they start they show what
 * is still open or on (windows and doors, lights, a TV or speaker playing, an unlocked lock) with "Alles aus" (lights and players off,
 * then the routine linked to the check) and "Trotzdem" (only the linked routine). Automations can be switched on and off (not edited).
 * Pure (unit test: tests/routines.test.mjs); pageroutines.js draws. */

/** what starts a routine, by domain (the services controls.py lets through) */
export const START = { scene: 'turn_on', script: 'turn_on', button: 'press', input_button: 'press' };
export const MAX_ROUTINES = 24;
/** the routines shown when none are picked: at most this many scenes and scripts */
export const MAX_ALL = 40;
export const CHECKS = ['leave', 'night'];
const ID = /^[a-z_]+\.[a-z0-9_]+$/;
const domainOf = (id) => String(id).split('.')[0];

/** can this entity be a routine's button: a scene, a script or a button */
export const canRoutine = (id) => typeof id === 'string' && id.length <= 255 && ID.test(id) && !!START[domainOf(id)];
/** the stored list made safe: each once, at most MAX_ROUTINES (the same rules as clean_routines in server.py) */
export function cleanRoutines(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter(canRoutine))].slice(0, MAX_ROUTINES);
}
/** the routine linked to a check: an entity that can be one, else '' */
export const cleanRoutine = (id) => (canRoutine(id) ? id : '');

const ICONS = [
  [/nacht|night|schlaf|sleep|bett|bed/i, '🌙'], [/morgen|morning|aufsteh|wake|guten tag/i, '☀️'], [/film|kino|movie|cinema|tv|fernseh/i, '🎬'],
  [/gem[üu]tlich|cozy|cosy|relax|entspann|abend|evening/i, '🛋️'], [/urlaub|vacation|holiday|ferien/i, '🏖️'],
  [/licht.*aus|lichter aus|lights? off|alles aus|all off/i, '💡'], [/gehe|leave|away|abwesend|weg|tsch[üu]ss|bye/i, '🚪'],
  [/ankunft|arrive|zuhause|zu hause|home|ich bin da|welcome|willkommen/i, '🏠'], [/musik|music|radio|party/i, '🎵'],
  [/essen|dinner|lunch|kochen|cook/i, '🍽️'], [/lesen|read/i, '📖'], [/arbeit|work|b[üu]ro|office|konzentr|focus/i, '💻'],
  [/rollo|rollladen|jalousie|shutter|blind|cover/i, '🪟'], [/heiz|heat|warm/i, '🔥'], [/k[üu]hl|cool|klima/i, '❄️'], [/garten|garden|bew[äa]sser|water/i, '🌱'],
];
/** an icon for a routine's button by its name (Filmabend 🎬, Gute Nacht 🌙 ...), else by its kind */
export function routineIcon(name, entity = '') {
  const hit = ICONS.find(([re]) => re.test(name || ''));
  if (hit) return hit[1];
  return { scene: '🎨', script: '▶️', button: '🔘', input_button: '🔘' }[domainOf(entity)] || '▶️';
}

/** the buttons of the page: [{ entity, name, icon, running (a script that runs now) }]. chosen: the routines picked in ⚙ (those Home
 *  Assistant knows, in their order); none picked: every scene and script by name (at most MAX_ALL) but those linked to the two checks
 *  (skip: they start from there). names: { entity: name } */
export function routineButtons(states, names = {}, chosen = [], skip = []) {
  const st = states || {}, picked = cleanRoutines(chosen).filter((e) => st[e]);
  const ids = picked.length ? picked : Object.keys(st).filter((e) => (e.startsWith('scene.') || e.startsWith('script.')) && !skip.includes(e))
    .sort((a, b) => (names[a] || a).localeCompare(names[b] || b)).slice(0, MAX_ALL);
  return ids.map((entity) => ({ entity, name: names[entity] || entity.split('.')[1].replace(/_/g, ' '), icon: routineIcon(names[entity] || entity, entity),
    running: entity.startsWith('script.') && st[entity]?.state === 'on' }));
}

const PLAYING = new Set(['playing', 'on', 'buffering']);
/** the TVs and speakers that play (or are on): [{ entity, name }] */
export const playingMedia = (states, names = {}) => Object.entries(states || {}).filter(([e, s]) => e.startsWith('media_player.') && PLAYING.has(s?.state))
  .map(([entity]) => ({ entity, name: names[entity] || entity })).sort((a, b) => a.name.localeCompare(b.name));
/** the locks that are not locked: [{ entity, name }] */
export const openLocks = (states, names = {}) => Object.entries(states || {}).filter(([e, s]) => e.startsWith('lock.') && ['unlocked', 'open', 'opening'].includes(s?.state))
  .map(([entity]) => ({ entity, name: names[entity] || entity })).sort((a, b) => a.name.localeCompare(b.name));

/** what a check shows before it starts, only rows with something to say: [{ key: 'open' | 'lights' | 'media' | 'locks', n, names, fix
 *  (Alles aus switches it off) }]. open: names of the open windows and doors, lights: the lights on, media / locks: [{ entity, name }] */
export function checkRows({ open = [], lights = [], media = [], locks = [] } = {}) {
  const rows = [];
  if (open.length) rows.push({ key: 'open', n: open.length, names: open.slice(0, 4), fix: false });
  if (lights.length) rows.push({ key: 'lights', n: lights.length, names: [], fix: true });
  if (media.length) rows.push({ key: 'media', n: media.length, names: media.slice(0, 3).map((m) => m.name), fix: true });
  if (locks.length) rows.push({ key: 'locks', n: locks.length, names: locks.slice(0, 3).map((m) => m.name), fix: false });
  return rows;
}
/** the buttons of the check's window: 'back' | 'ok' | 'allOff' (lights and players off, then the linked routine) | 'anyway' (only the
 *  linked routine) | 'start' (nothing open or on: the linked routine) */
export function checkButtons(rows, linked) {
  if (!rows.length) return linked ? ['back', 'start'] : ['ok'];
  const out = ['back'];
  if (rows.some((r) => r.fix)) out.push('allOff');
  if (linked) out.push('anyway');
  return out.length > 1 ? out : ['ok'];
}
/** the calls of "Alles aus": every light that is on and every player that plays off, [[entity, service]] */
export const offCalls = (lights = [], media = []) => [...lights.map((e) => [e, 'turn_off']), ...media.map((m) => [m.entity, 'turn_off'])];

/** the automations of Home Assistant: [{ entity, name, on }] by name */
export const automations = (states, names = {}) => Object.entries(states || {}).filter(([e]) => e.startsWith('automation.'))
  .map(([entity, s]) => ({ entity, name: names[entity] || entity.slice(11).replace(/_/g, ' '), on: s?.state === 'on' })).sort((a, b) => a.name.localeCompare(b.name));

/** has the page anything: a scene, a script or a light (the two checks switch lights off) */
export const hasRoutines = (states) => Object.keys(states || {}).some((e) => /^(scene|script|light|button|input_button)\./.test(e));
