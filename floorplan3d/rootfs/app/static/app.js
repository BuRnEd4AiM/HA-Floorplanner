import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { initImport } from './import.js';
import { initToolbar } from './toolbar.js';
import { DEFAULT_LEGS } from './kitchen.js';
import { initAlertsUi } from './alertsui.js';
import { initSearch } from './search.js';
import { initBackups } from './backups.js';
import { initVersion } from './version.js';
import { initPower } from './power.js';
import { initCompass } from './compass.js';
import { initOffline } from './offline.js';
import { initBadges } from './badges.js';
import { initKiosk } from './kiosk.js';
import { initCameras } from './cameras.js';
import { initFloorCards } from './floorcards.js';
import { initFloorRail } from './floorrail.js';
import { initHouses } from './houses.js';
import { initSettingsUi } from './settingsui.js';
import { initBackground, imageSize } from './background.js';
import { initPalettes } from './palettes.js';
import { floorOpenings as floorOpeningsOf, floorShapes, initBlocks } from './blocks.js';
import { initStairTool } from './stairtool.js';
import { initLiveControls } from './livecontrols.js';
import { initLivePopup } from './livepopup.js';
import { initRoomPanel, roomOpenings, roomOpeningSpans } from './roompanel.js';
import { initPropFields } from './propfields.js';
import { initEntityPicker } from './entitypicker.js';
import { initObjList } from './objlist.js';
import { initRoomEntities } from './roomentities.js';
import { initProps } from './props.js';
import { initOpenings, openKind, OPEN_KINDS, paneEntity, openingEntities } from './openings.js';
import { initCutaway } from './cutaway.js';
import { initSettings } from './settings.js';
import { initFloorPanel, newFloor } from './floorpanel.js';
import { MAX_LIGHTS, LIGHT_PROFILE, cssHex, hexVec, colorFromStops, roomLightMat as makeRoomLightMat, fillLights as fillRoomLights } from './roomlight.js';
import { initEarth } from './earth.js';
import { initWelcome } from './welcome.js';
import { openNanoEditor, DEFAULT_PANELS } from './nanoleaf.js';
import { canMoreInfo, openMoreInfo } from './moreinfo.js';
import { planPlacement, classify } from './autoplace.js';
import { RING_DEFAULT_INSET, segEntity, ringEntities, ringSectionsWorld, ringFromRoom } from './ledring.js';
import { DEVICE_TYPES, catOf, makeModel, isCustom } from './models.js';
import {
  OPENING_DEFAULTS, buildWall, wallLength, projectOnWall, clampOpeningPos, openingOverlaps, fitOpeningWidth,
} from './walls.js';
import { t, setLanguage, applyI18n, currentLanguage } from './i18n.js';
import { createPlan } from './plan2d.js';
import polygonClipping from './vendor/polygon-clipping.js';
import { detectRooms, distToPoly, polyArea } from './rooms.js';
import { dormerParts } from './dormer.js';
import { roofFrame, solarPose } from './solarroof.js';
import { badgeText, stateText as plainStateText } from './badgetext.js';
import { stairLocal, polyToWorld, toWorld, stairHandles, stairFloors } from './stairs.js';

/* ================= State ================= */
const FLOOR_H = 3.0;
const M_TO_FT = 3.28084;
const params = new URLSearchParams(location.search);

