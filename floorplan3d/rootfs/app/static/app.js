import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { initImport } from './import.js';
import { initToolbar } from './toolbar.js';
import { initBackups } from './backups.js';
import { findAlerts, nightActive, matchScore } from './alerts.js';
import { openNanoEditor, DEFAULT_PANELS } from './nanoleaf.js';
import { canMoreInfo, openMoreInfo } from './moreinfo.js';
import { planPlacement, classify } from './autoplace.js';
import { RING_DEFAULT_INSET, ringCount, segEntity, ringEntities, ringSectionsWorld, ringFromRoom, fitSegs, hasRanges, pathLength, splitEven, perWall, splitSection, removeSection, setRange } from './ledring.js';
import { DEVICE_TYPES, CATEGORIES, catOf, thumbnail, makeModel, forgetGlb, isCustom } from './models.js';
import {
  OPENING_DEFAULTS, DOOR_STYLES, WINDOW_STYLES, buildWall, wallLength, projectOnWall, clampOpeningPos, openingOverlaps,
} from './walls.js';
import { t, setLanguage, applyI18n, currentLanguage } from './i18n.js';
import { createPlan } from './plan2d.js';
import polygonClipping from './vendor/polygon-clipping.js';
import { detectRooms } from './rooms.js';
import { dormerParts, DORMER_DEFAULT, DORMER_TYPES } from './dormer.js';
import { STAIR_TYPES, stairDefaults, stairBounds, stairLocal, polyToWorld, holesForFloor, toWorld, stairCounts, stairLength, stairHandles, MIN_TREAD, MAX_TREAD } from './stairs.js';

/* ================= State ================= */
const FLOOR_H = 3.0;
const M_TO_FT = 3.28084;
const params = new URLSearchParams(location.search);

let settings = {
  language: 'de', theme: 'holo', units: 'metric', grid: 0.25, wallHeight: 2.6, wallThickness: 0.2,
  shadows: true, autosaveSeconds: 1.5, lowWalls: false, labelMode: 'important', cameraImages: true, cutaway: true, wallStop: true, placeSelect: true, autoBackup: false, backupEveryHours: 24, backupKeepDays: 14, backupKeepCount: 30, earth: 'solid', earthMargin: 5,
  alerts: true, alertJump: false, weatherEntity: '', idleReturn: 0, idleOrbit: false, nightDim: 'off', nightFrom: '22:00', nightTo: '06:00',
  wallOpacity: 0.72, glowRadius: 3.5, glowStrength: 1, glowHeight: 1.6, defaultLightColor: '#ffc861',
  userRooms: {}, userViews: {}, belowVisibility: 0.5, belowMode: 'dim', bgTop: '#0a3ba8', bgBottom: '#031547', bgGlow: '#28ebd2', bgGlowStrength: 0,
  tempStops: [{ v: 16, c: '#2a6bff' }, { v: 20, c: '#2ad0a0' }, { v: 23, c: '#ffd84a' }, { v: 26, c: '#ff8a2a' }, { v: 30, c: '#ff3a3a' }],
  humidStops: [{ v: 30, c: '#e8d9a0' }, { v: 50, c: '#4fd0c8' }, { v: 65, c: '#2a7bff' }, { v: 80, c: '#5a3aff' }],
  co2Stops: [{ v: 400, c: '#2ad0a0' }, { v: 800, c: '#ffd84a' }, { v: 1200, c: '#ff8a2a' }, { v: 2000, c: '#ff3a3a' }],
};
const DEFAULT_LOOK = structuredClone(settings);
let layout = { version: 1, floors: [] };
let floorIdx = 0;
let returnToTool = null;          // after placing a device the Select tool is active for one click, then this tool comes back
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
/* Home Assistant reports only the NAME of a light effect (Nanoleaf scene, WLED ...), never its colours, and the light's own colour
   is stale/white while an effect runs. So the display colour comes from the colour the user assigned to that effect, else from a colour word in its name. */
const FX_WORDS = [[/(rot|red|feuer|fire|lava)/i, [255, 40, 30]], [/(orange|sunset|sonnenunter|amber)/i, [255, 130, 20]], [/(gelb|yellow|gold|sun)/i, [255, 214, 40]],
  [/(gr[üu]n|green|forest|wald|matrix|nature)/i, [40, 220, 90]], [/(cyan|t[üu]rkis|turquoise|aqua|ocean|meer|ice|eis)/i, [35, 224, 255]], [/(blau|blue|sky|himmel|water|wasser)/i, [30, 110, 255]],
  [/(lila|violett|purple|violet|gaming)/i, [170, 80, 255]], [/(pink|rosa|magenta|love|romantic)/i, [255, 60, 160]], [/(warm|kerze|candle|cozy|gem[üu]tlich)/i, [255, 170, 80]]];
function fxRgb(name) {
  if (!name || /^(none|off|aus|keine?r?)$/i.test(name)) return null;
  const c = settings.effectColors?.[name];
  if (c && /^#[0-9a-f]{6}$/i.test(c)) return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  return FX_WORDS.find(([re]) => re.test(name))?.[1] || null;
}
const effRgb = (e) => fxRgb(e.fxc) || e.rgb;
let states = {};                   // entity_id -> { state, unit }
let customModels = [];
let lowWalls = false;
let halfCut = false;                   // half section: every wall is cut at half height, only the lower half stays
let is2d = false;                  // legacy top-down camera flag (the real 2D editor is plan2d.js)
let plan = null;                   // 2D blueprint editor
let layoutMode = '3d';             // '3d' | '2d' | 'split'
let me = { user: '', canEdit: true, room: null, view: 'all' };
let lastStateSig = '';
let tabletRoom = null;             // room name this screen is locked to (one tablet per room)
let livePopupFor = null;           // device id
let livePopupSeg = null;           // LED ring: the section that was tapped
const undoStack = [];
let saveTimer = null;

const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const floor = () => layout.floors[floorIdx];
const groundIdx = () => Math.max(0, layout.floors.findIndex((f) => f.kind !== 'basement'));   // first floor above ground
let exploded = false;                  // whole-house view with the floors pulled apart
const EXPLODE_GAP = 2.5;               // extra space between the floors above ground when pulled apart (m)
const elev = (i = floorIdx) => {
  const k = i - groundIdx();
  return k * FLOOR_H + (houseMode && exploded && k > 0 ? k * EXPLODE_GAP : 0);
};
/** how clearly the floors below the open one show: dimmed (the setting), fully (stacked) */
const belowVis = () => (settings.belowMode === 'stacked' ? 1 : settings.belowVisibility);
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
   while nothing happens. Automatic for ?kiosk, ?room and touch screens; ⚙ "Performance on this device" (kept in this
   browser) or ?perf=high / ?perf=low overrides. */
const PERF_KEY = 'fp.perf';
let perfStored = 'auto';
try { perfStored = localStorage.getItem(PERF_KEY) || 'auto'; } catch { /* no storage */ }
const perfParam = params.get('perf') || (perfStored !== 'auto' ? perfStored : null);
const LOW = perfParam ? perfParam === 'low' : !!(params.get('kiosk') || params.get('room') || matchMedia('(pointer: coarse)').matches);
document.body.classList.toggle('low', LOW);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, alpha: true, powerPreference: 'high-performance' });
renderer.localClippingEnabled = true;                      // the ground is cut open on the camera's side
renderer.setPixelRatio(perfParam === 'low' ? 1 : LOW ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 3));
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
/** empty a group and free the graphics memory of what was in it (geometry and textures). Without this every rebuild of
 *  the scene (a room or floor tapped, a state that needs a rebuild) kept the old copy on the graphics card, and tablets
 *  got slower and slower. Materials are left to the garbage collector, so their compiled shaders stay cached. */
function clearGroup(g) {
  g.traverse((o) => {
    if (o === g) return;
    o.geometry?.dispose();
    if (o.material) [].concat(o.material).forEach((m) => { for (const k of ['map', 'alphaMap', 'emissiveMap']) m[k]?.dispose?.(); });
  });
  g.clear();
}
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

