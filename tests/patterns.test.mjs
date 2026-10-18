// Unit tests for patterns.js (drawing the patterns of floors and walls, #448; run like offline.test.mjs, see there). A recording 2D context
// stands in for the canvas: every pattern draws without an error, fills the whole picture and draws the very same shapes for its relief.
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const P = await import(`${dir}/patterns.js`);
const F = await import(`${dir}/finishes.js`);

/** a 2D context that writes down what is drawn (the method names, the rectangles and the pixels put) */
function fakeContext() {
  const log = [], g = {
    log, pixelsPut: 0, filledAll: false,
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData(img) { this.pixelsPut += img.width * img.height; for (let i = 0; i < img.data.length; i++) if (Number.isNaN(img.data[i])) throw new Error('NaN'); },
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }),
    fillRect(x, y, w, h) { log.push('fillRect'); if (x <= 0 && y <= 0 && w >= this.S && h >= this.S) this.filledAll = true; },
  };
  for (const m of ['save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc', 'ellipse', 'rect', 'clip', 'fill', 'stroke', 'strokeRect', 'translate', 'rotate', 'scale', 'setTransform']) {
    g[m] = (...a) => { if (a.some((v) => typeof v === 'number' && !Number.isFinite(v))) throw new Error(`${m}(${a})`); log.push(m); };
  }
  return g;
}

test('every pattern draws the whole picture without an error', () => {
  const bad = F.PATTERN_KEYS.filter((key) => {
    const g = fakeContext(); g.S = 64;
    P.drawPattern(g, 64, F.resolve({ pattern: key }));
    return !(g.filledAll || g.pixelsPut === 64 * 64);
  });
  assert.deepEqual(bad, [], 'these leave parts of the picture empty');
});

test('the relief covers the picture too, and puts the joints where the colour picture has them (the same numbers in the same order)', () => {
  const bad = F.PATTERN_KEYS.filter((key) => {
    const g = fakeContext(); g.S = 32;
    P.drawPattern(g, 32, F.resolve({ pattern: key }), true);
    return !(g.filledAll || g.pixelsPut === 32 * 32);
  });
  assert.deepEqual(bad, [], 'reliefs that leave parts empty');
  for (const key of ['parquet', 'plankWide', 'tilesLarge', 'basket', 'deck']) {   // drawn with boxes only: the very same boxes in both
    const a = fakeContext(), b = fakeContext(); a.S = b.S = 64;
    const boxes = (g) => { const out = []; g.fillRect = (x, y, w, h) => out.push([x, y, w, h].map((v) => v.toFixed(2)).join()); return out; };
    const ra = boxes(a), rb = boxes(b), fin = F.resolve({ pattern: key });
    P.drawPattern(a, 64, fin, false); P.drawPattern(b, 64, fin, true);
    assert.deepEqual(rb, ra, key);
  }
});

test('helpers: the same random numbers for the same seed, shades stay colours', () => {
  const r1 = P.seeded(5), r2 = P.seeded(5), v = [r1(), r1(), r1()];
  assert.deepEqual(v, [r2(), r2(), r2()]);
  assert.ok(v.every((x) => x >= 0 && x < 1));
  assert.equal(P.shade('#808080', 2), 'rgb(255,255,255)');
  assert.equal(P.shade('#808080', 0), 'rgb(0,0,0)');
});
