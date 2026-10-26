/* 🗣 Switching by voice (#532): "Licht im Wohnzimmer aus", "Mach oben alle Lichter an", "Rollläden in der Küche runter", "Fernseher
 * aus". The voice search (voicequery.js) understands the place and the things; this says whether a sentence is an order rather than a
 * question, what to do, and which entities get which service. A question ("Ist das Licht aus?", "Welche Rollläden sind unten?") stays a
 * question. Pure rules (unit test: tests/voicecommand.test.mjs); voiceui.js switches and asks first when the whole house would change. */
import { fold, isWhat, stateOf, byName } from './voicequery.js';

export const CONFIRM_OVER = 1;                     // more than this many things in the whole house: "Sicher?" first (like "💡 n an")
/** per language: verbs of an order, the words of each action (folded), and the words that make a sentence a question */
const SAY = {
  de: { verb: ['mach', 'mache', 'schalte', 'schalt', 'dreh', 'drehe', 'fahr', 'fahre', 'stell', 'stelle', 'oeffne', 'offne', 'schliess', 'schliesse', 'lass', 'lasse'],
    on: ['an', 'ein', 'einschalten', 'anschalten', 'anmachen', 'einmachen'], off: ['aus', 'ausschalten', 'ausmachen', 'abschalten'],
    open: ['hoch', 'rauf', 'herauf', 'auf', 'oeffnen', 'offnen', 'aufmachen', 'hochfahren'], close: ['runter', 'herunter', 'hinunter', 'zu', 'schliessen', 'zumachen', 'runterfahren'],
    ask: ['ist', 'sind', 'welche', 'welcher', 'welches', 'wo', 'wie', 'was', 'gibt', 'brennt', 'brennen', 'lauft', 'laufen', 'hat', 'haben', 'wieviel', 'wieviele'] },
  en: { verb: ['turn', 'switch', 'put', 'open', 'close', 'shut', 'raise', 'lower', 'roll'],
    on: ['on'], off: ['off'], open: ['open', 'up', 'raise'], close: ['close', 'shut', 'down', 'lower'],
    ask: ['is', 'are', 'which', 'what', 'where', 'how', 'does', 'do', 'any', 'whats'] },
  fr: { verb: ['allume', 'eteins', 'ouvre', 'ferme', 'monte', 'baisse', 'mets'],
    on: ['allume', 'allumer'], off: ['eteins', 'eteindre'], open: ['ouvre', 'ouvrir', 'monte', 'monter'], close: ['ferme', 'fermer', 'baisse', 'baisser', 'descends'],
    ask: ['est', 'sont', 'quel', 'quelle', 'quels', 'quelles', 'ou', 'combien', 'y'] },
  es: { verb: ['enciende', 'apaga', 'abre', 'cierra', 'sube', 'baja', 'pon'],
    on: ['enciende', 'encender'], off: ['apaga', 'apagar'], open: ['abre', 'abrir', 'sube', 'subir'], close: ['cierra', 'cerrar', 'baja', 'bajar'],
    ask: ['esta', 'estan', 'cual', 'cuales', 'donde', 'hay', 'que', 'como'] },
  it: { verb: ['accendi', 'spegni', 'apri', 'chiudi', 'alza', 'abbassa'],
    on: ['accendi', 'accendere'], off: ['spegni', 'spegnere'], open: ['apri', 'aprire', 'alza', 'alzare'], close: ['chiudi', 'chiudere', 'abbassa', 'abbassare'],
    ask: ['e', 'sono', 'quale', 'quali', 'dove', 'ci', 'come', 'cosa'] },
  nl: { verb: ['zet', 'doe', 'maak', 'sluit', 'open', 'draai'],
    on: ['aan', 'inschakelen', 'aanzetten'], off: ['uit', 'uitschakelen', 'uitzetten'], open: ['open', 'omhoog', 'op', 'openen'], close: ['dicht', 'sluit', 'omlaag', 'neer', 'sluiten'],
    ask: ['is', 'zijn', 'welke', 'waar', 'hoe', 'wat', 'brandt', 'branden'] },
  pl: { verb: ['wlacz', 'wylacz', 'otworz', 'zamknij', 'podnies', 'opusc', 'zapal', 'zgas'],
    on: ['wlacz', 'zapal', 'wlaczyc'], off: ['wylacz', 'zgas', 'wylaczyc'], open: ['otworz', 'podnies', 'otworzyc'], close: ['zamknij', 'opusc', 'zamknac'],
    ask: ['czy', 'jest', 'sa', 'ktore', 'ktory', 'gdzie', 'jak', 'co'] },
};
/** what can be switched, and with which action */
const ACTS = { lights: ['on', 'off'], media: ['on', 'off'], covers: ['open', 'close'] };

