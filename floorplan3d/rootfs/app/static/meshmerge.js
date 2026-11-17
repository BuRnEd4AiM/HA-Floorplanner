/* Fewer draw calls (#394): a built-in device model is made of many small parts (a back bar of over 100 boxes, a wine fridge of 85), and every
 * part was one draw call, about 3000 for the devices of the show house alone. A desktop draws that easily, an iPad in Safari does not: the
 * picture lagged. mergeParts joins the parts of one model that look the same (the same material, or materials that are equal) into one mesh,
 * so a model costs about as many draw calls as it has materials. It looks exactly the same: the parts keep their places, sizes and turns.
 * Left alone: parts that something changes later (referenced from the model's userData, with userData of their own, hidden ones, with
 * children), and materials that change with the state of the device (glow, heat, LED: they keep their own mesh per material).
 * three.js only (unit test: tests/meshmerge.test.mjs). */
import * as THREE from './vendor/three.module.min.js';
import { mergeGeometries } from './vendor/utils/BufferGeometryUtils.js';

/** every three.js object and material reachable from a userData value (arrays and plain objects, a few levels deep) */
export function referenced(userData, out = { objects: new Set(), materials: new Set() }, depth = 0) {
  if (!userData || typeof userData !== 'object' || depth > 4) return out;
  if (userData.isObject3D) { out.objects.add(userData); return out; }
  if (userData.isMaterial) { out.materials.add(userData); return out; }
  for (const v of Array.isArray(userData) ? userData : Object.values(userData)) referenced(v, out, depth + 1);
  return out;
}

const hex = (c) => (c?.isColor ? c.getHex() : '');
const TEXTURES = ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'aoMap', 'bumpMap', 'envMap', 'lightMap'];
/** the look of a material as a text: two materials with the same key draw the same. null for a material that has to stay itself: one with
 *  a texture, userData of its own (a lamp's own colour ...) or one the model refers to (it changes with the state) */
export function lookKey(m, live = new Set()) {
  if (!m?.isMaterial || live.has(m) || Object.keys(m.userData || {}).length || TEXTURES.some((k) => m[k])) return null;
  return [m.type, hex(m.color), hex(m.emissive), m.emissiveIntensity, m.roughness, m.metalness, m.opacity, m.transparent, m.side, m.depthWrite,
    m.depthTest, m.wireframe, m.flatShading, m.vertexColors, m.alphaTest, m.visible, m.fog, m.blending].join('|');
}

/** the attributes of a geometry as a text: only geometries with the same attributes (and both with or without an index) can be merged */
export const geoKey = (g) => `${g.index ? `i${g.index.array.constructor.name}` : 'n'}|${Object.entries(g.attributes)
  .map(([k, a]) => `${k}${a.itemSize}${a.normalized ? 'n' : ''}${a.isInterleavedBufferAttribute ? 'x' : a.array.constructor.name}`).sort().join(',')}|${Object.keys(g.morphAttributes).length}`;

/** may this mesh be merged: a plain, visible part without children and without anything that refers to it (or to a group it sits in) */
function plain(o, root, refs) {
  if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.children.length || !o.visible) return false;
  if (Object.keys(o.userData).length || !o.geometry.attributes.position) return false;   // (groups of a box or cylinder do not matter with one material)
  for (let p = o; p && p !== root; p = p.parent) {
    if (refs.objects.has(p) || !p.visible) return false;
    if (p !== o && Object.keys(p.userData).length) return false;
  }
  return true;
}

