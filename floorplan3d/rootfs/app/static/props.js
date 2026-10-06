/* Properties panel (edit mode): the fields of the selected object: wall, room (with its entity list), placeholder block, floor opening, stair
 * (stairtool.js), door / window, device (position, size, tilt, picture, LED ring sections, kitchen run, power cables, entity, camera, TV
 * backlight), and a power cable (power.js). Which fields a device gets is decided by pure functions (tested); initProps draws the panel. */
import { RING_DEFAULT_INSET, ringCount, ringSectionsWorld, ringFromRoom, fitSegs, hasRanges, pathLength, splitEven, perWall, splitSection, removeSection, setRange } from './ledring.js';
import { DOOR_STYLES, WINDOW_STYLES, MIN_OPENING, clampOpeningPos, openingOverlaps } from './walls.js';
import { roomOpenings } from './roompanel.js';
import { initKitchenUi } from './kitchenui.js';
import { MOUNTS, MAX_FIELD } from './solarroof.js';
import { BRIDGE, bridgeSize } from './bridge.js';

/** the title of the panel for a selection: the opening's type, the stair's type or the kind of object */
export const propsTitleKey = (kind, it) => (kind === 'opening' ? `prop.${it.type}` : kind === 'stair' ? `stair.${it.type}` : `prop.${kind}`);
/** can the model of a device be hidden (a lamp keeps its light, a presence sensor its dot)? */
export const canHideModel = (d, { ledLike, catOf }) => d.type in ledLike || catOf(d.type) === 'lighting' || /^light\./.test(d.entity || '') || d.type === 'presence';
/** windows with more than one pane can have one contact per pane: how many (0 = none) */
export const paneCount = (o) => (o.type === 'window' && (o.style === 'double' || o.style === 'triple' || !o.style) ? (o.style === 'triple' ? 3 : 2) : 0);
/** a stretch factor typed by the user: limited to 0.1 .. 10, 1 (no stretch) is dropped (null) */
export function stretchValue(n) {
  const v = Math.max(0.1, Math.min(10, n));
  return Math.abs(v - 1) < 0.005 ? null : v;
}

/** ctx: $, t, floor(), isLive(), selection(), roomCtx(), setRoomCtx(id), fields: { field, inp, lenInput, pickerField }, entityPicker(list, room, current, onChange),
 *  entities(), areas(), findOpening(id), snapshot(), changed(), build(), refreshSelection(), deleteItem(sel), applyStates(), setStatus(txt),
 *  renderObjList(), renderRoomEntities(), stateText(id), roomAt(x, z), pointInPoly, controlsTarget() ({x, z}), wallTypes, ledLike, catOf, baseDims(type),
 *  snapToWall(d, max, flat), editNano(d), uploadPicture(file, d), floorH, power(), stairTool(), fmtLen(m), toDisp(m), imperial() */
