/* The name of a room from Home Assistant's areas (the owner, 2026-11-07: "entweder der Home Assistant Bereiche auswählen … wie der
 * Raum heißt, oder einen eigenen Raumname vergeben … wenn man sich schon die Arbeit gemacht hat, so Bereiche zu erstellen, dass man die
 * auch einfach dann zuordnen kann"): the choices of the drop-down next to the name, what choosing one does, a typed name that is an
 * area's name, and the rooms of the house that are called like an area but not linked to it yet. A room linked to an area (room.area)
 * also shows the area's devices and sensors (roompanel.js, app.js areaEntitiesOf). Pure (tests/roomname.test.mjs); the fields: roomnameui.js. */

/** a name to compare: no spaces around, one space inside, small letters ("  Küche " = "küche") */
export const nameKey = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

/** every room of the house with the name of its floor: [{ room, floor }] */
const roomsOf = (layout) => (layout?.floors || []).flatMap((f) => (f.rooms || []).map((room) => ({ room, floor: f.name || '' })));

/** the area called `name` (case and spaces do not count), or null */
export const areaNamed = (areas, name) => {
  const k = nameKey(name);
  return k ? (areas || []).find((a) => nameKey(a.name) === k) || null : null;
};

/** the areas for the drop-down of the room `roomId`: [{ id, name, usedBy: ['Küche (Obergeschoss)' …] }]. Areas no other room has come
 *  first, those another room is linked to after them (they can still be chosen: two rooms in one area); each part by name. The room's
 *  own area, when Home Assistant no longer has it, is added with `missing: true` (so the drop-down does not show "own name" for it). */
export function areaChoices(areas, layout, roomId) {
  const rooms = roomsOf(layout), floors = new Set((layout?.floors || []).map((f) => f.name)).size > 1;
  const own = rooms.find((x) => x.room.id === roomId)?.room;
  const list = (areas || []).map((a) => ({
    id: a.id, name: a.name || a.id,
    usedBy: rooms.filter((x) => x.room.id !== roomId && x.room.area === a.id).map((x) => (floors && x.floor ? `${x.room.name || '?'} (${x.floor})` : x.room.name || '?')),
  }));
  const by = (a, b) => a.name.localeCompare(b.name);
  const out = [...list.filter((a) => !a.usedBy.length).sort(by), ...list.filter((a) => a.usedBy.length).sort(by)];
  if (own?.area && !out.some((a) => a.id === own.area)) out.unshift({ id: own.area, name: own.area, usedBy: [], missing: true });
  return out;
}

/** choose in the drop-down: an area links the room and gives it the area's name; none ('' / null) takes the link away, the name stays.
 *  Returns the room. */
export function takeArea(room, area) {
  if (area) { room.area = area.id; room.name = area.name || area.id; } else delete room.area;
  return room;
}

/** a name typed for a room: a room with no area that is now called exactly like an area no other room is linked to gets linked to it
 *  (the name stays as typed). Returns that area, or null. */
export function linkByName(room, areas, layout) {
  if (room.area) return null;
  const a = areaNamed(areas, room.name);
  if (!a || roomsOf(layout).some((x) => x.room !== room && x.room.area === a.id)) return null;
  room.area = a.id;
  return a;
}

/** the rooms of the house with no area that are called like an area no room is linked to: [{ room, area }], each area once (the
 *  first room of that name, floor by floor); "🔗 Alle verknüpfen" links them in one step */
export function nameMatches(areas, layout) {
  const rooms = roomsOf(layout), taken = new Set(rooms.map((x) => x.room.area).filter(Boolean)), out = [];
  rooms.forEach(({ room }) => {
    if (room.area) return;
    const a = areaNamed(areas, room.name);
    if (a && !taken.has(a.id)) { taken.add(a.id); out.push({ room, area: a }); }
  });
  return out;
}

/** what the line under the drop-down says: 'none' (no area), 'same' (linked, called like it), 'own' (linked, an own name), 'missing'
 *  (linked to an area Home Assistant no longer has) */
export function linkState(room, areas) {
  if (!room?.area) return 'none';
  const a = (areas || []).find((x) => x.id === room.area);
  if (!a) return 'missing';
  return nameKey(a.name) === nameKey(room.name) ? 'same' : 'own';
}
