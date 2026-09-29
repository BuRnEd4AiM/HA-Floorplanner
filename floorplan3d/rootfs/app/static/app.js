import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { DEVICE_TYPES, makeModel, forgetGlb, isCustom } from './models.js';
import {
  OPENING_DEFAULTS, buildWall, wallLength, projectOnWall, clampOpeningPos, openingOverlaps,
} from './walls.js';
import { t, setLanguage, applyI18n } from './i18n.js';

/* ================= State ================= */
const FLOOR_H = 3.0;
const M_TO_FT = 3.28084;
const params = new URLSearchParams(location.search);

let settings = {
  language: 'de', theme: 'holo', units: 'metric', grid: 0.25, wallHeight: 2.6, wallThickness: 0.2,
  shadows: true, autosaveSeconds: 1.5, lowWalls: false, showLabels: true, cutaway: true,
};
let layout = { version: 1, floors: [] };
let floorIdx = 0;
let mode = 'edit';                 // 'edit' | 'live'
let tool = 'select';
let selection = null;              // { kind: 'wall'|'room'|'device'|'opening', id }
let deviceType = 'light';
let openingType = 'door';
let entityChoice = '';
let entities = [];
let states = {};                   // entity_id -> { state, unit }
let customModels = [];
let lowWalls = false;
let is2d = false;
let livePopupFor = null;           // device id
const undoStack = [];
let saveTimer = null;

const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const floor = () => layout.floors[floorIdx];
const elev = (i = floorIdx) => i * FLOOR_H;
const isLive = () => mode === 'live';

/* unit helpers – data is always stored in meters */
const imperial = () => settings.units === 'imperial';
const toDisp = (m) => +(imperial() ? m * M_TO_FT : m).toFixed(3);
const fromDisp = (v) => (imperial() ? v / M_TO_FT : v);
const fmtLen = (m) => (imperial() ? `${(m * M_TO_FT).toFixed(2)} ft` : `${m.toFixed(2)} m`);

/* ================= Three.js setup ================= */
const canvas = $('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
camera.position.set(9, 10, 12);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.02;

scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(8, 16, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 60 });
scene.add(sun);

let grid = null;
const world = new THREE.Group();
const temp = new THREE.Group();
scene.add(world, temp);
let selHelper = null;

function resize() {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

function themeColors() {
  if (settings.theme === 'holo') return { scene: 0x050d1c, gridA: 0x2a9fd6, gridB: 0x14508a };
  const dark = settings.theme === 'dark';
  return { scene: dark ? 0x0f1419 : 0xe9edf1, gridA: dark ? 0x3a4756 : 0xb7c0c9, gridB: dark ? 0x232d38 : 0xd5dbe1 };
}
function rebuildGrid() {
  if (grid) { scene.remove(grid); grid.geometry.dispose(); }
  const c = themeColors();
  const size = 60, div = Math.max(2, Math.round(size / Math.max(settings.grid, 0.1)));
  grid = new THREE.GridHelper(size, isHolo() ? 60 : Math.min(div, 600), c.gridA, c.gridB);
  if (isHolo()) { [].concat(grid.material).forEach((m) => { m.transparent = true; m.opacity = 0.28; m.depthWrite = false; }); }
  scene.add(grid);
}

/* ================= Scene from data ================= */
const registry = new Map();       // id -> Object3D
const pickables = [];
const labelSprites = new Map();   // device id -> sprite
let cutawayWalls = [];            // { group, mid:[x,z], n:[nx,nz] } for the active floor

function mat(color, ghost, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.85, metalness: 0.05, transparent: ghost || extra.opacity < 1,
    ...extra, opacity: ghost ? Math.min(0.25, extra.opacity ?? 0.25) : (extra.opacity ?? 1),
  });
}

function textSprite(text, { size = 30, scaleX = 2.4, scaleY = 0.6, depthTest = false } = {}) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest }));
  s.scale.set(scaleX, scaleY, 1);
  s.renderOrder = 10;
  s.userData.setText = (txt, badge = false) => {
    const key = txt + (badge ? '|b' : '');
    if (s.userData.text === key) return;
    s.userData.text = key;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 64);
    if (badge) {                                   // glowing orange pill, like the power badges in the reference
      const grad = g.createLinearGradient(0, 8, 0, 56);
      grad.addColorStop(0, '#ffd45e'); grad.addColorStop(1, '#ff9d2e');
      g.shadowColor = 'rgba(255,170,40,.9)'; g.shadowBlur = 14;
      g.fillStyle = grad; g.beginPath(); g.roundRect(14, 10, 228, 44, 22); g.fill();
      g.shadowBlur = 0;
      g.font = `700 ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#3b2400'; g.fillText(txt, 128, 33);
      tex.needsUpdate = true;
      return;
    }
    g.font = `600 ${size}px system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.75)';
    g.strokeText(txt, 128, 32);
    g.fillStyle = '#fff'; g.fillText(txt, 128, 32);
    tex.needsUpdate = true;
  };
  s.userData.setText(text);
  return s;
}


/** Invisible, slightly padded hit box so small devices (ceiling lamps, switches) are easy to tap. */
function addPickProxy(model) {
  model.children.filter((c) => c.userData.proxy).forEach((c) => { model.remove(c); c.geometry.dispose(); });
  const saved = { p: model.position.clone(), r: model.rotation.clone(), s: model.scale.clone() };
  model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.scale.set(1, 1, 1);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  box.applyMatrix4(model.matrixWorld.clone().invert());
  model.position.copy(saved.p); model.rotation.copy(saved.r); model.scale.copy(saved.s);
  model.updateMatrixWorld(true);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(size.x + 0.1, 0.35), Math.max(size.y + 0.1, 0.35), Math.max(size.z + 0.1, 0.35)),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  proxy.position.copy(box.getCenter(new THREE.Vector3()));
  proxy.userData.proxy = true;
  model.add(proxy);
}

const HOLO = { fill: 0x1f6fe0, edge: 0x3df2ff, on: 0xff9d2e, onEdge: 0xffd08a, floor: 0x0a1830, floorLit: 0xff9d2e };
const isHolo = () => settings.theme === 'holo';
const roomMeshes = new Map();     // room id -> { mesh, room }

