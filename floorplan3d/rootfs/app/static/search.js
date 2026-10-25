/* "Where is ...?" search (#62): type a name, pick a hit, the view jumps there and a ring marks the spot for a moment.
 * The scoring of a name against the typed text is in alerts.js (matchScore, tested). The voice search (#509, voiceui.js) answers in the
 * same box (show) and marks every thing of its answer with a ring (mark); a typed question gets a row "💬 …" (ctx.question). */
import * as THREE from './vendor/three.module.min.js';
import { matchScore } from './alerts.js';
import { wallLength } from './walls.js';
import { openingWalls } from './dormerwin.js';
import { shutterEntity } from './shutters.js';

/** where a device or a door / window is, for the jump (#215): { x, y (height over its floor), z }, null when it is not found */
export function targetPoint(floors, tg) {
  const f = floors?.[tg?.floor];
  if (!f) return null;
  if (tg.kind === 'device') { const d = f.devices.find((v) => v.id === tg.id); return d ? { x: d.x, y: d.y || 0, z: d.z } : null; }
  if (tg.kind === 'opening') {
    for (const w of openingWalls(f)) {
      const o = (w.openings || []).find((v) => v.id === tg.id);
      if (!o) continue;
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1, k = (o.pos || 0) / L;
      return { x: w.a[0] + (w.b[0] - w.a[0]) * k, y: (o.sill || 0) + (o.height || 1) / 2, z: w.a[1] + (w.b[1] - w.a[1]) * k };
    }
  }
  return null;
}

/** ctx: $, t, layout(), entities(), pointInPoly, houseMode(), floorIdx(), switchFloor(i), focusRoom(id), focusedRoom(), openRoomPanel(id), isLive(), liveSelect(h),
 *  elev(i), scene, camera, controls, selectLocked(sel) (select it and lock the selection), wake(); question(text) (the voice search: a label when
 *  the text is a question it answers, else null) and ask(text) (answer it), set later with setVoice */
