/* Stair tool: the settings of the stair that will be placed (type, direction, turn, rotation, floors, landing), placing a stair and the "Treppenhaus"
 * preset (a U stair with four walls, a room, a landing in front of the stair and a door onto it, the same on every floor it reaches, #229), the wall stair (a light stair with landings, hanging on a
 * wall along a path drawn in the plan), the stair fields of the properties panel, and the 3D mesh of a stair.
 * The geometry of the shaft is a pure function (tested). */
import * as THREE from './vendor/three.module.min.js';
import { stairDefaults, stairBounds, stairLocal, splitStoreys, POLE_R, stairCounts, stairLength, stairFloors, wallPathFromClicks, MAX_FLOORS, MIN_TREAD, MAX_TREAD, RAIL_H, MAX_LANDING, landingLength, FLOOR_LANDING } from './stairs.js';
import { OPENING_DEFAULTS, wallLength } from './walls.js';

const snap = (v) => Math.round(v / 0.05) * 0.05;

/** The shell of a stairwell around a U stair placed with its middle at (cx, cz), turned by rot degrees.
 *  base: the stair at x = z = 0 (rot 0), H: floor height, wallThickness: thickness of the new walls.
 *  In front of the start of the stair the shell keeps a landing (FLOOR_LANDING deep, at least the stair width) on every floor: there the door is,
 *  and there you arrive from the floor below and step off (#229).
 *  Returns { corners: 4 world points (clockwise; the wall corners[3] -> corners[0] is the one at the landing), stair: { x, z, rot } } where x/z is the
 *  stair origin so that stair and landing sit in the middle of the shell. */
export function shaftPlan(base, H, wallThickness, rot, cx, cz) {
  const b = stairBounds({ ...base, x: 0, z: 0, rot: 0 }, H);
  b.x0 -= Math.max(FLOOR_LANDING, base.w || 1);                  // the landing in front of the stair
  const m = 0.2 + wallThickness / 2;                              // clear space between stair and wall centre line
  const hw = (b.x1 - b.x0) / 2 + m, hd = (b.z1 - b.z0) / 2 + m;
  const r = ((rot % 360) + 360) % 360, th = (r * Math.PI) / 180;
  const rp = ([lx, lz]) => [snap(cx + lx * Math.cos(th) + lz * Math.sin(th)), snap(cz - lx * Math.sin(th) + lz * Math.cos(th))];
  const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(rp);
  const [ox, oz] = [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2];
  const wx = cx - (ox * Math.cos(th) + oz * Math.sin(th)), wz = cz - (-ox * Math.sin(th) + oz * Math.cos(th));
  return { corners, stair: { x: +wx.toFixed(3), z: +wz.toFixed(3), rot: r } };
}

/** ctx: $, t, settings(), layout(), floor(), floorIdx(), floorH, snapshot(), changed(), select(sel), setTool(name), plan(), uid(), mat(color, ghost, extra),
 *  ui: { field, inp, lenInput } (the helpers of the properties panel) */