/** Turn a model into a translucent blue wireframe hologram; lit parts are remembered for state changes. */
function holoify(model, ghost) {
  const glow = new Set(model.userData.glow || []);
  const meshes = [];
  model.traverse((o) => { if (o.isMesh && !o.userData.proxy && !o.userData.holo) meshes.push(o); });
  const hg = model.userData.holoGlow ||= { fill: [], edge: [] };
  for (const o of meshes) {
    const isGlow = glow.has(o.material);
    o.material = new THREE.MeshBasicMaterial({ color: HOLO.fill, transparent: true, opacity: ghost ? 0.06 : 0.38, depthWrite: false });
    o.userData.holo = true;
    const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.15 : 0.95 });
    o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), em));
    if (isGlow) { hg.fill.push(o.material); hg.edge.push(em); }
  }
}

function pointInPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

const LABEL_DOMAINS = new Set(['sensor', 'binary_sensor', 'climate']);

function build() {
  world.clear();
  registry.clear(); pickables.length = 0; labelSprites.clear(); cutawayWalls = []; roomMeshes.clear();
  const holo = isHolo();
  layout.floors.forEach((f, i) => {
    if (i > floorIdx) return;
    const ghost = i < floorIdx;
    const edgeMaterial = holo ? new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.15 : 0.95 }) : null;
    const g = new THREE.Group();
    g.position.y = elev(i);
    world.add(g);

    f.rooms.forEach((r) => {
      if (r.points.length < 3) return;
      const shape = new THREE.Shape(r.points.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, holo
        ? new THREE.MeshBasicMaterial({ color: HOLO.floor, transparent: true, opacity: ghost ? 0.25 : 1, side: THREE.DoubleSide, depthWrite: false })
        : mat(r.color || '#8a7f70', ghost, { side: THREE.DoubleSide }));
      m.position.y = 0.01;
      m.receiveShadow = true;
      g.add(m);
      let wash = null;
      if (holo && !ghost) {                          // coloured "air" that tints the room's inner walls when a light is on
        const eg = new THREE.ExtrudeGeometry(shape, { depth: 1.1, bevelEnabled: false });
        eg.rotateX(-Math.PI / 2);
        wash = new THREE.Mesh(eg, new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.4, side: THREE.BackSide, depthWrite: false }));
        wash.visible = false; wash.renderOrder = 1;
        g.add(wash);
      }
      if (!ghost) {
        m.userData = { kind: 'room', id: r.id };
        registry.set(r.id, m); pickables.push(m);
        roomMeshes.set(r.id, { mesh: m, room: r, wash });
        if (r.name) {
          const c = r.points.reduce((a, p) => [a[0] + p[0] / r.points.length, a[1] + p[1] / r.points.length], [0, 0]);
          const sp = textSprite(is2d ? `${r.name} · ${imperial() ? (polyArea(r.points) * 10.7639).toFixed(0) + ' ft²' : polyArea(r.points).toFixed(1) + ' m²'}` : r.name);
          sp.position.set(c[0], 0.45, c[1]);
          g.add(sp);
        }
      }
    });

    f.walls.forEach((w) => {
      if (wallLength(w) < 0.01) return;
      const wallMat = holo
        ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: ghost ? 0.08 : 0.72, depthWrite: false, side: THREE.DoubleSide })
        : mat('#d9d4cc', ghost);
      const wg = buildWall(w, { material: wallMat, ghost, low: lowWalls, makeMat: mat, holo, edgeMaterial });
      g.add(wg);
      if (!ghost) {
        cutawayWalls.push(wallCutawayInfo(w, wg));
        registry.set(w.id, wg); pickables.push(wg);
        wg.children.forEach((c) => { if (c.userData?.kind === 'opening') { registry.set(c.userData.id, c); pickables.push(c); } });
      }
    });

    f.devices.forEach((d) => {
      const model = makeModel(d.type, (m) => { if (!ghost) addPickProxy(m); if (holo) holoify(m, ghost); applyStates(); refreshSelHelper(); });
      model.position.set(d.x, d.y ?? 0, d.z);
      model.rotation.y = THREE.MathUtils.degToRad(d.rot || 0);
      model.scale.setScalar(d.scale || 1);
      if (!ghost) addPickProxy(model);
      if (holo) holoify(model, ghost);
      model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = !holo;
        if (ghost && !holo) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.25; }
      });
      model.userData.kind = 'device';
      model.userData.id = d.id;
      g.add(model);
      if (!ghost) {
        registry.set(d.id, model); pickables.push(model);
        const dom = d.entity?.split('.')[0];
        if (LABEL_DOMAINS.has(dom)) {
          const sp = textSprite('…', { size: 34, scaleX: 1.2, scaleY: 0.3 });
          sp.position.set(d.x, (d.y || 0) + 0.3 + 0.2 * (d.scale || 1), d.z);
          g.add(sp);
          labelSprites.set(d.id, sp);
        }
      }
    });
  });
  applyStates();
  refreshSelection();
  buildNav();
}

const ON_STATES = new Set(['on', 'open', 'playing', 'heat', 'cool', 'heat_cool', 'unlocked', 'home']);

function stateText(entityId) {
  const s = states[entityId];
  if (!s) return '—';
  return s.unit ? `${s.state} ${s.unit}` : s.state;
}

let viewMode = 'normal';           // normal | temp | humid (room colouring by sensor values)
function roomHeat(room, f) {
  const vals = f.devices.filter((d) => d.entity && pointInPoly(d.x, d.z, room.points))
    .map((d) => ({ id: d.entity, s: states[d.entity] }))
    .filter(({ id, s }) => s && !isNaN(parseFloat(s.state)) && (viewMode === 'temp' ? s.unit === '°C' : s.unit === '%' && /feucht|humid/i.test(id)))
    .map(({ s }) => parseFloat(s.state));
  if (!vals.length) return null;
  const v = vals.reduce((x, y) => x + y) / vals.length;
  const k = viewMode === 'temp' ? Math.min(1, Math.max(0, (v - 16) / 12)) : Math.min(1, Math.max(0, (v - 30) / 50));
  const c = new THREE.Color();
  if (viewMode === 'temp') c.setHSL(0.62 - 0.62 * k, 0.85, 0.42); else c.setHSL(0.55, 0.3 + 0.6 * k, 0.55 - 0.25 * k);
  return c.getHex();
}

