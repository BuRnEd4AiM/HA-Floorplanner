/* Cameras (#69): the field of view as a cone on the floor (red while there is motion), the cameras overview in the top bar and the still images
 * (fetched through the add-on, renewed every few seconds while one is on the screen). The decisions are pure functions (tested); initCameras draws. */
import * as THREE from './vendor/three.module.min.js';

export const CONE_RED = 0xff3a3a;
export const MOTION_DC = new Set(['motion', 'occupancy', 'presence', 'moving']);

/** corners of the field of view relative to the camera (the lens looks along local +z); the first point is the camera itself */
export function conePoints(d) {
  const fov = Math.max(10, Math.min(180, d.fov ?? 90)), range = Math.max(0.5, d.range ?? 4);
  const r = (d.rot || 0) * Math.PI / 180, half = (fov * Math.PI / 180) / 2, n = Math.max(6, Math.round(fov / 6));
  const pts = [[0, 0]];
  for (let i = 0; i <= n; i++) { const a = r - half + (2 * half * i) / n; pts.push([Math.sin(a) * range, Math.cos(a) * range]); }
  return pts;
}

/** everything that can see or feel movement, with the room it is in: cameras (a device of type camera with a camera entity) and
 *  motion / presence sensors placed in the plan; rooms with movement first. env: { layout, states, onStates, pointInPoly } */
export function cameraEntries(env) {
  const { layout, states, onStates, pointInPoly } = env, out = [];
  const camMotion = (d) => !!d.motionEntity && onStates.has(states[d.motionEntity]?.state);
  layout.floors.forEach((f, fi) => f.devices.forEach((d) => {
    const room = f.rooms.find((r) => pointInPoly(d.x, d.z, r.points))?.name || '';
    if (d.type === 'camera' && d.entity?.startsWith('camera.')) out.push({ kind: 'cam', d, fi, room, motion: camMotion(d) });
    else if (d.entity?.startsWith('binary_sensor.') && (d.type === 'presence' || MOTION_DC.has(states[d.entity]?.dc))) out.push({ kind: 'sensor', d, fi, room, motion: onStates.has(states[d.entity]?.state) });
  }));
  return out.sort((p, q) => Number(q.motion) - Number(p.motion) || p.fi - q.fi || (p.d.name || '').localeCompare(q.d.name || ''));
}

/** names of the rooms where something sees movement (floor name when it hangs in no room) */
export const motionPlaces = (list, layout) => [...new Set(list.filter((x) => x.motion).map((x) => x.room || layout.floors[x.fi]?.name || ''))].filter(Boolean);

/** entries grouped by room (and floor, so equal room names on two floors are not mixed up); groups with movement first */
export function groupCameras(list) {
  const groups = new Map();
  list.forEach((c) => {
    const key = `${c.fi}:${c.room}`;
    if (!groups.has(key)) groups.set(key, { fi: c.fi, room: c.room, cams: [] });
    groups.get(key).cams.push(c);
  });
  return [...groups.values()].sort((p, q) => Number(q.cams.some((c) => c.motion)) - Number(p.cams.some((c) => c.motion)) || q.fi - p.fi || p.room.localeCompare(q.room));
}

