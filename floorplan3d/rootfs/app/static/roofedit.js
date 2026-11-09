/* The new roof editor (5.1.0, the owner's choice of 2026-11-09: pictures 1 to 4 in docs/ideen-5.1/): the roof seen from the side (knee
 * wall, pitch, ridge, overhang, where one can stand upright) with points to drag, and the roof seen from above (both slopes, the ridge,
 * the dormers, the roof windows, the solar panels) where a dormer or a roof window is dragged instead of typing its distance from the
 * gable. Pure (unit test: tests/roofedit.test.mjs): what is drawn where, and what a drag changes. The drawing is in roofeditui.js. */
import { roofFrame } from './roofshape.js';
import { fitDormer } from './dormer.js';
import { fitSkylight, posForStart as skyPosForStart } from './skylight.js';
import { posForStart as dormerPosForStart } from './dormer.js';
import { ridgeHeight, pitchFor } from './attic.js';
import { solarField } from './solarroof.js';

const r2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** the height under the roof one can stand upright in (m) */
export const STAND = 2;

/** the roof r over base box bb seen from the side, across the ridge: { type, depth (the house, wall to wall), knee (null: not lived in),
 *  pitch, over (the overhang at the eaves), rise (the ridge over the knee wall or the walls; a shed roof: its high side), stand (how wide
 *  one can stand upright, null without a lived-in attic) }; null without a base box */
export function profileOf(bb, r) {
  if (!bb || !r) return null;
  const type = ['gable', 'hip', 'flat', 'shed'].includes(r.type) ? r.type : 'gable';
  const F = roofFrame(bb, r), over = r.overhang ?? 0.4;
  const depth = type === 'shed' ? F.half - over : F.b1 - F.b0 - 2 * over;
  const knee = r.knee != null ? Math.max(0, +r.knee || 0) : null;
  const rise = type === 'flat' ? 0 : ridgeHeight(bb, r), tan = type === 'flat' ? 0 : F.tan;
  let stand = null;
  if (knee != null && type !== 'flat') {
    const d0 = Math.max(0, (STAND - knee) / (tan || 1));             // from a wall to where the slope is 2 m over the floor
    stand = knee + rise < STAND - 1e-9 ? 0 : Math.max(0, type === 'shed' ? depth - d0 : depth - 2 * d0);
  } else if (knee != null) stand = knee >= STAND ? depth : 0;
  return { type, depth: r2(depth), knee, pitch: r.pitch ?? 35, over, rise: r2(rise), stand: stand == null ? null : r2(stand) };
}

/** a point dragged on the side view, relative to the top of the left wall (dx to the inside, dy up, metres) gives the pitch: 5° to 70° */
export const pitchAt = (dx, dy) => clamp(Math.round((Math.atan2(Math.max(0, dy), Math.max(0.01, dx)) * 180) / Math.PI), 5, 70);
/** the knee wall dragged to height y (m): 0 to 3 m, in 5 cm steps */
export const kneeAt = (y) => clamp(Math.round(y * 20) / 20, 0, 3);
/** the eave dragged out to x m beyond the wall: 0 to 2 m, in 5 cm steps */
export const overAt = (x) => clamp(Math.round(x * 20) / 20, 0, 2);
/** the ridge dragged to h m over the knee wall: the pitch that gives it (attic.js) */
export const pitchForRise = (bb, r, h) => Math.round(pitchFor(bb, r, Math.max(0.3, h)));

/** the roof seen from above, in the plan's x / z: { alongX, outline {x0, x1, z0, z1} (with the overhangs), house (the base box), ridge
 *  [[x, z], [x, z]] (a hip roof: shorter; a shed roof: its high edge; a flat roof: null), sides: where „A“ and „B“ are written, dormers
 *  [{ i, type, side, rect {x0, x1, z0, z1}, front [[x, z], [x, z]] } | { i, fit: false }], skylights [{ i, side, rect } | { i, fit: false }] } */
