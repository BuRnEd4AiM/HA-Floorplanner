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
  wallOpacity: 0.72, glowRadius: 3.5, glowStrength: 1, glowHeight: 1.6, defaultLightColor: '#ffc861',
  userRooms: {}, belowVisibility: 0.5, bgTop: '#0a3ba8', bgBottom: '#031547', bgGlow: '#28ebd2',
  tempStops: [{ v: 16, c: '#2a6bff' }, { v: 20, c: '#2ad0a0' }, { v: 23, c: '#ffd84a' }, { v: 26, c: '#ff8a2a' }, { v: 30, c: '#ff3a3a' }],
  humidStops: [{ v: 30, c: '#e8d9a0' }, { v: 50, c: '#4fd0c8' }, { v: 65, c: '#2a7bff' }, { v: 80, c: '#5a3aff' }],
};
const DEFAULT_LOOK = structuredClone(settings);
let layout = { version: 1, floors: [] };
let floorIdx = 0;
let mode = 'edit';                 // 'edit' | 'live'
let tool = 'select';
let roomCtx = null;                // room whose entity list stays visible while one of its objects is selected
let lockedSel = false;            // selected from the side list: only that object reacts to the mouse
let selection = null;              // { kind: 'wall'|'room'|'device'|'opening', id }
let deviceType = 'light';
let openingType = 'door';
let entityChoice = '';
let entities = [];
let areas = [];                      // Home Assistant areas: [{id, name, entities[]}]
let areaOf = {};                     // entity_id -> area id
let states = {};                   // entity_id -> { state, unit }
let customModels = [];
let lowWalls = false;
let is2d = false;
let me = { user: '', canEdit: true, room: null };
let tabletRoom = null;             // room name this screen is locked to (one tablet per room)
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
renderer.setPixelRatio(Math.min(devicePixelRatio, 3));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
camera.position.set(9, 10, 12);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 1.5;
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
const openingHandles = new Map();   // opening id -> { mesh, outline }: unscaled hit boxes that stay usable when the wall is lowered
let cutawayWalls = [];            // { group, mid:[x,z], n:[nx,nz] } for the active floor

function mat(color, ghost, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.85, metalness: 0.05, transparent: ghost || extra.opacity < 1,
    ...extra, opacity: ghost ? Math.min(0.25, extra.opacity ?? 0.25) : (extra.opacity ?? 1),
  });
}

function textSprite(text, { size = 30, scaleX = 2.4, scaleY = 0.6, depthTest = false } = {}) {
  const c = document.createElement('canvas');
  const S = 4;                                    // render text at 4x so it stays sharp when zooming in
  c.width = 256 * S; c.height = 64 * S;
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest }));
  s.scale.set(scaleX, scaleY, 1);
  s.renderOrder = 10;
  s.userData.setText = (txt, badge = false) => {
    const key = txt + (badge ? '|b' : '');
    if (s.userData.text === key) return;
    s.userData.text = key;
    const g = c.getContext('2d');
    g.setTransform(S, 0, 0, S, 0, 0);
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

/* ---- Room lighting: each lit lamp shines from its own position, so a room is brightest near the lamp ---- */
const MAX_LIGHTS = 8;
const hexVec = (h) => new THREE.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255);
const cssHex = (s) => parseInt(s.slice(1), 16);
const LIGHT_HEAD = `uniform int uCount; uniform vec4 uPos[${MAX_LIGHTS}]; uniform vec3 uCol[${MAX_LIGHTS}]; uniform float uStr; varying vec3 vP;`;
const VERT = 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FLOOR_FS = `${LIGHT_HEAD} uniform vec3 uBase; uniform float uAlpha;
void main(){ vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uCount) break;
    float d = distance(vP.xz, uPos[i].xz) / uPos[i].w; acc += uCol[i] * exp(-d * d * 2.2); }
  float lit = max(acc.r, max(acc.g, acc.b)) * uStr;
  float alpha = uAlpha < 1.0 ? min(1.0, uAlpha + lit * 0.9) : 1.0;     // lit spots stay visible through floors above
  gl_FragColor = vec4(min(uBase + acc * uStr * (uAlpha < 1.0 ? 1.0 : 0.85), vec3(1.0)), alpha); }`;
const WASH_FS = `${LIGHT_HEAD} uniform float uH;
void main(){ vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uCount) break;
    float d = distance(vP, uPos[i].xyz) / uPos[i].w; acc += uCol[i] * exp(-d * d * 1.6); }
  acc *= uStr; float m = max(max(acc.r, acc.g), max(acc.b, 0.001));
  float a = clamp(m * 0.6, 0.0, 0.6) * (1.0 - smoothstep(0.0, uH, vP.y));
  if (a < 0.01) discard; gl_FragColor = vec4(acc / m, a); }`;
function roomLightMat(kind, alpha = 1, ghost = false) {
  const wash = kind === 'wash';
  return new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: hexVec(HOLO.floor) }, uAlpha: { value: alpha }, uCount: { value: 0 }, uStr: { value: 1 }, uH: { value: 1.6 },
      uPos: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4()) },
      uCol: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3()) },
    },
    vertexShader: VERT, fragmentShader: wash ? WASH_FS : FLOOR_FS,
    transparent: wash || alpha < 1, depthWrite: !wash && !ghost, side: wash ? THREE.BackSide : THREE.DoubleSide,
  });
}
function fillLights(m, lights, k = 1) {
  const U = m.uniforms;
  U.uCount.value = lights.length; U.uStr.value = settings.glowStrength * k; U.uH.value = settings.glowHeight;
  lights.forEach((l, i) => { U.uPos.value[i].set(l.x, l.y, l.z, l.r); U.uCol.value[i].copy(l.c); });
}
function colorFromStops(stops, v) {
  if (v <= stops[0].v) return cssHex(stops[0].c);
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i].v) {
      const k = (v - stops[i - 1].v) / (stops[i].v - stops[i - 1].v || 1);
      const p = cssHex(stops[i - 1].c), q = cssHex(stops[i].c);
      const mix = (s) => Math.round(((p >> s) & 255) * (1 - k) + ((q >> s) & 255) * k);
      return (mix(16) << 16) | (mix(8) << 8) | mix(0);
    }
  }
  return cssHex(stops[stops.length - 1].c);
}
const roomMeshes = new Map();     // room id -> { mesh, room }

