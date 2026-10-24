import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { initImport } from './import.js';
import { initToolbar, TOOLS } from './toolbar.js';
import { decorate as decorateTools, markGroups } from './toolicons.js';
import { DEFAULT_LEGS } from './kitchen.js';
import { initAlertsUi } from './alertsui.js';
import { initSearch } from './search.js';
import { initBackups } from './backups.js';
import { initVersion } from './version.js';
import { initPower } from './power.js';
import { initEnergyUi } from './energyui.js';
import { initEnergyFlow } from './energyflowui.js';
import { energyBalance } from './energycalc.js';
import { initCompass } from './compass.js';
import { initOffline } from './offline.js';
import { initBadges } from './badges.js';
import { initKiosk } from './kiosk.js';
import { cardOptions, initCardMode } from './cardmode.js';
import { initPhoneMenu, phoneView } from './phonemenu.js';
import { initPhoneNav } from './phonenav.js';
import { initPhoneStatus, PHONE_QUERY } from './phonestatus.js';
import { initCameras } from './cameras.js';
import { initFloorCards, columnZoom } from './floorcards.js';
import { initFloorRail } from './floorrail.js';
import { initHouses } from './houses.js';
import { initSettingsUi } from './settingsui.js';
import { initStartView } from './startview.js';
import { initBackground } from './background.js';
import { initPalettes } from './palettes.js';
import { floorOpenings as floorOpeningsOf, initBlocks } from './blocks.js';
import { initStairTool } from './stairtool.js';
import { initLiveControls } from './livecontrols.js';
import { initLivePopup } from './livepopup.js';
import { initRoomPanel, roomOpenings, roomOpeningSpans } from './roompanel.js';
import { initSheetView, roomViewDist } from './sheetview.js';
import { initPropFields } from './propfields.js';
import { initEntityPicker } from './entitypicker.js';
import { initObjList } from './objlist.js';
import { initRoomEntities } from './roomentities.js';
import { initProps } from './props.js';
import { initOpenings, openKind, OPEN_KINDS, paneEntity, openingEntities } from './openings.js';
import { linkedEntities } from './shutters.js';
import { initCutaway } from './cutaway.js';
import { initSettings } from './settings.js';
import { initFloorPanel, newFloor } from './floorpanel.js';
import { hexVec, colorFromStops, roomLightMat as makeRoomLightMat, fillLights as fillRoomLights } from './roomlight.js';
import { paintFloor } from './floortex.js';                                      // floor coverings (#427)
import { initFacadeUi } from './finishui.js';                                    // the facade in the settings (#448)
import { sweepTextures } from './finishtex.js';                                   // finishes of floors and walls (#448)
import { initRoomLabels } from './roomlabels.js';
import { lampLights, lampRgb } from './lamplight.js';
import { initEarth } from './earth.js';
import { initSky } from './skyui.js';
import { roomReading, roomEntityIds, roomSummary } from './roomtiles.js';
import { initRoomTiles } from './roomtilesui.js';
import { initLightGroups } from './lightgroupsui.js';
import { initFavorites } from './favoritesui.js';
import { initWelcome } from './welcome.js';
import { openNanoEditor, DEFAULT_PANELS } from './nanoleaf.js';
import { canMoreInfo, openMoreInfo } from './moreinfo.js';
import { planPlacement, classify } from './autoplace.js';
import { RING_DEFAULT_INSET } from './ledring.js';
import { sectionEntity, pieceEntities, entityDevices as placedEntities, switchEntities } from './ledzones.js';
import { DEVICE_TYPES, catOf, makeModel, isCustom, baseSize } from './models.js';
import {
  OPENING_DEFAULTS, wallLength, projectOnWall, clampOpeningPos, openingOverlaps, fitOpeningWidth,
} from './walls.js';
import { t, setLanguage, applyI18n, currentLanguage } from './i18n.js';
import { createPlan } from './plan2d.js';
import polygonClipping from './vendor/polygon-clipping.js';
import { detectRooms, distToPoly, polyArea } from './rooms.js';
import { initRoofs } from './roofs.js';
import { syncDormerWindows, openingWalls, dormerWindows, eaveOntoWall } from './dormerwin.js';
import { coverRoofFloor } from './attic.js';
import { initPlanRotate } from './planview.js';
import { initMultiSelect } from './multisel.js';
import { initNeighbors } from './neighbor.js';
import { WALL_TYPES, LED_LIKE, snapPoint, snapToWall as snapOnWall, ringAround } from './placement.js';
import { initNav, floorBoundsOf, houseBoundsOf, wallsCenterOf, findRoomByName as findRoomIn } from './nav.js';
import { stopMove as stopAtWalls, STOP_EXEMPT_BASE } from './collide.js';
import { badgeText, stateText as plainStateText } from './badgetext.js';
import { toWorld, stairHandles } from './stairs.js';
import { floorLabels, CARD_FIELDS } from './viewprefs.js';
import { applyLocks, lockedSettings } from './userlocks.js';
import { initTabsUi } from './tabsui.js';
import { initFullscreen } from './fullscreenui.js';
import { initCameraPage } from './pagecameras.js';
import { initEnergyPage } from './pageenergy.js';
import { initTodayPage } from './pagetoday.js';
import { initClimatePage } from './pageclimate.js';
import { initRoutinesPage } from './pageroutines.js';
import { initFamilyPage } from './pagefamily.js';
import { initMediaPage } from './pagemedia.js';
import { initHouseholdPage } from './pagehousehold.js';
import { initMediaPrefs } from './mediaprefs.js';
import { placeOf } from './guard.js';
import { initPinboard } from './pinboardui.js';
import { initRoutinePrefs } from './routineprefs.js';
import { initDashboards } from './dashboards.js';
import { meterPart } from './energymetersui.js';
import { initTodayPrefs } from './todayprefs.js';
import { initPresencePrefs } from './presenceprefs.js';
import { initVoiceUi } from './voiceui.js';
import { initVoicePrefs } from './voiceprefs.js';
import { initVoiceCheck } from './voicecheck.js';
import { initTapBalls } from './tapballs.js';
import { initLiveChannel, fetchAreas, fetchBatteries } from './livechannel.js';
import { initDeviceList } from './devicelist.js';
import { initTimeline } from './timelineui.js';
import { replayEntities } from './timeline.js';
import { initPersist } from './persist.js';
import { initFloorBuild, OUTDOOR } from './floorbuild.js';
import { initEditItems } from './edititems.js';
import { initUndoToast } from './undotoast.js';
import { initShortcuts } from './shortcuts.js';
import { initClipboard } from './clipboard.js';
import { initEnergySetup } from './energysetup.js';
import { initNotifyUi } from './notifyui.js';
import { initSetGroups } from './setgroups.js';
import { initGuardUi } from './guardui.js';
import { viewOf, floorHas, roofOwner, roomOwners, pickBuilding, inheritedBuilding } from './buildings.js';
import { initBuildingsUi } from './buildingsui.js';
import { initPicking } from './picking.js';
import { initPictures } from './picture.js';
import { initDraw3d } from './draw3d.js';
import { frameDue, shadowDue } from './frameloop.js';
import { initPerfHud } from './perfhud.js';
import { floorsMode, floorElev, hasSlab, isCovered, underRoof, drawnFloors, liveFloors, initHouseFloors } from './housefloors.js';
import { initHouseLoad } from './houseload.js';
import { roofRects, moveRoof, tagRoofMeshes, panelsOn, setRoofBox, stepTarget } from './roofmove.js';
import { defaultSettings, startup, toDisp as toDispOf, fromDisp as fromDispOf, fmtLen as fmtLenOf } from './appstate.js';
import { pointInPoly, inIso } from './roomclip.js';
import { HOLO, ringLook } from './modelfx.js';
import { textSprite as makeTextSprite, labelRes } from './labels.js';
import { heatMode, heatLook, paintHeat, pillTone, RUNNING } from './heating.js';
import { initOfflineMarks, offlineMarks } from './offlinemarks.js';
import { fxRgb as fxRgbOf, toState as toStateOf } from './entitystate.js';
import { normalizeLayout as normalizeLayoutOf, localizeDefaults as localizeDefaultsOf } from './layoutnorm.js';
import { initRenames } from './renames.js';
import { initMeasureTool } from './measuretool.js';
import { initLogin } from './login.js';
window.fp3dBooted = true;           // every module is loaded: the boot guard (bootguard.js) stands down (#328)

/* ================= State ================= */
const FLOOR_H = 3.0;
const params = new URLSearchParams(location.search);
const card = cardOptions(params);         // opened by the dashboard card (#13, cardmode.js): its options, else null

let settings = defaultSettings();      // the stored settings come over these (appstate.js)
const DEFAULT_LOOK = defaultSettings();
let layout = { version: 1, floors: [] };
let floorIdx = 0;
let returnToTool = null;          // after placing a device the Select tool is active for one click, then this tool comes back
let welcomeUi = null;           // the welcome card of an empty house (set up further down)
let mode = 'edit';                 // 'edit' | 'live'
let tool = 'select';
let roomCtx = null;                // room whose entity list stays visible while one of its objects is selected
let lockedSel = false;            // selected from the side list: only that object reacts to the mouse
let selection = null;              // { kind: 'wall'|'room'|'device'|'opening', id }
let multiSel = null;               // Shift + click: several things at once (#211), see multisel.js
let deviceType = 'light';
let openingType = 'door';
let entityChoice = '';
let entities = [];
let areas = [];                      // Home Assistant areas: [{id, name, entities[]}]
let areaOf = {};                     // entity_id -> area id
let batteryOf = {};                  // entity_id -> the battery entity of its device (#376, the device overview)
let offReasons = new Map();          // device / opening id -> why it is offline (offline.js), for the device overview
const fxRgb = (name) => fxRgbOf(name, settings.effectColors);            // the colour of a light effect (entitystate.js)
let states = {};                   // entity_id -> { state, unit }
let replayBack = null;             // security view: the mode and live states from before (timelineui.js), null while live
let lowWalls = false;
let halfCut = false;                   // half section: every wall is cut at half height, only the lower half stays
let is2d = false;                  // legacy top-down camera flag (the real 2D editor is plan2d.js)
let plan = null;                   // 2D blueprint editor
let layoutMode = '3d';             // '3d' | '2d' | 'split'
let me = { user: '', canEdit: true, room: null, view: 'all' };
let locks = new Set();                                    // what this user may not use (userlocks.js, from api/me)
let tabletRoom = null;             // room name this screen is locked to (one tablet per room)

const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const floor = () => layout.floors[floorIdx];
const groundIdx = () => Math.max(0, layout.floors.findIndex((f) => f.kind !== 'basement'));   // first floor above ground
const WALL_SEE = 0.3;                  // opacity of a wall between the camera and the room when the walls are made see-through
/** height of floor i; the whole-house view can pull the floors apart or stack them like a real house (setting houseFloors, housefloors.js) */
const elev = (i = floorIdx) => floorElev(i, groundIdx(), FLOOR_H, floorsMode(settings, houseMode));
/** how clearly the floors below the open one show: dimmed (the setting), fully (stacked) */
const belowVis = () => (settings.belowMode === 'stacked' ? 1 : settings.belowVisibility);
let houseMode = false;                 // "whole house" view: every floor solid, nothing ghosted
const isLive = () => mode === 'live';

/* unit helpers – data is always stored in meters */
const imperial = () => settings.units === 'imperial';
const toDisp = (m) => toDispOf(m, imperial());       // metres <-> what is shown (appstate.js)
const fromDisp = (v) => fromDispOf(v, imperial());
const fmtLen = (m) => fmtLenOf(m, imperial());
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
renderer.shadowMap.autoUpdate = false;                           // the sun stands still: shadows are drawn again only after a change (markShadows, #253)
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
    if (o.material) [].concat(o.material).forEach((m) => { for (const k of ['map', 'alphaMap', 'emissiveMap']) if (!m[k]?.userData.shared) m[k]?.dispose?.(); });   // the floor patterns are shared (#427)
  });
  g.clear();
}
const temp = new THREE.Group();
scene.add(world, temp);
let selHelper = null;
let sheetView = null;               // phones: shifts the picture above the room sheet (set up with the room panel)

function resize() {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
  sheetView?.apply();                  // the phone's room sheet: keep the picture shifted to the new size
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
  // a drawing aid in 3D only (the snapping uses settings.grid): lines at least 50 cm apart and see-through, else the many fine lines melt
  // into a dark floor that hides the lawn when seen from further away (#320)
  const size = 60, div = Math.round(size / Math.max(settings.grid, 0.5));
  grid = new THREE.GridHelper(size, isHolo() ? 60 : div, c.gridA, c.gridB);
  [].concat(grid.material).forEach((m) => { m.transparent = true; m.opacity = isHolo() ? 0.28 : 0.45; m.depthWrite = false; });
  scene.add(grid);
}

/* ================= Scene from data ================= */
const registry = new Map();       // id -> Object3D
const pickables = [];
const labelSprites = new Map();   // device id -> sprite
const tapBalls = initTapBalls({ ceiling: () => settings.wallHeight || 2.6, deviceClass: (e) => states[e]?.dc,
  labelsIn: (g) => [...labelSprites.values()].filter((sp) => sp.parent === g && sp.visible && !sp.userData.atWindow).map((sp) => sp.position) });   // live mode: a ball over everything that can be tapped (#238); a shutter's label is over its own ball (#335)
const openingHandles = new Map();   // opening id -> { mesh, outline }: unscaled hit boxes that stay usable when the wall is lowered
let cutawayWalls = [];            // { group, mid:[x,z], n:[nx,nz] } for the active floor

function mat(color, ghost, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.85, metalness: 0.05, transparent: ghost || extra.opacity < 1,
    ...extra, opacity: ghost ? Math.min(0.25, extra.opacity ?? 0.25) : (extra.opacity ?? 1),
  });
}

/** a text label in the scene: plain, as a dark pill on a device or as a glowing badge (labels.js) */
function textSprite(text, opts) { return makeTextSprite(text, renderer.capabilities.getMaxAnisotropy(), { res: labelRes(LOW), ...opts }); }
const isHolo = () => settings.theme === 'holo';

/* ---- Room lighting: each lit lamp shines from its own position (shaders and colour scales live in roomlight.js) ---- */
const roomLightMat = (kind, alpha = 1, ghost = false) => makeRoomLightMat(kind, alpha, ghost, HOLO.floor);
const fillLights = (m, lights, k = 1) => fillRoomLights(m, lights, k, settings);
/** every placed entity as its own entry: a TV's backlight, each section of an LED ring and each LED zone with its own entity (ledzones.js) */
let placedMemo = null;                     // while the states are applied: the devices of each floor worked out once, not again for every room (#494)
const entityDevices = (f) => {
  if (placedMemo?.has(f)) return placedMemo.get(f);
  const v = placedEntities(f.devices, t('dev.ledring'), (d, key) => `${d.name || t(`dev.${d.type}`)} · ${t(`led.${key}`)}`);
  placedMemo?.set(f, v);
  return v;
};
const roomMeshes = new Map();     // room id -> { mesh, room }

