/* Finishes of floors and walls (#448): what lies on the floor of a room (parquet, herringbone, tiles, stone, carpet ...), what is on its walls
 * (paint, woodchip, plaster, wallpapers, tiles, brick, wood ...) and on the outside of the house (the facade, a setting). Every pattern can
 * be changed: its colour, a second colour (grout, motif, gaps), the size of one element (a tile, a plank) and the angle it is laid at.
 * A wall can have another finish below a height (tiles up to 1.20 m, paint above), and each side of a wall its own (an accent wall).
 * Pure (unit test: tests/finishes.test.mjs): the catalogue, cleaning what is stored, how many metres one picture of a pattern covers, the
 * texture coordinates of floors and walls, which room is on which side of a wall and the pieces of a wall that get a finish.
 * patterns.js draws the patterns, finishtex.js makes textures and materials of them, wallskin.js puts them on the walls. */
import { pointInPoly } from './roomclip.js';

const F = ['floor'], W = ['wall'], A = ['facade'], WA = ['wall', 'facade'];
/** colours to choose from with one tap, per kind of material */
export const PALETTES = {
  wood: ['#e6dccb', '#d2b48c', '#c49a6c', '#b88a5c', '#a8784c', '#8f6a48', '#6b4a33', '#9b958c', '#5e5853', '#3a332e'],
  tile: ['#ffffff', '#f2f0ea', '#e9e4da', '#d8cbb5', '#c9c9c6', '#9a9a96', '#55595e', '#2b2b2d', '#b5653f', '#9cb09a', '#6f8fa8', '#3f7f7a', '#2b3a55', '#d9b2a9'],
  paint: ['#ffffff', '#f4f2ee', '#ece6da', '#e1d4bd', '#c8c8c4', '#a89c8e', '#b4c2ad', '#b9cbd8', '#e2c4bd', '#efdba6', '#2f5d66', '#2b3a55', '#44484c', '#6e3b3b'],
  brick: ['#9a4b33', '#b5653f', '#6e4a35', '#c8a46a', '#ebe7df', '#45454a', '#7a6f66'],
  stone: ['#d8d0c0', '#c2b59b', '#b9ad99', '#a59a86', '#8f8a84', '#7f7a74', '#4c5156', '#3e4248'],
  textile: ['#d9d2c5', '#c7bba8', '#8b8f96', '#5f6670', '#8a6f5a', '#5b6f5a', '#3b4a5a', '#7a3b3b'],
};

/** the patterns. on: where it is offered (floor, wall, facade); group: its heading in the list; kind: how it is drawn (patterns.js), p: the
 *  details of the drawing; color, color2: its colours (color2: grout, motif, gaps ... what c2 says, null without one); size: one element in
 *  metres (a tile, the width of a plank, a motif; for grain like concrete the picture); angle: laid at (degrees); rough: how matt (0 shiny,
 *  1 matt); bump: how strong its relief is; pal: the colours to choose from; mix: how much of color2 the colour from afar has */
