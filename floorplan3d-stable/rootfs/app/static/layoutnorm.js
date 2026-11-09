/* A loaded floor plan made complete (#137, step 23): every floor has its lists (walls, rooms, devices, blocks, stairs, holes) and a kind,
 * every wall its openings; a plan without floors gets one. Pure (unit test: tests/layoutnorm.test.mjs). */

/** the layout with every list in place (changed in place where possible); defaultName / uid() for the floor of an empty plan */
export function normalizeLayout(layout, defaultName, uid) {
  if (!layout?.floors?.length) {
    layout = { version: 1, floors: [{ id: uid(), name: defaultName, walls: [], rooms: [], devices: [], blocks: [], stairs: [] }] };
  }
  layout.floors.forEach((f) => {
    f.walls ||= []; f.rooms ||= []; f.devices ||= []; f.blocks ||= []; f.stairs ||= []; f.holes ||= []; f.kind ||= 'floor';
    f.walls.forEach((w) => { w.openings ||= []; });
  });
  return layout;
}

/** the add-on creates "Erdgeschoss" for a brand-new house: it shows in the language of the user (defaultName) as long as nothing is drawn */
export function localizeDefaults(layout, defaultName) {
  const f = layout.floors?.[0];
  if (layout.floors.length === 1 && f && f.name === 'Erdgeschoss' && !f.walls?.length && !f.rooms?.length && !f.devices?.length && !f.blocks?.length) f.name = defaultName;
}
