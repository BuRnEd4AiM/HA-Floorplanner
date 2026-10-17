/* Floor coverings (#427): a room can have parquet, tiles or concrete instead of one colour (room.covering). Which coverings there are, how
 * their pattern is drawn (planks or tiles, colours, how many metres one picture covers), the colour of a covered room where no pattern is
 * drawn (2D plan, floor thumbnails, the "fast" performance mode) and what colour the floor of the 3D view takes. Pure (unit test:
 * tests/floorcover.test.mjs); floortex.js draws the patterns and puts them on the floors. */

/** the coverings: kind (planks, tiles, concrete), colours, size (metres one picture of the pattern covers), n (tiles along one picture),
 *  mean (the colour it looks like from afar) */
export const COVERINGS = {
  parquet: { kind: 'planks', base: '#b88a5c', size: 2, mean: '#a98058' },
  parquetLight: { kind: 'planks', base: '#d2b48c', size: 2, mean: '#c4a67f' },
  parquetDark: { kind: 'planks', base: '#8f6a48', size: 2, mean: '#83613f' },
  tiles: { kind: 'tiles', a: '#e9e4da', b: '#ddd6ca', grout: '#bdb5a8', n: 4, size: 1.2, mean: '#dfd9ce' },
  tilesSmall: { kind: 'tiles', a: '#e8eef2', b: '#dfe7ec', grout: '#b8c3ca', n: 8, size: 1.2, mean: '#dbe3e8' },
  tilesDark: { kind: 'tiles', a: '#55595e', b: '#4d5156', grout: '#3a3d40', n: 2, size: 1.2, mean: '#4f5358' },
  concrete: { kind: 'concrete', base: '#9a9a96', size: 3, mean: '#999995' },
};
export const COVERING_KEYS = Object.keys(COVERINGS);
/** the room colour when none is set */
export const PLAIN = '#8a7f70';

/** a covering as stored (from the panel or an import): a known name, else undefined (one colour) */
export const cleanCovering = (v) => (typeof v === 'string' && Object.hasOwn(COVERINGS, v) ? v : undefined);

/** the covering drawn on the 3D floor of a room, or null: none chosen, the hologram theme (its own floor), the "fast" performance mode */
export function patternOf(room, { holo = false, low = false } = {}) {
  return holo || low ? null : cleanCovering(room?.covering) || null;
}

/** the colour of a room where its pattern is not drawn: the mean colour of its covering, else its own colour */
export const floorHex = (room) => COVERINGS[cleanCovering(room?.covering)]?.mean || room?.color || PLAIN;

/** what the floor of the 3D view takes: heat (the colour of the views Temp. / Humidity / CO₂, or null), patterned (the pattern is on it).
 *  { color, pattern }: a view colour hides the pattern; under the pattern the colour is white (the pattern is the colour) */
export function floorPaint(room, heat, patterned) {
  if (heat != null) return { color: heat, pattern: false };
  return patterned ? { color: '#ffffff', pattern: true } : { color: floorHex(room), pattern: false };
}