function textSprite(text, { size = 30, scaleX = 2.4, scaleY = 0.6, depthTest = false, pill = false } = {}) {
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
    if (pill) {                                    // a readable badge on the device: dark pill that fits the text
      const w = Math.min(244, g.measureText(txt).width + 30);
      g.fillStyle = 'rgba(16,22,30,.82)'; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
      g.beginPath(); g.roundRect(128 - w / 2, 10, w, 44, 22); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.fillText(txt, 128, 33);
      tex.needsUpdate = true;
      return;
    }
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
  if (model.userData.ownProxy) return;                        // LED ring: one hit box per section, made by the model
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
const GROUND_COVER = new Set(['lawn', 'terrace', 'path']);   // lie flat on the ground: never over the floors of the house
function underFloors(m) {
  m.traverse((o) => { if (o.isMesh) { o.renderOrder = -0.5; [].concat(o.material).forEach((x) => { x.depthWrite = false; }); } });
}
const OUTDOOR = new Set(['picture', 'tree', 'bush', 'pool', 'lawn', 'terrace', 'path', 'fence']);   // keep their natural colours in the hologram theme
const isHolo = () => settings.theme === 'holo';

/* ---- Room lighting: each lit lamp shines from its own position, so a room is brightest near the lamp ---- */
const MAX_LIGHTS = 8;
const LIGHT_PROFILE = {                       // r = reach relative to the setting, k = strength
  light: { r: 0.85, k: 0.8 }, lamp: { r: 0.6, k: 0.6 }, orb: { r: 0.3, k: 0.4 }, strip: { r: 0.4, k: 0.4 },
  panel_tri: { r: 0.35, k: 0.4 }, panel_hex: { r: 0.35, k: 0.4 }, panel_sq: { r: 0.35, k: 0.4 }, panel_bar: { r: 0.4, k: 0.4 }, nanoleaf: { r: 0.45, k: 0.5 }, tv_led: { r: 0.55, k: 0.55 },
  ledseg: { r: 0.5, k: 0.45 },
};
/** every placed entity as its own entry: a TV's backlight and each section of an LED ring count as devices of their own (at the section's middle) */
function entityDevices(f) {
  return f.devices.flatMap((dv) => {
    if (dv.type === 'ledring') return ringSectionsWorld(dv).map((e) => ({ ...dv, id: dv.id, seg: e.i, x: e.mid[0], z: e.mid[1], len: e.len, entity: segEntity(dv, e.i), type: 'ledseg', name: `${dv.name || t('dev.ledring')} · ${e.i + 1}` }));
    return [{ ...dv }, ...(dv.ledEntity ? [{ ...dv, entity: dv.ledEntity, type: 'tv_led', panels: undefined }] : [])];
  });
}
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

/* ---- Ground: earth around the basement with lawn on top, cut open on the camera's side like a section drawing ---- */
const earthCut = new THREE.Plane(new THREE.Vector3(0, -1, 0), -1000);   // nothing cut until the camera says where
let earthInfo = null;                                                   // { cx, cz, corners ... } of the house footprint while the earth is cut
let plotLoop = null;                  // the plot outline: a drawing aid, only in edit mode
let earthLawn = false, earthGround = false, earthBox = null;                             // solid lawn is drawn / any ground is drawn (it replaces the grid)
/** outline of the house at ground level: walls (with their thickness) and rooms of the basements and the ground floor */
function houseFootprint(basementsOnly = false) {
  const polys = [];
  layout.floors.slice(0, groundIdx() + 1).filter((f) => !basementsOnly || f.kind === 'basement').forEach((f) => {
    f.walls.forEach((w) => {
      const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz);
      if (L < 1e-3) return;
      const t = (w.thickness || 0.2) / 2 + 0.01, nx = (-dz / L) * t, nz = (dx / L) * t, ex = (dx / L) * t, ez = (dz / L) * t;
      polys.push([[[w.a[0] - ex + nx, w.a[1] - ez + nz], [w.b[0] + ex + nx, w.b[1] + ez + nz], [w.b[0] + ex - nx, w.b[1] + ez - nz], [w.a[0] - ex - nx, w.a[1] - ez - nz], [w.a[0] - ex + nx, w.a[1] - ez + nz]]]);
    });
    [...f.rooms, ...(f.blocks || [])].forEach((r) => { if (r.points.length >= 3) polys.push([[...r.points.map((p) => [p[0], p[1]]), [r.points[0][0], r.points[0][1]]]]); });   // placeholder blocks are house too
  });
  if (!polys.length) return [];
  try { return polygonClipping.union(...polys).map((poly) => poly[0].slice(0, -1)); } catch { return []; }   // outer rings only
}
let soilTex = null;
function soilTexture() {                       // earth layers for the sides and the cut: topsoil, loam, clay, gravel
  if (soilTex) return soilTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const x = c.getContext('2d');
  [[0, 22, '#4f6b2e'], [22, 70, '#5a3d24'], [70, 150, '#7a5634'], [150, 210, '#8d6a44'], [210, 256, '#6e6155']].forEach(([a, b, col]) => { x.fillStyle = col; x.fillRect(0, a, 64, b - a); });
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${i % 3 ? '30,20,10' : '200,180,150'},${0.15 + (i % 5) * 0.05})`; x.fillRect((i * 37) % 64, 22 + ((i * 53) % 234), 2, 2); }
  soilTex = new THREE.CanvasTexture(c);
  soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
  soilTex.colorSpace = THREE.SRGBColorSpace;
  return soilTex;
}
function buildEarth(world, holo) {
  const foot = houseFootprint();
  if (!foot.length) return;
  const xs = foot.flat().map((p) => p[0]), zs = foot.flat().map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const all = layout.floors.flatMap((f) => [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...(f.blocks || []).flatMap((b) => b.points)]);
  const ax = all.map((p) => p[0]), az = all.map((p) => p[1]);                  // the whole house, upper floors and blocks included
  const [hx0, hx1, hz0, hz1] = [Math.min(x0, ...ax), Math.max(x1, ...ax), Math.min(z0, ...az), Math.max(z1, ...az)];
  const margin = Math.max(0.5, +settings.earthMargin || 5);                      // ⚙ "lawn around the house"

  const outline = layout.plot?.boundary?.length >= 3 ? layout.plot.boundary
    : [[hx0 - margin, hz0 - margin], [hx1 + margin, hz0 - margin], [hx1 + margin, hz1 + margin], [hx0 - margin, hz1 + margin]];
  const nb = groundIdx(), depth = nb > 0 ? nb * FLOOR_H + 0.4 : 0.4;   // without a basement: a slab of ground the house stands on
  let holes = nb > 0 ? houseFootprint(true) : foot;           // only the basement is cut out of the earth: parts without one (garage ...) stand on the ground
  if (layout.plot?.boundary?.length >= 3) {                     // a plot smaller than the house: only cut out what lies on it
    try { holes = polygonClipping.intersection(holes.map((r) => [[...r, r[0]]]), [[...outline, outline[0]]]).map((poly) => poly[0].slice(0, -1)); } catch { /* keep the house outline */ }
  }
  earthBox = [Math.min(...outline.map((p) => p[0])), Math.max(...outline.map((p) => p[0])), Math.min(...outline.map((p) => p[1])), Math.max(...outline.map((p) => p[1]))];
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  holes.forEach((ring) => shape.holes.push(new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z)))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -depth - 0.02, 0);
  const solid = settings.earth === 'solid', cut = solid && nb > 0 && houseMode, clip = cut ? [earthCut] : [];   // without a basement there is nothing to show in a cut
  const tex = soilTexture().clone(); tex.needsUpdate = true; tex.repeat.set(0.5, 1 / depth);
  const lawn = new THREE.MeshBasicMaterial({ color: holo ? 0x1d6b4a : 0x6fa858, transparent: !solid || holo, opacity: solid ? (holo ? 0.85 : 1) : 0.2, depthWrite: solid, side: THREE.DoubleSide, clippingPlanes: clip });
  const soil = new THREE.MeshBasicMaterial({ map: solid ? tex : null, color: solid ? (holo ? 0x8a6a8a : 0xffffff) : 0x6b4a2f, transparent: !solid || holo, opacity: solid ? (holo ? 0.9 : 1) : 0.22, depthWrite: solid, side: THREE.DoubleSide, clippingPlanes: clip });
  const none = new THREE.MeshBasicMaterial({ visible: false });
  const earth = new THREE.Mesh(geo, [none, soil]);              // the block: only its sides (soil); its caps are not drawn ...
  earth.renderOrder = -1;
  const top = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), lawn);   // ... the lawn on top is a mesh of its own,
  top.position.y = -0.02;                                       // so looking into the cut never shows a green bottom
  top.renderOrder = -1;
  world.add(top);
  earth.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: holo ? 0x3dffb0 : 0x7a5a38, transparent: true, opacity: holo ? 0.5 : 0.6, clippingPlanes: clip })));
  world.add(earth);
  earthLawn = solid; earthGround = true;
  if (cut) {
    const cap = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ map: tex, color: holo ? 0x8a6a8a : 0xffffff, transparent: holo, opacity: holo ? 0.9 : 1, side: THREE.DoubleSide }));
    world.add(cap);
    earthInfo = { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, corners: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], rings: [outline, ...holes], depth, cap, key: '' };
  }
  updateEarthCut();
}
/** the face of the cut: where the cut line runs through earth (inside the ground outline, outside the house), a wall of
 *  soil layers from the lawn down to the bottom of the basement, so the cut reads as a section and not as a hollow box */
function earthCapGeometry(px, pz, ux, uz, rings, depth) {
  const ts = [];
  rings.forEach((ring) => ring.forEach((a, i) => {          // where the cut line crosses an edge (even-odd over outline and house)
    const b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], den = ux * ez - uz * ex;
    if (Math.abs(den) < 1e-9) return;
    const t = ((a[0] - px) * ez - (a[1] - pz) * ex) / den, k = ((a[0] - px) * uz - (a[1] - pz) * ux) / den;
    if (k >= 0 && k < 1) ts.push(t);
  }));
  ts.sort((x, y) => x - y);
  const pos = [], uv = [], top = -0.02, bot = -depth - 0.02;
  for (let i = 0; i + 1 < ts.length; i += 2) {
    const [t0, t1] = [ts[i], ts[i + 1]], A = [px + ux * t0, pz + uz * t0], B = [px + ux * t1, pz + uz * t1];
    pos.push(A[0], bot, A[1], B[0], bot, B[1], B[0], top, B[1], A[0], bot, A[1], B[0], top, B[1], A[0], top, A[1]);
    uv.push(t0 / 2, 0, t1 / 2, 0, t1 / 2, 1, t0 / 2, 0, t1 / 2, 1, t0 / 2, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
/** the cut follows the camera: the earth in front of the facade that faces the camera is taken away, like a section drawing */
function updateEarthCut() {
  if (grid) {                                    // a drawing aid: never in live mode, under any ground only while drawing,
    grid.visible = !isLive() && !(earthGround && (houseMode || tool === 'select'));
    grid.position.y = houseMode ? 0 : elev() - 0.01;   // and on the level of the floor shown (a basement lies below ground)
  }
  if (!earthInfo) return;
  let dx = camera.position.x - earthInfo.cx, dz = camera.position.z - earthInfo.cz;
  const L = Math.hypot(dx, dz);
  if (L < 1e-3) { earthCut.set(new THREE.Vector3(0, -1, 0), -1000); earthInfo.cap.visible = false; return; }   // straight from above: nothing to cut
  if (Math.abs(dx) > Math.abs(dz)) { dx = Math.sign(dx); dz = 0; } else { dz = Math.sign(dz); dx = 0; }   // cut along the facade facing the camera
  const ext = Math.max(...earthInfo.corners.map(([x, z]) => (x - earthInfo.cx) * dx + (z - earthInfo.cz) * dz)) - 0.08;   // just inside the outer wall: the basement wall is laid bare
  const px = earthInfo.cx + dx * ext, pz = earthInfo.cz + dz * ext;
  earthCut.setFromNormalAndCoplanarPoint(new THREE.Vector3(-dx, 0, -dz), new THREE.Vector3(px, 0, pz));
  const key = `${Math.round(Math.atan2(dz, dx) * 200)}`;            // rebuild the cut face only when the view turned a little
  if (key === earthInfo.key) return;
  earthInfo.key = key;
  earthInfo.cap.geometry.dispose();
  earthInfo.cap.geometry = earthCapGeometry(px - dx * 0.01, pz - dz * 0.01, -dz, dx, earthInfo.rings, earthInfo.depth);
  earthInfo.cap.visible = true;
}

/** Turn a model into a translucent blue wireframe hologram; lit parts are remembered for state changes. */
function holoify(model, ghost) {
  const glow = new Set(model.userData.glow || []), led = new Set(model.userData.led || []);
  const meshes = [];
  model.traverse((o) => { if (o.isMesh && !o.userData.proxy && !o.userData.holo) meshes.push(o); });
  const hg = model.userData.holoGlow ||= { fill: [], edge: [] }, hl = model.userData.holoLed ||= { fill: [], edge: [] };
  const segOf = new Map();                                     // LED ring: material -> its section
  (model.userData.segs || []).forEach((sg) => { sg.holo ||= { fill: [], edge: [] }; sg.glow.forEach((m) => segOf.set(m, sg)); });
  for (const o of meshes) {
    const isGlow = glow.has(o.material), isLed = led.has(o.material), sg = segOf.get(o.material);
    o.material = new THREE.MeshBasicMaterial({ color: HOLO.fill, transparent: true, opacity: ghost ? 0.03 + 0.2 * belowVis() : (model.userData.solid ? 0.8 : 0.38), depthWrite: !!model.userData.solid && !ghost, side: model.userData.solid ? THREE.DoubleSide : THREE.FrontSide });
    o.userData.holo = true;
    const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.08 + 0.55 * belowVis() : 0.95 });
    o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), em));
    if (isGlow) { hg.fill.push(o.material); hg.edge.push(em); }
    if (isLed) { hl.fill.push(o.material); hl.edge.push(em); }
    if (sg) { sg.holo.fill.push(o.material); sg.holo.edge.push(em); }
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

const LABEL_DOMAINS = new Set(['sensor', 'binary_sensor', 'climate', 'cover']);   // "important": measured values
/** Value labels on devices: none, only the important ones (sensors, climate, covers) or every device with an entity. */
function wantsLabel(d) {
  const mode = settings.labelMode;
  if (mode === 'none' || !d.entity) return false;
  return mode === 'all' || LABEL_DOMAINS.has(d.entity.split('.')[0]);
}

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
  const b = layout.floors[i]?.roof?.box;                  // size set by hand in the roof panel
  if (b && [b.x0, b.x1, b.z0, b.z1].every(Number.isFinite) && b.x1 > b.x0 && b.z1 > b.z0) return { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 };
  return autoRoofBox(i);
}
function autoRoofBox(i) {
  // a roof terrace (an open room) has no roof, and neither has what lies below it (the garage): their walls and rooms do not count
  const zones = layout.floors.flatMap((f, fi) => f.rooms.filter((r) => r.terrace && r.points.length >= 3).map((r) => {
    const xs = r.points.map((p) => p[0]), zs = r.points.map((p) => p[1]);
    return { fi, x0: Math.min(...xs) - 0.2, x1: Math.max(...xs) + 0.2, z0: Math.min(...zs) - 0.2, z1: Math.max(...zs) + 0.2 };
  }));
  const open = (k, ps) => zones.some((z) => z.fi >= k && ps.every(([x, zz]) => x >= z.x0 && x <= z.x1 && zz >= z.z0 && zz <= z.z1));
  const pts = [];
  layout.floors.forEach((f, k) => {
    if (k >= i || f.kind === 'basement' || f.kind === 'roof') return;
    f.walls.forEach((w) => { if (!open(k, [w.a, w.b])) pts.push(w.a, w.b); });
    f.rooms.forEach((r) => { if (!r.terrace && !open(k, r.points)) pts.push(...r.points); });
  });
  if (!pts.length) return null;
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}
/** Railing round a roof terrace: posts and two rails along every edge that is not a wall */
function buildRailing(g, room, f, holo, ghost) {
  const pts = room.points, H = 1.0, step = 0.2;
  const mat = holo ? new THREE.MeshBasicMaterial({ color: 0x3df2ff, transparent: true, opacity: ghost ? 0.12 : 0.85 })
    : new THREE.MeshStandardMaterial({ color: '#8d949b', roughness: 0.45, metalness: 0.6, transparent: ghost, opacity: ghost ? 0.25 : 1 });
  const covered = (x, z) => f.walls.some((w) => {                          // a wall (also in a doorway) already closes this spot
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], l2 = dx * dx + dz * dz || 1;
    const k = Math.max(0, Math.min(1, ((x - w.a[0]) * dx + (z - w.a[1]) * dz) / l2));
    return Math.hypot(x - (w.a[0] + k * dx), z - (w.a[1] + k * dz)) < (w.thickness || 0.2) / 2 + 0.12;
  });
  const bar = (x0, z0, x1, z1, y, th) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, th, th), mat);
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    g.add(m);
  };
  const post = (x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.05), mat); m.position.set(x, H / 2, z); g.add(m); };
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], len = Math.hypot(bx - ax, bz - az);
    if (len < 0.1) continue;
    const n = Math.max(1, Math.ceil(len / step)), at = (u) => [ax + (bx - ax) * u, az + (bz - az) * u];
    let run = null;
    const flush = (end) => {
      if (!run) return;
      const [x0, z0] = at(run), [x1, z1] = at(end);
      if (Math.hypot(x1 - x0, z1 - z0) > 0.15) {
        bar(x0, z0, x1, z1, H, 0.05); bar(x0, z0, x1, z1, H * 0.5, 0.035);
        const posts = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.2));
        for (let p = 0; p <= posts; p++) post(x0 + ((x1 - x0) * p) / posts, z0 + ((z1 - z0) * p) / posts);
      }
      run = null;
    };
    for (let k = 0; k < n; k++) {
      const [mx, mz] = at((k + 0.5) / n);
      if (covered(mx, mz)) flush(k / n); else if (run === null) run = k / n;
    }
    flush(1);
  }
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
  const mats = [m.material];
  if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), em)); mats.push(em); }
  g.add(m);
  const fade = (mesh, ms) => { if (!ghost) roofs.push({ mesh, mats: ms.map((x) => ({ x, base: x.opacity, transparent: x.transparent, depthWrite: x.depthWrite })), box: null }); };
  fade(m, mats);
  (f.roof?.dormers || []).forEach((d) => {                                 // dormers (Gauben): wall, little roof and window out of one slope
    const parts = dormerParts(bb, f.roof, d);
    if (!parts) return;
    const part = (tris, material, edgeAngle) => {
      if (!tris.length) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
      geo.computeVertexNormals();
      const pm = new THREE.Mesh(geo, material), ms = [material];
      if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); pm.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, edgeAngle), em)); ms.push(em); }
      g.add(pm); fade(pm, ms);
    };
    const hm = (opacity) => new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : opacity, side: THREE.DoubleSide, depthWrite: false });
    part(parts.wall, holo ? hm(0.5) : mat('#d9d3c6', ghost, { side: THREE.DoubleSide }), 20);
    part(parts.roof, holo ? hm(0.45) : mat('#8f3b2f', ghost, { side: THREE.DoubleSide }), 20);
    part(parts.glass, new THREE.MeshBasicMaterial({ color: holo ? 0x3df2ff : 0x9fd4ff, transparent: true, opacity: ghost ? 0.2 : 0.75, side: THREE.DoubleSide, depthWrite: false }), 90);
  });
}
const roofs = [];                  // roofs that thin out when the camera comes close
function updateRoofFade() {
  for (const r of roofs) {
    if (!r.box) { r.mesh.updateWorldMatrix(true, false); r.box = new THREE.Box3().setFromObject(r.mesh); }
    const d = r.box.distanceToPoint(camera.position);
    const k = Math.max(0.12, Math.min(1, (d - 2.5) / 4.5));          // fully there beyond ~7 m, mostly gone up close
    r.mats.forEach((m) => { m.x.opacity = m.base * k; m.x.transparent = m.transparent || k < 0.999; m.x.depthWrite = m.depthWrite && k > 0.95; });
  }
}

function build() {
  wake();
  plan?.render();
  clearGroup(world);
  registry.clear(); pickables.length = 0; labelSprites.clear(); cameraCones.clear(); coneMotion.clear(); cutawayWalls = []; roofs.length = 0; roomMeshes.clear(); openingHandles.clear(); alertPulses.length = 0;
  const holo = isHolo();
  const iso = isolatedRoom();
  if (houseMode && settings.earth === 'off') {    // ground reference for the plot (with earth the lawn is the ground)
    const hb = houseBounds(), sz = Math.ceil(Math.max(hb.size * 2, 20) / 2) * 2;
    const grid = new THREE.GridHelper(sz, sz, holo ? HOLO.edge : 0x6c8a5c, holo ? 0x1a4fb8 : 0x88a878);
    grid.position.set(hb.cx, -0.03, hb.cz);
    grid.material.transparent = true; grid.material.opacity = 0.35;
    world.add(grid);
  }
  earthInfo = null; earthLawn = false; earthGround = false; plotLoop = null;
  const withEarth = settings.earth !== 'off' && (houseMode || floorIdx >= groundIdx()) && !iso;
  if (withEarth) buildEarth(world, holo);          // the house stands in the ground: lawn on top, the basement inside the earth
  if (layout.plot?.boundary?.length >= 3) {      // the plot (Grundstück): outline + a faint ground area
    const pb = layout.plot.boundary, shape = new THREE.Shape(pb.map(([x, z]) => new THREE.Vector2(x, -z)));
    const loop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pb.map(([x, z]) => new THREE.Vector3(x, withEarth ? 0.005 : (houseMode || floorIdx >= groundIdx() ? -0.035 : elev(floorIdx) - 0.035), z))), new THREE.LineBasicMaterial({ color: holo ? 0x3dffb0 : 0x3f7a35 }));
    if (!withEarth && floorIdx >= groundIdx()) {              // not while looking at the basement: this area lies at ground level, above it
      const ground = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: holo ? 0x1a8f6a : 0x6aa05a, transparent: true, opacity: holo ? 0.1 : 0.35, depthWrite: false, side: THREE.DoubleSide }));
      ground.position.y = -0.04;
      world.add(ground);
    }
    loop.visible = !isLive();
    plotLoop = loop;
    world.add(loop);
  }
  layout.floors.forEach((f, i) => {
    if (i > floorIdx && !houseMode) return;
    if (iso && i < floorIdx) return;            // no floors below while isolated
    if (!houseMode && settings.belowMode === 'hidden' && i < floorIdx) return;   // floors below hidden by choice
    const ghost = (i < floorIdx && !houseMode) || (houseMode && f.kind === 'basement' && settings.earth !== 'solid');   // with solid earth the cut shows the basement as it is
    const edgeMaterial = holo ? new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.08 + 0.55 * belowVis() : 0.95 }) : null;
    const g = new THREE.Group();
    g.position.y = elev(i);
    world.add(g);
    const holes = floorOpenings(i);
    if (f.kind === 'roof' && !iso) buildRoof(g, i, f, holo, ghost);

    f.rooms.forEach((r) => {
      if (r.points.length < 3) return;
      if (iso && !ghost && r.id !== iso.id) return;
      const shape = floorShapes(r.points, holes);                 // the room minus stairwell openings (also where they only overlap it partly)
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, holo
        ? (ghost ? roomLightMat('floor', 0.15 + 0.5 * belowVis(), true)
                 : roomLightMat('floor', floorIdx > 0 ? 1 - 0.65 * belowVis() : 1))
        : mat(r.color || '#8a7f70', ghost, { side: THREE.DoubleSide }));
      m.position.y = 0.01;
      m.receiveShadow = true;
      g.add(m);
      if (r.terrace && !lowWalls) buildRailing(g, r, f, holo, ghost);          // roof terrace: railing along the open edges
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
      if (!ghost && alertRooms.has(r.id)) {        // a warning in this room: the floor pulses red
        const pm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
        pm.position.y = 0.03; pm.renderOrder = 2;
        g.add(pm); alertPulses.push(pm.material);
      }
      if (!ghost) {
        m.userData = { kind: 'room', id: r.id };
        registry.set(r.id, m); pickables.push(m);
      }
      {
        if (r.name) {
          const c = r.points.reduce((a, p) => [a[0] + p[0] / r.points.length, a[1] + p[1] / r.points.length], [0, 0]);
          const sp = textSprite(is2d ? `${r.name} · ${imperial() ? (polyArea(r.points) * 10.7639).toFixed(0) + ' ft²' : polyArea(r.points).toFixed(1) + ' m²'}` : r.name);
          sp.position.set(c[0], 0.45, c[1]);
          if (ghost) { sp.material.transparent = true; sp.material.opacity = 0.25 + 0.5 * belowVis(); }
          g.add(sp);
        }
      }
    });

    /* floor openings drawn by hand: a rim like a wall top, so the opening reads from above */
    if (!ghost) (f.holes || []).forEach((h) => {
      if (h.points.length < 3) return;
      const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(h.points.map(([x, z]) => new THREE.Vector3(x, 0.03, z))),
        new THREE.LineBasicMaterial({ color: holo ? HOLO.edge : 0xff9f43 }));
      g.add(rim);
    });

    /* placeholder blocks: a solid mass for a floor that is not drawn */
    const shaftHoles = (f.blocks || []).length ? floorOpenings(i + 1) : [];   // stairwells and floor openings of the floor above run through the block
    if (!iso) (f.blocks || []).forEach((b) => {
      if (b.points.length < 3) return;
      const shape = floorShapes(b.points, shaftHoles);
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
      if (iso) {                                   // a focused room still shows the stair standing in it
        const hp = polyToWorld(st, stairLocal(st, FLOOR_H).hole);
        const c = hp.reduce((q, p) => [q[0] + p[0] / hp.length, q[1] + p[1] / hp.length], [0, 0]);
        if (ghost || !inIso(iso, c[0], c[1])) return;
      }
      // the stair that comes up into the floor shown is seen through its opening: drawn solid, not faded like the rest below
      const arriving = ghost && !houseMode && i === floorIdx - 1 && (st.dir || 'up') === 'up';
      const sGhost = ghost && !arriving;
      const sEdge = arriving && holo ? new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.95 }) : edgeMaterial;
      const sg = buildStair(st, holo, sGhost, sEdge);
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
        ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: ghost ? 0.04 + 0.2 * belowVis() : settings.wallOpacity, depthWrite: false, side: THREE.DoubleSide })
        : mat('#d9d4cc', ghost);
      const wg = buildWall(w, { material: wallMat, ghost, low: lowWalls, cut: halfCut && !lowWalls ? 0.5 : 0, makeMat: mat, holo, edgeMaterial });
      if (halfCut && !lowWalls) {                                // what sticks out above the cut (door leaves, window frames) is clipped off
        const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), elev(i) + (w.height || 2.6) * 0.5 + 0.001);
        wg.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.clippingPlanes = [plane]; }); });
      }
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
      const model = makeModel(d.type, (m) => { if (!ghost) addPickProxy(m); if (GROUND_COVER.has(d.type)) underFloors(m); if (holo && !OUTDOOR.has(d.type)) holoify(m, ghost); applyStates(); refreshSelHelper(); }, d);
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
      if (GROUND_COVER.has(d.type)) underFloors(model);
      model.userData.kind = 'device';
      model.userData.id = d.id;
      model.userData.ghost = ghost;
      g.add(model);
      registry.set(d.id, model);
      if (!ghost) pickables.push(model);
      if (d.type === 'camera' && !ghost && (d.fov ?? 90) > 0) {
        const cone = buildCameraCone(d);
        g.add(cone);
        cameraCones.set(d.id, { mesh: cone, d });
        pickables.push(cone);
      }
      {
        if (wantsLabel(d)) {
          const sp = textSprite('…', { size: 30, scaleX: 1.5, scaleY: 0.375, pill: true });
          sp.position.set(d.x, (d.y || 0) + 0.3 + 0.2 * (d.scale || 1), d.z);
          if (ghost) { sp.material.transparent = true; sp.material.opacity = 0.25 + 0.5 * belowVis(); }
          g.add(sp);
          labelSprites.set(d.id, sp);
        }
      }
    });
  });
  if (earthInfo) {                              // garden things at ground level are cut open with the earth, so nothing lies over the basement
    layout.floors.slice(0, groundIdx() + 1).forEach((f) => f.devices.forEach((d) => {
      if (!OUTDOOR.has(d.type) || d.type === 'picture') return;
      registry.get(d.id)?.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.clippingPlanes = [earthCut]; m.needsUpdate = true; }); });
    }));
  }
  applyStates();
  refreshSelection();
  buildNav();
  scheduleFloorThumbs();
}

const ON_STATES = new Set(['on', 'open', 'playing', 'heat', 'cool', 'heat_cool', 'unlocked', 'home']);

/** Short text for the badge on a device: "21.4 °C", "95 W", "70 %" (cover), the app on a TV ... */
function labelText(entityId) {
  const s = states[entityId];
  if (!s) return '—';
  if (s.state === 'unavailable') return t('off.unavailable');
  const dom = entityId.split('.')[0], num = parseFloat(s.state);
  const icon = { temperature: '🌡 ', humidity: '💧 ', power: '⚡ ', carbon_dioxide: 'CO₂ ', illuminance: '☀ ', battery: '🔋 ' }[s.dc] || (s.unit === 'W' ? '⚡ ' : '');
  if (dom === 'climate') return typeof s.ct === 'number' ? `🌡 ${Math.round(s.ct * 10) / 10} °C` : s.state;
  if (dom === 'cover') return typeof s.position === 'number' ? `↕ ${s.position} %` : s.state;
  if (dom === 'light') return s.state !== 'on' ? t('live.off') : s.brightness != null ? `💡 ${s.brightness} %` : t('live.on');
  if (dom === 'media_player') return s.state === 'off' ? t('live.off') : `▶ ${s.app || s.state}`;
  if (dom === 'sensor' && !isNaN(num) && /^-?[\d.]+$/.test(s.state)) return `${icon}${Math.round(num * 10) / 10}${s.unit ? ' ' + s.unit : ''}`;
  return stateText(entityId);
}
function stateText(entityId) {
  const s = states[entityId];
  if (!s) return '—';
  if (s.state === 'unavailable') return t('off.unavailable');
  return s.unit ? `${s.state} ${s.unit}` : s.state;
}

let viewMode = 'normal';           // normal | temp | humid | co2 (room colouring by sensor values)
const VIEW_STOPS = { temp: ['tempStops', '°C'], humid: ['humidStops', '%'], co2: ['co2Stops', 'ppm'] };
/* Temperature / humidity of a room: average of every matching sensor placed in it or assigned to its HA area
   (sensors with °C/°F or device_class temperature/humidity, and the current values of climate entities). */
function roomHeat(room, f) {
  const ids = new Set(entityDevices(f).filter((d) => d.entity && pointInPoly(d.x, d.z, room.points)).map((d) => d.entity));
  if (room.area) (areas.find((x) => x.id === room.area)?.entities || []).forEach((id) => ids.add(id));
  const mode = viewMode, vals = [];
  ids.forEach((id) => {
    const s = states[id];
    if (!s) return;
    const num = parseFloat(s.state);
    if (id.startsWith('climate.')) {
      const v = mode === 'temp' ? s.ct : mode === 'humid' ? s.ch : null;
      if (typeof v === 'number') vals.push(v);
    } else if (!isNaN(num) && id.startsWith('sensor.')) {
      if (mode === 'temp' && (s.unit === '°C' || s.unit === '°F' || s.dc === 'temperature')) vals.push(s.unit === '°F' ? (num - 32) * 5 / 9 : num);
      else if (mode === 'humid' && s.unit === '%' && (s.dc === 'humidity' || /feucht|humid/i.test(id))) vals.push(num);
      else if (mode === 'co2' && (s.dc === 'carbon_dioxide' || (s.unit === 'ppm' && /co2/i.test(id)))) vals.push(num);
    }
  });
  if (!vals.length) return null;
  return colorFromStops(settings[VIEW_STOPS[mode][0]], vals.reduce((x, y) => x + y) / vals.length);
}

const OPEN_HEX = 0xff4a3d;
const openingObjs = () => [...registry.values()].filter((o) => o.userData?.kind === 'opening' && o.userData.pivot);
/** which group an opening belongs to in the lists */
const openKind = (o) => (o.type === 'door' ? (o.style === 'garage' ? 'gates' : 'doors') : 'windows');
const OPEN_KINDS = ['doors', 'gates', 'windows'];
const isOpen = (entity) => !!entity && (ON_STATES.has(states[entity]?.state) || ['opening', 'closing'].includes(states[entity]?.state));   // a garage door on its way is not closed
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
  if ($('#openDialog').open) renderOpenList();
}
/** every door / window whose contact sensor reports open, with its floor and room */
function openItems() {
  const out = [];
  layout.floors.forEach((f, fi) => f.walls.forEach((w) => (w.openings || []).forEach((o) => {
    const open = openingEntities(o).filter(isOpen).length;
    if (!open) return;
    const L = wallLength(w) || 1, x = w.a[0] + ((w.b[0] - w.a[0]) * o.pos) / L, z = w.a[1] + ((w.b[1] - w.a[1]) * o.pos) / L;
    const near = f.rooms.map((r) => ({ r, d: pointInPoly(x, z, r.points) ? 0 : distToPoly(x, z, r.points) })).filter((e) => e.d < 0.4).sort((p, q) => p.d - q.d)[0];   // a door on the edge of a room belongs to it
    out.push({ floor: fi, id: o.id, kind: openKind(o), name: o.name || t(`prop.${o.type}`), room: near?.r.name || '', n: open });
  })));
  return out.sort((p, q) => OPEN_KINDS.indexOf(p.kind) - OPEN_KINDS.indexOf(q.kind) || q.floor - p.floor || p.room.localeCompare(q.room) || p.name.localeCompare(q.name));
}
function renderOpenList() {
  const ul = $('#openList'), list = openItems();
  ul.replaceChildren();
  $('#openNone').hidden = !!list.length;
  let lastKind = null;
  list.forEach((x) => {
    if (x.kind !== lastKind) { const hd = document.createElement('li'); hd.className = 'offHead'; hd.textContent = t(`ok.${x.kind}`); ul.append(hd); lastKind = x.kind; }
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button';
    const name = document.createElement('strong'); name.textContent = x.name;
    const why = document.createElement('span'); why.className = 'offWhy warn'; why.textContent = t('state.open');
    const meta = document.createElement('small');
    meta.textContent = [layout.floors[x.floor]?.name, x.room].filter(Boolean).join(' · ');
    b.append(name, why, meta);
    b.addEventListener('click', () => { $('#openDialog').close(); showOffline({ floor: x.floor, kind: 'opening', id: x.id }); });
    li.append(b); ul.append(li);
  });
}
$('#openPill').addEventListener('click', () => { renderOpenList(); $('#openDialog').showModal(); });
function animateOpenings() {
  openingObjs().forEach((obj) => {
   (obj.userData.panePivots || [obj.userData.pivot]).forEach((p) => {
    const tg = (p.userData.base ?? 0) + (p.userData.target ?? 0);          // base: the closed value (1 for a scaled garage door)
    const prop = p.userData.axis, holder = p.userData.prop === 'position' ? p.position : p.userData.prop === 'scale' ? p.scale : p.rotation, cur = holder[prop];
    if (Math.abs(tg - cur) > 0.002) holder[prop] = cur + (tg - cur) * 0.15;
    (p.userData.followers || []).forEach((fp) => { fp.rotation[fp.userData.axis] = holder[prop] * (fp.userData.dir / (p.userData.dir || 1)); });   // second leaf of a double door
   });
  });
}

/* ================= Cameras (#69): the field of view as a cone on the floor, red while there is motion ================= */
const cameraCones = new Map();             // device id -> { mesh, d }
const coneMotion = new Set();              // materials of the cones that are red (they pulse)
const CONE_RED = 0xff3a3a;
const coneColor = () => (isHolo() ? 0x3df2ff : 0x4aa8ff);
function buildCameraCone(d) {
  const fov = Math.max(10, Math.min(180, d.fov ?? 90)), range = Math.max(0.5, d.range ?? 4);
  const r = THREE.MathUtils.degToRad(d.rot || 0), half = THREE.MathUtils.degToRad(fov) / 2, n = Math.max(6, Math.round(fov / 6));
  const pts = [[0, 0]];                                             // corners relative to the camera: the cone moves with it
  for (let i = 0; i <= n; i++) { const a = r - half + (2 * half * i) / n; pts.push([Math.sin(a) * range, Math.cos(a) * range]); }   // the lens looks along local +z
  const pos = [], idx = [];
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
const cameraMotion = (d) => !!d.motionEntity && ON_STATES.has(states[d.motionEntity]?.state);
/** red and pulsing while the motion sensor of the camera reports movement */
function updateCameraCones() {
  cameraCones.forEach(({ mesh, d }) => {
    const motion = cameraMotion(d), col = motion ? CONE_RED : coneColor();
    mesh.material.color.setHex(col); mesh.userData.edge.material.color.setHex(col);
    if (motion) coneMotion.add(mesh.material); else { coneMotion.delete(mesh.material); mesh.material.opacity = 0.2; }
  });
}

/* ================= Value badges: keep them from covering each other ================= */
const _lblV = new THREE.Vector3();
/** Badges that land on top of each other on the screen (two lamps at one spot) are pushed apart, downwards one by one.
 *  Done with the sprite's anchor point (`center`), so the badge stays tied to its device. */
function declutterLabels() {
  if (settings.labelMode === 'none' || labelSprites.size < 2 || !camera.isPerspectiveCamera) return;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (W < 10) return;
  const k = H / 2 / Math.tan((camera.fov * Math.PI) / 360);          // pixels per world unit at distance 1
  const items = [];
  labelSprites.forEach((sp) => {
    if (!sp.visible || !sp.parent?.visible) return;
    sp.getWorldPosition(_lblV);
    const dist = _lblV.distanceTo(camera.position);
    _lblV.project(camera);
    if (_lblV.z >= 1 || Math.abs(_lblV.x) > 1.3 || Math.abs(_lblV.y) > 1.3) { sp.center.set(0.5, 0.5); return; }
    const ppu = k / Math.max(dist, 0.1), len = String(sp.userData.text || '').length;
    items.push({ sp, x: (_lblV.x + 1) / 2 * W, y: (1 - _lblV.y) / 2 * H, ppu,
      w: Math.min(0.95, (len * 16 + 30) / 256) * sp.scale.x * ppu, h: 0.69 * sp.scale.y * ppu, shift: 0 });
  });
  items.sort((p, q) => p.y - q.y || p.x - q.x);
  const placed = [];
  for (const it of items) {
    let moved = true, guard = 0;
    while (moved && guard++ < 12) {                                  // move down until nothing is covered any more
      moved = false;
      for (const o of placed) {
        if (Math.abs(it.x - o.x) < (it.w + o.w) / 2 && Math.abs(it.y + it.shift - (o.y + o.shift)) < (it.h + o.h) / 2) {
          it.shift = o.y + o.shift + (it.h + o.h) / 2 + 2 - it.y; moved = true;
        }
      }
    }
    placed.push(it);
    it.sp.center.set(0.5, 0.5 + it.shift / (it.sp.scale.y * it.ppu));   // anchor up = badge down
  }
}

/* ---- other floors as coloured outlines in the 2D plan: off | below (all lower floors) | all (every other floor) ---- */
const PLAN_FLOORS = ['off', 'below', 'all'];
let planFloors = 'below';
try { const v = localStorage.getItem('fp3d.planFloors'); if (PLAN_FLOORS.includes(v)) planFloors = v; } catch { /* no storage: the default stays */ }
const FLOOR_COLS = ['#ff9d2e', '#2ad0a0', '#b06aff', '#ff5e8a', '#4aa8ff', '#ffd84a', '#8fe36b'];   // one colour per floor outline
/** the floors drawn as outlines in the plan (lowest first) */
function ghostFloors() {
  if (planFloors === 'off') return [];
  return layout.floors.map((fl, i) => ({ fl, i, col: FLOOR_COLS[i % FLOOR_COLS.length], name: fl.name || `#${i + 1}` }))
    .filter(({ fl, i }) => i !== floorIdx && (planFloors === 'all' || i < floorIdx) && fl.kind !== 'roof' && fl.walls.length);
}
/** the little box in the corner of the plan: the switch and the colour legend (always visible, unlike the View menu) */
function renderPlanFloorsChip() {
  const btn = $('#planFloorsBtn'), list = $('#planFloorsList');
  if (!btn) return;
  btn.textContent = `▦ ${t('nav.planFloors')}: ${t(`nav.planFloors.${planFloors}`)}`;
  btn.classList.toggle('active', planFloors !== 'off');
  list.replaceChildren(...ghostFloors().reverse().map((g) => {
    const li = document.createElement('li');
    const sw = document.createElement('i'); sw.style.background = g.col;
    li.append(sw, document.createTextNode(g.name));
    return li;
  }));
}
function updatePlanFloorsToggle() {
  const b = $('#planFloorsToggle');
  b.textContent = `${t('nav.planFloors')}: ${t(`nav.planFloors.${planFloors}`)}`;
  b.classList.toggle('active', planFloors !== 'off');
  renderPlanFloorsChip();
}
function cyclePlanFloors() {
  planFloors = PLAN_FLOORS[(PLAN_FLOORS.indexOf(planFloors) + 1) % PLAN_FLOORS.length];
  try { localStorage.setItem('fp3d.planFloors', planFloors); } catch { /* not stored */ }
  updatePlanFloorsToggle(); plan?.render();
}
$('#planFloorsToggle').addEventListener('click', cyclePlanFloors);
$('#planFloorsBtn').addEventListener('click', cyclePlanFloors);