export function initSearch(ctx) {
  const { $, t } = ctx;
  let markers = [];                       // [{ mesh, until }]: rings that mark what was found
  let voice = { question: () => null, ask: () => {} };
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
      openingWalls(f).forEach((w) => (w.openings || []).forEach((o) => {
        const name = o.name || (o.entity && ctx.entities().find((e) => e.entity_id === o.entity)?.name) || '';
        const se = shutterEntity(o), shName = se && ctx.entities().find((e) => e.entity_id === se)?.name;   // found by its roller shutter too (#331)
        const sc = Math.max(matchScore(name, q), matchScore(o.entity, q) * 0.8, matchScore(shName, q) * 0.9, matchScore(se, q) * 0.8);
        if (!sc) return;
        const L = wallLength(w) || 1, x = w.a[0] + ((w.b[0] - w.a[0]) / L) * o.pos, z = w.a[1] + ((w.b[1] - w.a[1]) / L) * o.pos;
        out.push({ sc, kind: 'opening', id: o.id, floor: fi, label: name || shName || t(`prop.${o.type}`), sub: f.name, x, y: (o.sill || 0) + (o.height || 1) / 2, z });
      }));
    });
    return out.sort((a, b) => b.sc - a.sc || a.label.localeCompare(b.label)).slice(0, 8);
  }
  /** a row of the list: a button with a bold line and a small one */
  function row(label, sub, onClick, cls = '') {
    const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
    if (cls) b.className = cls;
    const s1 = document.createElement('strong'); s1.textContent = label;
    b.append(s1);
    if (sub) { const s2 = document.createElement('small'); s2.textContent = sub; b.append(s2); }
    b.addEventListener('click', onClick);
    li.append(b); return li;
  }
  function renderFind() {
    const q = $('#findInput').value, ul = $('#findList');
    const items = q.trim() ? findItems(q) : [];
    const asks = q.trim() ? voice.question(q) : null;              // a question of the voice search, typed: answered by Enter or a tap
    ul.replaceChildren(...(asks ? [row(`💬 ${asks}`, '', () => voice.ask(q), 'findAsk')] : []), ...items.map((it) => row(it.label, it.sub, () => goToFound(it))));
    $('#findNone').textContent = t('find.none'); $('#findNone').hidden = !q.trim() || !!items.length || !!asks;
    $('#findAnswer').hidden = true;
  }
  function openFind(open = $('#findBox').hidden) {
    $('#findBox').hidden = !open;
    if (open) { $('#findInput').value = ''; renderFind(); $('#findInput').focus(); }
  }
  /** a ring at target (a THREE.Vector3) */
  function ring(target, ms) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.46, 40), new THREE.MeshBasicMaterial({ color: 0x3df2ff, transparent: true, side: THREE.DoubleSide, depthTest: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.copy(target); mesh.renderOrder = 10;
    ctx.scene.add(mesh);
    markers.push({ mesh, until: performance.now() + ms });
  }
  /** while rings show, the room labels fade (a ceiling lamp sits right under its room's label: its ring was hidden, style.css) */
  const ringsShown = (on) => document.body.classList.toggle('findRings', on);
  function clearMarks() { markers.forEach((m) => { ctx.scene.remove(m.mesh); m.mesh.geometry.dispose(); m.mesh.material.dispose(); }); markers = []; ringsShown(false); }
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
    clearMarks();
    ring(target, 3500); ringsShown(true);
    if (ctx.isLive()) ctx.liveSelect({ kind: it.kind, id: it.id });
    else { ctx.selectLocked({ kind: it.kind, id: it.id }); }
    ctx.wake();
  }
  $('#findBtn').addEventListener('click', () => openFind());
  $('#findInput').addEventListener('input', renderFind);
  $('#findInput').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') openFind(false);
    if (e.key === 'Enter') {
      const q = $('#findInput').value;
      if (voice.question(q)) voice.ask(q);
      else { const first = findItems(q)[0]; if (first) goToFound(first); }
    }
    e.stopPropagation();                                       // typing must not trigger the editor shortcuts
  });
  return {
    close: () => openFind(false),
    isOpen: () => !$('#findBox').hidden,
    /** jump to { floor, kind, id } like a search hit (the open and offline lists, #215); false when it has no place to fly to */
    goTo(tg) { const p = targetPoint(ctx.layout().floors, tg); if (!p) return false; goToFound({ ...tg, ...p }); return true; },
    findItems,
    /** the voice search (#509): question(text) -> label or null, ask(text) */
    setVoice(v) { voice = v; },
    /** the box open with an answer: { text (in the field), head (the line above the list), rows: [{ label, sub, go }] (go(): a tap),
     *  none (a text when there are no rows) } */
    show({ text, head = '', rows = [], none = '' }) {
      $('#findBox').hidden = false;
      if (text != null) $('#findInput').value = text;
      $('#findAnswer').textContent = head; $('#findAnswer').hidden = !head;
      $('#findList').replaceChildren(...rows.map((r) => row(r.label, r.sub, () => { openFind(false); r.go(); })));
      $('#findNone').textContent = none || t('find.none'); $('#findNone').hidden = !none;
    },
    /** rings on the things of targets [{ floor, kind, id }] (those that have a place in the plan) for ms; the old rings go */
    mark(targets, ms = 9000) {
      clearMarks();
      targets.forEach((tg) => {
        const p = targetPoint(ctx.layout().floors, tg);
        if (p) ring(new THREE.Vector3(p.x, ctx.elev(tg.floor) + Math.min(p.y, 2.4), p.z), ms);
      });
      ringsShown(markers.length > 0);
      ctx.wake();
    },
    marks: () => markers.length,
    /** every frame: the rings grow and fade; true while one is there (keeps the screen awake) */
    animate(now) {
      if (!markers.length) return false;
      const k = 1 + 0.35 * Math.sin(now / 120);
      markers = markers.filter((m) => {
        const left = m.until - now;
        if (left <= 0) { ctx.scene.remove(m.mesh); m.mesh.geometry.dispose(); m.mesh.material.dispose(); return false; }
        m.mesh.scale.set(k, k, k); m.mesh.material.opacity = Math.min(1, left / 800);
        return true;
      });
      if (!markers.length) ringsShown(false);
      return markers.length > 0;
    },
  };
}
