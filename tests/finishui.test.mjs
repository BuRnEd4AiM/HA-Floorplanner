// Unit tests for finishui.js (the finishes in the properties panel, #448; run like offline.test.mjs, see there): every pattern and heading
// has its name in the texts, the second colour says what it is, sizes are shown in cm or inches
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dir = process.env.STATIC_DIR || '/tmp/static';
const U = await import(`${dir}/finishui.js`);
const F = await import(`${dir}/finishes.js`);
const texts = readFileSync(`${dir}/i18n.js`, 'utf8');

test('every pattern, heading and second colour has a text', () => {
  const missing = [];
  for (const k of F.PATTERN_KEYS) {
    if (!texts.includes(`'${U.patternName(k)}':`)) missing.push(U.patternName(k));
    if (F.PATTERNS[k].c2 && !texts.includes(`'${U.secondLabel(k)}':`)) missing.push(U.secondLabel(k));
  }
  Object.values(F.GROUPS).flat().forEach((g) => { if (!texts.includes(`'fin.g.${g}':`)) missing.push(`fin.g.${g}`); });
  assert.deepEqual(missing, []);
  assert.equal(U.patternName('parquet'), 'cover.parquet', 'the floors keep their old texts');
  assert.equal(U.patternName('woodchip'), 'fin.woodchip');
  assert.equal(U.secondLabel('tiles'), 'fin.c2.grout');
});

test('the size of a tile or plank in cm, or in inches', () => {
  assert.equal(U.sizeShown(0.3, false), 30);
  assert.equal(U.sizeShown(0.3048, true), 12);
  assert.ok(Math.abs(U.sizeStored(30, false) - 0.3) < 1e-12);
  assert.ok(Math.abs(U.sizeStored(12, true) - 0.3048) < 1e-4);
});