let settings = {
  language: 'auto', theme: 'dark', units: 'metric', grid: 0.25, wallHeight: 2.6, wallThickness: 0.2,
  shadows: true, autosaveSeconds: 1.5, lowWalls: false, labelMode: 'important', cameraImages: true, cutaway: true, wallStop: true, seeThrough: false, placeSelect: true, updateCheck: true, autoBackup: false, backupEveryHours: 24, backupKeepDays: 14, backupKeepCount: 30, earth: 'solid', earthMargin: 5,
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
let welcomeUi = null;           // the welcome card of an empty house (set up further down)
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
let lowWalls = false;
let halfCut = false;                   // half section: every wall is cut at half height, only the lower half stays
let is2d = false;                  // legacy top-down camera flag (the real 2D editor is plan2d.js)
let plan = null;                   // 2D blueprint editor
let layoutMode = '3d';             // '3d' | '2d' | 'split'
let me = { user: '', canEdit: true, room: null, view: 'all' };
let lastStateSig = '';
let tabletRoom = null;             // room name this screen is locked to (one tablet per room)
const undoStack = [];
let saveTimer = null;

const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const floor = () => layout.floors[floorIdx];
const groundIdx = () => Math.max(0, layout.floors.findIndex((f) => f.kind !== 'basement'));   // first floor above ground
let exploded = false;                  // whole-house view with the floors pulled apart
const WALL_SEE = 0.3;                  // opacity of a wall between the camera and the room when the walls are made see-through
const EXPLODE_GAP = 2.5;               // extra space between every two floors when pulled apart (m); the lowest floor stays, all above it lift
const elev = (i = floorIdx) => {
  const k = i - groundIdx();
  return k * FLOOR_H + (houseMode && exploded ? i * EXPLODE_GAP : 0);
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
/* input fields of the side panel and the entity picker: the code lives in propfields.js and entitypicker.js */
const { field, inp, lenInput, pickerField } = initPropFields({ snapshot: () => snapshot(), changed: () => changed(), toDisp: (m) => toDisp(m), fromDisp: (v) => fromDisp(v), imperial: () => imperial() });
const { entityPicker, addEntityOptions } = initEntityPicker({ t, areas: () => areas, areaOf: () => areaOf });

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
  const wide = (v) => Math.max(v + 0.25, 0.6);                // a bigger hit box that only the live mode uses: lamps are easy to hit with a finger
  const touch = new THREE.Mesh(new THREE.BoxGeometry(wide(size.x), wide(size.y), wide(size.z)), new THREE.MeshBasicMaterial({ visible: false }));
  touch.position.copy(proxy.position);
  touch.userData.proxy = true; touch.userData.touchOnly = true;
  model.add(touch);
}

const HOLO = { fill: 0x1f6fe0, edge: 0x3df2ff, on: 0xff9d2e, onEdge: 0xffd08a, floor: 0x0a1830, floorLit: 0xff9d2e };
const GROUND_COVER = new Set(['lawn', 'terrace', 'path']);   // lie flat on the ground: never over the floors of the house
function underFloors(m) {
  m.traverse((o) => { if (o.isMesh) { o.renderOrder = -0.5; [].concat(o.material).forEach((x) => { x.depthWrite = false; }); } });
}
const OUTDOOR = new Set(['picture', 'tree', 'bush', 'pool', 'lawn', 'terrace', 'path', 'fence']);   // keep their natural colours in the hologram theme
const isHolo = () => settings.theme === 'holo';

/* ---- Room lighting: each lit lamp shines from its own position (shaders and colour scales live in roomlight.js) ---- */
const roomLightMat = (kind, alpha = 1, ghost = false) => makeRoomLightMat(kind, alpha, ghost, HOLO.floor);
const fillLights = (m, lights, k = 1) => fillRoomLights(m, lights, k, settings);
/** every placed entity as its own entry: a TV's backlight and each section of an LED ring count as devices of their own (at the section's middle) */
function entityDevices(f) {
  return f.devices.flatMap((dv) => {
    if (dv.type === 'ledring') return ringSectionsWorld(dv).map((e) => ({ ...dv, id: dv.id, seg: e.i, x: e.mid[0], z: e.mid[1], len: e.len, entity: segEntity(dv, e.i), type: 'ledseg', name: `${dv.name || t('dev.ledring')} · ${e.i + 1}` }));
    return [{ ...dv }, ...(dv.ledEntity ? [{ ...dv, entity: dv.ledEntity, type: 'tv_led', panels: undefined }] : [])];
  });
}
const roomMeshes = new Map();     // room id -> { mesh, room }

/* ---- Ground: earth around the basement with lawn on top, cut open on the camera's side like a section drawing; the code lives in earth.js ---- */
const earth = initEarth({ layout: () => layout, groundIdx: () => groundIdx(), floorH: FLOOR_H, settings: () => settings, houseMode: () => houseMode });
let plotLoop = null;                  // the plot outline: a drawing aid, only in edit mode
/** the grid is a drawing aid (never in live mode, under any ground only while drawing, on the level of the floor shown); the earth cut follows the camera */
function updateEarthCut() {
  if (grid) {
    grid.visible = !isLive() && !(earth.ground() && (houseMode || tool === 'select'));
    grid.position.y = houseMode ? 0 : elev() - 0.01;
  }
  earth.updateCut(camera.position);
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
  const { alongX, a0, a1, b0, b1, bc, h, ins } = roofFrame(bb, r);       // a = ridge axis, b = across (shared with the solar panels on the roof)
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
/** one roof (the main one, or a further one of the house): `spec` has type / pitch / overhang / dormers, `bb` is its base, `y0` lifts it onto the floor it sits on */
function drawRoof(g, bb, spec, y0, tag, holo, ghost) {
  const geo = roofGeometry(bb, spec);
  const m = new THREE.Mesh(geo, holo
    ? new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : 0.45, side: THREE.DoubleSide, depthWrite: false })
    : mat('#a4493b', ghost, { side: THREE.DoubleSide }));
  const mats = [m.material];
  if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), em)); mats.push(em); }
  m.position.y = y0; m.userData.roofPart = tag;
  g.add(m);
  const fade = (mesh, ms) => { if (!ghost) roofs.push({ mesh, mats: ms.map((x) => ({ x, base: x.opacity, transparent: x.transparent, depthWrite: x.depthWrite })), box: null }); };
  fade(m, mats);
  (spec.dormers || []).forEach((d) => {                                 // dormers (Gauben): wall, little roof and window out of one slope
    const parts = dormerParts(bb, spec, d);
    if (!parts) return;
    const part = (tris, material, edgeAngle) => {
      if (!tris.length) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
      geo.computeVertexNormals();
      const pm = new THREE.Mesh(geo, material), ms = [material];
      if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); pm.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, edgeAngle), em)); ms.push(em); }
      pm.position.y = y0; pm.userData.roofPart = tag;
      g.add(pm); fade(pm, ms);
    };
    const hm = (opacity) => new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : opacity, side: THREE.DoubleSide, depthWrite: false });
    part(parts.wall, holo ? hm(0.5) : mat('#d9d3c6', ghost, { side: THREE.DoubleSide }), 20);
    part(parts.roof, holo ? hm(0.45) : mat('#8f3b2f', ghost, { side: THREE.DoubleSide }), 20);
    part(parts.glass, new THREE.MeshBasicMaterial({ color: holo ? 0x3df2ff : 0x9fd4ff, transparent: true, opacity: ghost ? 0.2 : 0.75, side: THREE.DoubleSide, depthWrite: false }), 90);
  });
}
function partBox(p) {
  const b = p?.box;
  return b && [b.x0, b.x1, b.z0, b.z1].every(Number.isFinite) && b.x1 > b.x0 && b.z1 > b.z0 ? { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 } : null;
}
/** the roofs of roof floor i: the main one and further roofs, each with its base box and lift (also where solar panels lie, #176) */
function roofList(i) {
  const f = layout.floors[i], out = [];
  if (f?.kind !== 'roof') return out;
  const bb = roofBox(i);
  if (bb) out.push({ bb, spec: f.roof || (f.roof = { type: 'gable', pitch: 35, overhang: 0.4 }), y0: 0, tag: 'main' });
  (f.roof?.parts || []).forEach((p) => {                                  // further roofs: an annex with its own roof, on the floor it stands on
    const pb = partBox(p);
    if (!pb) return;
    const lv = layout.floors.findIndex((x) => x.id === p.level);
    out.push({ bb: pb, spec: p, y0: lv >= 0 && layout.floors[lv].kind !== 'roof' ? elev(lv + 1) - elev(i) : 0, tag: p.id || 'part' });
  });
  return out;
}
function buildRoof(g, i, f, holo, ghost) { roofList(i).forEach((R) => drawRoof(g, R.bb, R.spec, R.y0, R.tag, holo, ghost)); }
/** a solar panel on the roof floor lies on the roof surface (#176): height and tilt follow the roof under it */
function placeSolar(model, d, roofs) {
  const sol = solarPose(d, roofs);
  model.position.y = (d.y ?? 0) + sol.y;
  const deg = THREE.MathUtils.degToRad;
  model.rotation.x = sol.tilt ? sol.tilt.tiltX : deg(d.tiltX || 0); model.rotation.z = sol.tilt ? sol.tilt.tiltZ : deg(d.tiltZ || 0);
  return sol;
}
const roofs = [];                  // roofs that thin out when the camera comes close
function updateRoofFade() {
  for (const r of roofs) {
    if (!r.box) { r.mesh.updateWorldMatrix(true, false); r.box = new THREE.Box3().setFromObject(r.mesh); }
    const d = r.box.distanceToPoint(camera.position);
    const editing = !houseMode && floor()?.kind === 'roof';                                            // the roof floor is open: the roof (and its dormers) must stay clearly visible
    const k = Math.max(editing ? 0.85 : 0.12, Math.min(settings.seeThrough && !editing ? WALL_SEE : 1, (d - 2.5) / 4.5));          // fully there beyond ~7 m, mostly gone up close; with see-through walls the roof stays see-through from afar too
    r.mats.forEach((m) => { m.x.opacity = m.base * k; m.x.transparent = m.transparent || k < 0.999; m.x.depthWrite = m.depthWrite && k > 0.95; });
  }
}