function applyStates() {
  const f = layout.floors[floorIdx];
  if (!f) return;
  f.devices.forEach((d) => {
    const obj = registry.get(d.id);
    const on = d.entity && ON_STATES.has(states[d.entity]?.state);
    obj?.userData.glow?.forEach((m) => {
      m.emissive.set(on ? 0xffd27a : 0x000000);
      m.emissiveIntensity = on ? 1.4 : 0;
    });
    const hg = obj?.userData.holoGlow;
    if (hg) {
      hg.fill.forEach((m) => { m.color.setHex(on ? HOLO.on : HOLO.fill); m.opacity = on ? 0.8 : 0.38; });
      hg.edge.forEach((m) => m.color.setHex(on ? HOLO.onEdge : HOLO.edge));
    }
    const sp = labelSprites.get(d.id);
    if (sp) { sp.visible = settings.showLabels; sp.userData.setText(stateText(d.entity), isHolo() && states[d.entity]?.unit === 'W'); }
  });
  if (isHolo()) {                         // lit rooms: floor + walls take the colour of the light inside
    roomMeshes.forEach(({ mesh, room, wash }) => {
      const lights = f.devices.filter((d) => d.entity && /^(light|switch)\./.test(d.entity)
        && ON_STATES.has(states[d.entity]?.state) && pointInPoly(d.x, d.z, room.points));
      const heat = viewMode === 'normal' ? null : roomHeat(room, f);
      let col = null;
      if (heat) col = heat;
      else if (lights.length) {
        const rgb = lights.map((d) => states[d.entity]?.rgb).find(Array.isArray);
        col = rgb ? new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255).getHex() : 0xffc861;
      }
      mesh.material.color.setHex(col ?? HOLO.floor);
      if (col && !heat) mesh.material.color.multiplyScalar(0.8);
      mesh.material.opacity = col ? (heat ? 0.85 : 0.75) : 1;
      if (wash) { wash.visible = !!col && !heat; if (col) wash.material.color.setHex(col); }
    });
  }
  if (livePopupFor) renderLivePopup();
  if (roomPanelFor && !document.activeElement?.matches?.('#roomPanel input')) renderRoomPanel();
}

function refreshSelHelper() {
  if (selHelper) { scene.remove(selHelper); selHelper = null; }
  const obj = selection && registry.get(selection.id);
  if (!obj) return;
  selHelper = new THREE.BoxHelper(obj, 0x3fa9f5);
  scene.add(selHelper);
}
function refreshSelection() {
  if (selection && !registry.get(selection.id)) selection = null;
  refreshSelHelper();
  renderProps();
}


/* ---- Cutaway: walls between the camera and the interior sink down so you can look inside ---- */
function wallCutawayInfo(w, group) {
  const { cx, cz } = floorBounds();
  const mid = [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
  const len = wallLength(w) || 1;
  let n = [-(w.b[1] - w.a[1]) / len, (w.b[0] - w.a[0]) / len];        // one of the two wall normals
  if (n[0] * (mid[0] - cx) + n[1] * (mid[1] - cz) < 0) n = [-n[0], -n[1]];   // point it away from the centre
  return { group, n, low: 1 };
}
const CUT_LOW = 0.14;
function updateCutaway() {
  if (!cutawayWalls.length) return;
  const { cx, cz } = floorBounds();
  let dx = camera.position.x - cx, dz = camera.position.z - cz;
  const horiz = Math.hypot(dx, dz);
  const steep = Math.hypot(dx, dz) < (camera.position.y - elev()) * 0.25;   // almost straight down: keep walls
  dx /= horiz || 1; dz /= horiz || 1;
  for (const c of cutawayWalls) {
    const faces = settings.cutaway && !lowWalls && !steep && (c.n[0] * dx + c.n[1] * dz) > 0.2;
    const target = faces ? CUT_LOW : 1;
    c.low += (target - c.low) * 0.2;
    if (Math.abs(target - c.low) < 0.002) c.low = target;
    c.group.scale.y = c.low;
  }
}

/* ================= Changes, undo, save ================= */
function snapshot() {
  undoStack.push(JSON.stringify(layout));
  if (undoStack.length > 60) undoStack.shift();
}
function undo() {
  const s = undoStack.pop();
  if (!s) return;
  layout = JSON.parse(s);
  floorIdx = Math.min(floorIdx, layout.floors.length - 1);
  selection = null; focusedRoom = null; clearFocusOutline();
  fillFloorSelect(); build(); scheduleSave();
}
function changed(rebuild = true) {
  if (rebuild) build();
  scheduleSave();
}
function setStatus(txt) { $('#status').textContent = txt; }
function scheduleSave() {
  setStatus(t('unsaved'));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, (settings.autosaveSeconds || 1.5) * 1000);
}
async function save() {
  clearTimeout(saveTimer);
  try {
    const r = await fetch('api/layout', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(layout) });
    setStatus(r.ok ? t('saved') : t('saveFailed'));
  } catch { setStatus(t('saveFailed')); }
}

/* ================= Picking / snapping ================= */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const hitVec = new THREE.Vector3();
function setRay(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function groundPoint(e) {
  setRay(e);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -elev());
  return ray.ray.intersectPlane(plane, hitVec) ? [hitVec.x, hitVec.z] : null;
}
function pickHit(e) {
  setRay(e);
  for (const h of ray.intersectObjects(pickables, true)) {
    let o = h.object;
    while (o && !o.userData.kind) o = o.parent;
    if (o) return { data: o.userData, point: h.point };
  }
  return null;
}
const pick = (e) => pickHit(e)?.data ?? null;

function snap([x, z], fine = false) {
  const s = fine ? 0.05 : settings.grid;
  for (const w of floor().walls) for (const q of [w.a, w.b]) {
    if (Math.hypot(q[0] - x, q[1] - z) < 0.3) return [q[0], q[1]];
  }
  return [Math.round(x / s) * s, Math.round(z / s) * s];
}
const findWall = (id) => floor().walls.find((w) => w.id === id);
const findOpening = (id) => {
  for (const w of floor().walls) {
    const o = (w.openings || []).find((x) => x.id === id);
    if (o) return { wall: w, opening: o };
  }
  return null;
};

/* ================= Drawing state ================= */
let drawPts = [];
let cursor = null;
let down = null;           // pointer-down info
let openingPreview = null; // { wall, pos, valid }

