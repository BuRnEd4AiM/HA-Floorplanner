/* LED zones of a piece (leisure.js, `leds`): a mirror's light behind it, its frosted bands in front and its light underneath, the edge and the
 * plinth of a bar counter ... Every zone can be linked to an entity of its own (stored in the device: leds: [entity of zone 0, of zone 1 ...]);
 * a zone without one follows the device's entity, so a piece with one light needs nothing more. The 3D model draws the zones like the sections
 * of an LED ring (models.js, modelfx.js ringLook: lit in its light's colour, in the editor a zone that is off in its own soft colour), a zone
 * with its own entity lights the room as a light of its own (entityDevices), the live card has a button per zone (livepopup.js), the
 * side panel a field per zone (props.js). Pure (unit test: tests/ledzones.test.mjs). */
import { SCANDI, variantOf } from './scandi.js';
import { segEntity, ringEntities, ringSectionsWorld } from './ledring.js';

/** the zones of a device type: their keys (the names are the translations `led.<key>`); a piece whose zones depend on how it is built (a bar
 *  counter with a ceiling part has its light too) takes the device, without one its default */
export function zoneKeys(type, dev = null) {
  const l = SCANDI[type]?.leds;
  return (typeof l === 'function' ? l(variantOf(type, dev)) : l) || [];
}
export const zoneCount = (type, dev = null) => zoneKeys(type, dev).length;
/** the entity of zone i of device d: its own, else the device's */
export const zoneEntity = (d, i) => d?.leds?.[i] || d?.entity || '';
/** the entities of the zones (each once) */
export const zoneEntities = (d) => [...new Set(zoneKeys(d?.type, d).map((_, i) => zoneEntity(d, i)).filter(Boolean))];
/** the entities only zones have (not the device's own) */
export const ownZoneEntities = (d) => [...new Set(zoneKeys(d?.type, d).map((_, i) => d.leds?.[i]).filter((e) => e && e !== d.entity))];
/** is one of its zones linked to an entity of its own */
export const hasOwnZones = (d) => ownZoneEntities(d).length > 0;
/** every entity of the device: its own and its zones' (all on / off, quick switching) */
export const pieceEntities = (d) => [...new Set([d?.entity, ...zoneEntities(d)].filter(Boolean))];
/** link zone i of d to entity v ('' : it follows the device again); the list is kept short and removed when no zone has its own */
export function setZone(d, i, v) {
  const arr = Array.from({ length: zoneCount(d.type, d) }, (_, k) => (k === i ? v : d.leds?.[k]) || '');
  while (arr.length && !arr[arr.length - 1]) arr.pop();
  if (arr.length) d.leds = arr; else delete d.leds;
}
/** the zone entities kept to the zones d has now (a bar counter built without its ceiling part drops that light) */
export function fitZones(d) {
  if (!d.leds) return;
  const n = zoneCount(d.type, d);
  if (n) setZone(d, 0, d.leds[0] || ''); else delete d.leds;
}
/** the entity of section i of a device drawn in sections: the section of an LED ring, else the LED zone of a piece */
export const sectionEntity = (d, i) => (d?.type === 'ledring' ? segEntity(d, i) : zoneEntity(d, i));
/** every zone entity of d that is not the device's own as a light of its own (it lights the room, it is one of the room's lights), at the piece;
 *  name(d, key): its name (the room panel lists it), a zone sharing its entity with an earlier one is not listed again */
export function zoneLights(d, name = (dv) => dv.name || '') {
  const seen = new Set();
  return zoneKeys(d?.type, d).flatMap((key, i) => {
    const e = d.leds?.[i];
    if (!e || e === d.entity || seen.has(e)) return [];
    seen.add(e);
    return [{ ...d, entity: e, type: 'ledzone', leds: undefined, zone: i, name: name(d, key) }];
  });
}
/** every placed entity of a floor's devices as a device of its own (the lights of a room, its lamps' light): a TV's backlight, each section of an
 *  LED ring (at the section's middle, named after the ring or `ringName`) and each LED zone with an entity of its own (named by zoneName(d, key));
 *  moved here from app.js */
export function entityDevices(devices, ringName = '', zoneName = undefined) {
  return devices.flatMap((dv) => {
    if (dv.type === 'ledring') return ringSectionsWorld(dv).map((e) => ({ ...dv, id: dv.id, seg: e.i, x: e.mid[0], z: e.mid[1], len: e.len, entity: segEntity(dv, e.i), type: 'ledseg', name: `${dv.name || ringName} · ${e.i + 1}` }));
    return [{ ...dv }, ...(dv.ledEntity ? [{ ...dv, entity: dv.ledEntity, type: 'tv_led', panels: undefined }] : []), ...zoneLights(dv, zoneName)];
  });
}
/** the entities a double click / quick action switches (#251): an LED ring all of its sections, a piece all of its LED zones */
export const switchEntities = (d) => (d?.type === 'ledring' ? ringEntities(d) : pieceEntities(d));
/** the zones' states for the live card: [{ key, entity, on }] */
export const zoneStates = (d, states, onStates) => zoneKeys(d.type, d).map((key, i) => {
  const e = zoneEntity(d, i);
  return { key, entity: e, on: !!e && onStates.has(states[e]?.state) };
});