function build() {
  localizeDefaults(); welcomeUi?.update();
  wake();
  plan?.render();
  clearGroup(world);
  registry.clear(); pickables.length = 0; labelSprites.clear(); cams.clear(); cutawayWalls = []; roofs.length = 0; roomMeshes.clear(); openingHandles.clear(); alertsUi.pulses.length = 0;
  const holo = isHolo();
  const iso = isolatedRoom();
  if (houseMode && settings.earth === 'off') {    // ground reference for the plot (with earth the lawn is the ground)
    const hb = houseBounds(), sz = Math.ceil(Math.max(hb.size * 2, 20) / 2) * 2;
    const grid = new THREE.GridHelper(sz, sz, holo ? HOLO.edge : 0x6c8a5c, holo ? 0x1a4fb8 : 0x88a878);
    grid.position.set(hb.cx, -0.03, hb.cz);
    grid.material.transparent = true; grid.material.opacity = 0.35;
    world.add(grid);
  }
  earth.reset(); plotLoop = null;
  const withEarth = settings.earth !== 'off' && (houseMode || floorIdx >= groundIdx()) && !iso;
  if (withEarth) { earth.build(world, holo); updateEarthCut(); }          // the house stands in the ground: lawn on top, the basement inside the earth
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
    const roofsHere = f.kind === 'roof' ? roofList(i) : null;

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
      if (!ghost && alertsUi.hasRoom(r.id)) {        // a warning in this room: the floor pulses red
        const pm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
        pm.position.y = 0.03; pm.renderOrder = 2;
        g.add(pm); alertsUi.pulses.push(pm.material);
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
      const arriving = ghost && !houseMode && (st.dir || 'up') === 'up' && i < floorIdx && floorIdx <= i + stairFloors(st);   // a stair over several floors counts for every floor it reaches
      const sGhost = ghost && !arriving;
      const sEdge = arriving && holo ? new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.95 }) : edgeMaterial;
      const sg = stairTool.build(st, holo, sGhost, sEdge);
      sg.position.set(st.x, st.dir === 'down' ? -FLOOR_H * stairFloors(st) : 0, st.z);
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
      const onRoof = roofsHere && d.type === 'solarpanel' ? solarPose(d, roofsHere) : null;
      const model = makeModel(d.type, (m) => { if (!ghost) addPickProxy(m); if (GROUND_COVER.has(d.type)) underFloors(m); if (holo && !OUTDOOR.has(d.type)) holoify(m, ghost); applyStates(); refreshSelHelper(); }, d, onRoof || undefined);
      if (d.type === 'picture') setPicture(model, d);
      model.position.set(d.x, d.y ?? 0, d.z);
      model.rotation.order = 'YXZ';                                   // turn around the vertical axis first, then tilt / roll the object itself
      model.rotation.set(THREE.MathUtils.degToRad(d.tiltX || 0), THREE.MathUtils.degToRad(d.rot || 0), THREE.MathUtils.degToRad(d.tiltZ || 0));
      if (onRoof) { placeSolar(model, d, roofsHere); model.userData.onRoof = onRoof.mount; }
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
      if (halfCut && !lowWalls && (d.y || 0) >= (f.walls[0]?.height || 2.6) * 0.5 - 0.05) { model.userData.cutHidden = true; model.visible = false; }   // half section: what hangs above the cut (ceiling lamps, LED ring, high pictures) would float in the air
      if (!ghost && !model.userData.cutHidden) pickables.push(model);
      if (d.type === 'camera' && !ghost && (d.fov ?? 90) > 0) {
        const cone = cams.addCone(d);
        g.add(cone);
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
  if (earth.cut()) {                              // garden things at ground level are cut open with the earth, so nothing lies over the basement
    layout.floors.slice(0, groundIdx() + 1).forEach((f) => f.devices.forEach((d) => {
      if (!OUTDOOR.has(d.type) || d.type === 'picture') return;
      registry.get(d.id)?.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.clippingPlanes = [earth.plane]; m.needsUpdate = true; }); });
    }));
  }
  applyStates();
  refreshSelection();
  buildNav();
  floorRail.schedule();
}

/** is this entity "on" for the glow of its device? A thermostat only while it really heats or cools (hvac_action), else by its state */
const isOnNow = (e) => { const s = states[e]; if (!s) return false; if (e.startsWith('climate.') && s.hvac) return s.hvac === 'heating' || s.hvac === 'cooling'; return ON_STATES.has(s.state); };
const ON_STATES = new Set(['on', 'open', 'playing', 'heat', 'cool', 'heat_cool', 'unlocked', 'home']);

/** texts for the value badges and state lines (badgetext.js) */
function labelText(entityId, type) { return badgeText(states[entityId], entityId, t, type); }
function stateText(entityId) { return plainStateText(states[entityId], t); }

/* ---- power add-on (#136): cables, power editor, energy overview; the code lives in power.js and powerlogic.js ---- */
const power = initPower({
  $, t, scene, camera, canvas, ray: () => ray, registry,
  layout: () => layout, states: () => states, entities: () => entities,
  getSelection: () => selection, setSelection: (s) => { selection = s; }, refreshSelection: () => refreshSelection(), renderProps: () => renderProps(),
  plan: () => plan, setStatus: (x) => setStatus(x), uid: () => uid(), snapshot: () => snapshot(), changed: () => changed(), wake: () => wake(),
  clearGroup: (g) => clearGroup(g), textSprite: (...a) => textSprite(...a),
  getTool: () => tool, setTool: (x) => setTool(x), getDeviceType: () => deviceType, setDeviceType: (v) => { deviceType = v; },
  setPaletteCat: (v) => palettes.setCat(v), rebuildPalette: () => palettes.build(),
  deleteItem: (sel) => deleteItem(sel),
  field: (...a) => field(...a), pickerField: (...a) => pickerField(...a), entityPicker: (...a) => entityPicker(...a), roomAt: (x, z) => roomAt(x, z),
});

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

/* ---- Doors, gates and windows with a contact sensor: the code lives in openings.js ---- */
const openings = initOpenings({
  $, t, layout: () => layout, states: () => states, onStates: ON_STATES, registry, pointInPoly, distToPoly, show: (target) => offline.show(target),
});
const isOpen = (entity) => openings.isOpen(entity);
const openText = (entity) => openings.openText(entity);
function applyOpenings() { openings.apply(); }
function animateOpenings() { openings.animate(); }

/* ================= Cameras (#69): cones, overview, still images; the code lives in cameras.js ================= */
const cams = initCameras({
  $, t, settings: () => settings, layout: () => layout, states: () => states, onStates: ON_STATES, pointInPoly: (...a) => pointInPoly(...a), isHolo: () => isHolo(),
  openMoreInfo: (id) => openMoreInfo(id), setStatus: (x) => setStatus(x), showDevice: (fi, id) => offline.show({ floor: fi, kind: 'device', id }), closeMenu: () => toggleMenu(camMenu, camPillBtn, false),
});

/* ================= Value badges: keep them from covering each other; the code lives in badges.js ================= */
const declutterLabels = initBadges({ settings: () => settings, labelSprites, camera, canvas });

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
  if (menu === camMenu && open) cams.renderMenu();
}
const toggleViewMenu = (open) => toggleMenu(viewMenu, viewMenuBtn, open);
viewMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleViewMenu(); });
camPillBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(camMenu, camPillBtn); });
document.addEventListener('click', (e) => { dropdowns.forEach(([m, b]) => { if (!m.hidden && !m.contains(e.target) && e.target !== b) toggleMenu(m, b, false); }); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dropdowns.forEach(([m, b]) => { if (!m.hidden) toggleMenu(m, b, false); }); });

