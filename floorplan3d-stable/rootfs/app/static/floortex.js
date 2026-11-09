/* Floor coverings in 3D (#427, #448): the floor of a room (floorbuild.js) gets the picture and relief of its finish (finishtex.js), its
 * texture coordinates turned and scaled by the angle and size of the finish (finishes.js floorUV, starting at the room's corner), and
 * paintFloor (every state update, app.js) puts the colour of the views Temp. / Humidity / CO₂ over it or the pattern back. */
import { floorPaint } from './floorcover.js';
import { floorUV, floorOrigin } from './finishes.js';
import { finishMap, finishLook } from './finishtex.js';

/** write the texture coordinates of a room's floor (geometry already turned flat: x, z) for finish fin; points: the room's corners */
export function floorUVs(geo, fin, points) {
  const o = floorOrigin(points), pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) { const [u, v] = floorUV(fin, pos.getX(i), pos.getZ(i), o); uv.setXY(i, u, v); }
  uv.needsUpdate = true;
}
/** what the material of a patterned floor gets (picture, relief, how matt) */
export const floorLook = (fin) => finishLook(fin);

/** the floor of the 3D view after a state update: the colour of a view over it (no pattern then), else its pattern or colour. m: its
 *  material; the finish it was built with is m.userData.cover */
export function paintFloor(m, room, heat) {
  const cover = m.userData.cover || null, p = floorPaint(room, heat, !!cover);
  const map = p.pattern ? finishMap(cover) : null;
  if (m.map !== map) { m.map = map; m.needsUpdate = true; }
  m.color.set(p.color);
}