function updateTemp() {
  temp.clear();
  if (tool === 'opening' && openingPreview) {
    const { wall: w, pos, valid } = openingPreview;
    const def = OPENING_DEFAULTS[openingType];
    const len = wallLength(w);
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(def.width, def.height, w.thickness + 0.06),
      new THREE.MeshBasicMaterial({ color: valid ? 0x3fa9f5 : 0xff5555, transparent: true, opacity: 0.45, depthTest: false }),
    );
    m.renderOrder = 5;
    m.position.set(0, def.sill + def.height / 2, 0);
    const g = new THREE.Group();
    g.add(m);
    g.position.set((w.a[0] + w.b[0]) / 2, elev(), (w.a[1] + w.b[1]) / 2);
    g.rotation.y = -Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]);
    m.position.x = pos - len / 2;
    temp.add(g);
    return;
  }
  if (!drawPts.length) return;
  const pts = [...drawPts, ...(cursor ? [cursor] : [])].map(([x, z]) => new THREE.Vector3(x, elev() + 0.05, z));
  if (tool === 'room' && pts.length > 2) pts.push(pts[0]);
  temp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x3fa9f5 })));
  drawPts.forEach(([x, z]) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0x3fa9f5 }));
    d.position.set(x, elev() + 0.05, z);
    temp.add(d);
  });
  if (cursor) {
    const last = drawPts[drawPts.length - 1];
    setStatus(`${t('length')}: ${fmtLen(Math.hypot(cursor[0] - last[0], cursor[1] - last[1]))}`);
  }
}
function endDrawing() { drawPts = []; cursor = null; openingPreview = null; temp.clear(); }

function finishRoom() {
  if (drawPts.length >= 3) {
    snapshot();
    floor().rooms.push({ id: uid(), name: `${t('prop.room')} ${floor().rooms.length + 1}`, color: '#8a7f70', points: drawPts.map((p) => [...p]) });
    changed();
  }
  endDrawing();
}

/** Compute where an opening would go for the wall under the pointer. */
function openingTarget(e, ignoreId = null, def = OPENING_DEFAULTS[openingType], forcedWall = null) {
  let wall = forcedWall;
  let point = null;
  if (!wall) {
    const h = pickHit(e);
    if (h?.data.kind !== 'wall') return null;
    wall = findWall(h.data.id);
    point = [h.point.x, h.point.z];
  } else {
    point = groundPoint(e);
  }
  if (!wall || !point) return null;
  const raw = Math.round(projectOnWall(wall, point) / 0.05) * 0.05;
  const pos = clampOpeningPos(wall, def.width, raw);
  if (pos === null) return null;
  return { wall, pos, valid: !openingOverlaps(wall, pos, def.width, ignoreId) };
}

/* ================= Pointer events ================= */
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  down = { x: e.clientX, y: e.clientY, hit: null, drag: false, dev: null, op: null };
  if (isLive() || tool !== 'select') return;
  const h = pick(e);
  down.hit = h;
  if (h?.kind === 'device') {
    const d = floor().devices.find((v) => v.id === h.id);
    const gp = groundPoint(e);
    if (d && gp) {
      selection = h; refreshSelection();
      down.dev = { d, dx: d.x - gp[0], dz: d.z - gp[1], moved: false };
      controls.enabled = false;
    }
  } else if (h?.kind === 'opening') {
    const f = findOpening(h.id);
    if (f) {
      selection = h; refreshSelection();
      down.op = { ...f, moved: false };
      controls.enabled = false;
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.drag = true;
  if (isLive()) return;
  const gp = groundPoint(e);

  if (down?.dev && gp) {
    if (!down.dev.moved) { snapshot(); down.dev.moved = true; }
    const [x, z] = snap([gp[0] + down.dev.dx, gp[1] + down.dev.dz], true);
    const d = down.dev.d;
    d.x = x; d.z = z;
    const obj = registry.get(d.id);
    obj.position.x = x; obj.position.z = z;
    const sp = labelSprites.get(d.id);
    if (sp) sp.position.set(x, sp.position.y, z);
    return;
  }
  if (down?.op && down.drag) {
    const { wall, opening } = down.op;
    const tgt = openingTarget(e, opening.id, opening, wall);
    if (tgt?.valid && Math.abs(tgt.pos - opening.pos) > 1e-6) {
      if (!down.op.moved) { snapshot(); down.op.moved = true; }
      opening.pos = tgt.pos;
      build();
    }
    return;
  }
  if (tool === 'opening') {
    const tgt = openingTarget(e);
    openingPreview = tgt;
    updateTemp();
  } else if ((tool === 'wall' || tool === 'room') && gp) {
    cursor = snap(gp);
    updateTemp();
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (e.button !== 0 || !down) return;
  const st = down;
  down = null;
  controls.enabled = true;

  if (st.dev?.moved) { changed(false); refreshSelection(); return; }
  if (st.op?.moved) { changed(false); refreshSelection(); return; }
  if (st.drag) return;                         // camera drag, not a click

  if (isLive()) { handleLiveTap(e); return; }

  const gp = groundPoint(e);
  if (tool === 'select') {
    selection = st.hit; refreshSelection();
  } else if (tool === 'erase') {
    const h = pick(e);
    if (h) { snapshot(); deleteItem(h); }
  } else if (tool === 'wall' && gp) {
    const p = snap(gp);
    const last = drawPts[drawPts.length - 1];
    if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.01) { endDrawing(); return; }
    if (last) {
      snapshot();
      floor().walls.push({ id: uid(), a: [...last], b: [...p], thickness: settings.wallThickness, height: settings.wallHeight, openings: [] });
      changed();
    }
    drawPts.push(p);
    updateTemp();
  } else if (tool === 'room' && gp) {
    const p = snap(gp);
    if (drawPts.length >= 3 && Math.hypot(p[0] - drawPts[0][0], p[1] - drawPts[0][1]) < 0.01) { finishRoom(); return; }
    drawPts.push(p);
    updateTemp();
  } else if (tool === 'opening') {
    const tgt = openingTarget(e);
    if (tgt?.valid) {
      snapshot();
      const def = OPENING_DEFAULTS[openingType];
      const o = { id: uid(), type: openingType, pos: tgt.pos, ...def };
      (tgt.wall.openings ||= []).push(o);
      selection = { kind: 'opening', id: o.id };
      openingPreview = null; temp.clear();
      changed();
    }
  } else if (tool === 'device' && gp) {
    snapshot();
    const custom = isCustom(deviceType);
    const def = custom ? { y: 0 } : DEVICE_TYPES[deviceType];
    const ent = entities.find((x) => x.entity_id === entityChoice);
    const [x, z] = snap(gp, true);
    const d = {
      id: uid(), type: deviceType, x, z, y: def.y || 0, rot: 0, scale: 1,
      name: ent?.name || (custom ? deviceType.slice(4) : t(`dev.${deviceType}`)), entity: entityChoice || '',
    };
    floor().devices.push(d);
    selection = { kind: 'device', id: d.id };
    changed();
  }
});

canvas.addEventListener('pointerleave', () => { if (tool === 'opening') { openingPreview = null; temp.clear(); } });