/* ================= Floor cards (whole-house view): the code lives in floorcards.js ================= */
const floorCards = initFloorCards({
  $, t, camera, canvas, layout: () => layout, states: () => states, onStates: ON_STATES, settings: () => settings, isOpen: (e) => isOpen(e), houseMode: () => houseMode,
  layoutMode: () => layoutMode, elev: (i) => elev(i), floorH: FLOOR_H, switchFloor: (i) => switchFloor(i),
});

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
  power.update();
  cams.updateCones();
  cams.updatePill();
  floorCards.update();
  offline.update();
  alertsUi.update();
  if (!layout.floors[floorIdx]) return;
  applyOpenings();
  const bv = belowVis();
  for (let fi = 0; fi <= floorIdx; fi++) {
    const f = layout.floors[fi], ghost = fi < floorIdx;
    f.devices.forEach((d) => {
      const obj = registry.get(d.id);
      if (!obj) return;
      const on = d.entity && isOnNow(d.entity);
      const rgb = on && Array.isArray(states[d.entity]?.rgb) ? states[d.entity].rgb : null;   // lit parts take the light's colour
      obj.userData.heat?.forEach((m) => { m.emissive.set(on ? 0xff5a1a : 0x000000); m.emissiveIntensity = on ? 0.9 : 0; });   // a radiator glows while its thermostat heats
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
      obj.visible = !obj.userData.cutHidden && !(d.hideModel && isLive()) && !(d.type === 'presence' && isLive() && d.entity && !on)      // a person who is not there is not drawn in live mode
        && !power.hides(d.id);                                  // the power editor shows nothing but the power things (#174: the next state update brought them all back)          // invisible lights (LED strips ...) still shine, they just are not drawn in live mode
      const sp = labelSprites.get(d.id);
      if (sp) { sp.visible = settings.labelMode !== 'none' && obj.visible; sp.userData.setText(labelText(d.entity, d.type), isHolo() && states[d.entity]?.unit === 'W'); }
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
  if (popup.current()) popup.render();
  if (roomPanel.current() && !document.activeElement?.matches?.('#roomPanel input, #roomPanel select')) roomPanel.render();   // (renders the heating panel too)
}

/* ---- Offline devices: the code lives in offline.js ---- */
const offline = initOffline({
  $, t, layout: () => layout, entities: () => entities, states: () => states, catOf, pointInPoly: (...a) => pointInPoly(...a), currentLanguage: () => currentLanguage(),
  houseMode: () => houseMode, floorIdx: () => floorIdx, switchFloor: (i) => switchFloor(i), isLive: () => isLive(), liveSelect: (h) => liveSelect(h),
  selectLocked: (sel) => { selection = sel; lockedSel = true; refreshSelection(); },
});

/* ================= Warnings (#58) and the "Where is ...?" search (#62): the code lives in alertsui.js and search.js ================= */
const alertsUi = initAlertsUi({
  $, t, layout: () => layout, entities: () => entities, settings: () => settings, areaOf: () => areaOf, pointInPoly: (...a) => pointInPoly(...a),
  openingEntities: (o) => openingEntities(o), build: () => build(), isLive: () => isLive(), houseMode: () => houseMode, floorIdx: () => floorIdx,
  switchFloor: (i) => switchFloor(i), focusRoom: (id) => focusRoom(id), openRoomPanel: (id) => roomPanel.open(id), kioskTouched: () => kiosk.touched(),
});
const search = initSearch({
  $, t, layout: () => layout, entities: () => entities, pointInPoly: (...a) => pointInPoly(...a), houseMode: () => houseMode, floorIdx: () => floorIdx,
  switchFloor: (i) => switchFloor(i), focusRoom: (id) => focusRoom(id), focusedRoom: () => focusedRoom, openRoomPanel: (id) => roomPanel.open(id),
  isLive: () => isLive(), liveSelect: (h) => liveSelect(h), elev: (i) => elev(i), scene, camera, controls,
  selectLocked: (sel) => { selection = sel; lockedSel = true; refreshSelection(); }, wake: () => wake(),
});

/* ================= Wall tablet (#61): the code lives in kiosk.js ================= */
const kiosk = initKiosk({
  $, controls, settings: () => settings, states: () => states, isLive: () => isLive(),
  closeLivePopup: () => popup.close(), closeRoomPanel: () => roomPanel.close(), closeSearch: () => search.close(),
  tabletRoom: () => tabletRoom, findRoomByName: (n) => findRoomByName(n), switchFloor: (i) => switchFloor(i), focusRoom: (id) => focusRoom(id), focusedRoom: () => focusedRoom,
  openRoomPanel: (id) => roomPanel.open(id), groundIdx: () => groundIdx(), fitCamera: () => fitCamera(),
});

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
    const exists = (selection.kind === 'cable' && power.findCable(selection.id)) || f && [f.walls, f.rooms, f.devices, f.blocks, f.stairs, f.holes].some((l) => (l || []).some((q) => q.id === selection.id || (q.openings || []).some((o) => o.id === selection.id)));
    if (!exists) selection = null;
  }
  if (!selection) lockedSel = false;
  if (returnToTool && !selection) { const back = returnToTool; setTool(back); }   // the placed device is deselected: carry on placing
  document.body.classList.toggle('locksel', lockedSel);
  refreshSelHelper();
  renderProps();
}


/* ---- Cutaway: walls between the camera and the interior sink down (or turn see-through) so you can look inside; the code lives in cutaway.js ---- */
const cutaway = initCutaway({
  camera, elev: () => elev(), settings: () => settings, lowWalls: () => lowWalls, halfCut: () => halfCut, isLive: () => isLive(), walls: () => cutawayWalls,
  center: () => wallsCenter(), roofsCount: () => roofs.length, updateRoofFade: () => updateRoofFade(), updateEarthCut: () => updateEarthCut(), wallSee: WALL_SEE,
});
const wallCutawayInfo = (w, group) => cutaway.info(w, group);
function updateCutaway() { cutaway.update(); }

/* ---- Compass: the ring stands still, the needle turns with the camera; the code lives in compass.js ---- */
const compass = initCompass({ $, t, camera, controls });

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
  fillFloorSelect(); build(); scheduleSave(); bgUi.render(); renderFloorPanel();
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