/** Turn a model into a translucent blue wireframe hologram; lit parts are remembered for state changes. */
function holoify(model, ghost) {
  const glow = new Set(model.userData.glow || []);
  const meshes = [];
  model.traverse((o) => { if (o.isMesh && !o.userData.proxy && !o.userData.holo) meshes.push(o); });
  const hg = model.userData.holoGlow ||= { fill: [], edge: [] };
  for (const o of meshes) {
    const isGlow = glow.has(o.material);
    o.material = new THREE.MeshBasicMaterial({ color: HOLO.fill, transparent: true, opacity: ghost ? 0.03 + 0.2 * settings.belowVisibility : 0.38, depthWrite: false });
    o.userData.holo = true;
    const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.08 + 0.55 * settings.belowVisibility : 0.95 });
    o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), em));
    if (isGlow) { hg.fill.push(o.material); hg.edge.push(em); }
  }
}

function distToPoly(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length];
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(x - (ax + k * dx), z - (az + k * dz)));
  }
  return best;
}
/** Isolation: while a room is focused only that room, its walls and its devices are drawn. */
const ISO_TOL = 0.3;
function isolatedRoom() { return focusedRoom ? floor()?.rooms.find((r) => r.id === focusedRoom) ?? null : null; }
const inIso = (room, x, z) => pointInPoly(x, z, room.points) || distToPoly(x, z, room.points) < ISO_TOL;
/** The part of wall w that runs along the room's outline (a long outer wall is cut down to this room), or null. */
function clipWallToRoom(room, w) {
  const L = wallLength(w), N = Math.max(8, Math.ceil(L / 0.1));
  const near = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    near.push(distToPoly(w.a[0] + (w.b[0] - w.a[0]) * k, w.a[1] + (w.b[1] - w.a[1]) * k, room.points) < ISO_TOL);
  }
  let best = null, start = -1;
  for (let i = 0; i <= N + 1; i++) {
    if (i <= N && near[i]) { if (start < 0) start = i; continue; }
    if (start >= 0 && (!best || i - start > best[1] - best[0])) best = [start, i - 1];
    start = -1;
  }
  if (!best || (best[1] - best[0]) / N * L < 0.3) return null;
  if (best[0] === 0 && best[1] === N) return w;
  const t0 = best[0] / N, t1 = best[1] / N;
  const at = (k) => [w.a[0] + (w.b[0] - w.a[0]) * k, w.a[1] + (w.b[1] - w.a[1]) * k];
  return {
    ...w, a: at(t0), b: at(t1),
    openings: (w.openings || []).filter((o) => o.pos >= t0 * L && o.pos <= t1 * L).map((o) => ({ ...o, pos: o.pos - t0 * L })),
  };
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

/** Doors/windows live inside their wall group, which is scaled down when the wall is lowered. This unscaled
 *  hit box (with an outline shown only while the wall is lowered) keeps them selectable, movable and tappable. */
function makeOpeningHandle(w, o, group) {
  const L = wallLength(w) || 1;
  const k = o.pos / L;
  const geo = new THREE.BoxGeometry(o.width, o.height, w.thickness + 0.1);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false }));
  mesh.position.set(w.a[0] + (w.b[0] - w.a[0]) * k, o.sill + o.height / 2, w.a[1] + (w.b[1] - w.a[1]) * k);
  mesh.rotation.y = -Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]);
  mesh.userData = { kind: 'opening', id: o.id, handle: true };
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffb04a }));
  outline.visible = false;
  mesh.add(outline);
  group.add(mesh);
  pickables.push(mesh);
  const h = { mesh, outline };
  openingHandles.set(o.id, h);
  return h;
}