canvas.addEventListener('dblclick', (e) => {
  if (isLive()) return;
  if (tool === 'wall') { endDrawing(); return; }
  if (tool === 'room') { finishRoom(); return; }
  if (tool === 'select') {
    const h = pick(e);
    if (h?.kind !== 'device') return;
    const d = floor().devices.find((v) => v.id === h.id);
    if (d?.entity) quickAction(d.entity);
  }
});

function deleteItem({ kind, id }) {
  const f = floor();
  if (kind === 'wall') f.walls = f.walls.filter((x) => x.id !== id);
  if (kind === 'room') f.rooms = f.rooms.filter((x) => x.id !== id);
  if (kind === 'device') f.devices = f.devices.filter((x) => x.id !== id);
  if (kind === 'opening') {
    const found = findOpening(id);
    if (found) found.wall.openings = found.wall.openings.filter((x) => x.id !== id);
  }
  if (selection?.id === id) selection = null;
  changed();
}

window.addEventListener('keydown', (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && e.key !== 'Escape') return;
  const k = e.key.toLowerCase();
  if (k === 'escape') { endDrawing(); closeLivePopup(); setStatus(''); return; }
  if (isLive()) return;
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); }
  else if (k === 'delete' || k === 'backspace') { if (selection) { snapshot(); deleteItem(selection); } }
  else if ((k === 'q' || k === 'e') && selection?.kind === 'device') {
    const d = floor().devices.find((v) => v.id === selection.id);
    if (d) { snapshot(); d.rot = ((d.rot || 0) + (k === 'q' ? -15 : 15) + 360) % 360; changed(); }
  } else if (k === 'v') setTool('select');
  else if (k === 'w') setTool('wall');
  else if (k === 'r') setTool('room');
  else if (k === 'o') setTool('opening');
  else if (k === 'd') setTool('device');
});

/* ================= Live control ================= */
const ACTIONS = {
  light: ['turn_on', 'turn_off', 'toggle'], switch: ['turn_on', 'turn_off', 'toggle'],
  fan: ['turn_on', 'turn_off', 'toggle'], input_boolean: ['turn_on', 'turn_off', 'toggle'],
  cover: ['open_cover', 'close_cover', 'stop_cover'], lock: ['lock', 'unlock'],
  scene: ['turn_on'], script: ['turn_on'],
};
const ACTION_LABEL = {
  turn_on: 'live.on', turn_off: 'live.off', toggle: 'live.toggle', open_cover: 'live.open',
  close_cover: 'live.close', stop_cover: 'live.stop', lock: 'live.lock', unlock: 'live.unlock',
};

async function callService(entityId, service, data) {
  const domain = entityId.split('.')[0];
  const svc = domain === 'scene' || domain === 'script' ? 'turn_on' : service;
  try {
    const r = await fetch('api/service', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, service: svc, entity_id: entityId, ...(data ? { data } : {}) }) });
    if (!r.ok) throw new Error(String(r.status));
  } catch { setStatus(t('live.failed')); return; }
  setTimeout(pollStates, 400);
}
function quickAction(entityId) {
  const acts = ACTIONS[entityId.split('.')[0]];
  if (!acts) return;
  callService(entityId, acts.includes('toggle') ? 'toggle' : acts[0]);
}

function handleLiveTap(e) {
  const h = pick(e);
  if (h?.kind === 'device') { livePopupFor = h.id; renderLivePopup(); }
  else closeLivePopup();
}
function closeLivePopup() { livePopupFor = null; $('#livePopup').hidden = true; }
function renderLivePopup() {
  const box = $('#livePopup');
  const d = floor()?.devices.find((v) => v.id === livePopupFor);
  if (!d) { closeLivePopup(); return; }
  box.hidden = false;
  box.innerHTML = '';
  const title = document.createElement('div'); title.className = 'title'; title.textContent = d.name || '';
  const sub = document.createElement('div'); sub.className = 'sub';
  sub.textContent = d.entity ? `${stateText(d.entity)} · ${d.entity}` : t('live.noEntity');
  box.append(title, sub);
  const acts = d.entity ? ACTIONS[d.entity.split('.')[0]] : null;
  if (acts) {
    const row = document.createElement('div'); row.className = 'actions';
    (d.entity.startsWith('scene.') || d.entity.startsWith('script.') ? ['turn_on'] : acts).forEach((a) => {
      const b = document.createElement('button');
      b.textContent = d.entity.match(/^(scene|script)\./) ? t('live.activate') : t(ACTION_LABEL[a]);
      b.addEventListener('click', () => callService(d.entity, a));
      row.append(b);
    });
    box.append(row);
  }
}

/* ---- Room panel: all entities of a room, grouped, with brightness / position sliders ---- */
let roomPanelFor = null;
const polyArea = (p) => Math.abs(p.reduce((s, [x, z], i) => { const [x2, z2] = p[(i + 1) % p.length]; return s + x * z2 - x2 * z; }, 0)) / 2;
const RP_GROUPS = [['light', 'rp.light'], ['cover', 'rp.cover'], ['media_player', 'rp.media'], ['switch', 'rp.switch'], ['sensor', 'rp.sensor']];
const rpGroupOf = (dom) => (dom === 'binary_sensor' || dom === 'climate' ? 'sensor' : dom === 'fan' || dom === 'input_boolean' ? 'switch' : dom);

