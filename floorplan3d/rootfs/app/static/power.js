/* Power add-on (#136), the 3D / DOM part: cables between power devices with flowing dots and the watt value, the power editor
 * (only power things are shown and can be picked), the cable tool, the energy overview next to the room menu and the properties of
 * power devices and cables. The calculations are in powerlogic.js (tested); the app gives this module what it needs through `ctx`. */
import * as THREE from './vendor/three.module.min.js';
import { POWER_TYPES, showsInPowerEditor, CABLE_ROUTES, CABLE_KINDS, cableKind, cableColor, cablesOf, ownCables, powerWatts, fmtWatts, cablePoints, energySummary, energyText } from './powerlogic.js';

const POWER_DOTS = 8;
const dotGeo = new THREE.SphereGeometry(0.035, 8, 6);

/**
 * @param ctx everything is a function (read at the moment it is needed), so this can be called before the rest of the app has its variables:
 *   $, t, scene, camera, canvas, ray (the raycaster), registry (id -> object), layout(), states(), entities(), getSelection(), setSelection(s),
 *   refreshSelection(), renderProps(), plan() (the 2D editor), setStatus(txt), uid(), snapshot(), changed(), wake(), clearGroup(g), textSprite(txt, opts),
 *   getTool(), setTool(name), getDeviceType(), setDeviceType(v), setPaletteCat(v), rebuildPalette(), deleteItem(sel),
 *   field(label, input), pickerField(label, picker), entityPicker(list, room, current, onChange), roomAt(x, z)
 */
