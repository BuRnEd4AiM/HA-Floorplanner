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

/**
 * Fewer draw calls in the live mode (#138, the show house drew 1661 times in the whole house): there nothing changes furniture that is
 * linked to nothing (staticDevice in pickrules.js), so the parts of all of it on one floor that look the same are drawn as one mesh, the
 * grey of the sofa with the grey of the shelf, as mergeParts does inside one model. `container` is the floor's group, `roots` the models.
 * Only plain parts move into the merged meshes; a model keeps its pick box and every part something refers to. Left alone too: glass
 * (transparent parts are drawn in the order of their distance) and parts cut by a plane (the earth). Returns what unbatch needs to put
 * the parts back (the editor moves them one by one), null when nothing was merged.
 */
export function batchModels(container, roots) {
  const groups = new Map();
  container.updateMatrixWorld(true);
  roots.forEach((root) => {
    if (!root.visible) return;
    const refs = referenced(root.userData);
    root.traverse((o) => { if (o !== root && o.userData) referenced(o.userData, refs); });
    root.traverse((o) => {
      if (!plain(o, root, refs)) return;
      const look = lookKey(o.material, refs.materials);
      if (look === null || o.material.transparent || o.material.clippingPlanes?.length) return;
      const key = `${look}#${geoKey(o.geometry)}#${o.renderOrder}#${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}`;
      (groups.get(key) || groups.set(key, { mat: o.material, list: [] }).get(key)).list.push(o);
    });
  });
  const inv = container.matrixWorld.clone().invert(), rel = new THREE.Matrix4(), meshes = [], parts = [];
  groups.forEach(({ mat, list }) => {
    if (list.length < 2) return;
    const geo = mergeGeometries(list.map((o) => placed(o.geometry, rel.multiplyMatrices(inv, o.matrixWorld))), false);
    if (!geo) return;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.renderOrder = list[0].renderOrder;
    m.userData.batch = true;
    container.add(m);
    meshes.push(m);
    list.forEach((o) => { parts.push({ o, parent: o.parent }); o.removeFromParent(); });
  });
  return meshes.length ? { meshes, parts } : null;
}

/** the parts of batchModels back in their models (their own places, sizes and turns never changed), the merged meshes away */
export function unbatch(b) {
  if (!b) return;
  b.meshes.forEach((m) => { m.removeFromParent(); m.geometry.dispose(); });
  b.parts.forEach(({ o, parent }) => parent.add(o));
}