function closeRoomPanel() { roomPanelFor = null; $('#roomPanel').hidden = true; }
function renderRoomPanel() {
  const box = $('#roomPanel');
  const room = floor()?.rooms.find((r) => r.id === roomPanelFor);
  if (!room) { closeRoomPanel(); return; }
  box.hidden = false;
  box.replaceChildren();
  const head = document.createElement('div'); head.className = 'rp-head';
  const title = document.createElement('b'); title.textContent = room.name || '';
  const x = document.createElement('button'); x.className = 'rp-x'; x.textContent = '×'; x.addEventListener('click', closeRoomPanel);
  head.append(title, x);
  const area = document.createElement('div'); area.className = 'sub';
  area.textContent = imperial() ? `${(polyArea(room.points) * 10.7639).toFixed(0)} ft²` : `${polyArea(room.points).toFixed(1)} m²`;
  box.append(head, area);
  const devs = floor().devices.filter((d) => d.entity && pointInPoly(d.x, d.z, room.points));
  RP_GROUPS.forEach(([group, key]) => {
    const list = devs.filter((d) => rpGroupOf(d.entity.split('.')[0]) === group);
    if (!list.length) return;
    const h = document.createElement('h4'); h.textContent = t(key); box.append(h);
    list.forEach((d) => {
      const dom = d.entity.split('.')[0], st = states[d.entity];
      const row = document.createElement('div');
      row.className = 'row' + (st && ON_STATES.has(st.state) ? ' on' : '');
      const n = document.createElement('span'); n.className = 'n'; n.textContent = d.name || d.entity;
      const v = document.createElement('span'); v.className = 'v'; v.textContent = stateText(d.entity);
      row.append(n, v);
      if (ACTIONS[dom] && dom !== 'cover') {
        const b = document.createElement('button');
        b.textContent = dom === 'scene' || dom === 'script' ? t('live.activate') : t('live.toggle');
        b.addEventListener('click', () => quickAction(d.entity));
        row.append(b);
      }
      const slider = (val, onChange) => {
        const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = val ?? 0;
        r.addEventListener('change', () => onChange(+r.value));
        row.append(r);
      };
      if (dom === 'light' && st?.brightness != null) slider(st.brightness, (p) => callService(d.entity, 'turn_on', { brightness_pct: p }));
      if (dom === 'cover') {
        ['open_cover', 'stop_cover', 'close_cover'].forEach((a) => {
          const b = document.createElement('button'); b.textContent = t(ACTION_LABEL[a]);
          b.addEventListener('click', () => callService(d.entity, a)); row.append(b);
        });
        if (st?.position != null) slider(st.position, (p) => callService(d.entity, 'set_cover_position', { position: p }));
      }
      box.append(row);
    });
  });
  if (!devs.length) { const e = document.createElement('div'); e.className = 'sub'; e.textContent = t('rp.empty'); box.append(e); }
}
function openRoomPanel(id) { roomPanelFor = id; closeLivePopup(); renderRoomPanel(); }

/* ================= Tools, views, mode ================= */
function setTool(next) {
  tool = next; endDrawing(); setStatus('');
  document.querySelectorAll('#tools button').forEach((b) => b.classList.toggle('active', b.dataset.tool === next));
  $('#hintText').textContent = t(`hint.${next}`);
  $('#devicePalette').hidden = next !== 'device';
  $('#openingPalette').hidden = next !== 'opening';
  canvas.style.cursor = next === 'select' ? 'default' : 'crosshair';
}
document.querySelectorAll('#tools button').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));

function setMode(next) {
  mode = next;
  document.body.classList.toggle('live', isLive());
  document.querySelectorAll('#modeSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.mode === next));
  closeLivePopup(); closeRoomPanel(); selection = null;
  if (isLive()) {
    setTool('select');
    $('#hintText').textContent = t('hint.live');
    canvas.style.cursor = 'pointer';
  } else setTool(tool);
  refreshSelection();
  requestAnimationFrame(resize);
}
document.querySelectorAll('#modeSwitch button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

function floorBounds() {
  const f = floor();
  const pts = [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...f.devices.map((d) => [d.x, d.z])];
  if (!pts.length) return { cx: 0, cz: 0, size: 12 };
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, size: Math.max(x1 - x0, z1 - z0, 4) };
}
function fitCamera() {
  const { cx, cz, size } = floorBounds();
  const dist = size * 1.25 + 2;
  controls.target.set(cx, elev(), cz);
  if (is2d) camera.position.set(cx, elev() + dist * 1.2, cz + 0.001);
  else camera.position.set(cx + dist * 0.4, elev() + dist * 0.95, cz + dist * 0.7);
  controls.update();
}
function setView(is2) {
  is2d = is2;
  $('#view2d').classList.toggle('active', is2d);
  $('#view3d').classList.toggle('active', !is2d);
  controls.enableRotate = !is2d;
  build(); fitCamera();
}
$('#view2d').addEventListener('click', () => setView(true));
$('#view3d').addEventListener('click', () => setView(false));
$('#fitBtn').addEventListener('click', fitCamera);
$('#wallToggle').addEventListener('click', () => setLowWalls(!lowWalls));
function updateNavToggles() {
  $('#wallToggle').textContent = t(lowWalls ? 'view.wallsLow' : 'view.wallsHigh');
  $('#wallToggle').classList.toggle('active', !lowWalls);
  $('#autoToggle').classList.toggle('active', !!settings.cutaway);
}
function setLowWalls(v) {
  lowWalls = v;
  updateNavToggles();
  build();
}
$('#saveBtn').addEventListener('click', save);

/* ================= Floors, rooms, navigation pills ================= */
let focusedRoom = null;
let navKey = '';
const focusGroup = new THREE.Group();
scene.add(focusGroup);

function pill(label, active, onClick, title = '') {
  const b = document.createElement('button');
  b.className = 'pill' + (active ? ' active' : '');
  b.textContent = label;
  if (title) b.title = title;
  b.addEventListener('click', onClick);
  return b;
}

function buildNav(force = false) {
  const f = floor();
  if (!f) return;
  const rooms = f.rooms.filter((r) => r.name);
  const key = JSON.stringify([floorIdx, layout.floors.map((x) => x.name), rooms.map((r) => [r.id, r.name]), focusedRoom, settings.language]);
  if (!force && key === navKey) return;
  navKey = key;
  const fp = $('#floorPills'), rp = $('#roomPills');
  fp.replaceChildren(...layout.floors.map((x, i) => pill(x.name, i === floorIdx, () => switchFloor(i))));
  rp.replaceChildren(...rooms.map((r) => pill(r.name, r.id === focusedRoom, () => { const off = r.id === focusedRoom; focusRoom(off ? null : r.id); if (isLive()) { if (off) closeRoomPanel(); else openRoomPanel(r.id); } })));
  $('#navSep').hidden = !rooms.length;
}
function fillFloorSelect() { buildNav(true); }

function switchFloor(i) {
  floorIdx = i; selection = null; focusedRoom = null; endDrawing(); closeLivePopup(); closeRoomPanel();
  clearFocusOutline(); build(); fitCamera();
}

function clearFocusOutline() { focusGroup.clear(); }
function focusRoom(id) {
  focusedRoom = id;
  clearFocusOutline();
  const room = id && floor().rooms.find((r) => r.id === id);
  if (room) {
    const pts = [...room.points, room.points[0]].map(([x, z]) => new THREE.Vector3(x, elev() + 0.06, z));
    focusGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x3df2ff })));
    const xs = room.points.map((p) => p[0]), zs = room.points.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 2.5);
    const dir = camera.position.clone().sub(controls.target).normalize();
    controls.target.set(cx, elev(), cz);
    camera.position.copy(controls.target).addScaledVector(dir, size * 2.4 + 3);
    controls.update();
  } else fitCamera();
  buildNav();
}

