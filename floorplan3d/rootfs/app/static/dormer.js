/* Roof dormers (Dachgauben): a small box with its own roof that stands out of one slope of the roof.
 * Pure geometry, no DOM or three.js: the roof floor's footprint and a dormer go in, triangles come out.
 *
 * Coordinates: along the ridge `u`, across the slope `e` = distance from the eave (the lower edge of the slope), height `y`
 * (0 = the base of the roof). On a slope with the pitch angle p the surface is at y = e * tan(p). */

export const DORMER_DEFAULT = { side: 0, pos: 0.5, w: 1.6, hw: 1.2, eave: 0.8, type: 'gable', win: true };
export const DORMER_TYPES = ['gable', 'flat'];
const GABLE_PITCH = Math.tan((28 * Math.PI) / 180);               // the little roof of a gable dormer
const OVER = 0.1;                                                  // overhang of the dormer roof (m)

/** the frame of the main roof, same maths as roofGeometry in app.js */
export function roofFrame(bb, r) {
  const o = r.overhang ?? 0.4, x0 = bb.x0 - o, x1 = bb.x1 + o, z0 = bb.z0 - o, z1 = bb.z1 + o;
  const alongX = r.ridge ? r.ridge === 'x' : (x1 - x0) >= (z1 - z0);
  const [a0, a1, b0, b1] = alongX ? [x0, x1, z0, z1] : [z0, z1, x0, x1];
  const half = (b1 - b0) / 2;
  const tan = Math.tan(((r.pitch ?? 35) * Math.PI) / 180);
  const ins = r.type === 'hip' ? Math.min(half, (a1 - a0) / 2) : 0;
  return { alongX, a0, a1, b0, b1, half, tan, ins };
}

/** the dormer with every value clamped so it really fits on the slope; null when there is no room for it (flat roof, tiny roof) */
export function fitDormer(bb, r, d) {
  if (!bb || !r || r.type === 'flat') return null;
  const F = roofFrame(bb, r);
  const n = { ...DORMER_DEFAULT, ...d };
  n.side = n.side === 1 ? 1 : 0;
  n.type = DORMER_TYPES.includes(n.type) ? n.type : 'gable';
  n.w = Math.max(0.6, Math.min(5, +n.w || DORMER_DEFAULT.w));
  const lo = F.a0 + F.ins + n.w / 2 + OVER, hi = F.a1 - F.ins - n.w / 2 - OVER;
  if (hi < lo) return null;                                        // longer than the roof
  n.pos = Math.max(0, Math.min(1, Number.isFinite(+n.pos) ? +n.pos : 0.5));
  n.at = lo + (hi - lo) * n.pos;                                   // centre along the ridge (m)
  n.eave = Math.max(0.2, Math.min(F.half * 0.8, +n.eave || DORMER_DEFAULT.eave));
  const yF = n.eave * F.tan, gh = n.type === 'gable' ? (n.w / 2) * GABLE_PITCH : 0;
  const room = F.half * F.tan - yF - gh - 0.05;                    // the little roof must stay below the ridge of the main roof
  n.hw = Math.max(0.4, Math.min(+n.hw || DORMER_DEFAULT.hw, room, 3));
  if (room < 0.4) return null;
  n.win = n.win !== false && n.hw >= 0.7;
  Object.assign(n, { yF, yT: yF + n.hw, gh, eT: (yF + n.hw) / F.tan, eR: (yF + n.hw + gh) / F.tan, F });
  return n;
}

/** triangles ([x, y, z] points, 3 per triangle) of a dormer: front wall + cheeks, roof, window glass; null if it does not fit */
export function dormerParts(bb, r, d) {
  const n = fitDormer(bb, r, d);
  if (!n) return null;
  const { F, at, w, eave, yF, yT, gh, eT, eR } = n, hw2 = w / 2;
  const P = (u, e, y) => {                                         // local -> world (x, y, z) of the roof group
    const a = at + u, b = n.side === 0 ? F.b0 + e : F.b1 - e;
    return F.alongX ? [a, y, b] : [b, y, a];
  };
  const wall = [], roof = [], glass = [];
  const quad = (out, p, q, u, v) => out.push(p, q, u, p, u, v);
  quad(wall, P(-hw2, eave, yF - 0.05), P(hw2, eave, yF - 0.05), P(hw2, eave, yT), P(-hw2, eave, yT));           // front wall
  for (const s of [-1, 1]) wall.push(P(s * hw2, eave, yF - 0.05), P(s * hw2, eave, yT), P(s * hw2, eT, yT));      // cheeks (triangles up to the slope)
  if (n.type === 'flat') {
    quad(roof, P(-hw2 - OVER, eave - OVER, yT), P(hw2 + OVER, eave - OVER, yT), P(hw2 + OVER, eT, yT), P(-hw2 - OVER, eT, yT));
  } else {
    wall.push(P(-hw2, eave, yT), P(hw2, eave, yT), P(0, eave, yT + gh));                                         // gable above the front wall
    for (const s of [-1, 1]) quad(roof, P(s * (hw2 + OVER), eave - OVER, yT - OVER * GABLE_PITCH), P(s * (hw2 + OVER), eT, yT - OVER * GABLE_PITCH),
      P(0, eR, yT + gh), P(0, eave - OVER, yT + gh));                                                            // the two roof planes meet in the ridge
  }
  if (n.win) {                                                     // window pane in front of the wall
    const m = 0.18 * w, sill = 0.22, head = 0.18, e = eave - 0.012;
    quad(glass, P(-hw2 + m, e, yF + sill), P(hw2 - m, e, yF + sill), P(hw2 - m, e, yT - head), P(-hw2 + m, e, yT - head));
  }
  return { wall, roof, glass, fit: n };
}
