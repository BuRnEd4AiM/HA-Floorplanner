import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { openNanoEditor, DEFAULT_PANELS } from './nanoleaf.js';
import { DEVICE_TYPES, CATEGORIES, catOf, thumbnail, makeModel, forgetGlb, isCustom } from './models.js';
import {
  OPENING_DEFAULTS, DOOR_STYLES, WINDOW_STYLES, buildWall, wallLength, projectOnWall, clampOpeningPos, openingOverlaps,
} from './walls.js';
import { t, setLanguage, applyI18n } from './i18n.js';
import { createPlan } from './plan2d.js';
import polygonClipping from './vendor/polygon-clipping.js';
import { STAIR_TYPES, stairDefaults, stairBounds, stairLocal, polyToWorld, holesForFloor, toWorld, stairCounts, stairLength, stairHandles } from './stairs.js';

/* ================= State ================= */
const FLOOR_H = 3.0;
const M_TO_FT = 3.28084;
const params = new URLSearchParams(location.search);

let settings = {
  language: 'de', theme: 'holo', units: 'metric', grid: 0.25, wallHeight: 2.6, wallThickness: 0.2,
  shadows: true, autosaveSeconds: 1.5, lowWalls: false, showLabels: true, cutaway: true, wallStop: true,
  wallOpacity: 0.72, glowRadius: 3.5, glowStrength: 1, glowHeight: 1.6, defaultLightColor: '#ffc861',
  userRooms: {}, userViews: {}, belowVisibility: 0.5, bgTop: '#0a3ba8', bgBottom: '#031547', bgGlow: '#28ebd2',
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
let is2d = false;                  // legacy top-down camera flag (the real 2D editor is plan2d.js)
let plan = null;                   // 2D blueprint editor
let layoutMode = '3d';             // '3d' | '2d' | 'split'
let me = { user: '', canEdit: true, room: null, view: 'all' };
let lastStateSig = '';
let tabletRoom = null;             // room name this screen is locked to (one tablet per room)
let livePopupFor = null;           // device id
const undoStack = [];
let saveTimer = null;

const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const floor = () => layout.floors[floorIdx];
const groundIdx = () => Math.max(0, layout.floors.findIndex((f) => f.kind !== 'basement'));   // first floor above ground
const elev = (i = floorIdx) => (i - groundIdx()) * FLOOR_H;
let houseMode = false;                 // "whole house" view: every floor solid, nothing ghosted
const isLive = () => mode === 'live';

/* unit helpers – data is always stored in meters */
const imperial = () => settings.units === 'imperial';
const toDisp = (m) => +(imperial() ? m * M_TO_FT : m).toFixed(3);
const fromDisp = (v) => (imperial() ? v / M_TO_FT : v);
const fmtLen = (m) => (imperial() ? `${(m * M_TO_FT).toFixed(2)} ft` : `${m.toFixed(2)} m`);

/* ================= Three.js setup ================= */
const canvas = $('#view');
/* Low-power mode for tablets / kiosk screens (Fire tablets ...): lower resolution, no antialiasing or shadows, 30 fps and only ~4 fps
   while nothing happens. Automatic for ?kiosk, ?room and touch screens; ?perf=high / ?perf=low overrides. */
const perfParam = params.get('perf');
const LOW = perfParam ? perfParam === 'low' : !!(params.get('kiosk') || params.get('room') || matchMedia('(pointer: coarse)').matches);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(LOW ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 3));
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
const OUTDOOR = new Set(['picture', 'tree', 'bush', 'pool', 'lawn', 'terrace', 'path', 'fence']);   // keep their natural colours in the hologram theme
const isHolo = () => settings.theme === 'holo';

