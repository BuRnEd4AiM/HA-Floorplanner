/* Doors, gates and windows with a contact sensor: open or closed (also per pane of a window with one sensor per pane), the red tint and the
 * opening leaf in 3D (shut: a green frame, so you see which ones have a sensor; a sensor that does not report: an amber frame, #375), the
 * pill "n open" with its list, and the animation of the leaves. The decisions are pure functions (tested). */
import { openingWalls } from './dormerwin.js';
import { shutterEntity, shutterClosed, curtainStyle, curtainTarget, shutterLabel, curtainStep } from './shutters.js';
import { tiltEntity, saysTilted, tiltPanes, contactWord, windowWord, paneWord, TILT_HEX } from './windowtilt.js';

export const OPEN_HEX = 0xff4a3d;
export const SENSOR_HEX = 0x2fcf6a;              // the frame of a shut door / window with a sensor
export const OFFLINE_HEX = 0xffa21f;             // the frame of one whose sensor does not report
/** which group an opening belongs to in the lists */
export const openKind = (o) => (o.type === 'door' ? (o.style === 'garage' ? 'gates' : 'doors') : 'windows');
export const OPEN_KINDS = ['doors', 'gates', 'windows'];
/** is pane i fixed (explicitly, o.paneHinges[i] = 'fixed')? A fixed pane has no contact of its own and never opens. */
export const paneFixed = (o, i) => Array.isArray(o?.paneHinges) && o.paneHinges[i] === 'fixed';
/** entity of pane i: multi-pane windows may have one contact sensor per pane (o.paneEntities), falling back to the window's main sensor;
 *  a fixed pane has none. */
export const paneEntity = (o, i) => {
  if (paneFixed(o, i)) return '';
  const panes = Array.isArray(o.paneEntities) ? o.paneEntities : [];
  return panes[i] || o.entity || '';
};
/** every sensor of an opening, once: the main one, per-pane ones (but none of a fixed pane) and the tilt contact of a window (#624) */
export const openingEntities = (o) => [...new Set([
  o.entity,
  ...(Array.isArray(o.paneEntities) ? o.paneEntities.filter((e, i) => e && !paneFixed(o, i)) : []),
  tiltEntity(o),
].filter(Boolean))];
/** is a state "open"? on / open / ..., a garage door on its way (opening, closing) is not closed, and a handle sensor that says "tilted"
 *  is not shut either (#624) */
export const isOpenState = (st, onStates) => !!st && (onStates.has(st.state) || ['opening', 'closing'].includes(st.state) || saysTilted(st));
/** the panes of window o that its tilt contact tilts (windowtilt.js tiltPanes); n: how many panes it has */
/** how many of the contacts of opening o count as open in the pill "n offen": every open one, but the tilt contact of a window not
 *  beside its contact "offen" (one tilt-and-turn pane open is one, #624) */
export function openCount(o, isOpen) {
  const on = openingEntities(o).filter(isOpen), te = tiltEntity(o);
  return on.length - (te && on.length > 1 && on.includes(te) ? 1 : 0);
}
export const tiltedPanes = (o, n) => tiltPanes(o, n, (i) => paneFixed(o, i), (i) => !!(Array.isArray(o.paneEntities) && o.paneEntities[i]));
/** how a door / window looks by its sensors ents (openingEntities): 'open' (red), 'tilted' (yellow, #624), 'closed' (green frame),
 *  'offline' (a sensor is unavailable, unknown or gone: amber frame), null without a sensor. open: one of them is open; tilted: it is only
 *  tilted (windowtilt.js windowWord); stateOf(e): its state, null while the states are not loaded */
export function contactLook(ents, open, stateOf, tilted = false) {
  if (!ents.length) return null;
  if (open) return tilted ? 'tilted' : 'open';
  if (!stateOf) return null;
  return ents.some((e) => { const s = stateOf(e); return !s || s.state === 'unavailable' || s.state === 'unknown'; }) ? 'offline' : 'closed';
}
/** the colour of one part of an opening (frame, door, metal, glass; walls.js) with look l (contactLook); base: its own colour */
export function partHex(part, l, base) {
  if (l === 'open') return OPEN_HEX;
  if (l === 'tilted') return TILT_HEX;
  if (part !== 'frame') return base;
  return l === 'closed' ? SENSOR_HEX : l === 'offline' ? OFFLINE_HEX : base;
}
/** the middle of an opening in floor coordinates */
export function openingPoint(w, o) {
  const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1;
  return [w.a[0] + ((w.b[0] - w.a[0]) * o.pos) / L, w.a[1] + ((w.b[1] - w.a[1]) * o.pos) / L];
}
/** every door / window whose contact sensor reports open, with its floor and room (a door on the edge of a room belongs to it); sorted by kind,
 *  top floor first, then room and name. env: { isOpen(e), t, pointInPoly, distToPoly } */
