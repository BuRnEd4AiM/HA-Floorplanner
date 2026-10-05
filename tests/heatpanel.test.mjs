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
test('a mode button calls set_hvac_mode at once', () => {
  const calls = [], box = el('div');
  const states = { 'climate.a': { state: 'heat', tt: 21, modes: ['off', 'heat'] } };
  const p = H.initHeatPanel({ box, t: (k) => k, states: () => states, callService: (...a) => calls.push(a), open: () => true });
  p.render([{ entity: 'climate.a' }]);
  find(box, (n) => n.textContent === 'off')[0].listeners.click();
  assert.deepEqual(calls, [['climate.a', 'set_hvac_mode', { hvac_mode: 'off' }]]);
});
