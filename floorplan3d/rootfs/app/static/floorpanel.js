/* Floor panel ("Manage floor"): name and kind of the open floor, move it up or down, add a basement or a roof, delete it; for a roof floor the
 * roof (shape, pitch, its own base, overhang, ridge; the overhang at the gables and the gable wall, a shed roof's high side, #628), steps in
 * its eaves (#342), its dormers (gable with its own pitch, flat or a long shed dormer, #339, placed by its distance from the gable) and further roofs
 * (with their ridge kept at 0° or 90°, #621; e.g. a
 * flat roof over an annex, a canopy as a shed roof, #628), its roof windows (#643, skylightui.js). The rules for the base
 * boxes, new floors, moving floors and placing new dormers are pure functions (tested); initFloorPanel draws the panel. */
import { dormerParts, dormerStart, posForStart, DORMER_DEFAULT, DORMER_TYPES, SHED_PITCH, GABLE_PITCH } from './dormer.js';
import { ridgeHeight, pitchFor } from './attic.js';
import { stepsAllowed, alongXOf, MAX_STEPS } from './roofsteps.js';
import { ROOF_TYPES, SHED_HIGH, SHED_PITCH as SHED_ROOF_PITCH, hasGables, gableOverOf, shedHigh, shedHighToward, newCanopy, roofFrame } from './roofshape.js';
import { initSkylightUi } from './skylightui.js';

export const ROOF_DEFAULT = { type: 'gable', pitch: 35, overhang: 0.4 };
/** an empty floor of a kind (a roof floor gets the default roof) */
export const newFloor = (kind, name, id) => ({ id, name, kind, walls: [], rooms: [], devices: [], blocks: [], stairs: [], ...(kind === 'roof' ? { roof: { ...ROOF_DEFAULT } } : {}) });
/** the name a new floor is offered with */
export const floorLabel = (kind, count, t) => (kind === 'basement' ? t('floor.basement') : kind === 'roof' ? t('floor.roof') : `${t('floor.new')} ${count + 1}`);
/** what a shed or flat roof took from roof r (its dormers, steps, roof windows and its steeper pitch): kept beside the roof, not saved, so
 *  that trying a shed roof and going back to the gable roof gives the roof as it was (#669) */
const taken = new WeakMap();
/** a new shape for roof r (main or further roof): a shed roof (#628) has no dormers and no steps, and gets a shed's pitch (10°) when it was
 *  steeper than 25° (a pitch of a gable roof); its high side faces the main roof (base box mb) when it is a further roof (box). Back to a
 *  shape that can have them, what the shed or flat roof took comes back (#669) */