export function openItems(floors, env) {
  const out = [];
  floors.forEach((f, fi) => openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
    const ents = openingEntities(o), open = openCount(o, env.isOpen);
    if (!open) return;
    const tilted = windowWord(o, ents, env.isOpen, env.stateOf) === 'tilted';          // only tilted (#624): the list says "Gekippt"
    const [x, z] = openingPoint(w, o);
    const near = f.rooms.map((r) => ({ r, d: env.pointInPoly(x, z, r.points) ? 0 : env.distToPoly(x, z, r.points) })).filter((e) => e.d < 0.4).sort((p, q) => p.d - q.d)[0];
    out.push({ floor: fi, id: o.id, kind: openKind(o), name: o.name || env.t(`prop.${o.type}`), room: near?.r.name || '', n: open, tilted });
  })));
  return out.sort((p, q) => OPEN_KINDS.indexOf(p.kind) - OPEN_KINDS.indexOf(q.kind) || q.floor - p.floor || p.room.localeCompare(q.room) || p.name.localeCompare(q.name));
}

/** the curtains of an opening's 3D object: one pivot for a roller shutter or a one-sided curtain, two for a split curtain */
const curtainsOf = (obj) => { const sh = obj?.userData.shutter; return !sh ? [] : Array.isArray(sh) ? sh : [sh]; };
/** the moving parts of an opening's 3D object: its leaf or panes, and the curtain of its cover (#331); a fixed pane has no axis */
const movers = (obj) => [...(obj.userData.panePivots || (obj.userData.pivot ? [obj.userData.pivot] : [])).filter((p) => p.userData?.axis),
  ...(obj.userData.tiltPivots || []).filter((p) => p?.userData?.axis), ...curtainsOf(obj)];   // and a tilting pane (#624)

/** ctx: $, t, layout(), states(), onStates, registry, pointInPoly, distToPoly, show(target) (jump to an object: { floor, kind, id }),
 *  tapBalls (the shutters' balls, #331), isLive(), floorIdx() (balls show up to the floor shown, like the devices' balls), labelSprites
 *  (Map: the shutters' labels by window id), labelsOn() (value labels are switched on) */
