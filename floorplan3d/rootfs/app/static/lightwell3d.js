/* 🕳 The light wells in 3D (#786): a box of concrete in front of a basement window, open at the top, gravel at its bottom, a galvanised frame
 * and a grating (Gitterrost) on top you can look through. Where they lie and how deep comes from lightwell.js (pure, tested); earth.js and
 * yard3d.js cut the lawn and the areas of the plot open over them (rings()). initLightWells is wired in app.js. */
import * as THREE from './vendor/three.module.min.js';
import { lightWells, groundFn, wellState, WELL } from './lightwell.js';
import { HOLO } from './modelfx.js';

const CELL_U = 0.034, CELL_D = 0.1;            // the mesh of the grating: bearing bars every 3.4 cm, cross bars every 10 cm

let gratingTex = null;
/** the grating: bars on a transparent ground (alphaTest), one cell of the mesh per repeat */
function grating() {
  if (gratingTex) return gratingTex;
  const c = document.createElement('canvas'); c.width = 16; c.height = 32;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 16, 32);
  x.fillStyle = '#c9ced3'; x.fillRect(0, 0, 6, 32);          // a bearing bar, along the depth of the well (wide enough to stay when far away)
  x.fillStyle = '#b4b9bf'; x.fillRect(0, 0, 16, 4);          // a cross bar
  gratingTex = new THREE.CanvasTexture(c);
  gratingTex.wrapS = gratingTex.wrapT = THREE.RepeatWrapping;
  gratingTex.colorSpace = THREE.SRGBColorSpace;
  gratingTex.anisotropy = 4;
  return gratingTex;
}

/** a box w × h × d with its bottom at y0, its middle at (x, z) of the well's own frame (x across, z out from the wall) */
function box(w, h, d, mat, x, y0, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.001, w), Math.max(0.001, h), Math.max(0.001, d)), mat);
  m.position.set(x, y0 + h / 2, z);
  return m;
}

/** the materials, made once per build: { body, inner, gravel, metal, grate } */
function materials(holo, clip) {
  const cl = clip ? [clip] : [];
  if (holo) {
    const m = new THREE.MeshBasicMaterial({ color: HOLO.fill, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: cl });
    return { body: m, inner: m, gravel: m, metal: new THREE.MeshBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.6, clippingPlanes: cl }), grate: null };
  }
  return {
    body: new THREE.MeshStandardMaterial({ color: 0xb7b2a9, roughness: 0.92, clippingPlanes: cl }),          // precast concrete
    inner: new THREE.MeshStandardMaterial({ color: 0xd6d2ca, roughness: 0.85, clippingPlanes: cl }),         // lighter inside: it throws the light in
    gravel: new THREE.MeshStandardMaterial({ color: 0x8e8779, roughness: 1, clippingPlanes: cl }),
    metal: new THREE.MeshStandardMaterial({ color: 0xa7adb3, metalness: 0.55, roughness: 0.42, clippingPlanes: cl }),   // galvanised steel
    grate: new THREE.MeshStandardMaterial({ map: grating(), color: 0xffffff, metalness: 0.5, roughness: 0.45, alphaTest: 0.3, transparent: false, side: THREE.DoubleSide, clippingPlanes: cl }),
  };
}

/** one light well (lightwell.js lightWells' entry) as a group, in the frame of its floor */
export function wellMesh(wl, mats, holo = false) {
  const g = new THREE.Group(), { w, d, rim, bottom } = wl, k = WELL.wall, base = bottom - 0.08, hw = w / 2;
  g.position.set(wl.x, 0, wl.z);
  g.rotation.y = Math.atan2(wl.nx, wl.nz);            // its z points out from the wall, its x along the wall
  const parts = [
    box(w, 0.08, d, mats.body, 0, base, d / 2),                                    // the bottom slab
    box(k, rim - base, d, mats.body, -hw + k / 2, base, d / 2),                    // the sides,
    box(k, rim - base, d, mats.body, hw - k / 2, base, d / 2),
    box(w - 2 * k, rim - base, k, mats.body, 0, base, d - k / 2),                 // the front
    box(w - 2 * k - 0.004, rim - bottom - 0.02, 0.004, mats.inner, 0, bottom, d - k - 0.002),   // light inside
    box(w - 2 * k, 0.03, d - k, mats.gravel, 0, bottom, (d - k) / 2),             // gravel to drain
  ];
  const F = 0.035, FH = 0.025;                                                     // the frame round the top
  parts.push(box(w, FH, F, mats.metal, 0, rim - FH, d - F / 2), box(w, FH, F, mats.metal, 0, rim - FH, F / 2),
    box(F, FH, d, mats.metal, -hw + F / 2, rim - FH, d / 2), box(F, FH, d, mats.metal, hw - F / 2, rim - FH, d / 2));
  if (mats.grate) {                                                                // the grating, flush with the frame
    const gw = w - 2 * F, gd = d - 2 * F, geo = new THREE.PlaneGeometry(gw, gd);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (gw / CELL_U), uv.getY(i) * (gd / CELL_D));
    geo.rotateX(-Math.PI / 2);
    const gr = new THREE.Mesh(geo, mats.grate);
    gr.position.set(0, rim - 0.006, d / 2);
    gr.userData.wellGrate = true;
    parts.push(gr);
  }
  parts.forEach((m) => { m.castShadow = m.receiveShadow = !holo; g.add(m); });
  g.userData.lightWell = wl.op.id;
  return g;
}

/** ctx: layout() (the house shown), groundIdx(), floorH(), terrain() (the height of the ground (x, z) on a slope or null), drawn(i) (floor i
 *  is drawn now). Returns { wells(i), rings(), info(i, w, op), build(g, i, { holo, clip }) } */
export function initLightWells(ctx) {
  /** the light wells of floor i (lightwell.js), heights over its floor */
  function wells(i) {
    const L = ctx.layout(), gi = ctx.groundIdx();
    if (!L?.floors?.[i] || !(i < gi)) return [];
    return lightWells(L.floors, i, gi, (i - gi) * ctx.floorH(), groundFn(L.plot?.areas, ctx.terrain?.() || null));
  }
  /** the outlines of all light wells drawn now: the ground is cut open there */
  function rings() {
    const gi = ctx.groundIdx(), out = [];
    for (let i = 0; i < gi; i++) if (!ctx.drawn || ctx.drawn(i)) wells(i).forEach((wl) => out.push(wl.ring));
    return out;
  }
  /** what the window op on wall w of floor i says about its light well, for the panel: { state (lightwell.js wellState), deep } */
  function info(i, w, op) {
    const L = ctx.layout(), gi = ctx.groundIdx();
    if (!L?.floors?.[i] || !w) return { state: 'none', deep: 0 };
    const state = wellState(L.floors, i, gi, (i - gi) * ctx.floorH(), groundFn(L.plot?.areas, ctx.terrain?.() || null), w, op);
    const wl = state === 'on' ? wells(i).find((x) => x.op.id === op.id) : null;
    return { state, deep: wl?.deep || 0 };
  }
  /** the light wells of floor i into its group g */
  function build(g, i, { holo = false, clip = null } = {}) {
    const list = wells(i);
    if (!list.length) return 0;
    const mats = materials(holo, clip);
    list.forEach((wl) => g.add(wellMesh(wl, mats, holo)));
    return list.length;
  }
  return { wells, rings, info, build };
}