export const PATTERNS = {
  parquet: { on: F, group: 'wood', kind: 'planks', color: '#b88a5c', size: 0.25, pal: 'wood', rough: 0.7, bump: 1 },
  parquetLight: { on: F, group: 'wood', kind: 'planks', color: '#d2b48c', size: 0.25, pal: 'wood', rough: 0.7, bump: 1 },
  parquetDark: { on: F, group: 'wood', kind: 'planks', color: '#8f6a48', size: 0.25, pal: 'wood', rough: 0.7, bump: 1 },
  plankWide: { on: F, group: 'wood', kind: 'planks', p: { long: true }, color: '#c49a6c', size: 0.22, pal: 'wood', rough: 0.7, bump: 1 },
  herringbone: { on: F, group: 'wood', kind: 'herringbone', p: { n: 5 }, color: '#b88a5c', size: 0.09, pal: 'wood', rough: 0.65, bump: 1 },
  chevron: { on: F, group: 'wood', kind: 'chevron', p: { n: 5 }, color: '#a8784c', size: 0.1, pal: 'wood', rough: 0.65, bump: 1 },
  basket: { on: F, group: 'wood', kind: 'basket', p: { n: 4 }, color: '#b07f52', size: 0.08, pal: 'wood', rough: 0.65, bump: 1 },
  laminate: { on: F, group: 'wood', kind: 'planks', p: { long: true }, color: '#a59c90', size: 0.19, pal: 'wood', rough: 0.55, bump: 0.6 },
  deck: { on: F, group: 'wood', kind: 'planks', p: { long: true, gap: 10, grooves: true }, color: '#8a6a4a', color2: '#2a2018', c2: 'gap', size: 0.145, pal: 'wood', rough: 0.85, bump: 1.5 },
  cork: { on: F, group: 'wood', kind: 'cork', color: '#b9895a', size: 0.4, pal: 'wood', rough: 0.9, bump: 0.6 },
  tiles: { on: F, group: 'tiles', kind: 'grid', p: { n: 4 }, color: '#e9e4da', color2: '#bdb5a8', c2: 'grout', size: 0.3, pal: 'tile', rough: 0.4, bump: 1 },
  tilesSmall: { on: F, group: 'tiles', kind: 'grid', p: { n: 8 }, color: '#e8eef2', color2: '#b8c3ca', c2: 'grout', size: 0.15, pal: 'tile', rough: 0.4, bump: 1 },
  tilesDark: { on: F, group: 'tiles', kind: 'grid', p: { n: 2 }, color: '#55595e', color2: '#3a3d40', c2: 'grout', size: 0.6, pal: 'tile', rough: 0.4, bump: 1 },
  tilesLarge: { on: F, group: 'tiles', kind: 'bond', p: { ar: 2 }, color: '#cfcac2', color2: '#b5afa6', c2: 'grout', size: 1.2, pal: 'tile', rough: 0.35, bump: 1 },
  tilesWood: { on: F, group: 'tiles', kind: 'planks', p: { gap: 4, joint: true, min: 0.45 }, color: '#9c8166', color2: '#6f6253', c2: 'grout', size: 0.2, pal: 'wood', rough: 0.45, bump: 1 },
  checker: { on: F, group: 'tiles', kind: 'grid', p: { n: 4, checker: true }, color: '#f2f0ea', color2: '#2b2b2d', c2: 'second', size: 0.3, pal: 'tile', rough: 0.35, bump: 1, mix: 0.5 },
  hexFloor: { on: F, group: 'tiles', kind: 'hex', color: '#e6e2da', color2: '#b9b3a9', c2: 'grout', size: 0.2, pal: 'tile', rough: 0.4, bump: 1 },
  mosaic: { on: F, group: 'tiles', kind: 'grid', p: { n: 16, vary: 0.12 }, color: '#d9dee2', color2: '#f2f2f0', c2: 'grout', size: 0.05, pal: 'tile', rough: 0.35, bump: 1 },
  cement: { on: F, group: 'tiles', kind: 'grid', p: { n: 4, cement: true }, color: '#e9e3d6', color2: '#2f4f5f', c2: 'motif', size: 0.2, pal: 'tile', rough: 0.6, bump: 0.6, mix: 0.35 },
  terrazzo: { on: F, group: 'tiles', kind: 'terrazzo', color: '#e3ddd2', color2: '#7d746a', c2: 'motif', size: 0.6, pal: 'stone', rough: 0.3, bump: 0.3, mix: 0.2 },
  marble: { on: F, group: 'tiles', kind: 'grid', p: { n: 2, marble: true }, color: '#eceae6', color2: '#8e8e92', c2: 'veins', size: 0.6, pal: 'stone', rough: 0.2, bump: 0.5, mix: 0.1 },
  slate: { on: F, group: 'stone', kind: 'rows', p: { layers: true }, color: '#4c5156', color2: '#33373b', c2: 'grout', size: 0.4, pal: 'stone', rough: 0.6, bump: 1.2 },
  stoneSlabs: { on: F, group: 'stone', kind: 'rows', color: '#b9ad99', color2: '#8f8577', c2: 'grout', size: 0.4, pal: 'stone', rough: 0.75, bump: 1.2 },
  flagstone: { on: F, group: 'stone', kind: 'cells', p: { g: 4 }, color: '#a59a86', color2: '#6f675b', c2: 'grout', size: 0.45, pal: 'stone', rough: 0.85, bump: 1.5 },
  paving: { on: F, group: 'stone', kind: 'bond', p: { ar: 2, paving: true }, color: '#8f8a84', color2: '#5b5753', c2: 'grout', size: 0.2, pal: 'stone', rough: 0.9, bump: 1.5 },
  cobble: { on: F, group: 'stone', kind: 'cells', p: { g: 8, round: true }, color: '#7f7a74', color2: '#4a4743', c2: 'grout', size: 0.12, pal: 'stone', rough: 0.85, bump: 1.5 },
  concrete: { on: F, group: 'other', kind: 'concrete', color: '#9a9a96', size: 3, pal: 'stone', rough: 0.85, bump: 0.4 },
  carpet: { on: F, group: 'other', kind: 'carpet', color: '#8b8f96', size: 0.5, pal: 'textile', rough: 1, bump: 0.8 },
  carpetTiles: { on: F, group: 'other', kind: 'carpet', p: { tiles: true }, color: '#5f6670', size: 0.5, pal: 'textile', rough: 1, bump: 0.8 },
  paint: { on: WA, group: 'paint', kind: 'plain', color: '#f2efe9', size: 1, pal: 'paint', rough: 0.9, bump: 0 },
  woodchip: { on: W, group: 'paint', kind: 'woodchip', color: '#f1eee8', size: 0.5, pal: 'paint', rough: 0.95, bump: 0.9 },
  plaster: { on: WA, group: 'paint', kind: 'plaster', color: '#ede8df', size: 0.6, pal: 'paint', rough: 0.95, bump: 1 },
  limewash: { on: W, group: 'paint', kind: 'limewash', color: '#e4dccf', size: 2, pal: 'paint', rough: 0.9, bump: 0.3 },
  concreteWall: { on: WA, group: 'paint', kind: 'concrete', p: { formwork: true }, color: '#a9a7a2', size: 2.5, pal: 'stone', rough: 0.85, bump: 0.6 },
  wpStripes: { on: W, group: 'paper', kind: 'stripes', color: '#e8e2d4', color2: '#c9bfa8', c2: 'motif', size: 0.1, pal: 'paint', rough: 0.8, bump: 0.2, mix: 0.5 },
  wpDamask: { on: W, group: 'paper', kind: 'damask', color: '#d8cfc0', color2: '#b8a888', c2: 'motif', size: 0.35, pal: 'paint', rough: 0.75, bump: 0.3, mix: 0.3 },
  wpDots: { on: W, group: 'paper', kind: 'dots', color: '#f0ece4', color2: '#8aa4b8', c2: 'motif', size: 0.08, pal: 'paint', rough: 0.8, bump: 0.2, mix: 0.15 },
  wpDiamond: { on: W, group: 'paper', kind: 'diamonds', color: '#e9e4da', color2: '#a8b5a0', c2: 'motif', size: 0.25, pal: 'paint', rough: 0.8, bump: 0.2, mix: 0.5 },
  wpLeaves: { on: W, group: 'paper', kind: 'leaves', color: '#e9efe6', color2: '#5e8a63', c2: 'motif', size: 0.15, pal: 'paint', rough: 0.8, bump: 0.2, mix: 0.3 },
  wpScallop: { on: W, group: 'paper', kind: 'scallop', color: '#1f3a4a', color2: '#c9a35a', c2: 'motif', size: 0.2, pal: 'paint', rough: 0.7, bump: 0.2, mix: 0.2 },
  wpZigzag: { on: W, group: 'paper', kind: 'zigzag', color: '#f1ede6', color2: '#3b4a5a', c2: 'motif', size: 0.12, pal: 'paint', rough: 0.8, bump: 0.2, mix: 0.35 },
  wpPlaid: { on: W, group: 'paper', kind: 'plaid', color: '#e6dccb', color2: '#9a3b3b', c2: 'motif', size: 0.3, pal: 'paint', rough: 0.85, bump: 0.3, mix: 0.3 },
  wpLinen: { on: W, group: 'paper', kind: 'linen', color: '#d9d2c5', size: 0.3, pal: 'paint', rough: 0.9, bump: 0.5 },
  wTiles: { on: W, group: 'tiles', kind: 'grid', p: { n: 6 }, color: '#f4f3f0', color2: '#c9c6c0', c2: 'grout', size: 0.2, pal: 'tile', rough: 0.25, bump: 1 },
  wTilesSmall: { on: W, group: 'tiles', kind: 'grid', p: { n: 10 }, color: '#e7eef0', color2: '#c3ccd0', c2: 'grout', size: 0.1, pal: 'tile', rough: 0.25, bump: 1 },
  wMetro: { on: W, group: 'tiles', kind: 'bond', p: { ar: 2, bevel: true }, color: '#f6f5f1', color2: '#bdb9b2', c2: 'grout', size: 0.15, pal: 'tile', rough: 0.2, bump: 1.2 },
  wMetroHerring: { on: W, group: 'tiles', kind: 'herringbone', p: { n: 2, tile: true }, color: '#eef0ec', color2: '#b9bab4', c2: 'grout', size: 0.075, pal: 'tile', rough: 0.2, bump: 1 },
  wTilesLarge: { on: W, group: 'tiles', kind: 'bond', p: { ar: 2 }, color: '#d9d5ce', color2: '#c2bdb4', c2: 'grout', size: 0.6, pal: 'tile', rough: 0.3, bump: 1 },
  wHex: { on: W, group: 'tiles', kind: 'hex', color: '#f2f2f0', color2: '#c4c4c0', c2: 'grout', size: 0.15, pal: 'tile', rough: 0.25, bump: 1 },
  wMosaic: { on: W, group: 'tiles', kind: 'grid', p: { n: 20, vary: 0.25 }, color: '#6a9fb0', color2: '#e8ece8', c2: 'grout', size: 0.025, pal: 'tile', rough: 0.15, bump: 1 },
  wMarble: { on: W, group: 'tiles', kind: 'grid', p: { n: 2, ar: 2, marble: true }, color: '#f0eee9', color2: '#9a9a9e', c2: 'veins', size: 0.6, pal: 'stone', rough: 0.15, bump: 0.5, mix: 0.1 },
  wZellige: { on: W, group: 'tiles', kind: 'grid', p: { n: 6, zellige: true }, color: '#3f7f7a', color2: '#d8d4c8', c2: 'grout', size: 0.1, pal: 'tile', rough: 0.15, bump: 1.2 },
  brick: { on: WA, group: 'stone', kind: 'bond', p: { ar: 3, cols: 4, brick: true }, color: '#9a4b33', color2: '#cfc6b8', c2: 'grout', size: 0.25, pal: 'brick', rough: 0.9, bump: 1.5 },
  brickWhite: { on: WA, group: 'stone', kind: 'bond', p: { ar: 3, cols: 4, brick: true, vary: 0.08 }, color: '#ebe7df', color2: '#d8d2c6', c2: 'grout', size: 0.25, pal: 'brick', rough: 0.9, bump: 1.5 },
  brickDark: { on: WA, group: 'stone', kind: 'bond', p: { ar: 3, cols: 4, brick: true, vary: 0.25 }, color: '#45454a', color2: '#6b6b6b', c2: 'grout', size: 0.25, pal: 'brick', rough: 0.85, bump: 1.5 },
  brickYellow: { on: WA, group: 'stone', kind: 'bond', p: { ar: 3, cols: 4, brick: true, vary: 0.3 }, color: '#c8a46a', color2: '#e2dbcc', c2: 'grout', size: 0.25, pal: 'brick', rough: 0.9, bump: 1.5 },
  stoneWall: { on: WA, group: 'stone', kind: 'cells', p: { g: 5 }, color: '#9d907c', color2: '#6d6457', c2: 'grout', size: 0.3, pal: 'stone', rough: 0.9, bump: 1.8 },
  woodPanel: { on: W, group: 'wood', kind: 'planks', p: { long: true }, color: '#c49a6c', size: 0.12, angle: 90, pal: 'wood', rough: 0.7, bump: 1 },
  woodSlats: { on: W, group: 'wood', kind: 'slats', color: '#b88a5c', color2: '#1e1e1e', c2: 'gap', size: 0.05, pal: 'wood', rough: 0.7, bump: 2, mix: 0.4 },
  woodCladding: { on: A, group: 'wood', kind: 'planks', p: { long: true, gap: 6 }, color: '#b0875c', color2: '#3a2c20', c2: 'gap', size: 0.14, angle: 90, pal: 'wood', rough: 0.85, bump: 1.5 },
  woodGrey: { on: A, group: 'wood', kind: 'planks', p: { long: true, gap: 6 }, color: '#8f8a82', color2: '#3b3936', c2: 'gap', size: 0.14, angle: 90, pal: 'wood', rough: 0.9, bump: 1.5 },
  shingles: { on: A, group: 'stone', kind: 'shingles', color: '#3e4248', color2: '#25282c', c2: 'gap', size: 0.25, pal: 'stone', rough: 0.6, bump: 1.5 },
  facadePanels: { on: A, group: 'tiles', kind: 'grid', p: { n: 2, ar: 2, joint: 8 }, color: '#7c8186', color2: '#3d4044', c2: 'gap', size: 1.2, pal: 'stone', rough: 0.6, bump: 1 },
};
export const PATTERN_KEYS = Object.keys(PATTERNS);
/** the headings of the lists, in this order */
export const GROUPS = { floor: ['wood', 'tiles', 'stone', 'other'], wall: ['paint', 'paper', 'tiles', 'stone', 'wood'], facade: ['paint', 'stone', 'wood', 'tiles'], side: ['paint', 'paper', 'tiles', 'stone', 'wood'] };
/** the patterns offered for a floor, a wall, the facade or one side of a wall (side: wall and facade patterns), by heading:
 *  [[group, [key, ...]], ...] */