/* ================= Top bar: view menu (Auto, half section, pull apart, walls) and the cameras overview ================= */
const viewMenu = $('#viewMenu'), viewMenuBtn = $('#viewMenuBtn'), camMenu = $('#camMenu'), camPillBtn = $('#camPill');
$('#roomMenuBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleMenu($('#roomMenu'), $('#roomMenuBtn')); });
const dropdowns = [[viewMenu, viewMenuBtn], [camMenu, camPillBtn], [$('#roomMenu'), $('#roomMenuBtn')]];       // only one of the drop-downs is open at a time
function toggleMenu(menu, btn, open = menu.hidden) {
  dropdowns.forEach(([m, b]) => { const on = m === menu && open; m.hidden = !on; b.classList.toggle('active', on); b.setAttribute('aria-expanded', String(on)); });
  if (menu === camMenu && open) renderCamMenu();
}
const toggleViewMenu = (open) => toggleMenu(viewMenu, viewMenuBtn, open);
viewMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleViewMenu(); });
camPillBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(camMenu, camPillBtn); });
document.addEventListener('click', (e) => { dropdowns.forEach(([m, b]) => { if (!m.hidden && !m.contains(e.target) && e.target !== b) toggleMenu(m, b, false); }); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dropdowns.forEach(([m, b]) => { if (!m.hidden) toggleMenu(m, b, false); }); });

const MOTION_DC = new Set(['motion', 'occupancy', 'presence', 'moving']);
/** everything that can see or feel movement, with the room it is in: cameras (a device of type camera with a camera entity) and
 *  motion / presence sensors placed in the plan; rooms with movement first */
function cameraList() {
  const out = [];
  layout.floors.forEach((f, fi) => f.devices.forEach((d) => {
    const room = f.rooms.find((r) => pointInPoly(d.x, d.z, r.points))?.name || '';
    if (d.type === 'camera' && d.entity?.startsWith('camera.')) out.push({ kind: 'cam', d, fi, room, motion: cameraMotion(d) });
    else if (d.entity?.startsWith('binary_sensor.') && (d.type === 'presence' || MOTION_DC.has(states[d.entity]?.dc))) out.push({ kind: 'sensor', d, fi, room, motion: ON_STATES.has(states[d.entity]?.state) });
  }));
  return out.sort((p, q) => Number(q.motion) - Number(p.motion) || p.fi - q.fi || (p.d.name || '').localeCompare(q.d.name || ''));
}
/** names of the rooms where a camera sees movement (floor name when the camera hangs in no room) */
const motionPlaces = (list) => [...new Set(list.filter((x) => x.motion).map((x) => x.room || layout.floors[x.fi]?.name || ''))].filter(Boolean);
function updateCamPill() {
  const pill = $('#camPill'), list = cameraList(), places = motionPlaces(list), n = list.filter((x) => x.motion).length;
  const cams = list.filter((x) => x.kind === 'cam').length;
  pill.hidden = !list.length;
  pill.textContent = n ? (places.length === 1 ? t('cam.pillMotionIn', { room: places[0] }) : t('cam.pillMotionN', { n: places.length || n })) : cams ? t('cam.pill', { n: cams }) : t('cam.pillSensors', { n: list.length });
  pill.classList.toggle('alert', n > 0);
  pill.title = n ? places.join(', ') : t('cam.pillTip');
  if (!camMenu.hidden) renderCamMenu();
}
/** cameras grouped by room (floor name next to it, so equal room names on two floors are not mixed up); rooms with movement come first */
function renderCamMenu() {
  const grid = $('#camGrid');
  grid.replaceChildren();
  const groups = new Map();
  cameraList().forEach((c) => {
    const key = `${c.fi}:${c.room}`;
    if (!groups.has(key)) groups.set(key, { fi: c.fi, room: c.room, cams: [] });
    groups.get(key).cams.push(c);
  });
  const ordered = [...groups.values()].sort((p, q) => Number(q.cams.some((c) => c.motion)) - Number(p.cams.some((c) => c.motion)) || q.fi - p.fi || p.room.localeCompare(q.room));
  ordered.forEach((g) => {
    const alarm = g.cams.some((c) => c.motion);
    const sec = document.createElement('section'); sec.className = 'camGroup' + (alarm ? ' alert' : '');
    const hd = document.createElement('div'); hd.className = 'camGroupHead';
    const nm = document.createElement('strong'); nm.textContent = g.room || t('cam.noRoom');
    const fl = document.createElement('small'); fl.textContent = layout.floors[g.fi]?.name || '';
    hd.append(nm, fl);
    if (alarm) { const b = document.createElement('span'); b.className = 'camBadge alert'; b.textContent = t('cam.motionOn'); hd.append(b); }
    const cards = document.createElement('div'); cards.className = 'camCards';
    g.cams.forEach(({ kind, d, fi, motion }) => {
      const card = document.createElement('div'); card.className = 'camCard' + (motion ? ' alert' : '') + (kind === 'sensor' ? ' sensor' : '');
      if (kind === 'cam' && settings.cameraImages) card.append(camImage(d.entity, 'cam-big'));
      const head = document.createElement('div'); head.className = 'camHead';
      const name = document.createElement('strong'); name.textContent = `${kind === 'sensor' ? '🔔 ' : ''}${d.name || d.entity}`;
      head.append(name);
      if ((kind === 'sensor' || d.motionEntity) && !motion) { const b = document.createElement('span'); b.className = 'camBadge'; b.textContent = t('cam.motionOff'); head.append(b); }
      const row = document.createElement('div'); row.className = 'camBtns';
      const show = document.createElement('button'); show.type = 'button'; show.textContent = t('cam.show');
      show.addEventListener('click', () => { toggleMenu(camMenu, camPillBtn, false); showOffline({ floor: fi, kind: 'device', id: d.id }); });
      row.append(show, haButton(d.entity));
      card.append(head, row);
      cards.append(card);
    });
    sec.append(hd, cards);
    grid.append(sec);
  });
}

/* ================= Floor cards (whole-house view) ================= */
/* A small card floats beside every floor: rooms, lights on, windows open. A tap opens that floor. */
const floorCards = [];                                  // { el, key, pos: Vector3 }
function updateFloorCards() {
  const box = $('#floorCards');
  if (!box) return;
  if (!houseMode) { if (floorCards.length) { floorCards.length = 0; box.replaceChildren(); } return; }
  const shown = layout.floors.map((f, i) => ({ f, i })).filter(({ f }) => f.kind !== 'roof' && (f.walls.length || f.rooms.length));
  if (floorCards.length !== shown.length) { floorCards.length = 0; box.replaceChildren(); }
  shown.forEach(({ f, i }, n) => {
    let c = floorCards[n];
    if (!c) {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'floorCard';
      el.addEventListener('click', () => switchFloor(+el.dataset.floor));
      box.append(el);
      c = floorCards[n] = { el, key: '', pos: new THREE.Vector3(), corners: [] };
    }
    const pts = [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points)];
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    const [x0, x1, z0, z1, y] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), elev(i) + FLOOR_H / 2];
    c.pos.set((x0 + x1) / 2, y, (z0 + z1) / 2);                     // the card points at the middle of the floor ...
    c.corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => new THREE.Vector3(x, y, z));   // ... and keeps clear of its outline
    const lights = f.devices.filter((d) => /^light\./.test(d.entity || '') && ON_STATES.has(states[d.entity]?.state)).length;
    const windows = f.walls.reduce((a, w) => a + (w.openings || []).filter((o) => o.type === 'window' && isOpen(o.entity)).length, 0);
    const key = JSON.stringify([i, f.name, f.rooms.length, lights, windows, settings.language]);
    c.el.dataset.floor = i;
    if (key === c.key) return;
    c.key = key;
    c.el.replaceChildren();
    const h = document.createElement('b'); h.textContent = f.name; c.el.append(h);
    const sp = document.createElement('span'); sp.className = 'fcm';
    [t('fc.rooms', { n: f.rooms.length }), t('fc.lights', { n: lights }), t('fc.windows', { n: windows })].forEach((txt) => {
      const m = document.createElement('em'); m.textContent = txt; sp.append(m);
    });
    c.el.append(sp);
    const parts = [t('fc.rooms', { n: f.rooms.length }), t('fc.lights', { n: lights }), t('fc.windows', { n: windows })];   // widths are estimated, so the layout never flickers between the two forms
    c.natW = 26 + Math.max(f.name.length * 7.6, parts.join(' · ').length * 6.3);
    c.narrowW = 26 + Math.max(f.name.length * 7.6, ...parts.map((x) => x.length * 6.3));
    c.el.title = t('fc.tip', { name: f.name });
  });
}
const _cardV = new THREE.Vector3();
function placeFloorCards() {
  if (!houseMode || !floorCards.length) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w < 10 || layoutMode === '2d') { floorCards.forEach((c) => { c.el.style.display = 'none'; }); return; }             // 2D only: no 3D view, no cards
  const cr = canvas.getBoundingClientRect(), br = $('#floorCards').getBoundingClientRect();
  const ox = cr.left - br.left, oy = cr.top - br.top;                                             // 2D + 3D: the 3D view is only part of the stage
  const toScreen = (v) => { _cardV.copy(v).project(camera); return { x: (_cardV.x + 1) / 2 * w, y: (1 - _cardV.y) / 2 * h, ok: _cardV.z < 1 }; };
  // the cards stand beside the house, not over it: right of its outline, or left of it when there is no room
  let minX = Infinity, maxX = -Infinity;
  floorCards.forEach((c) => c.corners.forEach((p) => { const q = toScreen(p); if (q.ok) { minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); } }));
  const vis = [];
  floorCards.forEach((c) => {
    const q = toScreen(c.pos);
    const on = q.ok && q.y > -40 && q.y < h + 40 && isFinite(maxX);
    c.el.style.display = on ? '' : 'none';
    if (on) vis.push({ c, y: q.y });
  });
  const wide = Math.max(0, ...vis.map((v) => v.c.natW || 260)), slim = Math.max(0, ...vis.map((v) => v.c.narrowW || 150));
  const leftEdge = ox > 0 ? 8 : 150;                       // 150: keep clear of the floor rail
  const fitsRight = maxX + 16 + wide <= w - 8, fitsLeft = minX - 16 - wide >= leftEdge;
  const narrow = !fitsRight && !fitsLeft;                  // no room beside the house: shorter cards, one value per line
  floorCards.forEach((c) => c.el.classList.toggle('narrow', narrow));
  const wmax = narrow ? slim : wide;
  const right = maxX + 16 + wmax <= w - 8;
  const x = right ? maxX + 16 : Math.max(leftEdge, Math.min(minX - 16 - wmax, w - wmax - 8));
  vis.sort((p, q) => p.y - q.y);
  let free = -Infinity;                                  // floors lie close above each other on screen: push the cards apart
  vis.forEach((v) => { v.y = Math.max(v.y, free); free = v.y + (v.c.el.offsetHeight || 44) + 6; });
  const last = vis[vis.length - 1];
  const over = last ? last.y + (last.c.el.offsetHeight || 44) / 2 - (h - 64) : 0;   // keep clear of the buttons at the bottom
  const lift = over > 0 ? Math.min(over, Math.max(0, vis[0].y - (vis[0].c.el.offsetHeight || 44) / 2 - 56)) : 0;
  vis.forEach((v) => { v.c.el.style.transform = `translate(${(x + ox).toFixed(0)}px, ${(v.y - lift - (v.c.el.offsetHeight || 44) / 2 + oy).toFixed(0)}px)`; });
}

