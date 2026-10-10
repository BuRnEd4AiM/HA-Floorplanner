// Pure geometry tests for ledring.js (run: cp floorplan3d/rootfs/app/static/ledring.js /tmp/ledring.mjs && LEDRING_MJS=/tmp/ledring.mjs node --test tests/ledring.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(process.env.LEDRING_MJS || '/tmp/ledring.mjs');
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const ROOM = [[0, 0], [4, 0], [4, 3], [0, 3]];

for (const [name, poly] of [['clockwise', ROOM], ['counter-clockwise', [...ROOM].reverse()]]) {
  test(`inset moves every edge inwards (${name})`, () => {
    const p = R.insetPoly(poly, 0.2);
    assert.equal(p.length, 4);
    const xs = p.map((q) => q[0]).sort((a, b) => a - b), zs = p.map((q) => q[1]).sort((a, b) => a - b);
    near(xs[0], 0.2); near(xs[3], 3.8); near(zs[0], 0.2); near(zs[3], 2.8);
  });
}

test('L-shaped room: inset keeps all six corners inside', () => {
  const L = [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]];
  const p = R.insetPoly(L, 0.1);
  assert.equal(p.length, 6);
  assert.deepEqual(p.map((q) => q.map((v) => +v.toFixed(3))), [[0.1, 0.1], [3.9, 0.1], [3.9, 1.9], [1.9, 1.9], [1.9, 3.9], [0.1, 3.9]]);
});

test('straight corners (collinear points) merge into one section', () => {
  const p = R.insetPoly([[0, 0], [2, 0], [4, 0], [4, 3], [0, 3]], 0.1);
  assert.equal(p.length, 4);
});

test('ring from a room: one empty section per wall, points relative to its centre', () => {
  const r = R.ringFromRoom(ROOM, 0.15);
  near(r.x, 2); near(r.z, 1.5);
  assert.equal(r.pts.length, 4); assert.equal(r.segs.length, 4); assert.equal(r.closed, true);
  const secs = R.ringSectionsWorld({ ...r, rot: 0 });
  assert.equal(secs.length, 4);
  near(secs.reduce((s, x) => s + x.len, 0), 2 * (3.7 + 2.7));
  near(R.pathLength(r), 2 * (3.7 + 2.7));
});

test('open ring has one wall less, segs follow the count', () => {
  const d = { x: 0, z: 0, pts: [[0, 0], [1, 0], [1, 1]], closed: false, segs: [{ entity: 'light.a' }, {}, {}, {}] };
  assert.equal(R.ringCount(d), 2);
  R.fitSegs(d);
  assert.equal(d.segs.length, 2);
  d.closed = true; R.fitSegs(d);
  assert.equal(d.segs.length, 3);
});

test('sections without own light use the main entity; ringEntities has no duplicates', () => {
  const d = { x: 0, z: 0, pts: ROOM, entity: 'light.main', segs: [{ entity: 'light.a' }, {}, { entity: 'light.a' }, {}] };
  assert.equal(R.segEntity(d, 0), 'light.a');
  assert.equal(R.segEntity(d, 1), 'light.main');
  assert.deepEqual(R.ringEntities(d), ['light.a', 'light.main']);
});

test('world points follow position and rotation like the 3D model', () => {
  const d = { x: 10, z: 5, rot: 90, pts: [[1, 0], [2, 0]], closed: false };
  const [e] = R.pathWorld(d);
  near(e.a[0], 10); near(e.a[1], 4);                      // three.js: turning +90 deg about y maps +x to -z
  near(e.b[0], 10); near(e.b[1], 3);
  near(R.projectOnPath(d, 10, 3.5), 0.5);                 // and back: half way along the band
});

// ---- free sections: several per wall, any start / end
const ring = () => ({ x: 0, z: 0, rot: 0, pts: [[0, 0], [4, 0], [4, 3], [0, 3]], closed: true, segs: [{ entity: 'light.a' }, { entity: 'light.b' }, {}, {}] });

test('spread evenly: n equal sections over the whole band, lights kept by number', () => {
  const d = ring();
  R.splitEven(d, 7);
  assert.equal(R.ringCount(d), 7);
  R.ringSections(d).forEach((sc) => near(sc.to - sc.from, 2, 1e-3));
  assert.equal(d.segs[0].entity, 'light.a'); assert.equal(d.segs[1].entity, 'light.b'); assert.equal(d.segs[2].entity, undefined);
  R.perWall(d);
  assert.equal(R.ringCount(d), 4); assert.equal(R.hasRanges(d), false); assert.equal(d.segs[1].entity, 'light.b');
});

test('a section around a corner is drawn as two pieces', () => {
  const d = ring();
  R.splitEven(d, 1);
  R.setRange(d, 0, 3, 5);                                  // 1 m before the first corner to 1 m after it
  const [sc] = R.ringSectionsWorld(d);
  assert.equal(sc.pieces.length, 2);
  assert.deepEqual(sc.pieces.map(([a, b]) => [...a, ...b].map((v) => +v.toFixed(3))), [[3, 0, 4, 0], [4, 0, 4, 1]]);
  near(sc.len, 2);
});

test('split, remove and ranges stay inside the band and at least 5 cm long', () => {
  const d = ring();
  R.splitSection(d, 0);                                    // first wall (0..4 m) -> 0..2 and 2..4
  assert.equal(R.ringCount(d), 5);
  assert.deepEqual([d.segs[0].from, d.segs[0].to, d.segs[1].from, d.segs[1].to], [0, 2, 2, 4]);
  assert.equal(d.segs[0].entity, 'light.a'); assert.equal(d.segs[1].entity, undefined);
  R.setRange(d, 0, 1.5, 99);                               // end past the band is clamped
  near(d.segs[0].to, 14); near(d.segs[0].from, 1.5);
  R.setRange(d, 0, 20, null);                              // start cannot pass the end
  near(d.segs[0].from, 14 - R.RING_MIN_SECTION);
  R.removeSection(d, 1);
  assert.equal(R.ringCount(d), 4);
});

test('gaps: only the sections carry LEDs, the room shape change trims them', () => {
  const d = ring();
  d.segs = [{ from: 0.5, to: 1.5 }, { from: 6, to: 8 }, { from: 13.5, to: 14 }];
  assert.equal(R.ringCount(d), 3);
  d.pts = [[0, 0], [2, 0], [2, 2], [0, 2]];                // smaller room: band is 8 m now
  R.fitSegs(d);
  assert.equal(R.ringCount(d), 2);
  near(d.segs[1].to, 8);
});

test('every section has its own soft marker colour, neighbours differ, the list repeats (#325)', () => {
  const n = R.SECTION_COLORS.length;
  for (let i = 0; i < 2 * n; i++) {
    assert.match(R.sectionHex(i), /^#[0-9a-f]{6}$/);
    assert.notEqual(R.sectionHex(i), R.sectionHex(i + 1));
  }
  assert.equal(R.sectionHex(n), R.sectionHex(0));
  assert.equal(new Set(R.SECTION_COLORS).size, n);
  assert.equal(R.sectionHex(0), '#ff8a80');
  assert.equal(R.sectionHex(-1), R.SECTION_COLORS[n - 1]);              // junk index: still a colour
  assert.equal(R.sectionHex('x'), R.SECTION_COLORS[0]);
});