function build() {
  world.clear();
  registry.clear(); pickables.length = 0; labelSprites.clear(); cutawayWalls = []; roomMeshes.clear(); openingHandles.clear();
  const holo = isHolo();
  const iso = isolatedRoom();
  layout.floors.forEach((f, i) => {
    if (i > floorIdx) return;
    if (iso && i < floorIdx) return;            // no floors below while isolated
    const ghost = i < floorIdx;
    const edgeMaterial = holo ? new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.08 + 0.55 * settings.belowVisibility : 0.95 }) : null;
    const g = new THREE.Group();
    g.position.y = elev(i);
    world.add(g);

    f.rooms.forEach((r) => {
      if (r.points.length < 3) return;
      if (iso && !ghost && r.id !== iso.id) return;
      const shape = new THREE.Shape(r.points.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, holo
        ? (ghost ? roomLightMat('floor', 0.15 + 0.5 * settings.belowVisibility, true)
                 : roomLightMat('floor', floorIdx > 0 ? 1 - 0.65 * settings.belowVisibility : 1))
        : mat(r.color || '#8a7f70', ghost, { side: THREE.DoubleSide }));
      m.position.y = 0.01;
      m.receiveShadow = true;
      g.add(m);
      let wash = null;
      if (holo) {                                    // coloured "air" that tints the room's inner walls when a light is on
        const eg = new THREE.ExtrudeGeometry(shape, { depth: settings.wallHeight, bevelEnabled: false });
        eg.rotateX(-Math.PI / 2);
        wash = new THREE.Mesh(eg, roomLightMat('wash'));
        wash.userData.ghost = ghost;
        wash.renderOrder = 1;
        g.add(wash);
      }
      roomMeshes.set(r.id, { mesh: m, room: r, wash, f, ghost });
      if (!ghost) {
        m.userData = { kind: 'room', id: r.id };
        registry.set(r.id, m); pickables.push(m);
      }
      {
        if (r.name) {
          const c = r.points.reduce((a, p) => [a[0] + p[0] / r.points.length, a[1] + p[1] / r.points.length], [0, 0]);
          const sp = textSprite(is2d ? `${r.name} · ${imperial() ? (polyArea(r.points) * 10.7639).toFixed(0) + ' ft²' : polyArea(r.points).toFixed(1) + ' m²'}` : r.name);
          sp.position.set(c[0], 0.45, c[1]);
          if (ghost) { sp.material.transparent = true; sp.material.opacity = 0.25 + 0.5 * settings.belowVisibility; }
          g.add(sp);
        }
      }
    });

    f.walls.forEach((w0) => {
      let w = w0;
      if (wallLength(w) < 0.01) return;
      if (iso && !ghost) { w = clipWallToRoom(iso, w); if (!w) return; }
      const wallMat = holo
        ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: ghost ? 0.04 + 0.2 * settings.belowVisibility : settings.wallOpacity, depthWrite: false, side: THREE.DoubleSide })
        : mat('#d9d4cc', ghost);
      const wg = buildWall(w, { material: wallMat, ghost, low: lowWalls, makeMat: mat, holo, edgeMaterial });
      g.add(wg);
      if (!ghost) {
        const info = wallCutawayInfo(w, wg);
        info.handles = (w.openings || []).map((o) => makeOpeningHandle(w, o, g));
        cutawayWalls.push(info);
        registry.set(w.id, wg); pickables.push(wg);
      }
      wg.children.forEach((c) => { if (c.userData?.kind === 'opening') { registry.set(c.userData.id, c); if (!ghost) pickables.push(c); } });
    });

    f.devices.forEach((d) => {
      if (iso && !ghost && !inIso(iso, d.x, d.z)) return;
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
      model.userData.ghost = ghost;
      g.add(model);
      registry.set(d.id, model);
      if (!ghost) pickables.push(model);
      {
        const dom = d.entity?.split('.')[0];
        if (LABEL_DOMAINS.has(dom)) {
          const sp = textSprite('…', { size: 34, scaleX: 1.2, scaleY: 0.3 });
          sp.position.set(d.x, (d.y || 0) + 0.3 + 0.2 * (d.scale || 1), d.z);
          if (ghost) { sp.material.transparent = true; sp.material.opacity = 0.25 + 0.5 * settings.belowVisibility; }
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
/* Temperature / humidity of a room: average of every matching sensor placed in it or assigned to its HA area
   (sensors with °C/°F or device_class temperature/humidity, and the current values of climate entities). */
function roomHeat(room, f) {
  const ids = new Set(f.devices.filter((d) => d.entity && pointInPoly(d.x, d.z, room.points)).map((d) => d.entity));
  if (room.area) (areas.find((x) => x.id === room.area)?.entities || []).forEach((id) => ids.add(id));
  const temp = viewMode === 'temp';
  const vals = [];
  ids.forEach((id) => {
    const s = states[id];
    if (!s) return;
    const num = parseFloat(s.state);
    if (id.startsWith('climate.')) {
      const v = temp ? s.ct : s.ch;
      if (typeof v === 'number') vals.push(v);
    } else if (!isNaN(num) && id.startsWith('sensor.')) {
      if (temp && (s.unit === '°C' || s.dc === 'temperature')) vals.push(s.unit === '°F' ? (num - 32) * 5 / 9 : num);
      else if (!temp && s.unit === '%' && (s.dc === 'humidity' || /feucht|humid/i.test(id))) vals.push(num);
    }
  });
  if (!vals.length) return null;
  return colorFromStops(temp ? settings.tempStops : settings.humidStops, vals.reduce((x, y) => x + y) / vals.length);
}

const OPEN_HEX = 0xff4a3d;
const openingObjs = () => [...registry.values()].filter((o) => o.userData?.kind === 'opening' && o.userData.pivot);
const isOpen = (entity) => !!entity && ON_STATES.has(states[entity]?.state);
const openText = (entity) => (!entity ? '—' : isOpen(entity) ? t('state.open') : states[entity] ? t('state.closed') : '—');
function applyOpenings() {
  let n = 0, any = false;
  layout.floors.forEach((f) => f.walls.forEach((w) => (w.openings || []).forEach((o) => {
    if (o.entity) { any = true; if (isOpen(o.entity)) n++; }
    const obj = registry.get(o.id);
    if (!obj?.userData.pivot) return;
    const open = isOpen(o.entity);
    obj.userData.open = open;
    obj.userData.tint.forEach(({ m, base }) => m.color.setHex(open && o.entity ? OPEN_HEX : base));
    obj.userData.pivot.userData.target = open ? obj.userData.pivot.userData.dir * obj.userData.pivot.userData.max : 0;
  })));
  const pill = $('#openPill');
  pill.hidden = !any;
  pill.textContent = n ? t('open.count', { n }) : t('open.allClosed');
  pill.classList.toggle('alert', n > 0);
}
function animateOpenings() {
  openingObjs().forEach((obj) => {
    const p = obj.userData.pivot, tg = p.userData.target ?? 0;
    const prop = p.userData.axis, cur = p.rotation[prop];
    if (Math.abs(tg - cur) > 0.002) p.rotation[prop] = cur + (tg - cur) * 0.15;
  });
}

function applyStates() {
  if (!layout.floors[floorIdx]) return;
  applyOpenings();
  const bv = settings.belowVisibility;
  for (let fi = 0; fi <= floorIdx; fi++) {
    const f = layout.floors[fi], ghost = fi < floorIdx;
    f.devices.forEach((d) => {
      const obj = registry.get(d.id);
      if (!obj) return;
      const on = d.entity && ON_STATES.has(states[d.entity]?.state);
      obj.userData.glow?.forEach((m) => {
        m.emissive.set(on ? 0xffd27a : 0x000000);
        m.emissiveIntensity = on ? 1.4 : 0;
      });
      const hg = obj.userData.holoGlow;
      if (hg) {
        const onOp = ghost ? 0.12 + 0.5 * bv : 0.8, offOp = ghost ? 0.03 + 0.2 * bv : 0.38;
        hg.fill.forEach((m) => { m.color.setHex(on ? HOLO.on : HOLO.fill); m.opacity = on ? onOp : offOp; });
        hg.edge.forEach((m) => m.color.setHex(on ? HOLO.onEdge : HOLO.edge));
      }
      const sp = labelSprites.get(d.id);
      if (sp) { sp.visible = settings.showLabels; sp.userData.setText(stateText(d.entity), isHolo() && states[d.entity]?.unit === 'W'); }
    });
  }
  if (isHolo()) {                         // lit rooms: light spreads from each lamp, in the lamp's colour
    const defCol = hexVec(cssHex(settings.defaultLightColor));
    roomMeshes.forEach(({ mesh, room, wash, f, ghost }) => {
      const U = mesh.material.uniforms;
      if (!U) return;
      const k = ghost ? 0.3 + 0.6 * bv : 1;
      const heat = viewMode === 'normal' ? null : roomHeat(room, f);
      const lights = heat ? [] : f.devices
        .filter((d) => d.entity && /^(light|switch)\./.test(d.entity) && ON_STATES.has(states[d.entity]?.state) && pointInPoly(d.x, d.z, room.points))
        .slice(0, MAX_LIGHTS)
        .map((d) => {
          const st = states[d.entity];
          const br = st.brightness != null ? 0.35 + 0.65 * st.brightness / 100 : 1;
          const c = Array.isArray(st.rgb) ? new THREE.Vector3(st.rgb[0] / 255, st.rgb[1] / 255, st.rgb[2] / 255) : defCol.clone();
          const sw = d.entity.startsWith('switch.') ? 0.6 : 1;
          return { x: d.x, y: d.y || 0, z: d.z, r: settings.glowRadius * (0.7 + 0.5 * br) * sw, c: c.multiplyScalar(br) };
        });
      fillLights(mesh.material, lights, 1);
      U.uBase.value.copy(heat != null ? hexVec(heat) : hexVec(HOLO.floor));
      if (wash) { fillLights(wash.material, lights, k); wash.visible = lights.length > 0; }
    });
  }
  if (livePopupFor) renderLivePopup();
  if (roomPanelFor && !document.activeElement?.matches?.('#roomPanel input')) renderRoomPanel();
}

function refreshSelHelper() {
  if (selHelper) { scene.remove(selHelper); selHelper = null; }
  const obj = selection && (selection.kind === 'opening' ? openingHandles.get(selection.id)?.mesh : registry.get(selection.id));
  if (!obj) return;
  selHelper = new THREE.BoxHelper(obj, 0x3fa9f5);
  scene.add(selHelper);
}
function refreshSelection() {
  if (selection && !registry.get(selection.id)) selection = null;
  if (!selection) lockedSel = false;
  document.body.classList.toggle('locksel', lockedSel);
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
    const show = c.low < 0.6 && !isLive();
    c.handles?.forEach((h) => { h.outline.visible = show; });
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
  renderObjList();
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
  const hits = [];
  for (const h of ray.intersectObjects(pickables, true)) {
    let o = h.object;
    while (o && !o.userData.kind) o = o.parent;
    if (o) hits.push({ data: o.userData, point: h.point, distance: h.distance });
  }
  // Walls never block a tap: a lamp behind a lowered or see-through wall is still hit. Between a device and a
  // door/window the door/window wins unless the device is clearly in front of it (> 1.2 m nearer to the camera).
  const live = isLive();
  const op = hits.find((h) => h.data.kind === 'opening' && (!live || findOpening(h.data.id)?.opening.entity));
  const dv = hits.find((h) => h.data.kind === 'device');
  if (op && dv) return dv.distance < op.distance - 1.2 ? dv : op;
  if (op || dv) return op || dv;
  if (live) return hits.find((h) => h.data.kind === 'room') ?? null;
  return hits[0] ?? null;
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
  if (lockedSel && selection) {                     // locked: drag moves only the selected object, from anywhere
    down.hit = null;
    if (selection.kind === 'device') {
      const d = floor().devices.find((v) => v.id === selection.id), gp = groundPoint(e);
      if (d && gp) { down.dev = { d, dx: d.x - gp[0], dz: d.z - gp[1], moved: false }; controls.enabled = false; }
    } else if (selection.kind === 'opening') {
      const f = findOpening(selection.id);
      if (f) { down.op = { ...f, moved: false }; controls.enabled = false; }
    }
    return;
  }
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
      const wasSelected = selection?.kind === 'opening' && selection.id === h.id;
      selection = h; refreshSelection();
      if (wasSelected) { down.op = { ...f, moved: false }; controls.enabled = false; }   // first click only selects, so a stray click never drags it
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
    if (lockedSel) return;                     // locked selection stays until released
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
  if (k === 'escape') { endDrawing(); closeLivePopup(); setStatus(''); if (lockedSel) releaseLock(); return; }
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
  if (h?.kind === 'device' || h?.kind === 'opening') { livePopupFor = h.id; renderLivePopup(); }
  else if (h?.kind === 'room') { closeLivePopup(); if (focusedRoom !== h.id) focusRoom(h.id); openRoomPanel(h.id); }
  else closeLivePopup();
}
function closeLivePopup() { livePopupFor = null; $('#livePopup').hidden = true; }
function renderLivePopup() {
  const box = $('#livePopup');
  let d = floor()?.devices.find((v) => v.id === livePopupFor);
  if (!d) {                                          // a door/window with a contact sensor
    const fo = findOpening(livePopupFor);
    if (fo) d = { name: fo.opening.name || t(`prop.${fo.opening.type}`), entity: fo.opening.entity, isOpening: true };
  }
  if (!d) { closeLivePopup(); return; }
  box.hidden = false;
  box.innerHTML = '';
  const title = document.createElement('div'); title.className = 'title'; title.textContent = d.name || '';
  const sub = document.createElement('div'); sub.className = 'sub';
  sub.textContent = d.entity ? `${d.isOpening ? openText(d.entity) : stateText(d.entity)} · ${d.entity}` : t('live.noEntity');
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
  if (d.entity && d.entity.startsWith('light.') && !d.isOpening) box.append(lightControls(d.entity));
}

const COLOR_PRESETS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#23e0ff', '#0a84ff', '#bf5af2', '#ff2d92'];
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
function lightControls(entity) {
  const st = states[entity] || {};
  const wrap = document.createElement('div'); wrap.className = 'lightctl';
  const lbl = (k) => { const s = document.createElement('div'); s.className = 'sub'; s.textContent = t(k); return s; };
  if (st.brightness != null) {
    const r = document.createElement('input'); r.type = 'range'; r.min = 1; r.max = 100; r.value = st.brightness;
    r.addEventListener('change', () => callService(entity, 'turn_on', { brightness_pct: +r.value }));
    wrap.append(lbl('live.brightness'), r);
  }
  wrap.append(lbl('live.color'));
  const sw = document.createElement('div'); sw.className = 'swatches';
  const setRgb = (c) => callService(entity, 'turn_on', { rgb_color: c });
  COLOR_PRESETS.forEach((h) => {
    const b = document.createElement('button'); b.className = 'sw'; b.style.background = h; b.title = h;
    b.addEventListener('click', () => setRgb(hexToRgb(h)));
    sw.append(b);
  });
  const pick = document.createElement('input'); pick.type = 'color'; pick.className = 'sw-pick';
  pick.value = Array.isArray(st.rgb) ? rgbToHex(st.rgb) : '#ffd9a0';
  pick.addEventListener('change', () => setRgb(hexToRgb(pick.value)));
  sw.append(pick);
  wrap.append(sw);
  const wr = document.createElement('div'); wr.className = 'actions';
  [['live.warm', 2700], ['live.cold', 6500]].forEach(([k, kel]) => {
    const b = document.createElement('button'); b.textContent = t(k);
    b.addEventListener('click', () => callService(entity, 'turn_on', { color_temp_kelvin: kel }));
    wr.append(b);
  });
  wrap.append(wr);
  return wrap;
}

/* ---- Room panel: all entities of a room, grouped, with brightness / position sliders ---- */
let roomPanelFor = null;
const polyArea = (p) => Math.abs(p.reduce((s, [x, z], i) => { const [x2, z2] = p[(i + 1) % p.length]; return s + x * z2 - x2 * z; }, 0)) / 2;
const RP_GROUPS = [['light', 'rp.light'], ['cover', 'rp.cover'], ['media_player', 'rp.media'], ['switch', 'rp.switch'], ['sensor', 'rp.sensor']];
const rpGroupOf = (dom) => (dom === 'binary_sensor' || dom === 'climate' ? 'sensor' : dom === 'fan' || dom === 'input_boolean' ? 'switch' : dom);

function roomOpenings(room, f) {
  const out = [];
  f.walls.forEach((w) => (w.openings || []).forEach((o) => {
    const L = wallLength(w) || 1, k = o.pos / L;
    if (distToPoly(w.a[0] + (w.b[0] - w.a[0]) * k, w.a[1] + (w.b[1] - w.a[1]) * k, room.points) < 0.35) out.push(o);
  }));
  return out;
}
function closeRoomPanel() { roomPanelFor = null; $('#roomPanel').hidden = true; }
function renderRoomPanel() {
  const box = $('#roomPanel');
  const room = floor()?.rooms.find((r) => r.id === roomPanelFor);
  if (!room) { closeRoomPanel(); return; }
  box.hidden = false;
  box.replaceChildren();
  const head = document.createElement('div'); head.className = 'rp-head';
  const title = document.createElement('b'); title.textContent = room.name || '';
  const x = document.createElement('button'); x.className = 'rp-x'; x.textContent = '×'; x.addEventListener('click', () => { closeRoomPanel(); if (focusedRoom) focusRoom(null); });
  head.append(title, x);
  const area = document.createElement('div'); area.className = 'sub';
  area.textContent = imperial() ? `${(polyArea(room.points) * 10.7639).toFixed(0)} ft²` : `${polyArea(room.points).toFixed(1)} m²`;
  box.append(head, area);
  const devs = floor().devices.filter((d) => d.entity && pointInPoly(d.x, d.z, room.points));
  const placedIds = new Set(floor().devices.map((d) => d.entity));
  const inRp = (id) => RP_GROUPS.some(([g]) => g === rpGroupOf(id.split('.')[0]));
  const extra = (room.area ? areas.find((x) => x.id === room.area)?.entities || [] : [])
    .filter((id) => !placedIds.has(id) && states[id] && inRp(id))
    .map((id) => ({ entity: id, name: entities.find((e) => e.entity_id === id)?.name || id }));
  devs.push(...extra);
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
  const ops = roomOpenings(room, floor()).filter((o) => o.entity);
  if (ops.length) {
    const h = document.createElement('h4'); h.textContent = t('rp.openings'); box.append(h);
    ops.forEach((o) => {
      const row = document.createElement('div');
      row.className = 'row' + (isOpen(o.entity) ? ' alert' : '');
      const n = document.createElement('span'); n.className = 'n'; n.textContent = o.name || t(`prop.${o.type}`);
      const v = document.createElement('span'); v.className = 'v'; v.textContent = openText(o.entity);
      row.append(n, v); box.append(row);
    });
  }
  if (!devs.length && !ops.length) { const e = document.createElement('div'); e.className = 'sub'; e.textContent = t('rp.empty'); box.append(e); }
}
function openRoomPanel(id) { roomPanelFor = id; closeLivePopup(); renderRoomPanel(); }

/* ================= Tools, views, mode ================= */
function setTool(next) {
  if (next !== 'select') lockedSel = false;
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
  closeLivePopup(); closeRoomPanel(); selection = null; lockedSel = false;
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
  const iso = isolatedRoom();
  const pts = iso ? iso.points : [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...f.devices.map((d) => [d.x, d.z])];
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
  rp.replaceChildren(...rooms.map((r) => pill(r.name, r.id === focusedRoom, () => { const off = r.id === focusedRoom; focusRoom(off ? null : r.id); if (off) closeRoomPanel(); else openRoomPanel(r.id); })));
  $('#navSep').hidden = !rooms.length;
  updateHouseToggle();
}
function updateHouseToggle() {
  const b = $('#houseToggle');
  b.hidden = !tabletRoom;
  if (!tabletRoom) return;
  b.textContent = focusedRoom ? t('nav.wholeFloor') : `‹ ${tabletRoom}`;
}
$('#houseToggle').addEventListener('click', () => {
  const room = findRoomByName(tabletRoom);
  if (!room) return;
  if (focusedRoom) { focusRoom(null); closeRoomPanel(); }
  else { switchFloor(room.floor); focusRoom(room.room.id); openRoomPanel(room.room.id); }
});
function findRoomByName(name) {
  const n = String(name || '').trim().toLowerCase();
  for (let i = 0; i < layout.floors.length; i++) {
    const r = layout.floors[i].rooms.find((x) => x.name?.trim().toLowerCase() === n || x.id === name);
    if (r) return { floor: i, room: r };
  }
  return null;
}
function fillFloorSelect() { buildNav(true); }

function switchFloor(i) {
  floorIdx = i; selection = null; lockedSel = false; focusedRoom = null; endDrawing(); closeLivePopup(); closeRoomPanel();
  clearFocusOutline(); build(); fitCamera(); refreshSelection();
}

function clearFocusOutline() { focusGroup.clear(); }
function focusRoom(id) {
  focusedRoom = id;
  document.body.classList.toggle('iso', !!id);
  clearFocusOutline();
  build();                                   // isolate: only this room is drawn
  if (id && !isLive()) { selection = { kind: 'room', id }; refreshSelection(); }   // edit mode: show the room's entity list
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

/* Fill a <select> with entities grouped by HA area; the area of `room` comes first. */
function addEntityOptions(sel, list, room, current) {
  const byArea = new Map();
  list.forEach((e) => { const k = areaOf[e.entity_id] || ''; if (!byArea.has(k)) byArea.set(k, []); byArea.get(k).push(e); });
  const keys = [...byArea.keys()].sort((x, y) => {
    if (room?.area && x === room.area) return -1;
    if (room?.area && y === room.area) return 1;
    if (!x) return 1; if (!y) return -1;
    return (areas.find((q) => q.id === x)?.name || x).localeCompare(areas.find((q) => q.id === y)?.name || y);
  });
  const useGroups = areas.length > 0;
  keys.forEach((k) => {
    const parent = useGroups ? Object.assign(document.createElement('optgroup'), {
      label: k ? (room?.area === k ? t('area.here', { n: areas.find((q) => q.id === k)?.name || k }) : areas.find((q) => q.id === k)?.name || k) : t('area.unassigned') }) : sel;
    byArea.get(k).forEach((e) => parent.append(new Option(`${e.name} (${e.entity_id})`, e.entity_id)));
    if (useGroups) sel.append(parent);
  });
  if (current && !list.some((e) => e.entity_id === current)) sel.add(new Option(current, current));
}
const roomAt = (x, z) => floor()?.rooms.find((r) => pointInPoly(x, z, r.points));

function fillEntities(filter = '') {
  const sel = $('#entitySelect');
  sel.innerHTML = '';
  sel.add(new Option(t('panel.noEntity'), ''));
  const q = filter.toLowerCase();
  const list = entities.filter((e) => !q || e.entity_id.includes(q) || e.name.toLowerCase().includes(q) || (areas.find((x) => x.id === areaOf[e.entity_id])?.name || '').toLowerCase().includes(q)).slice(0, 300);
  addEntityOptions(sel, list, floor()?.rooms.find((r) => r.id === focusedRoom) || null, entityChoice);
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
const DOMAIN_DEVICE = { light: 'light', cover: 'switch', switch: 'switch', climate: 'thermostat', media_player: 'tv', sensor: 'sensor', binary_sensor: 'sensor' };
function renderEntState() {
  const el = $('#entState');
  if (!el) return;
  const d = selection?.kind === 'device' ? floor()?.devices.find((v) => v.id === selection.id) : null;
  el.textContent = d?.entity ? `${d.entity} · ${stateText(d.entity)}` : '';
}
/* Edit mode: list of the selected room's entities (placed devices + unplaced entities of its HA area) with live state */
function renderRoomEntities() {
  const box = $('#roomEnts');
  const room = roomCtx ? floor()?.rooms.find((r) => r.id === roomCtx) : null;
  if (!box || !room) return;
  box.replaceChildren();
  const h = document.createElement('h4'); h.textContent = t('prop.roomEntities'); box.append(h);
  const placed = floor().devices.filter((d) => pointInPoly(d.x, d.z, room.points));
  const placedIds = new Set(floor().devices.map((d) => d.entity).filter(Boolean));
  const row = (title, entity, btn) => {
    const r = document.createElement('div'); r.className = 're-row';
    const n = document.createElement('span'); n.className = 're-n'; n.textContent = title;
    const s = document.createElement('span'); s.className = 're-s'; s.textContent = entity ? `${entity} · ${stateText(entity)}` : t('re.noEntity');
    r.append(n, s);
    if (btn) r.append(btn);
    box.append(r);
    return r;
  };
  placed.forEach((d) => {
    const r = row(d.name || t(`dev.${d.type}`), d.entity, null);
    r.classList.add('placed');
    if (selection?.id === d.id) r.classList.add('active');
    r.addEventListener('click', () => { if (selection?.id === d.id && lockedSel) { releaseLock(); return; } selection = { kind: 'device', id: d.id }; lockedSel = true; refreshSelection(); });
  });
  roomOpenings(room, floor()).forEach((o) => {
    const r = row(o.name || t(`prop.${o.type}`), o.entity, null);
    r.classList.add('placed');
    if (selection?.id === o.id) r.classList.add('active');
    r.addEventListener('click', () => { if (selection?.id === o.id && lockedSel) { releaseLock(); return; } selection = { kind: 'opening', id: o.id }; lockedSel = true; refreshSelection(); });
  });
  const extra = (room.area ? areas.find((x) => x.id === room.area)?.entities || [] : []).filter((id) => !placedIds.has(id));
  extra.forEach((id) => {
    const b = document.createElement('button'); b.textContent = t('re.place');
    b.addEventListener('click', () => {
      snapshot();
      const dom = id.split('.')[0], type = DOMAIN_DEVICE[dom] || 'sensor';
      const xs = room.points.map((p) => p[0]), zs = room.points.map((p) => p[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
      const d = { id: uid(), type, x: pointInPoly(cx, cz, room.points) ? cx : room.points[0][0] + 0.5, z: pointInPoly(cx, cz, room.points) ? cz : room.points[0][1] + 0.5,
        y: DEVICE_TYPES[type]?.y || 0, rot: 0, scale: 1, name: entities.find((e) => e.entity_id === id)?.name || id, entity: id };
      floor().devices.push(d);
      selection = { kind: 'device', id: d.id };
      changed();
    });
    row(entities.find((e) => e.entity_id === id)?.name || id, id, b).classList.add('unplaced');
  });
  if (!placed.length && !extra.length && !box.querySelector('.re-row')) { const e = document.createElement('div'); e.className = 'sub'; e.textContent = t('re.empty'); box.append(e); }
}

/* Edit mode: every object of the floor as a list, so things that are hard to hit in 3D can be selected from the side */
function releaseLock() {                 // back to the room (if the object came from its list) or to no selection
  lockedSel = false;
  selection = roomCtx && floor()?.rooms.some((r) => r.id === roomCtx) ? { kind: 'room', id: roomCtx } : null;
  refreshSelection();
}
function renderObjList() {
  const box = $('#objList'), body = $('#objListBody');
  if (!box || !body) return;
  const f = floor();
  if (isLive() || !f) { box.hidden = true; return; }
  box.hidden = false;
  body.replaceChildren();
  const lockBar = document.createElement('div'); lockBar.className = 'lockbar' + (lockedSel ? ' on' : '');
  const lockTxt = document.createElement('span'); lockTxt.textContent = lockedSel ? t('obj.locked') : t('obj.hint');
  lockBar.append(lockTxt);
  if (lockedSel) {
    const rb = document.createElement('button'); rb.textContent = t('obj.release');
    rb.addEventListener('click', releaseLock);
    lockBar.append(rb);
  }
  body.append(lockBar);
  const openings = [];
  f.walls.forEach((w, i) => (w.openings || []).forEach((o) => openings.push({ o, w })));
  const groups = [
    ['obj.rooms', f.rooms.map((r) => ({ kind: 'room', id: r.id, label: r.name || t('prop.room') }))],
    ['obj.walls', f.walls.map((w, i) => ({ kind: 'wall', id: w.id, label: `${t('prop.wall')} ${i + 1} · ${wallLength(w).toFixed(1)} m` }))],
    ['obj.openings', openings.map(({ o }) => ({ kind: 'opening', id: o.id, label: o.name || t(`prop.${o.type}`) }))],
    ['obj.devices', f.devices.map((d) => ({ kind: 'device', id: d.id, label: d.name || t(`dev.${d.type}`) }))],
  ];
  groups.forEach(([key, items]) => {
    if (!items.length) return;
    const det = document.createElement('details');
    det.open = objGroupOpen[key] ?? (key !== 'obj.walls');
    det.addEventListener('toggle', () => { objGroupOpen[key] = det.open; });
    const sum = document.createElement('summary'); sum.textContent = `${t(key)} (${items.length})`;
    det.append(sum);
    items.forEach((it) => {
      const b = document.createElement('button');
      b.className = 'obj' + (selection?.id === it.id ? ' active' : '');
      b.textContent = it.label;
      b.addEventListener('click', () => {
        if (!registry.get(it.id)) return;
        if (selection?.id === it.id && lockedSel) { releaseLock(); return; }   // click again: release
        if (tool !== 'select') setTool('select');
        selection = { kind: it.kind, id: it.id };
        lockedSel = true;
        refreshSelection();
      });
      det.append(b);
    });
    body.append(det);
  });
}
const objGroupOpen = {};

function renderProps() {
  renderObjList();
  const box = $('#props'), body = $('#propsBody');
  body.innerHTML = '';
  if (!selection || isLive()) { roomCtx = null; box.hidden = true; return; }
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
    const asel = document.createElement('select');
    asel.add(new Option(t('area.none'), ''));
    areas.forEach((x) => asel.add(new Option(x.name, x.id)));
    asel.value = it.area || '';
    asel.addEventListener('change', () => { snapshot(); it.area = asel.value || undefined; if (!it.name || areas.some((x) => x.name === it.name)) { const ar = areas.find((x) => x.id === asel.value); if (ar) it.name = ar.name; } changed(); renderProps(); });
    body.append(field(t('prop.area'), asel));
    roomCtx = it.id;
    const ents = document.createElement('div'); ents.id = 'roomEnts'; ents.className = 'roomEnts';
    body.append(ents);
    renderRoomEntities();
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
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    const csel = document.createElement('select');
    csel.add(new Option(t('panel.noEntity'), ''));
    const contact = entities.filter((e) => ['binary_sensor', 'cover', 'lock'].includes(e.domain));
    (contact.length ? contact : entities).slice(0, 500).forEach((e) => csel.add(new Option(`${e.name} (${e.entity_id})`, e.entity_id)));
    if (it.entity && !entities.some((e) => e.entity_id === it.entity)) csel.add(new Option(it.entity, it.entity));
    csel.value = it.entity || '';
    csel.addEventListener('change', () => { snapshot(); it.entity = csel.value; changed(); });
    body.append(field(t('prop.contact'), csel));
    if (it.type === 'door') {
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!it.flip;
      cb.addEventListener('change', () => { snapshot(); it.flip = cb.checked; changed(); });
      body.append(field(t('prop.flip'), cb));
    }
  } else {
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field('X', lenInput(() => it.x, (v) => (it.x = v), { min: -1000 })));
    body.append(field('Z', lenInput(() => it.z, (v) => (it.z = v), { min: -1000 })));
    body.append(field(t('prop.rotation'), inp('number', it.rot || 0, (v) => (it.rot = ((+v % 360) + 360) % 360), { step: 15 })));
    body.append(field(t('prop.height'), lenInput(() => it.y ?? 0, (v) => (it.y = v), { min: -5, step: 0.1 })));
    body.append(field(t('prop.size'), inp('number', it.scale || 1, (v) => (it.scale = Math.max(0.2, +v)), { step: 0.1, min: 0.2 })));
    const sel = document.createElement('select');
    sel.add(new Option(t('panel.noEntity'), ''));
    addEntityOptions(sel, entities.slice(0, 1500), roomAt(it.x, it.z), it.entity);
    sel.value = it.entity || '';
    sel.addEventListener('change', () => { snapshot(); it.entity = sel.value; changed(); });
    body.append(field(t('prop.entity'), sel));
    const es = document.createElement('div'); es.id = 'entState'; es.className = 'entState';
    body.append(es);
    renderEntState();
  }
  if (selection.kind !== 'room') {
    const rm = roomCtx && f.rooms.find((r) => r.id === roomCtx);
    const inRoom = rm && (selection.kind === 'device' ? pointInPoly(it.x, it.z, rm.points) : selection.kind === 'opening' && roomOpenings(rm, f).some((o) => o.id === it.id));
    if (inRoom) {
      const ents = document.createElement('div'); ents.id = 'roomEnts'; ents.className = 'roomEnts';
      body.append(ents);
      renderRoomEntities();
    } else roomCtx = null;
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
  wallOpacity: '#setWallOpacity', belowVisibility: '#setBelow', glowRadius: '#setGlowRadius', glowStrength: '#setGlowStrength', glowHeight: '#setGlowHeight',
  defaultLightColor: '#setDefaultLight', bgTop: '#setBgTop', bgBottom: '#setBgBottom', bgGlow: '#setBgGlow',
};
const dispKeys = new Set(['wallHeight', 'wallThickness', 'glowRadius', 'glowHeight']);

function fillSettingsForm() {
  for (const [key, sel] of Object.entries(bindings)) {
    const el = $(sel);
    if (el.type === 'checkbox') el.checked = !!settings[key];
    else if (dispKeys.has(key)) el.value = toDisp(settings[key]);
    else el.value = String(settings[key]);
  }
  renderTablets();
  renderStops('#tempStops', 'tempStops', '°C');
  renderStops('#humidStops', 'humidStops', '%');
}
function allRoomNames() {
  return [...new Set(layout.floors.flatMap((f) => f.rooms.map((r) => r.name).filter(Boolean)))];
}
function renderTablets() {
  const box = $('#tabletRows');
  box.replaceChildren();
  Object.entries(settings.userRooms || {}).forEach(([user, room]) => {
    const row = document.createElement('div'); row.className = 'stop tablet';
    const u = document.createElement('input'); u.type = 'text'; u.value = user; u.dataset.role = 'user'; u.placeholder = t('set.tabletUser');
    const sel = document.createElement('select'); sel.dataset.role = 'room';
    allRoomNames().forEach((n) => sel.add(new Option(n, n)));
    if (room && !allRoomNames().includes(room)) sel.add(new Option(room, room));
    sel.value = room;
    const del = document.createElement('button'); del.type = 'button'; del.textContent = '×';
    del.addEventListener('click', () => { delete settings.userRooms[user]; renderTablets(); commitSettings(); });
    row.append(u, sel, del);
    box.append(row);
  });
}
function readTablets() {
  const out = {};
  document.querySelectorAll('#tabletRows .tablet').forEach((r) => {
    const u = r.querySelector('[data-role=user]').value.trim(), v = r.querySelector('[data-role=room]').value;
    if (u && v) out[u] = v;
  });
  return out;
}
$('#addTablet').addEventListener('click', () => {
  const names = allRoomNames();
  if (!names.length) return;
  settings.userRooms = { ...(settings.userRooms || {}), [`tablet_${Object.keys(settings.userRooms || {}).length + 1}`]: names[0] };
  renderTablets();
  commitSettings();
});
function renderStops(sel, key, unit) {
  const box = $(sel);
  box.replaceChildren();
  settings[key].forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'stop';
    const num = document.createElement('input'); num.type = 'number'; num.step = 'any'; num.value = s.v; num.dataset.role = 'v';
    const u = document.createElement('span'); u.textContent = unit;
    const col = document.createElement('input'); col.type = 'color'; col.value = s.c; col.dataset.role = 'c';
    const del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.title = t('set.removeStop');
    del.disabled = settings[key].length <= 2;
    del.addEventListener('click', () => { settings[key].splice(i, 1); renderStops(sel, key, unit); commitSettings(); });
    row.append(num, u, col, del);
    box.append(row);
  });
  const bar = document.createElement('div'); bar.className = 'stopBar';
  bar.style.background = `linear-gradient(90deg, ${settings[key].map((s) => s.c).join(',')})`;
  const add = document.createElement('button'); add.type = 'button'; add.textContent = t('set.addStop');
  add.disabled = settings[key].length >= 10;
  add.addEventListener('click', () => {
    const last = settings[key][settings[key].length - 1];
    settings[key].push({ v: last.v + 5, c: last.c }); renderStops(sel, key, unit); commitSettings();
  });
  const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = t('set.resetStops');
  reset.addEventListener('click', () => { settings[key] = structuredClone(DEFAULT_LOOK[key]); renderStops(sel, key, unit); commitSettings(); });
  const tools = document.createElement('div'); tools.className = 'stopTools'; tools.append(add, reset);
  box.append(bar, tools);
}
function readStops(sel, fallback) {
  const rows = [...$(sel).querySelectorAll('.stop')].map((r) => ({
    v: parseFloat(r.querySelector('[data-role=v]').value), c: r.querySelector('[data-role=c]').value }))
    .filter((s) => Number.isFinite(s.v));
  return rows.length >= 2 ? rows.sort((x, y) => x.v - y.v) : fallback;
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
  next.userRooms = readTablets();
  next.tempStops = readStops('#tempStops', settings.tempStops);
  next.humidStops = readStops('#humidStops', settings.humidStops);
  return next;
}
function applySettings(prev = {}) {
  setLanguage(settings.language);
  document.documentElement.dataset.theme = settings.theme;
  const rs = document.documentElement.style;
  rs.setProperty('--bg-top', settings.bgTop); rs.setProperty('--bg-bottom', settings.bgBottom); rs.setProperty('--bg-glow', settings.bgGlow);
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
async function loadAreas() {
  try {
    const r = await fetch('api/areas');
    const list = r.ok ? await r.json() : [];
    areas = Array.isArray(list) ? list : [];
  } catch { areas = []; }
  areaOf = {};
  areas.forEach((x) => x.entities.forEach((e) => { areaOf[e] = x.id; }));
}

async function pollStates() {
  try {
    const r = await fetch('api/entities');
    if (!r.ok) return;
    const list = await r.json();
    if (!Array.isArray(list)) return;
    const firstLoad = !entities.length;
    entities = list.sort((a, b) => a.name.localeCompare(b.name));
    states = Object.fromEntries(list.map((e) => [e.entity_id, { state: e.state, unit: e.unit, brightness: e.brightness, position: e.position, rgb: e.rgb, dc: e.dc, ct: e.ct, ch: e.ch }]));
    if (firstLoad) { await loadAreas(); fillEntities(); renderProps(); }
    applyStates();
    renderRoomEntities(); renderEntState();
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
  try { me = await (await fetch('api/me')).json(); } catch { /* standalone */ }
  tabletRoom = params.get('room') || me.room || null;
  if (!me.canEdit || tabletRoom) document.body.classList.add('kiosk');
  if (tabletRoom) document.body.classList.add('roomtablet');
  if (!me.canEdit) document.body.classList.add('readonly');
  try { settings = { ...settings, ...(await (await fetch('api/settings')).json()) }; } catch { /* defaults */ }
  lowWalls = settings.lowWalls;
  setLanguage(settings.language);
  try { layout = await (await fetch('api/layout')).json(); } catch { setStatus(t('loadFailed')); }
  normalizeLayout();
  await loadModels();
  applySettings();
  fillFloorSelect(); fillEntities(); setTool('select'); resize(); build(); fitCamera();
  if (params.get('mode') === 'live' || params.get('kiosk') || tabletRoom || !me.canEdit) setMode('live');
  if (tabletRoom) {
    const hit = findRoomByName(tabletRoom);
    if (hit) { switchFloor(hit.floor); focusRoom(hit.room.id); openRoomPanel(hit.room.id); }
    updateHouseToggle();
  }
  pollStates();
  setInterval(pollStates, 4000);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateCutaway();
  animateOpenings();
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
    pickAt(x, y) { const h = pickHit({ clientX: x, clientY: y }); return h ? { kind: h.data.kind, id: h.data.id } : null; },
    rayHits(x, y) { setRay({ clientX: x, clientY: y }); return ray.intersectObjects(pickables, true).map((h) => { let o = h.object; while (o && !o.userData.kind) o = o.parent; return `${o?.userData.kind}:${o?.userData.id}@${h.distance.toFixed(2)}${h.object.userData.proxy ? 'P' : ''}`; }); },
    openingCenter(id) {                 // screen position of the middle of a door/window (not its base)
      const o = registry.get(id); if (!o) return null;
      const fo = findOpening(id); const v = o.getWorldPosition(new THREE.Vector3()); v.y += fo.opening.sill + fo.opening.height / 2;
      v.project(camera); const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
  };
}