export function initPower(ctx) {
  const { $, t } = ctx;
  let showPower = false, powerMode = false, cableFrom = null, flows = [], sig = '';
  try { showPower = localStorage.getItem('fp.power') === '1'; } catch { /* storage may be blocked */ }
  const group = new THREE.Group(); ctx.scene.add(group);

  const devices = () => ctx.layout().floors.flatMap((f) => f.devices);
  const powerList = () => ctx.layout().floors.flatMap((f, fi) => f.devices.filter((d) => POWER_TYPES.has(d.type)).map((d) => ({ d, f, fi })));
  const findDevice = (id) => devices().find((d) => d.id === id) || null;
  /** a cable by its id, with the device it starts at */
  function findCable(id) {
    for (const d of devices()) { const c = cablesOf(d).find((x) => x.id === id); if (c) return { d, c }; }
    return null;
  }
  const hides = (id) => { const d = powerMode ? findDevice(id) : null; return !!d && !showsInPowerEditor(d.type); };   // the power editor shows nothing but the power things and the meters
  const cablesShown = () => showPower || powerMode;

  /* ---------- the 3D cables ---------- */
  function update() {
    const layout = ctx.layout(), registry = ctx.registry, selection = ctx.getSelection(), states = ctx.states();
    const btn = $('#powerBtn');
    if (btn) { btn.hidden = !powerList().length; btn.classList.toggle('active', cablesShown()); }
    updateEnergy();
    const on = cablesShown();
    const links = [];
    layout.floors.forEach((f) => f.devices.forEach((d) => cablesOf(d).forEach((c) => links.push({ d, c }))));
    const key = `${powerMode}|${selection?.kind === 'cable' ? selection.id : ''}|` + (on ? links.map(({ d, c }) => `${c.id}:${d.id}>${c.to}:${c.route}:${cableKind(d, c)}:${registry.get(d.id)?.uuid}:${registry.get(c.to)?.uuid}:${powerWatts(states, d, c)}`).join('|') : '');
    registry.forEach((o, id) => { if (o.userData?.kind === 'device' && hides(id)) o.visible = false; });   // every time: a rebuilt scene starts with everything visible (#174)
    if (key === sig) return;
    sig = key;
    registry.forEach((o, id) => { if (o.userData?.kind === 'device') o.visible = !hides(id) && !o.userData.cutHidden; });
    ctx.clearGroup(group); flows = [];
    if (!on) return;
    ctx.scene.updateMatrixWorld(true);
    const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
    links.forEach(({ d, c }) => {
      const a = registry.get(d.id), b = registry.get(c.to), db = findDevice(c.to);
      if (!a || !b || !db) return;
      const pa = new THREE.Box3().setFromObject(a).getCenter(new THREE.Vector3()), pb = new THREE.Box3().setFromObject(b).getCenter(new THREE.Vector3());
      const fyA = a.getWorldPosition(new THREE.Vector3()).y - (d.y || 0), fyB = b.getWorldPosition(new THREE.Vector3()).y - (db.y || 0);
      const pts = cablePoints(c.route === 'air' || c.route === 'through' ? c.route : 'floor', pa.toArray(), pb.toArray(), fyA, fyB).map(V);
      const curve = c.route === 'air' ? new THREE.CatmullRomCurve3(pts) : (() => { const cp = new THREE.CurvePath(); for (let i = 1; i < pts.length; i++) if (pts[i].distanceTo(pts[i - 1]) > 1e-4) cp.add(new THREE.LineCurve3(pts[i - 1], pts[i])); return cp; })();
      if (!curve.getLength() || curve.getLength() < 1e-3) return;
      const w = powerWatts(states, d, c), active = w !== null && Math.abs(w) >= 1;
      const picked = selection?.kind === 'cable' && selection.id === c.id;
      const base = new THREE.Color(cableColor(d, c));
      const tubeMat = new THREE.MeshStandardMaterial({ color: base.clone().multiplyScalar(picked ? 1 : 0.35), emissive: picked ? base : 0x000000, emissiveIntensity: picked ? 0.6 : 0, roughness: 0.6 });
      const pickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });          // a fat invisible tube: the thin cable is hard to hit
      (curve.isCurvePath ? curve.curves : [curve]).forEach((seg) => {
        const n = curve.isCurvePath ? 1 : 24;
        group.add(new THREE.Mesh(new THREE.TubeGeometry(seg, n, picked ? 0.026 : 0.018, 6), tubeMat));
        const px = new THREE.Mesh(new THREE.TubeGeometry(seg, n, 0.1, 5), pickMat); px.userData = { kind: 'cable', id: c.id }; group.add(px);
      });
      const mat = new THREE.MeshBasicMaterial({ color: !active ? 0x8a949e : base.getHex(), transparent: true, opacity: active ? 1 : 0.35, depthTest: false });
      const dots = [];
      for (let i = 0; i < POWER_DOTS; i++) { const m = new THREE.Mesh(dotGeo, mat); m.renderOrder = 6; group.add(m); dots.push(m); }
      if (w !== null) { const sp = ctx.textSprite(fmtWatts(w), { size: 30, scaleX: 1.2, scaleY: 0.3, pill: true }); sp.position.copy(curve.getPointAt(0.5)).add(new THREE.Vector3(0, 0.22, 0)); group.add(sp); }
      flows.push({ curve, dots, active, dir: w < 0 ? -1 : 1, speed: (0.12 + Math.min(1, Math.abs(w || 0) / 5000) * 0.5) * (3 / Math.max(3, curve.getLength())), route: c.route });
    });
    place(performance.now());
  }
  function place(now) {
    flows.forEach((f) => {
      const base = f.active ? (now / 1000) * f.speed * f.dir : 0;
      f.dots.forEach((m, i) => { const k = (((base + i / f.dots.length) % 1) + 1) % 1; m.position.copy(f.curve.getPointAt(k)); });
    });
  }
  /** called every frame: moves the dots and keeps the screen awake while something flows */
  function animate(now) {
    if (!flows.length) return;
    if (flows.some((f) => f.active)) ctx.wake();
    place(now);
  }

  /* ---------- the overview next to the room menu ---------- */
  function updateEnergy() {
    const pill = $('#energyPill'); if (!pill) return;
    const txt = energyText(energySummary(ctx.states(), powerList().map(({ d }) => d)), t);
    pill.hidden = !txt;
    pill.textContent = txt?.text || '';
    pill.title = txt?.title || '';
    pill.classList.toggle('active', cablesShown());
  }

  /* ---------- picking in 3D (the power editor) ---------- */
  /** the power device whose centre is closest to the pointer on screen (within 30 px): the devices are small and close together */
  function nearestDevice(e) {
    const r = ctx.canvas.getBoundingClientRect(), v = new THREE.Vector3();
    let best = null;
    ctx.registry.forEach((o, id) => {
      const d = o.userData?.kind === 'device' ? findDevice(id) : null;
      if (!d || !POWER_TYPES.has(d.type) || !o.visible) return;
      new THREE.Box3().setFromObject(o).getCenter(v).project(ctx.camera);
      const dist = Math.hypot(r.left + ((v.x + 1) / 2) * r.width - e.clientX, r.top + ((1 - v.y) / 2) * r.height - e.clientY);
      if (dist < 30 && (!best || dist < best.dist)) best = { dist, data: o.userData, point: o.getWorldPosition(new THREE.Vector3()), distance: dist };
    });
    return best;
  }
  /** the pick in the power editor: a power device (exact hit, else near the pointer), else a cable; `hits` are the ray hits the app collected (the ray was set already) */
  function pick(e, hits) {
    const dv = hits.find((h) => h.data.kind === 'device');
    if (dv) return dv;
    const near = nearestDevice(e);
    if (near) return near;
    const cab = ctx.ray().intersectObjects(group.children, false).find((h) => h.object.userData?.kind === 'cable');
    return cab ? { data: cab.object.userData, point: cab.point, distance: cab.distance } : null;
  }

  /* ---------- cables: create, delete ---------- */
  /** the cable tool: first click a power device, second click another one; the cable runs along the floor, or through the floors when they differ */
  function cableClick(id) {
    const d = findDevice(id);
    if (!d || !POWER_TYPES.has(d.type)) { ctx.setStatus(t('power.pickPower')); return; }
    if (!cableFrom) { cableFrom = id; ctx.setStatus(t('power.picked', { a: d.name || t(`dev.${d.type}`) })); ctx.setSelection({ kind: 'device', id }); ctx.refreshSelection(); ctx.plan()?.render(); return; }
    if (cableFrom === id) { cableFrom = null; ctx.setStatus(''); ctx.plan()?.render(); return; }
    const from = findDevice(cableFrom);
    if (from && !cablesOf(from).some((c) => c.to === id)) {
      ctx.snapshot();
      const fl = (x) => ctx.layout().floors.findIndex((f) => f.devices.includes(x));
      ownCables(from).push({ id: ctx.uid(), to: id, route: fl(from) === fl(d) ? 'floor' : 'through' });
      ctx.changed();
    }
    ctx.setSelection({ kind: 'device', id: cableFrom }); cableFrom = null; ctx.setStatus(t('power.created')); ctx.refreshSelection(); ctx.plan()?.render();
  }
  /** a picked cable is removed; true when there was one */
  function deleteCable(id) {
    const hit = findCable(id);
    if (!hit) return false;
    const own = ownCables(hit.d);
    hit.d.cables = own.filter((x) => x.id !== id);
    return true;
  }
  /** a deleted device takes the cables that end at it with it */
  function dropCablesTo(id) {
    ctx.layout().floors.forEach((fl) => fl.devices.forEach((d) => { if (Array.isArray(d.cables)) d.cables = d.cables.filter((c) => c.to !== id); if (d.feeds === id) delete d.feeds; }));
  }

  /* ---------- the power editor and the buttons ---------- */
  /** the power editor: only power things are shown and can be picked; the cable tool wires two of them */
  function setMode(on) {
    powerMode = on;
    document.body.dataset.power = on ? '1' : '';
    $('#powerEditBtn')?.classList.toggle('active', on);
    $('#cableBtn').hidden = !on;
    if (on) { ctx.setPaletteCat('power'); showPower = true; if (!POWER_TYPES.has(ctx.getDeviceType())) ctx.setDeviceType('fusebox'); ctx.setTool('device'); ctx.setStatus(t('power.editorOn')); }
    else if (ctx.getTool() === 'cable' || ctx.getTool() === 'device') ctx.setTool('select');
    ctx.rebuildPalette();
    sig = ''; update(); ctx.plan()?.render(); ctx.wake();
  }
  /** the button at the bottom: show / hide the cables (inside the power editor it leaves the editor) */
  function toggle() {
    if (powerMode) { setMode(false); return; }
    showPower = !showPower;
    try { localStorage.setItem('fp.power', showPower ? '1' : '0'); } catch { /* ignore */ }
    sig = ''; update(); ctx.wake();
  }
  $('#powerBtn').addEventListener('click', toggle);
  $('#energyPill').addEventListener('click', toggle);
  $('#powerEditBtn').addEventListener('click', () => setMode(!powerMode));
  $('#cableBtn').addEventListener('click', () => ctx.setTool('cable'));

  /* ---------- the properties ---------- */
  const sensors = () => ctx.entities().filter((e) => e.domain === 'sensor').slice(0, 1500);
  /** a cable that was picked (3D or 2D): where it goes, what it carries, how it runs, remove */
  function cableProps(body, box) {
    const hit = findCable(ctx.getSelection().id);
    if (!hit) { box.hidden = true; return; }
    const { d, c } = hit, to = findDevice(c.to);
    box.hidden = false; $('#propsTitle').textContent = t('power.cable');
    const own = () => ownCables(d).find((x) => x.id === c.id);
    const p = document.createElement('p'); p.className = 'sub'; p.id = 'cableWho';
    p.textContent = `${d.name || t(`dev.${d.type}`)} → ${to ? (to.name || t(`dev.${to.type}`)) : '?'}`; body.append(p);
    const kind = document.createElement('select'); kind.id = 'cableKind';
    Object.keys(CABLE_KINDS).forEach((k) => kind.add(new Option(t(`power.kind.${k}`), k)));
    kind.value = cableKind(d, c);
    kind.addEventListener('change', () => { ctx.snapshot(); own().kind = kind.value; ctx.changed(); });
    body.append(ctx.field(t('power.kind'), kind));
    const rt = document.createElement('select'); rt.id = 'cableRoute1';
    CABLE_ROUTES.forEach((v) => rt.add(new Option(t(`power.route.${v}`), v)));
    rt.value = c.route || 'floor';
    rt.addEventListener('change', () => { ctx.snapshot(); own().route = rt.value; ctx.changed(); });
    body.append(ctx.field(t('power.route'), rt));
    body.append(ctx.pickerField(t('power.cableEntity'), ctx.entityPicker(sensors(), ctx.roomAt(d.x, d.z), c.entity || '', (v) => { ctx.snapshot(); const o = own(); if (v) o.entity = v; else delete o.entity; ctx.changed(); })));
    const del = document.createElement('button'); del.type = 'button'; del.id = 'cableDel'; del.className = 'danger'; del.textContent = t('power.delCable');
    del.addEventListener('click', () => { ctx.snapshot(); ctx.deleteItem(ctx.getSelection()); });
    body.append(del);
  }
  /** the cables of a power device (target, kind, route, remove), the ones that arrive here, and for a battery the sensor that tells whether it charges */
  function deviceProps(body, it) {
    const layout = ctx.layout();
    if (it.type === 'battery') {                                       // does it charge? an own sensor for the power (plus = charging) or a text sensor ("charging")
      body.append(ctx.pickerField(t('power.batPower'), ctx.entityPicker(sensors(), ctx.roomAt(it.x, it.z), it.batPower || '', (v) => { ctx.snapshot(); if (v) it.batPower = v; else delete it.batPower; ctx.changed(); })));
      const inv = document.createElement('input'); inv.type = 'checkbox'; inv.id = 'batInvert'; inv.checked = !!it.batInvert;
      inv.addEventListener('change', () => { ctx.snapshot(); if (inv.checked) it.batInvert = true; else delete it.batInvert; ctx.changed(); });
      body.append(ctx.field(t('power.batInvert'), inv));
    }
    const head = document.createElement('h4'); head.id = 'powerHead'; head.textContent = t('power.cables'); body.append(head);
    const fiOf = (x) => layout.floors.findIndex((f) => f.devices.includes(x));
    const label = (d) => `${d.name || t(`dev.${d.type}`)} · ${layout.floors[fiOf(d)]?.name || ''}`;
    const row1 = (c) => ownCables(it).find((x) => x.id === c.id);
    cablesOf(it).forEach((c) => {
      const row = document.createElement('div'); row.className = 'cableRow';
      const tgt = document.createElement('select'); tgt.className = 'cableTo';
      powerList().forEach(({ d }) => { if (d.id !== it.id) tgt.add(new Option(label(d), d.id)); });
      tgt.value = c.to;
      tgt.addEventListener('change', () => { ctx.snapshot(); row1(c).to = tgt.value; ctx.changed(); });
      const kd = document.createElement('select'); kd.className = 'cableKind'; kd.title = t('power.kind');
      Object.keys(CABLE_KINDS).forEach((k) => kd.add(new Option(t(`power.kind.${k}`), k)));
      kd.value = cableKind(it, c);
      kd.addEventListener('change', () => { ctx.snapshot(); row1(c).kind = kd.value; ctx.changed(); });
      const rt = document.createElement('select'); rt.className = 'cableRoute'; rt.title = t('power.route');
      CABLE_ROUTES.forEach((v) => rt.add(new Option(t(`power.route.${v}`), v)));
      rt.value = c.route || 'floor';
      rt.addEventListener('change', () => { ctx.snapshot(); row1(c).route = rt.value; ctx.changed(); });
      const del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.title = t('kitchen.del');
      del.addEventListener('click', () => { ctx.snapshot(); it.cables = ownCables(it).filter((x) => x.id !== c.id); ctx.changed(); ctx.renderProps(); });
      row.append(tgt, kd, rt, del); body.append(row);
    });
    const add = document.createElement('button'); add.type = 'button'; add.id = 'cableAdd'; add.textContent = t('power.addCable');
    const free = powerList().filter(({ d }) => d.id !== it.id && !cablesOf(it).some((c) => c.to === d.id));
    add.disabled = !free.length;
    add.addEventListener('click', () => {
      const d = free[0].d; ctx.snapshot();
      ownCables(it).push({ id: ctx.uid(), to: d.id, route: fiOf(it) === fiOf(d) ? 'floor' : 'through' }); ctx.changed(); ctx.renderProps();
    });
    body.append(add);
    const inc = powerList().filter(({ d }) => cablesOf(d).some((c) => c.to === it.id)).map(({ d }) => label(d));
    if (inc.length) { const p = document.createElement('p'); p.className = 'sub'; p.id = 'cableIn'; p.textContent = `${t('power.from')}: ${inc.join(', ')}`; body.append(p); }
  }

  return {
    update, animate, setMode, toggle, pick, cableClick, deleteCable, dropCablesTo, findCable, cableProps, deviceProps,
    isMode: () => powerMode, cablesShown, hides, isType: (type) => POWER_TYPES.has(type), shows: showsInPowerEditor, cablesOf, cableColor,
    cancelCable: () => { cableFrom = null; },
    /* for the browser tests (only used with ?debug=1) */
    links: () => devices().flatMap((d) => cablesOf(d).map((c) => ({ from: d.id, to: c.to, a: !!ctx.registry.get(d.id), b: !!ctx.registry.get(c.to), route: c.route }))),
    info: () => ({ shown: showPower, flows: flows.map((f) => ({ active: f.active, dir: f.dir, dots: f.dots.length })), labels: group.children.filter((c) => c.isSprite).length, hidden: [...ctx.registry.values()].filter((o) => o.userData?.kind === 'device' && !o.visible).length }),
  };
}