export const choices = (where) => GROUPS[where].map((g) => [g, PATTERN_KEYS.filter((k) => PATTERNS[k].group === g && fits(k, where))]).filter(([, l]) => l.length);
/** a pattern may be used on this side: a wall side of a room or the outside take every wall and facade pattern */
const fits = (key, where) => where === 'side' ? PATTERNS[key].on.some((o) => o !== 'floor') : PATTERNS[key].on.includes(where);

const HEX = /^#[0-9a-f]{6}$/i;
export const cleanHex = (v) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : undefined);
export const isPattern = (k) => typeof k === 'string' && Object.hasOwn(PATTERNS, k);
export const SIZE = { min: 0.01, max: 5 };            // one element: 1 cm .. 5 m
export const BELOW = { min: 0.05, max: 3, def: 1.2 };  // the lower part of a wall: 5 cm .. 3 m high, 1.20 m to start with
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** the changes to a pattern as stored ({ color, color2, size, angle }): only what is valid; an empty object -> undefined */
export function cleanLook(v) {
  if (!v || typeof v !== 'object') return undefined;
  const o = {}, c = cleanHex(v.color), c2 = cleanHex(v.color2), s = num(v.size), a = num(v.angle);
  if (c) o.color = c;
  if (c2) o.color2 = c2;
  if (s !== undefined) o.size = Math.round(Math.min(SIZE.max, Math.max(SIZE.min, s)) * 1000) / 1000;
  if (a !== undefined) o.angle = Math.round((((a % 360) + 360) % 360) * 10) / 10;
  return Object.keys(o).length ? o : undefined;
}
/** a finish as stored ({ pattern, color, color2, size, angle }) for where (floor, wall, facade, side: a wall side), else undefined */
export function cleanFinish(v, where) {
  if (!v || typeof v !== 'object' || !isPattern(v.pattern) || !fits(v.pattern, where)) return undefined;
  return { pattern: v.pattern, ...cleanLook(v) };
}
/** the lower part of the walls of a room: a finish with its height */
export function cleanBelow(v) {
  const f = cleanFinish(v, 'wall');
  if (!f) return undefined;
  const h = num(v.height);
  return { ...f, height: Math.round(Math.min(BELOW.max, Math.max(BELOW.min, h ?? BELOW.def)) * 100) / 100 };
}
/** the finishes of the two sides of one wall (an accent wall): { left, right }, left / right when walking from a to b in the plan */
export function cleanFaces(v) {
  if (!v || typeof v !== 'object') return undefined;
  const o = {}, l = cleanFinish(v.left, 'side'), r = cleanFinish(v.right, 'side');
  if (l) o.left = l;
  if (r) o.right = r;
  return Object.keys(o).length ? o : undefined;
}
/** the side of a wall a face name stands for: right = +1 (local +z of the wall group, walls.js), left = -1 */
export const SIDES = { right: 1, left: -1 };