/* ---- Ground: earth around the basement with lawn on top, cut open on the camera's side like a section drawing; the code lives in earth.js ---- */
const earth = initEarth({ layout: () => shownLayout(), groundIdx: () => groundIdx(), floorH: FLOOR_H, settings: () => settings, houseMode: () => houseMode });
const sky = initSky({ $, t, canvas, params, settings: () => settings, states: () => states, isLive: () => isLive(), isHolo: () => isHolo(),   // sky and weather (#418, #419), skyui.js
  low: () => perfParam === 'low', earthTint: (c) => earth.setTint(c) });
let plotLoop = null;                  // the plot outline: a drawing aid, only in edit mode
/** the grid is a drawing aid (never in live mode, under any ground only while drawing, on the level of the floor shown); the earth cut follows the camera */
function updateEarthCut() {
  if (grid) {
    grid.visible = !isLive() && !(earth.ground() && (houseMode || tool === 'select'));
    grid.position.y = houseMode ? 0 : elev() - 0.01;
  }
  earth.updateCut(camera.position);
}



/** Isolation: while a room is focused only that room, its walls and its devices are drawn (clipping in roomclip.js). */
function isolatedRoom() { return focusedRoom ? floor()?.rooms.find((r) => r.id === focusedRoom) ?? null : null; }
/* ---- Several buildings in one plan (#409): the plan as the building shown sees it, worked out at every build (buildings.js); what is drawn,
 *  framed and listed comes from it, what is edited stays the plan itself. The switch and the panel live in buildingsui.js ---- */
let view = null, owners = null, roofViews = new Map();
function refreshView() {
  const b = buildingsUi?.shown();
  owners = b ? roomOwners(layout) : null;
  view = b ? viewOf(layout, b, owners) : null;
  roofViews = new Map();
}
const shownLayout = () => view || layout;
const shownFloor = () => shownLayout().floors[floorIdx];
/** a roof is drawn: it belongs to the building shown or to all of them */
function roofShown(i, R) {
  const b = buildingsUi?.shown(), f = layout.floors[i];
  if (!b || !f) return true;
  const o = roofOwner(layout, i, R.tag === 'main' ? f.roof : R.spec, R.bb, owners || roomOwners(layout));
  return o === null || o === b;
}
/** the floors the main roof of roof floor i takes its size from: those of its own building, or of the building shown (null: all) */
function roofFloors(i) {
  const b = pickBuilding(layout, layout.floors[i]?.roof?.building) || buildingsUi?.shown();
  if (!b) return null;
  if (!roofViews.has(b)) roofViews.set(b, viewOf(layout, b, owners || roomOwners(layout)).floors);
  return roofViews.get(b);
}
/** floor i has something of the building shown (its buttons show), the open floor always (strict: also the open floor only then) */
function floorShown(i, strict = false) {
  if (!view || (i === floorIdx && !strict)) return true;
  const vf = view.floors[i];
  return floorHas(vf) || (vf?.kind === 'roof' && roofList(i).some((R) => roofShown(i, R)));
}
/** a room drawn while one building is shown belongs to it (unless the floors above or below give it another one); known: the rooms there were */
let knownRooms = new Set();
const roomIds = () => new Set(layout.floors.flatMap((f) => (f.rooms || []).map((r) => r.id)));
function claimNewRooms() {
  const b = buildingsUi?.shown();
  if (b) layout.floors.forEach((f, fi) => (f.rooms || []).forEach((r) => {
    if (!knownRooms.has(r.id) && !r.building && [null, b].includes(inheritedBuilding(layout, fi, r))) r.building = b;
  }));
  knownRooms = roomIds();
}
let buildingsUi = null;


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

/* ---- Roofs: roof box, roof surfaces with dormers and further roofs, terrace railing, solar panels on the roof, fading; the code lives in roofs.js ---- */
const roofsUi = initRoofs({
  layout: () => layout, elev: (i) => elev(i), mat: (...a) => mat(...a), HOLO, camera: () => camera, settings: () => settings, wallSee: WALL_SEE,
  roofShown: (i, R) => roofShown(i, R), roofFloors: (i) => roofFloors(i),
  editingRoof: () => !houseMode && floor()?.kind === 'roof',     // the roof floor is open: the roof (and its dormers) must stay clearly visible
});
const roofBox = (i) => roofsUi.box(i), autoRoofBox = (i) => roofsUi.autoBox(i), roofList = (i) => roofsUi.list(i);
/* moving roofs on the open roof floor (#255); the code lives in roofmove.js */
const roofRectsHere = () => roofRects(floor(), autoRoofBox(floorIdx));
const roofRectOf = (id) => roofRectsHere().find((r) => r.id === id) || null;
function moveRoofBy(id, dx, dz) { return moveRoof(floor(), id, dx, dz, autoRoofBox(floorIdx)); }
const roofParts = new Map();          // roof id -> its drawn meshes (the roof and its dormers) on the open roof floor
/** while a roof is dragged (#257): only the drawn roof and the solar panels on it move; the house is built again once, when it is let go */
function dragRoofBy(id, dx, dz) {
  const r = roofRectOf(id);
  if (!r) return false;
  const panels = panelsOn(floor(), r.box);
  if (!moveRoofBy(id, dx, dz)) return false;
  (roofParts.get(id) || []).forEach((m) => { m.position.x += dx; m.position.z += dz; });
  panels.forEach((d) => liveMove(d));
  markShadows(); refreshSelHelper();
  return true;
}
function updateRoofFade() { roofsUi.updateFade(); }
/* ---- Neighbour house (#220): another house of the list drawn next to this one; the code lives in neighbor.js ---- */
const neighbors = initNeighbors({
  $, t, houses: () => hs.list(), houseId: () => hs.id(), label: (h) => hs.label(h), layout: () => layout, floorH: FLOOR_H, mat: (...a) => mat(...a), HOLO,
  bridges: () => layout.floors.flatMap((f, i) => (f.devices || []).filter((d) => d.type === 'bridge').map((d) => ({ d, y: elev(i) }))),
  camera: () => camera, settings: () => settings, wallSee: WALL_SEE, snapshot: () => snapshot(), changed: () => changed(), build: () => build(), fields: { field, lenInput, inp },
});

/* a floor in 3D: room floors, floor opening rims, blocks, stairs, walls and devices; the code lives in floorbuild.js */
const floorBuild = initFloorBuild({
  settings: () => settings, floorIdx: () => floorIdx, topView: () => is2d, imperial: () => imperial(), belowVis: () => belowVis(), fast: () => LOW,
  mat: (...a) => mat(...a), roomLightMat: (...a) => roomLightMat(...a), textSprite: (...a) => textSprite(...a), railing: (...a) => roofsUi.railing(...a),
  lowWalls: () => lowWalls, roomMeshes, alerts: { hasRoom: (id) => alertsUi.hasRoom(id), get pulses() { return alertsUi.pulses; } },
  registry, pickables, floorOpenings: (i) => floorOpenings(i), floorH: FLOOR_H, holoEdge: HOLO.edge,
  houseMode: () => houseMode, halfCut: () => halfCut, elev: (i) => elev(i), stairMesh: (...a) => stairTool.build(...a),
  cutawayInfo: (w, wg) => wallCutawayInfo(w, wg), openingHandle: (w, o, g) => makeOpeningHandle(w, o, g), cutawayWalls: () => cutawayWalls,
  makeModel: (...a) => makeModel(...a), setPicture: (m, d) => setPicture(m, d), placeSolar: (...a) => roofsUi.placeSolar(...a),
  tapBalls, cams: { addCone: (d) => cams.addCone(d) }, labelSprites, modelLoaded: () => { applyStates(); refreshSelHelper(); },
  roomName: (f, id, sp) => roomLabels.nameSprite(f, id, sp),
});
function build() {
  localizeDefaults(); welcomeUi?.update();
  wake();
  refreshView();
  plan?.render();
  clearGroup(world);
  registry.clear(); pickables.length = 0; roofParts.clear(); labelSprites.clear(); tapBalls.clear(); offMarks.clear(); cams.clear(); cutawayWalls = []; roofsUi.reset(); roomMeshes.clear(); openingHandles.clear(); alertsUi.pulses.length = 0; roomLabels.clear();
  syncDormerWindows(layout.floors, roofList, elev, uid);   // dormer windows are real windows on the floor they belong to (dormerwin.js)
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
  const stacked = floorsMode(settings, houseMode) === 'stacked' && !iso;   // like a real house: ceilings between the floors (housefloors.js)
  const drawn = drawnFloors(layout.floors.length, floorIdx, houseMode, settings.belowMode === 'hidden');
  layout.floors.forEach((_, i) => {
    const f = shownLayout().floors[i];           // only the building shown (#409)
    if (i > floorIdx && !houseMode) return;
    if (iso && i < floorIdx) return;            // no floors below while isolated
    if (!houseMode && settings.belowMode === 'hidden' && i < floorIdx) return;   // floors below hidden by choice
    const ghost = (i < floorIdx && !houseMode) || (houseMode && f.kind === 'basement' && settings.earth !== 'solid');   // with solid earth the cut shows the basement as it is
    const labelsHere = floorLabels(settings, i, floorIdx, houseMode);   // the floors below can do without their names and labels (#249)
    const edgeMaterial = holo ? new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.08 + 0.55 * belowVis() : 0.95 }) : null;
    const g = new THREE.Group();
    g.position.y = elev(i);
    world.add(g);
    const holes = floorOpenings(i);
    const stack = stacked ? { covered: isCovered(layout.floors, i, drawn.top), slab: hasSlab(layout.floors, i, drawn.lowest), upTo: underRoof(layout.floors, i) ? roofBox(i + 1) : null } : null;
    if (stack?.covered) Object.assign(g.userData, { covered: true, ceiling: settings.wallHeight || 2.6 });   // its balls and labels stay in its rooms
    if (f.kind === 'roof' && !iso) {
      roofsUi.build(g, i, f, holo, ghost);
      if (!ghost && !houseMode && i === floorIdx) tagRoofMeshes(g, f, (m, id) => { pickables.push(m); if (!registry.has(id)) registry.set(id, m); roofParts.set(id, [...(roofParts.get(id) || []), m]); });   // the roofs of the open roof floor can be picked and moved (#255)
    }
    const roofsHere = f.kind === 'roof' ? roofList(i) : null;

    const part = { holo, ghost, iso, labels: labelsHere, holes, stack };   // rooms, floor opening rims and blocks: floorbuild.js
    floorBuild.slab(g, f, i, { ...part, edge: edgeMaterial });
    floorBuild.rooms(g, f, part);
    floorBuild.holeRims(g, f, part);
    floorBuild.blocks(g, f, i, part);

    floorBuild.stairs(g, f, i, { ...part, edge: edgeMaterial });   // stairs and walls: floorbuild.js
    floorBuild.walls(g, f, i, { ...part, edge: edgeMaterial, roofClip: roofsUi.wallClip(i) });   // under the roof the walls follow the slope (#260)

    floorBuild.devices(g, f, { ...part, roofs: roofsHere });       // devices, tap balls, camera cones, value labels: floorbuild.js
    floorBuild.inside(g, part);
  });
  const overRi = houseMode ? -1 : coverRoofFloor(layout.floors, floorIdx);   // the roof over the floor shown (not drawn yet: it is a floor above), see-through
  if (iso ? overRi >= 0 && roofsUi.overRoom(overRi, floorIdx, iso.points) : overRi > floorIdx) { const g = new THREE.Group(); g.position.y = elev(overRi); world.add(g); roofsUi.over(g, overRi, iso ? iso.points : null, holo); }   // a focused room: only the part over it, and only under a slope or a dormer (#306)
  if (!iso) neighbors.build(world, { upTo: houseMode ? Infinity : elev(floorIdx), holo });   // the neighbour house next to this one (#220)
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
  sweepTextures();                                // pictures of finishes no longer shown are freed when there are many (#448)
}

/** is this entity "on" for the glow of its device? A thermostat only while it really heats or cools (hvac_action), else by its state */
const isOnNow = (e) => { const s = states[e]; if (!s) return false; if (e.startsWith('climate.') && s.hvac) return RUNNING.has(s.hvac); return ON_STATES.has(s.state); };   // a thermostat / an air conditioner: while it runs (heating.js)
const ON_STATES = new Set(['on', 'open', 'playing', 'heat', 'cool', 'heat_cool', 'dry', 'fan_only', 'unlocked', 'home']);

/** texts for the value badges and state lines (badgetext.js) */
function labelText(entityId, type) { return badgeText(states[entityId], entityId, t, type); }
function stateText(entityId) { return plainStateText(states[entityId], t, entityId); }

/* ---- power add-on (#136): cables, power editor, energy overview; the code lives in power.js and powerlogic.js ---- */
const power = initPower({
  $, t, scene, camera, canvas, ray: () => picking.ray, registry,
  layout: () => layout, states: () => states, entities: () => entities,
  getSelection: () => selection, setSelection: (s) => { selection = s; }, refreshSelection: () => refreshSelection(), renderProps: () => renderProps(),
  plan: () => plan, setStatus: (x) => setStatus(x), uid: () => uid(), snapshot: () => snapshot(), changed: () => changed(), wake: () => wake(),
  clearGroup: (g) => clearGroup(g), textSprite: (...a) => textSprite(...a),
  getTool: () => tool, setTool: (x) => setTool(x), getDeviceType: () => deviceType, setDeviceType: (v) => { deviceType = v; },
  setPaletteCat: (v) => palettes.setCat(v), rebuildPalette: () => palettes.build(),
  deleteItem: (sel) => deleteItem(sel),
  field: (...a) => field(...a), pickerField: (...a) => pickerField(...a), entityPicker: (...a) => entityPicker(...a), roomAt: (x, z) => roomAt(x, z),
});
/* the tab "⚡ Rechnung" of the power editor (#378): which sensor is what and how it is counted; the code lives in energyui.js and energycalc.js */
/* the top of the tab: take over the energy dashboard of Home Assistant, the setup check list (energysetup.js, #407) */
const energySetup = initEnergySetup({
  $, t, layout: () => layout, states: () => states, entities: () => entities, snapshot: () => snapshot(), changed: () => changed(false),
  refresh: () => power.update(), rerender: () => energyUi.render(), floor: () => floor(), center: () => floorBounds(), uid, setStatus,
  deviceY: (type) => DEVICE_TYPES[type]?.y || 0, onWall: (d) => { if (WALL_TYPES.has(d.type)) snapToWall(d, 100); }, placed: () => changed(),
});
const energyFlow = initEnergyFlow({ $, t, settings: () => settings, states: () => states, layout: () => layout,   // the energy flow as a picture (#420), energyflowui.js
  low: () => perfParam === 'low', toggleCables: () => power.toggle(), commitSettings: () => commitSettings(), cablesShown: () => power.cablesShown() });
