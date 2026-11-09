/* Ready-made roofs (5.1.0, the owner's choice of 2026-11-09: picture 5 in docs/ideen-5.1/, „bei fertige Dächer hätte ich auch gerne ein L
 * Dach oder auch ein + Dach“): one tap sets the shape, the pitch and the dormers of the roof over the house as it is; an L roof gets a wing
 * across the main ridge at one end (from the ridge to side A: its gable in the front wall), a cross roof („+“) a second gable roof across
 * the middle (its gables in the front and the back wall), „with a canopy“ a shed roof in front of the house. Further roofs a template made
 * (tpl: true) go when another template is chosen; the user's own further roofs, roof windows and solar panels stay. Own roofs can be kept
 * („⭐ Mein Dach merken“: the settings, also for another house). Pure (unit test: tests/rooftemplates.test.mjs). */
import { setRoofType } from './floorpanel.js';
import { roofFrame, newCanopy } from './roofshape.js';
import { DORMER_DEFAULT, DORMER_TYPES } from './dormer.js';

/** the ready-made roofs, in the order shown: key, the little picture (roofeditui.js), the shape and pitch */
export const TEMPLATES = [
  { key: 'gable', pic: 'gable', type: 'gable', pitch: 35 },
  { key: 'dormers', pic: 'dormers', type: 'gable', pitch: 38, dormers: 2 },
  { key: 'hip', pic: 'hip', type: 'hip', pitch: 30 },
  { key: 'shed', pic: 'shed', type: 'shed', pitch: 10 },
  { key: 'flat', pic: 'flat', type: 'flat', pitch: 35 },
  { key: 'lshape', pic: 'lshape', type: 'gable', pitch: 35, wing: 'l' },
  { key: 'cross', pic: 'cross', type: 'gable', pitch: 35, wing: 'cross' },
  { key: 'canopy', pic: 'canopy', type: 'gable', pitch: 35, canopy: true },
];
export const MAX_OWN = 12;

const r2 = (v) => Math.round(v * 100) / 100;
/** the wing of an L roof or the cross gable of a „+“ roof over base box bb (the main roof r with its ridge along alongX): its box and ridge.
 *  Its width along the main ridge stays below the depth of the house, so its ridge is lower than the main ridge and the roofs meet in valleys */
export function wingOf(bb, r, kind) {
  const F = roofFrame(bb, { ...r, type: 'gable' }), A = F.alongX;
  const [a0, a1, b0, b1] = A ? [bb.x0, bb.x1, bb.z0, bb.z1] : [bb.z0, bb.z1, bb.x0, bb.x1];
  const L = a1 - a0, D = b1 - b0, mid = (b0 + b1) / 2;
  const w = r2(Math.max(1, Math.min(D * 0.85, L * (kind === 'cross' ? 0.45 : 0.4))));
  const [p0, p1] = kind === 'cross' ? [r2((a0 + a1) / 2 - w / 2), r2((a0 + a1) / 2 + w / 2)] : [r2(a1 - w), a1];
  const [q0, q1] = kind === 'cross' ? [b0, b1] : [b0, mid];
  const box = A ? { x0: p0, x1: p1, z0: q0, z1: q1 } : { x0: q0, x1: q1, z0: p0, z1: p1 };
  return { box, ridge: A ? 'z' : 'x' };
}

/** put template `key` onto roof r (main roof of a roof floor) over base box bb; uid() gives new ids, name(key) the name of a further roof.
 *  Returns r; unknown key: nothing changes */