/* ---- Room lighting: each lit lamp shines from its own position, so a room is brightest near the lamp ---- */
const MAX_LIGHTS = 8;
const LIGHT_PROFILE = {                       // r = reach relative to the setting, k = strength
  light: { r: 0.85, k: 0.8 }, lamp: { r: 0.6, k: 0.6 }, orb: { r: 0.3, k: 0.4 }, strip: { r: 0.4, k: 0.4 },
  panel_tri: { r: 0.35, k: 0.4 }, panel_hex: { r: 0.35, k: 0.4 }, panel_sq: { r: 0.35, k: 0.4 }, panel_bar: { r: 0.4, k: 0.4 }, nanoleaf: { r: 0.45, k: 0.5 },
};
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
  vec3 lc = vec3(1.0) - exp(-acc * uStr * 0.9);                        // soft roll-off: no burnt-out white
  gl_FragColor = vec4(min(uBase + lc * (uAlpha < 1.0 ? 1.0 : 0.85), vec3(1.0)), alpha); }`;
const WASH_FS = `${LIGHT_HEAD} uniform float uH;
void main(){ vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uCount) break;
    float d = distance(vP, uPos[i].xyz) / uPos[i].w; acc += uCol[i] * exp(-d * d * 1.6); }
  acc *= uStr; float m = max(max(acc.r, acc.g), max(acc.b, 0.001));
  float a = clamp(m * 0.6, 0.0, 0.6) * (1.0 - smoothstep(0.0, uH, vP.y));
  if (a < 0.01) discard; gl_FragColor = vec4(acc / m, a); }`;
/* light pool on the floor of the solid themes: a tinted, alpha-blended layer above the normal floor (keeps its shading and shadows) */
const GLOW_FS = `${LIGHT_HEAD}
void main(){ vec3 acc = vec3(0.0);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uCount) break;
    float d = distance(vP.xz, uPos[i].xz) / uPos[i].w; acc += uCol[i] * exp(-d * d * 2.2); }
  acc *= uStr; float m = max(max(acc.r, acc.g), max(acc.b, 0.001));
  float a = clamp(m * 0.75, 0.0, 0.7);
  if (a < 0.01) discard; gl_FragColor = vec4(acc / m, a); }`;
function roomLightMat(kind, alpha = 1, ghost = false) {
  if (kind === 'glow') {
    return new THREE.ShaderMaterial({
      uniforms: {
        uCount: { value: 0 }, uStr: { value: 1 }, uH: { value: 1 },
        uPos: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4()) },
        uCol: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3()) },
      },
      vertexShader: VERT, fragmentShader: GLOW_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
  }
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
    o.material = new THREE.MeshBasicMaterial({ color: HOLO.fill, transparent: true, opacity: ghost ? 0.03 + 0.2 * settings.belowVisibility : (model.userData.solid ? 0.8 : 0.38), depthWrite: !!model.userData.solid && !ghost, side: model.userData.solid ? THREE.DoubleSide : THREE.FrontSide });
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

/** footprint (bounding box) of everything under a roof floor */
function roofBox(i) {
  const pts = [];
  layout.floors.forEach((f, k) => {
    if (k >= i || f.kind === 'basement' || f.kind === 'roof') return;
    f.walls.forEach((w) => pts.push(w.a, w.b));
    f.rooms.forEach((r) => pts.push(...r.points));
  });
  if (!pts.length) return null;
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}
/** roof surface as triangles; pitch in degrees, ridge along the longer side unless set */
function roofGeometry(bb, r) {
  const o = r.overhang ?? 0.4, x0 = bb.x0 - o, x1 = bb.x1 + o, z0 = bb.z0 - o, z1 = bb.z1 + o;
  const alongX = r.ridge ? r.ridge === 'x' : (x1 - x0) >= (z1 - z0);
  const [a0, a1, b0, b1] = alongX ? [x0, x1, z0, z1] : [z0, z1, x0, x1];   // a = ridge axis, b = across
  const half = (b1 - b0) / 2, bc = (b0 + b1) / 2;
  const h = r.type === 'flat' ? 0.15 : half * Math.tan(((r.pitch ?? 35) * Math.PI) / 180);
  const ins = r.type === 'hip' ? Math.min(half, (a1 - a0) / 2) : 0;
  const P = (a, b, y) => (alongX ? [a, y, b] : [b, y, a]);
  const tris = [];
  const quad = (p, q, u, v) => tris.push(p, q, u, p, u, v);
  if (r.type === 'flat') {
    quad(P(a0, b0, 0.1), P(a1, b0, 0.1), P(a1, b1, 0.1), P(a0, b1, 0.1));
    quad(P(a0, b0, 0), P(a0, b1, 0), P(a1, b1, 0), P(a1, b0, 0));
  } else {
    quad(P(a0, b0, 0), P(a1, b0, 0), P(a1 - ins, bc, h), P(a0 + ins, bc, h));
    quad(P(a1, b1, 0), P(a0, b1, 0), P(a0 + ins, bc, h), P(a1 - ins, bc, h));
    tris.push(P(a0, b1, 0), P(a0, b0, 0), P(a0 + ins, bc, h));
    tris.push(P(a1, b0, 0), P(a1, b1, 0), P(a1 - ins, bc, h));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  geo.computeVertexNormals();
  return geo;
}
function buildRoof(g, i, f, holo, ghost) {
  const bb = roofBox(i);
  if (!bb) return;
  const geo = roofGeometry(bb, f.roof || (f.roof = { type: 'gable', pitch: 35, overhang: 0.4 }));
  const m = new THREE.Mesh(geo, holo
    ? new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : 0.45, side: THREE.DoubleSide, depthWrite: false })
    : mat('#a4493b', ghost, { side: THREE.DoubleSide }));
  if (holo) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 })));
  g.add(m);
}

function build() {
  wake();
  plan?.render();
  world.clear();
  registry.clear(); pickables.length = 0; labelSprites.clear(); cutawayWalls = []; roomMeshes.clear(); openingHandles.clear();
  const holo = isHolo();
  const iso = isolatedRoom();
  if (houseMode) {                              // ground reference for the plot
    const hb = houseBounds(), sz = Math.ceil(Math.max(hb.size * 2, 20) / 2) * 2;
    const grid = new THREE.GridHelper(sz, sz, holo ? HOLO.edge : 0x6c8a5c, holo ? 0x1a4fb8 : 0x88a878);
    grid.position.set(hb.cx, -0.03, hb.cz);
    grid.material.transparent = true; grid.material.opacity = 0.35;
    world.add(grid);
    const nb = groundIdx();                      // basements: earth around them, so they read as below ground
    if (nb > 0) {
      const depth = nb * FLOOR_H, earthSize = Math.max(hb.size * 1.6, 14);
      const eg = new THREE.BoxGeometry(earthSize, depth, earthSize);
      const earth = new THREE.Mesh(eg, new THREE.MeshBasicMaterial({ color: 0x6b4a2f, transparent: true, opacity: 0.22, depthWrite: false }));
      earth.position.set(hb.cx, -depth / 2 - 0.03, hb.cz);
      earth.add(new THREE.LineSegments(new THREE.EdgesGeometry(eg), new THREE.LineBasicMaterial({ color: 0x9a7448, transparent: true, opacity: 0.6 })));
      world.add(earth);
      const lawn = new THREE.Mesh(new THREE.PlaneGeometry(earthSize, earthSize).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5aa04a, transparent: true, opacity: 0.18, depthWrite: false }));
      lawn.position.set(hb.cx, -0.02, hb.cz);
      world.add(lawn);
    }
  }
  layout.floors.forEach((f, i) => {
    if (i > floorIdx && !houseMode) return;
    if (iso && i < floorIdx) return;            // no floors below while isolated
    const ghost = (i < floorIdx && !houseMode) || (houseMode && f.kind === 'basement');
    const edgeMaterial = holo ? new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.08 + 0.55 * settings.belowVisibility : 0.95 }) : null;
    const g = new THREE.Group();
    g.position.y = elev(i);
    world.add(g);
    const holes = holesForFloor(layout.floors, i, FLOOR_H);
    if (f.kind === 'roof' && !iso) buildRoof(g, i, f, holo, ghost);

    f.rooms.forEach((r) => {
      if (r.points.length < 3) return;
      if (iso && !ghost && r.id !== iso.id) return;
      const shape = floorShapes(r.points, holes);                 // the room minus stairwell openings (also where they only overlap it partly)
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, holo
        ? (ghost ? roomLightMat('floor', 0.15 + 0.5 * settings.belowVisibility, true)
                 : roomLightMat('floor', floorIdx > 0 ? 1 - 0.65 * settings.belowVisibility : 1))
        : mat(r.color || '#8a7f70', ghost, { side: THREE.DoubleSide }));
      m.position.y = 0.01;
      m.receiveShadow = true;
      g.add(m);
      let wash = null, glow = null;
      if (!holo) {                                   // solid themes: the light pool lies on the floor as a separate layer
        glow = new THREE.Mesh(geo, roomLightMat('glow'));
        glow.position.y = 0.014; glow.renderOrder = 1; glow.visible = false; glow.userData.ghost = ghost;
        g.add(glow);
      }
      {                                              // coloured "air" that tints the room's inner walls when a light is on
        const eg = new THREE.ExtrudeGeometry(shape, { depth: settings.wallHeight, bevelEnabled: false });
        eg.rotateX(-Math.PI / 2);
        wash = new THREE.Mesh(eg, roomLightMat('wash'));
        wash.userData.ghost = ghost;
        wash.renderOrder = 1;
        g.add(wash);
      }
      roomMeshes.set(r.id, { mesh: m, room: r, wash, glow, f, ghost });
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

    /* placeholder blocks: a solid mass for a floor that is not drawn */
    if (!iso) (f.blocks || []).forEach((b) => {
      if (b.points.length < 3) return;
      const shape = new THREE.Shape(b.points.map(([x, z]) => new THREE.Vector2(x, -z)));
      const eg = new THREE.ExtrudeGeometry(shape, { depth: b.h || FLOOR_H, bevelEnabled: false });
      eg.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(eg, holo
        ? new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: 0.5, depthWrite: false })
        : mat('#b9b3a8', false));
      m.position.y = -0.02;
      if (holo) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(eg), new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.7 })));
      g.add(m);
      registry.set(b.id, m);
    });

    /* stairs (a 'down' stair starts one floor lower and arrives at this floor) */
    (f.stairs || []).forEach((st) => {
      if (iso) return;
      const sg = buildStair(st, holo, ghost, edgeMaterial);
      sg.position.set(st.x, st.dir === 'down' ? -FLOOR_H : 0, st.z);
      sg.rotation.y = THREE.MathUtils.degToRad(st.rot || 0);
      g.add(sg);
      registry.set(st.id, sg);
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
      const model = makeModel(d.type, (m) => { if (!ghost) addPickProxy(m); if (holo && !OUTDOOR.has(d.type)) holoify(m, ghost); applyStates(); refreshSelHelper(); }, d);
      if (d.type === 'picture') setPicture(model, d);
      model.position.set(d.x, d.y ?? 0, d.z);
      model.rotation.order = 'YXZ';                                   // turn around the vertical axis first, then tilt / roll the object itself
      model.rotation.set(THREE.MathUtils.degToRad(d.tiltX || 0), THREE.MathUtils.degToRad(d.rot || 0), THREE.MathUtils.degToRad(d.tiltZ || 0));
      model.scale.set((d.scale || 1) * (d.sx || 1), (d.scale || 1) * (d.sy || 1), (d.scale || 1) * (d.sz || 1));   // uniform size x independent stretch per axis
      if (d.mirror) model.scale.x *= -1;                              // mirrored shape (left-right)
      if (!ghost) addPickProxy(model);
      if (holo && !OUTDOOR.has(d.type)) holoify(model, ghost);
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
/* entity of pane i: multi-pane windows may have one contact sensor per pane (o.paneEntities), falling back to the main sensor */
const paneEntity = (o, i) => (o.paneEntities && o.paneEntities[i]) || o.entity || '';
const openingEntities = (o) => [...new Set([o.entity, ...(o.paneEntities || [])].filter(Boolean))];
function applyOpenings() {
  let n = 0, any = false;
  layout.floors.forEach((f) => f.walls.forEach((w) => (w.openings || []).forEach((o) => {
    openingEntities(o).forEach((e) => { any = true; if (isOpen(e)) n++; });
    const obj = registry.get(o.id);
    if (!obj?.userData.pivot) return;
    const pps = obj.userData.panePivots;
    const opens = pps ? pps.map((_, i) => isOpen(paneEntity(o, i))) : [isOpen(o.entity)];
    const open = opens.some(Boolean);
    obj.userData.open = open;
    obj.userData.tint.forEach(({ m, base }) => m.color.setHex(open && openingEntities(o).length ? OPEN_HEX : base));
    (pps || [obj.userData.pivot]).forEach((pv, i) => { pv.userData.target = opens[i] ? pv.userData.dir * pv.userData.max : 0; });
  })));
  const pill = $('#openPill');
  pill.hidden = !any;
  pill.textContent = n ? t('open.count', { n }) : t('open.allClosed');
  pill.classList.toggle('alert', n > 0);
}
function animateOpenings() {
  openingObjs().forEach((obj) => {
   (obj.userData.panePivots || [obj.userData.pivot]).forEach((p) => {
    const tg = p.userData.target ?? 0;
    const prop = p.userData.axis, holder = p.userData.prop === 'position' ? p.position : p.rotation, cur = holder[prop];
    if (Math.abs(tg - cur) > 0.002) holder[prop] = cur + (tg - cur) * 0.15;
    (p.userData.followers || []).forEach((fp) => { fp.rotation[fp.userData.axis] = holder[prop] * (fp.userData.dir / (p.userData.dir || 1)); });   // second leaf of a double door
   });
  });
}

function applyStates() {
  if (plan?.isVisible()) plan.render();
  if (!layout.floors[floorIdx]) return;
  applyOpenings();
  const bv = settings.belowVisibility;
  for (let fi = 0; fi <= floorIdx; fi++) {
    const f = layout.floors[fi], ghost = fi < floorIdx;
    f.devices.forEach((d) => {
      const obj = registry.get(d.id);
      if (!obj) return;
      const on = d.entity && ON_STATES.has(states[d.entity]?.state);
      const rgb = on && Array.isArray(states[d.entity]?.rgb) ? states[d.entity].rgb : null;   // lit parts take the light's colour
      obj.userData.glow?.forEach((m) => {
        m.emissive.set(on ? (rgb ? new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255) : 0xffd27a) : 0x000000);
        m.emissiveIntensity = on ? 1.4 : 0;
      });
      const hg = obj.userData.holoGlow;
      if (hg) {
        const solid = obj.userData.solid, onOp = ghost ? 0.12 + 0.5 * bv : (solid ? 1 : 0.8), offOp = ghost ? 0.03 + 0.2 * bv : (solid ? 0.8 : 0.38);
        hg.fill.forEach((m) => { if (on && rgb) m.color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255); else m.color.setHex(on ? HOLO.on : HOLO.fill); m.opacity = on ? onOp : offOp; });
        hg.edge.forEach((m) => { if (on && rgb) m.color.setRGB(Math.min(1, rgb[0] / 255 + 0.35), Math.min(1, rgb[1] / 255 + 0.35), Math.min(1, rgb[2] / 255 + 0.35)); else m.color.setHex(on ? HOLO.onEdge : HOLO.edge); });
      }
      const sp = labelSprites.get(d.id);
      if (sp) { sp.visible = settings.showLabels; sp.userData.setText(stateText(d.entity), isHolo() && states[d.entity]?.unit === 'W'); }
    });
  }
  {                                       // lit rooms: light spreads from each lamp, in the lamp's colour (hologram: tints the floor itself, other themes: a glow layer on top)
    const holo = isHolo();
    const defCol = hexVec(cssHex(settings.defaultLightColor));
    roomMeshes.forEach(({ mesh, room, wash, glow, f, ghost }) => {
      const target = holo ? mesh : glow;
      const U = target?.material.uniforms;
      if (!U) return;
      const k = ghost ? 0.3 + 0.6 * bv : 1;
      const heat = viewMode === 'normal' ? null : roomHeat(room, f);
      const lights = heat ? [] : f.devices
        .filter((d) => d.entity && /^(light|switch)\./.test(d.entity) && ON_STATES.has(states[d.entity]?.state) && pointInPoly(d.x, d.z, room.points))
        .flatMap((d) => {
          const st = states[d.entity];
          const br = st.brightness != null ? 0.12 + 0.88 * st.brightness / 100 : 1;
          const c = Array.isArray(st.rgb) ? new THREE.Vector3(st.rgb[0] / 255, st.rgb[1] / 255, st.rgb[2] / 255) : defCol.clone();
          const sw = d.entity.startsWith('switch.') ? 0.6 : 1;
          const prof = LIGHT_PROFILE[d.type] || LIGHT_PROFILE.light;      // an LED strip or a panel does not light the whole room like a ceiling lamp
          const r = settings.glowRadius * (0.7 + 0.5 * br) * sw * prof.r;
          if (d.type === 'nanoleaf' && d.panels?.length) {                 // a layout shines from where its panels really are, a little off the wall
            const n = Math.min(4, d.panels.length), a = ((d.rot || 0) * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a), k2 = d.scale || 1;
            return Array.from({ length: n }, (_, i) => d.panels[Math.floor((i * d.panels.length) / n)]).map((p) => ({
              x: d.x + (p.x * cs * (d.mirror ? -1 : 1) * (d.sx || 1) + 0.12 * sn) * k2, y: (d.y || 0) + p.y * k2 * (d.sy || 1), z: d.z + (-p.x * sn * (d.mirror ? -1 : 1) * (d.sx || 1) + 0.12 * cs) * k2,
              r: r * 0.75, c: c.clone().multiplyScalar(br * prof.k * 1.1 / Math.sqrt(n)),
            }));
          }
          return [{ x: d.x, y: d.y || 0, z: d.z, r, c: c.multiplyScalar(br * prof.k) }];
        })
        .slice(0, MAX_LIGHTS);
      fillLights(target.material, lights, holo ? 1 : (ghost ? k : 1));
      if (holo) U.uBase.value.copy(heat != null ? hexVec(heat) : hexVec(HOLO.floor));
      else glow.visible = lights.length > 0;
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
  plan?.render();
  // keep the selection even when the object is not drawn (e.g. hidden by a focused room or off screen), so it can still be found, moved to view or deleted
  if (selection && !registry.get(selection.id)) {
    const f = floor();
    const exists = f && [f.walls, f.rooms, f.devices, f.blocks, f.stairs].some((l) => (l || []).some((q) => q.id === selection.id || (q.openings || []).some((o) => o.id === selection.id)));
    if (!exists) selection = null;
  }
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
  fillFloorSelect(); build(); scheduleSave(); renderBgPanel(); renderFloorPanel();
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
/* ================= Resizable side panel (drag its left edge) ================= */
(() => {
  const bar = $('#panelResizer'), root = document.documentElement;
  const apply = (w) => root.style.setProperty('--panel-w', `${Math.max(240, Math.min(Math.round(window.innerWidth * 0.7), w))}px`);
  try { const w = +localStorage.getItem('fp.panelW'); if (w) apply(w); } catch { /* private mode */ }
  bar.addEventListener('pointerdown', (e) => {
    bar.setPointerCapture(e.pointerId); bar.classList.add('drag');
    const move = (ev) => apply(window.innerWidth - ev.clientX);
    const up = () => {
      bar.classList.remove('drag'); bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up);
      try { localStorage.setItem('fp.panelW', parseInt(getComputedStyle($('#panel')).width, 10)); } catch { /* ignore */ }
      resize?.();
    };
    bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up);
  });
})();

/* ================= Houses (several floor plans) ================= */
let houses = [], houseId = null;
const layoutUrl = () => `api/layout${houseId ? `?house=${encodeURIComponent(houseId)}` : ''}`;
async function loadHouses() {
  try { const l = await (await fetch('api/houses')).json(); if (Array.isArray(l) && l.length) houses = l; } catch { /* old backend: one house */ }
  const want = (params.get('house') || '').trim().toLowerCase();
  let saved = null; try { saved = localStorage.getItem('fp.house'); } catch { /* private mode */ }
  const pickH = houses.find((h) => want && (h.id === want || h.name.trim().toLowerCase() === want)) || houses.find((h) => h.id === saved) || houses[0];
  houseId = pickH?.id || null;
}
function renderHouseUi() {
  const sel = $('#houseSelect');
  if (!sel) return;
  sel.replaceChildren(...houses.map((h) => new Option(h.name, h.id)));
  sel.value = houseId || '';
  $('#houseGroup').hidden = houses.length < 2;
  const box = $('#houseBody');
  if (!box) return;
  box.innerHTML = '';
  const cur = houses.find((h) => h.id === houseId);
  const p = document.createElement('p'); p.className = 'sub'; p.textContent = `${t('house.current')}: ${cur?.name || ''}`; box.append(p);
  const mk = (id, label, on, dis = false) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.disabled = dis; b.addEventListener('click', on); return b; };
  const row = document.createElement('div'); row.className = 'stopTools';
  row.append(mk('houseNew', t('house.new'), () => houseAction('new')), mk('houseCopy', t('house.copy'), () => houseAction('copy')),
             mk('houseRename', t('house.rename'), () => houseAction('rename')), mk('houseDelete', t('house.delete'), () => houseAction('delete'), houses.length < 2));
  box.append(row);
}
async function houseAction(kind) {
  const cur = houses.find((h) => h.id === houseId);
  try {
    if (kind === 'delete') {
      if (!confirm(t('house.deleteConfirm'))) return;
      const r = await fetch(`api/houses/${houseId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(r.status);
      houses = houses.filter((h) => h.id !== houseId);
      await switchHouse(houses[0].id);
      return;
    }
    const name = prompt(t('house.namePrompt'), kind === 'rename' ? cur?.name : kind === 'copy' ? `${cur?.name} 2` : t('house.default'));
    if (!name || !name.trim()) return;
    if (kind === 'rename') {
      const r = await fetch(`api/houses/${houseId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!r.ok) throw new Error(r.status);
      cur.name = name.trim(); renderHouseUi();
      return;
    }
    await save();                                               // make sure the copy source is up to date
    const r = await fetch('api/houses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, ...(kind === 'copy' ? { copyFrom: houseId } : {}) }) });
    if (!r.ok) throw new Error(r.status);
    const h = await r.json();
    houses.push({ id: h.id, name: h.name });
    await switchHouse(h.id);
  } catch (err) { alert(`${t('saveFailed')}: ${err.message}`); }
}
async function switchHouse(id) {
  if (id === houseId && layout) return;
  if (saveTimer) await save();                                  // flush edits of the house we leave
  houseId = id;
  try { localStorage.setItem('fp.house', id); } catch { /* private mode */ }
  try { layout = await (await fetch(layoutUrl())).json(); } catch { setStatus(t('loadFailed')); return; }
  normalizeLayout();
  undoStack.length = 0;
  floorIdx = 0; selection = null; lockedSel = false; focusedRoom = null; houseMode = false; document.body.classList.remove('house');
  clearFocusOutline(); renderHouseUi();
  build(); fitCamera(); buildNav(true); renderBgPanel(); renderFloorPanel(); renderObjList(); refreshSelection();
}
$('#backupImport').addEventListener('click', () => $('#backupFile').click());
$('#backupFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !confirm(t('backup.confirm'))) return;
  try {
    if (saveTimer) await save();
    const r = await fetch('api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await file.text() });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || r.status);
    alert(t('backup.done', { h: j.houses }));
    location.reload();
  } catch (err) { alert(`${t('backup.failed')}: ${err.message}`); }
});
$('#houseSelect').addEventListener('change', (e) => switchHouse(e.target.value));

async function save() {
  clearTimeout(saveTimer);
  try {
    const r = await fetch(layoutUrl(), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(layout) });
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
function newDevice(x, z) {
  const custom = isCustom(deviceType);
  const def = custom ? { y: 0 } : DEVICE_TYPES[deviceType];
  const ent = entities.find((v) => v.entity_id === entityChoice);
  const d = {
    id: uid(), type: deviceType, x, z, y: def.y || 0, rot: 0, scale: 1,
    name: ent?.name || (custom ? deviceType.slice(4) : t(`dev.${deviceType}`)), entity: entityChoice || '',
  };
  if (deviceType === 'nanoleaf') d.panels = DEFAULT_PANELS.map((p) => ({ ...p }));
  if (WALL_TYPES.has(deviceType)) snapToWall(d, 0.8);          // wall-hung things click onto the nearest wall
  return d;
}
/* wall-hung devices: pictures, mirrors, panels, radiators ... */
const WALL_TYPES = new Set(['picture', 'tv_wall', 'mirror', 'walllamp', 'radiator', 'towelrad', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'camera', 'thermostat', 'switch']);
/** put the device flat on the closest wall (within `maxDist`), facing the side it is on (or, with `keepFacing`, the way it already faces) */
function snapToWall(d, maxDist = 2, keepFacing = false) {
  const rooms = floor().rooms;
  const inRoom = (x, z) => rooms.some((r) => pointInPoly(x, z, r.points));
  let best = null;
  floor().walls.forEach((w) => {
    const [ax, az] = w.a, [bx, bz] = w.b, sx = bx - ax, sz = bz - az, L2 = sx * sx + sz * sz || 1;
    const u = Math.max(0, Math.min(1, ((d.x - ax) * sx + (d.z - az) * sz) / L2));
    const px = ax + sx * u, pz = az + sz * u, dist = Math.hypot(d.x - px, d.z - pz);
    if (dist > maxDist + w.thickness / 2) return;
    const len = Math.hypot(sx, sz) || 1, n0x = -sz / len, n0z = sx / len, off = w.thickness / 2 + 0.02;
    // which face of the wall: the interior (a room) wins, else the side the device is on, else the way it already faces
    const okPlus = inRoom(px + n0x * off, pz + n0z * off), okMinus = inRoom(px - n0x * off, pz - n0z * off);
    const rot = ((d.rot || 0) * Math.PI) / 180, face = n0x * Math.sin(rot) + n0z * Math.cos(rot), onSide = n0x * (d.x - px) + n0z * (d.z - pz);
    let sign;
    if (rooms.length && okPlus !== okMinus) sign = okPlus ? 1 : -1;
    else if (Math.abs(onSide) > 0.03) sign = onSide > 0 ? 1 : -1;
    else sign = (keepFacing || Math.abs(face) > 0.05) && Math.abs(face) > 0.05 ? (face > 0 ? 1 : -1) : 1;
    const inside = rooms.length ? (sign > 0 ? okPlus : okMinus) : true;
    const score = dist + (inside ? 0 : 0.6);                  // prefer a wall whose inner face is in a room
    if (!best || score < best.score) best = { score, px, pz, nx: n0x * sign, nz: n0z * sign, off };
  });
  if (!best) return false;
  d.x = +(best.px + best.nx * best.off).toFixed(3); d.z = +(best.pz + best.nz * best.off).toFixed(3);
  d.rot = ((Math.round((Math.atan2(best.nx, best.nz) * 180) / Math.PI * 10) / 10) % 360 + 360) % 360;
  return true;
}
/** a picture: frame + the uploaded image (api/backgrounds/<name>) on a plane; `w` metres wide, `ar` = height / width */
const textureLoader = new THREE.TextureLoader();
function setPicture(model, d) {
  model.clear();
  const w = d.w || 0.6, h = w * (d.ar || 0.75);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6 }));
  const art = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.05, w - 0.06), Math.max(0.05, h - 0.06)), new THREE.MeshBasicMaterial({ color: 0xc9d6e2 }));
  art.position.z = 0.0155;
  model.add(frame, art);
  if (d.img) textureLoader.load(`api/backgrounds/${encodeURIComponent(d.img)}`, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    art.material.map = tex; art.material.color.set(0xffffff); art.material.needsUpdate = true;
  });
}
async function uploadPicture(file, d) {
  if (!file) return;
  const [nw, nh] = await imageSize(file);
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch('api/backgrounds', { method: 'POST', body: fd });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
  const { name } = await r.json();
  snapshot(); d.img = name; d.ar = +(nh / nw).toFixed(5); d.w ||= 0.8;
  changed(); renderProps();
}
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
  if (isLive() || tool !== 'select' || houseMode) return;
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
    if (down.dev.d.locked) return;
    if (!down.dev.moved) { snapshot(); down.dev.moved = true; }
    const [x, z] = snap([gp[0] + down.dev.dx, gp[1] + down.dev.dz], true);
    moveDeviceTo(down.dev.d, x, z);
    return;
  }
  if (down?.op && down.drag) {
    const { wall, opening } = down.op;
    if (opening.locked) return;
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
  } else if (tool === 'group') {
    const h = pick(e);
    if (h?.kind === 'device') groupToggle(h.id);
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
    const [x, z] = snap(gp, true);
    const d = newDevice(x, z);
    floor().devices.push(d);
    selection = { kind: 'device', id: d.id };
    changed();
    if (d.type === 'nanoleaf') editNano(d);
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

function editNano(d) {
  openNanoEditor({ panels: d.panels, t, onSave: (panels) => { snapshot(); d.panels = panels; changed(); renderProps(); } });
}
/** size (m) of a built-in model at scale 1, measured from the model itself (null for custom GLB models) */
const dimsCache = new Map();
function baseDims(type) {
  if (isCustom(type) || type === 'nanoleaf') return null;
  if (!dimsCache.has(type)) {
    const g = makeModel(type);
    g.updateMatrixWorld(true);
    const sz = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
    dimsCache.set(type, sz.x > 0.001 && sz.y > 0.001 && sz.z > 0.001 ? { x: sz.x, y: sz.y, z: sz.z } : null);
  }
  return dimsCache.get(type);
}
/** the layout object behind a selection handle (wall, room, opening, device, stair, block) */
function itemOf(kind, id) {
  const f = floor();
  if (!f) return null;
  if (kind === 'opening') return findOpening(id)?.opening || null;
  const list = { wall: f.walls, room: f.rooms, device: f.devices, stair: f.stairs, block: f.blocks }[kind] || [];
  return list.find((q) => q.id === id) || null;
}
function deleteItem({ kind, id }) {
  if (itemOf(kind, id)?.locked) { setStatus(t('prop.lockedHint')); return; }
  const f = floor();
  if (kind === 'wall') f.walls = f.walls.filter((x) => x.id !== id);
  if (kind === 'room') f.rooms = f.rooms.filter((x) => x.id !== id);
  if (kind === 'device') f.devices = f.devices.filter((x) => x.id !== id);
  if (kind === 'block') f.blocks = (f.blocks || []).filter((x) => x.id !== id);
  if (kind === 'stair') f.stairs = (f.stairs || []).filter((x) => x.id !== id);
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
  if (k === 'enter' && plan?.hasDraft() && (tool === 'room' || tool === 'block')) { plan.finishRoom(); return; }
  if (k === 'escape') { plan?.cancel(); endDrawing(); closeLivePopup(); setStatus(''); if (bgMode) setBgMode(null); if (lockedSel) releaseLock(); return; }
  if (isLive()) return;
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); }
  else if (k === 'delete' || k === 'backspace') { if (selection) { snapshot(); deleteItem(selection); } }
  else if ((k === 'q' || k === 'e') && selection?.kind === 'stair') {
    const st = floor().stairs.find((v) => v.id === selection.id);
    if (st) { snapshot(); st.rot = ((st.rot || 0) + (k === 'q' ? -15 : 15) + 360) % 360; changed(); }
  } else if ((k === 'q' || k === 'e') && selection?.kind === 'device') {
    const d = floor().devices.find((v) => v.id === selection.id);
    if (d) { snapshot(); if (d.group) rotateGroup(d, k === 'q' ? -15 : 15); else d.rot = ((d.rot || 0) + (k === 'q' ? -15 : 15) + 360) % 360; changed(); }
  } else if (k === 'v') setTool('select');
  else if (k === 'w') setTool('wall');
  else if (k === 'b') setTool('block');
  else if (k === 't') setTool('stairs');
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

function handleLiveTap(e) { liveSelect(pick(e)); }
function liveSelect(h) {
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
  if (d.entity && d.entity.startsWith('light.') && !d.isOpening) {
    box.append(lightControls([d.entity]));
    const sc = sceneButtons(scenesWith([d.entity]), 'live.sceneWith');   // scenes this light is part of
    if (sc) box.append(sc);
  }
  if (d.entity && /^(light|scene)\./.test(d.entity) && !d.isOpening) {          // the whole room this device is in
    const rm = floor().rooms.find((r) => pointInPoly(d.x, d.z, r.points));
    const rc = rm && roomControls(rm);
    if (rc) box.append(rc);
  }
}

const COLOR_PRESETS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#23e0ff', '#0a84ff', '#bf5af2', '#ff2d92'];
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
function lightControls(ids) {              // one light, or all lights of a room
  const list = [].concat(ids);
  const sts = list.map((id) => states[id] || {});
  const st = sts.find((x) => ON_STATES.has(x.state)) || sts[0] || {};
  const all = (svc, data) => list.forEach((id) => callService(id, svc, data));
  const wrap = document.createElement('div'); wrap.className = 'lightctl';
  const lbl = (k) => { const s = document.createElement('div'); s.className = 'sub'; s.textContent = t(k); return s; };
  if (sts.some((x) => x.brightness != null)) {
    const r = document.createElement('input'); r.type = 'range'; r.min = 1; r.max = 100; r.value = st.brightness ?? 100;
    r.addEventListener('change', () => all('turn_on', { brightness_pct: +r.value }));
    wrap.append(lbl('live.brightness'), r);
  }
  wrap.append(lbl('live.color'));
  const sw = document.createElement('div'); sw.className = 'swatches';
  const setRgb = (c) => all('turn_on', { rgb_color: c });
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
    b.addEventListener('click', () => all('turn_on', { color_temp_kelvin: kel }));
    wr.append(b);
  });
  wrap.append(wr);
  const fx = sts.map((x) => x.fx || []).reduce((acc, cur) => acc.filter((e) => cur.includes(e)));   // effects (Nanoleaf, WLED, Hue ...) all lights have
  if (fx.length) {
    const sel = document.createElement('select'); sel.className = 'fxsel';
    sel.add(new Option(t('live.effect'), ''));
    fx.forEach((e) => sel.add(new Option(e, e)));
    if (list.length === 1 && st.fxc && fx.includes(st.fxc)) sel.value = st.fxc;
    sel.addEventListener('change', () => { if (sel.value) all('turn_on', { effect: sel.value }); });
    wrap.append(lbl('live.effects'), sel);
  }
  return wrap;
}

/** scenes (scene.*) that set at least one of these entities */
function scenesWith(ids) {
  const set = new Set(ids);
  return Object.entries(states).filter(([id, st]) => id.startsWith('scene.') && (st.members || []).some((m) => set.has(m))).map(([id]) => id);
}
function sceneButtons(ids, labelKey) {
  if (!ids.length) return null;
  const wrap = document.createElement('div'); wrap.className = 'sceneList';
  const sh = document.createElement('div'); sh.className = 'sub'; sh.textContent = t(labelKey); wrap.append(sh);
  const row = document.createElement('div'); row.className = 'scenes';
  ids.forEach((id) => {
    const b = document.createElement('button'); b.textContent = entities.find((e) => e.entity_id === id)?.name || id;
    b.addEventListener('click', () => callService(id, 'turn_on'));
    row.append(b);
  });
  wrap.append(row);
  return wrap;
}

/* ---- whole room: all lights at once + the room's scenes ---- */
function roomEntityIds(room, domain) {
  const f = floor();
  const ids = new Set(f.devices.filter((d) => d.entity?.startsWith(`${domain}.`) && pointInPoly(d.x, d.z, room.points)).map((d) => d.entity));
  (room.area ? areas.find((x) => x.id === room.area)?.entities || [] : []).filter((id) => id.startsWith(`${domain}.`)).forEach((id) => ids.add(id));
  return [...ids].filter((id) => states[id]);
}
function roomControls(room) {
  const lights = roomEntityIds(room, 'light'), scenes = [...new Set([...roomEntityIds(room, 'scene'), ...scenesWith(roomEntityIds(room, 'light'))])];
  if (!lights.length && !scenes.length) return null;
  const wrap = document.createElement('div'); wrap.className = 'roomctl';
  const h = document.createElement('h4'); h.textContent = t('rc.title', { n: room.name || '' }); wrap.append(h);
  if (lights.length) {
    const on = lights.filter((id) => ON_STATES.has(states[id]?.state)).length;
    const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = t('rc.lights', { on, n: lights.length }); wrap.append(sub);
    const row = document.createElement('div'); row.className = 'actions';
    [['turn_on', 'live.allOn'], ['turn_off', 'live.allOff']].forEach(([svc, k]) => {
      const b = document.createElement('button'); b.textContent = t(k);
      b.addEventListener('click', () => lights.forEach((id) => callService(id, svc)));
      row.append(b);
    });
    wrap.append(row, lightControls(lights));
  }
  if (scenes.length) {
    const sh = document.createElement('div'); sh.className = 'sub'; sh.textContent = t('rc.scenes'); wrap.append(sh);
    const row = document.createElement('div'); row.className = 'scenes';
    scenes.forEach((id) => {
      const b = document.createElement('button'); b.textContent = entities.find((e) => e.entity_id === id)?.name || id;
      b.addEventListener('click', () => callService(id, 'turn_on'));
      row.append(b);
    });
    wrap.append(row);
  }
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
  const rc = roomControls(room);
  if (rc) box.append(rc);
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
  const ops = roomOpenings(room, floor()).filter((o) => openingEntities(o).length);
  if (ops.length) {
    const h = document.createElement('h4'); h.textContent = t('rp.openings'); box.append(h);
    ops.forEach((o) => {
      const multi = o.paneEntities?.some(Boolean);
      const count = multi ? (o.style === 'triple' ? 3 : 2) : 1;
      for (let i = 0; i < count; i++) {
        const e = multi ? paneEntity(o, i) : o.entity;
        if (!e) continue;
        const row = document.createElement('div');
        row.className = 'row' + (isOpen(e) ? ' alert' : '');
        const n = document.createElement('span'); n.className = 'n'; n.textContent = (o.name || t(`prop.${o.type}`)) + (multi ? ` · ${t('pane.n', { n: i + 1 })}` : '');
        const v = document.createElement('span'); v.className = 'v'; v.textContent = openText(e);
        row.append(n, v); box.append(row);
      }
    });
  }
  if (!devs.length && !ops.length) { const e = document.createElement('div'); e.className = 'sub'; e.textContent = t('rp.empty'); box.append(e); }
}
function openRoomPanel(id) { roomPanelFor = id; closeLivePopup(); renderRoomPanel(); }

/* ================= Tools, views, mode ================= */
function setTool(next) {
  if (next !== 'select') lockedSel = false;
  tool = next; endDrawing(); plan?.reset(); document.body.dataset.tool = next; setStatus('');
  if (bgMode) setBgMode(null);
  document.querySelectorAll('#tools button').forEach((b) => b.classList.toggle('active', b.dataset.tool === next));
  $('#hintText').textContent = t(`hint.${next}`);
  $('#devicePalette').hidden = next !== 'device';
  $('#openingPalette').hidden = next !== 'opening';
  $('#stairPalette').hidden = next !== 'stairs';
  $('#blockPalette').hidden = next !== 'block';
  $('#groupPalette').hidden = next !== 'group';
  if (next !== 'group' && groupPick.size) { groupPick.clear(); plan?.render(); }
  if (next === 'group') renderGroupPalette();
  if ((next === 'block' || next === 'stairs') && !isLive() && plan && !plan.isVisible()) $('#viewSplit').click();   // drawn in the 2D plan
  canvas.style.cursor = next === 'select' ? 'default' : 'crosshair';
}
document.querySelectorAll('#tools button').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));

function setMode(next) {
  mode = next;
  document.body.classList.toggle('live', isLive());
  document.querySelectorAll('#modeSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.mode === next));
  closeLivePopup(); closeRoomPanel(); selection = null; lockedSel = false; plan?.reset();
  if (isLive()) {
    setTool('select');
    $('#hintText').textContent = t('hint.live');
    canvas.style.cursor = 'pointer';
  } else setTool(tool);
  refreshSelection();
  applyViewPolicy();
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
function houseBounds() {
  const pts = layout.floors.flatMap((f) => [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...f.devices.map((d) => [d.x, d.z])]);
  if (!pts.length) return { cx: 0, cz: 0, size: 12 };
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, size: Math.max(x1 - x0, z1 - z0, 4) };
}
function fitCamera() {
  const { cx, cz, size } = houseMode ? houseBounds() : floorBounds();
  const midY = houseMode ? (elev(layout.floors.length - 1) + elev(0)) / 2 + FLOOR_H / 2 : elev();
  const dist = (size * 1.25 + 2) * Math.max(1, 1.0 / (camera.aspect || 1));
  controls.target.set(cx, midY, cz);
  if (is2d) camera.position.set(cx, midY + dist * 1.2, cz + 0.001);
  else camera.position.set(cx + dist * 0.4, midY + dist * 0.95 + (houseMode ? size * 0.3 : 0), cz + dist * 0.7);
  controls.update();
}
function applyViewPolicy() {          // live mode: only the 3D view unless the user was given more (settings → users)
  const lock = isLive() && me.view !== 'all';
  document.body.classList.toggle('viewlock', lock);
  if (lock) setLayoutMode(['2d', 'split'].includes(me.view) ? me.view : '3d');
}
function setLayoutMode(m) {
  layoutMode = m;
  document.body.classList.toggle('v-2d', m === '2d');
  document.body.classList.toggle('v-split', m === 'split');
  $('#view2d').classList.toggle('active', m === '2d');
  $('#view3d').classList.toggle('active', m === '3d');
  $('#viewSplit').classList.toggle('active', m === 'split');
  plan.show(m !== '3d');
  requestAnimationFrame(() => { resize(); if (m !== '2d') fitCamera(); });
}
$('#view2d').addEventListener('click', () => setLayoutMode('2d'));
$('#view3d').addEventListener('click', () => setLayoutMode('3d'));
$('#viewSplit').addEventListener('click', () => setLayoutMode('split'));
$('#fitBtn').addEventListener('click', () => { if (layoutMode !== '3d') plan.fit(); if (layoutMode !== '2d') fitCamera(); });
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
  const key = JSON.stringify([houseMode, floorIdx, layout.floors.map((x) => x.kind), layout.floors.map((x) => x.name), rooms.map((r) => [r.id, r.name]), focusedRoom, settings.language]);
  if (!force && key === navKey) return;
  navKey = key;
  const fp = $('#floorPills'), rp = $('#roomPills');
  fp.replaceChildren(...layout.floors.map((x, i) => pill(x.name, i === floorIdx && !houseMode, () => switchFloor(i))),
    ...(layout.floors.length > 1 || layout.floors.some((x) => x.devices.length) ? [pill(t('nav.house'), houseMode, () => setHouseMode(!houseMode), t('nav.houseTip'))] : []));
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

function setHouseMode(on) {
  houseMode = on; selection = null; lockedSel = false; focusedRoom = null; document.body.classList.toggle('house', on);
  clearFocusOutline(); build(); fitCamera(); refreshSelection(); buildNav(true);
}
function switchFloor(i) {
  houseMode = false; document.body.classList.remove('house');
  floorIdx = i; selection = null; lockedSel = false; focusedRoom = null; endDrawing(); closeLivePopup(); closeRoomPanel();
  clearFocusOutline(); build(); fitCamera(); refreshSelection();
  if (bgMode) setBgMode(null); else renderBgPanel();
  renderFloorPanel();
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

/* ================= Groups of devices (Nanoleaf logos ...): move, turn and mirror as one shape ================= */
const groupPick = new Set();
function liveMove(d) {
  const obj = registry.get(d.id);
  if (obj) { obj.position.x = d.x; obj.position.z = d.z; }
  const sp = labelSprites.get(d.id);
  if (sp) sp.position.set(d.x, sp.position.y, d.z);
  refreshSelHelper();
}
const groupMembers = (d) => (d.group ? floor().devices.filter((x) => x.group === d.group) : [d]);
function groupCentre(ms) { return [ms.reduce((a, m) => a + m.x, 0) / ms.length, ms.reduce((a, m) => a + m.z, 0) / ms.length]; }
/* Wall stop: things cannot be pushed into the wall body. The device footprint and the wall thickness count, the move slides along
   the wall instead of freezing, and door openings let it through. Wall-hung items, outdoor items and ceiling-free objects are exempt. */
const STOP_EXEMPT = new Set([...WALL_TYPES_LIST(), ...OUTDOOR]);
function WALL_TYPES_LIST() { return ['picture', 'tv_wall', 'mirror', 'walllamp', 'radiator', 'towelrad', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'camera', 'thermostat', 'switch', 'curtain', 'spot', 'pendant', 'smoke']; }
function penetration(m, x, z, w) {
  const [ax, az] = w.a, [bx, bz] = w.b, sx = bx - ax, sz = bz - az, L = Math.hypot(sx, sz) || 1e-9, ux = sx / L, uz = sz / L;
  const along = (x - ax) * ux + (z - az) * uz;
  const dist = Math.hypot(x - (ax + ux * Math.max(0, Math.min(L, along))), z - (az + uz * Math.max(0, Math.min(L, along))));
  if ((w.openings || []).some((o) => o.type === 'door' && Math.abs(o.pos - along) <= o.width / 2)) return -1;   // through the doorway
  const f = plan.footOf(m), hw = f.r ?? f.w / 2, hd = f.r ?? f.d / 2, th = ((m.rot || 0) * Math.PI) / 180;
  const nx = -uz, nz = ux;                                                            // wall normal
  const cu = Math.cos(th), su = -Math.sin(th), cv = Math.sin(th), sv = Math.cos(th);  // device axes
  const rad = hw * Math.abs(nx * cu + nz * su) + hd * Math.abs(nx * cv + nz * sv);      // half extent of the footprint across the wall
  return (w.thickness || 0.2) / 2 + rad - dist;                                        // > 0: overlaps the wall body
}
/** clamp the displacement (dx,dz) of the given members so none of them moves deeper into a wall; slide along it when possible */
function stopMove(members, dx, dz) {
  if (!settings.wallStop) return [dx, dz];
  const ms = members.filter((m) => !STOP_EXEMPT.has(m.type));
  if (!ms.length) return [dx, dz];
  const walls = floor().walls;
  // the move is checked in small steps so a fast drag cannot tunnel through a wall
  const bad = (ex, ez) => {
    const n = Math.min(80, Math.max(1, Math.ceil(Math.hypot(ex, ez) / 0.04)));
    return walls.find((w) => ms.some((m) => {
      let prev = penetration(m, m.x, m.z, w);
      for (let i = 1; i <= n; i++) {
        const p1 = penetration(m, m.x + (ex * i) / n, m.z + (ez * i) / n, w);
        if (p1 > 0.001 && p1 > prev + 1e-4) return true;
        prev = p1;
      }
      return false;
    }));
  };
  let w = bad(dx, dz);
  if (!w) return [dx, dz];
  for (let i = 0; i < 3 && w; i++) {                                                  // slide: keep only the part of the move along the blocking wall
    const [ax, az] = w.a, L = Math.hypot(w.b[0] - ax, w.b[1] - az) || 1, ux = (w.b[0] - ax) / L, uz = (w.b[1] - az) / L, k = dx * ux + dz * uz;
    dx = ux * k; dz = uz * k;
    w = bad(dx, dz);
  }
  return w ? [0, 0] : [dx, dz];
}
function moveDeviceTo(d, x, z) {
  const ms = groupMembers(d);
  if (ms.some((m) => m.locked)) return;                          // locked things stay where they are
  const [dx, dz] = stopMove(ms, x - d.x, z - d.z);
  if (!dx && !dz) return;
  ms.forEach((m) => { m.x = +(m.x + dx).toFixed(4); m.z = +(m.z + dz).toFixed(4); liveMove(m); });
}
function rotateGroup(d, delta) {
  const ms = groupMembers(d), [cx, cz] = groupCentre(ms), th = (delta * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
  ms.forEach((m) => {
    const dx = m.x - cx, dz = m.z - cz;
    m.x = +(cx + dx * c + dz * sn).toFixed(4); m.z = +(cz - dx * sn + dz * c).toFixed(4);
    m.rot = (((m.rot || 0) + delta) % 360 + 360) % 360;
  });
}
/** mirror the whole group across the plane through its centre that stands across the clicked piece's local x axis */
function mirrorGroup(d) {
  const ms = groupMembers(d), [cx, cz] = groupCentre(ms), r0 = d.rot || 0, th = (r0 * Math.PI) / 180;
  const ux = Math.cos(th), uz = -Math.sin(th);
  ms.forEach((m) => {
    const dx = m.x - cx, dz = m.z - cz, k = dx * ux + dz * uz;
    m.x = +(cx + dx - 2 * k * ux).toFixed(4); m.z = +(cz + dz - 2 * k * uz).toFixed(4);
    m.rot = (((2 * r0 - (m.rot || 0)) % 360) + 360) % 360;
    m.mirror = !m.mirror; if (!m.mirror) delete m.mirror;
    const tz = (((-(m.tiltZ || 0)) % 360) + 360) % 360; if (tz) m.tiltZ = tz; else delete m.tiltZ;
  });
}
function groupToggle(id) {
  if (groupPick.has(id)) groupPick.delete(id); else groupPick.add(id);
  renderGroupPalette(); plan?.render();
  setStatus(t('group.picked', { n: groupPick.size }));
}
function renderGroupPalette() {
  const box = $('#groupBody');
  if (!box) return;
  box.innerHTML = '';
  const n = groupPick.size;
  const p = document.createElement('p'); p.className = 'sub'; p.textContent = t('group.picked', { n }); box.append(p);
  const row = document.createElement('div'); row.className = 'stopTools';
  const mk = (id, label, on, dis = false) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.disabled = dis; b.addEventListener('click', on); return b; };
  row.append(mk('grpMake', t('group.make'), makeGroup, n < 2), mk('grpCancel', t('group.cancel'), () => { groupPick.clear(); renderGroupPalette(); plan?.render(); }));
  box.append(row);
}
function makeGroup() {
  if (groupPick.size < 2) return;
  snapshot();
  const gid = uid();
  floor().devices.forEach((d) => { if (groupPick.has(d.id)) d.group = gid; });
  groupPick.clear();
  setTool('select'); changed(); renderGroupPalette();
}

function newFloor(kind, name) {
  return { id: uid(), name, kind, walls: [], rooms: [], devices: [], blocks: [], stairs: [], ...(kind === 'roof' ? { roof: { type: 'gable', pitch: 35, overhang: 0.4 } } : {}) };
}
/** kind 'floor' goes on top, 'basement' below everything, 'roof' on top */
function addFloorOf(kind) {
  const label = kind === 'basement' ? t('floor.basement') : kind === 'roof' ? t('floor.roof') : `${t('floor.new')} ${layout.floors.length + 1}`;
  const name = prompt(t('floor.namePrompt'), label);
  if (!name) return;
  snapshot();
  if (kind === 'basement') {
    layout.floors.unshift(newFloor(kind, name));
    switchFloor(0);
  } else {
    layout.floors.push(newFloor(kind, name));
    switchFloor(layout.floors.length - 1);
  }
  scheduleSave();
}
function moveFloor(dir) {
  const j = floorIdx + dir;
  if (j < 0 || j >= layout.floors.length) return;
  snapshot();
  [layout.floors[floorIdx], layout.floors[j]] = [layout.floors[j], layout.floors[floorIdx]];
  floorIdx = j;
  selection = null; build(); fitCamera(); buildNav(true); renderFloorPanel(); renderObjList(); scheduleSave();
}
function deleteFloor() {
  if (layout.floors.length < 2 || !confirm(t('floor.deleteConfirm'))) return;
  snapshot();
  layout.floors.splice(floorIdx, 1);
  switchFloor(Math.min(floorIdx, layout.floors.length - 1));
  scheduleSave();
}
function renderFloorPanel() {
  const box = $('#floorBody');
  if (!box) return;
  box.innerHTML = '';
  const f = floor();
  if (!f) return;
  const rowBtn = (id, label, on, disabled = false) => {
    const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.disabled = disabled;
    b.addEventListener('click', on); return b;
  };
  box.append(field(t('prop.name'), inp('text', f.name, (v) => { f.name = v || f.name; buildNav(true); })));
  const ksel = document.createElement('select'); ksel.id = 'floorKind';
  [['floor', t('floor.kind.floor')], ['basement', t('floor.kind.basement')], ['roof', t('floor.kind.roof')]].forEach(([v, l]) => {
    const o = document.createElement('option'); o.value = v; o.textContent = l; ksel.append(o);
  });
  ksel.value = f.kind || 'floor';
  ksel.addEventListener('change', () => {
    snapshot(); f.kind = ksel.value;
    if (f.kind === 'roof') f.roof ||= { type: 'gable', pitch: 35, overhang: 0.4 };
    build(); fitCamera(); buildNav(true); renderFloorPanel(); scheduleSave();
  });
  box.append(field(t('floor.kind'), ksel));
  const mv = document.createElement('div'); mv.className = 'stopTools';
  mv.append(rowBtn('floorUp', t('floor.up'), () => moveFloor(1), floorIdx >= layout.floors.length - 1),
            rowBtn('floorDown', t('floor.down'), () => moveFloor(-1), floorIdx <= 0));
  box.append(mv);
  const add = document.createElement('div'); add.className = 'stopTools';
  add.append(rowBtn('addBasement', t('floor.addBasement'), () => addFloorOf('basement')),
             rowBtn('addRoof', t('floor.addRoof'), () => addFloorOf('roof')),
             rowBtn('delFloor', t('floor.delete'), deleteFloor, layout.floors.length < 2));
  box.append(add);
  if (f.kind === 'roof') {
    const r = (f.roof ||= { type: 'gable', pitch: 35, overhang: 0.4 });
    const tsel = document.createElement('select'); tsel.id = 'roofType';
    ['gable', 'hip', 'flat'].forEach((v) => { const o = document.createElement('option'); o.value = v; o.textContent = t(`roof.${v}`); tsel.append(o); });
    tsel.value = r.type || 'gable';
    tsel.addEventListener('change', () => { snapshot(); r.type = tsel.value; build(); scheduleSave(); });
    box.append(field(t('roof.type'), tsel));
    box.append(field(t('roof.pitch'), inp('number', r.pitch ?? 35, (v) => (r.pitch = Math.max(5, Math.min(70, +v || 35))), { step: 1 })));
    box.append(field(t('roof.overhang'), lenInput(() => r.overhang ?? 0.4, (v) => (r.overhang = v), { min: 0 })));
    const rsel = document.createElement('select'); rsel.id = 'roofRidge';
    [['', t('roof.auto')], ['x', 'X'], ['z', 'Z']].forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; rsel.append(o); });
    rsel.value = r.ridge || '';
    rsel.addEventListener('change', () => { snapshot(); r.ridge = rsel.value || undefined; build(); scheduleSave(); });
    box.append(field(t('roof.ridge'), rsel));
  }
}
$('#addFloor').addEventListener('click', () => addFloorOf('floor'));
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
let paletteCat = 'all', paletteQuery = '';
function buildPalette() {
  const grid3 = $('#paletteGrid'), cats = $('#paletteCats');
  cats.innerHTML = '';
  ['all', ...Object.keys(CATEGORIES)].forEach((k) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = t(`cat.${k}`);
    b.classList.toggle('active', k === paletteCat);
    b.addEventListener('click', () => { paletteCat = k; buildPalette(); });
    cats.append(b);
  });
  grid3.innerHTML = '';
  const q = paletteQuery.trim().toLowerCase();
  Object.entries(DEVICE_TYPES).filter(([key, def]) => !def.hidden && (paletteCat === 'all' || catOf(key) === paletteCat)
    && (!q || t(`dev.${key}`).toLowerCase().includes(q) || key.includes(q) || (SEARCH_ALIASES[key] || '').includes(q))).forEach(([key]) => {
    const b = document.createElement('button'); b.className = 'dev'; b.type = 'button';
    const url = thumbnail(key);
    if (url) { const im = document.createElement('img'); im.src = url; im.alt = ''; b.append(im); }
    const sp = document.createElement('span'); sp.textContent = t(`dev.${key}`); sp.title = t(`dev.${key}`); b.append(sp);
    b.classList.toggle('active', key === deviceType);
    b.addEventListener('click', () => { deviceType = key; buildPalette(); renderModelPalette(); });
    grid3.append(b);
  });
  renderModelPalette();
}
/* extra search words so the library also finds things under their everyday names */
const SEARCH_ALIASES = {
  tv: 'fernseher fernsehen television tele glotze', tv_wall: 'fernseher wandfernseher wand tv fernsehen flachbild', tvstand: 'fernsehtisch lowboard tv-board fernseher', monitor: 'bildschirm pc display', sofa: 'couch', sofa2: 'couch ecksofa wohnlandschaft',
  fridge: 'kühlschrank kuehlschrank', washer: 'waschmaschine', boiler: 'warmwasser', speaker: 'lautsprecher box', vacuum: 'saugroboter staubsauger', router: 'wlan fritzbox internet',
  light: 'leuchte lampe', lamp: 'leuchte stehlampe', bed: 'doppelbett', wardrobe: 'schrank kleiderschrank', shelf: 'regal', bookcase: 'bücherregal buecherregal',
};
$('#paletteSearch').addEventListener('input', (e) => { paletteQuery = e.target.value; buildPalette(); });
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
/* ================= Placeholder blocks and stairs ================= */
/** THREE shapes of a floor polygon with the stairwell openings cut out (polygon boolean, so partial overlaps work too) */
function floorShapes(points, holes) {
  const v = (p) => new THREE.Vector2(p[0], -p[1]);
  const plain = () => [new THREE.Shape(points.map(v))];
  if (!holes.length) return plain();
  let mp;
  try { mp = polygonClipping.difference([points.map((p) => [p[0], p[1]])], ...holes.map((h) => [h.map((p) => [p[0], p[1]])])); } catch { return plain(); }
  const shapes = mp.map((poly) => {
    const sh = new THREE.Shape(poly[0].slice(0, -1).map(v));
    poly.slice(1).forEach((ring) => sh.holes.push(new THREE.Path(ring.slice(0, -1).map(v))));
    return sh;
  });
  return shapes;
}

let stairType = 'straight', stairDir = 'up', stairTurn = 'right', stairRot = 0;
const stairTpl = () => ({ ...stairDefaults(stairType === 'shaft' ? 'U' : stairType), type: stairType === 'shaft' ? 'U' : stairType, dir: stairDir, turn: stairTurn, rot: stairRot });

/** stair mesh in the stair's local frame (origin = bottom start), steps as solid blocks */
function buildStair(st, holo, ghost, edgeMaterial) {
  const g = new THREE.Group();
  const stepMat = holo
    ? new THREE.MeshBasicMaterial({ color: 0x2a8cff, transparent: true, opacity: ghost ? 0.12 : 0.38, depthWrite: false, side: THREE.DoubleSide })
    : mat('#c9bba1', ghost, { side: THREE.DoubleSide });
  stairLocal(st, FLOOR_H).treads.forEach((tr) => {
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

function addBlock(points) {
  const target = blockTargetFloor();
  snapshot();
  const f = layout.floors[target];
  (f.blocks ||= []).push({ id: uid(), name: layout.floors[target].name, points });
  changed();
  if (target !== floorIdx) setStatus(t('block.addedTo').replace('{floor}', f.name));
}
/** where a new block goes: the floor below (created when missing) or the current one */
function blockTargetFloor() {
  const v = $('#blockFloor')?.value ?? 'below';
  if (v === 'this') return floorIdx;
  if (floorIdx > 0) return floorIdx - 1;
  if (layout.floors[0].name === t('floor.default')) layout.floors[0].name = t('floor.firstUpper');   // the default name now belongs to the new floor below
  layout.floors.unshift({ id: uid(), name: t('floor.blockName'), walls: [], rooms: [], devices: [], blocks: [], stairs: [] });
  floorIdx += 1;                                                  // the current floor moved up one
  fillFloorSelect();
  return 0;
}

function placeStair(x, z) {
  const f = floor();
  snapshot();
  if (stairType === 'shaft') { placeShaft(x, z); return; }
  const st = { id: uid(), name: t(`stair.${stairType}`), x, z, ...stairTpl() };
  (f.stairs ||= []).push(st);
  selection = { kind: 'stair', id: st.id };
  changed();
  setTool('select');                                              // size handles are usable right away
}

/** Treppenhaus preset: U stair + four walls + room + door, and the same shell on the next floor for an 'up' stair */
function placeShaft(cx, cz) {
  const f = floor();
  const base = { ...stairTpl(), type: 'U', x: 0, z: 0, rot: 0 };
  const b = stairBounds(base, FLOOR_H);
  const m = 0.2 + settings.wallThickness / 2;                     // clear space between stair and wall centre line
  const x0 = -(b.x1 - b.x0) / 2 - m, x1 = (b.x1 - b.x0) / 2 + m, z0 = -(b.z1 - b.z0) / 2 - m, z1 = (b.z1 - b.z0) / 2 + m;
  const snap = (v) => Math.round(v / 0.05) * 0.05;
  const rot = ((stairRot % 360) + 360) % 360;
  const rp = ([lx, lz]) => { const th = (rot * Math.PI) / 180; return [snap(cx + lx * Math.cos(th) + lz * Math.sin(th)), snap(cz - lx * Math.sin(th) + lz * Math.cos(th))]; };
  const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(rp);
  const shell = (fl, withStair) => {
    const th = settings.wallThickness, wh = settings.wallHeight;
    const ws = corners.map((c, i) => ({ id: uid(), a: [...c], b: [...corners[(i + 1) % 4]], thickness: th, height: wh, openings: [] }));
    fl.walls.push(...ws);
    fl.rooms.push({ id: uid(), name: t('stair.shaftName'), color: '#7d8a99', points: corners.map((c) => [...c]) });
    return ws;
  };
  const ws = shell(f);
  const door = ws[0];
  if (wallLength(door) > OPENING_DEFAULTS.door.width + 0.4) door.openings.push({ id: uid(), type: 'door', pos: wallLength(door) / 2, ...OPENING_DEFAULTS.door });
  const st = { ...base, id: uid(), name: t('stair.shaftName'), x: 0, z: 0 };
  const [ox, oz] = [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2];
  const [wx, wz] = (() => { const th = (rot * Math.PI) / 180; return [cx - (ox * Math.cos(th) + oz * Math.sin(th)), cz - (-ox * Math.sin(th) + oz * Math.cos(th))]; })();
  st.x = +wx.toFixed(3); st.z = +wz.toFixed(3); st.rot = rot;
  (f.stairs ||= []).push(st);
  const other = layout.floors[stairDir === 'up' ? floorIdx + 1 : -1];
  if (other) shell(other);                                        // same walls above so the shaft continues
  selection = { kind: 'stair', id: st.id };
  changed();
  setTool('select');
}

document.querySelectorAll('#stairTypes button').forEach((b) => b.addEventListener('click', () => {
  stairType = b.dataset.stair;
  document.querySelectorAll('#stairTypes button').forEach((x) => x.classList.toggle('active', x === b));
  plan?.render();
}));
$('#stairDir').addEventListener('change', (e) => { stairDir = e.target.value; plan?.render(); });
$('#stairTurn').addEventListener('change', (e) => { stairTurn = e.target.value; plan?.render(); });
$('#stairRot').addEventListener('change', (e) => { stairRot = ((+e.target.value % 360) + 360) % 360 || 0; plan?.render(); });

/* ================= Background image (template to trace) ================= */
let bgMode = null;                                       // null | 'move' | 'calib'
function setBgMode(m) {
  bgMode = m;
  if (m && !plan?.isVisible()) $('#view2d').click();      // the template only shows in the 2D editor
  plan?.setBgMode(m);
  setStatus(m === 'calib' ? t('bg.calibA') : m === 'move' ? t('bg.moveHint') : '');
  renderBgPanel();
}
function calibrate(a, b) {
  const f = floor(), bg = f?.bg;
  const measured = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (!bg || measured < 0.01) { setBgMode(null); return; }
  const raw = window.prompt(`${t('bg.askDist')} (${imperial() ? 'ft' : 'm'})`, '');
  const real = fromDisp(parseFloat(String(raw ?? '').replace(',', '.')));
  if (!(real > 0.05 && real < 500)) { setBgMode(null); return; }
  const k = real / measured;
  snapshot();
  bg.w = +(bg.w * k).toFixed(4);
  bg.x = +(a[0] + (bg.x - a[0]) * k).toFixed(4);
  bg.z = +(a[1] + (bg.z - a[1]) * k).toFixed(4);
  changed();
  setBgMode(null);
  setStatus(`${t('bg.scaleSet')}: ${fmtLen(bg.w)}`);
}
function imageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); resolve([im.naturalWidth, im.naturalHeight]); };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    im.src = url;
  });
}
async function uploadBackground(file) {
  const f = floor();
  if (!f || !file) return;
  const [nw, nh] = await imageSize(file);
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('api/backgrounds', { method: 'POST', body: fd });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
  const { name } = await r.json();
  snapshot();
  const keep = f.bg;                                      // replacing keeps position, scale and opacity
  f.bg = { img: name, x: keep?.x ?? 0, z: keep?.z ?? 0, w: keep?.w ?? 12, ar: +(nh / nw).toFixed(5), op: keep?.op ?? 0.5, rot: keep?.rot ?? 0 };
  changed();
  plan?.fit();
  setBgMode('move');                                      // handles are visible right away: drag to move, corners to resize
}
function renderBgPanel() {
  const box = $('#bgBody');
  if (!box) return;
  box.innerHTML = '';
  const f = floor();
  if (!f) return;
  const bg = f.bg;
  const lab = document.createElement('label'); lab.className = 'uploadBtn';
  const span = document.createElement('span'); span.textContent = t(bg ? 'bg.replace' : 'bg.load');
  const file = document.createElement('input'); file.type = 'file'; file.hidden = true; file.id = 'bgFile'; file.accept = 'image/png,image/jpeg,image/webp';
  file.addEventListener('change', async () => {
    const fl = file.files[0]; file.value = '';
    try { await uploadBackground(fl); } catch (err) { alert(`${t('panel.uploadFailed')}: ${err.message}`); }
  });
  lab.append(span, file);
  box.append(lab);
  if (!bg) { const p = document.createElement('p'); p.className = 'sub'; p.textContent = t('bg.help'); box.append(p); return; }

  const op = document.createElement('input'); op.type = 'range'; op.min = 0.1; op.max = 1; op.step = 0.05; op.value = bg.op ?? 0.5; op.id = 'bgOpacity';
  let snapped = false;
  op.addEventListener('input', () => { if (!snapped) { snapshot(); snapped = true; } bg.op = +op.value; plan?.render(); });
  op.addEventListener('change', () => { snapped = false; changed(false); });
  box.append(field(t('bg.opacity'), op));
  box.append(field(t('bg.width'), lenInput(() => bg.w, (v) => (bg.w = Math.max(0.5, v)), { min: 0.5 })));
  box.append(field('X', lenInput(() => bg.x, (v) => (bg.x = v), { min: -1000 })));
  box.append(field('Z', lenInput(() => bg.z, (v) => (bg.z = v), { min: -1000 })));
  box.append(field(t('bg.rot'), inp('number', bg.rot || 0, (v) => (bg.rot = Math.max(-180, Math.min(180, +v || 0))), { step: 0.5 })));

  const btns = document.createElement('div'); btns.className = 'stopTools';
  const mk = (id, label, on, active = false) => {
    const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label;
    b.classList.toggle('active', active); b.addEventListener('click', on); btns.append(b); return b;
  };
  mk('bgCalib', t('bg.calib'), () => setBgMode(bgMode === 'calib' ? null : 'calib'), bgMode === 'calib');
  mk('bgMove', t('bg.move'), () => setBgMode(bgMode === 'move' ? null : 'move'), bgMode === 'move');
  mk('bgHide', t(bg.hidden ? 'bg.show' : 'bg.hide'), () => { snapshot(); bg.hidden = !bg.hidden; changed(false); plan?.render(); renderBgPanel(); });
  mk('bgRemove', t('bg.remove'), () => { snapshot(); delete f.bg; if (bgMode) plan?.setBgMode(null), (bgMode = null); setStatus(''); changed(false); plan?.render(); renderBgPanel(); });
  box.append(btns);
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

/* Entities grouped by HA area (room's area first) -> [{label, items}] */
function groupEntities(list, room) {
  const byArea = new Map();
  list.forEach((e) => { const k = areaOf[e.entity_id] || ''; if (!byArea.has(k)) byArea.set(k, []); byArea.get(k).push(e); });
  const nameOf = (k) => areas.find((q) => q.id === k)?.name || k;
  const keys = [...byArea.keys()].sort((x, y) => {
    if (room?.area && x === room.area) return -1;
    if (room?.area && y === room.area) return 1;
    if (!x) return 1; if (!y) return -1;
    return nameOf(x).localeCompare(nameOf(y));
  });
  return keys.map((k) => ({ label: areas.length ? (k ? (room?.area === k ? t('area.here', { n: nameOf(k) }) : nameOf(k)) : t('area.unassigned')) : '', items: byArea.get(k) }));
}

/* Searchable entity picker: search box + roomy result list (full names wrap, grouped by area).
   Search matches name, entity id and area; several words = AND; Enter picks the first match. */
function entityPicker(list, room, current, onChange) {
  const wrap = document.createElement('div'); wrap.className = 'entPicker';
  const cur = document.createElement('div'); cur.className = 'entCur';
  const search = document.createElement('input'); search.type = 'search'; search.placeholder = t('panel.entitySearch');
  const box = document.createElement('div'); box.className = 'entList'; box.hidden = true;
  const areaName = (e) => (areas.find((x) => x.id === areaOf[e.entity_id])?.name || '').toLowerCase();
  let matches = [];
  const showCur = () => {
    const e = list.find((x) => x.entity_id === current);
    cur.textContent = ''; cur.classList.toggle('none', !current);
    if (!current) { cur.textContent = t('panel.noEntity'); return; }
    const n = document.createElement('b'); n.textContent = e?.name || current;
    const id = document.createElement('small'); id.textContent = current;
    cur.append(n, id);
  };
  const choose = (id) => { current = id; search.value = ''; box.hidden = true; showCur(); onChange(id); };
  const item = (id, name, sub) => {
    const it = document.createElement('div'); it.className = 'entItem' + (id === current ? ' sel' : ''); it.dataset.id = id;
    const n = document.createElement('span'); n.textContent = name; it.append(n);
    if (sub) { const s = document.createElement('small'); s.textContent = sub; it.append(s); }
    it.addEventListener('pointerdown', (ev) => { ev.preventDefault(); choose(id); });
    return it;
  };
  const fill = () => {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    matches = list.filter((e) => words.every((w) => `${e.entity_id} ${e.name} ${areaName(e)}`.toLowerCase().includes(w))).slice(0, 300);
    box.innerHTML = '';
    box.append(item('', t('panel.noEntity'), ''));
    groupEntities(matches, room).forEach((g) => {
      if (g.label) { const h = document.createElement('div'); h.className = 'entGroup'; h.textContent = g.label; box.append(h); }
      g.items.forEach((e) => box.append(item(e.entity_id, e.name, e.entity_id)));
    });
    if (!matches.length) { const n = document.createElement('div'); n.className = 'entEmpty'; n.textContent = '–'; box.append(n); }
  };
  search.addEventListener('focus', () => { fill(); box.hidden = false; });
  search.addEventListener('input', () => { fill(); box.hidden = false; });
  search.addEventListener('blur', () => { box.hidden = true; });
  search.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { search.blur(); return; }
    if (ev.key !== 'Enter' || !matches.length) return;
    ev.preventDefault(); choose(matches[0].entity_id);
  });
  wrap.append(cur, search, box); showCur();
  return wrap;
}
const pickerField = (label, picker) => { const w = field(label, picker); w.classList.add('stack'); return w; };
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
let roomEntFilter = '';
function renderRoomEntities() {
  const box = $('#roomEnts');
  const room = roomCtx ? floor()?.rooms.find((r) => r.id === roomCtx) : null;
  if (!box || !room) return;
  const hadFocus = document.activeElement?.id === 'roomEntSearch';
  box.replaceChildren();
  const h = document.createElement('h4'); h.textContent = t('prop.roomEntities'); box.append(h);
  const rs = document.createElement('input'); rs.type = 'search'; rs.id = 'roomEntSearch'; rs.placeholder = t('panel.entitySearch'); rs.value = roomEntFilter;
  const applyFilter = () => {              // filter in place, so typing is never interrupted by a re-render
    const words = roomEntFilter.toLowerCase().split(/\s+/).filter(Boolean);
    box.querySelectorAll('.re-row').forEach((r) => { r.hidden = !words.every((w) => r.dataset.q.includes(w)); });
  };
  rs.addEventListener('input', () => { roomEntFilter = rs.value; applyFilter(); });
  box.append(rs);
  const placed = floor().devices.filter((d) => pointInPoly(d.x, d.z, room.points));
  const placedIds = new Set(floor().devices.map((d) => d.entity).filter(Boolean));
  const row = (title, entity, btn) => {
    const r = document.createElement('div'); r.className = 're-row';
    const n = document.createElement('span'); n.className = 're-n'; n.textContent = title;
    const s = document.createElement('span'); s.className = 're-s'; s.textContent = entity ? `${entity} · ${stateText(entity)}` : t('re.noEntity');
    r.append(n, s);
    r.dataset.q = `${title} ${entity || ''} ${areas.find((x) => x.id === areaOf[entity])?.name || ''}`.toLowerCase();
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
  applyFilter();
  if (hadFocus) { rs.focus(); rs.setSelectionRange(rs.value.length, rs.value.length); }
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
  const fi = document.createElement('input'); fi.type = 'search'; fi.className = 'objfilter'; fi.placeholder = t('obj.filter'); fi.value = objFilter;
  fi.addEventListener('input', () => { objFilter = fi.value; const pos = fi.selectionStart; renderObjList(); const n = $('#objListBody .objfilter'); n?.focus(); n?.setSelectionRange(pos, pos); });
  body.append(fi);
  /* grouped by room: the room itself, its doors / windows and its furniture; everything else below */
  const q = (objFilter || '').trim().toLowerCase();
  const used = new Set();
  const take = (list) => list.filter((it) => { if (used.has(it.id)) return false; used.add(it.id); return true; });
  const devItem = (d) => ({ kind: 'device', id: d.id, label: d.name || t(`dev.${d.type}`) });
  const opItem = (o) => ({ kind: 'opening', id: o.id, label: o.name || t(`prop.${o.type}`) });
  const groups = [];
  f.rooms.forEach((r) => {
    const items = [{ kind: 'room', id: r.id, label: `▣ ${r.name || t('prop.room')}` },
      ...take(roomOpenings(r, f).map(opItem)), ...take(f.devices.filter((d) => pointInPoly(d.x, d.z, r.points)).map(devItem))];
    groups.push([`room:${r.id}`, items, r.name || t('prop.room')]);
  });
  const restOps = take(f.walls.flatMap((w) => (w.openings || []).map(opItem)));
  const restDevs = take(f.devices.map(devItem));
  if (restOps.length || restDevs.length) groups.push(['obj.noRoom', [...restOps, ...restDevs], t('obj.noRoom')]);
  groups.push(
    ['obj.walls', f.walls.map((w, i) => ({ kind: 'wall', id: w.id, label: `${t('prop.wall')} ${i + 1} · ${wallLength(w).toFixed(1)} m` }))],
    ['obj.stairs', (f.stairs || []).map((s) => ({ kind: 'stair', id: s.id, label: s.name || t(`stair.${s.type}`) }))],
    ['obj.blocks', (f.blocks || []).map((b) => ({ kind: 'block', id: b.id, label: b.name || t('prop.block') }))],
  );
  groups.forEach(([key, allItems, title]) => {
    const items = q ? allItems.filter((it) => it.label.toLowerCase().includes(q)) : allItems;
    if (!items.length) return;
    const det = document.createElement('details');
    const holdsSel = items.some((it) => it.id === selection?.id);
    det.open = q ? true : holdsSel || (objGroupOpen[key] ?? false);
    det.addEventListener('toggle', () => { objGroupOpen[key] = det.open; });
    const sum = document.createElement('summary'); sum.textContent = `${title ?? t(key)} (${items.length})`;
    det.append(sum);
    items.forEach((it) => {
      const rowEl = document.createElement('div'); rowEl.className = 'objrow';
      const lk = document.createElement('input'); lk.type = 'checkbox'; lk.className = 'objlock'; lk.title = t('prop.lock');
      lk.checked = !!itemOf(it.kind, it.id)?.locked;
      lk.addEventListener('change', () => { const o = itemOf(it.kind, it.id); if (!o) return; snapshot(); if (lk.checked) o.locked = true; else delete o.locked; changed(); renderProps(); plan?.render(); });
      const b = document.createElement('button');
      b.className = 'obj' + (selection?.id === it.id ? ' active' : '') + (itemOf(it.kind, it.id)?.locked ? ' locked' : '');
      b.textContent = it.label;
      b.addEventListener('click', () => {
        if (!registry.get(it.id)) return;
        if (selection?.id === it.id && lockedSel) { releaseLock(); return; }   // click again: release
        if (tool !== 'select') setTool('select');
        selection = { kind: it.kind, id: it.id };
        lockedSel = true;
        refreshSelection();
      });
      rowEl.append(lk, b);
      det.append(rowEl);
    });
    body.append(det);
  });
}
const objGroupOpen = {};
let objFilter = '';

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
  else if (selection.kind === 'stair') it = (f.stairs || []).find((x) => x.id === selection.id);
  else if (selection.kind === 'block') it = (f.blocks || []).find((x) => x.id === selection.id);
  else if (selection.kind === 'opening') it = findOpening(selection.id)?.opening;
  if (!it) { box.hidden = true; return; }
  box.hidden = false;
  $('#propsTitle').textContent = selection.kind === 'opening' ? t(`prop.${it.type}`) : selection.kind === 'stair' ? t(`stair.${it.type}`) : t(`prop.${selection.kind}`);

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
  } else if (selection.kind === 'block') {
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field(t('prop.height'), lenInput(() => it.h || FLOOR_H, (v) => (it.h = Math.max(0.5, v)), { min: 0.5, step: 0.1 })));
    const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('block.help'); body.append(hp);
  } else if (selection.kind === 'stair') {
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    const dsel = document.createElement('select');
    [['up', t('stair.up')], ['down', t('stair.down')]].forEach(([v, l]) => dsel.add(new Option(l, v)));
    dsel.value = it.dir || 'up';
    dsel.addEventListener('change', () => { snapshot(); it.dir = dsel.value; changed(); });
    body.append(field(t('stair.dir'), dsel));
    if (it.type !== 'straight') {
      const tsel = document.createElement('select');
      [['right', t('stair.right')], ['left', t('stair.left')]].forEach(([v, l]) => tsel.add(new Option(l, v)));
      tsel.value = it.turn || 'right';
      tsel.addEventListener('change', () => { snapshot(); it.turn = tsel.value; changed(); });
      body.append(field(t('stair.turn'), tsel));
    }
    body.append(field(it.type === 'spiral' ? t('stair.radius') : t('bg.width'), lenInput(() => it.w, (v) => (it.w = Math.max(0.5, v)), { min: 0.5 })));
    if (it.type !== 'spiral') {
      const cnt = stairCounts(it, FLOOR_H)[it.type === 'straight' ? 'T' : 'n1'];
      body.append(field(t('stair.length'), lenInput(() => stairLength(it, FLOOR_H), (v) => (it.tread = Math.max(0.18, Math.min(0.45, v / cnt))), { min: 1 })));
    }
    body.append(field(t('prop.rotation'), inp('number', it.rot || 0, (v) => (it.rot = ((+v % 360) + 360) % 360), { step: 15 })));
    body.append(field('X', lenInput(() => it.x, (v) => (it.x = v), { min: -1000 })));
    body.append(field('Z', lenInput(() => it.z, (v) => (it.z = v), { min: -1000 })));
    const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('stair.help'); body.append(hp);
  } else if (selection.kind === 'opening') {
    const { wall } = findOpening(it.id);
    const refit = () => { const p = clampOpeningPos(wall, it.width, it.pos); if (p !== null && !openingOverlaps(wall, p, it.width, it.id)) it.pos = p; };
    body.append(field(t('prop.width'), lenInput(() => it.width, (v) => { it.width = Math.max(0.3, v); refit(); }, { min: 0.3 })));
    body.append(field(t('prop.height'), lenInput(() => it.height, (v) => (it.height = Math.max(0.3, v)), { min: 0.3 })));
    if (it.type === 'window') body.append(field(t('prop.sill'), lenInput(() => it.sill, (v) => (it.sill = v))));
    const ssel = document.createElement('select'); ssel.id = 'openStyle';
    (it.type === 'door' ? DOOR_STYLES : WINDOW_STYLES).forEach((v) => ssel.add(new Option(t(`st.${v}`), v)));
    ssel.value = it.style || (it.type === 'door' ? 'single' : 'double');
    ssel.addEventListener('change', () => { snapshot(); it.style = ssel.value; changed(); });
    body.append(field(t('prop.style'), ssel));
    body.append(field(t('prop.position'), lenInput(() => it.pos, (v) => {
      const p = clampOpeningPos(wall, it.width, v);
      if (p !== null && !openingOverlaps(wall, p, it.width, it.id)) it.pos = p;
    })));
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    const contact = entities.filter((e) => ['binary_sensor', 'cover', 'lock'].includes(e.domain));
    body.append(pickerField(t('prop.contact'), entityPicker((contact.length ? contact : entities).slice(0, 1500), roomCtx ? f.rooms.find((r) => r.id === roomCtx) : null, it.entity || '', (v) => { snapshot(); it.entity = v; changed(); })));
    if (it.type === 'window' && (it.style === 'double' || it.style === 'triple' || (!it.style))) {
      const count = it.style === 'triple' ? 3 : 2;
      const h = document.createElement('h4'); h.textContent = t('pane.title'); body.append(h);
      for (let i = 0; i < count; i++) {
        body.append(pickerField(t('pane.n', { n: i + 1 }), entityPicker((contact.length ? contact : entities).slice(0, 1500), roomCtx ? f.rooms.find((r) => r.id === roomCtx) : null, (it.paneEntities || [])[i] || '', (v) => {
          snapshot(); const arr = it.paneEntities || []; while (arr.length < count) arr.push(''); arr[i] = v;
          it.paneEntities = arr.some(Boolean) ? arr : undefined; changed();
        })));
      }
    }
    if (it.type === 'door') {
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!it.flip;
      cb.addEventListener('change', () => { snapshot(); it.flip = cb.checked; changed(); });
      body.append(field(t('prop.flip'), cb));
      const ci = document.createElement('input'); ci.type = 'checkbox'; ci.checked = !!it.inv; ci.id = 'doorInv';
      ci.addEventListener('change', () => { snapshot(); it.inv = ci.checked; changed(); });
      body.append(field(t('prop.inv'), ci));
    }
  } else {
    const bring = document.createElement('button'); bring.type = 'button'; bring.textContent = t('prop.bringHere');
    bring.addEventListener('click', () => { snapshot(); it.x = +controls.target.x.toFixed(2); it.z = +controls.target.z.toFixed(2); if (WALL_TYPES.has(it.type)) snapToWall(it, 0.8); changed(); build(); refreshSelection(); });
    body.append(bring);
    const lk = document.createElement('input'); lk.type = 'checkbox'; lk.checked = !!it.locked; lk.id = 'devLock';
    lk.addEventListener('change', () => { snapshot(); if (lk.checked) it.locked = true; else delete it.locked; changed(); renderProps(); renderObjList(); });
    const lkl = document.createElement('label'); lkl.className = 'chk'; lkl.append(lk, document.createTextNode(' ' + t('prop.lock')));
    body.append(lkl);
    if (it.type === 'nanoleaf') {
      const eb = document.createElement('button'); eb.type = 'button'; eb.id = 'nanoEdit'; eb.textContent = '✎ ' + t('nano.edit');
      eb.addEventListener('click', () => { if (!it.locked) editNano(it); else setStatus(t('prop.lockedHint')); });
      body.append(eb);
    }
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field('X', lenInput(() => it.x, (v) => (it.x = v), { min: -1000 })));
    body.append(field('Z', lenInput(() => it.z, (v) => (it.z = v), { min: -1000 })));
    body.append(field(t('prop.rotation'), inp('number', it.rot || 0, (v) => { const nv = ((+v % 360) + 360) % 360; if (it.group) rotateGroup(it, nv - (it.rot || 0)); else it.rot = nv; }, { step: 15 })));
    body.append(field(t('prop.elev'), lenInput(() => it.y ?? 0, (v) => (it.y = v), { min: -5, step: 0.1 })));
    body.append(field(t('prop.size'), inp('number', it.scale || 1, (v) => (it.scale = Math.max(0.2, +v)), { step: 0.1, min: 0.2 })));
    if (it.type !== 'picture') {
      const base = baseDims(it.type);
      if (base) {                                                     // real dimensions in metres, type them in directly
        const dim = (key, axis, label) => field(label, lenInput(() => base[axis] * (it.scale || 1) * (it[key] || 1), (v) => {
          const n = Math.max(0.1, Math.min(10, v / (base[axis] * (it.scale || 1))));
          if (Math.abs(n - 1) < 0.005) delete it[key]; else it[key] = +n.toFixed(4);
        }, { min: 0.02, step: 0.05 }));
        body.append(dim('sx', 'x', t('prop.dimW')), dim('sy', 'y', t('prop.dimH')), dim('sz', 'z', t('prop.dimD')));
      } else {
        const stretch = (key, label) => field(label, inp('number', it[key] || 1, (v) => { const n = Math.max(0.1, Math.min(10, +v || 1)); if (Math.abs(n - 1) < 0.005) delete it[key]; else it[key] = +n.toFixed(3); }, { step: 0.1, min: 0.1 }));
        body.append(stretch('sx', t('prop.stretchX')), stretch('sy', t('prop.stretchY')), stretch('sz', t('prop.stretchZ')));
      }
    }
    const angle = (key) => inp('number', it[key] || 0, (v) => { const a = ((+v % 360) + 360) % 360; if (a) it[key] = a; else delete it[key]; }, { step: 15 });
    body.append(field(t('prop.tiltX'), angle('tiltX')), field(t('prop.tiltZ'), angle('tiltZ')));
    const cm = document.createElement('input'); cm.type = 'checkbox'; cm.checked = !!it.mirror; cm.id = 'devMirror';
    cm.addEventListener('change', () => { snapshot(); if (cm.checked) it.mirror = true; else delete it.mirror; changed(); });
    body.append(field(t('prop.mirror'), cm));
    if (it.type === 'picture') {
      const lab = document.createElement('label'); lab.className = 'uploadBtn';
      const span = document.createElement('span'); span.textContent = t(it.img ? 'pic.replace' : 'pic.load');
      const file = document.createElement('input'); file.type = 'file'; file.hidden = true; file.id = 'picFile'; file.accept = 'image/png,image/jpeg,image/webp';
      file.addEventListener('change', async () => { const fl = file.files[0]; file.value = ''; try { await uploadPicture(fl, it); } catch (err) { alert(`${t('panel.uploadFailed')}: ${err.message}`); } });
      lab.append(span, file); body.append(lab);
      body.append(field(t('pic.width'), lenInput(() => it.w || 0.6, (v) => (it.w = Math.max(0.1, v)), { min: 0.1 })));
      if (!it.img) { const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('pic.help'); body.append(hp); }
    }
    if (WALL_TYPES.has(it.type)) {
      const sb = document.createElement('button'); sb.type = 'button'; sb.id = 'snapWall'; sb.textContent = t('pic.snap');
      sb.addEventListener('click', () => { snapshot(); snapToWall(it, 3, true); changed(); renderProps(); });
      body.append(sb);
    }
    if (it.group) {
      const members = groupMembers(it);
      const gp = document.createElement('div'); gp.className = 'sub'; gp.textContent = t('group.info', { n: members.length });
      const gb = document.createElement('div'); gb.className = 'stopTools';
      const mk = (id, label, on) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.addEventListener('click', () => { snapshot(); on(); changed(); renderProps(); }); return b; };
      gb.append(mk('grpMirror', t('group.mirror'), () => mirrorGroup(it)),
                mk('grpLeave', t('group.leave'), () => { delete it.group; }),
                mk('grpDissolve', t('group.dissolve'), () => { members.forEach((m) => delete m.group); }));
      body.append(gp, gb);
    }
    body.append(pickerField(t('prop.entity'), entityPicker(entities.slice(0, 1500), roomAt(it.x, it.z), it.entity || '', (v) => { snapshot(); it.entity = v; changed(); })));
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
  shadows: '#setShadows', showLabels: '#setLabels', lowWalls: '#setLowWalls', cutaway: '#setCutaway', wallStop: '#setWallStop',
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
let haUsers = [];
async function loadHaUsers() {
  try { const r = await fetch('api/users'); haUsers = r.ok ? await r.json() : []; } catch { haUsers = []; }
  const dl = $('#haUsers'); dl.replaceChildren();
  haUsers.forEach((u) => { const o = document.createElement('option'); o.value = u.username; o.label = u.name; dl.append(o); });
}
const VIEW_OPTS = ['3d', '2d', 'split', 'all'];
function tabletRow(user = '', room = '', view = '3d') {
  const row = document.createElement('div'); row.className = 'stop tablet';
  const u = document.createElement('input'); u.type = 'text'; u.value = user; u.dataset.role = 'user'; u.placeholder = t('set.tabletUser'); u.setAttribute('list', 'haUsers');
  const sel = document.createElement('select'); sel.dataset.role = 'room';
  sel.add(new Option(t('set.wholeHouse'), ''));
  allRoomNames().forEach((n) => sel.add(new Option(n, n)));
  if (room && !allRoomNames().includes(room)) sel.add(new Option(room, room));
  sel.value = room;
  const vs = document.createElement('select'); vs.dataset.role = 'view';
  VIEW_OPTS.forEach((v) => vs.add(new Option(t(`set.view.${v}`), v)));
  vs.value = VIEW_OPTS.includes(view) ? view : '3d';
  const del = document.createElement('button'); del.type = 'button'; del.textContent = '×';
  del.addEventListener('click', () => { row.remove(); commitSettings(); });
  row.append(u, sel, vs, del);
  return row;
}
function renderTablets() {
  const box = $('#tabletRows');
  box.replaceChildren();
  const names = [...new Set([...Object.keys(settings.userRooms || {}), ...Object.keys(settings.userViews || {})])];
  names.forEach((user) => box.append(tabletRow(user, (settings.userRooms || {})[user] || '', (settings.userViews || {})[user] || '3d')));
}
function readTablets() {
  const rooms = {}, views = {};
  document.querySelectorAll('#tabletRows .tablet').forEach((r) => {
    const u = r.querySelector('[data-role=user]').value.trim();
    if (!u) return;
    const room = r.querySelector('[data-role=room]').value;
    if (room) rooms[u] = room;
    views[u] = r.querySelector('[data-role=view]').value;
  });
  return { rooms, views };
}
$('#addTablet').addEventListener('click', () => {
  const row = tabletRow(); $('#tabletRows').append(row); row.querySelector('input').focus();
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
  const tb = readTablets(); next.userRooms = tb.rooms; next.userViews = tb.views;
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
  renderer.shadowMap.enabled = settings.shadows && !LOW;
  sun.castShadow = settings.shadows && !LOW;
  world.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  if (prev.grid !== settings.grid || prev.theme !== settings.theme || !grid) rebuildGrid();
  buildPalette(); fillEntities($('#entitySearch').value); renderProps();
  $('#hintText').textContent = isLive() ? t('hint.live') : t(`hint.${tool}`);
  updateNavToggles(); buildNav(true);
  applyStates();
}
let settingsLoaded = false, settingsEtag = null;   // never save settings that were not loaded from the server first (would wipe e.g. the tablet assignments)
async function loadSettings() {
  for (let i = 0; i < 6 && !settingsLoaded; i++) {
    try {
      const r = await fetch('api/settings');
      if (r.ok) { settings = { ...settings, ...(await r.json()) }; settingsEtag = r.headers.get('ETag'); settingsLoaded = true; break; }
    } catch { /* add-on is probably restarting, try again */ }
    await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
  }
  return settingsLoaded;
}
async function commitSettings() {
  if (!settingsLoaded && !(await loadSettings())) { setStatus(t('set.notLoaded')); return; }
  const prev = settings;
  settings = readSettingsForm();
  if (prev.lowWalls !== settings.lowWalls) lowWalls = settings.lowWalls;
  if (Math.abs(settings.wallHeight - prev.wallHeight) > 1e-6) {        // the wall height applies to every wall, not only to new ones
    snapshot();
    layout.floors.forEach((f) => f.walls.forEach((w) => { w.height = settings.wallHeight; }));
    changed();
  }
  applySettings(prev);
  build();
  fillSettingsForm();
  try {
    const r = await fetch('api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(settingsEtag ? { 'If-Match': settingsEtag } : {}) }, body: JSON.stringify(settings) });
    if (r.ok) { settings = { ...settings, ...(await r.json()) }; settingsEtag = r.headers.get('ETag'); }
    else if (r.status === 409) { alert(t('set.changedElsewhere')); location.reload(); }
  } catch { /* offline: settings stay for this session */ }
}
$('#settingsBtn').addEventListener('click', () => { fillSettingsForm(); dlg.showModal(); loadHaUsers(); });
dlg.addEventListener('change', commitSettings);
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });     // a click on the dark backdrop closes it too

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
    const sig = JSON.stringify(list.map((e) => [e.entity_id, e.state, e.brightness, e.rgb, e.position]));
    if (sig !== lastStateSig) { lastStateSig = sig; wake(); }
    entities = list.sort((a, b) => a.name.localeCompare(b.name));
    states = Object.fromEntries(list.map((e) => [e.entity_id, { state: e.state, unit: e.unit, brightness: e.brightness, position: e.position, rgb: e.rgb, dc: e.dc, ct: e.ct, ch: e.ch, fx: e.fx, fxc: e.fxc, members: e.members }]));
    if (firstLoad) { await loadAreas(); fillEntities(); renderProps(); }
    applyStates();
    renderRoomEntities(); renderEntState();
  } catch { /* offline: ignore */ }
}

function normalizeLayout() {
  let migrated = false;
  if (!layout.floors?.length) {
    layout = { version: 1, floors: [{ id: uid(), name: t('floor.default'), walls: [], rooms: [], devices: [], blocks: [], stairs: [] }] };
    migrated = true;
  }
  layout.floors.forEach((f) => {
    f.walls ||= []; f.rooms ||= []; f.devices ||= []; f.blocks ||= []; f.stairs ||= []; f.kind ||= 'floor';
    f.walls.forEach((w) => { w.openings ||= []; });
  });
  // Earlier empty layouts used a language-specific default name. Migrate only that generated placeholder,
  // never a floor that contains user data.
  const f = layout.floors[0];
  if (layout.floors.length === 1 && f?.id === 'f1' && ['Erdgeschoss', 'Ground floor', 'Parter'].includes(f.name)
      && !f.walls.length && !f.rooms.length && !f.devices.length && !f.blocks.length && !f.stairs.length
      && f.name !== t('floor.default')) {
    f.name = t('floor.default');
    migrated = true;
  }
  return migrated;
}

plan = createPlan({
  stage: $('#stage'),
  floor: () => floor(), layout: () => layout, getFloorIdx: () => floorIdx, settings: () => settings,
  getTool: () => tool, getOpeningType: () => openingType, isLive: () => isLive(), isLocked: () => lockedSel,
  getSelection: () => selection,
  setSelection: (h) => { selection = h ? { kind: h.kind, id: h.id } : null; refreshSelection(); },
  snapshot, commit: () => changed(), deleteItem, rebuild3d: () => build(), calibrate,
  bgChanged: () => renderBgPanel(), floorH: () => FLOOR_H, addBlock, placeStair, getStairTemplate: () => ({ id: 'tpl', ...stairTpl() }),
  moveDeviceTo: (d, x, z) => moveDeviceTo(d, x, z), isItemLocked: (k, id) => !!itemOf(k, id)?.locked,
  groupToggle: (id) => groupToggle(id), groupPicked: () => groupPick,
  liveMoveDevice: (d) => liveMove(d),
  liveTap: (h) => liveSelect(h),
  deviceDoubleClick: (id) => { const d = floor().devices.find((v) => v.id === id); if (d?.entity) quickAction(d.entity); },
  newDevice, findOpening, projectOnWall, clampOpeningPos, openingOverlaps, OPENING_DEFAULTS, uid, pointInPoly,
  roomHeat: (room, f) => (viewMode === 'normal' ? null : roomHeat(room, f)),
  states: () => states, isOn: (e) => ON_STATES.has(states[e]?.state), stateText, openText, fmtLen, t, setStatus,
  area: (p) => (imperial() ? `${(polyArea(p) * 10.7639).toFixed(0)} ft²` : `${polyArea(p).toFixed(1)} m²`),
});

async function init() {
  if (params.get('kiosk')) document.body.classList.add('kiosk');
  try { me = await (await fetch('api/me')).json(); } catch { /* standalone */ }
  tabletRoom = params.get('room') || me.room || null;
  if (!me.canEdit || tabletRoom) document.body.classList.add('kiosk');
  if (tabletRoom) document.body.classList.add('roomtablet');
  if (!me.canEdit) document.body.classList.add('readonly');
  if (!me.canEdit && me.adminCheck === false) setStatus(t('me.noAdminCheck'));
  if (!(await loadSettings())) setStatus(t('set.notLoaded'));
  lowWalls = settings.lowWalls;
  setLanguage(settings.language);
  await loadHouses();
  try { layout = await (await fetch(layoutUrl())).json(); } catch { setStatus(t('loadFailed')); }
  const layoutMigrated = normalizeLayout();
  renderHouseUi();
  await loadModels();
  applySettings();
  fillFloorSelect(); fillEntities(); setTool('select'); resize(); build(); fitCamera(); renderBgPanel(); renderFloorPanel();
  if (layoutMigrated && me.canEdit) scheduleSave();
  if (params.get('mode') === 'live' || params.get('kiosk') || tabletRoom || !me.canEdit) setMode('live');
  if (tabletRoom) {
    const hit = findRoomByName(tabletRoom);
    if (hit) { switchFloor(hit.floor); focusRoom(hit.room.id); openRoomPanel(hit.room.id); }
    updateHouseToggle();
  }
  pollStates();
  setInterval(pollStates, 4000);
}

var lastActive = performance.now(), lastFrame = 0;
function wake() { lastActive = performance.now(); }
['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart', 'touchmove'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
controls.addEventListener('change', wake);
function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  if (document.hidden) return;                                   // screen off / tab in background: draw nothing
  if (LOW) {
    const idle = now - lastActive > 4000;
    if (now - lastFrame < (idle ? 250 : 33)) return;
    lastFrame = now;
  }
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
    editNano(id) { const d = floor().devices.find((v) => v.id === id); if (d) editNano(d); },
    screenOf(id) {
      const obj = registry.get(id);
      if (!obj) return null;
      const v = obj.getWorldPosition(new THREE.Vector3()).project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    get layout() { return layout; },
    houseId: () => houseId,
    rebuild: () => build(),
    switchHouse,
    paneTargets: (id) => (registry.get(id)?.userData.panePivots || []).map((p) => p.userData.target),
    fakeState(e, st) { states[e] = { ...(states[e] || {}), state: st }; applyOpenings(); },
    has: (id) => registry.has(id),
    roomArea(id) {                                                  // floor area actually built (test helper: shows cut-outs)
      const pos = roomMeshes.get(id)?.mesh.geometry.getAttribute('position');
      if (!pos) return null;
      let a = 0;
      for (let i = 0; i + 2 < pos.count; i += 3) a += Math.abs((pos.getX(i + 1) - pos.getX(i)) * (pos.getZ(i + 2) - pos.getZ(i)) - (pos.getX(i + 2) - pos.getX(i)) * (pos.getZ(i + 1) - pos.getZ(i))) / 2;
      return +a.toFixed(3);
    },
    stairHandle(id, k) { const st = floor().stairs.find((v) => v.id === id); const h = st && stairHandles(st, FLOOR_H)[k]; return h ? toWorld(st, h[0], h[1]) : null; },
    objInfo(id) { const o = registry.get(id); return o && { rx: o.rotation.x, rz: o.rotation.z, sx: o.scale.x }; },
    moveDevice: (id, x, z) => { const d = floor().devices.find((v) => v.id === id); moveDeviceTo(d, x, z); return [d.x, d.z]; },
    setWallStop: (v) => { settings.wallStop = v; },
    snapPicture: (id) => { const d = floor().devices.find((v) => v.id === id); snapToWall(d, 3, true); return [d.x, d.z, d.rot]; },
    group: (ids) => { ids.forEach((id) => groupPick.add(id)); makeGroup(); }, LOW, elev, houseMode: () => houseMode, setHouseMode, moveFloor, addFloorOf, floorIdx: () => floorIdx,
    holeCount: (i) => holesForFloor(layout.floors, i, FLOOR_H).length,
    plan: () => plan,
    topDown() { is2d = true; controls.enableRotate = false; build(); fitCamera(); },     // test helper: orthogonal-ish camera above the floor
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