const energyUi = initEnergyUi({
  $, t, layout: () => layout, states: () => states, entities: () => entities, areaOf: () => areaOf, pointInPoly: (...a) => pointInPoly(...a),
  entityPicker: (...a) => entityPicker(...a), pickerField: (...a) => pickerField(...a), snapshot: () => snapshot(), changed: () => changed(false), refresh: () => power.update(),
  setup: energySetup, meterPart,                          // the meters of the page ⚡ Energie (#481, energymetersui.js)
});

let viewMode = 'normal';           // normal | temp | humid | co2 (room colouring by sensor values)
const VIEW_STOPS = { temp: ['tempStops', '°C'], humid: ['humidStops', '%'], co2: ['co2Stops', 'ppm'] };
/* Temperature / humidity / CO₂ of a room: average of every matching sensor placed in it or assigned to its HA area (roomtiles.js) */
function roomHeat(room, f) {
  const v = roomReading(roomEntityIds(room, entityDevices(f), areaEntitiesOf(room)), states, viewMode);
  return v === null ? null : colorFromStops(settings[VIEW_STOPS[viewMode][0]], v);
}
const areaEntitiesOf = (room) => (room.area ? areas.find((x) => x.id === room.area)?.entities || [] : []);
/* favourites (#471): buttons in front of the room tiles, ☆ on a device's card, the list in ⚙ → "Quick access"; favoritesui.js */
const favorites = initFavorites({ $, t, settings: () => settings, states: () => states, ready: () => entities.length > 0, entities: () => entities,
  nameOf: (e) => entities.find((x) => x.entity_id === e)?.name, callService: (e, svc) => live.callService(e, svc),
  canEdit: () => me.canEdit, save: () => settingsStore.save(), changed: () => roomTiles.update(), commit: () => commitSettings() });
/* light groups (#471): "💡 n an" at the top, the whole house or a group of rooms off with two taps; lightgroupsui.js */
const isLit = (e) => ON_STATES.has(states[e]?.state);
const lightGroups = initLightGroups({ $, t, layout: () => shownLayout(), plan: () => layout, settings: () => settings, placed: (f) => entityDevices(f),
  areaEntities: areaEntitiesOf, isOn: isLit, callService: (e, svc) => live.callService(e, svc), canEdit: () => me.canEdit, setStatus: (x) => setStatus(x),
  occupied: (r, f) => roomSummary(r, f, { placed: entityDevices(f), areaEntities: areaEntitiesOf(r), states, isOn: isLit, isOpen: (e) => isOpen(e), openingEntities: (o) => openingEntities(o) }).occupied,
  openSettings: () => openSettingsAt('quick'), commit: () => commitSettings(), isOpen: () => !$('#lightsMenu').hidden, close: () => toggleMenu($('#lightsMenu'), $('#lightsPill'), false) });
const roomTiles = initRoomTiles({ $, t, layout: () => shownLayout(), floorIdx: () => floorIdx, houseMode: () => houseMode, focusedRoom: () => focusedRoom,   // room tiles (#421), roomtilesui.js
  settings: () => settings, states: () => states, isLive: () => isLive(), placed: (f) => entityDevices(f), areaEntities: areaEntitiesOf,
  isOn: (e) => ON_STATES.has(states[e]?.state), isOpen: (e) => isOpen(e), openingEntities: (o) => openingEntities(o), commitSettings: () => commitSettings(),
  lang: () => currentLanguage(), imperial: () => settings.units === 'imperial',
  openRoom: (fi, id) => { if (houseMode) { switchFloor(fi); focusRoom(id); roomPanel.open(id); } else liveSelect({ kind: 'room', id }); }, goLive: () => setMode('live'), favorites });
const roomLabels = initRoomLabels({ $, t, layout: () => shownLayout(), floorIdx: () => floorIdx, houseMode: () => houseMode, focusedRoom: () => focusedRoom,   // labels over the rooms (#430), roomlabels.js
  settings: () => settings, states: () => states, isLive: () => isLive(), view3d: () => layoutMode !== '2d', elev: (i) => elev(i), camera, canvas,
  placed: (f) => entityDevices(f), areaEntities: areaEntitiesOf, isOn: (e) => ON_STATES.has(states[e]?.state), isOpen: (e) => isOpen(e),
  openingEntities: (o) => openingEntities(o), commitSettings: () => commitSettings(), lang: () => currentLanguage(), imperial: () => settings.units === 'imperial',
  quiet: (q) => tapBalls.quiet(q), changed: () => applyStates(), openRoom: (id) => liveSelect({ kind: 'room', id }), goLive: () => setMode('live') });

/* ---- Doors, gates and windows with a contact sensor: the code lives in openings.js ---- */
const openings = initOpenings({
  $, t, layout: () => shownLayout(), states: () => states, onStates: ON_STATES, registry, pointInPoly, distToPoly, show: (target) => offline.show(target),
  tapBalls, isLive: () => isLive(), floorIdx: () => floorIdx, labelSprites, labelsOn: () => settings.labelMode !== 'none' && !roomLabels.quiet(),   // the balls and labels of the windows' roller shutters (#331); not while the room labels show (#430, the whole house: #464)
});
const isOpen = (entity) => openings.isOpen(entity);
const openText = (entity) => openings.openText(entity);
function applyOpenings() { openings.apply(); }
function animateOpenings() { return openings.animate(); }

