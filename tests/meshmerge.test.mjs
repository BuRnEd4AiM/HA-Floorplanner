// Unit tests for meshmerge.js: the parts of a device model that look the same become one mesh (fewer draw calls, #394), and the model looks
// exactly the same (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const M = await import(`${dir}/meshmerge.js`);
const THREE = await import(`${dir}/vendor/three.module.min.js`);

const std = (c = '#888888', extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.05, ...extra });
const box = (mat, x = 0, y = 0, z = 0, s = 0.2) => { const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat); m.position.set(x, y, z); return m; };
const meshes = (g) => { const out = []; g.traverse((o) => { if (o.isMesh) out.push(o); }); return out; };
const bounds = (g) => { g.updateMatrixWorld(true); return new THREE.Box3().setFromObject(g); };
const near = (a, b, eps = 1e-5) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const sameBox = (a, b) => ['min', 'max'].forEach((k) => ['x', 'y', 'z'].forEach((c) => near(a[k][c], b[k][c])));
/** the corners of all triangles of the model, in its frame, sorted: the shape itself, whatever the meshes */
function triangles(g) {
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert(), out = [], v = new THREE.Vector3();
  meshes(g).forEach((m) => {
    const pos = m.geometry.attributes.position, ix = m.geometry.index, mx = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const n = ix ? ix.count : pos.count;
    for (let i = 0; i < n; i++) { v.fromBufferAttribute(pos, ix ? ix.getX(i) : i).applyMatrix4(mx); out.push(v.toArray().map((x) => x.toFixed(4)).join(',')); }
  });
  return out.sort();
}

test('parts with the same material become one mesh, in the same place (a turned and moved group inside the model too)', () => {
  const g = new THREE.Group(), mat = std(), inner = new THREE.Group();
  inner.position.set(0.5, 0.3, -0.2); inner.rotation.set(0.3, 1.1, -0.4); inner.scale.set(1, 2, 1);
  g.add(box(mat, 0, 0, 0), box(mat, 0.4, 0, 0));
  inner.add(box(mat, 0, 0.2, 0), new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), mat));
  g.add(inner);
  const before = triangles(g), bb = bounds(g);
  assert.equal(M.mergeParts(g), 3);                              // the 3 boxes and the cylinder (same attributes) in one mesh
  assert.equal(meshes(g).length, 1);
  assert.deepEqual(triangles(g), before);                        // every triangle where it was
  sameBox(bounds(g), bb);
  assert.ok(!g.children.includes(inner), 'the emptied group is gone');
});

test('materials that look the same share one mesh; other colours, a texture or a lamp\'s own colour keep their own', () => {
  const g = new THREE.Group();
  g.add(box(std('#ff0000'), 0), box(std('#ff0000'), 1), box(std('#00ff00'), 2), box(std('#00ff00'), 3));
  const own = std('#0000ff'); own.userData.on = '#ffaa00';        // lit in its own colour: stays itself
  g.add(box(own, 4), box(std('#0000ff'), 5));
  assert.equal(M.mergeParts(g), 2);
  const mats = meshes(g).map((m) => m.material);
  assert.equal(meshes(g).length, 4);
  assert.ok(mats.includes(own));
  assert.equal(M.lookKey(own), null);
  assert.equal(M.lookKey(std('#123456')), M.lookKey(std('#123456')));
  assert.notEqual(M.lookKey(std('#123456')), M.lookKey(std('#123457')));
  assert.notEqual(M.lookKey(std('#123456')), M.lookKey(std('#123456', { transparent: true, opacity: 0.5 })));
});

test('a glowing material (it changes with the state) keeps its own mesh and its own material, its parts still join', () => {
  const g = new THREE.Group(), glow = std('#ffffff', { emissive: 0xffd27a }), twin = std('#ffffff', { emissive: 0xffd27a });
  g.add(box(glow, 0), box(glow, 1), box(twin, 2), box(twin, 3));
  g.userData.glow = [glow];
  M.mergeParts(g);
  const ms = meshes(g);
  assert.equal(ms.length, 2);
  const lit = ms.filter((m) => m.material === glow);
  assert.equal(lit.length, 1);                                   // both glowing parts in one mesh, with the very material the state changes
  assert.equal(lit[0].geometry.attributes.position.count, 48);
  assert.ok(ms.some((m) => m.material === twin));                 // the look-alike stays apart: it must not start to glow
});

test('parts something refers to stay as they are: with userData, named in the model, hidden, with children, in a referenced group', () => {
  const g = new THREE.Group(), mat = std();
  const led = box(mat, 0); led.userData.ledPart = true; led.visible = false;
  const named = box(mat, 1), hidden = box(mat, 2), parent = box(mat, 3), sub = new THREE.Group(), inSub = box(mat, 0, 1);
  hidden.visible = false;
  parent.add(box(mat, 0, 0.5));
  sub.add(inSub, box(mat, 0.5, 1));
  g.add(led, named, hidden, parent, sub, box(mat, 4), box(mat, 5));
  g.userData.ledParts = [led]; g.userData.screen = named; g.userData.arm = sub;
  M.mergeParts(g);
  [led, named, hidden, parent, inSub].forEach((o) => assert.ok(meshes(g).includes(o)));
  assert.ok(sub.parent === g && sub.children.length === 2);
  assert.equal(meshes(g).length, 7);                             // the last two boxes and the plain box hanging on `parent` became one
});

test('a mirrored part keeps its outside out (the triangles are turned round)', () => {
  const g = new THREE.Group(), mat = std(), a = box(mat, 0), b = box(mat, 1);
  b.scale.set(-1, 1, 1);
  g.add(a, b);
  M.mergeParts(g);
  const [m] = meshes(g), pos = m.geometry.attributes.position, nrm = m.geometry.attributes.normal, ix = m.geometry.index.array;
  const p = [0, 1, 2].map(() => new THREE.Vector3()), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < ix.length; i += 3) {
    [0, 1, 2].forEach((k) => p[k].fromBufferAttribute(pos, ix[i + k]));
    e1.subVectors(p[1], p[0]); e2.subVectors(p[2], p[0]);
    const face = new THREE.Vector3().crossVectors(e1, e2);
    n.fromBufferAttribute(nrm, ix[i]);
    assert.ok(face.dot(n) > 0, `triangle ${i / 3} faces inwards`);
  }
});

test('only geometries with the same attributes join; a model of one mesh stays as it is', () => {
  const plain = new THREE.BufferGeometry(); plain.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
  assert.notEqual(M.geoKey(plain), M.geoKey(new THREE.BoxGeometry(1, 1, 1)));
  assert.equal(M.geoKey(new THREE.SphereGeometry(1)), M.geoKey(new THREE.BoxGeometry(1, 1, 1)));
  const g = new THREE.Group(), mat = std();
  g.add(box(mat, 0), new THREE.Mesh(plain, mat));
  assert.equal(M.mergeParts(g), 0);
  const one = new THREE.Group(); one.add(box(mat));
  assert.equal(M.mergeParts(one), 0);
});