/**
 * Is `text` an order, and which one? q: what understand() made of it (what, state, rooms, floor, all, rest). -> { act ('on' | 'off' |
 * 'open' | 'close'), what ('lights' | 'covers' | 'media') } or null for a question or anything that cannot be switched. An order has a
 * word of the action and starts with neither a question word nor ends with "?"; "Rollläden runter" opens nothing: covers know open and
 * close, lights and players on and off.
 */
export function command(text, q, lang = 'de') {
  const raw = String(text || '').trim(), S = SAY[lang] || SAY.de;
  if (!raw || /\?\s*$/.test(raw) || !q) return null;
  const ws = fold(raw).split(/[^a-z0-9]+/).filter(Boolean);
  if (!ws.length || S.ask.includes(ws[0])) return null;
  const what = q.what === 'windows' || q.what === 'devices' ? null : q.what;
  if (!ACTS[what]) return null;
  const has = (list) => ws.some((w) => list.includes(w));
  const verb = has(S.verb);
  let act = null;
  if (what === 'covers') act = has(S.close) ? 'close' : has(S.open) ? 'open' : q.state === 'closed' ? 'close' : q.state === 'open' ? 'open' : null;
  else act = has(S.off) ? 'off' : has(S.on) ? 'on' : null;
  if (!act) return null;
  if (!verb && ws.length > 8) return null;                // a long sentence without a verb of an order is something else
  return { act, what };
}

/** the service for an action on an entity: [entity, service] */
const SERVICE = { on: 'turn_on', off: 'turn_off', open: 'open_cover', close: 'close_cover' };

/**
 * The things an order switches: the things of the plan (flatRows) of that kind, in the place said (place: { floor, rooms }) or by their
 * name (q.rest), those not yet as wanted. -> { calls: [{ entity, service, item }], all (the whole house: no place and no name), n }.
 */
export function targets(cmd, q, items, states = {}, place = {}) {
  const rooms = new Set(place.rooms || []);
  let pool = (items || []).filter((it) => (place.floor == null || it.floor === place.floor) && (!rooms.size || rooms.has(it.room)) && isWhat(it, cmd.what));
  const named = byName(pool, q?.rest);
  if (named.length) pool = named;
  const want = { on: 'on', off: 'off', open: 'open', close: 'closed' }[cmd.act];
  const seen = new Set(), calls = [];
  pool.forEach((it) => {
    const entity = cmd.what === 'covers' ? it.shutter || it.entity : it.entity;
    if (!entity || seen.has(entity) || it.off || stateOf(it, states, cmd.what) === want) return;
    if (cmd.what === 'covers' && isWhat(it, 'gates')) return;       // "Rollläden runter" never closes the garage door
    seen.add(entity);
    calls.push({ entity, service: SERVICE[cmd.act], item: it });
  });
  return { calls, all: place.floor == null && !rooms.size && !named.length, n: calls.length };
}

/** ask "Sicher?" first: the whole house and more than CONFIRM_OVER things */
export const needsConfirm = (t) => !!t && t.all && t.n > CONFIRM_OVER;
