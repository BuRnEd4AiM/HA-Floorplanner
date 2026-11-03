// Unit tests for sash.js: the sash of a window pane that opens, four bars round its glass and a handle on the room side across from the
// hinge (4.64.0, #624: a tilted window should show more) (run like offline.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/sash.js`);
const near = (a, b) => Math.abs(a - b) < 1e-9;
const box = (p) => ({ x0: p.x - p.w / 2, x1: p.x + p.w / 2, y0: p.y - p.h / 2, y1: p.y + p.h / 2, z0: p.z - p.d / 2, z1: p.z + p.d / 2 });

test('four bars lie on the edge of the glass, inside it, and the handle after them', () => {
  const parts = S.sashParts({ x0: 0, x1: 1, y0: 0, y1: 1.3, hingeAt: 'x0', room: 1 });
  assert.equal(parts.length, 6);
  const bars = parts.slice(0, 4).map(box);
  bars.forEach((b) => assert.ok(b.x0 >= -1e-9 && b.x1 <= 1 + 1e-9 && b.y0 >= -1e-9 && b.y1 <= 1.3 + 1e-9, 'inside the glass'));
  assert.ok(near(bars[0].y1, 1.3) && near(bars[1].y0, 0) && near(bars[2].x0, 0) && near(bars[3].x1, 1), 'on its edges');
  assert.ok(near(bars[0].x1 - bars[0].x0, 1) && near(bars[2].y1 - bars[2].y0, 1.3 - 2 * S.SASH_BAR), 'the side bars between top and bottom');
  bars.forEach((b) => assert.ok(near(b.z0, -S.SASH_DEPTH / 2) && near(b.z1, S.SASH_DEPTH / 2)));
});

test('the handle sits across from the hinge, in the middle of that bar, on the room side', () => {
  const handle = (o) => S.sashParts(o).slice(4).map(box);
  const [l0] = handle({ x0: 0, x1: 1, y0: 0, y1: 1.2, hingeAt: 'x0', room: 1 });
  assert.ok(l0.x1 > 0.9 && near((l0.y0 + l0.y1) / 2, 0.6) && l0.z0 > S.SASH_DEPTH / 2 - 1e-9, 'hinge left: handle right, room +z');
  const [r0] = handle({ x0: -1, x1: 0, y0: 0, y1: 1.2, hingeAt: 'x1', room: -1 });
  assert.ok(r0.x0 < -0.9 && r0.z1 < -S.SASH_DEPTH / 2 + 1e-9, 'hinge right: handle left, room −z');
  const [b0, lever] = handle({ x0: 0, x1: 1, y0: 0, y1: 1.2, hingeAt: 'y0', room: 1 });
  assert.ok(b0.y1 > 1.1 && near((b0.x0 + b0.x1) / 2, 0.5), 'a tilt window (hinge at the bottom): handle at the top in the middle');
  assert.ok(lever.x1 - lever.x0 > lever.y1 - lever.y0, '… its lever lies along the top bar');
  const [t0] = handle({ x0: 0, x1: 0.8, y0: -1.2, y1: 0, hingeAt: 'y1', room: 1 });
  assert.ok(t0.y0 < -1.1, 'a roof window (hinge at the top): handle at the bottom');
});

test('a narrow pane gets narrower bars, also a tiny one has its sash; only a pane without a size has none', () => {
  const thin = S.sashParts({ x0: 0, x1: 0.3, y0: 0, y1: 1, hingeAt: 'x0' });
  assert.ok(near(thin[2].w, 0.3 * 0.15), 'at most 15 % of the pane');
  const tiny = S.sashParts({ x0: 0, x1: 0.08, y0: 0, y1: 0.5, hingeAt: 'x0' });
  assert.equal(tiny.length, 6, 'a pane of 8 cm still has its sash and handle');
  tiny.map(box).forEach((b) => assert.ok(b.x0 >= -1e-9 && b.x1 <= 0.08 + 1e-9, 'inside the pane'));
  assert.deepEqual(S.sashParts({ x0: 0, x1: 1, y0: 0, y1: NaN }), []);
  assert.deepEqual(S.sashParts({ x0: 0, x1: 0, y0: 0, y1: 1 }), []);
});

// every window the add-on can build (walls.js, as the floors, dormers, roof windows and the neighbour house build them): each pane that
// opens has its sash, a fixed pane and fixed glazing none, the handle on the room side (the owner: "für alle Fenster, nicht dass welche
// vergessen wird")
const W = await import(`${dir}/walls.js`);
const THREE = await import(`${dir}/vendor/three.module.min.js`);
const P = await import(`${dir}/windowpanes.js`);
const mat = (c) => new THREE.MeshStandardMaterial({ color: c });
function build(o, side = 1, extra = {}) {
  const g = W.buildWall({ id: 'w', a: [0, 0], b: [6, 0], thickness: 0.24, height: 2.6, openings: [{ id: 'o', pos: 3, ...o }] },
    { material: mat('#cccccc'), makeMat: (c) => mat(c), shutterSide: () => side, ...extra });
  return g.children.find((c) => c.userData?.kind === 'opening');
}
const sashesOf = (obj) => { const out = []; obj.traverse((m) => { if (m.userData?.sash) out.push(m); }); return out; };
function expectSashes(o, side, extra) {
  const obj = build(o, side, extra), label = JSON.stringify({ ...o, side, ...extra && { bare: !!extra.bare } });
  const all = sashesOf(obj);
  if (o.style === 'fixed') { assert.equal(all.length, 0, `fixed glazing has no sash: ${label}`); return 0; }
  const n = P.windowPanes(o);
  assert.equal(obj.userData.panePivots.length, n, label);
  obj.userData.panePivots.forEach((pv, i) => {
    const own = pv.children.filter((c) => c.userData?.sash);
    assert.equal(own.length, P.paneHinge(o, i) === 'fixed' ? 0 : 1, `pane ${i + 1}: ${label}`);
    own.forEach((m) => {
      m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox;
      assert.equal(Math.sign(bb.max.z + bb.min.z), -side, `the handle on the room side: pane ${i + 1}: ${label}`);
    });
  });
  return all.length;
}

test('every window preset: each pane that opens has a sash, fixed glazing none', () => {
  let n = 0;
  for (const [k, o] of Object.entries(W.OPENING_DEFAULTS)) {
    if (o.type !== 'window') { assert.equal(sashesOf(build(o)).length, 0, `a door has none: ${k}`); continue; }
    for (const side of [1, -1]) n += expectSashes(o, side);
  }
  assert.ok(n >= 12, n);
});

test('every style, every hinge, every number of panes, opening in or out, both sides of the wall, also a dormer / roof window', () => {
  let n = 0;
  for (const style of W.WINDOW_STYLES) for (const hinge of P.WINDOW_HINGES) for (const openOutward of [false, true]) for (const side of [1, -1]) {
    const o = { type: 'window', style, hinge, width: 1.2, height: 1.3, sill: 0.9, ...(openOutward ? { openOutward } : {}) };
    n += expectSashes(o, side);
    n += expectSashes(o, side, { bare: true });                           // the window of a dormer or a roof window (floorbuild.js)
  }
  for (let panes = 1; panes <= P.MAX_PANES; panes++) for (const width of [0.4, 1.2, 3]) {
    const o = { type: 'window', style: 'double', panes, width, height: 1.2, sill: 0.9 };
    n += expectSashes(o, 1);
    n += expectSashes({ ...o, paneHinges: Array.from({ length: panes }, (_, i) => P.PANE_HINGES[i % P.PANE_HINGES.length]) }, -1);
  }
  assert.ok(n > 300, n);
});
