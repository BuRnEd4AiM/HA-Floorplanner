// Unit tests for shortcuts.js (the card with every key of the editor, #471; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/shortcuts.js`);
const E = await import(`${dir}/edititems.js`);

const MOD = new Set(['ctrl', 'shift', 'alt']);
/** what keyCommand makes of a combination on the card, with something selected (or not, for the floor keys) */
function command(combo, selected = true) {
  const mods = { ctrl: combo.includes('ctrl'), shift: combo.includes('shift'), alt: combo.includes('alt') };
  const k = combo.filter((x) => !MOD.has(x))[0];
  const key = { del: 'delete', back: 'backspace', enter: 'enter', esc: 'escape', arrows: 'arrowleft', up: 'arrowup', down: 'arrowdown' }[k] || k.toLowerCase();
  return E.keyCommand(key, mods, { live: false, selKind: selected ? 'device' : null, grid: 0.25, floorIdx: 1, floors: 3 });
}

test('every key on the card does something (keyCommand), Enter and Esc are handled before it', () => {
  S.shortcutRows().forEach((g) => g.rows.forEach((r) => r.keys.forEach((combo) => {
    if (combo[0] === 'enter' || combo[0] === 'esc') return;                         // the key handler takes these itself (finishDraft / escape)
    const floorKey = r.what === 'kc.floor';
    assert.ok(command(combo, !floorKey), `${combo.join('+')} (${r.what})`);
  })));
  assert.deepEqual(command(['?']), { do: 'help' });
  assert.equal(command(['ctrl', '?']), null);
});

test('every tool key is on the card, with the tool\'s name', () => {
  const tools = S.shortcutRows().find((g) => g.group === 'kc.g.tools').rows;
  assert.deepEqual(tools.map((r) => r.keys[0][0]), Object.keys(E.TOOL_KEYS).map((k) => k.toUpperCase()));
  assert.deepEqual(tools.map((r) => r.what), Object.values(E.TOOL_KEYS).map((v) => `tool.${v}`));
});

test('every text of the card exists in German and English', () => {
  const src = fs.readFileSync(`${dir}/i18n.js`, 'utf8');
  const keys = new Set(S.shortcutRows().flatMap((g) => [g.group, ...g.rows.map((r) => r.what)]).concat(['kc.ctrl', 'kc.shift', 'kc.del', 'kc.or', 'kc.title', 'kc.hint', 'kc.btn']));
  keys.forEach((k) => assert.equal(src.split(`'${k}':`).length - 1, 2, k));
});

test('key names: Ctrl / Strg, ⌘ on a Mac, arrows, letters as they are', () => {
  const t = (k) => ({ 'kc.ctrl': 'Strg', 'kc.shift': 'Umschalt', 'kc.del': 'Entf' }[k] || k);
  assert.equal(S.keyName('ctrl', t), 'Strg');
  assert.equal(S.keyName('ctrl', t, true), '⌘');
  assert.equal(S.keyName('alt', t, true), '⌥');
  assert.equal(S.keyName('arrows', t), '← ↑ → ↓');
  assert.equal(S.keyName('Z', t), 'Z');
  assert.equal(S.keyName('?', t), '?');
});
