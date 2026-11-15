// Unit tests for kioskprefs.js, kioskprefsui.js (readKioskFields), userrights.js and the screen saver "floors" of kiosk.js: a wall tablet's own
// values, its Fully Kiosk, switching per kind of device (5.13.0; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const P = await import(`${dir}/kioskprefs.js`);
const K = await import(`${dir}/kiosk.js`);
const F = await import(`${dir}/kioskprefsui.js`);
const R = await import(`${dir}/userrights.js`);
const min = 60000;

test('a tablet\'s own values lie over the general ones; junk is dropped', () => {
  const general = { saver: 'orbit', saverAfter: 5, dimLevel: 0.7, cleanBtn: true, wakeEntity: '' };
  const p = P.kioskFor(general, { saverAfter: 2, dimLevel: 0.9, cleanBtn: false, wakeEntity: 'binary_sensor.kueche_bewegung', saver: 'black', bogus: 1 });
  assert.equal(p.saverAfter, 2); assert.equal(p.dimLevel, 0.9); assert.equal(p.cleanBtn, false); assert.equal(p.wakeEntity, 'binary_sensor.kueche_bewegung');
  assert.equal(p.saver, 'orbit');                        // the screen saver itself is a preset (viewprefs.js), not one of these
  assert.equal(P.kioskFor(general, null), general);      // nothing own: the same object
  assert.deepEqual(P.cleanKiosk({ saverSpeed: 'warp', reloadAt: '25:00', wakeEntity: 'light.x', dimLevel: 2, fullyScreen: 'switch.tab_screen', brightNight: 0 }),
    { fullyScreen: 'switch.tab_screen', brightNight: 0 });
  assert.deepEqual(P.cleanKiosk({ reloadAt: '' }), { reloadAt: '' });   // "off" for this tablet, even when the general setting reloads
  assert.deepEqual(P.cleanUserKiosk({ tab: { saverAfter: 3 }, empty: { junk: 1 }, '': { saverAfter: 3 } }), { tab: { saverAfter: 3 } });
  assert.deepEqual(P.collectUserKiosk([{ user: ' wand ', kiosk: { cleanSecs: 60 } }, { user: '', kiosk: { cleanSecs: 60 } }]), { wand: { cleanSecs: 60 } });
});

test('Fully Kiosk: bright by day, dim while dimmed, off only with a screen switch and when wanted', () => {
  const base = { fullyBright: 'number.tab_screen_brightness' };
  assert.equal(P.screenWant(base, { saver: null, dim: false }), 'day');
  assert.equal(P.screenWant(base, { saver: null, dim: true }), 'night');
  assert.equal(P.screenWant({ ...base, screenOff: true }, { saver: 'clock', dim: false }), 'day');   // no screen switch: never off
  assert.equal(P.screenWant({ fullyScreen: 'switch.tab_screen', screenOff: true }, { saver: 'clock', dim: false }), 'off');
  assert.equal(P.screenWant({}, { saver: 'clock', dim: true }), null);
});

test('the screen saver "floors" goes through every floor that is not a roof and counts as a screen saver', () => {
  const list = K.saverFloors([{ kind: 'floor' }, { kind: 'floor' }, { kind: 'roof' }, {}]);
  assert.deepEqual(list, [0, 1, 3]);
  assert.equal(K.nextSaverFloor(list, 0), 1);
  assert.equal(K.nextSaverFloor(list, 3), 0);
  assert.equal(K.nextSaverFloor(list, 2), 0);            // on the roof: the first floor
  assert.equal(K.nextSaverFloor([], 0), null);
  assert.ok(K.SAVERS.includes('floors'));
  assert.equal(K.kioskDecision({ live: true, idleReturn: 0, idleMs: 6 * min, home: true, night: false, saver: 'floors', saverAfter: 5 }).saverStart, true);
});

test('the fold of a user reads its fields: "as for all" is left out, numbers and yes / no are values', () => {
  const got = F.readKioskFields([{ key: 'saverAfter', value: '10' }, { key: 'saverSpeed', value: '' }, { key: 'dimLevel', value: '0.85' },
    { key: 'dimClock', value: 'false' }, { key: 'reloadAt', value: 'off' }, { key: 'wakeEntity', value: ' binary_sensor.flur ' }, { key: 'junk', value: 'x' }]);
  assert.deepEqual(got, { saverAfter: 10, dimLevel: 0.85, dimClock: false, wakeEntity: 'binary_sensor.flur', reloadAt: '' });
  assert.deepEqual(F.readRightFields([{ key: 'light', value: 'onoff' }, { key: 'gate', value: 'onoff' }, { key: 'cover', value: '' }, { key: 'scene', value: 'view' }]),
    { light: 'onoff', scene: 'view' });                  // a gate has no "only on / off"
});

test('rights per kind of device: only look, only on / off, everything', () => {
  const r = { light: 'onoff', cover: 'view', climate: 'onoff', gate: 'view' };
  assert.equal(R.rightAllows(r, 'light', 'toggle', undefined), true);
  assert.equal(R.rightAllows(r, 'light', 'turn_on', { brightness_pct: 40 }), false);
  assert.equal(R.rightAllows(r, 'cover', 'open_cover', {}), false);
  assert.equal(R.rightAllows(r, 'cover', 'open_cover', {}, 'garage'), false);   // the garage is a gate: only look too
  assert.equal(R.rightAllows({ cover: 'view' }, 'cover', 'open_cover', {}, 'garage'), true);
  assert.equal(R.rightAllows(r, 'climate', 'set_temperature', { temperature: 21 }), false);
  assert.equal(R.rightAllows(r, 'climate', 'set_hvac_mode', { hvac_mode: 'off' }), true);
  assert.equal(R.rightAllows(r, 'lock', 'unlock', {}), false);
  assert.equal(R.rightAllows(r, 'switch', 'toggle', {}), true);                  // not set: everything
  assert.equal(R.rightAllows(r, 'calendar', 'create_event', { summary: 'x' }), true);   // not a kind of device
  assert.equal(R.rightKind('media_player'), 'media');
  assert.equal(R.rightKind('cover', 'gate'), 'gate');
  assert.deepEqual(R.cleanUserRights({ tab: { light: 'view', gate: 'onoff', junk: 'view', cover: 'all' }, none: { light: 'all' } }), { tab: { light: 'view' } });
  assert.equal(R.rightsCss({ light: 'onoff' }).includes('.lightctl'), true);
  assert.equal(R.rightsCss({ cover: 'view' }), '');
});