/** how many metres one picture of a pattern covers along its u and v (the canvas is square; some patterns stretch it) */
export function repeatOf(kind, p = {}, s = 1) {
  const r2 = Math.SQRT2;
  switch (kind) {
    case 'planks': return [8 * s, 8 * s];
    case 'herringbone': { const d = 2 * (p.n || 5) * r2 * s; return [d, d]; }
    case 'chevron': { const d = 2 * r2 * (p.n || 5) * s; return [d, d]; }
    case 'basket': return [4 * (p.n || 4) * s, 4 * (p.n || 4) * s];
    case 'grid': return [(p.n || 4) * s, (p.n || 4) * s];
    case 'bond': { const ar = p.ar || 2, cols = p.cols || 2; return [cols * s, bondRows(ar, cols) * (s / ar)]; }
    case 'hex': return [4 * s, 2 * Math.sqrt(3) * s];
    case 'cells': return [(p.g || 5) * s, (p.g || 5) * s];
    case 'rows': return [5 * s, 5 * s];
    case 'stripes': case 'dots': case 'leaves': case 'scallop': case 'zigzag': return [4 * s, 4 * s];
    case 'slats': return [8 * s, 8 * s];
    case 'damask': return [2 * s, 2 * s];
    case 'diamonds': return [2 * s, 3 * s];
    case 'shingles': return [4 * s, 6 * 0.7 * s];
    case 'carpet': return p.tiles ? [2 * s, 2 * s] : [s, s];
    case 'concrete': return p.formwork ? [s, s / 2] : [s, s];
    default: return [s, s];                            // grain: plaster, woodchip, cork, terrazzo, limewash, linen ...; plain
  }
}
/** rows of a running bond in one picture (cols tiles across): even, so the shifted rows repeat, and about as high as it is wide */
export const bondRows = (ar, cols = 2) => Math.max(2, Math.round((cols * ar) / 2) * 2);