export function roofMap(bb, r) {
  if (!bb || !r) return null;
  const F = roofFrame(bb, r), A = F.alongX;
  const XZ = (a, b) => (A ? [a, b] : [b, a]);
  const rect = (a0, a1, b0, b1) => { const [x0, z0] = XZ(Math.min(a0, a1), Math.min(b0, b1)), [x1, z1] = XZ(Math.max(a0, a1), Math.max(b0, b1)); return { x0: r2(x0), x1: r2(x1), z0: r2(z0), z1: r2(z1) }; };
  let ridge = null;
  if (F.shed) ridge = [XZ(F.a0, F.bc), XZ(F.a1, F.bc)];
  else if (!F.flat) ridge = [XZ(F.a0 + F.ins, F.bc), XZ(F.a1 - F.ins, F.bc)];
  const sides = F.flat ? [] : F.shed ? [{ side: F.hi ? 1 : 0, at: XZ((F.a0 + F.a1) / 2, (F.b0 + F.b1) / 2) }]
    : [{ side: 0, at: XZ((F.a0 + F.a1) / 2, (F.b0 + F.bc) / 2) }, { side: 1, at: XZ((F.a0 + F.a1) / 2, (F.bc + F.b1) / 2) }];
  const dormers = (r.dormers || []).map((d, i) => {
    const n = fitDormer(bb, r, d);
    if (!n) return { i, fit: false };
    const b = (e) => (n.side === 0 ? n.F.b0 + e : n.F.b1 - e);
    return { i, type: n.type, side: n.side, at: n.at, eave: n.eave, w: n.w, rect: rect(n.at + n.u0, n.at + n.u1, b(n.eave), b(n.eR)), front: [XZ(n.at + n.u0, b(n.eave)), XZ(n.at + n.u1, b(n.eave))] };
  });
  const skylights = (r.skylights || []).map((s, i) => {
    const n = fitSkylight(bb, r, s);
    if (!n) return { i, fit: false };
    const b = (e) => (n.side === 0 ? n.F.b0 + e : n.F.b1 - e);
    return { i, side: n.side, at: n.at, eave: n.e0, w: n.w, rect: rect(n.a0, n.a1, b(n.e0), b(n.e1)) };
  });
  return { alongX: A, outline: { x0: F.x0, x1: F.x1, z0: F.z0, z1: F.z1 }, house: { ...bb }, ridge, sides, dormers, skylights, hip: r.type === 'hip' ? F.ins : 0, flat: F.flat, shed: F.shed };
}
/** solar panels lying in the outline o of the roof: [{ id, x, z, w, d, rot, n }] (a field of panels, its size from solarroof.js) */
export function solarOn(devices, o) {
  return (devices || []).filter((d) => d.type === 'solarpanel' && Number.isFinite(d.x) && Number.isFinite(d.z) && d.x >= o.x0 && d.x <= o.x1 && d.z >= o.z0 && d.z <= o.z1)
    .map((d) => { const fl = solarField(d); return { id: d.id, x: d.x, z: d.z, w: fl.w, d: fl.d, rot: +d.rot || 0, n: fl.cols * fl.rows, cols: fl.cols, rows: fl.rows }; });
}

/** a plan move (dx, dz) as a move along the ridge (da) and across it (db) */
export const alongAcross = (alongX, dx, dz) => (alongX ? { da: dx, db: dz } : { da: dz, db: dx });
/** dormer d dragged from where it was (start: { at, eave } from roofMap) by da along the ridge and db across: its pos (its start from the
 *  gable, dormer.js) and its distance from the eave change; side: 0 (the eave at b0: across grows into the roof) or 1 */
export function dragDormer(bb, r, d, start, da, db) {
  const F = roofFrame(bb, r), h0 = F.alongX ? bb.x0 : bb.z0;
  const w = d.w ?? fitDormer(bb, r, d)?.w ?? 1.6;
  d.pos = r2(dormerPosForStart(bb, r, d, start.at + da - w / 2 - h0) * 100) / 100;
  if (db) d.eave = Math.max(0.2, r2(start.eave + (d.side === 1 ? -db : db)));
  return d;
}
/** roof window s dragged the same way (skylight.js) */
export function dragSkylight(bb, r, s, start, da, db) {
  const F = roofFrame(bb, r), h0 = F.alongX ? bb.x0 : bb.z0;
  const w = s.w ?? 0.78;
  s.pos = r2(skyPosForStart(bb, r, s, start.at + da - w / 2 - h0) * 100) / 100;
  if (db) s.eave = Math.max(0.05, r2(start.eave + (fitSkylight(bb, r, s)?.side === 1 ? -db : db)));
  return s;
}
/** what the head of the editor says: the shape, the pitch, the size of the house under it; and the counts for its chips */
export function roofSummary(bb, r, devices = []) {
  const m = bb ? roofMap(bb, r) : null;
  return {
    type: r?.type || 'gable', pitch: r?.pitch ?? 35, w: bb ? r2(bb.x1 - bb.x0) : 0, d: bb ? r2(bb.z1 - bb.z0) : 0,
    dormers: (r?.dormers || []).length, skylights: (r?.skylights || []).length, parts: (r?.parts || []).length,
    solar: m ? solarOn(devices, m.outline).reduce((n, s) => n + s.n, 0) : 0, attic: r?.knee != null,
  };
}