/* ================= Houses (several floor plans): list, drop-down and buttons live in houses.js; loading a plan stays here ================= */
const hs = initHouses({ $, t, params, save: () => save(), switchHouse: (id) => switchHouse(id), alert: (x) => alert(x) });
async function switchHouse(id) {
  if (id === hs.id() && layout) return;
  if (saveTimer) await save();                                  // flush edits of the house we leave
  hs.setCurrent(id);
  try { layout = await (await fetch(hs.url())).json(); } catch { setStatus(t('loadFailed')); return; }
  normalizeLayout();
  undoStack.length = 0;
  floorIdx = groundIdx(); selection = null; lockedSel = false; focusedRoom = null; houseMode = false; document.body.classList.remove('house');   // open on the ground floor, not in the basement
  clearFocusOutline(); hs.renderUi();
  build(); fitCamera(); buildNav(true); bgUi.render(); renderFloorPanel(); renderObjList(); refreshSelection();
}
initImport({ t, lang: () => currentLanguage(), houseId: () => hs.id(), onImported: async (j) => {
  hs.add(j);
  await switchHouse(j.id);
  setStatus(t('imp.done').replace('{name}', j.name));
} });
welcomeUi = initWelcome({
  t, getLayout: () => layout, isEdit: () => !isLive(),
  draw: () => { $('#viewSplit').click(); setTool('wall'); },
  example: async () => {
    try {
      const ex = await (await fetch('api/import/examples/house')).text();
      const r = await fetch(`api/import?name=${encodeURIComponent(t('wel.exampleName'))}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ex });
      const j = await r.json();
      if (!r.ok || !j.id) throw new Error(j.error || r.status);
      hs.add(j); await switchHouse(j.id);
    } catch (err) { setStatus(`${t('loadFailed')}: ${err.message}`); }
  },
  importJson: () => $('#importOpen').click(),
});
welcomeUi.update();
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
    const r = await fetch(hs.url(), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(layout) });
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
const deviceOf = (id) => { for (const f of layout.floors) { const d = f.devices.find((v) => v.id === id); if (d) return d; } return null; };
/** in the live mode only what is linked to something can be tapped (a light, a switch, a TV with a backlight, an LED ring with lights) */
const tappable = (id) => { const d = deviceOf(id); return !!d && !!(d.entity || d.ledEntity || (d.segs || []).some((s) => s.entity)); };
function pickHit(e) {
  setRay(e);
  let hits = [];
  for (const h of ray.intersectObjects(pickables, true)) {
    if (h.object.userData.touchOnly && !isLive()) continue;                                      // the big finger box is for the live mode only
    let o = h.object, seg = h.object.userData.seg;
    while (o && !o.userData.kind) { o = o.parent; seg ??= o?.userData.seg; }
    if (o && isLive() && o.userData.kind === 'opening') continue;                                // doors and windows have no hit box in the live mode: nobody needs to tap them
    if (o && o.userData.kind === 'device' && power.hides(o.userData.id)) continue;                  // the power editor: only power things are picked
    if (o && o.userData.cone && !isLive()) continue;                                              // the cone is only for tapping in live mode
    if (o && o.userData.kind === 'device' && isLive() && (stealth(o.userData.id) || !tappable(o.userData.id))) continue;      // an invisible light, or a thing that is linked to nothing, cannot be tapped
    if (o) hits.push({ data: seg != null ? { ...o.userData, seg } : o.userData, point: h.point, distance: h.distance });   // seg: which LED ring section was tapped
  }
  if (power.isMode()) return power.pick(e, hits);                    // the power editor: nothing but power devices and cables can be hit
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
      new THREE.BoxGeometry(openingPreview.width ?? def.width, def.height, w.thickness + 0.06),
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
  if (deviceType === 'kitchenrun') Object.assign(d, { legs: DEFAULT_LEGS(), upper: true, depth: 0.6 });
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
const WALL_TYPES = new Set(['picture', 'tv_wall', 'mirror', 'walllamp', 'radiator', 'towelrad', 'panel_tri', 'panel_hex', 'panel_sq', 'panel_bar', 'nanoleaf', 'tv_led', 'camera', 'thermostat', 'switch', 'inverter', 'powermeter', 'fusebox', 'wallbox', 'gasmeter', 'heatmeter']);
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
  const width = fitOpeningWidth(wall, def.width);
  if (width === null) return null;
  const pos = clampOpeningPos(wall, width, raw);
  if (pos === null) return null;
  return { wall, pos, width, valid: !openingOverlaps(wall, pos, width, ignoreId) };
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
  } else if (tool === 'cable') {
    const h = pickHit(e);
    if (h?.data.kind === 'device') power.cableClick(h.data.id);
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
      const o = { id: uid(), type: openingType, pos: tgt.pos, ...def, width: tgt.width ?? def.width };
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
  if (kind === 'cable') {
    if (power.deleteCable(id)) { if (selection?.id === id) selection = null; changed(); }
    return;
  }
  if (itemOf(kind, id)?.locked) { setStatus(t('prop.lockedHint')); return; }
  const f = floor();
  if (kind === 'wall') f.walls = f.walls.filter((x) => x.id !== id);
  if (kind === 'room') f.rooms = f.rooms.filter((x) => x.id !== id);
  if (kind === 'device') { f.devices = f.devices.filter((x) => x.id !== id); power.dropCablesTo(id); }
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
  if (k === 'enter' && plan?.hasDraft() && (tool === 'room' || tool === 'block' || tool === 'plot' || tool === 'hole' || tool === 'stairs')) { plan.finishRoom(); return; }
  if (k === 'escape') { plan?.cancel(); endDrawing(); popup.close(); setStatus(''); if (bgUi.mode()) bgUi.setMode(null); if (lockedSel) releaseLock(); return; }
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

/* ================= Live control: the code lives in livecontrols.js (switching, light controls, scenes), livepopup.js and roompanel.js ================= */
const live = initLiveControls({
  t, states: () => states, entities: () => entities, areas: () => areas, floor: () => floor(), entityDevices: (f) => entityDevices(f), pointInPoly,
  onStates: ON_STATES, setStatus: (x) => setStatus(x), afterService: () => { if (!liveOk) setTimeout(pollStates, 400); },   // with the live channel the new state arrives by itself
  canEdit: () => me.canEdit, settings: () => settings, saveEffectColors: () => saveEffectColors(), canMoreInfo, openMoreInfo,
});
const popup = initLivePopup({
  $, t, live, floor: () => floor(), findOpening: (id) => findOpening(id), stateText: (id) => stateText(id), openText: (e) => openText(e), cams,
  settings: () => settings, pointInPoly, states: () => states, onStates: ON_STATES,
});
const roomPanel = initRoomPanel({
  $, t, live, floor: () => floor(), states: () => states, entities: () => entities, areas: () => areas, entityDevices: (f) => entityDevices(f), pointInPoly,
  onStates: ON_STATES, imperial: () => imperial(), stateText: (id) => stateText(id), cams, settings: () => settings,
  openings: { entities: (o) => openingEntities(o), kind: (o) => openKind(o), KINDS: OPEN_KINDS, pane: (o, i) => paneEntity(o, i), isOpen: (e) => isOpen(e), text: (e) => openText(e) },
  closeLivePopup: () => popup.close(), leaveFocus: () => { if (focusedRoom) focusRoom(null); },
});
function handleLiveTap(e) { liveSelect(pick(e)); }
function liveSelect(h) {
  if (h?.kind === 'device' || h?.kind === 'opening') popup.show(h.id, h.seg ?? null);
  else if (h?.kind === 'room') {
    popup.close();
    if (focusedRoom === h.id) { leaveRoomView(); return; }                      // a second tap into the same room: back to the view before
    if (focusedRoom === null) roomBackView = { room: h.id, house: houseMode, floor: floorIdx, pos: camera.position.clone(), target: controls.target.clone() };
    focusRoom(h.id); roomPanel.open(h.id);
  }
  else popup.close();
}
function leaveRoomView() {
  const back = roomBackView && roomBackView.room === focusedRoom ? roomBackView : null;
  roomBackView = null;
  roomPanel.close();
  if (!back) { focusRoom(null); return; }
  if (back.house) setHouseMode(true); else if (floorIdx !== back.floor || houseMode) switchFloor(back.floor); else focusRoom(null);
  camera.position.copy(back.pos); controls.target.copy(back.target); controls.update();
}
async function saveEffectColors() {
  Object.values(states).forEach((v) => { v.rgb = fxRgb(v.fxc) || v.rgbRaw; });
  applyStates();
  await settingsStore.save();
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

/* ================= Tools, views, mode ================= */
function setTool(next) {
  if (next !== 'select') { lockedSel = false; returnToTool = null; }
  power.cancelCable();
  tool = next; endDrawing(); plan?.reset(); document.body.dataset.tool = next; setStatus('');
  if (bgUi.mode()) bgUi.setMode(null);
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
  $('#floorPanel').scrollIntoView({ block: 'start', behavior: 'smooth' });
});
$('#importBtn').addEventListener('click', () => $('#importOpen').click());
const toolbarUi = initToolbar({ t });

function setMode(next) {
  mode = next;
  if (power.isMode() && next === 'live') power.setMode(false);
  document.body.classList.toggle('live', isLive());
  document.querySelectorAll('#modeSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.mode === next));
  popup.close(); roomPanel.close(); selection = null; lockedSel = false; plan?.reset();
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
/** centre of the walls of the floor shown. Garden things and lamps outside the house must not pull it away: it decides which walls face the camera (see-through / lowering) */
function wallsCenter() {
  const f = floor();
  if (isolatedRoom() || !f.walls.length) return floorBounds();
  const pts = f.walls.flatMap((w) => [w.a, w.b]);
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cz: (Math.min(...zs) + Math.max(...zs)) / 2 };
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
  $('#seeToggle').classList.toggle('active', !!settings.seeThrough);
}
function setLowWalls(v) {
  lowWalls = v;
  updateNavToggles();
  build();
}
$('#saveBtn').addEventListener('click', save);

/* ================= Floors, rooms, navigation pills ================= */
let focusedRoom = null;
let roomBackView = null;               // the view before a tap zoomed into a room (floor / whole house, camera), so a second tap can go back
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
  if (focusedRoom) items.push(pill(t('nav.allRooms'), false, () => { toggleMenu(menu, btn, false); focusRoom(null); roomPanel.close(); }, '', ' all'));
  let lastFloor = null;
  entries.forEach(({ r, fl, fi }) => {
    if (houseMode && fl !== lastFloor) { const hd = document.createElement('div'); hd.className = 'rmHead'; hd.textContent = fl.name; items.push(hd); lastFloor = fl; }
    items.push(pill(r.name, r.id === focusedRoom, () => {
      toggleMenu(menu, btn, false);
      if (houseMode) { switchFloor(fi); focusRoom(r.id); roomPanel.open(r.id); return; }
      const off = r.id === focusedRoom; focusRoom(off ? null : r.id); if (off) roomPanel.close(); else roomPanel.open(r.id);
    }, occupied(r, fl) ? t('nav.occupied') : '', occupied(r, fl) ? ' occupied' : ''));
  });
  menu.replaceChildren(...items);
  $('#navSep').hidden = !rooms.length;
  floorRail.build();
  renderPlanFloorsChip();
  updateHouseToggle();
}

/* ================= Floor rail: side bar with a thumbnail per floor; the code lives in floorrail.js ================= */
const floorRail = initFloorRail({
  $, t, layout: () => layout, floorIdx: () => floorIdx, houseMode: () => houseMode, isHolo: () => isHolo(), settings: () => settings,
  roofBox: (i) => roofBox(i), switchFloor: (i) => switchFloor(i), setHouseMode: (on) => setHouseMode(on),
});

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
  if (focusedRoom) { focusRoom(null); roomPanel.close(); }
  else { switchFloor(room.floor); focusRoom(room.room.id); roomPanel.open(room.room.id); }
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
  floorCards.update(); updateExplodeToggle();
}
function switchFloor(i) {
  houseMode = false; document.body.classList.remove('house'); floorCards.update(); updateExplodeToggle();
  floorIdx = i; selection = null; lockedSel = false; focusedRoom = null; endDrawing(); popup.close(); roomPanel.close();
  clearFocusOutline(); build(); fitCamera(); refreshSelection();
  if (bgUi.mode()) bgUi.setMode(null); else bgUi.render();
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
  if (obj?.userData.onRoof) placeSolar(obj, d, roofList(floorIdx));   // follows the roof while it is moved (the mount itself changes on the next build)
  const sp = labelSprites.get(d.id);
  if (sp) sp.position.set(d.x, sp.position.y, d.z);
  cams.cones.get(d.id)?.mesh.position.set(d.x, 0, d.z);          // the field of view of a camera moves with it
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
/* ---- Floor panel: name, kind, order, basement / roof, the roof with its dormers and further roofs; the code lives in floorpanel.js ---- */
const floorPanel = initFloorPanel({
  $, t, layout: () => layout, floor: () => floor(), floorIdx: () => floorIdx, setFloorIdx: (i) => { floorIdx = i; }, fields: { field, inp, lenInput },
  snapshot: () => snapshot(), build: () => build(), fitCamera: () => fitCamera(), buildNav: (force) => buildNav(force), renderObjList: () => renderObjList(),
  scheduleSave: () => scheduleSave(), switchFloor: (i) => switchFloor(i), clearSelection: () => { selection = null; }, roofBox: (i) => roofBox(i),
  autoRoofBox: (i) => autoRoofBox(i), groundIdx: () => groundIdx(), uid: () => uid(),
});
function renderFloorPanel() { floorPanel.render(); }
const addFloorOf = (kind) => floorPanel.addFloorOf(kind);
const moveFloor = (dir) => floorPanel.moveFloor(dir);
/* Automatic rooms (#17): one room for every closed loop of walls that is not a room yet */
$('#autoRooms').addEventListener('click', () => {
  const f = floor(), found = detectRooms(f.walls, f.rooms);
  if (!found.length) { setStatus(t('rooms.none')); return; }
  snapshot();
  found.forEach((r) => f.rooms.push({ id: uid(), name: `${t('prop.room')} ${f.rooms.length + 1}`, color: '#8a7f70', points: r.points }));
  changed();
  setStatus(t('rooms.found', { n: found.length }));
});
document.querySelectorAll('#modeBar button[data-vm]').forEach((b) => b.addEventListener('click', () => {
  viewMode = b.dataset.vm;
  document.querySelectorAll('#modeBar button[data-vm]').forEach((x) => x.classList.toggle('active', x === b));
  applyStates();
}));
$('#autoToggle').addEventListener('click', () => {
  $('#setCutaway').checked = !settings.cutaway;
  commitSettings();
});
$('#seeToggle').addEventListener('click', () => {
  $('#setSeeThrough').checked = !settings.seeThrough;
  commitSettings();
});

/* ================= Palettes: devices, custom models; the code lives in palettes.js ================= */
const palettes = initPalettes({ $, t, getType: () => deviceType, setType: (k) => { deviceType = k; }, alert: (x) => alert(x) });
/* ================= Placeholder blocks and stairs: the code lives in blocks.js and stairtool.js ================= */
const floorOpenings = (i) => floorOpeningsOf(layout.floors, i, FLOOR_H);
const blocks = initBlocks({
  $, t, layout: () => layout, floor: () => floor(), floorIdx: () => floorIdx, setFloorIdx: (i) => { floorIdx = i; }, snapshot: () => snapshot(), changed: (...a) => changed(...a),
  setStatus: (x) => setStatus(x), select: (sel) => { selection = sel; }, uid: () => uid(), plan: () => plan, fillFloorSelect: () => fillFloorSelect(),
});
const stairTool = initStairTool({
  $, t, settings: () => settings, layout: () => layout, floor: () => floor(), floorIdx: () => floorIdx, floorH: FLOOR_H, snapshot: () => snapshot(), changed: (...a) => changed(...a),
  select: (sel) => { selection = sel; }, setTool: (x) => setTool(x), plan: () => plan, uid: () => uid(), mat: (...a) => mat(...a),
  ui: { field: (...a) => field(...a), inp: (...a) => inp(...a), lenInput: (...a) => lenInput(...a) },
});

/* ================= Background image (template to trace): the code lives in background.js ================= */
const bgUi = initBackground({
  $, t, floor: () => floor(), plan: () => plan, snapshot: () => snapshot(), changed: (...a) => changed(...a), setStatus: (x) => setStatus(x),
  imperial: () => imperial(), fromDisp: (v) => fromDisp(v), fmtLen: (m) => fmtLen(m), field: (...a) => field(...a), inp: (...a) => inp(...a), lenInput: (...a) => lenInput(...a), alert: (x) => alert(x),
});

document.querySelectorAll('#openingPalette button').forEach((b) => b.addEventListener('click', () => {
  openingType = b.dataset.opening;
  document.querySelectorAll('#openingPalette button').forEach((x) => x.classList.toggle('active', x === b));
}));

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

/* ================= Properties panel: the code lives in props.js (fields per object type), objlist.js (object list),
   roomentities.js (entities of the selected room), propfields.js (input fields) and entitypicker.js ================= */
function releaseLock() {                 // back to the room (if the object came from its list) or to no selection
  lockedSel = false;
  selection = roomCtx && floor()?.rooms.some((r) => r.id === roomCtx) ? { kind: 'room', id: roomCtx } : null;
  refreshSelection();
}
const objList = initObjList({
  $, t, floor: () => floor(), isLive: () => isLive(), selection: () => selection, locked: () => lockedSel, lockTo: (sel) => { selection = sel; lockedSel = true; refreshSelection(); },
  releaseLock: () => releaseLock(), registry, tool: () => tool, setTool: (x) => setTool(x), itemOf: (k, id) => itemOf(k, id), snapshot: () => snapshot(), changed: () => changed(),
  renderProps: () => renderProps(), plan: () => plan, pointInPoly,
});
const roomEnts = initRoomEntities({
  $, t, floor: () => floor(), roomCtx: () => roomCtx, selection: () => selection, locked: () => lockedSel, lockTo: (sel) => { selection = sel; lockedSel = true; refreshSelection(); },
  select: (sel) => { selection = sel; }, releaseLock: () => releaseLock(), refreshSelection: () => refreshSelection(), entityDevices: (f) => entityDevices(f), pointInPoly,
  stateText: (id) => stateText(id), areas: () => areas, areaOf: () => areaOf, openingEntities: (o) => openingEntities(o), classify, entityInfo: (id) => entityInfo(id),
  autoPlace: (room, ids) => autoPlace(room, ids), setStatus: (x) => setStatus(x), snapshot: () => snapshot(), changed: () => changed(), uid: () => uid(),
  deviceY: (type) => DEVICE_TYPES[type]?.y || 0,
});
const props = initProps({
  $, t, floor: () => floor(), isLive: () => isLive(), selection: () => selection, roomCtx: () => roomCtx, setRoomCtx: (id) => { roomCtx = id; },
  fields: { field, inp, lenInput, pickerField }, entityPicker: (...a) => entityPicker(...a), entities: () => entities, areas: () => areas,
  findOpening: (id) => findOpening(id), snapshot: () => snapshot(), changed: () => changed(), build: () => build(), refreshSelection: () => refreshSelection(),
  deleteItem: (sel) => deleteItem(sel), applyStates: () => applyStates(), setStatus: (x) => setStatus(x), renderObjList: () => renderObjList(),
  renderRoomEntities: () => renderRoomEntities(), stateText: (id) => stateText(id), roomAt: (x, z) => roomAt(x, z), pointInPoly, controlsTarget: () => controls.target,
  wallTypes: WALL_TYPES, ledLike: LED_LIKE, catOf, baseDims: (type) => baseDims(type), snapToWall: (...a) => snapToWall(...a), editNano: (d) => editNano(d),
  uploadPicture: (f, d) => uploadPicture(f, d), floorH: FLOOR_H, power: () => power, stairTool: () => stairTool, fmtLen: (m) => fmtLen(m), toDisp: (m) => toDisp(m), imperial: () => imperial(),
});
function renderObjList() { objList.render(); }
function renderRoomEntities() { roomEnts.render(); }
function renderEntState() { props.renderEntState(); }
function renderProps() { props.render(); }

/* ================= Settings: form, loading, saving and the users dialog live in settings.js (tablet rows and colour scales in settingsui.js);
   applying them to the house and the view stays here ================= */
const settingsUi = initSettingsUi({
  $, t, settings: () => settings, defaults: DEFAULT_LOOK, layout: () => layout, houses: () => hs.list(), houseId: () => hs.id(), houseName: () => hs.current()?.name || '', commit: () => commitSettings(),
});
const settingsStore = initSettings({
  $, t, get: () => settings, set: (next) => { settings = next; }, ui: settingsUi, toDisp: (m) => toDisp(m), fromDisp: (v) => fromDisp(v), layout: () => layout,
  entities: () => entities, perfStored, perfKey: PERF_KEY, setStatus: (x) => setStatus(x), alert: (x) => alert(x), reload: () => location.reload(),
  committed: (prev) => {
    if (prev.lowWalls !== settings.lowWalls) lowWalls = settings.lowWalls;
    if (Math.abs(settings.wallHeight - prev.wallHeight) > 1e-6) {        // the wall height applies to every wall, not only to new ones
      snapshot();
      layout.floors.forEach((f) => f.walls.forEach((w) => { w.height = settings.wallHeight; }));
      changed();
    }
    applySettings(prev);
    build();
  },
});
const loadSettings = () => settingsStore.load();
const commitSettings = () => settingsStore.commit();
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
  palettes.build(); fillEntities($('#entitySearch').value); renderProps();
  $('#hintText').textContent = isLive() ? t('hint.live') : t(`hint.${tool}`);
  updateNavToggles(); buildNav(true);
  applyStates();
}
const backupsUi = initBackups({ t, commitSettings });
initVersion({ t, active: () => !isLive() && !!settings.updateCheck });
$('#housePanel').addEventListener('toggle', async () => {
  if (!$('#housePanel').open) return;
  if (!settingsStore.loaded()) await loadSettings();
  settingsStore.fill();
  backupsUi.refresh();
});

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

const toState = (e) => ({ since: e.since, state: e.state, unit: e.unit, brightness: e.brightness, position: e.position, rgb: effRgb(e), rgbRaw: e.rgb, dc: e.dc, ct: e.ct, hvac: e.hvac, tt: e.tt, tmin: e.tmin, tmax: e.tmax, tstep: e.tstep, modes: e.modes, ch: e.ch, fx: e.fx, fxc: e.fxc, members: e.members });

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

/** the add-on creates "Erdgeschoss" for a brand-new house: show it in the language of the user as long as nothing is drawn */
function localizeDefaults() {
  const f = layout.floors?.[0];
  if (layout.floors.length === 1 && f && f.name === 'Erdgeschoss' && !f.walls?.length && !f.rooms?.length && !f.devices?.length && !f.blocks?.length) f.name = t('floor.default');
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
  snapshot, commit: () => changed(), deleteItem, rebuild3d: () => build(), calibrate: (a, b) => bgUi.calibrate(a, b),
  bgChanged: () => bgUi.render(), floorH: () => FLOOR_H, ghostFloors: () => ghostFloors(), addBlock: blocks.addBlock, addHole: blocks.addHole, setPlot: blocks.setPlot, placeStair: (x, z) => stairTool.place(x, z), getStairTemplate: () => ({ id: 'tpl', ...stairTool.template() }), placeWallStair: (pts) => stairTool.placeWall(pts), wallStairDraft: (pts) => stairTool.wallDraft(pts),
  moveDeviceTo: (d, x, z) => moveDeviceTo(d, x, z), isItemLocked: (k, id) => !!itemOf(k, id)?.locked,
 
  liveMoveDevice: (d) => liveMove(d),
  liveTap: (h) => liveSelect(h),
  deviceDoubleClick: (id) => deviceEntities(floor().devices.find((v) => v.id === id)).forEach(quickAction),
  allDevices: () => layout.floors.flatMap((f, fi) => f.devices.map((d) => ({ d, fi }))), floorIndex: () => floorIdx, floorName: (i) => layout.floors[i]?.name || '',
  powerMode: () => power.isMode(), showCables: () => power.cablesShown(), isPowerType: (type) => power.isType(type), cablesOf: (d) => power.cablesOf(d), cableColor: (d, c) => power.cableColor(d, c), cableClick: (id) => power.cableClick(id),
  newDevice, findOpening, projectOnWall, clampOpeningPos, openingOverlaps, fitOpeningWidth, OPENING_DEFAULTS, uid, pointInPoly,
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
  await hs.load();
  try { layout = await (await fetch(hs.url())).json(); } catch { setStatus(t('loadFailed')); }
  normalizeLayout();
  floorIdx = groundIdx();                                 // start on the ground floor, not in the basement
  hs.renderUi();
  await palettes.loadModels();
  applySettings();
  fillFloorSelect(); fillEntities(); setTool('select'); resize(); build(); fitCamera(); bgUi.render(); renderFloorPanel();
  if (params.get('mode') === 'live' || params.get('kiosk') || tabletRoom || !me.canEdit) setMode('live');
  if (tabletRoom) {
    const hit = findRoomByName(tabletRoom);
    if (hit) { switchFloor(hit.floor); focusRoom(hit.room.id); roomPanel.open(hit.room.id); }
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
  if (cams.pulse(now)) wake();   // a camera sees movement
  const pulsing = alertsUi.animate(now), finding = search.animate(now);       // pulsing warnings and the search ring move
  if (pulsing || finding || controls.autoRotate) wake();
  controls.update();
  updateCutaway();
  compass.update();
  animateOpenings();
  power.animate(now);
  selHelper?.update();
  declutterLabels();
  floorCards.place();
  renderer.render(scene, camera);
}
init();
animate();

/* Test hook: only active with ?debug=1, used by the browser tests to find objects on screen. */
if (params.get('debug')) {
  window.__fp = {
    openRoomPanel(id) { roomPanel.open(id); },
    powerLinks: () => power.links(),
    powerInfo: () => power.info(),
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
    get layout() { return layout; }, settings: () => settings, offline: () => offline.devices(), alerts: () => alertsUi.list(), alertPulsing: () => alertsUi.pulses.length, kioskTick: () => kiosk.tick(), kioskIdle: (ms) => kiosk.idle(ms), autoRotate: () => controls.autoRotate, findItems: (q) => search.findItems(q), navArrows: () => [!$('#navLeft').hidden, !$('#navRight').hidden], navBar: () => navBar,
    renderer, scene, frame: () => { const t0 = performance.now(); controls.update(); updateCutaway(); animateOpenings(); selHelper?.update(); const t1 = performance.now(); renderer.render(scene, camera); return [t1 - t0, performance.now() - t1]; },
    houseId: () => hs.id(),
    coneScreen(id) {                                          // screen point in the middle of a camera cone (for tests)
      const v = cams.coneCenter(id);
      if (!v) return null;
      v.project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    elev: (i) => elev(i),
    roofMeshes: () => { const out = []; scene.traverse((o) => { if (o.userData?.roofPart) { const w = new THREE.Vector3(); o.getWorldPosition(w); out.push({ tag: o.userData.roofPart, y: +w.y.toFixed(3) }); } }); return out; },
    heatGlow: (id) => registry.get(id)?.userData.heat?.[0]?.emissiveIntensity ?? -1,
    cutInfo: () => cutawayWalls.map((c) => ({ id: c.group.userData.id, n: c.n, fade: c.fade ?? 1, low: c.low })), camAt: (x, y, z, tx = controls.target.x, tz = controls.target.z) => { controls.target.set(tx, controls.target.y, tz); camera.position.set(x, y, z); controls.update(); },   // for tests
    liveHitAt: (x, y) => { const h = pickHit({ clientX: x, clientY: y }); return h ? { kind: h.data.kind, id: h.data.id } : null; },
    touchSize: (id) => { let m = 0; registry.get(id)?.children.forEach((c) => { if (c.userData.touchOnly) { c.geometry.computeBoundingBox(); const s = c.geometry.boundingBox.getSize(new THREE.Vector3()); m = Math.min(s.x, s.y, s.z); } }); return m; },
    addRoofForTest: () => { layout.floors.push(newFloor('roof', 'Dach', uid())); build(); }, camFar: () => { camera.position.set(controls.target.x, 60, controls.target.z + 60); controls.update(); }, roofFactor: () => Math.max(...roofs.flatMap((r) => r.mats.map((m) => m.x.opacity / (m.base || 1)))),
    liveTapRoom: (id) => liveSelect({ kind: 'room', id }), focusedRoom: () => focusedRoom, cam: () => camera.position.toArray(),   // for tests
    select(kind, id) { selection = { kind, id }; refreshSelection(); },
    houseCards: () => [...document.querySelectorAll('.floorCard')].map((e) => e.innerText),
    rebuild: () => build(), applyStates: () => applyStates(),
    switchHouse,
    paneTargets: (id) => (registry.get(id)?.userData.panePivots || []).map((p) => p.userData.target),
    liveOk: () => liveOk,
    underFloors: (id) => { let ok = false; registry.get(id)?.traverse((o) => { if (o.isMesh) ok = o.renderOrder < 0 && [].concat(o.material).every((m) => !m.depthWrite); }); return ok; },
    bounds: () => floorBounds(), roofBox: (i) => roofBox(i),
    switchFloor: (i) => switchFloor(i),
    blockOpen: (id) => { const sh = [].concat(registry.get(id)?.geometry?.parameters?.shapes || []); return sh.length > 1 || sh.some((x) => x.holes.length > 0); },
    solidShape: (id) => { let ok = false; registry.get(id)?.traverse((o) => { if (o.isMesh && [].concat(o.material).some((m) => !m.transparent || m.opacity > 0.3)) ok = true; }); return ok; },
    clipped: (id) => { let n = 0; registry.get(id)?.traverse((o) => { if (o.material && [].concat(o.material).some((m) => m.clippingPlanes?.includes(earth.plane))) n++; }); return n; },
    earthDbg: () => ({ n: earth.plane.normal.toArray(), c: earth.plane.constant, solid: earth.lawn(), cut: earth.cut(), capVisible: !!earth.info()?.cap.visible, capVerts: earth.info()?.cap.geometry.getAttribute('position')?.count || 0, gridShown: !!grid?.visible, box: earth.box(), ground: earth.ground() }),
    stateOf: (e) => states[e]?.state,
    fakeState(e, st, unit) { states[e] = { ...(states[e] || {}), state: st, ...(unit ? { unit } : {}) }; applyOpenings(); },
    has: (id) => registry.has(id),
    badge: (id) => labelSprites.get(id)?.userData.text ?? null,
    devPose: (id) => { const o = registry.get(id); if (!o) return null; o.updateWorldMatrix(true, true); const n = new THREE.Vector3(0, 1, 0).applyQuaternion(o.getWorldQuaternion(new THREE.Quaternion())), sz = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()); return { y: +o.getWorldPosition(new THREE.Vector3()).y.toFixed(3), n: n.toArray().map((v) => +v.toFixed(3)), mount: o.userData.onRoof || null, size: [+sz.x.toFixed(2), +sz.z.toFixed(2)] }; },
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