export function setRoofType(r, type, mb = null) {
  const kept = taken.get(r) || {};
  taken.set(r, kept);
  r.type = ROOF_TYPES.includes(type) ? type : 'gable';
  const take = (key) => { if (r[key]?.length) kept[key] = r[key]; delete r[key]; };
  if (r.type === 'flat' || r.type === 'shed') take('dormers');
  else if (kept.dormers && !r.dormers?.length) { r.dormers = kept.dormers; delete kept.dormers; }
  if (r.type === 'flat') take('skylights');                         // a flat roof has no roof windows (#643)
  else if (kept.skylights && !r.skylights?.length) { r.skylights = kept.skylights; delete kept.skylights; }
  if (r.type !== 'shed') {
    if (kept.steps && !r.steps?.length) { r.steps = kept.steps; delete kept.steps; }
    if (kept.pitch != null) { r.pitch = kept.pitch; delete kept.pitch; }
    return r;
  }
  take('steps');
  if ((r.pitch ?? 35) > 25) { kept.pitch = r.pitch ?? 35; r.pitch = SHED_ROOF_PITCH; }
  if (!r.high) r.high = r.box && mb ? shedHighToward(r.box, mb) : 'z0';
  return r;
}
/** a pitch typed by the user: 5° to 70°, nonsense gives 35° */
export const clampPitch = (v) => Math.max(5, Math.min(70, +v || 35));
/** swap floor i with its neighbour above (dir 1) or below (-1); returns the new index of the floor, or null when there is no neighbour */
export function swapFloors(floors, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= floors.length) return null;
  [floors[i], floors[j]] = [floors[j], floors[i]];
  return j;
}
/** edit one side of a base box (left / top keep the size, width / depth move the far edge), never smaller than 1 m */
export function editBox(b, what, v) {
  if (what === 'left') { const w = b.x1 - b.x0; b.x0 = v; b.x1 = v + w; }
  else if (what === 'top') { const d = b.z1 - b.z0; b.z0 = v; b.z1 = v + d; }
  else if (what === 'width') b.x1 = b.x0 + Math.max(1, v);
  else if (what === 'depth') b.z1 = b.z0 + Math.max(1, v);
  if (b.x1 - b.x0 < 1) b.x1 = b.x0 + 1;
  if (b.z1 - b.z0 < 1) b.z1 = b.z0 + 1;
  return b;
}
/** the base of a new further roof: the outline of a floor (walls and rooms), or 4 x 4 m at the origin */
export function boxOf(floor) {
  const pts = floor ? [...floor.walls.flatMap((w) => [w.a, w.b]), ...floor.rooms.flatMap((x) => x.points)] : [];
  if (!pts.length) return { x0: 0, x1: 4, z0: 0, z1: 4 };
  const xs = pts.map((q) => q[0]), zs = pts.map((q) => q[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}
/** the base of the second wing of an L-shaped house (#621) for a further roof next to the main roof (base box mb, ridge along x or not):
 *  the part of floor (its walls and room outlines) that lies beyond one edge of mb, the side with the most of it, inside `limit` (the box
 *  the main roof would have on its own: no terraces and what lies under them). Beside the main roof's long side it reaches into mb up to
 *  the main ridge, so that the two roofs meet in a valley, and its ridge (ridge: 'x' or 'z') runs across the main ridge; beyond its gable
 *  end it gets no ridge (along its longer side). null when nothing of the floor lies beyond mb */
export function wingBox(floor, mb, alongX, limit = null) {
  const segs = [...(floor?.walls || []).map((w) => [w.a, w.b]),
    ...(floor?.rooms || []).flatMap((r) => (r.points?.length >= 3 ? r.points.map((q, i, ps) => [q, ps[(i + 1) % ps.length]]) : []))];
  let best = null;
  for (const [k, sg, edge] of [[1, 1, mb.z1], [1, -1, mb.z0], [0, 1, mb.x1], [0, -1, mb.x0]]) {   // behind, in front, right, left
    const beyond = (q) => sg * (q[k] - edge) > 0.05, pts = [];
    segs.forEach(([a, c]) => {
      const ia = beyond(a), ic = beyond(c);
      if (ia) pts.push(a);
      if (ic) pts.push(c);
      if (ia !== ic) { const u = (edge - a[k]) / (c[k] - a[k]); pts.push([a[0] + u * (c[0] - a[0]), a[1] + u * (c[1] - a[1])]); }   // where it crosses the edge
    });
    if (!pts.length) continue;
    const xs = pts.map((q) => q[0]), zs = pts.map((q) => q[1]);
    const b = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
    if (limit) Object.assign(b, { x0: Math.max(b.x0, limit.x0), x1: Math.min(b.x1, limit.x1), z0: Math.max(b.z0, limit.z0), z1: Math.min(b.z1, limit.z1) });
    if (b.x1 - b.x0 < 0.5 || b.z1 - b.z0 < 0.5) continue;
    const area = (b.x1 - b.x0) * (b.z1 - b.z0);
    if (!best || area > best.area) best = { b, k, sg, edge, area };
  }
  if (!best) return null;
  const { b, k, sg, edge } = best, near = k === 1 ? (sg > 0 ? b.z0 : b.z1) : (sg > 0 ? b.x0 : b.x1);
  if ((k === 1) !== alongX || Math.abs(near - edge) > 0.3) return b;         // beyond its gable end, or standing apart: its own ridge
  const mid = k === 1 ? (mb.z0 + mb.z1) / 2 : (mb.x0 + mb.x1) / 2;          // beside its long side: up to the main ridge
  if (k === 1) { if (sg > 0) b.z0 = mid; else b.z1 = mid; } else if (sg > 0) b.x0 = mid; else b.x1 = mid;
  return { ...b, ridge: alongX ? 'z' : 'x' };
}
/** where the n-th new dormer goes: alternating sides, the middle first, then a quarter and three quarters along */
export const nextDormerSpot = (n) => ({ side: n % 2, pos: [0.5, 0.25, 0.75][Math.floor(n / 2) % 3] });
/** a new width for dormer d on the roof r (base box bb): its start (distance from the gable) stays where it is (#339) */
export function setDormerWidth(bb, r, d, w) {
  const s = bb ? dormerStart(bb, r, d) : null;
  d.w = w;
  if (s != null) d.pos = posForStart(bb, r, d, s);
}
/** a new type for dormer d on the roof r: a shed dormer (#339) stands on the outer wall (its front where the overhang ends) */
export function setDormerType(d, type, r) {
  d.type = type;
  if (type === 'shed') d.eave = Math.max(0.2, r?.overhang ?? 0.4);
}
/** a new step for the eaves of roof r with base box bb (#342): on side A in the middle of the house, 50 cm further out */
export function newStep(bb, r) {
  const len = bb ? (alongXOf(bb, r) ? bb.x1 - bb.x0 : bb.z1 - bb.z0) : 4;
  return { side: 0, at: Math.round(len * 10) / 20, out: 0.5 };
}
/** a pitch typed for the roof of a shed dormer: 2° to 60° (it also stays 3° flatter than the main roof, see fitDormer) */
export const clampShedPitch = (v) => Math.max(2, Math.min(60, +v || SHED_PITCH));
/** a pitch typed for the little roof of a gable dormer (#621): 5° to 60° (a wide one gets flatter by itself, see fitDormer) */
export const clampGablePitch = (v) => Math.max(5, Math.min(60, +v || GABLE_PITCH));
/** the ridge direction chosen for a roof (#621): '' automatic (along the longer side), 'x' (0°) or 'z' (90°); a number typed in degrees
 *  counts too (0 / 180: x, 90 / 270: z) */
export function ridgeOf(v) {
  if (v === 'x' || v === 'z') return v;
  const n = Number(v);
  if (v === '' || v == null || !Number.isFinite(n)) return '';
  return Math.round((((n % 180) + 180) % 180) / 90) % 2 ? 'z' : 'x';
}

/** ctx: $, t, layout(), floor(), floorIdx(), setFloorIdx(i), fields: { field, inp, lenInput }, snapshot(), build(), fitCamera(), buildNav(force),
 *  renderObjList(), scheduleSave(), switchFloor(i), clearSelection(), roofBox(i), autoRoofBox(i), groundIdx(), uid(),
 *  dormerOntoWall(d) (the distance from the eave that puts the dormer's front onto the wall of the room under it, or null; dormerwin.js) */
export function initFloorPanel(ctx) {
  const { $, t } = ctx;
  const { field, inp, lenInput } = ctx.fields;
  const redo = () => { ctx.build(); ctx.scheduleSave(); render(); };
  const selectOf = (...a) => select(...a);                       // (select is defined below)
  const skylights = initSkylightUi({ t, field, inp, lenInput, select: selectOf, snapshot: () => ctx.snapshot(), redo, render: () => render(), uid: () => ctx.uid(),
    roofBox: () => ctx.roofBox(ctx.layout().floors.indexOf(ctx.floor())), knee: () => ctx.floor()?.roof?.knee || 0 });
  function addFloorOf(kind) {
    const layout = ctx.layout();
    const name = prompt(t('floor.namePrompt'), floorLabel(kind, layout.floors.length, t));
    if (!name) return;
    ctx.snapshot();
    if (kind === 'basement') {                                     // a basement goes below everything, the rest on top
      layout.floors.unshift(newFloor(kind, name, ctx.uid()));
      ctx.switchFloor(0);
    } else {
      layout.floors.push(newFloor(kind, name, ctx.uid()));
      ctx.switchFloor(layout.floors.length - 1);
    }
    ctx.scheduleSave();
  }
  function moveFloor(dir) {
    const layout = ctx.layout();
    if (ctx.floorIdx() + dir < 0 || ctx.floorIdx() + dir >= layout.floors.length) return;
    ctx.snapshot();
    ctx.setFloorIdx(swapFloors(layout.floors, ctx.floorIdx(), dir));
    ctx.clearSelection(); ctx.build(); ctx.fitCamera(); ctx.buildNav(true); render(); ctx.renderObjList(); ctx.scheduleSave();
  }
  function deleteFloor() {
    const layout = ctx.layout();
    if (layout.floors.length < 2 || !confirm(t('floor.deleteConfirm'))) return;
    ctx.snapshot();
    layout.floors.splice(ctx.floorIdx(), 1);
    ctx.switchFloor(Math.min(ctx.floorIdx(), layout.floors.length - 1));
    ctx.scheduleSave();
  }
  const boxFields = (into, b) => {
    const edit = (get, what) => lenInput(get, (v) => editBox(b, what, v), { min: -1000 });
    into.append(field(t('roof.left'), edit(() => b.x0, 'left')));
    into.append(field(t('roof.top'), edit(() => b.z0, 'top')));
    into.append(field(t('roof.width'), edit(() => b.x1 - b.x0, 'width')));
    into.append(field(t('roof.depth'), edit(() => b.z1 - b.z0, 'depth')));
  };
  const select = (opts, val, set) => {
    const s = document.createElement('select');
    opts.forEach(([v, l]) => s.add(new Option(l, v)));
    s.value = String(val);
    s.addEventListener('change', () => { ctx.snapshot(); set(s.value); redo(); });
    return s;
  };
  /** the high side of a shed roof (#628): top, bottom, left or right in the plan */
  const highField = (r, id) => {
    const s = select(SHED_HIGH.map((v) => [v, t(`roof.high.${v}`)]), shedHigh(r), (v) => { r.high = v; });
    s.id = id; s.classList.add('roofHigh');
    return field(t('roof.high'), s);
  };
  /** the direction of the ridge (#621): automatic (the longer side: the roof turns by 90° when the other side gets longer), 0° along x or
   *  90° along z; for the main roof and every further roof */
  const ridgeField = (r, id) => {
    const s = select([['', t('roof.auto')], ['x', t('roof.ridge0')], ['z', t('roof.ridge90')]], ridgeOf(r.ridge), (v) => { if (ridgeOf(v)) r.ridge = ridgeOf(v); else delete r.ridge; });
    s.id = id; s.classList.add('roofRidge'); s.title = t('roof.ridgeTip');
    const fl = field(t('roof.ridge'), s); fl.title = t('roof.ridgeTip');
    return fl;
  };
  /** the overhang at the gables (Ortgang) and the gable wall of a gable or shed roof (#628) */
  const gableFields = (into, r, pre) => {
    if (!hasGables(r)) return;
    const go = lenInput(() => gableOverOf(r), (v) => (r.gableOver = Math.max(0, Math.min(3, v))), { min: 0 });
    go.classList.add(`${pre}GableOver`);
    into.append(field(t(r.type === 'shed' ? 'roof.sideOver' : 'roof.gableOver'), go));
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = `${pre}GableWall`; cb.checked = r.gableWall !== false;
    cb.addEventListener('change', () => { ctx.snapshot(); if (cb.checked) delete r.gableWall; else r.gableWall = false; redo(); });
    const row = document.createElement('label'); row.className = 'chk'; row.append(cb, ' ' + t(r.type === 'shed' ? 'roof.gableWallShed' : 'roof.gableWall'));
    into.append(row);
  };
  function render() {
    const box = $('#floorBody');
    if (!box) return;
    box.innerHTML = '';
    const f = ctx.floor(), layout = ctx.layout(), fi = ctx.floorIdx();
    if (!f) return;
    const rowBtn = (id, label, on, disabled = false) => {
      const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.disabled = disabled;
      b.addEventListener('click', on); return b;
    };
    box.append(field(t('prop.name'), inp('text', f.name, (v) => { f.name = v || f.name; ctx.buildNav(true); })));
    const ksel = document.createElement('select'); ksel.id = 'floorKind';
    [['floor', t('floor.kind.floor')], ['basement', t('floor.kind.basement')], ['roof', t('floor.kind.roof')]].forEach(([v, l]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = l; ksel.append(o);
    });
    ksel.value = f.kind || 'floor';
    ksel.addEventListener('change', () => {
      ctx.snapshot(); f.kind = ksel.value;
      if (f.kind === 'roof') f.roof ||= { ...ROOF_DEFAULT };
      ctx.build(); ctx.fitCamera(); ctx.buildNav(true); render(); ctx.scheduleSave();
    });
    box.append(field(t('floor.kind'), ksel));
    const mv = document.createElement('div'); mv.className = 'stopTools';
    mv.append(rowBtn('floorUp', t('floor.up'), () => moveFloor(1), fi >= layout.floors.length - 1),
              rowBtn('floorDown', t('floor.down'), () => moveFloor(-1), fi <= 0));
    box.append(mv);
    const add = document.createElement('div'); add.className = 'stopTools';
    add.append(rowBtn('addBasement', t('floor.addBasement'), () => addFloorOf('basement')),
               rowBtn('addRoof', t('floor.addRoof'), () => addFloorOf('roof')),
               rowBtn('delFloor', t('floor.delete'), deleteFloor, layout.floors.length < 2));
    box.append(add);
    if (f.kind !== 'roof') return;
    const r = (f.roof ||= { ...ROOF_DEFAULT });
    const tsel = document.createElement('select'); tsel.id = 'roofType';
    ROOF_TYPES.forEach((v) => { const o = document.createElement('option'); o.value = v; o.textContent = t(`roof.${v}`); tsel.append(o); });
    tsel.value = r.type || 'gable';
    tsel.addEventListener('change', () => { ctx.snapshot(); setRoofType(r, tsel.value); redo(); });
    box.append(field(t('roof.type'), tsel));
    if (r.type === 'shed') box.append(highField(r, 'roofHigh'));    // which side of a shed roof is high (#628)
    box.append(field(t('roof.pitch'), inp('number', r.pitch ?? 35, (v) => (r.pitch = clampPitch(v)), { step: 1 })));
    const rbb = ctx.roofBox(layout.floors.indexOf(f));
    if (rbb && r.type !== 'flat') {                                // the height of the ridge over the walls (or the knee wall) instead of the pitch (#265)
      const rh = lenInput(() => +ridgeHeight(rbb, r).toFixed(2), (v) => { r.pitch = pitchFor(rbb, r, v); queueMicrotask(render); }, { min: 0.3, step: 0.1 });
      rh.id = 'roofRidgeH';
      box.append(field(t(r.type === 'shed' ? 'roof.highH' : 'roof.ridgeH'), rh));
    }
    const manual = document.createElement('input'); manual.type = 'checkbox'; manual.id = 'roofManual'; manual.checked = !!r.box;
    manual.addEventListener('change', () => {
      ctx.snapshot();
      if (manual.checked) { const a = ctx.autoRoofBox(layout.floors.indexOf(f)); if (a) r.box = { ...a }; } else delete r.box;
      redo();
    });
    const mrow = document.createElement('label'); mrow.className = 'chk'; mrow.append(manual, ' ' + t('roof.manual'));
    box.append(mrow);
    if (r.box) boxFields(box, r.box);
    box.append(field(t('roof.overhang'), lenInput(() => r.overhang ?? 0.4, (v) => (r.overhang = v), { min: 0 })));
    gableFields(box, r, 'roof');
    const attic = document.createElement('input'); attic.type = 'checkbox'; attic.id = 'roofAttic'; attic.checked = r.knee != null;   // a lived-in attic (#260)
    attic.addEventListener('change', () => { ctx.snapshot(); if (attic.checked) r.knee = 1; else delete r.knee; redo(); });
    const arow = document.createElement('label'); arow.className = 'chk'; arow.append(attic, ' ' + t('roof.attic'));
    box.append(arow);
    if (r.knee != null) {
      box.append(field(t('roof.knee'), lenInput(() => r.knee, (v) => (r.knee = Math.max(0, v)), { min: 0, step: 0.1 })));
      const fi = layout.floors.indexOf(f), below = layout.floors.map((x, i) => [x, i]).filter(([x, i]) => i < fi && x.kind !== 'roof');
      const bsel = select(below.map(([x]) => [x.id, x.name]).reverse(), r.base && below.some(([x]) => x.id === r.base) ? r.base : below.at(-1)?.[0].id ?? '',
        (v) => { if (v === below.at(-1)?.[0].id) delete r.base; else r.base = v; });   // several storeys under the slopes (#265)
      bsel.id = 'roofBase';
      box.append(field(t('roof.base'), bsel));
    }
    const ahelp = document.createElement('p'); ahelp.className = 'sub'; ahelp.id = 'roofAtticHelp'; ahelp.textContent = t('roof.atticHelp'); box.append(ahelp);
    if (r.type !== 'shed') box.append(ridgeField(r, 'roofRidge'));   // a shed roof has its high side instead (#628)
    renderSteps(box, f, r);
    renderDormers(box, f, r);
    skylights.render(box, f, r);                                   // roof windows without a dormer (#643)
    renderRoofParts(box, r);
  }
  /** steps in the eaves (#342): a house that is narrower at the front and wider at the back; one card per step */
  function renderSteps(box, f, r) {
    const head = document.createElement('h4'); head.id = 'roofStepsHead'; head.textContent = t('roof.steps'); box.append(head);
    const help = document.createElement('p'); help.className = 'sub'; help.id = 'roofStepsHelp'; help.textContent = t(stepsAllowed(r) ? 'roof.stepsHelp' : r.type === 'shed' ? 'roof.stepsShed' : 'roof.stepsHip'); box.append(help);
    if (!stepsAllowed(r)) return;
    const bb = ctx.roofBox(ctx.layout().floors.indexOf(f));
    (r.steps || []).forEach((st, i) => {
      const card = document.createElement('div'); card.className = 'dormerCard roofStepCard';
      const cap = document.createElement('b'); cap.className = 'dormerCap'; cap.textContent = `${t('roof.stepOne')} ${i + 1}`; card.append(cap);
      card.append(field(t('dormer.side'), select([[0, t('dormer.sideA')], [1, t('dormer.sideB')]], st.side === 1 ? 1 : 0, (v) => { st.side = +v; })));
      const at = lenInput(() => +st.at || 0, (v) => { st.at = v; }, { min: 0 }); at.className = 'roofStepAt';
      card.append(field(t('roof.stepAt'), at));
      const out = lenInput(() => +st.out || 0, (v) => { st.out = v; }, { min: -20 }); out.className = 'roofStepOut';
      card.append(field(t('roof.stepOut'), out));
      const del = document.createElement('button'); del.type = 'button'; del.className = 'roofPartDel'; del.textContent = '×'; del.title = t('roof.stepRemove');
      del.addEventListener('click', () => { ctx.snapshot(); r.steps.splice(i, 1); if (!r.steps.length) delete r.steps; redo(); });
      card.append(del);
      box.append(card);
    });
    const add = document.createElement('button'); add.type = 'button'; add.id = 'addRoofStep'; add.textContent = t('roof.stepAdd');
    add.disabled = (r.steps || []).length >= MAX_STEPS;
    add.addEventListener('click', () => { ctx.snapshot(); (r.steps ||= []).push(newStep(bb, r)); redo(); });
    box.append(add);
  }
  /** further roofs of the house (#125): one card per roof, with its own shape, base and the floor it sits on */
  function renderRoofParts(box, r) {
    const layout = ctx.layout();
    const head = document.createElement('h4'); head.id = 'roofPartsHead'; head.textContent = t('roof.parts'); box.append(head);
    const help = document.createElement('p'); help.className = 'sub'; help.id = 'roofPartsHelp'; help.textContent = t('roof.partsHelp'); box.append(help);
    const levels = layout.floors.filter((x) => x.kind !== 'roof');
    (r.parts ||= []).forEach((p, i) => {
      const card = document.createElement('div'); card.className = 'dormerCard roofPartCard';
      const cap = document.createElement('b'); cap.className = 'dormerCap'; cap.textContent = p.name || `${t('roof.partOne')} ${i + 1}`; card.append(cap);
      card.append(field(t('roof.partName'), inp('text', p.name || '', (v) => { p.name = String(v).slice(0, 40); }, {})));
      const mb = ctx.roofBox(layout.floors.indexOf(ctx.floor()));
      const tsel = select(ROOF_TYPES.map((v) => [v, t(`roof.${v}`)]), p.type || 'gable', (v) => setRoofType(p, v, mb));
      tsel.className = 'roofPartType';
      card.append(field(t('roof.type'), tsel));
      if (p.type === 'shed') card.append(highField(p, `roofPartHigh${i}`));   // which side is high (#628)
      else if (p.type !== 'flat') card.append(ridgeField(p, `roofPartRidge${i}`));   // its ridge kept at 0° or 90° (#621)
      card.append(field(t('roof.pitch'), inp('number', p.pitch ?? 35, (v) => (p.pitch = clampPitch(v)), { step: 1 })));
      const lsel = select([['main', t('roof.partMain')], ['', t('roof.partTop')], ...levels.map((x) => [x.id, x.name])], p.level || '', (v) => { if (v) p.level = v; else delete p.level; });
      lsel.className = 'roofPartLevel';                            // 'main': as high as the main roof, on its knee wall too (an L-shaped house, #621)
      card.append(field(t('roof.partLevel'), lsel));
      const dy = lenInput(() => +p.dy || 0, (v) => { if (v) p.dy = Math.max(-10, Math.min(10, v)); else delete p.dy; }, { min: -10, step: 0.1 });
      dy.className = 'roofPartDy';                                 // moved up or down by hand (#628): a canopy just under the eave
      card.append(field(t('roof.partDy'), dy));
      boxFields(card, (p.box ||= { x0: 0, x1: 4, z0: 0, z1: 4 }));
      card.append(field(t('roof.overhang'), lenInput(() => p.overhang ?? 0.4, (v) => (p.overhang = v), { min: 0 })));
      gableFields(card, p, 'roofPart');
      const del = document.createElement('button'); del.type = 'button'; del.className = 'roofPartDel'; del.textContent = '×'; del.title = t('roof.partRemove');
      del.addEventListener('click', () => { ctx.snapshot(); r.parts.splice(i, 1); redo(); });
      card.append(del);
      box.append(card);
    });
    const add = document.createElement('button'); add.type = 'button'; add.id = 'addRoofPart'; add.textContent = t('roof.partAdd');
    add.addEventListener('click', () => {
      ctx.snapshot();
      const lv = layout.floors[ctx.groundIdx()];
      const ri = layout.floors.indexOf(ctx.floor()), mb = ctx.roofBox(ri);
      const wing = r.box && mb ? wingBox(lv, mb, alongXOf(mb, r), ctx.autoRoofBox(ri)) : null;   // the main roof covers only a part of the house: the other wing of an L (#621)
      if (wing) {
        const { ridge, ...box } = wing;
        const along = ridge || (box.x1 - box.x0 >= box.z1 - box.z0 ? 'x' : 'z');   // kept: it no longer turns when its size changes (#621)
        r.parts.push({ id: `rp${ctx.uid()}`, type: r.type === 'flat' ? 'gable' : r.type || 'gable', pitch: r.pitch ?? 35, overhang: r.overhang ?? 0.4, box, ridge: along, level: 'main' });
      } else r.parts.push({ id: `rp${ctx.uid()}`, type: 'flat', pitch: 35, overhang: 0.4, box: boxOf(lv), ...(lv ? { level: lv.id } : {}) });   // an annex
      redo();
    });
    box.append(add);
    const mb = ctx.roofBox(layout.floors.indexOf(ctx.floor()));
    const can = document.createElement('button'); can.type = 'button'; can.id = 'addCanopy'; can.textContent = t('roof.canopyAdd');
    can.disabled = !mb;
    can.addEventListener('click', () => {                          // a canopy in front of the house (#628): a shed roof under the eave
      ctx.snapshot();
      r.parts.push({ ...newCanopy(mb, roofFrame(mb, r).alongX, `rp${ctx.uid()}`), name: t('roof.canopy') });
      redo();
    });
    box.append(can);
    const ch = document.createElement('p'); ch.className = 'sub'; ch.id = 'canopyHelp'; ch.textContent = t('roof.canopyHelp'); box.append(ch);
  }
  /** roof dormers: one card per dormer in the panel of the roof floor */
  function renderDormers(box, f, r) {
    const head = document.createElement('h4'); head.id = 'dormerHead'; head.textContent = t('dormer.title'); box.append(head);
    if (r.type === 'flat' || r.type === 'shed') { const p = document.createElement('p'); p.className = 'sub'; p.textContent = t(r.type === 'shed' ? 'dormer.noShed' : 'dormer.noFlat'); box.append(p); return; }
    (r.dormers ||= []).forEach((d, i) => {
      const card = document.createElement('div'); card.className = 'dormerCard';
      const bb = ctx.roofBox(ctx.layout().floors.indexOf(f)), fit = bb ? dormerParts(bb, r, d) : null;
      const cap = document.createElement('b'); cap.className = 'dormerCap'; cap.textContent = `${t('dormer.one')} ${i + 1}`; card.append(cap);
      card.append(field(t('dormer.side'), select([[0, t('dormer.sideA')], [1, t('dormer.sideB')]], d.side === 1 ? 1 : 0, (v) => { d.side = +v; })));
      const pos = inp('range', Math.round((d.pos ?? 0.5) * 100), (v) => { d.pos = Math.max(0, Math.min(1, +v / 100)); queueMicrotask(render); }, { min: 0, max: 100, step: 1 });
      card.append(field(t('dormer.pos'), pos));
      if (fit) {                                                   // where it begins, in metres from the gable (#339)
        const st = lenInput(() => dormerStart(bb, r, d), (v) => { d.pos = posForStart(bb, r, d, v); queueMicrotask(render); }, { min: 0 });
        st.className = 'dormerStart'; st.title = t('dormer.startTip');
        card.append(field(t('dormer.start'), st));
      }
      const wd = lenInput(() => d.w ?? DORMER_DEFAULT.w, (v) => { setDormerWidth(bb, r, d, v); queueMicrotask(render); }, { min: 0.6 });
      wd.className = 'dormerWidth';
      card.append(field(t('dormer.width'), wd));
      card.append(field(t('dormer.height'), lenInput(() => d.hw ?? DORMER_DEFAULT.hw, (v) => { d.hw = v; if (d.type === 'shed') queueMicrotask(render); }, { min: 0.4 })));   // a shed dormer's pitch shown follows its wall (42.4)
      card.append(field(t('dormer.eave'), lenInput(() => d.eave ?? DORMER_DEFAULT.eave, (v) => { d.eave = v; }, { min: 0.2 })));
      const ty = select(DORMER_TYPES.map((v) => [v, t(`dormer.${v}`)]), d.type || 'gable', (v) => setDormerType(d, v, r));
      ty.className = 'dormerType';
      card.append(field(t('dormer.type'), ty));
      if (d.type === 'shed') {                                     // the pitch of its own roof, and what it is
        const sp = inp('number', fit?.fit.sp ?? d.sp ?? SHED_PITCH, (v) => { d.sp = clampShedPitch(v); queueMicrotask(render); }, { step: 1, min: 2, max: 60 });
        sp.className = 'dormerShedPitch';
        card.append(field(t('dormer.shedPitch'), sp));
        const hint = document.createElement('p'); hint.className = 'sub dormerShedHint'; hint.textContent = t('dormer.shedHint'); card.append(hint);
      } else if ((d.type || 'gable') === 'gable') {                // the pitch of its little roof (#621), flatter by itself when it is wide
        const gp = inp('number', fit?.fit.gp ?? d.gp ?? GABLE_PITCH, (v) => { d.gp = clampGablePitch(v); queueMicrotask(render); }, { step: 1, min: 5, max: 60 });
        gp.className = 'dormerGablePitch';
        card.append(field(t('dormer.gablePitch'), gp));
        if (fit && fit.fit.gp < clampGablePitch(d.gp) - 0.05) { const hint = document.createElement('p'); hint.className = 'sub dormerGableHint'; hint.textContent = t('dormer.gableHint'); card.append(hint); }
      }
      const win = document.createElement('input'); win.type = 'checkbox'; win.checked = d.win !== false;
      win.addEventListener('change', () => { ctx.snapshot(); d.win = win.checked; ctx.build(); ctx.scheduleSave(); });
      card.append(field(t('dormer.window'), win));
      if (d.win !== false && d.window) {                           // where the window sits: in the wall of the room under it (#275) or in the dormer's front
        const where = document.createElement('p'); where.className = 'sub dormerWhere'; where.textContent = t(d.hostWall ? 'dormer.inWall' : 'dormer.inFront'); card.append(where);
        if (!d.hostWall) {
          const onto = document.createElement('button'); onto.type = 'button'; onto.className = 'dormerOnWall'; onto.textContent = t('dormer.onWall'); onto.title = t('dormer.onWallTip');
          onto.addEventListener('click', () => {
            const e = ctx.dormerOntoWall(d);
            if (e == null) { where.textContent = t('dormer.noWall'); return; }
            ctx.snapshot(); d.eave = e; redo();
          });
          card.append(onto);
        }
      }
      const del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.title = t('dormer.remove');
      del.addEventListener('click', () => { ctx.snapshot(); r.dormers.splice(i, 1); redo(); });
      card.append(del);
      if (!fit) { const w = document.createElement('p'); w.className = 'sub warn'; w.textContent = t('dormer.noFit'); card.append(w); }
      box.append(card);
    });
    const add = document.createElement('button'); add.type = 'button'; add.id = 'addDormer'; add.textContent = t('dormer.add');
    add.addEventListener('click', () => {
      ctx.snapshot();
      r.dormers.push({ id: ctx.uid(), ...DORMER_DEFAULT, ...nextDormerSpot(r.dormers.length) });
      redo();
    });
    box.append(add);
  }
  $('#addFloor').addEventListener('click', () => addFloorOf('floor'));
  return { render, addFloorOf, moveFloor, deleteFloor };
}
