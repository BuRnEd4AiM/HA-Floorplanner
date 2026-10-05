/* "Where is ...?" search (#62): type a name, pick a hit, the view jumps there and a ring marks the spot for a moment.
 * The scoring of a name against the typed text is in alerts.js (matchScore, tested). */
import * as THREE from './vendor/three.module.min.js';
import { matchScore } from './alerts.js';
import { wallLength } from './walls.js';

/** where a device or a door / window is, for the jump (#215): { x, y (height over its floor), z }, null when it is not found */
export function targetPoint(floors, tg) {
  const f = floors?.[tg?.floor];
  if (!f) return null;
  if (tg.kind === 'device') { const d = f.devices.find((v) => v.id === tg.id); return d ? { x: d.x, y: d.y || 0, z: d.z } : null; }
  if (tg.kind === 'opening') {
    for (const w of f.walls) {
      const o = (w.openings || []).find((v) => v.id === tg.id);
      if (!o) continue;
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1, k = (o.pos || 0) / L;
      return { x: w.a[0] + (w.b[0] - w.a[0]) * k, y: (o.sill || 0) + (o.height || 1) / 2, z: w.a[1] + (w.b[1] - w.a[1]) * k };
    }
  }
  return null;
}

/** ctx: $, t, layout(), entities(), pointInPoly, houseMode(), floorIdx(), switchFloor(i), focusRoom(id), focusedRoom(), openRoomPanel(id), isLive(), liveSelect(h),
 *  elev(i), scene, camera, controls, selectLocked(sel) (select it and lock the selection), wake() */
export function initSearch(ctx) {
  const { $, t } = ctx;
  let findMarker = null;                  // { mesh, until }: a ring that marks what was found
  function findItems(q) {
    const out = [];
    ctx.layout().floors.forEach((f, fi) => {
      const roomOf = (x, z) => f.rooms.find((r) => ctx.pointInPoly(x, z, r.points))?.name || '';
      f.rooms.forEach((r) => { const sc = matchScore(r.name, q); if (sc) out.push({ sc: sc + 5, kind: 'room', id: r.id, floor: fi, label: r.name, sub: f.name }); });
      f.devices.forEach((d) => {
        const ent = d.entity && ctx.entities().find((e) => e.entity_id === d.entity);
        const name = d.name || ent?.name || t(`dev.${d.type}`);
        const sc = Math.max(matchScore(name, q), matchScore(ent?.name, q), matchScore(d.entity, q) * 0.8, matchScore(t(`dev.${d.type}`), q) * 0.6);
        if (sc) out.push({ sc, kind: 'device', id: d.id, floor: fi, label: name, sub: [f.name, roomOf(d.x, d.z)].filter(Boolean).join(' · '), x: d.x, y: d.y || 0, z: d.z });
      });
      f.walls.forEach((w) => (w.openings || []).forEach((o) => {
        const name = o.name || (o.entity && ctx.entities().find((e) => e.entity_id === o.entity)?.name) || '';
        const sc = Math.max(matchScore(name, q), matchScore(o.entity, q) * 0.8);
        if (!sc) return;
        const L = wallLength(w) || 1, x = w.a[0] + ((w.b[0] - w.a[0]) / L) * o.pos, z = w.a[1] + ((w.b[1] - w.a[1]) / L) * o.pos;
        out.push({ sc, kind: 'opening', id: o.id, floor: fi, label: name || t(`prop.${o.type}`), sub: f.name, x, y: (o.sill || 0) + (o.height || 1) / 2, z });
      }));
    });
    return out.sort((a, b) => b.sc - a.sc || a.label.localeCompare(b.label)).slice(0, 8);
  }
  function renderFind() {
    const q = $('#findInput').value, ul = $('#findList');
    const items = q.trim() ? findItems(q) : [];
    ul.replaceChildren(...items.map((it) => {
      const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
      const s1 = document.createElement('strong'); s1.textContent = it.label;
      const s2 = document.createElement('small'); s2.textContent = it.sub;
      b.append(s1, s2);
      b.addEventListener('click', () => goToFound(it));
      li.append(b); return li;
    }));
    $('#findNone').hidden = !q.trim() || !!items.length;
  }
  function openFind(open = $('#findBox').hidden) {
    $('#findBox').hidden = !open;
    if (open) { $('#findInput').value = ''; renderFind(); $('#findInput').focus(); }
  }
  function goToFound(it) {
    openFind(false);
    if (ctx.houseMode() || ctx.floorIdx() !== it.floor) ctx.switchFloor(it.floor);
    if (it.kind === 'room') { ctx.focusRoom(it.id); if (ctx.isLive()) ctx.openRoomPanel(it.id); return; }
    if (ctx.focusedRoom()) ctx.focusRoom(null);
    const target = new THREE.Vector3(it.x, ctx.elev(it.floor) + Math.min(it.y, 2.4), it.z);
    const dir = ctx.camera.position.clone().sub(ctx.controls.target).normalize();
    ctx.controls.target.copy(target);
    ctx.camera.position.copy(target).addScaledVector(dir, 5.5);
    ctx.controls.update();
    if (findMarker) { ctx.scene.remove(findMarker.mesh); findMarker.mesh.geometry.dispose(); }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.46, 40), new THREE.MeshBasicMaterial({ color: 0x3df2ff, transparent: true, side: THREE.DoubleSide, depthTest: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.copy(target); ring.renderOrder = 10;
    ctx.scene.add(ring);
    findMarker = { mesh: ring, until: performance.now() + 3500 };
    if (ctx.isLive()) ctx.liveSelect({ kind: it.kind, id: it.id });
    else { ctx.selectLocked({ kind: it.kind, id: it.id }); }
    ctx.wake();
  }
  $('#findBtn').addEventListener('click', () => openFind());
  $('#findInput').addEventListener('input', renderFind);
  $('#findInput').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') openFind(false);
    if (e.key === 'Enter') { const first = findItems($('#findInput').value)[0]; if (first) goToFound(first); }
    e.stopPropagation();                                       // typing must not trigger the editor shortcuts
  });
  return {
    close: () => openFind(false),
    /** jump to { floor, kind, id } like a search hit (the open and offline lists, #215); false when it has no place to fly to */
    goTo(tg) { const p = targetPoint(ctx.layout().floors, tg); if (!p) return false; goToFound({ ...tg, ...p }); return true; },
    findItems,
    /** every frame: the ring grows and fades; true while it is there (keeps the screen awake) */
    animate(now) {
      if (!findMarker) return false;
      const left = findMarker.until - now;
      if (left <= 0) { ctx.scene.remove(findMarker.mesh); findMarker.mesh.geometry.dispose(); findMarker = null; return false; }
      const k = 1 + 0.35 * Math.sin(now / 120); findMarker.mesh.scale.set(k, k, k); findMarker.mesh.material.opacity = Math.min(1, left / 800);
      return true;
    },
  };
}
