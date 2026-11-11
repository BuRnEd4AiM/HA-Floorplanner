/* Stair tool: the settings of the stair that will be placed (type, direction, turn, rotation, floors, landing), placing a stair and the "Treppenhaus"
 * preset (a U stair with four walls, a room, a landing in front of the stair and a door onto it, the same on every floor it reaches, #229), the wall stair (a light stair with landings, hanging on a
 * wall along a path drawn in the plan), the stair fields of the properties panel, and the 3D mesh of a stair.
 * The geometry of the shaft is a pure function (tested). */
import * as THREE from './vendor/three.module.min.js';
import { mergeParts } from './meshmerge.js';
import { stairDefaults, stairBounds, stairLocal, splitStoreys, POLE_R, stairCounts, stairLength, stairRun, stairSteps, stepsRange, autoSteps, stairFloors, wallPathFromClicks, MAX_FLOORS, MIN_TREAD, MAX_TREAD, RAIL_H, MAX_LANDING, landingLength, FLOOR_LANDING } from './stairs.js';
import { OPENING_DEFAULTS, wallLength } from './walls.js';
import { hasWinders, winderCount, hasCorner2, hasWinders2, winderCount2, WINDER_RANGE } from './winders.js';

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

/** ctx: $, t, settings(), layout(), floor(), floorIdx(), floorH() (the storey height, #671), fmtLen(m), imperial(), snapshot(), changed(), select(sel), setTool(name), plan(), uid(), mat(color, ghost, extra),
 *  ui: { field, inp, lenInput } (the helpers of the properties panel) */
