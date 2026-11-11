/* Locking on the page (5.1.0, the owner's choice of 2026-11-09: pictures 7 and 9 in docs/ideen-5.1/): what may not move (asked by the 2D
 * plan, the 3D drags, the keys, the measuring tool, deleting) and the note that says why; 🔒 at a room (the new panel: a button in its head
 * with „Was bleibt fest?“; the classic panel: a row in the room) with what it keeps fixed and for which rooms; „🔒 Grundriss fertig“ (the
 * tree of the house, the object list) with „nur Admins dürfen entsperren“, a lock per floor and room in the tree, „🔒 Grundriss gesperrt“
 * in the top bar while it is on; locked rooms hatched in 3D while editing. The rules are in roomlock.js (tested). */
import * as THREE from './vendor/three.module.min.js';
import { lockInfo, lockedWhy, pointsLockedWhy, lockOf, setRoomLock, planLockOf, setPlanLock, mayUnlockPlan, floorLockState, setFloorLock, LOCK_KEYS } from './roomlock.js';

/** ctx: $, t, layout(), floor(), setStatus(txt), snapshot(), changed() (save, build, panel), isAdmin(), isLive(), canEdit() */
export function initRoomLock(ctx) {
  const { $, t } = ctx;
  let cache = null;                                     // one look per task: the plan asks for every room label while it draws
  const info = () => {
    if (!cache) { cache = lockInfo(ctx.layout(), ctx.floor()); queueMicrotask(() => { cache = null; }); }
    return cache;
  };
  const why = (kind, id) => lockedWhy(info(), kind, id);
  /** the note for a reason: the plan is locked, a room is locked, or the thing itself */
  const text = (w) => (w?.plan ? t('rlock.plan') : w?.room != null ? t('rlock.room', { n: w.room || t('prop.room') }) : t('prop.lockedHint'));
  const say = (w) => { ctx.setStatus(text(w)); return true; };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const btn = (cls, txt, on) => { const b = el('button', cls, txt); b.type = 'button'; if (on) b.addEventListener('click', on); return b; };
  const edit = (fn) => { ctx.snapshot(); fn(); cache = null; ctx.changed(); update(); };

  /* ---- 🔒 at a room ---- */
  let pop = null;
  const closePop = () => { pop?.remove(); pop = null; document.removeEventListener('pointerdown', outside, true); };
  const outside = (e) => { if (pop && !pop.contains(e.target) && !e.target.closest?.('#v2Lock')) closePop(); };
  /** the tap on 🔒 in the head of a room: an unlocked room is locked at once, then „Was bleibt fest?“ opens below the button */
  function roomButton(anchor, room) {
    if (!room) return;
    if (pop) { closePop(); return; }
    if (!room.locked) edit(() => setRoomLock(room, true));
    queueMicrotask(() => openPop($('#v2Lock') || anchor, room));
  }
  function openPop(anchor, room) {
    closePop();
    pop = el('div', 'v2Pop lockPop'); pop.id = 'lockPop';
    fillPop(room);
    document.body.append(pop);
    const r = anchor?.getBoundingClientRect?.(), w = 320;
    if (r) Object.assign(pop.style, { left: `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`, top: `${Math.min(innerHeight - 40, r.bottom + 8)}px`, width: `${w}px` });
    document.addEventListener('pointerdown', outside, true);
  }
  function fillPop(room) {
    pop.textContent = '';
    const L = lockOf(room) || {};
    pop.append(el('h5', '', t('rlock.what')));
    const opt = (key, label, sub, on, fixed = false) => {
      const b = btn(`v2Opt${on ? ' on' : ''}`, null, fixed ? null : () => { edit(() => setRoomLock(room, true, { [key]: !on })); fillPop(room); });
      b.dataset.key = key; if (fixed) b.disabled = true;
      b.append(el('span', `bx${on ? ' on' : ''}`, on ? '✓' : ''), el('span', 'nm', label), el('small', '', sub));
      pop.append(b);
    };
    opt('walls', t('rlock.walls'), t('rlock.wallsSub'), true, true);
    opt('openings', t('rlock.openings'), t('rlock.openingsSub'), !!L.openings);
    opt('devices', t('rlock.devices'), t(L.devices ? 'rlock.devicesOn' : 'rlock.devicesOff'), !!L.devices);
    opt('settings', t('rlock.settings'), t('rlock.settingsSub'), !!L.settings);
    pop.append(el('h5', '', t('rlock.scope')));
    const seg = el('div', 'v2Seg wide'); seg.id = 'lockScope';
    const f = ctx.floor(), opts = Object.fromEntries(LOCK_KEYS.map((k) => [k, !!L[k]]));
    const floorAll = floorLockState(f) === 'all' && (f.rooms || []).length > 1;
    const houseAll = floorAll && ctx.layout().floors.every((x) => !(x.rooms || []).length || floorLockState(x) === 'all');
    const now = houseAll ? 'house' : floorAll ? 'floor' : 'room';
    [['room', t('rlock.scopeRoom')], ['floor', t('rlock.scopeFloor')], ['house', t('rlock.scopeHouse')]].forEach(([k, label]) => {
      const b = btn(k === now ? 'on' : '', label, () => {
        edit(() => { if (k === 'floor') setFloorLock(f, true, opts); else if (k === 'house') ctx.layout().floors.forEach((x) => setFloorLock(x, true, opts)); });
        fillPop(room);
      });
      b.dataset.scope = k; seg.append(b);
    });
    pop.append(seg);
    const row = el('div', 'v2Row lockBtns');
    row.append(btn('v2Btn', `🔓 ${t('rlock.unlock')}`, () => { edit(() => setRoomLock(room, false)); closePop(); }),
      btn('v2Btn pri', t('rlock.done'), () => closePop()));
    row.firstChild.id = 'lockUnlock';
    pop.append(row);
  }
  /** the classic panel: a row in the room („🔒 Raum sperren“ and, while locked, what it keeps fixed) */
  function roomRow(room) {
    const box = el('div', 'lockRow'); box.id = 'roomLockRow';
    const L = lockOf(room);
    const head = el('label', 'chk');
    const cb = el('input'); cb.type = 'checkbox'; cb.id = 'roomLock'; cb.checked = !!L;
    cb.addEventListener('change', () => edit(() => setRoomLock(room, cb.checked)));
    head.append(cb, ` 🔒 ${t('rlock.roomRow')}`);
    box.append(head);
    if (!L) { box.append(el('p', 'sub', t('rlock.roomHelp'))); return box; }
    [['openings', 'rlock.openings'], ['devices', 'rlock.devices'], ['settings', 'rlock.settings']].forEach(([k, label]) => {
      const l = el('label', 'chk lockOpt'); const c = el('input'); c.type = 'checkbox'; c.checked = !!L[k]; c.dataset.key = k;
      c.addEventListener('change', () => edit(() => setRoomLock(room, true, { [k]: c.checked })));
      l.append(c, ` ${t(label)}`); box.append(l);
    });
    const all = btn('', t('rlock.floorAll'), () => edit(() => setFloorLock(ctx.floor(), true, L))); all.id = 'roomLockFloor';
    box.append(all);
    return box;
  }
  /** a room whose settings are locked too: every field of its panel is read only (the lock row stays) */
  function freeze(body, room) {
    if (!room || !why('settings', room.id)) return;
    body.querySelectorAll('input, select, textarea, button').forEach((x) => {
      if (x.closest('.lockRow, .acts, .v2Crumbs, .v2Tabs, .v2Sec > .hd, #lockPop')) return;
      x.disabled = true;
    });
    if (!body.querySelector('.lockNote')) { const n = el('p', 'sub lockNote', t('rlock.frozen')); body.prepend(n); }
  }

  /* ---- „Grundriss fertig“ ---- */
  const isAdmin = () => !!ctx.isAdmin?.();
  function setPlan(on, admin) {
    const lay = ctx.layout();
    if (!on && !mayUnlockPlan(lay, isAdmin())) { ctx.setStatus(t('rlock.adminOnly')); return false; }
    edit(() => setPlanLock(lay, on, admin));
    ctx.setStatus(t(on ? 'rlock.planOn' : 'rlock.planOff'));
    return true;
  }
  /** the switch with its line and „nur Admins dürfen entsperren“ (the tree of the new panel, the object list) */
  function planBox(where = '') {                                 // where: '' (the tree) or 'Obj' (the object list): its own ids
    const p = planLockOf(ctx.layout());
    const box = el('div', `lockPlan${p.on ? ' on' : ''}`); box.id = `planLockBox${where}`;
    const top = btn('lockPlanTop', null, () => setPlan(!p.on, p.admin)); top.id = `planLockSwitch${where}`;
    top.setAttribute('role', 'switch'); top.setAttribute('aria-checked', String(p.on));
    const txt = el('span', 'txt'); txt.append(el('b', '', t('rlock.planTitle')), el('small', '', t('rlock.planSub')));
    top.append(el('span', 'ic', '🔒'), txt, el('span', `tog${p.on ? ' on' : ''}`));
    box.append(top);
    const adm = el('label', 'chk lockAdmin'); const c = el('input'); c.type = 'checkbox'; c.id = `planLockAdmin${where}`; c.checked = p.admin;
    c.disabled = p.on && p.admin && !isAdmin();                       // only an administrator takes it away again
    c.addEventListener('change', () => edit(() => setPlanLock(ctx.layout(), p.on, c.checked)));
    adm.append(c, ` ${t('rlock.adminOnlyBox')}`);
    box.append(adm);
    return box;
  }
  /** „Grundriss fertig“ as a small lock on the house in the tree of ✨ Neu (5.7.0, instead of the big box above it): a tap locks or
   *  unlocks the plan; „nur Admins dürfen entsperren“ is in the menu ⋯ of the house (adminBox) */
  function houseLock() {
    const p = planLockOf(ctx.layout());
    const b = btn(`lk ${p.on ? 'plan' : 'none'}`, p.on ? '🔒' : '🔓', (e) => { e.stopPropagation(); setPlan(!p.on, p.admin); });
    b.id = 'planLockSwitch'; b.dataset.lock = p.on ? 'plan' : 'none';
    b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', String(p.on));
    b.title = `${t('rlock.planTitle')}: ${t('rlock.planSub')}`;
    return b;
  }
  /** „nur Admins dürfen entsperren“ alone (the menu ⋯ of the house in ✨ Neu) */
  function adminBox() {
    const p = planLockOf(ctx.layout());
    const adm = el('label', 'chk lockAdmin'); const c = el('input'); c.type = 'checkbox'; c.id = 'planLockAdmin'; c.checked = p.admin;
    c.disabled = p.on && p.admin && !isAdmin();
    c.addEventListener('change', () => edit(() => setPlanLock(ctx.layout(), p.on, c.checked)));
    adm.append(c, ` 🔒 ${t('rlock.adminOnlyBox')}`);
    return adm;
  }
  /** a lock to tap in a row of the tree: a floor (all / some / none of its rooms) or a room */
  function treeLock(kind, x) {
    const plan = planLockOf(ctx.layout()).on;
    const st = kind === 'floor' ? floorLockState(x) : x.locked ? 'all' : 'none';
    const b = btn(`lk ${plan ? 'plan' : st}`, plan || st === 'all' ? '🔒' : st === 'some' ? '🔒' : '🔓', (e) => {
      e.stopPropagation();
      if (plan) { ctx.setStatus(t('rlock.plan')); return; }
      edit(() => { if (kind === 'floor') setFloorLock(x, st !== 'all'); else setRoomLock(x, !x.locked); });
    });
    b.title = t(plan ? 'rlock.plan' : kind === 'floor' ? (st === 'some' ? 'rlock.floorSome' : st === 'all' ? 'rlock.floorUnlock' : 'rlock.floorLock') : x.locked ? 'rlock.roomUnlock' : 'rlock.roomLock');
    b.dataset.lock = plan ? 'plan' : st;
    return b;
  }

  /* ---- „🔒 Grundriss gesperrt“ in the top bar ---- */
  const pill = btn('lockPill edit-only', `🔒 ${t('rlock.pill')}`, () => {
    const lay = ctx.layout();
    if (!mayUnlockPlan(lay, isAdmin())) { ctx.setStatus(t('rlock.adminOnly')); return; }
    if (confirm(t('rlock.pillAsk'))) setPlan(false, planLockOf(lay).admin);
  });
  pill.id = 'planLockPill'; pill.hidden = true; pill.title = t('rlock.pillTip');
  $('#saveBtn')?.before(pill);
  function update() { pill.hidden = !planLockOf(ctx.layout()).on; }

  /* ---- locked rooms hatched in 3D while editing ---- */
  let stripes = null;
  const shown = [];
  function texture() {
    if (stripes) return stripes;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.strokeStyle = 'rgba(255,183,77,.6)'; g.lineWidth = 5;            // faint (the owner, 2026-11-09: „sticht echt ins Auge“)
    for (let i = -64; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
    stripes = new THREE.CanvasTexture(c); stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping; stripes.repeat.set(2, 2);
    return stripes;
  }
  /** the rooms of floor f that are locked (by themselves or by the plan) get stripes on their floor and a dashed outline (group g);
   *  only: the room shown on its own (a room tapped on the left, „nur ein Raum“): the other rooms are not drawn, so neither are their
   *  stripes (the owner, 2026-11-09: „dann sehe ich trotzdem noch von jedem anderen Raum, dass der auch gesperrt ist“) */
  function draw3d(g, f, only = null) {
    shown.length = 0;
    if (!f) return;
    const plan = planLockOf(ctx.layout()).on;
    (f.rooms || []).forEach((r) => {
      if (!(plan || r.locked) || !(r.points?.length >= 3)) return;
      if (only && r.id !== only.id) return;
      const shape = new THREE.Shape(r.points.map(([x, z]) => new THREE.Vector2(x, -z)));
      const m = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ map: texture(), transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
      m.position.y = 0.035 + (+r.lift || 0); m.renderOrder = 3; m.userData.lockHatch = r.id; m.raycast = () => {};
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(r.points.map(([x, z]) => new THREE.Vector3(x, 0.04 + (+r.lift || 0), z))),
        new THREE.LineDashedMaterial({ color: 0xffb74d, dashSize: 0.25, gapSize: 0.15, transparent: true, opacity: 0.45, depthWrite: false }));
      line.computeLineDistances(); line.raycast = () => {};
      [m, line].forEach((o) => { o.visible = !ctx.isLive() && hatchOn; g.add(o); shown.push(o); });
    });
  }
  const showHatch = (on) => shown.forEach((o) => { o.visible = on && hatchOn; });
  /* „🔒 Gesperrte zeigen“ in „Ansicht“ (the owner, 2026-11-09: „visuell ausstellen mit einem Knopf“): the stripes on or off, per device */
  const HATCH_KEY = 'fp.lockHatch';
  let hatchOn = true;
  try { hatchOn = localStorage.getItem(HATCH_KEY) !== 'off'; } catch { /* no storage: shown */ }
  const hatchBtn = btn('pill edit-only', `🔒 ${t('rlock.hatch')}`, () => {
    hatchOn = !hatchOn;
    try { localStorage.setItem(HATCH_KEY, hatchOn ? 'on' : 'off'); } catch { /* for now */ }
    hatchBtn.classList.toggle('active', hatchOn);
    showHatch(!ctx.isLive());
  });
  hatchBtn.id = 'lockHatchToggle'; hatchBtn.title = t('rlock.hatchTip'); hatchBtn.classList.toggle('active', hatchOn);
  $('#viewMenu')?.append(hatchBtn);

  update();
  return {
    why,
    isLocked: (kind, id) => !!why(kind, id),
    pointsWhy: (pts) => pointsLockedWhy(info(), ctx.floor(), pts),
    text, say,
    invalidate: () => { cache = null; },
    roomButton, roomRow, freeze, planBox, treeLock, houseLock, adminBox, update, draw3d, showHatch, closePop,
    planOn: () => planLockOf(ctx.layout()).on,
  };
}