/* ================= Cameras (#69): cones, overview, still images; the code lives in cameras.js ================= */
const cams = initCameras({
  $, t, settings: () => lockedSettings(settings, [...locks]), layout: () => layout, states: () => states, onStates: ON_STATES, pointInPoly: (...a) => pointInPoly(...a), isHolo: () => isHolo(),
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
/* ---- the 2D plan turns with the 3D view (in 2D + 3D, switchable, #212); the code lives in planview.js ---- */
const planRotate = initPlanRotate({ $, plan: () => plan, camera, controls, layoutMode: () => layoutMode });
$('#planFloorsToggle').addEventListener('click', cyclePlanFloors);
$('#planFloorsBtn').addEventListener('click', cyclePlanFloors);

/* ================= Top bar: view menu (Auto, half section, pull apart, walls) and the cameras overview ================= */
const viewMenu = $('#viewMenu'), viewMenuBtn = $('#viewMenuBtn'), camMenu = $('#camMenu'), camPillBtn = $('#camPill');
$('#roomMenuBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleMenu($('#roomMenu'), $('#roomMenuBtn')); });
const dropdowns = [[viewMenu, viewMenuBtn], [camMenu, camPillBtn], [$('#roomMenu'), $('#roomMenuBtn')], [$('#lightsMenu'), $('#lightsPill')]];       // only one of the drop-downs is open at a time
function toggleMenu(menu, btn, open = menu.hidden) {
  dropdowns.forEach(([m, b]) => { const on = m === menu && open; m.hidden = !on; b.classList.toggle('active', on); b.setAttribute('aria-expanded', String(on)); });
  if (menu === camMenu && open) cams.renderMenu();
  if (menu.id === 'lightsMenu' && open) lightGroups.render();
  lightGroups.update();                     // "💡 n an" stays while its list is open, also with no light on
}
$('#lightsPill').addEventListener('click', (e) => { e.stopPropagation(); toggleMenu($('#lightsMenu'), $('#lightsPill')); });
/** the settings with one group open (the light list's "Set up groups") */
function openSettingsAt(group) {
  $('#settingsBtn').click();
  const g = $(`#settingsDialog details[data-group="${group}"]`);
  if (g) { g.open = true; g.scrollIntoView({ block: 'start' }); }
}
const toggleViewMenu = (open) => toggleMenu(viewMenu, viewMenuBtn, open);
viewMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleViewMenu(); });
camPillBtn.addEventListener('click', (e) => { e.stopPropagation(); if (tabsUi.has('cameras')) tabsUi.show('cameras'); else toggleMenu(camMenu, camPillBtn); });   // with the tab bar: its camera page
document.addEventListener('click', (e) => { dropdowns.forEach(([m, b]) => { if (!m.hidden && !m.contains(e.target) && e.target !== b) toggleMenu(m, b, false); }); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dropdowns.forEach(([m, b]) => { if (!m.hidden) toggleMenu(m, b, false); }); });

/* ================= Tab bar at the bottom (#479): the house and pages beside it; the code lives in tabs.js, tabsui.js and page*.js ================= */
/** a room of a page (Klima, an own card "Raum"): to the house, its floor, the room open */
const openRoomAt = (fi, id) => { tabsUi.show('house'); if (houseMode || fi !== floorIdx) switchFloor(fi); if (focusedRoom !== id) liveSelect({ kind: 'room', id }); };
const dash = initDashboards({                                    // the pages arranged by an admin, own cards and pages (#484, dashboards.js)
  $, t, lang: () => currentLanguage(), settings: () => settings, save: () => settingsStore.save(), canEdit: () => me.canEdit,
  states: () => states, entities: () => entities, areas: () => areas, nameOf: (e) => entities.find((x) => x.entity_id === e)?.name, stateText: (e) => stateText(e),
  callService: (e, svc, data) => live.callService(e, svc, data), layout: () => shownLayout(), placed: (f) => entityDevices(f), areaEntities: areaEntitiesOf,
  isOn: (e) => ON_STATES.has(states[e]?.state), isOpen: (e) => isOpen(e), openingEntities: (o) => openingEntities(o), openRoom: openRoomAt,
  camImage: (e) => cams.camImage(e, 'oc-img'), openCamera: (e) => { camPage.big(e); tabsUi.show('cameras'); },
  builtin: (k) => todayPage.card(k.split(':')[1]), tabsUi: () => tabsUi,
  live: () => live,                                              // a lamp's controls in the window of a button card (#495)
  me: () => me, refill: () => settingsStore.fill(),              // the own versions of a page per user (#507)
});
const board = dash.board;
const camPage = initCameraPage({
  t, el: $('#tabPages [data-page=cameras]'), cams, layout: () => layout, settings: () => lockedSettings(settings, [...locks]), board,
  showDevice: (fi, id) => { tabsUi.show('house'); offline.show({ floor: fi, kind: 'device', id }); },
});
const namesOf = (re) => Object.fromEntries(entities.filter((e) => re.test(e.entity_id)).map((e) => [e.entity_id, e.name]));
const pinboard = initPinboard({ t, lang: () => currentLanguage(), changed: () => { if (tabsUi.open() === 'today') todayPage.update(); if (tabsUi.open() === 'family') familyPage.changed(); } });   // the pinboard (#483, pinboardui.js)
const todayPage = initTodayPage({                                // ☀ Heute (pagetoday.js, today.js)
  t, el: $('#tabPages [data-page=today]'), lang: () => currentLanguage(), settings: () => settings, states: () => states, layout: () => layout,
  names: () => namesOf(/^(person|alarm_control_panel)\./),
  summary: () => ({ open: openings.items().map((x) => x.name), lights: lightGroups.count(), low: deviceList.low(),
    offline: offline.devices().filter((x) => x.reason !== 'unlinked').length }),
  act: (k) => todayAct(k), pinboard, family: () => tabsUi.has('family'), board,
});
const climatePage = initClimatePage({                            // 🌡 Klima (pageclimate.js, climate.js, #483)
  t, el: $('#tabPages [data-page=climate]'), lang: () => currentLanguage(), settings: () => settings, states: () => states, layout: () => shownLayout(),
  placed: (f) => entityDevices(f), areaEntities: areaEntitiesOf, isOpen: (e) => isOpen(e), nameOf: (e) => entities.find((x) => x.entity_id === e)?.name,
  callService: (e, svc, data) => live.callService(e, svc, data), openRoom: openRoomAt, board, thermo: dash.thermo,   // the thermostat as a circle (#495)
});
const routinesPage = initRoutinesPage({                          // ▶ Abläufe (pageroutines.js, routines.js, #483)
  t, el: $('#tabPages [data-page=routines]'), states: () => states, settings: () => settings, canEdit: () => me.canEdit,
  names: () => namesOf(/^(scene|script|button|input_button|media_player|lock|automation)\./),
  openNames: () => openings.items().map((x) => x.name), litLights: () => lightGroups.lit(),
  callService: (e, svc, data) => live.callService(e, svc, data), board,
});
const roomOf = (e) => placeOf(layout, e)?.room || areas.find((a) => a.id === areaOf[e])?.name || '';   // the room of a device: in the plan, else its area
const mediaPage = initMediaPage({                                // 🎵 Musik & TV (pagemedia.js, media.js, #490)
  t, el: $('#tabPages [data-page=media]'), states: () => states, names: () => namesOf(/^media_player\./), roomOf, settings: () => settings,
  canEdit: () => me.canEdit, callService: (e, svc, data) => live.callService(e, svc, data), board,
});
const householdPage = initHouseholdPage({                        // 🧺 Haushalt (pagehousehold.js, household.js, #490)
  t, el: $('#tabPages [data-page=household]'), lang: () => currentLanguage(), states: () => states, names: () => namesOf(/^vacuum\./),
  callService: (e, svc, data) => live.callService(e, svc, data), locked: () => locks.has('control'), builtin: (k) => todayPage.card(k),
  changed: () => tabsUi.update(), board,
});
const familyPage = initFamilyPage({                              // 👨‍👩‍👧 Familie with the pinboard (pagefamily.js, family.js, #483)
  t, el: $('#tabPages [data-page=family]'), lang: () => currentLanguage(), states: () => states, names: () => namesOf(/^person\./), pinboard, board,
  presence: () => settings.presence,                                                            // who is really at home (#495)
  rooms: () => shownLayout().floors.flatMap((f) => (f.rooms || []).filter((r) => r.name).map((r) => ({ name: r.name,
    occupied: roomSummary(r, f, { placed: entityDevices(f), areaEntities: areaEntitiesOf(r), states, isOn: isLit, isOpen: (e) => isOpen(e), openingEntities: (o) => openingEntities(o) }).occupied }))),
});
const energyPage = initEnergyPage({                              // ⚡ Energie (pageenergy.js, energyhistory.js)
  t, el: $('#tabPages [data-page=energy]'), lang: () => currentLanguage(), layout: () => layout, houseId: () => hs.id(),
  houses: () => hs.list().map((h) => ({ id: h.id, name: hs.label(h) })), changed: () => tabsUi.update(), board, states: () => states,
  nameOf: (e) => entities.find((x) => x.entity_id === e)?.name,
});
/** a tap on a row of "Im Haus" on the page ☀ Heute: to the house and what the row is about (the power: to the page ⚡ Energie) */
function todayAct(k) {
  if (k === 'power' && tabsUi.has('energy')) { tabsUi.show('energy'); return; }
  if (k === 'family') { tabsUi.show('family'); return; }                       // the pinboard card (#483)
  tabsUi.show('house');
  setTimeout(() => {                                              // after the tap: the drop-downs close on a tap outside of them
    if (k === 'open') { openings.renderList(); $('#openDialog').showModal(); }
    else if (k === 'lights') toggleMenu($('#lightsMenu'), $('#lightsPill'), true);
    else if (k === 'low') { deviceList.setFilter('battery'); deviceList.open(); }
    else if (k === 'offline') $('#offlinePill').click();
  });
}
const full = initFullscreen({ $, t, locks: () => locks, changed: () => tabsUi.redraw() });   // ⛶, kept on for a user with the lock (#487)
const tabsUi = initTabsUi({
  $, t, settings: () => settings, isLive: () => isLive(), card: !!card && !card.tabs, me: () => dash.variants.me(me), full,   // "Ansehen als" (#507)
  pages: () => ({ today: { el: $('#tabPages [data-page=today]'), ...todayPage }, energy: { el: $('#tabPages [data-page=energy]'), ...energyPage },
    climate: { el: $('#tabPages [data-page=climate]'), ...climatePage }, cameras: { el: $('#tabPages [data-page=cameras]'), ...camPage },
    media: { el: $('#tabPages [data-page=media]'), ...mediaPage }, household: { el: $('#tabPages [data-page=household]'), ...householdPage },
    routines: { el: $('#tabPages [data-page=routines]'), ...routinesPage }, family: { el: $('#tabPages [data-page=family]'), ...familyPage },
    ...dash.customPages() }),
  edit: dash.edit, tabEdit: dash.tabEdit,
  onShow: (tab, was) => { if (tab !== 'house') { popup.close(); roomPanel.close(); search.close(); toggleViewMenu(false); } else if (was !== 'house') applyStates(); wake(); },   // back to the house: it catches up on the states (#494)
});

/* ================= Floor cards (whole-house view): the code lives in floorcards.js ================= */
const floorCards = initFloorCards({
  $, t, camera, canvas, layout: () => shownLayout(), states: () => states, onStates: ON_STATES, settings: () => settings, isOpen: (e) => isOpen(e), houseMode: () => houseMode,
  layoutMode: () => layoutMode, roomFocused: () => !!focusedRoom, elev: (i) => elev(i), floorH: FLOOR_H, switchFloor: (i) => switchFloor(i),
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
/** new states (or a new look): what shows them is brought up to date. While a page of the tab bar lies over the house only what can be
 *  seen over it (the warnings, the page; the low batteries for ☀ Heute); the house catches up when it is shown again (onShow of the tab
 *  bar, #494) */
function applyStates() {
  const own = !placedMemo;
  if (own) placedMemo = new Map();
  try {
    if (tabsUi.covered()) { alertsUi.update(); deviceList.update(); tabsUi.update(); }
    else applyHouseStates();
  } finally { if (own) placedMemo = null; }
}
function applyHouseStates() {
  if (plan?.isVisible()) plan.render();
  updateViewLegend();
  power.update();
  energyFlow.update();                    // the energy flow as a picture (#420)
  roomTiles.update();                     // the room tiles (#421) and the favourites in front of them (#471)
  lightGroups.update();                   // "💡 n an" and its list (#471)
  roomLabels.update();                    // the labels over the rooms (#430)
  energyUi.update();                      // the tab "⚡ Rechnung" while it is open (#378)
  cams.updateCones();
  cams.updatePill();
  tabsUi.update();                        // the tab bar and its open page (#479)
  floorCards.update();
  const offList = offline.update(), offIds = offlineMarks(offList);   // what is offline or linked to nothing: a sign in 3D too (#375)
  offReasons = new Map(); offList.forEach((x) => { if (!offReasons.has(x.id) || offReasons.get(x.id) === 'unlinked') offReasons.set(x.id, x.reason); });
  deviceList.update();                    // the device overview (#376): its button, and the list while it is open
  alertsUi.update();
  sky.apply();                            // the sky of the hour and the weather (#418, #419)
  if (!layout.floors[floorIdx]) return;
  applyOpenings();
  const bv = belowVis();
  liveFloors(layout.floors.length, floorIdx, houseMode).forEach((fi) => {   // the whole-house view: every floor, not only the one opened last (#392)
    const f = layout.floors[fi];
    f.devices.forEach((d) => {
      const obj = registry.get(d.id);
      if (!obj) return;
      const ghost = houseMode ? !!obj.userData.ghost : fi < floorIdx;   // dimmed: below the open floor (whole house: a see-through basement)
      const on = d.entity && isOnNow(d.entity);
      const rgb = on ? lampRgb(d, states[d.entity]) : null;   // lit parts take the light's colour (or the one set on a lamp that reports none, #367)
      if (obj.userData.heat) paintHeat(obj.userData, heatLook(heatMode(d.entity, states[d.entity], on, d.type)));   // a radiator: red while it heats, cool blue while not; an air conditioner's outlet (heating.js)
      obj.userData.glow?.forEach((m) => {
        m.emissive.set(on ? (rgb ? new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255) : (m.userData.on ?? 0xffd27a)) : 0x000000);   // on: a part's own colour (a sauna's stones, a screen)
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
      if (obj.userData.segs) ringLook(obj, obj.userData.segs.map((_, i) => {   // LED ring and LED zones: every section shows its own light, editing: its colour (modelfx.js)
        const e = sectionEntity(d, i), son = !!e && ON_STATES.has(states[e]?.state);
        return { on: son, rgb: son && Array.isArray(states[e]?.rgb) ? states[e].rgb : null };
      }), { ghost, bv, edit: !isLive() });
      obj.visible = !obj.userData.cutHidden && !(d.hideModel && isLive()) && !(d.type === 'presence' && isLive() && d.entity && !on)      // a person who is not there is not drawn in live mode
        && !power.hides(d.id);                                  // the power editor shows nothing but the power things (#174: the next state update brought them all back)          // invisible lights (LED strips ...) still shine, they just are not drawn in live mode
      const ballOn = on || pieceEntities(d).some((e) => isOnNow(e));   // a piece with LED zones: lit while one of them is
      tapBalls.update(d.id, ballOn, rgb, isLive() && !ghost, obj.visible, offIds.get(d.id)?.reason);   // the ball to tap in the live mode, lit while on (#238), the offline sign (#375)
      const sp = labelSprites.get(d.id);
      if (sp) { sp.visible = settings.labelMode !== 'none' && obj.visible && !roomLabels.quiet(); sp.userData.setText(labelText(d.entity, d.type), isHolo() && states[d.entity]?.unit === 'W', pillTone(d, states[d.entity], on)); }   // a heater's temperature: red / blue
    });
  });
  tapBalls.settle();                      // tap balls that would cover each other move apart (#244)
  offMarks.update(offIds, new Map(offList.map((x) => [x.id, x.floor])));   // the offline sign over what has no ball showing it (offlinemarks.js)
  buildNav();                             // room pills show a dot while somebody is in the room
  {                                       // lit rooms: light spreads from each lamp, in the lamp's colour (hologram: tints the floor itself, other themes: a glow layer on top)
    const holo = isHolo();
    roomMeshes.forEach(({ mesh, room, wash, glow, f, ghost }) => {
      const target = holo ? mesh : glow;
      const U = target?.material.uniforms;
      if (!U) return;
      const k = ghost ? 0.3 + 0.6 * bv : 1;
      const heat = viewMode === 'normal' ? null : roomHeat(room, f);
      if (!holo) paintFloor(mesh.material, room, heat);      // solid themes: the floor itself takes the temperature / humidity colour, else its pattern (#427, floortex.js)
      const lights = heat ? [] : lampLights(entityDevices(f), room, { states, onStates: ON_STATES, rooms: f.rooms, settings });   // a TV's backlight and each LED ring section are lights of their own (lamplight.js)
      fillLights(target.material, lights, holo ? 1 : (ghost ? k : 1));
      if (holo) U.uBase.value.copy(heat != null ? hexVec(heat) : hexVec(HOLO.floor));
      else glow.visible = lights.length > 0;
      if (wash) { fillLights(wash.material, lights, k); wash.visible = lights.length > 0; }
    });
  }
  if (popup.current()) popup.render();
  if (roomPanel.current() && !document.activeElement?.matches?.('#roomPanel input, #roomPanel select')) roomPanel.render();   // (renders the heating panel too)
  markShadows();                                                   // things may have shown, hidden or moved (also after every build)
}

/* ---- The device overview (#376): the code lives in devicelist.js; only the building shown (#451) ---- */
const deviceList = initDeviceList({
  $, t, layout: () => shownLayout(), states: () => states, batteryOf: () => batteryOf, offline: () => offReasons, onStates: ON_STATES,
  pointInPoly: (...a) => pointInPoly(...a), distToPoly, nameOf: (e) => entities.find((x) => x.entity_id === e)?.name, ready: () => entities.length > 0,
  show: (target) => offline.show(target), narrow: () => matchMedia(PHONE_QUERY).matches,
});
/* ---- Offline devices: the code lives in offline.js, their signs in 3D in offlinemarks.js (#375) ---- */
const offMarks = initOfflineMarks({ registry, labelSprites, ballShown: (id) => tapBalls.shown(id), floorShown: (fi) => houseMode || fi === floorIdx });
const offline = initOffline({
  $, t, layout: () => shownLayout(), entities: () => entities, states: () => states, catOf, pointInPoly: (...a) => pointInPoly(...a), currentLanguage: () => currentLanguage(),
  houseMode: () => houseMode, floorIdx: () => floorIdx, switchFloor: (i) => switchFloor(i), isLive: () => isLive(), liveSelect: (h) => liveSelect(h),
  selectLocked: (sel) => { selection = sel; lockedSel = true; refreshSelection(); }, jump: (x) => search.goTo(x),
});

/* ================= Warnings (#58) and the "Where is ...?" search (#62): the code lives in alertsui.js and search.js ================= */
const alertsUi = initAlertsUi({
  $, t, layout: () => layout, entities: () => entities, settings: () => settings, areaOf: () => areaOf, pointInPoly: (...a) => pointInPoly(...a),
  openingEntities: (o) => openingEntities(o), build: () => build(), isLive: () => isLive(), houseMode: () => houseMode, floorIdx: () => floorIdx,
  switchFloor: (i) => switchFloor(i), focusRoom: (id) => focusRoom(id), openRoomPanel: (id) => roomPanel.open(id), kioskTouched: () => kiosk.touched(),
});
const search = initSearch({
  $, t, layout: () => shownLayout(), entities: () => entities, pointInPoly: (...a) => pointInPoly(...a), houseMode: () => houseMode, floorIdx: () => floorIdx,
  switchFloor: (i) => switchFloor(i), focusRoom: (id) => focusRoom(id), focusedRoom: () => focusedRoom, openRoomPanel: (id) => roomPanel.open(id),
  isLive: () => isLive(), liveSelect: (h) => liveSelect(h), elev: (i) => elev(i), scene, camera, controls,
  selectLocked: (sel) => { selection = sel; lockedSel = true; refreshSelection(); }, wake: () => wake(),
});

/* ================= Wall tablet (#61): the code lives in kiosk.js ================= */
const phoneMenu = initPhoneMenu({ $, onPhone: () => setMode('live') });   // phones: the tool bar folds into a ☰ menu, only live and 3D (phonemenu.js, #299)
const kiosk = initKiosk({
  $, controls, settings: () => settings, states: () => states, isLive: () => isLive(),
  closeLivePopup: () => popup.close(), closeRoomPanel: () => roomPanel.close(), closeSearch: () => search.close(),
  tabletRoom: () => tabletRoom, findRoomByName: (n) => findRoomByName(n), switchFloor: (i) => switchFloor(i), focusRoom: (id) => focusRoom(id), focusedRoom: () => focusedRoom,
  openRoomPanel: (id) => roomPanel.open(id), groundIdx: () => groundIdx(), fitCamera: () => fitCamera(),
  applyStart: () => cardUi?.start() ?? (me.start ? startView.apply(me.start) : null),             // the card's floor (#13), else a saved start view (#315)
  homeTab: () => tabsUi.home(),                                                                    // the start tab of the tab bar (#479)
});
/* ---- Dashboard card (#13): the floor to start with, the room colouring, without room panel or bars, only one room or only its panel; the code lives in cardmode.js ---- */
const cardUi = card && initCardMode({
  $, t, opts: card, layout: () => layout, groundIdx: () => groundIdx(), tabletRoom: () => tabletRoom, switchFloor: (i) => switchFloor(i), setHouseMode: (on) => setHouseMode(on),
  floorIdx: () => floorIdx, focusedRoom: () => focusedRoom, focusRoom: (id) => focusRoom(id), room: () => (tabletRoom && findRoomByName(tabletRoom)) || null,
  openRoomPanel: (id) => roomPanel.open(id),
});

function refreshSelHelper() {
  if (selHelper) { scene.remove(selHelper); selHelper = null; }
  multiSel?.outline();
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
    const exists = (selection.kind === 'cable' && power.findCable(selection.id)) || f && [openingWalls(f), f.rooms, f.devices, f.blocks, f.stairs, f.holes].some((l) => (l || []).some((q) => q.id === selection.id || (q.openings || []).some((o) => o.id === selection.id)));
    if (!exists) selection = null;
  }
  if (!selection) lockedSel = false;
  if (returnToTool && !selection) { const back = returnToTool; setTool(back); }   // the placed device is deselected: carry on placing
  document.body.classList.toggle('locksel', lockedSel);
  refreshSelHelper();
  renderProps();
}


/* ---- Several things at once (Shift + click, Delete removes them all, #211); the code lives in multisel.js ---- */
multiSel = initMultiSelect({
  $, t, scene, registry, openingMesh: (id) => openingHandles.get(id)?.mesh, selection: () => selection,
  setSelection: (sel) => { selection = sel; refreshSelection(); }, deleteItem: (sel, batch) => deleteItem(sel, batch),
  snapshot: () => snapshot(), changed: () => changed(), setStatus: (x) => setStatus(x),
});
/* ---- Cutaway: walls between the camera and the interior sink down (or turn see-through) so you can look inside; the code lives in cutaway.js ---- */
const cutaway = initCutaway({
  camera, elev: () => elev(), settings: () => settings, lowWalls: () => lowWalls, halfCut: () => halfCut, isLive: () => isLive(), walls: () => cutawayWalls,
  center: () => wallsCenter(), roofsCount: () => roofsUi.faded.length, updateRoofFade: () => updateRoofFade(), updateEarthCut: () => updateEarthCut(), wallSee: WALL_SEE,
});
const wallCutawayInfo = (w, group) => cutaway.info(w, group);
function updateCutaway() { return cutaway.update(); }

/* ---- Compass: the ring stands still, the needle turns with the camera; the code lives in compass.js ---- */
const compass = initCompass({ $, t, camera, controls });

/* ================= Changes, undo, save: the undo list and the autosave live in persist.js ================= */
const persist = initPersist({
  t, layout: () => layout, url: () => hs.url(), autosaveSeconds: () => settings.autosaveSeconds, setStatus: (x) => setStatus(x),
  conflict: () => houseLoad.askConflict(), reopen: (l) => { layout = l; normalizeLayout(); showPlan(layout); renderObjList(); refreshSelection(); },   // another screen saved meanwhile (#403)
});
/* "Gelöscht · ↶ Rückgängig" for a few seconds after a deletion (#471), undotoast.js; it goes with the next change, undo or redo */
const undoToast = initUndoToast({ $, t, undo: () => undo() });
function snapshot() { persist.snapshot(); undoToast.changed(); }
/** another state of the plan replaces the open one (undo, redo, the plan loaded again): the floor stays, nothing is selected */
function showPlan(l) {
  layout = l;
  floorIdx = Math.min(floorIdx, layout.floors.length - 1);
  selection = null; focusedRoom = null; multiSel.clear(); clearFocusOutline();
  knownRooms = roomIds();
  fillFloorSelect(); build(); bgUi.render(); renderFloorPanel(); neighbors.renderUi(); historyButtons();
  buildingsUi?.renderSwitch(); buildingsUi?.renderPanel();
}
function undo() { undoToast.hide(); const prev = persist.popUndo(); if (prev) { showPlan(prev); scheduleSave(); } }
function redo() { undoToast.hide(); const next = persist.popRedo(); if (next) { showPlan(next); scheduleSave(); } }      // #404
/** the ↶ / ↷ buttons can be pressed only while there is something to undo / do again */
function historyButtons() { $('#undoBtn').disabled = !persist.canUndo(); $('#redoBtn').disabled = !persist.canRedo(); }
function changed(rebuild = true) {
  claimNewRooms();
  if (rebuild) build();
  renderObjList();
  scheduleSave();
  buildingsUi?.renderPanel();                                      // a new room shows up in "Buildings in this plan" (#409)
}
function setStatus(txt) { $('#status').textContent = txt; }
function scheduleSave() { persist.schedule(); historyButtons(); }
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
const houseLoad = initHouseLoad({
  $, t, hs, hasLayout: () => !!layout, flush: async () => { if (persist.touched()) await save(); }, load: () => persist.load(), setStatus: (x) => setStatus(x),
  alert: (x) => alert(x), confirm: (x) => confirm(x), reload: () => location.reload(),
  opened: (l) => {                                                 // a plan was opened: the ground floor, nothing selected, a fresh undo list
    layout = l;
    normalizeLayout();
    persist.clearUndo(); historyButtons();
    buildingsUi.opened(); knownRooms = roomIds();                  // the building this screen shows in this plan (#409)
    floorIdx = groundIdx(); selection = null; lockedSel = false; focusedRoom = null; houseMode = false; document.body.classList.remove('house');   // open on the ground floor, not in the basement
    clearFocusOutline(); hs.renderUi(); neighbors.renderUi();
    build(); fitCamera(); buildNav(true); bgUi.render(); renderFloorPanel(); renderObjList(); refreshSelection();
  },
});
function switchHouse(id) { return houseLoad.switchHouse(id); }
buildingsUi = initBuildingsUi({
  $, t, layout: () => layout, houseId: () => hs.id(), houses: () => hs.list(), houseLabel: (h) => hs.label(h), uid: () => uid(), floorH: FLOOR_H,
  snapshot: () => snapshot(), changed: () => changed(), setStatus: (x) => setStatus(x), confirm: (x) => confirm(x),
  shownChanged: () => {                                            // another building shown: its floor (the ground floor when the open one has nothing of it), framed
    refreshView();
    if (view && !floorShown(floorIdx, true)) {
      const ok = view.floors.map((_, i) => i).filter((i) => floorShown(i, true));
      if (ok.length) floorIdx = ok.find((i) => i >= groundIdx()) ?? ok[0];
    }
    selection = null; lockedSel = false; focusedRoom = null; multiSel.clear(); clearFocusOutline();
    build(); fitCamera(); buildNav(true); renderObjList(); refreshSelection(); floorCards.update(); renderFloorPanel();
  },
});
initImport({ t, lang: () => currentLanguage(), houseId: () => hs.id(), onImported: (j) => houseLoad.openImported(j) });
welcomeUi = initWelcome({
  t, getLayout: () => layout, isEdit: () => !isLive(),
  draw: () => { $('#viewSplit').click(); setTool('wall'); },
  example: () => houseLoad.openExample(),
  importJson: () => $('#importOpen').click(),
});
welcomeUi.update();

function save() { return persist.save(); }

/* ================= Picking / snapping: the ray into the scene and what it hits live in picking.js ================= */
const picking = initPicking({
  canvas, camera, pickables, isLive: () => isLive(), elev: () => elev(), floor: () => floor(), layout: () => layout,
  power: { hides: (id) => power.hides(id), isMode: () => power.isMode(), pick: (e, hits) => power.pick(e, hits) }, findOpening: (id) => findOpening(id),
  hasBall: (id) => tapBalls.shown(id),                                 // live mode: a device with a ball is tapped on its ball only (#262)
});
function setRay(e) { picking.setRay(e); }
function groundPoint(e) { return picking.groundPoint(e); }
function pickHit(e) { return picking.pickHit(e); }
function pick(e) { return picking.pick(e); }

function snap(p, fine = false) { return snapPoint(p, floor().walls, fine ? 0.05 : settings.grid); }
const findWall = (id) => floor().walls.find((w) => w.id === id);
const findOpening = (id) => {
  for (const w of openingWalls(floor())) {
    const o = (w.openings || []).find((x) => x.id === id);
    if (o) return { wall: w, opening: o };
  }
  return null;
};

/* ================= Drawing and dragging in 3D: the code (and the drawing state) lives in draw3d.js, set up at "Pointer events" ================= */
let draw3d = null;
function endDrawing() { draw3d.endDrawing(); }
function finishRoom() { draw3d.finishRoom(); }

/** a new device of the chosen type at (x, z), with the chosen entity; wall things click onto the nearest wall */
function newDevice(x, z) {
  const custom = isCustom(deviceType);
  const def = custom ? { y: 0 } : DEVICE_TYPES[deviceType];
  const ent = entities.find((v) => v.entity_id === entityChoice);
  const d = {
    id: uid(), type: deviceType, x, z, y: def.y || 0, rot: 0, scale: 1,
    name: ent?.name || (custom ? deviceType.slice(4) : t(`dev.${deviceType}`)), entity: entityChoice || '',
  };
  palettes.used(deviceType);                                     // "last used" on top of the library (#471)
  if (deviceType === 'nanoleaf') d.panels = DEFAULT_PANELS.map((p) => ({ ...p }));
  if (deviceType === 'kitchenrun') Object.assign(d, { legs: DEFAULT_LEGS(), upper: true, depth: 0.6 });
  if (deviceType === 'ledring') Object.assign(d, ringAt(x, z));     // all around the room it is placed in, just under the ceiling
  if (WALL_TYPES.has(deviceType)) snapToWall(d, 0.8);          // wall-hung things click onto the nearest wall
  if (power.isMode() && !power.shows(deviceType)) { power.setMode(false); setTool('device'); setStatus(t('power.editorOff')); }   // the power editor would hide it at once (#207)
  return d;
}
/** a meter of the energy dashboard put into the plan (#407): on the floor shown, in its middle (on the nearest wall when it hangs on one) */
/** LED ring along the walls of the room at (x, z), `inset` metres from the room outline; a 2 x 2 m square outside rooms */
function ringAt(x, z, inset = RING_DEFAULT_INSET) { return ringAround(roomAt(x, z), x, z, inset, settings.wallHeight); }
/** the entities a double click / quick action switches: an LED ring all of its sections, a piece all of its LED zones (ledzones.js) */
const deviceEntities = (d) => switchEntities(d);
/** put the device flat on the closest wall (within `maxDist`), facing the side it is on (or, with `keepFacing`, the way it already faces); placement.js */
function snapToWall(d, maxDist = 2, keepFacing = false) { return snapOnWall(d, floor().walls, floor().rooms, pointInPoly, maxDist, keepFacing); }
/* ---- a picture on the wall: frame, image, upload; the code lives in picture.js ---- */
const pictures = initPictures({ snapshot: () => snapshot(), changed: () => changed(), renderProps: () => renderProps() });
function setPicture(model, d) { pictures.setPicture(model, d); }
function uploadPicture(file, d) { return pictures.uploadPicture(file, d); }
/* ---- measuring (tool "Messen", key M): distance of two points, distance / angle of two walls; the code lives in measuretool.js and measure.js ---- */
const measureTool = initMeasureTool({
  $, t, floor: () => floor(), floorIdx: () => floorIdx, elev: (i) => elev(i), scene, textSprite: (...a) => textSprite(...a), fmtLen: (m) => fmtLen(m),
  toDisp, fromDisp, imperial, snapshot: () => snapshot(), changed: () => changed(), setStatus: (x) => setStatus(x), renderPlan: () => plan?.render(),
});
/* ================= Pointer events: select, drag, draw, place, double click; the code lives in draw3d.js ================= */
draw3d = initDraw3d({
  canvas, controls, temp, t, setStatus: (x) => setStatus(x), fmtLen: (m) => fmtLen(m), clearGroup: (g) => clearGroup(g), elev: () => elev(),
  tool: () => tool, openingType: () => openingType, isLive: () => isLive(), houseMode: () => houseMode, lockedSel: () => lockedSel,
  selection: () => selection, setSelection: (s) => { selection = s; }, refreshSelection: () => refreshSelection(), floor: () => floor(), settings: () => settings,
  uid: () => uid(), findOpening: (id) => findOpening(id), findWall: (id) => findWall(id), pick: (e) => pick(e), pickHit: (e) => pickHit(e),
  groundPoint: (e) => groundPoint(e), snap: (p, fine) => snap(p, fine), snapshot: () => snapshot(), changed: (r) => changed(r), build: () => build(),
  moveDeviceTo: (d, x, z) => moveDeviceTo(d, x, z), multi: { toggle: (h) => multiSel.toggle(h), clear: () => multiSel.clear() }, liveTap: (e) => handleLiveTap(e),
  cableClick: (id) => power.cableClick(id), deleteItem: (sel) => deleteItem(sel), newDevice: (x, z) => newDevice(x, z), holdPlaced: () => holdPlaced(),
  editNano: (d) => editNano(d), switchDevice: (d) => deviceEntities(d).forEach((e) => live.quickAction(e)),   // #251
  roofBox: (id) => roofRectOf(id)?.box || null, dragRoof: (id, dx, dz) => dragRoofBy(id, dx, dz), measure: measureTool,
});

/** a device was just placed: it stays selected and can be moved at once; the next click on empty space deselects it and placing goes on */
function holdPlaced() {
  if (tool !== 'device' || !settings.placeSelect) return;
  returnToTool = 'device'; setTool('select');
}
function editNano(d) {
  openNanoEditor({ panels: d.panels, t, onSave: (panels) => { snapshot(); d.panels = panels; changed(); renderProps(); } });
}
/* ---- Copy, paste, duplicate (Ctrl+C / V / D, #405): the code lives in clipboard.js ---- */
const clipboard = initClipboard({
  t, floor: () => floor(), items: () => (multiSel.items().length ? multiSel.items() : selection ? [selection] : []),
  select: (items) => multiSel.selectOnly(items), snapshot: () => snapshot(), changed: () => changed(), setStatus: (x) => setStatus(x), uid: () => uid(),
});
/* ---- Delete, arrow keys, Q / E and the shortcut keys; the code lives in edititems.js ---- */
const editItems = initEditItems({
  t, floor: () => floor(), floorIdx: () => floorIdx, floors: () => layout.floors.length, settings: () => settings,
  selection: () => selection, setSelection: (s) => { selection = s; }, isLive: () => isLive(), tool: () => tool,
  snapshot: () => snapshot(), changed: () => changed(), setStatus: (x) => setStatus(x), undo: () => undo(), redo: () => redo(), clip: clipboard,
  moveDeviceTo: (d, x, z) => moveDeviceTo(d, x, z), deleted: () => undoToast.deleted(), help: () => keysHelp.open(),
  power: { deleteCable: (id) => power.deleteCable(id), dropCablesTo: (id) => power.dropCablesTo(id) }, multi: { items: () => multiSel.items(), deleteAll: () => multiSel.deleteAll() },
  switchFloor: (i) => switchFloor(i), setTool: (x) => setTool(x),
  finishDraft: () => { if (!plan?.hasDraft()) return false; plan.finishRoom(); return true; }, moveRoof: (id, dx, dz) => moveRoofBy(id, dx, dz),
  escape: () => { plan?.cancel(); endDrawing(); popup.close(); setStatus(''); if (bgUi.mode()) bgUi.setMode(null); if (lockedSel) releaseLock(); if (multiSel.items().length) { multiSel.clear(); selection = null; refreshSelection(); } },
});
/** the plan object behind a selection handle (wall, room, opening, device, stair, block) */
function itemOf(kind, id) { return editItems.itemOf(kind, id); }
function deleteItem(sel, batch = false) { editItems.deleteItem(sel, batch); }      // batch: several in a row (#211), the caller rebuilds once
const keysHelp = initShortcuts({ $, t, mac: /Mac|iPhone|iPad/.test(navigator.platform || '') });   // "?" or ⌨: every key of the editor (#471), shortcuts.js

/* ================= Live control: the code lives in livecontrols.js (switching, light controls, scenes), livepopup.js and roompanel.js ================= */
const live = initLiveControls({
  t, states: () => states, entities: () => entities, areas: () => areas, floor: () => floor(), entityDevices: (f) => entityDevices(f), pointInPoly,
  onStates: ON_STATES, setStatus: (x) => setStatus(x), afterService: () => { if (!liveChan.ok()) setTimeout(liveChan.poll, 400); },   // with the live channel the new state arrives by itself
  canEdit: () => me.canEdit, settings: () => settings, saveEffectColors: () => saveEffectColors(), canMoreInfo, openMoreInfo,
  locked: (k) => locks.has(k) || (k === 'control' && !!replayBack),   // security view only shows the past
});
const popup = initLivePopup({
  $, t, lang: () => currentLanguage(), live, floor: () => floor(), findOpening: (id) => findOpening(id), stateText: (id) => stateText(id), openText: (e) => openText(e), cams,
  settings: () => settings, pointInPoly, states: () => states, onStates: ON_STATES, star: (e) => favorites.star(e),   // ☆ favourite (#471)
});
const roomPanel = initRoomPanel({
  $, t, live, floor: () => floor(), states: () => states, entities: () => entities, areas: () => areas, entityDevices: (f) => entityDevices(f), pointInPoly,
  onStates: ON_STATES, imperial: () => imperial(), stateText: (id) => stateText(id), cams, settings: () => settings,
  openings: { entities: (o) => openingEntities(o), kind: (o) => openKind(o), KINDS: OPEN_KINDS, pane: (o, i) => paneEntity(o, i), isOpen: (e) => isOpen(e), text: (e) => openText(e) },
  closeLivePopup: () => popup.close(), leaveFocus: () => { if (focusedRoom) focusRoom(null); },
  off: () => cardUi?.roomPanel() === false,                                  // a dashboard card without the room panel (#13)
  alone: () => !!cardUi?.panelOnly(),                                        // a dashboard card with nothing but the room panel (#356)
});
/* ---- Phones: the room shows above the room sheet, not behind it; the code lives in sheetview.js ---- */
sheetView = initSheetView({ camera, canvas, panel: $('#roomPanel'), side: () => floorCards.column() });   // side: the floor cards' column (phones)
function handleLiveTap(e) { liveSelect(pick(e)); }
function liveSelect(h) {
  if (h?.kind === 'device' || h?.kind === 'opening') popup.show(h.id, h.seg ?? null);
  else if (h?.kind === 'room') {
    popup.close();
    if (cardUi?.locked()) return;                                                 // a dashboard card for one room never leaves it (#356)
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
  document.querySelectorAll('#tools button[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === next));   // only the tools: the power editor keeps its own highlight
  $('#hintText').textContent = t(`hint.${next}`);
  $('#devicePalette').hidden = !(next === 'device' || (next === 'select' && returnToTool === 'device'));   // the palette stays while a just placed device is selected
  $('#openingPalette').hidden = next !== 'opening';
  $('#stairPalette').hidden = next !== 'stairs';
  $('#blockPalette').hidden = next !== 'block';
  $('#plotPalette').hidden = next !== 'plot';
  $('#measurePanel').hidden = next !== 'measure';
  if ((next === 'block' || next === 'stairs' || next === 'plot' || next === 'hole' || next === 'measure') && !isLive() && plan && !plan.isVisible()) $('#viewSplit').click();   // drawn (measured) in the 2D plan
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
decorateTools(TOOLS.map(([id]) => id), (id) => $('#tools').querySelector(TOOLS.find(([k]) => k === id)[1]), $('#toolsMoreBtn'));   // icons and groups (#422), toolicons.js
const toolbarUi = initToolbar({ t, onApply: (shown) => markGroups(shown, t) });

function setMode(next) {
  mode = next = phoneView(phoneMenu.isPhone(), { mode: next }).mode;   // phones only show the house (#299)
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
  if (isLive()) tapBalls.remeasure();                                 // devices may have been moved while editing
  stairTool.showUpper(scene, !isLive());                              // stairs over several floors: whole height only in the editor (#246)
  if (plotLoop) plotLoop.visible = !isLive();
  applyViewPolicy();
  applyStates();
  welcomeUi?.update();                                              // the welcome card is for the editor only
  requestAnimationFrame(resize);
}
document.querySelectorAll('#modeSwitch button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

/** what the camera frames: the floor shown (or the isolated room), the centre of its walls, the whole house (nav.js) */
function floorBounds() {
  const f = shownFloor(), iso = isolatedRoom();
  return floorBoundsOf(f, shownLayout().floors, { iso, rb: !iso && f.kind === 'roof' ? roofBox(floorIdx) : null });   // a roof has no walls of its own: frame the house below it
}
/** centre of the walls of the floor shown. Garden things and lamps outside the house must not pull it away: it decides which walls face the camera (see-through / lowering) */
function wallsCenter() { return (!isolatedRoom() && wallsCenterOf(shownFloor())) || floorBounds(); }
function houseBounds() { return houseBoundsOf(shownLayout().floors); }
function fitCamera() {
  const { cx, cz, size } = houseMode ? houseBounds() : floorBounds();
  const midY = houseMode ? (elev(layout.floors.length - 1) + elev(0)) / 2 + FLOOR_H / 2 : elev();
  const span = houseMode ? Math.max(size, elev(layout.floors.length - 1) - elev(0) + FLOOR_H) : size;   // pulled-apart floors are tall
  sheetView?.apply();                  // phones, whole house: the picture moves left, the cards get a column on the right (floorcards.js)
  const dist = (span * 1.25 + 2) * Math.max(1, 1.0 / (camera.aspect || 1)) * columnZoom(canvas.clientWidth, floorCards.column());
  controls.target.set(cx, midY, cz);
  if (is2d) camera.position.set(cx, midY + dist * 1.2, cz + 0.001);
  else camera.position.set(cx + dist * 0.4, midY + dist * 0.95 + (houseMode ? size * 0.3 : 0), cz + dist * 0.7);
  controls.update();
}
function applyViewPolicy() {          // live mode: only the 3D view unless the user was given more (settings → users)
  const phone = phoneMenu.isPhone(), lock = (isLive() && me.view !== 'all') || phone;
  document.body.classList.toggle('viewlock', lock);
  if (lock) setLayoutMode(phoneView(phone, { layoutMode: ['2d', 'split'].includes(me.view) ? me.view : '3d' }).layoutMode);
}
function setLayoutMode(m) {
  layoutMode = m;
  document.body.classList.toggle('v-2d', m === '2d');
  document.body.classList.toggle('v-split', m === 'split');
  $('#view2d').classList.toggle('active', m === '2d');
  $('#view3d').classList.toggle('active', m === '3d');
  $('#viewSplit').classList.toggle('active', m === 'split');
  plan.show(m !== '3d');
  requestAnimationFrame(() => { resize(); if (m !== '2d') fitCamera(); planRotate.sync(); });
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
  $('#belowLabelsToggle').classList.toggle('active', settings.belowLabels !== false);
  houseFloors.update();
}
function setLowWalls(v) {
  lowWalls = v;
  updateNavToggles();
  build();
}
$('#saveBtn').addEventListener('click', save);
$('#undoBtn').addEventListener('click', () => undo());
$('#redoBtn').addEventListener('click', () => redo());

/* ================= Floors, rooms, navigation pills ================= */
let focusedRoom = null;
let roomBackView = null;               // the view before a tap zoomed into a room (floor / whole house, camera), so a second tap can go back
const focusGroup = new THREE.Group();
scene.add(focusGroup);
/* ---- Floor pills, room menu, scroll arrows, the tablet's room button; the code lives in nav.js ---- */
const nav = initNav({
  $, t, layout: () => shownLayout(), floorShown: (i) => floorShown(i), floorIdx: () => floorIdx, houseMode: () => houseMode, focusedRoom: () => focusedRoom, settings: () => settings, tabletRoom: () => tabletRoom,
  isOn: (e) => ON_STATES.has(states[e]?.state), pointInPoly, switchFloor: (i) => switchFloor(i), setHouseMode: (on) => setHouseMode(on), focusRoom: (id) => focusRoom(id),
  get roomPanel() { return roomPanel; }, toggleMenu: (m, b, o) => toggleMenu(m, b, o), floorRail: () => floorRail, renderPlanFloorsChip: () => renderPlanFloorsChip(),
  phoneNav: () => phoneNav,
});
/* ---- Phones: the floors as a drop-down next to ☰ and the room button; the code lives in phonenav.js ---- */
const phoneNav = initPhoneNav({
  $, t, layout: () => layout, floorShown: (i) => floorShown(i), floorIdx: () => floorIdx, houseMode: () => houseMode,
  switchFloor: (i) => switchFloor(i), setHouseMode: (on) => setHouseMode(on), closeOthers: () => dropdowns.forEach(([m, b]) => toggleMenu(m, b, false)),
});
/* ---- Phones held upright: power, water / gas, offline, open and cameras fold into one drop-down; the code lives in phonestatus.js ---- */
initPhoneStatus({ $, closeOthers: () => { dropdowns.forEach(([m, b]) => toggleMenu(m, b, false)); phoneNav.close(); } });
function buildNav(force = false) { nav.build(force); }
function updateHouseToggle() { nav.updateHouseToggle(); }
const findRoomByName = (name) => findRoomIn(layout.floors, name);

/* ================= Floor rail: side bar with a thumbnail per floor; the code lives in floorrail.js ================= */
const floorRail = initFloorRail({
  $, t, layout: () => shownLayout(), floorShown: (i) => floorShown(i), floorIdx: () => floorIdx, houseMode: () => houseMode, isHolo: () => isHolo(), settings: () => settings,
  roofBox: (i) => roofBox(i), switchFloor: (i) => switchFloor(i), setHouseMode: (on) => setHouseMode(on),
});

function fillFloorSelect() { buildNav(true); }

/* the floors of the whole-house view: as built, pulled apart or stacked like a real house (buttons in the view menu); housefloors.js */
const houseFloors = initHouseFloors({
  $, settings: () => settings, houseMode: () => houseMode, floorCount: () => layout.floors.length,
  choose: (m) => { $('#setHouseFloors').value = m; commitSettings(); },
});
function setHouseMode(on) {
  houseMode = on; selection = null; lockedSel = false; focusedRoom = null; multiSel.clear(); document.body.classList.toggle('house', on);
  clearFocusOutline(); build(); fitCamera(); refreshSelection(); buildNav(true);
  floorCards.update(); houseFloors.update();
}
function switchFloor(i) {
  houseMode = false; document.body.classList.remove('house'); floorCards.update(); houseFloors.update();
  floorIdx = i; selection = null; lockedSel = false; focusedRoom = null; multiSel.clear(); endDrawing(); popup.close(); roomPanel.close();
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
    camera.position.copy(controls.target).addScaledVector(dir, roomViewDist(size, camera.aspect));   // phones: further back (sheetview.js)
    controls.update();
  } else fitCamera();
  buildNav();
}

function liveMove(d) {
  markShadows();                                                   // a device is dragged: its shadow goes along
  const obj = registry.get(d.id);
  if (obj) { obj.position.x = d.x; obj.position.z = d.z; }
  if (obj?.userData.onRoof) roofsUi.placeSolar(obj, d, roofList(floorIdx));   // follows the roof while it is moved (the mount itself changes on the next build)
  const sp = labelSprites.get(d.id);
  if (sp) sp.position.set(d.x, sp.position.y, d.z);
  offMarks.refresh();                                              // its offline sign goes along
  cams.cones.get(d.id)?.mesh.position.set(d.x, 0, d.z);          // the field of view of a camera moves with it
  refreshSelHelper();
}
/* ---- Wall stop: the code lives in collide.js ---- */
const STOP_EXEMPT = new Set([...STOP_EXEMPT_BASE, ...OUTDOOR]);
function stopMove(members, dx, dz) { return settings.wallStop ? stopAtWalls(members, dx, dz, floor().walls, (m) => plan.footOf(m), STOP_EXEMPT) : [dx, dz]; }
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
  dormerOntoWall: (d) => { const x = dormerWindows(layout.floors, roofList, elev).find((q) => q.d === d); return x ? eaveOntoWall(layout.floors[x.fi].walls, x.n, x.win) : null; },
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
$('#belowLabelsToggle').addEventListener('click', () => {                 // names and labels of the floors below (#249)
  $('#setBelowLabels').checked = settings.belowLabels === false;
  commitSettings();
});

/* ================= Palettes: devices, custom models; the code lives in palettes.js ================= */
const palettes = initPalettes({ $, t, getType: () => deviceType, setType: (k) => { deviceType = k; }, alert: (x) => alert(x) });   // the last pieces placed on top (#471)
/* ================= Placeholder blocks and stairs: the code lives in blocks.js and stairtool.js ================= */
const floorOpenings = (i) => floorOpeningsOf(shownLayout().floors, i, FLOOR_H);
const blocks = initBlocks({
  $, t, layout: () => layout, floor: () => floor(), floorIdx: () => floorIdx, setFloorIdx: (i) => { floorIdx = i; }, snapshot: () => snapshot(), changed: (...a) => changed(...a),
  setStatus: (x) => setStatus(x), select: (sel) => { selection = sel; }, uid: () => uid(), plan: () => plan, fillFloorSelect: () => fillFloorSelect(),
});
const stairTool = initStairTool({
  $, t, settings: () => settings, layout: () => layout, floor: () => floor(), floorIdx: () => floorIdx, floorH: FLOOR_H, snapshot: () => snapshot(), changed: (...a) => changed(...a),
  select: (sel) => { selection = sel; }, setTool: (x) => setTool(x), plan: () => plan, uid: () => uid(), mat: (...a) => mat(...a), isLive: () => isLive(),
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
  $, t, floor: () => shownFloor(), isLive: () => isLive(), selection: () => selection, locked: () => lockedSel, lockTo: (sel) => { selection = sel; lockedSel = true; refreshSelection(); },
  releaseLock: () => releaseLock(), registry, tool: () => tool, setTool: (x) => setTool(x), itemOf: (k, id) => itemOf(k, id), snapshot: () => snapshot(), changed: () => changed(),
  renderProps: () => renderProps(), plan: () => plan, pointInPoly,
});
const roomEnts = initRoomEntities({
  $, t, floor: () => floor(), roomCtx: () => roomCtx, selection: () => selection, locked: () => lockedSel, lockTo: (sel) => { selection = sel; lockedSel = true; refreshSelection(); },
  select: (sel) => { selection = sel; }, releaseLock: () => releaseLock(), refreshSelection: () => refreshSelection(), entityDevices: (f) => entityDevices(f), pointInPoly,
  stateText: (id) => stateText(id), areas: () => areas, areaOf: () => areaOf, openingEntities: (o) => linkedEntities(o), classify, entityInfo: (id) => entityInfo(id),   // contacts and roller shutters count as placed
  autoPlace: (room, ids) => autoPlace(room, ids), setStatus: (x) => setStatus(x), snapshot: () => snapshot(), changed: () => changed(), uid: () => uid(),
  deviceY: (type) => DEVICE_TYPES[type]?.y || 0,
});
const props = initProps({
  multiBox: () => multiSel.box(), roofInfo: (id) => roofRectOf(id),
  $, t, floor: () => floor(), isLive: () => isLive(), selection: () => selection, roomCtx: () => roomCtx, setRoomCtx: (id) => { roomCtx = id; },
  fields: { field, inp, lenInput, pickerField }, entityPicker: (...a) => entityPicker(...a), entities: () => entities, areas: () => areas,
  findOpening: (id) => findOpening(id), snapshot: () => snapshot(), changed: () => changed(), build: () => build(), refreshSelection: () => refreshSelection(),
  deleteItem: (sel) => deleteItem(sel), applyStates: () => applyStates(), setStatus: (x) => setStatus(x), renderObjList: () => renderObjList(),
  renderRoomEntities: () => renderRoomEntities(), stateText: (id) => stateText(id), roomAt: (x, z) => roomAt(x, z), pointInPoly, controlsTarget: () => controls.target,
  wallTypes: WALL_TYPES, ledLike: LED_LIKE, catOf, baseDims: (type, dev) => baseSize(type, dev), snapToWall: (...a) => snapToWall(...a), editNano: (d) => editNano(d),
  uploadPicture: (f, d) => uploadPicture(f, d), floorH: FLOOR_H, power: () => power, stairTool: () => stairTool, fmtLen: (m) => fmtLen(m), toDisp: (m) => toDisp(m), imperial: () => imperial(),
  fromDisp: (v) => fromDisp(v), uid: () => uid(), defaultLightColor: () => settings.defaultLightColor,
});
function renderObjList() { objList.render(); }
function renderRoomEntities() { roomEnts.render(); }
function renderEntState() { props.renderEntState(); }
function renderProps() { props.render(); }

/* ================= Settings: form, loading, saving and the users dialog live in settings.js (tablet rows and colour scales in settingsui.js);
   applying them to the house and the view stays here ================= */
const settingsUi = initSettingsUi({
  $, t, settings: () => settings, defaults: DEFAULT_LOOK, layout: () => layout, houses: () => hs.list(), houseId: () => hs.id(), houseName: () => hs.current()?.name || '', commit: () => commitSettings(),
  captureView: () => startView.capture(),
});
/* the start view (#315): saved for everybody in the settings, per user in the users dialog; the code lives in startview.js */
const startView = initStartView({
  $, t, settings: () => settings, commit: () => settingsStore.save(), houseId: () => hs.id(), houses: () => hs.list(), layout: () => layout,
  houseMode: () => houseMode, floorIdx: () => floorIdx, focusedRoom: () => focusedRoom, camera, controls,
  setHouseMode: (on) => setHouseMode(on), switchFloor: (i) => switchFloor(i), focusRoom: (id) => focusRoom(id), switchHouse: (id) => switchHouse(id),
});
const todayPrefs = initTodayPrefs({ $, t });             // ⚙ → "Reiter unten": the calendars of the page ☀ Heute (#481, todayprefs.js)
const routinePrefs = initRoutinePrefs({ $, t, entities: () => entities });   // ... and the buttons of ▶ Abläufe (#483, routineprefs.js)
const mediaPrefs = initMediaPrefs({ $, t, entities: () => entities });       // ... the radio stations, the shopping list and the machines (#490, mediaprefs.js)
const presencePrefs = initPresencePrefs({ $ });                                // ... who counts as at home (#495, presenceprefs.js)
/* the voice search (#509): 🎤, a sentence understood and answered in the search box (voiceui.js, voicequery.js, voiceinput.js) */
const voiceUi = initVoiceUi({
  $, t, search, lang: () => currentLanguage(), settings: () => settings, user: () => me.user, locks: () => locks, layout: () => layout, shown: () => shownLayout(),
  houseId: () => hs.id(), houses: () => hs.list().map((h) => ({ id: h.id, name: hs.label(h) })), switchHouse: (id) => switchHouse(id),
  switchFloor: (i) => switchFloor(i), houseMode: () => houseMode, setHouseMode: (on) => setHouseMode(on), floorIdx: () => floorIdx,
  focusRoom: (id) => focusRoom(id), openRoomPanel: (id) => roomPanel.open(id), isLive: () => isLive(), rows: () => deviceList.rows(), states: () => states,
  reading: (id, mode) => { const f = layout.floors.find((x) => x.rooms.some((r) => r.id === id)), r = f?.rooms.find((x) => x.id === id); return r ? roomReading(roomEntityIds(r, entityDevices(f), areaEntitiesOf(r)), states, mode) : null; },
  colorMode: (m) => { const b = $(`#modeBar [data-vm=${m}]`); if (!b) return false; b.click(); return true; }, imperial: () => imperial(),
  openCheck: () => { openSettingsAt('voice'); $('#vkBox').scrollIntoView({ block: 'start' }); },
});
const voiceCheck = initVoiceCheck({ $, t, voice: voiceUi, version: () => $('#versionPill').textContent, changed: () => voicePrefs.status() });   // ⚙ → 🎤 → 🩺 Mikrofon-Test (#511)
const voicePrefs = initVoicePrefs({ $, t, voice: voiceUi, check: voiceCheck, settings: () => settings, houseId: () => hs.id(), commit: () => commitSettings(),   // ⚙ → 🎤 Sprachsuche (voiceprefs.js)
  tryIt: () => { $('#settingsDialog').close(); voiceUi.listen(); } });
const settingsStore = initSettings({
  $, t, get: () => settings, set: (next) => { settings = next; }, ui: settingsUi, toDisp: (m) => toDisp(m), fromDisp: (v) => fromDisp(v), layout: () => layout,
  entities: () => entities, perfStored, perfKey: PERF_KEY, setStatus: (x) => setStatus(x), alert: (x) => alert(x), reload: () => location.reload(),
  facadeUi: initFacadeUi({ $, t }),                    // the facade (#448)
  parts: [favorites, lightGroups, todayPrefs, routinePrefs, mediaPrefs, presencePrefs, voicePrefs],   // ⚙ → "Quick access": favourites and light groups (#471); ⚙ → "Reiter unten": the calendars of ☀ Heute (#481); ⚙ → 🎤 (#509)
  committed: (prev) => {
    if (prev.lowWalls !== settings.lowWalls) lowWalls = settings.lowWalls;
    if (Math.abs(settings.wallHeight - prev.wallHeight) > 1e-6) {        // the wall height applies to every wall, not only to new ones
      snapshot();
      layout.floors.forEach((f) => f.walls.forEach((w) => { w.height = settings.wallHeight; }));
      changed();
    }
    applySettings(prev);
    build();
    if (houseMode && floorsMode(prev, true) !== floorsMode(settings, true)) fitCamera();   // pulled apart the house is taller
    voiceUi.update();                                                   // the 🎤 with the recognition chosen (#509)
  },
});
const loadSettings = () => settingsStore.load();
initNotifyUi({ $, t, entities: () => entities }); // settings: a message on alarm by WhatsApp (#414) and the alarm panels, notifyui.js
initSetGroups({ $, t });                         // settings in groups that fold open, with a search, setgroups.js
initGuardUi({ $, t, entities: () => entities, layout: () => layout });   // the holiday alarm: 🛡 button, lock screen, its settings (#456), guardui.js
const commitSettings = () => settingsStore.commit();
function applySettings(prev = {}) {
  setLanguage(settings.language);
  document.documentElement.dataset.theme = settings.theme;
  const rs = document.documentElement.style;
  rs.setProperty('--bg-top', settings.bgTop); rs.setProperty('--bg-bottom', settings.bgBottom); rs.setProperty('--bg-glow', settings.bgGlow); rs.setProperty('--bg-glow-s', String(settings.bgGlowStrength ?? 0));
  applyI18n();
  toolbarUi.apply();                                  // the captions of the tool groups in the new language (#422)
  scene.background = isHolo() || sky.on() ? null : new THREE.Color(themeColors().scene);   // the sky shows through the canvas (#418)
  renderer.shadowMap.enabled = settings.shadows && !LOW;
  sun.castShadow = settings.shadows && !LOW;
  markShadows();
  world.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  if (prev.grid !== settings.grid || prev.theme !== settings.theme || !grid) rebuildGrid();
  palettes.build(); fillEntities($('#entitySearch').value); renderProps();
  $('#hintText').textContent = isLive() ? t('hint.live') : t(`hint.${tool}`);
  updateNavToggles(); buildNav(true);
  applyStates();
}
initBackups({ t, commitSettings, prepare: async () => { if (!settingsStore.loaded()) await loadSettings(); settingsStore.fill(); },
  onOpen: () => timeline.renderSetDays() });                       // 🗄️ backup dialog in the top bar (backups.js, #321)
initVersion({ t, active: () => !isLive() && !!settings.updateCheck });

/* ================= Data loading ================= */
async function loadAreas() { let a; [a, batteryOf] = await Promise.all([fetchAreas(), fetchBatteries()]); ({ areas, areaOf } = a); }   // Home Assistant's areas and which entity is in which (livechannel.js)

function toState(e) { return toStateOf(e, settings.effectColors); }       // what is kept of an entity (entitystate.js)

/* ---- Entities renamed in Home Assistant: the plan of this view follows (renames.js) ---- */
const renamed = initRenames({
  layout: () => layout, mapUndo: (fn) => persist.mapUndo(fn), refresh: () => { build(); renderObjList(); renderProps(); },
  refetchSettings: () => settingsStore.refetch(), poll: () => liveChan.poll(),
});
/* ---- Live channel: pushed state changes, polling while it is down; the code lives in livechannel.js ---- */
const liveChan = initLiveChannel({
  paused: () => !!replayBack,
  entities: () => entities, setEntities: (x) => { entities = x; }, states: () => states, setStates: (x) => { states = x; }, toState: (e) => toState(e),
  wake: () => poke(), redraw: () => { applyStates(); renderRoomEntities(); renderEntState(); },   // a sensor that reports every second must not keep the picture at full speed (#494)
  firstLoad: async () => { await loadAreas(); fillEntities(); renderProps(); },
  renamed: (d) => { persist.renamed(d.revs?.[hs.id() || 'main']); renamed(d); },   // the stored plan was rewritten too: its new version tag (#403)
});
/* ---- Security view: a recorded day played back in the same view, nothing can be switched (timelineui.js, timeline.js) ---- */
const timeline = initTimeline({
  $, t, lang: () => currentLanguage(), name: (id) => entities.find((e) => e.entity_id === id)?.name || id, status: (x) => setStatus(x),
  enter: () => { replayBack = { mode, states, entities }; setMode('live'); },
  exit: () => {
    const back = replayBack; replayBack = null; ({ states, entities } = back);
    liveChan.poll(); if (back.mode !== mode) setMode(back.mode); else applyStates();
  },
  show: (rec) => {                                                     // the house as it was: the entity list and states of that moment
    entities = replayEntities(replayBack.entities, rec);
    states = Object.fromEntries(entities.map((e) => [e.entity_id, toState(e)]));
    wake(); applyStates(); renderRoomEntities(); renderEntState();
  },
});

/** the add-on's "Erdgeschoss" of a new house in the user's language; every list of the plan in place (layoutnorm.js) */
function localizeDefaults() { localizeDefaultsOf(layout, t('floor.default')); }
function normalizeLayout() { layout = normalizeLayoutOf(layout, t('floor.default'), uid); }

plan = createPlan({
  stage: $('#stage'),
  floor: () => floor(), layout: () => layout, getFloorIdx: () => floorIdx, settings: () => settings,
  shownFloor: () => shownFloor(), shownLayout: () => shownLayout(),   // what is drawn and picked: one building of several (#409)
  getTool: () => tool, getOpeningType: () => openingType, isLive: () => isLive(), isLocked: () => lockedSel,
  getSelection: () => selection,
  holdPlaced,
  setSelection: (h) => { multiSel.clear(); selection = h ? { kind: h.kind, id: h.id } : null; refreshSelection(); }, toggleMulti: (h) => multiSel.toggle(h), addMulti: (items) => multiSel.addAll(items), multiItems: () => multiSel.items(),
  snapshot, commit: () => changed(), deleteItem, rebuild3d: () => build(), calibrate: (a, b) => bgUi.calibrate(a, b),
  bgChanged: () => bgUi.render(), floorH: () => FLOOR_H, neighborOutlines: () => neighbors.outlines(elev(floorIdx)), ghostFloors: () => ghostFloors(), addBlock: blocks.addBlock, addHole: blocks.addHole, setPlot: blocks.setPlot, placeStair: (x, z) => stairTool.place(x, z), getStairTemplate: () => ({ id: 'tpl', ...stairTool.template() }), placeWallStair: (pts) => stairTool.placeWall(pts), wallStairDraft: (pts) => stairTool.wallDraft(pts),
  moveDeviceTo: (d, x, z) => moveDeviceTo(d, x, z), isItemLocked: (k, id) => !!itemOf(k, id)?.locked,
 
  liveMoveDevice: (d) => liveMove(d),
  roofRects: () => roofRectsHere(), dragRoof: (id, dx, dz) => dragRoofBy(id, dx, dz),   // roofs on the roof floor (#255, #257)
  resizeRoof: (id, b) => setRoofBox(floor(), id, b, autoRoofBox(floorIdx)),                // its size, at the corners and sides (#259)
  roofStepTarget: (id) => stepTarget(floor(), id, roofsUi.box(floorIdx)),                     // steps in the eaves of the main roof (#342)
  liveTap: (h) => liveSelect(h),
  deviceDoubleClick: (id) => deviceEntities(floor().devices.find((v) => v.id === id)).forEach((e) => live.quickAction(e)),   // #251: lives in livecontrols.js
  allDevices: () => layout.floors.flatMap((f, fi) => f.devices.map((d) => ({ d, fi }))), floorIndex: () => floorIdx, floorName: (i) => layout.floors[i]?.name || '',
  powerMode: () => power.isMode(), showCables: () => power.cablesShown(), isPowerType: (type) => power.isType(type), cablesOf: (d) => power.cablesOf(d), cableColor: (d, c) => power.cableColor(d, c), cableClick: (id) => power.cableClick(id),
  newDevice, findOpening, projectOnWall, clampOpeningPos, openingOverlaps, fitOpeningWidth, OPENING_DEFAULTS, uid, pointInPoly,
  roomHeat: (room, f) => (viewMode === 'normal' ? null : roomHeat(room, f)),
  states: () => states, isOn: (e) => ON_STATES.has(states[e]?.state), stateText, openText, fmtLen, t, setStatus, measure: measureTool,
  area: (p) => (imperial() ? `${(polyArea(p) * 10.7639).toFixed(0)} ft²` : `${polyArea(p).toFixed(1)} m²`),
});

var booted = false;                                       // init() is through: layout, models and first scene are there (test hook ready())
async function init() {
  if (params.get('kiosk') || card) document.body.classList.add('kiosk');
  try { me = await (await fetch('api/me')).json(); } catch { /* standalone */ }
  const start = startup(me, params);                      // wall tablet, room tablet, read-only, live (appstate.js)
  tabletRoom = start.tabletRoom;
  document.body.classList.toggle('kiosk', start.kiosk);
  if (tabletRoom) document.body.classList.add('roomtablet');
  if (start.readonly) document.body.classList.add('readonly');
  if (!me.canEdit && me.adminCheck === false) setStatus(t('me.noAdminCheck'));
  if (!(await loadSettings())) setStatus(t('set.notLoaded'));
  settingsStore.usePreset(card ? { ...me.preset, ...card.look } : me.preset, card ? CARD_FIELDS : undefined);   // this user's / tablet's own start values for the look (#250), and the dashboard card's (#13): never saved
  locks = applyLocks(document, me.locks);                 // and what this user may not use: hidden here, control / cameras refused by the server
  lowWalls = settings.lowWalls;
  setLanguage(settings.language);
  initLogin(me, t);                                       // without the Supervisor: logged in with Home Assistant (#489)
  full.refresh();                                         // a full screen kept on for this user (#487), in this language
  voiceUi.update();                                       // the 🎤 where this browser can listen and the user may (#509)
  await hs.load();
  try { layout = await persist.load(); } catch { setStatus(t('loadFailed')); }
  normalizeLayout();
  buildingsUi.start(me.building, (me.locks || []).includes('building'));   // one building of several: this user's / tablet's, maybe kept to it (#409)
  knownRooms = roomIds();
  floorIdx = groundIdx();                                 // start on the ground floor, not in the basement
  hs.renderUi(); neighbors.renderUi();
  await palettes.loadModels();
  applySettings();
  fillFloorSelect(); fillEntities(); setTool('select'); resize(); build(); fitCamera(); bgUi.render(); renderFloorPanel();
  if (start.live || phoneMenu.isPhone()) setMode('live');
  if (tabletRoom) {
    const hit = findRoomByName(tabletRoom);
    if (hit) { switchFloor(hit.floor); focusRoom(hit.room.id); roomPanel.open(hit.room.id); }
    updateHouseToggle();
  }
  if (cardUi?.start()) updateHouseToggle();               // the dashboard card's floor or whole house (#13)
  else if (await startView.apply(me.start)) {             // a saved start view (#315): the user's own or everybody's
    const hit = tabletRoom && findRoomByName(tabletRoom);
    if (hit && focusedRoom === hit.room.id) roomPanel.open(hit.room.id);
    updateHouseToggle();
  }
  cardUi?.heat();                                         // the card's room colouring (temperature, humidity, CO2)
  tabsUi.update(); tabsUi.home();                         // the tab bar (#479): this user's / tablet's start tab
  liveChan.start();                                         // first full list, the live channel, polling while it is down
  booted = true;
}

var lastActive = performance.now(), lastFrame = 0;
var shadowDirty = true, lastShadow = 0;                           // the shadow map is drawn again only when something changed (frameloop.js, #253)
function markShadows() { shadowDirty = true; }
function wake() { lastActive = performance.now(); }
function poke() { lastFrame = 0; }                                // one frame now, without waking the picture: a state from Home Assistant (#494)
['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart', 'touchmove'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
controls.addEventListener('change', wake);
const perfHud = initPerfHud({ $, renderer, low: LOW, param: params.get('fps'), lang: currentLanguage, onChange: wake });   // FPS and more, chosen in the View menu (perfhud.js)
function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  if (document.hidden || cardUi?.panelOnly() || tabsUi.covered()) return;   // screen off / tab in background / a card with only the room panel / a page of the tab bar: draw nothing
  const due = frameDue(now, lastActive, lastFrame, LOW);          // nothing happens or a weak tablet: a few frames a second are enough (frameloop.js)
  if (!due.draw) return;
  if (due.throttled) lastFrame = now;
  const frameStart = performance.now();
  if (cams.pulse(now)) wake();   // a camera sees movement
  const pulsing = alertsUi.animate(now), finding = search.animate(now);       // pulsing warnings and the search ring move
  if (pulsing || finding || controls.autoRotate) wake();
  controls.update();
  if (updateCutaway()) markShadows();                            // walls sinking or rising: their shadows change
  compass.update();
  if (animateOpenings()) { markShadows(); wake(); }              // a door or window leaf moving: smoothly to its end (a state only pokes one frame, #494)
  power.animate(now);
  selHelper?.update();
  declutterLabels();
  tapBalls.declutter(camera, canvas.clientWidth, canvas.clientHeight);   // tap balls that land on each other on the screen move apart (#314)
  floorCards.place();
  roomLabels.place();                                            // the labels over the rooms follow the camera (#430)
  if (shadowDue(shadowDirty, now, lastShadow)) { renderer.shadowMap.needsUpdate = true; shadowDirty = false; lastShadow = now; }   // shadows only when something changed (#253)
  renderer.render(scene, camera);
  perfHud.frame(now, due, frameStart);
}
init();
animate();

/* Test hook: only active with ?debug=1, used by the browser tests to find objects on screen. */
if (params.get('debug')) {
  window.__fp = {
    ready: () => booted,
    openRoomPanel(id) { roomPanel.open(id); },
    showPopup(id) { popup.show(id); },                // the live card of a device, as a tap opens it
    powerLinks: () => power.links(),
    powerInfo: () => power.info(),
    energy: () => energyBalance(states, layout),
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
    get layout() { return layout; }, settings: () => settings, offline: () => offline.devices(), alerts: () => alertsUi.list(), alertPulsing: () => alertsUi.pulses.length, kioskTick: () => kiosk.tick(), kioskIdle: (ms) => kiosk.idle(ms), autoRotate: () => controls.autoRotate, findItems: (q) => search.findItems(q), findMarks: () => search.marks(), voiceAsk: (x) => voiceUi.ask(x), navArrows: () => [!$('#navLeft').hidden, !$('#navRight').hidden], navBar: () => $('#navBar'),
    renderer, scene, frame: () => { const t0 = performance.now(); controls.update(); updateCutaway(); animateOpenings(); selHelper?.update(); const t1 = performance.now(); renderer.render(scene, camera); return [t1 - t0, performance.now() - t1]; },
    houseId: () => hs.id(), states: () => states,
    coneScreen(id) {                                          // screen point in the middle of a camera cone (for tests)
      const v = cams.coneCenter(id);
      if (!v) return null;
      v.project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    elev: (i) => elev(i),
    roofMeshes: () => { const out = []; scene.traverse((o) => { if (o.userData?.roofPart) { const w = new THREE.Vector3(); o.getWorldPosition(w); out.push({ tag: o.userData.roofPart, y: +w.y.toFixed(3), tris: (o.geometry?.attributes?.position?.count || 0) / 3, part: o.userData.dormerPart || null, box: ((b3) => [b3.min.x, b3.max.x, b3.min.z, b3.max.z].map((v) => +v.toFixed(3)))(new THREE.Box3().setFromObject(o)) }); } }); return out; },
    heatGlow: (id) => registry.get(id)?.userData.heat?.[0]?.emissiveIntensity ?? -1,
    cutInfo: () => cutawayWalls.map((c) => ({ id: c.group.userData.id, n: c.n, fade: c.fade ?? 1, low: c.low })), camAt: (x, y, z, tx = controls.target.x, tz = controls.target.z) => { controls.target.set(tx, controls.target.y, tz); camera.position.set(x, y, z); controls.update(); },   // for tests
    liveHitAt: (x, y) => { const h = pickHit({ clientX: x, clientY: y }); return h ? { kind: h.data.kind, id: h.data.id, ball: !!h.data.tapBall } : null; },   // ball: a tap ball or a heater's temperature was hit
    touchSize: (id) => { let m = 0; registry.get(id)?.children.forEach((c) => { if (c.userData.touchOnly) { c.geometry.computeBoundingBox(); const s = c.geometry.boundingBox.getSize(new THREE.Vector3()); m = Math.min(s.x, s.y, s.z); } }); return m; },
    addRoofForTest: () => { layout.floors.push(newFloor('roof', 'Dach', uid())); build(); }, viewShift: () => (camera.view?.enabled ? camera.view.offsetY : 0), camFar: () => { camera.position.set(controls.target.x, 60, controls.target.z + 60); controls.update(); }, roofFactor: () => Math.max(...roofsUi.faded.flatMap((r) => r.mats.map((m) => m.x.opacity / (m.base || 1)))),
    liveTapRoom: (id) => liveSelect({ kind: 'room', id }), liveTap: (id) => liveSelect({ kind: 'device', id }), focusedRoom: () => focusedRoom, cam: () => camera.position.toArray(),   // for tests
    select(kind, id) { selection = { kind, id }; refreshSelection(); },
    selectMany: (items) => multiSel.selectOnly(items),               // several things selected at once (for tests, #405)
    houseCards: () => [...document.querySelectorAll('.floorCard')].map((e) => e.innerText),
    rebuild: () => build(), applyStates: () => applyStates(),
    switchHouse,
    paneTargets: (id) => (registry.get(id)?.userData.panePivots || []).map((p) => p.userData.target),
    shutterScale: (id) => registry.get(id)?.userData.shutter?.userData.target ?? null,   // how far a window's roller shutter goes down (#331)
    liveOk: () => liveChan.ok(),
    underFloors: (id) => { let ok = false; registry.get(id)?.traverse((o) => { if (o.isMesh) ok = o.renderOrder < 0 && [].concat(o.material).every((m) => !m.depthWrite); }); return ok; },
    bounds: () => floorBounds(), roofBox: (i) => roofBox(i),
    switchFloor: (i) => switchFloor(i),
    blockOpen: (id) => { const sh = [].concat(registry.get(id)?.geometry?.parameters?.shapes || []); return sh.length > 1 || sh.some((x) => x.holes.length > 0); },
    solidShape: (id) => { let ok = false; registry.get(id)?.traverse((o) => { if (o.isMesh && [].concat(o.material).some((m) => !m.transparent || m.opacity > 0.3)) ok = true; }); return ok; },
    roofCut: (id) => { let n = 0; registry.get(id)?.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { n = Math.max(n, m.userData.attic || 0); }); }); return n; },   // roof planes cutting wall id (#260)
    roofKeep: (id) => { let n = 0; registry.get(id)?.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { n = Math.max(n, m.userData.atticU?.atticNR.value || 0); }); }); return n; },
    roofRise: (id) => { let n = 0; registry.get(id)?.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { n = Math.max(n, ...(m.userData.atticU?.atticRise.value || []).map((v) => v.x)); }); }); return n; },   // a shed dormer's sloping ceiling over wall id (#339)   // dormer rooms kept on wall id (#265)
    clipped: (id) => { let n = 0; registry.get(id)?.traverse((o) => { if (o.material && [].concat(o.material).some((m) => m.clippingPlanes?.includes(earth.plane))) n++; }); return n; },
    earthDbg: () => ({ n: earth.plane.normal.toArray(), c: earth.plane.constant, solid: earth.lawn(), cut: earth.cut(), capVisible: !!earth.info()?.cap.visible, capVerts: earth.info()?.cap.geometry.getAttribute('position')?.count || 0, gridShown: !!grid?.visible, box: earth.box(), ground: earth.ground(), pads: earth.pads() }),
    stateOf: (e) => states[e]?.state,
    fakeState(e, st, unit) { states[e] = { ...(states[e] || {}), state: st, ...(unit ? { unit } : {}) }; applyOpenings(); },
    has: (id) => registry.has(id),
    upper: (id) => { const u = registry.get(id)?.userData.upper; return u ? u.visible : null; },   // the storeys of a stair above the open floor (#246)
    badge: (id) => labelSprites.get(id)?.userData.text ?? null,
    badgePill: (id) => !!labelSprites.get(id)?.userData.pill,
    badgeScreen: (id) => {                                           // the value badge of a device on the screen, null while it does not show
      const sp = labelSprites.get(id);
      if (!sp?.visible) return null;
      const v = sp.getWorldPosition(new THREE.Vector3()).project(camera), r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    selection: () => selection,
    multi: () => multiSel.items(),
    ballScreen: (id) => {                                            // the tap ball of a device on the screen, null while it does not show (#238)
      const b = tapBalls.ball(id);
      if (!b?.visible) return null;
      const v = b.getWorldPosition(new THREE.Vector3()).project(camera), r = canvas.getBoundingClientRect();
      const w = b.getWorldPosition(new THREE.Vector3()), px = (r.height / 2 / Math.tan((camera.fov * Math.PI) / 360)) / w.distanceTo(camera.position);
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height, r: ((b.children[0]?.scale.x || 0) / 2) * px };   // r: radius in pixels (#314)
    },
    ballSize: (id) => { const s = tapBalls.ball(id)?.children[0]; return s ? +s.scale.x.toFixed(3) : null; },   // the shown size of a tap ball (m, #262)
    ballIcon: (id) => tapBalls.icon(id),
    ballOff: (id) => tapBalls.off(id),                               // the offline sign on a tap ball: 'offline' | 'unlinked' | null (#375)
    offMark: (id) => (offMarks.shown(id) ? offMarks.reason(id) : null),   // the offline sign over a thing without a ball (#375)
    openingLook: (id) => registry.get(id)?.userData.look ?? null,    // a door / window: open (red), closed (green frame), offline (amber), #375                             // the icon of a tap ball ('switch': the drawn light switch, #366)
    roomLights: (id) => {                                            // the lamps lighting a room now: reach (m) and colour (0..1), #367
      const rm = roomMeshes.get(id), U = (isHolo() ? rm?.mesh : rm?.glow)?.material.uniforms;
      return U?.uCount ? Array.from({ length: U.uCount.value }, (_, i) => ({ r: +U.uPos.value[i].w.toFixed(3), c: U.uCol.value[i].toArray().map((v) => +v.toFixed(3)) })) : null;
    },
    ballY: (id) => { const b = tapBalls.ball(id); return b ? +b.position.y.toFixed(3) : null; },   // height of a tap ball over its floor (a shutter's: over the window, #335)
    neighborCount: () => world.children.filter((c) => c.userData.neighbor).length, neighborOutlines: () => neighbors.outlines(elev(floorIdx)).length,
    devPose: (id) => { const o = registry.get(id); if (!o) return null; o.updateWorldMatrix(true, true); const n = new THREE.Vector3(0, 1, 0).applyQuaternion(o.getWorldQuaternion(new THREE.Quaternion())), bx = new THREE.Box3(); o.children.forEach((c) => { if (!c.userData.proxy) bx.expandByObject(c); }); const sz = bx.getSize(new THREE.Vector3()); return { y: +o.getWorldPosition(new THREE.Vector3()).y.toFixed(3), n: n.toArray().map((v) => +v.toFixed(3)), mount: o.userData.onRoof || null, size: [+sz.x.toFixed(2), +sz.z.toFixed(2)], h: +sz.y.toFixed(2), minY: +bx.min.y.toFixed(3), visible: o.visible }; },
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
    plan: () => plan, measure: () => measureTool,
    topDown() { is2d = true; controls.enableRotate = false; build(); fitCamera(); },     // test helper: orthogonal-ish camera above the floor
    pickAt(x, y) { const h = pickHit({ clientX: x, clientY: y }); return h ? { kind: h.data.kind, id: h.data.id, seg: h.data.seg } : null; },
    ringGlow: (id) => (registry.get(id)?.userData.segs || []).map((sg) => sg.glow[0].emissiveIntensity > 0),
    glowColors: (id) => (registry.get(id)?.userData.glow || []).map((m) => (m.emissiveIntensity > 0 ? `#${m.emissive.getHexString()}` : null)),   // the lit parts of a device: their colour, null while off
    ringSegScreen(id, i) {                                        // screen position of the middle of an LED ring section
      const v = registry.get(id)?.children[i]?.getObjectByName('mid')?.getWorldPosition(new THREE.Vector3());
      if (!v) return null;
      v.project(camera); const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    rayHits(x, y) { setRay({ clientX: x, clientY: y }); return picking.ray.intersectObjects(pickables, true).map((h) => { let o = h.object; while (o && !o.userData.kind) o = o.parent; return `${o?.userData.kind}:${o?.userData.id}@${h.distance.toFixed(2)}${h.object.userData.proxy ? 'P' : ''}`; }); },
    openingCenter(id) {                 // screen position of the middle of a door/window (not its base)
      const o = registry.get(id); if (!o) return null;
      const fo = findOpening(id); const v = o.getWorldPosition(new THREE.Vector3()); v.y += fo.opening.sill + fo.opening.height / 2;
      v.project(camera); const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
  };
}