/* colour scale at the edge while a room colouring is on */
let legendKey = '';
function updateViewLegend() {
  const el = $('#viewLegend');
  if (!el) return;
  const vs = VIEW_STOPS[viewMode];
  const stops = vs && settings[vs[0]];
  const key = stops ? JSON.stringify([viewMode, stops, settings.language]) : '';
  if (key === legendKey) return;
  legendKey = key;
  el.hidden = !stops;
  if (!stops) return;
  const lo = stops[0].v, hi = stops[stops.length - 1].v, pct = (v) => (((v - lo) / (hi - lo || 1)) * 100).toFixed(1);
  const grad = stops.map((s) => `${s.c} ${pct(s.v)}%`).join(', ');
  const title = { temp: t('vm.temp'), humid: t('vm.humid'), co2: t('vm.co2') }[viewMode];
  // a vertical scale like a thermometer: high values on top, every colour stop labelled
  el.innerHTML = `<b>${title}</b><div class="lg"><i style="background:linear-gradient(0deg, ${grad})"></i><div class="lgv">${stops.map((s) => `<span style="bottom:${pct(s.v)}%">${s.v} ${vs[1]}</span>`).join('')}</div></div>`;
}
function applyStates() {
  if (plan?.isVisible()) plan.render();
  updateViewLegend();
  updateCameraCones();
  updateCamPill();
  updateFloorCards();
  updateOfflinePill();
  updateAlerts();
  if (!layout.floors[floorIdx]) return;
  applyOpenings();
  const bv = belowVis();
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
      if (obj.userData.led) {                                  // the TV's own backlight, driven by a second entity
        const lon = !!d.ledEntity && ON_STATES.has(states[d.ledEntity]?.state), lrgb = lon && Array.isArray(states[d.ledEntity]?.rgb) ? states[d.ledEntity].rgb : null;
        obj.userData.ledParts.forEach((m) => { m.visible = !!d.ledEntity; });
        obj.userData.led.forEach((m) => { m.emissive.set(lon ? (lrgb ? new THREE.Color(lrgb[0] / 255, lrgb[1] / 255, lrgb[2] / 255) : 0xffd27a) : 0x000000); m.emissiveIntensity = lon ? 1.4 : 0; });
        const hl = obj.userData.holoLed;
        if (hl) {
          hl.fill.forEach((m) => { if (lon && lrgb) m.color.setRGB(lrgb[0] / 255, lrgb[1] / 255, lrgb[2] / 255); else m.color.setHex(lon ? HOLO.on : HOLO.fill); m.opacity = lon ? 1 : 0.5; });
          hl.edge.forEach((m) => { if (lon && lrgb) m.color.setRGB(Math.min(1, lrgb[0] / 255 + 0.35), Math.min(1, lrgb[1] / 255 + 0.35), Math.min(1, lrgb[2] / 255 + 0.35)); else m.color.setHex(lon ? HOLO.onEdge : HOLO.edge); });
        }
      }
      obj.userData.segs?.forEach((sg, i) => {                 // LED ring: every section shows its own light
        const e = segEntity(d, i), son = !!e && ON_STATES.has(states[e]?.state), c = son && Array.isArray(states[e]?.rgb) ? states[e].rgb : null;
        sg.glow.forEach((m) => { m.emissive.set(son ? (c ? new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255) : 0xffd27a) : 0x000000); m.emissiveIntensity = son ? 1.4 : 0; });
        if (!sg.holo) return;
        const op = ghost ? (son ? 0.12 + 0.5 * bv : 0.03 + 0.2 * bv) : (son ? 1 : 0.45);
        sg.holo.fill.forEach((m) => { if (son && c) m.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255); else m.color.setHex(son ? HOLO.on : HOLO.fill); m.opacity = op; });
        sg.holo.edge.forEach((m) => { if (son && c) m.color.setRGB(Math.min(1, c[0] / 255 + 0.35), Math.min(1, c[1] / 255 + 0.35), Math.min(1, c[2] / 255 + 0.35)); else m.color.setHex(son ? HOLO.onEdge : HOLO.edge); });
      });
      obj.visible = !(d.hideModel && isLive()) && !(d.type === 'presence' && isLive() && d.entity && !on);      // a person who is not there is not drawn in live mode          // invisible lights (LED strips ...) still shine, they just are not drawn in live mode
      const sp = labelSprites.get(d.id);
      if (sp) { sp.visible = settings.labelMode !== 'none' && obj.visible; sp.userData.setText(labelText(d.entity), isHolo() && states[d.entity]?.unit === 'W'); }
    });
  }
  buildNav();                             // room pills show a dot while somebody is in the room
  {                                       // lit rooms: light spreads from each lamp, in the lamp's colour (hologram: tints the floor itself, other themes: a glow layer on top)
    const holo = isHolo();
    const defCol = hexVec(cssHex(settings.defaultLightColor));
    roomMeshes.forEach(({ mesh, room, wash, glow, f, ghost }) => {
      const target = holo ? mesh : glow;
      const U = target?.material.uniforms;
      if (!U) return;
      const k = ghost ? 0.3 + 0.6 * bv : 1;
      const heat = viewMode === 'normal' ? null : roomHeat(room, f);
      if (!holo) mesh.material.color.set(heat != null ? heat : (room.color || '#8a7f70'));      // solid themes: the floor itself takes the temperature / humidity colour
      const lights = heat ? [] : entityDevices(f)            // a TV's backlight and each LED ring section are lights of their own
        .filter((d) => d.entity && /^(light|switch)\./.test(d.entity) && ON_STATES.has(states[d.entity]?.state) && pointInPoly(d.x, d.z, room.points))
        .flatMap((d) => {
          const st = states[d.entity];
          const br = st.brightness != null ? 0.12 + 0.88 * st.brightness / 100 : 1;
          const c = Array.isArray(st.rgb) ? new THREE.Vector3(st.rgb[0] / 255, st.rgb[1] / 255, st.rgb[2] / 255) : defCol.clone();
          const sw = d.entity.startsWith('switch.') ? 0.6 : 1;
          const prof = LIGHT_PROFILE[d.type] || LIGHT_PROFILE.light;      // an LED strip or a panel does not light the whole room like a ceiling lamp
          const r = settings.glowRadius * (0.7 + 0.5 * br) * sw * prof.r * (d.type === 'ledseg' ? Math.min(1.6, Math.max(0.7, d.len / 2.5)) : 1);   // a long section lights more of the wall
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
  if (roomPanelFor && !document.activeElement?.matches?.('#roomPanel input, #roomPanel select')) renderRoomPanel();
}

/* ---- Offline devices: every placed entity that Home Assistant reports as unavailable (or unknown), or that does not
   exist any more (renamed / deleted), in one list that is always one tap away ---- */
const SMART_CATS = new Set(['lighting', 'smart']);   // devices that belong to an entity (furniture, garden and pictures do not)
const NOT_SMART = new Set(['tv_led', 'radiator', 'boiler']);   // a radiator or a hot-water tank is often just drawn, without an entity
const UNKNOWN_IS_FINE = new Set(['scene', 'script', 'automation', 'button', 'input_button', 'event', 'input_text', 'text', 'notify', 'tts', 'conversation']);
/** why an entity counts as offline: 'unavailable' | 'unknown' | 'missing', or null when it is fine */
function offlineReason(id) {
  const s = states[id];
  if (!s) return 'missing';
  if (s.state === 'unavailable') return 'unavailable';
  if (s.state === 'unknown' && !UNKNOWN_IS_FINE.has(id.split('.')[0])) return 'unknown';
  return null;
}
/** [{ entity, reason, since, floor, kind, id, name, room }] of every placed lamp or smart device without an entity (reason 'unlinked') and every placed device, LED ring section, TV backlight and door / window contact */
function offlineDevices() {
  if (!entities.length) return [];                     // states not loaded yet: nothing is known to be offline
  const out = [], seen = new Set();
  const add = (entity, floor, kind, id, name, x, z, f) => {
    if (!entity || seen.has(`${id}|${entity}`)) return;
    seen.add(`${id}|${entity}`);
    const reason = offlineReason(entity);
    if (!reason) return;
    const room = x == null ? null : f.rooms.find((r) => pointInPoly(x, z, r.points));
    out.push({ entity, reason, since: states[entity]?.since || null, floor, kind, id, name, room: room?.name || '' });
  };
  layout.floors.forEach((f, fi) => {
    f.devices.forEach((d) => {
      const name = d.name || entities.find((e) => e.entity_id === d.entity)?.name || t(`dev.${d.type}`);
      const smart = SMART_CATS.has(catOf(d.type)) && !NOT_SMART.has(d.type);
      if (smart && !d.entity && !(d.type === 'ledring' && ringEntities(d).length)) {   // a lamp or sensor without its Home Assistant entity
        const room = f.rooms.find((r) => pointInPoly(d.x, d.z, r.points));
        out.push({ entity: '', reason: 'unlinked', since: null, floor: fi, kind: 'device', id: d.id, name, room: room?.name || '' });
      }
      add(d.entity, fi, 'device', d.id, name, d.x, d.z, f);
      add(d.ledEntity, fi, 'device', d.id, name, d.x, d.z, f);
      if (d.type === 'ledring') ringEntities(d).forEach((e) => add(e, fi, 'device', d.id, name, d.x, d.z, f));
    });
    f.walls.forEach((w) => (w.openings || []).forEach((o) => {
      add(o.entity, fi, 'opening', o.id, o.name || t(`prop.${o.type}`), (w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2, f);
    }));
  });
  return out.sort((a, b) => a.floor - b.floor || a.room.localeCompare(b.room) || a.name.localeCompare(b.name));
}
let offlineSig = '';
function updateOfflinePill() {
  const list = offlineDevices(), pill = $('#offlinePill');
  pill.hidden = !entities.length;                     // always there once the states are known, also with nothing offline
  pill.classList.toggle('warn', list.length > 0);
  pill.classList.toggle('ok', !list.length);
  pill.textContent = list.length ? t('off.pill', { n: list.length }) : t('off.pillOk');
  const sig = JSON.stringify(list.map((x) => [x.id, x.entity, x.reason]));
  if (sig !== offlineSig) { offlineSig = sig; if ($('#offlineDialog').open) renderOfflineList(); }
}
function sinceText(iso) {
  const ms = Date.parse(iso || '');
  if (!ms) return '';
  const sec = Math.round((ms - Date.now()) / 1000), rtf = new Intl.RelativeTimeFormat(currentLanguage(), { numeric: 'auto' });
  for (const [u, n] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(sec) >= n) return rtf.format(Math.round(sec / n), u);
  return rtf.format(sec, 'second');
}
function renderOfflineList() {
  const ul = $('#offlineList'), list = offlineDevices();
  ul.replaceChildren();
  $('#offlineNone').hidden = !!list.length;
  list.forEach((x) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button';
    const name = document.createElement('strong'); name.textContent = x.name;
    const why = document.createElement('span'); why.className = `offWhy ${x.reason}`; why.textContent = t(`off.${x.reason}`);
    const meta = document.createElement('small');
    meta.textContent = [layout.floors[x.floor]?.name, x.room, x.entity, x.since ? t('off.since', { t: sinceText(x.since) }) : ''].filter(Boolean).join(' · ');
    b.append(name, why, meta);
    b.addEventListener('click', () => { $('#offlineDialog').close(); showOffline(x); });
    li.append(b); ul.append(li);
  });
}
/** go to the floor of an offline device and point it out */
function showOffline(x) {
  if (houseMode || floorIdx !== x.floor) switchFloor(x.floor);
  if (isLive()) liveSelect({ kind: x.kind, id: x.id });
  else { selection = { kind: x.kind, id: x.id }; lockedSel = true; refreshSelection(); }
}
$('#offlinePill').addEventListener('click', () => { renderOfflineList(); $('#offlineDialog').showModal(); });

/* ================= Warnings: smoke, gas, CO, water, alarm, window open in the rain (#58) ================= */
const ALERT_ICON = { smoke: '🔥', gas: '⚠️', co: '☠️', water: '💧', alarm: '🚨', rain: '🌧️' };
const alertPulses = [];                 // materials of the red room overlays, pulsed in animate()
let alerts = [], alertSig = '', alertRooms = new Set();
/** where an entity is in the plan: the floor and room of the device / window it is bound to, else the room of its HA area */
function locateEntity(id) {
  for (let fi = 0; fi < layout.floors.length; fi++) {
    const f = layout.floors[fi], roomAt = (x, z) => f.rooms.find((r) => pointInPoly(x, z, r.points))?.id || null;
    const d = f.devices.find((q) => q.entity === id || q.ledEntity === id || (q.type === 'ledring' && ringEntities(q).includes(id)));
    if (d) return { floor: fi, roomId: roomAt(d.x, d.z) };
    for (const w of f.walls) {
      const o = (w.openings || []).find((q) => openingEntities(q).includes(id));
      if (!o) continue;
      const L = wallLength(w) || 1, ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L, x = w.a[0] + ux * o.pos, z = w.a[1] + uz * o.pos;
      return { floor: fi, roomId: roomAt(x - uz * 0.3, z + ux * 0.3) || roomAt(x + uz * 0.3, z - ux * 0.3) };   // the room on either side
    }
  }
  const ar = areaOf[id];
  if (ar) for (let fi = 0; fi < layout.floors.length; fi++) { const r = layout.floors[fi].rooms.find((q) => q.area === ar); if (r) return { floor: fi, roomId: r.id }; }
  return null;
}
function updateAlerts() {
  if (!entities.length) return;
  const windows = [];
  layout.floors.forEach((f) => f.walls.forEach((w) => (w.openings || []).forEach((o) => {
    if (o.type === 'window') openingEntities(o).forEach((e) => windows.push({ entity: e, name: o.name || entities.find((x) => x.entity_id === e)?.name || t('prop.window') }));
  })));
  const list = settings.alerts === false ? [] : findAlerts(entities, windows, settings.weatherEntity).map((a) => ({ ...a, at: locateEntity(a.entity) }));
  const sig = JSON.stringify(list.map((a) => [a.kind, a.entity, a.at]));
  if (sig === alertSig) return;
  const before = new Set(alerts.map((a) => a.kind + a.entity));
  alerts = list; alertSig = sig;
  renderAlertBar();
  const rooms = new Set(list.map((a) => a.at?.roomId).filter(Boolean));
  if ([...rooms].sort().join() !== [...alertRooms].sort().join()) { alertRooms = rooms; build(); }
  const fresh = list.find((a) => !before.has(a.kind + a.entity));
  if (fresh && settings.alertJump && isLive()) jumpToAlert(fresh);
}
function renderAlertBar() {
  const bar = $('#alertBar');
  bar.replaceChildren(...alerts.map((a) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'alertItem';
    const room = a.at?.roomId && layout.floors[a.at.floor]?.rooms.find((r) => r.id === a.at.roomId)?.name;
    b.textContent = `${ALERT_ICON[a.kind] || '⚠️'} ${t(`alert.${a.kind}`)}${room ? ` · ${room}` : ''} · ${a.name}`;
    b.addEventListener('click', () => jumpToAlert(a));
    return b;
  }));
  bar.hidden = !alerts.length;
}
function jumpToAlert(a) {
  if (!a.at) return;
  if (houseMode || floorIdx !== a.at.floor) switchFloor(a.at.floor);
  if (a.at.roomId) { focusRoom(a.at.roomId); if (isLive()) openRoomPanel(a.at.roomId); }
  kioskTouched();
}

/* ================= "Where is ...?" search (#62) ================= */
let findMarker = null;                  // { mesh, until }: a ring that marks what was found
function findItems(q) {
  const out = [];
  layout.floors.forEach((f, fi) => {
    const roomOf = (x, z) => f.rooms.find((r) => pointInPoly(x, z, r.points))?.name || '';
    f.rooms.forEach((r) => { const sc = matchScore(r.name, q); if (sc) out.push({ sc: sc + 5, kind: 'room', id: r.id, floor: fi, label: r.name, sub: f.name }); });
    f.devices.forEach((d) => {
      const ent = d.entity && entities.find((e) => e.entity_id === d.entity);
      const name = d.name || ent?.name || t(`dev.${d.type}`);
      const sc = Math.max(matchScore(name, q), matchScore(ent?.name, q), matchScore(d.entity, q) * 0.8, matchScore(t(`dev.${d.type}`), q) * 0.6);
      if (sc) out.push({ sc, kind: 'device', id: d.id, floor: fi, label: name, sub: [f.name, roomOf(d.x, d.z)].filter(Boolean).join(' · '), x: d.x, y: d.y || 0, z: d.z });
    });
    f.walls.forEach((w) => (w.openings || []).forEach((o) => {
      const name = o.name || (o.entity && entities.find((e) => e.entity_id === o.entity)?.name) || '';
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
  if (houseMode || floorIdx !== it.floor) switchFloor(it.floor);
  if (it.kind === 'room') { focusRoom(it.id); if (isLive()) openRoomPanel(it.id); return; }
  if (focusedRoom) focusRoom(null);
  const target = new THREE.Vector3(it.x, elev(it.floor) + Math.min(it.y, 2.4), it.z);
  const dir = camera.position.clone().sub(controls.target).normalize();
  controls.target.copy(target);
  camera.position.copy(target).addScaledVector(dir, 5.5);
  controls.update();
  if (findMarker) { scene.remove(findMarker.mesh); findMarker.mesh.geometry.dispose(); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.46, 40), new THREE.MeshBasicMaterial({ color: 0x3df2ff, transparent: true, side: THREE.DoubleSide, depthTest: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.copy(target); ring.renderOrder = 10;
  scene.add(ring);
  findMarker = { mesh: ring, until: performance.now() + 3500 };
  if (isLive()) liveSelect({ kind: it.kind, id: it.id });
  else { selection = { kind: it.kind, id: it.id }; lockedSel = true; refreshSelection(); }
  wake();
}
$('#findBtn').addEventListener('click', () => openFind());
$('#findInput').addEventListener('input', renderFind);
$('#findInput').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') openFind(false);
  if (e.key === 'Enter') { const first = findItems($('#findInput').value)[0]; if (first) goToFound(first); }
  e.stopPropagation();                                       // typing must not trigger the editor shortcuts
});

/* ================= Wall tablet: back to the start view, screen saver, night dimming (#61) ================= */
let lastInput = Date.now(), kioskHome = true;
function kioskTouched() {
  lastInput = Date.now(); kioskHome = false;
  if (controls.autoRotate) controls.autoRotate = false;
  if (!$('#nightDim').hidden) $('#nightDim').hidden = true;
}
['pointerdown', 'keydown', 'wheel'].forEach((ev) => addEventListener(ev, kioskTouched, { passive: true, capture: true }));
function goHome() {
  closeLivePopup(); closeRoomPanel(); openFind(false);
  const hit = tabletRoom && findRoomByName(tabletRoom);
  if (hit) { switchFloor(hit.floor); focusRoom(hit.room.id); openRoomPanel(hit.room.id); }
  else { if (focusedRoom) focusRoom(null); switchFloor(groundIdx()); }
  fitCamera();
}
function kioskTick() {
  const idleMs = Date.now() - lastInput;
  if (isLive() && settings.idleReturn > 0 && idleMs > settings.idleReturn * 60000 && !kioskHome) {
    kioskHome = true;
    goHome();
    if (settings.idleOrbit) { controls.autoRotate = true; controls.autoRotateSpeed = 0.6; }
  }
  const night = isLive() && nightActive(settings.nightDim, settings.nightFrom, settings.nightTo, new Date(), states['sun.sun']?.state);
  $('#nightDim').hidden = !(night && idleMs > 60000);
}
setInterval(kioskTick, 5000);
$('#nightDim').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); kioskTouched(); });   // the first touch only wakes the screen

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
    const exists = f && [f.walls, f.rooms, f.devices, f.blocks, f.stairs, f.holes].some((l) => (l || []).some((q) => q.id === selection.id || (q.openings || []).some((o) => o.id === selection.id)));
    if (!exists) selection = null;
  }
  if (!selection) lockedSel = false;
  if (returnToTool && !selection) { const back = returnToTool; setTool(back); }   // the placed device is deselected: carry on placing
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
  if (roofs.length) updateRoofFade();
  updateEarthCut();
  if (!cutawayWalls.length) return;
  const { cx, cz } = floorBounds();
  let dx = camera.position.x - cx, dz = camera.position.z - cz;
  const horiz = Math.hypot(dx, dz);
  const steep = Math.hypot(dx, dz) < (camera.position.y - elev()) * 0.25;   // almost straight down: keep walls
  dx /= horiz || 1; dz /= horiz || 1;
  for (const c of cutawayWalls) {
    const faces = settings.cutaway && !lowWalls && !halfCut && !steep && (c.n[0] * dx + c.n[1] * dz) > 0.2;
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
  floorIdx = groundIdx(); selection = null; lockedSel = false; focusedRoom = null; houseMode = false; document.body.classList.remove('house');   // open on the ground floor, not in the basement
  clearFocusOutline(); renderHouseUi();
  build(); fitCamera(); buildNav(true); renderBgPanel(); renderFloorPanel(); renderObjList(); refreshSelection();
}
initImport({ t, lang: () => currentLanguage(), houseId: () => houseId, onImported: async (j) => {
  houses.push({ id: j.id, name: j.name });
  await switchHouse(j.id);
  setStatus(t('imp.done').replace('{name}', j.name));
} });
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
const stealth = (id) => !!floor()?.devices.find((v) => v.id === id)?.hideModel;
function pickHit(e) {
  setRay(e);
  let hits = [];
  for (const h of ray.intersectObjects(pickables, true)) {
    let o = h.object, seg = h.object.userData.seg;
    while (o && !o.userData.kind) { o = o.parent; seg ??= o?.userData.seg; }
    if (o && o.userData.cone && !isLive()) continue;                                              // the cone is only for tapping in live mode
    if (o && o.userData.kind === 'device' && isLive() && stealth(o.userData.id)) continue;      // an invisible light cannot be tapped either
    if (o) hits.push({ data: seg != null ? { ...o.userData, seg } : o.userData, point: h.point, distance: h.distance });   // seg: which LED ring section was tapped
  }
  // Walls never block a tap: a lamp behind a lowered or see-through wall is still hit. Between a device and a
  // door/window the door/window wins unless the device is clearly in front of it (> 1.2 m nearer to the camera).
  const live = isLive();
  if (live && hits.some((h) => h.data.cone)) {                 // inside a camera cone, decoration without a device behind it (carpet ...) does not take the tap
    hits = hits.filter((h) => h.data.cone || h.data.kind !== 'device' || floor().devices.find((x) => x.id === h.data.id)?.entity);
  }
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
  clearGroup(temp);
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
function endDrawing() { drawPts = []; cursor = null; openingPreview = null; clearGroup(temp); }

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
  if (deviceType === 'ledring') Object.assign(d, ringAt(x, z));     // all around the room it is placed in, just under the ceiling
  if (WALL_TYPES.has(deviceType)) snapToWall(d, 0.8);          // wall-hung things click onto the nearest wall
  return d;
}
/** LED ring along the walls of the room at (x, z), `inset` metres from the room outline; a 2 x 2 m square outside rooms */
function ringAt(x, z, inset = RING_DEFAULT_INSET) {
  const room = roomAt(x, z);
  const r = room ? ringFromRoom(room.points, inset) : { x, z, pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]], closed: true, segs: [{}, {}, {}, {}] };
  return { ...r, y: +(settings.wallHeight - 0.1).toFixed(2), inset, rot: 0, ...(room ? { room: room.id } : {}) };
}
/** the entities a double click / quick action switches: an LED ring switches all of its sections */
const deviceEntities = (d) => (d?.type === 'ledring' ? ringEntities(d) : d?.entity ? [d.entity] : []);
/* wall-hung devices: pictures, mirrors, panels, radiators ... */
const LED_LIKE = { strip: 1, tv_led: 1, nanoleaf: 1, panel_tri: 1, panel_hex: 1, panel_sq: 1, panel_bar: 1, orb: 1 };
const WALL_TYPES = new Set(['picture', 'tv_wall', 'mirror', 'walllamp', 'radiator', 'towelrad', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'tv_led', 'camera', 'thermostat', 'switch']);
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
      openingPreview = null; clearGroup(temp);
      changed();
    }
  } else if (tool === 'device' && gp) {
    snapshot();
    const [x, z] = snap(gp, true);
    const d = newDevice(x, z);
    floor().devices.push(d);
    selection = { kind: 'device', id: d.id };
    changed();
    holdPlaced();
    if (d.type === 'nanoleaf') editNano(d);
  }
});

