/* buttonlook.js (#495): the look of a button card and what it shows now */
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/buttonlook.js`);
const K = await import(`${process.env.STATIC_DIR || '/tmp/static'}/cards.js`);

test('the look made safe: the usual ones where something is missing or wrong', () => {
  assert.deepEqual(L.cleanLook({}), { icon: '', onColor: 'amber', shape: 'tile', bsize: 'm', show: ['name', 'state'], tap: 'toggle', hold: 'more', page: '' });
  assert.deepEqual(L.cleanLook({ icon: '🛋', onColor: 'lamp', shape: 'round', bsize: 'xl', show: ['since', 'bar', 'x'], tap: 'page', page: 'climate', hold: 'details' }),
    { icon: '🛋', onColor: 'lamp', shape: 'round', bsize: 'xl', show: ['bar', 'since'], tap: 'page', hold: 'details', page: 'climate' });
  assert.equal(L.cleanLook({ icon: '🦄', onColor: 'pink', shape: 'star', bsize: 'xxl' }).icon, '');
  assert.equal(L.cleanLook({ tap: 'page', page: 'nirgends' }).tap, 'toggle');          // a page that is none: a tap switches
  assert.equal(L.cleanLook({ tap: 'page', page: 'p_garten' }).page, 'p_garten');       // an own page
  assert.deepEqual(L.cleanLook({ shape: 'icon', show: ['name'] }).show, []);           // only the symbol
  assert.equal(L.cleanLook({ tap: 'more', page: 'climate' }).page, '');
  const c = K.cleanCard({ id: 'c_knopf', type: 'button', entity: 'light.a', shape: 'pill', show: ['name'] });
  assert.equal(c.shape, 'pill'); assert.deepEqual(c.show, ['name']); assert.equal(c.onColor, 'amber');
  assert.ok(K.fitsType('button', 'climate.wohnzimmer') && K.fitsType('button', 'lock.tuer') && !K.fitsType('button', 'sensor.x'));
});

test('what a button shows now: on, its colour or the lamp\'s, the bar, since when', () => {
  const look = L.cleanLook({ onColor: 'lamp', show: ['name', 'bar', 'since'] });
  const f = L.buttonFace(look, { state: 'on', rgb: [255, 0, 0], brightness: 49.6, lc: 1792692000 });
  assert.deepEqual(f, { on: true, color: 'rgb(255, 0, 0)', bar: 50, since: new Date(1792692000 * 1000) });
  assert.equal(L.buttonFace(look, { state: 'on' }).color, L.BTN_HEX.amber);           // a lamp without a colour: amber
  assert.deepEqual(L.buttonFace(look, { state: 'off', brightness: 80 }), { on: false, color: null, bar: null, since: null });
  assert.equal(L.buttonFace(L.cleanLook({ onColor: 'blue' }), { state: 'playing' }).color, L.BTN_HEX.blue);
  assert.equal(L.buttonFace(L.cleanLook({}), { state: 'on', brightness: 80 }).bar, null);   // no bar unless it shows one
  assert.equal(L.isOnState({ state: 'unlocked' }), true); assert.equal(L.isOnState({ state: 'locked' }), false); assert.equal(L.isOnState(undefined), false);
});

test('since when in words', () => {
  const now = new Date(2026, 9, 22, 18, 0);
  assert.deepEqual(L.agoOf(new Date(+now - 30000), now), { key: 'now', n: 0 });
  assert.deepEqual(L.agoOf(new Date(+now - 5 * 60000), now), { key: 'min', n: 5 });
  assert.deepEqual(L.agoOf(new Date(+now - 125 * 60000), now), { key: 'h', n: 2 });
  assert.deepEqual(L.agoOf(new Date(+now - 3 * 86400000), now), { key: 'd', n: 3 });
  assert.deepEqual(L.agoOf(new Date(+now + 60000), now), { key: 'now', n: 0 });       // a clock a little ahead
});