export function initStairTool(ctx) {
  const { $, t } = ctx;
  let type = 'straight', dir = 'up', turn = 'right', rot = 0, floors = 1, landing = 0, corner = 'landing';
  const turns = (ty) => ty === 'L' || ty === 'U';                     // the stairs with a corner: a landing or winder steps (#623)
  const tpl = () => {
    const ty = type === 'shaft' ? 'U' : type, wind = corner === 'winder' && turns(ty);
    return { ...stairDefaults(ty), type: ty, dir, turn, rot, floors, ...(landing > 0 && ty !== 'straight' && ty !== 'spiral' && !wind ? { landing } : {}), ...(wind ? { corner: 'winder' } : {}) };
  };

  /** stair mesh in the stair's local frame (origin = bottom start), steps as solid blocks. Of a stair over several floors the storeys after
   *  `upTo` (0 = the first one; storeysShown in stairs.js) go into a group of their own (g.userData.upper): see-through in the editor, so
   *  the whole height shows without hanging in the air (#236), left out in the live mode (#246, showUpper) */
  function build(st, holo, ghost, edgeMaterial, upTo = Infinity) {
    const g = new THREE.Group();
    const stepMat = holo
      ? new THREE.MeshBasicMaterial({ color: 0x2a8cff, transparent: true, opacity: ghost ? 0.12 : 0.38, depthWrite: false, side: THREE.DoubleSide })
      : ctx.mat('#c9bba1', ghost, { side: THREE.DoubleSide });
    const parts = splitStoreys(stairLocal(st, ctx.floorH()), upTo, ctx.floorH());
    const railMat = holo ? stepMat : ctx.mat('#7c838b', ghost, { metalness: 0.5, roughness: 0.4 });
    const add = (into, geo, m, edges) => { const o = new THREE.Mesh(geo, m); into.add(o); if (holo && edgeMaterial && edges) into.add(new THREE.LineSegments(edges(geo), edgeMaterial)); return o; };
    /** one part: the pole from `from` up `poleH` (spiral, #209), the hand rails (one per storey, open at every landing, #318) with a
     *  baluster per step, the steps */
    function drawPart(into, part, sMat, rMat, solid, from = 0) {
      const rail = (geo) => { add(into, geo, rMat, (x) => new THREE.EdgesGeometry(x, 30)).castShadow = solid && !holo; };
      if (part.poleH > 0) rail(new THREE.CylinderGeometry(POLE_R, POLE_R, part.poleH, 16).translate(0, from + part.poleH / 2, 0));
      part.rails.filter((r) => r.length > 1).forEach((r) => {
        rail(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(r.map((q) => new THREE.Vector3(...q))), r.length * 4, 0.022, 6));   // hand rail
        r.forEach(([x, y, z]) => rail(new THREE.CylinderGeometry(0.012, 0.012, RAIL_H, 6).translate(x, y - RAIL_H / 2, z)));   // one baluster per step
      });
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
      drawPart(up, parts.above, upMat, holo ? upMat : ctx.mat('#7c838b', true, { metalness: 0.5, roughness: 0.4 }), false, parts.above.poleFrom);
      up.visible = !ctx.isLive?.();
      g.add(up); g.userData.upper = up;
    }
    mergeParts(g);                    // the steps in one mesh, the balusters in one: fewer draw calls (meshmerge.js, #394)
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
    const plan = shaftPlan(base, ctx.floorH(), settings.wallThickness, rot, cx, cz);
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
  /** mark(body, key): where the fields of a section of ✨ Neu begin (props.js; 5.7.0): form, steps, corner, place */
  function renderProps(body, it, mark = () => {}) {
    const { field, inp, lenInput } = ctx.ui;
    const sel = (opts, value, on) => { const s = document.createElement('select'); opts.forEach(([v, l]) => s.add(new Option(l, v))); s.value = value; s.addEventListener('change', () => on(s.value)); return s; };
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    mark(body, 'form');
    body.append(field(t('stair.dir'), sel([['up', t('stair.up')], ['down', t('stair.down')]], it.dir || 'up', (v) => { ctx.snapshot(); it.dir = v; ctx.changed(); })));
    body.append(field(t('stair.floors'), inp('number', stairFloors(it), (v) => { it.floors = Math.max(1, Math.min(MAX_FLOORS, Math.round(+v) || 1)); }, { step: 1, min: 1, max: MAX_FLOORS })));
    if (it.type !== 'straight') {
      body.append(field(it.type === 'wall' ? t('stair.side') : t('stair.turn'), sel([['right', t('stair.right')], ['left', t('stair.left')]], it.turn || 'right', (v) => { ctx.snapshot(); it.turn = v; ctx.changed(); })));
    }
    body.append(field(it.type === 'spiral' ? t('stair.radius') : t('bg.width'), lenInput(() => it.w, (v) => (it.w = Math.max(0.5, v)), { min: 0.5 })));
    mark(body, 'steps');
    stepsField(body, it);                                             // how many steps per storey (#671)
    mark(body, 'corner');
    if (turns(it.type)) {                                             // the corner: a landing or winder steps (#623, winders.js)
      const cs = sel([['landing', t('stair.cornerLanding')], ['winder', t('stair.cornerWinder')]], hasWinders(it) ? 'winder' : 'landing', (v) => {
        ctx.snapshot();
        if (v === 'winder') { it.corner = 'winder'; if (!hasCorner2(it) || hasWinders2(it)) delete it.landing; } else { delete it.corner; delete it.winders; if (it.split === 0) delete it.split; }
        ctx.changed(); ctx.renderProps?.();
      });
      cs.id = 'stairCornerProp';
      body.append(field(t('stair.corner'), cs));
      if (hasWinders(it)) {
        const [lo, hi] = WINDER_RANGE[it.type];
        const wi = inp('number', winderCount(it, 0.1), (v) => { const k = Math.round(+v); if (k >= lo && k <= hi) it.winders = k; else delete it.winders; }, { step: 1, min: lo, max: hi });
        wi.id = 'stairWinders';
        body.append(field(t('stair.winders'), wi));
      }
      const cnt = stairCounts(it, ctx.floorH()), lo1 = hasWinders(it) ? 0 : 1, max1 = Math.max(lo1, cnt.T - cnt.c - (cnt.c2 || 0));
      const sp = inp('number', cnt.n1, (v) => { const k = Math.round(+v); if (String(v).trim() !== '' && k >= lo1 && k <= max1) it.split = k; else delete it.split; }, { step: 1, min: lo1, max: max1 });
      sp.id = 'stairSplit';
      const sf = field(t('stair.split'), sp); sf.title = t(lo1 ? 'stair.splitHint' : 'stair.splitHint0');   // with winders 0: you step on from the side (#671)
      body.append(sf);
      if (it.type === 'L') corner2Fields(body, it);                   // a second quarter turn the same way, after the middle flight (#671)
      if (hasCorner2(it)) {                                           // the middle flight; the rest is the last flight (#671)
        const max2 = Math.max(0, cnt.T - cnt.c - cnt.c2 - cnt.n1);
        const sp2 = inp('number', cnt.n2, (v) => { const k = Math.round(+v); if (String(v).trim() !== '' && k >= 0 && k <= max2) it.split2 = k; else delete it.split2; }, { step: 1, min: 0, max: max2 });
        sp2.id = 'stairSplit2';
        const sf2 = field(t('stair.split2'), sp2); sf2.title = t('stair.split2Hint');
        body.append(sf2);
        const last = document.createElement('p'); last.className = 'sub'; last.id = 'stairLastFlight'; last.textContent = t('stair.lastFlight', { n: cnt.n3 });
        body.append(last);
      }
    }
    const landingCorner = turns(it.type) && (!hasWinders(it) || (hasCorner2(it) && !hasWinders2(it)));   // a corner with a landing
    if (it.type === 'wall' || landingCorner) {                        // wall stair: flat round every bend for this long (#210); L / U: a deeper landing at the turn (#229)
      body.append(field(t('stair.landing'), lenInput(() => landingLength(it), (v) => { const l = Math.min(MAX_LANDING, Math.max(0, v)); if (l > 0) it.landing = +l.toFixed(2); else delete it.landing; }, { min: 0, step: 0.1 })));
    }
    if (it.type === 'wall') {                                         // solid steps down to the floor instead of thin plates (#623)
      mark(body, 'steps');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'stairSolid'; cb.checked = !!it.solid;
      cb.addEventListener('change', () => { ctx.snapshot(); if (cb.checked) it.solid = true; else delete it.solid; ctx.changed(); });
      const lb = document.createElement('label'); lb.className = 'chk'; lb.append(cb, document.createTextNode(' ' + t('stair.solid')));
      body.append(lb);
    }
    if (it.type !== 'spiral' && it.type !== 'wall') {                 // the first run (or the next one without it, #671)
      mark(body, 'form');
      const cnt = stairRun(it, ctx.floorH()).k;
      body.append(field(t('stair.length'), lenInput(() => stairLength(it, ctx.floorH()), (v) => (it.tread = Math.max(MIN_TREAD, Math.min(MAX_TREAD, v / cnt))), { min: 0.5 })));
    }
    mark(body, 'place');
    body.append(field(t('prop.rotation'), inp('number', it.rot || 0, (v) => (it.rot = ((+v % 360) + 360) % 360), { step: 15 })));
    body.append(field('X', lenInput(() => it.x, (v) => (it.x = v), { min: -1000 })));
    body.append(field('Z', lenInput(() => it.z, (v) => (it.z = v), { min: -1000 })));
    const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t(it.type === 'wall' ? 'stair.wallHelp' : 'stair.help'); body.append(hp);
  }
  /** "Stufen je Etage" (#671): the treads per storey, by themselves from the storey height (a step about 18 cm high) or as counted on the
   *  real stair; under it how high a step is and the storey height it climbs */
  function stepsField(body, it) {
    const { field, inp } = ctx.ui, H = ctx.floorH(), [lo, hi] = stepsRange(H), auto = autoSteps(H);
    const si = inp('number', stairCounts(it, H).T, (v) => {
      const k = Math.round(+v);
      if (String(v).trim() === '' || !Number.isFinite(k) || k === auto) delete it.steps; else it.steps = Math.max(lo, Math.min(hi, k));
    }, { step: 1, min: lo, max: hi, placeholder: String(auto) });
    si.id = 'stairSteps';
    const f = field(t('stair.steps'), si); f.title = t('stair.stepsHint', { n: auto });
    body.append(f);
    const info = document.createElement('p'); info.className = 'sub'; info.id = 'stairRise';
    const rise = stairSteps(H, it).rise;
    info.textContent = t('stair.rise', { rise: ctx.imperial?.() ? `${(rise / 0.0254).toFixed(1)} in` : `${(rise * 100).toFixed(1)} cm`, storey: ctx.fmtLen?.(H) ?? `${H.toFixed(2)} m` });
    body.append(info);
  }
  /** "2. Ecke" of an L stair (#671): none, a landing or winder steps, and how many */
  function corner2Fields(body, it) {
    const { field, inp } = ctx.ui;
    const sel = (opts, value, on) => { const s = document.createElement('select'); opts.forEach(([v, l]) => s.add(new Option(l, v))); s.value = value; s.addEventListener('change', () => on(s.value)); return s; };
    const c2 = sel([['', t('stair.corner2None')], ['landing', t('stair.cornerLanding')], ['winder', t('stair.cornerWinder')]], hasCorner2(it) ? it.corner2 : '', (v) => {
      ctx.snapshot();
      if (v) it.corner2 = v; else { delete it.corner2; delete it.split2; }
      if (v !== 'winder') delete it.winders2;
      if (hasWinders(it) && !(hasCorner2(it) && !hasWinders2(it))) delete it.landing;   // no landing left to make deeper
      ctx.changed(); ctx.renderProps?.();
    });
    c2.id = 'stairCorner2';
    const f = field(t('stair.corner2'), c2); f.title = t('stair.corner2Hint');
    body.append(f);
    if (!hasWinders2(it)) return;
    const [lo, hi] = WINDER_RANGE.L;
    const wi = inp('number', winderCount2(it), (v) => { const k = Math.round(+v); if (k >= lo && k <= hi) it.winders2 = k; else delete it.winders2; }, { step: 1, min: lo, max: hi });
    wi.id = 'stairWinders2';
    body.append(field(t('stair.winders2'), wi));
  }
  document.querySelectorAll('#stairTypes button').forEach((b) => b.addEventListener('click', () => {
    type = b.dataset.stair;
    document.querySelectorAll('#stairTypes button').forEach((x) => x.classList.toggle('active', x === b));
    showCorner();
    ctx.plan()?.cancel();                                           // a path that was being drawn is dropped
    ctx.plan()?.render();
  }));
  $('#stairDir').addEventListener('change', (e) => { dir = e.target.value; ctx.plan()?.render(); });
  $('#stairTurn').addEventListener('change', (e) => { turn = e.target.value; ctx.plan()?.render(); });
  $('#stairRot').addEventListener('change', (e) => { rot = ((+e.target.value % 360) + 360) % 360 || 0; ctx.plan()?.render(); });
  $('#stairFloors').addEventListener('change', (e) => { floors = Math.max(1, Math.min(MAX_FLOORS, Math.round(+e.target.value) || 1)); e.target.value = floors; ctx.plan()?.render(); });
  /** only stairs with a turn have a landing; L and U stairs (also the stairwell) can turn with winders instead (#623) */
  function showCorner() {
    const cp = $('#stairCorner')?.closest('.prop'), lp = $('#stairLanding')?.closest('.prop');
    if (cp) cp.hidden = !(turns(type) || type === 'shaft');
    if (lp) lp.hidden = type === 'straight' || type === 'spiral' || ((turns(type) || type === 'shaft') && corner === 'winder');
  }
  $('#stairCorner')?.addEventListener('change', (e) => { corner = e.target.value === 'winder' ? 'winder' : 'landing'; showCorner(); ctx.plan()?.render(); });
  $('#stairLanding').addEventListener('change', (e) => { landing = +Math.max(0, Math.min(MAX_LANDING, +e.target.value || 0)).toFixed(2); e.target.value = landing; ctx.plan()?.render(); });
  return { build, showUpper, place, template: tpl, placeWall, wallDraft, wallPath, renderProps };
}