/** a device was just placed: it stays selected and can be moved at once; the next click on empty space deselects it and placing goes on */
function holdPlaced() {
  if (tool !== 'device' || !settings.placeSelect) return;
  returnToTool = 'device'; setTool('select');
}
canvas.addEventListener('pointerleave', () => { if (tool === 'opening') { openingPreview = null; clearGroup(temp); } });

canvas.addEventListener('dblclick', (e) => {
  if (isLive()) return;
  if (tool === 'wall') { endDrawing(); return; }
  if (tool === 'room') { finishRoom(); return; }
  if (tool === 'select') {
    const h = pick(e);
    if (h?.kind !== 'device') return;
    const d = floor().devices.find((v) => v.id === h.id);
    deviceEntities(d).forEach(quickAction);
  }
});

function editNano(d) {
  openNanoEditor({ panels: d.panels, t, onSave: (panels) => { snapshot(); d.panels = panels; changed(); renderProps(); } });
}
/** size (m) of a built-in model at scale 1, measured from the model itself (null for custom GLB models) */
const dimsCache = new Map();
function baseDims(type) {
  if (isCustom(type) || type === 'nanoleaf' || type === 'ledring') return null;
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
  const list = { wall: f.walls, room: f.rooms, device: f.devices, stair: f.stairs, block: f.blocks, hole: f.holes }[kind] || [];
  return list.find((q) => q.id === id) || null;
}
function deleteItem({ kind, id }) {
  if (itemOf(kind, id)?.locked) { setStatus(t('prop.lockedHint')); return; }
  const f = floor();
  if (kind === 'wall') f.walls = f.walls.filter((x) => x.id !== id);
  if (kind === 'room') f.rooms = f.rooms.filter((x) => x.id !== id);
  if (kind === 'device') f.devices = f.devices.filter((x) => x.id !== id);
  if (kind === 'block') f.blocks = (f.blocks || []).filter((x) => x.id !== id);
  if (kind === 'hole') f.holes = (f.holes || []).filter((x) => x.id !== id);
  if (kind === 'stair') f.stairs = (f.stairs || []).filter((x) => x.id !== id);
  if (kind === 'opening') {
    const found = findOpening(id);
    if (found) found.wall.openings = found.wall.openings.filter((x) => x.id !== id);
  }
  if (selection?.id === id) selection = null;
  changed();
}

/** Arrow keys: move the selected item by (dx, dz) metres. Openings slide along their wall (left/up = towards a, right/down = towards b). */
function nudgeSelection(dx, dz) {
  if (!dx && !dz) return;
  const f = floor(), sel = selection;
  if (sel.kind === 'opening') {
    const found = findOpening(sel.id);
    if (!found || found.opening.locked) return;
    const o = found.opening;
    const p = clampOpeningPos(found.wall, o.width, o.pos + (dx || dz));
    if (p === null || p === o.pos || openingOverlaps(found.wall, p, o.width, o.id)) return;
    snapshot(); o.pos = +p.toFixed(4); changed(); return;
  }
  if (itemOf(sel.kind, sel.id)?.locked) return;
  if (sel.kind === 'device') {
    const d = f.devices.find((v) => v.id === sel.id);
    if (d) { snapshot(); moveDeviceTo(d, d.x + dx, d.z + dz); changed(); }
    return;
  }
  const shift = (q) => { q[0] = +(q[0] + dx).toFixed(4); q[1] = +(q[1] + dz).toFixed(4); };
  if (sel.kind === 'stair') {
    const st = (f.stairs || []).find((v) => v.id === sel.id);
    if (st) { snapshot(); st.x = +(st.x + dx).toFixed(4); st.z = +(st.z + dz).toFixed(4); changed(); }
    return;
  }
  let pts = null;
  if (sel.kind === 'wall') {
    const w = f.walls.find((v) => v.id === sel.id);
    if (w) {
      // like dragging in the 2D editor: walls joined at the corners stretch along
      const all = [...f.walls.flatMap((v) => [v.a, v.b]), ...f.rooms.flatMap((r) => r.points), ...(f.blocks || []).flatMap((r) => r.points)];
      const near = (p) => all.filter((q) => Math.abs(q[0] - p[0]) < 0.02 && Math.abs(q[1] - p[1]) < 0.02);
      pts = [...new Set([...near(w.a), ...near(w.b)])];
    }
  } else {
    const list = sel.kind === 'room' ? f.rooms : sel.kind === 'block' ? f.blocks : sel.kind === 'hole' ? f.holes : null;
    pts = list?.find((v) => v.id === sel.id)?.points || null;
  }
  if (pts?.length) { snapshot(); pts.forEach(shift); changed(); }
}