/** a copy of geometry g moved by matrix mx; a mirroring matrix turns the triangles round, so their front stays outside */
function placed(g, mx) {
  const c = g.clone().applyMatrix4(mx);
  if (mx.determinant() >= 0) return c;
  if (c.index) {
    const ix = c.index.array;
    for (let i = 0; i + 2 < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  } else {
    Object.values(c.attributes).forEach((a) => {
      const s = a.itemSize, arr = a.array;
      for (let i = 0; i + 3 * s <= arr.length; i += 3 * s) for (let k = 0; k < s; k++) { const t = arr[i + s + k]; arr[i + s + k] = arr[i + 2 * s + k]; arr[i + 2 * s + k] = t; }
    });
  }
  return c;
}

/** join the parts of model `root` that look the same into one mesh each (in root's own frame). Returns how many meshes were saved. */
export function mergeParts(root) {
  const refs = referenced(root.userData);
  root.traverse((o) => { if (o !== root && o.userData) referenced(o.userData, refs); });
  const live = refs.materials;
  const groups = new Map(), firstMat = new Map();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!plain(o, root, refs)) return;
    const look = lookKey(o.material, live);
    const mk = look ?? o.material.uuid;
    if (!firstMat.has(mk)) firstMat.set(mk, o.material);
    const key = `${mk}#${geoKey(o.geometry)}#${o.renderOrder}#${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}`;
    (groups.get(key) || groups.set(key, { mat: mk, list: [] }).get(key)).list.push(o);
  });
  const inv = root.matrixWorld.clone().invert(), rel = new THREE.Matrix4();
  let saved = 0;
  groups.forEach(({ mat, list }) => {
    if (list.length < 2) return;
    const geo = mergeGeometries(list.map((o) => placed(o.geometry, rel.multiplyMatrices(inv, o.matrixWorld))), false);
    if (!geo) return;                                            // something did not fit: the parts stay as they are
    const m = new THREE.Mesh(geo, firstMat.get(mat));
    m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.renderOrder = list[0].renderOrder;
    list.forEach((o) => o.removeFromParent());
    root.add(m);
    saved += list.length - 1;
  });
  if (saved) dropEmpty(root, root, refs);
  return saved;
}

/** groups left empty by the merge go too (they cost a little in every frame), unless something refers to them */
function dropEmpty(o, root, refs) {
  [...o.children].forEach((c) => dropEmpty(c, root, refs));
  if (o !== root && o.type === 'Group' && !o.children.length && !refs.objects.has(o) && !Object.keys(o.userData).length) o.removeFromParent();
}

/** the look of a material without its colour: parts whose materials differ in nothing but the colour can be one mesh, the colour then
 *  sits on every corner of the part (blended). null as lookKey, and for a material that has such colours itself */
export function blendKey(m, live = new Set()) {
  if (lookKey(m, live) === null || m.vertexColors) return null;
  return [m.type, hex(m.emissive), m.emissiveIntensity, m.roughness, m.metalness, m.opacity, m.transparent, m.side, m.depthWrite,
    m.depthTest, m.wireframe, m.flatShading, m.alphaTest, m.visible, m.fog, m.blending].join('|');
}

const floats = (a) => !!a && !a.isInterleavedBufferAttribute && a.array instanceof Float32Array;
/** can this part go into a blended mesh: plain corners and their directions, nothing that moves by itself */
const blendable = (g) => floats(g.attributes.position) && floats(g.attributes.normal) && g.attributes.position.itemSize === 3
  && g.attributes.normal.itemSize === 3 && !Object.keys(g.morphAttributes).length;

/** the part o for a blended mesh: its geometry moved by mx with nothing but the corners, their directions and the colour of its material on
 *  every corner (always with an index, so all parts fit together) */
function coloured(o, mx) {
  const c = placed(o.geometry, mx), g = new THREE.BufferGeometry(), n = c.attributes.position.count, col = new Float32Array(n * 3);
  const { r, g: gr, b } = o.material.color;
  for (let i = 0; i < n; i++) { col[i * 3] = r; col[i * 3 + 1] = gr; col[i * 3 + 2] = b; }
  g.setAttribute('position', c.attributes.position);
  g.setAttribute('normal', c.attributes.normal);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(c.index ? Array.from(c.index.array) : Array.from({ length: n }, (_, i) => i));
  return g;
}

/** how much later the parts that stay themselves are drawn than the merged ones (renderOrder) */
export const LATER = 1e-4;

/**
 * Fewer draw calls in the live mode (#138, the show house drew 1661 times in the whole house, 1205 after the first step): there nobody
 * moves furniture, so the parts of all models on one floor that look the same are drawn as one mesh, the grey of the sofa with the grey of
 * the shelf, as mergeParts does inside one model. Since 5.14.1 the colour does not have to be the same: it sits on the corners of every
 * part (blendKey), so a floor needs about one mesh per kind of surface (matt, shiny, glowing ...), not one per colour. `container` is the
 * floor's group, `roots` the models. Only plain parts go into the merged meshes (they stay in their model, hidden); a model keeps every part something
 * refers to (what a state changes: glow, heat, LED, a moving part). Left alone too: hidden models, glass (transparent parts are drawn in
 * the order of their distance), parts with a texture and parts cut by a plane (the earth). Returns what unbatch needs to put the parts
 * back (the editor moves them one by one), null when nothing was merged.
 */