/** a mix of two '#rrggbb' colours (k: share of the second) */
export function mixHex(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** a stored finish with everything filled in from its pattern: { key, kind, p, color, color2, size, angle, rough, bump, rep, mean },
 *  null for none */
export function resolve(spec) {
  if (!spec || !isPattern(spec.pattern)) return null;
  const d = PATTERNS[spec.pattern], look = cleanLook(spec) || {};
  const color = look.color || d.color, color2 = d.color2 ? look.color2 || d.color2 : null;
  const size = look.size ?? d.size, angle = look.angle ?? d.angle ?? 0, p = d.p || {};
  return {
    key: spec.pattern, kind: d.kind, p, color, color2, size, angle, rough: d.rough, bump: d.bump, rep: repeatOf(d.kind, p, size),
    mean: color2 ? mixHex(color, color2, d.mix ?? 0.12) : color,
  };
}
/** what the texture of a finish depends on (its colours and pattern, not its size or angle): one texture per text */
export const texKey = (fin) => `${fin.key}|${fin.color}|${fin.color2 || ''}`;

/** texture coordinates of a point: (a, b) metres in the plane of the finish (along and across), turned by its angle, in pictures */
export function planeUV(fin, a, b) {
  const r = (fin.angle * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [(c * a + s * b) / fin.rep[0], (-s * a + c * b) / fin.rep[1]];
}
/** the corner of a room the pattern of its floor starts at (the smallest x and z): whole tiles along the first walls */
export const floorOrigin = (points) => points.reduce((o, p) => [Math.min(o[0], p[0]), Math.min(o[1], p[1])], [Infinity, Infinity]);
/** texture coordinates of the floor at (x, z) */
export const floorUV = (fin, x, z, origin) => planeUV(fin, x - origin[0], z - origin[1]);
/** texture coordinates on side `side` (+1 / -1) of a wall at s metres from its end a and y metres up: the pattern starts at the floor
 *  (whole tiles at the bottom) and runs on across doors and windows; seen from the other side it is not mirrored */
export const wallUV = (fin, side, s, y) => planeUV(fin, side > 0 ? s : -s, y);

/** the rooms along side `side` of wall w (polygons drawn on the middle of the walls or on their faces): [{ from, to, room }] in metres
 *  from a, over the whole length plus half the thickness at both ends (that far a wall reaches into the corner); room null where there is
 *  none. The line is looked at a little in front of the face. */
export function sideSpans(w, rooms, side) {
  const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], len = Math.hypot(dx, dz);
  if (len < 1e-6) return [];
  const ux = dx / len, uz = dz / len, nx = -uz * side, nz = ux * side, t = (w.thickness || 0.2) / 2, d = t + 0.04;
  const px = w.a[0] + nx * d, pz = w.a[1] + nz * d, s0 = -t, s1 = len + t;
  const cuts = [s0, s1];
  rooms.forEach((r) => (r.points || []).forEach((a, i, pts) => {        // where the line crosses an edge of a room
    const b = pts[(i + 1) % pts.length], ex = b[0] - a[0], ez = b[1] - a[1], den = ux * ez - uz * ex;
    if (Math.abs(den) < 1e-12) return;
    const s = ((a[0] - px) * ez - (a[1] - pz) * ex) / den, k = ((a[0] - px) * uz - (a[1] - pz) * ux) / den;
    if (k >= -1e-9 && k <= 1 + 1e-9 && s > s0 && s < s1) cuts.push(s);
  }));
  cuts.sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const from = cuts[i], to = cuts[i + 1];
    if (to - from < 1e-6) continue;
    const m = (from + to) / 2, x = px + ux * m, z = pz + uz * m;
    const room = rooms.find((r) => (r.points || []).length >= 3 && pointInPoly(x, z, r.points)) || null;
    const last = out[out.length - 1];
    if (last && last.room === room) last.to = to; else out.push({ from, to, room });
  }
  return out;
}

