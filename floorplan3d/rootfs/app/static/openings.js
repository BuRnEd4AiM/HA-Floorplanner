/* Doors, gates and windows with a contact sensor: open or closed (also per pane of a window with one sensor per pane), the red tint and the
 * opening leaf in 3D, the pill "n open" with its list, and the animation of the leaves. The decisions are pure functions (tested). */

export const OPEN_HEX = 0xff4a3d;
/** which group an opening belongs to in the lists */
export const openKind = (o) => (o.type === 'door' ? (o.style === 'garage' ? 'gates' : 'doors') : 'windows');
export const OPEN_KINDS = ['doors', 'gates', 'windows'];
/** entity of pane i: multi-pane windows may have one contact sensor per pane (o.paneEntities), falling back to the main sensor */
export const paneEntity = (o, i) => (o.paneEntities && o.paneEntities[i]) || o.entity || '';
/** every sensor of an opening, once */
export const openingEntities = (o) => [...new Set([o.entity, ...(o.paneEntities || [])].filter(Boolean))];
/** is a state "open"? on / open / ..., and a garage door on its way (opening, closing) is not closed */
export const isOpenState = (st, onStates) => !!st && (onStates.has(st.state) || ['opening', 'closing'].includes(st.state));
/** the middle of an opening in floor coordinates */
export function openingPoint(w, o) {
  const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1;
  return [w.a[0] + ((w.b[0] - w.a[0]) * o.pos) / L, w.a[1] + ((w.b[1] - w.a[1]) * o.pos) / L];
}
/** every door / window whose contact sensor reports open, with its floor and room (a door on the edge of a room belongs to it); sorted by kind,
 *  top floor first, then room and name. env: { isOpen(e), t, pointInPoly, distToPoly } */
export function openItems(floors, env) {
  const out = [];
  floors.forEach((f, fi) => f.walls.forEach((w) => (w.openings || []).forEach((o) => {
    const open = openingEntities(o).filter(env.isOpen).length;
    if (!open) return;
    const [x, z] = openingPoint(w, o);
    const near = f.rooms.map((r) => ({ r, d: env.pointInPoly(x, z, r.points) ? 0 : env.distToPoly(x, z, r.points) })).filter((e) => e.d < 0.4).sort((p, q) => p.d - q.d)[0];
    out.push({ floor: fi, id: o.id, kind: openKind(o), name: o.name || env.t(`prop.${o.type}`), room: near?.r.name || '', n: open });
  })));
  return out.sort((p, q) => OPEN_KINDS.indexOf(p.kind) - OPEN_KINDS.indexOf(q.kind) || q.floor - p.floor || p.room.localeCompare(q.room) || p.name.localeCompare(q.name));
}

/** ctx: $, t, layout(), states(), onStates, registry, pointInPoly, distToPoly, show(target) (jump to an object: { floor, kind, id }) */
export function initOpenings(ctx) {
  const { $, t } = ctx;
  const isOpen = (entity) => !!entity && isOpenState(ctx.states()[entity], ctx.onStates);
  const openText = (entity) => (!entity ? '—' : isOpen(entity) ? t('state.open') : ctx.states()[entity] ? t('state.closed') : '—');
  const objects = () => [...ctx.registry.values()].filter((o) => o.userData?.kind === 'opening' && o.userData.pivot);
  /** tint and leaf targets of every opening, and the pill */
  function apply() {
    let n = 0, any = false;
    ctx.layout().floors.forEach((f) => f.walls.forEach((w) => (w.openings || []).forEach((o) => {
      openingEntities(o).forEach((e) => { any = true; if (isOpen(e)) n++; });
      const obj = ctx.registry.get(o.id);
      if (!obj?.userData.pivot) return;
      const pps = obj.userData.panePivots;
      const opens = pps ? pps.map((_, i) => isOpen(paneEntity(o, i))) : [isOpen(o.entity)];
      const open = opens.some(Boolean);
      obj.userData.open = open;
      obj.userData.tint.forEach(({ m, base }) => m.color.setHex(open && openingEntities(o).length ? OPEN_HEX : base));
      (pps || [obj.userData.pivot]).forEach((pv, i) => { pv.userData.target = opens[i] ? pv.userData.dir * pv.userData.max : 0; });
    })));
    const pill = $('#openPill');
    pill.hidden = !any;
    pill.textContent = n ? t('open.count', { n }) : t('open.allClosed');
    pill.classList.toggle('alert', n > 0);
    if ($('#openDialog').open) renderList();
  }
  function renderList() {
    const ul = $('#openList'), layout = ctx.layout();
    const list = openItems(layout.floors, { isOpen, t, pointInPoly: ctx.pointInPoly, distToPoly: ctx.distToPoly });
    ul.replaceChildren();
    $('#openNone').hidden = !!list.length;
    let lastKind = null;
    list.forEach((x) => {
      if (x.kind !== lastKind) { const hd = document.createElement('li'); hd.className = 'offHead'; hd.textContent = t(`ok.${x.kind}`); ul.append(hd); lastKind = x.kind; }
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      const name = document.createElement('strong'); name.textContent = x.name;
      const why = document.createElement('span'); why.className = 'offWhy warn'; why.textContent = t('state.open');
      const meta = document.createElement('small');
      meta.textContent = [layout.floors[x.floor]?.name, x.room].filter(Boolean).join(' · ');
      b.append(name, why, meta);
      b.addEventListener('click', () => { $('#openDialog').close(); ctx.show({ floor: x.floor, kind: 'opening', id: x.id }); });
      li.append(b); ul.append(li);
    });
  }
  $('#openPill').addEventListener('click', () => { renderList(); $('#openDialog').showModal(); });
  /** move the leaves a little towards their target (every frame); true while one moves */
  function animate() {
    let moved = false;
    objects().forEach((obj) => {
      (obj.userData.panePivots || [obj.userData.pivot]).forEach((p) => {
        const tg = (p.userData.base ?? 0) + (p.userData.target ?? 0);          // base: the closed value (1 for a scaled garage door)
        const prop = p.userData.axis, holder = p.userData.prop === 'position' ? p.position : p.userData.prop === 'scale' ? p.scale : p.rotation, cur = holder[prop];
        if (Math.abs(tg - cur) > 0.002) { holder[prop] = cur + (tg - cur) * 0.15; moved = true; }
        (p.userData.followers || []).forEach((fp) => { fp.rotation[fp.userData.axis] = holder[prop] * (fp.userData.dir / (p.userData.dir || 1)); });   // second leaf of a double door
      });
    });
    return moved;
  }
  return { isOpen, openText, apply, renderList, animate };
}