/** ctx: $, t, settings(), layout(), states(), onStates, pointInPoly(...), isHolo(), openMoreInfo(id), setStatus(txt), showDevice(fi, id), closeMenu() */
export function initCameras(ctx) {
  const { $, t } = ctx;
  const cones = new Map();             // device id -> { mesh, d }
  const coneMotion = new Set();        // materials of the cones that are red (they pulse)
  const coneColor = () => (ctx.isHolo() ? 0x3df2ff : 0x4aa8ff);
  const motionOf = (d) => !!d.motionEntity && ctx.onStates.has(ctx.states()[d.motionEntity]?.state);
  const list = () => cameraEntries({ layout: ctx.layout(), states: ctx.states(), onStates: ctx.onStates, pointInPoly: ctx.pointInPoly });

  function buildCone(d) {
    const pts = conePoints(d), n = pts.length - 2, pos = [], idx = [];
    pts.forEach(([x, z]) => pos.push(x, 0.06, z));                    // above flat things such as carpets
    for (let i = 1; i <= n; i++) idx.push(0, i, i + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: coneColor(), transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }));
    mesh.renderOrder = 2;
    mesh.position.set(d.x, 0, d.z);
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, 0.065, z))), new THREE.LineBasicMaterial({ color: coneColor(), transparent: true, opacity: 0.6 }));
    edge.userData.noPick = true;
    mesh.add(edge);
    mesh.userData = { kind: 'device', id: d.id, cone: true, edge };
    return mesh;
  }
  /** red and pulsing while the motion sensor of the camera reports movement */
  function updateCones() {
    cones.forEach(({ mesh, d }) => {
      const motion = motionOf(d), col = motion ? CONE_RED : coneColor();
      mesh.material.color.setHex(col); mesh.userData.edge.material.color.setHex(col);
      if (motion) coneMotion.add(mesh.material); else { coneMotion.delete(mesh.material); mesh.material.opacity = 0.2; }
    });
  }
  /** a cone for a camera device, remembered so it can follow the device and turn red */
  function addCone(d) { const mesh = buildCone(d); cones.set(d.id, { mesh, d }); return mesh; }
  function clear() { cones.clear(); coneMotion.clear(); }
  /** the middle of a cone on the screen (for tests) */
  function coneCenter(id) {
    const c = cones.get(id);
    if (!c) return null;
    const p = c.mesh.geometry.attributes.position, v = new THREE.Vector3();
    for (let i = 1; i < p.count; i++) v.add(new THREE.Vector3().fromBufferAttribute(p, i));
    v.multiplyScalar(0.55 / (p.count - 1)).add(new THREE.Vector3().fromBufferAttribute(p, 0).multiplyScalar(0.45));
    c.mesh.localToWorld(v);
    return v;
  }
  function pulse(now) { if (coneMotion.size) { const k = 0.26 + 0.14 * Math.sin(now / 220); coneMotion.forEach((m) => { m.opacity = k; }); return true; } return false; }

  /* ---- still images ---- */
  const camUrls = new Map();                 // entity -> object URL of the latest still image
  let camTimer = 0;
  /** Home Assistant's own dialog for the entity (live view of a camera, history ...); only possible inside the Home Assistant frontend */
  function openInHa(entityId) { if (!ctx.openMoreInfo(entityId)) ctx.setStatus(t('cam.haOnly')); }
  function haButton(entityId) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'haBtn'; b.textContent = `ⓘ ${t('cam.openHa')}`; b.title = entityId;
    b.addEventListener('click', () => openInHa(entityId));
    return b;
  }
  function camImage(entityId, cls = 'rp-cam') {
    const img = document.createElement('img'); img.className = cls; img.dataset.cam = entityId; img.alt = '';
    if (camUrls.has(entityId)) img.src = camUrls.get(entityId);
    ensureTimer(); refresh(entityId, true);
    img.classList.add('tap'); img.title = t('cam.openHa'); img.addEventListener('click', () => openInHa(entityId));   // a second tap: Home Assistant's live view
    return img;
  }
  async function refresh(id, onlyIfMissing = false) {
    if (onlyIfMissing && camUrls.has(id)) return;
    if (!ctx.settings().cameraImages) return;
    const imgs = () => document.querySelectorAll(`img[data-cam="${CSS.escape(id)}"]`);
    try {
      const r = await fetch(`api/camera/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const url = URL.createObjectURL(await r.blob()), old = camUrls.get(id);
      camUrls.set(id, url);
      imgs().forEach((im) => { im.src = url; im.classList.remove('bad'); });
      if (old) setTimeout(() => URL.revokeObjectURL(old), 2000);
    } catch { imgs().forEach((im) => im.classList.add('bad')); }
  }
  function ensureTimer() {
    if (camTimer) return;
    camTimer = setInterval(() => {
      const ids = [...new Set([...document.querySelectorAll('img[data-cam]')].map((im) => im.dataset.cam))];
      if (!ids.length) { clearInterval(camTimer); camTimer = 0; return; }
      if (!document.hidden) ids.forEach((id) => refresh(id));
    }, 5000);
  }

  /* ---- top bar: the pill and the overview ---- */
  function updatePill() {
    const pill = $('#camPill'), l = list(), places = motionPlaces(l, ctx.layout()), n = l.filter((x) => x.motion).length;
    const cams = l.filter((x) => x.kind === 'cam').length;
    pill.hidden = !l.length;
    pill.textContent = n ? (places.length === 1 ? t('cam.pillMotionIn', { room: places[0] }) : t('cam.pillMotionN', { n: places.length || n })) : cams ? t('cam.pill', { n: cams }) : t('cam.pillSensors', { n: l.length });
    pill.classList.toggle('alert', n > 0);
    pill.title = n ? places.join(', ') : t('cam.pillTip');
    if (!$('#camMenu').hidden) renderMenu();
  }
  /** cameras grouped by room (floor name next to it); rooms with movement come first */
  function renderMenu() {
    const grid = $('#camGrid'), floors = ctx.layout().floors;
    grid.replaceChildren();
    groupCameras(list()).forEach((g) => {
      const alarm = g.cams.some((c) => c.motion);
      const sec = document.createElement('section'); sec.className = 'camGroup' + (alarm ? ' alert' : '');
      const hd = document.createElement('div'); hd.className = 'camGroupHead';
      const nm = document.createElement('strong'); nm.textContent = g.room || t('cam.noRoom');
      const fl = document.createElement('small'); fl.textContent = floors[g.fi]?.name || '';
      hd.append(nm, fl);
      if (alarm) { const b = document.createElement('span'); b.className = 'camBadge alert'; b.textContent = t('cam.motionOn'); hd.append(b); }
      const cards = document.createElement('div'); cards.className = 'camCards';
      g.cams.forEach(({ kind, d, fi, motion }) => {
        const card = document.createElement('div'); card.className = 'camCard' + (motion ? ' alert' : '') + (kind === 'sensor' ? ' sensor' : '');
        if (kind === 'cam' && ctx.settings().cameraImages) card.append(camImage(d.entity, 'cam-big'));
        const head = document.createElement('div'); head.className = 'camHead';
        const name = document.createElement('strong'); name.textContent = `${kind === 'sensor' ? '🔔 ' : ''}${d.name || d.entity}`;
        head.append(name);
        if ((kind === 'sensor' || d.motionEntity) && !motion) { const b = document.createElement('span'); b.className = 'camBadge'; b.textContent = t('cam.motionOff'); head.append(b); }
        const row = document.createElement('div'); row.className = 'camBtns';
        const show = document.createElement('button'); show.type = 'button'; show.textContent = t('cam.show');
        show.addEventListener('click', () => { ctx.closeMenu(); ctx.showDevice(fi, d.id); });
        row.append(show, haButton(d.entity));
        card.append(head, row);
        cards.append(card);
      });
      sec.append(hd, cards);
      grid.append(sec);
    });
  }
  return { cones, addCone, updateCones, clear, coneCenter, pulse, motion: motionOf, camImage, haButton, openInHa, updatePill, renderMenu };
}
