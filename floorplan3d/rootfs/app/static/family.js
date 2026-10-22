/* The page 👨‍👩‍👧 Familie of the tab bar (#483): every person of Home Assistant with a picture, where (at home, a zone, away), since when
 * and the battery of the phone; beside it the pinboard, notes for everybody stored in the add-on (pinboard.json, api/pinboard), also as a
 * card on ☀ Heute. Pure (unit test: tests/family.test.mjs); pagefamily.js and pinboardui.js draw, pages.py (server) finds the phone's
 * battery and keeps the notes. */

export const NOTE_COLORS = ['yellow', 'green', 'blue', 'pink'];
export const MAX_NOTE = 300;
/** a phone battery from which it shows red */
export const LOW_PHONE = 20;

/** where a person is by the state of person.*: { key: 'home' | 'zone' | 'away' | 'unknown', zone (its name for 'zone') } */
export function whereOf(state) {
  if (state === 'home') return { key: 'home', zone: '' };
  if (state === 'not_home') return { key: 'away', zone: '' };
  if (!state || state === 'unknown' || state === 'unavailable') return { key: 'unknown', zone: '' };
  return { key: 'zone', zone: state };
}

/**
 * The people of the page: [{ id, name, where, since (Date or null), picture (bool), battery (0..100 or null), charging, initial, presence
 * (presenceOf: home by the rule of ⚙, the room, what each source says, #495) }], at home first, then by name. people: what the add-on
 * found (api/family: { id, name, state, since, picture, battery, charging, sources }); states: the live states (a person who moved since
 * counts as moving now: since null until the add-on is asked again); names: { entity: name }; presence: settings.presence. A person that
 * only the live states know (api/family not answered yet) is there too.
 */
export function familyRows(people, states, names = {}, presence = {}) {
  const st = states || {}, byId = new Map((Array.isArray(people) ? people : []).filter((p) => p && typeof p.id === 'string').map((p) => [p.id, p]));
  Object.keys(st).filter((e) => e.startsWith('person.') && !byId.has(e)).forEach((e) => byId.set(e, { id: e }));
  return [...byId.values()].filter((p) => p.id.startsWith('person.') && (st[p.id] || p.state)).map((p) => {
    const state = st[p.id]?.state ?? p.state ?? '', name = names[p.id] || p.name || p.id.slice(7).replace(/_/g, ' ');
    const since = p.state === state && p.since && !Number.isNaN(+new Date(p.since)) ? new Date(p.since) : null;
    const bat = typeof p.battery === 'number' && Number.isFinite(p.battery) ? Math.max(0, Math.min(100, Math.round(p.battery))) : null;
    const sources = (Array.isArray(p.sources) ? p.sources : []).map((x) => ({ ...x, state: st[x.entity]?.state ?? x.state }));   // live where the states know it
    const pres = presenceOf(state, sources, presence);
    let where = whereOf(state);
    if (pres.home && where.key !== 'home') where = { key: 'home', zone: '' };              // the rule of ⚙ says home (Wi-Fi, room …)
    else if (!pres.home && where.key === 'home') where = { key: 'away', zone: '' };
    return { id: p.id, name, where, since, picture: !!p.picture, battery: bat, charging: p.charging === true, initial: (name.trim()[0] || '?').toUpperCase(), presence: pres };
  }).sort((a, b) => Number(b.where.key === 'home') - Number(a.where.key === 'home') || a.name.localeCompare(b.name));
}

/** a colour for a person's circle without a picture, the same for the same name (a hue 0..359) */
export function avatarHue(name) {
  let h = 0;
  for (const ch of String(name || '')) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** when, short: { key: 'time' (today: the time) | 'yesterday' (with the time) | 'day' (this week: the weekday) | 'date', date } for the
 *  texts "seit 11:02", "gestern 18:30", "Mo", "12.10." */
export function whenOf(d, now = new Date()) {
  if (!(d instanceof Date) || Number.isNaN(+d)) return null;
  if (sameDay(d, now)) return { key: 'time', date: d };
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(d, y)) return { key: 'yesterday', date: d };
  return { key: now - d < 6 * 86400000 && d < now ? 'day' : 'date', date: d };
}

