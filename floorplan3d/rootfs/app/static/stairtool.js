/* Stair tool: the settings of the stair that will be placed (type, direction, turn, rotation), placing a stair and the "Treppenhaus" preset
 * (a U stair with four walls, a room and a door, and the same shell on the next floor), and the 3D mesh of a stair.
 * The geometry of the shaft is a pure function (tested). */
import * as THREE from './vendor/three.module.min.js';
import { stairDefaults, stairBounds, stairLocal } from './stairs.js';
import { OPENING_DEFAULTS, wallLength } from './walls.js';

const snap = (v) => Math.round(v / 0.05) * 0.05;

/** The shell of a stairwell around a U stair placed with its middle at (cx, cz), turned by rot degrees.
 *  base: the stair at x = z = 0 (rot 0), H: floor height, wallThickness: thickness of the new walls.
 *  Returns { corners: 4 world points (clockwise), stair: { x, z, rot } } where x/z is the stair origin so that the stair sits in the middle of the shell. */
export function shaftPlan(base, H, wallThickness, rot, cx, cz) {
  const b = stairBounds({ ...base, x: 0, z: 0, rot: 0 }, H);
  const m = 0.2 + wallThickness / 2;                              // clear space between stair and wall centre line
  const hw = (b.x1 - b.x0) / 2 + m, hd = (b.z1 - b.z0) / 2 + m;
  const r = ((rot % 360) + 360) % 360, th = (r * Math.PI) / 180;
  const rp = ([lx, lz]) => [snap(cx + lx * Math.cos(th) + lz * Math.sin(th)), snap(cz - lx * Math.sin(th) + lz * Math.cos(th))];
  const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(rp);
  const [ox, oz] = [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2];
  const wx = cx - (ox * Math.cos(th) + oz * Math.sin(th)), wz = cz - (-ox * Math.sin(th) + oz * Math.cos(th));
  return { corners, stair: { x: +wx.toFixed(3), z: +wz.toFixed(3), rot: r } };
}

/** ctx: $, t, settings(), layout(), floor(), floorIdx(), floorH, snapshot(), changed(), select(sel), setTool(name), plan(), uid(), mat(color, ghost, extra) */
export function initStairTool(ctx) {
  const { $, t } = ctx;
  let type = 'straight', dir = 'up', turn = 'right', rot = 0;
  const tpl = () => ({ ...stairDefaults(type === 'shaft' ? 'U' : type), type: type === 'shaft' ? 'U' : type, dir, turn, rot });

  /** stair mesh in the stair's local frame (origin = bottom start), steps as solid blocks */
  function build(st, holo, ghost, edgeMaterial) {
    const g = new THREE.Group();
    const stepMat = holo
      ? new THREE.MeshBasicMaterial({ color: 0x2a8cff, transparent: true, opacity: ghost ? 0.12 : 0.38, depthWrite: false, side: THREE.DoubleSide })
      : ctx.mat('#c9bba1', ghost, { side: THREE.DoubleSide });
    stairLocal(st, ctx.floorH).treads.forEach((tr) => {
      const shape = new THREE.Shape(tr.poly.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: tr.top, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, stepMat);
      m.castShadow = !holo; m.receiveShadow = !holo;
      g.add(m);
      if (holo && edgeMaterial) g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMaterial));
    });
    return g;
  }
  function place(x, z) {
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
    const shell = (fl) => {
      const th = settings.wallThickness, wh = settings.wallHeight, c = plan.corners;
      const ws = c.map((p, i) => ({ id: ctx.uid(), a: [...p], b: [...c[(i + 1) % 4]], thickness: th, height: wh, openings: [] }));
      fl.walls.push(...ws);
      fl.rooms.push({ id: ctx.uid(), name: t('stair.shaftName'), color: '#7d8a99', points: c.map((p) => [...p]) });
      return ws;
    };
    const ws = shell(f);
    const door = ws[0];
    if (wallLength(door) > OPENING_DEFAULTS.door.width + 0.4) door.openings.push({ id: ctx.uid(), type: 'door', pos: wallLength(door) / 2, ...OPENING_DEFAULTS.door });
    const st = { ...base, id: ctx.uid(), name: t('stair.shaftName'), ...plan.stair };
    (f.stairs ||= []).push(st);
    const other = layout.floors[dir === 'up' ? ctx.floorIdx() + 1 : -1];
    if (other) shell(other);                                        // same walls above so the shaft continues
    ctx.select({ kind: 'stair', id: st.id });
    ctx.changed();
    ctx.setTool('select');
  }
  document.querySelectorAll('#stairTypes button').forEach((b) => b.addEventListener('click', () => {
    type = b.dataset.stair;
    document.querySelectorAll('#stairTypes button').forEach((x) => x.classList.toggle('active', x === b));
    ctx.plan()?.render();
  }));
  $('#stairDir').addEventListener('change', (e) => { dir = e.target.value; ctx.plan()?.render(); });
  $('#stairTurn').addEventListener('change', (e) => { turn = e.target.value; ctx.plan()?.render(); });
  $('#stairRot').addEventListener('change', (e) => { rot = ((+e.target.value % 360) + 360) % 360 || 0; ctx.plan()?.render(); });
  return { build, place, template: tpl };
}
