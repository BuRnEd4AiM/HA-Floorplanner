/* The measuring tool ("Messen", key M) in the 2D plan, in "2D + 3D" also in the 3D view: two clicks measure the distance between two
 * points; two walls clicked one after the other can be set to an exact distance or angle in the side panel (the orange wall moves, the
 * walls joined to it stretch along). The rules are in measure.js (unit tests); this part keeps the measurement, fills the side panel and
 * draws the line in 3D. Esc or another tool ends it. */
import * as THREE from './vendor/three.module.min.js';
import { measurePoint, nextMeasure, measureInfo, measureSvg, setDistance, setAngle, swapPair } from './measure.js';

const COLOR = 0xffd84a;
const TOL_3D = { corner: 0.18, wall: 0.1 };                 // in the 3D view a click is less exact than in the plan

/** ctx: $, t, floor(), floorIdx(), elev(i), scene, textSprite(text, opts), fmtLen(m), toDisp(m), fromDisp(v), imperial(), snapshot(),
 *  changed(), setStatus(txt), renderPlan() */
export function initMeasureTool(ctx) {
  const { $, t } = ctx;
  const body = $('#measureBody');
  let m = null, hover = null, shownKey = null;

  /* ---- the line in 3D: a thin bar with a dot at each end and its length on a pill, always on top ---- */
  const group = new THREE.Group();
  group.visible = false;
  ctx.scene.add(group);
  const mat = new THREE.MeshBasicMaterial({ color: COLOR, depthTest: false, transparent: true, opacity: 0.95 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), mat);
  const dots = [0, 1].map(() => new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), mat));
  [bar, ...dots].forEach((o) => { o.renderOrder = 20; group.add(o); });
  let pill = null;
  const UP = new THREE.Vector3(0, 1, 0);
  function draw3d() {
    const f = ctx.floor(), info = m?.a && f ? (m.b ? measureInfo(f, m) : null) : null;
    const a = info ? info.a : m?.a && hover ? [m.a.x, m.a.z] : null, b = info ? info.b : m?.a && hover ? [hover.x, hover.z] : null;
    group.visible = !!(a && b);
    if (!group.visible) return;
    const y = ctx.elev(m.floor) + 0.05, A = new THREE.Vector3(a[0], y, a[1]), B = new THREE.Vector3(b[0], y, b[1]), L = A.distanceTo(B);
    dots[0].position.copy(A); dots[1].position.copy(B);
    bar.visible = L > 0.01;
    bar.position.copy(A).add(B).multiplyScalar(0.5); bar.scale.set(1, Math.max(L, 0.001), 1);
    if (L > 0.01) bar.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
    if (!pill) { pill = ctx.textSprite('', { size: 30, scaleX: 1.5, scaleY: 0.375, pill: true }); pill.renderOrder = 21; group.add(pill); }
    pill.userData.setText(ctx.fmtLen(L));
    pill.position.set((a[0] + b[0]) / 2, y + 0.6, (a[1] + b[1]) / 2);
  }

  /* ---- the side panel ---- */
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const deg1 = (v) => `${v.toFixed(1)}°`;
  /** a labelled row: number field, unit, "Set" button (Enter in the field sets it too) */
  function setRow(label, value, unit, step, apply, id) {
    const w = el('div', 'prop stack msSet'), row = el('div', 'msRow'), i = el('input');
    i.type = 'number'; i.step = step; i.value = value; i.id = id;
    const go = el('button', null, t('ms.set'));
    go.type = 'button'; go.id = `${id}Set`;
    const run = () => { const v = parseFloat(i.value); if (Number.isFinite(v)) apply(v); };
    go.addEventListener('click', run);
    i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    const lb = el('label', null, label); lb.htmlFor = id;
    row.append(i, el('span', 'msUnit', unit), go);
    w.append(lb, row);
    return w;
  }
  function result(r) {
    if (r === 'ok') { ctx.changed(); refresh(true); ctx.setStatus(t('ms.done')); return; }
    ctx.setStatus(t(r === 'locked' ? 'prop.lockedHint' : 'ms.cannot'));
  }
  const unit = () => (ctx.imperial() ? 'ft' : 'm');
  const disp = (v) => +ctx.toDisp(v).toFixed(3);
  function renderPanel() {
    body.innerHTML = '';
    const f = ctx.floor();
    if (!m?.a) { body.append(el('p', 'sub', t('ms.first'))); return; }
    if (!m.b) { body.append(el('p', 'sub', t(m.a.wall && !m.a.corner ? 'ms.secondWall' : 'ms.second'))); return; }
    const info = measureInfo(f, m), ln = info.line;
    body.append(el('div', 'msBig', ctx.fmtLen(ln.len)), el('p', 'sub msParts', `↔ ${ctx.fmtLen(ln.dx)} · ↕ ${ctx.fmtLen(ln.dz)} · ∠ ${deg1(ln.deg)}`));
    const pr = info.pair;
    if (pr) {
      body.append(el('h4', null, t('ms.walls')), el('p', 'sub', t('ms.wallsHint')));
      if (pr.parallel && pr.inline) body.append(el('p', 'sub', t('ms.inline')));
      else if (pr.parallel) {
        body.append(
          setRow(t('ms.clear'), disp(pr.clear), unit(), ctx.imperial() ? 0.1 : 0.01, (v) => result(setDistance(f, m, ctx.fromDisp(v), 'clear', ctx.snapshot)), 'msClear'),
          setRow(t('ms.center'), disp(pr.center), unit(), ctx.imperial() ? 0.1 : 0.01, (v) => result(setDistance(f, m, ctx.fromDisp(v), 'center', ctx.snapshot)), 'msCenter'));
      } else body.append(el('p', 'sub', t('ms.notParallel')));
      if (!pr.inline) body.append(setRow(t('ms.angle'), +pr.angle.toFixed(2), '°', 1, (v) => result(setAngle(f, m, v, ctx.snapshot)), 'msAngle'));
      const sw = el('button', null, t('ms.swap'));
      sw.type = 'button'; sw.id = 'msSwap';
      sw.addEventListener('click', () => { m = swapPair(m); refresh(true); ctx.renderPlan(); });
      const tools = el('div', 'stopTools'); tools.append(sw);
      body.append(tools);
    } else if ((m.a.wall && !m.a.corner) || (m.b.wall && !m.b.corner)) body.append(el('p', 'sub', t('ms.pickWalls')));
    const again = el('button', null, t('ms.again'));
    again.type = 'button'; again.id = 'msAgain';
    again.addEventListener('click', () => clear());
    const tools = el('div', 'stopTools'); tools.append(again);
    body.append(tools);
  }
  /** draw the panel and the 3D line again when the measurement changed (also after undo or a wall moved); not while a field is typed in */
  function refresh(force = false) {
    const f = ctx.floor(), info = m?.b && f ? measureInfo(f, m) : null;
    const key = JSON.stringify([m?.a && [m.a.x, m.a.z, m.a.wall], m?.b && [m.b.x, m.b.z], m?.pair, info && [info.a, info.b, info.pair?.angle, info.pair?.center], ctx.imperial()]);
    draw3d();
    if (!force && (key === shownKey || body.contains(document.activeElement))) return;
    shownKey = key;
    renderPanel();
  }

  function click(x, z, tol, free = false) {
    const f = ctx.floor();
    if (!f) return;
    m = nextMeasure(m, measurePoint(f, x, z, tol, free), f, ctx.floorIdx());
    hover = null;
    if (m.b) ctx.setStatus(`${t('ms.length')}: ${ctx.fmtLen(measureInfo(f, m).line.len)}`);
    refresh(true);
  }
  function hoverAt(x, z, tol, free = false) {
    const f = ctx.floor();
    hover = f ? measurePoint(f, x, z, tol, free) : null;
    if (m?.a && !m.b && hover) ctx.setStatus(`${t('ms.length')}: ${ctx.fmtLen(Math.hypot(hover.x - m.a.x, hover.z - m.a.z))}`);
    draw3d();
  }
  function clear() {
    if (!m && !hover) return;
    m = null; hover = null;
    refresh(true); ctx.renderPlan();
  }
  return {
    /** a click in the plan at (x, z) metres; tol: { corner, wall } snapping reach in metres; free: no snapping (Alt) */
    click,
    /** the pointer moved over the plan: where a click would land */
    hover: hoverAt,
    leave() { hover = null; draw3d(); },
    /** a click / move in the 3D view (a point on the floor) */
    click3d(p, free) { click(p[0], p[1], TOL_3D, free); ctx.renderPlan(); },
    hover3d(p, free) { hoverAt(p[0], p[1], TOL_3D, free); ctx.renderPlan(); },
    /** SVG of the measurement for the plan (plan2d.js); view: { sx, sy, s, rot } */
    svg(view) {
      const f = ctx.floor();
      if (m && m.floor !== ctx.floorIdx()) { m = null; hover = null; }  // another floor was opened
      refresh();
      return f && (m || hover) ? measureSvg(f, m, hover, { ...view, fmtLen: ctx.fmtLen }) : '';
    },
    clear,
    /** the measurement (for the browser test) */
    state: () => m,
    info: () => (m?.b ? measureInfo(ctx.floor(), m) : null),
  };
}
