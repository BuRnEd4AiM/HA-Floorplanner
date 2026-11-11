// Unit tests for i18n.js: German and English are always there, the other languages are fetched only when chosen (idea list
// 2026-11-11: 1.4 MB less at every start). Run like offline.test.mjs (STATIC_DIR = a copy of the static folder).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dir = process.env.STATIC_DIR || '/tmp/static';
globalThis.document ??= { documentElement: {} };                   // setLanguage marks the page's language
const I = await import(`${dir}/i18n.js`);
const src = readFileSync(`${dir}/i18n.js`, 'utf8');

test('no other language is imported at the start: only on demand', () => {
  assert.doesNotMatch(src, /^import .*lang\//m);
  for (const l of ['fr', 'es', 'it', 'nl', 'pl', 'zh']) assert.match(src, new RegExp(`import\\('\\./lang/${l}\\.js'\\)`), l);
});

test('German and English need nothing fetched', async () => {
  I.setLanguage('de');
  assert.equal(I.t('src.auto', { v: 21 }), 'Automatisch · 21');
  I.setLanguage('en');
  assert.equal(I.t('src.auto', { v: 21 }), 'Automatic · 21');
  assert.equal(await I.loadLanguage('de'), 'de');
  I.setLanguage('de');
});

test('a language not fetched yet shows English, then itself; setLanguage says so once it is there', async () => {
  const seen = [];
  I.onLanguageLoaded((l) => seen.push(l));
  I.setLanguage('pl');                                               // not fetched yet
  assert.equal(I.currentLanguage(), 'pl');
  assert.equal(document.documentElement.lang, 'pl');
  assert.equal(I.t('tool.measure'), 'Measure');                     // English stands in, never the key
  await I.loadLanguage('pl');
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(seen, ['pl']);
  assert.notEqual(I.t('tool.measure'), 'Measure');
  assert.notEqual(I.t('tool.measure'), 'tool.measure');
  I.setLanguage('pl');                                               // already there: no second call
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(seen, ['pl']);
  I.setLanguage('de');
});

test('loadLanguage fetches every language once and answers its code', async () => {
  for (const l of ['fr', 'es', 'it', 'nl', 'pl', 'zh']) {
    assert.equal(await I.loadLanguage(l), l);
    I.setLanguage(l);
    assert.notEqual(I.t('tool.measure'), 'tool.measure', l);
    assert.equal(I.t('no.such.key'), 'no.such.key');
  }
  I.setLanguage('de');
});

test('unknown codes are German; auto follows the browser, also to a language that is fetched later', async () => {
  assert.equal(I.resolveLanguage('xx'), 'de');
  assert.equal(await I.loadLanguage('xx'), 'de');
  const nav = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { languages: ['nl-BE', 'en'] }, configurable: true });
  try {
    assert.equal(I.resolveLanguage('auto'), 'nl');
    assert.equal(await I.loadLanguage('auto'), 'nl');
    Object.defineProperty(globalThis, 'navigator', { value: { languages: ['sv-SE'] }, configurable: true });
    assert.equal(I.resolveLanguage('auto'), 'en');
  } finally {
    if (nav) Object.defineProperty(globalThis, 'navigator', nav); else delete globalThis.navigator;
  }
});
