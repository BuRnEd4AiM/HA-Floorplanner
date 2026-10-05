/* Floor panel ("Manage floor"): name and kind of the open floor, move it up or down, add a basement or a roof, delete it; for a roof floor the
 * roof (shape, pitch, its own base, overhang, ridge), its dormers and further roofs (e.g. a flat roof over an annex). The rules for the base
 * boxes, new floors, moving floors and placing new dormers are pure functions (tested); initFloorPanel draws the panel. */
import { dormerParts, DORMER_DEFAULT, DORMER_TYPES } from './dormer.js';

export const ROOF_DEFAULT = { type: 'gable', pitch: 35, overhang: 0.4 };
/** an empty floor of a kind (a roof floor gets the default roof) */
export const newFloor = (kind, name, id) => ({ id, name, kind, walls: [], rooms: [], devices: [], blocks: [], stairs: [], ...(kind === 'roof' ? { roof: { ...ROOF_DEFAULT } } : {}) });
/** the name a new floor is offered with */
export const floorLabel = (kind, count, t) => (kind === 'basement' ? t('floor.basement') : kind === 'roof' ? t('floor.roof') : `${t('floor.new')} ${count + 1}`);
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
/** where the n-th new dormer goes: alternating sides, the middle first, then a quarter and three quarters along */
export const nextDormerSpot = (n) => ({ side: n % 2, pos: [0.5, 0.25, 0.75][Math.floor(n / 2) % 3] });

/** ctx: $, t, layout(), floor(), floorIdx(), setFloorIdx(i), fields: { field, inp, lenInput }, snapshot(), build(), fitCamera(), buildNav(force),
 *  renderObjList(), scheduleSave(), switchFloor(i), clearSelection(), roofBox(i), autoRoofBox(i), groundIdx(), uid() */
export function initFloorPanel(ctx) {
  const { $, t } = ctx;
  const { field, inp, lenInput } = ctx.fields;
  const redo = () => { ctx.build(); ctx.scheduleSave(); render(); };
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
    ['gable', 'hip', 'flat'].forEach((v) => { const o = document.createElement('option'); o.value = v; o.textContent = t(`roof.${v}`); tsel.append(o); });
    tsel.value = r.type || 'gable';
    tsel.addEventListener('change', () => { ctx.snapshot(); r.type = tsel.value; redo(); });
    box.append(field(t('roof.type'), tsel));
    box.append(field(t('roof.pitch'), inp('number', r.pitch ?? 35, (v) => (r.pitch = clampPitch(v)), { step: 1 })));
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
    const rsel = document.createElement('select'); rsel.id = 'roofRidge';
    [['', t('roof.auto')], ['x', 'X'], ['z', 'Z']].forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; rsel.append(o); });
    rsel.value = r.ridge || '';
    rsel.addEventListener('change', () => { ctx.snapshot(); r.ridge = rsel.value || undefined; ctx.build(); ctx.scheduleSave(); });
    box.append(field(t('roof.ridge'), rsel));
    renderDormers(box, f, r);
    renderRoofParts(box, r);
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
      card.append(field(t('roof.type'), select(['gable', 'hip', 'flat'].map((v) => [v, t(`roof.${v}`)]), p.type || 'gable', (v) => { p.type = v; if (v === 'flat') delete p.dormers; })));
      card.append(field(t('roof.pitch'), inp('number', p.pitch ?? 35, (v) => (p.pitch = clampPitch(v)), { step: 1 })));
      card.append(field(t('roof.partLevel'), select([['', t('roof.partTop')], ...levels.map((x) => [x.id, x.name])], p.level || '', (v) => { if (v) p.level = v; else delete p.level; })));
      boxFields(card, (p.box ||= { x0: 0, x1: 4, z0: 0, z1: 4 }));
      card.append(field(t('roof.overhang'), lenInput(() => p.overhang ?? 0.4, (v) => (p.overhang = v), { min: 0 })));
      const del = document.createElement('button'); del.type = 'button'; del.className = 'roofPartDel'; del.textContent = '×'; del.title = t('roof.partRemove');
      del.addEventListener('click', () => { ctx.snapshot(); r.parts.splice(i, 1); redo(); });
      card.append(del);
      box.append(card);
    });
    const add = document.createElement('button'); add.type = 'button'; add.id = 'addRoofPart'; add.textContent = t('roof.partAdd');
    add.addEventListener('click', () => {
      ctx.snapshot();
      const lv = layout.floors[ctx.groundIdx()];
      r.parts.push({ id: `rp${ctx.uid()}`, type: 'flat', pitch: 35, overhang: 0.4, box: boxOf(lv), ...(lv ? { level: lv.id } : {}) });
      redo();
    });
    box.append(add);
  }
  /** roof dormers: one card per dormer in the panel of the roof floor */
  function renderDormers(box, f, r) {
    const head = document.createElement('h4'); head.id = 'dormerHead'; head.textContent = t('dormer.title'); box.append(head);
    if (r.type === 'flat') { const p = document.createElement('p'); p.className = 'sub'; p.textContent = t('dormer.noFlat'); box.append(p); return; }
    (r.dormers ||= []).forEach((d, i) => {
      const card = document.createElement('div'); card.className = 'dormerCard';
      const bb = ctx.roofBox(ctx.layout().floors.indexOf(f)), fit = bb ? dormerParts(bb, r, d) : null;
      const cap = document.createElement('b'); cap.className = 'dormerCap'; cap.textContent = `${t('dormer.one')} ${i + 1}`; card.append(cap);
      card.append(field(t('dormer.side'), select([[0, t('dormer.sideA')], [1, t('dormer.sideB')]], d.side === 1 ? 1 : 0, (v) => { d.side = +v; })));
      const pos = inp('range', Math.round((d.pos ?? 0.5) * 100), (v) => { d.pos = Math.max(0, Math.min(1, +v / 100)); }, { min: 0, max: 100, step: 1 });
      card.append(field(t('dormer.pos'), pos));
      card.append(field(t('dormer.width'), lenInput(() => d.w ?? DORMER_DEFAULT.w, (v) => { d.w = v; }, { min: 0.6 })));
      card.append(field(t('dormer.height'), lenInput(() => d.hw ?? DORMER_DEFAULT.hw, (v) => { d.hw = v; }, { min: 0.4 })));
      card.append(field(t('dormer.eave'), lenInput(() => d.eave ?? DORMER_DEFAULT.eave, (v) => { d.eave = v; }, { min: 0.2 })));
      card.append(field(t('dormer.type'), select(DORMER_TYPES.map((v) => [v, t(`dormer.${v}`)]), d.type || 'gable', (v) => { d.type = v; })));
      const win = document.createElement('input'); win.type = 'checkbox'; win.checked = d.win !== false;
      win.addEventListener('change', () => { ctx.snapshot(); d.win = win.checked; ctx.build(); ctx.scheduleSave(); });
      card.append(field(t('dormer.window'), win));
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
