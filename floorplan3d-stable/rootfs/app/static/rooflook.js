/* The look of a roof (#752, Miicki: "Mein Haus hat zum Beispiel dunkelgraue Ziegel, in der App ist das Dach aber immer ziegelrot"): its
 * colour (roof.color, '#rrggbb'; none: brick red as always) and what it is covered with (roof.cover: tiles, beaver tails, slate, metal with
 * standing seams; none: one smooth colour as before). The further roofs of the floor and the little roofs of the dormers take the same, the
 * dormers a little darker (as red was to dark red). Pure (unit test: tests/rooflook.test.mjs): the colours to choose from, cleaning what is
 * stored, the finish to draw (patterns.js draws it, finishtex.js makes the texture) and the texture coordinates on the slopes. */
import { cleanHex, repeatOf, mixHex, planeUV } from './finishes.js';

export const ROOF_RED = '#a4493b';
export const DORMER_RED = '#8f3b2f';
/** the colours to tap: [key, colour] (the names are under look.roof.<key>) */
export const ROOF_COLORS = [
  ['red', ROOF_RED], ['engobe', '#7a2e26'], ['brown', '#6b4a36'], ['anthracite', '#3a3e43'],
  ['darkgrey', '#5c6066'], ['slate', '#48505a'], ['black', '#25272a'], ['zinc', '#9aa1a8'],
];
/** what a roof is covered with: kind (patterns.js), p (details of the drawing), size (one tile, a seam apart; metres), rough, bump */
export const ROOF_COVERS = {
  tiles: { kind: 'rooftiles', size: 0.3, rough: 0.75, bump: 1.4 },
  beaver: { kind: 'shingles', size: 0.18, rough: 0.8, bump: 1.2 },
  slate: { kind: 'shingles', p: { square: true }, size: 0.25, rough: 0.55, bump: 1 },
  metal: { kind: 'seams', size: 0.5, rough: 0.4, bump: 0.8 },
};
export const COVER_KEYS = Object.keys(ROOF_COVERS);

/** a cover as stored: a known one, else undefined (smooth) */
export const cleanCover = (v) => (typeof v === 'string' && Object.hasOwn(ROOF_COVERS, v) ? v : undefined);
/** the look of roof spec r as stored: { color, cover }, only what is valid (undefined: as always) */
export function roofLook(r) {
  const o = {}, c = cleanHex(r?.color), k = cleanCover(r?.cover);
  if (c) o.color = c;
  if (k) o.cover = k;
  return o;
}
/** set the colour (null: brick red again) or the cover (null: smooth) of roof r; returns r */
export function setRoofLook(r, patch) {
  if ('color' in patch) { const c = cleanHex(patch.color); if (c && c !== ROOF_RED) r.color = c; else delete r.color; }
  if ('cover' in patch) { const k = cleanCover(patch.cover); if (k) r.cover = k; else delete r.cover; }
  return r;
}
/** the colour of the slopes */
export const roofHex = (r) => cleanHex(r?.color) || ROOF_RED;
/** the colour of the dormers' little roofs: a little darker than the slopes */
export const dormerHex = (r) => { const c = cleanHex(r?.color); return c ? mixHex(c, '#000000', 0.14) : DORMER_RED; };

/** the finish of a roof's surface (like finishes.js resolve: { key, kind, p, color, color2, size, angle, rough, bump, rep, mean }) or null
 *  when it is smooth; dormer: the darker colour of a dormer's roof */
export function roofFinish(r, dormer = false) {
  const k = cleanCover(r?.cover);
  if (!k) return null;
  const d = ROOF_COVERS[k], color = dormer ? dormerHex(r) : roofHex(r), color2 = mixHex(color, '#000000', 0.5), p = d.p || {};
  return { key: `roof.${k}`, kind: d.kind, p, color, color2, size: d.size, angle: 0, rough: d.rough, bump: d.bump, rep: repeatOf(d.kind, p, d.size), mean: mixHex(color, color2, 0.15) };
}

/** texture coordinates of triangles (pos: x, y, z of three corners each, a flat list) on a roof: on every slope the rows of tiles run
 *  along the eaves and the seams down the slope (u along the eaves, v up the slope, in pictures of finish fin); flat parts take x and z.
 *  Returns the flat list u, v per corner. */
export function slopeUVs(pos, fin) {
  const uv = new Array((pos.length / 3) * 2).fill(0);
  for (let t = 0; t + 8 < pos.length; t += 9) {
    const ax = pos[t], ay = pos[t + 1], az = pos[t + 2];
    const ux = pos[t + 3] - ax, uy = pos[t + 4] - ay, uz = pos[t + 5] - az, vx = pos[t + 6] - ax, vy = pos[t + 7] - ay, vz = pos[t + 8] - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz);
    if (nl < 1e-12) continue;                                    // a triangle without area
    nx /= nl; ny /= nl; nz /= nl;
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }                  // the side that faces up
    const h = Math.hypot(nx, nz);
    let ex = 1, ez = 0, sx = 0, sy = 0, sz = 1;                    // flat: x and z
    if (h > 1e-3) {
      const dx = nx / h, dz = nz / h;                             // down the slope (where the normal leans to)
      ex = -dz; ez = dx;                                          // along the eaves
      sx = -dx * ny; sy = h; sz = -dz * ny;                       // up the slope, in the plane of the slope
    }
    for (let k = 0; k < 3; k++) {
      const x = pos[t + 3 * k], y = pos[t + 3 * k + 1], z = pos[t + 3 * k + 2];
      const [u, v] = planeUV(fin, x * ex + z * ez, x * sx + y * sy + z * sz);
      uv[(t / 3 + k) * 2] = u; uv[(t / 3 + k) * 2 + 1] = v;
    }
  }
  return uv;
}
