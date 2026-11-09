/* ⚡ Power per building (the owner, 2026-11-07: "wenn man alle zwei Häuser … in einem Haus die drin hat und dann über Bereiche sozusagen die
 * Häuser trennt, dass dann auch für den einen Bereich einen eigenen Stromrechner gibt … wenn man dann auf den Bereich 2 schaltet, dass dann
 * das alles für den Bereich 2 ist"; with "🏘 Alle Gebäude" each one apart): a plan with several buildings (#409, buildings.js) can count
 * power per building. Each building then has its own calculation (building.energy, the same as layout.energy in energycalc.js: grid,
 * solar, battery, house, rooms, and the meters and prices of the page ⚡ Energie) and counts only the power devices in its own rooms
 * (buildingLayout). Off (the default, and always with fewer than two buildings) the plan has one calculation, layout.energy, as before.
 * A "unit" is what counts power: { key, bid, name, layout } (layout with .energy: what energyBalance, houseMeters, houseBatteries take).
 * Pure (no DOM, no three.js): tests/energyunits.test.mjs; the switch and the head of the tab "⚡ Rechnung": energyunitsui.js. */
import { buildingsOf, pickBuilding, viewOf, roomOwners, pointOwners, groundOwner } from './buildings.js';

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

/** the plan counts power per building: two buildings or more, and at least one of them has its own calculation */
export const perBuilding = (layout) => { const bs = buildingsOf(layout); return bs.length >= 2 && bs.some((b) => obj(b.energy)); };

/** the calculation of the whole plan: layout.energy; a plan whose buildings were counted apart and that has one building left with a
 *  calculation (the others deleted) takes that one */
export function planEnergy(layout) {
  return obj(layout?.energy) || obj(buildingsOf(layout).find((b) => obj(b.energy))?.energy) || {};
}

/** the plan as the calculation of building bid sees it, with its own calculation: only its own rooms and the devices in them (or over
 *  them, on the roof): a device in the garden or in a room of the plot belongs to no building here (it would count in each of them; set
 *  it in the tab instead) */
export function buildingLayout(layout, bid, owners = null) {
  const b = buildingsOf(layout).find((x) => x.id === bid), ro = owners || roomOwners(layout), v = viewOf(layout, bid, ro);
  const floors = v.floors.map((f, fi) => {
    const o = ro[fi] || [], under = (x, z) => groundOwner(layout, ro, fi, x, z);
    return { ...f, rooms: o.filter((x) => x.b === bid).map((x) => x.room),
      devices: (f.devices || []).filter((d) => pointOwners(o, d.x || 0, d.z || 0, under).includes(bid)) };
  });
  return { ...v, floors, energy: obj(b?.energy) || {} };
}

/** what counts power in a plan: [{ key, bid, name, layout }], one per building (perBuilding), else the plan as one (bid null).
 *  house: { id, name } of the plan; key: the house's id, or "<house id>~<building id>"; name: the house's, or the building's (with the
 *  house's in front when withHouse: several houses on the page ⚡ Energie). unnamed: the name of a building without one */
export function energyUnits(layout, house = {}, { withHouse = false, unnamed = '?' } = {}) {
  const hid = house.id || '', hname = house.name || '';
  if (!perBuilding(layout)) {
    const own = obj(layout?.energy);
    return [{ key: hid, bid: null, name: hname, layout: own || !layout ? layout : { ...layout, energy: planEnergy(layout) } }];
  }
  const owners = roomOwners(layout);
  return buildingsOf(layout).map((b) => {
    const n = b.name || unnamed;
    return { key: `${hid}~${b.id}`, bid: b.id, name: withHouse && hname ? `${hname} · ${n}` : n, layout: buildingLayout(layout, b.id, owners) };
  });
}

/** the units this screen shows: the building shown (shown: its id), or every unit (all buildings shown, or one calculation for the plan) */
export function shownUnits(layout, shown, house = {}, opts = {}) {
  const all = energyUnits(layout, house, opts), b = pickBuilding(layout, shown);
  return b && perBuilding(layout) ? all.filter((u) => u.bid === b) : all;
}

/** where the tab "⚡ Rechnung" writes: the calculation of building bid (made when it has none yet), null when the plan counts per building
 *  and no building is chosen; the plan's one otherwise (made when missing) */
export function energyTarget(layout, bid) {
  if (perBuilding(layout)) {
    const b = buildingsOf(layout).find((x) => x.id === pickBuilding(layout, bid));
    if (!b) return null;
    if (!obj(b.energy)) b.energy = {};
    return b.energy;
  }
  if (!obj(layout.energy)) {
    const lone = buildingsOf(layout).find((b) => obj(b.energy));      // the last one left of a plan counted per building
    layout.energy = lone ? lone.energy : {};
    if (lone) delete lone.energy;
  }
  return layout.energy;
}

/** "⚡ Eigene Rechnung je Gebäude" on: every building gets a calculation of its own; building `to` (else the first) takes the plan's one
 *  (layout.energy goes), the others start empty (they count the power devices in their rooms). Returns the building that took it. */
export function splitEnergy(layout, to = null) {
  const bs = buildingsOf(layout);
  if (bs.length < 2) return null;
  const heir = bs.find((b) => b.id === to) || bs[0], had = obj(layout.energy);
  bs.forEach((b) => { if (b === heir) b.energy = had || obj(b.energy) || {}; else if (!obj(b.energy)) b.energy = {}; });
  delete layout.energy;
  return heir.id;
}

/** off again: building `from`'s calculation (else the first one that has a setting) is the plan's one, the others' are gone. Returns the
 *  names of the buildings whose calculation was dropped (to tell). */
export function joinEnergy(layout, from = null) {
  const bs = buildingsOf(layout), set = (b) => obj(b.energy) && Object.keys(b.energy).length > 0;
  const keep = bs.find((b) => b.id === from) || bs.find(set) || bs[0];
  const dropped = bs.filter((b) => b !== keep && set(b)).map((b) => b.name || '');
  const e = keep ? obj(keep.energy) : null;
  if (e && Object.keys(e).length) layout.energy = e;                    // an empty one leaves the plan's as it is
  bs.forEach((b) => { delete b.energy; });
  return dropped;
}