export function applyTemplate(r, key, bb, uid = () => String(Math.random()).slice(2, 9), name = (k) => k) {
  const T = TEMPLATES.find((x) => x.key === key);
  if (!T || !r) return r;
  setRoofType(r, T.type);
  r.pitch = T.pitch;
  if (T.type === 'shed') r.high ||= 'z0';
  if (r.overhang == null) r.overhang = 0.5;
  if (T.dormers && T.type === 'gable') {
    const list = (r.dormers ||= []);
    for (let i = list.length; i < T.dormers; i++) list.push({ id: uid(), ...DORMER_DEFAULT, side: 0, pos: [0.25, 0.75][i] ?? 0.5 });
  }
  const own = (r.parts || []).filter((p) => !p.tpl);
  const made = [];
  if (bb && T.wing) {
    const { box, ridge } = wingOf(bb, r, T.wing);
    made.push({ id: `rp${uid()}`, tpl: true, name: name(T.key), type: 'gable', pitch: T.pitch, overhang: r.overhang ?? 0.5, box, ridge, level: 'main' });
  }
  if (bb && T.canopy) made.push({ ...newCanopy(bb, roofFrame(bb, r).alongX, `rp${uid()}`), tpl: true, name: name(T.key) });
  if (own.length || made.length) r.parts = [...own, ...made]; else delete r.parts;
  return r;
}

const num = (v, lo, hi) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : undefined);
/** what is kept of roof r as an own template: its shape and its dormers (no ids, no windows of their own) */
export function ownRoof(r) {
  const out = { type: ['gable', 'hip', 'flat', 'shed'].includes(r?.type) ? r.type : 'gable', pitch: num(r?.pitch ?? 35, 5, 70) };
  const o = num(r?.overhang, 0, 3); if (o != null) out.overhang = o;
  const g = num(r?.gableOver, 0, 3); if (g != null) out.gableOver = g;
  if (r?.gableWall === false) out.gableWall = false;
  if (r?.ridge === 'x' || r?.ridge === 'z') out.ridge = r.ridge;
  if (['z0', 'z1', 'x0', 'x1'].includes(r?.high)) out.high = r.high;
  if (r?.knee != null) out.knee = num(r.knee, 0, 3) ?? 1;
  const ds = (r?.dormers || []).slice(0, 20).map((d) => {
    const x = { side: d.side === 1 ? 1 : 0, type: DORMER_TYPES.includes(d.type) ? d.type : 'gable' };
    for (const [k, lo, hi] of [['pos', 0, 1], ['w', 0.6, 30], ['hw', 0.4, 3], ['eave', 0.2, 20], ['gp', 5, 60], ['sp', 2, 60]]) { const v = num(d[k], lo, hi); if (v != null) x[k] = v; }
    if (d.win === false) x.win = false;
    return x;
  });
  if (ds.length) out.dormers = ds;
  return out;
}
/** put an own template (from ownRoof) onto roof r: shape, pitch, overhangs, knee wall and dormers as kept; the roof windows, solar panels
 *  and the user's own further roofs stay */
export function applyOwn(r, kept, uid = () => String(Math.random()).slice(2, 9)) {
  if (!r || !kept) return r;
  const k = ownRoof(kept);
  setRoofType(r, k.type);
  for (const key of ['pitch', 'overhang', 'gableOver', 'ridge', 'high']) { if (k[key] != null) r[key] = k[key]; else if (key !== 'pitch' && key !== 'overhang') delete r[key]; }
  if (k.gableWall === false) r.gableWall = false; else delete r.gableWall;
  if (k.knee != null) r.knee = k.knee; else delete r.knee;
  if (k.dormers && k.type !== 'flat' && k.type !== 'shed') r.dormers = k.dormers.map((d) => ({ id: uid(), ...d })); else if (k.type === 'gable' || k.type === 'hip') delete r.dormers;
  const own = (r.parts || []).filter((p) => !p.tpl);
  if (own.length) r.parts = own; else delete r.parts;
  return r;
}
/** the list of own templates kept in the settings, cleaned: [{ name, roof }], at most MAX_OWN */
export const cleanOwn = (list) => (Array.isArray(list) ? list : []).filter((x) => x && typeof x.name === 'string' && x.name.trim() && x.roof && typeof x.roof === 'object')
  .slice(0, MAX_OWN).map((x) => ({ name: x.name.trim().slice(0, 40), roof: ownRoof(x.roof) }));