window.addEventListener('keydown', (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && e.key !== 'Escape') return;
  const k = e.key.toLowerCase();
  if (k === 'enter' && plan?.hasDraft() && (tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole')) { plan.finishRoom(); return; }
  if (k === 'escape') { plan?.cancel(); endDrawing(); closeLivePopup(); setStatus(''); if (bgMode) setBgMode(null); if (lockedSel) releaseLock(); return; }
  if (isLive()) return;
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); }
  else if (k === 'delete' || k === 'backspace') { if (selection) { snapshot(); deleteItem(selection); } }
  else if ((k === 'q' || k === 'e') && selection?.kind === 'stair') {
    const st = floor().stairs.find((v) => v.id === selection.id);
    if (st) { snapshot(); st.rot = ((st.rot || 0) + (k === 'q' ? -15 : 15) + 360) % 360; changed(); }
  } else if ((k === 'q' || k === 'e') && selection?.kind === 'device') {
    const d = floor().devices.find((v) => v.id === selection.id);
    if (d) { snapshot(); d.rot = ((d.rot || 0) + (k === 'q' ? -15 : 15) + 360) % 360; changed(); }
  } else if ((k === 'arrowup' || k === 'arrowdown') && !selection && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {   // nothing selected: up / down change the floor
    const i = floorIdx + (k === 'arrowup' ? 1 : -1);
    if (i >= 0 && i < layout.floors.length) { e.preventDefault(); switchFloor(i); }
  } else if (k.startsWith('arrow') && selection && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const step = e.altKey ? 0.01 : e.shiftKey ? 0.1 : settings.grid;       // Alt 1 cm, Shift 10 cm, otherwise one grid step
    nudgeSelection(k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0, k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0);
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
  if (!liveOk) setTimeout(pollStates, 400);             // with the live channel the new state arrives by itself
}
function quickAction(entityId) {
  const acts = ACTIONS[entityId.split('.')[0]];
  if (!acts) return;
  callService(entityId, acts.includes('toggle') ? 'toggle' : acts[0]);
}

function handleLiveTap(e) { liveSelect(pick(e)); }
function liveSelect(h) {
  if (h?.kind === 'device' || h?.kind === 'opening') { livePopupFor = h.id; livePopupSeg = h.seg ?? null; renderLivePopup(); }
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
  if (d.type === 'ledring') { ringPopup(box, d); return; }
  const title = document.createElement('div'); title.className = 'title'; title.textContent = d.name || '';
  const sub = document.createElement('div'); sub.className = 'sub';
  sub.textContent = d.entity ? `${d.isOpening ? openText(d.entity) : stateText(d.entity)} · ${d.entity}` : t('live.noEntity');
  const mi = detailsButton(d.entity);
  if (mi) title.append(mi);
  box.append(title, sub);
  if (d.type === 'camera') {                                  // #69: still image (renewed every few seconds), a second tap opens Home Assistant's live view
    if (d.motionEntity) { const mo = document.createElement('div'); mo.className = 'sub'; mo.textContent = cameraMotion(d) ? t('cam.motionOn') : t('cam.motionOff'); box.append(mo); }
    if (d.entity?.startsWith('camera.') && settings.cameraImages) box.append(camImage(d.entity, 'pop-cam'));
  }
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

/** small button that opens Home Assistant's own dialog for the entity (history, logbook, settings); null outside the HA frontend */
function detailsButton(entityId, compact = false) {
  if (!entityId || !canMoreInfo()) return null;
  const b = document.createElement('button'); b.type = 'button'; b.className = compact ? 'rp-more mi' : 'mi';
  b.textContent = compact ? 'ⓘ' : `ⓘ ${t('live.details')}`; b.title = t('live.detailsHint');
  b.addEventListener('click', (ev) => { ev.stopPropagation(); openMoreInfo(entityId); });
  return b;
}
/** LED ring in live mode: one button per section, the tapped section's own controls, then the whole ring */
function ringPopup(box, d) {
  const n = ringCount(d), all = ringEntities(d), isOnE = (e) => !!e && ON_STATES.has(states[e]?.state);
  const div = (cls, txt) => { const x = document.createElement('div'); x.className = cls; if (txt != null) x.textContent = txt; return x; };
  const on = Array.from({ length: n }, (_, i) => isOnE(segEntity(d, i))).filter(Boolean).length;
  const title = div('title', d.name || t('dev.ledring')), mi = detailsButton(d.entity);
  if (mi) title.append(mi);
  box.append(title, div('sub', all.length ? t('ring.summary', { on, n }) : t('live.noEntity')));
  if (!all.length) return;
  const row = div('actions ringSegs');
  for (let i = 0; i < n; i++) {
    const e = segEntity(d, i), b = document.createElement('button');
    b.textContent = String(i + 1); b.title = e || t('live.noEntity');
    b.classList.toggle('on', isOnE(e)); b.classList.toggle('sel', livePopupSeg === i);
    const c = isOnE(e) ? (Array.isArray(states[e]?.rgb) ? states[e].rgb : [255, 210, 122]) : null;
    if (c) b.style.setProperty('--seg', `rgb(${c[0]},${c[1]},${c[2]})`);      // a lit section shows its colour
    b.disabled = !e;
    b.addEventListener('click', () => { livePopupSeg = livePopupSeg === i ? null : i; renderLivePopup(); });
    row.append(b);
  }
  box.append(row);
  const e = livePopupSeg != null && livePopupSeg < n ? segEntity(d, livePopupSeg) : '';
  if (e) {
    const h = document.createElement('h4'); h.textContent = t('ring.section', { n: livePopupSeg + 1 });
    const r = div('actions');
    [['turn_on', 'live.on'], ['turn_off', 'live.off']].forEach(([svc, k]) => {
      const b = document.createElement('button'); b.textContent = t(k);
      b.addEventListener('click', () => callService(e, svc));
      r.append(b);
    });
    const smi = detailsButton(e);
    if (smi) h.append(smi);
    box.append(h, div('sub', `${stateText(e)} · ${e}`), r);
    if (e.startsWith('light.')) box.append(lightControls([e]));
  }
  if (all.length > 1 || !e) {
    const h = document.createElement('h4'); h.textContent = t('ring.whole');
    const r = div('actions');
    [['turn_on', 'live.allOn'], ['turn_off', 'live.allOff']].forEach(([svc, k]) => {
      const b = document.createElement('button'); b.textContent = t(k);
      b.addEventListener('click', () => all.forEach((id) => callService(id, svc)));
      r.append(b);
    });
    box.append(h, r);
    const lights = all.filter((id) => id.startsWith('light.'));
    if (lights.length) box.append(lightControls(lights));
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
    if (list.length === 1 && st.fxc && fx.includes(st.fxc) && me.canEdit) {          // what the effect looks like is not known to HA: let the editor say
      const row = document.createElement('div'); row.className = 'actions';
      const cp = document.createElement('input'); cp.type = 'color'; cp.className = 'sw-pick'; cp.title = t('live.fxColorHint');
      cp.value = Array.isArray(st.rgb) ? rgbToHex(st.rgb) : '#aa50ff';
      cp.addEventListener('change', () => { settings.effectColors = { ...(settings.effectColors || {}), [st.fxc]: cp.value }; saveEffectColors(); });
      const rs = document.createElement('button'); rs.textContent = '↺'; rs.title = t('live.fxColorReset');
      rs.addEventListener('click', () => { const c = { ...(settings.effectColors || {}) }; delete c[st.fxc]; settings.effectColors = c; saveEffectColors(); });
      const tx = document.createElement('span'); tx.className = 'sub'; tx.textContent = t('live.fxColor').replace('{fx}', st.fxc);
      row.append(cp, rs, tx); wrap.append(row);
    }
  }
  return wrap;
}

async function saveEffectColors() {
  Object.values(states).forEach((v) => { v.rgb = fxRgb(v.fxc) || v.rgbRaw; });
  applyStates();
  try {
    const r = await fetch('api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(settingsEtag ? { 'If-Match': settingsEtag } : {}) }, body: JSON.stringify(settings) });
    if (r.ok) { settingsEtag = r.headers.get('ETag'); }
    else if (r.status === 409) { alert(t('set.changedElsewhere')); location.reload(); }
  } catch { /* offline */ }
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
  const ids = new Set(entityDevices(f).filter((d) => d.entity?.startsWith(`${domain}.`) && pointInPoly(d.x, d.z, room.points)).map((d) => d.entity));
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
const RP_GROUPS = [['light', 'rp.light'], ['cover', 'rp.cover'], ['climate', 'rp.climate'], ['media_player', 'rp.media'], ['switch', 'rp.switch'], ['camera', 'rp.camera'], ['sensor', 'rp.sensor'], ['scene', 'rp.scene']];
const rpGroupOf = (dom) => (dom === 'binary_sensor' ? 'sensor' : dom === 'fan' || dom === 'input_boolean' ? 'switch' : dom === 'script' ? 'scene' : dom);

/* ---- Camera still images (#67, #69): fetched through the add-on, renewed every few seconds while one is on the screen ---- */
const camUrls = new Map();                 // entity -> object URL of the latest still image
let camTimer = 0;
/** Home Assistant's own dialog for the entity (live view of a camera, history ...); only possible inside the Home Assistant frontend */
function openInHa(entityId) { if (!openMoreInfo(entityId)) setStatus(t('cam.haOnly')); }
function haButton(entityId) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'haBtn'; b.textContent = `ⓘ ${t('cam.openHa')}`; b.title = entityId;
  b.addEventListener('click', () => openInHa(entityId));
  return b;
}
function camImage(entityId, cls = 'rp-cam') {
  const img = document.createElement('img'); img.className = cls; img.dataset.cam = entityId; img.alt = '';
  if (camUrls.has(entityId)) img.src = camUrls.get(entityId);
  ensureCamTimer(); refreshCamera(entityId, true);
  img.classList.add('tap'); img.title = t('cam.openHa'); img.addEventListener('click', () => openInHa(entityId));   // a second tap: Home Assistant's live view
  return img;
}
async function refreshCamera(id, onlyIfMissing = false) {
  if (onlyIfMissing && camUrls.has(id)) return;
  if (!settings.cameraImages) return;
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
function ensureCamTimer() {
  if (camTimer) return;
  camTimer = setInterval(() => {
    const ids = [...new Set([...document.querySelectorAll('img[data-cam]')].map((im) => im.dataset.cam))];
    if (!ids.length) { clearInterval(camTimer); camTimer = 0; return; }
    if (!document.hidden) ids.forEach((id) => refreshCamera(id));
  }, 5000);
}
/** the text on a row of the room panel */
function rpValue(id) {
  const s = states[id], dom = id.split('.')[0];
  if (dom === 'climate' && s && typeof s.ct === 'number') return `🌡 ${Math.round(s.ct * 10) / 10} °C · ${s.state}`;
  return stateText(id);
}

function roomOpenings(room, f) {
  const out = [];
  f.walls.forEach((w) => (w.openings || []).forEach((o) => {
    const L = wallLength(w) || 1, k = o.pos / L;
    if (distToPoly(w.a[0] + (w.b[0] - w.a[0]) * k, w.a[1] + (w.b[1] - w.a[1]) * k, room.points) < 0.35) out.push(o);
  }));
  return out;
}
/** doors / windows on the room's walls with their span in floor coordinates (for automatic placement) */
function roomOpeningSpans(room, f) {
  return f.walls.flatMap((w) => {
    const L = wallLength(w) || 1, ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L;
    return (w.openings || []).filter((o) => roomOpenings(room, f).includes(o)).map((o) => ({
      id: o.id, type: o.type, entity: o.entity || '',
      a: [w.a[0] + ux * (o.pos - o.width / 2), w.a[1] + uz * (o.pos - o.width / 2)], b: [w.a[0] + ux * (o.pos + o.width / 2), w.a[1] + uz * (o.pos + o.width / 2)],
    }));
  });
}
const entityInfo = (id) => entities.find((e) => e.entity_id === id) || { entity_id: id, domain: id.split('.')[0] };
/** put the given entities into the room where they belong (see autoplace.js); one undo step; returns the plan */
function autoPlace(room, ids) {
  const f = floor();
  const existing = f.devices.filter((d) => pointInPoly(d.x, d.z, room.points)).map((d) => ({
    x: d.x, z: d.z, layer: WALL_TYPES.has(d.type) || d.type === 'sensor' ? 'wall' : (d.y || 0) > 1.8 ? 'ceiling' : 'floor',
  }));
  const plan = planPlacement(room, ids.map(entityInfo), { openings: roomOpeningSpans(room, f), existing, wallHeight: settings.wallHeight });
  if (!plan.devices.length && !plan.openings.length) return plan;
  snapshot();
  plan.devices.forEach((p) => {
    const d = { id: uid(), type: p.type, x: p.x, z: p.z, y: p.y ?? DEVICE_TYPES[p.type]?.y ?? 0, rot: p.rot || 0, scale: 1, name: entityInfo(p.entity).name || p.entity, entity: p.entity };
    if (p.wall && WALL_TYPES.has(d.type)) snapToWall(d, 0.6, true);       // flat onto the wall face
    f.devices.push(d);
    p.id = d.id;
  });
  plan.openings.forEach((o) => { const fo = findOpening(o.id); if (fo) fo.opening.entity = o.entity; });
  changed();
  return plan;
}
function closeRoomPanel() { roomPanelFor = null; $('#roomPanel').hidden = true; }
const rpOpenCtl = new Set();               // lights whose colour / effect / scene controls are unfolded in the room panel
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
  const seen = new Set();                                    // one row per entity (an LED ring's sections may share one light)
  const devs = entityDevices(floor()).filter((d) => d.entity && pointInPoly(d.x, d.z, room.points) && !seen.has(d.entity) && seen.add(d.entity));
  const placedIds = new Set(entityDevices(floor()).map((d) => d.entity));
  const inRp = (id) => RP_GROUPS.some(([g]) => g === rpGroupOf(id.split('.')[0]));
  const extra = (room.area ? areas.find((x) => x.id === room.area)?.entities || [] : [])
    .filter((id) => !placedIds.has(id) && states[id] && inRp(id))
    .map((id) => ({ entity: id, name: entities.find((e) => e.entity_id === id)?.name || id }));
  devs.push(...extra);
  RP_GROUPS.forEach(([group, key]) => {
    const list = devs.filter((d) => rpGroupOf(d.entity.split('.')[0]) === group);
    if (!list.length) return;
    const h = document.createElement('h4'); h.textContent = t(key); box.append(h);
    if (group === 'light') {                                   // all lights of the room off in one tap
      const on = list.filter((d) => ON_STATES.has(states[d.entity]?.state));
      if (on.length) {
        const off = document.createElement('button'); off.type = 'button'; off.className = 'rp-alloff'; off.textContent = t('rp.allOff');
        off.addEventListener('click', () => on.forEach((d) => callService(d.entity, 'turn_off')));
        h.append(off);
      }
    }
    list.forEach((d) => {
      const dom = d.entity.split('.')[0], st = states[d.entity];
      const row = document.createElement('div');
      row.className = 'row' + (st && ON_STATES.has(st.state) ? ' on' : '');
      const n = document.createElement('span'); n.className = 'n'; n.textContent = d.name || d.entity;
      const v = document.createElement('span'); v.className = 'v'; v.textContent = rpValue(d.entity);
      row.append(n, v);
      if (ACTIONS[dom] && dom !== 'cover') {
        if (ACTIONS[dom].includes('toggle') && dom !== 'scene' && dom !== 'script') {          // a slide switch like on a phone
          const sw = document.createElement('label'); sw.className = 'sw'; sw.title = t('live.toggle');
          const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!st && ON_STATES.has(st.state);
          cb.addEventListener('change', () => callService(d.entity, cb.checked ? 'turn_on' : 'turn_off'));
          sw.append(cb, document.createElement('span'));
          row.append(sw);
        } else {
          const b = document.createElement('button');
          b.textContent = dom === 'scene' || dom === 'script' ? t('live.activate') : t('live.toggle');
          b.addEventListener('click', () => quickAction(d.entity));
          row.append(b);
        }
      }
      if (dom === 'camera' && settings.cameraImages) row.append(camImage(d.entity));
      const slider = (val, onChange) => {
        const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 100; r.value = val ?? 0;
        r.addEventListener('change', () => onChange(+r.value));
        row.append(r);
      };
      const rmi = detailsButton(d.entity, true);
      if (rmi) row.append(rmi);
      if (dom === 'light') {                   // colours, effects and scenes right here: overlapping models are hard to tap in 3D
        const open = rpOpenCtl.has(d.entity);
        const tb = document.createElement('button'); tb.className = 'rp-more' + (open ? ' on' : ''); tb.textContent = '🎨'; tb.title = t('rp.lightMore');
        tb.addEventListener('click', () => { open ? rpOpenCtl.delete(d.entity) : rpOpenCtl.add(d.entity); renderRoomPanel(); });
        row.append(tb);
        if (open) {
          const ctl = document.createElement('div'); ctl.className = 'rp-ctl';
          ctl.append(lightControls([d.entity]));
          const sc = sceneButtons(scenesWith([d.entity]), 'live.sceneWith'); if (sc) ctl.append(sc);
          row.append(ctl);
        }
      }
      if (dom === 'light' && st?.brightness != null && !rpOpenCtl.has(d.entity)) slider(st.brightness, (p) => callService(d.entity, 'turn_on', { brightness_pct: p }));
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
  OPEN_KINDS.forEach((kind) => {                             // doors, gates (garage door ...) and windows, each under its own heading
    const list = ops.filter((o) => openKind(o) === kind);
    if (!list.length) return;
    const h = document.createElement('h4'); h.textContent = t(`rp.${kind}`); box.append(h);
    list.forEach((o) => {
      const multi = o.paneEntities?.some(Boolean);
      const count = multi ? (o.style === 'triple' ? 3 : 2) : 1;
      for (let i = 0; i < count; i++) {
        const e = multi ? paneEntity(o, i) : o.entity;
        if (!e) continue;
        const row = document.createElement('div');
        row.className = 'row' + (isOpen(e) ? ' alert' : '');
        const n = document.createElement('span'); n.className = 'n'; n.textContent = (o.name || t(`prop.${o.type}`)) + (multi ? ` · ${t('pane.n', { n: i + 1 })}` : '');
        const v = document.createElement('span'); v.className = 'v'; v.textContent = openText(e);
        row.append(n, v);
        if (e.startsWith('cover.')) {                          // a garage door or shutter-like opening can be driven from here
          ['open_cover', 'stop_cover', 'close_cover'].forEach((act) => {
            const b = document.createElement('button'); b.textContent = t(ACTION_LABEL[act]);
            b.addEventListener('click', () => callService(e, act)); row.append(b);
          });
        }
        box.append(row);
      }
    });
  });
  if (!devs.length && !ops.length) { const e = document.createElement('div'); e.className = 'sub'; e.textContent = t('rp.empty'); box.append(e); }
}
function openRoomPanel(id) { roomPanelFor = id; closeLivePopup(); renderRoomPanel(); }

/* ================= Tools, views, mode ================= */
function setTool(next) {
  if (next !== 'select') { lockedSel = false; returnToTool = null; }
  tool = next; endDrawing(); plan?.reset(); document.body.dataset.tool = next; setStatus('');
  if (bgMode) setBgMode(null);
  document.querySelectorAll('#tools button').forEach((b) => b.classList.toggle('active', b.dataset.tool === next));
  $('#hintText').textContent = t(`hint.${next}`);
  $('#devicePalette').hidden = !(next === 'device' || (next === 'select' && returnToTool === 'device'));   // the palette stays while a just placed device is selected
  $('#openingPalette').hidden = next !== 'opening';
  $('#stairPalette').hidden = next !== 'stairs';
  $('#blockPalette').hidden = next !== 'block';
  $('#plotPalette').hidden = next !== 'plot';
  if ((next === 'block' || next === 'stairs' || next === 'plot' || next === 'hole') && !isLive() && plan && !plan.isVisible()) $('#viewSplit').click();   // drawn in the 2D plan
  canvas.style.cursor = next === 'select' ? 'default' : 'crosshair';
}
document.querySelectorAll('#tools button[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
/** tool bar button "Dormers": jump to the roof floor and open its dormer section (creates the roof floor when there is none) */
$('#dormerBtn').addEventListener('click', () => {
  let i = layout.floors.findIndex((f) => f.kind === 'roof');
  if (i < 0) { addFloorOf('roof'); i = layout.floors.findIndex((f) => f.kind === 'roof'); }
  if (i < 0) return;                                        // the name prompt was cancelled
  if (floorIdx !== i) switchFloor(i);
  $('#floorPanel').open = true;
  renderFloorPanel();
  ($('#dormerHead') || $('#floorPanel')).scrollIntoView({ block: 'start', behavior: 'smooth' });
});
$('#importBtn').addEventListener('click', () => $('#importOpen').click());
const toolbarUi = initToolbar({ t });

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
  if (plotLoop) plotLoop.visible = !isLive();
  applyViewPolicy();
  applyStates();
  requestAnimationFrame(resize);
}
document.querySelectorAll('#modeSwitch button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

function floorBounds() {
  const f = floor();
  const iso = isolatedRoom();
  const pts = iso ? iso.points : [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...f.devices.map((d) => [d.x, d.z])];
  const rb = !iso && f.kind === 'roof' ? roofBox(floorIdx) : null;   // a roof has no walls of its own: frame the house below it
  if (rb) pts.push([rb.x0, rb.z0], [rb.x1, rb.z1]);
  if (!pts.length) return houseBounds();
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
  const span = houseMode ? Math.max(size, elev(layout.floors.length - 1) - elev(0) + FLOOR_H) : size;   // pulled-apart floors are tall
  const dist = (span * 1.25 + 2) * Math.max(1, 1.0 / (camera.aspect || 1));
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
$('#halfToggle').addEventListener('click', () => { halfCut = !halfCut; updateNavToggles(); build(); });
function updateNavToggles() {
  updatePlanFloorsToggle();
  $('#halfToggle').classList.toggle('active', halfCut);
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
/** somebody is in this room: a person / presence device inside it reports home or on */
const occupied = (room, f) => f.devices.some((d) => d.type === 'presence' && d.entity && ON_STATES.has(states[d.entity]?.state) && pointInPoly(d.x, d.z, room.points));
const focusGroup = new THREE.Group();
scene.add(focusGroup);

function pill(label, active, onClick, title = '', extra = '') {
  const b = document.createElement('button');
  b.className = 'pill' + (active ? ' active' : '') + extra;
  b.textContent = label;
  if (title) b.title = title;
  b.addEventListener('click', onClick);
  return b;
}

function buildNav(force = false) {
  const f = floor();
  if (!f) return;
  // whole-house view: the rooms of every floor (top floor first), a tap opens that floor and the room
  const entries = houseMode
    ? layout.floors.map((fl, fi) => ({ fl, fi })).reverse().flatMap(({ fl, fi }) => fl.rooms.filter((r) => r.name).map((r) => ({ r, fl, fi })))
    : f.rooms.filter((r) => r.name).map((r) => ({ r, fl: f, fi: floorIdx }));
  const rooms = entries.map((e) => e.r);
  const key = JSON.stringify([houseMode, floorIdx, layout.floors.map((x) => x.kind), layout.floors.map((x) => x.name), entries.map(({ r, fl }) => [r.id, r.name, occupied(r, fl)]), focusedRoom, settings.language]);
  if (!force && key === navKey) return;
  navKey = key;
  const fp = $('#floorPills'), rp = $('#roomPills');
  fp.replaceChildren(...layout.floors.map((x, i) => pill(x.name, i === floorIdx && !houseMode, () => switchFloor(i))),
    ...(layout.floors.length > 1 || layout.floors.some((x) => x.devices.length) ? [pill(t('nav.house'), houseMode, () => setHouseMode(!houseMode), t('nav.houseTip'))] : []));
  // the rooms are one drop-down instead of a row of buttons (a long row has to be scrolled on a tablet)
  const btn = $('#roomMenuBtn'), menu = $('#roomMenu');
  const focusedName = entries.find((e) => e.r.id === focusedRoom)?.r.name;
  btn.hidden = !entries.length;
  btn.textContent = focusedName || t('nav.rooms');
  btn.classList.toggle('active', !!focusedName);
  btn.classList.toggle('occupied', entries.some(({ r, fl }) => occupied(r, fl)));
  const items = [];
  if (focusedRoom) items.push(pill(t('nav.allRooms'), false, () => { toggleMenu(menu, btn, false); focusRoom(null); closeRoomPanel(); }, '', ' all'));
  let lastFloor = null;
  entries.forEach(({ r, fl, fi }) => {
    if (houseMode && fl !== lastFloor) { const hd = document.createElement('div'); hd.className = 'rmHead'; hd.textContent = fl.name; items.push(hd); lastFloor = fl; }
    items.push(pill(r.name, r.id === focusedRoom, () => {
      toggleMenu(menu, btn, false);
      if (houseMode) { switchFloor(fi); focusRoom(r.id); openRoomPanel(r.id); return; }
      const off = r.id === focusedRoom; focusRoom(off ? null : r.id); if (off) closeRoomPanel(); else openRoomPanel(r.id);
    }, occupied(r, fl) ? t('nav.occupied') : '', occupied(r, fl) ? ' occupied' : ''));
  });
  menu.replaceChildren(...items);
  $('#navSep').hidden = !rooms.length;
  buildFloorRail();
  renderPlanFloorsChip();
  updateHouseToggle();
}

/* ================= Floor rail: side bar with a thumbnail per floor ================= */
const railThumbs = [];                                   // { cv, i }
let thumbTimer = 0;
function buildFloorRail() {
  const rail = $('#floorRail');
  if (!rail) return;
  railThumbs.length = 0;
  const mk = (cls, label, onClick, title = '') => {
    const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.title = title; b.addEventListener('click', onClick);
    const sp = document.createElement('span'); sp.textContent = label; b.append(sp);
    return b;
  };
  const items = [];
  if (layout.floors.length > 1 || layout.floors.some((x) => x.devices.length)) {
    const h = mk('railHouse' + (houseMode ? ' active' : ''), t('nav.house'), () => setHouseMode(!houseMode), t('nav.houseTip'));
    h.prepend(document.createTextNode('⌂ '));
    items.push(h);
  }
  for (let i = layout.floors.length - 1; i >= 0; i--) {   // top floor first, like the building
    const b = mk('floorThumb' + (i === floorIdx && !houseMode ? ' active' : ''), layout.floors[i].name, () => switchFloor(i));
    b.dataset.floor = i;
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 130;
    b.prepend(cv);
    railThumbs.push({ cv, i });
    items.push(b);
  }
  rail.replaceChildren(...items);
  drawFloorThumbs();
}
/** redraw the thumbnails shortly after the layout changed (not on every drag step) */
function scheduleFloorThumbs() {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(drawFloorThumbs, 250);
}
function drawFloorThumbs() {
  if (!railThumbs.length) return;
  const holo = isHolo();
  const ISO = (x, z, h) => [(x - z) * 0.866, (x + z) * 0.5 - h];
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3df2ff';
  const shade = (hex, k) => {                                 // multiply a #rrggbb colour by k
    const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return hex || '#888';
    const v = parseInt(m[1], 16);
    const c = (sh) => Math.max(0, Math.min(255, Math.round(((v >> sh) & 255) * k)));
    return `rgb(${c(16)},${c(8)},${c(0)})`;
  };
  railThumbs.forEach(({ cv, i }) => {
    const f = layout.floors[i], ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const rb = f.kind === 'roof' ? roofBox(i) : null;
    const pts = rb ? [[rb.x0, rb.z0], [rb.x1, rb.z1], [rb.x0, rb.z1], [rb.x1, rb.z0]] : [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points)];
    if (!pts.length) return;
    const hMax = rb ? 1.8 : Math.max(settings.wallHeight || 2.6, ...f.walls.map((w) => w.height || 0));
    const proj = pts.flatMap(([x, z]) => [ISO(x, z, 0), ISO(x, z, hMax)]);
    const us = proj.map((p) => p[0]), vs = proj.map((p) => p[1]);
    const [u0, u1, v0, v1] = [Math.min(...us), Math.max(...us), Math.min(...vs), Math.max(...vs)];
    const k = Math.min((W * 0.86) / Math.max(u1 - u0, 1), (H * 0.62) / Math.max(v1 - v0, 1));   // every floor fills its picture
    const P = (x, z, h) => { const [u, v] = ISO(x, z, h); return [W / 2 + (u - (u0 + u1) / 2) * k, H * 0.4 + (v - (v0 + v1) / 2) * k]; };
    const poly = (q, fill, stroke) => {
      ctx.beginPath(); q.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.stroke(); }
    };
    if (rb) {                                               // roof: two slopes and the gable ends over the footprint of the house
      const m = (rb.z0 + rb.z1) / 2, hr = Math.min(1.8, Math.max(0.8, (rb.z1 - rb.z0) * 0.25));
      const r0 = P(rb.x0, m, hr), r1 = P(rb.x1, m, hr);
      const c00 = P(rb.x0, rb.z0, 0), c10 = P(rb.x1, rb.z0, 0), c01 = P(rb.x0, rb.z1, 0), c11 = P(rb.x1, rb.z1, 0);
      poly([c00, c10, r1, r0], holo ? null : '#8c4234', holo ? accent : null);
      poly([c01, c11, r1, r0], holo ? null : '#a8503f', holo ? accent : null);
      poly([c10, c11, r1], holo ? null : '#6f332a', holo ? accent : null);
      return;
    }
    f.rooms.forEach((r) => poly(r.points.map(([x, z]) => P(x, z, 0)), holo ? accent + '30' : r.color || '#8a7f70', holo ? accent : 'rgba(0,0,0,.25)'));
    const base = '#d9d4cc';
    [...f.walls].sort((p, q) => (p.a[0] + p.a[1] + p.b[0] + p.b[1]) - (q.a[0] + q.a[1] + q.b[0] + q.b[1])).forEach((w) => {
      const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      if (len < 0.01) return;
      const h = w.height || 2.6, t = w.thickness || 0.2;
      const d = [(w.b[0] - w.a[0]) / len, (w.b[1] - w.a[1]) / len];
      let n = [-d[1], d[0]];
      if (n[0] + n[1] < 0) n = [-n[0], -n[1]];             // the side that faces the viewer
      const o = [n[0] * t / 2, n[1] * t / 2];
      const A = [w.a[0] + o[0], w.a[1] + o[1]], B = [w.b[0] + o[0], w.b[1] + o[1]];
      const k0 = Math.abs(n[0]) > Math.abs(n[1]) ? 0.74 : 0.92;       // the side facing +x is in the shade
      if (holo) { poly([P(...A, 0), P(...B, 0), P(...B, h), P(...A, h)], accent + '22', accent); return; }
      poly([P(...A, 0), P(...B, 0), P(...B, h), P(...A, h)], shade(base, k0));
      (w.openings || []).forEach((op) => {
        const u0o = op.pos - op.width / 2, u1o = op.pos + op.width / 2, y0 = op.sill || 0, y1 = Math.min(h, y0 + op.height);
        const at = (u, y) => P(A[0] + d[0] * u, A[1] + d[1] * u, y);
        const col = op.type === 'window' ? '#9cc9ee' : (op.style === 'open' || op.style === 'gap') ? '#3a3632' : '#8a6a48';
        poly([at(u0o, y0), at(u1o, y0), at(u1o, y1), at(u0o, y1)], shade(col, k0 > 0.8 ? 1 : 0.85), 'rgba(255,255,255,.55)');
      });
      poly([P(w.a[0] - o[0], w.a[1] - o[1], h), P(w.b[0] - o[0], w.b[1] - o[1], h), P(...B, h), P(...A, h)], shade(base, 1.08));
    });
  });
}

/* the pills over the scene scroll sideways when they do not fit (tablets): arrows at the ends, the mouse wheel scrolls too */
const navBar = $('#navBar');
function updateNavArrows() {
  const max = navBar.scrollWidth - navBar.clientWidth;
  $('#navLeft').hidden = navBar.scrollLeft <= 2;
  $('#navRight').hidden = navBar.scrollLeft >= max - 2;
}
navBar.addEventListener('scroll', updateNavArrows, { passive: true });
new ResizeObserver(updateNavArrows).observe(navBar);
new MutationObserver(updateNavArrows).observe(navBar, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
$('#navLeft').addEventListener('click', () => navBar.scrollBy({ left: -navBar.clientWidth * 0.7, behavior: 'smooth' }));
$('#navRight').addEventListener('click', () => navBar.scrollBy({ left: navBar.clientWidth * 0.7, behavior: 'smooth' }));
navBar.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || navBar.scrollWidth <= navBar.clientWidth) return;
  navBar.scrollLeft += e.deltaY; e.preventDefault();
}, { passive: false });
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

function updateExplodeToggle() {
  const b = $('#explodeToggle');
  b.hidden = !houseMode || layout.floors.length < 2;
  b.classList.toggle('active', exploded);
}
$('#explodeToggle').addEventListener('click', () => { exploded = !exploded; updateExplodeToggle(); build(); fitCamera(); });
function setHouseMode(on) {
  houseMode = on; selection = null; lockedSel = false; focusedRoom = null; document.body.classList.toggle('house', on);
  clearFocusOutline(); build(); fitCamera(); refreshSelection(); buildNav(true);
  updateFloorCards(); updateExplodeToggle();
}
function switchFloor(i) {
  houseMode = false; document.body.classList.remove('house'); updateFloorCards(); updateExplodeToggle();
  floorIdx = i; selection = null; lockedSel = false; focusedRoom = null; endDrawing(); closeLivePopup(); closeRoomPanel();
  clearFocusOutline(); build(); fitCamera(); refreshSelection();
  if (bgMode) setBgMode(null); else renderBgPanel();
  renderFloorPanel();
}

function clearFocusOutline() { clearGroup(focusGroup); }
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

function liveMove(d) {
  const obj = registry.get(d.id);
  if (obj) { obj.position.x = d.x; obj.position.z = d.z; }
  const sp = labelSprites.get(d.id);
  if (sp) sp.position.set(d.x, sp.position.y, d.z);
  cameraCones.get(d.id)?.mesh.position.set(d.x, 0, d.z);          // the field of view of a camera moves with it
  refreshSelHelper();
}
/* Wall stop: things cannot be pushed into the wall body. The device footprint and the wall thickness count, the move slides along
   the wall instead of freezing, and door openings let it through. Wall-hung items, outdoor items and ceiling-free objects are exempt. */
const STOP_EXEMPT = new Set(['ledring', ...WALL_TYPES_LIST(), ...OUTDOOR]);
function WALL_TYPES_LIST() { return ['picture', 'tv_wall', 'mirror', 'walllamp', 'radiator', 'towelrad', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'tv_led', 'camera', 'thermostat', 'switch', 'curtain', 'spot', 'pendant', 'smoke']; }
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
  const ms = [d];
  if (ms.some((m) => m.locked)) return;                          // locked things stay where they are
  const [dx, dz] = stopMove(ms, x - d.x, z - d.z);
  if (!dx && !dz) return;
  ms.forEach((m) => { m.x = +(m.x + dx).toFixed(4); m.z = +(m.z + dz).toFixed(4); liveMove(m); });
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
    tsel.addEventListener('change', () => { snapshot(); r.type = tsel.value; build(); scheduleSave(); renderFloorPanel(); });
    box.append(field(t('roof.type'), tsel));
    box.append(field(t('roof.pitch'), inp('number', r.pitch ?? 35, (v) => (r.pitch = Math.max(5, Math.min(70, +v || 35))), { step: 1 })));
    const manual = document.createElement('input'); manual.type = 'checkbox'; manual.id = 'roofManual'; manual.checked = !!r.box;
    manual.addEventListener('change', () => {
      snapshot();
      if (manual.checked) { const a = autoRoofBox(layout.floors.indexOf(f)); if (a) r.box = { ...a }; } else delete r.box;
      build(); scheduleSave(); renderFloorPanel();
    });
    const mrow = document.createElement('label'); mrow.className = 'chk'; mrow.append(manual, ' ' + t('roof.manual'));
    box.append(mrow);
    if (r.box) {
      const b = r.box, edit = (get, set) => lenInput(get, (v) => { set(v); if (b.x1 - b.x0 < 1) b.x1 = b.x0 + 1; if (b.z1 - b.z0 < 1) b.z1 = b.z0 + 1; }, { min: -1000 });
      box.append(field(t('roof.left'), edit(() => b.x0, (v) => { const w = b.x1 - b.x0; b.x0 = v; b.x1 = v + w; })));
      box.append(field(t('roof.top'), edit(() => b.z0, (v) => { const d = b.z1 - b.z0; b.z0 = v; b.z1 = v + d; })));
      box.append(field(t('roof.width'), edit(() => b.x1 - b.x0, (v) => { b.x1 = b.x0 + Math.max(1, v); })));
      box.append(field(t('roof.depth'), edit(() => b.z1 - b.z0, (v) => { b.z1 = b.z0 + Math.max(1, v); })));
    }
    box.append(field(t('roof.overhang'), lenInput(() => r.overhang ?? 0.4, (v) => (r.overhang = v), { min: 0 })));
    const rsel = document.createElement('select'); rsel.id = 'roofRidge';
    [['', t('roof.auto')], ['x', 'X'], ['z', 'Z']].forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; rsel.append(o); });
    rsel.value = r.ridge || '';
    rsel.addEventListener('change', () => { snapshot(); r.ridge = rsel.value || undefined; build(); scheduleSave(); });
    box.append(field(t('roof.ridge'), rsel));
    renderDormers(box, f, r);
  }
}
/** roof dormers: one card per dormer in the panel of the roof floor */
function renderDormers(box, f, r) {
  const head = document.createElement('h4'); head.id = 'dormerHead'; head.textContent = t('dormer.title'); box.append(head);
  if (r.type === 'flat') { const p = document.createElement('p'); p.className = 'sub'; p.textContent = t('dormer.noFlat'); box.append(p); return; }
  (r.dormers ||= []).forEach((d, i) => {
    const card = document.createElement('div'); card.className = 'dormerCard';
    const bb = roofBox(layout.floors.indexOf(f)), fit = bb ? dormerParts(bb, r, d) : null;
    const sel = (opts, val, set) => {
      const s = document.createElement('select');
      opts.forEach(([v, l]) => s.add(new Option(l, v)));
      s.value = String(val);
      s.addEventListener('change', () => { snapshot(); set(s.value); build(); scheduleSave(); renderFloorPanel(); });
      return s;
    };
    const cap = document.createElement('b'); cap.className = 'dormerCap'; cap.textContent = `${t('dormer.one')} ${i + 1}`; card.append(cap);
    card.append(field(t('dormer.side'), sel([[0, t('dormer.sideA')], [1, t('dormer.sideB')]], d.side === 1 ? 1 : 0, (v) => { d.side = +v; })));
    const pos = inp('range', Math.round((d.pos ?? 0.5) * 100), (v) => { d.pos = Math.max(0, Math.min(1, +v / 100)); }, { min: 0, max: 100, step: 1 });
    card.append(field(t('dormer.pos'), pos));
    card.append(field(t('dormer.width'), lenInput(() => d.w ?? DORMER_DEFAULT.w, (v) => { d.w = v; }, { min: 0.6 })));
    card.append(field(t('dormer.height'), lenInput(() => d.hw ?? DORMER_DEFAULT.hw, (v) => { d.hw = v; }, { min: 0.4 })));
    card.append(field(t('dormer.eave'), lenInput(() => d.eave ?? DORMER_DEFAULT.eave, (v) => { d.eave = v; }, { min: 0.2 })));
    card.append(field(t('dormer.type'), sel(DORMER_TYPES.map((v) => [v, t(`dormer.${v}`)]), d.type || 'gable', (v) => { d.type = v; })));
    const win = document.createElement('input'); win.type = 'checkbox'; win.checked = d.win !== false;
    win.addEventListener('change', () => { snapshot(); d.win = win.checked; build(); scheduleSave(); });
    card.append(field(t('dormer.window'), win));
    const del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.title = t('dormer.remove');
    del.addEventListener('click', () => { snapshot(); r.dormers.splice(i, 1); build(); scheduleSave(); renderFloorPanel(); });
    card.append(del);
    if (!fit) { const w = document.createElement('p'); w.className = 'sub warn'; w.textContent = t('dormer.noFit'); card.append(w); }
    box.append(card);
  });
  const add = document.createElement('button'); add.type = 'button'; add.id = 'addDormer'; add.textContent = t('dormer.add');
  add.addEventListener('click', () => {
    snapshot();
    const n = r.dormers.length;
    r.dormers.push({ id: uid(), ...DORMER_DEFAULT, side: n % 2, pos: [0.5, 0.25, 0.75][Math.floor(n / 2) % 3] });
    build(); scheduleSave(); renderFloorPanel();
  });
  box.append(add);
}
$('#addFloor').addEventListener('click', () => addFloorOf('floor'));
/* Automatic rooms (#17): one room for every closed loop of walls that is not a room yet */
$('#autoRooms').addEventListener('click', () => {
  const f = floor(), found = detectRooms(f.walls, f.rooms);
  if (!found.length) { setStatus(t('rooms.none')); return; }
  snapshot();
  found.forEach((r) => f.rooms.push({ id: uid(), name: `${t('prop.room')} ${f.rooms.length + 1}`, color: '#8a7f70', points: r.points }));
  changed();
  setStatus(t('rooms.found', { n: found.length }));
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
  tv_led: 'led licht ambilight hintergrundlicht fernseher tv indirekt backlight',
  ledring: 'led ring streifen strip indirekt indirect voute cove decke ceiling rundum ringsum abschnitte sections',
  tv: 'fernseher fernsehen television tele glotze', tv_wall: 'fernseher wandfernseher wand tv fernsehen flachbild', tvstand: 'fernsehtisch lowboard tv-board fernseher', monitor: 'bildschirm pc display', sofa: 'couch', sofa2: 'couch ecksofa wohnlandschaft',
  fridge: 'kühlschrank kuehlschrank', washer: 'waschmaschine', boiler: 'warmwasser', speaker: 'lautsprecher box', vacuum: 'saugroboter staubsauger', router: 'wlan fritzbox internet',
  presence: 'person anwesenheit anwesend bewegung bewegungsmelder präsenz praesenz presence motion occupancy mensch',
  light: 'leuchte lampe', lamp: 'leuchte stehlampe', bed: 'doppelbett', wardrobe: 'schrank kleiderschrank', shelf: 'regal', bookcase: 'bücherregal buecherregal',
};
$('#paletteSearch').addEventListener('input', (e) => { paletteQuery = e.target.value; buildPalette(); });
function renderModelPalette() {
  const box = $('#modelGrid');
  box.innerHTML = '';
  const q = paletteQuery.trim().toLowerCase().replace(/[\s-]+/g, '');
  const shown = customModels.filter((m) => !m.builtin || !q || m.name.replace(/-/g, '').includes(q));   // the search box also filters the shipped models
  if (!shown.length) {
    const n = document.createElement('div'); n.className = 'none'; n.textContent = t('panel.modelsEmpty');
    box.append(n);
    return;
  }
  shown.forEach((m) => {
    const b = document.createElement('button');
    b.className = 'model';
    b.title = m.name;
    b.textContent = m.name;
    b.classList.toggle('active', deviceType === `glb:${m.name}`);
    if (m.builtin) { b.addEventListener('click', () => { deviceType = `glb:${m.name}`; buildPalette(); }); box.append(b); return; }
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
/** everything cut out of floor i: stairwell openings plus the floor openings drawn by hand (Bodenöffnung) */
function floorOpenings(i) {
  return [...holesForFloor(layout.floors, i, FLOOR_H), ...(layout.floors[i]?.holes || []).filter((h) => h.points.length >= 3).map((h) => h.points)];
}
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

/** the plot (Grundstück) drawn in the 2D plan: the lawn and the earth take its shape; replaces an earlier one */
function setPlot(points) {
  snapshot();
  layout.plot = { ...(layout.plot || {}), boundary: points };
  changed();
  setStatus(t('plot.set'));
}
$('#plotClear').addEventListener('click', () => {
  if (!layout.plot?.boundary) return;
  snapshot();
  delete layout.plot.boundary;
  if (!Object.keys(layout.plot).length) delete layout.plot;
  changed(); plan?.render();
});
function addHole(points) {
  snapshot();
  const f = floor();
  (f.holes ||= []).push({ id: uid(), points });
  selection = { kind: 'hole', id: f.holes[f.holes.length - 1].id };
  changed();
  setStatus(t('hole.added'));
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
const DOMAIN_DEVICE = { light: 'light', cover: 'switch', switch: 'switch', climate: 'thermostat', media_player: 'tv', sensor: 'sensor', binary_sensor: 'sensor', person: 'presence', device_tracker: 'presence' };
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
  const placedIds = new Set(entityDevices(floor()).map((d) => d.entity).filter(Boolean));
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
  floor().walls.forEach((w) => (w.openings || []).forEach((o) => openingEntities(o).forEach((e) => placedIds.add(e))));   // contacts already on a door / window
  const extra = (room.area ? areas.find((x) => x.id === room.area)?.entities || [] : []).filter((id) => !placedIds.has(id));
  const placeable = extra.filter((id) => classify(entityInfo(id)));
  if (placeable.length) {                                  // one click: every thing of the area where it belongs
    const ab = document.createElement('button'); ab.type = 'button'; ab.id = 'reAutoPlace'; ab.className = 're-auto';
    ab.textContent = t('auto.all', { n: placeable.length }); ab.title = t('auto.hint');
    ab.addEventListener('click', () => {
      const plan = autoPlace(room, placeable);
      setStatus(t('auto.done', { n: plan.devices.length, o: plan.openings.length, s: plan.skipped.length }));
    });
    box.append(ab);
  }
  extra.forEach((id) => {
    const b = document.createElement('button'); b.textContent = t('re.place');
    b.addEventListener('click', () => {
      const plan = autoPlace(room, [id]);
      if (plan.devices[0]) selection = { kind: 'device', id: plan.devices[0].id };
      else if (!plan.openings.length) {                    // nothing the room has a place for (energy sensor, scene ...): as before, in the middle
        snapshot();
        const dom = id.split('.')[0], type = DOMAIN_DEVICE[dom] || 'sensor';
        const xs = room.points.map((p) => p[0]), zs = room.points.map((p) => p[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
        const d = { id: uid(), type, x: pointInPoly(cx, cz, room.points) ? cx : room.points[0][0] + 0.5, z: pointInPoly(cx, cz, room.points) ? cz : room.points[0][1] + 0.5,
          y: DEVICE_TYPES[type]?.y || 0, rot: 0, scale: 1, name: entityInfo(id).name || id, entity: id };
        floor().devices.push(d);
        selection = { kind: 'device', id: d.id };
        changed();
      }
      refreshSelection();
    });
    row(entityInfo(id).name || id, id, b).classList.add('unplaced');
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
    ['obj.holes', (f.holes || []).map((h, i) => ({ kind: 'hole', id: h.id, label: `${t('prop.hole')} ${i + 1}` }))],
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
  else if (selection.kind === 'hole') it = (f.holes || []).find((x) => x.id === selection.id);
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
    {                                                          // roof terrace / open area: no roof above it, railing on the edges without a wall
      const tc = document.createElement('input'); tc.type = 'checkbox'; tc.checked = !!it.terrace; tc.id = 'roomTerrace';
      tc.addEventListener('change', () => {
        snapshot();
        if (tc.checked) { it.terrace = true; if (!it.color || it.color === '#8a7f70') it.color = '#a58a63'; } else { delete it.terrace; if (it.color === '#a58a63') it.color = '#8a7f70'; }
        changed(); renderProps();
      });
      const tl = document.createElement('label'); tl.className = 'chk'; tl.title = t('prop.terraceHint'); tl.append(tc, document.createTextNode(' ' + t('prop.terrace')));
      body.append(tl);
    }
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
  } else if (selection.kind === 'hole') {
    const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('hole.help'); body.append(hp);
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
      body.append(field(t('stair.length'), lenInput(() => stairLength(it, FLOOR_H), (v) => (it.tread = Math.max(MIN_TREAD, Math.min(MAX_TREAD, v / cnt))), { min: 0.5 })));
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
    if (it.type in LED_LIKE || catOf(it.type) === 'lighting' || /^light\./.test(it.entity || '') || it.type === 'presence') {     // aesthetics: hide the model, keep the light / the presence dot at the top
      const hv = document.createElement('input'); hv.type = 'checkbox'; hv.checked = !!it.hideModel; hv.id = 'devHide';
      hv.addEventListener('change', () => { snapshot(); if (hv.checked) it.hideModel = true; else delete it.hideModel; changed(); applyStates(); });
      const hl = document.createElement('label'); hl.className = 'chk'; hl.title = t(it.type === 'presence' ? 'prop.hideModelPresenceHint' : 'prop.hideModelHint'); hl.append(hv, document.createTextNode(' ' + t(it.type === 'presence' ? 'prop.hideModelPresence' : 'prop.hideModel')));
      body.append(hl);
    }
    if (it.type === 'nanoleaf') {
      const eb = document.createElement('button'); eb.type = 'button'; eb.id = 'nanoEdit'; eb.textContent = '✎ ' + t('nano.edit');
      eb.addEventListener('click', () => { if (!it.locked) editNano(it); else setStatus(t('prop.lockedHint')); });
      body.append(eb);
    }
    body.append(field(t('prop.name'), inp('text', it.name || '', (v) => (it.name = v))));
    body.append(field('X', lenInput(() => it.x, (v) => (it.x = v), { min: -1000 })));
    body.append(field('Z', lenInput(() => it.z, (v) => (it.z = v), { min: -1000 })));
    body.append(field(t('prop.rotation'), inp('number', it.rot || 0, (v) => { it.rot = ((+v % 360) + 360) % 360; }, { step: 15 })));
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
    if (it.type === 'ledring') ringProps(body, it);
    body.append(pickerField(t(it.type === 'ledring' ? 'ring.main' : 'prop.entity'), entityPicker(entities.slice(0, 1500), roomAt(it.x, it.z), it.entity || '', (v) => { snapshot(); it.entity = v; changed(); })));
    if (it.type === 'camera') {                                  // #69: field of view cone on the floor
      body.append(field(t('cam.fov'), inp('number', it.fov ?? 90, (v) => { it.fov = Math.max(0, Math.min(180, +v || 0)); }, { step: 5, min: 0, max: 180 })));
      body.append(field(t('cam.range'), lenInput(() => it.range ?? 4, (v) => (it.range = Math.max(0.5, v)), { min: 0.5, step: 0.5 })));
      body.append(pickerField(t('cam.motionSensor'), entityPicker(entities.filter((e) => e.domain === 'binary_sensor').slice(0, 1500), roomAt(it.x, it.z), it.motionEntity || '', (v) => { snapshot(); if (v) it.motionEntity = v; else delete it.motionEntity; changed(); })));
    }
    if (it.type === 'tv' || it.type === 'tv_wall') {          // built-in backlight: shown behind the TV, shines into the room
      body.append(pickerField(t('prop.ledEntity'), entityPicker(entities.filter((e) => /^(light|switch)\./.test(e.entity_id)).slice(0, 1500), roomAt(it.x, it.z), it.ledEntity || '', (v) => { snapshot(); if (v) it.ledEntity = v; else delete it.ledEntity; changed(); })));
    }
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

/** LED ring properties: closed or open, distance to the walls, refit to the room, one light per section */
function refitRing(d) {
  const room = floor().rooms.find((r) => r.id === d.room) || roomAt(d.x, d.z);
  if (!room) { setStatus(t('ring.noRoom')); return; }
  const keep = d.segs || [], ranged = hasRanges(d), closed = d.closed;
  Object.assign(d, ringFromRoom(room.points, d.inset ?? RING_DEFAULT_INSET), { rot: 0, scale: 1, room: room.id });
  delete d.sx; delete d.sz; delete d.mirror;
  if (closed === false) d.closed = false;
  d.segs = ranged ? keep : d.segs.map((sg, i) => keep[i] || sg);   // sections keep their lights (and their start / end)
  fitSegs(d);
}
function ringProps(body, it) {
  const redo = (fn) => () => { if (it.locked) { setStatus(t('prop.lockedHint')); return; } snapshot(); fn(); changed(); renderProps(); };
  const btn = (id, label, fn, title = '') => { const b = document.createElement('button'); b.type = 'button'; if (id) b.id = id; b.textContent = label; b.title = title; b.addEventListener('click', redo(fn)); return b; };
  const h = document.createElement('h4'); h.textContent = t('ring.sections'); body.append(h);
  const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = it.closed !== false; cb.id = 'ringClosed';
  cb.addEventListener('change', () => { snapshot(); it.closed = cb.checked; fitSegs(it); changed(); renderProps(); });
  const cl = document.createElement('label'); cl.className = 'chk'; cl.append(cb, document.createTextNode(' ' + t('ring.closed')));
  body.append(cl);
  body.append(field(t('ring.inset'), lenInput(() => it.inset ?? RING_DEFAULT_INSET, (v) => { it.inset = Math.min(2, v); if (!it.locked) refitRing(it); queueMicrotask(renderProps); }, { min: 0, step: 0.05 })));
  body.append(btn('ringFit', t('ring.fit'), () => refitRing(it)));
  const total = document.createElement('div'); total.className = 'sub'; total.textContent = t('ring.total', { len: fmtLen(pathLength(it)) }); body.append(total);
  // how many sections: spread evenly over the whole band, or one per wall
  const cnt = document.createElement('input'); cnt.type = 'number'; cnt.id = 'ringCount'; cnt.min = 1; cnt.max = 60; cnt.step = 1; cnt.value = ringCount(it);
  body.append(field(t('ring.count'), cnt));
  const row = document.createElement('div'); row.className = 'stopTools';
  row.append(btn('ringEven', t('ring.even'), () => splitEven(it, +cnt.value || 1)), btn('ringPerWall', t('ring.perWall'), () => perWall(it)));
  body.append(row);
  const lights = entities.filter((e) => /^(light|switch)\./.test(e.entity_id)).slice(0, 1500);
  ringSectionsWorld(it).forEach((e) => {
    const box = document.createElement('div'); box.className = 'ringSec'; box.dataset.seg = e.i;
    const head = document.createElement('div'); head.className = 'ringSecHead';
    const lb = document.createElement('b'); lb.textContent = t('ring.seg', { n: e.i + 1, len: fmtLen(e.len) });
    head.append(lb, btn('', '✂', () => splitSection(it, e.i), t('ring.split')));
    if (ringCount(it) > 1) head.append(btn('', '🗑', () => removeSection(it, e.i), t('ring.remove')));
    box.append(head);
    box.append(field(t('ring.from'), lenInput(() => e.from, (v) => { setRange(it, e.i, v, null); queueMicrotask(renderProps); }, { min: 0, step: 0.05 })));
    box.append(field(t('ring.to'), lenInput(() => e.to, (v) => { setRange(it, e.i, null, v); queueMicrotask(renderProps); }, { min: 0, step: 0.05 })));
    box.append(entityPicker(lights, roomAt(e.mid[0], e.mid[1]), it.segs?.[e.i]?.entity || '', (v) => {
      snapshot(); fitSegs(it); const sg = it.segs[e.i] || (it.segs[e.i] = {}); if (v) sg.entity = v; else delete sg.entity; changed();
    }));
    body.append(box);
  });
  const hp = document.createElement('p'); hp.className = 'sub'; hp.textContent = t('ring.help'); body.append(hp);
}

/* ================= Settings ================= */
const dlg = $('#settingsDialog');
const bindings = {
  language: '#setLanguage', theme: '#setTheme', units: '#setUnits', grid: '#setGrid',
  wallHeight: '#setWallHeight', wallThickness: '#setWallThickness', autosaveSeconds: '#setAutosave',
  shadows: '#setShadows', labelMode: '#setLabels', cameraImages: '#setCameraImages', earth: '#setEarth', earthMargin: '#setEarthMargin', lowWalls: '#setLowWalls',
  alerts: '#setAlerts', alertJump: '#setAlertJump', weatherEntity: '#setWeather', idleReturn: '#setIdleReturn', idleOrbit: '#setIdleOrbit', nightDim: '#setNightDim', nightFrom: '#setNightFrom', nightTo: '#setNightTo', cutaway: '#setCutaway', wallStop: '#setWallStop', placeSelect: '#setPlaceSelect', autoBackup: '#setAutoBackup', backupEveryHours: '#setBackupEvery', backupKeepDays: '#setBackupKeepDays', backupKeepCount: '#setBackupKeepCount',
  wallOpacity: '#setWallOpacity', belowVisibility: '#setBelow', belowMode: '#setBelowMode', glowRadius: '#setGlowRadius', glowStrength: '#setGlowStrength', glowHeight: '#setGlowHeight',
  defaultLightColor: '#setDefaultLight', bgTop: '#setBgTop', bgBottom: '#setBgBottom', bgGlow: '#setBgGlow', bgGlowStrength: '#setBgGlowStrength',
};
const dispKeys = new Set(['wallHeight', 'wallThickness', 'glowRadius', 'glowHeight', 'earthMargin']);

function fillSettingsForm() {
  for (const [key, sel] of Object.entries(bindings)) {
    const el = $(sel);
    if (el.type === 'checkbox') el.checked = !!settings[key];
    else if (dispKeys.has(key)) el.value = toDisp(settings[key]);
    else el.value = String(settings[key]);
  }
  $('#earthMarginNote').hidden = !(layout.plot?.boundary?.length >= 3);
  $('#weatherList').replaceChildren(...entities.filter((e) => e.entity_id.startsWith('weather.')).map((e) => { const o = document.createElement('option'); o.value = e.entity_id; o.label = e.name; return o; }));
  $('#setPerf').value = perfStored;
  renderTablets();
  renderStops('#tempStops', 'tempStops', '°C');
  renderStops('#humidStops', 'humidStops', '%');
  renderStops('#co2Stops', 'co2Stops', 'ppm');
}
/** rooms for the tablet dropdown, grouped by house: [{ house, rooms: [{ name, floor }] }], top floor first */
function roomsByHouse(lay, houseName) {
  const rooms = [...(lay.floors || [])].reverse().filter((f) => f.kind !== 'roof')
    .flatMap((f) => (f.rooms || []).filter((r) => r.name).map((r) => ({ name: r.name, floor: f.name })));
  return { house: houseName, rooms };
}
let roomGroups = null;                       // filled with all houses when the users dialog opens, until then only the open house
const currentRoomGroups = () => [roomsByHouse(layout, houses.find((h) => h.id === houseId)?.name || '')];
async function loadRoomGroups() {
  if (houses.length < 2) { roomGroups = null; return; }
  const out = [];
  for (const h of houses) {
    if (h.id === houseId) { out.push(roomsByHouse(layout, h.name)); continue; }
    try { const r = await fetch(`api/layout?house=${encodeURIComponent(h.id)}`); if (r.ok) out.push(roomsByHouse(await r.json(), h.name)); } catch { /* skip a house that cannot be read */ }
  }
  roomGroups = out;
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
  const groups = roomGroups || currentRoomGroups();
  groups.forEach((g) => {
    if (!g.rooms.length) return;
    const og = document.createElement('optgroup'); og.label = g.house || t('set.wholeHouse');
    g.rooms.forEach((r) => og.append(new Option(`${r.name} · ${r.floor}`, r.name)));
    sel.append(og);
  });
  if (room && !groups.some((g) => g.rooms.some((r) => r.name === room))) sel.add(new Option(room, room));
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
    else if (key === 'idleReturn') next[key] = Math.max(0, parseFloat(el.value) || 0);   // 0 = off
    else if (el.type === 'number') {
      const v = parseFloat(el.value);
      if (Number.isFinite(v) && v > 0) next[key] = dispKeys.has(key) ? fromDisp(v) : v;
    } else if (el.type === 'range') next[key] = parseFloat(el.value) || 0;
    else if (key === 'grid') next[key] = parseFloat(el.value);
    else next[key] = el.value;
  }
  const tb = readTablets(); next.userRooms = tb.rooms; next.userViews = tb.views;
  next.tempStops = readStops('#tempStops', settings.tempStops);
  next.humidStops = readStops('#humidStops', settings.humidStops);
  next.co2Stops = readStops('#co2Stops', settings.co2Stops);
  return next;
}
function applySettings(prev = {}) {
  setLanguage(settings.language);
  document.documentElement.dataset.theme = settings.theme;
  const rs = document.documentElement.style;
  rs.setProperty('--bg-top', settings.bgTop); rs.setProperty('--bg-bottom', settings.bgBottom); rs.setProperty('--bg-glow', settings.bgGlow); rs.setProperty('--bg-glow-s', String(settings.bgGlowStrength ?? 0));
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
      if (r.ok) { settings = { ...settings, ...(await r.json()) }; settingsEtag = r.headers.get('ETag'); settingsLoaded = true; fillSettingsForm(); break; }   // the form always shows the real settings: every later save reads it back
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
$('#setPerf').addEventListener('change', (e) => {     // per device (this browser), not for the whole house: needs a fresh start
  try { if (e.target.value === 'auto') localStorage.removeItem(PERF_KEY); else localStorage.setItem(PERF_KEY, e.target.value); } catch { /* no storage */ }
  location.reload();
});
$('#settingsBtn').addEventListener('click', () => { fillSettingsForm(); dlg.showModal(); });
const usersDlg = $('#usersDialog');
async function refreshUsersFile(note = '') {
  const el = $('#usersFileStatus');
  try {
    const r = await fetch('api/users-file');
    if (!r.ok) { el.textContent = note; return; }
    const s = await r.json();
    el.classList.toggle('warn', !s.inSync);
    el.textContent = note || (!s.exists ? t('users.fileNone') : s.inSync ? t('users.fileOk', { n: s.users }) : t('users.fileDiff', { f: s.fileUsers, n: s.users }));
  } catch { el.textContent = note; }
}
async function syncUsersFile() {
  try {
    const r = await fetch('api/users-file/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const body = await r.json().catch(() => ({}));
    if (r.status === 404) { await refreshUsersFile(t('users.syncMissing')); return; }
    if (!r.ok) { await refreshUsersFile(t('users.syncFail', { msg: body.error || r.status })); return; }
    settings = { ...settings, ...body }; settingsEtag = r.headers.get('ETag') || settingsEtag;
    renderTablets();
    await refreshUsersFile(t('users.syncDone', { n: new Set([...Object.keys(settings.userRooms || {}), ...Object.keys(settings.userViews || {})]).size }));
  } catch (e) { await refreshUsersFile(t('users.syncFail', { msg: String(e.message || e) })); }
}
$('#usersBtn').addEventListener('click', async () => {
  if (!settingsLoaded) await loadSettings();
  fillSettingsForm();                                  // the form behind the dialogs must hold the real settings before the first save reads it back (else the defaults, e.g. the hologram theme, win)
  usersDlg.showModal(); loadHaUsers(); refreshUsersFile();
  loadRoomGroups().then(() => { if (usersDlg.open && roomGroups) renderTablets(); });   // all houses, grouped; the first paint already shows the open house
});
async function saveUsersFile() {
  try {
    await commitSettings();                                                   // what is typed in the dialog goes along
    const r = await fetch('api/users-file/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ direction: 'save' }) });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) { await refreshUsersFile(t('users.syncFail', { msg: body.error || r.status })); return; }
    settingsEtag = r.headers.get('ETag') || settingsEtag;
    await refreshUsersFile(t('users.saveDone', { n: new Set([...Object.keys(settings.userRooms || {}), ...Object.keys(settings.userViews || {})]).size }));
  } catch (e) { await refreshUsersFile(t('users.syncFail', { msg: String(e.message || e) })); }
}
$('#usersSave').addEventListener('click', saveUsersFile);
const backupsUi = initBackups({ t, commitSettings });
$('#housePanel').addEventListener('toggle', async () => {
  if (!$('#housePanel').open) return;
  if (!settingsLoaded) await loadSettings();
  fillSettingsForm();
  backupsUi.refresh();
});
$('#usersSync').addEventListener('click', syncUsersFile);
usersDlg.addEventListener('change', async () => { await commitSettings(); refreshUsersFile(); });
usersDlg.addEventListener('click', (e) => { if (e.target === usersDlg) usersDlg.close(); });
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

const toState = (e) => ({ since: e.since, state: e.state, unit: e.unit, brightness: e.brightness, position: e.position, rgb: effRgb(e), rgbRaw: e.rgb, dc: e.dc, ct: e.ct, ch: e.ch, fx: e.fx, fxc: e.fxc, members: e.members });

/* ---- Live channel: the add-on pushes every state change the moment Home Assistant reports it (a wall switch, an
   automation, a sensor). While it is up, the full list is only fetched once a minute to stay in step; while it is
   down (Home Assistant restarting, no websocket through a proxy) the view polls every 4 seconds as before. ---- */
let liveOk = false, liveRetry = 1000, lastFull = 0, liveRaf = 0;
function connectLive() {
  if (window.__fpNoLive) return;                         // the single-file demo has no server to talk to
  let ws;
  try { const u = new URL('api/live', location.href); u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'; ws = new WebSocket(u); } catch { return; }
  ws.onopen = () => { liveRetry = 1000; };
  ws.onmessage = (m) => {
    let d;
    try { d = JSON.parse(m.data); } catch { return; }
    if (d.type === 'upstream') { const was = liveOk; liveOk = !!d.ok; if (liveOk && !was) pollStates(); }   // catch up on what changed before the channel was up
    else if (d.type === 'states') applyLive(d);
  };
  ws.onclose = () => { liveOk = false; setTimeout(connectLive, liveRetry); liveRetry = Math.min(30000, liveRetry * 2); };
}
function applyLive({ list = [], removed = [] }) {
  if (!entities.length) return;                         // the first full list is still on its way and brings these too
  list.forEach((e) => {
    states[e.entity_id] = toState(e);
    const i = entities.findIndex((x) => x.entity_id === e.entity_id);
    if (i >= 0) entities[i] = e; else entities.push(e);
  });
  removed.forEach((id) => { delete states[id]; entities = entities.filter((x) => x.entity_id !== id); });
  wake();
  if (!liveRaf) liveRaf = requestAnimationFrame(() => { liveRaf = 0; applyStates(); renderRoomEntities(); renderEntState(); });
}

async function pollStates() {
  try {
    const r = await fetch('api/entities');
    if (!r.ok) return;
    const list = await r.json();
    if (!Array.isArray(list)) return;
    const firstLoad = !entities.length;
    const sig = JSON.stringify(list.map((e) => [e.entity_id, e.state, e.brightness, e.rgb, e.fxc, e.position]));
    if (sig !== lastStateSig) { lastStateSig = sig; wake(); }
    entities = list.sort((a, b) => a.name.localeCompare(b.name));
    states = Object.fromEntries(list.map((e) => [e.entity_id, toState(e)]));
    lastFull = Date.now();
    if (firstLoad) { await loadAreas(); fillEntities(); renderProps(); }
    applyStates();
    renderRoomEntities(); renderEntState();
  } catch { /* offline: ignore */ }
}

function normalizeLayout() {
  if (!layout.floors?.length) {
    layout = { version: 1, floors: [{ id: uid(), name: t('floor.default'), walls: [], rooms: [], devices: [], blocks: [], stairs: [] }] };
  }
  layout.floors.forEach((f) => {
    f.walls ||= []; f.rooms ||= []; f.devices ||= []; f.blocks ||= []; f.stairs ||= []; f.holes ||= []; f.kind ||= 'floor';
    f.walls.forEach((w) => { w.openings ||= []; });
  });
}

plan = createPlan({
  stage: $('#stage'),
  floor: () => floor(), layout: () => layout, getFloorIdx: () => floorIdx, settings: () => settings,
  getTool: () => tool, getOpeningType: () => openingType, isLive: () => isLive(), isLocked: () => lockedSel,
  getSelection: () => selection,
  holdPlaced,
  setSelection: (h) => { selection = h ? { kind: h.kind, id: h.id } : null; refreshSelection(); },
  snapshot, commit: () => changed(), deleteItem, rebuild3d: () => build(), calibrate,
  bgChanged: () => renderBgPanel(), floorH: () => FLOOR_H, ghostFloors: () => ghostFloors(), addBlock, addHole, setPlot, placeStair, getStairTemplate: () => ({ id: 'tpl', ...stairTpl() }),
  moveDeviceTo: (d, x, z) => moveDeviceTo(d, x, z), isItemLocked: (k, id) => !!itemOf(k, id)?.locked,
 
  liveMoveDevice: (d) => liveMove(d),
  liveTap: (h) => liveSelect(h),
  deviceDoubleClick: (id) => deviceEntities(floor().devices.find((v) => v.id === id)).forEach(quickAction),
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
  normalizeLayout();
  floorIdx = groundIdx();                                 // start on the ground floor, not in the basement
  renderHouseUi();
  await loadModels();
  applySettings();
  fillFloorSelect(); fillEntities(); setTool('select'); resize(); build(); fitCamera(); renderBgPanel(); renderFloorPanel();
  if (params.get('mode') === 'live' || params.get('kiosk') || tabletRoom || !me.canEdit) setMode('live');
  if (tabletRoom) {
    const hit = findRoomByName(tabletRoom);
    if (hit) { switchFloor(hit.floor); focusRoom(hit.room.id); openRoomPanel(hit.room.id); }
    updateHouseToggle();
  }
  pollStates();
  connectLive();
  setInterval(() => { if (!liveOk || Date.now() - lastFull > 60000) pollStates(); }, 4000);
}

var lastActive = performance.now(), lastFrame = 0;
function wake() { lastActive = performance.now(); }
['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart', 'touchmove'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
controls.addEventListener('change', wake);
function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  if (document.hidden) return;                                   // screen off / tab in background: draw nothing
  const idle = now - lastActive > (LOW ? 4000 : 15000);           // nothing happens: a few frames a second are enough
  if (LOW || idle) {
    if (now - lastFrame < (idle ? (LOW ? 500 : 250) : 33)) return;
    lastFrame = now;
  }
  if (coneMotion.size) { wake(); const k = 0.26 + 0.14 * Math.sin(now / 220); coneMotion.forEach((m) => { m.opacity = k; }); }   // a camera sees movement
  if (alertPulses.length || controls.autoRotate || findMarker) wake();   // pulsing warnings, screen saver and the search ring move
  if (alertPulses.length) { const k = 0.22 + 0.2 * Math.sin(now / 260); alertPulses.forEach((m) => { m.opacity = k; }); }
  if (findMarker) {
    const left = findMarker.until - now;
    if (left <= 0) { scene.remove(findMarker.mesh); findMarker.mesh.geometry.dispose(); findMarker = null; }
    else { const k = 1 + 0.35 * Math.sin(now / 120); findMarker.mesh.scale.set(k, k, k); findMarker.mesh.material.opacity = Math.min(1, left / 800); }
  }
  controls.update();
  updateCutaway();
  animateOpenings();
  selHelper?.update();
  declutterLabels();
  placeFloorCards();
  renderer.render(scene, camera);
}
init();
animate();

/* Test hook: only active with ?debug=1, used by the browser tests to find objects on screen. */
if (params.get('debug')) {
  window.__fp = {
    openRoomPanel(id) { openRoomPanel(id); },
    ledShown(id) { return !!registry.get(id)?.userData.ledParts?.[0]?.visible; },
    isShown(id) { return !!registry.get(id)?.visible; },
    editNano(id) { const d = floor().devices.find((v) => v.id === id); if (d) editNano(d); },
    screenOf(id) {
      const obj = registry.get(id);
      if (!obj) return null;
      const v = obj.getWorldPosition(new THREE.Vector3()).project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    get layout() { return layout; }, settings: () => settings, offline: () => offlineDevices(), alerts: () => alerts.map((a) => ({ kind: a.kind, entity: a.entity, at: a.at })), alertPulsing: () => alertPulses.length, kioskTick, kioskIdle: (ms) => { lastInput = Date.now() - ms; kioskHome = false; }, autoRotate: () => controls.autoRotate, findItems, navArrows: () => [!$('#navLeft').hidden, !$('#navRight').hidden], navBar: () => navBar,
    renderer, scene, frame: () => { const t0 = performance.now(); controls.update(); updateCutaway(); animateOpenings(); selHelper?.update(); const t1 = performance.now(); renderer.render(scene, camera); return [t1 - t0, performance.now() - t1]; },
    houseId: () => houseId,
    coneScreen(id) {                                          // screen point in the middle of a camera cone (for tests)
      const c = cameraCones.get(id);
      if (!c) return null;
      const p = c.mesh.geometry.attributes.position, v = new THREE.Vector3();
      for (let i = 1; i < p.count; i++) v.add(new THREE.Vector3().fromBufferAttribute(p, i));
      v.multiplyScalar(0.55 / (p.count - 1)).add(new THREE.Vector3().fromBufferAttribute(p, 0).multiplyScalar(0.45));
      c.mesh.localToWorld(v); v.project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    elev: (i) => elev(i),
    select(kind, id) { selection = { kind, id }; refreshSelection(); },
    houseCards: () => [...document.querySelectorAll('.floorCard')].map((e) => e.innerText),
    rebuild: () => build(),
    switchHouse,
    paneTargets: (id) => (registry.get(id)?.userData.panePivots || []).map((p) => p.userData.target),
    liveOk: () => liveOk,
    underFloors: (id) => { let ok = false; registry.get(id)?.traverse((o) => { if (o.isMesh) ok = o.renderOrder < 0 && [].concat(o.material).every((m) => !m.depthWrite); }); return ok; },
    bounds: () => floorBounds(), roofBox: (i) => roofBox(i),
    switchFloor: (i) => switchFloor(i),
    blockOpen: (id) => { const sh = [].concat(registry.get(id)?.geometry?.parameters?.shapes || []); return sh.length > 1 || sh.some((x) => x.holes.length > 0); },
    solidShape: (id) => { let ok = false; registry.get(id)?.traverse((o) => { if (o.isMesh && [].concat(o.material).some((m) => !m.transparent || m.opacity > 0.3)) ok = true; }); return ok; },
    clipped: (id) => { let n = 0; registry.get(id)?.traverse((o) => { if (o.material && [].concat(o.material).some((m) => m.clippingPlanes?.includes(earthCut))) n++; }); return n; },
    earthDbg: () => ({ n: earthCut.normal.toArray(), c: earthCut.constant, solid: earthLawn, cut: !!earthInfo, capVisible: !!earthInfo?.cap.visible, capVerts: earthInfo?.cap.geometry.getAttribute('position')?.count || 0, gridShown: !!grid?.visible, box: earthBox, ground: earthGround }),
    stateOf: (e) => states[e]?.state,
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
    LOW, elev, houseMode: () => houseMode, setHouseMode, moveFloor, addFloorOf, floorIdx: () => floorIdx,
    holeCount: (i) => floorOpenings(i).length,
    plan: () => plan,
    topDown() { is2d = true; controls.enableRotate = false; build(); fitCamera(); },     // test helper: orthogonal-ish camera above the floor
    pickAt(x, y) { const h = pickHit({ clientX: x, clientY: y }); return h ? { kind: h.data.kind, id: h.data.id, seg: h.data.seg } : null; },
    ringGlow: (id) => (registry.get(id)?.userData.segs || []).map((sg) => sg.glow[0].emissiveIntensity > 0),
    ringSegScreen(id, i) {                                        // screen position of the middle of an LED ring section
      const v = registry.get(id)?.children[i]?.getObjectByName('mid')?.getWorldPosition(new THREE.Vector3());
      if (!v) return null;
      v.project(camera); const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    rayHits(x, y) { setRay({ clientX: x, clientY: y }); return ray.intersectObjects(pickables, true).map((h) => { let o = h.object; while (o && !o.userData.kind) o = o.parent; return `${o?.userData.kind}:${o?.userData.id}@${h.distance.toFixed(2)}${h.object.userData.proxy ? 'P' : ''}`; }); },
    openingCenter(id) {                 // screen position of the middle of a door/window (not its base)
      const o = registry.get(id); if (!o) return null;
      const fo = findOpening(id); const v = o.getWorldPosition(new THREE.Vector3()); v.y += fo.opening.sill + fo.opening.height / 2;
      v.project(camera); const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
  };
}