export function initOpenings(ctx) {
  const { $, t } = ctx;
  const isOpen = (entity) => !!entity && isOpenState(ctx.states()[entity], ctx.onStates);
  const openText = (entity) => (!entity ? '—' : isOpen(entity) ? t('state.open') : ctx.states()[entity] ? t('state.closed') : '—');
  const stateOf = (e) => ctx.states()[e];
  const WORD = { open: 'state.open', tilted: 'state.tilted', closed: 'state.closed' };
  /** the word of contact e of door / window o: "Offen", "Gekippt" (its tilt contact, or a handle sensor, #624), "Geschlossen", '—' */
  const contactText = (o, e) => (!e ? '—' : !isOpen(e) && !ctx.states()[e] ? '—' : t(WORD[contactWord(o, e, isOpen, stateOf)]));
  /** the word of the whole door / window o (all its contacts: open wins over tilted), '—' while none of them reports */
  const windowText = (o) => {
    const ents = openingEntities(o);
    if (!ents.length || !ents.some((e) => isOpen(e) || ctx.states()[e])) return '—';
    return t(WORD[windowWord(o, ents, isOpen, stateOf)]);
  };
  /** is door / window o only tilted (#624)? */
  const isTilted = (o) => windowWord(o, openingEntities(o), isOpen, stateOf) === 'tilted';
  const objects = () => [...ctx.registry.values()].filter((o) => o.userData?.kind === 'opening' && (o.userData.pivot || o.userData.shutter));
  /** the curtain of window o's roller shutter goes as far down as its cover is closed (the first time at once, without moving), its label
   *  says how far it is open, its ball is lit while the cover is open; fi: the floor of the window */
  function applyShutter(o, obj, fi) {
    const e = shutterEntity(o), st = e ? ctx.states()[e] : null;
    const curtains = curtainsOf(obj), target = curtainTarget(curtainStyle(o), shutterClosed(st));
    curtains.forEach((sh) => {
      sh.userData.target = target;
      if (sh.userData.fresh) { sh.scale[sh.userData.axis] = target; sh.userData.fresh = false; }
    });
    if (!e) return;
    const sp = ctx.labelSprites?.get(o.id);
    if (sp) { sp.visible = ctx.labelsOn?.() ?? true; sp.userData.setText(shutterLabel(st, t, o)); }
    ctx.tapBalls?.update(o.id, ctx.onStates.has(st?.state), null, !!ctx.isLive?.(), fi <= (ctx.floorIdx?.() ?? Infinity));
  }
  /** tint and leaf targets of every opening, and the pill */
  function apply() {
    let n = 0, any = false;
    const states = ctx.states(), loaded = Object.keys(states).length ? (e) => states[e] : null;
    ctx.layout().floors.forEach((f, fi) => openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
      if (openingEntities(o).length) { any = true; n += openCount(o, isOpen); }
      const obj = ctx.registry.get(o.id);
      applyShutter(o, obj, fi);
      if (!obj?.userData.tint) return;                            // a bare gap in the wall
      const pps = obj.userData.panePivots, tps = obj.userData.tiltPivots || [];
      // every pane: open (it swings round its hinge), tilted (it leans in, #624: its tilt contact or a handle sensor) or closed
      const tilting = pps ? new Set(tiltedPanes(o, pps.length)) : new Set();
      const words = pps ? pps.map((_, i) => paneWord(o, paneEntity(o, i), tilting.has(i), isOpen, stateOf)) : [isOpen(o.entity) ? 'open' : 'closed'];
      const opens = words.map((w) => w === 'open');
      // a fixed pane has no sensor of its own; the window's main contact still says that something is open (red frame and the list)
      const ents = openingEntities(o);
      const open = opens.some(Boolean) || (pps ? ents.some(isOpen) : false);
      obj.userData.open = open;
      const look = contactLook(ents, open, loaded, o.type === 'window' && windowWord(o, ents, isOpen, stateOf) === 'tilted');
      obj.userData.look = look;
      obj.userData.tint.forEach(({ k, m, base }) => m.color.setHex(partHex(k, look, base)));
      if (obj.userData.pivot) (pps || [obj.userData.pivot]).forEach((pv, i) => {
        if (pv.userData?.dir == null) return;                         // a fixed pane does not move
        pv.userData.target = opens[i] ? pv.userData.dir * pv.userData.max : 0;
      });
      tps.forEach((tg, i) => { if (tg?.userData) tg.userData.target = words[i] === 'tilted' ? tg.userData.dir * tg.userData.max : 0; });
    })));
    const pill = $('#openPill');
    pill.hidden = !any;
    pill.textContent = n ? t('open.count', { n }) : t('open.allClosed');
    pill.classList.toggle('alert', n > 0);
    if ($('#openDialog').open) renderList();
  }
  function renderList() {
    const ul = $('#openList'), layout = ctx.layout();
    const list = openItems(layout.floors, { isOpen, stateOf, t, pointInPoly: ctx.pointInPoly, distToPoly: ctx.distToPoly });
    ul.replaceChildren();
    $('#openNone').hidden = !!list.length;
    let lastKind = null;
    list.forEach((x) => {
      if (x.kind !== lastKind) { const hd = document.createElement('li'); hd.className = 'offHead'; hd.textContent = t(`ok.${x.kind}`); ul.append(hd); lastKind = x.kind; }
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      const name = document.createElement('strong'); name.textContent = x.name;
      const why = document.createElement('span'); why.className = 'offWhy warn'; why.textContent = t(x.tilted ? 'state.tilted' : 'state.open');
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
      movers(obj).forEach((p) => {
        const tg = (p.userData.base ?? 0) + (p.userData.target ?? 0);          // base: the closed value (1 for a scaled garage door)
        const prop = p.userData.axis, holder = p.userData.prop === 'position' ? p.position : p.userData.prop === 'scale' ? p.scale : p.rotation, cur = holder[prop];
        if (p.userData.speed) {                                              // a roller shutter: at an even speed (#331), the time since the last frame
          const now = performance.now(), dt = Math.min(0.25, (now - (p.userData.last ?? now)) / 1000);   // also a slow tablet keeps the speed
          p.userData.last = now;
          if (cur !== tg) { holder[prop] = curtainStep(cur, tg, dt, p.userData.speed); moved = true; } else p.userData.last = undefined;
        } else if (Math.abs(tg - cur) > 0.002) { holder[prop] = cur + (tg - cur) * 0.15; moved = true; }
        (p.userData.followers || []).forEach((fp) => { fp.rotation[fp.userData.axis] = holder[prop] * (fp.userData.dir / (p.userData.dir || 1)); });   // second leaf of a double door
      });
    });
    return moved;
  }
  /** what is open now (the page ☀ Heute, #481) */
  const items = () => openItems(ctx.layout().floors, { isOpen, stateOf, t, pointInPoly: ctx.pointInPoly, distToPoly: ctx.distToPoly });
  return { isOpen, openText, contactText, windowText, isTilted, apply, renderList, animate, items };
}