$('#addFloor').addEventListener('click', () => {
  const name = prompt(t('floor.namePrompt'), `${t('floor.new')} ${layout.floors.length + 1}`);
  if (!name) return;
  snapshot();
  layout.floors.push({ id: uid(), name, walls: [], rooms: [], devices: [] });
  switchFloor(layout.floors.length - 1);
  scheduleSave();
});
document.querySelectorAll('#modeBar button').forEach((b) => b.addEventListener('click', () => {
  viewMode = b.dataset.vm;
  document.querySelectorAll('#modeBar button').forEach((x) => x.classList.toggle('active', x === b));
  applyStates();
}));
$('#autoToggle').addEventListener('click', () => {
  $('#setCutaway').checked = !settings.cutaway;
  commitSettings();
});

/* ================= Palettes: devices, custom models, openings ================= */
function buildPalette() {
  const grid3 = $('#paletteGrid');
  grid3.innerHTML = '';
  Object.entries(DEVICE_TYPES).filter(([, def]) => !def.hidden).forEach(([key]) => {
    const b = document.createElement('button');
    b.textContent = t(`dev.${key}`);
    b.classList.toggle('active', key === deviceType);
    b.addEventListener('click', () => { deviceType = key; buildPalette(); renderModelPalette(); });
    grid3.append(b);
  });
  renderModelPalette();
}
function renderModelPalette() {
  const box = $('#modelGrid');
  box.innerHTML = '';
  if (!customModels.length) {
    const n = document.createElement('div'); n.className = 'none'; n.textContent = t('panel.modelsEmpty');
    box.append(n);
    return;
  }
  customModels.forEach((m) => {
    const b = document.createElement('button');
    b.className = 'model';
    b.title = m.name;
    b.textContent = m.name;
    b.classList.toggle('active', deviceType === `glb:${m.name}`);
    const x = document.createElement('span'); x.className = 'x'; x.textContent = '×'; x.title = t('panel.delete');
    x.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      if (!confirm(`${t('panel.deleteModel')} (${m.name})`)) return;
      await fetch(`api/models/${encodeURIComponent(m.name)}`, { method: 'DELETE' });
      forgetGlb(m.name);
      if (deviceType === `glb:${m.name}`) deviceType = 'light';
      await loadModels(); buildPalette();
    });
    b.append(x);
    b.addEventListener('click', () => { deviceType = `glb:${m.name}`; buildPalette(); });
    box.append(b);
  });
}
async function loadModels() {
  try { customModels = await (await fetch('api/models')).json(); } catch { customModels = []; }
}
$('#modelFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const r = await fetch('api/models', { method: 'POST', body: fd });
    if (!r.ok) throw new Error((await r.json()).error || r.status);
    const m = await r.json();
    deviceType = `glb:${m.name}`;
    await loadModels(); buildPalette();
  } catch (err) { alert(`${t('panel.uploadFailed')}: ${err.message}`); }
});
document.querySelectorAll('#openingPalette button').forEach((b) => b.addEventListener('click', () => {
  openingType = b.dataset.opening;
  document.querySelectorAll('#openingPalette button').forEach((x) => x.classList.toggle('active', x === b));
}));

function fillEntities(filter = '') {
  const sel = $('#entitySelect');
  sel.innerHTML = '';
  sel.add(new Option(t('panel.noEntity'), ''));
  const q = filter.toLowerCase();
  entities.filter((e) => !q || e.entity_id.includes(q) || e.name.toLowerCase().includes(q))
    .slice(0, 300).forEach((e) => sel.add(new Option(`${e.name} (${e.entity_id})`, e.entity_id)));
  sel.value = entityChoice;
}
$('#entitySearch').addEventListener('input', (e) => fillEntities(e.target.value));
$('#entitySelect').addEventListener('change', (e) => { entityChoice = e.target.value; });

/* ================= Properties panel ================= */
function field(label, input) {
  const w = document.createElement('div');
  w.className = 'prop';
  const l = document.createElement('label'); l.textContent = label;
  w.append(l, input);
  return w;
}
function inp(type, value, onInput, attrs = {}) {
  const i = document.createElement('input');
  i.type = type; i.value = value; Object.assign(i, attrs);
  i.addEventListener('change', () => { snapshot(); onInput(i.value); changed(); });
  return i;
}
/** number field for a length stored in meters, shown in the current unit system */
function lenInput(getM, setM, { min = 0, step = 0.05 } = {}) {
  return inp('number', toDisp(getM()), (v) => setM(Math.max(min, fromDisp(+v) || 0)), { step: imperial() ? step * 3 : step });
}
function renderProps() {
  const box = $('#props'), body = $('#propsBody');
  body.innerHTML = '';
  if (!selection || isLive()) { box.hidden = true; return; }
  const f = floor();
  let it = null;
  if (selection.kind === 'wall') it = f.walls.find((x) => x.id === selection.id);
  else if (selection.kind === 'room') it = f.rooms.find((x) => x.id === selection.id);
  else if (selection.kind === 'device') it = f.devices.find((x) => x.id === selection.id);
  else if (selection.kind === 'opening') it = findOpening(selection.id)?.opening;
  if (!it) { box.hidden = true; return; }
  box.hidden = false;
  $('#propsTitle').textContent = selection.kind === 'opening' ? t(`prop.${it.type}`) : t(`prop.${selection.kind}`);

  if (selection.kind === 'wall') {
    body.append(field(t('prop.thickness'), lenInput(() => it.thickness, (v) => (it.thickness = Math.max(0.05, v)))));
    body.append(field(t('prop.height'), lenInput(() => it.height, (v) => (it.height = Math.max(0.3, v)), { min: 0.3, step: 0.1 })));
  } else if (selection.kind === 'room') {
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field(t('prop.color'), inp('color', it.color || '#8a7f70', (v) => (it.color = v))));
  } else if (selection.kind === 'opening') {
    const { wall } = findOpening(it.id);
    const refit = () => { const p = clampOpeningPos(wall, it.width, it.pos); if (p !== null && !openingOverlaps(wall, p, it.width, it.id)) it.pos = p; };
    body.append(field(t('prop.width'), lenInput(() => it.width, (v) => { it.width = Math.max(0.3, v); refit(); }, { min: 0.3 })));
    body.append(field(t('prop.height'), lenInput(() => it.height, (v) => (it.height = Math.max(0.3, v)), { min: 0.3 })));
    if (it.type === 'window') body.append(field(t('prop.sill'), lenInput(() => it.sill, (v) => (it.sill = v))));
    body.append(field(t('prop.position'), lenInput(() => it.pos, (v) => {
      const p = clampOpeningPos(wall, it.width, v);
      if (p !== null && !openingOverlaps(wall, p, it.width, it.id)) it.pos = p;
    })));
    if (it.type === 'door') {
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!it.flip;
      cb.addEventListener('change', () => { snapshot(); it.flip = cb.checked; changed(); });
      body.append(field(t('prop.flip'), cb));
    }
  } else {
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field(t('prop.rotation'), inp('number', it.rot || 0, (v) => (it.rot = ((+v % 360) + 360) % 360), { step: 15 })));
    body.append(field(t('prop.height'), lenInput(() => it.y ?? 0, (v) => (it.y = v), { min: -5, step: 0.1 })));
    body.append(field(t('prop.size'), inp('number', it.scale || 1, (v) => (it.scale = Math.max(0.2, +v)), { step: 0.1, min: 0.2 })));
    const sel = document.createElement('select');
    sel.add(new Option(t('panel.noEntity'), ''));
    entities.slice(0, 500).forEach((e) => sel.add(new Option(`${e.name} (${e.entity_id})`, e.entity_id)));
    if (it.entity && !entities.some((e) => e.entity_id === it.entity)) sel.add(new Option(it.entity, it.entity));
    sel.value = it.entity || '';
    sel.addEventListener('change', () => { snapshot(); it.entity = sel.value; changed(); });
    body.append(field(t('prop.entity'), sel));
  }
  const del = document.createElement('button');
  del.textContent = t('panel.delete');
  del.addEventListener('click', () => { snapshot(); deleteItem(selection); });
  body.append(del);
}