export function initProps(ctx) {
  const { $, t } = ctx;
  const { field, inp, lenInput, pickerField } = ctx.fields;
  const kitchenProps = initKitchenUi({
    t, changed: () => ctx.changed(), snapshot: () => ctx.snapshot(), renderProps: () => render(),
    field, lenInput, toDisp: (m) => ctx.toDisp(m), imperial: () => ctx.imperial(),
  });

  /** the live state of the selected device's entity, under its fields */
  function renderEntState() {
    const el = $('#entState');
    if (!el) return;
    const selection = ctx.selection();
    const d = selection?.kind === 'device' ? ctx.floor()?.devices.find((v) => v.id === selection.id) : null;
    el.textContent = d?.entity ? `${d.entity} · ${ctx.stateText(d.entity)}` : '';
  }
  const roomEntsBox = (body) => { const ents = document.createElement('div'); ents.id = 'roomEnts'; ents.className = 'roomEnts'; body.append(ents); ctx.renderRoomEntities(); };
  const pickFrom = (list) => list.slice(0, 1500);

  function render() {
    ctx.renderObjList();
    const box = $('#props'), body = $('#propsBody');
    body.innerHTML = '';
    const selection = ctx.selection();
    if (!selection || ctx.isLive()) { ctx.setRoomCtx(null); box.hidden = true; return; }
    const f = ctx.floor();
    if (selection.kind === 'cable') { ctx.power().cableProps(body, box); return; }
    let it = null;
    if (selection.kind === 'wall') it = f.walls.find((x) => x.id === selection.id);
    else if (selection.kind === 'room') it = f.rooms.find((x) => x.id === selection.id);
    else if (selection.kind === 'device') it = f.devices.find((x) => x.id === selection.id);
    else if (selection.kind === 'stair') it = (f.stairs || []).find((x) => x.id === selection.id);
    else if (selection.kind === 'block') it = (f.blocks || []).find((x) => x.id === selection.id);
    else if (selection.kind === 'hole') it = (f.holes || []).find((x) => x.id === selection.id);
    else if (selection.kind === 'opening') it = ctx.findOpening(selection.id)?.opening;
    if (!it) { box.hidden = true; return; }
    box.hidden = false;
    $('#propsTitle').textContent = t(propsTitleKey(selection.kind, it));
    const multi = ctx.multiBox?.();                            // several things selected (#211): their count and "delete all" on top
    if (multi) body.append(multi);

    if (selection.kind === 'wall') wallProps(body, it);
    else if (selection.kind === 'room') roomProps(body, it);
    else if (selection.kind === 'block') {
      body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
      body.append(field(t('prop.height'), lenInput(() => it.h || ctx.floorH, (v) => (it.h = Math.max(0.5, v)), { min: 0.5, step: 0.1 })));
      const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('block.help'); body.append(hp);
    } else if (selection.kind === 'hole') {
      const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('hole.help'); body.append(hp);
    } else if (selection.kind === 'stair') ctx.stairTool().renderProps(body, it);
    else if (selection.kind === 'opening') openingProps(body, it, f);
    else deviceProps(body, it);
    if (selection.kind !== 'room') {                    // an object of the room picked from its list: the list stays below
      const rc = ctx.roomCtx(), rm = rc && f.rooms.find((r) => r.id === rc);
      const inRoom = rm && (selection.kind === 'device' ? ctx.pointInPoly(it.x, it.z, rm.points) : selection.kind === 'opening' && roomOpenings(rm, f).some((o) => o.id === it.id));
      if (inRoom) roomEntsBox(body); else ctx.setRoomCtx(null);
    }
    const del = document.createElement('button');
    del.textContent = t('panel.delete');
    del.addEventListener('click', () => { ctx.snapshot(); ctx.deleteItem(ctx.selection()); });
    body.append(del);
  }

  function wallProps(body, it) {
    body.append(field(t('prop.thickness'), lenInput(() => it.thickness, (v) => (it.thickness = Math.max(0.05, v)))));
    body.append(field(t('prop.height'), lenInput(() => it.height, (v) => (it.height = Math.max(0.3, v)), { min: 0.3, step: 0.1 })));
  }

  function roomProps(body, it) {
    const areas = ctx.areas();
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field(t('prop.color'), inp('color', it.color || '#8a7f70', (v) => (it.color = v))));
    {                                                          // roof terrace / open area: no roof above it, railing on the edges without a wall
      const tc = document.createElement('input'); tc.type = 'checkbox'; tc.checked = !!it.terrace; tc.id = 'roomTerrace';
      tc.addEventListener('change', () => {
        ctx.snapshot();
        if (tc.checked) { it.terrace = true; if (!it.color || it.color === '#8a7f70') it.color = '#a58a63'; } else { delete it.terrace; if (it.color === '#a58a63') it.color = '#8a7f70'; }
        ctx.changed(); render();
      });
      const tl = document.createElement('label'); tl.className = 'chk'; tl.title = t('prop.terraceHint'); tl.append(tc, document.createTextNode(' ' + t('prop.terrace')));
      body.append(tl);
    }
    const asel = document.createElement('select');
    asel.add(new Option(t('area.none'), ''));
    areas.forEach((x) => asel.add(new Option(x.name, x.id)));
    asel.value = it.area || '';
    asel.addEventListener('change', () => { ctx.snapshot(); it.area = asel.value || undefined; if (!it.name || areas.some((x) => x.name === it.name)) { const ar = areas.find((x) => x.id === asel.value); if (ar) it.name = ar.name; } ctx.changed(); render(); });
    body.append(field(t('prop.area'), asel));
    ctx.setRoomCtx(it.id);
    roomEntsBox(body);
  }

  function openingProps(body, it, f) {
    const { wall } = ctx.findOpening(it.id);
    const entities = ctx.entities(), rc = ctx.roomCtx();
    const refit = () => { const p = clampOpeningPos(wall, it.width, it.pos); if (p !== null && !openingOverlaps(wall, p, it.width, it.id)) it.pos = p; };
    body.append(field(t('prop.width'), lenInput(() => it.width, (v) => { it.width = Math.max(MIN_OPENING, v); refit(); }, { min: MIN_OPENING })));
    body.append(field(t('prop.height'), lenInput(() => it.height, (v) => (it.height = Math.max(0.3, v)), { min: 0.3 })));
    if (it.type === 'window') body.append(field(t('prop.sill'), lenInput(() => it.sill, (v) => (it.sill = v))));
    const ssel = document.createElement('select'); ssel.id = 'openStyle';
    (it.type === 'door' ? DOOR_STYLES : WINDOW_STYLES).forEach((v) => ssel.add(new Option(t(`st.${v}`), v)));
    ssel.value = it.style || (it.type === 'door' ? 'single' : 'double');
    ssel.addEventListener('change', () => { ctx.snapshot(); it.style = ssel.value; ctx.changed(); });
    body.append(field(t('prop.style'), ssel));
    body.append(field(t('prop.position'), lenInput(() => it.pos, (v) => {
      const p = clampOpeningPos(wall, it.width, v);
      if (p !== null && !openingOverlaps(wall, p, it.width, it.id)) it.pos = p;
    })));
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    const contact = entities.filter((e) => ['binary_sensor', 'cover', 'lock'].includes(e.domain));
    const room = rc ? f.rooms.find((r) => r.id === rc) : null;
    body.append(pickerField(t('prop.contact'), ctx.entityPicker(pickFrom(contact.length ? contact : entities), room, it.entity || '', (v) => { ctx.snapshot(); it.entity = v; ctx.changed(); })));
    const count = paneCount(it);
    if (count) {
      const h = document.createElement('h4'); h.textContent = t('pane.title'); body.append(h);
      for (let i = 0; i < count; i++) {
        body.append(pickerField(t('pane.n', { n: i + 1 }), ctx.entityPicker(pickFrom(contact.length ? contact : entities), room, (it.paneEntities || [])[i] || '', (v) => {
          ctx.snapshot(); const arr = it.paneEntities || []; while (arr.length < count) arr.push(''); arr[i] = v;
          it.paneEntities = arr.some(Boolean) ? arr : undefined; ctx.changed();
        })));
      }
    }
    if (it.type === 'door') {
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!it.flip;
      cb.addEventListener('change', () => { ctx.snapshot(); it.flip = cb.checked; ctx.changed(); });
      body.append(field(t('prop.flip'), cb));
      const ci = document.createElement('input'); ci.type = 'checkbox'; ci.checked = !!it.inv; ci.id = 'doorInv';
      ci.addEventListener('change', () => { ctx.snapshot(); it.inv = ci.checked; ctx.changed(); });
      body.append(field(t('prop.inv'), ci));
    }
  }

  function deviceProps(body, it) {
    const entities = ctx.entities();
    const bring = document.createElement('button'); bring.type = 'button'; bring.textContent = t('prop.bringHere');
    bring.addEventListener('click', () => { ctx.snapshot(); const c = ctx.controlsTarget(); it.x = +c.x.toFixed(2); it.z = +c.z.toFixed(2); if (ctx.wallTypes.has(it.type)) ctx.snapToWall(it, 0.8); ctx.changed(); ctx.build(); ctx.refreshSelection(); });
    body.append(bring);
    const lk = document.createElement('input'); lk.type = 'checkbox'; lk.checked = !!it.locked; lk.id = 'devLock';
    lk.addEventListener('change', () => { ctx.snapshot(); if (lk.checked) it.locked = true; else delete it.locked; ctx.changed(); render(); ctx.renderObjList(); });
    const lkl = document.createElement('label'); lkl.className = 'chk'; lkl.append(lk, document.createTextNode(' ' + t('prop.lock')));
    body.append(lkl);
    if (canHideModel(it, { ledLike: ctx.ledLike, catOf: ctx.catOf })) {     // aesthetics: hide the model, keep the light / the presence dot at the top
      const hv = document.createElement('input'); hv.type = 'checkbox'; hv.checked = !!it.hideModel; hv.id = 'devHide';
      hv.addEventListener('change', () => { ctx.snapshot(); if (hv.checked) it.hideModel = true; else delete it.hideModel; ctx.changed(); ctx.applyStates(); });
      const hl = document.createElement('label'); hl.className = 'chk'; hl.title = t(it.type === 'presence' ? 'prop.hideModelPresenceHint' : 'prop.hideModelHint'); hl.append(hv, document.createTextNode(' ' + t(it.type === 'presence' ? 'prop.hideModelPresence' : 'prop.hideModel')));
      body.append(hl);
    }
    if (it.type === 'nanoleaf') {
      const eb = document.createElement('button'); eb.type = 'button'; eb.id = 'nanoEdit'; eb.textContent = '✎ ' + t('nano.edit');
      eb.addEventListener('click', () => { if (!it.locked) ctx.editNano(it); else ctx.setStatus(t('prop.lockedHint')); });
      body.append(eb);
    }
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field('X', lenInput(() => it.x, (v) => (it.x = v), { min: -1000 })));
    body.append(field('Z', lenInput(() => it.z, (v) => (it.z = v), { min: -1000 })));
    body.append(field(t('prop.rotation'), inp('number', it.rot || 0, (v) => { it.rot = ((+v % 360) + 360) % 360; }, { step: 15 })));
    body.append(field(t('prop.elev'), lenInput(() => it.y ?? 0, (v) => (it.y = v), { min: -5, step: 0.1 })));
    body.append(field(t('prop.size'), inp('number', it.scale || 1, (v) => (it.scale = Math.max(0.2, +v)), { step: 0.1, min: 0.2 })));
    if (it.type !== 'picture') {
      const base = ctx.baseDims(it.type);
      if (base) {                                                     // real dimensions in metres, type them in directly
        const dim = (key, axis, label) => field(label, lenInput(() => base[axis] * (it.scale || 1) * (it[key] || 1), (v) => {
          const n = Math.max(0.1, Math.min(10, v / (base[axis] * (it.scale || 1))));
          if (Math.abs(n - 1) < 0.005) delete it[key]; else it[key] = +n.toFixed(4);
        }, { min: 0.02, step: 0.05 }));
        body.append(dim('sx', 'x', t('prop.dimW')), dim('sy', 'y', t('prop.dimH')), dim('sz', 'z', t('prop.dimD')));
      } else {
        const stretch = (key, label) => field(label, inp('number', it[key] || 1, (v) => { const n = stretchValue(+v || 1); if (n === null) delete it[key]; else it[key] = +n.toFixed(3); }, { step: 0.1, min: 0.1 }));
        body.append(stretch('sx', t('prop.stretchX')), stretch('sy', t('prop.stretchY')), stretch('sz', t('prop.stretchZ')));
      }
    }
    const angle = (key) => inp('number', it[key] || 0, (v) => { const a = ((+v % 360) + 360) % 360; if (a) it[key] = a; else delete it[key]; }, { step: 15 });
    body.append(field(t('prop.tiltX'), angle('tiltX')), field(t('prop.tiltZ'), angle('tiltZ')));
    const cm = document.createElement('input'); cm.type = 'checkbox'; cm.checked = !!it.mirror; cm.id = 'devMirror';
    cm.addEventListener('change', () => { ctx.snapshot(); if (cm.checked) it.mirror = true; else delete it.mirror; ctx.changed(); });
    body.append(field(t('prop.mirror'), cm));
    if (it.type === 'picture') {
      const lab = document.createElement('label'); lab.className = 'uploadBtn';
      const span = document.createElement('span'); span.textContent = t(it.img ? 'pic.replace' : 'pic.load');
      const file = document.createElement('input'); file.type = 'file'; file.hidden = true; file.id = 'picFile'; file.accept = 'image/png,image/jpeg,image/webp';
      file.addEventListener('change', async () => { const fl = file.files[0]; file.value = ''; try { await ctx.uploadPicture(fl, it); } catch (err) { alert(`${t('panel.uploadFailed')}: ${err.message}`); } });
      lab.append(span, file); body.append(lab);
      body.append(field(t('pic.width'), lenInput(() => it.w || 0.6, (v) => (it.w = Math.max(0.1, v)), { min: 0.1 })));
      if (!it.img) { const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('pic.help'); body.append(hp); }
    }
    if (ctx.wallTypes.has(it.type)) {
      const sb = document.createElement('button'); sb.type = 'button'; sb.id = 'snapWall'; sb.textContent = t('pic.snap');
      sb.addEventListener('click', () => { ctx.snapshot(); ctx.snapToWall(it, 3, true); ctx.changed(); render(); });
      body.append(sb);
    }
    if (it.type === 'ledring') ringProps(body, it);
    if (it.type === 'kitchenrun') kitchenProps(body, it);
    if (it.type === 'solarpanel') solarProps(body, it);
    if (it.type === 'bridge') bridgeProps(body, it);
    if (ctx.power().isType(it.type)) ctx.power().deviceProps(body, it);
    body.append(pickerField(t(it.type === 'ledring' ? 'ring.main' : 'prop.entity'), ctx.entityPicker(pickFrom(entities), ctx.roomAt(it.x, it.z), it.entity || '', (v) => { ctx.snapshot(); it.entity = v; ctx.changed(); })));
    if (it.type === 'camera') {                                  // #69: field of view cone on the floor
      body.append(field(t('cam.fov'), inp('number', it.fov ?? 90, (v) => { it.fov = Math.max(0, Math.min(180, +v || 0)); }, { step: 5, min: 0, max: 180 })));
      body.append(field(t('cam.range'), lenInput(() => it.range ?? 4, (v) => (it.range = Math.max(0.5, v)), { min: 0.5, step: 0.5 })));
      body.append(pickerField(t('cam.motionSensor'), ctx.entityPicker(pickFrom(entities.filter((e) => e.domain === 'binary_sensor')), ctx.roomAt(it.x, it.z), it.motionEntity || '', (v) => { ctx.snapshot(); if (v) it.motionEntity = v; else delete it.motionEntity; ctx.changed(); })));
    }
    if (it.type === 'tv' || it.type === 'tv_wall') {          // built-in backlight: shown behind the TV, shines into the room
      body.append(pickerField(t('prop.ledEntity'), ctx.entityPicker(pickFrom(entities.filter((e) => /^(light|switch)\./.test(e.entity_id))), ctx.roomAt(it.x, it.z), it.ledEntity || '', (v) => { ctx.snapshot(); if (v) it.ledEntity = v; else delete it.ledEntity; ctx.changed(); })));
    }
    const es = document.createElement('div'); es.id = 'entState'; es.className = 'entState';
    body.append(es);
    renderEntState();
  }

  /** Metal bridge (#189): length, width, railing */
  function bridgeProps(body, it) {
    const b = bridgeSize(it);
    body.append(field(t('bridge.len'), lenInput(() => b.len, (v) => { it.len = bridgeSize({ len: v }).len; }, { min: BRIDGE.minLen, step: 0.1 })));
    body.append(field(t('bridge.width'), lenInput(() => b.width, (v) => { it.w = bridgeSize({ w: v }).width; }, { min: BRIDGE.minWidth, step: 0.1 })));
    body.append(field(t('bridge.rise'), lenInput(() => b.rise, (v) => { const r = bridgeSize({ rise: v }).rise; if (Math.abs(r) >= 0.005) it.rise = +r.toFixed(3); else delete it.rise; }, { min: -BRIDGE.maxRise, step: 0.05 })));   // the far end higher or lower (#222)
    const rc = document.createElement('input'); rc.type = 'checkbox'; rc.checked = !it.noRail; rc.id = 'bridgeRail';
    rc.addEventListener('change', () => { ctx.snapshot(); if (rc.checked) delete it.noRail; else it.noRail = true; ctx.changed(); });
    body.append(field(t('bridge.rail'), rc));
    const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('bridge.help'); body.append(hp);
  }

  /** Solar panels (#176): a field of columns x rows; on the roof floor it lies on the roof surface, or stands on a rack */
  function solarProps(body, it) {
    const count = (k) => inp('number', it[k] || 1, (v) => { const n = Math.max(1, Math.min(MAX_FIELD, Math.round(+v) || 1)); if (n > 1) it[k] = n; else delete it[k]; }, { min: 1, max: MAX_FIELD, step: 1, id: `solar_${k}` });
    body.append(field(t('solar.cols'), count('cols')), field(t('solar.rows'), count('rows')));
    const ms = document.createElement('select'); ms.id = 'solarMount';
    MOUNTS.forEach((m) => ms.add(new Option(t(`solar.mount.${m}`), m)));
    ms.value = it.mount || 'auto';
    ms.addEventListener('change', () => { ctx.snapshot(); if (ms.value === 'auto') delete it.mount; else it.mount = ms.value; ctx.changed(); });
    body.append(field(t('solar.mount'), ms));
    const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t(ctx.floor()?.kind === 'roof' ? 'solar.onRoof' : 'solar.roofHint');
    body.append(hp);
  }

  /** LED ring properties: closed or open, distance to the walls, refit to the room, one light per section */
  function refitRing(d) {
    const room = ctx.floor().rooms.find((r) => r.id === d.room) || ctx.roomAt(d.x, d.z);
    if (!room) { ctx.setStatus(t('ring.noRoom')); return; }
    const keep = d.segs || [], ranged = hasRanges(d), closed = d.closed;
    Object.assign(d, ringFromRoom(room.points, d.inset ?? RING_DEFAULT_INSET), { rot: 0, scale: 1, room: room.id });
    delete d.sx; delete d.sz; delete d.mirror;
    if (closed === false) d.closed = false;
    d.segs = ranged ? keep : d.segs.map((sg, i) => keep[i] || sg);   // sections keep their lights (and their start / end)
    fitSegs(d);
  }
  function ringProps(body, it) {
    const redo = (fn) => () => { if (it.locked) { ctx.setStatus(t('prop.lockedHint')); return; } ctx.snapshot(); fn(); ctx.changed(); render(); };
    const btn = (id, label, fn, title = '') => { const b = document.createElement('button'); b.type = 'button'; if (id) b.id = id; b.textContent = label; b.title = title; b.addEventListener('click', redo(fn)); return b; };
    const h = document.createElement('h4'); h.textContent = t('ring.sections'); body.append(h);
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = it.closed !== false; cb.id = 'ringClosed';
    cb.addEventListener('change', () => { ctx.snapshot(); it.closed = cb.checked; fitSegs(it); ctx.changed(); render(); });
    const cl = document.createElement('label'); cl.className = 'chk'; cl.append(cb, document.createTextNode(' ' + t('ring.closed')));
    body.append(cl);
    body.append(field(t('ring.inset'), lenInput(() => it.inset ?? RING_DEFAULT_INSET, (v) => { it.inset = Math.min(2, v); if (!it.locked) refitRing(it); queueMicrotask(render); }, { min: 0, step: 0.05 })));
    body.append(btn('ringFit', t('ring.fit'), () => refitRing(it)));
    const total = document.createElement('div'); total.className = 'sub'; total.textContent = t('ring.total', { len: ctx.fmtLen(pathLength(it)) }); body.append(total);
    // how many sections: spread evenly over the whole band, or one per wall
    const cnt = document.createElement('input'); cnt.type = 'number'; cnt.id = 'ringCount'; cnt.min = 1; cnt.max = 60; cnt.step = 1; cnt.value = ringCount(it);
    body.append(field(t('ring.count'), cnt));
    const row = document.createElement('div'); row.className = 'stopTools';
    row.append(btn('ringEven', t('ring.even'), () => splitEven(it, +cnt.value || 1)), btn('ringPerWall', t('ring.perWall'), () => perWall(it)));
    body.append(row);
    const lights = pickFrom(ctx.entities().filter((e) => /^(light|switch)\./.test(e.entity_id)));
    ringSectionsWorld(it).forEach((e) => {
      const box = document.createElement('div'); box.className = 'ringSec'; box.dataset.seg = e.i;
      const head = document.createElement('div'); head.className = 'ringSecHead';
      const lb = document.createElement('b'); lb.textContent = t('ring.seg', { n: e.i + 1, len: ctx.fmtLen(e.len) });
      head.append(lb, btn('', '✂', () => splitSection(it, e.i), t('ring.split')));
      if (ringCount(it) > 1) head.append(btn('', '🗑', () => removeSection(it, e.i), t('ring.remove')));
      box.append(head);
      box.append(field(t('ring.from'), lenInput(() => e.from, (v) => { setRange(it, e.i, v, null); queueMicrotask(render); }, { min: 0, step: 0.05 })));
      box.append(field(t('ring.to'), lenInput(() => e.to, (v) => { setRange(it, e.i, null, v); queueMicrotask(render); }, { min: 0, step: 0.05 })));
      box.append(ctx.entityPicker(lights, ctx.roomAt(e.mid[0], e.mid[1]), it.segs?.[e.i]?.entity || '', (v) => {
        ctx.snapshot(); fitSegs(it); const sg = it.segs[e.i] || (it.segs[e.i] = {}); if (v) sg.entity = v; else delete sg.entity; ctx.changed();
      }));
      body.append(box);
    });
    const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('ring.help'); body.append(hp);
  }
  return { render, renderEntState };
}