export function batchModels(container, roots) {
  const models = [], looks = new Map();
  container.updateMatrixWorld(true);
  roots.forEach((root) => {
    if (!root.visible) return;
    const refs = referenced(root.userData);
    root.traverse((o) => { if (o !== root && o.userData) referenced(o.userData, refs); });
    const mine = [];
    root.traverse((o) => {
      if (!plain(o, root, refs) || !blendable(o.geometry)) return;
      const look = blendKey(o.material, refs.materials);
      if (look === null || o.material.transparent || o.material.clippingPlanes?.length) return;
      mine.push({ o, key: `${look}#${o.renderOrder}#${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}` });
    });
    if (!mine.length) return;
    // Two faces of a model that lie nearly on each other (the cells on a solar panel, 5 mm over its frame) look the same depth from far
    // away; then the one drawn later is in front, and three.js draws solid things in the order their materials were made. The merged
    // meshes keep that order inside every model: its parts sorted by material, each noting where its material stands (0 first, 1 last)
    mine.sort((p, q) => p.o.material.id - q.o.material.id);
    const ids = [...new Set(mine.map(({ o }) => o.material.id))];
    mine.forEach(({ o, key }) => {
      const l = looks.get(key) || looks.set(key, { rank: 0, n: 0, first: o.material.id }).get(key);
      l.rank += ids.length > 1 ? ids.indexOf(o.material.id) / (ids.length - 1) : 0.5; l.n++;
    });
    models.push(mine);
  });
  // the looks in the order most models have them (the body first, the details last) ...
  const pos = new Map([...looks.entries()].sort(([, p], [, q]) => p.rank / p.n - q.rank / q.n || p.first - q.first).map(([key], i) => [key, i]));
  // ... and a model that has them the other way round (frame, cells, lines: the lines look like the frame) starts a new layer there
  const groups = new Map();
  models.forEach((mine) => {
    let layer = 0, last = -1, lastMat = null;
    mine.forEach(({ o, key }) => {
      const at = pos.get(key);
      if (at < last && o.material !== lastMat) layer++;
      last = at; lastMat = o.material;
      const k = `${layer}|${key}`;
      (groups.get(k) || groups.set(k, { layer, at, list: [] }).get(k)).list.push(o);
    });
  });
  const inv = container.matrixWorld.clone().invert(), rel = new THREE.Matrix4(), meshes = [], parts = [];
  [...groups.values()].filter((g) => g.list.length > 1).sort((p, q) => p.layer - q.layer || p.at - q.at).forEach(({ list }) => {   // one part alone: no gain
    const geo = mergeGeometries(list.map((o) => coloured(o, rel.multiplyMatrices(inv, o.matrixWorld))), false);
    if (!geo) return;
    const mat = list[0].material.clone();                        // made in this order, so drawn in this order
    mat.color.set(0xffffff); mat.vertexColors = true;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.renderOrder = list[0].renderOrder;
    m.userData.batch = true;
    container.add(m);
    meshes.push(m);
    list.forEach((o) => { parts.push(o); o.visible = false; });  // hidden, not taken out: the model keeps its size for whoever measures it, and a tap still hits it
  });
  if (!meshes.length) return null;
  // what stays itself in these models (a glowing screen 3 mm in front of its TV) was made before the merged materials: drawn a touch later
  const later = [];
  models.forEach((mine) => {
    let root = mine[0].o;
    while (root.parent && !roots.includes(root)) root = root.parent;
    root.traverse((o) => {
      if (!o.isMesh || !o.visible || [].concat(o.material).some((x) => x.transparent || !x.visible)) return;
      later.push({ o, renderOrder: o.renderOrder });
      o.renderOrder += LATER;
    });
  });
  return { meshes, parts, later };
}

/** the parts of batchModels shown again in their models, the merged meshes away */
export function unbatch(b) {
  if (!b) return;
  b.meshes.forEach((m) => { m.removeFromParent(); m.geometry.dispose(); m.material.dispose(); });
  b.parts.forEach((o) => { o.visible = true; });
  b.later.forEach(({ o, renderOrder }) => { o.renderOrder = renderOrder; });
}
