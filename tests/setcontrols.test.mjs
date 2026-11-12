// Unit tests for setcontrols.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/setcontrols.js`);

test('a choice with a note in brackets: the name and the note', () => {
  assert.deepEqual(C.splitLabel('Anthrazit (hellere Wände)'), { main: 'Anthrazit', note: 'hellere Wände' });
  assert.deepEqual(C.splitLabel('Metrisch (m)'), { main: 'Metrisch', note: 'm' });
  assert.deepEqual(C.splitLabel('墙体（较亮）'), { main: '墙体', note: '较亮' });
  assert.deepEqual(C.splitLabel('Hell'), { main: 'Hell', note: '' });
});
test('a long choice with a comma is split there, a short one is not', () => {
  assert.deepEqual(C.splitLabel('Voll, an der Kameraseite aufgeschnitten'), { main: 'Voll', note: 'an der Kameraseite aufgeschnitten' });
  assert.deepEqual(C.splitLabel('A, B'), { main: 'A, B', note: '' });
});
test('two to five short choices become buttons, with their value', () => {
  const it = C.segItems([{ value: 'holo', text: 'Hologramm' }, { value: 'dark', text: 'Dunkel' }, { value: 'light', text: 'Hell' }]);
  assert.deepEqual(it.map((i) => [i.value, i.main, i.note]), [['holo', 'Hologramm', ''], ['dark', 'Dunkel', ''], ['light', 'Hell', '']]);
  assert.equal(C.segItems([{ value: 0.05, text: '5 cm' }, { value: 0.1, text: '10 cm' }])[0].value, '0.05');
});
test('one choice, six choices or a very long one stay a drop-down', () => {
  assert.equal(C.segItems([{ value: 'a', text: 'A' }]), null);
  assert.equal(C.segItems(Array.from({ length: 6 }, (_, i) => ({ value: String(i), text: `N${i}` }))), null);
  assert.equal(C.segItems([{ value: 'a', text: 'A' }, { value: 'b', text: 'x'.repeat(40) }]), null);
  assert.equal(C.segItems(null), null);
});
test('a hidden choice is left out, a disabled one stays (marked)', () => {
  const it = C.segItems([{ value: 'a', text: 'A' }, { value: 'b', text: 'B', hidden: true }, { value: 'c', text: 'C', disabled: true }]);
  assert.deepEqual(it.map((i) => [i.value, i.disabled]), [['a', false], ['c', true]]);
});
test('the value of a slider in percent, the unit of a length', () => {
  assert.equal(C.pctText(0.72), '72 %');
  assert.equal(C.pctText('0.05'), '5 %');
  assert.equal(C.pctText(''), '0 %');
  assert.equal(C.lenUnit('imperial'), 'ft');
  assert.equal(C.lenUnit('metric'), 'm');
  assert.equal(C.lenUnit(undefined), 'm');
});
test('the drop-downs that become buttons are known, the design has colour samples', () => {
  assert.ok(C.SEG_IDS.includes('setTheme') && C.SEG_IDS.includes('setNightDim'));
  assert.deepEqual(Object.keys(C.SWATCH.setTheme), ['holo', 'dark', 'light']);
});
