// Unit tests for heatpanel.js (run: cp floorplan3d/rootfs/app/static/heatpanel.js /tmp/heatpanel.mjs && HEAT_MJS=/tmp/heatpanel.mjs node --test tests/heatpanel.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const H = await import(process.env.HEAT_MJS || '/tmp/heatpanel.mjs');

/** a very small stand-in for the DOM: enough to build the panel and click its buttons */
function el(tag) {
  const e = { tag, children: [], listeners: {}, hidden: false, className: '', textContent: '', title: '', type: '' };
  e.append = (...c) => { e.children.push(...c); };
  e.replaceChildren = (...c) => { e.children = c; };
  e.addEventListener = (n, f) => { e.listeners[n] = f; };
  return e;
}
globalThis.document = { createElement: el };
const all = (n) => [n, ...n.children.flatMap((c) => (typeof c === 'object' ? all(c) : []))];
const find = (n, f) => all(n).filter(f);

test('clampTarget rounds to the step and stays inside the limits', () => {
  assert.equal(H.clampTarget({ tstep: 0.5 }, 21.3), 21.5);
  assert.equal(H.clampTarget({ tstep: 1 }, 21.4), 21);
  assert.equal(H.clampTarget({}, 2), 7);                          // default lower limit
  assert.equal(H.clampTarget({}, 99), 30);                        // default upper limit
  assert.equal(H.clampTarget({ tmin: 10, tmax: 25, tstep: 0.5 }, 26), 25);
});
test('heatBadge: off when unknown or off, otherwise the action, idle as a fallback', () => {
  assert.equal(H.heatBadge(undefined), 'off');
  assert.equal(H.heatBadge({ state: 'off' }), 'off');
  assert.equal(H.heatBadge({ state: 'heat', hvac: 'heating' }), 'heating');
  assert.equal(H.heatBadge({ state: 'heat' }), 'idle');
});
test('the panel stays hidden without thermostats or without the room panel', () => {
  const box = el('div');
  const p = H.initHeatPanel({ box, t: (k) => k, states: () => ({}), callService() {}, open: () => false });
  p.render([{ entity: 'climate.a' }]);
  assert.equal(box.hidden, true);
  const q = H.initHeatPanel({ box, t: (k) => k, states: () => ({}), callService() {}, open: () => true });
  q.render([]);
  assert.equal(box.hidden, true);
});
test('clicks in a row on + become one set_temperature call after the pause', (ctx) => {
  ctx.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [], box = el('div');
  const states = { 'climate.a': { state: 'heat', tt: 21, ct: 19.5, tstep: 0.5, modes: ['off', 'heat'] } };
  const p = H.initHeatPanel({ box, t: (k) => k, states: () => states, callService: (...a) => calls.push(a), open: () => true });
  p.render([{ entity: 'climate.a', name: 'Wohnzimmer' }]);
  assert.equal(box.hidden, false);
  const plus = () => find(box, (n) => n.textContent === '+')[0];
  plus().listeners.click();
  plus().listeners.click();                                       // the panel is drawn again after the first click, the target already shows 21.5
  assert.equal(find(box, (n) => n.tag === 'b')[0].textContent, '22 °C');
  assert.equal(calls.length, 0);
  assert.equal(p.pending(), 1);
  ctx.mock.timers.tick(H.HEAT_DELAY);
  assert.deepEqual(calls, [['climate.a', 'set_temperature', { temperature: 22 }]]);
  assert.equal(p.pending(), 0);
});
test('the other entities of a thermostat\'s device go with the heating, those of a thermostat in another room stay (#370)', () => {
  const rows = [{ entity: 'climate.kueche' }, { entity: 'switch.kueche_child_lock' }, { entity: 'switch.licht' }, { entity: 'switch.bad_child_lock' }];
  const partOf = { 'switch.kueche_child_lock': 'climate.kueche', 'switch.bad_child_lock': 'climate.bad' };
  const { parts, rest } = H.splitHeatParts(rows, ['climate.kueche'], partOf);
  assert.deepEqual(parts, { 'climate.kueche': [{ entity: 'switch.kueche_child_lock' }] });
  assert.deepEqual(rest.map((d) => d.entity), ['climate.kueche', 'switch.licht', 'switch.bad_child_lock']);
  assert.deepEqual(H.splitHeatParts(rows, [], undefined).rest.length, 4);
});
test('a part\'s name without the thermostat\'s name in front', () => {
  assert.equal(H.partName('Heizung Küche Child lock', 'Heizung Küche'), 'Child lock');
  assert.equal(H.partName('heizung küche Child lock', 'Heizung Küche'), 'Child lock');
  assert.equal(H.partName('Kindersicherung', 'Heizung Küche'), 'Kindersicherung');
  assert.equal(H.partName('Heizung Küche', 'Heizung Küche'), 'Heizung Küche');
});
test('the parts show under their thermostat: a slide switch for the child lock, the value of a sensor', () => {
  const calls = [], box = el('div');
  const states = { 'climate.k': { state: 'heat', tt: 21, name: 'Heizung Küche' }, 'switch.k_lock': { state: 'off', name: 'Heizung Küche Child lock' }, 'sensor.k_valve': { state: '40' } };
  const p = H.initHeatPanel({ box, t: (k) => k, states: () => states, callService: (...a) => calls.push(a), open: () => true, stateText: (e) => `${states[e].state} %` });
  p.render([{ entity: 'climate.k' }], { 'climate.k': [{ entity: 'switch.k_lock' }, { entity: 'sensor.k_valve', name: 'Ventil' }] });
  const rows = find(box, (n) => n.className === 'hp-part');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].children[0].textContent, 'Child lock');
  const cb = find(rows[0], (n) => n.tag === 'input')[0];
  assert.equal(cb.checked, false);
  cb.checked = true; cb.listeners.change();
  assert.deepEqual(calls, [['switch.k_lock', 'turn_on']]);
  assert.equal(rows[1].children[1].textContent, '40 %');
});
test('a mode button calls set_hvac_mode at once', () => {
  const calls = [], box = el('div');
  const states = { 'climate.a': { state: 'heat', tt: 21, modes: ['off', 'heat'] } };
  const p = H.initHeatPanel({ box, t: (k) => k, states: () => states, callService: (...a) => calls.push(a), open: () => true });
  p.render([{ entity: 'climate.a' }]);
  find(box, (n) => n.textContent === 'off')[0].listeners.click();
  assert.deepEqual(calls, [['climate.a', 'set_hvac_mode', { hvac_mode: 'off' }]]);
});