/* ================= Settings ================= */
const dlg = $('#settingsDialog');
const bindings = {
  language: '#setLanguage', theme: '#setTheme', units: '#setUnits', grid: '#setGrid',
  wallHeight: '#setWallHeight', wallThickness: '#setWallThickness', autosaveSeconds: '#setAutosave',
  shadows: '#setShadows', showLabels: '#setLabels', lowWalls: '#setLowWalls', cutaway: '#setCutaway',
};
const dispKeys = new Set(['wallHeight', 'wallThickness']);

function fillSettingsForm() {
  for (const [key, sel] of Object.entries(bindings)) {
    const el = $(sel);
    if (el.type === 'checkbox') el.checked = !!settings[key];
    else if (dispKeys.has(key)) el.value = toDisp(settings[key]);
    else el.value = String(settings[key]);
  }
}
function readSettingsForm() {
  const next = { ...settings };
  for (const [key, sel] of Object.entries(bindings)) {
    const el = $(sel);
    if (el.type === 'checkbox') next[key] = el.checked;
    else if (el.type === 'number') {
      const v = parseFloat(el.value);
      if (Number.isFinite(v) && v > 0) next[key] = dispKeys.has(key) ? fromDisp(v) : v;
    } else if (key === 'grid') next[key] = parseFloat(el.value);
    else next[key] = el.value;
  }
  return next;
}
function applySettings(prev = {}) {
  setLanguage(settings.language);
  document.documentElement.dataset.theme = settings.theme;
  applyI18n();
  scene.background = isHolo() ? null : new THREE.Color(themeColors().scene);
  renderer.shadowMap.enabled = settings.shadows;
  sun.castShadow = settings.shadows;
  world.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  if (prev.grid !== settings.grid || prev.theme !== settings.theme || !grid) rebuildGrid();
  buildPalette(); fillEntities($('#entitySearch').value); renderProps();
  $('#hintText').textContent = isLive() ? t('hint.live') : t(`hint.${tool}`);
  updateNavToggles(); buildNav(true);
  applyStates();
}
async function commitSettings() {
  const prev = settings;
  settings = readSettingsForm();
  if (prev.lowWalls !== settings.lowWalls) lowWalls = settings.lowWalls;
  applySettings(prev);
  build();
  fillSettingsForm();
  try {
    const r = await fetch('api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    if (r.ok) settings = { ...settings, ...(await r.json()) };
  } catch { /* offline: settings stay for this session */ }
}
$('#settingsBtn').addEventListener('click', () => { fillSettingsForm(); dlg.showModal(); });
dlg.addEventListener('change', commitSettings);

/* ================= Data loading ================= */
async function pollStates() {
  try {
    const r = await fetch('api/entities');
    if (!r.ok) return;
    const list = await r.json();
    if (!Array.isArray(list)) return;
    const firstLoad = !entities.length;
    entities = list.sort((a, b) => a.name.localeCompare(b.name));
    states = Object.fromEntries(list.map((e) => [e.entity_id, { state: e.state, unit: e.unit, brightness: e.brightness, position: e.position, rgb: e.rgb }]));
    if (firstLoad) { fillEntities(); renderProps(); }
    applyStates();
  } catch { /* offline: ignore */ }
}

function normalizeLayout() {
  if (!layout.floors?.length) {
    layout = { version: 1, floors: [{ id: uid(), name: t('floor.default'), walls: [], rooms: [], devices: [] }] };
  }
  layout.floors.forEach((f) => {
    f.walls ||= []; f.rooms ||= []; f.devices ||= [];
    f.walls.forEach((w) => { w.openings ||= []; });
  });
}

async function init() {
  if (params.get('kiosk')) document.body.classList.add('kiosk');
  try { settings = { ...settings, ...(await (await fetch('api/settings')).json()) }; } catch { /* defaults */ }
  lowWalls = settings.lowWalls;
  setLanguage(settings.language);
  try { layout = await (await fetch('api/layout')).json(); } catch { setStatus(t('loadFailed')); }
  normalizeLayout();
  await loadModels();
  applySettings();
  fillFloorSelect(); fillEntities(); setTool('select'); resize(); build(); fitCamera();
  if (params.get('mode') === 'live' || params.get('kiosk')) setMode('live');
  pollStates();
  setInterval(pollStates, 4000);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateCutaway();
  selHelper?.update();
  renderer.render(scene, camera);
}
init();
animate();

/* Test hook: only active with ?debug=1, used by the browser tests to find objects on screen. */
if (params.get('debug')) {
  window.__fp = {
    screenOf(id) {
      const obj = registry.get(id);
      if (!obj) return null;
      const v = obj.getWorldPosition(new THREE.Vector3()).project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    get layout() { return layout; },
  };
}