/** is (x, z) inside one of the rings (the outline of the house) */
const inRings = (x, z, rings) => rings.some((r) => pointInPoly(x, z, r));

/** what the two sides of wall w get: { 1: [...], -1: [...] } of { from, to, upper, below, height } (metres from a; upper: the finish of
 *  the wall above `height`, below: under it, null: the wall keeps its colour). A side in a room takes the room's finishes; a side outside
 *  the house (o.outline, the rings of its outline) the facade (o.facade); the faces of the wall itself (an accent wall) win over both and
 *  cover the whole height */
export function wallSkins(w, rooms, o = {}) {
  const out = {}, faces = cleanFaces(w.faces) || {}, facade = o.facade ? resolve(o.facade) : null;
  const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], len = Math.hypot(dx, dz) || 1, t = (w.thickness || 0.2) / 2 + 0.04;
  for (const [name, side] of Object.entries(SIDES)) {
    const own = resolve(faces[name]);
    out[side] = sideSpans(w, rooms, side).map(({ from, to, room }) => {
      if (own) return { from, to, upper: own, below: null, height: 0 };
      if (room) {
        const below = resolve(cleanBelow(room.wallBelow));
        return { from, to, upper: resolve(cleanFinish(room.wallLook, 'wall')), below, height: below ? cleanBelow(room.wallBelow).height : 0 };
      }
      if (!facade) return { from, to, upper: null, below: null, height: 0 };
      const m = (from + to) / 2, x = w.a[0] + (dx / len) * m - (dz / len) * side * t, z = w.a[1] + (dz / len) * m + (dx / len) * side * t;
      return { from, to, upper: o.outline && inRings(x, z, o.outline) ? null : facade, below: null, height: 0 };
    }).filter((sp) => sp.upper || sp.below);
  }
  return out;
}
/** is anything on the walls of this floor: a room with a wall finish, a wall with faces of its own, or a facade */
export const hasSkins = (f, facade) => !!facade || f.rooms.some((r) => r.wallLook || r.wallBelow) || f.walls.some((w) => w.faces);

/** the pieces of a wall that get a finish: pieces are the solid parts of the wall (walls.js, local x from -len/2, y up), skins what
 *  wallSkins says; returns [{ side, x0, x1, y0, y1, fin }] (one per piece, side, span and part above / below) */
export function skinQuads(pieces, skins, len) {
  const out = [], half = len / 2;
  for (const side of [1, -1]) for (const sp of skins[side] || []) {
    const a = sp.from - half, b = sp.to - half;
    for (const pc of pieces) {
      const x0 = Math.max(pc.x0, a), x1 = Math.min(pc.x1, b);
      if (x1 - x0 < 1e-4) continue;
      const parts = sp.below ? [[sp.below, pc.y0, Math.min(pc.y1, sp.height)], [sp.upper, Math.max(pc.y0, sp.height), pc.y1]] : [[sp.upper, pc.y0, pc.y1]];
      parts.forEach(([fin, y0, y1]) => { if (fin && y1 - y0 > 1e-4) out.push({ side, x0, x1, y0, y1, fin }); });
    }
  }
  return out;
}
