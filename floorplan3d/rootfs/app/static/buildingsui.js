/* Several buildings in one plan (#409), the screen part: the switch "all buildings / main house / garden house" at the top (from two
 * buildings on), which building this screen shows (remembered per plan in this browser; a user or tablet can get one in the users
 * dialog, and be kept to it with the lock "building"), and the panel "Buildings in this plan" of the editor: add, rename and delete
 * buildings, say which room belongs to which building, which building a roof belongs to, give every building its own roof, bring another
 * house of the list in as a building of its own. The rules are in buildings.js (tested). */
import { buildingsOf, showSwitch, pickBuilding, roomOwners, inheritedBuilding, roofOwner, roofsPerBuilding, mergePlan, planBox } from './buildings.js';
import { autoRoofBox, partBox } from './roofs.js';

/** ctx: $, t, layout(), houseId(), houses() ([{ id, name }]), houseLabel(h), uid(), floorH, snapshot(), changed(), shownChanged() (draw the
 *  building shown now), setStatus(txt), confirm(txt), roofBox(i) (the box of the main roof of roof floor i as drawn) */
export function initBuildingsUi(ctx) {
  const { $, t } = ctx;
  let shown = null, userDefault = null, locked = false;
  const storeKey = () => `fp.building.${ctx.houseId() || 'main'}`;
  const stored = () => { try { return localStorage.getItem(storeKey()); } catch { return null; } };
  const store = (id) => { try { if (id) localStorage.setItem(storeKey(), id); else localStorage.removeItem(storeKey()); } catch { /* private mode */ } };

  /** the building shown: one of the plan's, or null (all of them) */
  const current = () => pickBuilding(ctx.layout(), shown);
  /** show building id (null: all); remembered for this plan in this browser */
  function setShown(id) {
    if (locked) return;
    shown = pickBuilding(ctx.layout(), id);
    store(shown);
    renderSwitch();
    ctx.shownChanged();
  }
  /** a plan was opened: the user's building (kept to it when locked), else the one chosen last on this plan in this browser */
  function opened() {
    const l = ctx.layout();
    shown = locked ? pickBuilding(l, userDefault) : pickBuilding(l, userDefault) || pickBuilding(l, stored());
    renderSwitch();
    renderPanel();
  }
  /** at start: the building set for this user / tablet in the users dialog, lock: the user may not switch (#409, step 3) */
  function start(building, lock) { userDefault = building || null; locked = !!lock && !!userDefault; opened(); }

  /* ---- the switch at the top ---- */
  function renderSwitch() {
    const group = $('#buildingGroup'), sel = $('#buildingSelect'), l = ctx.layout();
    if (!group || !sel) return;
    group.hidden = !showSwitch(l) || locked;
    sel.replaceChildren(new Option(t('bld.all'), ''), ...buildingsOf(l).map((b) => new Option(b.name || t('bld.unnamed'), b.id)));
    sel.value = current() || '';
  }
  $('#buildingSelect')?.addEventListener('change', (e) => setShown(e.target.value || null));

  /* ---- the panel "Buildings in this plan" ---- */
  const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
  const edit = (fn) => { ctx.snapshot(); fn(); ctx.changed(); renderSwitch(); };   // ctx.changed() draws the panel again
  /** a drop-down "automatic (…)" + the buildings; value '' = automatic */
  function buildingSelect(value, autoLabel, onPick) {
    const s = el('select', { className: 'bldPick' });
    s.add(new Option(autoLabel, ''));
    buildingsOf(ctx.layout()).forEach((b) => s.add(new Option(b.name || t('bld.unnamed'), b.id)));
    s.value = pickBuilding(ctx.layout(), value) || '';
    s.addEventListener('change', () => onPick(s.value || null));
    return s;
  }
  const nameOf = (id) => buildingsOf(ctx.layout()).find((b) => b.id === id)?.name || t('bld.plot');

  /** the panel is drawn while it is open (a long list of rooms is not drawn again at every change of a closed panel); never twice at once:
   *  taking out a field that has the focus fires its change event (a name typed in), which changes the plan and draws the panel again */
  let drawing = false;
  function renderPanel() {
    const body = $('#buildingBody');
    if (!body || !$('#buildingPanel')?.open || drawing) return;
    drawing = true;
    try { drawPanel(body); } finally { drawing = false; }
  }
  function drawPanel(body) {
    const l = ctx.layout(), list = buildingsOf(l);
    const out = [el('p', { className: 'sub', textContent: t('bld.help') })];
    // the buildings: name, delete
    list.forEach((b) => {
      const name = el('input', { type: 'text', value: b.name || '', className: 'bldName', placeholder: t('bld.unnamed') });
      name.addEventListener('change', () => edit(() => { b.name = name.value.trim() || b.name; }));
      const del = el('button', { type: 'button', textContent: '×', title: t('bld.delete'), className: 'bldDel' });
      del.addEventListener('click', () => {
        if (!ctx.confirm(t('bld.deleteConfirm', { name: b.name || '' }))) return;
        edit(() => {
          l.buildings = list.filter((x) => x !== b);
          if (!l.buildings.length) delete l.buildings;
          l.floors.forEach((f) => { (f.rooms || []).forEach((r) => { if (r.building === b.id) delete r.building; });
            if (f.roof) { if (f.roof.building === b.id) delete f.roof.building; (f.roof.parts || []).forEach((p) => { if (p.building === b.id) delete p.building; }); } });
          if (shown === b.id) { shown = null; store(null); }
        });
        ctx.shownChanged();
      });
      out.push(el('div', { className: 'bldRow' }, name, del));
    });
    const add = el('button', { type: 'button', id: 'bldAdd', textContent: t('bld.add') });
    add.addEventListener('click', () => edit(() => { l.buildings = [...list, { id: `b${ctx.uid()}`, name: `${t('bld.default')} ${list.length + 1}` }]; }));
    out.push(el('div', { className: 'stopTools' }, add));

    if (list.length) {
      // which room belongs to which building, floor by floor (the top floor first, like the building)
      const owners = roomOwners(l);
      out.push(el('h4', { textContent: t('bld.rooms') }), el('p', { className: 'sub', textContent: t('bld.roomsHelp') }));
      [...l.floors.keys()].reverse().forEach((fi) => {
        const f = l.floors[fi];
        if (f.kind === 'roof' || !(f.rooms || []).length) return;
        out.push(el('div', { className: 'bldFloor', textContent: f.name || `#${fi + 1}` }));
        owners[fi].forEach(({ room }) => {
          const label = t('bld.auto', { name: nameOf(inheritedBuilding(l, fi, room)) });   // what it is without a building of its own
          const s = buildingSelect(room.building, label, (id) => edit(() => { if (id) room.building = id; else delete room.building; }));
          s.dataset.room = room.id;
          out.push(el('label', { className: 'bldRoom' }, el('span', { textContent: room.name || t('prop.room') }), s));
        });
      });
      // roofs: the main roof belongs to all buildings until it gets one; a further roof to the building under it
      l.floors.forEach((f, fi) => {
        if (f.kind !== 'roof' || !f.roof) return;
        out.push(el('h4', { textContent: `${t('bld.roofs')} · ${f.name || ''}` }));
        const main = buildingSelect(f.roof.building, t('bld.allRoof'), (id) => edit(() => { if (id) f.roof.building = id; else delete f.roof.building; }));
        main.dataset.roof = 'main';
        out.push(el('label', { className: 'bldRoom' }, el('span', { textContent: t('bld.mainRoof') }), main));
        if (list.length >= 2 && !pickBuilding(l, f.roof.building)) out.push(el('p', { className: 'sub bldWarn', textContent: t('bld.mainRoofAll') }));
        (f.roof.parts || []).forEach((p, pi) => {
          const auto = roofOwner(l, fi, { ...p, building: undefined }, partBox(p), owners);
          const s = buildingSelect(p.building, t('bld.auto', { name: nameOf(auto) }), (id) => edit(() => { if (id) p.building = id; else delete p.building; }));
          s.dataset.roof = p.id || `part${pi}`;
          out.push(el('label', { className: 'bldRoom' }, el('span', { textContent: p.name || `${t('bld.partRoof')} ${pi + 1}` }), s));
        });
        if (list.length >= 2) {
          const each = el('button', { type: 'button', className: 'bldEachRoof', textContent: t('bld.eachRoof'), title: t('bld.eachRoofTip') });
          each.addEventListener('click', () => {
            const plan = roofsPerBuilding(l, fi, autoRoofBox);
            if (!plan.main) { ctx.setStatus(t('bld.eachRoofNone')); return; }
            edit(() => {
              f.roof.building = plan.main;
              const keep = (f.roof.parts || []).filter((p) => !plan.parts.some((q) => q.building === p.building));   // a building gets one roof
              f.roof.parts = [...keep, ...plan.parts.map((q) => ({ id: `rp${ctx.uid()}`, name: q.name, type: f.roof.type || 'gable', pitch: f.roof.pitch ?? 35,
                overhang: f.roof.overhang ?? 0.4, box: q.box, level: q.level, building: q.building }))];
            });
            ctx.setStatus(t('bld.eachRoofDone', { n: plan.parts.length + 1 }));
          });
          out.push(el('div', { className: 'stopTools' }, each));
        }
      });
    }

    // bring another house of the list in as a building of its own (#409, step 4)
    const others = ctx.houses().filter((h) => h.id !== ctx.houseId());
    out.push(el('h4', { textContent: t('bld.merge') }), el('p', { className: 'sub', textContent: t('bld.mergeHelp') }));
    if (!others.length) out.push(el('p', { className: 'sub', textContent: t('bld.mergeNone') }));
    else {
      const pick = el('select', { id: 'bldMergeHouse' });
      others.forEach((h) => pick.add(new Option(ctx.houseLabel(h), h.id)));
      const go = el('button', { type: 'button', id: 'bldMerge', textContent: t('bld.mergeGo') });
      go.addEventListener('click', () => mergeHouse(pick.value));
      out.push(el('div', { className: 'stopTools' }, pick, go));
    }
    body.replaceChildren(...out);
  }

  $('#buildingPanel')?.addEventListener('toggle', () => renderPanel());

  /** bring house `id` into this plan as a building: at the place of the neighbour house if it stands next to this one, else to the right */
  async function mergeHouse(id) {
    const h = ctx.houses().find((x) => x.id === id);
    if (!h) return;
    let src;
    try { const r = await fetch(`api/layout?house=${encodeURIComponent(id)}`); if (!r.ok) throw new Error(r.status); src = await r.json(); }
    catch (err) { ctx.setStatus(`${t('loadFailed')}: ${err.message}`); return; }
    if (!Array.isArray(src?.floors) || !src.floors.length) { ctx.setStatus(t('bld.mergeEmpty')); return; }
    const l = ctx.layout(), nb = (l.neighbors || []).find((x) => x.house === id);
    let at;
    if (nb) at = { x: nb.x || 0, z: nb.z || 0, rot: nb.rot || 0 };
    else {                                                            // next to this plan, 3 m to the right of it
      const a = planBox(l), b = planBox(src);
      at = a && b ? { x: +(a.x1 + 3 - b.x0).toFixed(2), z: +(a.z0 - b.z0).toFixed(2), rot: 0 } : { x: 0, z: 0, rot: 0 };
    }
    const name = ctx.houseLabel(h);
    if (!ctx.confirm(t('bld.mergeConfirm', { name }))) return;
    const bid = `b${ctx.uid()}`;
    let res;
    edit(() => {
      if (!buildingsOf(l).length) {                                   // the plan's own rooms become the first building
        const own = { id: `b${ctx.uid()}`, name: ctx.houseLabel(ctx.houses().find((x) => x.id === ctx.houseId()) || { name: t('bld.default') }) };
        l.buildings = [own];
        l.floors.forEach((f) => {
          (f.rooms || []).forEach((r) => { if (!r.building) r.building = own.id; });
          if (f.kind === 'roof' && f.roof && !f.roof.building) f.roof.building = own.id;   // its roof stays over its own rooms, not over both
        });
      }
      res = mergePlan(l, src, { ...at, autoBox: autoRoofBox }, bid, name, () => ctx.uid(), ctx.floorH);
      if (nb) { l.neighbors = l.neighbors.filter((x) => x !== nb); if (!l.neighbors.length) delete l.neighbors; }   // it is part of this plan now
    });
    ctx.setStatus(t('bld.mergeDone', { name, n: res.things, f: res.floors }));
  }
  return { shown: current, setShown, opened, start, renderSwitch, renderPanel, locked: () => locked };
}