/** the text of a new note made safe: control characters out, spaces at the ends off, at most MAX_NOTE characters ('' for nothing) */
export function cleanNote(text) {
  const s = String(text ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  return [...s].slice(0, MAX_NOTE).join('');
}
/** the colour of a note: one of NOTE_COLORS (the first for anything else) */
export const noteColor = (c) => (NOTE_COLORS.includes(c) ? c : NOTE_COLORS[0]);
/** the colour a new note gets: the next one after the newest note's colour, so notes in a row differ */
export const nextColor = (notes) => NOTE_COLORS[(NOTE_COLORS.indexOf(noteColor(notes?.[0]?.color)) + 1) % NOTE_COLORS.length];

/** the notes as the server keeps them (newest first), made safe for drawing: [{ id, text, by, at (Date), color }] */
export function pinNotes(list) {
  return (Array.isArray(list) ? list : []).filter((n) => n && typeof n.id === 'string' && typeof n.text === 'string' && n.text)
    .map((n) => ({ id: n.id, text: n.text, by: typeof n.by === 'string' ? n.by : '', at: new Date(n.at), color: noteColor(n.color) }))
    .filter((n) => !Number.isNaN(+n.at)).sort((a, b) => b.at - a.at);
}

/** has the page anything: a person in Home Assistant */
export const hasFamily = (states) => Object.keys(states || {}).some((e) => e.startsWith('person.'));

/* ---- who is really at home (#495, the owner: "ob jetzt wirklich eine Person im Haus ist oder nicht … mit dem Handy, dass es sich mit dem
 * WLAN verbindet"): the sources the add-on found for a person (pages.py person_sources) and the rule chosen in ⚙ ---- */

/** the rules: as Home Assistant's person says, at home when one source says so, when two do */
export const PRESENCE_RULES = ['ha', 'any', 'two'];
const AWAY = new Set(['not_home', 'away', 'unknown', 'unavailable', '']);

/**
 * What a source says: { kind, entity, home (true | false | null: says nothing), text (its state: a zone, the network, the room), since }.
 * ssids: the names of the home Wi-Fi (the phone's network counts only when it is one of them; none set: it only shows).
 */
export function sourceSays(src, ssids = []) {
  const state = String(src?.state ?? ''), s = state.toLowerCase();
  let home = null;
  if (['gps', 'wifi', 'bluetooth', 'other'].includes(src?.kind)) home = s === 'home' ? true : AWAY.has(s) ? (s === 'unknown' || s === 'unavailable' || !s ? null : false) : false;
  else if (src?.kind === 'ssid') home = !ssids.length || !state || s === 'unknown' || s === 'unavailable' ? null : ssids.includes(state);
  else if (src?.kind === 'room') home = AWAY.has(s) ? (s === 'not_home' || s === 'away' ? false : null) : true;
  const since = src?.since && !Number.isNaN(+new Date(src.since)) ? new Date(src.since) : null;
  return { kind: src?.kind || 'other', entity: src?.entity || '', home, text: state, since };
}

/**
 * Is a person at home: { home, sure (two or more sources agree), room (the room the phone is in, or ''), says: [sourceSays] }.
 * state: the person's state in Home Assistant; presence: settings.presence ({ rule, ssids }).
 */
export function presenceOf(state, sources, presence = {}) {
  const rule = PRESENCE_RULES.includes(presence?.rule) ? presence.rule : 'ha', ssids = Array.isArray(presence?.ssids) ? presence.ssids : [];
  const says = (Array.isArray(sources) ? sources : []).map((x) => sourceSays(x, ssids));
  const yes = says.filter((x) => x.home === true).length, known = says.filter((x) => x.home !== null).length;
  const room = says.find((x) => x.kind === 'room' && x.home)?.text || '';
  let home;
  if (rule === 'ha' || !known) home = state === 'home';
  else if (rule === 'any') home = yes >= 1;
  else home = yes >= Math.min(2, known);
  return { home, sure: yes >= 2, room, says };
}
