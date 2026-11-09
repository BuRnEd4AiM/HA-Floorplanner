/* ▶ Abläufe by room (the owner, 2026-10-29: "eine gruppierung nach räumen in HA das man das direkt sieht ein und aus klappen kann … wenn man
 * viele hat das das nicht so viel auf einmal ist"; pictures docs/ideen-4.43/; his choice: the big buttons, the own routines, the
 * automations and the scenes, each in every room it uses, all closed at first, what has no room open on top, both views to switch: the
 * lists by room, or one list of the rooms with everything of a room in it). Which areas of Home Assistant a thing belongs to, and the
 * groups. Pure, tested: tests/roomgroups.test.mjs; roomgroupsui.js draws. */

export const VIEWS = ['lists', 'rooms'];
export const cleanView = (v) => (VIEWS.includes(v) ? v : 'lists');

/** the areas of a thing: its own area (an automation or scene given one in Home Assistant), else every area of the entities it uses, each
 *  once in their order; [] when none. areaOf: {entity: area id} */
export function roomsOf(own, uses, areaOf) {
  if (own && areaOf[own]) return [areaOf[own]];
  const out = [];
  (uses || []).forEach((e) => { const a = areaOf[e]; if (a && !out.includes(a)) out.push(a); });
  return out;
}

/** the entities a routine of the add-on uses (its blocks in every lane) */
export function flowEnts(flow) {
  return (flow?.lanes || []).flatMap((l) => (l.blocks || []).flatMap((b) => (Array.isArray(b.ents) ? b.ents : [])));
}

/** {loose: [the things without a room], rooms: [{id, name, items}]}: the rooms by name, only those with something in them; a thing in
 *  several rooms is in each (the owner's choice). roomsFor(item) -> [area id] */
export function groupRooms(items, roomsFor, areas) {
  const by = new Map(), loose = [];
  items.forEach((x) => {
    const ids = roomsFor(x).filter((id) => areas.some((a) => a.id === id));
    if (!ids.length) loose.push(x);
    ids.forEach((id) => { if (!by.has(id)) by.set(id, []); by.get(id).push(x); });
  });
  const rooms = areas.filter((a) => by.has(a.id)).map((a) => ({ id: a.id, name: a.name || a.id, items: by.get(a.id) }));
  return { loose, rooms: rooms.sort((a, b) => a.name.localeCompare(b.name)) };
}

/** {entity: area id} from Home Assistant's areas ([{id, entities}]) */
export function areaIndex(areas) {
  const out = {};
  (areas || []).forEach((a) => (a.entities || []).forEach((e) => { if (!(e in out)) out[e] = a.id; }));
  return out;
}

const ICONS = [
  [/wohn|living|lounge|salon|soggiorno|woonkamer|salón|pokój dzienny|dzienny/i, '🛋'], [/schlaf|bed|chambre|dormitorio|camera da letto|slaapkamer|sypialn/i, '🛏'],
  [/küche|kueche|kitchen|cuisine|cocina|cucina|keuken|kuchni|kuchnia/i, '🍳'], [/bad|bath|wc|toilet|toilette|baño|bagno|badkamer|łazienk|lazienk/i, '🛁'],
  [/büro|buero|arbeit|office|study|bureau|oficina|ufficio|kantoor|biuro|gabinet/i, '💻'], [/flur|gang|diele|hall|corridor|couloir|entrée|pasillo|corridoio|ingresso|korytarz|przedpok/i, '🚪'],
  [/kind|child|kid|nursery|enfant|niño|bambin|kinder|dziec/i, '🧒'], [/garten|garden|terrass|balkon|balcon|jardin|jardín|giardino|tuin|ogród|ogrod/i, '🌱'],
  [/garage|garaje|garaż|garaz/i, '🚗'], [/keller|basement|cellar|cave|sótano|cantina|kelder|piwnic/i, '📦'], [/^ess|esszimmer|essbereich|dining|salle à manger|comedor|sala da pranzo|eetkamer|jadaln/i, '🍽'],
  [/gäste|gaeste|guest|invités|invitados|ospiti|logeer|gości|gosci/i, '🛎'],
];
/** an emoji for a room by the words of its name (🏠 when none fits) */
export const roomIcon = (name) => (ICONS.find(([re]) => re.test(name || '')) || [0, '🏠'])[1];
