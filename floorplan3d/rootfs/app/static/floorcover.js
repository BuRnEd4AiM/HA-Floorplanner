/* Floor coverings (#427, more of them with colour, size and angle in #448): a room can have parquet, tiles, stone, carpet ... instead of one
 * colour (room.covering, the pattern; room.floorLook, its colour, second colour, size and angle). The patterns themselves are in
 * finishes.js. Here: which coverings there are, the finish of a room's floor, the colour of a covered room where no pattern is drawn (2D
 * plan, floor thumbnails, the "fast" performance mode) and what colour the floor of the 3D view takes. Pure (unit test:
 * tests/floorcover.test.mjs); floortex.js puts the patterns on the floors. */
import { PATTERNS, PATTERN_KEYS, resolve, cleanLook } from './finishes.js';

/** the floor coverings (the patterns offered for floors) */
export const COVERING_KEYS = PATTERN_KEYS.filter((k) => PATTERNS[k].on.includes('floor'));
/** the room colour when none is set */
export const PLAIN = '#8a7f70';

/** a covering as stored (from the panel or an import): a known name, else undefined (one colour) */
export const cleanCovering = (v) => (typeof v === 'string' && COVERING_KEYS.includes(v) ? v : undefined);

/** the finish of a room's floor (finishes.js resolve: pattern with its colours, size, angle ...), null with one colour */
export function floorFinish(room) {
  const k = cleanCovering(room?.covering);
  return k ? resolve({ ...cleanLook(room.floorLook), pattern: k }) : null;
}

/** the finish drawn on the 3D floor of a room, or null: none chosen, the hologram theme (its own floor), the "fast" performance mode */
export function patternOf(room, { holo = false, low = false } = {}) {
  return holo || low ? null : floorFinish(room);
}

/** the colour of a room where its pattern is not drawn: the colour of its covering from afar, else its own colour */
export const floorHex = (room) => floorFinish(room)?.mean || room?.color || PLAIN;

/** the fill of a room in the 2D plan: heat (the colour of the views Temp. / Humidity / CO₂ as 0xrrggbb, or null) as '#rrggbb', stronger;
 *  else the colour of its floor (#467: the number itself in fill="…" is no SVG colour, the rooms turned black) */
export function planFill(room, heat) {
  if (heat != null) return { fill: `#${(heat & 0xffffff).toString(16).padStart(6, '0')}`, opacity: 0.45 };
  return { fill: floorHex(room), opacity: 0.26 };
}

/** what the floor of the 3D view takes: heat (the colour of the views Temp. / Humidity / CO₂, or null), patterned (the pattern is on it).
 *  { color, pattern }: a view colour hides the pattern; under the pattern the colour is white (the pattern is the colour) */
export function floorPaint(room, heat, patterned) {
  if (heat != null) return { color: heat, pattern: false };
  return patterned ? { color: '#ffffff', pattern: true } : { color: floorHex(room), pattern: false };
}