export function initStairTool(ctx) {
  const { $, t } = ctx;
  let type = 'straight', dir = 'up', turn = 'right', rot = 0, floors = 1, landing = 0;
  const tpl = () => ({ ...stairDefaults(type === 'shaft' ? 'U' : type), type: type === 'shaft' ? 'U' : type, dir, turn, rot, floors, ...(landing > 0 && type !== 'straight' && type !== 'spiral' ? { landing } : {}) });

  /** stair mesh in the stair's local frame (origin = bottom start), steps as solid blocks. Of a stair over several floors the storeys after
   *  `upTo` (0 = the first one; storeysShown in stairs.js) go into a group of their own (g.userData.upper): see-through in the editor, so
   *  the whole height shows without hanging in the air (#236), left out in the live mode (#246, showUpper) */
  function build(st, holo, ghost, edgeMaterial, upTo = Infinity) {
    const g = new THREE.Group();
    const stepMat = holo
      ? new THREE.MeshBasicMaterial({ color: 0x2a8cff, transparent: true, opacity: ghost ? 0.12 : 0.38, depthWrite: false, side: THREE.DoubleSide })
      : ctx.mat('#c9bba1', ghost, { side: THREE.DoubleSide });
    const parts = splitStoreys(stairLocal(st, ctx.floorH), upTo, ctx.floorH);
    const railMat = holo ? stepMat : ctx.mat('#7c838b', ghost, { metalness: 0.5, roughness: 0.4 });
    const add = (into, geo, m, edges) => { const o = new THREE.Mesh(geo, m); into.add(o); if (holo && edgeMaterial && edges) into.add(new THREE.LineSegments(edges(geo), edgeMaterial)); return o; };
    /** one part: the pole from `from` up `poleH` (spiral, #209), the hand rail with a baluster per step (`skip` = the first one is in the
     *  part below already), the steps */
    function drawPart(into, part, sMat, rMat, solid, from = 0, skip = 0) {
      const rail = (geo) => { add(into, geo, rMat, (x) => new THREE.EdgesGeometry(x, 30)).castShadow = solid && !holo; };
      if (part.poleH > 0) rail(new THREE.CylinderGeometry(POLE_R, POLE_R, part.poleH, 16).translate(0, from + part.poleH / 2, 0));
      if (part.rail.length > 1) {
        rail(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(part.rail.map((q) => new THREE.Vector3(...q))), part.rail.length * 4, 0.022, 6));   // hand rail
        part.rail.slice(skip).forEach(([x, y, z]) => rail(new THREE.CylinderGeometry(0.012, 0.012, RAIL_H, 6).translate(x, y - RAIL_H / 2, z)));   // one baluster per step
      }
      part.treads.forEach((tr) => {
        const shape = new THREE.Shape(tr.poly.map(([x, z]) => new THREE.Vector2(x, -z)));
        const geo = new THREE.ExtrudeGeometry(shape, { depth: tr.thin || tr.top, bevelEnabled: false });   // a thin step is a plate with nothing below it
        geo.rotateX(-Math.PI / 2);
        if (tr.thin) geo.translate(0, tr.top - tr.thin, 0);
        const m = add(into, geo, sMat, (x) => new THREE.EdgesGeometry(x));
        m.castShadow = solid && !holo; m.receiveShadow = !holo;
      });
    }
    drawPart(g, parts.below, stepMat, railMat, true);
    if (parts.above) {
      const up = new THREE.Group();
      const upMat = holo ? new THREE.MeshBasicMaterial({ color: 0x2a8cff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })
        : ctx.mat('#c9bba1', true, { side: THREE.DoubleSide });
      drawPart(up, parts.above, upMat, holo ? upMat : ctx.mat('#7c838b', true, { metalness: 0.5, roughness: 0.4 }), false, parts.above.poleFrom, parts.below.rail.length ? 1 : 0);
      up.visible = !ctx.isLive?.();
      g.add(up); g.userData.upper = up;
    }
    return g;
  }
  /** the storeys above the open floor: see-through in the editor, hidden in the live mode (#246); root: the scene (or a floor group) */
  function showUpper(root, show) { root.traverse((o) => { if (o.userData.upper) o.userData.upper.visible = show; }); }
  function place(x, z) {
    if (type === 'wall') return;                                    // a wall stair is drawn as a path (placeWall)
    const f = ctx.floor();
    ctx.snapshot();
    if (type === 'shaft') { placeShaft(x, z); return; }
    const st = { id: ctx.uid(), name: t(`stair.${type}`), x, z, ...tpl() };
    (f.stairs ||= []).push(st);
    ctx.select({ kind: 'stair', id: st.id });
    ctx.changed();
    ctx.setTool('select');                                          // size handles are usable right away
  }
  function placeShaft(cx, cz) {
    const f = ctx.floor(), layout = ctx.layout(), settings = ctx.settings();
    const base = { ...tpl(), type: 'U', x: 0, z: 0, rot: 0 };
    const plan = shaftPlan(base, ctx.floorH, settings.wallThickness, rot, cx, cz);
    const shell = (fl) => {                                         // four walls, the room, and a door onto the landing in front of the stair
      const th = settings.wallThickness, wh = settings.wallHeight, c = plan.corners;
      const ws = c.map((p, i) => ({ id: ctx.uid(), a: [...p], b: [...c[(i + 1) % 4]], thickness: th, height: wh, openings: [] }));
      fl.walls.push(...ws);
      fl.rooms.push({ id: ctx.uid(), name: t('stair.shaftName'), color: '#7d8a99', points: c.map((p) => [...p]) });
      const door = ws[3];
      if (wallLength(door) > OPENING_DEFAULTS.door.width + 0.4) door.openings.push({ id: ctx.uid(), type: 'door', pos: wallLength(door) / 2, ...OPENING_DEFAULTS.door });
    };
    shell(f);
    const st = { ...base, id: ctx.uid(), name: t('stair.shaftName'), ...plan.stair };
    (f.stairs ||= []).push(st);
    const i = ctx.floorIdx(), n = stairFloors(st);                 // the shaft goes on through every floor the stair reaches, each with its door (#229)
    for (let k = 1; k <= n; k++) { const other = layout.floors[dir === 'up' ? i + k : i - k]; if (other) shell(other); }
    ctx.select({ kind: 'stair', id: st.id });
    ctx.changed();
    ctx.setTool('select');
  }
  /* ---- wall stair: the path is drawn in the plan (click along the wall, double click or Enter ends it) ---- */
  const wallPath = (clicks) => wallPathFromClicks(clicks, ctx.floor().walls, turn);
  /** the stair that the clicks would make (for the preview in the plan), or null with fewer than two different points */
  function wallDraft(clicks) {
    const p = wallPath(clicks);
    if (p.length < 2 || p.every((q) => Math.hypot(q[0] - p[0][0], q[1] - p[0][1]) < 0.05)) return null;
    return { ...tpl(), type: 'wall', x: p[0][0], z: p[0][1], rot: 0, path: p.map(([x, z]) => [x - p[0][0], z - p[0][1]]) };
  }
  function placeWall(clicks) {
    const draft = wallDraft(clicks);
    if (!draft) return;
    ctx.snapshot();
    const st = { id: ctx.uid(), name: t('stair.wall'), ...draft };
    (ctx.floor().stairs ||= []).push(st);
    ctx.select({ kind: 'stair', id: st.id });
    ctx.changed();
    ctx.setTool('select');
  }

  /** the fields of a selected stair in the properties panel */
  function renderProps(body, it) {
    const { field, inp, lenInput } = ctx.ui;
    const sel = (opts, value, on) => { const s = document.createElement('select'); opts.forEach(([v, l]) => s.add(new Option(l, v))); s.value = value; s.addEventListener('change', () => on(s.value)); return s; };
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field(t('stair.dir'), sel([['up', t('stair.up')], ['down', t('stair.down')]], it.dir || 'up', (v) => { ctx.snapshot(); it.dir = v; ctx.changed(); })));
    body.append(field(t('stair.floors'), inp('number', stairFloors(it), (v) => { it.floors = Math.max(1, Math.min(MAX_FLOORS, Math.round(+v) || 1)); }, { step: 1, min: 1, max: MAX_FLOORS })));
    if (it.type !== 'straight') {
      body.append(field(it.type === 'wall' ? t('stair.side') : t('stair.turn'), sel([['right', t('stair.right')], ['left', t('stair.left')]], it.turn || 'right', (v) => { ctx.snapshot(); it.turn = v; ctx.changed(); })));
    }
    body.append(field(it.type === 'spiral' ? t('stair.radius') : t('bg.width'), lenInput(() => it.w, (v) => (it.w = Math.max(0.5, v)), { min: 0.5 })));
    if (it.type === 'wall' || it.type === 'L' || it.type === 'U') {   // wall stair: flat round every bend for this long (#210); L / U: a deeper landing at the turn (#229)
      body.append(field(t('stair.landing'), lenInput(() => landingLength(it), (v) => { const l = Math.min(MAX_LANDING, Math.max(0, v)); if (l > 0) it.landing = +l.toFixed(2); else delete it.landing; }, { min: 0, step: 0.1 })));
    }
    if (it.type !== 'spiral' && it.type !== 'wall') {
      const cnt = stairCounts(it, ctx.floorH)[it.type === 'straight' ? 'T' : 'n1'];
      body.append(field(t('stair.length'), lenInput(() => stairLength(it, ctx.floorH), (v) => (it.tread = Math.max(MIN_TREAD, Math.min(MAX_TREAD, v / cnt))), { min: 0.5 })));
    }
    body.append(field(t('prop.rotation'), inp('number', it.rot || 0, (v) => (it.rot = ((+v % 360) + 360) % 360), { step: 15 })));
    body.append(field('X', lenInput(() => it.x, (v) => (it.x = v), { min: -1000 })));
    body.append(field('Z', lenInput(() => it.z, (v) => (it.z = v), { min: -1000 })));
    const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t(it.type === 'wall' ? 'stair.wallHelp' : 'stair.help'); body.append(hp);
  }
  document.querySelectorAll('#stairTypes button').forEach((b) => b.addEventListener('click', () => {
    type = b.dataset.stair;
    document.querySelectorAll('#stairTypes button').forEach((x) => x.classList.toggle('active', x === b));
    const lp = $('#stairLanding')?.closest('.prop'); if (lp) lp.hidden = type === 'straight' || type === 'spiral';   // only stairs with a turn have a landing
    ctx.plan()?.cancel();                                           // a path that was being drawn is dropped
    ctx.plan()?.render();
  }));
  $('#stairDir').addEventListener('change', (e) => { dir = e.target.value; ctx.plan()?.render(); });
  $('#stairTurn').addEventListener('change', (e) => { turn = e.target.value; ctx.plan()?.render(); });
  $('#stairRot').addEventListener('change', (e) => { rot = ((+e.target.value % 360) + 360) % 360 || 0; ctx.plan()?.render(); });
  $('#stairFloors').addEventListener('change', (e) => { floors = Math.max(1, Math.min(MAX_FLOORS, Math.round(+e.target.value) || 1)); e.target.value = floors; ctx.plan()?.render(); });
  $('#stairLanding').addEventListener('change', (e) => { landing = +Math.max(0, Math.min(MAX_LANDING, +e.target.value || 0)).toFixed(2); e.target.value = landing; ctx.plan()?.render(); });
  return { build, showUpper, place, template: tpl, placeWall, wallDraft, wallPath, renderProps };
}
